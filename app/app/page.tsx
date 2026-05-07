const stats = [
  {
    label: "Bugünkü Ciro",
    value: "₺24.850",
    change: "+18%",
    desc: "Düne göre yükseliş",
    gradient: "from-blue-600 via-cyan-500 to-sky-400",
  },
  {
    label: "Yeni Sipariş",
    value: "42",
    change: "12 bekliyor",
    desc: "Hazırlanacak sipariş",
    gradient: "from-indigo-600 via-blue-600 to-cyan-500",
  },
  {
    label: "Stok Uyarısı",
    value: "7",
    change: "kritik",
    desc: "Azalan ürün var",
    gradient: "from-slate-900 via-blue-800 to-blue-500",
  },
  {
    label: "Aktif Kanal",
    value: "4",
    change: "hazır",
    desc: "Pazaryeri modülü",
    gradient: "from-cyan-600 via-blue-500 to-indigo-500",
  },
];

const chartBars = [
  { day: "Pzt", value: "38%" },
  { day: "Sal", value: "52%" },
  { day: "Çar", value: "44%" },
  { day: "Per", value: "68%" },
  { day: "Cum", value: "82%" },
  { day: "Cmt", value: "61%" },
  { day: "Paz", value: "74%" },
];

const tasks = [
  {
    title: "QR etiket bekleyen ürünler",
    desc: "12 ürün için etiket çıktısı hazırlanabilir.",
    tag: "QR",
  },
  {
    title: "Fatura eşleşmesi",
    desc: "3 satışın fatura durumu kontrol edilmeli.",
    tag: "Fatura",
  },
  {
    title: "Stok kritik seviyesi",
    desc: "7 ürün kritik seviyeye yaklaştı.",
    tag: "Stok",
  },
];

const orders = [
  {
    customer: "Kutluk Promosyon",
    product: "Özel ürün etiketi",
    amount: "₺8.450",
    status: "Hazırlanıyor",
  },
  {
    customer: "Demo Market",
    product: "QR baskılı etiket",
    amount: "₺3.200",
    status: "Onaylandı",
  },
  {
    customer: "ABC Ltd.",
    product: "Toplu ürün kaydı",
    amount: "₺12.300",
    status: "Fatura",
  },
  {
    customer: "Online Sipariş",
    product: "Stoktan satış",
    amount: "₺1.980",
    status: "Tamamlandı",
  },
];

const integrations = [
  { name: "Trendyol", value: "85%", status: "Sipariş hazır" },
  { name: "Hepsiburada", value: "62%", status: "Stok eşleme" },
  { name: "Amazon", value: "48%", status: "Planlandı" },
  { name: "ÇiçekSepeti", value: "34%", status: "Yakında" },
];

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-[38px] border border-white/70 bg-slate-950 p-6 text-white shadow-2xl shadow-blue-200/70 md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-100">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/70" />
              Canlı demo panel
            </div>

            <h1 className="max-w-3xl text-4xl font-black tracking-[-0.05em] md:text-6xl">
              Takipio işletmenin nabzını tutar.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
              Satış, stok, fatura, QR etiket ve pazaryeri entegrasyonlarını tek premium ekranda topluyoruz.
              Şu an demo verilerle çalışıyor; sonra Supabase ile gerçek veriye bağlanacak.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-blue-50">
                Yeni işlem oluştur
              </button>
              <button className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/15">
                Raporları incele
              </button>
            </div>
          </div>

          <div className="relative mx-auto flex h-64 w-full max-w-sm items-center justify-center rounded-[36px] border border-white/10 bg-white/10 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-xl xl:mx-0">
            <div className="absolute inset-4 rounded-[30px] bg-gradient-to-br from-blue-500/20 to-cyan-300/10" />
            <div className="relative text-center">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[34px] bg-white/15 text-7xl shadow-xl ring-1 ring-white/15">
                🤖
              </div>
              <h2 className="mt-5 text-2xl font-black">Gorki AI</h2>
              <p className="mt-2 text-sm text-slate-300">
                Gerçek robot görseli buraya bağlanacak.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-blue-100/60 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${stat.gradient} opacity-15 blur-2xl transition group-hover:opacity-30`} />
            <div className={`mb-5 h-2 w-20 rounded-full bg-gradient-to-r ${stat.gradient}`} />

            <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <strong className="text-4xl font-black tracking-tight">{stat.value}</strong>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                {stat.change}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-400">{stat.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[36px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-blue-100/60 backdrop-blur-xl">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Haftalık satış akışı</h2>
              <p className="mt-1 text-sm text-slate-500">Demo grafik alanı. Sonra gerçek satış verisine bağlanacak.</p>
            </div>
            <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
              +24% büyüme
            </span>
          </div>

          <div className="flex h-72 items-end gap-3 rounded-[28px] bg-gradient-to-b from-blue-50 to-white p-5">
            {chartBars.map((bar) => (
              <div key={bar.day} className="flex flex-1 flex-col items-center gap-3">
                <div className="flex h-52 w-full items-end rounded-full bg-white shadow-inner">
                  <div
                    className="w-full rounded-full bg-gradient-to-t from-blue-700 via-blue-500 to-cyan-300 shadow-lg shadow-blue-200"
                    style={{ height: bar.value }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-500">{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[36px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-blue-100/60 backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-2xl font-black tracking-tight">Gorki önerileri</h2>
            <p className="mt-1 text-sm text-slate-500">Bugün odaklanılacak hızlı aksiyonlar.</p>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.title} className="rounded-[26px] border border-slate-100 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:bg-blue-50">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-black text-slate-950">{task.title}</h3>
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">{task.tag}</span>
                </div>
                <p className="text-sm leading-6 text-slate-500">{task.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-[36px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-blue-100/60 backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Son işlemler</h2>
              <p className="mt-1 text-sm text-slate-500">Satış, sipariş ve fatura hareketleri.</p>
            </div>
            <button className="rounded-2xl border border-blue-100 bg-white px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-50">
              Tümü
            </button>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-slate-100">
            {orders.map((order) => (
              <div key={`${order.customer}-${order.amount}`} className="grid gap-3 border-b border-slate-100 bg-white p-5 last:border-b-0 md:grid-cols-[1fr_1fr_auto_auto] md:items-center">
                <div>
                  <p className="font-black">{order.customer}</p>
                  <p className="mt-1 text-sm text-slate-500">{order.product}</p>
                </div>
                <div className="text-sm font-semibold text-slate-500">Bugün</div>
                <div className="font-black text-slate-950">{order.amount}</div>
                <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[36px] border border-white/70 bg-slate-950 p-6 text-white shadow-xl shadow-blue-100/60">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Entegrasyon durumu</h2>
            <p className="mt-1 text-sm text-slate-300">Pazaryeri bağlantılarının demo ilerlemesi.</p>
          </div>

          <div className="mt-6 space-y-5">
            {integrations.map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex justify-between gap-3 text-sm">
                  <span className="font-bold">{item.name}</span>
                  <span className="text-blue-200">{item.status}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300"
                    style={{ width: item.value }}
                  />
                </div>
                <p className="mt-1 text-right text-xs text-slate-400">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-[28px] bg-white/10 p-5 ring-1 ring-white/10">
            <p className="text-sm leading-6 text-slate-200">
              Bu alan daha sonra gerçek API bağlantı durumu, son senkron zamanı ve hata kayıtlarını gösterecek.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
