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

function createProductPrefix(productName: string) {
  const cleanedName = productName
    .trim()
    .toUpperCase()
    .replace(/Ğ/g, "G")
    .replace(/Ü/g, "U")
    .replace(/Ş/g, "S")
    .replace(/İ/g, "I")
    .replace(/İ/g, "I")
    .replace(/Ö/g, "O")
    .replace(/Ç/g, "C")
    .replace(/[^A-Z0-9]/g, "");

  const prefix = cleanedName.slice(0, 4);

  if (prefix.length >= 2) {
    return prefix.padEnd(4, "X");
  }

  return "URUN";
}

function createQrTarget(productCode: string) {
  if (typeof window === "undefined") {
    return `takipio://product/${productCode}`;
  }

  return `${window.location.origin}/app/products?code=${encodeURIComponent(productCode)}`;
}

function createQrImageUrl(productCode: string, size = 260) {
  const target = createQrTarget(productCode);

  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    target
  )}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  const [stockUpdatingId, setStockUpdatingId] = useState<string | null>(null);
  const [openQrId, setOpenQrId] = useState<string | null>(null);

  const existingCategories = useMemo(() => {
    const categorySet = new Set<string>();

    products.forEach((product) => {
      const category = product.category?.trim();

      if (category) {
        categorySet.add(category);
      }
    });

    return Array.from(categorySet).sort((a, b) => a.localeCompare(b, "tr"));
  }, [products]);

  const previewCode = useMemo(() => {
    if (editingId) {
      return form.product_code || "MEVCUT-KOD";
    }

    const prefix = createProductPrefix(form.name);

    return `${prefix}-001`;
  }, [editingId, form.name, form.product_code]);

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

  async function generateProductCode(productName: string) {
    const prefix = createProductPrefix(productName);

    const { data, error } = await supabase
      .from("products")
      .select("product_code")
      .like("product_code", `${prefix}-%`);

    if (error) {
      throw new Error(error.message);
    }

    const existingNumbers =
      data
        ?.map((item) => {
          const code = item.product_code ?? "";
          const numberPart = code.replace(`${prefix}-`, "");
          const parsedNumber = Number(numberPart);

          return Number.isFinite(parsedNumber) ? parsedNumber : 0;
        })
        .filter((number) => number > 0) ?? [];

    const nextNumber =
      existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

    return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
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

    const cleanName = form.name.trim();

    if (!cleanName) {
      setMessage("Ürün adı gerekli.");
      setSaving(false);
      return;
    }

    try {
      const finalProductCode = editingId
        ? form.product_code
        : await generateProductCode(cleanName);

      const payload = {
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
        const { error } = await supabase.from("products").insert(payload);

        if (error) {
          setMessage(error.message);
          setSaving(false);
          return;
        }

        setMessage(`${payload.product_code} kodlu ürün eklendi.`);
      }

      resetForm();
      setFormOpen(false);
      setSaving(false);

      await fetchProducts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "İşlem başarısız.");
      setSaving(false);
    }
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

    const previousProducts = products;

    setProducts((currentProducts) =>
      currentProducts.filter((product) => product.id !== id)
    );

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      setProducts(previousProducts);
      setMessage(error.message);
      return;
    }

    setMessage("Ürün silindi.");
  }

  async function updateStock(product: Product, amount: number) {
    const currentStock = Number(product.stock ?? 0);
    const nextStock = currentStock + amount;

    if (nextStock < 0) {
      return;
    }

    const previousProducts = products;

    setStockUpdatingId(product.id);

    setProducts((currentProducts) =>
      currentProducts.map((item) => {
        if (item.id !== product.id) {
          return item;
        }

        return {
          ...item,
          stock: nextStock,
        };
      })
    );

    const { error } = await supabase
      .from("products")
      .update({
        stock: nextStock,
      })
      .eq("id", product.id);

    if (error) {
      setProducts(previousProducts);
      setMessage(error.message);
      setStockUpdatingId(null);
      return;
    }

    setStockUpdatingId(null);
  }

  function printQrLabel(product: Product) {
    const productCode = product.product_code;
    const productName = product.name;
    const qrImage = createQrImageUrl(productCode, 320);
    const qrTarget = createQrTarget(productCode);

    const printWindow = window.open("", "_blank", "width=520,height=720");

    if (!printWindow) {
      setMessage("Yazdırma penceresi açılamadı. Tarayıcı popup engelini kontrol et.");
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(productName)} QR Etiketi</title>
          <meta charset="utf-8" />
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #f8fafc;
              font-family: Arial, Helvetica, sans-serif;
              color: #0f172a;
            }

            .label {
              width: 360px;
              min-height: 500px;
              border: 1px solid #e2e8f0;
              border-radius: 28px;
              background: white;
              padding: 28px;
              text-align: center;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              box-shadow: 0 22px 70px rgba(15, 23, 42, 0.12);
            }

            .product-name {
              font-size: 24px;
              font-weight: 900;
              letter-spacing: -0.04em;
              margin: 0;
            }

            .product-code {
              margin: 8px 0 0;
              font-size: 14px;
              font-weight: 800;
              color: #2563eb;
            }

            .qr {
              width: 280px;
              height: 280px;
              margin: 24px auto;
            }

            .footer {
              border-top: 1px solid #e2e8f0;
              padding-top: 18px;
              font-size: 13px;
              color: #64748b;
            }

            .brand {
              display: block;
              margin-top: 4px;
              color: #2563eb;
              font-weight: 900;
              font-size: 18px;
            }

            .target {
              margin-top: 8px;
              font-size: 10px;
              color: #94a3b8;
              word-break: break-all;
            }

            @media print {
              body {
                background: white;
              }

              .label {
                box-shadow: none;
              }
            }
          </style>
        </head>

        <body>
          <div class="label">
            <div>
              <h1 class="product-name">${escapeHtml(productName)}</h1>
              <p class="product-code">${escapeHtml(productCode)}</p>
            </div>

            <img class="qr" src="${qrImage}" alt="QR Kod" />

            <div class="footer">
              Powered by
              <span class="brand">Takipio</span>
              <div class="target">${escapeHtml(qrTarget)}</div>
            </div>
          </div>

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
              }, 450);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  async function downloadQrImage(product: Product) {
    try {
      const qrImageUrl = createQrImageUrl(product.product_code, 420);
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${product.product_code}-qr.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(objectUrl);
    } catch {
      setMessage("QR indirilemedi. Tekrar dene.");
    }
  }

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
              Ürün ekle, kategorileri tekrar yazmadan seç, stokları canlı artır/azalt ve ürün QR etiketlerini yazdır.
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            Stok Değeri
          </p>
          <p className="mt-3 text-2xl font-black text-slate-950">
            {formatCurrency(totalValue)}
          </p>
        </div>
      </div>

      {formOpen ? (
        <form
          onSubmit={saveProduct}
          className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.07)]"
        >
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                {editingId ? "Ürün Düzenle" : "Yeni Ürün"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Ürün kodu otomatik oluşturulur. Kategoriyi yazabilir veya daha önce girilenden seçebilirsin.
              </p>
            </div>

            <div className="rounded-[22px] bg-slate-950 px-4 py-3 text-white">
              <p className="text-xs font-bold text-slate-300">
                {editingId ? "Mevcut Kod" : "Tahmini Kod"}
              </p>
              <p className="mt-1 text-lg font-black">{previewCode}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Ürün Adı *
              </label>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Örn: Hoparlör"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Kategori
              </label>

              <input
                list="takipio-product-categories"
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
                placeholder={
                  existingCategories.length > 0
                    ? "Kategori yaz veya seç"
                    : "Örn: Elektronik"
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <datalist id="takipio-product-categories">
                {existingCategories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>

              {existingCategories.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {existingCategories.slice(0, 6).map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setForm({ ...form, category })}
                      className={[
                        "rounded-full px-3 py-1 text-xs font-black transition",
                        form.category === category
                          ? "bg-blue-600 text-white"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100",
                      ].join(" ")}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Fiyat
              </label>
              <input
                value={form.price}
                type="number"
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                placeholder="0"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Stok
              </label>
              <input
                value={form.stock}
                type="number"
                onChange={(event) => setForm({ ...form, stock: event.target.value })}
                placeholder="0"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Minimum Stok
              </label>
              <input
                value={form.min_stock}
                type="number"
                onChange={(event) =>
                  setForm({ ...form, min_stock: event.target.value })
                }
                placeholder="0"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Görsel URL
              </label>
              <input
                value={form.image_url}
                onChange={(event) =>
                  setForm({ ...form, image_url: event.target.value })
                }
                placeholder="İsteğe bağlı"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-black text-slate-700">
                Açıklama
              </label>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Ürün açıklaması"
                className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-600 disabled:opacity-60"
            >
              {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Ürün Ekle"}
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
            <h2 className="text-2xl font-black text-slate-950">Ürün Listesi</h2>
            <p className="mt-1 text-sm text-slate-500">
              Stok + / - işlemleri sayfa yenilemeden canlı güncellenir. QR kartını açarak yazdırabilir veya indirebilirsin.
            </p>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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
            <p className="mt-2 text-sm text-slate-500">
              Yeni ürün eklediğinde burada görünecek.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredProducts.map((product) => {
              const stock = Number(product.stock ?? 0);
              const minStock = Number(product.min_stock ?? 0);
              const critical = minStock > 0 && stock <= minStock;
              const qrImageUrl = createQrImageUrl(product.product_code, 240);
              const qrIsOpen = openQrId === product.id;

              return (
                <div
                  key={product.id}
                  className="rounded-[28px] border border-slate-100 bg-slate-50 p-4 transition hover:bg-blue-50/60"
                >
                  <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto] xl:items-start">
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

                      <p className="mt-2 break-all text-xs font-bold text-slate-400">
                        QR hedefi: {createQrTarget(product.product_code)}
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

                        <button
                          type="button"
                          onClick={() =>
                            setOpenQrId(qrIsOpen ? null : product.id)
                          }
                          className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white"
                        >
                          {qrIsOpen ? "QR Kapat" : "QR Gör"}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-row gap-3 xl:flex-col">
                      <div className="flex-1 rounded-2xl bg-white px-4 py-3 shadow-sm">
                        <p className="text-xs font-black text-slate-400">Fiyat</p>
                        <p className="mt-1 font-black text-slate-950">
                          {formatCurrency(product.price)}
                        </p>
                      </div>

                      <div className="flex-1 rounded-2xl bg-white px-4 py-3 shadow-sm">
                        <p className="text-xs font-black text-slate-400">
                          Min Stok
                        </p>
                        <p className="mt-1 font-black text-slate-950">{minStock}</p>
                      </div>
                    </div>

                    <div className="rounded-[24px] bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-4 xl:block">
                        <div>
                          <p className="text-xs font-black text-slate-400">Stok</p>

                          <p
                            className={[
                              "mt-2 text-3xl font-black",
                              critical ? "text-red-600" : "text-slate-950",
                            ].join(" ")}
                          >
                            {stock}
                          </p>
                        </div>

                        <div className="flex gap-2 xl:mt-4">
                          <button
                            type="button"
                            disabled={stockUpdatingId === product.id}
                            onClick={() => updateStock(product, -1)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-lg font-black text-red-600 disabled:opacity-50"
                          >
                            -
                          </button>

                          <button
                            type="button"
                            disabled={stockUpdatingId === product.id}
                            onClick={() => updateStock(product, 1)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg font-black text-emerald-700 disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {qrIsOpen ? (
                    <div className="mt-4 grid gap-4 rounded-[26px] border border-blue-100 bg-white p-4 lg:grid-cols-[280px_1fr]">
                      <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4 text-center">
                        <p className="text-lg font-black text-slate-950">
                          {product.name}
                        </p>

                        <p className="mt-1 text-sm font-black text-blue-600">
                          {product.product_code}
                        </p>

                        <img
                          src={qrImageUrl}
                          alt={`${product.name} QR kodu`}
                          className="mx-auto mt-4 h-[220px] w-[220px] rounded-2xl bg-white p-2"
                        />

                        <p className="mt-3 text-xs text-slate-400">
                          Powered by Takipio
                        </p>
                      </div>

                      <div className="flex flex-col justify-between gap-4">
                        <div>
                          <h4 className="text-xl font-black text-slate-950">
                            QR Etiket İşlemleri
                          </h4>

                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            Bu QR etiketi yazdırabilir, tarayıcıdan PDF olarak kaydedebilir veya PNG olarak indirebilirsin.
                            PDF indirmek için açılan yazdırma ekranında “PDF olarak kaydet” seçeneğini kullan.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => printQrLabel(product)}
                            className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700"
                          >
                            Yazdır / PDF
                          </button>

                          <button
                            type="button"
                            onClick={() => downloadQrImage(product)}
                            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-100 transition hover:bg-slate-800"
                          >
                            QR PNG İndir
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                createQrTarget(product.product_code)
                              )
                            }
                            className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
                          >
                            Link Kopyala
                          </button>
                        </div>
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
