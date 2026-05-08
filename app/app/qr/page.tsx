"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Product = {
  id: string;
  name: string;
  product_code: string;
  category: string | null;
  qr_code: string | null;
};

function createQrTarget(productCode: string) {
  if (typeof window === "undefined") return `takipio://product/${productCode}`;
  return `${window.location.origin}/app/products?code=${encodeURIComponent(productCode)}`;
}

function createQrImageUrl(productCode: string, size = 300) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(createQrTarget(productCode))}`;
}

export default function QrPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function fetchProducts() {
    setLoading(true);
    const { data } = await supabase.from("products").select("id, name, product_code, category, qr_code").order("created_at", { ascending: false });
    setProducts(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.product_code.toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q));
  }, [products, search]);

  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;

  function printSelected() {
    if (!selected) return;
    const qrUrl = createQrImageUrl(selected.product_code, 420);
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`
      <html>
        <body style="font-family:Arial,sans-serif;padding:30px;text-align:center;">
          <h2>${selected.name}</h2>
          <p>${selected.product_code}</p>
          <img src="${qrUrl}" style="width:320px;height:320px;" />
          <script>window.onload=()=>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">Takipio QR</div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">QR / Barkod</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Ürünlerin QR kodlarını görüntüle, seç, yazdır ve bağlantısını kontrol et.</p>
          </div>
          <button onClick={fetchProducts} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500">Yenile</button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black">Ürün Listesi</h2>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="QR ürünü ara..." className="w-[220px] rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none placeholder:text-slate-500" />
          </div>

          {loading ? (
            <div className="grid gap-3">{[1,2,3].map((i) => <div key={i} className="h-16 animate-pulse rounded-[18px] bg-white/5" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0b1220] p-10 text-center">
              <h3 className="text-xl font-black">Ürün bulunamadı</h3>
              <p className="mt-2 text-sm text-slate-500">Önce ürün eklediğinde QR burada listelenecek.</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {filtered.map((product) => (
                <button key={product.id} onClick={() => setSelectedId(product.id)} className={["rounded-[18px] border p-4 text-left transition", selected?.id === product.id ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-[#0b1220] hover:bg-[#101a31]"].join(" ")}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black">{product.name}</p>
                    <span className="rounded-full bg-white/8 px-2 py-1 text-[10px] font-black text-slate-400">{product.product_code}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{product.category || "Kategori yok"}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <h2 className="text-2xl font-black">QR Önizleme</h2>
          {!selected ? (
            <div className="mt-4 rounded-[24px] border border-dashed border-white/10 bg-[#0b1220] p-10 text-center">
              <p className="text-sm text-slate-500">Soldan bir ürün seç.</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-5 lg:grid-cols-[320px_1fr] lg:items-center">
              <div className="rounded-[24px] bg-white p-4 shadow-inner">
                <img src={createQrImageUrl(selected.product_code, 500)} alt={`${selected.name} QR`} className="mx-auto h-[280px] w-[280px]" />
              </div>
              <div>
                <p className="text-2xl font-black">{selected.name}</p>
                <p className="mt-2 inline-flex rounded-full bg-white/8 px-3 py-1 text-xs font-black text-slate-300">{selected.product_code}</p>
                <p className="mt-4 break-all text-sm leading-6 text-blue-300">{createQrTarget(selected.product_code)}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <a href={createQrImageUrl(selected.product_code, 900)} download={`${selected.product_code}-qr.png`} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-500">
                    PNG İndir
                  </a>
                  <button onClick={printSelected} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-slate-200">Yazdır</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
