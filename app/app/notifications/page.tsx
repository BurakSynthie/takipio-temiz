"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type NotificationItem = {
  id: string;
  title: string;
  description: string | null;
  type: string | null;
  target_url: string | null;
  is_read: boolean | null;
  created_at: string;
};

const empty = {
  title: "",
  description: "",
  type: "system",
  target_url: "/app",
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [form, setForm] = useState(empty);

  async function fetchItems() {
    const { data } = await supabase
      .from("app_notifications")
      .select("*")
      .order("created_at", { ascending: false });

    setItems(data ?? []);
  }

  useEffect(() => {
    fetchItems();
  }, []);

  async function addNotification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) return;

    await supabase.from("app_notifications").insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      type: form.type,
      target_url: form.target_url.trim() || "/app",
    });

    setForm(empty);
    await fetchItems();
  }

  async function markRead(id: string, isRead: boolean | null) {
    await supabase.from("app_notifications").update({ is_read: !isRead }).eq("id", id);
    await fetchItems();
  }

  async function deleteItem(id: string) {
    await supabase.from("app_notifications").delete().eq("id", id);
    await fetchItems();
  }

  return (
    <section className="mx-auto w-full max-w-[1200px] space-y-3 text-white">
      <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
        <h1 className="text-2xl font-black">Bildirim Yönetimi</h1>
        <p className="mt-1 text-sm text-slate-400">Bildirim ekle, okundu yap, sil veya ilgili sayfaya git.</p>
      </div>

      <form onSubmit={addNotification} className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
        <h2 className="text-lg font-black">Yeni Bildirim</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Başlık" className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Açıklama" className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
            <option value="system">Sistem</option>
            <option value="stock">Stok</option>
            <option value="payment">Ödeme</option>
            <option value="sales">Satış</option>
          </select>
          <input value={form.target_url} onChange={(e) => setForm({ ...form, target_url: e.target.value })} placeholder="/app/products" className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
        </div>

        <button className="mt-4 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black">Bildirim Ekle</button>
      </form>

      <div className="grid gap-3 md:grid-cols-2">
        {items.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">Bildirim yok.</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className={`rounded-[20px] border border-white/10 bg-[#111a2e] p-4 ${item.is_read ? "opacity-55" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-blue-400/15 px-3 py-1 text-xs font-black text-blue-300">{item.type || "system"}</span>
                <button onClick={() => deleteItem(item.id)} className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-black text-red-300">Sil</button>
              </div>

              <h2 className="mt-4 text-lg font-black">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-400">{item.description || "Açıklama yok"}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => markRead(item.id, item.is_read)} className="rounded-2xl bg-white/10 px-4 py-2 text-xs font-black">
                  {item.is_read ? "Okunmadı Yap" : "Okundu Yap"}
                </button>
                {item.target_url ? (
                  <Link href={item.target_url} className="rounded-2xl bg-blue-600 px-4 py-2 text-xs font-black">
                    İlgili Sayfaya Git
                  </Link>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
