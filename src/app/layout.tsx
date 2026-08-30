import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionProvider } from "@/context/SessionContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

export const viewport: Viewport = {
  themeColor: "#1b6ef5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Tedarila — B2B Ekipman Kiralama & Tedarik Pazaryeri",
  description:
    "Satın alma. İhtiyacın kadar, ihtiyacın süresince kirala. Tedarila ile etkinlik, fuar, teknoloji ve endüstriyel ekipman kiralama platformu.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tedarila",
  },
  icons: {
    icon: "/images/tedarila_logo.jpg",
    apple: "/images/tedarila_logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/images/tedarila_logo.jpg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-brand-500 selection:text-white pb-16 md:pb-0 overflow-x-hidden">
        <SessionProvider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
          <MobileBottomNav />
        </SessionProvider>
      </body>
    </html>
  );
}
