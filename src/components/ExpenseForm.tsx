"use client";

import { useState } from "react";
import { EXPENSE_CATEGORIES, Expense, PaymentCard } from "@/lib/types";
import { getStoredCards } from "@/lib/cardsStorage";
import DateSelect from "./DateSelect";

interface Props {
  onAdd: (expense: Expense) => void;
}

export default function ExpenseForm({ onAdd }: Props) {
  const [date, setDate] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [cards] = useState<PaymentCard[]>(() => getStoredCards());
  const [selectedCardId, setSelectedCardId] = useState<string>(() => (cards.length > 0 ? cards[0].id : ""));

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
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Elle Harcama Ekle</h3>

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Tarih
          <DateSelect value={date} onChange={setDate} required />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            Kategori
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-sm transition-colors dark:border-zinc-700 dark:bg-zinc-900"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            Tutar (TL)
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="0.00"
              className="w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-sm transition-colors dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
        </div>

        {cards.length > 0 && (
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            Ödeme Yöntemi / Kart
            <select
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-sm font-semibold transition-colors dark:border-zinc-700 dark:bg-zinc-900"
            >
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  💳 {card.name} ({card.cardType === "credit" ? "Kredi Kartı" : card.cardType === "debit" ? "Banka Kartı" : "Nakit"})
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Not (opsiyonel)
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Örn: Haftalık market alışverişi"
            className="w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-sm transition-colors dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      </div>

      <button
        type="submit"
        className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
      >
        Harcamayı Kaydet
      </button>
    </form>
  );
}
