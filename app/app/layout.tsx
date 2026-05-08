TAKIPIO MOBILE LAYOUT v1

BUNU NEREYE YAPIŞTIRACAKSIN?
GitHub'da şu dosyaya:

app/app/layout.tsx

NASIL YAPACAKSIN?
1) GitHub'da app klasörüne gir.
2) Onun içindeki ikinci app klasörüne gir.
3) layout.tsx dosyasını aç.
4) Sağ üstten kalem/edit butonuna bas.
5) İçindeki bütün kodu sil.
6) Aşağıdaki kodu komple yapıştır.
7) Commit changes yap.
8) Vercel deploy bitince telefondan /app sayfasını aç.

DOKUNMAYACAĞIN DOSYALAR:
app/layout.tsx
app/globals.css
app/page.tsx
app/app/page.tsx
app/login/page.tsx

NE EKLENİYOR?
- Mobilde altta sabit menü bar
- Dashboard / Satışlar / QR / Gorki / Kategoriler
- Kategoriler butonuna basınca yukarı doğru açılan animasyonlu menü
- Desktop sidebar aynen kalıyor
- Aktif sayfa mavi görünüyor
- Mobilde içerik alt menünün altında kalmasın diye bottom padding eklendi

----------------------------------------
app/app/layout.tsx KODU
----------------------------------------


"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const mainNavItems = [
  { href: "/app", label: "Dashboard", icon: "⌁" },
  { href: "/app/sales", label: "Satışlar", icon: "₺" },
  { href: "/app/qr", label: "QR", icon: "⌗" },
  { href: "/app/gorki-ai", label: "Gorki", icon: "✦" },
];

const categoryItems = [
  { href: "/app/orders", label: "Siparişler", icon: "▣" },
  { href: "/app/invoices", label: "Faturalar", icon: "□" },
  { href: "/app/customers", label: "Müşteriler", icon: "◎" },
  { href: "/app/products", label: "Ürünler", icon: "◈" },
  { href: "/app/stock", label: "Stok", icon: "▤" },
  { href: "/app/integrations", label: "Entegrasyonlar", icon: "◇" },
  { href: "/app/settings", label: "Ayarlar", icon: "⚙" },
];

const desktopNavItems = [...mainNavItems, ...categoryItems];

function isActivePath(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname.startsWith(href);
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [categoriesOpen, setCategoriesOpen] = useState(false);

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
              {desktopNavItems.map((item) => {
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                      active
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                        : "text-slate-600 hover:bg-blue-50 hover:text-blue-700",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-9 w-9 items-center justify-center rounded-xl transition",
                        active
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500 group-hover:bg-blue-600 group-hover:text-white",
                      ].join(" ")}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-5 rounded-[24px] border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-bold text-slate-900">Gorki hazır</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                AI önerileri, stok uyarıları ve entegrasyon takipleri buradan güçlenecek.
              </p>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-3 pb-28 sm:p-4 sm:pb-28 lg:p-6">
          <div className="mb-4 rounded-[26px] border border-white/70 bg-white/85 p-4 shadow-lg shadow-blue-100/60 backdrop-blur-xl lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-black tracking-tight">Takipio</div>
                <p className="text-xs text-slate-500">Mobil işletme paneli</p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-200">
                T
              </div>
            </div>
          </div>

          {children}
        </main>
      </div>

      {categoriesOpen ? (
        <button
          type="button"
          aria-label="Kategoriler menüsünü kapat"
          onClick={() => setCategoriesOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[2px] lg:hidden"
        />
      ) : null}

      <div
        className={[
          "fixed bottom-[88px] left-3 right-3 z-50 origin-bottom rounded-[30px] border border-white/70 bg-white/95 p-3 shadow-2xl shadow-blue-950/20 backdrop-blur-xl transition-all duration-300 lg:hidden",
          categoriesOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-6 scale-95 opacity-0",
        ].join(" ")}
      >
        <div className="mb-3 flex items-center justify-between px-2">
          <div>
            <p className="text-sm font-black text-slate-950">Kategoriler</p>
            <p className="text-xs text-slate-500">Diğer panel sayfaları</p>
          </div>

          <button
            type="button"
            onClick={() => setCategoriesOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-sm font-black text-slate-600"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {categoryItems.map((item, index) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setCategoriesOpen(false)}
                className={[
                  "flex items-center gap-3 rounded-2xl p-3 text-sm font-bold transition-all duration-300",
                  categoriesOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : "bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-700",
                ].join(" ")}
                style={{ transitionDelay: `${index * 35}ms` }}
              >
                <span
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-xl",
                    active ? "bg-white/20 text-white" : "bg-white text-slate-500",
                  ].join(" ")}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <nav className="fixed bottom-3 left-3 right-3 z-50 rounded-[30px] border border-white/70 bg-white/95 p-2 shadow-2xl shadow-blue-950/20 backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {mainNavItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setCategoriesOpen(false)}
                className={[
                  "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] font-black transition",
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : "text-slate-500 hover:bg-blue-50 hover:text-blue-700",
                ].join(" ")}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setCategoriesOpen((value) => !value)}
            className={[
              "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] font-black transition",
              categoriesOpen
                ? "bg-slate-950 text-white shadow-lg shadow-slate-300"
                : "text-slate-500 hover:bg-blue-50 hover:text-blue-700",
            ].join(" ")}
          >
            <span className="text-lg leading-none">{categoriesOpen ? "×" : "☰"}</span>
            <span>Kategoriler</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
