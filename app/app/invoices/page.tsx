"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Business = { id: string; owner_email: string | null; name: string; email: string | null };
type BusinessMember = { id: string; business_id: string; email: string; role_name: string | null; member_status: string | null; can_manage_invoices?: boolean | null };
type BusinessContext = { userEmail: string; business: Business; member: BusinessMember; isOwner: boolean };

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
  created_at: string;
};

type Customer = { id: string; name: string; phone: string | null; email: string | null; note: string | null };

type InvoiceSettings = {
  id: string;
  business_id: string;
  company_title: string | null;
  tax_id: string | null;
  tax_office: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  iban: string | null;
  bank_name: string | null;
  default_tax_rate: number | null;
  default_currency: string | null;
  default_due_days: number | null;
  invoice_prefix: string | null;
  next_invoice_number: number | null;
  logo_url: string | null;
  footer_note: string | null;
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
  invoice_scenario: string | null;
  receiver_type: string | null;
  profile_id: string | null;
  e_document_type: string | null;
  gib_uuid: string | null;
  validation_status: string | null;
  validation_errors: string[] | null;
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
  payment_terms: string | null;
  bank_iban: string | null;
  public_note: string | null;
  issuer_title: string | null;
  issuer_tax_id: string | null;
  issuer_tax_office: string | null;
  issuer_address: string | null;
  issuer_phone: string | null;
  issuer_email: string | null;
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

type InvoiceLog = {
  id: string;
  business_id: string;
  invoice_id: string;
  actor_email: string | null;
  action: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type LineForm = { product_name: string; product_code: string; quantity: string; unit_price: string; tax_rate: string };

type InvoiceForm = {
  order_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_tax_id: string;
  customer_tax_office: string;
  billing_address: string;
  receiver_type: "individual" | "company";
  e_document_type: "internal" | "proforma" | "e_archive_ready" | "e_invoice_ready";
  invoice_scenario: "basic" | "commercial";
  discount_amount: string;
  paid_amount: string;
  issue_date: string;
  due_date: string;
  payment_terms: string;
  bank_iban: string;
  public_note: string;
  note: string;
  lines: LineForm[];
};

type SettingsForm = {
  company_title: string;
  tax_id: string;
  tax_office: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  website: string;
  iban: string;
  bank_name: string;
  default_tax_rate: string;
  default_due_days: string;
  invoice_prefix: string;
  logo_url: string;
  footer_note: string;
};

const today = new Date().toISOString().slice(0, 10);

const emptyLine: LineForm = { product_name: "", product_code: "", quantity: "1", unit_price: "", tax_rate: "20" };

const emptyForm: InvoiceForm = {
  order_id: "",
  customer_id: "",
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  customer_tax_id: "",
  customer_tax_office: "",
  billing_address: "",
  receiver_type: "individual",
  e_document_type: "internal",
  invoice_scenario: "basic",
  discount_amount: "0",
  paid_amount: "0",
  issue_date: today,
  due_date: "",
  payment_terms: "",
  bank_iban: "",
  public_note: "",
  note: "",
  lines: [{ ...emptyLine }],
};

const emptySettings: SettingsForm = {
  company_title: "",
  tax_id: "",
  tax_office: "",
  address: "",
  city: "",
  district: "",
  phone: "",
  email: "",
  website: "",
  iban: "",
  bank_name: "",
  default_tax_rate: "20",
  default_due_days: "7",
  invoice_prefix: "TKI",
  logo_url: "",
  footer_note: "Bu belge Takipio içi takip belgesidir. Resmî e-Fatura/e-Arşiv yerine geçmez.",
};

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

function clean(value: string | null | undefined) {
  return (value ?? "").trim();
}

function onlyDigits(value: string | null | undefined) {
  return clean(value).replace(/\D/g, "");
}

async function getCurrentUserEmail() {
  const sessionResult = await supabase.auth.getSession();
  const sessionEmail = normalizeEmail(sessionResult.data.session?.user?.email);
  if (sessionEmail) return sessionEmail;
  const { data } = await supabase.auth.getUser();
  return normalizeEmail(data.user?.email);
}

async function ensureOwnerMember(businessId: string, userEmail: string) {
  const { data: existing } = await supabase.from("business_members").select("*").eq("business_id", businessId).eq("email", userEmail).maybeSingle();
  if (existing) return existing as BusinessMember;

  const { data, error } = await supabase.from("business_members").insert({
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
  }).select("*").single();

  if (error || !data) throw new Error(`Owner yetkisi oluşturulamadı: ${error?.message ?? "Bilinmeyen hata"}`);
  return data as BusinessMember;
}

async function ensureBusinessForCurrentUser() {
  const userEmail = await getCurrentUserEmail();
  if (!userEmail) throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yap.");

  const existingMember = await supabase.from("business_members").select("*").eq("email", userEmail).eq("member_status", "active").limit(1).maybeSingle();

  if (existingMember.data?.business_id) {
    const { data: business, error } = await supabase.from("businesses").select("*").eq("id", existingMember.data.business_id).single();
    if (error || !business) throw new Error("İşletme bilgisi alınamadı.");
    return { userEmail, business, member: existingMember.data, isOwner: normalizeEmail(business.owner_email) === userEmail } satisfies BusinessContext;
  }

  const existingBusiness = await supabase.from("businesses").select("*").eq("owner_email", userEmail).limit(1).maybeSingle();

  if (existingBusiness.data) {
    const ownerMember = await ensureOwnerMember(existingBusiness.data.id, userEmail);
    return { userEmail, business: existingBusiness.data, member: ownerMember, isOwner: true } satisfies BusinessContext;
  }

  const { data: createdBusiness, error } = await supabase.from("businesses").insert({ owner_email: userEmail, name: "İşletmem", email: userEmail }).select("*").single();
  if (error || !createdBusiness) throw new Error(`İşletme oluşturulamadı: ${error?.message ?? "Bilinmeyen hata"}`);
  const ownerMember = await ensureOwnerMember(createdBusiness.id, userEmail);
  return { userEmail, business: createdBusiness, member: ownerMember, isOwner: true } satisfies BusinessContext;
}

function toNumber(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(Number(value ?? 0));
}

function formatDate(date: string | null | undefined) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(date));
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
  if (status === "sent") return "Entegratöre gönderildi";
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

function documentTypeLabel(type: string | null | undefined) {
  if (type === "proforma") return "Proforma";
  if (type === "e_archive_ready") return "e-Arşiv Hazırlık";
  if (type === "e_invoice_ready") return "e-Fatura Hazırlık";
  return "İç Belge";
}

function calculateTotals(form: InvoiceForm) {
  const subtotal = form.lines.reduce((sum, line) => sum + Math.max(toNumber(line.quantity), 1) * toNumber(line.unit_price), 0);
  const discount = Math.min(Math.max(toNumber(form.discount_amount), 0), subtotal);
  const discountRatio = subtotal > 0 ? discount / subtotal : 0;
  const taxAmount = form.lines.reduce((sum, line) => {
    const lineSubtotal = Math.max(toNumber(line.quantity), 1) * toNumber(line.unit_price);
    const lineAfterDiscount = lineSubtotal * (1 - discountRatio);
    return sum + lineAfterDiscount * (toNumber(line.tax_rate) / 100);
  }, 0);
  const total = Math.max(subtotal - discount, 0) + taxAmount;
  const paid = Math.min(Math.max(toNumber(form.paid_amount), 0), total);
  return { subtotal, discount, taxAmount, total, paid, remaining: Math.max(total - paid, 0) };
}

function calculateItem(line: LineForm, subtotal: number, discount: number) {
  const quantity = Math.max(toNumber(line.quantity), 1);
  const unitPrice = toNumber(line.unit_price);
  const lineSubtotal = quantity * unitPrice;
  const discountRatio = subtotal > 0 ? discount / subtotal : 0;
  const lineAfterDiscount = lineSubtotal * (1 - discountRatio);
  const taxRate = toNumber(line.tax_rate);
  const taxAmount = lineAfterDiscount * (taxRate / 100);
  return { quantity, unitPrice, taxRate, taxAmount, lineTotal: lineAfterDiscount + taxAmount };
}

function validateInvoiceLike(input: {
  settings: InvoiceSettings | null;
  customer_name: string;
  customer_tax_id: string | null;
  customer_tax_office: string | null;
  billing_address: string | null;
  receiver_type: string | null;
  e_document_type: string | null;
  lines: Array<{ product_name: string; quantity: number | null; unit_price: number | null; tax_rate: number | null }>;
  total_amount: number | null;
}) {
  const errors: string[] = [];

  if (!clean(input.settings?.company_title)) errors.push("Firma unvanı eksik.");
  if (!clean(input.settings?.tax_id)) errors.push("Firma VKN/TCKN eksik.");
  if (!clean(input.settings?.tax_office)) errors.push("Firma vergi dairesi eksik.");
  if (!clean(input.settings?.address)) errors.push("Firma adresi eksik.");
  if (!clean(input.customer_name)) errors.push("Müşteri adı/unvanı eksik.");
  if (!clean(input.billing_address)) errors.push("Müşteri fatura adresi eksik.");

  const customerTaxId = onlyDigits(input.customer_tax_id);
  if (!customerTaxId) errors.push("Müşteri TCKN/VKN eksik.");
  if (customerTaxId && customerTaxId.length !== 10 && customerTaxId.length !== 11) errors.push("Müşteri TCKN/VKN 10 veya 11 haneli olmalı.");

  const issuerTaxId = onlyDigits(input.settings?.tax_id);
  if (issuerTaxId && issuerTaxId.length !== 10 && issuerTaxId.length !== 11) errors.push("Firma VKN/TCKN 10 veya 11 haneli olmalı.");

  if (input.receiver_type === "company" && !clean(input.customer_tax_office)) errors.push("Kurumsal alıcı için vergi dairesi eksik.");

  if (!input.lines.length) errors.push("En az 1 belge kalemi olmalı.");
  input.lines.forEach((line, index) => {
    if (!clean(line.product_name)) errors.push(`${index + 1}. kalemde ürün/hizmet adı eksik.`);
    if (Number(line.quantity ?? 0) <= 0) errors.push(`${index + 1}. kalemde adet 0'dan büyük olmalı.`);
    if (Number(line.unit_price ?? 0) <= 0) errors.push(`${index + 1}. kalemde birim fiyat 0'dan büyük olmalı.`);
    if (Number(line.tax_rate ?? 0) < 0) errors.push(`${index + 1}. kalemde KDV oranı negatif olamaz.`);
  });

  if (Number(input.total_amount ?? 0) <= 0) errors.push("Genel toplam 0'dan büyük olmalı.");

  if (input.e_document_type === "e_invoice_ready" && !clean(input.customer_tax_id)) errors.push("e-Fatura hazırlık için alıcı vergi kimliği zorunlu.");
  if (input.e_document_type === "e_archive_ready" && !clean(input.customer_email) && !clean(input.customer_phone)) errors.push("e-Arşiv hazırlık için müşteri e-posta veya telefon önerilir.");

  return errors;
}

function makeInvoiceNo(settings: InvoiceSettings | null, fallbackCount: number) {
  const prefix = clean(settings?.invoice_prefix) || "TKI";
  const nextNumber = Math.max(Number(settings?.next_invoice_number ?? 0), fallbackCount + 1);
  return `${prefix}-${new Date().getFullYear()}-${String(nextNumber).padStart(6, "0")}`;
}

export default function InvoicesPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState<SettingsForm>(emptySettings);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [logs, setLogs] = useState<InvoiceLog[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<InvoiceForm>(emptyForm);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
  const [filter, setFilter] = useState<"all" | "draft" | "issued" | "paid" | "cancelled">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canManage = Boolean(context?.isOwner || context?.member.can_manage_invoices);
  const totals = calculateTotals(form);

  async function insertLog(invoiceId: string, action: string, logMessage: string, metadata: Record<string, unknown> = {}) {
    if (!context) return;
    await supabase.from("invoice_logs").insert({
      business_id: context.business.id,
      invoice_id: invoiceId,
      actor_email: context.userEmail,
      action,
      message: logMessage,
      metadata,
    });
  }

  async function fetchData() {
    setLoading(true);
    setMessage("");

    try {
      const ctx = await ensureBusinessForCurrentUser();
      setContext(ctx);

      const [settingsResult, invoicesResult, itemsResult, logsResult, ordersResult, customersResult] = await Promise.all([
        supabase.from("invoice_settings").select("*").eq("business_id", ctx.business.id).maybeSingle(),
        supabase.from("invoices").select("*").eq("business_id", ctx.business.id).order("created_at", { ascending: false }),
        supabase.from("invoice_items").select("*").eq("business_id", ctx.business.id).order("created_at", { ascending: true }),
        supabase.from("invoice_logs").select("*").eq("business_id", ctx.business.id).order("created_at", { ascending: false }),
        supabase.from("orders").select("*").eq("business_id", ctx.business.id).order("created_at", { ascending: false }),
        supabase.from("customers").select("id, name, phone, email, note").eq("business_id", ctx.business.id).order("name", { ascending: true }),
      ]);

      if (settingsResult.error && settingsResult.error.code !== "PGRST116") {
        setMessage(`Fatura ayarları alınamadı: ${settingsResult.error.message}`);
        return;
      }

      if (invoicesResult.error) {
        setMessage(`Belgeler alınamadı: ${invoicesResult.error.message}`);
        return;
      }

      if (itemsResult.error) {
        setMessage(`Belge kalemleri alınamadı: ${itemsResult.error.message}`);
        return;
      }

      if (logsResult.error) {
        setMessage(`Belge geçmişi alınamadı: ${logsResult.error.message}`);
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

      const fetchedSettings = settingsResult.data as InvoiceSettings | null;
      setSettings(fetchedSettings);

      if (fetchedSettings) {
        setSettingsForm({
          company_title: fetchedSettings.company_title || "",
          tax_id: fetchedSettings.tax_id || "",
          tax_office: fetchedSettings.tax_office || "",
          address: fetchedSettings.address || "",
          city: fetchedSettings.city || "",
          district: fetchedSettings.district || "",
          phone: fetchedSettings.phone || "",
          email: fetchedSettings.email || "",
          website: fetchedSettings.website || "",
          iban: fetchedSettings.iban || "",
          bank_name: fetchedSettings.bank_name || "",
          default_tax_rate: String(fetchedSettings.default_tax_rate ?? 20),
          default_due_days: String(fetchedSettings.default_due_days ?? 7),
          invoice_prefix: fetchedSettings.invoice_prefix || "TKI",
          logo_url: fetchedSettings.logo_url || "",
          footer_note: fetchedSettings.footer_note || emptySettings.footer_note,
        });

        setForm((current) => ({
          ...current,
          bank_iban: fetchedSettings.iban || current.bank_iban,
          public_note: fetchedSettings.footer_note || current.public_note,
          lines: current.lines.map((line) => ({ ...line, tax_rate: String(fetchedSettings.default_tax_rate ?? 20) })),
        }));
      }

      setInvoices((invoicesResult.data ?? []) as Invoice[]);
      setItems((itemsResult.data ?? []) as InvoiceItem[]);
      setLogs((logsResult.data ?? []) as InvoiceLog[]);
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

    const quantity = Math.max(toNumber(order.quantity), 1);
    const total = toNumber(order.total_amount);
    const taxRate = toNumber(settings?.default_tax_rate ?? 20);
    const unitPrice = total > 0 ? total / (1 + taxRate / 100) / quantity : toNumber(order.unit_price);

    setForm((current) => ({
      ...current,
      customer_name: order.customer_name || current.customer_name,
      customer_phone: order.customer_phone || current.customer_phone,
      customer_email: order.customer_email || current.customer_email,
      paid_amount: String(order.paid_amount || 0),
      note: order.order_no ? `Sipariş bağlantısı: ${order.order_no}` : current.note,
      lines: [{
        product_name: order.product_name || "",
        product_code: order.product_code || "",
        quantity: String(quantity),
        unit_price: unitPrice ? unitPrice.toFixed(2) : "",
        tax_rate: String(taxRate),
      }],
    }));
  }, [form.order_id, orders, settings]);

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

  function updateLine(index: number, patch: Partial<LineForm>) {
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line),
    }));
  }

  function addLine() {
    setForm((current) => ({ ...current, lines: [...current.lines, { ...emptyLine, tax_rate: String(settings?.default_tax_rate ?? 20) }] }));
  }

  function removeLine(index: number) {
    setForm((current) => ({ ...current, lines: current.lines.length <= 1 ? current.lines : current.lines.filter((_, lineIndex) => lineIndex !== index) }));
  }

  async function saveSettings() {
    if (!context) return;
    if (!canManage) {
      setMessage("Bu işletmede fatura ayarı yönetimi yetkin yok.");
      return;
    }

    const payload = {
      business_id: context.business.id,
      created_by: context.userEmail,
      company_title: clean(settingsForm.company_title) || null,
      tax_id: onlyDigits(settingsForm.tax_id) || null,
      tax_office: clean(settingsForm.tax_office) || null,
      address: clean(settingsForm.address) || null,
      city: clean(settingsForm.city) || null,
      district: clean(settingsForm.district) || null,
      phone: clean(settingsForm.phone) || null,
      email: normalizeEmail(settingsForm.email) || null,
      website: clean(settingsForm.website) || null,
      iban: clean(settingsForm.iban) || null,
      bank_name: clean(settingsForm.bank_name) || null,
      default_tax_rate: toNumber(settingsForm.default_tax_rate),
      default_due_days: Math.max(toNumber(settingsForm.default_due_days), 0),
      invoice_prefix: clean(settingsForm.invoice_prefix) || "TKI",
      logo_url: clean(settingsForm.logo_url) || null,
      footer_note: clean(settingsForm.footer_note) || null,
      updated_at: new Date().toISOString(),
    };

    const result = settings
      ? await supabase.from("invoice_settings").update(payload).eq("business_id", context.business.id).eq("id", settings.id)
      : await supabase.from("invoice_settings").insert(payload);

    if (result.error) {
      setMessage(`Fatura ayarları kaydedilemedi: ${result.error.message}`);
      return;
    }

    setMessage("Fatura ayarları kaydedildi.");
    await fetchData();
  }

  async function createInvoice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede fatura/belge yönetimi yetkin yok.");
      return;
    }

    const validationErrors = validateInvoiceLike({
      settings,
      customer_name: form.customer_name,
      customer_tax_id: form.customer_tax_id,
      customer_tax_office: form.customer_tax_office,
      billing_address: form.billing_address,
      receiver_type: form.receiver_type,
      e_document_type: form.e_document_type,
      lines: form.lines.map((line) => ({
        product_name: line.product_name,
        quantity: toNumber(line.quantity),
        unit_price: toNumber(line.unit_price),
        tax_rate: toNumber(line.tax_rate),
      })),
      total_amount: totals.total,
    });

    if (validationErrors.length > 0) {
      setMessage(`Ön kontrol eksikleri: ${validationErrors.slice(0, 3).join(" ")}`);
      // Taslak yine oluşturulabilir ama kullanıcı uyarılır.
    }

    const invoiceNo = makeInvoiceNo(settings, invoices.length);
    const selectedOrder = orders.find((order) => order.id === form.order_id);

    setSaving(true);
    setMessage("");

    const invoiceResult = await supabase.from("invoices").insert({
      business_id: context.business.id,
      created_by: context.userEmail,
      order_id: form.order_id || null,
      customer_id: form.customer_id || null,
      invoice_no: invoiceNo,
      document_type: "internal_invoice",
      status: "draft",
      official_status: "not_sent",
      official_provider: "none",
      invoice_scenario: form.invoice_scenario,
      receiver_type: form.receiver_type,
      profile_id: form.e_document_type === "e_invoice_ready" ? "TEMELFATURA" : "EARSIVFATURA",
      e_document_type: form.e_document_type,
      validation_status: validationErrors.length > 0 ? "failed" : "passed",
      validation_errors: validationErrors,
      customer_name: clean(form.customer_name),
      customer_phone: clean(form.customer_phone) || null,
      customer_email: normalizeEmail(form.customer_email) || null,
      customer_tax_id: onlyDigits(form.customer_tax_id) || null,
      customer_tax_office: clean(form.customer_tax_office) || null,
      billing_address: clean(form.billing_address) || null,
      currency: settings?.default_currency || "TRY",
      subtotal: totals.subtotal,
      tax_rate: toNumber(settings?.default_tax_rate ?? 20),
      tax_amount: totals.taxAmount,
      discount_amount: totals.discount,
      total_amount: totals.total,
      paid_amount: totals.paid,
      remaining_amount: totals.remaining,
      issue_date: form.issue_date || today,
      due_date: form.due_date || null,
      payment_terms: clean(form.payment_terms) || null,
      bank_iban: clean(form.bank_iban) || settings?.iban || null,
      public_note: clean(form.public_note) || settings?.footer_note || null,
      note: clean(form.note) || null,
      issuer_title: settings?.company_title || null,
      issuer_tax_id: settings?.tax_id || null,
      issuer_tax_office: settings?.tax_office || null,
      issuer_address: settings?.address || null,
      issuer_phone: settings?.phone || null,
      issuer_email: settings?.email || null,
    }).select("*").single();

    if (invoiceResult.error || !invoiceResult.data) {
      setMessage(`Belge oluşturulamadı: ${invoiceResult.error?.message || "Bilinmeyen hata"}`);
      setSaving(false);
      return;
    }

    const invoice = invoiceResult.data as Invoice;
    const itemPayloads = form.lines.map((line) => {
      const item = calculateItem(line, totals.subtotal, totals.discount);
      return {
        business_id: context.business.id,
        invoice_id: invoice.id,
        product_id: selectedOrder?.product_id || null,
        product_code: clean(line.product_code) || selectedOrder?.product_code || null,
        product_name: clean(line.product_name),
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate,
        tax_amount: item.taxAmount,
        line_total: item.lineTotal,
      };
    });

    const itemResult = await supabase.from("invoice_items").insert(itemPayloads);

    if (itemResult.error) {
      await supabase.from("invoices").delete().eq("id", invoice.id).eq("business_id", context.business.id);
      setMessage(`Belge kalemi oluşturulamadı: ${itemResult.error.message}`);
      setSaving(false);
      return;
    }

    await insertLog(invoice.id, "created", `${invoiceNo} taslak olarak oluşturuldu.`, { validationErrors });
    await supabase.from("invoice_settings").update({ next_invoice_number: Number(settings?.next_invoice_number ?? invoices.length + 1) + 1 }).eq("business_id", context.business.id);

    setSaving(false);
    setShowCreate(false);
    setForm({
      ...emptyForm,
      bank_iban: settings?.iban || "",
      public_note: settings?.footer_note || "",
      lines: [{ ...emptyLine, tax_rate: String(settings?.default_tax_rate ?? 20) }],
    });
    setMessage(`${invoiceNo} numaralı belge oluşturuldu.`);
    await fetchData();
  }

  function validationForInvoice(invoice: Invoice) {
    const invoiceItems = items.filter((item) => item.invoice_id === invoice.id);
    return validateInvoiceLike({
      settings,
      customer_name: invoice.customer_name,
      customer_tax_id: invoice.customer_tax_id,
      customer_tax_office: invoice.customer_tax_office,
      billing_address: invoice.billing_address,
      receiver_type: invoice.receiver_type,
      e_document_type: invoice.e_document_type,
      lines: invoiceItems.map((item) => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
      })),
      total_amount: invoice.total_amount,
    });
  }

  async function runValidation(invoice: Invoice, silent = false) {
    if (!context) return [];
    const errors = validationForInvoice(invoice);

    const { error } = await supabase.from("invoices").update({
      validation_status: errors.length ? "failed" : "passed",
      validation_errors: errors,
      updated_at: new Date().toISOString(),
    }).eq("business_id", context.business.id).eq("id", invoice.id);

    if (!error) await insertLog(invoice.id, errors.length ? "validation_failed" : "validation_passed", errors.length ? `${errors.length} kontrol eksik.` : "Belge ön kontrolü başarılı.", { errors });

    if (!silent) {
      setMessage(errors.length ? `Ön kontrol eksikleri: ${errors.join(" ")}` : "Ön kontrol başarılı. Belge API gönderimine hazır.");
      await fetchData();
    }

    return errors;
  }

  async function updateInvoiceStatus(invoice: Invoice, status: string) {
    if (!context) return;
    if (!canManage) {
      setMessage("Bu işletmede fatura/belge yönetimi yetkin yok.");
      return;
    }

    if (status === "issued") {
      const errors = await runValidation(invoice, true);
      if (errors.length > 0) {
        setMessage(`Kesildi yapmadan önce eksikleri tamamla: ${errors.slice(0, 4).join(" ")}`);
        await fetchData();
        return;
      }
    }

    const paidAmount = status === "paid" ? Number(invoice.total_amount ?? 0) : Number(invoice.paid_amount ?? 0);
    const remaining = status === "paid" ? 0 : Number(invoice.remaining_amount ?? 0);

    const { error } = await supabase.from("invoices").update({
      status,
      paid_amount: paidAmount,
      remaining_amount: remaining,
      updated_at: new Date().toISOString(),
    }).eq("business_id", context.business.id).eq("id", invoice.id);

    if (error) {
      setMessage(`Durum güncellenemedi: ${error.message}`);
      return;
    }

    await insertLog(invoice.id, `status_${status}`, `Belge durumu ${statusLabel(status)} olarak güncellendi.`);
    setMessage("Belge durumu güncellendi.");
    await fetchData();
  }

  async function markOfficialReady(invoice: Invoice) {
    if (!context) return;
    const errors = await runValidation(invoice, true);

    if (errors.length) {
      setMessage(`API gönderimi için hazır değil: ${errors.slice(0, 4).join(" ")}`);
      await fetchData();
      return;
    }

    const { error } = await supabase.from("invoices").update({
      official_status: "not_sent",
      validation_status: "passed",
      validation_errors: [],
      updated_at: new Date().toISOString(),
    }).eq("business_id", context.business.id).eq("id", invoice.id);

    if (error) {
      setMessage(`API hazırlık durumu kaydedilemedi: ${error.message}`);
      return;
    }

    await insertLog(invoice.id, "api_ready", "Belge resmî API entegrasyonuna hazır olarak işaretlendi.");
    setMessage("Belge API bağlanınca gönderime hazır. Şimdilik devlete gönderim yapılmadı.");
    await fetchData();
  }

  async function deleteInvoice(invoice: Invoice) {
    if (!context) return;
    if (!canManage) {
      setMessage("Bu işletmede belge silme yetkin yok.");
      return;
    }

    if (!confirm(`${invoice.invoice_no} silinsin mi? Bu işlem belge kalemlerini ve logları da siler.`)) return;

    const { error } = await supabase.from("invoices").delete().eq("business_id", context.business.id).eq("id", invoice.id);

    if (error) {
      setMessage(`Belge silinemedi: ${error.message}`);
      return;
    }

    setMessage("Belge silindi.");
    setDetailInvoice(null);
    await fetchData();
  }

  const filteredInvoices = useMemo(() => filter === "all" ? invoices : invoices.filter((invoice) => invoice.status === filter), [invoices, filter]);

  const stats = useMemo(() => ({
    all: invoices.length,
    draft: invoices.filter((invoice) => invoice.status === "draft").length,
    issued: invoices.filter((invoice) => invoice.status === "issued").length,
    paid: invoices.filter((invoice) => invoice.status === "paid").length,
    cancelled: invoices.filter((invoice) => invoice.status === "cancelled").length,
    failedValidation: invoices.filter((invoice) => invoice.validation_status === "failed").length,
    total: invoices.reduce((sum, invoice) => sum + Number(invoice.total_amount ?? 0), 0),
    remaining: invoices.reduce((sum, invoice) => sum + Number(invoice.remaining_amount ?? 0), 0),
  }), [invoices]);

  const detailItems = detailInvoice ? items.filter((item) => item.invoice_id === detailInvoice.id) : [];
  const detailLogs = detailInvoice ? logs.filter((log) => log.invoice_id === detailInvoice.id) : [];
  const settingsMissing = !settings || !settings.company_title || !settings.tax_id || !settings.tax_office || !settings.address;

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">Invoice Center v19</div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Fatura / Belge Merkezi</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              Firma bilgileri, çoklu kalem, KDV, ön kontrol, işlem geçmişi ve PDF/print görünümü hazır. Resmî API bağlantısı son aşamada eklenecek.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowSettings((value) => !value)} className="rounded-2xl bg-white/8 px-5 py-3 text-sm font-black text-slate-200 ring-1 ring-white/10 transition hover:bg-white/12">
              Fatura Ayarları
            </button>
            <button onClick={() => setShowCreate((value) => !value)} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500">
              {showCreate ? "Formu Kapat" : "Yeni Belge"}
            </button>
            <button onClick={fetchData} className="rounded-2xl bg-white/8 px-5 py-3 text-sm font-black text-slate-200 ring-1 ring-white/10 transition hover:bg-white/12">Yenile</button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100/90">
        <b>Güvenli mod:</b> Bu ekran resmî e-Fatura/e-Arşiv göndermez. API bağlanınca sadece ön kontrolden geçen belgeler gönderime açılacak.
      </div>

      {settingsMissing ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
          Fatura ayarlarında firma unvanı, VKN/TCKN, vergi dairesi ve adres eksik. Belge oluşturabilirsin ama “Kesildi/API hazır” aşamasında ön kontrol hata verir.
        </div>
      ) : null}

      {message ? <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">{message}</div> : null}

      {showSettings ? (
        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-4">
            <h2 className="text-2xl font-black">Fatura Ayarları</h2>
            <p className="mt-1 text-sm text-slate-400">Satıcı/firma bilgileri PDF, ön kontrol ve ilerideki resmî API gönderimi için kullanılır.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Firma Unvanı"><input value={settingsForm.company_title} onChange={(e) => setSettingsForm((c) => ({ ...c, company_title: e.target.value }))} className="input" /></Field>
            <Field label="VKN / TCKN"><input value={settingsForm.tax_id} onChange={(e) => setSettingsForm((c) => ({ ...c, tax_id: e.target.value }))} className="input" /></Field>
            <Field label="Vergi Dairesi"><input value={settingsForm.tax_office} onChange={(e) => setSettingsForm((c) => ({ ...c, tax_office: e.target.value }))} className="input" /></Field>
            <Field label="Telefon"><input value={settingsForm.phone} onChange={(e) => setSettingsForm((c) => ({ ...c, phone: e.target.value }))} className="input" /></Field>
            <Field label="E-posta"><input value={settingsForm.email} onChange={(e) => setSettingsForm((c) => ({ ...c, email: e.target.value }))} className="input" /></Field>
            <Field label="Web Sitesi"><input value={settingsForm.website} onChange={(e) => setSettingsForm((c) => ({ ...c, website: e.target.value }))} className="input" /></Field>
            <Field label="IBAN"><input value={settingsForm.iban} onChange={(e) => setSettingsForm((c) => ({ ...c, iban: e.target.value }))} className="input" /></Field>
            <Field label="Banka"><input value={settingsForm.bank_name} onChange={(e) => setSettingsForm((c) => ({ ...c, bank_name: e.target.value }))} className="input" /></Field>
            <Field label="Varsayılan KDV %"><input type="number" value={settingsForm.default_tax_rate} onChange={(e) => setSettingsForm((c) => ({ ...c, default_tax_rate: e.target.value }))} className="input" /></Field>
            <Field label="Vade Günü"><input type="number" value={settingsForm.default_due_days} onChange={(e) => setSettingsForm((c) => ({ ...c, default_due_days: e.target.value }))} className="input" /></Field>
            <Field label="Belge Prefix"><input value={settingsForm.invoice_prefix} onChange={(e) => setSettingsForm((c) => ({ ...c, invoice_prefix: e.target.value }))} className="input" /></Field>
            <Field label="Logo URL"><input value={settingsForm.logo_url} onChange={(e) => setSettingsForm((c) => ({ ...c, logo_url: e.target.value }))} className="input" /></Field>
            <label className="md:col-span-2"><span className="label">Adres</span><input value={settingsForm.address} onChange={(e) => setSettingsForm((c) => ({ ...c, address: e.target.value }))} className="input" /></label>
            <Field label="İl"><input value={settingsForm.city} onChange={(e) => setSettingsForm((c) => ({ ...c, city: e.target.value }))} className="input" /></Field>
            <Field label="İlçe"><input value={settingsForm.district} onChange={(e) => setSettingsForm((c) => ({ ...c, district: e.target.value }))} className="input" /></Field>
            <label className="md:col-span-4"><span className="label">PDF Alt Not</span><input value={settingsForm.footer_note} onChange={(e) => setSettingsForm((c) => ({ ...c, footer_note: e.target.value }))} className="input" /></label>
          </div>

          <div className="mt-5">
            <button onClick={saveSettings} disabled={!canManage} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">Ayarları Kaydet</button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-8">
        <FilterMetric active={filter === "all"} label="Tümü" value={loading ? "..." : String(stats.all)} onClick={() => setFilter("all")} />
        <FilterMetric active={filter === "draft"} label="Taslak" value={loading ? "..." : String(stats.draft)} onClick={() => setFilter("draft")} />
        <FilterMetric active={filter === "issued"} label="Kesildi" value={loading ? "..." : String(stats.issued)} onClick={() => setFilter("issued")} />
        <FilterMetric active={filter === "paid"} label="Ödendi" value={loading ? "..." : String(stats.paid)} onClick={() => setFilter("paid")} />
        <FilterMetric active={filter === "cancelled"} label="İptal" value={loading ? "..." : String(stats.cancelled)} onClick={() => setFilter("cancelled")} />
        <InfoMetric label="Kontrol Hatası" value={String(stats.failedValidation)} valueClass="text-red-300" />
        <InfoMetric label="Toplam" value={formatCurrency(stats.total)} valueClass="text-emerald-300" />
        <InfoMetric label="Kalan" value={formatCurrency(stats.remaining)} valueClass="text-amber-300" />
      </div>

      {showCreate ? (
        <form onSubmit={createInvoice} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-4">
            <h2 className="text-2xl font-black">Yeni Belge</h2>
            <p className="mt-1 text-sm text-slate-400">Çoklu kalem, KDV, müşteri vergi bilgisi ve API hazır belge alanları.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Siparişten Oluştur">
              <select value={form.order_id} onChange={(e) => setForm((c) => ({ ...c, order_id: e.target.value }))} className="input">
                <option value="">Manuel belge</option>
                {orders.map((order) => <option key={order.id} value={order.id}>{order.order_no || "Sipariş"} — {order.customer_name || "Müşteri"} — {formatCurrency(order.total_amount)}</option>)}
              </select>
            </Field>
            <Field label="CRM Müşterisi">
              <select value={form.customer_id} onChange={(e) => setForm((c) => ({ ...c, customer_id: e.target.value }))} className="input">
                <option value="">Seçme</option>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
              </select>
            </Field>
            <Field label="Belge Tipi">
              <select value={form.e_document_type} onChange={(e) => setForm((c) => ({ ...c, e_document_type: e.target.value as InvoiceForm["e_document_type"] }))} className="input">
                <option value="internal">İç Belge</option>
                <option value="proforma">Proforma</option>
                <option value="e_archive_ready">e-Arşiv Hazırlık</option>
                <option value="e_invoice_ready">e-Fatura Hazırlık</option>
              </select>
            </Field>
            <Field label="Alıcı Tipi">
              <select value={form.receiver_type} onChange={(e) => setForm((c) => ({ ...c, receiver_type: e.target.value as InvoiceForm["receiver_type"] }))} className="input">
                <option value="individual">Bireysel</option>
                <option value="company">Kurumsal</option>
              </select>
            </Field>
            <Field label="Müşteri Adı / Unvanı"><input value={form.customer_name} onChange={(e) => setForm((c) => ({ ...c, customer_name: e.target.value }))} className="input" /></Field>
            <Field label="Telefon"><input value={form.customer_phone} onChange={(e) => setForm((c) => ({ ...c, customer_phone: e.target.value }))} className="input" /></Field>
            <Field label="E-posta"><input value={form.customer_email} onChange={(e) => setForm((c) => ({ ...c, customer_email: e.target.value }))} className="input" /></Field>
            <Field label="TCKN / VKN"><input value={form.customer_tax_id} onChange={(e) => setForm((c) => ({ ...c, customer_tax_id: e.target.value }))} className="input" /></Field>
            <Field label="Vergi Dairesi"><input value={form.customer_tax_office} onChange={(e) => setForm((c) => ({ ...c, customer_tax_office: e.target.value }))} className="input" /></Field>
            <Field label="Düzenleme Tarihi"><input type="date" value={form.issue_date} onChange={(e) => setForm((c) => ({ ...c, issue_date: e.target.value }))} className="input" /></Field>
            <Field label="Vade Tarihi"><input type="date" value={form.due_date} onChange={(e) => setForm((c) => ({ ...c, due_date: e.target.value }))} className="input" /></Field>
            <Field label="Alınan Ödeme"><input type="number" value={form.paid_amount} onChange={(e) => setForm((c) => ({ ...c, paid_amount: e.target.value }))} className="input" /></Field>
            <label className="md:col-span-2"><span className="label">Fatura Adresi</span><input value={form.billing_address} onChange={(e) => setForm((c) => ({ ...c, billing_address: e.target.value }))} className="input" /></label>
            <label className="md:col-span-2"><span className="label">Ödeme Şartı</span><input value={form.payment_terms} onChange={(e) => setForm((c) => ({ ...c, payment_terms: e.target.value }))} className="input" placeholder="Örn: 7 gün içinde banka havalesi" /></label>
            <label className="md:col-span-2"><span className="label">IBAN</span><input value={form.bank_iban} onChange={(e) => setForm((c) => ({ ...c, bank_iban: e.target.value }))} className="input" /></label>
            <label className="md:col-span-2"><span className="label">Müşteriye Görünen Not</span><input value={form.public_note} onChange={(e) => setForm((c) => ({ ...c, public_note: e.target.value }))} className="input" /></label>
          </div>

          <div className="mt-5 rounded-[24px] border border-white/10 bg-[#0b1220] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-black">Belge Kalemleri</h3>
              <button type="button" onClick={addLine} className="rounded-2xl bg-blue-500/15 px-4 py-2 text-xs font-black text-blue-300 ring-1 ring-blue-400/20">Kalem Ekle</button>
            </div>

            <div className="grid gap-3">
              {form.lines.map((line, index) => (
                <div key={index} className="grid gap-2 rounded-2xl border border-white/10 bg-[#111a2e] p-3 md:grid-cols-[1.5fr_0.7fr_0.55fr_0.7fr_0.55fr_auto]">
                  <input placeholder="Ürün / hizmet adı" value={line.product_name} onChange={(e) => updateLine(index, { product_name: e.target.value })} className="input" />
                  <input placeholder="Kod" value={line.product_code} onChange={(e) => updateLine(index, { product_code: e.target.value })} className="input" />
                  <input type="number" placeholder="Adet" value={line.quantity} onChange={(e) => updateLine(index, { quantity: e.target.value })} className="input" />
                  <input type="number" placeholder="Birim" value={line.unit_price} onChange={(e) => updateLine(index, { unit_price: e.target.value })} className="input" />
                  <input type="number" placeholder="KDV" value={line.tax_rate} onChange={(e) => updateLine(index, { tax_rate: e.target.value })} className="input" />
                  <button type="button" onClick={() => removeLine(index)} className="rounded-2xl bg-red-500/15 px-3 py-2 text-xs font-black text-red-300 ring-1 ring-red-400/20">Sil</button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 rounded-[22px] border border-white/10 bg-[#0b1220] p-4 md:grid-cols-5">
            <InfoMetric label="Ara Toplam" value={formatCurrency(totals.subtotal)} valueClass="text-slate-200" />
            <InfoMetric label="KDV" value={formatCurrency(totals.taxAmount)} valueClass="text-blue-300" />
            <Field label="İndirim"><input type="number" value={form.discount_amount} onChange={(e) => setForm((c) => ({ ...c, discount_amount: e.target.value }))} className="input" /></Field>
            <InfoMetric label="Genel Toplam" value={formatCurrency(totals.total)} valueClass="text-emerald-300" />
            <InfoMetric label="Kalan" value={formatCurrency(totals.remaining)} valueClass="text-red-300" />
          </div>

          <label className="mt-4 block"><span className="label">İç Not</span><input value={form.note} onChange={(e) => setForm((c) => ({ ...c, note: e.target.value }))} className="input" /></label>

          <div className="mt-5 flex flex-wrap gap-2">
            <button disabled={saving || !canManage} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-50">
              {saving ? "Kaydediliyor..." : "Taslak Belge Oluştur"}
            </button>
            <button type="button" onClick={() => setForm({ ...emptyForm, bank_iban: settings?.iban || "", public_note: settings?.footer_note || "", lines: [{ ...emptyLine, tax_rate: String(settings?.default_tax_rate ?? 20) }] })} className="rounded-2xl bg-white/8 px-5 py-3 text-sm font-black text-slate-300 ring-1 ring-white/10">Temizle</button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-3">
        {filteredInvoices.length === 0 ? (
          <div className="rounded-[26px] border border-dashed border-white/10 bg-[#111a2e] p-10 text-center"><p className="text-sm font-bold text-slate-500">Bu filtrede belge yok.</p></div>
        ) : (
          filteredInvoices.map((invoice) => (
            <article key={invoice.id} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-4">
              <div className="grid gap-4 xl:grid-cols-[1.1fr_1.2fr_0.8fr] xl:items-center">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black">{invoice.invoice_no}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(invoice.status)}`}>{statusLabel(invoice.status)}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${officialClass(invoice.official_status)}`}>{officialLabel(invoice.official_status)}</span>
                    <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-black text-purple-300 ring-1 ring-purple-400/20">{documentTypeLabel(invoice.e_document_type)}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-300">{invoice.customer_name}</p>
                  <p className="mt-1 text-xs text-slate-500">Düzenleme: {formatDate(invoice.issue_date)} · Vade: {formatDate(invoice.due_date)}</p>
                  {invoice.validation_status === "failed" ? <p className="mt-2 text-xs font-bold text-red-300">Ön kontrol eksikleri var.</p> : null}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <InfoBox label="Ara Toplam" value={formatCurrency(invoice.subtotal)} />
                  <InfoBox label="KDV" value={formatCurrency(invoice.tax_amount)} valueClass="text-blue-300" />
                  <InfoBox label="Toplam" value={formatCurrency(invoice.total_amount)} valueClass="text-emerald-300" />
                  <InfoBox label="Kalan" value={formatCurrency(invoice.remaining_amount)} valueClass={Number(invoice.remaining_amount ?? 0) > 0 ? "text-amber-300" : "text-slate-300"} />
                </div>

                <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
                  <button onClick={() => setDetailInvoice(invoice)} className="btn-blue">Detay</button>
                  <button onClick={() => runValidation(invoice)} disabled={!canManage} className="btn-slate">Ön Kontrol</button>
                  <button onClick={() => updateInvoiceStatus(invoice, "issued")} disabled={!canManage || invoice.status === "cancelled"} className="btn-cyan">Kesildi</button>
                  <button onClick={() => markOfficialReady(invoice)} disabled={!canManage || invoice.status === "cancelled"} className="btn-emerald">API Hazır</button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {detailInvoice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[30px] border border-white/10 bg-[#111a2e] p-5 shadow-2xl print:max-h-none print:rounded-none print:border-0 print:bg-white print:text-black">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2 print:hidden">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(detailInvoice.status)}`}>{statusLabel(detailInvoice.status)}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${officialClass(detailInvoice.official_status)}`}>{officialLabel(detailInvoice.official_status)}</span>
                  <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-black text-purple-300 ring-1 ring-purple-400/20">{documentTypeLabel(detailInvoice.e_document_type)}</span>
                </div>
                <h2 className="text-3xl font-black tracking-[-0.04em]">Belge: {detailInvoice.invoice_no}</h2>
                <p className="mt-1 text-sm text-slate-400 print:text-slate-700">Bu belge Takipio içi takip kaydıdır. Resmî API gönderimi henüz bağlı değildir.</p>
              </div>
              <div className="flex flex-wrap gap-2 print:hidden">
                <button onClick={() => window.print()} className="btn-emerald">Yazdır / PDF Al</button>
                <button onClick={() => setDetailInvoice(null)} className="btn-slate">Kapat</button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Satıcı Bilgisi">
                <InfoLine label="Unvan" value={detailInvoice.issuer_title || settings?.company_title || "-"} />
                <InfoLine label="VKN/TCKN" value={detailInvoice.issuer_tax_id || settings?.tax_id || "-"} />
                <InfoLine label="Vergi Dairesi" value={detailInvoice.issuer_tax_office || settings?.tax_office || "-"} />
                <InfoLine label="Adres" value={detailInvoice.issuer_address || settings?.address || "-"} />
                <InfoLine label="Telefon" value={detailInvoice.issuer_phone || settings?.phone || "-"} />
                <InfoLine label="E-posta" value={detailInvoice.issuer_email || settings?.email || "-"} />
              </Panel>

              <Panel title="Alıcı Bilgisi">
                <InfoLine label="Müşteri" value={detailInvoice.customer_name} />
                <InfoLine label="Telefon" value={detailInvoice.customer_phone || "-"} />
                <InfoLine label="E-posta" value={detailInvoice.customer_email || "-"} />
                <InfoLine label="TCKN/VKN" value={detailInvoice.customer_tax_id || "-"} />
                <InfoLine label="Vergi Dairesi" value={detailInvoice.customer_tax_office || "-"} />
                <InfoLine label="Adres" value={detailInvoice.billing_address || "-"} />
              </Panel>
            </div>

            <Panel title="Kalemler" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
                    <tr><th className="py-3">Ürün / Hizmet</th><th className="py-3 text-right">Adet</th><th className="py-3 text-right">Birim</th><th className="py-3 text-right">KDV</th><th className="py-3 text-right">Toplam</th></tr>
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
            </Panel>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.65fr]">
              <Panel title="Notlar ve API Hazırlık">
                <InfoLine label="Profil" value={detailInvoice.profile_id || "-"} />
                <InfoLine label="Senaryo" value={detailInvoice.invoice_scenario || "-"} />
                <InfoLine label="GİB UUID" value={detailInvoice.gib_uuid || "API bağlanınca oluşacak"} />
                <p className="mt-3 text-sm leading-6 text-slate-400 print:text-slate-700">{detailInvoice.public_note || detailInvoice.note || settings?.footer_note || "Not bulunmuyor."}</p>
                {detailInvoice.validation_status === "failed" && Array.isArray(detailInvoice.validation_errors) ? (
                  <div className="mt-4 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-400/20">
                    <p className="mb-2 font-black">Ön kontrol eksikleri:</p>
                    <ul className="list-disc pl-5">{detailInvoice.validation_errors.map((err, idx) => <li key={idx}>{err}</li>)}</ul>
                  </div>
                ) : null}
              </Panel>

              <Panel title="Toplamlar">
                <InfoLine label="Ara Toplam" value={formatCurrency(detailInvoice.subtotal)} />
                <InfoLine label="KDV" value={formatCurrency(detailInvoice.tax_amount)} />
                <InfoLine label="İndirim" value={formatCurrency(detailInvoice.discount_amount)} />
                <InfoLine label="Genel Toplam" value={formatCurrency(detailInvoice.total_amount)} />
                <InfoLine label="Ödenen" value={formatCurrency(detailInvoice.paid_amount)} />
                <InfoLine label="Kalan" value={formatCurrency(detailInvoice.remaining_amount)} />
              </Panel>
            </div>

            <Panel title="İşlem Geçmişi" className="mt-4 print:hidden">
              {detailLogs.length === 0 ? <p className="text-sm text-slate-500">Henüz işlem kaydı yok.</p> : (
                <div className="grid gap-2">
                  {detailLogs.map((log) => (
                    <div key={log.id} className="rounded-2xl bg-[#111a2e] p-3 ring-1 ring-white/10">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-black">{log.message || log.action}</p>
                        <p className="text-xs text-slate-500">{formatDate(log.created_at)} · {log.actor_email || "-"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <div className="mt-5 flex flex-wrap gap-2 print:hidden">
              <button onClick={() => runValidation(detailInvoice)} disabled={!canManage} className="btn-slate">Ön Kontrol</button>
              <button onClick={() => updateInvoiceStatus(detailInvoice, "issued")} disabled={!canManage || detailInvoice.status === "cancelled"} className="btn-cyan">Kesildi İşaretle</button>
              <button onClick={() => updateInvoiceStatus(detailInvoice, "paid")} disabled={!canManage || detailInvoice.status === "cancelled"} className="btn-emerald">Ödendi İşaretle</button>
              <button onClick={() => markOfficialReady(detailInvoice)} disabled={!canManage || detailInvoice.status === "cancelled"} className="btn-blue">API Hazır</button>
              <button onClick={() => updateInvoiceStatus(detailInvoice, "cancelled")} disabled={!canManage} className="btn-amber">İptal Et</button>
              <button onClick={() => deleteInvoice(detailInvoice)} disabled={!canManage} className="btn-red">Sil</button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgba(255,255,255,0.1);
          background: #0b1220;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          outline: none;
        }
        .label {
          display: block;
          margin-bottom: 0.375rem;
          font-size: 0.75rem;
          font-weight: 900;
          color: rgb(148 163 184);
        }
        .btn-blue, .btn-cyan, .btn-emerald, .btn-amber, .btn-red, .btn-slate {
          border-radius: 1rem;
          padding: 0.625rem 1rem;
          font-size: 0.75rem;
          font-weight: 900;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .btn-blue { background: rgba(59,130,246,0.15); color: rgb(147 197 253); }
        .btn-cyan { background: rgba(6,182,212,0.15); color: rgb(103 232 249); }
        .btn-emerald { background: rgba(16,185,129,0.15); color: rgb(110 231 183); }
        .btn-amber { background: rgba(245,158,11,0.15); color: rgb(252 211 77); }
        .btn-red { background: rgba(239,68,68,0.15); color: rgb(252 165 165); }
        .btn-slate { background: rgba(255,255,255,0.08); color: rgb(203 213 225); }
        button:disabled { opacity: 0.45; cursor: not-allowed; }
      `}</style>
    </section>
  );
}

function FilterMetric({ label, value, active, onClick }: { label: string; value: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-[22px] border p-4 text-left transition hover:-translate-y-0.5 ${active ? "border-blue-400/40 bg-blue-500/15" : "border-white/10 bg-[#111a2e] hover:bg-[#162138]"}`}>
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
  return <label className="block"><span className="label">{label}</span>{children}</label>;
}

function InfoBox({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-[#0b1220] p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={["mt-2 truncate text-lg font-black", valueClass || "text-white"].join(" ")}>{value}</p>
    </div>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[24px] border border-white/10 bg-[#0b1220] p-4 print:border-slate-200 print:bg-white ${className}`}>
      <h3 className="mb-4 text-xl font-black">{title}</h3>
      {children}
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
