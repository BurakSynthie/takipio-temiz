"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

type IconName =
  | "dashboard"
  | "sales"
  | "products"
  | "stock"
  | "qr"
  | "customers"
  | "invoices"
  | "integrations"
  | "gorki"
  | "inbox"
  | "notifications"
  | "downloads"
  | "about"
  | "contact"
  | "settings"
  | "menu"
  | "search"
  | "theme"
  | "logout"
  | "send";

type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  icon: IconName;
  desc: string;
};

type GorkiMessage = {
  role: "gorki" | "user";
  text: string;
};

const mainItems: NavItem[] = [
  { href: "/app", label: "Dashboard", shortLabel: "Panel", icon: "dashboard", desc: "Genel bakış" },
  { href: "/app/sales", label: "Satışlar", shortLabel: "Satış", icon: "sales", desc: "Gelir takibi" },
  { href: "/app/products", label: "Ürünler", shortLabel: "Ürün", icon: "products", desc: "Ürün & stok" },
  { href: "/app/stock", label: "Stok", shortLabel: "Stok", icon: "stock", desc: "Depo hareketleri" },
  { href: "/app/qr", label: "QR / Barkod", shortLabel: "QR", icon: "qr", desc: "Etiket sistemi" },
];

const businessItems: NavItem[] = [
  { href: "/app/customers", label: "Müşteriler", icon: "customers", desc: "Cari kayıtları" },
  { href: "/app/invoices", label: "Faturalar", icon: "invoices", desc: "Tahsilat takibi" },
  { href: "/app/integrations", label: "Entegrasyonlar", icon: "integrations", desc: "Pazaryerleri" },
  { href: "/app/gorki-ai", label: "Gorki AI", icon: "gorki", desc: "Akıllı asistan" },
];

const systemItems: NavItem[] = [
  { href: "/app/inbox", label: "Inbox", icon: "inbox", desc: "Mesaj merkezi" },
  { href: "/app/notifications", label: "Bildirimler", icon: "notifications", desc: "Uyarılar" },
  { href: "/app/downloads", label: "Mobil Uygulama", icon: "downloads", desc: "App Store / Play" },
  { href: "/app/about", label: "Hakkımızda", icon: "about", desc: "Takipio nedir" },
  { href: "/app/contact", label: "İletişim", icon: "contact", desc: "Destek" },
  { href: "/app/settings", label: "Ayarlar", icon: "settings", desc: "Hesap" },
];

const groups = [
  { title: "Kontrol", items: mainItems },
  { title: "İşletme", items: businessItems },
  { title: "Merkez", items: systemItems },
];

const initialMessages: GorkiMessage[] = [
  {
    role: "gorki",
    text: "Merhaba, ben Gorki. Panelde gezerken satış, stok, ödeme, QR veya müşteri tarafında sana yardımcı olabilirim.",
  },
];

const quickQuestions = ["Bugün neye bakayım?", "Kritik stok var mı?", "Bekleyen ödeme var mı?"];

function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const common = "h-5 w-5 " + className;

  if (name === "dashboard") {
    return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M4 13.5C4 8.8 7.8 5 12.5 5S21 8.8 21 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M12.5 13.5L16.2 9.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M7 19H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  }

  if (name === "sales") {
    return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M6 19V5M6 19H20M6 19L10.5 14.5L14 16.5L20 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  }

  if (name === "products") {
    return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M4.5 8L12 12.3L19.5 8M12 21V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  }

  if (name === "stock") {
    return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M4 7H20M6 7V20H18V7M9 11H15M9 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 7V4H16V7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>;
  }

  if (name === "qr") {
    return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M4 4H10V10H4V4ZM14 4H20V10H14V4ZM4 14H10V20H4V14Z" stroke="currentColor" strokeWidth="2"/><path d="M14 14H16V16H14V14ZM18 14H20V16H18V14ZM14 18H16V20H14V18ZM18 18H20V20H18V18Z" fill="currentColor"/></svg>;
  }

  if (name === "customers") {
    return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M16 19C16 16.8 14.2 15 12 15H8C5.8 15 4 16.8 4 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10 11C12.2 11 14 9.2 14 7C14 4.8 12.2 3 10 3C7.8 3 6 4.8 6 7C6 9.2 7.8 11 10 11Z" stroke="currentColor" strokeWidth="2"/><path d="M18 8V14M15 11H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  }

  if (name === "invoices") {
    return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M7 3H17L20 6V21L17 19L14.5 21L12 19L9.5 21L7 19L4 21V6C4 4.3 5.3 3 7 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M8 9H16M8 13H16M8 17H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  }

  if (name === "integrations") {
    return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M8 12H16M7 7L5.5 5.5C4.7 4.7 4.7 3.3 5.5 2.5C6.3 1.7 7.7 1.7 8.5 2.5L10 4M17 17L18.5 18.5C19.3 19.3 19.3 20.7 18.5 21.5C17.7 22.3 16.3 22.3 15.5 21.5L14 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M8 17L5.5 19.5M16 7L18.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  }

  if (name === "gorki") {
    return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M12 3V6M7 6H17C19.2 6 21 7.8 21 10V15C21 17.2 19.2 19 17 19H7C4.8 19 3 17.2 3 15V10C3 7.8 4.8 6 7 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M8.5 12H8.6M15.4 12H15.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><path d="M9 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  }

  if (name === "inbox") {
    return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M4 5H20V16H15L12 19L9 16H4V5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M8 9H16M8 12H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  }

  if (name === "notifications") {
    return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M18 10C18 6.7 15.3 4 12 4S6 6.7 6 10V15L4 18H20L18 15V10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M10 21H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  }

  if (name === "downloads") {
    return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M12 4V15M12 15L8 11M12 15L16 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 19H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  }

  if (name === "about") {
    return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M12 21C17 21 21 17 21 12S17 3 12 3S3 7 3 12S7 21 12 21Z" stroke="currentColor" strokeWidth="2"/><path d="M12 11V16M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  }

  if (name === "contact") {
    return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M4 5H20V19H4V5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M4 7L12 13L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  }

  if (name === "settings") {
    return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M12 15.5C13.9 15.5 15.5 13.9 15.5 12C15.5 10.1 13.9 8.5 12 8.5C10.1 8.5 8.5 10.1 8.5 12C8.5 13.9 10.1 15.5 12 15.5Z" stroke="currentColor" strokeWidth="2"/><path d="M19 12C19 11.6 19 11.2 18.9 10.8L21 9.2L19 5.8L16.5 6.8C15.9 6.3 15.3 5.9 14.6 5.6L14.2 3H9.8L9.4 5.6C8.7 5.9 8.1 6.3 7.5 6.8L5 5.8L3 9.2L5.1 10.8C5 11.2 5 11.6 5 12C5 12.4 5 12.8 5.1 13.2L3 14.8L5 18.2L7.5 17.2C8.1 17.7 8.7 18.1 9.4 18.4L9.8 21H14.2L14.6 18.4C15.3 18.1 15.9 17.7 16.5 17.2L19 18.2L21 14.8L18.9 13.2C19 12.8 19 12.4 19 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>;
  }

  if (name === "search") {
    return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M11 19C15.4 19 19 15.4 19 11S15.4 3 11 3S3 6.6 3 11S6.6 19 11 19Z" stroke="currentColor" strokeWidth="2"/><path d="M21 21L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  }

  if (name === "theme") {
    return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M21 14.5C19.7 15.3 18.1 15.7 16.5 15.7C11.9 15.7 8.3 12.1 8.3 7.5C8.3 5.9 8.7 4.3 9.5 3C5.8 4.1 3 7.6 3 11.7C3 16.7 7.1 20.8 12.1 20.8C16.2 20.8 19.7 18 21 14.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>;
  }

  if (name === "logout") {
    return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M10 6H6V18H10M14 8L18 12L14 16M18 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  }

  if (name === "send") {
    return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M21 3L10.5 13.5M21 3L14.5 21L10.5 13.5M21 3L3 9.5L10.5 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  }

  return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M5 7H19M5 12H19M5 17H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
}

function isActivePath(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname.startsWith(href);
}

function getPageTitle(pathname: string) {
  const allItems = [...mainItems, ...businessItems, ...systemItems];
  const current = allItems.find((item) => isActivePath(pathname, item.href));
  return current?.label ?? "Takipio";
}

function createGorkiReply(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes("stok")) {
    return "Stok tarafında kritik ürünleri ve son hareketleri kontrol edebilirsin. Stok sayfası tüm giriş/çıkış geçmişini gösterir.";
  }

  if (lower.includes("ödeme") || lower.includes("tahsilat")) {
    return "Bekleyen ödemeleri dashboard kartından veya satışlar sayfasından görebilirsin. Ödeme durumu paid olana kadar bekleyen tarafta kalır.";
  }

  if (lower.includes("qr") || lower.includes("barkod")) {
    return "Ürün kartındaki QR Gör alanından direkt yazdırabilir, PDF kaydedebilir veya PNG indirebilirsin.";
  }

  return "Bunu not aldım. Şu an demo yanıt modundayım; sonraki aşamada gerçek panel verilerini okuyup daha akıllı öneriler vereceğim.";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [gorkiOpen, setGorkiOpen] = useState(false);
  const [gorkiInput, setGorkiInput] = useState("");
  const [messages, setMessages] = useState<GorkiMessage[]>(initialMessages);
  const [darkMode, setDarkMode] = useState(true);

  const pageTitle = getPageTitle(pathname);

  const contextText = useMemo(() => {
    if (pathname.includes("products")) return "Ürün yönetimindesin";
    if (pathname.includes("sales")) return "Satış ekranındasın";
    if (pathname.includes("stock")) return "Stok hareketlerindesin";
    if (pathname.includes("downloads")) return "Mobil uygulama sayfasındasın";
    if (pathname.includes("contact")) return "İletişim sayfasındasın";
    return "Panelde geziniyorsun";
  }, [pathname]);

  function sendGorkiMessage(text?: string) {
    const cleanText = (text ?? gorkiInput).trim();
    if (!cleanText) return;

    setMessages((currentMessages) => [
      ...currentMessages,
      { role: "user", text: cleanText },
      { role: "gorki", text: createGorkiReply(cleanText) },
    ]);

    setGorkiInput("");
    setGorkiOpen(true);
  }

  return (
    <div className={darkMode ? "min-h-screen bg-[#0b1220] text-white" : "min-h-screen bg-[#eef3f9] text-slate-950"}>
      <div className="flex min-h-screen">
        <aside className="hidden w-[248px] shrink-0 border-r border-white/10 bg-[#0b1220] p-3 text-white lg:block">
          <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#111a2e] shadow-[0_24px_80px_rgba(2,6,23,0.28)]">
            <div className="p-3">
              <div className="rounded-[22px] bg-[#07101f] p-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-11 w-11 overflow-hidden rounded-2xl bg-white">
                    <Image src="/takipio-logo.png" alt="Takipio" fill className="object-contain p-2" priority />
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-lg font-black tracking-[-0.04em]">Takipio</div>
                    <p className="truncate text-[11px] text-slate-400">Premium işletme paneli</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-white/8 p-2.5">
                    <p className="text-[10px] text-slate-400">Bugün</p>
                    <p className="mt-1 text-sm font-black">Canlı</p>
                  </div>
                  <div className="rounded-2xl bg-white/8 p-2.5">
                    <p className="text-[10px] text-slate-400">Sistem</p>
                    <p className="mt-1 text-sm font-black text-emerald-300">Aktif</p>
                  </div>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-3">
              {groups.map((group) => (
                <div key={group.title}>
                  <div className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    {group.title}
                  </div>

                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = isActivePath(pathname, item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={[
                            "group flex items-center gap-2.5 rounded-2xl px-2.5 py-2.5 transition-all duration-200",
                            active
                              ? "bg-blue-600 text-white shadow-[0_12px_32px_rgba(37,99,235,0.28)]"
                              : "text-slate-400 hover:bg-white/8 hover:text-white",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition",
                              active ? "bg-white/15 text-white" : "bg-white/8 text-slate-400 group-hover:text-white",
                            ].join(" ")}
                          >
                            <Icon name={item.icon} className="h-4.5 w-4.5" />
                          </span>

                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-black">{item.label}</span>
                            <span className={["mt-0.5 block truncate text-[11px]", active ? "text-blue-100" : "text-slate-500"].join(" ")}>
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
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-28 lg:pb-0">
          <header className={["sticky top-0 z-40 border-b backdrop-blur-2xl", darkMode ? "border-white/10 bg-[#0b1220]/88" : "border-slate-200 bg-white/90"].join(" ")}>
            <div className="flex h-[74px] items-center gap-3 px-3 sm:px-5">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="lg:hidden">
                  <div className="relative h-11 w-11 overflow-hidden rounded-2xl bg-white shadow-sm">
                    <Image src="/takipio-logo.png" alt="Takipio" fill className="object-contain p-2" />
                  </div>
                </div>

                <div className="hidden min-w-0 lg:block">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Aktif sayfa</p>
                  <h1 className="truncate text-xl font-black tracking-[-0.04em]">{pageTitle}</h1>
                </div>

                <div className={["hidden h-11 max-w-xl flex-1 items-center gap-2 rounded-2xl px-3 ring-1 lg:flex", darkMode ? "bg-white/8 text-slate-300 ring-white/10" : "bg-slate-100 text-slate-600 ring-slate-200"].join(" ")}>
                  <Icon name="search" className="h-4 w-4 text-slate-500" />
                  <input
                    placeholder="Ürün, satış, müşteri, QR veya fatura ara..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/app/inbox"
                  className={["relative flex h-11 w-11 items-center justify-center rounded-2xl transition", darkMode ? "bg-white/8 text-slate-300 hover:bg-white/12" : "bg-slate-100 text-slate-700 hover:bg-slate-200"].join(" ")}
                >
                  <Icon name="inbox" className="h-4.5 w-4.5" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500" />
                </Link>

                <Link
                  href="/app/notifications"
                  className={["relative flex h-11 w-11 items-center justify-center rounded-2xl transition", darkMode ? "bg-white/8 text-slate-300 hover:bg-white/12" : "bg-slate-100 text-slate-700 hover:bg-slate-200"].join(" ")}
                >
                  <Icon name="notifications" className="h-4.5 w-4.5" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                </Link>

                <button
                  type="button"
                  onClick={() => setDarkMode((value) => !value)}
                  className={["flex h-11 w-11 items-center justify-center rounded-2xl transition", darkMode ? "bg-white/8 text-slate-300 hover:bg-white/12" : "bg-slate-100 text-slate-700 hover:bg-slate-200"].join(" ")}
                >
                  <Icon name="theme" className="h-4.5 w-4.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setGorkiOpen(true)}
                  className="relative h-11 w-11 overflow-hidden rounded-2xl bg-slate-950 shadow-lg lg:hidden"
                >
                  <Image src="/gorki-hero.png" alt="Gorki" fill className="object-contain object-bottom" />
                </button>

                <div className={["hidden items-center gap-3 rounded-2xl px-3 py-2 lg:flex", darkMode ? "bg-white/8" : "bg-slate-100"].join(" ")}>
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400" />
                  <div className="leading-none">
                    <p className="text-xs font-black">Burak</p>
                    <p className="mt-1 text-[10px] text-slate-500">Admin</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-3 pb-3 lg:hidden">
              <div className={["flex h-11 items-center gap-2 rounded-2xl px-3 ring-1", darkMode ? "bg-white/8 text-slate-300 ring-white/10" : "bg-white text-slate-600 ring-slate-200"].join(" ")}>
                <Icon name="search" className="h-4 w-4 text-slate-500" />
                <input
                  placeholder="Panelde ara..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
                />
              </div>
            </div>
          </header>

          <div className="p-3 sm:p-5">
            {children}
          </div>
        </main>
      </div>

      {categoriesOpen ? (
        <button
          type="button"
          aria-label="Kategoriler menüsünü kapat"
          onClick={() => setCategoriesOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[3px] lg:hidden"
        />
      ) : null}

      <div
        className={[
          "fixed bottom-[92px] left-3 right-3 z-50 origin-bottom overflow-hidden rounded-[28px] border bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] transition-all duration-300 lg:hidden",
          darkMode ? "border-white/10 bg-[#111827] text-white" : "border-slate-200 bg-white text-slate-950",
          categoriesOpen ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-8 scale-95 opacity-0",
        ].join(" ")}
      >
        <div className={["p-4", darkMode ? "bg-[#0b1220]" : "bg-slate-950 text-white"].join(" ")}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-base font-black">Tüm Modüller</p>
              <p className="text-xs text-slate-400">İşletme ve destek ekranları</p>
            </div>

            <button
              type="button"
              onClick={() => setCategoriesOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-lg font-black"
            >
              ×
            </button>
          </div>
        </div>

        <div className="grid max-h-[56vh] grid-cols-1 gap-2 overflow-y-auto p-3 sm:grid-cols-2">
          {[...businessItems, ...systemItems].map((item, index) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setCategoriesOpen(false)}
                className={[
                  "flex items-center gap-3 rounded-[20px] p-3 transition-all duration-300",
                  categoriesOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
                  active
                    ? "bg-blue-600 text-white"
                    : darkMode
                    ? "bg-white/8 text-slate-200"
                    : "bg-slate-50 text-slate-700",
                ].join(" ")}
                style={{ transitionDelay: `${index * 25}ms` }}
              >
                <span className={["flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", active ? "bg-white/18 text-white" : darkMode ? "bg-white/8 text-slate-300" : "bg-white text-slate-500"].join(" ")}>
                  <Icon name={item.icon} />
                </span>

                <span className="min-w-0">
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

      <nav className={["fixed bottom-3 left-3 right-3 z-50 rounded-[28px] border p-2 shadow-[0_20px_70px_rgba(15,23,42,0.20)] lg:hidden", darkMode ? "border-white/10 bg-[#111827]" : "border-slate-200 bg-white"].join(" ")}>
        <div className="grid grid-cols-6 gap-1">
          {mainItems.slice(0, 5).map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setCategoriesOpen(false)}
                className={[
                  "flex min-w-0 flex-col items-center justify-center gap-1 rounded-[19px] px-1 py-2.5 text-[9px] font-black transition-all duration-200",
                  active ? "bg-blue-600 text-white shadow-lg shadow-blue-950/20" : darkMode ? "text-slate-400 hover:bg-white/8" : "text-slate-500 hover:bg-slate-100",
                ].join(" ")}
              >
                <Icon name={item.icon} className="h-5 w-5" />
                <span className="max-w-full truncate">{item.shortLabel}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setCategoriesOpen((value) => !value)}
            className={[
              "flex min-w-0 flex-col items-center justify-center gap-1 rounded-[19px] px-1 py-2.5 text-[9px] font-black transition-all duration-200",
              categoriesOpen ? "bg-slate-950 text-white" : darkMode ? "text-slate-400 hover:bg-white/8" : "text-slate-500 hover:bg-slate-100",
            ].join(" ")}
          >
            <Icon name="menu" className="h-5 w-5" />
            <span className="max-w-full truncate">Menü</span>
          </button>
        </div>
      </nav>

      {!gorkiOpen ? (
        <button
          type="button"
          onClick={() => setGorkiOpen(true)}
          className={["fixed bottom-[98px] right-5 z-50 hidden w-[270px] items-center gap-3 rounded-[24px] border p-3 text-left shadow-[0_22px_70px_rgba(15,23,42,0.20)] transition hover:-translate-y-1 lg:flex", darkMode ? "border-white/10 bg-[#111827] text-white" : "border-slate-200 bg-white text-slate-950"].join(" ")}
        >
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-slate-950">
            <Image src="/gorki-hero.png" alt="Gorki" fill className="object-contain object-bottom" />
          </div>

          <div>
            <p className="text-sm font-black">Bugün sana nasıl yardımcı olabilirim?</p>
            <p className="text-xs text-slate-500">{contextText}</p>
          </div>
        </button>
      ) : null}

      <div
        className={[
          "fixed z-[60] overflow-hidden border shadow-[0_28px_90px_rgba(15,23,42,0.28)] transition-all duration-300",
          "bottom-[92px] left-3 right-3 rounded-[28px] lg:bottom-6 lg:left-auto lg:right-6 lg:w-[400px]",
          darkMode ? "border-white/10 bg-[#111827] text-white" : "border-slate-200 bg-white text-slate-950",
          gorkiOpen ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-8 scale-95 opacity-0",
        ].join(" ")}
      >
        <div className={["p-4", darkMode ? "bg-[#0b1220]" : "bg-slate-950 text-white"].join(" ")}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white/10">
                <Image src="/gorki-hero.png" alt="Gorki" fill className="object-contain object-bottom" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-base font-black">Gorki AI</p>
                <p className="truncate text-xs text-slate-400">{contextText}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setGorkiOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-lg font-black"
            >
              ×
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {quickQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => sendGorkiMessage(question)}
                className="rounded-full bg-white/10 px-3 py-2 text-xs font-black text-slate-200 transition hover:bg-blue-600"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        <div className={["max-h-[330px] space-y-3 overflow-y-auto p-4", darkMode ? "bg-white/[0.03]" : "bg-slate-50"].join(" ")}>
          {messages.map((message, index) => {
            const isUser = message.role === "user";

            return (
              <div key={`${message.role}-${index}`} className={["flex", isUser ? "justify-end" : "justify-start"].join(" ")}>
                <div
                  className={[
                    "max-w-[86%] rounded-[20px] px-4 py-3 text-sm leading-6",
                    isUser
                      ? "bg-blue-600 text-white"
                      : darkMode
                      ? "bg-white/8 text-slate-100 ring-1 ring-white/10"
                      : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-100",
                  ].join(" ")}
                >
                  {message.text}
                </div>
              </div>
            );
          })}
        </div>

        <div className={["flex gap-2 border-t p-3", darkMode ? "border-white/10" : "border-slate-100"].join(" ")}>
          <input
            value={gorkiInput}
            onChange={(event) => setGorkiInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") sendGorkiMessage();
            }}
            placeholder="Gorki’ye sor..."
            className={["min-w-0 flex-1 rounded-2xl border px-4 py-3 text-sm outline-none placeholder:text-slate-500", darkMode ? "border-white/10 bg-white/8 text-white focus:border-blue-400" : "border-slate-200 bg-slate-50 text-slate-950 focus:border-blue-500"].join(" ")}
          />

          <button
            type="button"
            onClick={() => sendGorkiMessage()}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white transition hover:bg-blue-700"
          >
            <Icon name="send" />
          </button>
        </div>
      </div>
    </div>
  );
}
