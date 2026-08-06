"use client";

import { useState, useMemo } from "react";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseChart from "@/components/ExpenseChart";
import ExpenseTable from "@/components/ExpenseTable";
import ExpenseHeatmapCalendar from "@/components/ExpenseHeatmapCalendar";
import BudgetGoals from "@/components/BudgetGoals";
import ArchivedPeriodCard from "@/components/ArchivedPeriodCard";
import StatementUpload from "@/components/StatementUpload";
import CardWalletWidget from "@/components/CardWalletWidget";
import { useExpenseData } from "@/hooks/useExpenseData";

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
  } = useExpenseData();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

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

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6 sm:p-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Harcama Analizi & Kartlarım</h1>
          <p className="mt-1 text-sm text-zinc-500">Banka/kredi kartı takibi, bütçe yönetimi ve dönem analizi</p>
        </div>
        <button
          onClick={onClosePeriod}
          disabled={expenses.length === 0}
          className="flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <span>📁</span> Dönemi Kapat / Klasörle
        </button>
      </header>

      {/* Real Credit/Debit Card Wallet Widget */}
      <CardWalletWidget
        expenses={expenses}
        selectedCardId={selectedCardId}
        onSelectCard={setSelectedCardId}
      />

      {/* Quick KPI Summary Bar */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs uppercase tracking-wider text-zinc-500">
            {selectedCardId ? "Seçili Kart Harcaması" : "Bu Dönem Toplam Harcama"}
          </div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {formatTRY(filteredExpenses.reduce((sum, e) => sum + e.amount, 0))}
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            {filteredExpenses.length} adet harcama kaydı {selectedCardId && "(Filtreli)"}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Bütçe Takibi</div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {budgets.length} Kategori
          </div>
          <div className="mt-1 text-xs text-zinc-400">15&apos;inden 15&apos;ine hesap dönemi</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Arşivlenen Dönemler</div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {archivedPeriods.length} Klasör
          </div>
          <div className="mt-1 text-xs text-zinc-400">Kapanmış geçmiş dönemler</div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <nav className="flex flex-wrap gap-1.5 border-b border-zinc-200 pb-2 dark:border-zinc-800" aria-label="Harcama sekmeleri">
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-black"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === "table" && filteredExpenses.length > 0 && (
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                    isActive ? "bg-zinc-700 text-zinc-100 dark:bg-zinc-300 dark:text-zinc-900" : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {filteredExpenses.length}
                </span>
              )}
              {tab.id === "archives" && archivedPeriods.length > 0 && (
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                    isActive ? "bg-zinc-700 text-zinc-100 dark:bg-zinc-300 dark:text-zinc-900" : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {archivedPeriods.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Tab Content 1: Overview */}
      {activeTab === "overview" && (
        <section className="flex flex-col gap-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
              <h2 className="mb-4 text-lg font-semibold tracking-tight">Kategori Dağılımı</h2>
              <ExpenseChart expenses={filteredExpenses} />
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
              <h2 className="text-lg font-semibold tracking-tight">Harcama Yoğunluk Takvimi</h2>
              <p className="mb-4 text-xs text-zinc-500">
                Finansal Takvim&apos;den bağımsızdır, sadece bu dönemin harcamalarını gün bazlı yoğunlukla gösterir.
              </p>
              <ExpenseHeatmapCalendar expenses={filteredExpenses} />
            </div>
          </div>
        </section>
      )}

      {/* Tab Content 2: Budget Goals */}
      {activeTab === "budget" && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <h2 className="text-lg font-semibold tracking-tight">Hedef Bazlı Bütçe</h2>
          <p className="mb-4 text-xs text-zinc-500">
            Kategori başına aylık bir hedef belirle; harcaman hesap özeti dönemine göre (ayın 15&apos;inden bir sonraki ayın 14&apos;üne kadar) hedefe ve bir önceki döneme göre karşılaştırılsın.
          </p>
          <BudgetGoals budgets={budgets} progress={budgetProgress} onSave={handleSaveBudget} onDelete={handleDeleteBudget} />
        </section>
      )}

      {/* Tab Content 3: Add Expense / Statement Upload */}
      {activeTab === "add" && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Harcama Ekle ve Ekstre Yükle</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <StatementUpload existingExpenses={expenses} onImport={handleImportExpenses} />
            <ExpenseForm onAdd={handleAddExpense} />
          </div>
        </section>
      )}

      {/* Tab Content 4: Expenses Table */}
      {activeTab === "table" && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Harcamalar Listesi</h2>
              <p className="text-xs text-zinc-500">
                Kayıtlı harcamalarını görebilir, silebilir veya kategorisine tıklayarak değiştirebilirsin.
              </p>
            </div>
            {selectedCardId && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                🔍 Kart Filtresi Aktif
              </span>
            )}
          </div>
          <ExpenseTable expenses={filteredExpenses} onDelete={handleDeleteExpense} onUpdateCategory={handleUpdateExpenseCategory} />
        </section>
      )}

      {/* Tab Content 5: Archived Periods */}
      {activeTab === "archives" && archivedPeriods.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Arşivlenen Dönemler ({archivedPeriods.length})</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
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
