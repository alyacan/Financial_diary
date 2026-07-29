import { CategoryBudget, Expense } from "./types";

export interface BudgetProgress {
  category: string;
  monthlyGoal: number;
  thisMonthTotal: number;
  lastMonthTotal: number;
  percentUsed: number; // thisMonthTotal / monthlyGoal * 100, sınırlanmamış (100'ü geçebilir)
  deltaVsLastMonth: number; // thisMonthTotal - lastMonthTotal
}

// Dönemler takvim ayına göre değil, hesap özeti dönemine göre (ayın 15'inden
// bir sonraki ayın 14'üne kadar) hesaplanır. Anahtar, dönemin başladığı 15'in
// ait olduğu ay/yıl ile temsil edilir (örn. "2026-07" = 15 Temmuz - 14 Ağustos).
function periodKey(year: number, month: number, day: number): string {
  if (day >= 15) return `${year}-${String(month).padStart(2, "0")}`;
  const prevMonth = month - 1;
  if (prevMonth === 0) return `${year - 1}-12`;
  return `${year}-${String(prevMonth).padStart(2, "0")}`;
}

function periodKeyForDateString(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return periodKey(y, m, d);
}

function previousPeriodKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const prevMonth = m - 1;
  if (prevMonth === 0) return `${y - 1}-12`;
  return `${y}-${String(prevMonth).padStart(2, "0")}`;
}

// Hedefler hesap özeti dönemine göre (15'inden 15'ine) değerlendirilir (Dönemi
// Kapat/Klasörle sınırlarından bağımsız) — bu yüzden hem aktif hem arşivlenmiş
// tüm harcamalar birlikte verilmeli.
export function computeBudgetProgress(
  allExpenses: Expense[],
  budgets: CategoryBudget[],
  referenceDate: Date = new Date()
): BudgetProgress[] {
  const thisPeriodKey = periodKey(referenceDate.getFullYear(), referenceDate.getMonth() + 1, referenceDate.getDate());
  const lastPeriodKey = previousPeriodKey(thisPeriodKey);

  return budgets.map((b) => {
    let thisMonthTotal = 0;
    let lastMonthTotal = 0;
    for (const e of allExpenses) {
      if (e.category !== b.category) continue;
      const k = periodKeyForDateString(e.date);
      if (k === thisPeriodKey) thisMonthTotal += e.amount;
      else if (k === lastPeriodKey) lastMonthTotal += e.amount;
    }
    return {
      category: b.category,
      monthlyGoal: b.monthlyGoal,
      thisMonthTotal,
      lastMonthTotal,
      percentUsed: b.monthlyGoal > 0 ? (thisMonthTotal / b.monthlyGoal) * 100 : 0,
      deltaVsLastMonth: thisMonthTotal - lastMonthTotal,
    };
  });
}
