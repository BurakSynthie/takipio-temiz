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

type Shipment = {
  id: string;
  order_id: string | null;
  order_no: string | null;
  marketplace: string | null;
  customer_name: string | null;
  cargo_company: string | null;
  tracking_no: string | null;
  shipping_status: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  note: string | null;
  created_at: string;
};

type Order = {
  id: string;
  order_no: string;
  marketplace: string | null;
  customer_name: string | null;
  cargo_company: string | null;
  tracking_no: string | null;
  shipping_status: string | null;
};

function formatDate(date: string | null | undefined) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

function marketplaceLabel(value: string | null | undefined) {
  if (value === "trendyol") return "Trendyol";
  if (value === "hepsiburada") return "Hepsiburada";
  if (value === "amazon") return "Amazon";
  if (value === "ciceksepeti") return "ÇiçekSepeti";
  return "Manuel";
}

function statusLabel(status: string | null | undefined) {
  if (status === "shipped") return "Kargoda";
  if (status === "delivered") return "Teslim Edildi";
  if (status === "cancelled") return "İptal";
  return "Kargo Bekliyor";
}

function statusClass(status: string | null | undefined) {
  if (status === "delivered") return "bg-emerald-400/15 text-emerald-300";
  if (status === "shipped") return "bg-blue-400/15 text-blue-300";
  if (status === "cancelled") return "bg-red-400/15 text-red-300";
  return "bg-amber-400/15 text-amber-300";
}

export default function ShipmentsPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    setMessage("");

    try {
      const ctx = await ensureBusinessForCurrentUser();
      setContext(ctx);

      const [shipmentsResult, ordersResult] = await Promise.all([
        supabase.from("shipments").select("*").eq("business_id", ctx.business.id).order("created_at", { ascending: false }),
        supabase.from("orders").select("id, order_no, marketplace, customer_name, cargo_company, tracking_no, shipping_status").eq("business_id", ctx.business.id).order("created_at", { ascending: false }),
      ]);

      if (shipmentsResult.error) {
        setMessage(`Kargo kayıtları alınamadı: ${shipmentsResult.error.message}`);
        return;
      }

      setShipments(shipmentsResult.data ?? []);
      setOrders(ordersResult.data ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "İşletme bağlantısı kurulamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const combinedRows = useMemo(() => {
    const shipmentOrderIds = new Set(shipments.map((item) => item.order_id));

    const shipmentRows = shipments.map((shipment) => ({
      id: shipment.id,
      order_id: shipment.order_id,
      order_no: shipment.order_no,
      marketplace: shipment.marketplace,
      customer_name: shipment.customer_name,
      cargo_company: shipment.cargo_company,
      tracking_no: shipment.tracking_no,
      shipping_status: shipment.shipping_status,
      shipped_at: shipment.shipped_at,
      delivered_at: shipment.delivered_at,
      note: shipment.note,
      source: "shipment",
    }));

    const orderRows = orders
      .filter((order) => !shipmentOrderIds.has(order.id))
      .map((order) => ({
        id: order.id,
        order_id: order.id,
        order_no: order.order_no,
        marketplace: order.marketplace,
        customer_name: order.customer_name,
        cargo_company: order.cargo_company,
        tracking_no: order.tracking_no,
        shipping_status: order.shipping_status ?? "not_shipped",
        shipped_at: null,
        delivered_at: null,
        note: "Sipariş kaydı var, kargo kaydı henüz oluşturulmadı.",
        source: "order",
      }));

    return [...shipmentRows, ...orderRows];
  }, [shipments, orders]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return combinedRows.filter((item) => {
      const matchesSearch =
        !query ||
        (item.order_no ?? "").toLowerCase().includes(query) ||
        (item.customer_name ?? "").toLowerCase().includes(query) ||
        (item.tracking_no ?? "").toLowerCase().includes(query) ||
        (item.cargo_company ?? "").toLowerCase().includes(query);

      const matchesStatus = statusFilter === "all" ? true : item.shipping_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [combinedRows, search, statusFilter]);

  const waitingCount = combinedRows.filter((item) => item.shipping_status !== "shipped" && item.shipping_status !== "delivered").length;
  const shippedCount = combinedRows.filter((item) => item.shipping_status === "shipped").length;
  const deliveredCount = combinedRows.filter((item) => item.shipping_status === "delivered").length;
  const canManage = hasPermission(context, "can_manage_shipments");

  async function markShipped(row: any) {
    if (!context) return;
    if (!canManage) {
      setMessage("Bu işletmede kargo güncelleme yetkin yok.");
      return;
    }

    const cargoCompany = prompt("Kargo firması:", row.cargo_company || "Yurtiçi Kargo") || row.cargo_company || "Yurtiçi Kargo";
    const trackingNo = prompt("Takip numarası:", row.tracking_no || "") || row.tracking_no || "";

    if (row.source === "shipment") {
      await supabase.from("shipments").update({
        cargo_company: cargoCompany,
        tracking_no: trackingNo,
        shipping_status: "shipped",
        shipped_at: new Date().toISOString(),
      }).eq("business_id", context.business.id).eq("id", row.id);
    } else {
      await supabase.from("shipments").insert({
        ...withBusinessFields(context),
        order_id: row.order_id,
        order_no: row.order_no,
        marketplace: row.marketplace,
        customer_name: row.customer_name,
        cargo_company: cargoCompany,
        tracking_no: trackingNo,
        shipping_status: "shipped",
        shipped_at: new Date().toISOString(),
        note: "Kargo sayfasından kargoya verildi.",
      });
    }

    await supabase.from("orders").update({
      order_status: "shipped",
      shipping_status: "shipped",
      cargo_company: cargoCompany,
      tracking_no: trackingNo,
    }).eq("business_id", context.business.id).eq("id", row.order_id);

    setMessage("Kargo durumu güncellendi.");
    await fetchData();
  }

  async function markDelivered(row: any) {
    if (!context) return;
    if (!canManage) {
      setMessage("Bu işletmede kargo güncelleme yetkin yok.");
      return;
    }

    if (row.source === "shipment") {
      await supabase.from("shipments").update({
        shipping_status: "delivered",
        delivered_at: new Date().toISOString(),
      }).eq("business_id", context.business.id).eq("id", row.id);
    }

    await supabase.from("orders").update({
      order_status: "delivered",
      shipping_status: "delivered",
    }).eq("business_id", context.business.id).eq("id", row.order_id);

    setMessage("Teslim edildi olarak işaretlendi.");
    await fetchData();
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">Cargo Business Core v1</div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Kargo Çıkışları</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Kargo kayıtları artık sadece aktif işletmenin siparişleriyle çalışır.</p>
          </div>

          <button onClick={fetchData} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500">Yenile</button>
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
        <Metric label="Toplam Kayıt" value={String(combinedRows.length)} valueClass="text-white" />
        <Metric label="Kargo Bekleyen" value={String(waitingCount)} valueClass="text-amber-300" />
        <Metric label="Kargoda" value={String(shippedCount)} valueClass="text-blue-300" />
        <Metric label="Teslim Edilen" value={String(deliveredCount)} valueClass="text-emerald-300" />
      </div>

      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black">Kargo Listesi</h2>
            <p className="mt-1 text-sm text-slate-400">Aktif işletmenin kargo bekleyen, kargoda ve teslim edilen siparişleri.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Kargo ara..." className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none placeholder:text-slate-500 sm:w-[240px]" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
              <option value="all">Tümü</option>
              <option value="not_shipped">Kargo Bekleyen</option>
              <option value="shipped">Kargoda</option>
              <option value="delivered">Teslim Edildi</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3">{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-[24px] bg-white/5" />)}</div>
        ) : filteredRows.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0b1220] p-10 text-center">
            <h3 className="text-xl font-black">Kargo kaydı bulunamadı</h3>
            <p className="mt-2 text-sm text-slate-500">Sipariş oluşturulduğunda burada kargo takibi yapılabilir.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredRows.map((row) => (
              <div key={`${row.source}-${row.id}`} className="rounded-[22px] border border-white/10 bg-[#0b1220] p-4 transition hover:bg-[#101a31]">
                <div className="grid gap-4 xl:grid-cols-[1fr_0.7fr_0.7fr_0.7fr_auto] xl:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black">{row.order_no}</h3>
                      <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-300">{marketplaceLabel(row.marketplace)}</span>
                      <span className={["rounded-full px-3 py-1 text-xs font-black", statusClass(row.shipping_status)].join(" ")}>{statusLabel(row.shipping_status)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{row.customer_name || "Müşteri yok"}</p>
                    <p className="mt-2 text-xs text-slate-500">{row.note || "-"}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Kargo Firması</p>
                    <p className="mt-1 text-sm font-black">{row.cargo_company || "-"}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Takip No</p>
                    <p className="mt-1 text-sm font-black">{row.tracking_no || "-"}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Tarih</p>
                    <p className="mt-1 text-xs text-slate-400">Çıkış: {formatDate(row.shipped_at)}</p>
                    <p className="mt-1 text-xs text-slate-400">Teslim: {formatDate(row.delivered_at)}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    {row.shipping_status !== "shipped" && row.shipping_status !== "delivered" ? (
                      <button onClick={() => markShipped(row)} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white">Kargoya Ver</button>
                    ) : null}
                    {row.shipping_status === "shipped" ? (
                      <button onClick={() => markDelivered(row)} className="rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-black text-emerald-300">Teslim Edildi</button>
                    ) : null}
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

function Metric({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-5">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={["mt-3 text-3xl font-black", valueClass || "text-white"].join(" ")}>{value}</p>
    </div>
  );
}
