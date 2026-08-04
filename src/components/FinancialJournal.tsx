"use client";

import { Transaction, ASSET_LABELS } from "@/lib/types";

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
  const entries = transactions
    .filter((t) => t.note)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (entries.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Henüz günlük notu yok. İşlem eklerken &quot;Not&quot; alanına o anki düşünceni yazarsan burada birikir.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map((t) => (
        <div key={t.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <div className="flex flex-wrap items-baseline gap-2 text-sm text-zinc-500">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">📅 {formatDate(t.date)}</span>
            <span>—</span>
            <span>{ASSET_LABELS[t.assetType] ?? t.assetType} ({t.subType})</span>
            <span>—</span>
            <span>{t.quantity} birim, {formatTRY(t.buyPrice)}</span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm">{t.note}</p>
        </div>
      ))}
    </div>
  );
}
