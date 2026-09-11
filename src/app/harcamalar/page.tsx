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
import ErrorBanner from "@/components/ErrorBanner";
import { useExpenseData } from "@/hooks/useExpenseData";
import { PaymentCard } from "@/lib/types";
import { getStoredCards } from "@/lib/cardsStorage";

function formatTRY(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

type TabType = "overview" | "budget" | "add" | "table" | "archives";

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: "overview", label: "Genel Bakış", icon: "📊" },
  { id: "budget", label: "Bütçe Hedefleri", icon: "🎯" },
  { id: "add", label: "Harcama Ekle / Ekstre", icon: "➕" },
  { id: "table", label: "Harcamalar Listesi", icon: "📋" },
  { id: "archives", label: "Arşivlenen Dönemler", icon: "📁" },
];

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

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cards, setCards] = useState<PaymentCard[]>([]);

  useEffect(() => {
    getStoredCards().then(setCards);
  }, []);

  // Filter expenses by selected card if card filter is active
  const filteredExpenses = useMemo(() => {
    if (!selectedCardId) return expenses;
    return expenses.filter((e) => e.cardId === selectedCardId);
  }, [expenses, selectedCardId]);

  function onClosePeriod() {
    if (expenses.length === 0) return;
    const confirmed = window.confirm(
      "Mevcut dönemi kapatmak istediğine emin misin? Harcamaların silinmeyecek, arşive taşınacak ve ana ekran yeni dönem için temizlenecek."
    );
    if (confirmed) {
      handleClosePeriod();
      setSelectedCardId(null);
    }
  }

  // Filter tabs if no archives exist
  const visibleTabs = TABS.filter((t) => t.id !== "archives" || archivedPeriods.length > 0);
  const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-8 p-6 sm:gap-10 sm:p-10">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            Harcama Analizi & Kartlarım
          </h1>
          <p className="mt-1 text-sm font-medium" style={{ color: "var(--shell-muted)" }}>
            Banka ve kredi kartı cüzdanı, bütçe takibi ve dönem harcama analizi
          </p>
        </div>
        <button
          onClick={onClosePeriod}
          disabled={expenses.length === 0}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:shadow-xs disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            background: "var(--shell-card)",
            border: "1px solid var(--shell-border)",
            color: "var(--shell-nav-active-fg)",
          }}
        >
          <span>📁</span>
          <span>Dönemi Kapat / Klasörle</span>
        </button>
      </header>

      <ErrorBanner message={error} onDismiss={clearError} />

      {/* Quick KPI Summary Bar (Aligned with Home Page Hero Aesthetic) */}
      <section aria-label="harcama özeti" className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Hero Card */}
        <div
          className="flex flex-col justify-between gap-6 rounded-[20px] p-6 shadow-md transition-all hover:shadow-lg"
          style={{
            background: "linear-gradient(150deg, var(--shell-hero-from), var(--shell-hero-to))",
            color: "var(--shell-hero-fg)",
          }}
        >
          <div className="flex items-start justify-between">
            <div className="text-[13px] font-semibold tracking-wide uppercase" style={{ color: "oklch(0.85 0.05 25)" }}>
              {selectedCardId ? "Seçili Kart Harcaması" : "Bu Dönem Toplam Harcama"}
            </div>
            {selectedCardId && (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{ background: "oklch(0.4 0.1 25 / 0.4)", color: "oklch(0.9 0.05 25)" }}
              >
                Filtreli
              </span>
            )}
          </div>
          <div>
            <div className="text-3xl font-extrabold tracking-tight sm:text-4xl">{formatTRY(totalFilteredAmount)}</div>
            <div className="mt-1.5 text-[13px]" style={{ color: "oklch(0.75 0.03 60)" }}>
              {filteredExpenses.length} adet harcama kaydı {selectedCardId ? "(Seçili kart)" : "(Tüm kartlar)"}
            </div>
          </div>
        </div>

        {/* KPI Card 2: Bütçe */}
        <div
          className="flex flex-col justify-between gap-4 rounded-[20px] p-6 transition-all hover:shadow-xs"
          style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}
        >
          <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--shell-muted)" }}>
            Bütçe Hedefleri
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              {budgets.length} Kategori
            </div>
            <div className="mt-1 text-xs" style={{ color: "var(--shell-muted)" }}>
              15&apos;inden 15&apos;ine hesap dönemi
            </div>
          </div>
        </div>

        {/* KPI Card 3: Arşiv */}
        <div
          className="flex flex-col justify-between gap-4 rounded-[20px] p-6 transition-all hover:shadow-xs"
          style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}
        >
          <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--shell-muted)" }}>
            Arşivlenen Dönemler
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              {archivedPeriods.length} Klasör
            </div>
            <div className="mt-1 text-xs" style={{ color: "var(--shell-muted)" }}>
              Kapanmış geçmiş dönem kayıtları
            </div>
          </div>
        </div>
      </section>

      {/* Real Credit/Debit Card Wallet Widget */}
      <CardWalletWidget
        expenses={expenses}
        selectedCardId={selectedCardId}
        onSelectCard={setSelectedCardId}
      />

      {/* Tabs Navigation Segmented Control */}
      <nav
        className="flex flex-wrap items-center gap-1.5 rounded-2xl p-1.5 backdrop-blur-md"
        style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}
        aria-label="Harcama sekmeleri"
      >
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
              style={
                isActive
                  ? {
                      background: "var(--shell-card-solid)",
                      border: "1px solid oklch(0.85 0.03 30 / 0.5)",
                      color: "var(--shell-nav-active-fg)",
                      boxShadow: "0 2px 10px -2px oklch(0.2 0.02 40 / 0.12)",
                      fontWeight: 600,
                    }
                  : { color: "var(--shell-muted-2)", border: "1px solid transparent" }
              }
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === "table" && filteredExpenses.length > 0 && (
                <span
                  className="ml-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={
                    isActive
                      ? { background: "oklch(0.85 0.05 25 / 0.2)", color: "var(--shell-accent-strong)" }
                      : { background: "oklch(0.5 0.02 50 / 0.12)", color: "var(--shell-muted)" }
                  }
                >
                  {filteredExpenses.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Tab Content 1: Overview Chart & Heatmap */}
      {activeTab === "overview" && (
        <section className="flex flex-col gap-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div
              className="rounded-[22px] p-6 shadow-xs backdrop-blur-sm transition-all sm:p-7"
              style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}
            >
              <h2 className="mb-4 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Kategori Dağılımı</h2>
              <ExpenseChart expenses={filteredExpenses} />
            </div>
            <div
              className="rounded-[22px] p-6 shadow-xs backdrop-blur-sm transition-all sm:p-7"
              style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}
            >
              <h2 className="mb-4 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Günlük Yoğunluk Haritası</h2>
              <ExpenseHeatmapCalendar expenses={filteredExpenses} />
            </div>
          </div>

          {/* Quick Table View in Overview for Seamless UX */}
          <div
            className="rounded-[22px] p-6 shadow-xs backdrop-blur-sm transition-all sm:p-8"
            style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Bu Dönemin Harcamaları</h2>
                <p className="text-xs font-medium" style={{ color: "var(--shell-muted)" }}>
                  Kayıtlı harcamalarınızı hızlıca inceleyebilir ve filtreleyebilirsiniz
                </p>
              </div>
              <button
                onClick={() => setActiveTab("add")}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:opacity-95"
                style={{ background: "var(--shell-accent)" }}
              >
                <span>➕</span>
                <span>Yeni Harcama / Ekstre</span>
              </button>
            </div>
            <ExpenseTable
              expenses={filteredExpenses}
              cards={cards}
              onDelete={handleDeleteExpense}
              onUpdateCategory={handleUpdateExpenseCategory}
            />
          </div>
        </section>
      )}

      {/* Tab Content 2: Budget Goals */}
      {activeTab === "budget" && (
        <section
          className="rounded-[22px] p-6 shadow-xs backdrop-blur-sm transition-all sm:p-8"
          style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}
        >
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Hedef Bazlı Bütçe</h2>
          <p className="mb-6 text-xs font-medium" style={{ color: "var(--shell-muted)" }}>
            Kategori başına aylık bir hedef belirle; harcaman hesap özeti dönemine göre (ayın 15&apos;inden bir sonraki ayın 14&apos;üne kadar) hedefe ve bir önceki döneme göre karşılaştırılsın.
          </p>
          <BudgetGoals budgets={budgets} progress={budgetProgress} onSave={handleSaveBudget} onDelete={handleDeleteBudget} />
        </section>
      )}

      {/* Tab Content 3: Add Expense / Statement Upload */}
      {activeTab === "add" && (
        <section
          className="rounded-[22px] p-6 shadow-xs backdrop-blur-sm transition-all sm:p-8"
          style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}
        >
          <h2 className="mb-6 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Harcama Ekle ve Ekstre Yükle</h2>
          <div className="grid gap-8 lg:grid-cols-2">
            <StatementUpload existingExpenses={expenses} onImport={handleImportExpenses} cards={cards} defaultCardId={selectedCardId} />
            <ExpenseForm onAdd={handleAddExpense} cards={cards} defaultCardId={selectedCardId} />
          </div>
        </section>
      )}

      {/* Tab Content 4: Expenses Table */}
      {activeTab === "table" && (
        <section
          className="rounded-[22px] p-6 shadow-xs backdrop-blur-sm transition-all sm:p-8"
          style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Harcamalar Listesi</h2>
              <p className="text-xs font-medium" style={{ color: "var(--shell-muted)" }}>
                Kayıtlı harcamalarını görebilir, silebilir veya kategorisine tıklayarak değiştirebilirsin.
              </p>
            </div>
            {selectedCardId && (
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: "oklch(0.85 0.1 70 / 0.3)", color: "oklch(0.45 0.12 60)" }}
              >
                🔍 Kart Filtresi Aktif
              </span>
            )}
          </div>
          <ExpenseTable
            expenses={filteredExpenses}
            cards={cards}
            onDelete={handleDeleteExpense}
            onUpdateCategory={handleUpdateExpenseCategory}
          />
        </section>
      )}

      {/* Tab Content 5: Archived Periods */}
      {activeTab === "archives" && archivedPeriods.length > 0 && (
        <section
          className="rounded-[22px] p-6 shadow-xs backdrop-blur-sm transition-all sm:p-8"
          style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}
        >
          <h2 className="mb-5 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Arşivlenen Dönemler ({archivedPeriods.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...archivedPeriods].reverse().map((period) => (
              <ArchivedPeriodCard
                key={period.id}
                period={period}
                onDelete={handleDeleteArchivedPeriod}
                onUpdate={handleUpdateArchivedPeriod}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
