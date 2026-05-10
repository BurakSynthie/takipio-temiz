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
  can_manage_shipments?: boolean | null;
};

type BusinessContext = {
  userEmail: string;
  business: Business;
  member: BusinessMember;
  isOwner: boolean;
};

type Order = {
  id: string;
  business_id: string;
  order_no: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  product_name: string | null;
  quantity: number | null;
  total_amount: number | null;
  payment_status: string | null;
  order_status: string | null;
  shipping_status: string | null;
  marketplace: string | null;
  marketplace_order_no: string | null;
  marketplace_package_id: string | null;
  marketplace_tracking_link: string | null;
  carrier_name: string | null;
  tracking_no: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
};

type ShipmentForm = {
  carrier_name: string;
  tracking_no: string;
};

const statusSteps = [
  { key: "waiting", label: "Bekliyor" },
  { key: "preparing", label: "Hazırlanıyor" },
  { key: "shipped", label: "Kargoda" },
  { key: "delivered", label: "Teslim" },
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

    return {
      userEmail,
      business,
      member: existingMember.data,
      isOwner: normalizeEmail(business.owner_email) === userEmail,
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

    return {
      userEmail,
      business: existingBusiness.data,
      member: ownerMember,
      isOwner: true,
    } satisfies BusinessContext;
  }

  const { data: createdBusiness, error } = await supabase
    .from("businesses")
    .insert({ owner_email: userEmail, name: "İşletmem", email: userEmail })
    .select("*")
    .single();

  if (error || !createdBusiness) throw new Error(`İşletme oluşturulamadı: ${error?.message ?? "Bilinmeyen hata"}`);

  const ownerMember = await ensureOwnerMember(createdBusiness.id, userEmail);

  return {
    userEmail,
    business: createdBusiness,
    member: ownerMember,
    isOwner: true,
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

function statusLabel(status: string | null | undefined) {
  if (status === "waiting") return "Kargo Bekliyor";
  if (status === "preparing") return "Hazırlanıyor";
  if (status === "shipped") return "Kargoda";
  if (status === "delivered") return "Teslim Edildi";
  return "Kargo Bekliyor";
}

function statusBadgeClass(status: string | null | undefined) {
  if (status === "delivered") return "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20";
  if (status === "shipped") return "bg-cyan-500/15 text-cyan-300 ring-cyan-400/20";
  if (status === "preparing") return "bg-blue-500/15 text-blue-300 ring-blue-400/20";
  return "bg-amber-500/15 text-amber-300 ring-amber-400/20";
}

function nextActionLabel(status: string | null | undefined) {
  if (!status || status === "waiting") return "Hazırlığa Al";
  if (status === "preparing") return "Kargoya Ver";
  if (status === "shipped") return "Teslim Edildi";
  if (status === "delivered") return "Teslim Edildi";
  return "Sonraki Adım";
}

function nextStatus(status: string | null | undefined) {
  if (!status || status === "waiting") return "preparing";
  if (status === "preparing") return "shipped";
  if (status === "shipped") return "delivered";
  return "delivered";
}

function stepIndex(status: string | null | undefined) {
  if (status === "preparing") return 1;
  if (status === "shipped") return 2;
  if (status === "delivered") return 3;
  return 0;
}

export default function ShipmentsPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [form, setForm] = useState<ShipmentForm>({ carrier_name: "", tracking_no: "" });
  const [filter, setFilter] = useState<"all" | "waiting" | "preparing" | "shipped" | "delivered">("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canManage = Boolean(context?.isOwner || context?.member.can_manage_shipments);

  async function fetchData() {
    setLoading(true);
    setMessage("");

    try {
      const ctx = await ensureBusinessForCurrentUser();
      setContext(ctx);

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("business_id", ctx.business.id)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(`Kargo kayıtları alınamadı: ${error.message}`);
        return;
      }

      setOrders((data ?? []) as Order[]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Kargo kayıtları alınamadı.";

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

  function openShipment(order: Order) {
    setSelectedOrder(order);
    setForm({
      carrier_name: order.carrier_name || "",
      tracking_no: order.tracking_no || "",
    });
  }

  async function updateShipmentFields(order: Order, nextFields: Partial<Order>) {
    if (!context || !canManage) {
      setMessage("Bu işletmede kargo yönetimi yetkin yok.");
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      ...nextFields,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("orders")
      .update(payload)
      .eq("business_id", context.business.id)
      .eq("id", order.id);

    if (error) {
      setMessage(`Kargo güncellenemedi: ${error.message}`);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSelectedOrder(null);
    setMessage("Kargo bilgisi güncellendi.");
    await fetchData();
  }

  async function saveShipmentInfo() {
    if (!selectedOrder) return;

    await updateShipmentFields(selectedOrder, {
      carrier_name: form.carrier_name.trim() || null,
      tracking_no: form.tracking_no.trim() || null,
    } as Partial<Order>);
  }

  async function moveNext(order: Order) {
    const target = nextStatus(order.shipping_status);
    const now = new Date().toISOString();

    await updateShipmentFields(order, {
      shipping_status: target,
      order_status: target === "delivered" ? "completed" : target === "shipped" ? "packed" : order.order_status,
      shipped_at: target === "shipped" && !order.shipped_at ? now : order.shipped_at,
      delivered_at: target === "delivered" ? now : order.delivered_at,
    } as Partial<Order>);
  }

  async function setStatus(order: Order, status: string) {
    const now = new Date().toISOString();

    await updateShipmentFields(order, {
      shipping_status: status,
      order_status: status === "delivered" ? "completed" : status === "shipped" ? "packed" : order.order_status,
      shipped_at: status === "shipped" && !order.shipped_at ? now : order.shipped_at,
      delivered_at: status === "delivered" ? now : status === "delivered" ? now : order.delivered_at,
    } as Partial<Order>);
  }

  const filteredOrders = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((order) => (order.shipping_status || "waiting") === filter);
  }, [orders, filter]);

  const stats = useMemo(() => {
    return {
      all: orders.length,
      waiting: orders.filter((order) => !order.shipping_status || order.shipping_status === "waiting").length,
      preparing: orders.filter((order) => order.shipping_status === "preparing").length,
      shipped: orders.filter((order) => order.shipping_status === "shipped").length,
      delivered: orders.filter((order) => order.shipping_status === "delivered").length,
    };
  }, [orders]);

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Shipping Center v15.1
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Kargo</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Siparişlerin kargo durumunu tek bakışta gör, sonraki aksiyonu hızlıca tamamla.
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <FilterMetric active={filter === "all"} label="Tümü" value={loading ? "..." : String(stats.all)} onClick={() => setFilter("all")} />
        <FilterMetric active={filter === "waiting"} label="Bekleyen" value={loading ? "..." : String(stats.waiting)} onClick={() => setFilter("waiting")} />
        <FilterMetric active={filter === "preparing"} label="Hazırlanan" value={loading ? "..." : String(stats.preparing)} onClick={() => setFilter("preparing")} />
        <FilterMetric active={filter === "shipped"} label="Kargoda" value={loading ? "..." : String(stats.shipped)} onClick={() => setFilter("shipped")} />
        <FilterMetric active={filter === "delivered"} label="Teslim" value={loading ? "..." : String(stats.delivered)} onClick={() => setFilter("delivered")} />
      </div>

      <div className="grid gap-3">
        {filteredOrders.length === 0 ? (
          <div className="rounded-[26px] border border-dashed border-white/10 bg-[#111a2e] p-10 text-center">
            <p className="text-sm font-bold text-slate-500">Bu filtrede kargo kaydı yok.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <article key={order.id} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-4">
              <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr_0.9fr] xl:items-center">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black">{order.order_no || "Sipariş"}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusBadgeClass(order.shipping_status)}`}>
                      {statusLabel(order.shipping_status)}
                    </span>
                    {getMarketplaceLabel(order.marketplace) ? (
                      <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-black text-orange-300 ring-1 ring-orange-400/20">
                        {getMarketplaceLabel(order.marketplace)}
                      </span>
                    ) : null}
                  </div>

                  <p className="text-sm font-bold text-slate-300">{order.product_name || "Ürün adı yok"} · {order.quantity ?? 1} adet</p>
                  <p className="mt-1 text-xs text-slate-500">{order.customer_name || "Müşteri yok"} · {formatDate(order.created_at)}</p>
                  <p className="mt-2 text-sm font-black text-emerald-300">{formatCurrency(order.total_amount)}</p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-[#0b1220] p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Kargo Akışı</p>
                      <p className="mt-1 text-sm font-black text-white">Sonraki işlem: {order.shipping_status === "delivered" ? "Tamamlandı" : nextActionLabel(order.shipping_status)}</p>
                    </div>
                    <span className="rounded-full bg-white/8 px-3 py-1 text-[11px] font-black text-slate-300 ring-1 ring-white/10">
                      {stepIndex(order.shipping_status) + 1}/4
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {statusSteps.map((step, index) => {
                      const currentIndex = stepIndex(order.shipping_status);
                      const isActive = index <= currentIndex;

                      return (
                        <button
                          key={step.key}
                          onClick={() => setStatus(order, step.key)}
                          disabled={!canManage || saving}
                          className={`rounded-2xl px-2 py-2 text-[10px] font-black transition ${
                            isActive
                              ? "bg-blue-500/20 text-blue-200 ring-1 ring-blue-400/20"
                              : "bg-white/5 text-slate-500 ring-1 ring-white/10 hover:bg-white/8"
                          }`}
                        >
                          <span className={`mx-auto mb-1 block h-2 w-2 rounded-full ${isActive ? "bg-blue-300" : "bg-slate-600"}`} />
                          {step.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-[22px] border border-white/10 bg-[#0b1220] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Kargo Bilgisi</p>
                    <p className="mt-3 text-sm font-black text-white">{order.carrier_name || "Kargo firması bekleniyor"}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{order.tracking_no || "Takip numarası bekleniyor"}</p>
                    {order.marketplace_tracking_link ? (
                      <a href={order.marketplace_tracking_link} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-300 ring-1 ring-blue-400/20">
                        Kargo linki
                      </a>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => openShipment(order)} className="rounded-2xl bg-blue-500/15 px-4 py-2.5 text-xs font-black text-blue-300 ring-1 ring-blue-400/20 transition hover:bg-blue-500/25">
                      Bilgi Gir
                    </button>
                    <button
                      onClick={() => moveNext(order)}
                      disabled={!canManage || saving || order.shipping_status === "delivered"}
                      className="rounded-2xl bg-emerald-500/15 px-4 py-2.5 text-xs font-black text-emerald-300 ring-1 ring-emerald-400/20 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {order.shipping_status === "delivered" ? "Tamamlandı" : nextActionLabel(order.shipping_status)}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[#111a2e] p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-300">Kargo Bilgisi</p>
                <h2 className="mt-2 text-2xl font-black">{selectedOrder.order_no}</h2>
                <p className="mt-1 text-sm text-slate-400">{selectedOrder.customer_name || "Müşteri yok"}</p>
              </div>

              <button onClick={() => setSelectedOrder(null)} className="rounded-2xl bg-white/8 px-3 py-2 text-xs font-black text-slate-300 ring-1 ring-white/10">
                Kapat
              </button>
            </div>

            <div className="grid gap-3">
              <label>
                <span className="mb-1.5 block text-xs font-black text-slate-400">Kargo Firması</span>
                <input
                  value={form.carrier_name}
                  onChange={(event) => setForm((current) => ({ ...current, carrier_name: event.target.value }))}
                  placeholder="Yurtiçi, Aras, MNG..."
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-black text-slate-400">Takip Numarası</span>
                <input
                  value={form.tracking_no}
                  onChange={(event) => setForm((current) => ({ ...current, tracking_no: event.target.value }))}
                  placeholder="Kargo takip no"
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={saveShipmentInfo}
                disabled={saving}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-50"
              >
                Kaydet
              </button>
              <button
                onClick={() => {
                  setForm({ carrier_name: "", tracking_no: "" });
                }}
                className="rounded-2xl bg-white/8 px-5 py-3 text-sm font-black text-slate-300 ring-1 ring-white/10"
              >
                Temizle
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
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
