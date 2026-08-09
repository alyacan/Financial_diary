import { createClient, type User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://demo.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "demo-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
}

const PROFILE_STORAGE_KEY = "financial_diary_user_profile_v1";

export function loadUserProfile(): UserProfile | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function profileFromUser(user: User): UserProfile {
  const existing = loadUserProfile();
  return {
    name: (user.user_metadata?.name as string | undefined)?.trim() || existing?.name || user.email?.split("@")[0] || "Kullanıcı",
    email: user.email ?? existing?.email ?? "",
    avatarUrl: existing?.avatarUrl ?? "/avatar.png",
  };
}

export async function signUpWithEmail(name: string, email: string, password: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
    },
  });
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function requestPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
  });
}

export async function updatePassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword });
}

export async function signOutUser(): Promise<void> {
  await supabase.auth.signOut();
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROFILE_STORAGE_KEY);
}
