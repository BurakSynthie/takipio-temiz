import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const permissionKeys = [
  "can_view_dashboard",
  "can_manage_products",
  "can_manage_stock",
  "can_manage_sales",
  "can_manage_orders",
  "can_manage_shipments",
  "can_manage_returns",
  "can_manage_invoices",
  "can_manage_customers",
  "can_manage_integrations",
  "can_manage_billing",
  "can_manage_settings",
] as const;

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.replace("Bearer ", "").trim();
}

function normalizeEmail(email: string | null | undefined) {
  return (email || "").trim().toLowerCase();
}

function permissionsForRole(role: string) {
  const base: Record<string, boolean> = {
    can_view_dashboard: true,
    can_manage_products: false,
    can_manage_stock: false,
    can_manage_sales: false,
    can_manage_orders: false,
    can_manage_shipments: false,
    can_manage_returns: false,
    can_manage_invoices: false,
    can_manage_customers: false,
    can_manage_integrations: false,
    can_manage_billing: false,
    can_manage_settings: false,
  };

  if (role === "Sahip") {
    return Object.fromEntries(permissionKeys.map((key) => [key, true]));
  }

  if (role === "Muhasebe") {
    return {
      ...base,
      can_manage_sales: true,
      can_manage_orders: true,
      can_manage_invoices: true,
      can_manage_customers: true,
      can_manage_billing: true,
    };
  }

  if (role === "Depo") {
    return {
      ...base,
      can_manage_products: true,
      can_manage_stock: true,
      can_manage_shipments: true,
      can_manage_returns: true,
    };
  }

  if (role === "Satış") {
    return {
      ...base,
      can_manage_sales: true,
      can_manage_orders: true,
      can_manage_customers: true,
    };
  }

  return base;
}

function permissionsFromInvite(invite: Record<string, unknown>, roleName: string) {
  const fallback = permissionsForRole(roleName);
  const result: Record<string, boolean> = {};

  permissionKeys.forEach((key) => {
    if (typeof invite[key] === "boolean") {
      result[key] = Boolean(invite[key]);
    } else {
      result[key] = Boolean(fallback[key]);
    }
  });

  return result;
}

function preserveExistingPermissions(member: Record<string, unknown>, invite: Record<string, unknown>, roleName: string) {
  const invitePermissions = permissionsFromInvite(invite, roleName);
  const result: Record<string, boolean> = {};

  permissionKeys.forEach((key) => {
    if (typeof member[key] === "boolean") {
      result[key] = Boolean(member[key]);
    } else {
      result[key] = invitePermissions[key];
    }
  });

  return result;
}

export async function POST(request: Request) {
  try {
    if (!serviceRoleKey) {
      return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY eksik." }, { status: 500 });
    }

    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const userResult = await userClient.auth.getUser(token);
    const userEmail = normalizeEmail(userResult.data.user?.email);

    if (!userEmail) {
      return NextResponse.json({ error: "Kullanıcı doğrulanamadı." }, { status: 401 });
    }

    const body = await request.json();
    const inviteToken = String(body.inviteToken || "").trim();

    if (!inviteToken) {
      return NextResponse.json({ error: "Davet tokenı eksik." }, { status: 400 });
    }

    const inviteResult = await serviceClient
      .from("team_invites")
      .select("*")
      .eq("token", inviteToken)
      .maybeSingle();

    if (inviteResult.error) {
      return NextResponse.json({ error: inviteResult.error.message }, { status: 500 });
    }

    if (!inviteResult.data) {
      return NextResponse.json({ error: "Davet bulunamadı." }, { status: 404 });
    }

    const invite = inviteResult.data as Record<string, unknown>;
    const inviteEmail = normalizeEmail(String(invite.email || ""));

    if (inviteEmail !== userEmail) {
      return NextResponse.json(
        { error: `Bu davet ${invite.email} adresi için oluşturulmuş. Şu an ${userEmail} ile giriş yaptın.` },
        { status: 403 }
      );
    }

    if (invite.expires_at && new Date(String(invite.expires_at)).getTime() < Date.now()) {
      return NextResponse.json({ error: "Davet süresi dolmuş." }, { status: 410 });
    }

    const businessId = String(invite.business_id || "");

    const businessResult = await serviceClient
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .maybeSingle();

    if (businessResult.error || !businessResult.data) {
      return NextResponse.json({ error: "Davet edilen işletme bulunamadı." }, { status: 404 });
    }

    const memberResult = await serviceClient
      .from("business_members")
      .select("*")
      .eq("business_id", businessId)
      .eq("email", userEmail)
      .maybeSingle();

    const roleName = String(invite.role_name || memberResult.data?.role_name || "Satış");

    if (memberResult.data) {
      // Kritik fix: mevcut business_members içindeki seçilmiş yetkileri EZME.
      // Sadece aktif yap, rol/display güncelle. Eğer bazı yetki alanları null ise invite'tan doldur.
      const preservedPermissions = preserveExistingPermissions(memberResult.data as Record<string, unknown>, invite, roleName);

      const updateMember = await serviceClient
        .from("business_members")
        .update({
          display_name: invite.display_name || memberResult.data.display_name,
          role_name: roleName,
          member_status: "active",
          invited_by: invite.invited_by || memberResult.data.invited_by,
          ...preservedPermissions,
          updated_at: new Date().toISOString(),
        })
        .eq("id", memberResult.data.id);

      if (updateMember.error) {
        return NextResponse.json({ error: updateMember.error.message }, { status: 500 });
      }
    } else {
      // Eğer üyelik kaydı yoksa invite üzerinde saklanan baloncuk yetkilerini kullan.
      const invitePermissions = permissionsFromInvite(invite, roleName);

      const insertMember = await serviceClient.from("business_members").insert({
        business_id: businessId,
        email: userEmail,
        display_name: invite.display_name || null,
        invited_by: invite.invited_by || null,
        role_name: roleName,
        member_status: "active",
        ...invitePermissions,
      });

      if (insertMember.error) {
        return NextResponse.json({ error: insertMember.error.message }, { status: 500 });
      }
    }

    const updateInvite = await serviceClient
      .from("team_invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", String(invite.id));

    if (updateInvite.error) {
      return NextResponse.json({ error: updateInvite.error.message }, { status: 500 });
    }

    await serviceClient.from("notifications").insert({
      business_id: businessId,
      created_by: userEmail,
      target_email: null,
      title: "Ekip daveti kabul edildi",
      message: `${userEmail} ${businessResult.data.name} işletmesine katıldı.`,
      type: "success",
      href: "/app/settings",
    });

    return NextResponse.json({
      ok: true,
      businessId,
      businessName: businessResult.data.name,
      roleName,
      message: "Davet kabul edildi. Kullanıcı işletmeye seçilen yetkilerle bağlandı.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Davet kabul edilemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
