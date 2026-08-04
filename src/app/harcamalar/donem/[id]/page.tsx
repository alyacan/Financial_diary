"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArchivedPeriod, ASSET_LABELS, Transaction } from "@/lib/types";
import { deleteArchivedPeriod, loadArchivedPeriods, loadTransactions, updateArchivedPeriod } from "@/lib/storage";
import { computePeriodStats, transactionsInPeriod } from "@/lib/periodStats";
import ExpenseChart from "@/components/ExpenseChart";
import ExpenseTable from "@/components/ExpenseTable";
import AiAnalysisPackage from "@/components/AiAnalysisPackage";

function formatTRY(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}.${m}.${y}`;
}

export default function ArchivedPeriodPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [allPeriods, setAllPeriods] = useState<ArchivedPeriod[]>(() => loadArchivedPeriods());
  const [transactions] = useState<Transaction[]>(() => loadTransactions());
  const [loaded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");

  const period = allPeriods.find((p) => p.id === id);

  const [prevNote, setPrevNote] = useState(() => period?.note ?? "");
  const [noteInput, setNoteInput] = useState(() => period?.note ?? "");

  if ((period?.note ?? "") !== prevNote) {
    setPrevNote(period?.note ?? "");
    setNoteInput(period?.note ?? "");
  }

  function startEdit() {
    if (!period) return;
    setNameInput(period.name ?? "");
    setStartInput(period.startDate);
    setEndInput(period.endDate);
    setEditing(true);
  }

  function saveEdit() {
    if (!period) return;
    if (startInput > endInput) {
      window.alert("Başlangıç tarihi, bitiş tarihinden sonra olamaz.");
      return;
    }
    setAllPeriods(
      updateArchivedPeriod(period.id, {
        name: nameInput.trim() ? nameInput.trim() : undefined,
        startDate: startInput,
        endDate: endInput,
      })
    );
    setEditing(false);
  }

  function saveNote() {
    if (!period) return;
    setAllPeriods(updateArchivedPeriod(period.id, { note: noteInput.trim() ? noteInput.trim() : undefined }));
  }

  function handleDeletePeriod() {
    if (!period) return;
    const confirmed = window.confirm(
      "Bu arşivlenmiş dönemi tamamen silmek istediğine emin misin? Bu işlem geri alınamaz."
    );
    if (confirmed) {
      deleteArchivedPeriod(period.id);
      window.location.href = "/harcamalar";
    }
  }

  if (!loaded) return null;

  if (!period) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-4 p-6">
        <p className="text-sm text-zinc-500">Bu dönem bulunamadı.</p>
        <Link href="/harcamalar" className="text-sm underline">
          Harcamalar sayfasına dön
        </Link>
      </div>
    );
  }

  const stats = computePeriodStats(period, allPeriods);
  const periodTransactions = transactionsInPeriod(transactions, period);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <Link href="/harcamalar" className="text-sm text-zinc-500 hover:underline">
            ← Harcamalar
          </Link>
          <div className="flex gap-2">
            <button onClick={startEdit} className="text-sm text-zinc-500 hover:underline">
              ✏️ Düzenle
            </button>
            <button onClick={handleDeletePeriod} className="text-sm text-red-600 hover:underline">
              🗑️ Sil
            </button>
          </div>
        </div>

        {editing ? (
          <div className="flex flex-col gap-2 rounded-lg border border-zinc-300 p-3 dark:border-zinc-700">
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              İsim (opsiyonel)
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Örn: Temmuz ayı"
                className="rounded border border-zinc-300 p-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs text-zinc-500">
                Başlangıç
                <input
                  type="date"
                  value={startInput}
                  onChange={(e) => setStartInput(e.target.value)}
                  className="rounded border border-zinc-300 p-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs text-zinc-500">
                Bitiş
                <input
                  type="date"
                  value={endInput}
                  onChange={(e) => setEndInput(e.target.value)}
                  className="rounded border border-zinc-300 p-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={saveEdit} className="rounded bg-zinc-900 px-3 py-1 text-sm text-white dark:bg-zinc-100 dark:text-black">
                Kaydet
              </button>
              <button onClick={() => setEditing(false)} className="rounded border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700">
                Vazgeç
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold">
              {period.name ? period.name : `${formatDate(period.startDate)} - ${formatDate(period.endDate)}`}
            </h1>
            {period.name && (
              <p className="text-xs text-zinc-400">
                {formatDate(period.startDate)} - {formatDate(period.endDate)}
              </p>
            )}
          </>
        )}
        <p className="text-sm text-zinc-500">Arşivlenen dönem detayı</p>
      </header>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-2 text-lg font-semibold">Not</h2>
        <p className="mb-2 text-xs text-zinc-400">Bu döneme özel serbest bir not — sadece bu dönem için geçerlidir.</p>
        <textarea
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          onBlur={saveNote}
          rows={3}
          placeholder="Bu dönemle ilgili bir not ekle..."
          className="w-full rounded border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">Toplam Harcama</p>
          <p className="text-xl font-semibold">{formatTRY(stats.totalExpense)}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">Harcama Sayısı</p>
          <p className="text-xl font-semibold">{stats.expenseCount}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">Ortalama Harcama</p>
          <p className="text-xl font-semibold">{formatTRY(stats.averageExpense)}</p>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-2 text-lg font-semibold">Kategori Dağılımı</h2>
        <ExpenseChart expenses={period.expenses} />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-2 text-lg font-semibold">En Büyük Harcamalar</h2>
          {stats.biggestExpenses.length === 0 ? (
            <p className="text-sm text-zinc-500">Kayıt yok.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {stats.biggestExpenses.map((e) => (
                <li key={e.id} className="flex justify-between border-b border-zinc-100 pb-1 dark:border-zinc-900">
                  <span>{formatDate(e.date)} — {e.category}{e.note ? ` (${e.note})` : ""}</span>
                  <span className="font-medium">{formatTRY(e.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-2 text-lg font-semibold">Tekrarlayan Harcamalar</h2>
          <p className="mb-2 text-xs text-zinc-400">
            Yaklaşık bir tahmindir: aynı açıklamanın önceki dönemlerde veya bu dönemde birden fazla kez geçmesine dayanır.
          </p>
          {stats.recurringExpenses.length === 0 ? (
            <p className="text-sm text-zinc-500">Tespit edilmedi.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {stats.recurringExpenses.map((e) => (
                <li key={e.id} className="flex justify-between border-b border-zinc-100 pb-1 dark:border-zinc-900">
                  <span>{formatDate(e.date)} — {e.category}{e.note ? ` (${e.note})` : ""}</span>
                  <span className="font-medium">{formatTRY(e.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 sm:col-span-2">
          <h2 className="mb-2 text-lg font-semibold">Beklenmeyen Harcamalar</h2>
          <p className="mb-2 text-xs text-zinc-400">
            Yaklaşık bir tahmindir: dönem ortalamasının belirgin üzerinde olan, tekrarlayan sayılmayan harcamalardır.
          </p>
          {stats.unexpectedExpenses.length === 0 ? (
            <p className="text-sm text-zinc-500">Tespit edilmedi.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {stats.unexpectedExpenses.map((e) => (
                <li key={e.id} className="flex justify-between border-b border-zinc-100 pb-1 dark:border-zinc-900">
                  <span>{formatDate(e.date)} — {e.category}{e.note ? ` (${e.note})` : ""}</span>
                  <span className="font-medium">{formatTRY(e.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-2 text-lg font-semibold">Tüm Harcamalar</h2>
        <ExpenseTable expenses={period.expenses} />
      </section>

      {periodTransactions.length > 0 && (
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-2 text-lg font-semibold">Yatırım İşlemleri</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                  <th className="p-2">Tarih</th>
                  <th className="p-2">Varlık</th>
                  <th className="p-2">Miktar</th>
                  <th className="p-2">Alış Fiyatı</th>
                  <th className="p-2">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {periodTransactions.map((t) => (
                  <tr key={t.id} className="border-b border-zinc-100 dark:border-zinc-900">
                    <td className="p-2">{formatDate(t.date)}</td>
                    <td className="p-2">{ASSET_LABELS[t.assetType] ?? t.assetType} ({t.subType})</td>
                    <td className="p-2">{t.quantity}</td>
                    <td className="p-2">{formatTRY(t.buyPrice)}</td>
                    <td className="p-2">{formatTRY(t.quantity * t.buyPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <AiAnalysisPackage period={period} allPeriods={allPeriods} periodTransactions={periodTransactions} />
    </div>
  );
}
