import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const allowedMarketplaces = ["trendyol", "hepsiburada", "amazon", "ciceksepeti"] as const;
type MarketplaceKey = typeof allowedMarketplaces[number];

type BusinessMemberRow = {
  business_id: string | null;
  email: string | null;
  member_status: string | null;
  can_manage_integrations: boolean | null;
  role_name: string | null;
};

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.replace("Bearer ", "").trim();
}

function marketplaceName(key: string) {
  if (key === "trendyol") return "Trendyol";
  if (key === "hepsiburada") return "Hepsiburada";
  if (key === "amazon") return "Amazon";
  if (key === "ciceksepeti") return "ÇiçekSepeti";
  return key;
}

function marketplacePrefix(key: string) {
  if (key === "trendyol") return "TY";
  if (key === "hepsiburada") return "HB";
  if (key === "amazon") return "AZ";
  if (key === "ciceksepeti") return "CS";
  return "MP";
}

async function getBusinessContext(supabase: any, token: string) {
  const userResult = await supabase.auth.getUser(token);
  const userEmail = normalizeEmail(userResult.data.user?.email);

  if (!userEmail) {
    throw new Error("Oturum doğrulanamadı.");
  }

  const memberResult = await supabase
    .from("business_members")
    .select("business_id, email, member_status, can_manage_integrations, role_name")
    .eq("email", userEmail)
    .eq("member_status", "active")
    .limit(1)
    .maybeSingle();

  if (memberResult.error) {
    throw new Error(memberResult.error.message);
  }

  const member = memberResult.data as BusinessMemberRow | null;

  if (!member || !member.business_id) {
    throw new Error("Aktif işletme bulunamadı.");
  }

  const canManage = Boolean(member.can_manage_integrations || member.role_name === "Sahip");

  if (!canManage) {
    throw new Error("Entegrasyon yönetimi yetkin yok.");
  }

  return {
    userEmail,
    businessId: member.business_id,
  };
}

async function ensureDemoIntegration(supabase: any, businessId: string, userEmail: string, marketplace: MarketplaceKey) {
  const existingResult = await supabase
    .from("marketplace_integrations")
    .select("*")
    .eq("business_id", businessId)
    .eq("marketplace", marketplace)
    .maybeSingle();

  if (existingResult.error) {
    throw new Error(existingResult.error.message);
  }

  if (existingResult.data) {
    return existingResult.data;
  }

  const { data, error } = await supabase
    .from("marketplace_integrations")
    .insert({
      business_id: businessId,
      created_by: userEmail,
      marketplace,
      display_name: marketplaceName(marketplace),
      store_name: `${marketplaceName(marketplace)} Demo Mağaza`,
      region: "TR",
      is_active: true,
      connection_status: "sync_ready",
      last_sync_status: "success",
      note: "Demo import sistemi tarafından oluşturuldu.",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Demo entegrasyon oluşturulamadı.");
  }

  return data;
}

function demoProductPool(marketplace: MarketplaceKey) {
  const common = [
    { name: "Bluetooth Kulaklık", code: "DEMO-BT-001", unit: 749 },
    { name: "Telefon Standı", code: "DEMO-STD-002", unit: 219 },
    { name: "Kahve Termosu", code: "DEMO-TRM-003", unit: 399 },
    { name: "Araç Kokusu Premium Set", code: "DEMO-AK-004", unit: 289 },
    { name: "Laptop Çantası", code: "DEMO-LP-005", unit: 899 },
  ];

  if (marketplace === "ciceksepeti") {
    return [
      { name: "Kişiye Özel Hediye Kutusu", code: "CS-HDY-001", unit: 549 },
      { name: "Dekoratif Masa Lambası", code: "CS-LMB-002", unit: 799 },
      { name: "Premium Çiçek Aranjmanı", code: "CS-CK-003", unit: 649 },
      { name: "Tasarım Kupa Seti", code: "CS-KUP-004", unit: 329 },
    ];
  }

  if (marketplace === "amazon") {
    return [
      { name: "Wireless Mouse", code: "AZ-MSE-001", unit: 499 },
      { name: "USB-C Hub", code: "AZ-HUB-002", unit: 1199 },
      { name: "Organizer Çanta", code: "AZ-ORG-003", unit: 349 },
      { name: "Mini Tripod", code: "AZ-TRP-004", unit: 279 },
    ];
  }

  return common;
}

function customerPool() {
  return [
    { name: "Ayşe Yılmaz", phone: "0555 111 22 33" },
    { name: "Mehmet Demir", phone: "0555 222 33 44" },
    { name: "Zeynep Kaya", phone: "0555 333 44 55" },
    { name: "Burak Şahin", phone: "0555 444 55 66" },
    { name: "Elif Arslan", phone: "0555 555 66 77" },
  ];
}

function randomFrom<T>(items: T[], index: number) {
  return items[index % items.length];
}

function buildDemoOrders(marketplace: MarketplaceKey, businessId: string, userEmail: string) {
  const prefix = marketplacePrefix(marketplace);
  const products = demoProductPool(marketplace);
  const customers = customerPool();
  const now = Date.now();

  return Array.from({ length: 5 }).map((_, index) => {
    const product = randomFrom(products, index);
    const customer = randomFrom(customers, index);
    const quantity = index % 2 === 0 ? 1 : 2;
    const total = product.unit * quantity;
    const orderNo = `${prefix}-DEMO-${new Date().getFullYear()}-${String(index + 1).padStart(4, "0")}`;
    const packageId = `${prefix}-PKG-${String(index + 31).padStart(5, "0")}`;
    const marketplaceStatus = ["Created", "Picking", "Invoiced", "Shipped", "Delivered"][index] || "Created";
    const shippingStatus = index === 4 ? "delivered" : index === 3 ? "shipped" : index === 2 ? "preparing" : "waiting";
    const orderStatus = index === 4 ? "completed" : index === 3 ? "packed" : index === 2 ? "preparing" : "new";

    return {
      business_id: businessId,
      created_by: userEmail,
      order_no: orderNo,
      marketplace,
      marketplace_order_no: orderNo.replace(`${prefix}-`, ""),
      marketplace_package_id: packageId,
      marketplace_status: marketplaceStatus,
      marketplace_tracking_link: shippingStatus === "shipped" || shippingStatus === "delivered" ? `https://takipio.com/demo-tracking/${packageId}` : null,
      marketplace_raw: {
        demo: true,
        marketplace,
        orderNo,
        packageId,
        status: marketplaceStatus,
      },
      product_id: null,
      product_code: product.code,
      product_name: product.name,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_email: null,
      quantity,
      unit_price: product.unit,
      total_amount: total,
      paid_amount: total,
      remaining_amount: 0,
      payment_status: "paid",
      payment_method: "marketplace",
      order_status: orderStatus,
      shipping_status: shippingStatus,
      carrier_name: shippingStatus === "waiting" ? null : "Demo Kargo",
      tracking_no: shippingStatus === "waiting" ? null : `${prefix}${Math.floor(100000000 + index * 12345)}`,
      shipped_at: shippingStatus === "shipped" || shippingStatus === "delivered" ? new Date(now - index * 3600 * 1000).toISOString() : null,
      delivered_at: shippingStatus === "delivered" ? new Date(now).toISOString() : null,
      return_status: "none",
      note: `${marketplaceName(marketplace)} demo import siparişi. Gerçek API verisi değildir.`,
      created_at: new Date(now - index * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };
  });
}

async function upsertDemoOrders(supabase: any, businessId: string, orders: any[]) {
  const orderNos = orders.map((order) => order.order_no);

  const existingResult = await supabase
    .from("orders")
    .select("id, order_no")
    .eq("business_id", businessId)
    .in("order_no", orderNos);

  if (existingResult.error) {
    throw new Error(existingResult.error.message);
  }

  const existingMap = new Map<string, string>();
  (existingResult.data || []).forEach((row: { id: string; order_no: string }) => {
    existingMap.set(row.order_no, row.id);
  });

  let inserted = 0;
  let updated = 0;

  for (const order of orders) {
    const existingId = existingMap.get(order.order_no);

    if (existingId) {
      const { error } = await supabase
        .from("orders")
        .update(order)
        .eq("business_id", businessId)
        .eq("id", existingId);

      if (error) throw new Error(error.message);
      updated += 1;
    } else {
      const { error } = await supabase
        .from("orders")
        .insert(order);

      if (error) throw new Error(error.message);
      inserted += 1;
    }
  }

  return {
    received: orders.length,
    inserted,
    updated,
  };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ marketplace: string }> }
) {
  const params = await context.params;
  const marketplace = String(params.marketplace || "").toLowerCase() as MarketplaceKey;
  const startedAt = new Date().toISOString();

  try {
    if (!allowedMarketplaces.includes(marketplace)) {
      return NextResponse.json({ error: "Desteklenmeyen pazaryeri." }, { status: 400 });
    }

    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const business = await getBusinessContext(supabase, token);
    const integration = await ensureDemoIntegration(supabase, business.businessId, business.userEmail, marketplace);
    const orders = buildDemoOrders(marketplace, business.businessId, business.userEmail);
    const result = await upsertDemoOrders(supabase, business.businessId, orders);
    const now = new Date().toISOString();
    const message = `${marketplaceName(marketplace)} demo import tamamlandı. Gelen: ${result.received}, yeni: ${result.inserted}, güncellenen: ${result.updated}.`;

    await supabase
      .from("marketplace_integrations")
      .update({
        is_active: true,
        connection_status: "sync_ready",
        last_sync_at: now,
        last_sync_status: "success",
        last_error: null,
        updated_at: now,
      })
      .eq("business_id", business.businessId)
      .eq("id", integration.id);

    await supabase.from("marketplace_sync_logs").insert({
      business_id: business.businessId,
      integration_id: integration.id,
      marketplace,
      sync_type: "demo",
      status: "success",
      message,
      received_count: result.received,
      inserted_count: result.inserted,
      updated_count: result.updated,
      error_message: null,
      started_at: startedAt,
      finished_at: now,
    });

    return NextResponse.json({
      ok: true,
      message,
      marketplace,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Demo import yapılamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
