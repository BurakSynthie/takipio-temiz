"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Profile = {
  name: string;
  role: string;
  email: string;
  phone: string;
  avatar: string;
};

const defaultProfile: Profile = {
  name: "Burak",
  role: "Sahip",
  email: "takipioinfo@gmail.com",
  phone: "0531 723 48 01",
  avatar: "",
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("takipio_user_profile");
    if (saved) setProfile(JSON.parse(saved));
  }, []);

  function saveProfile(nextProfile = profile) {
    localStorage.setItem("takipio_user_profile", JSON.stringify(nextProfile));
    setMessage("Profil bilgileri kaydedildi.");
  }

  async function uploadAvatar(file: File) {
    setUploading(true);
    setMessage("");

    const extension = file.name.split(".").pop();
    const fileName = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    const { error } = await supabase.storage
      .from("takipio-uploads")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      setMessage(`Fotoğraf yüklenemedi: ${error.message}`);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("takipio-uploads").getPublicUrl(fileName);

    const nextProfile = {
      ...profile,
      avatar: data.publicUrl,
    };

    setProfile(nextProfile);
    saveProfile(nextProfile);
    setUploading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <section className="mx-auto w-full max-w-[1100px] space-y-3 text-white">
      <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
        <h1 className="text-2xl font-black">Kullanıcı Profili</h1>
        <p className="mt-1 text-sm text-slate-400">Bilgisayardan profil fotoğrafı yükle, bilgilerini düzenle ve çıkış yap.</p>
      </div>

      {message ? <div className="rounded-2xl bg-emerald-400/15 px-4 py-3 text-sm font-black text-emerald-300">{message}</div> : null}

      <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
        <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
          <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-[28px] bg-[#0b1220]">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Profil" className="h-full w-full object-cover" />
            ) : (
              <span className="text-4xl font-black">B</span>
            )}
          </div>

          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#0b1220] p-4 text-center transition hover:bg-[#111d31]">
            <span className="text-sm font-black">{uploading ? "Yükleniyor..." : "Bilgisayardan Fotoğraf Yükle"}</span>
            <span className="mt-1 text-xs text-slate-500">PNG, JPG veya WEBP</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadAvatar(file);
              }}
            />
          </label>

          <button onClick={logout} className="mt-4 w-full rounded-2xl bg-red-500/15 px-5 py-3 text-sm font-black text-red-300 ring-1 ring-red-400/20">
            Çıkış Yap
          </button>
        </div>

        <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
          <h2 className="text-lg font-black">Bilgiler</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Ad Soyad" value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} />
            <Field label="Rol" value={profile.role} onChange={(v) => setProfile({ ...profile, role: v })} />
            <Field label="E-posta" value={profile.email} onChange={(v) => setProfile({ ...profile, email: v })} />
            <Field label="Telefon" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} />
          </div>

          <button onClick={() => saveProfile()} className="mt-4 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black">Profili Kaydet</button>
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
