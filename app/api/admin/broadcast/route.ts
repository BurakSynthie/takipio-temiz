import { NextResponse } from "next/server";

type WaitlistUser = {
  id: string;
  email: string;
  coupon_code?: string | null;
  emailed?: boolean | null;
  created_at?: string | null;
};

function getLaunchBroadcastHtml() {
  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <title>Takipio Lansman Duyurusu</title>
      </head>
      <body style="margin:0;padding:0;background:#eef6ff;font-family:Arial,Helvetica,sans-serif;color:#06101f;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
          Takipio lansmana hazırlanıyor. Erken erişim indirim kodun: TAKIPIO10
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#eef6ff;padding:34px 12px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:650px;background:#ffffff;border-radius:30px;overflow:hidden;border:1px solid #d8e9ff;box-shadow:0 26px 70px rgba(9,30,66,0.13);">
                <tr>
                  <td style="padding:32px 30px;background:linear-gradient(135deg,#06101f 0%,#092d73 50%,#0b63ff 100%);">
                    <div style="display:inline-block;padding:10px 14px;border-radius:999px;background:rgba(255,255,255,0.11);border:1px solid rgba(255,255,255,0.18);color:#ffffff;font-size:15px;font-weight:900;letter-spacing:-0.2px;">
                      takipio
                    </div>
                    <h1 style="margin:34px 0 0;font-size:38px;line-height:1.06;letter-spacing:-1.7px;color:#ffffff;font-weight:900;">
                      Takipio lansmana hazırlanıyor 🚀
                    </h1>
                    <p style="margin:15px 0 0;font-size:17px;line-height:1.65;color:#dcecff;max-width:520px;">
                      Bekleme listesinde olduğun için açılışa özel avantajlardan ilk sen yararlanabileceksin.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:30px;background:#ffffff;">
                    <div style="padding:25px;border-radius:26px;background:#f2f8ff;border:1px solid #cfe3ff;text-align:center;">
                      <div style="font-size:12px;font-weight:900;color:#0b63ff;text-transform:uppercase;letter-spacing:1.2px;">
                        Erken erişim indirim kodun
                      </div>
                      <div style="margin-top:12px;font-size:42px;line-height:1;font-weight:900;letter-spacing:2px;color:#06101f;">
                        TAKIPIO10
                      </div>
                      <div style="margin-top:13px;font-size:14px;line-height:1.5;color:#667085;font-weight:700;">
                        Takipio açıldığında ilk ay avantajı için kullanabileceksin.
                      </div>
                    </div>

                    <div style="margin-top:22px;padding:24px;border-radius:26px;background:#06101f;color:#ffffff;text-align:center;">
                      <div style="font-size:18px;font-weight:900;letter-spacing:-0.4px;">
                        İşletme takibi artık daha düzenli olacak.
                      </div>
                      <div style="margin-top:9px;font-size:14px;line-height:1.6;color:#c7d7ee;">
                        Sipariş, müşteri, stok, ödeme ve Gorki AI asistan tek panelde buluşuyor.
                      </div>
                    </div>

                    <div style="margin-top:24px;text-align:center;">
                      <a href="https://takipio.com" style="display:inline-block;background:#0b63ff;color:#ffffff;text-decoration:none;font-size:15px;font-weight:900;padding:14px 20px;border-radius:14px;box-shadow:0 14px 28px rgba(11,99,255,0.22);margin:0 5px 10px;">Takipio'yu Gör</a>
                      <a href="https://instagram.com/takipiocom" style="display:inline-block;background:#06101f;color:#ffffff;text-decoration:none;font-size:15px;font-weight:900;padding:14px 20px;border-radius:14px;margin:0 5px 10px;">Instagram</a>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:22px 30px 30px;background:#06101f;text-align:center;color:#9fb2cc;font-size:12px;line-height:1.7;">
                    <div style="font-size:15px;font-weight:900;color:#ffffff;margin-bottom:6px;">takipio</div>
                    Bu mail, Takipio bekleme listesinde olduğun için gönderildi.<br />
                    Web: <a href="https://takipio.com" style="color:#8fc2ff;text-decoration:none;font-weight:800;">takipio.com</a>
                    &nbsp;•&nbsp;
                    Instagram: <a href="https://instagram.com/takipiocom" style="color:#8fc2ff;text-decoration:none;font-weight:800;">@takipiocom</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

async function getWaitlistUsers() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase URL veya service role key eksik.");
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/waitlist?select=id,email,coupon_code,emailed,created_at&emailed=eq.true&order=created_at.asc`,
    {
      method: "GET",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Waitlist okunamadı: ${errorText}`);
  }

  return (await response.json()) as WaitlistUser[];
}

async function sendEmail(email: string) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY eksik.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Takipio <noreply@takipio.com>",
      to: [email],
      subject: "Takipio lansmana hazırlanıyor 🚀",
      html: getLaunchBroadcastHtml(),
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    return {
      ok: false,
      email,
      details: result,
    };
  }

  return {
    ok: true,
    email,
    result,
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Takipio broadcast API hazır. POST ile çalışır.",
  });
}

export async function POST(request: Request) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret) {
      return NextResponse.json(
        { ok: false, message: "ADMIN_SECRET tanımlı değil." },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const secret = String(body?.secret || "");
    const dryRun = Boolean(body?.dryRun);
    const limit = Number(body?.limit || 20);

    if (secret !== adminSecret) {
      return NextResponse.json(
        { ok: false, message: "Yetkisiz istek." },
        { status: 401 }
      );
    }

    const users = await getWaitlistUsers();
    const selectedUsers = users.slice(0, Math.min(Math.max(limit, 1), 50));

    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        totalEligible: users.length,
        selectedCount: selectedUsers.length,
        recipients: selectedUsers.map((user) => user.email),
      });
    }

    const results = [];

    for (const user of selectedUsers) {
      const result = await sendEmail(user.email);
      results.push(result);
    }

    return NextResponse.json({
      ok: true,
      totalEligible: users.length,
      sentCount: results.filter((item) => item.ok).length,
      failedCount: results.filter((item) => !item.ok).length,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Broadcast gönderimi sırasında hata oluştu.",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
