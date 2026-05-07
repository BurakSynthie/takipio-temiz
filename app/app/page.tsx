const stats = [
  { label: "Bugünkü Ciro", value: "₺24.850", note: "+18%" },
  { label: "Sipariş", value: "42", note: "12 beklemede" },
  { label: "Stok Uyarısı", value: "7", note: "kritik ürün" },
  { label: "Entegrasyon", value: "4", note: "aktif kanal" },
];

export default function DashboardPage() {
  return (
    <section>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-950">Dashboard</h1>
        <p className="mt-2 text-slate-500">Satış, stok, sipariş ve entegrasyonları tek ekrandan izle.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <div className="mt-3 text-3xl font-black">{stat.value}</div>
            <p className="mt-2 text-sm text-blue-600">{stat.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Genel Akış</h2>
          <p className="mt-2 text-slate-500">Buraya canlı satış grafiği, son siparişler ve stok hareketleri gelecek.</p>
        </div>

        <div className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Gorki Önerisi</h2>
          <p className="mt-2 text-slate-500">Bugün stok uyarısı olan ürünleri kontrol etmek iyi olur.</p>
        </div>
      </div>
    </section>
  );
}
