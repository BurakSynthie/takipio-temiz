"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type DemoTab = "overview" | "orders" | "customers" | "payments";

const demoTabs: { key: DemoTab; label: string; value: string; helper: string }[] = [
  { key: "overview", label: "Genel Bakış", value: "₺125.250", helper: "Haftalık ciro" },
  { key: "orders", label: "Siparişler", value: "128", helper: "Aktif sipariş" },
  { key: "customers", label: "Müşteriler", value: "89", helper: "Kayıtlı müşteri" },
  { key: "payments", label: "Ödemeler", value: "₺18.900", helper: "Bekleyen ödeme" },
];

const gorkiMessages = [
  "Bugün 3 sipariş teslimata yaklaşıyor.",
  "2 ödeme için hatırlatma gönderebilirsin.",
  "Bu hafta gelirin %12 yükseldi.",
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
    const timer = setInterval(() => {
      setMessageIndex((current) => (current + 1) % gorkiMessages.length);
    }, 2600);

    return () => clearInterval(timer);
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
      <div className="grain" />

      <header className="navBar">
        <a className="brand" href="#top" aria-label="Takipio">
          <img src="/takipio-logo.png" alt="Takipio" />
        </a>

        <nav className="navLinks">
          <a href="#product">Ürün</a>
          <a href="#assistant">Gorki</a>
          <a href="#pricing">Fiyat</a>
          <a href="https://instagram.com/takipiocom" target="_blank" rel="noreferrer" className="instagramNav">
            <InstagramIcon /> @takipiocom
          </a>
          <a href="#waitlist" className="navCta">Erken erişim</a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="heroCopy">
          <div className="statusPill">
            <span /> Yeni nesil işletme asistanı hazırlanıyor
          </div>

          <h1>
            İşini kontrol etmeden <span>büyütemezsin.</span>
          </h1>

          <p className="heroText">
            Takipio; sipariş, müşteri, stok ve ödemelerini tek ekranda toplayarak işletmene netlik kazandıran premium takip panelidir.
          </p>

          <form className="waitlistCard" id="waitlist" onSubmit={handleSubmit}>
            <div className="waitlistHeader">
              <div className="mailIcon"><MailIcon /></div>
              <div>
                <h2>Erken erişim listesine katıl</h2>
                <p>Açılışta <b>TAKIPIO10</b> indirim kodu ilk kayıt olanlara gönderilecek.</p>
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
              <button type="submit">{loading ? "Kaydediliyor..." : saved ? "Kaydedildi ✓" : "Kayıt Ol"}</button>
            </div>

            {errorMessage && <div className="formMessage error">{errorMessage}</div>}
            {saved && <div className="formMessage success">Kaydın alındı. Açılışta haber vereceğiz.</div>}

            <div className="formMeta">
              <span><CheckIcon /> İlk ay indirim</span>
              <span><CheckIcon /> Gorki asistan dahil</span>
              <span><CheckIcon /> Spam yok</span>
            </div>
          </form>

          <div className="proofBar">
            <div><strong>15</strong><span>müşteriye kadar ücretsiz</span></div>
            <div><strong>7/24</strong><span>her yerden erişim</span></div>
            <div><strong>AI</strong><span>Gorki iş özetleri</span></div>
          </div>
        </div>

        <div className="heroShowcase" id="product">
          <div className="demoShell">
            <div className="ambientRing" />
            <LaptopMockup activeTab={activeTab} setActiveTab={setActiveTab} />
            <PhoneMockup activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          <aside className="sideColumn">
            <PricePanel />
            <GorkiPanel message={gorkiMessages[messageIndex]} />
          </aside>
        </div>
      </section>

      <section className="featureGrid">
        <FeatureCard icon={<OrdersIcon />} title="Sipariş akışı" text="Her işin hangi aşamada olduğunu tek bakışta gör." />
        <FeatureCard icon={<UsersIcon />} title="Müşteri hafızası" text="Notlar, geçmiş işler ve takip durumları aynı yerde dursun." />
        <FeatureCard icon={<WalletIcon />} title="Ödeme netliği" text="Bekleyen ve alınan ödemeleri karıştırmadan yönet." />
        <FeatureCard icon={<CubeIcon />} title="Stok kontrolü" text="Azalan ürünleri ve güncel stok durumunu düzenli takip et." />
      </section>

      <section className="bottomBand">
        <a className="domainCard" href="https://takipio.com">
          <GlobeIcon />
          <div>
            <h3>takipio.com</h3>
            <p>Canlı bekleme listesi aktif.</p>
          </div>
        </a>

        <a className="instagramCard" href="https://instagram.com/takipiocom" target="_blank" rel="noreferrer">
          <InstagramIcon />
          <div>
            <h3>@takipiocom</h3>
            <p>Lansman duyurularını Instagram’dan takip et.</p>
          </div>
        </a>

        <div className="trustCard">
          <div><ShieldIcon /><span>Güvenli altyapı</span></div>
          <div><BoltIcon /><span>Hızlı kullanım</span></div>
          <div><HeadsetIcon /><span>Destek hazır</span></div>
        </div>
      </section>

      <style jsx global>{`
        :root {
          --bg: #f8fbff;
          --white: #ffffff;
          --ink: #06101f;
          --muted: #667085;
          --soft: #eef5ff;
          --blue: #0b63ff;
          --blue2: #00a8ff;
          --cyan: #49d9ff;
          --line: rgba(11, 99, 255, 0.15);
          --shadow: 0 28px 70px rgba(15, 32, 64, 0.12);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; background: var(--bg); }
        body { min-height: 100vh; background: var(--bg); color: var(--ink); overflow-x: hidden; font-family: Inter, Arial, Helvetica, sans-serif; }
        a { color: inherit; text-decoration: none; }
        button, input { font-family: inherit; }
        button { cursor: pointer; }
        svg { fill: none; stroke: currentColor; stroke-width: 2.35; stroke-linecap: round; stroke-linejoin: round; }

        .takipioPremium {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          padding: 28px 34px 38px;
          background:
            radial-gradient(circle at 22% 18%, rgba(11, 99, 255, 0.08), transparent 30%),
            radial-gradient(circle at 80% 22%, rgba(73, 217, 255, 0.15), transparent 28%),
            radial-gradient(circle at 55% 80%, rgba(11, 99, 255, 0.07), transparent 32%),
            linear-gradient(180deg, #ffffff 0%, #f6faff 52%, #ffffff 100%);
        }

        .softGrid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.35;
          background-image:
            linear-gradient(rgba(11, 99, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(11, 99, 255, 0.05) 1px, transparent 1px);
          background-size: 78px 78px;
          mask-image: radial-gradient(circle at 58% 38%, black 0%, transparent 72%);
        }

        .grain {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.16;
          background-image: radial-gradient(circle, rgba(11, 99, 255, 0.58) 0 1px, transparent 1.4px);
          background-size: 94px 94px;
        }

        .mesh {
          position: absolute;
          pointer-events: none;
          border-radius: 999px;
          filter: blur(22px);
        }

        .meshOne { width: 440px; height: 440px; left: 110px; top: 100px; background: rgba(11, 99, 255, 0.055); }
        .meshTwo { width: 460px; height: 460px; right: 110px; top: 90px; background: rgba(73, 217, 255, 0.12); }
        .meshThree { width: 360px; height: 360px; right: 36%; bottom: -80px; background: rgba(11, 99, 255, 0.06); }

        .navBar {
          max-width: 1480px;
          height: 74px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 20;
        }

        .brand { width: 205px; height: 72px; display: flex; align-items: center; }
        .brand img { width: 198px; max-height: 72px; object-fit: contain; object-position: left center; filter: drop-shadow(0 12px 22px rgba(11,99,255,.18)); }

        .navLinks { display: flex; align-items: center; gap: 28px; font-size: 15px; font-weight: 850; color: #1d2939; }
        .navLinks a { transition: .24s ease; }
        .navLinks a:hover { color: var(--blue); transform: translateY(-1px); }
        .instagramNav { display: inline-flex; align-items: center; gap: 7px; padding: 10px 12px; border: 1px solid rgba(11,99,255,.12); border-radius: 999px; background: rgba(255,255,255,.72); }
        .instagramNav svg { width: 18px; height: 18px; color: #e1306c; }
        .navCta { padding: 13px 18px; border-radius: 999px; color: white !important; background: linear-gradient(135deg, var(--blue), var(--blue2)); box-shadow: 0 16px 28px rgba(11,99,255,.22); }

        .hero {
          max-width: 1480px;
          min-height: 790px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(480px, 0.9fr) minmax(800px, 1.38fr);
          gap: 56px;
          align-items: center;
          position: relative;
          z-index: 4;
        }

        .heroCopy { position: relative; z-index: 8; padding-top: 10px; }
        .statusPill { width: max-content; max-width: 100%; display: inline-flex; align-items: center; gap: 10px; padding: 11px 16px; border-radius: 999px; color: var(--blue); background: rgba(255,255,255,.76); border: 1px solid var(--line); box-shadow: 0 14px 30px rgba(11,99,255,.08); font-size: 14px; font-weight: 900; letter-spacing: .2px; backdrop-filter: blur(12px); margin-bottom: 26px; }
        .statusPill span { width: 9px; height: 9px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 0 rgba(34,197,94,.55); animation: pulse 1.8s ease-in-out infinite; }

        h1 { max-width: 760px; font-size: clamp(56px, 5.3vw, 90px); line-height: .96; letter-spacing: -5px; font-weight: 950; color: var(--ink); margin-bottom: 23px; }
        h1 span { display: block; color: var(--blue); text-shadow: 0 12px 30px rgba(11,99,255,.16); }
        .heroText { max-width: 650px; color: var(--muted); font-size: 21px; line-height: 1.58; letter-spacing: -.4px; margin-bottom: 28px; }

        .waitlistCard { width: min(690px, 100%); border-radius: 30px; padding: 24px; background: rgba(255,255,255,.82); border: 1px solid rgba(11,99,255,.16); box-shadow: var(--shadow); backdrop-filter: blur(18px); transition: .32s ease; }
        .waitlistCard:hover { transform: translateY(-4px); box-shadow: 0 38px 90px rgba(15,32,64,.16), 0 0 0 6px rgba(11,99,255,.035); }
        .waitlistHeader { display: flex; align-items: center; gap: 16px; margin-bottom: 18px; }
        .mailIcon { width: 56px; height: 56px; flex: 0 0 auto; border-radius: 19px; display: grid; place-items: center; color: white; background: linear-gradient(135deg, var(--blue), var(--blue2)); box-shadow: 0 16px 30px rgba(11,99,255,.24); }
        .mailIcon svg { width: 28px; height: 28px; }
        .waitlistHeader h2 { font-size: 25px; line-height: 1.1; letter-spacing: -.9px; margin-bottom: 6px; }
        .waitlistHeader p { color: var(--muted); font-size: 15px; line-height: 1.45; }
        .waitlistHeader b { color: var(--blue); }
        .formRow { display: grid; grid-template-columns: 1fr 172px; gap: 12px; margin-bottom: 12px; }
        .formRow input { height: 59px; border: 1px solid rgba(11,99,255,.18); border-radius: 18px; outline: none; background: #f7fbff; color: var(--ink); padding: 0 18px; font-size: 16px; transition: .25s ease; }
        .formRow input:focus { border-color: rgba(11,99,255,.48); box-shadow: 0 0 0 5px rgba(11,99,255,.08); background: white; }
        .formRow button { height: 59px; border: 0; border-radius: 18px; background: linear-gradient(135deg, var(--blue), var(--blue2)); color: white; font-size: 17px; font-weight: 950; box-shadow: 0 16px 28px rgba(11,99,255,.24); transition: .25s ease; }
        .formRow button:hover { transform: translateY(-2px); box-shadow: 0 22px 38px rgba(11,99,255,.3); }
        .formMessage { margin: 0 0 12px; padding: 12px 14px; border-radius: 14px; font-size: 14px; font-weight: 760; }
        .formMessage.error { color: #b42318; background: #fff1f0; border: 1px solid #ffdad6; }
        .formMessage.success { color: #067647; background: #ecfdf3; border: 1px solid #abefc6; }
        .formMeta { display: flex; flex-wrap: wrap; gap: 10px; }
        .formMeta span { display: inline-flex; align-items: center; gap: 6px; color: #344054; font-size: 13px; font-weight: 800; }
        .formMeta svg { width: 16px; height: 16px; color: #12b76a; }

        .proofBar { width: min(690px, 100%); display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 17px; }
        .proofBar div { min-height: 82px; border-radius: 24px; padding: 15px; background: rgba(255,255,255,.68); border: 1px solid rgba(11,99,255,.12); box-shadow: 0 16px 35px rgba(7,20,47,.06); transition: .25s ease; }
        .proofBar div:hover { transform: translateY(-4px); border-color: rgba(11,99,255,.3); background: white; }
        .proofBar strong { display: block; color: var(--blue); font-size: 24px; line-height: 1; margin-bottom: 7px; }
        .proofBar span { display: block; color: #475467; font-size: 13px; line-height: 1.35; font-weight: 760; }

        .heroShowcase { min-height: 730px; position: relative; display: grid; grid-template-columns: minmax(560px, 1fr) 250px; gap: 26px; align-items: center; }
        .demoShell { position: relative; min-height: 620px; display: flex; align-items: center; justify-content: center; perspective: 1250px; }
        .ambientRing { position: absolute; width: 680px; height: 410px; border-radius: 50%; background: radial-gradient(ellipse at center, rgba(11,99,255,.12), transparent 64%); filter: blur(3px); transform: rotate(-8deg); }

        .sideColumn { position: relative; z-index: 20; display: grid; gap: 18px; align-content: center; }
        .pricePanel { position: relative; overflow: hidden; min-height: 292px; border-radius: 32px; padding: 20px; color: white; background: radial-gradient(circle at 50% 0%, rgba(73,217,255,.28), transparent 36%), linear-gradient(180deg, #071026 0%, #050914 100%); border: 1px solid rgba(255,255,255,.13); box-shadow: 0 30px 70px rgba(7,20,47,.25); transition: .32s ease; }
        .pricePanel:hover { transform: translateY(-8px); box-shadow: 0 42px 90px rgba(7,20,47,.32); }
        .priceShine { position: absolute; inset: -70px auto auto -100px; width: 130px; height: 460px; background: linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent); transform: rotate(28deg); animation: shine 4.6s ease-in-out infinite; }
        .priceLabel { width: max-content; margin: 0 auto 18px; padding: 10px 12px; border-radius: 13px; background: linear-gradient(135deg, var(--blue), var(--blue2)); font-size: 15px; font-weight: 950; box-shadow: 0 14px 25px rgba(11,99,255,.32); }
        .pricePanel p { text-align: center; text-transform: uppercase; color: rgba(255,255,255,.82); font-size: 15px; font-weight: 950; }
        .priceNumbers { text-align: center; margin: 5px 0 9px; }
        .priceNumbers del { display: block; color: rgba(255,255,255,.34); font-size: 42px; font-weight: 950; line-height: 1; text-decoration-color: var(--blue); text-decoration-thickness: 5px; }
        .priceNumbers strong { display: block; color: white; font-size: 72px; line-height: .95; text-shadow: 0 0 24px rgba(11,99,255,.9); }
        .pricePanel small { display: block; color: rgba(255,255,255,.62); text-align: center; font-size: 13px; font-weight: 750; margin-bottom: 13px; }
        .pricePanel a { width: 100%; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 15px; color: white; font-size: 13px; font-weight: 950; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.16); transition: .25s ease; }
        .pricePanel a:hover { background: var(--blue); }

        .gorkiPanel { min-height: 280px; border-radius: 32px; padding: 18px; background: rgba(255,255,255,.82); border: 1px solid rgba(11,99,255,.15); box-shadow: var(--shadow); overflow: hidden; position: relative; }
        .gorkiPanel::before { content: ""; position: absolute; width: 190px; height: 190px; border-radius: 50%; right: -80px; top: -70px; background: rgba(11,99,255,.08); }
        .gorkiImageWrap { height: 142px; display: flex; justify-content: center; align-items: center; position: relative; z-index: 2; }
        .gorkiImageWrap img { width: 142px; height: 142px; object-fit: contain; filter: drop-shadow(0 18px 24px rgba(7,20,47,.14)); animation: gorkiFloat 4.8s ease-in-out infinite; }
        .gorkiTitle { display: flex; align-items: center; gap: 8px; color: var(--blue); font-size: 13px; font-weight: 950; margin-bottom: 9px; position: relative; z-index: 2; }
        .gorkiTitle svg { width: 17px; height: 17px; }
        .gorkiMessage { position: relative; z-index: 2; min-height: 72px; padding: 13px; border-radius: 18px; color: #1d2939; background: #f7fbff; border: 1px solid rgba(11,99,255,.1); font-size: 14px; line-height: 1.42; font-weight: 800; }

        .laptopMock { width: min(660px, 94%); height: 392px; position: relative; border-radius: 32px 32px 20px 20px; padding: 17px 17px 31px; background: linear-gradient(135deg, #c4cfdd, #ffffff 48%, #8d99aa); box-shadow: 0 40px 90px rgba(7,20,47,.22); transform: rotateX(4deg) rotateY(-8deg) rotateZ(-1deg); transition: .35s ease; z-index: 3; }
        .demoShell:hover .laptopMock { transform: rotateX(2deg) rotateY(-4deg) rotateZ(0deg) translateY(-8px); }
        .laptopMock::after { content: ""; position: absolute; left: 7%; right: 7%; bottom: -18px; height: 26px; border-radius: 0 0 36px 36px; background: linear-gradient(180deg, #e6ecf4, #7d8796); box-shadow: 0 18px 30px rgba(7,20,47,.16); }
        .laptopScreen { width: 100%; height: 100%; overflow: hidden; border-radius: 22px; background: #041020; border: 1px solid rgba(255,255,255,.12); box-shadow: inset 0 0 42px rgba(0,168,255,.09); text-align: left; }
        .screenTop { height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 18px; color: white; border-bottom: 1px solid rgba(255,255,255,.08); }
        .screenBrand { display: flex; align-items: center; gap: 9px; font-weight: 950; }
        .screenBrand img { width: 25px; height: 25px; object-fit: contain; }
        .screenActions { display: flex; gap: 7px; }
        .screenActions span { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,.3); }
        .screenBody { height: calc(100% - 56px); display: grid; grid-template-columns: 156px 1fr; }
        .mockMenu { padding: 16px 12px; border-right: 1px solid rgba(255,255,255,.08); display: grid; align-content: start; gap: 10px; }
        .mockMenu button { min-height: 34px; border: 0; border-radius: 10px; background: rgba(255,255,255,.07); color: rgba(255,255,255,.66); font-size: 11px; font-weight: 800; transition: .22s ease; }
        .mockMenu button:hover, .mockMenu button.active { color: white; background: linear-gradient(135deg, var(--blue), var(--blue2)); box-shadow: 0 10px 20px rgba(11,99,255,.22); }
        .mockContent { padding: 16px; }
        .mockCards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 12px; }
        .mockCard { min-height: 76px; padding: 12px; border-radius: 14px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08); color: white; transition: .22s ease; }
        .mockCard:hover { background: rgba(255,255,255,.1); transform: translateY(-3px); }
        .mockCard small { display: block; color: #8fb7ff; font-size: 11px; margin-bottom: 8px; }
        .mockCard b { font-size: 20px; }
        .mockGraph { height: 150px; border-radius: 16px; overflow: hidden; background: linear-gradient(180deg, rgba(11,99,255,.2), rgba(11,99,255,.03)); border: 1px solid rgba(255,255,255,.08); }
        .mockGraph svg { width: 100%; height: 100%; }
        .mockList { margin-top: 11px; display: grid; gap: 8px; }
        .mockList div { min-height: 36px; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; border-radius: 12px; color: rgba(255,255,255,.78); background: rgba(255,255,255,.055); border: 1px solid rgba(255,255,255,.06); font-size: 12px; }
        .mockList b { color: white; }

        .phoneMock { position: absolute; right: -22px; bottom: 40px; width: 168px; height: 334px; border-radius: 36px; padding: 10px; background: linear-gradient(135deg, #1c2533, #050b15); border: 3px solid #101827; box-shadow: 0 30px 60px rgba(7,20,47,.24); transform: rotate(3deg); transition: .35s ease; z-index: 6; }
        .demoShell:hover .phoneMock { transform: rotate(0deg) translateY(-12px) translateX(8px); }
        .phoneScreen { height: 100%; border-radius: 27px; overflow: hidden; background: #041020; color: white; padding: 14px 10px; }
        .phoneHead { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; font-size: 12px; font-weight: 900; }
        .phoneHead span { display: flex; align-items: center; gap: 6px; }
        .phoneHead img { width: 20px; height: 20px; object-fit: contain; }
        .phoneTabs { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px; }
        .phoneTabs button { height: 25px; border: 0; border-radius: 8px; background: rgba(255,255,255,.07); color: rgba(255,255,255,.62); font-size: 9px; font-weight: 800; }
        .phoneTabs button.active { color: white; background: var(--blue); }
        .phoneGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
        .phoneCard { min-height: 62px; border-radius: 13px; padding: 9px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.08); }
        .phoneCard small { display: block; color: #8fb7ff; font-size: 9px; margin-bottom: 6px; }
        .phoneCard b { display: block; font-size: 14px; }
        .phoneList { margin-top: 11px; display: grid; gap: 8px; }
        .phoneList span { height: 30px; border-radius: 11px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.06); }

        .featureGrid { max-width: 1480px; margin: 12px auto 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; position: relative; z-index: 10; }
        .featureCard { min-height: 160px; padding: 22px; display: flex; align-items: center; gap: 16px; border-radius: 28px; background: rgba(255,255,255,.76); border: 1px solid rgba(11,99,255,.14); box-shadow: 0 20px 44px rgba(7,20,47,.08); backdrop-filter: blur(16px); transition: .3s ease; }
        .featureCard:hover { transform: translateY(-8px); border-color: rgba(11,99,255,.34); box-shadow: 0 30px 60px rgba(7,20,47,.13); }
        .featureIcon { width: 52px; height: 52px; flex: 0 0 auto; border-radius: 18px; display: grid; place-items: center; color: white; background: linear-gradient(135deg, var(--blue), var(--blue2)); box-shadow: 0 16px 28px rgba(11,99,255,.22); }
        .featureIcon svg { width: 27px; height: 27px; }
        .featureCard h3 { font-size: 20px; letter-spacing: -.55px; line-height: 1.1; margin-bottom: 8px; }
        .featureCard p { color: var(--muted); font-size: 14px; line-height: 1.45; }

        .bottomBand { max-width: 1480px; margin: 20px auto 0; display: grid; grid-template-columns: 1fr .95fr 1.35fr; gap: 16px; position: relative; z-index: 10; }
        .domainCard, .instagramCard, .trustCard { min-height: 112px; border-radius: 28px; background: white; border: 1px solid rgba(11,99,255,.14); box-shadow: 0 20px 44px rgba(7,20,47,.08); }
        .domainCard, .instagramCard { display: flex; align-items: center; gap: 18px; padding: 22px 25px; transition: .28s ease; }
        .domainCard:hover, .instagramCard:hover { transform: translateY(-6px); border-color: rgba(11,99,255,.32); }
        .domainCard svg { width: 46px; height: 46px; color: var(--blue); flex: 0 0 auto; }
        .domainCard h3, .instagramCard h3 { font-size: 30px; line-height: 1; letter-spacing: -1px; text-transform: lowercase; }
        .domainCard p, .instagramCard p { margin-top: 7px; color: var(--muted); font-weight: 760; font-size: 14px; }
        .instagramCard svg { width: 44px; height: 44px; color: #e1306c; flex: 0 0 auto; }
        .trustCard { display: grid; grid-template-columns: repeat(3, 1fr); padding: 16px; gap: 12px; }
        .trustCard div { display: flex; align-items: center; justify-content: center; gap: 11px; border-radius: 20px; background: #f7fbff; border: 1px solid rgba(11,99,255,.1); color: #1d2939; font-size: 15px; font-weight: 900; transition: .25s ease; }
        .trustCard div:hover { transform: translateY(-4px); background: white; border-color: rgba(11,99,255,.26); }
        .trustCard svg { width: 25px; height: 25px; color: var(--blue); flex: 0 0 auto; }

        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,.55); } 70% { box-shadow: 0 0 0 10px rgba(34,197,94,0); } 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); } }
        @keyframes shine { 0% { transform: translateX(0) rotate(28deg); } 45%, 100% { transform: translateX(360px) rotate(28deg); } }
        @keyframes gorkiFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }

        @media (max-width: 1400px) {
          .hero { grid-template-columns: 1fr; gap: 26px; }
          .heroCopy { max-width: 860px; }
          .heroShowcase { min-height: 700px; grid-template-columns: 1fr 250px; }
          .featureGrid { grid-template-columns: repeat(2, 1fr); }
          .bottomBand { grid-template-columns: 1fr; }
        }

        @media (max-width: 980px) {
          .takipioPremium { padding: 22px 16px 30px; }
          .navLinks { display: none; }
          .brand { width: 172px; }
          .brand img { width: 168px; }
          h1 { letter-spacing: -3px; }
          .heroText { font-size: 18px; }
          .heroShowcase { grid-template-columns: 1fr; min-height: auto; }
          .sideColumn { grid-template-columns: 1fr; }
          .demoShell { min-height: 540px; }
          .pricePanel { min-height: auto; }
          .gorkiPanel { min-height: auto; }
          .gorkiImageWrap { height: 118px; }
          .gorkiImageWrap img { width: 118px; height: 118px; }
        }

        @media (max-width: 680px) {
          .statusPill { font-size: 12px; white-space: normal; }
          .waitlistHeader { align-items: flex-start; }
          .formRow { grid-template-columns: 1fr; }
          .proofBar { grid-template-columns: 1fr; }
          .demoShell { min-height: 470px; overflow: hidden; }
          .laptopMock { width: 98%; height: 300px; padding: 11px 11px 22px; }
          .screenBody { grid-template-columns: 92px 1fr; }
          .mockMenu button { font-size: 0; }
          .mockMenu button::after { content: ""; display: block; width: 70%; height: 8px; border-radius: 999px; background: currentColor; margin: auto; opacity: .65; }
          .mockCards { grid-template-columns: 1fr; }
          .mockCards .mockCard:nth-child(2), .mockCards .mockCard:nth-child(3) { display: none; }
          .mockGraph { height: 105px; }
          .mockList { display: none; }
          .phoneMock { width: 124px; height: 250px; right: -8px; bottom: 10px; }
          .featureGrid { grid-template-columns: 1fr; }
          .featureCard { min-height: 135px; }
          .domainCard, .instagramCard { align-items: flex-start; }
          .trustCard { grid-template-columns: 1fr; }
          .trustCard div { min-height: 62px; }
        }
      `}</style>
    </main>
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
      <a href="#waitlist">Erken erişime katıl</a>
    </div>
  );
}

function GorkiPanel({ message }: { message: string }) {
  return (
    <div className="gorkiPanel" id="assistant">
      <div className="gorkiImageWrap"><img src="/gorki-hero.png" alt="Gorki" /></div>
      <div className="gorkiTitle"><SparkIcon /> Gorki asistan</div>
      <div className="gorkiMessage">“{message}”</div>
    </div>
  );
}

function LaptopMockup({ activeTab, setActiveTab }: { activeTab: DemoTab; setActiveTab: (tab: DemoTab) => void }) {
  const active = demoTabs.find((item) => item.key === activeTab) ?? demoTabs[0];

  return (
    <div className="laptopMock">
      <div className="laptopScreen">
        <div className="screenTop">
          <div className="screenBrand"><img src="/takipio-logo.png" alt="" /> takipio</div>
          <div className="screenActions"><span /><span /><span /></div>
        </div>
        <div className="screenBody">
          <div className="mockMenu">
            {demoTabs.map((tab) => (
              <button key={tab.key} className={activeTab === tab.key ? "active" : ""} onClick={() => setActiveTab(tab.key)} type="button">
                {tab.label}
              </button>
            ))}
          </div>
          <div className="mockContent">
            <div className="mockCards">
              <div className="mockCard"><small>{active.helper}</small><b>{active.value}</b></div>
              <div className="mockCard"><small>Aktif işlem</small><b>{activeTab === "orders" ? "24" : activeTab === "payments" ? "8" : "18"}</b></div>
              <div className="mockCard"><small>Durum</small><b>{activeTab === "payments" ? "Takipte" : "Güncel"}</b></div>
            </div>
            <div className="mockGraph">
              <svg viewBox="0 0 520 170" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 138 C40 110 65 98 105 110 C150 126 160 58 210 78 C250 94 260 45 310 62 C360 82 374 28 420 42 C460 54 470 18 520 28" fill="none" stroke="#0b63ff" strokeWidth="7" strokeLinecap="round" />
              </svg>
            </div>
            <div className="mockList">
              <div><span>{activeTab === "customers" ? "Arden Coffee" : "Nova Car Wash"}</span><b>{activeTab === "payments" ? "Ödeme bekliyor" : "Aktif"}</b></div>
              <div><span>{activeTab === "orders" ? "Özel oto kokusu" : "Atlas Rent A Car"}</span><b>{activeTab === "orders" ? "Hazırlanıyor" : "Güncel"}</b></div>
              <div><span>{activeTab === "overview" ? "Gorki önerisi" : "Otomatik takip"}</span><b>{activeTab === "overview" ? "2 uyarı" : "Açık"}</b></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneMockup({ activeTab, setActiveTab }: { activeTab: DemoTab; setActiveTab: (tab: DemoTab) => void }) {
  const active = demoTabs.find((item) => item.key === activeTab) ?? demoTabs[0];

  return (
    <div className="phoneMock">
      <div className="phoneScreen">
        <div className="phoneHead"><span><img src="/takipio-logo.png" alt="" /> takipio</span><b>9:41</b></div>
        <div className="phoneTabs">
          {demoTabs.slice(0, 4).map((tab) => (
            <button key={tab.key} className={activeTab === tab.key ? "active" : ""} onClick={() => setActiveTab(tab.key)} type="button">
              {tab.label.split(" ")[0]}
            </button>
          ))}
        </div>
        <div className="phoneGrid">
          <div className="phoneCard"><small>{active.label}</small><b>{active.value}</b></div>
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
function CheckIcon() { return <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>; }
function UsersIcon() { return <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="4" /><path d="M2 22c1.2-5.3 4.2-8 8-8s6.8 2.7 8 8" /><path d="M17 11a4 4 0 1 0-1.5-7.7" /><path d="M18 14c2.4.7 3.8 2.9 4.5 6" /></svg>; }
function OrdersIcon() { return <svg viewBox="0 0 24 24"><path d="M6 2h12l3 5v15H3V7l3-5z" /><path d="M3 7h18" /><path d="M8 12h8" /><path d="M8 16h5" /></svg>; }
function CubeIcon() { return <svg viewBox="0 0 24 24"><path d="M12 2l9 5-9 5-9-5 9-5z" /><path d="M3 7v10l9 5 9-5V7" /><path d="M12 12v10" /></svg>; }
function WalletIcon() { return <svg viewBox="0 0 24 24"><path d="M3 7h18v12H3z" /><path d="M16 12h5v4h-5a2 2 0 0 1 0-4z" /><path d="M3 7l3-4h12l3 4" /></svg>; }
function GlobeIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15 15 0 0 1 0 20" /><path d="M12 2a15 15 0 0 0 0 20" /></svg>; }
function ShieldIcon() { return <svg viewBox="0 0 24 24"><path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-4z" /><path d="M8.5 12l2.3 2.3 4.8-5" /></svg>; }
function BoltIcon() { return <svg viewBox="0 0 24 24"><path d="M13 2L3 14h8l-1 8 11-14h-8l0-6z" /></svg>; }
function HeadsetIcon() { return <svg viewBox="0 0 24 24"><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><path d="M4 13h4v6H4z" /><path d="M16 13h4v6h-4z" /><path d="M16 21h-4" /></svg>; }
function InstagramIcon() { return <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r="1" /></svg>; }
function SparkIcon() { return <svg viewBox="0 0 24 24"><path d="M12 2l2.4 6.7L21 11l-6.6 2.3L12 20l-2.4-6.7L3 11l6.6-2.3L12 2z" /></svg>; }
