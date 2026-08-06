"use client";

import { useState } from "react";
import TransactionForm from "@/components/TransactionForm";
import PortfolioChart from "@/components/PortfolioChart";
import TransactionTable from "@/components/TransactionTable";
import { useInvestments } from "@/hooks/useInvestments";
import { ASSET_LABELS, CRYPTO_OPTIONS, FOREX_OPTIONS, tefasUrl } from "@/lib/types";
import { priceKey } from "@/lib/calculations";

function formatTRY(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

type TabType = "overview" | "prices" | "add" | "transactions";

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: "overview", label: "Genel Bakış", icon: "📊" },
  { id: "prices", label: "Canlı Fiyatlar & Giriş", icon: "⚡" },
  { id: "add", label: "İşlem Ekle", icon: "➕" },
  { id: "transactions", label: "İşlemlerim", icon: "📋" },
];

export default function YatirimlarPage() {
  const {
    prices,
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
  } = useInvestments();

  const [activeTab, setActiveTab] = useState<TabType>("overview");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6 sm:p-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">Yatırımlarım</h1>
          <p className="mt-1 text-sm text-zinc-500">İşlem takibi, otomatik kâr/zarar ve varlık dağılım analizi</p>
        </div>
        <button
          onClick={refreshPrices}
          disabled={loadingPrices}
          className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <span>{loadingPrices ? "⌛" : "🔄"}</span>
          <span>{loadingPrices ? "Fiyatlar Güncelleniyor..." : "Canlı Fiyatları Yenile"}</span>
        </button>
      </header>

      {/* Missing Prices Notification Banner */}
      {missingPricePositions.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-4 text-xs text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
          ⚠️ <strong>Eksik Fiyat Uyarısı:</strong> Şu varlıklar için henüz güncel fiyat girilmedi:{" "}
          {missingPricePositions.map((p) => `${ASSET_LABELS[p.assetType] ?? p.assetType} (${p.subType})`).join(", ")}.
          &ldquo;Canlı Fiyatlar & Giriş&rdquo; sekmesinden güncel fiyatlarını girebilirsin.
        </div>
      )}

      {/* Top KPI Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Toplam Yatırım Maliyeti</div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {formatTRY(totalInvested)}
          </div>
          <div className="mt-1 text-xs text-zinc-400">{positions.length} farklı varlık pozisyonu</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Portföy Güncel Değeri</div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {formatTRY(totalValue)}
          </div>
          <div className="mt-1 text-xs text-zinc-400">Canlı kurlar ile güncellenmiş</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Toplam Kâr / Zarar</div>
          <div className={`mt-1.5 text-2xl font-bold tracking-tight ${totalProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {totalProfit >= 0 ? "+" : ""}{formatTRY(totalProfit)}
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            {totalInvested > 0 ? `%${((totalProfit / totalInvested) * 100).toFixed(2)} getiri oranı` : "Hesaplanıyor"}
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <nav className="flex flex-wrap gap-1.5 border-b border-zinc-200 pb-2 dark:border-zinc-800" aria-label="Yatırım sekmeleri">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-black"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === "transactions" && rows.length > 0 && (
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                    isActive ? "bg-zinc-700 text-zinc-100 dark:bg-zinc-300 dark:text-zinc-900" : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {rows.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <section className="flex flex-col gap-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">Portföy Varlık Dağılımı</h2>
            <PortfolioChart positions={positions} />
          </div>

          {fundCategoryBreakdown.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
              <h2 className="mb-1 text-lg font-semibold tracking-tight">Fon Dağılımı (Kategoriye Göre)</h2>
              <p className="mb-4 text-xs text-zinc-500">
                Yatırılan toplam tutara göre TEFAS ve yatırım fonlarının kategori kırılımı.
              </p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {fundCategoryBreakdown.map((f) => {
                  const percent = totalFundInvested > 0 ? (f.totalInvested / totalFundInvested) * 100 : 0;
                  return (
                    <div key={f.category} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/40">
                      <span className="text-sm font-medium">{f.category}</span>
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {formatTRY(f.totalInvested)} (%{percent.toFixed(1)})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Live Prices & Manual Price Entry */}
      {activeTab === "prices" && (
        <section className="flex flex-col gap-6">
          {/* Live Market Tickers Bar */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
            <h2 className="mb-3 text-lg font-semibold tracking-tight">Canlı Piyasa Fiyatları & Endeksler</h2>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-2.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                <span className="font-medium text-amber-900 dark:text-amber-200">Gram Altın: </span>
                <strong className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {formatTRY(prices[priceKey("gold", "gram")] ?? 0)}
                </strong>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 dark:border-slate-800 dark:bg-slate-900/40">
                <span className="font-medium text-slate-800 dark:text-slate-200">Gram Gümüş: </span>
                <strong className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {formatTRY(prices[priceKey("silver", "gram")] ?? 0)}
                </strong>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <span className="font-medium text-emerald-900 dark:text-emerald-200">BIST 100 Endeksi: </span>
                <strong className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {(prices["bist_100"] ?? 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} puan
                </strong>
              </div>
              {CRYPTO_OPTIONS.map((c) => (
                <div key={c.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="text-zinc-500">{c.label}: </span>
                  <strong className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {formatTRY(prices[priceKey("crypto", c.id)] ?? 0)}
                  </strong>
                </div>
              ))}
              {FOREX_OPTIONS.map((c) => (
                <div key={c.code} className="rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="text-zinc-500">{c.label}: </span>
                  <strong className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {formatTRY(prices[priceKey("forex", c.code)] ?? 0)}
                  </strong>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-zinc-400">
              * Gram altın ve gümüş fiyatları uluslararası ons vadeli işlem fiyatından hesaplanan referanstır. BIST 100 canlı piyasa verisidir.
            </p>
          </div>

          {/* TEFAS Manual Fund Entry */}
          {distinctFundCodes.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
              <h3 className="mb-1 text-base font-semibold tracking-tight">TEFAS Fon Fiyatı & Risk Bilgisi Girişi</h3>
              <p className="mb-4 text-xs text-zinc-500">
                TEFAS fon fiyatlarını doğrudan TEFAS sayfasından bakıp tek tıkla buraya kaydedebilirsin.
              </p>
              <div className="flex flex-col gap-4">
                {distinctFundCodes.map((code) => {
                  const meta = fundMetadata[code] ?? {};
                  return (
                    <div key={code} className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
                        <a
                          href={tefasUrl(code)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
                        >
                          {code} TEFAS Sayfası ↗
                        </a>
                        {(meta.annualReturnPercent !== undefined || meta.riskLevel !== undefined) && (
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {meta.annualReturnPercent !== undefined && `Yıllık Getiri: %${meta.annualReturnPercent}`}
                            {meta.annualReturnPercent !== undefined && meta.riskLevel !== undefined && " · "}
                            {meta.riskLevel !== undefined && `Risk: ${meta.riskLevel}/7`}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <label className="flex flex-col gap-1 text-xs text-zinc-500">
                          Güncel Fiyat (TL)
                          <div className="flex gap-2">
                            <input
                              type="number"
                              step="any"
                              value={manualFundInputs[code] ?? ""}
                              onChange={(e) => setManualFundInputs((prev) => ({ ...prev, [code]: e.target.value }))}
                              className="w-full rounded-xl border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                            />
                            <button
                              onClick={() => handleManualFundSave(code)}
                              className="shrink-0 rounded-xl bg-zinc-900 px-3 py-2 text-xs text-white dark:bg-zinc-100 dark:text-black"
                            >
                              Kaydet
                            </button>
                          </div>
                        </label>

                        <label className="flex flex-col gap-1 text-xs text-zinc-500">
                          Yıllık Getiri (%)
                          <input
                            type="number"
                            step="any"
                            value={manualFundReturnInputs[code] ?? ""}
                            onChange={(e) => setManualFundReturnInputs((prev) => ({ ...prev, [code]: e.target.value }))}
                            className="rounded-xl border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                          />
                        </label>

                        <label className="flex flex-col gap-1 text-xs text-zinc-500">
                          Risk Seviyesi (1-7)
                          <div className="flex gap-2">
                            <select
                              value={manualFundRiskInputs[code] ?? ""}
                              onChange={(e) => setManualFundRiskInputs((prev) => ({ ...prev, [code]: e.target.value }))}
                              className="w-full rounded-xl border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                            >
                              <option value="">—</option>
                              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleManualFundMetadataSave(code)}
                              className="shrink-0 rounded-xl bg-zinc-900 px-3 py-2 text-xs text-white dark:bg-zinc-100 dark:text-black"
                            >
                              Kaydet
                            </button>
                          </div>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Tab 3: Add Transaction Form */}
      {activeTab === "add" && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Yeni Varlık İşlemi Ekle</h2>
          <TransactionForm onAdd={handleAdd} />
        </section>
      )}

      {/* Tab 4: Transactions Table */}
      {activeTab === "transactions" && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <h2 className="mb-1 text-lg font-semibold tracking-tight">İşlemlerim & Pozisyonlar</h2>
          <p className="mb-4 text-xs text-zinc-500">
            Kayıtlı yatırımlarınızı inceleyebilir, kâr/zarar oranlarınızı görebilir ve silme işlemi yapabilirsiniz.
          </p>
          <TransactionTable rows={rows} onDelete={handleDelete} />
        </section>
      )}
    </div>
  );
}
