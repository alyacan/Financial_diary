import { NextRequest, NextResponse } from "next/server";
import { fetchNasdaqDividends } from "@/lib/dividendCalendar";

export async function GET(request: NextRequest) {
  const tickersParam = request.nextUrl.searchParams.get("tickers") ?? "";
  const tickers = tickersParam
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  if (tickers.length === 0) return NextResponse.json({ events: [] });

  const events = await fetchNasdaqDividends(tickers);
  return NextResponse.json({ events });
}
