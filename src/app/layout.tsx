import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
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
      <body className={`${syne.variable} ${dmSans.variable} antialiased font-[var(--font-dm)]`}>
        {children}
      </body>
    </html>
  );
}
