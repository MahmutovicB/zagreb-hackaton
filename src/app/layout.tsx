import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";
import Preloader from "@/components/Preloader";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK"],
  weight: "variable",
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gdje Živjeti — Zagreb Neighborhood Intelligence",
  description: "AI-powered neighborhood matchmaker + real-time komunalni radar za Zagreb. Pronađite pravi kvart za život.",
  keywords: ["Zagreb", "stanovi", "kvartovi", "komunalni radovi", "AI", "pretraga"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hr" suppressHydrationWarning>
      <body className={`${fraunces.variable} ${dmSans.variable} antialiased font-[var(--font-dm)]`}>
        <Preloader />
        {children}
      </body>
    </html>
  );
}
