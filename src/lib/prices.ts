import { supabase } from "./supabase";

// TEFAS canlı veri çekmeye karşı korumalı olduğu için (bkz. README), fon fiyatı gibi
// yıllık getiri/risk seviyesi de kullanıcı tarafından TEFAS sayfasına bakılarak elle girilir.
export interface FundMetadata {
  annualReturnPercent?: number;
  riskLevel?: number; // TEFAS/SPK risk değeri ölçeği: 1 (en düşük) - 7 (en yüksek)
}

export async function fetchLivePrices(): Promise<Record<string, number>> {
  const res = await fetch("/api/prices");
  if (!res.ok) throw new Error("Fiyatlar alınamadı");
  return res.json();
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function loadManualPrices(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("manual_prices").select("price_key, price");
  if (error || !data) return {};
  const result: Record<string, number> = {};
  for (const row of data as { price_key: string; price: number }[]) {
    result[row.price_key] = Number(row.price);
  }
  return result;
}

export async function getManualPrice(key: string): Promise<number> {
  const all = await loadManualPrices();
  return all[key] ?? 0;
}

export async function setManualPrice(key: string, price: number): Promise<void> {
  const userId = await currentUserId();
  if (!userId) throw new Error("Fiyat kaydetmek için giriş yapmalısın.");
  const { error } = await supabase
    .from("manual_prices")
    .upsert({ user_id: userId, price_key: key, price }, { onConflict: "user_id,price_key" });
  if (error) throw new Error(error.message);
}

export async function loadFundMetadataMap(): Promise<Record<string, FundMetadata>> {
  const { data, error } = await supabase
    .from("fund_metadata")
    .select("fund_code, annual_return_percent, risk_level");
  if (error || !data) return {};
  const result: Record<string, FundMetadata> = {};
  for (const row of data as { fund_code: string; annual_return_percent: number | null; risk_level: number | null }[]) {
    result[row.fund_code] = {
      annualReturnPercent: row.annual_return_percent ?? undefined,
      riskLevel: row.risk_level ?? undefined,
    };
  }
  return result;
}

export async function getFundMetadata(fundCode: string): Promise<FundMetadata> {
  const all = await loadFundMetadataMap();
  return all[fundCode] ?? {};
}

export async function setFundMetadata(fundCode: string, metadata: FundMetadata): Promise<void> {
  const userId = await currentUserId();
  if (!userId) throw new Error("Fon bilgisi kaydetmek için giriş yapmalısın.");
  const { error } = await supabase.from("fund_metadata").upsert(
    {
      user_id: userId,
      fund_code: fundCode,
      annual_return_percent: metadata.annualReturnPercent ?? null,
      risk_level: metadata.riskLevel ?? null,
    },
    { onConflict: "user_id,fund_code" }
  );
  if (error) throw new Error(error.message);
}
