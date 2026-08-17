"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getMyAdminStatus } from "@/lib/userPlan";

interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  plan: "free" | "pro";
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | "loading">("loading");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function authHeader(): Promise<HeadersInit> {
    const { data } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${data.session?.access_token ?? ""}` };
  }

  async function loadUsers() {
    setError("");
    const res = await fetch("/api/admin/users", { headers: await authHeader() });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "Kullanıcılar yüklenemedi.");
      return;
    }
    setUsers(body.users);
  }

  useEffect(() => {
    getMyAdminStatus().then((admin) => {
      setIsAdmin(admin);
      if (admin) loadUsers();
    });
  }, []);

  async function togglePlan(user: AdminUser) {
    setBusyId(user.id);
    const nextPlan = user.plan === "pro" ? "free" : "pro";
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { ...(await authHeader()), "Content-Type": "application/json" },
      body: JSON.stringify({ plan: nextPlan }),
    });
    const body = await res.json();
    setBusyId(null);
    if (!res.ok) {
      setError(body.error ?? "Plan güncellenemedi.");
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, plan: nextPlan } : u)));
  }

  async function deleteUser(user: AdminUser) {
    if (!confirm(`${user.email} hesabını ve tüm verilerini kalıcı olarak silmek istediğine emin misin?`)) return;
    setBusyId(user.id);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE",
      headers: await authHeader(),
    });
    const body = await res.json();
    setBusyId(null);
    if (!res.ok) {
      setError(body.error ?? "Kullanıcı silinemedi.");
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
  }

  if (isAdmin === "loading") {
    return <p className="p-8 text-sm text-zinc-500">Yükleniyor...</p>;
  }

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          Bu sayfaya erişim yetkiniz yok.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8">
      <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">🛡️ Yönetici Paneli — Kayıtlı Kullanıcılar</h1>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
              <th className="p-3">E-posta</th>
              <th className="p-3">Kayıt Tarihi</th>
              <th className="p-3">Plan</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="p-3 font-medium">{u.email}</td>
                <td className="p-3 whitespace-nowrap text-zinc-500">
                  {new Date(u.createdAt).toLocaleDateString("tr-TR")}
                </td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      u.plan === "pro"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {u.plan === "pro" ? "Pro" : "Free"}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePlan(u)}
                      disabled={busyId === u.id}
                      className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-bold hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      {u.plan === "pro" ? "Free yap" : "Pro yap"}
                    </button>
                    {u.email !== "alyanonav@gmail.com" && (
                      <button
                        onClick={() => deleteUser(u)}
                        disabled={busyId === u.id}
                        className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/40 dark:hover:bg-red-950/30"
                      >
                        Sil
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
