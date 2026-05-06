"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type DemoTab = "overview" | "orders" | "marketplaces" | "gorki";

const demoTabs: {
  key: DemoTab;
  label: string;
  value: string;
  helper: string;
}[] = [
  {
    key: "overview",
    label: "Genel Bakış",
    value: "₺125.250",
    helper: "Haftalık ciro",
  },
  {
    key: "orders",
    label: "Siparişler",
    value: "128",
    helper: "Aktif sipariş",
  },
  {
    key: "marketplaces",
    label: "Pazaryerleri",
    value: "4",
    helper: "Bağlantı modu",
  },
  {
    key: "gorki",
    label: "Gorki AI",
    value: "12",
    helper: "Akıllı öneri",
  },
];

const marketplaces = [
  {
    name: "Trendyol",
    logo: "/trendyol.png",
    accent: "#f27a1a",
    value: "42 sipariş",
  },
  {
    name: "Amazon",
    logo: "/amazon.png",
    accent: "#ffb000",
    value: "18 sipariş",
  },
  {
    name: "Hepsiburada",
    logo: "/hepsiburada.png",
    accent: "#ff6000",
    value: "27 sipariş",
  },
  {
    name: "Çiçeksepeti",
    logo: "/ciceksepeti.png",
    accent: "#36b86a",
    value: "11 sipariş",
  },
];

const gorkiMessages = [
  "Bugün pazaryeri siparişlerinde %18 artış var.",
  "2 ürün kritik stok seviyesine yaklaşıyor.",
  "Bekleyen 4 ödeme için hatırlatma öneriyorum.",
  "Trendyol ve Hepsiburada akışlarını tek özet altında topladım.",
];

const activityRows = [
  { source: "Trendyol", code: "#10248", status: "Hazırlanıyor", price: "₺1.250" },
  { source: "Amazon", code: "#10247", status: "Kargoda", price: "₺890" },
  { source: "Hepsiburada", code: "#10246", status: "Stok güncel", price: "₺2.140" },
  { source: "Çiçeksepeti", code: "#10245", status: "Tamamlandı", price: "₺640" },
];

export default function Page() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<DemoTab>("overview");
  const [messageIndex, setMessageIndex] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);

    const messageTimer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % gorkiMessages.length);
    }, 3400);

    const tabTimer = window.setInterval(() => {
      setActiveTab((current) => {
        const index = demoTabs.findIndex((tab) => tab.key === current);
        const next = demoTabs[(index + 1) % demoTabs.length];
        return next.key;
      });
    }, 4600);

    return () => {
      window.clearInterval(messageTimer);
      window.clearInterval(tabTimer);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Lütfen geçerli bir e-posta adresi yaz.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("waitlist").insert([
      {
        email: cleanEmail,
        coupon_code: "TAKIPIO10",
        source: "landing-v6",
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

    try {
      await fetch("/api/send-welcome", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: cleanEmail }),
      });
    } catch (mailError) {
      console.error("Welcome email could not be sent:", mailError);
    }

    setSaved(true);
    setEmail("");
    window.setTimeout(() => setSaved(false), 3600);
  }

  return (
    <main
      className="takipioV6"
      style={{
        opacity: ready ? 1 : 0,
        visibility: ready ? "visible" : "hidden",
      }}
    >
      <div className="v6Backdrop">
        <div className="orb orbOne" />
        <div className="orb orbTwo" />
        <div className="orb orbThree" />
        <div className="v6Grid" />
        <div className="v6Noise" />
      </div>

      <header className="v6Header">
        <a className="v6Brand" href="#top" aria-label="Takipio">
          <img src="/takipio-logo.png" alt="Takipio" />
        </a>

        <nav className="v6Nav">
          <a href="#product">Ürün</a>
          <a href="#integrations">Entegrasyon</a>
          <a href="#gorki">Gorki AI</a>
          <a href="#pricing">Fiyat</a>
        </nav>

        <a className="v6HeaderCta" href="#waitlist">
          Erken erişime katıl
          <ArrowIcon />
        </a>
      </header>

      <nav className="mobileDock" aria-label="Mobil menü">
        <a href="#top">Ana Sayfa</a>
        <a href="#product">Ürün</a>
        <a href="#integrations">Pazaryeri</a>
        <a href="#waitlist">Kayıt</a>
      </nav>

      <section className="v6Hero" id="top">
        <div className="v6HeroCopy">
          <div className="launchPill">
            <span className="pulseDot" />
            Takipio erken erişim açıldı
          </div>

          <h1>
            İşletmeni
            <span>tek panelden</span>
            yönetmenin premium yolu.
          </h1>

          <p className="heroLead">
            Sipariş, müşteri, stok, ödeme ve pazaryeri akışlarını tek ekranda
            topla. Gorki AI günlük işlerini özetlesin, sen sadece büyümeye
            odaklan.
          </p>

          <div className="integrationRail" id="integrations">
            <div className="railTop">
              <span>Pazaryeri entegrasyonları hazırlanıyor</span>
              <b>Satış kanalların tek akışta.</b>
            </div>

            <div className="railLogos">
              {marketplaces.map((market) => (
                <div
                  className="railLogoCard"
                  key={market.name}
                  style={{ "--accent": market.accent } as React.CSSProperties}
                >
                  <img src={market.logo} alt={market.name} />
                </div>
              ))}
            </div>

            <div className="railText">
              Trendyol, Amazon, Hepsiburada ve Çiçeksepeti siparişlerini Takipio
              içinde tek panelden takip etmek için altyapı hazırlanıyor.
            </div>
          </div>

          <form className="v6Waitlist" id="waitlist" onSubmit={handleSubmit}>
            <div className="waitlistCopy">
              <span>Erken erişim</span>
              <b>Açılışa özel TAKIPIO10 kodunu kaçırma.</b>
            </div>

            <div className="waitlistRow">
              <input
                type="email"
                placeholder="E-posta adresiniz"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <button type="submit">
                {loading ? "Kaydediliyor..." : saved ? "Kaydedildi ✓" : "Katıl"}
                {!loading && !saved && <ArrowIcon />}
              </button>
            </div>

            {errorMessage && <div className="formFeedback error">{errorMessage}</div>}
            {saved && (
              <div className="formFeedback success">
                Kaydın alındı. Hoş geldin maili gönderildi.
              </div>
            )}
          </form>

          <div className="trustLine">
            <span><CheckIcon /> 15 müşteriye kadar ücretsiz</span>
            <span><CheckIcon /> Gorki AI dahil</span>
            <span><CheckIcon /> Pazaryeri altyapısı</span>
          </div>
        </div>

        <div className="v6ProductStage" id="product">
          <div className="stageGlow" />

          <div className="floatingMetric metricOne">
            <OrdersIcon />
            <div>
              <b>128</b>
              <span>Aktif sipariş</span>
            </div>
            <em>+%18,6</em>
          </div>

          <div className="floatingMetric metricTwo">
            <WalletIcon />
            <div>
              <b>₺125.250</b>
              <span>Haftalık ciro</span>
            </div>
            <em>+%12,6</em>
          </div>

          <div className="floatingMetric metricThree">
            <CubeIcon />
            <div>
              <b>Stok güncel</b>
              <span>4 kanal izleniyor</span>
            </div>
            <em>Canlı</em>
          </div>

          <DashboardScene
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            gorkiMessage={gorkiMessages[messageIndex]}
          />

          <div className="priceGlass" id="pricing">
            <div className="priceBadge">Açılışa özel</div>
            <span>İlk ay sadece</span>
            <del>₺99</del>
            <strong>₺89</strong>
            <p>Sonrasında ₺99 / ay</p>
            <a href="#waitlist">Erken erişime katıl <ArrowIcon /></a>
          </div>

          <div className="gorkiMini" id="gorki">
            <div className="gorkiMiniTop">
              <img src="/gorki-hero.png" alt="Gorki AI" />
              <div>
                <b>Gorki AI</b>
                <span>Akıllı asistanın</span>
              </div>
            </div>
            <p>“{gorkiMessages[messageIndex]}”</p>
          </div>
        </div>
      </section>

      <section className="valueSection">
        <article>
          <PanelIcon />
          <b>Tek panel</b>
          <span>Sipariş, müşteri, stok ve ödeme akışını tek merkezde yönet.</span>
        </article>
        <article>
          <LinkIcon />
          <b>Pazaryeri modu</b>
          <span>Farklı satış kanallarını Takipio içinde sadeleştir.</span>
        </article>
        <article>
          <SparkIcon />
          <b>Gorki AI</b>
          <span>Günlük hareketleri kısa özetlere ve aksiyonlara çevir.</span>
        </article>
      </section>

      <footer className="v6Footer">
        <a href="https://takipio.com">takipio.com</a>
        <span>© 2026 Takipio</span>
        <a href="https://instagram.com/takipiocom" target="_blank" rel="noreferrer">
          @takipiocom
        </a>
      </footer>

      <style jsx global>{`
        :root {
          --ink: #f8fbff;
          --muted: rgba(226, 237, 255, 0.68);
          --muted2: rgba(226, 237, 255, 0.52);
          --line: rgba(147, 197, 253, 0.16);
          --line2: rgba(255, 255, 255, 0.1);
          --blue: #0b63ff;
          --blue2: #10b8ff;
          --cyan: #49d9ff;
          --green: #24d18b;
          --navy: #06101f;
          --navy2: #0a1730;
          --card: rgba(255, 255, 255, 0.08);
          --card2: rgba(255, 255, 255, 0.12);
          --shadow: 0 34px 100px rgba(0, 0, 0, 0.38);
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
          overflow-x: hidden;
          background: #050914;
        }

        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          background: #050914;
          color: var(--ink);
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
          stroke-width: 2.25;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        #top,
        #product,
        #integrations,
        #gorki,
        #pricing,
        #waitlist {
          scroll-margin-top: 120px;
        }

        .takipioV6 {
          min-height: 100svh;
          position: relative;
          overflow: hidden;
          padding: 24px;
          background:
            radial-gradient(circle at 18% 16%, rgba(11, 99, 255, 0.24), transparent 28%),
            radial-gradient(circle at 82% 20%, rgba(73, 217, 255, 0.18), transparent 30%),
            radial-gradient(circle at 50% 84%, rgba(11, 99, 255, 0.2), transparent 34%),
            linear-gradient(180deg, #050914 0%, #071020 52%, #050914 100%);
          transition: opacity 0.18s ease;
        }

        .v6Backdrop {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .orb {
          position: absolute;
          border-radius: 999px;
          filter: blur(52px);
          opacity: 0.9;
        }

        .orbOne {
          width: 520px;
          height: 520px;
          left: -220px;
          top: 70px;
          background: rgba(11, 99, 255, 0.2);
        }

        .orbTwo {
          width: 580px;
          height: 580px;
          right: -220px;
          top: 110px;
          background: rgba(16, 184, 255, 0.16);
        }

        .orbThree {
          width: 420px;
          height: 420px;
          left: 42%;
          bottom: -240px;
          background: rgba(64, 104, 255, 0.18);
        }

        .v6Grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(147, 197, 253, 0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(147, 197, 253, 0.055) 1px, transparent 1px);
          background-size: 88px 88px;
          mask-image: radial-gradient(circle at 50% 35%, black 0%, transparent 72%);
          opacity: 0.5;
        }

        .v6Noise {
          position: absolute;
          inset: 0;
          opacity: 0.06;
          background-image: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0 1px, transparent 1.4px);
          background-size: 120px 120px;
        }

        .v6Header {
          width: min(1500px, calc(100% - 4px));
          height: 72px;
          margin: 0 auto;
          position: fixed;
          left: 50%;
          top: 18px;
          transform: translateX(-50%);
          z-index: 50;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 22px;
          padding: 8px;
          border-radius: 28px;
          background: rgba(6, 16, 31, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            0 18px 46px rgba(0, 0, 0, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(22px);
        }

        .v6Brand {
          width: 180px;
          height: 56px;
          display: grid;
          place-items: center;
          border-radius: 22px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.03)),
            #050914;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: inset 0 0 24px rgba(11, 99, 255, 0.08);
        }

        .v6Brand img {
          width: 150px;
          height: 40px;
          object-fit: contain;
          filter: drop-shadow(0 0 12px rgba(11, 99, 255, 0.28));
        }

        .v6Nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 34px;
          color: rgba(226, 237, 255, 0.78);
          font-size: 14px;
          font-weight: 850;
        }

        .v6Nav a {
          transition: 0.22s ease;
        }

        .v6Nav a:hover {
          color: white;
          transform: translateY(-1px);
        }

        .v6HeaderCta {
          height: 54px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
          padding: 0 20px;
          border-radius: 20px;
          color: white;
          background: linear-gradient(135deg, #0b63ff, #10b8ff);
          box-shadow: 0 18px 38px rgba(11, 99, 255, 0.28);
          font-size: 14px;
          font-weight: 950;
        }

        .v6HeaderCta svg {
          width: 17px;
          height: 17px;
        }

        .mobileDock {
          display: none;
        }

        .v6Hero {
          width: min(1500px, 100%);
          margin: 0 auto;
          min-height: 890px;
          padding-top: 116px;
          display: grid;
          grid-template-columns: minmax(430px, 0.92fr) minmax(720px, 1.28fr);
          gap: 44px;
          align-items: center;
          position: relative;
          z-index: 2;
        }

        .v6HeroCopy {
          position: relative;
          z-index: 4;
        }

        .launchPill {
          width: max-content;
          max-width: 100%;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-height: 42px;
          padding: 0 15px;
          border-radius: 999px;
          color: #a8d8ff;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(147, 197, 253, 0.16);
          box-shadow: 0 16px 34px rgba(0, 0, 0, 0.16);
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 28px;
        }

        .pulseDot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: #24d18b;
          box-shadow: 0 0 0 8px rgba(36, 209, 139, 0.12);
        }

        .v6Hero h1 {
          max-width: 760px;
          margin: 0;
          color: white;
          font-size: clamp(54px, 5.65vw, 96px);
          line-height: 0.92;
          letter-spacing: -5.8px;
          font-weight: 950;
        }

        .v6Hero h1 span {
          display: block;
          width: max-content;
          max-width: 100%;
          background: linear-gradient(135deg, #ffffff 0%, #8fd7ff 38%, #0b63ff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 30px 80px rgba(11, 99, 255, 0.22);
        }

        .heroLead {
          max-width: 650px;
          margin: 26px 0 0;
          color: rgba(226, 237, 255, 0.72);
          font-size: 18px;
          line-height: 1.75;
          letter-spacing: -0.25px;
          font-weight: 560;
        }

        .integrationRail {
          width: min(660px, 100%);
          margin: 28px 0 0;
          padding: 18px;
          border-radius: 28px;
          background:
            linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.045)),
            radial-gradient(circle at 0% 0%, rgba(11, 99, 255, 0.22), transparent 42%);
          border: 1px solid rgba(147, 197, 253, 0.16);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.26),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(18px);
        }

        .railTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 14px;
        }

        .railTop span {
          display: inline-flex;
          min-height: 31px;
          align-items: center;
          padding: 0 12px;
          border-radius: 999px;
          background: rgba(11, 99, 255, 0.18);
          color: #a8d8ff;
          border: 1px solid rgba(147, 197, 253, 0.12);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }

        .railTop b {
          max-width: 220px;
          color: white;
          text-align: right;
          font-size: 16px;
          line-height: 1.2;
          letter-spacing: -0.3px;
        }

        .railLogos {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .railLogoCard {
          --accent: #0b63ff;
          position: relative;
          min-height: 74px;
          border-radius: 20px;
          display: grid;
          place-items: center;
          padding: 12px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 16px 30px rgba(0, 0, 0, 0.14);
          overflow: hidden;
          transition: 0.24s ease;
        }

        .railLogoCard::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 4px;
          background: var(--accent);
        }

        .railLogoCard:hover {
          transform: translateY(-4px);
          box-shadow: 0 22px 42px rgba(0, 0, 0, 0.2);
        }

        .railLogoCard img {
          max-width: 128px;
          max-height: 38px;
          width: auto;
          height: auto;
          object-fit: contain;
          display: block;
        }

        .railText {
          margin-top: 14px;
          color: rgba(226, 237, 255, 0.64);
          font-size: 13px;
          line-height: 1.62;
          font-weight: 650;
        }

        .v6Waitlist {
          width: min(660px, 100%);
          margin-top: 22px;
          padding: 20px;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(147, 197, 253, 0.16);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.24),
            inset 0 1px 0 rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(20px);
        }

        .waitlistCopy {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 14px;
        }

        .waitlistCopy span {
          color: #8fd7ff;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .waitlistCopy b {
          color: white;
          font-size: 16px;
          letter-spacing: -0.2px;
        }

        .waitlistRow {
          display: grid;
          grid-template-columns: 1fr 168px;
          gap: 10px;
        }

        .waitlistRow input {
          height: 58px;
          border: 1px solid rgba(147, 197, 253, 0.18);
          border-radius: 18px;
          outline: none;
          background: rgba(255, 255, 255, 0.08);
          color: white;
          padding: 0 17px;
          font-size: 15px;
          font-weight: 650;
        }

        .waitlistRow input::placeholder {
          color: rgba(226, 237, 255, 0.42);
        }

        .waitlistRow input:focus {
          border-color: rgba(73, 217, 255, 0.5);
          box-shadow: 0 0 0 5px rgba(73, 217, 255, 0.08);
          background: rgba(255, 255, 255, 0.11);
        }

        .waitlistRow button {
          height: 58px;
          border: 0;
          border-radius: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          color: white;
          background: linear-gradient(135deg, #0b63ff, #10b8ff);
          box-shadow: 0 18px 34px rgba(11, 99, 255, 0.28);
          font-size: 15px;
          font-weight: 950;
          transition: 0.22s ease;
        }

        .waitlistRow button:hover {
          transform: translateY(-2px);
          box-shadow: 0 24px 44px rgba(11, 99, 255, 0.36);
        }

        .waitlistRow button svg {
          width: 16px;
          height: 16px;
        }

        .formFeedback {
          margin-top: 12px;
          padding: 12px 14px;
          border-radius: 15px;
          font-size: 13px;
          font-weight: 800;
        }

        .formFeedback.error {
          color: #fecaca;
          background: rgba(220, 38, 38, 0.15);
          border: 1px solid rgba(248, 113, 113, 0.18);
        }

        .formFeedback.success {
          color: #bbf7d0;
          background: rgba(34, 197, 94, 0.13);
          border: 1px solid rgba(74, 222, 128, 0.18);
        }

        .trustLine {
          width: min(660px, 100%);
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
        }

        .trustLine span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: rgba(226, 237, 255, 0.66);
          font-size: 13px;
          font-weight: 750;
        }

        .trustLine svg {
          width: 16px;
          height: 16px;
          color: var(--green);
        }

        .v6ProductStage {
          min-height: 760px;
          position: relative;
          perspective: 1600px;
        }

        .stageGlow {
          position: absolute;
          width: 780px;
          height: 520px;
          left: 50%;
          top: 48%;
          transform: translate(-50%, -50%) rotate(-8deg);
          border-radius: 50%;
          background: radial-gradient(ellipse at center, rgba(16, 184, 255, 0.22), transparent 66%);
          filter: blur(6px);
        }

        .dashboardScene {
          position: absolute;
          left: 5%;
          right: 16%;
          top: 50%;
          transform: translateY(-50%) rotateX(7deg) rotateY(-13deg) rotateZ(-1deg);
          transform-style: preserve-3d;
          z-index: 4;
        }

        .laptopFrame {
          position: relative;
          height: 510px;
          border-radius: 38px 38px 28px 28px;
          padding: 18px 18px 34px;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.05) 44%, rgba(255, 255, 255, 0.26)),
            linear-gradient(180deg, #303c52, #121827 62%, #070b12);
          box-shadow:
            0 70px 140px rgba(0, 0, 0, 0.52),
            inset 0 1px 0 rgba(255, 255, 255, 0.38);
          border: 1px solid rgba(255, 255, 255, 0.16);
        }

        .laptopFrame::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 9px;
          width: 88px;
          height: 12px;
          transform: translateX(-50%);
          border-radius: 0 0 12px 12px;
          background: #050914;
          z-index: 3;
        }

        .laptopFrame::after {
          content: "";
          position: absolute;
          left: 8%;
          right: 8%;
          bottom: -24px;
          height: 32px;
          border-radius: 0 0 44px 44px;
          background: linear-gradient(180deg, #cdd8e8, #6b768a 80%);
          box-shadow: 0 24px 50px rgba(0, 0, 0, 0.32);
        }

        .dashboardScreen {
          height: 100%;
          overflow: hidden;
          border-radius: 26px;
          background:
            radial-gradient(circle at 76% 14%, rgba(11, 99, 255, 0.18), transparent 34%),
            linear-gradient(180deg, #081225, #020817);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            inset 0 0 60px rgba(11, 99, 255, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        .screenTopbar {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 0 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .screenBrand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
          font-size: 17px;
          font-weight: 950;
        }

        .screenBrand img {
          width: 26px;
          height: 26px;
          object-fit: contain;
        }

        .screenTopActions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .screenTopActions span {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.28);
        }

        .screenLayout {
          height: calc(100% - 64px);
          display: grid;
          grid-template-columns: 190px 1fr;
        }

        .screenSidebar {
          padding: 18px 14px;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.16);
        }

        .screenSidebar button {
          width: 100%;
          min-height: 42px;
          border: 0;
          border-radius: 14px;
          margin-bottom: 10px;
          color: rgba(226, 237, 255, 0.64);
          background: rgba(255, 255, 255, 0.06);
          font-weight: 900;
          transition: 0.2s ease;
        }

        .screenSidebar button.active,
        .screenSidebar button:hover {
          color: white;
          background: linear-gradient(135deg, #0b63ff, #10b8ff);
          box-shadow: 0 16px 30px rgba(11, 99, 255, 0.22);
        }

        .sidebarAi {
          margin-top: 18px;
          padding: 14px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.07);
        }

        .sidebarAi b {
          display: block;
          color: white;
          margin-bottom: 5px;
        }

        .sidebarAi span {
          display: block;
          color: rgba(226, 237, 255, 0.52);
          font-size: 12px;
          line-height: 1.5;
          font-weight: 650;
        }

        .screenMain {
          padding: 18px;
        }

        .screenHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 16px;
        }

        .screenHeader h3 {
          margin: 0;
          color: white;
          font-size: 24px;
          letter-spacing: -0.8px;
        }

        .screenHeader span {
          color: #8fd7ff;
          font-size: 12px;
          font-weight: 900;
        }

        .screenStats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 14px;
        }

        .screenStat {
          min-height: 104px;
          border-radius: 20px;
          padding: 14px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .screenStat small {
          display: block;
          color: #8fd7ff;
          font-size: 11px;
          font-weight: 850;
          margin-bottom: 10px;
        }

        .screenStat b {
          display: block;
          color: white;
          font-size: 22px;
          letter-spacing: -0.5px;
        }

        .screenStat em {
          display: block;
          color: var(--green);
          font-size: 11px;
          font-style: normal;
          font-weight: 950;
          margin-top: 8px;
        }

        .screenLower {
          display: grid;
          grid-template-columns: 1.3fr 0.9fr;
          gap: 14px;
        }

        .chartPanel,
        .activityPanel {
          height: 210px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.055);
          border: 1px solid rgba(255, 255, 255, 0.08);
          overflow: hidden;
          position: relative;
        }

        .chartPanel::before {
          content: "Satış grafiği";
          position: absolute;
          left: 16px;
          top: 14px;
          color: white;
          font-size: 13px;
          font-weight: 950;
        }

        .chartPanel svg {
          width: 100%;
          height: 100%;
          padding-top: 36px;
        }

        .activityPanel {
          padding: 14px;
        }

        .activityPanel h4 {
          margin: 0 0 12px;
          color: white;
          font-size: 14px;
        }

        .activityRow {
          min-height: 38px;
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 8px;
          padding: 0 10px;
          margin-bottom: 8px;
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.055);
          color: rgba(226, 237, 255, 0.66);
          font-size: 11px;
          font-weight: 780;
        }

        .activityRow b {
          color: white;
          font-size: 11px;
        }

        .phone3d {
          position: absolute;
          right: -64px;
          bottom: -38px;
          width: 210px;
          height: 430px;
          padding: 11px;
          border-radius: 44px;
          background:
            linear-gradient(135deg, rgba(255,255,255,.32), rgba(255,255,255,.06) 38%, rgba(255,255,255,.2)),
            #070b12;
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 46px 90px rgba(0, 0, 0, 0.48);
          transform: translateZ(130px) rotateZ(2deg);
          z-index: 9;
        }

        .phone3d::before {
          content: "";
          position: absolute;
          top: 11px;
          left: 50%;
          width: 72px;
          height: 18px;
          transform: translateX(-50%);
          border-radius: 0 0 999px 999px;
          background: #050914;
          z-index: 5;
        }

        .phoneScreen {
          height: 100%;
          border-radius: 34px;
          background:
            radial-gradient(circle at 70% 0%, rgba(11, 99, 255, 0.22), transparent 42%),
            linear-gradient(180deg, #091429, #040814);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 28px 13px 14px;
          overflow: hidden;
        }

        .phoneTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: white;
          font-size: 12px;
          font-weight: 950;
          margin-bottom: 16px;
        }

        .phoneTop img {
          width: 22px;
          height: 22px;
          object-fit: contain;
        }

        .phoneGreeting b {
          display: block;
          color: white;
          font-size: 15px;
          margin-bottom: 4px;
        }

        .phoneGreeting span {
          color: #8fd7ff;
          font-size: 11px;
          font-weight: 780;
        }

        .phoneTabs {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 7px;
          margin: 14px 0;
        }

        .phoneTabs button {
          height: 30px;
          border: 0;
          border-radius: 11px;
          color: rgba(226, 237, 255, 0.62);
          background: rgba(255, 255, 255, 0.07);
          font-size: 10px;
          font-weight: 900;
        }

        .phoneTabs button.active {
          color: white;
          background: linear-gradient(135deg, #0b63ff, #10b8ff);
        }

        .phoneCards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .phoneCard {
          min-height: 76px;
          padding: 10px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.07);
        }

        .phoneCard small {
          display: block;
          color: #8fd7ff;
          font-size: 10px;
          margin-bottom: 7px;
          font-weight: 750;
        }

        .phoneCard b {
          display: block;
          color: white;
          font-size: 15px;
        }

        .phoneCard em {
          display: block;
          color: var(--green);
          margin-top: 5px;
          font-style: normal;
          font-size: 10px;
          font-weight: 950;
        }

        .phoneAiBubble {
          margin-top: 12px;
          padding: 12px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(226, 237, 255, 0.72);
          font-size: 11px;
          line-height: 1.48;
          font-weight: 760;
        }

        .floatingMetric {
          position: absolute;
          z-index: 12;
          min-width: 194px;
          min-height: 74px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 12px;
          padding: 13px 15px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(147, 197, 253, 0.16);
          box-shadow: 0 24px 54px rgba(0, 0, 0, 0.28);
          backdrop-filter: blur(18px);
        }

        .floatingMetric svg {
          width: 28px;
          height: 28px;
          color: #8fd7ff;
        }

        .floatingMetric b {
          display: block;
          color: white;
          font-size: 16px;
          line-height: 1.1;
        }

        .floatingMetric span {
          display: block;
          color: rgba(226, 237, 255, 0.58);
          font-size: 12px;
          font-weight: 760;
          margin-top: 4px;
        }

        .floatingMetric em {
          color: var(--green);
          font-style: normal;
          font-size: 11px;
          font-weight: 950;
        }

        .metricOne {
          top: 42px;
          left: 34px;
        }

        .metricTwo {
          top: 78px;
          right: 52px;
        }

        .metricThree {
          bottom: 62px;
          left: 20px;
        }

        .priceGlass {
          position: absolute;
          right: 0;
          top: 210px;
          width: 245px;
          min-height: 330px;
          z-index: 14;
          padding: 20px;
          border-radius: 34px;
          color: white;
          background:
            radial-gradient(circle at 50% 0%, rgba(73, 217, 255, 0.28), transparent 36%),
            linear-gradient(180deg, rgba(6, 16, 31, 0.98), rgba(5, 9, 20, 0.96));
          border: 1px solid rgba(147, 197, 253, 0.18);
          box-shadow:
            0 38px 90px rgba(0, 0, 0, 0.46),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(18px);
        }

        .priceBadge {
          width: max-content;
          margin: 0 auto 20px;
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 14px;
          border-radius: 15px;
          background: linear-gradient(135deg, #0b63ff, #10b8ff);
          box-shadow: 0 14px 28px rgba(11, 99, 255, 0.28);
          font-size: 13px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .priceGlass span {
          display: block;
          text-align: center;
          color: rgba(226, 237, 255, 0.74);
          font-size: 13px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .priceGlass del {
          display: block;
          margin-top: 8px;
          text-align: center;
          color: rgba(255, 255, 255, 0.34);
          font-size: 36px;
          font-weight: 950;
          text-decoration-color: #0b63ff;
          text-decoration-thickness: 5px;
        }

        .priceGlass strong {
          display: block;
          margin-top: -4px;
          text-align: center;
          color: white;
          font-size: 78px;
          line-height: 0.94;
          letter-spacing: -4px;
          text-shadow: 0 0 32px rgba(11, 99, 255, 0.85);
        }

        .priceGlass p {
          margin: 10px 0 18px;
          text-align: center;
          color: rgba(226, 237, 255, 0.58);
          font-size: 13px;
          font-weight: 760;
        }

        .priceGlass a {
          width: 100%;
          height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 16px;
          color: white;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.12);
          font-size: 13px;
          font-weight: 950;
          transition: 0.22s ease;
        }

        .priceGlass a:hover {
          background: linear-gradient(135deg, #0b63ff, #10b8ff);
        }

        .priceGlass a svg {
          width: 15px;
          height: 15px;
        }

        .gorkiMini {
          position: absolute;
          right: 8px;
          bottom: 46px;
          width: 275px;
          z-index: 16;
          padding: 16px;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(147, 197, 253, 0.16);
          box-shadow: 0 28px 64px rgba(0, 0, 0, 0.34);
          backdrop-filter: blur(18px);
        }

        .gorkiMiniTop {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 12px;
        }

        .gorkiMiniTop img {
          width: 52px;
          height: 52px;
          object-fit: contain;
          border-radius: 16px;
          background: rgba(255,255,255,.08);
        }

        .gorkiMiniTop b {
          display: block;
          color: white;
          font-size: 16px;
        }

        .gorkiMiniTop span {
          display: block;
          color: rgba(226, 237, 255, 0.58);
          font-size: 12px;
          font-weight: 760;
          margin-top: 3px;
        }

        .gorkiMini p {
          margin: 0;
          padding: 13px;
          border-radius: 18px;
          color: rgba(226, 237, 255, 0.74);
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 13px;
          line-height: 1.52;
          font-weight: 760;
        }

        .valueSection {
          width: min(1500px, 100%);
          margin: 24px auto 0;
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .valueSection article {
          min-height: 168px;
          padding: 24px;
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.075);
          border: 1px solid rgba(147, 197, 253, 0.14);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(18px);
        }

        .valueSection svg {
          width: 34px;
          height: 34px;
          color: #8fd7ff;
          margin-bottom: 18px;
        }

        .valueSection b {
          display: block;
          color: white;
          font-size: 20px;
          letter-spacing: -0.5px;
          margin-bottom: 9px;
        }

        .valueSection span {
          display: block;
          color: rgba(226, 237, 255, 0.62);
          line-height: 1.62;
          font-size: 14px;
          font-weight: 650;
        }

        .v6Footer {
          width: min(1500px, 100%);
          min-height: 92px;
          margin: 18px auto 0;
          padding: 0 4px;
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          color: rgba(226, 237, 255, 0.48);
          font-size: 14px;
          font-weight: 780;
        }

        .v6Footer a:hover {
          color: white;
        }

        @media (max-width: 1460px) {
          .v6Hero {
            grid-template-columns: 1fr;
            gap: 26px;
          }

          .v6ProductStage {
            min-height: 780px;
          }

          .dashboardScene {
            left: 0;
            right: 16%;
          }

          .priceGlass {
            right: 2%;
          }

          .gorkiMini {
            right: 2%;
          }
        }

        @media (max-width: 1100px) {
          .takipioV6 {
            padding: 18px 14px 92px;
          }

          .v6Header {
            position: fixed;
            top: 12px;
            width: calc(100% - 24px);
            grid-template-columns: 1fr auto;
          }

          .v6Nav {
            display: none;
          }

          .v6Brand {
            width: 166px;
            height: 54px;
          }

          .v6Brand img {
            width: 138px;
          }

          .v6HeaderCta {
            height: 52px;
            padding: 0 16px;
          }

          .mobileDock {
            position: fixed;
            left: 12px;
            right: 12px;
            bottom: 12px;
            z-index: 60;
            height: 58px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 7px;
            padding: 7px;
            border-radius: 24px;
            background: rgba(6, 16, 31, 0.86);
            border: 1px solid rgba(147, 197, 253, 0.14);
            box-shadow: 0 20px 44px rgba(0, 0, 0, 0.34);
            backdrop-filter: blur(18px);
          }

          .mobileDock a {
            display: grid;
            place-items: center;
            border-radius: 17px;
            color: rgba(226, 237, 255, 0.7);
            background: rgba(255, 255, 255, 0.06);
            font-size: 12px;
            font-weight: 900;
          }

          .mobileDock a:last-child {
            color: white;
            background: linear-gradient(135deg, #0b63ff, #10b8ff);
          }

          .v6Hero {
            padding-top: 112px;
            min-height: auto;
          }

          .v6Hero h1 {
            letter-spacing: -3.8px;
          }

          .railLogos {
            grid-template-columns: repeat(2, 1fr);
          }

          .v6ProductStage {
            min-height: 980px;
          }

          .dashboardScene {
            left: 0;
            right: 0;
            top: 390px;
          }

          .laptopFrame {
            height: 470px;
          }

          .priceGlass {
            position: relative;
            top: auto;
            right: auto;
            width: 100%;
            min-height: auto;
            margin-bottom: 18px;
            display: grid;
            grid-template-columns: auto 1fr auto;
            align-items: center;
            gap: 14px;
          }

          .priceBadge {
            margin: 0;
          }

          .priceGlass span,
          .priceGlass del,
          .priceGlass strong,
          .priceGlass p {
            text-align: left;
            margin: 0;
          }

          .priceGlass strong {
            font-size: 56px;
          }

          .priceGlass a {
            width: auto;
            padding: 0 18px;
          }

          .gorkiMini {
            position: relative;
            right: auto;
            bottom: auto;
            width: 100%;
            margin-top: 18px;
          }

          .metricOne {
            top: 108px;
            left: 0;
          }

          .metricTwo {
            top: 108px;
            right: 0;
          }

          .metricThree {
            left: 0;
            bottom: 36px;
          }

          .valueSection {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 780px) {
          .v6HeaderCta {
            display: none;
          }

          .v6Header {
            display: flex;
            justify-content: center;
          }

          .v6Hero h1 {
            font-size: clamp(44px, 13vw, 64px);
            line-height: 0.96;
            letter-spacing: -2.8px;
          }

          .heroLead {
            font-size: 16px;
            line-height: 1.72;
          }

          .railTop,
          .waitlistCopy {
            flex-direction: column;
            align-items: flex-start;
          }

          .railTop b {
            text-align: left;
            max-width: none;
          }

          .waitlistRow {
            grid-template-columns: 1fr;
          }

          .trustLine {
            flex-direction: column;
          }

          .v6ProductStage {
            min-height: 820px;
            overflow: visible;
          }

          .floatingMetric {
            display: none;
          }

          .dashboardScene {
            top: 340px;
            transform: translateY(-50%) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
          }

          .laptopFrame {
            height: 390px;
            border-radius: 28px 28px 20px 20px;
            padding: 12px 12px 24px;
          }

          .screenTopbar {
            height: 52px;
            padding: 0 14px;
          }

          .screenBrand {
            font-size: 13px;
          }

          .screenLayout {
            grid-template-columns: 92px 1fr;
          }

          .screenSidebar {
            padding: 10px 8px;
          }

          .screenSidebar button {
            min-height: 32px;
            font-size: 0;
            margin-bottom: 8px;
          }

          .screenSidebar button::after {
            content: "";
            display: block;
            width: 70%;
            height: 7px;
            border-radius: 999px;
            background: currentColor;
            margin: auto;
            opacity: 0.72;
          }

          .sidebarAi {
            display: none;
          }

          .screenMain {
            padding: 10px;
          }

          .screenHeader h3 {
            font-size: 16px;
          }

          .screenHeader span {
            font-size: 10px;
          }

          .screenStats {
            grid-template-columns: 1fr;
          }

          .screenStats .screenStat:nth-child(n + 2) {
            display: none;
          }

          .screenStat {
            min-height: 72px;
          }

          .screenLower {
            grid-template-columns: 1fr;
          }

          .chartPanel {
            height: 132px;
          }

          .activityPanel {
            display: none;
          }

          .phone3d {
            width: 150px;
            height: 306px;
            right: -4px;
            bottom: -32px;
            border-radius: 34px;
          }

          .phoneScreen {
            border-radius: 26px;
            padding: 24px 9px 10px;
          }

          .phoneGreeting {
            display: none;
          }

          .phoneTabs {
            grid-template-columns: 1fr 1fr;
            gap: 6px;
          }

          .phoneCards {
            grid-template-columns: 1fr;
          }

          .phoneCards .phoneCard:nth-child(n + 3) {
            display: none;
          }

          .phoneAiBubble {
            font-size: 10px;
          }

          .priceGlass {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .priceGlass span,
          .priceGlass del,
          .priceGlass strong,
          .priceGlass p {
            text-align: center;
          }

          .priceGlass a {
            width: 100%;
          }

          .v6Footer {
            flex-direction: column;
            justify-content: center;
            min-height: 140px;
            padding-bottom: 40px;
          }
        }

        @media (max-width: 460px) {
          .takipioV6 {
            padding: 16px 12px 92px;
          }

          .v6Brand {
            width: 156px;
          }

          .v6Brand img {
            width: 130px;
          }

          .launchPill {
            font-size: 11px;
            line-height: 1.25;
            white-space: normal;
          }

          .v6Hero h1 {
            font-size: 43px;
            letter-spacing: -2.4px;
          }

          .integrationRail,
          .v6Waitlist {
            padding: 16px;
            border-radius: 24px;
          }

          .railLogoCard {
            min-height: 66px;
          }

          .railLogoCard img {
            max-width: 116px;
            max-height: 34px;
          }

          .v6ProductStage {
            min-height: 760px;
          }

          .laptopFrame {
            height: 350px;
          }

          .phone3d {
            scale: 0.9;
            right: -20px;
            bottom: -34px;
          }

          .priceGlass strong {
            font-size: 54px;
          }

          .valueSection article {
            min-height: 150px;
          }
        }
      `}</style>
    </main>
  );
}

function DashboardScene({
  activeTab,
  setActiveTab,
  gorkiMessage,
}: {
  activeTab: DemoTab;
  setActiveTab: (tab: DemoTab) => void;
  gorkiMessage: string;
}) {
  const active = useMemo(
    () => demoTabs.find((tab) => tab.key === activeTab) ?? demoTabs[0],
    [activeTab]
  );

  return (
    <div className="dashboardScene">
      <div className="laptopFrame">
        <div className="dashboardScreen">
          <div className="screenTopbar">
            <div className="screenBrand">
              <img src="/takipio-logo.png" alt="" />
              takipio
            </div>
            <div className="screenTopActions">
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="screenLayout">
            <aside className="screenSidebar">
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

              <div className="sidebarAi">
                <b>Gorki AI</b>
                <span>Bugünkü işler ve pazaryeri akışın özetleniyor.</span>
              </div>
            </aside>

            <div className="screenMain">
              <div className="screenHeader">
                <div>
                  <h3>{active.label}</h3>
                  <span>Canlı demo modu</span>
                </div>
              </div>

              <div className="screenStats">
                <div className="screenStat">
                  <small>{active.helper}</small>
                  <b>{active.value}</b>
                  <em>+%18,6</em>
                </div>
                <div className="screenStat">
                  <small>Aktif işlem</small>
                  <b>{activeTab === "orders" ? "24" : activeTab === "marketplaces" ? "4" : "12"}</b>
                  <em>Bugün</em>
                </div>
                <div className="screenStat">
                  <small>Müşteri</small>
                  <b>89</b>
                  <em>+%5,7</em>
                </div>
                <div className="screenStat">
                  <small>Durum</small>
                  <b>{activeTab === "gorki" ? "Özetlendi" : "Güncel"}</b>
                  <em>Aktif</em>
                </div>
              </div>

              <div className="screenLower">
                <div className="chartPanel">
                  <svg viewBox="0 0 520 190" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                      <linearGradient id="takipioLine" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#0b63ff" />
                        <stop offset="100%" stopColor="#49d9ff" />
                      </linearGradient>
                      <linearGradient id="takipioFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="rgba(11,99,255,.32)" />
                        <stop offset="100%" stopColor="rgba(11,99,255,0)" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 160 C42 126 68 118 106 128 C150 140 165 62 212 84 C252 103 264 42 313 61 C362 84 376 25 422 40 C464 54 476 18 520 32 L520 190 L0 190 Z"
                      fill="url(#takipioFill)"
                    />
                    <path
                      d="M0 160 C42 126 68 118 106 128 C150 140 165 62 212 84 C252 103 264 42 313 61 C362 84 376 25 422 40 C464 54 476 18 520 32"
                      fill="none"
                      stroke="url(#takipioLine)"
                      strokeWidth="7"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="activityPanel">
                  <h4>Canlı akış</h4>
                  {activityRows.map((row) => (
                    <div className="activityRow" key={row.code}>
                      <span>{row.source} · {row.status}</span>
                      <b>{row.price}</b>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <PhoneMockup activeTab={activeTab} setActiveTab={setActiveTab} message={gorkiMessage} />
      </div>
    </div>
  );
}

function PhoneMockup({
  activeTab,
  setActiveTab,
  message,
}: {
  activeTab: DemoTab;
  setActiveTab: (tab: DemoTab) => void;
  message: string;
}) {
  const active = useMemo(
    () => demoTabs.find((tab) => tab.key === activeTab) ?? demoTabs[0],
    [activeTab]
  );

  return (
    <div className="phone3d">
      <div className="phoneScreen">
        <div className="phoneTop">
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
              {tab.label.split(" ")[0]}
            </button>
          ))}
        </div>

        <div className="phoneCards">
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
            <em>4 kanal</em>
          </div>
        </div>

        <div className="phoneAiBubble">“{message}”</div>
      </div>
    </div>
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

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M20 6L9 17l-5-5" />
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

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M3 7h18v12H3z" />
      <path d="M16 12h5v4h-5a2 2 0 0 1 0-4z" />
      <path d="M3 7l3-4h12l3 4" />
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

function PanelIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M4 5h7v6H4z" />
      <path d="M13 5h7v14h-7z" />
      <path d="M4 13h7v6H4z" />
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

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
    </svg>
  );
}
