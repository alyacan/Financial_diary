"use client";

import { useState } from "react";

interface Props {
  value: string; // YYYY-MM-DD or ""
  onChange: (isoDate: string) => void;
  required?: boolean;
}

export default function DateSelect({ value, onChange, required }: Props) {
  const todayISO = new Date().toISOString().slice(0, 10);
  const [internalDate, setInternalDate] = useState("");

  const selectedDate = value || internalDate || todayISO;

  function handleDateChange(newIso: string) {
    if (newIso > todayISO) {
      alert("Gelecek bir tarih için harcama ekleyemezsiniz. Tarih bugüne sabitlendi.");
      setInternalDate(todayISO);
      onChange(todayISO);
      return;
    }
    setInternalDate(newIso);
    onChange(newIso);
  }

  function getFormattedTurkishDate(iso: string): string {
    if (!iso) return "";
    try {
      const parts = iso.split("-").map(Number);
      if (parts.length !== 3) return "";
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const dateStr = d.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const dayName = d.toLocaleDateString("tr-TR", { weekday: "long" });
      return `${dateStr}, ${dayName}`;
    } catch {
      return iso;
    }
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={selectedDate}
          max={todayISO}
          required={required}
          onChange={(e) => handleDateChange(e.target.value)}
          className="flex-1 rounded-xl border border-zinc-300 bg-white p-2.5 text-xs font-semibold text-zinc-900 shadow-2xs transition-colors dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />

        <button
          type="button"
          onClick={() => handleDateChange(todayISO)}
          className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300"
          title="Bugünün tarihini seç"
        >
          📍 Bugün
        </button>
      </div>

      {selectedDate && (
        <div className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          <span>📅 Seçilen Tarih:</span>
          <span className="font-bold text-emerald-700 dark:text-emerald-400">
            {getFormattedTurkishDate(selectedDate)}
          </span>
        </div>
      )}
    </div>
  );
}
