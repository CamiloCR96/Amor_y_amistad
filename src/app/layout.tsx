import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import HeartsBackground from "@/components/HeartsBackground";

const display = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const year = new Date().getFullYear();

export const metadata: Metadata = {
  title: {
    default: `Amor y Amistad ${year}`,
    template: `%s · Amor y Amistad ${year}`,
  },
  description: "Una red de conexiones secretas para celebrar Amor y Amistad.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#120711",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body>
        <div className="bg" aria-hidden="true" />
        <HeartsBackground />
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
