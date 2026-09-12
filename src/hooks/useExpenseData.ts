"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArchivedPeriod, CategoryBudget, Expense } from "@/lib/types";
import {
  addExpense,
  addExpenses,
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

  const loadAllExpenseData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [e, a, b] = await Promise.all([loadExpenses(), loadArchivedPeriods(), loadCategoryBudgets()]);
      setExpenses(e);
      setArchivedPeriods(a);
      setBudgets(b);
    } catch (err) {
      fail(err, "Harcama verileri yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllExpenseData();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_IN" ||
        event === "INITIAL_SESSION" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        loadAllExpenseData();
      } else if (event === "SIGNED_OUT") {
        setExpenses([]);
        setArchivedPeriods([]);
        setBudgets([]);
        setIsLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadAllExpenseData]);

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
