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

// Hedefler hesap özeti dönemine göre (15'inden 15'ine) değerlendirilir. "Bu dönem"
// toplamı yalnızca aktif (henüz arşivlenmemiş) harcamalardan hesaplanır — bir dönem
// Dönemi Kapat/Klasörle ile arşivlendiğinde artık "bu dönem" toplamına karışmaz,
// böylece arşivleme gerçekten sıfırdan başlamış gibi hissettirir. "Geçen döneme göre"
// karşılaştırması ise hem aktif hem arşivlenmiş harcamalardan hesaplanır, çünkü önceki
// dönemin verisi artık arşive taşınmış olabilir.
export function computeBudgetProgress(
  activeExpenses: Expense[],
  archivedExpenses: Expense[],
  budgets: CategoryBudget[],
  referenceDate: Date = new Date()
): BudgetProgress[] {
  const thisPeriodKey = periodKey(referenceDate.getFullYear(), referenceDate.getMonth() + 1, referenceDate.getDate());
  const lastPeriodKey = previousPeriodKey(thisPeriodKey);
  const allExpenses = [...activeExpenses, ...archivedExpenses];

  return budgets.map((b) => {
    let thisMonthTotal = 0;
    for (const e of activeExpenses) {
      if (e.category !== b.category) continue;
      if (periodKeyForDateString(e.date) === thisPeriodKey) thisMonthTotal += e.amount;
    }
    let lastMonthTotal = 0;
    for (const e of allExpenses) {
      if (e.category !== b.category) continue;
      if (periodKeyForDateString(e.date) === lastPeriodKey) lastMonthTotal += e.amount;
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
