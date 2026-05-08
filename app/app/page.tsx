import Image from "next/image";
import Link from "next/link";

const summaryCards = [
  {
    title: "Bugünkü Ciro",
    value: "₺24.850",
    change: "+18%",
    desc: "Düne göre artış",
    icon: "₺",
  },
  {
    title: "Yeni Sipariş",
    value: "42",
    change: "12 bekliyor",
    desc: "Hazırlanacak sipariş",
    icon: "▣",
  },
  {
    title: "Bekleyen Fatura",
    value: "8",
    change: "₺31.400",
    desc: "Tahsilat bekliyor",
    icon: "□",
  },
  {
    title: "Kritik Stok",
    value: "7",
    change: "Acil",
    desc: "Minimum altına yakın",
    icon: "▤",
  },
];

const salesBars = [
  { day: "Pzt", value: "42%", amount: "₺8.4K" },
  { day: "Sal", value: "56%", amount: "₺12.1K" },
  { day: "Çar", value: "48%", amount: "₺10.2K" },
  { day: "Per", value: "72%", amount: "₺18.7K" },
  { day: "Cum", value: "88%", amount: "₺24.8K" },
  { day: "Cmt", value: "63%", amount: "₺15.9K" },
  { day: "Paz", value: "77%", amount: "₺21.4K" },
];

const recentSales = [
  {
    code: "#S-1024",
    customer: "Kutluk Promosyon",
    product: "QR etiket baskı",
    amount: "₺8.450",
    status: "Hazırlanıyor",
  },
  {
    code: "#S-1023",
    customer: "Demo Market",
    product: "Ürün kayıt paketi",
    amount: "₺3.200",
    status: "Ödeme alındı",
  },
  {
    code: "#S-1022",
    customer: "ABC Ltd.",
    product: "Toplu stok girişi",
    amount: "₺12.300",
    status: "Fatura bekliyor",
  },
  {
    code: "#S-1021",
    customer: "Online Sipariş",
    product: "Numune paket",
    amount: "₺1.980",
    status: "Tamamlandı",
  },
];

const stockAlerts = [
  { name: "Premium Etiket", sku: "TKP-008", stock: "4", min: "20" },
  { name: "Bardak Altlığı", sku: "TKP-002", stock: "8", min: "15" },
  { name: "Oto Kokusu", sku: "TKP-003", stock: "12", min: "25" },
];

const invoices = [
  { title: "F-2026-001", customer: "Kutluk Promosyon", amount: "₺8.450", status: "Kesilecek" },
  { title: "F-2026-002", customer: "ABC Ltd.", amount: "₺12.300", status: "Taslak" },
  { title: "F-2026-003", customer: "Demo Market", amount: "₺3.200", status: "Ödendi" },
];

const integrations = [
  { name: "Trendyol", logo: "/trendyol.png", status: "Hazır", value: "85%" },
  { name: "Hepsiburada", logo: "/hepsiburada.png", status: "Eşleşiyor", value: "62%" },
  { name: "Amazon", logo: "/amazon.png", status: "Planlandı", value: "48%" },
  { name: "ÇiçekSepeti", logo: "/ciceksepeti.png", status: "Yakında", value: "34%" },
];

const quickActions = [
  { title: "Satış Ekle", href: "/app/sales", icon: "₺" },
  { title: "QR Etiket", href: "/app/qr", icon: "⌗" },
  { title: "Fatura Aç", href: "/app/invoices", icon: "□" },
  { title: "Stok Gir", href: "/app/stock", icon: "▤" },
];

export default function DashboardPage() {
  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-5 pb-8">
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-white/90 p-5 shadow-xl shadow-blue-100/60 backdrop-blur-xl sm:p-6 lg:p-7">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-300/25 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
                Takipio Dashboard
              </div>

              <h1 className="text-[32px] font-black leading-none tracking-[-0.05em] text-slate-950 sm:text-5xl">
                İşletme kontrol merkezi
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Satış, stok, fatura, QR etiket ve pazaryeri durumlarını tek ekrandan takip et.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
              {quickActions.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-xs font-black text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-blue-600 sm:text-sm"
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <Link
          href="/app/gorki-ai"
          className="relative overflow-hidden rounded-[34px] bg-slate-950 p-5 text-white shadow-xl shadow-blue-100/60 transition hover:-translate-y-0.5"
        >
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-500/30 blur-3xl" />

          <div className="relative flex items-center gap-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[28px] bg-white/10 ring-1 ring-white/10">
              <Image
                src="/gorki-hero.png"
                alt="Gorki AI"
                fill
                className="object-contain object-bottom"
                priority
              />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold text-blue-100">Gorki AI</p>
              <h2 className="mt-1 text-xl font-black">Bugünkü öneri</h2>
              <p className="mt-2 text-xs leading-5 text-slate-300">
                7 kritik stok var. Önce stokları kontrol et, sonra QR etiketleri hazırla.
              </p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className="rounded-[26px] border border-white/70 bg-white/90 p-4 shadow-lg shadow-blue-100/50 backdrop-blur-xl sm:rounded-[32px] sm:p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-200">
                {card.icon}
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700 sm:text-xs">
                {card.change}
              </span>
            </div>

            <p className="truncate text-xs font-bold text-slate-500 sm:text-sm">{card.title}</p>
            <strong className="mt-1 block truncate text-2xl font-black tracking-tight sm:text-3xl">
              {card.value}
            </strong>
            <p className="mt-2 text-xs leading-5 text-slate-400 sm:text-sm">{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[34px] border border-white/70 bg-white/90 p-5 shadow-xl shadow-blue-100/60 backdrop-blur-xl sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight sm:text-2xl">Haftalık satış grafiği</h2>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">Demo veri · gerçek satışlar Supabase’den gelecek.</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
              +24%
            </span>
          </div>

          <div className="flex h-64 items-end gap-2 rounded-[28px] bg-gradient-to-b from-blue-50 to-white p-3 sm:h-80 sm:gap-3 sm:p-5">
            {salesBars.map((bar) => (
              <div key={bar.day} className="group flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="hidden rounded-xl bg-white px-2 py-1 text-[11px] font-black text-slate-500 shadow-sm group-hover:block">
                  {bar.amount}
                </div>

                <div className="flex h-44 w-full items-end rounded-full bg-white shadow-inner ring-1 ring-blue-50 sm:h-56">
                  <div
                    className="w-full rounded-full bg-gradient-to-t from-blue-800 via-blue-500 to-cyan-300 shadow-lg shadow-blue-200"
                    style={{ height: bar.value }}
                  />
                </div>

                <span className="text-[10px] font-black text-slate-500 sm:text-xs">{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[34px] border border-white/70 bg-slate-950 p-5 text-white shadow-xl shadow-blue-100/60 sm:p-6">
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">Pazaryeri durumu</h2>
          <p className="mt-1 text-xs text-slate-300 sm:text-sm">Yüklenen gerçek logolarla entegrasyon görünümü.</p>

          <div className="mt-5 space-y-3">
            {integrations.map((item) => (
              <div key={item.name} className="rounded-[24px] bg-white/10 p-4 ring-1 ring-white/10">
                <div className="mb-3 flex items-center gap-3">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-white p-2">
                    <Image src={item.logo} alt={item.name} fill className="object-contain p-2" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-300">{item.status}</p>
                  </div>

                  <span className="text-xs font-black text-blue-200">{item.value}</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300"
                    style={{ width: item.value }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[34px] border border-white/70 bg-white/90 p-5 shadow-xl shadow-blue-100/60 backdrop-blur-xl sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight sm:text-2xl">Son satışlar</h2>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">Güncel satış ve sipariş hareketleri.</p>
            </div>

            <Link href="/app/sales" className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
              Tümü
            </Link>
          </div>

          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div key={sale.code} className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-slate-950">{sale.customer}</p>
                      <span className="hidden rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-400 sm:inline-flex">
                        {sale.code}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">{sale.product}</p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-black text-slate-950">{sale.amount}</p>
                    <span className="mt-1 inline-flex rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-700 sm:text-xs">
                      {sale.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5">
          <div className="rounded-[34px] border border-white/70 bg-white/90 p-5 shadow-xl shadow-blue-100/60 backdrop-blur-xl sm:p-6">
            <h2 className="text-xl font-black tracking-tight sm:text-2xl">Kritik stoklar</h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">Minimum seviyeye yaklaşan ürünler.</p>

            <div className="mt-5 space-y-3">
              {stockAlerts.map((item) => (
                <div key={item.sku} className="rounded-[24px] border border-red-100 bg-red-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950">{item.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-red-600">{item.stock}</p>
                      <p className="text-xs text-slate-400">min {item.min}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[34px] border border-white/70 bg-white/90 p-5 shadow-xl shadow-blue-100/60 backdrop-blur-xl sm:p-6">
            <h2 className="text-xl font-black tracking-tight sm:text-2xl">Fatura özeti</h2>

            <div className="mt-5 space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.title} className="flex items-center justify-between gap-3 rounded-[22px] bg-slate-50 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-black text-slate-950">{invoice.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{invoice.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-950">{invoice.amount}</p>
                    <p className="mt-1 text-xs font-bold text-blue-600">{invoice.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
