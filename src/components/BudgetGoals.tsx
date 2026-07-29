"use client";

import { useState } from "react";
import { EXPENSE_CATEGORIES, CategoryBudget } from "@/lib/types";
import { BudgetProgress } from "@/lib/budgetStats";

function formatTRY(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

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
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {EXPENSE_CATEGORIES.filter((c) => !budgetedCategories.has(c)).map((category) => (
          <div key={category} className="flex items-center gap-2 rounded border border-zinc-200 p-2 text-sm dark:border-zinc-800">
            <span>{category}</span>
            <input
              type="number"
              step="any"
              placeholder="Aylık hedef (TL)"
              value={inputs[category] ?? ""}
              onChange={(e) => setInputs((prev) => ({ ...prev, [category]: e.target.value }))}
              className="w-32 rounded border border-zinc-300 p-1 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              onClick={() => handleSave(category)}
              className="rounded bg-zinc-900 px-3 py-1 text-white dark:bg-zinc-100 dark:text-black"
            >
              Hedef Koy
            </button>
          </div>
        ))}
      </div>

      {budgets.length === 0 ? (
        <p className="text-sm text-zinc-500">Henüz bir kategori için aylık hedef belirlemedin.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {budgets.map((b) => {
            const p = progressByCategory.get(b.category);
            const percent = p ? Math.min(100, p.percentUsed) : 0;
            const over = p ? p.percentUsed > 100 : false;
            const delta = p?.deltaVsLastMonth ?? 0;
            return (
              <li key={b.category} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-medium">{b.category}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500">
                      {formatTRY(p?.thisMonthTotal ?? 0)} / {formatTRY(b.monthlyGoal)}
                    </span>
                    <button onClick={() => onDelete(b.category)} className="text-xs text-zinc-400 hover:text-red-600">
                      Kaldır
                    </button>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${percent}%`,
                      background: over ? "var(--shell-negative)" : "var(--viz-sequential)",
                    }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
                  <span>
                    {over
                      ? `Hedefi %${(p!.percentUsed - 100).toFixed(0)} aştın`
                      : `Hedefin %${p ? p.percentUsed.toFixed(0) : 0}'i kullanıldı`}
                  </span>
                  {p && p.lastMonthTotal > 0 && (
                    <span className={delta > 0 ? "text-red-600" : delta < 0 ? "text-green-600" : ""}>
                      Geçen döneme göre {delta > 0 ? "+" : ""}
                      {formatTRY(delta)}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
