export type AssetType =
  | "gold"
  | "crypto"
  | "forex"
  | "fund"
  | "stock"
  | "bank"
  | "time_deposit"
  | "deposit"
  | "cash";

export const ASSET_LABELS: Record<string, string> = {
  gold: "Altın",
  crypto: "Kripto",
  forex: "Döviz",
  fund: "Fon",
  stock: "Hisse",
  bank: "Banka",
  time_deposit: "Vadeli Hesap",
  deposit: "Mevduat",
  cash: "Nakit",
};

// Bunlar için kâr/zarar hesaplanmaz — sadece bakiye olarak portföye eklenir.
export const BALANCE_ONLY_TYPES: AssetType[] = ["bank", "time_deposit", "deposit", "cash"];

export const CRYPTO_OPTIONS = [
  { id: "bitcoin", label: "Bitcoin (BTC)" },
  { id: "ethereum", label: "Ethereum (ETH)" },
] as const;

export const FOREX_OPTIONS = [
  { code: "USD", label: "Amerikan Doları (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
] as const;

export const GOLD_SUBTYPES = [
  { id: "gram", label: "Gram Altın" },
  { id: "ceyrek", label: "Çeyrek Altın" },
  { id: "cumhuriyet", label: "Cumhuriyet Altını" },
] as const;

export const FUND_CATEGORIES = [
  "Likit Fon",
  "Teknoloji Ağırlıklı",
  "Yabancı Hisse Ağırlıklı",
  "BIST 100",
  "BIST 30 Dışı",
  "Hisse Senedi Yoğun",
  "Bankacılık",
  "Yarı İletkenler",
  "Gayrimenkul",
  "Temiz Enerji",
  "Sağlık Hizmetleri",
  "Diğer",
] as const;

export interface Transaction {
  id: string;
  assetType: AssetType;
  // gold: "gram"|"ceyrek"|"cumhuriyet" | crypto coin id | forex currency code |
  // fund: TEFAS fon kodu (fiyatlandırma anahtarı budur, bkz. calculations.ts)
  subType: string;
  date: string; // YYYY-MM-DD
  quantity: number; // gram / adet / birim
  buyPrice: number; // TL per unit
  fundCode?: string; // sadece assetType "fund" için: subType ile aynı değer, TEFAS linki için
  fundCategory?: string; // sadece assetType "fund" için: görüntüleme amaçlı kategori (fiyatlandırmayı etkilemez)
  note?: string;
}

export function tefasUrl(fundCode: string): string {
  return `https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=${encodeURIComponent(fundCode.toUpperCase())}`;
}

export const EXPENSE_CATEGORIES = [
  "Market",
  "Yemek",
  "Ulaşım",
  "Eğlence",
  "Spor",
  "Eğitim",
  "Kira",
  "Faturalar",
  "Sağlık",
  "Diğer",
] as const;

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: string;
  amount: number;
  note?: string;
}

export interface CategoryBudget {
  category: string;
  monthlyGoal: number; // TL
}

export interface PortfolioSnapshot {
  date: string; // YYYY-MM-DD
  value: number; // o günkü toplam güncel portföy değeri (TRY)
}

export interface CalendarNote {
  id: string;
  date: string; // YYYY-MM-DD
  text: string;
}

// Portföydeki hisseler için temettü tarihi kaydı. Yabancı (Nasdaq/NYSE) hisseler için
// otomatik çekilen veri de, BIST gibi otomatik kaynağı olmayan hisseler için elle
// girilen veri de aynı şekle sahiptir — ikisi de takvimde aynı yerde gösterilir.
export interface DividendEntry {
  id: string;
  ticker: string; // örn: THYAO, NVDA
  date: string; // YYYY-MM-DD, ex-dividend / temettü tarihi
  amountPerShare?: number;
}

// Dönemi Kapat / Klasörle: kullanıcı istediği an mevcut harcamaları silmeden
// arşivler, ana ekran yeni dönem için temizlenir.
export interface ArchivedPeriod {
  id: string;
  name?: string; // kullanıcı tarafından verilmiş özel isim (yoksa tarih aralığı gösterilir)
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  createdAt: string; // ISO timestamp — klasörleme anı
  expenses: Expense[];
  note?: string; // döneme özel serbest not
}

export const RECURRING_CALENDAR_INFO = [
  "TÜİK enflasyon (TÜFE) verisi — genelde her ayın ilk haftasında açıklanır. Resmi ve kesin tarih için tuik.gov.tr adresine bakılabilir (otomatik entegre edilemedi, TÜİK'in veri servisi dışarıdan erişilebilir değil).",
  "OPEC(+) toplantıları — düzensiz aralıklarla yapılır, sabit bir takvimi yoktur. Güncel tarih için opec.org kontrol edilebilir.",
  "Şirket bilanço/kâr açıklama ve temettü tarihleri — şirkete göre değişir, çeyrek sonlarını takip eden birkaç hafta içinde yoğunlaşır. Resmi tarih için KAP (Kamuyu Aydınlatma Platformu) takip edilebilir.",
] as const;
