"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Customer = {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  note: string | null;
  created_at: string;
};

const empty = { name: "", company: "", phone: "", email: "", city: "", note: "" };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function fetchCustomers() {
    const { data } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
    setCustomers(data ?? []);
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function saveCustomer(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      company: form.company.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      city: form.city.trim() || null,
      note: form.note.trim() || null,
    };

    if (!payload.name) return;

    if (editingId) {
      await supabase.from("customers").update(payload).eq("id", editingId);
    } else {
      await supabase.from("customers").insert(payload);
    }

    setForm(empty);
    setEditingId(null);
    setOpen(false);
    await fetchCustomers();
  }

  function edit(customer: Customer) {
    setEditingId(customer.id);
    setForm({
      name: customer.name ?? "",
      company: customer.company ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      city: customer.city ?? "",
      note: customer.note ?? "",
    });
    setOpen(true);
  }

  async function remove(id: string) {
    if (!confirm("Müşteri silinsin mi?")) return;
    await supabase.from("customers").delete().eq("id", id);
    await fetchCustomers();
  }

  return (
    <section className="mx-auto w-full max-w-[1300px] space-y-3 text-white">
      <div className="flex items-center justify-between rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
        <div>
          <h1 className="text-2xl font-black">Müşteriler</h1>
          <p className="mt-1 text-sm text-slate-400">Müşteri ekle, düzenle ve sil.</p>
        </div>
        <button onClick={() => setOpen(!open)} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black">Yeni Müşteri</button>
      </div>

      {open ? (
        <form onSubmit={saveCustomer} className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Input label="Ad Soyad" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Input label="Firma" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
            <Input label="Telefon" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Input label="E-posta" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Input label="Şehir" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
            <Input label="Not" value={form.note} onChange={(v) => setForm({ ...form, note: v })} />
          </div>
          <button className="mt-4 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black">{editingId ? "Güncelle" : "Kaydet"}</button>
        </form>
      ) : null}

      <div className="grid gap-2">
        {customers.length === 0 ? <Empty text="Müşteri yok" /> : customers.map((customer) => (
          <div key={customer.id} className="rounded-[18px] border border-white/10 bg-[#111a2e] p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-black">{customer.name}</p>
                <p className="mt-1 text-xs text-slate-400">{customer.company || "Firma yok"} · {customer.phone || "Telefon yok"} · {customer.email || "E-posta yok"}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => edit(customer)} className="rounded-xl bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">Düzenle</button>
                <button onClick={() => remove(customer.id)} className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-black text-red-300">Sil</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-black text-slate-400">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
    </label>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-[20px] border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">{text}</div>;
}
