import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import "./landing.css";
import "./app-screens.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KAKULETTER | 想いと応援を一通に。",
  description:
    "KAKULETTERは、住所を明かさずに配信者・クリエイターへ本物の手紙と応援金を届けられるサービスです。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body>{children}</body>
    </html>
  );
}
