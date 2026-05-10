"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

export default function AppRegisterPage() {
  return (
    <Suspense fallback={<RegisterLoading />}>
      <RegisterClient />
    </Suspense>
  );
}

function RegisterLoading() {
  return (
    <main className="min-h-screen bg-[#07111f] px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <div className="rounded-[28px] border border-white/10 bg-[#111a2e] p-8 text-center shadow-2xl">
          <p className="text-sm font-black text-blue-300">Takipio hazırlanıyor...</p>
        </div>
      </div>
    </main>
  );
}

function RegisterClient() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") || "";
  const invitedEmail = normalizeEmail(searchParams.get("email"));
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionEmail, setSessionEmail] = useState("");

  const hasInvite = useMemo(() => Boolean(inviteToken), [inviteToken]);

  async function loadSession() {
    const sessionResult = await supabase.auth.getSession();
    const currentEmail = normalizeEmail(sessionResult.data.session?.user?.email);

    setSessionEmail(currentEmail);

    if (currentEmail && !email) {
      setEmail(currentEmail);
    }
  }

  useEffect(() => {
    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function acceptInvite() {
    setBusy(true);
    setMessage("");

    try {
      const sessionResult = await supabase.auth.getSession();
      const session = sessionResult.data.session;
      const currentEmail = normalizeEmail(session?.user?.email);

      if (!session?.access_token || !currentEmail) {
        setMessage("Davet kabulü için önce giriş yapman gerekiyor.");
        setBusy(false);
        return false;
      }

      if (invitedEmail && currentEmail !== invitedEmail) {
        setMessage(`Bu davet ${invitedEmail} adresi için. Şu an ${currentEmail} ile giriş yaptın.`);
        setBusy(false);
        return false;
      }

      const response = await fetch("/api/team-invites/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          inviteToken,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error || "Davet kabul edilemedi.");
        setBusy(false);
        return false;
      }

      setMessage(`${payload.businessName || "İşletme"} paneline bağlandın. Yönlendiriliyorsun...`);

      window.setTimeout(() => {
        window.location.href = "/app";
      }, 600);

      return true;
    } finally {
      setBusy(false);
    }
  }

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const cleanEmail = normalizeEmail(email);

      if (!cleanEmail) {
        setMessage("E-posta zorunlu.");
        setBusy(false);
        return;
      }

      if (password.length < 6) {
        setMessage("Şifre en az 6 karakter olmalı.");
        setBusy(false);
        return;
      }

      if (invitedEmail && cleanEmail !== invitedEmail) {
        setMessage(`Bu davet ${invitedEmail} adresi için. Lütfen aynı e-posta ile kayıt ol.`);
        setBusy(false);
        return;
      }

      const result = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: displayName,
          },
          emailRedirectTo: `${window.location.origin}/app/register?invite=${encodeURIComponent(inviteToken)}&email=${encodeURIComponent(cleanEmail)}`,
        },
      });

      if (result.error) {
        setMessage(`Kayıt oluşturulamadı: ${result.error.message}`);
        setBusy(false);
        return;
      }

      if (!result.data.session) {
        setMessage("Kayıt oluşturuldu. E-posta doğrulaması açıksa gelen doğrulama mailini onayla, sonra davet linkine tekrar tıkla.");
        setBusy(false);
        return;
      }

      setBusy(false);
      await acceptInvite();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Kayıt tamamlanamadı.";
      setMessage(errorMessage);
      setBusy(false);
    }
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const cleanEmail = normalizeEmail(email);

      if (!cleanEmail) {
        setMessage("E-posta zorunlu.");
        setBusy(false);
        return;
      }

      if (invitedEmail && cleanEmail !== invitedEmail) {
        setMessage(`Bu davet ${invitedEmail} adresi için. Lütfen aynı e-posta ile giriş yap.`);
        setBusy(false);
        return;
      }

      const result = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (result.error) {
        setMessage(`Giriş yapılamadı: ${result.error.message}`);
        setBusy(false);
        return;
      }

      setBusy(false);
      await acceptInvite();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Giriş tamamlanamadı.";
      setMessage(errorMessage);
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#07111f] px-4 py-10 text-white">
      <div className="mx-auto grid min-h-[80vh] max-w-6xl items-center gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[32px] border border-white/10 bg-[#111a2e] p-7 shadow-2xl">
          <div className="mb-6 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
            Takipio Ekip Daveti
          </div>

          <h1 className="text-[38px] font-black tracking-[-0.06em] sm:text-5xl">
            İşletme paneline katıl
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
            Bu sayfa seni davet eden işletmenin paneline bağlar. Yetkilerin işletme sahibi tarafından belirlenir.
          </p>

          <div className="mt-6 grid gap-3">
            <InfoLine label="Davet e-postası" value={invitedEmail || "Mail linkinden okunamadı"} />
            <InfoLine label="Mevcut oturum" value={sessionEmail || "Henüz giriş yok"} />
            <InfoLine label="Davet bağlantısı" value={hasInvite ? "Aktif" : "Eksik"} />
          </div>

          <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
            Güvenlik için davet sadece davet edilen e-posta adresiyle kabul edilebilir.
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-[#111a2e] p-6 shadow-2xl">
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-[#0b1220] p-1 ring-1 ring-white/10">
            <button
              onClick={() => setMode("signup")}
              className={`rounded-xl px-4 py-3 text-sm font-black transition ${mode === "signup" ? "bg-blue-600 text-white" : "text-slate-400"}`}
            >
              Kayıt Ol
            </button>
            <button
              onClick={() => setMode("login")}
              className={`rounded-xl px-4 py-3 text-sm font-black transition ${mode === "login" ? "bg-blue-600 text-white" : "text-slate-400"}`}
            >
              Giriş Yap
            </button>
          </div>

          <form onSubmit={mode === "signup" ? handleSignup : handleLogin} className="grid gap-4">
            {mode === "signup" ? (
              <label>
                <span className="mb-1.5 block text-xs font-black text-slate-400">Ad Soyad</span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Adın"
                  className="input"
                />
              </label>
            ) : null}

            <label>
              <span className="mb-1.5 block text-xs font-black text-slate-400">E-posta</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="mail@ornek.com"
                className="input"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-black text-slate-400">Şifre</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="En az 6 karakter"
                className="input"
              />
            </label>

            {message ? (
              <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">
                {message}
              </div>
            ) : null}

            <button
              disabled={busy || !email || !password || !inviteToken}
              className="rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "İşleniyor..." : mode === "signup" ? "Kayıt Ol ve İşletmeye Katıl" : "Giriş Yap ve İşletmeye Katıl"}
            </button>

            <button
              type="button"
              onClick={acceptInvite}
              disabled={busy || !inviteToken}
              className="rounded-2xl bg-emerald-500/15 px-5 py-4 text-sm font-black text-emerald-300 ring-1 ring-emerald-400/20 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Zaten giriş yaptım, işletmeye bağlan
            </button>
          </form>
        </section>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgba(255,255,255,0.1);
          background: #0b1220;
          padding: 0.9rem 1rem;
          font-size: 0.95rem;
          outline: none;
        }
      `}</style>
    </main>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#0b1220] px-4 py-3 ring-1 ring-white/10">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="text-right text-sm font-black text-white">{value}</p>
    </div>
  );
}
