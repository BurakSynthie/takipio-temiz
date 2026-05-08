"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../../lib/supabase";

type Product = {
  id: string;
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

function formatCurrency(value: number | null) {
  const numberValue = Number(value ?? 0);

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(numberValue);
}

function createQrCode(productCode: string) {
  return `takipio://product/${productCode}`;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.product_code.toLowerCase().includes(query) ||
        (product.category ?? "").toLowerCase().includes(query)
      );
    });
  }, [products, search]);

  const totalProducts = products.length;

  const totalStock = products.reduce((sum, product) => {
    return sum + Number(product.stock ?? 0);
  }, 0);

  const criticalStock = products.filter((product) => {
    const stock = Number(product.stock ?? 0);
    const minStock = Number(product.min_stock ?? 0);

    return minStock > 0 && stock <= minStock;
  }).length;

  const totalValue = products.reduce((sum, product) => {
    return sum + Number(product.price ?? 0) * Number(product.stock ?? 0);
  }, 0);

  async function fetchProducts() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Ürünler alınamadı: ${error.message}`);
      setLoading(false);
      return;
    }

    setProducts(data ?? []);
    setLoading(false);
  }

  async function addProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const cleanName = form.name.trim();
    const cleanProductCode = form.product_code.trim();

    if (!cleanName || !cleanProductCode) {
      setMessage("Ürün adı ve ürün kodu zorunlu.");
      setSaving(false);
      return;
    }

    const payload = {
      name: cleanName,
      product_code: cleanProductCode,
      category: form.category.trim() || null,
      description: form.description.trim() || null,
      price: Number(form.price || 0),
      stock: Number(form.stock || 0),
      min_stock: Number(form.min_stock || 0),
      image_url: form.image_url.trim() || null,
      qr_code: createQrCode(cleanProductCode),
      is_active: true,
    };

    const { error } = await supabase.from("products").insert(payload);

    if (error) {
      setMessage(`Ürün kaydedilemedi: ${error.message}`);
      setSaving(false);
      return;
    }

    setForm(emptyForm);
    setFormOpen(false);
    setSaving(false);
    setMessage("Ürün başarıyla eklendi.");
    await fetchProducts();
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-5 pb-8">
      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.07)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
              Gerçek Supabase Modülü
            </div>

            <h1 className="text-[32px] font-black leading-none tracking-[-0.05em] text-slate-950 sm:text-5xl">
              Ürünler
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Ürün kartlarını, stok seviyelerini, fiyatları ve QR bağlantılarını buradan yönet.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFormOpen((value) => !value)}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            {formOpen ? "Formu Kapat" : "Yeni Ürün Ekle"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-5">
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Toplam Ürün</p>
          <p className="mt-3 text-3xl font-black text-slate-950">{totalProducts}</p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Toplam Stok</p>
          <p className="mt-3 text-3xl font-black text-slate-950">{totalStock}</p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Kritik Stok</p>
          <p className="mt-3 text-3xl font-black text-red-600">{criticalStock}</p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Stok Değeri</p>
          <p className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      {formOpen ? (
        <form
          onSubmit={addProduct}
          className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.07)] sm:p-6"
        >
          <div className="mb-5">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">Yeni ürün ekle</h2>
            <p className="mt-1 text-sm text-slate-500">Bu bilgiler Supabase products tablosuna kaydedilecek.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Ürün Adı *</label>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Örn: Premium Kahve"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Ürün Kodu *</label>
              <input
                value={form.product_code}
                onChange={(event) => setForm({ ...form, product_code: event.target.value })}
                placeholder="Örn: TKP-001"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Kategori</label>
              <input
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                placeholder="Örn: Gıda, Promosyon, Etiket"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Görsel URL</label>
              <input
                value={form.image_url}
                onChange={(event) => setForm({ ...form, image_url: event.target.value })}
                placeholder="İsteğe bağlı ürün görseli"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Fiyat</label>
              <input
                type="number"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                placeholder="0"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Stok</label>
              <input
                type="number"
                value={form.stock}
                onChange={(event) => setForm({ ...form, stock: event.target.value })}
                placeholder="0"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Minimum Stok</label>
              <input
                type="number"
                value={form.min_stock}
                onChange={(event) => setForm({ ...form, min_stock: event.target.value })}
                placeholder="0"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Açıklama</label>
              <input
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Kısa ürün açıklaması"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Ürün kodundan otomatik QR bağlantısı üretilecek.
            </p>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-blue-600 disabled:opacity-60"
            >
              {saving ? "Kaydediliyor..." : "Ürünü Kaydet"}
            </button>
          </div>
        </form>
      ) : null}

      {message ? (
        <div className="rounded-[24px] border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
          {message}
        </div>
      ) : null}

      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.07)] sm:p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">Ürün Listesi</h2>
            <p className="mt-1 text-sm text-slate-500">Supabase products tablosundan canlı veri çekiliyor.</p>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ürün, kod veya kategori ara..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white lg:max-w-sm"
          />
        </div>

        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-[24px] bg-slate-100" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <h3 className="text-xl font-black text-slate-950">Henüz ürün yok</h3>
            <p className="mt-2 text-sm text-slate-500">
              İlk ürünü eklediğinde burada canlı olarak görünecek.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredProducts.map((product) => {
              const stock = Number(product.stock ?? 0);
              const minStock = Number(product.min_stock ?? 0);
              const isCritical = minStock > 0 && stock <= minStock;

              return (
                <div
                  key={product.id}
                  className="rounded-[28px] border border-slate-100 bg-slate-50 p-4 transition hover:bg-blue-50/60"
                >
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-black text-slate-950">{product.name}</h3>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 shadow-sm">
                          {product.product_code}
                        </span>
                        {isCritical ? (
                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">
                            Kritik stok
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                            Normal
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        {product.category || "Kategori yok"} · {product.description || "Açıklama eklenmedi"}
                      </p>

                      <p className="mt-2 text-xs font-bold text-slate-400">
                        QR: {product.qr_code || "QR yok"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                      <p className="text-xs font-black text-slate-400">Fiyat</p>
                      <p className="mt-1 font-black text-slate-950">{formatCurrency(product.price)}</p>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                      <p className="text-xs font-black text-slate-400">Stok</p>
                      <p className={["mt-1 font-black", isCritical ? "text-red-600" : "text-slate-950"].join(" ")}>
                        {stock}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                      <p className="text-xs font-black text-slate-400">Min</p>
                      <p className="mt-1 font-black text-slate-950">{minStock}</p>
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
