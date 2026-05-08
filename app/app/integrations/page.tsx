"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Order = {
  id: string;
  order_no: string;
  marketplace: string | null;
  total_amount: number | null;
  order_status: string | null;
  shipping_status: string | null;
  created_at: string;
};

type ReturnItem = {
  id: string;
  marketplace: string | null;
  amount: number | null;
  status: string | null;
  created_at: string;
};

const channels = [
  { key: "trendyol", name: "Trendyol", logo: "/trendyol.png" },
  { key: "hepsiburada", name: "Hepsiburada", logo: "/hepsiburada.png" },
  { key: "amazon", name: "Amazon", logo: "/amazon.png" },
  { key: "ciceksepeti", name: "ÇiçekSepeti", logo: "/ciceksepeti.png" },
];

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function isToday(date: string) {
  const input = new Date(date);
  const now = new Date();
  return input.getFullYear() === now.getFullYear() && input.getMonth() === now.getMonth() && input.getDate() === now.getDate();
}

function isThisWeek(date: string) {
  const input = new Date(date);
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);
  return input >= start;
}

export default function IntegrationsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);

    const [ordersResult, returnsResult] = await Promise.all([
      supabase.from("orders").select("id, order_no, marketplace, total_amount, order_status, shipping_status, created_at").order("created_at", { ascending: false }),
      supabase.from("returns").select("id, marketplace, amount, status, created_at").order("created_at", { ascending: false }),
    ]);

    setOrders(ordersResult.data ?? []);
    setReturns(returnsResult.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    return channels.map((channel) => {
      const channelOrders = orders.filter((order) => order.marketplace === channel.key);
      const todayOrders = channelOrders.filter((order) => isToday(order.created_at));
      const weekOrders = channelOrders.filter((order) => isThisWeek(order.created_at));
      const channelReturns = returns.filter((item) => item.marketplace === channel.key);

      const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0);
      const weekRevenue = weekOrders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0);
      const totalRevenue = channelOrders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0);
      const waitingShipment = channelOrders.filter((order) => order.shipping_status !== "shipped" && order.shipping_status !== "delivered").length;
      const returnAmount = channelReturns.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);

      return {
        ...channel,
        todayOrders: todayOrders.length,
        weekOrders: weekOrders.length,
        todayRevenue,
        weekRevenue,
        totalRevenue,
        waitingShipment,
        returns: channelReturns.length,
        returnAmount,
      };
    });
  }, [orders, returns]);

  const bestChannel = [...stats].sort((a, b) => b.weekRevenue - a.weekRevenue)[0];
  const mostReturns = [...stats].sort((a, b) => b.returns - a.returns)[0];
  const mostWaitingShipment = [...stats].sort((a, b) => b.waitingShipment - a.waitingShipment)[0];

  const totalWeekRevenue = stats.reduce((sum, item) => sum + item.weekRevenue, 0);
  const totalTodayRevenue = stats.reduce((sum, item) => sum + item.todayRevenue, 0);
  const totalReturns = stats.reduce((sum, item) => sum + item.returns, 0);
  const totalWaitingShipment = stats.reduce((sum, item) => sum + item.waitingShipment, 0);

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Marketplace Intelligence
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">
              Entegrasyonlar
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Trendyol, Hepsiburada, Amazon ve ÇiçekSepeti satış, kargo ve iade karşılaştırması.
            </p>
          </div>

          <button onClick={fetchData} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500">
            Yenile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Bugünkü Ciro" value={loading ? "..." : formatCurrency(totalTodayRevenue)} valueClass="text-blue-300" />
        <Metric label="Haftalık Ciro" value={loading ? "..." : formatCurrency(totalWeekRevenue)} valueClass="text-emerald-300" />
        <Metric label="İade Talebi" value={String(totalReturns)} valueClass="text-amber-300" />
        <Metric label="Kargo Bekleyen" value={String(totalWaitingShipment)} valueClass="text-red-300" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.key} className="overflow-hidden rounded-[24px] border border-white/10 bg-[#111a2e] transition hover:-translate-y-1 hover:bg-[#17233b]">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-2">
                  <img src={item.logo} alt={item.name} className="h-full w-full object-contain" />
                </div>
                <div>
                  <h2 className="text-lg font-black">{item.name}</h2>
                  <p className="text-xs text-slate-500">Pazaryeri performansı</p>
                </div>
              </div>
              <span className="rounded-full bg-white/8 px-3 py-1 text-[10px] font-black text-slate-300">
                API Yakında
              </span>
            </div>

            <div className="grid gap-3 p-4">
              <SmallStat label="Bugünkü satış" value={`${item.todayOrders} sipariş`} sub={formatCurrency(item.todayRevenue)} />
              <SmallStat label="Bu hafta" value={`${item.weekOrders} sipariş`} sub={formatCurrency(item.weekRevenue)} />
              <SmallStat label="Kargo bekleyen" value={`${item.waitingShipment} sipariş`} sub="Operasyon kontrolü" />
              <SmallStat label="İadeler" value={`${item.returns} talep`} sub={formatCurrency(item.returnAmount)} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <h2 className="text-2xl font-black">Pazaryeri Karşılaştırması</h2>
          <p className="mt-1 text-sm text-slate-400">
            API bağlanınca bu alan pazaryerlerinden gelen gerçek sipariş ve iade verileriyle otomatik dolacak.
          </p>

          <div className="mt-5 space-y-3">
            {stats.map((item) => {
              const percentage = totalWeekRevenue > 0 ? Math.round((item.weekRevenue / totalWeekRevenue) * 100) : 0;

              return (
                <div key={item.key} className="rounded-[18px] bg-[#0b1220] p-4 ring-1 ring-white/10">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-black">{item.name}</p>
                    <p className="text-sm font-black text-blue-300">{percentage}%</p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${percentage}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Bu hafta {formatCurrency(item.weekRevenue)} · Bugün {formatCurrency(item.todayRevenue)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <h2 className="text-2xl font-black">Otomatik Yorumlar</h2>

          <div className="mt-5 space-y-3">
            <Insight title="Bu hafta en güçlü kanal" value={bestChannel ? `${bestChannel.name} - ${formatCurrency(bestChannel.weekRevenue)}` : "-"} />
            <Insight title="En fazla iade gelen kanal" value={mostReturns ? `${mostReturns.name} - ${mostReturns.returns} talep` : "-"} />
            <Insight title="Kargo çıkışı en çok bekleyen" value={mostWaitingShipment ? `${mostWaitingShipment.name} - ${mostWaitingShipment.waitingShipment} sipariş` : "-"} />
            <Insight title="API bağlantı planı" value="Önce Trendyol, sonra Hepsiburada, Amazon ve ÇiçekSepeti." />
          </div>
        </div>
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

function SmallStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[16px] bg-[#0b1220] p-3 ring-1 ring-white/10">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

function Insight({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[#0b1220] p-4 ring-1 ring-white/10">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{title}</p>
      <p className="mt-2 text-sm font-black text-slate-200">{value}</p>
    </div>
  );
}
