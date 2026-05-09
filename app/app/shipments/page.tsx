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
  product_name: string | null;
  quantity: number | null;
  order_status: string | null;
  shipping_status: string | null;
  carrier_name: string | null;
  tracking_no: string | null;
  created_at: string;
};

type Shipment = {
  id: string;
  order_id: string | null;
  order_no: string | null;
  customer_name: string | null;
  carrier_name: string | null;
  tracking_no: string | null;
  shipment_status: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  note: string | null;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  waiting: "Bekliyor",
  preparing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
};

const carrierOptions = ["Yurtiçi Kargo", "Aras Kargo", "MNG Kargo", "Sürat Kargo", "PTT Kargo", "Trendyol Express", "Hepsijet", "Diğer"];

export default function ShipmentsPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [carrierName, setCarrierName] = useState("Yurtiçi Kargo");
  const [trackingNo, setTrackingNo] = useState("");
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const canManage = Boolean(context?.isOwner || context?.member.can_manage_shipments || context?.member.can_manage_orders);

  async function fetchData(existingContext?: BusinessContext) {
    setLoading(true);
    setMessage("");

    try {
      const ctx = existingContext ?? await ensureBusinessForCurrentUser();
      setContext(ctx);

      const [ordersResult, shipmentsResult] = await Promise.all([
        supabase
          .from("orders")
          .select("id, order_no, customer_name, product_name, quantity, order_status, shipping_status, carrier_name, tracking_no, created_at")
          .eq("business_id", ctx.business.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("shipments")
          .select("*")
          .eq("business_id", ctx.business.id)
          .order("created_at", { ascending: false }),
      ]);

      if (ordersResult.error) {
        setMessage(`Siparişler alınamadı: ${ordersResult.error.message}`);
        return;
      }

      if (shipmentsResult.error) {
        setMessage(`Kargo kayıtları alınamadı: ${shipmentsResult.error.message}`);
        return;
      }

      setOrders(ordersResult.data ?? []);
      setShipments(shipmentsResult.data ?? []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Kargo verisi alınamadı.";
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

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? null;

  const filteredOrders = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((order) => (order.shipping_status || "waiting") === filter);
  }, [orders, filter]);

  const waitingCount = orders.filter((order) => !order.shipping_status || order.shipping_status === "waiting").length;
  const preparingCount = orders.filter((order) => order.shipping_status === "preparing").length;
  const shippedCount = orders.filter((order) => order.shipping_status === "shipped").length;
  const deliveredCount = orders.filter((order) => order.shipping_status === "delivered").length;

  async function saveShipment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede kargo yönetimi yetkin yok.");
      return;
    }

    if (!selectedOrder) {
      setMessage("Önce sipariş seçmelisin.");
      return;
    }

    const shipmentPayload = {
      ...withBusinessFields(context),
      order_id: selectedOrder.id,
      order_no: selectedOrder.order_no,
      customer_name: selectedOrder.customer_name,
      carrier_name: carrierName,
      tracking_no: trackingNo.trim() || null,
      shipment_status: "preparing",
      note: note.trim() || null,
    };

    const existingShipment = shipments.find((item) => item.order_id === selectedOrder.id);

    const result = existingShipment
      ? await supabase
          .from("shipments")
          .update({ ...shipmentPayload, updated_at: new Date().toISOString() })
          .eq("business_id", context.business.id)
          .eq("id", existingShipment.id)
      : await supabase
          .from("shipments")
          .insert(shipmentPayload);

    if (result.error) {
      setMessage(`Kargo kaydı oluşturulamadı: ${result.error.message}`);
      return;
    }

    const { error: orderError } = await supabase
      .from("orders")
      .update({
        shipping_status: "preparing",
        order_status: "packed",
        carrier_name: carrierName,
        tracking_no: trackingNo.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("business_id", context.business.id)
      .eq("id", selectedOrder.id);

    if (orderError) {
      setMessage(`Sipariş kargo bilgisi güncellenemedi: ${orderError.message}`);
      return;
    }

    setMessage("Kargo kaydı hazırlandı.");
    setSelectedOrderId("");
    setTrackingNo("");
    setNote("");
    await fetchData(context);
  }

  async function updateShipmentStatus(order: Order, nextStatus: string) {
    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede kargo güncelleme yetkin yok.");
      return;
    }

    const now = new Date().toISOString();
    const shipment = shipments.find((item) => item.order_id === order.id);

    const shipmentPayload: Record<string, string | null> = {
      shipment_status: nextStatus,
      updated_at: now,
    };

    const orderPayload: Record<string, string | null> = {
      shipping_status: nextStatus,
      updated_at: now,
    };

    if (nextStatus === "shipped") {
      shipmentPayload.shipped_at = now;
      orderPayload.shipped_at = now;
    }

    if (nextStatus === "delivered") {
      shipmentPayload.delivered_at = now;
      orderPayload.delivered_at = now;
      orderPayload.order_status = "completed";
    }

    if (shipment) {
      const { error } = await supabase
        .from("shipments")
        .update(shipmentPayload)
        .eq("business_id", context.business.id)
        .eq("id", shipment.id);

      if (error) {
        setMessage(`Kargo durumu güncellenemedi: ${error.message}`);
        return;
      }
    } else {
      const { error } = await supabase
        .from("shipments")
        .insert({
          ...withBusinessFields(context),
          order_id: order.id,
          order_no: order.order_no,
          customer_name: order.customer_name,
          carrier_name: order.carrier_name,
          tracking_no: order.tracking_no,
          shipment_status: nextStatus,
          shipped_at: nextStatus === "shipped" ? now : null,
          delivered_at: nextStatus === "delivered" ? now : null,
        });

      if (error) {
        setMessage(`Kargo kaydı oluşturulamadı: ${error.message}`);
        return;
      }
    }

    const { error: orderError } = await supabase
      .from("orders")
      .update(orderPayload)
      .eq("business_id", context.business.id)
      .eq("id", order.id);

    if (orderError) {
      setMessage(`Sipariş kargo durumu güncellenemedi: ${orderError.message}`);
      return;
    }

    setMessage("Kargo durumu güncellendi.");
    await fetchData(context);
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Shipments / Delivery v4
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Kargo</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Siparişin hazırlanma, kargo çıkışı, takip numarası ve teslimat sürecini takip et.
            </p>
          </div>

          <button onClick={() => fetchData(context ?? undefined)} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500">
            Yenile
          </button>
        </div>
      </div>

      {message ? <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">{message}</div> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Bekleyen" value={String(waitingCount)} valueClass="text-amber-300" />
        <Metric label="Hazırlanan" value={String(preparingCount)} valueClass="text-blue-300" />
        <Metric label="Kargoda" value={String(shippedCount)} valueClass="text-cyan-300" />
        <Metric label="Teslim" value={String(deliveredCount)} valueClass="text-emerald-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={saveShipment} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <h2 className="text-2xl font-black">Kargo Hazırla</h2>
          <p className="mt-1 text-sm text-slate-400">Sipariş seç, kargo firması ve takip numarası gir.</p>

          <div className="mt-5 grid gap-3">
            <Field label="Sipariş">
              <select value={selectedOrderId} onChange={(event) => setSelectedOrderId(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                <option value="">Sipariş seç</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>{order.order_no} · {order.customer_name || "Müşteri yok"} · {order.product_name}</option>
                ))}
              </select>
            </Field>

            <Field label="Kargo Firması">
              <select value={carrierName} onChange={(event) => setCarrierName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                {carrierOptions.map((carrier) => <option key={carrier} value={carrier}>{carrier}</option>)}
              </select>
            </Field>

            <Field label="Takip No">
              <input value={trackingNo} onChange={(event) => setTrackingNo(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Not">
              <textarea value={note} onChange={(event) => setNote(event.target.value)} className="min-h-24 w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>
          </div>

          <button disabled={!canManage} className="mt-5 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
            Kargoyu Hazırla
          </button>
        </form>

        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black">Kargo Listesi</h2>
              <p className="mt-1 text-sm text-slate-400">Siparişlerin kargo durumunu buradan güncelle.</p>
            </div>
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
              <option value="all">Tümü</option>
              <option value="waiting">Bekleyen</option>
              <option value="preparing">Hazırlanıyor</option>
              <option value="shipped">Kargoda</option>
              <option value="delivered">Teslim</option>
            </select>
          </div>

          {loading ? (
            <div className="grid gap-3">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-[24px] bg-white/5" />)}</div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0b1220] p-10 text-center">
              <h3 className="text-xl font-black">Kargo kaydı yok</h3>
              <p className="mt-2 text-sm text-slate-500">Sipariş oluşturunca burada görünür.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredOrders.map((order) => (
                <div key={order.id} className="rounded-[22px] border border-white/10 bg-[#0b1220] p-4 transition hover:bg-[#101a31]">
                  <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr_auto] xl:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black">{order.order_no || "-"}</h3>
                        <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-300">{statusLabels[order.shipping_status || "waiting"]}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">{order.product_name || "Ürün yok"} · {order.quantity ?? 0} adet</p>
                      <p className="mt-1 text-xs text-slate-500">{order.customer_name || "Müşteri yok"} · {formatDate(order.created_at)}</p>
                    </div>

                    <div className="rounded-2xl bg-[#111a2e] p-4 ring-1 ring-white/10">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Kargo Bilgisi</p>
                      <p className="mt-2 text-sm font-black">{order.carrier_name || "Firma yok"}</p>
                      <p className="mt-1 break-all text-xs text-blue-300">{order.tracking_no || "Takip no yok"}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <button onClick={() => updateShipmentStatus(order, "preparing")} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-slate-200">Hazırla</button>
                      <button onClick={() => updateShipmentStatus(order, "shipped")} className="rounded-xl bg-cyan-500/15 px-3 py-2 text-xs font-black text-cyan-300">Kargoda</button>
                      <button onClick={() => updateShipmentStatus(order, "delivered")} className="rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-black text-emerald-300">Teslim</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
