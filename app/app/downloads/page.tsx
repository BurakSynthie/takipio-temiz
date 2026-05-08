export default function DownloadsPage() {
  return (
    <section className="mx-auto w-full max-w-[1100px] space-y-3 text-white">
      <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
        <h1 className="text-2xl font-black">Mobil Uygulama</h1>
        <p className="mt-1 text-sm text-slate-400">App Store ve Google Play indirme alanları.</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Store title="App Store" subtitle="iPhone ve iPad için" icon="" />
        <Store title="Google Play" subtitle="Android cihazlar için" icon="▶" />
        <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
          <p className="text-lg font-black">Web App</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Mobil uygulama mağazaya çıkana kadar paneli mobil tarayıcıdan kullanabilirsin.
          </p>
          <button className="mt-4 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black">Web Panel Aktif</button>
        </div>
      </div>
    </section>
  );
}

function Store({ title, subtitle, icon }: { title: string; subtitle: string; icon: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl font-black text-slate-950">
          {icon}
        </div>
        <div>
          <p className="text-lg font-black">{title}</p>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      <button className="mt-5 w-full rounded-2xl bg-[#0b1220] px-4 py-3 text-sm font-black ring-1 ring-white/10">
        Yakında Yayında
      </button>
    </div>
  );
}
