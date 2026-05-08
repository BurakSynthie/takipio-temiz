"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Order = {
  id: string;
  order_no: string;
  created_at: string;
};

type Subscription = {
  id: string;
  business_id: string | null;
  user_email: string | null;
  plan: string | null;
  status: string | null;
  order_limit: number | null;
  first_month_price: number | null;
  monthly_price: number | null;
  current_period_start: string | null;
  current_period_end: string | null;
  payment_provider: string | null;
  created_at: string;
};

type BillingEvent = {
  id: string;
  subscription_id: string | null;
  event_type: string | null;
  amount: number | null;
  currency: string | null;
  status: string | null;
  note: string | null;
  created_at: string;
};

const lockedFeatures = [
  {
    title: "Pazaryeri Entegrasyonları",
    desc: "Trendyol, Hepsiburada, Amazon ve ÇiçekSepeti otomatik sipariş/stok senkronu.",
  },
  {
    title: "Ekip ve Yetki Yönetimi",
    desc: "Çalışan, muhasebeci ve özel rol izinlerini işletme sahibinin yönetmesi.",
  },
  {
    title: "Gelişmiş Raporlar",
    desc: "Kanal bazlı satış, iade, kargo, ödeme ve tahsilat performans raporları.",
  },
  {
    title: "Toplu QR / PDF Çıktı",
    desc: "Ürün ve sipariş bazlı toplu QR etiketi, PDF çıktı ve yazdırma akışı.",
  },
  {
    title: "Mobil Tam Senkron",
    desc: "Web ve mobilde aynı hesapla sınırsız operasyon yönetimi.",
  },
  {
    title: "Gorki AI Gelişmiş Kullanım",
    desc: "Sipariş, stok, tahsilat ve entegrasyonlar için akıllı öneriler.",
  },
];

const freeFeatures = [
  "Dashboard temel görünüm",
  "Ürün ekleme",
  "Stok takibi",
  "15 siparişe kadar sipariş oluşturma",
  "Basit kargo takibi",
  "Notlar ve profil yönetimi",
];

const proFeatures = [
  "Sınırsız sipariş",
  "Pazaryeri entegrasyonları",
  "Ekip ve yetki sistemi",
  "Gelişmiş raporlar",
  "İade ve kargo operasyon merkezi",
  "Mobil uygulama tam senkron",
  "Toplu QR / PDF çıktı",
  "Gorki AI gelişmiş destek",
];

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatDate(date: string | null | undefined) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function planLabel(plan: string | null | undefined) {
  if (plan === "pro") return "Takipio Pro";
  return "Ücretsiz Deneme";
}

function statusLabel(status: string | null | undefined) {
  if (status === "active") return "Aktif";
  if (status === "past_due") return "Ödeme Bekliyor";
  if (status === "cancelled") return "İptal";
  return "Deneme";
}

export default function BillingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [events, setEvents] = useState<BillingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  async function fetchData() {
    setLoading(true);
    setMessage("");

    const [ordersResult, subscriptionResult] = await Promise.all([
      supabase.from("orders").select("id, order_no, created_at").order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    setOrders(ordersResult.data ?? []);

    if (subscriptionResult.data) {
      setSubscription(subscriptionResult.data);

      const { data: billingData } = await supabase
        .from("billing_events")
        .select("*")
        .eq("subscription_id", subscriptionResult.data.id)
        .order("created_at", { ascending: false });

      setEvents(billingData ?? []);
    } else {
      const { data: created, error } = await supabase
        .from("subscriptions")
        .insert({
          plan: "free",
          status: "trial",
          order_limit: 15,
          first_month_price: 89,
          monthly_price: 99,
          note: null,
        })
        .select("*")
        .single();

      if (!error && created) {
        setSubscription(created);
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const plan = subscription?.plan ?? "free";
  const orderLimit = Number(subscription?.order_limit ?? 15);
  const usedOrders = orders.length;
  const remainingOrders = Math.max(orderLimit - usedOrders, 0);
  const usagePercentage = plan === "pro" ? 100 : Math.min(Math.round((usedOrders / orderLimit) * 100), 100);
  const isPro = plan === "pro";
  const isLimitFull = !isPro && usedOrders >= orderLimit;

  async function simulateUpgrade() {
    if (!subscription) return;

    const { error } = await supabase
      .from("subscriptions")
      .update({
        plan: "pro",
        status: "active",
        order_limit: 999999,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    if (error) {
      setMessage(`Paket güncellenemedi: ${error.message}`);
      return;
    }

    await supabase.from("billing_events").insert({
      subscription_id: subscription.id,
      event_type: "upgrade_simulation",
      amount: 89,
      currency: "TRY",
      status: "success",
      note: "Demo yükseltme: İlk ay ₺89 Pro paket.",
    });

    setMessage("Demo olarak Pro pakete geçirildi. Gerçek ödeme entegrasyonunda bu buton iyzico / PayTR ile bağlanacak.");
    setUpgradeOpen(false);
    await fetchData();
  }

  async function resetFreePlan() {
    if (!subscription) return;

    await supabase
      .from("subscriptions")
      .update({
        plan: "free",
        status: "trial",
        order_limit: 15,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    setMessage("Paket tekrar ücretsiz denemeye alındı.");
    await fetchData();
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-4 pb-10 text-white">
      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-300">
              Subscription / Billing
            </div>
            <h1 className="text-[34px] font-black tracking-[-0.05em] sm:text-5xl">
              Abonelik
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              15 siparişe kadar ücretsiz deneme. İlk ay ₺89, sonraki aylar ₺99. Web ve mobil aynı abonelikle çalışacak.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isPro ? (
              <button
                onClick={() => setUpgradeOpen(true)}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500"
              >
                Paketi Yükselt
              </button>
            ) : (
              <button
                onClick={resetFreePlan}
                className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-slate-200 transition hover:bg-white/15"
              >
                Demo Free Yap
              </button>
            )}
          </div>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Mevcut Paket
              </p>
              <h2 className="mt-2 text-3xl font-black">{planLabel(plan)}</h2>
              <p className="mt-2 text-sm text-slate-400">
                Durum: <span className="font-black text-blue-300">{statusLabel(subscription?.status)}</span>
              </p>
            </div>

            <div className="rounded-[22px] bg-[#0b1220] p-4 text-right ring-1 ring-white/10">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Kullanım
              </p>
              <p className="mt-2 text-3xl font-black">
                {isPro ? "∞" : `${usedOrders}/${orderLimit}`}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {isPro ? "Sınırsız sipariş" : `${remainingOrders} ücretsiz sipariş kaldı`}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs font-black">
              <span className="text-slate-400">Sipariş kullanım limiti</span>
              <span className={isLimitFull ? "text-red-300" : "text-blue-300"}>
                {isPro ? "Pro aktif" : `%${usagePercentage}`}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/8">
              <div
                className={`h-full rounded-full ${isLimitFull ? "bg-red-500" : "bg-blue-500"}`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>

            {isLimitFull ? (
              <div className="mt-4 rounded-2xl bg-red-500/10 p-4 text-sm font-bold text-red-200 ring-1 ring-red-500/20">
                Ücretsiz sipariş limitin doldu. Yeni sipariş oluşturmak ve premium özellikleri açmak için Pro pakete geçmelisin.
              </div>
            ) : !isPro && usagePercentage >= 80 ? (
              <div className="mt-4 rounded-2xl bg-amber-500/10 p-4 text-sm font-bold text-amber-200 ring-1 ring-amber-500/20">
                Ücretsiz sipariş limitinin büyük kısmını kullandın. Pro pakete geçerek sınırsız sipariş ve entegrasyonları açabilirsin.
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <SmallMetric label="İlk Ay" value={formatCurrency(subscription?.first_month_price ?? 89)} />
            <SmallMetric label="Sonraki Aylar" value={`${formatCurrency(subscription?.monthly_price ?? 99)} / ay`} />
            <SmallMetric label="Web + Mobil" value="Tek abonelik" />
          </div>
        </div>

        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <h2 className="text-2xl font-black">Paket Özeti</h2>

          <div className="mt-5 grid gap-3">
            <PlanCard
              title="Free"
              price="₺0"
              desc="15 siparişe kadar sistemi denemek için."
              active={!isPro}
              features={freeFeatures}
            />
            <PlanCard
              title="Pro"
              price="₺89 ilk ay"
              desc="Sonraki aylar ₺99. Sınırsız operasyon."
              active={isPro}
              features={proFeatures}
            />
          </div>
        </div>
      </div>

      <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black">Free Planda Kilitli Özellikler</h2>
            <p className="mt-1 text-sm text-slate-400">
              Kullanıcı sistemi deneyebilsin ama büyümek istediğinde Pro pakete geçsin.
            </p>
          </div>
          {!isPro ? (
            <button onClick={() => setUpgradeOpen(true)} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">
              İlk Ay ₺89 ile Aç
            </button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {lockedFeatures.map((feature) => (
            <div key={feature.title} className="rounded-[22px] border border-white/10 bg-[#0b1220] p-4">
              <div className="mb-4 inline-flex rounded-full bg-amber-500/15 px-3 py-1 text-[10px] font-black text-amber-300">
                {isPro ? "Açık" : "Pro"}
              </div>
              <h3 className="text-lg font-black">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <h2 className="text-2xl font-black">Fatura / Ödeme Geçmişi</h2>
          <p className="mt-1 text-sm text-slate-400">
            Gerçek ödeme entegrasyonunda iyzico / PayTR ödeme kayıtları buraya düşecek.
          </p>

          <div className="mt-5 space-y-2">
            {events.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-white/10 bg-[#0b1220] p-8 text-center text-sm text-slate-500">
                Henüz ödeme geçmişi yok.
              </div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="rounded-[18px] bg-[#0b1220] p-4 ring-1 ring-white/10">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black">{event.event_type || "billing_event"}</p>
                      <p className="mt-1 text-xs text-slate-500">{event.note || "Not yok"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-300">{formatCurrency(event.amount)}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(event.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[26px] border border-white/10 bg-[#111a2e] p-5">
          <h2 className="text-2xl font-black">Web + Mobil Abonelik Mantığı</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Bu abonelik sistemi ileride işletme hesabına bağlanacak. Kullanıcı webden ödeme yaptığında aynı hesap mobil uygulamada da Pro olarak açılacak.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <InfoBox title="1. Hesap" desc="Kullanıcı web veya mobilde aynı e-posta ile giriş yapar." />
            <InfoBox title="2. Abonelik" desc="Supabase üzerinden plan ve limit bilgisi okunur." />
            <InfoBox title="3. Senkron" desc="Webde Pro ise mobilde de Pro özellikleri açılır." />
          </div>
        </div>
      </div>

      {upgradeOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[560px] rounded-[30px] border border-white/10 bg-[#111a2e] p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">
                  Takipio Pro
                </p>
                <h2 className="mt-2 text-3xl font-black">İlk ay ₺89</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Sonraki aylar ₺99. Sınırsız sipariş, entegrasyonlar, ekip yetkileri, gelişmiş raporlar ve mobil tam senkron.
                </p>
              </div>
              <button onClick={() => setUpgradeOpen(false)} className="rounded-2xl bg-white/10 px-4 py-2 text-lg font-black">
                ×
              </button>
            </div>

            <div className="rounded-2xl bg-[#0b1220] p-4 ring-1 ring-white/10">
              <p className="text-sm font-black">Gerçek ödeme entegrasyonu sonraki aşama</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Bu buton şimdilik demo olarak Pro planı açar. Sonra iyzico / PayTR / Shopier gibi ödeme altyapısına bağlayacağız.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={simulateUpgrade} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">
                Demo Pro Yap
              </button>
              <button onClick={() => setUpgradeOpen(false)} className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-slate-200">
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[#0b1220] p-4 ring-1 ring-white/10">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  );
}

function PlanCard({
  title,
  price,
  desc,
  active,
  features,
}: {
  title: string;
  price: string;
  desc: string;
  active: boolean;
  features: string[];
}) {
  return (
    <div className={`rounded-[22px] border p-4 ${active ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-[#0b1220]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">{title}</h3>
          <p className="mt-1 text-sm text-slate-400">{desc}</p>
        </div>
        {active ? (
          <span className="rounded-full bg-blue-500 px-3 py-1 text-[10px] font-black text-white">
            Aktif
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-2xl font-black">{price}</p>

      <div className="mt-4 space-y-2">
        {features.map((feature) => (
          <p key={feature} className="text-xs font-bold text-slate-300">
            ✓ {feature}
          </p>
        ))}
      </div>
    </div>
  );
}

function InfoBox({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-[18px] bg-[#0b1220] p-4 ring-1 ring-white/10">
      <h3 className="text-sm font-black">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-slate-400">{desc}</p>
    </div>
  );
}
