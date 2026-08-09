"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import NotificationDropdown from "./NotificationDropdown";

export default function TopHeader() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [dateInfo] = useState(() => {
    if (typeof window === "undefined") return { dateNumMonthYear: "", weekday: "" };
    const now = new Date();
    const dateNumMonthYear = now.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const weekday = now.toLocaleDateString("tr-TR", { weekday: "long" });
    return { dateNumMonthYear, weekday };
  });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-6 py-4 backdrop-blur-md transition-all border-b border-zinc-200/40 dark:border-zinc-800/40">
      {/* Left Greeting */}
      <div>
        <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-xl">
          Finansal Portföyüm & Günlük
        </h1>
        <p className="hidden text-xs text-zinc-500 sm:block">
          Yatırımlar, kartlarım cüzdanı ve harcama analizi
        </p>
      </div>

      {/* Right Sleek Unified Profile & Control Bar */}
      <div className="flex items-center gap-3">
        {/* Current Date Pill — No Emoji, Stacked Weekday Name */}
        {dateInfo.dateNumMonthYear && (
          <div className="hidden lg:flex flex-col items-center justify-center rounded-2xl border border-zinc-200/80 bg-white/70 px-4 py-1.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/80">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{dateInfo.dateNumMonthYear}</span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{dateInfo.weekday}</span>
          </div>
        )}

        {/* Action Controls: Notification Bell & Settings */}
        <div className="relative flex items-center gap-1 rounded-2xl border border-zinc-200/80 bg-white/70 p-1 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/80">
          <button
            title="Bildirimler"
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative flex h-8 w-8 items-center justify-center rounded-xl text-sm transition-colors hover:bg-zinc-200/70 dark:hover:bg-zinc-800"
          >
            <span>🔔</span>
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-zinc-900" />
          </button>
          <Link
            href="/gunluk"
            title="Ayarlar & Günlük"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-sm transition-colors hover:bg-zinc-200/70 dark:hover:bg-zinc-800"
          >
            ⚙️
          </Link>

          {/* Interactive Notification Popover */}
          <NotificationDropdown
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        </div>

        {/* Prominent Profile Avatar & Badge */}
        <div className="flex items-center gap-3 rounded-full border border-zinc-200/90 bg-white/90 p-1 pr-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-amber-500/30 shadow-2xs">
            <Image
              src="/avatar.png"
              alt="Gökçe Altan Profil Fotoğrafı"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Gökçe Altan
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              gokce_altan@gmail.com
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
