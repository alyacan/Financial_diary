import { PaymentCard } from "./types";
import { supabase } from "./supabase";

export const DEFAULT_PAYMENT_CARDS: PaymentCard[] = [
  { id: "card_1", name: "Garanti Bonus", color: "from-emerald-600 to-teal-800", cardType: "credit", limit: 50000 },
  { id: "card_2", name: "Ziraat Banka Kartı", color: "from-blue-600 to-indigo-900", cardType: "debit" },
  { id: "card_3", name: "Nakit Cüzdan", color: "from-amber-600 to-orange-800", cardType: "cash" },
];

interface PaymentCardRow {
  id: string;
  name: string;
  color: string;
  card_type: "credit" | "debit" | "cash";
  card_limit: number | null;
}

function fromRow(row: PaymentCardRow): PaymentCard {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    cardType: row.card_type,
    limit: row.card_limit ?? undefined,
  };
}

async function seedDefaultCards(userId: string): Promise<PaymentCard[]> {
  const seeded = DEFAULT_PAYMENT_CARDS.map((c) => ({
    id: crypto.randomUUID(),
    user_id: userId,
    name: c.name,
    color: c.color,
    card_type: c.cardType,
    card_limit: c.limit ?? null,
  }));

  const { data, error } = await supabase.from("payment_cards").insert(seeded).select();
  if (error || !data) return [];
  return data.map(fromRow);
}

export async function getStoredCards(): Promise<PaymentCard[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from("payment_cards")
    .select("id, name, color, card_type, card_limit")
    .order("created_at", { ascending: true });

  if (error) return [];
  if (data && data.length > 0) return data.map(fromRow);

  return seedDefaultCards(userData.user.id);
}

export async function addPaymentCard(card: Omit<PaymentCard, "id">): Promise<{ cards: PaymentCard[]; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { cards: [], error: "Kart eklemek için giriş yapmalısın." };
  }

  const { error } = await supabase.from("payment_cards").insert({
    id: crypto.randomUUID(),
    user_id: userData.user.id,
    name: card.name,
    color: card.color,
    card_type: card.cardType,
    card_limit: card.limit ?? null,
  });

  if (error) return { cards: await getStoredCards(), error: error.message };
  return { cards: await getStoredCards() };
}

export async function deletePaymentCard(id: string): Promise<PaymentCard[]> {
  await supabase.from("payment_cards").delete().eq("id", id);
  return getStoredCards();
}
