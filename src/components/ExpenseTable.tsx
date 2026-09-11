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

  // Helper map for quick card lookup by ID
  const cardMap = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  // Filter and sort expenses
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
    if (!cardId) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400">
          <span>💵</span>
          <span>Genel</span>
        </span>
      );
    }
    const card = cardMap.get(cardId);
    if (!card) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400">
          <span>💳</span>
          <span>Kart</span>
        </span>
      );
    }

    const icon = card.cardType === "credit" ? "💳" : card.cardType === "debit" ? "🏦" : "💵";
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all shadow-2xs"
        style={{
          background: "oklch(0.96 0.02 70 / 0.8)",
          border: "1px solid oklch(0.88 0.03 60 / 0.6)",
          color: "var(--shell-nav-active-fg)",
        }}
      >
        <span>{icon}</span>
        <span className="truncate max-w-[120px]">{card.name}</span>
      </span>
    );
  }

  if (expenses.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 px-4 text-center"
        style={{ borderColor: "var(--shell-border)", background: "var(--shell-card-solid)" }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-2xl">
          🧾
        </div>
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">Henüz harcama kaydı bulunmuyor</p>
          <p className="text-xs text-zinc-500 mt-1">
            "Harcama Ekle / Ekstre" sekmesinden yeni harcama girebilir veya ekstrenizi yükleyebilirsiniz.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <div className="flex flex-1 flex-wrap items-center gap-2.5 min-w-[260px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Harcama veya not ara..."
              className="w-full rounded-xl pl-8 pr-3 py-2 text-xs font-medium transition-all outline-none"
              style={{
                background: "var(--shell-card-solid)",
                border: "1px solid var(--shell-border)",
                color: "var(--foreground)",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl px-3 py-2 text-xs font-semibold outline-none transition-all cursor-pointer"
            style={{
              background: "var(--shell-card-solid)",
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

          {/* Card Filter Dropdown (if multiple cards exist) */}
          {cards.length > 1 && (
            <select
              value={selectedCardFilter}
              onChange={(e) => setSelectedCardFilter(e.target.value)}
              className="rounded-xl px-3 py-2 text-xs font-semibold outline-none transition-all cursor-pointer"
              style={{
                background: "var(--shell-card-solid)",
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

        {/* Sort and Total Stats */}
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-xl px-3 py-2 text-xs font-semibold outline-none transition-all cursor-pointer"
            style={{
              background: "var(--shell-card-solid)",
              border: "1px solid var(--shell-border)",
              color: "var(--foreground)",
            }}
          >
            <option value="date-desc">Tarihe Göre (En Yeni)</option>
            <option value="date-asc">Tarihe Göre (En Eski)</option>
            <option value="amount-desc">Tutara Göre (En Yüksek)</option>
            <option value="amount-asc">Tutara Göre (En Düşük)</option>
          </select>

          <div
            className="rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap"
            style={{
              background: "oklch(0.85 0.05 25 / 0.15)",
              color: "var(--shell-accent-strong)",
            }}
          >
            {filteredAndSorted.length} işlem · {formatTRY(totalFilteredAmount)}
          </div>
        </div>
      </div>

      {/* Modern Expenses Table Container */}
      <div
        className="overflow-hidden rounded-2xl shadow-2xs"
        style={{
          background: "var(--shell-card-solid)",
          border: "1px solid var(--shell-border)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left text-sm">
            <thead>
              <tr
                className="border-b text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                style={{ borderColor: "var(--shell-border)", background: "oklch(0.5 0.02 50 / 0.04)" }}
              >
                <th className="py-3.5 px-4">Tarih</th>
                <th className="py-3.5 px-4">Ödeme Yöntemi</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Tutar</th>
                <th className="py-3.5 px-4">Not / Açıklama</th>
                {onDelete && <th className="py-3.5 px-4 text-right">İşlem</th>}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--shell-border)" }}>
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-zinc-500">
                    Filtre kriterlerine uygun harcama kaydı bulunamadı.
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
                        <div className="relative inline-block">
                          <select
                            value={e.category}
                            onChange={(ev) => onUpdateCategory(e.id, ev.target.value)}
                            className="rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer outline-none"
                            style={{
                              background: "oklch(0.85 0.05 25 / 0.1)",
                              color: "var(--shell-accent-strong)",
                              border: "1px solid transparent",
                            }}
                            title="Kategoriyi değiştirmek için tıkla"
                          >
                            {EXPENSE_CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
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
                    <td className="py-3.5 px-4 max-w-[240px] truncate text-xs text-zinc-500 dark:text-zinc-400" title={e.note}>
                      {e.note || <span className="italic opacity-50">—</span>}
                    </td>

                    {/* Delete Action */}
                    {onDelete && (
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (confirm("Bu harcamayı silmek istediğine emin misin?")) {
                              onDelete(e.id);
                            }
                          }}
                          className="rounded-lg p-1.5 text-xs text-zinc-400 transition-all hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 opacity-70 group-hover:opacity-100"
                          title="Harcamayı Sil"
                        >
                          🗑️
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