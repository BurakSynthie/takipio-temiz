const stats = [
  {
    label: "Bugünkü Ciro",
    value: "₺24.850",
    change: "+18%",
    desc: "Düne göre yükseliş",
    icon: "₺",
  },
  {
    label: "Sipariş",
    value: "42",
    change: "12 bekliyor",
    desc: "Hazırlanacak işlem",
    icon: "▣",
  },
  {
    label: "Stok Uyarısı",
    value: "7",
    change: "kritik",
    desc: "Kontrol gerekli",
    icon: "▤",
  },
  {
    label: "Aktif Kanal",
    value: "4",
    change: "hazır",
    desc: "Entegrasyon modülü",
    icon: "◇",
  },
];

const quickActions = [
  { title: "Yeni Satış", desc: "Manuel satış oluştur", href: "/app/sales", icon: "₺" },
  { title: "QR Etiket", desc: "Ürün etiketi hazırla", href: "/app/qr", icon: "⌗" },
  { title: "Stok Kontrol", desc: "Kritik ürünleri gör", href: "/app/stock", icon: "▤" },
  { title: "Fatura", desc: "Fatura durumları", href: "/app/invoices", icon: "□" },
];

const orders = [
  { customer: "Kutluk Promosyon", amount: "₺8.450", status: "Hazırlanıyor" },
  { customer: "Demo Market", amount: "₺3.200", status: "Onaylandı" },
  { customer: "ABC Ltd.", amount: "₺12.300", status: "Fatura" },
  { customer: "Online Sipariş", amount: "₺1.980", status: "Tamamlandı" },
];

const alerts = [
  { title: "Bardak Altlığı", desc: "8 adet kaldı · min 15" },
  { title: "Oto Kokusu", desc: "12 adet kaldı · min 25" },
  { title: "Premium Etiket", desc: "4 adet kaldı · min 20" },
];

const bars = [
  { day: "Pzt", value: "38%" },
  { day: "Sal", value: "52%" },
  { day: "Çar", value: "44%" },
  { day: "Per", value: "68%" },
  { day: "Cum", value: "82%" },
  { day: "Cmt", value: "61%" },
  { day: "Paz", value: "74%" },
];

export default function DashboardPage() {
  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-8 sm:space-y-5 lg:space-y-6">
      <div className="relative overflow-hidden rounded-[28px] bg-slate-950 p-5 text-white shadow-xl shadow-blue-200/60 sm:rounded-[36px] sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-500/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-10 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative grid gap-5 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div className="min-w-0">
            <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-blue-100 sm:text-sm">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
              <span className="truncate">Canlı demo panel · Supabase hazır</span>
            </div>

            <h1 className="max-w-3xl text-[34px] font-black leading-[0.95] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
              İşletmeni tek panelden yönet.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Satış, stok, fatura, QR etiket ve entegrasyonlar mobilde de sade, hızlı ve okunabilir şekilde takip edilir.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                <p className="text-[11px] text-slate-300">Hedef</p>
                <p className="mt-1 text-base font-black sm:text-xl">₺30K</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                <p className="text-[11px] text-slate-300">Oran</p>
                <p className="mt-1 text-base font-black sm:text-xl">%82</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                <p className="text-[11px] text-slate-300">Açık</p>
                <p className="mt-1 text-base font-black sm:text-xl">19</p>
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-white/10 p-4 backdrop-blur-xl sm:rounded-[32px] sm:p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/15 text-4xl ring-1 ring-white/15 sm:h-20 sm:w-20 sm:text-5xl">
                🤖
              </div>
              <div className="min-w-0">
                <p className="text-sm text-blue-100">Gorki AI</p>
                <h2 className="text-xl font-black leading-tight sm:text-2xl">Bugünkü öneri</h2>
                <p className="mt-1 text-xs leading-5 text-slate-300 sm:text-sm">
                  7 ürün kritik stokta. QR etiket ve stok girişini kontrol et.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="min-w-0 rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-lg shadow-blue-100/50 backdrop-blur-xl sm:rounded-[30px] sm:p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-200">
                {stat.icon}
              </div>
              <span className="truncate rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700 sm:text-xs">
                {stat.change}
              </span>
            </div>

            <p className="truncate text-xs font-bold text-slate-500 sm:text-sm">{stat.label}</p>
            <strong className="mt-1 block truncate text-2xl font-black tracking-tight sm:text-3xl">{stat.value}</strong>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400 sm:text-sm">{stat.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-lg shadow-blue-100/50 backdrop-blur-xl sm:rounded-[34px] sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-black tracking-tight sm:text-2xl">Hızlı aksiyonlar</h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">En çok kullanılacak işlemler.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {quickActions.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-[22px] bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-blue-50 sm:rounded-[26px]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">
                {item.icon}
              </div>
              <h3 className="mt-4 text-sm font-black sm:text-base">{item.title}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] xl:gap-6">
        <div className="rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-lg shadow-blue-100/50 backdrop-blur-xl sm:rounded-[34px] sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight sm:text-2xl">Haftalık akış</h2>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">Mobil uyumlu demo grafik.</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">+24%</span>
          </div>

          <div className="flex h-56 items-end gap-2 rounded-[24px] bg-gradient-to-b from-blue-50 to-white p-3 sm:h-72 sm:gap-3 sm:p-5">
            {bars.map((bar) => (
              <div key={bar.day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-40 w-full items-end rounded-full bg-white shadow-inner ring-1 ring-blue-50 sm:h-52">
                  <div
                    className="w-full rounded-full bg-gradient-to-t from-blue-800 via-blue-500 to-cyan-300 shadow-lg shadow-blue-200"
                    style={{ height: bar.value }}
                  />
                </div>
                <span className="text-[10px] font-black text-slate-500 sm:text-xs">{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-slate-950 p-4 text-white shadow-lg shadow-blue-100/50 sm:rounded-[34px] sm:p-6">
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">Kritik stoklar</h2>
          <p className="mt-1 text-xs text-slate-300 sm:text-sm">Minimum seviyeye yaklaşanlar.</p>

          <div className="mt-5 space-y-3">
            {alerts.map((item) => (
              <div key={item.title} className="rounded-[22px] bg-white/10 p-4 ring-1 ring-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-black">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-300 sm:text-sm">{item.desc}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-red-400/15 px-3 py-1 text-xs font-black text-red-200">
                    Kritik
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-lg shadow-blue-100/50 backdrop-blur-xl sm:rounded-[34px] sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black tracking-tight sm:text-2xl">Son işlemler</h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">Satış ve sipariş hareketleri.</p>
          </div>
          <a href="/app/sales" className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
            Tümü
          </a>
        </div>

        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={`${order.customer}-${order.amount}`}
              className="rounded-[22px] border border-slate-100 bg-slate-50 p-4 sm:rounded-[26px]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-black text-slate-950">{order.customer}</p>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">Bugün · Demo işlem</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-black text-slate-950">{order.amount}</p>
                  <span className="mt-1 inline-flex rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-700 sm:text-xs">
                    {order.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
