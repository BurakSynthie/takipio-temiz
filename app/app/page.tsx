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

type ModalType =
  | "today-sales"
  | "total-revenue"
  | "pending-payments"
  | "critical-stock"
  | "stock-summary"
  | "recent-movements"
  | null;

const quickActions = [
  { href: "/app/products", label: "Ürün Ekle", icon: "◈" },
  { href: "/app/sales", label: "Satış", icon: "₺" },
  { href: "/app/stock", label: "Stok", icon: "▤" },
  { href: "/app/qr", label: "QR", icon: "⌗" },
];

const integrations = [
  { name: "Trendyol", logo: "/trendyol.png", status: "Hazır", score: "92%" },
  { name: "Hepsiburada", logo: "/hepsiburada.png", status: "Kontrol", score: "76%" },
  { name: "Amazon", logo: "/amazon.png", status: "Plan", score: "48%" },
  { name: "ÇiçekSepeti", logo: "/ciceksepeti.png", status: "Yakında", score: "34%" },
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

function movementLabel(type: string | null) {
  if (type === "stock_in") return "Stok Girişi";
  if (type === "stock_out") return "Stok Çıkışı";
  return "Hareket";
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeModal, setActiveModal] = useState<ModalType>(null);

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
        .limit(30),
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

  const todaySales = sales.filter((sale) => isToday(sale.created_at));

  const todayRevenue = todaySales.reduce((sum, sale) => {
    return sum + Number(sale.total_price ?? 0);
  }, 0);

  const pendingSales = sales.filter((sale) => sale.payment_status !== "paid");

  const pendingRevenue = pendingSales.reduce((sum, sale) => {
    return sum + Number(sale.total_price ?? 0);
  }, 0);

  const paidRevenue = sales
    .filter((sale) => sale.payment_status === "paid")
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

  const recentSales = sales.slice(0, 4);
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

  const stockValueBarWidth = stockValue > 0 ? Math.min((stockValue / Math.max(stockValue, 1)) * 100, 100) : 0;
  const totalProductsBarWidth = totalProducts > 0 ? Math.min(totalProducts * 8, 100) : 0;
  const totalStockBarWidth = totalStock > 0 ? Math.min(totalStock * 3, 100) : 0;
  const soldQuantityBarWidth = soldQuantity > 0 ? Math.min(soldQuantity * 4, 100) : 0;

  return (
    <section className="mx-auto w-full max-w-[1520px] space-y-4 pb-8">
      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-black text-white">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Canlı Supabase Dashboard
            </div>

            <h1 className="text-[30px] font-black leading-none tracking-[-0.055em] text-slate-950 sm:text-4xl">
              İşletme kontrol merkezi
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Tüm kritik bilgiler tek ekranda. Kartlara tıklayarak detayları pop-up içinde gör.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={fetchDashboardData}
              className="rounded-2xl bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-200"
            >
              Yenile
            </button>

            <Link
              href="/app/sales"
              className="rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Yeni Satış
            </Link>
          </div>
        </div>
      </div>

      {message ? (
        <div className="rounded-[22px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        <button
          type="button"
          onClick={() => setActiveModal("today-sales")}
          className="rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-[0_12px_40px_rgba(15,23,42,0.055)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/50 xl:col-span-1"
        >
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
            Bugünkü Satış
          </p>
          <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
            {loading ? "..." : formatCurrency(todayRevenue)}
          </p>
          <span className="mt-3 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
            {todaySales.length} kayıt
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveModal("total-revenue")}
          className="rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-[0_12px_40px_rgba(15,23,42,0.055)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/50 xl:col-span-1"
        >
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
            Toplam Ciro
          </p>
          <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
            {loading ? "..." : formatCurrency(totalRevenue)}
          </p>
          <span className="mt-3 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">
            {sales.length} satış
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveModal("pending-payments")}
          className="rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-[0_12px_40px_rgba(15,23,42,0.055)] transition hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50/50 xl:col-span-1"
        >
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
            Bekleyen Ödeme
          </p>
          <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
            {loading ? "..." : formatCurrency(pendingRevenue)}
          </p>
          <span className="mt-3 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700">
            Tahsilat
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveModal("critical-stock")}
          className="rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-[0_12px_40px_rgba(15,23,42,0.055)] transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50/50 xl:col-span-1"
        >
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
            Kritik Stok
          </p>
          <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
            {loading ? "..." : criticalProducts.length}
          </p>
          <span className="mt-3 inline-flex rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-600">
            Acil
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveModal("stock-summary")}
          className="rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-[0_12px_40px_rgba(15,23,42,0.055)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 xl:col-span-1"
        >
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
            Stok Değeri
          </p>
          <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
            {loading ? "..." : formatCurrency(stockValue)}
          </p>
          <span className="mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-700">
            {totalStock} adet
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveModal("recent-movements")}
          className="rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-[0_12px_40px_rgba(15,23,42,0.055)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 xl:col-span-1"
        >
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
            Stok Hareketi
          </p>
          <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
            {loading ? "..." : movements.length}
          </p>
          <span className="mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-700">
            +{stockInTotal} / -{stockOutTotal}
          </span>
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-[-0.04em] text-slate-950">
                Haftalık satış grafiği
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Sales tablosundan hesaplanır.
              </p>
            </div>

            <Link
              href="/app/sales"
              className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-600 hover:text-white"
            >
              Satışlar
            </Link>
          </div>

          <div className="relative h-[260px] overflow-hidden rounded-[24px] border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-4">
            <div className="absolute inset-x-4 top-1/4 border-t border-dashed border-slate-200" />
            <div className="absolute inset-x-4 top-1/2 border-t border-dashed border-slate-200" />
            <div className="absolute inset-x-4 top-3/4 border-t border-dashed border-slate-200" />

            <div className="relative flex h-full items-end gap-3">
              {weeklyBars.map((bar) => (
                <button
                  key={bar.label}
                  type="button"
                  onClick={() => setActiveModal("total-revenue")}
                  className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                >
                  <div className="hidden rounded-xl bg-white px-2 py-1 text-[11px] font-black text-slate-500 shadow-sm group-hover:block">
                    {formatCurrency(bar.total)}
                  </div>

                  <div className="flex h-[185px] w-full items-end justify-center">
                    <div
                      className="w-5 rounded-t-full bg-blue-600 shadow-[0_10px_24px_rgba(36,99,255,0.24)] transition group-hover:scale-y-105 sm:w-7"
                      style={{ height: `${bar.height}%` }}
                    />
                  </div>

                  <span className="text-[10px] font-black text-slate-400 sm:text-xs">
                    {bar.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-[-0.04em] text-slate-950">
                  Operasyon
                </h2>
                <p className="mt-1 text-xs text-slate-500">Canlı özet.</p>
              </div>
              <Link href="/app/products" className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">
                Ürün
              </Link>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-700">Toplam ürün</p>
                  <p className="text-sm font-black text-slate-950">{totalProducts}</p>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${totalProductsBarWidth}%` }} />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-700">Toplam stok</p>
                  <p className="text-sm font-black text-slate-950">{totalStock}</p>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${totalStockBarWidth}%` }} />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-700">Stok değeri</p>
                  <p className="text-sm font-black text-slate-950">{formatCurrency(stockValue)}</p>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${stockValueBarWidth}%` }} />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-700">Satılan adet</p>
                  <p className="text-sm font-black text-slate-950">{soldQuantity}</p>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-slate-950" style={{ width: `${soldQuantityBarWidth}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] bg-[#111827] p-4 text-white shadow-[0_16px_50px_rgba(15,23,42,0.14)] sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black tracking-[-0.04em]">Hızlı işlemler</h2>
                <p className="mt-1 text-xs text-slate-400">Kompakt menü.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-[18px] bg-white/10 p-3 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15"
                >
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-base font-black text-slate-950">
                    {item.icon}
                  </div>
                  <p className="text-xs font-black">{item.label}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr_0.8fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-[-0.04em] text-slate-950">
                Son satışlar
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Son 4 kayıt.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal("total-revenue")}
              className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-600 hover:text-white"
            >
              Detay
            </button>
          </div>

          {recentSales.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <h3 className="text-base font-black text-slate-950">Henüz satış yok</h3>
              <p className="mt-2 text-sm text-slate-500">
                Satış oluşturunca burada görünür.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="rounded-[18px] border border-slate-100 bg-slate-50 p-3 transition hover:bg-blue-50/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">
                        {sale.product_name || "Ürün yok"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {sale.customer_name || "Müşteri yok"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black text-slate-950">
                        {formatCurrency(sale.total_price)}
                      </p>
                      <span className={["mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-black", paymentClass(sale.payment_status)].join(" ")}>
                        {paymentLabel(sale.payment_status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-[-0.04em] text-slate-950">
                Stok hareketleri
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Son 5 kayıt.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal("recent-movements")}
              className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-950 hover:text-white"
            >
              Detay
            </button>
          </div>

          {recentMovements.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <h3 className="text-base font-black text-slate-950">Hareket yok</h3>
              <p className="mt-2 text-sm text-slate-500">
                Stok değiştirince görünür.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentMovements.map((movement) => {
                const isIn = movement.movement_type === "stock_in";

                return (
                  <div
                    key={movement.id}
                    className="rounded-[18px] border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">
                          {movement.product_name || "Ürün yok"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {movement.note || movementLabel(movement.movement_type)}
                        </p>
                      </div>

                      <span
                        className={[
                          "shrink-0 rounded-full px-2.5 py-1 text-xs font-black",
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

        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-5">
          <div className="mb-4">
            <h2 className="text-xl font-black tracking-[-0.04em] text-slate-950">
              Entegrasyonlar
            </h2>
            <p className="mt-1 text-xs text-slate-500">Demo bağlantılar.</p>
          </div>

          <div className="grid gap-2">
            {integrations.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-3 rounded-[18px] border border-slate-100 bg-slate-50 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-white p-1.5 shadow-sm">
                    <Image src={item.logo} alt={item.name} fill className="object-contain p-1.5" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.status}</p>
                  </div>
                </div>

                <span className="text-xs font-black text-blue-700">{item.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {activeModal ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:items-center">
          <div className="max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-[30px] bg-white shadow-[0_30px_100px_rgba(15,23,42,0.32)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-950 p-5 text-white">
              <div>
                <h2 className="text-2xl font-black tracking-[-0.04em]">
                  {activeModal === "today-sales" ? "Bugünkü satış detayları" : null}
                  {activeModal === "total-revenue" ? "Toplam ciro ve satışlar" : null}
                  {activeModal === "pending-payments" ? "Bekleyen ödemeler" : null}
                  {activeModal === "critical-stock" ? "Kritik stok ürünleri" : null}
                  {activeModal === "stock-summary" ? "Stok özeti" : null}
                  {activeModal === "recent-movements" ? "Stok hareketleri" : null}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Bu pencere sadece bilgi gösterir; işlem için ilgili sayfaya geçebilirsin.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-lg font-black"
              >
                ×
              </button>
            </div>

            <div className="max-h-[68vh] overflow-y-auto p-5">
              {activeModal === "today-sales" ? (
                <div className="space-y-3">
                  {todaySales.length === 0 ? (
                    <EmptyModalState title="Bugün satış yok" desc="Bugün satış oluşturulduğunda burada görünür." />
                  ) : (
                    todaySales.map((sale) => <SaleRow key={sale.id} sale={sale} />)
                  )}
                </div>
              ) : null}

              {activeModal === "total-revenue" ? (
                <div className="space-y-3">
                  {sales.length === 0 ? (
                    <EmptyModalState title="Satış yok" desc="Satış oluşturulduğunda burada görünür." />
                  ) : (
                    sales.map((sale) => <SaleRow key={sale.id} sale={sale} />)
                  )}
                </div>
              ) : null}

              {activeModal === "pending-payments" ? (
                <div className="space-y-3">
                  {pendingSales.length === 0 ? (
                    <EmptyModalState title="Bekleyen ödeme yok" desc="Tüm satışlar ödenmiş görünüyor." />
                  ) : (
                    pendingSales.map((sale) => <SaleRow key={sale.id} sale={sale} />)
                  )}
                </div>
              ) : null}

              {activeModal === "critical-stock" ? (
                <div className="space-y-3">
                  {criticalProducts.length === 0 ? (
                    <EmptyModalState title="Kritik stok yok" desc="Minimum stok altına düşen ürün bulunmuyor." />
                  ) : (
                    criticalProducts.map((product) => {
                      const stock = Number(product.stock ?? 0);
                      const minStock = Number(product.min_stock ?? 0);
                      const missing = Math.max(minStock - stock, 0);

                      return (
                        <div key={product.id} className="rounded-[22px] border border-red-100 bg-red-50/60 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-lg font-black text-slate-950">{product.name}</p>
                              <p className="mt-1 text-sm text-slate-500">
                                {product.product_code} · {product.category || "Kategori yok"}
                              </p>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="rounded-2xl bg-white px-3 py-2">
                                <p className="text-[10px] font-black text-slate-400">Stok</p>
                                <p className="font-black text-red-600">{stock}</p>
                              </div>
                              <div className="rounded-2xl bg-white px-3 py-2">
                                <p className="text-[10px] font-black text-slate-400">Min</p>
                                <p className="font-black text-slate-950">{minStock}</p>
                              </div>
                              <div className="rounded-2xl bg-white px-3 py-2">
                                <p className="text-[10px] font-black text-slate-400">Eksik</p>
                                <p className="font-black text-red-600">{missing}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : null}

              {activeModal === "stock-summary" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <SummaryBox title="Toplam ürün" value={String(totalProducts)} />
                  <SummaryBox title="Toplam stok" value={String(totalStock)} />
                  <SummaryBox title="Stok değeri" value={formatCurrency(stockValue)} />
                  <SummaryBox title="Kritik stok" value={String(criticalProducts.length)} />
                  <SummaryBox title="Stok girişi" value={`+${stockInTotal}`} />
                  <SummaryBox title="Stok çıkışı" value={`-${stockOutTotal}`} />
                </div>
              ) : null}

              {activeModal === "recent-movements" ? (
                <div className="space-y-3">
                  {movements.length === 0 ? (
                    <EmptyModalState title="Stok hareketi yok" desc="Stok giriş/çıkış olduğunda burada görünür." />
                  ) : (
                    movements.map((movement) => <MovementRow key={movement.id} movement={movement} />)
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50 p-4">
              {activeModal === "critical-stock" || activeModal === "stock-summary" ? (
                <Link
                  href="/app/products"
                  className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white"
                >
                  Ürünlere Git
                </Link>
              ) : null}

              {activeModal === "pending-payments" || activeModal === "today-sales" || activeModal === "total-revenue" ? (
                <Link
                  href="/app/sales"
                  className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white"
                >
                  Satışlara Git
                </Link>
              ) : null}

              {activeModal === "recent-movements" ? (
                <Link
                  href="/app/stock"
                  className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white"
                >
                  Stok Sayfasına Git
                </Link>
              ) : null}

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-2xl bg-slate-200 px-4 py-3 text-sm font-black text-slate-700"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function EmptyModalState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{desc}</p>
    </div>
  );
}

function SummaryBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function SaleRow({ sale }: { sale: Sale }) {
  return (
    <div className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-lg font-black text-slate-950">{sale.product_name || "Ürün yok"}</p>
          <p className="mt-1 text-sm text-slate-500">
            {sale.customer_name || "Müşteri yok"} · {sale.product_code || "-"}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-400">{formatDate(sale.created_at)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-2xl bg-white px-3 py-2 text-center">
            <p className="text-[10px] font-black text-slate-400">Adet</p>
            <p className="font-black text-slate-950">{sale.quantity ?? 0}</p>
          </div>

          <div className="rounded-2xl bg-white px-3 py-2 text-center">
            <p className="text-[10px] font-black text-slate-400">Tutar</p>
            <p className="font-black text-slate-950">{formatCurrency(sale.total_price)}</p>
          </div>

          <span className={["rounded-full px-3 py-2 text-xs font-black", paymentClass(sale.payment_status)].join(" ")}>
            {paymentLabel(sale.payment_status)}
          </span>
        </div>
      </div>
    </div>
  );
}

function MovementRow({ movement }: { movement: StockMovement }) {
  const isIn = movement.movement_type === "stock_in";

  return (
    <div className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-lg font-black text-slate-950">{movement.product_name || "Ürün yok"}</p>
          <p className="mt-1 text-sm text-slate-500">
            {movement.product_code || "-"} · {movement.note || movementLabel(movement.movement_type)}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-400">{formatDate(movement.created_at)}</p>
        </div>

        <span
          className={[
            "w-fit rounded-full px-4 py-2 text-sm font-black",
            isIn ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600",
          ].join(" ")}
        >
          {isIn ? "+" : "-"}
          {movement.quantity ?? 0}
        </span>
      </div>
    </div>
  );
}
