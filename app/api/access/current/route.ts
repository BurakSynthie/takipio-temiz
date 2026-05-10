import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.replace("Bearer ", "").trim();
}

function normalizeEmail(email: string | null | undefined) {
  return (email || "").trim().toLowerCase();
}

function isActivePaidPlan(planCode: string | null | undefined, planStatus: string | null | undefined) {
  const code = String(planCode || "free").toLowerCase();
  const status = String(planStatus || "free").toLowerCase();

  return ["pro", "premium", "business"].includes(code) && ["active", "trialing", "paid"].includes(status);
}

export async function GET(request: Request) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const userResult = await supabase.auth.getUser(token);
    const email = normalizeEmail(userResult.data.user?.email);

    if (!email) {
      return NextResponse.json({ error: "Kullanıcı doğrulanamadı." }, { status: 401 });
    }

    const overrideResult = await supabase
      .from("user_plan_overrides")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    const ownedBusiness = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_email", email)
      .limit(1)
      .maybeSingle();

    if (ownedBusiness.data) {
      return NextResponse.json({
        ok: true,
        email,
        businessId: ownedBusiness.data.id,
        businessName: ownedBusiness.data.name,
        role: "Sahip",
        planCode: ownedBusiness.data.plan_code || "free",
        planStatus: ownedBusiness.data.plan_status || "free",
        isPro: isActivePaidPlan(ownedBusiness.data.plan_code, ownedBusiness.data.plan_status),
        source: "owned_business",
      });
    }

    const memberResult = await supabase
      .from("business_members")
      .select("*")
      .eq("email", email)
      .eq("member_status", "active")
      .limit(1)
      .maybeSingle();

    if (memberResult.data?.business_id) {
      const businessResult = await supabase
        .from("businesses")
        .select("*")
        .eq("id", memberResult.data.business_id)
        .maybeSingle();

      if (businessResult.data) {
        return NextResponse.json({
          ok: true,
          email,
          businessId: businessResult.data.id,
          businessName: businessResult.data.name,
          role: memberResult.data.role_name || "Personel",
          planCode: businessResult.data.plan_code || "free",
          planStatus: businessResult.data.plan_status || "free",
          isPro: isActivePaidPlan(businessResult.data.plan_code, businessResult.data.plan_status),
          source: "team_business",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      email,
      businessId: null,
      businessName: null,
      role: null,
      planCode: overrideResult.data?.forced_plan || "free",
      planStatus: "free",
      isPro: false,
      source: overrideResult.data ? "forced_free_override" : "no_business",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erişim bilgisi alınamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
