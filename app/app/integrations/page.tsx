"use client";

const integrations = [
  {
    name: "Trendyol",
    status: "Hazır görsel entegrasyon",
    desc: "Sipariş, ürün ve stok senkronizasyonu için entegrasyon alanı.",
    color: "from-orange-500/20 to-orange-300/5",
    logo: "/trendyol.png",
  },
  {
    name: "Hepsiburada",
    status: "Hazır görsel entegrasyon",
    desc: "Marketplace sipariş akışı ve stok senkronu için hazırlanmış alan.",
    color: "from-amber-500/20 to-amber-300/5",
    logo: "/hepsiburada.png",
  },
  {
    name: "Amazon",
    status: "Hazır görsel entegrasyon",
    desc: "Amazon sipariş ve ürün senkronizasyon modülü için alan.",
    color: "from-cyan-500/20 to-cyan-300/5",
    logo: "/amazon.png",
  },
  {
    name: "ÇiçekSepeti",
    status: "Hazır görsel entegrasyon",
    desc: "ÇiçekSepeti mağaza verileri ve sipariş entegrasyonu alanı.",
    color: "from-emerald-500/20 to-emerald-300/5",
    logo: "/ciceksepeti.png",
  },
];

export default function IntegrationsPage() {
  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">Takipio Integrations</div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Entegrasyonlar</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Pazaryeri ve dış servis entegrasyon alanları. Şimdilik UI tarafı koyu moda göre düzenlendi.</p>
          </div>

          <div className="rounded-2xl bg-[#0b1220] px-4 py-3 ring-1 ring-white/10">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Aktif Kanal</p>
            <p className="mt-1 text-2xl font-black text-blue-300">4</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {integrations.map((item) => (
          <div key={item.name} className="overflow-hidden rounded-[24px] border border-white/10 bg-[#111a2e] transition hover:-translate-y-1 hover:bg-[#17233b]">
            <div className={`h-28 bg-gradient-to-br ${item.color} p-5`}>
              <div className="flex h-full items-center justify-between gap-3">
                <div className="rounded-2xl bg-white p-3">
                  <img src={item.logo} alt={item.name} className="h-10 w-10 object-contain" />
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black text-white">Yakında</span>
              </div>
            </div>

            <div className="p-5">
              <h2 className="text-xl font-black">{item.name}</h2>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-blue-300">{item.status}</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">{item.desc}</p>

              <div className="mt-5 flex gap-2">
                <button className="rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-blue-500">Bağla</button>
                <button className="rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-black text-slate-200">Detay</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <h2 className="text-2xl font-black">Entegrasyon Notları</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            "Siparişler otomatik içeri düşecek.",
            "Stok senkronizasyonu merkezi çalışacak.",
            "Marketplace bazlı filtreleme eklenecek.",
            "Gerçek API anahtar ekranları sonraki aşamada bağlanacak.",
          ].map((text) => (
            <div key={text} className="rounded-[18px] bg-[#0b1220] p-4 text-sm leading-6 text-slate-400 ring-1 ring-white/10">
              {text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
