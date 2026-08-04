"use client";

import { EXPENSE_CATEGORIES, Expense } from "@/lib/types";

function formatTRY(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

interface Props {
  expenses: Expense[];
  onDelete?: (id: string) => void;
  onUpdateCategory?: (id: string, category: string) => void;
}

export default function ExpenseTable({ expenses, onDelete, onUpdateCategory }: Props) {
  if (expenses.length === 0) {
    return <p className="text-sm text-zinc-500">Henüz harcama eklenmedi.</p>;
  }

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[380px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
            <th className="p-2">Tarih</th>
            <th className="p-2">Kategori</th>
            <th className="p-2">Tutar</th>
            <th className="hidden p-2 sm:table-cell">Not</th>
            {onDelete && <th className="p-2"></th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((e) => (
            <tr key={e.id} className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="p-2 whitespace-nowrap">{e.date}</td>
              <td className="p-2">
                {onUpdateCategory ? (
                  <select
                    value={e.category}
                    onChange={(ev) => onUpdateCategory(e.id, ev.target.value)}
                    className="rounded border border-transparent bg-transparent p-1 hover:border-zinc-300 dark:hover:border-zinc-700"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                ) : (
                  e.category
                )}
              </td>
              <td className="p-2 whitespace-nowrap">{formatTRY(e.amount)}</td>
              <td className="hidden max-w-[200px] truncate p-2 sm:table-cell" title={e.note}>{e.note}</td>
              {onDelete && (
                <td className="p-2">
                  <button onClick={() => onDelete(e.id)} className="text-zinc-400 hover:text-red-600">
                    Sil
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
