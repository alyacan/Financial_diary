"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarNote } from "@/lib/types";
import { addCalendarNote, deleteCalendarNote, loadCalendarNotes } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

export function useCalendarNotes() {
  const [calendarNotes, setCalendarNotes] = useState<CalendarNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await loadCalendarNotes();
      setCalendarNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Notlar yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshNotes();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_IN" ||
        event === "INITIAL_SESSION" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        refreshNotes();
      } else if (event === "SIGNED_OUT") {
        setCalendarNotes([]);
        setIsLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [refreshNotes]);

  async function handleAddCalendarNote(n: CalendarNote) {
    try {
      setCalendarNotes(await addCalendarNote(n));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Not eklenemedi.");
    }
  }

  async function handleDeleteCalendarNote(id: string) {
    try {
      setCalendarNotes(await deleteCalendarNote(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Not silinemedi.");
    }
  }

  return {
    calendarNotes,
    isLoading,
    handleAddCalendarNote,
    handleDeleteCalendarNote,
    refreshNotes,
    error,
    clearError: () => setError(null),
  };
}
