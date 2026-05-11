import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Playfair_Display,
  Tajawal,
  El_Messiri,
  Cairo,
} from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteDesignSync } from "@/components/theme/site-design-sync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

// Body Arabic font — clean, modern
const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  display: "swap",
  weight: ["400", "500", "700", "800", "900"],
});

// Elegant Arabic display font for headings
const elMessiri = El_Messiri({
  variable: "--font-el-messiri",
  subsets: ["arabic"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Modern Arabic font as a secondary option
const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "CIAR — دليل العقارات العالمي",
  description:
    "اكتشف العقار الفاخر الذي تحلم به في أكثر من 60 دولة مع CIAR. منصة عقارية فاخرة بأدوات ذكاء اصطناعي وتحليلات وقوائم موثقة.",
  keywords: ["عقارات", "شقق", "فلل", "بيوت", "استثمار عقاري", "CIAR"],
  authors: [{ name: "CIAR" }],
  icons: {
    icon: "/logo-transparent.png",
  },
  openGraph: {
    title: "CIAR — دليل العقارات العالمي",
    description:
      "اكتشف العقار الفاخر الذي تحلم به في أكثر من 60 دولة مع CIAR. منصة عقارية فاخرة بأدوات ذكاء اصطناعي وتحليلات وقوائم موثقة.",
    siteName: "CIAR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${tajawal.variable} ${elMessiri.variable} ${cairo.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SiteDesignSync />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
