"use client";

import Link from "next/link";
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
  first_month_price?: number | null;
  monthly_price?: number | null;
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

type DashboardTask = {
  id: string;
  business_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  is_done: boolean | null;
  priority: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string | null;
};

type ChartRange = "7" | "15" | "30" | "90";

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

function formatCompactCurrency(value: number | null | undefined) {
  const numberValue = Number(value ?? 0);

  if (Math.abs(numberValue) >= 1000000) return `₺${(numberValue / 1000000).toFixed(1)}M`;
  if (Math.abs(numberValue) >= 1000) return `₺${(numberValue / 1000).toFixed(1)}K`;

  return formatCurrency(numberValue);
}

function formatDate(date: string | null | undefined) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
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

function rangeLabel(range: ChartRange) {
  if (range === "7") return "Son 7 gün";
  if (range === "15") return "Son 15 gün";
  if (range === "30") return "Son 30 gün";
  return "Son 3 ay";
}

export default function DashboardPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [chartRange, setChartRange] = useState<ChartRange>("7");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [taskSaving, setTaskSaving] = useState(false);

  async function fetchData() {
    setLoading(true);
    setMessage("");

    try {
      const ctx = await ensureBusinessForCurrentUser();
      setContext(ctx);

      const [ordersResult, paymentsResult, productsResult, returnsResult, tasksResult] = await Promise.all([
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
        supabase
          .from("dashboard_tasks")
          .select("*")
          .eq("business_id", ctx.business.id)
          .order("is_done", { ascending: true })
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

      if (tasksResult.error) {
        setMessage(`Notlar alınamadı: ${tasksResult.error.message}`);
        return;
      }

      setOrders((ordersResult.data ?? []) as Order[]);
      setPayments((paymentsResult.data ?? []) as Payment[]);
      setProducts((productsResult.data ?? []) as Product[]);
      setReturns((returnsResult.data ?? []) as ReturnItem[]);
      setTasks((tasksResult.data ?? []) as DashboardTask[]);
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

  async function addTask() {
    if (!context) return;

    const cleanTitle = taskTitle.trim();

    if (!cleanTitle) {
      setMessage("Not eklemek için kısa bir açıklama yazmalısın.");
      return;
    }

    setTaskSaving(true);

    const { error } = await supabase.from("dashboard_tasks").insert({
      business_id: context.business.id,
      created_by: context.userEmail,
      title: cleanTitle,
      priority: "normal",
      is_done: false,
    });

    if (error) {
      setMessage(`Not eklenemedi: ${error.message}`);
      setTaskSaving(false);
      return;
    }

    setTaskTitle("");
    setTaskSaving(false);
    await fetchData();
  }

  async function toggleTask(task: DashboardTask) {
    const { error } = await supabase
      .from("dashboard_tasks")
      .update({
        is_done: !task.is_done,
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id)
      .eq("business_id", task.business_id);

    if (error) {
      setMessage(`Not güncellenemedi: ${error.message}`);
      return;
    }

    await fetchData();
  }

  async function deleteTask(task: DashboardTask) {
    const { error } = await supabase
      .from("dashboard_tasks")
      .delete()
      .eq("id", task.id)
      .eq("business_id", task.business_id);

    if (error) {
      setMessage(`Not silinemedi: ${error.message}`);
      return;
    }

    await fetchData();
  }

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
    const waitingShipments = orders.filter((order) => order.shipping_status !== "shipped" && order.shipping_status !== "delivered").length;
    const activeTasks = tasks.filter((task) => !task.is_done).length;

    return {
      todayCash,
      todayCard,
      todayTransfer,
      todayMarketplace,
      todayTotal,
      totalRevenue,
      totalRemaining,
      marketplaceRevenue,
      criticalProducts,
      stockValue,
      activeReturns,
      waitingShipments,
      activeTasks,
    };
  }, [orders, payments, products, returns, tasks]);

  const chartData = useMemo(() => {
    const dayCount = Number(chartRange);
    const days = Array.from({ length: dayCount }).map((_, index) => {
      const day = new Date();
      day.setDate(day.getDate() - (dayCount - 1 - index));
      return day;
    });

    return days.map((day) => {
      const cash = payments
        .filter((payment) => payment.payment_method === "cash" && isSameDay(payment.payment_date || payment.created_at, day))
        .reduce((sum, payment) => sum + getPaymentAmount(payment), 0);

      const card = payments
        .filter((payment) => payment.payment_method === "card" && isSameDay(payment.payment_date || payment.created_at, day))
        .reduce((sum, payment) => sum + getPaymentAmount(payment), 0);

      const transfer = payments
        .filter((payment) => payment.payment_method === "transfer" && isSameDay(payment.payment_date || payment.created_at, day))
        .reduce((sum, payment) => sum + getPaymentAmount(payment), 0);

      const marketplace = orders
        .filter((order) => {
          return (
            isSameDay(order.created_at, day) &&
            order.payment_status === "paid" &&
            order.payment_method === "marketplace"
          );
        })
        .reduce((sum, order) => sum + getOrderPaidAmount(order), 0);

      return {
        day,
        label: chartRange === "90"
          ? new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit" }).format(day)
          : new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(day),
        cash,
        card,
        transfer,
        marketplace,
        total: cash + card + transfer + marketplace,
      };
    });
  }, [orders, payments, chartRange]);

  const maxChartValue = Math.max(...chartData.map((item) => item.total), 1);
  const latestOrders = orders.slice(0, 5);
  const criticalPreview = stats.criticalProducts.slice(0, 4);

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
    .slice(0, 4);

  const freeOrderLimit = Number(context?.subscription?.order_limit ?? 15);
  const isPro = context?.subscription?.plan === "pro" && context?.subscription?.status === "active";
  const usagePercent = isPro ? 100 : Math.min(Math.round((orders.length / freeOrderLimit) * 100), 100);
  const activeTasks = tasks.filter((task) => !task.is_done).slice(0, 5);
  const doneTasks = tasks.filter((task) => task.is_done).slice(0, 3);

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-3 pb-8 text-white">
      <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex rounded-full bg-blue-500/15 px-3 py-1.5 text-[11px] font-black text-blue-300">
              Live Dashboard
            </div>
            <h1 className="text-[28px] font-black tracking-[-0.05em] sm:text-4xl">
              {context?.business.name || "Takipio"} Paneli
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">
              Sipariş, tahsilat, stok, kargo, iade ve pazaryeri verilerini tek ekranda takip et.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/app/help" className="rounded-2xl bg-white/8 px-4 py-2.5 text-xs font-black text-slate-200 ring-1 ring-white/10 transition hover:bg-white/12">
              Nasıl Kullanılır?
            </Link>
            <Link href="/app/contact" className="rounded-2xl bg-white/8 px-4 py-2.5 text-xs font-black text-slate-200 ring-1 ring-white/10 transition hover:bg-white/12">
              İletişim / Destek
            </Link>
            <button onClick={fetchData} className="rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-blue-500">
              Yenile
            </button>
          </div>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <Metric label="Bugün" value={loading ? "..." : formatCompactCurrency(stats.todayTotal)} valueClass="text-emerald-300" />
        <Metric label="Toplam Ciro" value={loading ? "..." : formatCompactCurrency(stats.totalRevenue)} valueClass="text-blue-300" />
        <Metric label="Kalan" value={loading ? "..." : formatCompactCurrency(stats.totalRemaining)} valueClass="text-amber-300" />
        <Metric label="Stok Değeri" value={loading ? "..." : formatCompactCurrency(stats.stockValue)} valueClass="text-cyan-300" />
        <Metric label="Pazaryeri" value={loading ? "..." : formatCompactCurrency(stats.marketplaceRevenue)} valueClass="text-orange-300" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-4">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-black">Tahsilat Akışı</h2>
              <p className="mt-1 text-xs text-slate-400">Nakit, kart, havale ve pazaryeri ödemeleri aynı grafikte.</p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap justify-end gap-1.5">
                {(["7", "15", "30", "90"] as ChartRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setChartRange(range)}
                    className={`rounded-xl px-3 py-1.5 text-[11px] font-black transition ${
                      chartRange === range
                        ? "bg-blue-600 text-white"
                        : "bg-white/8 text-slate-400 ring-1 ring-white/10 hover:text-white"
                    }`}
                  >
                    {rangeLabel(range)}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <TinyMoney label="Nakit" value={stats.todayCash} className="text-emerald-300" />
                <TinyMoney label="Kart" value={stats.todayCard} className="text-blue-300" />
                <TinyMoney label="Havale" value={stats.todayTransfer} className="text-cyan-300" />
                <TinyMoney label="Pazaryeri" value={stats.todayMarketplace} className="text-orange-300" />
              </div>
            </div>
          </div>

          <div className="rounded-[20px] bg-[#0b1220] p-4 ring-1 ring-white/10">
            <div className="flex h-56 items-end gap-1.5 overflow-x-auto pb-1">
              {chartData.map((item, index) => {
                const totalHeight = Math.max(Math.round((item.total / maxChartValue) * 100), item.total > 0 ? 8 : 3);
                const cashHeight = item.total > 0 ? Math.max((item.cash / item.total) * totalHeight, item.cash > 0 ? 4 : 0) : 0;
                const cardHeight = item.total > 0 ? Math.max((item.card / item.total) * totalHeight, item.card > 0 ? 4 : 0) : 0;
                const transferHeight = item.total > 0 ? Math.max((item.transfer / item.total) * totalHeight, item.transfer > 0 ? 4 : 0) : 0;
                const marketplaceHeight = item.total > 0 ? Math.max((item.marketplace / item.total) * totalHeight, item.marketplace > 0 ? 4 : 0) : 0;

                return (
                  <div key={`${item.day.toISOString()}-${index}`} className="group flex min-w-[28px] flex-1 flex-col items-center gap-2">
                    <div className="relative flex h-40 w-full items-end rounded-2xl bg-white/[0.03] p-1 ring-1 ring-white/5">
                      <div
                        className="flex w-full flex-col-reverse overflow-hidden rounded-xl bg-white/5 shadow-lg shadow-blue-950/20 transition duration-300 group-hover:scale-[1.03]"
                        title={`${item.label}: ${formatCurrency(item.total)}`}
                        style={{ height: `${totalHeight}%` }}
                      >
                        {cashHeight > 0 ? <span className="block w-full bg-emerald-400" style={{ height: `${cashHeight}%` }} /> : null}
                        {cardHeight > 0 ? <span className="block w-full bg-blue-400" style={{ height: `${cardHeight}%` }} /> : null}
                        {transferHeight > 0 ? <span className="block w-full bg-cyan-400" style={{ height: `${transferHeight}%` }} /> : null}
                        {marketplaceHeight > 0 ? <span className="block w-full bg-orange-400" style={{ height: `${marketplaceHeight}%` }} /> : null}
                      </div>

                      <div className="pointer-events-none absolute -top-12 left-1/2 z-10 hidden -translate-x-1/2 rounded-2xl bg-[#020817] px-3 py-2 text-[10px] font-black text-white shadow-2xl ring-1 ring-white/10 group-hover:block">
                        {formatCurrency(item.total)}
                      </div>
                    </div>

                    <p className="text-[10px] font-black text-slate-500">{chartRange === "90" && index % 5 !== 0 ? "·" : item.label}</p>
                    <p className="max-w-full truncate text-[10px] font-bold text-slate-400">{formatCompactCurrency(item.total)}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] font-black text-slate-400">
              <Legend colorClass="bg-emerald-400" label="Nakit" />
              <Legend colorClass="bg-blue-400" label="Kart" />
              <Legend colorClass="bg-cyan-400" label="Havale" />
              <Legend colorClass="bg-orange-400" label="Pazaryeri" />
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <CompactCard title="Eksik İşlemler">
            <ActionLink href="/app/orders" title="Bekleyen tahsilat" value={formatCompactCurrency(stats.totalRemaining)} tone="amber" />
            <ActionLink href="/app/shipments" title="Kargo bekleyen" value={String(stats.waitingShipments)} tone="blue" />
            <ActionLink href="/app/returns" title="Aktif iade" value={String(stats.activeReturns)} tone="red" />
          </CompactCard>

          <Link href="/app/billing" className="block rounded-[22px] border border-blue-400/20 bg-blue-500/10 p-4 transition hover:-translate-y-0.5 hover:bg-blue-500/15">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-black">Abonelik</h2>
              <span className={isPro ? "rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-black text-emerald-300" : "rounded-full bg-blue-400/15 px-3 py-1 text-[11px] font-black text-blue-300"}>
                {isPro ? "PRO" : "FREE"}
              </span>
            </div>

            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-400">
                  {isPro ? "Limitsiz kullanım aktif" : `Sipariş kullanımı: ${orders.length}/${freeOrderLimit}`}
                </p>
                <p className="mt-1 text-[11px] font-bold text-slate-500">
                  {isPro ? "Tüm premium modüller açık." : `Kalan hak: ${Math.max(freeOrderLimit - orders.length, 0)} sipariş`}
                </p>
              </div>
              <p className="text-xl font-black text-white">
                {isPro ? "₺99/ay" : "₺89 ilk ay"}
              </p>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
              <div className={`${isPro ? "bg-emerald-400" : "bg-blue-500"} h-full rounded-full`} style={{ width: `${usagePercent}%` }} />
            </div>

            <p className="mt-3 text-[11px] font-black text-blue-200">
              Abonelik sayfasına git →
            </p>
          </Link>

          <CompactCard title={`Notlar / Görevler (${stats.activeTasks})`}>
            <div className="flex gap-2">
              <input
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") addTask();
                }}
                placeholder="Kısa not ekle..."
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0b1220] px-3 py-2 text-xs font-bold text-white outline-none placeholder:text-slate-600"
              />
              <button
                onClick={addTask}
                disabled={taskSaving}
                className="rounded-2xl bg-blue-600 px-3 py-2 text-xs font-black text-white transition hover:bg-blue-500 disabled:opacity-50"
              >
                Ekle
              </button>
            </div>

            <div className="mt-3 grid max-h-[190px] gap-2 overflow-y-auto pr-1">
              {activeTasks.length === 0 && doneTasks.length === 0 ? (
                <EmptyMini text="Henüz not yok." />
              ) : null}

              {activeTasks.map((task) => (
                <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task)} onDelete={() => deleteTask(task)} />
              ))}

              {doneTasks.map((task) => (
                <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task)} onDelete={() => deleteTask(task)} />
              ))}
            </div>
          </CompactCard>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">Stok Uyarıları</h2>
              <p className="mt-1 text-xs text-slate-400">Kritik ürünleri küçük listede takip et.</p>
            </div>
            <Link href="/app/products" className="rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-black text-amber-300 ring-1 ring-amber-400/20">
              {stats.criticalProducts.length} kritik
            </Link>
          </div>

          {criticalPreview.length === 0 ? (
            <EmptyMini text="Kritik stok yok." />
          ) : (
            <div className="grid gap-2">
              {criticalPreview.map((product) => (
                <div key={product.id} className="rounded-2xl bg-[#0b1220] px-3 py-2.5 ring-1 ring-white/10">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{product.name}</p>
                      <p className="mt-1 text-[11px] font-bold text-slate-500">Min: {product.min_stock ?? 0} · Mevcut: {product.stock ?? 0}</p>
                    </div>
                    <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-black text-amber-300">Kritik</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">Son Hareketler</h2>
              <p className="mt-1 text-xs text-slate-400">Sipariş ve tahsilat akışı.</p>
            </div>
            <span className="rounded-full bg-white/8 px-3 py-1 text-[11px] font-black text-slate-300 ring-1 ring-white/10">
              Canlı
            </span>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="grid gap-2">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Son Siparişler</p>
              {latestOrders.length === 0 ? (
                <EmptyMini text="Sipariş yok." />
              ) : (
                latestOrders.map((order) => (
                  <div key={order.id} className="rounded-2xl bg-[#0b1220] px-3 py-2.5 ring-1 ring-white/10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-black">{order.order_no || "-"}</p>
                          {getMarketplaceLabel(order.marketplace) ? (
                            <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[9px] font-black text-orange-300">{getMarketplaceLabel(order.marketplace)}</span>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-[11px] font-bold text-slate-500">{order.customer_name || "Müşteri yok"}</p>
                      </div>
                      <p className="text-sm font-black text-emerald-300">{formatCompactCurrency(order.total_amount)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="grid gap-2">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Para Hareketleri</p>
              {latestMoneyMoves.length === 0 ? (
                <EmptyMini text="Tahsilat yok." />
              ) : (
                latestMoneyMoves.map((move) => (
                  <div key={move.id} className="rounded-2xl bg-[#0b1220] px-3 py-2.5 ring-1 ring-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">{move.title}</p>
                        <p className={`mt-1 text-[11px] font-black ${methodClass(move.method)}`}>{move.subtitle}</p>
                      </div>
                      <p className={`text-sm font-black ${methodClass(move.method)}`}>{formatCompactCurrency(move.amount)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-[#111a2e] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={["mt-2 text-xl font-black sm:text-2xl", valueClass || "text-white"].join(" ")}>{value}</p>
    </div>
  );
}

function TinyMoney({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="min-w-[92px] rounded-2xl border border-white/10 bg-[#0b1220] px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-black ${className}`}>{formatCompactCurrency(value)}</p>
    </div>
  );
}

function Legend({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${colorClass}`} />
      {label}
    </span>
  );
}

function CompactCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-4">
      <h2 className="mb-3 text-lg font-black">{title}</h2>
      {children}
    </div>
  );
}

function ActionLink({ href, title, value, tone }: { href: string; title: string; value: string; tone: "amber" | "blue" | "red" }) {
  const toneClass =
    tone === "amber"
      ? "text-amber-300 bg-amber-500/10 ring-amber-400/20"
      : tone === "blue"
        ? "text-blue-300 bg-blue-500/10 ring-blue-400/20"
        : "text-red-300 bg-red-500/10 ring-red-400/20";

  return (
    <Link href={href} className="mb-2 flex items-center justify-between rounded-2xl bg-[#0b1220] px-3 py-2.5 ring-1 ring-white/10 transition hover:bg-white/8 last:mb-0">
      <p className="text-xs font-black text-slate-300">{title}</p>
      <span className={`rounded-xl px-2.5 py-1 text-xs font-black ring-1 ${toneClass}`}>{value}</span>
    </Link>
  );
}

function TaskRow({ task, onToggle, onDelete }: { task: DashboardTask; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className={`flex items-center gap-2 rounded-2xl px-3 py-2 ring-1 ${task.is_done ? "bg-emerald-500/10 ring-emerald-400/20" : "bg-[#0b1220] ring-white/10"}`}>
      <button
        onClick={onToggle}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
          task.is_done ? "bg-emerald-400 text-[#020817]" : "bg-white/8 text-slate-500 ring-1 ring-white/10"
        }`}
        title="Tamamlandı işaretle"
      >
        {task.is_done ? "✓" : ""}
      </button>

      <button onClick={onToggle} className="min-w-0 flex-1 text-left">
        <p className={`truncate text-xs font-black ${task.is_done ? "text-emerald-200 line-through" : "text-white"}`}>
          {task.title}
        </p>
        <p className="mt-0.5 text-[10px] font-bold text-slate-600">{formatDate(task.created_at)}</p>
      </button>

      <button onClick={onDelete} className="rounded-xl bg-red-500/10 px-2 py-1 text-[10px] font-black text-red-300 ring-1 ring-red-400/20">
        Sil
      </button>
    </div>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-[#0b1220] p-4 text-center">
      <p className="text-xs font-bold text-slate-500">{text}</p>
    </div>
  );
}
