import Link from "next/link";

export default function DownloadsPage() {
  return (
    <section className="mx-auto w-full max-w-[1300px] space-y-5 text-white">
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#111a2e] p-6 shadow-[0_20px_70px_rgba(2,6,23,0.26)]">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-200 ring-1 ring-blue-400/20">
            Takipio Mobile
          </div>
          <h1 className="text-4xl font-black tracking-[-0.055em] sm:text-6xl">İşletmeni cebinden yönet.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Takipio mobil uygulaması ile satış, stok, QR okutma, bildirim ve Gorki AI desteğini telefon üzerinden kullan.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <StoreCard title="App Store" subtitle="iPhone ve iPad için" badge="Yakında" icon="" />
          <StoreCard title="Google Play" subtitle="Android cihazlar için" badge="Yakında" icon="▶" />
          <div className="rounded-[24px] border border-white/10 bg-[#0b1220] p-5">
            <p className="text-lg font-black">Web App</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Şimdilik Takipio web panelini mobil tarayıcıdan kullanabilirsin. PWA kurulumu sonraki fazda eklenecek.
            </p>
            <Link href="/app" className="mt-5 inline-flex rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
              Web Panele Dön
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Feature title="Telefon kamerasıyla QR okutma" desc="Ürün ve stok hareketlerini barkod cihazı olmadan yönet." />
        <Feature title="Anlık bildirimler" desc="Kritik stok, bekleyen ödeme ve satış uyarılarını takip et." />
        <Feature title="Gorki AI cepte" desc="İşletme asistanın her an yanında olsun." />
      </div>
    </section>
  );
}

function StoreCard({ title, subtitle, badge, icon }: { title: string; subtitle: string; badge: string; icon: string }) {
  return (
    <div className="group rounded-[24px] border border-white/10 bg-[#0b1220] p-5 transition hover:-translate-y-1 hover:bg-[#111d31]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-black text-slate-950">
          {icon}
        </div>
        <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-black text-amber-300 ring-1 ring-amber-400/20">
          {badge}
        </span>
      </div>
      <h2 className="mt-6 text-2xl font-black">{title}</h2>
      <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
      <button className="mt-5 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white ring-1 ring-white/10">
        Mağaza Sayfası Hazırlanıyor
      </button>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[#111a2e] p-5">
      <h3 className="text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{desc}</p>
    </div>
  );
}
