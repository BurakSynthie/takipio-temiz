const stats = [
  { label: "Bugünkü Ciro", value: "₺24.850", change: "+18%", tone: "from-blue-600 to-cyan-500" },
  { label: "Sipariş", value: "42", change: "12 bekliyor", tone: "from-indigo-600 to-blue-500" },
  { label: "Stok Uyarısı", value: "7", change: "kritik", tone: "from-cyan-600 to-sky-500" },
  { label: "Aktif Kanal", value: "4", change: "hazır", tone: "from-slate-800 to-blue-700" },
];

const orders = [
  { title: "Trendyol siparişi", detail: "2 ürün · stoktan düşülecek", status: "Hazırlanıyor" },
  { title: "Manuel satış", detail: "QR etiket · 500 adet", status: "Onaylandı" },
  { title: "Fatura taslağı", detail: "ABC Ltd. · ₺12.300", status: "Bekliyor" },
];

const channels = [
  { name: "Trendyol", progress: "85%" },
  { name: "Hepsiburada", progress: "62%" },
  { name: "Amazon", progress: "48%" },
  { name: "ÇiçekSepeti", progress: "34%" },
];

export default function DashboardPage() {
  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="mb-3 inline-flex rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
            Takipio kontrol merkezi
          </div>
          <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">
            İşletmeni tek panelden yönet.
          </h1>
          <p className="mt-3 max-w-2xl text-slate-500">
            Satış, stok, QR etiket, fatura ve pazaryeri entegrasyonlarını klasik ama premium bir SaaS düzeninde takip et.
          </p>
        </div>

        <div className="flex gap-3">
          <button className="rounded-2xl border border-blue-100 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-blue-50">
            Rapor Al
          </button>
          <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
            Yeni İşlem
          </button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="group overflow-hidden rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-blue-100/60 backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-2xl">
            <div className={`mb-5 h-2 w-20 rounded-full bg-gradient-to-r ${stat.tone}`} />
            <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
            <div className="mt-3 flex items-end justify-between">
              <strong className="text-4xl font-black tracking-tight">{stat.value}</strong>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="rounded-[34px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-blue-100/60 backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Canlı İş Akışı</h2>
              <p className="mt-1 text-sm text-slate-500">Son siparişler, fatura hareketleri ve stok aksiyonları.</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Live</span>
          </div>

          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.title} className="flex flex-col gap-3 rounded-[26px] border border-slate-100 bg-slate-50/80 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-bold">{order.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{order.detail}</p>
                </div>
                <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm">
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[34px] border border-white/70 bg-slate-950 p-6 text-white shadow-xl shadow-blue-100/60">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Gorki AI</h2>
              <p className="mt-1 text-sm text-slate-300">Akıllı öneri alanı</p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-4xl ring-1 ring-white/10">
              🤖
            </div>
          </div>

          <div className="mt-6 rounded-[28px] bg-white/10 p-5 ring-1 ring-white/10">
            <p className="text-sm leading-6 text-slate-200">
              Bugün kritik stoğa düşen 7 ürün var. QR etiket basımı yapılacak ürünleri stok ekranıyla eşleştirmek iyi olur.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {channels.map((channel) => (
              <div key={channel.name}>
                <div className="mb-2 flex justify-between text-sm">
                  <span>{channel.name}</span>
                  <span className="text-blue-200">{channel.progress}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-300" style={{ width: channel.progress }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-blue-100/50">
          <h3 className="text-lg font-black">QR Etiket</h3>
          <p className="mt-2 text-sm text-slate-500">Telefon kamerasıyla okutulacak ürün etiketleri için hazır altyapı.</p>
        </div>
        <div className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-blue-100/50">
          <h3 className="text-lg font-black">Fatura Takibi</h3>
          <p className="mt-2 text-sm text-slate-500">Kesilen, bekleyen ve taslak faturalar dashboard’a bağlanacak.</p>
        </div>
        <div className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-blue-100/50">
          <h3 className="text-lg font-black">Entegrasyonlar</h3>
          <p className="mt-2 text-sm text-slate-500">Trendyol, Hepsiburada, Amazon ve ÇiçekSepeti ekranları geliştirilecek.</p>
        </div>
      </div>
    </section>
  );
}
