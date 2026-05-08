"use client";

import { useState } from "react";
import Link from "next/link";

const items = [
  { type: "Stok", title: "Kritik stok kontrolü", desc: "Minimum stok altına düşen ürünler için uyarı.", href: "/app/products", tone: "red" },
  { type: "Ödeme", title: "Bekleyen tahsilat", desc: "Ödenmemiş satışları kontrol et.", href: "/app/sales", tone: "amber" },
  { type: "Satış", title: "Satıştan stok düşme", desc: "Yeni satış oluşturulduğunda stok otomatik düşer.", href: "/app/sales", tone: "blue" },
  { type: "QR", title: "QR çıktı sistemi", desc: "Ürün kartlarından QR etiket yazdırabilirsin.", href: "/app/products", tone: "green" },
];

export default function NotificationsPage() {
  const [read, setRead] = useState<string[]>([]);

  return (
    <section className="mx-auto w-full max-w-[1100px] space-y-3 text-white">
      <div className="rounded-[20px] border border-white/10 bg-[#111a2e] p-4">
        <h1 className="text-2xl font-black">Bildirimler</h1>
        <p className="mt-1 text-sm text-slate-400">Uyarılara tıklayarak okundu yapabilir veya ilgili sayfaya gidebilirsin.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => {
          const isRead = read.includes(item.title);
          return (
            <div key={item.title} className={`rounded-[20px] border border-white/10 bg-[#111a2e] p-4 ${isRead ? "opacity-55" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-black ${item.tone === "red" ? "bg-red-400/15 text-red-300" : item.tone === "amber" ? "bg-amber-400/15 text-amber-300" : item.tone === "green" ? "bg-emerald-400/15 text-emerald-300" : "bg-blue-400/15 text-blue-300"}`}>
                  {item.type}
                </span>
                <button onClick={() => setRead((r) => [...r, item.title])} className="text-xs font-black text-slate-400">Okundu</button>
              </div>
              <h2 className="mt-4 text-lg font-black">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-400">{item.desc}</p>
              <Link href={item.href} className="mt-4 inline-flex rounded-2xl bg-blue-600 px-4 py-2 text-xs font-black">İlgili Sayfaya Git</Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
