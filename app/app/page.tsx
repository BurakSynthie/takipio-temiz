const stats = [
  {
    label: "Bugünkü Ciro",
    value: "₺24.850",
    change: "+18%",
    desc: "Düne göre daha güçlü performans",
    gradient: "from-blue-700 via-cyan-500 to-sky-300",
    icon: "₺",
  },
  {
    label: "Yeni Sipariş",
    value: "42",
    change: "12 bekliyor",
    desc: "Hazırlanacak ve onay bekleyen işler",
    gradient: "from-indigo-700 via-blue-600 to-cyan-400",
    icon: "▣",
  },
  {
    label: "Stok Uyarısı",
    value: "7",
    change: "kritik",
    desc: "Kritik seviyeye yaklaşan ürünler",
    gradient: "from-slate-950 via-blue-800 to-blue-500",
    icon: "▤",
  },
  {
    label: "Aktif Kanal",
    value: "4",
    change: "hazır",
    desc: "Pazaryeri bağlantı modülleri",
    gradient: "from-cyan-600 via-blue-500 to-indigo-500",
    icon: "◇",
  },
];

const chartBars = [
  { day: "Pzt", value: "38%", amount: "₺8.4K" },
  { day: "Sal", value: "52%", amount: "₺12.1K" },
  { day: "Çar", value: "44%", amount: "₺10.2K" },
  { day: "Per", value: "68%", amount: "₺18.7K" },
  { day: "Cum", value: "82%", amount: "₺24.8K" },
  { day: "Cmt", value: "61%", amount: "₺15.9K" },
  { day: "Paz", value: "74%", amount: "₺21.4K" },
];

const tasks = [
  {
    title: "QR etiket bekleyen ürünler",
    desc: "12 ürün için PDF etiket çıktısı hazırlanabilir. Toplu baskı modülüne yönlendirilecek.",
    tag: "QR",
    priority: "Yüksek",
  },
  {
    title: "Fatura eşleşmesi",
    desc: "3 satışın fatura durumu beklemede. Ödeme ve fatura ekranı eşleştirilecek.",
    tag: "Fatura",
    priority: "Orta",
  },
  {
    title: "Stok kritik seviyesi",
    desc: "7 ürün kritik seviyeye yaklaştı. Tedarik planı açılması önerilir.",
    tag: "Stok",
    priority: "Kritik",
  },
  {
    title: "Pazaryeri senkron kontrolü",
    desc: "Trendyol ve Hepsiburada için son veri akışı kontrol edilecek.",
    tag: "API",
    priority: "Normal",
  },
];

const orders = [
  {
    customer: "Kutluk Promosyon",
    product: "Özel ürün etiketi",
    amount: "₺8.450",
    status: "Hazırlanıyor",
    channel: "Manuel",
  },
  {
    customer: "Demo Market",
    product: "QR baskılı etiket",
    amount: "₺3.200",
    status: "Onaylandı",
    channel: "Web",
  },
  {
    customer: "ABC Ltd.",
    product: "Toplu ürün kaydı",
    amount: "₺12.300",
    status: "Fatura",
    channel: "B2B",
  },
  {
    customer: "Online Sipariş",
    product: "Stoktan satış",
    amount: "₺1.980",
    status: "Tamamlandı",
    channel: "Shop",
  },
  {
    customer: "Yeni Müşteri",
    product: "Numune paket",
    amount: "₺890",
    status: "Ödeme",
    channel: "Form",
  },
];

const integrations = [
  { name: "Trendyol", value: "85%", status: "Sipariş hazır", color: "bg-orange-50 text-orange-700" },
  { name: "Hepsiburada", value: "62%", status: "Stok eşleme", color: "bg-amber-50 text-amber-700" },
  { name: "Amazon", value: "48%", status: "Planlandı", color: "bg-slate-100 text-slate-700" },
  { name: "ÇiçekSepeti", value: "34%", status: "Yakında", color: "bg-emerald-50 text-emerald-700" },
];

const modules = [
  {
    title: "QR / Barkod Etiket",
    desc: "Telefon kamerasıyla okutulacak QR etiketler, ürün kodu ve Takipio logosuyla PDF olarak hazırlanacak.",
    cta: "Etiketleri aç",
    href: "/app/qr",
    icon: "⌗",
  },
  {
    title: "Satış Yönetimi",
    desc: "Satış ekleme, ödeme durumu, kâr takibi ve müşteri bazlı işlem geçmişi burada birleşecek.",
    cta: "Satışlara git",
    href: "/app/sales",
    icon: "₺",
  },
  {
    title: "Fatura Takibi",
    desc: "Taslak, kesilen, bekleyen ve ödenen faturalar tek akışta takip edilecek.",
    cta: "Faturaları gör",
    href: "/app/invoices",
    icon: "□",
  },
];

const stockAlerts = [
  { name: "Bardak Altlığı", sku: "TKP-002", stock: 8, min: 15 },
  { name: "Oto Kokusu", sku: "TKP-003", stock: 12, min: 25 },
  { name: "Premium Etiket", sku: "TKP-008", stock: 4, min: 20 },
];

const timeline = [
  { time: "09:24", title: "Yeni satış kaydı oluşturuldu", desc: "Kutluk Promosyon için ₺8.450 tutarında işlem." },
  { time: "10:12", title: "QR etiket çıktısı hazırlandı", desc: "Premium Kahve için 50 adet etiket." },
  { time: "11:36", title: "Stok seviyesi güncellendi", desc: "Bardak Altlığı kritik seviyeye düştü." },
  { time: "13:05", title: "Fatura taslağı oluşturuldu", desc: "ABC Ltd. için taslak fatura kaydedildi." },
];

export default function DashboardPage() {
  return (
    <section className="space-y-6 pb-10">
      <div className="relative overflow-hidden rounded-[42px] border border-white/70 bg-slate-950 p-6 text-white shadow-2xl shadow-blue-200/70 md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-500/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute left-12 top-12 h-24 w-24 rounded-full bg-white/5 blur-xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.25fr_0.75fr] xl:items-center">
          <div>
            <div className="mb-4 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-100">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/70" />
                Canlı demo panel
              </div>
              <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">
                Supabase bağlantısı hazır
              </div>
            </div>

            <h1 className="max-w-4xl text-4xl font-black tracking-[-0.055em] md:text-6xl">
              Takipio işletmenin tüm hareketini tek ekrana toplar.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
              Satış, stok, fatura, QR etiket, müşteri ve pazaryeri entegrasyonlarını klasik ama premium SaaS düzeninde yönet.
              Şu an demo veriler var; sıradaki adımda Supabase tablolarına gerçek kayıtlar bağlanacak.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/10 p-4">
                <p className="text-xs text-slate-300">Bugünkü hedef</p>
                <p className="mt-1 text-xl font-black">₺30K</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/10 p-4">
                <p className="text-xs text-slate-300">Tamamlanma</p>
                <p className="mt-1 text-xl font-black">%82</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/10 p-4">
                <p className="text-xs text-slate-300">Açık işlem</p>
                <p className="mt-1 text-xl font-black">19</p>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <button className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-blue-50">
                Yeni işlem oluştur
              </button>
              <button className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/15">
                Raporları incele
              </button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md xl:mx-0">
            <div className="absolute -inset-3 rounded-[42px] bg-gradient-to-br from-blue-500/25 to-cyan-300/10 blur-xl" />
            <div className="relative rounded-[40px] border border-white/10 bg-white/10 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
              <div className="rounded-[32px] bg-gradient-to-br from-white/15 to-white/5 p-5 ring-1 ring-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-blue-100">Gorki AI</p>
                    <h2 className="mt-1 text-3xl font-black tracking-tight">Akıllı işletme asistanı</h2>
                  </div>
                  <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-white/15 text-5xl ring-1 ring-white/15">
                    🤖
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="rounded-3xl bg-slate-950/40 p-4 ring-1 ring-white/10">
                    <p className="text-sm leading-6 text-slate-200">
                      7 ürün kritik stokta. Bugün QR etiket basımıyla birlikte stok girişini kontrol etmek iyi olur.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs text-slate-300">Öneri</p>
                      <p className="mt-1 font-black">4 aksiyon</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs text-slate-300">Risk</p>
                      <p className="mt-1 font-black">Stok</p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-center text-xs text-slate-400">
                Gerçek Gorki robot görseli sonraki pakette bu alana bağlanacak.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-[34px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-blue-100/60 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className={`absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${stat.gradient} opacity-15 blur-2xl transition group-hover:opacity-30`} />
            <div className="relative flex items-start justify-between gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.gradient} text-lg font-black text-white shadow-lg shadow-blue-200`}>
                {stat.icon}
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                {stat.change}
              </span>
            </div>

            <p className="relative mt-5 text-sm font-semibold text-slate-500">{stat.label}</p>
            <strong className="relative mt-2 block text-4xl font-black tracking-tight">{stat.value}</strong>
            <p className="relative mt-3 text-sm leading-5 text-slate-400">{stat.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[38px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-blue-100/60 backdrop-blur-xl">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Haftalık satış akışı</h2>
              <p className="mt-1 text-sm text-slate-500">Demo grafik alanı. Sonra gerçek satış verisine bağlanacak.</p>
            </div>
            <div className="flex gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">+24% büyüme</span>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">7 gün</span>
            </div>
          </div>

          <div className="flex h-80 items-end gap-3 rounded-[30px] bg-gradient-to-b from-blue-50 to-white p-5">
            {chartBars.map((bar) => (
              <div key={bar.day} className="group flex flex-1 flex-col items-center gap-3">
                <div className="mb-1 rounded-xl bg-white px-2 py-1 text-[11px] font-black text-slate-500 opacity-0 shadow-sm transition group-hover:opacity-100">
                  {bar.amount}
                </div>
                <div className="flex h-52 w-full items-end rounded-full bg-white shadow-inner ring-1 ring-blue-50">
                  <div
                    className="w-full rounded-full bg-gradient-to-t from-blue-800 via-blue-500 to-cyan-300 shadow-lg shadow-blue-200 transition duration-300 group-hover:from-slate-950"
                    style={{ height: bar.value }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-500">{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[38px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-blue-100/60 backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-2xl font-black tracking-tight">Gorki önerileri</h2>
            <p className="mt-1 text-sm text-slate-500">Bugün odaklanılacak hızlı aksiyonlar.</p>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.title} className="rounded-[28px] border border-slate-100 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:bg-blue-50">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-950">{task.title}</h3>
                    <p className="mt-1 text-xs font-bold text-slate-400">Öncelik: {task.priority}</p>
                  </div>
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">{task.tag}</span>
                </div>
                <p className="text-sm leading-6 text-slate-500">{task.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {modules.map((module) => (
          <a
            key={module.title}
            href={module.href}
            className="group relative overflow-hidden rounded-[36px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-blue-100/50 transition hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl transition group-hover:bg-blue-500/20" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-2xl font-black text-white">
              {module.icon}
            </div>
            <h3 className="relative mt-5 text-xl font-black tracking-tight">{module.title}</h3>
            <p className="relative mt-2 min-h-20 text-sm leading-6 text-slate-500">{module.desc}</p>
            <div className="relative mt-5 inline-flex rounded-2xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
              {module.cta}
            </div>
          </a>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-[38px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-blue-100/60 backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Son işlemler</h2>
              <p className="mt-1 text-sm text-slate-500">Satış, sipariş ve fatura hareketleri.</p>
            </div>
            <button className="rounded-2xl border border-blue-100 bg-white px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-50">
              Tümü
            </button>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-slate-100">
            {orders.map((order) => (
              <div key={`${order.customer}-${order.amount}`} className="grid gap-3 border-b border-slate-100 bg-white p-5 last:border-b-0 md:grid-cols-[1fr_1fr_auto_auto] md:items-center">
                <div>
                  <p className="font-black">{order.customer}</p>
                  <p className="mt-1 text-sm text-slate-500">{order.product}</p>
                </div>
                <div className="text-sm font-semibold text-slate-500">{order.channel}</div>
                <div className="font-black text-slate-950">{order.amount}</div>
                <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[38px] border border-white/70 bg-slate-950 p-6 text-white shadow-xl shadow-blue-100/60">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Entegrasyon durumu</h2>
            <p className="mt-1 text-sm text-slate-300">Pazaryeri bağlantılarının demo ilerlemesi.</p>
          </div>

          <div className="mt-6 space-y-5">
            {integrations.map((item) => (
              <div key={item.name} className="rounded-[26px] bg-white/5 p-4 ring-1 ring-white/10">
                <div className="mb-3 flex justify-between gap-3 text-sm">
                  <span className="font-bold">{item.name}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${item.color}`}>{item.status}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300"
                    style={{ width: item.value }}
                  />
                </div>
                <p className="mt-2 text-right text-xs text-slate-400">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[38px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-blue-100/60">
          <h2 className="text-2xl font-black tracking-tight">Kritik stoklar</h2>
          <p className="mt-1 text-sm text-slate-500">Minimum seviyenin altına yaklaşan ürünler.</p>

          <div className="mt-6 space-y-3">
            {stockAlerts.map((item) => (
              <div key={item.sku} className="rounded-[26px] border border-red-100 bg-red-50/60 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-red-600">{item.stock}</p>
                    <p className="text-xs text-slate-400">min: {item.min}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[38px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-blue-100/60">
          <h2 className="text-2xl font-black tracking-tight">Bugünkü zaman akışı</h2>
          <p className="mt-1 text-sm text-slate-500">Panel içindeki demo hareket geçmişi.</p>

          <div className="mt-6 space-y-4">
            {timeline.map((item) => (
              <div key={`${item.time}-${item.title}`} className="grid grid-cols-[70px_1fr] gap-4">
                <div className="pt-1 text-sm font-black text-blue-700">{item.time}</div>
                <div className="relative rounded-[26px] border border-slate-100 bg-slate-50 p-5">
                  <div className="absolute -left-[25px] top-6 h-3 w-3 rounded-full bg-blue-600 shadow-lg shadow-blue-300" />
                  <p className="font-black text-slate-950">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
