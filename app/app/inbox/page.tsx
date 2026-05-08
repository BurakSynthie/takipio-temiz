const messages = [
  { from: "Takipio Sistem", title: "Stok hareketleri aktif", desc: "Ürün + / - işlemleri artık hareket geçmişine yazılıyor.", time: "Bugün" },
  { from: "Gorki AI", title: "Kritik stok takibi", desc: "Minimum stok altına düşen ürünleri dashboard üzerinden görebilirsin.", time: "Bugün" },
  { from: "Destek", title: "Mobil uygulama sayfası", desc: "App Store ve Google Play alanları hazırlandı.", time: "Dün" },
];

export default function InboxPage() {
  return (
    <section className="mx-auto w-full max-w-[1200px] space-y-5 text-white">
      <div className="rounded-[28px] border border-white/10 bg-[#111a2e] p-6">
        <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-200 ring-1 ring-blue-400/20">
          Inbox
        </div>
        <h1 className="text-4xl font-black tracking-[-0.055em]">Mesaj Merkezi</h1>
        <p className="mt-3 text-sm text-slate-400">Sistem, destek ve Gorki AI mesajları burada toplanır.</p>
      </div>

      <div className="grid gap-3">
        {messages.map((message) => (
          <div key={message.title} className="rounded-[24px] border border-white/10 bg-[#111a2e] p-5 transition hover:bg-[#17233b]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-300">{message.from}</p>
                <h2 className="mt-2 text-xl font-black">{message.title}</h2>
                <p className="mt-2 text-sm text-slate-400">{message.desc}</p>
              </div>
              <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300">{message.time}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
