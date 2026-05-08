"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Member = {
  email: string;
  role_name: string | null;
  can_view_dashboard: boolean | null;
  can_manage_products: boolean | null;
  can_manage_stock: boolean | null;
  can_manage_sales: boolean | null;
  can_manage_orders: boolean | null;
  can_manage_shipments: boolean | null;
  can_manage_returns: boolean | null;
  can_manage_invoices: boolean | null;
  can_manage_customers: boolean | null;
  can_manage_integrations: boolean | null;
  can_manage_billing: boolean | null;
  can_manage_settings: boolean | null;
};

type Business = {
  id: string;
  name: string;
  owner_email: string | null;
  logo_url: string | null;
};

type NotificationItem = {
  id: string;
  title: string | null;
  message: string | null;
  type: string | null;
  is_read: boolean | null;
  created_at: string;
};

type MessageItem = {
  id: string;
  title: string | null;
  message: string | null;
  sender_name: string | null;
  is_read: boolean | null;
  created_at: string;
};

type NavItem = {
  href: string;
  label: string;
  sub: string;
  icon: string;
  permission?: keyof Member;
};

const operationItems: NavItem[] = [
  { href: "/app", label: "Dashboard", sub: "Genel bakış", icon: "dashboard", permission: "can_view_dashboard" },
  { href: "/app/sales", label: "Satışlar", sub: "Gelir takibi", icon: "sales", permission: "can_manage_sales" },
  { href: "/app/products", label: "Ürünler", sub: "Ürün & stok", icon: "products", permission: "can_manage_products" },
  { href: "/app/stock", label: "Stok", sub: "Depo hareketleri", icon: "stock", permission: "can_manage_stock" },
  { href: "/app/qr", label: "QR / Barkod", sub: "Etiket sistemi", icon: "qr", permission: "can_manage_products" },
];

const businessItems: NavItem[] = [
  { href: "/app/customers", label: "Müşteriler", sub: "Cari kayıtları", icon: "customers", permission: "can_manage_customers" },
  { href: "/app/invoices", label: "Faturalar", sub: "Tahsilat takibi", icon: "invoices", permission: "can_manage_invoices" },
  { href: "/app/orders", label: "Siparişler", sub: "Sipariş yönetimi", icon: "orders", permission: "can_manage_orders" },
  { href: "/app/shipments", label: "Kargo", sub: "Çıkış & teslimat", icon: "cargo", permission: "can_manage_shipments" },
  { href: "/app/returns", label: "İadeler", sub: "İade merkezi", icon: "returns", permission: "can_manage_returns" },
  { href: "/app/integrations", label: "Entegrasyonlar", sub: "Pazaryerleri", icon: "integrations", permission: "can_manage_integrations" },
];

const centerItems: NavItem[] = [
  { href: "/app/billing", label: "Abonelik", sub: "Plan & ödeme", icon: "billing", permission: "can_manage_billing" },
  { href: "/app/business-setup", label: "İşletme", sub: "Firma bilgileri", icon: "business", permission: "can_manage_settings" },
  { href: "/app/settings", label: "Ayarlar", sub: "Ekip & yetki", icon: "settings", permission: "can_manage_settings" },
  { href: "/app/profile", label: "Kullanıcı", sub: "Profil & çıkış", icon: "profile" },
  { href: "/app/downloads", label: "Mobil Uygulama", sub: "App Store / Play", icon: "downloads", permission: "can_view_dashboard" },
  { href: "/app/help", label: "Kullanım Rehberi", sub: "Nasıl kullanılır", icon: "help", permission: "can_view_dashboard" },
  { href: "/app/contact", label: "İletişim", sub: "Destek al", icon: "contact", permission: "can_view_dashboard" },
  { href: "/app/about", label: "Hakkımızda", sub: "Takipio", icon: "about", permission: "can_view_dashboard" },
];

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

function pageTitle(pathname: string) {
  const all = [...operationItems, ...businessItems, ...centerItems];
  return all.find((item) => item.href === pathname)?.label ?? "Dashboard";
}

function iconPath(icon: string) {
  const paths: Record<string, React.ReactNode> = {
    dashboard: (
      <>
        <path d="M4 13.5 12 6l8 7.5" />
        <path d="M6.5 12.5V20h11v-7.5" />
        <path d="M10 20v-5h4v5" />
      </>
    ),
    sales: (
      <>
        <path d="M12 3v18" />
        <path d="M17 7.5c-.7-1.6-2.2-2.5-4.3-2.5-2.4 0-4 1.2-4 3 0 4.6 8.8 2.1 8.8 7.3 0 2-1.7 3.4-4.6 3.4-2.3 0-4.1-1-5-2.8" />
      </>
    ),
    products: (
      <>
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="m4 7.5 8 4.5 8-4.5" />
        <path d="M12 12v9" />
      </>
    ),
    stock: (
      <>
        <path d="M7 3v18" />
        <path d="M17 3v18" />
        <path d="m4 7 3-3 3 3" />
        <path d="m14 17 3 3 3-3" />
      </>
    ),
    qr: (
      <>
        <path d="M4 4h6v6H4z" />
        <path d="M14 4h6v6h-6z" />
        <path d="M4 14h6v6H4z" />
        <path d="M14 14h2v2h-2z" />
        <path d="M18 14h2v6h-4v-2h2z" />
      </>
    ),
    customers: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.8" />
        <path d="M16 3.2a4 4 0 0 1 0 7.6" />
      </>
    ),
    invoices: (
      <>
        <path d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2-3-2V5a2 2 0 0 1 2-2Z" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </>
    ),
    orders: (
      <>
        <path d="M5 7h14" />
        <path d="M5 12h14" />
        <path d="M5 17h14" />
        <path d="M3 5h18v14H3z" />
      </>
    ),
    cargo: (
      <>
        <path d="M3 7h11v10H3z" />
        <path d="M14 10h4l3 3v4h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </>
    ),
    returns: (
      <>
        <path d="M9 14 4 9l5-5" />
        <path d="M4 9h11a5 5 0 1 1 0 10H8" />
      </>
    ),
    integrations: (
      <>
        <path d="M7 7h.01" />
        <path d="M17 7h.01" />
        <path d="M7 17h.01" />
        <path d="M17 17h.01" />
        <path d="M8 8l8 8" />
        <path d="M16 8l-8 8" />
      </>
    ),
    billing: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M3 10h18" />
        <path d="M7 15h4" />
      </>
    ),
    business: (
      <>
        <path d="M4 21V5a2 2 0 0 1 2-2h8v18" />
        <path d="M14 8h4a2 2 0 0 1 2 2v11" />
        <path d="M8 7h2" />
        <path d="M8 11h2" />
        <path d="M8 15h2" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3h.1A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6.9h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    downloads: (
      <>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.5 9a2.8 2.8 0 0 1 5 1.8c0 2-2.5 2.3-2.5 4.2" />
        <path d="M12 18h.01" />
      </>
    ),
    contact: (
      <>
        <path d="M4 4h16v16H4z" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    about: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </>
    ),
    moon: (
      <>
        <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 1 0 9.8 9.8Z" />
      </>
    ),
  };

  return paths[icon] ?? paths.dashboard;
}

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className || "h-4 w-4"} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {iconPath(name)}
    </svg>
  );
}

function SmartImage({
  sources,
  alt,
  className,
  fallback,
}: {
  sources: Array<string | null | undefined>;
  alt: string;
  className: string;
  fallback: React.ReactNode;
}) {
  const validSources = sources.filter(Boolean) as string[];
  const [index, setIndex] = useState(0);

  if (validSources.length === 0 || index >= validSources.length) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={validSources[index]}
      alt={alt}
      className={className}
      onError={() => setIndex((current) => current + 1)}
    />
  );
}

function LogoBox({ src, name, size = "md" }: { src?: string | null; name?: string | null; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-12 w-12 rounded-2xl" : size === "sm" ? "h-9 w-9 rounded-xl" : "h-11 w-11 rounded-2xl";

  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden bg-white ring-1 ring-blue-400/20 ${sizeClass}`}>
      <SmartImage
        sources={[src, "/takipio-logo.png"]}
        alt={name || "Takipio"}
        className="h-full w-full object-contain p-1"
        fallback={<span className="text-base font-black text-blue-600">{(name || "T").slice(0, 1).toUpperCase()}</span>}
      />
    </div>
  );
}

function GorkiImage() {
  return (
    <SmartImage
      sources={["/gorki-hero.png"]}
      alt="Gorki"
      className="h-full w-full object-cover"
      fallback={<span className="text-xl font-black text-white">G</span>}
    />
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [gorkiOpen, setGorkiOpen] = useState(false);
  const [gorkiInput, setGorkiInput] = useState("");
  const [gorkiMessages, setGorkiMessages] = useState([
    { role: "assistant", text: "Merhaba, ben Gorki. Bugün panelde sana nasıl yardımcı olabilirim?" },
  ]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const isOwner = normalizeEmail(userEmail) === normalizeEmail(business?.owner_email);

  async function loadContext() {
    setLoading(true);

    const { data } = await supabase.auth.getUser();
    const email = normalizeEmail(data.user?.email);
    setUserEmail(email);

    if (!email) {
      setLoading(false);
      return;
    }

    const { data: memberData } = await supabase
      .from("business_members")
      .select("*")
      .eq("email", email)
      .eq("member_status", "active")
      .limit(1)
      .maybeSingle();

    if (memberData?.business_id) {
      setMember(memberData);

      const { data: businessData } = await supabase
        .from("businesses")
        .select("id, name, owner_email, logo_url")
        .eq("id", memberData.business_id)
        .single();

      setBusiness(businessData ?? null);

      const [notificationResult, messageResult] = await Promise.all([
        supabase
          .from("app_notifications")
          .select("id, title, message, type, is_read, created_at")
          .eq("business_id", memberData.business_id)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("app_messages")
          .select("id, title, message, sender_name, is_read, created_at")
          .eq("business_id", memberData.business_id)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      setNotifications(notificationResult.data ?? []);
      setMessages(messageResult.data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadContext();

    const savedTheme = window.localStorage.getItem("takipio-theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  function canSee(item: NavItem) {
    if (!item.permission) return true;
    if (isOwner) return true;
    if (!member) return true;
    return Boolean(member[item.permission]);
  }

  const visibleOperationItems = useMemo(() => operationItems.filter(canSee), [member, isOwner]);
  const visibleBusinessItems = useMemo(() => businessItems.filter(canSee), [member, isOwner]);
  const visibleCenterItems = useMemo(() => centerItems.filter(canSee), [member, isOwner]);

  const unreadNotifications = notifications.filter((item) => !item.is_read).length;
  const unreadMessages = messages.filter((item) => !item.is_read).length;

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("takipio-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim().toLowerCase();

    if (!query) return;

    if (query.includes("ürün") || query.includes("urun") || query.includes("stok")) router.push("/app/products");
    else if (query.includes("satış") || query.includes("satis")) router.push("/app/sales");
    else if (query.includes("müşteri") || query.includes("musteri")) router.push("/app/customers");
    else if (query.includes("fatura")) router.push("/app/invoices");
    else if (query.includes("qr") || query.includes("barkod")) router.push("/app/qr");
    else if (query.includes("sipariş") || query.includes("siparis")) router.push("/app/orders");
    else router.push("/app");
  }

  function sendGorkiMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const clean = gorkiInput.trim();
    if (!clean) return;

    setGorkiMessages((current) => [
      ...current,
      { role: "user", text: clean },
      {
        role: "assistant",
        text: "Şimdilik demo sohbet ekranındayım. Bir sonraki AI paketinde sipariş, stok, iade ve fatura verilerine bakarak canlı cevap vereceğim.",
      },
    ]);
    setGorkiInput("");
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function clearNotification(id: string) {
    if (!business) return;

    setNotifications((current) => current.filter((item) => item.id !== id));
    await supabase.from("app_notifications").delete().eq("business_id", business.id).eq("id", id);
  }

  async function clearMessage(id: string) {
    if (!business) return;

    setMessages((current) => current.filter((item) => item.id !== id));
    await supabase.from("app_messages").delete().eq("business_id", business.id).eq("id", id);
  }

  const mobilePrimaryItems = [
    visibleOperationItems.find((item) => item.href === "/app"),
    visibleOperationItems.find((item) => item.href === "/app/products"),
    visibleBusinessItems.find((item) => item.href === "/app/orders"),
    visibleBusinessItems.find((item) => item.href === "/app/shipments"),
  ].filter(Boolean) as NavItem[];

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.20),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.12),transparent_35%)]" />

      <aside className={`fixed inset-y-0 left-0 z-50 w-[236px] border-r border-white/10 bg-[#0b1220]/95 p-3 backdrop-blur-xl transition lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-4 flex items-center justify-center rounded-[20px] bg-white/5 p-4 ring-1 ring-white/10">
          <Link href="/app" className="flex items-center justify-center">
            <div className="h-14 w-36">
              <SmartImage
                sources={["/takipio-logo.png"]}
                alt="Takipio"
                className="h-full w-full object-contain"
                fallback={<span className="text-lg font-black text-blue-300">Takipio</span>}
              />
            </div>
          </Link>

          <button onClick={() => setSidebarOpen(false)} className="absolute right-4 rounded-xl bg-white/10 px-2 py-1 text-xs font-black lg:hidden">×</button>
        </div>

        <div className="custom-scrollbar h-[calc(100vh-92px)] overflow-y-auto pr-1">
          <NavGroup title="Operasyon" items={visibleOperationItems} pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
          <NavGroup title="İşletme" items={visibleBusinessItems} pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
          <NavGroup title="Merkez" items={visibleCenterItems} pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
        </div>
      </aside>

      <div className="lg:pl-[236px]">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07111f]/85 px-3 py-3 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="hidden rounded-2xl bg-white/10 px-3 py-2 text-sm font-black lg:hidden">
                ☰
              </button>

              <div className="hidden min-w-[120px] sm:block">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">
                  {loading ? "Yükleniyor" : business?.name || "Takipio"}
                </p>
                <h1 className="truncate text-base font-black tracking-[-0.03em] sm:text-xl">{pageTitle(pathname)}</h1>
              </div>

              <form onSubmit={submitSearch} className="relative hidden max-w-[560px] flex-1 lg:block">
                <Icon name="help" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Ürün, satış, müşteri, fatura veya QR ara..."
                  className="h-12 w-full rounded-[18px] border border-white/10 bg-white/8 pl-11 pr-4 text-sm font-bold text-slate-200 outline-none ring-0 transition placeholder:text-slate-500 focus:border-blue-400/40 focus:bg-white/10"
                />
              </form>
            </div>

            <div className="relative flex items-center gap-2">
              <div className="hidden items-center gap-3 rounded-2xl bg-white/8 px-3 py-2 ring-1 ring-white/10 xl:flex">
                <LogoBox src={business?.logo_url} name={business?.name || "Takipio"} size="sm" />
                <div className="min-w-0">
                  <p className="max-w-[150px] truncate text-xs font-black">{business?.name || "Takipio"}</p>
                  <p className="text-[10px] text-slate-500">{member?.role_name || "Panel"}</p>
                </div>
              </div>

              <TopIconButton
                label="Bildirim"
                icon="invoices"
                count={unreadNotifications}
                onClick={() => {
                  setNotificationsOpen((value) => !value);
                  setMessagesOpen(false);
                }}
              />

              <TopIconButton
                label="Mesaj"
                icon="contact"
                count={unreadMessages}
                onClick={() => {
                  setMessagesOpen((value) => !value);
                  setNotificationsOpen(false);
                }}
              />

              <button
                onClick={toggleTheme}
                title={theme === "dark" ? "Light mode" : "Dark mode"}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-slate-200 ring-1 ring-white/10 transition hover:bg-white/15"
              >
                <Icon name={theme === "dark" ? "sun" : "moon"} className="h-4 w-4" />
              </button>

              <button onClick={signOut} className="hidden rounded-2xl bg-red-500/15 px-3 py-2 text-xs font-black text-red-300 ring-1 ring-red-400/20 sm:block">
                Çıkış
              </button>

              {notificationsOpen ? (
                <FloatingPanel title="Bildirimler" emptyText="Bildirim yok">
                  {notifications.map((item) => (
                    <PanelItem key={item.id} title={item.title || "Bildirim"} text={item.message || "-"} icon="invoices" onDelete={() => clearNotification(item.id)} />
                  ))}
                </FloatingPanel>
              ) : null}

              {messagesOpen ? (
                <FloatingPanel title="Mesaj Kutusu" emptyText="Mesaj yok">
                  {messages.map((item) => (
                    <PanelItem key={item.id} title={item.title || "Mesaj"} text={item.message || "-"} icon="contact" sub={item.sender_name || "Takipio"} onDelete={() => clearMessage(item.id)} />
                  ))}
                </FloatingPanel>
              ) : null}
            </div>
          </div>
        </header>

        <main className="relative z-10 px-3 py-4 pb-28 sm:px-4 lg:px-5 lg:pb-6">
          {children}
        </main>

        <nav className="fixed inset-x-3 bottom-3 z-50 rounded-[26px] border border-white/10 bg-[#0b1220]/95 p-2 shadow-2xl shadow-black/30 backdrop-blur-xl lg:hidden">
          <div className="grid grid-cols-5 gap-1">
            {mobilePrimaryItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-2xl px-2 py-2 text-center text-[10px] font-black transition ${active ? "bg-blue-600 text-white" : "text-slate-400"}`}
                >
                  <Icon name={item.icon} className="mx-auto h-4 w-4" />
                  <span className="mt-1 block truncate">{item.label}</span>
                </Link>
              );
            })}

            <button
              onClick={() => setMobileMenuOpen((value) => !value)}
              className={`rounded-2xl px-2 py-2 text-center text-[10px] font-black transition ${mobileMenuOpen ? "bg-blue-600 text-white" : "text-slate-400"}`}
            >
              <Icon name="settings" className="mx-auto h-4 w-4" />
              <span className="mt-1 block truncate">Menü</span>
            </button>
          </div>
        </nav>

        {mobileMenuOpen ? (
          <div className="fixed inset-x-3 bottom-[92px] z-50 rounded-[26px] border border-white/10 bg-[#0b1220]/95 p-3 shadow-2xl backdrop-blur-xl lg:hidden">
            <div className="grid grid-cols-2 gap-2">
              {[...visibleOperationItems, ...visibleBusinessItems, ...visibleCenterItems].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-3 text-xs font-black text-slate-300"
                >
                  <Icon name={item.icon} className="h-4 w-4 text-blue-300" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="fixed bottom-24 right-4 z-[80] lg:bottom-6">
        {gorkiOpen ? (
          <div className="mb-3 w-[340px] overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1220]/95 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-2xl bg-blue-600">
                  <GorkiImage />
                </div>
                <div>
                  <p className="text-sm font-black">Gorki AI</p>
                  <p className="mt-1 text-xs text-slate-400">Canlı panel asistanı</p>
                </div>
              </div>
              <button onClick={() => setGorkiOpen(false)} className="rounded-xl bg-white/10 px-3 py-1 text-sm font-black">×</button>
            </div>

            <div className="max-h-[320px] space-y-3 overflow-y-auto p-4">
              {gorkiMessages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-5 ${
                    message.role === "user" ? "bg-blue-600 text-white" : "bg-white/10 text-slate-200"
                  }`}>
                    {message.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 p-3">
              <div className="mb-3 grid grid-cols-2 gap-2">
                {["Bugünkü özeti göster", "Kritik stok var mı?", "Bekleyen ödemeler", "Kargo bekleyenler"].map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => {
                      setGorkiMessages((current) => [
                        ...current,
                        { role: "user", text: question },
                        {
                          role: "assistant",
                          text: "Bu hazır soru için canlı veri cevabını AI bağlantı paketinde aktif edeceğiz. Şimdilik bu sohbet ekranı arayüz olarak hazır.",
                        },
                      ]);
                    }}
                    className="rounded-2xl bg-white/10 px-3 py-2 text-left text-[11px] font-black text-slate-200 transition hover:bg-white/15"
                  >
                    {question}
                  </button>
                ))}
              </div>

              <form onSubmit={sendGorkiMessage} className="flex gap-2">
                <input
                  value={gorkiInput}
                  onChange={(event) => setGorkiInput(event.target.value)}
                  placeholder="Gorki'ye yaz..."
                  className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#07111f] px-3 py-2 text-xs font-bold text-white outline-none placeholder:text-slate-500"
                />
                <button className="rounded-2xl bg-blue-600 px-4 py-2 text-xs font-black text-white">Gönder</button>
              </form>
            </div>
          </div>
        ) : null}

        <button onClick={() => setGorkiOpen((value) => !value)} className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[24px] border border-blue-400/30 bg-blue-600 shadow-2xl shadow-blue-950/40 transition hover:-translate-y-1">
          <GorkiImage />
        </button>
      </div>

      {sidebarOpen ? <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden" /> : null}
    </div>
  );
}

function TopIconButton({ label, icon, count, onClick }: { label: string; icon: string; count: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="relative flex h-10 items-center gap-2 rounded-2xl bg-white/10 px-3 text-xs font-black text-slate-200 ring-1 ring-white/10 transition hover:bg-white/15">
      <Icon name={icon} className="h-4 w-4 text-blue-300" />
      <span className="hidden sm:inline">{label}</span>
      {count ? <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] text-white">{count}</span> : null}
    </button>
  );
}

function NavGroup({ title, items, pathname, onNavigate }: { title: string; items: NavItem[]; pathname: string; onNavigate: () => void }) {
  if (items.length === 0) return null;

  return (
    <div className="mb-4">
      <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <div className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-black transition ${
                active ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30" : "text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${active ? "bg-white/20" : "bg-white/5 group-hover:bg-white/10"}`}>
                <Icon name={item.icon} className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate">{item.label}</span>
                <span className={`block truncate text-[10px] font-bold ${active ? "text-blue-100" : "text-slate-600 group-hover:text-slate-400"}`}>{item.sub}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function FloatingPanel({ title, emptyText, children }: { title: string; emptyText: string; children: React.ReactNode }) {
  const list = Array.isArray(children) ? children.filter(Boolean) : children;

  return (
    <div className="absolute right-0 top-12 z-[90] w-[340px] rounded-[26px] border border-white/10 bg-[#111a2e]/95 p-4 shadow-2xl backdrop-blur-xl">
      <h3 className="mb-3 text-sm font-black">{title}</h3>
      <div className="max-h-[360px] space-y-2 overflow-y-auto">
        {Array.isArray(list) && list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">{emptyText}</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function PanelItem({ title, text, sub, icon, onDelete }: { title: string; text: string; sub?: string; icon: string; onDelete: () => void }) {
  return (
    <div className="rounded-2xl bg-[#0b1220] p-3 ring-1 ring-white/10">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
          <Icon name={icon} className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black">{title}</p>
          {sub ? <p className="mt-0.5 text-[10px] text-slate-500">{sub}</p> : null}
          <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
        </div>
        <button onClick={onDelete} className="rounded-lg bg-red-500/15 px-2 py-1 text-[10px] font-black text-red-300">Sil</button>
      </div>
    </div>
  );
}
