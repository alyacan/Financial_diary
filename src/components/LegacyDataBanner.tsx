"use client";

import { useState } from "react";
import { hasLegacyLocalData, migrateLegacyLocalData } from "@/lib/storage";

interface Props {
  onMigrated: () => void;
}

export default function LegacyDataBanner({ onMigrated }: Props) {
  const [visible, setVisible] = useState(() => hasLegacyLocalData());
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

    setResultMsg(
      `Aktarıldı: ${result.expensesMigrated} harcama, ${result.budgetsMigrated} bütçe, ${result.periodsMigrated} arşivlenmiş dönem.`
    );
    onMigrated();
    setTimeout(() => setVisible(false), 3000);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
      <div>
        <p className="text-sm font-bold text-amber-900 dark:text-amber-300">
          Bu tarayıcıda hesabına aktarılmamış eski veriler var
        </p>
        <p className="text-xs text-amber-800/80 dark:text-amber-400/80">
          {resultMsg || "Harcama, bütçe ve arşivlenmiş dönem verilerini hesabına taşımak için aktar."}
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
