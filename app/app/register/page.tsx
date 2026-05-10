"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Invite = {
  id: string;
  business_id: string;
  email: string;
  display_name: string | null;
  role_name: string | null;
  token: string | null;
  status: string | null;
  invited_by: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  expires_at: string | null;
  created_at: string | null;
};

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

function formatDate(date: string | null | undefined) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function isExpired(date: string | null | undefined) {
  if (!date) return false;
  return new Date(date).getTime() < Date.now();
}

export default function RegisterPage() {
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
  const [invite, setInvite] = useState<Invite | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  const inviteState = useMemo(() => {
    if (!inviteToken) return "missing";
    if (!invite) return "unknown";
    if (invite.status === "accepted") return "accepted";
    if (isExpired(invite.expires_at)) return "expired";
    return "valid";
  }, [invite, inviteToken]);

  async function loadInvite() {
    setChecking(true);
    setMessage("");

    try {
      if (!inviteToken) {
        setMessage("Davet bağlantısı eksik. Maildeki davet linkine tekrar tıkla.");
        setChecking(false);
        return;
      }

      const sessionResult = await supabase.auth.getSession();
      const sessionEmail = normalizeEmail(sessionResult.data.session?.user?.email);

      // Kullanıcı henüz giriş yapmadıysa invite RLS nedeniyle daveti okuyamayabilir.
      // Bu normal. Önce formu gösteriyoruz, kabul işlemi girişten sonra yapılacak.
      if (!sessionEmail) {
        setChecking(false);
        return;
      }

      const { data, error } = await supabase
        .from("team_invites")
        .select("*")
        .eq("token", inviteToken)
        .maybeSingle();

      if (error) {
        setMessage(`Davet kontrol edilemedi: ${error.message}`);
        setChecking(false);
        return;
      }

      if (data) {
        const foundInvite = data as Invite;
        setInvite(foundInvite);
        setEmail(normalizeEmail(foundInvite.email || invitedEmail || sessionEmail));
        setDisplayName(foundInvite.display_name || "");
      }
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    loadInvite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteToken]);

  async function acceptInvite() {
    const sessionResult = await supabase.auth.getSession();
    const session = sessionResult.data.session;
    const sessionEmail = normalizeEmail(session?.user?.email);

    if (!session || !sessionEmail) {
      setMessage("Davet kabulü için önce giriş yapman gerekiyor.");
      return false;
    }

    const inviteResult = await supabase
      .from("team_invites")
      .select("*")
      .eq("token", inviteToken)
      .maybeSingle();

    if (inviteResult.error) {
      setMessage(`Davet bulunamadı: ${inviteResult.error.message}`);
      return false;
    }

    if (!inviteResult.data) {
      setMessage("Davet bulunamadı. Link hatalı olabilir veya davet iptal edilmiş olabilir.");
      return false;
    }

    const foundInvite = inviteResult.data as Invite;
    setInvite(foundInvite);

    if (normalizeEmail(foundInvite.email) !== sessionEmail) {
      setMessage(`Bu davet ${foundInvite.email} adresi için oluşturulmuş. Şu an ${sessionEmail} ile giriş yaptın.`);
      return false;
    }

    if (foundInvite.status === "accepted") {
      window.location.href = "/app";
      return true;
    }

    if (isExpired(foundInvite.expires_at)) {
      setMessage("Bu davetin süresi dolmuş. İşletme sahibinden yeni davet istemelisin.");
      return false;
    }

    const memberResult = await supabase
      .from("business_members")
      .select("*")
      .eq("business_id", foundInvite.business_id)
      .eq("email", sessionEmail)
      .maybeSingle();

    if (memberResult.error) {
      setMessage(`Üyelik kontrol edilemedi: ${memberResult.error.message}`);
      return false;
    }

    if (!memberResult.data) {
      setMessage("Davet bulundu ama ekip üyeliğin oluşturulmamış. İşletme sahibinden seni tekrar eklemesini iste.");
      return false;
    }

    if (memberResult.data.member_status === "disabled") {
      setMessage("Bu ekip üyeliği pasif görünüyor. İşletme sahibi tekrar aktif yapmalı.");
      return false;
    }

    const updateResult = await supabase
      .from("team_invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", foundInvite.id)
      .eq("email", sessionEmail);

    if (updateResult.error) {
      setMessage(`Davet kabul edilemedi: ${updateResult.error.message}`);
      return false;
    }

    await supabase.from("notifications").insert({
      business_id: foundInvite.business_id,
      created_by: sessionEmail,
      target_email: null,
      title: "Ekip daveti kabul edildi",
      message: `${sessionEmail} Takipio davetini kabul etti.`,
      type: "success",
      href: "/app/settings",
    });

    setMessage("Davet kabul edildi. Panele yönlendiriliyorsun...");
    window.setTimeout(() => {
      window.location.href = "/app";
    }, 700);

    return true;
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
          emailRedirectTo: `${window.location.origin}/register?invite=${encodeURIComponent(inviteToken)}&email=${encodeURIComponent(cleanEmail)}`,
        },
      });

      if (result.error) {
        setMessage(`Kayıt oluşturulamadı: ${result.error.message}`);
        setBusy(false);
        return;
      }

      if (!result.data.session) {
        setMessage("Kayıt oluşturuldu. E-posta doğrulaması açıksa gelen doğrulama mailini onayla, sonra bu davet linkine tekrar tıkla.");
        setBusy(false);
        return;
      }

      await acceptInvite();
    } finally {
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

      await acceptInvite();
    } finally {
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
            Takipio ekibine katıl
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
            Sana gönderilen daveti kabul etmek için davet edilen e-posta adresinle kayıt ol veya mevcut hesabınla giriş yap.
          </p>

          <div className="mt-6 grid gap-3">
            <InfoLine label="Davet e-postası" value={invitedEmail || "Mail linkinden okunamadı"} />
            <InfoLine label="Davet durumu" value={checking ? "Kontrol ediliyor..." : inviteState === "accepted" ? "Daha önce kabul edilmiş" : inviteState === "expired" ? "Süresi dolmuş" : inviteState === "valid" ? "Geçerli" : "Giriş sonrası kontrol edilecek"} />
            {invite?.expires_at ? <InfoLine label="Geçerlilik" value={formatDate(invite.expires_at)} /> : null}
          </div>

          <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
            Davet linki çalışsa bile, güvenlik için sadece davet edilen e-posta adresiyle kabul edilebilir.
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
              {busy ? "İşleniyor..." : mode === "signup" ? "Kayıt Ol ve Daveti Kabul Et" : "Giriş Yap ve Daveti Kabul Et"}
            </button>

            <button
              type="button"
              onClick={acceptInvite}
              disabled={busy || !inviteToken}
              className="rounded-2xl bg-emerald-500/15 px-5 py-4 text-sm font-black text-emerald-300 ring-1 ring-emerald-400/20 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Zaten giriş yaptım, daveti kabul et
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
