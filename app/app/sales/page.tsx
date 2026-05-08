"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Product = {
  id: string;
  name: string;
  product_code: string;
  price: number | null;
  stock: number | null;
  min_stock: number | null;
  category: string | null;
};

type Sale = {
  id: string;
  product_id: string | null;
  product_code: string | null;
  product_name: string | null;
  customer_name: string | null;
  quantity: number | null;
  unit_price: number | null;
  total_price: number | null;
  payment_status: string | null;
  sale_status: string | null;
  note: string | null;
  created_at: string;
};

type SaleForm = {
  product_id: string;
  customer_name: string;
  quantity: string;
  unit_price: string;
  payment_status: string;
  note: string;
};

const emptyForm: SaleForm = {
  product_id: "",
  customer_name: "",
  quantity: "1",
  unit_price: "",
  payment_status: "pending",
  note: "",
};

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function paymentLabel(status: string | null) {
  if (status === "paid") return "Ödendi";
  if (status === "partial") return "Kısmi";
  if (status === "cancelled") return "İptal";
  return "Bekliyor";
}

function paymentClass(status: string | null) {
  if (status === "paid") return "bg-emerald-50 text-emerald-700";
  if (status === "partial") return "bg-amber-50 text-amber-700";
  if (status === "cancelled") return "bg-red-50 text-red-600";
  return "bg-blue-50 text-blue-700";
}

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [form, setForm] = useState<SaleForm>(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedProduct = useMemo(() => {
    return products.find((product) => product.id === form.product_id) ?? null;
  }, [products, form.product_id]);

  const salePreview = useMemo(() => {
    const quantity = Number(form.quantity || 0);
    const unitPrice = Number(form.unit_price || 0);

    return quantity * unitPrice;
  }, [form.quantity, form.unit_price]);

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return sales;
    }

    return sales.filter((sale) => {
      return (
        (sale.product_name ?? "").toLowerCase().includes(query) ||
        (sale.product_code ?? "").toLowerCase().includes(query) ||
        (sale.customer_name ?? "").toLowerCase().includes(query)
      );
    });
  }, [sales, search]);

  const totalRevenue = sales.reduce((sum, sale) => {
    return sum + Number(sale.total_price ?? 0);
  }, 0);

  const paidRevenue = sales
    .filter((sale) => sale.payment_status === "paid")
    .reduce((sum, sale) => sum + Number(sale.total_price ?? 0), 0);

  const pendingRevenue = sales
    .filter((sale) => sale.payment_status !== "paid")
    .reduce((sum, sale) => sum + Number(sale.total_price ?? 0), 0);

  const totalQuantity = sales.reduce((sum, sale) => {
    return sum + Number(sale.quantity ?? 0);
  }, 0);

  async function fetchData() {
    setLoading(true);
    setMessage("");

    const [productsResult, salesResult] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, product_code, price, stock, min_stock, category")
        .order("created_at", { ascending: false }),

      supabase
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (productsResult.error) {
      setMessage(`Ürünler alınamadı: ${productsResult.error.message}`);
      setLoading(false);
      return;
    }

    if (salesResult.error) {
      setMessage(`Satışlar alınamadı: ${salesResult.error.message}`);
      setLoading(false);
      return;
    }

    setProducts(productsResult.data ?? []);
    setSales(salesResult.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

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

    setSaving(true);
    setMessage("");

    if (!selectedProduct) {
      setMessage("Önce ürün seçmelisin.");
      setSaving(false);
      return;
    }

    const quantity = Number(form.quantity || 0);
    const unitPrice = Number(form.unit_price || 0);
    const currentStock = Number(selectedProduct.stock ?? 0);
    const nextStock = currentStock - quantity;

    if (quantity <= 0) {
      setMessage("Satış adedi 1 veya daha büyük olmalı.");
      setSaving(false);
      return;
    }

    if (nextStock < 0) {
      setMessage(`Yetersiz stok. Mevcut stok: ${currentStock}`);
      setSaving(false);
      return;
    }

    const totalPrice = quantity * unitPrice;

    const salePayload = {
      product_id: selectedProduct.id,
      product_code: selectedProduct.product_code,
      product_name: selectedProduct.name,
      customer_name: form.customer_name.trim() || null,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      payment_status: form.payment_status,
      sale_status: "completed",
      note: form.note.trim() || null,
    };

    const { data: saleData, error: saleError } = await supabase
      .from("sales")
      .insert(salePayload)
      .select("*")
      .single();

    if (saleError) {
      setMessage(`Satış kaydedilemedi: ${saleError.message}`);
      setSaving(false);
      return;
    }

    const { error: productError } = await supabase
      .from("products")
      .update({
        stock: nextStock,
      })
      .eq("id", selectedProduct.id);

    if (productError) {
      setMessage(`Satış kaydedildi ama stok düşülemedi: ${productError.message}`);
      setSaving(false);
      await fetchData();
      return;
    }

    const { error: movementError } = await supabase
      .from("stock_movements")
      .insert({
        product_id: selectedProduct.id,
        product_code: selectedProduct.product_code,
        product_name: selectedProduct.name,
        movement_type: "stock_out",
        quantity,
        note: `Satış kaynaklı stok çıkışı${saleData?.id ? ` · ${saleData.id}` : ""}`,
      });

    if (movementError) {
      setMessage(`Satış ve stok kaydedildi ama hareket geçmişi yazılamadı: ${movementError.message}`);
      setSaving(false);
      await fetchData();
      return;
    }

    setProducts((currentProducts) =>
      currentProducts.map((product) => {
        if (product.id !== selectedProduct.id) {
          return product;
        }

        return {
          ...product,
          stock: nextStock,
        };
      })
    );

    if (saleData) {
      setSales((currentSales) => [saleData, ...currentSales]);
    }

    setForm(emptyForm);
    setFormOpen(false);
    setSaving(false);
    setMessage("Satış kaydedildi, stoktan düşüldü ve hareket geçmişine yazıldı.");
  }

  async function deleteSale(sale: Sale) {
    const confirmed = window.confirm(
      "Bu satış silinsin mi? Not: Bu işlem şimdilik stoğu geri eklemez."
    );

    if (!confirmed) {
      return;
    }

    const previousSales = sales;

    setSales((currentSales) => currentSales.filter((item) => item.id !== sale.id));

    const { error } = await supabase.from("sales").delete().eq("id", sale.id);

    if (error) {
      setSales(previousSales);
      setMessage(error.message);
      return;
    }

    setMessage("Satış silindi. Stok geri ekleme özelliğini ayrıca bağlayacağız.");
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-5 pb-10">
      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
              Takipio Sales
            </div>

            <h1 className="text-[34px] font-black tracking-[-0.05em] text-slate-950 sm:text-5xl">
              Satışlar
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Ürün seç, satış oluştur, stok otomatik düşsün ve hareket geçmişi kaydedilsin.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFormOpen((value) => !value)}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            {formOpen ? "Formu Kapat" : "Yeni Satış"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            Toplam Ciro
          </p>

          <p className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">
            {formatCurrency(totalRevenue)}
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            Tahsil Edilen
          </p>

          <p className="mt-3 text-2xl font-black text-emerald-600 sm:text-3xl">
            {formatCurrency(paidRevenue)}
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            Bekleyen
          </p>

          <p className="mt-3 text-2xl font-black text-amber-600 sm:text-3xl">
            {formatCurrency(pendingRevenue)}
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            Satılan Adet
          </p>

          <p className="mt-3 text-3xl font-black text-slate-950">
            {totalQuantity}
          </p>
        </div>
      </div>

      {formOpen ? (
        <form
          onSubmit={createSale}
          className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.06)]"
        >
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                Yeni satış oluştur
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Satış kaydı oluşunca seçilen ürünün stoğu otomatik düşer.
              </p>
            </div>

            <div className="rounded-[22px] bg-slate-950 px-4 py-3 text-white">
              <p className="text-xs font-bold text-slate-300">Satış Tutarı</p>
              <p className="mt-1 text-lg font-black">
                {formatCurrency(salePreview)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Ürün *
              </label>

              <select
                value={form.product_id}
                onChange={(event) => selectProduct(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Ürün seç</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} · {product.product_code} · Stok: {product.stock ?? 0}
                  </option>
                ))}
              </select>

              {selectedProduct ? (
                <p className="mt-2 text-xs font-bold text-slate-500">
                  Mevcut stok: {selectedProduct.stock ?? 0} · Birim fiyat:{" "}
                  {formatCurrency(selectedProduct.price)}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Müşteri Adı
              </label>

              <input
                value={form.customer_name}
                onChange={(event) =>
                  setForm({ ...form, customer_name: event.target.value })
                }
                placeholder="Örn: Kutluk Promosyon"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Adet
              </label>

              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(event) =>
                  setForm({ ...form, quantity: event.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Birim Fiyat
              </label>

              <input
                type="number"
                value={form.unit_price}
                onChange={(event) =>
                  setForm({ ...form, unit_price: event.target.value })
                }
                placeholder="0"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Ödeme Durumu
              </label>

              <select
                value={form.payment_status}
                onChange={(event) =>
                  setForm({ ...form, payment_status: event.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="pending">Bekliyor</option>
                <option value="paid">Ödendi</option>
                <option value="partial">Kısmi</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Not
              </label>

              <input
                value={form.note}
                onChange={(event) => setForm({ ...form, note: event.target.value })}
                placeholder="İsteğe bağlı"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-600 disabled:opacity-60"
            >
              {saving ? "Kaydediliyor..." : "Satışı Kaydet"}
            </button>

            <button
              type="button"
              onClick={() => {
                setForm(emptyForm);
                setFormOpen(false);
              }}
              className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700"
            >
              İptal
            </button>
          </div>
        </form>
      ) : null}

      {message ? (
        <div className="rounded-[24px] border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
          {message}
        </div>
      ) : null}

      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              Satış Geçmişi
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Oluşturulan satışlar ve ödeme durumları.
            </p>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Satış ara..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 lg:max-w-sm"
          />
        </div>

        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-[24px] bg-slate-100" />
            ))}
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
            <h3 className="text-xl font-black text-slate-950">
              Satış bulunamadı
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              İlk satışı oluşturduğunda burada gözükecek.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredSales.map((sale) => (
              <div
                key={sale.id}
                className="rounded-[26px] border border-slate-100 bg-slate-50 p-4 transition hover:bg-blue-50/60"
              >
                <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-black text-slate-950">
                        {sale.product_name || "Ürün yok"}
                      </h3>

                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500">
                        {sale.product_code || "-"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      {sale.customer_name || "Müşteri adı girilmedi"}
                    </p>

                    <p className="mt-2 text-xs font-bold text-slate-400">
                      {formatDate(sale.created_at)}
                    </p>

                    {sale.note ? (
                      <p className="mt-2 text-xs text-slate-400">
                        Not: {sale.note}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <p className="text-xs font-black text-slate-400">Adet</p>
                    <p className="mt-1 font-black text-slate-950">
                      {sale.quantity ?? 0}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <p className="text-xs font-black text-slate-400">Tutar</p>
                    <p className="mt-1 font-black text-slate-950">
                      {formatCurrency(sale.total_price)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span
                      className={[
                        "rounded-full px-3 py-2 text-center text-xs font-black",
                        paymentClass(sale.payment_status),
                      ].join(" ")}
                    >
                      {paymentLabel(sale.payment_status)}
                    </span>

                    <button
                      type="button"
                      onClick={() => deleteSale(sale)}
                      className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-black text-red-600 transition hover:bg-red-100"
                    >
                      Sil
                    </button>
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
