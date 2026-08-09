"use client";

import { useEffect, useState } from "react";
import { ArchivedPeriod, CategoryBudget, Expense } from "@/lib/types";
import {
  addExpense,
  addExpenses,
  clearPortfolioSnapshots,
  closePeriod,
  deleteArchivedPeriod,
  deleteCategoryBudget,
  deleteExpense,
  loadArchivedPeriods,
  loadCategoryBudgets,
  loadExpenses,
  saveCategoryBudget,
  updateArchivedPeriod,
  updateExpenseCategory,
} from "@/lib/storage";
import { computeBudgetProgress } from "@/lib/budgetStats";

export function useExpenseData() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [archivedPeriods, setArchivedPeriods] = useState<ArchivedPeriod[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadExpenses(), loadArchivedPeriods(), loadCategoryBudgets()]).then(([e, a, b]) => {
      setExpenses(e);
      setArchivedPeriods(a);
      setBudgets(b);
      setIsLoading(false);
    });
  }, []);

  function fail(err: unknown, fallback: string) {
    setError(err instanceof Error ? err.message : fallback);
  }

  async function handleSaveBudget(category: string, monthlyGoal: number) {
    try {
      setBudgets(await saveCategoryBudget(category, monthlyGoal));
    } catch (err) {
      fail(err, "Bütçe kaydedilemedi.");
    }
  }

  async function handleDeleteBudget(category: string) {
    try {
      setBudgets(await deleteCategoryBudget(category));
    } catch (err) {
      fail(err, "Bütçe silinemedi.");
    }
  }

  async function handleAddExpense(e: Expense) {
    try {
      setExpenses(await addExpense(e));
    } catch (err) {
      fail(err, "Harcama eklenemedi.");
    }
  }

  async function handleDeleteExpense(id: string) {
    try {
      setExpenses(await deleteExpense(id));
      await clearPortfolioSnapshots();
    } catch (err) {
      fail(err, "Harcama silinemedi.");
    }
  }

  async function handleUpdateExpenseCategory(id: string, category: string) {
    try {
      setExpenses(await updateExpenseCategory(id, category));
    } catch (err) {
      fail(err, "Kategori güncellenemedi.");
    }
  }

  async function handleImportExpenses(newExpenses: Expense[]) {
    try {
      setExpenses(await addExpenses(newExpenses));
    } catch (err) {
      fail(err, "Ekstre içe aktarılamadı.");
    }
  }

  async function handleClosePeriod() {
    try {
      const result = await closePeriod(expenses);
      setArchivedPeriods(result.archivedPeriods);
      setExpenses(result.expenses);
    } catch (err) {
      fail(err, "Dönem kapatılamadı.");
    }
  }

  async function handleDeleteArchivedPeriod(id: string) {
    try {
      setArchivedPeriods(await deleteArchivedPeriod(id));
      await clearPortfolioSnapshots();
    } catch (err) {
      fail(err, "Dönem silinemedi.");
    }
  }

  async function handleUpdateArchivedPeriod(
    id: string,
    updates: Partial<Pick<ArchivedPeriod, "name" | "note" | "startDate" | "endDate">>
  ) {
    try {
      setArchivedPeriods(await updateArchivedPeriod(id, updates));
    } catch (err) {
      fail(err, "Dönem güncellenemedi.");
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const archivedExpenses = archivedPeriods.flatMap((p) => p.expenses);
  const budgetProgress = computeBudgetProgress(expenses, archivedExpenses, budgets);

  return {
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
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
