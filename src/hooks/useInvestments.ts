"use client";

import { useEffect, useState } from "react";
import { Transaction, GOLD_SUBTYPES } from "@/lib/types";
import { addTransaction, deleteTransaction, loadTransactions, clearPortfolioSnapshots } from "@/lib/storage";
import {
  fetchLivePrices,
  loadManualPrices,
  setManualPrice,
  loadFundMetadataMap,
  setFundMetadata,
  FundMetadata,
} from "@/lib/prices";
import { calculatePositions, calculateTransactionProfits, priceKey, PriceMap } from "@/lib/calculations";

// Ons altından otomatik çekilen "gram" dışındaki fiziki altın türleri: kuyumcu primi/likidite
// farkı içerdiği için canlı veri yerine manuel giriş kullanılır.
export const MANUAL_GOLD_SUBTYPES = GOLD_SUBTYPES.filter((g) => g.id !== "gram");

export interface FundCategoryBreakdown {
  category: string;
  totalInvested: number;
}

export function useInvestments() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prices, setPrices] = useState<PriceMap>({});
  const [manualPricesMap, setManualPricesMap] = useState<Record<string, number>>({});
  const [manualGoldInputs, setManualGoldInputs] = useState<Record<string, string>>({});
  const [manualFundInputs, setManualFundInputs] = useState<Record<string, string>>({});
  const [manualFundReturnInputs, setManualFundReturnInputs] = useState<Record<string, string>>({});
  const [manualFundRiskInputs, setManualFundRiskInputs] = useState<Record<string, string>>({});
  const [fundMetadata, setFundMetadataState] = useState<Record<string, FundMetadata>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadTransactions(), loadManualPrices(), loadFundMetadataMap()]).then(
      ([loaded, manualPricesLoaded, fundMetadataLoaded]) => {
        setTransactions(loaded);
        setManualPricesMap(manualPricesLoaded);
        setFundMetadataState(fundMetadataLoaded);

        const initialGold: Record<string, string> = {};
        for (const g of MANUAL_GOLD_SUBTYPES) {
          const saved = manualPricesLoaded[priceKey("gold", g.id)];
          if (saved) initialGold[g.id] = saved.toString();
        }
        setManualGoldInputs(initialGold);

        const initialFund: Record<string, string> = {};
        const initialFundReturn: Record<string, string> = {};
        const initialFundRisk: Record<string, string> = {};
        for (const code of new Set(loaded.filter((t) => t.assetType === "fund").map((t) => t.subType))) {
          const savedPrice = manualPricesLoaded[priceKey("fund", code)];
          if (savedPrice) initialFund[code] = savedPrice.toString();
          const meta = fundMetadataLoaded[code];
          if (meta?.annualReturnPercent !== undefined) initialFundReturn[code] = meta.annualReturnPercent.toString();
          if (meta?.riskLevel !== undefined) initialFundRisk[code] = meta.riskLevel.toString();
        }
        setManualFundInputs(initialFund);
        setManualFundReturnInputs(initialFundReturn);
        setManualFundRiskInputs(initialFundRisk);
      }
    );
  }, []);

  function manualPrices(txs: Transaction[]): PriceMap {
    const result: PriceMap = {};
    for (const g of MANUAL_GOLD_SUBTYPES) {
      result[priceKey("gold", g.id)] = manualPricesMap[priceKey("gold", g.id)] ?? 0;
    }
    for (const code of new Set(txs.filter((t) => t.assetType === "fund").map((t) => t.subType))) {
      result[priceKey("fund", code)] = manualPricesMap[priceKey("fund", code)] ?? 0;
    }
    return result;
  }

  async function refreshPrices() {
    setLoadingPrices(true);
    try {
      const live = await fetchLivePrices();
      setPrices({ ...live, ...manualPrices(transactions) });
    } catch {
      setPrices((prev) => ({ ...prev, ...manualPrices(transactions) }));
    }
    setLoadingPrices(false);
  }

  useEffect(() => {
    let isMounted = true;
    fetchLivePrices()
      .then((live) => {
        if (isMounted) setPrices({ ...live, ...manualPrices(transactions) });
      })
      .catch(() => {
        if (isMounted) setPrices((prev) => ({ ...prev, ...manualPrices(transactions) }));
      });
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length, manualPricesMap]);

  async function handleAdd(t: Transaction) {
    try {
      setTransactions(await addTransaction(t));
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem eklenemedi.");
    }
  }

  async function handleDelete(id: string) {
    try {
      setTransactions(await deleteTransaction(id));
      await clearPortfolioSnapshots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem silinemedi.");
    }
  }

  async function handleManualGoldSave(subTypeId: string) {
    const value = parseFloat(manualGoldInputs[subTypeId] ?? "");
    if (!value) return;
    try {
      await setManualPrice(priceKey("gold", subTypeId), value);
      setManualPricesMap((prev) => ({ ...prev, [priceKey("gold", subTypeId)]: value }));
      setPrices((prev) => ({ ...prev, [priceKey("gold", subTypeId)]: value }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fiyat kaydedilemedi.");
    }
  }

  async function handleManualFundSave(fundCode: string) {
    const value = parseFloat(manualFundInputs[fundCode] ?? "");
    if (!value) return;
    try {
      await setManualPrice(priceKey("fund", fundCode), value);
      setManualPricesMap((prev) => ({ ...prev, [priceKey("fund", fundCode)]: value }));
      setPrices((prev) => ({ ...prev, [priceKey("fund", fundCode)]: value }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fiyat kaydedilemedi.");
    }
  }

  async function handleManualFundMetadataSave(fundCode: string) {
    const returnRaw = manualFundReturnInputs[fundCode] ?? "";
    const riskRaw = manualFundRiskInputs[fundCode] ?? "";
    const metadata: FundMetadata = {
      annualReturnPercent: returnRaw !== "" ? parseFloat(returnRaw) : undefined,
      riskLevel: riskRaw !== "" ? parseInt(riskRaw, 10) : undefined,
    };
    try {
      await setFundMetadata(fundCode, metadata);
      setFundMetadataState((prev) => ({ ...prev, [fundCode]: metadata }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fon bilgisi kaydedilemedi.");
    }
  }

  const positions = calculatePositions(transactions, prices);
  const rows = calculateTransactionProfits(transactions, prices);
  const totalInvested = positions.reduce((sum, p) => sum + p.totalInvested, 0);
  const pricedPositions = positions.filter((p) => p.priceAvailable);
  const totalValue = pricedPositions.reduce((sum, p) => sum + p.currentValue, 0);
  const investedWithPrice = pricedPositions.reduce((sum, p) => sum + p.totalInvested, 0);
  const totalProfit = totalValue - investedWithPrice;
  const missingPricePositions = positions.filter((p) => !p.priceAvailable);

  // Fon Dağılımı: fiyattan bağımsız, kategoriye göre yatırılan tutar (birden fazla farklı
  // fon aynı kategoride olabilir — bu yüzden positions'daki fon-kodu bazlı gruplamayı değil,
  // ham işlemleri kullanır).
  const fundTransactions = transactions.filter((t) => t.assetType === "fund");
  const distinctFundCodes = Array.from(new Set(fundTransactions.map((t) => t.subType)));
  const fundCategoryMap = new Map<string, number>();
  for (const t of fundTransactions) {
    const category = t.fundCategory ?? t.subType;
    fundCategoryMap.set(category, (fundCategoryMap.get(category) ?? 0) + t.quantity * t.buyPrice);
  }
  const fundCategoryBreakdown: FundCategoryBreakdown[] = Array.from(fundCategoryMap.entries()).map(
    ([category, totalInvested]) => ({ category, totalInvested })
  );
  const totalFundInvested = fundCategoryBreakdown.reduce((sum, f) => sum + f.totalInvested, 0);

  return {
    transactions,
    prices,
    manualGoldInputs,
    setManualGoldInputs,
    manualFundInputs,
    setManualFundInputs,
    manualFundReturnInputs,
    setManualFundReturnInputs,
    manualFundRiskInputs,
    setManualFundRiskInputs,
    fundMetadata,
    distinctFundCodes,
    loadingPrices,
    refreshPrices,
    handleAdd,
    handleDelete,
    handleManualGoldSave,
    handleManualFundSave,
    handleManualFundMetadataSave,
    positions,
    rows,
    totalInvested,
    totalValue,
    totalProfit,
    missingPricePositions,
    fundCategoryBreakdown,
    totalFundInvested,
    error,
    clearError: () => setError(null),
  };
}
