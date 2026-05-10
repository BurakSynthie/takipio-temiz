"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Business = { id: string; owner_email: string | null; name: string; email: string | null };
type BusinessMember = { id: string; business_id: string; email: string; role_name: string | null; member_status: string | null; can_manage_integrations?: boolean | null };
type Subscription = { id: string; business_id: string | null; plan: string | null; status: string | null };
type BusinessContext = { userEmail: string; business: Business; member: BusinessMember; subscription: Subscription | null; isOwner: boolean; isPro: boolean };
type MarketplaceKey = "trendyol" | "hepsiburada" | "amazon" | "ciceksepeti";

type Integration = {
  id: string;
  marketplace: MarketplaceKey;
  display_name: string | null;
  is_active: boolean | null;
  connection_status: string | null;
  api_key: string | null;
  api_secret: string | null;
  seller_id: string | null;
  merchant_id: string | null;
  store_name: string | null;
  region: string | null;
  last_test_at: string | null;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_error: string | null;
  sync_orders: boolean | null;
  sync_products: boolean | null;
  sync_stock: boolean | null;
  sync_returns: boolean | null;
  note: string | null;
};

type FormState = {
  api_key: string;
  api_secret: string;
  seller_id: string;
  merchant_id: string;
  store_name: string;
  region: string;
  is_active: boolean;
  sync_orders: boolean;
  sync_products: boolean;
  sync_stock: boolean;
  sync_returns: boolean;
  note: string;
};

type SyncLog = {
  id: string;
  marketplace: string | null;
  status: string | null;
  message: string | null;
  received_count: number | null;
  inserted_count: number | null;
  updated_count: number | null;
  error_message: string | null;
  created_at: string;
};

const marketplaces: Array<{ key: MarketplaceKey; name: string; short: string; gradient: string; desc: string; required: string[] }> = [
  { key: "trendyol", name: "Trendyol", short: "TY", gradient: "from-orange-500 to-amber-400", desc: "Trendyol sipariş, stok ve iade akışları için API hazırlığı.", required: ["API Key", "API Secret", "Supplier ID"] },
  { key: "hepsiburada", name: "Hepsiburada", short: "HB", gradient: "from-orange-600 to-red-500", desc: "Hepsiburada mağaza ve sipariş senkron hazırlığı.", required: ["Merchant ID", "API Key", "API Secret"] },
  { key: "amazon", name: "Amazon", short: "AZ", gradient: "from-slate-700 to-amber-400", desc: "Amazon mağaza bölgesi ve API bilgileri için temel bağlantı alanı.", required: ["Seller ID", "Region", "API credentials"] },
  { key: "ciceksepeti", name: "ÇiçekSepeti", short: "ÇS", gradient: "from-pink-500 to-rose-500", desc: "ÇiçekSepeti sipariş ve iade entegrasyonu için API hazırlığı.", required: ["API Key", "Seller ID"] },
];

const emptyForm: FormState = {
  api_key: "",
  api_secret: "",
  seller_id: "",
  merchant_id: "",
  store_name: "",
  region: "TR",
  is_active: false,
  sync_orders: true,
  sync_products: false,
  sync_stock: false,
  sync_returns: true,
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

async function ensureSubscription(businessId: string, userEmail: string) {
  const { data: existing } = await supabase.from("subscriptions").select("*").eq("business_id", businessId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (existing) return existing as Subscription;

  const { data, error } = await supabase.from("subscriptions").insert({
    business_id: businessId,
    user_email: userEmail,
    plan: "free",
    status: "trial",
    order_limit: 15,
    first_month_price: 89,
    monthly_price: 99,
  }).select("*").single();

  if (error || !data) throw new Error(`Abonelik oluşturulamadı: ${error?.message ?? "Bilinmeyen hata"}`);
  return data as Subscription;
}

async function ensureBusinessForCurrentUser() {
  const userEmail = await getCurrentUserEmail();
  if (!userEmail) throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yap.");

  const existingMember = await supabase.from("business_members").select("*").eq("email", userEmail).eq("member_status", "active").limit(1).maybeSingle();

  if (existingMember.data?.business_id) {
    const { data: business, error } = await supabase.from("businesses").select("*").eq("id", existingMember.data.business_id).single();
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

  const existingBusiness = await supabase.from("businesses").select("*").eq("owner_email", userEmail).limit(1).maybeSingle();

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

  const { data: createdBusiness, error } = await supabase.from("businesses").insert({ owner_email: userEmail, name: "İşletmem", email: userEmail }).select("*").single();
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

function withBusinessFields(context: BusinessContext) {
  return { business_id: context.business.id, created_by: context.userEmail };
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Henüz yok";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

function statusLabel(status: string | null | undefined) {
  if (status === "connected") return "Bağlı";
  if (status === "test_success") return "Test başarılı";
  if (status === "sync_ready") return "Senkron hazır";
  if (status === "error") return "Hata";
  return "Bağlı değil";
}

function statusClass(status: string | null | undefined) {
  if (status === "connected" || status === "test_success" || status === "sync_ready") return "bg-emerald-400/15 text-emerald-300 ring-emerald-400/20";
  if (status === "error") return "bg-red-400/15 text-red-300 ring-red-400/20";
  return "bg-slate-400/10 text-slate-300 ring-white/10";
}

function mask(value: string | null | undefined) {
  if (!value) return "Yok";
  if (value.length <= 6) return "••••••";
  return `${value.slice(0, 3)}••••${value.slice(-3)}`;
}

export default function IntegrationsPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [selected, setSelected] = useState<MarketplaceKey>("trendyol");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canManage = Boolean(context?.isOwner || context?.member.can_manage_integrations);
  const meta = marketplaces.find((item) => item.key === selected) ?? marketplaces[0];
  const current = integrations.find((item) => item.marketplace === selected) ?? null;
  const activeCount = integrations.filter((item) => item.is_active).length;
  const connectedCount = integrations.filter((item) => item.is_active && item.connection_status !== "error").length;
  const errorCount = integrations.filter((item) => item.connection_status === "error").length;
  const syncReadyCount = integrations.filter((item) => item.last_sync_status === "success").length;

  async function fetchData(existingContext?: BusinessContext) {
    setLoading(true);
    setMessage("");
    try {
      const ctx = existingContext ?? await ensureBusinessForCurrentUser();
      setContext(ctx);

      const [integrationsResult, logsResult] = await Promise.all([
        supabase.from("marketplace_integrations").select("*").eq("business_id", ctx.business.id).order("created_at", { ascending: true }),
        supabase.from("marketplace_sync_logs").select("*").eq("business_id", ctx.business.id).order("created_at", { ascending: false }).limit(12),
      ]);

      if (integrationsResult.error) {
        setMessage(`Entegrasyonlar alınamadı: ${integrationsResult.error.message}`);
        return;
      }

      if (logsResult.error) {
        setMessage(`Senkron geçmişi alınamadı: ${logsResult.error.message}`);
        return;
      }

      setIntegrations((integrationsResult.data ?? []) as Integration[]);
      setSyncLogs((logsResult.data ?? []) as SyncLog[]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Entegrasyon verisi alınamadı.";
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
    const found = integrations.find((item) => item.marketplace === selected);
    if (!found) {
      setForm(emptyForm);
      return;
    }
    setForm({
      api_key: found.api_key ?? "",
      api_secret: found.api_secret ?? "",
      seller_id: found.seller_id ?? "",
      merchant_id: found.merchant_id ?? "",
      store_name: found.store_name ?? "",
      region: found.region ?? "TR",
      is_active: Boolean(found.is_active),
      sync_orders: found.sync_orders ?? true,
      sync_products: found.sync_products ?? false,
      sync_stock: found.sync_stock ?? false,
      sync_returns: found.sync_returns ?? true,
      note: found.note ?? "",
    });
  }, [selected, integrations]);

  async function saveIntegration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!context) return;
    if (!canManage) {
      setMessage("Bu işletmede entegrasyon yönetimi yetkin yok.");
      return;
    }
    setSaving(true);
    setMessage("");

    const payload = {
      ...withBusinessFields(context),
      marketplace: selected,
      display_name: meta.name,
      is_active: form.is_active,
      connection_status: form.is_active ? "connected" : "not_connected",
      api_key: form.api_key.trim() || null,
      api_secret: form.api_secret.trim() || null,
      seller_id: form.seller_id.trim() || null,
      merchant_id: form.merchant_id.trim() || null,
      store_name: form.store_name.trim() || null,
      region: form.region.trim() || "TR",
      sync_orders: form.sync_orders,
      sync_products: form.sync_products,
      sync_stock: form.sync_stock,
      sync_returns: form.sync_returns,
      note: form.note.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const result = current
      ? await supabase.from("marketplace_integrations").update(payload).eq("business_id", context.business.id).eq("id", current.id)
      : await supabase.from("marketplace_integrations").insert(payload);

    if (result.error) {
      setMessage(`Entegrasyon kaydedilemedi: ${result.error.message}`);
      setSaving(false);
      return;
    }

    setMessage(`${meta.name} bağlantı bilgileri kaydedildi.`);
    setSaving(false);
    await fetchData(context);
  }

  async function testConnection() {
    if (!context || !current) {
      setMessage("Önce bağlantı bilgilerini kaydetmelisin.");
      return;
    }

    if (!canManage) {
      setMessage("Bu işletmede entegrasyon test etme yetkin yok.");
      return;
    }

    setMessage("Bağlantı backend route üzerinden test ediliyor...");

    const sessionResult = await supabase.auth.getSession();
    const accessToken = sessionResult.data.session?.access_token;

    if (!accessToken) {
      setMessage("Oturum bulunamadı. Lütfen tekrar giriş yap.");
      return;
    }

    const response = await fetch(`/api/integrations/${selected}/test`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result?.error || "Bağlantı testi başarısız.");
      await fetchData(context);
      return;
    }

    setMessage(result?.message || `${meta.name} bağlantı testi başarılı.`);
    await fetchData(context);
  }

  async function manualSync() {
    if (!context || !current) {
      setMessage("Önce bağlantı bilgilerini kaydetmelisin.");
      return;
    }

    if (!canManage) {
      setMessage("Bu işletmede senkron yönetimi yetkin yok.");
      return;
    }

    setMessage("Backend senkron route çalıştırılıyor...");

    const sessionResult = await supabase.auth.getSession();
    const accessToken = sessionResult.data.session?.access_token;

    if (!accessToken) {
      setMessage("Oturum bulunamadı. Lütfen tekrar giriş yap.");
      return;
    }

    const response = await fetch(`/api/integrations/${selected}/sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result?.error || "Senkron işlemi başarısız.");
      await fetchData(context);
      return;
    }

    setMessage(result?.message || `${meta.name} senkron route’u çalıştı.`);
    await fetchData(context);
  }

  async function deleteIntegration() {
    if (!context || !current) return;
    if (!canManage) {
      setMessage("Bu işletmede entegrasyon silme yetkin yok.");
      return;
    }
    if (!confirm(`${meta.name} bağlantısı silinsin mi?`)) return;

    const { error } = await supabase.from("marketplace_integrations").delete().eq("business_id", context.business.id).eq("id", current.id);
    if (error) {
      setMessage(`Entegrasyon silinemedi: ${error.message}`);
      return;
    }
    setMessage(`${meta.name} bağlantısı silindi.`);
    await fetchData(context);
  }

  const selectedStats = useMemo(() => ({
    apiKey: mask(current?.api_key),
    apiSecret: mask(current?.api_secret),
    sellerId: current?.seller_id || current?.merchant_id || "Yok",
    storeName: current?.store_name || "Mağaza adı yok",
  }), [current]);

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">Marketplace API Hub v9</div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Entegrasyonlar</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Pazaryeri API bilgilerini kaydet, bağlantı durumunu takip et ve gerçek senkron aşamasına hazır hale getir.</p>
          </div>
          <button onClick={() => fetchData(context ?? undefined)} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500">Yenile</button>
        </div>
      </div>

      {context ? (
        <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Aktif İşletme</p>
              <p className="mt-1 text-lg font-black">{context.business.name}</p>
            </div>
            <div className={`rounded-2xl px-4 py-3 text-sm font-black ring-1 ${canManage ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20" : "bg-red-400/10 text-red-300 ring-red-400/20"}`}>
              {canManage ? "Entegrasyon yönetimi açık" : "Entegrasyon yönetimi kapalı"}
            </div>
          </div>
        </div>
      ) : null}

      {message ? <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">{message}</div> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Aktif Bağlantı" value={loading ? "..." : String(activeCount)} valueClass="text-blue-300" />
        <Metric label="Bağlı" value={loading ? "..." : String(connectedCount)} valueClass="text-emerald-300" />
        <Metric label="Senkron Hazır" value={loading ? "..." : String(syncReadyCount)} valueClass="text-cyan-300" />
        <Metric label="Hata" value={loading ? "..." : String(errorCount)} valueClass="text-red-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <h2 className="text-2xl font-black">Pazaryerleri</h2>
          <p className="mt-1 text-sm text-slate-400">Bağlantı kurmak istediğin pazaryerini seç.</p>
          <div className="mt-5 grid gap-3">
            {marketplaces.map((marketplace) => {
              const integration = integrations.find((item) => item.marketplace === marketplace.key);
              const isSelected = selected === marketplace.key;
              return (
                <button key={marketplace.key} onClick={() => setSelected(marketplace.key)} className={`rounded-[22px] border p-4 text-left transition hover:-translate-y-0.5 ${isSelected ? "border-blue-400/40 bg-blue-500/10" : "border-white/10 bg-[#0b1220] hover:bg-[#101a31]"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${marketplace.gradient} text-sm font-black text-white shadow-lg`}>{marketplace.short}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black">{marketplace.name}</p>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ${statusClass(integration?.connection_status)}`}>{statusLabel(integration?.connection_status)}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{integration?.store_name || "Henüz mağaza adı yok"}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.gradient} text-lg font-black text-white`}>{meta.short}</div>
              <h2 className="text-3xl font-black tracking-[-0.04em]">{meta.name}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{meta.desc}</p>
            </div>
            <span className={`self-start rounded-full px-3 py-1.5 text-xs font-black ring-1 ${statusClass(current?.connection_status)}`}>{statusLabel(current?.connection_status)}</span>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-4">
            <SmallInfo label="API Key" value={selectedStats.apiKey} />
            <SmallInfo label="Secret" value={selectedStats.apiSecret} />
            <SmallInfo label="Satıcı ID" value={selectedStats.sellerId} />
            <SmallInfo label="Son Senkron" value={formatDate(current?.last_sync_at)} />
          </div>

          <form onSubmit={saveIntegration} className="mt-6">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Mağaza Adı"><input value={form.store_name} onChange={(e) => setForm((c) => ({ ...c, store_name: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" /></Field>
              <Field label="API Key"><input value={form.api_key} onChange={(e) => setForm((c) => ({ ...c, api_key: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" /></Field>
              <Field label="API Secret"><input type="password" value={form.api_secret} onChange={(e) => setForm((c) => ({ ...c, api_secret: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" /></Field>
              <Field label="Seller / Supplier ID"><input value={form.seller_id} onChange={(e) => setForm((c) => ({ ...c, seller_id: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" /></Field>
              <Field label="Merchant ID"><input value={form.merchant_id} onChange={(e) => setForm((c) => ({ ...c, merchant_id: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" /></Field>
              <Field label="Bölge">
                <select value={form.region} onChange={(e) => setForm((c) => ({ ...c, region: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                  <option value="TR">Türkiye</option>
                  <option value="EU">Avrupa</option>
                  <option value="US">Amerika</option>
                </select>
              </Field>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Toggle label="Aktif Bağlantı" checked={form.is_active} onChange={(v) => setForm((c) => ({ ...c, is_active: v }))} />
              <Toggle label="Siparişleri Senkronla" checked={form.sync_orders} onChange={(v) => setForm((c) => ({ ...c, sync_orders: v }))} />
              <Toggle label="Ürünleri Senkronla" checked={form.sync_products} onChange={(v) => setForm((c) => ({ ...c, sync_products: v }))} />
              <Toggle label="Stokları Senkronla" checked={form.sync_stock} onChange={(v) => setForm((c) => ({ ...c, sync_stock: v }))} />
              <Toggle label="İadeleri Senkronla" checked={form.sync_returns} onChange={(v) => setForm((c) => ({ ...c, sync_returns: v }))} />
            </div>

            <Field label="Not">
              <textarea value={form.note} onChange={(e) => setForm((c) => ({ ...c, note: e.target.value }))} className="mt-1 min-h-24 w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <div className="mt-5 flex flex-wrap gap-2">
              <button disabled={saving || !canManage} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Kaydediliyor..." : "Bağlantıyı Kaydet"}</button>
              <button type="button" onClick={testConnection} disabled={!current || !canManage} className="rounded-2xl bg-emerald-500/15 px-5 py-3 text-sm font-black text-emerald-300 ring-1 ring-emerald-400/20 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40">Test Et</button>
              <button type="button" onClick={manualSync} disabled={!current || !canManage} className="rounded-2xl bg-cyan-500/15 px-5 py-3 text-sm font-black text-cyan-300 ring-1 ring-cyan-400/20 transition hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-40">Manuel Senkron</button>
              {current ? <button type="button" onClick={deleteIntegration} disabled={!canManage} className="rounded-2xl bg-red-500/15 px-5 py-3 text-sm font-black text-red-300 ring-1 ring-red-400/20 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40">Sil</button> : null}
            </div>
          </form>

          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            <div className="rounded-[22px] border border-white/10 bg-[#0b1220] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Gerekli Bilgiler</p>
              <div className="mt-3 flex flex-wrap gap-2">{meta.required.map((item) => <span key={item} className="rounded-full bg-white/8 px-3 py-1 text-xs font-black text-slate-300 ring-1 ring-white/10">{item}</span>)}</div>
            </div>
            <div className="rounded-[22px] border border-amber-400/20 bg-amber-500/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-300">Önemli Not</p>
              <p className="mt-3 text-sm leading-6 text-amber-100/80">Bu paket gerçek API’den veri çekmez. Bilgileri kaydeder ve senkron altyapısını hazırlar. Gerçek sipariş/ürün/stok çekme işlemi sonraki pakette pazaryeri bazlı bağlanacak.</p>
            </div>
          </div>

          {current?.last_error ? <div className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200 ring-1 ring-red-400/20">{current.last_error}</div> : null}

          <div className="mt-6 rounded-[22px] border border-white/10 bg-[#0b1220] p-4">
            <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Senkron Geçmişi</p>
                <h3 className="mt-1 text-xl font-black">Son API hareketleri</h3>
              </div>
              <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-black text-slate-300 ring-1 ring-white/10">
                Son {syncLogs.length} kayıt
              </span>
            </div>

            <div className="grid gap-2">
              {syncLogs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm font-bold text-slate-500">
                  Henüz senkron kaydı yok.
                </div>
              ) : (
                syncLogs.map((log) => (
                  <div key={log.id} className="rounded-2xl bg-[#111a2e] p-3 ring-1 ring-white/10">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ${
                            log.status === "success"
                              ? "bg-emerald-400/15 text-emerald-300 ring-emerald-400/20"
                              : "bg-red-400/15 text-red-300 ring-red-400/20"
                          }`}>
                            {log.status === "success" ? "Başarılı" : "Hata"}
                          </span>
                          <span className="text-sm font-black uppercase text-white">{log.marketplace || "-"}</span>
                          <span className="text-xs font-bold text-slate-500">{formatDate(log.created_at)}</span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-400">
                          {log.message || log.error_message || "Senkron hareketi"}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
                        <div className="rounded-xl bg-white/5 px-3 py-2">
                          <p className="text-slate-500">Gelen</p>
                          <p>{log.received_count ?? 0}</p>
                        </div>
                        <div className="rounded-xl bg-white/5 px-3 py-2">
                          <p className="text-slate-500">Yeni</p>
                          <p className="text-emerald-300">{log.inserted_count ?? 0}</p>
                        </div>
                        <div className="rounded-xl bg-white/5 px-3 py-2">
                          <p className="text-slate-500">Güncel</p>
                          <p className="text-blue-300">{log.updated_count ?? 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-5"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p><p className={["mt-3 text-3xl font-black", valueClass || "text-white"].join(" ")}>{value}</p></div>;
}

function SmallInfo({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[18px] border border-white/10 bg-[#0b1220] p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-2 truncate text-sm font-black text-white">{value}</p></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-black text-slate-400">{label}</span>{children}</label>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${checked ? "border-blue-400/30 bg-blue-500/10 text-blue-200" : "border-white/10 bg-[#0b1220] text-slate-400"}`}>
      <span>{label}</span>
      <span className={`ml-3 h-5 w-9 rounded-full p-0.5 transition ${checked ? "bg-blue-500" : "bg-white/10"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-4" : "translate-x-0"}`} /></span>
    </button>
  );
}
