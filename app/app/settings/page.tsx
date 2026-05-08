"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type TeamMember = {
  id: string;
  email: string;
  full_name: string | null;
  role_name: string | null;
  status: string | null;
  can_view_dashboard: boolean | null;
  can_manage_products: boolean | null;
  can_manage_stock: boolean | null;
  can_manage_sales: boolean | null;
  can_manage_invoices: boolean | null;
  can_manage_customers: boolean | null;
  can_manage_integrations: boolean | null;
  can_manage_settings: boolean | null;
};

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

const permissions = [
  ["can_view_dashboard", "Dashboard"],
  ["can_manage_products", "Ürünler"],
  ["can_manage_stock", "Stok"],
  ["can_manage_sales", "Satışlar"],
  ["can_manage_invoices", "Faturalar"],
  ["can_manage_customers", "Müşteriler"],
  ["can_manage_integrations", "Entegrasyonlar"],
  ["can_manage_settings", "Ayarlar"],
] as const;

const emptyMember = {
  email: "",
  full_name: "",
  role_name: "Çalışan",
  status: "active",
  can_view_dashboard: true,
  can_manage_products: false,
  can_manage_stock: false,
  can_manage_sales: false,
  can_manage_invoices: false,
  can_manage_customers: false,
  can_manage_integrations: false,
  can_manage_settings: false,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [memberForm, setMemberForm] = useState(emptyMember);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("takipio_company_settings");
    if (saved) setSettings(JSON.parse(saved));
    fetchTeam();
  }, []);

  async function fetchTeam() {
    const { data } = await supabase
      .from("app_team_members")
      .select("*")
      .order("created_at", { ascending: false });

    setTeam(data ?? []);
  }

  function saveSettings() {
    localStorage.setItem("takipio_company_settings", JSON.stringify(settings));
    setMessage("Firma bilgileri kaydedildi.");
  }

  async function saveMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      email: memberForm.email.trim(),
      full_name: memberForm.full_name.trim() || null,
      role_name: memberForm.role_name.trim() || "Çalışan",
      status: memberForm.status,
      can_view_dashboard: memberForm.can_view_dashboard,
      can_manage_products: memberForm.can_manage_products,
      can_manage_stock: memberForm.can_manage_stock,
      can_manage_sales: memberForm.can_manage_sales,
      can_manage_invoices: memberForm.can_manage_invoices,
      can_manage_customers: memberForm.can_manage_customers,
      can_manage_integrations: memberForm.can_manage_integrations,
      can_manage_settings: memberForm.can_manage_settings,
    };

    if (!payload.email) {
      setMessage("E-posta gerekli.");
      return;
    }

    if (editingId) {
      await supabase.from("app_team_members").update(payload).eq("id", editingId);
      setMessage("Ekip üyesi güncellendi.");
    } else {
      await supabase.from("app_team_members").insert(payload);
      setMessage("Ekip üyesi eklendi. Bu e-posta ile giriş yapan kişiye bu izinler uygulanacak.");
    }

    setMemberForm(emptyMember);
    setEditingId(null);
    await fetchTeam();
  }

  function editMember(member: TeamMember) {
    setEditingId(member.id);
    setMemberForm({
      email: member.email ?? "",
      full_name: member.full_name ?? "",
      role_name: member.role_name ?? "Çalışan",
      status: member.status ?? "active",
      can_view_dashboard: Boolean(member.can_view_dashboard),
      can_manage_products: Boolean(member.can_manage_products),
      can_manage_stock: Boolean(member.can_manage_stock),
      can_manage_sales: Boolean(member.can_manage_sales),
      can_manage_invoices: Boolean(member.can_manage_invoices),
      can_manage_customers: Boolean(member.can_manage_customers),
      can_manage_integrations: Boolean(member.can_manage_integrations),
      can_manage_settings: Boolean(member.can_manage_settings),
    });
  }

  async function deleteMember(id: string) {
    if (!confirm("Ekip üyesi silinsin mi?")) return;
    await supabase.from("app_team_members").delete().eq("id", id);
    await fetchTeam();
  }

  return (
    <section className="mx-auto w-full max-w-[1320px] space-y-3 text-white">
      <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
        <h1 className="text-2xl font-black">Ayarlar & Yetkiler</h1>
        <p className="mt-1 text-sm text-slate-400">
          Firma bilgileri, ekip üyeleri ve özel izinler. Yetkileri sabit rol mantığıyla değil, panel bazlı seçiyorsun.
        </p>
      </div>

      {message ? <div className="rounded-2xl bg-emerald-400/15 px-4 py-3 text-sm font-black text-emerald-300">{message}</div> : null}

      <div className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
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

          <button onClick={saveSettings} className="mt-4 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black">Firma Bilgilerini Kaydet</button>
        </div>

        <form onSubmit={saveMember} className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
          <h2 className="text-lg font-black">{editingId ? "Ekip Üyesi Düzenle" : "Ekip Üyesi Ekle"}</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Field label="E-posta" value={memberForm.email} onChange={(v) => setMemberForm({ ...memberForm, email: v })} />
            <Field label="Ad Soyad" value={memberForm.full_name} onChange={(v) => setMemberForm({ ...memberForm, full_name: v })} />
            <Field label="Rol Adı" value={memberForm.role_name} onChange={(v) => setMemberForm({ ...memberForm, role_name: v })} />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {permissions.map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-2 rounded-2xl bg-[#0b1220] p-3 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={Boolean(memberForm[key])}
                  onChange={(e) => setMemberForm({ ...memberForm, [key]: e.target.checked })}
                />
                {label}
              </label>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black">{editingId ? "Yetkiyi Güncelle" : "Kişiyi Ekle"}</button>
            {editingId ? (
              <button type="button" onClick={() => { setEditingId(null); setMemberForm(emptyMember); }} className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black">
                İptal
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
        <h2 className="text-lg font-black">Ekip Listesi</h2>

        <div className="mt-4 grid gap-2">
          {team.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">Ekip üyesi yok.</div>
          ) : (
            team.map((member) => (
              <div key={member.id} className="rounded-2xl bg-[#0b1220] p-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-black">{member.full_name || member.email}</p>
                    <p className="mt-1 text-xs text-slate-500">{member.email} · {member.role_name}</p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {permissions.filter(([key]) => Boolean(member[key])).map(([, label]) => (
                      <span key={label} className="rounded-full bg-blue-500/15 px-2 py-1 text-[10px] font-black text-blue-300">{label}</span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => editMember(member)} className="rounded-xl bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">Düzenle</button>
                    <button onClick={() => deleteMember(member.id)} className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-black text-red-300">Sil</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
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
