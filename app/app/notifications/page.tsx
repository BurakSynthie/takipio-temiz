"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Business = { id: string; owner_email: string | null; name: string; email: string | null };
type Member = { id: string; business_id: string; email: string; role_name: string | null; member_status: string | null; can_manage_settings?: boolean | null };
type Notification = { id: string; business_id: string; created_by: string | null; target_email: string | null; title: string; message: string | null; type: string | null; href: string | null; is_read: boolean | null; created_at: string; read_at: string | null };

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

async function getCurrentUserEmail() {
  const sessionResult = await supabase.auth.getSession();
  const sessionEmail = normalizeEmail(sessionResult.data.session?.user?.email);
  if (sessionEmail) return sessionEmail;
  const { data } = await supabase.auth.getUser();
  return normalizeEmail(data.user?.email);
}

async function getBusinessContext() {
  const userEmail = await getCurrentUserEmail();
  if (!userEmail) throw new Error("Oturum bulunamadı.");

  const owned = await supabase.from("businesses").select("*").eq("owner_email", userEmail).limit(1).maybeSingle();

  if (owned.data) {
    const member = await supabase.from("business_members").select("*").eq("business_id", owned.data.id).eq("email", userEmail).maybeSingle();
    return { userEmail, business: owned.data as Business, member: member.data as Member | null, isOwner: true };
  }

  const member = await supabase.from("business_members").select("*").eq("email", userEmail).eq("member_status", "active").limit(1).maybeSingle();

  if (!member.data?.business_id) throw new Error("Aktif işletme bulunamadı.");

  const business = await supabase.from("businesses").select("*").eq("id", member.data.business_id).single();

  if (business.error || !business.data) throw new Error("İşletme bulunamadı.");

  return { userEmail, business: business.data as Business, member: member.data as Member, isOwner: false };
}

function formatDate(date: string | null | undefined) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

function typeClass(type: string | null | undefined) {
  if (type === "warning") return "bg-amber-500/15 text-amber-300 ring-amber-400/20";
  if (type === "success") return "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20";
  if (type === "invite") return "bg-purple-500/15 text-purple-300 ring-purple-400/20";
  if (type === "error") return "bg-red-500/15 text-red-300 ring-red-400/20";
  return "bg-blue-500/15 text-blue-300 ring-blue-400/20";
}

export default function NotificationsPage() {
  const [context, setContext] = useState<{ userEmail: string; business: Business; member: Member | null; isOwner: boolean } | null>(null);
  const [items, setItems] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    setMessage("");

    try {
      const ctx = await getBusinessContext();
      setContext(ctx);

      const result = await supabase
        .from("notifications")
        .select("*")
        .eq("business_id", ctx.business.id)
        .order("created_at", { ascending: false });

      if (result.error) {
        setMessage(`Bildirimler alınamadı: ${result.error.message}`);
        return;
      }

      setItems((result.data ?? []) as Notification[]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Bildirimler alınamadı.";
      if (msg.includes("Oturum")) window.location.replace("/login");
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function markRead(item: Notification, read: boolean) {
    const result = await supabase
      .from("notifications")
      .update({ is_read: read, read_at: read ? new Date().toISOString() : null })
      .eq("id", item.id)
      .eq("business_id", item.business_id);

    if (result.error) {
      setMessage(`Bildirim güncellenemedi: ${result.error.message}`);
      return;
    }

    await fetchData();
  }

  async function markAllRead() {
    if (!context) return;

    const result = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("business_id", context.business.id)
      .eq("is_read", false);

    if (result.error) {
      setMessage(`Bildirimler güncellenemedi: ${result.error.message}`);
      return;
    }

    await fetchData();
  }

  const filtered = useMemo(() => {
    if (filter === "unread") return items.filter((item) => !item.is_read);
    if (filter === "read") return items.filter((item) => item.is_read);
    return items;
  }, [items, filter]);

  const stats = useMemo(() => {
    return {
      all: items.length,
      unread: items.filter((item) => !item.is_read).length,
      read: items.filter((item) => item.is_read).length,
    };
  }, [items]);

  return (
    <section className="mx-auto w-full max-w-[1200px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-amber-500/15 px-3 py-2 text-xs font-black text-amber-300">
              Notification Center v23
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Bildirimler</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Davet, sistem uyarısı, işlem ve ekip bildirimlerini burada takip et.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={markAllRead} className="rounded-2xl bg-emerald-500/15 px-5 py-3 text-sm font-black text-emerald-300 ring-1 ring-emerald-400/20">Tümünü Okundu Yap</button>
            <button onClick={fetchData} className="rounded-2xl bg-white/8 px-5 py-3 text-sm font-black text-slate-200 ring-1 ring-white/10">Yenile</button>
          </div>
        </div>
      </div>

      {message ? <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">{message}</div> : null}

      <div className="grid grid-cols-3 gap-3">
        <FilterButton label="Tümü" value={loading ? "..." : String(stats.all)} active={filter === "all"} onClick={() => setFilter("all")} />
        <FilterButton label="Okunmamış" value={loading ? "..." : String(stats.unread)} active={filter === "unread"} onClick={() => setFilter("unread")} />
        <FilterButton label="Okundu" value={loading ? "..." : String(stats.read)} active={filter === "read"} onClick={() => setFilter("read")} />
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="rounded-[26px] border border-dashed border-white/10 bg-[#111a2e] p-10 text-center">
            <p className="text-sm font-bold text-slate-500">Bu filtrede bildirim yok.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <article key={item.id} className={`rounded-[24px] border p-4 ${item.is_read ? "border-white/10 bg-[#111a2e]" : "border-blue-400/30 bg-blue-500/10"}`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black">{item.title}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${typeClass(item.type)}`}>{item.type || "info"}</span>
                    {!item.is_read ? <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-black text-white">Yeni</span> : null}
                  </div>
                  <p className="text-sm leading-6 text-slate-400">{item.message || "Detay yok."}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(item.created_at)}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.href ? <Link href={item.href} className="rounded-2xl bg-blue-500/15 px-4 py-2.5 text-xs font-black text-blue-300 ring-1 ring-blue-400/20">Aç</Link> : null}
                  <button onClick={() => markRead(item, !item.is_read)} className="rounded-2xl bg-white/8 px-4 py-2.5 text-xs font-black text-slate-300 ring-1 ring-white/10">
                    {item.is_read ? "Okunmadı Yap" : "Okundu Yap"}
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function FilterButton({ label, value, active, onClick }: { label: string; value: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-[22px] border p-4 text-left transition ${active ? "border-blue-400/40 bg-blue-500/15" : "border-white/10 bg-[#111a2e]"}`}>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </button>
  );
}
