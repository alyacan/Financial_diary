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

/**
 * Centered Modal Window (formerly slide-over drawer).
 * Opens smoothly right in the center of the screen with backdrop blur and responsive dimensions.
 */
export default function SlideOverDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = "wide",
}: Props) {
  const modalRef = useRef<HTMLDivElement>(null);

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

  // Lock body scroll when modal is open
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
      ? "max-w-5xl"
      : width === "wide"
      ? "max-w-3xl"
      : "max-w-xl";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Dimmed Blurred Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* Centered Modal Container */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full ${widthClass} my-auto flex max-h-[90vh] flex-col rounded-3xl shadow-2xl border transition-all duration-200 overflow-hidden`}
        style={{
          background: "var(--shell-card-solid)",
          borderColor: "var(--shell-border)",
          color: "var(--foreground)",
        }}
      >
        {/* Modal Header */}
        <div
          className="flex items-start justify-between border-b px-6 py-5 sm:px-8 shrink-0"
          style={{ borderColor: "var(--shell-border)", background: "var(--shell-card)" }}
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

        {/* Modal Body (Scrollable & Spacious) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
