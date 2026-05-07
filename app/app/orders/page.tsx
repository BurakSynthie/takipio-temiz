const items = [{"title": "Trendyol Siparişi", "description": "2 ürün · Kargoya hazırlanıyor", "status": "Hazırlanıyor"}, {"title": "Manuel Sipariş", "description": "QR etiket baskı · 500 adet", "status": "Onaylandı"}];

export default function OrdersPage() {
  return (
    <section>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Siparişler</h1>
          <p className="mt-2 text-slate-500">Pazaryeri ve manuel siparişleri tek ekranda takip et.</p>
        </div>

        <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
          Yeni Sipariş
        </button>
      </div>

      <div className="rounded-[28px] border border-blue-100 bg-white p-5 shadow-sm">
        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item.title} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-bold text-slate-950">{item.title}</h2>
                  <p className="text-sm text-slate-500">{item.description}</p>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
