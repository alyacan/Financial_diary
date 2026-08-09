"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function TopHeader() {
  const [formattedDate] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const now = new Date();
    const dateStr = now.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const weekdayStr = now.toLocaleDateString("tr-TR", { weekday: "long" });
    return `${dateStr}, ${weekdayStr}`;
  });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[#96E072]/40 bg-white/80 px-6 py-3.5 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/80">
      {/* Left Greeting */}
      <div>
        <h1 className="text-lg font-bold tracking-tight text-[#134611] dark:text-zinc-100 sm:text-xl">
          Finansal Portföyüm & Günlük
        </h1>
        <p className="hidden text-xs text-[#2d5e2b] dark:text-zinc-400 sm:block">
          Yatırımlar, kartlarım cüzdanı ve harcama analizi
        </p>
      </div>

      {/* Right Sleek Unified Profile & Control Bar */}
      <div className="flex items-center gap-3">
        {/* Current Date Pill */}
        {formattedDate && (
          <div className="hidden lg:flex items-center gap-2 rounded-2xl border border-[#96E072]/60 bg-[#E8FCCF]/60 px-3.5 py-1.5 text-xs font-bold text-[#134611] shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
            <span>📅</span>
            <span>{formattedDate}</span>
          </div>
        )}

        {/* Action Controls: Notification Bell & Settings */}
        <div className="flex items-center gap-1 rounded-2xl border border-[#96E072]/60 bg-[#E8FCCF]/40 p-1 dark:border-zinc-800 dark:bg-zinc-900/80">
          <button
            title="Bildirimler"
            onClick={() => alert("Henüz okunmamış bildiriminiz bulunmuyor.")}
            className="relative flex h-8 w-8 items-center justify-center rounded-xl text-sm transition-colors hover:bg-[#96E072]/30 dark:hover:bg-zinc-800"
          >
            <span>🔔</span>
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#3E8914] ring-2 ring-white dark:ring-zinc-900" />
          </button>
          <Link
            href="/gunluk"
            title="Ayarlar & Günlük"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-sm transition-colors hover:bg-[#96E072]/30 dark:hover:bg-zinc-800"
          >
            ⚙️
          </Link>
        </div>

        {/* Prominent Profile Avatar & Badge */}
        <div className="flex items-center gap-3 rounded-full border border-[#96E072]/60 bg-white p-1 pr-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-[#3E8914] shadow-2xs">
            <Image
              src="/avatar.png"
              alt="Gökçe Altan Profil Fotoğrafı"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#134611] dark:text-zinc-100 tracking-tight">
              Gökçe Altan
            </span>
            <span className="text-[10px] font-bold text-[#3E8914] dark:text-emerald-400">
              gokce_altan@gmail.com
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
