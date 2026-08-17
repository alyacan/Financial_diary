# PROJECT_STATUS.md — Finansal Günlük

> Bu dosya, `2026-08-17` tarihinde `/Users/gokcealtan/financial-diary` altındaki dosyalar, `git log`, `git status` ve `git diff` bizzat okunarak oluşturulmuştur. Hiçbir madde varsayıma dayanmaz — her satırın karşılığı kodda gösterilen dosya/satırda mevcuttur. Canlı site: **https://diary-financial.vercel.app** (bkz. `.github/workflows/notification-check.yml`).

---

## 0. Git Durumu (özet)

- Branch `main`, `origin/main` ile güncel. Son commit: `2d02215 Remove duplicate DataMigrationBanner, keep card filter and card badges`.
- **Commit edilmemiş (unstaged) değişiklikler:** `package.json`, `package-lock.json` (yeni bağımlılıklar: `web-push`, `pg`, `@types/pg`, `@types/web-push`), `src/app/api/prices/route.ts`, `src/app/layout.tsx`, `src/components/NotificationDropdown.tsx`, `src/components/PriceAlertModal.tsx`, `src/components/TopHeader.tsx`.
- **Hiç git'e girmemiş (untracked) dosyalar (21 adet)** — bunların tamamı bildirim/push/admin/pro-plan alt sistemi:
  `.github/`, `public/manifest.json`, `public/sw.js`, `src/app/admin/`, `src/app/api/admin/`, `src/app/api/notifications/`, `src/hooks/usePushSubscription.ts`, `src/lib/adminAuth.ts`, `src/lib/priceAlerts.ts`, `src/lib/pricesServer.ts`, `src/lib/pushSubscriptions.ts`, `src/lib/supabase-admin.ts`, `src/lib/userPlan.ts`, `supabase/schema_notifications.sql`.
- **Sonuç:** Bu tüm alt sistem (bildirimler, fiyat alarmı, admin paneli, pro/free plan ayrımı) diskte çalışır durumda ama **hiçbir zaman commit edilmemiş**. Bir `git commit` atılmadan oturum kapanırsa iş kaybolma riski taşımaz (dosyalar diskte duruyor) ama repo geçmişinde yok.

---

## 1. Somut Olarak Tamamlananlar

### 1.1 Finansal Diary — Harcamalar modülü (`/harcamalar`)

- **Veri modeli** (`src/lib/types.ts`): `Expense {id, date, category, amount, note?, cardId?}`, `PaymentCard {id, name, color, cardType, limit?}`, `CategoryBudget {category, monthlyGoal}`, `ArchivedPeriod {id, name?, startDate, endDate, createdAt, expenses[], note?}`. Sabit kategori listesi `EXPENSE_CATEGORIES` (10 kategori).
- **Supabase kalıcılık katmanı** (`src/lib/storage.ts`, 675 satır): `loadExpenses/addExpense/deleteExpense/updateExpenseCategory/addExpenses` (toplu içe aktarım), `closePeriod` (dönem arşivleme mantığı — bir önceki dönemin bitişinden başlar, satır 243-301), `loadArchivedPeriods/deleteArchivedPeriod/updateArchivedPeriod`, `loadCalendarNotes/addCalendarNote/deleteCalendarNote`, `loadPortfolioSnapshots/recordPortfolioSnapshot/clearPortfolioSnapshots` (max 90 kayıt tutulur), `loadCategoryBudgets/saveCategoryBudget/deleteCategoryBudget`, `loadDividends/addDividend/deleteDividend`, ve eski localStorage → Supabase tek seferlik göç fonksiyonları (`hasLegacyLocalData`, `migrateLegacyLocalData`).
- **Kart cüzdanı** (`src/lib/cardsStorage.ts`): `getStoredCards` ilk girişte 3 varsayılan kart otomatik seed eder (satır 4-8, 28-40), `addPaymentCard`, `deletePaymentCard`.
- **Bütçe hesabı** (`src/lib/budgetStats.ts`): `computeBudgetProgress` — **takvim ayına göre değil**, hesap özeti dönemine göre (ayın **15'inden** bir sonraki ayın **14'üne**) hesaplanır (satır 12-20).
- **Dönem istatistikleri** (`src/lib/periodStats.ts`): `categoryBreakdown`, `findRecurringExpenses` (not metni eşleşmesine dayalı basit heuristik), `findUnexpectedExpenses` (dönem ortalamasının 2 katından fazlasını "beklenmeyen" sayan basit istatistik), `computePeriodStats`, `transactionsInPeriod`.
- **Word raporu** (`src/lib/periodDocx.ts`): `buildPeriodDocx` — `docx` paketiyle tamamen tarayıcıda, sunucu gerektirmeden dönem raporu (.docx) üretir; kategori dağılımı, en büyük/tekrarlayan/beklenmeyen harcamalar, tüm kayıtlar, dönem içi yatırım işlemleri tabloları + opsiyonel AI prompt eki.
- **AI prompt sihirbazı** (`src/lib/expenseAnalysisPrompt.ts`): `buildExpenseAnalysisPrompt` — analiz türü/rol/detay seviyesi/serbest odak girdisiyle dışarıdaki bir AI'ya yapıştırılacak metin üretir (uygulama kendi AI çağrısı yapmaz).
- **Ana sayfa AI içgörüsü** (`src/lib/homeInsight.ts`): `computeHomeInsight` — hiçbir AI çağrısı yapmadan, mevcut dönemi son kapanmış dönemle kategori bazında karşılaştıran gerçek veri kıyaslaması.
- **Ekstre yükleme** (`src/app/api/parse-statement/route.ts` + `src/lib/statementParser.ts` + `src/lib/bankParsers/{types,generic,isBankasiMaximum}.ts`): 3 aşamalı — (1) bilinen banka regex'i (şu an sadece **İş Bankası Maximum**, gerçek ekstreyle test edilmiş, `isBankasiMaximum.ts` satır 6), (2) tanınmayan ama metinli PDF → Gemini metinden çıkarım, (3) metinsiz (görüntü) PDF → Gemini vision. Ardından Gemini ile kategorize edilir. `generic.ts` parser'ı **hiç kullanılmıyor** (kayıtlı değil, `statementParser.ts` satır 9'daki `BANK_PARSERS` dizisinde yok) — dosyası var ama devre dışı.
- **UI sayfaları:**
  - `src/app/harcamalar/page.tsx` — 5 sekme: Genel Bakış (kategori grafiği + yoğunluk takvimi), Bütçe Hedefleri, Harcama Ekle/Ekstre, Harcamalar Listesi, Arşivlenen Dönemler. Kart bazlı filtreleme (`selectedCardId`).
  - `src/app/harcamalar/donem/[id]/page.tsx` — arşivlenmiş dönem detayı: isim/tarih düzenleme, kalıcı silme, serbest not (otomatik kaydedilir, `onBlur`), istatistik kartları, `AiAnalysisPackage`.
- **Bileşenler:** `ExpenseForm`, `ExpenseTable` (kart filtre çubuğu + inline kategori düzenleme + silme), `ExpenseChart` (recharts yatay bar), `ExpenseHeatmapCalendar` (5 kademeli günlük yoğunluk haritası, Finansal Takvim'den bağımsız), `BudgetGoals` (kategori kedi fotoğraflı ilerleme kartları), `ArchivedPeriodCard`, `StatementUpload`, `CardWalletWidget` (kart CRUD + hover tooltip + tıkla-filtrele), `AiAnalysisPackage` (prompt sihirbazı + docx indir), `DateSelect` (özel Gün/Ay/Yıl seçici, gelecek tarihleri otomatik kırpar, satır 55-67).

### 1.2 Finans Günlüğüm (`/gunluk`) — Takvim + Yatırım Günlüğü

- `src/app/gunluk/page.tsx`: 2 sekme — Finansal Takvim & Temettüler, Yatırım Günlüğü Zaman Tüneli.
- `FinancialCalendar.tsx`: aylık takvim grid'i; 3 alt sekme (Ekonomik Takvim, Temettü Haberleri, Notlarım). Ekonomik olaylar `src/lib/economicCalendar.ts`'ten: **statik 2026 TCMB PPK + FED FOMC + TÜİK TÜFE takvimi** (satır 23-61, tamamen hardcoded, 0 API maliyeti) + canlı TCMB kazıma (`fetchTcmbPpkDates`) + ForexFactory JSON (`fetchForexFactoryEvents`, sadece USD/EUR), 24 saat localStorage önbellekli.
- `dividendCalendar.ts`: Nasdaq'ın public API'sinden (key gerektirmez) sadece ABD borsası (NASDAQ/NYSE) hisseleri için temettü tarihi çeker, 4 saniye sert timeout (satır 22, IP bazlı yavaşlama nedeniyle).
- `FinancialJournal.tsx`: `note` alanı dolu olan tüm yatırım işlemlerini arama/filtre ile zaman tüneli olarak listeler.
- API route'ları: `api/dividend-calendar/route.ts` (Nasdaq proxy), `api/dividend-search/route.ts` (Gemini ile temettü araması + **hardcoded `BIST_FALLBACKS`** — bkz. §2.7), `api/economic-calendar/route.ts`.

### 1.3 Kimlik doğrulama, profil, gizlilik

- `src/lib/supabase.ts`: Supabase Auth (e-posta/şifre, Google OAuth, şifre sıfırlama). `AuthModal.tsx`, `ProfileModal.tsx`, `ProfileAvatar.tsx`, `reset-password/page.tsx`.
- `LegacyDataBanner.tsx` + `layout.tsx`: eski localStorage verisi tespit edilirse (`hasLegacyLocalData`) kullanıcıya "Hesabıma Aktar" butonu gösterir.
- `src/app/gizlilik/page.tsx`: Kullanım Koşulları / Gizlilik Politikası sayfası (bkz. §2.2 — içerik güncel değil).

### 1.4 Bildirimler / Push / Fiyat Alarmı / Admin (commit edilmemiş, ama diskte çalışır durumda)

- `src/lib/userPlan.ts` + `src/lib/adminAuth.ts`: `free`/`pro` plan ayrımı; bazı özellikler yalnızca `pro` hesaplara açık.
- `src/lib/priceAlerts.ts` + `PriceAlertModal.tsx`: 5 varlık için (Gram Altın, USD, EUR, BIST 100, Bitcoin) `≥`/`≤` fiyat alarmı — sadece `pro` plan ekleyebilir.
- `src/lib/pushSubscriptions.ts` + `usePushSubscription.ts` + `public/sw.js`: Web Push aboneliği (VAPID).
- `src/app/api/notifications/check/route.ts`: `x-cron-secret` ile korumalı, fiyat alarmlarını kontrol edip tetikler + **TR 13:00/17:00** günlük harcama girme hatırlatması gönderir (aynı gün/slot için tekrar göndermeyi `daily_reminder_log` tablosuyla engeller).
- `.github/workflows/notification-check.yml`: her 15 dakikada bir bu endpoint'i tetikleyen GitHub Actions cron.
- `src/app/admin/page.tsx` + `api/admin/users/*`: yalnızca `pro` plan görebilir; kullanıcı listesi, plan değiştirme, kullanıcı silme.
- `NotificationDropdown.tsx`: bildirim zili — fiyat alarmları, web push izin durumu, günlük harcama özeti.

### 1.5 Yatırımlar modülü (`/yatirimlar`) — diary'nin dışında ama sıkı entegre

- `src/lib/calculations.ts`: `calculatePositions`, `calculateTransactionProfits` — ortalama maliyet, güncel değer, kâr/zarar (%). Banka/Mevduat/Nakit için kâr/zarar hesaplanmaz (`BALANCE_ONLY_TYPES`).
- `src/lib/prices.ts` + `pricesServer.ts` + `api/prices/route.ts`: CoinGecko (kripto), Frankfurter (döviz), Yahoo Finance (ons altın/gümüş → gram fiyatı, BIST 100 endeksi).
- `useInvestments.ts`, `TransactionForm.tsx`, `TransactionTable.tsx`, `PortfolioChart.tsx`, `PortfolioTrendChart.tsx`, `AssetDistributionDonut.tsx`.
- `src/lib/historicalEventsPrompt.ts` + `HistoricalEventPanel.tsx` + `api/historical-events/route.ts`: Gemini ile işlem tarihine ait tarihsel/ekonomik bağlam (kısa özet + IMRaD/SWOT detaylı analiz), "gerçek zamanlı internet erişimin yok, uydurma yapma" talimatı içeriyor (satır 12-16).

### 1.6 Veritabanı şeması (Supabase, RLS açık)

- `supabase/schema_harcamalar.sql`: `payment_cards`, `expenses`, `category_budgets`, `archived_periods`, `archived_period_expenses`.
- `supabase/schema_yatirimlar_takvim.sql`: `transactions`, `calendar_notes`, `portfolio_snapshots`, `dividend_entries`.
- `supabase/schema_manual_prices.sql`: `manual_prices`, `fund_metadata`.
- `supabase/schema_notifications.sql` (untracked): `user_plans`, `push_subscriptions`, `price_alerts`, `daily_reminder_log`.
- `scripts/run-schema.mjs`: `POSTGRES_URL_NON_POOLING` ile doğrudan `pg` üzerinden şema uygulama betiği.

---

## 2. Eksik veya Yarım Kalanlar (kodda somut kanıtla)

1. **`README.md` güncel değil / gerçeği yansıtmıyor.** Satır 24: *"Veriler tarayıcıda (localStorage) saklanır — sunucu tarafı veritabanı yok."* Ancak `git log`'daki 6 commit (`33d8110`, `c1c6bd5`, `b27ae06`, `d36b44a`, `09e915e`, `c5b2660`) ve `src/lib/storage.ts` kanıtlıyor ki **tüm veri (harcama, kart, bütçe, arşiv, yatırım, takvim notu, portföy geçmişi, temettü, manuel fiyat) Supabase Postgres'te** tutuluyor. Kurulum bölümü de yalnızca `GEMINI_API_KEY` istiyor (§2.3'e bakın).

2. **`src/app/gizlilik/page.tsx` (Gizlilik Politikası) yanlış beyan içeriyor — potansiyel yasal risk.** Satır 30-34: *"Kartların, harcamaların ve bütçe hedeflerin şu an yalnızca kendi tarayıcında (cihazının yerel depolamasında) tutuluyor — bu veriler sunucularımıza gönderilmiyor."* Bu, `storage.ts`'teki gerçek davranışla doğrudan çelişiyor: bu veriler Supabase'e (üçüncü taraf sunucu) gönderiliyor ve orada saklanıyor. Sayfa güncellenmeli.

3. **`.env.example` eksik.** Sadece `GEMINI_API_KEY=` var. Kodun çalışması için ayrıca gerekli: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`src/lib/supabase.ts`), `SUPABASE_SERVICE_ROLE_KEY` (`supabase-admin.ts` satır 3-4, `!` ile non-null assert edilmiş — eksikse build/runtime hatası), `CRON_SECRET`, `VAPID_SUBJECT`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (`api/notifications/check/route.ts`), `POSTGRES_URL_NON_POOLING` (`scripts/run-schema.mjs`). Yeni bir ortamda `.env.example`'ı kopyalamak yeterli değil.

4. **Bildirim/push/admin/pro-plan alt sistemi hiç commit edilmemiş** (bkz. §0). Bu iş kaybolmaz (dosyalar diskte) ama repo geçmişinde yok; bir noktada commit atılmalı.

5. **`supabase/schema_notifications.sql` içinde kişisel e-posta hardcoded.** Satır 98: `where user_id = (select id from auth.users where email = 'alyanonav@gmail.com');` — bu, betiği başka bir ortamda/hesapta çalıştıracak birine anlamsız gelecek tek seferlik kişisel kurulum satırı.

6. **`ProfileModal.tsx`'te geliştiriciye ait varsayılan placeholder hardcoded.** Satır 16-17: profil hiç oluşturulmamışsa `nameInput` `"Gökçe Altan"`, `emailInput` `"gokce_altan@gmail.com"` olarak başlıyor. Ayrıca bu profil (ad/foto) yalnızca `localStorage`'da tutuluyor (`saveUserProfile`, Supabase'e senkron **yok**) — arayüzde "Cihaz Eşleşme Hesabı" etiketine rağmen (satır 129) cihazlar arası senkronize olmaz.

7. **`api/dividend-search/route.ts`'te kurgusal/tahmini temettü verisi.** Satır 5-45'teki `BIST_FALLBACKS` sabiti; Gemini başarısız olursa veya bilinmeyen bir tickersa, hardcoded tarih/tutarlar `found: true, source: "Takvim Bilgisi"` olarak döndürülüyor (satır 101-114) — kullanıcıya gerçek/resmi veri gibi sunulan ama doğrulanmamış tahminler. `economicCalendar.ts`'in ve `historicalEventsPrompt.ts`'in "uydurma veri verme" ilkesiyle tutarsız.

8. **Hisse (stock) için fiyat girişi yok.** `TransactionForm.tsx` stock için serbest metin subType alıyor ama `prices.ts`/`pricesServer.ts`'de hisse fiyatı çekimi/manuel giriş akışı yok → `calculatePositions` bu pozisyonlar için her zaman `priceAvailable: false` döner (README'de de roadmap'te listeleniyor, doğrulandı).

9. **`bankParsers/generic.ts` yazılmış ama hiç bağlanmamış.** `statementParser.ts` satır 9'daki `BANK_PARSERS` dizisi sadece `[isBankasiMaximum]` içeriyor; `generic` parser export ediliyor ama import/kullanılmıyor — tanınmayan formatlar doğrudan Gemini'ye düşüyor (yorum satırı 6-8 bunu açıklıyor, kasıtlı olabilir ama dosya "yarım" görünüyor).

10. **CSV/Excel ekstre desteği yok** — `StatementUpload.tsx` satır 96: `accept="application/pdf"` (README roadmap'te de belirtiliyor).

11. **Roadmap'te olup kodda hiç iz bulunmayanlar** (README "Vizyon/Yol Haritası" bölümüyle birebir doğrulandı, hiçbiri implement edilmemiş): finansal kimlik anketi + kişiselleştirilmiş AI profili; işlem hariç tutma + tekrarlayan işlem öğrenme önerisi; web arayüzü içi görevli AI asistanı; hisse temettülerinin otomatik takvime yansıması (Yahoo Finance yetkilendirme istemeye başladığı için).

12. **Pro plana geçiş için self-servis akış yok.** `user_plans` varsayılan `free`; `pro`'ya geçiş ya `schema_notifications.sql`'deki hardcoded e-posta satırı ya da admin panelinden manuel `togglePlan` ile oluyor (`admin/page.tsx` satır 43-58). Ödeme/satın alma entegrasyonu yok.

13. **TÜİK/OPEC/şirket bilanço takvimi otomatik değil** — `economicCalendar.ts`'de TÜİK için yalnızca statik 2026 tarihleri var (canlı çekim yok), OPEC hiç yok; `RECURRING_CALENDAR_INFO` (`types.ts` satır 155-159) bunu kullanıcıya düz metin olarak açıklıyor — bu kısım kasıtlı bir sınır olarak belgelenmiş, "yarım" değil ama otomasyon eksik.

---

## 3. Mevcut Dosya Ağacı ve Görevleri

```
financial-diary/
├── README.md                          Proje tanıtımı — BAZI BÖLÜMLERİ GÜNCEL DEĞİL (bkz. §2.1)
├── CLAUDE.md / AGENTS.md               Next.js 16 uyarısı ("bu senin bildiğin Next.js değil")
├── .env.example                        EKSİK — sadece GEMINI_API_KEY (bkz. §2.3)
├── package.json                        Next 16.2.10, React 19.2.4, Supabase JS, docx, recharts,
│                                        pdf-parse, @google/genai, (commit edilmemiş: web-push, pg)
│
├── src/app/
│   ├── layout.tsx                      Kök layout: Sidebar + TopHeader + LegacyDataBanner
│   ├── page.tsx                        Ana sayfa: KPI kartları, portföy trend/dağılım grafiği, AI içgörü bandı
│   ├── harcamalar/page.tsx             Harcamalar & Kartlarım ana sayfası (5 sekme)
│   ├── harcamalar/donem/[id]/page.tsx  Arşivlenmiş dönem detay sayfası
│   ├── gunluk/page.tsx                 Finans Günlüğüm (Takvim + Yatırım Günlüğü)
│   ├── yatirimlar/page.tsx             Yatırımlar ana sayfası (4 sekme)
│   ├── admin/page.tsx                  [untracked] Yönetici paneli — pro-only kullanıcı yönetimi
│   ├── gizlilik/page.tsx               Gizlilik Politikası — İÇERİK GÜNCEL DEĞİL (bkz. §2.2)
│   ├── reset-password/page.tsx         Supabase şifre sıfırlama akışı
│   └── api/
│       ├── prices/route.ts             Canlı fiyat proxy → pricesServer.ts
│       ├── parse-statement/route.ts    PDF ekstre → banka regex / Gemini metin / Gemini vision
│       ├── dividend-calendar/route.ts  Nasdaq temettü proxy (US hisseleri)
│       ├── dividend-search/route.ts    Gemini temettü araması + hardcoded BIST_FALLBACKS (§2.7)
│       ├── economic-calendar/route.ts  Statik + TCMB + ForexFactory ekonomik takvim
│       ├── historical-events/route.ts  Gemini tarihsel bağlam analizi (kısa/detaylı)
│       ├── admin/users/route.ts        [untracked] Kullanıcı listesi (pro-only)
│       ├── admin/users/[id]/route.ts   [untracked] Plan değiştir / kullanıcı sil
│       └── notifications/check/route.ts [untracked] Cron: fiyat alarmı + 13:00/17:00 hatırlatma
│
├── src/components/                     (Harcama/günlük ile doğrudan ilgili olanlar)
│   ├── ExpenseForm.tsx                 Elle harcama ekleme formu
│   ├── ExpenseTable.tsx                Harcama listesi, kart filtresi, inline kategori düzenleme
│   ├── ExpenseChart.tsx                Kategori dağılım çubuk grafiği (recharts)
│   ├── ExpenseHeatmapCalendar.tsx      Günlük harcama yoğunluk takvimi (5 kademe)
│   ├── BudgetGoals.tsx                 Hedef bazlı bütçe kartları (kedi fotoğraflı)
│   ├── ArchivedPeriodCard.tsx          Arşiv dönem kartı (isim/tarih düzenle, sil)
│   ├── StatementUpload.tsx             PDF ekstre yükleme + önizleme/düzenleme
│   ├── CardWalletWidget.tsx            Kart cüzdanı: ekle/sil, hover istatistik, tıkla-filtrele
│   ├── AiAnalysisPackage.tsx           AI prompt sihirbazı + Word (.docx) indirme
│   ├── DateSelect.tsx                  Gün/Ay/Yıl tarih seçici (gelecek tarih kilidi)
│   ├── FinancialCalendar.tsx           Ekonomik takvim + temettü + not takvimi (aylık grid)
│   ├── FinancialJournal.tsx            Notlu yatırım işlemleri zaman tüneli
│   ├── LegacyDataBanner.tsx            Eski localStorage verisini Supabase'e taşıma banner'ı
│   ├── ErrorBanner.tsx                 Genel hata mesajı banner'ı
│   ├── NotificationDropdown.tsx        [değişti, uncommitted] Bildirim zili + push izin durumu
│   ├── PriceAlertModal.tsx             [değişti, uncommitted] Fiyat alarmı ekleme/listeleme
│   ├── TopHeader.tsx                   [değişti, uncommitted] Üst bar: bildirim, admin linki, profil
│   ├── AuthModal.tsx                   Kayıt/Giriş/Şifre sıfırlama modalı (+ Google OAuth)
│   ├── ProfileModal.tsx                Profil düzenleme — HARDCODED PLACEHOLDER (§2.6)
│   ├── ProfileAvatar.tsx               Avatar gösterimi (foto veya baş harfi ikon)
│   └── Sidebar.tsx                     Sol menü (Ana Sayfa / Yatırımlar / Harcamalar / Günlük)
│
├── src/components/                     (Yatırım tarafı — diary'nin dışında, referans için)
│   ├── TransactionForm.tsx / TransactionTable.tsx
│   ├── PortfolioChart.tsx / PortfolioTrendChart.tsx / AssetDistributionDonut.tsx
│   └── HistoricalEventPanel.tsx        AI tarihsel bağlam paneli (işlem satırında açılır)
│
├── src/hooks/
│   ├── useExpenseData.ts               Harcama/bütçe/arşiv state + Supabase senkronu
│   ├── useCalendarNotes.ts             Takvim notu state
│   ├── useDividends.ts                 Manuel temettü kaydı state
│   ├── useInvestments.ts               Yatırım işlemleri + fiyat + pozisyon hesaplama state
│   └── usePushSubscription.ts          [untracked] Web Push abonelik akışı
│
├── src/lib/                            (Harcama/günlük çekirdeği)
│   ├── types.ts                        Tüm veri modelleri + sabitler (Expense, PaymentCard, vb.)
│   ├── storage.ts                      Supabase CRUD katmanı — TÜM modüller için (675 satır)
│   ├── cardsStorage.ts                 Kart CRUD + varsayılan kart seed
│   ├── budgetStats.ts                  Bütçe ilerlemesi (15-15 hesap dönemi mantığı)
│   ├── periodStats.ts                  Dönem istatistikleri (tekrarlayan/beklenmeyen harcama)
│   ├── periodDocx.ts                   Word (.docx) dönem raporu üretimi
│   ├── expenseAnalysisPrompt.ts        Dış AI için prompt metni üretimi
│   ├── homeInsight.ts                  Ana sayfa AI-siz içgörü hesaplama
│   ├── statementParser.ts              Banka parser router
│   ├── bankParsers/types.ts            Ortak tipler + TR sayı formatı ayrıştırıcı
│   ├── bankParsers/isBankasiMaximum.ts Aktif tek banka parser'ı (test edilmiş)
│   ├── bankParsers/generic.ts          YAZILMIŞ AMA BAĞLANMAMIŞ (§2.9)
│   ├── economicCalendar.ts             Statik + canlı ekonomik takvim birleştirme
│   ├── dividendCalendar.ts             Nasdaq temettü API istemcisi
│   ├── priceAlerts.ts                  [untracked] Fiyat alarmı CRUD
│   ├── pushSubscriptions.ts            [untracked] Push abonelik CRUD
│   ├── userPlan.ts                     [untracked] free/pro plan okuma
│   ├── adminAuth.ts                    [untracked] Admin route yetki kontrolü
│   ├── supabase.ts                     Supabase client + Auth fonksiyonları + local profil
│   ├── supabase-admin.ts               [untracked] Service-role Supabase client
│   ├── calculations.ts                 Yatırım pozisyon/kâr-zarar hesabı
│   ├── prices.ts / pricesServer.ts     Canlı/manuel fiyat çekimi (yatırım tarafı)
│   └── historicalEventsPrompt.ts       AI tarihsel analiz prompt şablonları
│
├── supabase/
│   ├── schema_harcamalar.sql           Kart/harcama/bütçe/arşiv tabloları + RLS
│   ├── schema_yatirimlar_takvim.sql    İşlem/takvim notu/portföy geçmişi/temettü tabloları + RLS
│   ├── schema_manual_prices.sql        Manuel fiyat + fon metadata tabloları + RLS
│   └── schema_notifications.sql        [untracked] plan/push/alarm/hatırlatma tabloları — HARDCODED E-POSTA (§2.5)
│
├── scripts/run-schema.mjs              SQL şema dosyasını Postgres'e doğrudan uygulama betiği
├── public/manifest.json                [untracked] PWA manifest
├── public/sw.js                        [untracked] Push bildirim service worker
└── .github/workflows/notification-check.yml  [untracked] 15 dakikada bir cron tetikleyici
```

---

## Özet — Bir Sonraki Adım İçin

Bu döküm; finansal diary (harcama günlüğü + finans günlüğü/takvim) modüllerinin **tam olarak Supabase'e bağlı, çalışır durumda** olduğunu, ancak **README ve gizlilik politikasının bunu yansıtmadığını**, **`.env.example`'ın eksik olduğunu**, ve **tüm bildirim/admin/pro-plan alt sisteminin commit edilmemiş** olduğunu somut biçimde ortaya koyuyor. Yeniden yapılandırmaya başlarken önce hangi eksik/tutarsızlığı önceliklendireceğimize (README/gizlilik metni düzeltme mi, `.env.example` tamamlama mı, yoksa untracked dosyaları commit'leme mi) birlikte karar verebiliriz.
