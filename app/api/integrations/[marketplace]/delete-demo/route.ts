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

async function getIntegration(supabase: any, businessId: string, marketplace: MarketplaceKey) {
  const result = await supabase
    .from("marketplace_integrations")
    .select("id, business_id, marketplace")
    .eq("business_id", businessId)
    .eq("marketplace", marketplace)
    .maybeSingle();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data as { id: string } | null;
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
    const integration = await getIntegration(supabase, business.businessId, marketplace);

    const existingResult = await supabase
      .from("orders")
      .select("id")
      .eq("business_id", business.businessId)
      .eq("marketplace", marketplace)
      .ilike("order_no", "%-DEMO-%");

    if (existingResult.error) {
      throw new Error(existingResult.error.message);
    }

    const demoIds = (existingResult.data || []).map((row: { id: string }) => row.id);

    if (demoIds.length > 0) {
      const deleteResult = await supabase
        .from("orders")
        .delete()
        .eq("business_id", business.businessId)
        .in("id", demoIds);

      if (deleteResult.error) {
        throw new Error(deleteResult.error.message);
      }
    }

    const now = new Date().toISOString();
    const message = `${marketplaceName(marketplace)} demo siparişleri temizlendi. Silinen kayıt: ${demoIds.length}.`;

    if (integration?.id) {
      await supabase.from("marketplace_sync_logs").insert({
        business_id: business.businessId,
        integration_id: integration.id,
        marketplace,
        sync_type: "demo_cleanup",
        status: "success",
        message,
        received_count: demoIds.length,
        inserted_count: 0,
        updated_count: 0,
        error_message: null,
        started_at: startedAt,
        finished_at: now,
      });
    }

    return NextResponse.json({
      ok: true,
      message,
      marketplace,
      deleted: demoIds.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Demo siparişleri silinemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
