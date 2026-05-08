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
  if (status === "paid") return "bg-emerald-400/15 text-emerald-300";
  if (status === "partial") return "bg-amber-400/15 text-amber-300";
  if (status === "cancelled") return "bg-red-400/15 text-red-300";
  return "bg-blue-400/15 text-blue-300";
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
    return Number(form.quantity || 0) * Number(form.unit_price || 0);
  }, [form.quantity, form.unit_price]);

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sales;

    return sales.filter((sale) => {
      return (
        (sale.product_name ?? "").toLowerCase().includes(query) ||
        (sale.product_code ?? "").toLowerCase().includes(query) ||
        (sale.customer_name ?? "").toLowerCase().includes(query)
      );
    });
  }, [sales, search]);

  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_price ?? 0), 0);
  const paidRevenue = sales.filter((sale) => sale.payment_status === "paid").reduce((sum, sale) => sum + Number(sale.total_price ?? 0), 0);
  const pendingRevenue = sales.filter((sale) => sale.payment_status !== "paid").reduce((sum, sale) => sum + Number(sale.total_price ?? 0), 0);
  const totalQuantity = sales.reduce((sum, sale) => sum + Number(sale.quantity ?? 0), 0);

  async function fetchData() {
    setLoading(true);
    setMessage("");

    const [productsResult, salesResult] = await Promise.all([
      supabase.from("products").select("id, name, product_code, price, stock, min_stock, category").order("created_at", { ascending: false }),
      supabase.from("sales").select("*").order("created_at", { ascending: false }),
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

    const { error: saleError } = await supabase.from("sales").insert(salePayload);
    if (saleError) {
      setMessage(`Satış kaydedilemedi: ${saleError.message}`);
      setSaving(false);
      return;
    }

    const { error: productError } = await supabase.from("products").update({ stock: nextStock }).eq("id", selectedProduct.id);
    if (productError) {
      setMessage(`Satış kaydedildi ama stok düşülemedi: ${productError.message}`);
      setSaving(false);
      await fetchData();
      return;
    }

    await supabase.from("stock_movements").insert({
      product_id: selectedProduct.id,
      product_code: selectedProduct.product_code,
      product_name: selectedProduct.name,
      movement_type: "stock_out",
      quantity,
      note: `Satış yapıldı${form.customer_name.trim() ? ` - ${form.customer_name.trim()}` : ""}`,
    });

    setMessage("Satış başarıyla oluşturuldu.");
    setForm(emptyForm);
    setFormOpen(false);
    setSaving(false);
    await fetchData();
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5 shadow-[0_24px_80px_rgba(2,6,23,0.22)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Takipio Sales
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">
              Satışlar
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Ürün seç, satış oluştur, stok otomatik düşsün ve hareket geçmişi kaydedilsin.
            </p>
          </div>

          <button
            onClick={() => setFormOpen((value) => !value)}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-500"
          >
            {formOpen ? "Formu Kapat" : "Yeni Satış"}
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Toplam Ciro" value={formatCurrency(totalRevenue)} valueClass="text-white" />
        <MetricCard label="Tahsil Edilen" value={formatCurrency(paidRevenue)} valueClass="text-emerald-300" />
        <MetricCard label="Bekleyen" value={formatCurrency(pendingRevenue)} valueClass="text-amber-300" />
        <MetricCard label="Satılan Adet" value={String(totalQuantity)} valueClass="text-white" />
      </div>

      {formOpen ? (
        <form onSubmit={createSale} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">Yeni Satış Oluştur</h2>
              <p className="mt-1 text-sm text-slate-400">Stok otomatik düşer ve satış geçmişine kaydolur.</p>
            </div>
            <div className="rounded-2xl bg-[#0b1220] px-4 py-3 text-right ring-1 ring-white/10">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Önizleme</p>
              <p className="mt-1 text-lg font-black text-blue-300">{formatCurrency(salePreview)}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Ürün">
              <select
                value={form.product_id}
                onChange={(event) => selectProduct(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none"
              >
                <option value="">Ürün seç</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.product_code}) - Stok: {product.stock ?? 0}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Müşteri Adı">
              <input
                value={form.customer_name}
                onChange={(event) => setForm((current) => ({ ...current, customer_name: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none"
                placeholder="Müşteri adı"
              />
            </Field>

            <Field label="Satış Adedi">
              <input
                value={form.quantity}
                onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
                type="number"
                min="1"
                className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none"
              />
            </Field>

            <Field label="Birim Fiyat">
              <input
                value={form.unit_price}
                onChange={(event) => setForm((current) => ({ ...current, unit_price: event.target.value }))}
                type="number"
                min="0"
                className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none"
              />
            </Field>

            <Field label="Ödeme Durumu">
              <select
                value={form.payment_status}
                onChange={(event) => setForm((current) => ({ ...current, payment_status: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none"
              >
                <option value="pending">Bekliyor</option>
                <option value="partial">Kısmi</option>
                <option value="paid">Ödendi</option>
                <option value="cancelled">İptal</option>
              </select>
            </Field>

            <Field label="Not">
              <input
                value={form.note}
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none"
                placeholder="İsteğe bağlı not"
              />
            </Field>
          </div>

          {selectedProduct ? (
            <div className="mt-4 rounded-2xl bg-[#0b1220] p-4 ring-1 ring-white/10">
              <p className="text-sm font-black">{selectedProduct.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                Kod: {selectedProduct.product_code} · Kategori: {selectedProduct.category || "-"} · Mevcut stok: {selectedProduct.stock ?? 0}
              </p>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <button disabled={saving} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-60">
              {saving ? "Kaydediliyor..." : "Satışı Kaydet"}
            </button>
            <button type="button" onClick={() => { setForm(emptyForm); setFormOpen(false); }} className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-slate-200">
              Vazgeç
            </button>
          </div>
        </form>
      ) : null}

      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black">Satış Geçmişi</h2>
            <p className="mt-1 text-sm text-slate-400">Oluşturulan satışlar ve ödeme durumları.</p>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Satış ara..."
            className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none placeholder:text-slate-500 lg:w-[320px]"
          />
        </div>

        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-[24px] bg-white/5" />
            ))}
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0b1220] p-10 text-center">
            <h3 className="text-xl font-black">Satış bulunamadı</h3>
            <p className="mt-2 text-sm text-slate-500">İlk satışı oluşturduğunda burada gözükecek.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredSales.map((sale) => (
              <div key={sale.id} className="rounded-[22px] border border-white/10 bg-[#0b1220] p-4 transition hover:bg-[#101a31]">
                <div className="grid gap-4 xl:grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr_auto] xl:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-black">{sale.product_name || "Ürün yok"}</h3>
                      <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-black text-slate-400">{sale.product_code || "-"}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{sale.customer_name || "Müşteri adı girilmedi"}</p>
                    {sale.note ? <p className="mt-2 text-xs text-slate-500">{sale.note}</p> : null}
                    <p className="mt-2 text-xs font-bold text-slate-500">{formatDate(sale.created_at)}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Adet</p>
                    <p className="mt-1 text-2xl font-black text-blue-300">{sale.quantity ?? 0}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Birim</p>
                    <p className="mt-1 text-lg font-black">{formatCurrency(sale.unit_price)}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Toplam</p>
                    <p className="mt-1 text-lg font-black">{formatCurrency(sale.total_price)}</p>
                  </div>

                  <div>
                    <span className={["rounded-full px-4 py-2 text-xs font-black", paymentClass(sale.payment_status)].join(" ")}>
                      {paymentLabel(sale.payment_status)}
                    </span>
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

function MetricCard({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
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
