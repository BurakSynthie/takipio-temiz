"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type StockMovement = {
  id: string;
  product_id: string;
  product_code: string;
  product_name: string;
  movement_type: string;
  quantity: number;
  note: string;
  created_at: string;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default function StockPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  async function fetchMovements() {
    setLoading(true);

    const { data, error } = await supabase
      .from("stock_movements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setMovements(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchMovements();
  }, []);

  const filteredMovements = useMemo(() => {
    return movements.filter((item) => {
      const query = search.toLowerCase();
      const matchesSearch =
        item.product_name?.toLowerCase().includes(query) ||
        item.product_code?.toLowerCase().includes(query) ||
        item.note?.toLowerCase().includes(query);

      const matchesFilter =
        filter === "all"
          ? true
          : filter === "in"
          ? item.movement_type === "stock_in"
          : item.movement_type === "stock_out";

      return matchesSearch && matchesFilter;
    });
  }, [movements, search, filter]);

  const totalIn = movements.filter((item) => item.movement_type === "stock_in").reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalOut = movements.filter((item) => item.movement_type === "stock_out").reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Takipio Stock
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">Stok Hareketleri</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Ürünler ekranındaki tüm + / - hareketleri burada otomatik kaydedilir.
            </p>
          </div>

          <button onClick={fetchMovements} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500">
            Yenile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Toplam Hareket" value={String(movements.length)} valueClass="text-white" />
        <Metric label="Stok Girişi" value={`+${totalIn}`} valueClass="text-emerald-300" />
        <Metric label="Stok Çıkışı" value={`-${totalOut}`} valueClass="text-red-300" />
        <Metric label="Son Güncelleme" value={movements[0] ? formatDate(movements[0].created_at) : "-"} valueClass="text-blue-300 text-base" />
      </div>

      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black">Hareket Geçmişi</h2>
            <p className="mt-1 text-sm text-slate-400">Tüm stok giriş ve çıkış kayıtları.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ürün ara..." className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none placeholder:text-slate-500 sm:w-[240px]" />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
              <option value="all">Tüm Hareketler</option>
              <option value="in">Stok Girişi</option>
              <option value="out">Stok Çıkışı</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3">{[1,2,3].map((item) => <div key={item} className="h-24 animate-pulse rounded-[24px] bg-white/5" />)}</div>
        ) : filteredMovements.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0b1220] p-10 text-center">
            <h3 className="text-xl font-black">Hareket bulunamadı</h3>
            <p className="mt-2 text-sm text-slate-500">Ürünler sayfasında stok değiştirince burada gözükecek.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredMovements.map((item) => {
              const isIn = item.movement_type === "stock_in";

              return (
                <div key={item.id} className="rounded-[22px] border border-white/10 bg-[#0b1220] p-4 transition hover:bg-[#101a31]">
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-black">{item.product_name}</h3>
                        <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-black text-slate-400">{item.product_code}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">{item.note}</p>
                      <p className="mt-2 text-xs font-bold text-slate-500">{formatDate(item.created_at)}</p>
                    </div>

                    <div>
                      <span className={["rounded-full px-4 py-2 text-xs font-black", isIn ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"].join(" ")}>
                        {isIn ? "Stok Girişi" : "Stok Çıkışı"}
                      </span>
                    </div>

                    <div>
                      <p className={["text-3xl font-black", isIn ? "text-emerald-300" : "text-red-300"].join(" ")}>{isIn ? "+" : "-"}{item.quantity}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[#111a2e] p-5">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={["mt-3 text-3xl font-black", valueClass || "text-white"].join(" ")}>{value}</p>
    </div>
  );
}
