"use client";

import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Page() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
    <main className="takipioPage">
      <div className="pageGrid" />
      <div className="noiseLayer" />
      <div className="halo haloOne" />
      <div className="halo haloTwo" />
      <div className="halo haloThree" />

      <header className="navBar">
        <a className="brand" href="#top" aria-label="Takipio">
          <img src="/takipio-logo.png" alt="Takipio" />
        </a>

        <nav className="navLinks">
          <a href="#features">Özellikler</a>
          <a href="#showcase">Arayüz</a>
          <a href="#pricing">Fiyat</a>
          <a href="#waitlist" className="navButton">Erken Erişim</a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="heroCopy">
          <div className="launchBadge">
            <span className="pulseDot" />
            ÇOK YAKINDA YAYINDA
          </div>

          <h1>
            İşletmeni tek panelden yönet, <span>kontrolü kaybetme.</span>
          </h1>

          <p className="heroText">
            Takipio; sipariş, müşteri, stok, ödeme ve günlük iş akışını sade ama güçlü bir panelde toplayan yeni nesil işletme asistanıdır.
          </p>

          <form className="waitlistCard" id="waitlist" onSubmit={handleSubmit}>
            <div className="formHeader">
              <div className="mailOrb"><MailIcon /></div>
              <div>
                <h2>Erken erişim listesine katıl</h2>
                <p>Açılışta özel <b>TAKIPIO10</b> indirim kodunu ilk alanlardan ol.</p>
              </div>
            </div>

            <div className="formRow">
              <input
                type="email"
                placeholder="E-posta adresiniz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit">
                {loading ? "Kaydediliyor..." : saved ? "Kaydedildi ✓" : "Kayıt Ol"}
              </button>
            </div>

            {errorMessage && <div className="message error">{errorMessage}</div>}
            {saved && <div className="message success">Kaydın alındı. Açılışta haber vereceğiz.</div>}

            <div className="formHint">
              <GiftIcon />
              İlk ay indirim + erken kullanıcı avantajı
            </div>
          </form>

          <div className="miniStats">
            <div><strong>15</strong><span>müşteriye kadar ücretsiz</span></div>
            <div><strong>7/24</strong><span>erişim ve takip</span></div>
            <div><strong>Gorki</strong><span>akıllı asistan</span></div>
          </div>
        </div>

        <div className="heroVisual" id="showcase">
          <div className="swingTag" id="pricing">
            <div className="tagString" />
            <div className="tagBody">
              <b>AÇILIŞA ÖZEL</b>
              <span>İlk Ay</span>
              <del>₺99</del>
              <strong>₺89</strong>
            </div>
          </div>

          <div className="mockupStage">
            <LaptopMockup />
            <PhoneMockup />
            <div className="floatingPanel panelOrders">
              <OrdersIcon />
              <div><b>Siparişler</b><span>Kontrol altında</span></div>
            </div>
            <div className="floatingPanel panelStock">
              <CubeIcon />
              <div><b>Stok</b><span>Güncel</span></div>
            </div>
            <div className="floatingPanel panelIncome">
              <WalletIcon />
              <div><b>₺12.450</b><span>Bugünkü ciro</span></div>
            </div>
          </div>

          <div className="gorkiArea">
            <img src="/gorki-hero.png" alt="Gorki" />
            <div className="gorkiBubble">
              <HeartIcon />
              Gorki her zaman yanında.
            </div>
          </div>
        </div>
      </section>

      <section className="featureGrid" id="features">
        <FeatureCard icon={<UsersIcon />} title="Müşterilerini yönet" text="Müşteri kayıtları, notlar ve geçmiş işlemler tek yerde dursun." />
        <FeatureCard icon={<OrdersIcon />} title="Siparişlerini takip et" text="Bekleyen, hazırlanan ve tamamlanan işleri net şekilde gör." />
        <FeatureCard icon={<CubeIcon />} title="Stok kontrolü" text="Ürün durumlarını, kritik seviyeleri ve hareketleri takip et." />
        <FeatureCard icon={<WalletIcon />} title="Ödeme takibi" text="Alınan, bekleyen ve geciken ödemeleri hızlıca ayır." />
      </section>

      <section className="bottomSection">
        <div className="domainCard">
          <GlobeIcon />
          <div>
            <h3>TAKIPIO.COM</h3>
            <p>Her yerden eriş, işini kontrol et.</p>
          </div>
        </div>

        <div className="trustCards">
          <div><ShieldIcon /><span>Güvenli altyapı</span></div>
          <div><BoltIcon /><span>Hızlı kurulum</span></div>
          <div><HeadsetIcon /><span>Destek hazır</span></div>
        </div>
      </section>

      <style jsx global>{`
        :root {
          --blue: #0b63ff;
          --blue2: #00a8ff;
          --cyan: #34d5ff;
          --dark: #050914;
          --text: #050914;
          --muted: #667085;
          --soft: #f2f7ff;
          --line: rgba(11, 99, 255, 0.18);
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html {
          scroll-behavior: smooth;
          background: #ffffff;
        }

        body {
          min-height: 100vh;
          background: #ffffff;
          color: var(--text);
          overflow-x: hidden;
          font-family: Inter, Arial, Helvetica, sans-serif;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        button,
        input {
          font-family: inherit;
        }

        .takipioPage {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          padding: 28px 34px 38px;
          background:
            radial-gradient(circle at 18% 18%, rgba(11, 99, 255, 0.08), transparent 28%),
            radial-gradient(circle at 80% 28%, rgba(0, 168, 255, 0.12), transparent 26%),
            radial-gradient(circle at 62% 76%, rgba(11, 99, 255, 0.08), transparent 28%),
            linear-gradient(180deg, #ffffff 0%, #f7fbff 58%, #ffffff 100%);
        }

        .pageGrid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.35;
          background-image:
            linear-gradient(rgba(11, 99, 255, 0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(11, 99, 255, 0.055) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: radial-gradient(circle at 50% 35%, #000 0%, transparent 74%);
        }

        .noiseLayer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.16;
          background-image: radial-gradient(circle, rgba(11, 99, 255, 0.7) 0 1px, transparent 1.4px);
          background-size: 86px 86px;
        }

        .halo {
          position: absolute;
          pointer-events: none;
          border-radius: 999px;
          filter: blur(18px);
          opacity: 0.65;
        }

        .haloOne {
          width: 390px;
          height: 390px;
          left: 110px;
          top: 110px;
          background: rgba(11, 99, 255, 0.06);
        }

        .haloTwo {
          width: 380px;
          height: 380px;
          right: 90px;
          top: 140px;
          background: rgba(0, 168, 255, 0.09);
        }

        .haloThree {
          width: 310px;
          height: 310px;
          right: 32%;
          bottom: 10px;
          background: rgba(11, 99, 255, 0.055);
        }

        .navBar {
          max-width: 1480px;
          height: 72px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 20;
        }

        .brand {
          width: 205px;
          height: 70px;
          display: flex;
          align-items: center;
        }

        .brand img {
          width: 200px;
          max-height: 70px;
          object-fit: contain;
          object-position: left center;
          filter: drop-shadow(0 12px 22px rgba(11, 99, 255, 0.18));
        }

        .navLinks {
          display: flex;
          align-items: center;
          gap: 31px;
          font-size: 15px;
          font-weight: 850;
          color: #1d2939;
        }

        .navLinks a {
          transition: 0.25s ease;
        }

        .navLinks a:hover {
          color: var(--blue);
          transform: translateY(-1px);
        }

        .navButton {
          padding: 13px 18px;
          border-radius: 999px;
          color: white !important;
          background: linear-gradient(135deg, var(--blue), var(--blue2));
          box-shadow: 0 16px 28px rgba(11, 99, 255, 0.22);
        }

        .hero {
          max-width: 1480px;
          min-height: 760px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(480px, 0.95fr) minmax(680px, 1.25fr);
          gap: 42px;
          align-items: center;
          position: relative;
          z-index: 4;
        }

        .heroCopy {
          position: relative;
          z-index: 8;
          padding-top: 12px;
        }

        .launchBadge {
          width: max-content;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 11px 17px;
          border-radius: 999px;
          border: 1px solid rgba(11, 99, 255, 0.18);
          background: rgba(255, 255, 255, 0.72);
          box-shadow: 0 14px 30px rgba(11, 99, 255, 0.08);
          color: var(--blue);
          font-size: 14px;
          font-weight: 950;
          letter-spacing: 0.9px;
          backdrop-filter: blur(12px);
          margin-bottom: 26px;
        }

        .pulseDot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55);
          animation: dotPulse 1.8s ease-in-out infinite;
        }

        h1 {
          max-width: 720px;
          color: #050914;
          font-size: clamp(54px, 5.1vw, 88px);
          line-height: 0.97;
          letter-spacing: -4.8px;
          font-weight: 950;
          margin-bottom: 22px;
        }

        h1 span {
          display: block;
          color: var(--blue);
          text-shadow: 0 12px 30px rgba(11, 99, 255, 0.16);
        }

        .heroText {
          max-width: 650px;
          color: var(--muted);
          font-size: 21px;
          line-height: 1.58;
          letter-spacing: -0.4px;
          margin-bottom: 27px;
        }

        .waitlistCard {
          width: min(680px, 100%);
          border-radius: 28px;
          padding: 23px;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid rgba(11, 99, 255, 0.16);
          box-shadow: 0 26px 55px rgba(7, 20, 47, 0.11);
          backdrop-filter: blur(18px);
          transition: 0.32s ease;
        }

        .waitlistCard:hover {
          transform: translateY(-4px);
          box-shadow: 0 35px 70px rgba(7, 20, 47, 0.15), 0 0 0 6px rgba(11, 99, 255, 0.04);
        }

        .formHeader {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 18px;
        }

        .mailOrb {
          width: 56px;
          height: 56px;
          flex: 0 0 auto;
          border-radius: 18px;
          display: grid;
          place-items: center;
          color: white;
          background: linear-gradient(135deg, var(--blue), var(--blue2));
          box-shadow: 0 16px 30px rgba(11, 99, 255, 0.24);
        }

        .mailOrb svg {
          width: 28px;
          height: 28px;
        }

        .formHeader h2 {
          font-size: 25px;
          line-height: 1.1;
          letter-spacing: -0.9px;
          margin-bottom: 6px;
        }

        .formHeader p {
          color: var(--muted);
          font-size: 15px;
          line-height: 1.45;
        }

        .formHeader b {
          color: var(--blue);
        }

        .formRow {
          display: grid;
          grid-template-columns: 1fr 172px;
          gap: 12px;
          margin-bottom: 12px;
        }

        .formRow input {
          height: 58px;
          border: 1px solid rgba(11, 99, 255, 0.18);
          border-radius: 18px;
          outline: none;
          background: #f7fbff;
          color: #050914;
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
          height: 58px;
          border: 0;
          border-radius: 18px;
          background: linear-gradient(135deg, var(--blue), var(--blue2));
          color: white;
          font-size: 17px;
          font-weight: 950;
          cursor: pointer;
          box-shadow: 0 16px 28px rgba(11, 99, 255, 0.24);
          transition: 0.25s ease;
        }

        .formRow button:hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 38px rgba(11, 99, 255, 0.3);
        }

        .message {
          margin: 0 0 12px;
          padding: 12px 14px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 760;
        }

        .message.error {
          color: #b42318;
          background: #fff1f0;
          border: 1px solid #ffdad6;
        }

        .message.success {
          color: #067647;
          background: #ecfdf3;
          border: 1px solid #abefc6;
        }

        .formHint {
          display: flex;
          align-items: center;
          gap: 9px;
          color: var(--blue);
          font-size: 14px;
          font-weight: 850;
        }

        .formHint svg {
          width: 20px;
          height: 20px;
        }

        .miniStats {
          width: min(680px, 100%);
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 17px;
        }

        .miniStats div {
          min-height: 82px;
          border-radius: 22px;
          padding: 14px;
          background: rgba(255, 255, 255, 0.68);
          border: 1px solid rgba(11, 99, 255, 0.12);
          box-shadow: 0 16px 35px rgba(7, 20, 47, 0.06);
          transition: 0.25s ease;
        }

        .miniStats div:hover {
          transform: translateY(-4px);
          border-color: rgba(11, 99, 255, 0.3);
        }

        .miniStats strong {
          display: block;
          color: var(--blue);
          font-size: 24px;
          line-height: 1;
          margin-bottom: 7px;
        }

        .miniStats span {
          color: #475467;
          font-size: 13px;
          line-height: 1.35;
          font-weight: 760;
        }

        .heroVisual {
          min-height: 710px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mockupStage {
          width: min(760px, 100%);
          height: 520px;
          position: relative;
          display: flex;
          align-items: end;
          justify-content: center;
          perspective: 1100px;
        }

        .laptopMock {
          width: min(680px, 91%);
          height: 372px;
          position: relative;
          border-radius: 28px 28px 18px 18px;
          padding: 16px 16px 28px;
          background: linear-gradient(135deg, #c5cfdd, #f8fbff 48%, #8c99aa);
          box-shadow: 0 36px 80px rgba(7, 20, 47, 0.2);
          transform: rotateX(4deg) rotateY(-7deg) rotateZ(-1deg);
          transition: 0.35s ease;
        }

        .mockupStage:hover .laptopMock {
          transform: rotateX(2deg) rotateY(-3deg) rotateZ(0deg) translateY(-8px);
        }

        .laptopMock::after {
          content: "";
          position: absolute;
          left: 7%;
          right: 7%;
          bottom: -18px;
          height: 25px;
          border-radius: 0 0 34px 34px;
          background: linear-gradient(180deg, #e5ebf3, #7d8796);
          box-shadow: 0 18px 30px rgba(7, 20, 47, 0.16);
        }

        .laptopScreen {
          width: 100%;
          height: 100%;
          overflow: hidden;
          border-radius: 20px;
          background: #041020;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: inset 0 0 42px rgba(0, 168, 255, 0.09);
          text-align: left;
        }

        .screenTop {
          height: 55px;
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
          height: calc(100% - 55px);
          display: grid;
          grid-template-columns: 150px 1fr;
        }

        .mockMenu {
          padding: 16px 12px;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          display: grid;
          align-content: start;
          gap: 10px;
        }

        .mockMenu span {
          height: 30px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.07);
        }

        .mockMenu span:first-child {
          background: linear-gradient(135deg, var(--blue), var(--blue2));
          box-shadow: 0 10px 20px rgba(11, 99, 255, 0.22);
        }

        .mockContent {
          padding: 16px;
        }

        .mockCards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
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
        }

        .mockCard small {
          display: block;
          color: #8fb7ff;
          font-size: 11px;
          margin-bottom: 8px;
        }

        .mockCard b {
          font-size: 20px;
        }

        .mockGraph {
          height: 152px;
          border-radius: 16px;
          overflow: hidden;
          background: linear-gradient(180deg, rgba(11, 99, 255, 0.2), rgba(11, 99, 255, 0.03));
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .mockGraph svg {
          width: 100%;
          height: 100%;
        }

        .phoneMock {
          position: absolute;
          right: 8%;
          bottom: 0;
          width: 170px;
          height: 338px;
          border-radius: 36px;
          padding: 10px;
          background: linear-gradient(135deg, #1c2533, #050b15);
          border: 3px solid #101827;
          box-shadow: 0 30px 60px rgba(7, 20, 47, 0.24);
          transform: rotate(-2deg);
          transition: 0.35s ease;
          z-index: 6;
        }

        .mockupStage:hover .phoneMock {
          transform: rotate(1deg) translateY(-12px);
        }

        .phoneScreen {
          height: 100%;
          border-radius: 27px;
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

        .phoneList {
          margin-top: 11px;
          display: grid;
          gap: 8px;
        }

        .phoneList span {
          height: 31px;
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .floatingPanel {
          position: absolute;
          z-index: 8;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 15px;
          min-width: 178px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid rgba(11, 99, 255, 0.16);
          box-shadow: 0 22px 40px rgba(7, 20, 47, 0.12);
          backdrop-filter: blur(16px);
          transition: 0.28s ease;
        }

        .floatingPanel:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: rgba(11, 99, 255, 0.35);
          box-shadow: 0 32px 55px rgba(7, 20, 47, 0.17);
        }

        .floatingPanel svg {
          width: 27px;
          height: 27px;
          color: var(--blue);
          flex: 0 0 auto;
        }

        .floatingPanel b {
          display: block;
          color: #050914;
          font-size: 15px;
          line-height: 1.1;
        }

        .floatingPanel span {
          display: block;
          color: var(--muted);
          font-size: 12px;
          font-weight: 750;
          margin-top: 3px;
        }

        .panelOrders {
          left: 0;
          top: 68px;
          animation: floatPanel 4.8s ease-in-out infinite;
        }

        .panelStock {
          left: 42px;
          bottom: 70px;
          animation: floatPanel 5.2s ease-in-out infinite 0.3s;
        }

        .panelIncome {
          right: 0;
          top: 128px;
          animation: floatPanel 5.6s ease-in-out infinite 0.6s;
        }

        .swingTag {
          position: absolute;
          top: 40px;
          right: 18px;
          width: 208px;
          height: 245px;
          z-index: 12;
          transform-origin: 50% 0;
          animation: swing 3.7s ease-in-out infinite;
        }

        .tagString {
          width: 2px;
          height: 48px;
          margin: 0 auto -2px;
          background: linear-gradient(180deg, rgba(5, 9, 20, 0.18), rgba(5, 9, 20, 0.55));
        }

        .tagBody {
          position: relative;
          min-height: 192px;
          padding: 15px 16px 18px;
          border-radius: 23px;
          background: #060b17;
          color: white;
          text-align: center;
          box-shadow: 0 28px 50px rgba(7, 20, 47, 0.28);
          overflow: hidden;
        }

        .tagBody::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 10px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          transform: translateX(-50%);
          background: #f7fbff;
          box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.2);
        }

        .tagBody b {
          display: inline-flex;
          margin-top: 15px;
          padding: 8px 10px;
          border-radius: 10px;
          background: var(--blue);
          font-size: 16px;
          transform: rotate(-3deg);
          box-shadow: 0 12px 22px rgba(11, 99, 255, 0.3);
        }

        .tagBody span {
          display: block;
          margin-top: 12px;
          color: #d7e8ff;
          font-size: 18px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .tagBody del {
          display: block;
          color: rgba(255, 255, 255, 0.35);
          font-size: 43px;
          font-weight: 950;
          line-height: 1;
          text-decoration-color: var(--blue);
          text-decoration-thickness: 5px;
          margin-top: 2px;
        }

        .tagBody strong {
          display: block;
          color: white;
          font-size: 72px;
          line-height: 0.95;
          text-shadow: 0 0 24px rgba(11, 99, 255, 0.9);
        }

        .gorkiArea {
          position: absolute;
          right: 0;
          bottom: 10px;
          z-index: 14;
          width: 245px;
          min-height: 260px;
          pointer-events: none;
        }

        .gorkiArea img {
          width: 218px;
          height: 218px;
          object-fit: contain;
          filter: drop-shadow(0 22px 26px rgba(7, 20, 47, 0.16));
          animation: gorkiFloat 4.8s ease-in-out infinite;
        }

        .gorkiBubble {
          position: absolute;
          right: 4px;
          bottom: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          width: max-content;
          max-width: 235px;
          padding: 12px 15px;
          border-radius: 999px;
          color: white;
          background: #050914;
          box-shadow: 0 18px 35px rgba(7, 20, 47, 0.18);
          font-size: 13px;
          font-weight: 950;
        }

        .gorkiBubble svg {
          width: 16px;
          height: 16px;
          color: #ffffff;
          flex: 0 0 auto;
        }

        .featureGrid {
          max-width: 1480px;
          margin: 10px auto 0;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          position: relative;
          z-index: 10;
        }

        .featureCard {
          min-height: 160px;
          padding: 22px;
          display: flex;
          align-items: center;
          gap: 16px;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.76);
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
          font-size: 20px;
          letter-spacing: -0.55px;
          line-height: 1.1;
          margin-bottom: 8px;
        }

        .featureCard p {
          color: var(--muted);
          font-size: 14px;
          line-height: 1.45;
        }

        .bottomSection {
          max-width: 1480px;
          margin: 20px auto 0;
          display: grid;
          grid-template-columns: 1fr 1.35fr;
          gap: 16px;
          position: relative;
          z-index: 10;
        }

        .domainCard,
        .trustCards {
          min-height: 112px;
          border-radius: 28px;
          background: white;
          border: 1px solid rgba(11, 99, 255, 0.14);
          box-shadow: 0 20px 44px rgba(7, 20, 47, 0.08);
        }

        .domainCard {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 22px 25px;
        }

        .domainCard svg {
          width: 46px;
          height: 46px;
          color: var(--blue);
          flex: 0 0 auto;
        }

        .domainCard h3 {
          font-size: 36px;
          line-height: 1;
          letter-spacing: -1.3px;
        }

        .domainCard p {
          margin-top: 6px;
          color: var(--muted);
          font-weight: 760;
        }

        .trustCards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          padding: 16px;
          gap: 12px;
        }

        .trustCards div {
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

        .trustCards div:hover {
          transform: translateY(-4px);
          background: white;
          border-color: rgba(11, 99, 255, 0.26);
        }

        .trustCards svg {
          width: 25px;
          height: 25px;
          color: var(--blue);
          flex: 0 0 auto;
        }

        svg {
          fill: none;
          stroke: currentColor;
          stroke-width: 2.4;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        @keyframes dotPulse {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55); }
          70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }

        @keyframes swing {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(5deg); }
        }

        @keyframes floatPanel {
          0%, 100% { translate: 0 0; }
          50% { translate: 0 -12px; }
        }

        @keyframes gorkiFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        @media (max-width: 1320px) {
          .hero {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .heroCopy {
            max-width: 850px;
          }

          .heroVisual {
            min-height: 640px;
          }

          .featureGrid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 900px) {
          .takipioPage {
            padding: 22px 16px 30px;
          }

          .navLinks {
            display: none;
          }

          .brand {
            width: 170px;
          }

          .brand img {
            width: 165px;
          }

          .hero {
            min-height: auto;
          }

          h1 {
            letter-spacing: -3px;
          }

          .heroText {
            font-size: 18px;
          }

          .heroVisual {
            min-height: 570px;
          }

          .mockupStage {
            height: 460px;
          }

          .swingTag {
            right: 0;
            top: 10px;
            scale: 0.82;
          }

          .gorkiArea {
            scale: 0.86;
            right: -18px;
          }

          .panelOrders,
          .panelStock,
          .panelIncome {
            display: none;
          }

          .bottomSection {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .launchBadge {
            font-size: 12px;
          }

          .formHeader {
            align-items: flex-start;
          }

          .formRow {
            grid-template-columns: 1fr;
          }

          .miniStats {
            grid-template-columns: 1fr;
          }

          .heroVisual {
            min-height: 510px;
            overflow: hidden;
          }

          .mockupStage {
            height: 410px;
          }

          .laptopMock {
            width: 97%;
            height: 290px;
            padding: 11px 11px 22px;
          }

          .screenBody {
            grid-template-columns: 92px 1fr;
          }

          .mockCards {
            grid-template-columns: 1fr;
          }

          .mockCards .mockCard:nth-child(2),
          .mockCards .mockCard:nth-child(3) {
            display: none;
          }

          .mockGraph {
            height: 122px;
          }

          .phoneMock {
            width: 125px;
            height: 250px;
            right: -8px;
            bottom: 12px;
          }

          .swingTag {
            top: 6px;
            right: -38px;
            scale: 0.66;
          }

          .gorkiArea {
            right: -65px;
            bottom: -15px;
            scale: 0.72;
          }

          .featureGrid {
            grid-template-columns: 1fr;
          }

          .featureCard {
            min-height: 135px;
          }

          .domainCard {
            align-items: flex-start;
          }

          .domainCard h3 {
            font-size: 29px;
          }

          .trustCards {
            grid-template-columns: 1fr;
          }

          .trustCards div {
            min-height: 64px;
          }
        }
      `}</style>
    </main>
  );
}

function LaptopMockup() {
  return (
    <div className="laptopMock">
      <div className="laptopScreen">
        <div className="screenTop">
          <div className="screenBrand"><img src="/takipio-logo.png" alt="" /> takipio</div>
          <div className="screenActions"><span /><span /><span /></div>
        </div>
        <div className="screenBody">
          <div className="mockMenu"><span /><span /><span /><span /><span /></div>
          <div className="mockContent">
            <div className="mockCards">
              <div className="mockCard"><small>Toplam Gelir</small><b>₺125.250</b></div>
              <div className="mockCard"><small>Sipariş</small><b>128</b></div>
              <div className="mockCard"><small>Müşteri</small><b>89</b></div>
            </div>
            <div className="mockGraph">
              <svg viewBox="0 0 520 170" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 138 C40 110 65 98 105 110 C150 126 160 58 210 78 C250 94 260 45 310 62 C360 82 374 28 420 42 C460 54 470 18 520 28" fill="none" stroke="#0b63ff" strokeWidth="7" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="phoneMock">
      <div className="phoneScreen">
        <div className="phoneHead"><span><img src="/takipio-logo.png" alt="" /> takipio</span><b>9:41</b></div>
        <div className="phoneGrid">
          <div className="phoneCard"><small>Gelir</small><b>₺12k</b></div>
          <div className="phoneCard"><small>Sipariş</small><b>128</b></div>
          <div className="phoneCard"><small>Müşteri</small><b>89</b></div>
          <div className="phoneCard"><small>Stok</small><b>Güncel</b></div>
        </div>
        <div className="phoneList"><span /><span /><span /></div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
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

function MailIcon() { return <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M4 7l8 7 8-7" /></svg>; }
function GiftIcon() { return <svg viewBox="0 0 24 24"><path d="M20 12v8H4v-8" /><path d="M2 7h20v5H2z" /><path d="M12 22V7" /><path d="M12 7H7.5A2.5 2.5 0 1 1 10 4.5C10 6 12 7 12 7z" /><path d="M12 7h4.5A2.5 2.5 0 1 0 14 4.5C14 6 12 7 12 7z" /></svg>; }
function UsersIcon() { return <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="4" /><path d="M2 22c1.2-5.3 4.2-8 8-8s6.8 2.7 8 8" /><path d="M17 11a4 4 0 1 0-1.5-7.7" /><path d="M18 14c2.4.7 3.8 2.9 4.5 6" /></svg>; }
function OrdersIcon() { return <svg viewBox="0 0 24 24"><path d="M6 2h12l3 5v15H3V7l3-5z" /><path d="M3 7h18" /><path d="M8 12h8" /><path d="M8 16h5" /></svg>; }
function CubeIcon() { return <svg viewBox="0 0 24 24"><path d="M12 2l9 5-9 5-9-5 9-5z" /><path d="M3 7v10l9 5 9-5V7" /><path d="M12 12v10" /></svg>; }
function WalletIcon() { return <svg viewBox="0 0 24 24"><path d="M3 7h18v12H3z" /><path d="M16 12h5v4h-5a2 2 0 0 1 0-4z" /><path d="M3 7l3-4h12l3 4" /></svg>; }
function HeartIcon() { return <svg viewBox="0 0 24 24"><path d="M12 21s-8-4.8-9.6-10C1.2 7.1 3.7 4.5 7 4.5c2 0 3.8 1.2 5 3 1.2-1.8 3-3 5-3 3.3 0 5.8 2.6 4.6 6.5C20 16.2 12 21 12 21z" /></svg>; }
function GlobeIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15 15 0 0 1 0 20" /><path d="M12 2a15 15 0 0 0 0 20" /></svg>; }
function ShieldIcon() { return <svg viewBox="0 0 24 24"><path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-4z" /><path d="M8.5 12l2.3 2.3 4.8-5" /></svg>; }
function BoltIcon() { return <svg viewBox="0 0 24 24"><path d="M13 2L3 14h8l-1 8 11-14h-8l0-6z" /></svg>; }
function HeadsetIcon() { return <svg viewBox="0 0 24 24"><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><path d="M4 13h4v6H4z" /><path d="M16 13h4v6h-4z" /><path d="M16 21h-4" /></svg>; }
