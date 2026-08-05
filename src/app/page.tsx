"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useInvestments } from "@/hooks/useInvestments";
import { useExpenseData } from "@/hooks/useExpenseData";
import { ASSET_LABELS, PortfolioSnapshot } from "@/lib/types";
import { loadPortfolioSnapshots, recordPortfolioSnapshot } from "@/lib/storage";
import { computeHomeInsight } from "@/lib/homeInsight";
import PortfolioTrendChart from "@/components/PortfolioTrendChart";
import AssetDistributionDonut from "@/components/AssetDistributionDonut";

function formatTRY(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "İyi geceler 👋";
  if (hour < 12) return "Günaydın 👋";
  if (hour < 18) return "İyi günler 👋";
  return "İyi akşamlar 👋";
}

const QUICK_LINKS = [
  {
    href: "/yatirimlar",
    label: "Yatırımlarım & Portföy",
    description: "İşlem ekle, portföyünü ve canlı kâr/zararını gör",
    icon: <path d="M4 19V9M12 19V4M20 19v-7" />,
  },
  {
    href: "/harcamalar",
    label: "Harcamalar & Cüzdan",
    description: "Kartlarım cüzdanı, ekstre yükle ve harcama analizi",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </>
    ),
  },
  {
    href: "/gunluk",
    label: "Finans Günlüğüm 📓",
    description: "Canlı ekonomik takvim ve yatırım kararlarının takvimi",
    icon: (
      <>
        <path d="M4 4h13a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4Z" />
        <line x1="8" y1="9" x2="16" y2="9" />
        <line x1="8" y1="13" x2="14" y2="13" />
      </>
    ),
  },
];

export default function Home() {
  const { positions, totalInvested, totalValue, totalProfit, missingPricePositions } = useInvestments();
  const { expenses, totalExpenses, archivedPeriods } = useExpenseData();
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>(() => loadPortfolioSnapshots());

  useEffect(() => {
    if (totalValue > 0) {
      const handle = requestAnimationFrame(() => {
        setSnapshots(recordPortfolioSnapshot(totalValue));
      });
      return () => cancelAnimationFrame(handle);
    }
  }, [totalValue]);

  const profitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  const pricedPositionCount = positions.filter((p) => p.priceAvailable && p.currentValue > 0).length;
  const lastPeriod = archivedPeriods[archivedPeriods.length - 1];
  const lastPeriodTotal = lastPeriod ? lastPeriod.expenses.reduce((s, e) => s + e.amount, 0) : null;
  const expenseDelta = lastPeriodTotal !== null ? totalExpenses - lastPeriodTotal : null;
  const insight = computeHomeInsight(expenses, archivedPeriods);

  const currentDateFormatted = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-10 p-6 sm:p-10">
      {/* Top Header Bar with Helios Profile Styling */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/80 pb-6 dark:border-zinc-800">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            {greeting()}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Yatırım ve harcama takibi, kartlarım cüzdanı ve AI destekli finansal günlük
          </p>
        </div>

        {/* Profile & Controls Pill Bar */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Finansal Günlük</span>
            <span className="text-[11px] text-zinc-400">{currentDateFormatted}</span>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-1.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <button
              title="Bildirimler"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-xs text-zinc-600 transition-colors hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              🔔
            </button>
            <Link
              href="/gunluk"
              title="Takvim ve Günlük"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-xs text-zinc-600 transition-colors hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              ⚙️
            </Link>
            <div className="flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-1 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-black">
              <span>👤</span>
              <span className="hidden sm:inline">Portföy Hesabı</span>
            </div>
          </div>
        </div>
      </header>

      {missingPricePositions.length > 0 && (
        <div
          className="rounded-2xl border p-3 text-sm"
          style={{ borderColor: "oklch(0.75 0.1 70)", background: "oklch(0.94 0.05 80 / 0.5)", color: "oklch(0.35 0.08 60)" }}
        >
          ⚠️ Şu varlıklar için güncel fiyat girilmedi, toplam hesaplamalara dahil edilmedi:{" "}
          {missingPricePositions.map((p) => `${ASSET_LABELS[p.assetType] ?? p.assetType} (${p.subType})`).join(", ")}.{" "}
          Detaylar için <Link href="/yatirimlar" className="underline">Yatırımlar</Link> sayfasına bak.
        </div>
      )}

      {/* KPI Overview Grid */}
      <section aria-label="genel bakış" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className="flex flex-col justify-between gap-6 rounded-[20px] p-6 shadow-md transition-all hover:shadow-lg"
          style={{
            background: "linear-gradient(150deg, var(--shell-hero-from), var(--shell-hero-to))",
            color: "var(--shell-hero-fg)",
          }}
        >
          <div className="flex items-start justify-between">
            <div className="text-[13px] tracking-wide uppercase font-semibold" style={{ color: "oklch(0.85 0.05 25)" }}>
              Güncel Portföy Değeri
            </div>
            {totalInvested > 0 && (
              <div
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                style={{ background: profitPercent >= 0 ? "var(--shell-positive-bg)" : "oklch(0.4 0.1 25 / 0.3)" }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: profitPercent >= 0 ? "oklch(0.75 0.16 145)" : "oklch(0.7 0.16 25)" }}
                />
                <span
                  className="text-xs font-semibold"
                  style={{ color: profitPercent >= 0 ? "oklch(0.85 0.1 145)" : "oklch(0.85 0.1 25)" }}
                >
                  {profitPercent >= 0 ? "+" : ""}
                  {profitPercent.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div>
            <div className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">{formatTRY(totalValue)}</div>
            <div className="mt-1.5 text-[13px]" style={{ color: "oklch(0.75 0.03 60)" }}>
              {pricedPositionCount} aktif pozisyon
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-[20px] p-6" style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}>
          <div className="text-xs tracking-wide uppercase" style={{ color: "var(--shell-muted)" }}>
            Toplam Yatırım
          </div>
          <div className="text-2xl font-semibold tracking-tight sm:text-3xl">{formatTRY(totalInvested)}</div>
        </div>

        <div
          className="flex flex-col justify-between gap-4 rounded-[20px] p-6"
          style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}
        >
          <div>
            <div className="text-xs tracking-wide uppercase" style={{ color: "var(--shell-muted)" }}>
              Dönemlik Toplam Harcama
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{formatTRY(totalExpenses)}</div>
          </div>
          <div className="border-t pt-2.5 text-xs" style={{ borderColor: "var(--shell-border)", color: "var(--shell-muted)" }}>
            {expenseDelta === null || !lastPeriodTotal
              ? "Kapanmış dönem yok"
              : `Önceki döneme göre %${Math.abs((expenseDelta / lastPeriodTotal) * 100).toFixed(0)} ${
                  expenseDelta > 0 ? "fazla" : expenseDelta < 0 ? "az" : "aynı"
                }`}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-[20px] p-6" style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}>
          <div className="text-xs tracking-wide uppercase" style={{ color: "var(--shell-muted)" }}>
            Toplam Kâr / Zarar
          </div>
          <div
            className="text-2xl font-semibold tracking-tight sm:text-3xl"
            style={{ color: totalProfit >= 0 ? "var(--shell-positive)" : "var(--shell-negative)" }}
          >
            {totalProfit >= 0 ? "+" : ""}
            {formatTRY(totalProfit)}
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section aria-label="grafikler" className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-[20px] p-7 shadow-xs" style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}>
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Portföy Performans Grafiği</div>
              <div className="text-xs text-zinc-400">Zaman serisi portföy büyüme eğrisi</div>
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1 text-[11px] font-semibold dark:bg-zinc-800">
              <span className="rounded-lg bg-white px-2 py-0.5 shadow-2xs dark:bg-zinc-700">CANLI</span>
            </div>
          </div>
          <PortfolioTrendChart snapshots={snapshots} />
        </div>

        <div className="rounded-[20px] p-7 shadow-xs" style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}>
          <div className="mb-4 text-sm font-bold text-zinc-900 dark:text-zinc-100">Varlık Dağılımı</div>
          <AssetDistributionDonut positions={positions} />
        </div>
      </section>

      {/* Quick Access Cards */}
      <section aria-label="hızlı erişim" className="flex flex-col gap-4">
        <div className="text-xs tracking-widest uppercase font-semibold text-zinc-500">
          Hızlı Erişim
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col gap-3.5 rounded-[20px] p-6 shadow-xs transition-all hover:-translate-y-1 hover:shadow-md"
              style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--shell-accent)" strokeWidth={2}>
                {link.icon}
              </svg>
              <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">{link.label}</div>
              <div className="text-[13px] leading-relaxed text-zinc-500">
                {link.description}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* AI Insight Card */}
      {insight && (
        <Link
          href="/harcamalar"
          className="flex items-center justify-between gap-6 rounded-[20px] p-7 shadow-md transition-all hover:brightness-[1.02]"
          style={{
            background: "linear-gradient(120deg, oklch(0.88 0.06 25), oklch(0.82 0.08 20))",
            color: "oklch(0.22 0.02 40)",
          }}
        >
          <div className="flex max-w-[640px] flex-col gap-1.5">
            <div className="text-xs tracking-wide uppercase font-bold" style={{ color: "oklch(0.35 0.05 30)" }}>
              🤖 AI Analiz Özetiniz
            </div>
            <div className="text-[17px] font-bold">{insight.title}</div>
            <div className="text-[13.5px]" style={{ color: "oklch(0.35 0.04 30)" }}>
              {insight.detail}
            </div>
          </div>
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-2xs"
            style={{ background: "oklch(0.99 0.01 70 / 0.6)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="oklch(0.3 0.05 30)" strokeWidth={2}>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </div>
        </Link>
      )}
    </div>
  );
}
