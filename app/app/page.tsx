import Image from "next/image";
import Link from "next/link";

const stats = [
  { label: "Bugünkü Ciro", value: "₺24.850", change: "+18%", icon: "₺" },
  { label: "Sipariş", value: "42", change: "12 bekliyor", icon: "▣" },
  { label: "Stok Uyarısı", value: "7", change: "kritik", icon: "▤" },
  { label: "Aktif Kanal", value: "4", change: "hazır", icon: "◇" },
];

const integrations = [
  { name: "Trendyol", logo: "/trendyol.png", status: "Sipariş hazır" },
  { name: "Hepsiburada", logo: "/hepsiburada.png", status: "Stok eşleme" },
  { name: "Amazon", logo: "/amazon.png", status: "Planlandı" },
  { name: "ÇiçekSepeti", logo: "/ciceksepeti.png", status: "Yakında" },
];

const actions = [
  { title: "Yeni Satış", desc: "Manuel satış oluştur", href: "/app/sales", icon: "₺" },
  { title: "QR Etiket", desc: "Ürün etiketi hazırla", href: "/app/qr", icon: "⌗" },
  { title: "Gorki AI", desc: "Asistanla konuş", href: "/app/gorki-ai", icon: "✦" },
  { title: "Faturalar", desc: "Fatura durumları", href: "/app/invoices", icon: "□" },
];

export default function DashboardPage() {
  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-5 pb-8">
      <div className="relative overflow-hidden rounded-[34px] bg-slate-950 p-5 text-white shadow-2xl shadow-blue-200/70 sm:p-7 lg:rounded-[44px] lg:p-8">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
          <div className="min-w-0">
            <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-blue-100 sm:text-sm">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
              <span className="truncate">Takipio kontrol merkezi aktif</span>
            </div>

            <h1 className="max-w-3xl text-[34px] font-black leading-[0.95] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
              İşletmeni Gorki ile birlikte yönet.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Satış, stok, fatura, QR etiket ve pazaryeri akışlarını tek panelden takip et. Gorki AI ise sana aksiyon önerileri verir.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/app/gorki-ai" className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-blue-50">
                Gorki ile konuş
              </Link>
              <Link href="/app/qr" className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/15">
                QR etiket hazırla
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[420px]">
            <div className="absolute -inset-4 rounded-[44px] bg-gradient-to-br from-blue-500/25 to-cyan-300/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[38px] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
              <div className="relative h-[320px] overflow-hidden rounded-[30px] bg-gradient-to-br from-white/10 to-white/5 sm:h-[420px]">
                <Image
                  src="/gorki-hero.png"
                  alt="Gorki AI"
                  fill
                  className="object-contain object-bottom drop-shadow-2xl"
                  priority
                />
              </div>

              <div className="mt-4 rounded-[26px] bg-slate-950/55 p-4 ring-1 ring-white/10">
                <p className="text-sm font-black">Gorki önerisi</p>
                <p className="mt-1 text-xs leading-5 text-slate-300">
                  7 ürün kritik stokta. Bugün QR etiket ve stok giriş ekranını kontrol etmelisin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[26px] border border-white/70 bg-white/90 p-4 shadow-lg shadow-blue-100/50 backdrop-blur-xl sm:rounded-[32px] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-200">
                {stat.icon}
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700 sm:text-xs">
                {stat.change}
              </span>
            </div>

            <p className="truncate text-xs font-bold text-slate-500 sm:text-sm">{stat.label}</p>
            <strong className="mt-1 block truncate text-2xl font-black tracking-tight sm:text-3xl">{stat.value}</strong>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[34px] border border-white/70 bg-white/90 p-5 shadow-xl shadow-blue-100/50 backdrop-blur-xl">
          <h2 className="text-2xl font-black tracking-tight">Hızlı aksiyonlar</h2>
          <p className="mt-1 text-sm text-slate-500">En çok kullanacağın işlemler.</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {actions.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-[26px] bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-blue-50">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">
                  {item.icon}
                </div>
                <h3 className="mt-4 text-sm font-black sm:text-base">{item.title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[34px] border border-white/70 bg-slate-950 p-5 text-white shadow-xl shadow-blue-100/50">
          <h2 className="text-2xl font-black tracking-tight">Pazaryeri entegrasyonları</h2>
          <p className="mt-1 text-sm text-slate-300">Yüklediğin gerçek logolarla demo bağlantı görünümü.</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {integrations.map((item) => (
              <div key={item.name} className="rounded-[26px] bg-white/10 p-4 ring-1 ring-white/10">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white p-2">
                    <Image src={item.logo} alt={item.name} fill className="object-contain p-2" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-black">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-300">{item.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
