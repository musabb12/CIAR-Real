import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PropertyFinder — Global Real Estate Directory",
  description: "Discover your dream property across 5+ countries. Browse apartments, villas, offices, and more. Buy, rent, or find short-term stays with PropertyFinder.",
  keywords: ["real estate", "property", "buy home", "rent apartment", "villa", "luxury property", "PropertyFinder"],
  authors: [{ name: "PropertyFinder" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "PropertyFinder — Global Real Estate Directory",
    description: "Discover your dream property across 5+ countries. Browse, search, and find your perfect home.",
    siteName: "PropertyFinder",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
