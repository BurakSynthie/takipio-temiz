
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

  const totalIn = movements
    .filter((item) => item.movement_type === "stock_in")
    .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const totalOut = movements
    .filter((item) => item.movement_type === "stock_out")
    .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-5 pb-10">
      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
              Takipio Stock
            </div>

            <h1 className="text-[34px] font-black tracking-[-0.05em] text-slate-950 sm:text-5xl">
              Stok Hareketleri
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Products ekranındaki tüm + / - hareketleri burada otomatik kaydedilir.
            </p>
          </div>

          <button
            onClick={fetchMovements}
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-600"
          >
            Yenile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            Toplam Hareket
          </p>

          <p className="mt-3 text-3xl font-black text-slate-950">
            {movements.length}
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            Stok Girişi
          </p>

          <p className="mt-3 text-3xl font-black text-emerald-600">
            +{totalIn}
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            Stok Çıkışı
          </p>

          <p className="mt-3 text-3xl font-black text-red-600">
            -{totalOut}
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            Son Güncelleme
          </p>

          <p className="mt-3 text-lg font-black text-slate-950">
            {movements[0]
              ? formatDate(movements[0].created_at)
              : "-"}
          </p>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              Hareket Geçmişi
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Tüm stok giriş ve çıkış kayıtları.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ürün ara..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 sm:w-[240px]"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">Tüm Hareketler</option>
              <option value="in">Stok Girişi</option>
              <option value="out">Stok Çıkışı</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-[24px] bg-slate-100"
              />
            ))}
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
            <h3 className="text-xl font-black text-slate-950">
              Hareket bulunamadı
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Products sayfasında stok değiştirince burada gözükecek.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredMovements.map((item) => {
              const isIn = item.movement_type === "stock_in";

              return (
                <div
                  key={item.id}
                  className="rounded-[26px] border border-slate-100 bg-slate-50 p-4 transition hover:bg-blue-50/60"
                >
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-black text-slate-950">
                          {item.product_name}
                        </h3>

                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500">
                          {item.product_code}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        {item.note}
                      </p>

                      <p className="mt-2 text-xs font-bold text-slate-400">
                        {formatDate(item.created_at)}
                      </p>
                    </div>

                    <div>
                      <span
                        className={[
                          "rounded-full px-4 py-2 text-xs font-black",
                          isIn
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-600",
                        ].join(" ")}
                      >
                        {isIn ? "Stok Girişi" : "Stok Çıkışı"}
                      </span>
                    </div>

                    <div>
                      <p
                        className={[
                          "text-3xl font-black",
                          isIn
                            ? "text-emerald-600"
                            : "text-red-600",
                        ].join(" ")}
                      >
                        {isIn ? "+" : "-"}
                        {item.quantity}
                      </p>
                    </div>

                    <div>
                      <button className="rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:bg-blue-600">
                        Detay
                      </button>
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
