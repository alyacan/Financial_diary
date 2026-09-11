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
import Icon from "@/components/Icon";

interface Props {
  onAdd: (transaction: Transaction) => void;
  onSuccess?: () => void;
}

const BALANCE_LABEL_PLACEHOLDER: Record<string, string> = {
  bank: "Örn: Ziraat Bankası vadesiz hesap",
  time_deposit: "Örn: İş Bankası vadeli hesabı",
  deposit: "Örn: Akbank mevduat hesabı",
  cash: "Örn: Cüzdandaki nakit para",
};

const ASSET_CATEGORIES: { type: AssetType; label: string; icon: string; desc: string }[] = [
  { type: "gold", label: "Altın", icon: "coins", desc: "Gram, Çeyrek, Yarım" },
  { type: "fund", label: "TEFAS Fon", icon: "chart", desc: "Yatırım fonları" },
  { type: "stock", label: "Hisse", icon: "trending-up", desc: "Borsa İstanbul" },
  { type: "crypto", label: "Kripto", icon: "bitcoin", desc: "BTC, ETH, Altcoin" },
  { type: "forex", label: "Döviz", icon: "dollar", desc: "USD, EUR, GBP" },
  { type: "silver", label: "Gümüş", icon: "sparkles", desc: "Kıymetli maden" },
  { type: "bank", label: "Banka / Bakiye", icon: "book", desc: "Nakit varlıklar" },
];

function formatTRY(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

export default function TransactionForm({ onAdd, onSuccess }: Props) {
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
    if (assetType === "fund" && !subType.trim()) return;

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
    if (onSuccess) onSuccess();
  }

  const inputStyle = {
    background: "var(--shell-card)",
    border: "1px solid var(--shell-border)",
    color: "var(--foreground)",
  };

  const calculatedTotal = !isBalanceOnly && quantity && buyPrice
    ? parseFloat(quantity) * parseFloat(buyPrice)
    : null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">
      
      {/* 1. ADIM: GÖRSEL VARLIK KATEGORİ SEÇİMİ */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          1. Varlık Kategorisi Seçin
        </label>
        
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
          {ASSET_CATEGORIES.map((cat) => {
            const isSelected = assetType === cat.type;
            return (
              <button
                key={cat.type}
                type="button"
                onClick={() => handleAssetTypeChange(cat.type)}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-center transition-all cursor-pointer hover:opacity-90 active:scale-98"
                style={{
                  background: isSelected ? "var(--shell-card)" : "var(--shell-card-solid)",
                  border: isSelected ? "2px solid var(--shell-accent)" : "1px solid var(--shell-border)",
                  boxShadow: isSelected ? "0 4px 14px -2px rgba(0,0,0,0.15)" : "none",
                }}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl transition-all"
                  style={{
                    background: isSelected ? "var(--shell-accent)" : "var(--shell-card)",
                    color: isSelected ? "#ffffff" : "var(--foreground)",
                    border: isSelected ? "none" : "1px solid var(--shell-border)",
                  }}
                >
                  <Icon name={cat.icon} className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold" style={{ color: isSelected ? "var(--shell-accent)" : "var(--foreground)" }}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. ADIM: DİNAMİK ALT TÜR & ENSTRÜMAN DETAYLARI */}
      <div className="flex flex-col gap-4 rounded-2xl p-5 sm:p-6" style={{ background: "var(--shell-card-solid)", border: "1px solid var(--shell-border)" }}>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: "var(--shell-accent)" }}>
            2
          </div>
          <h3 className="text-sm font-bold tracking-tight">Varlık ve Enstrüman Detayı</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {assetType === "gold" && (
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Altın Cinsi / Türü
              </label>
              <select
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                className="w-full rounded-xl p-3.5 text-sm font-semibold outline-none cursor-pointer"
                style={inputStyle}
              >
                {GOLD_SUBTYPES.map((g) => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>
          )}

          {assetType === "crypto" && (
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Kripto Para Birimi
              </label>
              <select
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                className="w-full rounded-xl p-3.5 text-sm font-semibold outline-none cursor-pointer"
                style={inputStyle}
              >
                {CRYPTO_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label} ({c.id.toUpperCase()})</option>
                ))}
              </select>
            </div>
          )}

          {assetType === "forex" && (
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Döviz / Para Birimi
              </label>
              <select
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                className="w-full rounded-xl p-3.5 text-sm font-semibold outline-none cursor-pointer"
                style={inputStyle}
              >
                {FOREX_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>{c.label} ({c.code})</option>
                ))}
              </select>
            </div>
          )}

          {assetType === "fund" && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Fon Kodu (TEFAS)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: AFA, TTE, MAC"
                  value={subType}
                  onChange={(e) => setSubType(e.target.value.toUpperCase())}
                  className="w-full rounded-xl p-3.5 text-sm font-bold font-mono uppercase outline-none"
                  style={inputStyle}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Fon Kategorisi
                </label>
                <select
                  value={fundCategory}
                  onChange={(e) => setFundCategory(e.target.value)}
                  className="w-full rounded-xl p-3.5 text-sm font-semibold outline-none cursor-pointer"
                  style={inputStyle}
                >
                  {FUND_CATEGORIES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              {fundCategory === "Diğer" && (
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Özel Kategori Adı
                  </label>
                  <input
                    type="text"
                    value={fundCustomName}
                    onChange={(e) => setFundCustomName(e.target.value)}
                    placeholder="Kendi kategori adınızı yazın"
                    className="w-full rounded-xl p-3.5 text-sm font-medium outline-none"
                    style={inputStyle}
                  />
                </div>
              )}
            </>
          )}

          {assetType === "stock" && (
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Hisse Kodu (BIST)
              </label>
              <input
                type="text"
                required
                placeholder="Örn: THYAO, EREGL, ASELS"
                value={subType}
                onChange={(e) => setSubType(e.target.value.toUpperCase())}
                className="w-full rounded-xl p-3.5 text-sm font-bold font-mono uppercase outline-none"
                style={inputStyle}
              />
            </div>
          )}

          {isBalanceOnly && (
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Hesap / Bakiye Tanımı (Opsiyonel)
              </label>
              <input
                type="text"
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                placeholder={BALANCE_LABEL_PLACEHOLDER[assetType] || "Örn: Ana Hesap"}
                className="w-full rounded-xl p-3.5 text-sm font-medium outline-none"
                style={inputStyle}
              />
            </div>
          )}
        </div>
      </div>

      {/* 3. ADIM: FİYAT, MİKTAR & TARİH */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: "var(--shell-accent)" }}>
            3
          </div>
          <h3 className="text-sm font-bold tracking-tight">İşlem Miktarı, Fiyat & Tarih</h3>
        </div>

        {isBalanceOnly ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Bakiye Tutarı (TL)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-zinc-400 text-sm">₺</span>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl pl-9 pr-4 py-3.5 text-sm font-bold font-mono outline-none"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Tarih
              </label>
              <DateSelect value={date} onChange={setDate} required />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Alınan Miktar
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="Örn: 10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-xl px-4 py-3.5 text-sm font-bold font-mono outline-none"
                style={inputStyle}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Birim Alış Fiyatı (TL)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-zinc-400 text-sm">₺</span>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className="w-full rounded-xl pl-9 pr-4 py-3.5 text-sm font-bold font-mono outline-none"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Canlı Toplam Tutar Kartı */}
            {calculatedTotal !== null && calculatedTotal > 0 && (
              <div
                className="sm:col-span-2 flex items-center justify-between rounded-xl px-4 py-3 shadow-2xs"
                style={{
                  background: "var(--shell-card)",
                  border: "1px dashed var(--shell-border)",
                }}
              >
                <div className="flex items-center gap-2">
                  <Icon name="sparkles" className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-bold text-zinc-500">Tahmini Toplam Maliyet:</span>
                </div>
                <span className="font-mono text-base font-extrabold" style={{ color: "var(--shell-accent)" }}>
                  {formatTRY(calculatedTotal)}
                </span>
              </div>
            )}

            {/* Tarih Seçimi (Geniş ve Rahat Alan) */}
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                İşlem Tarihi
              </label>
              <DateSelect value={date} onChange={setDate} required />
            </div>
          </div>
        )}

        {/* Not / Açıklama */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Finans Günlüğü Notu (Opsiyonel)
          </label>
          <input
            type="text"
            placeholder="Örn: Maaş birikimi, jeopolitik gerginlik alımı, komisyon: 20 TL..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl p-3.5 text-sm font-medium outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      {/* 4. GÖNDERİM BUTONU */}
      <button
        type="submit"
        className="flex items-center justify-center gap-2.5 rounded-2xl py-4 px-8 text-sm font-bold text-white shadow-md transition-all hover:opacity-95 active:scale-98 cursor-pointer"
        style={{ background: "var(--shell-accent)" }}
      >
        <Icon name="plus" className="h-4 w-4 stroke-[3]" />
        <span>İşlemi Portföye Kaydet</span>
      </button>

    </form>
  );
}
