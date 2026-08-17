import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getLivePrices } from "@/lib/pricesServer";
import { ASSET_PRICE_KEY_MAP } from "@/lib/priceAlerts";
import { sendToSubscriptions } from "@/lib/webPush";

export const runtime = "nodejs";

const REMINDER_COPY: Record<string, string> = {
  "13:00": "Öğle Hatırlatması 📝: Günün ilk yarısındaki harcamalarını eklemeyi unutma.",
  "17:00": "Akşam Hatırlatması 📝: Mesai bitimi ve akşam harcamalarını tamamlamak için tıkla.",
  "21:00": "Gece Hatırlatması 📝: Günü kapatmadan önce bugünkü harcamalarını kaydettin mi?",
};

export async function POST(request: Request) {
  const cronSecret = request.headers.get("x-cron-secret");
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prices = await getLivePrices();

  // 1) Fiyat alarmlarını kontrol et
  const { data: alerts } = await supabaseAdmin
    .from("price_alerts")
    .select("id, user_id, asset, condition, target_price")
    .is("triggered_at", null);

  let alertsChecked = 0;
  let alertsTriggered = 0;

  for (const alert of alerts ?? []) {
    alertsChecked++;
    const priceKey = ASSET_PRICE_KEY_MAP[alert.asset];
    const currentPrice = priceKey ? prices[priceKey] : undefined;
    if (!currentPrice) continue;

    const crossed =
      alert.condition === "gte" ? currentPrice >= alert.target_price : currentPrice <= alert.target_price;
    if (!crossed) continue;

    const { data: userSubs } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth")
      .eq("user_id", alert.user_id);

    const sent = userSubs && userSubs.length > 0
      ? await sendToSubscriptions(userSubs, {
          title: "🔔 Fiyat Alarmı Tetiklendi",
          body: `${alert.asset} fiyatı ${alert.condition === "gte" ? "≥" : "≤"} ${alert.target_price.toLocaleString("tr-TR")} seviyesine ulaştı.`,
          url: "/yatirimlar",
        })
      : 0;

    // Kullanıcının abonesi yoksa ya da gönderim başarısız olduysa alarmı
    // "tetiklendi" işaretlemiyoruz — bir sonraki cron turunda tekrar denenir.
    if (sent > 0) {
      await supabaseAdmin.from("price_alerts").update({ triggered_at: new Date().toISOString() }).eq("id", alert.id);
      alertsTriggered++;
    }
  }

  // 2) TR 13:00 / 17:00 / 21:00 günlük hatırlatmasını kontrol et
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hour = parts.find((p) => p.type === "hour")?.value;
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "99");
  const trDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());

  let reminderSent = false;
  const slot = hour === "13" ? "13:00" : hour === "17" ? "17:00" : hour === "21" ? "21:00" : null;

  if (slot && minute < 30) {
    const { data: existingLog } = await supabaseAdmin
      .from("daily_reminder_log")
      .select("slot")
      .eq("reminder_date", trDate)
      .eq("slot", slot)
      .maybeSingle();

    if (!existingLog) {
      const { data: allSubs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("id, user_id, endpoint, p256dh, auth");

      if (allSubs && allSubs.length > 0) {
        await sendToSubscriptions(allSubs, {
          title: "Finansal Günlük",
          body: REMINDER_COPY[slot],
          url: "/harcamalar",
        });
      }

      await supabaseAdmin.from("daily_reminder_log").insert({ reminder_date: trDate, slot });
      reminderSent = true;
    }
  }

  return NextResponse.json({ alertsChecked, alertsTriggered, reminderSent });
}
