"use client";

import Link from "next/link";
import { useState } from "react";

const modules = [
  {
    title: "Sipariş Yönetimi",
    text: "Manuel satış, Instagram ve pazaryeri siparişlerini tek ekranda takip et.",
    icon: "cart",
  },
  {
    title: "Stok Takibi",
    text: "Kritik stokları gör, ürün hareketlerini ve stok değerini canlı izle.",
    icon: "box",
  },
  {
    title: "QR / Barkod",
    text: "Ürün QR etiketleri oluştur, yazdır ve telefon kamerasıyla okut.",
    icon: "qr",
  },
  {
    title: "Kargo & İade",
    text: "Kargo takip numarası, teslimat durumu ve iade süreçlerini yönet.",
    icon: "truck",
  },
  {
    title: "Tahsilat",
    text: "Nakit, kart, havale ve parçalı ödeme akışını tek panelden kontrol et.",
    icon: "wallet",
  },
  {
    title: "Gorki AI",
    text: "Kritik stok, bekleyen ödeme ve kargo durumlarını akıllı asistana sor.",
    icon: "bot",
  },
];

const faqs = [
  {
    question: "Takipio kimler için?",
    answer:
      "Takipio; Instagram’dan satış yapan, pazaryerlerinde ürün listeleyen, stok ve siparişlerini Excel/WhatsApp ile takip etmekten yorulan küçük ve orta ölçekli işletmeler için tasarlandı.",
  },
  {
    question: "Kurulum süreci ne kadar sürer?",
    answer:
      "Kullanıcı hesabını oluşturduktan sonra ürünlerini ekleyebilir, stoklarını girebilir ve aynı gün sipariş takibine başlayabilirsin. Temel kullanım için teknik kurulum gerekmez.",
  },
  {
    question: "Free plan nasıl çalışır?",
    answer:
      "Free planda 15 siparişe kadar Takipio’yu deneyebilirsin. Limit dolduğunda yeni sipariş oluşturmak için Pro plana geçmen gerekir.",
  },
  {
    question: "Mobil uygulama desteği var mı?",
    answer:
      "Takipio web ve mobil uyumlu tasarlanır. İlk aşamada telefondan tarayıcı üzerinden kullanılabilir; sonraki aşamada Google Play ve App Store yayın süreci planlanır.",
  },
  {
    question: "Pazaryeri entegrasyonları nasıl çalışacak?",
    answer:
      "Trendyol, Hepsiburada, Amazon ve ÇiçekSepeti için API bağlantı bilgilerini kaydedebileceğin altyapı hazırlanır. Gerçek senkronizasyon her pazaryeri API sürecine göre adım adım bağlanır.",
  },
  {
    question: "Verilerimiz güvende mi?",
    answer:
      "Her işletme kendi alanında çalışır. Kullanıcılar yalnızca yetkili oldukları işletme verilerine erişebilir. Yetki ve rol sistemiyle çalışan erişimleri sınırlandırılabilir.",
  },
  {
    question: "Gorki AI ne işe yarar?",
    answer:
      "Gorki AI, paneldeki verileri okuyarak kritik stokları, bekleyen ödemeleri, kargo bekleyen siparişleri ve iadeleri özetleyebilir.",
  },
  {
    question: "Pro plan fiyatı nedir?",
    answer:
      "Planlanan fiyatlandırma açılışa özel ilk ay ₺89, sonraki aylar ₺99 şeklindedir. Gerçek ödeme sistemi devreye alındığında ödeme altyapısı üzerinden aktif edilir.",
  },
];

const footerGroups = [
  {
    title: "PLATFORM",
    links: [
      { label: "Takipio Nedir?", href: "#hero" },
      { label: "Modüller", href: "#modules" },
      { label: "Özellikler", href: "#features" },
      { label: "Fiyatlandırma", href: "#pricing" },
      { label: "Gorki AI", href: "#gorki" },
    ],
  },
  {
    title: "DESTEK",
    links: [
      { label: "Takipio Nasıl Kullanılır?", href: "/app/help" },
      { label: "SSS", href: "#faq" },
      { label: "Demo Talep", href: "#demo" },
      { label: "İletişim", href: "/app/contact" },
      { label: "Dokümantasyon", href: "#faq" },
    ],
  },
  {
    title: "YASAL",
    links: [
      { label: "Gizlilik Politikası", href: "/gizlilik-politikasi" },
      { label: "Kullanım Koşulları", href: "/kullanim-kosullari" },
      { label: "KVKK", href: "/kvkk" },
      { label: "Çerez Politikası", href: "/cerez-politikasi" },
    ],
  },
];

function Icon({ name }: { name: string }) {
  if (name === "cart") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.65 12.42a2 2 0 0 0 2 1.58h9.72a2 2 0 0 0 2-1.58L22 6H6" />
      </svg>
    );
  }

  if (name === "box") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="m4 7.5 8 4.5 8-4.5" />
        <path d="M12 12v9" />
      </svg>
    );
  }

  if (name === "qr") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h6v6H4z" />
        <path d="M14 4h6v6h-6z" />
        <path d="M4 14h6v6H4z" />
        <path d="M14 14h2v2h-2z" />
        <path d="M18 14h2v6h-4v-2h2z" />
      </svg>
    );
  }

  if (name === "truck") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 17h4V5H2v12h3" />
        <path d="M14 8h4l4 4v5h-3" />
        <circle cx="7.5" cy="17.5" r="2.5" />
        <circle cx="16.5" cy="17.5" r="2.5" />
      </svg>
    );
  }

  if (name === "wallet") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7H5a3 3 0 0 1 0-6h12v4" />
        <path d="M3 5v14a3 3 0 0 0 3 3h14V7" />
        <path d="M16 14h4" />
      </svg>
    );
  }

  if (name === "bot") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="8" width="16" height="12" rx="4" />
        <path d="M12 4v4" />
        <path d="M8 2h8" />
        <path d="M9 14h.01" />
        <path d="M15 14h.01" />
        <path d="M9.5 17h5" />
      </svg>
    );
  }

  return null;
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/8 ring-1 ring-white/10">
        <img src="/takipio-logo.png" alt="Takipio" className="h-full w-full object-contain p-1.5" />
      </div>
      <div>
        <p className="text-xl font-black tracking-[-0.04em] text-white">Takipio</p>
        <p className="text-[11px] font-bold text-slate-500">Premium işletme merkezi</p>
      </div>
    </Link>
  );
}

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="min-h-screen overflow-hidden bg-[#020817] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(37,99,235,.32),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(6,182,212,.15),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,.14),transparent_35%)]" />
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:46px_46px]" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#020817]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Logo />

          <nav className="hidden items-center gap-7 lg:flex">
            <a href="#modules" className="text-sm font-bold text-slate-400 transition hover:text-white">Modüller</a>
            <a href="#features" className="text-sm font-bold text-slate-400 transition hover:text-white">Özellikler</a>
            <a href="#pricing" className="text-sm font-bold text-slate-400 transition hover:text-white">Fiyat</a>
            <a href="#faq" className="text-sm font-bold text-slate-400 transition hover:text-white">SSS</a>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <span className="rounded-full bg-white/5 px-4 py-2 text-xs font-black text-slate-300 ring-1 ring-white/10">
              Web + Mobil hazır
            </span>
            <Link href="/login" className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-500">
              Giriş Yap
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen((value) => !value)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 ring-1 ring-white/10 lg:hidden"
            aria-label="Menüyü aç"
          >
            <span className="space-y-1.5">
              <span className="block h-0.5 w-5 rounded-full bg-white" />
              <span className="block h-0.5 w-5 rounded-full bg-white" />
              <span className="block h-0.5 w-5 rounded-full bg-white" />
            </span>
          </button>
        </div>

        {mobileOpen ? (
          <div className="border-t border-white/10 bg-[#020817] px-4 py-6 lg:hidden">
            <div className="mx-auto grid max-w-[1240px] gap-8">
              {footerGroups.map((group) => (
                <div key={group.title}>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-white">{group.title}</p>
                  <div className="mt-5 grid gap-4">
                    {group.links.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="text-lg font-bold text-slate-400 transition hover:text-white"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              ))}

              <Link href="/login" className="rounded-2xl bg-blue-600 px-5 py-4 text-center text-sm font-black text-white">
                Panele Giriş Yap
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <section id="hero" className="mx-auto grid max-w-[1240px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-24">
        <div>
          <div className="mb-5 inline-flex rounded-full bg-blue-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-300 ring-1 ring-blue-400/20">
            Küçük işletmeler için akıllı panel
          </div>

          <h1 className="text-[48px] font-black leading-[0.95] tracking-[-0.07em] text-white sm:text-7xl">
            İşini tek ekrandan yönet,
            <span className="block text-blue-400">karmaşayı bitir.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-400">
            Takipio; sipariş, stok, QR, kargo, iade, tahsilat ve Gorki AI desteğini tek premium panelde birleştirir.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="rounded-2xl bg-blue-600 px-6 py-4 text-center text-sm font-black text-white shadow-2xl shadow-blue-950/30 transition hover:-translate-y-0.5 hover:bg-blue-500">
              Hemen Başla
            </Link>
            <a href="#modules" className="rounded-2xl bg-white/8 px-6 py-4 text-center text-sm font-black text-slate-200 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/12">
              Modülleri Gör
            </a>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <HeroStat value="15" label="Free sipariş" />
            <HeroStat value="₺89" label="İlk ay" />
            <HeroStat value="AI" label="Gorki destek" />
          </div>
        </div>

        <div className="relative">
          <div className="absolute -right-10 top-8 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative rounded-[34px] border border-white/10 bg-[#07111f]/82 p-4 shadow-[0_40px_140px_rgba(15,23,42,.7)] backdrop-blur-xl">
            <div className="rounded-[28px] border border-white/10 bg-[#0b1220] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">Canlı Dashboard</p>
                  <h2 className="mt-1 text-2xl font-black">Takipio Panel</h2>
                </div>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-300">Aktif</span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <MiniCard label="Bugün" value="₺24.8K" />
                <MiniCard label="Sipariş" value="19" />
                <MiniCard label="Kritik Stok" value="3" />
                <MiniCard label="Tahsilat" value="₺18.2K" />
              </div>

              <div className="mt-5 rounded-[24px] bg-[#07111f] p-4 ring-1 ring-white/10">
                <div className="mb-3 flex justify-between text-xs font-black">
                  <span>Haftalık satış</span>
                  <span className="text-blue-300">Canlı</span>
                </div>
                <div className="flex h-36 items-end gap-2">
                  {[32, 54, 42, 78, 61, 88, 72].map((height, index) => (
                    <div key={index} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                      <span className="w-full rounded-t-full bg-gradient-to-t from-blue-700 to-cyan-300" style={{ height: `${height}%` }} />
                      <span className="text-[10px] font-black text-slate-600">{["P", "S", "Ç", "P", "C", "C", "P"][index]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border border-blue-400/20 bg-blue-500/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded-3xl bg-blue-600/20">
                    <img src="/gorki-hero.png" alt="Gorki AI" className="h-full w-full object-contain p-1" />
                  </div>
                  <div>
                    <p className="text-sm font-black">Gorki AI hazır</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">“Bekleyen ödemeleri göster” diye sor, panel verilerini özetlesin.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-5 -left-5 hidden rounded-3xl border border-white/10 bg-[#0b1220]/90 p-4 shadow-2xl backdrop-blur-xl sm:block">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">QR Etiket</p>
            <p className="mt-2 text-lg font-black text-white">PDF / Yazdır</p>
          </div>
        </div>
      </section>

      <section id="modules" className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeader
          kicker="Modüller"
          title="İşletmenin günlük akışını tek yerde topla."
          text="Takipio, küçük işletmelerin en sık karışan operasyonlarını sade ve premium bir panelde birleştirir."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <div key={module.title} className="group rounded-[28px] border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:bg-white/8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/20">
                <Icon name={module.icon} />
              </div>
              <h3 className="mt-5 text-xl font-black">{module.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{module.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <Feature title="Yetki sistemi" text="Çalışan, muhasebeci veya ekip üyelerine özel panel izinleri tanımla." />
          <Feature title="Mobil uyumlu" text="Telefon tarayıcısından ürün, stok, kargo ve iade süreçlerini yönet." />
          <Feature title="Dosya yükleme" text="Logo, profil fotoğrafı ve ürün görsellerini direkt bilgisayardan veya telefondan yükle." />
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[34px] border border-white/10 bg-[#07111f]/82 p-5 shadow-2xl backdrop-blur-xl lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">Fiyatlandırma</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em]">Önce dene, sonra büyüt.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                Free planda 15 siparişe kadar kullan. Pro plana geçtiğinde sipariş limiti kalkar ve premium kullanım aktif olur.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <PriceCard title="Free" price="₺0" desc="15 siparişe kadar deneme" items={["Ürün / stok / QR", "Sipariş ve ödeme", "Kargo & iade", "Gorki temel cevaplar"]} />
              <PriceCard title="Pro" price="₺89" desc="İlk ay, sonra ₺99/ay" highlighted items={["Sipariş limiti yok", "Tüm modüller", "Gorki canlı cevaplar", "Mobil uyumlu panel"]} />
            </div>
          </div>
        </div>
      </section>

      <section id="gorki" className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 rounded-[34px] border border-blue-400/20 bg-blue-500/10 p-6 lg:grid-cols-[0.75fr_1.25fr] lg:p-8">
          <div className="flex items-center justify-center">
            <div className="h-56 w-56 overflow-hidden rounded-[54px] bg-blue-600/20 ring-1 ring-blue-400/20">
              <img src="/gorki-hero.png" alt="Gorki AI" className="h-full w-full object-contain p-3" />
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">Gorki AI</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.05em]">Panel verilerini konuşarak sor.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Gorki, ürün, sipariş, ödeme, kargo ve iade kayıtlarını okuyarak sana hızlı özetler sunar.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {["Kritik stok var mı?", "Bekleyen ödemeleri göster", "Kargo bekleyenler", "İadeleri özetle"].map((item) => (
                <div key={item} className="rounded-2xl bg-[#020817]/70 px-4 py-3 text-sm font-black text-blue-100 ring-1 ring-white/10">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-[960px] px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          kicker="Merak Edilenler"
          title="Sık sorulan sorular"
          text="Takipio hakkında en çok sorulan soruları burada topladık."
          centered
        />

        <div className="mt-10 grid gap-3">
          {faqs.map((item, index) => {
            const isOpen = openFaq === index;

            return (
              <button
                key={item.question}
                onClick={() => setOpenFaq(isOpen ? null : index)}
                className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/8"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-black text-white">{item.question}</h3>
                  <span className={`text-2xl text-slate-500 transition ${isOpen ? "rotate-180" : ""}`}>▾</span>
                </div>

                {isOpen ? (
                  <p className="mt-4 text-sm leading-7 text-slate-400">{item.answer}</p>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section id="demo" className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[34px] border border-white/10 bg-[#07111f]/82 p-8 text-center shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">Hazır mısın?</p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.05em]">Takipio’yu bugün denemeye başla.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400">
            Ürünlerini ekle, sipariş oluştur, ödeme ve kargo akışını tek ekranda yönet.
          </p>
          <Link href="/login" className="mt-7 inline-flex rounded-2xl bg-blue-600 px-7 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-500">
            Ücretsiz Başla
          </Link>
        </div>
      </section>

      <footer id="legal" className="border-t border-white/10 bg-[#020817] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-500">
              Takipio, küçük işletmelerin sipariş, stok, kargo, iade ve tahsilat süreçlerini daha düzenli yönetmesi için geliştirilen premium işletme panelidir.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white">{group.title}</p>
                <div className="mt-5 grid gap-3">
                  {group.links.map((link) => (
                    <a key={link.label} href={link.href} className="text-sm font-bold text-slate-500 transition hover:text-white">
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-[1240px] border-t border-white/10 pt-7 text-center text-sm font-bold text-slate-600">
          © 2026 Takipio. Tüm hakları saklıdır.
        </div>
      </footer>
    </main>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-white/5 p-4 ring-1 ring-white/10">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function SectionHeader({
  kicker,
  title,
  text,
  centered = false,
}: {
  kicker: string;
  title: string;
  text: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-3xl"}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">{kicker}</p>
      <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.05em] text-white sm:text-5xl">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-slate-400">{text}</p>
    </div>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[#07111f]/82 p-6">
      <h3 className="text-2xl font-black">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-400">{text}</p>
    </div>
  );
}

function PriceCard({
  title,
  price,
  desc,
  items,
  highlighted = false,
}: {
  title: string;
  price: string;
  desc: string;
  items: string[];
  highlighted?: boolean;
}) {
  return (
    <div className={`rounded-[28px] border p-5 ${highlighted ? "border-blue-400/30 bg-blue-500/10" : "border-white/10 bg-[#020817]/70"}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-black">{title}</h3>
          <p className="mt-2 text-4xl font-black text-blue-300">{price}</p>
          <p className="mt-1 text-sm font-bold text-slate-500">{desc}</p>
        </div>
        {highlighted ? <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-300">Önerilen</span> : null}
      </div>

      <div className="mt-6 grid gap-3">
        {items.map((item) => (
          <p key={item} className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-bold text-slate-300 ring-1 ring-white/10">
            ✓ {item}
          </p>
        ))}
      </div>
    </div>
  );
}
