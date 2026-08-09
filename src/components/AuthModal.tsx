"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UserProfile,
  saveUserProfile,
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  requestPasswordReset,
  profileFromUser,
} from "@/lib/supabase";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
}

type AuthMode = "signup" | "login" | "reset";

function translateAuthError(message: string): string {
  const known: Record<string, string> = {
    "User already registered": "Bu e-posta adresi zaten kayıtlı. Giriş yapmayı dene.",
    "Invalid login credentials": "E-posta veya şifre hatalı.",
    "Email not confirmed": "Bu hesap henüz doğrulanmamış. Lütfen mailindeki bağlantıya tıkla.",
    "Unsupported provider: provider is not enabled": "Google ile giriş şu anda aktif değil.",
  };
  return known[message] ?? message;
}

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

  async function handleSignUp(e: React.FormEvent) {
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
    const { data, error } = await signUpWithEmail(nameInput.trim(), emailInput.trim(), passwordInput);
    setIsLoading(false);

    if (error) {
      setErrorMsg(translateAuthError(error.message));
      return;
    }

    if (data.session && data.user) {
      const newUser = profileFromUser(data.user);
      saveUserProfile(newUser);
      setSuccessMsg("Hesabınız başarıyla oluşturuldu! Giriş yapılıyor...");
      setTimeout(() => {
        onAuthSuccess(newUser);
        onClose();
        resetForm();
      }, 1000);
    } else {
      setSuccessMsg(
        `"${emailInput}" adresine bir doğrulama bağlantısı gönderdik. Hesabını aktifleştirmek için lütfen mailindeki bağlantıya tıkla, sonra giriş yap.`
      );
    }
  }

  async function handleLogin(e: React.FormEvent) {
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
    const { data, error } = await signInWithEmail(emailInput.trim(), passwordInput);
    setIsLoading(false);

    if (error || !data.user) {
      setErrorMsg(translateAuthError(error?.message ?? "Giriş yapılamadı."));
      return;
    }

    const existingUser = profileFromUser(data.user);
    saveUserProfile(existingUser);
    setSuccessMsg("Başarıyla giriş yapıldı! Yönlendiriliyorsunuz...");

    setTimeout(() => {
      onAuthSuccess(existingUser);
      onClose();
      resetForm();
    }, 1000);
  }

  async function handleGoogleSignIn() {
    setErrorMsg("");
    setSuccessMsg("");
    const { error } = await signInWithGoogle();
    if (error) {
      setErrorMsg(translateAuthError(error.message));
    }
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!emailInput.trim() || !emailInput.includes("@")) {
      setErrorMsg("Lütfen geçerli e-posta adresinizi girin.");
      return;
    }

    setIsLoading(true);
    const { error } = await requestPasswordReset(emailInput.trim());
    setIsLoading(false);

    if (error) {
      setErrorMsg(translateAuthError(error.message));
      return;
    }

    setSuccessMsg(
      `"${emailInput}" adresinize güvenli şifre sıfırlama bağlantısı gönderildi! Lütfen gelen kutunuzu kontrol edin.`
    );
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
              ? "Hesap Oluştur"
              : mode === "login"
              ? "Hesabına Giriş Yap"
              : "Şifre Sıfırlama"}
          </h2>
          <p className="text-xs text-zinc-500">
            {mode === "signup"
              ? "Tüm cihazlarından bütçene ve kartlarına güvenle erişmek için kayıt ol."
              : mode === "login"
              ? "E-posta ve şifrenle hesabına hemen giriş yap."
              : "E-posta adresine güvenli şifre yenileme bağlantısı göndereceğiz."}
          </p>
        </div>

        {/* Google OAuth */}
        {mode !== "reset" && (
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-300 bg-white py-2.5 text-xs font-bold text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            <svg viewBox="0 0 48 48" className="h-4 w-4">
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
              />
              <path
                fill="#FF3D00"
                d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
              />
            </svg>
            Google ile devam et
          </button>
        )}

        {mode !== "reset" && (
          <div className="mt-4 flex items-center gap-3 text-[11px] font-semibold text-zinc-400">
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            veya
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>
        )}

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
            {errorMsg}
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
                <Link href="/gizlilik" target="_blank" className="font-semibold underline">
                  Kullanım ve kişisel veri güvenliği koşullarını
                </Link>{" "}
                okudum, kabul ediyorum.
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 rounded-xl bg-zinc-900 py-3 text-xs font-bold text-white shadow-md transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
            >
              {isLoading ? "Hesap Oluşturuluyor..." : "Hesabımı Oluştur"}
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
              {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
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
              {isLoading ? "Gönderiliyor..." : "Şifre Yenileme Bağlantısı Gönder"}
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
