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
  can_manage_invoices?: boolean | null;
};

type BusinessContext = {
  userEmail: string;
  business: Business;
  member: BusinessMember;
  isOwner: boolean;
};

type Order = {
  id: string;
  order_no: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  product_id: string | null;
  product_code: string | null;
  product_name: string | null;
  quantity: number | null;
  unit_price: number | null;
  total_amount: number | null;
  paid_amount: number | null;
  remaining_amount: number | null;
  payment_status: string | null;
  marketplace: string | null;
  created_at: string;
};

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  note: string | null;
};

type Invoice = {
  id: string;
  business_id: string;
  order_id: string | null;
  customer_id: string | null;
  invoice_no: string;
  document_type: string | null;
  status: string | null;
  official_status: string | null;
  official_provider: string | null;
  official_document_no: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_tax_id: string | null;
  customer_tax_office: string | null;
  billing_address: string | null;
  currency: string | null;
  subtotal: number | null;
  tax_rate: number | null;
  tax_amount: number | null;
  discount_amount: number | null;
  total_amount: number | null;
  paid_amount: number | null;
  remaining_amount: number | null;
  issue_date: string | null;
  due_date: string | null;
  note: string | null;
  created_at: string;
};

type InvoiceItem = {
  id: string;
  business_id: string;
  invoice_id: string;
  product_id: string | null;
  product_code: string | null;
  product_name: string;
  quantity: number | null;
  unit_price: number | null;
  tax_rate: number | null;
  tax_amount: number | null;
  line_total: number | null;
  created_at: string;
};

type InvoiceForm = {
  order_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_tax_id: string;
  customer_tax_office: string;
  billing_address: string;
  product_name: string;
  quantity: string;
  unit_price: string;
  tax_rate: string;
  discount_amount: string;
  paid_amount: string;
  issue_date: string;
  due_date: string;
  note: string;
};

const today = new Date().toISOString().slice(0, 10);

const emptyForm: InvoiceForm = {
  order_id: "",
  customer_id: "",
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  customer_tax_id: "",
  customer_tax_office: "",
  billing_address: "",
  product_name: "",
  quantity: "1",
  unit_price: "",
  tax_rate: "20",
  discount_amount: "0",
  paid_amount: "0",
  issue_date: today,
  due_date: "",
  note: "",
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

function toNumber(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatDate(date: string | null | undefined) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
  }).format(new Date(date));
}

function statusLabel(status: string | null | undefined) {
  if (status === "issued") return "Kesildi";
  if (status === "paid") return "Ödendi";
  if (status === "cancelled") return "İptal";
  return "Taslak";
}

function statusClass(status: string | null | undefined) {
  if (status === "issued") return "bg-blue-500/15 text-blue-300 ring-blue-400/20";
  if (status === "paid") return "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20";
  if (status === "cancelled") return "bg-red-500/15 text-red-300 ring-red-400/20";
  return "bg-amber-500/15 text-amber-300 ring-amber-400/20";
}

function officialLabel(status: string | null | undefined) {
  if (status === "sent") return "Resmî gönderildi";
  if (status === "accepted") return "GİB kabul";
  if (status === "failed") return "Hata";
  return "Resmî değil";
}

function officialClass(status: string | null | undefined) {
  if (status === "accepted") return "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20";
  if (status === "sent") return "bg-blue-500/15 text-blue-300 ring-blue-400/20";
  if (status === "failed") return "bg-red-500/15 text-red-300 ring-red-400/20";
  return "bg-slate-500/15 text-slate-300 ring-white/10";
}

function calculateTotals(form: InvoiceForm) {
  const quantity = Math.max(toNumber(form.quantity), 1);
  const unitPrice = toNumber(form.unit_price);
  const taxRate = toNumber(form.tax_rate);
  const discount = Math.max(toNumber(form.discount_amount), 0);
  const paid = Math.max(toNumber(form.paid_amount), 0);
  const subtotal = quantity * unitPrice;
  const discountedSubtotal = Math.max(subtotal - discount, 0);
  const taxAmount = discountedSubtotal * (taxRate / 100);
  const total = discountedSubtotal + taxAmount;
  const remaining = Math.max(total - paid, 0);

  return {
    quantity,
    unitPrice,
    taxRate,
    discount,
    paid: Math.min(paid, total),
    subtotal,
    taxAmount,
    total,
    remaining,
  };
}

function makeInvoiceNo(existingCount: number) {
  const year = new Date().getFullYear();
  const number = String(existingCount + 1).padStart(6, "0");
  return `TKI-${year}-${number}`;
}

export default function InvoicesPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<InvoiceForm>(emptyForm);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
  const [filter, setFilter] = useState<"all" | "draft" | "issued" | "paid" | "cancelled">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canManage = Boolean(context?.isOwner || context?.member.can_manage_invoices);

  async function fetchData() {
    setLoading(true);
    setMessage("");

    try {
      const ctx = await ensureBusinessForCurrentUser();
      setContext(ctx);

      const [invoicesResult, itemsResult, ordersResult, customersResult] = await Promise.all([
        supabase
          .from("invoices")
          .select("*")
          .eq("business_id", ctx.business.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("invoice_items")
          .select("*")
          .eq("business_id", ctx.business.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("orders")
          .select("*")
          .eq("business_id", ctx.business.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("customers")
          .select("id, name, phone, email, note")
          .eq("business_id", ctx.business.id)
          .order("name", { ascending: true }),
      ]);

      if (invoicesResult.error) {
        setMessage(`Belgeler alınamadı: ${invoicesResult.error.message}`);
        return;
      }

      if (itemsResult.error) {
        setMessage(`Belge kalemleri alınamadı: ${itemsResult.error.message}`);
        return;
      }

      if (ordersResult.error) {
        setMessage(`Siparişler alınamadı: ${ordersResult.error.message}`);
        return;
      }

      if (customersResult.error) {
        setMessage(`Müşteriler alınamadı: ${customersResult.error.message}`);
        return;
      }

      setInvoices((invoicesResult.data ?? []) as Invoice[]);
      setItems((itemsResult.data ?? []) as InvoiceItem[]);
      setOrders((ordersResult.data ?? []) as Order[]);
      setCustomers((customersResult.data ?? []) as Customer[]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Belge verisi alınamadı.";

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
    const order = orders.find((item) => item.id === form.order_id);

    if (!order) return;

    const total = toNumber(order.total_amount);
    const taxRate = toNumber(form.tax_rate) || 20;
    const unitPrice = total > 0 ? total / (1 + taxRate / 100) / Math.max(toNumber(order.quantity), 1) : toNumber(order.unit_price);

    setForm((current) => ({
      ...current,
      customer_name: order.customer_name || current.customer_name,
      customer_phone: order.customer_phone || current.customer_phone,
      customer_email: order.customer_email || current.customer_email,
      product_name: order.product_name || current.product_name,
      quantity: String(order.quantity || 1),
      unit_price: unitPrice ? unitPrice.toFixed(2) : current.unit_price,
      paid_amount: String(order.paid_amount || 0),
      note: order.order_no ? `Sipariş bağlantısı: ${order.order_no}` : current.note,
    }));
  }, [form.order_id, orders]);

  useEffect(() => {
    const customer = customers.find((item) => item.id === form.customer_id);

    if (!customer) return;

    setForm((current) => ({
      ...current,
      customer_name: customer.name || current.customer_name,
      customer_phone: customer.phone || current.customer_phone,
      customer_email: customer.email || current.customer_email,
      note: customer.note || current.note,
    }));
  }, [form.customer_id, customers]);

  async function createInvoice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede fatura/belge yönetimi yetkin yok.");
      return;
    }

    if (!form.customer_name.trim()) {
      setMessage("Müşteri adı zorunlu.");
      return;
    }

    if (!form.product_name.trim()) {
      setMessage("Belge kalemi için ürün/hizmet adı zorunlu.");
      return;
    }

    const totals = calculateTotals(form);
    const selectedOrder = orders.find((order) => order.id === form.order_id);
    const invoiceNo = makeInvoiceNo(invoices.length);

    setSaving(true);
    setMessage("");

    const invoiceResult = await supabase
      .from("invoices")
      .insert({
        business_id: context.business.id,
        created_by: context.userEmail,
        order_id: form.order_id || null,
        customer_id: form.customer_id || null,
        invoice_no: invoiceNo,
        document_type: "internal_invoice",
        status: "draft",
        official_status: "not_sent",
        official_provider: "none",
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim() || null,
        customer_email: form.customer_email.trim() || null,
        customer_tax_id: form.customer_tax_id.trim() || null,
        customer_tax_office: form.customer_tax_office.trim() || null,
        billing_address: form.billing_address.trim() || null,
        currency: "TRY",
        subtotal: totals.subtotal,
        tax_rate: totals.taxRate,
        tax_amount: totals.taxAmount,
        discount_amount: totals.discount,
        total_amount: totals.total,
        paid_amount: totals.paid,
        remaining_amount: totals.remaining,
        issue_date: form.issue_date || today,
        due_date: form.due_date || null,
        note: form.note.trim() || null,
      })
      .select("*")
      .single();

    if (invoiceResult.error || !invoiceResult.data) {
      setMessage(`Belge oluşturulamadı: ${invoiceResult.error?.message || "Bilinmeyen hata"}`);
      setSaving(false);
      return;
    }

    const invoice = invoiceResult.data as Invoice;

    const itemResult = await supabase
      .from("invoice_items")
      .insert({
        business_id: context.business.id,
        invoice_id: invoice.id,
        product_id: selectedOrder?.product_id || null,
        product_code: selectedOrder?.product_code || null,
        product_name: form.product_name.trim(),
        quantity: totals.quantity,
        unit_price: totals.unitPrice,
        tax_rate: totals.taxRate,
        tax_amount: totals.taxAmount,
        line_total: totals.total,
      });

    if (itemResult.error) {
      await supabase.from("invoices").delete().eq("id", invoice.id).eq("business_id", context.business.id);
      setMessage(`Belge kalemi oluşturulamadı: ${itemResult.error.message}`);
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowCreate(false);
    setForm(emptyForm);
    setMessage(`${invoiceNo} numaralı iç belge taslak olarak oluşturuldu.`);
    await fetchData();
  }

  async function updateInvoiceStatus(invoice: Invoice, status: string) {
    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede fatura/belge yönetimi yetkin yok.");
      return;
    }

    const paidAmount = status === "paid" ? Number(invoice.total_amount ?? 0) : Number(invoice.paid_amount ?? 0);
    const remaining = status === "paid" ? 0 : Number(invoice.remaining_amount ?? 0);

    const { error } = await supabase
      .from("invoices")
      .update({
        status,
        paid_amount: paidAmount,
        remaining_amount: remaining,
        updated_at: new Date().toISOString(),
      })
      .eq("business_id", context.business.id)
      .eq("id", invoice.id);

    if (error) {
      setMessage(`Durum güncellenemedi: ${error.message}`);
      return;
    }

    setMessage("Belge durumu güncellendi.");
    await fetchData();
  }

  async function deleteInvoice(invoice: Invoice) {
    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede belge silme yetkin yok.");
      return;
    }

    if (!confirm(`${invoice.invoice_no} silinsin mi? Bu işlem belge kalemlerini de siler.`)) return;

    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("business_id", context.business.id)
      .eq("id", invoice.id);

    if (error) {
      setMessage(`Belge silinemedi: ${error.message}`);
      return;
    }

    setMessage("Belge silindi.");
    setDetailInvoice(null);
    await fetchData();
  }

  const filteredInvoices = useMemo(() => {
    if (filter === "all") return invoices;
    return invoices.filter((invoice) => invoice.status === filter);
  }, [invoices, filter]);

  const stats = useMemo(() => {
    return {
      all: invoices.length,
      draft: invoices.filter((invoice) => invoice.status === "draft").length,
      issued: invoices.filter((invoice) => invoice.status === "issued").length,
      paid: invoices.filter((invoice) => invoice.status === "paid").length,
      cancelled: invoices.filter((invoice) => invoice.status === "cancelled").length,
      total: invoices.reduce((sum, invoice) => sum + Number(invoice.total_amount ?? 0), 0),
      remaining: invoices.reduce((sum, invoice) => sum + Number(invoice.remaining_amount ?? 0), 0),
    };
  }, [invoices]);

  const previewTotals = calculateTotals(form);
  const detailItems = detailInvoice ? items.filter((item) => item.invoice_id === detailInvoice.id) : [];

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Document Center v18
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Fatura / Belge Merkezi</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              Siparişlerden iç belge, taslak fatura ve proforma takip kaydı oluştur. Resmî e-Fatura/e-Arşiv gönderimi için ileride özel entegratör bağlantısı gerekir.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowCreate((value) => !value)} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500">
              {showCreate ? "Formu Kapat" : "Yeni Belge"}
            </button>
            <button onClick={fetchData} className="rounded-2xl bg-white/8 px-5 py-3 text-sm font-black text-slate-200 ring-1 ring-white/10 transition hover:bg-white/12">
              Yenile
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100/90">
        <b>Dikkat:</b> Bu ekran Takipio içi belge/taslak/proforma takibi içindir. Buradan oluşturulan kayıtlar tek başına resmî e-Fatura/e-Arşiv yerine geçmez.
      </div>

      {message ? (
        <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-7">
        <FilterMetric active={filter === "all"} label="Tümü" value={loading ? "..." : String(stats.all)} onClick={() => setFilter("all")} />
        <FilterMetric active={filter === "draft"} label="Taslak" value={loading ? "..." : String(stats.draft)} onClick={() => setFilter("draft")} />
        <FilterMetric active={filter === "issued"} label="Kesildi" value={loading ? "..." : String(stats.issued)} onClick={() => setFilter("issued")} />
        <FilterMetric active={filter === "paid"} label="Ödendi" value={loading ? "..." : String(stats.paid)} onClick={() => setFilter("paid")} />
        <FilterMetric active={filter === "cancelled"} label="İptal" value={loading ? "..." : String(stats.cancelled)} onClick={() => setFilter("cancelled")} />
        <InfoMetric label="Belge Toplamı" value={formatCurrency(stats.total)} valueClass="text-emerald-300" />
        <InfoMetric label="Kalan" value={formatCurrency(stats.remaining)} valueClass="text-amber-300" />
      </div>

      {showCreate ? (
        <form onSubmit={createInvoice} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-4">
            <h2 className="text-2xl font-black">Yeni Belge</h2>
            <p className="mt-1 text-sm text-slate-400">Siparişten otomatik doldurabilir veya manuel belge oluşturabilirsin.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Siparişten Oluştur">
              <select value={form.order_id} onChange={(event) => setForm((current) => ({ ...current, order_id: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                <option value="">Manuel belge</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.order_no || "Sipariş"} — {order.customer_name || "Müşteri"} — {formatCurrency(order.total_amount)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="CRM Müşterisi">
              <select value={form.customer_id} onChange={(event) => setForm((current) => ({ ...current, customer_id: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                <option value="">Seçme</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Müşteri Adı">
              <input value={form.customer_name} onChange={(event) => setForm((current) => ({ ...current, customer_name: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Telefon">
              <input value={form.customer_phone} onChange={(event) => setForm((current) => ({ ...current, customer_phone: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="E-posta">
              <input value={form.customer_email} onChange={(event) => setForm((current) => ({ ...current, customer_email: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="TCKN / VKN">
              <input value={form.customer_tax_id} onChange={(event) => setForm((current) => ({ ...current, customer_tax_id: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Vergi Dairesi">
              <input value={form.customer_tax_office} onChange={(event) => setForm((current) => ({ ...current, customer_tax_office: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Ürün / Hizmet">
              <input value={form.product_name} onChange={(event) => setForm((current) => ({ ...current, product_name: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Adet">
              <input type="number" min="1" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Birim Fiyat / KDV Hariç">
              <input type="number" min="0" value={form.unit_price} onChange={(event) => setForm((current) => ({ ...current, unit_price: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="KDV %">
              <input type="number" min="0" value={form.tax_rate} onChange={(event) => setForm((current) => ({ ...current, tax_rate: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="İndirim">
              <input type="number" min="0" value={form.discount_amount} onChange={(event) => setForm((current) => ({ ...current, discount_amount: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Alınan Ödeme">
              <input type="number" min="0" value={form.paid_amount} onChange={(event) => setForm((current) => ({ ...current, paid_amount: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Düzenleme Tarihi">
              <input type="date" value={form.issue_date} onChange={(event) => setForm((current) => ({ ...current, issue_date: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Vade Tarihi">
              <input type="date" value={form.due_date} onChange={(event) => setForm((current) => ({ ...current, due_date: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <label className="md:col-span-2">
              <span className="mb-1.5 block text-xs font-black text-slate-400">Fatura Adresi</span>
              <input value={form.billing_address} onChange={(event) => setForm((current) => ({ ...current, billing_address: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </label>

            <label className="md:col-span-2">
              <span className="mb-1.5 block text-xs font-black text-slate-400">Not</span>
              <input value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </label>
          </div>

          <div className="mt-5 grid gap-3 rounded-[22px] border border-white/10 bg-[#0b1220] p-4 md:grid-cols-5">
            <InfoMetric label="Ara Toplam" value={formatCurrency(previewTotals.subtotal)} valueClass="text-slate-200" />
            <InfoMetric label="KDV" value={formatCurrency(previewTotals.taxAmount)} valueClass="text-blue-300" />
            <InfoMetric label="İndirim" value={formatCurrency(previewTotals.discount)} valueClass="text-amber-300" />
            <InfoMetric label="Genel Toplam" value={formatCurrency(previewTotals.total)} valueClass="text-emerald-300" />
            <InfoMetric label="Kalan" value={formatCurrency(previewTotals.remaining)} valueClass="text-red-300" />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button disabled={saving || !canManage} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-50">
              {saving ? "Kaydediliyor..." : "Taslak Belge Oluştur"}
            </button>
            <button type="button" onClick={() => setForm(emptyForm)} className="rounded-2xl bg-white/8 px-5 py-3 text-sm font-black text-slate-300 ring-1 ring-white/10">
              Temizle
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-3">
        {filteredInvoices.length === 0 ? (
          <div className="rounded-[26px] border border-dashed border-white/10 bg-[#111a2e] p-10 text-center">
            <p className="text-sm font-bold text-slate-500">Bu filtrede belge yok.</p>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <article key={invoice.id} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-4">
              <div className="grid gap-4 xl:grid-cols-[1.1fr_1.2fr_0.7fr] xl:items-center">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black">{invoice.invoice_no}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(invoice.status)}`}>
                      {statusLabel(invoice.status)}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${officialClass(invoice.official_status)}`}>
                      {officialLabel(invoice.official_status)}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-slate-300">{invoice.customer_name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Düzenleme: {formatDate(invoice.issue_date)} · Vade: {formatDate(invoice.due_date)}
                  </p>
                  {invoice.note ? <p className="mt-2 text-xs leading-5 text-slate-400">{invoice.note}</p> : null}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <InfoBox label="Ara Toplam" value={formatCurrency(invoice.subtotal)} />
                  <InfoBox label="KDV" value={formatCurrency(invoice.tax_amount)} valueClass="text-blue-300" />
                  <InfoBox label="Toplam" value={formatCurrency(invoice.total_amount)} valueClass="text-emerald-300" />
                  <InfoBox label="Kalan" value={formatCurrency(invoice.remaining_amount)} valueClass={Number(invoice.remaining_amount ?? 0) > 0 ? "text-amber-300" : "text-slate-300"} />
                </div>

                <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
                  <button onClick={() => setDetailInvoice(invoice)} className="rounded-2xl bg-blue-500/15 px-4 py-2.5 text-xs font-black text-blue-300 ring-1 ring-blue-400/20 transition hover:bg-blue-500/25">
                    Detay
                  </button>
                  <button onClick={() => updateInvoiceStatus(invoice, "issued")} disabled={!canManage || invoice.status === "cancelled"} className="rounded-2xl bg-cyan-500/15 px-4 py-2.5 text-xs font-black text-cyan-300 ring-1 ring-cyan-400/20 transition hover:bg-cyan-500/25 disabled:opacity-40">
                    Kesildi
                  </button>
                  <button onClick={() => updateInvoiceStatus(invoice, "paid")} disabled={!canManage || invoice.status === "cancelled"} className="rounded-2xl bg-emerald-500/15 px-4 py-2.5 text-xs font-black text-emerald-300 ring-1 ring-emerald-400/20 transition hover:bg-emerald-500/25 disabled:opacity-40">
                    Ödendi
                  </button>
                  <button onClick={() => updateInvoiceStatus(invoice, "cancelled")} disabled={!canManage} className="rounded-2xl bg-red-500/15 px-4 py-2.5 text-xs font-black text-red-300 ring-1 ring-red-400/20 transition hover:bg-red-500/25 disabled:opacity-40">
                    İptal
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {detailInvoice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[30px] border border-white/10 bg-[#111a2e] p-5 shadow-2xl print:max-h-none print:rounded-none print:border-0 print:bg-white print:text-black">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2 print:hidden">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(detailInvoice.status)}`}>
                    {statusLabel(detailInvoice.status)}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${officialClass(detailInvoice.official_status)}`}>
                    {officialLabel(detailInvoice.official_status)}
                  </span>
                </div>
                <h2 className="text-3xl font-black tracking-[-0.04em]">Belge: {detailInvoice.invoice_no}</h2>
                <p className="mt-1 text-sm text-slate-400 print:text-slate-700">
                  Bu belge Takipio içi takip kaydıdır. Resmî e-Fatura/e-Arşiv yerine geçmez.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 print:hidden">
                <button onClick={() => window.print()} className="rounded-2xl bg-emerald-500/15 px-4 py-2.5 text-xs font-black text-emerald-300 ring-1 ring-emerald-400/20">
                  Yazdır / PDF Al
                </button>
                <button onClick={() => setDetailInvoice(null)} className="rounded-2xl bg-white/8 px-4 py-2.5 text-xs font-black text-slate-300 ring-1 ring-white/10">
                  Kapat
                </button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-[#0b1220] p-4 print:border-slate-200 print:bg-white">
                <h3 className="mb-4 text-xl font-black">Müşteri Bilgisi</h3>
                <InfoLine label="Müşteri" value={detailInvoice.customer_name} />
                <InfoLine label="Telefon" value={detailInvoice.customer_phone || "-"} />
                <InfoLine label="E-posta" value={detailInvoice.customer_email || "-"} />
                <InfoLine label="TCKN / VKN" value={detailInvoice.customer_tax_id || "-"} />
                <InfoLine label="Vergi Dairesi" value={detailInvoice.customer_tax_office || "-"} />
                <InfoLine label="Adres" value={detailInvoice.billing_address || "-"} />
              </div>

              <div className="rounded-[24px] border border-white/10 bg-[#0b1220] p-4 print:border-slate-200 print:bg-white">
                <h3 className="mb-4 text-xl font-black">Belge Bilgisi</h3>
                <InfoLine label="Belge No" value={detailInvoice.invoice_no} />
                <InfoLine label="Durum" value={statusLabel(detailInvoice.status)} />
                <InfoLine label="Resmî Durum" value={officialLabel(detailInvoice.official_status)} />
                <InfoLine label="Düzenleme" value={formatDate(detailInvoice.issue_date)} />
                <InfoLine label="Vade" value={formatDate(detailInvoice.due_date)} />
                <InfoLine label="Para Birimi" value={detailInvoice.currency || "TRY"} />
              </div>
            </div>

            <div className="mt-4 rounded-[24px] border border-white/10 bg-[#0b1220] p-4 print:border-slate-200 print:bg-white">
              <h3 className="mb-4 text-xl font-black">Kalemler</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
                    <tr>
                      <th className="py-3">Ürün / Hizmet</th>
                      <th className="py-3 text-right">Adet</th>
                      <th className="py-3 text-right">Birim</th>
                      <th className="py-3 text-right">KDV</th>
                      <th className="py-3 text-right">Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailItems.map((item) => (
                      <tr key={item.id} className="border-t border-white/10 print:border-slate-200">
                        <td className="py-3 font-black">{item.product_name}</td>
                        <td className="py-3 text-right">{item.quantity ?? 1}</td>
                        <td className="py-3 text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="py-3 text-right">{formatCurrency(item.tax_amount)}</td>
                        <td className="py-3 text-right font-black">{formatCurrency(item.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.65fr]">
              <div className="rounded-[24px] border border-white/10 bg-[#0b1220] p-4 print:border-slate-200 print:bg-white">
                <h3 className="mb-3 text-xl font-black">Not</h3>
                <p className="text-sm leading-6 text-slate-400 print:text-slate-700">
                  {detailInvoice.note || "Not bulunmuyor."}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-[#0b1220] p-4 print:border-slate-200 print:bg-white">
                <InfoLine label="Ara Toplam" value={formatCurrency(detailInvoice.subtotal)} />
                <InfoLine label="KDV" value={formatCurrency(detailInvoice.tax_amount)} />
                <InfoLine label="İndirim" value={formatCurrency(detailInvoice.discount_amount)} />
                <InfoLine label="Genel Toplam" value={formatCurrency(detailInvoice.total_amount)} />
                <InfoLine label="Ödenen" value={formatCurrency(detailInvoice.paid_amount)} />
                <InfoLine label="Kalan" value={formatCurrency(detailInvoice.remaining_amount)} />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 print:hidden">
              <button onClick={() => updateInvoiceStatus(detailInvoice, "issued")} disabled={!canManage || detailInvoice.status === "cancelled"} className="rounded-2xl bg-cyan-500/15 px-5 py-3 text-sm font-black text-cyan-300 ring-1 ring-cyan-400/20 disabled:opacity-40">
                Kesildi İşaretle
              </button>
              <button onClick={() => updateInvoiceStatus(detailInvoice, "paid")} disabled={!canManage || detailInvoice.status === "cancelled"} className="rounded-2xl bg-emerald-500/15 px-5 py-3 text-sm font-black text-emerald-300 ring-1 ring-emerald-400/20 disabled:opacity-40">
                Ödendi İşaretle
              </button>
              <button onClick={() => updateInvoiceStatus(detailInvoice, "cancelled")} disabled={!canManage} className="rounded-2xl bg-amber-500/15 px-5 py-3 text-sm font-black text-amber-300 ring-1 ring-amber-400/20 disabled:opacity-40">
                İptal Et
              </button>
              <button onClick={() => deleteInvoice(detailInvoice)} disabled={!canManage} className="rounded-2xl bg-red-500/15 px-5 py-3 text-sm font-black text-red-300 ring-1 ring-red-400/20 disabled:opacity-40">
                Sil
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

function InfoMetric({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={["mt-3 truncate text-xl font-black", valueClass || "text-white"].join(" ")}>{value}</p>
    </div>
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

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-4 rounded-2xl bg-[#111a2e] px-4 py-3 ring-1 ring-white/10 print:bg-white print:ring-slate-200">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="text-right text-sm font-black text-white print:text-black">{value}</p>
    </div>
  );
}
