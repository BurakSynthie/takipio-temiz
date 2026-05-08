import Link from "next/link";

const steps = [
  {
    title: "1. Dashboard’u oku",
    desc: "Ana ekranda günlük satış, toplam ciro, bekleyen ödeme, kritik stok, ürün sayısı ve stok değeri gibi en önemli bilgileri görürsün.",
    href: "/app",
    action: "Dashboard’a Git",
  },
  {
    title: "2. Ürün ekle",
    desc: "Ürünler sayfasından ürün adı, kategori, fiyat, stok ve minimum stok bilgilerini gir. Sistem ürün kodunu otomatik üretir.",
    href: "/app/products",
    action: "Ürünlere Git",
  },
  {
    title: "3. Stok yönet",
    desc: "Ürün kartındaki + / - butonlarıyla stok artırıp azaltabilirsin. Her işlem otomatik olarak stok hareketlerine kaydedilir.",
    href: "/app/stock",
    action: "Stok Geçmişi",
  },
  {
    title: "4. Satış oluştur",
    desc: "Satışlar sayfasında ürün seçip adet ve fiyat girerek satış oluştur. Satış kaydedildiğinde stok otomatik düşer.",
    href: "/app/sales",
    action: "Satışlara Git",
  },
  {
    title: "5. QR etiket kullan",
    desc: "Ürün kartından QR kodu görüntüleyebilir, yazdırabilir veya PDF olarak kaydedebilirsin. Bu sistem barkod okuyucu ihtiyacını azaltır.",
    href: "/app/products",
    action: "QR Oluştur",
  },
  {
    title: "6. Müşterileri kaydet",
    desc: "Müşteriler sayfasında müşteri adı, firma, telefon, e-posta ve şehir bilgilerini tutabilirsin.",
    href: "/app/customers",
    action: "Müşterilere Git",
  },
  {
    title: "7. Fatura takibi yap",
    desc: "Faturalar sayfasında fatura no, müşteri, tutar, vade ve ödeme durumunu takip edebilirsin.",
    href: "/app/invoices",
    action: "Faturalara Git",
  },
  {
    title: "8. Ekip ve yetki ver",
    desc: "Ayarlar sayfasından ekip üyesi e-postası ekleyip hangi panellere erişebileceğini seçebilirsin.",
    href: "/app/settings",
    action: "Yetkilere Git",
  },
  {
    title: "9. Profil ve fotoğraf yükle",
    desc: "Kullanıcı sayfasında profil bilgilerini değiştirebilir ve bilgisayardan profil fotoğrafı yükleyebilirsin.",
    href: "/app/profile",
    action: "Profile Git",
  },
  {
    title: "10. Bildirim ve mesajları takip et",
    desc: "Sağ üstteki bildirim ve inbox butonlarından hızlıca uyarıları görebilir, silebilir veya ilgili sayfaya gidebilirsin.",
    href: "/app/notifications",
    action: "Bildirimlere Git",
  },
];

const tips = [
  "Minimum stok belirlemek, kritik stok uyarılarının doğru çalışmasını sağlar.",
  "Satış oluştururken doğru ürün seçersen stok hareketleri otomatik düzgün kaydolur.",
  "Ekip üyeleri için şifreyi sen belirlemezsin; kişi kendi e-postasıyla kayıt olup şifresini kendi oluşturur.",
  "QR etiketleri ürün üzerine veya raf/depo etiketi olarak yazdırabilirsin.",
  "Notlar bölümünü günlük yapılacaklar veya küçük hatırlatmalar için kullanabilirsin.",
];

export default function HelpPage() {
  return (
    <section className="mx-auto w-full max-w-[1300px] space-y-3 text-white">
      <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">
          Kullanım Rehberi
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-[-0.04em]">
          Takipio nasıl kullanılır?
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Bu sayfa, Takipio panelini ilk kez kullanan birinin üründen satışa,
          stoktan QR etikete kadar sistemi rahatça öğrenmesi için hazırlandı.
        </p>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
        <div className="grid gap-3 md:grid-cols-2">
          {steps.map((step) => (
            <div
              key={step.title}
              className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4 transition hover:-translate-y-0.5 hover:bg-[#17233b]"
            >
              <h2 className="text-base font-black">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {step.desc}
              </p>
              <Link
                href={step.href}
                className="mt-4 inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-black transition hover:bg-blue-500"
              >
                {step.action}
              </Link>
            </div>
          ))}
        </div>

        <aside className="grid gap-3 content-start">
          <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
            <h2 className="text-base font-black">Hızlı Başlangıç</h2>
            <div className="mt-4 space-y-2">
              <MiniStep number="01" text="Önce ürünlerini ekle." />
              <MiniStep number="02" text="Minimum stok değerlerini gir." />
              <MiniStep number="03" text="Satış oluşturup stoktan düşmeyi test et." />
              <MiniStep number="04" text="QR etiketi yazdırmayı dene." />
              <MiniStep number="05" text="Ekip yetkilerini ayarla." />
            </div>
          </div>

          <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
            <h2 className="text-base font-black">İpuçları</h2>
            <div className="mt-4 space-y-2">
              {tips.map((tip) => (
                <div
                  key={tip}
                  className="rounded-[14px] bg-[#0b1220] p-3 text-xs leading-5 text-slate-400"
                >
                  {tip}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
            <h2 className="text-base font-black">Yardım lazım mı?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Öneri, şikayet veya destek için iletişim sayfasından ulaşabilirsin.
            </p>
            <Link
              href="/app/contact"
              className="mt-4 inline-flex rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-black text-blue-200 ring-1 ring-white/10"
            >
              İletişime Geç
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}

function MiniStep({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] bg-[#0b1220] p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xs font-black">
        {number}
      </span>
      <p className="text-xs font-bold text-slate-300">{text}</p>
    </div>
  );
}
