import { supabase } from "./supabase";

export type Plan = "free" | "pro";

export async function getMyPlan(): Promise<Plan> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return "free";

  const { data, error } = await supabase
    .from("user_plans")
    .select("plan")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error || !data) return "free";
  return data.plan as Plan;
}

// Yönetici paneli erişimi 'pro' plandan tamamen bağımsızdır — bkz. adminAuth.ts.
export async function getMyAdminStatus(): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;

  const { data, error } = await supabase
    .from("user_plans")
    .select("is_admin")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error || !data) return false;
  return data.is_admin === true;
}
