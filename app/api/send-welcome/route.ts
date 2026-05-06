import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Takipio send-welcome API çalışıyor.",
  });
}

async function markEmailAsSent(email: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      ok: false,
      skipped: true,
      message: "Supabase service role key veya URL eksik olduğu için emailed güncellenmedi.",
    };
  }

  const updateUrl = `${supabaseUrl}/rest/v1/waitlist?email=eq.${encodeURIComponent(email)}`;

  const response = await fetch(updateUrl, {
    method: "PATCH",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      emailed: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      ok: false,
      skipped: false,
      message: "Supabase emailed update başarısız.",
      details: errorText,
      status: response.status,
    };
  }

  return {
    ok: true,
    skipped: false,
    message: "Supabase emailed alanı true yapıldı.",
  };
}

export async function POST(request: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return NextResponse.json(
        { ok: false, message: "RESEND_API_KEY tanımlı değil." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, message: "Geçerli bir e-posta adresi gerekli." },
        { status: 400 }
      );
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
        subject: "Takipio erken erişim listen aktif 🚀",
        html: `
          <!doctype html>
          <html lang="tr">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <meta name="color-scheme" content="light" />
              <meta name="supported-color-schemes" content="light" />
              <title>Takipio Erken Erişim</title>
            </head>
            <body style="margin:0;padding:0;background:#eef6ff;font-family:Arial,Helvetica,sans-serif;color:#06101f;">
              <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
                Takipio erken erişim listen aktif. Açılışa özel indirim kodun: TAKIPIO10
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#eef6ff;padding:34px 12px;">
                <tr>
                  <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:650px;background:#ffffff;border-radius:30px;overflow:hidden;border:1px solid #d8e9ff;box-shadow:0 26px 70px rgba(9,30,66,0.13);">
                      <tr>
                        <td style="padding:0;background:#071226;">
                          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td style="padding:30px 30px 26px;background:linear-gradient(135deg,#06101f 0%,#092d73 50%,#0b63ff 100%);">
                                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                  <tr>
                                    <td align="left" style="vertical-align:middle;">
                                      <div style="display:inline-block;padding:10px 14px;border-radius:999px;background:rgba(255,255,255,0.11);border:1px solid rgba(255,255,255,0.18);color:#ffffff;font-size:15px;font-weight:900;letter-spacing:-0.2px;">
                                        takipio
                                      </div>
                                    </td>
                                    <td align="right" style="vertical-align:middle;">
                                      <div style="display:inline-block;padding:9px 12px;border-radius:999px;background:#ffffff;color:#0b63ff;font-size:12px;font-weight:900;letter-spacing:0.4px;text-transform:uppercase;">
                                        Erken Erişim
                                      </div>
                                    </td>
                                  </tr>
                                </table>

                                <h1 style="margin:34px 0 0;font-size:38px;line-height:1.06;letter-spacing:-1.7px;color:#ffffff;font-weight:900;">
                                  Kaydın alındı, artık listedesin 🚀
                                </h1>
                                <p style="margin:15px 0 0;font-size:17px;line-height:1.65;color:#dcecff;max-width:520px;">
                                  Takipio yayına çıktığında ilk haberdar olanlardan biri olacaksın. Sipariş, müşteri, stok ve ödeme takibini tek panelden yönetmek için hazırlık başladı.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:30px 30px 10px;background:#ffffff;">
                          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td style="padding:25px;border-radius:26px;background:#f2f8ff;border:1px solid #cfe3ff;text-align:center;">
                                <div style="font-size:12px;font-weight:900;color:#0b63ff;text-transform:uppercase;letter-spacing:1.2px;">
                                  Açılışa özel indirim kodun
                                </div>
                                <div style="margin-top:12px;font-size:42px;line-height:1;font-weight:900;letter-spacing:2px;color:#06101f;">
                                  TAKIPIO10
                                </div>
                                <div style="margin-top:13px;font-size:14px;line-height:1.5;color:#667085;font-weight:700;">
                                  Açılışta ilk ay avantajı için bu kodu kullanabileceksin.
                                </div>
                              </td>
                            </tr>
                          </table>

                          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:18px;">
                            <tr>
                              <td width="50%" style="padding:0 7px 0 0;">
                                <div style="min-height:118px;padding:20px;border-radius:22px;background:#06101f;color:#ffffff;border:1px solid #13223c;">
                                  <div style="font-size:12px;font-weight:900;color:#9ec5ff;text-transform:uppercase;letter-spacing:0.7px;">Açılış Fırsatı</div>
                                  <div style="margin-top:8px;font-size:34px;font-weight:900;line-height:1;color:#ffffff;">₺89</div>
                                  <div style="margin-top:8px;font-size:13px;line-height:1.45;color:#c7d7ee;font-weight:700;">İlk ay özel başlangıç fiyatı</div>
                                </div>
                              </td>
                              <td width="50%" style="padding:0 0 0 7px;">
                                <div style="min-height:118px;padding:20px;border-radius:22px;background:#f7fbff;color:#06101f;border:1px solid #dbeafe;">
                                  <div style="font-size:12px;font-weight:900;color:#0b63ff;text-transform:uppercase;letter-spacing:0.7px;">Durum</div>
                                  <div style="margin-top:8px;font-size:24px;font-weight:900;line-height:1.15;color:#06101f;">Listedesin</div>
                                  <div style="margin-top:8px;font-size:13px;line-height:1.45;color:#667085;font-weight:700;">Lansman duyurularını ilk sen alacaksın</div>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:20px 30px 6px;background:#ffffff;">
                          <h2 style="margin:0 0 14px;font-size:22px;line-height:1.25;letter-spacing:-0.6px;color:#06101f;font-weight:900;">
                            Takipio ile neler geliyor?
                          </h2>

                          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td style="padding:14px 0;border-bottom:1px solid #edf3fb;">
                                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                  <tr>
                                    <td width="42" valign="top">
                                      <div style="width:34px;height:34px;border-radius:12px;background:#e8f2ff;color:#0b63ff;text-align:center;line-height:34px;font-size:17px;font-weight:900;">1</div>
                                    </td>
                                    <td valign="top">
                                      <div style="font-size:16px;font-weight:900;color:#101828;">Siparişlerini tek panelden yönet</div>
                                      <div style="margin-top:4px;font-size:14px;line-height:1.55;color:#667085;">Açık işleri, teslimat durumlarını ve müşteri notlarını daha düzenli takip et.</div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:14px 0;border-bottom:1px solid #edf3fb;">
                                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                  <tr>
                                    <td width="42" valign="top">
                                      <div style="width:34px;height:34px;border-radius:12px;background:#e8f2ff;color:#0b63ff;text-align:center;line-height:34px;font-size:17px;font-weight:900;">2</div>
                                    </td>
                                    <td valign="top">
                                      <div style="font-size:16px;font-weight:900;color:#101828;">Gorki AI asistan yanında</div>
                                      <div style="margin-top:4px;font-size:14px;line-height:1.55;color:#667085;">Günlük özetler, hatırlatmalar ve iş takibi için akıllı bir yardımcı.</div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:14px 0;">
                                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                  <tr>
                                    <td width="42" valign="top">
                                      <div style="width:34px;height:34px;border-radius:12px;background:#e8f2ff;color:#0b63ff;text-align:center;line-height:34px;font-size:17px;font-weight:900;">3</div>
                                    </td>
                                    <td valign="top">
                                      <div style="font-size:16px;font-weight:900;color:#101828;">Stok ve ödeme kontrolü</div>
                                      <div style="margin-top:4px;font-size:14px;line-height:1.55;color:#667085;">Eksik ödeme, bekleyen iş ve stok durumunu daha net gör.</div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:24px 30px 30px;background:#ffffff;">
                          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td align="center" style="padding:24px;border-radius:26px;background:linear-gradient(180deg,#f8fbff,#eef6ff);border:1px solid #dbeafe;">
                                <div style="font-size:18px;font-weight:900;color:#06101f;letter-spacing:-0.4px;">
                                  Lansman yaklaştığında seni bilgilendireceğiz.
                                </div>
                                <div style="margin-top:9px;font-size:14px;line-height:1.6;color:#667085;max-width:430px;">
                                  Bu sırada Takipio gelişmelerini Instagram’dan takip edebilirsin.
                                </div>

                                <table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:20px;">
                                  <tr>
                                    <td align="center" style="padding:0 5px 10px;">
                                      <a href="https://takipio.com" style="display:inline-block;background:#0b63ff;color:#ffffff;text-decoration:none;font-size:15px;font-weight:900;padding:14px 20px;border-radius:14px;box-shadow:0 14px 28px rgba(11,99,255,0.22);">
                                        Siteyi Gör
                                      </a>
                                    </td>
                                    <td align="center" style="padding:0 5px 10px;">
                                      <a href="https://instagram.com/takipiocom" style="display:inline-block;background:#06101f;color:#ffffff;text-decoration:none;font-size:15px;font-weight:900;padding:14px 20px;border-radius:14px;">
                                        Instagram
                                      </a>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:22px 30px 30px;background:#06101f;text-align:center;color:#9fb2cc;font-size:12px;line-height:1.7;">
                          <div style="font-size:15px;font-weight:900;color:#ffffff;margin-bottom:6px;">takipio</div>
                          Bu mail, Takipio erken erişim listesine kayıt olduğun için gönderildi.<br />
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
        `,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, message: "Mail gönderilemedi.", details: result },
        { status: response.status }
      );
    }

    const emailedUpdate = await markEmailAsSent(email);

    return NextResponse.json({
      ok: true,
      result,
      emailedUpdate,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Beklenmeyen bir hata oluştu.", error: String(error) },
      { status: 500 }
