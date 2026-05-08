export default function ContactPage() {
  return (
    <section className="mx-auto w-full max-w-[1100px] space-y-3 text-white">
      <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
        <h1 className="text-2xl font-black">İletişim</h1>
        <p className="mt-1 text-sm text-slate-400">Destek, satış ve teknik iletişim kanalları.</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          <Info title="E-posta" value="takipioinfo@gmail.com" />
          <Info title="Telefon" value="0531 723 48 01" />
          <Info title="Canlı Destek" value="Gorki AI" />
        </div>

        <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
          <h2 className="text-lg font-black">Destek Formu</h2>
          <div className="mt-4 grid gap-3">
            <input placeholder="Ad Soyad" className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            <input placeholder="E-posta" className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            <textarea placeholder="Mesaj" className="min-h-[140px] rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black">Gönder</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
      <p className="text-xs font-black text-slate-500">{title}</p>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  );
}
