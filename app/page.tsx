"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type DemoTab = "overview" | "orders" | "marketplaces" | "gorki";

type Marketplace = {
  name: string;
  logo: string;
  accent: string;
  label: string;
};

const demoTabs: { key: DemoTab; label: string; value: string; helper: string }[] = [
  { key: "overview", label: "Genel Bakış", value: "₺125.250", helper: "Haftalık ciro" },
  { key: "orders", label: "Siparişler", value: "128", helper: "Aktif sipariş" },
  { key: "marketplaces", label: "Pazaryerleri", value: "4 kanal", helper: "Hazırlanan bağlantı" },
  { key: "gorki", label: "Gorki AI", value: "3 özet", helper: "Bugünkü öneriler" },
];

const marketplaces: Marketplace[] = [
  { name: "Trendyol", logo: "/trendyol.png", accent: "#f27a1a", label: "Sipariş" },
  { name: "Amazon", logo: "/amazon.png", accent: "#ffb000", label: "Satış" },
  { name: "Hepsiburada", logo: "/hepsiburada.png", accent: "#ff6000", label: "Stok" },
  { name: "Çiçeksepeti", logo: "/ciceksepeti.png", accent: "#35b86b", label: "Mağaza" },
];

const gorkiMessages = [
  "Bugünkü sipariş ve ödeme akışını senin için özetledim.",
  "Pazaryeri verilerini tek ekranda takip etmeye hazırlanıyoruz.",
  "Stokta azalan ürünleri ve açık işleri senin için işaretledim.",
  "Haftalık gelir hareketinde yükseliş sinyali var.",
];

export default function Page() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<DemoTab>("overview");
  const [messageIndex, setMessageIndex] = useState(0);
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    const readyTimer = window.setTimeout(() => setPageReady(true), 80);

    const tabTimer = window.setInterval(() => {
      setActiveTab((current) => {
        const index = demoTabs.findIndex((tab) => tab.key === current);
        return demoTabs[(index + 1) % demoTabs.length].key;
      });
    }, 4200);

    const messageTimer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % gorkiMessages.length);
    }, 3600);

    return () => {
      window.clearTimeout(readyTimer);
      window.clearInterval(tabTimer);
      window.clearInterval(messageTimer);
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
        source: "landing",
        coupon_code: "TAKIPIO10",
      },
    ]);

    if (error) {
      setLoading(false);

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

    setLoading(false);
    setSaved(true);
    setEmail("");
    window.setTimeout(() => setSaved(false), 3600);
  }

  return (
    <main
      className="takipioV5"
      style={{
        opacity: pageReady ? 1 : 0,
        visibility: pageReady ? "visible" : "hidden",
        transition: "opacity 180ms ease",
      }}
    >
      <div className="v5BgOrb orbA" />
      <div className="v5BgOrb orbB" />
      <div className="v5Grid" />

      <header className="v5Header">
        <a className="v5Brand" href="#top" aria-label="Takipio ana sayfa">
          <img src="/takipio-logo.png" alt="Takipio" />
        </a>

        <nav className="v5Nav">
          <a href="#product">Ürün</a>
          <a href="#integrations">Entegrasyon</a>
          <a href="#gorki">Gorki AI</a>
          <a href="#pricing">Fiyat</a>
        </nav>

        <a className="v5HeaderCta" href="#waitlist">
          Erken erişim
          <ArrowIcon />
        </a>
      </header>

      <nav className="v5MobileNav" aria-label="Mobil menü">
        <a href="#top">Ana Sayfa</a>
        <a href="#product">Ürün</a>
        <a href="#integrations">Pazaryeri</a>
        <a href="#waitlist">Kayıt</a>
      </nav>

      <section className="v5Hero" id="top">
        <div className="v5HeroCopy">
          <div className="v5StatusPill">
            <span /> Takipio erken erişim açıldı
          </div>

          <h1>
            İşletme takibini
            <br />
            <mark>tek panelde</mark> sadeleştir.
          </h1>

          <p className="v5HeroText">
            Sipariş, müşteri, stok, ödeme ve pazaryeri akışlarını Takipio’da topla.
            Gorki AI günlük işlerini senin için özetlesin.
          </p>

          <form className="v5Waitlist" id="waitlist" onSubmit={handleSubmit}>
            <div className="v5WaitlistTop">
              <div>
                <span>Erken erişim</span>
                <b>Açılışa özel TAKIPIO10 kodunu kaçırma.</b>
              </div>
              <em>İlk ay ₺89</em>
            </div>

            <div className="v5FormRow">
              <input
                type="email"
                placeholder="E-posta adresiniz"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? "Kaydediliyor" : saved ? "Kaydedildi ✓" : "Erken erişime katıl"}
                {!loading && !saved && <ArrowIcon />}
              </button>
            </div>

            {errorMessage && <div className="v5FormMessage error">{errorMessage}</div>}
            {saved && <div className="v5FormMessage success">Kaydın alındı. Hoş geldin maili gönderildi.</div>}
          </form>

          <div className="v5MarketplaceStrip" id="integrations">
            <div className="v5StripHeader">
              <span>Pazaryeri entegrasyonları hazırlanıyor</span>
              <b>Satış kanallarını tek merkeze bağla.</b>
            </div>

            <div className="v5LogoStrip">
              {marketplaces.map((market) => (
                <div
                  className="v5LogoPill"
                  key={market.name}
                  style={{ "--accent": market.accent } as React.CSSProperties}
                >
                  <img src={market.logo} alt={market.name} />
                  <small>{market.label}</small>
                </div>
              ))}
            </div>

            <div className="v5FlowLine">
              <div>
                <small>01</small>
                <b>Pazaryeri</b>
              </div>
              <span />
              <div className="active">
                <small>02</small>
                <b>Takipio</b>
              </div>
              <span />
              <div>
                <small>03</small>
                <b>Gorki AI</b>
              </div>
            </div>
          </div>

          <div className="v5TrustBar">
            <div>
              <b>15</b>
              <span>müşteriye kadar ücretsiz</span>
            </div>
            <div>
              <b>Gorki</b>
              <span>AI özetleri dahil</span>
            </div>
            <div>
              <b>7/24</b>
              <span>web panel erişimi</span>
            </div>
          </div>
        </div>

        <div className="v5HeroVisual" id="product">
          <FloatingMetric className="metricOrders" icon={<OrdersIcon />} title="Siparişler" value="128" helper="Kontrol altında" />
          <FloatingMetric className="metricRevenue" icon={<WalletIcon />} title="Bugünkü gelir" value="₺12.450" helper="+%12,6" />

          <div className="v5Scene">
            <DashboardMockup activeTab={activeTab} setActiveTab={setActiveTab} />
            <PhoneMockup activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          <aside className="v5RightRail">
            <PriceCard />
            <GorkiCard message={gorkiMessages[messageIndex]} />
          </aside>
        </div>
      </section>

      <section className="v5ValueGrid">
        <ValueCard icon={<PanelIcon />} title="Tek panel" text="Sipariş, müşteri, stok ve ödeme akışını tek yerden yönet." />
        <ValueCard icon={<LinkIcon />} title="Pazaryeri altyapısı" text="Trendyol, Amazon, Hepsiburada ve Çiçeksepeti için hazırlanan akış." />
        <ValueCard icon={<RobotIcon />} title="Gorki AI" text="Günlük durumunu, açık işlerini ve önemli uyarıları özetler." />
      </section>

      <footer className="v5Footer">
        <a href="https://instagram.com/takipiocom" target="_blank" rel="noreferrer">
          <InstagramIcon /> @takipiocom
        </a>
        <span>Takipio © 2026 — İşletme takip asistanı</span>
      </footer>

      <style jsx global>{`
        :root {
          --ink: #06101f;
          --muted: #667085;
          --blue: #0b63ff;
          --blue2: #00a8ff;
          --cyan: #52d8ff;
          --green: #12b76a;
          --line: rgba(11, 99, 255, 0.13);
          --shadow: 0 28px 80px rgba(7, 20, 47, 0.12);
        }

        * { box-sizing: border-box; }

        html {
          scroll-behavior: smooth;
          overflow-x: hidden;
          background: #f7fbff;
        }

        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          color: var(--ink);
          background: #f7fbff;
          font-family: Inter, Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        a { color: inherit; text-decoration: none; }
        button, input { font: inherit; }
        button { cursor: pointer; }
        svg { fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }

        #top, #product, #integrations, #gorki, #pricing, #waitlist { scroll-margin-top: 110px; }

        .takipioV5 {
          min-height: 100svh;
          position: relative;
          overflow: hidden;
          padding: 26px 30px 42px;
          background:
            radial-gradient(circle at 16% 10%, rgba(11, 99, 255, 0.08), transparent 30%),
            radial-gradient(circle at 86% 8%, rgba(82, 216, 255, 0.16), transparent 32%),
            linear-gradient(180deg, #ffffff 0%, #f4f9ff 56%, #ffffff 100%);
        }

        .v5BgOrb {
          position: absolute;
          pointer-events: none;
          border-radius: 999px;
          filter: blur(52px);
          opacity: 0.75;
        }

        .orbA { width: 460px; height: 460px; left: -160px; top: 140px; background: rgba(11, 99, 255, 0.09); }
        .orbB { width: 520px; height: 520px; right: -170px; top: 120px; background: rgba(82, 216, 255, 0.16); }

        .v5Grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.22;
          background-image:
            linear-gradient(rgba(11, 99, 255, 0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(11, 99, 255, 0.055) 1px, transparent 1px);
          background-size: 92px 92px;
          mask-image: radial-gradient(circle at 55% 34%, black 0%, transparent 72%);
        }

        .v5Header {
          width: min(1460px, 100%);
          min-height: 76px;
          margin: 0 auto;
          padding: 10px 12px;
          position: sticky;
          top: 18px;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid rgba(11, 99, 255, 0.1);
          box-shadow: 0 16px 36px rgba(7, 20, 47, 0.07);
          backdrop-filter: blur(18px);
        }

        .v5Brand {
          width: 178px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 22px;
          background: #06101f;
          border: 1px solid rgba(255,255,255,.14);
          box-shadow: 0 18px 38px rgba(6,16,31,.18), inset 0 0 22px rgba(11,99,255,.11);
        }

        .v5Brand img { width: 144px; height: 40px; object-fit: contain; filter: drop-shadow(0 0 12px rgba(11,99,255,.26)); }

        .v5Nav {
          display: flex;
          align-items: center;
          gap: 30px;
          color: #344054;
          font-size: 15px;
          font-weight: 800;
        }

        .v5Nav a { transition: .2s ease; }
        .v5Nav a:hover { color: var(--blue); transform: translateY(-1px); }

        .v5HeaderCta {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          min-height: 50px;
          padding: 0 18px;
          border-radius: 999px;
          color: white;
          font-weight: 900;
          background: linear-gradient(135deg, var(--blue), var(--blue2));
          box-shadow: 0 18px 34px rgba(11,99,255,.24);
        }

        .v5HeaderCta svg { width: 16px; height: 16px; }

        .v5MobileNav { display: none; }

        .v5Hero {
          width: min(1460px, 100%);
          margin: 0 auto;
          padding: 88px 0 40px;
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: minmax(450px, 0.83fr) minmax(760px, 1.2fr);
          gap: 50px;
          align-items: center;
        }

        .v5HeroCopy {
          position: relative;
          z-index: 4;
        }

        .v5StatusPill {
          width: max-content;
          max-width: 100%;
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.86);
          border: 1px solid var(--line);
          color: var(--blue);
          box-shadow: 0 12px 28px rgba(11, 99, 255, 0.08);
          font-size: 13px;
          font-weight: 900;
          letter-spacing: .8px;
          text-transform: uppercase;
          margin-bottom: 24px;
        }

        .v5StatusPill span {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--green);
          box-shadow: 0 0 0 6px rgba(18,183,106,.14);
        }

        .v5Hero h1 {
          margin: 0;
          color: #06101f;
          font-size: clamp(54px, 5.7vw, 90px);
          line-height: .96;
          letter-spacing: -0.065em;
          font-weight: 950;
        }

        .v5Hero h1 mark {
          background: linear-gradient(135deg, #0b63ff 0%, #0a8bff 55%, #52d8ff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 18px 50px rgba(11, 99, 255, 0.16);
        }

        .v5HeroText {
          max-width: 640px;
          margin: 24px 0 0;
          color: #5e6b80;
          font-size: 19px;
          line-height: 1.72;
          letter-spacing: -0.25px;
          font-weight: 560;
        }

        .v5Waitlist {
          width: min(650px, 100%);
          margin-top: 26px;
          padding: 20px;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.86);
          border: 1px solid rgba(11, 99, 255, 0.14);
          box-shadow: var(--shadow);
          backdrop-filter: blur(14px);
        }

        .v5WaitlistTop {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 14px;
        }

        .v5WaitlistTop span {
          display: block;
          color: var(--blue);
          font-size: 12px;
          font-weight: 950;
          letter-spacing: .8px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .v5WaitlistTop b {
          display: block;
          color: #06101f;
          font-size: 17px;
          line-height: 1.24;
          letter-spacing: -0.4px;
        }

        .v5WaitlistTop em {
          flex: 0 0 auto;
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 12px;
          border-radius: 999px;
          color: white;
          background: #06101f;
          font-size: 12px;
          font-style: normal;
          font-weight: 900;
        }

        .v5FormRow {
          display: grid;
          grid-template-columns: 1fr 210px;
          gap: 10px;
        }

        .v5FormRow input {
          height: 60px;
          border: 1px solid rgba(11, 99, 255, 0.16);
          border-radius: 18px;
          outline: none;
          padding: 0 18px;
          color: #06101f;
          background: rgba(247, 251, 255, 0.92);
          font-size: 16px;
          font-weight: 650;
          transition: .2s ease;
        }

        .v5FormRow input:focus {
          background: white;
          border-color: rgba(11, 99, 255, 0.42);
          box-shadow: 0 0 0 5px rgba(11, 99, 255, 0.08);
        }

        .v5FormRow button {
          height: 60px;
          border: 0;
          border-radius: 18px;
          color: white;
          background: linear-gradient(135deg, var(--blue), var(--blue2));
          font-size: 15px;
          font-weight: 950;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 18px 34px rgba(11, 99, 255, 0.24);
          transition: .2s ease;
        }

        .v5FormRow button:hover { transform: translateY(-2px); box-shadow: 0 24px 44px rgba(11, 99, 255, 0.3); }
        .v5FormRow button:disabled { opacity: .72; cursor: wait; transform: none; }
        .v5FormRow button svg { width: 16px; height: 16px; }

        .v5FormMessage {
          margin-top: 12px;
          padding: 12px 14px;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 820;
        }

        .v5FormMessage.error { color: #b42318; background: #fff1f0; border: 1px solid #ffdad6; }
        .v5FormMessage.success { color: #067647; background: #ecfdf3; border: 1px solid #abefc6; }

        .v5MarketplaceStrip {
          width: min(650px, 100%);
          margin-top: 16px;
          padding: 18px;
          border-radius: 28px;
          background: linear-gradient(145deg, rgba(255,255,255,.9), rgba(243,248,255,.86));
          border: 1px solid rgba(11, 99, 255, 0.13);
          box-shadow: 0 18px 44px rgba(7, 20, 47, 0.075);
          backdrop-filter: blur(14px);
        }

        .v5StripHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
        }

        .v5StripHeader span {
          color: var(--blue);
          font-size: 12px;
          font-weight: 950;
          letter-spacing: .8px;
          text-transform: uppercase;
        }

        .v5StripHeader b {
          max-width: 285px;
          color: #06101f;
          font-size: 18px;
          line-height: 1.12;
          text-align: right;
          letter-spacing: -0.5px;
        }

        .v5LogoStrip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .v5LogoPill {
          --accent: #0b63ff;
          min-height: 82px;
          position: relative;
          display: grid;
          place-items: center;
          padding: 12px;
          border-radius: 20px;
          background: #ffffff;
          border: 1px solid rgba(11, 99, 255, 0.09);
          box-shadow: 0 12px 26px rgba(7,20,47,.055);
          overflow: hidden;
        }

        .v5LogoPill::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 4px;
          background: var(--accent);
        }

        .v5LogoPill img {
          max-width: 120px;
          max-height: 38px;
          width: auto;
          height: auto;
          object-fit: contain;
          display: block;
        }

        .v5LogoPill small {
          margin-top: 4px;
          color: #667085;
          font-size: 11px;
          font-weight: 850;
        }

        .v5FlowLine {
          margin-top: 14px;
          display: grid;
          grid-template-columns: 1fr 32px 1fr 32px 1fr;
          align-items: center;
          gap: 8px;
        }

        .v5FlowLine div {
          min-height: 58px;
          border-radius: 17px;
          padding: 10px 12px;
          background: rgba(255,255,255,.66);
          border: 1px solid rgba(11,99,255,.09);
        }

        .v5FlowLine div.active {
          background: linear-gradient(135deg, #06101f, #0b2a64);
          color: white;
          box-shadow: 0 16px 30px rgba(6, 16, 31, 0.14);
        }

        .v5FlowLine small {
          display: block;
          color: var(--blue);
          font-size: 10px;
          font-weight: 950;
          margin-bottom: 5px;
        }

        .v5FlowLine div.active small { color: var(--cyan); }
        .v5FlowLine b { display: block; font-size: 13px; letter-spacing: -.2px; }
        .v5FlowLine > span { height: 2px; border-radius: 999px; background: linear-gradient(90deg, rgba(11,99,255,.22), rgba(11,99,255,.58)); }

        .v5TrustBar {
          width: min(650px, 100%);
          margin-top: 14px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .v5TrustBar div {
          min-height: 78px;
          padding: 14px;
          border-radius: 20px;
          background: rgba(255,255,255,.7);
          border: 1px solid rgba(11,99,255,.1);
          box-shadow: 0 14px 32px rgba(7,20,47,.055);
        }

        .v5TrustBar b { display: block; color: var(--blue); font-size: 20px; line-height: 1; margin-bottom: 7px; }
        .v5TrustBar span { display: block; color: #667085; font-size: 12px; line-height: 1.32; font-weight: 760; }

        .v5HeroVisual {
          min-height: 720px;
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 246px;
          gap: 24px;
          align-items: center;
        }

        .v5Scene {
          min-height: 620px;
          position: relative;
          display: grid;
          place-items: center;
          perspective: 1300px;
        }

        .v5Scene::before {
          content: "";
          position: absolute;
          width: 690px;
          height: 430px;
          border-radius: 999px;
          background: radial-gradient(ellipse, rgba(11,99,255,.12), transparent 62%);
          transform: rotate(-8deg);
        }

        .v5Dashboard {
          width: min(690px, 96%);
          height: 438px;
          position: relative;
          z-index: 3;
          padding: 15px 15px 28px;
          border-radius: 34px 34px 22px 22px;
          background: linear-gradient(135deg, #d7e2ef, #ffffff 48%, #8c99aa);
          box-shadow: 0 42px 100px rgba(7,20,47,.24);
          transform: rotateX(4deg) rotateY(-8deg) rotateZ(-1deg);
        }

        .v5Dashboard::after {
          content: "";
          position: absolute;
          left: 7%;
          right: 7%;
          bottom: -18px;
          height: 26px;
          border-radius: 0 0 36px 36px;
          background: linear-gradient(180deg,#e8eef6,#7d8796);
          box-shadow: 0 18px 30px rgba(7,20,47,.16);
        }

        .v5Screen {
          width: 100%;
          height: 100%;
          overflow: hidden;
          border-radius: 24px;
          background: #041020;
          border: 1px solid rgba(255,255,255,.12);
          box-shadow: inset 0 0 42px rgba(0,168,255,.09);
        }

        .v5ScreenTop {
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          color: white;
          border-bottom: 1px solid rgba(255,255,255,.08);
        }

        .v5ScreenBrand { display: flex; align-items: center; gap: 9px; font-weight: 950; }
        .v5ScreenBrand img { width: 25px; height: 25px; object-fit: contain; }
        .v5Dots { display: flex; gap: 7px; }
        .v5Dots span { width: 8px; height: 8px; border-radius: 999px; background: rgba(255,255,255,.25); }

        .v5ScreenBody {
          height: calc(100% - 58px);
          display: grid;
          grid-template-columns: 160px 1fr;
        }

        .v5SideMenu {
          padding: 16px 12px;
          display: grid;
          align-content: start;
          gap: 10px;
          border-right: 1px solid rgba(255,255,255,.08);
          background: rgba(0,0,0,.12);
        }

        .v5SideMenu button {
          min-height: 36px;
          border: 0;
          border-radius: 12px;
          color: rgba(255,255,255,.68);
          background: rgba(255,255,255,.07);
          font-size: 11px;
          font-weight: 850;
        }

        .v5SideMenu button.active {
          color: white;
          background: linear-gradient(135deg,var(--blue),var(--blue2));
          box-shadow: 0 12px 24px rgba(11,99,255,.22);
        }

        .v5MiniGorki {
          margin-top: 12px;
          padding: 12px;
          border-radius: 16px;
          color: white;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.08);
        }

        .v5MiniGorki b { display: block; font-size: 12px; margin-bottom: 5px; }
        .v5MiniGorki span { display: block; color: rgba(255,255,255,.58); font-size: 10px; line-height: 1.35; }

        .v5DashContent { padding: 16px; color: white; }
        .v5DashHeader { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .v5DashHeader h3 { margin: 0; font-size: 18px; }
        .v5DashHeader span { color: #8fb7ff; font-size: 11px; font-weight: 900; }

        .v5DashCards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px; }
        .v5DashCard { min-height: 82px; padding: 12px; border-radius: 16px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08); }
        .v5DashCard small { display: block; color: #8fb7ff; font-size: 10px; margin-bottom: 8px; }
        .v5DashCard b { display: block; font-size: 18px; letter-spacing: -.4px; }
        .v5DashCard em { display: block; margin-top: 4px; color: var(--green); font-size: 10px; font-style: normal; font-weight: 950; }

        .v5DashLower { display: grid; grid-template-columns: 1.35fr 1fr; gap: 12px; }
        .v5Graph { height: 178px; border-radius: 18px; background: linear-gradient(180deg, rgba(11,99,255,.22), rgba(11,99,255,.03)); border: 1px solid rgba(255,255,255,.08); position: relative; overflow: hidden; }
        .v5Graph::before { content: "Satış Grafiği"; position: absolute; left: 14px; top: 12px; color: white; font-size: 12px; font-weight: 950; z-index: 2; }
        .v5Graph svg { width: 100%; height: 100%; padding-top: 28px; }
        .v5Activity { height: 178px; border-radius: 18px; padding: 12px; background: rgba(255,255,255,.055); border: 1px solid rgba(255,255,255,.08); overflow: hidden; }
        .v5Activity h4 { margin: 0 0 10px; font-size: 12px; }
        .v5Activity div { min-height: 32px; display: flex; align-items: center; justify-content: space-between; padding: 0 9px; border-radius: 11px; margin-bottom: 8px; background: rgba(255,255,255,.055); color: rgba(255,255,255,.72); font-size: 10px; }
        .v5Activity b { color: var(--green); }

        .v5Phone {
          width: 182px;
          height: 360px;
          position: absolute;
          right: 12px;
          bottom: 40px;
          z-index: 6;
          border-radius: 40px;
          padding: 10px;
          background: linear-gradient(135deg,#1c2533,#050b15);
          border: 3px solid #101827;
          box-shadow: 0 30px 60px rgba(7,20,47,.26);
          transform: rotate(3deg);
        }

        .v5PhoneScreen {
          height: 100%;
          border-radius: 30px;
          overflow: hidden;
          background: #041020;
          color: white;
          padding: 15px 10px;
        }

        .v5PhoneHead { display: flex; justify-content: space-between; align-items: center; margin-bottom: 13px; font-size: 12px; font-weight: 950; }
        .v5PhoneHead span { display: flex; align-items: center; gap: 6px; }
        .v5PhoneHead img { width: 20px; height: 20px; object-fit: contain; }
        .v5PhoneGreeting { margin-bottom: 12px; }
        .v5PhoneGreeting b { display: block; font-size: 13px; margin-bottom: 3px; }
        .v5PhoneGreeting span { color: #8fb7ff; font-size: 10px; font-weight: 800; }
        .v5PhoneTabs { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px; }
        .v5PhoneTabs button { height: 27px; border: 0; border-radius: 9px; background: rgba(255,255,255,.07); color: rgba(255,255,255,.62); font-size: 9px; font-weight: 850; }
        .v5PhoneTabs button.active { color: white; background: var(--blue); }
        .v5PhoneGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
        .v5PhoneCard { min-height: 64px; border-radius: 13px; padding: 9px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.08); }
        .v5PhoneCard small { display: block; color: #8fb7ff; font-size: 9px; margin-bottom: 6px; }
        .v5PhoneCard b { display: block; font-size: 14px; }
        .v5PhoneCard em { display: block; margin-top: 4px; color: var(--green); font-style: normal; font-size: 9px; font-weight: 950; }

        .v5RightRail { display: grid; gap: 18px; align-content: center; position: relative; z-index: 8; }

        .v5PriceCard {
          min-height: 292px;
          padding: 22px;
          border-radius: 34px;
          color: white;
          background: radial-gradient(circle at 50% 0%, rgba(73,217,255,.28), transparent 38%), linear-gradient(180deg,#071026 0%,#050914 100%);
          border: 1px solid rgba(255,255,255,.13);
          box-shadow: 0 32px 74px rgba(7,20,47,.26);
          overflow: hidden;
          position: relative;
        }

        .v5PriceLabel { width: max-content; margin: 0 auto 18px; padding: 10px 13px; border-radius: 14px; background: linear-gradient(135deg,var(--blue),var(--blue2)); font-size: 14px; font-weight: 950; box-shadow: 0 14px 25px rgba(11,99,255,.32); }
        .v5PriceCard p { margin: 0; text-align: center; color: rgba(255,255,255,.82); font-size: 14px; font-weight: 950; text-transform: uppercase; }
        .v5PriceNumbers { text-align: center; margin: 6px 0 10px; }
        .v5PriceNumbers del { display: block; color: rgba(255,255,255,.34); font-size: 40px; line-height: 1; font-weight: 950; text-decoration-color: var(--blue); text-decoration-thickness: 5px; }
        .v5PriceNumbers strong { display: block; color: white; font-size: 72px; line-height: .95; text-shadow: 0 0 24px rgba(11,99,255,.85); }
        .v5PriceCard small { display: block; text-align: center; color: rgba(255,255,255,.62); font-size: 13px; font-weight: 760; margin-bottom: 14px; }
        .v5PriceList { display: grid; gap: 8px; margin-bottom: 14px; }
        .v5PriceList span { display: flex; align-items: center; gap: 7px; color: rgba(255,255,255,.76); font-size: 12px; font-weight: 820; }
        .v5PriceList svg { width: 15px; height: 15px; color: var(--cyan); }
        .v5PriceCard a { height: 44px; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 15px; color: white; font-size: 13px; font-weight: 950; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.16); }
        .v5PriceCard a svg { width: 15px; height: 15px; }

        .v5GorkiCard {
          min-height: 292px;
          padding: 18px;
          border-radius: 34px;
          background: rgba(255,255,255,.86);
          border: 1px solid rgba(11,99,255,.14);
          box-shadow: var(--shadow);
          overflow: hidden;
          position: relative;
        }

        .v5GorkiTop { display: flex; align-items: center; gap: 11px; position: relative; z-index: 2; }
        .v5GorkiAvatar { width: 45px; height: 45px; border-radius: 16px; display: grid; place-items: center; background: #050914; box-shadow: 0 16px 28px rgba(7,20,47,.16); }
        .v5GorkiAvatar img { width: 38px; height: 38px; object-fit: contain; }
        .v5GorkiTop b { display: block; font-size: 18px; color: var(--ink); }
        .v5GorkiTop span { display: block; color: var(--muted); font-size: 13px; font-weight: 760; }
        .v5GorkiImage { height: 128px; display: flex; align-items: center; justify-content: center; }
        .v5GorkiImage img { width: 128px; height: 128px; object-fit: contain; filter: drop-shadow(0 16px 18px rgba(7,20,47,.14)); animation: gorkiFloat 5.2s ease-in-out infinite; }
        .v5GorkiBubble { padding: 13px; border-radius: 17px; color: #1d2939; background: #f7fbff; border: 1px solid rgba(11,99,255,.1); font-size: 13px; line-height: 1.45; font-weight: 830; }

        .v5Metric {
          min-width: 186px;
          position: absolute;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 22px;
          background: rgba(255,255,255,.86);
          border: 1px solid rgba(11,99,255,.16);
          box-shadow: 0 24px 42px rgba(7,20,47,.13);
          backdrop-filter: blur(14px);
        }

        .metricOrders { left: 6px; top: 66px; animation: floaty 5.2s ease-in-out infinite; }
        .metricRevenue { right: 278px; top: 56px; animation: floaty 5.8s ease-in-out infinite .3s; }
        .v5Metric svg { width: 28px; height: 28px; color: var(--blue); flex: 0 0 auto; }
        .v5Metric b { display: block; font-size: 15px; color: #06101f; }
        .v5Metric span { display: block; color: var(--muted); font-size: 12px; font-weight: 760; margin-top: 3px; }
        .v5Metric em { display: block; margin-top: 4px; color: var(--green); font-size: 11px; font-style: normal; font-weight: 950; }

        .v5ValueGrid {
          width: min(1460px, 100%);
          margin: 8px auto 0;
          position: relative;
          z-index: 3;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .v5ValueCard {
          min-height: 152px;
          padding: 22px;
          border-radius: 30px;
          background: rgba(255,255,255,.82);
          border: 1px solid rgba(11,99,255,.13);
          box-shadow: 0 20px 44px rgba(7,20,47,.08);
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .v5ValueIcon {
          width: 54px;
          height: 54px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 18px;
          color: white;
          background: linear-gradient(135deg,var(--blue),var(--blue2));
          box-shadow: 0 16px 28px rgba(11,99,255,.22);
        }

        .v5ValueIcon svg { width: 27px; height: 27px; }
        .v5ValueCard h3 { margin: 0 0 8px; font-size: 20px; letter-spacing: -.55px; }
        .v5ValueCard p { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.48; font-weight: 650; }

        .v5Footer {
          width: min(1460px, 100%);
          margin: 18px auto 0;
          position: relative;
          z-index: 3;
          min-height: 84px;
          padding: 0 22px;
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: white;
          border: 1px solid rgba(11,99,255,.12);
          box-shadow: 0 18px 38px rgba(7,20,47,.06);
          color: #475467;
          font-weight: 760;
        }

        .v5Footer a { display: flex; align-items: center; gap: 8px; color: #e1306c; font-weight: 900; }
        .v5Footer svg { width: 20px; height: 20px; }

        @keyframes gorkiFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes floaty { 0%, 100% { translate: 0 0; } 50% { translate: 0 -12px; } }

        @media (max-width: 1380px) {
          .v5Hero { grid-template-columns: 1fr; gap: 26px; }
          .v5HeroCopy { max-width: 900px; }
          .v5HeroVisual { min-height: 700px; }
        }

        @media (max-width: 1040px) {
          .takipioV5 { padding: 18px 16px 92px; }
          .v5Header { position: relative; top: auto; justify-content: center; background: transparent; border: 0; box-shadow: none; padding: 0; }
          .v5Nav, .v5HeaderCta { display: none; }
          .v5MobileNav { position: fixed; left: 12px; right: 12px; bottom: 12px; z-index: 100; height: 58px; display: grid; grid-template-columns: repeat(4,1fr); gap: 7px; padding: 7px; border-radius: 24px; background: rgba(255,255,255,.96); border: 1px solid rgba(11,99,255,.12); box-shadow: 0 16px 34px rgba(15,32,64,.14); }
          .v5MobileNav a { display: flex; align-items: center; justify-content: center; border-radius: 17px; color: #1d2939; background: #f7fbff; border: 1px solid rgba(11,99,255,.08); font-size: 12px; font-weight: 900; }
          .v5MobileNav a:last-child { color: white; background: linear-gradient(135deg,var(--blue),var(--blue2)); }
          .v5Hero { padding-top: 42px; }
          .v5HeroVisual { grid-template-columns: 1fr; min-height: auto; }
          .v5Scene { min-height: 590px; }
          .v5RightRail { grid-template-columns: 1fr 1fr; }
          .metricRevenue { right: 28px; }
          .v5ValueGrid { grid-template-columns: 1fr; }
        }

        @media (max-width: 760px) {
          .v5Hero h1 { font-size: clamp(46px, 12vw, 66px); letter-spacing: -0.055em; }
          .v5HeroText { font-size: 16px; line-height: 1.68; }
          .v5Waitlist, .v5MarketplaceStrip, .v5TrustBar { width: 100%; }
          .v5WaitlistTop, .v5StripHeader { flex-direction: column; }
          .v5StripHeader b { text-align: left; max-width: none; }
          .v5FormRow { grid-template-columns: 1fr; }
          .v5LogoStrip { grid-template-columns: repeat(2, 1fr); }
          .v5FlowLine { grid-template-columns: 1fr; }
          .v5FlowLine > span { height: 18px; width: 2px; justify-self: center; }
          .v5TrustBar { grid-template-columns: 1fr; }
          .v5Scene { min-height: 500px; }
          .v5Dashboard { width: 100%; height: 320px; padding: 10px 10px 22px; border-radius: 26px 26px 18px 18px; transform: none; }
          .v5ScreenTop { height: 46px; padding: 0 12px; }
          .v5ScreenBody { height: calc(100% - 46px); grid-template-columns: 92px 1fr; }
          .v5SideMenu { padding: 10px 7px; gap: 7px; }
          .v5SideMenu button { min-height: 27px; font-size: 0; }
          .v5SideMenu button::after { content: ""; display: block; width: 70%; height: 7px; border-radius: 999px; background: currentColor; opacity: .65; margin: auto; }
          .v5MiniGorki { display: none; }
          .v5DashContent { padding: 10px; }
          .v5DashCards { grid-template-columns: 1fr; }
          .v5DashCards .v5DashCard:nth-child(n+2) { display: none; }
          .v5DashLower { grid-template-columns: 1fr; }
          .v5Graph { height: 112px; }
          .v5Activity { display: none; }
          .v5Phone { width: 128px; height: 252px; right: -4px; bottom: 4px; padding: 8px; border-radius: 29px; }
          .v5PhoneScreen { border-radius: 21px; padding: 10px 8px; }
          .v5PhoneGreeting, .v5PhoneTabs { display: none; }
          .v5PhoneGrid { grid-template-columns: 1fr; }
          .v5PhoneGrid .v5PhoneCard:nth-child(n+3) { display: none; }
          .v5Metric { display: none; }
          .v5RightRail { grid-template-columns: 1fr; }
          .v5ValueCard { align-items: flex-start; }
          .v5Footer { flex-direction: column; justify-content: center; text-align: center; padding: 18px; }
        }

        @media (max-width: 460px) {
          .takipioV5 { padding: 16px 12px 92px; }
          .v5Brand { width: 164px; height: 52px; }
          .v5Brand img { width: 134px; }
          .v5Hero h1 { font-size: 44px; }
          .v5Waitlist, .v5MarketplaceStrip { padding: 16px; border-radius: 24px; }
          .v5LogoPill { min-height: 74px; }
          .v5LogoPill img { max-width: 108px; max-height: 34px; }
          .v5Scene { min-height: 450px; }
          .v5Dashboard { height: 285px; }
          .v5Phone { scale: .88; right: -20px; bottom: -8px; }
          .v5PriceNumbers strong { font-size: 62px; }
          .v5PriceNumbers del { font-size: 34px; }
        }
      `}</style>
    </main>
  );
}

function DashboardMockup({ activeTab, setActiveTab }: { activeTab: DemoTab; setActiveTab: (tab: DemoTab) => void }) {
  const active = useMemo(() => demoTabs.find((item) => item.key === activeTab) ?? demoTabs[0], [activeTab]);

  return (
    <div className="v5Dashboard">
      <div className="v5Screen">
        <div className="v5ScreenTop">
          <div className="v5ScreenBrand">
            <img src="/takipio-logo.png" alt="" /> takipio
          </div>
          <div className="v5Dots"><span /><span /><span /></div>
        </div>

        <div className="v5ScreenBody">
          <div className="v5SideMenu">
            {demoTabs.map((tab) => (
              <button key={tab.key} type="button" className={activeTab === tab.key ? "active" : ""} onClick={() => setActiveTab(tab.key)}>
                {tab.label}
              </button>
            ))}
            <div className="v5MiniGorki">
              <b>Gorki AI</b>
              <span>Bugünkü işleri ve pazaryeri akışını özetliyorum.</span>
            </div>
          </div>

          <div className="v5DashContent">
            <div className="v5DashHeader">
              <h3>{active.label}</h3>
              <span>Canlı demo modu</span>
            </div>

            <div className="v5DashCards">
              <div className="v5DashCard"><small>{active.helper}</small><b>{active.value}</b><em>+%18,6</em></div>
              <div className="v5DashCard"><small>Aktif işlem</small><b>{activeTab === "orders" ? "24" : "8"}</b><em>Bugün</em></div>
              <div className="v5DashCard"><small>Müşteri</small><b>89</b><em>+%5,7</em></div>
              <div className="v5DashCard"><small>Durum</small><b>{activeTab === "marketplaces" ? "Hazır" : "Güncel"}</b><em>Aktif</em></div>
            </div>

            <div className="v5DashLower">
              <div className="v5Graph">
                <svg viewBox="0 0 520 170" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M0 138 C40 110 65 98 105 110 C150 126 160 58 210 78 C250 94 260 45 310 62 C360 82 374 28 420 42 C460 54 470 18 520 28" fill="none" stroke="#0b63ff" strokeWidth="7" strokeLinecap="round" />
                </svg>
              </div>
              <div className="v5Activity">
                <h4>Akış</h4>
                <div><span>Yeni sipariş</span><b>2 dk</b></div>
                <div><span>Ödeme alındı</span><b>15 dk</b></div>
                <div><span>Stok güncellendi</span><b>1 sa</b></div>
                <div><span>Gorki özeti</span><b>Hazır</b></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneMockup({ activeTab, setActiveTab }: { activeTab: DemoTab; setActiveTab: (tab: DemoTab) => void }) {
  const active = useMemo(() => demoTabs.find((item) => item.key === activeTab) ?? demoTabs[0], [activeTab]);

  return (
    <div className="v5Phone">
      <div className="v5PhoneScreen">
        <div className="v5PhoneHead"><span><img src="/takipio-logo.png" alt="" /> takipio</span><b>9:41</b></div>
        <div className="v5PhoneGreeting"><b>Merhaba, Ahmet 👋</b><span>Bugün nasıl gidiyor?</span></div>
        <div className="v5PhoneTabs">
          {demoTabs.map((tab) => <button key={tab.key} type="button" className={activeTab === tab.key ? "active" : ""} onClick={() => setActiveTab(tab.key)}>{tab.label.split(" ")[0]}</button>)}
        </div>
        <div className="v5PhoneGrid">
          <div className="v5PhoneCard"><small>{active.label}</small><b>{active.value}</b><em>+%18,6</em></div>
          <div className="v5PhoneCard"><small>Sipariş</small><b>128</b><em>+%8,2</em></div>
          <div className="v5PhoneCard"><small>Müşteri</small><b>89</b><em>+%5,7</em></div>
          <div className="v5PhoneCard"><small>Stok</small><b>Güncel</b><em>128 ürün</em></div>
        </div>
      </div>
    </div>
  );
}

function FloatingMetric({ icon, title, value, helper, className }: { icon: React.ReactNode; title: string; value: string; helper: string; className: string }) {
  return <div className={`v5Metric ${className}`}>{icon}<div><b>{title}</b><span>{helper}</span><em>{value}</em></div></div>;
}

function PriceCard() {
  return (
    <div className="v5PriceCard" id="pricing">
      <div className="v5PriceLabel">AÇILIŞA ÖZEL</div>
      <p>İlk ay sadece</p>
      <div className="v5PriceNumbers"><del>₺99</del><strong>₺89</strong></div>
      <small>Sonrasında ₺99 / ay</small>
      <div className="v5PriceList">
        <span><CheckIcon /> Tüm özelliklere erişim</span>
        <span><CheckIcon /> Gorki AI asistan dahil</span>
        <span><CheckIcon /> Pazaryeri altyapısı</span>
      </div>
      <a href="#waitlist">Erken erişime katıl <ArrowIcon /></a>
    </div>
  );
}

function GorkiCard({ message }: { message: string }) {
  return (
    <div className="v5GorkiCard" id="gorki">
      <div className="v5GorkiTop">
        <div className="v5GorkiAvatar"><img src="/gorki-hero.png" alt="" /></div>
        <div><b>Gorki AI</b><span>Akıllı asistanın</span></div>
      </div>
      <div className="v5GorkiImage"><img src="/gorki-hero.png" alt="Gorki AI" /></div>
      <div className="v5GorkiBubble">“{message}”</div>
    </div>
  );
}

function ValueCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <article className="v5ValueCard"><div className="v5ValueIcon">{icon}</div><div><h3>{title}</h3><p>{text}</p></div></article>;
}

function CheckIcon() { return <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>; }
function ArrowIcon() { return <svg viewBox="0 0 24 24"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>; }
function OrdersIcon() { return <svg viewBox="0 0 24 24"><path d="M6 2h12l3 5v15H3V7l3-5z" /><path d="M3 7h18" /><path d="M8 12h8" /><path d="M8 16h5" /></svg>; }
function WalletIcon() { return <svg viewBox="0 0 24 24"><path d="M3 7h18v12H3z" /><path d="M16 12h5v4h-5a2 2 0 0 1 0-4z" /><path d="M3 7l3-4h12l3 4" /></svg>; }
function PanelIcon() { return <svg viewBox="0 0 24 24"><path d="M4 5h7v6H4z" /><path d="M13 5h7v14h-7z" /><path d="M4 13h7v6H4z" /></svg>; }
function LinkIcon() { return <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1.2 1.2" /><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1.2-1.2" /></svg>; }
function RobotIcon() { return <svg viewBox="0 0 24 24"><rect x="5" y="8" width="14" height="10" rx="4" /><path d="M12 3v5" /><circle cx="9.2" cy="12.2" r="1" fill="currentColor" /><circle cx="14.8" cy="12.2" r="1" fill="currentColor" /><path d="M10 15c.6.5 1.2.8 2 .8s1.4-.3 2-.8" /></svg>; }
function InstagramIcon() { return <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r="1" /></svg>; }
