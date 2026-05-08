"use client";

import { useEffect, useState } from "react";
import { ensureBusinessForCurrentUser, supabase, type BusinessContext } from "../../../lib/business-core";

export default function BusinessSetupPage() {
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    website: "",
    tax_office: "",
    tax_number: "",
    address: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadBusiness() {
    try {
      setLoading(true);
      const ctx = await ensureBusinessForCurrentUser();

      setContext(ctx);
      setForm({
        name: ctx.business.name ?? "",
        phone: ctx.business.phone ?? "",
        email: ctx.business.email ?? "",
        website: ctx.business.website ?? "",
        tax_office: ctx.business.tax_office ?? "",
        tax_number: ctx.business.tax_number ?? "",
        address: ctx.business.address ?? "",
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "İşletme bilgisi alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBusiness();
  }, []);

  async function saveBusiness(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!context) return;

    const { error } = await supabase
      .from("businesses")
      .update({
        name: form.name.trim() || "İşletmem",
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        website: form.website.trim() || null,
        tax_office: form.tax_office.trim() || null,
        tax_number: form.tax_number.trim() || null,
        address: form.address.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", context.business.id);

    if (error) {
      setMessage(`Kaydedilemedi: ${error.message}`);
      return;
    }

    setMessage("İşletme bilgileri kaydedildi.");
    await loadBusiness();
  }

  return (
    <section className="mx-auto w-full max-w-[1100px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div>
          <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
            Business Core
          </div>
          <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">
            İşletme Kurulumu
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Takipio verileri artık işletme hesabına bağlanacak. Web ve mobil aynı işletme üzerinden çalışacak.
          </p>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-8 text-center text-sm text-slate-400">
          İşletme bilgileri hazırlanıyor...
        </div>
      ) : !context ? (
        <div className="rounded-[26px] border border-red-500/20 bg-red-500/10 p-8 text-center text-sm text-red-200">
          İşletme bağlantısı kurulamadı.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
          <form onSubmit={saveBusiness} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
            <h2 className="text-2xl font-black">İşletme Bilgileri</h2>
            <p className="mt-1 text-sm text-slate-400">
              Bu bilgiler ileride fatura, mobil uygulama, ödeme ve pazaryeri entegrasyonlarında kullanılacak.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Field label="İşletme Adı">
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
              </Field>

              <Field label="E-posta">
                <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
              </Field>

              <Field label="Telefon">
                <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
              </Field>

              <Field label="Web Sitesi">
                <input value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
              </Field>

              <Field label="Vergi Dairesi">
                <input value={form.tax_office} onChange={(event) => setForm((current) => ({ ...current, tax_office: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
              </Field>

              <Field label="Vergi No">
                <input value={form.tax_number} onChange={(event) => setForm((current) => ({ ...current, tax_number: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
              </Field>

              <div className="md:col-span-2">
                <Field label="Adres">
                  <textarea value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} className="min-h-28 w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
                </Field>
              </div>
            </div>

            <button className="mt-5 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">
              İşletmeyi Kaydet
            </button>
          </form>

          <div className="space-y-4">
            <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
              <h2 className="text-2xl font-black">Aktif İşletme</h2>
              <div className="mt-5 space-y-3">
                <Info label="İşletme ID" value={context.business.id} />
                <Info label="Owner" value={context.business.owner_email || "-"} />
                <Info label="Rol" value={context.member.role_name || "-"} />
                <Info label="Plan" value={context.subscription?.plan === "pro" ? "Pro" : "Free"} />
              </div>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
              <h2 className="text-2xl font-black">Sıradaki Bağlantı</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Bundan sonra ürün, sipariş, kargo, iade, ödeme ve fatura kayıtları bu işletme ID’siyle filtrelenecek.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-black text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#0b1220] p-4 ring-1 ring-white/10">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 break-all text-sm font-black text-slate-200">{value}</p>
    </div>
  );
}
