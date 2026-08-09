"use client";

import { useEffect, useState } from "react";
import { DividendEntry } from "@/lib/types";
import { addDividend, deleteDividend, loadDividends } from "@/lib/storage";

export function useDividends() {
  const [dividends, setDividends] = useState<DividendEntry[]>([]);

  useEffect(() => {
    loadDividends().then(setDividends);
  }, []);

  async function handleAddDividend(entry: DividendEntry) {
    setDividends(await addDividend(entry));
  }

  async function handleDeleteDividend(id: string) {
    setDividends(await deleteDividend(id));
  }

  return { dividends, handleAddDividend, handleDeleteDividend };
}
