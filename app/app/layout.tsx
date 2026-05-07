import Link from "next/link";

const navItems = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/sales", label: "Satışlar" },
  { href: "/app/orders", label: "Siparişler" },
  { href: "/app/invoices", label: "Faturalar" },
  { href: "/app/customers", label: "Müşteriler" },
  { href: "/app/products", label: "Ürünler" },
  { href: "/app/stock", label: "Stok" },
  { href: "/app/qr", label: "QR / Barkod" },
  { href: "/app/integrations", label: "Entegrasyonlar" },
  { href: "/app/gorki-ai", label: "Gorki AI" },
  { href: "/app/settings", label: "Ayarlar" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f8ff] text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-blue-100 bg-white p-5 lg:block">
          <div className="mb-8 rounded-[28px] bg-blue-600 p-5 text-white shadow-lg shadow-blue-200">
            <div className="text-2xl font-black">Takipio</div>
            <p className="mt-1 text-sm text-blue-100">İşletme kontrol merkezi</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 lg:p-8">
          <div className="mb-5 rounded-[24px] border border-blue-100 bg-white p-4 shadow-sm lg:hidden">
            <div className="font-black">Takipio</div>
            <p className="text-sm text-slate-500">Mobil panel görünümü</p>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
