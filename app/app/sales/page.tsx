"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Business = { id: string; owner_email: string | null; name: string; email: string | null };
type BusinessMember = { id: string; business_id: string; email: string; role_name: string | null; member_status: string | null };
type Subscription = { id: string; business_id: string | null; plan: string | null; status: string | null };
type BusinessContext = { userEmail: string; business: Business; member: BusinessMember; subscription: Subscription | null; isOwner: boolean; isPro: boolean };

type Order = {
  id: string;
  order_no: string | null;
  product_name: string | null;
  customer_name: string | null;
  quantity: number | null;
  total_amount: number | null;
  paid_amount: number | null;
  remaining_amount: number | null;
  payment_status: string | null;
  payment_method: string | null;
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
  const { data: existing } = await supabase.from("business_members").select("*").eq("business_id", businessId).eq("email", userEmail).maybeSingle();
  if (existing) return existing as BusinessMember;

  const { data, error } = await supabase.from("business_members").insert({
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
  }).select("*").single();

  if (error || !data) throw new Error("Owner yetkisi oluşturulamadı.");
  return data as BusinessMember;
}

async function ensureSubscription(businessId: string, userEmail: string) {
  const { data: existing } = await supabase.from("subscriptions").select("*").eq("business_id", businessId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (existing) return existing as Subscription;

  const { data, error } = await supabase.from("subscriptions").insert({
    business_id: businessId,
    user_email: userEmail,
    plan: "free",
    status: "trial",
    order_limit: 15,
    first_month_price: 89,
    monthly_price: 99,
  }).select("*").single();

  if (error || !data) throw new Error("Abonelik oluşturulamadı.");
  return data as Subscription;
}

async function ensureBusinessForCurrentUser() {
  const userEmail = await getCurrentUserEmail();
  if (!userEmail) throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yap.");

  const existingMember = await supabase.from("business_members").select("*").eq("email", userEmail).eq("member_status", "active").limit(1).maybeSingle();

  if (existingMember.data?.business_id) {
    const { data: business, error } = await supabase.from("businesses").select("*").eq("id", existingMember.data.business_id).single();
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

  const existingBusiness = await supabase.from("businesses").select("*").eq("owner_email", userEmail).limit(1).maybeSingle();

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

  const { data: createdBusiness, error } = await supabase.from("businesses").insert({ owner_email: userEmail, name: "İşletmem", email: userEmail }).select("*").single();
  if (error || !createdBusiness) throw new Error("İşletme oluşturulamadı.");
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
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

function formatDate(date: string | null | undefined) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

function isToday(date: string) {
  const d = new Date(date);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export default function SalesPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState("all");

  async function fetchData() {
    setLoading(true);
    setMessage("");

    try {
      const ctx = await ensureBusinessForCurrentUser();
      setContext(ctx);

      const [ordersResult, paymentsResult] = await Promise.all([
        supabase.from("orders").select("*").eq("business_id", ctx.business.id).order("created_at", { ascending: false }),
        supabase.from("payments").select("*").eq("business_id", ctx.business.id).order("created_at", { ascending: false }),
      ]);

      if (ordersResult.error) {
        setMessage(`Satışlar alınamadı: ${ordersResult.error.message}`);
        return;
      }

      if (paymentsResult.error) {
        setMessage(`Ödemeler alınamadı: ${paymentsResult.error.message}`);
        return;
      }

      setOrders(ordersResult.data ?? []);
      setPayments(paymentsResult.data ?? []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Satış verisi alınamadı.";
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

  const filteredOrders = useMemo(() => {
    return channel === "all" ? orders : orders.filter((order) => order.marketplace === channel);
  }, [orders, channel]);

  const revenue = filteredOrders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0);
  const paid = filteredOrders.reduce((sum, order) => sum + Number(order.paid_amount ?? 0), 0);
  const remaining = filteredOrders.reduce((sum, order) => sum + Number(order.remaining_amount ?? 0), 0);
  const todayPaid = payments.filter((payment) => isToday(payment.payment_date || payment.created_at)).reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const cash = payments.filter((payment) => payment.payment_method === "cash").reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const card = payments.filter((payment) => payment.payment_method === "card").reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const transfer = payments.filter((payment) => payment.payment_method === "transfer").reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Sales / Revenue v3
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Satışlar</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Siparişlerden gelen ciro, tahsilat ve ödeme kanallarını izle.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <select value={channel} onChange={(event) => setChannel(event.target.value)} className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
              <option value="all">Tüm Kanallar</option>
              <option value="manual">Manuel / Instagram</option>
              <option value="trendyol">Trendyol</option>
              <option value="hepsiburada">Hepsiburada</option>
              <option value="amazon">Amazon</option>
              <option value="ciceksepeti">ÇiçekSepeti</option>
            </select>
            <button onClick={fetchData} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500">Yenile</button>
          </div>
        </div>
      </div>

      {context ? (
        <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Aktif İşletme</p>
          <p className="mt-1 text-lg font-black">{context.business.name}</p>
        </div>
      ) : null}

      {message ? <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">{message}</div> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Ciro" value={loading ? "..." : formatCurrency(revenue)} valueClass="text-blue-300" />
        <Metric label="Tahsilat" value={loading ? "..." : formatCurrency(paid)} valueClass="text-emerald-300" />
        <Metric label="Kalan" value={loading ? "..." : formatCurrency(remaining)} valueClass="text-amber-300" />
        <Metric label="Bugün Tahsilat" value={loading ? "..." : formatCurrency(todayPaid)} valueClass="text-cyan-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.75fr_1fr]">
        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <h2 className="text-2xl font-black">Ödeme Dağılımı</h2>
          <p className="mt-1 text-sm text-slate-400">Nakit, kart ve havale tahsilat toplamları.</p>

          <div className="mt-5 space-y-4">
            <PaymentBar label="Nakit" value={cash} max={Math.max(cash, card, transfer, 1)} color="bg-emerald-400" />
            <PaymentBar label="Kart" value={card} max={Math.max(cash, card, transfer, 1)} color="bg-blue-400" />
            <PaymentBar label="Havale/EFT" value={transfer} max={Math.max(cash, card, transfer, 1)} color="bg-cyan-400" />
          </div>
        </div>

        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <h2 className="text-2xl font-black">Son Satışlar</h2>
          <p className="mt-1 text-sm text-slate-400">Siparişlerden gelen son satış kayıtları.</p>

          <div className="mt-5 grid gap-3">
            {filteredOrders.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0b1220] p-10 text-center">
                <h3 className="text-xl font-black">Satış bulunamadı</h3>
                <p className="mt-2 text-sm text-slate-500">Sipariş oluşturduğunda burada görünecek.</p>
              </div>
            ) : (
              filteredOrders.slice(0, 15).map((order) => (
                <div key={order.id} className="rounded-[18px] bg-[#0b1220] p-4 ring-1 ring-white/10">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-black">{order.product_name || "Ürün yok"}</p>
                      <p className="mt-1 text-xs text-slate-500">{order.order_no} · {order.customer_name || "Müşteri yok"} · {formatDate(order.created_at)}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-right text-xs">
                      <div>
                        <p className="text-slate-500">Toplam</p>
                        <p className="font-black">{formatCurrency(order.total_amount)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Ödenen</p>
                        <p className="font-black text-emerald-300">{formatCurrency(order.paid_amount)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Kalan</p>
                        <p className="font-black text-amber-300">{formatCurrency(order.remaining_amount)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
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
      <p className={["mt-3 text-3xl font-black", valueClass || "text-white"].join(" ")}>{value}</p>
    </div>
  );
}

function PaymentBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const width = Math.max(Math.round((value / max) * 100), value > 0 ? 8 : 0);

  return (
    <div>
      <div className="mb-2 flex justify-between text-sm font-black">
        <span>{label}</span>
        <span>{formatCurrency(value)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/8">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
