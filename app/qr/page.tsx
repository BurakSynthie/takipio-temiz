"use client";

import { useMemo, useState } from "react";

const products = ["Kulaklık", "Bluetooth Hoparlör", "Akıllı Saat", "Powerbank", "USB Kablo", "Kulak İçi Kulaklık"];

function qrUrl(value: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(value)}`;
}

export default function QrLabelsPage() {
  const [selectedProduct, setSelectedProduct] = useState("Tüm Ürünler");
  const visibleProducts = useMemo(() => selectedProduct === "Tüm Ürünler" ? products : [selectedProduct], [selectedProduct]);

  return (
    <section className="page">
      <div className="header"><div><span>QR / Barkod</span><h1>QR Etiket Oluştur</h1><p>Ürünlerin için telefon kamerasıyla okutulabilir QR etiketleri hazırla.</p></div><button onClick={() => window.print()}>PDF İndir</button></div>
      <div className="toolbar"><label>Ürün Seçin<select value={selectedProduct} onChange={(e)=>setSelectedProduct(e.target.value)}><option>Tüm Ürünler</option>{products.map((p)=><option key={p}>{p}</option>)}</select></label><label>Etiket Boyutu<select><option>50x30 mm</option><option>60x40 mm</option></select></label><label>Etiket Adedi<select><option>6 (2x3)</option><option>8 (2x4)</option></select></label></div>
      <div className="sheet">{visibleProducts.map((p)=><article className="label" key={p}><b>{p.toUpperCase()}</b><img src={qrUrl(`takipio-product:${p}`)} alt={`${p} QR`} /><span><img src="/takipio-logo.png" alt="" /></span></article>)}</div>
      <style jsx>{`
        .page{display:grid;gap:20px}.header,.toolbar,.sheet{background:rgba(255,255,255,.86);border:1px solid rgba(11,99,255,.12);box-shadow:0 20px 54px rgba(16,24,40,.08);border-radius:30px}.header{display:flex;justify-content:space-between;gap:18px;padding:24px}.header span{color:#0b63ff;font-size:12px;font-weight:950;letter-spacing:.8px;text-transform:uppercase}h1{margin:8px 0;color:#06101f;font-size:42px;letter-spacing:-1.8px}p{margin:0;color:#667085;line-height:1.6;font-weight:650}button{min-height:48px;border:0;border-radius:17px;color:white;background:linear-gradient(135deg,#0b63ff,#22d3ee);padding:0 18px;font-weight:950}.toolbar{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;padding:20px}label{display:grid;gap:8px;color:#344054;font-size:13px;font-weight:900}select{height:52px;border-radius:17px;border:1px solid rgba(11,99,255,.12);background:white;color:#06101f;padding:0 14px;font-weight:800}.sheet{padding:24px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.label{min-height:210px;display:grid;place-items:center;gap:8px;padding:14px;border-radius:20px;background:white;border:1px solid #e4e7ec}.label b{color:#06101f;font-size:13px;text-align:center}.label>img{width:112px;height:112px}.label span{width:80px;height:24px;display:grid;place-items:center;border-radius:9px;background:#06101f}.label span img{width:64px;height:18px;object-fit:contain}@media print{.header,.toolbar,aside,header{display:none!important}.sheet{box-shadow:none;border:0;padding:0}}@media(max-width:900px){.toolbar,.sheet{grid-template-columns:1fr 1fr}}@media(max-width:560px){.header{display:grid}button{width:100%}.toolbar,.sheet{grid-template-columns:1fr}}
      `}</style>
    </section>
  );
}
