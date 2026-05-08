"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  | "profile"
  | "menu"
  | "search"
  | "theme"
  | "logout"
  | "send"
  | "trash";

type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  icon: IconName;
};

type GorkiMessage = {
  role: "gorki" | "user";
  text: string;
};

type NotificationItem = {
  id: string;
  title: string;
  description: string | null;
  type: string | null;
  target_url: string | null;
  is_read: boolean | null;
  created_at: string;
};

type MessageItem = {
  id: string;
  sender: string | null;
  title: string;
  body: string | null;
  is_read: boolean | null;
  created_at: string;
};

const mainItems: NavItem[] = [
  { href: "/app", label: "Dashboard", shortLabel: "Panel", icon: "dashboard" },
  { href: "/app/orders", label: "Siparişler", shortLabel: "Sipariş", icon: "invoices" },
  { href: "/app/products", label: "Ürünler", shortLabel: "Ürün", icon: "products" },
  { href: "/app/stock", label: "Stok", shortLabel: "Stok", icon: "stock" },
  { href: "/app/qr", label: "QR", shortLabel: "QR", icon: "qr" },
];

const businessItems: NavItem[] = [
  { href: "/app/sales", label: "Satışlar", icon: "sales" },
  { href: "/app/shipments", label: "Kargo", icon: "stock" },
  { href: "/app/returns", label: "İadeler", icon: "invoices" },
  { href: "/app/customers", label: "Müşteriler", icon: "customers" },
  { href: "/app/invoices", label: "Faturalar", icon: "invoices" },
  { href: "/app/integrations", label: "Entegrasyonlar", icon: "integrations" },
  { href: "/app/gorki-ai", label: "Gorki AI", icon: "gorki" },
];

const systemItems: NavItem[] = [
  { href: "/app/help", label: "Kullanım Rehberi", icon: "about" },
  { href: "/app/billing", label: "Abonelik", icon: "invoices" },
  { href: "/app/downloads", label: "Mobil Uygulama", icon: "downloads" },
  { href: "/app/profile", label: "Kullanıcı", icon: "profile" },
  { href: "/app/settings", label: "Ayarlar", icon: "settings" },
  { href: "/app/contact", label: "İletişim", icon: "contact" },
  { href: "/app/about", label: "Hakkımızda", icon: "about" },
];

const initialMessages: GorkiMessage[] = [
  {
    role: "gorki",
    text: "Buradayım. Panelde gezerken sipariş, kargo, iade, stok, satış veya yetki tarafında hızlıca yardım edebilirim.",
  },
];

function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const common = "h-4 w-4 " + className;

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
        <path d="M4 7H20M6 7V20H18V7M9 11H15M9 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 7V4H16V7" stroke="currentColor" strokeWidth="2" />
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

  if (name === "customers") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M16 19C16 16.8 14.2 15 12 15H8C5.8 15 4 16.8 4 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 11C12.2 11 14 9.2 14 7C14 4.8 12.2 3 10 3C7.8 3 6 4.8 6 7C6 9.2 7.8 11 10 11Z" stroke="currentColor" strokeWidth="2" />
        <path d="M18 8V14M15 11H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "invoices") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M7 3H17L20 6V21L17 19L14.5 21L12 19L9.5 21L7 19L4 21V6C4 4.3 5.3 3 7 3Z" stroke="currentColor" strokeWidth="2" />
        <path d="M8 9H16M8 13H16M8 17H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "integrations") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M8 12H16M7 7L5.5 5.5C4.7 4.7 4.7 3.3 5.5 2.5C6.3 1.7 7.7 1.7 8.5 2.5L10 4M17 17L18.5 18.5C19.3 19.3 19.3 20.7 18.5 21.5C17.7 22.3 16.3 22.3 15.5 21.5L14 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

  if (name === "inbox") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M4 5H20V16H15L12 19L9 16H4V5Z" stroke="currentColor" strokeWidth="2" />
        <path d="M8 9H16M8 12H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "notifications") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M18 10C18 6.7 15.3 4 12 4S6 6.7 6 10V15L4 18H20L18 15V10Z" stroke="currentColor" strokeWidth="2" />
        <path d="M10 21H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "downloads") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M12 4V15M12 15L8 11M12 15L16 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 19H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "profile") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M12 12C14.2 12 16 10.2 16 8C16 5.8 14.2 4 12 4C9.8 4 8 5.8 8 8C8 10.2 9.8 12 12 12Z" stroke="currentColor" strokeWidth="2" />
        <path d="M5 20C5.8 16.5 8.5 15 12 15C15.5 15 18.2 16.5 19 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "settings") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M12 15.5C13.9 15.5 15.5 13.9 15.5 12C15.5 10.1 13.9 8.5 12 8.5C10.1 8.5 8.5 10.1 8.5 12C8.5 13.9 10.1 15.5 12 15.5Z" stroke="currentColor" strokeWidth="2" />
        <path d="M19 12C19 11.6 19 11.2 18.9 10.8L21 9.2L19 5.8L16.5 6.8C15.9 6.3 15.3 5.9 14.6 5.6L14.2 3H9.8L9.4 5.6C8.7 5.9 8.1 6.3 7.5 6.8L5 5.8L3 9.2L5.1 10.8C5 11.2 5 11.6 5 12C5 12.4 5 12.8 5.1 13.2L3 14.8L5 18.2L7.5 17.2C8.1 17.7 8.7 18.1 9.4 18.4L9.8 21H14.2L14.6 18.4C15.3 18.1 15.9 17.7 16.5 17.2L19 18.2L21 14.8L18.9 13.2C19 12.8 19 12.4 19 12Z" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "contact") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M4 5H20V19H4V5Z" stroke="currentColor" strokeWidth="2" />
        <path d="M4 7L12 13L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "about") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M12 21C17 21 21 17 21 12S17 3 12 3S3 7 3 12S7 21 12 21Z" stroke="currentColor" strokeWidth="2" />
        <path d="M12 11V16M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M11 19C15.4 19 19 15.4 19 11S15.4 3 11 3S3 6.6 3 11S6.6 19 11 19Z" stroke="currentColor" strokeWidth="2" />
        <path d="M21 21L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "theme") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M21 14.5C19.7 15.3 18.1 15.7 16.5 15.7C11.9 15.7 8.3 12.1 8.3 7.5C8.3 5.9 8.7 4.3 9.5 3C5.8 4.1 3 7.6 3 11.7C3 16.7 7.1 20.8 12.1 20.8C16.2 20.8 19.7 18 21 14.5Z" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "logout") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M10 6H6V18H10M14 8L18 12L14 16M18 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "send") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M21 3L10.5 13.5M21 3L14.5 21L10.5 13.5M21 3L3 9.5L10.5 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "trash") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common}>
        <path d="M4 7H20M9 7V4H15V7M7 7L8 20H16L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={common}>
      <path d="M5 7H19M5 12H19M5 17H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname.startsWith(href);
}

function getPageTitle(pathname: string) {
  const all = [...mainItems, ...businessItems, ...systemItems];
  return all.find((item) => isActive(pathname, item.href))?.label ?? "Dashboard";
}

function createGorkiReply(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes("sipariş")) return "Siparişler sayfasında yeni siparişi oluşturabilir, hazırlanıyor → paketlendi → kargoya verildi → teslim edildi akışını yönetebilirsin.";
  if (lower.includes("kargo")) return "Kargo sayfasında kargoya verilmeyen siparişleri görür, kargo firması ve takip numarası ekleyebilirsin.";
  if (lower.includes("iade")) return "İadeler sayfasında iade talebi, inceleme, onay, red ve para iadesi akışını takip edebilirsin.";
  if (lower.includes("stok")) return "Stok sayfasında tüm giriş/çıkışları görebilir, ürün sayfasından stok güncelleyebilirsin.";
  if (lower.includes("ödeme") || lower.includes("tahsilat")) return "Bekleyen ödemeler Satışlar ve Dashboard özetlerinde görünür. Ödeme durumunu satış kartından takip edebilirsin.";
  if (lower.includes("yetki") || lower.includes("rol")) return "Ayarlar > Ekip ve Yetkiler alanından e-posta ekleyip hangi panellere erişeceğini seçebilirsin.";
  return "Bunu not aldım. Paneldeki ilgili modüle göre sana yönlendirme yapabilirim.";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [darkMode, setDarkMode] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [gorkiOpen, setGorkiOpen] = useState(false);
  const [gorkiInput, setGorkiInput] = useState("");
  const [messages, setMessages] = useState<GorkiMessage[]>(initialMessages);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [inboxMessages, setInboxMessages] = useState<MessageItem[]>([]);

  const surface = darkMode ? "bg-[#0b1220] text-white" : "bg-[#f4f7fb] text-slate-950";
  const panel = darkMode ? "bg-[#111a2e] border-white/10 text-white" : "bg-white border-slate-200 text-slate-950";
  const soft = darkMode ? "bg-white/8 hover:bg-white/12" : "bg-slate-100 hover:bg-slate-200";

  const unreadCount = notifications.filter((item) => !item.is_read).length;
  const unreadInboxCount = inboxMessages.filter((item) => !item.is_read).length;

  useEffect(() => {
    fetchNotifications();
    fetchInboxMessages();
  }, []);

  async function fetchNotifications() {
    const { data } = await supabase
      .from("app_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8);

    setNotifications(data ?? []);
  }

  async function fetchInboxMessages() {
    const { data } = await supabase
      .from("app_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8);

    setInboxMessages(data ?? []);
  }

  async function markNotificationRead(id: string) {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, is_read: true } : item))
    );

    await supabase.from("app_notifications").update({ is_read: true }).eq("id", id);
  }

  async function deleteNotification(id: string) {
    setNotifications((current) => current.filter((item) => item.id !== id));
    await supabase.from("app_notifications").delete().eq("id", id);
  }

  async function markInboxRead(id: string) {
    setInboxMessages((current) =>
      current.map((item) => (item.id === id ? { ...item, is_read: true } : item))
    );

    await supabase.from("app_messages").update({ is_read: true }).eq("id", id);
  }

  async function deleteInboxMessage(id: string) {
    setInboxMessages((current) => current.filter((item) => item.id !== id));
    await supabase.from("app_messages").delete().eq("id", id);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function sendGorkiMessage(text?: string) {
    const clean = (text ?? gorkiInput).trim();
    if (!clean) return;

    setMessages((current) => [
      ...current,
      { role: "user", text: clean },
      { role: "gorki", text: createGorkiReply(clean) },
    ]);
    setGorkiInput("");
    setGorkiOpen(true);
  }

  const contextText = useMemo(() => getPageTitle(pathname), [pathname]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${surface}`}>
      <div className="flex min-h-screen">
        <aside className="hidden w-[218px] shrink-0 border-r border-white/10 bg-[#0b1220] p-2 text-white lg:block">
          <div className="flex h-full flex-col overflow-hidden rounded-[20px] border border-white/10 bg-[#111a2e]">
            <Link href="/app" className="m-2 flex items-center justify-center rounded-[18px] bg-[#07101f] p-2.5 transition hover:scale-[1.02]">
              <div className="relative h-12 w-28">
                <Image src="/takipio-logo.png" alt="Takipio" fill className="object-contain" priority />
              </div>
            </Link>

            <nav className="flex-1 overflow-y-auto px-2 pb-3">
              <NavGroup title="Kontrol" items={mainItems} pathname={pathname} />
              <NavGroup title="Operasyon" items={businessItems} pathname={pathname} />
              <NavGroup title="Merkez" items={systemItems} pathname={pathname} />
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          <header className={`sticky top-0 z-40 border-b backdrop-blur-2xl ${darkMode ? "border-white/10 bg-[#0b1220]/92" : "border-slate-200 bg-white/92"}`}>
            <div className="flex h-[60px] items-center gap-2 px-3 lg:px-4">
              <Link href="/app" className="lg:hidden">
                <div className={`relative h-10 w-24 rounded-2xl ${darkMode ? "bg-white/5" : "bg-white"} p-1.5`}>
                  <Image src="/takipio-logo.png" alt="Takipio" fill className="object-contain p-1" />
                </div>
              </Link>

              <div className="hidden min-w-[130px] lg:block">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Aktif Sayfa</p>
                <h1 className="truncate text-lg font-black">{getPageTitle(pathname)}</h1>
              </div>

              <div className={`flex h-10 min-w-0 flex-1 items-center gap-2 rounded-2xl px-3 ring-1 ${darkMode ? "bg-white/8 ring-white/10" : "bg-slate-100 ring-slate-200"}`}>
                <Icon name="search" />
                <input
                  placeholder="Ürün, sipariş, müşteri, fatura veya QR ara..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setInboxOpen((value) => !value);
                    setNotificationOpen(false);
                  }}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-2xl ${soft}`}
                >
                  <Icon name="inbox" />
                  {unreadInboxCount > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-black text-white">
                      {unreadInboxCount}
                    </span>
                  ) : null}
                </button>

                {inboxOpen ? (
                  <InboxPopover
                    panel={panel}
                    messages={inboxMessages}
                    onRead={markInboxRead}
                    onDelete={deleteInboxMessage}
                    onClose={() => setInboxOpen(false)}
                  />
                ) : null}
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setNotificationOpen((value) => !value);
                    setInboxOpen(false);
                  }}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-2xl ${soft}`}
                >
                  <Icon name="notifications" />
                  {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                      {unreadCount}
                    </span>
                  ) : null}
                </button>

                {notificationOpen ? (
                  <NotificationsPopover
                    panel={panel}
                    notifications={notifications}
                    onRead={markNotificationRead}
                    onDelete={deleteNotification}
                    onClose={() => setNotificationOpen(false)}
                  />
                ) : null}
              </div>

              <button onClick={() => setDarkMode((value) => !value)} className={`flex h-10 w-10 items-center justify-center rounded-2xl ${soft}`}>
                <Icon name="theme" />
              </button>

              <div className="relative">
                <button onClick={() => setProfileOpen((value) => !value)} className={`flex h-10 items-center gap-2 rounded-2xl px-2 ${soft}`}>
                  <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400" />
                  <div className="hidden text-left leading-none sm:block">
                    <p className="text-xs font-black">Burak</p>
                    <p className="mt-1 text-[10px] text-slate-500">Sahip</p>
                  </div>
                </button>

                {profileOpen ? (
                  <div className={`absolute right-0 top-12 z-50 w-56 rounded-2xl border p-2 shadow-xl ${panel}`}>
                    <Link href="/app/profile" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold hover:bg-blue-500/10">
                      <Icon name="profile" /> Kullanıcı Profili
                    </Link>
                    <Link href="/app/settings" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold hover:bg-blue-500/10">
                      <Icon name="settings" /> Yetkiler & Ayarlar
                    </Link>
                    <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-red-400 hover:bg-red-500/10">
                      <Icon name="logout" /> Çıkış Yap
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <div className="p-3 lg:p-4">{children}</div>
        </main>
      </div>

      {menuOpen ? (
        <button className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)} />
      ) : null}

      <div className={`fixed bottom-[82px] left-3 right-3 z-50 max-h-[58vh] overflow-y-auto rounded-[24px] border p-3 shadow-2xl transition lg:hidden ${menuOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"} ${panel}`}>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-black">Tüm Menüler</p>
          <button onClick={() => setMenuOpen(false)} className={`rounded-xl px-3 py-1 font-black ${soft}`}>×</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[...businessItems, ...systemItems].map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={`flex items-center gap-2 rounded-2xl p-3 text-sm font-black transition ${isActive(pathname, item.href) ? "bg-blue-600 text-white" : darkMode ? "bg-white/8" : "bg-slate-100"}`}>
              <Icon name={item.icon} /> {item.label}
            </Link>
          ))}
        </div>
      </div>

      <nav className={`fixed bottom-3 left-3 right-3 z-50 rounded-[24px] border p-1.5 shadow-2xl lg:hidden ${panel}`}>
        <div className="grid grid-cols-6 gap-1">
          {mainItems.slice(0, 5).map((item) => (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center gap-1 rounded-[18px] px-1 py-2 text-[9px] font-black transition ${isActive(pathname, item.href) ? "bg-blue-600 text-white" : "text-slate-400"}`}>
              <Icon name={item.icon} />
              <span>{item.shortLabel}</span>
            </Link>
          ))}
          <button onClick={() => setMenuOpen((value) => !value)} className={`flex flex-col items-center justify-center gap-1 rounded-[18px] px-1 py-2 text-[9px] font-black transition ${menuOpen ? "bg-blue-600 text-white" : "text-slate-400"}`}>
            <Icon name="menu" />
            <span>Menü</span>
          </button>
        </div>
      </nav>

      {!gorkiOpen ? (
        <button
          type="button"
          onClick={() => setGorkiOpen(true)}
          className="fixed bottom-[92px] right-4 z-50 flex h-16 w-16 items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-[#111827] shadow-[0_18px_55px_rgba(15,23,42,0.36)] transition hover:-translate-y-1"
        >
          <Image src="/gorki-hero.png" alt="Gorki" fill className="object-contain object-bottom" />
        </button>
      ) : null}

      <div className={`fixed z-[70] overflow-hidden border shadow-[0_28px_90px_rgba(15,23,42,0.32)] transition-all duration-300 bottom-[92px] left-3 right-3 rounded-[28px] lg:bottom-6 lg:left-auto lg:right-6 lg:w-[400px] ${panel} ${gorkiOpen ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-8 scale-95 opacity-0"}`}>
        <div className="bg-[#0b1220] p-4 text-white">
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
            <button onClick={() => setGorkiOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-lg font-black">×</button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {["Sipariş durumu", "Kargo bekleyen", "İade talebi"].map((question) => (
              <button key={question} onClick={() => sendGorkiMessage(question)} className="rounded-full bg-white/10 px-3 py-2 text-xs font-black text-slate-200 transition hover:bg-blue-600">
                {question}
              </button>
            ))}
          </div>
        </div>

        <div className={`max-h-[330px] space-y-3 overflow-y-auto p-4 ${darkMode ? "bg-white/[0.03]" : "bg-slate-50"}`}>
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            return (
              <div key={`${message.role}-${index}`} className={isUser ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[86%] rounded-[20px] px-4 py-3 text-sm leading-6 ${isUser ? "bg-blue-600 text-white" : darkMode ? "bg-white/8 text-slate-100" : "bg-white text-slate-700 shadow-sm"}`}>
                  {message.text}
                </div>
              </div>
            );
          })}
        </div>

        <div className={`flex gap-2 border-t p-3 ${darkMode ? "border-white/10" : "border-slate-100"}`}>
          <input
            value={gorkiInput}
            onChange={(event) => setGorkiInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") sendGorkiMessage();
            }}
            placeholder="Gorki’ye sor..."
            className={`min-w-0 flex-1 rounded-2xl border px-4 py-3 text-sm outline-none placeholder:text-slate-500 ${darkMode ? "border-white/10 bg-white/8 text-white" : "border-slate-200 bg-slate-50 text-slate-950"}`}
          />
          <button onClick={() => sendGorkiMessage()} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Icon name="send" />
          </button>
        </div>
      </div>
    </div>
  );
}

function NavGroup({ title, items, pathname }: { title: string; items: NavItem[]; pathname: string }) {
  return (
    <div className="mb-4">
      <p className="mb-1.5 px-2 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <div className="space-y-1">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className={`group flex items-center gap-2 rounded-[14px] px-2.5 py-2 text-[12px] font-black transition duration-200 hover:translate-x-0.5 ${isActive(pathname, item.href) ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-white/8 hover:text-white"}`}>
            <span className={`flex h-7 w-7 items-center justify-center rounded-xl ${isActive(pathname, item.href) ? "bg-white/15" : "bg-white/8"}`}>
              <Icon name={item.icon} />
            </span>
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function InboxPopover({
  panel,
  messages,
  onRead,
  onDelete,
  onClose,
}: {
  panel: string;
  messages: MessageItem[];
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className={`absolute right-0 top-12 z-50 w-[330px] rounded-2xl border p-3 shadow-2xl ${panel}`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-black">Mesaj Kutusu</p>
        <button onClick={onClose} className="text-sm font-black text-slate-500">×</button>
      </div>

      <div className="max-h-[360px] space-y-2 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="rounded-xl bg-white/5 p-4 text-center text-sm text-slate-500">Mesaj yok.</p>
        ) : (
          messages.map((item) => (
            <div key={item.id} className={`rounded-xl bg-white/5 p-3 ${item.is_read ? "opacity-55" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => onRead(item.id)} className="min-w-0 text-left">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-300">{item.sender || "Sistem"}</p>
                  <p className="mt-1 truncate text-sm font-black">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.body || "Mesaj içeriği yok"}</p>
                </button>
                <button onClick={() => onDelete(item.id)} className="text-red-400">
                  <Icon name="trash" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Link href="/app/inbox" onClick={onClose} className="mt-3 block rounded-xl bg-blue-600 px-3 py-2 text-center text-xs font-black text-white">
        Mesaj Yönetimine Git
      </Link>
    </div>
  );
}

function NotificationsPopover({
  panel,
  notifications,
  onRead,
  onDelete,
  onClose,
}: {
  panel: string;
  notifications: NotificationItem[];
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className={`absolute right-0 top-12 z-50 w-[360px] rounded-2xl border p-3 shadow-2xl ${panel}`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-black">Bildirimler</p>
        <button onClick={onClose} className="text-sm font-black text-slate-500">×</button>
      </div>

      <div className="max-h-[360px] space-y-2 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="rounded-xl bg-white/5 p-4 text-center text-sm text-slate-500">Bildirim yok.</p>
        ) : (
          notifications.map((item) => (
            <div key={item.id} className={`rounded-xl bg-white/5 p-3 ${item.is_read ? "opacity-55" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => onRead(item.id)} className="min-w-0 text-left">
                  <p className="truncate text-sm font-black">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.description || "Açıklama yok"}</p>
                </button>
                <button onClick={() => onDelete(item.id)} className="text-red-400">
                  <Icon name="trash" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Link href="/app/notifications" onClick={onClose} className="mt-3 block rounded-xl bg-blue-600 px-3 py-2 text-center text-xs font-black text-white">
        Bildirim Yönetimine Git
      </Link>
    </div>
  );
}
