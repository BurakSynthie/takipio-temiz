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
  can_manage_orders?: boolean | null;
  can_manage_shipments?: boolean | null;
  can_manage_returns?: boolean | null;
};

type Subscription = {
  id: string;
  business_id: string | null;
  plan: string | null;
  status: string | null;
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

function withBusinessFields(context: BusinessContext) {
  return {
    business_id: context.business.id,
    created_by: context.userEmail,
  };
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

function Metric({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-5">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={["mt-3 text-3xl font-black", valueClass || "text-white"].join(" ")}>{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-black text-slate-400">{label}</span>
      {children}
    </label>
  );
}


type Order = {
  id: string;
  order_no: string | null;
  customer_name: string | null;
  product_id: string | null;
  product_code: string | null;
  product_name: string | null;
  quantity: number | null;
  total_amount: number | null;
  paid_amount: number | null;
  return_status: string | null;
  created_at: string;
};

type ReturnItem = {
  id: string;
  order_id: string | null;
  order_no: string | null;
  product_id: string | null;
  product_code: string | null;
  product_name: string | null;
  customer_name: string | null;
  quantity: number | null;
  amount: number | null;
  status: string | null;
  reason: string | null;
  refund_method: string | null;
  refund_amount: number | null;
  restock: boolean | null;
  note: string | null;
  created_at: string;
};

type ReturnForm = {
  order_id: string;
  quantity: string;
  amount: string;
  reason: string;
  refund_method: string;
  refund_amount: string;
  restock: boolean;
  note: string;
};

const emptyForm: ReturnForm = {
  order_id: "",
  quantity: "1",
  amount: "",
  reason: "",
  refund_method: "none",
  refund_amount: "",
  restock: false,
  note: "",
};

const returnLabels: Record<string, string> = {
  requested: "Talep Alındı",
  received: "Ürün Geldi",
  refunded: "Para İadesi Yapıldı",
  rejected: "Reddedildi",
};

const refundLabels: Record<string, string> = {
  none: "Yok",
  cash: "Nakit",
  card: "Kart",
  transfer: "Havale/EFT",
};

export default function ReturnsPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [form, setForm] = useState<ReturnForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const canManage = Boolean(context?.isOwner || context?.member.can_manage_returns || context?.member.can_manage_orders);

  const selectedOrder = orders.find((order) => order.id === form.order_id) ?? null;

  async function fetchData(existingContext?: BusinessContext) {
    setLoading(true);
    setMessage("");

    try {
      const ctx = existingContext ?? await ensureBusinessForCurrentUser();
      setContext(ctx);

      const [ordersResult, returnsResult] = await Promise.all([
        supabase
          .from("orders")
          .select("id, order_no, customer_name, product_id, product_code, product_name, quantity, total_amount, paid_amount, return_status, created_at")
          .eq("business_id", ctx.business.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("returns")
          .select("*")
          .eq("business_id", ctx.business.id)
          .order("created_at", { ascending: false }),
      ]);

      if (ordersResult.error) {
        setMessage(`Siparişler alınamadı: ${ordersResult.error.message}`);
        return;
      }

      if (returnsResult.error) {
        setMessage(`İadeler alınamadı: ${returnsResult.error.message}`);
        return;
      }

      setOrders(ordersResult.data ?? []);
      setReturns(returnsResult.data ?? []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "İade verisi alınamadı.";
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

  const filteredReturns = useMemo(() => {
    if (filter === "all") return returns;
    return returns.filter((item) => item.status === filter);
  }, [returns, filter]);

  const requestedCount = returns.filter((item) => item.status === "requested").length;
  const receivedCount = returns.filter((item) => item.status === "received").length;
  const refundedCount = returns.filter((item) => item.status === "refunded").length;
  const totalRefunded = returns.filter((item) => item.status === "refunded").reduce((sum, item) => sum + Number(item.refund_amount ?? item.amount ?? 0), 0);

  function selectOrder(orderId: string) {
    const order = orders.find((item) => item.id === orderId);
    setForm((current) => ({
      ...current,
      order_id: orderId,
      amount: order?.total_amount ? String(order.total_amount) : current.amount,
      refund_amount: order?.paid_amount ? String(order.paid_amount) : current.refund_amount,
      quantity: order?.quantity ? String(order.quantity) : "1",
    }));
  }

  async function createReturn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede iade oluşturma yetkin yok.");
      return;
    }

    if (!selectedOrder) {
      setMessage("Önce sipariş seçmelisin.");
      return;
    }

    const { data, error } = await supabase
      .from("returns")
      .insert({
        ...withBusinessFields(context),
        order_id: selectedOrder.id,
        order_no: selectedOrder.order_no,
        product_id: selectedOrder.product_id,
        product_code: selectedOrder.product_code,
        product_name: selectedOrder.product_name,
        customer_name: selectedOrder.customer_name,
        quantity: Number(form.quantity || 1),
        amount: Number(form.amount || 0),
        status: "requested",
        reason: form.reason.trim() || null,
        refund_method: form.refund_method,
        refund_amount: Number(form.refund_amount || 0),
        restock: form.restock,
        note: form.note.trim() || null,
      })
      .select("*")
      .single();

    if (error || !data) {
      setMessage(`İade oluşturulamadı: ${error?.message ?? "Bilinmeyen hata"}`);
      return;
    }

    await supabase
      .from("orders")
      .update({
        return_status: "requested",
        updated_at: new Date().toISOString(),
      })
      .eq("business_id", context.business.id)
      .eq("id", selectedOrder.id);

    setMessage("İade talebi oluşturuldu.");
    setForm(emptyForm);
    setFormOpen(false);
    await fetchData(context);
  }

  async function updateReturnStatus(item: ReturnItem, nextStatus: string) {
    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede iade güncelleme yetkin yok.");
      return;
    }

    const { error } = await supabase
      .from("returns")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("business_id", context.business.id)
      .eq("id", item.id);

    if (error) {
      setMessage(`İade durumu güncellenemedi: ${error.message}`);
      return;
    }

    if (item.order_id) {
      await supabase
        .from("orders")
        .update({
          return_status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("business_id", context.business.id)
        .eq("id", item.order_id);
    }

    if (nextStatus === "refunded" && item.refund_amount && Number(item.refund_amount) > 0) {
      await supabase
        .from("payments")
        .insert({
          ...withBusinessFields(context),
          order_id: item.order_id,
          customer_name: item.customer_name,
          payment_method: item.refund_method || "transfer",
          amount: Number(item.refund_amount) * -1,
          payment_date: new Date().toISOString(),
          note: `${item.order_no} iade ödemesi`,
        });
    }

    if (nextStatus === "received" && item.restock && item.product_id) {
      const { data: product } = await supabase
        .from("products")
        .select("stock")
        .eq("business_id", context.business.id)
        .eq("id", item.product_id)
        .maybeSingle();

      const nextStock = Number(product?.stock ?? 0) + Number(item.quantity ?? 1);

      await supabase
        .from("products")
        .update({ stock: nextStock })
        .eq("business_id", context.business.id)
        .eq("id", item.product_id);

      await supabase
        .from("stock_movements")
        .insert({
          ...withBusinessFields(context),
          product_id: item.product_id,
          product_code: item.product_code,
          product_name: item.product_name,
          movement_type: "stock_in",
          quantity: Number(item.quantity ?? 1),
          note: `${item.order_no} iadesiyle stok geri eklendi`,
        });
    }

    setMessage("İade durumu güncellendi.");
    await fetchData(context);
  }

  async function deleteReturn(item: ReturnItem) {
    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede iade silme yetkin yok.");
      return;
    }

    if (!confirm(`${item.order_no} iade kaydı silinsin mi?`)) return;

    const { error } = await supabase
      .from("returns")
      .delete()
      .eq("business_id", context.business.id)
      .eq("id", item.id);

    if (error) {
      setMessage(`İade silinemedi: ${error.message}`);
      return;
    }

    setMessage("İade silindi.");
    await fetchData(context);
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Returns / Refunds v4
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">İadeler</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              İade talebi oluştur, gelen ürünü takip et, para iadesini işle ve stok geri eklensin mi seç.
            </p>
          </div>

          <button
            onClick={() => setFormOpen((value) => !value)}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500"
          >
            {formOpen ? "Formu Kapat" : "İade Oluştur"}
          </button>
        </div>
      </div>

      {message ? <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">{message}</div> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Talep" value={String(requestedCount)} valueClass="text-amber-300" />
        <Metric label="Gelen" value={String(receivedCount)} valueClass="text-blue-300" />
        <Metric label="İade Edilen" value={String(refundedCount)} valueClass="text-emerald-300" />
        <Metric label="İade Tutarı" value={formatCurrency(totalRefunded)} valueClass="text-red-300" />
      </div>

      {formOpen ? (
        <form onSubmit={createReturn} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-5">
            <h2 className="text-2xl font-black">İade Talebi</h2>
            <p className="mt-1 text-sm text-slate-400">Sipariş seç ve iade bilgilerini gir.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Sipariş">
              <select value={form.order_id} onChange={(event) => selectOrder(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                <option value="">Sipariş seç</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>{order.order_no} · {order.customer_name || "Müşteri yok"} · {order.product_name}</option>
                ))}
              </select>
            </Field>

            <Field label="Adet">
              <input type="number" min="1" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="İade Tutarı">
              <input type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Para İadesi">
              <input type="number" value={form.refund_amount} onChange={(event) => setForm((current) => ({ ...current, refund_amount: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="İade Yöntemi">
              <select value={form.refund_method} onChange={(event) => setForm((current) => ({ ...current, refund_method: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                <option value="none">Seçilmedi</option>
                <option value="cash">Nakit</option>
                <option value="card">Kart</option>
                <option value="transfer">Havale/EFT</option>
              </select>
            </Field>

            <Field label="Sebep">
              <input value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm font-black text-slate-300">
              <input checked={form.restock} onChange={(event) => setForm((current) => ({ ...current, restock: event.target.checked }))} type="checkbox" className="h-4 w-4 accent-blue-500" />
              Stok geri eklensin
            </label>

            <Field label="Not">
              <input value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button disabled={!canManage} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">İadeyi Kaydet</button>
            <button type="button" onClick={() => { setForm(emptyForm); setFormOpen(false); }} className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-slate-200">Vazgeç</button>
          </div>
        </form>
      ) : null}

      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black">İade Listesi</h2>
            <p className="mt-1 text-sm text-slate-400">İade operasyonlarını buradan yönet.</p>
          </div>
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
            <option value="all">Tümü</option>
            <option value="requested">Talep</option>
            <option value="received">Ürün Geldi</option>
            <option value="refunded">Para İadesi</option>
            <option value="rejected">Reddedildi</option>
          </select>
        </div>

        {loading ? (
          <div className="grid gap-3">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-[24px] bg-white/5" />)}</div>
        ) : filteredReturns.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0b1220] p-10 text-center">
            <h3 className="text-xl font-black">İade yok</h3>
            <p className="mt-2 text-sm text-slate-500">İade oluşturduğunda burada görünür.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredReturns.map((item) => (
              <div key={item.id} className="rounded-[22px] border border-white/10 bg-[#0b1220] p-4 transition hover:bg-[#101a31]">
                <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr_auto] xl:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black">{item.order_no || "-"}</h3>
                      <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-300">{returnLabels[item.status || "requested"]}</span>
                      {item.restock ? <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-300">Stok Döner</span> : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{item.product_name || "Ürün yok"} · {item.quantity ?? 0} adet</p>
                    <p className="mt-1 text-xs text-slate-500">{item.customer_name || "Müşteri yok"} · {item.reason || "Sebep yok"} · {formatDate(item.created_at)}</p>
                  </div>

                  <div className="rounded-2xl bg-[#111a2e] p-4 ring-1 ring-white/10">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">İade Bilgisi</p>
                    <p className="mt-2 text-sm font-black">Tutar: {formatCurrency(item.amount)}</p>
                    <p className="mt-1 text-xs text-amber-300">Para iadesi: {formatCurrency(item.refund_amount)}</p>
                    <p className="mt-1 text-xs text-slate-500">{refundLabels[item.refund_method || "none"]}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <button onClick={() => updateReturnStatus(item, "received")} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-slate-200">Ürün Geldi</button>
                    <button onClick={() => updateReturnStatus(item, "refunded")} className="rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-black text-emerald-300">Para İadesi</button>
                    <button onClick={() => updateReturnStatus(item, "rejected")} className="rounded-xl bg-amber-500/15 px-3 py-2 text-xs font-black text-amber-300">Reddet</button>
                    <button onClick={() => deleteReturn(item)} className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-black text-red-300">Sil</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
