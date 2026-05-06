import { NextResponse } from "next/server";

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
        subject: "Takipio erken erişim listesine hoş geldin 🚀",
        html: `
          <!doctype html>
          <html lang="tr">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Takipio</title>
            </head>
            <body style="margin:0;padding:0;background:#f5f9ff;font-family:Arial,Helvetica,sans-serif;color:#06101f;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f5f9ff;padding:32px 12px;">
                <tr>
                  <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:620px;background:#ffffff;border-radius:28px;overflow:hidden;border:1px solid #dbeafe;box-shadow:0 24px 60px rgba(15,32,64,0.10);">
                      <tr>
                        <td style="padding:32px 32px 20px;background:linear-gradient(135deg,#06101f,#0b63ff);color:#ffffff;">
                          <div style="font-size:15px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#b9d8ff;">Takipio</div>
                          <h1 style="margin:12px 0 0;font-size:34px;line-height:1.08;letter-spacing:-1.2px;">Erken erişim listesine hoş geldin 🚀</h1>
                          <p style="margin:14px 0 0;font-size:16px;line-height:1.55;color:#eaf3ff;">Takipio yayına çıktığında ilk haberdar olanlardan biri olacaksın.</p>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:30px 32px 10px;">
                          <p style="margin:0 0 16px;font-size:17px;line-height:1.65;color:#344054;">
                            Sipariş, müşteri, stok ve ödeme takibini tek panelden yönetmeni sağlayacak Takipio için kaydını aldık.
                          </p>

                          <div style="margin:26px 0;padding:24px;border-radius:22px;background:#f0f7ff;border:1px solid #bfdbfe;text-align:center;">
                            <div style="font-size:13px;font-weight:800;color:#0b63ff;text-transform:uppercase;letter-spacing:1px;">Açılışa özel indirim kodun</div>
                            <div style="margin-top:10px;font-size:36px;font-weight:900;letter-spacing:2px;color:#06101f;">TAKIPIO10</div>
                            <div style="margin-top:8px;font-size:14px;color:#667085;">Açılışta ilk ay avantajı için kullanabileceksin.</div>
                          </div>

                          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:22px 0;">
                            <tr>
                              <td style="padding:12px 0;font-size:15px;color:#344054;">✅ İlk ay indirim avantajı</td>
                            </tr>
                            <tr>
                              <td style="padding:12px 0;font-size:15px;color:#344054;">✅ Gorki AI asistan dahil</td>
                            </tr>
                            <tr>
                              <td style="padding:12px 0;font-size:15px;color:#344054;">✅ Lansman duyurularını ilk sen alacaksın</td>
                            </tr>
                          </table>

                          <div style="text-align:center;margin:30px 0 14px;">
                            <a href="https://takipio.com" style="display:inline-block;background:#0b63ff;color:#ffffff;text-decoration:none;font-size:16px;font-weight:800;padding:15px 24px;border-radius:14px;box-shadow:0 14px 28px rgba(11,99,255,0.24);">Takipio'yu ziyaret et</a>
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:22px 32px 32px;text-align:center;color:#667085;font-size:13px;line-height:1.55;">
                          Bu mail, Takipio erken erişim listesine kayıt olduğun için gönderildi.<br />
                          Instagram: <a href="https://instagram.com/takipiocom" style="color:#0b63ff;text-decoration:none;font-weight:700;">@takipiocom</a>
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

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Beklenmeyen bir hata oluştu.", error: String(error) },
      { status: 500 }
    );
  }
}
