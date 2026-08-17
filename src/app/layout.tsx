import type { Metadata } from "next";
import { Montserrat, Newsreader } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import LegacyDataBanner from "@/components/LegacyDataBanner";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finansal Günlük",
  description: "Yatırım ve harcama takibi, AI destekli tarihsel analiz",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${montserrat.variable} ${newsreader.variable} h-full antialiased`}>
      <body className="min-h-full font-sans" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        <div className="relative min-h-screen">
          <div
            className="pointer-events-none fixed inset-0 z-0"
            style={{
              background: `
                radial-gradient(ellipse 700px 500px at 8% 8%, oklch(0.86 0.08 20 / 0.35), transparent 60%),
                radial-gradient(ellipse 600px 700px at 92% 15%, oklch(0.88 0.06 30 / 0.25), transparent 65%),
                radial-gradient(ellipse 900px 600px at 30% 95%, oklch(0.84 0.07 15 / 0.3), transparent 60%)
              `,
            }}
          />
          <div className="relative z-10 grid min-h-screen grid-cols-1 md:grid-cols-[248px_1fr]">
            <Sidebar />
            <div className="flex flex-col min-w-0">
              <TopHeader />
              <div className="px-6 pt-4 sm:px-10">
                <LegacyDataBanner />
              </div>
              <main className="flex-1 min-w-0">{children}</main>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
