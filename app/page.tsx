"use client";

import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Page() {
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
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

    const { error } = await supabase
      .from("waitlist_signups")
      .insert([{ email: cleanEmail }]);

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
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <main className="takipioLanding">
      <div className="bgNoise" />
      <div className="bgGrid" />
      <div className="glow glowA" />
      <div className="glow glowB" />
      <div className="glow glowC" />

      <nav className="navbar">
        <a className="logoWrap" href="#top" aria-label="Takipio Ana Sayfa">
          <img src="/takipio-logo.png" alt="Takipio" />
        </a>

        <div className="navLinks">
          <a href="#features">Özellikler</a>
          <a href="#gorki">Gorki</a>
          <a href="#early">Erken Erişim</a>
          <a href="#contact">İletişim</a>
          <a className="navButton" href="#early">Yakında</a>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="heroTextArea">
          <div className="statusBadge">
            <span />
            ÇOK YAKINDA
          </div>

          <h1>
            İşletmeni takip et, <br />
            <strong>kontrolü kaybetme.</strong>
          </h1>

          <p className="heroDesc">
            Takipio; müşteri, sipariş, stok, ödeme ve günlük iş akışını tek ekranda toplayan yeni nesil işletme asistanıdır.
          </p>

          <form className="earlyAccess" id="early" onSubmit={handleSubmit}>
            <div className="earlyHeader">
              <div className="mailIcon">
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <rect x="10" y="16" width="44" height="32" rx="8" />
                  <path d="M12 21l20 16 20-16" />
                </svg>
              </div>

              <div>
                <h2>Erken erişim listesine katıl</h2>
                <p>Açılışta özel indirim ve ilk kullanım avantajlarını kaçırma.</p>
              </div>
            </div>

            <div className="inputGroup">
              <input
                type="email"
                placeholder="E-posta adresiniz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit">
                {loading ? "Kaydediliyor..." : saved ? "Kaydedildi ✓" : "Kayıt Ol"}
                {!saved && !loading && (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>

            {errorMessage && <div className="formMessage error">{errorMessage}</div>}
            {saved && <div className="formMessage success">Kaydın alındı abi. Açılışta haber vereceğiz.</div>}

            <div className="promoLine">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 12v8H4v-8" />
                <path d="M2 7h20v5H2z" />
                <path d="M12 22V7" />
                <path d="M12 7H7.5A2.5 2.5 0 1 1 10 4.5C10 6 12 7 12 7z" />
                <path d="M12 7h4.5A2.5 2.5 0 1 0 14 4.5C14 6 12 7 12 7z" />
              </svg>
              İlk açılışa özel erken kullanıcı avantajı
            </div>
          </form>
        </div>

        <div className="heroVisual" id="gorki">
          <div className="planetGlow" />
          <div className="orbit orbitOne" />
          <div className="orbit orbitTwo" />

          <img className="gorki" src="/gorki-hero.png" alt="Gorki Takipio Asistanı" />

          <div className="floatingCard chartCard">
            <div className="cardTop">
              <span>Satış Grafiği</span>
              <b>+18%</b>
            </div>
            <svg viewBox="0 0 260 125" aria-hidden="true">
              <path className="gridLine" d="M0 104H260M0 76H260M0 48H260M0 20H260" />
              <path className="chartGlow" d="M8 100L45 78L80 86L118 48L154 64L192 31L225 40L252 14" />
              <path className="chartLine" d="M8 100L45 78L80 86L118 48L154 64L192 31L225 40L252 14" />
              <g>
                <circle cx="45" cy="78" r="5" />
                <circle cx="118" cy="48" r="5" />
                <circle cx="192" cy="31" r="5" />
                <circle cx="252" cy="14" r="6" />
              </g>
            </svg>
          </div>

          <div className="floatingCard revenueCard">
            <small>Bugünkü Ciro</small>
            <strong>₺12.450</strong>
            <span>Aktif takip</span>
          </div>

          <div className="floatingCard stockCard">
            <div className="boxIcon">
              <svg viewBox="0 0 48 48" aria-hidden="true">
                <path d="M24 5l16 9v20L24 44 8 34V14L24 5z" />
                <path d="M8 14l16 10 16-10" />
                <path d="M24 24v20" />
              </svg>
            </div>
            <div>
              <small>Stok Durumu</small>
              <strong>Güncel</strong>
            </div>
          </div>

          <div className="gorkiBubble">
            <span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21s-8-4.8-9.6-10C1.2 7.1 3.7 4.5 7 4.5c2 0 3.8 1.2 5 3 1.2-1.8 3-3 5-3 3.3 0 5.8 2.6 4.6 6.5C20 16.2 12 21 12 21z" />
              </svg>
            </span>
            Gorki her zaman yanında.
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <FeatureCard
          icon="customer"
          title="Müşteri takibi"
          text="Müşteri bilgilerini, sipariş geçmişini ve notlarını tek panelde düzenle."
        />
        <FeatureCard
          icon="order"
          title="Sipariş kontrolü"
          text="Bekleyen, tamamlanan ve ödeme bekleyen işleri hızlıca görüntüle."
        />
        <FeatureCard
          icon="money"
          title="Gelir & ödeme takibi"
          text="Günlük ciro, ödeme durumu ve genel performansı net şekilde takip et."
        />
        <FeatureCard
          icon="assistant"
          title="Akıllı Gorki asistanı"
          text="İşletmeni yönetirken sana hatırlatma, özet ve pratik yönlendirme sunsun."
        />
      </section>

      <section className="storeAndContact" id="contact">
        <div className="storePanel">
          <div className="storeIntro">
            <h3>Mobil uygulama da geliyor</h3>
            <p>Takipio yakında App Store ve Google Play üzerinde yerini alacak.</p>
          </div>

          <div className="storeButtons">
            <StoreButton type="apple" title="App Store" />
            <StoreButton type="play" title="Google Play" />
          </div>
        </div>

        <a className="instagramPanel" href="https://instagram.com/takipiocom" target="_blank">
          <span className="instagramIcon">
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <defs>
                <linearGradient id="ig" x1="10" y1="58" x2="55" y2="8" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ffd600" />
                  <stop offset=".35" stopColor="#ff0069" />
                  <stop offset=".7" stopColor="#d300c5" />
                  <stop offset="1" stopColor="#7638fa" />
                </linearGradient>
              </defs>
              <rect x="8" y="8" width="48" height="48" rx="15" fill="url(#ig)" />
              <rect x="18" y="18" width="28" height="28" rx="9" />
              <circle cx="32" cy="32" r="7" />
              <circle cx="43" cy="21" r="3" />
            </svg>
          </span>
          <span>
            <strong>@takipiocom</strong>
            <p>Gelişmeleri Instagram hesabımızdan takip edebilirsin.</p>
          </span>
        </a>
      </section>

      <style jsx global>{`
        :root {
          --bg: #020611;
          --panel: rgba(7, 20, 47, 0.76);
          --panelLight: rgba(11, 35, 78, 0.72);
          --stroke: rgba(70, 142, 255, 0.42);
          --strokeSoft: rgba(145, 179, 234, 0.22);
          --blue: #0a7cff;
          --blue2: #29c6ff;
          --text: #f4f8ff;
          --muted: #aab6ca;
          --green: #43ff88;
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
          color: var(--text);
          background: var(--bg);
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

        .takipioLanding {
          width: min(1760px, 100%);
          min-height: 100vh;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
          padding: 30px 54px 38px;
          background:
            radial-gradient(circle at 72% 22%, rgba(0, 118, 255, 0.28), transparent 23%),
            radial-gradient(circle at 16% 77%, rgba(0, 84, 255, 0.16), transparent 27%),
            linear-gradient(135deg, #02040a 0%, #030916 45%, #02040a 100%);
        }

        .bgNoise,
        .bgGrid,
        .glow {
          position: absolute;
          pointer-events: none;
        }

        .bgNoise {
          inset: 0;
          z-index: 0;
          opacity: 0.21;
          background-image:
            radial-gradient(circle, rgba(74, 156, 255, 0.9) 0 1px, transparent 1.5px),
            radial-gradient(circle, rgba(255, 255, 255, 0.2) 0 1px, transparent 1.5px);
          background-size: 92px 92px, 144px 144px;
          mask-image: linear-gradient(to bottom, transparent 0%, #000 16%, #000 82%, transparent 100%);
        }

        .bgGrid {
          inset: 0;
          z-index: 0;
          opacity: 0.12;
          background-image:
            linear-gradient(rgba(70, 142, 255, 0.18) 1px, transparent 1px),
            linear-gradient(90deg, rgba(70, 142, 255, 0.18) 1px, transparent 1px);
          background-size: 82px 82px;
          mask-image: radial-gradient(circle at 70% 45%, #000 0%, transparent 64%);
        }

        .glow {
          z-index: 0;
          border-radius: 999px;
          filter: blur(48px);
        }

        .glowA {
          width: 460px;
          height: 460px;
          top: 65px;
          right: 180px;
          background: rgba(0, 119, 255, 0.32);
        }

        .glowB {
          width: 390px;
          height: 300px;
          left: 30px;
          bottom: 130px;
          background: rgba(0, 80, 255, 0.18);
        }

        .glowC {
          width: 300px;
          height: 220px;
          right: 470px;
          bottom: 10px;
          background: rgba(39, 198, 255, 0.14);
        }

        .navbar {
          height: 74px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 10;
        }

        .logoWrap {
          width: 245px;
          height: 82px;
          display: flex;
          align-items: center;
          margin-left: -10px;
        }

        .logoWrap img {
          width: 232px;
          max-height: 82px;
          object-fit: contain;
          object-position: left center;
          filter: drop-shadow(0 0 24px rgba(0, 122, 255, 0.45));
        }

        .navLinks {
          display: flex;
          align-items: center;
          gap: 42px;
          color: rgba(255, 255, 255, 0.78);
          font-size: 18px;
        }

        .navLinks a {
          white-space: nowrap;
          transition: 0.24s ease;
        }

        .navLinks a:hover {
          color: #fff;
          text-shadow: 0 0 18px rgba(0, 132, 255, 0.85);
        }

        .navButton {
          color: white !important;
          font-weight: 850;
          padding: 15px 31px;
          border-radius: 14px;
          border: 1px solid rgba(48, 137, 255, 0.86);
          background: linear-gradient(180deg, rgba(9, 42, 98, 0.95), rgba(7, 20, 45, 0.64));
          box-shadow: 0 0 24px rgba(0, 115, 255, 0.3), inset 0 0 18px rgba(0, 100, 255, 0.2);
        }

        .hero {
          position: relative;
          z-index: 2;
          min-height: 650px;
          display: grid;
          grid-template-columns: minmax(590px, 48%) minmax(640px, 52%);
          gap: 10px;
          align-items: center;
        }

        .heroTextArea {
          position: relative;
          z-index: 5;
          padding-top: 10px;
        }

        .statusBadge {
          width: max-content;
          min-width: 240px;
          height: 52px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin: 30px 0 30px;
          padding: 0 29px;
          border-radius: 999px;
          border: 1px solid rgba(33, 139, 255, 0.95);
          color: #2fc4ff;
          font-size: 22px;
          font-weight: 950;
          letter-spacing: 7px;
          background: linear-gradient(180deg, rgba(9, 38, 88, 0.74), rgba(3, 15, 40, 0.68));
          box-shadow: 0 0 26px rgba(0, 119, 255, 0.58), inset 0 0 24px rgba(0, 119, 255, 0.22);
          animation: badgePulse 2.7s ease-in-out infinite;
        }

        .statusBadge span {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #37ff91;
          box-shadow: 0 0 15px rgba(55, 255, 145, 0.9);
        }

        h1 {
          max-width: 940px;
          color: white;
          font-size: 74px;
          line-height: 1.08;
          letter-spacing: -3.6px;
          font-weight: 950;
          text-shadow: 0 8px 28px rgba(0, 0, 0, 0.58);
          margin-bottom: 22px;
        }

        h1 strong {
          color: var(--blue);
          font-weight: 950;
          text-shadow: 0 0 30px rgba(0, 124, 255, 0.48);
        }

        .heroDesc {
          max-width: 805px;
          color: var(--muted);
          font-size: 25px;
          line-height: 1.58;
          letter-spacing: -0.35px;
          margin-bottom: 28px;
        }

        .earlyAccess {
          width: min(790px, 100%);
          padding: 28px 30px 19px;
          border-radius: 20px;
          border: 1px solid var(--stroke);
          background: linear-gradient(180deg, rgba(8, 24, 56, 0.9), rgba(7, 18, 39, 0.78));
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.38), inset 0 0 70px rgba(0, 102, 255, 0.08);
          backdrop-filter: blur(18px);
        }

        .earlyHeader {
          display: flex;
          align-items: center;
          gap: 22px;
          margin-bottom: 23px;
        }

        .mailIcon {
          width: 68px;
          height: 68px;
          flex: 0 0 auto;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #28bcff;
          background: radial-gradient(circle at 40% 30%, #0f8eff, #053d91 64%, #061d4b);
          border: 1px solid rgba(72, 162, 255, 0.75);
          box-shadow: 0 0 25px rgba(0, 124, 255, 0.38), inset 0 0 20px rgba(255, 255, 255, 0.09);
        }

        .mailIcon svg {
          width: 40px;
          height: 40px;
          fill: none;
          stroke: currentColor;
          stroke-width: 4;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .earlyHeader h2 {
          color: white;
          font-size: 30px;
          line-height: 1.1;
          letter-spacing: -0.8px;
          margin-bottom: 8px;
        }

        .earlyHeader p {
          color: rgba(255, 255, 255, 0.8);
          font-size: 17px;
          line-height: 1.45;
        }

        .inputGroup {
          display: grid;
          grid-template-columns: 1fr 218px;
          gap: 18px;
          margin-bottom: 15px;
        }

        .inputGroup input {
          width: 100%;
          height: 62px;
          padding: 0 22px;
          border: 1px solid rgba(134, 157, 192, 0.34);
          border-radius: 12px;
          outline: none;
          color: white;
          font-size: 20px;
          background: rgba(3, 10, 23, 0.64);
          box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.25);
        }

        .inputGroup input::placeholder {
          color: rgba(255, 255, 255, 0.48);
        }

        .inputGroup button {
          height: 62px;
          border: 0;
          border-radius: 12px;
          cursor: pointer;
          color: white;
          font-size: 22px;
          font-weight: 900;
          background: linear-gradient(135deg, #0693ff, #0a67ff);
          box-shadow: 0 0 25px rgba(0, 132, 255, 0.58), inset 0 0 24px rgba(255, 255, 255, 0.16);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: 0.24s ease;
        }

        .inputGroup button:hover {
          transform: translateY(-2px);
          filter: brightness(1.08);
        }

        .inputGroup button svg {
          width: 24px;
          height: 24px;
          fill: none;
          stroke: white;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .formMessage {
          margin: -2px 0 14px;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 15px;
          line-height: 1.35;
        }

        .formMessage.error {
          color: #ffb4b4;
          border: 1px solid rgba(255, 82, 82, 0.35);
          background: rgba(255, 82, 82, 0.09);
        }

        .formMessage.success {
          color: #b9ffd2;
          border: 1px solid rgba(67, 255, 136, 0.35);
          background: rgba(67, 255, 136, 0.09);
        }

        .promoLine {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #1694ff;
          font-size: 17px;
        }

        .promoLine svg {
          width: 22px;
          height: 22px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .heroVisual {
          position: relative;
          height: 668px;
          display: flex;
          align-items: center;
          justify-content: center;
          isolation: isolate;
        }

        .planetGlow {
          position: absolute;
          left: -15%;
          right: -8%;
          bottom: 5px;
          height: 196px;
          z-index: 1;
          border-top: 3px solid rgba(95, 190, 255, 0.78);
          border-radius: 50% 50% 0 0 / 100% 100% 0 0;
          background: radial-gradient(ellipse at center top, rgba(39, 151, 255, 0.75), rgba(0, 70, 172, 0.24) 19%, transparent 57%);
          filter: drop-shadow(0 -22px 34px rgba(0, 117, 255, 0.45));
        }

        .planetGlow::after {
          content: "";
          position: absolute;
          left: 8%;
          right: 8%;
          top: -28px;
          height: 82px;
          background: radial-gradient(ellipse at center, rgba(53, 151, 255, 0.46), transparent 68%);
          filter: blur(13px);
        }

        .orbit {
          position: absolute;
          z-index: 1;
          border: 1px solid rgba(45, 130, 255, 0.15);
          border-radius: 50%;
          transform: rotate(-13deg);
        }

        .orbitOne {
          width: 820px;
          height: 330px;
          bottom: 57px;
          right: -115px;
        }

        .orbitTwo {
          width: 620px;
          height: 230px;
          bottom: 110px;
          right: -25px;
          opacity: 0.7;
        }

        .gorki {
          position: relative;
          z-index: 4;
          width: min(600px, 80%);
          max-height: 630px;
          margin-top: 36px;
          object-fit: contain;
          filter: drop-shadow(0 0 38px rgba(33, 139, 255, 0.58)) drop-shadow(0 28px 40px rgba(0, 0, 0, 0.48));
          animation: gorkiFloat 5.6s ease-in-out infinite;
        }

        .floatingCard {
          position: absolute;
          z-index: 6;
          border: 1px solid rgba(55, 129, 255, 0.44);
          border-radius: 16px;
          background: linear-gradient(180deg, rgba(8, 30, 70, 0.78), rgba(5, 16, 39, 0.66));
          box-shadow: 0 18px 35px rgba(0, 0, 0, 0.34), inset 0 0 30px rgba(0, 115, 255, 0.07);
          backdrop-filter: blur(14px);
        }

        .chartCard {
          width: 270px;
          height: 178px;
          top: 102px;
          right: 24px;
          padding: 18px;
          transform: rotate(-7deg);
          animation: floatCard 5.1s ease-in-out infinite;
        }

        .cardTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 11px;
          color: #d7e2f5;
          font-size: 13px;
          font-weight: 750;
        }

        .cardTop b {
          color: var(--green);
        }

        .chartCard svg {
          width: 100%;
          height: 122px;
          overflow: visible;
        }

        .gridLine {
          fill: none;
          stroke: rgba(83, 137, 216, 0.15);
          stroke-width: 1;
        }

        .chartGlow {
          fill: none;
          stroke: #118cff;
          stroke-width: 10;
          stroke-linecap: round;
          stroke-linejoin: round;
          opacity: 0.22;
          filter: blur(3px);
        }

        .chartLine {
          fill: none;
          stroke: #168cff;
          stroke-width: 5;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .chartCard circle {
          fill: #25b9ff;
          filter: drop-shadow(0 0 8px rgba(36, 183, 255, 0.95));
        }

        .revenueCard {
          width: 195px;
          min-height: 124px;
          right: 7px;
          top: 330px;
          padding: 19px 20px;
          animation: floatCard 5.2s ease-in-out infinite 0.25s;
        }

        .revenueCard small,
        .stockCard small {
          display: block;
          color: #78a7e7;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .revenueCard strong {
          display: block;
          color: white;
          font-size: 27px;
          line-height: 1;
          letter-spacing: -0.6px;
          margin-bottom: 12px;
        }

        .revenueCard span {
          display: inline-flex;
          color: var(--green);
          background: rgba(20, 255, 114, 0.12);
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 850;
        }

        .stockCard {
          right: 96px;
          bottom: 118px;
          width: 212px;
          min-height: 76px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          animation: floatCard 5.5s ease-in-out infinite 0.55s;
        }

        .stockCard strong {
          display: block;
          color: white;
          font-size: 16px;
        }

        .boxIcon {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          color: #278bff;
          flex: 0 0 auto;
        }

        .boxIcon svg {
          width: 40px;
          height: 40px;
          fill: none;
          stroke: currentColor;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: drop-shadow(0 0 10px rgba(39, 139, 255, 0.55));
        }

        .gorkiBubble {
          position: absolute;
          z-index: 7;
          left: 272px;
          bottom: 72px;
          min-width: 320px;
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 16px 26px;
          border-radius: 999px;
          border: 1px solid rgba(44, 126, 255, 0.64);
          color: white;
          font-size: 20px;
          font-weight: 750;
          background: rgba(9, 25, 54, 0.88);
          box-shadow: 0 0 32px rgba(0, 111, 255, 0.4);
          backdrop-filter: blur(14px);
        }

        .gorkiBubble span {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: white;
          color: #197fff;
          box-shadow: 0 0 18px rgba(255, 255, 255, 0.82);
          flex: 0 0 auto;
        }

        .gorkiBubble svg {
          width: 18px;
          height: 18px;
          fill: currentColor;
        }

        .features {
          position: relative;
          z-index: 5;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          margin-top: -4px;
        }

        .featureCard {
          min-height: 150px;
          padding: 24px 22px;
          border: 1px solid rgba(75, 111, 163, 0.48);
          border-radius: 16px;
          display: flex;
          align-items: flex-start;
          gap: 18px;
          background: linear-gradient(180deg, rgba(10, 25, 55, 0.78), rgba(5, 14, 31, 0.8));
          box-shadow: 0 18px 38px rgba(0, 0, 0, 0.3), inset 0 0 34px rgba(0, 99, 255, 0.055);
          backdrop-filter: blur(12px);
        }

        .featureIcon {
          width: 48px;
          height: 48px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          color: #168cff;
        }

        .featureIcon svg {
          width: 48px;
          height: 48px;
          fill: none;
          stroke: currentColor;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: drop-shadow(0 0 13px rgba(0, 120, 255, 0.45));
        }

        .featureCard h3 {
          color: white;
          font-size: 20px;
          line-height: 1.18;
          letter-spacing: -0.35px;
          margin-bottom: 10px;
        }

        .featureCard p {
          color: var(--muted);
          font-size: 15px;
          line-height: 1.45;
        }

        .storeAndContact {
          position: relative;
          z-index: 5;
          display: grid;
          grid-template-columns: 1.35fr 0.65fr;
          gap: 18px;
          margin-top: 22px;
        }

        .storePanel,
        .instagramPanel {
          min-height: 124px;
          border: 1px solid rgba(75, 111, 163, 0.48);
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(10, 25, 55, 0.78), rgba(5, 14, 31, 0.8));
          box-shadow: 0 18px 38px rgba(0, 0, 0, 0.3), inset 0 0 34px rgba(0, 99, 255, 0.055);
          backdrop-filter: blur(12px);
        }

        .storePanel {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 22px;
          padding: 24px 28px;
        }

        .storeIntro h3 {
          color: white;
          font-size: 25px;
          letter-spacing: -0.6px;
          margin-bottom: 8px;
        }

        .storeIntro p {
          color: var(--muted);
          font-size: 16px;
          line-height: 1.45;
        }

        .storeButtons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          width: min(430px, 100%);
        }

        .storeButton {
          height: 82px;
          border: 1px solid rgba(123, 145, 184, 0.34);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          background: rgba(5, 13, 29, 0.48);
          transition: 0.24s ease;
        }

        .storeButton:hover {
          transform: translateY(-2px);
          border-color: rgba(71, 153, 255, 0.75);
          box-shadow: 0 0 22px rgba(0, 119, 255, 0.2);
        }

        .storeButton svg {
          width: 39px;
          height: 39px;
        }

        .storeButton strong {
          display: block;
          color: white;
          font-size: 19px;
          line-height: 1.1;
        }

        .storeButton small {
          display: block;
          margin-top: 5px;
          color: #9ca8ba;
          font-size: 13px;
        }

        .instagramPanel {
          padding: 24px 26px;
          display: flex;
          align-items: center;
          gap: 18px;
          transition: 0.24s ease;
        }

        .instagramPanel:hover {
          transform: translateY(-2px);
          border-color: rgba(71, 153, 255, 0.75);
        }

        .instagramIcon {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          filter: drop-shadow(0 0 16px rgba(255, 0, 120, 0.45));
        }

        .instagramIcon svg {
          width: 54px;
          height: 54px;
        }

        .instagramIcon rect:nth-of-type(2),
        .instagramIcon circle {
          fill: none;
          stroke: white;
          stroke-width: 4;
        }

        .instagramIcon circle:last-child {
          fill: white;
          stroke: none;
        }

        .instagramPanel strong {
          display: block;
          color: white;
          font-size: 22px;
          margin-bottom: 7px;
        }

        .instagramPanel p {
          color: var(--muted);
          font-size: 15px;
          line-height: 1.45;
        }

        @keyframes badgePulse {
          0%, 100% {
            box-shadow: 0 0 22px rgba(0, 119, 255, 0.48), inset 0 0 20px rgba(0, 119, 255, 0.2);
          }
          50% {
            box-shadow: 0 0 42px rgba(0, 174, 255, 0.78), inset 0 0 26px rgba(0, 119, 255, 0.35);
          }
        }

        @keyframes gorkiFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-18px);
          }
        }

        @keyframes floatCard {
          0%, 100% {
            translate: 0 0;
          }
          50% {
            translate: 0 -12px;
          }
        }

        @media (max-width: 1380px) {
          .takipioLanding {
            padding: 28px 30px 36px;
          }

          .hero {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .heroTextArea {
            max-width: 900px;
          }

          .heroVisual {
            height: 600px;
          }

          .features {
            grid-template-columns: repeat(2, 1fr);
          }

          .storeAndContact {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 940px) {
          .navLinks {
            display: none;
          }

          .logoWrap {
            width: 215px;
          }

          .logoWrap img {
            width: 205px;
          }

          h1 {
            font-size: 56px;
            letter-spacing: -2.7px;
          }

          .heroDesc {
            font-size: 21px;
          }

          .chartCard {
            right: 1%;
          }

          .revenueCard {
            right: 1%;
          }

          .stockCard {
            right: 5%;
          }

          .gorkiBubble {
            left: 50%;
            transform: translateX(-50%);
            bottom: 42px;
            white-space: nowrap;
          }

          .storePanel {
            align-items: flex-start;
            flex-direction: column;
          }

          .storeButtons {
            width: 100%;
          }
        }

        @media (max-width: 680px) {
          .takipioLanding {
            padding: 20px 15px 28px;
          }

          .navbar {
            height: 62px;
          }

          .logoWrap {
            width: 175px;
            height: 62px;
          }

          .logoWrap img {
            width: 170px;
            max-height: 62px;
          }

          .statusBadge {
            min-width: 190px;
            height: 44px;
            font-size: 15px;
            letter-spacing: 5px;
            margin-top: 30px;
          }

          h1 {
            font-size: 43px;
            letter-spacing: -2px;
          }

          .heroDesc {
            font-size: 18px;
          }

          .earlyAccess {
            padding: 22px 18px 18px;
          }

          .earlyHeader {
            align-items: flex-start;
          }

          .mailIcon {
            width: 58px;
            height: 58px;
          }

          .earlyHeader h2 {
            font-size: 23px;
          }

          .inputGroup {
            grid-template-columns: 1fr;
          }

          .heroVisual {
            height: 480px;
          }

          .gorki {
            width: 91%;
          }

          .chartCard,
          .revenueCard,
          .stockCard {
            display: none;
          }

          .planetGlow {
            bottom: 38px;
            height: 135px;
          }

          .gorkiBubble {
            width: max-content;
            max-width: 92%;
            min-width: 0;
            padding: 12px 17px;
            font-size: 15px;
          }

          .features {
            grid-template-columns: 1fr;
          }

          .featureCard {
            min-height: 124px;
          }

          .storeButtons {
            grid-template-columns: 1fr;
          }

          .storeButton {
            height: 78px;
          }
        }
      `}</style>
    </main>
  );
}

function FeatureCard({ icon, title, text }: { icon: "customer" | "order" | "money" | "assistant"; title: string; text: string }) {
  return (
    <article className="featureCard">
      <div className="featureIcon">{getFeatureIcon(icon)}</div>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </article>
  );
}

function getFeatureIcon(icon: "customer" | "order" | "money" | "assistant") {
  if (icon === "customer") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="25" cy="24" r="10" />
        <path d="M9 53c3-11 10-16 20-16s17 5 20 16" />
        <circle cx="45" cy="27" r="7" />
        <path d="M42 39c6 1 10 5 12 12" />
      </svg>
    );
  }

  if (icon === "order") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M18 8h28l8 10v38H10V18l8-10z" />
        <path d="M10 18h44" />
        <path d="M22 29h20" />
        <path d="M22 40h14" />
      </svg>
    );
  }

  if (icon === "money") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect x="9" y="16" width="46" height="32" rx="7" />
        <circle cx="32" cy="32" r="8" />
        <path d="M18 26v12" />
        <path d="M46 26v12" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect x="14" y="21" width="36" height="28" rx="13" />
      <path d="M32 21v-8" />
      <circle cx="32" cy="11" r="4" />
      <circle cx="25" cy="35" r="3" />
      <circle cx="39" cy="35" r="3" />
      <path d="M27 43h10" />
      <path d="M14 35H8" />
      <path d="M56 35h-6" />
    </svg>
  );
}

function StoreButton({ type, title }: { type: "apple" | "play"; title: string }) {
  return (
    <a className="storeButton" href="#" aria-label={title}>
      {type === "apple" ? <AppleLogo /> : <PlayLogo />}
      <span>
        <strong>{title}</strong>
        <small>Yakında</small>
      </span>
    </a>
  );
}

function AppleLogo() {
  return (
    <svg viewBox="0 0 56 56" aria-hidden="true">
      <path fill="white" d="M37.7 29.8c-.1-5.1 4.2-7.6 4.4-7.7-2.4-3.5-6-4-7.3-4.1-3.1-.3-6 1.8-7.6 1.8-1.6 0-4-1.7-6.6-1.7-3.4.1-6.6 2-8.3 5.1-3.6 6.2-.9 15.4 2.6 20.4 1.7 2.5 3.8 5.3 6.5 5.2 2.6-.1 3.6-1.7 6.8-1.7 3.1 0 4.1 1.7 6.8 1.6 2.8 0 4.6-2.5 6.3-5 2-2.9 2.8-5.7 2.8-5.8-.1-.1-5.4-2.1-5.4-8.1z" />
      <path fill="white" d="M32.8 14.7c1.4-1.7 2.4-4.1 2.1-6.5-2.1.1-4.7 1.4-6.2 3.1-1.4 1.6-2.5 4-2.2 6.4 2.4.2 4.8-1.2 6.3-3z" />
    </svg>
  );
}

function PlayLogo() {
  return (
    <svg viewBox="0 0 56 56" aria-hidden="true">
      <defs>
        <linearGradient id="playOne" x1="10" y1="7" x2="34" y2="31" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00f0ff" />
          <stop offset="1" stopColor="#00c853" />
        </linearGradient>
        <linearGradient id="playTwo" x1="34" y1="28" x2="48" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffd54f" />
          <stop offset="1" stopColor="#ff9100" />
        </linearGradient>
        <linearGradient id="playThree" x1="10" y1="49" x2="34" y2="25" gradientUnits="userSpaceOnUse">
          <stop stopColor="#448aff" />
          <stop offset="1" stopColor="#7c4dff" />
        </linearGradient>
      </defs>
      <path d="M11 8.5v39l23-19.5L11 8.5z" fill="url(#playOne)" />
      <path d="M34 28l13 7.4c1.8-1.1 1.8-3.7 0-4.8L34 28z" fill="url(#playTwo)" />
      <path d="M11 47.5L34 28 11 36.8v10.7z" fill="url(#playThree)" />
    </svg>
  );
}
