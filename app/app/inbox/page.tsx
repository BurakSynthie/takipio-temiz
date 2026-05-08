"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type InboxMessage = {
  id: string;
  sender: string | null;
  title: string;
  body: string | null;
  is_read: boolean | null;
  created_at: string;
};

const emptyForm = {
  sender: "Sistem",
  title: "",
  body: "",
};

export default function InboxPage() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);

  async function fetchMessages() {
    const { data } = await supabase
      .from("app_messages")
      .select("*")
      .order("created_at", { ascending: false });

    setMessages(data ?? []);
  }

  useEffect(() => {
    fetchMessages();
  }, []);

  async function addMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) return;

    await supabase.from("app_messages").insert({
      sender: form.sender.trim() || "Sistem",
      title: form.title.trim(),
      body: form.body.trim() || null,
    });

    setForm(emptyForm);
    setOpen(false);
    await fetchMessages();
  }

  async function toggleRead(message: InboxMessage) {
    await supabase
      .from("app_messages")
      .update({ is_read: !message.is_read })
      .eq("id", message.id);

    await fetchMessages();
  }

  async function deleteMessage(id: string) {
    await supabase.from("app_messages").delete().eq("id", id);
    await fetchMessages();
  }

  return (
    <section className="mx-auto w-full max-w-[1200px] space-y-3 text-white">
      <div className="flex items-center justify-between rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
        <div>
          <h1 className="text-2xl font-black">Mesaj Kutusu</h1>
          <p className="mt-1 text-sm text-slate-400">Mesaj ekle, okundu yap veya kalıcı olarak sil.</p>
        </div>

        <button onClick={() => setOpen((value) => !value)} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black">
          Yeni Mesaj
        </button>
      </div>

      {open ? (
        <form onSubmit={addMessage} className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
          <h2 className="text-lg font-black">Yeni Mesaj</h2>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              value={form.sender}
              onChange={(event) => setForm({ ...form, sender: event.target.value })}
              placeholder="Gönderen"
              className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none"
            />

            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Başlık"
              className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none"
            />

            <input
              value={form.body}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
              placeholder="Mesaj"
              className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none"
            />
          </div>

          <button className="mt-4 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black">Mesaj Ekle</button>
        </form>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {messages.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">Mesaj yok.</div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`rounded-[20px] border border-white/10 bg-[#111a2e] p-4 ${message.is_read ? "opacity-55" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-blue-400/15 px-3 py-1 text-xs font-black text-blue-300">
                  {message.sender || "Sistem"}
                </span>

                <button onClick={() => deleteMessage(message.id)} className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-black text-red-300">
                  Sil
                </button>
              </div>

              <h2 className="mt-4 text-lg font-black">{message.title}</h2>
              <p className="mt-2 text-sm text-slate-400">{message.body || "Açıklama yok"}</p>

              <button onClick={() => toggleRead(message)} className="mt-4 rounded-2xl bg-white/10 px-4 py-2 text-xs font-black">
                {message.is_read ? "Okunmadı Yap" : "Okundu Yap"}
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
