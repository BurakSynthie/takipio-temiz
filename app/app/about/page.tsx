export default function AboutPage() {
  return (
    <section className="mx-auto w-full max-w-[1300px] space-y-5 text-white">
      <div className="rounded-[28px] border border-white/10 bg-[#111a2e] p-6 shadow-[0_20px_70px_rgba(2,6,23,0.26)]">
        <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-200 ring-1 ring-blue-400/20">
          Takipio Hakkında
        </div>
        <h1 className="text-4xl font-black tracking-[-0.055em] sm:text-6xl">Küçük işletmeler için akıllı kontrol merkezi.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
          Takipio; satış, stok, QR, fatura, pazaryeri ve müşteri takibini tek ekranda toplayan modern SaaS işletme platformudur.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Feature title="Neden Takipio?" desc="Dağınık Excel, mesaj ve stok takibini tek bir sade panelde birleştirir." />
        <Feature title="Kimler için?" desc="E-ticaret yapanlar, perakende işletmeler, üreticiler ve stok yöneten ekipler için." />
        <Feature title="Gorki AI" desc="İşletme verilerini anlamlandıran ve kullanıcının ne yapması gerektiğini öneren yardımcı katman." />
      </div>

      <div className="rounded-[28px] border border-white/10 bg-[#111a2e] p-6">
        <h2 className="text-2xl font-black">Yol haritası</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {["Ürün & stok sistemi", "Satıştan otomatik stok düşme", "QR etiket yazdırma", "Mobil kamera ile QR okutma", "Pazaryeri entegrasyonları", "Gorki AI canlı öneriler"].map((item) => (
            <div key={item} className="rounded-2xl bg-[#0b1220] p-4 ring-1 ring-white/8">
              <p className="font-black">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[#111a2e] p-5">
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{desc}</p>
    </div>
  );
}
