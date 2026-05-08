"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Product = {
  id: string;
  name: string;
  product_code: string;
  price: number | null;
  stock: number | null;
};

type Order = {
  id: string;
  order_no: string;
  marketplace: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  total_amount: number | null;
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
  order_id: string;
  product_id: string | null;
  product_code: string | null;
  product_name: string | null;
  quantity: number | null;
  unit_price: number | null;
  total_price: number | null;
};

type OrderForm = {
  marketplace: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  product_id: string;
  quantity: string;
  unit_price: string;
  payment_status: string;
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
  payment_status: "pending",
  note: "",
};

const marketplaceOptions = [
  { value: "manual", label: "Manuel" },
  { value: "trendyol", label: "Trendyol" },
  { value: "hepsiburada", label: "Hepsiburada" },
  { value: "amazon", label: "Amazon" },
  { value: "ciceksepeti", label: "ÇiçekSepeti" },
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

function formatDate(date: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function marketplaceLabel(value: string | null | undefined) {
  return marketplaceOptions.find((item) => item.value === value)?.label ?? "Manuel";
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
  return "bg-white/10 text-slate-300";
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

export default function OrdersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [form, setForm] = useState<OrderForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
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
  const preparingOrders = orders.filter((order) => order.order_status === "preparing").length;
  const notShippedOrders = orders.filter((order) => order.shipping_status !== "shipped" && order.shipping_status !== "delivered").length;
  const deliveredOrders = orders.filter((order) => order.order_status === "delivered").length;

  async function fetchData() {
    setLoading(true);
    setMessage("");

    const [productsResult, ordersResult, itemsResult] = await Promise.all([
      supabase.from("products").select("id, name, product_code, price, stock").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("order_items").select("*").order("created_at", { ascending: false }),
    ]);

    if (productsResult.error) {
      setMessage(`Ürünler alınamadı: ${productsResult.error.message}`);
      setLoading(false);
      return;
    }

    if (ordersResult.error) {
      setMessage(`Siparişler alınamadı: ${ordersResult.error.message}`);
      setLoading(false);
      return;
    }

    setProducts(productsResult.data ?? []);
    setOrders(ordersResult.data ?? []);
    setItems(itemsResult.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
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

  async function createOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

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

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_no: orderNo,
        marketplace: form.marketplace,
        customer_name: form.customer_name.trim() || null,
        customer_email: form.customer_email.trim() || null,
        customer_phone: form.customer_phone.trim() || null,
        total_amount: totalAmount,
        payment_status: form.payment_status,
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
      order_id: orderData.id,
      product_id: selectedProduct.id,
      product_code: selectedProduct.product_code,
      product_name: selectedProduct.name,
      quantity,
      unit_price: unitPrice,
      total_price: totalAmount,
    });

    await supabase.from("products").update({ stock: nextStock }).eq("id", selectedProduct.id);

    await supabase.from("stock_movements").insert({
      product_id: selectedProduct.id,
      product_code: selectedProduct.product_code,
      product_name: selectedProduct.name,
      movement_type: "stock_out",
      quantity,
      note: `Sipariş oluşturuldu - ${orderNo}`,
    });

    setMessage("Sipariş oluşturuldu. Ürün stoğu düşüldü.");
    setForm(emptyForm);
    setFormOpen(false);
    setSaving(false);
    await fetchData();
  }

  async function advanceOrder(order: Order) {
    const target = nextStatus(order.order_status);
    if (!target) return;

    const updates: Partial<Order> = {
      order_status: target,
      preparation_status: target === "preparing" ? "preparing" : target === "packed" || target === "shipped" || target === "delivered" ? "ready" : order.preparation_status,
      shipping_status: target === "shipped" ? "shipped" : target === "delivered" ? "delivered" : order.shipping_status,
    };

    await supabase.from("orders").update(updates).eq("id", order.id);

    if (target === "shipped") {
      const existingShipment = await supabase.from("shipments").select("id").eq("order_id", order.id).maybeSingle();

      if (!existingShipment.data) {
        await supabase.from("shipments").insert({
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
    await fetchData();
  }

  async function cancelOrder(order: Order) {
    if (!confirm(`${order.order_no} iptal edilsin mi?`)) return;

    await supabase.from("orders").update({ order_status: "cancelled" }).eq("id", order.id);
    setMessage("Sipariş iptal edildi.");
    await fetchData();
  }

  async function createReturn(order: Order) {
    const firstItem = getOrderItems(order.id)[0];

    await supabase.from("returns").insert({
      return_no: `RET-${Date.now().toString().slice(-8)}`,
      order_id: order.id,
      order_no: order.order_no,
      marketplace: order.marketplace,
      customer_name: order.customer_name,
      product_name: firstItem?.product_name ?? "Ürün belirtilmedi",
      reason: "Panelden manuel iade talebi oluşturuldu",
      status: "requested",
      amount: order.total_amount ?? 0,
      note: `${order.order_no} için iade talebi`,
    });

    await supabase.from("orders").update({ order_status: "return_requested" }).eq("id", order.id);

    setMessage("İade talebi oluşturuldu.");
    await fetchData();
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Takipio Operations
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">
              Siparişler
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Siparişi oluştur, hazırlanıyor / paketlendi / kargoda / teslim edildi akışını yönet.
            </p>
          </div>

          <button
            onClick={() => setFormOpen((value) => !value)}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500"
          >
            {formOpen ? "Formu Kapat" : "Yeni Sipariş"}
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <Metric label="Toplam Sipariş" value={String(orders.length)} valueClass="text-white" />
        <Metric label="Yeni / Bekleyen" value={String(waitingOrders)} valueClass="text-amber-300" />
        <Metric label="Hazırlanıyor" value={String(preparingOrders)} valueClass="text-blue-300" />
        <Metric label="Kargo Bekleyen" value={String(notShippedOrders)} valueClass="text-red-300" />
        <Metric label="Teslim Edilen" value={String(deliveredOrders)} valueClass="text-emerald-300" />
      </div>

      {formOpen ? (
        <form onSubmit={createOrder} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black">Yeni Sipariş Oluştur</h2>
              <p className="mt-1 text-sm text-slate-400">Şimdilik manuel test için. API bağlanınca pazaryerlerinden otomatik düşecek.</p>
            </div>
            <div className="rounded-2xl bg-[#0b1220] px-4 py-3 text-right ring-1 ring-white/10">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Önizleme</p>
              <p className="mt-1 text-lg font-black text-blue-300">{formatCurrency(previewTotal)}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Pazaryeri">
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

            <Field label="Ödeme">
              <select value={form.payment_status} onChange={(event) => setForm((current) => ({ ...current, payment_status: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                <option value="pending">Bekliyor</option>
                <option value="paid">Ödendi</option>
                <option value="partial">Kısmi</option>
              </select>
            </Field>

            <Field label="Not">
              <input value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" placeholder="Not" />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button disabled={saving} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-60">
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
            <p className="mt-1 text-sm text-slate-400">Hazırlama, paketleme, kargo ve iade kontrolü.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Sipariş ara..." className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none placeholder:text-slate-500 sm:w-[240px]" />
            <select value={marketplaceFilter} onChange={(event) => setMarketplaceFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
              <option value="all">Tüm Pazaryerleri</option>
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
              const target = nextStatus(order.order_status);

              return (
                <div key={order.id} className="rounded-[22px] border border-white/10 bg-[#0b1220] p-4 transition hover:bg-[#101a31]">
                  <div className="grid gap-4 xl:grid-cols-[1.1fr_0.8fr_0.7fr_0.9fr_auto] xl:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black">{order.order_no}</h3>
                        <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-300">{marketplaceLabel(order.marketplace)}</span>
                        <span className={["rounded-full px-3 py-1 text-xs font-black", statusClass(order.order_status)].join(" ")}>{statusLabel(order.order_status)}</span>
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
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Tutar</p>
                      <p className="mt-1 text-lg font-black">{formatCurrency(order.total_amount)}</p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Kargo</p>
                      <p className="mt-1 text-sm font-black text-slate-300">
                        {order.shipping_status === "delivered" ? "Teslim edildi" : order.shipping_status === "shipped" ? "Kargoda" : "Kargo bekliyor"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{order.tracking_no || "Takip no yok"}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
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
