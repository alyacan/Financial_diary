"use client";

import { useState } from "react";
import { DividendEntry } from "@/lib/types";
import { addDividend, deleteDividend, loadDividends } from "@/lib/storage";

export function useDividends() {
  const [dividends, setDividends] = useState<DividendEntry[]>(() => loadDividends());

  function handleAddDividend(entry: DividendEntry) {
    setDividends(addDividend(entry));
  }

  function handleDeleteDividend(id: string) {
    setDividends(deleteDividend(id));
  }

  return { dividends, handleAddDividend, handleDeleteDividend };
}
