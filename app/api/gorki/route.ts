import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Product = {
  id: string;
  name: string;
  product_code: string | null;
  stock: number | null;
  min_stock: number | null;
  price: number | null;
};

type Order = {
  id: string;
  order_no: string | null;
  product_name: string | null;
  customer_name: string | null;
  total_amount: number | null;
  paid_amount: number | null;
  remaining_amount: number | null;
  payment_status: string | null;
  order_status: string | null;
  shipping_status: string | null;
  marketplace: string | null;
  created_at: string;
};

type Payment = {
  id: string;
  payment_method: string | null;
  amount: number | null;
  payment_date: string | null;
  created_at: string;
};

type ReturnItem = {
  id: string;
  order_no: string | null;
  product_name: string | null;
  customer_name: string | null;
  status: string | null;
  refund_amount: number | null;
  amount: number | null;
  created_at: string;
};

type Shipment = {
  id: string;
  order_no: string | null;
  customer_name: string | null;
  carrier_name: string | null;
  tracking_no: string | null;
  shipment_status: string | null;
  created_at: string;
};

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function isToday(date: string | null | undefined) {
  if (!date) return false;

  const d = new Date(date);
  const n = new Date();

  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function firstItems<T>(items: T[], count = 5) {
  return items.slice(0, count);
}

function buildDashboardAnswer(products: Product[], orders: Order[], payments: Payment[], returns: ReturnItem[], shipments: Shipment[]) {
  const todayPaid = payments
    .filter((payment) => isToday(payment.payment_date || payment.created_at))
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0);
  const totalPaid = orders.reduce((sum, order) => sum + Number(order.paid_amount ?? 0), 0);
  const totalRemaining = orders.reduce((sum, order) => sum + Number(order.remaining_amount ?? 0), 0);
  const criticalProducts = products.filter((product) => Number(product.min_stock ?? 0) > 0 && Number(product.stock ?? 0) <= Number(product.min_stock ?? 0));
  const waitingShipments = orders.filter((order) => order.shipping_status !== "shipped" && order.shipping_status !== "delivered");
  const activeReturns = returns.filter((item) => item.status !== "refunded" && item.status !== "rejected");

  return [
    `Bugünkü tahsilat: ${formatCurrency(todayPaid)}.`,
    `Toplam sipariş cirosu: ${formatCurrency(totalRevenue)}.`,
    `Tahsil edilen: ${formatCurrency(totalPaid)}, kalan tahsilat: ${formatCurrency(totalRemaining)}.`,
    `Kritik stokta ${criticalProducts.length} ürün var.`,
    `Kargo bekleyen ${waitingShipments.length} sipariş var.`,
    `Aktif iade talebi ${activeReturns.length} adet.`,
    shipments.length > 0 ? `Son kargo kaydı: ${shipments[0].order_no || "-"} / ${shipments[0].shipment_status || "bekliyor"}.` : "Henüz kargo kaydı yok.",
  ].join("\n");
}

function buildCriticalStockAnswer(products: Product[]) {
  const criticalProducts = products
    .filter((product) => Number(product.min_stock ?? 0) > 0 && Number(product.stock ?? 0) <= Number(product.min_stock ?? 0))
    .sort((a, b) => Number(a.stock ?? 0) - Number(b.stock ?? 0));

  if (criticalProducts.length === 0) {
    return "Şu an kritik stokta ürün görünmüyor. Stok tarafı temiz duruyor.";
  }

  const lines = firstItems(criticalProducts, 8).map((product, index) => {
    return `${index + 1}. ${product.name} — stok: ${product.stock ?? 0}, minimum: ${product.min_stock ?? 0}`;
  });

  return `Kritik stokta ${criticalProducts.length} ürün var:\n${lines.join("\n")}`;
}

function buildPaymentsAnswer(orders: Order[], payments: Payment[]) {
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0);
  const totalPaid = orders.reduce((sum, order) => sum + Number(order.paid_amount ?? 0), 0);
  const totalRemaining = orders.reduce((sum, order) => sum + Number(order.remaining_amount ?? 0), 0);
  const waitingOrders = orders.filter((order) => order.payment_status !== "paid" && Number(order.remaining_amount ?? 0) > 0);

  const todayCash = payments
    .filter((payment) => payment.payment_method === "cash" && isToday(payment.payment_date || payment.created_at))
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  const todayCard = payments
    .filter((payment) => payment.payment_method === "card" && isToday(payment.payment_date || payment.created_at))
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  const todayTransfer = payments
    .filter((payment) => payment.payment_method === "transfer" && isToday(payment.payment_date || payment.created_at))
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  const waitingLines = firstItems(waitingOrders, 6).map((order, index) => {
    return `${index + 1}. ${order.order_no || "-"} — ${order.customer_name || "Müşteri yok"} — kalan ${formatCurrency(order.remaining_amount)}`;
  });

  return [
    `Toplam ciro: ${formatCurrency(totalRevenue)}.`,
    `Tahsil edilen: ${formatCurrency(totalPaid)}.`,
    `Bekleyen tahsilat: ${formatCurrency(totalRemaining)}.`,
    `Bugün nakit: ${formatCurrency(todayCash)}, kart: ${formatCurrency(todayCard)}, havale/EFT: ${formatCurrency(todayTransfer)}.`,
    waitingOrders.length > 0 ? `Bekleyen ödemeler:\n${waitingLines.join("\n")}` : "Bekleyen ödeme görünmüyor.",
  ].join("\n");
}

function buildShipmentAnswer(orders: Order[], shipments: Shipment[]) {
  const waitingOrders = orders.filter((order) => order.shipping_status !== "shipped" && order.shipping_status !== "delivered");
  const shippedOrders = orders.filter((order) => order.shipping_status === "shipped");
  const deliveredOrders = orders.filter((order) => order.shipping_status === "delivered");

  const waitingLines = firstItems(waitingOrders, 8).map((order, index) => {
    return `${index + 1}. ${order.order_no || "-"} — ${order.customer_name || "Müşteri yok"} — ${order.product_name || "Ürün yok"} — durum: ${order.shipping_status || "waiting"}`;
  });

  return [
    `Kargo bekleyen/hazırlanan sipariş: ${waitingOrders.length}.`,
    `Kargoda olan sipariş: ${shippedOrders.length}.`,
    `Teslim edilen sipariş: ${deliveredOrders.length}.`,
    shipments.length > 0 ? `Son kargo hareketi: ${shipments[0].order_no || "-"} / ${shipments[0].carrier_name || "Firma yok"} / ${shipments[0].tracking_no || "Takip no yok"}.` : "Henüz kargo hareketi yok.",
    waitingOrders.length > 0 ? `Öne çıkan bekleyenler:\n${waitingLines.join("\n")}` : "Kargo tarafında bekleyen sipariş görünmüyor.",
  ].join("\n");
}

function buildReturnAnswer(returns: ReturnItem[]) {
  const requested = returns.filter((item) => item.status === "requested");
  const received = returns.filter((item) => item.status === "received");
  const refunded = returns.filter((item) => item.status === "refunded");
  const rejected = returns.filter((item) => item.status === "rejected");

  const activeLines = firstItems([...requested, ...received], 8).map((item, index) => {
    return `${index + 1}. ${item.order_no || "-"} — ${item.customer_name || "Müşteri yok"} — ${item.product_name || "Ürün yok"} — durum: ${item.status || "requested"}`;
  });

  return [
    `Talep aşamasında ${requested.length} iade var.`,
    `Ürünü gelen ${received.length} iade var.`,
    `Para iadesi tamamlanan ${refunded.length} kayıt var.`,
    `Reddedilen ${rejected.length} kayıt var.`,
    activeLines.length > 0 ? `Aktif iadeler:\n${activeLines.join("\n")}` : "Aktif iade talebi görünmüyor.",
  ].join("\n");
}

function buildOrdersAnswer(orders: Order[]) {
  const newOrders = orders.filter((order) => order.order_status === "new");
  const preparingOrders = orders.filter((order) => order.order_status === "preparing");
  const packedOrders = orders.filter((order) => order.order_status === "packed");
  const completedOrders = orders.filter((order) => order.order_status === "completed");

  const latestLines = firstItems(orders, 8).map((order, index) => {
    return `${index + 1}. ${order.order_no || "-"} — ${order.customer_name || "Müşteri yok"} — ${formatCurrency(order.total_amount)} — ${order.order_status || "new"}`;
  });

  return [
    `Yeni sipariş: ${newOrders.length}.`,
    `Hazırlanan sipariş: ${preparingOrders.length}.`,
    `Paketlenen sipariş: ${packedOrders.length}.`,
    `Tamamlanan sipariş: ${completedOrders.length}.`,
    orders.length > 0 ? `Son siparişler:\n${latestLines.join("\n")}` : "Henüz sipariş yok.",
  ].join("\n");
}

function buildSmartAnswer(question: string, products: Product[], orders: Order[], payments: Payment[], returns: ReturnItem[], shipments: Shipment[]) {
  const q = question.toLowerCase();

  if (includesAny(q, ["kritik", "stok", "azalan", "biten"])) {
    return buildCriticalStockAnswer(products);
  }

  if (includesAny(q, ["ödeme", "odeme", "tahsil", "kalan", "nakit", "kart", "havale", "eft", "ciro"])) {
    return buildPaymentsAnswer(orders, payments);
  }

  if (includesAny(q, ["kargo", "teslim", "takip", "gönder", "gonder", "paket"])) {
    return buildShipmentAnswer(orders, shipments);
  }

  if (includesAny(q, ["iade", "refund", "geri"])) {
    return buildReturnAnswer(returns);
  }

  if (includesAny(q, ["sipariş", "siparis", "order", "hazırlan", "hazirlan"])) {
    return buildOrdersAnswer(orders);
  }

  if (includesAny(q, ["özet", "ozet", "bugün", "bugun", "durum", "panel", "dashboard"])) {
    return buildDashboardAnswer(products, orders, payments, returns, shipments);
  }

  return [
    "Şu an panel verilerine göre hızlı bir özet çıkarıyorum:",
    buildDashboardAnswer(products, orders, payments, returns, shipments),
    "",
    "Daha net cevap için şunlardan birini sorabilirsin: “kritik stok var mı?”, “bekleyen ödemeleri göster”, “kargo bekleyenler”, “iadeleri özetle”.",
  ].join("\n");
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const question = String(body?.question || "").trim();

    if (!question) {
      return NextResponse.json({ error: "Soru boş olamaz." }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const userResult = await supabase.auth.getUser(token);
    const userEmail = normalizeEmail(userResult.data.user?.email);

    if (!userEmail) {
      return NextResponse.json({ error: "Oturum doğrulanamadı." }, { status: 401 });
    }

    const memberResult = await supabase
      .from("business_members")
      .select("business_id, email, member_status")
      .eq("email", userEmail)
      .eq("member_status", "active")
      .limit(1)
      .maybeSingle();

    if (memberResult.error || !memberResult.data?.business_id) {
      return NextResponse.json({ error: "Aktif işletme bulunamadı." }, { status: 404 });
    }

    const businessId = memberResult.data.business_id;

    const [productsResult, ordersResult, paymentsResult, returnsResult, shipmentsResult] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, product_code, stock, min_stock, price")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select("id, order_no, product_name, customer_name, total_amount, paid_amount, remaining_amount, payment_status, order_status, shipping_status, marketplace, created_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select("id, payment_method, amount, payment_date, created_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false }),
      supabase
        .from("returns")
        .select("id, order_no, product_name, customer_name, status, refund_amount, amount, created_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false }),
      supabase
        .from("shipments")
        .select("id, order_no, customer_name, carrier_name, tracking_no, shipment_status, created_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false }),
    ]);

    if (productsResult.error) throw productsResult.error;
    if (ordersResult.error) throw ordersResult.error;
    if (paymentsResult.error) throw paymentsResult.error;
    if (returnsResult.error) throw returnsResult.error;
    if (shipmentsResult.error) throw shipmentsResult.error;

    const answer = buildSmartAnswer(
      question,
      (productsResult.data ?? []) as Product[],
      (ordersResult.data ?? []) as Order[],
      (paymentsResult.data ?? []) as Payment[],
      (returnsResult.data ?? []) as ReturnItem[],
      (shipmentsResult.data ?? []) as Shipment[]
    );

    return NextResponse.json({
      answer,
      quickQuestions: [
        "Bugünkü özeti göster",
        "Kritik stok var mı?",
        "Bekleyen ödemeler",
        "Kargo bekleyenler",
        "İadeleri özetle",
        "Son siparişleri göster",
      ],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gorki cevap oluşturamadı.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
