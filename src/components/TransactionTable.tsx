"use client";

import { Fragment, useState } from "react";
import { TransactionProfit } from "@/lib/calculations";
import { ASSET_LABELS, BALANCE_ONLY_TYPES, getAssetIcon, tefasUrl } from "@/lib/types";
import HistoricalEventPanel from "./HistoricalEventPanel";

function formatTRY(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}.${m}.${y}`;
}

interface Props {
  rows: TransactionProfit[];
  onDelete: (id: string) => void;
}

export default function TransactionTable({ rows, onDelete }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-800">
        <span className="text-3xl">📋</span>
        <h3 className="mt-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">Henüz Kayıtlı İşlem Yok</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Yukarıdaki &quot;İşlem Ekle&quot; sekmesinden varlık alım/satım veya bakiye işlemlerinizi ekleyebilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Table Header Bar */}
      <div className="hidden grid-cols-12 gap-3 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 sm:grid">
        <div className="col-span-2">Tarih</div>
        <div className="col-span-3">Varlık</div>
        <div className="col-span-2 text-right">Miktar & Alış</div>
        <div className="col-span-2 text-right">Güncel Değer</div>
        <div className="col-span-3 text-right">Performans & İşlem</div>
      </div>

      {/* Spacious Row Cards */}
      <div className="flex flex-col gap-2.5">
        {rows.map(({ transaction, currentPrice, profit, profitPercent, priceAvailable }) => {
          const icon = getAssetIcon(transaction.assetType, transaction.subType);
          const isBalanceOnly = BALANCE_ONLY_TYPES.includes(transaction.assetType);
          const isExpanded = expandedId === transaction.id;

          return (
            <Fragment key={transaction.id}>
              <div className="group relative flex flex-col gap-3 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-2xs transition-all hover:border-zinc-300 hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700">
                <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-12">
                  {/* Column 1: Date */}
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      📅 {formatDate(transaction.date)}
                    </span>
                  </div>

                  {/* Column 2: Asset Title & Badges */}
                  <div className="col-span-3 flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {icon && <span className="mr-1">{icon}</span>}
                        {ASSET_LABELS[transaction.assetType] ?? transaction.assetType} ({transaction.subType})
                      </span>

                      {transaction.fundCode && (
                        <a
                          href={tefasUrl(transaction.fundCode)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 underline hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400"
                        >
                          TEFAS ↗
                        </a>
                      )}

                      {transaction.note && (
                        <span
                          className="cursor-help rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-950/60 dark:text-amber-300"
                          title={transaction.note}
                        >
                          📝 Not
                        </span>
                      )}
                    </div>
                    {transaction.fundCategory && (
                      <span className="text-[11px] font-medium text-zinc-400">{transaction.fundCategory}</span>
                    )}
                  </div>

                  {/* Column 3: Quantity & Buy Price */}
                  <div className="col-span-2 flex flex-col sm:text-right">
                    {isBalanceOnly ? (
                      <span className="text-xs italic text-zinc-400">Nakit/Banka Bakiyesi</span>
                    ) : (
                      <>
                        <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {transaction.quantity} birim
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          Alış: {formatTRY(transaction.buyPrice)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Column 4: Current Price */}
                  <div className="col-span-2 flex flex-col sm:text-right">
                    {isBalanceOnly ? (
                      <span className="font-mono text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                        {formatTRY(transaction.quantity)}
                      </span>
                    ) : !priceAvailable ? (
                      <span className="text-xs italic text-zinc-400">Fiyat Bekleniyor</span>
                    ) : (
                      <span className="font-mono text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                        {formatTRY(currentPrice)}
                      </span>
                    )}
                  </div>

                  {/* Column 5: Unified Profit/Loss Pill & Action Buttons */}
                  <div className="col-span-3 flex flex-wrap items-center justify-end gap-2.5">
                    {!isBalanceOnly && priceAvailable && (
                      <div
                        className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold shadow-2xs ${
                          profit >= 0
                            ? "bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/50"
                            : "bg-rose-100/90 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300/50"
                        }`}
                      >
                        <span>{profit >= 0 ? "🟢" : "🔴"}</span>
                        <span>
                          {profit >= 0 ? "+" : ""}
                          {formatTRY(profit)} ({profitPercent >= 0 ? "+" : ""}
                          {profitPercent.toFixed(2)}%)
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : transaction.id)}
                        className="rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        title="Yapay zekâ ve tarihsel bağlam analizi"
                      >
                        {isExpanded ? "Kapat ▲" : "🤖 AI Bağlamı"}
                      </button>
                      <button
                        onClick={() => onDelete(transaction.id)}
                        className="rounded-xl border border-zinc-200 bg-white p-1 text-xs text-zinc-400 transition-colors hover:border-red-300 hover:text-red-600 dark:border-zinc-800 dark:bg-zinc-900"
                        title="İşlemi Sil"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historical Event Panel Accordion */}
              {isExpanded && (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 shadow-inner dark:border-zinc-800 dark:bg-zinc-900/40">
                  <HistoricalEventPanel
                    date={transaction.date}
                    assetLabel={`${ASSET_LABELS[transaction.assetType] ?? transaction.assetType} (${transaction.subType})`}
                    quantity={transaction.quantity}
                    note={transaction.note}
                  />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
