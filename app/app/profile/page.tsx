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

type Profile = {
  id?: string;
  business_id?: string | null;
  email: string;
  full_name: string | null;
  role_name: string | null;
  phone: string | null;
  avatar_url: string | null;
};

type ProfileForm = {
  full_name: string;
  phone: string;
  avatar_url: string;
};

export default function ProfilePage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    full_name: "",
    phone: "",
    avatar_url: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    setMessage("");

    try {
      const ctx = await ensureBusinessForCurrentUser();
      setContext(ctx);

      const { data } = await supabase
        .from("app_user_profiles")
        .select("*")
        .eq("email", ctx.userEmail)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setForm({
          full_name: data.full_name ?? ctx.member.full_name ?? "",
          phone: data.phone ?? "",
          avatar_url: data.avatar_url ?? "",
        });
      } else {
        const payload = {
          email: ctx.userEmail,
          business_id: ctx.business.id,
          full_name: ctx.member.full_name ?? null,
          role_name: ctx.member.role_name ?? null,
          phone: null,
          avatar_url: null,
        };

        const { data: created } = await supabase
          .from("app_user_profiles")
          .insert(payload)
          .select("*")
          .single();

        setProfile(created);
        setForm({
          full_name: created?.full_name ?? "",
          phone: created?.phone ?? "",
          avatar_url: created?.avatar_url ?? "",
        });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profil bilgisi alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!context) return;

    const payload = {
      email: context.userEmail,
      business_id: context.business.id,
      full_name: form.full_name.trim() || null,
      phone: form.phone.trim() || null,
      avatar_url: form.avatar_url.trim() || null,
      role_name: context.member.role_name ?? null,
    };

    const { error } = await supabase
      .from("app_user_profiles")
      .upsert(payload, { onConflict: "email" });

    if (error) {
      setMessage(`Profil güncellenemedi: ${error.message}`);
      return;
    }

    await supabase
      .from("business_members")
      .update({
        full_name: form.full_name.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("business_id", context.business.id)
      .eq("email", context.userEmail);

    setMessage("Profil bilgileri güncellendi.");
    await fetchData();
  }

  async function signOut() {
    try {
      await supabase.auth.signOut({ scope: "local" });

      window.localStorage.removeItem("takipio-auth-session");

      Object.keys(window.localStorage).forEach((key) => {
        if (key.startsWith("sb-")) {
          window.localStorage.removeItem(key);
        }
      });

      window.location.replace("/login");
    } catch (error) {
      console.error("Çıkış yapılamadı:", error);
      window.location.replace("/login");
    }
  }

  return (
    <section className="mx-auto w-full max-w-[1100px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              User Profile v1
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Kullanıcı Profili</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Kullanıcı bilgilerin, rolün ve aktif işletme bağlantın burada görünür.
            </p>
          </div>

          <button onClick={signOut} className="rounded-2xl bg-red-500/15 px-5 py-3 text-sm font-black text-red-300 ring-1 ring-red-400/20">
            Çıkış Yap
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-8 text-center text-sm text-slate-400">
          Profil hazırlanıyor...
        </div>
      ) : !context ? (
        <div className="rounded-[26px] border border-red-500/20 bg-red-500/10 p-8 text-center text-sm text-red-200">
          Profil bağlantısı kurulamadı.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[32px] bg-[#0b1220] ring-1 ring-white/10">
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="Profil" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-blue-300">
                    {(form.full_name || context.userEmail).slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>

              <h2 className="mt-4 text-2xl font-black">{form.full_name || context.userEmail}</h2>
              <p className="mt-1 text-sm text-slate-400">{context.userEmail}</p>

              <div className="mt-5 grid w-full gap-3">
                <Info label="Aktif İşletme" value={context.business.name} />
                <Info label="Rol" value={context.member.role_name || "-"} />
                <Info label="Plan" value={context.isPro ? "Takipio Pro" : "Free"} />
                <Info label="Yetki" value={context.isOwner ? "Owner / Tüm Yetkiler" : "Yetkili Kullanıcı"} />
              </div>
            </div>
          </div>

          <form onSubmit={saveProfile} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
            <h2 className="text-2xl font-black">Profil Bilgileri</h2>
            <p className="mt-1 text-sm text-slate-400">
              Şimdilik profil fotoğrafı URL ile çalışır. Bir sonraki dosya yükleme paketinde bilgisayardan fotoğraf yükleme ekleyeceğiz.
            </p>

            <div className="mt-5 grid gap-3">
              <Field label="Ad Soyad">
                <input value={form.full_name} onChange={(e) => setForm((c) => ({ ...c, full_name: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
              </Field>

              <Field label="Telefon">
                <input value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
              </Field>

              <Field label="Profil Fotoğrafı URL">
                <input value={form.avatar_url} onChange={(e) => setForm((c) => ({ ...c, avatar_url: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
              </Field>
            </div>

            <button className="mt-5 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">
              Profili Kaydet
            </button>

            <div className="mt-5 rounded-2xl bg-[#0b1220] p-4 ring-1 ring-white/10">
              <p className="text-sm font-black">Ekip üyesi girişi nasıl olur?</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Owner ayarlardan ekip üyesinin e-postasını ekler. O kişi aynı e-posta ile /login sayfasından kayıt olur veya şifre sıfırlama kullanır. Sistem e-postayı business_members tablosunda bulup doğru işletmeye bağlar.
              </p>
            </div>
          </form>
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
    <div className="rounded-2xl bg-[#0b1220] p-4 text-left ring-1 ring-white/10">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 break-all text-sm font-black text-slate-200">{value}</p>
    </div>
  );
}
