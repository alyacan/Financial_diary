import { savePushSubscription } from "@/lib/pushSubscriptions";

// iOS Safari, Web Push'u yalnızca site "Ana Ekrana Ekle" ile kurulup oradan
// açıldığında destekler (iOS 16.4+); normal bir Safari sekmesinde PushManager
// hiç mevcut olmaz. Bunu ayrı tespit ediyoruz ki kullanıcıya doğru talimatı
// verelim, genel "desteklenmiyor" hatası yerine.
export function isIOSNotStandalone(): boolean {
  if (typeof navigator === "undefined") return false;
  const isIOS = /iP(hone|od|ad)/.test(navigator.userAgent);
  const isStandalone =
    ("standalone" in navigator && (navigator as unknown as { standalone?: boolean }).standalone === true) ||
    (typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)").matches);
  return isIOS && !isStandalone;
}

// Tarayıcı izni verilmiş görünse bile gerçek push aboneliği (sunucu tarafında
// kayıtlı olan) hâlâ geçerli mi diye tarayıcı seviyesinde kontrol eder —
// yalnızca Notification.permission'a bakmak, sunucunun sildiği eski bir
// aboneliği hâlâ "aktif" gibi göstermeye devam edebilir.
export async function hasActivePushSubscription(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    if (!registration) return false;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(): Promise<{ ok: boolean; error?: string }> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    if (isIOSNotStandalone()) {
      return {
        ok: false,
        error: "iPhone'da bildirim alabilmek için önce Safari'de Paylaş (⬆️) → Ana Ekrana Ekle ile bu siteyi uygulama gibi kur, sonra oradan aç.",
      };
    }
    return { ok: false, error: "Tarayıcınız Web Push bildirimlerini desteklemiyor." };
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return { ok: false, error: "Push yapılandırması eksik." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "Bildirim izni verilmedi." };
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const { error } = await savePushSubscription(subscription.toJSON());
    if (error) return { ok: false, error };

    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
