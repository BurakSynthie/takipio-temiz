"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Product = {
  id: string;
  name: string;
  product_code: string;
  category: string | null;
  price: number | null;
  stock: number | null;
  min_stock: number | null;
  created_at: string;
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

type StockMovement = {
  id: string;
  product_id: string | null;
  product_code: string | null;
  product_name: string | null;
  movement_type: string | null;
  quantity: number | null;
  note: string | null;
  created_at: string;
};

const integrations = [
  { name: "Trendyol", logo: "/trendyol.png", status: "Hazır", sync: "Demo bağlantı", score: "92%" },
  { name: "Hepsiburada", logo: "/hepsiburada.png", status: "Kontrol", sync: "Demo bağlantı", score: "76%" },
  { name: "Amazon", logo: "/amazon.png", status: "Planlandı", sync: "Demo bağlantı", score: "48%" },
  { name: "ÇiçekSepeti", logo: "/ciceksepeti.png", status: "Yakında", sync: "Demo bağlantı", score: "34%" },
];

const quickActions = [
  { href: "/app/products", label: "Ürün Ekle", desc: "Yeni ürün kartı", icon: "◈" },
  { href: "/app/sales", label: "Satış Oluştur", desc: "Stoktan düşer", icon: "₺" },
  { href: "/app/stock", label: "Stok Geçmişi", desc: "Giriş / çıkış", icon: "▤" },
  { href: "/app/qr", label: "QR Etiket", desc: "Yazdır / PDF", icon: "⌗" },
];

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

function isToday(date: string) {
  const input = new Date(date);
  const now = new Date();

  return (
    input.getFullYear() === now.getFullYear() &&
    input.getMonth() === now.getMonth() &&
    input.getDate() === now.getDate()
  );
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

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function fetchDashboardData() {
    setLoading(true);
    setMessage("");

    const [productsResult, salesResult, movementsResult] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, product_code, category, price, stock, min_stock, created_at")
        .order("created_at", { ascending: false }),

      supabase
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("stock_movements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    if (productsResult.error) {
      setMessage(`Ürün verisi alınamadı: ${productsResult.error.message}`);
      setLoading(false);
      return;
    }

    if (salesResult.error) {
      setMessage(`Satış verisi alınamadı: ${salesResult.error.message}`);
      setLoading(false);
      return;
    }

    if (movementsResult.error) {
      setMessage(`Stok hareketleri alınamadı: ${movementsResult.error.message}`);
      setLoading(false);
      return;
    }

    setProducts(productsResult.data ?? []);
    setSales(salesResult.data ?? []);
    setMovements(movementsResult.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalProducts = products.length;

  const totalStock = products.reduce((sum, product) => {
    return sum + Number(product.stock ?? 0);
  }, 0);

  const stockValue = products.reduce((sum, product) => {
    return sum + Number(product.price ?? 0) * Number(product.stock ?? 0);
  }, 0);

  const criticalProducts = products.filter((product) => {
    const stock = Number(product.stock ?? 0);
    const minStock = Number(product.min_stock ?? 0);

    return minStock > 0 && stock <= minStock;
  });

  const totalRevenue = sales.reduce((sum, sale) => {
    return sum + Number(sale.total_price ?? 0);
  }, 0);

  const todayRevenue = sales
    .filter((sale) => isToday(sale.created_at))
    .reduce((sum, sale) => {
      return sum + Number(sale.total_price ?? 0);
    }, 0);

  const pendingRevenue = sales
    .filter((sale) => sale.payment_status !== "paid")
    .reduce((sum, sale) => {
      return sum + Number(sale.total_price ?? 0);
    }, 0);

  const soldQuantity = sales.reduce((sum, sale) => {
    return sum + Number(sale.quantity ?? 0);
  }, 0);

  const stockInTotal = movements
    .filter((movement) => movement.movement_type === "stock_in")
    .reduce((sum, movement) => {
      return sum + Number(movement.quantity ?? 0);
    }, 0);

  const stockOutTotal = movements
    .filter((movement) => movement.movement_type === "stock_out")
    .reduce((sum, movement) => {
      return sum + Number(movement.quantity ?? 0);
    }, 0);

  const recentSales = sales.slice(0, 5);
  const recentMovements = movements.slice(0, 5);

  const weeklyBars = useMemo(() => {
    const labels = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
    const totals = [0, 0, 0, 0, 0, 0, 0];

    sales.forEach((sale) => {
      const date = new Date(sale.created_at);
      const day = date.getDay();
      const index = day === 0 ? 6 : day - 1;

      totals[index] += Number(sale.total_price ?? 0);
    });

    const max = Math.max(...totals, 1);

    return labels.map((label, index) => ({
      label,
      total: totals[index],
      height: Math.max((totals[index] / max) * 100, totals[index] > 0 ? 12 : 4),
    }));
  }, [sales]);

  return (
    <section className="mx-auto w-full max-w-[1520px] space-y-5 pb-8">
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.07)] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-2 text-xs font-black text-white">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Canlı Supabase Dashboard
              </div>

              <h1 className="text-[34px] font-black leading-none tracking-[-0.055em] text-slate-950 sm:text-5xl">
                Bugünün işletme tablosu
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Ürün, satış ve stok hareketleri artık gerçek veriden okunuyor.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={fetchDashboardData}
                className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-200"
              >
                Yenile
              </button>

              <Link
                href="/app/sales"
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Yeni Satış
              </Link>
            </div>
          </div>
        </div>

        <Link
          href="/app/gorki-ai"
          className="rounded-[30px] bg-[#111827] p-5 text-white shadow-[0_18px_60px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[24px] bg-white/10">
              <Image
                src="/gorki-hero.png"
                alt="Gorki AI"
                fill
                className="object-contain object-bottom"
                priority
              />
            </div>

            <div>
              <p className="text-xs font-bold text-blue-200">Gorki AI</p>
              <h2 className="mt-1 text-lg font-black">Canlı yardımcı</h2>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Ürün, stok ve satış verileri bağlandı. Sırada gerçek öneriler var.
              </p>
            </div>
          </div>
        </Link>
      </div>

      {message ? (
        <div className="rounded-[24px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-5">
        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
              Bugünkü Satış
            </p>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
              Canlı
            </span>
          </div>
          <p className="text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
            {loading ? "..." : formatCurrency(todayRevenue)}
          </p>
        </div>

        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
              Toplam Ciro
            </p>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">
              {sales.length} satış
            </span>
          </div>
          <p className="text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
            {loading ? "..." : formatCurrency(totalRevenue)}
          </p>
        </div>

        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
              Bekleyen Ödeme
            </p>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700">
              Tahsilat
            </span>
          </div>
          <p className="text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
            {loading ? "..." : formatCurrency(pendingRevenue)}
          </p>
        </div>

        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
              Kritik Stok
            </p>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-600">
              {criticalProducts.length} ürün
            </span>
          </div>
          <p className="text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
            {loading ? "..." : criticalProducts.length}
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.07)] sm:p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
                Haftalık satış grafiği
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Sales tablosundaki gerçek satışlardan hesaplanır.
              </p>
            </div>

            <div className="flex gap-2 text-xs font-black">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                Satış
              </span>
            </div>
          </div>

          <div className="relative h-[330px] overflow-hidden rounded-[26px] border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-4">
            <div className="absolute inset-x-4 top-1/4 border-t border-dashed border-slate-200" />
            <div className="absolute inset-x-4 top-1/2 border-t border-dashed border-slate-200" />
            <div className="absolute inset-x-4 top-3/4 border-t border-dashed border-slate-200" />

            <div className="relative flex h-full items-end gap-3">
              {weeklyBars.map((bar) => (
                <div key={bar.label} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <div className="hidden rounded-xl bg-white px-2 py-1 text-[11px] font-black text-slate-500 shadow-sm group-hover:block">
                    {formatCurrency(bar.total)}
                  </div>

                  <div className="flex h-[245px] w-full items-end justify-center">
                    <div
                      className="w-5 rounded-t-full bg-blue-600 shadow-[0_10px_24px_rgba(36,99,255,0.26)] transition group-hover:scale-y-105 sm:w-7"
                      style={{ height: `${bar.height}%` }}
                    />
                  </div>

                  <span className="text-[10px] font-black text-slate-400 sm:text-xs">
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.07)] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
              Operasyon Özeti
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Ürün, stok ve satış metrikleri.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-700">Toplam ürün</p>
                  <p className="text-sm font-black text-slate-950">{totalProducts}</p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(totalProducts * 8, 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-700">Toplam stok</p>
                  <p className="text-sm font-black text-slate-950">{totalStock}</p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(totalStock * 3, 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-700">Stok değeri</p>
                  <p className="text-sm font-black text-slate-950">{formatCurrency(stockValue)}</p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: "64%" }} />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-700">Satılan adet</p>
                  <p className="text-sm font-black text-slate-950">{soldQuantity}</p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-slate-950" style={{ width: `${Math.min(soldQuantity * 4, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] bg-[#111827] p-5 text-white shadow-[0_18px_60px_rgba(15,23,42,0.16)] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.04em]">Hızlı işlemler</h2>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {quickActions.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-[22px] bg-white/10 p-4 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-lg font-black text-slate-950">
                    {item.icon}
                  </div>
                  <p className="text-sm font-black">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.07)] sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
                Son satışlar
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Sales tablosundan gerçek kayıtlar.
              </p>
            </div>
            <Link
              href="/app/sales"
              className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-600 hover:text-white"
            >
              Tümü
            </Link>
          </div>

          {recentSales.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <h3 className="text-lg font-black text-slate-950">Henüz satış yok</h3>
              <p className="mt-2 text-sm text-slate-500">
                Satış oluşturunca burada görünecek.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-slate-100">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="grid gap-3 border-b border-slate-100 bg-white p-4 transition hover:bg-blue-50/60 last:border-b-0 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate font-black text-slate-950">
                      {sale.product_name || "Ürün yok"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {sale.customer_name || "Müşteri yok"} · {formatDate(sale.created_at)}
                    </p>
                  </div>

                  <p className="font-black text-slate-950">
                    {formatCurrency(sale.total_price)}
                  </p>

                  <span className={["w-fit rounded-full px-3 py-1 text-xs font-black", paymentClass(sale.payment_status)].join(" ")}>
                    {paymentLabel(sale.payment_status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.07)] sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
                Son stok hareketleri
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Stock movements tablosundan gerçek kayıtlar.
              </p>
            </div>

            <Link
              href="/app/stock"
              className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-950 hover:text-white"
            >
              Stok
            </Link>
          </div>

          {recentMovements.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <h3 className="text-lg font-black text-slate-950">Henüz hareket yok</h3>
              <p className="mt-2 text-sm text-slate-500">
                Ürün veya satış üzerinden stok değiştirince burada görünür.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMovements.map((movement) => {
                const isIn = movement.movement_type === "stock_in";

                return (
                  <div
                    key={movement.id}
                    className="rounded-[22px] border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-950">
                          {movement.product_name || "Ürün yok"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {movement.product_code || "-"} · {formatDate(movement.created_at)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {movement.note || "Not yok"}
                        </p>
                      </div>

                      <span
                        className={[
                          "shrink-0 rounded-full px-3 py-1 text-xs font-black",
                          isIn ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600",
                        ].join(" ")}
                      >
                        {isIn ? "+" : "-"}
                        {movement.quantity ?? 0}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.07)] sm:p-6">
        <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
          Entegrasyonlar
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Pazaryeri bağlantıları şimdilik demo. Sonraki fazda API bağlantısı yapılacak.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {integrations.map((item) => (
            <div
              key={item.name}
              className="rounded-[22px] border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-blue-50/60"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-white p-2 shadow-sm">
                  <Image src={item.logo} alt={item.name} fill className="object-contain p-2" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-slate-950">{item.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.sync}</p>
                </div>

                <span className="text-xs font-black text-blue-700">{item.score}</span>
              </div>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700 shadow-sm">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden">
        {stockInTotal}
        {stockOutTotal}
      </div>
    </section>
  );
}
