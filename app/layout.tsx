import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Takipio | İşletme Takip Asistanı",
  description:
    "Takipio ile sipariş, müşteri, stok ve ödeme takibini tek panelden yönetin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
