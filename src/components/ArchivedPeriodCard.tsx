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
      <div
        className="flex flex-col gap-3 rounded-[22px] p-5 shadow-xs transition-all"
        style={{
          background: "var(--shell-card-solid)",
          border: "1px solid var(--shell-accent)",
        }}
      >
        <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--shell-accent-strong)" }}>
          Klasör Düzenle
        </h4>
        <label className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
          İsim (opsiyonel)
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Örn: Temmuz Ayı Klasörü"
            className="rounded-xl p-2 text-xs outline-none"
            style={{
              background: "var(--shell-card)",
              border: "1px solid var(--shell-border)",
              color: "var(--foreground)",
            }}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
            Başlangıç
            <input
              type="date"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              className="rounded-xl p-2 text-xs outline-none"
              style={{
                background: "var(--shell-card)",
                border: "1px solid var(--shell-border)",
                color: "var(--foreground)",
              }}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
            Bitiş
            <input
              type="date"
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
              className="rounded-xl p-2 text-xs outline-none"
              style={{
                background: "var(--shell-card)",
                border: "1px solid var(--shell-border)",
                color: "var(--foreground)",
              }}
            />
          </label>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={saveEdit}
            className="flex-1 rounded-xl py-2 text-xs font-bold text-white transition-all hover:opacity-95"
            style={{ background: "var(--shell-accent)" }}
          >
            Kaydet
          </button>
          <button
            onClick={() => setEditing(false)}
            className="flex-1 rounded-xl py-2 text-xs font-semibold"
            style={{
              background: "var(--shell-card)",
              border: "1px solid var(--shell-border)",
              color: "var(--shell-muted)",
            }}
          >
            Vazgeç
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative flex flex-col justify-between rounded-[22px] p-5 shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5"
      style={{
        background: "var(--shell-card-solid)",
        border: "1px solid var(--shell-border)",
      }}
    >
      {/* Top Action Hover Bar */}
      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 z-10">
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
          className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-50 text-xs text-rose-600 shadow-2xs transition-colors hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900"
        >
          🗑️
        </button>
      </div>

      <Link href={`/harcamalar/donem/${period.id}`} className="flex flex-col gap-3.5">
        <div className="flex items-start justify-between">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-2xs"
            style={{ background: "oklch(0.85 0.05 25 / 0.15)", color: "var(--shell-accent-strong)" }}
          >
            📁
          </div>
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: "oklch(0.5 0.02 50 / 0.1)", color: "var(--shell-muted)" }}
          >
            {period.expenses.length} harcama
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {period.name ? period.name : `${formatDate(period.startDate)} - ${formatDate(period.endDate)}`}
          </h3>
          <p className="text-xs text-zinc-500 font-medium">
            🗓️ {formatDate(period.startDate)} — {formatDate(period.endDate)}
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--shell-border)" }}>
          <span className="text-xs text-zinc-400 font-medium">Klasör Toplamı:</span>
          <span className="text-base font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
            {formatTRY(totalAmount)}
          </span>
        </div>
      </Link>
    </div>
  );
}