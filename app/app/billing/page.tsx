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
  can_manage_stock?: boolean | null;
  can_manage_shipments?: boolean | null;
  can_manage_returns?: boolean | null;
  can_manage_billing?: boolean | null;
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

type Order = { id: string; order_no: string; created_at: string; business_id: string | null };
type BillingEvent = { id: string; subscription_id: string | null; event_type: string | null; amount: number | null; currency: string | null; status: string | null; note: string | null; created_at: string };

const lockedFeatures = [
  "Pazaryeri entegrasyonları",
  "Ekip ve yetki yönetimi",
  "Gelişmiş raporlar",
  "Toplu QR / PDF çıktı",
  "Mobil tam senkron",
  "Gorki AI gelişmiş kullanım",
];

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

function formatDate(date: string | null | undefined) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

export default function BillingPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<BillingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  async function fetchData() {
    setLoading(true);
    setMessage("");

    try {
      const ctx = await ensureBusinessForCurrentUser();
      setContext(ctx);

      const [ordersResult, eventsResult] = await Promise.all([
        supabase.from("orders").select("id, order_no, created_at, business_id").eq("business_id", ctx.business.id).order("created_at", { ascending: false }),
        supabase.from("billing_events").select("*").eq("subscription_id", ctx.subscription?.id ?? "00000000-0000-0000-0000-000000000000").order("created_at", { ascending: false }),
      ]);

      setOrders(ordersResult.data ?? []);
      setEvents(eventsResult.data ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "İşletme bağlantısı kurulamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const subscription = context?.subscription ?? null;
  const isPro = subscription?.plan === "pro";
  const orderLimit = Number(subscription?.order_limit ?? 15);
  const usedOrders = orders.length;
  const remainingOrders = Math.max(orderLimit - usedOrders, 0);
  const usagePercentage = isPro ? 100 : Math.min(Math.round((usedOrders / orderLimit) * 100), 100);
  const canManage = hasPermission(context, "can_manage_billing");

  async function simulateUpgrade() {
    if (!context?.subscription) return;

    if (!canManage) {
      setMessage("Bu işletmede abonelik güncelleme yetkin yok.");
      return;
    }

    const { error } = await supabase
      .from("subscriptions")
      .update({
        plan: "pro",
        status: "active",
        order_limit: 999999,
        business_id: context.business.id,
        updated_at: new Date().toISOString(),
      })
      .eq("business_id", context.business.id)
      .eq("id", context.subscription.id);

    if (error) {
      setMessage(`Paket güncellenemedi: ${error.message}`);
      return;
    }

    await supabase.from("billing_events").insert({
      subscription_id: context.subscription.id,
      event_type: "upgrade_simulation",
      amount: 89,
      currency: "TRY",
      status: "success",
      note: `${context.business.name} için demo Pro geçişi.`,
    });

    setMessage("Demo olarak Pro pakete geçirildi.");
    setUpgradeOpen(false);
    await fetchData();
  }

  async function resetFreePlan() {
    if (!context?.subscription) return;

    if (!canManage) {
      setMessage("Bu işletmede abonelik güncelleme yetkin yok.");
      return;
    }

    await supabase
      .from("subscriptions")
      .update({
        plan: "free",
        status: "trial",
        order_limit: 15,
        business_id: context.business.id,
        updated_at: new Date().toISOString(),
      })
      .eq("business_id", context.business.id)
      .eq("id", context.subscription.id);

    setMessage("Paket tekrar ücretsiz denemeye alındı.");
    await fetchData();
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">Billing Business Core v1</div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Abonelik</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Abonelik artık aktif işletmeye bağlı. Web ve mobil aynı işletme aboneliğini kullanacak.</p>
          </div>

          {!isPro ? (
            <button onClick={() => setUpgradeOpen(true)} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">Paketi Yükselt</button>
          ) : (
            <button onClick={resetFreePlan} className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-slate-200">Demo Free Yap</button>
          )}
        </div>
      </div>

      {context ? (
        <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Aktif İşletme</p>
          <p className="mt-1 text-lg font-black">{context.business.name}</p>
        </div>
      ) : null}

      {message ? <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">{message}</div> : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Mevcut Paket</p>
              <h2 className="mt-2 text-3xl font-black">{isPro ? "Takipio Pro" : "Ücretsiz Deneme"}</h2>
              <p className="mt-2 text-sm text-slate-400">Durum: <span className="font-black text-blue-300">{subscription?.status === "active" ? "Aktif" : "Deneme"}</span></p>
            </div>

            <div className="rounded-[22px] bg-[#0b1220] p-4 text-right ring-1 ring-white/10">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Kullanım</p>
              <p className="mt-2 text-3xl font-black">{isPro ? "∞" : `${usedOrders}/${orderLimit}`}</p>
              <p className="mt-1 text-xs text-slate-500">{isPro ? "Sınırsız sipariş" : `${remainingOrders} ücretsiz sipariş kaldı`}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs font-black">
              <span className="text-slate-400">Sipariş kullanım limiti</span>
              <span className={isPro ? "text-emerald-300" : "text-blue-300"}>{isPro ? "Pro aktif" : `%${usagePercentage}`}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/8">
              <div className={isPro ? "h-full rounded-full bg-emerald-400" : "h-full rounded-full bg-blue-500"} style={{ width: `${usagePercentage}%` }} />
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <SmallMetric label="İlk Ay" value={formatCurrency(subscription?.first_month_price ?? 89)} />
            <SmallMetric label="Sonraki Aylar" value={`${formatCurrency(subscription?.monthly_price ?? 99)} / ay`} />
            <SmallMetric label="Web + Mobil" value="Tek abonelik" />
          </div>
        </div>

        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <h2 className="text-2xl font-black">Paket Özeti</h2>

          <div className="mt-5 grid gap-3">
            <PlanCard title="Free" price="₺0" desc="15 siparişe kadar sistemi denemek için." active={!isPro} features={["Dashboard", "Ürün", "Stok", "15 sipariş", "Basit kargo"]} />
            <PlanCard title="Pro" price="₺89 ilk ay" desc="Sonraki aylar ₺99. Sınırsız operasyon." active={isPro} features={["Sınırsız sipariş", "Entegrasyonlar", "Ekip yetkileri", "Gelişmiş raporlar", "Mobil senkron"]} />
          </div>
        </div>
      </div>

      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <h2 className="text-2xl font-black">Free Planda Kilitli Özellikler</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {lockedFeatures.map((feature) => (
            <div key={feature} className="rounded-[22px] border border-white/10 bg-[#0b1220] p-4">
              <div className="mb-4 inline-flex rounded-full bg-amber-500/15 px-3 py-1 text-[10px] font-black text-amber-300">{isPro ? "Açık" : "Pro"}</div>
              <h3 className="text-lg font-black">{feature}</h3>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <h2 className="text-2xl font-black">Fatura / Ödeme Geçmişi</h2>
        <div className="mt-5 space-y-2">
          {events.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-white/10 bg-[#0b1220] p-8 text-center text-sm text-slate-500">Henüz ödeme geçmişi yok.</div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="rounded-[18px] bg-[#0b1220] p-4 ring-1 ring-white/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black">{event.event_type || "billing_event"}</p>
                    <p className="mt-1 text-xs text-slate-500">{event.note || "Not yok"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-300">{formatCurrency(event.amount)}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(event.created_at)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {upgradeOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[560px] rounded-[30px] border border-white/10 bg-[#111a2e] p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">Takipio Pro</p>
                <h2 className="mt-2 text-3xl font-black">İlk ay ₺89</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">Sonraki aylar ₺99. Sınırsız sipariş, entegrasyonlar, ekip yetkileri, gelişmiş raporlar ve mobil tam senkron.</p>
              </div>
              <button onClick={() => setUpgradeOpen(false)} className="rounded-2xl bg-white/10 px-4 py-2 text-lg font-black">×</button>
            </div>

            <div className="rounded-2xl bg-[#0b1220] p-4 ring-1 ring-white/10">
              <p className="text-sm font-black">Gerçek ödeme entegrasyonu sonraki aşama</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">Bu buton şimdilik demo olarak Pro planı açar.</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={simulateUpgrade} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">Demo Pro Yap</button>
              <button onClick={() => setUpgradeOpen(false)} className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-slate-200">Vazgeç</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
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

function PlanCard({ title, price, desc, active, features }: { title: string; price: string; desc: string; active: boolean; features: string[] }) {
  return (
    <div className={`rounded-[22px] border p-4 ${active ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-[#0b1220]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">{title}</h3>
          <p className="mt-1 text-sm text-slate-400">{desc}</p>
        </div>
        {active ? <span className="rounded-full bg-blue-500 px-3 py-1 text-[10px] font-black text-white">Aktif</span> : null}
      </div>

      <p className="mt-4 text-2xl font-black">{price}</p>

      <div className="mt-4 space-y-2">
        {features.map((feature) => <p key={feature} className="text-xs font-bold text-slate-300">✓ {feature}</p>)}
      </div>
    </div>
  );
}
