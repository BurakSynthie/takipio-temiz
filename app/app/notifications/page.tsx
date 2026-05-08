const notifications = [
  { type: "Stok", title: "Kritik stok kontrolü", desc: "Minimum stok altındaki ürünler dashboard kartında listelenir.", tone: "red" },
  { type: "Ödeme", title: "Bekleyen tahsilat", desc: "Ödenmemiş satışlar bekleyen ödeme kartında görünür.", tone: "amber" },
  { type: "Satış", title: "Satıştan stok düşme", desc: "Yeni satış oluşturulduğunda ürün stoğu otomatik düşer.", tone: "blue" },
  { type: "QR", title: "QR çıktı sistemi", desc: "Ürün kartından QR etiket yazdırılabilir.", tone: "green" },
];

export default function NotificationsPage() {
  return (
    <section className="mx-auto w-full max-w-[1200px] space-y-5 text-white">
      <div className="rounded-[28px] border border-white/10 bg-[#111a2e] p-6">
        <div className="mb-3 inline-flex rounded-full bg-red-500/15 px-3 py-2 text-xs font-black text-red-200 ring-1 ring-red-400/20">
          Bildirim Merkezi
        </div>
        <h1 className="text-4xl font-black tracking-[-0.055em]">Bildirimler</h1>
        <p className="mt-3 text-sm text-slate-400">Kritik stok, ödeme, satış ve sistem uyarıları burada görünür.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {notifications.map((item) => (
          <div key={item.title} className="rounded-[24px] border border-white/10 bg-[#111a2e] p-5">
            <span className={["rounded-full px-3 py-1 text-xs font-black", item.tone === "red" ? "bg-red-400/15 text-red-300" : item.tone === "amber" ? "bg-amber-400/15 text-amber-300" : item.tone === "green" ? "bg-emerald-400/15 text-emerald-300" : "bg-blue-400/15 text-blue-300"].join(" ")}>
              {item.type}
            </span>
            <h2 className="mt-4 text-xl font-black">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
