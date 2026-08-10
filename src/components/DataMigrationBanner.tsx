"use client";

import { useState } from "react";
import { checkHasUnmigratedLocalData, migrateLocalDataToSupabase } from "@/lib/migration";

interface Props {
  onMigrationComplete: () => void;
}

export default function DataMigrationBanner({ onMigrationComplete }: Props) {
  const [hasLocalData, setHasLocalData] = useState(() => checkHasUnmigratedLocalData());
  const [isMigrating, setIsMigrating] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  if (!hasLocalData) return null;

  async function handleMigrate() {
    setIsMigrating(true);
    setStatusMsg("");

    const result = await migrateLocalDataToSupabase();
    setIsMigrating(false);

    if (result.error) {
      setStatusMsg(`⚠️ Hata: ${result.error}`);
    } else {
      setStatusMsg(`🎉 ${result.count} adet eski harcamanız başarıyla hesabınıza aktarıldı ve senkronize edildi!`);
      setHasLocalData(false);
      onMigrationComplete();
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-200 text-lg dark:bg-emerald-900">
            📥
          </span>
          <div>
            <h3 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
              Cihazınızda Eski Yerel Harcamalar Bulundu!
            </h3>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
              Giriş yapmadan önce bu tarayıcıda kaydettiğiniz harcamaları tek tıkla bulut hesabınıza aktarabilirsiniz.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleMigrate}
            disabled={isMigrating}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {isMigrating ? "Hesabınıza Aktarılıyor..." : "🚀 Eski Verilerimi Hesabıma Aktar"}
          </button>
          <button
            onClick={() => setHasLocalData(false)}
            className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
          >
            Gizle
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="mt-2 text-xs font-bold text-emerald-900 dark:text-emerald-200">
          {statusMsg}
        </div>
      )}
    </div>
  );
}
