export interface AutoDividendEvent {
  ticker: string;
  date: string; // YYYY-MM-DD, ex-dividend tarihi
  amount?: number;
  source: string;
}

function parseUsDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const match = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, month, day, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

// Nasdaq'ın herkese açık, key gerektirmeyen dividend endpoint'i — sadece ABD borsalarında
// (NASDAQ/NYSE) işlem gören hisseler için veri döner. BIST hisseleri (THYAO, ASELS vb.)
// bu kaynakta bulunmaz; onlar için otomatik erişilebilir resmi bir API yok (KAP bot korumalı).
// Nasdaq'ın yanıt süresi tekrarlanan isteklerde çok değişken (bazen saniyeler, bazen
// dakikalar) — muhtemelen IP bazlı yavaşlatma. Sayfa açılışını kilitlememesi için sert
// bir zaman aşımı uygulanır; zaman aşımına uğrarsa o hisse sessizce atlanır.
const FETCH_TIMEOUT_MS = 4000;

export async function fetchNasdaqDividend(ticker: string): Promise<AutoDividendEvent | null> {
  try {
    const res = await fetch(`https://api.nasdaq.com/api/quote/${ticker}/dividends?assetclass=stocks`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const exDate = parseUsDate(data?.data?.exDividendDate);
    if (!exDate) return null;
    const amountRaw = data?.data?.dividendHeaderValues?.find(
      (v: { label: string; value: string }) => v.label === "Annual Dividend"
    )?.value;
    const amount = amountRaw ? parseFloat(amountRaw.replace(/[^0-9.]/g, "")) : undefined;
    return { ticker, date: exDate, amount, source: "Nasdaq" };
  } catch {
    return null;
  }
}

export async function fetchNasdaqDividends(tickers: string[]): Promise<AutoDividendEvent[]> {
  const results = await Promise.all(tickers.map((t) => fetchNasdaqDividend(t)));
  return results.filter((r): r is AutoDividendEvent => r !== null);
}
