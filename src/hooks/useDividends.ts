"use client";

import { useEffect, useState } from "react";
import { DividendEntry } from "@/lib/types";
import { addDividend, deleteDividend, loadDividends } from "@/lib/storage";

export function useDividends() {
  const [dividends, setDividends] = useState<DividendEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDividends().then(setDividends);
  }, []);

  async function handleAddDividend(entry: DividendEntry) {
    try {
      setDividends(await addDividend(entry));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Temettü kaydı eklenemedi.");
    }
  }

  async function handleDeleteDividend(id: string) {
    try {
      setDividends(await deleteDividend(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Temettü kaydı silinemedi.");
    }
  }

  return { dividends, handleAddDividend, handleDeleteDividend, error, clearError: () => setError(null) };
}
