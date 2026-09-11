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

interface Props {
  existingExpenses: Expense[];
  onImport: (expenses: Expense[]) => void;
  cards: PaymentCard[];
  defaultCardId: string | null;
}

export default function StatementUpload({ existingExpenses, onImport, cards, defaultCardId }: Props) {
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
      const parsedRows: ParsedRow[] = data.rows.map((r: Omit<ParsedRow, "include" | "isDuplicate">) => {
        const isDuplicate = existingKeys.has(`${r.date}|${r.amount}|${r.description}`);
        return { ...r, include: !isDuplicate, isDuplicate };
      });
      setRows(parsedRows);
      setBankLabel(data.bankLabel ?? null);
      const duplicateCount = parsedRows.filter((r) => r.isDuplicate).length;
      if (duplicateCount > 0) {
        setWarning(
          `${duplicateCount} işlem daha önce içe aktarılmış görünüyor (aynı tarih/tutar/açıklama) — tekrar eklenmesin diye işaretleri otomatik kaldırıldı, istersen elle işaretleyip yine de ekleyebilirsin.`
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
  }

  const selectedRows = rows.filter((r) => r.include);
  const selectedTotal = selectedRows.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div
      className="flex flex-col gap-5 rounded-[22px] p-6 sm:p-7 shadow-xs transition-all"
      style={{
        background: "var(--shell-card-solid)",
        border: "1px solid var(--shell-border)",
      }}
    >
      <div className="border-b pb-3" style={{ borderColor: "var(--shell-border)" }}>
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <span>📄</span>
          <span>Hesap & Kredi Kartı Ekstresi Yükle</span>
        </h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          PDF veya Excel ekstrenizi yükleyin; yapay zekâ işlemleri otomatik ayrıştırıp kategorilere ayırsın.
        </p>
      </div>

      {cards.length > 0 && (
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          <span>Ekstre Hangi Karta Ait?</span>
          <select
            value={selectedCardId}
            onChange={(e) => setSelectedCardId(e.target.value)}
            className="w-full rounded-xl p-2.5 text-xs font-semibold outline-none transition-all cursor-pointer"
            style={{
              background: "var(--shell-card)",
              border: "1px solid var(--shell-border)",
              color: "var(--foreground)",
            }}
          >
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.cardType === "credit" ? "💳" : card.cardType === "debit" ? "🏦" : "💵"} {card.name} (
                {card.cardType === "credit" ? "Kredi Kartı" : card.cardType === "debit" ? "Banka Kartı" : "Nakit"})
              </option>
            ))}
          </select>
        </label>
      )}

      {/* Styled Dropzone Container */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all hover:bg-zinc-500/5 group"
        style={{ borderColor: file ? "var(--shell-accent)" : "var(--shell-border)" }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />

        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition-transform group-hover:scale-110"
          style={{ background: "oklch(0.85 0.05 25 / 0.15)", color: "var(--shell-accent-strong)" }}
        >
          {file ? "📑" : "📤"}
        </div>

        <div>
          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            {file ? file.name : "Ekstre dosyanızı seçmek için tıklayın"}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {file ? `${(file.size / 1024).toFixed(1)} KB` : "PDF, Excel (.xlsx) veya CSV formatları desteklenir"}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-1">
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            PDF Ekstre
          </span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            Excel .xlsx
          </span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            CSV
          </span>
        </div>
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-bold text-white shadow-xs transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
        style={{ background: "var(--shell-accent)" }}
      >
        <span>{loading ? "⏳" : "⚡"}</span>
        <span>{loading ? "Ekstre İşleniyor & AI Ayrıştırıyor..." : "Ekstreyi Yükle ve Ayrıştır"}</span>
      </button>

      {error && (
        <div className="rounded-xl p-3 text-xs font-medium text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
          ❌ {error}
        </div>
      )}

      {warning && (
        <div className="rounded-xl p-3 text-xs font-medium text-amber-800 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
          ⚠️ {warning}
        </div>
      )}

      {/* Parsed Rows Review Area */}
      {rows.length > 0 && (
        <div className="mt-2 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4" style={{ borderColor: "var(--shell-border)" }}>
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
                className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors hover:bg-zinc-500/10"
                style={{ color: "var(--shell-accent)" }}
              >
                Tümünü Seç
              </button>
              <button
                onClick={() => setRows((prev) => prev.map((r) => ({ ...r, include: !r.isDuplicate })))}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors hover:bg-zinc-500/10"
                style={{ color: "var(--shell-muted)" }}
              >
                Yinelenenleri Kaldır
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
              <table className="w-full min-w-[500px] border-collapse text-left text-xs">
                <thead>
                  <tr
                    className="border-b text-[10px] font-bold uppercase tracking-wider text-zinc-500"
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
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-zinc-700 dark:text-zinc-300">
                        {r.date.split("-").reverse().join(".")}
                      </td>
                      <td className="py-2.5 px-3 max-w-[180px] truncate text-zinc-600 dark:text-zinc-300" title={r.description}>
                        {r.description}
                        {r.isDuplicate && (
                          <span className="ml-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
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
                          className="rounded-lg px-2 py-1 text-xs font-semibold outline-none transition-all cursor-pointer"
                          style={{
                            background: "var(--shell-card-solid)",
                            border: "1px solid var(--shell-border)",
                            color: "var(--foreground)",
                          }}
                        >
                          {EXPENSE_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
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
            className="flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-bold text-white shadow-xs transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: "var(--shell-accent)" }}
          >
            <span>📥</span>
            <span>Seçilen {selectedRows.length} Harcamayı Döneme Aktar ({formatTRY(selectedTotal)})</span>
          </button>
        </div>
      )}
    </div>
  );
}