"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import Image from "next/image";
import { EXPENSE_CATEGORIES, CategoryBudget } from "@/lib/types";
import { BudgetProgress } from "@/lib/budgetStats";

function formatTRY(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

const CATEGORY_CAT_IMAGES: Record<string, string> = {
  Eğitim: "/cats/egitim.jpg",
  Ulaşım: "/cats/ulasim.jpg",
  Spor: "/cats/spor.jpg",
  Market: "/cats/market.jpg",
  Yemek: "/cats/yemek.jpg",
  Restoran: "/cats/yemek.jpg",
  Sağlık: "/cats/saglik.jpg",
};

interface Props {
  budgets: CategoryBudget[];
  progress: BudgetProgress[];
  onSave: (category: string, monthlyGoal: number) => void;
  onDelete: (category: string) => void;
}

export default function BudgetGoals({ budgets, progress, onSave, onDelete }: Props) {
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const progressByCategory = new Map(progress.map((p) => [p.category, p]));
  const budgetedCategories = new Set(budgets.map((b) => b.category));
  const availableCategories = EXPENSE_CATEGORIES.filter((c) => !budgetedCategories.has(c));

  function handleSave(category: string) {
    const value = parseFloat(inputs[category] ?? "");
    if (!value || value <= 0) return;
    onSave(category, value);
    setInputs((prev) => ({ ...prev, [category]: "" }));
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Target Setting Section */}
      <div
        className="rounded-[22px] p-6 sm:p-7 transition-all shadow-2xs"
        style={{
          background: "var(--shell-card-solid)",
          border: "1px solid var(--shell-border)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b" style={{ borderColor: "var(--shell-border)" }}>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Kategori Bazlı Harcama Hedefi Tanımla
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Limit belirlemek istediğiniz kategorinin yanına aylık hedef harcama limitinizi girin.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "oklch(0.5 0.02 50 / 0.1)", color: "var(--shell-muted)" }}>
            {budgets.length} / {EXPENSE_CATEGORIES.length} Kategori Tanımlı
          </span>
        </div>

        {availableCategories.length === 0 ? (
          <div className="flex items-center gap-2 text-xs font-semibold py-2" style={{ color: "var(--shell-positive)" }}>
            Tüm kategoriler için aylık bütçe hedefi başarıyla tanımlandı.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableCategories.map((category) => {
              const imgSrc = CATEGORY_CAT_IMAGES[category];
              return (
                <div
                  key={category}
                  className="flex items-center gap-3.5 rounded-2xl p-3 transition-all hover:shadow-2xs"
                  style={{
                    background: "var(--shell-card)",
                    border: "1px solid var(--shell-border)",
                  }}
                >
                  {imgSrc ? (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs">
                      <Image src={imgSrc} alt={category} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-500">
                      {category.substring(0, 2)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{category}</div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          step="any"
                          placeholder="Hedef TRY"
                          value={inputs[category] ?? ""}
                          onChange={(e) => setInputs((prev) => ({ ...prev, [category]: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && handleSave(category)}
                          className="w-full rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none transition-all"
                          style={{
                            background: "var(--shell-card-solid)",
                            border: "1px solid var(--shell-border)",
                            color: "var(--foreground)",
                          }}
                        />
                      </div>
                      <button
                        onClick={() => handleSave(category)}
                        disabled={!inputs[category] || parseFloat(inputs[category]) <= 0}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all disabled:opacity-40 hover:opacity-90 active:scale-95 shrink-0 shadow-2xs"
                        style={{ background: "var(--shell-accent)" }}
                      >
                        Ekle
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Budget Cards Grid */}
      {budgets.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-[22px] border border-dashed p-12 text-center"
          style={{ borderColor: "var(--shell-border)", background: "var(--shell-card)" }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: "oklch(0.5 0.02 50 / 0.08)", color: "var(--shell-muted)" }}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="12" cy="12" r="1" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Henüz aktif bütçe hedefi tanımlanmadı</h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              Yukarıdaki kategorilerden dilediğinize aylık limit belirleyin; hesap dönemi boyunca harcamalarınızı karşılaştırmalı olarak takip edin.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {budgets.map((b) => {
            const p = progressByCategory.get(b.category);
            const percent = p ? Math.min(100, p.percentUsed) : 0;
            const over = p ? p.percentUsed > 100 : false;
            const delta = p?.deltaVsLastMonth ?? 0;
            const imgSrc = CATEGORY_CAT_IMAGES[b.category];
            const spent = p?.thisMonthTotal ?? 0;
            const remaining = Math.max(0, b.monthlyGoal - spent);

            return (
              <div
                key={b.category}
                className="group relative flex flex-col gap-4 rounded-[22px] p-5 shadow-xs transition-all hover:shadow-md sm:flex-row sm:items-center"
                style={{
                  background: "var(--shell-card-solid)",
                  border: "1px solid var(--shell-border)",
                }}
              >
                {imgSrc ? (
                  <div className="relative h-32 w-full sm:w-32 shrink-0 overflow-hidden rounded-2xl border border-zinc-200/70 dark:border-zinc-700/70 shadow-2xs">
                    <Image
                      src={imgSrc}
                      alt={b.category}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex h-32 w-full sm:w-32 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-sm font-bold text-zinc-500 shadow-2xs">
                    {b.category}
                  </div>
                )}

                <div className="flex flex-1 flex-col justify-between gap-3 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                        {b.category}
                      </h4>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          background: over
                            ? "oklch(0.5 0.15 25 / 0.15)"
                            : percent > 85
                            ? "oklch(0.6 0.12 70 / 0.15)"
                            : "oklch(0.5 0.13 145 / 0.15)",
                          color: over
                            ? "oklch(0.5 0.15 25)"
                            : percent > 85
                            ? "oklch(0.6 0.12 70)"
                            : "oklch(0.5 0.13 145)",
                        }}
                      >
                        {over ? "Limit Aşıldı" : `%${p ? p.percentUsed.toFixed(0) : 0}`}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`"${b.category}" bütçe hedefini kaldırmak istediğinize emin misiniz?`)) {
                          onDelete(b.category);
                        }
                      }}
                      className="rounded-lg p-1.5 text-xs text-zinc-400 transition-all hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 opacity-60 group-hover:opacity-100"
                      title="Bütçeyi Kaldır"
                    >
                      <Icon name="x" />
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between text-xs">
                    <div>
                      <span className="text-xs text-zinc-500 font-medium">Harcanan: </span>
                      <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                        {formatTRY(spent)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-zinc-500 font-medium">Hedef: </span>
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                        {formatTRY(b.monthlyGoal)}
                      </span>
                    </div>
                  </div>

                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200/60 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        background: over
                          ? "linear-gradient(90deg, #f43f5e, #be123c)"
                          : percent > 85
                          ? "linear-gradient(90deg, #f59e0b, #ea580c)"
                          : "linear-gradient(90deg, #10b981, #059669)",
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] pt-0.5">
                    <span className="font-semibold" style={{ color: over ? "var(--shell-negative)" : "var(--shell-muted)" }}>
                      {over
                        ? `Hedef ${formatTRY(spent - b.monthlyGoal)} aşıldı`
                        : `Kalan Limit: ${formatTRY(remaining)}`}
                    </span>

                    {p && p.lastMonthTotal > 0 && (
                      <span
                        className="font-medium flex items-center gap-1"
                        style={{
                          color: delta > 0 ? "var(--shell-negative)" : "var(--shell-positive)",
                        }}
                      >
                        <span>{delta > 0 ? "Artış:" : "Azalış:"}</span>
                        <span>{delta > 0 ? "+" : ""}{formatTRY(delta)}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}