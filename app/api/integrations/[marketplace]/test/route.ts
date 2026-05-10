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
    .select("id, business_id, marketplace, is_active, api_key, api_secret, seller_id, merchant_id")
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

function hasMinimumCredential(marketplace: string, integration: MarketplaceIntegrationRow) {
  return validateCredentials(marketplace, integration).length === 0;
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

    const missingFields = validateCredentials(marketplace, integration);

    if (missingFields.length > 0) {
      const errorMessage = `${marketplaceName(marketplace)} için eksik alanlar: ${missingFields.join(", ")}`;

      await supabase
        .from("marketplace_integrations")
        .update({
          connection_status: "error",
          last_test_at: now,
          last_error: errorMessage,
          updated_at: now,
        })
        .eq("business_id", business.businessId)
        .eq("id", integration.id);

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    await supabase
      .from("marketplace_integrations")
      .update({
        connection_status: "test_success",
        last_test_at: now,
        last_error: null,
        updated_at: now,
      })
      .eq("business_id", business.businessId)
      .eq("id", integration.id);

    return NextResponse.json({
      ok: true,
      message: `${marketplaceName(marketplace)} bağlantı bilgileri backend route üzerinden doğrulandı.`,
      marketplace,
      checkedAt: now,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bağlantı testi yapılamadı.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
