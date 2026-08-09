"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <aside
      className="flex flex-col gap-12 border-b p-6 md:border-b-0 md:border-r md:p-7"
      style={{ borderColor: "var(--shell-border)" }}
    >
      <div className="flex flex-col gap-0.5">
        <div className="text-xl font-extrabold tracking-tight text-[#134611] dark:text-zinc-100">Finansal Günlük</div>
        <div className="text-xs font-semibold tracking-wide text-[#2d5e2b]">
          kişisel finans defterin
        </div>
      </div>

      <nav className="flex flex-col gap-1.5">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-sm font-bold transition-all shadow-2xs"
              style={
                active
                  ? {
                      background: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #96E072",
                      color: "#134611",
                      boxShadow: "0 2px 8px rgba(19, 70, 17, 0.08)",
                    }
                  : { color: "#1e451d", border: "1px solid transparent" }
              }
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                {link.icon}
              </svg>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
