import type { Metadata } from "next";
import { Exo_2 } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";

const exo2 = Exo_2({
  subsets: ["latin"],
  variable: "--font-exo2",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lost Saga Database",
  description: "Open-source Lost Saga heroes, gears, items, and assets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${exo2.variable} ${exo2.className} flex min-h-screen flex-col antialiased`}
      >
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
