"use client";

import { useState, useMemo, useEffect } from "react";
import Icon from "@/components/Icon";
import { Expense, PaymentCard } from "@/lib/types";
import { getStoredCards, addPaymentCard, deletePaymentCard } from "@/lib/cardsStorage";

function formatTRY(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

const GRADIENT_OPTIONS = [
  { label: "Zümrüt Yeşil", value: "from-emerald-600 to-teal-900" },
  { label: "Okyanus Mavi", value: "from-blue-600 to-indigo-900" },
  { label: "Gece Mor", value: "from-purple-600 to-indigo-950" },
  { label: "Şampanya Kehribar", value: "from-amber-600 to-orange-900" },
  { label: "Obsidyen Siyah", value: "from-zinc-800 to-zinc-950" },
  { label: "Yakut Kırmızı", value: "from-rose-600 to-red-950" },
];

interface Props {
  expenses: Expense[];
  selectedCardId: string | null;
  onSelectCard: (cardId: string | null) => void;
}

export default function CardWalletWidget({ expenses, selectedCardId, onSelectCard }: Props) {
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardType, setCardType] = useState<"credit" | "debit" | "cash">("credit");
  const [cardColor, setCardColor] = useState(GRADIENT_OPTIONS[0].value);
  const [cardLimit, setCardLimit] = useState("");

  useEffect(() => {
    getStoredCards().then(setCards);
  }, []);

  const cardStats = useMemo(() => {
    const map = new Map<string, { total: number; count: number; lastExpense?: Expense }>();

    for (const card of cards) {
      map.set(card.id, { total: 0, count: 0 });
    }

    for (const e of expenses) {
      const cardId = e.cardId ?? cards[0]?.id ?? "card_1";
      const current = map.get(cardId) ?? { total: 0, count: 0 };
      current.total += e.amount;
      current.count += 1;
      if (!current.lastExpense || new Date(e.date) > new Date(current.lastExpense.date)) {
        current.lastExpense = e;
      }
      map.set(cardId, current);
    }

    return map;
  }, [expenses, cards]);

  async function handleAddCard(e: React.FormEvent) {
    e.preventDefault();
    if (!cardName.trim()) return;

    const { cards: updated, error } = await addPaymentCard({
      name: cardName.trim(),
      cardType,
      color: cardColor,
      limit: cardLimit ? parseFloat(cardLimit) : undefined,
    });

    if (error) {
      alert(error);
      return;
    }

    setCards(updated);
    setCardName("");
    setCardLimit("");
    setModalOpen(false);
  }

  async function handleDeleteCard(id: string) {
    if (cards.length <= 1) {
      alert("En az 1 adet kart kayıtlı kalmalıdır.");
      return;
    }
    if (confirm("Bu kartı cüzdanınızdan silmek istediğinize emin misiniz?")) {
      try {
        const updated = await deletePaymentCard(id);
        setCards(updated);
        if (selectedCardId === id) onSelectCard(null);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Kart silinemedi.");
      }
    }
  }

  return (
    <section
      className="flex flex-col gap-5 rounded-[22px] p-6 shadow-xs backdrop-blur-sm transition-all sm:p-7"
      style={{ background: "var(--shell-card)", border: "1px solid var(--shell-border)" }}
    >
      {/* Wallet Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: "var(--shell-border)" }}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-xs"
            style={{ background: "linear-gradient(135deg, var(--shell-hero-from), var(--shell-hero-to))" }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="2" y="5" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="2" y1="10" x2="22" y2="10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Ödeme Kartlarım & Cüzdan</h2>
            <p className="text-xs text-zinc-500 font-medium">
              Filtrelemek ve işlemlerini görmek için karta tıklayın
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedCardId && (
            <button
              onClick={() => onSelectCard(null)}
              className="rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors hover:opacity-90"
              style={{ background: "var(--shell-card-solid)", border: "1px solid var(--shell-border)", color: "var(--shell-nav-active-fg)" }}
            >
              Filtreyi Temizle (Tümü)
            </button>
          )}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:opacity-95"
            style={{ background: "var(--shell-accent)" }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Yeni Kart Ekle</span>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const stats = cardStats.get(card.id) ?? { total: 0, count: 0 };
          const isSelected = selectedCardId === card.id;

          return (
            <div
              key={card.id}
              onClick={() => onSelectCard(isSelected ? null : card.id)}
              className={`group relative flex cursor-pointer flex-col justify-between rounded-2xl bg-gradient-to-br ${card.color} p-5 text-white shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                isSelected ? "ring-4 ring-amber-400 ring-offset-2 scale-[1.02]" : "opacity-95 hover:opacity-100"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase backdrop-blur-xs">
                    {card.cardType === "credit" ? "KREDİ KARTI" : card.cardType === "debit" ? "BANKA KARTI" : "NAKİT"}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCard(card.id);
                  }}
                  className="text-white/60 opacity-0 transition-opacity hover:text-white group-hover:opacity-100 p-1"
                  title="Kartı Sil"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="my-4">
                <h3 className="font-mono text-base font-bold tracking-wide text-white drop-shadow-xs">
                  {card.name}
                </h3>
                {card.limit && (
                  <p className="text-[11px] text-white/80 mt-0.5">
                    Limit: {formatTRY(card.limit)}
                  </p>
                )}
              </div>

              <div className="flex items-end justify-between border-t border-white/20 pt-2.5">
                <span className="text-[11px] font-medium text-white/80">Bu Dönem:</span>
                <span className="font-mono text-base font-extrabold text-white">
                  {formatTRY(stats.total)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Card Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div
            className="flex w-full max-w-md flex-col gap-4 rounded-3xl p-6 sm:p-7 shadow-2xl"
            style={{
              background: "var(--shell-card-solid)",
              border: "1px solid var(--shell-border)",
            }}
          >
            <div className="flex items-center justify-between border-b pb-3.5" style={{ borderColor: "var(--shell-border)" }}>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Yeni Kart veya Cüzdan Ekle
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-500/10 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <Icon name="x" />
              </button>
            </div>

            <form onSubmit={handleAddCard} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <span>Kart / Cüzdan Adı</span>
                <input
                  type="text"
                  required
                  placeholder="Örn: Garanti Bonus, Akbank Axess, Nakit Cüzdan"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="rounded-xl p-3 text-xs font-medium outline-none transition-all"
                  style={{
                    background: "var(--shell-card)",
                    border: "1px solid var(--shell-border)",
                    color: "var(--foreground)",
                  }}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>Kart Tipi</span>
                  <select
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value as "credit" | "debit" | "cash")}
                    className="rounded-xl p-3 text-xs font-semibold outline-none transition-all cursor-pointer"
                    style={{
                      background: "var(--shell-card)",
                      border: "1px solid var(--shell-border)",
                      color: "var(--foreground)",
                    }}
                  >
                    <option value="credit">Kredi Kartı</option>
                    <option value="debit">Banka Kartı</option>
                    <option value="cash">Nakit</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>Aylık Limit (TRY)</span>
                  <input
                    type="number"
                    step="any"
                    placeholder="Örn: 50000"
                    value={cardLimit}
                    onChange={(e) => setCardLimit(e.target.value)}
                    className="rounded-xl p-3 text-xs font-mono font-bold outline-none transition-all"
                    style={{
                      background: "var(--shell-card)",
                      border: "1px solid var(--shell-border)",
                      color: "var(--foreground)",
                    }}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <span>Görsel Tema / Renk</span>
                <select
                  value={cardColor}
                  onChange={(e) => setCardColor(e.target.value)}
                  className="rounded-xl p-3 text-xs font-semibold outline-none transition-all cursor-pointer"
                  style={{
                    background: "var(--shell-card)",
                    border: "1px solid var(--shell-border)",
                    color: "var(--foreground)",
                  }}
                >
                  {GRADIENT_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl py-3 text-xs font-bold text-white shadow-xs transition-all hover:opacity-95"
                  style={{ background: "var(--shell-accent)" }}
                >
                  Cüzdana Ekle
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-5 py-3 text-xs font-semibold transition-all hover:bg-zinc-500/10"
                  style={{
                    background: "var(--shell-card)",
                    border: "1px solid var(--shell-border)",
                    color: "var(--shell-muted)",
                  }}
                >
                  Vazgeç
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}