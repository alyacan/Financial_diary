"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDropdown({ isOpen, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pushStatus, setPushStatus] = useState<"default" | "granted" | "denied">(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });

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
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Tarayıcınız Web Push bildirimlerini desteklemiyor.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission);
      if (permission === "granted") {
        new Notification("Finansal Günlük 🔔", {
          body: "Web anlık bildirimler başarıyla aktifleştirildi! Bütçe ve piyasa uyarıları artık ekranınızda.",
        });
      }
    } catch {
      alert("Bildirim izni alınırken bir hata oluştu.");
    }
  }

  return (
    <div
      ref={containerRef}
      className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95"
    >
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-base">🔔</span>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Akıllı Finansal Asistan</h3>
        </div>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          2 Yeni Hatırlatma
        </span>
      </div>

      {/* Web Push Notification Permission Bar */}
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
              className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-blue-700 transition-colors"
            >
              İzin Ver
            </button>
          )}
        </div>
        <p className="mt-1 text-[10px] text-blue-900/80 dark:text-blue-300/80">
          Harici API harcamadan tarayıcınızın kendi bildirim motoruyla anlık uyarı alabilirsiniz.
        </p>
      </div>

      <div className="mt-3 flex flex-col gap-2.5">
        {/* Item 1: Duolingo-style Daily Expense Reminder */}
        <Link
          href="/harcamalar"
          onClick={onClose}
          className="group flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 transition-colors hover:bg-amber-100/60 dark:border-amber-900/40 dark:bg-amber-950/30 dark:hover:bg-amber-900/40"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-base shadow-2xs dark:bg-amber-900/50">
            📝
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-amber-950 dark:text-amber-200">Günlük Harcama Hatırlatıcısı</span>
            <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80">
              Bugün henüz harcama kaydetmedin. Gününü eksiksiz tamamlamak için harcamalarını ekle.
            </p>
          </div>
        </Link>

        {/* Item 2: Portfolio Trend Summary */}
        <Link
          href="/yatirimlar"
          onClick={onClose}
          className="group flex items-start gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3 transition-colors hover:bg-emerald-100/60 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-base shadow-2xs dark:bg-emerald-900/50">
            📈
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">Portföy Performans Özeti</span>
            <p className="text-[11px] text-emerald-900/80 dark:text-emerald-300/80">
              Yatırımlarındaki kâr oranı bu dönem pozitif ivmeyle yükselişte!
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
  );
}
