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
  can_view_dashboard?: boolean | null;
  can_manage_sales?: boolean | null;
  can_manage_invoices?: boolean | null;
  can_manage_customers?: boolean | null;
  can_manage_integrations?: boolean | null;
};

type Subscription = {
  id: string;
  business_id: string | null;
  plan: string | null;
  status: string | null;
  order_limit: number | null;
  first_month_price: number | null;
  monthly_price: number | null;
};

type BusinessContext = {
  userEmail: string;
  business: Business;
  member: BusinessMember;
  subscription: Subscription | null;
  isOwner: boolean;
  isPro: boolean;
};

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

async function getCurrentUserEmail() {
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

  if (error || !data) {
    throw new Error(`Owner yetkisi oluşturulamadı: ${error?.message ?? "Bilinmeyen hata"}`);
  }

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

  if (error || !data) {
    throw new Error(`Abonelik oluşturulamadı: ${error?.message ?? "Bilinmeyen hata"}`);
  }

  return data as Subscription;
}

async function ensureBusinessForCurrentUser() {
  const userEmail = await getCurrentUserEmail();

  if (!userEmail) {
    throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yap.");
  }

  const existingMember = await supabase
    .from("business_members")
    .select("*")
    .eq("email", userEmail)
    .eq("member_status", "active")
    .limit(1)
    .maybeSingle();

  if (existingMember.data?.business_id) {
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", existingMember.data.business_id)
      .single();

    if (businessError || !business) {
      throw new Error("İşletme bilgisi alınamadı.");
    }

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

  const { data: createdBusiness, error: businessError } = await supabase
    .from("businesses")
    .insert({
      owner_email: userEmail,
      name: "İşletmem",
      email: userEmail,
    })
    .select("*")
    .single();

  if (businessError || !createdBusiness) {
    throw new Error(`İşletme oluşturulamadı: ${businessError?.message ?? "Bilinmeyen hata"}`);
  }

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

function withBusinessFields(context: BusinessContext) {
  return {
    business_id: context.business.id,
    created_by: context.userEmail,
  };
}

function hasPermission(context: BusinessContext | null, key: keyof BusinessMember) {
  if (!context) return false;
  if (context.isOwner) return true;
  return Boolean(context.member[key]);
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

type Order = {
  id: string;
  marketplace: string | null;
  order_status: string | null;
  shipping_status: string | null;
  total_amount: number | null;
  created_at: string;
};

type ReturnItem = {
  id: string;
  marketplace: string | null;
  status: string | null;
  amount: number | null;
  created_at: string;
};

const marketplaces = [
  { key: "trendyol", name: "Trendyol" },
  { key: "hepsiburada", name: "Hepsiburada" },
  { key: "amazon", name: "Amazon" },
  { key: "ciceksepeti", name: "ÇiçekSepeti" },
];

function isToday(date: string) {
  const d = new Date(date);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function isThisWeek(date: string) {
  const d = new Date(date);
  const n = new Date();
  const diff = n.getTime() - d.getTime();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

export default function IntegrationsPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const canManage = hasPermission(context, "can_manage_integrations");

  async function fetchData() {
    setLoading(true);
    setMessage("");

    try {
      const ctx = await ensureBusinessForCurrentUser();
      setContext(ctx);

      const [ordersResult, returnsResult] = await Promise.all([
        supabase
          .from("orders")
          .select("id, marketplace, order_status, shipping_status, total_amount, created_at")
          .eq("business_id", ctx.business.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("returns")
          .select("id, marketplace, status, amount, created_at")
          .eq("business_id", ctx.business.id)
          .order("created_at", { ascending: false }),
      ]);

      if (ordersResult.error) {
        setMessage(`Siparişler alınamadı: ${ordersResult.error.message}`);
        return;
      }

      setOrders(ordersResult.data ?? []);
      setReturns(returnsResult.data ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "İşletme bağlantısı kurulamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    return marketplaces.map((marketplace) => {
      const marketOrders = orders.filter((order) => order.marketplace === marketplace.key);
      const marketReturns = returns.filter((item) => item.marketplace === marketplace.key);
      const revenue = marketOrders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0);
      const todayOrders = marketOrders.filter((order) => isToday(order.created_at));
      const weeklyOrders = marketOrders.filter((order) => isThisWeek(order.created_at));
      const shipped = marketOrders.filter((order) => order.shipping_status === "shipped" || order.shipping_status === "delivered").length;
      const waitingCargo = marketOrders.filter((order) => order.shipping_status !== "shipped" && order.shipping_status !== "delivered").length;
      const returnAmount = marketReturns.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);

      return {
        ...marketplace,
        orders: marketOrders.length,
        todayOrders: todayOrders.length,
        weeklyOrders: weeklyOrders.length,
        revenue,
        shipped,
        waitingCargo,
        returns: marketReturns.length,
        returnAmount,
      };
    });
  }, [orders, returns]);

  const topMarket = [...stats].sort((a, b) => b.revenue - a.revenue)[0];
  const totalRevenue = stats.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = stats.reduce((sum, item) => sum + item.orders, 0);
  const totalReturns = stats.reduce((sum, item) => sum + item.returns, 0);
  const maxRevenue = Math.max(...stats.map((item) => item.revenue), 1);

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Integrations Business Core v1
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Entegrasyonlar</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Pazaryeri karşılaştırmaları artık sadece aktif işletmenin sipariş ve iadelerinden hesaplanır.
            </p>
          </div>

          <button onClick={fetchData} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500">
            Yenile
          </button>
        </div>
      </div>

      {context ? (
        <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Aktif İşletme</p>
          <p className="mt-1 text-lg font-black">{context.business.name}</p>
        </div>
      ) : null}

      {message ? (
        <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">
          {message}
        </div>
      ) : null}

      {!canManage && !loading ? (
        <div className="rounded-[26px] border border-amber-500/20 bg-amber-500/10 p-6 text-sm font-bold text-amber-200">
          Bu işletmede entegrasyon yönetimi yetkin yok. Karşılaştırma özetini görebilirsin ama API bağlantıları Pro/yetki aşamasında açılacak.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Toplam Sipariş" value={String(totalOrders)} valueClass="text-white" />
        <Metric label="Toplam Ciro" value={formatCurrency(totalRevenue)} valueClass="text-blue-300" />
        <Metric label="Toplam İade" value={String(totalReturns)} valueClass="text-amber-300" />
        <Metric label="Lider Kanal" value={topMarket?.name || "-"} valueClass="text-emerald-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {stats.map((marketplace) => {
          const width = Math.round((marketplace.revenue / maxRevenue) * 100);

          return (
            <div key={marketplace.key} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-2xl font-black">{marketplace.name}</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Bu hafta {marketplace.weeklyOrders} sipariş · Bugün {marketplace.todayOrders} sipariş
                  </p>
                </div>

                <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-black text-slate-300">
                  API: Yakında
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <SmallMetric label="Sipariş" value={String(marketplace.orders)} />
                <SmallMetric label="Ciro" value={formatCurrency(marketplace.revenue)} />
                <SmallMetric label="Kargo Bekleyen" value={String(marketplace.waitingCargo)} />
                <SmallMetric label="İade" value={`${marketplace.returns} / ${formatCurrency(marketplace.returnAmount)}`} />
              </div>

              <div className="mt-5">
                <div className="mb-2 flex justify-between text-xs font-black">
                  <span className="text-slate-400">Ciro karşılaştırması</span>
                  <span className="text-blue-300">{formatCurrency(marketplace.revenue)}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${width}%` }} />
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-[#0b1220] p-4 ring-1 ring-white/10">
                <p className="text-sm font-black">Operasyon Notu</p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {marketplace.orders === 0
                    ? `${marketplace.name} tarafında henüz sipariş yok. API bağlandığında otomatik veriler buraya düşecek.`
                    : `${marketplace.name} üzerinde ${marketplace.waitingCargo} kargo bekleyen sipariş ve ${marketplace.returns} iade kaydı var.`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Metric({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-5">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={["mt-3 text-3xl font-black", valueClass || "text-white"].join(" ")}>{value}</p>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[#0b1220] p-4 ring-1 ring-white/10">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  );
}
