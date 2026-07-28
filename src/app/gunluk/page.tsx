"use client";

import FinancialJournal from "@/components/FinancialJournal";
import FinancialCalendar from "@/components/FinancialCalendar";
import { useInvestments } from "@/hooks/useInvestments";
import { useCalendarNotes } from "@/hooks/useCalendarNotes";
import { useDividends } from "@/hooks/useDividends";

export default function GunlukPage() {
  const { transactions } = useInvestments();
  const { calendarNotes, handleAddCalendarNote, handleDeleteCalendarNote } = useCalendarNotes();
  const { dividends, handleAddDividend, handleDeleteDividend } = useDividends();
  const stockTickers = Array.from(
    new Set(transactions.filter((t) => t.assetType === "stock").map((t) => t.subType.toUpperCase()))
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">Finans Günlüğüm 📓</h1>
        <p className="text-sm text-zinc-500">Önemli ekonomik tarihler ve yatırım kararlarının gerekçeleri, bir arada.</p>
      </header>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-2 text-lg font-semibold">Finansal Takvim</h2>
        <FinancialCalendar
          notes={calendarNotes}
          onAdd={handleAddCalendarNote}
          onDelete={handleDeleteCalendarNote}
          stockTickers={stockTickers}
          dividends={dividends}
          onAddDividend={handleAddDividend}
          onDeleteDividend={handleDeleteDividend}
        />
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-2 text-lg font-semibold">Yatırım Günlüğü</h2>
        <FinancialJournal transactions={transactions} />
      </section>
    </div>
  );
}
