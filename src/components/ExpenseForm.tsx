"use client";

import { useState } from "react";
import { EXPENSE_CATEGORIES, Expense } from "@/lib/types";
import DateSelect from "./DateSelect";

interface Props {
  onAdd: (expense: Expense) => void;
}

export default function ExpenseForm({ onAdd }: Props) {
  const [date, setDate] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !amount) return;

    onAdd({
      id: crypto.randomUUID(),
      date,
      category,
      amount: parseFloat(amount),
      note: note || undefined,
    });

    setDate("");
    setAmount("");
    setNote("");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <h3 className="font-semibold">Elle Ekle</h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          Tarih
          <DateSelect value={date} onChange={setDate} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Kategori
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Tutar (TL)
          <input type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required
            className="rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Not (opsiyonel)
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="Örn: Haftalık market alışverişi"
          className="rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900" />
      </label>

      <button type="submit" className="mt-2 rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black">
        Harcamayı Kaydet
      </button>
    </form>
  );
}
