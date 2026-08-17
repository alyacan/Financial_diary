import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanım Koşulları ve Gizlilik Politikası — Finansal Günlük",
};

const CONTACT_EMAIL = "finansalgunluk.co@gmail.com";

export default function GizlilikPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Kullanım Koşulları ve Gizlilik Politikası
        </h1>
        <p className="mt-1 text-xs text-zinc-500">Son güncelleme: 18 Ağustos 2026</p>

        <div className="mt-6 flex flex-col gap-5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <section>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Hangi verileri topluyoruz</h2>
            <p className="mt-1">
              Hesap oluştururken adını ve e-posta adresini alıyoruz. Google ile giriş yaptığında Google&apos;dan
              yalnızca temel profil bilgini (ad, e-posta) alıyoruz; Google şifreni veya Google hesabındaki başka
              hiçbir veriyi görmüyoruz.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Finansal verilerin nerede tutuluyor</h2>
            <p className="mt-1">
              Kartların, harcamaların, bütçe hedeflerin, yatırım işlemlerin, takvim notların ve diğer finansal
              kayıtların Supabase üzerinde barındırılan, hesabına özel bir Postgres veritabanında tutuluyor.
              Bu veriler cihazında değil, sunucu tarafında saklanıyor; yalnızca giriş yapmış hesabın kendi verisine
              erişebilir (satır bazlı erişim kontrolü ile).
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Bildirimler</h2>
            <p className="mt-1">
              Fiyat alarmı veya günlük harcama hatırlatması gibi bildirimleri açarsan, tarayıcının push
              aboneliği (bildirim gönderebilmemiz için gereken teknik adres) hesabınla ilişkilendirilerek
              saklanır. Bildirimleri istediğin zaman kapatabilir, aboneliği silebilirsin.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Kullandığımız üçüncü taraf servisler</h2>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>
                <span className="font-semibold">Supabase</span> — hesap oluşturma, giriş, şifre yönetimi ve tüm
                finansal verilerinin veritabanında saklanması için.
              </li>
              <li>
                <span className="font-semibold">Google</span> — istersen &quot;Google ile devam et&quot; ile giriş
                yapman için.
              </li>
              <li>
                <span className="font-semibold">Vercel</span> — sitenin barındırıldığı sunucu.
              </li>
              <li>
                <span className="font-semibold">Genel piyasa veri kaynakları</span> (CoinGecko, Yahoo Finance,
                Nasdaq, Frankfurter, TCMB vb.) — yalnızca güncel fiyat/kur/takvim bilgisi çekmek için kullanılır,
                bu servislere hiçbir kişisel verin gönderilmez.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Haklarının</h2>
            <p className="mt-1">
              Hesabını istediğin zaman kapatabilir, profilinden çıkış yapabilirsin. Verilerinin silinmesini
              istersen aşağıdaki adresten bize ulaşman yeterli.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">İletişim</h2>
            <p className="mt-1">
              Sorularınız için:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
