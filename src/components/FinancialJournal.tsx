"use client";

import { useState } from "react";
import { Transaction, ASSET_LABELS, AssetType, getAssetIcon } from "@/lib/types";

function formatTRY(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}.${m}.${y}`;
}

interface Props {
  transactions: Transaction[];
}

export default function FinancialJournal({ transactions }: Props) {
  const [search, setSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<string>("all");

  const entriesWithNotes = transactions.filter((t) => t.note && t.note.trim().length > 0);

  const availableAssetTypes = Array.from(new Set(entriesWithNotes.map((t) => t.assetType)));

  const filteredEntries = entriesWithNotes
    .filter((t) => {
      if (selectedAsset !== "all" && t.assetType !== selectedAsset) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const noteMatch = (t.note ?? "").toLowerCase().includes(q);
      const subTypeMatch = t.subType.toLowerCase().includes(q);
      const labelMatch = (ASSET_LABELS[t.assetType] ?? "").toLowerCase().includes(q);
      return noteMatch || subTypeMatch || labelMatch;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  if (entriesWithNotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-800">
        <span className="text-3xl">📓</span>
        <h3 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">Henüz Günlük Notu Yok</h3>
        <p className="mt-1 max-w-md text-sm text-zinc-500">
          Yatırımlar veya İşlemler sayfasında yeni bir işlem eklerken &quot;Not&quot; alanına o anki alım gerekçeni yazarsan burada zaman tüneli olarak listelenir.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Günlük notlarında veya varlıklarda ara..."
            className="w-full rounded-xl border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm transition-colors dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <span className="absolute left-3 top-2.5 text-xs text-zinc-400">🔍</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedAsset("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedAsset === "all"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            Hepsi ({entriesWithNotes.length})
          </button>
          {availableAssetTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedAsset(type)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedAsset === type
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              {getAssetIcon(type)} {ASSET_LABELS[type as AssetType] ?? type}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline View */}
      {filteredEntries.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">Aramanıza veya filtrenize uygun günlük notu bulunamadı.</p>
      ) : (
        <div className="relative flex flex-col gap-6 pl-4 sm:pl-6 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
          {filteredEntries.map((t) => (
            <div key={t.id} className="relative flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700">
              {/* Timeline dot */}
              <div className="absolute -left-4 sm:-left-6 top-5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 ring-4 ring-white dark:bg-zinc-100 dark:ring-zinc-950">
                <div className="h-1.5 w-1.5 rounded-full bg-white dark:bg-zinc-900" />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    📅 {formatDate(t.date)}
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {getAssetIcon(t.assetType, t.subType)} {ASSET_LABELS[t.assetType] ?? t.assetType} ({t.subType})
                  </span>
                </div>
                <div className="text-xs text-zinc-500">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{t.quantity} birim</span> @ {formatTRY(t.buyPrice)}
                </div>
              </div>

              <p className="mt-1 leading-relaxed whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                {t.note}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
