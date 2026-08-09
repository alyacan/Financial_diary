"use client";

interface Props {
  message: string | null;
  onDismiss: () => void;
}

export default function ErrorBanner({ message, onDismiss }: Props) {
  if (!message) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-950/60"
      >
        Kapat
      </button>
    </div>
  );
}
