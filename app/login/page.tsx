
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("takipio_remembered_email");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push("/app");
    });
  }, [router]);

  async function handleAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setMessage("E-posta ve şifre gerekli.");
      setLoading(false);
      return;
    }

    if (rememberMe) localStorage.setItem("takipio_remembered_email", cleanEmail);
    else localStorage.removeItem("takipio_remembered_email");

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
      router.push("/app");
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { full_name: fullName.trim() || cleanEmail } },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    await supabase.from("app_user_profiles").upsert(
      { email: cleanEmail, full_name: fullName.trim() || cleanEmail, role_name: "Kullanıcı" },
      { onConflict: "email" }
    );

    setMessage("Kayıt oluşturuldu. E-posta doğrulaması açıksa mailini kontrol et; değilse giriş yapabilirsin.");
    setMode("login");
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden border-r border-white/10 bg-[#101a2f] p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.28),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.14),transparent_28%)]" />
          <div className="relative">
            <div className="relative h-16 w-44 rounded-[24px] bg-white/5 p-3 ring-1 ring-white/10">
              <Image src="/takipio-logo.png" alt="Takipio" fill className="object-contain p-2" priority />
            </div>
            <h1 className="mt-12 max-w-xl text-6xl font-black leading-[0.92] tracking-[-0.065em]">İşletmeni tek panelden yönet.</h1>
            <p className="mt-6 max-w-lg text-sm leading-6 text-slate-400">Satış, stok, QR, fatura, ekip yetkileri ve Gorki AI desteği tek merkezde.</p>
          </div>
          <div className="relative grid grid-cols-3 gap-3">
            {["Satış", "Stok", "Yetki"].map((item) => (
              <div key={item} className="rounded-[22px] bg-white/8 p-4 ring-1 ring-white/10">
                <p className="text-sm font-black">{item}</p>
                <p className="mt-1 text-xs text-slate-500">Aktif</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-4">
          <form onSubmit={handleAuth} className="w-full max-w-[440px] rounded-[30px] border border-white/10 bg-[#111a2e] p-5 shadow-[0_28px_90px_rgba(2,6,23,0.34)]">
            <div className="mb-6 flex justify-center lg:hidden">
              <div className="relative h-14 w-40 rounded-[22px] bg-white/5 p-3 ring-1 ring-white/10">
                <Image src="/takipio-logo.png" alt="Takipio" fill className="object-contain p-2" priority />
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">{mode === "login" ? "Giriş" : "Kayıt"}</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">{mode === "login" ? "Panele giriş yap" : "Yeni hesap oluştur"}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {mode === "login" ? "E-posta ve şifrenle Takipio paneline gir." : "Ekip üyesiysen, sahibin eklediği e-posta ile kayıt ol. Şifreni burada sen belirlersin."}
              </p>
            </div>

            <div className="grid gap-3">
              {mode === "register" ? (
                <label>
                  <span className="mb-1.5 block text-xs font-black text-slate-400">Ad Soyad</span>
                  <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none focus:border-blue-400" placeholder="Burak Kutluk" />
                </label>
              ) : null}

              <label>
                <span className="mb-1.5 block text-xs font-black text-slate-400">E-posta</span>
                <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none focus:border-blue-400" placeholder="takipioinfo@gmail.com" type="email" autoComplete="email" />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-black text-slate-400">Şifre</span>
                <input value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none focus:border-blue-400" placeholder="••••••••" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} />
              </label>

              <label className="flex items-center justify-between gap-3 rounded-2xl bg-[#0b1220] px-4 py-3">
                <div>
                  <p className="text-sm font-black">Beni hatırla</p>
                  <p className="mt-1 text-xs text-slate-500">E-posta ve oturum bu cihazda tutulur.</p>
                </div>
                <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-5 w-5" />
              </label>
            </div>

            {message ? <div className="mt-4 rounded-2xl bg-blue-400/10 px-4 py-3 text-sm font-bold text-blue-200">{message}</div> : null}

            <button disabled={loading} className="mt-5 w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-60">
              {loading ? "İşleniyor..." : mode === "login" ? "Giriş Yap" : "Kayıt Ol"}
            </button>

            <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }} className="mt-3 w-full rounded-2xl bg-white/8 px-5 py-3 text-sm font-black text-slate-200 transition hover:bg-white/12">
              {mode === "login" ? "Hesabın yok mu? Kayıt ol" : "Zaten hesabın var mı? Giriş yap"}
            </button>

            <p className="mt-4 text-xs leading-5 text-slate-500">Şifre güvenlik nedeniyle kaydedilmez. Tarayıcı kendi şifre yöneticisiyle kaydedebilir; Takipio sadece e-postayı ve Supabase oturumunu hatırlar.</p>
          </form>
        </section>
      </div>
    </main>
  );
}
