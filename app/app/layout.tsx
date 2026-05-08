"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const primaryNavItems = [
  { href: "/app", label: "Dashboard", shortLabel: "Panel", icon: "⌁", desc: "Genel bakış" },
  { href: "/app/sales", label: "Satışlar", shortLabel: "Satış", icon: "₺", desc: "Gelir ve ödeme" },
  { href: "/app/qr", label: "QR / Barkod", shortLabel: "QR", icon: "⌗", desc: "Etiket ve okutma" },
  { href: "/app/gorki-ai", label: "Gorki AI", shortLabel: "Gorki", icon: "✦", desc: "Akıllı öneriler" },
];

const categoryItems = [
  { href: "/app/orders", label: "Siparişler", icon: "▣", desc: "Sipariş akışı" },
  { href: "/app/invoices", label: "Faturalar", icon: "□", desc: "Fatura takibi" },
  { href: "/app/customers", label: "Müşteriler", icon: "◎", desc: "Müşteri kartları" },
  { href: "/app/products", label: "Ürünler", icon: "◈", desc: "Ürün yönetimi" },
  { href: "/app/stock", label: "Stok", icon: "▤", desc: "Stok hareketleri" },
  { href: "/app/integrations", label: "Entegrasyonlar", icon: "◇", desc: "Pazaryerleri" },
  { href: "/app/settings", label: "Ayarlar", icon: "⚙", desc: "Firma ve hesap" },
];

const desktopNavGroups = [
  { title: "Ana Menü", items: primaryNavItems },
  { title: "Operasyon", items: categoryItems },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname.startsWith(href);
}

function getPageTitle(pathname: string) {
  const allItems = [...primaryNavItems, ...categoryItems];
  const current = allItems.find((item) => isActivePath(pathname, item.href));
  return current?.label ?? "Takipio";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const pageTitle = getPageTitle(pathname);

  return (
    <div className="min-h-screen overflow-hidden bg-[#eef5ff] text-slate-950">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-blue-300/30 blur-3xl" />
        <div className="absolute right-[-140px] top-20 h-[520px] w-[520px] rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="absolute bottom-[-180px] left-1/3 h-[520px] w-[520px] rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.055)_1px,transparent_0)] [background-size:28px_28px]" />
      </div>

      <div className="relative flex min-h-screen">
        <aside className="hidden w-[340px] shrink-0 p-5 lg:block">
          <div className="flex h-full flex-col overflow-hidden rounded-[38px] border border-white/80 bg-white/82 shadow-2xl shadow-blue-200/60 backdrop-blur-2xl">
            <div className="relative overflow-hidden p-5">
              <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-cyan-300/30 blur-3xl" />

              <div className="relative rounded-[32px] bg-gradient-to-br from-slate-950 via-blue-900 to-blue-600 p-5 text-white shadow-2xl shadow-blue-300/50">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[22px] bg-white p-2 ring-1 ring-white/20">
                    <Image
                      src="/takipio-logo.png"
                      alt="Takipio"
                      fill
                      className="object-contain p-2"
                      priority
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="text-2xl font-black tracking-[-0.04em]">Takipio</div>
                    <p className="mt-0.5 text-xs font-medium text-blue-100">
                      Premium işletme merkezi
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                    <p className="text-[11px] text-blue-100">Bugün</p>
                    <p className="mt-1 text-lg font-black">₺24.8K</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                    <p className="text-[11px] text-blue-100">Durum</p>
                    <p className="mt-1 text-lg font-black">Aktif</p>
                  </div>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-6 overflow-y-auto px-5 pb-5">
              {desktopNavGroups.map((group) => (
                <div key={group.title}>
                  <div className="mb-2 px-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                    {group.title}
                  </div>

                  <div className="space-y-1.5">
                    {group.items.map((item) => {
                      const active = isActivePath(pathname, item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={[
                            "group relative flex items-center gap-3 rounded-[22px] px-3 py-3 transition-all duration-300",
                            active
                              ? "bg-blue-600 text-white shadow-xl shadow-blue-200"
                              : "text-slate-600 hover:bg-blue-50 hover:text-blue-700",
                          ].join(" ")}
                        >
                          {active ? (
                            <span className="absolute -left-5 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-blue-600" />
                          ) : null}

                          <span
                            className={[
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] text-base font-black transition",
                              active
                                ? "bg-white/18 text-white ring-1 ring-white/15"
                                : "bg-slate-100 text-slate-500 group-hover:bg-blue-600 group-hover:text-white",
                            ].join(" ")}
                          >
                            {item.icon}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-black">{item.label}</span>
                            <span className={["mt-0.5 block truncate text-xs", active ? "text-blue-100" : "text-slate-400 group-hover:text-blue-500"].join(" ")}>
                              {item.desc}
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="border-t border-blue-50 p-5">
              <Link href="/app/gorki-ai" className="block rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 transition hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-slate-950">
                    <Image src="/gorki-hero.png" alt="Gorki AI" fill className="object-cover" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">Gorki hazır</p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">
                      Asistanla konuş.
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-3 pb-28 sm:p-4 sm:pb-28 lg:p-6">
          <div className="sticky top-3 z-30 mb-4 rounded-[28px] border border-white/80 bg-white/90 p-3 shadow-xl shadow-blue-100/50 backdrop-blur-2xl lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm">
                  <Image src="/takipio-logo.png" alt="Takipio" fill className="object-contain p-1.5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-lg font-black tracking-[-0.03em]">Takipio</div>
                  <p className="truncate text-xs font-medium text-slate-500">{pageTitle}</p>
                </div>
              </div>

              <Link href="/app/gorki-ai" className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-slate-950 shadow-lg shadow-blue-200">
                <Image src="/gorki-hero.png" alt="Gorki" fill className="object-cover" />
              </Link>
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
          className="fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-[3px] lg:hidden"
        />
      ) : null}

      <div
        className={[
          "fixed bottom-[92px] left-3 right-3 z-50 origin-bottom overflow-hidden rounded-[32px] border border-white/80 bg-white/96 shadow-2xl shadow-blue-950/25 backdrop-blur-2xl transition-all duration-300 lg:hidden",
          categoriesOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-8 scale-95 opacity-0",
        ].join(" ")}
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-900 to-blue-600 p-4 text-white">
          <div className="relative flex items-center justify-between gap-3">
            <div>
              <p className="text-base font-black">Kategoriler</p>
              <p className="mt-0.5 text-xs text-blue-100">Diğer panel modülleri</p>
            </div>

            <button
              type="button"
              onClick={() => setCategoriesOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12 text-lg font-black ring-1 ring-white/15"
            >
              ×
            </button>
          </div>
        </div>

        <div className="grid max-h-[56vh] grid-cols-1 gap-2 overflow-y-auto p-3 sm:grid-cols-2">
          {categoryItems.map((item, index) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setCategoriesOpen(false)}
                className={[
                  "flex items-center gap-3 rounded-[24px] p-3 transition-all duration-300",
                  categoriesOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : "bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-700",
                ].join(" ")}
                style={{ transitionDelay: `${index * 35}ms` }}
              >
                <span className={["flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] text-base font-black", active ? "bg-white/18 text-white" : "bg-white text-slate-500"].join(" ")}>
                  {item.icon}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black">{item.label}</span>
                  <span className={["mt-0.5 block truncate text-xs", active ? "text-blue-100" : "text-slate-400"].join(" ")}>
                    {item.desc}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <nav className="fixed bottom-3 left-3 right-3 z-50 rounded-[32px] border border-white/80 bg-white/96 p-2 shadow-2xl shadow-blue-950/25 backdrop-blur-2xl lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {primaryNavItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setCategoriesOpen(false)}
                className={[
                  "flex min-w-0 flex-col items-center justify-center gap-1 rounded-[22px] px-1.5 py-2.5 text-[10px] font-black transition-all duration-300",
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : "text-slate-500 hover:bg-blue-50 hover:text-blue-700",
                ].join(" ")}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span className="max-w-full truncate">{item.shortLabel}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setCategoriesOpen((value) => !value)}
            className={[
              "flex min-w-0 flex-col items-center justify-center gap-1 rounded-[22px] px-1.5 py-2.5 text-[10px] font-black transition-all duration-300",
              categoriesOpen
                ? "bg-slate-950 text-white shadow-lg shadow-slate-300"
                : "text-slate-500 hover:bg-blue-50 hover:text-blue-700",
            ].join(" ")}
          >
            <span className="text-lg leading-none">{categoriesOpen ? "×" : "☰"}</span>
            <span className="max-w-full truncate">Kategoriler</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
