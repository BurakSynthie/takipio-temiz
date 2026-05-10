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
  can_manage_customers?: boolean | null;
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

type Customer = {
  id: string;
  business_id: string;
  created_by: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  tag: string | null;
  note: string | null;
  total_orders: number | null;
  total_spent: number | null;
  total_remaining: number | null;
  last_order_at: string | null;
  source: string | null;
  created_at: string;
  updated_at: string | null;
};

type Order = {
  id: string;
  business_id: string;
  order_no: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  product_name: string | null;
  total_amount: number | null;
  paid_amount: number | null;
  remaining_amount: number | null;
  payment_status: string | null;
  order_status: string | null;
  marketplace: string | null;
  created_at: string;
};

type CustomerForm = {
  name: string;
  phone: string;
  email: string;
  tag: string;
  note: string;
};

const emptyForm: CustomerForm = {
  name: "",
  phone: "",
  email: "",
  tag: "normal",
  note: "",
};

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

function normalizePhone(phone: string | null | undefined) {
  return (phone ?? "").replace(/\s+/g, " ").trim();
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
  return "Manuel";
}

function tagLabel(tag: string | null | undefined) {
  if (tag === "vip") return "VIP";
  if (tag === "risk") return "Riskli";
  if (tag === "lead") return "Aday";
  if (tag === "wholesale") return "Toptan";
  return "Normal";
}

function tagClass(tag: string | null | undefined) {
  if (tag === "vip") return "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20";
  if (tag === "risk") return "bg-red-500/15 text-red-300 ring-red-400/20";
  if (tag === "lead") return "bg-blue-500/15 text-blue-300 ring-blue-400/20";
  if (tag === "wholesale") return "bg-purple-500/15 text-purple-300 ring-purple-400/20";
  return "bg-slate-500/15 text-slate-300 ring-white/10";
}

function paymentStatusLabel(status: string | null | undefined) {
  if (status === "paid") return "Ödendi";
  if (status === "partial") return "Kısmi";
  return "Bekliyor";
}

function paymentStatusClass(status: string | null | undefined) {
  if (status === "paid") return "text-emerald-300";
  if (status === "partial") return "text-amber-300";
  return "text-red-300";
}

function customerKeyFromOrder(order: Order) {
  const phone = normalizePhone(order.customer_phone);
  const email = normalizeEmail(order.customer_email);
  const name = (order.customer_name || "").trim();

  if (phone) return `phone:${phone}`;
  if (email) return `email:${email}`;
  return `name:${name.toLowerCase()}`;
}

function aggregateOrdersForCustomer(customer: Customer, orders: Order[]) {
  const customerPhone = normalizePhone(customer.phone);
  const customerEmail = normalizeEmail(customer.email);
  const customerName = customer.name.trim().toLowerCase();

  return orders.filter((order) => {
    const orderPhone = normalizePhone(order.customer_phone);
    const orderEmail = normalizeEmail(order.customer_email);
    const orderName = (order.customer_name || "").trim().toLowerCase();

    if (customerPhone && orderPhone) return customerPhone === orderPhone;
    if (customerEmail && orderEmail) return customerEmail === orderEmail;
    return Boolean(customerName && orderName && customerName === orderName);
  });
}

export default function CustomersPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [detailForm, setDetailForm] = useState<CustomerForm>(emptyForm);
  const [filter, setFilter] = useState<"all" | "vip" | "risk" | "lead" | "debt">("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canManage = Boolean(context?.isOwner || context?.member.can_manage_customers);

  async function fetchData() {
    setLoading(true);
    setMessage("");

    try {
      const ctx = await ensureBusinessForCurrentUser();
      setContext(ctx);

      const [customersResult, ordersResult] = await Promise.all([
        supabase
          .from("customers")
          .select("*")
          .eq("business_id", ctx.business.id)
          .order("updated_at", { ascending: false }),
        supabase
          .from("orders")
          .select("*")
          .eq("business_id", ctx.business.id)
          .order("created_at", { ascending: false }),
      ]);

      if (customersResult.error) {
        setMessage(`Müşteriler alınamadı: ${customersResult.error.message}`);
        return;
      }

      if (ordersResult.error) {
        setMessage(`Siparişler alınamadı: ${ordersResult.error.message}`);
        return;
      }

      setCustomers((customersResult.data ?? []) as Customer[]);
      setOrders((ordersResult.data ?? []) as Order[]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Müşteri verisi alınamadı.";

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

  async function createCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede müşteri yönetimi yetkin yok.");
      return;
    }

    if (!form.name.trim()) {
      setMessage("Müşteri adı zorunlu.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("customers").insert({
      business_id: context.business.id,
      created_by: context.userEmail,
      name: form.name.trim(),
      phone: normalizePhone(form.phone) || null,
      email: normalizeEmail(form.email) || null,
      tag: form.tag,
      note: form.note.trim() || null,
      source: "manual",
    });

    if (error) {
      setMessage(`Müşteri oluşturulamadı: ${error.message}`);
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowCreate(false);
    setForm(emptyForm);
    setMessage("Müşteri oluşturuldu.");
    await fetchData();
  }

  function openDetail(customer: Customer) {
    setDetailCustomer(customer);
    setDetailForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      tag: customer.tag || "normal",
      note: customer.note || "",
    });
  }

  async function saveDetail() {
    if (!detailCustomer) return;

    if (!canManage) {
      setMessage("Bu işletmede müşteri yönetimi yetkin yok.");
      return;
    }

    if (!detailForm.name.trim()) {
      setMessage("Müşteri adı boş olamaz.");
      return;
    }

    const { error } = await supabase
      .from("customers")
      .update({
        name: detailForm.name.trim(),
        phone: normalizePhone(detailForm.phone) || null,
        email: normalizeEmail(detailForm.email) || null,
        tag: detailForm.tag,
        note: detailForm.note.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("business_id", detailCustomer.business_id)
      .eq("id", detailCustomer.id);

    if (error) {
      setMessage(`Müşteri güncellenemedi: ${error.message}`);
      return;
    }

    setDetailCustomer(null);
    setMessage("Müşteri kaydedildi.");
    await fetchData();
  }

  async function deleteCustomer(customer: Customer) {
    if (!canManage) {
      setMessage("Bu işletmede müşteri silme yetkin yok.");
      return;
    }

    if (!confirm(`${customer.name} silinsin mi? Siparişler silinmez.`)) return;

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("business_id", customer.business_id)
      .eq("id", customer.id);

    if (error) {
      setMessage(`Müşteri silinemedi: ${error.message}`);
      return;
    }

    setMessage("Müşteri silindi. Sipariş geçmişi korunur.");
    await fetchData();
  }

  async function syncFromOrders() {
    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede müşteri senkron yetkin yok.");
      return;
    }

    setSaving(true);
    setMessage("");

    const grouped = new Map<string, Order[]>();

    orders.forEach((order) => {
      const name = (order.customer_name || "").trim();
      if (!name) return;

      const key = customerKeyFromOrder(order);
      const existing = grouped.get(key) || [];
      existing.push(order);
      grouped.set(key, existing);
    });

    let inserted = 0;
    let updated = 0;

    for (const groupOrders of grouped.values()) {
      const first = groupOrders[0];
      const name = (first.customer_name || "Müşteri").trim();
      const phone = normalizePhone(first.customer_phone);
      const email = normalizeEmail(first.customer_email);
      const totalOrders = groupOrders.length;
      const totalSpent = groupOrders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0);
      const totalRemaining = groupOrders.reduce((sum, order) => sum + Number(order.remaining_amount ?? 0), 0);
      const lastOrderAt = groupOrders
        .map((order) => order.created_at)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

      const match = customers.find((customer) => {
        const customerPhone = normalizePhone(customer.phone);
        const customerEmail = normalizeEmail(customer.email);
        const customerName = customer.name.trim().toLowerCase();

        if (phone && customerPhone) return phone === customerPhone;
        if (email && customerEmail) return email === customerEmail;
        return customerName === name.toLowerCase();
      });

      const payload = {
        business_id: context.business.id,
        created_by: context.userEmail,
        name,
        phone: phone || null,
        email: email || null,
        total_orders: totalOrders,
        total_spent: totalSpent,
        total_remaining: totalRemaining,
        last_order_at: lastOrderAt,
        source: "orders_sync",
        updated_at: new Date().toISOString(),
      };

      if (match) {
        const { error } = await supabase
          .from("customers")
          .update(payload)
          .eq("business_id", context.business.id)
          .eq("id", match.id);

        if (error) {
          setMessage(`Senkron hatası: ${error.message}`);
          setSaving(false);
          return;
        }

        updated += 1;
      } else {
        const { error } = await supabase
          .from("customers")
          .insert({
            ...payload,
            tag: "normal",
            note: null,
          });

        if (error) {
          setMessage(`Senkron hatası: ${error.message}`);
          setSaving(false);
          return;
        }

        inserted += 1;
      }
    }

    setSaving(false);
    setMessage(`Müşteri senkronu tamamlandı. Yeni: ${inserted}, güncellenen: ${updated}.`);
    await fetchData();
  }

  const customersWithLiveStats = useMemo(() => {
    return customers.map((customer) => {
      const relatedOrders = aggregateOrdersForCustomer(customer, orders);
      const totalOrders = relatedOrders.length || Number(customer.total_orders ?? 0);
      const totalSpent = relatedOrders.length > 0 ? relatedOrders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0) : Number(customer.total_spent ?? 0);
      const totalRemaining = relatedOrders.length > 0 ? relatedOrders.reduce((sum, order) => sum + Number(order.remaining_amount ?? 0), 0) : Number(customer.total_remaining ?? 0);
      const lastOrderAt = relatedOrders.length > 0
        ? relatedOrders.map((order) => order.created_at).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
        : customer.last_order_at;

      return {
        customer,
        relatedOrders,
        totalOrders,
        totalSpent,
        totalRemaining,
        lastOrderAt,
      };
    });
  }, [customers, orders]);

  const filteredCustomers = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    return customersWithLiveStats.filter((item) => {
      const customer = item.customer;

      if (filter === "vip" && customer.tag !== "vip") return false;
      if (filter === "risk" && customer.tag !== "risk") return false;
      if (filter === "lead" && customer.tag !== "lead") return false;
      if (filter === "debt" && item.totalRemaining <= 0) return false;

      if (!cleanSearch) return true;

      return (
        customer.name.toLowerCase().includes(cleanSearch) ||
        (customer.phone || "").toLowerCase().includes(cleanSearch) ||
        (customer.email || "").toLowerCase().includes(cleanSearch)
      );
    });
  }, [customersWithLiveStats, filter, search]);

  const stats = useMemo(() => {
    return {
      total: customers.length,
      vip: customers.filter((customer) => customer.tag === "vip").length,
      risk: customers.filter((customer) => customer.tag === "risk").length,
      lead: customers.filter((customer) => customer.tag === "lead").length,
      debt: customersWithLiveStats.filter((item) => item.totalRemaining > 0).length,
      revenue: customersWithLiveStats.reduce((sum, item) => sum + item.totalSpent, 0),
    };
  }, [customers, customersWithLiveStats]);

  const detailOrders = detailCustomer ? aggregateOrdersForCustomer(detailCustomer, orders) : [];

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              CRM Center v17
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Müşteriler</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Müşteri bilgilerini, sipariş geçmişini, toplam harcamayı ve kalan tahsilatı tek merkezde yönet.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowCreate((value) => !value)} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500">
              {showCreate ? "Formu Kapat" : "Yeni Müşteri"}
            </button>
            <button onClick={syncFromOrders} disabled={saving || !canManage} className="rounded-2xl bg-emerald-500/15 px-5 py-3 text-sm font-black text-emerald-300 ring-1 ring-emerald-400/20 transition hover:bg-emerald-500/25 disabled:opacity-50">
              Siparişlerden Senkronla
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <FilterMetric active={filter === "all"} label="Toplam" value={loading ? "..." : String(stats.total)} onClick={() => setFilter("all")} />
        <FilterMetric active={filter === "vip"} label="VIP" value={loading ? "..." : String(stats.vip)} onClick={() => setFilter("vip")} />
        <FilterMetric active={filter === "risk"} label="Riskli" value={loading ? "..." : String(stats.risk)} onClick={() => setFilter("risk")} />
        <FilterMetric active={filter === "lead"} label="Aday" value={loading ? "..." : String(stats.lead)} onClick={() => setFilter("lead")} />
        <FilterMetric active={filter === "debt"} label="Borçlu" value={loading ? "..." : String(stats.debt)} onClick={() => setFilter("debt")} />
        <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Müşteri Cirosu</p>
          <p className="mt-3 text-2xl font-black text-emerald-300">{formatCurrency(stats.revenue)}</p>
        </div>
      </div>

      <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Müşteri adı, telefon veya e-posta ara..."
          className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-600"
        />
      </div>

      {showCreate ? (
        <form onSubmit={createCustomer} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-4">
            <h2 className="text-2xl font-black">Yeni Müşteri</h2>
            <p className="mt-1 text-sm text-slate-400">Müşteriyi manuel olarak CRM’e ekle.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Field label="Müşteri Adı">
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Telefon">
              <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="E-posta">
              <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Etiket">
              <select value={form.tag} onChange={(event) => setForm((current) => ({ ...current, tag: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                <option value="normal">Normal</option>
                <option value="vip">VIP</option>
                <option value="lead">Aday</option>
                <option value="wholesale">Toptan</option>
                <option value="risk">Riskli</option>
              </select>
            </Field>

            <label>
              <span className="mb-1.5 block text-xs font-black text-slate-400">Not</span>
              <input value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button disabled={saving || !canManage} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-50">
              {saving ? "Kaydediliyor..." : "Müşteri Oluştur"}
            </button>
            <button type="button" onClick={() => setForm(emptyForm)} className="rounded-2xl bg-white/8 px-5 py-3 text-sm font-black text-slate-300 ring-1 ring-white/10">
              Temizle
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-3">
        {filteredCustomers.length === 0 ? (
          <div className="rounded-[26px] border border-dashed border-white/10 bg-[#111a2e] p-10 text-center">
            <p className="text-sm font-bold text-slate-500">
              Müşteri bulunamadı. Siparişlerden senkronla butonuyla mevcut siparişlerden müşteri oluşturabilirsin.
            </p>
          </div>
        ) : (
          filteredCustomers.map((item) => (
            <article key={item.customer.id} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-4">
              <div className="grid gap-4 xl:grid-cols-[1.1fr_1.2fr_0.7fr] xl:items-center">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black">{item.customer.name}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${tagClass(item.customer.tag)}`}>
                      {tagLabel(item.customer.tag)}
                    </span>
                    {item.customer.source === "orders_sync" ? (
                      <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-300 ring-1 ring-blue-400/20">
                        Siparişten
                      </span>
                    ) : null}
                  </div>

                  <p className="text-sm font-bold text-slate-300">{item.customer.phone || "Telefon yok"} · {item.customer.email || "E-posta yok"}</p>
                  <p className="mt-1 text-xs text-slate-500">Son sipariş: {formatDate(item.lastOrderAt)}</p>
                  {item.customer.note ? <p className="mt-2 text-xs leading-5 text-slate-400">{item.customer.note}</p> : null}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <InfoBox label="Sipariş" value={String(item.totalOrders)} valueClass="text-blue-300" />
                  <InfoBox label="Harcama" value={formatCurrency(item.totalSpent)} valueClass="text-emerald-300" />
                  <InfoBox label="Kalan" value={formatCurrency(item.totalRemaining)} valueClass={item.totalRemaining > 0 ? "text-amber-300" : "text-slate-300"} />
                </div>

                <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
                  <button onClick={() => openDetail(item.customer)} className="rounded-2xl bg-blue-500/15 px-4 py-2.5 text-xs font-black text-blue-300 ring-1 ring-blue-400/20 transition hover:bg-blue-500/25">
                    Detay
                  </button>
                  <button onClick={() => deleteCustomer(item.customer)} disabled={!canManage} className="rounded-2xl bg-red-500/15 px-4 py-2.5 text-xs font-black text-red-300 ring-1 ring-red-400/20 transition hover:bg-red-500/25 disabled:opacity-40">
                    Sil
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {detailCustomer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[30px] border border-white/10 bg-[#111a2e] p-5 shadow-2xl">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${tagClass(detailCustomer.tag)}`}>
                    {tagLabel(detailCustomer.tag)}
                  </span>
                  <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-black text-slate-300 ring-1 ring-white/10">
                    {detailOrders.length} sipariş
                  </span>
                </div>
                <h2 className="text-3xl font-black tracking-[-0.04em]">{detailCustomer.name}</h2>
                <p className="mt-1 text-sm text-slate-400">{detailCustomer.phone || "Telefon yok"} · {detailCustomer.email || "E-posta yok"}</p>
              </div>

              <button onClick={() => setDetailCustomer(null)} className="rounded-2xl bg-white/8 px-4 py-2.5 text-xs font-black text-slate-300 ring-1 ring-white/10">
                Kapat
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[24px] border border-white/10 bg-[#0b1220] p-4">
                <h3 className="mb-4 text-xl font-black">Müşteri Bilgisi</h3>
                <div className="grid gap-3">
                  <Field label="Müşteri Adı">
                    <input value={detailForm.name} onChange={(event) => setDetailForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#111a2e] px-4 py-3 text-sm outline-none" />
                  </Field>
                  <Field label="Telefon">
                    <input value={detailForm.phone} onChange={(event) => setDetailForm((current) => ({ ...current, phone: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#111a2e] px-4 py-3 text-sm outline-none" />
                  </Field>
                  <Field label="E-posta">
                    <input value={detailForm.email} onChange={(event) => setDetailForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#111a2e] px-4 py-3 text-sm outline-none" />
                  </Field>
                  <Field label="Etiket">
                    <select value={detailForm.tag} onChange={(event) => setDetailForm((current) => ({ ...current, tag: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#111a2e] px-4 py-3 text-sm outline-none">
                      <option value="normal">Normal</option>
                      <option value="vip">VIP</option>
                      <option value="lead">Aday</option>
                      <option value="wholesale">Toptan</option>
                      <option value="risk">Riskli</option>
                    </select>
                  </Field>
                  <label>
                    <span className="mb-1.5 block text-xs font-black text-slate-400">Müşteri Notu</span>
                    <textarea value={detailForm.note} onChange={(event) => setDetailForm((current) => ({ ...current, note: event.target.value }))} className="min-h-28 w-full rounded-2xl border border-white/10 bg-[#111a2e] px-4 py-3 text-sm outline-none" />
                  </label>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button onClick={saveDetail} disabled={!canManage} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-50">
                    Kaydet
                  </button>
                  <button onClick={() => deleteCustomer(detailCustomer)} disabled={!canManage} className="rounded-2xl bg-red-500/15 px-5 py-3 text-sm font-black text-red-300 ring-1 ring-red-400/20 transition hover:bg-red-500/25 disabled:opacity-40">
                    Sil
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-[#0b1220] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-black">Sipariş Geçmişi</h3>
                  <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-black text-slate-300 ring-1 ring-white/10">
                    {detailOrders.length} kayıt
                  </span>
                </div>

                {detailOrders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm font-bold text-slate-500">
                    Bu müşteri için sipariş geçmişi bulunamadı.
                  </div>
                ) : (
                  <div className="grid max-h-[520px] gap-2 overflow-y-auto pr-1">
                    {detailOrders.map((order) => (
                      <div key={order.id} className="rounded-2xl bg-[#111a2e] p-4 ring-1 ring-white/10">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-black">{order.order_no || "Sipariş"}</p>
                              <span className="rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-black text-slate-300">
                                {getMarketplaceLabel(order.marketplace)}
                              </span>
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${paymentStatusClass(order.payment_status)}`}>
                                {paymentStatusLabel(order.payment_status)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{order.product_name || "Ürün yok"} · {formatDate(order.created_at)}</p>
                          </div>
                          <div className="text-left lg:text-right">
                            <p className="font-black text-emerald-300">{formatCurrency(order.total_amount)}</p>
                            {Number(order.remaining_amount ?? 0) > 0 ? (
                              <p className="mt-1 text-xs font-bold text-amber-300">Kalan: {formatCurrency(order.remaining_amount)}</p>
                            ) : (
                              <p className="mt-1 text-xs font-bold text-slate-500">Tahsilat tamam</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function InfoBox({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-[#0b1220] p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={["mt-2 truncate text-lg font-black", valueClass || "text-white"].join(" ")}>{value}</p>
    </div>
  );
}
