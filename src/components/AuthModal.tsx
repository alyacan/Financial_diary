"use client";

import { useState } from "react";
import { UserProfile, saveUserProfile } from "@/lib/supabase";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
}

type AuthMode = "signup" | "login" | "reset";

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: Props) {
  const [mode, setMode] = useState<AuthMode>("signup");

  // Registration Form Inputs (Empty Default)
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  function resetForm() {
    setErrorMsg("");
    setSuccessMsg("");
    setNameInput("");
    setEmailInput("");
    setPasswordInput("");
    setConfirmPasswordInput("");
    setTermsAccepted(false);
  }

  function handleSwitchMode(newMode: AuthMode) {
    setMode(newMode);
    resetForm();
  }

  function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!nameInput.trim()) {
      setErrorMsg("Lütfen Adınız ve Soyadınızı girin.");
      return;
    }
    if (!emailInput.trim() || !emailInput.includes("@")) {
      setErrorMsg("Lütfen geçerli bir e-posta adresi girin.");
      return;
    }
    if (passwordInput.length < 6) {
      setErrorMsg("Şifreniz en az 6 karakterden oluşmalıdır.");
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setErrorMsg("Girdiğiniz şifreler birbirleriyle eşleşmiyor.");
      return;
    }
    if (!termsAccepted) {
      setErrorMsg("Lütfen kullanım ve veri güvenliği koşullarını onaylayın.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const newUser: UserProfile = {
        name: nameInput.trim(),
        email: emailInput.trim(),
        avatarUrl: "/avatar.png",
      };

      saveUserProfile(newUser);
      setIsLoading(false);
      setSuccessMsg("Hesabınız başarıyla oluşturuldu! Giriş yapılıyor... 🎉");

      setTimeout(() => {
        onAuthSuccess(newUser);
        onClose();
        resetForm();
      }, 1000);
    }, 600);
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!emailInput.trim() || !emailInput.includes("@")) {
      setErrorMsg("Lütfen geçerli bir e-posta adresi girin.");
      return;
    }
    if (!passwordInput) {
      setErrorMsg("Lütfen şifrenizi girin.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const existingUser: UserProfile = {
        name: emailInput.split("@")[0] || "Kullanıcı",
        email: emailInput.trim(),
        avatarUrl: "/avatar.png",
      };

      saveUserProfile(existingUser);
      setIsLoading(false);
      setSuccessMsg("Başarıyla giriş yapıldı! Yönlendiriliyorsunuz... ✨");

      setTimeout(() => {
        onAuthSuccess(existingUser);
        onClose();
        resetForm();
      }, 1000);
    }, 600);
  }

  function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!emailInput.trim() || !emailInput.includes("@")) {
      setErrorMsg("Lütfen geçerli e-posta adresinizi girin.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMsg(
        `"${emailInput}" adresinize güvenli şifre sıfırlama bağlantısı gönderildi! Lütfen gelen kutunuzu kontrol edin. 📩`
      );
    }, 800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
        >
          ✕
        </button>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {mode === "signup"
              ? "Güvenli Hesap Oluştur 🚀"
              : mode === "login"
              ? "Hesabına Giriş Yap 🔑"
              : "Şifre Sıfırlama 🔒"}
          </h2>
          <p className="text-xs text-zinc-500">
            {mode === "signup"
              ? "Tüm cihazlarından bütçene ve kartlarına güvenle erişmek için kayıt ol."
              : mode === "login"
              ? "E-posta ve şifrenle hesabına hemen giriş yap."
              : "E-posta adresine güvenli şifre yenileme bağlantısı göndereceğiz."}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        {mode !== "reset" && (
          <div className="mt-5 flex rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-800/80">
            <button
              onClick={() => handleSwitchMode("signup")}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                mode === "signup"
                  ? "bg-white text-zinc-900 shadow-2xs dark:bg-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Hesap Aç (Kayıt Ol)
            </button>
            <button
              onClick={() => handleSwitchMode("login")}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                mode === "login"
                  ? "bg-white text-zinc-900 shadow-2xs dark:bg-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Giriş Yap
            </button>
          </div>
        )}

        {/* Form Error / Success Banners */}
        {errorMsg && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700 dark:bg-red-950/60 dark:text-red-300">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            {successMsg}
          </div>
        )}

        {/* Sign Up Form */}
        {mode === "signup" && (
          <form onSubmit={handleSignUp} className="mt-5 flex flex-col gap-3.5">
            <label className="flex flex-col gap-1 text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Ad Soyad
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Adınız Soyadınız"
                className="rounded-xl border border-zinc-300 bg-white p-2.5 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-bold text-zinc-700 dark:text-zinc-300">
              E-posta Adresi
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="ornek@email.com"
                className="rounded-xl border border-zinc-300 bg-white p-2.5 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                required
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Şifre Belirle
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl border border-zinc-300 bg-white p-2.5 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Şifre Tekrarı
                <input
                  type="password"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl border border-zinc-300 bg-white p-2.5 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  required
                />
              </label>
            </div>

            <label className="mt-1 flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded-md border-zinc-300"
              />
              <span>
                Kullanım ve kişisel veri güvenliği koşullarını okudum, kabul ediyorum.
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 rounded-xl bg-zinc-900 py-3 text-xs font-bold text-white shadow-md transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
            >
              {isLoading ? "Hesap Oluşturuluyor..." : "🚀 Güvenli Hesabımı Oluştur"}
            </button>
          </form>
        )}

        {/* Login Form */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="mt-5 flex flex-col gap-3.5">
            <label className="flex flex-col gap-1 text-xs font-bold text-zinc-700 dark:text-zinc-300">
              E-posta Adresi
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="ornek@email.com"
                className="rounded-xl border border-zinc-300 bg-white p-2.5 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Şifre
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="rounded-xl border border-zinc-300 bg-white p-2.5 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                required
              />
            </label>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleSwitchMode("reset")}
                className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                Şifremi Unuttum?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 rounded-xl bg-zinc-900 py-3 text-xs font-bold text-white shadow-md transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
            >
              {isLoading ? "Giriş Yapılıyor..." : "🔑 Giriş Yap"}
            </button>
          </form>
        )}

        {/* Password Reset Form */}
        {mode === "reset" && (
          <form onSubmit={handlePasswordReset} className="mt-5 flex flex-col gap-3.5">
            <label className="flex flex-col gap-1 text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Kayıtlı E-posta Adresiniz
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="ornek@email.com"
                className="rounded-xl border border-zinc-300 bg-white p-2.5 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                required
              />
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 rounded-xl bg-zinc-900 py-3 text-xs font-bold text-white shadow-md transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
            >
              {isLoading ? "Gönderiliyor..." : "📩 Şifre Yenileme Bağlantısı Gönder"}
            </button>

            <button
              type="button"
              onClick={() => handleSwitchMode("login")}
              className="mt-2 text-xs font-semibold text-zinc-500 hover:underline"
            >
              ← Giriş ekranına geri dön
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
