"use client";

import { useState } from "react";
import FinancialJournal from "@/components/FinancialJournal";
import FinancialCalendar from "@/components/FinancialCalendar";
import { useInvestments } from "@/hooks/useInvestments";
import { useCalendarNotes } from "@/hooks/useCalendarNotes";
import { useDividends } from "@/hooks/useDividends";

type TabType = "calendar" | "journal";

export default function GunlukPage() {
  const { transactions } = useInvestments();
  const { calendarNotes, handleAddCalendarNote, handleDeleteCalendarNote } = useCalendarNotes();
  const { dividends, handleAddDividend, handleDeleteDividend } = useDividends();
  const [activeTab, setActiveTab] = useState<TabType>("calendar");

  const stockTickers = Array.from(
    new Set(transactions.filter((t) => t.assetType === "stock").map((t) => t.subType.toUpperCase()))
  );

  const transactionsWithNotes = transactions.filter((t) => t.note && t.note.trim().length > 0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6 sm:p-10">
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Finans Günlüğüm 📓</h1>
        <p className="text-sm text-zinc-500">
          Önemli ekonomik tarihler, temettü takvimi ve yatırım kararlarının gerekçeleri tek ekranda.
        </p>
      </header>

      {/* KPI Stats Bar */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Takvim Notları</div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {calendarNotes.length} Kayıt
          </div>
          <div className="mt-1 text-xs text-zinc-400">Ekonomik kararlar & notlar</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Temettü Takip</div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {dividends.length + stockTickers.length} Hisse
          </div>
          <div className="mt-1 text-xs text-zinc-400">Nasdaq otomatik + BIST manuel</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Yatırım Günlüğü</div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {transactionsWithNotes.length} Notlu İşlem
          </div>
          <div className="mt-1 text-xs text-zinc-400">Alım/satım gerekçeleri</div>
        </div>
      </section>

      {/* Tabs Bar */}
      <nav className="flex gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-800" aria-label="Günlük sekmeleri">
        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "calendar"
              ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-black"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          <span>📅</span>
          <span>Finansal Takvim & Temettüler</span>
        </button>

        <button
          onClick={() => setActiveTab("journal")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "journal"
              ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-black"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          <span>📓</span>
          <span>Yatırım Günlüğü Zaman Tüneli</span>
          {transactionsWithNotes.length > 0 && (
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                activeTab === "journal"
                  ? "bg-zinc-700 text-zinc-100 dark:bg-zinc-300 dark:text-zinc-900"
                  : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {transactionsWithNotes.length}
            </span>
          )}
        </button>
      </nav>

      {/* Tab 1: Calendar */}
      {activeTab === "calendar" && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Finansal Takvim</h2>
          <FinancialCalendar
            notes={calendarNotes}
            onAdd={handleAddCalendarNote}
            onDelete={handleDeleteCalendarNote}
            stockTickers={stockTickers}
            dividends={dividends}
            onAddDividend={handleAddDividend}
            onDeleteDividend={handleDeleteDividend}
          />
        </section>
      )}

      {/* Tab 2: Investment Journal Timeline */}
      {activeTab === "journal" && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Yatırım Günlüğü Zaman Tüneli</h2>
            <p className="text-xs text-zinc-500">
              Varlık alım/satım işlemleriniz esnasında yazdığınız tüm karar gerekçeleri kronolojik sırayla listelenir.
            </p>
          </div>
          <FinancialJournal transactions={transactions} />
        </section>
      )}
    </div>
  );
}
