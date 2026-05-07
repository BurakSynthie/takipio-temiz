"use client";

import { useEffect, useState } from "react";
import { createClient, type User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

const menu = [
  { href: "/app", label: "Panel", icon: "⌂" },
  { href: "/app/orders", label: "Siparişler", icon: "▣" },
  { href: "/app/products", label: "Ürünler", icon: "◈" },
  { href: "/app/qr", label: "QR Etiket", icon: "▦" },
  { href: "/app/stock", label: "Stok", icon: "⬡" },
  { href: "/app/marketplaces", label: "Pazaryerleri", icon: "⇄" },
  { href: "/app/reports", label: "Raporlar", icon: "▤" },
  { href: "/app/settings", label: "Ayarlar", icon: "⚙" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setUser(data.session.user);
      setChecking(false);
    });
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (checking) {
    return <main className="loading">Panel hazırlanıyor...</main>;
  }

  return (
    <main className="appShell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <a className="brand" href="/app"><img src="/takipio-logo.png" alt="Takipio" /></a>
        <nav>
          {menu.map((item) => (
            <a className={pathname === item.href ? "active" : ""} href={item.href} key={item.href}>
              <i>{item.icon}</i>{item.label}
            </a>
          ))}
        </nav>
        <div className="userBox">
          <span>{user?.email}</span>
          <button onClick={signOut}>Çıkış yap</button>
        </div>
      </aside>

      <section className="content">
        <header className="mobileTop">
          <button onClick={() => setOpen(true)}>☰</button>
          <img src="/takipio-logo.png" alt="Takipio" />
          <a href="/app/qr">QR</a>
        </header>
        {children}
      </section>

      {open && <button className="overlay" onClick={() => setOpen(false)} aria-label="Menüyü kapat" />}

      <style jsx global>{`
        *{box-sizing:border-box} html,body{margin:0;min-height:100%;background:#f3f7ff;color:#06101f;font-family:Inter,system-ui,sans-serif}a{text-decoration:none;color:inherit}button{font-family:inherit;cursor:pointer}
        .loading{min-height:100svh;display:grid;place-items:center;background:#f3f7ff;font-weight:900;color:#06101f}
        .appShell{min-height:100svh;display:grid;grid-template-columns:260px 1fr;background:radial-gradient(circle at 20% 0%,rgba(11,99,255,.1),transparent 28%),#f3f7ff}
        .sidebar{position:sticky;top:0;height:100svh;display:flex;flex-direction:column;padding:22px;background:#050b18;color:white;z-index:20}
        .brand{width:178px;height:58px;display:grid;place-items:center;border-radius:22px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);margin-bottom:22px}.brand img{width:148px;height:42px;object-fit:contain}
        .sidebar nav{display:grid;gap:8px}.sidebar nav a{min-height:46px;display:flex;align-items:center;gap:12px;padding:0 13px;border-radius:16px;color:rgba(255,255,255,.72);font-size:14px;font-weight:850}
        .sidebar nav a:hover,.sidebar nav a.active{color:#fff;background:linear-gradient(135deg,#0b63ff,#22d3ee);box-shadow:0 16px 30px rgba(11,99,255,.24)}
        .sidebar nav a i{width:24px;height:24px;display:grid;place-items:center;border-radius:9px;background:rgba(255,255,255,.08);font-style:normal;font-size:13px}
        .userBox{margin-top:auto;padding:14px;border-radius:20px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08)}.userBox span{display:block;overflow:hidden;text-overflow:ellipsis;color:rgba(255,255,255,.72);font-size:12px;font-weight:750;margin-bottom:10px}.userBox button{width:100%;height:38px;border:0;border-radius:13px;color:#fff;background:rgba(255,255,255,.08);font-weight:850}
        .content{min-width:0;padding:28px}.mobileTop{display:none}.overlay{display:none}
        @media(max-width:920px){.appShell{grid-template-columns:1fr}.sidebar{position:fixed;left:14px;top:14px;bottom:14px;width:min(280px,calc(100vw - 28px));height:auto;border-radius:28px;transform:translateX(-120%);transition:.22s}.sidebar.open{transform:translateX(0)}.content{padding:14px;padding-top:88px}.mobileTop{position:fixed;left:14px;right:14px;top:14px;height:62px;display:grid;grid-template-columns:48px 1fr 48px;align-items:center;gap:10px;padding:7px;border-radius:24px;background:rgba(255,255,255,.9);border:1px solid rgba(11,99,255,.13);box-shadow:0 18px 44px rgba(16,24,40,.12);backdrop-filter:blur(18px);z-index:15}.mobileTop button,.mobileTop a{width:48px;height:48px;border:0;border-radius:17px;display:grid;place-items:center;background:#eef4ff;color:#0b63ff;font-weight:950}.mobileTop img{justify-self:center;width:145px;height:40px;object-fit:contain;padding:8px 14px;border-radius:16px;background:#06101f}.overlay{display:block;position:fixed;inset:0;z-index:10;border:0;background:rgba(6,16,31,.35);backdrop-filter:blur(4px)}}
      `}</style>
    </main>
  );
}
