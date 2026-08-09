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

  useEffect(() => {
    Promise.all([loadExpenses(), loadArchivedPeriods(), loadCategoryBudgets()]).then(([e, a, b]) => {
      setExpenses(e);
      setArchivedPeriods(a);
      setBudgets(b);
      setIsLoading(false);
    });
  }, []);

  async function handleSaveBudget(category: string, monthlyGoal: number) {
    setBudgets(await saveCategoryBudget(category, monthlyGoal));
  }

  async function handleDeleteBudget(category: string) {
    setBudgets(await deleteCategoryBudget(category));
  }

  async function handleAddExpense(e: Expense) {
    setExpenses(await addExpense(e));
  }

  async function handleDeleteExpense(id: string) {
    setExpenses(await deleteExpense(id));
    clearPortfolioSnapshots();
  }

  async function handleUpdateExpenseCategory(id: string, category: string) {
    setExpenses(await updateExpenseCategory(id, category));
  }

  async function handleImportExpenses(newExpenses: Expense[]) {
    setExpenses(await addExpenses(newExpenses));
  }

  async function handleClosePeriod() {
    const result = await closePeriod(expenses);
    setArchivedPeriods(result.archivedPeriods);
    setExpenses(result.expenses);
  }

  async function handleDeleteArchivedPeriod(id: string) {
    setArchivedPeriods(await deleteArchivedPeriod(id));
    clearPortfolioSnapshots();
  }

  async function handleUpdateArchivedPeriod(
    id: string,
    updates: Partial<Pick<ArchivedPeriod, "name" | "note" | "startDate" | "endDate">>
  ) {
    setArchivedPeriods(await updateArchivedPeriod(id, updates));
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
  };
}
