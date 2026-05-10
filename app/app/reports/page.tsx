"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Business = { id: string; owner_email: string | null; name: string; email: string | null };
type Member = { id: string; business_id: string; email: string; role_name: string | null; member_status: string | null };

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
    return { userEmail, business: owned.data as Business, isOwner: true };
  }

  const member = await supabase.from("business_members").select("*").eq("email", userEmail).eq("member_status", "active").limit(1).maybeSingle();

  if (!member.data?.business_id) throw new Error("Aktif işletme bulunamadı.");

  const business = await supabase.from("businesses").select("*").eq("id", member.data.business_id).single();

  if (business.error || !business.data) throw new Error("İşletme bulunamadı.");

  return { userEmail, business: business.data as Business, member: member.data as Member, isOwner: false };
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

function formatDate(date: string | null | undefined) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(date));
}

function isWithinDays(date: string | null | undefined, days: number) {
  if (!date) return false;
  const current = new Date(date).getTime();
  const start = Date.now() - days * 24 * 60 * 60 * 1000;
  return current >= start;
}

export default function ReportsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    setMessage("");

    try {
      const ctx = await getBusinessContext();
      setBusiness(ctx.business);

      const [ordersResult, paymentsResult, invoicesResult, customersResult, productsResult, returnsResult] = await Promise.all([
        supabase.from("orders").select("*").eq("business_id", ctx.business.id).order("created_at", { ascending: false }),
        supabase.from("payments").select("*").eq("business_id", ctx.business.id).order("created_at", { ascending: false }),
        supabase.from("invoices").select("*").eq("business_id", ctx.business.id).order("created_at", { ascending: false }),
        supabase.from("customers").select("*").eq("business_id", ctx.business.id).order("created_at", { ascending: false }),
        supabase.from("products").select("*").eq("business_id", ctx.business.id).order("created_at", { ascending: false }),
        supabase.from("returns").select("*").eq("business_id", ctx.business.id).order("created_at", { ascending: false }),
      ]);

      if (ordersResult.error) setMessage(`Sipariş raporu alınamadı: ${ordersResult.error.message}`);
      if (paymentsResult.error) setMessage(`Tahsilat raporu alınamadı: ${paymentsResult.error.message}`);

      setOrders(ordersResult.data || []);
      setPayments(paymentsResult.data || []);
      setInvoices(invoicesResult.data || []);
      setCustomers(customersResult.data || []);
      setProducts(productsResult.data || []);
      setReturns(returnsResult.data || []);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Raporlar alınamadı.";
      if (msg.includes("Oturum")) window.location.replace("/login");
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filteredOrders = useMemo(() => orders.filter((order) => isWithinDays(order.created_at, range)), [orders, range]);
  const filteredPayments = useMemo(() => payments.filter((payment) => isWithinDays(payment.payment_date || payment.created_at, range)), [payments, range]);
  const filteredInvoices = useMemo(() => invoices.filter((invoice) => isWithinDays(invoice.created_at, range)), [invoices, range]);

  const stats = useMemo(() => {
    const revenue = filteredOrders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0);
    const paid = filteredOrders.reduce((sum, order) => sum + Number(order.paid_amount ?? 0), 0);
    const remaining = filteredOrders.reduce((sum, order) => sum + Number(order.remaining_amount ?? 0), 0);
    const marketplaceRevenue = filteredOrders.filter((order) => Boolean(order.marketplace)).reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0);
    const invoiceTotal = filteredInvoices.reduce((sum, invoice) => sum + Number(invoice.total_amount ?? 0), 0);

    return {
      revenue,
      paid,
      remaining,
      marketplaceRevenue,
      invoiceTotal,
      orders: filteredOrders.length,
      payments: filteredPayments.length,
      customers: customers.length,
      products: products.length,
      returns: returns.length,
    };
  }, [filteredOrders, filteredPayments, filteredInvoices, customers, products, returns]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();

    filteredOrders.forEach((order) => {
      const name = order.product_name || "Ürün yok";
      const current = map.get(name) || { name, qty: 0, revenue: 0 };
      current.qty += Number(order.quantity ?? 1);
      current.revenue += Number(order.total_amount ?? 0);
      map.set(name, current);
    });

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [filteredOrders]);

  const topCustomers = useMemo(() => {
    const map = new Map<string, { name: string; orders: number; revenue: number; remaining: number }>();

    filteredOrders.forEach((order) => {
      const name = order.customer_name || "Müşteri yok";
      const current = map.get(name) || { name, orders: 0, revenue: 0, remaining: 0 };
      current.orders += 1;
      current.revenue += Number(order.total_amount ?? 0);
      current.remaining += Number(order.remaining_amount ?? 0);
      map.set(name, current);
    });

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [filteredOrders]);

  const marketplaceBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>();

    filteredOrders.forEach((order) => {
      const name = order.marketplace || "manuel";
      const current = map.get(name) || { name, count: 0, revenue: 0 };
      current.count += 1;
      current.revenue += Number(order.total_amount ?? 0);
      map.set(name, current);
    });

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  function exportCSV() {
    const rows = [
      ["Sipariş No", "Müşteri", "Ürün", "Tutar", "Ödenen", "Kalan", "Pazaryeri", "Tarih"],
      ...filteredOrders.map((order) => [
        order.order_no || "",
        order.customer_name || "",
        order.product_name || "",
        String(order.total_amount || 0),
        String(order.paid_amount || 0),
        String(order.remaining_amount || 0),
        order.marketplace || "manuel",
        order.created_at || "",
      ]),
    ];

    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `takipio-rapor-${range}-gun.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-purple-500/15 px-3 py-2 text-xs font-black text-purple-300">
              Reports Center v23
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Raporlar</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Satış, tahsilat, müşteri, ürün, pazaryeri ve fatura performansını tek ekranda analiz et.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[7, 30, 90].map((item) => (
              <button key={item} onClick={() => setRange(item as 7 | 30 | 90)} className={`rounded-2xl px-4 py-3 text-sm font-black ring-1 ${range === item ? "bg-blue-600 text-white ring-blue-400/30" : "bg-white/8 text-slate-300 ring-white/10"}`}>
                Son {item} Gün
              </button>
            ))}
            <button onClick={exportCSV} className="rounded-2xl bg-emerald-500/15 px-5 py-3 text-sm font-black text-emerald-300 ring-1 ring-emerald-400/20">CSV Al</button>
            <button onClick={fetchData} className="rounded-2xl bg-white/8 px-5 py-3 text-sm font-black text-slate-200 ring-1 ring-white/10">Yenile</button>
          </div>
        </div>
      </div>

      {message ? <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">{message}</div> : null}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <Metric label="Ciro" value={loading ? "..." : formatCurrency(stats.revenue)} valueClass="text-emerald-300" />
        <Metric label="Tahsilat" value={loading ? "..." : formatCurrency(stats.paid)} valueClass="text-blue-300" />
        <Metric label="Kalan" value={loading ? "..." : formatCurrency(stats.remaining)} valueClass="text-amber-300" />
        <Metric label="Sipariş" value={loading ? "..." : String(stats.orders)} valueClass="text-white" />
        <Metric label="Fatura" value={loading ? "..." : formatCurrency(stats.invoiceTotal)} valueClass="text-purple-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="En Çok Satan Ürünler">
          {topProducts.length === 0 ? <Empty /> : topProducts.map((item) => (
            <Row key={item.name} title={item.name} sub={`${item.qty} adet`} value={formatCurrency(item.revenue)} />
          ))}
        </Panel>

        <Panel title="En İyi Müşteriler">
          {topCustomers.length === 0 ? <Empty /> : topCustomers.map((item) => (
            <Row key={item.name} title={item.name} sub={`${item.orders} sipariş · kalan ${formatCurrency(item.remaining)}`} value={formatCurrency(item.revenue)} />
          ))}
        </Panel>

        <Panel title="Pazaryeri Dağılımı">
          {marketplaceBreakdown.length === 0 ? <Empty /> : marketplaceBreakdown.map((item) => (
            <Row key={item.name} title={item.name === "manuel" ? "Manuel" : item.name} sub={`${item.count} sipariş`} value={formatCurrency(item.revenue)} />
          ))}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <Mini title="Toplam Müşteri" value={String(stats.customers)} />
        <Mini title="Toplam Ürün" value={String(stats.products)} />
        <Mini title="İade Kaydı" value={String(stats.returns)} />
        <Mini title="Pazaryeri Cirosu" value={formatCurrency(stats.marketplaceRevenue)} />
      </div>

      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <h2 className="text-2xl font-black">Son Siparişler</h2>
        <div className="mt-4 grid gap-2">
          {filteredOrders.slice(0, 10).map((order) => (
            <div key={order.id} className="rounded-2xl bg-[#0b1220] p-4 ring-1 ring-white/10">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-black">{order.order_no || "Sipariş"} · {order.customer_name || "Müşteri yok"}</p>
                  <p className="mt-1 text-xs text-slate-500">{order.product_name || "Ürün yok"} · {formatDate(order.created_at)}</p>
                </div>
                <p className="font-black text-emerald-300">{formatCurrency(order.total_amount)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={["mt-3 text-2xl font-black", valueClass || "text-white"].join(" ")}>{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
      <h2 className="mb-4 text-2xl font-black">{title}</h2>
      <div className="grid gap-2">{children}</div>
    </div>
  );
}

function Row({ title, sub, value }: { title: string; sub: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#0b1220] p-4 ring-1 ring-white/10">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-black">{title}</p>
          <p className="mt-1 text-xs text-slate-500">{sub}</p>
        </div>
        <p className="shrink-0 font-black text-emerald-300">{value}</p>
      </div>
    </div>
  );
}

function Mini({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-5">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function Empty() {
  return <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm font-bold text-slate-500">Veri yok.</div>;
}
