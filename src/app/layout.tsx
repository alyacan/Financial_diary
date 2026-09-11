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
    icon: [
      { url: "/icon.png?v=4", sizes: "any" },
      { url: "/icon-192.png?v=4", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png?v=4", sizes: "512x512", type: "image/png" },
      { url: "/favicon-32x32.png?v=4", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico?v=4" },
    ],
    apple: [
      { url: "/apple-touch-icon.png?v=4", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=4",
  },
  manifest: "/manifest.json?v=4",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Finansal Günlük",
  },
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
                radial-gradient(ellipse 750px 550px at 6% 6%, oklch(0.92 0.05 138 / 0.35), transparent 65%),
                radial-gradient(ellipse 650px 750px at 94% 12%, oklch(0.94 0.04 100 / 0.3), transparent 70%),
                radial-gradient(ellipse 950px 650px at 25% 95%, oklch(0.90 0.04 135 / 0.25), transparent 65%)
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
