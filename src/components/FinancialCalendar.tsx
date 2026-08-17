"use client";

import { useEffect, useState } from "react";
import { CalendarNote, DividendEntry, RECURRING_CALENDAR_INFO } from "@/lib/types";
import { EconomicEvent } from "@/lib/economicCalendar";
import { AutoDividendEvent } from "@/lib/dividendCalendar";
import { loadDividendAutoCache, saveDividendAutoCache, loadEconomicEventsCache, saveEconomicEventsCache } from "@/lib/storage";
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

type SubTab = "economic" | "dividends" | "notes";

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

  const [subTab, setSubTab] = useState<SubTab>("economic");

  const [economicEvents, setEconomicEvents] = useState<EconomicEvent[]>(() => {
    const cached = loadEconomicEventsCache(24);
    return (cached as EconomicEvent[]) ?? [];
  });
  const [autoDividends, setAutoDividends] = useState<AutoDividendEvent[]>([]);
  const [divTicker, setDivTicker] = useState("");
  const [divDate, setDivDate] = useState("");
  const [divAmount, setDivAmount] = useState("");

  const [aiTicker, setAiTicker] = useState("");
  const [searchingDividend, setSearchingDividend] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const [loadingEconomicEvents, setLoadingEconomicEvents] = useState(false);
  const [economicRefreshMsg, setEconomicRefreshMsg] = useState<string | null>(null);

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
        const isEstimated = data.source === "Tahmini (Doğrulanmamış)";
        setAiMessage(
          isEstimated
            ? `ℹ️ ${symbol} için resmi bir tarih bulunamadı; geçmiş ödeme desenine dayalı ${count} tahmini tarih takvime eklendi (doğrulanmamış, referans niteliğindedir).`
            : `✅ ${symbol} için ${count} adet yayınlanmış temettü tarihi bulundu ve takvime eklendi!`
        );
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

  function loadEconomicEvents(forceRefresh = false) {
    setLoadingEconomicEvents(true);
    setEconomicRefreshMsg(null);

    fetch("/api/economic-calendar")
      .then((res) => res.json())
      .then((data) => {
        const events = data.events ?? [];
        setEconomicEvents(events);
        saveEconomicEventsCache(events);
        if (forceRefresh) {
          setEconomicRefreshMsg(`✅ ${events.length} adet güncel faiz, enflasyon ve ekonomik olay takvime yüklendi (24 saat önbelleklendi).`);
        }
      })
      .catch(() => {
        if (forceRefresh) {
          setEconomicRefreshMsg("⚠️ Ekonomik takvim yenilenirken bir sorun oluştu.");
        }
      })
      .finally(() => setLoadingEconomicEvents(false));
  }

  useEffect(() => {
    const cached = loadEconomicEventsCache(24);
    if (!cached) {
      const handle = requestAnimationFrame(() => loadEconomicEvents(false));
      return () => cancelAnimationFrame(handle);
    }
  }, []);

  const tickersKey = stockTickers.join(",");

  useEffect(() => {
    if (!tickersKey) return;
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
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;

  const todayISO = toISODate(today.getFullYear(), today.getMonth(), today.getDate());
  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const sortedNotes = [...notes].sort((a, b) => a.date.localeCompare(b.date));

  const selectedDateNotes = date ? notesByDate.get(date) ?? [] : [];
  const selectedDateEvents = date ? eventsByDate.get(date) ?? [] : [];
  const selectedDateDividends = date ? dividendsByDate.get(date) ?? [] : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Visual Calendar Grid Hero */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => goToMonth(-1)}
            aria-label="Önceki ay"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            ←
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            {viewYear === today.getFullYear() && viewMonth === today.getMonth() && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Bu Ay
              </span>
            )}
          </div>
          <button
            onClick={() => goToMonth(1)}
            aria-label="Sonraki ay"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`p-1.5 text-center text-[11px] font-semibold uppercase tracking-wider ${
                i >= 5 ? "text-amber-600/70 dark:text-amber-500/70" : "text-zinc-500"
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
                className={`flex min-h-[3.5rem] flex-col items-center justify-between p-1.5 rounded-xl text-sm transition-all ${
                  isSelected
                    ? "bg-zinc-900 text-white shadow-md dark:bg-zinc-100 dark:text-black"
                    : isToday
                      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-800"
                      : isWeekend
                        ? "text-zinc-400 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-900"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                <span className={`text-xs ${isToday && !isSelected ? "font-bold" : ""}`}>{day}</span>
                {(dayNotes.length > 0 || dayEvents.length > 0 || dayDividends.length > 0) && (
                  <span className="flex gap-1 pb-0.5">
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

      {/* Selected Day Details Panel */}
      {date && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              📅 {formatDate(date)} Tarihindeki Gelişmeler & Notlar
            </h3>
            <button onClick={() => setDate("")} className="text-xs text-zinc-400 hover:text-zinc-600">
              Kapat ✕
            </button>
          </div>
          {selectedDateEvents.length === 0 && selectedDateDividends.length === 0 && selectedDateNotes.length === 0 ? (
            <p className="mt-2 text-xs text-zinc-500">Bu tarihe ait kayıtlı faiz/enflasyon kararı veya not bulunmuyor.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {selectedDateEvents.map((e, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-white p-2.5 text-xs shadow-2xs dark:bg-zinc-900">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="font-semibold">{e.title}</span>
                  {e.time && <span className="text-zinc-400">({e.time})</span>}
                  <span className="ml-auto text-[11px] text-zinc-400">{e.source}</span>
                </div>
              ))}
              {selectedDateDividends.map((d) => (
                <div key={d.id} className="flex items-center gap-2 rounded-lg bg-white p-2.5 text-xs shadow-2xs dark:bg-zinc-900">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold">{d.ticker} Temettü Ödemesi</span>
                  {d.amountPerShare !== undefined && <span className="text-zinc-500">({d.amountPerShare} / hisse)</span>}
                  <span className="ml-auto text-[11px] text-zinc-400">{d.source}</span>
                </div>
              ))}
              {selectedDateNotes.map((n) => (
                <div key={n.id} className="flex items-center justify-between rounded-lg bg-white p-2.5 text-xs shadow-2xs dark:bg-zinc-900">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span>{n.text}</span>
                  </div>
                  <button onClick={() => onDelete(n.id)} className="text-zinc-400 hover:text-red-600">Sil</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tabs Navigation (Under Grid) */}
      <div className="flex flex-col gap-5">
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setSubTab("economic")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
              subTab === "economic"
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <span>📊</span>
            <span>Ekonomik Takvim ({upcomingEvents.length})</span>
          </button>

          <button
            onClick={() => setSubTab("dividends")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
              subTab === "dividends"
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <span>💰</span>
            <span>Temettü Haberleri ({combinedDividends.length})</span>
          </button>

          <button
            onClick={() => setSubTab("notes")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
              subTab === "notes"
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <span>📝</span>
            <span>Notlarım & Hatırlatıcılar ({notes.length})</span>
          </button>
        </div>

        {/* Sub-Tab 1: Economic Events */}
        {subTab === "economic" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-zinc-500">
                TCMB PPK faiz kararları, FED FOMC toplantıları ve TÜİK Enflasyon açıklama tarihleri listesi.
              </p>
              <button
                type="button"
                onClick={() => loadEconomicEvents(true)}
                disabled={loadingEconomicEvents}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-medium transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <span>{loadingEconomicEvents ? "⌛" : "🔄"}</span>
                <span>{loadingEconomicEvents ? "Yenileniyor..." : "Canlı Ekonomik Takvimi Yenile"}</span>
              </button>
            </div>

            {economicRefreshMsg && (
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{economicRefreshMsg}</p>
            )}

            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-zinc-500">Şu an gösterilecek olay yok.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {upcomingEvents.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/40">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{formatDate(e.date)} {e.time ? `(${e.time})` : ""}</span>
                      <span className="text-sm font-medium">{e.title}</span>
                    </div>
                    <span className="ml-auto rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {e.source}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sub-Tab 2: Dividend Events */}
        {subTab === "dividends" && (
          <div className="flex flex-col gap-6">
            {/* AI Dividend Search Box */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                🤖 AI ile Hisse Temettü Tarihini Bul & Takvime Ekle
              </h4>
              <p className="mt-1 text-xs text-zinc-500">
                İstediğin hisse kodunu yaz (örn: BIMAS, TUPRS, THYAO, AAPL). AI ilan edilmiş resmi temettü tarihini araştırıp bulacak ve otomatik takvime ekleyecektir.
              </p>

              <form onSubmit={handleAiDividendSearch} className="mt-3.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={aiTicker}
                  onChange={(e) => setAiTicker(e.target.value)}
                  placeholder="Hisse Kodu (Örn: BIMAS)"
                  className="rounded-xl border border-zinc-300 bg-white p-2.5 text-sm uppercase transition-colors dark:border-zinc-700 dark:bg-zinc-900"
                />
                <button
                  type="submit"
                  disabled={searchingDividend || !aiTicker.trim()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {searchingDividend ? "🔍 Araştırılıyor..." : "🔍 Temettü Tarihini Bul & Takvime Ekle"}
                </button>
              </form>

              {aiMessage && <p className="mt-2.5 text-xs font-medium">{aiMessage}</p>}
            </div>

            {/* Dividend Events List */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">İlan Edilen Temettü Tarihleri</h4>
              {combinedDividends.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Takvimde henüz temettü tarihi yok — yukarıdan istediğin hissenin temettü tarihini AI ile bulabilir veya aşağıdan elle ekleyebilirsin.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {combinedDividends.map((d) => (
                    <div key={d.id} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/40">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <div>
                          <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{formatDate(d.date)} — {d.ticker}</div>
                          {d.amountPerShare !== undefined && (
                            <div className="text-xs text-zinc-500">{d.amountPerShare} TL/USD hisse başı</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          {d.source}
                        </span>
                        {d.source === "Manuel" && (
                          <button onClick={() => onDeleteDividend(d.id)} className="text-xs text-zinc-400 hover:text-red-600">Sil</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manual Dividend Form */}
            <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Manuel Temettü Ekle</h4>
              <form onSubmit={handleAddDividendSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex flex-col gap-1 text-xs text-zinc-500">
                  Hisse Kodu
                  <input
                    type="text"
                    value={divTicker}
                    onChange={(e) => setDivTicker(e.target.value)}
                    placeholder="Örn: THYAO"
                    required
                    className="rounded-xl border border-zinc-300 p-2 text-sm uppercase dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-zinc-500">
                  Tarih
                  <DateSelect value={divDate} onChange={setDivDate} required />
                </label>
                <label className="flex flex-col gap-1 text-xs text-zinc-500">
                  Hisse Başı Tutar (opsiyonel)
                  <input
                    type="number"
                    step="any"
                    value={divAmount}
                    onChange={(e) => setDivAmount(e.target.value)}
                    className="rounded-xl border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
                <button type="submit" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors dark:bg-zinc-100 dark:text-black">
                  Ekle
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Sub-Tab 3: Custom Notes & Info */}
        {subTab === "notes" && (
          <div className="flex flex-col gap-6">
            <div>
              <h4 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Eklediğin Özel Tarih Notları</h4>
              {sortedNotes.length === 0 ? (
                <p className="text-sm text-zinc-500">Henüz eklenmiş not bulunmuyor.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {sortedNotes.map((n) => (
                    <div key={n.id} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/40">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-sm"><strong>{formatDate(n.date)}</strong> — {n.text}</span>
                      </div>
                      <button onClick={() => onDelete(n.id)} className="text-xs text-zinc-400 hover:text-red-600">Sil</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40 sm:flex-row sm:items-end">
              <label className="flex flex-col gap-1 text-xs text-zinc-500">
                Tarih
                <DateSelect value={date} onChange={setDate} />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs text-zinc-500">
                Not
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Örn: TCMB PPK toplantısı veya Şirket Genel Kurul"
                  className="rounded-xl border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>
              <button type="submit" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors dark:bg-zinc-100 dark:text-black">
                Not Ekle
              </button>
            </form>

            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800/50 dark:bg-zinc-900/20">
              <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Düzenli Olay Bilgileri</h5>
              <ul className="flex flex-col gap-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                {RECURRING_CALENDAR_INFO.map((info, i) => (
                  <li key={i}>• {info}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
