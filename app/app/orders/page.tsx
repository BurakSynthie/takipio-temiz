"use client";

import { useEffect, useMemo, useState } from "react";
import {
  canCreateOrder,
  ensureBusinessForCurrentUser,
  supabase,
  withBusinessFields,
  type BusinessContext,
} from "@/lib/business-core";

type Product = {
  id: string;
  name: string;
  product_code: string;
  price: number | null;
  stock: number | null;
  business_id?: string | null;
};

type Order = {
  id: string;
  business_id: string | null;
  created_by: string | null;
  order_no: string;
  marketplace: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  total_amount: number | null;
  paid_amount: number | null;
  remaining_amount: number | null;
  payment_status: string | null;
  order_status: string | null;
  preparation_status: string | null;
  shipping_status: string | null;
  cargo_company: string | null;
  tracking_no: string | null;
  note: string | null;
  created_at: string;
};

type OrderItem = {
  id: string;
  business_id: string | null;
  order_id: string;
  product_id: string | null;
  product_code: string | null;
  product_name: string | null;
  quantity: number | null;
  unit_price: number | null;
  total_price: number | null;
};

type Payment = {
  id: string;
  business_id: string | null;
  order_id: string | null;
  payment_method: string | null;
  amount: number | null;
  payment_date: string | null;
  note: string | null;
  created_at: string;
};

type OrderForm = {
  marketplace: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  product_id: string;
  quantity: string;
  unit_price: string;
  note: string;
};

type PaymentForm = {
  payment_method: string;
  amount: string;
  note: string;
};

const emptyForm: OrderForm = {
  marketplace: "manual",
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  product_id: "",
  quantity: "1",
  unit_price: "",
  note: "",
};

const emptyPaymentForm: PaymentForm = {
  payment_method: "cash",
  amount: "",
  note: "",
};

const marketplaceOptions = [
  { value: "manual", label: "Manuel / Instagram" },
  { value: "trendyol", label: "Trendyol" },
  { value: "hepsiburada", label: "Hepsiburada" },
  { value: "amazon", label: "Amazon" },
  { value: "ciceksepeti", label: "ÇiçekSepeti" },
];

const paymentMethods = [
  { value: "cash", label: "Nakit" },
  { value: "card", label: "Kredi / Banka Kartı" },
  { value: "transfer", label: "Havale / EFT" },
  { value: "cod", label: "Kapıda Ödeme" },
  { value: "marketplace", label: "Pazaryeri Ödemesi" },
  { value: "check", label: "Çek / Senet" },
  { value: "refund", label: "Para İadesi" },
  { value: "other", label: "Diğer" },
];

const statusFlow = [
  { key: "new", label: "Yeni Sipariş" },
  { key: "preparing", label: "Hazırlanıyor" },
  { key: "packed", label: "Paketlendi" },
  { key: "shipped", label: "Kargoya Verildi" },
  { key: "delivered", label: "Teslim Edildi" },
  { key: "cancelled", label: "İptal" },
];

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

function marketplaceLabel(value: string | null | undefined) {
  return marketplaceOptions.find((item) => item.value === value)?.label ?? "Manuel";
}

function paymentMethodLabel(value: string | null | undefined) {
  return paymentMethods.find((item) => item.value === value)?.label ?? "Diğer";
}

function statusLabel(value: string | null | undefined) {
  return statusFlow.find((item) => item.key === value)?.label ?? "Yeni Sipariş";
}

function statusClass(value: string | null | undefined) {
  if (value === "delivered") return "bg-emerald-400/15 text-emerald-300";
  if (value === "shipped") return "bg-blue-400/15 text-blue-300";
  if (value === "packed") return "bg-violet-400/15 text-violet-300";
  if (value === "preparing") return "bg-amber-400/15 text-amber-300";
  if (value === "cancelled") return "bg-red-400/15 text-red-300";
  if (value === "return_requested") return "bg-orange-400/15 text-orange-300";
  return "bg-white/10 text-slate-300";
}

function paymentStatusLabel(value: string | null | undefined) {
  if (value === "paid") return "Ödendi";
  if (value === "partial") return "Kısmi Ödendi";
  return "Bekliyor";
}

function paymentStatusClass(value: string | null | undefined) {
  if (value === "paid") return "bg-emerald-400/15 text-emerald-300";
  if (value === "partial") return "bg-amber-400/15 text-amber-300";
  return "bg-red-400/15 text-red-300";
}

function nextStatus(current: string | null | undefined) {
  if (current === "new") return "preparing";
  if (current === "preparing") return "packed";
  if (current === "packed") return "shipped";
  if (current === "shipped") return "delivered";
  return null;
}

function createOrderNo() {
  return `ORD-${Date.now().toString().slice(-8)}`;
}

function calculatePaymentStatus(total: number, paid: number) {
  if (paid <= 0) return "pending";
  if (paid >= total) return "paid";
  return "partial";
}

export default function OrdersPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [usage, setUsage] = useState({
    allowed: true,
    used: 0,
    limit: 15,
    remaining: 15,
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [form, setForm] = useState<OrderForm>(emptyForm);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(emptyPaymentForm);

  const [formOpen, setFormOpen] = useState(false);
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState("");
  const [marketplaceFilter, setMarketplaceFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedProduct = useMemo(() => {
    return products.find((product) => product.id === form.product_id) ?? null;
  }, [products, form.product_id]);

  const previewTotal = Number(form.quantity || 0) * Number(form.unit_price || 0);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.order_no.toLowerCase().includes(query) ||
        (order.customer_name ?? "").toLowerCase().includes(query) ||
        (order.marketplace ?? "").toLowerCase().includes(query);

      const matchesMarketplace =
        marketplaceFilter === "all" ? true : order.marketplace === marketplaceFilter;

      return matchesSearch && matchesMarketplace;
    });
  }, [orders, search, marketplaceFilter]);

  const waitingOrders = orders.filter((order) => order.order_status === "new" || order.preparation_status === "waiting").length;
  const notShippedOrders = orders.filter((order) => order.shipping_status !== "shipped" && order.shipping_status !== "delivered").length;
  const totalOrderAmount = orders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0);
  const totalPaidAmount = orders.reduce((sum, order) => sum + Number(order.paid_amount ?? 0), 0);
  const totalRemainingAmount = orders.reduce((sum, order) => sum + Math.max(Number(order.remaining_amount ?? order.total_amount ?? 0), 0), 0);

  async function loadContextAndData() {
    setLoading(true);
    setMessage("");

    try {
      const businessContext = await ensureBusinessForCurrentUser();
      setContext(businessContext);

      const usageInfo = await canCreateOrder(businessContext);
      setUsage(usageInfo);

      await fetchData(businessContext);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "İşletme bağlantısı kurulamadı.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchData(activeContext = context) {
    if (!activeContext) return;

    const businessId = activeContext.business.id;

    const [productsResult, ordersResult, itemsResult, paymentsResult] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, product_code, price, stock, business_id")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false }),

      supabase
        .from("orders")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false }),

      supabase
        .from("order_items")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false }),

      supabase
        .from("payments")
        .select("*")
        .eq("business_id", businessId)
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

    setProducts(productsResult.data ?? []);
    setOrders(ordersResult.data ?? []);
    setItems(itemsResult.data ?? []);
    setPayments(paymentsResult.data ?? []);

    const usageInfo = await canCreateOrder(activeContext);
    setUsage(usageInfo);
  }

  useEffect(() => {
    loadContextAndData();
  }, []);

  function selectProduct(productId: string) {
    const product = products.find((item) => item.id === productId);

    setForm((current) => ({
      ...current,
      product_id: productId,
      unit_price: product?.price ? String(product.price) : "",
    }));
  }

  function getOrderItems(orderId: string) {
    return items.filter((item) => item.order_id === orderId);
  }

  function getOrderPayments(orderId: string) {
    return payments.filter((payment) => payment.order_id === orderId);
  }

  async function syncOrderPayment(orderId: string, totalAmount: number) {
    if (!context) return;

    const { data } = await supabase
      .from("payments")
      .select("amount")
      .eq("business_id", context.business.id)
      .eq("order_id", orderId);

    const paidAmount = (data ?? []).reduce((sum, payment) => {
      return sum + Number(payment.amount ?? 0);
    }, 0);

    const remainingAmount = Math.max(totalAmount - paidAmount, 0);
    const paymentStatus = calculatePaymentStatus(totalAmount, paidAmount);

    await supabase
      .from("orders")
      .update({
        paid_amount: paidAmount,
        remaining_amount: remainingAmount,
        payment_status: paymentStatus,
      })
      .eq("business_id", context.business.id)
      .eq("id", orderId);
  }

  async function createOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!context) {
      setMessage("İşletme bağlantısı bulunamadı.");
      return;
    }

    setSaving(true);
    setMessage("");

    const latestUsage = await canCreateOrder(context);

    if (!latestUsage.allowed) {
      setUsage(latestUsage);
      setMessage("Ücretsiz 15 sipariş limitin doldu. Yeni sipariş oluşturmak için Abonelik sayfasından Pro pakete geçmelisin.");
      setSaving(false);
      return;
    }

    if (!selectedProduct) {
      setMessage("Önce ürün seçmelisin.");
      setSaving(false);
      return;
    }

    const quantity = Number(form.quantity || 0);
    const unitPrice = Number(form.unit_price || 0);
    const currentStock = Number(selectedProduct.stock ?? 0);
    const nextStock = currentStock - quantity;

    if (quantity <= 0) {
      setMessage("Adet 1 veya daha büyük olmalı.");
      setSaving(false);
      return;
    }

    if (nextStock < 0) {
      setMessage(`Yetersiz stok. Mevcut stok: ${currentStock}`);
      setSaving(false);
      return;
    }

    const orderNo = createOrderNo();
    const totalAmount = quantity * unitPrice;
    const businessFields = withBusinessFields(context);

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        ...businessFields,
        order_no: orderNo,
        marketplace: form.marketplace,
        customer_name: form.customer_name.trim() || null,
        customer_email: form.customer_email.trim() || null,
        customer_phone: form.customer_phone.trim() || null,
        total_amount: totalAmount,
        paid_amount: 0,
        remaining_amount: totalAmount,
        payment_status: "pending",
        order_status: "new",
        preparation_status: "waiting",
        shipping_status: "not_shipped",
        note: form.note.trim() || null,
      })
      .select("*")
      .single();

    if (orderError || !orderData) {
      setMessage(`Sipariş oluşturulamadı: ${orderError?.message ?? "Bilinmeyen hata"}`);
      setSaving(false);
      return;
    }

    await supabase.from("order_items").insert({
      ...businessFields,
      order_id: orderData.id,
      product_id: selectedProduct.id,
      product_code: selectedProduct.product_code,
      product_name: selectedProduct.name,
      quantity,
      unit_price: unitPrice,
      total_price: totalAmount,
    });

    await supabase
      .from("products")
      .update({ stock: nextStock })
      .eq("business_id", context.business.id)
      .eq("id", selectedProduct.id);

    await supabase.from("stock_movements").insert({
      ...businessFields,
      product_id: selectedProduct.id,
      product_code: selectedProduct.product_code,
      product_name: selectedProduct.name,
      movement_type: "stock_out",
      quantity,
      note: `Sipariş oluşturuldu - ${orderNo}`,
    });

    setMessage("Sipariş oluşturuldu. Ödeme eklemek için sipariş kartındaki Ödeme Ekle butonunu kullan.");
    setForm(emptyForm);
    setFormOpen(false);
    setSaving(false);
    await fetchData(context);
  }

  async function addPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!context || !paymentModalOrder) return;

    const amount = Number(paymentForm.amount || 0);

    if (amount <= 0) {
      setMessage("Ödeme tutarı 0'dan büyük olmalı.");
      return;
    }

    await supabase.from("payments").insert({
      ...withBusinessFields(context),
      order_id: paymentModalOrder.id,
      payment_method: paymentForm.payment_method,
      amount,
      note: paymentForm.note.trim() || null,
    });

    await syncOrderPayment(paymentModalOrder.id, Number(paymentModalOrder.total_amount ?? 0));

    setPaymentForm(emptyPaymentForm);
    setPaymentModalOrder(null);
    setMessage("Ödeme kaydedildi.");
    await fetchData(context);
  }

  async function deletePayment(payment: Payment) {
    if (!context || !payment.order_id) return;
    if (!confirm("Ödeme kaydı silinsin mi?")) return;

    const order = orders.find((item) => item.id === payment.order_id);

    await supabase
      .from("payments")
      .delete()
      .eq("business_id", context.business.id)
      .eq("id", payment.id);

    if (order) {
      await syncOrderPayment(order.id, Number(order.total_amount ?? 0));
    }

    setMessage("Ödeme kaydı silindi.");
    await fetchData(context);
  }

  async function advanceOrder(order: Order) {
    if (!context) return;

    const target = nextStatus(order.order_status);
    if (!target) return;

    const updates: Partial<Order> = {
      order_status: target,
      preparation_status: target === "preparing" ? "preparing" : target === "packed" || target === "shipped" || target === "delivered" ? "ready" : order.preparation_status,
      shipping_status: target === "shipped" ? "shipped" : target === "delivered" ? "delivered" : order.shipping_status,
    };

    await supabase
      .from("orders")
      .update(updates)
      .eq("business_id", context.business.id)
      .eq("id", order.id);

    if (target === "shipped") {
      const existingShipment = await supabase
        .from("shipments")
        .select("id")
        .eq("business_id", context.business.id)
        .eq("order_id", order.id)
        .maybeSingle();

      if (!existingShipment.data) {
        await supabase.from("shipments").insert({
          ...withBusinessFields(context),
          order_id: order.id,
          order_no: order.order_no,
          marketplace: order.marketplace,
          customer_name: order.customer_name,
          cargo_company: order.cargo_company,
          tracking_no: order.tracking_no,
          shipping_status: "shipped",
          shipped_at: new Date().toISOString(),
          note: "Siparişler sayfasından kargoya verildi.",
        });
      }
    }

    setMessage(`${order.order_no} durumu güncellendi.`);
    await fetchData(context);
  }

  async function cancelOrder(order: Order) {
    if (!context) return;
    if (!confirm(`${order.order_no} iptal edilsin mi?`)) return;

    await supabase
      .from("orders")
      .update({ order_status: "cancelled" })
      .eq("business_id", context.business.id)
      .eq("id", order.id);

    setMessage("Sipariş iptal edildi.");
    await fetchData(context);
  }

  async function createReturn(order: Order) {
    if (!context) return;

    const firstItem = getOrderItems(order.id);

    await supabase.from("returns").insert({
      ...withBusinessFields(context),
      return_no: `RET-${Date.now().toString().slice(-8)}`,
      order_id: order.id,
      order_no: order.order_no,
      marketplace: order.marketplace,
      customer_name: order.customer_name,
      product_name: firstItem[0]?.product_name ?? "Ürün belirtilmedi",
      reason: "Panelden manuel iade talebi oluşturuldu",
      status: "requested",
      amount: order.total_amount ?? 0,
      note: `${order.order_no} için iade talebi`,
    });

    await supabase
      .from("orders")
      .update({ order_status: "return_requested" })
      .eq("business_id", context.business.id)
      .eq("id", order.id);

    setMessage("İade talebi oluşturuldu.");
    await fetchData(context);
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Business Core v1
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">
              Siparişler & Ödemeler
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Siparişler artık işletme hesabına bağlı. Free planda 15 sipariş limiti gerçek çalışır, Pro planda sınırsızdır.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFormOpen((value) => !value)}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500"
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
              <p className="mt-1 text-xs text-slate-500">
                Plan: {context.isPro ? "Pro / Sınırsız" : `Free / ${usage.used}/${usage.limit} sipariş`}
              </p>
            </div>

            {!context.isPro ? (
              <div className="w-full lg:w-[360px]">
                <div className="mb-2 flex justify-between text-xs font-black">
                  <span className="text-slate-400">Free sipariş limiti</span>
                  <span className={usage.allowed ? "text-blue-300" : "text-red-300"}>
                    {usage.used}/{usage.limit}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/8">
                  <div
                    className={usage.allowed ? "h-full rounded-full bg-blue-500" : "h-full rounded-full bg-red-500"}
                    style={{ width: `${Math.min(Math.round((usage.used / usage.limit) * 100), 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-300 ring-1 ring-emerald-400/20">
                Pro aktif · Sınırsız sipariş
              </div>
            )}
          </div>
        </div>
      ) : null}

      {message ? (
        <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <Metric label="Sipariş Tutarı" value={formatCurrency(totalOrderAmount)} valueClass="text-white" />
        <Metric label="Alınan Ödeme" value={formatCurrency(totalPaidAmount)} valueClass="text-emerald-300" />
        <Metric label="Kalan Tahsilat" value={formatCurrency(totalRemainingAmount)} valueClass="text-amber-300" />
        <Metric label="Yeni / Bekleyen" value={String(waitingOrders)} valueClass="text-blue-300" />
        <Metric label="Kargo Bekleyen" value={String(notShippedOrders)} valueClass="text-red-300" />
      </div>

      {formOpen ? (
        <form onSubmit={createOrder} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black">Yeni Sipariş Oluştur</h2>
              <p className="mt-1 text-sm text-slate-400">
                Bu sipariş aktif işletmeye kaydedilir. Ödemeyi sipariş oluştuktan sonra parça parça ekleyebilirsin.
              </p>
            </div>
            <div className="rounded-2xl bg-[#0b1220] px-4 py-3 text-right ring-1 ring-white/10">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Önizleme</p>
              <p className="mt-1 text-lg font-black text-blue-300">{formatCurrency(previewTotal)}</p>
            </div>
          </div>

          {!usage.allowed && !context?.isPro ? (
            <div className="mb-5 rounded-2xl bg-red-500/10 p-4 text-sm font-bold text-red-200 ring-1 ring-red-500/20">
              Ücretsiz 15 sipariş limitin doldu. Yeni sipariş oluşturmak için Abonelik sayfasından Pro pakete geçmelisin.
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Pazaryeri / Kanal">
              <select value={form.marketplace} onChange={(event) => setForm((current) => ({ ...current, marketplace: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                {marketplaceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </Field>

            <Field label="Ürün">
              <select value={form.product_id} onChange={(event) => selectProduct(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                <option value="">Ürün seç</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name} ({product.product_code}) - Stok: {product.stock ?? 0}</option>
                ))}
              </select>
            </Field>

            <Field label="Müşteri">
              <input value={form.customer_name} onChange={(event) => setForm((current) => ({ ...current, customer_name: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" placeholder="Müşteri adı" />
            </Field>

            <Field label="Telefon">
              <input value={form.customer_phone} onChange={(event) => setForm((current) => ({ ...current, customer_phone: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" placeholder="Telefon" />
            </Field>

            <Field label="E-posta">
              <input value={form.customer_email} onChange={(event) => setForm((current) => ({ ...current, customer_email: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" placeholder="E-posta" />
            </Field>

            <Field label="Adet">
              <input type="number" min="1" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Birim Fiyat">
              <input type="number" min="0" value={form.unit_price} onChange={(event) => setForm((current) => ({ ...current, unit_price: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Not">
              <input value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" placeholder="Not" />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button disabled={saving || (!usage.allowed && !context?.isPro)} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-50">
              {saving ? "Kaydediliyor..." : "Siparişi Kaydet"}
            </button>
            <button type="button" onClick={() => { setForm(emptyForm); setFormOpen(false); }} className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-slate-200">
              Vazgeç
            </button>
          </div>
        </form>
      ) : null}

      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black">Sipariş Akışı</h2>
            <p className="mt-1 text-sm text-slate-400">Hazırlama, paketleme, kargo, iade ve parçalı ödeme kontrolü.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Sipariş ara..." className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none placeholder:text-slate-500 sm:w-[240px]" />
            <select value={marketplaceFilter} onChange={(event) => setMarketplaceFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
              <option value="all">Tüm Kanallar</option>
              {marketplaceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3">{[1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-[24px] bg-white/5" />)}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0b1220] p-10 text-center">
            <h3 className="text-xl font-black">Sipariş bulunamadı</h3>
            <p className="mt-2 text-sm text-slate-500">İlk sipariş oluşturulduğunda burada görünecek.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredOrders.map((order) => {
              const orderItems = getOrderItems(order.id);
              const orderPayments = getOrderPayments(order.id);
              const target = nextStatus(order.order_status);
              const total = Number(order.total_amount ?? 0);
              const paid = Number(order.paid_amount ?? 0);
              const remaining = Math.max(Number(order.remaining_amount ?? total - paid), 0);

              return (
                <div key={order.id} className="rounded-[22px] border border-white/10 bg-[#0b1220] p-4 transition hover:bg-[#101a31]">
                  <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr_0.85fr_0.9fr_auto] xl:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black">{order.order_no}</h3>
                        <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-300">{marketplaceLabel(order.marketplace)}</span>
                        <span className={["rounded-full px-3 py-1 text-xs font-black", statusClass(order.order_status)].join(" ")}>{statusLabel(order.order_status)}</span>
                        <span className={["rounded-full px-3 py-1 text-xs font-black", paymentStatusClass(order.payment_status)].join(" ")}>{paymentStatusLabel(order.payment_status)}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">{order.customer_name || "Müşteri yok"}</p>
                      <p className="mt-2 text-xs text-slate-500">{formatDate(order.created_at)}</p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Ürünler</p>
                      <div className="mt-2 space-y-1">
                        {orderItems.length === 0 ? (
                          <p className="text-xs text-slate-500">Ürün yok</p>
                        ) : (
                          orderItems.map((item) => (
                            <p key={item.id} className="text-xs font-bold text-slate-300">
                              {item.product_name} × {item.quantity}
                            </p>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Ödeme Özeti</p>
                      <div className="mt-2 space-y-1 text-xs">
                        <p className="font-black text-slate-200">Toplam: {formatCurrency(total)}</p>
                        <p className="font-black text-emerald-300">Alınan: {formatCurrency(paid)}</p>
                        <p className="font-black text-amber-300">Kalan: {formatCurrency(remaining)}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Ödeme Geçmişi</p>
                      <div className="mt-2 space-y-2">
                        {orderPayments.length === 0 ? (
                          <p className="text-xs text-slate-500">Ödeme kaydı yok</p>
                        ) : (
                          orderPayments.map((payment) => (
                            <div key={payment.id} className="flex items-center justify-between gap-2 rounded-xl bg-[#111a2e] px-3 py-2">
                              <div>
                                <p className="text-xs font-black">{paymentMethodLabel(payment.payment_method)}</p>
                                <p className="text-[10px] text-slate-500">{formatDate(payment.payment_date)}</p>
                              </div>
                              <div className="text-right">
                                <p className={`text-xs font-black ${Number(payment.amount ?? 0) < 0 ? "text-red-300" : "text-emerald-300"}`}>
                                  {formatCurrency(payment.amount)}
                                </p>
                                <button onClick={() => deletePayment(payment)} className="text-[10px] font-black text-red-300">Sil</button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <button
                        onClick={() => {
                          setPaymentModalOrder(order);
                          setPaymentForm({
                            payment_method: "cash",
                            amount: remaining > 0 ? String(remaining) : "",
                            note: "",
                          });
                        }}
                        className="rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-black text-emerald-300"
                      >
                        Ödeme Ekle
                      </button>

                      {target ? (
                        <button onClick={() => advanceOrder(order)} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white">
                          {statusLabel(target)} Yap
                        </button>
                      ) : null}

                      <button onClick={() => createReturn(order)} className="rounded-xl bg-amber-500/15 px-3 py-2 text-xs font-black text-amber-300">İade Aç</button>
                      <button onClick={() => cancelOrder(order)} className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-black text-red-300">İptal</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {paymentModalOrder ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <form onSubmit={addPayment} className="w-full max-w-[520px] rounded-[28px] border border-white/10 bg-[#111a2e] p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">Parçalı Ödeme</p>
                <h2 className="mt-2 text-2xl font-black">{paymentModalOrder.order_no}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Toplam: {formatCurrency(paymentModalOrder.total_amount)} · Kalan: {formatCurrency(paymentModalOrder.remaining_amount ?? paymentModalOrder.total_amount)}
                </p>
              </div>
              <button type="button" onClick={() => setPaymentModalOrder(null)} className="rounded-2xl bg-white/10 px-4 py-2 text-lg font-black">×</button>
            </div>

            <div className="grid gap-3">
              <Field label="Ödeme Yöntemi">
                <select value={paymentForm.payment_method} onChange={(event) => setPaymentForm((current) => ({ ...current, payment_method: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                  {paymentMethods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
                </select>
              </Field>

              <Field label="Tutar">
                <input type="number" min="0" value={paymentForm.amount} onChange={(event) => setPaymentForm((current) => ({ ...current, amount: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
              </Field>

              <Field label="Not">
                <input value={paymentForm.note} onChange={(event) => setPaymentForm((current) => ({ ...current, note: event.target.value }))} placeholder="Örn: Instagram satışında yarısı nakit alındı" className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
              </Field>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">Ödemeyi Kaydet</button>
              <button type="button" onClick={() => setPaymentModalOrder(null)} className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-slate-200">Vazgeç</button>
            </div>
          </form>
        </div>
      ) : null}
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
