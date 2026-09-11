"use client";

import { useState, useRef } from "react";
import { EXPENSE_CATEGORIES, Expense, PaymentCard } from "@/lib/types";

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  category: string;
  include: boolean;
  isDuplicate: boolean;
}

function formatTRY(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

function formatDateDisplay(d?: string): string {
  if (!d) return "—";
  if (d.includes("-")) {
    const parts = d.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
  }
  return d;
}

interface Props {
  existingExpenses: Expense[];
  onImport: (expenses: Expense[]) => void;
  cards: PaymentCard[];
  defaultCardId: string | null;
  onSuccess?: () => void;
}

export default function StatementUpload({ existingExpenses, onImport, cards, defaultCardId, onSuccess }: Props) {
  const [pickedCardId, setPickedCardId] = useState<string | null>(null);
  const selectedCardId = pickedCardId ?? defaultCardId ?? cards[0]?.id ?? "";
  const setSelectedCardId = setPickedCardId;
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [bankLabel, setBankLabel] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setWarning(null);
    setRows([]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-statement", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ekstre işlenemedi");

      const existingKeys = new Set(existingExpenses.map((e) => `${e.date}|${e.amount}|${e.note ?? ""}`));
      const parsedRows: ParsedRow[] = (data.rows || []).map((r: Omit<ParsedRow, "include" | "isDuplicate">) => {
        const isDuplicate = existingKeys.has(`${r.date}|${r.amount}|${r.description}`);
        return { ...r, include: !isDuplicate, isDuplicate };
      });
      setRows(parsedRows);
      setBankLabel(data.bankLabel ?? null);
      const duplicateCount = parsedRows.filter((r) => r.isDuplicate).length;
      if (duplicateCount > 0) {
        setWarning(
          `${duplicateCount} işlem daha önce eklenmiş görünüyor. Yinelenen satırların işareti otomatik kaldırıldı.`
        );
      }
      if (data.warning) setWarning((prev) => (prev ? `${prev} ${data.warning}` : data.warning));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu");
    }
    setLoading(false);
  }

  function updateRow(index: number, patch: Partial<ParsedRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function handleImport() {
    const toImport = rows
      .filter((r) => r.include)
      .map((r): Expense => ({
        id: crypto.randomUUID(),
        date: r.date,
        category: r.category,
        amount: r.amount,
        note: r.description,
        cardId: selectedCardId || undefined,
      }));
    onImport(toImport);
    setRows([]);
    setFile(null);
    if (onSuccess) onSuccess();
  }

  const selectedRows = rows.filter((r) => r.include);
  const selectedTotal = selectedRows.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      {cards.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Ekstrenin Ait Olduğu Kart
          </label>
          <select
            value={selectedCardId}
            onChange={(e) => setSelectedCardId(e.target.value)}
            className="w-full rounded-xl p-3 text-sm font-semibold outline-none transition-all cursor-pointer border border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {cards.map((card) => (
              <option key={card.id} value={card.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                {card.name} ({card.cardType === "credit" ? "Kredi Kartı" : card.cardType === "debit" ? "Banka Kartı" : "Nakit"})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Styled File Dropzone (Supports .xlsx, .xls, .csv, and PDF) */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all hover:bg-zinc-500/5 group"
        style={{ borderColor: file ? "var(--shell-accent)" : "var(--shell-border)" }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />

        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-105"
          style={{ background: "oklch(0.85 0.05 25 / 0.15)", color: "var(--shell-accent-strong)" }}
        >
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>

        <div>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {file ? file.name : "Ekstre dosyanızı yüklemek için tıklayın"}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {file ? `${(file.size / 1024).toFixed(1)} KB seçildi` : "Excel (.xlsx / .xls), CSV veya PDF ekstre dosyaları"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mt-1">
          <span className="rounded-lg px-2.5 py-1 text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            Excel (.xlsx / .xls)
          </span>
          <span className="rounded-lg px-2.5 py-1 text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            CSV
          </span>
          <span className="rounded-lg px-2.5 py-1 text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            PDF Ekstre
          </span>
        </div>
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="flex items-center justify-center gap-2.5 rounded-xl py-3.5 px-6 text-sm font-bold text-white shadow-xs transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
        style={{ background: "var(--shell-accent)" }}
      >
        <span>{loading ? "Ekstre Ayrıştırılıyor..." : "Ekstreyi Yükle ve Analiz Et"}</span>
      </button>

      {error && (
        <div className="rounded-xl p-3.5 text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
          {error}
        </div>
      )}

      {warning && (
        <div className="rounded-xl p-3.5 text-xs font-semibold text-amber-800 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
          {warning}
        </div>
      )}

      {/* Parsed Rows Review Section */}
      {rows.length > 0 && (
        <div className="flex flex-col gap-3.5 pt-2 border-t" style={{ borderColor: "var(--shell-border)" }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {rows.length} işlem tespit edildi {bankLabel ? `(${bankLabel})` : ""}
              </div>
              <p className="text-[11px] text-zinc-500">
                Seçili: {selectedRows.length} işlem · Toplam: {formatTRY(selectedTotal)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRows((prev) => prev.map((r) => ({ ...r, include: true })))}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors hover:bg-zinc-500/10 text-amber-600 dark:text-amber-400"
              >
                Tümünü Seç
              </button>
              <button
                onClick={() => setRows((prev) => prev.map((r) => ({ ...r, include: !r.isDuplicate })))}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors hover:bg-zinc-500/10 text-zinc-500 dark:text-zinc-400"
              >
                Yinelenenleri Çıkar
              </button>
            </div>
          </div>

          <div
            className="overflow-hidden rounded-xl shadow-2xs"
            style={{
              background: "var(--shell-card)",
              border: "1px solid var(--shell-border)",
            }}
          >
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full min-w-[480px] border-collapse text-left text-xs">
                <thead>
                  <tr
                    className="border-b text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300"
                    style={{ borderColor: "var(--shell-border)", background: "oklch(0.5 0.02 50 / 0.05)" }}
                  >
                    <th className="py-2.5 px-3 w-8"></th>
                    <th className="py-2.5 px-3">Tarih</th>
                    <th className="py-2.5 px-3">Açıklama</th>
                    <th className="py-2.5 px-3">Tutar</th>
                    <th className="py-2.5 px-3">Kategori</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--shell-border)" }}>
                  {rows.map((r, i) => (
                    <tr
                      key={i}
                      className={`transition-colors hover:bg-zinc-500/5 ${r.isDuplicate ? "opacity-60 bg-amber-50/20" : ""}`}
                    >
                      <td className="py-2.5 px-3">
                        <input
                          type="checkbox"
                          checked={r.include}
                          onChange={(e) => updateRow(i, { include: e.target.checked })}
                          className="rounded accent-amber-600"
                        />
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-zinc-900 dark:text-zinc-100">
                        {formatDateDisplay(r.date)}
                      </td>
                      <td className="py-2.5 px-3 max-w-[180px] truncate text-zinc-700 dark:text-zinc-300 font-medium" title={r.description}>
                        {r.description}
                        {r.isDuplicate && (
                          <span className="ml-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            (yinelenen)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {formatTRY(r.amount)}
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          value={r.category}
                          onChange={(e) => updateRow(i, { category: e.target.value })}
                          className="rounded-lg px-2 py-1 text-xs font-bold outline-none transition-all cursor-pointer border border-amber-300/80 bg-amber-50 text-amber-950 dark:border-amber-600/70 dark:bg-amber-950/70 dark:text-amber-200"
                        >
                          {EXPENSE_CATEGORIES.map((c) => (
                            <option key={c} value={c} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={handleImport}
            disabled={selectedRows.length === 0}
            className="flex items-center justify-center gap-2 rounded-xl py-3.5 px-6 text-sm font-bold text-white shadow-xs transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: "var(--shell-accent)" }}
          >
            <span>Seçilen {selectedRows.length} Harcamayı Aktar ({formatTRY(selectedTotal)})</span>
          </button>
        </div>
      )}
    </div>
  );
}