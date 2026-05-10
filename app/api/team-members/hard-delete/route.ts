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
];

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.replace("Bearer ", "").trim();
}

function normalizeEmail(email: string | null | undefined) {
  return (email || "").trim().toLowerCase();
}

function collectPermissions(member: Record<string, unknown>) {
  const permissions: Record<string, boolean> = {};

  permissionKeys.forEach((key) => {
    permissions[key] = Boolean(member[key]);
  });

  return permissions;
}

type SupabaseAdminUser = {
  id: string;
  email?: string | null;
};

async function findAuthUserIdByEmail(serviceClient: any, email: string) {
  let page = 1;
  const perPage = 100;

  for (let i = 0; i < 30; i += 1) {
    const result = await serviceClient.auth.admin.listUsers({ page, perPage });

    if (result.error) throw result.error;

    const users = ((result.data?.users || []) as SupabaseAdminUser[]);
    const user = users.find((item) => normalizeEmail(item.email) === email);

    if (user) return user.id;

    if (users.length < perPage) return null;

    page += 1;
  }

  return null;
}

async function safeDelete(callback: () => any) {
  try {
    const result = await callback();

    if (result.error) {
      const message = String((result.error as { message?: string })?.message || result.error);

      if (
        message.includes("does not exist") ||
        message.includes("relation") ||
        message.includes("schema cache") ||
        message.includes("column")
      ) {
        return null;
      }

      throw result.error;
    }

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (
      message.includes("does not exist") ||
      message.includes("relation") ||
      message.includes("schema cache") ||
      message.includes("column")
    ) {
      return null;
    }

    throw error;
  }
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
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const userResult = await userClient.auth.getUser(token);
    const actorEmail = normalizeEmail(userResult.data.user?.email);

    if (!actorEmail) {
      return NextResponse.json({ error: "Kullanıcı doğrulanamadı." }, { status: 401 });
    }

    const body = await request.json();
    const businessId = String(body.businessId || "").trim();
    const targetEmail = normalizeEmail(body.email);
    const memberId = String(body.memberId || "").trim();

    if (!businessId || !targetEmail) {
      return NextResponse.json({ error: "businessId ve email zorunlu." }, { status: 400 });
    }

    if (targetEmail === actorEmail) {
      return NextResponse.json({ error: "Kendi hesabını bu ekrandan silemezsin." }, { status: 403 });
    }

    const businessResult = await serviceClient
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .maybeSingle();

    if (businessResult.error || !businessResult.data) {
      return NextResponse.json({ error: "İşletme bulunamadı." }, { status: 404 });
    }

    const business = businessResult.data;
    const actorMember = await serviceClient
      .from("business_members")
      .select("*")
      .eq("business_id", businessId)
      .eq("email", actorEmail)
      .eq("member_status", "active")
      .maybeSingle();

    const isOwner = normalizeEmail(business.owner_email) === actorEmail;
    const canManageSettings =
      isOwner ||
      actorMember.data?.role_name === "Sahip" ||
      actorMember.data?.can_manage_settings === true;

    if (!canManageSettings) {
      return NextResponse.json({ error: "Bu işlem için Ayarlar yetkisi gerekiyor." }, { status: 403 });
    }

    if (normalizeEmail(business.owner_email) === targetEmail) {
      return NextResponse.json({ error: "İşletme sahibinin hesabı buradan silinemez." }, { status: 403 });
    }

    const targetQuery = serviceClient
      .from("business_members")
      .select("*")
      .eq("business_id", businessId)
      .eq("email", targetEmail);

    const targetMemberResult = memberId
      ? await targetQuery.eq("id", memberId).maybeSingle()
      : await targetQuery.maybeSingle();

    if (targetMemberResult.error) {
      return NextResponse.json({ error: targetMemberResult.error.message }, { status: 500 });
    }

    if (!targetMemberResult.data) {
      return NextResponse.json({ error: "Silinecek ekip üyesi bulunamadı." }, { status: 404 });
    }

    const previousMember = targetMemberResult.data as Record<string, unknown>;
    const previousPermissions = collectPermissions(previousMember);

    await serviceClient
      .from("business_members")
      .delete()
      .eq("business_id", businessId)
      .eq("email", targetEmail);

    await serviceClient
      .from("team_invites")
      .delete()
      .eq("business_id", businessId)
      .eq("email", targetEmail);

    await serviceClient
      .from("notifications")
      .delete()
      .eq("business_id", businessId)
      .eq("target_email", targetEmail);

    await safeDelete(() => serviceClient.from("profiles").delete().eq("email", targetEmail));
    await safeDelete(() => serviceClient.from("app_user_profiles").delete().eq("email", targetEmail));
    await safeDelete(() =>
      serviceClient.from("app_notifications").delete().eq("business_id", businessId).eq("target_email", targetEmail)
    );
    await safeDelete(() =>
      serviceClient.from("app_messages").delete().eq("business_id", businessId).eq("target_email", targetEmail)
    );

    const otherMemberships = await serviceClient
      .from("business_members")
      .select("id, business_id, member_status")
      .eq("email", targetEmail)
      .eq("member_status", "active");

    const ownedBusiness = await serviceClient
      .from("businesses")
      .select("id, plan_code, plan_status")
      .eq("owner_email", targetEmail)
      .limit(1);

    const hasOtherActiveMembership = Boolean(otherMemberships.data?.length);
    const ownsAnotherBusiness = Boolean(ownedBusiness.data?.length);

    let authDeleted = false;
    let authSkippedReason = "";

    if (!hasOtherActiveMembership && !ownsAnotherBusiness) {
      const authUserId = await findAuthUserIdByEmail(serviceClient, targetEmail);

      if (authUserId) {
        const deleteAuth = await serviceClient.auth.admin.deleteUser(authUserId);

        if (deleteAuth.error) {
          authSkippedReason = deleteAuth.error.message;
        } else {
          authDeleted = true;
        }
      } else {
        authSkippedReason = "Auth kullanıcısı bulunamadı.";
      }

      // Kritik güvenlik: Auth silinmezse veya zaten bulunamazsa kullanıcıya kişisel Pro taşınmasın.
      await serviceClient.from("user_plan_overrides").upsert(
        {
          email: targetEmail,
          forced_plan: "free",
          reason: `Removed from business ${businessId}. Old business plan must not transfer to personal account.`,
          source_business_id: businessId,
          created_by: actorEmail,
          revoked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );
    } else {
      authSkippedReason = "Kullanıcının başka işletme sahipliği/aktif üyeliği olduğu için Auth hesabı ve plan override uygulanmadı.";
    }

    await serviceClient.from("team_member_removals").insert({
      business_id: businessId,
      email: targetEmail,
      removed_by: actorEmail,
      previous_role: String(previousMember.role_name || ""),
      previous_permissions: previousPermissions,
      auth_deleted: authDeleted,
      auth_delete_reason: authSkippedReason || null,
    });

    await serviceClient.from("notifications").insert({
      business_id: businessId,
      created_by: actorEmail,
      target_email: null,
      title: "Ekip üyesi silindi",
      message: `${targetEmail} işletmeden kaldırıldı. Pro erişimi işletme üzerinden kesildi.${authDeleted ? " Auth hesabı da silindi." : ` Auth silinmedi: ${authSkippedReason}`}`,
      type: authDeleted ? "success" : "warning",
      href: "/app/settings",
    });

    return NextResponse.json({
      ok: true,
      email: targetEmail,
      authDeleted,
      authSkippedReason,
      planRevoked: !hasOtherActiveMembership && !ownsAnotherBusiness,
      message: authDeleted
        ? "Ekip üyesi, profili, davetleri ve Auth hesabı silindi. Pro erişimi kesildi."
        : `Ekip üyesi işletmeden silindi. Pro erişimi eski işletmeden kesildi. Auth durumu: ${authSkippedReason}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ekip üyesi silinemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
