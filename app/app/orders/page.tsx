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
};

type Subscription = {
  id: string;
  business_id: string | null;
  plan: string | null;
  status: string | null;
  order_limit: number | null;
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
  product_code: string;
  price: number | null;
  stock: number | null;
  image_url: string | null;
};

type Order = {
  id: string;
  business_id: string | null;
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
  note: string | null;
  carrier_name: string | null;
  tracking_no: string | null;
  return_status: string | null;
  created_at: string;
};

type Payment = {
  id: string;
  business_id: string | null;
  order_id: string | null;
  created_by: string | null;
  customer_name: string | null;
  payment_method: string | null;
  amount: number | null;
  payment_date: string | null;
  note: string | null;
  created_at: string;
};

type OrderForm = {
  product_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  quantity: string;
  unit_price: string;
  cash_amount: string;
  card_amount: string;
  transfer_amount: string;
  marketplace: string;
  note: string;
};

const emptyForm: OrderForm = {
  product_id: "",
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  quantity: "1",
  unit_price: "",
  cash_amount: "",
  card_amount: "",
  transfer_amount: "",
  marketplace: "manual",
  note: "",
};

const paymentLabels: Record<string, string> = {
  cash: "Nakit",
  card: "Kart",
  transfer: "Havale/EFT",
  none: "Ödeme Yok",
  mixed: "Parçalı",
};

const statusLabels: Record<string, string> = {
  new: "Yeni",
  preparing: "Hazırlanıyor",
  packed: "Paketlendi",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

const shippingLabels: Record<string, string> = {
  waiting: "Bekliyor",
  preparing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim",
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

function createOrderNo() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const random = Math.floor(1000 + Math.random() * 9000);

  return `TKP-${date}-${random}`;
}

function paymentStatus(total: number, paid: number) {
  if (paid <= 0) return "pending";
  if (paid >= total) return "paid";
  return "partial";
}

function paymentMethodFromAmounts(cash: number, card: number, transfer: number) {
  const active = [
    cash > 0 ? "cash" : "",
    card > 0 ? "card" : "",
    transfer > 0 ? "transfer" : "",
  ].filter(Boolean);

  if (active.length === 0) return "none";
  if (active.length > 1) return "mixed";
  return active[0];
}

export default function OrdersPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [form, setForm] = useState<OrderForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const canManage = Boolean(context?.isOwner || context?.member.can_manage_orders || context?.member.can_manage_sales);
  const isPro = context?.subscription?.plan === "pro" && context?.subscription?.status === "active";
  const orderLimit = Number(context?.subscription?.order_limit ?? 15);
  const freeOrderCount = orders.length;
  const freeLimitReached = !isPro && freeOrderCount >= orderLimit;

  const selectedProduct = useMemo(() => {
    return products.find((product) => product.id === form.product_id) ?? null;
  }, [products, form.product_id]);

  const quantity = Number(form.quantity || 0);
  const unitPrice = Number(form.unit_price || 0);
  const totalPreview = quantity * unitPrice;
  const paidPreview = Number(form.cash_amount || 0) + Number(form.card_amount || 0) + Number(form.transfer_amount || 0);
  const remainingPreview = Math.max(totalPreview - paidPreview, 0);

  async function fetchData(existingContext?: BusinessContext) {
    setLoading(true);
    setMessage("");

    try {
      const ctx = existingContext ?? await ensureBusinessForCurrentUser();
      setContext(ctx);

      const [productsResult, ordersResult, paymentsResult] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, product_code, price, stock, image_url")
          .eq("business_id", ctx.business.id)
          .order("created_at", { ascending: false }),
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
      ]);

      if (productsResult.error) {
        setMessage(`Ürünler alınamadı: ${productsResult.error.message}`);
        return;
      }

      if (ordersResult.error) {
        setMessage(`Siparişler alınamadı: ${ordersResult.error.message}`);
        return;
      }

      if (paymentsResult.error) {
        setMessage(`Ödemeler alınamadı: ${paymentsResult.error.message}`);
        return;
      }

      setProducts(productsResult.data ?? []);
      setOrders(ordersResult.data ?? []);
      setPayments(paymentsResult.data ?? []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Sipariş verisi alınamadı.";

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
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        (order.order_no ?? "").toLowerCase().includes(query) ||
        (order.product_name ?? "").toLowerCase().includes(query) ||
        (order.customer_name ?? "").toLowerCase().includes(query) ||
        (order.customer_phone ?? "").toLowerCase().includes(query);

      const matchesStatus = statusFilter === "all" ? true : order.order_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0);
  const totalPaid = orders.reduce((sum, order) => sum + Number(order.paid_amount ?? 0), 0);
  const totalRemaining = orders.reduce((sum, order) => sum + Number(order.remaining_amount ?? 0), 0);
  const waitingPayments = orders.filter((order) => order.payment_status !== "paid").length;

  function selectProduct(productId: string) {
    const product = products.find((item) => item.id === productId);

    setForm((current) => ({
      ...current,
      product_id: productId,
      unit_price: product?.price ? String(product.price) : current.unit_price,
    }));
  }

  async function createOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede sipariş oluşturma yetkin yok.");
      return;
    }

    if (freeLimitReached) {
      setMessage(`Ücretsiz planda ${orderLimit} sipariş limitine ulaştın. Yeni sipariş için Pro plana geçmelisin.`);
      return;
    }

    if (!selectedProduct) {
      setMessage("Önce ürün seçmelisin.");
      return;
    }

    const cleanQuantity = Number(form.quantity || 0);
    const cleanUnitPrice = Number(form.unit_price || 0);
    const currentStock = Number(selectedProduct.stock ?? 0);
    const nextStock = currentStock - cleanQuantity;

    if (cleanQuantity <= 0) {
      setMessage("Adet 1 veya daha büyük olmalı.");
      return;
    }

    if (nextStock < 0) {
      setMessage(`Yetersiz stok. Mevcut stok: ${currentStock}`);
      return;
    }

    const total = cleanQuantity * cleanUnitPrice;
    const cash = Number(form.cash_amount || 0);
    const card = Number(form.card_amount || 0);
    const transfer = Number(form.transfer_amount || 0);
    const paid = cash + card + transfer;
    const remaining = Math.max(total - paid, 0);
    const status = paymentStatus(total, paid);
    const method = paymentMethodFromAmounts(cash, card, transfer);
    const orderNo = createOrderNo();

    const { data: createdOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        ...withBusinessFields(context),
        order_no: orderNo,
        product_id: selectedProduct.id,
        product_code: selectedProduct.product_code,
        product_name: selectedProduct.name,
        customer_name: form.customer_name.trim() || null,
        customer_phone: form.customer_phone.trim() || null,
        customer_email: form.customer_email.trim() || null,
        quantity: cleanQuantity,
        unit_price: cleanUnitPrice,
        total_amount: total,
        paid_amount: paid,
        remaining_amount: remaining,
        payment_status: status,
        payment_method: method,
        order_status: "new",
        shipping_status: "waiting",
        marketplace: form.marketplace,
        note: form.note.trim() || null,
      })
      .select("*")
      .single();

    if (orderError || !createdOrder) {
      setMessage(`Sipariş kaydedilemedi: ${orderError?.message ?? "Bilinmeyen hata"}`);
      return;
    }

    const paymentRows = [
      { method: "cash", amount: cash },
      { method: "card", amount: card },
      { method: "transfer", amount: transfer },
    ].filter((payment) => payment.amount > 0);

    if (paymentRows.length > 0) {
      const { error: paymentError } = await supabase.from("payments").insert(
        paymentRows.map((payment) => ({
          ...withBusinessFields(context),
          order_id: createdOrder.id,
          customer_name: form.customer_name.trim() || null,
          payment_method: payment.method,
          amount: payment.amount,
          payment_date: new Date().toISOString(),
          note: `${orderNo} sipariş ödemesi`,
        }))
      );

      if (paymentError) {
        setMessage(`Sipariş oluştu ama ödeme kaydı eklenemedi: ${paymentError.message}`);
      }
    }

    await supabase
      .from("products")
      .update({ stock: nextStock })
      .eq("business_id", context.business.id)
      .eq("id", selectedProduct.id);

    await supabase.from("stock_movements").insert({
      ...withBusinessFields(context),
      product_id: selectedProduct.id,
      product_code: selectedProduct.product_code,
      product_name: selectedProduct.name,
      movement_type: "stock_out",
      quantity: cleanQuantity,
      note: `${orderNo} siparişi için stok düşüldü`,
    });

    setMessage("Sipariş oluşturuldu, ödeme ve stok hareketleri işlendi.");
    setForm(emptyForm);
    setFormOpen(false);
    await fetchData(context);
  }

  async function addPayment(order: Order, method: string, amount: number) {
    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede ödeme ekleme yetkin yok.");
      return;
    }

    if (amount <= 0) return;

    const total = Number(order.total_amount ?? 0);
    const currentPaid = Number(order.paid_amount ?? 0);
    const nextPaid = Math.min(currentPaid + amount, total);
    const nextRemaining = Math.max(total - nextPaid, 0);
    const nextStatus = paymentStatus(total, nextPaid);

    const { error: paymentError } = await supabase.from("payments").insert({
      ...withBusinessFields(context),
      order_id: order.id,
      customer_name: order.customer_name,
      payment_method: method,
      amount,
      payment_date: new Date().toISOString(),
      note: `${order.order_no} için ek ödeme`,
    });

    if (paymentError) {
      setMessage(`Ödeme eklenemedi: ${paymentError.message}`);
      return;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        paid_amount: nextPaid,
        remaining_amount: nextRemaining,
        payment_status: nextStatus,
        payment_method: order.payment_method === "none" || !order.payment_method ? method : "mixed",
        updated_at: new Date().toISOString(),
      })
      .eq("business_id", context.business.id)
      .eq("id", order.id);

    if (updateError) {
      setMessage(`Sipariş ödeme durumu güncellenemedi: ${updateError.message}`);
      return;
    }

    setMessage("Ödeme eklendi.");
    await fetchData(context);
  }

  async function updateOrderStatus(order: Order, nextStatus: string) {
    if (!context) return;

    const payload: Record<string, string> = {
      order_status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    if (nextStatus === "packed") payload.shipping_status = "preparing";
    if (nextStatus === "completed") payload.shipping_status = "delivered";

    const { error } = await supabase
      .from("orders")
      .update(payload)
      .eq("business_id", context.business.id)
      .eq("id", order.id);

    if (error) {
      setMessage(`Sipariş durumu güncellenemedi: ${error.message}`);
      return;
    }

    setMessage("Sipariş durumu güncellendi.");
    await fetchData(context);
  }

  async function deleteOrder(order: Order) {
    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede sipariş silme yetkin yok.");
      return;
    }

    if (!confirm(`${order.order_no} siparişi silinsin mi?`)) return;

    await supabase
      .from("payments")
      .delete()
      .eq("business_id", context.business.id)
      .eq("order_id", order.id);

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
    await fetchData(context);
  }

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? null;
  const selectedOrderPayments = payments.filter((payment) => payment.order_id === selectedOrderId);

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Orders / Payments v3
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Siparişler</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Sipariş oluştur, parçalı ödeme al, kalan tahsilatı gör ve stokları otomatik düş.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {freeLimitReached ? (
              <a href="/app/billing" className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-400">
                Pro’ya Geç
              </a>
            ) : null}
            <button
              disabled={freeLimitReached}
              onClick={() => {
                setForm(emptyForm);
                setFormOpen((value) => !value);
              }}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {formOpen ? "Formu Kapat" : "Yeni Sipariş"}
            </button>
          </div>
        </div>
      </div>

      {context ? (
        <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Aktif İşletme</p>
              <p className="mt-1 text-lg font-black">{context.business.name}</p>
            </div>
            <div className={`rounded-2xl px-4 py-3 text-sm font-black ring-1 ${
              canManage ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20" : "bg-red-400/10 text-red-300 ring-red-400/20"
            }`}>
              {canManage ? "Sipariş yönetimi açık" : "Sipariş yönetimi kapalı"}
            </div>
          </div>
        </div>
      ) : null}

      {context ? (
        <div className={`rounded-[22px] border p-4 ${
          freeLimitReached
            ? "border-amber-400/20 bg-amber-500/10"
            : "border-white/10 bg-[#111a2e]"
        }`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Abonelik Durumu</p>
              <p className="mt-1 text-lg font-black">
                {isPro ? "Pro plan aktif" : `Free plan: ${freeOrderCount}/${orderLimit} sipariş`}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {isPro
                  ? "Sipariş limiti olmadan kullanabilirsin."
                  : freeLimitReached
                    ? "Free limit doldu. Yeni sipariş için Pro plana geçmelisin."
                    : `${Math.max(orderLimit - freeOrderCount, 0)} ücretsiz sipariş hakkın kaldı.`}
              </p>
            </div>
            <div className="min-w-[220px]">
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${freeLimitReached ? "bg-amber-400" : "bg-blue-500"}`}
                  style={{ width: `${isPro ? 100 : Math.min(Math.round((freeOrderCount / orderLimit) * 100), 100)}%` }}
                />
              </div>
              {!isPro ? (
                <a href="/app/billing" className="mt-3 inline-flex rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white">
                  Planı Yükselt
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {message ? (
        <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Toplam Ciro" value={formatCurrency(totalRevenue)} valueClass="text-blue-300" />
        <Metric label="Tahsil Edilen" value={formatCurrency(totalPaid)} valueClass="text-emerald-300" />
        <Metric label="Kalan Tahsilat" value={formatCurrency(totalRemaining)} valueClass="text-amber-300" />
        <Metric label="Bekleyen Ödeme" value={String(waitingPayments)} valueClass="text-red-300" />
      </div>

      {formOpen ? (
        <form onSubmit={createOrder} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black">Yeni Sipariş</h2>
              <p className="mt-1 text-sm text-slate-400">Ürün seç, ödeme dağılımını gir, stok otomatik düşsün.</p>
            </div>
            <div className="rounded-2xl bg-[#0b1220] px-4 py-3 text-right ring-1 ring-white/10">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Önizleme</p>
              <p className="mt-1 text-lg font-black text-blue-300">{formatCurrency(totalPreview)}</p>
              <p className="mt-1 text-xs font-bold text-amber-300">Kalan: {formatCurrency(remainingPreview)}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Ürün">
              <select value={form.product_id} onChange={(event) => selectProduct(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                <option value="">Ürün seç</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name} · Stok: {product.stock ?? 0}</option>
                ))}
              </select>
            </Field>

            <Field label="Müşteri">
              <input value={form.customer_name} onChange={(event) => setForm((current) => ({ ...current, customer_name: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Telefon">
              <input value={form.customer_phone} onChange={(event) => setForm((current) => ({ ...current, customer_phone: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="E-posta">
              <input value={form.customer_email} onChange={(event) => setForm((current) => ({ ...current, customer_email: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Adet">
              <input type="number" min="1" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Birim Fiyat">
              <input type="number" value={form.unit_price} onChange={(event) => setForm((current) => ({ ...current, unit_price: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Satış Kanalı">
              <select value={form.marketplace} onChange={(event) => setForm((current) => ({ ...current, marketplace: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                <option value="manual">Manuel / Instagram</option>
                <option value="trendyol">Trendyol</option>
                <option value="hepsiburada">Hepsiburada</option>
                <option value="amazon">Amazon</option>
                <option value="ciceksepeti">ÇiçekSepeti</option>
              </select>
            </Field>

            <Field label="Not">
              <input value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Nakit">
              <input type="number" value={form.cash_amount} onChange={(event) => setForm((current) => ({ ...current, cash_amount: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Kart">
              <input type="number" value={form.card_amount} onChange={(event) => setForm((current) => ({ ...current, card_amount: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Havale / EFT">
              <input type="number" value={form.transfer_amount} onChange={(event) => setForm((current) => ({ ...current, transfer_amount: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button disabled={!canManage || freeLimitReached} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
              {freeLimitReached ? "Limit Doldu" : "Siparişi Kaydet"}
            </button>
            <button type="button" onClick={() => { setForm(emptyForm); setFormOpen(false); }} className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-slate-200">Vazgeç</button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black">Sipariş Listesi</h2>
              <p className="mt-1 text-sm text-slate-400">Sipariş, tahsilat ve durum takibi.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Sipariş ara..." className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none placeholder:text-slate-500 sm:w-[240px]" />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                <option value="all">Tüm Durumlar</option>
                <option value="new">Yeni</option>
                <option value="preparing">Hazırlanıyor</option>
                <option value="packed">Paketlendi</option>
                <option value="completed">Tamamlandı</option>
                <option value="cancelled">İptal</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-3">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-[24px] bg-white/5" />)}</div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0b1220] p-10 text-center">
              <h3 className="text-xl font-black">Sipariş bulunamadı</h3>
              <p className="mt-2 text-sm text-slate-500">İlk siparişi oluşturduğunda burada görünecek.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredOrders.map((order) => {
                const paid = Number(order.paid_amount ?? 0);
                const total = Number(order.total_amount ?? 0);
                const percentage = total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0;

                return (
                  <div key={order.id} className="rounded-[22px] border border-white/10 bg-[#0b1220] p-4 transition hover:bg-[#101a31]">
                    <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr_auto] xl:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black">{order.order_no || "-"}</h3>
                          <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-300">{statusLabels[order.order_status || "new"] || order.order_status}</span>
                          <span className={`rounded-full px-3 py-1 text-xs font-black ${order.payment_status === "paid" ? "bg-emerald-500/15 text-emerald-300" : order.payment_status === "partial" ? "bg-amber-500/15 text-amber-300" : "bg-red-500/15 text-red-300"}`}>
                            {order.payment_status === "paid" ? "Ödendi" : order.payment_status === "partial" ? "Kısmi" : "Bekliyor"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-400">{order.product_name || "Ürün yok"} · {order.quantity ?? 0} adet</p>
                        <p className="mt-1 text-xs text-slate-500">{order.customer_name || "Müşteri yok"} · {formatDate(order.created_at)}</p>
                        <p className="mt-1 text-xs text-blue-300">Kargo: {shippingLabels[order.shipping_status || "waiting"] || order.shipping_status} {order.tracking_no ? `· ${order.tracking_no}` : ""}</p>
                        {order.return_status && order.return_status !== "none" ? <p className="mt-1 text-xs text-amber-300">İade: {order.return_status}</p> : null}
                      </div>

                      <div>
                        <div className="mb-2 flex justify-between text-xs font-black">
                          <span className="text-slate-500">Tahsilat</span>
                          <span>{percentage}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/8">
                          <div className="h-full rounded-full bg-emerald-400" style={{ width: `${percentage}%` }} />
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
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

                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        <button onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)} className="rounded-xl bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">Detay</button>
                        <button onClick={() => updateOrderStatus(order, "preparing")} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-slate-200">Hazırla</button>
                        <button onClick={() => updateOrderStatus(order, "packed")} className="rounded-xl bg-violet-500/15 px-3 py-2 text-xs font-black text-violet-300">Paketle</button>
                        <button onClick={() => updateOrderStatus(order, "completed")} className="rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-black text-emerald-300">Tamamla</button>
                        <button onClick={() => deleteOrder(order)} className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-black text-red-300">Sil</button>
                      </div>
                    </div>

                    {selectedOrderId === order.id ? (
                      <div className="mt-4 rounded-2xl bg-[#111a2e] p-4 ring-1 ring-white/10">
                        <div className="grid gap-3 md:grid-cols-3">
                          <PaymentButton label="Nakit 100₺" onClick={() => addPayment(order, "cash", 100)} />
                          <PaymentButton label="Kart 100₺" onClick={() => addPayment(order, "card", 100)} />
                          <PaymentButton label="Havale 100₺" onClick={() => addPayment(order, "transfer", 100)} />
                        </div>
                        <p className="mt-3 text-xs text-slate-500">Hızlı ödeme butonları 100₺ ekler. Sonraki pakette özel tutar girme modalı ekleyeceğiz.</p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <h2 className="text-2xl font-black">Ödeme Geçmişi</h2>
          <p className="mt-1 text-sm text-slate-400">Nakit, kart ve havale kayıtları.</p>

          <div className="mt-5 grid gap-3">
            {payments.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0b1220] p-10 text-center">
                <h3 className="text-xl font-black">Ödeme yok</h3>
                <p className="mt-2 text-sm text-slate-500">Ödeme alındığında burada görünür.</p>
              </div>
            ) : (
              payments.slice(0, 18).map((payment) => (
                <div key={payment.id} className="rounded-[18px] bg-[#0b1220] p-4 ring-1 ring-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{paymentLabels[payment.payment_method || "none"] || payment.payment_method}</p>
                      <p className="mt-1 text-xs text-slate-500">{payment.customer_name || "Müşteri yok"}</p>
                      <p className="mt-1 text-[11px] text-slate-600">{formatDate(payment.payment_date || payment.created_at)}</p>
                    </div>
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-300">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedOrder ? (
            <div className="mt-5 rounded-[22px] bg-[#0b1220] p-4 ring-1 ring-white/10">
              <h3 className="text-lg font-black">{selectedOrder.order_no} ödemeleri</h3>
              <div className="mt-3 grid gap-2">
                {selectedOrderPayments.length === 0 ? (
                  <p className="text-sm text-slate-500">Bu sipariş için ödeme yok.</p>
                ) : (
                  selectedOrderPayments.map((payment) => (
                    <div key={payment.id} className="flex justify-between rounded-2xl bg-white/5 px-3 py-2 text-xs font-black">
                      <span>{paymentLabels[payment.payment_method || "none"]}</span>
                      <span className="text-emerald-300">{formatCurrency(payment.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-black text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function PaymentButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl bg-white/10 px-4 py-3 text-xs font-black text-slate-200 transition hover:bg-white/15">
      {label}
    </button>
  );
}
