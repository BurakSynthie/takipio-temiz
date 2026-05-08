"use client";

import { useEffect, useState } from "react";

type CompanySettings = {
  companyName: string;
  email: string;
  phone: string;
  taxOffice: string;
  taxNumber: string;
  address: string;
};

const defaultSettings: CompanySettings = {
  companyName: "Takipio",
  email: "takipioinfo@gmail.com",
  phone: "0531 723 48 01",
  taxOffice: "",
  taxNumber: "",
  address: "",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("takipio_company_settings");
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  function saveSettings() {
    localStorage.setItem("takipio_company_settings", JSON.stringify(settings));
    setMessage("Firma bilgileri kaydedildi.");
  }

  return (
    <section className="mx-auto w-full max-w-[1100px] space-y-3 text-white">
      <Header title="Ayarlar" desc="Firma bilgileri, iletişim ve panel tercihleri." />

      {message ? <div className="rounded-2xl bg-emerald-400/15 px-4 py-3 text-sm font-black text-emerald-300">{message}</div> : null}

      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
          <h2 className="text-lg font-black">Firma Bilgileri</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Firma Adı" value={settings.companyName} onChange={(v) => setSettings({ ...settings, companyName: v })} />
            <Field label="E-posta" value={settings.email} onChange={(v) => setSettings({ ...settings, email: v })} />
            <Field label="Telefon" value={settings.phone} onChange={(v) => setSettings({ ...settings, phone: v })} />
            <Field label="Vergi Dairesi" value={settings.taxOffice} onChange={(v) => setSettings({ ...settings, taxOffice: v })} />
            <Field label="Vergi No" value={settings.taxNumber} onChange={(v) => setSettings({ ...settings, taxNumber: v })} />
            <Field label="Adres" value={settings.address} onChange={(v) => setSettings({ ...settings, address: v })} />
          </div>

          <button onClick={saveSettings} className="mt-4 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black">Kaydet</button>
        </div>

        <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
          <h2 className="text-lg font-black">Panel Tercihleri</h2>
          <div className="mt-4 space-y-3">
            <Toggle title="Bildirimleri Aç" desc="Stok ve ödeme uyarıları" />
            <Toggle title="Kompakt Mod" desc="Dashboard yoğun görünüm" />
            <Toggle title="Gorki Önerileri" desc="AI öneri kartları" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Header({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
      <h1 className="text-2xl font-black">{title}</h1>
      <p className="mt-1 text-sm text-slate-400">{desc}</p>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-black text-slate-400">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
    </label>
  );
}

function Toggle({ title, desc }: { title: string; desc: string }) {
  const [on, setOn] = useState(true);
  return (
    <button onClick={() => setOn(!on)} className="flex w-full items-center justify-between rounded-2xl bg-[#0b1220] p-3 text-left">
      <div>
        <p className="text-sm font-black">{title}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <span className={`h-6 w-11 rounded-full p-1 ${on ? "bg-blue-600" : "bg-white/10"}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition ${on ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}
