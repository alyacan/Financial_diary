import { ArchivedPeriod, CalendarNote, CategoryBudget, DividendEntry, Expense, PortfolioSnapshot, Transaction } from "./types";
import { AutoDividendEvent } from "./dividendCalendar";
import { supabase } from "./supabase";

const DIVIDEND_AUTO_CACHE_KEY = "financial-diary-dividend-auto-cache";
const MAX_PORTFOLIO_SNAPSHOTS = 90;

interface TransactionRow {
  id: string;
  asset_type: string;
  sub_type: string;
  date: string;
  quantity: number;
  buy_price: number;
  fund_code: string | null;
  fund_category: string | null;
  note: string | null;
}

function fromTransactionRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    assetType: row.asset_type as Transaction["assetType"],
    subType: row.sub_type,
    date: row.date,
    quantity: Number(row.quantity),
    buyPrice: Number(row.buy_price),
    fundCode: row.fund_code ?? undefined,
    fundCategory: row.fund_category ?? undefined,
    note: row.note ?? undefined,
  };
}

export async function loadTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, asset_type, sub_type, date, quantity, buy_price, fund_code, fund_category, note")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map(fromTransactionRow);
}

export async function addTransaction(transaction: Transaction): Promise<Transaction[]> {
  const userId = await currentUserId();
  if (!userId) return loadTransactions();
  await supabase.from("transactions").insert({
    id: transaction.id,
    user_id: userId,
    asset_type: transaction.assetType,
    sub_type: transaction.subType,
    date: transaction.date,
    quantity: transaction.quantity,
    buy_price: transaction.buyPrice,
    fund_code: transaction.fundCode ?? null,
    fund_category: transaction.fundCategory ?? null,
    note: transaction.note ?? null,
  });
  return loadTransactions();
}

export async function deleteTransaction(id: string): Promise<Transaction[]> {
  await supabase.from("transactions").delete().eq("id", id);
  return loadTransactions();
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

interface CalendarNoteRow {
  id: string;
  date: string;
  text: string;
}

export async function loadCalendarNotes(): Promise<CalendarNote[]> {
  const { data, error } = await supabase
    .from("calendar_notes")
    .select("id, date, text")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as CalendarNoteRow[]).map((row) => ({ id: row.id, date: row.date, text: row.text }));
}

export async function addCalendarNote(note: CalendarNote): Promise<CalendarNote[]> {
  const userId = await currentUserId();
  if (!userId) return loadCalendarNotes();
  await supabase.from("calendar_notes").insert({ id: note.id, user_id: userId, date: note.date, text: note.text });
  return loadCalendarNotes();
}

export async function deleteCalendarNote(id: string): Promise<CalendarNote[]> {
  await supabase.from("calendar_notes").delete().eq("id", id);
  return loadCalendarNotes();
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

interface SnapshotRow {
  date: string;
  value: number;
}

export async function loadPortfolioSnapshots(): Promise<PortfolioSnapshot[]> {
  const { data, error } = await supabase
    .from("portfolio_snapshots")
    .select("date, value")
    .order("date", { ascending: true });
  if (error || !data) return [];
  return (data as SnapshotRow[]).map((row) => ({ date: row.date, value: Number(row.value) }));
}

// Portföy Değeri trend grafiği: geriye dönük veri yoktu, bu yüzden geçmiş
// üretilmez — bugünden itibaren her ziyarette günün değeri kaydedilir/güncellenir
// ve grafik zamanla gerçek verilerle birikir.
export async function recordPortfolioSnapshot(value: number): Promise<PortfolioSnapshot[]> {
  const userId = await currentUserId();
  if (!userId) return loadPortfolioSnapshots();
  const today = new Date().toISOString().slice(0, 10);
  await supabase
    .from("portfolio_snapshots")
    .upsert({ user_id: userId, date: today, value }, { onConflict: "user_id,date" });

  const all = await loadPortfolioSnapshots();
  if (all.length > MAX_PORTFOLIO_SNAPSHOTS) {
    const excess = all.slice(0, all.length - MAX_PORTFOLIO_SNAPSHOTS);
    await supabase
      .from("portfolio_snapshots")
      .delete()
      .eq("user_id", userId)
      .in("date", excess.map((s) => s.date));
    return all.slice(all.length - MAX_PORTFOLIO_SNAPSHOTS);
  }
  return all;
}

// Bir işlem/harcama/dönem silindiğinde geçmiş grafiğin artık var olmayan veriye
// ait eski bir toplamı göstermeye devam etmemesi için trend geçmişi sıfırlanır.
export async function clearPortfolioSnapshots(): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  await supabase.from("portfolio_snapshots").delete().eq("user_id", userId);
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

interface DividendRow {
  id: string;
  ticker: string;
  date: string;
  amount_per_share: number | null;
}

export async function loadDividends(): Promise<DividendEntry[]> {
  const { data, error } = await supabase
    .from("dividend_entries")
    .select("id, ticker, date, amount_per_share")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as DividendRow[]).map((row) => ({
    id: row.id,
    ticker: row.ticker,
    date: row.date,
    amountPerShare: row.amount_per_share ?? undefined,
  }));
}

export async function addDividend(entry: DividendEntry): Promise<DividendEntry[]> {
  const userId = await currentUserId();
  if (!userId) return loadDividends();
  await supabase.from("dividend_entries").insert({
    id: entry.id,
    user_id: userId,
    ticker: entry.ticker,
    date: entry.date,
    amount_per_share: entry.amountPerShare ?? null,
  });
  return loadDividends();
}

export async function deleteDividend(id: string): Promise<DividendEntry[]> {
  await supabase.from("dividend_entries").delete().eq("id", id);
  return loadDividends();
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

// Eski (Supabase öncesi) localStorage anahtarları — sadece bir kerelik taşıma için.
const LEGACY_EXPENSES_KEY = "financial-diary-expenses";
const LEGACY_ARCHIVED_PERIODS_KEY = "financial-diary-archived-periods";
const LEGACY_BUDGETS_KEY = "financial-diary-category-budgets";
const LEGACY_TRANSACTIONS_KEY = "financial-diary-transactions";
const LEGACY_CALENDAR_NOTES_KEY = "financial-diary-calendar-notes";
const LEGACY_PORTFOLIO_SNAPSHOTS_KEY = "financial-diary-portfolio-snapshots";
const LEGACY_DIVIDENDS_KEY = "financial-diary-dividends";

export interface LegacyMigrationResult {
  hadData: boolean;
  expensesMigrated: number;
  budgetsMigrated: number;
  periodsMigrated: number;
  transactionsMigrated: number;
  calendarNotesMigrated: number;
  snapshotsMigrated: number;
  dividendsMigrated: number;
}

export function hasLegacyLocalData(): boolean {
  if (typeof window === "undefined") return false;
  const keys = [
    LEGACY_EXPENSES_KEY,
    LEGACY_ARCHIVED_PERIODS_KEY,
    LEGACY_BUDGETS_KEY,
    LEGACY_TRANSACTIONS_KEY,
    LEGACY_CALENDAR_NOTES_KEY,
    LEGACY_PORTFOLIO_SNAPSHOTS_KEY,
    LEGACY_DIVIDENDS_KEY,
  ];
  return keys.some((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  });
}

// Bu tarayıcıda Supabase'e taşımadan önce kalmış eski harcama/bütçe/dönem verisini,
// şu an giriş yapmış hesaba bir kerelik aktarır. Başarılı olursa eski anahtarları siler.
export async function migrateLegacyLocalData(): Promise<LegacyMigrationResult> {
  const userId = await currentUserId();
  const empty: LegacyMigrationResult = {
    hadData: false,
    expensesMigrated: 0,
    budgetsMigrated: 0,
    periodsMigrated: 0,
    transactionsMigrated: 0,
    calendarNotesMigrated: 0,
    snapshotsMigrated: 0,
    dividendsMigrated: 0,
  };
  if (typeof window === "undefined" || !userId) return empty;

  function readLegacy<T>(key: string): T[] {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }

  const legacyExpenses = readLegacy<Expense>(LEGACY_EXPENSES_KEY);
  const legacyBudgets = readLegacy<CategoryBudget>(LEGACY_BUDGETS_KEY);
  const legacyPeriods = readLegacy<ArchivedPeriod>(LEGACY_ARCHIVED_PERIODS_KEY);
  const legacyTransactions = readLegacy<Transaction>(LEGACY_TRANSACTIONS_KEY);
  const legacyCalendarNotes = readLegacy<CalendarNote>(LEGACY_CALENDAR_NOTES_KEY);
  const legacySnapshots = readLegacy<PortfolioSnapshot>(LEGACY_PORTFOLIO_SNAPSHOTS_KEY);
  const legacyDividends = readLegacy<DividendEntry>(LEGACY_DIVIDENDS_KEY);

  if (
    legacyExpenses.length === 0 &&
    legacyBudgets.length === 0 &&
    legacyPeriods.length === 0 &&
    legacyTransactions.length === 0 &&
    legacyCalendarNotes.length === 0 &&
    legacySnapshots.length === 0 &&
    legacyDividends.length === 0
  ) {
    return empty;
  }

  if (legacyExpenses.length > 0) {
    await supabase.from("expenses").insert(
      legacyExpenses.map((e) => ({
        id: e.id,
        user_id: userId,
        date: e.date,
        category: e.category,
        amount: e.amount,
        note: e.note ?? null,
        card_id: null, // eski kart id'leri artık geçersiz, harcama kart eşleşmesi sıfırlanır
      }))
    );
  }

  for (const b of legacyBudgets) {
    await supabase
      .from("category_budgets")
      .upsert({ user_id: userId, category: b.category, monthly_goal: b.monthlyGoal }, { onConflict: "user_id,category" });
  }

  if (legacyPeriods.length > 0) {
    await supabase.from("archived_periods").insert(
      legacyPeriods.map((p) => ({
        id: p.id,
        user_id: userId,
        name: p.name ?? null,
        start_date: p.startDate,
        end_date: p.endDate,
        created_at: p.createdAt,
        note: p.note ?? null,
      }))
    );

    const archivedExpenseRows = legacyPeriods.flatMap((p) =>
      p.expenses.map((e) => ({
        id: crypto.randomUUID(),
        archived_period_id: p.id,
        user_id: userId,
        date: e.date,
        category: e.category,
        amount: e.amount,
        note: e.note ?? null,
        card_id: null,
      }))
    );
    if (archivedExpenseRows.length > 0) {
      await supabase.from("archived_period_expenses").insert(archivedExpenseRows);
    }
  }

  if (legacyTransactions.length > 0) {
    await supabase.from("transactions").insert(
      legacyTransactions.map((t) => ({
        id: t.id,
        user_id: userId,
        asset_type: t.assetType,
        sub_type: t.subType,
        date: t.date,
        quantity: t.quantity,
        buy_price: t.buyPrice,
        fund_code: t.fundCode ?? null,
        fund_category: t.fundCategory ?? null,
        note: t.note ?? null,
      }))
    );
  }

  if (legacyCalendarNotes.length > 0) {
    await supabase.from("calendar_notes").insert(
      legacyCalendarNotes.map((n) => ({ id: n.id, user_id: userId, date: n.date, text: n.text }))
    );
  }

  if (legacySnapshots.length > 0) {
    await supabase.from("portfolio_snapshots").upsert(
      legacySnapshots.map((s) => ({ user_id: userId, date: s.date, value: s.value })),
      { onConflict: "user_id,date" }
    );
  }

  if (legacyDividends.length > 0) {
    await supabase.from("dividend_entries").insert(
      legacyDividends.map((d) => ({
        id: d.id,
        user_id: userId,
        ticker: d.ticker,
        date: d.date,
        amount_per_share: d.amountPerShare ?? null,
      }))
    );
  }

  window.localStorage.removeItem(LEGACY_EXPENSES_KEY);
  window.localStorage.removeItem(LEGACY_ARCHIVED_PERIODS_KEY);
  window.localStorage.removeItem(LEGACY_BUDGETS_KEY);
  window.localStorage.removeItem(LEGACY_TRANSACTIONS_KEY);
  window.localStorage.removeItem(LEGACY_CALENDAR_NOTES_KEY);
  window.localStorage.removeItem(LEGACY_PORTFOLIO_SNAPSHOTS_KEY);
  window.localStorage.removeItem(LEGACY_DIVIDENDS_KEY);

  return {
    hadData: true,
    expensesMigrated: legacyExpenses.length,
    budgetsMigrated: legacyBudgets.length,
    periodsMigrated: legacyPeriods.length,
    transactionsMigrated: legacyTransactions.length,
    calendarNotesMigrated: legacyCalendarNotes.length,
    snapshotsMigrated: legacySnapshots.length,
    dividendsMigrated: legacyDividends.length,
  };
}
