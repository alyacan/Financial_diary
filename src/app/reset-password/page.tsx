"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, updatePassword } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [sessionReady, setSessionReady] = useState<boolean | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionReady(!!data.session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (newPassword.length < 6) {
      setErrorMsg("Şifreniz en az 6 karakterden oluşmalıdır.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Girdiğiniz şifreler birbirleriyle eşleşmiyor.");
      return;
    }

    setIsLoading(true);
    const { error } = await updatePassword(newPassword);
    setIsLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setSuccessMsg("Şifreniz başarıyla güncellendi! 🎉 Artık yeni şifrenle giriş yapabilirsin.");
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Yeni Şifre Belirle 🔒
        </h1>
        <p className="mt-1 text-xs text-zinc-500">
          Mailindeki bağlantı üzerinden buraya ulaştın. Hesabın için yeni bir şifre belirle.
        </p>

        {sessionReady === false && !successMsg && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700 dark:bg-red-950/60 dark:text-red-300">
            ⚠️ Bağlantı geçersiz veya süresi dolmuş. Lütfen şifre sıfırlama işlemini yeniden başlat.
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700 dark:bg-red-950/60 dark:text-red-300">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            {successMsg}{" "}
            <Link href="/" className="underline">
              Ana sayfaya dön
            </Link>
          </div>
        )}

        {sessionReady && !successMsg && (
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3.5">
            <label className="flex flex-col gap-1 text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Yeni Şifre
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-xl border border-zinc-300 bg-white p-2.5 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Yeni Şifre (Tekrar)
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-xl border border-zinc-300 bg-white p-2.5 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                required
              />
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 rounded-xl bg-zinc-900 py-3 text-xs font-bold text-white shadow-md transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
            >
              {isLoading ? "Güncelleniyor..." : "🔒 Şifreyi Güncelle"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
