"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Product = { id: string; name: string; product_code: string; category: string | null; price: number | null; stock: number | null; min_stock: number | null; created_at: string };
type Sale = { id: string; product_code: string | null; product_name: string | null; customer_name: string | null; quantity: number | null; total_price: number | null; payment_status: string | null; created_at: string };
type StockMovement = { id: string; product_code: string | null; product_name: string | null; movement_type: string | null; quantity: number | null; note: string | null; created_at: string };
type Note = { id: string; title: string; note: string | null; is_done: boolean | null; created_at: string };

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

function isToday(date: string) {
  const d = new Date(date);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function paymentLabel(status: string | null) {
  if (status === "paid") return "Ödendi";
  if (status === "partial") return "Kısmi";
  return "Bekliyor";
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);

    const [p, s, m, n] = await Promise.all([
      supabase.from("products").select("id, name, product_code, category, price, stock, min_stock, created_at").order("created_at", { ascending: false }),
      supabase.from("sales").select("*").order("created_at", { ascending: false }),
      supabase.from("stock_movements").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("app_notes").select("*").order("created_at", { ascending: false }).limit(8),
    ]);

    setProducts(p.data ?? []);
    setSales(s.data ?? []);
    setMovements(m.data ?? []);
    setNotes(n.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function addNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = noteTitle.trim();
    if (!cleanTitle) return;

    const { data } = await supabase.from("app_notes").insert({ title: cleanTitle }).select("*").single();
    if (data) setNotes((current) => [data, ...current]);
    setNoteTitle("");
  }

  async function toggleNote(note: Note) {
    setNotes((current) => current.map((item) => item.id === note.id ? { ...item, is_done: !item.is_done } : item));
    await supabase.from("app_notes").update({ is_done: !note.is_done }).eq("id", note.id);
  }

  async function deleteNote(id: string) {
    setNotes((current) => current.filter((item) => item.id !== id));
    await supabase.from("app_notes").delete().eq("id", id);
  }

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + Number(p.stock ?? 0), 0);
  const stockValue = products.reduce((sum, p) => sum + Number(p.price ?? 0) * Number(p.stock ?? 0), 0);
  const criticalProducts = products.filter((p) => Number(p.min_stock ?? 0) > 0 && Number(p.stock ?? 0) <= Number(p.min_stock ?? 0));
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_price ?? 0), 0);
  const todayRevenue = sales.filter((s) => isToday(s.created_at)).reduce((sum, s) => sum + Number(s.total_price ?? 0), 0);
  const pendingSales = sales.filter((s) => s.payment_status !== "paid");
  const pendingRevenue = pendingSales.reduce((sum, s) => sum + Number(s.total_price ?? 0), 0);
  const paidRevenue = sales.filter((s) => s.payment_status === "paid").reduce((sum, s) => sum + Number(s.total_price ?? 0), 0);
  const soldQty = sales.reduce((sum, s) => sum + Number(s.quantity ?? 0), 0);
  const paidRatio = totalRevenue > 0 ? Math.round((paidRevenue / totalRevenue) * 100) : 0;

  const weeklyBars = useMemo(() => {
    const labels = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
    const totals = [0, 0, 0, 0, 0, 0, 0];

    sales.forEach((sale) => {
      const day = new Date(sale.created_at).getDay();
      const index = day === 0 ? 6 : day - 1;
      totals[index] += Number(sale.total_price ?? 0);
    });

    const max = Math.max(...totals, 1);
    return labels.map((label, i) => ({ label, total: totals[i], height: Math.max((totals[i] / max) * 100, totals[i] > 0 ? 12 : 3) }));
  }, [sales]);

  return (
    <section className="mx-auto grid w-full max-w-[1500px] gap-3 text-white">
      <div className="grid gap-3 xl:grid-cols-[1fr_280px]">
        <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">Canlı Dashboard</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.04em]">İşletme Özeti</h1>
              <p className="mt-1 text-xs text-slate-400">Kompakt yönetim görünümü. Kartlar küçük, bilgi yoğun.</p>
            </div>

            <div className="flex gap-2">
              <button onClick={fetchData} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black transition hover:-translate-y-0.5">Yenile</button>
              <Link href="/app/sales" className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black transition hover:-translate-y-0.5">Yeni Satış</Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-[20px] border border-white/10 bg-[#111a2e] p-3">
          <Quick href="/app/products" label="Ürün" />
          <Quick href="/app/sales" label="Satış" />
          <Quick href="/app/stock" label="Stok" />
          <Quick href="/app/profile" label="Kullanıcı" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        <Metric label="Bugün" value={loading ? "..." : formatCurrency(todayRevenue)} sub="Günlük satış" />
        <Metric label="Ciro" value={loading ? "..." : formatCurrency(totalRevenue)} sub={`${sales.length} satış`} />
        <Metric label="Bekleyen" value={loading ? "..." : formatCurrency(pendingRevenue)} sub={`${pendingSales.length} kayıt`} />
        <Metric label="Kritik" value={loading ? "..." : String(criticalProducts.length)} sub="stok uyarısı" />
        <Metric label="Ürün" value={loading ? "..." : String(totalProducts)} sub={`${totalStock} adet stok`} />
        <Metric label="Stok Değeri" value={loading ? "..." : formatCurrency(stockValue)} sub={`${soldQty} adet satıldı`} />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr_0.7fr]">
        <Panel title="Satış Grafiği" actionHref="/app/sales">
          <div className="relative h-[230px] rounded-[18px] border border-white/8 bg-[#0b1220] p-3">
            <div className="absolute inset-x-3 top-1/4 border-t border-dashed border-white/10" />
            <div className="absolute inset-x-3 top-1/2 border-t border-dashed border-white/10" />
            <div className="absolute inset-x-3 top-3/4 border-t border-dashed border-white/10" />

            <div className="relative flex h-full items-end gap-2">
              {weeklyBars.map((bar) => (
                <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <div className="flex h-[165px] items-end">
                    <div className="w-5 rounded-t-full bg-gradient-to-t from-blue-700 to-cyan-300 transition hover:scale-y-105" style={{ height: `${bar.height}%` }} />
                  </div>
                  <span className="text-[10px] font-black text-slate-500">{bar.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Nakit & Stok">
          <SmallBar label="Tahsilat" value={`${paidRatio}%`} width={paidRatio} color="bg-emerald-400" />
          <SmallBar label="Stok Sağlığı" value={`${totalProducts > 0 ? Math.round(((totalProducts - criticalProducts.length) / totalProducts) * 100) : 100}%`} width={totalProducts > 0 ? Math.round(((totalProducts - criticalProducts.length) / totalProducts) * 100) : 100} color="bg-blue-500" />
          <SmallBar label="Stok Değeri" value={formatCurrency(stockValue)} width={stockValue > 0 ? 100 : 0} color="bg-amber-400" />
          <SmallBar label="Satış Adedi" value={String(soldQty)} width={Math.min(soldQty * 4, 100)} color="bg-violet-400" />
        </Panel>

        <Panel title="Notlar">
          <form onSubmit={addNote} className="mb-2 flex gap-2">
            <input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Not yaz..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-xs outline-none placeholder:text-slate-500" />
            <button className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black">Ekle</button>
          </form>

          <div className="space-y-2">
            {notes.length === 0 ? (
              <Empty text="Not yok" />
            ) : (
              notes.map((note) => (
                <div key={note.id} className="flex items-center gap-2 rounded-[14px] bg-[#0b1220] p-2.5">
                  <button onClick={() => toggleNote(note)} className={`h-4 w-4 shrink-0 rounded-full ${note.is_done ? "bg-emerald-400" : "bg-white/10"}`} />
                  <p className={`min-w-0 flex-1 truncate text-xs font-bold ${note.is_done ? "text-slate-500 line-through" : "text-white"}`}>{note.title}</p>
                  <button onClick={() => deleteNote(note.id)} className="text-xs font-black text-red-300">Sil</button>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel title="Son Satışlar" actionHref="/app/sales">
          <div className="space-y-2">
            {sales.slice(0, 5).length === 0 ? <Empty text="Satış yok" /> : sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between gap-3 rounded-[14px] bg-[#0b1220] p-2.5 transition hover:bg-[#111d31]">
                <div className="min-w-0">
                  <p className="truncate text-xs font-black">{sale.product_name || "Ürün yok"}</p>
                  <p className="text-[10px] text-slate-500">{sale.customer_name || "Müşteri yok"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black">{formatCurrency(sale.total_price)}</p>
                  <p className="text-[10px] text-blue-300">{paymentLabel(sale.payment_status)}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Stok Hareketleri" actionHref="/app/stock">
          <div className="space-y-2">
            {movements.slice(0, 5).length === 0 ? <Empty text="Hareket yok" /> : movements.slice(0, 5).map((movement) => (
              <div key={movement.id} className="flex items-center justify-between gap-3 rounded-[14px] bg-[#0b1220] p-2.5 transition hover:bg-[#111d31]">
                <div className="min-w-0">
                  <p className="truncate text-xs font-black">{movement.product_name || "Ürün yok"}</p>
                  <p className="text-[10px] text-slate-500">{movement.note || "Stok hareketi"}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-black ${movement.movement_type === "stock_in" ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"}`}>
                  {movement.movement_type === "stock_in" ? "+" : "-"}{movement.quantity ?? 0}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Uyarılar">
          <Alert label="Kritik stok" value={`${criticalProducts.length} ürün`} tone="red" href="/app/products" />
          <Alert label="Bekleyen ödeme" value={formatCurrency(pendingRevenue)} tone="amber" href="/app/sales" />
          <Alert label="Yetkiler" value="Ekip yönetimi" tone="blue" href="/app/settings" />
          <Alert label="Profil" value="Fotoğraf yükle" tone="green" href="/app/profile" />
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Destek
          </p>
          <h2 className="mt-2 text-lg font-black">
            Öneri, şikayet veya destek talebin mi var?
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Takipio ile ilgili geri bildirim, hata bildirimi veya geliştirme önerileri için iletişim sayfasından bize ulaşabilirsin.
          </p>
          <Link
            href="/app/contact"
            className="mt-4 inline-flex rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 hover:bg-blue-500"
          >
            İletişime Geç
          </Link>
        </div>

        <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Rehber
          </p>
          <h2 className="mt-2 text-lg font-black">
            Takipio nasıl kullanılır?
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Ürün ekleme, stok yönetimi, satış oluşturma, QR etiket, müşteri, fatura ve ekip yetkilerini adım adım öğren.
          </p>
          <Link
            href="/app/help"
            className="mt-4 inline-flex rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-blue-200 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15"
          >
            Tıkla, Öğren
          </Link>
        </div>
      </div>

</section>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-[#111a2e] p-3 transition hover:-translate-y-0.5 hover:bg-[#17233b]">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
      <p className="mt-1 text-[10px] text-slate-500">{sub}</p>
    </div>
  );
}

function Panel({ title, children, actionHref }: { title: string; children: React.ReactNode; actionHref?: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-black">{title}</h2>
        {actionHref ? <Link href={actionHref} className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-black text-blue-200">Git</Link> : null}
      </div>
      {children}
    </div>
  );
}

function Quick({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="rounded-[14px] bg-[#0b1220] px-3 py-2.5 text-center text-xs font-black ring-1 ring-white/8 transition hover:-translate-y-0.5 hover:bg-[#111d31]">{label}</Link>;
}

function SmallBar({ label, value, width, color }: { label: string; value: string; width: number; color: string }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-xs font-black">
        <span className="text-slate-400">{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/8">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function Alert({ label, value, tone, href }: { label: string; value: string; tone: "red" | "amber" | "blue" | "green"; href: string }) {
  const color = tone === "red" ? "text-red-300" : tone === "amber" ? "text-amber-300" : tone === "green" ? "text-emerald-300" : "text-blue-300";
  return (
    <Link href={href} className="mb-2 flex items-center justify-between rounded-[14px] bg-[#0b1220] p-2.5 transition hover:bg-[#111d31]">
      <span className="text-xs font-bold text-slate-400">{label}</span>
      <span className={`text-xs font-black ${color}`}>{value}</span>
    </Link>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-[14px] border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">{text}</div>;
}
