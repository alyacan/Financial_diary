import { createClient } from "@supabase/supabase-js";

// Fallback demo values if environment variables are not yet configured on Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://demo.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "demo-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
}

const PROFILE_STORAGE_KEY = "financial_diary_user_profile_v1";

export function loadUserProfile(): UserProfile {
  if (typeof window === "undefined") {
    return { name: "Gökçe Altan", email: "gokce_altan@gmail.com", avatarUrl: "/avatar.png" };
  }
  const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) {
    return { name: "Gökçe Altan", email: "gokce_altan@gmail.com", avatarUrl: "/avatar.png" };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { name: "Gökçe Altan", email: "gokce_altan@gmail.com", avatarUrl: "/avatar.png" };
  }
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}
