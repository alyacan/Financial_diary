"use client";

import { useState } from "react";
import { EXPENSE_CATEGORIES, Expense } from "@/lib/types";

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
}

export default function StatementUpload({ existingExpenses, onImport }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [bankLabel, setBankLabel] = useState<string | null>(null);

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
      }));
    onImport(toImport);
    setRows([]);
    setFile(null);
  }

  return (
    <div>
      <h3 className="mb-2 font-semibold">Hesap Ekstresi Yükle</h3>
      <p className="mb-3 text-sm text-zinc-500">
        Kredi kartı/banka ekstreni PDF olarak yükle, işlemler otomatik ayrıştırılıp AI ile kategorize edilir.
        Sadece harcama (pozitif tutarlı) işlemler listelenir — ödeme/aktarım/iade satırları dahil edilmez.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="max-w-full text-sm"
        />
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-black"
        >
          {loading ? "İşleniyor..." : "Yükle ve Ayrıştır"}
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {warning && <p className="mt-2 text-sm text-amber-600">⚠️ {warning}</p>}

      {rows.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm text-zinc-500">
            {rows.length} işlem bulundu{bankLabel ? ` — algılanan format: ${bankLabel}` : ""}. Kategorileri kontrol et, istemediklerini işaretten kaldır.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                  <th className="p-2"></th>
                  <th className="p-2">Tarih</th>
                  <th className="hidden p-2 sm:table-cell">Açıklama</th>
                  <th className="p-2">Tutar</th>
                  <th className="p-2">Kategori</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={`border-b border-zinc-100 dark:border-zinc-900 ${r.isDuplicate ? "opacity-50" : ""}`}>
                    <td className="p-2">
                      <input type="checkbox" checked={r.include} onChange={(e) => updateRow(i, { include: e.target.checked })} />
                    </td>
                    <td className="p-2 whitespace-nowrap">{r.date.split("-").reverse().join(".")}</td>
                    <td className="hidden max-w-[160px] truncate p-2 sm:table-cell" title={r.description}>
                      {r.description}
                      {r.isDuplicate && <span className="ml-1 text-xs text-amber-600">(tekrar?)</span>}
                    </td>
                    <td className="p-2 whitespace-nowrap">{formatTRY(r.amount)}</td>
                    <td className="p-2">
                      <select
                        value={r.category}
                        onChange={(e) => updateRow(i, { category: e.target.value })}
                        className="rounded border border-zinc-300 p-1 dark:border-zinc-700 dark:bg-zinc-900"
                      >
                        {EXPENSE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={handleImport} className="mt-3 rounded bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-100 dark:text-black">
            Seçilenleri Harcamalara Aktar ({rows.filter((r) => r.include).length})
          </button>
        </div>
      )}
    </div>
  );
}
