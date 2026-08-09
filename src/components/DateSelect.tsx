"use client";

import { useState } from "react";

const MONTHS_TURKISH = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

interface Props {
  value: string; // YYYY-MM-DD or ""
  onChange: (isoDate: string) => void;
  required?: boolean;
}

function parseIso(iso: string) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  if (!iso) return { year: currentYear, month: currentMonth, day: currentDay };
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || isNaN(parts[0])) {
    return { year: currentYear, month: currentMonth, day: currentDay };
  }
  return { year: parts[0], month: parts[1], day: parts[2] };
}

export default function DateSelect({ value, onChange }: Props) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const [dateState, setDateState] = useState(() => parseIso(value));

  // Sync state if value prop changes
  const effectiveState = value ? parseIso(value) : dateState;
  const { year, month, day } = effectiveState;

  // Generate Year options (last 7 years up to current year)
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 7 + i);

  // Max day available for selected year and month
  const maxDays = daysInMonth(year, month);

  // Emit change to parent
  function updateDate(newDay: number, newMonth: number, newYear: number) {
    // Prevent future dates
    let targetYear = newYear;
    let targetMonth = newMonth;
    let targetDay = newDay;

    if (targetYear > currentYear) targetYear = currentYear;
    if (targetYear === currentYear && targetMonth > currentMonth) targetMonth = currentMonth;

    const maxAllowedDay = daysInMonth(targetYear, targetMonth);
    if (targetDay > maxAllowedDay) targetDay = maxAllowedDay;

    if (targetYear === currentYear && targetMonth === currentMonth && targetDay > currentDay) {
      targetDay = currentDay;
    }

    const next = { year: targetYear, month: targetMonth, day: targetDay };
    setDateState(next);

    const iso = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
    onChange(iso);
  }

  function handleSetToday() {
    updateDate(currentDay, currentMonth, currentYear);
  }

  return (
    <div className="flex w-full items-center gap-1.5">
      {/* 1. GÜN */}
      <select
        aria-label="Gün"
        value={day}
        onChange={(e) => updateDate(Number(e.target.value), month, year)}
        className="w-20 rounded-xl border border-zinc-300 bg-white p-2.5 text-xs font-semibold text-zinc-900 shadow-2xs transition-colors dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      {/* 2. AY */}
      <select
        aria-label="Ay"
        value={month}
        onChange={(e) => updateDate(day, Number(e.target.value), year)}
        className="flex-1 min-w-0 rounded-xl border border-zinc-300 bg-white p-2.5 text-xs font-semibold text-zinc-900 shadow-2xs transition-colors dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {MONTHS_TURKISH.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>

      {/* 3. YIL */}
      <select
        aria-label="Yıl"
        value={year}
        onChange={(e) => updateDate(day, month, Number(e.target.value))}
        className="w-24 rounded-xl border border-zinc-300 bg-white p-2.5 text-xs font-semibold text-zinc-900 shadow-2xs transition-colors dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      {/* 4. BUGÜN BUTONU */}
      <button
        type="button"
        onClick={handleSetToday}
        className="shrink-0 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300"
        title="Bugünün tarihini seç"
      >
        📍 Bugün
      </button>
    </div>
  );
}
