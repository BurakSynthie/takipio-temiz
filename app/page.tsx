"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type DemoTab = "overview" | "orders" | "customers" | "payments";

const demoTabs: {
  key: DemoTab;
  label: string;
  short: string;
  value: string;
  helper: string;
}[] = [
  {
    key: "overview",
    label: "Genel Bakış",
    short: "Özet",
    value: "₺125.250",
    helper: "Haftalık ciro",
  },
  {
    key: "orders",
    label: "Siparişler",
    short: "İşler",
    value: "128",
    helper: "Aktif sipariş",
  },
  {
    key: "customers",
    label: "Müşteriler",
    short: "CRM",
    value: "89",
    helper: "Kayıtlı müşteri",
  },
  {
    key: "payments",
    label: "Ödemeler",
    short: "Kasa",
    value: "₺18.900",
    helper: "Bekleyen ödeme",
  },
];

const gorkiMessages = [
  "Bu hafta gelirin %12 yükseldi.",
  "3 sipariş teslimata yaklaşıyor.",
  "2 ödeme için hatırlatma gönderebilirsin.",
  "Stokta azalan ürünleri senin için işaretledim.",
];

export default function Page() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<DemoTab>("overview");
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex((current) => (current + 1) % gorkiMessages.length);
    }, 2600);

    const tabTimer = setInterval(() => {
      setActiveTab((current) => {
        const index = demoTabs.findIndex((tab) => tab.key === current);
        const next = demoTabs[(index + 1) % demoTabs.length];
        return next.key;
      });
    }, 4200);

    return () => {
      clearInterval(messageTimer);
      clearInterval(tabTimer);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage("Lütfen e-posta adresini yaz.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("waitlist_signups").insert([
      {
        email: cleanEmail,
        coupon_code: "TAKIPIO10",
      },
    ]);

    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        setErrorMessage("Bu e-posta zaten bekleme listesinde.");
        return;
      }

      setErrorMessage("Kayıt sırasında bir sorun oldu. Lütfen tekrar dene.");
      return;
    }

    setSaved(true);
    setEmail("");
    setTimeout(() => setSaved(false), 3200);
  }

  return (
    <main className="takipioPremium">
      <div className="mesh meshOne" />
      <div className="mesh meshTwo" />
      <div className="mesh meshThree" />
      <div className="softGrid" />
      <div className="noise" />

      <header className="navBar">
        <a className="brandCapsule" href="#top" aria-label="Takipio">
          <img src="/takipio-logo.png" alt="Takipio" />
        </a>

        <nav className="navLinks">
          <a href="#features">Özellikler</a>
          <a href="#product">Ürün</a>
          <a href="#assistant">Gorki AI</a>
          <a href="#pricing">Fiyat</a>
          <a
            href="https://instagram.com/takipiocom"
            target="_blank"
            rel="noreferrer"
            className="instagramNav"
          >
            <InstagramIcon /> @takipiocom
          </a>
          <a className="navCta" href="#waitlist">
            Açılışa Özel Başla
            <ArrowIcon />
          </a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="heroCopy">
          <div className="statusPill">
            <span />
            Çok yakında yayında
          </div>

          <h1>
            İşini <mark>kontrol</mark> etmeden büyütemezsin.
          </h1>

          <p className="heroText">
            Sipariş, müşteri, stok ve ödemelerini tek panelde yönet. Takipio,
            işletmeni büyütürken kontrolü elinde tutman için tasarlandı.
          </p>

          <form className="waitlistCard" id="waitlist" onSubmit={handleSubmit}>
            <div className="waitlistHeader">
              <div className="mailIcon">
                <MailIcon />
              </div>

              <div>
                <h2>Erken erişim listesine katıl</h2>
                <p>
                  Açılışta özel <b>TAKIPIO10</b> indirim kodu ilk kayıt olanlara
                  gönderilecek.
                </p>
              </div>
            </div>

            <div className="formRow">
              <input
                type="email"
                placeholder="E-posta adresiniz"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <button type="submit">
                {loading ? "Kaydediliyor..." : saved ? "Kaydedildi ✓" : "Kayıt Ol"}
                {!loading && !saved && <ArrowIcon />}
              </button>
            </div>

            {errorMessage && <div className="formMessage error">{errorMessage}</div>}
            {saved && (
              <div className="formMessage success">
                Kaydın alındı. Açılışta haber vereceğiz.
              </div>
            )}

            <div className="formMeta">
              <span>
                <CheckIcon /> İlk ay indirim
              </span>
              <span>
                <CheckIcon /> Gorki asistan dahil
              </span>
              <span>
                <CheckIcon /> Spam yok
              </span>
            </div>
          </form>

          <div className="proofBar">
            <div>
              <strong>15</strong>
              <span>müşteriye kadar ücretsiz</span>
            </div>
            <div>
              <strong>7/24</strong>
              <span>her yerden erişim</span>
            </div>
            <div>
              <strong>AI</strong>
              <span>Gorki iş özetleri</span>
            </div>
          </div>
        </div>

        <div className="heroShowcase" id="product">
          <div className="demoArea">
            <div className="ambientGlow" />

            <LaptopMockup activeTab={activeTab} setActiveTab={setActiveTab} />
            <PhoneMockup activeTab={activeTab} setActiveTab={setActiveTab} />

            <FloatingInfoCard
              className="floatOrders"
              icon={<OrdersIcon />}
              title="Siparişler"
              text="Kontrol altında"
              metric="+24 işlem"
            />

            <FloatingInfoCard
              className="floatRevenue"
              icon={<WalletIcon />}
              title="Bugünkü gelir"
              text="₺12.450"
              metric="+%12,6"
            />

            <FloatingInfoCard
              className="floatStock"
              icon={<CubeIcon />}
              title="Stok durumu"
              text="Güncel"
              metric="128 ürün yeterli"
            />
          </div>

          <aside className="sideStack">
            <PricePanel />
            <GorkiPanel message={gorkiMessages[messageIndex]} />
          </aside>
        </div>
      </section>

      <section className="featureGrid" id="features">
        <FeatureCard
          icon={<PanelIcon />}
          title="Tek panelde yönetim"
          text="Sipariş, müşteri, stok ve ödeme takibini tek merkezde topla."
        />

        <FeatureCard
          icon={<ChartIcon />}
          title="Akıllı raporlar"
          text="Günlük performansı, gelirleri ve açık işleri net şekilde gör."
        />

        <FeatureCard
          icon={<CubeIcon />}
          title="Stok kontrolü"
          text="Azalan ürünleri ve güncel stok durumunu kolayca takip et."
        />

        <FeatureCard
          icon={<LinkIcon />}
          title="Kolay entegrasyon"
          text="Kargo, ödeme ve pazaryeri bağlantılarına hazır altyapı."
        />

        <FeatureCard
          icon={<HeadsetIcon />}
          title="7/24 destek"
          text="İşletmeni yönetirken yanında olacak sade destek yapısı."
        />
      </section>

      <section className="bottomBand">
        <a className="domainCard" href="https://takipio.com">
          <GlobeIcon />
          <div>
            <h3>takipio.com</h3>
            <p>Canlı bekleme listesi aktif.</p>
          </div>
        </a>

        <a
          className="instagramCard"
          href="https://instagram.com/takipiocom"
          target="_blank"
          rel="noreferrer"
        >
          <InstagramIcon />
          <div>
            <h3>@takipiocom</h3>
            <p>Lansman duyurularını Instagram’dan takip et.</p>
          </div>
        </a>

        <div className="trustCard">
          <div>
            <ShieldIcon />
            <span>Güvenli altyapı</span>
          </div>
          <div>
            <BoltIcon />
            <span>Hızlı kullanım</span>
          </div>
          <div>
            <HeadsetIcon />
            <span>Destek hazır</span>
          </div>
        </div>
      </section>

      <style jsx global>{`
        :root {
          --bg: #f8fbff;
          --white: #ffffff;
          --ink: #06101f;
          --ink2: #101828;
          --muted: #667085;
          --soft: #eef5ff;
          --blue: #0b63ff;
          --blue2: #00a8ff;
          --cyan: #49d9ff;
          --green: #12b76a;
          --orange: #f79009;
          --line: rgba(11, 99, 255, 0.14);
          --line2: rgba(11, 99, 255, 0.22);
          --shadow: 0 28px 70px rgba(15, 32, 64, 0.12);
          --shadow2: 0 42px 95px rgba(15, 32, 64, 0.18);
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html {
          scroll-behavior: smooth;
          background: var(--bg);
        }

        body {
          min-height: 100vh;
          background: var(--bg);
          color: var(--ink);
          overflow-x: hidden;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        button,
        input {
          font-family: inherit;
        }

        button {
          cursor: pointer;
        }

        svg {
          fill: none;
          stroke: currentColor;
          stroke-width: 2.35;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .takipioPremium {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          padding: 28px 34px 38px;
          background:
            radial-gradient(circle at 20% 18%, rgba(11, 99, 255, 0.085), transparent 30%),
            radial-gradient(circle at 80% 22%, rgba(73, 217, 255, 0.16), transparent 30%),
            radial-gradient(circle at 58% 82%, rgba(11, 99, 255, 0.07), transparent 34%),
            linear-gradient(180deg, #ffffff 0%, #f6faff 53%, #ffffff 100%);
        }

        .softGrid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.36;
          background-image:
            linear-gradient(rgba(11, 99, 255, 0.052) 1px, transparent 1px),
            linear-gradient(90deg, rgba(11, 99, 255, 0.052) 1px, transparent 1px);
          background-size: 78px 78px;
          mask-image: radial-gradient(circle at 58% 38%, black 0%, transparent 72%);
        }

        .noise {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.15;
          background-image: radial-gradient(circle, rgba(11, 99, 255, 0.58) 0 1px, transparent 1.4px);
          background-size: 94px 94px;
        }

        .mesh {
          position: absolute;
          pointer-events: none;
          border-radius: 999px;
          filter: blur(24px);
        }

        .meshOne {
          width: 440px;
          height: 440px;
          left: 110px;
          top: 100px;
          background: rgba(11, 99, 255, 0.055);
        }

        .meshTwo {
          width: 460px;
          height: 460px;
          right: 110px;
          top: 90px;
          background: rgba(73, 217, 255, 0.12);
        }

        .meshThree {
          width: 360px;
          height: 360px;
          right: 36%;
          bottom: -80px;
          background: rgba(11, 99, 255, 0.06);
        }

        .navBar {
          max-width: 1500px;
          height: 74px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 20;
        }

        .brandCapsule {
          width: 190px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 9px 17px;
          border-radius: 22px;
          background:
            linear-gradient(180deg, rgba(7, 15, 32, 0.96), rgba(5, 9, 20, 0.96)),
            #050914;
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow:
            0 18px 38px rgba(6, 16, 31, 0.22),
            inset 0 0 22px rgba(11, 99, 255, 0.1);
        }

        .brandCapsule img {
          width: 154px;
          height: 42px;
          object-fit: contain;
          filter: drop-shadow(0 0 12px rgba(11, 99, 255, 0.3));
        }

        .navLinks {
          display: flex;
          align-items: center;
          gap: 27px;
          color: #1d2939;
          font-size: 15px;
          font-weight: 850;
        }

        .navLinks a {
          transition: 0.24s ease;
        }

        .navLinks a:hover {
          color: var(--blue);
          transform: translateY(-1px);
        }

        .instagramNav {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 10px 12px;
          border: 1px solid rgba(11, 99, 255, 0.12);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.72);
          box-shadow: 0 12px 26px rgba(15, 32, 64, 0.06);
        }

        .instagramNav svg {
          width: 18px;
          height: 18px;
          color: #e1306c;
        }

        .navCta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          border-radius: 999px;
          color: white !important;
          background: linear-gradient(135deg, var(--blue), var(--blue2));
          box-shadow: 0 18px 32px rgba(11, 99, 255, 0.24);
        }

        .navCta svg {
          width: 17px;
          height: 17px;
        }

        .hero {
          max-width: 1500px;
          min-height: 805px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(470px, 0.86fr) minmax(820px, 1.42fr);
          gap: 58px;
          align-items: center;
          position: relative;
          z-index: 4;
        }

        .heroCopy {
          position: relative;
          z-index: 8;
          padding-top: 10px;
        }

        .statusPill {
          width: max-content;
          max-width: 100%;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 11px 16px;
          border-radius: 999px;
          color: var(--blue);
          background: rgba(255, 255, 255, 0.76);
          border: 1px solid var(--line);
          box-shadow: 0 14px 30px rgba(11, 99, 255, 0.08);
          font-size: 14px;
          font-weight: 920;
          letter-spacing: 1px;
          text-transform: uppercase;
          backdrop-filter: blur(12px);
          margin-bottom: 26px;
        }

        .statusPill span {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55);
          animation: pulse 1.8s ease-in-out infinite;
        }

        h1 {
          max-width: 780px;
          font-size: clamp(56px, 5.4vw, 92px);
          line-height: 0.96;
          letter-spacing: -5px;
          font-weight: 950;
          color: var(--ink);
          margin-bottom: 23px;
        }

        h1 mark {
          color: var(--blue);
          background: transparent;
          text-shadow: 0 12px 30px rgba(11, 99, 255, 0.16);
        }

        .heroText {
          max-width: 650px;
          color: var(--muted);
          font-size: 21px;
          line-height: 1.58;
          letter-spacing: -0.4px;
          margin-bottom: 28px;
        }

        .waitlistCard {
          width: min(690px, 100%);
          border-radius: 30px;
          padding: 24px;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid rgba(11, 99, 255, 0.16);
          box-shadow: var(--shadow);
          backdrop-filter: blur(18px);
          transition: 0.32s ease;
        }

        .waitlistCard:hover {
          transform: translateY(-4px);
          box-shadow:
            0 38px 90px rgba(15, 32, 64, 0.16),
            0 0 0 6px rgba(11, 99, 255, 0.035);
        }

        .waitlistHeader {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 18px;
        }

        .mailIcon {
          width: 56px;
          height: 56px;
          flex: 0 0 auto;
          border-radius: 19px;
          display: grid;
          place-items: center;
          color: white;
          background: linear-gradient(135deg, var(--blue), var(--blue2));
          box-shadow: 0 16px 30px rgba(11, 99, 255, 0.24);
        }

        .mailIcon svg {
          width: 28px;
          height: 28px;
        }

        .waitlistHeader h2 {
          font-size: 25px;
          line-height: 1.1;
          letter-spacing: -0.9px;
          margin-bottom: 6px;
        }

        .waitlistHeader p {
          color: var(--muted);
          font-size: 15px;
          line-height: 1.45;
        }

        .waitlistHeader b {
          color: var(--blue);
        }

        .formRow {
          display: grid;
          grid-template-columns: 1fr 172px;
          gap: 12px;
          margin-bottom: 12px;
        }

        .formRow input {
          height: 59px;
          border: 1px solid rgba(11, 99, 255, 0.18);
          border-radius: 18px;
          outline: none;
          background: #f7fbff;
          color: var(--ink);
          padding: 0 18px;
          font-size: 16px;
          transition: 0.25s ease;
        }

        .formRow input:focus {
          border-color: rgba(11, 99, 255, 0.48);
          box-shadow: 0 0 0 5px rgba(11, 99, 255, 0.08);
          background: white;
        }

        .formRow button {
          height: 59px;
          border: 0;
          border-radius: 18px;
          background: linear-gradient(135deg, var(--blue), var(--blue2));
          color: white;
          font-size: 17px;
          font-weight: 950;
          box-shadow: 0 16px 28px rgba(11, 99, 255, 0.24);
          transition: 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
        }

        .formRow button:hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 38px rgba(11, 99, 255, 0.3);
        }

        .formRow button svg {
          width: 17px;
          height: 17px;
        }

        .formMessage {
          margin: 0 0 12px;
          padding: 12px 14px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 760;
        }

        .formMessage.error {
          color: #b42318;
          background: #fff1f0;
          border: 1px solid #ffdad6;
        }

        .formMessage.success {
          color: #067647;
          background: #ecfdf3;
          border: 1px solid #abefc6;
        }

        .formMeta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .formMeta span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #344054;
          font-size: 13px;
          font-weight: 800;
        }

        .formMeta svg {
          width: 16px;
          height: 16px;
          color: #12b76a;
        }

        .proofBar {
          width: min(690px, 100%);
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 17px;
        }

        .proofBar div {
          min-height: 82px;
          border-radius: 24px;
          padding: 15px;
          background: rgba(255, 255, 255, 0.68);
          border: 1px solid rgba(11, 99, 255, 0.12);
          box-shadow: 0 16px 35px rgba(7, 20, 47, 0.06);
          transition: 0.25s ease;
        }

        .proofBar div:hover {
          transform: translateY(-4px);
          border-color: rgba(11, 99, 255, 0.3);
          background: white;
        }

        .proofBar strong {
          display: block;
          color: var(--blue);
          font-size: 24px;
          line-height: 1;
          margin-bottom: 7px;
        }

        .proofBar span {
          display: block;
          color: #475467;
          font-size: 13px;
          line-height: 1.35;
          font-weight: 760;
        }

        .heroShowcase {
          min-height: 745px;
          position: relative;
          display: grid;
          grid-template-columns: minmax(570px, 1fr) 252px;
          gap: 28px;
          align-items: center;
        }

        .demoArea {
          position: relative;
          min-height: 640px;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 1250px;
        }

        .ambientGlow {
          position: absolute;
          width: 690px;
          height: 420px;
          border-radius: 50%;
          background: radial-gradient(ellipse at center, rgba(11, 99, 255, 0.12), transparent 64%);
          filter: blur(3px);
          transform: rotate(-8deg);
        }

        .laptopMock {
          width: min(670px, 94%);
          height: 405px;
          position: relative;
          border-radius: 32px 32px 20px 20px;
          padding: 17px 17px 31px;
          background: linear-gradient(135deg, #c4cfdd, #ffffff 48%, #8d99aa);
          box-shadow: 0 42px 98px rgba(7, 20, 47, 0.22);
          transform: rotateX(4deg) rotateY(-8deg) rotateZ(-1deg);
          transition: 0.35s ease;
          z-index: 3;
        }

        .demoArea:hover .laptopMock {
          transform: rotateX(2deg) rotateY(-4deg) rotateZ(0deg) translateY(-8px);
        }

        .laptopMock::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 8px;
          width: 76px;
          height: 12px;
          border-radius: 0 0 10px 10px;
          background: #050914;
          transform: translateX(-50%);
          z-index: 4;
        }

        .laptopMock::after {
          content: "";
          position: absolute;
          left: 7%;
          right: 7%;
          bottom: -18px;
          height: 26px;
          border-radius: 0 0 36px 36px;
          background: linear-gradient(180deg, #e6ecf4, #7d8796);
          box-shadow: 0 18px 30px rgba(7, 20, 47, 0.16);
        }

        .laptopScreen {
          width: 100%;
          height: 100%;
          overflow: hidden;
          border-radius: 22px;
          background: #041020;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: inset 0 0 42px rgba(0, 168, 255, 0.09);
          text-align: left;
        }

        .screenTop {
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 18px;
          color: white;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .screenBrand {
          display: flex;
          align-items: center;
          gap: 9px;
          font-weight: 950;
        }

        .screenBrand img {
          width: 25px;
          height: 25px;
          object-fit: contain;
        }

        .screenActions {
          display: flex;
          gap: 7px;
        }

        .screenActions span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
        }

        .screenBody {
          height: calc(100% - 56px);
          display: grid;
          grid-template-columns: 156px 1fr;
        }

        .mockMenu {
          padding: 16px 12px;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          display: grid;
          align-content: start;
          gap: 10px;
          background: rgba(0, 0, 0, 0.1);
        }

        .mockMenu button {
          min-height: 34px;
          border: 0;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.07);
          color: rgba(255, 255, 255, 0.66);
          font-size: 11px;
          font-weight: 800;
          transition: 0.22s ease;
        }

        .mockMenu button:hover,
        .mockMenu button.active {
          color: white;
          background: linear-gradient(135deg, var(--blue), var(--blue2));
          box-shadow: 0 10px 20px rgba(11, 99, 255, 0.22);
        }

        .mockAssistant {
          margin-top: 12px;
          min-height: 68px;
          border-radius: 15px;
          padding: 11px;
          color: white;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .mockAssistant b {
          display: block;
          font-size: 12px;
          margin-bottom: 5px;
        }

        .mockAssistant span {
          display: block;
          color: rgba(255, 255, 255, 0.58);
          font-size: 10px;
          line-height: 1.3;
        }

        .mockContent {
          padding: 16px;
        }

        .mockHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          color: white;
        }

        .mockHeader h3 {
          font-size: 17px;
        }

        .mockHeader span {
          color: #8fb7ff;
          font-size: 11px;
          font-weight: 800;
        }

        .mockCards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 12px;
        }

        .mockCard {
          min-height: 76px;
          padding: 12px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: white;
          transition: 0.22s ease;
        }

        .mockCard:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-3px);
        }

        .mockCard small {
          display: block;
          color: #8fb7ff;
          font-size: 10px;
          margin-bottom: 8px;
        }

        .mockCard b {
          display: block;
          font-size: 18px;
          letter-spacing: -0.4px;
        }

        .mockCard em {
          display: block;
          margin-top: 4px;
          font-style: normal;
          color: var(--green);
          font-size: 10px;
          font-weight: 900;
        }

        .mockLower {
          display: grid;
          grid-template-columns: 1.45fr 1fr;
          gap: 12px;
        }

        .mockGraph {
          height: 172px;
          border-radius: 16px;
          overflow: hidden;
          background: linear-gradient(180deg, rgba(11, 99, 255, 0.2), rgba(11, 99, 255, 0.03));
          border: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
        }

        .mockGraph::before {
          content: "Satış Grafiği";
          position: absolute;
          left: 14px;
          top: 12px;
          color: white;
          font-size: 12px;
          font-weight: 900;
          z-index: 2;
        }

        .mockGraph svg {
          width: 100%;
          height: 100%;
          padding-top: 22px;
        }

        .activityPanel {
          height: 172px;
          border-radius: 16px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.055);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: white;
          overflow: hidden;
        }

        .activityPanel h4 {
          font-size: 12px;
          margin-bottom: 10px;
        }

        .activityPanel div {
          min-height: 31px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          border-radius: 10px;
          padding: 0 9px;
          margin-bottom: 7px;
          background: rgba(255, 255, 255, 0.055);
          font-size: 10px;
          color: rgba(255, 255, 255, 0.75);
        }

        .activityPanel b {
          color: var(--green);
        }

        .mockList {
          margin-top: 11px;
          display: grid;
          gap: 8px;
        }

        .mockList div {
          min-height: 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.78);
          background: rgba(255, 255, 255, 0.055);
          border: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 12px;
        }

        .mockList b {
          color: white;
        }

        .phoneMock {
          position: absolute;
          right: -18px;
          bottom: 44px;
          width: 174px;
          height: 348px;
          border-radius: 38px;
          padding: 10px;
          background: linear-gradient(135deg, #1c2533, #050b15);
          border: 3px solid #101827;
          box-shadow: 0 30px 60px rgba(7, 20, 47, 0.24);
          transform: rotate(3deg);
          transition: 0.35s ease;
          z-index: 7;
        }

        .demoArea:hover .phoneMock {
          transform: rotate(0deg) translateY(-12px) translateX(8px);
        }

        .phoneScreen {
          height: 100%;
          border-radius: 29px;
          overflow: hidden;
          background: #041020;
          color: white;
          padding: 14px 10px;
        }

        .phoneHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 12px;
          font-weight: 900;
        }

        .phoneHead span {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .phoneHead img {
          width: 20px;
          height: 20px;
          object-fit: contain;
        }

        .phoneGreeting {
          margin-bottom: 10px;
        }

        .phoneGreeting b {
          display: block;
          font-size: 13px;
          margin-bottom: 2px;
        }

        .phoneGreeting span {
          color: #8fb7ff;
          font-size: 10px;
          font-weight: 700;
        }

        .phoneTabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          margin-bottom: 8px;
        }

        .phoneTabs button {
          height: 25px;
          border: 0;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.07);
          color: rgba(255, 255, 255, 0.62);
          font-size: 9px;
          font-weight: 800;
        }

        .phoneTabs button.active {
          color: white;
          background: var(--blue);
        }

        .phoneGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 7px;
        }

        .phoneCard {
          min-height: 62px;
          border-radius: 13px;
          padding: 9px;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .phoneCard small {
          display: block;
          color: #8fb7ff;
          font-size: 9px;
          margin-bottom: 6px;
        }

        .phoneCard b {
          display: block;
          font-size: 14px;
        }

        .phoneCard em {
          display: block;
          margin-top: 4px;
          color: var(--green);
          font-style: normal;
          font-size: 9px;
          font-weight: 900;
        }

        .phoneList {
          margin-top: 11px;
          display: grid;
          gap: 8px;
        }

        .phoneList div {
          height: 31px;
          border-radius: 11px;
          padding: 0 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.7);
          font-size: 9px;
        }

        .phoneList b {
          color: var(--orange);
        }

        .floatingCard {
          position: absolute;
          z-index: 11;
          min-width: 178px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 15px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.84);
          border: 1px solid rgba(11, 99, 255, 0.16);
          box-shadow: 0 24px 42px rgba(7, 20, 47, 0.13);
          backdrop-filter: blur(16px);
          transition: 0.28s ease;
        }

        .floatingCard:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: rgba(11, 99, 255, 0.36);
          box-shadow: 0 34px 58px rgba(7, 20, 47, 0.18);
        }

        .floatingCard svg {
          width: 27px;
          height: 27px;
          color: var(--blue);
          flex: 0 0 auto;
        }

        .floatingCard b {
          display: block;
          color: #050914;
          font-size: 15px;
          line-height: 1.1;
        }

        .floatingCard span {
          display: block;
          color: var(--muted);
          font-size: 12px;
          font-weight: 750;
          margin-top: 3px;
        }

        .floatingCard em {
          display: block;
          margin-top: 5px;
          color: var(--green);
          font-size: 11px;
          font-style: normal;
          font-weight: 950;
        }

        .floatOrders {
          left: -28px;
          top: 62px;
          animation: floaty 4.8s ease-in-out infinite;
        }

        .floatRevenue {
          right: 82px;
          top: 50px;
          animation: floaty 5.5s ease-in-out infinite 0.4s;
        }

        .floatStock {
          left: 10px;
          bottom: 74px;
          animation: floaty 5.2s ease-in-out infinite 0.2s;
        }

        .sideStack {
          position: relative;
          z-index: 20;
          display: grid;
          gap: 18px;
          align-content: center;
        }

        .pricePanel {
          position: relative;
          overflow: hidden;
          min-height: 302px;
          border-radius: 34px;
          padding: 21px;
          color: white;
          background:
            radial-gradient(circle at 50% 0%, rgba(73, 217, 255, 0.28), transparent 36%),
            linear-gradient(180deg, #071026 0%, #050914 100%);
          border: 1px solid rgba(255, 255, 255, 0.13);
          box-shadow: 0 32px 74px rgba(7, 20, 47, 0.26);
          transition: 0.32s ease;
        }

        .pricePanel:hover {
          transform: translateY(-8px);
          box-shadow: 0 42px 90px rgba(7, 20, 47, 0.32);
        }

        .priceShine {
          position: absolute;
          inset: -70px auto auto -100px;
          width: 130px;
          height: 460px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.18), transparent);
          transform: rotate(28deg);
          animation: shine 4.6s ease-in-out infinite;
        }

        .priceLabel {
          width: max-content;
          margin: 0 auto 18px;
          padding: 10px 12px;
          border-radius: 13px;
          background: linear-gradient(135deg, var(--blue), var(--blue2));
          font-size: 15px;
          font-weight: 950;
          box-shadow: 0 14px 25px rgba(11, 99, 255, 0.32);
        }

        .pricePanel p {
          text-align: center;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.82);
          font-size: 15px;
          font-weight: 950;
        }

        .priceNumbers {
          text-align: center;
          margin: 5px 0 9px;
        }

        .priceNumbers del {
          display: block;
          color: rgba(255, 255, 255, 0.34);
          font-size: 42px;
          font-weight: 950;
          line-height: 1;
          text-decoration-color: var(--blue);
          text-decoration-thickness: 5px;
        }

        .priceNumbers strong {
          display: block;
          color: white;
          font-size: 74px;
          line-height: 0.95;
          text-shadow: 0 0 24px rgba(11, 99, 255, 0.9);
        }

        .pricePanel small {
          display: block;
          color: rgba(255, 255, 255, 0.62);
          text-align: center;
          font-size: 13px;
          font-weight: 750;
          margin-bottom: 14px;
        }

        .priceBullets {
          display: grid;
          gap: 8px;
          margin-bottom: 14px;
        }

        .priceBullets span {
          display: flex;
          align-items: center;
          gap: 7px;
          color: rgba(255, 255, 255, 0.76);
          font-size: 12px;
          font-weight: 800;
        }

        .priceBullets svg {
          width: 15px;
          height: 15px;
          color: var(--cyan);
        }

        .pricePanel a {
          width: 100%;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 15px;
          color: white;
          font-size: 13px;
          font-weight: 950;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.16);
          transition: 0.25s ease;
        }

        .pricePanel a:hover {
          background: var(--blue);
        }

        .pricePanel a svg {
          width: 15px;
          height: 15px;
        }

        .gorkiPanel {
          min-height: 302px;
          border-radius: 34px;
          padding: 18px;
          background: rgba(255, 255, 255, 0.84);
          border: 1px solid rgba(11, 99, 255, 0.15);
          box-shadow: var(--shadow);
          overflow: hidden;
          position: relative;
        }

        .gorkiPanel::before {
          content: "";
          position: absolute;
          width: 190px;
          height: 190px;
          border-radius: 50%;
          right: -80px;
          top: -70px;
          background: rgba(11, 99, 255, 0.08);
        }

        .gorkiTop {
          display: flex;
          align-items: center;
          gap: 11px;
          position: relative;
          z-index: 2;
          margin-bottom: 10px;
        }

        .gorkiAvatar {
          width: 45px;
          height: 45px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: #050914;
          color: white;
          box-shadow: 0 16px 28px rgba(7, 20, 47, 0.16);
        }

        .gorkiAvatar img {
          width: 38px;
          height: 38px;
          object-fit: contain;
        }

        .gorkiTop b {
          display: block;
          color: var(--ink);
          font-size: 18px;
        }

        .gorkiTop span {
          display: block;
          color: var(--muted);
          font-size: 13px;
          font-weight: 760;
        }

        .gorkiImageWrap {
          height: 126px;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          z-index: 2;
          margin-bottom: 8px;
        }

        .gorkiImageWrap img {
          width: 128px;
          height: 128px;
          object-fit: contain;
          filter: drop-shadow(0 18px 24px rgba(7, 20, 47, 0.14));
          animation: gorkiFloat 4.8s ease-in-out infinite;
        }

        .gorkiMessages {
          position: relative;
          z-index: 2;
          display: grid;
          gap: 9px;
        }

        .gorkiMessage {
          min-height: 50px;
          padding: 12px;
          border-radius: 17px;
          color: #1d2939;
          background: #f7fbff;
          border: 1px solid rgba(11, 99, 255, 0.1);
          font-size: 13px;
          line-height: 1.38;
          font-weight: 830;
        }

        .gorkiFooter {
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          color: var(--blue);
          font-size: 12px;
          font-weight: 900;
          position: relative;
          z-index: 2;
        }

        .gorkiFooter svg {
          width: 15px;
          height: 15px;
        }

        .featureGrid {
          max-width: 1500px;
          margin: 10px auto 0;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          position: relative;
          z-index: 10;
        }

        .featureCard {
          min-height: 154px;
          padding: 22px;
          display: flex;
          align-items: center;
          gap: 15px;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid rgba(11, 99, 255, 0.14);
          box-shadow: 0 20px 44px rgba(7, 20, 47, 0.08);
          backdrop-filter: blur(16px);
          transition: 0.3s ease;
        }

        .featureCard:hover {
          transform: translateY(-8px);
          border-color: rgba(11, 99, 255, 0.34);
          box-shadow: 0 30px 60px rgba(7, 20, 47, 0.13);
        }

        .featureIcon {
          width: 52px;
          height: 52px;
          flex: 0 0 auto;
          border-radius: 18px;
          display: grid;
          place-items: center;
          color: white;
          background: linear-gradient(135deg, var(--blue), var(--blue2));
          box-shadow: 0 16px 28px rgba(11, 99, 255, 0.22);
        }

        .featureIcon svg {
          width: 27px;
          height: 27px;
        }

        .featureCard h3 {
          font-size: 18px;
          letter-spacing: -0.55px;
          line-height: 1.1;
          margin-bottom: 8px;
        }

        .featureCard p {
          color: var(--muted);
          font-size: 13px;
          line-height: 1.42;
        }

        .bottomBand {
          max-width: 1500px;
          margin: 20px auto 0;
          display: grid;
          grid-template-columns: 1fr 0.95fr 1.35fr;
          gap: 16px;
          position: relative;
          z-index: 10;
        }

        .domainCard,
        .instagramCard,
        .trustCard {
          min-height: 112px;
          border-radius: 28px;
          background: white;
          border: 1px solid rgba(11, 99, 255, 0.14);
          box-shadow: 0 20px 44px rgba(7, 20, 47, 0.08);
        }

        .domainCard,
        .instagramCard {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 22px 25px;
          transition: 0.28s ease;
        }

        .domainCard:hover,
        .instagramCard:hover {
          transform: translateY(-6px);
          border-color: rgba(11, 99, 255, 0.32);
        }

        .domainCard svg,
        .instagramCard svg {
          width: 44px;
          height: 44px;
          flex: 0 0 auto;
        }

        .domainCard svg {
          color: var(--blue);
        }

        .instagramCard svg {
          color: #e1306c;
        }

        .domainCard h3,
        .instagramCard h3 {
          font-size: 30px;
          line-height: 1;
          letter-spacing: -1px;
          text-transform: lowercase;
        }

        .domainCard p,
        .instagramCard p {
          margin-top: 7px;
          color: var(--muted);
          font-weight: 760;
          font-size: 14px;
        }

        .trustCard {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          padding: 16px;
          gap: 12px;
        }

        .trustCard div {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 11px;
          border-radius: 20px;
          background: #f7fbff;
          border: 1px solid rgba(11, 99, 255, 0.1);
          color: #1d2939;
          font-size: 15px;
          font-weight: 900;
          transition: 0.25s ease;
        }

        .trustCard div:hover {
          transform: translateY(-4px);
          background: white;
          border-color: rgba(11, 99, 255, 0.26);
        }

        .trustCard svg {
          width: 25px;
          height: 25px;
          color: var(--blue);
          flex: 0 0 auto;
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55);
          }

          70% {
            box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
          }

          100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
          }
        }

        @keyframes shine {
          0% {
            transform: translateX(0) rotate(28deg);
          }

          45%,
          100% {
            transform: translateX(360px) rotate(28deg);
          }
        }

        @keyframes gorkiFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-12px);
          }
        }

        @keyframes floaty {
          0%,
          100% {
            translate: 0 0;
          }

          50% {
            translate: 0 -12px;
          }
        }

        @media (max-width: 1460px) {
          .hero {
            grid-template-columns: 1fr;
            gap: 28px;
          }

          .heroCopy {
            max-width: 900px;
          }

          .heroShowcase {
            min-height: 720px;
            grid-template-columns: minmax(560px, 1fr) 252px;
          }

          .featureGrid {
            grid-template-columns: repeat(3, 1fr);
          }

          .bottomBand {
            grid-template-columns: 1fr;
          }

          .trustCard {
            min-height: 112px;
          }
        }

        @media (max-width: 1080px) {
          .takipioPremium {
            padding: 22px 16px 30px;
          }

          .navLinks {
            display: none;
          }

          .navBar {
            height: 66px;
          }

          .brandCapsule {
            width: 168px;
            height: 54px;
          }

          .brandCapsule img {
            width: 136px;
          }

          h1 {
            letter-spacing: -3px;
          }

          .heroText {
            font-size: 18px;
          }

          .heroShowcase {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .demoArea {
            min-height: 570px;
          }

          .sideStack {
            grid-template-columns: 1fr 1fr;
          }

          .pricePanel,
          .gorkiPanel {
            min-height: 300px;
          }

          .floatRevenue {
            right: 26px;
            top: 40px;
          }

          .floatOrders {
            left: 8px;
          }

          .floatStock {
            left: 14px;
          }

          .featureGrid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 780px) {
          .hero {
            min-height: auto;
            gap: 24px;
          }

          .statusPill {
            font-size: 12px;
            white-space: normal;
            line-height: 1.3;
          }

          .waitlistHeader {
            align-items: flex-start;
          }

          .formRow {
            grid-template-columns: 1fr;
          }

          .proofBar {
            grid-template-columns: 1fr;
          }

          .demoArea {
            min-height: 500px;
            overflow: hidden;
            padding-top: 24px;
          }

          .ambientGlow {
            width: 520px;
            height: 330px;
          }

          .laptopMock {
            width: 98%;
            height: 315px;
            padding: 11px 11px 22px;
            border-radius: 24px 24px 16px 16px;
          }

          .laptopMock::before {
            width: 52px;
            height: 8px;
          }

          .screenTop {
            height: 44px;
            padding: 0 12px;
          }

          .screenBrand {
            font-size: 12px;
          }

          .screenBrand img {
            width: 18px;
            height: 18px;
          }

          .screenBody {
            height: calc(100% - 44px);
            grid-template-columns: 86px 1fr;
          }

          .mockMenu {
            padding: 10px 7px;
            gap: 7px;
          }

          .mockMenu button {
            min-height: 28px;
            font-size: 0;
          }

          .mockMenu button::after {
            content: "";
            display: block;
            width: 70%;
            height: 7px;
            border-radius: 999px;
            background: currentColor;
            margin: auto;
            opacity: 0.65;
          }

          .mockAssistant {
            display: none;
          }

          .mockContent {
            padding: 10px;
          }

          .mockHeader {
            margin-bottom: 8px;
          }

          .mockHeader h3 {
            font-size: 13px;
          }

          .mockHeader span {
            font-size: 9px;
          }

          .mockCards {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .mockCards .mockCard:nth-child(2),
          .mockCards .mockCard:nth-child(3),
          .mockCards .mockCard:nth-child(4) {
            display: none;
          }

          .mockCard {
            min-height: 58px;
            padding: 10px;
          }

          .mockLower {
            grid-template-columns: 1fr;
          }

          .mockGraph {
            height: 112px;
          }

          .activityPanel,
          .mockList {
            display: none;
          }

          .phoneMock {
            width: 124px;
            height: 250px;
            right: -4px;
            bottom: 16px;
            border-radius: 28px;
            padding: 8px;
          }

          .phoneScreen {
            border-radius: 21px;
            padding: 10px 8px;
          }

          .phoneGreeting,
          .phoneTabs {
            display: none;
          }

          .phoneGrid {
            grid-template-columns: 1fr;
          }

          .phoneGrid .phoneCard:nth-child(3),
          .phoneGrid .phoneCard:nth-child(4) {
            display: none;
          }

          .phoneList div {
            height: 26px;
            font-size: 0;
          }

          .floatingCard {
            display: none;
          }

          .sideStack {
            grid-template-columns: 1fr;
          }

          .pricePanel,
          .gorkiPanel {
            min-height: auto;
          }

          .gorkiPanel {
            display: grid;
            grid-template-columns: 1fr;
          }

          .featureGrid {
            grid-template-columns: 1fr;
          }

          .featureCard {
            min-height: 132px;
          }

          .domainCard,
          .instagramCard {
            align-items: flex-start;
          }

          .domainCard h3,
          .instagramCard h3 {
            font-size: 26px;
          }

          .trustCard {
            grid-template-columns: 1fr;
          }

          .trustCard div {
            min-height: 62px;
          }
        }

        @media (max-width: 460px) {
          .takipioPremium {
            padding: 18px 12px 28px;
          }

          h1 {
            font-size: 45px;
            line-height: 1;
            letter-spacing: -2.4px;
          }

          .heroText {
            font-size: 16px;
          }

          .waitlistCard {
            padding: 18px;
            border-radius: 24px;
          }

          .waitlistHeader h2 {
            font-size: 21px;
          }

          .mailIcon {
            width: 48px;
            height: 48px;
            border-radius: 16px;
          }

          .proofBar div {
            min-height: 74px;
          }

          .demoArea {
            min-height: 455px;
          }

          .laptopMock {
            height: 285px;
          }

          .phoneMock {
            scale: 0.9;
            right: -20px;
            bottom: 8px;
          }

          .priceNumbers strong {
            font-size: 62px;
          }

          .priceNumbers del {
            font-size: 36px;
          }
        }
      `}</style>
    </main>
  );
}

function LaptopMockup({
  activeTab,
  setActiveTab,
}: {
  activeTab: DemoTab;
  setActiveTab: (tab: DemoTab) => void;
}) {
  const active = useMemo(
    () => demoTabs.find((item) => item.key === activeTab) ?? demoTabs[0],
    [activeTab]
  );

  return (
    <div className="laptopMock">
      <div className="laptopScreen">
        <div className="screenTop">
          <div className="screenBrand">
            <img src="/takipio-logo.png" alt="" /> takipio
          </div>

          <div className="screenActions">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="screenBody">
          <div className="mockMenu">
            {demoTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={activeTab === tab.key ? "active" : ""}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}

            <div className="mockAssistant">
              <b>Gorki AI</b>
              <span>Asistanın hazır. Bugünkü işlerini özetliyorum.</span>
            </div>
          </div>

          <div className="mockContent">
            <div className="mockHeader">
              <h3>{active.label}</h3>
              <span>Canlı demo modu</span>
            </div>

            <div className="mockCards">
              <div className="mockCard">
                <small>{active.helper}</small>
                <b>{active.value}</b>
                <em>+%18,6</em>
              </div>

              <div className="mockCard">
                <small>Aktif işlem</small>
                <b>{activeTab === "orders" ? "24" : activeTab === "payments" ? "8" : "18"}</b>
                <em>Bugün</em>
              </div>

              <div className="mockCard">
                <small>Müşteri</small>
                <b>89</b>
                <em>+%5,7</em>
              </div>

              <div className="mockCard">
                <small>Durum</small>
                <b>{activeTab === "payments" ? "Takipte" : "Güncel"}</b>
                <em>Aktif</em>
              </div>
            </div>

            <div className="mockLower">
              <div className="mockGraph">
                <svg viewBox="0 0 520 170" preserveAspectRatio="none" aria-hidden="true">
                  <path
                    d="M0 138 C40 110 65 98 105 110 C150 126 160 58 210 78 C250 94 260 45 310 62 C360 82 374 28 420 42 C460 54 470 18 520 28"
                    fill="none"
                    stroke="#0b63ff"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="activityPanel">
                <h4>Canlı Akış</h4>
                <div>
                  <span>Yeni sipariş #10248</span>
                  <b>2 dk</b>
                </div>
                <div>
                  <span>Ödeme alındı</span>
                  <b>15 dk</b>
                </div>
                <div>
                  <span>Stok güncellendi</span>
                  <b>1 sa</b>
                </div>
                <div>
                  <span>Müşteri kaydı</span>
                  <b>2 sa</b>
                </div>
              </div>
            </div>

            <div className="mockList">
              <div>
                <span>{activeTab === "customers" ? "Arden Coffee" : "Nova Car Wash"}</span>
                <b>{activeTab === "payments" ? "Ödeme bekliyor" : "Aktif"}</b>
              </div>

              <div>
                <span>{activeTab === "orders" ? "Özel oto kokusu" : "Atlas Rent A Car"}</span>
                <b>{activeTab === "orders" ? "Hazırlanıyor" : "Güncel"}</b>
              </div>

              <div>
                <span>{activeTab === "overview" ? "Gorki önerisi" : "Otomatik takip"}</span>
                <b>{activeTab === "overview" ? "2 uyarı" : "Açık"}</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneMockup({
  activeTab,
  setActiveTab,
}: {
  activeTab: DemoTab;
  setActiveTab: (tab: DemoTab) => void;
}) {
  const active = useMemo(
    () => demoTabs.find((item) => item.key === activeTab) ?? demoTabs[0],
    [activeTab]
  );

  return (
    <div className="phoneMock">
      <div className="phoneScreen">
        <div className="phoneHead">
          <span>
            <img src="/takipio-logo.png" alt="" /> takipio
          </span>
          <b>9:41</b>
        </div>

        <div className="phoneGreeting">
          <b>Merhaba, Ahmet 👋</b>
          <span>Bugün nasıl gidiyor?</span>
        </div>

        <div className="phoneTabs">
          {demoTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? "active" : ""}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.short}
            </button>
          ))}
        </div>

        <div className="phoneGrid">
          <div className="phoneCard">
            <small>{active.label}</small>
            <b>{active.value}</b>
            <em>+%18,6</em>
          </div>

          <div className="phoneCard">
            <small>Sipariş</small>
            <b>128</b>
            <em>+%8,2</em>
          </div>

          <div className="phoneCard">
            <small>Müşteri</small>
            <b>89</b>
            <em>+%5,7</em>
          </div>

          <div className="phoneCard">
            <small>Stok</small>
            <b>Güncel</b>
            <em>128 ürün</em>
          </div>
        </div>

        <div className="phoneList">
          <div>
            <span>#10248 Ahmet</span>
            <b>Hazırlanıyor</b>
          </div>
          <div>
            <span>#10247 Zeynep</span>
            <b>Kargoda</b>
          </div>
          <div>
            <span>#10246 Mehmet</span>
            <b>Tamamlandı</b>
          </div>
        </div>
      </div>
    </div>
  );
}

function PricePanel() {
  return (
    <div className="pricePanel" id="pricing">
      <div className="priceShine" />

      <div className="priceLabel">AÇILIŞA ÖZEL</div>

      <p>İlk ay sadece</p>

      <div className="priceNumbers">
        <del>₺99</del>
        <strong>₺89</strong>
      </div>

      <small>Sonrasında ₺99 / ay</small>

      <div className="priceBullets">
        <span>
          <CheckIcon /> Tüm özelliklere erişim
        </span>
        <span>
          <CheckIcon /> Gorki AI asistan dahil
        </span>
        <span>
          <CheckIcon /> 7/24 destek
        </span>
      </div>

      <a href="#waitlist">
        Erken erişime katıl
        <ArrowIcon />
      </a>
    </div>
  );
}

function GorkiPanel({ message }: { message: string }) {
  return (
    <div className="gorkiPanel" id="assistant">
      <div className="gorkiTop">
        <div className="gorkiAvatar">
          <img src="/gorki-hero.png" alt="" />
        </div>

        <div>
          <b>Gorki AI</b>
          <span>Akıllı asistanın</span>
        </div>
      </div>

      <div className="gorkiImageWrap">
        <img src="/gorki-hero.png" alt="Gorki" />
      </div>

      <div className="gorkiMessages">
        <div className="gorkiMessage">“{message}”</div>
        <div className="gorkiMessage">“Bugünkü açık işleri senin için özetledim.”</div>
      </div>

      <div className="gorkiFooter">
        <HeartIcon />
        Gorki her zaman yanında.
      </div>
    </div>
  );
}

function FloatingInfoCard({
  icon,
  title,
  text,
  metric,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  metric: string;
  className: string;
}) {
  return (
    <div className={`floatingCard ${className}`}>
      {icon}
      <div>
        <b>{title}</b>
        <span>{text}</span>
        <em>{metric}</em>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="featureCard">
      <div className="featureIcon">{icon}</div>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </article>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M4 7l8 7 8-7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="9" cy="8" r="4" />
      <path d="M2 22c1.2-5.3 4.2-8 8-8s6.8 2.7 8 8" />
      <path d="M17 11a4 4 0 1 0-1.5-7.7" />
      <path d="M18 14c2.4.7 3.8 2.9 4.5 6" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M6 2h12l3 5v15H3V7l3-5z" />
      <path d="M3 7h18" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

function CubeIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 2l9 5-9 5-9-5 9-5z" />
      <path d="M3 7v10l9 5 9-5V7" />
      <path d="M12 12v10" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M3 7h18v12H3z" />
      <path d="M16 12h5v4h-5a2 2 0 0 1 0-4z" />
      <path d="M3 7l3-4h12l3 4" />
    </svg>
  );
}

function PanelIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M4 5h7v6H4z" />
      <path d="M13 5h7v14h-7z" />
      <path d="M4 13h7v6H4z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M7 15l3-4 4 2 5-7" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1.2 1.2" />
      <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1.2-1.2" />
    </svg>
  );
}

function HeadsetIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <path d="M4 13h4v6H4z" />
      <path d="M16 13h4v6h-4z" />
      <path d="M16 21h-4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-4z" />
      <path d="M8.5 12l2.3 2.3 4.8-5" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M13 2L3 14h8l-1 8 11-14h-8l0-6z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 21s-8-4.8-9.6-10C1.2 7.1 3.7 4.5 7 4.5c2 0 3.8 1.2 5 3 1.2-1.8 3-3 5-3 3.3 0 5.8 2.6 4.6 6.5C20 16.2 12 21 12 21z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15 15 0 0 1 0 20" />
      <path d="M12 2a15 15 0 0 0 0 20" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="1" />
    </svg>
  );
}
