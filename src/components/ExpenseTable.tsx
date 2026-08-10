"use client";

import { useMemo, useState } from "react";
import { EXPENSE_CATEGORIES, Expense, PaymentCard } from "@/lib/types";

function formatTRY(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

interface Props {
  expenses: Expense[];
  cards?: PaymentCard[];
  onDelete?: (id: string) => void;
  onUpdateCategory?: (id: string, category: string) => void;
}

export default function ExpenseTable({ expenses, cards = [], onDelete, onUpdateCategory }: Props) {
  const [selectedCardFilter, setSelectedCardFilter] = useState<string>("all");

  const filteredExpenses = useMemo(() => {
    if (selectedCardFilter === "all") return expenses;
    return expenses.filter((e) => e.cardId === selectedCardFilter);
  }, [expenses, selectedCardFilter]);

  if (expenses.length === 0) {
    return <p className="text-sm text-zinc-500">Henüz harcama eklenmedi.</p>;
  }

  const sorted = [...filteredExpenses].sort((a, b) => b.date.localeCompare(a.date));

  // Helper map for quick card lookup by ID
  const cardMap = new Map(cards.map((c) => [c.id, c]));

  function getCardBadge(cardId?: string) {
    if (!cardId) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          — Varsayılan
        </span>
      );
    }
    const card = cardMap.get(cardId);
    if (!card) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          💳 Kart
        </span>
      );
    }

    const icon = card.cardType === "credit" ? "💳" : card.cardType === "debit" ? "🏦" : "💵";
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 shadow-2xs dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300">
        <span>{icon}</span>
        <span>{card.name}</span>
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Card Filter Bar */}
      {cards.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-2 dark:border-zinc-800 dark:bg-zinc-950/40">
          <span className="px-2 text-xs font-bold text-zinc-600 dark:text-zinc-400">💳 Karta Göre Filtrele:</span>
          <button
            onClick={() => setSelectedCardFilter("all")}
            className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
              selectedCardFilter === "all"
                ? "bg-zinc-900 text-white shadow-2xs dark:bg-zinc-100 dark:text-black"
                : "bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300"
            }`}
          >
            Tüm Kartlar ({expenses.length})
          </button>

          {cards.map((card) => {
            const count = expenses.filter((e) => e.cardId === card.id).length;
            const isSelected = selectedCardFilter === card.id;
            return (
              <button
                key={card.id}
                onClick={() => setSelectedCardFilter(card.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-amber-500 text-white shadow-2xs"
                    : "bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300"
                }`}
              >
                <span>{card.cardType === "credit" ? "💳" : card.cardType === "debit" ? "🏦" : "💵"}</span>
                <span>{card.name}</span>
                <span className="rounded-full bg-black/10 px-1.5 text-[10px]">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Expenses Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
              <th className="p-2.5">Tarih</th>
              <th className="p-2.5">Ödeme Yöntemi / Kart</th>
              <th className="p-2.5">Kategori</th>
              <th className="p-2.5">Tutar</th>
              <th className="hidden p-2.5 sm:table-cell">Not</th>
              {onDelete && <th className="p-2.5"></th>}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-xs text-zinc-500">
                  Seçili karta ait harcama kaydı bulunamadı.
                </td>
              </tr>
            ) : (
              sorted.map((e) => (
                <tr key={e.id} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50/50 dark:border-zinc-900 dark:hover:bg-zinc-900/30">
                  <td className="p-2.5 font-medium whitespace-nowrap text-zinc-900 dark:text-zinc-100">{e.date}</td>
                  <td className="p-2.5 whitespace-nowrap">{getCardBadge(e.cardId)}</td>
                  <td className="p-2.5">
                    {onUpdateCategory ? (
                      <select
                        value={e.category}
                        onChange={(ev) => onUpdateCategory(e.id, ev.target.value)}
                        className="rounded border border-transparent bg-transparent p-1 font-medium hover:border-zinc-300 dark:hover:border-zinc-700"
                      >
                        {EXPENSE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    ) : (
                      e.category
                    )}
                  </td>
                  <td className="p-2.5 font-bold whitespace-nowrap text-zinc-900 dark:text-zinc-100">{formatTRY(e.amount)}</td>
                  <td className="hidden max-w-[200px] truncate p-2.5 text-zinc-500 sm:table-cell" title={e.note}>{e.note}</td>
                  {onDelete && (
                    <td className="p-2.5">
                      <button onClick={() => onDelete(e.id)} className="text-xs font-semibold text-zinc-400 hover:text-red-600">
                        Sil
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
