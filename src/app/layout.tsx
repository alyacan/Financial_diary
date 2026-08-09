import type { Metadata } from "next";
import { Montserrat, Newsreader } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
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
                radial-gradient(ellipse 800px 600px at 10% 5%, rgba(232, 252, 207, 0.95), transparent 70%),
                radial-gradient(ellipse 700px 700px at 90% 12%, rgba(150, 224, 114, 0.35), transparent 65%),
                radial-gradient(ellipse 1000px 700px at 40% 90%, rgba(61, 163, 93, 0.18), transparent 60%)
              `,
            }}
          />
          <div className="relative z-10 grid min-h-screen grid-cols-1 md:grid-cols-[248px_1fr]">
            <Sidebar />
            <div className="flex flex-col min-w-0">
              <TopHeader />
              <main className="flex-1 min-w-0">{children}</main>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
