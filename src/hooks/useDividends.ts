"use client";

import { useEffect, useState } from "react";
import { DividendEntry } from "@/lib/types";
import { addDividend, deleteDividend, loadDividends } from "@/lib/storage";

export function useDividends() {
  const [dividends, setDividends] = useState<DividendEntry[]>([]);

  useEffect(() => {
    setDividends(loadDividends());
  }, []);

  function handleAddDividend(entry: DividendEntry) {
    setDividends(addDividend(entry));
  }

  function handleDeleteDividend(id: string) {
    setDividends(deleteDividend(id));
  }

  return { dividends, handleAddDividend, handleDeleteDividend };
}
