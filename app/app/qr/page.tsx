"use client";

import { useMemo, useState } from "react";

export default function QRPage() {
  const [productName, setProductName] = useState("Premium Kahve");
  const [sku, setSku] = useState("TKP-001");

  const qrUrl = useMemo(() => {
    const data = encodeURIComponent(`takipio://product/${sku}`);
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${data}`;
  }, [sku]);

  function handlePrint() {
    window.print();
  }

  return (
    <section>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">QR / Barkod Etiket</h1>
          <p className="mt-2 text-slate-500">
            Ürün adı üstte, QR ortada, küçük Takipio markası altta olacak şekilde etiket hazırla.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Etiketi Yazdır
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-slate-600">Ürün Adı</label>
          <input
            value={productName}
            onChange={(event) => setProductName(event.target.value)}
            className="mb-4 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
          />

          <label className="mb-2 block text-sm font-medium text-slate-600">SKU / Ürün Kodu</label>
          <input
            value={sku}
            onChange={(event) => setSku(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
          />

          <div className="mt-6 rounded-3xl bg-blue-50 p-5 text-sm text-slate-600">
            Kamera ile okutma modülü bir sonraki geliştirme paketinde bağlanacak.
          </div>
        </div>

        <div className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm">
          <div id="takipio-print-label" className="mx-auto flex min-h-[420px] w-[300px] flex-col items-center justify-between rounded-[28px] border border-slate-200 bg-white p-6 text-center">
            <div>
              <h2 className="text-xl font-black text-slate-950">{productName}</h2>
              <p className="mt-1 text-sm text-slate-500">{sku}</p>
            </div>

            <img src={qrUrl} alt="Takipio QR kod" className="h-[220px] w-[220px]" />

            <div>
              <p className="text-xs text-slate-400">Powered by</p>
              <strong className="text-blue-600">Takipio</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
