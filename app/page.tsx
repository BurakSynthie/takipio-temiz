"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type DemoTab = "genel" | "siparisler" | "stok" | "entegrasyonlar";

const marketplaces = [
  {
    name: "Trendyol",
    accent: "#f27a1a",
    short: "TY",
    desc: "Sipariş ve ürün akışı",
  },
  {
    name: "Amazon",
    accent: "#ffb400",
    short: "AZ",
    desc: "Çok kanallı satış takibi",
  },
  {
    name: "Hepsiburada",
    accent: "#ff6a00",
    short: "HB",
    desc: "Stok ve sipariş yönetimi",
  },
  {
    name: "Çiçeksepeti",
    accent: "#4cc96b",
    short: "ÇS",
    desc: "Mağaza hareketlerini takip et",
  },
];

const featureCards = [
  {
    title: "Sipariş takibi",
    text: "Tüm satış kanallarındaki siparişleri tek panelde topla.",
    icon: "box",
  },
  {
    title: "Müşteri yönetimi",
    text: "Aktif müşteri, tekrar sipariş ve durum özetlerini görüntüle.",
    icon: "users",
  },
  {
    title: "Stok & ödeme kontrolü",
    text: "Kritik stokları ve bekleyen ödemeleri tek ekranda gör.",
    icon: "cube",
  },
  {
    title: "Pazaryeri entegrasyonları",
    text: "Trendyol, Amazon, Hepsiburada ve Çiçeksepeti için güçlü altyapı.",
    icon: "spark",
  },
  {
    title: "Gorki AI desteği",
    text: "Günlük işlerini özetleyen akıllı yardımcı hep yanında.",
    icon: "robot",
  },
  {
    title: "Hızlı kurulum",
    text: "Dakikalar içinde kullanıma hazır modern bir SaaS deneyimi.",
    icon: "bolt",
  },
];

const statCards = [
  {
    label: "Bugünkü Sipariş",
    value: "1.248",
    delta: "+24%",
    icon: "cart",
  },
  {
    label: "Toplam Stok",
    value: "8.325",
    delta: "+18%",
    icon: "cube",
  },
  {
    label: "Aktif Müşteri",
    value: "23.540",
    delta: "+31%",
    icon: "users",
  },
];

const orderRows = [
  {
    source: "Trendyol",
    code: "#105724",
    price: "₺1.249,90",
    status: "Tamamlandı",
  },
  {
    source: "Amazon",
    code: "#405189",
    price: "₺2.199,00",
    status: "Kargoda",
  },
  {
    source: "Hepsiburada",
    code: "#729381",
    price: "₺599,90",
    status: "Hazırlanıyor",
  },
  {
    source: "Çiçeksepeti",
    code: "#809201",
    price: "₺349,90",
    status: "Onaylandı",
  },
];

function TakipioLogoMark() {
  return (
    <svg
      viewBox="0 0 220 170"
      aria-hidden="true"
      className="tk-logo-mark"
      fill="none"
    >
      <path
        d="M36 28H186C197.046 28 206 36.9543 206 48V48C206 59.0457 197.046 68 186 68H114C105.163 68 98 75.1634 98 84V84C98 92.8366 105.163 100 114 100H125.5C136.546 100 145.5 108.954 145.5 120V120C145.5 131.046 136.546 140 125.5 140H77C65.9543 140 57 131.046 57 120V85.5C57 76.6634 49.8366 69.5 41 69.5V69.5C29.9543 69.5 21 60.5457 21 49.5V43C21 34.7157 27.7157 28 36 28Z"
        stroke="currentColor"
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M104 47H140C151.046 47 160 55.9543 160 67V67"
        stroke="currentColor"
        strokeWidth="18"
        strokeLinecap="round"
      />
      <path
        d="M96 86V121C96 132.046 104.954 141 116 141H165"
        stroke="currentColor"
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Icon({
  type,
  className = "",
}: {
  type: string;
  className?: string;
}) {
  if (type === "bolt") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <path
          d="M13 2L5 13H11L9.8 22L19 10.8H13.5L13 2Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "users") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <path
          d="M9 11C10.933 11 12.5 9.433 12.5 7.5C12.5 5.567 10.933 4 9 4C7.067 4 5.5 5.567 5.5 7.5C5.5 9.433 7.067 11 9 11Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M3.8 18.8C4.4 16.3 6.5 14.8 9 14.8C11.5 14.8 13.6 16.3 14.2 18.8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M16.5 10.5C17.8807 10.5 19 9.38071 19 8C19 6.61929 17.8807 5.5 16.5 5.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M16 14.8C17.9 14.8 19.5 15.8 20.2 17.6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "cube" || type === "box") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <path
          d="M12 3L19 7V17L12 21L5 17V7L12 3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M5 7L12 11L19 7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M12 11V21"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "spark") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <path
          d="M12 3L13.7 8.3L19 10L13.7 11.7L12 17L10.3 11.7L5 10L10.3 8.3L12 3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "robot") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <rect
          x="5"
          y="8"
          width="14"
          height="10"
          rx="4"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M12 3V8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="9.2" cy="12.2" r="1" fill="currentColor" />
        <circle cx="14.8" cy="12.2" r="1" fill="currentColor" />
        <path
          d="M10 15C10.6 15.5 11.2 15.8 12 15.8C12.8 15.8 13.4 15.5 14 15"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "cart") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <path
          d="M4 5H6L8.1 14.2H17.6L20 8H7.2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="18.2" r="1.4" fill="currentColor" />
        <circle cx="17" cy="18.2" r="1.4" fill="currentColor" />
      </svg>
    );
  }

  if (type === "shield") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <path
          d="M12 3L19 6V11.5C19 16 16.3 19.5 12 21C7.7 19.5 5 16 5 11.5V6L12 3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "cloud") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <path
          d="M8 18H17.2C19.3 18 21 16.3 21 14.2C21 12.2 19.4 10.5 17.4 10.4C16.8 7.9 14.6 6 12 6C9.1 6 6.7 8.1 6.2 10.9C4.4 11.2 3 12.8 3 14.8C3 16.6 4.4 18 6.2 18H8Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "chart") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <path
          d="M5 19V12"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M12 19V9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M19 19V5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M4 19H20"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "headset") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <path
          d="M5 13V12C5 8.134 8.134 5 12 5C15.866 5 19 8.134 19 12V13"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <rect
          x="4"
          y="12"
          width="4"
          height="6"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <rect
          x="16"
          y="12"
          width="4"
          height="6"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M16 18C16 19.6569 14.6569 21 13 21H11"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function GorkiBot() {
  return (
    <div className="gorki-bot">
      <div className="gorki-antenna" />
      <div className="gorki-head">
        <div className="gorki-face">
          <span className="gorki-eye" />
          <span className="gorki-eye" />
        </div>
      </div>
      <div className="gorki-body">
        <div className="gorki-chest">t</div>
      </div>
      <div className="gorki-arm left" />
      <div className="gorki-arm right" />
      <div className="gorki-leg left" />
      <div className="gorki-leg right" />
    </div>
  );
}

export default function Page() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [activeTab, setActiveTab] = useState<DemoTab>("genel");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setPageReady(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const tabs: DemoTab[] = ["genel", "siparisler", "stok", "entegrasyonlar"];
    const interval = window.setInterval(() => {
      setActiveTab((prev) => {
        const currentIndex = tabs.indexOf(prev);
        const nextIndex = (currentIndex + 1) % tabs.length;
        return tabs[nextIndex];
      });
    }, 3200);

    return () => window.clearInterval(interval);
  }, []);

  const gorkiText = useMemo(() => {
    if (activeTab === "genel") {
      return "Bugün satışların canlı görünüyor. 3 pazaryerinde hareket artmış.";
    }
    if (activeTab === "siparisler") {
      return "Bekleyen siparişleri toparladım. Kargoya hazır olanları öne çıkardım.";
    }
    if (activeTab === "stok") {
      return "2 ürün kritik stok seviyesine yaklaşıyor. Tedarik planı yapalım.";
    }
    return "Trendyol, Amazon, Hepsiburada ve Çiçeksepeti bağlantıları için alan hazır.";
  }, [activeTab]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorText("Lütfen geçerli bir e-posta adresi gir.");
      return;
    }

    setLoading(true);
    setErrorText("");
    setSaved(false);

    try {
      const { error } = await supabase.from("waitlist").insert([
        {
          email: cleanEmail,
          coupon_code: "TAKIPIO10",
          source: "landing",
        },
      ]);

      if (error) {
        const duplicate =
          error.message?.toLowerCase().includes("duplicate") ||
          error.message?.toLowerCase().includes("unique") ||
          error.code === "23505";

        if (duplicate) {
          setErrorText("Bu e-posta zaten bekleme listesinde kayıtlı.");
        } else {
          setErrorText("Kayıt sırasında bir hata oluştu.");
        }

        setLoading(false);
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
        console.error("Welcome email error:", mailError);
      }

      setSaved(true);
      setEmail("");
      window.setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.error(err);
      setErrorText("Kayıt sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="takipio-page"
      style={{
        opacity: pageReady ? 1 : 0,
        visibility: pageReady ? "visible" : "hidden",
        transition: "opacity 180ms ease",
      }}
    >
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="grid-noise" />

      <header className="site-header">
        <div className="container header-inner">
          <a href="#" className="brand">
            <div className="brand-mark-wrap">
              <TakipioLogoMark />
            </div>
            <span className="brand-text">takipio</span>
          </a>

          <nav className="desktop-nav">
            <a href="#features">Özellikler</a>
            <a href="#integrations">Entegrasyonlar</a>
            <a href="#gorki">Gorki AI</a>
            <a href="#contact">İletişim</a>
          </nav>

          <div className="header-actions">
            <a href="#waitlist" className="mini-cta">
              Erken Erişim
            </a>

            <button
              type="button"
              className="menu-toggle"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Menüyü aç"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-menu">
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>
              Özellikler
            </a>
            <a href="#integrations" onClick={() => setMobileMenuOpen(false)}>
              Entegrasyonlar
            </a>
            <a href="#gorki" onClick={() => setMobileMenuOpen(false)}>
              Gorki AI
            </a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)}>
              İletişim
            </a>
          </div>
        )}
      </header>

      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow-row">
              <span className="eyebrow-pill">
                <Icon type="spark" className="eyebrow-icon" />
                YENİ PAZARYERİ ENTEGRASYONLARI
              </span>
            </div>

            <h1 className="hero-title">
              Takipio ile işini takip et,
              <br />
              <span>kontrolü kaybetme.</span>
            </h1>

            <p className="hero-text">
              Sipariş, müşteri, stok ve ödeme akışını tek panelde toplayan yeni
              nesil işletme asistanı hazırlanıyor. Şimdi ise
              <strong> pazaryeri entegrasyonları</strong> ile daha da güçlü:
              Trendyol, Amazon, Hepsiburada ve Çiçeksepeti odağımızda.
            </p>

            <div className="hero-marketplaces">
              {marketplaces.map((item) => (
                <div
                  key={item.name}
                  className="hero-market-chip"
                  style={
                    {
                      "--chip-accent": item.accent,
                    } as React.CSSProperties
                  }
                >
                  <span className="chip-dot" />
                  {item.name}
                </div>
              ))}
            </div>

            <div className="hero-note-card">
              <div className="hero-note-icon">
                <Icon type="spark" className="note-svg" />
              </div>
              <div>
                <strong>Artık pazaryerlerinde de varız.</strong>
                <p>
                  Takipio, çok kanallı satış yapan işletmeler için daha kapsamlı
                  bir yapıya dönüşüyor.
                </p>
              </div>
            </div>

            <div id="waitlist" className="waitlist-card">
              <div className="waitlist-top">
                <div className="waitlist-icon">
                  <Icon type="robot" className="waitlist-svg" />
                </div>
                <div>
                  <h3>Erken erişim listesine katıl</h3>
                  <p>
                    Kayıt olan kullanıcılara açılışta{" "}
                    <strong>TAKIPIO10</strong> indirim kodu gönderilecek.
                  </p>
                </div>
              </div>

              <form className="waitlist-form" onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="E-posta adresiniz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <button type="submit" disabled={loading}>
                  {loading ? "Kaydediliyor..." : "Kayıt Ol"}
                </button>
              </form>

              <div className="form-feedback-wrap">
                {saved && (
                  <div className="success-text">
                    Kaydın alındı. Hoş geldin maili gönderildi.
                  </div>
                )}
                {errorText && <div className="error-text">{errorText}</div>}
              </div>

              <div className="mini-benefits">
                <span>• İlk açılışa özel %10 indirim</span>
                <span>• Gorki AI dahil</span>
                <span>• Pazaryeri altyapısı hazırlanıyor</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="floating-stat-group">
              {statCards.map((item) => (
                <div className="floating-stat-card" key={item.label}>
                  <div className="floating-stat-icon">
                    <Icon type={item.icon} className="floating-stat-svg" />
                  </div>
                  <div className="floating-stat-text">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <em>{item.delta}</em>
                </div>
              ))}
            </div>

            <div className="launch-card">
              <div className="launch-badge">Açılışa Özel</div>
              <div className="launch-small">İLK AY SADECE</div>
              <div className="launch-old">₺99</div>
              <div className="launch-price">₺89</div>
              <p>Sonrasında ₺99 / ay</p>
              <a href="#waitlist">Erken erişime katıl</a>
            </div>

            <div className="device-stage">
              <div className="dashboard-shell">
                <div className="dashboard-topbar">
                  <div className="dash-logo">
                    <div className="dash-logo-mark">
                      <TakipioLogoMark />
                    </div>
                    <span>takipio</span>
                  </div>
                  <div className="dash-tabs">
                    <button
                      className={activeTab === "genel" ? "active" : ""}
                      onClick={() => setActiveTab("genel")}
                    >
                      Genel
                    </button>
                    <button
                      className={activeTab === "siparisler" ? "active" : ""}
                      onClick={() => setActiveTab("siparisler")}
                    >
                      Sipariş
                    </button>
                    <button
                      className={activeTab === "stok" ? "active" : ""}
                      onClick={() => setActiveTab("stok")}
                    >
                      Stok
                    </button>
                    <button
                      className={
                        activeTab === "entegrasyonlar" ? "active" : ""
                      }
                      onClick={() => setActiveTab("entegrasyonlar")}
                    >
                      Entegrasyon
                    </button>
                  </div>
                </div>

                <div className="dashboard-content">
                  <aside className="dashboard-sidebar">
                    <a className="sidebar-item active">Ana Sayfa</a>
                    <a className="sidebar-item">Siparişler</a>
                    <a className="sidebar-item">Ürünler</a>
                    <a className="sidebar-item">Stok</a>
                    <a className="sidebar-item">Müşteriler</a>
                    <a className="sidebar-item">Raporlar</a>
                    <a className="sidebar-item highlight">Entegrasyonlar</a>
                    <a className="sidebar-item">Ayarlar</a>

                    <div className="sidebar-gorki">
                      <div className="sidebar-gorki-avatar">
                        <span />
                      </div>
                      <div>
                        <strong>Gorki AI</strong>
                        <p>Günlük işlerini özetler.</p>
                      </div>
                    </div>
                  </aside>

                  <div className="dashboard-main">
                    {activeTab === "genel" && (
                      <div className="dashboard-panel">
                        <div className="panel-stats-row">
                          <div className="panel-stat">
                            <span>Toplam Gelir</span>
                            <strong>₺2.458.760</strong>
                            <em>+%32</em>
                          </div>
                          <div className="panel-stat">
                            <span>Sipariş</span>
                            <strong>1.248</strong>
                            <em>+%24</em>
                          </div>
                          <div className="panel-stat">
                            <span>Müşteri</span>
                            <strong>23.540</strong>
                            <em>+%31</em>
                          </div>
                          <div className="panel-stat">
                            <span>Bekleyen İş</span>
                            <strong>86</strong>
                            <em>+%12</em>
                          </div>
                        </div>

                        <div className="chart-card">
                          <div className="chart-header">
                            <strong>Satış Grafiği</strong>
                            <span>Son 7 gün</span>
                          </div>
                          <div className="chart-area">
                            <div className="chart-line" />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "siparisler" && (
                      <div className="dashboard-panel">
                        <div className="table-card">
                          <div className="table-head">
                            <strong>Son Siparişler</strong>
                            <span>Çok kanallı görünüm</span>
                          </div>

                          <div className="table-body">
                            {orderRows.map((row) => (
                              <div className="order-row" key={row.code}>
                                <div className="order-source">{row.source}</div>
                                <div className="order-code">{row.code}</div>
                                <div className="order-price">{row.price}</div>
                                <div className="order-status">{row.status}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "stok" && (
                      <div className="dashboard-panel">
                        <div className="stock-grid">
                          <div className="stock-card critical">
                            <span>Kritik Stok</span>
                            <strong>2 ürün</strong>
                            <p>Yeniden sipariş planlaması öneriliyor.</p>
                          </div>
                          <div className="stock-card">
                            <span>Toplam Ürün</span>
                            <strong>428</strong>
                            <p>Aktif satışta olan ürünler</p>
                          </div>
                          <div className="stock-card">
                            <span>Stok Güncel</span>
                            <strong>%96</strong>
                            <p>Senkron yapılar sağlam görünüyor.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "entegrasyonlar" && (
                      <div className="dashboard-panel">
                        <div className="integration-preview">
                          {marketplaces.map((item) => (
                            <div className="integration-item" key={item.name}>
                              <div
                                className="integration-item-badge"
                                style={
                                  {
                                    "--badge-accent": item.accent,
                                  } as React.CSSProperties
                                }
                              >
                                {item.short}
                              </div>
                              <div>
                                <strong>{item.name}</strong>
                                <p>{item.desc}</p>
                              </div>
                              <span className="integration-ready">Hazır</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="phone-shell">
                <div className="phone-notch" />
                <div className="phone-screen">
                  <div className="phone-header">
                    <span>takipio</span>
                    <em>Genel Bakış</em>
                  </div>

                  <div className="phone-mini-grid">
                    <div className="phone-mini-card">
                      <small>Toplam Gelir</small>
                      <strong>₺125.250</strong>
                      <span>+%18,6</span>
                    </div>
                    <div className="phone-mini-card">
                      <small>Sipariş</small>
                      <strong>128</strong>
                      <span>+%8,2</span>
                    </div>
                    <div className="phone-mini-card">
                      <small>Müşteri</small>
                      <strong>89</strong>
                      <span>+%5,7</span>
                    </div>
                    <div className="phone-mini-card">
                      <small>Stok</small>
                      <strong>Güncel</strong>
                      <span>Tüm kanallar</span>
                    </div>
                  </div>

                  <div className="phone-bar" />
                  <div className="phone-order-list">
                    <div className="phone-order">
                      <span>#10248</span>
                      <strong>₺1.250</strong>
                    </div>
                    <div className="phone-order">
                      <span>#10247</span>
                      <strong>₺890</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="gorki-card">
                <div className="gorki-card-top">
                  <div className="gorki-card-avatar">
                    <span />
                  </div>
                  <div>
                    <strong>Gorki AI</strong>
                    <p>Akıllı işletme asistanın</p>
                  </div>
                </div>
                <div className="gorki-message">{gorkiText}</div>
              </div>

              <div className="gorki-hero-bot-wrap">
                <GorkiBot />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="integrations" className="integrations-section">
        <div className="container">
          <div className="section-head centered">
            <span className="section-pill">Entegrasyon Odağı</span>
            <h2>Artık pazaryerlerinde de güçlüyüz</h2>
            <p>
              Takipio sadece işletme yönetimi değil, aynı zamanda çok kanallı
              satış düzeni için de hazırlanıyor.
            </p>
          </div>

          <div className="integration-grid">
            {marketplaces.map((item) => (
              <div className="integration-card" key={item.name}>
                <div
                  className="integration-logo-box"
                  style={
                    {
                      "--market-accent": item.accent,
                    } as React.CSSProperties
                  }
                >
                  {item.short}
                </div>
                <h3>{item.name}</h3>
                <p>{item.desc}</p>
                <div
                  className="integration-accent-line"
                  style={
                    {
                      "--line-color": item.accent,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="features-section">
        <div className="container">
          <div className="section-head">
            <span className="section-pill">Temel Güçler</span>
            <h2>Tek panelde daha güçlü işletme kontrolü</h2>
            <p>
              Siparişten stok takibine, müşteri yönetiminden yapay zekâ
              özetlerine kadar tüm akışlar tek deneyimde birleşiyor.
            </p>
          </div>

          <div className="features-grid">
            {featureCards.map((item) => (
              <div className="feature-card" key={item.title}>
                <div className="feature-icon">
                  <Icon type={item.icon} className="feature-svg" />
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="gorki" className="gorki-section">
        <div className="container gorki-grid">
          <div className="gorki-copy">
            <span className="section-pill">Gorki AI</span>
            <h2>Gorki her zaman yanında</h2>
            <p>
              Takipio’nun akıllı asistanı Gorki; günlük işlerini özetler,
              bekleyen siparişleri gösterir, stok risklerini fark ettirir ve
              pazaryeri akışlarını daha anlaşılır hale getirir.
            </p>

            <div className="gorki-bullets">
              <div className="gorki-bullet">
                <span>01</span>
                <p>Günlük özet ve operasyon takibi</p>
              </div>
              <div className="gorki-bullet">
                <span>02</span>
                <p>Bekleyen ödeme ve kritik stok uyarıları</p>
              </div>
              <div className="gorki-bullet">
                <span>03</span>
                <p>Pazaryeri odaklı veri yorumları</p>
              </div>
            </div>
          </div>

          <div className="gorki-showcase">
            <div className="gorki-big-card">
              <GorkiBot />
              <div className="gorki-big-bubble">
                “Bugün 12 sipariş daha geldi. 3 tanesi kargoya hazır görünüyor.”
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="store-section">
        <div className="container">
          <div className="store-grid">
            <div className="store-card">
              <div className="store-icon apple"></div>
              <div>
                <strong>App Store</strong>
                <span>Yakında</span>
              </div>
            </div>
            <div className="store-card">
              <div className="store-icon play">▶</div>
              <div>
                <strong>Google Play</strong>
                <span>Yakında</span>
              </div>
            </div>
            <div className="store-card">
              <div className="store-icon web">◎</div>
              <div>
                <strong>Web Panel</strong>
                <span>Erken erişim aktif</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="site-footer">
        <div className="container footer-grid">
          <a
            className="footer-instagram"
            href="https://instagram.com/takipiocom"
            target="_blank"
            rel="noreferrer"
          >
            <div className="footer-instagram-icon">◎</div>
            <div>
              <strong>Instagram: @takipiocom</strong>
              <p>Gelişmeleri ve yeni duyuruları Instagram hesabımızdan takip et.</p>
            </div>
          </a>

          <div className="footer-trust">
            <div className="footer-trust-item">
              <Icon type="shield" className="footer-svg" />
              <span>Güvenli Altyapı</span>
            </div>
            <div className="footer-trust-item">
              <Icon type="cloud" className="footer-svg" />
              <span>Kolay Entegrasyon</span>
            </div>
            <div className="footer-trust-item">
              <Icon type="chart" className="footer-svg" />
              <span>Gerçek Zamanlı Veri</span>
            </div>
            <div className="footer-trust-item">
              <Icon type="headset" className="footer-svg" />
              <span>Uzman Destek</span>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        :root {
          --bg: #f6fbff;
          --card: rgba(255, 255, 255, 0.8);
          --card-strong: #ffffff;
          --stroke: rgba(21, 62, 140, 0.12);
          --text: #07152f;
          --muted: #5f6f89;
          --primary: #0b63ff;
          --primary-2: #195cff;
          --deep: #06101f;
          --success: #18b66a;
          --shadow: 0 30px 80px rgba(7, 21, 47, 0.12);
          --shadow-soft: 0 18px 40px rgba(7, 21, 47, 0.08);
          --radius-xl: 30px;
          --radius-lg: 24px;
          --radius-md: 18px;
        }

        html,
        body {
          overflow-x: hidden;
        }

        body {
          background:
            radial-gradient(circle at top, rgba(46, 112, 255, 0.08), transparent 32%),
            linear-gradient(180deg, #fbfdff 0%, #f3f8ff 100%);
          color: var(--text);
        }

        * {
          box-sizing: border-box;
        }

        .takipio-page {
          min-height: 100vh;
          position: relative;
          overflow-x: clip;
        }

        .container {
          width: min(1240px, calc(100% - 32px));
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        .bg-orb {
          position: absolute;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        .orb-1 {
          width: 420px;
          height: 420px;
          right: -120px;
          top: 80px;
          background: rgba(15, 114, 255, 0.13);
          border-radius: 999px;
        }

        .orb-2 {
          width: 340px;
          height: 340px;
          left: -120px;
          top: 360px;
          background: rgba(0, 119, 255, 0.09);
          border-radius: 999px;
        }

        .grid-noise {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(10, 90, 255, 0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(10, 90, 255, 0.045) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: linear-gradient(180deg, rgba(255, 255, 255, 0.95), transparent 86%);
          pointer-events: none;
          z-index: 0;
        }

        .site-header {
          position: sticky;
          top: 0;
          z-index: 20;
          padding: 18px 0 0;
          background: linear-gradient(
            180deg,
            rgba(246, 251, 255, 0.92),
            rgba(246, 251, 255, 0.64),
            rgba(246, 251, 255, 0)
          );
          backdrop-filter: blur(10px);
        }

        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 14px 18px;
          border: 1px solid rgba(12, 65, 168, 0.1);
          background: rgba(255, 255, 255, 0.76);
          box-shadow: var(--shadow-soft);
          border-radius: 22px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .brand-mark-wrap {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: linear-gradient(180deg, #ffffff, #eff6ff);
          display: grid;
          place-items: center;
          border: 1px solid rgba(25, 92, 255, 0.12);
          box-shadow: 0 12px 24px rgba(11, 99, 255, 0.12);
          color: #1560ff;
          flex: 0 0 auto;
        }

        .brand .tk-logo-mark {
          width: 34px;
          height: auto;
        }

        .brand-text {
          font-size: 2rem;
          font-weight: 900;
          line-height: 1;
          color: #071849;
          letter-spacing: -0.05em;
        }

        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 30px;
        }

        .desktop-nav a {
          color: #314567;
          font-weight: 600;
          font-size: 0.98rem;
          transition: color 0.18s ease, transform 0.18s ease;
        }

        .desktop-nav a:hover {
          color: var(--primary);
          transform: translateY(-1px);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mini-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 46px;
          padding: 0 18px;
          border-radius: 14px;
          color: #fff;
          font-weight: 800;
          background: linear-gradient(135deg, #0b63ff, #3b9bff);
          box-shadow: 0 14px 28px rgba(11, 99, 255, 0.26);
        }

        .menu-toggle {
          display: none;
          width: 48px;
          height: 48px;
          border-radius: 14px;
          border: 1px solid rgba(10, 61, 180, 0.12);
          background: white;
          padding: 0;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 5px;
          box-shadow: var(--shadow-soft);
        }

        .menu-toggle span {
          width: 18px;
          height: 2px;
          background: #183767;
          border-radius: 999px;
        }

        .mobile-menu {
          width: min(1240px, calc(100% - 32px));
          margin: 10px auto 0;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(10, 61, 180, 0.1);
          box-shadow: var(--shadow-soft);
          border-radius: 20px;
          padding: 10px;
          display: none;
          flex-direction: column;
          gap: 6px;
        }

        .mobile-menu a {
          padding: 14px 14px;
          border-radius: 12px;
          color: #19345f;
          font-weight: 700;
        }

        .mobile-menu a:hover {
          background: #f3f8ff;
        }

        .hero-section {
          padding: 42px 0 24px;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.02fr) minmax(0, 1fr);
          gap: 36px;
          align-items: start;
        }

        .hero-copy {
          padding-top: 16px;
        }

        .eyebrow-row {
          display: flex;
          align-items: center;
          margin-bottom: 18px;
        }

        .eyebrow-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(19, 90, 255, 0.22);
          background: rgba(255, 255, 255, 0.88);
          color: #1a57ff;
          min-height: 44px;
          padding: 0 18px;
          border-radius: 999px;
          font-size: 0.92rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          box-shadow: 0 14px 30px rgba(11, 99, 255, 0.09);
        }

        .eyebrow-icon {
          width: 17px;
          height: 17px;
        }

        .hero-title {
          margin: 0;
          font-size: clamp(2.5rem, 5.1vw, 5rem);
          line-height: 0.98;
          letter-spacing: -0.065em;
          font-weight: 900;
          color: #081430;
        }

        .hero-title span {
          background: linear-gradient(135deg, #0c193f, #0b63ff 58%, #53b2ff);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .hero-text {
          max-width: 690px;
          margin: 22px 0 0;
          font-size: 1.09rem;
          line-height: 1.8;
          color: var(--muted);
        }

        .hero-text strong {
          color: #12388a;
        }

        .hero-marketplaces {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 24px;
        }

        .hero-market-chip {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-height: 44px;
          border-radius: 999px;
          padding: 0 16px;
          background: rgba(255, 255, 255, 0.86);
          border: 1px solid rgba(14, 53, 119, 0.08);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.04);
          color: #15335d;
          font-weight: 800;
        }

        .chip-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: var(--chip-accent);
          box-shadow: 0 0 0 6px color-mix(in srgb, var(--chip-accent) 18%, transparent);
        }

        .hero-note-card {
          margin-top: 22px;
          padding: 18px 20px;
          border-radius: 20px;
          border: 1px solid rgba(14, 53, 119, 0.08);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(246, 250, 255, 0.92));
          box-shadow: var(--shadow-soft);
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }

        .hero-note-card strong {
          display: block;
          font-size: 1rem;
          color: #08245b;
        }

        .hero-note-card p {
          margin: 6px 0 0;
          color: var(--muted);
          line-height: 1.6;
        }

        .hero-note-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #edf5ff, #ffffff);
          color: #1b62ff;
          flex: 0 0 auto;
          border: 1px solid rgba(11, 99, 255, 0.12);
        }

        .note-svg {
          width: 20px;
          height: 20px;
        }

        .waitlist-card {
          margin-top: 24px;
          padding: 24px;
          border-radius: 26px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(11, 99, 255, 0.12);
          box-shadow: var(--shadow);
        }

        .waitlist-top {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .waitlist-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          color: #1a67ff;
          background: linear-gradient(180deg, #f4f8ff, #ffffff);
          border: 1px solid rgba(11, 99, 255, 0.12);
          box-shadow: 0 10px 22px rgba(11, 99, 255, 0.08);
        }

        .waitlist-svg {
          width: 22px;
          height: 22px;
        }

        .waitlist-top h3 {
          margin: 0;
          font-size: 1.45rem;
          color: #081533;
          letter-spacing: -0.03em;
        }

        .waitlist-top p {
          margin: 8px 0 0;
          color: var(--muted);
          line-height: 1.7;
        }

        .waitlist-form {
          margin-top: 18px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
        }

        .waitlist-form input {
          width: 100%;
          min-height: 60px;
          border-radius: 18px;
          border: 1px solid rgba(9, 50, 133, 0.14);
          background: #fbfdff;
          padding: 0 18px;
          color: #07152f;
          outline: none;
          font-size: 1rem;
          font-weight: 600;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
        }

        .waitlist-form input:focus {
          border-color: rgba(11, 99, 255, 0.36);
          box-shadow:
            0 0 0 4px rgba(11, 99, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.7);
        }

        .waitlist-form button {
          min-width: 170px;
          min-height: 60px;
          border: none;
          border-radius: 18px;
          background: linear-gradient(135deg, #0b63ff, #3ba4ff);
          color: #fff;
          font-weight: 900;
          font-size: 1rem;
          cursor: pointer;
          box-shadow: 0 18px 32px rgba(11, 99, 255, 0.26);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .waitlist-form button:hover {
          transform: translateY(-1px);
          box-shadow: 0 20px 36px rgba(11, 99, 255, 0.3);
        }

        .waitlist-form button:disabled {
          opacity: 0.78;
          cursor: wait;
          transform: none;
        }

        .form-feedback-wrap {
          margin-top: 14px;
          min-height: 24px;
        }

        .success-text {
          color: #129556;
          font-weight: 800;
          line-height: 1.5;
        }

        .error-text {
          color: #dc3f56;
          font-weight: 800;
          line-height: 1.5;
        }

        .mini-benefits {
          margin-top: 14px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          color: #46607f;
          font-size: 0.94rem;
          font-weight: 700;
        }

        .hero-visual {
          position: relative;
          min-height: 820px;
        }

        .floating-stat-group {
          position: absolute;
          right: 0;
          top: 12px;
          display: grid;
          gap: 14px;
          width: 230px;
          z-index: 4;
        }

        .floating-stat-card {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 12px;
          padding: 14px 14px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(8, 52, 130, 0.1);
          box-shadow: 0 20px 34px rgba(9, 30, 66, 0.08);
          backdrop-filter: blur(12px);
        }

        .floating-stat-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: #edf5ff;
          color: #0b63ff;
          display: grid;
          place-items: center;
        }

        .floating-stat-svg {
          width: 20px;
          height: 20px;
        }

        .floating-stat-text span {
          display: block;
          font-size: 0.84rem;
          color: #62748f;
          font-weight: 700;
        }

        .floating-stat-text strong {
          display: block;
          margin-top: 4px;
          font-size: 1.45rem;
          color: #07152f;
          letter-spacing: -0.04em;
        }

        .floating-stat-card em {
          color: var(--success);
          font-style: normal;
          font-weight: 900;
          font-size: 0.9rem;
        }

        .launch-card {
          position: absolute;
          right: 16px;
          top: 234px;
          width: 248px;
          padding: 20px;
          border-radius: 28px;
          background: linear-gradient(180deg, #071125, #081835 70%, #0b2149);
          color: white;
          box-shadow: 0 26px 56px rgba(7, 17, 37, 0.26);
          z-index: 4;
          overflow: hidden;
        }

        .launch-card::before {
          content: "";
          position: absolute;
          inset: auto -30px -40px auto;
          width: 180px;
          height: 180px;
          background: radial-gradient(circle, rgba(64, 149, 255, 0.34), transparent 68%);
          pointer-events: none;
        }

        .launch-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          padding: 0 16px;
          border-radius: 14px;
          background: linear-gradient(135deg, #0b63ff, #3ba4ff);
          font-weight: 900;
          font-size: 0.96rem;
          box-shadow: 0 14px 26px rgba(11, 99, 255, 0.3);
        }

        .launch-small {
          margin-top: 18px;
          color: #d9e8ff;
          font-size: 0.98rem;
          font-weight: 900;
          letter-spacing: 0.04em;
        }

        .launch-old {
          margin-top: 8px;
          font-size: 2rem;
          color: rgba(255, 255, 255, 0.35);
          text-decoration: line-through;
          font-weight: 900;
        }

        .launch-price {
          margin-top: -2px;
          font-size: 4.1rem;
          line-height: 1;
          font-weight: 900;
          color: white;
          text-shadow: 0 0 24px rgba(60, 154, 255, 0.45);
          letter-spacing: -0.06em;
        }

        .launch-card p {
          margin: 10px 0 0;
          color: #b8c7e2;
          font-weight: 700;
        }

        .launch-card a {
          margin-top: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 52px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.08);
          color: white;
          font-weight: 900;
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
        }

        .device-stage {
          position: absolute;
          inset: 126px 0 0 0;
        }

        .dashboard-shell {
          position: absolute;
          left: 18px;
          right: 28px;
          bottom: 74px;
          min-height: 470px;
          border-radius: 34px;
          overflow: hidden;
          background: linear-gradient(180deg, #ffffff, #f7fbff);
          border: 1px solid rgba(12, 56, 140, 0.12);
          box-shadow: 0 34px 90px rgba(12, 38, 86, 0.18);
          transform: perspective(1800px) rotateY(-12deg) rotateX(4deg);
          transform-origin: center;
        }

        .dashboard-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 18px 0 18px;
        }

        .dash-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #071a47;
          font-weight: 900;
          font-size: 1.1rem;
        }

        .dash-logo-mark {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          color: #1c63ff;
        }

        .dash-logo-mark .tk-logo-mark {
          width: 23px;
        }

        .dash-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: flex-end;
        }

        .dash-tabs button {
          min-height: 36px;
          padding: 0 12px;
          border-radius: 12px;
          border: 1px solid rgba(12, 56, 140, 0.08);
          background: white;
          color: #50627f;
          font-weight: 800;
          cursor: pointer;
        }

        .dash-tabs button.active {
          background: linear-gradient(135deg, #0b63ff, #3ba4ff);
          color: white;
          box-shadow: 0 12px 22px rgba(11, 99, 255, 0.22);
        }

        .dashboard-content {
          display: grid;
          grid-template-columns: 186px 1fr;
          gap: 14px;
          padding: 16px 16px 18px;
          min-height: 406px;
        }

        .dashboard-sidebar {
          border-radius: 24px;
          background: linear-gradient(180deg, #05122d, #092354);
          color: rgba(255, 255, 255, 0.9);
          padding: 18px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sidebar-item {
          min-height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          padding: 0 12px;
          font-size: 0.92rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.78);
        }

        .sidebar-item.active,
        .sidebar-item.highlight {
          background: rgba(69, 145, 255, 0.22);
          color: #ffffff;
        }

        .sidebar-gorki {
          margin-top: auto;
          padding: 12px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.07);
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .sidebar-gorki-avatar {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #0b63ff, #71d2ff);
          box-shadow: 0 8px 20px rgba(11, 99, 255, 0.25);
        }

        .sidebar-gorki-avatar span {
          width: 16px;
          height: 8px;
          border-bottom: 3px solid white;
          border-radius: 0 0 999px 999px;
          display: block;
        }

        .sidebar-gorki strong {
          display: block;
          font-size: 0.92rem;
        }

        .sidebar-gorki p {
          margin: 4px 0 0;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.66);
        }

        .dashboard-main {
          display: flex;
          flex-direction: column;
        }

        .dashboard-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .panel-stats-row {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .panel-stat {
          border-radius: 20px;
          padding: 16px;
          background: white;
          border: 1px solid rgba(12, 56, 140, 0.08);
          box-shadow: 0 10px 24px rgba(12, 38, 86, 0.05);
        }

        .panel-stat span {
          display: block;
          color: #697a92;
          font-size: 0.82rem;
          font-weight: 700;
        }

        .panel-stat strong {
          display: block;
          margin-top: 8px;
          font-size: 1.45rem;
          color: #081635;
          letter-spacing: -0.05em;
        }

        .panel-stat em {
          display: inline-block;
          margin-top: 8px;
          color: var(--success);
          font-style: normal;
          font-weight: 900;
          font-size: 0.84rem;
        }

        .chart-card,
        .table-card,
        .stock-card,
        .integration-item {
          border-radius: 22px;
          border: 1px solid rgba(12, 56, 140, 0.08);
          background: white;
          box-shadow: 0 12px 24px rgba(12, 38, 86, 0.05);
        }

        .chart-card {
          padding: 18px;
          min-height: 220px;
        }

        .chart-header,
        .table-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .chart-header strong,
        .table-head strong {
          color: #07152f;
          font-size: 1rem;
        }

        .chart-header span,
        .table-head span {
          color: #72839b;
          font-size: 0.84rem;
          font-weight: 700;
        }

        .chart-area {
          margin-top: 16px;
          height: 150px;
          border-radius: 18px;
          background:
            linear-gradient(rgba(15, 96, 255, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15, 96, 255, 0.06) 1px, transparent 1px);
          background-size: 100% 25%, 20% 100%;
          position: relative;
          overflow: hidden;
        }

        .chart-line {
          position: absolute;
          inset: 0;
          background: no-repeat center/100% 100%
            url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 50'><path d='M0 40 C 10 35, 15 24, 24 28 S 38 40, 46 30 S 61 18, 69 22 S 82 34, 90 18 S 96 8, 100 10' fill='none' stroke='%230b63ff' stroke-width='3.4' stroke-linecap='round'/></svg>");
          opacity: 0.95;
        }

        .table-card {
          padding: 18px;
        }

        .table-body {
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .order-row {
          display: grid;
          grid-template-columns: 1.1fr 1fr 1fr auto;
          gap: 10px;
          align-items: center;
          min-height: 48px;
          padding: 0 12px;
          border-radius: 14px;
          background: #f8fbff;
          color: #19345f;
          font-weight: 700;
          font-size: 0.88rem;
        }

        .order-status {
          color: #0e9f5b;
          font-weight: 900;
        }

        .stock-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .stock-card {
          padding: 18px;
        }

        .stock-card span {
          display: block;
          color: #6d7e95;
          font-weight: 700;
        }

        .stock-card strong {
          display: block;
          margin-top: 8px;
          font-size: 1.55rem;
          color: #08152f;
          letter-spacing: -0.05em;
        }

        .stock-card p {
          margin: 10px 0 0;
          color: #667892;
          line-height: 1.55;
        }

        .stock-card.critical {
          background: linear-gradient(180deg, #fff7f8, #ffffff);
          border-color: rgba(234, 56, 76, 0.16);
        }

        .integration-preview {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .integration-item {
          padding: 16px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 14px;
          align-items: center;
        }

        .integration-item-badge {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          font-weight: 900;
          color: white;
          background: var(--badge-accent);
          box-shadow: 0 14px 24px rgba(0, 0, 0, 0.12);
        }

        .integration-item strong {
          display: block;
          color: #0b1632;
        }

        .integration-item p {
          margin: 4px 0 0;
          color: #6b7d95;
          font-size: 0.9rem;
        }

        .integration-ready {
          color: #0ea960;
          font-weight: 900;
          font-size: 0.84rem;
          white-space: nowrap;
        }

        .phone-shell {
          position: absolute;
          right: 44px;
          bottom: 38px;
          width: 208px;
          border-radius: 36px;
          background: linear-gradient(180deg, #071125, #0d2556);
          padding: 12px;
          box-shadow: 0 26px 56px rgba(7, 17, 37, 0.24);
          z-index: 5;
        }

        .phone-notch {
          width: 80px;
          height: 18px;
          border-radius: 999px;
          background: #071125;
          position: absolute;
          top: 9px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 2;
        }

        .phone-screen {
          min-height: 396px;
          border-radius: 28px;
          background: linear-gradient(180deg, #0d1732, #10254f);
          padding: 20px 14px 14px;
          color: white;
        }

        .phone-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 8px;
        }

        .phone-header span {
          font-weight: 900;
        }

        .phone-header em {
          color: #aecdff;
          font-style: normal;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .phone-mini-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 16px;
        }

        .phone-mini-card {
          padding: 12px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .phone-mini-card small {
          display: block;
          color: #a6bde8;
          font-size: 0.72rem;
        }

        .phone-mini-card strong {
          display: block;
          margin-top: 7px;
          font-size: 1rem;
          line-height: 1.2;
        }

        .phone-mini-card span {
          display: block;
          margin-top: 6px;
          color: #50d089;
          font-size: 0.72rem;
          font-weight: 800;
        }

        .phone-bar {
          margin-top: 14px;
          height: 84px;
          border-radius: 18px;
          background:
            linear-gradient(rgba(97, 165, 255, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(97, 165, 255, 0.06) 1px, transparent 1px),
            linear-gradient(180deg, rgba(17, 106, 255, 0.22), rgba(17, 106, 255, 0.04));
          background-size: 100% 25%, 25% 100%, 100% 100%;
          position: relative;
          overflow: hidden;
        }

        .phone-bar::after {
          content: "";
          position: absolute;
          left: 10px;
          right: 10px;
          bottom: 12px;
          height: 36px;
          background: no-repeat center/100% 100%
            url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 30'><path d='M0 22 C 14 18, 20 8, 28 10 S 42 24, 50 18 S 64 6, 74 10 S 88 22, 100 8' fill='none' stroke='%233a9bff' stroke-width='3.2' stroke-linecap='round'/></svg>");
        }

        .phone-order-list {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .phone-order {
          min-height: 42px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          font-size: 0.82rem;
          font-weight: 800;
        }

        .gorki-card {
          position: absolute;
          left: 26px;
          bottom: 24px;
          width: 258px;
          border-radius: 24px;
          padding: 18px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(12, 56, 140, 0.1);
          box-shadow: 0 24px 48px rgba(12, 38, 86, 0.12);
          z-index: 5;
        }

        .gorki-card-top {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .gorki-card-avatar {
          width: 46px;
          height: 46px;
          border-radius: 999px;
          background: linear-gradient(135deg, #0b63ff, #7ad8ff);
          display: grid;
          place-items: center;
          box-shadow: 0 12px 22px rgba(11, 99, 255, 0.22);
        }

        .gorki-card-avatar span {
          width: 18px;
          height: 8px;
          border-bottom: 3px solid white;
          border-radius: 0 0 999px 999px;
          display: block;
        }

        .gorki-card-top strong {
          display: block;
          color: #08152f;
        }

        .gorki-card-top p {
          margin: 4px 0 0;
          color: #6d8098;
          font-size: 0.9rem;
        }

        .gorki-message {
          margin-top: 14px;
          padding: 16px;
          border-radius: 16px;
          background: #f7fbff;
          color: #24456e;
          line-height: 1.65;
          font-weight: 700;
          border: 1px solid rgba(12, 56, 140, 0.08);
        }

        .gorki-hero-bot-wrap {
          position: absolute;
          right: -4px;
          bottom: -6px;
          z-index: 6;
          transform: scale(0.92);
        }

        .gorki-bot {
          position: relative;
          width: 180px;
          height: 210px;
        }

        .gorki-antenna {
          position: absolute;
          top: 0;
          left: 88px;
          width: 4px;
          height: 24px;
          background: #8db7ff;
          border-radius: 999px;
        }

        .gorki-antenna::after {
          content: "";
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 14px;
          height: 14px;
          border-radius: 999px;
          background: #7ad8ff;
          box-shadow: 0 0 22px rgba(122, 216, 255, 0.95);
        }

        .gorki-head {
          position: absolute;
          top: 20px;
          left: 28px;
          width: 124px;
          height: 98px;
          border-radius: 34px;
          background: linear-gradient(180deg, #ffffff, #e8eef9);
          border: 2px solid rgba(8, 37, 82, 0.08);
          box-shadow: 0 20px 36px rgba(8, 37, 82, 0.14);
          display: grid;
          place-items: center;
        }

        .gorki-head::before,
        .gorki-head::after {
          content: "";
          position: absolute;
          top: 30px;
          width: 20px;
          height: 34px;
          border-radius: 14px;
          background: linear-gradient(180deg, #ecf2fb, #dfe8f7);
          border: 2px solid rgba(8, 37, 82, 0.08);
        }

        .gorki-head::before {
          left: -12px;
        }

        .gorki-head::after {
          right: -12px;
        }

        .gorki-face {
          width: 94px;
          height: 62px;
          border-radius: 22px;
          background: linear-gradient(180deg, #091226, #0f1b34);
          box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
        }

        .gorki-eye {
          width: 12px;
          height: 18px;
          border-radius: 999px;
          background: linear-gradient(180deg, #62d7ff, #16a2ff);
          box-shadow: 0 0 16px rgba(22, 162, 255, 0.85);
        }

        .gorki-body {
          position: absolute;
          top: 108px;
          left: 52px;
          width: 76px;
          height: 78px;
          border-radius: 26px;
          background: linear-gradient(180deg, #ffffff, #e8eef9);
          border: 2px solid rgba(8, 37, 82, 0.08);
          box-shadow: 0 16px 30px rgba(8, 37, 82, 0.12);
          display: grid;
          place-items: center;
        }

        .gorki-chest {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #0b63ff, #76dbff);
          color: white;
          font-weight: 900;
          font-size: 1.35rem;
          box-shadow: 0 10px 24px rgba(11, 99, 255, 0.3);
        }

        .gorki-arm,
        .gorki-leg {
          position: absolute;
          background: linear-gradient(180deg, #ffffff, #e8eef9);
          border: 2px solid rgba(8, 37, 82, 0.08);
          box-shadow: 0 12px 20px rgba(8, 37, 82, 0.08);
        }

        .gorki-arm {
          top: 118px;
          width: 20px;
          height: 54px;
          border-radius: 20px;
        }

        .gorki-arm.left {
          left: 34px;
          transform: rotate(26deg);
        }

        .gorki-arm.right {
          right: 34px;
          transform: rotate(-24deg);
        }

        .gorki-leg {
          top: 174px;
          width: 18px;
          height: 32px;
          border-radius: 16px;
        }

        .gorki-leg.left {
          left: 68px;
        }

        .gorki-leg.right {
          right: 68px;
        }

        .section-head {
          max-width: 760px;
          margin: 0 auto 30px 0;
        }

        .section-head.centered {
          margin: 0 auto 30px;
          text-align: center;
        }

        .section-pill {
          display: inline-flex;
          align-items: center;
          min-height: 40px;
          padding: 0 16px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.88);
          color: #1c5fff;
          border: 1px solid rgba(11, 99, 255, 0.16);
          box-shadow: 0 12px 26px rgba(11, 99, 255, 0.08);
          font-weight: 900;
          letter-spacing: 0.05em;
          font-size: 0.84rem;
          text-transform: uppercase;
        }

        .section-head h2 {
          margin: 14px 0 0;
          font-size: clamp(2rem, 4vw, 3.6rem);
          line-height: 1.02;
          letter-spacing: -0.055em;
          color: #081430;
        }

        .section-head p {
          margin: 16px 0 0;
          color: var(--muted);
          line-height: 1.8;
          font-size: 1.02rem;
        }

        .integrations-section,
        .features-section,
        .gorki-section,
        .store-section,
        .site-footer {
          padding: 38px 0;
        }

        .integration-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .integration-card {
          position: relative;
          padding: 24px;
          border-radius: 26px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(11, 99, 255, 0.1);
          box-shadow: var(--shadow-soft);
          overflow: hidden;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .integration-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 26px 52px rgba(12, 38, 86, 0.11);
        }

        .integration-logo-box {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          color: white;
          font-weight: 900;
          font-size: 1rem;
          background: var(--market-accent);
          box-shadow: 0 16px 28px rgba(0, 0, 0, 0.14);
        }

        .integration-card h3 {
          margin: 18px 0 0;
          color: #08152f;
          font-size: 1.18rem;
          letter-spacing: -0.03em;
        }

        .integration-card p {
          margin: 10px 0 0;
          color: #667892;
          line-height: 1.65;
        }

        .integration-accent-line {
          margin-top: 20px;
          height: 5px;
          width: 100%;
          border-radius: 999px;
          background: var(--line-color);
          opacity: 0.88;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .feature-card {
          padding: 24px;
          border-radius: 26px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(11, 99, 255, 0.1);
          box-shadow: var(--shadow-soft);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 46px rgba(12, 38, 86, 0.1);
        }

        .feature-icon {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #ecf4ff, #ffffff);
          color: #1a67ff;
          border: 1px solid rgba(11, 99, 255, 0.12);
          box-shadow: 0 12px 24px rgba(11, 99, 255, 0.08);
        }

        .feature-svg {
          width: 24px;
          height: 24px;
        }

        .feature-card h3 {
          margin: 18px 0 0;
          font-size: 1.16rem;
          color: #08152f;
          letter-spacing: -0.03em;
        }

        .feature-card p {
          margin: 10px 0 0;
          color: #667892;
          line-height: 1.68;
        }

        .gorki-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
          gap: 24px;
          align-items: center;
        }

        .gorki-copy p {
          margin: 18px 0 0;
          color: var(--muted);
          line-height: 1.85;
          font-size: 1.04rem;
          max-width: 620px;
        }

        .gorki-bullets {
          margin-top: 24px;
          display: grid;
          gap: 12px;
        }

        .gorki-bullet {
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(11, 99, 255, 0.1);
          box-shadow: var(--shadow-soft);
        }

        .gorki-bullet span {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #0b63ff, #73d7ff);
          color: white;
          font-weight: 900;
        }

        .gorki-bullet p {
          margin: 0;
          color: #21436f;
          font-weight: 800;
          line-height: 1.5;
        }

        .gorki-showcase {
          position: relative;
        }

        .gorki-big-card {
          min-height: 440px;
          border-radius: 34px;
          background:
            radial-gradient(circle at top right, rgba(47, 121, 255, 0.16), transparent 32%),
            linear-gradient(180deg, #fdfefe, #f2f8ff);
          border: 1px solid rgba(11, 99, 255, 0.1);
          box-shadow: var(--shadow);
          display: grid;
          place-items: center;
          position: relative;
          overflow: hidden;
        }

        .gorki-big-card .gorki-bot {
          transform: scale(1.28);
        }

        .gorki-big-bubble {
          position: absolute;
          right: 22px;
          bottom: 22px;
          max-width: 260px;
          padding: 16px 18px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(11, 99, 255, 0.12);
          box-shadow: 0 16px 28px rgba(12, 38, 86, 0.08);
          color: #21436f;
          line-height: 1.7;
          font-weight: 800;
        }

        .store-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .store-card {
          min-height: 106px;
          border-radius: 24px;
          padding: 20px 22px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(11, 99, 255, 0.1);
          box-shadow: var(--shadow-soft);
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .store-icon {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          font-size: 1.45rem;
          font-weight: 900;
          color: white;
          flex: 0 0 auto;
        }

        .store-icon.apple {
          background: linear-gradient(135deg, #091127, #1b427f);
        }

        .store-icon.play {
          background: linear-gradient(135deg, #0b63ff, #44bcff);
        }

        .store-icon.web {
          background: linear-gradient(135deg, #10203d, #0b63ff);
        }

        .store-card strong {
          display: block;
          color: #08152f;
          font-size: 1.04rem;
        }

        .store-card span {
          display: block;
          margin-top: 6px;
          color: #60718b;
          font-weight: 700;
        }

        .site-footer {
          padding-bottom: 56px;
        }

        .footer-grid {
          display: grid;
          gap: 18px;
        }

        .footer-instagram {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 22px;
          border-radius: 26px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(244, 249, 255, 0.93));
          border: 1px solid rgba(11, 99, 255, 0.1);
          box-shadow: var(--shadow-soft);
        }

        .footer-instagram-icon {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          color: white;
          font-size: 1.5rem;
          background: linear-gradient(135deg, #ff5ba6, #ff9a3c, #6a5cff);
          box-shadow: 0 14px 26px rgba(255, 90, 160, 0.2);
        }

        .footer-instagram strong {
          display: block;
          color: #08152f;
          font-size: 1.06rem;
        }

        .footer-instagram p {
          margin: 6px 0 0;
          color: #60718b;
          line-height: 1.6;
        }

        .footer-trust {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .footer-trust-item {
          min-height: 94px;
          border-radius: 22px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          background: linear-gradient(180deg, #081225, #0f2144);
          color: white;
          box-shadow: 0 22px 46px rgba(6, 16, 31, 0.18);
        }

        .footer-svg {
          width: 24px;
          height: 24px;
          color: #7db9ff;
          flex: 0 0 auto;
        }

        .footer-trust-item span {
          line-height: 1.45;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.94);
        }

        @media (max-width: 1200px) {
          .hero-grid,
          .gorki-grid {
            grid-template-columns: 1fr;
          }

          .hero-visual {
            min-height: 860px;
          }

          .dashboard-shell {
            left: 0;
            right: 70px;
          }

          .integration-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .features-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 980px) {
          .desktop-nav,
          .mini-cta {
            display: none;
          }

          .menu-toggle,
          .mobile-menu {
            display: flex;
          }

          .header-inner {
            padding: 12px 14px;
          }

          .brand-text {
            font-size: 1.8rem;
          }

          .hero-section {
            padding-top: 26px;
          }

          .hero-grid {
            gap: 24px;
          }

          .hero-visual {
            min-height: 980px;
          }

          .floating-stat-group {
            position: static;
            width: 100%;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            margin-bottom: 18px;
          }

          .launch-card {
            top: 88px;
            right: 0;
          }

          .device-stage {
            inset: 180px 0 0 0;
          }

          .dashboard-shell {
            left: 0;
            right: 0;
            transform: none;
            min-height: 450px;
          }

          .phone-shell {
            right: 18px;
            bottom: 84px;
          }

          .gorki-card {
            left: 0;
            bottom: 6px;
          }

          .gorki-hero-bot-wrap {
            right: -12px;
            bottom: -2px;
          }

          .panel-stats-row,
          .stock-grid,
          .integration-preview,
          .footer-trust,
          .store-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .dashboard-content {
            grid-template-columns: 1fr;
          }

          .dashboard-sidebar {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .container {
            width: min(100% - 20px, 1240px);
          }

          .site-header {
            padding-top: 10px;
          }

          .header-inner {
            border-radius: 18px;
          }

          .brand-mark-wrap {
            width: 48px;
            height: 48px;
          }

          .brand-text {
            font-size: 1.64rem;
          }

          .hero-title {
            font-size: clamp(2.25rem, 11vw, 4rem);
          }

          .hero-text {
            font-size: 1rem;
            line-height: 1.72;
          }

          .waitlist-card {
            padding: 18px;
            border-radius: 22px;
          }

          .waitlist-top {
            align-items: flex-start;
          }

          .waitlist-form {
            grid-template-columns: 1fr;
          }

          .waitlist-form button {
            width: 100%;
            min-width: unset;
          }

          .mini-benefits {
            flex-direction: column;
            gap: 8px;
          }

          .hero-visual {
            min-height: 980px;
          }

          .floating-stat-group {
            grid-template-columns: 1fr;
          }

          .launch-card {
            position: relative;
            width: 100%;
            right: auto;
            top: auto;
            margin-bottom: 18px;
          }

          .device-stage {
            position: relative;
            inset: auto;
            min-height: 760px;
          }

          .dashboard-shell {
            position: relative;
            left: auto;
            right: auto;
            bottom: auto;
            min-height: 390px;
            border-radius: 26px;
          }

          .dashboard-topbar {
            flex-direction: column;
            align-items: flex-start;
          }

          .dash-tabs {
            width: 100%;
            justify-content: flex-start;
          }

          .panel-stats-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .order-row {
            grid-template-columns: 1fr 1fr;
            row-gap: 6px;
            min-height: auto;
            padding: 12px;
          }

          .phone-shell {
            width: 180px;
            right: 8px;
            bottom: 220px;
          }

          .phone-screen {
            min-height: 340px;
          }

          .phone-mini-grid {
            gap: 8px;
          }

          .phone-mini-card {
            padding: 10px;
          }

          .gorki-card {
            position: relative;
            left: auto;
            bottom: auto;
            width: 100%;
            margin-top: 18px;
          }

          .gorki-hero-bot-wrap {
            right: -4px;
            bottom: 44px;
            transform: scale(0.82);
          }

          .integration-grid,
          .features-grid,
          .store-grid,
          .footer-trust,
          .stock-grid,
          .integration-preview {
            grid-template-columns: 1fr;
          }

          .gorki-big-card {
            min-height: 380px;
          }

          .gorki-big-bubble {
            max-width: 220px;
            right: 14px;
            bottom: 14px;
          }

          .footer-instagram {
            align-items: flex-start;
          }
        }

        @media (max-width: 560px) {
          .header-inner {
            justify-content: space-between;
          }

          .brand {
            min-width: 0;
          }

          .brand-text {
            font-size: 1.48rem;
          }

          .brand-mark-wrap {
            width: 44px;
            height: 44px;
            border-radius: 14px;
          }

          .hero-marketplaces {
            gap: 8px;
          }

          .hero-market-chip {
            min-height: 40px;
            padding: 0 13px;
            font-size: 0.88rem;
          }

          .floating-stat-card {
            grid-template-columns: auto 1fr;
          }

          .floating-stat-card em {
            grid-column: 2;
            justify-self: start;
          }

          .dashboard-shell {
            min-height: 360px;
          }

          .panel-stats-row {
            grid-template-columns: 1fr;
          }

          .phone-shell {
            width: 164px;
            right: 4px;
            bottom: 250px;
            transform: scale(0.98);
          }

          .gorki-hero-bot-wrap {
            right: -18px;
            bottom: 80px;
            transform: scale(0.68);
          }

          .device-stage {
            min-height: 720px;
          }

          .gorki-big-card .gorki-bot {
            transform: scale(1.06);
          }

          .gorki-big-bubble {
            position: relative;
            max-width: unset;
            right: auto;
            bottom: auto;
            margin: 0 14px 14px;
          }
        }
      `}</style>
    </main>
  );
}
