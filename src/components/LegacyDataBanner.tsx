"use client";

import { useState } from "react";
import { hasLegacyLocalData, migrateLegacyLocalData } from "@/lib/storage";

export default function LegacyDataBanner() {
  const [visible] = useState(() => hasLegacyLocalData());
  const [isMigrating, setIsMigrating] = useState(false);
  const [resultMsg, setResultMsg] = useState("");

  if (!visible) return null;

  async function handleMigrate() {
    setIsMigrating(true);
    const result = await migrateLegacyLocalData();
    setIsMigrating(false);

    if (!result.hadData) {
      setResultMsg("Aktarılacak eski veri bulunamadı (giriş yapmış olduğundan emin ol).");
      return;
    }

    const parts = [
      result.expensesMigrated > 0 && `${result.expensesMigrated} harcama`,
      result.budgetsMigrated > 0 && `${result.budgetsMigrated} bütçe`,
      result.periodsMigrated > 0 && `${result.periodsMigrated} arşivlenmiş dönem`,
      result.transactionsMigrated > 0 && `${result.transactionsMigrated} yatırım işlemi`,
      result.calendarNotesMigrated > 0 && `${result.calendarNotesMigrated} takvim notu`,
      result.snapshotsMigrated > 0 && `${result.snapshotsMigrated} portföy geçmişi kaydı`,
      result.dividendsMigrated > 0 && `${result.dividendsMigrated} temettü kaydı`,
    ].filter(Boolean);
    setResultMsg(`Aktarıldı: ${parts.join(", ")}.`);
    setTimeout(() => window.location.reload(), 3000);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
      <div>
        <p className="text-sm font-bold text-amber-900 dark:text-amber-300">
          Bu tarayıcıda hesabına aktarılmamış eski veriler var
        </p>
        <p className="text-xs text-amber-800/80 dark:text-amber-400/80">
          {resultMsg || "Harcama, yatırım, takvim ve bütçe verilerini hesabına taşımak için aktar."}
        </p>
      </div>
      {!resultMsg && (
        <button
          onClick={handleMigrate}
          disabled={isMigrating}
          className="rounded-xl bg-amber-900 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-amber-800 disabled:opacity-50 dark:bg-amber-300 dark:text-amber-950 dark:hover:bg-amber-200"
        >
          {isMigrating ? "Aktarılıyor..." : "Hesabıma Aktar"}
        </button>
      )}
    </div>
  );
}
