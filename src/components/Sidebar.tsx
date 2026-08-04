"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  {
    href: "/",
    label: "Ana Sayfa",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
  },
  {
    href: "/yatirimlar",
    label: "Yatırımlar",
    icon: <path d="M4 19V9M12 19V4M20 19v-7" />,
  },
  {
    href: "/harcamalar",
    label: "Harcamalar",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </>
    ),
  },
  {
    href: "/gunluk",
    label: "Finans Günlüğüm 📓",
    icon: (
      <>
        <path d="M4 4h13a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4Z" />
        <line x1="8" y1="9" x2="16" y2="9" />
        <line x1="8" y1="13" x2="14" y2="13" />
      </>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [today] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const now = new Date();
    const dateStr = now.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    const weekday = now.toLocaleDateString("tr-TR", { weekday: "long" });
    return `${dateStr}\n${weekday}`;
  });

  return (
    <aside
      className="flex flex-col gap-12 border-b p-6 md:border-b-0 md:border-r md:p-7"
      style={{ borderColor: "var(--shell-border)" }}
    >
      <div className="flex flex-col gap-0.5">
        <div className="font-serif text-xl font-medium tracking-tight">Finansal Günlük</div>
        <div className="text-xs tracking-wide" style={{ color: "var(--shell-muted)" }}>
          kişisel finans defterin
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm font-medium transition-colors"
              style={
                active
                  ? {
                      background: "var(--shell-card-solid)",
                      border: "1px solid oklch(0.85 0.03 30 / 0.5)",
                      color: "var(--shell-nav-active-fg)",
                      fontWeight: 600,
                    }
                  : { color: "var(--shell-muted-2)", border: "1px solid transparent" }
              }
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                {link.icon}
              </svg>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden flex-col gap-3 md:flex">
        <div className="flex items-center gap-2.5 px-1">
          <Image
            src="/avatar.png"
            alt="Profil"
            width={40}
            height={40}
            className="rounded-full object-cover"
            style={{ border: "1.5px solid var(--shell-border)" }}
          />
          <span className="text-sm font-medium">Gökçe</span>
        </div>

        <div
          className="rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-line"
          style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)", color: "var(--shell-muted)" }}
        >
          {today ?? ""}
        </div>
      </div>
    </aside>
  );
}
