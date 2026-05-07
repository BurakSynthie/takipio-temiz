import Link from "next/link";

const navItems = [
  { href: "/app", label: "Dashboard", icon: "⌁" },
  { href: "/app/sales", label: "Satışlar", icon: "₺" },
  { href: "/app/orders", label: "Siparişler", icon: "▣" },
  { href: "/app/invoices", label: "Faturalar", icon: "□" },
  { href: "/app/customers", label: "Müşteriler", icon: "◎" },
  { href: "/app/products", label: "Ürünler", icon: "◈" },
  { href: "/app/stock", label: "Stok", icon: "▤" },
  { href: "/app/qr", label: "QR / Barkod", icon: "⌗" },
  { href: "/app/integrations", label: "Entegrasyonlar", icon: "◇" },
  { href: "/app/gorki-ai", label: "Gorki AI", icon: "✦" },
  { href: "/app/settings", label: "Ayarlar", icon: "⚙" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#eef5ff] text-slate-950">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-300/30 blur-3xl" />
        <div className="absolute right-0 top-32 h-[420px] w-[420px] rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen">
        <aside className="hidden w-80 shrink-0 p-5 lg:block">
          <div className="flex h-full flex-col rounded-[34px] border border-white/70 bg-white/80 p-5 shadow-2xl shadow-blue-200/50 backdrop-blur-xl">
            <div className="mb-7 rounded-[28px] bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-5 text-white shadow-xl shadow-blue-300/50">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-xl font-black ring-1 ring-white/30">
                  T
                </div>
                <div>
                  <div className="text-2xl font-black tracking-tight">Takipio</div>
                  <p className="text-xs text-blue-100">Premium işletme paneli</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                <p className="text-xs text-blue-100">Bugünkü durum</p>
                <p className="mt-1 text-lg font-bold">Sistem aktif · 4 kanal hazır</p>
              </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:bg-blue-600 group-hover:text-white">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-5 rounded-[24px] border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-bold text-slate-900">Gorki hazır</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                AI önerileri, stok uyarıları ve entegrasyon takipleri buradan güçlenecek.
              </p>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-4 lg:p-6">
          <div className="mb-5 rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-lg shadow-blue-100/60 backdrop-blur-xl lg:hidden">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-black">Takipio</div>
                <p className="text-sm text-slate-500">Mobil panel</p>
              </div>
              <div className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">
                T
              </div>
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
