# Finansal Günlük

Yatırımlarını (altın, gümüş, kripto, döviz) takip eden, otomatik kâr/zarar hesaplayan ve yatırım kararlarını dönemin ekonomik/siyasi olaylarıyla yapay zekâ ile analiz eden kişisel finans asistanı. Ana Sayfa, Yatırımlar, Harcamalar ve Finans Günlüğüm 📓 (takvim + yatırım günlüğü) olmak üzere ayrı sayfalara bölünmüştür. Veriler artık hesaba bağlı olarak Supabase üzerinde bulutta saklanır.

## Çözdüğü Problem

İnsanlar paralarının nereye gittiğini ve yatırım kararlarının hangi koşullar altında alındığını düzenli takip edemiyor. Bu uygulama, her yatırım işlemini otomatik kâr/zarar hesabıyla birlikte kaydeder ve kullanıcının "neden bu kararı verdim?" sorusuna, işlemin yapıldığı tarihteki gerçek ekonomik/siyasi bağlamı AI ile göstererek cevap verir.

## Şu An Çalışan Özellikler (MVP)

- **Hesap ve kimlik doğrulama**: E-posta/şifre ile kayıt olma ve giriş, Google ile giriş, şifre sıfırlama e-postası (Supabase Auth). Profil modalinden isim/e-posta düzenleme ve avatar yükleme; sol menüde profil avatarı gösterilir. Ayrı bir gizlilik politikası sayfası (`/gizlilik`) kayıt formundan linklenir.
- **Ana Sayfa dashboard**: Sol menülü (Sidebar), sıcak/terrakota temalı tasarım (Manrope + Newsreader fontları, oklch renk paleti — Claude Design'da hazırlanan mockup'a göre uygulandı). Güncel Değer/Toplam Yatırım/Toplam Harcama/Toplam Kâr-Zarar özet kartları, varlık türüne göre portföy dağılım donut grafiği, portföy değeri trend grafiği (bugünden itibaren gerçek günlük değer kaydedilip zamanla birikir), hızlı erişim kartları ve **AI Analiz bandı**: bu dönem harcamalarını en son kapatılan dönemle kategori bazında karşılaştıran, gerçek verilere dayalı (AI API çağrısı yapmayan) basit bir kıyaslama.
- **Manuel yatırım girişi**: Altın (Gram/Çeyrek/Cumhuriyet), Gümüş (Gram), kripto (BTC/ETH), döviz (USD/EUR), Fon (Likit Fon, Teknoloji Ağırlıklı, BIST 30 Dışı, Hisse Senedi Yoğun vb. + özel kategori girişi), Hisse, Banka, Mevduat (vadeli dahil), Nakit. Tarih girişi, tarayıcı/işletim sistemi diline bağlı kalmadan her zaman Gün/Ay/Yıl (Türkçe) sırasında.
- **Otomatik kâr/zarar hesaplama**: Ortalama maliyet, toplam yatırım, güncel değer, işlem bazlı ve toplam kâr/zarar (yüzde dahil). Banka/Mevduat/Nakit için kâr/zarar hesaplanmaz — bunlar sadece portföydeki bakiye payını gösterir.
- **Canlı fiyatlar**: Kripto (CoinGecko), döviz (Frankfurter), gram altın, gram gümüş (ikisi de uluslararası ons vadeli işlem fiyatı, Yahoo Finance + USD/TRY kuru ile hesaplanır — kuyumcu satış fiyatından işçilik/prim farkı nedeniyle sapabilir, referans niteliğindedir) ve BIST 100 endeksi otomatik çekilir. Çeyrek/Cumhuriyet altın ve **Fon (TEFAS kodu bazında)** için manuel güncel fiyat girişi var — TEFAS otomatik veri çekmeye karşı ciddi bot koruması (F5/Shape Security) kullandığı için canlı entegrasyon denenmedi; kullanıcı TEFAS linkine tıklayıp gerçek fiyatı görüp elle girer, gerçek kâr/zarar hesabı bu şekilde çalışır. Hisse için henüz fiyat girişi yok.
- **Portföy dağılım grafiği**: Varlık türüne göre yatay çubuk grafik (dataviz iyi pratiklerine uygun — çakışan etiket yok, küsüratsız kısa değerler). Ayrıca Fon kategorileri için yatırılan tutara göre ayrı bir dağılım listesi.
- **Fon yıllık getiri/risk seviyesi**: TEFAS bu veriyi de otomatik çekmeye karşı korumalı olduğu için, güncel fiyat girişiyle aynı desende — fon kodu bazında yıllık getiri (%) ve risk seviyesi (1-7, TEFAS/SPK ölçeği) elle girilip Yatırımlar sayfasında rozetle gösterilir.
- **Fiyat alarmları ve bildirimler**: Bildirim panelinden (NotificationDropdown) altın/dolar/euro/BIST/BTC için hedef fiyat alarmı kurulabilir (PriceAlertModal). Tarayıcı izin verirse Web Push izni istenir; ayrıca TR saatiyle 13:00 ve 17:00'de günün harcamalarını girmeyi hatırlatan zamanlı bir bildirim gösterilir.
- **Ödeme kartı cüzdanı**: Harcamalar sayfasında kredi/banka kartı veya nakit kartları eklenip renklendirilebilir (CardWalletWidget); harcama tablosuna Ödeme Kartı sütunu eklendi ve kart bazlı filtre bar'ı ile o karta ait harcamalar süzülebilir.
- **AI destekli tarihsel olay analizi**: Her işlem için, o tarihteki önemli ekonomik/siyasi gelişmelerin kısa özeti; istenirse Gemini ile IMRaD formatında + SWOT analizi içeren detaylı rapora genişletilebilir. Model gerçek zamanlı internete erişemediği için yalnızca eğitim verisindeki bilgiye dayanır ve emin olmadığı durumları açıkça belirtir (uydurma kaynak vermez). **Bilinen sınır:** Model kendi eğitim verisi kapsamına çok yakın veya sonraki tarihler için ("bu ay yaptığım işlem gibi") dürüstçe bilgisi olmadığını söyler — bu bir hata değil, kasıtlı bir güvenlik davranışıdır. (Google Arama ile gerçek zamanlı erişim teknik olarak mümkün ama ücretsiz key'lerde kota dışı; faturalandırma açılırsa etkinleştirilebilir.)
- **Harcama Analizi**: Kategori bazlı (Market, Yemek, Ulaşım, Eğlence, Spor, Eğitim, Kira, Faturalar, Sağlık, Diğer) manuel harcama girişi, toplam harcama özeti, kategori dağılım çubuk grafiği.
- **Dönemi Kapat / Klasörle**: İstediğin an mevcut harcamaları silmeden arşivler, ana ekranı yeni dönem için temizler. Arşivlenen her dönem tarih aralığıyla (veya verilmişse özel ismiyle) listelenir; kart üzerine gelince ✏️ (isim/tarih aralığı düzenleme) ve 🗑️ (kalıcı silme) simgeleri çıkar — her ikisi de detay sayfasının başlığında da mevcuttur, ikisi de aynı veriyi güncellediği için her yerde tutarlı kalır. Açınca kategori dağılımı, en büyük/tekrarlayan/beklenmeyen harcamalar (basit yaklaşımlarla), döneme özel serbest bir not alanı, tüm harcama kayıtları ve o tarih aralığındaki yatırım işlemlerini gösterir. **AI Analiz Paketi**: Uygulama kendisi hiçbir AI API'sine bağlı değildir — "Prompt Oluştur" kısa bir sihirbazla (analiz türü, AI rolü, detay seviyesi, serbest odak metni) kişiye özel bir analiz promptu üretir; "Word (.docx) Oluştur" aynı döneme ait tüm veriyi + oluşturulan promptun bir kopyasını içeren bir Word dosyası indirir. Kullanıcı ikisini de istediği yapay zekâya (ChatGPT, Claude, Gemini vb.) kendisi yükler. Not: Bu pakette sadece harcama ve yatırım verisi analiz edilir — gelir/tasarruf takibi henüz yok.
- **Hedef Bazlı Bütçe**: Kategori başına aylık harcama hedefi belirlenir; ilerleme çubuğu bu ayki harcamayı hedefe göre, ayrıca geçen aya göre farkı gösterir (takvim ayı bazlı, Dönemi Kapat'tan bağımsız).
- **Harcama Yoğunluk Takvimi**: Harcamalar sayfasında, Finansal Takvim'den tamamen bağımsız ayrı bir mini takvim. Sadece geçmişe bakar — o dönemin her gününü, o günkü toplam harcama tutarına göre (en yüksek harcama günü en koyu, azaldıkça pastelleşen) 5 kademeli bir renk skalasıyla gösterir. Bir güne tıklayınca o günün harcama dökümü altta açılır.
- **Finans Günlüğüm 📓**: Finansal Takvim ve Yatırım Günlüğü tek sayfada. Takvimde **gerçek, otomatik ekonomik olaylar** var: TCMB PPK faiz kararı tarihleri (tcmb.gov.tr resmi takviminden çekilir) + FED/ECB faiz kararları ve ABD/Avrupa önemli veri açıklamaları (ForexFactory herkese açık takviminden, sadece USD/EUR — TRY kapsamı yok); "Canlı Ekonomik Takvimi Yenile" butonuyla bu veriler 24 saat önbellekli olarak tazelenir. TÜİK TÜFE açıklama tarihleri, TÜİK'in düzenli aylık takvimine göre önceden tanımlanmış (canlı API değil — TÜİK'in veri servisi dışarıdan erişilebilir değil). **AI destekli temettü tarihi arama**: Hisse ticker'ı için Nasdaq'ın herkese açık API'siyle (yalnızca NASDAQ/NYSE hisseleri) otomatik temettü tarihi çekilir; BIST hisseleri (KAP bot korumalı olduğundan) için Gemini ile arama + bilinen büyük BIST hisseleri (BIMAS, TUPRS, EREGL, FROTO, AKBNK, ENJSA, MGROS, SISE) için tahmini/yaklaşık yedek tarih listesi kullanılır. OPEC toplantı tarihleri için güvenilir ücretsiz otomatik kaynak hâlâ bulunamadı — genel bilgi + kullanıcının manuel ekleyebileceği alan olarak kalıyor, uydurma tarih verilmiyor.
- **Hesap Ekstresi Yükleme**: Kredi kartı/banka ekstresini PDF olarak yükle. Üç aşamalı otomatik algılama: (1) bilinen banka formatı (şu an İş Bankası Maximum) → hızlı/ücretsiz regex, (2) tanınmayan ama metin içeren format → Gemini metni okuyup harcama/gelir ayrımını anlar, (3) metin yoksa (ekran görüntüsü gibi) → Gemini görüntüyü doğrudan okur. Her yolda Gemini kategorilere ayırır; içe aktarmadan önce düzenlenebilir/hariç tutulabilir. Sadece gerçek harcamalar alınır — ödeme/aktarım/iade/gelir satırları hariç tutulur (hesap türüne göre işaret yönü AI tarafından yorumlanır).
- **Bulut senkronizasyonu**: Tüm veriler (yatırım işlemleri, harcamalar, bütçe hedefleri, arşivlenmiş dönemler, ödeme kartları, takvim notları, portföy geçmişi, manuel fiyatlar, fon bilgisi, temettüler) hesaba bağlı olarak Supabase (PostgreSQL + Auth) üzerinde saklanır — cihazlar arası senkron çalışır, sunucu tarafı veritabanı artık var. Eski (Supabase öncesi) tarayıcıda kalan localStorage verisi olan kullanıcılar için, giriş yaptıklarında tek seferlik bir "Hesabıma Aktar" bandı (LegacyDataBanner) çıkar ve verileri hesaba taşır.

## Kullanılan Teknolojiler ve AI Araçları

- **Next.js 16 (App Router) + TypeScript + Tailwind CSS**
- **Supabase** (`@supabase/supabase-js`) — Auth (e-posta/şifre, Google), PostgreSQL veritabanı; tüm kullanıcı verisi hesaba bağlı olarak burada tutulur
- **Recharts** — portföy dağılım grafiği
- **docx** — dönem raporu Word (.docx) dışa aktarımı (tamamen tarayıcıda, sunucu/API gerektirmez)
- **Google Gemini API** (`@google/genai`, `gemini-flash-latest`) — tarihsel olay analizi, IMRaD/SWOT raporu, ekstre okuma ve BIST hisse temettü tarihi arama
- **CoinGecko API** — kripto fiyatları (ücretsiz, key gerektirmez)
- **Frankfurter API** — döviz kurları (ücretsiz, key gerektirmez)
- **Yahoo Finance (gayriresmi endpoint)** — ons altın/gümüş vadeli işlem fiyatı ve BIST 100 endeksi (ücretsiz, key gerektirmez)
- **Nasdaq herkese açık API'si** — NASDAQ/NYSE hisseleri için otomatik temettü tarihi (ücretsiz, key gerektirmez)
- **pdf-parse** — PDF ekstre metin çıkarımı
- **TCMB resmi takvim sayfası** — PPK faiz kararı tarihleri (kazıma, ücretsiz)
- **ForexFactory herkese açık takvim JSON'u** — FED/ECB/ABD-Avrupa ekonomik veri tarihleri (ücretsiz, key gerektirmez, sadece "bu hafta" ufku)
- **Claude Code** — geliştirme sürecinde AI destekli kodlama asistanı

## Kurulum

```bash
npm install
```

`.env.example` dosyasını `.env.local` olarak kopyalayıp kendi key'lerinizi girin:
```bash
cp .env.example .env.local
```
```
GEMINI_API_KEY=your_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
Ücretsiz Gemini key: https://aistudio.google.com/apikey. Supabase için ücretsiz bir proje oluşturup Project Settings → API'den URL ve anon key'i alın: https://supabase.com/dashboard. `.env.local` `.gitignore`'da olduğu için repo'ya asla eklenmez.

Supabase projesinde `supabase/` klasöründeki şema dosyalarını uygulamanız gerekir (tablolar: transactions, expenses, category_budgets, archived_periods, payment_cards, calendar_notes, portfolio_snapshots, dividends, manual_prices, fund_metadata). `scripts/run-schema.mjs` betiği `POSTGRES_URL_NON_POOLING` ortam değişkenini kullanarak bir şema dosyasını doğrudan veritabanına uygular:
```bash
POSTGRES_URL_NON_POOLING=your_connection_string node scripts/run-schema.mjs supabase/schema_harcamalar.sql
```
Alternatif olarak dosyaların içeriğini Supabase Dashboard'daki SQL Editor'e yapıştırıp çalıştırabilirsiniz.

```bash
npm run dev
```

http://localhost:3000 adresinden açın.

## Son Yapılan Değişiklikler

- **Tüm veri Supabase'e taşındı**: Yatırımlar, harcamalar, bütçe hedefleri, arşivlenmiş dönemler, takvim notları, portföy geçmişi, temettüler, ödeme kartları ve manuel fiyatlar artık localStorage yerine Supabase'de (hesaba bağlı, per-account) saklanıyor. Supabase öncesi tarayıcı verisi için tek seferlik otomatik aktarım bandı eklendi.
- **Gerçek kullanıcı hesapları**: Supabase Auth ile e-posta/şifre kayıt-giriş, Google ile giriş, şifre sıfırlama e-postası akışı; gizlilik politikası sayfası eklendi.
- **Ödeme kartı cüzdanı**: Harcamalar sayfasına kredi/banka kartı ekleme, renklendirme, harcama tablosuna Ödeme Kartı sütunu ve kart bazlı filtre bar'ı eklendi.
- **Fiyat alarmları ve zamanlı hatırlatmalar**: Hedef fiyat alarmı kurma (altın/dolar/euro/BIST/BTC), Web Push izni isteme ve TR 13:00/17:00 harcama girme hatırlatmaları eklendi.
- **Gümüş varlık türü ve BIST 100 canlı fiyatı** eklendi; gram gümüş de gram altın gibi Yahoo Finance ons fiyatından hesaplanıyor.
- **AI destekli temettü tarihi arama ve canlı ekonomik takvim senkronizasyonu**: Nasdaq API + Gemini ile hisse temettü tarihleri, TCMB/ForexFactory verilerini 24 saatlik önbellekle yenileyen buton Finans Günlüğüm'e eklendi.
- **Tarih girişi Gün/Ay/Yıl sırasına sabitlendi** (tarayıcı/işletim sistemi diline bağlı kalmadan), maksimum tarih sınırı ve "Bugün" kısayolu eklendi.
- **Ana Sayfa yeniden tasarlandı**: Claude Design'da hazırlanan bir mockup'a göre — sol menü (Sidebar), sıcak/terrakota oklch renk paleti, Manrope + Newsreader fontları. Güncel Değer/Toplam Yatırım/Toplam Harcama/Toplam Kâr-Zarar kartları, portföy dağılım donut grafiği, portföy değeri trend grafiği ve gerçek verilere dayalı AI Analiz bandı eklendi.

## Vizyon / Yol Haritası (Henüz Yapılmadı)

Bu bölümdeki özellikler projenin uzun vadeli hedefidir, MVP kapsamında değildir:

- Hisse için manuel/otomatik güncel fiyat girişi (portföy kâr/zarar hesabına dahil edilmesi)
- CSV/Excel formatında ekstre desteği (şu an sadece PDF)
- OPEC toplantı ve şirket bilanço tarihlerinin otomatikleştirilmesi (güvenilir ücretsiz kaynak henüz bulunamadı)
- BIST hisselerinin temettü tarihlerinin gerçek zamanlı/resmi bir kaynaktan (KAP vb.) çekilmesi — şu an Gemini araması + tahmini yedek listeyle sınırlı
- Finansal kimlik anketi (yaş, meslek, gelir, risk seviyesi) ve kişiselleştirilmiş AI profili
- İşlem hariç tutma + AI'nin tekrarlayan işlemleri öğrenip otomatik filtreleme önerisi
- Web arayüzü içi sınırlı görevli AI asistanı (rapor ve tarihsel olay anlatımı + arayüz etkileşimi)
