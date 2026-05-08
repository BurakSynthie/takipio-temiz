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
  can_manage_stock?: boolean | null;
  can_manage_shipments?: boolean | null;
  can_manage_returns?: boolean | null;
  can_manage_billing?: boolean | null;
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

type StockMovement = {
  id: string;
  business_id: string | null;
  product_id: string | null;
  product_code: string | null;
  product_name: string | null;
  movement_type: string | null;
  quantity: number | null;
  note: string | null;
  created_at: string;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default function StockPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  async function loadData() {
    setLoading(true);
    setMessage("");

    try {
      const ctx = await ensureBusinessForCurrentUser();
      setContext(ctx);

      const { data, error } = await supabase
        .from("stock_movements")
        .select("*")
        .eq("business_id", ctx.business.id)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(`Stok hareketleri alınamadı: ${error.message}`);
        setLoading(false);
        return;
      }

      setMovements(data || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "İşletme bağlantısı kurulamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredMovements = useMemo(() => {
    return movements.filter((item) => {
      const query = search.toLowerCase();

      const matchesSearch =
        !query ||
        item.product_name?.toLowerCase().includes(query) ||
        item.product_code?.toLowerCase().includes(query) ||
        item.note?.toLowerCase().includes(query);

      const matchesFilter =
        filter === "all"
          ? true
          : filter === "in"
          ? item.movement_type === "stock_in"
          : item.movement_type === "stock_out";

      return matchesSearch && matchesFilter;
    });
  }, [movements, search, filter]);

  const totalIn = movements.filter((item) => item.movement_type === "stock_in").reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalOut = movements.filter((item) => item.movement_type === "stock_out").reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const canView = hasPermission(context, "can_manage_stock") || hasPermission(context, "can_view_dashboard");

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Stock Business Core v1
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Stok Hareketleri</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Stok hareketleri artık sadece aktif işletmenin kayıtlarını gösterir.
            </p>
          </div>

          <button onClick={loadData} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500">
            Yenile
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

      {!canView && !loading ? (
        <div className="rounded-[26px] border border-red-500/20 bg-red-500/10 p-8 text-center text-sm font-bold text-red-200">
          Bu işletmede stok hareketlerini görüntüleme yetkin yok.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="Toplam Hareket" value={String(movements.length)} valueClass="text-white" />
            <Metric label="Stok Girişi" value={`+${totalIn}`} valueClass="text-emerald-300" />
            <Metric label="Stok Çıkışı" value={`-${totalOut}`} valueClass="text-red-300" />
            <Metric label="Son Güncelleme" value={movements[0] ? formatDate(movements[0].created_at) : "-"} valueClass="text-blue-300 text-base" />
          </div>

          <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-black">Hareket Geçmişi</h2>
                <p className="mt-1 text-sm text-slate-400">Aktif işletmenin stok giriş ve çıkış kayıtları.</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ürün ara..." className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none placeholder:text-slate-500 sm:w-[240px]" />
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                  <option value="all">Tüm Hareketler</option>
                  <option value="in">Stok Girişi</option>
                  <option value="out">Stok Çıkışı</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-3">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-[24px] bg-white/5" />)}</div>
            ) : filteredMovements.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0b1220] p-10 text-center">
                <h3 className="text-xl font-black">Hareket bulunamadı</h3>
                <p className="mt-2 text-sm text-slate-500">Ürünler sayfasında stok değiştirince burada gözükecek.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredMovements.map((item) => {
                  const isIn = item.movement_type === "stock_in";

                  return (
                    <div key={item.id} className="rounded-[22px] border border-white/10 bg-[#0b1220] p-4 transition hover:bg-[#101a31]">
                      <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-lg font-black">{item.product_name || "Ürün yok"}</h3>
                            <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-black text-slate-400">{item.product_code || "-"}</span>
                          </div>
                          <p className="mt-2 text-sm text-slate-400">{item.note || "-"}</p>
                          <p className="mt-2 text-xs font-bold text-slate-500">{formatDate(item.created_at)}</p>
                        </div>

                        <div>
                          <span className={["rounded-full px-4 py-2 text-xs font-black", isIn ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"].join(" ")}>
                            {isIn ? "Stok Girişi" : "Stok Çıkışı"}
                          </span>
                        </div>

                        <div>
                          <p className={["text-3xl font-black", isIn ? "text-emerald-300" : "text-red-300"].join(" ")}>{isIn ? "+" : "-"}{item.quantity}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
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
