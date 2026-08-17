"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PriceAlertModal from "./PriceAlertModal";
import { PriceAlert, getStoredPriceAlerts } from "@/lib/priceAlerts";
import { getMyPlan, Plan } from "@/lib/userPlan";
import { subscribeToPush } from "@/hooks/usePushSubscription";
import { useExpenseData } from "@/hooks/useExpenseData";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDropdown({ isOpen, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { expenses } = useExpenseData();

  const [plan, setPlan] = useState<Plan>("free");
  const [pushStatus, setPushStatus] = useState<"default" | "granted" | "denied">(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [pushError, setPushError] = useState("");

  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [showPriceAlertModal, setShowPriceAlertModal] = useState(false);

  useEffect(() => {
    getMyPlan().then(setPlan);
    getStoredPriceAlerts().then(setPriceAlerts);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleRequestPushPermission() {
    setIsSubscribing(true);
    setPushError("");
    const result = await subscribeToPush();
    setIsSubscribing(false);
    if (!result.ok) {
      setPushError(result.error ?? "Bildirim aboneliği başarısız oldu.");
      if (typeof window !== "undefined" && "Notification" in window) {
        setPushStatus(Notification.permission);
      }
      return;
    }
    setPushStatus("granted");
  }

  // Calculate today's total expenses
  const todayISO = new Date().toISOString().slice(0, 10);
  const todayExpenses = expenses.filter((e) => e.date === todayISO);
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <>
      <div
        ref={containerRef}
        className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-base">🔔</span>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Bildirim & Fiyat Alarmları</h3>
          </div>
          {plan === "pro" && (
            <button
              onClick={() => setShowPriceAlertModal(true)}
              className="rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-amber-600 transition-colors"
            >
              ➕ Alarm Ekle
            </button>
          )}
        </div>

        {plan !== "pro" ? (
          <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
            🔒 Bu özellik şu anda yalnızca belirli hesaplara açık.
          </div>
        ) : (
          <>
            {/* Web Push Permission Bar */}
            <div className="mt-3 rounded-xl border border-blue-200/80 bg-blue-50/50 p-2.5 dark:border-blue-900/40 dark:bg-blue-950/30">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs">📣</span>
                  <span className="text-xs font-bold text-blue-950 dark:text-blue-200">
                    Web Push Bildirimleri
                  </span>
                </div>

                {pushStatus === "granted" ? (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    🟢 Aktif
                  </span>
                ) : pushStatus === "denied" ? (
                  <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-300">
                    🔴 Engellendi
                  </span>
                ) : (
                  <button
                    onClick={handleRequestPushPermission}
                    disabled={isSubscribing}
                    className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSubscribing ? "Etkinleştiriliyor..." : "İzin Ver"}
                  </button>
                )}
              </div>
              {pushError && <p className="mt-1.5 text-[11px] font-semibold text-red-600 dark:text-red-400">{pushError}</p>}
            </div>

            <div className="mt-3 flex flex-col gap-2.5 max-h-72 overflow-y-auto">
              {/* Custom Price Alerts List */}
              {priceAlerts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/30"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-sm shadow-2xs dark:bg-amber-900/50">
                    {a.triggeredAt ? "✅" : "🔔"}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                      {a.asset} Fiyat Alarmı
                    </span>
                    <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80">
                      {a.triggeredAt
                        ? `Tetiklendi: ${new Date(a.triggeredAt).toLocaleString("tr-TR")}`
                        : `Fiyat ${a.condition === "gte" ? "≥" : "≤"} ${a.targetPrice.toLocaleString("tr-TR")} ₺ seviyesine ulaştığında bildirim gönderilecek.`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-3 flex flex-col gap-2.5">
          {/* Live Today's Expense Summary */}
          <Link
            href="/harcamalar"
            onClick={onClose}
            className="flex items-start gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3 transition-colors hover:bg-emerald-100/60 dark:border-emerald-900/40 dark:bg-emerald-950/30"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm shadow-2xs dark:bg-emerald-900/50">
              📊
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                Günlük Harcama Durumu
              </span>
              <p className="text-[11px] text-emerald-900/80 dark:text-emerald-300/80">
                {todayExpenses.length > 0
                  ? `Bugün ${todayExpenses.length} işlemde toplam ${todayTotal.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })} harcama kaydedildi.`
                  : "Bugün henüz harcama kaydedilmedi."}
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-3 border-t border-zinc-100 pt-2 text-center dark:border-zinc-800">
          <button
            onClick={onClose}
            className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Tümünü Okundu İşaretle
          </button>
        </div>
      </div>

      {/* Price Alert Modal */}
      {plan === "pro" && (
        <PriceAlertModal
          isOpen={showPriceAlertModal}
          onClose={() => setShowPriceAlertModal(false)}
          onAlertAdded={(newAlert) => setPriceAlerts((prev) => [newAlert, ...prev])}
        />
      )}
    </>
  );
}
