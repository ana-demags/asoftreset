import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Sans, Inter, Plus_Jakarta_Sans, Sora, Figtree } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import RouteTransition from "./RouteTransition";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Gambarino: full typescale (display, headings, body, links, buttons). Place Gambarino-Regular.woff2 in public/fonts/ */
const gambarino = localFont({
  src: "../public/fonts/Gambarino-Regular.woff2",
  variable: "--font-serif",
  display: "swap",
});

/** Pairing options: refined sans for body text alongside Gambarino headings */
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
/** High-end sans: Geist / Inter vein */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
/** Body text: calm, refined sans (tracking-tight in globals) */
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "asoftreset",
  description: "a calm space for breathing and pattern composition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Figma capture script — remove when done */}
        <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${gambarino.variable} ${dmSans.variable} ${inter.variable} ${plusJakartaSans.variable} ${sora.variable} ${figtree.variable} antialiased`}
      >
        <RouteTransition>{children}</RouteTransition>
      </body>
    </html>
  );
}
