const suggestions = [
  "Bugün kritik stoğa düşen ürünleri kontrol et.",
  "Bekleyen faturaları satış ekranıyla eşleştir.",
  "Trendyol entegrasyonu bağlandığında stok senkronunu otomatikleştir.",
];

export default function GorkiAIPage() {
  return (
    <section>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-950">Gorki AI Asistan</h1>
        <p className="mt-2 text-slate-500">Takipio içinde işletme kararlarını hızlandıran akıllı yardımcı.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[32px] border border-blue-100 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-40 w-40 items-center justify-center rounded-[36px] bg-blue-50 text-6xl">
            🤖
          </div>
          <h2 className="text-xl font-black">Gorki burada</h2>
          <p className="mt-2 text-sm text-slate-500">
            Buraya senin gerçek Gorki robot görselini yerleştireceğiz.
          </p>
        </div>

        <div className="rounded-[32px] border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Bugünkü öneriler</h2>

          <div className="mt-5 space-y-3">
            {suggestions.map((suggestion) => (
              <div key={suggestion} className="rounded-3xl border border-slate-100 bg-slate-50 p-5 text-slate-600">
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
