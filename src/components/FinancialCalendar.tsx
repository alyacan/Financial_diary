"use client";

import { useEffect, useState } from "react";
import { CalendarNote, DividendEntry, RECURRING_CALENDAR_INFO } from "@/lib/types";
import { EconomicEvent } from "@/lib/economicCalendar";
import { AutoDividendEvent } from "@/lib/dividendCalendar";
import { loadDividendAutoCache, saveDividendAutoCache } from "@/lib/storage";
import DateSelect from "./DateSelect";

const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}.${m}.${y}`;
}

function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

interface Props {
  notes: CalendarNote[];
  onAdd: (note: CalendarNote) => void;
  onDelete: (id: string) => void;
  stockTickers: string[];
  dividends: DividendEntry[];
  onAddDividend: (entry: DividendEntry) => void;
  onDeleteDividend: (id: string) => void;
}

export default function FinancialCalendar({
  notes,
  onAdd,
  onDelete,
  stockTickers,
  dividends,
  onAddDividend,
  onDeleteDividend,
}: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [date, setDate] = useState("");
  const [text, setText] = useState("");
  const [economicEvents, setEconomicEvents] = useState<EconomicEvent[]>([]);
  const [autoDividends, setAutoDividends] = useState<AutoDividendEvent[]>([]);
  const [divTicker, setDivTicker] = useState("");
  const [divDate, setDivDate] = useState("");
  const [divAmount, setDivAmount] = useState("");

  const [aiTicker, setAiTicker] = useState("");
  const [searchingDividend, setSearchingDividend] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  async function handleAiDividendSearch(e: React.FormEvent) {
    e.preventDefault();
    const symbol = aiTicker.trim().toUpperCase();
    if (!symbol) return;

    setSearchingDividend(true);
    setAiMessage(null);

    try {
      const res = await fetch(`/api/dividend-search?ticker=${symbol}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        setAiMessage(`⚠️ ${data.error ?? "Temettü araması yapılamadı."}`);
      } else if (data.events && data.events.length > 0) {
        let count = 0;
        for (const ev of data.events) {
          if (ev.date) {
            onAddDividend({
              id: crypto.randomUUID(),
              ticker: symbol,
              date: ev.date,
              amountPerShare: ev.amountPerShare,
            });
            count++;
          }
        }
        setAiMessage(`✅ ${symbol} için ${count} adet yayınlanmış temettü tarihi bulundu ve takvime eklendi!`);
        setAiTicker("");
      } else {
        setAiMessage(`ℹ️ ${symbol} için ilan edilmiş resmi temettü tarihi bulunamadı.`);
      }
    } catch {
      setAiMessage("⚠️ Temettü araştırması yapılırken bir hata oluştu.");
    } finally {
      setSearchingDividend(false);
    }
  }

  useEffect(() => {
    fetch("/api/economic-calendar")
      .then((res) => res.json())
      .then((data) => setEconomicEvents(data.events ?? []))
      .catch(() => setEconomicEvents([]));
  }, []);

  const tickersKey = stockTickers.join(",");

  useEffect(() => {
    if (!tickersKey) {
      return;
    }
    const cached = loadDividendAutoCache(tickersKey);
    if (cached) {
      const timer = setTimeout(() => setAutoDividends(cached), 0);
      return () => clearTimeout(timer);
    }
    fetch(`/api/dividend-calendar?tickers=${tickersKey}`)
      .then((res) => res.json())
      .then((data) => {
        const events: AutoDividendEvent[] = data.events ?? [];
        setAutoDividends(events);
        saveDividendAutoCache(tickersKey, events);
      })
      .catch(() => setAutoDividends([]));
  }, [tickersKey]);

  function handleAddDividendSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!divTicker || !divDate) return;
    onAddDividend({
      id: crypto.randomUUID(),
      ticker: divTicker.toUpperCase(),
      date: divDate,
      amountPerShare: divAmount ? parseFloat(divAmount) : undefined,
    });
    setDivTicker("");
    setDivDate("");
    setDivAmount("");
  }

  // Nasdaq'tan otomatik gelen ve elle eklenen temettü tarihleri aynı listede birleşir;
  // aynı hisse+tarih hem otomatik hem manuel eklenmişse tekrar göstermemek için elenir.
  const manualKeys = new Set(dividends.map((d) => `${d.ticker}|${d.date}`));
  const combinedDividends = [
    ...dividends.map((d) => ({ ...d, source: "Manuel" as const })),
    ...autoDividends
      .filter((d) => !manualKeys.has(`${d.ticker}|${d.date}`))
      .map((d) => ({ id: `auto-${d.ticker}-${d.date}`, ticker: d.ticker, date: d.date, amountPerShare: d.amount, source: d.source })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !text) return;
    onAdd({ id: crypto.randomUUID(), date, text });
    setDate("");
    setText("");
  }

  function goToMonth(offset: number) {
    const d = new Date(viewYear, viewMonth + offset, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  const notesByDate = new Map<string, CalendarNote[]>();
  for (const n of notes) {
    notesByDate.set(n.date, [...(notesByDate.get(n.date) ?? []), n]);
  }

  const eventsByDate = new Map<string, EconomicEvent[]>();
  for (const e of economicEvents) {
    eventsByDate.set(e.date, [...(eventsByDate.get(e.date) ?? []), e]);
  }

  const dividendsByDate = new Map<string, typeof combinedDividends>();
  for (const d of combinedDividends) {
    dividendsByDate.set(d.date, [...(dividendsByDate.get(d.date) ?? []), d]);
  }

  const todayForFilter = new Date().toISOString().slice(0, 10);
  const ninetyDaysOut = new Date();
  ninetyDaysOut.setDate(ninetyDaysOut.getDate() + 90);
  const upcomingEvents = economicEvents
    .filter((e) => e.date >= todayForFilter && e.date <= ninetyDaysOut.toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date));

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // JS getDay(): 0=Sun..6=Sat. Convert to Monday-start offset (0=Mon..6=Sun).
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;

  const todayISO = toISODate(today.getFullYear(), today.getMonth(), today.getDate());
  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const sortedNotes = [...notes].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => goToMonth(-1)}
            aria-label="Önceki ay"
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ←
          </button>
          <span className="text-base font-semibold tracking-tight">{MONTH_NAMES[viewMonth]} {viewYear}</span>
          <button
            onClick={() => goToMonth(1)}
            aria-label="Sonraki ay"
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`p-1 text-center text-[11px] font-semibold tracking-wide uppercase ${
                i >= 5 ? "text-zinc-400" : "text-zinc-500"
              }`}
            >
              {w}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const iso = toISODate(viewYear, viewMonth, day);
            const dayNotes = notesByDate.get(iso) ?? [];
            const dayEvents = eventsByDate.get(iso) ?? [];
            const dayDividends = dividendsByDate.get(iso) ?? [];
            const isToday = iso === todayISO;
            const isWeekend = (leadingBlanks + day - 1) % 7 >= 5;
            const isSelected = date === iso;
            return (
              <button
                key={i}
                onClick={() => setDate(iso)}
                className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-lg text-sm transition-colors ${
                  isSelected
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black"
                    : isToday
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : isWeekend
                        ? "text-zinc-400 hover:bg-zinc-50 dark:text-zinc-500 dark:hover:bg-zinc-900"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }`}
              >
                <span className={isToday && !isSelected ? "font-bold" : ""}>{day}</span>
                {(dayNotes.length > 0 || dayEvents.length > 0 || dayDividends.length > 0) && (
                  <span className="flex gap-0.5">
                    {dayEvents.length > 0 && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white dark:bg-black" : "bg-blue-500"}`}
                        title={dayEvents.map((e) => e.title).join(", ")}
                      />
                    )}
                    {dayDividends.length > 0 && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white dark:bg-black" : "bg-emerald-500"}`}
                        title={dayDividends.map((d) => `Temettü: ${d.ticker}`).join(", ")}
                      />
                    )}
                    {dayNotes.length > 0 && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white dark:bg-black" : "bg-amber-500"}`}
                        title={dayNotes.map((n) => n.text).join(", ")}
                      />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-500">Otomatik Ekonomik Olaylar (önümüzdeki 90 gün)</h3>
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-zinc-500">Şu an gösterilecek olay yok (veya kaynak geçici olarak erişilemedi).</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcomingEvents.map((e, i) => (
              <li key={i} className="flex items-center gap-2 rounded-lg border border-zinc-200 p-2 text-sm dark:border-zinc-800">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <strong>{formatDate(e.date)}</strong>
                {e.time && <span className="text-zinc-400">{e.time}</span>}
                <span>{e.title}</span>
                <span className="ml-auto text-xs text-zinc-400">{e.source}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-500">Temettü Takvimi</h3>

        {/* AI Dividend Search Box */}
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            🤖 AI ile Hisse Temettü Tarihini Bul & Takvime Ekle
          </h4>
          <p className="mt-0.5 text-xs text-zinc-500">
            İstediğin hisse kodunu yaz (örn: BIMAS, TUPRS, THYAO, AAPL). AI ilan edilmiş resmi temettü tarihini araştırıp bulacak ve otomatik takvime ekleyecektir.
          </p>

          <form onSubmit={handleAiDividendSearch} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={aiTicker}
              onChange={(e) => setAiTicker(e.target.value)}
              placeholder="Hisse Kodu (Örn: BIMAS)"
              className="rounded-lg border border-zinc-300 bg-white p-2 text-sm uppercase dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              type="submit"
              disabled={searchingDividend || !aiTicker.trim()}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {searchingDividend ? "🔍 Araştırılıyor..." : "🔍 Temettü Tarihini Bul & Takvime Ekle"}
            </button>
          </form>

          {aiMessage && <p className="mt-2 text-xs font-medium">{aiMessage}</p>}
        </div>

        {combinedDividends.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Takvimde henüz temettü tarihi yok — yukarıdan istediğin hissenin temettü tarihini AI ile bulabilir veya aşağıdan elle ekleyebilirsin.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {combinedDividends.map((d) => (
              <li key={d.id} className="flex items-center gap-2 rounded-lg border border-zinc-200 p-2 text-sm dark:border-zinc-800">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <strong>{formatDate(d.date)}</strong>
                <span>{d.ticker}</span>
                {d.amountPerShare !== undefined && <span className="text-zinc-400">{d.amountPerShare} / hisse</span>}
                <span className="ml-auto text-xs text-zinc-400">{d.source}</span>
                {d.source === "Manuel" && (
                  <button onClick={() => onDeleteDividend(d.id)} className="shrink-0 text-zinc-400 hover:text-red-600">Sil</button>
                )}
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={handleAddDividendSubmit} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex flex-col gap-1 text-sm">
            Hisse
            <input
              type="text"
              list="dividend-ticker-options"
              value={divTicker}
              onChange={(e) => setDivTicker(e.target.value)}
              placeholder="Örn: THYAO"
              required
              className="rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <datalist id="dividend-ticker-options">
              {stockTickers.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Tarih
            <DateSelect value={divDate} onChange={setDivDate} required />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Hisse Başı Tutar (opsiyonel)
            <input
              type="number"
              step="any"
              value={divAmount}
              onChange={(e) => setDivAmount(e.target.value)}
              className="rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-100 dark:text-black">
            Ekle
          </button>
        </form>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-500">Genel Bilgi (spesifik tarih değil, düzenli tekrar eden olaylar)</h3>
        <ul className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
          {RECURRING_CALENDAR_INFO.map((info, i) => (
            <li key={i}>• {info}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-500">Senin Eklediğin Tarihler (resmi/gerçek ilan edilmiş tarihler)</h3>
        {sortedNotes.length === 0 ? (
          <p className="text-sm text-zinc-500">Henüz eklenmedi.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sortedNotes.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-2 rounded-lg border border-zinc-200 p-2 text-sm dark:border-zinc-800">
                <span><strong>{formatDate(n.date)}</strong> — {n.text}</span>
                <button onClick={() => onDelete(n.id)} className="shrink-0 text-zinc-400 hover:text-red-600">Sil</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1 text-sm">
          Tarih
          <DateSelect value={date} onChange={setDate} />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Not
          <input type="text" value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Örn: TCMB PPK toplantısı"
            className="rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-100 dark:text-black">
          Ekle
        </button>
      </form>
    </div>
  );
}
