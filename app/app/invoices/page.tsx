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
  can_manage_sales?: boolean | null;
  can_manage_invoices?: boolean | null;
  can_manage_customers?: boolean | null;
  can_manage_integrations?: boolean | null;
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

type Invoice = {
  id: string;
  business_id: string | null;
  created_by: string | null;
  invoice_no: string | null;
  customer_name: string | null;
  customer_email: string | null;
  amount: number | null;
  tax_amount: number | null;
  total_amount: number | null;
  status: string | null;
  due_date: string | null;
  note: string | null;
  created_at: string;
};

type InvoiceForm = {
  invoice_no: string;
  customer_name: string;
  customer_email: string;
  amount: string;
  tax_amount: string;
  status: string;
  due_date: string;
  note: string;
};

const emptyForm: InvoiceForm = {
  invoice_no: "",
  customer_name: "",
  customer_email: "",
  amount: "",
  tax_amount: "",
  status: "draft",
  due_date: "",
  note: "",
};

function createInvoiceNo() {
  return `INV-${Date.now().toString().slice(-8)}`;
}

function statusLabel(status: string | null | undefined) {
  if (status === "paid") return "Ödendi";
  if (status === "sent") return "Gönderildi";
  if (status === "overdue") return "Gecikti";
  return "Taslak";
}

function statusClass(status: string | null | undefined) {
  if (status === "paid") return "bg-emerald-400/15 text-emerald-300";
  if (status === "sent") return "bg-blue-400/15 text-blue-300";
  if (status === "overdue") return "bg-red-400/15 text-red-300";
  return "bg-white/10 text-slate-300";
}

export default function InvoicesPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [form, setForm] = useState<InvoiceForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const canManage = hasPermission(context, "can_manage_invoices");

  async function fetchData() {
    setLoading(true);
    setMessage("");

    try {
      const ctx = await ensureBusinessForCurrentUser();
      setContext(ctx);

      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("business_id", ctx.business.id)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(`Faturalar alınamadı: ${error.message}`);
        return;
      }

      setInvoices(data ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "İşletme bağlantısı kurulamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesSearch =
        !query ||
        (invoice.invoice_no ?? "").toLowerCase().includes(query) ||
        (invoice.customer_name ?? "").toLowerCase().includes(query) ||
        (invoice.customer_email ?? "").toLowerCase().includes(query);

      const matchesStatus = statusFilter === "all" ? true : invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const totalAmount = invoices.reduce((sum, invoice) => sum + Number(invoice.total_amount ?? invoice.amount ?? 0), 0);
  const paidAmount = invoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + Number(invoice.total_amount ?? invoice.amount ?? 0), 0);
  const pendingAmount = totalAmount - paidAmount;
  const overdueCount = invoices.filter((invoice) => invoice.status === "overdue").length;

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(invoice: Invoice) {
    if (!canManage) {
      setMessage("Bu işletmede fatura düzenleme yetkin yok.");
      return;
    }

    setEditingId(invoice.id);
    setForm({
      invoice_no: invoice.invoice_no ?? "",
      customer_name: invoice.customer_name ?? "",
      customer_email: invoice.customer_email ?? "",
      amount: String(invoice.amount ?? 0),
      tax_amount: String(invoice.tax_amount ?? 0),
      status: invoice.status ?? "draft",
      due_date: invoice.due_date ? invoice.due_date.slice(0, 10) : "",
      note: invoice.note ?? "",
    });
    setFormOpen(true);
  }

  async function saveInvoice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede fatura yönetimi yetkin yok.");
      return;
    }

    const amount = Number(form.amount || 0);
    const taxAmount = Number(form.tax_amount || 0);
    const totalAmount = amount + taxAmount;

    const payload = {
      ...withBusinessFields(context),
      invoice_no: form.invoice_no.trim() || createInvoiceNo(),
      customer_name: form.customer_name.trim() || null,
      customer_email: form.customer_email.trim() || null,
      amount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: form.status,
      due_date: form.due_date || null,
      note: form.note.trim() || null,
    };

    const result = editingId
      ? await supabase.from("invoices").update(payload).eq("business_id", context.business.id).eq("id", editingId)
      : await supabase.from("invoices").insert(payload);

    if (result.error) {
      setMessage(`Fatura kaydedilemedi: ${result.error.message}`);
      return;
    }

    setMessage(editingId ? "Fatura güncellendi." : "Fatura oluşturuldu.");
    resetForm();
    setFormOpen(false);
    await fetchData();
  }

  async function updateStatus(invoice: Invoice, status: string) {
    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede fatura güncelleme yetkin yok.");
      return;
    }

    await supabase
      .from("invoices")
      .update({ status })
      .eq("business_id", context.business.id)
      .eq("id", invoice.id);

    setMessage("Fatura durumu güncellendi.");
    await fetchData();
  }

  async function deleteInvoice(id: string) {
    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede fatura silme yetkin yok.");
      return;
    }

    if (!confirm("Fatura silinsin mi?")) return;

    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("business_id", context.business.id)
      .eq("id", id);

    if (error) {
      setMessage(`Fatura silinemedi: ${error.message}`);
      return;
    }

    setMessage("Fatura silindi.");
    await fetchData();
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Invoices Business Core v1
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Faturalar</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Faturalar artık sadece aktif işletmeye bağlı kaydolur.
            </p>
          </div>

          <button
            onClick={() => {
              if (!canManage) {
                setMessage("Bu işletmede fatura ekleme yetkin yok.");
                return;
              }
              resetForm();
              setFormOpen((value) => !value);
            }}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500"
          >
            {formOpen ? "Formu Kapat" : "Yeni Fatura"}
          </button>
        </div>
      </div>

      {context ? (
        <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Aktif İşletme</p>
          <p className="mt-1 text-lg font-black">{context.business.name}</p>
        </div>
      ) : null}

      {message ? (
        <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Toplam Fatura" value={String(invoices.length)} valueClass="text-white" />
        <Metric label="Toplam Tutar" value={formatCurrency(totalAmount)} valueClass="text-blue-300" />
        <Metric label="Tahsil Edilen" value={formatCurrency(paidAmount)} valueClass="text-emerald-300" />
        <Metric label="Bekleyen / Geciken" value={`${formatCurrency(pendingAmount)} / ${overdueCount}`} valueClass="text-amber-300" />
      </div>

      {formOpen ? (
        <form onSubmit={saveInvoice} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <h2 className="text-2xl font-black">{editingId ? "Faturayı Düzenle" : "Yeni Fatura"}</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Fatura No">
              <input value={form.invoice_no} onChange={(e) => setForm((c) => ({ ...c, invoice_no: e.target.value }))} placeholder="Boş kalırsa otomatik" className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>
            <Field label="Müşteri">
              <input value={form.customer_name} onChange={(e) => setForm((c) => ({ ...c, customer_name: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>
            <Field label="E-posta">
              <input value={form.customer_email} onChange={(e) => setForm((c) => ({ ...c, customer_email: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>
            <Field label="Ara Tutar">
              <input type="number" value={form.amount} onChange={(e) => setForm((c) => ({ ...c, amount: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>
            <Field label="Vergi / KDV">
              <input type="number" value={form.tax_amount} onChange={(e) => setForm((c) => ({ ...c, tax_amount: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>
            <Field label="Durum">
              <select value={form.status} onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                <option value="draft">Taslak</option>
                <option value="sent">Gönderildi</option>
                <option value="paid">Ödendi</option>
                <option value="overdue">Gecikti</option>
              </select>
            </Field>
            <Field label="Vade Tarihi">
              <input type="date" value={form.due_date} onChange={(e) => setForm((c) => ({ ...c, due_date: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>
            <Field label="Not">
              <input value={form.note} onChange={(e) => setForm((c) => ({ ...c, note: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">{editingId ? "Güncelle" : "Kaydet"}</button>
            <button type="button" onClick={() => { resetForm(); setFormOpen(false); }} className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-slate-200">Vazgeç</button>
          </div>
        </form>
      ) : null}

      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black">Fatura Listesi</h2>
            <p className="mt-1 text-sm text-slate-400">Aktif işletmenin fatura kayıtları.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Fatura ara..." className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none placeholder:text-slate-500 sm:w-[240px]" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
              <option value="all">Tüm Durumlar</option>
              <option value="draft">Taslak</option>
              <option value="sent">Gönderildi</option>
              <option value="paid">Ödendi</option>
              <option value="overdue">Gecikti</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3">{[1,2,3].map((item) => <div key={item} className="h-24 animate-pulse rounded-[24px] bg-white/5" />)}</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0b1220] p-10 text-center">
            <h3 className="text-xl font-black">Fatura bulunamadı</h3>
            <p className="mt-2 text-sm text-slate-500">İlk faturayı oluşturduğunda burada gözükecek.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="rounded-[22px] border border-white/10 bg-[#0b1220] p-4 transition hover:bg-[#101a31]">
                <div className="grid gap-4 xl:grid-cols-[1fr_0.7fr_0.7fr_auto] xl:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black">{invoice.invoice_no || "-"}</h3>
                      <span className={["rounded-full px-3 py-1 text-xs font-black", statusClass(invoice.status)].join(" ")}>{statusLabel(invoice.status)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{invoice.customer_name || "Müşteri yok"}</p>
                    <p className="mt-2 text-xs text-slate-500">{invoice.customer_email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Tutar</p>
                    <p className="mt-1 text-lg font-black">{formatCurrency(invoice.total_amount ?? invoice.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Vade</p>
                    <p className="mt-1 text-sm text-slate-400">{invoice.due_date ? formatDate(invoice.due_date) : "-"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <button onClick={() => startEdit(invoice)} className="rounded-xl bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">Düzenle</button>
                    <button onClick={() => updateStatus(invoice, "paid")} className="rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-black text-emerald-300">Ödendi</button>
                    <button onClick={() => deleteInvoice(invoice.id)} className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-black text-red-300">Sil</button>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-black text-slate-400">{label}</span>
      {children}
    </label>
  );
}
