"use client";

import { useState } from "react";
import Link from "next/link";
import { ArchivedPeriod } from "@/lib/types";

function formatTRY(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}.${m}.${y}`;
}

interface Props {
  period: ArchivedPeriod;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Pick<ArchivedPeriod, "name" | "note" | "startDate" | "endDate">>) => void;
}

export default function ArchivedPeriodCard({ period, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(period.name ?? "");
  const [startInput, setStartInput] = useState(period.startDate);
  const [endInput, setEndInput] = useState(period.endDate);

  function startEdit() {
    setNameInput(period.name ?? "");
    setStartInput(period.startDate);
    setEndInput(period.endDate);
    setEditing(true);
  }

  function saveEdit() {
    if (startInput > endInput) {
      window.alert("Başlangıç tarihi, bitiş tarihinden sonra olamaz.");
      return;
    }
    onUpdate(period.id, {
      name: nameInput.trim() ? nameInput.trim() : undefined,
      startDate: startInput,
      endDate: endInput,
    });
    setEditing(false);
  }

  function handleDelete() {
    const confirmed = window.confirm(
      "Bu arşivlenmiş dönemi tamamen silmek istediğine emin misin? Bu işlem geri alınamaz."
    );
    if (confirmed) onDelete(period.id);
  }

  const totalAmount = period.expenses.reduce((sum, e) => sum + e.amount, 0);

  if (editing) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-300/80 bg-amber-50/50 p-4 shadow-xs dark:border-amber-800/60 dark:bg-amber-950/20">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">Klasör Düzenle</h4>
        <label className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
          İsim (opsiyonel)
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Örn: Temmuz Ayı Klasörü"
            className="rounded-xl border border-zinc-300 bg-white p-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
            Başlangıç
            <input
              type="date"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              className="rounded-xl border border-zinc-300 bg-white p-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
            Bitiş
            <input
              type="date"
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
              className="rounded-xl border border-zinc-300 bg-white p-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={saveEdit}
            className="flex-1 rounded-xl bg-zinc-900 py-1.5 text-xs font-medium text-white transition-colors dark:bg-zinc-100 dark:text-black"
          >
            Kaydet
          </button>
          <button
            onClick={() => setEditing(false)}
            className="flex-1 rounded-xl border border-zinc-300 py-1.5 text-xs font-medium dark:border-zinc-700"
          >
            Vazgeç
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-amber-50/40 via-white to-zinc-50/30 p-5 shadow-xs transition-all hover:border-amber-300 hover:shadow-md dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900/80 dark:to-zinc-950 dark:hover:border-amber-700/60">
      {/* Top Action Hover Bar */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={startEdit}
          aria-label="Klasör Düzenle"
          title="Klasör adını veya tarihlerini düzenle"
          className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-xs shadow-2xs transition-colors hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          ✏️
        </button>
        <button
          onClick={handleDelete}
          aria-label="Klasörü Sil"
          title="Klasörü sil"
          className="flex h-7 w-7 items-center justify-center rounded-xl bg-red-50 text-xs text-red-600 shadow-2xs transition-colors hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900"
        >
          🗑️
        </button>
      </div>

      <Link href={`/harcamalar/donem/${period.id}`} className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100/80 text-2xl shadow-2xs dark:bg-amber-950/60">
            📁
          </div>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {period.expenses.length} harcama
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {period.name ? period.name : `${formatDate(period.startDate)} - ${formatDate(period.endDate)}`}
          </h3>
          <p className="text-xs text-zinc-500">
            🗓️ {formatDate(period.startDate)} — {formatDate(period.endDate)}
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800/80">
          <span className="text-xs text-zinc-400">Klasör Toplamı:</span>
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {formatTRY(totalAmount)}
          </span>
        </div>
      </Link>
    </div>
  );
}
