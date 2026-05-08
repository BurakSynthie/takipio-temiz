"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type Message = {
  role: "gorki" | "user";
  text: string;
};

const starterMessages: Message[] = [
  {
    role: "gorki",
    text: "Selam Burak 👋 Ben Gorki. Şu an demo moddayım ama panel içinde sana stok, satış, fatura ve QR etiket tarafında yardımcı olacak şekilde tasarlanıyorum.",
  },
];

const quickPrompts = [
  "Bugün neye odaklanmalıyım?",
  "Stoklarda risk var mı?",
  "QR etiket sistemi ne işe yarar?",
  "Satışları nasıl artırırız?",
];

function createDemoReply(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("stok")) {
    return "Stok tarafında ilk bakacağım şey kritik seviyeye düşen ürünler olur. Mesela demo veride 7 ürün riskte görünüyor. Bunları ürün sayfası ve QR etiket akışıyla eşleştirebiliriz.";
  }

  if (lower.includes("qr") || lower.includes("barkod")) {
    return "QR sisteminde ürün adı üstte, QR kod ortada, küçük Takipio markası altta olacak. Telefon kamerasıyla okutunca ürün/stok/sipariş ekranına hızlı geçiş sağlayacağız.";
  }

  if (lower.includes("satış") || lower.includes("ciro")) {
    return "Satış tarafında önce bekleyen ödemeleri, sonra en çok satan ürünleri ve stok riski olan ürünleri birlikte okumak lazım. Böylece sadece ciro değil, operasyon sağlığı da görünür.";
  }

  if (lower.includes("fatura")) {
    return "Fatura ekranında taslak, kesildi, ödendi ve gecikti gibi durumları ayıracağız. Satış kaydıyla fatura eşleşirse panel çok daha profesyonel çalışır.";
  }

  return "Bunu not aldım. Şu an demo cevap veriyorum; sonraki aşamada OpenAI API bağlanınca gerçekten panel verilerini okuyup sana özel analiz çıkarabileceğim.";
}

export default function GorkiAIPage() {
  const [messages, setMessages] = useState<Message[]>(starterMessages);
  const [input, setInput] = useState("");

  const lastUserMessage = useMemo(() => {
    return [...messages].reverse().find((message) => message.role === "user")?.text ?? "";
  }, [messages]);

  function sendMessage(text?: string) {
    const cleanText = (text ?? input).trim();

    if (!cleanText) {
      return;
    }

    const userMessage: Message = {
      role: "user",
      text: cleanText,
    };

    const gorkiMessage: Message = {
      role: "gorki",
      text: createDemoReply(cleanText),
    };

    setMessages((current) => [...current, userMessage, gorkiMessage]);
    setInput("");
  }

  return (
    <section className="mx-auto grid w-full max-w-[1500px] gap-5 pb-8 xl:grid-cols-[0.82fr_1.18fr]">
      <div className="relative overflow-hidden rounded-[38px] bg-slate-950 p-5 text-white shadow-2xl shadow-blue-200/70 sm:p-7">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative">
          <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-blue-100">
            Gorki AI · Demo Chat
          </div>

          <h1 className="text-[34px] font-black leading-[0.95] tracking-[-0.055em] sm:text-5xl">
            Gorki ile konuş.
          </h1>

          <p className="mt-4 text-sm leading-6 text-slate-300">
            Şu an demo cevap sistemi çalışıyor. Bir sonraki aşamada OpenAI API bağlayıp gerçek işletme asistanına çevireceğiz.
          </p>

          <div className="relative mt-6 h-[360px] overflow-hidden rounded-[34px] bg-white/10 ring-1 ring-white/10 sm:h-[520px]">
            <Image
              src="/gorki-hero.png"
              alt="Gorki AI"
              fill
              className="object-contain object-bottom drop-shadow-2xl"
              priority
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-xs text-slate-300">Mod</p>
              <p className="mt-1 font-black">Demo</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-xs text-slate-300">Son konu</p>
              <p className="mt-1 truncate font-black">{lastUserMessage || "Hazır"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-[620px] flex-col rounded-[38px] border border-white/70 bg-white/90 p-4 shadow-xl shadow-blue-100/60 backdrop-blur-xl sm:p-5">
        <div className="mb-4 flex items-center gap-3 rounded-[28px] bg-slate-950 p-4 text-white">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white/10">
            <Image src="/gorki-hero.png" alt="Gorki" fill className="object-cover" />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-lg font-black">Gorki AI Asistan</h2>
            <p className="text-xs text-slate-300">Stok · Satış · Fatura · QR Etiket</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendMessage(prompt)}
              className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-600 hover:text-white"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto rounded-[30px] bg-slate-50 p-3 sm:p-4">
          {messages.map((message, index) => {
            const isUser = message.role === "user";

            return (
              <div key={`${message.role}-${index}`} className={["flex", isUser ? "justify-end" : "justify-start"].join(" ")}>
                <div
                  className={[
                    "max-w-[86%] rounded-[24px] px-4 py-3 text-sm leading-6 shadow-sm",
                    isUser
                      ? "bg-blue-600 text-white"
                      : "border border-slate-100 bg-white text-slate-700",
                  ].join(" ")}
                >
                  {message.text}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                sendMessage();
              }
            }}
            placeholder="Gorki’ye bir şey sor..."
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
          />

          <button
            type="button"
            onClick={() => sendMessage()}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
          >
            Gönder
          </button>
        </div>
      </div>
    </section>
  );
}
