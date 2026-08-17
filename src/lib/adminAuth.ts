import { supabaseAdmin } from "./supabase-admin";

export async function requireAdmin(request: Request): Promise<{ userId: string } | { error: string; status: number }> {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return { error: "Yetkilendirme başlığı eksik.", status: 401 };

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) return { error: "Geçersiz oturum.", status: 401 };

  const { data: planRow, error: planError } = await supabaseAdmin
    .from("user_plans")
    .select("plan")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (planError || planRow?.plan !== "pro") {
    return { error: "Bu işlem için yetkiniz yok.", status: 403 };
  }

  return { userId: userData.user.id };
}
