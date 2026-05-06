"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type DemoTab = "overview" | "orders" | "marketplaces" | "gorki";

const demoTabs: { key: DemoTab; label: string; value: string; helper: string }[] = [
  { key: "overview", label: "Genel Bakış", value: "₺125.250", helper: "Haftalık ciro" },
  { key: "orders", label: "Siparişler", value: "128", helper: "Aktif sipariş" },
  { key: "marketplaces", label: "Pazaryerleri", value: "4", helper: "Bağlantı modu" },
  { key: "gorki", label: "Gorki AI", value: "12", helper: "Akıllı öneri" },
];

const marketplaces = [
  { name: "Trendyol", logo: "/trendyol.png", accent: "#f27a1a" },
  { name: "Amazon", logo: "/amazon.png", accent: "#ffb000" },
  { name: "Hepsiburada", logo: "/hepsiburada.png", accent: "#ff6000" },
  { name: "Çiçeksepeti", logo: "/ciceksepeti.png", accent: "#36b86a" },
];

const gorkiMessages = [
  "Bugün pazaryeri siparişlerinde %18 artış var.",
  "2 ürün kritik stok seviyesine yaklaşıyor.",
  "Bekleyen 4 ödeme için hatırlatma öneriyorum.",
  "Tüm satış kanallarını tek özet altında topladım.",
];

const activityRows = [
  { source: "Trendyol", status: "Hazırlanıyor", price: "₺1.250" },
  { source: "Amazon", status: "Kargoda", price: "₺890" },
  { source: "Hepsiburada", status: "Stok güncel", price: "₺2.140" },
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
        return demoTabs[(index + 1) % demoTabs.length].key;
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
        source: "landing-v7",
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
        headers: { "Content-Type": "application/json" },
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
      className="takipioV7"
      style={{
        opacity: ready ? 1 : 0,
        visibility: ready ? "visible" : "hidden",
      }}
    >
      <div className="pageBg">
        <div className="bgOrb bgOrbOne" />
        <div className="bgOrb bgOrbTwo" />
        <div className="bgGrid" />
      </div>

      <header className="topbar">
        <a className="brand" href="#top" aria-label="Takipio">
          <img src="/takipio-logo.png" alt="Takipio" />
        </a>

        <nav className="desktopNav">
          <a href="#product">Ürün</a>
          <a href="#integrations">Entegrasyon</a>
          <a href="#gorki">Gorki AI</a>
          <a href="#pricing">Fiyat</a>
        </nav>

        <a className="topbarCta" href="#waitlist">
          Erken erişim <ArrowIcon />
        </a>
      </header>

      <nav className="mobileDock">
        <a href="#top">Ana Sayfa</a>
        <a href="#product">Ürün</a>
        <a href="#integrations">Pazaryeri</a>
        <a href="#waitlist">Kayıt</a>
      </nav>

      <section className="hero" id="top">
        <div className="heroLeft">
          <div className="statusPill">
            <span />
            Takipio erken erişim açıldı
          </div>

          <h1>
            İşletme akışını
            <em>tek ekranda</em>
            toparla.
          </h1>

          <p className="heroText">
            Sipariş, müşteri, stok, ödeme ve pazaryeri hareketlerini Takipio’da
            sadeleştir. Gorki AI günlük işlerini senin için özetlesin.
          </p>

          <div className="marketRail" id="integrations">
            <div className="marketRailHeader">
              <span>Pazaryeri entegrasyonları</span>
              <b>Satış kanallarını tek panelde takip et.</b>
            </div>

            <div className="marketLogos">
              {marketplaces.map((market) => (
                <div
                  className="marketLogoCard"
                  key={market.name}
                  style={{ "--accent": market.accent } as React.CSSProperties}
                >
                  <img src={market.logo} alt={market.name} />
                </div>
              ))}
            </div>
          </div>

          <form className="waitlist" id="waitlist" onSubmit={handleSubmit}>
            <div className="waitlistTop">
              <div>
                <span>Erken erişim</span>
                <b>Açılışa özel TAKIPIO10 kodunu kaçırma.</b>
              </div>
              <div className="miniPrice" id="pricing">
                <small>İlk ay</small>
                <strong>₺89</strong>
              </div>
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

            {errorMessage && <div className="feedback error">{errorMessage}</div>}
            {saved && <div className="feedback success">Kaydın alındı. Hoş geldin maili gönderildi.</div>}
          </form>

          <div className="trustLine">
            <span><CheckIcon /> 15 müşteriye kadar ücretsiz</span>
            <span><CheckIcon /> Gorki AI dahil</span>
            <span><CheckIcon /> Pazaryeri altyapısı</span>
          </div>
        </div>

        <div className="heroRight" id="product">
          <div className="studioCard">
            <div className="studioGlow" />
            <DashboardDevice
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              message={gorkiMessages[messageIndex]}
            />

            <div className="metricCard metricA">
              <OrdersIcon />
              <div>
                <b>128</b>
                <span>Aktif sipariş</span>
              </div>
            </div>

            <div className="metricCard metricB">
              <WalletIcon />
              <div>
                <b>₺125.250</b>
                <span>Haftalık ciro</span>
              </div>
            </div>

            <div className="gorkiBubble" id="gorki">
              <div className="gorkiHead">
                <img src="/gorki-hero.png" alt="Gorki AI" />
                <div>
                  <b>Gorki AI</b>
                  <span>Akıllı asistanın</span>
                </div>
              </div>
              <p>“{gorkiMessages[messageIndex]}”</p>
            </div>

            <div className="couponFloat">
              <span>Açılışa özel</span>
              <b>₺89</b>
              <small>ilk ay</small>
            </div>
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

      <style jsx global>{`
        :root {
          --bg: #050914;
          --panel: rgba(255, 255, 255, 0.08);
          --panel2: rgba(255, 255, 255, 0.12);
          --line: rgba(147, 197, 253, 0.16);
          --white: #ffffff;
          --muted: rgba(226, 237, 255, 0.68);
          --muted2: rgba(226, 237, 255, 0.48);
          --blue: #0b63ff;
          --cyan: #22c5ff;
          --green: #24d18b;
          --dark: #06101f;
          --shadow: 0 34px 100px rgba(0, 0, 0, 0.38);
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
          overflow-x: hidden;
          background: var(--bg);
        }

        body {
          margin: 0;
          overflow-x: hidden;
          color: var(--white);
          background: var(--bg);
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

        .takipioV7 {
          min-height: 100svh;
          position: relative;
          overflow: hidden;
          padding: 24px;
          background:
            radial-gradient(circle at 18% 16%, rgba(11, 99, 255, 0.22), transparent 28%),
            radial-gradient(circle at 82% 18%, rgba(34, 197, 255, 0.16), transparent 30%),
            linear-gradient(180deg, #050914 0%, #071020 56%, #050914 100%);
          transition: opacity 0.18s ease;
        }

        .pageBg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .bgOrb {
          position: absolute;
          border-radius: 999px;
          filter: blur(56px);
        }

        .bgOrbOne {
          width: 520px;
          height: 520px;
          left: -220px;
          top: 110px;
          background: rgba(11, 99, 255, 0.2);
        }

        .bgOrbTwo {
          width: 560px;
          height: 560px;
          right: -220px;
          top: 90px;
          background: rgba(34, 197, 255, 0.14);
        }

        .bgGrid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(147, 197, 253, 0.052) 1px, transparent 1px),
            linear-gradient(90deg, rgba(147, 197, 253, 0.052) 1px, transparent 1px);
          background-size: 86px 86px;
          mask-image: radial-gradient(circle at 50% 36%, black 0%, transparent 72%);
          opacity: 0.62;
        }

        .topbar {
          width: min(1500px, calc(100% - 48px));
          height: 74px;
          position: fixed;
          left: 50%;
          top: 18px;
          transform: translateX(-50%);
          z-index: 50;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 24px;
          padding: 8px;
          border-radius: 30px;
          background: rgba(6, 16, 31, 0.76);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 18px 46px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(22px);
        }

        .brand {
          width: 180px;
          height: 58px;
          display: grid;
          place-items: center;
          border-radius: 23px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.03)),
            #050914;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .brand img {
          width: 150px;
          height: 42px;
          object-fit: contain;
        }

        .desktopNav {
          display: flex;
          justify-content: center;
          gap: 34px;
          color: var(--muted);
          font-size: 14px;
          font-weight: 850;
        }

        .desktopNav a:hover {
          color: white;
        }

        .topbarCta {
          height: 56px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 0 20px;
          border-radius: 21px;
          color: white;
          background: linear-gradient(135deg, var(--blue), var(--cyan));
          box-shadow: 0 18px 38px rgba(11, 99, 255, 0.28);
          font-size: 14px;
          font-weight: 950;
        }

        .topbarCta svg {
          width: 17px;
        }

        .mobileDock {
          display: none;
        }

        .hero {
          width: min(1500px, 100%);
          min-height: 880px;
          margin: 0 auto;
          padding-top: 118px;
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: minmax(420px, 0.84fr) minmax(650px, 1.16fr);
          gap: 48px;
          align-items: center;
        }

        .heroLeft {
          position: relative;
          z-index: 4;
        }

        .statusPill {
          width: max-content;
          max-width: 100%;
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 0 15px;
          border-radius: 999px;
          color: #a8d8ff;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--line);
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.9px;
          text-transform: uppercase;
          margin-bottom: 28px;
        }

        .statusPill span {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: var(--green);
          box-shadow: 0 0 0 8px rgba(36, 209, 139, 0.12);
        }

        h1 {
          max-width: 680px;
          margin: 0;
          color: white;
          font-size: clamp(54px, 5.15vw, 88px);
          line-height: 0.94;
          letter-spacing: -5px;
          font-weight: 950;
        }

        h1 em {
          display: block;
          font-style: normal;
          width: max-content;
          max-width: 100%;
          background: linear-gradient(135deg, #ffffff 0%, #8fd7ff 38%, #0b63ff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 30px 80px rgba(11, 99, 255, 0.22);
        }

        .heroText {
          max-width: 620px;
          margin: 26px 0 0;
          color: var(--muted);
          font-size: 18px;
          line-height: 1.76;
          letter-spacing: -0.2px;
          font-weight: 560;
        }

        .marketRail {
          width: min(640px, 100%);
          margin: 28px 0 0;
          padding: 18px;
          border-radius: 28px;
          background:
            linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.045)),
            radial-gradient(circle at 0% 0%, rgba(11, 99, 255, 0.2), transparent 42%);
          border: 1px solid var(--line);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(18px);
        }

        .marketRailHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 14px;
        }

        .marketRailHeader span {
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

        .marketRailHeader b {
          max-width: 215px;
          color: white;
          text-align: right;
          font-size: 15px;
          line-height: 1.25;
          letter-spacing: -0.2px;
        }

        .marketLogos {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .marketLogoCard {
          --accent: #0b63ff;
          min-height: 78px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 14px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 16px 30px rgba(0, 0, 0, 0.14);
          position: relative;
          overflow: hidden;
        }

        .marketLogoCard::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 4px;
          background: var(--accent);
        }

        .marketLogoCard img {
          display: block;
          max-width: 122px;
          max-height: 36px;
          width: auto;
          height: auto;
          object-fit: contain;
        }

        .waitlist {
          width: min(640px, 100%);
          margin-top: 22px;
          padding: 20px;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--line);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.24),
            inset 0 1px 0 rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(20px);
        }

        .waitlistTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
        }

        .waitlistTop span {
          display: block;
          color: #8fd7ff;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .waitlistTop b {
          display: block;
          color: white;
          font-size: 16px;
          letter-spacing: -0.2px;
        }

        .miniPrice {
          min-width: 92px;
          min-height: 58px;
          display: grid;
          place-items: center;
          padding: 8px 12px;
          border-radius: 18px;
          color: white;
          background: linear-gradient(135deg, rgba(11, 99, 255, 0.95), rgba(34, 197, 255, 0.78));
          box-shadow: 0 16px 30px rgba(11, 99, 255, 0.24);
        }

        .miniPrice small {
          font-size: 10px;
          font-weight: 900;
          opacity: 0.86;
        }

        .miniPrice strong {
          font-size: 24px;
          line-height: 1;
        }

        .waitlistRow {
          display: grid;
          grid-template-columns: 1fr 156px;
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
          background: linear-gradient(135deg, var(--blue), var(--cyan));
          box-shadow: 0 18px 34px rgba(11, 99, 255, 0.28);
          font-size: 15px;
          font-weight: 950;
        }

        .waitlistRow button svg {
          width: 16px;
        }

        .feedback {
          margin-top: 12px;
          padding: 12px 14px;
          border-radius: 15px;
          font-size: 13px;
          font-weight: 800;
        }

        .feedback.error {
          color: #fecaca;
          background: rgba(220, 38, 38, 0.15);
          border: 1px solid rgba(248, 113, 113, 0.18);
        }

        .feedback.success {
          color: #bbf7d0;
          background: rgba(34, 197, 94, 0.13);
          border: 1px solid rgba(74, 222, 128, 0.18);
        }

        .trustLine {
          width: min(640px, 100%);
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
        }

        .trustLine span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: var(--muted);
          font-size: 13px;
          font-weight: 750;
        }

        .trustLine svg {
          width: 16px;
          height: 16px;
          color: var(--green);
        }

        .heroRight {
          min-height: 720px;
          position: relative;
        }

        .studioCard {
          position: relative;
          width: 100%;
          min-height: 700px;
          border-radius: 44px;
          background:
            radial-gradient(circle at 50% 0%, rgba(34, 197, 255, 0.16), transparent 36%),
            linear-gradient(145deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.035));
          border: 1px solid var(--line);
          box-shadow:
            0 34px 100px rgba(0, 0, 0, 0.32),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(18px);
          overflow: hidden;
        }

        .studioGlow {
          position: absolute;
          width: 680px;
          height: 440px;
          left: 50%;
          top: 48%;
          transform: translate(-50%, -50%) rotate(-8deg);
          border-radius: 50%;
          background: radial-gradient(ellipse at center, rgba(16, 184, 255, 0.24), transparent 66%);
          filter: blur(4px);
        }

        .deviceScene {
          position: absolute;
          left: 7%;
          right: 7%;
          top: 50%;
          transform: translateY(-50%);
          perspective: 1600px;
          z-index: 4;
        }

        .laptop {
          position: relative;
          height: 445px;
          transform: rotateX(7deg) rotateY(-10deg) rotateZ(-1deg);
          transform-style: preserve-3d;
        }

        .laptopLid {
          height: 100%;
          border-radius: 34px 34px 24px 24px;
          padding: 16px 16px 30px;
          background:
            linear-gradient(135deg, rgba(255,255,255,.34), rgba(255,255,255,.06) 45%, rgba(255,255,255,.22)),
            linear-gradient(180deg, #2f3a50, #111827 64%, #070b12);
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow:
            0 64px 120px rgba(0, 0, 0, 0.48),
            inset 0 1px 0 rgba(255, 255, 255, 0.32);
        }

        .laptopLid::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 8px;
          width: 82px;
          height: 12px;
          transform: translateX(-50%);
          border-radius: 0 0 12px 12px;
          background: #050914;
          z-index: 3;
        }

        .laptopBase {
          position: absolute;
          left: 8%;
          right: 8%;
          bottom: -25px;
          height: 34px;
          border-radius: 0 0 46px 46px;
          background: linear-gradient(180deg, #d3deee, #69768b 80%);
          box-shadow: 0 24px 50px rgba(0, 0, 0, 0.34);
        }

        .screen {
          height: 100%;
          overflow: hidden;
          border-radius: 24px;
          background:
            radial-gradient(circle at 76% 14%, rgba(11, 99, 255, 0.18), transparent 34%),
            linear-gradient(180deg, #081225, #020817);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            inset 0 0 60px rgba(11, 99, 255, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        .screenTop {
          height: 58px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .screenBrand {
          display: flex;
          align-items: center;
          gap: 9px;
          color: white;
          font-size: 15px;
          font-weight: 950;
        }

        .screenBrand img {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }

        .screenDots {
          display: flex;
          gap: 8px;
        }

        .screenDots span {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.26);
        }

        .screenBody {
          height: calc(100% - 58px);
          display: grid;
          grid-template-columns: 168px 1fr;
        }

        .sidebar {
          padding: 16px 12px;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.16);
        }

        .sidebar button {
          width: 100%;
          min-height: 39px;
          border: 0;
          border-radius: 13px;
          margin-bottom: 9px;
          color: rgba(226, 237, 255, 0.64);
          background: rgba(255, 255, 255, 0.06);
          font-size: 12px;
          font-weight: 900;
        }

        .sidebar button.active {
          color: white;
          background: linear-gradient(135deg, var(--blue), var(--cyan));
          box-shadow: 0 16px 30px rgba(11, 99, 255, 0.22);
        }

        .sideNote {
          margin-top: 16px;
          padding: 12px;
          border-radius: 17px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.07);
        }

        .sideNote b {
          display: block;
          color: white;
          font-size: 13px;
          margin-bottom: 5px;
        }

        .sideNote span {
          display: block;
          color: var(--muted2);
          font-size: 11px;
          line-height: 1.45;
          font-weight: 650;
        }

        .mainDash {
          padding: 16px;
        }

        .dashHeader {
          display: flex;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .dashHeader h3 {
          margin: 0;
          color: white;
          font-size: 22px;
          letter-spacing: -0.7px;
        }

        .dashHeader span {
          color: #8fd7ff;
          font-size: 11px;
          font-weight: 900;
        }

        .dashStats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 12px;
        }

        .dashStat {
          min-height: 94px;
          padding: 12px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .dashStat small {
          display: block;
          color: #8fd7ff;
          font-size: 10px;
          font-weight: 850;
          margin-bottom: 9px;
        }

        .dashStat b {
          display: block;
          color: white;
          font-size: 20px;
        }

        .dashStat em {
          display: block;
          color: var(--green);
          font-size: 10px;
          font-style: normal;
          font-weight: 950;
          margin-top: 7px;
        }

        .dashLower {
          display: grid;
          grid-template-columns: 1.25fr 0.92fr;
          gap: 12px;
        }

        .chartPanel,
        .activityPanel {
          height: 188px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.055);
          border: 1px solid rgba(255, 255, 255, 0.08);
          overflow: hidden;
          position: relative;
        }

        .chartPanel::before {
          content: "Satış grafiği";
          position: absolute;
          left: 14px;
          top: 12px;
          color: white;
          font-size: 12px;
          font-weight: 950;
        }

        .chartPanel svg {
          width: 100%;
          height: 100%;
          padding-top: 34px;
        }

        .activityPanel {
          padding: 13px;
        }

        .activityPanel h4 {
          margin: 0 0 10px;
          color: white;
          font-size: 13px;
        }

        .activityRow {
          min-height: 34px;
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 7px;
          padding: 0 9px;
          margin-bottom: 8px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.055);
          color: var(--muted);
          font-size: 10px;
          font-weight: 780;
        }

        .activityRow b {
          color: white;
          font-size: 10px;
        }

        .phone {
          position: absolute;
          right: -42px;
          bottom: -34px;
          width: 186px;
          height: 382px;
          padding: 10px;
          border-radius: 40px;
          background:
            linear-gradient(135deg, rgba(255,255,255,.32), rgba(255,255,255,.06) 38%, rgba(255,255,255,.2)),
            #070b12;
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 46px 90px rgba(0, 0, 0, 0.48);
          z-index: 9;
        }

        .phone::before {
          content: "";
          position: absolute;
          top: 10px;
          left: 50%;
          width: 68px;
          height: 17px;
          transform: translateX(-50%);
          border-radius: 0 0 999px 999px;
          background: #050914;
          z-index: 5;
        }

        .phoneScreen {
          height: 100%;
          overflow: hidden;
          border-radius: 31px;
          padding: 26px 11px 12px;
          background:
            radial-gradient(circle at 70% 0%, rgba(11, 99, 255, 0.22), transparent 42%),
            linear-gradient(180deg, #091429, #040814);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .phoneTop {
          display: flex;
          justify-content: space-between;
          color: white;
          font-size: 11px;
          font-weight: 950;
          margin-bottom: 13px;
        }

        .phoneTop img {
          width: 20px;
          height: 20px;
          object-fit: contain;
          vertical-align: middle;
          margin-right: 5px;
        }

        .phoneGreeting b {
          display: block;
          color: white;
          font-size: 13px;
          margin-bottom: 4px;
        }

        .phoneGreeting span {
          color: #8fd7ff;
          font-size: 10px;
          font-weight: 780;
        }

        .phoneTabs {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
          margin: 12px 0;
        }

        .phoneTabs button {
          height: 28px;
          border: 0;
          border-radius: 10px;
          color: var(--muted);
          background: rgba(255, 255, 255, 0.07);
          font-size: 9px;
          font-weight: 900;
        }

        .phoneTabs button.active {
          color: white;
          background: linear-gradient(135deg, var(--blue), var(--cyan));
        }

        .phoneCards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 7px;
        }

        .phoneCard {
          min-height: 70px;
          padding: 9px;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.07);
        }

        .phoneCard small {
          display: block;
          color: #8fd7ff;
          font-size: 9px;
          margin-bottom: 6px;
          font-weight: 750;
        }

        .phoneCard b {
          display: block;
          color: white;
          font-size: 13px;
        }

        .phoneCard em {
          display: block;
          color: var(--green);
          margin-top: 5px;
          font-style: normal;
          font-size: 9px;
          font-weight: 950;
        }

        .phoneAi {
          margin-top: 11px;
          padding: 11px;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--muted);
          font-size: 10px;
          line-height: 1.45;
          font-weight: 760;
        }

        .metricCard {
          position: absolute;
          z-index: 12;
          min-width: 178px;
          min-height: 68px;
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: center;
          gap: 11px;
          padding: 12px 14px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid var(--line);
          box-shadow: 0 24px 54px rgba(0, 0, 0, 0.28);
          backdrop-filter: blur(18px);
        }

        .metricCard svg {
          width: 27px;
          height: 27px;
          color: #8fd7ff;
        }

        .metricCard b {
          display: block;
          color: white;
          font-size: 15px;
        }

        .metricCard span {
          display: block;
          color: var(--muted2);
          font-size: 12px;
          font-weight: 760;
          margin-top: 3px;
        }

        .metricA {
          top: 72px;
          left: 34px;
        }

        .metricB {
          top: 76px;
          right: 34px;
        }

        .gorkiBubble {
          position: absolute;
          left: 38px;
          bottom: 34px;
          width: 265px;
          z-index: 13;
          padding: 14px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid var(--line);
          box-shadow: 0 26px 56px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(18px);
        }

        .gorkiHead {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 11px;
        }

        .gorkiHead img {
          width: 48px;
          height: 48px;
          object-fit: contain;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.08);
        }

        .gorkiHead b {
          display: block;
          color: white;
          font-size: 15px;
        }

        .gorkiHead span {
          display: block;
          color: var(--muted2);
          font-size: 12px;
          font-weight: 760;
          margin-top: 3px;
        }

        .gorkiBubble p {
          margin: 0;
          padding: 12px;
          border-radius: 16px;
          color: var(--muted);
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 12px;
          line-height: 1.48;
          font-weight: 760;
        }

        .couponFloat {
          position: absolute;
          right: 34px;
          bottom: 36px;
          z-index: 14;
          width: 140px;
          min-height: 116px;
          padding: 14px;
          border-radius: 24px;
          text-align: center;
          color: white;
          background:
            radial-gradient(circle at 50% 0%, rgba(34, 197, 255, 0.22), transparent 50%),
            rgba(6, 16, 31, 0.84);
          border: 1px solid var(--line);
          box-shadow: 0 26px 56px rgba(0, 0, 0, 0.34);
          backdrop-filter: blur(18px);
        }

        .couponFloat span {
          display: block;
          color: #8fd7ff;
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .couponFloat b {
          display: block;
          font-size: 42px;
          line-height: 1;
          margin: 8px 0 4px;
          letter-spacing: -2px;
        }

        .couponFloat small {
          color: var(--muted2);
          font-weight: 850;
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
          min-height: 158px;
          padding: 24px;
          border-radius: 30px;
          background: var(--panel);
          border: 1px solid var(--line);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(18px);
        }

        .valueSection svg {
          width: 32px;
          height: 32px;
          color: #8fd7ff;
          margin-bottom: 16px;
        }

        .valueSection b {
          display: block;
          color: white;
          font-size: 19px;
          letter-spacing: -0.4px;
          margin-bottom: 8px;
        }

        .valueSection span {
          display: block;
          color: var(--muted);
          line-height: 1.6;
          font-size: 14px;
          font-weight: 650;
        }

        @media (max-width: 1460px) {
          .hero {
            grid-template-columns: 1fr;
            gap: 26px;
          }

          .heroRight {
            min-height: 760px;
          }

          .studioCard {
            min-height: 740px;
          }

          .heroLeft {
            max-width: 820px;
          }
        }

        @media (max-width: 1100px) {
          .takipioV7 {
            padding: 18px 14px 92px;
          }

          .topbar {
            top: 12px;
            width: calc(100% - 24px);
            grid-template-columns: 1fr auto;
          }

          .desktopNav {
            display: none;
          }

          .brand {
            width: 166px;
            height: 54px;
          }

          .brand img {
            width: 138px;
          }

          .topbarCta {
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
            border: 1px solid var(--line);
            box-shadow: 0 20px 44px rgba(0, 0, 0, 0.34);
            backdrop-filter: blur(18px);
          }

          .mobileDock a {
            display: grid;
            place-items: center;
            border-radius: 17px;
            color: var(--muted);
            background: rgba(255, 255, 255, 0.06);
            font-size: 12px;
            font-weight: 900;
          }

          .mobileDock a:last-child {
            color: white;
            background: linear-gradient(135deg, var(--blue), var(--cyan));
          }

          .hero {
            padding-top: 112px;
            min-height: auto;
          }

          h1 {
            letter-spacing: -3.6px;
          }

          .marketLogos {
            grid-template-columns: repeat(2, 1fr);
          }

          .studioCard {
            min-height: 700px;
          }

          .deviceScene {
            left: 5%;
            right: 5%;
            top: 330px;
          }

          .laptop {
            height: 420px;
          }

          .metricA {
            left: 24px;
            top: 42px;
          }

          .metricB {
            right: 24px;
            top: 42px;
          }

          .gorkiBubble {
            left: 24px;
            bottom: 24px;
          }

          .couponFloat {
            right: 24px;
            bottom: 26px;
          }

          .valueSection {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 780px) {
          .topbarCta {
            display: none;
          }

          .topbar {
            display: flex;
            justify-content: center;
          }

          h1 {
            font-size: clamp(42px, 13vw, 62px);
            line-height: 0.98;
            letter-spacing: -2.6px;
          }

          .heroText {
            font-size: 16px;
            line-height: 1.72;
          }

          .marketRailHeader,
          .waitlistTop {
            flex-direction: column;
            align-items: flex-start;
          }

          .marketRailHeader b {
            text-align: left;
            max-width: none;
          }

          .waitlistRow {
            grid-template-columns: 1fr;
          }

          .trustLine {
            flex-direction: column;
          }

          .heroRight {
            min-height: 690px;
          }

          .studioCard {
            min-height: 660px;
            border-radius: 32px;
          }

          .metricCard {
            display: none;
          }

          .deviceScene {
            left: 14px;
            right: 14px;
            top: 310px;
          }

          .laptop {
            height: 350px;
            transform: none;
          }

          .laptopLid {
            border-radius: 26px 26px 18px 18px;
            padding: 11px 11px 22px;
          }

          .screenTop {
            height: 48px;
            padding: 0 12px;
          }

          .screenBrand {
            font-size: 12px;
          }

          .screenBody {
            grid-template-columns: 82px 1fr;
          }

          .sidebar {
            padding: 9px 7px;
          }

          .sidebar button {
            min-height: 29px;
            font-size: 0;
          }

          .sidebar button::after {
            content: "";
            display: block;
            width: 70%;
            height: 7px;
            border-radius: 999px;
            background: currentColor;
            margin: auto;
            opacity: 0.72;
          }

          .sideNote {
            display: none;
          }

          .mainDash {
            padding: 9px;
          }

          .dashHeader h3 {
            font-size: 15px;
          }

          .dashHeader span {
            font-size: 9px;
          }

          .dashStats {
            grid-template-columns: 1fr;
          }

          .dashStats .dashStat:nth-child(n + 2) {
            display: none;
          }

          .dashStat {
            min-height: 62px;
          }

          .dashLower {
            grid-template-columns: 1fr;
          }

          .chartPanel {
            height: 124px;
          }

          .activityPanel {
            display: none;
          }

          .phone {
            width: 132px;
            height: 270px;
            right: -4px;
            bottom: -30px;
            border-radius: 32px;
          }

          .phoneScreen {
            border-radius: 24px;
            padding: 23px 8px 9px;
          }

          .phoneGreeting {
            display: none;
          }

          .phoneTabs {
            grid-template-columns: 1fr 1fr;
            gap: 5px;
          }

          .phoneCards {
            grid-template-columns: 1fr;
          }

          .phoneCards .phoneCard:nth-child(n + 3) {
            display: none;
          }

          .phoneAi {
            font-size: 9px;
          }

          .gorkiBubble {
            width: calc(100% - 48px);
            left: 24px;
            right: 24px;
            bottom: 130px;
          }

          .couponFloat {
            width: 132px;
            right: 24px;
            bottom: 20px;
            min-height: 96px;
          }

          .couponFloat b {
            font-size: 34px;
          }
        }

        @media (max-width: 460px) {
          .takipioV7 {
            padding: 16px 12px 92px;
          }

          .brand {
            width: 156px;
          }

          .brand img {
            width: 130px;
          }

          .statusPill {
            font-size: 11px;
            line-height: 1.25;
            white-space: normal;
          }

          h1 {
            font-size: 42px;
          }

          .marketRail,
          .waitlist {
            padding: 16px;
            border-radius: 24px;
          }

          .marketLogoCard {
            min-height: 68px;
          }

          .marketLogoCard img {
            max-width: 112px;
            max-height: 34px;
          }

          .heroRight {
            min-height: 640px;
          }

          .studioCard {
            min-height: 620px;
          }

          .deviceScene {
            top: 282px;
          }

          .laptop {
            height: 316px;
          }

          .phone {
            scale: 0.9;
            right: -18px;
            bottom: -32px;
          }

          .gorkiBubble {
            bottom: 118px;
          }

          .couponFloat {
            right: 16px;
          }
        }
      `}</style>
    </main>
  );
}

function DashboardDevice({
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
    <div className="deviceScene">
      <div className="laptop">
        <div className="laptopLid">
          <div className="screen">
            <div className="screenTop">
              <div className="screenBrand">
                <img src="/takipio-logo.png" alt="" />
                takipio
              </div>
              <div className="screenDots">
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="screenBody">
              <aside className="sidebar">
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

                <div className="sideNote">
                  <b>Gorki AI</b>
                  <span>Bugünkü işler ve pazaryeri akışın özetleniyor.</span>
                </div>
              </aside>

              <div className="mainDash">
                <div className="dashHeader">
                  <div>
                    <h3>{active.label}</h3>
                    <span>Canlı demo modu</span>
                  </div>
                </div>

                <div className="dashStats">
                  <div className="dashStat">
                    <small>{active.helper}</small>
                    <b>{active.value}</b>
                    <em>+%18,6</em>
                  </div>
                  <div className="dashStat">
                    <small>Aktif işlem</small>
                    <b>{activeTab === "orders" ? "24" : activeTab === "marketplaces" ? "4" : "12"}</b>
                    <em>Bugün</em>
                  </div>
                  <div className="dashStat">
                    <small>Müşteri</small>
                    <b>89</b>
                    <em>+%5,7</em>
                  </div>
                  <div className="dashStat">
                    <small>Durum</small>
                    <b>{activeTab === "gorki" ? "Özetlendi" : "Güncel"}</b>
                    <em>Aktif</em>
                  </div>
                </div>

                <div className="dashLower">
                  <div className="chartPanel">
                    <svg viewBox="0 0 520 190" preserveAspectRatio="none" aria-hidden="true">
                      <defs>
                        <linearGradient id="lineV7" x1="0" x2="1" y1="0" y2="0">
                          <stop offset="0%" stopColor="#0b63ff" />
                          <stop offset="100%" stopColor="#49d9ff" />
                        </linearGradient>
                        <linearGradient id="fillV7" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="rgba(11,99,255,.32)" />
                          <stop offset="100%" stopColor="rgba(11,99,255,0)" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0 160 C42 126 68 118 106 128 C150 140 165 62 212 84 C252 103 264 42 313 61 C362 84 376 25 422 40 C464 54 476 18 520 32 L520 190 L0 190 Z"
                        fill="url(#fillV7)"
                      />
                      <path
                        d="M0 160 C42 126 68 118 106 128 C150 140 165 62 212 84 C252 103 264 42 313 61 C362 84 376 25 422 40 C464 54 476 18 520 32"
                        fill="none"
                        stroke="url(#lineV7)"
                        strokeWidth="7"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <div className="activityPanel">
                    <h4>Canlı akış</h4>
                    {activityRows.map((row) => (
                      <div className="activityRow" key={`${row.source}-${row.price}`}>
                        <span>{row.source} · {row.status}</span>
                        <b>{row.price}</b>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="laptopBase" />

        <PhoneDevice activeTab={activeTab} setActiveTab={setActiveTab} message={message} />
      </div>
    </div>
  );
}

function PhoneDevice({
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
    <div className="phone">
      <div className="phoneScreen">
        <div className="phoneTop">
          <span>
            <img src="/takipio-logo.png" alt="" />
            takipio
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

        <div className="phoneAi">“{message}”</div>
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
