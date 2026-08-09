"use client";

import { useEffect, useState } from "react";
import { CalendarNote } from "@/lib/types";
import { addCalendarNote, deleteCalendarNote, loadCalendarNotes } from "@/lib/storage";

export function useCalendarNotes() {
  const [calendarNotes, setCalendarNotes] = useState<CalendarNote[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCalendarNotes().then(setCalendarNotes);
  }, []);

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

  return { calendarNotes, handleAddCalendarNote, handleDeleteCalendarNote, error, clearError: () => setError(null) };
}
