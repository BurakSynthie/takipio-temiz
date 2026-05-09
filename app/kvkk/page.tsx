import Link from "next/link";

const sections = [
  { title: 'Veri Sorumlusu', text: 'Takipio platformu kapsamında işlenen kişisel verilerle ilgili taleplerinizi takipioinfo@gmail.com adresi üzerinden iletebilirsiniz.' },
  { title: 'İşlenen Kişisel Veriler', text: 'Ad, soyad, e-posta, telefon, işletme bilgileri, kullanıcı rolü, işlem kayıtları ve panel kullanımına ilişkin veriler işlenebilir.' },
  { title: 'İşleme Amaçları', text: 'Veriler; üyelik oluşturma, hizmet sunma, kullanıcı yetkilendirme, güvenlik, destek süreçleri, abonelik ve ödeme işlemlerinin yürütülmesi için işlenir.' },
  { title: 'Aktarım', text: 'Veriler, hizmetin sağlanması için gerekli altyapı, barındırma, ödeme ve entegrasyon sağlayıcılarıyla sınırlı şekilde paylaşılabilir.' },
  { title: 'Haklarınız', text: 'KVKK kapsamında verilerinizle ilgili bilgi alma, düzeltme, silme, işlenmesine itiraz etme ve diğer yasal haklarınızı kullanabilirsiniz.' }
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/8 ring-1 ring-white/10">
        <img src="/takipio-logo.png" alt="Takipio" className="h-full w-full object-contain p-1.5" />
      </div>
      <div>
        <p className="text-xl font-black tracking-[-0.04em] text-white">Takipio</p>
        <p className="text-[11px] font-bold text-slate-500">Premium işletme merkezi</p>
      </div>
    </Link>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(37,99,235,.28),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(6,182,212,.13),transparent_30%)]" />
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:46px_46px]" />

      <header className="border-b border-white/10 bg-[#020817]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1060px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Logo />
          <div className="flex items-center gap-2">
            <Link href="/" className="rounded-full bg-white/8 px-4 py-2 text-xs font-black text-slate-300 ring-1 ring-white/10 transition hover:bg-white/12">
              Ana Sayfa
            </Link>
            <Link href="/login" className="rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white transition hover:bg-blue-500">
              Giriş Yap
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1060px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-[34px] border border-white/10 bg-[#07111f]/82 p-6 shadow-2xl backdrop-blur-xl lg:p-9">
          <div className="mb-8">
            <div className="mb-4 inline-flex rounded-full bg-blue-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-300 ring-1 ring-blue-400/20">
              KVKK
            </div>
            <h1 className="text-[42px] font-black leading-tight tracking-[-0.06em] text-white sm:text-6xl">
              KVKK Aydınlatma Metni
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-400">
              6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kullanıcıların bilgilendirilmesi amacıyla hazırlanmıştır.
            </p>
            <p className="mt-3 text-xs font-bold text-slate-600">
              Son güncelleme: 2026
            </p>
          </div>

          <div className="grid gap-4">
            {sections.map((section) => (
              <article key={section.title} className="rounded-[24px] border border-white/10 bg-[#020817]/70 p-5">
                <h2 className="text-xl font-black tracking-[-0.03em] text-white">{section.title}</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-400">{section.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-[24px] border border-blue-400/20 bg-blue-500/10 p-5">
            <h2 className="text-lg font-black text-white">İletişim</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Bu sayfadaki konularla ilgili bize ulaşmak için: 
              <a href="mailto:takipioinfo@gmail.com" className="font-black text-blue-300">
                takipioinfo@gmail.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
