import { supabase } from "./supabase";
import { Expense } from "./types";
import { addExpense, loadExpenses } from "./storage";

const LOCAL_EXPENSES_KEY = "financial-diary-expenses";
const MIGRATED_FLAG_KEY = "financial_diary_local_data_migrated_v1";

export function checkHasUnmigratedLocalData(): boolean {
  if (typeof window === "undefined") return false;
  const migrated = localStorage.getItem(MIGRATED_FLAG_KEY);
  if (migrated === "true") return false;

  const rawExpenses = localStorage.getItem(LOCAL_EXPENSES_KEY);
  if (!rawExpenses) return false;
  try {
    const parsed = JSON.parse(rawExpenses);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

export async function migrateLocalDataToSupabase(): Promise<{ count: number; error?: string }> {
  if (typeof window === "undefined") return { count: 0 };
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { count: 0, error: "Verileri hesabınıza aktarmak için önce giriş yapmalısınız." };
  }

  const rawExpenses = localStorage.getItem(LOCAL_EXPENSES_KEY);
  if (!rawExpenses) return { count: 0 };

  try {
    const localExpenses: Expense[] = JSON.parse(rawExpenses);
    if (!Array.isArray(localExpenses) || localExpenses.length === 0) {
      return { count: 0 };
    }

    // Get current cloud expenses to avoid duplicates
    const cloudExpenses = await loadExpenses();
    const cloudIds = new Set(cloudExpenses.map((e: Expense) => e.id));

    let migratedCount = 0;
    for (const exp of localExpenses) {
      if (!cloudIds.has(exp.id)) {
        await addExpense(exp);
        migratedCount++;
      }
    }

    // Mark migration complete
    localStorage.setItem(MIGRATED_FLAG_KEY, "true");
    return { count: migratedCount };
  } catch (err) {
    return { count: 0, error: (err as Error).message };
  }
}
