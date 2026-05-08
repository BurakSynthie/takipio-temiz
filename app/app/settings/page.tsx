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
  phone: string | null;
  email: string | null;
  website: string | null;
  tax_office: string | null;
  tax_number: string | null;
  address: string | null;
  logo_url: string | null;
};

type BusinessMember = {
  id: string;
  business_id: string;
  email: string;
  full_name: string | null;
  role_name: string | null;
  member_status: string | null;
  can_view_dashboard: boolean | null;
  can_manage_products: boolean | null;
  can_manage_stock: boolean | null;
  can_manage_sales: boolean | null;
  can_manage_orders: boolean | null;
  can_manage_shipments: boolean | null;
  can_manage_returns: boolean | null;
  can_manage_invoices: boolean | null;
  can_manage_customers: boolean | null;
  can_manage_integrations: boolean | null;
  can_manage_billing: boolean | null;
  can_manage_settings: boolean | null;
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

function hasPermission(context: BusinessContext | null, key: keyof BusinessMember) {
  if (!context) return false;
  if (context.isOwner) return true;
  return Boolean(context.member[key]);
}

type MemberForm = {
  email: string;
  full_name: string;
  role_name: string;
  can_view_dashboard: boolean;
  can_manage_products: boolean;
  can_manage_stock: boolean;
  can_manage_sales: boolean;
  can_manage_orders: boolean;
  can_manage_shipments: boolean;
  can_manage_returns: boolean;
  can_manage_invoices: boolean;
  can_manage_customers: boolean;
  can_manage_integrations: boolean;
  can_manage_billing: boolean;
  can_manage_settings: boolean;
};

const emptyMemberForm: MemberForm = {
  email: "",
  full_name: "",
  role_name: "Çalışan",
  can_view_dashboard: true,
  can_manage_products: false,
  can_manage_stock: false,
  can_manage_sales: false,
  can_manage_orders: false,
  can_manage_shipments: false,
  can_manage_returns: false,
  can_manage_invoices: false,
  can_manage_customers: false,
  can_manage_integrations: false,
  can_manage_billing: false,
  can_manage_settings: false,
};

const permissionItems: Array<{ key: keyof MemberForm; label: string; desc: string }> = [
  { key: "can_view_dashboard", label: "Dashboard", desc: "Ana ekranı ve özetleri görüntüleyebilir." },
  { key: "can_manage_products", label: "Ürünler", desc: "Ürün ekleme, düzenleme, silme yapabilir." },
  { key: "can_manage_stock", label: "Stok", desc: "Stok hareketlerini ve stok güncellemelerini yönetebilir." },
  { key: "can_manage_sales", label: "Satışlar", desc: "Satış kayıtlarını oluşturabilir ve güncelleyebilir." },
  { key: "can_manage_orders", label: "Siparişler", desc: "Sipariş oluşturma ve sipariş durumlarını yönetebilir." },
  { key: "can_manage_shipments", label: "Kargo", desc: "Kargo çıkışı ve teslimat durumlarını güncelleyebilir." },
  { key: "can_manage_returns", label: "İadeler", desc: "İade taleplerini oluşturabilir ve güncelleyebilir." },
  { key: "can_manage_invoices", label: "Faturalar", desc: "Fatura oluşturma, düzenleme ve ödeme durumu yönetebilir." },
  { key: "can_manage_customers", label: "Müşteriler", desc: "Müşteri kayıtlarını yönetebilir." },
  { key: "can_manage_integrations", label: "Entegrasyonlar", desc: "Pazaryeri karşılaştırmaları ve bağlantıları yönetebilir." },
  { key: "can_manage_billing", label: "Abonelik", desc: "Paket ve ödeme/abonelik ayarlarını yönetebilir." },
  { key: "can_manage_settings", label: "Ayarlar", desc: "İşletme ayarları ve ekip yetkilerini yönetebilir." },
];

function memberToForm(member: BusinessMember): MemberForm {
  return {
    email: member.email,
    full_name: member.full_name ?? "",
    role_name: member.role_name ?? "Çalışan",
    can_view_dashboard: Boolean(member.can_view_dashboard),
    can_manage_products: Boolean(member.can_manage_products),
    can_manage_stock: Boolean(member.can_manage_stock),
    can_manage_sales: Boolean(member.can_manage_sales),
    can_manage_orders: Boolean(member.can_manage_orders),
    can_manage_shipments: Boolean(member.can_manage_shipments),
    can_manage_returns: Boolean(member.can_manage_returns),
    can_manage_invoices: Boolean(member.can_manage_invoices),
    can_manage_customers: Boolean(member.can_manage_customers),
    can_manage_integrations: Boolean(member.can_manage_integrations),
    can_manage_billing: Boolean(member.can_manage_billing),
    can_manage_settings: Boolean(member.can_manage_settings),
  };
}

export default function SettingsPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [form, setForm] = useState<MemberForm>(emptyMemberForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const canManageSettings = hasPermission(context, "can_manage_settings");

  const activeMembers = useMemo(() => members.filter((member) => member.member_status !== "disabled"), [members]);
  const disabledMembers = useMemo(() => members.filter((member) => member.member_status === "disabled"), [members]);

  async function fetchData() {
    setLoading(true);
    setMessage("");

    try {
      const ctx = await ensureBusinessForCurrentUser();
      setContext(ctx);

      const { data, error } = await supabase
        .from("business_members")
        .select("*")
        .eq("business_id", ctx.business.id)
        .order("created_at", { ascending: true });

      if (error) {
        setMessage(`Ekip üyeleri alınamadı: ${error.message}`);
        return;
      }

      setMembers(data ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "İşletme bağlantısı kurulamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function resetForm() {
    setForm(emptyMemberForm);
    setEditingId(null);
  }

  function togglePermission(key: keyof MemberForm) {
    setForm((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function preset(role: "Muhasebeci" | "Çalışan" | "Operasyon" | "Tam Yetki") {
    if (role === "Muhasebeci") {
      setForm((current) => ({
        ...current,
        role_name: "Muhasebeci",
        can_view_dashboard: true,
        can_manage_products: false,
        can_manage_stock: false,
        can_manage_sales: true,
        can_manage_orders: false,
        can_manage_shipments: false,
        can_manage_returns: true,
        can_manage_invoices: true,
        can_manage_customers: true,
        can_manage_integrations: false,
        can_manage_billing: false,
        can_manage_settings: false,
      }));
    }

    if (role === "Çalışan") {
      setForm((current) => ({
        ...current,
        role_name: "Çalışan",
        can_view_dashboard: true,
        can_manage_products: true,
        can_manage_stock: true,
        can_manage_sales: false,
        can_manage_orders: true,
        can_manage_shipments: true,
        can_manage_returns: false,
        can_manage_invoices: false,
        can_manage_customers: true,
        can_manage_integrations: false,
        can_manage_billing: false,
        can_manage_settings: false,
      }));
    }

    if (role === "Operasyon") {
      setForm((current) => ({
        ...current,
        role_name: "Operasyon",
        can_view_dashboard: true,
        can_manage_products: true,
        can_manage_stock: true,
        can_manage_sales: true,
        can_manage_orders: true,
        can_manage_shipments: true,
        can_manage_returns: true,
        can_manage_invoices: false,
        can_manage_customers: true,
        can_manage_integrations: false,
        can_manage_billing: false,
        can_manage_settings: false,
      }));
    }

    if (role === "Tam Yetki") {
      setForm((current) => ({
        ...current,
        role_name: "Yönetici",
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
      }));
    }
  }

  function startEdit(member: BusinessMember) {
    if (!canManageSettings) {
      setMessage("Bu işletmede ekip yetkilerini düzenleme yetkin yok.");
      return;
    }

    if (normalizeEmail(member.email) === normalizeEmail(context?.business.owner_email)) {
      setMessage("Owner kullanıcısının yetkileri bu ekrandan kısıtlanamaz.");
      return;
    }

    setEditingId(member.id);
    setForm(memberToForm(member));
    setFormOpen(true);
  }

  async function saveMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!context) return;

    if (!canManageSettings) {
      setMessage("Bu işletmede ekip yönetimi yetkin yok.");
      return;
    }

    const email = normalizeEmail(form.email);

    if (!email) {
      setMessage("Ekip üyesi e-postası gerekli.");
      return;
    }

    if (email === normalizeEmail(context.business.owner_email) && editingId) {
      setMessage("Owner kullanıcısının yetkileri değiştirilemez.");
      return;
    }

    const payload = {
      business_id: context.business.id,
      email,
      full_name: form.full_name.trim() || null,
      role_name: form.role_name.trim() || "Çalışan",
      member_status: "active",
      can_view_dashboard: form.can_view_dashboard,
      can_manage_products: form.can_manage_products,
      can_manage_stock: form.can_manage_stock,
      can_manage_sales: form.can_manage_sales,
      can_manage_orders: form.can_manage_orders,
      can_manage_shipments: form.can_manage_shipments,
      can_manage_returns: form.can_manage_returns,
      can_manage_invoices: form.can_manage_invoices,
      can_manage_customers: form.can_manage_customers,
      can_manage_integrations: form.can_manage_integrations,
      can_manage_billing: form.can_manage_billing,
      can_manage_settings: form.can_manage_settings,
      updated_at: new Date().toISOString(),
    };

    const result = editingId
      ? await supabase.from("business_members").update(payload).eq("business_id", context.business.id).eq("id", editingId)
      : await supabase.from("business_members").upsert(payload, { onConflict: "business_id,email" });

    if (result.error) {
      setMessage(`Ekip üyesi kaydedilemedi: ${result.error.message}`);
      return;
    }

    setMessage(editingId ? "Ekip üyesi güncellendi." : "Ekip üyesi eklendi. Bu kişi /login sayfasından kayıt olup aynı e-posta ile giriş yapmalı.");
    resetForm();
    setFormOpen(false);
    await fetchData();
  }

  async function disableMember(member: BusinessMember) {
    if (!context) return;

    if (!canManageSettings) {
      setMessage("Bu işletmede ekip yönetimi yetkin yok.");
      return;
    }

    if (normalizeEmail(member.email) === normalizeEmail(context.business.owner_email)) {
      setMessage("Owner kullanıcısı devre dışı bırakılamaz.");
      return;
    }

    if (!confirm(`${member.email} devre dışı bırakılsın mı?`)) return;

    await supabase
      .from("business_members")
      .update({ member_status: "disabled", updated_at: new Date().toISOString() })
      .eq("business_id", context.business.id)
      .eq("id", member.id);

    setMessage("Ekip üyesi devre dışı bırakıldı.");
    await fetchData();
  }

  async function activateMember(member: BusinessMember) {
    if (!context) return;

    await supabase
      .from("business_members")
      .update({ member_status: "active", updated_at: new Date().toISOString() })
      .eq("business_id", context.business.id)
      .eq("id", member.id);

    setMessage("Ekip üyesi tekrar aktif edildi.");
    await fetchData();
  }

  async function deleteMember(member: BusinessMember) {
    if (!context) return;

    if (!canManageSettings) {
      setMessage("Bu işletmede ekip yönetimi yetkin yok.");
      return;
    }

    if (normalizeEmail(member.email) === normalizeEmail(context.business.owner_email)) {
      setMessage("Owner kullanıcısı silinemez.");
      return;
    }

    if (!confirm(`${member.email} tamamen silinsin mi?`)) return;

    await supabase
      .from("business_members")
      .delete()
      .eq("business_id", context.business.id)
      .eq("id", member.id);

    setMessage("Ekip üyesi silindi.");
    await fetchData();
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Team / Permissions v1
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Ayarlar & Ekip</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              İşletme sahibi ekip üyesi ekleyebilir ve sayfa bazlı yetkilerini belirleyebilir.
            </p>
          </div>

          <button
            onClick={() => {
              if (!canManageSettings) {
                setMessage("Bu işletmede ekip ekleme yetkin yok.");
                return;
              }
              resetForm();
              setFormOpen((value) => !value);
            }}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500"
          >
            {formOpen ? "Formu Kapat" : "Ekip Üyesi Ekle"}
          </button>
        </div>
      </div>

      {context ? (
        <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Aktif İşletme</p>
              <p className="mt-1 text-lg font-black">{context.business.name}</p>
              <p className="mt-1 text-xs text-slate-500">Giriş yapan: {context.userEmail} · Rol: {context.member.role_name || "-"}</p>
            </div>
            <div className={`rounded-2xl px-4 py-3 text-sm font-black ring-1 ${
              canManageSettings ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20" : "bg-red-400/10 text-red-300 ring-red-400/20"
            }`}>
              {canManageSettings ? "Ekip yönetimi açık" : "Ekip yönetimi kapalı"}
            </div>
          </div>
        </div>
      ) : null}

      {message ? (
        <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Aktif Üye" value={String(activeMembers.length)} valueClass="text-white" />
        <Metric label="Pasif Üye" value={String(disabledMembers.length)} valueClass="text-amber-300" />
        <Metric label="Owner" value={context?.business.owner_email || "-"} valueClass="text-blue-300 text-base" />
        <Metric label="Plan" value={context?.isPro ? "Pro" : "Free"} valueClass={context?.isPro ? "text-emerald-300" : "text-blue-300"} />
      </div>

      {formOpen ? (
        <form onSubmit={saveMember} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-5">
            <h2 className="text-2xl font-black">{editingId ? "Ekip Üyesini Düzenle" : "Ekip Üyesi Ekle"}</h2>
            <p className="mt-1 text-sm text-slate-400">
              Şifreyi owner belirlemez. Eklenen kişi aynı e-posta ile /login sayfasından kayıt olur veya şifre sıfırlama kullanır.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Field label="E-posta">
              <input value={form.email} disabled={Boolean(editingId)} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none disabled:opacity-50" />
            </Field>
            <Field label="Ad Soyad">
              <input value={form.full_name} onChange={(e) => setForm((c) => ({ ...c, full_name: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>
            <Field label="Rol Adı">
              <input value={form.role_name} onChange={(e) => setForm((c) => ({ ...c, role_name: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => preset("Muhasebeci")} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-slate-200">Muhasebeci</button>
            <button type="button" onClick={() => preset("Çalışan")} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-slate-200">Çalışan</button>
            <button type="button" onClick={() => preset("Operasyon")} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-slate-200">Operasyon</button>
            <button type="button" onClick={() => preset("Tam Yetki")} className="rounded-xl bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">Tam Yetki</button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {permissionItems.map((item) => (
              <button
                key={String(item.key)}
                type="button"
                onClick={() => togglePermission(item.key)}
                className={`rounded-[18px] border p-4 text-left transition hover:-translate-y-0.5 ${
                  form[item.key] ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-[#0b1220]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{item.desc}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-black ${
                    form[item.key] ? "bg-blue-500 text-white" : "bg-white/10 text-slate-400"
                  }`}>
                    {form[item.key] ? "Açık" : "Kapalı"}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">
              {editingId ? "Yetkileri Güncelle" : "Ekip Üyesini Kaydet"}
            </button>
            <button type="button" onClick={() => { resetForm(); setFormOpen(false); }} className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-slate-200">
              Vazgeç
            </button>
          </div>
        </form>
      ) : null}

      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <h2 className="text-2xl font-black">Ekip Üyeleri</h2>
        <p className="mt-1 text-sm text-slate-400">
          Buraya eklenen kişi aynı e-posta ile kayıt olduğunda bu işletmeye bağlı çalışır.
        </p>

        {loading ? (
          <div className="mt-5 grid gap-3">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-[24px] bg-white/5" />)}</div>
        ) : members.length === 0 ? (
          <div className="mt-5 rounded-[24px] border border-dashed border-white/10 bg-[#0b1220] p-10 text-center">
            <h3 className="text-xl font-black">Ekip üyesi yok</h3>
            <p className="mt-2 text-sm text-slate-500">İlk ekip üyesini eklediğinde burada gözükecek.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {members.map((member) => {
              const isOwner = normalizeEmail(member.email) === normalizeEmail(context?.business.owner_email);
              const enabledCount = permissionItems.filter((item) => Boolean(member[item.key as keyof BusinessMember])).length;

              return (
                <div key={member.id} className={`rounded-[22px] border p-4 transition hover:bg-[#101a31] ${
                  member.member_status === "disabled" ? "border-red-500/20 bg-red-500/5" : "border-white/10 bg-[#0b1220]"
                }`}>
                  <div className="grid gap-4 xl:grid-cols-[1fr_0.7fr_0.8fr_auto] xl:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black">{member.full_name || member.email}</h3>
                        {isOwner ? <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-black text-white">Owner</span> : null}
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${
                          member.member_status === "disabled" ? "bg-red-400/15 text-red-300" : "bg-emerald-400/15 text-emerald-300"
                        }`}>
                          {member.member_status === "disabled" ? "Pasif" : "Aktif"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">{member.email}</p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Rol</p>
                      <p className="mt-1 text-sm font-black">{member.role_name || "Çalışan"}</p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Yetki</p>
                      <p className="mt-1 text-sm font-black text-blue-300">{isOwner ? "Tüm yetkiler" : `${enabledCount} alan açık`}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      {!isOwner ? (
                        <>
                          <button onClick={() => startEdit(member)} className="rounded-xl bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">Düzenle</button>
                          {member.member_status === "disabled" ? (
                            <button onClick={() => activateMember(member)} className="rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-black text-emerald-300">Aktif Et</button>
                          ) : (
                            <button onClick={() => disableMember(member)} className="rounded-xl bg-amber-500/15 px-3 py-2 text-xs font-black text-amber-300">Pasif Yap</button>
                          )}
                          <button onClick={() => deleteMember(member)} className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-black text-red-300">Sil</button>
                        </>
                      ) : (
                        <span className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-slate-300">Korunuyor</span>
                      )}
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
