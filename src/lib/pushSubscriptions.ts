import { supabase } from "./supabase";

export async function savePushSubscription(sub: PushSubscriptionJSON): Promise<{ error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Bildirim aboneliği için giriş yapmalısın." };
  if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return { error: "Geçersiz push aboneliği." };
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      id: crypto.randomUUID(),
      user_id: userData.user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    },
    { onConflict: "endpoint" }
  );

  if (error) return { error: error.message };
  return {};
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}

export async function sendTestNotification(): Promise<{ ok: boolean; error?: string }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false, error: "Test bildirimi için giriş yapmalısın." };

  const res = await fetch("/api/notifications/test", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: body.error ?? "Test bildirimi gönderilemedi." };
  return { ok: true };
}
