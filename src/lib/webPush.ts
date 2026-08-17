import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase-admin";

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

let vapidConfigured = false;
function ensureVapidConfigured() {
  if (vapidConfigured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  vapidConfigured = true;
}

// Aboneliklere push gönderir, geçersiz (404/410) olanları temizler ve
// gerçekten teslim edilen bildirim sayısını döner — çağıran taraf bu sayıyı
// "gönderildi" varsayıp varsaymayacağına karar vermek için kullanmalı.
export async function sendToSubscriptions(
  subscriptions: PushSubscriptionRow[],
  payload: { title: string; body: string; url?: string }
): Promise<number> {
  ensureVapidConfigured();

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
