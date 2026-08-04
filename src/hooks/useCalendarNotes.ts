"use client";

import { useState } from "react";
import { CalendarNote } from "@/lib/types";
import { addCalendarNote, deleteCalendarNote, loadCalendarNotes } from "@/lib/storage";

export function useCalendarNotes() {
  const [calendarNotes, setCalendarNotes] = useState<CalendarNote[]>(() => loadCalendarNotes());

  function handleAddCalendarNote(n: CalendarNote) {
    setCalendarNotes(addCalendarNote(n));
  }

  function handleDeleteCalendarNote(id: string) {
    setCalendarNotes(deleteCalendarNote(id));
  }

  return { calendarNotes, handleAddCalendarNote, handleDeleteCalendarNote };
}
