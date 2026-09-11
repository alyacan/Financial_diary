"use client";

import { useState } from "react";
import Icon from "@/components/Icon";

interface Props {
  date: string;
  assetLabel: string;
  quantity: number;
  note?: string;
}

async function callApi(payload: object): Promise<string> {
  const res = await fetch("/api/historical-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Bilinmeyen hata");
  return data.text;
}

export default function HistoricalEventPanel({ date, assetLabel, quantity, note }: Props) {
  const [shortText, setShortText] = useState<string | null>(null);
  const [detailedText, setDetailedText] = useState<string | null>(null);
  const [loadingShort, setLoadingShort] = useState(false);
  const [loadingDetailed, setLoadingDetailed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadShort() {
    setLoadingShort(true);
    setError(null);
    try {
      const text = await callApi({ date, assetLabel, quantity, note, mode: "short" });
      setShortText(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata oluştu");
    }
    setLoadingShort(false);
  }

  async function loadDetailed() {
    setLoadingDetailed(true);
    setError(null);
    try {
      const text = await callApi({ date, assetLabel, quantity, note, mode: "detailed" });
      setDetailedText(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata oluştu");
    }
    setLoadingDetailed(false);
  }

  return (
    <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
      {error && <p className="text-red-600">{error}</p>}

      {!shortText && !loadingShort && !error && (
        <button onClick={loadShort} className="text-zinc-600 hover:underline dark:text-zinc-300">
          <Icon name="clock" /> Tarihsel bağlamı göster (AI)
        </button>
      )}

      {loadingShort && <p className="text-zinc-500">Yükleniyor...</p>}

      {shortText && (
        <div className="flex flex-col gap-2">
          <p>{shortText}</p>
          {!detailedText && (
            <button
              onClick={loadDetailed}
              disabled={loadingDetailed}
              className="self-start text-xs text-zinc-500 hover:underline"
            >
              {loadingDetailed ? "Detaylı analiz hazırlanıyor..." : "Detaylı analiz (IMRaD + SWOT) →"}
            </button>
          )}
          {detailedText && (
            <pre className="whitespace-pre-wrap font-sans text-sm">{detailedText}</pre>
          )}
        </div>
      )}
    </div>
  );
}
