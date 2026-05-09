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
  can_manage_products?: boolean | null;
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
  qr_code: string | null;
  image_url: string | null;
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

function createQrTarget(productCode: string) {
  if (typeof window === "undefined") return `takipio://product/${productCode}`;

  return `${window.location.origin}/app/products?code=${encodeURIComponent(productCode)}`;
}

function createQrImageUrl(productCode: string, size = 320) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(createQrTarget(productCode))}`;
}

function openQrDocument(product: Product, autoPrint = false) {
  const qrUrl = createQrImageUrl(product.product_code, 420);
  const targetUrl = createQrTarget(product.product_code);
  const newWindow = window.open("", "_blank", "width=860,height=980");

  if (!newWindow) return;

  newWindow.document.write(`
    <html>
      <head>
        <title>${product.name} QR Etiketi</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 28px;
            font-family: Arial, sans-serif;
            background: #f3f7fb;
            color: #0f172a;
          }
          .sheet {
            max-width: 560px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #dbe5f0;
            border-radius: 28px;
            padding: 28px;
            text-align: center;
            box-shadow: 0 24px 80px rgba(15, 23, 42, .10);
          }
          .brand {
            font-size: 13px;
            font-weight: 900;
            letter-spacing: .16em;
            color: #2563eb;
            text-transform: uppercase;
            margin-bottom: 18px;
          }
          h1 {
            margin: 0;
            font-size: 30px;
            line-height: 1.1;
            letter-spacing: -.04em;
          }
          .code {
            margin-top: 10px;
            font-size: 14px;
            font-weight: 800;
            color: #64748b;
          }
          img {
            width: 320px;
            height: 320px;
            margin: 24px auto 14px;
            display: block;
            border: 1px solid #e2e8f0;
            border-radius: 22px;
            padding: 12px;
          }
          .url {
            word-break: break-all;
            color: #2563eb;
            font-size: 12px;
            line-height: 1.5;
          }
          .actions {
            margin-top: 22px;
            display: flex;
            justify-content: center;
            gap: 10px;
          }
          button {
            border: 0;
            border-radius: 14px;
            padding: 12px 16px;
            background: #2563eb;
            color: white;
            font-weight: 900;
            cursor: pointer;
          }
          .secondary { background: #0f172a; }
          .hint {
            margin-top: 18px;
            color: #64748b;
            font-size: 12px;
            line-height: 1.5;
          }
          @media print {
            body { background: white; padding: 0; }
            .sheet { box-shadow: none; border: 0; }
            .actions, .hint { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="brand">Takipio QR Etiketi</div>
          <h1>${product.name}</h1>
          <div class="code">${product.product_code}</div>
          <img src="${qrUrl}" />
          <div class="url">${targetUrl}</div>
          <div class="actions">
            <button onclick="window.print()">PDF / Yazdır</button>
            <button class="secondary" onclick="window.close()">Kapat</button>
          </div>
          <div class="hint">PDF indirmek için açılan yazdırma ekranında “PDF olarak kaydet” seçeneğini kullanabilirsin.</div>
        </div>
        ${autoPrint ? "<script>window.onload = () => setTimeout(() => window.print(), 500);</script>" : ""}
      </body>
    </html>
  `);
  newWindow.document.close();
}

export default function QrPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchProducts() {
    setLoading(true);
    setMessage("");

    try {
      const ctx = await ensureBusinessForCurrentUser();
      setContext(ctx);

      const { data, error } = await supabase
        .from("products")
        .select("id, name, product_code, category, qr_code, image_url")
        .eq("business_id", ctx.business.id)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(`QR ürünleri alınamadı: ${error.message}`);
        return;
      }

      setProducts(data ?? []);

      if (!selectedId && data?.[0]?.id) {
        setSelectedId(data[0].id);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "QR verisi alınamadı.";

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
    fetchProducts();
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

  const selectedProduct = products.find((product) => product.id === selectedId) ?? filteredProducts[0] ?? null;

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              QR / Barkod v2
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">QR Etiket</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Ürün QR kodunu aynı sayfada gör, etiket olarak aç, PDF kaydet veya direkt yazdır.
            </p>
          </div>

          <button onClick={fetchProducts} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500">
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

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-5">
            <h2 className="text-2xl font-black">Ürün Seç</h2>
            <p className="mt-1 text-sm text-slate-400">QR oluşturulacak ürünü seç.</p>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ürün, kod veya kategori ara..."
            className="mb-4 w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none placeholder:text-slate-500"
          />

          {loading ? (
            <div className="grid gap-3">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-[22px] bg-white/5" />)}</div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0b1220] p-10 text-center">
              <h3 className="text-xl font-black">Ürün bulunamadı</h3>
              <p className="mt-2 text-sm text-slate-500">Önce ürün eklemelisin.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => setSelectedId(product.id)}
                  className={`rounded-[22px] border p-4 text-left transition hover:-translate-y-0.5 ${
                    selectedProduct?.id === product.id ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-[#0b1220] hover:bg-[#101a31]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-lg font-black text-blue-300">{product.name.slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{product.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{product.product_code} · {product.category || "Kategori yok"}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <h2 className="text-2xl font-black">QR Önizleme</h2>
          <p className="mt-1 text-sm text-slate-400">QR kodu aynı sayfada görünür. Müşteri ürüne direkt buradan erişebilir.</p>

          {!selectedProduct ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-white/10 bg-[#0b1220] p-10 text-center">
              <h3 className="text-xl font-black">Ürün seçilmedi</h3>
              <p className="mt-2 text-sm text-slate-500">Soldan bir ürün seç.</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-5 lg:grid-cols-[320px_1fr]">
              <div className="rounded-[28px] bg-white p-5 text-center text-slate-950">
                <p className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-blue-600">Takipio QR</p>
                <img src={createQrImageUrl(selectedProduct.product_code, 420)} alt={`${selectedProduct.name} QR`} className="mx-auto h-64 w-64 rounded-2xl" />
                <p className="mt-4 text-lg font-black">{selectedProduct.name}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{selectedProduct.product_code}</p>
              </div>

              <div className="rounded-[24px] bg-[#0b1220] p-5 ring-1 ring-white/10">
                <h3 className="text-xl font-black">{selectedProduct.name}</h3>
                <p className="mt-2 text-sm text-slate-400">{selectedProduct.category || "Kategori yok"}</p>

                <div className="mt-5 rounded-2xl bg-[#111a2e] p-4 ring-1 ring-white/10">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">QR Linki</p>
                  <p className="mt-2 break-all text-sm font-bold text-blue-300">{createQrTarget(selectedProduct.product_code)}</p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => openQrDocument(selectedProduct, false)}
                    className="rounded-2xl bg-cyan-500/15 px-5 py-3 text-sm font-black text-cyan-300 ring-1 ring-cyan-400/20 transition hover:bg-cyan-500/25"
                  >
                    PDF / Etiket Aç
                  </button>
                  <button
                    onClick={() => openQrDocument(selectedProduct, true)}
                    className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500"
                  >
                    Direkt Yazdır
                  </button>
                </div>

                <div className="mt-5 rounded-2xl bg-amber-500/10 p-4 text-xs font-bold leading-5 text-amber-200 ring-1 ring-amber-400/20">
                  PDF indirmek için “PDF / Etiket Aç” butonuna bas. Açılan ekranda “PDF / Yazdır” deyip yazıcı ekranından “PDF olarak kaydet” seçebilirsin.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
