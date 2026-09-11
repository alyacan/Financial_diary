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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCardFilter, setSelectedCardFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");

  const cardMap = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  const filteredAndSorted = useMemo(() => {
    let list = [...expenses];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.category.toLowerCase().includes(q) ||
          (e.note && e.note.toLowerCase().includes(q)) ||
          e.amount.toString().includes(q)
      );
    }

    if (selectedCategory !== "all") {
      list = list.filter((e) => e.category === selectedCategory);
    }

    if (selectedCardFilter !== "all") {
      list = list.filter((e) => e.cardId === selectedCardFilter);
    }

    list.sort((a, b) => {
      if (sortBy === "date-desc") return b.date.localeCompare(a.date);
      if (sortBy === "date-asc") return a.date.localeCompare(b.date);
      if (sortBy === "amount-desc") return b.amount - a.amount;
      if (sortBy === "amount-asc") return a.amount - b.amount;
      return 0;
    });

    return list;
  }, [expenses, searchQuery, selectedCategory, selectedCardFilter, sortBy]);

  const totalFilteredAmount = useMemo(
    () => filteredAndSorted.reduce((sum, e) => sum + e.amount, 0),
    [filteredAndSorted]
  );

  function getCardBadge(cardId?: string) {
    const card = cardId ? cardMap.get(cardId) : null;
    const label = card ? card.name : "Nakit / Genel";

    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold tracking-wide"
        style={{
          background: "var(--shell-card)",
          border: "1px solid var(--shell-border)",
          color: "var(--shell-nav-active-fg)",
        }}
      >
        <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="2" y="5" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="2" y1="10" x2="22" y2="10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="truncate max-w-[130px]">{label}</span>
      </span>
    );
  }

  if (expenses.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-14 px-6 text-center"
        style={{ borderColor: "var(--shell-border)", background: "var(--shell-card)" }}
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: "oklch(0.5 0.02 50 / 0.08)", color: "var(--shell-muted)" }}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Henüz harcama kaydı bulunmuyor</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            Yeni harcama eklemek için üstteki &quot;Yeni Harcama Ekle&quot; butonunu kullanabilir veya ekstrenizi yükleyebilirsiniz.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Ergonomic Search & Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2.5 min-w-[260px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Arama yap (tutar, kategori, not)..."
              className="w-full rounded-xl pl-9 pr-8 py-2.5 text-xs font-medium transition-all outline-none"
              style={{
                background: "var(--shell-card)",
                border: "1px solid var(--shell-border)",
                color: "var(--foreground)",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl px-3 py-2.5 text-xs font-semibold outline-none transition-all cursor-pointer"
            style={{
              background: "var(--shell-card)",
              border: "1px solid var(--shell-border)",
              color: "var(--foreground)",
            }}
          >
            <option value="all">Tüm Kategoriler</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Card Filter */}
          {cards.length > 1 && (
            <select
              value={selectedCardFilter}
              onChange={(e) => setSelectedCardFilter(e.target.value)}
              className="rounded-xl px-3 py-2.5 text-xs font-semibold outline-none transition-all cursor-pointer"
              style={{
                background: "var(--shell-card)",
                border: "1px solid var(--shell-border)",
                color: "var(--foreground)",
              }}
            >
              <option value="all">Tüm Kartlar</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Sort & Total Counter */}
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-xl px-3 py-2.5 text-xs font-semibold outline-none transition-all cursor-pointer"
            style={{
              background: "var(--shell-card)",
              border: "1px solid var(--shell-border)",
              color: "var(--foreground)",
            }}
          >
            <option value="date-desc">Tarih (En Yeni)</option>
            <option value="date-asc">Tarih (En Eski)</option>
            <option value="amount-desc">Tutar (Azalan)</option>
            <option value="amount-asc">Tutar (Artan)</option>
          </select>

          <div
            className="rounded-xl px-3.5 py-2.5 text-xs font-bold whitespace-nowrap"
            style={{
              background: "oklch(0.85 0.05 25 / 0.15)",
              color: "var(--shell-accent-strong)",
            }}
          >
            {filteredAndSorted.length} kayıt · {formatTRY(totalFilteredAmount)}
          </div>
        </div>
      </div>

      {/* Spacious Modern Table */}
      <div
        className="overflow-hidden rounded-2xl shadow-2xs"
        style={{
          background: "var(--shell-card-solid)",
          border: "1px solid var(--shell-border)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr
                className="border-b text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                style={{ borderColor: "var(--shell-border)", background: "oklch(0.5 0.02 50 / 0.04)" }}
              >
                <th className="py-4 px-4 font-semibold">Tarih</th>
                <th className="py-4 px-4 font-semibold">Ödeme Yöntemi</th>
                <th className="py-4 px-4 font-semibold">Kategori</th>
                <th className="py-4 px-4 font-semibold">Tutar</th>
                <th className="py-4 px-4 font-semibold">Açıklama</th>
                {onDelete && <th className="py-4 px-4 text-right font-semibold">İşlem</th>}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--shell-border)" }}>
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-zinc-500">
                    Arama kriterine uygun harcama kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((e) => (
                  <tr
                    key={e.id}
                    className="transition-colors hover:bg-zinc-500/5 group"
                  >
                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-xs text-zinc-700 dark:text-zinc-300">
                      {e.date.split("-").reverse().join(".")}
                    </td>

                    {/* Card Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">{getCardBadge(e.cardId)}</td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {onUpdateCategory ? (
                        <select
                          value={e.category}
                          onChange={(ev) => onUpdateCategory(e.id, ev.target.value)}
                          className="rounded-lg px-2.5 py-1 text-xs font-semibold outline-none transition-all cursor-pointer"
                          style={{
                            background: "oklch(0.85 0.05 25 / 0.1)",
                            color: "var(--shell-accent-strong)",
                            border: "1px solid transparent",
                          }}
                        >
                          {EXPENSE_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className="rounded-lg px-2.5 py-1 text-xs font-semibold"
                          style={{
                            background: "oklch(0.85 0.05 25 / 0.1)",
                            color: "var(--shell-accent-strong)",
                          }}
                        >
                          {e.category}
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
                      {formatTRY(e.amount)}
                    </td>

                    {/* Note */}
                    <td className="py-3.5 px-4 max-w-[260px] truncate text-xs text-zinc-500 dark:text-zinc-400" title={e.note}>
                      {e.note || <span className="opacity-40 italic">—</span>}
                    </td>

                    {/* Delete Action */}
                    {onDelete && (
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (confirm("Bu harcamayı silmek istediğinize emin misiniz?")) {
                              onDelete(e.id);
                            }
                          }}
                          className="rounded-lg p-2 text-zinc-400 transition-all hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 opacity-60 group-hover:opacity-100"
                          title="Harcamayı Sil"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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
    </div>
  );
}