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
        <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Yeni Bütçe Hedefi Belirle
        </h4>
        <div className="flex flex-wrap gap-2.5">
          {EXPENSE_CATEGORIES.filter((c) => !budgetedCategories.has(c)).map((category) => {
            const imgSrc = CATEGORY_CAT_IMAGES[category];
            return (
              <div
                key={category}
                className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white p-2 text-xs shadow-2xs dark:border-zinc-800 dark:bg-zinc-900"
              >
                {imgSrc ? (
                  <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg">
                    <Image src={imgSrc} alt={category} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-xs dark:bg-zinc-800">
                    📂
                  </div>
                )}
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{category}</span>
                <input
                  type="number"
                  step="any"
                  placeholder="Hedef (TL)"
                  value={inputs[category] ?? ""}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [category]: e.target.value }))}
                  className="w-24 rounded-lg border border-zinc-300 bg-zinc-50 p-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
                />
                <button
                  onClick={() => handleSave(category)}
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black"
                >
                  Ekle
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Budget Cards */}
      {budgets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
          Henüz bir kategori için aylık bütçe hedefi koymadın. Yukarıdaki listeden dilediğin kategoriye bütçe limiti belirleyebilirsin.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {imgSrc ? (
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 shadow-2xs dark:border-zinc-700">
                          <Image src={imgSrc} alt={b.category} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-lg dark:bg-zinc-800">
                          📂
                        </div>
                      )}
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{b.category}</h3>
                    </div>

                    <button
                      onClick={() => onDelete(b.category)}
                      className="text-xs text-zinc-400 hover:text-red-600"
                    >
                      Kaldır
                    </button>
                  </div>

                  {/* Progress Stats Summary */}
                  <div className="mb-2 flex items-baseline justify-between text-xs">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                      {formatTRY(spent)}
                    </span>
                    <span className="text-zinc-500">
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
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1 text-[11px]">
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
