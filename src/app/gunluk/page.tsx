"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import FinancialJournal from "@/components/FinancialJournal";
import FinancialCalendar from "@/components/FinancialCalendar";
import ErrorBanner from "@/components/ErrorBanner";
import { useInvestments } from "@/hooks/useInvestments";
import { useCalendarNotes } from "@/hooks/useCalendarNotes";
import { useDividends } from "@/hooks/useDividends";

type TabType = "calendar" | "journal";

export default function GunlukPage() {
  const { transactions } = useInvestments();
  const {
    calendarNotes,
    handleAddCalendarNote,
    handleDeleteCalendarNote,
    isLoading: notesLoading,
    error: calendarError,
    clearError: clearCalendarError,
  } = useCalendarNotes();
  const {
    dividends,
    handleAddDividend,
    handleDeleteDividend,
    isLoading: dividendsLoading,
    error: dividendError,
    clearError: clearDividendError,
  } = useDividends();
  const [activeTab, setActiveTab] = useState<TabType>("calendar");

  const stockTickers = Array.from(
    new Set(transactions.filter((t) => t.assetType === "stock").map((t) => t.subType.toUpperCase()))
  );

  const transactionsWithNotes = transactions.filter((t) => t.note && t.note.trim().length > 0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 p-6 sm:p-10">
      {/* Header */}
      <header className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl text-sm shadow-2xs"
            style={{
              background: "var(--shell-accent-bg)",
              color: "var(--shell-accent)",
            }}
          >
            <Icon name="book" />
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-zinc-900 dark:text-zinc-100">
            Finans Günlüğüm
          </h1>
        </div>
        <p className="text-xs sm:text-sm font-medium text-zinc-500">
          Önemli makroekonomik kararlar, temettü ajandası ve yatırım gerekçelerinin kişisel karar defteri.
        </p>
      </header>

      <ErrorBanner message={calendarError} onDismiss={clearCalendarError} />
      <ErrorBanner message={dividendError} onDismiss={clearDividendError} />

      {/* KPI Stats Bar */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          className="group flex flex-col justify-between rounded-3xl p-5 sm:p-6 shadow-xs transition-all hover:shadow-md"
          style={{
            background: "var(--shell-card)",
            border: "1px solid var(--shell-border)",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Takvim Notları
            </span>
            <span
              className="flex h-7 w-7 items-center justify-center rounded-xl text-xs"
              style={{ background: "var(--shell-accent-bg)", color: "var(--shell-accent)" }}
            >
              <Icon name="calendar" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-baseline gap-2">
              {notesLoading ? (
                <span className="inline-block h-7 w-16 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              ) : (
                <>
                  {calendarNotes.length} <span className="text-sm font-semibold text-zinc-400">Kayıt</span>
                </>
              )}
            </div>
            <div className="mt-1 text-xs font-medium text-zinc-400">
              Ekonomik kararlar & özel notlar
            </div>
          </div>
        </div>

        <div
          className="group flex flex-col justify-between rounded-3xl p-5 sm:p-6 shadow-xs transition-all hover:shadow-md"
          style={{
            background: "var(--shell-card)",
            border: "1px solid var(--shell-border)",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Temettü Ajandası
            </span>
            <span
              className="flex h-7 w-7 items-center justify-center rounded-xl text-xs"
              style={{ background: "var(--shell-gold-bg)", color: "var(--shell-gold)" }}
            >
              <Icon name="coins" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-baseline gap-2">
              {dividendsLoading ? (
                <span className="inline-block h-7 w-16 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              ) : (
                <>
                  {dividends.length + stockTickers.length} <span className="text-sm font-semibold text-zinc-400">Hisse</span>
                </>
              )}
            </div>
            <div className="mt-1 text-xs font-medium text-zinc-400">
              Nasdaq otomatik + BIST manuel
            </div>
          </div>
        </div>

        <div
          className="group flex flex-col justify-between rounded-3xl p-5 sm:p-6 shadow-xs transition-all hover:shadow-md"
          style={{
            background: "var(--shell-card)",
            border: "1px solid var(--shell-border)",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Yatırım Günlüğü
            </span>
            <span
              className="flex h-7 w-7 items-center justify-center rounded-xl text-xs"
              style={{ background: "var(--shell-positive-bg)", color: "var(--shell-positive)" }}
            >
              <Icon name="note" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              {transactionsWithNotes.length} <span className="text-sm font-semibold text-zinc-400">Notlu İşlem</span>
            </div>
            <div className="mt-1 text-xs font-medium text-zinc-400">
              Kişisel alım/satım gerekçeleri
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Bar */}
      <nav
        className="flex gap-2 rounded-2xl p-1.5 backdrop-blur-xs"
        style={{
          background: "var(--shell-card)",
          border: "1px solid var(--shell-border)",
        }}
        aria-label="Günlük sekmeleri"
      >
        <button
          onClick={() => setActiveTab("calendar")}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all"
          style={
            activeTab === "calendar"
              ? {
                  background: "var(--shell-accent)",
                  color: "#ffffff",
                  boxShadow: "0 2px 8px rgba(66, 99, 56, 0.25)",
                }
              : {
                  color: "var(--shell-muted-2)",
                }
          }
        >
          <Icon name="calendar" />
          <span>Ekonomik Takvim & Temettüler</span>
        </button>

        <button
          onClick={() => setActiveTab("journal")}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all"
          style={
            activeTab === "journal"
              ? {
                  background: "var(--shell-accent)",
                  color: "#ffffff",
                  boxShadow: "0 2px 8px rgba(66, 99, 56, 0.25)",
                }
              : {
                  color: "var(--shell-muted-2)",
                }
          }
        >
          <Icon name="book" />
          <span>Yatırım Karar Defteri</span>
          {transactionsWithNotes.length > 0 && (
            <span
              className="ml-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold"
              style={
                activeTab === "journal"
                  ? { background: "rgba(255, 255, 255, 0.25)", color: "#ffffff" }
                  : { background: "var(--shell-accent-bg)", color: "var(--shell-accent)" }
              }
            >
              {transactionsWithNotes.length}
            </span>
          )}
        </button>
      </nav>

      {/* Tab 1: Calendar */}
      {activeTab === "calendar" && (
        <section
          className="rounded-3xl p-6 sm:p-8 shadow-xs"
          style={{
            background: "var(--shell-card)",
            border: "1px solid var(--shell-border)",
          }}
        >
          <div className="mb-6 flex flex-col gap-1 border-b pb-4" style={{ borderColor: "var(--shell-border)" }}>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Finansal & Ekonomik Ajanda
            </h2>
            <p className="text-xs text-zinc-500">
              TCMB ve FED faiz toplantıları, enflasyon verileri ve hisse temettü dağıtım tarihleri.
            </p>
          </div>
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
        <section
          className="rounded-3xl p-6 sm:p-8 shadow-xs"
          style={{
            background: "var(--shell-card)",
            border: "1px solid var(--shell-border)",
          }}
        >
          <div className="mb-6 flex flex-col gap-1 border-b pb-4" style={{ borderColor: "var(--shell-border)" }}>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Yatırım Karar Defteri (Zaman Tüneli)
            </h2>
            <p className="text-xs text-zinc-500">
              Hisse, altın, fon veya döviz alırken düştüğünüz tüm notlar ve alım gerekçeleriniz.
            </p>
          </div>
          <FinancialJournal transactions={transactions} />
        </section>
      )}
    </div>
  );
}
