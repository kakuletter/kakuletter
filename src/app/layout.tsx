import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KAKULETTER - 匿名文通サービス",
  description: "住所を明かさずに文通できるサービス。IDを交換するだけで、匿名で手紙のやりとりができます。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-[#fbf8f3]">{children}</body>
    </html>
  );
}
