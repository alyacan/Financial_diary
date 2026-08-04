"use client";

import { useState } from "react";

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function parseValue(value: string): { day?: number; month?: number; year?: number } {
  if (!value) return {};
  const [year, month, day] = value.split("-").map(Number);
  return { day, month, year };
}

interface Props {
  value: string; // YYYY-MM-DD or ""
  onChange: (isoDate: string) => void;
  required?: boolean;
}

export default function DateSelect({ value, onChange, required }: Props) {
  const [prevValue, setPrevValue] = useState(value);
  const [parts, setParts] = useState(() => parseValue(value));

  if (value !== prevValue) {
    setPrevValue(value);
    setParts(parseValue(value));
  }

  const { day, month, year } = parts;
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 7 + i);
  const maxDay = year && month ? daysInMonth(year, month) : 31;

  function update(next: { day?: number; month?: number; year?: number }) {
    const merged = { ...parts, ...next };
    setParts(merged);
    if (merged.day && merged.month && merged.year) {
      const clampedDay = Math.min(merged.day, daysInMonth(merged.year, merged.month));
      const iso = `${merged.year}-${String(merged.month).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
      onChange(iso);
    }
  }

  return (
    <div className="flex w-full min-w-0 gap-1.5">
      <select
        aria-label="Gün"
        required={required}
        value={day ?? ""}
        onChange={(e) => update({ day: Number(e.target.value) })}
        className="flex-1 min-w-0 rounded-xl border border-zinc-300 bg-white p-2 text-xs transition-colors dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="" disabled>Gün</option>
        {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <select
        aria-label="Ay"
        required={required}
        value={month ?? ""}
        onChange={(e) => update({ month: Number(e.target.value) })}
        className="flex-1 min-w-0 rounded-xl border border-zinc-300 bg-white p-2 text-xs transition-colors dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="" disabled>Ay</option>
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>{m}</option>
        ))}
      </select>
      <select
        aria-label="Yıl"
        required={required}
        value={year ?? ""}
        onChange={(e) => update({ year: Number(e.target.value) })}
        className="flex-1 min-w-0 rounded-xl border border-zinc-300 bg-white p-2 text-xs transition-colors dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="" disabled>Yıl</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}
