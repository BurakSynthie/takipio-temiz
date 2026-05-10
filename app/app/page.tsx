"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Business = {
  id: string;
  owner_email: string | null;
  name: string;
  email: string | null;
};

type BusinessMember = {
  id: string;
  business_id: string;
  email: string;
  role_name: string | null;
  member_status: string | null;
};

type Subscription = {
  id: string;
  business_id: string | null;
  plan: string | null;
  status: string | null;
  order_limit?: number | null;
};

type BusinessContext = {
  userEmail: string;
  business: Business;
  member: BusinessMember;
  subscription: Subscription | null;
  isOwner: boolean;
  isPro: boolean;
};

type Order = {
  id: string;
  order_no: string | null;
  customer_name: string | null;
  product_name: string | null;
  total_amount: number | null;
  paid_amount: number | null;
  remaining_amount: number | null;
  payment_status: string | null;
  payment_method: string | null;
  order_status: string | null;
  shipping_status: string | null;
  marketplace: string | null;
  created_at: string;
};

type Payment = {
  id: string;
  order_id: string | null;
  customer_name: string | null;
  payment_method: string | null;
  amount: number | null;
  payment_date: string | null;
  created_at: string;
};

type Product = {
  id: string;
  name: string;
  stock: number | null;
  min_stock: number | null;
  price: number | null;
};

type ReturnItem = {
  id: string;
  status: string | null;
  refund_amount: number | null;
  amount: number | null;
  created_at: string;
};

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

async function ensureOwnerMember(businessId: string, userEmail: string) {
  const { data: existing } = await supabase
    .from("business_members")
    .select("*")
    .eq("business_id", businessId)
    .eq("email", userEmail)
    .maybeSingle();

  if (existing) return existing as BusinessMember;

  const { data, error } = await supabase
    .from("business_members")
    .insert({
      business_id: businessId,
      email: userEmail,
      role_name: "Sahip",
      member_status: "active",
      can_view_dashboard: true,
      can_manage_products: true,
      can_manage_stock: true,
      can_manage_sales: true,
      can_manage_orders: true,
      can_manage_shipments: true,
      can_manage_returns: true,
      can_manage_invoices: true,
      can_manage_customers: true,
      can_manage_integrations: true,
      can_manage_billing: true,
      can_manage_settings: true,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(`Owner yetkisi oluşturulamadı: ${error?.message ?? "Bilinmeyen hata"}`);

  return data as BusinessMember;
}

async function ensureSubscription(businessId: string, userEmail: string) {
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing as Subscription;

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      business_id: businessId,
      user_email: userEmail,
      plan: "free",
      status: "trial",
      order_limit: 15,
      first_month_price: 89,
      monthly_price: 99,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(`Abonelik oluşturulamadı: ${error?.message ?? "Bilinmeyen hata"}`);

  return data as Subscription;
}

async function ensureBusinessForCurrentUser() {
  const userEmail = await getCurrentUserEmail();

  if (!userEmail) throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yap.");

  const existingMember = await supabase
    .from("business_members")
    .select("*")
    .eq("email", userEmail)
    .eq("member_status", "active")
    .limit(1)
    .maybeSingle();

  if (existingMember.data?.business_id) {
    const { data: business, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", existingMember.data.business_id)
      .single();

    if (error || !business) throw new Error("İşletme bilgisi alınamadı.");

    const subscription = await ensureSubscription(business.id, userEmail);

    return {
      userEmail,
      business,
      member: existingMember.data,
      subscription,
      isOwner: normalizeEmail(business.owner_email) === userEmail,
      isPro: subscription?.plan === "pro" && subscription?.status === "active",
    } satisfies BusinessContext;
  }

  const existingBusiness = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_email", userEmail)
    .limit(1)
    .maybeSingle();

  if (existingBusiness.data) {
    const ownerMember = await ensureOwnerMember(existingBusiness.data.id, userEmail);
    const subscription = await ensureSubscription(existingBusiness.data.id, userEmail);

    return {
      userEmail,
      business: existingBusiness.data,
      member: ownerMember,
      subscription,
      isOwner: true,
      isPro: subscription?.plan === "pro" && subscription?.status === "active",
    } satisfies BusinessContext;
  }

  const { data: createdBusiness, error } = await supabase
    .from("businesses")
    .insert({ owner_email: userEmail, name: "İşletmem", email: userEmail })
    .select("*")
    .single();

  if (error || !createdBusiness) throw new Error(`İşletme oluşturulamadı: ${error?.message ?? "Bilinmeyen hata"}`);

  const ownerMember = await ensureOwnerMember(createdBusiness.id, userEmail);
  const subscription = await ensureSubscription(createdBusiness.id, userEmail);

  return {
    userEmail,
    business: createdBusiness,
    member: ownerMember,
    subscription,
    isOwner: true,
    isPro: false,
  } satisfies BusinessContext;
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatDate(date: string | null | undefined) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function isToday(date: string | null | undefined) {
  if (!date) return false;

  const current = new Date(date);
  const now = new Date();

  return (
    current.getFullYear() === now.getFullYear() &&
    current.getMonth() === now.getMonth() &&
    current.getDate() === now.getDate()
  );
}

function isSameDay(date: string | null | undefined, target: Date) {
  if (!date) return false;

  const current = new Date(date);

  return (
    current.getFullYear() === target.getFullYear() &&
    current.getMonth() === target.getMonth() &&
    current.getDate() === target.getDate()
  );
}

function getOrderPaidAmount(order: Order) {
  return Number(order.paid_amount ?? 0);
}

function getPaymentAmount(payment: Payment) {
  return Number(payment.amount ?? 0);
}

function getMarketplaceLabel(marketplace: string | null | undefined) {
  if (marketplace === "trendyol") return "Trendyol";
  if (marketplace === "hepsiburada") return "Hepsiburada";
  if (marketplace === "amazon") return "Amazon";
  if (marketplace === "ciceksepeti") return "ÇiçekSepeti";
  return null;
}

function methodLabel(method: string | null | undefined) {
  if (method === "cash") return "Nakit";
  if (method === "card") return "Kart";
  if (method === "transfer") return "Havale";
  if (method === "marketplace") return "Pazaryeri";
  return "Diğer";
}

function methodClass(method: string | null | undefined) {
  if (method === "cash") return "text-emerald-300";
  if (method === "card") return "text-blue-300";
  if (method === "transfer") return "text-cyan-300";
  if (method === "marketplace") return "text-orange-300";
  return "text-slate-300";
}

export default function DashboardPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    setMessage("");

    try {
      const ctx = await ensureBusinessForCurrentUser();
      setContext(ctx);

      const [ordersResult, paymentsResult, productsResult, returnsResult] = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .eq("business_id", ctx.business.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("payments")
          .select("*")
          .eq("business_id", ctx.business.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("products")
          .select("id, name, stock, min_stock, price")
          .eq("business_id", ctx.business.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("returns")
          .select("id, status, refund_amount, amount, created_at")
          .eq("business_id", ctx.business.id)
          .order("created_at", { ascending: false }),
      ]);

      if (ordersResult.error) {
        setMessage(`Siparişler alınamadı: ${ordersResult.error.message}`);
        return;
      }

      if (paymentsResult.error) {
        setMessage(`Ödemeler alınamadı: ${paymentsResult.error.message}`);
        return;
      }

      if (productsResult.error) {
        setMessage(`Ürünler alınamadı: ${productsResult.error.message}`);
        return;
      }

      if (returnsResult.error) {
        setMessage(`İadeler alınamadı: ${returnsResult.error.message}`);
        return;
      }

      setOrders((ordersResult.data ?? []) as Order[]);
      setPayments((paymentsResult.data ?? []) as Payment[]);
      setProducts((productsResult.data ?? []) as Product[]);
      setReturns((returnsResult.data ?? []) as ReturnItem[]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Dashboard verisi alınamadı.";

      if (errorMessage.includes("Oturum bulunamadı")) {
        window.location.replace("/login");
        return;
      }

      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const todayPayments = payments.filter((payment) => isToday(payment.payment_date || payment.created_at));
    const todayMarketplaceOrders = orders.filter((order) => {
      return (
        isToday(order.created_at) &&
        order.payment_status === "paid" &&
        order.payment_method === "marketplace"
      );
    });

    const todayCash = todayPayments
      .filter((payment) => payment.payment_method === "cash")
      .reduce((sum, payment) => sum + getPaymentAmount(payment), 0);

    const todayCard = todayPayments
      .filter((payment) => payment.payment_method === "card")
      .reduce((sum, payment) => sum + getPaymentAmount(payment), 0);

    const todayTransfer = todayPayments
      .filter((payment) => payment.payment_method === "transfer")
      .reduce((sum, payment) => sum + getPaymentAmount(payment), 0);

    const todayMarketplace = todayMarketplaceOrders.reduce((sum, order) => sum + getOrderPaidAmount(order), 0);

    const todayTotal = todayCash + todayCard + todayTransfer + todayMarketplace;

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0);
    const totalPaidFromOrders = orders.reduce((sum, order) => sum + Number(order.paid_amount ?? 0), 0);
    const totalRemaining = orders.reduce((sum, order) => sum + Number(order.remaining_amount ?? 0), 0);

    const marketplaceRevenue = orders
      .filter((order) => Boolean(order.marketplace))
      .reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0);

    const criticalProducts = products.filter((product) => {
      const minStock = Number(product.min_stock ?? 0);
      return minStock > 0 && Number(product.stock ?? 0) <= minStock;
    });

    const stockValue = products.reduce((sum, product) => {
      return sum + Number(product.stock ?? 0) * Number(product.price ?? 0);
    }, 0);

    const activeReturns = returns.filter((item) => item.status !== "refunded" && item.status !== "rejected").length;

    return {
      todayCash,
      todayCard,
      todayTransfer,
      todayMarketplace,
      todayTotal,
      totalRevenue,
      totalPaidFromOrders,
      totalRemaining,
      marketplaceRevenue,
      criticalProducts,
      stockValue,
      activeReturns,
    };
  }, [orders, payments, products, returns]);

  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, index) => {
      const day = new Date();
      day.setDate(day.getDate() - (6 - index));
      return day;
    });

    return days.map((day) => {
      const paymentTotal = payments
        .filter((payment) => isSameDay(payment.payment_date || payment.created_at, day))
        .reduce((sum, payment) => sum + getPaymentAmount(payment), 0);

      const marketplaceTotal = orders
        .filter((order) => {
          return (
            isSameDay(order.created_at, day) &&
            order.payment_status === "paid" &&
            order.payment_method === "marketplace"
          );
        })
        .reduce((sum, order) => sum + getOrderPaidAmount(order), 0);

      const total = paymentTotal + marketplaceTotal;

      return {
        day,
        label: new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(day),
        total,
      };
    });
  }, [orders, payments]);

  const maxChartValue = Math.max(...chartData.map((item) => item.total), 1);

  const latestOrders = orders.slice(0, 6);
  const latestMoneyMoves = [
    ...payments.map((payment) => ({
      id: `payment-${payment.id}`,
      title: payment.customer_name || "Tahsilat",
      subtitle: methodLabel(payment.payment_method),
      amount: getPaymentAmount(payment),
      date: payment.payment_date || payment.created_at,
      method: payment.payment_method,
    })),
    ...orders
      .filter((order) => order.payment_method === "marketplace" && order.payment_status === "paid")
      .map((order) => ({
        id: `order-${order.id}`,
        title: order.customer_name || getMarketplaceLabel(order.marketplace) || "Pazaryeri",
        subtitle: getMarketplaceLabel(order.marketplace) || "Pazaryeri",
        amount: Number(order.paid_amount ?? 0),
        date: order.created_at,
        method: "marketplace",
      })),
  ]
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
    .slice(0, 6);

  const freeOrderLimit = Number(context?.subscription?.order_limit ?? 15);
  const isPro = context?.subscription?.plan === "pro" && context?.subscription?.status === "active";
  const usagePercent = isPro ? 100 : Math.min(Math.round((orders.length / freeOrderLimit) * 100), 100);

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Live Dashboard
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">
              {context?.business.name || "Takipio"} Paneli
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Sipariş, tahsilat, stok, kargo, iade ve pazaryeri verilerini tek ekranda takip et.
            </p>
          </div>

          <button onClick={fetchData} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500">
            Yenile
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Bugün Tahsilat" value={loading ? "..." : formatCurrency(stats.todayTotal)} valueClass="text-emerald-300" />
        <Metric label="Toplam Ciro" value={loading ? "..." : formatCurrency(stats.totalRevenue)} valueClass="text-blue-300" />
        <Metric label="Kalan Tahsilat" value={loading ? "..." : formatCurrency(stats.totalRemaining)} valueClass="text-amber-300" />
        <Metric label="Stok Değeri" value={loading ? "..." : formatCurrency(stats.stockValue)} valueClass="text-cyan-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black">Tahsilat Grafiği</h2>
              <p className="mt-1 text-sm text-slate-400">
                Payments tablosu + pazaryeri/demo paid siparişleri birlikte hesaplanır.
              </p>
            </div>
            <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-black text-slate-300 ring-1 ring-white/10">
              Son 7 gün
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <MiniMoney label="Nakit" value={stats.todayCash} className="text-emerald-300" />
            <MiniMoney label="Kart" value={stats.todayCard} className="text-blue-300" />
            <MiniMoney label="Havale" value={stats.todayTransfer} className="text-cyan-300" />
            <MiniMoney label="Pazaryeri" value={stats.todayMarketplace} className="text-orange-300" />
          </div>

          <div className="mt-6 flex h-64 items-end gap-3 rounded-[24px] bg-[#0b1220] p-4 ring-1 ring-white/10">
            {chartData.map((item) => {
              const height = Math.max(Math.round((item.total / maxChartValue) * 100), item.total > 0 ? 8 : 3);

              return (
                <div key={item.day.toISOString()} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="flex h-48 w-full items-end">
                    <div
                      className="w-full rounded-t-2xl bg-gradient-to-t from-blue-700 to-cyan-300 shadow-lg shadow-blue-950/30 transition"
                      style={{ height: `${height}%` }}
                      title={formatCurrency(item.total)}
                    />
                  </div>
                  <p className="text-[11px] font-black text-slate-500">{item.label}</p>
                  <p className="max-w-full truncate text-[10px] font-bold text-slate-400">{formatCurrency(item.total)}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
            <h2 className="text-2xl font-black">Bugünkü Dağılım</h2>
            <div className="mt-5 grid gap-3">
              <Distribution label="Nakit" value={stats.todayCash} total={stats.todayTotal} colorClass="bg-emerald-400" />
              <Distribution label="Kart" value={stats.todayCard} total={stats.todayTotal} colorClass="bg-blue-400" />
              <Distribution label="Havale" value={stats.todayTransfer} total={stats.todayTotal} colorClass="bg-cyan-400" />
              <Distribution label="Pazaryeri" value={stats.todayMarketplace} total={stats.todayTotal} colorClass="bg-orange-400" />
            </div>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
            <h2 className="text-2xl font-black">Abonelik Kullanımı</h2>
            <p className="mt-2 text-sm text-slate-400">
              {isPro ? "Pro plan aktif. Sipariş limiti yok." : `Free plan: ${orders.length}/${freeOrderLimit} sipariş`}
            </p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/8">
              <div className={`${isPro ? "bg-emerald-400" : "bg-blue-500"} h-full rounded-full`} style={{ width: `${usagePercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black">Son Siparişler</h2>
              <p className="mt-1 text-sm text-slate-400">Manuel + demo + pazaryeri siparişleri.</p>
            </div>
            <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-black text-slate-300 ring-1 ring-white/10">
              {orders.length} kayıt
            </span>
          </div>

          {latestOrders.length === 0 ? (
            <EmptyState text="Henüz sipariş yok." />
          ) : (
            <div className="grid gap-3">
              {latestOrders.map((order) => (
                <div key={order.id} className="rounded-[20px] border border-white/10 bg-[#0b1220] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black">{order.order_no || "-"}</h3>
                        {getMarketplaceLabel(order.marketplace) ? (
                          <span className="rounded-full bg-orange-500/15 px-2.5 py-1 text-[10px] font-black text-orange-300 ring-1 ring-orange-400/20">
                            {getMarketplaceLabel(order.marketplace)}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-400">{order.customer_name || "Müşteri yok"} · {order.product_name || "Ürün yok"}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="text-left lg:text-right">
                      <p className="text-lg font-black text-emerald-300">{formatCurrency(order.total_amount)}</p>
                      <p className="text-xs font-bold text-slate-500">{order.payment_status || "payment"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-5">
            <h2 className="text-2xl font-black">Son Para Hareketleri</h2>
            <p className="mt-1 text-sm text-slate-400">Payments + pazaryeri paid siparişleri birlikte gösterilir.</p>
          </div>

          {latestMoneyMoves.length === 0 ? (
            <EmptyState text="Henüz tahsilat hareketi yok." />
          ) : (
            <div className="grid gap-3">
              {latestMoneyMoves.map((move) => (
                <div key={move.id} className="rounded-[20px] border border-white/10 bg-[#0b1220] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-black">{move.title}</p>
                      <p className={`mt-1 text-xs font-black ${methodClass(move.method)}`}>{move.subtitle}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(move.date)}</p>
                    </div>
                    <p className={`text-lg font-black ${methodClass(move.method)}`}>{formatCurrency(move.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatusCard title="Kritik Stok" value={String(stats.criticalProducts.length)} text="Minimum stoğa yaklaşan ürünler" colorClass="text-amber-300" />
        <StatusCard title="Aktif İade" value={String(stats.activeReturns)} text="Para iadesi/reddedilme bekleyenler" colorClass="text-red-300" />
        <StatusCard title="Pazaryeri Cirosu" value={formatCurrency(stats.marketplaceRevenue)} text="Demo + gerçek pazaryeri siparişleri" colorClass="text-orange-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black">Stok Uyarıları</h2>
              <p className="mt-1 text-sm text-slate-400">Minimum stok seviyesine yaklaşan ürünler burada görünür.</p>
            </div>
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-300 ring-1 ring-amber-400/20">
              {stats.criticalProducts.length} kritik
            </span>
          </div>

          {stats.criticalProducts.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-white/10 bg-[#0b1220] p-8 text-center">
              <p className="text-sm font-bold text-slate-500">Şu an kritik stok uyarısı yok. Stok tarafı temiz görünüyor.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {stats.criticalProducts.slice(0, 6).map((product) => (
                <div key={product.id} className="rounded-[20px] border border-amber-400/15 bg-amber-500/10 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-black text-white">{product.name}</p>
                      <p className="mt-1 text-xs font-bold text-amber-200/80">
                        Minimum: {product.min_stock ?? 0} · Mevcut: {product.stock ?? 0}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-black text-amber-300">
                      Kritik
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-5">
            <h2 className="text-2xl font-black">Nasıl Kullanılır?</h2>
            <p className="mt-1 text-sm text-slate-400">Takipio panelini hızlı kullanmak için kısa yol akışı.</p>
          </div>

          <div className="grid gap-3">
            <HowToStep
              number="01"
              title="Ürünlerini ekle"
              text="Ürün adı, stok, minimum stok ve satış fiyatını gir. İstersen ürün görseli de yükle."
            />
            <HowToStep
              number="02"
              title="Sipariş oluştur veya demo import kullan"
              text="Manuel sipariş ekleyebilir ya da Entegrasyonlar sayfasından demo pazaryeri siparişleri oluşturabilirsin."
            />
            <HowToStep
              number="03"
              title="Tahsilatı takip et"
              text="Nakit, kart, havale ve pazaryeri ödemeleri dashboard üzerinde ayrı ayrı görünür."
            />
            <HowToStep
              number="04"
              title="Kargo ve iade sürecini yönet"
              text="Kargo takip numarası gir, teslim durumunu güncelle, gerekirse iade talebi oluştur."
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-5">
            <h2 className="text-2xl font-black">Eksik İşlemler</h2>
            <p className="mt-1 text-sm text-slate-400">Bekleyen ödeme, kargo ve iade aksiyonlarını hızlı gör.</p>
          </div>

          <div className="grid gap-3">
            <ActionRow
              title="Bekleyen Tahsilat"
              value={formatCurrency(stats.totalRemaining)}
              text="Kısmi veya ödenmemiş siparişlerden kalan tutar."
              tone="amber"
            />
            <ActionRow
              title="Kargo Bekleyen"
              value={String(orders.filter((order) => order.shipping_status !== "shipped" && order.shipping_status !== "delivered").length)}
              text="Henüz kargoya verilmemiş veya hazırlıkta görünen siparişler."
              tone="blue"
            />
            <ActionRow
              title="Aktif İade"
              value={String(stats.activeReturns)}
              text="Para iadesi ya da red kararı bekleyen iade kayıtları."
              tone="red"
            />
          </div>
        </div>

        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-5">
            <h2 className="text-2xl font-black">Gorki Hızlı Sorular</h2>
            <p className="mt-1 text-sm text-slate-400">Sağ alttaki Gorki’ye bu soruları yazabilirsin.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Bugünkü özeti göster",
              "Kritik stok var mı?",
              "Bekleyen ödemeler",
              "Kargo bekleyenler",
              "İadeleri özetle",
              "Son siparişleri göster",
            ].map((question) => (
              <div key={question} className="rounded-2xl bg-[#0b1220] px-4 py-3 text-sm font-black text-blue-100 ring-1 ring-white/10">
                {question}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-5">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={["mt-3 text-2xl font-black sm:text-3xl", valueClass || "text-white"].join(" ")}>{value}</p>
    </div>
  );
}

function MiniMoney({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-[#0b1220] p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={`mt-2 text-xl font-black ${className}`}>{formatCurrency(value)}</p>
    </div>
  );
}

function Distribution({ label, value, total, colorClass }: { label: string; value: number; total: number; colorClass: string }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-black">
        <span>{label}</span>
        <span className="text-slate-400">{formatCurrency(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/8">
        <div className={`${colorClass} h-full rounded-full`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-white/10 bg-[#0b1220] p-8 text-center">
      <p className="text-sm font-bold text-slate-500">{text}</p>
    </div>
  );
}

function HowToStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-[#0b1220] p-4">
      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-xs font-black text-blue-300 ring-1 ring-blue-400/20">
          {number}
        </div>
        <div>
          <p className="font-black text-white">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>
        </div>
      </div>
    </div>
  );
}

function ActionRow({
  title,
  value,
  text,
  tone,
}: {
  title: string;
  value: string;
  text: string;
  tone: "amber" | "blue" | "red";
}) {
  const toneClass =
    tone === "amber"
      ? "text-amber-300 bg-amber-500/10 ring-amber-400/20"
      : tone === "blue"
        ? "text-blue-300 bg-blue-500/10 ring-blue-400/20"
        : "text-red-300 bg-red-500/10 ring-red-400/20";

  return (
    <div className="rounded-[20px] border border-white/10 bg-[#0b1220] p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-black text-white">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>
        </div>
        <span className={`shrink-0 rounded-2xl px-3 py-2 text-sm font-black ring-1 ${toneClass}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

function StatusCard({ title, value, text, colorClass }: { title: string; value: string; text: string; colorClass: string }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <p className={`mt-3 text-3xl font-black ${colorClass}`}>{value}</p>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </div>
  );
}
