import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendToSubscriptions } from "@/lib/webPush";

export const runtime = "nodejs";

// Cron secret değil, kullanıcının kendi oturum token'ı ile çalışır — herkes
// yalnızca kendi aboneliğine test bildirimi gönderebilir, admin/pro şartı yok.
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Yetkilendirme başlığı eksik." }, { status: 401 });

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Geçersiz oturum." }, { status: 401 });
  }

  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .eq("user_id", userData.user.id);

  if (!subs || subs.length === 0) {
    return NextResponse.json({ error: "Kayıtlı bir push aboneliğin yok." }, { status: 400 });
  }

  const sent = await sendToSubscriptions(subs, {
    title: "Finansal Günlük",
    body: "Test bildirimi — bildirimler çalışıyor! 🎉",
    url: "/",
  });

  if (sent === 0) {
    return NextResponse.json({ error: "Bildirim gönderilemedi, aboneliğin geçersiz olabilir." }, { status: 502 });
  }

  return NextResponse.json({ sent });
}
