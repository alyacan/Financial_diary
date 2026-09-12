"use client";

import { useEffect, useState } from "react";
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
  allowFuture?: boolean; // Dividends & calendar notes require future dates (default: true)
  className?: string;
}

function parseIso(iso: string) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  if (!iso) return { year: currentYear, month: currentMonth, day: currentDay };
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return { year: currentYear, month: currentMonth, day: currentDay };
  }
  return { year: parts[0], month: parts[1], day: parts[2] };
}

export default function DateSelect({
  value,
  onChange,
  allowFuture = true,
  className = "",
}: Props) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const [dateState, setDateState] = useState(() => parseIso(value));

  // If initial value is empty, emit today's ISO date once so parent form state is never empty
  useEffect(() => {
    if (!value) {
      const todayIso = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(currentDay).padStart(2, "0")}`;
      onChange(todayIso);
    }
  }, [value, onChange, currentYear, currentMonth, currentDay]);

  // Sync state if value prop changes
  const effectiveState = value ? parseIso(value) : dateState;
  const { year, month, day } = effectiveState;

  // Generate Year options:
  // If allowFuture: currentYear - 3 up to currentYear + 5 (e.g. 2023 - 2031)
  // If not allowFuture: currentYear - 7 up to currentYear (e.g. 2019 - 2026)
  const minYear = allowFuture ? currentYear - 3 : currentYear - 7;
  const maxYear = allowFuture ? currentYear + 5 : currentYear;
  const startYear = Math.min(minYear, year);
  const endYear = Math.max(maxYear, year);
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  // Max day available for selected year and month
  const maxDays = daysInMonth(year, month);

  // Emit change to parent
  function updateDate(newDay: number, newMonth: number, newYear: number) {
    let targetYear = newYear;
    let targetMonth = newMonth;
    let targetDay = newDay;

    if (!allowFuture) {
      if (targetYear > currentYear) targetYear = currentYear;
      if (targetYear === currentYear && targetMonth > currentMonth) targetMonth = currentMonth;
      if (targetYear === currentYear && targetMonth === currentMonth && targetDay > currentDay) {
        targetDay = currentDay;
      }
    }

    const maxAllowedDay = daysInMonth(targetYear, targetMonth);
    if (targetDay > maxAllowedDay) targetDay = maxAllowedDay;

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
    <div className={`flex items-center gap-1.5 flex-nowrap ${className}`}>
      {/* 1. GÜN */}
      <select
        aria-label="Gün"
        value={day}
        onChange={(e) => updateDate(Number(e.target.value), month, year)}
        className="w-[58px] shrink-0 rounded-xl px-2 py-2 text-xs font-bold outline-none transition-all cursor-pointer focus:ring-1 focus:ring-amber-500/50"
        style={selectStyle}
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
        className="w-[110px] shrink-0 rounded-xl px-2 py-2 text-xs font-bold outline-none transition-all cursor-pointer focus:ring-1 focus:ring-amber-500/50"
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
        className="w-[74px] shrink-0 rounded-xl px-2 py-2 text-xs font-bold outline-none transition-all cursor-pointer focus:ring-1 focus:ring-amber-500/50"
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
        className="shrink-0 flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-bold transition-all hover:opacity-90 active:scale-98 cursor-pointer"
        style={{
          background: "var(--shell-card)",
          border: "1px solid var(--shell-border)",
          color: "var(--shell-accent)",
        }}
        title="Bugünün tarihini seç"
      >
        <Icon name="pin" className="h-3 w-3" />
        <span>Bugün</span>
      </button>
    </div>
  );
}
