import { PaymentCard } from "./types";

const CARDS_STORAGE_KEY = "financial_diary_payment_cards_v1";

export const DEFAULT_PAYMENT_CARDS: PaymentCard[] = [
  { id: "card_1", name: "Garanti Bonus", color: "from-emerald-600 to-teal-800", cardType: "credit", limit: 50000 },
  { id: "card_2", name: "Ziraat Banka Kartı", color: "from-blue-600 to-indigo-900", cardType: "debit" },
  { id: "card_3", name: "Nakit Cüzdan", color: "from-amber-600 to-orange-800", cardType: "cash" },
];

export function getStoredCards(): PaymentCard[] {
  if (typeof window === "undefined") return DEFAULT_PAYMENT_CARDS;
  try {
    const raw = localStorage.getItem(CARDS_STORAGE_KEY);
    if (!raw) return DEFAULT_PAYMENT_CARDS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PAYMENT_CARDS;
  } catch {
    return DEFAULT_PAYMENT_CARDS;
  }
}

export function saveStoredCards(cards: PaymentCard[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
  } catch {
    // ignore
  }
}
