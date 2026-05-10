import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const allowedMarketplaces = ["trendyol", "hepsiburada", "amazon", "ciceksepeti"];

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

async function getBusinessContext(supabase: ReturnType<typeof createClient>, token: string) {
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

  if (!memberResult.data?.business_id) {
    throw new Error("Aktif işletme bulunamadı.");
  }

  const canManage = Boolean(memberResult.data.can_manage_integrations || memberResult.data.role_name === "Sahip");

  if (!canManage) {
    throw new Error("Entegrasyon yönetimi yetkin yok.");
  }

  return {
    userEmail,
    businessId: memberResult.data.business_id as string,
  };
}

async function getIntegration(supabase: ReturnType<typeof createClient>, businessId: string, marketplace: string) {
  const result = await supabase
    .from("marketplace_integrations")
    .select("*")
    .eq("business_id", businessId)
    .eq("marketplace", marketplace)
    .maybeSingle();

  if (result.error) {
    throw new Error(result.error.message);
  }

  if (!result.data) {
    throw new Error("Önce bu pazaryeri için bağlantı bilgilerini kaydetmelisin.");
  }

  return result.data;
}

function hasMinimumCredential(marketplace: string, integration: any) {
  if (marketplace === "trendyol") {
    return Boolean(integration.api_key && integration.api_secret && integration.seller_id);
  }

  if (marketplace === "hepsiburada") {
    return Boolean(integration.api_key && integration.api_secret && integration.merchant_id);
  }

  if (marketplace === "amazon") {
    return Boolean(integration.api_key && integration.api_secret && integration.seller_id);
  }

  if (marketplace === "ciceksepeti") {
    return Boolean(integration.api_key && (integration.seller_id || integration.merchant_id));
  }

  return false;
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

    if (!hasMinimumCredential(marketplace, integration)) {
      const errorMessage = `${marketplaceName(marketplace)} için minimum API bilgileri eksik.`;

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

    /*
      Gerçek API bağlantısı burada yapılacak.

      Sonraki paketlerde bu alan marketplace bazlı adapter yapısına bölünecek:
      - Trendyol: sipariş çekme
      - Hepsiburada: sipariş çekme
      - Amazon: sipariş çekme
      - ÇiçekSepeti: sipariş çekme

      Şu anda güvenli backend route akışı kuruldu:
      kullanıcı oturumu -> business_id -> ilgili API bilgisi -> senkron durumu.
    */

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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Senkron işlemi yapılamadı.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
