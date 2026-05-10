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
  can_manage_sales?: boolean | null;
  can_manage_shipments?: boolean | null;
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

type Product = {
  id: string;
  name: string;
  code: string | null;
  price: number | null;
  stock: number | null;
};

type Order = {
  id: string;
  business_id: string;
  created_by: string | null;
  order_no: string | null;
  product_id: string | null;
  product_code: string | null;
  product_name: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  quantity: number | null;
  unit_price: number | null;
  total_amount: number | null;
  paid_amount: number | null;
  remaining_amount: number | null;
  payment_status: string | null;
  payment_method: string | null;
  order_status: string | null;
  shipping_status: string | null;
  marketplace: string | null;
  marketplace_order_no: string | null;
  marketplace_package_id: string | null;
  marketplace_status: string | null;
  marketplace_tracking_link: string | null;
  carrier_name: string | null;
  tracking_no: string | null;
  return_status: string | null;
  note: string | null;
  created_at: string;
};

type OrderForm = {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  product_id: string;
  product_name: string;
  quantity: string;
  unit_price: string;
  paid_amount: string;
  payment_method: string;
  note: string;
};

type DetailForm = {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  note: string;
  paid_amount: string;
  carrier_name: string;
  tracking_no: string;
};

const emptyForm: OrderForm = {
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  product_id: "",
  product_name: "",
  quantity: "1",
  unit_price: "",
  paid_amount: "",
  payment_method: "cash",
  note: "",
};

const orderSteps = [
  { key: "new", label: "Yeni" },
  { key: "preparing", label: "Hazırlanıyor" },
  { key: "packed", label: "Paketlendi" },
  { key: "completed", label: "Tamamlandı" },
];

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

function toNumber(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
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
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function getMarketplaceLabel(marketplace: string | null | undefined) {
  if (marketplace === "trendyol") return "Trendyol";
  if (marketplace === "hepsiburada") return "Hepsiburada";
  if (marketplace === "amazon") return "Amazon";
  if (marketplace === "ciceksepeti") return "ÇiçekSepeti";
  return null;
}

function getMarketplaceBadgeClass(marketplace: string | null | undefined) {
  if (marketplace === "trendyol") return "bg-orange-500/15 text-orange-300 ring-orange-400/20";
  if (marketplace === "hepsiburada") return "bg-red-500/15 text-red-300 ring-red-400/20";
  if (marketplace === "amazon") return "bg-amber-500/15 text-amber-300 ring-amber-400/20";
  if (marketplace === "ciceksepeti") return "bg-pink-500/15 text-pink-300 ring-pink-400/20";
  return "bg-slate-500/15 text-slate-300 ring-white/10";
}

function orderStatusLabel(status: string | null | undefined) {
  if (status === "new") return "Yeni Sipariş";
  if (status === "preparing") return "Hazırlanıyor";
  if (status === "packed") return "Paketlendi";
  if (status === "completed") return "Tamamlandı";
  if (status === "cancelled") return "İptal";
  return "Yeni Sipariş";
}

function orderStatusClass(status: string | null | undefined) {
  if (status === "completed") return "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20";
  if (status === "packed") return "bg-cyan-500/15 text-cyan-300 ring-cyan-400/20";
  if (status === "preparing") return "bg-blue-500/15 text-blue-300 ring-blue-400/20";
  if (status === "cancelled") return "bg-red-500/15 text-red-300 ring-red-400/20";
  return "bg-amber-500/15 text-amber-300 ring-amber-400/20";
}

function paymentStatusLabel(status: string | null | undefined) {
  if (status === "paid") return "Ödendi";
  if (status === "partial") return "Kısmi";
  return "Bekliyor";
}

function paymentStatusClass(status: string | null | undefined) {
  if (status === "paid") return "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20";
  if (status === "partial") return "bg-amber-500/15 text-amber-300 ring-amber-400/20";
  return "bg-red-500/15 text-red-300 ring-red-400/20";
}

function shippingStatusLabel(status: string | null | undefined) {
  if (status === "waiting") return "Kargo Bekliyor";
  if (status === "preparing") return "Hazırlanıyor";
  if (status === "shipped") return "Kargoda";
  if (status === "delivered") return "Teslim";
  return "Kargo Bekliyor";
}

function orderStepIndex(status: string | null | undefined) {
  if (status === "preparing") return 1;
  if (status === "packed") return 2;
  if (status === "completed") return 3;
  return 0;
}

function nextOrderStatus(status: string | null | undefined) {
  if (!status || status === "new") return "preparing";
  if (status === "preparing") return "packed";
  if (status === "packed") return "completed";
  return "completed";
}

function nextOrderActionLabel(status: string | null | undefined) {
  if (!status || status === "new") return "Hazırlığa Al";
  if (status === "preparing") return "Paketlendi";
  if (status === "packed") return "Tamamla";
  if (status === "completed") return "Tamamlandı";
  return "Sonraki Adım";
}

function getPaymentPercent(order: Order) {
  const total = toNumber(order.total_amount);
  const paid = toNumber(order.paid_amount);

  if (total <= 0) return 0;

  return Math.min(Math.round((paid / total) * 100), 100);
}

function makePaymentStatus(total: number, paid: number) {
  if (paid >= total && total > 0) return "paid";
  if (paid > 0) return "partial";
  return "unpaid";
}

function makeOrderNo() {
  return `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
}

export default function OrdersPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<OrderForm>(emptyForm);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [detailForm, setDetailForm] = useState<DetailForm | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "paid" | "marketplace" | "shipping">("all");
  const [message, setMessage] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canManage = Boolean(context?.isOwner || context?.member.can_manage_orders || context?.member.can_manage_sales);
  const isPro = Boolean(context?.subscription?.plan === "pro" && context?.subscription?.status === "active");
  const orderLimit = Number(context?.subscription?.order_limit ?? 15);
  const canCreateOrder = isPro || orders.length < orderLimit;

  async function fetchData() {
    setLoading(true);
    setMessage("");

    try {
      const ctx = await ensureBusinessForCurrentUser();
      setContext(ctx);

      const [ordersResult, productsResult] = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .eq("business_id", ctx.business.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("products")
          .select("id, name, code, price, stock")
          .eq("business_id", ctx.business.id)
          .order("created_at", { ascending: false }),
      ]);

      if (ordersResult.error) {
        setMessage(`Siparişler alınamadı: ${ordersResult.error.message}`);
        return;
      }

      if (productsResult.error) {
        setMessage(`Ürünler alınamadı: ${productsResult.error.message}`);
        return;
      }

      setOrders((ordersResult.data ?? []) as Order[]);
      setProducts((productsResult.data ?? []) as Product[]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Siparişler alınamadı.";

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

  useEffect(() => {
    const product = products.find((item) => item.id === form.product_id);

    if (!product) return;

    setForm((current) => ({
      ...current,
      product_name: product.name,
      unit_price: product.price ? String(product.price) : current.unit_price,
    }));
  }, [form.product_id, products]);

  function openDetail(order: Order) {
    setDetailOrder(order);
    setDetailForm({
      customer_name: order.customer_name || "",
      customer_phone: order.customer_phone || "",
      customer_email: order.customer_email || "",
      note: order.note || "",
      paid_amount: String(order.paid_amount ?? 0),
      carrier_name: order.carrier_name || "",
      tracking_no: order.tracking_no || "",
    });
  }

  async function createOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede sipariş yönetimi yetkin yok.");
      return;
    }

    if (!canCreateOrder) {
      setMessage("Free plan sipariş limitin doldu. Yeni sipariş için Pro plana geçmelisin.");
      return;
    }

    const quantity = Math.max(toNumber(form.quantity), 1);
    const unitPrice = toNumber(form.unit_price);
    const total = quantity * unitPrice;
    const paid = Math.min(toNumber(form.paid_amount), total);
    const remaining = Math.max(total - paid, 0);
    const selectedProduct = products.find((item) => item.id === form.product_id);

    if (!form.customer_name.trim()) {
      setMessage("Müşteri adı zorunlu.");
      return;
    }

    if (!form.product_name.trim() && !selectedProduct) {
      setMessage("Ürün adı zorunlu.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("orders").insert({
      business_id: context.business.id,
      created_by: context.userEmail,
      order_no: makeOrderNo(),
      product_id: selectedProduct?.id || null,
      product_code: selectedProduct?.code || null,
      product_name: selectedProduct?.name || form.product_name.trim(),
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim() || null,
      customer_email: form.customer_email.trim() || null,
      quantity,
      unit_price: unitPrice,
      total_amount: total,
      paid_amount: paid,
      remaining_amount: remaining,
      payment_status: makePaymentStatus(total, paid),
      payment_method: form.payment_method,
      order_status: "new",
      shipping_status: "waiting",
      return_status: "none",
      note: form.note.trim() || null,
    });

    if (error) {
      setMessage(`Sipariş oluşturulamadı: ${error.message}`);
      setSaving(false);
      return;
    }

    setSaving(false);
    setForm(emptyForm);
    setShowCreate(false);
    setMessage("Sipariş oluşturuldu.");
    await fetchData();
  }

  async function updateOrder(order: Order, payload: Partial<Order>, successMessage = "Sipariş güncellendi.") {
    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede sipariş yönetimi yetkin yok.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("orders")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("business_id", context.business.id)
      .eq("id", order.id);

    if (error) {
      setMessage(`Sipariş güncellenemedi: ${error.message}`);
      setSaving(false);
      return;
    }

    setSaving(false);
    setMessage(successMessage);
    await fetchData();
  }

  async function moveNext(order: Order) {
    const target = nextOrderStatus(order.order_status);
    const shippingTarget = target === "packed" ? "preparing" : target === "completed" ? "delivered" : order.shipping_status;

    await updateOrder(order, {
      order_status: target,
      shipping_status: shippingTarget,
      delivered_at: target === "completed" ? new Date().toISOString() : order.delivered_at,
    } as Partial<Order>, `${order.order_no} durumu güncellendi.`);
  }

  async function saveDetail() {
    if (!detailOrder || !detailForm) return;

    const total = toNumber(detailOrder.total_amount);
    const paid = Math.min(toNumber(detailForm.paid_amount), total);
    const remaining = Math.max(total - paid, 0);

    await updateOrder(detailOrder, {
      customer_name: detailForm.customer_name.trim() || detailOrder.customer_name,
      customer_phone: detailForm.customer_phone.trim() || null,
      customer_email: detailForm.customer_email.trim() || null,
      note: detailForm.note.trim() || null,
      paid_amount: paid,
      remaining_amount: remaining,
      payment_status: makePaymentStatus(total, paid),
      carrier_name: detailForm.carrier_name.trim() || null,
      tracking_no: detailForm.tracking_no.trim() || null,
    } as Partial<Order>, "Sipariş detayı kaydedildi.");

    setDetailOrder(null);
    setDetailForm(null);
  }

  async function cancelOrder(order: Order) {
    if (!confirm(`${order.order_no || "Sipariş"} iptal edilsin mi?`)) return;

    await updateOrder(order, {
      order_status: "cancelled",
    } as Partial<Order>, "Sipariş iptal edildi.");
  }

  async function deleteOrder(order: Order) {
    if (!context) return;
    if (!canManage) {
      setMessage("Bu işletmede sipariş silme yetkin yok.");
      return;
    }

    if (!confirm(`${order.order_no || "Sipariş"} tamamen silinsin mi?`)) return;

    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("business_id", context.business.id)
      .eq("id", order.id);

    if (error) {
      setMessage(`Sipariş silinemedi: ${error.message}`);
      return;
    }

    setMessage("Sipariş silindi.");
    await fetchData();
  }

  const filteredOrders = useMemo(() => {
    if (filter === "open") return orders.filter((order) => order.order_status !== "completed" && order.order_status !== "cancelled");
    if (filter === "paid") return orders.filter((order) => order.payment_status === "paid");
    if (filter === "marketplace") return orders.filter((order) => Boolean(order.marketplace));
    if (filter === "shipping") return orders.filter((order) => order.shipping_status !== "delivered");
    return orders;
  }, [orders, filter]);

  const stats = useMemo(() => {
    return {
      all: orders.length,
      open: orders.filter((order) => order.order_status !== "completed" && order.order_status !== "cancelled").length,
      paid: orders.filter((order) => order.payment_status === "paid").length,
      marketplace: orders.filter((order) => Boolean(order.marketplace)).length,
      shipping: orders.filter((order) => order.shipping_status !== "delivered").length,
      total: orders.reduce((sum, order) => sum + toNumber(order.total_amount), 0),
    };
  }, [orders]);

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Orders Center v16
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Siparişler</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Sipariş durumunu, tahsilatı, kargo bilgisini ve pazaryeri detaylarını tek kartta yönet.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowCreate((value) => !value)} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500">
              {showCreate ? "Formu Kapat" : "Yeni Sipariş"}
            </button>
            <button onClick={fetchData} className="rounded-2xl bg-white/8 px-5 py-3 text-sm font-black text-slate-200 ring-1 ring-white/10 transition hover:bg-white/12">
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

      {!canCreateOrder ? (
        <div className="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-200 ring-1 ring-amber-400/20">
          Free plan sipariş limitin doldu. Yeni sipariş için abonelik sayfasından Pro plana geçmelisin.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <FilterMetric active={filter === "all"} label="Tümü" value={loading ? "..." : String(stats.all)} onClick={() => setFilter("all")} />
        <FilterMetric active={filter === "open"} label="Açık" value={loading ? "..." : String(stats.open)} onClick={() => setFilter("open")} />
        <FilterMetric active={filter === "paid"} label="Ödenen" value={loading ? "..." : String(stats.paid)} onClick={() => setFilter("paid")} />
        <FilterMetric active={filter === "marketplace"} label="Pazaryeri" value={loading ? "..." : String(stats.marketplace)} onClick={() => setFilter("marketplace")} />
        <FilterMetric active={filter === "shipping"} label="Kargo" value={loading ? "..." : String(stats.shipping)} onClick={() => setFilter("shipping")} />
        <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Ciro</p>
          <p className="mt-3 text-2xl font-black text-emerald-300">{formatCurrency(stats.total)}</p>
        </div>
      </div>

      {showCreate ? (
        <form onSubmit={createOrder} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-4">
            <h2 className="text-2xl font-black">Yeni Sipariş</h2>
            <p className="mt-1 text-sm text-slate-400">Müşteri, ürün ve tahsilat bilgisini gir.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Müşteri Adı">
              <input value={form.customer_name} onChange={(event) => setForm((current) => ({ ...current, customer_name: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Telefon">
              <input value={form.customer_phone} onChange={(event) => setForm((current) => ({ ...current, customer_phone: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="E-posta">
              <input value={form.customer_email} onChange={(event) => setForm((current) => ({ ...current, customer_email: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Ürün Seç">
              <select value={form.product_id} onChange={(event) => setForm((current) => ({ ...current, product_id: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                <option value="">Manuel ürün</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Ürün Adı">
              <input value={form.product_name} onChange={(event) => setForm((current) => ({ ...current, product_name: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Adet">
              <input type="number" min="1" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Birim Fiyat">
              <input type="number" min="0" value={form.unit_price} onChange={(event) => setForm((current) => ({ ...current, unit_price: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Alınan Ödeme">
              <input type="number" min="0" value={form.paid_amount} onChange={(event) => setForm((current) => ({ ...current, paid_amount: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Ödeme Tipi">
              <select value={form.payment_method} onChange={(event) => setForm((current) => ({ ...current, payment_method: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                <option value="cash">Nakit</option>
                <option value="card">Kart</option>
                <option value="transfer">Havale</option>
              </select>
            </Field>

            <label className="md:col-span-2 xl:col-span-3">
              <span className="mb-1.5 block text-xs font-black text-slate-400">Not</span>
              <input value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button disabled={saving || !canManage || !canCreateOrder} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? "Kaydediliyor..." : "Sipariş Oluştur"}
            </button>
            <button type="button" onClick={() => setForm(emptyForm)} className="rounded-2xl bg-white/8 px-5 py-3 text-sm font-black text-slate-300 ring-1 ring-white/10">
              Temizle
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-3">
        {filteredOrders.length === 0 ? (
          <div className="rounded-[26px] border border-dashed border-white/10 bg-[#111a2e] p-10 text-center">
            <p className="text-sm font-bold text-slate-500">Bu filtrede sipariş yok.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              canManage={canManage}
              saving={saving}
              onOpen={() => openDetail(order)}
              onNext={() => moveNext(order)}
              onCancel={() => cancelOrder(order)}
              onDelete={() => deleteOrder(order)}
            />
          ))
        )}
      </div>

      {detailOrder && detailForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[30px] border border-white/10 bg-[#111a2e] p-5 shadow-2xl">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${orderStatusClass(detailOrder.order_status)}`}>
                    {orderStatusLabel(detailOrder.order_status)}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${paymentStatusClass(detailOrder.payment_status)}`}>
                    {paymentStatusLabel(detailOrder.payment_status)}
                  </span>
                  {getMarketplaceLabel(detailOrder.marketplace) ? (
                    <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${getMarketplaceBadgeClass(detailOrder.marketplace)}`}>
                      {getMarketplaceLabel(detailOrder.marketplace)}
                    </span>
                  ) : null}
                </div>
                <h2 className="text-3xl font-black tracking-[-0.04em]">{detailOrder.order_no}</h2>
                <p className="mt-1 text-sm text-slate-400">{detailOrder.product_name || "Ürün yok"} · {formatDate(detailOrder.created_at)}</p>
              </div>

              <button onClick={() => setDetailOrder(null)} className="rounded-2xl bg-white/8 px-4 py-2.5 text-xs font-black text-slate-300 ring-1 ring-white/10">
                Kapat
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-[24px] border border-white/10 bg-[#0b1220] p-4">
                <h3 className="mb-4 text-xl font-black">Müşteri Bilgisi</h3>
                <div className="grid gap-3">
                  <Field label="Müşteri Adı">
                    <input value={detailForm.customer_name} onChange={(event) => setDetailForm((current) => current ? ({ ...current, customer_name: event.target.value }) : current)} className="w-full rounded-2xl border border-white/10 bg-[#111a2e] px-4 py-3 text-sm outline-none" />
                  </Field>
                  <Field label="Telefon">
                    <input value={detailForm.customer_phone} onChange={(event) => setDetailForm((current) => current ? ({ ...current, customer_phone: event.target.value }) : current)} className="w-full rounded-2xl border border-white/10 bg-[#111a2e] px-4 py-3 text-sm outline-none" />
                  </Field>
                  <Field label="E-posta">
                    <input value={detailForm.customer_email} onChange={(event) => setDetailForm((current) => current ? ({ ...current, customer_email: event.target.value }) : current)} className="w-full rounded-2xl border border-white/10 bg-[#111a2e] px-4 py-3 text-sm outline-none" />
                  </Field>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-[#0b1220] p-4">
                <h3 className="mb-4 text-xl font-black">Ödeme Özeti</h3>
                <PaymentProgress order={detailOrder} />
                <div className="mt-4 grid gap-3">
                  <Field label="Alınan Ödeme">
                    <input type="number" value={detailForm.paid_amount} onChange={(event) => setDetailForm((current) => current ? ({ ...current, paid_amount: event.target.value }) : current)} className="w-full rounded-2xl border border-white/10 bg-[#111a2e] px-4 py-3 text-sm outline-none" />
                  </Field>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <InfoPill label="Toplam" value={formatCurrency(detailOrder.total_amount)} />
                    <InfoPill label="Ödenen" value={formatCurrency(toNumber(detailForm.paid_amount))} />
                    <InfoPill label="Kalan" value={formatCurrency(Math.max(toNumber(detailOrder.total_amount) - toNumber(detailForm.paid_amount), 0))} />
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-[#0b1220] p-4">
                <h3 className="mb-4 text-xl font-black">Kargo Bilgisi</h3>
                <div className="mb-4 grid grid-cols-4 gap-2">
                  {["waiting", "preparing", "shipped", "delivered"].map((status) => (
                    <StatusMini key={status} active={(detailOrder.shipping_status || "waiting") === status} label={shippingStatusLabel(status)} />
                  ))}
                </div>
                <div className="grid gap-3">
                  <Field label="Kargo Firması">
                    <input value={detailForm.carrier_name} onChange={(event) => setDetailForm((current) => current ? ({ ...current, carrier_name: event.target.value }) : current)} className="w-full rounded-2xl border border-white/10 bg-[#111a2e] px-4 py-3 text-sm outline-none" />
                  </Field>
                  <Field label="Takip No">
                    <input value={detailForm.tracking_no} onChange={(event) => setDetailForm((current) => current ? ({ ...current, tracking_no: event.target.value }) : current)} className="w-full rounded-2xl border border-white/10 bg-[#111a2e] px-4 py-3 text-sm outline-none" />
                  </Field>
                  {detailOrder.marketplace_tracking_link ? (
                    <a href={detailOrder.marketplace_tracking_link} target="_blank" rel="noreferrer" className="rounded-2xl bg-blue-500/15 px-4 py-3 text-center text-sm font-black text-blue-300 ring-1 ring-blue-400/20">
                      Kargo Linkini Aç
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-[#0b1220] p-4">
                <h3 className="mb-4 text-xl font-black">Pazaryeri / Not</h3>
                <div className="grid gap-2">
                  <InfoLine label="Pazaryeri" value={getMarketplaceLabel(detailOrder.marketplace) || "Manuel sipariş"} />
                  <InfoLine label="Pazaryeri Sipariş No" value={detailOrder.marketplace_order_no || "-"} />
                  <InfoLine label="Paket ID" value={detailOrder.marketplace_package_id || "-"} />
                  <InfoLine label="Pazaryeri Durumu" value={detailOrder.marketplace_status || "-"} />
                </div>

                <label className="mt-4 block">
                  <span className="mb-1.5 block text-xs font-black text-slate-400">Sipariş Notu</span>
                  <textarea value={detailForm.note} onChange={(event) => setDetailForm((current) => current ? ({ ...current, note: event.target.value }) : current)} className="min-h-24 w-full rounded-2xl border border-white/10 bg-[#111a2e] px-4 py-3 text-sm outline-none" />
                </label>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={saveDetail} disabled={saving || !canManage} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-50">
                Detayı Kaydet
              </button>
              <button onClick={() => moveNext(detailOrder)} disabled={saving || !canManage || detailOrder.order_status === "completed"} className="rounded-2xl bg-emerald-500/15 px-5 py-3 text-sm font-black text-emerald-300 ring-1 ring-emerald-400/20 transition hover:bg-emerald-500/25 disabled:opacity-40">
                {nextOrderActionLabel(detailOrder.order_status)}
              </button>
              <button onClick={() => cancelOrder(detailOrder)} disabled={saving || !canManage || detailOrder.order_status === "cancelled"} className="rounded-2xl bg-amber-500/15 px-5 py-3 text-sm font-black text-amber-300 ring-1 ring-amber-400/20 transition hover:bg-amber-500/25 disabled:opacity-40">
                İptal Et
              </button>
              <button onClick={() => deleteOrder(detailOrder)} disabled={saving || !canManage} className="rounded-2xl bg-red-500/15 px-5 py-3 text-sm font-black text-red-300 ring-1 ring-red-400/20 transition hover:bg-red-500/25 disabled:opacity-40">
                Sil
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function OrderCard({
  order,
  canManage,
  saving,
  onOpen,
  onNext,
  onCancel,
  onDelete,
}: {
  order: Order;
  canManage: boolean;
  saving: boolean;
  onOpen: () => void;
  onNext: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const paymentPercent = getPaymentPercent(order);
  const currentStep = orderStepIndex(order.order_status);

  return (
    <article className="rounded-[26px] border border-white/10 bg-[#111a2e] p-4">
      <div className="grid gap-4 xl:grid-cols-[1.05fr_1.25fr_0.9fr] xl:items-center">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black">{order.order_no || "Sipariş"}</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${orderStatusClass(order.order_status)}`}>
              {orderStatusLabel(order.order_status)}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${paymentStatusClass(order.payment_status)}`}>
              {paymentStatusLabel(order.payment_status)}
            </span>
            {getMarketplaceLabel(order.marketplace) ? (
              <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${getMarketplaceBadgeClass(order.marketplace)}`}>
                {getMarketplaceLabel(order.marketplace)}
              </span>
            ) : null}
          </div>

          <p className="text-sm font-bold text-slate-300">{order.product_name || "Ürün adı yok"} · {order.quantity ?? 1} adet</p>
          <p className="mt-1 text-xs text-slate-500">{order.customer_name || "Müşteri yok"} · {formatDate(order.created_at)}</p>

          {order.marketplace_order_no || order.marketplace_package_id ? (
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold">
              {order.marketplace_order_no ? <span className="rounded-full bg-white/8 px-2.5 py-1 text-slate-300">Sipariş: {order.marketplace_order_no}</span> : null}
              {order.marketplace_package_id ? <span className="rounded-full bg-white/8 px-2.5 py-1 text-slate-300">Paket: {order.marketplace_package_id}</span> : null}
            </div>
          ) : null}
        </div>

        <div className="rounded-[22px] border border-white/10 bg-[#0b1220] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Sipariş Akışı</p>
              <p className="mt-1 text-sm font-black text-white">Sonraki işlem: {order.order_status === "completed" ? "Tamamlandı" : nextOrderActionLabel(order.order_status)}</p>
            </div>
            <span className="rounded-full bg-white/8 px-3 py-1 text-[11px] font-black text-slate-300 ring-1 ring-white/10">{currentStep + 1}/4</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {orderSteps.map((step, index) => (
              <div key={step.key} className={`rounded-2xl px-2 py-2 text-center text-[10px] font-black ${
                index <= currentStep ? "bg-blue-500/20 text-blue-200 ring-1 ring-blue-400/20" : "bg-white/5 text-slate-500 ring-1 ring-white/10"
              }`}>
                <span className={`mx-auto mb-1 block h-2 w-2 rounded-full ${index <= currentStep ? "bg-blue-300" : "bg-slate-600"}`} />
                {step.label}
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs font-black">
              <span className="text-slate-400">Tahsilat</span>
              <span className="text-emerald-300">{paymentPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-blue-400" style={{ width: `${paymentPercent}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[11px] font-bold text-slate-500">
              <span>{formatCurrency(order.paid_amount)} alındı</span>
              <span>{formatCurrency(order.remaining_amount)} kaldı</span>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-[22px] border border-white/10 bg-[#0b1220] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Tutar</p>
                <p className="mt-2 text-2xl font-black text-emerald-300">{formatCurrency(order.total_amount)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Kargo</p>
                <p className="mt-2 text-sm font-black text-blue-300">{shippingStatusLabel(order.shipping_status)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={onOpen} className="rounded-2xl bg-blue-500/15 px-4 py-2.5 text-xs font-black text-blue-300 ring-1 ring-blue-400/20 transition hover:bg-blue-500/25">
              Detay
            </button>
            <button
              onClick={onNext}
              disabled={!canManage || saving || order.order_status === "completed" || order.order_status === "cancelled"}
              className="rounded-2xl bg-emerald-500/15 px-4 py-2.5 text-xs font-black text-emerald-300 ring-1 ring-emerald-400/20 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {nextOrderActionLabel(order.order_status)}
            </button>
            <button
              onClick={onCancel}
              disabled={!canManage || saving || order.order_status === "cancelled" || order.order_status === "completed"}
              className="rounded-2xl bg-amber-500/15 px-4 py-2.5 text-xs font-black text-amber-300 ring-1 ring-amber-400/20 transition hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              İptal
            </button>
            <button onClick={onDelete} disabled={!canManage || saving} className="rounded-2xl bg-red-500/15 px-4 py-2.5 text-xs font-black text-red-300 ring-1 ring-red-400/20 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40">
              Sil
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function FilterMetric({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-[22px] border p-4 text-left transition hover:-translate-y-0.5 ${
        active ? "border-blue-400/40 bg-blue-500/15" : "border-white/10 bg-[#111a2e] hover:bg-[#162138]"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function PaymentProgress({ order }: { order: Order }) {
  const percent = getPaymentPercent(order);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-black">
        <span className="text-slate-400">Tahsilat ilerlemesi</span>
        <span className="text-emerald-300">{percent}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-blue-400" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#111a2e] px-3 py-2 ring-1 ring-white/10">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function StatusMini({ active, label }: { active: boolean; label: string }) {
  return (
    <div className={`rounded-2xl px-2 py-2 text-center text-[10px] font-black ${
      active ? "bg-blue-500/20 text-blue-200 ring-1 ring-blue-400/20" : "bg-white/5 text-slate-500 ring-1 ring-white/10"
    }`}>
      {label}
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#111a2e] px-4 py-3 ring-1 ring-white/10">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="text-right text-sm font-black text-white">{value}</p>
    </div>
  );
}
