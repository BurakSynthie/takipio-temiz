const products = [
  { name: "Kulaklık", sku: "TKP-1001", stock: 128, barcode: "8680001001" },
  { name: "Bluetooth Hoparlör", sku: "TKP-1002", stock: 64, barcode: "8680001002" },
  { name: "Akıllı Saat", sku: "TKP-1003", stock: 42, barcode: "8680001003" },
  { name: "Powerbank", sku: "TKP-1004", stock: 87, barcode: "8680001004" },
  { name: "USB Kablo", sku: "TKP-1005", stock: 210, barcode: "8680001005" },
];

export default function ProductsPage() {
  return (
    <section className="page">
      <div className="header"><div><span>Ürünler</span><h1>Ürün Yönetimi</h1><p>Ürün, stok ve barkod bilgilerini tek panelden takip et.</p></div><button>Yeni Ürün</button></div>
      <div className="table">{products.map((p)=><div className="row" key={p.sku}><b>{p.name}</b><span>{p.sku}</span><span>{p.barcode}</span><span>{p.stock}</span><em>{p.stock>50?"Yeterli":"Kritik"}</em></div>)}</div>
      <style jsx>{`
        .page{display:grid;gap:20px}.header,.table{background:rgba(255,255,255,.86);border:1px solid rgba(11,99,255,.12);box-shadow:0 20px 54px rgba(16,24,40,.08);border-radius:30px}.header{display:flex;justify-content:space-between;gap:18px;padding:24px}.header span{color:#0b63ff;font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:.8px}h1{margin:8px 0;color:#06101f;font-size:42px;letter-spacing:-1.8px}p{margin:0;color:#667085;line-height:1.6;font-weight:650}button{min-height:48px;border:0;border-radius:17px;color:white;background:linear-gradient(135deg,#0b63ff,#22d3ee);padding:0 18px;font-weight:950}.table{overflow:hidden}.row{display:grid;grid-template-columns:1.3fr .8fr 1fr .6fr .8fr;gap:12px;align-items:center;padding:16px 20px;border-top:1px solid #eef2f7;color:#475467;font-weight:750}.row:first-child{border-top:0}.row b{color:#06101f}.row em{width:max-content;padding:6px 10px;border-radius:999px;color:#039855;background:rgba(3,152,85,.1);font-style:normal;font-size:12px;font-weight:950}@media(max-width:760px){.header{display:grid}button{width:100%}.table{overflow-x:auto}.row{min-width:760px}}
      `}</style>
    </section>
  );
}
