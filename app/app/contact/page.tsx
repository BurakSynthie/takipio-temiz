export default function ContactPage() {
  return (
    <section className="mx-auto w-full max-w-[1200px] space-y-5 text-white">
      <div className="rounded-[28px] border border-white/10 bg-[#111a2e] p-6 shadow-[0_20px_70px_rgba(2,6,23,0.26)]">
        <div className="mb-3 inline-flex rounded-full bg-emerald-500/15 px-3 py-2 text-xs font-black text-emerald-200 ring-1 ring-emerald-400/20">
          Destek Merkezi
        </div>
        <h1 className="text-4xl font-black tracking-[-0.055em] sm:text-6xl">Bize ulaş.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
          Takipio destek, satış ve teknik yardım taleplerini buradan yönetebilirsin.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          <InfoCard title="E-posta" value="destek@takipio.com" desc="Destek talepleri için" />
          <InfoCard title="Canlı Destek" value="Gorki AI" desc="Panel sağ altından ulaşılabilir" />
          <InfoCard title="Çalışma Saatleri" value="09:00 - 18:00" desc="Pazartesi - Cuma" />
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#111a2e] p-5">
          <h2 className="text-2xl font-black">İletişim Formu</h2>
          <div className="mt-5 grid gap-4">
            <input placeholder="Ad Soyad" className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none placeholder:text-slate-500" />
            <input placeholder="E-posta" className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none placeholder:text-slate-500" />
            <select className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
              <option>Destek Talebi</option>
              <option>Satış Görüşmesi</option>
              <option>Teknik Problem</option>
              <option>Öneri</option>
            </select>
            <textarea placeholder="Mesajınız" className="min-h-[150px] rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none placeholder:text-slate-500" />
            <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">Mesajı Gönder</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoCard({ title, value, desc }: { title: string; value: string; desc: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[#111a2e] p-5">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-black">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{desc}</p>
    </div>
  );
}
