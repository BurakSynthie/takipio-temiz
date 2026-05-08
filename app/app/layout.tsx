"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
  | "logout";

type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  icon: IconName;
};

const mainItems: NavItem[] = [
  { href: "/app", label: "Dashboard", shortLabel: "Panel", icon: "dashboard" },
  { href: "/app/sales", label: "Satışlar", shortLabel: "Satış", icon: "sales" },
  { href: "/app/products", label: "Ürünler", shortLabel: "Ürün", icon: "products" },
  { href: "/app/stock", label: "Stok", shortLabel: "Stok", icon: "stock" },
  { href: "/app/qr", label: "QR", shortLabel: "QR", icon: "qr" },
];

const businessItems: NavItem[] = [
  { href: "/app/customers", label: "Müşteriler", icon: "customers" },
  { href: "/app/invoices", label: "Faturalar", icon: "invoices" },
  { href: "/app/integrations", label: "Entegrasyonlar", icon: "integrations" },
  { href: "/app/gorki-ai", label: "Gorki AI", icon: "gorki" },
];

const systemItems: NavItem[] = [
  { href: "/app/inbox", label: "Inbox", icon: "inbox" },
  { href: "/app/notifications", label: "Bildirimler", icon: "notifications" },
  { href: "/app/downloads", label: "Mobil Uygulama", icon: "downloads" },
  { href: "/app/profile", label: "Kullanıcı", icon: "profile" },
  { href: "/app/settings", label: "Ayarlar", icon: "settings" },
  { href: "/app/contact", label: "İletişim", icon: "contact" },
  { href: "/app/about", label: "Hakkımızda", icon: "about" },
];

function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const common = "h-4 w-4 " + className;

  if (name === "dashboard") return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M4 13.5C4 8.8 7.8 5 12.5 5S21 8.8 21 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M12.5 13.5L16.2 9.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M7 19H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  if (name === "sales") return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M6 19V5M6 19H20M6 19L10.5 14.5L14 16.5L20 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (name === "products") return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M4.5 8L12 12.3L19.5 8M12 21V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  if (name === "stock") return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M4 7H20M6 7V20H18V7M9 11H15M9 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M8 7V4H16V7" stroke="currentColor" strokeWidth="2"/></svg>;
  if (name === "qr") return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M4 4H10V10H4V4ZM14 4H20V10H14V4ZM4 14H10V20H4V14Z" stroke="currentColor" strokeWidth="2"/><path d="M14 14H16V16H14V14ZM18 14H20V16H18V14ZM14 18H16V20H14V18ZM18 18H20V20H18V18Z" fill="currentColor"/></svg>;
  if (name === "customers") return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M16 19C16 16.8 14.2 15 12 15H8C5.8 15 4 16.8 4 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10 11C12.2 11 14 9.2 14 7C14 4.8 12.2 3 10 3C7.8 3 6 4.8 6 7C6 9.2 7.8 11 10 11Z" stroke="currentColor" strokeWidth="2"/><path d="M18 8V14M15 11H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  if (name === "invoices") return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M7 3H17L20 6V21L17 19L14.5 21L12 19L9.5 21L7 19L4 21V6C4 4.3 5.3 3 7 3Z" stroke="currentColor" strokeWidth="2"/><path d="M8 9H16M8 13H16M8 17H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  if (name === "integrations") return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M8 12H16M7 7L5.5 5.5C4.7 4.7 4.7 3.3 5.5 2.5C6.3 1.7 7.7 1.7 8.5 2.5L10 4M17 17L18.5 18.5C19.3 19.3 19.3 20.7 18.5 21.5C17.7 22.3 16.3 22.3 15.5 21.5L14 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  if (name === "gorki") return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M12 3V6M7 6H17C19.2 6 21 7.8 21 10V15C21 17.2 19.2 19 17 19H7C4.8 19 3 17.2 3 15V10C3 7.8 4.8 6 7 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M8.5 12H8.6M15.4 12H15.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><path d="M9 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  if (name === "inbox") return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M4 5H20V16H15L12 19L9 16H4V5Z" stroke="currentColor" strokeWidth="2"/><path d="M8 9H16M8 12H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  if (name === "notifications") return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M18 10C18 6.7 15.3 4 12 4S6 6.7 6 10V15L4 18H20L18 15V10Z" stroke="currentColor" strokeWidth="2"/><path d="M10 21H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  if (name === "downloads") return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M12 4V15M12 15L8 11M12 15L16 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M5 19H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  if (name === "profile") return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M12 12C14.2 12 16 10.2 16 8C16 5.8 14.2 4 12 4C9.8 4 8 5.8 8 8C8 10.2 9.8 12 12 12Z" stroke="currentColor" strokeWidth="2"/><path d="M5 20C5.8 16.5 8.5 15 12 15C15.5 15 18.2 16.5 19 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  if (name === "settings") return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M12 15.5C13.9 15.5 15.5 13.9 15.5 12C15.5 10.1 13.9 8.5 12 8.5C10.1 8.5 8.5 10.1 8.5 12C8.5 13.9 10.1 15.5 12 15.5Z" stroke="currentColor" strokeWidth="2"/><path d="M19 12C19 11.6 19 11.2 18.9 10.8L21 9.2L19 5.8L16.5 6.8C15.9 6.3 15.3 5.9 14.6 5.6L14.2 3H9.8L9.4 5.6C8.7 5.9 8.1 6.3 7.5 6.8L5 5.8L3 9.2L5.1 10.8C5 11.2 5 11.6 5 12C5 12.4 5 12.8 5.1 13.2L3 14.8L5 18.2L7.5 17.2C8.1 17.7 8.7 18.1 9.4 18.4L9.8 21H14.2L14.6 18.4C15.3 18.1 15.9 17.7 16.5 17.2L19 18.2L21 14.8L18.9 13.2C19 12.8 19 12.4 19 12Z" stroke="currentColor" strokeWidth="2"/></svg>;
  if (name === "contact") return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M4 5H20V19H4V5Z" stroke="currentColor" strokeWidth="2"/><path d="M4 7L12 13L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  if (name === "about") return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M12 21C17 21 21 17 21 12S17 3 12 3S3 7 3 12S7 21 12 21Z" stroke="currentColor" strokeWidth="2"/><path d="M12 11V16M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  if (name === "search") return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M11 19C15.4 19 19 15.4 19 11S15.4 3 11 3S3 6.6 3 11S6.6 19 11 19Z" stroke="currentColor" strokeWidth="2"/><path d="M21 21L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  if (name === "theme") return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M21 14.5C19.7 15.3 18.1 15.7 16.5 15.7C11.9 15.7 8.3 12.1 8.3 7.5C8.3 5.9 8.7 4.3 9.5 3C5.8 4.1 3 7.6 3 11.7C3 16.7 7.1 20.8 12.1 20.8C16.2 20.8 19.7 18 21 14.5Z" stroke="currentColor" strokeWidth="2"/></svg>;
  if (name === "logout") return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M10 6H6V18H10M14 8L18 12L14 16M18 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;

  return <svg viewBox="0 0 24 24" fill="none" className={common}><path d="M5 7H19M5 12H19M5 17H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
}

function active(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname.startsWith(href);
}

function pageTitle(pathname: string) {
  const all = [...mainItems, ...businessItems, ...systemItems];
  return all.find((item) => active(pathname, item.href))?.label ?? "Dashboard";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [darkMode, setDarkMode] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const surface = darkMode ? "bg-[#0b1220] text-white" : "bg-[#eef3f9] text-slate-950";
  const panel = darkMode ? "bg-[#111a2e] border-white/10" : "bg-white border-slate-200";

  return (
    <div className={`min-h-screen ${surface}`}>
      <div className="flex min-h-screen">
        <aside className="hidden w-[224px] shrink-0 border-r border-white/10 bg-[#0b1220] p-2.5 text-white lg:block">
          <div className="flex h-full flex-col overflow-hidden rounded-[20px] border border-white/10 bg-[#111a2e]">
            <Link href="/app" className="m-2.5 flex items-center gap-2.5 rounded-[18px] bg-[#07101f] p-2.5">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white">
                <Image src="/takipio-logo.png" alt="Takipio" fill className="object-contain p-1.5" priority />
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-black">Takipio</p>
                <p className="truncate text-[10px] text-slate-400">İşletme paneli</p>
              </div>
            </Link>

            <nav className="flex-1 overflow-y-auto px-2 pb-3">
              <NavGroup title="Kontrol" items={mainItems} pathname={pathname} />
              <NavGroup title="İşletme" items={businessItems} pathname={pathname} />
              <NavGroup title="Merkez" items={systemItems} pathname={pathname} />
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          <header className={`sticky top-0 z-40 border-b ${darkMode ? "border-white/10 bg-[#0b1220]/90" : "border-slate-200 bg-white/90"} backdrop-blur-2xl`}>
            <div className="flex h-[62px] items-center gap-2 px-3 lg:px-4">
              <div className="min-w-0 flex-1">
                <div className="hidden lg:block">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Aktif Sayfa</p>
                  <h1 className="truncate text-lg font-black">{pageTitle(pathname)}</h1>
                </div>

                <div className={`flex h-10 items-center gap-2 rounded-2xl px-3 ring-1 lg:hidden ${darkMode ? "bg-white/8 ring-white/10" : "bg-slate-100 ring-slate-200"}`}>
                  <Icon name="search" />
                  <input placeholder="Panelde ara..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500" />
                </div>
              </div>

              <div className={`hidden h-10 max-w-[560px] flex-1 items-center gap-2 rounded-2xl px-3 ring-1 lg:flex ${darkMode ? "bg-white/8 ring-white/10" : "bg-slate-100 ring-slate-200"}`}>
                <Icon name="search" />
                <input placeholder="Ürün, satış, müşteri, fatura veya QR ara..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500" />
              </div>

              <TopIcon href="/app/inbox" name="inbox" dark={darkMode} dot="blue" />
              <TopIcon href="/app/notifications" name="notifications" dark={darkMode} dot="red" />

              <button onClick={() => setDarkMode((v) => !v)} className={`flex h-10 w-10 items-center justify-center rounded-2xl ${darkMode ? "bg-white/8" : "bg-slate-100"}`}>
                <Icon name="theme" />
              </button>

              <div className="relative">
                <button onClick={() => setProfileOpen((v) => !v)} className={`flex h-10 items-center gap-2 rounded-2xl px-2 ${darkMode ? "bg-white/8" : "bg-slate-100"}`}>
                  <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400" />
                  <div className="hidden text-left leading-none sm:block">
                    <p className="text-xs font-black">Burak</p>
                    <p className="mt-1 text-[10px] text-slate-500">Admin</p>
                  </div>
                </button>

                {profileOpen ? (
                  <div className={`absolute right-0 top-12 z-50 w-56 rounded-2xl border p-2 shadow-xl ${panel}`}>
                    <Link href="/app/profile" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold hover:bg-blue-500/10">
                      <Icon name="profile" /> Kullanıcı Profili
                    </Link>
                    <Link href="/app/settings" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold hover:bg-blue-500/10">
                      <Icon name="settings" /> Ayarlar
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
          <button onClick={() => setMenuOpen(false)} className="rounded-xl bg-white/10 px-3 py-1 font-black">×</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[...businessItems, ...systemItems].map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={`flex items-center gap-2 rounded-2xl p-3 text-sm font-black ${active(pathname, item.href) ? "bg-blue-600 text-white" : darkMode ? "bg-white/8" : "bg-slate-100"}`}>
              <Icon name={item.icon} /> {item.label}
            </Link>
          ))}
        </div>
      </div>

      <nav className={`fixed bottom-3 left-3 right-3 z-50 rounded-[24px] border p-1.5 shadow-2xl lg:hidden ${panel}`}>
        <div className="grid grid-cols-6 gap-1">
          {mainItems.slice(0, 5).map((item) => (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center gap-1 rounded-[18px] px-1 py-2 text-[9px] font-black ${active(pathname, item.href) ? "bg-blue-600 text-white" : "text-slate-400"}`}>
              <Icon name={item.icon} />
              <span>{item.shortLabel}</span>
            </Link>
          ))}
          <button onClick={() => setMenuOpen((v) => !v)} className={`flex flex-col items-center justify-center gap-1 rounded-[18px] px-1 py-2 text-[9px] font-black ${menuOpen ? "bg-blue-600 text-white" : "text-slate-400"}`}>
            <Icon name="menu" />
            <span>Menü</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function NavGroup({ title, items, pathname }: { title: string; items: NavItem[]; pathname: string }) {
  return (
    <div className="mb-4">
      <p className="mb-1.5 px-2 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <div className="space-y-1">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className={`flex items-center gap-2 rounded-[14px] px-2.5 py-2 text-[12px] font-black transition ${active(pathname, item.href) ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-white/8 hover:text-white"}`}>
            <span className={`flex h-7 w-7 items-center justify-center rounded-xl ${active(pathname, item.href) ? "bg-white/15" : "bg-white/8"}`}>
              <Icon name={item.icon} />
            </span>
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function TopIcon({ href, name, dark, dot }: { href: string; name: IconName; dark: boolean; dot?: "blue" | "red" }) {
  return (
    <Link href={href} className={`relative flex h-10 w-10 items-center justify-center rounded-2xl ${dark ? "bg-white/8" : "bg-slate-100"}`}>
      <Icon name={name} />
      {dot ? <span className={`absolute right-2 top-2 h-2 w-2 rounded-full ${dot === "blue" ? "bg-blue-500" : "bg-red-500"}`} /> : null}
    </Link>
  );
}
