"use client";

import { useState } from "react";
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
  const [expenses, setExpenses] = useState<Expense[]>(() => loadExpenses());
  const [archivedPeriods, setArchivedPeriods] = useState<ArchivedPeriod[]>(() => loadArchivedPeriods());
  const [budgets, setBudgets] = useState<CategoryBudget[]>(() => loadCategoryBudgets());

  function handleSaveBudget(category: string, monthlyGoal: number) {
    setBudgets(saveCategoryBudget(category, monthlyGoal));
  }

  function handleDeleteBudget(category: string) {
    setBudgets(deleteCategoryBudget(category));
  }

  function handleAddExpense(e: Expense) {
    setExpenses(addExpense(e));
  }

  function handleDeleteExpense(id: string) {
    setExpenses(deleteExpense(id));
    clearPortfolioSnapshots();
  }

  function handleUpdateExpenseCategory(id: string, category: string) {
    setExpenses(updateExpenseCategory(id, category));
  }

  function handleImportExpenses(newExpenses: Expense[]) {
    setExpenses(addExpenses(newExpenses));
  }

  function handleClosePeriod() {
    const result = closePeriod(expenses);
    setArchivedPeriods(result.archivedPeriods);
    setExpenses(result.expenses);
  }

  function handleDeleteArchivedPeriod(id: string) {
    setArchivedPeriods(deleteArchivedPeriod(id));
    clearPortfolioSnapshots();
  }

  function handleUpdateArchivedPeriod(
    id: string,
    updates: Partial<Pick<ArchivedPeriod, "name" | "note" | "startDate" | "endDate">>
  ) {
    setArchivedPeriods(updateArchivedPeriod(id, updates));
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
  };
}
