"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function createQrCode(productCode: string) {
  return `takipio://product/${productCode}`;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();

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

  async function fetchProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setProducts(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    const payload = {
      name: form.name.trim(),
      product_code: form.product_code.trim(),
      category: form.category.trim() || null,
      description: form.description.trim() || null,
      price: Number(form.price || 0),
      stock: Number(form.stock || 0),
      min_stock: Number(form.min_stock || 0),
      image_url: form.image_url.trim() || null,
      qr_code: createQrCode(form.product_code.trim()),
      is_active: true,
    };

    if (!payload.name || !payload.product_code) {
      setMessage("Ürün adı ve ürün kodu gerekli.");
      setSaving(false);
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }

      setMessage("Ürün güncellendi.");
    } else {
      const { error } = await supabase
        .from("products")
        .insert(payload);

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }

      setMessage("Ürün eklendi.");
    }

    resetForm();
    setFormOpen(false);
    setSaving(false);

    await fetchProducts();
  }

  function editProduct(product: Product) {
    setEditingId(product.id);

    setForm({
      name: product.name ?? "",
      product_code: product.product_code ?? "",
      category: product.category ?? "",
      description: product.description ?? "",
      price: String(product.price ?? 0),
      stock: String(product.stock ?? 0),
      min_stock: String(product.min_stock ?? 0),
      image_url: product.image_url ?? "",
    });

    setFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteProduct(id: string) {
    const confirmed = window.confirm("Ürün silinsin mi?");

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Ürün silindi.");

    await fetchProducts();
  }

  async function updateStock(product: Product, amount: number) {
    const currentStock = Number(product.stock ?? 0);

    const nextStock = currentStock + amount;

    if (nextStock < 0) {
      return;
    }

    const { error } = await supabase
      .from("products")
      .update({
        stock: nextStock,
      })
      .eq("id", product.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await fetchProducts();
  }

  const totalProducts = products.length;

  const totalStock = products.reduce((sum, product) => {
    return sum + Number(product.stock ?? 0);
  }, 0);

  const criticalStock = products.filter((product) => {
    return Number(product.stock ?? 0) <= Number(product.min_stock ?? 0);
  }).length;

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-5 pb-8">
      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.07)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
              Takipio Products
            </div>

            <h1 className="text-[32px] font-black tracking-[-0.05em] text-slate-950 sm:text-5xl">
              Ürün Yönetimi
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Gerçek Supabase ürün sistemi. Ürün ekle, düzenle, sil ve stok yönet.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormOpen(!formOpen);

              if (formOpen) {
                resetForm();
              }
            }}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
          >
            {formOpen ? "Kapat" : "Yeni Ürün"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            Toplam Ürün
          </p>
          <p className="mt-3 text-3xl font-black text-slate-950">
            {totalProducts}
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            Toplam Stok
          </p>
          <p className="mt-3 text-3xl font-black text-slate-950">
            {totalStock}
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            Kritik Stok
          </p>
          <p className="mt-3 text-3xl font-black text-red-600">
            {criticalStock}
          </p>
        </div>
      </div>

      {formOpen ? (
        <form
          onSubmit={saveProduct}
          className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.07)]"
        >
          <div className="mb-5">
            <h2 className="text-2xl font-black text-slate-950">
              {editingId ? "Ürün Düzenle" : "Yeni Ürün"}
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ürün adı"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            <input
              value={form.product_code}
              onChange={(e) => setForm({ ...form, product_code: e.target.value })}
              placeholder="Ürün kodu"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Kategori"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            <input
              value={form.price}
              type="number"
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Fiyat"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            <input
              value={form.stock}
              type="number"
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              placeholder="Stok"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            <input
              value={form.min_stock}
              type="number"
              onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
              placeholder="Minimum stok"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            <input
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="Görsel URL"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 lg:col-span-2"
            />

            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Açıklama"
              className="min-h-[120px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 lg:col-span-2"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-600 disabled:opacity-60"
            >
              {saving
                ? "Kaydediliyor..."
                : editingId
                ? "Güncelle"
                : "Ürün Ekle"}
            </button>

            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setFormOpen(false);
                }}
                className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700"
              >
                İptal
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      {message ? (
        <div className="rounded-[24px] border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
          {message}
        </div>
      ) : null}

      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.07)]">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              Ürün Listesi
            </h2>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ürün ara..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 lg:max-w-sm"
          />
        </div>

        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-[24px] bg-slate-100"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
            <h3 className="text-xl font-black text-slate-950">
              Ürün bulunamadı
            </h3>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredProducts.map((product) => {
              const stock = Number(product.stock ?? 0);
              const minStock = Number(product.min_stock ?? 0);

              const critical = stock <= minStock;

              return (
                <div
                  key={product.id}
                  className="rounded-[28px] border border-slate-100 bg-slate-50 p-4 transition hover:bg-blue-50/60"
                >
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-black text-slate-950">
                          {product.name}
                        </h3>

                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 shadow-sm">
                          {product.product_code}
                        </span>

                        {critical ? (
                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">
                            Kritik
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                            Normal
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        {product.category || "Kategori yok"}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        {product.description || "Açıklama yok"}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => editProduct(product)}
                          className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white"
                        >
                          Düzenle
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteProduct(product.id)}
                          className="rounded-xl bg-red-500 px-3 py-2 text-xs font-black text-white"
                        >
                          Sil
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                        <p className="text-xs font-black text-slate-400">
                          Fiyat
                        </p>

                        <p className="mt-1 font-black text-slate-950">
                          {formatCurrency(product.price)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                        <p className="text-xs font-black text-slate-400">
                          Min Stok
                        </p>

                        <p className="mt-1 font-black text-slate-950">
                          {minStock}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[24px] bg-white p-4 shadow-sm">
                      <p className="text-xs font-black text-slate-400">
                        Stok
                      </p>

                      <p
                        className={[
                          "mt-2 text-3xl font-black",
                          critical ? "text-red-600" : "text-slate-950",
                        ].join(" ")}
                      >
                        {stock}
                      </p>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateStock(product, -1)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-lg font-black text-red-600"
                        >
                          -
                        </button>

                        <button
                          type="button"
                          onClick={() => updateStock(product, 1)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg font-black text-emerald-700"
                        >
                          +
                        </button>
                      </div>
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
