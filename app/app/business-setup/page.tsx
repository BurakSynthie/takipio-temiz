"use client";

import { useEffect, useState } from "react";
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

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

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

  await supabase
    .from("app_user_profiles")
    .upsert(
      {
        email: userEmail,
        business_id: createdBusiness.id,
        role_name: "Sahip",
      },
      {
        onConflict: "email",
      }
    );

  return {
    userEmail,
    business: createdBusiness,
    member: ownerMember,
    subscription,
    isOwner: true,
    isPro: false,
  } satisfies BusinessContext;
}

export default function BusinessSetupPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    website: "",
    tax_office: "",
    tax_number: "",
    address: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadBusiness() {
    try {
      setLoading(true);
      const ctx = await ensureBusinessForCurrentUser();

      setContext(ctx);
      setForm({
        name: ctx.business.name ?? "",
        phone: ctx.business.phone ?? "",
        email: ctx.business.email ?? "",
        website: ctx.business.website ?? "",
        tax_office: ctx.business.tax_office ?? "",
        tax_number: ctx.business.tax_number ?? "",
        address: ctx.business.address ?? "",
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "İşletme bilgisi alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBusiness();
  }, []);

  async function saveBusiness(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!context) return;

    const { error } = await supabase
      .from("businesses")
      .update({
        name: form.name.trim() || "İşletmem",
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        website: form.website.trim() || null,
        tax_office: form.tax_office.trim() || null,
        tax_number: form.tax_number.trim() || null,
        address: form.address.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", context.business.id);

    if (error) {
      setMessage(`Kaydedilemedi: ${error.message}`);
      return;
    }

    setMessage("İşletme bilgileri kaydedildi.");
    await loadBusiness();
  }

  return (
    <section className="mx-auto w-full max-w-[1100px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div>
          <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
            Business Core
          </div>
          <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">
            İşletme Kurulumu
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Takipio verileri artık işletme hesabına bağlanacak. Web ve mobil aynı işletme üzerinden çalışacak.
          </p>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-8 text-center text-sm text-slate-400">
          İşletme bilgileri hazırlanıyor...
        </div>
      ) : !context ? (
        <div className="rounded-[26px] border border-red-500/20 bg-red-500/10 p-8 text-center text-sm text-red-200">
          İşletme bağlantısı kurulamadı.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
          <form onSubmit={saveBusiness} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
            <h2 className="text-2xl font-black">İşletme Bilgileri</h2>
            <p className="mt-1 text-sm text-slate-400">
              Bu bilgiler ileride fatura, mobil uygulama, ödeme ve pazaryeri entegrasyonlarında kullanılacak.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Field label="İşletme Adı">
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
              </Field>

              <Field label="E-posta">
                <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
              </Field>

              <Field label="Telefon">
                <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
              </Field>

              <Field label="Web Sitesi">
                <input value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
              </Field>

              <Field label="Vergi Dairesi">
                <input value={form.tax_office} onChange={(event) => setForm((current) => ({ ...current, tax_office: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
              </Field>

              <Field label="Vergi No">
                <input value={form.tax_number} onChange={(event) => setForm((current) => ({ ...current, tax_number: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
              </Field>

              <div className="md:col-span-2">
                <Field label="Adres">
                  <textarea value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} className="min-h-28 w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
                </Field>
              </div>
            </div>

            <button className="mt-5 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">
              İşletmeyi Kaydet
            </button>
          </form>

          <div className="space-y-4">
            <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
              <h2 className="text-2xl font-black">Aktif İşletme</h2>
              <div className="mt-5 space-y-3">
                <Info label="İşletme ID" value={context.business.id} />
                <Info label="Owner" value={context.business.owner_email || "-"} />
                <Info label="Rol" value={context.member.role_name || "-"} />
                <Info label="Plan" value={context.subscription?.plan === "pro" ? "Pro" : "Free"} />
              </div>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
              <h2 className="text-2xl font-black">Sıradaki Bağlantı</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Bundan sonra ürün, sipariş, kargo, iade, ödeme ve fatura kayıtları bu işletme ID’siyle filtrelenecek.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#0b1220] p-4 ring-1 ring-white/10">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 break-all text-sm font-black text-slate-200">{value}</p>
    </div>
  );
}
