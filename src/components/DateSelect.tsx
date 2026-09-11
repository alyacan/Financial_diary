"use client";

import { useState } from "react";
import Icon from "@/components/Icon";

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

  const selectStyle = {
    background: "var(--shell-card)",
    border: "1px solid var(--shell-border)",
    color: "var(--foreground)",
  };

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      {/* 1. GÜN */}
      <select
        aria-label="Gün"
        value={day}
        onChange={(e) => updateDate(Number(e.target.value), month, year)}
        className="w-20 shrink-0 rounded-xl px-3 py-2.5 text-xs font-bold outline-none transition-all cursor-pointer"
        style={selectStyle}
      >
        {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      {/* 2. AY (Asla daralıp kaybolmaz) */}
      <select
        aria-label="Ay"
        value={month}
        onChange={(e) => updateDate(day, Number(e.target.value), year)}
        className="min-w-[110px] flex-1 rounded-xl px-3 py-2.5 text-xs font-bold outline-none transition-all cursor-pointer"
        style={selectStyle}
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
        className="w-24 shrink-0 rounded-xl px-3 py-2.5 text-xs font-bold outline-none transition-all cursor-pointer"
        style={selectStyle}
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
        className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all hover:opacity-90 active:scale-98"
        style={{
          background: "var(--shell-card)",
          border: "1px solid var(--shell-border)",
          color: "var(--shell-accent)",
        }}
        title="Bugünün tarihini seç"
      >
        <Icon name="pin" className="h-3.5 w-3.5" />
        <span>Bugün</span>
      </button>
    </div>
  );
}
