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

type Product = {
  id: string;
  name: string;
  product_code: string;
  price: number | null;
  stock: number | null;
};

type Sale = {
  id: string;
  business_id: string | null;
  created_by: string | null;
  product_id: string | null;
  product_code: string | null;
  product_name: string | null;
  customer_name: string | null;
  quantity: number | null;
  unit_price: number | null;
  total_price: number | null;
  payment_status: string | null;
  sale_channel: string | null;
  note: string | null;
  created_at: string;
};

type SaleForm = {
  product_id: string;
  customer_name: string;
  quantity: string;
  unit_price: string;
  payment_status: string;
  sale_channel: string;
  note: string;
};

const emptyForm: SaleForm = {
  product_id: "",
  customer_name: "",
  quantity: "1",
  unit_price: "",
  payment_status: "pending",
  sale_channel: "manual",
  note: "",
};

const channels = [
  { value: "manual", label: "Manuel / Instagram" },
  { value: "trendyol", label: "Trendyol" },
  { value: "hepsiburada", label: "Hepsiburada" },
  { value: "amazon", label: "Amazon" },
  { value: "ciceksepeti", label: "ÇiçekSepeti" },
];

function paymentLabel(status: string | null | undefined) {
  if (status === "paid") return "Ödendi";
  if (status === "partial") return "Kısmi";
  return "Bekliyor";
}

function paymentClass(status: string | null | undefined) {
  if (status === "paid") return "bg-emerald-400/15 text-emerald-300";
  if (status === "partial") return "bg-amber-400/15 text-amber-300";
  return "bg-red-400/15 text-red-300";
}

function channelLabel(value: string | null | undefined) {
  return channels.find((item) => item.value === value)?.label ?? "Manuel";
}

export default function SalesPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<SaleForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const canManage = hasPermission(context, "can_manage_sales");

  const selectedProduct = useMemo(() => {
    return products.find((product) => product.id === form.product_id) ?? null;
  }, [products, form.product_id]);

  const previewTotal = Number(form.quantity || 0) * Number(form.unit_price || 0);

  async function fetchData() {
    setLoading(true);
    setMessage("");

    try {
      const ctx = await ensureBusinessForCurrentUser();
      setContext(ctx);

      const [salesResult, productsResult] = await Promise.all([
        supabase.from("sales").select("*").eq("business_id", ctx.business.id).order("created_at", { ascending: false }),
        supabase.from("products").select("id, name, product_code, price, stock").eq("business_id", ctx.business.id).order("created_at", { ascending: false }),
      ]);

      if (salesResult.error) {
        setMessage(`Satışlar alınamadı: ${salesResult.error.message}`);
        return;
      }

      setSales(salesResult.data ?? []);
      setProducts(productsResult.data ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "İşletme bağlantısı kurulamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sales.filter((sale) => {
      const matchesSearch =
        !query ||
        (sale.product_name ?? "").toLowerCase().includes(query) ||
        (sale.product_code ?? "").toLowerCase().includes(query) ||
        (sale.customer_name ?? "").toLowerCase().includes(query);

      const matchesChannel = channelFilter === "all" ? true : sale.sale_channel === channelFilter;

      return matchesSearch && matchesChannel;
    });
  }, [sales, search, channelFilter]);

  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_price ?? 0), 0);
  const paidRevenue = sales.filter((sale) => sale.payment_status === "paid").reduce((sum, sale) => sum + Number(sale.total_price ?? 0), 0);
  const pendingRevenue = totalRevenue - paidRevenue;
  const totalQuantity = sales.reduce((sum, sale) => sum + Number(sale.quantity ?? 0), 0);

  function selectProduct(productId: string) {
    const product = products.find((item) => item.id === productId);
    setForm((current) => ({
      ...current,
      product_id: productId,
      unit_price: product?.price ? String(product.price) : "",
    }));
  }

  async function createSale(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede satış oluşturma yetkin yok.");
      return;
    }

    if (!selectedProduct) {
      setMessage("Önce ürün seçmelisin.");
      return;
    }

    const quantity = Number(form.quantity || 0);
    const unitPrice = Number(form.unit_price || 0);
    const currentStock = Number(selectedProduct.stock ?? 0);
    const nextStock = currentStock - quantity;

    if (quantity <= 0) {
      setMessage("Adet 1 veya daha büyük olmalı.");
      return;
    }

    if (nextStock < 0) {
      setMessage(`Yetersiz stok. Mevcut stok: ${currentStock}`);
      return;
    }

    const totalPrice = quantity * unitPrice;

    const { error } = await supabase.from("sales").insert({
      ...withBusinessFields(context),
      product_id: selectedProduct.id,
      product_code: selectedProduct.product_code,
      product_name: selectedProduct.name,
      customer_name: form.customer_name.trim() || null,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      payment_status: form.payment_status,
      sale_channel: form.sale_channel,
      note: form.note.trim() || null,
    });

    if (error) {
      setMessage(`Satış kaydedilemedi: ${error.message}`);
      return;
    }

    await supabase
      .from("products")
      .update({ stock: nextStock })
      .eq("business_id", context.business.id)
      .eq("id", selectedProduct.id);

    await supabase.from("stock_movements").insert({
      ...withBusinessFields(context),
      product_id: selectedProduct.id,
      product_code: selectedProduct.product_code,
      product_name: selectedProduct.name,
      movement_type: "stock_out",
      quantity,
      note: `Satış kaydı oluşturuldu - ${channelLabel(form.sale_channel)}`,
    });

    setMessage("Satış kaydedildi.");
    setForm(emptyForm);
    setFormOpen(false);
    await fetchData();
  }

  async function updatePaymentStatus(sale: Sale, status: string) {
    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede satış güncelleme yetkin yok.");
      return;
    }

    await supabase
      .from("sales")
      .update({ payment_status: status })
      .eq("business_id", context.business.id)
      .eq("id", sale.id);

    setMessage("Satış ödeme durumu güncellendi.");
    await fetchData();
  }

  async function deleteSale(sale: Sale) {
    if (!context) return;

    if (!canManage) {
      setMessage("Bu işletmede satış silme yetkin yok.");
      return;
    }

    if (!confirm("Satış kaydı silinsin mi?")) return;

    await supabase
      .from("sales")
      .delete()
      .eq("business_id", context.business.id)
      .eq("id", sale.id);

    setMessage("Satış silindi.");
    await fetchData();
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Sales Business Core v1
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Satışlar</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Satışlar artık sadece aktif işletmeye bağlı kaydolur.
            </p>
          </div>

          <button
            onClick={() => {
              if (!canManage) {
                setMessage("Bu işletmede satış ekleme yetkin yok.");
                return;
              }
              setForm(emptyForm);
              setFormOpen((value) => !value);
            }}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500"
          >
            {formOpen ? "Formu Kapat" : "Yeni Satış"}
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
        <Metric label="Toplam Ciro" value={formatCurrency(totalRevenue)} valueClass="text-white" />
        <Metric label="Tahsil Edilen" value={formatCurrency(paidRevenue)} valueClass="text-emerald-300" />
        <Metric label="Bekleyen" value={formatCurrency(pendingRevenue)} valueClass="text-amber-300" />
        <Metric label="Satılan Adet" value={String(totalQuantity)} valueClass="text-blue-300" />
      </div>

      {formOpen ? (
        <form onSubmit={createSale} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black">Yeni Satış</h2>
              <p className="mt-1 text-sm text-slate-400">Satış aktif işletmeye bağlanır ve stoktan düşer.</p>
            </div>
            <div className="rounded-2xl bg-[#0b1220] px-4 py-3 text-right ring-1 ring-white/10">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Önizleme</p>
              <p className="mt-1 text-lg font-black text-blue-300">{formatCurrency(previewTotal)}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Ürün">
              <select value={form.product_id} onChange={(event) => selectProduct(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                <option value="">Ürün seç</option>
                {products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.product_code}) - Stok: {product.stock ?? 0}</option>)}
              </select>
            </Field>
            <Field label="Müşteri">
              <input value={form.customer_name} onChange={(e) => setForm((c) => ({ ...c, customer_name: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>
            <Field label="Kanal">
              <select value={form.sale_channel} onChange={(e) => setForm((c) => ({ ...c, sale_channel: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                {channels.map((channel) => <option key={channel.value} value={channel.value}>{channel.label}</option>)}
              </select>
            </Field>
            <Field label="Adet">
              <input type="number" min="1" value={form.quantity} onChange={(e) => setForm((c) => ({ ...c, quantity: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>
            <Field label="Birim Fiyat">
              <input type="number" value={form.unit_price} onChange={(e) => setForm((c) => ({ ...c, unit_price: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>
            <Field label="Ödeme Durumu">
              <select value={form.payment_status} onChange={(e) => setForm((c) => ({ ...c, payment_status: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                <option value="pending">Bekliyor</option>
                <option value="partial">Kısmi</option>
                <option value="paid">Ödendi</option>
              </select>
            </Field>
            <Field label="Not">
              <input value={form.note} onChange={(e) => setForm((c) => ({ ...c, note: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">Satışı Kaydet</button>
            <button type="button" onClick={() => { setForm(emptyForm); setFormOpen(false); }} className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-slate-200">Vazgeç</button>
          </div>
        </form>
      ) : null}

      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black">Satış Listesi</h2>
            <p className="mt-1 text-sm text-slate-400">Aktif işletmenin satış kayıtları.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Satış ara..." className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none placeholder:text-slate-500 sm:w-[240px]" />
            <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
              <option value="all">Tüm Kanallar</option>
              {channels.map((channel) => <option key={channel.value} value={channel.value}>{channel.label}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3">{[1,2,3].map((item) => <div key={item} className="h-24 animate-pulse rounded-[24px] bg-white/5" />)}</div>
        ) : filteredSales.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0b1220] p-10 text-center">
            <h3 className="text-xl font-black">Satış bulunamadı</h3>
            <p className="mt-2 text-sm text-slate-500">İlk satışı oluşturduğunda burada gözükecek.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredSales.map((sale) => (
              <div key={sale.id} className="rounded-[22px] border border-white/10 bg-[#0b1220] p-4 transition hover:bg-[#101a31]">
                <div className="grid gap-4 xl:grid-cols-[1fr_0.7fr_0.7fr_auto] xl:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black">{sale.product_name || "Ürün yok"}</h3>
                      <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-300">{channelLabel(sale.sale_channel)}</span>
                      <span className={["rounded-full px-3 py-1 text-xs font-black", paymentClass(sale.payment_status)].join(" ")}>{paymentLabel(sale.payment_status)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{sale.customer_name || "Müşteri yok"}</p>
                    <p className="mt-2 text-xs text-slate-500">{formatDate(sale.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Adet</p>
                    <p className="mt-1 text-lg font-black">{sale.quantity ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Tutar</p>
                    <p className="mt-1 text-lg font-black">{formatCurrency(sale.total_price)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <button onClick={() => updatePaymentStatus(sale, "paid")} className="rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-black text-emerald-300">Ödendi</button>
                    <button onClick={() => updatePaymentStatus(sale, "partial")} className="rounded-xl bg-amber-500/15 px-3 py-2 text-xs font-black text-amber-300">Kısmi</button>
                    <button onClick={() => deleteSale(sale)} className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-black text-red-300">Sil</button>
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
