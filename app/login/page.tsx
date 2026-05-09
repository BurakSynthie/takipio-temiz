"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type AuthMode = "login" | "register";

const features = [
  {
    title: "Sipariş Yönetimi",
    desc: "Siparişlerini oluştur, durumlarını takip et ve operasyonu tek ekrandan yönet.",
    icon: "cart",
  },
  {
    title: "Stok Takibi",
    desc: "Kritik stokları gör, ürün hareketlerini canlı takip et.",
    icon: "box",
  },
  {
    title: "QR / Barkod",
    desc: "Ürün etiketlerini oluştur, QR ile hızlı okutma yap.",
    icon: "qr",
  },
  {
    title: "Entegrasyonlar",
    desc: "Trendyol, Hepsiburada, Amazon ve ÇiçekSepeti akışlarını izle.",
    icon: "grid",
  },
  {
    title: "Faturalar",
    desc: "Tahsilat, fatura ve ödeme durumlarını kontrol altında tut.",
    icon: "invoice",
  },
  {
    title: "Gorki AI",
    desc: "Akıllı asistanınla stok, sipariş ve uyarıları daha hızlı yönet.",
    icon: "bot",
  },
];

function Icon({ name, className = "" }: { name: string; className?: string }) {
  const common = "h-5 w-5";

  if (name === "cart") {
    return (
      <svg viewBox="0 0 24 24" className={className || common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.65 12.42a2 2 0 0 0 2 1.58h9.72a2 2 0 0 0 2-1.58L22 6H6" />
      </svg>
    );
  }

  if (name === "box") {
    return (
      <svg viewBox="0 0 24 24" className={className || common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="m4 7.5 8 4.5 8-4.5" />
        <path d="M12 12v9" />
      </svg>
    );
  }

  if (name === "qr") {
    return (
      <svg viewBox="0 0 24 24" className={className || common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h6v6H4z" />
        <path d="M14 4h6v6h-6z" />
        <path d="M4 14h6v6H4z" />
        <path d="M14 14h2v2h-2z" />
        <path d="M18 14h2v6h-4v-2h2z" />
      </svg>
    );
  }

  if (name === "grid") {
    return (
      <svg viewBox="0 0 24 24" className={className || common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h7v7H4z" />
        <path d="M13 4h7v7h-7z" />
        <path d="M4 13h7v7H4z" />
        <path d="M13 13h7v7h-7z" />
      </svg>
    );
  }

  if (name === "invoice") {
    return (
      <svg viewBox="0 0 24 24" className={className || common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2-3-2V5a2 2 0 0 1 2-2Z" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </svg>
    );
  }

  if (name === "bot") {
    return (
      <svg viewBox="0 0 24 24" className={className || common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="8" width="16" height="12" rx="4" />
        <path d="M12 4v4" />
        <path d="M8 2h8" />
        <path d="M9 14h.01" />
        <path d="M15 14h.01" />
        <path d="M9.5 17h5" />
      </svg>
    );
  }

  if (name === "mail") {
    return (
      <svg viewBox="0 0 24 24" className={className || common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16v16H4z" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  }

  if (name === "lock") {
    return (
      <svg viewBox="0 0 24 24" className={className || common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
    );
  }

  if (name === "eye") {
    return (
      <svg viewBox="0 0 24 24" className={className || common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  if (name === "arrow") {
    return (
      <svg viewBox="0 0 24 24" className={className || common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );
  }

  return null;
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10">
        <img src="/takipio-logo.png" alt="Takipio" className="h-full w-full object-contain p-1.5" />
      </div>
      <div>
        <p className="text-xl font-black tracking-[-0.04em] text-white">Takipio</p>
        <p className="text-[11px] font-bold text-slate-500">Premium işletme merkezi</p>
      </div>
    </div>
  );
}

function GorkiVisual({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-3" : "relative"}>
      <div className={compact ? "h-16 w-16 overflow-hidden rounded-3xl bg-blue-600/20" : "h-[220px] w-[220px] overflow-hidden rounded-[48px] bg-blue-600/10 ring-1 ring-blue-400/20"}>
        <img src="/gorki-hero.png" alt="Gorki AI" className="h-full w-full object-contain p-2" />
      </div>
      {compact ? (
        <div>
          <p className="text-sm font-black text-white">Gorki AI yanında</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">Stok, sipariş ve uyarılarda sana yardımcı olur.</p>
        </div>
      ) : (
        <div className="absolute -bottom-4 left-6 right-6 rounded-3xl border border-white/10 bg-[#07111f]/80 p-4 shadow-2xl backdrop-blur-xl">
          <p className="text-sm font-black text-white">Merhaba 👋</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">Ben Gorki. İşini daha akıllı yönetmen için buradayım.</p>
        </div>
      )}
    </div>
  );
}

function MiniStat({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="rounded-3xl border border-blue-400/20 bg-blue-500/10 p-4 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-200">{title}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-emerald-300">{sub}</p>
      <div className="mt-4 flex h-10 items-end gap-1.5">
        {[35, 52, 45, 68, 50, 74, 62, 88].map((height, index) => (
          <span key={index} className="w-full rounded-full bg-blue-400/60" style={{ height: `${height}%` }} />
        ))}
      </div>
    </div>
  );
}

function AuthForm({
  mode,
  email,
  password,
  remember,
  loading,
  showPassword,
  message,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onRememberChange,
  onShowPasswordChange,
  onSubmit,
  onForgotPassword,
}: {
  mode: AuthMode;
  email: string;
  password: string;
  remember: boolean;
  loading: boolean;
  showPassword: boolean;
  message: string;
  onModeChange: (mode: AuthMode) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberChange: (value: boolean) => void;
  onShowPasswordChange: (value: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onForgotPassword: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-[32px] border border-white/10 bg-[#0b1220]/82 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-xl sm:p-7">
      <div>
        <div className="mb-5 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300 ring-1 ring-blue-400/20">
          {mode === "login" ? "Güvenli giriş" : "Yeni işletme hesabı"}
        </div>

        <h1 className="text-[34px] font-black leading-[0.95] tracking-[-0.06em] text-white sm:text-5xl">
          Takipio’ya <span className="block text-blue-400">{mode === "login" ? "Hoş Geldin" : "Başlayalım"}</span>
        </h1>

        <p className="mt-4 max-w-md text-sm leading-6 text-slate-400">
          İşini büyütmek için ihtiyacın olan tüm araçlar tek platformda. Yönet, analiz et, hızlan.
        </p>
      </div>

      {message ? (
        <div className="mt-5 rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm font-bold leading-6 text-blue-100">
          {message}
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        <label>
          <span className="mb-2 block text-xs font-black text-slate-300">E-posta</span>
          <div className="flex h-13 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 transition focus-within:border-blue-400/50 focus-within:bg-white/8">
            <Icon name="mail" className="h-4 w-4 shrink-0 text-slate-500" />
            <input
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              type="email"
              placeholder="ornek@firma.com"
              className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-slate-600"
              required
            />
          </div>
        </label>

        <label>
          <span className="mb-2 block text-xs font-black text-slate-300">Şifre</span>
          <div className="flex h-13 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 transition focus-within:border-blue-400/50 focus-within:bg-white/8">
            <Icon name="lock" className="h-4 w-4 shrink-0 text-slate-500" />
            <input
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-slate-600"
              required
              minLength={6}
            />
            <button type="button" onClick={() => onShowPasswordChange(!showPassword)} className="text-slate-500 transition hover:text-blue-300">
              <Icon name="eye" className="h-4 w-4" />
            </button>
          </div>
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-400">
          <input
            checked={remember}
            onChange={(event) => onRememberChange(event.target.checked)}
            type="checkbox"
            className="h-4 w-4 rounded border-white/10 accent-blue-500"
          />
          Beni hatırla
        </label>

        <button type="button" onClick={onForgotPassword} className="text-xs font-black text-blue-300 transition hover:text-blue-200">
          Şifremi unuttum?
        </button>
      </div>

      <button
        disabled={loading}
        className="mt-6 flex h-13 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-sm font-black text-white shadow-2xl shadow-blue-950/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "İşleniyor..." : mode === "login" ? "Giriş Yap" : "Kayıt Ol"}
        <Icon name="arrow" className="h-4 w-4" />
      </button>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-bold text-slate-600">veya</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <button
        type="button"
        onClick={() => onModeChange(mode === "login" ? "register" : "login")}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 text-sm font-black text-slate-300 transition hover:bg-white/8 hover:text-white"
      >
        {mode === "login" ? "Hesabın yok mu? Kayıt ol" : "Zaten hesabın var mı? Giriş yap"}
        <Icon name="arrow" className="h-4 w-4 text-blue-300" />
      </button>

      <p className="mt-5 text-center text-[11px] font-bold leading-5 text-slate-600">
        Verileriniz güvenli bağlantı üzerinden korunur.
      </p>
    </form>
  );
}

function LaptopMockup({
  mode,
  email,
  password,
  remember,
  loading,
  showPassword,
  message,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onRememberChange,
  onShowPasswordChange,
  onSubmit,
  onForgotPassword,
}: {
  mode: AuthMode;
  email: string;
  password: string;
  remember: boolean;
  loading: boolean;
  showPassword: boolean;
  message: string;
  onModeChange: (mode: AuthMode) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberChange: (value: boolean) => void;
  onShowPasswordChange: (value: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onForgotPassword: () => void;
}) {
  return (
    <div className="relative mx-auto w-full max-w-[1220px]">
      <div className="absolute -left-7 top-12 hidden w-[190px] xl:block">
        <MiniStat title="Bugünkü Sipariş" value="1.247" sub="↑ 18.6%" />
      </div>

      <div className="absolute -left-10 bottom-16 hidden w-[230px] xl:block">
        <div className="rounded-3xl border border-white/10 bg-[#0b1220]/80 p-4 shadow-2xl backdrop-blur-xl">
          <p className="text-sm font-black text-white">Sipariş Durumu</p>
          <div className="mt-4 grid grid-cols-[80px_1fr] items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-[conic-gradient(#38bdf8_0_62%,#2dd4bf_62%_86%,#fb7185_86%_100%)] p-3">
              <div className="h-full w-full rounded-full bg-[#0b1220]" />
            </div>
            <div className="space-y-2 text-xs font-bold text-slate-400">
              <p><span className="text-sky-300">●</span> Tamamlandı %62</p>
              <p><span className="text-teal-300">●</span> Hazırlanıyor %24</p>
              <p><span className="text-rose-300">●</span> İptal %14</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -right-6 top-16 hidden w-[220px] xl:block">
        <div className="rounded-3xl border border-blue-400/20 bg-blue-500/10 p-4 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
          <p className="text-sm font-black text-white">Yeni Sipariş</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">#10245 numaralı sipariş alındı.</p>
        </div>
      </div>

      <div className="rounded-[36px] border border-white/10 bg-[#111827] p-3 shadow-[0_40px_120px_rgba(15,23,42,.75)]">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#07111f]">
          <div className="grid min-h-[680px] gap-0 lg:grid-cols-[430px_1fr]">
            <div className="border-b border-white/10 bg-[#0b1220]/80 p-5 lg:border-b-0 lg:border-r lg:p-7">
              <Logo />
              <div className="mt-7">
                <AuthForm
                  mode={mode}
                  email={email}
                  password={password}
                  remember={remember}
                  loading={loading}
                  showPassword={showPassword}
                  message={message}
                  onModeChange={onModeChange}
                  onEmailChange={onEmailChange}
                  onPasswordChange={onPasswordChange}
                  onRememberChange={onRememberChange}
                  onShowPasswordChange={onShowPasswordChange}
                  onSubmit={onSubmit}
                  onForgotPassword={onForgotPassword}
                />
              </div>
            </div>

            <div className="relative overflow-hidden p-5 lg:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(37,99,235,.35),transparent_35%),radial-gradient(circle_at_90%_70%,rgba(6,182,212,.18),transparent_30%)]" />
              <div className="absolute right-0 top-0 h-[420px] w-[420px] rounded-full border border-blue-400/20 opacity-50" />
              <div className="relative z-10">
                <div className="max-w-lg">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Tek platform</p>
                  <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.05em] text-white">
                    İşini tek yerden yönet, <span className="text-blue-400">büyümeye odaklan.</span>
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-slate-400">
                    Sipariş, stok, QR, fatura, müşteri ve pazaryeri akışlarını tek premium panelde birleştir.
                  </p>
                </div>

                <div className="mt-8 grid gap-3 xl:grid-cols-2">
                  {features.map((feature) => (
                    <div key={feature.title} className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/8">
                      <div className="flex gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/20">
                          <Icon name={feature.icon} />
                        </span>
                        <div>
                          <h3 className="text-sm font-black text-white">{feature.title}</h3>
                          <p className="mt-1 text-xs leading-5 text-slate-400">{feature.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 flex items-end justify-between gap-6">
                  <div className="max-w-sm rounded-3xl border border-white/10 bg-[#0b1220]/70 p-4 backdrop-blur-xl">
                    <p className="text-sm font-black text-white">Gorki AI hazır</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Panel içinde soru sor, kritik stokları ve bekleyen işleri daha hızlı gör.
                    </p>
                  </div>
                  <div className="hidden xl:block">
                    <GorkiVisual />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto h-5 w-[42%] rounded-b-[24px] bg-slate-900 shadow-inner" />
      </div>
    </div>
  );
}

function PhonePreview({
  mode,
  email,
  password,
  remember,
  loading,
  showPassword,
  message,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onRememberChange,
  onShowPasswordChange,
  onSubmit,
  onForgotPassword,
}: {
  mode: AuthMode;
  email: string;
  password: string;
  remember: boolean;
  loading: boolean;
  showPassword: boolean;
  message: string;
  onModeChange: (mode: AuthMode) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberChange: (value: boolean) => void;
  onShowPasswordChange: (value: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onForgotPassword: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-[430px] rounded-[38px] border border-white/10 bg-slate-950 p-3 shadow-2xl shadow-blue-950/30 lg:hidden">
      <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#07111f]">
        <div className="flex items-center justify-between px-5 py-4">
          <Logo />
          <span className="rounded-full bg-blue-500/15 px-3 py-1 text-[10px] font-black text-blue-300">Mobil</span>
        </div>

        <div className="px-4 pb-4">
          <AuthForm
            mode={mode}
            email={email}
            password={password}
            remember={remember}
            loading={loading}
            showPassword={showPassword}
            message={message}
            onModeChange={onModeChange}
            onEmailChange={onEmailChange}
            onPasswordChange={onPasswordChange}
            onRememberChange={onRememberChange}
            onShowPasswordChange={onShowPasswordChange}
            onSubmit={onSubmit}
            onForgotPassword={onForgotPassword}
          />

          <div className="mt-4">
            <GorkiVisual compact />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = window.localStorage.getItem("takipio-remember-email");
    const rememberEnabled = window.localStorage.getItem("takipio-remember-enabled") === "true";

    if (rememberEnabled && savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/app");
      }
    });
  }, [router]);

  const pageLabel = useMemo(() => {
    return mode === "login" ? "Giriş Yap" : "Kayıt Ol";
  }, [mode]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (remember) {
        window.localStorage.setItem("takipio-remember-email", email.trim());
        window.localStorage.setItem("takipio-remember-enabled", "true");
      } else {
        window.localStorage.removeItem("takipio-remember-email");
        window.localStorage.removeItem("takipio-remember-enabled");
      }

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setMessage(error.message === "Invalid login credentials" ? "E-posta veya şifre hatalı." : error.message);
          setLoading(false);
          return;
        }

        const sessionCheck = await supabase.auth.getSession();

        if (!sessionCheck.data.session) {
          setMessage("Giriş yapıldı ama oturum tarayıcıya kaydedilemedi. Lütfen tekrar dene.");
          setLoading(false);
          return;
        }

        router.replace("/app");
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setMessage("Kayıt oluşturuldu. Supabase e-posta onayı açıksa mailini kontrol et. Onay kapalıysa giriş yapabilirsin.");
      setMode("login");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "İşlem sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setMessage("Şifre sıfırlama için önce e-posta adresini yaz.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Şifre sıfırlama bağlantısı e-posta adresine gönderildi.");
    }

    setLoading(false);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020817] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,.35),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(6,182,212,.15),transparent_28%),radial-gradient(circle_at_50%_90%,rgba(59,130,246,.18),transparent_32%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:42px_42px]" />

      <section className="relative z-10 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto mb-5 flex max-w-[1320px] items-center justify-between">
          <Logo />
          <div className="hidden items-center gap-3 sm:flex">
            <span className="rounded-full bg-white/5 px-4 py-2 text-xs font-black text-slate-300 ring-1 ring-white/10">
              Web + Mobil hazır
            </span>
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white transition hover:bg-blue-500"
            >
              {pageLabel}
            </button>
          </div>
        </div>

        <div className="hidden lg:block">
          <LaptopMockup
            mode={mode}
            email={email}
            password={password}
            remember={remember}
            loading={loading}
            showPassword={showPassword}
            message={message}
            onModeChange={setMode}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onRememberChange={setRemember}
            onShowPasswordChange={setShowPassword}
            onSubmit={handleSubmit}
            onForgotPassword={handleForgotPassword}
          />
        </div>

        <PhonePreview
          mode={mode}
          email={email}
          password={password}
          remember={remember}
          loading={loading}
          showPassword={showPassword}
          message={message}
          onModeChange={setMode}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onRememberChange={setRemember}
          onShowPasswordChange={setShowPassword}
          onSubmit={handleSubmit}
          onForgotPassword={handleForgotPassword}
        />
      </section>
    </main>
  );
}
// takipio redeploy trigger
