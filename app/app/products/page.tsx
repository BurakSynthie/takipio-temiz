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
  can_manage_products: boolean | null;
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
  business_id: string | null;
  created_by: string | null;
  created_at: string;
  name: string;
  product_code: string;
  category: string | null;
  description: string | null;
  price: number | null;
  stock: number | null;
  min_stock: number | null;
  image_url: string | null;
  qr_code: string | null;
  is_active: boolean | null;
};

type ProductForm = {
  name: string;
  product_code: string;
  category: string;
  description: string;
  price: string;
  stock: string;
  min_stock: string;
  image_url: string;
};

const emptyForm: ProductForm = {
  name: "",
  product_code: "",
  category: "",
  description: "",
  price: "",
  stock: "",
  min_stock: "",
  image_url: "",
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

function withBusinessFields(context: BusinessContext) {
  return {
    business_id: context.business.id,
    created_by: context.userEmail,
  };
}

function canManageProducts(context: BusinessContext | null) {
  if (!context) return false;
  if (context.isOwner) return true;
  return Boolean(context.member.can_manage_products);
}

function formatCurrency(value: number | null) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function createProductPrefix(productName: string) {
  const cleanedName = productName
    .trim()
    .toUpperCase()
    .replace(/Ğ/g, "G")
    .replace(/Ü/g, "U")
    .replace(/Ş/g, "S")
    .replace(/İ/g, "I")
    .replace(/Ö/g, "O")
    .replace(/Ç/g, "C")
    .replace(/[^A-Z0-9]/g, "");

  const prefix = cleanedName.slice(0, 4);

  if (prefix.length >= 2) return prefix.padEnd(4, "X");

  return "URUN";
}

function createQrTarget(productCode: string) {
  if (typeof window === "undefined") return `takipio://product/${productCode}`;

  return `${window.location.origin}/app/products?code=${encodeURIComponent(productCode)}`;
}

function createQrImageUrl(productCode: string, size = 260) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(createQrTarget(productCode))}`;
}

export default function ProductsPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stockUpdatingId, setStockUpdatingId] = useState<string | null>(null);
  const [openQrId, setOpenQrId] = useState<string | null>(null);

  const existingCategories = useMemo(() => {
    const set = new Set<string>();

    products.forEach((product) => {
      const category = product.category?.trim();

      if (category) set.add(category);
    });

    return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return products;

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.product_code.toLowerCase().includes(query) ||
        (product.category ?? "").toLowerCase().includes(query)
      );
    });
  }, [products, search]);

  const totalStock = products.reduce((sum, product) => sum + Number(product.stock ?? 0), 0);
  const totalValue = products.reduce((sum, product) => sum + Number(product.stock ?? 0) * Number(product.price ?? 0), 0);
  const criticalCount = products.filter((product) => Number(product.min_stock ?? 0) > 0 && Number(product.stock ?? 0) <= Number(product.min_stock ?? 0)).length;
  const isAllowed = canManageProducts(context);

  async function loadContextAndProducts() {
    setLoading(true);
    setMessage("");

    try {
      const businessContext = await ensureBusinessForCurrentUser();

      setContext(businessContext);
      await fetchProducts(businessContext);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "İşletme bağlantısı kurulamadı.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchProducts(activeContext = context) {
    if (!activeContext) return;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("business_id", activeContext.business.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Ürünler alınamadı: ${error.message}`);
      return;
    }

    setProducts(data ?? []);
  }

  useEffect(() => {
    loadContextAndProducts();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function generateProductCode(productName: string) {
    const prefix = createProductPrefix(productName);

    const matches = products.filter((product) => product.product_code.startsWith(`${prefix}-`));

    const existingNumbers = matches
      .map((product) => Number(product.product_code.split("-")[1] || 0))
      .filter((number) => !Number.isNaN(number));

    const nextNumber = existingNumbers.length ? Math.max(...existingNumbers) + 1 : 1;

    return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!context) {
      setMessage("İşletme bağlantısı bulunamadı.");
      return;
    }

    if (!isAllowed) {
      setMessage("Bu işletmede ürün yönetimi yetkin yok.");
      return;
    }

    setSaving(true);
    setMessage("");

    const cleanName = form.name.trim();

    if (!cleanName) {
      setMessage("Ürün adı gerekli.");
      setSaving(false);
      return;
    }

    try {
      const finalProductCode = editingId ? form.product_code : await generateProductCode(cleanName);

      const payload = {
        ...withBusinessFields(context),
        name: cleanName,
        product_code: finalProductCode,
        category: form.category.trim() || null,
        description: form.description.trim() || null,
        price: Number(form.price || 0),
        stock: Number(form.stock || 0),
        min_stock: Number(form.min_stock || 0),
        image_url: form.image_url.trim() || null,
        qr_code: createQrTarget(finalProductCode),
        is_active: true,
      };

      const result = editingId
        ? await supabase
            .from("products")
            .update(payload)
            .eq("business_id", context.business.id)
            .eq("id", editingId)
        : await supabase.from("products").insert(payload);

      if (result.error) {
        setMessage(`Ürün kaydedilemedi: ${result.error.message}`);
        setSaving(false);
        return;
      }

      setMessage(editingId ? "Ürün güncellendi." : "Ürün eklendi.");
      setFormOpen(false);
      resetForm();
      setSaving(false);
      await fetchProducts(context);
    } catch (error) {
      setMessage("Ürün kodu oluşturulurken hata oluştu.");
      setSaving(false);
    }
  }

  function startEdit(product: Product) {
    if (!isAllowed) {
      setMessage("Bu işletmede ürün düzenleme yetkin yok.");
      return;
    }

    setEditingId(product.id);
    setForm({
      name: product.name,
      product_code: product.product_code,
      category: product.category ?? "",
      description: product.description ?? "",
      price: String(product.price ?? 0),
      stock: String(product.stock ?? 0),
      min_stock: String(product.min_stock ?? 0),
      image_url: product.image_url ?? "",
    });
    setFormOpen(true);
  }

  async function deleteProduct(id: string) {
    if (!context) return;

    if (!isAllowed) {
      setMessage("Bu işletmede ürün silme yetkin yok.");
      return;
    }

    const ok = confirm("Ürün silinsin mi?");
    if (!ok) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("business_id", context.business.id)
      .eq("id", id);

    if (error) {
      setMessage(`Ürün silinemedi: ${error.message}`);
      return;
    }

    setMessage("Ürün silindi.");
    await fetchProducts(context);
  }

  async function updateStock(product: Product, diff: number) {
    if (!context) return;

    if (!isAllowed) {
      setMessage("Bu işletmede stok değiştirme yetkin yok.");
      return;
    }

    const currentStock = Number(product.stock ?? 0);
    const nextStock = currentStock + diff;

    if (nextStock < 0) return;

    setStockUpdatingId(product.id);

    const { error } = await supabase
      .from("products")
      .update({ stock: nextStock })
      .eq("business_id", context.business.id)
      .eq("id", product.id);

    if (!error) {
      await supabase.from("stock_movements").insert({
        ...withBusinessFields(context),
        product_id: product.id,
        product_code: product.product_code,
        product_name: product.name,
        movement_type: diff > 0 ? "stock_in" : "stock_out",
        quantity: Math.abs(diff),
        note: diff > 0 ? "Ürün kartından stok artırıldı" : "Ürün kartından stok azaltıldı",
      });

      setProducts((current) =>
        current.map((item) => (item.id === product.id ? { ...item, stock: nextStock } : item))
      );
    }

    setStockUpdatingId(null);
  }

  function printQr(product: Product) {
    const qrUrl = createQrImageUrl(product.product_code, 400);
    const newWindow = window.open("", "_blank", "width=800,height=900");

    if (!newWindow) return;

    newWindow.document.write(`
      <html>
        <head><title>${product.name} QR</title></head>
        <body style="font-family:Arial,sans-serif;padding:24px;text-align:center;">
          <h2>${product.name}</h2>
          <p>${product.product_code}</p>
          <img src="${qrUrl}" style="width:320px;height:320px;" />
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    newWindow.document.close();
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Products Business Core v1
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Ürünler</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Ürünler artık aktif işletmeye bağlı kaydolur. Her işletme sadece kendi ürünlerini görür.
            </p>
          </div>

          <button
            onClick={() => {
              if (!isAllowed) {
                setMessage("Bu işletmede ürün ekleme yetkin yok.");
                return;
              }

              resetForm();
              setFormOpen((value) => !value);
            }}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500"
          >
            {formOpen ? "Formu Kapat" : "Yeni Ürün"}
          </button>
        </div>
      </div>

      {context ? (
        <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Aktif İşletme</p>
              <p className="mt-1 text-lg font-black">{context.business.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                Kullanıcı: {context.userEmail} · Rol: {context.member.role_name || "Üye"}
              </p>
            </div>

            <div className={`rounded-2xl px-4 py-3 text-sm font-black ring-1 ${
              isAllowed
                ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20"
                : "bg-red-400/10 text-red-300 ring-red-400/20"
            }`}>
              {isAllowed ? "Ürün yönetimi açık" : "Ürün yönetimi kapalı"}
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
        <Metric label="Toplam Ürün" value={String(products.length)} valueClass="text-white" />
        <Metric label="Toplam Stok" value={String(totalStock)} valueClass="text-blue-300" />
        <Metric label="Stok Değeri" value={formatCurrency(totalValue)} valueClass="text-emerald-300" />
        <Metric label="Kritik Stok" value={String(criticalCount)} valueClass="text-amber-300" />
      </div>

      {formOpen ? (
        <form onSubmit={saveProduct} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-5">
            <h2 className="text-2xl font-black">{editingId ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}</h2>
            <p className="mt-1 text-sm text-slate-400">
              Kategoriyi yazabilir veya daha önce bu işletmede girilmiş kategorilerden seçebilirsin.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Ürün Adı">
              <input value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Kategori">
              <div className="grid gap-2">
                <input list="categories" value={form.category} onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" placeholder="Elektronik" />
                <datalist id="categories">
                  {existingCategories.map((category) => <option key={category} value={category} />)}
                </datalist>
              </div>
            </Field>

            <Field label="Fiyat">
              <input type="number" value={form.price} onChange={(e) => setForm((c) => ({ ...c, price: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Stok">
              <input type="number" value={form.stock} onChange={(e) => setForm((c) => ({ ...c, stock: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Minimum Stok">
              <input type="number" value={form.min_stock} onChange={(e) => setForm((c) => ({ ...c, min_stock: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Görsel URL">
              <input value={form.image_url} onChange={(e) => setForm((c) => ({ ...c, image_url: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Açıklama">
              <input value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Ürün Kodu">
              <input value={editingId ? form.product_code : "Otomatik oluşturulacak"} readOnly className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-slate-500 outline-none" />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button disabled={saving || !isAllowed} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-60">
              {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Ürünü Kaydet"}
            </button>
            <button type="button" onClick={() => { setFormOpen(false); resetForm(); }} className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-slate-200">
              Vazgeç
            </button>
          </div>
        </form>
      ) : null}

      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black">Ürün Listesi</h2>
            <p className="mt-1 text-sm text-slate-400">Düzenle, sil, stok artır/azalt veya QR görüntüle.</p>
          </div>

          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ürün ara..." className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none placeholder:text-slate-500 lg:w-[320px]" />
        </div>

        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-[24px] bg-white/5" />)}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0b1220] p-10 text-center">
            <h3 className="text-xl font-black">Ürün bulunamadı</h3>
            <p className="mt-2 text-sm text-slate-500">İlk ürünü eklediğinde burada gözükecek.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredProducts.map((product) => {
              const critical = Number(product.min_stock ?? 0) > 0 && Number(product.stock ?? 0) <= Number(product.min_stock ?? 0);

              return (
                <div key={product.id} className="rounded-[22px] border border-white/10 bg-[#0b1220] p-4 transition hover:bg-[#101a31]">
                  <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr_0.7fr_0.8fr_auto] xl:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-black">{product.name}</h3>
                        <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-black text-slate-400">{product.product_code}</span>
                        {product.category ? <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-300">{product.category}</span> : null}
                        {critical ? <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-black text-amber-300">Kritik stok</span> : null}
                      </div>
                      {product.description ? <p className="mt-2 text-sm text-slate-400">{product.description}</p> : null}
                      <p className="mt-2 text-xs text-slate-500">Min stok: {product.min_stock ?? 0} · Ekleyen: {product.created_by || "-"}</p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Fiyat</p>
                      <p className="mt-1 text-lg font-black">{formatCurrency(product.price)}</p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Stok</p>
                      <div className="mt-2 flex items-center gap-2">
                        <button disabled={stockUpdatingId === product.id || !isAllowed} onClick={() => updateStock(product, -1)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/15 text-red-300 disabled:opacity-40">-</button>
                        <span className="min-w-10 text-center text-xl font-black text-blue-300">{product.stock ?? 0}</span>
                        <button disabled={stockUpdatingId === product.id || !isAllowed} onClick={() => updateStock(product, 1)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 disabled:opacity-40">+</button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => startEdit(product)} className="rounded-xl bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">Düzenle</button>
                      <button onClick={() => deleteProduct(product.id)} className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-black text-red-300">Sil</button>
                      <button onClick={() => setOpenQrId(openQrId === product.id ? null : product.id)} className="rounded-xl bg-violet-500/15 px-3 py-2 text-xs font-black text-violet-300">QR Gör</button>
                      <button onClick={() => printQr(product)} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-slate-200">Yazdır</button>
                    </div>

                    <div className="xl:text-right">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Durum</p>
                      <p className={["mt-1 text-sm font-black", product.is_active ? "text-emerald-300" : "text-slate-500"].join(" ")}>
                        {product.is_active ? "Aktif" : "Pasif"}
                      </p>
                    </div>
                  </div>

                  {openQrId === product.id ? (
                    <div className="mt-4 flex flex-col items-start gap-4 rounded-[18px] bg-[#111a2e] p-4 ring-1 ring-white/10 md:flex-row md:items-center">
                      <img src={createQrImageUrl(product.product_code, 240)} alt={`${product.name} QR`} className="h-36 w-36 rounded-2xl bg-white p-2" />
                      <div>
                        <p className="text-base font-black">{product.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{product.product_code}</p>
                        <p className="mt-2 break-all text-xs text-blue-300">{createQrTarget(product.product_code)}</p>
                      </div>
                    </div>
                  ) : null}
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
