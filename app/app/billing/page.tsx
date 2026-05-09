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
  can_manage_billing?: boolean | null;
};

type Subscription = {
  id: string;
  business_id: string | null;
  user_email: string | null;
  plan: string | null;
  status: string | null;
  order_limit: number | null;
  first_month_price: number | null;
  monthly_price: number | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  created_at: string;
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
  total_amount: number | null;
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
      current_period_start: new Date().toISOString(),
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
  }).format(new Date(date));
}

export default function BillingPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const subscription = context?.subscription ?? null;
  const isPro = subscription?.plan === "pro" && subscription?.status === "active";
  const orderLimit = Number(subscription?.order_limit ?? 15);
  const orderCount = orders.length;
  const remainingOrders = isPro ? "Sınırsız" : Math.max(orderLimit - orderCount, 0);
  const usagePercentage = isPro ? 100 : Math.min(Math.round((orderCount / orderLimit) * 100), 100);
  const canManage = Boolean(context?.isOwner || context?.member.can_manage_billing);

  const revenue = useMemo(() => orders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0), [orders]);

  async function fetchData() {
    setLoading(true);
    setMessage("");

    try {
      const ctx = await ensureBusinessForCurrentUser();
      setContext(ctx);

      const ordersResult = await supabase
        .from("orders")
        .select("id, total_amount, created_at")
        .eq("business_id", ctx.business.id)
        .order("created_at", { ascending: false });

      if (ordersResult.error) {
        setMessage(`Sipariş verisi alınamadı: ${ordersResult.error.message}`);
        return;
      }

      setOrders(ordersResult.data ?? []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Abonelik verisi alınamadı.";

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

  async function updatePlan(nextPlan: "free" | "pro") {
    if (!context?.subscription || !canManage) return;

    setSaving(true);
    setMessage("");

    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const payload =
      nextPlan === "pro"
        ? {
            plan: "pro",
            status: "active",
            order_limit: 999999,
            current_period_start: now.toISOString(),
            current_period_end: nextMonth.toISOString(),
            updated_at: now.toISOString(),
          }
        : {
            plan: "free",
            status: "trial",
            order_limit: 15,
            current_period_start: now.toISOString(),
            current_period_end: null,
            updated_at: now.toISOString(),
          };

    const { error } = await supabase
      .from("subscriptions")
      .update(payload)
      .eq("business_id", context.business.id)
      .eq("id", context.subscription.id);

    if (error) {
      setMessage(`Plan güncellenemedi: ${error.message}`);
      setSaving(false);
      return;
    }

    setMessage(nextPlan === "pro" ? "Demo Pro plan aktif edildi." : "Free plana dönüldü.");
    setSaving(false);
    await fetchData();
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Billing / Subscription v6
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Abonelik</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Free sipariş limitini takip et, Pro plana geç ve Takipio kullanımını yönet.
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

      <div className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <div className="rounded-[28px] border border-white/10 bg-[#111a2e] p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Mevcut Plan</p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                {loading ? "Yükleniyor" : isPro ? "Takipio Pro" : "Takipio Free"}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                {isPro
                  ? "Pro plan aktif. Sipariş limiti olmadan tüm operasyon modüllerini kullanabilirsin."
                  : "Free planda 15 siparişe kadar Takipio’yu deneyebilirsin. Limit dolunca yeni sipariş için Pro plana geçmen gerekir."}
              </p>
            </div>

            <span className={`rounded-full px-4 py-2 text-xs font-black ${
              isPro ? "bg-emerald-400/15 text-emerald-300" : "bg-blue-400/15 text-blue-300"
            }`}>
              {isPro ? "PRO AKTİF" : "FREE DENEME"}
            </span>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="Sipariş" value={String(orderCount)} valueClass="text-blue-300" />
            <Metric label="Kalan Hak" value={String(remainingOrders)} valueClass={isPro ? "text-emerald-300" : "text-amber-300"} />
            <Metric label="Ciro" value={formatCurrency(revenue)} valueClass="text-cyan-300" />
            <Metric label="Dönem Sonu" value={formatDate(subscription?.current_period_end)} valueClass="text-slate-200" />
          </div>

          <div className="mt-7 rounded-[22px] bg-[#0b1220] p-5 ring-1 ring-white/10">
            <div className="mb-2 flex justify-between text-sm font-black">
              <span>{isPro ? "Pro kullanım" : `Free kullanım: ${orderCount}/${orderLimit}`}</span>
              <span>{usagePercentage}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/8">
              <div className={`h-full rounded-full ${isPro ? "bg-emerald-400" : orderCount >= orderLimit ? "bg-amber-400" : "bg-blue-500"}`} style={{ width: `${usagePercentage}%` }} />
            </div>
            {!isPro && orderCount >= orderLimit ? (
              <p className="mt-3 text-sm font-bold text-amber-300">Free limit doldu. Yeni sipariş için Pro plana geçmelisin.</p>
            ) : null}
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            <button
              disabled={saving || !canManage || isPro}
              onClick={() => updatePlan("pro")}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Demo Pro’ya Geç
            </button>
            <button
              disabled={saving || !canManage || !isPro}
              onClick={() => updatePlan("free")}
              className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-slate-200 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Free’ye Dön
            </button>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Not: Bu ekranda ödeme alınmıyor. Şimdilik demo abonelik yönetimi var. Gerçek ödeme için sonraki pakette iyzico/PayTR bağlantısı kurulacak.
          </p>
        </div>

        <div className="grid gap-4">
          <PlanCard
            title="Free"
            price="₺0"
            badge="Başlangıç"
            active={!isPro}
            features={[
              "15 siparişe kadar kullanım",
              "Ürün / stok / QR",
              "Sipariş ve ödeme takibi",
              "Kargo ve iade modülü",
              "Gorki temel veri cevapları",
            ]}
          />

          <PlanCard
            title="Pro"
            price="İlk ay ₺89"
            sub="Sonraki ay ₺99"
            badge="Önerilen"
            active={isPro}
            features={[
              "Sipariş limiti yok",
              "Tüm operasyon modülleri",
              "Gorki canlı panel cevapları",
              "Pazaryeri hazırlık modülleri",
              "Mobil uygulama uyumlu kullanım",
            ]}
          />
        </div>
      </div>

      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <h2 className="text-2xl font-black">Sonraki Ödeme Aşaması</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Gerçek ödeme bağlantısında kullanıcı Pro’ya geç dediğinde iyzico veya PayTR ödeme sayfasına yönlenecek.
          Ödeme başarılıysa bu ekrandaki Pro plan otomatik aktif olacak. Başarısızsa Free planda kalacak.
        </p>
      </div>
    </section>
  );
}

function Metric({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-[#0b1220] p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={["mt-2 text-2xl font-black", valueClass || "text-white"].join(" ")}>{value}</p>
    </div>
  );
}

function PlanCard({
  title,
  price,
  sub,
  badge,
  active,
  features,
}: {
  title: string;
  price: string;
  sub?: string;
  badge: string;
  active: boolean;
  features: string[];
}) {
  return (
    <div className={`rounded-[28px] border p-5 ${
      active ? "border-blue-400/30 bg-blue-500/10" : "border-white/10 bg-[#111a2e]"
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{badge}</p>
          <h3 className="mt-2 text-3xl font-black">{title}</h3>
          <p className="mt-2 text-2xl font-black text-blue-300">{price}</p>
          {sub ? <p className="mt-1 text-sm font-bold text-slate-400">{sub}</p> : null}
        </div>
        {active ? <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-300">Aktif</span> : null}
      </div>

      <div className="mt-5 space-y-3">
        {features.map((feature) => (
          <div key={feature} className="flex items-start gap-3 rounded-2xl bg-[#0b1220] p-3 ring-1 ring-white/10">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-xs font-black text-blue-300">✓</span>
            <p className="text-sm font-bold leading-5 text-slate-300">{feature}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
