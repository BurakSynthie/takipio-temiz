"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Invoice = {
  id: string;
  invoice_no: string | null;
  customer_name: string | null;
  amount: number | null;
  status: string | null;
  due_date: string | null;
  note: string | null;
  created_at: string;
};

const empty = { invoice_no: "", customer_name: "", amount: "", status: "draft", due_date: "", note: "" };

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function fetchInvoices() {
    const { data } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
    setInvoices(data ?? []);
  }

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function saveInvoice(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      invoice_no: form.invoice_no.trim() || null,
      customer_name: form.customer_name.trim() || null,
      amount: Number(form.amount || 0),
      status: form.status,
      due_date: form.due_date || null,
      note: form.note.trim() || null,
    };

    if (editingId) await supabase.from("invoices").update(payload).eq("id", editingId);
    else await supabase.from("invoices").insert(payload);

    setForm(empty);
    setEditingId(null);
    setOpen(false);
    await fetchInvoices();
  }

  function edit(invoice: Invoice) {
    setEditingId(invoice.id);
    setForm({
      invoice_no: invoice.invoice_no ?? "",
      customer_name: invoice.customer_name ?? "",
      amount: String(invoice.amount ?? ""),
      status: invoice.status ?? "draft",
      due_date: invoice.due_date ?? "",
      note: invoice.note ?? "",
    });
    setOpen(true);
  }

  async function remove(id: string) {
    if (!confirm("Fatura silinsin mi?")) return;
    await supabase.from("invoices").delete().eq("id", id);
    await fetchInvoices();
  }

  return (
    <section className="mx-auto w-full max-w-[1300px] space-y-3 text-white">
      <div className="flex items-center justify-between rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
        <div>
          <h1 className="text-2xl font-black">Faturalar</h1>
          <p className="mt-1 text-sm text-slate-400">Fatura ekle, düzenle ve sil.</p>
        </div>
        <button onClick={() => setOpen(!open)} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black">Yeni Fatura</button>
      </div>

      {open ? (
        <form onSubmit={saveInvoice} className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Input label="Fatura No" value={form.invoice_no} onChange={(v) => setForm({ ...form, invoice_no: v })} />
            <Input label="Müşteri" value={form.customer_name} onChange={(v) => setForm({ ...form, customer_name: v })} />
            <Input label="Tutar" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} type="number" />
            <label>
              <span className="mb-1.5 block text-xs font-black text-slate-400">Durum</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                <option value="draft">Taslak</option>
                <option value="sent">Gönderildi</option>
                <option value="paid">Ödendi</option>
                <option value="late">Gecikti</option>
              </select>
            </label>
            <Input label="Vade Tarihi" value={form.due_date} onChange={(v) => setForm({ ...form, due_date: v })} type="date" />
            <Input label="Not" value={form.note} onChange={(v) => setForm({ ...form, note: v })} />
          </div>
          <button className="mt-4 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black">{editingId ? "Güncelle" : "Kaydet"}</button>
        </form>
      ) : null}

      <div className="grid gap-2">
        {invoices.length === 0 ? <Empty text="Fatura yok" /> : invoices.map((invoice) => (
          <div key={invoice.id} className="rounded-[18px] border border-white/10 bg-[#111a2e] p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-black">{invoice.invoice_no || "Fatura No Yok"} · {invoice.customer_name || "Müşteri yok"}</p>
                <p className="mt-1 text-xs text-slate-400">{formatCurrency(invoice.amount)} · {invoice.status} · Vade: {invoice.due_date || "-"}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => edit(invoice)} className="rounded-xl bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">Düzenle</button>
                <button onClick={() => remove(invoice.id)} className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-black text-red-300">Sil</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-black text-slate-400">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
    </label>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-[20px] border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">{text}</div>;
}
