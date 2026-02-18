import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Switch to Inter for standard
import "./globals.css";
import { Navbar } from "./components/ui/Navbar";
import Footer from "./components/Footer";
import CookieBanner from "./components/ui/CookieBanner";

import { constructMetadata } from "./lib/seo";

const inter = Inter({ subsets: ["latin"] });

export const metadata = constructMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Navbar />
        {children}
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
