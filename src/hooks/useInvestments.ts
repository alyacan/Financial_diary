"use client";

import { useEffect, useState } from "react";
import { Transaction, GOLD_SUBTYPES } from "@/lib/types";
import { addTransaction, deleteTransaction, loadTransactions, clearPortfolioSnapshots } from "@/lib/storage";
import { fetchLivePrices, getManualPrice, setManualPrice, getFundMetadata, setFundMetadata, FundMetadata } from "@/lib/prices";
import { calculatePositions, calculateTransactionProfits, priceKey, PriceMap } from "@/lib/calculations";

// Ons altından otomatik çekilen "gram" dışındaki fiziki altın türleri: kuyumcu primi/likidite
// farkı içerdiği için canlı veri yerine manuel giriş kullanılır.
export const MANUAL_GOLD_SUBTYPES = GOLD_SUBTYPES.filter((g) => g.id !== "gram");

export interface FundCategoryBreakdown {
  category: string;
  totalInvested: number;
}

export function useInvestments() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [prices, setPrices] = useState<PriceMap>({});
  const [manualGoldInputs, setManualGoldInputs] = useState<Record<string, string>>(() => {
    const initialGold: Record<string, string> = {};
    for (const g of MANUAL_GOLD_SUBTYPES) {
      const saved = getManualPrice(priceKey("gold", g.id));
      if (saved) initialGold[g.id] = saved.toString();
    }
    return initialGold;
  });
  const [manualFundInputs, setManualFundInputs] = useState<Record<string, string>>(() => {
    const loaded = loadTransactions();
    const initialFund: Record<string, string> = {};
    for (const code of new Set(loaded.filter((t) => t.assetType === "fund").map((t) => t.subType))) {
      const saved = getManualPrice(priceKey("fund", code));
      if (saved) initialFund[code] = saved.toString();
    }
    return initialFund;
  });
  const [manualFundReturnInputs, setManualFundReturnInputs] = useState<Record<string, string>>(() => {
    const loaded = loadTransactions();
    const initialFundReturn: Record<string, string> = {};
    for (const code of new Set(loaded.filter((t) => t.assetType === "fund").map((t) => t.subType))) {
      const meta = getFundMetadata(code);
      if (meta.annualReturnPercent !== undefined) initialFundReturn[code] = meta.annualReturnPercent.toString();
    }
    return initialFundReturn;
  });
  const [manualFundRiskInputs, setManualFundRiskInputs] = useState<Record<string, string>>(() => {
    const loaded = loadTransactions();
    const initialFundRisk: Record<string, string> = {};
    for (const code of new Set(loaded.filter((t) => t.assetType === "fund").map((t) => t.subType))) {
      const meta = getFundMetadata(code);
      if (meta.riskLevel !== undefined) initialFundRisk[code] = meta.riskLevel.toString();
    }
    return initialFundRisk;
  });
  const [fundMetadata, setFundMetadataState] = useState<Record<string, FundMetadata>>(() => {
    const loaded = loadTransactions();
    const initialFundMetadata: Record<string, FundMetadata> = {};
    for (const code of new Set(loaded.filter((t) => t.assetType === "fund").map((t) => t.subType))) {
      initialFundMetadata[code] = getFundMetadata(code);
    }
    return initialFundMetadata;
  });
  const [loadingPrices, setLoadingPrices] = useState(false);

  function manualPrices(txs: Transaction[]): PriceMap {
    const result: PriceMap = {};
    for (const g of MANUAL_GOLD_SUBTYPES) {
      result[priceKey("gold", g.id)] = getManualPrice(priceKey("gold", g.id));
    }
    for (const code of new Set(txs.filter((t) => t.assetType === "fund").map((t) => t.subType))) {
      result[priceKey("fund", code)] = getManualPrice(priceKey("fund", code));
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
  }, [transactions.length]);

  function handleAdd(t: Transaction) {
    setTransactions(addTransaction(t));
  }

  function handleDelete(id: string) {
    setTransactions(deleteTransaction(id));
    clearPortfolioSnapshots();
  }

  function handleManualGoldSave(subTypeId: string) {
    const value = parseFloat(manualGoldInputs[subTypeId] ?? "");
    if (!value) return;
    setManualPrice(priceKey("gold", subTypeId), value);
    setPrices((prev) => ({ ...prev, [priceKey("gold", subTypeId)]: value }));
  }

  function handleManualFundSave(fundCode: string) {
    const value = parseFloat(manualFundInputs[fundCode] ?? "");
    if (!value) return;
    setManualPrice(priceKey("fund", fundCode), value);
    setPrices((prev) => ({ ...prev, [priceKey("fund", fundCode)]: value }));
  }

  function handleManualFundMetadataSave(fundCode: string) {
    const returnRaw = manualFundReturnInputs[fundCode] ?? "";
    const riskRaw = manualFundRiskInputs[fundCode] ?? "";
    const metadata: FundMetadata = {
      annualReturnPercent: returnRaw !== "" ? parseFloat(returnRaw) : undefined,
      riskLevel: riskRaw !== "" ? parseInt(riskRaw, 10) : undefined,
    };
    setFundMetadata(fundCode, metadata);
    setFundMetadataState((prev) => ({ ...prev, [fundCode]: metadata }));
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
  };
}
