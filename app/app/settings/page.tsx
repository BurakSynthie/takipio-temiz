"use client";

import Link from "next/link";
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
  logo_url: string | null;
  brand_color: string | null;
  phone: string | null;
  website: string | null;
  tax_id: string | null;
  tax_office: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  default_currency: string | null;
  default_tax_rate: number | null;
  updated_at: string | null;
};

type Member = {
  id: string;
  business_id: string;
  email: string;
  display_name: string | null;
  invited_by: string | null;
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
  created_at: string | null;
  updated_at: string | null;
};

type Invite = {
  id: string;
  business_id: string;
  email: string;
  display_name: string | null;
  role_name: string | null;
  token: string | null;
  status: string | null;
  invited_by: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  expires_at: string | null;
  created_at: string | null;
};

type BusinessContext = {
  userEmail: string;
  business: Business;
  member: Member;
  isOwner: boolean;
};

const permissionFields = [
  { key: "can_view_dashboard", label: "Dashboard", desc: "Genel paneli görebilir" },
  { key: "can_manage_products", label: "Ürünler", desc: "Ürün kartlarını yönetir" },
  { key: "can_manage_stock", label: "Stok", desc: "Stok giriş/çıkış yapar" },
  { key: "can_manage_sales", label: "Satış", desc: "Satış/tahsilat kayıtlarını yönetir" },
  { key: "can_manage_orders", label: "Sipariş", desc: "Sipariş oluşturur ve düzenler" },
  { key: "can_manage_shipments", label: "Kargo", desc: "Kargo durumlarını yönetir" },
  { key: "can_manage_returns", label: "İade", desc: "İade süreçlerini yönetir" },
  { key: "can_manage_invoices", label: "Fatura", desc: "Belge/fatura merkezini yönetir" },
  { key: "can_manage_customers", label: "Müşteri", desc: "CRM müşteri kayıtlarını yönetir" },
  { key: "can_manage_integrations", label: "Entegrasyon", desc: "Pazaryeri/API bilgilerini yönetir" },
  { key: "can_manage_billing", label: "Abonelik", desc: "Plan ve ödeme sayfasına erişir" },
  { key: "can_manage_settings", label: "Ayarlar", desc: "İşletme ve ekip ayarlarını yönetir" },
] as const;

type PermissionKey = typeof permissionFields[number]["key"];

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

function clean(value: string | null | undefined) {
  return (value ?? "").trim();
}

async function getCurrentUserEmail() {
  const sessionResult = await supabase.auth.getSession();
  const sessionEmail = normalizeEmail(sessionResult.data.session?.user?.email);
  if (sessionEmail) return sessionEmail;

  const { data } = await supabase.auth.getUser();
  return normalizeEmail(data.user?.email);
}

function permissionsForRole(role: string) {
  const base: Record<PermissionKey, boolean> = {
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

  if (role === "Sahip") {
    return Object.fromEntries(permissionFields.map((field) => [field.key, true])) as Record<PermissionKey, boolean>;
  }

  if (role === "Muhasebe") {
    return {
      ...base,
      can_manage_sales: true,
      can_manage_orders: true,
      can_manage_invoices: true,
      can_manage_customers: true,
      can_manage_billing: true,
    };
  }

  if (role === "Depo") {
    return {
      ...base,
      can_manage_products: true,
      can_manage_stock: true,
      can_manage_shipments: true,
      can_manage_returns: true,
    };
  }

  if (role === "Satış") {
    return {
      ...base,
      can_manage_sales: true,
      can_manage_orders: true,
      can_manage_customers: true,
    };
  }

  return base;
}

async function ensureOwnerMember(businessId: string, userEmail: string) {
  const fullOwner = {
    role_name: "Sahip",
    member_status: "active",
    ...permissionsForRole("Sahip"),
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("business_members")
    .select("*")
    .eq("business_id", businessId)
    .eq("email", userEmail)
    .maybeSingle();

  if (existing) {
    const { data } = await supabase
      .from("business_members")
      .update(fullOwner)
      .eq("business_id", businessId)
      .eq("email", userEmail)
      .select("*")
      .single();

    return (data || { ...existing, ...fullOwner }) as Member;
  }

  const { data, error } = await supabase
    .from("business_members")
    .insert({
      business_id: businessId,
      email: userEmail,
      display_name: "Sahip",
      invited_by: userEmail,
      ...fullOwner,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(`Sahip yetkisi oluşturulamadı: ${error?.message ?? "Bilinmeyen hata"}`);

  return data as Member;
}

async function ensureBusinessForCurrentUser() {
  const userEmail = await getCurrentUserEmail();
  if (!userEmail) throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yap.");

  const ownedBusiness = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_email", userEmail)
    .limit(1)
    .maybeSingle();

  if (ownedBusiness.data) {
    const ownerMember = await ensureOwnerMember(ownedBusiness.data.id, userEmail);
    return { userEmail, business: ownedBusiness.data as Business, member: ownerMember, isOwner: true } satisfies BusinessContext;
  }

  const memberResult = await supabase
    .from("business_members")
    .select("*")
    .eq("email", userEmail)
    .eq("member_status", "active")
    .limit(1)
    .maybeSingle();

  if (memberResult.data?.business_id) {
    const { data: business, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", memberResult.data.business_id)
      .single();

    if (error || !business) throw new Error("İşletme bilgisi alınamadı.");

    return {
      userEmail,
      business: business as Business,
      member: memberResult.data as Member,
      isOwner: normalizeEmail(business.owner_email) === userEmail,
    } satisfies BusinessContext;
  }

  const { data: createdBusiness, error } = await supabase
    .from("businesses")
    .insert({
      owner_email: userEmail,
      name: "İşletmem",
      email: userEmail,
      default_currency: "TRY",
      default_tax_rate: 20,
    })
    .select("*")
    .single();

  if (error || !createdBusiness) throw new Error(`İşletme oluşturulamadı: ${error?.message ?? "Bilinmeyen hata"}`);

  const ownerMember = await ensureOwnerMember(createdBusiness.id, userEmail);

  return { userEmail, business: createdBusiness as Business, member: ownerMember, isOwner: true } satisfies BusinessContext;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function statusLabel(status: string | null | undefined) {
  if (status === "active") return "Aktif";
  if (status === "pending") return "Bekliyor";
  if (status === "sent") return "Gönderildi";
  if (status === "accepted") return "Kabul edildi";
  if (status === "disabled") return "Pasif";
  return "Aktif";
}

function statusClass(status: string | null | undefined) {
  if (status === "disabled") return "bg-red-500/15 text-red-300 ring-red-400/20";
  if (status === "pending" || status === "sent") return "bg-amber-500/15 text-amber-300 ring-amber-400/20";
  return "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20";
}

function roleClass(role: string | null | undefined) {
  if (role === "Sahip") return "bg-blue-500/15 text-blue-300 ring-blue-400/20";
  if (role === "Muhasebe") return "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20";
  if (role === "Depo") return "bg-cyan-500/15 text-cyan-300 ring-cyan-400/20";
  if (role === "Satış") return "bg-purple-500/15 text-purple-300 ring-purple-400/20";
  return "bg-slate-500/15 text-slate-300 ring-white/10";
}

export default function SettingsPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [businessForm, setBusinessForm] = useState({
    name: "",
    email: "",
    logo_url: "",
    brand_color: "#2563eb",
    phone: "",
    website: "",
    tax_id: "",
    tax_office: "",
    address: "",
    city: "",
    district: "",
    default_currency: "TRY",
    default_tax_rate: "20",
  });
  const [memberForm, setMemberForm] = useState({ display_name: "", email: "", role_name: "Satış" });
  const [customPermissions, setCustomPermissions] = useState<Record<PermissionKey, boolean>>(permissionsForRole("Satış"));
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canManageSettings = Boolean(context?.isOwner || context?.member.can_manage_settings || context?.member.role_name === "Sahip");

  async function fetchData() {
    setLoading(true);
    setMessage("");

    try {
      const ctx = await ensureBusinessForCurrentUser();
      setContext(ctx);

      setBusinessForm({
        name: ctx.business.name || "",
        email: ctx.business.email || "",
        logo_url: ctx.business.logo_url || "",
        brand_color: ctx.business.brand_color || "#2563eb",
        phone: ctx.business.phone || "",
        website: ctx.business.website || "",
        tax_id: ctx.business.tax_id || "",
        tax_office: ctx.business.tax_office || "",
        address: ctx.business.address || "",
        city: ctx.business.city || "",
        district: ctx.business.district || "",
        default_currency: ctx.business.default_currency || "TRY",
        default_tax_rate: String(ctx.business.default_tax_rate ?? 20),
      });

      const [membersResult, invitesResult] = await Promise.all([
        supabase.from("business_members").select("*").eq("business_id", ctx.business.id).order("created_at", { ascending: true }),
        supabase.from("team_invites").select("*").eq("business_id", ctx.business.id).order("created_at", { ascending: false }),
      ]);

      if (membersResult.error) {
        setMessage(`Ekip üyeleri alınamadı: ${membersResult.error.message}`);
        return;
      }

      if (invitesResult.error) {
        setMessage(`Davetler alınamadı: ${invitesResult.error.message}`);
        return;
      }

      setMembers((membersResult.data ?? []) as Member[]);
      setInvites((invitesResult.data ?? []) as Invite[]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ayarlar alınamadı.";

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
    setCustomPermissions(permissionsForRole(memberForm.role_name));
  }, [memberForm.role_name]);

  async function handleLogoFile(file: File | null) {
    if (!file) return;

    if (file.size > 700_000) {
      setMessage("Logo dosyası çok büyük. Şimdilik 700KB altı PNG/JPG/SVG kullan.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setBusinessForm((current) => ({ ...current, logo_url: result }));
      setMessage("Logo yüklendi. Kalıcı olması için İşletme Profilini Kaydet butonuna bas.");
    };
    reader.readAsDataURL(file);
  }

  async function saveBusinessProfile() {
    if (!context) return;

    if (!canManageSettings) {
      setMessage("Bu işletmede ayar yönetimi yetkin yok.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("businesses")
      .update({
        name: clean(businessForm.name) || "İşletmem",
        email: normalizeEmail(businessForm.email) || null,
        logo_url: clean(businessForm.logo_url) || null,
        brand_color: clean(businessForm.brand_color) || "#2563eb",
        phone: clean(businessForm.phone) || null,
        website: clean(businessForm.website) || null,
        tax_id: clean(businessForm.tax_id) || null,
        tax_office: clean(businessForm.tax_office) || null,
        address: clean(businessForm.address) || null,
        city: clean(businessForm.city) || null,
        district: clean(businessForm.district) || null,
        default_currency: clean(businessForm.default_currency) || "TRY",
        default_tax_rate: Number(businessForm.default_tax_rate || 20),
        updated_at: new Date().toISOString(),
      })
      .eq("id", context.business.id);

    if (error) {
      setMessage(`İşletme ayarları kaydedilemedi: ${error.message}`);
      setSaving(false);
      return;
    }

    setSaving(false);
    setMessage("İşletme profili kaydedildi.");
    await fetchData();
  }

  async function addMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!context) return;

    if (!canManageSettings) {
      setMessage("Bu işletmede ekip yönetimi yetkin yok.");
      return;
    }

    const email = normalizeEmail(memberForm.email);

    if (!email) {
      setMessage("Ekip üyesi için e-posta zorunlu.");
      return;
    }

    if (members.some((member) => normalizeEmail(member.email) === email)) {
      setMessage("Bu e-posta zaten ekipte görünüyor.");
      return;
    }

    const permissions = customPermissions;
    setSaving(true);

    const memberResult = await supabase
      .from("business_members")
      .insert({
        business_id: context.business.id,
        email,
        display_name: clean(memberForm.display_name) || null,
        invited_by: context.userEmail,
        role_name: memberForm.role_name,
        member_status: "active",
        ...permissions,
      })
      .select("*")
      .single();

    if (memberResult.error) {
      setMessage(`Ekip üyesi eklenemedi: ${memberResult.error.message}`);
      setSaving(false);
      return;
    }

    const inviteResult = await supabase
      .from("team_invites")
      .insert({
        business_id: context.business.id,
        email,
        display_name: clean(memberForm.display_name) || null,
        role_name: memberForm.role_name,
        invited_by: context.userEmail,
        status: "pending",
        ...permissions,
      })
      .select("*")
      .single();

    if (!inviteResult.error && inviteResult.data) {
      await supabase.from("notifications").insert({
        business_id: context.business.id,
        created_by: context.userEmail,
        target_email: email,
        title: "Takipio ekip daveti",
        message: `${context.business.name} işletmesine ${memberForm.role_name} rolüyle eklendin.`,
        type: "invite",
        href: "/app",
      });

      const session = await supabase.auth.getSession();
      await fetch("/api/team-invites/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.data.session?.access_token || ""}`,
        },
        body: JSON.stringify({
          email,
          displayName: clean(memberForm.display_name),
          businessName: context.business.name,
          roleName: memberForm.role_name,
          token: inviteResult.data.token,
        }),
      }).catch(() => null);
    }

    setSaving(false);
    setMemberForm({ display_name: "", email: "", role_name: "Satış" });
    setMessage("Ekip üyesi eklendi. Mail servisi bağlıysa davet maili de gönderilir.");
    await fetchData();
  }

  async function resendInvite(invite: Invite) {
    if (!context) return;

    const session = await supabase.auth.getSession();

    await fetch("/api/team-invites/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.data.session?.access_token || ""}`,
      },
      body: JSON.stringify({
        email: invite.email,
        displayName: invite.display_name || "",
        businessName: context.business.name,
        roleName: invite.role_name || "Personel",
        token: invite.token,
      }),
    });

    await supabase
      .from("team_invites")
      .update({ status: "sent", sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", invite.id)
      .eq("business_id", context.business.id);

    setMessage("Davet tekrar gönderildi / gönderim kuyruğuna alındı.");
    await fetchData();
  }

  async function updateMember(member: Member, patch: Partial<Member>) {
    if (!context) return;

    if (!canManageSettings) {
      setMessage("Bu işletmede ekip yönetimi yetkin yok.");
      return;
    }

    if (member.role_name === "Sahip" && member.email === context.userEmail && patch.member_status === "disabled") {
      setMessage("Kendi sahip hesabını pasife alamazsın.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("business_members")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("business_id", context.business.id)
      .eq("id", member.id);

    if (error) {
      setMessage(`Ekip üyesi güncellenemedi: ${error.message}`);
      setSaving(false);
      return;
    }

    setSaving(false);
    setMessage("Ekip üyesi güncellendi.");
    await fetchData();

    if (selectedMember?.id === member.id) {
      setSelectedMember((current) => (current ? { ...current, ...patch } : current));
    }
  }

  async function changeRole(member: Member, role: string) {
    const rolePermissions = role === "Özel" ? {} : permissionsForRole(role);
    await updateMember(member, { role_name: role, ...rolePermissions } as Partial<Member>);
  }

  async function deleteMember(member: Member) {
    if (!context) return;

    if (!canManageSettings) {
      setMessage("Bu işletmede ekip yönetimi yetkin yok.");
      return;
    }

    if (member.email === context.userEmail) {
      setMessage("Kendi hesabını silemezsin.");
      return;
    }

    if (!confirm(`${member.email} ekipten tamamen silinsin mi?`)) return;

    const { error } = await supabase
      .from("business_members")
      .delete()
      .eq("business_id", context.business.id)
      .eq("id", member.id);

    if (error) {
      setMessage(`Ekip üyesi silinemedi: ${error.message}`);
      return;
    }

    setMessage("Ekip üyesi silindi.");
    setSelectedMember(null);
    await fetchData();
  }

  const stats = useMemo(() => {
    return {
      total: members.length,
      active: members.filter((member) => member.member_status === "active").length,
      disabled: members.filter((member) => member.member_status === "disabled").length,
      invites: invites.filter((invite) => invite.status === "pending" || invite.status === "sent").length,
    };
  }, [members, invites]);

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Settings Center v20.1
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Ayarlar</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              İşletme profili, logo, ekip davetleri ve modül yetkilerini tek merkezden yönet.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/app/reports" className="rounded-2xl bg-purple-500/15 px-5 py-3 text-sm font-black text-purple-300 ring-1 ring-purple-400/20">
              Raporlar
            </Link>
            <Link href="/app/notifications" className="rounded-2xl bg-amber-500/15 px-5 py-3 text-sm font-black text-amber-300 ring-1 ring-amber-400/20">
              Bildirimler
            </Link>
            <button onClick={fetchData} className="rounded-2xl bg-white/8 px-5 py-3 text-sm font-black text-slate-200 ring-1 ring-white/10">
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

      {!canManageSettings ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-100">
          Bu sayfayı görüntüleyebilirsin ama değişiklik yapmak için Ayarlar yetkin yok.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Toplam Üye" value={loading ? "..." : String(stats.total)} />
        <Metric label="Aktif Üye" value={loading ? "..." : String(stats.active)} valueClass="text-emerald-300" />
        <Metric label="Pasif Üye" value={loading ? "..." : String(stats.disabled)} valueClass="text-red-300" />
        <Metric label="Bekleyen Davet" value={loading ? "..." : String(stats.invites)} valueClass="text-amber-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">İşletme Profili</h2>
              <p className="mt-1 text-sm text-slate-400">Bu bilgiler fatura, rapor ve müşteri çıktılarında kullanılabilir.</p>
            </div>

            {businessForm.logo_url ? (
              <img src={businessForm.logo_url} alt="Logo" className="h-16 w-16 rounded-2xl bg-white object-contain p-2" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/15 text-xl font-black text-blue-300">
                {businessForm.name?.slice(0, 1) || "T"}
              </div>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Field label="İşletme Adı"><input value={businessForm.name} onChange={(e) => setBusinessForm((c) => ({ ...c, name: e.target.value }))} className="input" /></Field>
            <Field label="E-posta"><input value={businessForm.email} onChange={(e) => setBusinessForm((c) => ({ ...c, email: e.target.value }))} className="input" /></Field>
            <Field label="Telefon"><input value={businessForm.phone} onChange={(e) => setBusinessForm((c) => ({ ...c, phone: e.target.value }))} className="input" /></Field>
            <Field label="Web Sitesi"><input value={businessForm.website} onChange={(e) => setBusinessForm((c) => ({ ...c, website: e.target.value }))} className="input" /></Field>
            <Field label="Logo URL"><input value={businessForm.logo_url} onChange={(e) => setBusinessForm((c) => ({ ...c, logo_url: e.target.value }))} className="input" /></Field>
            <Field label="Bilgisayardan Logo Yükle"><input type="file" accept="image/*" onChange={(e) => handleLogoFile(e.target.files?.[0] || null)} className="input" /></Field>
            <Field label="Marka Rengi"><input value={businessForm.brand_color} onChange={(e) => setBusinessForm((c) => ({ ...c, brand_color: e.target.value }))} className="input" /></Field>
            <Field label="VKN / TCKN"><input value={businessForm.tax_id} onChange={(e) => setBusinessForm((c) => ({ ...c, tax_id: e.target.value }))} className="input" /></Field>
            <Field label="Vergi Dairesi"><input value={businessForm.tax_office} onChange={(e) => setBusinessForm((c) => ({ ...c, tax_office: e.target.value }))} className="input" /></Field>
            <Field label="Para Birimi">
              <select value={businessForm.default_currency} onChange={(e) => setBusinessForm((c) => ({ ...c, default_currency: e.target.value }))} className="input">
                <option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
              </select>
            </Field>
            <Field label="Varsayılan KDV %"><input type="number" value={businessForm.default_tax_rate} onChange={(e) => setBusinessForm((c) => ({ ...c, default_tax_rate: e.target.value }))} className="input" /></Field>
            <Field label="İlçe"><input value={businessForm.district} onChange={(e) => setBusinessForm((c) => ({ ...c, district: e.target.value }))} className="input" /></Field>
            <Field label="İl"><input value={businessForm.city} onChange={(e) => setBusinessForm((c) => ({ ...c, city: e.target.value }))} className="input" /></Field>
            <label className="md:col-span-2 xl:col-span-2"><span className="label">Adres</span><input value={businessForm.address} onChange={(e) => setBusinessForm((c) => ({ ...c, address: e.target.value }))} className="input" /></label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={saveBusinessProfile} disabled={saving || !canManageSettings} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
              {saving ? "Kaydediliyor..." : "İşletme Profilini Kaydet"}
            </button>
            <Link href="/app/invoices" className="rounded-2xl bg-white/8 px-5 py-3 text-sm font-black text-slate-300 ring-1 ring-white/10">
              Fatura Modülüne Git
            </Link>
          </div>
        </div>

        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-5">
            <h2 className="text-2xl font-black">Yeni Ekip Üyesi</h2>
            <p className="mt-1 text-sm text-slate-400">Üye eklenir, davet kaydı oluşur, mail servisi bağlıysa davet maili gönderilir.</p>
          </div>

          <form onSubmit={addMember} className="grid gap-3">
            <Field label="Ad Soyad / Görünen Ad"><input value={memberForm.display_name} onChange={(e) => setMemberForm((c) => ({ ...c, display_name: e.target.value }))} className="input" /></Field>
            <Field label="E-posta"><input value={memberForm.email} onChange={(e) => setMemberForm((c) => ({ ...c, email: e.target.value }))} className="input" /></Field>
            <Field label="Rol">
              <select value={memberForm.role_name} onChange={(e) => setMemberForm((c) => ({ ...c, role_name: e.target.value }))} className="input">
                <option value="Satış">Satış</option><option value="Muhasebe">Muhasebe</option><option value="Depo">Depo</option><option value="Özel">Özel</option>
              </select>
            </Field>

            <div className="rounded-[22px] border border-white/10 bg-[#0b1220] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-white">Rol Yetkileri</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {memberForm.role_name} rolü için varsayılan yetkiler aşağıda. İstersen ekstra aç/kapat yapabilirsin.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomPermissions(permissionsForRole(memberForm.role_name))}
                  className="rounded-xl bg-white/8 px-3 py-2 text-[11px] font-black text-slate-300 ring-1 ring-white/10"
                >
                  Varsayılana Dön
                </button>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {permissionFields.map((field) => (
                  <button
                    key={field.key}
                    type="button"
                    onClick={() => setCustomPermissions((current) => ({ ...current, [field.key]: !current[field.key] }))}
                    className={`rounded-2xl px-3 py-2 text-left text-xs font-black ring-1 ${
                      customPermissions[field.key] ? "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20" : "bg-white/5 text-slate-400 ring-white/10"
                    }`}
                  >
                    <span className="block">{field.label}</span>
                    <span className="mt-1 block text-[10px] font-bold opacity-70">{field.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button disabled={saving || !canManageSettings || !memberForm.email.trim()} className="rounded-2xl bg-emerald-500/15 px-5 py-3 text-sm font-black text-emerald-300 ring-1 ring-emerald-400/20 disabled:opacity-50">
              Ekip Üyesi Ekle
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <h2 className="text-2xl font-black">Ekip ve Yetkiler</h2>
        <p className="mt-1 text-sm text-slate-400">Kim hangi modüle erişecek buradan yönetilir.</p>

        <div className="mt-5 grid gap-3">
          {members.map((member) => (
            <article key={member.id} className="rounded-[24px] border border-white/10 bg-[#0b1220] p-4">
              <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_1.1fr] xl:items-center">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black">{member.display_name || member.email}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${roleClass(member.role_name)}`}>{member.role_name || "Personel"}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(member.member_status)}`}>{statusLabel(member.member_status)}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-400">{member.email}</p>
                  <p className="mt-1 text-xs text-slate-500">Eklenme: {formatDate(member.created_at)}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select value={member.role_name || "Özel"} onChange={(e) => changeRole(member, e.target.value)} disabled={!canManageSettings || member.role_name === "Sahip"} className="input">
                    <option value="Sahip">Sahip</option><option value="Muhasebe">Muhasebe</option><option value="Depo">Depo</option><option value="Satış">Satış</option><option value="Özel">Özel</option>
                  </select>

                  <button onClick={() => updateMember(member, { member_status: member.member_status === "disabled" ? "active" : "disabled" })} disabled={!canManageSettings || member.role_name === "Sahip"} className="rounded-2xl bg-white/8 px-4 py-3 text-xs font-black text-slate-300 ring-1 ring-white/10 disabled:opacity-40">
                    {member.member_status === "disabled" ? "Aktif Yap" : "Pasife Al"}
                  </button>
                </div>

                <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
                  <button onClick={() => setSelectedMember(member)} className="rounded-2xl bg-blue-500/15 px-4 py-2.5 text-xs font-black text-blue-300 ring-1 ring-blue-400/20">Yetkileri Aç</button>
                  <button onClick={() => deleteMember(member)} disabled={!canManageSettings || member.email === context?.userEmail} className="rounded-2xl bg-red-500/15 px-4 py-2.5 text-xs font-black text-red-300 ring-1 ring-red-400/20 disabled:opacity-40">Sil</button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {permissionFields.filter((field) => Boolean(member[field.key])).slice(0, 10).map((field) => (
                  <span key={field.key} className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-black text-emerald-300 ring-1 ring-emerald-400/20">{field.label}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <h2 className="text-2xl font-black">Davet Geçmişi</h2>
        <p className="mt-1 text-sm text-slate-400">Gönderilen ekip davetleri ve durumları.</p>

        <div className="mt-5 grid gap-3">
          {invites.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm font-bold text-slate-500">Davet kaydı yok.</div>
          ) : (
            invites.map((invite) => (
              <div key={invite.id} className="rounded-2xl bg-[#0b1220] p-4 ring-1 ring-white/10">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black">{invite.display_name || invite.email}</p>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(invite.status)}`}>{statusLabel(invite.status)}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${roleClass(invite.role_name)}`}>{invite.role_name || "Personel"}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{invite.email}</p>
                    <p className="mt-1 text-xs text-slate-500">Geçerlilik: {formatDate(invite.expires_at)}</p>
                  </div>
                  <button onClick={() => resendInvite(invite)} disabled={!canManageSettings} className="rounded-2xl bg-blue-500/15 px-4 py-2.5 text-xs font-black text-blue-300 ring-1 ring-blue-400/20 disabled:opacity-40">
                    Daveti Tekrar Gönder
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedMember ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[30px] border border-white/10 bg-[#111a2e] p-5 shadow-2xl">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${roleClass(selectedMember.role_name)}`}>{selectedMember.role_name || "Personel"}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(selectedMember.member_status)}`}>{statusLabel(selectedMember.member_status)}</span>
                </div>
                <h2 className="text-3xl font-black tracking-[-0.04em]">{selectedMember.display_name || selectedMember.email}</h2>
                <p className="mt-1 text-sm text-slate-400">{selectedMember.email}</p>
              </div>

              <button onClick={() => setSelectedMember(null)} className="rounded-2xl bg-white/8 px-4 py-2.5 text-xs font-black text-slate-300 ring-1 ring-white/10">Kapat</button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {permissionFields.map((field) => (
                <button
                  key={field.key}
                  onClick={() => {
                    const nextValue = !selectedMember[field.key];
                    updateMember(selectedMember, { [field.key]: nextValue, role_name: selectedMember.role_name === "Sahip" ? "Sahip" : "Özel" } as Partial<Member>);
                    setSelectedMember((current) => (current ? { ...current, [field.key]: nextValue, role_name: current.role_name === "Sahip" ? "Sahip" : "Özel" } : current));
                  }}
                  disabled={!canManageSettings || selectedMember.role_name === "Sahip"}
                  className={`rounded-[22px] border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    selectedMember[field.key] ? "border-emerald-400/30 bg-emerald-500/10" : "border-white/10 bg-[#0b1220] hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-white">{field.label}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">{field.desc}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${selectedMember[field.key] ? "bg-emerald-400 text-[#04111c]" : "bg-white/8 text-slate-400"}`}>
                      {selectedMember[field.key] ? "Açık" : "Kapalı"}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {selectedMember.role_name === "Sahip" ? (
              <div className="mt-5 rounded-2xl bg-blue-500/10 p-4 text-sm font-bold text-blue-100 ring-1 ring-blue-400/20">
                Sahip rolünde tüm yetkiler açık kabul edilir; güvenlik için tek tek kapatılamaz.
              </div>
            ) : null}
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
      `}</style>
    </section>
  );
}

function Metric({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={["mt-3 text-3xl font-black", valueClass || "text-white"].join(" ")}>{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="label">{label}</span>{children}</label>;
}
