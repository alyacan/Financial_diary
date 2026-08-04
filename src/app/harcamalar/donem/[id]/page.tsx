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
      <div className="mx-auto flex max-w-5xl flex-col gap-4 p-6 sm:p-10">
        <p className="text-sm text-zinc-500">Bu dönem bulunamadı.</p>
        <Link href="/harcamalar" className="text-sm font-medium text-blue-600 hover:underline">
          ← Harcamalar sayfasına dön
        </Link>
      </div>
    );
  }

  const stats = computePeriodStats(period, allPeriods);
  const periodTransactions = transactionsInPeriod(transactions, period);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6 sm:p-10">
      {/* Navigation & Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <Link
          href="/harcamalar"
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Harcamalarım Arşivlerine Dön
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={startEdit}
            className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            ✏️ Dönemi Düzenle
          </button>
          <button
            onClick={handleDeletePeriod}
            className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400"
          >
            🗑️ Klasörü Sil
          </button>
        </div>
      </div>

      {/* Folder Header Card */}
      <header className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
        {editing ? (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              Klasör Adı (opsiyonel)
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Örn: Temmuz Ayı Klasörü"
                className="rounded-xl border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs text-zinc-500">
                Başlangıç Tarihi
                <input
                  type="date"
                  value={startInput}
                  onChange={(e) => setStartInput(e.target.value)}
                  className="rounded-xl border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-zinc-500">
                Bitiş Tarihi
                <input
                  type="date"
                  value={endInput}
                  onChange={(e) => setEndInput(e.target.value)}
                  className="rounded-xl border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={saveEdit}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-medium text-white dark:bg-zinc-100 dark:text-black"
              >
                Kaydet
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-medium dark:border-zinc-700"
              >
                Vazgeç
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📁</span>
              <div>
                <h1 className="font-serif text-2xl font-bold tracking-tight">
                  {period.name ? period.name : `${formatDate(period.startDate)} - ${formatDate(period.endDate)}`}
                </h1>
                <span className="mt-1 inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  🗓️ {formatDate(period.startDate)} — {formatDate(period.endDate)} Hesabı
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Free Note Section inside Folder */}
        <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Klasör Notu</label>
          <textarea
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            onBlur={saveNote}
            rows={2}
            placeholder="Bu dönem klasörüne özel not ekle (otomatik kaydedilir)..."
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs transition-colors focus:border-zinc-400 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:border-zinc-600"
          />
        </div>
      </header>

      {/* KPI Stats Grid */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Dönem Toplam Harcama</div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {formatTRY(stats.totalExpense)}
          </div>
          <div className="mt-1 text-xs text-zinc-400">Klasör içi kapanış tutarı</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Harcama İşlem Sayısı</div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {stats.expenseCount} Adet
          </div>
          <div className="mt-1 text-xs text-zinc-400">Kayıtlı işlem</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Ortalama İşlem Tutarı</div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {formatTRY(stats.averageExpense)}
          </div>
          <div className="mt-1 text-xs text-zinc-400">İşlem başına düşen</div>
        </div>
      </section>

      {/* Category Distribution & Highlights */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Kategori Dağılımı</h2>
          <ExpenseChart expenses={period.expenses} />
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
            <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">En Büyük Harcamalar</h3>
            {stats.biggestExpenses.length === 0 ? (
              <p className="text-xs text-zinc-500">Kayıt yok.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-xs">
                {stats.biggestExpenses.map((e) => (
                  <li key={e.id} className="flex justify-between border-b border-zinc-100 pb-1.5 dark:border-zinc-800">
                    <span>{formatDate(e.date)} — <strong>{e.category}</strong>{e.note ? ` (${e.note})` : ""}</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatTRY(e.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
            <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tekrarlayan Harcamalar</h3>
            {stats.recurringExpenses.length === 0 ? (
              <p className="text-xs text-zinc-500">Tespit edilmedi.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-xs">
                {stats.recurringExpenses.map((e) => (
                  <li key={e.id} className="flex justify-between border-b border-zinc-100 pb-1.5 dark:border-zinc-800">
                    <span>{formatDate(e.date)} — <strong>{e.category}</strong>{e.note ? ` (${e.note})` : ""}</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatTRY(e.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Scrollable Compact Expenses Table Section */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Klasör İçi Harcamalar ({period.expenses.length})</h2>
          <span className="text-xs text-zinc-400">Kaydırmalı liste view</span>
        </div>
        <p className="mb-4 text-xs text-zinc-500">
          Bu dönem arşivinde yer alan tüm harcama kalemleri.
        </p>

        {/* Max-height scrollable container so table never explodes page length */}
        <div className="max-h-[420px] overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <ExpenseTable expenses={period.expenses} />
        </div>
      </section>

      {/* Period Investment Transactions (if any) */}
      {periodTransactions.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Dönem İçi Yatırım İşlemleri ({periodTransactions.length})</h2>
          <div className="max-h-[300px] overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-[500px] border-collapse text-xs">
              <thead className="sticky top-0 bg-zinc-100 font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <tr className="border-b border-zinc-200 text-left dark:border-zinc-700">
                  <th className="p-2.5">Tarih</th>
                  <th className="p-2.5">Varlık</th>
                  <th className="p-2.5">Miktar</th>
                  <th className="p-2.5">Alış Fiyatı</th>
                  <th className="p-2.5">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {periodTransactions.map((t) => (
                  <tr key={t.id} className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50">
                    <td className="p-2.5 font-medium">{formatDate(t.date)}</td>
                    <td className="p-2.5">{ASSET_LABELS[t.assetType] ?? t.assetType} ({t.subType})</td>
                    <td className="p-2.5">{t.quantity}</td>
                    <td className="p-2.5">{formatTRY(t.buyPrice)}</td>
                    <td className="p-2.5 font-semibold">{formatTRY(t.quantity * t.buyPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* AI Analysis Package */}
      <AiAnalysisPackage period={period} allPeriods={allPeriods} periodTransactions={periodTransactions} />
    </div>
  );
}
