import { NextResponse } from "next/server";
import { getLivePrices } from "@/lib/pricesServer";

export async function GET() {
  return NextResponse.json(await getLivePrices());
}
