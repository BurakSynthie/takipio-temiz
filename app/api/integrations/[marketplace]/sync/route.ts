import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const allowedMarketplaces = ["trendyol", "hepsiburada", "amazon", "ciceksepeti"];

type BusinessMemberRow = {
  business_id: string | null;
  email: string | null;
  member_status: string | null;
  can_manage_integrations: boolean | null;
  role_name: string | null;
};

type MarketplaceIntegrationRow = {
  id: string;
  business_id: string | null;
  marketplace: string | null;
  is_active: boolean | null;
  api_key: string | null;
  api_secret: string | null;
  seller_id: string | null;
  merchant_id: string | null;
  store_name: string | null;
  last_sync_at: string | null;
};

type TrendyolLine = {
  productName?: string;
  productCode?: string;
  merchantSku?: string;
  barcode?: string;
  quantity?: number;
  amount?: number;
  price?: number;
};

type TrendyolPackage = {
  id?: number | string;
  orderNumber?: string;
  packageNumber?: string;
  status?: string;
  customerFirstName?: string;
  customerLastName?: string;
  shipmentAddress?: {
    fullName?: string;
    phone?: string;
  };
  totalPrice?: number;
  grossAmount?: number;
  totalDiscount?: number;
  cargoProviderName?: string;
  cargoTrackingNumber?: string;
  cargoTrackingLink?: string;
  orderDate?: number;
  createdDate?: number;
  lastModifiedDate?: number;
  lines?: TrendyolLine[];
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

async function getIntegration(supabase: any, businessId: string, marketplace: string) {
  const result = await supabase
    .from("marketplace_integrations")
    .select("id, business_id, marketplace, is_active, api_key, api_secret, seller_id, merchant_id, store_name, last_sync_at")
    .eq("business_id", businessId)
    .eq("marketplace", marketplace)
    .maybeSingle();

  if (result.error) {
    throw new Error(result.error.message);
  }

  const integration = result.data as MarketplaceIntegrationRow | null;

  if (!integration) {
    throw new Error("Önce bu pazaryeri için bağlantı bilgilerini kaydetmelisin.");
  }

  return integration;
}

function validateCredentials(marketplace: string, integration: MarketplaceIntegrationRow) {
  const missing: string[] = [];

  if (marketplace === "trendyol") {
    if (!integration.api_key) missing.push("API Key");
    if (!integration.api_secret) missing.push("API Secret");
    if (!integration.seller_id) missing.push("Supplier / Seller ID");
  }

  if (marketplace === "hepsiburada") {
    if (!integration.api_key) missing.push("API Key");
    if (!integration.api_secret) missing.push("API Secret");
    if (!integration.merchant_id) missing.push("Merchant ID");
  }

  if (marketplace === "amazon") {
    if (!integration.api_key) missing.push("API Key");
    if (!integration.api_secret) missing.push("API Secret");
    if (!integration.seller_id) missing.push("Seller ID");
  }

  if (marketplace === "ciceksepeti") {
    if (!integration.api_key) missing.push("API Key");
    if (!integration.seller_id && !integration.merchant_id) missing.push("Seller / Store ID");
  }

  return missing;
}

function toNumber(value: unknown) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function dateFromTrendyolMs(value: unknown) {
  const numericValue = Number(value ?? 0);
  if (!numericValue || !Number.isFinite(numericValue)) return null;
  return new Date(numericValue).toISOString();
}

function mapOrderStatus(status: string | undefined) {
  const clean = String(status || "").toLowerCase();

  if (clean === "created") return "new";
  if (clean === "picking") return "preparing";
  if (clean === "invoiced") return "packed";
  if (clean === "shipped") return "packed";
  if (clean === "delivered") return "completed";
  if (clean === "cancelled") return "cancelled";
  if (clean === "returned") return "completed";

  return "new";
}

function mapShippingStatus(status: string | undefined) {
  const clean = String(status || "").toLowerCase();

  if (clean === "created") return "waiting";
  if (clean === "picking") return "preparing";
  if (clean === "invoiced") return "preparing";
  if (clean === "shipped") return "shipped";
  if (clean === "delivered") return "delivered";
  if (clean === "cancelled") return "waiting";
  if (clean === "returned") return "delivered";

  return "waiting";
}

function buildCustomerName(pkg: TrendyolPackage) {
  const fromNames = `${pkg.customerFirstName || ""} ${pkg.customerLastName || ""}`.trim();
  if (fromNames) return fromNames;
  if (pkg.shipmentAddress?.fullName) return pkg.shipmentAddress.fullName;
  return "Trendyol Müşterisi";
}

function buildOrderPayload(pkg: TrendyolPackage, businessId: string, userEmail: string) {
  const lines = Array.isArray(pkg.lines) ? pkg.lines : [];
  const quantity = lines.reduce((sum, line) => sum + toNumber(line.quantity || 1), 0) || 1;
  const totalAmount = toNumber(pkg.totalPrice || pkg.grossAmount);
  const unitPrice = quantity > 0 ? totalAmount / quantity : totalAmount;
  const productNames = lines
    .map((line) => line.productName)
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");

  const firstLine = lines[0] || {};
  const orderNumber = String(pkg.orderNumber || pkg.packageNumber || pkg.id || "").trim();
  const packageId = String(pkg.id || pkg.packageNumber || "").trim();
  const orderNo = orderNumber ? `TY-${orderNumber}` : `TY-PKG-${packageId}`;

  return {
    business_id: businessId,
    created_by: userEmail,
    order_no: orderNo,
    product_id: null,
    product_code: firstLine.productCode || firstLine.merchantSku || firstLine.barcode || null,
    product_name: productNames || firstLine.productName || "Trendyol Siparişi",
    customer_name: buildCustomerName(pkg),
    customer_phone: pkg.shipmentAddress?.phone || null,
    customer_email: null,
    quantity,
    unit_price: unitPrice,
    total_amount: totalAmount,
    paid_amount: totalAmount,
    remaining_amount: 0,
    payment_status: "paid",
    payment_method: "marketplace",
    order_status: mapOrderStatus(pkg.status),
    shipping_status: mapShippingStatus(pkg.status),
    marketplace: "trendyol",
    carrier_name: pkg.cargoProviderName || null,
    tracking_no: pkg.cargoTrackingNumber ? String(pkg.cargoTrackingNumber) : null,
    shipped_at: mapShippingStatus(pkg.status) === "shipped" ? new Date().toISOString() : null,
    delivered_at: mapShippingStatus(pkg.status) === "delivered" ? new Date().toISOString() : null,
    note: [
      `Trendyol paket ID: ${packageId || "-"}`,
      `Trendyol durum: ${pkg.status || "-"}`,
      pkg.cargoTrackingLink ? `Kargo link: ${pkg.cargoTrackingLink}` : "",
    ].filter(Boolean).join(" | "),
    created_at: dateFromTrendyolMs(pkg.orderDate || pkg.createdDate) || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function fetchTrendyolPackages(integration: MarketplaceIntegrationRow) {
  const supplierId = String(integration.seller_id || "").trim();
  const apiKey = String(integration.api_key || "").trim();
  const apiSecret = String(integration.api_secret || "").trim();

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const url = new URL(`https://api.trendyol.com/sapigw/suppliers/${supplierId}/orders`);
  url.searchParams.set("startDate", String(sevenDaysAgo));
  url.searchParams.set("endDate", String(now));
  url.searchParams.set("page", "0");
  url.searchParams.set("size", "50");
  url.searchParams.set("orderByField", "PackageLastModifiedDate");
  url.searchParams.set("orderByDirection", "DESC");

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      "User-Agent": `${supplierId} - Self Integration`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const text = await response.text();
  let json: any = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    const message =
      json?.message ||
      json?.error ||
      json?.exception ||
      text ||
      `Trendyol API hata kodu: ${response.status}`;

    throw new Error(message);
  }

  const content = Array.isArray(json?.content) ? json.content : [];
  return content as TrendyolPackage[];
}

async function upsertTrendyolOrders(supabase: any, businessId: string, userEmail: string, packages: TrendyolPackage[]) {
  const payloads = packages
    .map((pkg) => buildOrderPayload(pkg, businessId, userEmail))
    .filter((payload) => payload.order_no && payload.order_no !== "TY-PKG-");

  if (payloads.length === 0) {
    return {
      received: packages.length,
      inserted: 0,
      updated: 0,
    };
  }

  const orderNos = payloads.map((payload) => payload.order_no);

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

  for (const payload of payloads) {
    const existingId = existingMap.get(payload.order_no);

    if (existingId) {
      const { error } = await supabase
        .from("orders")
        .update(payload)
        .eq("business_id", businessId)
        .eq("id", existingId);

      if (error) throw new Error(error.message);
      updated += 1;
    } else {
      const { error } = await supabase
        .from("orders")
        .insert(payload);

      if (error) throw new Error(error.message);
      inserted += 1;
    }
  }

  return {
    received: packages.length,
    inserted,
    updated,
  };
}

async function runTrendyolSync(supabase: any, businessId: string, userEmail: string, integration: MarketplaceIntegrationRow) {
  const packages = await fetchTrendyolPackages(integration);
  return upsertTrendyolOrders(supabase, businessId, userEmail, packages);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ marketplace: string }> }
) {
  const params = await context.params;
  const marketplace = String(params.marketplace || "").toLowerCase();

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
    const integration = await getIntegration(supabase, business.businessId, marketplace);
    const now = new Date().toISOString();

    if (!integration.is_active) {
      const errorMessage = `${marketplaceName(marketplace)} bağlantısı aktif değil. Önce Aktif Bağlantı seçeneğini açıp kaydet.`;

      await supabase
        .from("marketplace_integrations")
        .update({
          connection_status: "error",
          last_sync_at: now,
          last_sync_status: "failed",
          last_error: errorMessage,
          updated_at: now,
        })
        .eq("business_id", business.businessId)
        .eq("id", integration.id);

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const missingFields = validateCredentials(marketplace, integration);

    if (missingFields.length > 0) {
      const errorMessage = `${marketplaceName(marketplace)} için eksik alanlar: ${missingFields.join(", ")}`;

      await supabase
        .from("marketplace_integrations")
        .update({
          connection_status: "error",
          last_sync_at: now,
          last_sync_status: "failed",
          last_error: errorMessage,
          updated_at: now,
        })
        .eq("business_id", business.businessId)
        .eq("id", integration.id);

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    if (marketplace !== "trendyol") {
      await supabase
        .from("marketplace_integrations")
        .update({
          connection_status: "sync_ready",
          last_sync_at: now,
          last_sync_status: "success",
          last_error: null,
          updated_at: now,
        })
        .eq("business_id", business.businessId)
        .eq("id", integration.id);

      return NextResponse.json({
        ok: true,
        message: `${marketplaceName(marketplace)} backend senkron route’u hazır. Gerçek API adaptörü sonraki pakette bağlanacak.`,
        marketplace,
        syncedAt: now,
        simulated: true,
      });
    }

    const syncResult = await runTrendyolSync(supabase, business.businessId, business.userEmail, integration);

    await supabase
      .from("marketplace_integrations")
      .update({
        connection_status: "sync_ready",
        last_sync_at: new Date().toISOString(),
        last_sync_status: "success",
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("business_id", business.businessId)
      .eq("id", integration.id);

    return NextResponse.json({
      ok: true,
      message: `Trendyol senkron tamamlandı. Gelen paket: ${syncResult.received}, yeni eklenen: ${syncResult.inserted}, güncellenen: ${syncResult.updated}.`,
      marketplace,
      syncedAt: new Date().toISOString(),
      result: syncResult,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Senkron işlemi yapılamadı.";

    try {
      const token = getBearerToken(request);
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });

      const params = await context.params;
      const marketplace = String(params.marketplace || "").toLowerCase();
      const business = await getBusinessContext(supabase, token);
      const integration = await getIntegration(supabase, business.businessId, marketplace);

      await supabase
        .from("marketplace_integrations")
        .update({
          connection_status: "error",
          last_sync_at: new Date().toISOString(),
          last_sync_status: "failed",
          last_error: message,
          updated_at: new Date().toISOString(),
        })
        .eq("business_id", business.businessId)
        .eq("id", integration.id);
    } catch {
      // Hata güncelleme de başarısız olursa API cevabını yine döndür.
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
