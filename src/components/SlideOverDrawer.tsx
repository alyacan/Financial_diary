"use client";

import { useEffect, useRef } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: "normal" | "wide" | "extra-wide";
}

export default function SlideOverDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = "wide",
}: Props) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const widthClass =
    width === "extra-wide"
      ? "max-w-4xl"
      : width === "wide"
      ? "max-w-2xl"
      : "max-w-lg";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <div
          ref={drawerRef}
          className={`w-screen ${widthClass} flex flex-col shadow-2xl transition-transform duration-300 ease-out`}
          style={{
            background: "var(--shell-card-solid)",
            borderLeft: "1px solid var(--shell-border)",
            color: "var(--foreground)",
          }}
        >
          {/* Drawer Header */}
          <div
            className="flex items-start justify-between border-b px-6 py-5 sm:px-8"
            style={{ borderColor: "var(--shell-border)" }}
          >
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-1 text-xs font-medium" style={{ color: "var(--shell-muted)" }}>
                  {subtitle}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-zinc-400 transition-colors hover:bg-zinc-500/10 hover:text-zinc-700 dark:hover:text-zinc-200"
              aria-label="Kapat"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Drawer Body (Scrollable & Spacious) */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}