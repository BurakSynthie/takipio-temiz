"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

type IconName =
  | "dashboard"
  | "sales"
  | "orders"
  | "invoice"
  | "customers"
  | "products"
  | "stock"
  | "qr"
  | "integration"
  | "gorki"
  | "settings"
  | "menu"
  | "send";

type GorkiMessage = {
  role: "gorki" | "user";
  text: string;
};

const mainItems = [
  { href: "/app", label: "Dashboard", shortLabel: "Panel", icon: "dashboard" as IconName, desc: "Genel bakış" },
  { href: "/app/sales", label: "Satışlar", shortLabel: "Satış", icon: "sales" as IconName, desc: "Gelir takibi" },
  { href: "/app/qr", label: "QR / Barkod", shortLabel: "QR", icon: "qr" as IconName, desc: "Etiket sistemi" },
  { href: "/app/gorki-ai", label: "Gorki AI", shortLabel: "Gorki", icon: "gorki" as IconName, desc: "Akıllı asistan" },
];

const moduleItems = [
  { href: "/app/orders", label: "Siparişler", icon: "orders" as IconName, desc: "Sipariş yönetimi" },
  { href: "/app/invoices", label: "Faturalar", icon: "invoice" as IconName, desc: "Tahsilat takibi" },
  { href: "/app/customers", label: "Müşteriler", icon: "customers" as IconName, desc: "Cari kayıtları" },
  { href: "/app/products", label: "Ürünler", icon: "products" as IconName, desc: "Ürün ve stok" },
  { href: "/app/stock", label: "Stok", icon: "stock" as IconName, desc: "Depo hareketleri" },
  { href: "/app/integrations", label: "Entegrasyonlar", icon: "integration" as IconName, desc: "Pazaryerleri" },
  { href: "/app/settings", label: "Ayarlar", icon: "settings" as IconName, desc: "Panel ayarları" },
];

const groups = [
  { title: "Ana Menü", items: mainItems },
  { title: "Modüller", items: moduleItems },
];

const initialMessages: GorkiMessage[] = [
  {
    role: "gorki",
    text: "Merhaba, ben Gorki. Panelde gezerken satış, stok, fatura veya QR etiketi hakkında bana soru sorabilirsin.",
  },
];

const quickQuestions = ["Bugün neye bakayım?", "Kritik stok var mı?", "QR nasıl yazdırılır?"];

function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const common = "h-5 w-5 " + className;

  if (name === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M4 13.5C4 8.8 7.8 5 12.5 5S21 8.8 21 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12.5 13.5L16.2 9.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M7 19H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "sales") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M6 19V5M6 19H20M6 19L10.5 14.5L14 16.5L20 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "orders") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M7 8H17M7 12H17M7 16H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 4H19C20.1 4 21 4.9 21 6V18C21 19.1 20.1 20 19 20H5C3.9 20 3 19.1 3 18V6C3 4.9 3.9 4 5 4Z" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "invoice") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M7 3H17L20 6V21L17 19L14.5 21L12 19L9.5 21L7 19L4 21V6C4 4.3 5.3 3 7 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M8 9H16M8 13H16M8 17H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "customers") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M16 19C16 16.8 14.2 15 12 15H8C5.8 15 4 16.8 4 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 11C12.2 11 14 9.2 14 7C14 4.8 12.2 3 10 3C7.8 3 6 4.8 6 7C6 9.2 7.8 11 10 11Z" stroke="currentColor" strokeWidth="2" />
        <path d="M18 8V14M15 11H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "products") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M4.5 8L12 12.3L19.5 8M12 21V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "stock") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M4 7H20M6 7V20H18V7M9 11H15M9 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 7V4H16V7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "qr") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M4 4H10V10H4V4ZM14 4H20V10H14V4ZM4 14H10V20H4V14Z" stroke="currentColor" strokeWidth="2" />
        <path d="M14 14H16V16H14V14ZM18 14H20V16H18V14ZM14 18H16V20H14V18ZM18 18H20V20H18V18Z" fill="currentColor" />
      </svg>
    );
  }

  if (name === "integration") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M8 12H16M7 7L5.5 5.5C4.7 4.7 4.7 3.3 5.5 2.5C6.3 1.7 7.7 1.7 8.5 2.5L10 4M17 17L18.5 18.5C19.3 19.3 19.3 20.7 18.5 21.5C17.7 22.3 16.3 22.3 15.5 21.5L14 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 17L5.5 19.5M16 7L18.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "gorki") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M12 3V6M7 6H17C19.2 6 21 7.8 21 10V15C21 17.2 19.2 19 17 19H7C4.8 19 3 17.2 3 15V10C3 7.8 4.8 6 7 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8.5 12H8.6M15.4 12H15.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M9 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "settings") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M12 15.5C13.9 15.5 15.5 13.9 15.5 12C15.5 10.1 13.9 8.5 12 8.5C10.1 8.5 8.5 10.1 8.5 12C8.5 13.9 10.1 15.5 12 15.5Z" stroke="currentColor" strokeWidth="2" />
        <path d="M19 12C19 11.6 19 11.2 18.9 10.8L21 9.2L19 5.8L16.5 6.8C15.9 6.3 15.3 5.9 14.6 5.6L14.2 3H9.8L9.4 5.6C8.7 5.9 8.1 6.3 7.5 6.8L5 5.8L3 9.2L5.1 10.8C5 11.2 5 11.6 5 12C5 12.4 5 12.8 5.1 13.2L3 14.8L5 18.2L7.5 17.2C8.1 17.7 8.7 18.1 9.4 18.4L9.8 21H14.2L14.6 18.4C15.3 18.1 15.9 17.7 16.5 17.2L19 18.2L21 14.8L18.9 13.2C19 12.8 19 12.4 19 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "send") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M21 3L10.5 13.5M21 3L14.5 21L10.5 13.5M21 3L3 9.5L10.5 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={common}>
      <path d="M5 7H19M5 12H19M5 17H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname.startsWith(href);
}

function getPageTitle(pathname: string) {
  const allItems = [...mainItems, ...moduleItems];
  const current = allItems.find((item) => isActivePath(pathname, item.href));
  return current?.label ?? "Takipio";
}

function createGorkiReply(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes("stok")) {
    return "Stok için ürünler sayfasındaki kritik stok etiketlerini ve minimum stok değerlerini kontrol et. Stok + / - butonları sayfa yenilemeden çalışır.";
  }

  if (lower.includes("qr") || lower.includes("barkod")) {
    return "QR için ürün kartındaki QR Gör butonunu aç. Yazdır / PDF seçeneğiyle direkt yazıcıdan çıktı alabilir veya PDF kaydedebilirsin.";
  }

  if (lower.includes("satış") || lower.includes("ciro")) {
    return "Satış ekranını canlı hale getirdiğimizde bu dashboard gerçek ciro, bekleyen ödeme ve fatura durumunu otomatik gösterecek.";
  }

  return "Bunu not aldım. Şu an demo moddayım; sonraki aşamada gerçek Takipio verilerini okuyup canlı öneriler vereceğim.";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [gorkiOpen, setGorkiOpen] = useState(false);
  const [gorkiInput, setGorkiInput] = useState("");
  const [messages, setMessages] = useState<GorkiMessage[]>(initialMessages);

  const pageTitle = getPageTitle(pathname);

  const contextText = useMemo(() => {
    if (pathname.includes("products")) return "Ürün yönetimindesin";
    if (pathname.includes("sales")) return "Satış ekranındasın";
    if (pathname.includes("qr")) return "QR modülündesin";
    if (pathname.includes("invoices")) return "Fatura alanındasın";
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
    <div className="min-h-screen bg-[#edf2f8] text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-[300px] shrink-0 bg-[#111827] p-4 text-white lg:block">
          <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#151f33] shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
            <div className="p-4">
              <div className="rounded-[24px] bg-[#0b1220] p-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-white">
                    <Image src="/takipio-logo.png" alt="Takipio" fill className="object-contain p-2" priority />
                  </div>

                  <div className="min-w-0">
                    <div className="text-xl font-black tracking-[-0.04em]">Takipio</div>
                    <p className="text-xs text-slate-400">Premium işletme paneli</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-white/8 p-3">
                    <p className="text-[11px] text-slate-400">Bugün</p>
                    <p className="mt-1 text-lg font-black">₺24.8K</p>
                  </div>
                  <div className="rounded-2xl bg-white/8 p-3">
                    <p className="text-[11px] text-slate-400">Açık</p>
                    <p className="mt-1 text-lg font-black">19</p>
                  </div>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
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
                            "group flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200",
                            active
                              ? "bg-[#2463ff] text-white shadow-[0_12px_32px_rgba(36,99,255,0.32)]"
                              : "text-slate-400 hover:bg-white/8 hover:text-white",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition",
                              active ? "bg-white/15 text-white" : "bg-white/8 text-slate-400 group-hover:text-white",
                            ].join(" ")}
                          >
                            <Icon name={item.icon} />
                          </span>

                          <span className="min-w-0">
                            <span className="block truncate text-sm font-black">{item.label}</span>
                            <span className={["mt-0.5 block truncate text-xs", active ? "text-blue-100" : "text-slate-500"].join(" ")}>
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

            <div className="border-t border-white/10 p-4">
              <button
                type="button"
                onClick={() => setGorkiOpen(true)}
                className="w-full rounded-[22px] bg-[#0b1220] p-3 text-left transition hover:-translate-y-0.5 hover:bg-[#0f1a2f]"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-white/8">
                    <Image src="/gorki-hero.png" alt="Gorki" fill className="object-contain object-bottom" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-black">Gorki canlı</p>
                    <p className="text-xs text-slate-500">Panelde gezerken konuş.</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-3 pb-28 sm:p-4 sm:pb-28 lg:p-5">
          <div className="sticky top-3 z-30 mb-4 rounded-[24px] border border-slate-200 bg-white/95 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                  <Image src="/takipio-logo.png" alt="Takipio" fill className="object-contain p-1.5" />
                </div>

                <div className="min-w-0">
                  <div className="truncate text-lg font-black tracking-[-0.03em]">Takipio</div>
                  <p className="truncate text-xs font-bold text-slate-500">{pageTitle}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setGorkiOpen(true)}
                className="relative h-11 w-11 overflow-hidden rounded-2xl bg-slate-950 shadow-lg"
              >
                <Image src="/gorki-hero.png" alt="Gorki" fill className="object-contain object-bottom" />
              </button>
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
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[3px] lg:hidden"
        />
      ) : null}

      <div
        className={[
          "fixed bottom-[92px] left-3 right-3 z-50 origin-bottom overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] transition-all duration-300 lg:hidden",
          categoriesOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-8 scale-95 opacity-0",
        ].join(" ")}
      >
        <div className="bg-[#111827] p-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-base font-black">Kategoriler</p>
              <p className="text-xs text-slate-400">Diğer panel modülleri</p>
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
          {moduleItems.map((item, index) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setCategoriesOpen(false)}
                className={[
                  "flex items-center gap-3 rounded-[20px] p-3 transition-all duration-300",
                  categoriesOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
                  active ? "bg-[#2463ff] text-white" : "bg-slate-50 text-slate-700",
                ].join(" ")}
                style={{ transitionDelay: `${index * 35}ms` }}
              >
                <span className={["flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", active ? "bg-white/18 text-white" : "bg-white text-slate-500"].join(" ")}>
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

      <nav className="fixed bottom-3 left-3 right-3 z-50 rounded-[28px] border border-slate-200 bg-white p-2 shadow-[0_20px_70px_rgba(15,23,42,0.20)] lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {mainItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setCategoriesOpen(false)}
                className={[
                  "flex min-w-0 flex-col items-center justify-center gap-1 rounded-[19px] px-1.5 py-2.5 text-[10px] font-black transition-all duration-200",
                  active ? "bg-[#2463ff] text-white shadow-lg shadow-blue-200" : "text-slate-500 hover:bg-slate-100",
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
              "flex min-w-0 flex-col items-center justify-center gap-1 rounded-[19px] px-1.5 py-2.5 text-[10px] font-black transition-all duration-200",
              categoriesOpen ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100",
            ].join(" ")}
          >
            <Icon name="menu" className="h-5 w-5" />
            <span className="max-w-full truncate">Kategoriler</span>
          </button>
        </div>
      </nav>

      {!gorkiOpen ? (
        <button
          type="button"
          onClick={() => setGorkiOpen(true)}
          className="fixed bottom-[98px] right-5 z-50 hidden w-[270px] items-center gap-3 rounded-[24px] border border-slate-200 bg-white p-3 text-left text-slate-950 shadow-[0_22px_70px_rgba(15,23,42,0.20)] transition hover:-translate-y-1 lg:flex"
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

      {!gorkiOpen ? (
        <button
          type="button"
          onClick={() => setGorkiOpen(true)}
          className="fixed bottom-[92px] right-4 z-50 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-slate-950 shadow-[0_18px_55px_rgba(15,23,42,0.32)] lg:hidden"
        >
          <Image src="/gorki-hero.png" alt="Gorki" fill className="object-contain object-bottom" />
        </button>
      ) : null}

      <div
        className={[
          "fixed z-[60] overflow-hidden border border-slate-200 bg-white text-slate-950 shadow-[0_28px_90px_rgba(15,23,42,0.28)] transition-all duration-300",
          "bottom-[92px] left-3 right-3 rounded-[28px] lg:bottom-6 lg:left-auto lg:right-6 lg:w-[400px]",
          gorkiOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-8 scale-95 opacity-0",
        ].join(" ")}
      >
        <div className="bg-[#111827] p-4 text-white">
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
                className="rounded-full bg-white/10 px-3 py-2 text-xs font-black text-slate-200 transition hover:bg-[#2463ff]"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[330px] space-y-3 overflow-y-auto bg-slate-50 p-4">
          {messages.map((message, index) => {
            const isUser = message.role === "user";

            return (
              <div key={`${message.role}-${index}`} className={["flex", isUser ? "justify-end" : "justify-start"].join(" ")}>
                <div
                  className={[
                    "max-w-[86%] rounded-[20px] px-4 py-3 text-sm leading-6",
                    isUser ? "bg-[#2463ff] text-white" : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-100",
                  ].join(" ")}
                >
                  {message.text}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 border-t border-slate-100 p-3">
          <input
            value={gorkiInput}
            onChange={(event) => setGorkiInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                sendGorkiMessage();
              }
            }}
            placeholder="Gorki’ye sor..."
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-[#2463ff]"
          />

          <button
            type="button"
            onClick={() => sendGorkiMessage()}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2463ff] text-white transition hover:bg-blue-700"
          >
            <Icon name="send" />
          </button>
        </div>
      </div>
    </div>
  );
}
