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
type Order = { id: string; order_no: string; order_status: string | null; shipping_status: string | null; total_amount: number | null; paid_amount: number | null; remaining_amount: number | null; created_at: string };
type ReturnItem = { id: string; status: string | null; amount: number | null; created_at: string };
type Payment = { id: string; payment_method: string | null; amount: number | null; payment_date: string | null; created_at: string };
type Subscription = { id: string; plan: string | null; status: string | null; order_limit: number | null; first_month_price: number | null; monthly_price: number | null };

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);

    const [productsResult, salesResult, movementsResult, notesResult, ordersResult, returnsResult, paymentsResult, subscriptionResult] = await Promise.all([
      supabase.from("products").select("id, name, product_code, category, price, stock, min_stock, created_at").order("created_at", { ascending: false }),
      supabase.from("sales").select("*").order("created_at", { ascending: false }),
      supabase.from("stock_movements").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("app_notes").select("*").order("created_at", { ascending: false }).limit(8),
      supabase.from("orders").select("id, order_no, order_status, shipping_status, total_amount, paid_amount, remaining_amount, created_at").order("created_at", { ascending: false }),
      supabase.from("returns").select("id, status, amount, created_at").order("created_at", { ascending: false }),
      supabase.from("payments").select("id, payment_method, amount, payment_date, created_at").order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("id, plan, status, order_limit, first_month_price, monthly_price").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    setProducts(productsResult.data ?? []);
    setSales(salesResult.data ?? []);
    setMovements(movementsResult.data ?? []);
    setNotes(notesResult.data ?? []);
    setOrders(ordersResult.data ?? []);
    setReturns(returnsResult.data ?? []);
    setPayments(paymentsResult.data ?? []);
    setSubscription(subscriptionResult.data ?? null);
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
  const paidRevenue = sales.filter((s) => s.payment_status === "paid").reduce((sum, s) => sum + Number(s.total_price ?? 0), 0);
  const soldQty = sales.reduce((sum, s) => sum + Number(s.quantity ?? 0), 0);
  const paidRatio = totalRevenue > 0 ? Math.round((paidRevenue / totalRevenue) * 100) : 0;

  const waitingOrders = orders.filter((order) => order.order_status === "new" || order.order_status === "preparing").length;
  const unshippedOrders = orders.filter((order) => order.shipping_status !== "shipped" && order.shipping_status !== "delivered").length;
  const activeReturns = returns.filter((item) => item.status !== "refunded" && item.status !== "rejected").length;

  const orderTotal = orders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0);
  const orderPaid = orders.reduce((sum, order) => sum + Number(order.paid_amount ?? 0), 0);
  const orderRemaining = orders.reduce((sum, order) => sum + Math.max(Number(order.remaining_amount ?? order.total_amount ?? 0), 0), 0);

  const todayCash = payments
    .filter((payment) => payment.payment_method === "cash" && isToday(payment.payment_date ?? payment.created_at))
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  const todayCard = payments
    .filter((payment) => payment.payment_method === "card" && isToday(payment.payment_date ?? payment.created_at))
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  const todayTransfer = payments
    .filter((payment) => payment.payment_method === "transfer" && isToday(payment.payment_date ?? payment.created_at))
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  const plan = subscription?.plan ?? "free";
  const isPro = plan === "pro";
  const orderLimit = Number(subscription?.order_limit ?? 15);
  const usedOrders = orders.length;
  const remainingOrders = Math.max(orderLimit - usedOrders, 0);
  const usagePercentage = isPro ? 100 : Math.min(Math.round((usedOrders / orderLimit) * 100), 100);

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
              <p className="mt-1 text-xs text-slate-400">Satış, sipariş, kargo, iade, ödeme ve abonelik özeti.</p>
            </div>

            <div className="flex gap-2">
              <button onClick={fetchData} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black transition hover:-translate-y-0.5">Yenile</button>
              <Link href="/app/orders" className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black transition hover:-translate-y-0.5">Yeni Sipariş</Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-[20px] border border-white/10 bg-[#111a2e] p-3">
          <Quick href="/app/orders" label="Sipariş" />
          <Quick href="/app/shipments" label="Kargo" />
          <Quick href="/app/returns" label="İade" />
          <Quick href="/app/billing" label="Abonelik" />
        </div>
      </div>

      <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-black">
                {isPro ? "Takipio Pro aktif" : `Ücretsiz kullanım: ${usedOrders}/${orderLimit} sipariş`}
              </p>
              <span className={`rounded-full px-3 py-1 text-[10px] font-black ${isPro ? "bg-emerald-400/15 text-emerald-300" : "bg-blue-400/15 text-blue-300"}`}>
                {isPro ? "PRO" : "FREE"}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {isPro ? "Sınırsız sipariş ve premium özellikler açık." : `${remainingOrders} ücretsiz sipariş hakkın kaldı. İlk ay ₺89 ile Pro'ya geçebilirsin.`}
            </p>
          </div>

          <div className="flex flex-col gap-2 lg:w-[360px]">
            <div className="h-2 overflow-hidden rounded-full bg-white/8">
              <div className={isPro ? "h-full rounded-full bg-emerald-400" : "h-full rounded-full bg-blue-500"} style={{ width: `${usagePercentage}%` }} />
            </div>
            <Link href="/app/billing" className="self-start rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white lg:self-end">
              Paketi Gör
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        <Metric label="Bugün" value={loading ? "..." : formatCurrency(todayRevenue)} sub="Günlük satış" />
        <Metric label="Nakit" value={loading ? "..." : formatCurrency(todayCash)} sub="bugünkü nakit" />
        <Metric label="Kart" value={loading ? "..." : formatCurrency(todayCard)} sub="bugünkü kart" />
        <Metric label="Havale" value={loading ? "..." : formatCurrency(todayTransfer)} sub="bugünkü EFT" />
        <Metric label="Kalan" value={loading ? "..." : formatCurrency(orderRemaining)} sub="sipariş tahsilatı" />
        <Metric label="İade" value={loading ? "..." : String(activeReturns)} sub="aktif talep" />
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

        <Panel title="Nakit & Tahsilat">
          <SmallBar label="Sipariş Tutarı" value={formatCurrency(orderTotal)} width={orderTotal > 0 ? 100 : 0} color="bg-blue-500" />
          <SmallBar label="Alınan Ödeme" value={formatCurrency(orderPaid)} width={orderTotal > 0 ? Math.round((orderPaid / orderTotal) * 100) : 0} color="bg-emerald-400" />
          <SmallBar label="Kalan Tahsilat" value={formatCurrency(orderRemaining)} width={orderTotal > 0 ? Math.round((orderRemaining / orderTotal) * 100) : 0} color="bg-amber-400" />
          <SmallBar label="Stok Değeri" value={formatCurrency(stockValue)} width={stockValue > 0 ? 100 : 0} color="bg-violet-400" />
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

        <Panel title="Kritik Uyarılar">
          <Alert label="Kritik stok" value={`${criticalProducts.length} ürün`} tone="red" href="/app/products" />
          <Alert label="Bekleyen ödeme" value={formatCurrency(orderRemaining)} tone="amber" href="/app/orders" />
          <Alert label="Hazırlık bekleyen" value={`${waitingOrders} sipariş`} tone="blue" href="/app/orders" />
          <Alert label="Kargoya verilmeyen" value={`${unshippedOrders} sipariş`} tone="red" href="/app/shipments" />
          <Alert label="Aktif iade" value={`${activeReturns} talep`} tone="green" href="/app/returns" />
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Destek</p>
          <h2 className="mt-2 text-lg font-black">Öneri, şikayet veya destek talebin mi var?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Takipio ile ilgili geri bildirim, hata bildirimi veya geliştirme önerileri için iletişim sayfasından bize ulaşabilirsin.</p>
          <Link href="/app/contact" className="mt-4 inline-flex rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black transition hover:bg-blue-500">İletişime Geç</Link>
        </div>

        <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Rehber</p>
          <h2 className="mt-2 text-lg font-black">Takipio nasıl kullanılır?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Ürün, stok, sipariş, kargo, iade, müşteri, fatura ve ekip yetkilerini adım adım öğren.</p>
          <Link href="/app/help" className="mt-4 inline-flex rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-blue-200 ring-1 ring-white/10 transition hover:bg-white/15">Tıkla, Öğren</Link>
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
  return <Link href={href} className="rounded-[14px] bg-[#0b1220] px-3 py-2.5 text-center text-xs font-black ring-1 ring-white/8 transition hover:bg-[#111d31]">{label}</Link>;
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
