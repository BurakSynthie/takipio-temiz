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
  can_manage_stock?: boolean | null;
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

type Product = {
  id: string;
  name: string;
  product_code: string;
  category: string | null;
  stock: number | null;
  min_stock: number | null;
  price: number | null;
  image_url: string | null;
};

type StockMovement = {
  id: string;
  product_id: string | null;
  product_code: string | null;
  product_name: string | null;
  movement_type: string | null;
  quantity: number | null;
  note: string | null;
  created_at: string;
  created_by: string | null;
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

  if (error || !data) throw new Error(`Abonelik oluşturulamadı: ${error?.message ?? "Bilinmeyen hata"}`);

  return data as Subscription;
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

  const { data: createdBusiness, error } = await supabase
    .from("businesses")
    .insert({ owner_email: userEmail, name: "İşletmem", email: userEmail })
    .select("*")
    .single();

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
  return {
    business_id: context.business.id,
    created_by: context.userEmail,
  };
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

export default function StockPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const canManage = Boolean(context?.isOwner || context?.member.can_manage_stock);

  async function fetchData(existingContext?: BusinessContext) {
    setLoading(true);
    setMessage("");

    try {
      const ctx = existingContext ?? await ensureBusinessForCurrentUser();
      setContext(ctx);

      const [productsResult, movementsResult] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, product_code, category, stock, min_stock, price, image_url")
          .eq("business_id", ctx.business.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("stock_movements")
          .select("*")
          .eq("business_id", ctx.business.id)
          .order("created_at", { ascending: false })
          .limit(80),
      ]);

      if (productsResult.error) {
        setMessage(`Ürünler alınamadı: ${productsResult.error.message}`);
        return;
      }

      if (movementsResult.error) {
        setMessage(`Stok hareketleri alınamadı: ${movementsResult.error.message}`);
        return;
      }

      setProducts(productsResult.data ?? []);
      setMovements(movementsResult.data ?? []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Stok verisi alınamadı.";

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

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      return (
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.product_code.toLowerCase().includes(query) ||
        (product.category ?? "").toLowerCase().includes(query)
      );
    });
  }, [products, search]);

  const totalStock = products.reduce((sum, product) => sum + Number(product.stock ?? 0), 0);
  const stockValue = products.reduce((sum, product) => sum + Number(product.stock ?? 0) * Number(product.price ?? 0), 0);
  const criticalCount = products.filter((product) => Number(product.min_stock ?? 0) > 0 && Number(product.stock ?? 0) <= Number(product.min_stock ?? 0)).length;
  const outOfStockCount = products.filter((product) => Number(product.stock ?? 0) <= 0).length;

  async function updateStock(product: Product, diff: number) {
    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede stok değiştirme yetkin yok.");
      return;
    }

    const currentStock = Number(product.stock ?? 0);
    const nextStock = currentStock + diff;

    if (nextStock < 0) return;

    setUpdatingId(product.id);
    setProducts((current) => current.map((item) => item.id === product.id ? { ...item, stock: nextStock } : item));

    const { error } = await supabase
      .from("products")
      .update({ stock: nextStock })
      .eq("business_id", context.business.id)
      .eq("id", product.id);

    if (error) {
      setMessage(`Stok güncellenemedi: ${error.message}`);
      setProducts((current) => current.map((item) => item.id === product.id ? { ...item, stock: currentStock } : item));
      setUpdatingId(null);
      return;
    }

    const movementPayload = {
      ...withBusinessFields(context),
      product_id: product.id,
      product_code: product.product_code,
      product_name: product.name,
      movement_type: diff > 0 ? "stock_in" : "stock_out",
      quantity: Math.abs(diff),
      note: diff > 0 ? "Stok sayfasından hızlı artırıldı" : "Stok sayfasından hızlı azaltıldı",
    };

    const movementResult = await supabase
      .from("stock_movements")
      .insert(movementPayload)
      .select("*")
      .single();

    if (movementResult.data) {
      setMovements((current) => [movementResult.data, ...current].slice(0, 80));
    }

    setUpdatingId(null);
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Stock Live Control v2
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Stok</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Stok adetlerini sayfa yenilenmeden canlı artırıp azaltabilirsin. Her işlem hareket geçmişine kaydolur.
            </p>
          </div>

          <button
            onClick={() => fetchData(context ?? undefined)}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500"
          >
            Yenile
          </button>
        </div>
      </div>

      {context ? (
        <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Aktif İşletme</p>
              <p className="mt-1 text-lg font-black">{context.business.name}</p>
            </div>
            <div className={`rounded-2xl px-4 py-3 text-sm font-black ring-1 ${
              canManage ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20" : "bg-red-400/10 text-red-300 ring-red-400/20"
            }`}>
              {canManage ? "Stok yönetimi açık" : "Stok yönetimi kapalı"}
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
        <Metric label="Toplam Stok" value={String(totalStock)} valueClass="text-blue-300" />
        <Metric label="Stok Değeri" value={formatCurrency(stockValue)} valueClass="text-emerald-300" />
        <Metric label="Kritik Stok" value={String(criticalCount)} valueClass="text-amber-300" />
        <Metric label="Tükenen" value={String(outOfStockCount)} valueClass="text-red-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black">Ürün Stokları</h2>
              <p className="mt-1 text-sm text-slate-400">+ / - butonları canlı çalışır, sayfa yenilenmez.</p>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ürün, kod veya kategori ara..."
              className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none placeholder:text-slate-500 lg:w-[320px]"
            />
          </div>

          {loading ? (
            <div className="grid gap-3">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-[24px] bg-white/5" />)}</div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0b1220] p-10 text-center">
              <h3 className="text-xl font-black">Stok bulunamadı</h3>
              <p className="mt-2 text-sm text-slate-500">Ürün eklediğinde burada görünecek.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredProducts.map((product) => {
                const currentStock = Number(product.stock ?? 0);
                const minStock = Number(product.min_stock ?? 0);
                const isCritical = minStock > 0 && currentStock <= minStock;
                const isUpdating = updatingId === product.id;

                return (
                  <div key={product.id} className="rounded-[22px] border border-white/10 bg-[#0b1220] p-4 transition hover:bg-[#101a31]">
                    <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-lg font-black text-blue-300">{product.name.slice(0, 1).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-lg font-black">{product.name}</h3>
                            {isCritical ? <span className="rounded-full bg-red-500/15 px-3 py-1 text-[10px] font-black text-red-300">Kritik</span> : null}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{product.product_code} · {product.category || "Kategori yok"}</p>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-[#111a2e] px-4 py-3 ring-1 ring-white/10">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Mevcut Stok</p>
                        <p className="mt-1 text-2xl font-black">{currentStock}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          disabled={isUpdating || !canManage || currentStock <= 0}
                          onClick={() => updateStock(product, -1)}
                          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/15 text-xl font-black text-red-300 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          -
                        </button>
                        <button
                          disabled={isUpdating || !canManage}
                          onClick={() => updateStock(product, 1)}
                          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-xl font-black text-emerald-300 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <h2 className="text-2xl font-black">Hareket Geçmişi</h2>
          <p className="mt-1 text-sm text-slate-400">Son stok giriş/çıkış kayıtları.</p>

          <div className="mt-5 grid gap-3">
            {movements.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0b1220] p-10 text-center">
                <h3 className="text-xl font-black">Hareket yok</h3>
                <p className="mt-2 text-sm text-slate-500">Stok değişimi yaptığında burada görünecek.</p>
              </div>
            ) : (
              movements.slice(0, 18).map((movement) => (
                <div key={movement.id} className="rounded-[18px] bg-[#0b1220] p-4 ring-1 ring-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{movement.product_name || "Ürün yok"}</p>
                      <p className="mt-1 text-xs text-slate-500">{movement.note || "Stok hareketi"}</p>
                      <p className="mt-1 text-[11px] text-slate-600">{formatDate(movement.created_at)}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${
                      movement.movement_type === "stock_in" ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"
                    }`}>
                      {movement.movement_type === "stock_in" ? "+" : "-"}{movement.quantity ?? 0}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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
