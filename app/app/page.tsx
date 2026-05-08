import Image from "next/image";
import Link from "next/link";

const kpis = [
  { label: "Toplam Alacak", value: "₺86.240", trend: "+₺12.400", accent: "from-blue-500 to-cyan-300" },
  { label: "Bugünkü Satış", value: "₺24.850", trend: "+18%", accent: "from-emerald-400 to-teal-300" },
  { label: "Bekleyen Fatura", value: "8", trend: "₺31.400", accent: "from-amber-400 to-orange-300" },
  { label: "Kritik Stok", value: "7", trend: "Acil", accent: "from-red-400 to-rose-300" },
];

const chart = [
  { label: "Pzt", revenue: 42, expense: 24 },
  { label: "Sal", revenue: 56, expense: 28 },
  { label: "Çar", revenue: 48, expense: 35 },
  { label: "Per", revenue: 72, expense: 38 },
  { label: "Cum", revenue: 88, expense: 42 },
  { label: "Cmt", revenue: 63, expense: 31 },
  { label: "Paz", revenue: 77, expense: 36 },
];

const channels = [
  { name: "Trendyol", logo: "/trendyol.png", status: "Aktif", sync: "2 dk önce", score: "92%" },
  { name: "Hepsiburada", logo: "/hepsiburada.png", status: "Kontrol", sync: "14 dk önce", score: "76%" },
  { name: "Amazon", logo: "/amazon.png", status: "Plan", sync: "Bekliyor", score: "48%" },
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

const flow = [
  { label: "Tahsil edilecek", value: "₺58.900", width: "72%", color: "from-emerald-400 to-teal-300" },
  { label: "Ödenecek", value: "₺18.200", width: "34%", color: "from-amber-400 to-orange-300" },
  { label: "Net durum", value: "₺40.700", width: "56%", color: "from-blue-500 to-cyan-300" },
];

export default function DashboardPage() {
  return (
    <section className="mx-auto w-full max-w-[1540px] space-y-5 pb-8">
      <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
        <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-slate-950 p-5 text-white shadow-[0_24px_90px_rgba(0,0,0,0.25)] sm:p-7">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-500/30 blur-3xl" />
          <div className="absolute bottom-[-80px] left-1/3 h-72 w-72 rounded-full bg-cyan-300/15 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-black text-cyan-100">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.9)]" />
                Premium operasyon paneli
              </div>

              <h1 className="max-w-4xl text-[36px] font-black leading-[0.94] tracking-[-0.06em] sm:text-6xl">
                Bugünün işletme tablosu.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Satış, tahsilat, fatura, stok ve pazaryeri akışlarını tek yoğun ekranda takip et. Gorki panelde gezerken yanında.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <Link href="/app/sales" className="group rounded-2xl bg-white px-5 py-3 text-center text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-1 hover:bg-cyan-50">
                Yeni Satış
              </Link>
              <Link href="/app/invoices" className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-center text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/15">
                Fatura
              </Link>
            </div>
          </div>

          <div className="relative mt-7 grid gap-3 md:grid-cols-4">
            {kpis.map((item) => (
              <div key={item.label} className="group overflow-hidden rounded-[26px] border border-white/10 bg-white/10 p-4 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/15">
                <div className={`mb-4 h-1.5 w-16 rounded-full bg-gradient-to-r ${item.accent}`} />
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
                <p className="mt-2 text-2xl font-black tracking-[-0.04em]">{item.value}</p>
                <p className="mt-2 text-xs font-black text-cyan-200">{item.trend}</p>
              </div>
            ))}
          </div>
        </div>

        <Link href="/app/gorki-ai" className="relative overflow-hidden rounded-[36px] border border-white/10 bg-slate-950 p-5 text-white shadow-[0_24px_90px_rgba(0,0,0,0.25)] transition hover:-translate-y-1">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-blue-500/30 blur-3xl" />
          <div className="relative flex h-full flex-col justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[28px] bg-white/10 ring-1 ring-white/10">
                <Image src="/gorki-hero.png" alt="Gorki AI" fill className="object-contain object-bottom" priority />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold text-blue-100">Gorki AI</p>
                <h2 className="mt-1 text-xl font-black">Canlı yardımcı</h2>
                <p className="mt-2 text-xs leading-5 text-slate-300">
                  Sağ alttaki kutudan panelde gezerken de konuşabilirsin.
                </p>
              </div>
            </div>

            <div className="rounded-[24px] bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-sm font-black">Bugünkü öneri</p>
              <p className="mt-2 text-xs leading-5 text-slate-300">
                Ürünlerde QR ve stok akışı hazır. Sırada satış ve stok hareket geçmişi var.
              </p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[36px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-6">
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

          <div className="relative h-[340px] overflow-hidden rounded-[30px] border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-4">
            <div className="absolute inset-x-4 top-1/4 border-t border-dashed border-slate-200" />
            <div className="absolute inset-x-4 top-1/2 border-t border-dashed border-slate-200" />
            <div className="absolute inset-x-4 top-3/4 border-t border-dashed border-slate-200" />

            <div className="relative flex h-full items-end gap-3">
              {chart.map((item) => (
                <div key={item.label} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <div className="flex h-[250px] w-full items-end justify-center gap-1.5">
                    <div
                      className="w-3 rounded-t-full bg-gradient-to-t from-blue-700 to-cyan-300 shadow-[0_10px_28px_rgba(37,99,235,0.32)] transition group-hover:scale-y-105 sm:w-4"
                      style={{ height: `${item.revenue}%` }}
                    />
                    <div
                      className="w-3 rounded-t-full bg-gradient-to-t from-amber-500 to-orange-200 shadow-[0_10px_28px_rgba(245,158,11,0.20)] transition group-hover:scale-y-105 sm:w-4"
                      style={{ height: `${item.expense}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 sm:text-xs">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="rounded-[36px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">Nakit akışı</h2>
            <p className="mt-1 text-sm text-slate-500">Tahsilat ve ödeme görünümü.</p>

            <div className="mt-6 space-y-5">
              {flow.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-700">{item.label}</p>
                    <p className="text-sm font-black text-slate-950">{item.value}</p>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full bg-gradient-to-r ${item.color}`} style={{ width: item.width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[36px] bg-slate-950 p-5 text-white shadow-[0_24px_80px_rgba(15,23,42,0.20)] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.04em]">Hızlı işlemler</h2>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {actions.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-[24px] bg-white/10 p-4 ring-1 ring-white/10 transition hover:-translate-y-1 hover:bg-white/15">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-lg font-black text-slate-950">
                    {item.icon}
                  </div>
                  <p className="text-sm font-black">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-300">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[36px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">Son satışlar</h2>
              <p className="mt-1 text-sm text-slate-500">Güncel işlem akışı.</p>
            </div>
            <Link href="/app/sales" className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-600 hover:text-white">Tümü</Link>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-slate-100">
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

        <div className="rounded-[36px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">Entegrasyonlar</h2>
          <p className="mt-1 text-sm text-slate-500">Pazaryeri senkron durumu.</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {channels.map((item) => (
              <div key={item.name} className="rounded-[26px] border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-1 hover:bg-blue-50/60">
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
