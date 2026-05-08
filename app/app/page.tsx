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

const integrations = [
  { name: "Trendyol", logo: "/trendyol.png", status: "Hazır", score: "92%" },
  { name: "Hepsiburada", logo: "/hepsiburada.png", status: "Kontrol", score: "76%" },
  { name: "Amazon", logo: "/amazon.png", status: "Plan", score: "48%" },
  { name: "ÇiçekSepeti", logo: "/ciceksepeti.png", status: "Yakında", score: "34%" },
];

const tasks = [
  { title: "Kritik stokları kontrol et", done: false, tone: "amber" },
  { title: "Bugünkü satışları kapat", done: false, tone: "blue" },
  { title: "QR etiket çıktısını test et", done: true, tone: "green" },
  { title: "Bekleyen ödemeleri ara", done: false, tone: "red" },
];

const quickActions = [
  { href: "/app/products", label: "Ürün", icon: "◈" },
  { href: "/app/sales", label: "Satış", icon: "₺" },
  { href: "/app/stock", label: "Stok", icon: "▤" },
  { href: "/app/qr", label: "QR", icon: "⌗" },
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
  if (status === "paid") return "bg-emerald-400/15 text-emerald-300 ring-emerald-400/20";
  if (status === "partial") return "bg-amber-400/15 text-amber-300 ring-amber-400/20";
  if (status === "cancelled") return "bg-red-400/15 text-red-300 ring-red-400/20";
  return "bg-blue-400/15 text-blue-300 ring-blue-400/20";
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
      height: Math.max((totals[index] / max) * 100, totals[index] > 0 ? 14 : 4),
    }));
  }, [sales]);

  const cashRatio = totalRevenue > 0 ? Math.round((paidRevenue / totalRevenue) * 100) : 0;
  const stockHealth = totalProducts > 0 ? Math.max(0, Math.round(((totalProducts - criticalProducts.length) / totalProducts) * 100)) : 100;

  return (
    <section className="mx-auto w-full max-w-[1540px] space-y-4 pb-8 text-white">
      <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#101a2f] p-4 shadow-[0_20px_70px_rgba(2,6,23,0.28)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.22),transparent_32%),radial-gradient(circle_at_top_right,rgba(20,184,166,0.14),transparent_28%)]" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-black text-cyan-100 ring-1 ring-white/10">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Canlı Takipio Dashboard
            </div>

            <h1 className="text-[28px] font-black leading-none tracking-[-0.055em] sm:text-4xl">
              İşletme yönetim ekranı
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Satış, stok, QR, tahsilat ve entegrasyon durumlarını tek yoğun ekranda takip et.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={fetchDashboardData}
              className="rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15"
            >
              Yenile
            </button>

            <Link
              href="/app/sales"
              className="rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:bg-blue-500"
            >
              Yeni Satış
            </Link>
          </div>
        </div>
      </div>

      {message ? (
        <div className="rounded-[20px] border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-200">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_290px]">
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <button
              type="button"
              onClick={() => setActiveModal("today-sales")}
              className="group rounded-[22px] border border-white/10 bg-[#151f33] p-4 text-left shadow-[0_12px_40px_rgba(2,6,23,0.20)] transition hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-[#192640]"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="rounded-xl bg-blue-500/15 px-2.5 py-1 text-[10px] font-black text-blue-200 ring-1 ring-blue-400/20">
                  Revenue
                </span>
                <span className="text-xs text-slate-500">•••</span>
              </div>
              <p className="text-xs font-black text-slate-400">Bugünkü Satış</p>
              <p className="mt-2 text-2xl font-black tracking-[-0.04em]">{loading ? "..." : formatCurrency(todayRevenue)}</p>
              <p className="mt-2 text-xs font-bold text-blue-200">{todaySales.length} kayıt</p>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal("total-revenue")}
              className="group rounded-[22px] border border-white/10 bg-[#151f33] p-4 text-left shadow-[0_12px_40px_rgba(2,6,23,0.20)] transition hover:-translate-y-0.5 hover:border-emerald-400/40 hover:bg-[#192640]"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="rounded-xl bg-emerald-500/15 px-2.5 py-1 text-[10px] font-black text-emerald-200 ring-1 ring-emerald-400/20">
                  Total
                </span>
                <span className="text-xs text-slate-500">•••</span>
              </div>
              <p className="text-xs font-black text-slate-400">Toplam Ciro</p>
              <p className="mt-2 text-2xl font-black tracking-[-0.04em]">{loading ? "..." : formatCurrency(totalRevenue)}</p>
              <p className="mt-2 text-xs font-bold text-emerald-200">{sales.length} satış</p>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal("pending-payments")}
              className="group rounded-[22px] border border-white/10 bg-[#151f33] p-4 text-left shadow-[0_12px_40px_rgba(2,6,23,0.20)] transition hover:-translate-y-0.5 hover:border-amber-400/40 hover:bg-[#192640]"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="rounded-xl bg-amber-500/15 px-2.5 py-1 text-[10px] font-black text-amber-200 ring-1 ring-amber-400/20">
                  Pending
                </span>
                <span className="text-xs text-slate-500">•••</span>
              </div>
              <p className="text-xs font-black text-slate-400">Bekleyen Ödeme</p>
              <p className="mt-2 text-2xl font-black tracking-[-0.04em]">{loading ? "..." : formatCurrency(pendingRevenue)}</p>
              <p className="mt-2 text-xs font-bold text-amber-200">Tahsilat bekliyor</p>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal("critical-stock")}
              className="group rounded-[22px] border border-white/10 bg-[#151f33] p-4 text-left shadow-[0_12px_40px_rgba(2,6,23,0.20)] transition hover:-translate-y-0.5 hover:border-red-400/40 hover:bg-[#192640]"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="rounded-xl bg-red-500/15 px-2.5 py-1 text-[10px] font-black text-red-200 ring-1 ring-red-400/20">
                  Alert
                </span>
                <span className="text-xs text-slate-500">•••</span>
              </div>
              <p className="text-xs font-black text-slate-400">Kritik Stok</p>
              <p className="mt-2 text-2xl font-black tracking-[-0.04em]">{loading ? "..." : criticalProducts.length}</p>
              <p className="mt-2 text-xs font-bold text-red-200">Acil kontrol</p>
            </button>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-[24px] border border-white/10 bg-[#151f33] p-4 shadow-[0_16px_50px_rgba(2,6,23,0.22)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black tracking-[-0.03em]">Satış Performansı</h2>
                  <p className="mt-1 text-xs text-slate-500">Haftalık canlı satış grafiği</p>
                </div>

                <div className="flex gap-2 text-[10px] font-black">
                  <span className="rounded-full bg-blue-500/15 px-3 py-1 text-blue-200 ring-1 ring-blue-400/20">Satış</span>
                </div>
              </div>

              <div className="relative h-[260px] overflow-hidden rounded-[20px] border border-white/8 bg-[#101827] p-4">
                <div className="absolute inset-x-4 top-1/4 border-t border-dashed border-white/10" />
                <div className="absolute inset-x-4 top-1/2 border-t border-dashed border-white/10" />
                <div className="absolute inset-x-4 top-3/4 border-t border-dashed border-white/10" />

                <div className="relative flex h-full items-end gap-3">
                  {weeklyBars.map((bar) => (
                    <button
                      key={bar.label}
                      type="button"
                      onClick={() => setActiveModal("total-revenue")}
                      className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                    >
                      <div className="hidden rounded-xl bg-white px-2 py-1 text-[11px] font-black text-slate-700 shadow-sm group-hover:block">
                        {formatCurrency(bar.total)}
                      </div>

                      <div className="flex h-[180px] w-full items-end justify-center">
                        <div
                          className="w-5 rounded-t-full bg-gradient-to-t from-blue-700 to-cyan-300 shadow-[0_10px_30px_rgba(37,99,235,0.30)] transition group-hover:scale-y-105 sm:w-7"
                          style={{ height: `${bar.height}%` }}
                        />
                      </div>

                      <span className="text-[10px] font-black text-slate-500 sm:text-xs">
                        {bar.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[#151f33] p-4 shadow-[0_16px_50px_rgba(2,6,23,0.22)]">
              <div className="mb-4">
                <h2 className="text-lg font-black tracking-[-0.03em]">Finans Nabzı</h2>
                <p className="mt-1 text-xs text-slate-500">Tahsilat oranı ve stok sağlığı</p>
              </div>

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal("pending-payments")}
                  className="rounded-[20px] border border-white/8 bg-[#101827] p-4 text-left transition hover:bg-[#111d31]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-400">Tahsilat Oranı</p>
                    <p className="text-xl font-black text-emerald-300">{cashRatio}%</p>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${cashRatio}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{formatCurrency(paidRevenue)} tahsil edildi</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModal("critical-stock")}
                  className="rounded-[20px] border border-white/8 bg-[#101827] p-4 text-left transition hover:bg-[#111d31]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-400">Stok Sağlığı</p>
                    <p className="text-xl font-black text-blue-300">{stockHealth}%</p>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${stockHealth}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{criticalProducts.length} kritik ürün</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModal("stock-summary")}
                  className="rounded-[20px] border border-white/8 bg-[#101827] p-4 text-left transition hover:bg-[#111d31]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-400">Stok Değeri</p>
                    <p className="text-xl font-black text-amber-300">{formatCurrency(stockValue)}</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{totalProducts} ürün · {totalStock} adet</p>
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[24px] border border-white/10 bg-[#151f33] p-4 shadow-[0_16px_50px_rgba(2,6,23,0.22)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black tracking-[-0.03em]">Son Satışlar</h2>
                  <p className="mt-1 text-xs text-slate-500">Son 5 satış kaydı</p>
                </div>
                <Link href="/app/sales" className="rounded-xl bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-200 ring-1 ring-blue-400/20">
                  Tümü
                </Link>
              </div>

              {recentSales.length === 0 ? (
                <EmptyDarkState title="Henüz satış yok" desc="Satış oluşturunca burada görünür." />
              ) : (
                <div className="space-y-2">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="rounded-[18px] border border-white/8 bg-[#101827] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">{sale.product_name || "Ürün yok"}</p>
                          <p className="mt-1 text-xs text-slate-500">{sale.customer_name || "Müşteri yok"}</p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-black">{formatCurrency(sale.total_price)}</p>
                          <span className={["mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-black ring-1", paymentClass(sale.payment_status)].join(" ")}>
                            {paymentLabel(sale.payment_status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[#151f33] p-4 shadow-[0_16px_50px_rgba(2,6,23,0.22)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black tracking-[-0.03em]">Stok Hareketleri</h2>
                  <p className="mt-1 text-xs text-slate-500">Giriş / çıkış akışı</p>
                </div>
                <Link href="/app/stock" className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-slate-200 ring-1 ring-white/10">
                  Stok
                </Link>
              </div>

              {recentMovements.length === 0 ? (
                <EmptyDarkState title="Hareket yok" desc="Stok değişince burada görünür." />
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {recentMovements.map((movement) => {
                    const isIn = movement.movement_type === "stock_in";

                    return (
                      <div key={movement.id} className="rounded-[18px] border border-white/8 bg-[#101827] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black">{movement.product_name || "Ürün yok"}</p>
                            <p className="mt-1 text-xs text-slate-500">{movement.note || movementLabel(movement.movement_type)}</p>
                          </div>

                          <span
                            className={[
                              "shrink-0 rounded-full px-2.5 py-1 text-xs font-black",
                              isIn ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300",
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
        </div>

        <aside className="grid gap-4">
          <div className="rounded-[24px] border border-white/10 bg-[#151f33] p-4 shadow-[0_16px_50px_rgba(2,6,23,0.22)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black tracking-[-0.03em]">Gorki AI</h2>
              <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-black text-emerald-300 ring-1 ring-emerald-400/20">
                Aktif
              </span>
            </div>

            <div className="flex gap-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[22px] bg-[#101827]">
                <Image src="/gorki-hero.png" alt="Gorki AI" fill className="object-contain object-bottom" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-black">Bugünkü öneri</p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {criticalProducts.length > 0
                    ? `${criticalProducts.length} kritik stok ürünü var. Önce stok panelini kontrol et.`
                    : "Kritik stok yok. Satış ve tahsilat akışını kontrol edebilirsin."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#151f33] p-4 shadow-[0_16px_50px_rgba(2,6,23,0.22)]">
            <h2 className="text-lg font-black tracking-[-0.03em]">Hızlı İşlemler</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {quickActions.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-[18px] bg-[#101827] p-3 ring-1 ring-white/8 transition hover:-translate-y-0.5 hover:bg-[#111d31]">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-base font-black text-slate-950">
                    {item.icon}
                  </div>
                  <p className="text-xs font-black">{item.label}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#151f33] p-4 shadow-[0_16px_50px_rgba(2,6,23,0.22)]">
            <h2 className="text-lg font-black tracking-[-0.03em]">Görevler</h2>
            <div className="mt-4 space-y-2">
              {tasks.map((task) => (
                <div key={task.title} className="flex items-center gap-3 rounded-[16px] bg-[#101827] p-3 ring-1 ring-white/8">
                  <span
                    className={[
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black",
                      task.done ? "bg-emerald-400 text-slate-950" : "bg-white/10 text-slate-400",
                    ].join(" ")}
                  >
                    {task.done ? "✓" : ""}
                  </span>
                  <p className={["text-xs font-bold", task.done ? "text-slate-500 line-through" : "text-slate-200"].join(" ")}>
                    {task.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#151f33] p-4 shadow-[0_16px_50px_rgba(2,6,23,0.22)]">
            <h2 className="text-lg font-black tracking-[-0.03em]">Entegrasyonlar</h2>
            <div className="mt-4 space-y-2">
              {integrations.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-3 rounded-[16px] bg-[#101827] p-3 ring-1 ring-white/8">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-white p-1.5">
                      <Image src={item.logo} alt={item.name} fill className="object-contain p-1.5" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-black">{item.name}</p>
                      <p className="text-[10px] text-slate-500">{item.status}</p>
                    </div>
                  </div>

                  <span className="text-xs font-black text-blue-300">{item.score}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {activeModal ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center">
          <div className="max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-[30px] border border-white/10 bg-[#111827] text-white shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-[#0b1220] p-5">
              <div>
                <h2 className="text-2xl font-black tracking-[-0.04em]">
                  {activeModal === "today-sales" ? "Bugünkü satış detayları" : null}
                  {activeModal === "total-revenue" ? "Toplam ciro ve satışlar" : null}
                  {activeModal === "pending-payments" ? "Bekleyen ödemeler" : null}
                  {activeModal === "critical-stock" ? "Kritik stok ürünleri" : null}
                  {activeModal === "stock-summary" ? "Stok özeti" : null}
                  {activeModal === "recent-movements" ? "Stok hareketleri" : null}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
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
                    <EmptyDarkState title="Bugün satış yok" desc="Bugün satış oluşturulduğunda burada görünür." />
                  ) : (
                    todaySales.map((sale) => <SaleRow key={sale.id} sale={sale} />)
                  )}
                </div>
              ) : null}

              {activeModal === "total-revenue" ? (
                <div className="space-y-3">
                  {sales.length === 0 ? (
                    <EmptyDarkState title="Satış yok" desc="Satış oluşturulduğunda burada görünür." />
                  ) : (
                    sales.map((sale) => <SaleRow key={sale.id} sale={sale} />)
                  )}
                </div>
              ) : null}

              {activeModal === "pending-payments" ? (
                <div className="space-y-3">
                  {pendingSales.length === 0 ? (
                    <EmptyDarkState title="Bekleyen ödeme yok" desc="Tüm satışlar ödenmiş görünüyor." />
                  ) : (
                    pendingSales.map((sale) => <SaleRow key={sale.id} sale={sale} />)
                  )}
                </div>
              ) : null}

              {activeModal === "critical-stock" ? (
                <div className="space-y-3">
                  {criticalProducts.length === 0 ? (
                    <EmptyDarkState title="Kritik stok yok" desc="Minimum stok altına düşen ürün bulunmuyor." />
                  ) : (
                    criticalProducts.map((product) => {
                      const stock = Number(product.stock ?? 0);
                      const minStock = Number(product.min_stock ?? 0);
                      const missing = Math.max(minStock - stock, 0);

                      return (
                        <div key={product.id} className="rounded-[22px] border border-red-400/15 bg-red-400/10 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-lg font-black">{product.name}</p>
                              <p className="mt-1 text-sm text-slate-400">
                                {product.product_code} · {product.category || "Kategori yok"}
                              </p>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="rounded-2xl bg-white/8 px-3 py-2">
                                <p className="text-[10px] font-black text-slate-500">Stok</p>
                                <p className="font-black text-red-300">{stock}</p>
                              </div>
                              <div className="rounded-2xl bg-white/8 px-3 py-2">
                                <p className="text-[10px] font-black text-slate-500">Min</p>
                                <p className="font-black">{minStock}</p>
                              </div>
                              <div className="rounded-2xl bg-white/8 px-3 py-2">
                                <p className="text-[10px] font-black text-slate-500">Eksik</p>
                                <p className="font-black text-red-300">{missing}</p>
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
                    <EmptyDarkState title="Stok hareketi yok" desc="Stok giriş/çıkış olduğunda burada görünür." />
                  ) : (
                    movements.map((movement) => <MovementRow key={movement.id} movement={movement} />)
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 bg-[#0b1220] p-4">
              {activeModal === "critical-stock" || activeModal === "stock-summary" ? (
                <Link href="/app/products" className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
                  Ürünlere Git
                </Link>
              ) : null}

              {activeModal === "pending-payments" || activeModal === "today-sales" || activeModal === "total-revenue" ? (
                <Link href="/app/sales" className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
                  Satışlara Git
                </Link>
              ) : null}

              {activeModal === "recent-movements" ? (
                <Link href="/app/stock" className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
                  Stok Sayfasına Git
                </Link>
              ) : null}

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-slate-200"
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

function EmptyDarkState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-6 text-center">
      <h3 className="text-base font-black">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{desc}</p>
    </div>
  );
}

function SummaryBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function SaleRow({ sale }: { sale: Sale }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-lg font-black">{sale.product_name || "Ürün yok"}</p>
          <p className="mt-1 text-sm text-slate-400">
            {sale.customer_name || "Müşteri yok"} · {sale.product_code || "-"}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">{formatDate(sale.created_at)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-2xl bg-white/8 px-3 py-2 text-center">
            <p className="text-[10px] font-black text-slate-500">Adet</p>
            <p className="font-black">{sale.quantity ?? 0}</p>
          </div>

          <div className="rounded-2xl bg-white/8 px-3 py-2 text-center">
            <p className="text-[10px] font-black text-slate-500">Tutar</p>
            <p className="font-black">{formatCurrency(sale.total_price)}</p>
          </div>

          <span className={["rounded-full px-3 py-2 text-xs font-black ring-1", paymentClass(sale.payment_status)].join(" ")}>
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
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-lg font-black">{movement.product_name || "Ürün yok"}</p>
          <p className="mt-1 text-sm text-slate-400">
            {movement.product_code || "-"} · {movement.note || movementLabel(movement.movement_type)}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">{formatDate(movement.created_at)}</p>
        </div>

        <span
          className={[
            "w-fit rounded-full px-4 py-2 text-sm font-black",
            isIn ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300",
          ].join(" ")}
        >
          {isIn ? "+" : "-"}
          {movement.quantity ?? 0}
        </span>
      </div>
    </div>
  );
}
