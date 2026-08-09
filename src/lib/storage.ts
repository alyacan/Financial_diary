import { ArchivedPeriod, CalendarNote, CategoryBudget, DividendEntry, Expense, PortfolioSnapshot, Transaction } from "./types";
import { AutoDividendEvent } from "./dividendCalendar";
import { supabase } from "./supabase";

const STORAGE_KEY = "financial-diary-transactions";
const CALENDAR_STORAGE_KEY = "financial-diary-calendar-notes";
const PORTFOLIO_SNAPSHOTS_STORAGE_KEY = "financial-diary-portfolio-snapshots";
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

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

interface ExpenseRow {
  id: string;
  date: string;
  category: string;
  amount: number;
  note: string | null;
  card_id: string | null;
}

function fromExpenseRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    date: row.date,
    category: row.category,
    amount: Number(row.amount),
    note: row.note ?? undefined,
    cardId: row.card_id ?? undefined,
  };
}

export async function loadExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("id, date, category, amount, note, card_id")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map(fromExpenseRow);
}

export async function addExpense(expense: Expense): Promise<Expense[]> {
  const userId = await currentUserId();
  if (!userId) return loadExpenses();
  await supabase.from("expenses").insert({
    id: expense.id,
    user_id: userId,
    date: expense.date,
    category: expense.category,
    amount: expense.amount,
    note: expense.note ?? null,
    card_id: expense.cardId ?? null,
  });
  return loadExpenses();
}

export async function deleteExpense(id: string): Promise<Expense[]> {
  await supabase.from("expenses").delete().eq("id", id);
  return loadExpenses();
}

export async function updateExpenseCategory(id: string, category: string): Promise<Expense[]> {
  await supabase.from("expenses").update({ category }).eq("id", id);
  return loadExpenses();
}

export async function addExpenses(newExpenses: Expense[]): Promise<Expense[]> {
  const userId = await currentUserId();
  if (!userId || newExpenses.length === 0) return loadExpenses();
  const rows = newExpenses.map((e) => ({
    id: e.id,
    user_id: userId,
    date: e.date,
    category: e.category,
    amount: e.amount,
    note: e.note ?? null,
    card_id: e.cardId ?? null,
  }));
  await supabase.from("expenses").insert(rows);
  return loadExpenses();
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

interface ArchivedPeriodRow {
  id: string;
  name: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
  note: string | null;
}

interface ArchivedPeriodExpenseRow extends ExpenseRow {
  archived_period_id: string;
}

export async function loadArchivedPeriods(): Promise<ArchivedPeriod[]> {
  const { data: periods, error } = await supabase
    .from("archived_periods")
    .select("id, name, start_date, end_date, created_at, note")
    .order("created_at", { ascending: true });
  if (error || !periods || periods.length === 0) return [];

  const ids = (periods as ArchivedPeriodRow[]).map((p) => p.id);
  const { data: expenseRows } = await supabase
    .from("archived_period_expenses")
    .select("id, archived_period_id, date, category, amount, note, card_id")
    .in("archived_period_id", ids);

  const grouped = new Map<string, Expense[]>();
  for (const row of (expenseRows as ArchivedPeriodExpenseRow[] | null) ?? []) {
    const list = grouped.get(row.archived_period_id) ?? [];
    list.push(fromExpenseRow(row));
    grouped.set(row.archived_period_id, list);
  }

  return (periods as ArchivedPeriodRow[]).map((p) => ({
    id: p.id,
    name: p.name ?? undefined,
    startDate: p.start_date,
    endDate: p.end_date,
    createdAt: p.created_at,
    note: p.note ?? undefined,
    expenses: grouped.get(p.id) ?? [],
  }));
}

export async function deleteArchivedPeriod(id: string): Promise<ArchivedPeriod[]> {
  await supabase.from("archived_periods").delete().eq("id", id);
  return loadArchivedPeriods();
}

export async function updateArchivedPeriod(
  id: string,
  updates: Partial<Pick<ArchivedPeriod, "name" | "note" | "startDate" | "endDate">>
): Promise<ArchivedPeriod[]> {
  const patch: Record<string, unknown> = {};
  if ("name" in updates) patch.name = updates.name ?? null;
  if ("note" in updates) patch.note = updates.note ?? null;
  if ("startDate" in updates) patch.start_date = updates.startDate;
  if ("endDate" in updates) patch.end_date = updates.endDate;
  await supabase.from("archived_periods").update(patch).eq("id", id);
  return loadArchivedPeriods();
}

// Dönemi Kapat: aktif harcamaları silmeden arşivler, aktif listeyi boşaltır.
// Başlangıç tarihi = önceki dönemin bitişinden bir gün sonrası (önceki dönem
// yoksa aktif harcamaların en erkeni); bitiş tarihi = bugün. Aynı gün içinde
// art arda birden fazla dönem kapatılırsa (ör. geçmişe dönük klasörleme)
// başlangıç bitişi geçemez — bu durumda tek günlük bir dönem oluşur.
export async function closePeriod(currentExpenses: Expense[]): Promise<{
  archivedPeriods: ArchivedPeriod[];
  expenses: Expense[];
}> {
  const userId = await currentUserId();
  if (!userId) return { archivedPeriods: await loadArchivedPeriods(), expenses: currentExpenses };

  const archivedPeriods = await loadArchivedPeriods();
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

  const periodId = crypto.randomUUID();
  await supabase.from("archived_periods").insert({
    id: periodId,
    user_id: userId,
    start_date: startDate,
    end_date: endDate,
    created_at: new Date().toISOString(),
  });

  if (currentExpenses.length > 0) {
    await supabase.from("archived_period_expenses").insert(
      currentExpenses.map((e) => ({
        id: crypto.randomUUID(),
        archived_period_id: periodId,
        user_id: userId,
        date: e.date,
        category: e.category,
        amount: e.amount,
        note: e.note ?? null,
        card_id: e.cardId ?? null,
      }))
    );
    await supabase.from("expenses").delete().eq("user_id", userId);
  }

  return { archivedPeriods: await loadArchivedPeriods(), expenses: [] };
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

interface BudgetRow {
  category: string;
  monthly_goal: number;
}

export async function loadCategoryBudgets(): Promise<CategoryBudget[]> {
  const { data, error } = await supabase.from("category_budgets").select("category, monthly_goal");
  if (error || !data) return [];
  return (data as BudgetRow[]).map((row) => ({ category: row.category, monthlyGoal: Number(row.monthly_goal) }));
}

export async function saveCategoryBudget(category: string, monthlyGoal: number): Promise<CategoryBudget[]> {
  const userId = await currentUserId();
  if (!userId) return loadCategoryBudgets();
  await supabase
    .from("category_budgets")
    .upsert({ user_id: userId, category, monthly_goal: monthlyGoal }, { onConflict: "user_id,category" });
  return loadCategoryBudgets();
}

export async function deleteCategoryBudget(category: string): Promise<CategoryBudget[]> {
  await supabase.from("category_budgets").delete().eq("category", category);
  return loadCategoryBudgets();
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

const ECONOMIC_EVENTS_CACHE_KEY = "financial-diary-economic-events-cache";

export interface EconomicEventsCache {
  timestamp: number;
  events: unknown[];
}

export function loadEconomicEventsCache(maxAgeHours = 24): unknown[] | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ECONOMIC_EVENTS_CACHE_KEY);
  if (!raw) return null;
  try {
    const cache = JSON.parse(raw) as EconomicEventsCache;
    const ageInHours = (Date.now() - cache.timestamp) / (1000 * 60 * 60);
    if (ageInHours > maxAgeHours) return null;
    return cache.events;
  } catch {
    return null;
  }
}

export function saveEconomicEventsCache(events: unknown[]): void {
  if (typeof window === "undefined") return;
  const cache: EconomicEventsCache = { timestamp: Date.now(), events };
  window.localStorage.setItem(ECONOMIC_EVENTS_CACHE_KEY, JSON.stringify(cache));
}
