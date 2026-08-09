"use client";

import { useEffect, useState } from "react";
import { CalendarNote } from "@/lib/types";
import { addCalendarNote, deleteCalendarNote, loadCalendarNotes } from "@/lib/storage";

export function useCalendarNotes() {
  const [calendarNotes, setCalendarNotes] = useState<CalendarNote[]>([]);

  useEffect(() => {
    loadCalendarNotes().then(setCalendarNotes);
  }, []);

  async function handleAddCalendarNote(n: CalendarNote) {
    setCalendarNotes(await addCalendarNote(n));
  }

  async function handleDeleteCalendarNote(id: string) {
    setCalendarNotes(await deleteCalendarNote(id));
  }

  return { calendarNotes, handleAddCalendarNote, handleDeleteCalendarNote };
}
