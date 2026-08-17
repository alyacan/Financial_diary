import { supabase } from "./supabase";

export interface PriceAlert {
  id: string;
  asset: string;
  condition: "gte" | "lte";
  targetPrice: number;
  createdAt: string;
  triggeredAt?: string | null;
}

export const ASSETS = ["Gram Altın", "Dolar (USD)", "Euro (EUR)", "BIST 100 Endeksi", "Bitcoin (BTC)"];

export const ASSET_PRICE_KEY_MAP: Record<string, string> = {
  "Gram Altın": "gold:gram",
  "Dolar (USD)": "forex:USD",
  "Euro (EUR)": "forex:EUR",
  "BIST 100 Endeksi": "bist_100",
  "Bitcoin (BTC)": "crypto:bitcoin",
};

interface PriceAlertRow {
  id: string;
  asset: string;
  condition: "gte" | "lte";
  target_price: number;
  created_at: string;
  triggered_at: string | null;
}

function fromRow(row: PriceAlertRow): PriceAlert {
  return {
    id: row.id,
    asset: row.asset,
    condition: row.condition,
    targetPrice: row.target_price,
    createdAt: row.created_at,
    triggeredAt: row.triggered_at,
  };
}

export async function getStoredPriceAlerts(): Promise<PriceAlert[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from("price_alerts")
    .select("id, asset, condition, target_price, created_at, triggered_at")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(fromRow);
}

export async function addPriceAlert(
  alert: Omit<PriceAlert, "id" | "createdAt" | "triggeredAt">
): Promise<{ alerts: PriceAlert[]; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { alerts: [], error: "Alarm eklemek için giriş yapmalısın." };
  }

  const { error } = await supabase.from("price_alerts").insert({
    id: crypto.randomUUID(),
    user_id: userData.user.id,
    asset: alert.asset,
    condition: alert.condition,
    target_price: alert.targetPrice,
  });

  if (error) return { alerts: await getStoredPriceAlerts(), error: error.message };
  return { alerts: await getStoredPriceAlerts() };
}

export async function deletePriceAlert(id: string): Promise<PriceAlert[]> {
  const { error } = await supabase.from("price_alerts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return getStoredPriceAlerts();
}
