"use client";

import { ChangeEvent, useRef, useState } from "react";
import { UserProfile, loadUserProfile, syncUserProfile } from "@/lib/supabase";
import ProfileAvatar from "./ProfileAvatar";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (newProfile: UserProfile) => void;
  onSignOut: () => void;
}

export default function ProfileModal({ isOpen, onClose, onProfileUpdated, onSignOut }: Props) {
  const [profile] = useState<UserProfile | null>(() => loadUserProfile());
  const [nameInput, setNameInput] = useState(() => profile?.name ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(() => profile?.avatarUrl ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Fotoğraf Supabase Auth kullanıcı meta verisine (dolayısıyla oturum token'ına)
  // yazılıyor — token/çerez boyutunu şişirmemek için 128x128'e küçültüp
  // hedef ~40KB altına inene kadar JPEG kalitesini düşürüyoruz.
  const AVATAR_MAX_DIMENSION = 128;
  const AVATAR_TARGET_BYTES = 40_000;

  async function compressAvatar(file: File): Promise<string> {
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = objectUrl;
      });

      const scale = Math.min(1, AVATAR_MAX_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas context unavailable");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let quality = 0.85;
      let dataUrl = canvas.toDataURL("image/jpeg", quality);
      while (dataUrl.length * 0.75 > AVATAR_TARGET_BYTES && quality > 0.3) {
        quality -= 0.15;
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }
      return dataUrl;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Lütfen geçerli bir görsel dosyası seçin (PNG, JPG, WebP vb.).");
      return;
    }

    compressAvatar(file)
      .then(setAvatarPreview)
      .catch(() => alert("Görsel işlenemedi, lütfen başka bir fotoğraf dene."));
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMsg("");
    try {
      const updated = await syncUserProfile(nameInput.trim() || "Kullanıcı", avatarPreview);
      onProfileUpdated(updated);
      setSuccessMsg("Profil ve fotoğraf başarıyla güncellendi, tüm cihazlarına yansıyacak!");
      setTimeout(() => {
        setSuccessMsg("");
        onClose();
      }, 1200);
    } catch {
      setErrorMsg("Profil kaydedilemedi, lütfen tekrar dene.");
    } finally {
      setIsSaving(false);
    }
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
          Hesap & Profil Ayarları
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Kendi profil fotoğrafını yükleyebilir ve adını düzenleyebilirsin.
        </p>

        {/* Profile Photo Upload Section */}
        <div className="mt-6 flex flex-col items-center gap-3 border-b border-zinc-100 pb-6 dark:border-zinc-800">
          <ProfileAvatar
            avatarUrl={avatarPreview}
            name={nameInput}
            className="h-24 w-24 border-4 border-amber-500/30 shadow-md"
          />

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
              Fotoğraf Seç / Yükle
            </button>
            {avatarPreview !== null && (
              <button
                onClick={() => setAvatarPreview(null)}
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
            Hesap E-postası
            <input
              type="email"
              value={profile?.email ?? ""}
              disabled
              readOnly
              className="rounded-xl border border-zinc-200 bg-zinc-100 p-2.5 text-sm font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400"
            />
            <span className="font-normal text-[11px] text-zinc-400">
              Giriş yaptığın hesabın e-postası, buradan değiştirilemez.
            </span>
          </label>
        </div>

        {successMsg && (
          <div className="mt-4 rounded-xl bg-emerald-50 p-2.5 text-center text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mt-4 rounded-xl bg-red-50 p-2.5 text-center text-xs font-bold text-red-600 dark:bg-red-950 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex flex-col gap-2.5">
          <div className="flex gap-3">
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

          <button
            onClick={() => {
              if (window.confirm("Hesabınızdan çıkış yapmak istediğinize emin misiniz?")) {
                onSignOut();
                onClose();
              }
            }}
            className="w-full rounded-xl border border-red-200 bg-red-50/60 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400"
          >
            Oturumu Kapat / Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  );
}
