import type { Metadata } from "next";
import { Outfit, Manrope, JetBrains_Mono, Space_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import NextAuthProvider from "./components/NextAuthProvider";
import RateLimitToast from "./components/RateLimitToast";
import RateLimitWidget from "./components/RateLimitWidget";
import FirstVisitModal from "./components/FirstVisitModal";

const displayFont = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const typewriterFont = Space_Mono({
  variable: "--font-typewriter",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const brandFont = localFont({
  src: "../public/fonts/Sukajan Brush.otf",
  variable: "--font-brand",
});

const jemberFont = localFont({
  src: "../public/fonts/Jember Sketch.ttf",
  variable: "--font-jember",
});

export const metadata: Metadata = {
  title: "Animix",
  description: "buat nonton dan baca, almost zero ads hehe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} ${typewriterFont.variable} ${brandFont.variable} ${jemberFont.variable} antialiased`}
      >
        <NextAuthProvider>
          {children}
          <RateLimitToast />
          <RateLimitWidget />
          <FirstVisitModal />
        </NextAuthProvider>
      </body>
    </html>
  );
}
