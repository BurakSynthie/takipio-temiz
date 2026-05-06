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

/* ------------------------------------------------------------------ */
/*  Supabase client                                                    */
/* ------------------------------------------------------------------ */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

/* ------------------------------------------------------------------ */
/*  Types & constants                                                  */
/* ------------------------------------------------------------------ */

type TabKey = "overview" | "orders" | "customers" | "marketplaces" | "gorki";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Genel Bakış" },
  { key: "orders", label: "Siparişler" },
  { key: "customers", label: "Müşteriler" },
  { key: "marketplaces", label: "Pazaryerleri" },
  { key: "gorki", label: "Gorki AI" },
];

const MARKETPLACES = [
  { name: "Trendyol", src: "/trendyol.png" },
  { name: "Hepsiburada", src: "/hepsiburada.png" },
  { name: "Amazon", src: "/amazon.png" },
  { name: "Çiçeksepeti", src: "/ciceksepeti.png" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const userTouched = useRef(false);

  // Auto-rotate tabs unless user has clicked
  useEffect(() => {
    const id = window.setInterval(() => {
      if (userTouched.current) return;
      setActiveTab((cur) => {
        const i = TABS.findIndex((t) => t.key === cur);
        return TABS[(i + 1) % TABS.length].key;
      });
    }, 4500);
    return () => window.clearInterval(id);
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Geçerli bir e-posta adresi gir.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error: supaError } = await supabase
        .from("waitlist")
        .insert({ email: trimmed });

      if (supaError) {
        const dup =
          supaError.code === "23505" ||
          /duplicate|unique|already/i.test(supaError.message ?? "");
        setError(
          dup
            ? "Bu e-posta zaten erken erişim listesinde."
            : "Bir sorun oluştu. Lütfen birazdan tekrar dene."
        );
        setLoading(false);
        return;
      }

      // Welcome e-mail (don't block UX if it fails)
      try {
        await fetch("/api/send-welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed }),
        });
      } catch {
        /* silent */
      }

      setEmail("");
      setShowSuccess(true);
    } catch {
      setError("Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const onTabClick = (k: TabKey) => {
    userTouched.current = true;
    setActiveTab(k);
  };

  return (
    <main className="page">
      {/* ambient background */}
      <div className="bg-grid" aria-hidden />
      <div className="bg-orb bg-orb-a" aria-hidden />
      <div className="bg-orb bg-orb-b" aria-hidden />
      <div className="bg-vignette" aria-hidden />

      {/* nav */}
      <header className="nav">
        <div className="nav-row">
          <a href="#" className="brand">
            <img src="/takipio-logo.png" alt="" className="brand-mark" />
            <span className="brand-name">Takipio</span>
          </a>
          <a href="#waitlist" className="nav-cta">
            Erken erişim
            <ArrowRight />
          </a>
        </div>
      </header>

      {/* hero */}
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-left">
            <div className="pill">
              <span className="pill-dot" />
              <span>Erken erişim açık</span>
              <span className="pill-sep" />
              <span className="pill-dim">Sınırlı kontenjan</span>
            </div>

            <h1 className="title">
              İşletme akışını
              <br />
              <span className="title-grad">tek panelde sadeleştir.</span>
            </h1>

            <p className="lede">
              Sipariş, müşteri, stok, ödeme ve pazaryeri hareketlerini
              Takipio&apos;da topla. Gorki AI günlük işlerini senin için
              özetlesin.
            </p>

            {/* marketplace rail */}
            <div className="rail">
              <div className="rail-head">
                <span className="rail-eyebrow">
                  Pazaryeri entegrasyonları hazırlanıyor
                </span>
                <span className="rail-sub">
                  Satış kanallarınızı Takipio&apos;da tek panelde takip edin.
                </span>
              </div>
              <div className="rail-track">
                {MARKETPLACES.map((m) => (
                  <div className="rail-cell" key={m.name} title={m.name}>
                    <img src={m.src} alt={m.name} />
                  </div>
                ))}
              </div>
            </div>

            {/* form */}
            <form id="waitlist" className="form" onSubmit={handleSubmit}>
              <div className="form-field">
                <span className="form-icon" aria-hidden>
                  <MailIcon />
                </span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className="form-input"
                  placeholder="ornek@firma.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={loading}
                  aria-label="E-posta adresi"
                  required
                />
                <button
                  type="submit"
                  className="form-btn"
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? (
                    <span className="spinner" aria-label="Gönderiliyor" />
                  ) : (
                    <>
                      <span>Erken erişime katıl</span>
                      <ArrowRight />
                    </>
                  )}
                </button>
              </div>

              <div className="form-meta">
                <span className="coupon">
                  <span className="coupon-tag">TAKIPIO10</span>
                  <span className="coupon-text">
                    İlk ay <b>₺89</b>
                    <span className="coupon-dim"> · Sonrasında ₺99/ay</span>
                  </span>
                </span>

                {error ? (
                  <span className="form-error" role="alert">
                    <AlertIcon />
                    {error}
                  </span>
                ) : (
                  <span className="form-hint">
                    Spam yok. İstediğin zaman çıkabilirsin.
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* right column: device scene */}
          <div className="hero-right">
            <Scene activeTab={activeTab} onTabClick={onTabClick} />
          </div>
        </div>
      </section>

      {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} />}

      <style jsx global>{`
        ${GLOBAL_CSS}
      `}</style>
    </main>
  );
}

/* ================================================================== */
/*  Device scene                                                       */
/* ================================================================== */

function Scene({
  activeTab,
  onTabClick,
}: {
  activeTab: TabKey;
  onTabClick: (k: TabKey) => void;
}) {
  return (
    <div className="scene">
      <div className="scene-glow" aria-hidden />

      {/* floating mini coupon */}
      <div className="float float-coupon">
        <div className="float-coupon-row">
          <div className="float-coupon-tag">TAKIPIO10</div>
          <div className="float-coupon-meta">Açılışa özel</div>
        </div>
        <div className="float-coupon-price">
          <span>₺89</span>
          <span className="float-coupon-sub">ilk ay</span>
        </div>
      </div>

      {/* floating gorki bubble */}
      <div className="float float-gorki">
        <div className="gorki-orb-sm">
          <span>G</span>
        </div>
        <div className="float-gorki-text">
          <strong>Gorki AI</strong>
          <span>Bugün 12 sipariş bekliyor.</span>
        </div>
      </div>

      <Laptop activeTab={activeTab} onTabClick={onTabClick} />
      <Phone activeTab={activeTab} />
    </div>
  );
}

/* -------------------------------- Laptop ----------------------------- */

function Laptop({
  activeTab,
  onTabClick,
}: {
  activeTab: TabKey;
  onTabClick: (k: TabKey) => void;
}) {
  return (
    <div className="laptop">
      <div className="laptop-lid">
        <div className="laptop-cam" />
        <div className="laptop-screen">
          <div className="topbar">
            <div className="dots" aria-hidden>
              <span /> <span /> <span />
            </div>
            <div className="urlbar">
              <LockIcon />
              <span>app.takipio.com</span>
            </div>
            <div className="topbar-spacer" />
          </div>

          <div className="osBody">
            <aside className="sidebar">
              <div className="sidebar-brand">
                <img src="/takipio-logo.png" alt="" />
                <span>Takipio</span>
              </div>
              <nav className="sidebar-nav">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className={`side-item ${
                      activeTab === t.key ? "is-active" : ""
                    }`}
                    onClick={() => onTabClick(t.key)}
                  >
                    <span className="side-bullet" />
                    <span>{t.label}</span>
                    {activeTab === t.key && <span className="side-active" />}
                  </button>
                ))}
              </nav>
              <div className="sidebar-foot">
                <div className="user-chip">
                  <span className="user-avatar">A</span>
                  <span className="user-meta">
                    <b>Ahmet Y.</b>
                    <em>Yönetici</em>
                  </span>
                </div>
              </div>
            </aside>

            <div className="osMain">
              <TabContent tab={activeTab} />
            </div>
          </div>
        </div>
      </div>
      <div className="laptop-base">
        <div className="laptop-base-notch" />
      </div>
    </div>
  );
}

/* -------------------------------- Tab content ------------------------ */

function TabContent({ tab }: { tab: TabKey }) {
  return (
    <div key={tab} className="view">
      {tab === "overview" && <OverviewView />}
      {tab === "orders" && <OrdersView />}
      {tab === "customers" && <CustomersView />}
      {tab === "marketplaces" && <MarketplacesView />}
      {tab === "gorki" && <GorkiView />}
    </div>
  );
}

function ViewHead({
  title,
  sub,
  pill,
}: {
  title: string;
  sub: string;
  pill: ReactNode;
}) {
  return (
    <div className="view-head">
      <div>
        <div className="view-title">{title}</div>
        <div className="view-sub">{sub}</div>
      </div>
      <div className="view-pill">{pill}</div>
    </div>
  );
}

function OverviewView() {
  return (
    <>
      <ViewHead
        title="Genel Bakış"
        sub="Bugünün özeti · 09:42"
        pill={
          <>
            <span className="live-dot" />
            Canlı
          </>
        }
      />
      <div className="stats">
        <Stat label="Toplam ciro" value="₺184.250" trend="+%12,4" />
        <Stat label="Aktif sipariş" value="146" trend="+18 bugün" />
        <Stat label="Bekleyen ödeme" value="₺24.610" trend="9 fatura" muted />
        <Stat label="Stok durumu" value="%87" trend="3 kritik" muted />
      </div>
      <div className="chart">
        <div className="chart-head">
          <div>
            <div className="chart-title">Canlı satış</div>
            <div className="chart-meta">Son 7 gün</div>
          </div>
          <div className="chart-legend">
            <span className="legend cyan">Bu hafta</span>
            <span className="legend dim">Geçen hafta</span>
          </div>
        </div>
        <Sparkline />
      </div>
      <div className="activity">
        <ActivityRow color="cyan" text="Trendyol'dan 3 yeni sipariş" time="2 dk" />
        <ActivityRow color="green" text="#10246 teslim edildi" time="14 dk" />
        <ActivityRow color="amber" text="2 ürün kritik stokta" time="1 sa" />
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
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className={`stat-trend ${muted ? "is-muted" : ""}`}>{trend}</div>
    </div>
  );
}

function ActivityRow({
  color,
  text,
  time,
}: {
  color: "cyan" | "green" | "amber";
  text: string;
  time: string;
}) {
  return (
    <div className="act-row">
      <span className={`act-dot dot-${color}`} />
      <span className="act-text">{text}</span>
      <span className="act-time">{time}</span>
    </div>
  );
}

function Sparkline() {
  // two sample lines, current + previous week
  return (
    <svg className="spark" viewBox="0 0 460 130" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spk-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="spk-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <path
        className="spk-area"
        d="M0,95 C40,72 80,82 120,60 S200,30 240,46 S320,18 380,32 S440,22 460,28 L460,130 L0,130 Z"
        fill="url(#spk-fill)"
      />
      <path
        className="spk-prev"
        d="M0,108 C40,98 80,92 120,90 S200,80 240,82 S320,72 380,68 S440,60 460,62"
        fill="none"
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="1.6"
        strokeDasharray="3 4"
      />
      <path
        className="spk-line"
        d="M0,95 C40,72 80,82 120,60 S200,30 240,46 S320,18 380,32 S440,22 460,28"
        fill="none"
        stroke="url(#spk-stroke)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* -------------------------------- Orders ----------------------------- */

const ORDERS = [
  {
    id: "#10248",
    customer: "Ahmet Yılmaz",
    market: "Trendyol",
    status: "Hazırlanıyor",
    kind: "warn" as const,
    amount: "₺1.250",
  },
  {
    id: "#10247",
    customer: "Zeynep Kaya",
    market: "Hepsiburada",
    status: "Kargoda",
    kind: "info" as const,
    amount: "₺890",
  },
  {
    id: "#10246",
    customer: "Mert Demir",
    market: "Amazon",
    status: "Teslim edildi",
    kind: "ok" as const,
    amount: "₺2.140",
  },
  {
    id: "#10245",
    customer: "Selin Aksoy",
    market: "Çiçeksepeti",
    status: "Hazırlanıyor",
    kind: "warn" as const,
    amount: "₺640",
  },
  {
    id: "#10244",
    customer: "Burak Şahin",
    market: "Trendyol",
    status: "İade",
    kind: "err" as const,
    amount: "₺320",
  },
];

function OrdersView() {
  return (
    <>
      <ViewHead
        title="Siparişler"
        sub="Bugün 18 yeni sipariş"
        pill={<>5 / 18</>}
      />
      <div className="table">
        <div className="thead">
          <span>Sipariş</span>
          <span>Müşteri</span>
          <span>Pazaryeri</span>
          <span>Durum</span>
          <span className="ta-r">Tutar</span>
        </div>
        {ORDERS.map((o, i) => (
          <div
            className="trow"
            key={o.id}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span className="mono">{o.id}</span>
            <span>{o.customer}</span>
            <span className="dim">{o.market}</span>
            <span>
              <span className={`badge badge-${o.kind}`}>{o.status}</span>
            </span>
            <span className="ta-r mono">{o.amount}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* -------------------------------- Customers -------------------------- */

const CUSTOMERS = [
  { name: "Ahmet Yılmaz", orders: 24, last: "Bugün", status: "Aktif", kind: "ok" as const },
  { name: "Zeynep Kaya", orders: 18, last: "Dün", status: "Aktif", kind: "ok" as const },
  { name: "Mert Demir", orders: 12, last: "3 gün önce", status: "Aktif", kind: "ok" as const },
  { name: "Selin Aksoy", orders: 9, last: "1 hf önce", status: "Yeni", kind: "info" as const },
  { name: "Burak Şahin", orders: 6, last: "2 hf önce", status: "Pasif", kind: "muted" as const },
  { name: "Ece Polat", orders: 4, last: "1 ay önce", status: "Pasif", kind: "muted" as const },
];

function CustomersView() {
  return (
    <>
      <ViewHead
        title="Müşteriler"
        sub="Son 30 gün · 384 müşteri"
        pill={<>+24 yeni</>}
      />
      <div className="customers">
        {CUSTOMERS.map((c, i) => (
          <div
            key={c.name}
            className="cust-row"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="cust-avatar">
              {c.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="cust-info">
              <div className="cust-name">{c.name}</div>
              <div className="cust-meta">
                {c.orders} sipariş · son {c.last.toLowerCase()}
              </div>
            </div>
            <span className={`badge badge-${c.kind}`}>{c.status}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* -------------------------------- Marketplaces ----------------------- */

const MARKET_STATUS = [
  { name: "Trendyol", src: "/trendyol.png", status: "Hazırlanıyor", kind: "warn" as const },
  { name: "Amazon", src: "/amazon.png", status: "Planlandı", kind: "info" as const },
  { name: "Hepsiburada", src: "/hepsiburada.png", status: "Hazırlanıyor", kind: "warn" as const },
  { name: "Çiçeksepeti", src: "/ciceksepeti.png", status: "Yakında", kind: "muted" as const },
];

function MarketplacesView() {
  return (
    <>
      <ViewHead
        title="Pazaryerleri"
        sub="Entegrasyon durumu · 4 kanal"
        pill={
          <>
            <span className="live-dot" />
            4 aktif
          </>
        }
      />
      <div className="markets">
        {MARKET_STATUS.map((m, i) => (
          <div
            key={m.name}
            className="market-card"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="market-logo">
              <img src={m.src} alt={m.name} />
            </div>
            <div className="market-info">
              <div className="market-name">{m.name}</div>
              <span className={`badge badge-${m.kind}`}>{m.status}</span>
            </div>
            <div className="market-arrow">
              <ArrowRight />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* -------------------------------- Gorki ------------------------------ */

function GorkiView() {
  const items: { kind: "up" | "warn" | "info"; text: string }[] = [
    { kind: "up", text: "Bugün pazaryeri siparişlerinde %18 artış var." },
    { kind: "warn", text: "2 ürün kritik stok seviyesine yaklaşıyor." },
    { kind: "info", text: "Bekleyen 4 ödeme için hatırlatma öneriyorum." },
  ];
  return (
    <>
      <ViewHead
        title="Gorki AI"
        sub="Günlük öneriler · 09:42"
        pill={
          <>
            <span className="ai-dot" />
            Aktif
          </>
        }
      />
      <div className="gorki-card">
        <div className="gorki-head">
          <div className="gorki-orb">
            <span>G</span>
          </div>
          <div>
            <div className="gorki-title">Bugünün özeti</div>
            <div className="gorki-meta">3 öneri hazır</div>
          </div>
        </div>
        <div className="gorki-list">
          {items.map((it, i) => (
            <div
              className="gi-row"
              key={i}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className={`gi-icon gi-${it.kind}`}>
                {it.kind === "up" ? (
                  <UpIcon />
                ) : it.kind === "warn" ? (
                  <AlertIcon />
                ) : (
                  <InfoIcon />
                )}
              </span>
              <span className="gi-text">{it.text}</span>
            </div>
          ))}
        </div>
        <div className="gorki-foot">
          <button type="button" className="ghost-btn">
            Hepsini gör
          </button>
          <button type="button" className="primary-btn">
            Aksiyon al
            <ArrowRight />
          </button>
        </div>
      </div>
    </>
  );
}

/* -------------------------------- Phone ------------------------------ */

function Phone({ activeTab }: { activeTab: TabKey }) {
  const data = useMemo(() => phoneData(activeTab), [activeTab]);

  return (
    <div className="phone">
      <div className="phone-frame">
        <div className="phone-island" />
        <div className="phone-screen">
          <div className="phone-status">
            <span className="phone-time">9:41</span>
            <span className="phone-bars">
              <span /> <span /> <span /> <span />
            </span>
          </div>

          <div className="phone-greet">
            <div>
              <div className="phone-hi">Merhaba, Ahmet</div>
              <div className="phone-day">{data.day}</div>
            </div>
            <div className="phone-avatar">A</div>
          </div>

          <div className="phone-tabs">
            {TABS.slice(0, 4).map((t) => (
              <span
                key={t.key}
                className={`phone-tab ${
                  activeTab === t.key ? "is-active" : ""
                }`}
              >
                {t.label.split(" ")[0]}
              </span>
            ))}
          </div>

          <div key={activeTab} className="phone-content">
            <div className="phone-metrics">
              <div className="pm">
                <div className="pm-label">{data.m1.label}</div>
                <div className="pm-value">{data.m1.value}</div>
                <div className="pm-trend">{data.m1.trend}</div>
              </div>
              <div className="pm">
                <div className="pm-label">{data.m2.label}</div>
                <div className="pm-value">{data.m2.value}</div>
                <div className="pm-trend muted">{data.m2.trend}</div>
              </div>
            </div>

            <div className="phone-list">
              <div className="phone-list-head">
                <span>{data.listTitle}</span>
                <span className="phone-list-meta">Tümü</span>
              </div>
              {data.rows.map((r, i) => (
                <div key={i} className="phone-row">
                  <span className={`phone-dot dot-${r.color}`} />
                  <span className="phone-row-text">{r.text}</span>
                  <span className="phone-row-time">{r.time}</span>
                </div>
              ))}
            </div>

            <div className="phone-gorki">
              <div className="pg-orb">
                <span>G</span>
              </div>
              <div>
                <div className="pg-title">Gorki AI</div>
                <div className="pg-text">{data.gorki}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function phoneData(tab: TabKey) {
  switch (tab) {
    case "orders":
      return {
        day: "Çarşamba · 18 yeni sipariş",
        m1: { label: "Aktif sip.", value: "146", trend: "+18" },
        m2: { label: "Bekleyen", value: "9", trend: "kargo" },
        listTitle: "Son siparişler",
        rows: [
          { color: "cyan", text: "#10248 Trendyol", time: "2 dk" },
          { color: "green", text: "#10246 teslim", time: "14 dk" },
          { color: "amber", text: "#10245 hazırlık", time: "1 sa" },
        ],
        gorki: "Hazırlık süresi %22 azaldı.",
      };
    case "customers":
      return {
        day: "Çarşamba · 24 yeni müşteri",
        m1: { label: "Yeni müşteri", value: "24", trend: "+%9" },
        m2: { label: "Aktif", value: "318", trend: "müşteri" },
        listTitle: "Son müşteriler",
        rows: [
          { color: "cyan", text: "Selin Aksoy", time: "5 dk" },
          { color: "green", text: "Mert Demir", time: "22 dk" },
          { color: "amber", text: "Zeynep Kaya", time: "1 sa" },
        ],
        gorki: "5 müşteri tekrar sipariş verdi.",
      };
    case "marketplaces":
      return {
        day: "Çarşamba · 4 kanal aktif",
        m1: { label: "Bağlı kanal", value: "4", trend: "aktif" },
        m2: { label: "Senk.", value: "98%", trend: "başarılı" },
        listTitle: "Kanallar",
        rows: [
          { color: "cyan", text: "Trendyol senk.", time: "şimdi" },
          { color: "green", text: "Hepsiburada ok", time: "3 dk" },
          { color: "amber", text: "Amazon kuyruk", time: "12 dk" },
        ],
        gorki: "2 kanal yakında aktif olacak.",
      };
    case "gorki":
      return {
        day: "Çarşamba · 3 yeni öneri",
        m1: { label: "Öneri", value: "3", trend: "yeni" },
        m2: { label: "Otomasyon", value: "12", trend: "aktif" },
        listTitle: "Bugünün önerileri",
        rows: [
          { color: "cyan", text: "Stok hatırlatması", time: "2 dk" },
          { color: "green", text: "Ödeme tamamlandı", time: "9 dk" },
          { color: "amber", text: "Kritik ürün", time: "32 dk" },
        ],
        gorki: "3 önerin uygulanmaya hazır.",
      };
    default:
      return {
        day: "Çarşamba · Bugün 12 sipariş",
        m1: { label: "Ciro", value: "₺184K", trend: "+%12" },
        m2: { label: "Bekleyen", value: "₺24K", trend: "9 fatura" },
        listTitle: "Son hareketler",
        rows: [
          { color: "cyan", text: "Trendyol siparişi", time: "2 dk" },
          { color: "green", text: "#10246 teslim", time: "14 dk" },
          { color: "amber", text: "Stok uyarısı", time: "1 sa" },
        ],
        gorki: "Bugün %18 daha iyi gidiyorsun.",
      };
  }
}

/* ================================================================== */
/*  Success modal                                                      */
/* ================================================================== */

function SuccessModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Kapat"
        >
          <CloseIcon />
        </button>

        <div className="modal-orb-wrap" aria-hidden>
          <div className="modal-orb-glow" />
          <div className="modal-orb">
            <span>G</span>
          </div>
        </div>

        <div className="modal-eyebrow">
          <span className="modal-dot" />
          Erken erişim onaylandı
        </div>
        <h3 className="modal-title">Listemizdesin.</h3>
        <p className="modal-sub">
          Takipio&apos;ya katıldığın için teşekkürler. Açılışta seninle ilk biz
          iletişime geçeceğiz.
        </p>

        <ul className="modal-list">
          <li>
            <CheckBadge />
            <span>
              <b>Kaydın alındı.</b> Listemize başarıyla eklendin.
            </span>
          </li>
          <li>
            <CheckBadge />
            <span>
              <b>TAKIPIO10</b> kodun ilk ay için hazır.
            </span>
          </li>
          <li>
            <CheckBadge />
            <span>
              Hoş geldin <b>e-postan</b> kutuna gönderildi.
            </span>
          </li>
        </ul>

        <button type="button" className="modal-cta" onClick={onClose}>
          Harika, devam edelim
          <ArrowRight />
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Tiny inline icons                                                  */
/* ================================================================== */

function ArrowRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 6l12 12M6 18 18 6" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    </svg>
  );
}
function UpIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 17l6-6 4 4 7-7" />
      <path d="M14 8h6v6" />
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}
function CheckBadge() {
  return (
    <span className="check-badge" aria-hidden>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12l5 5L20 7" />
      </svg>
    </span>
  );
}

/* ================================================================== */
/*  Global CSS                                                         */
/* ================================================================== */

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --bg-0: #060916;
  --bg-1: #0A1024;
  --surface: rgba(255,255,255,0.035);
  --surface-2: rgba(255,255,255,0.06);
  --surface-3: rgba(255,255,255,0.085);
  --border: rgba(255,255,255,0.08);
  --border-strong: rgba(255,255,255,0.14);
  --text-1: #ECF0F8;
  --text-2: #97A0B6;
  --text-3: #5C657B;
  --accent: #22D3EE;
  --accent-2: #3B82F6;
  --accent-3: #818CF8;
  --ok: #34D399;
  --warn: #F5B547;
  --err: #F87171;
  --info: #60A5FA;
  --r-sm: 8px;
  --r: 14px;
  --r-lg: 20px;
}

* { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0;
  background: var(--bg-0);
  color: var(--text-1);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  font-feature-settings: 'cv02','cv03','cv04','cv11','ss01';
  font-size: 16px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}
body { min-height: 100vh; }
img { display: block; max-width: 100%; }
button { font-family: inherit; }
a { color: inherit; text-decoration: none; }

.page {
  position: relative;
  min-height: 100vh;
  isolation: isolate;
  overflow: hidden;
}

/* ---------- background ---------- */
.bg-grid {
  position: fixed; inset: 0; z-index: -2;
  background:
    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px) 0 0 / 64px 64px,
    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px) 0 0 / 64px 64px,
    radial-gradient(ellipse at top, var(--bg-1) 0%, var(--bg-0) 60%);
  mask-image: radial-gradient(ellipse 80% 70% at 50% 30%, #000 40%, transparent 100%);
  pointer-events: none;
}
.bg-orb {
  position: fixed; z-index: -1;
  width: 720px; height: 720px;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.55;
  pointer-events: none;
}
.bg-orb-a {
  top: -260px; left: -180px;
  background: radial-gradient(circle, rgba(34,211,238,0.45) 0%, transparent 60%);
}
.bg-orb-b {
  top: 200px; right: -240px;
  background: radial-gradient(circle, rgba(59,130,246,0.42) 0%, transparent 60%);
}
.bg-vignette {
  position: fixed; inset: 0; z-index: -1;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.55) 100%);
  pointer-events: none;
}

/* ---------- nav ---------- */
.nav {
  position: relative;
  z-index: 5;
  padding: 22px 24px 0;
}
.nav-row {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: rgba(10,15,28,0.55);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}
.brand { display: flex; align-items: center; gap: 10px; }
.brand-mark { width: 26px; height: 26px; border-radius: 7px; }
.brand-name {
  font-weight: 600; font-size: 15.5px;
  letter-spacing: -0.01em;
}
.nav-cta {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 14px;
  font-size: 13.5px; font-weight: 500;
  color: var(--text-1);
  background: var(--surface-2);
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  transition: all .2s ease;
}
.nav-cta:hover {
  background: var(--surface-3);
  transform: translateY(-1px);
}

/* ---------- hero ---------- */
.hero {
  position: relative;
  z-index: 1;
  padding: 60px 24px 100px;
}
.hero-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  gap: 60px;
  align-items: center;
}
.hero-left {
  animation: fadeUp .7s cubic-bezier(.22,1,.36,1) both;
}
.hero-right {
  animation: fadeUp .9s cubic-bezier(.22,1,.36,1) .15s both;
}

/* ---------- pill ---------- */
.pill {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 6px 14px 6px 10px;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-1);
  letter-spacing: 0.01em;
  backdrop-filter: blur(8px);
}
.pill-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 4px rgba(34,211,238,0.18), 0 0 12px rgba(34,211,238,0.6);
  animation: pulse 2.4s ease-in-out infinite;
}
.pill-sep {
  width: 1px; height: 12px;
  background: var(--border-strong);
}
.pill-dim { color: var(--text-2); }

/* ---------- title ---------- */
.title {
  margin: 22px 0 18px;
  font-size: clamp(2.4rem, 5.6vw, 4.4rem);
  font-weight: 600;
  letter-spacing: -0.038em;
  line-height: 1.04;
  color: var(--text-1);
}
.title-grad {
  background: linear-gradient(120deg, #E7ECF5 0%, #22D3EE 45%, #3B82F6 95%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display: inline-block;
}
.lede {
  font-size: clamp(15.5px, 1.25vw, 17.5px);
  line-height: 1.62;
  color: var(--text-2);
  max-width: 540px;
  margin: 0 0 36px;
}

/* ---------- rail ---------- */
.rail {
  margin-bottom: 28px;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  background: linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.005));
  backdrop-filter: blur(10px);
}
.rail-head {
  display: flex; flex-direction: column; gap: 4px;
  margin-bottom: 16px;
}
.rail-eyebrow {
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-1);
}
.rail-sub {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.5;
}
.rail-track {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.rail-cell {
  position: relative;
  height: 64px;
  display: flex; align-items: center; justify-content: center;
  padding: 10px 14px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  border-radius: var(--r);
  transition: all .25s ease;
  overflow: hidden;
}
.rail-cell::after {
  content: '';
  position: absolute; left: 14px; right: 14px; bottom: -1px; height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  opacity: 0;
  transition: opacity .3s ease;
}
.rail-cell img {
  max-height: 28px;
  max-width: 100%;
  width: auto;
  object-fit: contain;
  opacity: 0.85;
  filter: brightness(1.05);
  transition: all .25s ease;
}
.rail-cell:hover {
  background: rgba(255,255,255,0.05);
  border-color: var(--border-strong);
  transform: translateY(-2px);
  box-shadow: 0 14px 30px -14px rgba(34,211,238,0.35);
}
.rail-cell:hover img {
  opacity: 1;
  filter: brightness(1.15);
}
.rail-cell:hover::after { opacity: 1; }

/* ---------- form ---------- */
.form {
  margin-top: 8px;
}
.form-field {
  display: flex; align-items: center;
  gap: 6px;
  padding: 6px 6px 6px 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border-strong);
  border-radius: 14px;
  transition: all .25s ease;
  position: relative;
}
.form-field:focus-within {
  border-color: rgba(34,211,238,0.55);
  box-shadow: 0 0 0 4px rgba(34,211,238,0.12), 0 10px 40px -10px rgba(34,211,238,0.35);
  background: rgba(255,255,255,0.06);
}
.form-icon {
  display: inline-flex;
  color: var(--text-2);
}
.form-field:focus-within .form-icon { color: var(--accent); }
.form-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-1);
  font-size: 15px;
  font-weight: 400;
  padding: 12px 8px;
  letter-spacing: -0.005em;
}
.form-input::placeholder { color: var(--text-3); }
.form-input:disabled { opacity: 0.6; }
.form-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 20px;
  min-width: 168px;
  height: 46px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.005em;
  color: #061018;
  background: linear-gradient(180deg, #5BE5F5 0%, #22D3EE 50%, #3B82F6 100%);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all .2s ease;
  box-shadow:
    0 1px 0 rgba(255,255,255,0.4) inset,
    0 -1px 0 rgba(0,0,0,0.2) inset,
    0 8px 22px -6px rgba(34,211,238,0.55);
}
.form-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.05);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.45) inset,
    0 -1px 0 rgba(0,0,0,0.2) inset,
    0 14px 30px -8px rgba(34,211,238,0.7);
}
.form-btn:disabled { cursor: progress; opacity: 0.85; }

.spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(6,16,24,0.3);
  border-top-color: #061018;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}

.form-meta {
  display: flex; align-items: center; gap: 14px;
  flex-wrap: wrap;
  margin-top: 14px;
  font-size: 13px;
  color: var(--text-2);
}
.coupon {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 5px 10px 5px 5px;
  background: rgba(34,211,238,0.06);
  border: 1px solid rgba(34,211,238,0.22);
  border-radius: 999px;
}
.coupon-tag {
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 3px 8px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(34,211,238,0.25), rgba(59,130,246,0.25));
  color: #BAF6FE;
  border: 1px solid rgba(34,211,238,0.35);
}
.coupon-text { color: var(--text-1); }
.coupon-text b { color: var(--text-1); font-weight: 600; }
.coupon-dim { color: var(--text-2); }
.form-hint { color: var(--text-3); font-size: 12.5px; }
.form-error {
  display: inline-flex; align-items: center; gap: 6px;
  color: var(--err);
  font-size: 13px;
  font-weight: 500;
}
.form-error svg { flex-shrink: 0; }

/* ============================================================== */
/*  Scene                                                          */
/* ============================================================== */

.scene {
  position: relative;
  width: 100%;
  min-height: 460px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 18px;
  padding: 24px 0 32px;
}
.scene-glow {
  position: absolute; inset: -10% -10% 0 -10%;
  background:
    radial-gradient(ellipse 60% 50% at 50% 50%, rgba(34,211,238,0.18), transparent 70%),
    radial-gradient(ellipse 70% 50% at 80% 70%, rgba(59,130,246,0.15), transparent 70%);
  filter: blur(20px);
  z-index: 0;
  pointer-events: none;
}

/* ---------- floating cards ---------- */
.float {
  position: absolute;
  z-index: 6;
  border-radius: 14px;
  border: 1px solid var(--border-strong);
  background: linear-gradient(180deg, rgba(20,28,46,0.85), rgba(12,18,32,0.85));
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.08) inset,
    0 30px 60px -20px rgba(0,0,0,0.6),
    0 0 0 1px rgba(255,255,255,0.02);
}
.float-coupon {
  top: 14px; left: 0;
  padding: 10px 14px;
  display: flex; flex-direction: column; gap: 6px;
  min-width: 168px;
  animation: floatY 5s ease-in-out infinite;
}
.float-coupon-row {
  display: flex; align-items: center; gap: 8px;
  justify-content: space-between;
}
.float-coupon-tag {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 3px 7px;
  border-radius: 6px;
  background: linear-gradient(180deg, rgba(34,211,238,0.22), rgba(59,130,246,0.22));
  border: 1px solid rgba(34,211,238,0.3);
  color: #BAF6FE;
}
.float-coupon-meta {
  font-size: 10.5px;
  font-weight: 500;
  color: var(--text-2);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.float-coupon-price {
  display: flex; align-items: baseline; gap: 8px;
  font-weight: 600;
  font-size: 22px;
  letter-spacing: -0.02em;
  color: var(--text-1);
}
.float-coupon-sub {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text-2);
  text-transform: lowercase;
}

.float-gorki {
  bottom: 30px; left: -8px;
  padding: 10px 14px 10px 10px;
  display: flex; align-items: center; gap: 10px;
  max-width: 220px;
  animation: floatY 5s ease-in-out infinite reverse .8s;
}
.gorki-orb-sm {
  width: 30px; height: 30px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 13px;
  color: #061018;
  background: conic-gradient(from 200deg, #5BE5F5, #3B82F6, #818CF8, #5BE5F5);
  box-shadow: 0 0 0 1px rgba(255,255,255,0.15) inset, 0 0 16px rgba(34,211,238,0.5);
  flex-shrink: 0;
}
.float-gorki-text {
  display: flex; flex-direction: column;
  font-size: 12.5px;
  line-height: 1.35;
}
.float-gorki-text strong {
  font-weight: 600;
  color: var(--text-1);
  font-size: 12.5px;
}
.float-gorki-text span {
  color: var(--text-2);
  font-size: 12px;
}

/* ============================================================== */
/*  Laptop                                                         */
/* ============================================================== */

.laptop {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 540px;
  margin-left: -12px;
}
.laptop-lid {
  position: relative;
  background: linear-gradient(180deg, #2A3145 0%, #161B2C 100%);
  border-radius: 14px 14px 4px 4px;
  padding: 12px 12px 14px;
  box-shadow:
    0 1px 0 rgba(255,255,255,0.08) inset,
    0 0 0 1px rgba(0,0,0,0.6),
    0 50px 80px -30px rgba(0,0,0,0.7);
}
.laptop-cam {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #050913;
  margin: 0 auto 6px;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05);
}
.laptop-screen {
  position: relative;
  background: #0A1124;
  border-radius: 6px;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.04) inset,
    0 0 80px rgba(34,211,238,0.05) inset;
}
.laptop-base {
  position: relative;
  height: 12px;
  margin: 0 -16px;
  background:
    linear-gradient(180deg, #2A3145 0%, #1A1F2E 60%, #0E1220 100%);
  border-radius: 0 0 14px 14px;
  box-shadow:
    0 14px 30px -10px rgba(0,0,0,0.6);
}
.laptop-base-notch {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 90px; height: 5px;
  background: #050913;
  border-radius: 0 0 8px 8px;
}

/* ---------- topbar ---------- */
.topbar {
  display: flex; align-items: center;
  padding: 8px 12px;
  background: rgba(255,255,255,0.025);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  gap: 12px;
}
.dots { display: flex; gap: 5px; }
.dots span {
  width: 9px; height: 9px;
  border-radius: 50%;
  background: rgba(255,255,255,0.18);
}
.dots span:nth-child(1) { background: #FF6058; }
.dots span:nth-child(2) { background: #FFBD2E; }
.dots span:nth-child(3) { background: #29C940; }
.urlbar {
  flex: 1;
  max-width: 280px;
  margin: 0 auto;
  display: flex; align-items: center; gap: 6px;
  padding: 4px 10px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 6px;
  font-size: 10.5px;
  color: var(--text-2);
}
.urlbar svg { color: var(--text-2); }
.topbar-spacer { width: 50px; }

/* ---------- OS body ---------- */
.osBody {
  display: grid;
  grid-template-columns: 138px 1fr;
  height: calc(100% - 31px);
}
.sidebar {
  display: flex; flex-direction: column;
  background: rgba(255,255,255,0.02);
  border-right: 1px solid rgba(255,255,255,0.05);
  padding: 12px 8px;
  gap: 14px;
}
.sidebar-brand {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 8px;
  font-size: 12px; font-weight: 600;
  letter-spacing: -0.005em;
}
.sidebar-brand img { width: 18px; height: 18px; border-radius: 5px; }
.sidebar-nav {
  display: flex; flex-direction: column; gap: 2px;
  flex: 1;
}
.side-item {
  position: relative;
  display: flex; align-items: center; gap: 8px;
  padding: 7px 9px;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 7px;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text-2);
  text-align: left;
  transition: all .15s ease;
}
.side-item:hover {
  background: rgba(255,255,255,0.04);
  color: var(--text-1);
}
.side-item.is-active {
  background: rgba(34,211,238,0.08);
  color: var(--text-1);
}
.side-bullet {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: rgba(255,255,255,0.18);
  flex-shrink: 0;
}
.side-item.is-active .side-bullet {
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent);
}
.side-active {
  position: absolute;
  left: 0; top: 7px; bottom: 7px;
  width: 2px;
  background: linear-gradient(180deg, var(--accent), var(--accent-2));
  border-radius: 0 2px 2px 0;
}
.sidebar-foot {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.user-chip {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 6px;
  border-radius: 8px;
}
.user-avatar {
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: linear-gradient(180deg, var(--accent), var(--accent-2));
  color: #061018;
  font-size: 10.5px; font-weight: 700;
}
.user-meta { display: flex; flex-direction: column; line-height: 1.15; }
.user-meta b { font-size: 11px; font-weight: 600; color: var(--text-1); }
.user-meta em { font-size: 10px; color: var(--text-3); font-style: normal; }

.osMain {
  padding: 14px 16px;
  overflow: hidden;
  position: relative;
}

/* ---------- view ---------- */
.view {
  display: flex; flex-direction: column;
  gap: 12px;
  height: 100%;
  animation: viewIn .35s cubic-bezier(.22,1,.36,1);
}
.view-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 12px;
}
.view-title {
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: -0.015em;
  color: var(--text-1);
}
.view-sub {
  font-size: 11px;
  color: var(--text-2);
  margin-top: 1px;
}
.view-pill {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 10.5px;
  font-weight: 600;
  padding: 4px 9px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.03);
  color: var(--text-1);
  letter-spacing: 0.01em;
}
.live-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--ok);
  box-shadow: 0 0 8px var(--ok);
  animation: pulse 2s ease-in-out infinite;
}
.ai-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent);
  animation: pulse 2s ease-in-out infinite;
}

/* ---------- stat grid ---------- */
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.stat {
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: rgba(255,255,255,0.02);
  display: flex; flex-direction: column;
  gap: 3px;
  animation: rowIn .4s cubic-bezier(.22,1,.36,1) both;
}
.stat-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.stat-value {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text-1);
  font-variant-numeric: tabular-nums;
}
.stat-trend {
  font-size: 10.5px;
  font-weight: 500;
  color: var(--ok);
}
.stat-trend.is-muted { color: var(--text-2); }

/* ---------- chart ---------- */
.chart {
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: rgba(255,255,255,0.02);
  flex: 1;
  display: flex; flex-direction: column;
  min-height: 0;
}
.chart-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
}
.chart-title {
  font-size: 11.5px; font-weight: 600;
  color: var(--text-1);
}
.chart-meta {
  font-size: 10px;
  color: var(--text-2);
  margin-top: 1px;
}
.chart-legend {
  display: flex; gap: 10px;
  font-size: 10px;
  color: var(--text-2);
}
.legend {
  display: inline-flex; align-items: center; gap: 5px;
}
.legend::before {
  content: '';
  width: 8px; height: 2px;
  border-radius: 2px;
  background: currentColor;
}
.legend.cyan { color: var(--accent); }
.legend.dim { color: var(--text-3); }
.spark {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 70px;
}
.spk-line {
  stroke-dasharray: 1200;
  stroke-dashoffset: 1200;
  animation: drawLine 1.6s cubic-bezier(.22,1,.36,1) forwards;
}
.spk-area { opacity: 0; animation: fadeArea .9s ease forwards .5s; }

/* ---------- activity ---------- */
.activity {
  display: flex; flex-direction: column; gap: 4px;
}
.act-row {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 8px;
  font-size: 11px;
  color: var(--text-1);
  border-radius: 6px;
  transition: background .15s ease;
}
.act-row:hover { background: rgba(255,255,255,0.03); }
.act-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-cyan { background: var(--accent); box-shadow: 0 0 6px var(--accent); }
.dot-green { background: var(--ok); box-shadow: 0 0 6px var(--ok); }
.dot-amber { background: var(--warn); box-shadow: 0 0 6px var(--warn); }
.act-text { flex: 1; }
.act-time { color: var(--text-3); font-size: 10.5px; font-variant-numeric: tabular-nums; }

/* ---------- table ---------- */
.table {
  display: flex; flex-direction: column;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  background: rgba(255,255,255,0.015);
  flex: 1;
  min-height: 0;
}
.thead, .trow {
  display: grid;
  grid-template-columns: 60px 1fr 84px 90px 72px;
  gap: 8px;
  padding: 8px 12px;
  font-size: 11px;
  align-items: center;
}
.thead {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-2);
  background: rgba(255,255,255,0.02);
  border-bottom: 1px solid var(--border);
  font-weight: 600;
}
.trow {
  border-bottom: 1px solid rgba(255,255,255,0.04);
  animation: rowIn .4s cubic-bezier(.22,1,.36,1) both;
}
.trow:last-child { border-bottom: none; }
.trow:hover { background: rgba(255,255,255,0.025); }
.mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 10.5px; color: var(--text-1); font-variant-numeric: tabular-nums; }
.dim { color: var(--text-2); }
.ta-r { text-align: right; }

.badge {
  display: inline-flex; align-items: center;
  padding: 2px 7px;
  font-size: 10px;
  font-weight: 600;
  border-radius: 999px;
  white-space: nowrap;
  letter-spacing: 0.005em;
}
.badge-ok { background: rgba(52,211,153,0.12); color: #6EE7B7; border: 1px solid rgba(52,211,153,0.25); }
.badge-warn { background: rgba(245,181,71,0.12); color: #FBC97D; border: 1px solid rgba(245,181,71,0.28); }
.badge-info { background: rgba(96,165,250,0.13); color: #93C5FD; border: 1px solid rgba(96,165,250,0.28); }
.badge-err { background: rgba(248,113,113,0.13); color: #FCA5A5; border: 1px solid rgba(248,113,113,0.28); }
.badge-muted { background: rgba(255,255,255,0.05); color: var(--text-2); border: 1px solid var(--border); }

/* ---------- customers ---------- */
.customers {
  display: flex; flex-direction: column;
  gap: 4px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
  mask-image: linear-gradient(180deg, #000 85%, transparent 100%);
}
.cust-row {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 10px;
  border-radius: 8px;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--border);
  animation: rowIn .4s cubic-bezier(.22,1,.36,1) both;
  transition: all .15s ease;
}
.cust-row:hover {
  background: rgba(255,255,255,0.04);
  border-color: var(--border-strong);
}
.cust-avatar {
  width: 24px; height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  display: flex; align-items: center; justify-content: center;
  font-size: 9.5px;
  font-weight: 700;
  color: #061018;
  flex-shrink: 0;
}
.cust-info { flex: 1; min-width: 0; }
.cust-name {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-1);
  letter-spacing: -0.005em;
}
.cust-meta {
  font-size: 10.5px;
  color: var(--text-2);
  margin-top: 1px;
}

/* ---------- markets ---------- */
.markets {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  flex: 1;
  min-height: 0;
}
.market-card {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: rgba(255,255,255,0.02);
  animation: rowIn .4s cubic-bezier(.22,1,.36,1) both;
  transition: all .2s ease;
}
.market-card:hover {
  border-color: var(--border-strong);
  background: rgba(255,255,255,0.04);
  transform: translateY(-1px);
}
.market-logo {
  width: 30px; height: 30px;
  border-radius: 7px;
  background: rgba(255,255,255,0.06);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  padding: 4px;
}
.market-logo img {
  max-width: 100%; max-height: 100%;
  object-fit: contain;
}
.market-info { flex: 1; min-width: 0; }
.market-name {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-1);
  margin-bottom: 4px;
}
.market-arrow {
  color: var(--text-3);
  display: flex;
  transition: transform .2s ease;
}
.market-card:hover .market-arrow {
  color: var(--accent);
  transform: translateX(2px);
}

/* ---------- gorki ---------- */
.gorki-card {
  flex: 1;
  display: flex; flex-direction: column;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background:
    radial-gradient(circle at 0% 0%, rgba(34,211,238,0.08), transparent 60%),
    rgba(255,255,255,0.02);
}
.gorki-head {
  display: flex; align-items: center; gap: 10px;
}
.gorki-orb {
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 13px;
  color: #061018;
  background: conic-gradient(from 200deg, #5BE5F5, #3B82F6, #818CF8, #5BE5F5);
  box-shadow: 0 0 0 1px rgba(255,255,255,0.15) inset, 0 0 16px rgba(34,211,238,0.45);
  animation: orbSpin 12s linear infinite;
}
.gorki-title { font-size: 12px; font-weight: 600; color: var(--text-1); }
.gorki-meta { font-size: 10.5px; color: var(--text-2); margin-top: 1px; }
.gorki-list { display: flex; flex-direction: column; gap: 6px; }
.gi-row {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 9px;
  border-radius: 8px;
  background: rgba(255,255,255,0.025);
  border: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-1);
  animation: rowIn .4s cubic-bezier(.22,1,.36,1) both;
}
.gi-icon {
  width: 22px; height: 22px;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.gi-up { background: rgba(52,211,153,0.15); color: #6EE7B7; }
.gi-warn { background: rgba(245,181,71,0.15); color: #FBC97D; }
.gi-info { background: rgba(96,165,250,0.15); color: #93C5FD; }
.gi-text { line-height: 1.45; }
.gorki-foot {
  display: flex; gap: 8px;
  margin-top: auto;
}
.ghost-btn, .primary-btn {
  font-size: 11px;
  font-weight: 600;
  padding: 7px 12px;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex; align-items: center; gap: 6px;
  border: 1px solid var(--border-strong);
}
.ghost-btn {
  color: var(--text-1);
  background: rgba(255,255,255,0.04);
}
.primary-btn {
  color: #061018;
  background: linear-gradient(180deg, #5BE5F5, #22D3EE 50%, #3B82F6);
  border-color: rgba(34,211,238,0.4);
  box-shadow: 0 4px 14px -4px rgba(34,211,238,0.55);
}

/* ============================================================== */
/*  Phone                                                          */
/* ============================================================== */

.phone {
  position: relative;
  z-index: 3;
  width: 168px;
  flex-shrink: 0;
  margin-bottom: 32px;
  filter: drop-shadow(0 30px 60px rgba(0,0,0,0.55));
}
.phone-frame {
  position: relative;
  aspect-ratio: 9 / 19;
  background: linear-gradient(160deg, #2A3145 0%, #161B2C 100%);
  border-radius: 30px;
  padding: 5px;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.08) inset,
    0 0 0 1px rgba(0,0,0,0.6);
}
.phone-island {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 56px;
  height: 14px;
  background: #050913;
  border-radius: 8px;
  z-index: 5;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
}
.phone-screen {
  width: 100%; height: 100%;
  background: #0A1124;
  border-radius: 26px;
  overflow: hidden;
  padding: 24px 10px 10px;
  display: flex; flex-direction: column;
  gap: 10px;
}
.phone-status {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 4px;
  font-size: 9px;
  font-weight: 600;
  color: var(--text-1);
  margin-top: -2px;
}
.phone-bars { display: inline-flex; gap: 1.5px; align-items: flex-end; }
.phone-bars span {
  width: 2px; height: 5px;
  background: var(--text-1);
  border-radius: 1px;
}
.phone-bars span:nth-child(2) { height: 6px; }
.phone-bars span:nth-child(3) { height: 7px; }
.phone-bars span:nth-child(4) { height: 8px; }

.phone-greet {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px;
  padding: 0 4px;
}
.phone-hi {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-1);
}
.phone-day {
  font-size: 9.5px;
  color: var(--text-2);
  margin-top: 1px;
}
.phone-avatar {
  width: 22px; height: 22px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #061018;
  font-size: 9.5px;
  font-weight: 700;
}

.phone-tabs {
  display: flex; gap: 4px;
  padding: 3px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  border-radius: 8px;
}
.phone-tab {
  flex: 1;
  text-align: center;
  font-size: 9px;
  font-weight: 600;
  padding: 4px 0;
  border-radius: 5px;
  color: var(--text-2);
  transition: all .15s ease;
}
.phone-tab.is-active {
  background: linear-gradient(180deg, rgba(34,211,238,0.18), rgba(34,211,238,0.06));
  color: var(--text-1);
  box-shadow: 0 0 0 1px rgba(34,211,238,0.3) inset;
}

.phone-content {
  display: flex; flex-direction: column; gap: 8px;
  flex: 1;
  min-height: 0;
  animation: viewIn .35s cubic-bezier(.22,1,.36,1);
}
.phone-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.pm {
  padding: 8px;
  background: rgba(255,255,255,0.025);
  border: 1px solid var(--border);
  border-radius: 8px;
}
.pm-label {
  font-size: 8.5px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-2);
  font-weight: 500;
}
.pm-value {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 2px 0 1px;
  font-variant-numeric: tabular-nums;
}
.pm-trend {
  font-size: 9px;
  font-weight: 600;
  color: var(--ok);
}
.pm-trend.muted { color: var(--text-2); }

.phone-list {
  flex: 1;
  min-height: 0;
  padding: 8px;
  background: rgba(255,255,255,0.025);
  border: 1px solid var(--border);
  border-radius: 8px;
  display: flex; flex-direction: column;
  gap: 4px;
}
.phone-list-head {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 9.5px;
  font-weight: 600;
  color: var(--text-1);
  margin-bottom: 2px;
}
.phone-list-meta { color: var(--accent); font-weight: 500; }
.phone-row {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 2px;
  font-size: 10px;
  color: var(--text-1);
}
.phone-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}
.phone-row-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.phone-row-time { color: var(--text-3); font-size: 9px; font-variant-numeric: tabular-nums; }

.phone-gorki {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 8px;
  background:
    radial-gradient(circle at 0 0, rgba(34,211,238,0.16), transparent 60%),
    rgba(255,255,255,0.025);
  border: 1px solid rgba(34,211,238,0.2);
  border-radius: 8px;
}
.pg-orb {
  width: 22px; height: 22px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 10px;
  color: #061018;
  background: conic-gradient(from 200deg, #5BE5F5, #3B82F6, #818CF8, #5BE5F5);
  flex-shrink: 0;
  animation: orbSpin 12s linear infinite;
}
.pg-title { font-size: 9.5px; font-weight: 600; color: var(--text-1); }
.pg-text { font-size: 9.5px; color: var(--text-2); margin-top: 1px; line-height: 1.35; }

/* ============================================================== */
/*  Modal                                                          */
/* ============================================================== */

.modal-overlay {
  position: fixed; inset: 0;
  z-index: 100;
  background: rgba(4,7,16,0.65);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  animation: overlayIn .25s ease;
}
.modal {
  position: relative;
  width: 100%;
  max-width: 440px;
  padding: 36px 28px 28px;
  background:
    radial-gradient(circle at 50% 0%, rgba(34,211,238,0.18), transparent 60%),
    linear-gradient(180deg, rgba(20,28,46,0.95), rgba(12,18,32,0.95));
  border: 1px solid var(--border-strong);
  border-radius: 22px;
  box-shadow:
    0 1px 0 rgba(255,255,255,0.08) inset,
    0 60px 100px -20px rgba(0,0,0,0.7),
    0 0 0 1px rgba(255,255,255,0.02);
  animation: modalIn .35s cubic-bezier(.22,1,.36,1);
  text-align: center;
}
.modal-close {
  position: absolute;
  top: 14px; right: 14px;
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-2);
  transition: all .15s ease;
}
.modal-close:hover {
  background: rgba(255,255,255,0.1);
  color: var(--text-1);
}
.modal-orb-wrap {
  position: relative;
  width: 56px; height: 56px;
  margin: 0 auto 18px;
}
.modal-orb-glow {
  position: absolute; inset: -16px;
  background: radial-gradient(circle, rgba(34,211,238,0.5), transparent 65%);
  filter: blur(8px);
  animation: pulse 2.5s ease-in-out infinite;
}
.modal-orb {
  position: relative;
  width: 56px; height: 56px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  font-weight: 700;
  color: #061018;
  background: conic-gradient(from 200deg, #5BE5F5, #3B82F6, #818CF8, #5BE5F5);
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.18) inset,
    0 0 30px rgba(34,211,238,0.5);
  animation: orbSpin 12s linear infinite;
}
.modal-eyebrow {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--accent);
  padding: 5px 12px;
  border: 1px solid rgba(34,211,238,0.3);
  background: rgba(34,211,238,0.08);
  border-radius: 999px;
  margin-bottom: 14px;
}
.modal-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent);
}
.modal-title {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.025em;
  margin: 0 0 8px;
  color: var(--text-1);
}
.modal-sub {
  font-size: 14.5px;
  color: var(--text-2);
  line-height: 1.55;
  margin: 0 0 20px;
  max-width: 340px;
  margin-left: auto;
  margin-right: auto;
}
.modal-list {
  list-style: none;
  margin: 0 0 22px;
  padding: 0;
  display: flex; flex-direction: column;
  gap: 8px;
  text-align: left;
}
.modal-list li {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 13.5px;
  color: var(--text-1);
  line-height: 1.4;
  animation: rowIn .45s cubic-bezier(.22,1,.36,1) both;
}
.modal-list li:nth-child(1) { animation-delay: .1s; }
.modal-list li:nth-child(2) { animation-delay: .18s; }
.modal-list li:nth-child(3) { animation-delay: .26s; }
.modal-list b { font-weight: 600; color: var(--text-1); }
.check-badge {
  width: 22px; height: 22px;
  border-radius: 50%;
  background: linear-gradient(180deg, var(--ok), #10B981);
  color: #052B1B;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 0 4px rgba(52,211,153,0.12);
}
.modal-cta {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%;
  padding: 14px 18px;
  font-size: 14.5px;
  font-weight: 600;
  color: #061018;
  background: linear-gradient(180deg, #5BE5F5, #22D3EE 50%, #3B82F6);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all .2s ease;
  box-shadow:
    0 1px 0 rgba(255,255,255,0.4) inset,
    0 8px 22px -6px rgba(34,211,238,0.55);
}
.modal-cta:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

/* ============================================================== */
/*  Animations                                                     */
/* ============================================================== */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes viewIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes rowIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes drawLine {
  to { stroke-dashoffset: 0; }
}
@keyframes fadeArea {
  to { opacity: 1; }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes orbSpin {
  to { transform: rotate(360deg); }
}
@keyframes floatY {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes overlayIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes modalIn {
  from { opacity: 0; transform: translateY(14px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ============================================================== */
/*  Responsive                                                     */
/* ============================================================== */
@media (max-width: 1100px) {
  .hero-grid { gap: 36px; }
  .laptop { max-width: 480px; margin-left: 0; }
  .phone { width: 150px; }
  .float-coupon, .float-gorki { display: none; }
}

@media (max-width: 880px) {
  .nav { padding: 16px 16px 0; }
  .hero { padding: 36px 16px 64px; }
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 50px;
  }
  .hero-right { order: 2; }
  .hero-left { order: 1; }
  .title { margin: 18px 0 14px; }
  .scene { min-height: 420px; padding: 0; }
  .laptop { max-width: 460px; margin: 0 auto; margin-left: -20px; }
  .phone { width: 140px; margin-bottom: 22px; }
  .rail-track { grid-template-columns: 1fr 1fr; }
  .rail-cell { height: 60px; }
  .form-field { flex-direction: column; align-items: stretch; padding: 10px; gap: 8px; }
  .form-icon { display: none; }
  .form-input { padding: 10px 12px; }
  .form-btn { width: 100%; min-width: 0; height: 50px; border-radius: 10px; }
  .form-meta { flex-direction: column; align-items: flex-start; gap: 10px; }
  .modal { padding: 30px 22px 22px; }
  .modal-title { font-size: 24px; }
}

@media (max-width: 540px) {
  .nav-cta {
    padding: 7px 12px;
    font-size: 12.5px;
  }
  .scene { gap: 8px; min-height: 380px; }
  .laptop { max-width: 320px; margin-left: -10px; }
  .phone { width: 110px; margin-bottom: 14px; }
  .osBody { grid-template-columns: 90px 1fr; }
  .sidebar { padding: 8px 6px; gap: 10px; }
  .sidebar-foot { display: none; }
  .side-item { font-size: 10px; padding: 6px 7px; }
  .stats { grid-template-columns: 1fr 1fr; }
  .thead, .trow { grid-template-columns: 50px 1fr 70px 60px; gap: 4px; padding: 6px 8px; font-size: 10px; }
  .thead span:nth-child(3), .trow span:nth-child(3) { display: none; }
  .markets { grid-template-columns: 1fr; }
}
`;
