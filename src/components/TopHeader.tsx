"use client";

import Image from "next/image";
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
    <header className="sticky top-0 z-30 flex items-center justify-end gap-5 border-b border-zinc-200/60 bg-white/70 px-6 py-3.5 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/70">
      {/* Current Date Display */}
      {formattedDate && (
        <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-3.5 py-1.5 text-xs font-semibold text-zinc-600 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
          <span>📅</span>
          <span>{formattedDate}</span>
        </div>
      )}

      {/* Prominent Profile Avatar & Name */}
      <div className="flex items-center gap-3 rounded-full border border-zinc-200/90 bg-white p-1 pr-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
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
          <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Gökçe Altan
          </span>
          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            Aktif Oturum
          </span>
        </div>
      </div>
    </header>
  );
}
