import { NextResponse } from "next/server";
import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getLivePrices } from "@/lib/pricesServer";
import { ASSET_PRICE_KEY_MAP } from "@/lib/priceAlerts";

export const runtime = "nodejs";

const REMINDER_COPY: Record<string, string> = {
  "13:00": "Öğle Hatırlatması 📝: Günün ilk yarısındaki harcamalarını eklemeyi unutma.",
  "17:00": "Akşam Hatırlatması 📝: Mesai bitimi ve akşam harcamalarını tamamlamak için tıkla.",
};

interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function sendToSubscriptions(subscriptions: PushSubscriptionRow[], payload: { title: string; body: string; url?: string }) {
  let sent = 0;
  const staleIds: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
        sent++;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleIds.push(sub.id);
        }
      }
    })
  );

  if (staleIds.length > 0) {
    await supabaseAdmin.from("push_subscriptions").delete().in("id", staleIds);
  }

  return sent;
}

export async function POST(request: Request) {
  const cronSecret = request.headers.get("x-cron-secret");
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

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

    if (userSubs && userSubs.length > 0) {
      await sendToSubscriptions(userSubs, {
        title: "🔔 Fiyat Alarmı Tetiklendi",
        body: `${alert.asset} fiyatı ${alert.condition === "gte" ? "≥" : "≤"} ${alert.target_price.toLocaleString("tr-TR")} seviyesine ulaştı.`,
        url: "/yatirimlar",
      });
    }

    await supabaseAdmin.from("price_alerts").update({ triggered_at: new Date().toISOString() }).eq("id", alert.id);
    alertsTriggered++;
  }

  // 2) TR 13:00 / 17:00 günlük hatırlatmasını kontrol et
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
  const slot = hour === "13" ? "13:00" : hour === "17" ? "17:00" : null;

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
