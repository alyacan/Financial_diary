"use client";

import { useCallback, useEffect, useState } from "react";
import { DividendEntry } from "@/lib/types";
import { addDividend, deleteDividend, loadDividends } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

export function useDividends() {
  const [dividends, setDividends] = useState<DividendEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshDividends = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await loadDividends();
      setDividends(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Temettü kaydı yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDividends();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_IN" ||
        event === "INITIAL_SESSION" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        refreshDividends();
      } else if (event === "SIGNED_OUT") {
        setDividends([]);
        setIsLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [refreshDividends]);

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

  return {
    dividends,
    isLoading,
    handleAddDividend,
    handleDeleteDividend,
    refreshDividends,
    error,
    clearError: () => setError(null),
  };
}
