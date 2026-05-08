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

type Customer = {
  id: string;
  business_id: string | null;
  created_by: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  note: string | null;
  created_at: string;
};

type CustomerForm = {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  note: string;
};

const emptyForm: CustomerForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  note: "",
};

export default function CustomersPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const canManage = hasPermission(context, "can_manage_customers");

  async function fetchData() {
    setLoading(true);
    setMessage("");

    try {
      const ctx = await ensureBusinessForCurrentUser();
      setContext(ctx);

      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("business_id", ctx.business.id)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(`Müşteriler alınamadı: ${error.message}`);
        return;
      }

      setCustomers(data ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "İşletme bağlantısı kurulamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      return (
        !query ||
        (customer.name ?? "").toLowerCase().includes(query) ||
        (customer.email ?? "").toLowerCase().includes(query) ||
        (customer.phone ?? "").toLowerCase().includes(query) ||
        (customer.company ?? "").toLowerCase().includes(query)
      );
    });
  }, [customers, search]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(customer: Customer) {
    if (!canManage) {
      setMessage("Bu işletmede müşteri düzenleme yetkin yok.");
      return;
    }

    setEditingId(customer.id);
    setForm({
      name: customer.name ?? "",
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      company: customer.company ?? "",
      address: customer.address ?? "",
      note: customer.note ?? "",
    });
    setFormOpen(true);
  }

  async function saveCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede müşteri yönetimi yetkin yok.");
      return;
    }

    const cleanName = form.name.trim();

    if (!cleanName) {
      setMessage("Müşteri adı gerekli.");
      return;
    }

    const payload = {
      ...withBusinessFields(context),
      name: cleanName,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      company: form.company.trim() || null,
      address: form.address.trim() || null,
      note: form.note.trim() || null,
    };

    const result = editingId
      ? await supabase.from("customers").update(payload).eq("business_id", context.business.id).eq("id", editingId)
      : await supabase.from("customers").insert(payload);

    if (result.error) {
      setMessage(`Müşteri kaydedilemedi: ${result.error.message}`);
      return;
    }

    setMessage(editingId ? "Müşteri güncellendi." : "Müşteri eklendi.");
    resetForm();
    setFormOpen(false);
    await fetchData();
  }

  async function deleteCustomer(id: string) {
    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede müşteri silme yetkin yok.");
      return;
    }

    if (!confirm("Müşteri silinsin mi?")) return;

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("business_id", context.business.id)
      .eq("id", id);

    if (error) {
      setMessage(`Müşteri silinemedi: ${error.message}`);
      return;
    }

    setMessage("Müşteri silindi.");
    await fetchData();
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Customers Business Core v1
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Müşteriler</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Müşteriler artık sadece aktif işletmeye bağlı kaydolur.
            </p>
          </div>

          <button
            onClick={() => {
              if (!canManage) {
                setMessage("Bu işletmede müşteri ekleme yetkin yok.");
                return;
              }
              resetForm();
              setFormOpen((value) => !value);
            }}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500"
          >
            {formOpen ? "Formu Kapat" : "Yeni Müşteri"}
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
        <Metric label="Toplam Müşteri" value={String(customers.length)} valueClass="text-white" />
        <Metric label="Firma Kaydı" value={String(customers.filter((item) => item.company).length)} valueClass="text-blue-300" />
        <Metric label="E-posta" value={String(customers.filter((item) => item.email).length)} valueClass="text-emerald-300" />
        <Metric label="Telefon" value={String(customers.filter((item) => item.phone).length)} valueClass="text-amber-300" />
      </div>

      {formOpen ? (
        <form onSubmit={saveCustomer} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <h2 className="text-2xl font-black">{editingId ? "Müşteriyi Düzenle" : "Yeni Müşteri"}</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Müşteri Adı">
              <input value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>
            <Field label="Firma">
              <input value={form.company} onChange={(e) => setForm((c) => ({ ...c, company: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>
            <Field label="Telefon">
              <input value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>
            <Field label="E-posta">
              <input value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>
            <Field label="Adres">
              <input value={form.address} onChange={(e) => setForm((c) => ({ ...c, address: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
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
            <h2 className="text-2xl font-black">Müşteri Listesi</h2>
            <p className="mt-1 text-sm text-slate-400">Aktif işletmenin müşteri kayıtları.</p>
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Müşteri ara..." className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none placeholder:text-slate-500 lg:w-[320px]" />
        </div>

        {loading ? (
          <div className="grid gap-3">{[1,2,3].map((item) => <div key={item} className="h-24 animate-pulse rounded-[24px] bg-white/5" />)}</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0b1220] p-10 text-center">
            <h3 className="text-xl font-black">Müşteri bulunamadı</h3>
            <p className="mt-2 text-sm text-slate-500">İlk müşteriyi eklediğinde burada gözükecek.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="rounded-[22px] border border-white/10 bg-[#0b1220] p-4 transition hover:bg-[#101a31]">
                <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr_0.8fr_auto] xl:items-center">
                  <div>
                    <h3 className="text-lg font-black">{customer.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{customer.company || "Firma yok"}</p>
                    <p className="mt-2 text-xs text-slate-500">Ekleyen: {customer.created_by || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">İletişim</p>
                    <p className="mt-1 text-sm font-bold">{customer.phone || "-"}</p>
                    <p className="mt-1 text-xs text-slate-500">{customer.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Adres / Not</p>
                    <p className="mt-1 text-xs text-slate-400">{customer.address || "-"}</p>
                    <p className="mt-1 text-xs text-slate-500">{customer.note || "-"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <button onClick={() => startEdit(customer)} className="rounded-xl bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">Düzenle</button>
                    <button onClick={() => deleteCustomer(customer.id)} className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-black text-red-300">Sil</button>
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
