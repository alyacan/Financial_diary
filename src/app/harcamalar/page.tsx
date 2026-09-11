"use client";

import { useState, useMemo, useEffect } from "react";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseChart from "@/components/ExpenseChart";
import ExpenseTable from "@/components/ExpenseTable";
import ExpenseHeatmapCalendar from "@/components/ExpenseHeatmapCalendar";
import BudgetGoals from "@/components/BudgetGoals";
import ArchivedPeriodCard from "@/components/ArchivedPeriodCard";
import StatementUpload from "@/components/StatementUpload";
import CardWalletWidget from "@/components/CardWalletWidget";
import SlideOverDrawer from "@/components/SlideOverDrawer";
import ErrorBanner from "@/components/ErrorBanner";
import { useExpenseData } from "@/hooks/useExpenseData";
import { PaymentCard } from "@/lib/types";
import { getStoredCards } from "@/lib/cardsStorage";

function formatTRY(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

export default function HarcamalarPage() {
  const {
    expenses,
    handleAddExpense,
    handleDeleteExpense,
    handleUpdateExpenseCategory,
    handleImportExpenses,
    archivedPeriods,
    handleClosePeriod,
    handleDeleteArchivedPeriod,
    handleUpdateArchivedPeriod,
    budgets,
    budgetProgress,
    handleSaveBudget,
    handleDeleteBudget,
    error,
    clearError,
  } = useExpenseData();

  // Side Drawer States (Yan Modallar)
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [tableDrawerOpen, setTableDrawerOpen] = useState(false);
  const [archivesDrawerOpen, setArchivesDrawerOpen] = useState(false);

  // Add Drawer Sub-tab (Manuel Ekle vs Ekstre Yükle)
  const [addMode, setAddMode] = useState<"manual" | "statement">("manual");

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cards, setCards] = useState<PaymentCard[]>([]);

  useEffect(() => {
    getStoredCards().then(setCards);
  }, []);

  // Filter expenses by selected card from wallet
  const filteredExpenses = useMemo(() => {
    if (!selectedCardId) return expenses;
    return expenses.filter((e) => e.cardId === selectedCardId);
  }, [expenses, selectedCardId]);

  function onClosePeriod() {
    if (expenses.length === 0) return;
    const confirmed = window.confirm(
      "Mevcut dönemi kapatmak istediğinize emin misiniz? Harcamalarınız silinmez, arşiv klasörüne taşınır ve ana ekran yeni dönem için sıfırlanır."
    );
    if (confirmed) {
      handleClosePeriod();
      setSelectedCardId(null);
    }
  }

  const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-8 p-6 sm:gap-10 sm:p-10">
      {/* Top Header Bar & Primary Actions */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            Harcama Analizi & Cüzdan
          </h1>
          <p className="mt-1 text-sm font-medium" style={{ color: "var(--shell-muted)" }}>
            Banka ve kredi kartı takibi, bütçe hedefleri ve hesap dönemi harcama analizi
          </p>
        </div>

        {/* Action Buttons (Ergonomic, High Touch, Clean SVGs, Zero Emojis) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 1. Add Expense Side Modal Trigger */}
          <button
            onClick={() => setAddDrawerOpen(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-all hover:opacity-95 active:scale-98 cursor-pointer"
            style={{ background: "var(--shell-accent)" }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Yeni Harcama Ekle</span>
          </button>

          {/* 2. Full Table Side Modal Trigger */}
          <button
            onClick={() => setTableDrawerOpen(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all hover:bg-zinc-500/10 cursor-pointer"
            style={{
              background: "var(--shell-card-solid)",
              border: "1px solid var(--shell-border)",
              color: "var(--shell-nav-active-fg)",
            }}
          >
            <svg className="h-4 w-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Harcamalar Listesi</span>
            {filteredExpenses.length > 0 && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-bold"
                style={{ background: "oklch(0.85 0.05 25 / 0.15)", color: "var(--shell-accent-strong)" }}
              >
                {filteredExpenses.length}
              </span>
            )}
          </button>

          {/* 3. Archives Side Modal Trigger */}
          <button
            onClick={() => setArchivesDrawerOpen(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all hover:bg-zinc-500/10 cursor-pointer"
            style={{
              background: "var(--shell-card-solid)",
              border: "1px solid var(--shell-border)",
              color: "var(--shell-nav-active-fg)",
            }}
          >
            <svg className="h-4 w-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span>Arşivler ({archivedPeriods.length})</span>
          </button>

          {/* 4. Close Period Action */}
          <button
            onClick={onClosePeriod}
            disabled={expenses.length === 0}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all hover:bg-zinc-500/10 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            style={{
              background: "var(--shell-card)",
              border: "1px solid var(--shell-border)",
              color: "var(--shell-muted)",
            }}
            title="Mevcut dönemi kapatıp arşivler klasörüne kaldırır"
          >
            <svg className="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <span>Dönemi Kapat</span>
          </button>
        </div>
      </header>

      <ErrorBanner message={error} onDismiss={clearError} />

      {/* Quick KPI Overview Grid */}
      <section aria-label="harcama özeti" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Hero Card */}
        <div
          className="flex flex-col justify-between gap-6 rounded-[22px] p-6 shadow-md transition-all hover:shadow-lg"
          style={{
            background: "linear-gradient(150deg, var(--shell-hero-from), var(--shell-hero-to))",
            color: "var(--shell-hero-fg)",
          }}
        >
          <div className="flex items-start justify-between">
            <div className="text-[12px] font-bold tracking-wider uppercase text-white/80">
              {selectedCardId ? "Seçili Kart Harcaması" : "Bu Dönem Toplam Harcama"}
            </div>
            {selectedCardId && (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{ background: "rgba(255, 255, 255, 0.2)", color: "#ffffff" }}
              >
                Filtreli
              </span>
            )}
          </div>
          <div>
            <div className="text-3xl font-extrabold tracking-tight font-mono sm:text-4xl">
              {formatTRY(totalFilteredAmount)}
            </div>
            <div className="mt-1.5 text-xs" style={{ color: "oklch(0.75 0.03 60)" }}>
              {filteredExpenses.length} işlem kaydı {selectedCardId ? "(Seçili kart)" : "(Tüm kartlar)"}
            </div>
          </div>
        </div>

        {/* KPI 2: Bütçe Hedefleri */}
        <div
          className="flex flex-col justify-between gap-4 rounded-[22px] p-6 transition-all hover:shadow-xs"
          style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}
        >
          <div className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--shell-muted)" }}>
            Bütçe Hedefleri
          </div>
          <div>
            <div className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              {budgets.length} Kategori
            </div>
            <div className="mt-1 text-xs font-medium" style={{ color: "var(--shell-muted)" }}>
              15&apos;inden 15&apos;ine hesap dönemi
            </div>
          </div>
        </div>

        {/* KPI 3: Kart Cüzdanı */}
        <div
          className="flex flex-col justify-between gap-4 rounded-[22px] p-6 transition-all hover:shadow-xs"
          style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}
        >
          <div className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--shell-muted)" }}>
            Cüzdandaki Kartlar
          </div>
          <div>
            <div className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              {cards.length} Kayıtlı Kart
            </div>
            <div className="mt-1 text-xs font-medium" style={{ color: "var(--shell-muted)" }}>
              Kredi ve banka kartları
            </div>
          </div>
        </div>

        {/* KPI 4: Arşiv */}
        <div
          className="flex flex-col justify-between gap-4 rounded-[22px] p-6 transition-all hover:shadow-xs"
          style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}
        >
          <div className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--shell-muted)" }}>
            Geçmiş Dönemler
          </div>
          <div>
            <div className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              {archivedPeriods.length} Klasör
            </div>
            <div className="mt-1 text-xs font-medium" style={{ color: "var(--shell-muted)" }}>
              Kapanmış dönem kayıtları
            </div>
          </div>
        </div>
      </section>

      {/* Credit / Debit Card Wallet Widget */}
      <CardWalletWidget
        expenses={expenses}
        selectedCardId={selectedCardId}
        onSelectCard={setSelectedCardId}
      />

      {/* Visual Analytics Grid: Category Chart & Heatmap */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div
          className="flex flex-col justify-between rounded-[22px] p-6 shadow-xs backdrop-blur-sm transition-all sm:p-7"
          style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Kategori Dağılımı
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "oklch(0.5 0.02 50 / 0.08)", color: "var(--shell-muted)" }}>
              Grafiksel Özet
            </span>
          </div>
          <ExpenseChart expenses={filteredExpenses} />
        </div>

        <div
          className="flex flex-col justify-between rounded-[22px] p-6 shadow-xs backdrop-blur-sm transition-all sm:p-7"
          style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Günlük Harcama Yoğunluğu
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "oklch(0.5 0.02 50 / 0.08)", color: "var(--shell-muted)" }}>
              Takvim Haritası
            </span>
          </div>
          <ExpenseHeatmapCalendar expenses={filteredExpenses} />
        </div>
      </section>

      {/* Section 3: Budget Goals (Hedef Bazlı Bütçe) */}
      <section
        className="rounded-[22px] p-6 shadow-xs backdrop-blur-sm transition-all sm:p-8"
        style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}
      >
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Hedef Bazlı Bütçe
          </h2>
          <p className="mt-1 text-xs font-medium" style={{ color: "var(--shell-muted)" }}>
            Kategori başına aylık hedef harcama limiti belirleyin; harcamanız hesap özeti dönemine göre (ayın 15&apos;inden bir sonraki ayın 14&apos;üne kadar) hedefe göre takip edilsin.
          </p>
        </div>
        <BudgetGoals
          budgets={budgets}
          progress={budgetProgress}
          onSave={handleSaveBudget}
          onDelete={handleDeleteBudget}
        />
      </section>

      {/* Section 4: Current Period Expenses Quick Overview */}
      <section
        className="rounded-[22px] p-6 shadow-xs backdrop-blur-sm transition-all sm:p-8"
        style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Bu Dönemin Harcamaları
            </h2>
            <p className="mt-1 text-xs font-medium" style={{ color: "var(--shell-muted)" }}>
              Kayıtlı harcamalarınızı inceleyin, süzün veya kategorilerini güncelleyin.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAddDrawerOpen(true)}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:opacity-95"
              style={{ background: "var(--shell-accent)" }}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Yeni Harcama</span>
            </button>
            <button
              onClick={() => setTableDrawerOpen(true)}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all hover:bg-zinc-500/10"
              style={{
                background: "var(--shell-card-solid)",
                border: "1px solid var(--shell-border)",
                color: "var(--shell-nav-active-fg)",
              }}
            >
              <span>Yan Panelde Genişlet</span>
              <svg className="h-3.5 w-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <ExpenseTable
          expenses={filteredExpenses}
          cards={cards}
          onDelete={handleDeleteExpense}
          onUpdateCategory={handleUpdateExpenseCategory}
        />
      </section>

      {/* ========================================================================= */}
      {/* YAN MODALLAR (SLIDE-OVER DRAWERS - ERGONOMİK, FERAH, KUTUSUZ)            */}
      {/* ========================================================================= */}

      {/* 1. YAN MODAL: HARCAMA EKLE & EKSTRE YÜKLE */}
      <SlideOverDrawer
        isOpen={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        title="Harcama Ekle & Ekstre Ayrıştır"
        subtitle="Manuel olarak yeni bir harcama kaydedin veya banka/kredi kartı ekstrenizi yükleyin"
        width="wide"
      >
        <div className="flex flex-col gap-6">
          {/* Segmented Mode Switcher */}
          <div
            className="flex items-center gap-1 rounded-2xl p-1.5"
            style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}
          >
            <button
              onClick={() => setAddMode("manual")}
              className={`flex-1 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                addMode === "manual" ? "shadow-xs" : "hover:opacity-80"
              }`}
              style={
                addMode === "manual"
                  ? {
                      background: "var(--shell-card-solid)",
                      border: "1px solid var(--shell-border)",
                      color: "var(--shell-nav-active-fg)",
                    }
                  : { color: "var(--shell-muted)" }
              }
            >
              Elle Harcama Girişi
            </button>
            <button
              onClick={() => setAddMode("statement")}
              className={`flex-1 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                addMode === "statement" ? "shadow-xs" : "hover:opacity-80"
              }`}
              style={
                addMode === "statement"
                  ? {
                      background: "var(--shell-card-solid)",
                      border: "1px solid var(--shell-border)",
                      color: "var(--shell-nav-active-fg)",
                    }
                  : { color: "var(--shell-muted)" }
              }
            >
              Ekstre Yükle (PDF / Excel)
            </button>
          </div>

          {/* Form Content */}
          {addMode === "manual" ? (
            <ExpenseForm
              onAdd={handleAddExpense}
              cards={cards}
              defaultCardId={selectedCardId}
              onSuccess={() => setAddDrawerOpen(false)}
            />
          ) : (
            <StatementUpload
              existingExpenses={expenses}
              onImport={handleImportExpenses}
              cards={cards}
              defaultCardId={selectedCardId}
              onSuccess={() => setAddDrawerOpen(false)}
            />
          )}
        </div>
      </SlideOverDrawer>

      {/* 2. YAN MODAL: TÜM HARCAMALAR LİSTESİ */}
      <SlideOverDrawer
        isOpen={tableDrawerOpen}
        onClose={() => setTableDrawerOpen(false)}
        title="Tüm Harcamalar Listesi"
        subtitle="Bu döneme ait kayıtlı harcamaları arayın, filtreleyin ve düzenleyin"
        width="extra-wide"
      >
        <div className="flex flex-col gap-6">
          <ExpenseTable
            expenses={filteredExpenses}
            cards={cards}
            onDelete={handleDeleteExpense}
            onUpdateCategory={handleUpdateExpenseCategory}
          />
        </div>
      </SlideOverDrawer>

      {/* 3. YAN MODAL: ARŞİVLENEN DÖNEMLER */}
      <SlideOverDrawer
        isOpen={archivesDrawerOpen}
        onClose={() => setArchivesDrawerOpen(false)}
        title={`Arşivlenen Dönemler (${archivedPeriods.length})`}
        subtitle="Daha önce kapatılmış hesap dönemlerinizin arşiv kayıtları ve harcama dökümleri"
        width="wide"
      >
        <div className="flex flex-col gap-5">
          {archivedPeriods.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-14 px-6 text-center"
              style={{ borderColor: "var(--shell-border)", background: "var(--shell-card)" }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: "oklch(0.5 0.02 50 / 0.08)", color: "var(--shell-muted)" }}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Henüz arşivlenmiş dönem bulunmuyor</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  Mevcut döneminizi kapattığınızda harcamalarınız silinmez, bu alanda klasörlenmiş geçmiş dönemler olarak listelenir.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[...archivedPeriods].reverse().map((period) => (
                <ArchivedPeriodCard
                  key={period.id}
                  period={period}
                  onDelete={handleDeleteArchivedPeriod}
                  onUpdate={handleUpdateArchivedPeriod}
                />
              ))}
            </div>
          )}
        </div>
      </SlideOverDrawer>
    </div>
  );
}