"use client";

import { useState } from "react";
import { EXPENSE_CATEGORIES, Expense, PaymentCard } from "@/lib/types";
import DateSelect from "./DateSelect";

interface Props {
  onAdd: (expense: Expense) => void;
  cards: PaymentCard[];
  defaultCardId: string | null;
  onSuccess?: () => void;
}

export default function ExpenseForm({ onAdd, cards, defaultCardId, onSuccess }: Props) {
  const [date, setDate] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pickedCardId, setPickedCardId] = useState<string | null>(null);

  const selectedCardId = pickedCardId ?? defaultCardId ?? cards[0]?.id ?? "";
  const setSelectedCardId = setPickedCardId;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !amount) return;

    onAdd({
      id: crypto.randomUUID(),
      date,
      category,
      amount: parseFloat(amount),
      note: note || undefined,
      cardId: selectedCardId || undefined,
    });

    setDate("");
    setAmount("");
    setNote("");
    if (onSuccess) onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-5">
        {/* Date Field */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Harcama Tarihi
          </label>
          <DateSelect value={date} onChange={setDate} required />
        </div>

        {/* Category & Amount Row */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl p-3 text-sm font-semibold outline-none transition-all cursor-pointer"
              style={{
                background: "var(--shell-card)",
                border: "1px solid var(--shell-border)",
                color: "var(--foreground)",
              }}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Tutar (TRY)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-zinc-400 text-sm">₺</span>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl pl-9 pr-4 py-3 text-sm font-bold font-mono outline-none transition-all"
                style={{
                  background: "var(--shell-card)",
                  border: "1px solid var(--shell-border)",
                  color: "var(--foreground)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Payment Card Field */}
        {cards.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Ödeme Kartı / Cüzdan
            </label>
            <select
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="w-full rounded-xl p-3 text-sm font-semibold outline-none transition-all cursor-pointer"
              style={{
                background: "var(--shell-card)",
                border: "1px solid var(--shell-border)",
                color: "var(--foreground)",
              }}
            >
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name} ({card.cardType === "credit" ? "Kredi Kartı" : card.cardType === "debit" ? "Banka Kartı" : "Nakit"})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Note / Description */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Açıklama / Not (Opsiyonel)
          </label>
          <input
            type="text"
            placeholder="Örn: Market alışverişi, akşam yemeği..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl p-3 text-sm font-medium outline-none transition-all"
            style={{
              background: "var(--shell-card)",
              border: "1px solid var(--shell-border)",
              color: "var(--foreground)",
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        className="flex items-center justify-center gap-2.5 rounded-xl py-3.5 px-6 text-sm font-bold text-white shadow-xs transition-all hover:opacity-95 active:scale-98"
        style={{ background: "var(--shell-accent)" }}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span>Harcamayı Kaydet</span>
      </button>
    </form>
  );
}