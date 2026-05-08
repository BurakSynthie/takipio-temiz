import Image from "next/image";
import Link from "next/link";

const stats = [
  { label: "Toplam Alacak", value: "₺86.240", change: "+₺12.400", color: "blue" },
  { label: "Bugünkü Satış", value: "₺24.850", change: "+18%", color: "green" },
  { label: "Bekleyen Fatura", value: "8", change: "₺31.400", color: "orange" },
  { label: "Kritik Stok", value: "7", change: "Acil", color: "red" },
];

const chart = [
  { day: "Pzt", income: 45, expense: 24 },
  { day: "Sal", income: 58, expense: 32 },
  { day: "Çar", income: 52, expense: 37 },
  { day: "Per", income: 74, expense: 42 },
  { day: "Cum", income: 88, expense: 39 },
  { day: "Cmt", income: 64, expense: 30 },
  { day: "Paz", income: 78, expense: 35 },
];

const integrations = [
  { name: "Trendyol", logo: "/trendyol.png", status: "Aktif", sync: "2 dk önce", score: "92%" },
  { name: "Hepsiburada", logo: "/hepsiburada.png", status: "Kontrol", sync: "14 dk önce", score: "76%" },
  { name: "Amazon", logo: "/amazon.png", status: "Planlandı", sync: "Bekliyor", score: "48%" },
  { name: "ÇiçekSepeti", logo: "/ciceksepeti.png", status: "Yakında", sync: "Pasif", score: "34%" },
];

const sales = [
  { code: "S-1024", customer: "Kutluk Promosyon", date: "Bugün 14:25", amount: "₺8.450", status: "Hazırlanıyor" },
  { code: "S-1023", customer: "Demo Market", date: "Bugün 12:10", amount: "₺3.200", status: "Ödendi" },
  { code: "S-1022", customer: "ABC Ltd.", date: "Dün 18:40", amount: "₺12.300", status: "Fatura" },
  { code: "S-1021", customer: "Online Sipariş", date: "Dün 16:05", amount: "₺1.980", status: "Tamamlandı" },
];

const actions = [
  { href: "/app/sales", label: "Satış oluştur", desc: "Yeni işlem gir", icon: "₺" },
  { href: "/app/invoices", label: "Fatura kes", desc: "Taslak hazırla", icon: "□" },
  { href: "/app/qr", label: "QR etiket", desc: "PDF çıktı al", icon: "⌗" },
  { href: "/app/stock", label: "Stok girişi", desc: "Depo hareketi", icon: "▤" },
];

const cash = [
  { label: "Tahsil edilecek", value: "₺58.900", width: "72%", color: "bg-emerald-500" },
  { label: "Ödenecek", value: "₺18.200", width: "34%", color: "bg-amber-500" },
  { label: "Net durum", value: "₺40.700", width: "56%", color: "bg-[#2463ff]" },
];

function colorClasses(color: string) {
  if (color === "green") return "bg-emerald-50 text-emerald-700";
  if (color === "orange") return "bg-amber-50 text-amber-700";
  if (color === "red") return "bg-red-50 text-red-700";
  return "bg-blue-50 text-blue-700";
}

export default function DashboardPage() {
  return (
    <section className="mx-auto w-full max-w-[1520px] space-y-5 pb-8">
      <div className="grid gap-5 xl:grid-cols-[1fr_330px]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.07)] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-2 text-xs font-black text-white">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Finans ve operasyon özeti
              </div>

              <h1 className="text-[34px] font-black leading-none tracking-[-0.055em] text-slate-950 sm:text-5xl">
                Bugünün işletme tablosu
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Satış, tahsilat, fatura, stok ve pazaryeri akışlarını tek ekrandan net şekilde takip et.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/app/sales" className="rounded-2xl bg-[#2463ff] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700">
                Yeni Satış
              </Link>
              <Link href="/app/invoices" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5">
                Fatura
              </Link>
            </div>
          </div>
        </div>

        <Link href="/app/gorki-ai" className="rounded-[30px] bg-[#111827] p-5 text-white shadow-[0_18px_60px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[24px] bg-white/10">
              <Image src="/gorki-hero.png" alt="Gorki AI" fill className="object-contain object-bottom" priority />
            </div>

            <div>
              <p className="text-xs font-bold text-blue-200">Gorki AI</p>
              <h2 className="mt-1 text-lg font-black">Canlı yardımcı</h2>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Sağ alttan panelde gezerken konuşabilirsin.
              </p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-5">
        {stats.map((item) => (
          <div key={item.label} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
              <span className={["rounded-full px-2.5 py-1 text-[10px] font-black", colorClasses(item.color)].join(" ")}>
                {item.change}
              </span>
            </div>
            <p className="text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.07)] sm:p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">Gelir / gider grafiği</h2>
              <p className="mt-1 text-sm text-slate-500">Haftalık satış ve maliyet görünümü.</p>
            </div>

            <div className="flex gap-2 text-xs font-black">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">Gelir</span>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">Gider</span>
            </div>
          </div>

          <div className="relative h-[330px] overflow-hidden rounded-[26px] border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-4">
            <div className="absolute inset-x-4 top-1/4 border-t border-dashed border-slate-200" />
            <div className="absolute inset-x-4 top-1/2 border-t border-dashed border-slate-200" />
            <div className="absolute inset-x-4 top-3/4 border-t border-dashed border-slate-200" />

            <div className="relative flex h-full items-end gap-3">
              {chart.map((item) => (
                <div key={item.day} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <div className="flex h-[250px] w-full items-end justify-center gap-1.5">
                    <div
                      className="w-3 rounded-t-full bg-[#2463ff] shadow-[0_10px_24px_rgba(36,99,255,0.26)] transition group-hover:scale-y-105 sm:w-4"
                      style={{ height: `${item.income}%` }}
                    />
                    <div
                      className="w-3 rounded-t-full bg-amber-400 shadow-[0_10px_24px_rgba(245,158,11,0.16)] transition group-hover:scale-y-105 sm:w-4"
                      style={{ height: `${item.expense}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 sm:text-xs">{item.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.07)] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">Nakit akışı</h2>
            <p className="mt-1 text-sm text-slate-500">Tahsilat ve ödeme görünümü.</p>

            <div className="mt-6 space-y-5">
              {cash.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-700">{item.label}</p>
                    <p className="text-sm font-black text-slate-950">{item.value}</p>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className={["h-full rounded-full", item.color].join(" ")} style={{ width: item.width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] bg-[#111827] p-5 text-white shadow-[0_18px_60px_rgba(15,23,42,0.16)] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.04em]">Hızlı işlemler</h2>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {actions.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-[22px] bg-white/10 p-4 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-lg font-black text-slate-950">
                    {item.icon}
                  </div>
                  <p className="text-sm font-black">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.07)] sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">Son satışlar</h2>
              <p className="mt-1 text-sm text-slate-500">Güncel işlem akışı.</p>
            </div>
            <Link href="/app/sales" className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-[#2463ff] hover:text-white">Tümü</Link>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-slate-100">
            {sales.map((item) => (
              <div key={item.code} className="grid gap-3 border-b border-slate-100 bg-white p-4 transition hover:bg-blue-50/60 last:border-b-0 sm:grid-cols-[80px_1fr_auto_auto] sm:items-center">
                <span className="text-xs font-black text-slate-400">{item.code}</span>
                <div className="min-w-0">
                  <p className="truncate font-black text-slate-950">{item.customer}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.date}</p>
                </div>
                <p className="font-black text-slate-950">{item.amount}</p>
                <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.07)] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">Entegrasyonlar</h2>
          <p className="mt-1 text-sm text-slate-500">Pazaryeri senkron durumu.</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {integrations.map((item) => (
              <div key={item.name} className="rounded-[22px] border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-blue-50/60">
                <div className="mb-4 flex items-center gap-3">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-white p-2 shadow-sm">
                    <Image src={item.logo} alt={item.name} fill className="object-contain p-2" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black text-slate-950">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.sync}</p>
                  </div>
                  <span className="text-xs font-black text-blue-700">{item.score}</span>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700 shadow-sm">{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
