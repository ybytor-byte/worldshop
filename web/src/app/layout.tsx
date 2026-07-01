import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "../components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WorldShop — Умное сравнение цен с ИИ",
  description: "Сравнивайте цены на Ozon, Wildberries, МВидео, DNS и Яндекс.Маркет с ИИ-аналитикой",
  other: {
    "verify-admitad": "0ce8014a49",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
        </Providers>
        <footer className="text-center text-[10px] py-3 text-theme-muted opacity-50">
          ePN
        </footer>
      </body>
    </html>
  );
}
