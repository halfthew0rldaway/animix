import type { Metadata } from "next";
import { Cinzel, Manrope, JetBrains_Mono, Space_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import NextAuthProvider from "./components/NextAuthProvider";
import RateLimitToast from "./components/RateLimitToast";
import RateLimitWidget from "./components/RateLimitWidget";

const displayFont = Cinzel({
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

export const metadata: Metadata = {
  title: "Animix",
  description: "Streaming anime mengikuti flow Juju Otaku 2.0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} ${typewriterFont.variable} ${brandFont.variable} antialiased`}
      >
        <NextAuthProvider>
          {children}
          <RateLimitToast />
          <RateLimitWidget />
        </NextAuthProvider>
      </body>
    </html>
  );
}
