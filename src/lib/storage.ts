import { ArchivedPeriod, CalendarNote, CategoryBudget, DividendEntry, Expense, PortfolioSnapshot, Transaction } from "./types";
import { AutoDividendEvent } from "./dividendCalendar";

const STORAGE_KEY = "financial-diary-transactions";
const EXPENSES_STORAGE_KEY = "financial-diary-expenses";
const CALENDAR_STORAGE_KEY = "financial-diary-calendar-notes";
const ARCHIVED_PERIODS_STORAGE_KEY = "financial-diary-archived-periods";
const PORTFOLIO_SNAPSHOTS_STORAGE_KEY = "financial-diary-portfolio-snapshots";
const BUDGETS_STORAGE_KEY = "financial-diary-category-budgets";
const DIVIDENDS_STORAGE_KEY = "financial-diary-dividends";
const DIVIDEND_AUTO_CACHE_KEY = "financial-diary-dividend-auto-cache";
const MAX_PORTFOLIO_SNAPSHOTS = 90;

export function loadTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Transaction[];
  } catch {
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

export function addTransaction(transaction: Transaction): Transaction[] {
  const transactions = [...loadTransactions(), transaction];
  saveTransactions(transactions);
  return transactions;
}

export function deleteTransaction(id: string): Transaction[] {
  const transactions = loadTransactions().filter((t) => t.id !== id);
  saveTransactions(transactions);
  return transactions;
}

export function loadExpenses(): Expense[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(EXPENSES_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Expense[];
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
}

export function addExpense(expense: Expense): Expense[] {
  const expenses = [...loadExpenses(), expense];
  saveExpenses(expenses);
  return expenses;
}

export function deleteExpense(id: string): Expense[] {
  const expenses = loadExpenses().filter((e) => e.id !== id);
  saveExpenses(expenses);
  return expenses;
}

export function updateExpenseCategory(id: string, category: string): Expense[] {
  const expenses = loadExpenses().map((e) => (e.id === id ? { ...e, category } : e));
  saveExpenses(expenses);
  return expenses;
}

export function addExpenses(newExpenses: Expense[]): Expense[] {
  const expenses = [...loadExpenses(), ...newExpenses];
  saveExpenses(expenses);
  return expenses;
}

export function loadCalendarNotes(): CalendarNote[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(CALENDAR_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CalendarNote[];
  } catch {
    return [];
  }
}

export function saveCalendarNotes(notes: CalendarNote[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(notes));
}

export function addCalendarNote(note: CalendarNote): CalendarNote[] {
  const notes = [...loadCalendarNotes(), note];
  saveCalendarNotes(notes);
  return notes;
}

export function deleteCalendarNote(id: string): CalendarNote[] {
  const notes = loadCalendarNotes().filter((n) => n.id !== id);
  saveCalendarNotes(notes);
  return notes;
}

export function loadArchivedPeriods(): ArchivedPeriod[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(ARCHIVED_PERIODS_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ArchivedPeriod[];
  } catch {
    return [];
  }
}

export function saveArchivedPeriods(periods: ArchivedPeriod[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ARCHIVED_PERIODS_STORAGE_KEY, JSON.stringify(periods));
}

export function deleteArchivedPeriod(id: string): ArchivedPeriod[] {
  const updated = loadArchivedPeriods().filter((p) => p.id !== id);
  saveArchivedPeriods(updated);
  return updated;
}

export function updateArchivedPeriod(
  id: string,
  updates: Partial<Pick<ArchivedPeriod, "name" | "note" | "startDate" | "endDate">>
): ArchivedPeriod[] {
  const updated = loadArchivedPeriods().map((p) => (p.id === id ? { ...p, ...updates } : p));
  saveArchivedPeriods(updated);
  return updated;
}

// Dönemi Kapat: aktif harcamaları silmeden arşivler, aktif listeyi boşaltır.
// Başlangıç tarihi = önceki dönemin bitişinden bir gün sonrası (önceki dönem
// yoksa aktif harcamaların en erkeni); bitiş tarihi = bugün. Aynı gün içinde
// art arda birden fazla dönem kapatılırsa (ör. geçmişe dönük klasörleme)
// başlangıç bitişi geçemez — bu durumda tek günlük bir dönem oluşur.
export function closePeriod(currentExpenses: Expense[]): {
  archivedPeriods: ArchivedPeriod[];
  expenses: Expense[];
} {
  const archivedPeriods = loadArchivedPeriods();
  const endDate = new Date().toISOString().slice(0, 10);

  const lastPeriod = archivedPeriods[archivedPeriods.length - 1];
  let startDate: string;
  if (lastPeriod) {
    const nextDay = new Date(lastPeriod.endDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const candidateStart = nextDay.toISOString().slice(0, 10);
    startDate = candidateStart > endDate ? endDate : candidateStart;
  } else if (currentExpenses.length > 0) {
    const earliest = currentExpenses.reduce((min, e) => (e.date < min ? e.date : min), currentExpenses[0].date);
    startDate = earliest > endDate ? endDate : earliest;
  } else {
    startDate = endDate;
  }

  const newPeriod: ArchivedPeriod = {
    id: crypto.randomUUID(),
    startDate,
    endDate,
    createdAt: new Date().toISOString(),
    expenses: currentExpenses,
  };

  const updatedPeriods = [...archivedPeriods, newPeriod];
  saveArchivedPeriods(updatedPeriods);
  saveExpenses([]);

  return { archivedPeriods: updatedPeriods, expenses: [] };
}

export function loadPortfolioSnapshots(): PortfolioSnapshot[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(PORTFOLIO_SNAPSHOTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PortfolioSnapshot[];
  } catch {
    return [];
  }
}

// Portföy Değeri trend grafiği: geriye dönük veri yoktu, bu yüzden geçmiş
// üretilmez — bugünden itibaren her ziyarette günün değeri kaydedilir/güncellenir
// ve grafik zamanla gerçek verilerle birikir.
export function recordPortfolioSnapshot(value: number): PortfolioSnapshot[] {
  if (typeof window === "undefined") return [];
  const today = new Date().toISOString().slice(0, 10);
  const existing = loadPortfolioSnapshots().filter((s) => s.date !== today);
  const updated = [...existing, { date: today, value }]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-MAX_PORTFOLIO_SNAPSHOTS);
  window.localStorage.setItem(PORTFOLIO_SNAPSHOTS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

// Bir işlem/harcama/dönem silindiğinde geçmiş grafiğin artık var olmayan veriye
// ait eski bir toplamı göstermeye devam etmemesi için trend geçmişi sıfırlanır.
export function clearPortfolioSnapshots(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PORTFOLIO_SNAPSHOTS_STORAGE_KEY);
}

export function loadCategoryBudgets(): CategoryBudget[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(BUDGETS_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CategoryBudget[];
  } catch {
    return [];
  }
}

export function saveCategoryBudget(category: string, monthlyGoal: number): CategoryBudget[] {
  const budgets = loadCategoryBudgets().filter((b) => b.category !== category);
  const updated = [...budgets, { category, monthlyGoal }];
  if (typeof window !== "undefined") {
    window.localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function deleteCategoryBudget(category: string): CategoryBudget[] {
  const updated = loadCategoryBudgets().filter((b) => b.category !== category);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function loadDividends(): DividendEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(DIVIDENDS_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DividendEntry[];
  } catch {
    return [];
  }
}

export function addDividend(entry: DividendEntry): DividendEntry[] {
  const entries = [...loadDividends(), entry];
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DIVIDENDS_STORAGE_KEY, JSON.stringify(entries));
  }
  return entries;
}

export function deleteDividend(id: string): DividendEntry[] {
  const entries = loadDividends().filter((d) => d.id !== id);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DIVIDENDS_STORAGE_KEY, JSON.stringify(entries));
  }
  return entries;
}

interface DividendAutoCache {
  tickers: string; // virgülle ayrılmış, karşılaştırma anahtarı
  fetchedAt: string; // YYYY-MM-DD
  events: AutoDividendEvent[];
}

// Nasdaq'ın yanıt süresi tekrarlanan isteklerde çok yavaşlayabiliyor (bkz. dividendCalendar.ts);
// bu yüzden aynı hisse listesi için günde bir defadan fazla otomatik çekim yapılmaz.
export function loadDividendAutoCache(tickers: string): AutoDividendEvent[] | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DIVIDEND_AUTO_CACHE_KEY);
  if (!raw) return null;
  try {
    const cache = JSON.parse(raw) as DividendAutoCache;
    const today = new Date().toISOString().slice(0, 10);
    if (cache.tickers !== tickers || cache.fetchedAt !== today) return null;
    return cache.events;
  } catch {
    return null;
  }
}

export function saveDividendAutoCache(tickers: string, events: AutoDividendEvent[]): void {
  if (typeof window === "undefined") return;
  const cache: DividendAutoCache = { tickers, fetchedAt: new Date().toISOString().slice(0, 10), events };
  window.localStorage.setItem(DIVIDEND_AUTO_CACHE_KEY, JSON.stringify(cache));
}
