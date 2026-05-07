"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/app");
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      setLoading(false);

      if (error) {
        setMessage("Giriş yapılamadı. E-posta veya şifreyi kontrol et.");
        return;
      }

      router.replace("/app");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (error) {
      setMessage("Kayıt oluşturulamadı. Şifre en az 6 karakter olmalı.");
      return;
    }

    setMessage("Kayıt oluşturuldu. Mail onayı açıksa e-postanı kontrol et.");
  }

  return (
    <main className="loginPage">
      <section className="loginCard">
        <div className="brand"><img src="/takipio-logo.png" alt="Takipio" /></div>
        <span className="eyebrow">Takipio Panel</span>
        <h1>{mode === "login" ? "Paneline giriş yap." : "Yeni hesap oluştur."}</h1>
        <p>Sipariş, stok, müşteri, pazaryeri ve QR etiket sistemini tek panelden yönet.</p>

        <div className="switch">
          <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>Giriş</button>
          <button className={mode === "register" ? "active" : ""} type="button" onClick={() => setMode("register")}>Kayıt</button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>E-posta<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@firma.com" /></label>
          <label>Şifre<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></label>
          {message && <div className="message">{message}</div>}
          <button className="submit" disabled={loading}>{loading ? "İşleniyor..." : mode === "login" ? "Panele giriş yap" : "Hesap oluştur"}</button>
        </form>

        <a className="back" href="/">← Bekleme sayfasına dön</a>
      </section>

      <style jsx global>{`
        *{box-sizing:border-box} body{margin:0;background:#f4f8ff;font-family:Inter,system-ui,sans-serif}
        .loginPage{min-height:100svh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 15% 0%,rgba(11,99,255,.14),transparent 30%),linear-gradient(180deg,#fff,#eef6ff)}
        .loginCard{width:min(460px,100%);padding:30px;border-radius:34px;background:rgba(255,255,255,.88);border:1px solid rgba(11,99,255,.14);box-shadow:0 28px 80px rgba(16,24,40,.12)}
        .brand{width:176px;height:58px;display:grid;place-items:center;border-radius:22px;background:#06101f;margin-bottom:24px}.brand img{width:145px;height:40px;object-fit:contain}
        .eyebrow{display:inline-flex;padding:8px 12px;border-radius:999px;background:#e0f2fe;color:#075985;font-size:11px;font-weight:950;text-transform:uppercase}
        h1{margin:18px 0 10px;color:#06101f;font-size:38px;line-height:1;letter-spacing:-1.8px}p{margin:0 0 22px;color:#667085;line-height:1.6;font-weight:650}
        .switch{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:7px;border-radius:20px;background:#eef4ff;margin-bottom:18px}
        .switch button{height:42px;border:0;border-radius:15px;background:transparent;color:#667085;font-weight:900}.switch .active{color:#fff;background:linear-gradient(135deg,#0b63ff,#22d3ee)}
        form{display:grid;gap:14px}label{display:grid;gap:8px;color:#344054;font-size:13px;font-weight:900}
        input{height:56px;border-radius:18px;border:1px solid rgba(11,99,255,.14);padding:0 16px;outline:none;color:#06101f;font-weight:700}
        input:focus{border-color:rgba(11,99,255,.38);box-shadow:0 0 0 5px rgba(11,99,255,.08)}
        .message{padding:12px 14px;border-radius:15px;color:#075985;background:#e0f2fe;font-size:13px;font-weight:800}
        .submit{height:58px;border:0;border-radius:18px;color:white;background:linear-gradient(135deg,#0b63ff,#22d3ee);font-weight:950}
        .back{display:inline-flex;margin-top:18px;color:#667085;font-size:13px;font-weight:850;text-decoration:none}
        @media(max-width:520px){.loginPage{padding:14px}.loginCard{padding:22px;border-radius:28px}h1{font-size:32px}}
      `}</style>
    </main>
  );
}
