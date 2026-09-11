"use client";

import { useMemo, useState } from "react";
import { Expense } from "@/lib/types";

const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatTRY(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}.${m}.${y}`;
}

function bucketFor(dayTotal: number, maxDayTotal: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (dayTotal <= 0 || maxDayTotal <= 0) return 0;
  const ratio = dayTotal / maxDayTotal;
  if (ratio > 0.8) return 5;
  if (ratio > 0.6) return 4;
  if (ratio > 0.4) return 3;
  if (ratio > 0.2) return 2;
  return 1;
}

const BUCKET_BG: Record<number, string> = {
  0: "oklch(0.5 0.02 50 / 0.08)",
  1: "oklch(0.92 0.04 70)",
  2: "oklch(0.82 0.08 65)",
  3: "oklch(0.72 0.12 55)",
  4: "oklch(0.60 0.14 45)",
  5: "oklch(0.48 0.16 35)",
};

const BUCKET_FG: Record<number, string> = {
  0: "var(--shell-muted)",
  1: "#1f1d1a",
  2: "#1f1d1a",
  3: "#ffffff",
  4: "#ffffff",
  5: "#ffffff",
};

interface Props {
  expenses: Expense[];
}

export default function ExpenseHeatmapCalendar({ expenses }: Props) {
  const dailyTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      map.set(e.date, (map.get(e.date) ?? 0) + e.amount);
    }
    return map;
  }, [expenses]);

  const maxDayTotal = useMemo(() => Math.max(0, ...Array.from(dailyTotals.values())), [dailyTotals]);

  const latestDate = useMemo(() => {
    if (expenses.length === 0) return new Date();
    const latestIso = expenses.reduce((max, e) => (e.date > max ? e.date : max), expenses[0].date);
    const [y, m, d] = latestIso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [expenses]);

  const [viewYear, setViewYear] = useState(latestDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(latestDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  function goToMonth(offset: number) {
    const d = new Date(viewYear, viewMonth + offset, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setSelectedDate(null);
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-xs text-zinc-500 max-w-sm">
          Bu dönemde henüz harcama yok — ilk harcamanızı eklediğinizde burada günlere göre yoğunluk haritası oluşacaktır.
        </p>
      </div>
    );
  }

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedExpenses = selectedDate ? expenses.filter((e) => e.date === selectedDate) : [];
  const selectedDayTotal = selectedDate ? (dailyTotals.get(selectedDate) ?? 0) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => goToMonth(-1)}
          aria-label="Önceki ay"
          className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-zinc-500/10"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={() => goToMonth(1)}
          aria-label="Sonraki ay"
          className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-zinc-500/10"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-center text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const iso = toISODate(viewYear, viewMonth, day);
          const dayTotal = dailyTotals.get(iso) ?? 0;
          const bucket = bucketFor(dayTotal, maxDayTotal);
          const isSelected = selectedDate === iso;
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(isSelected ? null : iso)}
              title={dayTotal > 0 ? `${formatDate(iso)} — ${formatTRY(dayTotal)}` : formatDate(iso)}
              className="flex min-h-[2.8rem] flex-col items-center justify-center rounded-xl text-xs font-semibold transition-all hover:scale-105"
              style={{
                background: BUCKET_BG[bucket],
                color: BUCKET_FG[bucket],
                border: isSelected ? "2px solid var(--shell-accent)" : "1px solid transparent",
                boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
              }}
            >
              <span>{day}</span>
              {dayTotal > 0 && (
                <span className="text-[9px] opacity-80 font-mono font-medium truncate max-w-[42px]">
                  {Math.round(dayTotal)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
        <span>Düşük</span>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4, 5].map((b) => (
            <span
              key={b}
              className="h-2.5 w-4 rounded-sm"
              style={{ background: BUCKET_BG[b] }}
            />
          ))}
        </div>
        <span>Yüksek</span>
      </div>

      {/* Selected Day Details */}
      {selectedDate && (
        <div
          className="rounded-2xl p-4 text-xs transition-all shadow-2xs"
          style={{
            background: "var(--shell-card-solid)",
            border: "1px solid var(--shell-border)",
          }}
        >
          <div className="mb-2.5 flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--shell-border)" }}>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              {formatDate(selectedDate)}
            </span>
            <span className="font-bold font-mono text-sm" style={{ color: "var(--shell-accent-strong)" }}>
              {formatTRY(selectedDayTotal)}
            </span>
          </div>

          {selectedExpenses.length === 0 ? (
            <p className="text-zinc-500 py-1 text-[11px]">Bu güne ait harcama kaydı yok.</p>
          ) : (
            <ul className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
              {selectedExpenses.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-2 rounded-lg p-1.5 transition-colors hover:bg-zinc-500/5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-900 dark:text-amber-300">
                      {e.category}
                    </span>
                    {e.note && <span className="truncate text-zinc-600 dark:text-zinc-400 text-[11px]">{e.note}</span>}
                  </div>
                  <span className="font-bold font-mono whitespace-nowrap text-zinc-900 dark:text-zinc-100">
                    {formatTRY(e.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}