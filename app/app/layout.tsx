"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
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

type NavItem = {
  href: string;
  label: string;
  icon: string;
  permission?: keyof Member;
};

const mainItems: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: "dashboard", permission: "can_view_dashboard" },
  { href: "/app/products", label: "Ürünler", icon: "products", permission: "can_manage_products" },
  { href: "/app/stock", label: "Stok", icon: "stock", permission: "can_manage_stock" },
  { href: "/app/sales", label: "Satışlar", icon: "sales", permission: "can_manage_sales" },
  { href: "/app/orders", label: "Siparişler", icon: "orders", permission: "can_manage_orders" },
  { href: "/app/shipments", label: "Kargo", icon: "cargo", permission: "can_manage_shipments" },
  { href: "/app/returns", label: "İadeler", icon: "returns", permission: "can_manage_returns" },
  { href: "/app/customers", label: "Müşteriler", icon: "customers", permission: "can_manage_customers" },
  { href: "/app/invoices", label: "Faturalar", icon: "invoices", permission: "can_manage_invoices" },
  { href: "/app/integrations", label: "Entegrasyonlar", icon: "integrations", permission: "can_manage_integrations" },
  { href: "/app/qr", label: "QR Etiket", icon: "qr", permission: "can_manage_products" },
];

const systemItems: NavItem[] = [
  { href: "/app/help", label: "Kullanım Rehberi", icon: "about", permission: "can_view_dashboard" },
  { href: "/app/billing", label: "Abonelik", icon: "billing", permission: "can_manage_billing" },
  { href: "/app/business-setup", label: "İşletme", icon: "business", permission: "can_manage_settings" },
  { href: "/app/downloads", label: "Mobil Uygulama", icon: "downloads", permission: "can_view_dashboard" },
  { href: "/app/profile", label: "Kullanıcı", icon: "profile" },
  { href: "/app/settings", label: "Ayarlar", icon: "settings", permission: "can_manage_settings" },
  { href: "/app/contact", label: "İletişim", icon: "contact", permission: "can_view_dashboard" },
  { href: "/app/about", label: "Hakkımızda", icon: "about", permission: "can_view_dashboard" },
];

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

function itemIcon(icon: string) {
  const map: Record<string, string> = {
    dashboard: "⌁",
    products: "▦",
    stock: "↕",
    sales: "₺",
    orders: "◈",
    cargo: "↗",
    returns: "↩",
    customers: "◉",
    invoices: "▤",
    integrations: "⌘",
    qr: "▣",
    about: "?",
    billing: "₺",
    business: "◆",
    downloads: "⇩",
    profile: "●",
    settings: "⚙",
    contact: "✉",
  };

  return map[icon] ?? "•";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [business, setBusiness] = useState<Business | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
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
    if (!member) return false;
    return Boolean(member[item.permission]);
  }

  const visibleMainItems = useMemo(() => mainItems.filter(canSee), [member, isOwner]);
  const visibleSystemItems = useMemo(() => systemItems.filter(canSee), [member, isOwner]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("takipio-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_35%)]" />

      <aside className={`fixed inset-y-0 left-0 z-50 w-[255px] border-r border-white/10 bg-[#0b1220]/95 p-3 backdrop-blur-xl transition lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-4 flex items-center justify-between rounded-[20px] bg-white/5 p-3 ring-1 ring-white/10">
          <Link href="/app" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-500/15 ring-1 ring-blue-400/20">
              {business?.logo_url ? (
                <img src={business.logo_url} alt="Logo" className="h-full w-full object-contain p-1" />
              ) : (
                <span className="text-lg font-black text-blue-300">{(business?.name || "T").slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{business?.name || "Takipio"}</p>
              <p className="truncate text-[10px] text-slate-500">{member?.role_name || "Panel"}</p>
            </div>
          </Link>

          <button onClick={() => setSidebarOpen(false)} className="rounded-xl bg-white/10 px-2 py-1 text-xs font-black lg:hidden">×</button>
        </div>

        <div className="custom-scrollbar h-[calc(100vh-104px)] overflow-y-auto pr-1">
          <NavGroup title="Operasyon" items={visibleMainItems} pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
          <NavGroup title="Sistem" items={visibleSystemItems} pathname={pathname} onNavigate={() => setSidebarOpen(false)} />

          <div className="mt-4 rounded-[20px] bg-white/5 p-3 ring-1 ring-white/10">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Hesap</p>
            <p className="mt-2 truncate text-xs font-bold text-slate-300">{userEmail || "Oturum yok"}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={toggleTheme} className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-slate-200">
                {theme === "dark" ? "Light" : "Dark"}
              </button>
              <button onClick={signOut} className="flex-1 rounded-xl bg-red-500/15 px-3 py-2 text-xs font-black text-red-300">
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[255px]">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07111f]/80 px-3 py-3 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black lg:hidden">☰</button>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">
                  {loading ? "Yükleniyor" : business?.name || "Takipio"}
                </p>
                <h1 className="text-base font-black tracking-[-0.03em] sm:text-xl">
                  {pathname === "/app" ? "Dashboard" : "İşletme Paneli"}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/app/profile" className="hidden rounded-2xl bg-white/10 px-3 py-2 text-xs font-black text-slate-200 sm:inline-flex">
                {member?.role_name || "Kullanıcı"}
              </Link>
              <button onClick={toggleTheme} className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-black text-slate-200">
                {theme === "dark" ? "☾" : "☀"}
              </button>
              <button onClick={signOut} className="rounded-2xl bg-red-500/15 px-3 py-2 text-xs font-black text-red-300">
                Çıkış
              </button>
            </div>
          </div>
        </header>

        <main className="relative z-10 px-3 py-4 sm:px-4 lg:px-5">
          {children}
        </main>

        <nav className="fixed inset-x-3 bottom-3 z-50 rounded-[24px] border border-white/10 bg-[#0b1220]/95 p-2 shadow-2xl backdrop-blur-xl lg:hidden">
          <div className="grid grid-cols-5 gap-1">
            {visibleMainItems.slice(0, 5).map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-2xl px-2 py-2 text-center text-[10px] font-black transition ${active ? "bg-blue-600 text-white" : "text-slate-400"}`}
                >
                  <span className="block text-base">{itemIcon(item.icon)}</span>
                  <span className="mt-0.5 block truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {sidebarOpen ? <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden" /> : null}
    </div>
  );
}

function NavGroup({ title, items, pathname, onNavigate }: { title: string; items: NavItem[]; pathname: string; onNavigate: () => void }) {
  if (items.length === 0) return null;

  return (
    <div className="mb-4">
      <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{title}</p>
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
              <span className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs ${active ? "bg-white/20" : "bg-white/5 group-hover:bg-white/10"}`}>
                {itemIcon(item.icon)}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
