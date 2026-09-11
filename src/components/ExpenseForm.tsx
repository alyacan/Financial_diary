"use client";

import { useState } from "react";
import { EXPENSE_CATEGORIES, Expense, PaymentCard } from "@/lib/types";
import DateSelect from "./DateSelect";

interface Props {
  onAdd: (expense: Expense) => void;
  cards: PaymentCard[];
  defaultCardId: string | null;
}

export default function ExpenseForm({ onAdd, cards, defaultCardId }: Props) {
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
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-[22px] p-6 sm:p-7 shadow-xs transition-all"
      style={{
        background: "var(--shell-card-solid)",
        border: "1px solid var(--shell-border)",
      }}
    >
      <div className="border-b pb-3" style={{ borderColor: "var(--shell-border)" }}>
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <span>✍️</span>
          <span>Elle Yeni Harcama Ekle</span>
        </h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          Fiş, nakit veya tekil kart harcamalarınızı anında döneme kaydedin.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Date Picker */}
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          <span>Harcama Tarihi</span>
          <DateSelect value={date} onChange={setDate} required />
        </label>

        {/* Category & Amount Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <span>Kategori</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl p-2.5 text-xs font-semibold outline-none transition-all cursor-pointer"
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
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <span>Tutar (₺)</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-zinc-400">₺</span>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl pl-8 pr-3 py-2.5 text-xs font-bold outline-none transition-all font-mono"
                style={{
                  background: "var(--shell-card)",
                  border: "1px solid var(--shell-border)",
                  color: "var(--foreground)",
                }}
              />
            </div>
          </label>
        </div>

        {/* Card Selector (if cards exist) */}
        {cards.length > 0 && (
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <span>Ödeme Yöntemi / Kart</span>
            <select
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="w-full rounded-xl p-2.5 text-xs font-semibold outline-none transition-all cursor-pointer"
              style={{
                background: "var(--shell-card)",
                border: "1px solid var(--shell-border)",
                color: "var(--foreground)",
              }}
            >
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.cardType === "credit" ? "💳" : card.cardType === "debit" ? "🏦" : "💵"} {card.name} (
                  {card.cardType === "credit" ? "Kredi Kartı" : card.cardType === "debit" ? "Banka Kartı" : "Nakit"})
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Note Input */}
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          <span>Açıklama / Not (Opsiyonel)</span>
          <input
            type="text"
            placeholder="Örn: Haftalık market alışverişi, kahve..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl p-2.5 text-xs font-medium outline-none transition-all"
            style={{
              background: "var(--shell-card)",
              border: "1px solid var(--shell-border)",
              color: "var(--foreground)",
            }}
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-2 flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-bold text-white shadow-xs transition-all hover:opacity-95 active:scale-98"
        style={{ background: "var(--shell-accent)" }}
      >
        <span>💾</span>
        <span>Harcamayı Kaydet & Listeye Ekle</span>
      </button>
    </form>
  );
}