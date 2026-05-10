import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.replace("Bearer ", "").trim();
}

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://takipio.com";
}

export async function POST(request: Request) {
  try {
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

    const userResult = await supabase.auth.getUser(token);

    if (!userResult.data.user?.email) {
      return NextResponse.json({ error: "Oturum doğrulanamadı." }, { status: 401 });
    }

    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const displayName = String(body.displayName || "").trim();
    const businessName = String(body.businessName || "Takipio").trim();
    const roleName = String(body.roleName || "Personel").trim();
    const inviteToken = String(body.token || "").trim();

    if (!email) {
      return NextResponse.json({ error: "E-posta zorunlu." }, { status: 400 });
    }

    const inviteLink = `${getBaseUrl()}/register?invite=${encodeURIComponent(inviteToken)}&email=${encodeURIComponent(email)}`;

    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        message: "RESEND_API_KEY olmadığı için mail gönderilmedi. Davet kaydı oluşturuldu.",
        inviteLink,
      });
    }

    const html = `
      <div style="font-family:Arial,sans-serif;background:#07111f;padding:32px;color:#fff">
        <div style="max-width:560px;margin:auto;background:#0f1b2f;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:28px">
          <h1 style="margin:0 0 12px;font-size:28px">Takipio ekip daveti</h1>
          <p style="color:#b8c2d6;line-height:1.6">Merhaba ${displayName || ""},</p>
          <p style="color:#b8c2d6;line-height:1.6"><b>${businessName}</b> işletmesine <b>${roleName}</b> rolüyle davet edildin.</p>
          <a href="${inviteLink}" style="display:inline-block;margin-top:18px;background:#2563eb;color:white;text-decoration:none;padding:14px 20px;border-radius:14px;font-weight:700">Takipio’ya katıl</a>
          <p style="margin-top:22px;color:#7d8aa3;font-size:12px">Bu davet bağlantısı güvenlik amacıyla sınırlı süre kullanılabilir.</p>
        </div>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Takipio <noreply@takipio.com>",
        to: [email],
        subject: `${businessName} seni Takipio’ya davet etti`,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      return NextResponse.json({
        ok: false,
        error: `Mail gönderilemedi: ${errorText}`,
        inviteLink,
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: "Davet maili gönderildi.",
      inviteLink,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Davet maili gönderilemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
