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
