"use client";

import { useState } from "react";
import Image from "next/image";
import { EXPENSE_CATEGORIES, CategoryBudget } from "@/lib/types";
import { BudgetProgress } from "@/lib/budgetStats";

function formatTRY(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

// Exact category image mapping - setting categories strictly step-by-step
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

  function handleSave(category: string) {
    const value = parseFloat(inputs[category] ?? "");
    if (!value || value <= 0) return;
    onSave(category, value);
    setInputs((prev) => ({ ...prev, [category]: "" }));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Category Budget Target Selector */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Yeni Bütçe Hedefi Belirle
        </h4>
        <div className="flex flex-wrap gap-3">
          {EXPENSE_CATEGORIES.filter((c) => !budgetedCategories.has(c)).map((category) => {
            const imgSrc = CATEGORY_CAT_IMAGES[category];
            return (
              <div
                key={category}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-2.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900"
              >
                {imgSrc ? (
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <Image src={imgSrc} alt={category} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-sm dark:bg-zinc-800">
                    📂
                  </div>
                )}
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm">{category}</span>
                <input
                  type="number"
                  step="any"
                  placeholder="Hedef (TL)"
                  value={inputs[category] ?? ""}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [category]: e.target.value }))}
                  className="w-24 rounded-xl border border-zinc-300 bg-zinc-50 p-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
                />
                <button
                  onClick={() => handleSave(category)}
                  className="rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black"
                >
                  Ekle
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Budget Cards with Enlarged Featured Cat Photos */}
      {budgets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
          Henüz bir kategori için aylık bütçe hedefi koymadın. Yukarıdaki listeden dilediğin kategoriye bütçe limiti belirleyebilirsin.
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
                className="group relative flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs transition-all hover:shadow-md sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                {/* Large Featured Cat Image Container */}
                {imgSrc ? (
                  <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl border border-zinc-200 shadow-2xs sm:h-32 sm:w-32 dark:border-zinc-700">
                    <Image src={imgSrc} alt={b.category} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                ) : (
                  <div className="flex h-36 w-full shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-3xl sm:h-32 sm:w-32 dark:bg-zinc-800">
                    📂
                  </div>
                )}

                {/* Right Side Compact Stats & Progress Bar */}
                <div className="flex flex-1 flex-col justify-between gap-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{b.category}</h3>
                    <button
                      onClick={() => onDelete(b.category)}
                      className="text-xs text-zinc-400 hover:text-red-600"
                    >
                      Kaldır
                    </button>
                  </div>

                  {/* Progress Stats Summary */}
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                      {formatTRY(spent)}
                    </span>
                    <span className="text-zinc-500 text-xs">
                      Hedef: <strong>{formatTRY(b.monthlyGoal)}</strong>
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all ${
                        over ? "bg-red-500" : percent > 85 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {/* Stat Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                    <span
                      className={`font-semibold ${
                        over ? "text-red-600 dark:text-red-400" : percent > 85 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {over
                        ? `⚠️ Hedef %${(p!.percentUsed - 100).toFixed(0)} aşıldı!`
                        : `%${p ? p.percentUsed.toFixed(0) : 0} kullanıldı (Kalan: ${formatTRY(remaining)})`}
                    </span>

                    {p && p.lastMonthTotal > 0 && (
                      <span className={`font-medium ${delta > 0 ? "text-red-500" : delta < 0 ? "text-emerald-600" : "text-zinc-400"}`}>
                        Geçen döneme göre {delta > 0 ? "+" : ""}{formatTRY(delta)}
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
