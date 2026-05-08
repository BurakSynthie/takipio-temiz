"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type ReturnItem = {
  id: string;
  return_no: string;
  order_id: string | null;
  order_no: string | null;
  marketplace: string | null;
  customer_name: string | null;
  product_name: string | null;
  reason: string | null;
  status: string | null;
  amount: number | null;
  note: string | null;
  created_at: string;
};

type Order = {
  id: string;
  order_no: string;
  marketplace: string | null;
  customer_name: string | null;
  total_amount: number | null;
};

type ReturnForm = {
  order_id: string;
  product_name: string;
  reason: string;
  status: string;
  amount: string;
  note: string;
};

const emptyForm: ReturnForm = {
  order_id: "",
  product_name: "",
  reason: "",
  status: "requested",
  amount: "",
  note: "",
};

const returnStatuses = [
  { value: "requested", label: "Talep Geldi" },
  { value: "reviewing", label: "İnceleniyor" },
  { value: "approved", label: "Onaylandı" },
  { value: "rejected", label: "Reddedildi" },
  { value: "received", label: "Ürün Geri Geldi" },
  { value: "refunded", label: "Para İadesi Yapıldı" },
];

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function marketplaceLabel(value: string | null | undefined) {
  if (value === "trendyol") return "Trendyol";
  if (value === "hepsiburada") return "Hepsiburada";
  if (value === "amazon") return "Amazon";
  if (value === "ciceksepeti") return "ÇiçekSepeti";
  return "Manuel";
}

function statusLabel(value: string | null | undefined) {
  return returnStatuses.find((item) => item.value === value)?.label ?? "Talep Geldi";
}

function statusClass(value: string | null | undefined) {
  if (value === "refunded") return "bg-emerald-400/15 text-emerald-300";
  if (value === "approved" || value === "received") return "bg-blue-400/15 text-blue-300";
  if (value === "rejected") return "bg-red-400/15 text-red-300";
  if (value === "reviewing") return "bg-violet-400/15 text-violet-300";
  return "bg-amber-400/15 text-amber-300";
}

function createReturnNo() {
  return `RET-${Date.now().toString().slice(-8)}`;
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState<ReturnForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const selectedOrder = useMemo(() => {
    return orders.find((order) => order.id === form.order_id) ?? null;
  }, [orders, form.order_id]);

  const filteredReturns = useMemo(() => {
    const query = search.trim().toLowerCase();

    return returns.filter((item) => {
      const matchesSearch =
        !query ||
        item.return_no.toLowerCase().includes(query) ||
        (item.order_no ?? "").toLowerCase().includes(query) ||
        (item.customer_name ?? "").toLowerCase().includes(query) ||
        (item.product_name ?? "").toLowerCase().includes(query);

      const matchesStatus = statusFilter === "all" ? true : item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [returns, search, statusFilter]);

  const requestedCount = returns.filter((item) => item.status === "requested").length;
  const reviewingCount = returns.filter((item) => item.status === "reviewing").length;
  const approvedCount = returns.filter((item) => item.status === "approved" || item.status === "received").length;
  const refundedAmount = returns.filter((item) => item.status === "refunded").reduce((sum, item) => sum + Number(item.amount ?? 0), 0);

  async function fetchData() {
    setLoading(true);

    const [returnsResult, ordersResult] = await Promise.all([
      supabase.from("returns").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("id, order_no, marketplace, customer_name, total_amount").order("created_at", { ascending: false }),
    ]);

    setReturns(returnsResult.data ?? []);
    setOrders(ordersResult.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  function selectOrder(orderId: string) {
    const order = orders.find((item) => item.id === orderId);

    setForm((current) => ({
      ...current,
      order_id: orderId,
      amount: order?.total_amount ? String(order.total_amount) : current.amount,
    }));
  }

  async function createReturn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const order = selectedOrder;
    const amount = Number(form.amount || 0);

    await supabase.from("returns").insert({
      return_no: createReturnNo(),
      order_id: order?.id ?? null,
      order_no: order?.order_no ?? null,
      marketplace: order?.marketplace ?? "manual",
      customer_name: order?.customer_name ?? null,
      product_name: form.product_name.trim() || null,
      reason: form.reason.trim() || null,
      status: form.status,
      amount,
      note: form.note.trim() || null,
    });

    if (order?.id) {
      await supabase.from("orders").update({ order_status: "return_requested" }).eq("id", order.id);
    }

    setMessage("İade kaydı oluşturuldu.");
    setForm(emptyForm);
    setFormOpen(false);
    await fetchData();
  }

  async function updateStatus(item: ReturnItem, status: string) {
    await supabase.from("returns").update({ status }).eq("id", item.id);
    setMessage(`${item.return_no} durumu güncellendi.`);
    await fetchData();
  }

  async function deleteReturn(id: string) {
    if (!confirm("İade kaydı silinsin mi?")) return;

    await supabase.from("returns").delete().eq("id", id);
    setMessage("İade kaydı silindi.");
    await fetchData();
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Takipio Returns
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">
              İadeler
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              İade talebi, inceleme, onay, red, ürün dönüşü ve para iadesi akışını takip et.
            </p>
          </div>

          <button onClick={() => setFormOpen((value) => !value)} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500">
            {formOpen ? "Formu Kapat" : "Yeni İade"}
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Talep Geldi" value={String(requestedCount)} valueClass="text-amber-300" />
        <Metric label="İnceleniyor" value={String(reviewingCount)} valueClass="text-violet-300" />
        <Metric label="Onay / Ürün Dönüş" value={String(approvedCount)} valueClass="text-blue-300" />
        <Metric label="İade Tutarı" value={formatCurrency(refundedAmount)} valueClass="text-emerald-300" />
      </div>

      {formOpen ? (
        <form onSubmit={createReturn} className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="mb-5">
            <h2 className="text-2xl font-black">Yeni İade Kaydı</h2>
            <p className="mt-1 text-sm text-slate-400">Siparişe bağlı veya manuel iade kaydı oluştur.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Sipariş">
              <select value={form.order_id} onChange={(event) => selectOrder(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                <option value="">Sipariş seç veya manuel bırak</option>
                {orders.map((order) => <option key={order.id} value={order.id}>{order.order_no} - {order.customer_name || "Müşteri yok"}</option>)}
              </select>
            </Field>

            <Field label="Ürün">
              <input value={form.product_name} onChange={(event) => setForm((current) => ({ ...current, product_name: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" placeholder="İade ürünü" />
            </Field>

            <Field label="Sebep">
              <input value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" placeholder="İade sebebi" />
            </Field>

            <Field label="Durum">
              <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
                {returnStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </Field>

            <Field label="Tutar">
              <input type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" />
            </Field>

            <Field label="Not">
              <input value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none" placeholder="Not" />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">İadeyi Kaydet</button>
            <button type="button" onClick={() => { setForm(emptyForm); setFormOpen(false); }} className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-slate-200">Vazgeç</button>
          </div>
        </form>
      ) : null}

      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black">İade Listesi</h2>
            <p className="mt-1 text-sm text-slate-400">İade taleplerini durumlarına göre yönet.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="İade ara..." className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none placeholder:text-slate-500 sm:w-[240px]" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm outline-none">
              <option value="all">Tüm Durumlar</option>
              {returnStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3">{[1,2,3].map((item) => <div key={item} className="h-28 animate-pulse rounded-[24px] bg-white/5" />)}</div>
        ) : filteredReturns.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0b1220] p-10 text-center">
            <h3 className="text-xl font-black">İade kaydı bulunamadı</h3>
            <p className="mt-2 text-sm text-slate-500">İade kaydı oluşturduğunda burada görünecek.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredReturns.map((item) => (
              <div key={item.id} className="rounded-[22px] border border-white/10 bg-[#0b1220] p-4 transition hover:bg-[#101a31]">
                <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr_0.7fr_0.9fr_auto] xl:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black">{item.return_no}</h3>
                      <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-300">{marketplaceLabel(item.marketplace)}</span>
                      <span className={["rounded-full px-3 py-1 text-xs font-black", statusClass(item.status)].join(" ")}>{statusLabel(item.status)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{item.customer_name || "Müşteri yok"} · {item.order_no || "Sipariş yok"}</p>
                    <p className="mt-2 text-xs text-slate-500">{formatDate(item.created_at)}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Ürün</p>
                    <p className="mt-1 text-sm font-black">{item.product_name || "-"}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.reason || "Sebep yok"}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Tutar</p>
                    <p className="mt-1 text-lg font-black">{formatCurrency(item.amount)}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Sonraki Durum</p>
                    <select value={item.status ?? "requested"} onChange={(event) => updateStatus(item, event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#111a2e] px-3 py-2 text-xs outline-none">
                      {returnStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                    </select>
                  </div>

                  <div className="xl:text-right">
                    <button onClick={() => deleteReturn(item.id)} className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-black text-red-300">Sil</button>
                  </div>
                </div>
              </div>
            ))}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-black text-slate-400">{label}</span>
      {children}
    </label>
  );
}
