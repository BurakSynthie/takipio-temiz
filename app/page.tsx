"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type TabKey = "overview" | "orders" | "customers" | "marketplaces" | "gorki";

type BadgeKind = "ok" | "warn" | "info" | "muted" | "err";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Genel Bakış" },
  { key: "orders", label: "Siparişler" },
  { key: "customers", label: "Müşteriler" },
  { key: "marketplaces", label: "Pazaryerleri" },
  { key: "gorki", label: "Gorki AI" },
];

const MARKETPLACES = [
  { name: "Trendyol", src: "/trendyol.png", accent: "#f27a1a" },
  { name: "Amazon", src: "/amazon.png", accent: "#ffb000" },
  { name: "Hepsiburada", src: "/hepsiburada.png", accent: "#ff6000" },
  { name: "Çiçeksepeti", src: "/ciceksepeti.png", accent: "#36b86a" },
];

const GORKI_MESSAGES = [
  "Bugün pazaryeri siparişlerinde %18 artış var.",
  "2 ürün kritik stok seviyesine yaklaşıyor.",
  "Bekleyen 4 ödeme için hatırlatma öneriyorum.",
  "Hepsiburada ve Trendyol akışı güncellendi.",
];

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [messageIndex, setMessageIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [gorkiChatOpen, setGorkiChatOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const userTouched = useRef(false);

  useEffect(() => {
    setReady(true);

    const tabTimer = window.setInterval(() => {
      if (userTouched.current) return;

      setActiveTab((current) => {
        const index = TABS.findIndex((tab) => tab.key === current);
        return TABS[(index + 1) % TABS.length].key;
      });
    }, 4700);

    const messageTimer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % GORKI_MESSAGES.length);
    }, 3500);

    return () => {
      window.clearInterval(tabTimer);
      window.clearInterval(messageTimer);
    };
  }, []);

  function handleTabClick(tab: TabKey) {
    userTouched.current = true;
    setActiveTab(tab);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorText("Lütfen geçerli bir e-posta adresi yaz.");
      return;
    }

    setErrorText("");
    setLoading(true);

    try {
      const { error } = await supabase.from("waitlist").insert({
        email: cleanEmail,
        coupon_code: "TAKIPIO10",
        source: "landing-v8-dark-default",
      });

      if (error) {
        const duplicate =
          error.code === "23505" ||
          error.message?.toLowerCase().includes("duplicate") ||
          error.message?.toLowerCase().includes("unique");

        setErrorText(
          duplicate
            ? "Bu e-posta zaten erken erişim listesinde."
            : "Kayıt sırasında bir sorun oluştu. Lütfen tekrar dene."
        );

        setLoading(false);
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

      setEmail("");
      setSuccessOpen(true);
    } catch (error) {
      console.error(error);
      setErrorText("Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className={`takipioV8 ${darkMode ? "darkMode" : "lightMode"}`}
      style={{
        opacity: ready ? 1 : 0,
        visibility: ready ? "visible" : "hidden",
        transition: "opacity 220ms ease",
      }}
    >
      <div className="v8Bg">
        <div className="mesh meshA" />
        <div className="mesh meshB" />
        <div className="mesh meshC" />
        <div className="gridLayer" />
      </div>

      <header className="topNav">
        <a className="brand" href="#top" aria-label="Takipio">
          <img src="/takipio-logo.png" alt="Takipio" />
        </a>

        <nav className="desktopNav">
          <a href="#product">Ürün</a>
          <a href="#what">Neler Sunar</a>
          <a href="#gain">Kazanç</a>
          <a href="#contact">İletişim</a>
        </nav>

        <button
          type="button"
          className="themeToggle"
          onClick={() => setDarkMode((current) => !current)}
          aria-label={darkMode ? "Aydınlık moda geç" : "Karanlık moda geç"}
        >
          {darkMode ? "☀️ Aydınlık" : "🌙 Karanlık"}
        </button>

        <a className="navCta" href="#waitlist">
          Listeye katıl
          <ArrowIcon />
        </a>
      </header>

      <nav className="mobileDock" aria-label="Mobil menü">
        <a href="#top"><span>⌂</span>Ana</a>
        <a href="#product"><span>▣</span>Panel</a>
        <a href="#gain"><span>↗</span>Kazanç</a>
        <a href="#waitlist"><span>✦</span>Kayıt</a>
      </nav>

      <section className="hero" id="top">
        <div className="heroLeft">
          <div className="statusPill">
            <span />
            Takipio erken erişim açıldı
          </div>

          <h1>
            İşletme akışını
            <em>tek panelde</em>
            premium yönet.
          </h1>

          <p className="heroText">
            Sipariş, müşteri, stok, ödeme ve pazaryeri hareketlerini Takipio’da
            topla. Gorki AI günlük işleri özetlesin, sen büyümeye odaklan.
          </p>

          <IntegrationRail />

          <form className="waitlistCard" id="waitlist" onSubmit={handleSubmit}>
            <div className="waitlistHeader">
              <div>
                <span>Erken erişim</span>
                <b>Açılışa özel TAKIPIO10 kodunu kaçırma.</b>
              </div>

              <div className="priceChip">
                <small>İlk ay</small>
                <strong>₺89</strong>
              </div>
            </div>

            <div className="emailRow">
              <div className="inputShell">
                <MailIcon />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="ornek@firma.com"
                  value={email}
                  disabled={loading}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (errorText) setErrorText("");
                  }}
                  required
                />
              </div>

              <button type="submit" disabled={loading}>
                {loading ? (
                  <span className="spinner" />
                ) : (
                  <>
                    Erken erişime katıl
                    <ArrowIcon />
                  </>
                )}
              </button>
            </div>

            <div className="waitlistMeta">
              <span className="couponBadge">TAKIPIO10</span>
              <span>Hoş geldin maili otomatik gönderilir.</span>
              {errorText && <b>{errorText}</b>}
            </div>
          </form>

          <div className="trustLine">
            <span><CheckIcon /> 15 müşteriye kadar ücretsiz</span>
            <span><CheckIcon /> Gorki AI dahil</span>
            <span><CheckIcon /> Pazaryeri altyapısı hazırlanıyor</span>
          </div>

          <a className="scrollCue" href="#analytics">
            Aşağı kaydır, canlı analiz panelini gör
            <ArrowIcon />
          </a>
        </div>

        <div className="heroRight" id="product">
          <ProductStudio
            activeTab={activeTab}
            onTabClick={handleTabClick}
            message={GORKI_MESSAGES[messageIndex]}
          />
        </div>
      </section>

      <LiveAnalyticsSection />

      <section className="featureBand">
        <FeatureCard
          icon={<PanelIcon />}
          title="Tek panel yönetim"
          text="Sipariş, müşteri, stok ve ödeme akışını tek merkezde takip et."
        />
        <FeatureCard
          icon={<LinkIcon />}
          title="Pazaryeri senkronizasyonu"
          text="Trendyol, Amazon, Hepsiburada ve Çiçeksepeti akışlarını sadeleştir."
        />
        <FeatureCard
          icon={<SparkIcon />}
          title="Gorki AI analizleri"
          text="Günlük hareketleri kısa özetlere ve aksiyon önerilerine çevir."
        />
      </section>

      <ScrollSections />
      <FooterSection />

      <GorkiChatWidget
        open={gorkiChatOpen}
        onToggle={() => setGorkiChatOpen((current) => !current)}
        onClose={() => setGorkiChatOpen(false)}
        message={GORKI_MESSAGES[messageIndex]}
      />

      {successOpen && <SuccessModal onClose={() => setSuccessOpen(false)} />}

      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
    </main>
  );
}

function IntegrationRail() {
  return (
    <div className="integrationRail" id="integrations">
      <div className="railHeader">
        <span>Pazaryeri entegrasyonları hazırlanıyor</span>
        <b>Satış kanallarını tek akışta topla.</b>
      </div>

      <div className="railLogos">
        {MARKETPLACES.map((market) => (
          <div
            className="railLogoCard"
            key={market.name}
            style={{ "--accent": market.accent } as React.CSSProperties}
          >
            <img src={market.src} alt={market.name} />
          </div>
        ))}
      </div>

      <p>
        Trendyol, Amazon, Hepsiburada ve Çiçeksepeti satışlarınızı Takipio’da
        tek panelden takip etmek için altyapı hazırlanıyor.
      </p>
    </div>
  );
}

function ProductStudio({
  activeTab,
  onTabClick,
  message,
}: {
  activeTab: TabKey;
  onTabClick: (tab: TabKey) => void;
  message: string;
}) {
  return (
    <div className="studio">
      <div className="studioGlow" />

      <div className="floatingMetric metricOne">
        <OrdersIcon />
        <div>
          <b>146</b>
          <span>Aktif sipariş</span>
        </div>
        <em>+%18,6</em>
      </div>

      <div className="floatingMetric metricTwo">
        <WalletIcon />
        <div>
          <b>₺184.250</b>
          <span>Toplam ciro</span>
        </div>
        <em>+%12,4</em>
      </div>

      <div className="macbookScene">
        <Macbook activeTab={activeTab} onTabClick={onTabClick} />
        <Iphone activeTab={activeTab} message={message} />
      </div>

      <div className="gorkiPanel" id="gorki">
        <div className="gorkiVisual">
          <img src="/gorki-hero.png" alt="Gorki AI" />
        </div>
        <div>
          <b>Gorki AI</b>
          <span>Akıllı işletme asistanın</span>
          <p>“{message}”</p>
        </div>
      </div>

      <div className="couponMini">
        <span>Açılışa özel</span>
        <b>TAKIPIO10</b>
        <em>İlk ay ₺89</em>
      </div>
    </div>
  );
}

function Macbook({
  activeTab,
  onTabClick,
}: {
  activeTab: TabKey;
  onTabClick: (tab: TabKey) => void;
}) {
  return (
    <div className="macbook">
      <div className="macLid">
        <div className="macCamera" />
        <div className="macScreen">
          <div className="browserBar">
            <div className="browserDots">
              <i /> <i /> <i />
            </div>
            <div className="urlBox">
              <LockIcon />
              app.takipio.com
            </div>
            <div className="barRight" />
          </div>

          <div className="dashboard">
            <aside className="dashboardSide">
              <div className="dashBrand">
                <img src="/takipio-logo.png" alt="" />
                <b>Takipio</b>
              </div>

              <nav>
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={activeTab === tab.key ? "active" : ""}
                    onClick={() => onTabClick(tab.key)}
                  >
                    <span />
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className="sideGorki">
                <strong>Gorki AI</strong>
                <small>Bugünkü işler ve pazaryeri akışın özetleniyor.</small>
              </div>
            </aside>

            <main className="dashboardMain">
              <TabView tab={activeTab} />
            </main>
          </div>
        </div>
      </div>
      <div className="macBase">
        <span />
      </div>
    </div>
  );
}

function TabView({ tab }: { tab: TabKey }) {
  return (
    <div className="tabView" key={tab}>
      {tab === "overview" && <OverviewView />}
      {tab === "orders" && <OrdersView />}
      {tab === "customers" && <CustomersView />}
      {tab === "marketplaces" && <MarketplacesView />}
      {tab === "gorki" && <GorkiView />}
    </div>
  );
}

function ViewHeader({
  title,
  sub,
  right,
}: {
  title: string;
  sub: string;
  right: ReactNode;
}) {
  return (
    <div className="viewHeader">
      <div>
        <h3>{title}</h3>
        <span>{sub}</span>
      </div>
      <div className="viewRight">{right}</div>
    </div>
  );
}

function OverviewView() {
  return (
    <>
      <ViewHeader
        title="Genel Bakış"
        sub="Bugünün özeti · 09:42"
        right={<><i className="liveDot" /> Canlı</>}
      />

      <div className="statGrid">
        <Stat label="Toplam ciro" value="₺184.250" trend="+%12,4" />
        <Stat label="Aktif sipariş" value="146" trend="+18 bugün" />
        <Stat label="Bekleyen ödeme" value="₺24.610" trend="9 fatura" muted />
        <Stat label="Stok durumu" value="%87" trend="3 kritik" muted />
      </div>

      <div className="overviewLower">
        <div className="chartPanel">
          <div className="chartTop">
            <b>Canlı satış grafiği</b>
            <span>Son 7 gün</span>
          </div>
          <AnimatedChart />
        </div>

        <div className="activityPanel">
          <b>Son hareketler</b>
          <Activity color="cyan" text="Trendyol’dan 3 yeni sipariş" time="2 dk" />
          <Activity color="green" text="#10246 teslim edildi" time="14 dk" />
          <Activity color="amber" text="2 ürün kritik stokta" time="1 sa" />
        </div>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  trend,
  muted,
}: {
  label: string;
  value: string;
  trend: string;
  muted?: boolean;
}) {
  return (
    <div className="statCard">
      <span>{label}</span>
      <b>{value}</b>
      <em className={muted ? "muted" : ""}>{trend}</em>
    </div>
  );
}

function AnimatedChart() {
  return (
    <svg className="chartSvg" viewBox="0 0 520 190" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGradientV8" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="55%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="areaGradientV8" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(34, 211, 238, 0.28)" />
          <stop offset="100%" stopColor="rgba(34, 211, 238, 0)" />
        </linearGradient>
      </defs>
      <path
        className="chartArea"
        d="M0 160 C42 126 68 118 106 128 C150 140 165 62 212 84 C252 103 264 42 313 61 C362 84 376 25 422 40 C464 54 476 18 520 32 L520 190 L0 190 Z"
        fill="url(#areaGradientV8)"
      />
      <path
        className="chartPrev"
        d="M0 172 C42 148 88 145 132 134 C186 120 236 126 274 110 C330 88 378 100 420 82 C456 66 486 72 520 60"
        fill="none"
        stroke="rgba(255,255,255,.16)"
        strokeWidth="2"
        strokeDasharray="4 6"
      />
      <path
        className="chartLine"
        d="M0 160 C42 126 68 118 106 128 C150 140 165 62 212 84 C252 103 264 42 313 61 C362 84 376 25 422 40 C464 54 476 18 520 32"
        fill="none"
        stroke="url(#lineGradientV8)"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Activity({
  color,
  text,
  time,
}: {
  color: "cyan" | "green" | "amber";
  text: string;
  time: string;
}) {
  return (
    <div className="activityRow">
      <i className={`dot ${color}`} />
      <span>{text}</span>
      <em>{time}</em>
    </div>
  );
}

const ORDERS: {
  id: string;
  customer: string;
  market: string;
  status: string;
  amount: string;
  kind: BadgeKind;
}[] = [
  { id: "#10248", customer: "Ahmet Yılmaz", market: "Trendyol", status: "Hazırlanıyor", amount: "₺1.250", kind: "warn" },
  { id: "#10247", customer: "Zeynep Kaya", market: "Hepsiburada", status: "Kargoda", amount: "₺890", kind: "info" },
  { id: "#10246", customer: "Mert Demir", market: "Amazon", status: "Teslim edildi", amount: "₺2.140", kind: "ok" },
  { id: "#10245", customer: "Selin Aksoy", market: "Çiçeksepeti", status: "Hazırlanıyor", amount: "₺640", kind: "warn" },
  { id: "#10244", customer: "Burak Şahin", market: "Trendyol", status: "İade", amount: "₺320", kind: "err" },
];

function OrdersView() {
  return (
    <>
      <ViewHeader title="Siparişler" sub="Bugün 18 yeni sipariş" right="Kargo durumu" />
      <div className="dataTable">
        <div className="tableHead">
          <span>Sipariş</span>
          <span>Müşteri</span>
          <span>Pazaryeri</span>
          <span>Durum</span>
          <span>Tutar</span>
        </div>
        {ORDERS.map((order, index) => (
          <div className="tableRow" key={order.id} style={{ animationDelay: `${index * 60}ms` }}>
            <b>{order.id}</b>
            <span>{order.customer}</span>
            <span>{order.market}</span>
            <Badge kind={order.kind}>{order.status}</Badge>
            <em>{order.amount}</em>
          </div>
        ))}
      </div>
    </>
  );
}

const CUSTOMERS: {
  name: string;
  orders: number;
  last: string;
  status: string;
  kind: BadgeKind;
}[] = [
  { name: "Ahmet Yılmaz", orders: 24, last: "Bugün", status: "Premium", kind: "ok" },
  { name: "Zeynep Kaya", orders: 18, last: "Dün", status: "Aktif", kind: "ok" },
  { name: "Mert Demir", orders: 12, last: "3 gün önce", status: "Aktif", kind: "info" },
  { name: "Selin Aksoy", orders: 9, last: "1 hafta önce", status: "Yeni", kind: "warn" },
  { name: "Burak Şahin", orders: 6, last: "2 hafta önce", status: "Pasif", kind: "muted" },
  { name: "Ece Polat", orders: 4, last: "1 ay önce", status: "Pasif", kind: "muted" },
];

function CustomersView() {
  return (
    <>
      <ViewHeader title="Müşteriler" sub="Son 30 gün · 384 müşteri" right="+24 yeni" />
      <div className="customerList">
        {CUSTOMERS.map((customer, index) => (
          <div className="customerRow" key={customer.name} style={{ animationDelay: `${index * 55}ms` }}>
            <div className="avatar">
              {customer.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <b>{customer.name}</b>
              <span>{customer.orders} sipariş · son işlem: {customer.last}</span>
            </div>
            <Badge kind={customer.kind}>{customer.status}</Badge>
          </div>
        ))}
      </div>
    </>
  );
}

function MarketplacesView() {
  return (
    <>
      <ViewHeader
        title="Pazaryerleri"
        sub="Entegrasyon durumu · 4 kanal"
        right={<><i className="liveDot" /> Hazırlanıyor</>}
      />
      <div className="marketGrid">
        {MARKETPLACES.map((market, index) => (
          <div
            className="marketDashCard"
            key={market.name}
            style={{ "--accent": market.accent, animationDelay: `${index * 70}ms` } as React.CSSProperties}
          >
            <div className="marketLogo">
              <img src={market.src} alt={market.name} />
            </div>
            <b>{market.name}</b>
            <span>Satış ve stok akışı</span>
            <em>Yakında aktif</em>
          </div>
        ))}
      </div>
    </>
  );
}

function GorkiView() {
  const suggestions = [
    { text: "Bugün pazaryeri siparişlerinde %18 artış var.", kind: "ok" as BadgeKind },
    { text: "2 ürün kritik stok seviyesine yaklaşıyor.", kind: "warn" as BadgeKind },
    { text: "Bekleyen 4 ödeme için hatırlatma öneriyorum.", kind: "info" as BadgeKind },
  ];

  return (
    <>
      <ViewHeader
        title="Gorki AI"
        sub="Günlük öneriler · 09:42"
        right={<><i className="aiDot" /> Aktif</>}
      />
      <div className="gorkiDashboard">
        <div className="gorkiDashTop">
          <img src="/gorki-hero.png" alt="Gorki AI" />
          <div>
            <b>Bugünün özeti</b>
            <span>3 öneri hazır</span>
          </div>
        </div>

        <div className="suggestionList">
          {suggestions.map((item, index) => (
            <div className="suggestion" key={item.text} style={{ animationDelay: `${index * 80}ms` }}>
              <Badge kind={item.kind}>{index + 1}</Badge>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        <div className="gorkiActions">
          <button type="button">Hepsini gör</button>
          <button type="button">Aksiyon al <ArrowIcon /></button>
        </div>
      </div>
    </>
  );
}

function Badge({ kind, children }: { kind: BadgeKind; children: ReactNode }) {
  return <span className={`badge ${kind}`}>{children}</span>;
}

function Iphone({ activeTab, message }: { activeTab: TabKey; message: string }) {
  const data = useMemo(() => getPhoneData(activeTab), [activeTab]);

  return (
    <div className="iphone">
      <div className="phoneFrame">
        <div className="dynamicIsland" />
        <div className="phoneStatus">
          <span>9:41</span>
          <i />
        </div>

        <div className="phoneContent" key={activeTab}>
          <div className="phoneGreeting">
            <div>
              <b>Merhaba, Ahmet</b>
              <span>{data.day}</span>
            </div>
            <div className="phoneAvatar">A</div>
          </div>

          <div className="phoneTabs">
            {TABS.slice(0, 4).map((tab) => (
              <span key={tab.key} className={activeTab === tab.key ? "active" : ""}>
                {tab.label.split(" ")[0]}
              </span>
            ))}
          </div>

          <div className="phoneMetrics">
            <div>
              <span>{data.m1.label}</span>
              <b>{data.m1.value}</b>
              <em>{data.m1.trend}</em>
            </div>
            <div>
              <span>{data.m2.label}</span>
              <b>{data.m2.value}</b>
              <em>{data.m2.trend}</em>
            </div>
          </div>

          <div className="phoneList">
            <div className="phoneListHead">
              <b>{data.listTitle}</b>
              <span>Tümü</span>
            </div>

            {data.rows.map((row) => (
              <div className="phoneRow" key={row.text}>
                <i className={row.color} />
                <span>{row.text}</span>
                <em>{row.time}</em>
              </div>
            ))}
          </div>

          <div className="phoneGorki">
            <img src="/gorki-hero.png" alt="" />
            <span>{message}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPhoneData(tab: TabKey) {
  switch (tab) {
    case "orders":
      return {
        day: "Bugün 18 yeni sipariş",
        m1: { label: "Aktif", value: "146", trend: "+18" },
        m2: { label: "Bekleyen", value: "9", trend: "kargo" },
        listTitle: "Son siparişler",
        rows: [
          { color: "cyan", text: "#10248 Trendyol", time: "2 dk" },
          { color: "green", text: "#10246 teslim", time: "14 dk" },
          { color: "amber", text: "#10245 hazırlık", time: "1 sa" },
        ],
      };
    case "customers":
      return {
        day: "24 yeni müşteri",
        m1: { label: "Yeni", value: "24", trend: "+%9" },
        m2: { label: "Aktif", value: "318", trend: "müşteri" },
        listTitle: "Son müşteriler",
        rows: [
          { color: "cyan", text: "Selin Aksoy", time: "5 dk" },
          { color: "green", text: "Mert Demir", time: "22 dk" },
          { color: "amber", text: "Zeynep Kaya", time: "1 sa" },
        ],
      };
    case "marketplaces":
      return {
        day: "4 kanal hazırlanıyor",
        m1: { label: "Kanal", value: "4", trend: "aktif" },
        m2: { label: "Senk.", value: "98%", trend: "başarılı" },
        listTitle: "Kanallar",
        rows: [
          { color: "cyan", text: "Trendyol senk.", time: "şimdi" },
          { color: "green", text: "Hepsiburada ok", time: "3 dk" },
          { color: "amber", text: "Amazon kuyruk", time: "12 dk" },
        ],
      };
    case "gorki":
      return {
        day: "3 yeni öneri",
        m1: { label: "Öneri", value: "3", trend: "yeni" },
        m2: { label: "Oto.", value: "12", trend: "aktif" },
        listTitle: "Gorki önerileri",
        rows: [
          { color: "cyan", text: "Stok hatırlatması", time: "2 dk" },
          { color: "green", text: "Ödeme tamamlandı", time: "9 dk" },
          { color: "amber", text: "Kritik ürün", time: "32 dk" },
        ],
      };
    default:
      return {
        day: "Bugün 12 sipariş",
        m1: { label: "Ciro", value: "₺184K", trend: "+%12" },
        m2: { label: "Bekleyen", value: "₺24K", trend: "9 fatura" },
        listTitle: "Son hareketler",
        rows: [
          { color: "cyan", text: "Trendyol siparişi", time: "2 dk" },
          { color: "green", text: "#10246 teslim", time: "14 dk" },
          { color: "amber", text: "Stok uyarısı", time: "1 sa" },
        ],
      };
  }
}

function GorkiChatWidget({
  open,
  onToggle,
  onClose,
  message,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  message: string;
}) {
  const quickItems = [
    "Bugünkü siparişlerde neye bakmalıyım?",
    "Stokta risk var mı?",
    "Pazaryeri satışlarını özetle",
  ];

  return (
    <div className={`gorkiChatWidget ${open ? "open" : ""}`}>
      {open && (
        <div className="gorkiChatPanel" role="dialog" aria-label="Gorki AI sohbet ekranı">
          <div className="chatTop">
            <div className="chatGorkiHead">
              <img src="/gorki-hero.png" alt="Gorki AI" />
            </div>
            <div>
              <b>Gorki AI</b>
              <span>Takipio akıllı asistanı</span>
            </div>
            <button type="button" onClick={onClose} aria-label="Gorki sohbetini kapat">
              <CloseIcon />
            </button>
          </div>

          <div className="chatBody">
            <div className="chatBubble ai">
              Merhaba 👋 Ben Gorki. Sipariş, stok, ödeme ve pazaryeri akışlarını senin için özetleyebilirim.
            </div>

            <div className="chatBubble ai highlight">
              {message}
            </div>

            <div className="chatBubble user">
              Bugün nelere dikkat etmeliyim?
            </div>

            <div className="chatBubble ai">
              Öncelik: bekleyen ödemeler, kritik stoklar ve hazırlıkta kalan siparişler. Takipio bu işleri tek panelde öne çıkarır.
            </div>
          </div>

          <div className="chatQuick">
            {quickItems.map((item) => (
              <button type="button" key={item}>
                {item}
              </button>
            ))}
          </div>

          <div className="chatInputFake">
            <span>Gorki’ye sor...</span>
            <button type="button" aria-label="Gönder">
              <ArrowIcon />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="gorkiFloatingHead"
        onClick={onToggle}
        aria-label={open ? "Gorki sohbetini kapat" : "Gorki sohbetini aç"}
      >
        <span className="gorkiPulse" />
        <img src="/gorki-hero.png" alt="" />
        <em>{open ? "Kapat" : "Gorki"}</em>
      </button>
    </div>
  );
}


function FeatureCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <article className="featureCard">
      <div>{icon}</div>
      <b>{title}</b>
      <span>{text}</span>
    </article>
  );
}


function ScrollSections() {
  const offerCards = [
    {
      title: "Operasyon kontrolü",
      text: "Siparişten ödemeye kadar tüm günlük akışı tek panelde görürsün. Dağınık not, Excel ve farklı pazaryeri panelleri arasında kaybolmazsın.",
      stat: "5+",
      label: "akış tek ekranda",
    },
    {
      title: "Pazaryeri görünürlüğü",
      text: "Trendyol, Amazon, Hepsiburada ve Çiçeksepeti gibi kanallar için sipariş, stok ve durum takibini merkezi hale getirecek yapı hazırlanıyor.",
      stat: "4",
      label: "kanal desteği",
    },
    {
      title: "Gorki AI özetleri",
      text: "Gorki, yoğun günlerde kritik stokları, bekleyen ödemeleri ve aksiyon alman gereken işleri kısa özetlere çevirir.",
      stat: "AI",
      label: "akıllı öneri",
    },
  ];

  const comparisonRows = [
    { label: "Günlük sipariş kontrolü", before: "Manuel panel gezme", after: "Tek ekranda canlı özet" },
    { label: "Stok ve ödeme takibi", before: "Geç fark edilen açıklar", after: "Erken uyarı ve aksiyon" },
    { label: "Müşteri takibi", before: "Dağınık konuşmalar", after: "Sipariş geçmişiyle düzenli CRM" },
    { label: "Karar alma", before: "Tahminle yönetim", after: "Güncel veriye göre karar" },
  ];

  const gainCards = [
    { value: "%18", title: "daha hızlı aksiyon", text: "Günlük yoğunlukta bekleyen işleri daha erken görme hedefi." },
    { value: "%12", title: "daha net ciro takibi", text: "Haftalık satış ve ödeme akışını daha anlaşılır izleme hedefi." },
    { value: "2x", title: "daha az panel karmaşası", text: "Farklı kanalları tek merkezden takip etme yaklaşımı." },
  ];

  return (
    <>
      <section className="storySection" id="what">
        <div className="sectionIntro">
          <span>Takipio neler sunar?</span>
          <h2>İşletmeni sadece kayıt altına almaz, yönetilebilir hale getirir.</h2>
          <p>
            Takipio; sipariş, müşteri, stok, ödeme ve pazaryeri akışlarını bir araya getirerek
            günlük operasyonu daha okunabilir, daha hızlı ve daha kontrollü hale getirmek için tasarlandı.
          </p>
        </div>

        <div className="offerGrid">
          {offerCards.map((card) => (
            <article className="offerCard" key={card.title}>
              <div className="offerStat">
                <b>{card.stat}</b>
                <span>{card.label}</span>
              </div>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="compareSection" id="gain">
        <div className="sectionIntro compact">
          <span>Neyi değiştirir?</span>
          <h2>Manuel takipten canlı işletme hafızasına geçersin.</h2>
          <p>
            Amaç sadece daha güzel bir panel değil; karar alırken elinde daha güncel, daha düzenli ve daha
            aksiyon alınabilir veri olması.
          </p>
        </div>

        <div className="compareShell">
          <div className="compareTable">
            <div className="compareHead">
              <span>Alan</span>
              <span>Takipio yokken</span>
              <span>Takipio ile</span>
            </div>
            {comparisonRows.map((row) => (
              <div className="compareRow" key={row.label}>
                <b>{row.label}</b>
                <span className="negative">{row.before}</span>
                <span className="positive">{row.after}</span>
              </div>
            ))}
          </div>

          <div className="liveDataCard">
            <span className="liveLabel"><i /> Güncel veri simülasyonu</span>
            <h3>Bugünkü operasyon özeti</h3>
            <div className="liveMetrics">
              <div><b>146</b><span>aktif sipariş</span></div>
              <div><b>₺24.610</b><span>bekleyen ödeme</span></div>
              <div><b>3</b><span>kritik stok</span></div>
            </div>
            <p>
              Bu veriler örnek senaryo olarak gösterilir. Gerçek kullanımda panel, işletmenin kendi
              kayıtlarına ve bağlanan satış kanallarına göre şekillenir.
            </p>
          </div>
        </div>

        <div className="gainGrid">
          {gainCards.map((card) => (
            <article className="gainCard" key={card.title}>
              <strong>{card.value}</strong>
              <b>{card.title}</b>
              <span>{card.text}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="flowSection">
        <div className="sectionIntro compact">
          <span>Nasıl kolaylık sağlar?</span>
          <h2>Gün içinde bakman gereken yerleri azaltır.</h2>
        </div>

        <div className="flowGrid">
          <article>
            <small>01</small>
            <b>Topla</b>
            <p>Sipariş, müşteri, stok ve ödeme bilgilerini tek merkezde düzenle.</p>
          </article>
          <article>
            <small>02</small>
            <b>Özetle</b>
            <p>Gorki AI günlük hareketleri kısa, anlaşılır ve aksiyon odaklı hale getirir.</p>
          </article>
          <article>
            <small>03</small>
            <b>Harekete geç</b>
            <p>Bekleyen ödeme, kritik stok ve geciken siparişleri daha hızlı fark et.</p>
          </article>
        </div>
      </section>
    </>
  );
}

function CountUp({
  end,
  prefix = "",
  suffix = "",
  duration = 1500,
  decimals = 0,
  active,
}: {
  end: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  active: boolean;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;

    let frame = 0;
    const totalFrames = Math.max(36, Math.round(duration / 16));
    let raf = 0;

    const tick = () => {
      frame += 1;
      const progress = Math.min(frame / totalFrames, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setValue(end * eased);

      if (progress < 1) {
        raf = window.requestAnimationFrame(tick);
      }
    };

    setValue(0);
    raf = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(raf);
  }, [active, decimals, duration, end]);

  return (
    <>
      {prefix}
      {value.toLocaleString("tr-TR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </>
  );
}

function LiveAnalyticsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.28 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const bars = [
    {
      label: "Sipariş yanıt hızı",
      before: "Manuel takip",
      after: "Takipio ile",
      value: 78,
      note: "Geciken siparişleri daha erken fark etme hedefi.",
    },
    {
      label: "Stok görünürlüğü",
      before: "Dağınık kontrol",
      after: "Canlı uyarı",
      value: 86,
      note: "Kritik stokları günlük akışta öne çıkarır.",
    },
    {
      label: "Ödeme takibi",
      before: "Geç hatırlama",
      after: "Öncelikli liste",
      value: 69,
      note: "Bekleyen ödemeleri daha okunabilir hale getirir.",
    },
  ];

  const insightRows = [
    { label: "Bugün bekleyen aksiyon", value: "12", trend: "4 kritik" },
    { label: "Pazaryeri hareketi", value: "+%18", trend: "sipariş artışı" },
    { label: "Tahmini zaman kazancı", value: "2.4 sa", trend: "günlük operasyon" },
  ];

  return (
    <section
      ref={sectionRef}
      className={`analyticsSection ${active ? "isVisible" : ""}`}
      id="analytics"
    >
      <div className="sectionIntro compact">
        <span>Canlı analiz hissi</span>
        <h2>Takipio, veriyi sadece göstermez; neye bakman gerektiğini öne çıkarır.</h2>
        <p>
          Aşağıdaki panel örnek bir işletme senaryosudur. Amaç; sipariş, stok, ödeme ve pazaryeri
          hareketlerini tek bakışta anlaşılır hale getirmek.
        </p>
      </div>

      <div className="analyticsShell">
        <div className="analysisBoard">
          <div className="analysisTop">
            <div>
              <span className="liveLabel"><i /> Güncel analiz simülasyonu</span>
              <h3>Operasyon sağlığı</h3>
            </div>
            <div className="healthScore">
              <b>
                <CountUp end={87} suffix="%" active={active} />
              </b>
              <span>kontrol skoru</span>
            </div>
          </div>

          <div className="analysisGrid">
            {insightRows.map((row) => (
              <div className="analysisMetric" key={row.label}>
                <span>{row.label}</span>
                <b>{row.value}</b>
                <em>{row.trend}</em>
              </div>
            ))}
          </div>

          <div className="barStack">
            {bars.map((bar, index) => (
              <div
                className="analysisBar"
                key={bar.label}
                style={
                  {
                    "--bar-value": `${bar.value}%`,
                    "--bar-delay": `${index * 140}ms`,
                  } as React.CSSProperties
                }
              >
                <div className="barInfo">
                  <b>{bar.label}</b>
                  <span>{bar.before} → {bar.after}</span>
                </div>
                <div className="barTrack">
                  <i />
                </div>
                <p>{bar.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="profitSimulator">
          <span className="simEyebrow">Kazanım simülasyonu</span>
          <h3>Dağınık takip yerine ölçülebilir operasyon</h3>

          <div className="profitChart">
            <div>
              <b>
                <CountUp end={12} suffix="%" active={active} />
              </b>
              <span>net takip görünürlüğü</span>
            </div>
            <div>
              <b>
                <CountUp end={18} suffix="%" active={active} />
              </b>
              <span>daha hızlı aksiyon</span>
            </div>
            <div>
              <b>
                <CountUp end={2.4} suffix=" sa" decimals={1} active={active} />
              </b>
              <span>günlük zaman kazanımı</span>
            </div>
          </div>

          <div className="miniComparison">
            <div>
              <small>Takipio yokken</small>
              <strong>Panel panel kontrol</strong>
              <span>Geciken ödeme, stok açığı ve sipariş karmaşası daha geç fark edilir.</span>
            </div>
            <div>
              <small>Takipio ile</small>
              <strong>Öncelikli aksiyon listesi</strong>
              <span>Gorki AI, günün kritik noktalarını kısa özetlerle öne çıkarır.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


function FooterSection() {
  return (
    <footer className="siteFooter" id="contact">
      <div className="footerTop">
        <div>
          <img src="/takipio-logo.png" alt="Takipio" />
          <p>İşletme takibini, pazaryeri akışını ve Gorki AI özetlerini tek panelde birleştiren premium takip asistanı.</p>
        </div>

        <a className="instagramBox" href="https://instagram.com/takipiocom" target="_blank" rel="noreferrer">
          <span>Instagram</span>
          <b>@takipiocom</b>
          <em>Gelişmeleri takip et <ArrowIcon /></em>
        </a>
      </div>

      <div className="paymentRow">
        <span>Ödeme yöntemleri</span>
        <div>
          <b>Mastercard</b>
          <b>Visa</b>
          <b>Troy</b>
          <b>iyzico</b>
        </div>
      </div>

      <div className="copyrightRow">
        <span>© 2026 Takipio. Tüm hakları saklıdır.</span>
        <span>Burak Kutluk tarafından geliştirilmektedir.</span>
      </div>
    </footer>
  );
}

function SuccessModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="successModal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modalClose" onClick={onClose} aria-label="Kapat">
          <CloseIcon />
        </button>

        <div className="modalGorki">
          <img src="/gorki-hero.png" alt="Gorki AI" />
        </div>

        <span className="modalPill"><i /> Erken erişim onaylandı</span>
        <h3>Kaydın alındı.</h3>
        <p>
          Takipio listesine eklendin. TAKIPIO10 kodun hazır ve hoş geldin maili
          gönderildi.
        </p>

        <div className="modalList">
          <span><CheckIcon /> TAKIPIO10 kodu hazır</span>
          <span><CheckIcon /> Hoş geldin maili gönderildi</span>
          <span><CheckIcon /> Açılışta öncelikli bilgilendirme</span>
        </div>

        <button type="button" className="modalButton" onClick={onClose}>
          Harika, devam edelim
          <ArrowIcon />
        </button>
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

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
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

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M6 6l12 12M6 18 18 6" />
    </svg>
  );
}

const GLOBAL_CSS = `
:root {
  --bg: #050914;
  --ink: #f7fbff;
  --muted: rgba(226, 237, 255, .68);
  --muted2: rgba(226, 237, 255, .48);
  --line: rgba(147, 197, 253, .16);
  --line2: rgba(255,255,255,.1);
  --card: rgba(255,255,255,.075);
  --card2: rgba(255,255,255,.11);
  --blue: #0b63ff;
  --cyan: #22d3ee;
  --green: #34d399;
  --amber: #f5b547;
  --red: #f87171;
  --shadow: 0 34px 100px rgba(0,0,0,.42);
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  background: var(--bg);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}

body { min-height: 100vh; }

a { color: inherit; text-decoration: none; }
button, input { font-family: inherit; }
button { cursor: pointer; }
img { display: block; max-width: 100%; }

svg {
  width: 1em;
  height: 1em;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.25;
  stroke-linecap: round;
  stroke-linejoin: round;
}

#top, #product, #integrations, #gorki, #waitlist, #what, #gain, #contact {
  scroll-margin-top: 120px;
}

.takipioV8 {
  position: relative;
  min-height: 100svh;
  overflow: hidden;
  padding: 24px;
  background:
    radial-gradient(circle at 18% 16%, rgba(11,99,255,.22), transparent 28%),
    radial-gradient(circle at 84% 18%, rgba(34,211,238,.16), transparent 30%),
    linear-gradient(180deg, #050914 0%, #071020 58%, #050914 100%);
}

.v8Bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }

.mesh {
  position: absolute;
  border-radius: 999px;
  filter: blur(72px);
  opacity: .8;
}

.meshA { width: 520px; height: 520px; left: -220px; top: 90px; background: rgba(11,99,255,.22); }
.meshB { width: 560px; height: 560px; right: -220px; top: 90px; background: rgba(34,211,238,.16); }
.meshC { width: 400px; height: 400px; left: 45%; bottom: -240px; background: rgba(139,92,246,.16); }

.gridLayer {
  position: absolute;
  inset: 0;
  opacity: .55;
  background-image:
    linear-gradient(rgba(147,197,253,.052) 1px, transparent 1px),
    linear-gradient(90deg, rgba(147,197,253,.052) 1px, transparent 1px);
  background-size: 84px 84px;
  mask-image: radial-gradient(circle at 50% 36%, black 0%, transparent 74%);
}


/* ---------- light/dark theme system ---------- */

.takipioV8.lightMode {
  --bg: #f5f9ff;
  --ink: #06101f;
  --muted: rgba(52, 64, 84, .78);
  --muted2: rgba(71, 84, 103, .62);
  --line: rgba(11, 99, 255, .14);
  --line2: rgba(6, 16, 31, .08);
  --card: rgba(255,255,255,.78);
  --card2: rgba(255,255,255,.92);
  color: #06101f;
  background:
    radial-gradient(circle at 18% 16%, rgba(11,99,255,.12), transparent 28%),
    radial-gradient(circle at 84% 18%, rgba(34,211,238,.12), transparent 30%),
    linear-gradient(180deg, #f8fbff 0%, #eef6ff 58%, #f8fbff 100%);
}

.takipioV8.lightMode .meshA { background: rgba(11,99,255,.12); }
.takipioV8.lightMode .meshB { background: rgba(34,211,238,.14); }
.takipioV8.lightMode .meshC { background: rgba(139,92,246,.08); }

.takipioV8.lightMode .gridLayer {
  opacity: .55;
  background-image:
    linear-gradient(rgba(11,99,255,.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(11,99,255,.045) 1px, transparent 1px);
}

.takipioV8.lightMode .topNav,
.takipioV8.lightMode .integrationRail,
.takipioV8.lightMode .waitlistCard,
.takipioV8.lightMode .studio,
.takipioV8.lightMode .featureCard,
.takipioV8.lightMode .analysisBoard,
.takipioV8.lightMode .profitSimulator,
.takipioV8.lightMode .footerShell {
  background:
    radial-gradient(circle at 0% 0%, rgba(11,99,255,.065), transparent 34%),
    rgba(255,255,255,.82);
  border-color: rgba(11,99,255,.13);
  box-shadow: 0 24px 70px rgba(16, 24, 40, .09), inset 0 1px 0 rgba(255,255,255,.8);
}

.takipioV8.lightMode .topNav {
  background: rgba(255,255,255,.78);
}

.takipioV8.lightMode .brand {
  background:
    linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.03)),
    #050914;
  border-color: rgba(11,99,255,.18);
}

.takipioV8.lightMode .desktopNav,
.takipioV8.lightMode .trustLine span,
.takipioV8.lightMode .integrationRail p,
.takipioV8.lightMode .heroText,
.takipioV8.lightMode .featureCard span,
.takipioV8.lightMode .analysisBar p,
.takipioV8.lightMode .miniComparison span,
.takipioV8.lightMode .waitlistMeta,
.takipioV8.lightMode .gorkiPanel p,
.takipioV8.lightMode .gorkiPanel span,
.takipioV8.lightMode .couponMini em {
  color: rgba(71, 84, 103, .78);
}

.takipioV8.lightMode .hero h1,
.takipioV8.lightMode .railHeader b,
.takipioV8.lightMode .waitlistHeader b,
.takipioV8.lightMode .featureCard b,
.takipioV8.lightMode .analysisTop h3,
.takipioV8.lightMode .profitSimulator h3,
.takipioV8.lightMode .analysisMetric b,
.takipioV8.lightMode .profitChart strong,
.takipioV8.lightMode .miniComparison strong,
.takipioV8.lightMode .gorkiPanel b,
.takipioV8.lightMode .couponMini b,
.takipioV8.lightMode .successModal h3 {
  color: #06101f;
}

.takipioV8.lightMode .statusPill,
.takipioV8.lightMode .scrollCue,
.takipioV8.lightMode .railHeader span,
.takipioV8.lightMode .couponBadge,
.takipioV8.lightMode .modalPill,
.takipioV8.lightMode .simEyebrow,
.takipioV8.lightMode .liveLabel {
  color: #075985;
  background: rgba(224,242,254,.82);
  border-color: rgba(14,165,233,.18);
}

.takipioV8.lightMode .inputShell {
  background: rgba(255,255,255,.92);
  border-color: rgba(11,99,255,.15);
}

.takipioV8.lightMode .inputShell input {
  color: #06101f;
}

.takipioV8.lightMode .inputShell input::placeholder {
  color: rgba(71,84,103,.46);
}

.takipioV8.lightMode .floatingMetric,
.takipioV8.lightMode .gorkiPanel,
.takipioV8.lightMode .couponMini,
.takipioV8.lightMode .mobileDock {
  background: rgba(255,255,255,.84);
  border-color: rgba(11,99,255,.13);
  box-shadow: 0 24px 54px rgba(16,24,40,.11);
}

.takipioV8.lightMode .floatingMetric b,
.takipioV8.lightMode .modalList span,
.takipioV8.lightMode .healthScore b,
.takipioV8.lightMode .analysisMetric b,
.takipioV8.lightMode .barInfo b,
.takipioV8.lightMode .profitChart b,
.takipioV8.lightMode .successModal p {
  color: #06101f;
}

.takipioV8.lightMode .floatingMetric span,
.takipioV8.lightMode .barInfo span,
.takipioV8.lightMode .analysisMetric em,
.takipioV8.lightMode .profitChart span,
.takipioV8.lightMode .healthScore span,
.takipioV8.lightMode .miniComparison small {
  color: rgba(71,84,103,.68);
}

.takipioV8.lightMode .analysisMetric,
.takipioV8.lightMode .analysisBar,
.takipioV8.lightMode .profitChart div,
.takipioV8.lightMode .miniComparison div,
.takipioV8.lightMode .modalList span {
  background: rgba(255,255,255,.72);
  border-color: rgba(11,99,255,.11);
}

.takipioV8.lightMode .successModal {
  background:
    radial-gradient(circle at 50% 0%, rgba(34,211,238,.16), transparent 42%),
    rgba(255,255,255,.96);
  border-color: rgba(11,99,255,.14);
}

.takipioV8.lightMode .modalClose {
  background: rgba(6,16,31,.05);
  color: #06101f;
  border-color: rgba(6,16,31,.08);
}

.takipioV8.lightMode .mobileDock a {
  color: rgba(52,64,84,.78);
  background: rgba(255,255,255,.72);
}

.takipioV8.lightMode .mobileDock a:last-child {
  color: white;
  background: linear-gradient(135deg, var(--blue), var(--cyan));
}

.themeToggle {
  height: 46px;
  border: 1px solid rgba(147,197,253,.16);
  border-radius: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  color: var(--ink);
  background: rgba(255,255,255,.08);
  font-size: 13px;
  font-weight: 900;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.06);
}

.takipioV8.lightMode .themeToggle {
  color: #06101f;
  background: rgba(255,255,255,.82);
  border-color: rgba(11,99,255,.13);
}

.takipioV8.darkMode .themeToggle {
  color: white;
}


.topNav {
  width: min(1500px, calc(100% - 48px));
  height: 74px;
  position: fixed;
  left: 50%;
  top: 18px;
  transform: translateX(-50%);
  z-index: 50;
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 24px;
  padding: 8px;
  border-radius: 30px;
  background: rgba(6,16,31,.78);
  border: 1px solid rgba(255,255,255,.1);
  box-shadow: 0 18px 46px rgba(0,0,0,.3);
  backdrop-filter: blur(22px);
}

.brand {
  width: 180px;
  height: 58px;
  display: grid;
  place-items: center;
  border-radius: 23px;
  background: linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.03)), #050914;
  border: 1px solid rgba(255,255,255,.1);
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

.desktopNav a:hover { color: white; }

.navCta {
  height: 56px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  border-radius: 21px;
  color: white;
  background: linear-gradient(135deg, var(--blue), var(--cyan));
  box-shadow: 0 18px 38px rgba(11,99,255,.28);
  font-size: 14px;
  font-weight: 950;
}

.mobileDock { display: none; }

.hero {
  width: min(1500px, 100%);
  min-height: 900px;
  margin: 0 auto;
  padding-top: 118px;
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(430px, .88fr) minmax(700px, 1.12fr);
  gap: 48px;
  align-items: center;
}

.heroLeft { position: relative; z-index: 4; }

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
  background: rgba(255,255,255,.06);
  border: 1px solid var(--line);
  font-size: 12px;
  font-weight: 950;
  letter-spacing: .9px;
  text-transform: uppercase;
  margin-bottom: 28px;
}

.statusPill span {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: var(--green);
  box-shadow: 0 0 0 8px rgba(52,211,153,.12);
}

.hero h1 {
  max-width: 740px;
  margin: 0;
  color: white;
  font-size: clamp(54px, 5.3vw, 92px);
  line-height: .91;
  letter-spacing: -5.4px;
  font-weight: 950;
}

.hero h1 em {
  display: block;
  font-style: normal;
  width: max-content;
  max-width: 100%;
  background: linear-gradient(135deg, #fff 0%, #9defff 38%, #0b63ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 30px 80px rgba(11,99,255,.22);
}

.heroText {
  max-width: 650px;
  margin: 26px 0 0;
  color: var(--muted);
  font-size: 18px;
  line-height: 1.76;
  letter-spacing: -.2px;
  font-weight: 560;
}

.integrationRail,
.waitlistCard {
  width: min(660px, 100%);
  border-radius: 28px;
  background: linear-gradient(145deg, rgba(255,255,255,.1), rgba(255,255,255,.045));
  border: 1px solid var(--line);
  box-shadow: 0 24px 70px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,.07);
  backdrop-filter: blur(18px);
}

.integrationRail {
  margin: 28px 0 0;
  padding: 18px;
}

.railHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.railHeader span {
  display: inline-flex;
  min-height: 31px;
  align-items: center;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(11,99,255,.18);
  color: #a8d8ff;
  border: 1px solid rgba(147,197,253,.12);
  font-size: 11px;
  font-weight: 950;
  letter-spacing: .8px;
  text-transform: uppercase;
}

.railHeader b {
  max-width: 220px;
  color: white;
  text-align: right;
  font-size: 15px;
  line-height: 1.25;
}

.railLogos {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.railLogoCard {
  --accent: #0b63ff;
  min-height: 78px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 14px;
  border-radius: 20px;
  background: rgba(255,255,255,.96);
  border: 1px solid rgba(255,255,255,.08);
  box-shadow: 0 16px 30px rgba(0,0,0,.14);
  position: relative;
  overflow: hidden;
  transition: transform .22s ease, box-shadow .22s ease;
}

.railLogoCard:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 42px rgba(0,0,0,.22);
}

.railLogoCard:after {
  content: "";
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 4px;
  background: var(--accent);
}

.railLogoCard img {
  display: block;
  max-width: 122px;
  max-height: 36px;
  width: auto;
  height: auto;
  object-fit: contain;
}

.integrationRail p {
  margin: 14px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.58;
  font-weight: 650;
}

.waitlistCard {
  margin-top: 22px;
  padding: 20px;
}

.waitlistHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.waitlistHeader span {
  display: block;
  color: #8fd7ff;
  font-size: 12px;
  font-weight: 950;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.waitlistHeader b {
  display: block;
  color: white;
  font-size: 16px;
}

.priceChip {
  min-width: 92px;
  min-height: 58px;
  display: grid;
  place-items: center;
  padding: 8px 12px;
  border-radius: 18px;
  color: white;
  background: linear-gradient(135deg, rgba(11,99,255,.95), rgba(34,211,238,.78));
  box-shadow: 0 16px 30px rgba(11,99,255,.24);
}

.priceChip small {
  font-size: 10px;
  font-weight: 900;
  opacity: .88;
}

.priceChip strong {
  font-size: 24px;
  line-height: 1;
}

.emailRow {
  display: grid;
  grid-template-columns: 1fr 190px;
  gap: 10px;
}

.inputShell {
  height: 58px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(147,197,253,.18);
  border-radius: 18px;
  background: rgba(255,255,255,.08);
  padding: 0 16px;
}

.inputShell svg {
  width: 18px;
  height: 18px;
  color: var(--muted2);
}

.inputShell input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: white;
  font-size: 15px;
  font-weight: 650;
}

.inputShell input::placeholder { color: rgba(226,237,255,.42); }

.emailRow button,
.modalButton {
  height: 58px;
  border: 0;
  border-radius: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  color: white;
  background: linear-gradient(135deg, var(--blue), var(--cyan));
  box-shadow: 0 18px 34px rgba(11,99,255,.28);
  font-size: 15px;
  font-weight: 950;
}

.emailRow button:disabled { opacity: .7; cursor: wait; }

.spinner {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 2px solid rgba(255,255,255,.35);
  border-top-color: white;
  animation: spin .7s linear infinite;
}

.waitlistMeta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 13px;
  color: var(--muted2);
  font-size: 12px;
  font-weight: 740;
}

.waitlistMeta b {
  color: #fecaca;
}

.couponBadge {
  display: inline-flex;
  min-height: 25px;
  align-items: center;
  padding: 0 9px;
  border-radius: 999px;
  color: #baf6fe;
  background: rgba(34,211,238,.1);
  border: 1px solid rgba(34,211,238,.28);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 900;
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
  color: var(--muted);
  font-size: 13px;
  font-weight: 750;
}

.trustLine svg {
  width: 16px;
  height: 16px;
  color: var(--green);
}

.scrollCue {
  width: max-content;
  max-width: 100%;
  min-height: 40px;
  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 0 14px;
  border-radius: 999px;
  color: #baf6fe;
  background: rgba(34,211,238,.08);
  border: 1px solid rgba(34,211,238,.2);
  font-size: 12px;
  font-weight: 900;
  box-shadow: 0 14px 28px rgba(0,0,0,.16);
}

.scrollCue svg {
  width: 15px;
  height: 15px;
  transform: rotate(90deg);
}

.heroRight {
  min-height: 750px;
  position: relative;
}

.studio {
  position: relative;
  width: 100%;
  min-height: 735px;
  border-radius: 44px;
  background: radial-gradient(circle at 50% 0%, rgba(34,211,238,.16), transparent 36%),
    linear-gradient(145deg, rgba(255,255,255,.09), rgba(255,255,255,.035));
  border: 1px solid var(--line);
  box-shadow: 0 34px 100px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.08);
  backdrop-filter: blur(18px);
  overflow: hidden;
}

.studioGlow {
  position: absolute;
  width: 720px;
  height: 460px;
  left: 50%;
  top: 48%;
  transform: translate(-50%, -50%) rotate(-8deg);
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(34,211,238,.24), transparent 66%);
  filter: blur(4px);
}

.macbookScene {
  position: absolute;
  left: 6%;
  right: 7%;
  top: 50%;
  transform: translateY(-50%);
  perspective: 1600px;
  z-index: 4;
}

.macbook {
  position: relative;
  height: 445px;
  transform: rotateX(7deg) rotateY(-10deg) rotateZ(-1deg);
  transform-style: preserve-3d;
}

.macLid {
  position: relative;
  height: 100%;
  border-radius: 34px 34px 24px 24px;
  padding: 16px 16px 30px;
  background: linear-gradient(135deg, rgba(255,255,255,.34), rgba(255,255,255,.06) 45%, rgba(255,255,255,.22)),
    linear-gradient(180deg, #2f3a50, #111827 64%, #070b12);
  border: 1px solid rgba(255,255,255,.16);
  box-shadow: 0 64px 120px rgba(0,0,0,.48), inset 0 1px 0 rgba(255,255,255,.32);
}

.macCamera {
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

.macBase {
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: -25px;
  height: 34px;
  border-radius: 0 0 46px 46px;
  background: linear-gradient(180deg, #d3deee, #69768b 80%);
  box-shadow: 0 24px 50px rgba(0,0,0,.34);
}

.macBase span {
  position: absolute;
  left: 50%;
  top: 0;
  width: 92px;
  height: 7px;
  transform: translateX(-50%);
  border-radius: 0 0 12px 12px;
  background: rgba(5,9,20,.7);
}

.macScreen {
  height: 100%;
  overflow: hidden;
  border-radius: 24px;
  background: radial-gradient(circle at 76% 14%, rgba(11,99,255,.18), transparent 34%),
    linear-gradient(180deg, #081225, #020817);
  border: 1px solid rgba(255,255,255,.1);
  box-shadow: inset 0 0 60px rgba(11,99,255,.08), inset 0 1px 0 rgba(255,255,255,.06);
}

.browserBar {
  height: 50px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  background: rgba(255,255,255,.035);
  border-bottom: 1px solid rgba(255,255,255,.07);
}

.browserDots {
  display: flex;
  gap: 6px;
}

.browserDots i {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: rgba(255,255,255,.25);
}

.browserDots i:nth-child(1) { background: #ff6058; }
.browserDots i:nth-child(2) { background: #ffbd2e; }
.browserDots i:nth-child(3) { background: #29c940; }

.urlBox {
  justify-self: center;
  min-width: 260px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-radius: 8px;
  color: var(--muted2);
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.055);
  font-size: 11px;
  font-weight: 720;
}

.urlBox svg { width: 13px; height: 13px; }

.barRight { width: 48px; }

.dashboard {
  height: calc(100% - 50px);
  display: grid;
  grid-template-columns: 168px 1fr;
}

.dashboardSide {
  display: flex;
  flex-direction: column;
  padding: 16px 12px;
  background: rgba(0,0,0,.16);
  border-right: 1px solid rgba(255,255,255,.07);
}

.dashBrand {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-size: 13px;
  margin-bottom: 14px;
}

.dashBrand img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.dashboardSide nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dashboardSide button {
  min-height: 38px;
  border: 0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 11px;
  color: var(--muted);
  background: rgba(255,255,255,.055);
  font-size: 12px;
  font-weight: 900;
}

.dashboardSide button span {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(255,255,255,.22);
}

.dashboardSide button.active {
  color: white;
  background: linear-gradient(135deg, rgba(11,99,255,.95), rgba(34,211,238,.7));
  box-shadow: 0 16px 30px rgba(11,99,255,.22);
}

.dashboardSide button.active span {
  background: white;
  box-shadow: 0 0 12px white;
}

.sideGorki {
  margin-top: auto;
  padding: 13px;
  border-radius: 17px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.07);
}

.sideGorki strong {
  display: block;
  color: white;
  font-size: 13px;
  margin-bottom: 5px;
}

.sideGorki small {
  display: block;
  color: var(--muted2);
  line-height: 1.45;
  font-weight: 650;
}

.dashboardMain {
  padding: 16px;
  min-width: 0;
  overflow: hidden;
}

.tabView {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: viewIn .35s cubic-bezier(.22,1,.36,1);
}

.viewHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.viewHeader h3 {
  margin: 0;
  color: white;
  font-size: 21px;
  letter-spacing: -.7px;
}

.viewHeader span {
  display: block;
  margin-top: 2px;
  color: var(--muted2);
  font-size: 11px;
  font-weight: 750;
}

.viewRight {
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 10px;
  border-radius: 999px;
  color: var(--muted);
  background: rgba(255,255,255,.055);
  border: 1px solid rgba(255,255,255,.07);
  font-size: 11px;
  font-weight: 900;
}

.liveDot,
.aiDot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--green);
  box-shadow: 0 0 10px var(--green);
}

.aiDot {
  background: var(--cyan);
  box-shadow: 0 0 10px var(--cyan);
}

.statGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.statCard,
.chartPanel,
.activityPanel,
.dataTable,
.customerRow,
.marketDashCard,
.gorkiDashboard {
  background: rgba(255,255,255,.055);
  border: 1px solid rgba(255,255,255,.08);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
}

.statCard {
  min-height: 92px;
  border-radius: 18px;
  padding: 12px;
}

.statCard span {
  display: block;
  color: #8fd7ff;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  margin-bottom: 9px;
}

.statCard b {
  display: block;
  color: white;
  font-size: 20px;
  letter-spacing: -.4px;
}

.statCard em {
  display: block;
  color: var(--green);
  font-style: normal;
  font-size: 10px;
  font-weight: 950;
  margin-top: 7px;
}

.statCard em.muted { color: var(--muted2); }

.overviewLower {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1.25fr .92fr;
  gap: 12px;
}

.chartPanel,
.activityPanel {
  border-radius: 22px;
  overflow: hidden;
}

.chartPanel {
  padding: 13px;
  display: flex;
  flex-direction: column;
}

.chartTop {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.chartTop b {
  font-size: 12px;
  color: white;
}

.chartTop span {
  color: var(--muted2);
  font-size: 10px;
  font-weight: 750;
}

.chartSvg {
  flex: 1;
  min-height: 118px;
  width: 100%;
}

.chartLine {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: drawLine 1.8s cubic-bezier(.22,1,.36,1) forwards;
}

.chartArea {
  opacity: 0;
  animation: fadeIn .9s ease forwards .45s;
}

.activityPanel {
  padding: 13px;
}

.activityPanel b {
  display: block;
  font-size: 13px;
  color: white;
  margin-bottom: 12px;
}

.activityRow {
  min-height: 34px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  padding: 0 9px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 780;
  background: rgba(255,255,255,.045);
  margin-bottom: 8px;
}

.activityRow em {
  color: var(--muted2);
  font-style: normal;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
}

.dot.cyan { background: var(--cyan); box-shadow: 0 0 8px var(--cyan); }
.dot.green { background: var(--green); box-shadow: 0 0 8px var(--green); }
.dot.amber { background: var(--amber); box-shadow: 0 0 8px var(--amber); }

.dataTable {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-radius: 18px;
}

.tableHead,
.tableRow {
  display: grid;
  grid-template-columns: .72fr 1.1fr 1fr 1fr .8fr;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
}

.tableHead {
  color: var(--muted2);
  font-size: 9px;
  font-weight: 950;
  letter-spacing: .6px;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(255,255,255,.07);
}

.tableRow {
  color: var(--muted);
  font-size: 11px;
  font-weight: 780;
  animation: rowIn .38s ease both;
}

.tableRow:hover {
  background: rgba(255,255,255,.045);
}

.tableRow b,
.tableRow em {
  color: white;
  font-style: normal;
}

.badge {
  width: max-content;
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 950;
  white-space: nowrap;
}

.badge.ok { color: #bbf7d0; background: rgba(52,211,153,.12); border: 1px solid rgba(52,211,153,.22); }
.badge.warn { color: #fde68a; background: rgba(245,181,71,.12); border: 1px solid rgba(245,181,71,.22); }
.badge.info { color: #bfdbfe; background: rgba(96,165,250,.13); border: 1px solid rgba(96,165,250,.23); }
.badge.muted { color: var(--muted); background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.09); }
.badge.err { color: #fecaca; background: rgba(248,113,113,.13); border: 1px solid rgba(248,113,113,.23); }

.customerList {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: grid;
  gap: 8px;
  mask-image: linear-gradient(180deg, black 0%, black 82%, transparent 100%);
}

.customerRow {
  min-height: 54px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  border-radius: 16px;
  padding: 8px 10px;
  animation: rowIn .38s ease both;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #06101f;
  background: linear-gradient(135deg, var(--cyan), var(--blue));
  font-size: 11px;
  font-weight: 950;
}

.customerRow b {
  display: block;
  color: white;
  font-size: 12px;
}

.customerRow span {
  display: block;
  color: var(--muted2);
  font-size: 10px;
  font-weight: 720;
  margin-top: 2px;
}

.marketGrid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.marketDashCard {
  --accent: #0b63ff;
  min-height: 136px;
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  padding: 12px;
  animation: rowIn .38s ease both;
}

.marketDashCard:after {
  content: "";
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 4px;
  background: var(--accent);
}

.marketLogo {
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: rgba(255,255,255,.92);
  margin-bottom: 10px;
}

.marketLogo img {
  max-width: 116px;
  max-height: 30px;
  object-fit: contain;
}

.marketDashCard b {
  display: block;
  color: white;
  font-size: 13px;
}

.marketDashCard span {
  display: block;
  color: var(--muted2);
  font-size: 10px;
  margin: 3px 0 8px;
  font-weight: 720;
}

.marketDashCard em {
  color: var(--accent);
  font-style: normal;
  font-size: 10px;
  font-weight: 950;
}

.gorkiDashboard {
  flex: 1;
  min-height: 0;
  border-radius: 22px;
  padding: 15px;
}

.gorkiDashTop {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.gorkiDashTop img {
  width: 58px;
  height: 58px;
  object-fit: contain;
  border-radius: 18px;
  background: rgba(255,255,255,.07);
}

.gorkiDashTop b {
  display: block;
  color: white;
  font-size: 16px;
}

.gorkiDashTop span {
  color: var(--muted2);
  font-size: 12px;
  font-weight: 740;
}

.suggestionList {
  display: grid;
  gap: 9px;
}

.suggestion {
  min-height: 48px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 9px;
  align-items: center;
  padding: 9px;
  border-radius: 14px;
  background: rgba(255,255,255,.045);
  color: var(--muted);
  font-size: 12px;
  font-weight: 760;
  animation: rowIn .38s ease both;
}

.gorkiActions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.gorkiActions button {
  height: 38px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.08);
  background: rgba(255,255,255,.06);
  color: white;
  padding: 0 12px;
  font-weight: 850;
}

.gorkiActions button:last-child {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: linear-gradient(135deg, var(--blue), var(--cyan));
  border: 0;
}

.iphone {
  position: absolute;
  right: -42px;
  bottom: -34px;
  width: 190px;
  height: 390px;
  padding: 10px;
  border-radius: 42px;
  background: linear-gradient(135deg, rgba(255,255,255,.32), rgba(255,255,255,.06) 38%, rgba(255,255,255,.2)), #070b12;
  border: 1px solid rgba(255,255,255,.16);
  box-shadow: 0 46px 90px rgba(0,0,0,.48);
  z-index: 9;
}

.phoneFrame {
  position: relative;
  height: 100%;
  overflow: hidden;
  border-radius: 33px;
  padding: 26px 11px 12px;
  background: radial-gradient(circle at 70% 0%, rgba(11,99,255,.22), transparent 42%),
    linear-gradient(180deg, #091429, #040814);
  border: 1px solid rgba(255,255,255,.08);
}

.dynamicIsland {
  position: absolute;
  top: 10px;
  left: 50%;
  width: 68px;
  height: 18px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: #050914;
  z-index: 2;
}

.phoneStatus {
  display: flex;
  justify-content: space-between;
  color: white;
  font-size: 11px;
  font-weight: 950;
  margin-bottom: 13px;
}

.phoneStatus i {
  width: 20px;
  height: 10px;
  border-radius: 4px;
  background: rgba(255,255,255,.75);
}

.phoneContent {
  animation: viewIn .34s ease;
}

.phoneGreeting {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.phoneGreeting b {
  display: block;
  color: white;
  font-size: 13px;
}

.phoneGreeting span {
  color: #8fd7ff;
  font-size: 10px;
  font-weight: 780;
}

.phoneAvatar {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #06101f;
  background: linear-gradient(135deg, var(--cyan), var(--blue));
  font-size: 11px;
  font-weight: 950;
}

.phoneTabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  margin-bottom: 12px;
}

.phoneTabs span {
  min-height: 27px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: var(--muted);
  background: rgba(255,255,255,.07);
  font-size: 9px;
  font-weight: 900;
}

.phoneTabs span.active {
  color: white;
  background: linear-gradient(135deg, var(--blue), var(--cyan));
}

.phoneMetrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 7px;
  margin-bottom: 11px;
}

.phoneMetrics div {
  min-height: 70px;
  padding: 9px;
  border-radius: 15px;
  background: rgba(255,255,255,.07);
  border: 1px solid rgba(255,255,255,.07);
}

.phoneMetrics span {
  display: block;
  color: #8fd7ff;
  font-size: 9px;
  margin-bottom: 6px;
  font-weight: 750;
}

.phoneMetrics b {
  display: block;
  color: white;
  font-size: 13px;
}

.phoneMetrics em {
  display: block;
  color: var(--green);
  margin-top: 5px;
  font-style: normal;
  font-size: 9px;
  font-weight: 950;
}

.phoneList {
  border-radius: 15px;
  padding: 9px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.07);
}

.phoneListHead {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.phoneListHead b {
  color: white;
  font-size: 10px;
}

.phoneListHead span {
  color: #8fd7ff;
  font-size: 9px;
  font-weight: 850;
}

.phoneRow {
  min-height: 24px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 6px;
  align-items: center;
  color: var(--muted);
  font-size: 9px;
  font-weight: 780;
}

.phoneRow i {
  width: 6px;
  height: 6px;
  border-radius: 999px;
}

.phoneRow i.cyan { background: var(--cyan); }
.phoneRow i.green { background: var(--green); }
.phoneRow i.amber { background: var(--amber); }

.phoneRow em {
  color: var(--muted2);
  font-style: normal;
}

.phoneGorki {
  margin-top: 10px;
  min-height: 48px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 7px;
  align-items: center;
  padding: 8px;
  border-radius: 15px;
  color: var(--muted);
  background: rgba(255,255,255,.07);
  border: 1px solid rgba(255,255,255,.07);
  font-size: 9px;
  line-height: 1.35;
  font-weight: 760;
}

.phoneGorki img {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

.floatingMetric {
  position: absolute;
  z-index: 12;
  min-width: 178px;
  min-height: 68px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 11px;
  padding: 12px 14px;
  border-radius: 20px;
  background: rgba(255,255,255,.1);
  border: 1px solid var(--line);
  box-shadow: 0 24px 54px rgba(0,0,0,.28);
  backdrop-filter: blur(18px);
  animation: floatY 5s ease-in-out infinite;
}

.floatingMetric svg {
  width: 27px;
  height: 27px;
  color: #8fd7ff;
}

.floatingMetric b {
  display: block;
  color: white;
  font-size: 15px;
}

.floatingMetric span {
  display: block;
  color: var(--muted2);
  font-size: 12px;
  font-weight: 760;
  margin-top: 3px;
}

.floatingMetric em {
  color: var(--green);
  font-style: normal;
  font-size: 11px;
  font-weight: 950;
}

.metricOne {
  top: 58px;
  left: 34px;
}

.metricTwo {
  top: 62px;
  right: 34px;
  animation-delay: .7s;
}

.gorkiPanel {
  position: absolute;
  left: 34px;
  bottom: 32px;
  width: 292px;
  z-index: 13;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 13px;
  padding: 14px;
  border-radius: 26px;
  background: rgba(255,255,255,.1);
  border: 1px solid var(--line);
  box-shadow: 0 28px 64px rgba(0,0,0,.34);
  backdrop-filter: blur(18px);
}

.gorkiVisual {
  width: 66px;
  height: 66px;
  border-radius: 20px;
  background: rgba(255,255,255,.08);
  display: grid;
  place-items: center;
  overflow: hidden;
}

.gorkiVisual img {
  width: 62px;
  height: 62px;
  object-fit: contain;
}

.gorkiPanel b {
  display: block;
  color: white;
  font-size: 16px;
}

.gorkiPanel span {
  display: block;
  color: var(--muted2);
  font-size: 12px;
  font-weight: 760;
  margin: 3px 0 8px;
}

.gorkiPanel p {
  margin: 0;
  color: var(--muted);
  line-height: 1.45;
  font-size: 12px;
  font-weight: 760;
}

.couponMini {
  position: absolute;
  right: 34px;
  bottom: 35px;
  z-index: 14;
  width: 148px;
  min-height: 116px;
  padding: 14px;
  border-radius: 24px;
  color: white;
  background: radial-gradient(circle at 50% 0%, rgba(34,211,238,.22), transparent 50%), rgba(6,16,31,.84);
  border: 1px solid var(--line);
  box-shadow: 0 26px 56px rgba(0,0,0,.34);
  backdrop-filter: blur(18px);
}

.couponMini span {
  display: block;
  color: #8fd7ff;
  font-size: 10px;
  font-weight: 950;
  text-transform: uppercase;
}

.couponMini b {
  display: block;
  color: white;
  font-size: 17px;
  margin: 10px 0 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.couponMini em {
  display: block;
  color: var(--muted);
  font-style: normal;
  font-size: 12px;
  font-weight: 850;
}

.featureBand {
  width: min(1500px, 100%);
  margin: 24px auto 0;
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.featureCard {
  min-height: 158px;
  padding: 24px;
  border-radius: 30px;
  background: var(--card);
  border: 1px solid var(--line);
  box-shadow: 0 24px 70px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.06);
  backdrop-filter: blur(18px);
  transition: transform .22s ease, border-color .22s ease;
}

.featureCard:hover {
  transform: translateY(-4px);
  border-color: rgba(34,211,238,.3);
}

.featureCard div {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 15px;
  color: #8fd7ff;
  background: rgba(34,211,238,.09);
  margin-bottom: 16px;
}

.featureCard svg {
  width: 24px;
  height: 24px;
}

.featureCard b {
  display: block;
  color: white;
  font-size: 19px;
  letter-spacing: -.4px;
  margin-bottom: 8px;
}

.featureCard span {
  display: block;
  color: var(--muted);
  line-height: 1.6;
  font-size: 14px;
  font-weight: 650;
}


.storySection,
.compareSection,
.flowSection,
.siteFooter {
  width: min(1500px, 100%);
  margin: 24px auto 0;
  position: relative;
  z-index: 2;
}

.storySection,
.compareSection,
.flowSection {
  padding: 34px;
  border-radius: 38px;
  background: linear-gradient(145deg, rgba(255,255,255,.075), rgba(255,255,255,.032));
  border: 1px solid var(--line);
  box-shadow: 0 24px 70px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.06);
  backdrop-filter: blur(18px);
}

.sectionIntro {
  max-width: 850px;
  margin-bottom: 24px;
}

.sectionIntro.compact {
  max-width: 780px;
}

.sectionIntro span {
  width: max-content;
  min-height: 31px;
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(11,99,255,.16);
  border: 1px solid rgba(147,197,253,.14);
  color: #a8d8ff;
  font-size: 11px;
  font-weight: 950;
  letter-spacing: .8px;
  text-transform: uppercase;
  margin-bottom: 14px;
}

.sectionIntro h2 {
  margin: 0;
  color: white;
  font-size: clamp(32px, 3.2vw, 54px);
  line-height: 1.02;
  letter-spacing: -2.4px;
  font-weight: 950;
}

.sectionIntro p {
  max-width: 760px;
  margin: 16px 0 0;
  color: var(--muted);
  line-height: 1.72;
  font-size: 16px;
  font-weight: 590;
}

.offerGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.offerCard,
.gainCard,
.flowGrid article,
.liveDataCard {
  border-radius: 28px;
  background: rgba(255,255,255,.065);
  border: 1px solid rgba(255,255,255,.09);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
}

.offerCard {
  min-height: 285px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  transition: transform .22s ease, border-color .22s ease;
}

.offerCard:hover,
.gainCard:hover,
.flowGrid article:hover {
  transform: translateY(-4px);
  border-color: rgba(34,211,238,.26);
}

.offerStat {
  width: 104px;
  height: 104px;
  display: grid;
  place-items: center;
  text-align: center;
  border-radius: 28px;
  background: radial-gradient(circle at 50% 0%, rgba(34,211,238,.22), transparent 62%), rgba(255,255,255,.07);
  border: 1px solid rgba(147,197,253,.14);
  margin-bottom: 22px;
}

.offerStat b {
  display: block;
  color: white;
  font-size: 32px;
  line-height: 1;
  letter-spacing: -1.6px;
}

.offerStat span {
  display: block;
  color: var(--muted2);
  font-size: 11px;
  font-weight: 850;
  margin-top: -16px;
}

.offerCard h3 {
  margin: 0 0 10px;
  color: white;
  font-size: 22px;
  letter-spacing: -.7px;
}

.offerCard p,
.flowGrid p,
.liveDataCard p {
  margin: 0;
  color: var(--muted);
  line-height: 1.66;
  font-size: 14px;
  font-weight: 650;
}

.compareShell {
  display: grid;
  grid-template-columns: 1.35fr .65fr;
  gap: 16px;
  align-items: stretch;
}

.compareTable {
  overflow: hidden;
  border-radius: 28px;
  background: rgba(255,255,255,.055);
  border: 1px solid rgba(255,255,255,.09);
}

.compareHead,
.compareRow {
  display: grid;
  grid-template-columns: 1fr 1.1fr 1.1fr;
  gap: 12px;
  align-items: center;
  padding: 15px 18px;
}

.compareHead {
  color: var(--muted2);
  font-size: 11px;
  font-weight: 950;
  letter-spacing: .6px;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(255,255,255,.08);
}

.compareRow {
  color: var(--muted);
  font-size: 14px;
  font-weight: 760;
  border-bottom: 1px solid rgba(255,255,255,.055);
}

.compareRow:last-child { border-bottom: 0; }
.compareRow b { color: white; }
.compareRow .negative { color: rgba(254,202,202,.78); }
.compareRow .positive { color: rgba(187,247,208,.86); }

.liveDataCard {
  padding: 22px;
  min-height: 100%;
}

.liveLabel {
  width: max-content;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 29px;
  padding: 0 10px;
  border-radius: 999px;
  color: #bbf7d0;
  background: rgba(52,211,153,.1);
  border: 1px solid rgba(52,211,153,.2);
  font-size: 11px;
  font-weight: 950;
  margin-bottom: 16px;
}

.liveLabel i {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--green);
  box-shadow: 0 0 10px var(--green);
}

.liveDataCard h3 {
  margin: 0 0 16px;
  color: white;
  font-size: 24px;
  letter-spacing: -.8px;
}

.liveMetrics {
  display: grid;
  gap: 10px;
  margin-bottom: 16px;
}

.liveMetrics div {
  min-height: 74px;
  display: grid;
  align-content: center;
  gap: 3px;
  padding: 13px;
  border-radius: 18px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.075);
}

.liveMetrics b {
  color: white;
  font-size: 25px;
  letter-spacing: -.9px;
}

.liveMetrics span {
  color: var(--muted2);
  font-size: 12px;
  font-weight: 780;
}

.gainGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.gainCard {
  min-height: 170px;
  padding: 22px;
  transition: transform .22s ease, border-color .22s ease;
}

.gainCard strong {
  display: block;
  width: max-content;
  color: transparent;
  background: linear-gradient(135deg, #fff, #8fd7ff, var(--blue));
  -webkit-background-clip: text;
  background-clip: text;
  font-size: 44px;
  line-height: 1;
  letter-spacing: -2px;
  margin-bottom: 12px;
}

.gainCard b {
  display: block;
  color: white;
  font-size: 18px;
  margin-bottom: 8px;
}

.gainCard span {
  display: block;
  color: var(--muted);
  line-height: 1.56;
  font-size: 13px;
  font-weight: 680;
}

.flowGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.flowGrid article {
  min-height: 190px;
  padding: 22px;
  transition: transform .22s ease, border-color .22s ease;
}

.flowGrid small {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 15px;
  color: #8fd7ff;
  background: rgba(34,211,238,.09);
  border: 1px solid rgba(34,211,238,.16);
  font-weight: 950;
  margin-bottom: 18px;
}

.flowGrid b {
  display: block;
  color: white;
  font-size: 22px;
  margin-bottom: 8px;
}

.siteFooter {
  padding: 28px;
  border-radius: 38px 38px 0 0;
  background: rgba(255,255,255,.06);
  border: 1px solid var(--line);
  border-bottom: 0;
  box-shadow: 0 24px 70px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.06);
  backdrop-filter: blur(18px);
}

.footerTop {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 18px;
  align-items: stretch;
  margin-bottom: 20px;
}

.footerTop img {
  width: 160px;
  height: 48px;
  object-fit: contain;
  margin-bottom: 12px;
}

.footerTop p {
  max-width: 620px;
  margin: 0;
  color: var(--muted);
  line-height: 1.65;
  font-weight: 650;
}

.instagramBox {
  min-height: 150px;
  display: grid;
  align-content: center;
  gap: 7px;
  padding: 20px;
  border-radius: 28px;
  color: white;
  background: radial-gradient(circle at 0% 0%, rgba(236,72,153,.18), transparent 42%), rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.1);
  transition: transform .22s ease, border-color .22s ease;
}

.instagramBox:hover {
  transform: translateY(-4px);
  border-color: rgba(236,72,153,.32);
}

.instagramBox span {
  color: #fbcfe8;
  font-size: 12px;
  font-weight: 950;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.instagramBox b {
  font-size: 24px;
  letter-spacing: -.7px;
}

.instagramBox em {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--muted);
  font-style: normal;
  font-size: 13px;
  font-weight: 800;
}

.paymentRow,
.copyrightRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-top: 18px;
  border-top: 1px solid rgba(255,255,255,.08);
  color: var(--muted2);
  font-size: 13px;
  font-weight: 780;
}

.paymentRow div {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.paymentRow b {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  border-radius: 12px;
  color: white;
  background: rgba(255,255,255,.075);
  border: 1px solid rgba(255,255,255,.09);
  font-size: 12px;
}

.copyrightRow {
  margin-top: 18px;
}

.modalOverlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(0,0,0,.62);
  backdrop-filter: blur(16px);
  animation: fadeIn .18s ease;
}

.successModal {
  width: min(470px, 100%);
  position: relative;
  padding: 28px;
  border-radius: 32px;
  background: radial-gradient(circle at 50% 0%, rgba(34,211,238,.18), transparent 42%), rgba(6,16,31,.94);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  animation: modalIn .28s cubic-bezier(.22,1,.36,1);
}

.modalClose {
  position: absolute;
  right: 16px;
  top: 16px;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  border: 1px solid rgba(255,255,255,.08);
  background: rgba(255,255,255,.06);
  color: white;
}

.modalClose svg {
  width: 18px;
  height: 18px;
}

.modalGorki {
  width: 86px;
  height: 86px;
  display: grid;
  place-items: center;
  border-radius: 26px;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.09);
  margin-bottom: 18px;
}

.modalGorki img {
  width: 82px;
  height: 82px;
  object-fit: contain;
}

.modalPill {
  width: max-content;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  color: #a8d8ff;
  background: rgba(11,99,255,.16);
  border: 1px solid rgba(147,197,253,.14);
  font-size: 11px;
  font-weight: 950;
  letter-spacing: .8px;
  text-transform: uppercase;
}

.modalPill i {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--green);
  box-shadow: 0 0 10px var(--green);
}

.successModal h3 {
  margin: 16px 0 8px;
  color: white;
  font-size: 34px;
  line-height: 1;
  letter-spacing: -1.5px;
}

.successModal p {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
}

.modalList {
  display: grid;
  gap: 10px;
  margin: 20px 0;
}

.modalList span {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--muted);
  font-weight: 750;
}

.modalList svg {
  width: 17px;
  height: 17px;
  color: var(--green);
}

.modalButton {
  width: 100%;
}

@keyframes viewIn {
  from { opacity: 0; transform: translateY(10px) scale(.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes rowIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes drawLine {
  to { stroke-dashoffset: 0; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalIn {
  from { opacity: 0; transform: translateY(18px) scale(.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes floatY {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1460px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .heroLeft {
    max-width: 860px;
  }

  .heroRight {
    min-height: 780px;
  }

  .studio {
    min-height: 760px;
  }
}

@media (max-width: 1100px) {
  .takipioV8 {
    padding: 18px 14px 92px;
  }

  .topNav {
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

  .navCta {
    height: 52px;
    padding: 0 16px;
  }

  .themeToggle {
    height: 46px;
    padding: 0 12px;
    font-size: 12px;
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
    background: rgba(6,16,31,.86);
    border: 1px solid var(--line);
    box-shadow: 0 20px 44px rgba(0,0,0,.34);
    backdrop-filter: blur(18px);
  }

  .mobileDock a {
    display: grid;
    place-items: center;
    grid-template-rows: 17px 1fr;
    gap: 1px;
    border-radius: 17px;
    color: var(--muted);
    background: rgba(255,255,255,.06);
    font-size: 11px;
    font-weight: 900;
    line-height: 1;
  }

  .mobileDock a span {
    display: grid;
    place-items: center;
    width: 19px;
    height: 19px;
    border-radius: 8px;
    color: #8fd7ff;
    background: rgba(34,211,238,.09);
    font-size: 12px;
  }

  .mobileDock a:last-child {
    color: white;
    background: linear-gradient(135deg, rgba(11,99,255,.95), rgba(34,211,238,.72));
  }

  .mobileDock a:last-child span {
    color: white;
    background: rgba(255,255,255,.14);
  }

  .hero {
    padding-top: 112px;
    min-height: auto;
  }

  .railLogos {
    grid-template-columns: repeat(2, 1fr);
  }

  .macbookScene {
    left: 5%;
    right: 5%;
  }

  .floatingMetric {
    min-width: 160px;
  }

  .metricOne { top: 38px; left: 24px; }
  .metricTwo { top: 38px; right: 24px; }

  .gorkiPanel { left: 24px; bottom: 24px; }
  .couponMini { right: 24px; bottom: 26px; }

  .featureBand {
    grid-template-columns: 1fr;
  }
}


@media (max-width: 1100px) {
  .offerGrid,
  .compareShell,
  .gainGrid,
  .flowGrid,
  .footerTop {
    grid-template-columns: 1fr;
  }

  .storySection,
  .compareSection,
  .flowSection,
  .siteFooter {
    padding: 24px;
    border-radius: 30px;
  }

  .compareHead,
  .compareRow {
    grid-template-columns: 1fr;
    gap: 7px;
  }

  .compareHead span:nth-child(2),
  .compareHead span:nth-child(3) {
    display: none;
  }

  .paymentRow,
  .copyrightRow {
    align-items: flex-start;
    flex-direction: column;
  }

  .paymentRow div {
    justify-content: flex-start;
  }
}

@media (max-width: 780px) {
  .navCta {
    display: none;
  }

  .topNav {
    display: flex;
    justify-content: space-between;
  }

  .hero h1 {
    font-size: clamp(42px, 13vw, 62px);
    line-height: .98;
    letter-spacing: -2.6px;
  }

  .heroText {
    font-size: 16px;
    line-height: 1.72;
  }

  .railHeader,
  .waitlistHeader {
    flex-direction: column;
    align-items: flex-start;
  }

  .railHeader b {
    text-align: left;
    max-width: none;
  }

  .emailRow {
    grid-template-columns: 1fr;
  }

  .trustLine {
    flex-direction: column;
  }

  .heroRight {
    min-height: 700px;
  }

  .studio {
    min-height: 670px;
    border-radius: 32px;
  }

  .floatingMetric {
    display: none;
  }

  .macbookScene {
    left: 14px;
    right: 14px;
    top: 300px;
  }

  .macbook {
    height: 350px;
    transform: none;
  }

  .macLid {
    border-radius: 26px 26px 18px 18px;
    padding: 11px 11px 22px;
  }

  .browserBar {
    height: 46px;
    padding: 0 11px;
  }

  .urlBox {
    min-width: 160px;
    font-size: 9px;
  }

  .dashboard {
    grid-template-columns: 82px 1fr;
    height: calc(100% - 46px);
  }

  .dashboardSide {
    padding: 9px 7px;
  }

  .dashBrand b,
  .sideGorki {
    display: none;
  }

  .dashboardSide button {
    min-height: 29px;
    font-size: 0;
    padding: 0;
    justify-content: center;
  }

  .dashboardSide button span {
    width: 50%;
    height: 7px;
    border-radius: 999px;
  }

  .dashboardMain {
    padding: 9px;
  }

  .viewHeader h3 {
    font-size: 15px;
  }

  .viewHeader span,
  .viewRight {
    font-size: 9px;
  }

  .statGrid {
    grid-template-columns: 1fr;
  }

  .statGrid .statCard:nth-child(n + 2) {
    display: none;
  }

  .statCard {
    min-height: 62px;
  }

  .overviewLower {
    grid-template-columns: 1fr;
  }

  .activityPanel {
    display: none;
  }

  .chartSvg {
    min-height: 110px;
  }

  .tableHead,
  .tableRow {
    grid-template-columns: .8fr 1fr 1fr;
  }

  .tableHead span:nth-child(3),
  .tableHead span:nth-child(4),
  .tableRow > span:nth-child(3),
  .tableRow .badge {
    display: none;
  }

  .customerRow {
    grid-template-columns: auto 1fr;
  }

  .customerRow .badge {
    display: none;
  }

  .marketGrid {
    grid-template-columns: 1fr;
  }

  .marketDashCard:nth-child(n + 3) {
    display: none;
  }

  .gorkiDashboard {
    padding: 11px;
  }

  .gorkiDashTop img {
    width: 48px;
    height: 48px;
  }

  .iphone {
    width: 132px;
    height: 270px;
    right: -4px;
    bottom: -30px;
    border-radius: 32px;
  }

  .phoneFrame {
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

  .phoneMetrics {
    grid-template-columns: 1fr;
  }

  .phoneMetrics div:nth-child(2) {
    display: none;
  }

  .phoneGorki {
    font-size: 9px;
  }

  .gorkiPanel {
    width: calc(100% - 48px);
    left: 24px;
    right: 24px;
    bottom: 125px;
  }

  .couponMini {
    width: 132px;
    right: 24px;
    bottom: 20px;
    min-height: 96px;
  }

  .couponMini b {
    font-size: 14px;
  }
}


@media (max-width: 780px) {
  .heroRight { min-height: 760px; }
  .studio { min-height: 730px; overflow: hidden; }
  .macbookScene { top: 270px; left: 16px; right: 16px; }
  .macbook { height: 330px; }
  .iphone { right: 6px; bottom: -10px; }
  .gorkiPanel { bottom: 112px; }
  .couponMini { bottom: 16px; }
}

@media (max-width: 460px) {
  .takipioV8 {
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

  .hero h1 {
    font-size: 42px;
  }

  .integrationRail,
  .waitlistCard {
    padding: 16px;
    border-radius: 24px;
  }

  .railLogoCard {
    min-height: 68px;
  }

  .railLogoCard img {
    max-width: 112px;
    max-height: 34px;
  }

  .heroRight {
    min-height: 640px;
  }

  .studio {
    min-height: 620px;
  }

  .macbookScene {
    top: 282px;
  }

  .macbook {
    height: 316px;
  }

  .iphone {
    scale: .9;
    right: -18px;
    bottom: -32px;
  }

  .gorkiPanel {
    bottom: 116px;
  }

  .couponMini {
    right: 16px;
  }
}


@media (max-width: 460px) {
  .sectionIntro h2 { font-size: 31px; letter-spacing: -1.4px; }
  .sectionIntro p { font-size: 14px; }
  .offerCard, .gainCard, .flowGrid article { min-height: auto; padding: 18px; border-radius: 24px; }
  .offerStat { width: 86px; height: 86px; border-radius: 23px; }
  .offerStat b { font-size: 27px; }
  .liveDataCard { padding: 18px; border-radius: 24px; }
  .compareRow { font-size: 13px; padding: 14px; }
  .siteFooter { padding: 20px; }
  .instagramBox { min-height: 128px; border-radius: 24px; }
  .paymentRow b { min-height: 32px; font-size: 11px; }
  .heroRight { min-height: 700px; }
  .studio { min-height: 680px; }
  .macbookScene { top: 252px; }
  .macbook { height: 300px; }
}

/* ---------- V8 canlı analiz paneli ---------- */

.analyticsSection {
  width: min(1500px, 100%);
  margin: 34px auto 0;
  position: relative;
  z-index: 2;
}

.analyticsShell {
  display: grid;
  grid-template-columns: 1.1fr .9fr;
  gap: 16px;
  align-items: stretch;
}

.analysisBoard,
.profitSimulator {
  border-radius: 34px;
  background:
    radial-gradient(circle at 0% 0%, rgba(34,211,238,.12), transparent 34%),
    rgba(255,255,255,.062);
  border: 1px solid rgba(255,255,255,.09);
  box-shadow: 0 24px 70px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.055);
  backdrop-filter: blur(18px);
}

.analysisBoard {
  padding: 24px;
}

.analysisTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.analysisTop h3,
.profitSimulator h3 {
  margin: 12px 0 0;
  color: white;
  font-size: 28px;
  line-height: 1.05;
  letter-spacing: -1px;
}

.healthScore {
  min-width: 132px;
  min-height: 104px;
  display: grid;
  place-items: center;
  text-align: center;
  border-radius: 26px;
  background:
    radial-gradient(circle at 50% 0%, rgba(52,211,153,.18), transparent 58%),
    rgba(255,255,255,.07);
  border: 1px solid rgba(52,211,153,.18);
}

.healthScore b {
  color: white;
  font-size: 42px;
  line-height: 1;
  letter-spacing: -2px;
}

.healthScore span {
  color: var(--muted2);
  font-size: 11px;
  font-weight: 850;
  margin-top: -16px;
}

.analysisGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 11px;
  margin-bottom: 18px;
}

.analysisMetric {
  min-height: 112px;
  display: grid;
  align-content: center;
  gap: 5px;
  padding: 15px;
  border-radius: 22px;
  background: rgba(255,255,255,.055);
  border: 1px solid rgba(255,255,255,.075);
}

.analysisMetric span {
  color: #8fd7ff;
  font-size: 11px;
  font-weight: 900;
}

.analysisMetric b {
  color: white;
  font-size: 30px;
  line-height: 1;
  letter-spacing: -1.4px;
}

.analysisMetric em {
  color: var(--muted2);
  font-style: normal;
  font-size: 11px;
  font-weight: 820;
}

.barStack {
  display: grid;
  gap: 13px;
}

.analysisBar {
  padding: 15px;
  border-radius: 22px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.075);
  transform: translateY(12px);
  opacity: 0;
}

.analyticsSection.isVisible .analysisBar {
  animation: revealUp .55s cubic-bezier(.22,1,.36,1) forwards;
  animation-delay: var(--bar-delay);
}

.barInfo {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.barInfo b {
  color: white;
  font-size: 14px;
}

.barInfo span {
  color: var(--muted2);
  font-size: 12px;
  font-weight: 760;
}

.barTrack {
  height: 13px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.07);
}

.barTrack i {
  display: block;
  width: 0;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--blue), var(--cyan), #8b5cf6);
  box-shadow: 0 0 28px rgba(34,211,238,.35);
}

.analyticsSection.isVisible .barTrack i {
  animation: fillBar 1.35s cubic-bezier(.22,1,.36,1) forwards;
  animation-delay: calc(var(--bar-delay) + 180ms);
}

.analysisBar p {
  margin: 9px 0 0;
  color: var(--muted);
  line-height: 1.5;
  font-size: 12px;
  font-weight: 650;
}

.profitSimulator {
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.simEyebrow {
  width: max-content;
  min-height: 31px;
  display: inline-flex;
  align-items: center;
  padding: 0 11px;
  border-radius: 999px;
  color: #baf6fe;
  background: rgba(34,211,238,.1);
  border: 1px solid rgba(34,211,238,.2);
  font-size: 11px;
  font-weight: 950;
  letter-spacing: .8px;
  text-transform: uppercase;
}

.profitChart {
  display: grid;
  gap: 11px;
  margin: 20px 0;
}

.profitChart div {
  min-height: 92px;
  display: grid;
  align-content: center;
  gap: 5px;
  padding: 15px;
  border-radius: 22px;
  background: rgba(255,255,255,.055);
  border: 1px solid rgba(255,255,255,.075);
  position: relative;
  overflow: hidden;
}

.profitChart div:after {
  content: "";
  position: absolute;
  inset: auto 0 0 0;
  height: 3px;
  background: linear-gradient(90deg, var(--blue), var(--cyan));
  opacity: .9;
}

.profitChart b {
  color: transparent;
  background: linear-gradient(135deg, #fff, #8fd7ff, var(--blue));
  -webkit-background-clip: text;
  background-clip: text;
  font-size: 34px;
  line-height: 1;
  letter-spacing: -1.6px;
}

.profitChart span {
  color: var(--muted2);
  font-size: 12px;
  font-weight: 820;
}

.miniComparison {
  margin-top: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 11px;
}

.miniComparison div {
  padding: 15px;
  border-radius: 22px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.075);
}

.miniComparison small {
  display: block;
  color: #8fd7ff;
  font-size: 10px;
  font-weight: 950;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.miniComparison strong {
  display: block;
  color: white;
  font-size: 15px;
  margin-bottom: 7px;
}

.miniComparison span {
  display: block;
  color: var(--muted);
  line-height: 1.52;
  font-size: 12px;
  font-weight: 650;
}

@keyframes fillBar {
  to { width: var(--bar-value); }
}

@keyframes revealUp {
  to { opacity: 1; transform: translateY(0); }
}

/* ---------- mobile polish overrides ---------- */

@media (max-width: 1100px) {
  .analyticsShell {
    grid-template-columns: 1fr;
  }

  .analysisGrid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

@media (max-width: 780px) {
  .analyticsSection {
    margin-top: 18px;
  }

  .analysisBoard,
  .profitSimulator {
    border-radius: 28px;
    padding: 18px;
  }

  .analysisTop {
    flex-direction: column;
  }

  .healthScore {
    width: 100%;
    min-height: 88px;
    grid-template-columns: auto 1fr;
    justify-content: start;
    text-align: left;
    padding: 16px;
  }

  .healthScore span {
    margin-top: 0;
  }

  .analysisGrid,
  .miniComparison {
    grid-template-columns: 1fr;
  }

  .analysisMetric {
    min-height: 92px;
  }

  .barInfo {
    flex-direction: column;
    gap: 3px;
  }

  .profitChart div {
    min-height: 82px;
  }

  .mobileDock {
    height: 64px;
    padding: 8px;
    border-radius: 26px;
  }

  .mobileDock a {
    gap: 4px;
    font-size: 11px;
    background:
      radial-gradient(circle at 50% 0%, rgba(34,211,238,.08), transparent 60%),
      rgba(255,255,255,.065);
  }

  .mobileDock a:last-child {
    box-shadow: 0 12px 26px rgba(11,99,255,.24);
  }

  .heroRight {
    min-height: 670px;
  }

  .studio {
    min-height: 640px;
  }

  .macbookScene {
    top: 270px;
  }

  .macbook {
    height: 300px;
  }

  .iphone {
    width: 122px;
    height: 250px;
    right: -12px;
    bottom: -28px;
  }

  .gorkiPanel {
    bottom: 106px;
  }
}

@media (max-width: 460px) {
  .analysisTop h3,
  .profitSimulator h3 {
    font-size: 23px;
  }

  .healthScore b {
    font-size: 34px;
  }

  .profitChart b {
    font-size: 30px;
  }

  .heroRight {
    min-height: 610px;
  }

  .studio {
    min-height: 590px;
  }

  .macbookScene {
    top: 252px;
  }

  .macbook {
    height: 286px;
  }
}




/* ---------- FINAL LIGHT MODE READABILITY + LOGO FIX ---------- */

/* Logo görselinde beyaz yazı olduğu için light mode'da da logo kapsülü koyu kalır */
.takipioV8.lightMode .brand {
  background:
    linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.03)),
    #050914 !important;
  border-color: rgba(11,99,255,.18) !important;
  box-shadow: 0 18px 38px rgba(6,16,31,.12), inset 0 1px 0 rgba(255,255,255,.08) !important;
}

.takipioV8.lightMode .brand img {
  filter: none !important;
}

/* Alt içerik bölümlerinde beyaz yazı kalmasını engelle */
.takipioV8.lightMode .scrollContent,
.takipioV8.lightMode .scrollContent *,
.takipioV8.lightMode .featureBand,
.takipioV8.lightMode .featureBand *,
.takipioV8.lightMode .analyticsSection,
.takipioV8.lightMode .analyticsSection *,
.takipioV8.lightMode .footerArea,
.takipioV8.lightMode .footerArea *,
.takipioV8.lightMode .footerShell,
.takipioV8.lightMode .footerShell * {
  text-shadow: none !important;
}

/* Genel açıklama metinleri */
.takipioV8.lightMode .scrollContent p,
.takipioV8.lightMode .scrollContent span,
.takipioV8.lightMode .scrollContent li,
.takipioV8.lightMode .scrollContent small,
.takipioV8.lightMode .scrollContent em,
.takipioV8.lightMode .featureBand span,
.takipioV8.lightMode .analyticsSection p,
.takipioV8.lightMode .analyticsSection span,
.takipioV8.lightMode .analyticsSection small,
.takipioV8.lightMode .analyticsSection em,
.takipioV8.lightMode .footerArea span,
.takipioV8.lightMode .footerArea p,
.takipioV8.lightMode .footerArea small,
.takipioV8.lightMode .footerShell span,
.takipioV8.lightMode .footerShell p,
.takipioV8.lightMode .footerShell small {
  color: #475467 !important;
}

/* Başlıklar ve güçlü metinler */
.takipioV8.lightMode .scrollContent h1,
.takipioV8.lightMode .scrollContent h2,
.takipioV8.lightMode .scrollContent h3,
.takipioV8.lightMode .scrollContent h4,
.takipioV8.lightMode .scrollContent b,
.takipioV8.lightMode .scrollContent strong,
.takipioV8.lightMode .featureBand b,
.takipioV8.lightMode .analyticsSection h2,
.takipioV8.lightMode .analyticsSection h3,
.takipioV8.lightMode .analyticsSection b,
.takipioV8.lightMode .analyticsSection strong,
.takipioV8.lightMode .footerArea b,
.takipioV8.lightMode .footerArea strong,
.takipioV8.lightMode .footerShell b,
.takipioV8.lightMode .footerShell strong {
  color: #06101f !important;
}

/* Vurgulu rakamlar */
.takipioV8.lightMode .gainCard strong,
.takipioV8.lightMode .analysisMetric b,
.takipioV8.lightMode .healthScore b,
.takipioV8.lightMode .profitChart b {
  background: linear-gradient(135deg, #0b63ff, #22d3ee) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  color: transparent !important;
}

/* Rozetler */
.takipioV8.lightMode .sectionIntro span,
.takipioV8.lightMode .sectionBadge,
.takipioV8.lightMode .liveLabel,
.takipioV8.lightMode .simEyebrow,
.takipioV8.lightMode .offerCard small,
.takipioV8.lightMode .compareCard small,
.takipioV8.lightMode .flowCard small {
  color: #075985 !important;
  background: rgba(224,242,254,.88) !important;
  border-color: rgba(14,165,233,.22) !important;
}

/* Kart yüzeyleri */
.takipioV8.lightMode .gainCard,
.takipioV8.lightMode .offerCard,
.takipioV8.lightMode .compareCard,
.takipioV8.lightMode .flowCard,
.takipioV8.lightMode .featureCard,
.takipioV8.lightMode .analysisBoard,
.takipioV8.lightMode .profitSimulator,
.takipioV8.lightMode .analysisMetric,
.takipioV8.lightMode .analysisBar,
.takipioV8.lightMode .profitChart div,
.takipioV8.lightMode .miniComparison div,
.takipioV8.lightMode .footerShell,
.takipioV8.lightMode .paymentCard,
.takipioV8.lightMode .instagramCard {
  background:
    radial-gradient(circle at 0% 0%, rgba(11,99,255,.055), transparent 38%),
    rgba(255,255,255,.86) !important;
  border-color: rgba(11,99,255,.13) !important;
  box-shadow: 0 20px 54px rgba(16,24,40,.08), inset 0 1px 0 rgba(255,255,255,.88) !important;
}

/* Kırmızı/yeşil karşılaştırma satırlarında aşırı soluk görünümü düzelt */
.takipioV8.lightMode .negative,
.takipioV8.lightMode .minus,
.takipioV8.lightMode .bad,
.takipioV8.lightMode .danger {
  color: #d92d20 !important;
}

.takipioV8.lightMode .positive,
.takipioV8.lightMode .plus,
.takipioV8.lightMode .good,
.takipioV8.lightMode .success {
  color: #039855 !important;
}

/* Eğer kart içlerinde özel class yoksa renkli satırları yine okunur yap */
.takipioV8.lightMode .compareCard li:nth-child(2),
.takipioV8.lightMode .offerCard li:nth-child(2),
.takipioV8.lightMode .flowCard li:nth-child(2) {
  color: #d92d20 !important;
}

.takipioV8.lightMode .compareCard li:nth-child(3),
.takipioV8.lightMode .offerCard li:nth-child(3),
.takipioV8.lightMode .flowCard li:nth-child(3) {
  color: #039855 !important;
}

/* Mobil dock */
.takipioV8.lightMode .mobileDock {
  background: rgba(255,255,255,.94) !important;
  border-color: rgba(11,99,255,.16) !important;
  box-shadow: 0 18px 42px rgba(16,24,40,.14) !important;
}

.takipioV8.lightMode .mobileDock a {
  color: #475467 !important;
  background: rgba(245,249,255,.94) !important;
}

.takipioV8.lightMode .mobileDock a:last-child {
  color: #fff !important;
  background: linear-gradient(135deg, var(--blue), var(--cyan)) !important;
}

/* Üst tema butonu */
.takipioV8.lightMode .themeToggle {
  color: #06101f !important;
  background: rgba(255,255,255,.88) !important;
  border-color: rgba(11,99,255,.15) !important;
}

/* Çok açık kalan cam arka planları biraz sıkılaştır */
.takipioV8.lightMode .flowSection,
.takipioV8.lightMode .offerSection,
.takipioV8.lightMode .compareSection,
.takipioV8.lightMode .gainSection {
  color: #06101f !important;
}


/* ---------- Gorki floating chat widget ---------- */

.gorkiPanel {
  display: none !important;
}

.gorkiChatWidget {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 90;
  pointer-events: none;
}

.gorkiFloatingHead {
  width: 82px;
  height: 82px;
  position: relative;
  pointer-events: auto;
  display: grid;
  place-items: center;
  border: 1px solid rgba(147,197,253,.2);
  border-radius: 28px;
  background:
    radial-gradient(circle at 50% 0%, rgba(34,211,238,.2), transparent 58%),
    rgba(6,16,31,.88);
  box-shadow: 0 24px 64px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.08);
  backdrop-filter: blur(18px);
  color: white;
  transition: transform .22s ease, box-shadow .22s ease;
}

.gorkiFloatingHead:hover {
  transform: translateY(-4px) scale(1.03);
  box-shadow: 0 30px 80px rgba(11,99,255,.24), 0 24px 64px rgba(0,0,0,.34);
}

.gorkiFloatingHead img {
  width: 62px;
  height: 62px;
  object-fit: contain;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 14px 22px rgba(0,0,0,.28));
}

.gorkiFloatingHead em {
  position: absolute;
  left: 50%;
  bottom: -10px;
  transform: translateX(-50%);
  min-height: 24px;
  display: inline-flex;
  align-items: center;
  padding: 0 9px;
  border-radius: 999px;
  color: #06101f;
  background: linear-gradient(135deg, #8fd7ff, #22d3ee);
  font-style: normal;
  font-size: 10px;
  font-weight: 950;
  box-shadow: 0 10px 20px rgba(34,211,238,.22);
}

.gorkiPulse {
  position: absolute;
  inset: -6px;
  border-radius: 32px;
  border: 1px solid rgba(34,211,238,.34);
  animation: gorkiPulse 2.4s ease-in-out infinite;
}

.gorkiChatPanel {
  width: 380px;
  max-width: calc(100vw - 32px);
  margin-bottom: 18px;
  pointer-events: auto;
  border-radius: 30px;
  overflow: hidden;
  background:
    radial-gradient(circle at 0% 0%, rgba(34,211,238,.16), transparent 38%),
    rgba(6,16,31,.94);
  border: 1px solid rgba(147,197,253,.18);
  box-shadow: 0 34px 100px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.08);
  backdrop-filter: blur(22px);
  animation: chatIn .24s cubic-bezier(.22,1,.36,1);
}

.chatTop {
  min-height: 76px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}

.chatGorkiHead {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.08);
}

.chatGorkiHead img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.chatTop b {
  display: block;
  color: white;
  font-size: 16px;
  line-height: 1.1;
}

.chatTop span {
  display: block;
  color: var(--muted2);
  font-size: 12px;
  font-weight: 750;
  margin-top: 4px;
}

.chatTop button {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.08);
  background: rgba(255,255,255,.06);
  color: white;
}

.chatTop button svg {
  width: 18px;
  height: 18px;
}

.chatBody {
  display: grid;
  gap: 10px;
  padding: 14px;
  max-height: 360px;
  overflow: auto;
}

.chatBubble {
  width: fit-content;
  max-width: 86%;
  padding: 11px 13px;
  border-radius: 18px;
  color: rgba(226,237,255,.82);
  background: rgba(255,255,255,.07);
  border: 1px solid rgba(255,255,255,.075);
  font-size: 13px;
  line-height: 1.48;
  font-weight: 700;
}

.chatBubble.ai {
  border-top-left-radius: 8px;
}

.chatBubble.user {
  justify-self: end;
  color: white;
  background: linear-gradient(135deg, rgba(11,99,255,.95), rgba(34,211,238,.75));
  border-color: transparent;
  border-top-right-radius: 8px;
}

.chatBubble.highlight {
  color: #baf6fe;
  background: rgba(34,211,238,.1);
  border-color: rgba(34,211,238,.2);
}

.chatQuick {
  display: flex;
  gap: 8px;
  padding: 0 14px 14px;
  overflow-x: auto;
}

.chatQuick button {
  flex: 0 0 auto;
  min-height: 34px;
  padding: 0 11px;
  border-radius: 999px;
  color: #baf6fe;
  background: rgba(34,211,238,.08);
  border: 1px solid rgba(34,211,238,.18);
  font-size: 11px;
  font-weight: 850;
}

.chatInputFake {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  padding: 14px;
  border-top: 1px solid rgba(255,255,255,.08);
}

.chatInputFake span {
  min-height: 44px;
  display: flex;
  align-items: center;
  padding: 0 13px;
  border-radius: 16px;
  color: var(--muted2);
  background: rgba(255,255,255,.07);
  border: 1px solid rgba(255,255,255,.08);
  font-size: 13px;
  font-weight: 700;
}

.chatInputFake button {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  border: 0;
  color: white;
  background: linear-gradient(135deg, var(--blue), var(--cyan));
}

.chatInputFake button svg {
  width: 17px;
  height: 17px;
}

.takipioV8.lightMode .gorkiChatPanel {
  background:
    radial-gradient(circle at 0% 0%, rgba(11,99,255,.08), transparent 38%),
    rgba(255,255,255,.94);
  border-color: rgba(11,99,255,.14);
  box-shadow: 0 34px 100px rgba(16,24,40,.18), inset 0 1px 0 rgba(255,255,255,.88);
}

.takipioV8.lightMode .chatTop,
.takipioV8.lightMode .chatInputFake {
  border-color: rgba(11,99,255,.1);
}

.takipioV8.lightMode .chatTop b {
  color: #06101f;
}

.takipioV8.lightMode .chatTop span,
.takipioV8.lightMode .chatBubble.ai,
.takipioV8.lightMode .chatInputFake span {
  color: #475467;
}

.takipioV8.lightMode .chatBubble.ai,
.takipioV8.lightMode .chatInputFake span,
.takipioV8.lightMode .chatGorkiHead,
.takipioV8.lightMode .chatTop button {
  background: rgba(245,249,255,.9);
  border-color: rgba(11,99,255,.1);
}

.takipioV8.lightMode .chatTop button {
  color: #06101f;
}

.takipioV8.lightMode .gorkiFloatingHead {
  background:
    radial-gradient(circle at 50% 0%, rgba(11,99,255,.12), transparent 58%),
    rgba(255,255,255,.92);
  border-color: rgba(11,99,255,.16);
  box-shadow: 0 24px 64px rgba(16,24,40,.14), inset 0 1px 0 rgba(255,255,255,.84);
}

@keyframes chatIn {
  from { opacity: 0; transform: translateY(14px) scale(.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes gorkiPulse {
  0%, 100% { opacity: .45; transform: scale(1); }
  50% { opacity: .08; transform: scale(1.14); }
}

@media (max-width: 780px) {
  .gorkiChatWidget {
    right: 16px;
    bottom: 86px;
  }

  .gorkiFloatingHead {
    width: 68px;
    height: 68px;
    border-radius: 24px;
  }

  .gorkiFloatingHead img {
    width: 52px;
    height: 52px;
  }

  .gorkiChatPanel {
    width: calc(100vw - 32px);
    margin-bottom: 14px;
    border-radius: 26px;
  }

  .chatBody {
    max-height: 310px;
  }
}

`;
