"use client";

import ExpenseForm from "@/components/ExpenseForm";
import ExpenseChart from "@/components/ExpenseChart";
import ExpenseTable from "@/components/ExpenseTable";
import ExpenseHeatmapCalendar from "@/components/ExpenseHeatmapCalendar";
import BudgetGoals from "@/components/BudgetGoals";
import ArchivedPeriodCard from "@/components/ArchivedPeriodCard";
import StatementUpload from "@/components/StatementUpload";
import { useExpenseData } from "@/hooks/useExpenseData";

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
    totalExpenses,
    archivedPeriods,
    handleClosePeriod,
    handleDeleteArchivedPeriod,
    handleUpdateArchivedPeriod,
    budgets,
    budgetProgress,
    handleSaveBudget,
    handleDeleteBudget,
  } = useExpenseData();

  function onClosePeriod() {
    if (expenses.length === 0) return;
    const confirmed = window.confirm(
      "Mevcut dönemi kapatmak istediğine emin misin? Harcamaların silinmeyecek, arşive taşınacak ve ana ekran yeni dönem için temizlenecek."
    );
    if (confirmed) handleClosePeriod();
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Harcama Analizi</h1>
          <p className="text-sm text-zinc-500">Kategori bazlı harcama takibi</p>
        </div>
        <button
          onClick={onClosePeriod}
          disabled={expenses.length === 0}
          className="rounded border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          📁 Dönemi Kapat / Klasörle
        </button>
      </header>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-4">
          <p className="text-sm text-zinc-500">Toplam Harcama</p>
          <p className="text-xl font-semibold">{formatTRY(totalExpenses)}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="mb-2 text-lg font-semibold">Kategori Dağılımı</h2>
            <ExpenseChart expenses={expenses} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Harcama Yoğunluk Takvimi</h2>
            <p className="mb-3 text-xs text-zinc-500">
              Finansal Takvim&apos;den bağımsızdır, sadece bu dönemin harcamalarını gösterir.
            </p>
            <ExpenseHeatmapCalendar expenses={expenses} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Hedef Bazlı Bütçe</h2>
        <p className="mb-3 text-xs text-zinc-500">
          Kategori başına aylık bir hedef belirle; harcaman hesap özeti dönemine göre (ayın 15&apos;inden bir
          sonraki ayın 14&apos;üne kadar) hedefe ve bir önceki döneme göre karşılaştırılsın.
        </p>
        <BudgetGoals budgets={budgets} progress={budgetProgress} onSave={handleSaveBudget} onDelete={handleDeleteBudget} />
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-3 text-lg font-semibold">Harcama Ekle</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <StatementUpload existingExpenses={expenses} onImport={handleImportExpenses} />
          <ExpenseForm onAdd={handleAddExpense} />
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-2 text-lg font-semibold">Harcamalar</h2>
        <p className="mb-2 text-xs text-zinc-500">Bir kategoriyi yanlış bulursan üzerine tıklayıp değiştirebilirsin.</p>
        <ExpenseTable expenses={expenses} onDelete={handleDeleteExpense} onUpdateCategory={handleUpdateExpenseCategory} />
      </section>

      {archivedPeriods.length > 0 && (
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-3 text-lg font-semibold">Arşivlenen Dönemler ({archivedPeriods.length})</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
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
