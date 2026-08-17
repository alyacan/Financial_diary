import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: userList, error: userListError } = await supabaseAdmin.auth.admin.listUsers();
  if (userListError) return NextResponse.json({ error: userListError.message }, { status: 500 });

  const { data: plans } = await supabaseAdmin.from("user_plans").select("user_id, plan");
  const planMap = new Map((plans ?? []).map((p) => [p.user_id, p.plan]));

  const users = userList.users
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      createdAt: u.created_at,
      plan: planMap.get(u.id) ?? "free",
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return NextResponse.json({ users });
}
