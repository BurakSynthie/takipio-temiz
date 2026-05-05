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
    <main className="posterLanding">
      <div className="softBlob blobOne" />
      <div className="softBlob blobTwo" />
      <div className="dotPattern patternOne" />
      <div className="dotPattern patternTwo" />

      <header className="topHeader">
        <img src="/takipio-logo.png" alt="Takipio" className="topLogo" />
        <nav className="topNav">
          <a href="#features">Özellikler</a>
          <a href="#price">Fiyat</a>
          <a href="#gorki">Gorki</a>
          <a className="navCta" href="#waitlist">Erken Erişim</a>
        </nav>
      </header>

      <section className="heroPoster">
        <div className="centerHero">
          <div className="logoMark">
            <img src="/takipio-logo.png" alt="Takipio" />
          </div>

          <p className="preTitle">İŞİNİ BÜYÜTMEK ARTIK ÇOK KOLAY.</p>
          <h1>takipio</h1>
          <div className="brushText">HER ŞEY TEK PANELDE!</div>

          <div className="deviceStage">
            <LaptopMockup />
            <PhoneMockup />
          </div>
        </div>

        <aside className="leftStack">
          <Sticker className="stickerBig" title="SİPARİŞLERİN" strong="KONTROL ALTINDA!" />
          <MiniCard icon={<UserIcon />} title="MÜŞTERİLERİNİ" strong="YÖNET" />
          <BlackNote title="STOKLARINI" strong="TAKİP ET" icon={<CubeIcon />} />
          <MiniCard icon={<WalletIcon />} title="ÖDEMELERİNİ" strong="KOLAYCA YÖNET" tilted />
        </aside>

        <aside className="rightStack" id="price">
          <PriceTag />
          <div className="soonScribble">ÇOK<br /><span>YAKINDA!</span></div>
          <div className="gorkiCut" id="gorki">
            <img src="/gorki-hero.png" alt="Gorki" />
            <div className="gorkiBrush">GORKİ<br /><span>HER ZAMAN YANINDA!</span></div>
          </div>
        </aside>
      </section>

      <section className="featureStrip" id="features">
        <Feature icon={<BoltIcon />} title="Hızlı" text="Kurulum" />
        <Feature icon={<ShieldIcon />} title="Güvenli" text="Altyapı" />
        <Feature icon={<CloudIcon />} title="7/24" text="Erişim" />
        <Feature icon={<HeadsetIcon />} title="7/24" text="Destek" />
      </section>

      <section className="waitlistArea" id="waitlist">
        <div className="startBrush">İŞİNİ BÜYÜTMEYE<br />HEMEN BAŞLA!</div>

        <form className="waitlistForm" onSubmit={handleSubmit}>
          <div>
            <h2>Erken erişim listesine katıl</h2>
            <p>Açılışa özel <b>TAKIPIO10</b> indirim kodunu ilk sen al.</p>
          </div>
          <div className="formRow">
            <input
              type="email"
              placeholder="E-posta adresiniz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">{loading ? "Kaydediliyor..." : saved ? "Kaydedildi ✓" : "Kayıt Ol"}</button>
          </div>
          {errorMessage && <div className="message error">{errorMessage}</div>}
          {saved && <div className="message success">Kaydın alındı. Açılışta haber vereceğiz.</div>}
        </form>
      </section>

      <footer className="bottomDomain">
        <div className="domainPill">TAKIPIO.COM <GlobeIcon /></div>
        <p>Her yerden eriş, işini <b>kontrol et!</b></p>
      </footer>

      <style jsx global>{`
        :root {
          --blue: #0b62ff;
          --blue2: #00a6ff;
          --dark: #030917;
          --text: #050915;
          --muted: #667085;
          --soft: #eef5ff;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
          min-height: 100%;
          background: #f7fbff;
          color: var(--text);
          font-family: Inter, Arial, Helvetica, sans-serif;
          overflow-x: hidden;
        }

        a { color: inherit; text-decoration: none; }
        button, input { font-family: inherit; }

        .posterLanding {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          padding: 26px 34px 30px;
          background:
            radial-gradient(circle at 50% 10%, rgba(11,98,255,.08), transparent 26%),
            radial-gradient(circle at 84% 38%, rgba(11,98,255,.11), transparent 22%),
            linear-gradient(180deg, #ffffff 0%, #f5f9ff 58%, #ffffff 100%);
        }

        .softBlob {
          position: absolute;
          border-radius: 999px;
          background: rgba(11,98,255,.08);
          filter: blur(1px);
          pointer-events: none;
        }

        .blobOne { width: 410px; height: 410px; left: 135px; top: 80px; }
        .blobTwo { width: 360px; height: 360px; right: 120px; bottom: 150px; }

        .dotPattern {
          position: absolute;
          pointer-events: none;
          width: 260px;
          height: 160px;
          opacity: .22;
          background-image: radial-gradient(circle, var(--blue) 0 3px, transparent 3.5px);
          background-size: 16px 16px;
          transform: rotate(-22deg);
        }

        .patternOne { right: 250px; top: -10px; }
        .patternTwo { right: -40px; bottom: 185px; transform: rotate(18deg); }

        .topHeader {
          max-width: 1480px;
          margin: 0 auto;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 10;
        }

        .topLogo {
          width: 190px;
          height: 64px;
          object-fit: contain;
          object-position: left center;
          filter: drop-shadow(0 8px 18px rgba(11,98,255,.18));
        }

        .topNav {
          display: flex;
          align-items: center;
          gap: 30px;
          font-size: 15px;
          font-weight: 850;
          color: #1d2939;
        }

        .navCta {
          padding: 13px 18px;
          border-radius: 999px;
          color: white;
          background: var(--blue);
          box-shadow: 0 14px 28px rgba(11,98,255,.23);
        }

        .heroPoster {
          max-width: 1480px;
          min-height: 760px;
          margin: 0 auto;
          position: relative;
          display: grid;
          grid-template-columns: 280px 1fr 310px;
          gap: 18px;
          align-items: start;
          padding-top: 8px;
        }

        .centerHero {
          text-align: center;
          position: relative;
          z-index: 4;
        }

        .logoMark img {
          width: 54px;
          height: 54px;
          object-fit: contain;
          margin-bottom: 15px;
          filter: drop-shadow(0 8px 18px rgba(11,98,255,.22));
        }

        .preTitle {
          font-size: clamp(26px, 3vw, 44px);
          line-height: 1.05;
          font-weight: 950;
          letter-spacing: -1.2px;
          margin-top: 2px;
        }

        .preTitle::after {
          content: "ARTIK ÇOK KOLAY.";
          display: block;
          color: var(--blue);
          margin-top: 7px;
        }

        h1 {
          font-size: clamp(100px, 13vw, 190px);
          line-height: .82;
          letter-spacing: -12px;
          font-weight: 950;
          color: #030917;
          margin: 18px 0 8px;
          text-shadow: 0 22px 34px rgba(11,98,255,.10);
        }

        .brushText,
        .startBrush,
        .gorkiBrush {
          color: white;
          background: var(--blue);
          box-shadow: 0 14px 28px rgba(11,98,255,.22);
          transform: rotate(-2deg);
        }

        .brushText {
          width: max-content;
          max-width: 100%;
          margin: 0 auto;
          padding: 12px 28px 15px;
          font-size: clamp(22px, 3vw, 40px);
          font-weight: 950;
          letter-spacing: 2px;
          position: relative;
          clip-path: polygon(1% 16%, 100% 0, 97% 88%, 5% 100%);
        }

        .deviceStage {
          position: relative;
          height: 360px;
          margin-top: 34px;
          display: flex;
          align-items: end;
          justify-content: center;
        }

        .laptop {
          width: min(650px, 92%);
          height: 330px;
          border-radius: 24px 24px 15px 15px;
          padding: 16px 16px 24px;
          background: linear-gradient(135deg, #c8d2e1, #f3f6fb 48%, #8c9aac);
          box-shadow: 0 26px 55px rgba(7,20,47,.22);
          position: relative;
          transform: perspective(900px) rotateX(5deg);
        }

        .laptop::after {
          content: "";
          position: absolute;
          left: 8%;
          right: 8%;
          bottom: -16px;
          height: 22px;
          border-radius: 0 0 28px 28px;
          background: linear-gradient(180deg, #d8dee8, #8792a2);
          box-shadow: 0 14px 24px rgba(7,20,47,.16);
        }

        .screen {
          width: 100%;
          height: 100%;
          border-radius: 18px;
          overflow: hidden;
          background: #041020;
          border: 1px solid rgba(255,255,255,.12);
          box-shadow: inset 0 0 35px rgba(0,166,255,.08);
          text-align: left;
        }

        .screenTop {
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 18px;
          color: white;
          border-bottom: 1px solid rgba(255,255,255,.08);
        }

        .screenBrand { display: flex; align-items: center; gap: 9px; font-weight: 900; }
        .screenBrand img { width: 26px; height: 26px; object-fit: contain; }
        .screenDots { display: flex; gap: 7px; }
        .screenDots span { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,.34); }

        .screenBody { display: grid; grid-template-columns: 140px 1fr; min-height: calc(100% - 54px); }
        .screenMenu { padding: 16px 12px; border-right: 1px solid rgba(255,255,255,.08); display: grid; gap: 9px; align-content: start; }
        .screenMenu span { height: 28px; border-radius: 8px; background: rgba(255,255,255,.07); }
        .screenMenu span:first-child { background: var(--blue); }

        .screenContent { padding: 16px; }
        .dashCards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 13px; }
        .dashCard { min-height: 70px; padding: 12px; border-radius: 12px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08); color: white; }
        .dashCard small { color: #8fb7ff; display: block; margin-bottom: 8px; }
        .dashCard b { font-size: 20px; }
        .graph { height: 130px; border-radius: 14px; background: linear-gradient(180deg, rgba(11,98,255,.20), rgba(11,98,255,.03)); border: 1px solid rgba(255,255,255,.08); position: relative; overflow: hidden; }
        .graph svg { width: 100%; height: 100%; }

        .phone {
          width: 155px;
          height: 305px;
          border-radius: 30px;
          padding: 10px;
          background: linear-gradient(135deg, #1a2433, #050b15);
          box-shadow: 0 22px 40px rgba(7,20,47,.28);
          position: absolute;
          right: 10%;
          bottom: 5px;
          transform: rotate(-2deg);
          border: 3px solid #141b27;
        }

        .phoneScreen {
          height: 100%;
          border-radius: 22px;
          background: #031020;
          padding: 14px 10px;
          color: white;
          overflow: hidden;
        }

        .phoneLogo { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 900; margin-bottom: 12px; }
        .phoneLogo img { width: 20px; height: 20px; object-fit: contain; }
        .phoneGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
        .phoneCard { border-radius: 10px; padding: 9px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.08); }
        .phoneCard small { display: block; color: #85a7dd; font-size: 9px; margin-bottom: 5px; }
        .phoneCard b { font-size: 14px; }
        .phoneList { margin-top: 10px; display: grid; gap: 7px; }
        .phoneList span { height: 28px; border-radius: 9px; background: rgba(255,255,255,.07); }

        .leftStack,
        .rightStack {
          position: relative;
          z-index: 5;
          min-height: 670px;
        }

        .sticker,
        .miniCard,
        .blackNote,
        .priceTag {
          border-radius: 22px;
          box-shadow: 0 16px 34px rgba(7,20,47,.13);
        }

        .sticker {
          padding: 23px 20px;
          background: rgba(255,255,255,.78);
          border: 2px dashed rgba(11,98,255,.38);
          transform: rotate(-4deg);
          backdrop-filter: blur(8px);
        }

        .sticker p,
        .miniCard p,
        .blackNote p { font-size: 24px; font-weight: 950; line-height: 1.02; }
        .sticker strong,
        .miniCard strong,
        .blackNote strong { display: block; color: var(--blue); font-size: 34px; line-height: .98; margin-top: 4px; }
        .stickerBig { margin-top: 58px; }

        .miniCard {
          margin-top: 40px;
          padding: 19px 20px;
          display: flex;
          gap: 13px;
          align-items: center;
          background: white;
          border: 2px dashed rgba(11,98,255,.55);
          transform: rotate(-5deg);
        }

        .miniCard.tilted { transform: rotate(-9deg); margin-top: 42px; }
        .miniIcon { width: 48px; height: 48px; color: var(--blue); flex: 0 0 auto; }
        .miniIcon svg { width: 48px; height: 48px; fill: none; stroke: currentColor; stroke-width: 2.7; stroke-linecap: round; stroke-linejoin: round; }
        .miniCard p { font-size: 18px; }
        .miniCard strong { font-size: 25px; }

        .blackNote {
          width: 210px;
          margin-top: 44px;
          padding: 27px 21px;
          background: #0b111d;
          color: white;
          transform: rotate(-5deg);
        }

        .blackNote strong { font-size: 30px; }
        .blackNote .noteIcon { width: 45px; height: 45px; margin-top: 18px; color: white; }
        .blackNote svg { width: 45px; height: 45px; fill: none; stroke: currentColor; stroke-width: 2.5; }

        .priceTag {
          margin-top: 42px;
          margin-left: 16px;
          width: 260px;
          min-height: 220px;
          padding: 18px;
          background: #09111e;
          color: white;
          transform: rotate(5deg);
          position: relative;
        }

        .priceRibbon {
          width: max-content;
          padding: 10px 15px;
          border-radius: 8px;
          color: white;
          background: var(--blue);
          font-size: 25px;
          font-weight: 950;
          transform: rotate(2deg);
          margin: -14px auto 14px;
          box-shadow: 0 12px 20px rgba(11,98,255,.25);
        }

        .priceTag p { font-size: 24px; font-weight: 900; line-height: 1.1; text-align: center; }
        .oldPrice { display: block; color: rgba(255,255,255,.36); font-size: 55px; font-weight: 950; text-decoration: line-through; text-decoration-color: var(--blue); text-decoration-thickness: 7px; text-align: center; margin: 4px 0 -6px; }
        .newPrice { display: block; color: white; font-size: 92px; line-height: .95; font-weight: 950; text-align: center; text-shadow: 0 0 24px rgba(11,98,255,.85); }

        .soonScribble {
          margin-top: 60px;
          font-size: 54px;
          line-height: .84;
          font-weight: 950;
          transform: rotate(-7deg);
        }
        .soonScribble span { color: var(--blue); }

        .gorkiCut {
          position: absolute;
          right: 0;
          bottom: 0;
          width: 295px;
          height: 300px;
        }

        .gorkiCut img {
          position: absolute;
          right: 8px;
          bottom: 82px;
          width: 190px;
          height: 190px;
          object-fit: contain;
          filter: drop-shadow(0 18px 25px rgba(7,20,47,.18));
          animation: gorkiFloat 4.8s ease-in-out infinite;
        }

        .gorkiBrush {
          position: absolute;
          right: 0;
          bottom: 8px;
          padding: 17px 19px;
          background: #050915;
          clip-path: polygon(0 13%, 100% 0, 94% 100%, 5% 88%);
          font-size: 31px;
          font-weight: 950;
          line-height: 1;
          text-align: center;
          transform: rotate(-4deg);
        }
        .gorkiBrush span { font-size: 21px; }

        .featureStrip {
          max-width: 880px;
          margin: -8px auto 0;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          position: relative;
          z-index: 6;
        }

        .featureItem {
          min-height: 92px;
          display: grid;
          place-items: center;
          text-align: center;
          border-right: 2px dashed rgba(11,98,255,.3);
        }
        .featureItem:last-child { border-right: 0; }
        .featureIcon { width: 38px; height: 38px; color: var(--blue); margin-bottom: 5px; }
        .featureIcon svg { width: 38px; height: 38px; fill: none; stroke: currentColor; stroke-width: 2.7; stroke-linecap: round; stroke-linejoin: round; }
        .featureItem h3 { color: var(--blue); font-size: 20px; line-height: 1; font-weight: 950; text-transform: uppercase; }
        .featureItem p { color: #111827; font-size: 16px; font-weight: 900; text-transform: uppercase; margin-top: 4px; }

        .waitlistArea {
          max-width: 1180px;
          margin: 30px auto 0;
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 24px;
          align-items: center;
          position: relative;
          z-index: 7;
        }

        .startBrush {
          padding: 22px 28px;
          font-size: 33px;
          line-height: 1.05;
          font-weight: 950;
          clip-path: polygon(2% 8%, 100% 0, 95% 92%, 0 100%);
        }

        .waitlistForm {
          padding: 24px;
          border-radius: 28px;
          background: white;
          border: 1px solid rgba(11,98,255,.18);
          box-shadow: 0 22px 45px rgba(7,20,47,.10);
        }
        .waitlistForm h2 { font-size: 28px; letter-spacing: -1px; margin-bottom: 6px; }
        .waitlistForm p { color: var(--muted); font-size: 16px; margin-bottom: 17px; }
        .waitlistForm b { color: var(--blue); }
        .formRow { display: grid; grid-template-columns: 1fr 190px; gap: 12px; }
        .formRow input { height: 58px; border: 1px solid rgba(11,98,255,.20); border-radius: 16px; outline: none; padding: 0 18px; font-size: 17px; color: var(--text); background: #f8fbff; }
        .formRow button { height: 58px; border: 0; border-radius: 16px; background: var(--blue); color: white; font-size: 18px; font-weight: 950; cursor: pointer; box-shadow: 0 16px 28px rgba(11,98,255,.23); }

        .message { margin-top: 12px; padding: 12px 14px; border-radius: 14px; font-size: 14px; font-weight: 750; }
        .message.error { color: #b42318; background: #fff1f0; border: 1px solid #ffdad6; }
        .message.success { color: #067647; background: #ecfdf3; border: 1px solid #abefc6; }

        .bottomDomain {
          max-width: 760px;
          margin: 28px auto 0;
          text-align: center;
          position: relative;
          z-index: 8;
        }
        .domainPill { height: 72px; display: inline-flex; align-items: center; justify-content: center; gap: 14px; padding: 0 48px; border: 3px solid var(--blue); border-radius: 999px; background: white; color: #050915; font-size: 49px; font-weight: 950; letter-spacing: 1px; box-shadow: 0 16px 35px rgba(7,20,47,.10); }
        .domainPill svg { width: 43px; height: 43px; color: var(--blue); fill: none; stroke: currentColor; stroke-width: 2.4; }
        .bottomDomain p { margin-top: 10px; color: #111827; font-size: 18px; font-weight: 850; text-transform: uppercase; }
        .bottomDomain b { color: var(--blue); }

        @keyframes gorkiFloat {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        @media (max-width: 1280px) {
          .heroPoster { grid-template-columns: 230px 1fr 250px; }
          .sticker p { font-size: 20px; }
          .sticker strong { font-size: 27px; }
          .priceTag { width: 225px; }
          .newPrice { font-size: 76px; }
        }

        @media (max-width: 980px) {
          .posterLanding { padding: 20px 16px 26px; }
          .topNav { display: none; }
          .heroPoster { grid-template-columns: 1fr; min-height: auto; }
          .leftStack, .rightStack { min-height: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .stickerBig, .miniCard, .blackNote, .priceTag, .soonScribble { margin: 0; transform: rotate(0); width: auto; }
          .gorkiCut { position: relative; width: 100%; height: 260px; grid-column: 1 / -1; }
          .featureStrip { grid-template-columns: repeat(2, 1fr); margin-top: 20px; }
          .featureItem { border-right: 0; border-bottom: 2px dashed rgba(11,98,255,.20); }
          .waitlistArea { grid-template-columns: 1fr; }
          .deviceStage { height: 330px; }
          .phone { right: 1%; }
        }

        @media (max-width: 620px) {
          .topLogo { width: 160px; }
          h1 { letter-spacing: -6px; }
          .leftStack, .rightStack { grid-template-columns: 1fr; }
          .deviceStage { height: 275px; }
          .laptop { height: 265px; }
          .screenBody { grid-template-columns: 88px 1fr; }
          .dashCards { grid-template-columns: 1fr; }
          .dashCards .dashCard:nth-child(2), .dashCards .dashCard:nth-child(3) { display: none; }
          .phone { width: 118px; height: 230px; right: -5px; }
          .featureStrip { grid-template-columns: 1fr 1fr; }
          .formRow { grid-template-columns: 1fr; }
          .domainPill { height: 58px; font-size: 31px; padding: 0 24px; }
          .bottomDomain p { font-size: 14px; }
        }
      `}</style>
    </main>
  );
}

function LaptopMockup() {
  return (
    <div className="laptop">
      <div className="screen">
        <div className="screenTop">
          <div className="screenBrand"><img src="/takipio-logo.png" alt="" /> takipio</div>
          <div className="screenDots"><span /><span /><span /></div>
        </div>
        <div className="screenBody">
          <div className="screenMenu"><span /><span /><span /><span /><span /></div>
          <div className="screenContent">
            <div className="dashCards">
              <div className="dashCard"><small>Toplam Gelir</small><b>₺125.250</b></div>
              <div className="dashCard"><small>Sipariş</small><b>128</b></div>
              <div className="dashCard"><small>Müşteri</small><b>89</b></div>
            </div>
            <div className="graph">
              <svg viewBox="0 0 480 150" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 124 C40 96 60 83 96 96 C140 113 142 55 190 72 C230 86 230 35 278 54 C330 75 330 18 382 34 C425 47 430 8 480 18" fill="none" stroke="#0b62ff" strokeWidth="6" strokeLinecap="round" />
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
    <div className="phone">
      <div className="phoneScreen">
        <div className="phoneLogo"><img src="/takipio-logo.png" alt="" /> takipio</div>
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

function Sticker({ title, strong, className = "" }: { title: string; strong: string; className?: string }) {
  return <div className={`sticker ${className}`}><p>{title}</p><strong>{strong}</strong></div>;
}

function MiniCard({ icon, title, strong, tilted = false }: { icon: React.ReactNode; title: string; strong: string; tilted?: boolean }) {
  return <div className={`miniCard ${tilted ? "tilted" : ""}`}><span className="miniIcon">{icon}</span><div><p>{title}</p><strong>{strong}</strong></div></div>;
}

function BlackNote({ title, strong, icon }: { title: string; strong: string; icon: React.ReactNode }) {
  return <div className="blackNote"><p>{title}</p><strong>{strong}</strong><div className="noteIcon">{icon}</div></div>;
}

function PriceTag() {
  return (
    <div className="priceTag">
      <div className="priceRibbon">AÇILIŞA ÖZEL</div>
      <p>İLK AY SADECE</p>
      <span className="oldPrice">₺99</span>
      <span className="newPrice">₺89</span>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="featureItem"><span className="featureIcon">{icon}</span><h3>{title}</h3><p>{text}</p></div>;
}

function UserIcon() { return <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="4" /><path d="M2 22c1.2-5.3 4.2-8 8-8s6.8 2.7 8 8" /><path d="M17 11a4 4 0 1 0-1.5-7.7" /><path d="M18 14c2.4.7 3.8 2.9 4.5 6" /></svg>; }
function CubeIcon() { return <svg viewBox="0 0 24 24"><path d="M12 2l9 5-9 5-9-5 9-5z" /><path d="M3 7v10l9 5 9-5V7" /><path d="M12 12v10" /></svg>; }
function WalletIcon() { return <svg viewBox="0 0 24 24"><path d="M3 7h18v12H3z" /><path d="M16 12h5v4h-5a2 2 0 0 1 0-4z" /><path d="M3 7l3-4h12l3 4" /></svg>; }
function BoltIcon() { return <svg viewBox="0 0 24 24"><path d="M13 2L3 14h8l-1 8 11-14h-8l0-6z" /></svg>; }
function ShieldIcon() { return <svg viewBox="0 0 24 24"><path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-4z" /><path d="M8.5 12l2.3 2.3 4.8-5" /></svg>; }
function CloudIcon() { return <svg viewBox="0 0 24 24"><path d="M17.5 19H8a5 5 0 1 1 1-9.9A7 7 0 0 1 22 12.5 4.5 4.5 0 0 1 17.5 19z" /><path d="M12 15V8" /><path d="M9 11l3-3 3 3" /></svg>; }
function HeadsetIcon() { return <svg viewBox="0 0 24 24"><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><path d="M4 13h4v6H4z" /><path d="M16 13h4v6h-4z" /><path d="M16 21h-4" /></svg>; }
function GlobeIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15 15 0 0 1 0 20" /><path d="M12 2a15 15 0 0 0 0 20" /></svg>; }
