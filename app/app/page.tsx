export default function DashboardHome() {
  const stats = [
    { label: "Bugünkü Ciro", value: "₺18.900", trend: "+%18,6" },
    { label: "Aktif Sipariş", value: "128", trend: "+24 bugün" },
    { label: "Stok Durumu", value: "Güncel", trend: "3 kritik" },
    { label: "Pazaryeri", value: "4 kanal", trend: "hazırlanıyor" },
  ];

  return (
    <section className="page">
      <div className="header">
        <div><span>Takipio Panel</span><h1>Genel Bakış</h1><p>İşletmenin günlük operasyon akışını tek ekrandan kontrol et.</p></div>
        <a href="/app/qr">QR Etiket Oluştur</a>
      </div>
      <div className="stats">{stats.map((s)=><article key={s.label}><span>{s.label}</span><b>{s.value}</b><em>{s.trend}</em></article>)}</div>
      <div className="grid">
        <article className="card big"><div className="top"><div><span>Canlı Akış</span><h2>Bugünkü operasyon özeti</h2></div><b>Canlı</b></div><div className="bars"><i style={{height:"38%"}}/><i style={{height:"55%"}}/><i style={{height:"44%"}}/><i style={{height:"72%"}}/><i style={{height:"62%"}}/><i style={{height:"88%"}}/><i style={{height:"78%"}}/></div><div className="list"><div><span>Trendyol’dan yeni sipariş geldi</span><em>2 dk</em></div><div><span>2 ürün kritik stok seviyesinde</span><em>14 dk</em></div><div><span>QR etiket PDF çıktısı hazırlandı</span><em>1 sa</em></div></div></article>
        <article className="card gorki"><img src="/gorki-hero.png" alt="Gorki AI"/><h2>Gorki AI</h2><p>Bugünkü sipariş, stok ve pazaryeri hareketlerini senin için özetler.</p><button>Önerileri Gör</button></article>
      </div>
      <div className="actions"><a href="/app/qr"><b>QR Etiket Oluştur</b><span>Ürünler için PDF QR etiket çıktısı hazırla.</span></a><a href="/app/products"><b>Ürünleri Yönet</b><span>Ürün, stok ve barkod bilgilerini düzenle.</span></a><a href="/app/orders"><b>Siparişleri Gör</b><span>Pazaryerinden gelen siparişleri takip et.</span></a></div>
      <style jsx>{`
        .page{display:grid;gap:22px}.header{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;padding:24px;border-radius:30px;background:rgba(255,255,255,.86);border:1px solid rgba(11,99,255,.12);box-shadow:0 20px 54px rgba(16,24,40,.08)}
        .header span,.top span,article span{color:#0b63ff;font-size:12px;font-weight:950;letter-spacing:.8px;text-transform:uppercase}h1{margin:8px 0;color:#06101f;font-size:42px;letter-spacing:-1.8px}p{margin:0;color:#667085;line-height:1.6;font-weight:650}.header a{min-height:48px;display:inline-flex;align-items:center;justify-content:center;padding:0 18px;border-radius:17px;color:white;background:linear-gradient(135deg,#0b63ff,#22d3ee);box-shadow:0 18px 34px rgba(11,99,255,.24);font-weight:950}
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.stats article,.card,.actions a{background:rgba(255,255,255,.86);border:1px solid rgba(11,99,255,.12);box-shadow:0 20px 54px rgba(16,24,40,.08)}.stats article{min-height:132px;display:grid;align-content:center;gap:8px;padding:20px;border-radius:26px}.stats b{color:#06101f;font-size:32px;letter-spacing:-1.2px}.stats em{color:#039855;font-style:normal;font-weight:950}
        .grid{display:grid;grid-template-columns:1.3fr .7fr;gap:16px}.card{border-radius:30px;padding:22px}.top{display:flex;justify-content:space-between;gap:14px;margin-bottom:18px}.top h2,.gorki h2{margin:6px 0 0;color:#06101f;font-size:24px;letter-spacing:-.8px}.top b{height:34px;display:inline-flex;align-items:center;padding:0 12px;border-radius:999px;color:#039855;background:rgba(3,152,85,.1);font-size:12px}
        .bars{height:220px;display:flex;align-items:end;gap:12px;padding:18px;border-radius:24px;background:linear-gradient(180deg,#f7fbff,#eef6ff);border:1px solid rgba(11,99,255,.08)}.bars i{flex:1;border-radius:999px 999px 8px 8px;background:linear-gradient(180deg,#22d3ee,#0b63ff);box-shadow:0 14px 24px rgba(11,99,255,.18)}
        .list{display:grid;gap:10px;margin-top:16px}.list div{min-height:46px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 14px;border-radius:16px;background:#f7fbff;color:#475467;font-weight:750}.list em{color:#98a2b3;font-style:normal;font-size:12px}.gorki{display:grid;align-content:start;gap:12px}.gorki img{width:130px;height:130px;object-fit:contain}.gorki button{height:48px;border:0;border-radius:17px;color:white;background:#06101f;font-weight:950;margin-top:8px}
        .actions{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.actions a{min-height:132px;display:grid;align-content:center;gap:8px;padding:20px;border-radius:26px;transition:.18s}.actions a:hover{transform:translateY(-3px)}.actions b{color:#06101f;font-size:18px}.actions span{color:#667085;line-height:1.55;font-weight:650}
        @media(max-width:980px){.header,.grid{grid-template-columns:1fr;display:grid}.stats,.actions{grid-template-columns:1fr 1fr}}@media(max-width:560px){.header{padding:20px}h1{font-size:34px}.stats,.actions{grid-template-columns:1fr}.header a{width:100%}}
      `}</style>
    </section>
  );
}
