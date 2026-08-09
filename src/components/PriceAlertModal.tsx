"use client";

import { useState } from "react";

export interface PriceAlert {
  id: string;
  asset: string; // "Gram Altın", "Dolar (USD)", "Euro (EUR)", "BIST (THYAO)", "Bitcoin (BTC)"
  condition: "gte" | "lte"; // gte: >= , lte: <=
  targetPrice: number;
  createdAt: string;
}

const ALERTS_STORAGE_KEY = "financial_diary_price_alerts_v1";

export function loadPriceAlerts(): PriceAlert[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function savePriceAlerts(alerts: PriceAlert[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAlertAdded: (newAlert: PriceAlert) => void;
}

const ASSETS = ["Gram Altın", "Dolar (USD)", "Euro (EUR)", "BIST (THYAO)", "Bitcoin (BTC)"];

export default function PriceAlertModal({ isOpen, onClose, onAlertAdded }: Props) {
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => loadPriceAlerts());
  const [asset, setAsset] = useState(ASSETS[0]);
  const [condition, setCondition] = useState<"gte" | "lte">("gte");
  const [targetPrice, setTargetPrice] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  function handleAddAlert(e: React.FormEvent) {
    e.preventDefault();
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      alert("Lütfen geçerli bir hedef fiyat girin.");
      return;
    }

    const newAlert: PriceAlert = {
      id: crypto.randomUUID(),
      asset,
      condition,
      targetPrice: price,
      createdAt: new Date().toISOString(),
    };

    const updated = [newAlert, ...alerts];
    setAlerts(updated);
    savePriceAlerts(updated);
    onAlertAdded(newAlert);

    setTargetPrice("");
    setSuccessMsg(`"${asset}" için ${condition === "gte" ? "≥" : "≤"} ${price.toLocaleString("tr-TR")} ₺ alarmı eklendi! 🔔`);
    setTimeout(() => setSuccessMsg(""), 2000);
  }

  function handleDeleteAlert(id: string) {
    const updated = alerts.filter((a) => a.id !== id);
    setAlerts(updated);
    savePriceAlerts(updated);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          ➕ Fiyat Alarmı & Limit Ekle 🔔
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Gram Altın, Dolar veya BIST hisseleri belirlediğin hedef fiyata ulaştığında anında bildirim alırsın.
        </p>

        {/* Form */}
        <form onSubmit={handleAddAlert} className="mt-5 flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Varlık Seç
              <select
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                className="rounded-xl border border-zinc-300 bg-white p-2.5 text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                {ASSETS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Koşul
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as "gte" | "lte")}
                className="rounded-xl border border-zinc-300 bg-white p-2.5 text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="gte">≥ (Hedef Fiyata Ulaşırsa veya Geçerse)</option>
                <option value="lte">≤ (Hedef Fiyatın Altına Düşerse)</option>
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1 text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Hedef Fiyat (TL)
            <input
              type="number"
              step="any"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="Örn: 3200"
              required
              className="rounded-xl border border-zinc-300 bg-white p-2.5 text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </label>

          {successMsg && (
            <div className="rounded-xl bg-emerald-50 p-2 text-center text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            className="mt-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-amber-600"
          >
            🔔 Alarmı Kaydet
          </button>
        </form>

        {/* Existing Alerts List */}
        {alerts.length > 0 && (
          <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Aktif Alarmların ({alerts.length})</h4>
            <div className="mt-2.5 flex flex-col gap-2 max-h-40 overflow-y-auto">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/80 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/60"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    <span>🔔 {a.asset}</span>
                    <span className="text-amber-600 dark:text-amber-400">
                      {a.condition === "gte" ? "≥" : "≤"} {a.targetPrice.toLocaleString("tr-TR")} ₺
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteAlert(a.id)}
                    className="text-xs font-bold text-red-500 hover:text-red-700"
                    title="Alarmı Sil"
                  >
                    Sil ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
