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
  if (hour < 6) return "İyi geceler 🌙";
  if (hour < 12) return "Günaydın 👋";
  if (hour < 18) return "İyi günler 👋";
  return "İyi akşamlar 👋";
}

const QUICK_LINKS = [
  {
    href: "/yatirimlar",
    label: "Yatırımlar",
    description: "İşlem ekle, portföyünü ve kâr/zararını gör",
    icon: <path d="M4 19V9M12 19V4M20 19v-7" />,
  },
  {
    href: "/harcamalar",
    label: "Harcamalar",
    description: "Ekstre yükle, kategori bazlı harcamalarını takip et",
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
    description: "Finansal takvim ve yatırım kararlarının gerekçeleri",
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

  // Değer fiyatlar yüklendikten sonra oturur; 0 iken bugünün kaydını yazmayı atla.
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

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-11 p-8 sm:p-12">
      <header>
        <h1 className="font-serif text-[34px] font-medium tracking-tight">{greeting()}</h1>
        <p className="mt-1 text-[15px]" style={{ color: "var(--shell-muted-2)" }}>
          Yatırım ve harcama takibi, AI destekli analiz
        </p>
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

      <section aria-label="genel bakış" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className="flex flex-col justify-between gap-6 rounded-[20px] p-6"
          style={{
            background: "linear-gradient(150deg, var(--shell-hero-from), var(--shell-hero-to))",
            color: "var(--shell-hero-fg)",
            boxShadow: "0 20px 40px -20px oklch(0.2 0.02 40 / 0.5)",
          }}
        >
          <div className="flex items-start justify-between">
            <div className="text-[13px] tracking-wide uppercase" style={{ color: "oklch(0.85 0.05 25)" }}>
              Güncel Değer
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
              {pricedPositionCount} pozisyon
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
              Toplam Harcama
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
            Toplam Kâr/Zarar
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

      <section aria-label="grafikler" className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-[20px] p-7" style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}>
          <div className="mb-4 flex items-baseline justify-between">
            <div className="text-sm font-semibold">Portföy Değeri</div>
            <div className="text-xs" style={{ color: "var(--shell-muted)" }}>
              Bugünden itibaren takip
            </div>
          </div>
          <PortfolioTrendChart snapshots={snapshots} />
        </div>

        <div className="rounded-[20px] p-7" style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}>
          <div className="mb-4 text-sm font-semibold">Portföy Dağılımı</div>
          <AssetDistributionDonut positions={positions} />
        </div>
      </section>

      <section aria-label="hızlı erişim" className="flex flex-col gap-4">
        <div className="text-xs tracking-widest uppercase" style={{ color: "var(--shell-muted)" }}>
          Hızlı Erişim
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col gap-3.5 rounded-[18px] p-6 transition-transform hover:-translate-y-0.5"
              style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--shell-accent)" strokeWidth={2}>
                {link.icon}
              </svg>
              <div className="text-base font-semibold">{link.label}</div>
              <div className="text-[13px] leading-relaxed" style={{ color: "var(--shell-muted)" }}>
                {link.description}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {insight && (
        <Link
          href="/harcamalar"
          className="flex items-center justify-between gap-6 rounded-[20px] p-7 transition-[filter] hover:brightness-[1.02]"
          style={{
            background: "linear-gradient(120deg, oklch(0.88 0.06 25), oklch(0.82 0.08 20))",
            color: "oklch(0.22 0.02 40)",
          }}
        >
          <div className="flex max-w-[640px] flex-col gap-1.5">
            <div className="text-xs tracking-wide uppercase" style={{ color: "oklch(0.35 0.05 30)" }}>
              AI Analiz
            </div>
            <div className="text-[17px] font-semibold">{insight.title}</div>
            <div className="text-[13.5px]" style={{ color: "oklch(0.35 0.04 30)" }}>
              {insight.detail}
            </div>
          </div>
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
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
