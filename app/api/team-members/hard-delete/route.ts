import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.replace("Bearer ", "").trim();
}

function normalizeEmail(email: string | null | undefined) {
  return (email || "").trim().toLowerCase();
}

async function findAuthUserIdByEmail(serviceClient: ReturnType<typeof createClient>, email: string) {
  let page = 1;
  const perPage = 100;

  for (let i = 0; i < 20; i += 1) {
    const result = await serviceClient.auth.admin.listUsers({
      page,
      perPage,
    });

    if (result.error) {
      throw result.error;
    }

    const user = result.data.users.find((item) => normalizeEmail(item.email) === email);

    if (user) return user.id;

    if (result.data.users.length < perPage) return null;

    page += 1;
  }

  return null;
}

async function deleteFromTableIfExists(
  serviceClient: ReturnType<typeof createClient>,
  tableName: string,
  callback: () => Promise<{ error: unknown }>
) {
  try {
    const result = await callback();

    if (result.error) {
      const message = String((result.error as { message?: string })?.message || result.error);

      if (
        message.includes("does not exist") ||
        message.includes("relation") ||
        message.includes("schema cache")
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
      message.includes("schema cache")
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

    const actorMember = await serviceClient
      .from("business_members")
      .select("*")
      .eq("business_id", businessId)
      .eq("email", actorEmail)
      .eq("member_status", "active")
      .maybeSingle();

    const businessResult = await serviceClient
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .maybeSingle();

    if (businessResult.error || !businessResult.data) {
      return NextResponse.json({ error: "İşletme bulunamadı." }, { status: 404 });
    }

    const isOwner = normalizeEmail(businessResult.data.owner_email) === actorEmail;
    const canManageSettings =
      isOwner ||
      actorMember.data?.role_name === "Sahip" ||
      actorMember.data?.can_manage_settings === true;

    if (!canManageSettings) {
      return NextResponse.json({ error: "Bu işlem için Ayarlar yetkisi gerekiyor." }, { status: 403 });
    }

    if (normalizeEmail(businessResult.data.owner_email) === targetEmail) {
      return NextResponse.json({ error: "İşletme sahibinin hesabı buradan silinemez." }, { status: 403 });
    }

    const targetMemberQuery = serviceClient
      .from("business_members")
      .select("*")
      .eq("business_id", businessId)
      .eq("email", targetEmail);

    const targetMemberResult = memberId
      ? await targetMemberQuery.eq("id", memberId).maybeSingle()
      : await targetMemberQuery.maybeSingle();

    if (targetMemberResult.error) {
      return NextResponse.json({ error: targetMemberResult.error.message }, { status: 500 });
    }

    if (!targetMemberResult.data) {
      return NextResponse.json({ error: "Silinecek ekip üyesi bulunamadı." }, { status: 404 });
    }

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

    await deleteFromTableIfExists(serviceClient, "profiles", () =>
      serviceClient.from("profiles").delete().eq("email", targetEmail)
    );

    await deleteFromTableIfExists(serviceClient, "app_user_profiles", () =>
      serviceClient.from("app_user_profiles").delete().eq("email", targetEmail)
    );

    await deleteFromTableIfExists(serviceClient, "app_notifications", () =>
      serviceClient.from("app_notifications").delete().eq("business_id", businessId).eq("target_email", targetEmail)
    );

    await deleteFromTableIfExists(serviceClient, "app_messages", () =>
      serviceClient.from("app_messages").delete().eq("business_id", businessId).eq("target_email", targetEmail)
    );

    const otherMemberships = await serviceClient
      .from("business_members")
      .select("id, business_id, member_status")
      .eq("email", targetEmail)
      .eq("member_status", "active");

    const ownedBusiness = await serviceClient
      .from("businesses")
      .select("id")
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
    } else {
      authSkippedReason = "Kullanıcının başka işletme sahipliği/aktif üyeliği olduğu için Auth hesabı silinmedi.";
    }

    await serviceClient.from("notifications").insert({
      business_id: businessId,
      created_by: actorEmail,
      target_email: null,
      title: "Ekip üyesi silindi",
      message: `${targetEmail} işletmeden kaldırıldı.${authDeleted ? " Auth hesabı da silindi." : ` Auth silinmedi: ${authSkippedReason}`}`,
      type: authDeleted ? "success" : "warning",
      href: "/app/settings",
    });

    return NextResponse.json({
      ok: true,
      email: targetEmail,
      authDeleted,
      authSkippedReason,
      message: authDeleted
        ? "Ekip üyesi ve Auth hesabı tamamen silindi."
        : `Ekip üyesi işletmeden silindi. Auth hesabı silinmedi: ${authSkippedReason}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ekip üyesi silinemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
