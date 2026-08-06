"use client";

import { useState } from "react";
import {
  AssetType,
  BALANCE_ONLY_TYPES,
  CRYPTO_OPTIONS,
  FOREX_OPTIONS,
  FUND_CATEGORIES,
  GOLD_SUBTYPES,
  Transaction,
} from "@/lib/types";
import DateSelect from "./DateSelect";

interface Props {
  onAdd: (transaction: Transaction) => void;
}

const BALANCE_LABEL_PLACEHOLDER: Record<string, string> = {
  bank: "Örn: Ziraat Bankası vadesiz hesap",
  time_deposit: "Örn: İş Bankası vadeli hesabı",
  deposit: "Örn: Akbank mevduat",
  cash: "Örn: Elden nakit",
};

export default function TransactionForm({ onAdd }: Props) {
  const [assetType, setAssetType] = useState<AssetType>("gold");
  const [subType, setSubType] = useState<string>(GOLD_SUBTYPES[0].id);
  const [fundCategory, setFundCategory] = useState<string>(FUND_CATEGORIES[0]);
  const [fundCustomName, setFundCustomName] = useState("");
  const [date, setDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const isBalanceOnly = BALANCE_ONLY_TYPES.includes(assetType);

  function handleAssetTypeChange(next: AssetType) {
    setAssetType(next);
    if (next === "gold") setSubType(GOLD_SUBTYPES[0].id);
    else if (next === "silver") setSubType("gram");
    else if (next === "crypto") setSubType(CRYPTO_OPTIONS[0].id);
    else if (next === "forex") setSubType(FOREX_OPTIONS[0].code);
    else if (next === "fund") { setSubType(""); setFundCategory(FUND_CATEGORIES[0]); }
    else if (next === "stock") setSubType("");
    else setSubType("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    if (assetType === "fund" && !subType.trim()) return; // fon kodu zorunlu

    const resolvedFundCategory = fundCategory === "Diğer" ? (fundCustomName || "Diğer") : fundCategory;

    if (isBalanceOnly) {
      if (!amount) return;
      onAdd({
        id: crypto.randomUUID(),
        assetType,
        subType: subType || "Genel",
        date,
        quantity: parseFloat(amount),
        buyPrice: 1,
        note: note || undefined,
      });
      setAmount("");
    } else {
      if (!quantity || !buyPrice) return;
      onAdd({
        id: crypto.randomUUID(),
        assetType,
        subType: assetType === "fund" ? subType.toUpperCase() : subType,
        date,
        quantity: parseFloat(quantity),
        buyPrice: parseFloat(buyPrice),
        fundCode: assetType === "fund" ? subType.toUpperCase() : undefined,
        fundCategory: assetType === "fund" ? resolvedFundCategory : undefined,
        note: note || undefined,
      });
      setQuantity("");
      setBuyPrice("");
    }

    setDate("");
    setNote("");
    setFundCustomName("");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-lg font-semibold">Yeni İşlem Ekle</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          Varlık Türü
          <select
            value={assetType}
            onChange={(e) => handleAssetTypeChange(e.target.value as AssetType)}
            className="rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="gold">Altın</option>
            <option value="silver">Gümüş</option>
            <option value="crypto">Kripto</option>
            <option value="forex">Döviz</option>
            <option value="fund">Fon</option>
            <option value="stock">Hisse</option>
            <option value="bank">Banka</option>
            <option value="deposit">Mevduat</option>
            <option value="cash">Nakit</option>
          </select>
        </label>

        {assetType === "gold" && (
          <label className="flex flex-col gap-1 text-sm">
            Altın Türü
            <select value={subType} onChange={(e) => setSubType(e.target.value)}
              className="rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900">
              {GOLD_SUBTYPES.map((g) => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>
          </label>
        )}

        {assetType === "crypto" && (
          <label className="flex flex-col gap-1 text-sm">
            Kripto Para
            <select value={subType} onChange={(e) => setSubType(e.target.value)}
              className="rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900">
              {CRYPTO_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </label>
        )}

        {assetType === "forex" && (
          <label className="flex flex-col gap-1 text-sm">
            Para Birimi
            <select value={subType} onChange={(e) => setSubType(e.target.value)}
              className="rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900">
              {FOREX_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </label>
        )}

        {assetType === "fund" && (
          <>
            <label className="flex flex-col gap-1 text-sm">
              Fon Kodu (TEFAS)
              <input type="text" value={subType} onChange={(e) => setSubType(e.target.value)} required
                placeholder="Örn: AFA"
                className="rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Fon Kategorisi
              <select value={fundCategory} onChange={(e) => setFundCategory(e.target.value)}
                className="rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900">
                {FUND_CATEGORIES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </label>
            {fundCategory === "Diğer" && (
              <label className="flex flex-col gap-1 text-sm">
                Kategori Adı
                <input type="text" value={fundCustomName} onChange={(e) => setFundCustomName(e.target.value)}
                  placeholder="Kendi kategori adını yaz"
                  className="rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900" />
              </label>
            )}
          </>
        )}

        {assetType === "stock" && (
          <label className="flex flex-col gap-1 text-sm">
            Hisse
            <input type="text" value={subType} onChange={(e) => setSubType(e.target.value)} required
              placeholder="Örn: THYAO"
              className="rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900" />
          </label>
        )}

        {isBalanceOnly && (
          <label className="flex flex-col gap-1 text-sm">
            Hesap / Etiket (opsiyonel)
            <input type="text" value={subType} onChange={(e) => setSubType(e.target.value)}
              placeholder={BALANCE_LABEL_PLACEHOLDER[assetType]}
              className="rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900" />
          </label>
        )}
      </div>

      {isBalanceOnly ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Tarih
            <DateSelect value={date} onChange={setDate} required />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Tutar (TL)
            <input type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required
              className="rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900" />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            Alış Tarihi
            <DateSelect value={date} onChange={setDate} required />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Miktar
            <input type="number" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} required
              className="rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Alış Fiyatı (TL)
            <input type="number" step="any" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} required
              className="rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900" />
          </label>
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Not (finans günlüğü — komisyon vb. eklemek istersen buraya yaz)
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="Örn: ABD-İran gerilimi nedeniyle aldım, 25 TL komisyon ödendi"
          className="rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900" />
      </label>

      <button type="submit" className="mt-2 rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black">
        İşlemi Kaydet
      </button>
    </form>
  );
}
