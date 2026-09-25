import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/Disclaimer";
import { DEFAULT_MODE, MODE_BOOT_SCRIPT } from "@/lib/modes";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "MEV Handbook", template: "%s · MEV Handbook" },
  description:
    "Strategy explainers and market-structure notes for MEV and trading on Solana: arbitrage, liquidations, JIT, market making, block building and more.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The boot script sets data-mode from localStorage before paint; React keeps the DOM's value.
    <html
      lang="en"
      data-mode={DEFAULT_MODE}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: MODE_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
