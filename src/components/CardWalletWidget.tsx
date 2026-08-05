"use client";

import { useState, useMemo } from "react";
import { Expense, PaymentCard } from "@/lib/types";
import { getStoredCards, saveStoredCards } from "@/lib/cardsStorage";

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
  const [cards, setCards] = useState<PaymentCard[]>(() => getStoredCards());
  const [modalOpen, setModalOpen] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardType, setCardType] = useState<"credit" | "debit" | "cash">("credit");
  const [cardColor, setCardColor] = useState(GRADIENT_OPTIONS[0].value);
  const [cardLimit, setCardLimit] = useState("");

  // Calculate statistics per card for current period expenses
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

  function handleAddCard(e: React.FormEvent) {
    e.preventDefault();
    if (!cardName.trim()) return;

    const newCard: PaymentCard = {
      id: `card_${Date.now()}`,
      name: cardName.trim(),
      cardType,
      color: cardColor,
      limit: cardLimit ? parseFloat(cardLimit) : undefined,
    };

    const updated = [...cards, newCard];
    setCards(updated);
    saveStoredCards(updated);

    setCardName("");
    setCardLimit("");
    setModalOpen(false);
  }

  function handleDeleteCard(id: string) {
    if (cards.length <= 1) {
      alert("En az 1 adet kart kayıtlı kalmalıdır.");
      return;
    }
    if (confirm("Bu kartı cüzdanınızdan silmek istediğinize emin misiniz?")) {
      const updated = cards.filter((c) => c.id !== id);
      setCards(updated);
      saveStoredCards(updated);
      if (selectedCardId === id) onSelectCard(null);
    }
  }

  const totalPeriodSpend = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-zinc-50 via-white to-zinc-100/50 p-5 shadow-xs dark:border-zinc-800 dark:from-zinc-900/90 dark:via-zinc-900 dark:to-zinc-950">
      {/* Wallet Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-lg text-white shadow-2xs dark:bg-zinc-100 dark:text-black">
            💳
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Kredi & Banka Kartlarım Cüzdanı</h2>
            <p className="text-xs text-zinc-500">
              Bu dönem toplam harcama: <strong className="text-zinc-900 dark:text-zinc-100">{formatTRY(totalPeriodSpend)}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedCardId && (
            <button
              onClick={() => onSelectCard(null)}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              Filtreyi Temizle (Tüm Kartlar)
            </button>
          )}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
          >
            <span>✨</span>
            <span>Yeni Kart Ekle</span>
          </button>
        </div>
      </div>

      {/* Cards List / Slider Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const stats = cardStats.get(card.id) ?? { total: 0, count: 0 };
          const isSelected = selectedCardId === card.id;

          return (
            <div key={card.id} className="group relative">
              {/* Interactive 3D Card Tile */}
              <div
                onClick={() => onSelectCard(isSelected ? null : card.id)}
                className={`relative flex h-44 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${card.color} p-4 text-white shadow-md transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl ${
                  isSelected ? "ring-4 ring-amber-400 ring-offset-2 dark:ring-offset-zinc-950" : ""
                }`}
              >
                {/* Metallic shine backdrop element */}
                <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-white/10 blur-xl" />

                {/* Top Row: Chip + Card Type Badge + Delete */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💳</span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase backdrop-blur-xs">
                      {card.cardType === "credit" ? "KREDİ KARTI" : card.cardType === "debit" ? "BANKA KARTI" : "NAKİT"}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCard(card.id);
                    }}
                    className="text-white/60 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
                    title="Kartı Sil"
                  >
                    ✕
                  </button>
                </div>

                {/* Middle: Card Name */}
                <div>
                  <h3 className="font-mono text-base font-bold tracking-wide text-white drop-shadow-xs">
                    {card.name}
                  </h3>
                  {card.limit && (
                    <p className="text-[11px] text-white/70">
                      Limit: {formatTRY(card.limit)}
                    </p>
                  )}
                </div>

                {/* Bottom Row: Current Period Spent Total */}
                <div className="flex items-end justify-between border-t border-white/15 pt-2">
                  <span className="text-[11px] font-medium text-white/80">Bu Dönem Harcanan:</span>
                  <span className="font-mono text-base font-extrabold text-white">
                    {formatTRY(stats.total)}
                  </span>
                </div>
              </div>

              {/* Hover Tooltip Popup Box (Sayfa Yenilenmeden Üzerine Gelindiğinde Açılan Detay Kutusu) */}
              <div className="pointer-events-none absolute left-1/2 -top-2 z-30 w-64 -translate-x-1/2 -translate-y-full rounded-2xl border border-zinc-200 bg-zinc-900 p-3.5 text-white shadow-2xl opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:-top-3 group-hover:opacity-100 dark:border-zinc-700">
                <div className="mb-2 flex items-center justify-between border-b border-zinc-800 pb-1.5">
                  <span className="font-bold text-xs text-amber-300">{card.name} Harcama Detayı</span>
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">{stats.count} işlem</span>
                </div>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Dönemlik Toplam:</span>
                    <span className="font-bold text-white">{formatTRY(stats.total)}</span>
                  </div>

                  {card.limit && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Kalan Limit:</span>
                      <span className="font-medium text-emerald-400">
                        {formatTRY(Math.max(0, card.limit - stats.total))}
                      </span>
                    </div>
                  )}

                  {stats.lastExpense ? (
                    <div className="mt-1 border-t border-zinc-800/80 pt-1.5 text-[11px]">
                      <span className="text-zinc-400">Son İşlem: </span>
                      <span className="font-medium text-zinc-200">
                        {stats.lastExpense.category} ({formatTRY(stats.lastExpense.amount)})
                      </span>
                    </div>
                  ) : (
                    <p className="mt-1 text-[11px] text-zinc-500 italic">Henüz bu kartla işlem yapılmadı.</p>
                  )}
                </div>
                <div className="mt-2 text-center text-[10px] font-semibold text-amber-400/90">
                  👆 Tıklayarak harcama tablosunu filtreleyin
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Card Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Yeni Kart / Ödeme Yöntemi Ekle</h3>
              <button onClick={() => setModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCard} className="flex flex-col gap-3.5">
              <label className="flex flex-col gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Kart İçi İsim
                <input
                  type="text"
                  required
                  placeholder="Örn: Garanti Bonus, Akbank Axess, Ziraat Banka"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="rounded-xl border border-zinc-300 bg-zinc-50 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Kart Tipi
                  <select
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value as "credit" | "debit" | "cash")}
                    className="rounded-xl border border-zinc-300 bg-zinc-50 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    <option value="credit">Kredi Kartı</option>
                    <option value="debit">Banka Kartı (Mevduat)</option>
                    <option value="cash">Nakit / Cüzdan</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Aylık Limit (Opsiyonel)
                  <input
                    type="number"
                    step="any"
                    placeholder="Örn: 50000"
                    value={cardLimit}
                    onChange={(e) => setCardLimit(e.target.value)}
                    className="rounded-xl border border-zinc-300 bg-zinc-50 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Kart Rengi / Şablonu
                <select
                  value={cardColor}
                  onChange={(e) => setCardColor(e.target.value)}
                  className="rounded-xl border border-zinc-300 bg-zinc-50 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
                >
                  {GRADIENT_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-xs font-bold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black"
                >
                  Kaydet & Cüzdana Ekle
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2.5 text-xs font-semibold dark:border-zinc-700"
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
