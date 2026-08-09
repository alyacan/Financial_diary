"use client";

import { ChangeEvent, useRef, useState } from "react";
import Image from "next/image";
import { UserProfile, loadUserProfile, saveUserProfile } from "@/lib/supabase";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (newProfile: UserProfile) => void;
}

export default function ProfileModal({ isOpen, onClose, onProfileUpdated }: Props) {
  const [profile] = useState<UserProfile | null>(() => loadUserProfile());
  const [nameInput, setNameInput] = useState(() => profile?.name ?? "Gökçe Altan");
  const [emailInput, setEmailInput] = useState(() => profile?.email ?? "gokce_altan@gmail.com");
  const [avatarPreview, setAvatarPreview] = useState(() => profile?.avatarUrl ?? "/avatar.png");
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Lütfen geçerli bir görsel dosyası seçin (PNG, JPG, WebP vb.).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        setAvatarPreview(base64Url);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    setIsSaving(true);
    const updated: UserProfile = {
      name: nameInput.trim() || "Kullanıcı",
      email: emailInput.trim() || "user@example.com",
      avatarUrl: avatarPreview,
    };

    saveUserProfile(updated);
    onProfileUpdated(updated);
    setIsSaving(false);
    setSuccessMsg("Profil ve fotoğraf başarıyla güncellendi! 🎉");
    setTimeout(() => {
      setSuccessMsg("");
      onClose();
    }, 1200);
  }

  function handleExportData() {
    if (typeof window === "undefined") return;
    const backup: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("financial_diary")) {
        backup[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finansal-gunluk-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Hesap & Profil Ayarları 👤
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Kendi profil fotoğrafını yükleyebilir, adını düzenleyebilir ve verilerini bulut ile senkronize edebilirsin.
        </p>

        {/* Profile Photo Upload Section */}
        <div className="mt-6 flex flex-col items-center gap-3 border-b border-zinc-100 pb-6 dark:border-zinc-800">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-amber-500/30 shadow-md">
            <Image src={avatarPreview} alt="Profil Fotoğrafı" fill className="object-cover" priority />
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              📷 Fotoğraf Seç / Yükle
            </button>
            {avatarPreview !== "/avatar.png" && (
              <button
                onClick={() => setAvatarPreview("/avatar.png")}
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400"
              >
                Sıfırla
              </button>
            )}
          </div>
        </div>

        {/* Name & Email Form */}
        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Ad Soyad
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Örn: Gökçe Altan"
              className="rounded-xl border border-zinc-300 bg-white p-2.5 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-bold text-zinc-700 dark:text-zinc-300">
            E-posta Adresi (Cihaz Eşleşme Hesabı)
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Örn: gokce_altan@gmail.com"
              className="rounded-xl border border-zinc-300 bg-white p-2.5 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </label>
        </div>

        {/* Data Backup & Cloud Actions */}
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/50">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Veri Yedekleme</span>
            <span className="text-[11px] text-zinc-500">Tüm kart ve harcamalarını JSON olarak indir</span>
          </div>
          <button
            onClick={handleExportData}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            💾 JSON İndir
          </button>
        </div>

        {successMsg && (
          <div className="mt-4 rounded-xl bg-emerald-50 p-2.5 text-center text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {successMsg}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
          >
            {isSaving ? "Kaydediliyor..." : "Profil Değişikliklerini Kaydet"}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-300 px-4 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
