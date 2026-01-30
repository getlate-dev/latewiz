import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "LateWiz - Social Media Scheduling Made Simple",
  description:
    "Your social media scheduling wizard. Schedule posts across 13 platforms with a single tool, powered by Late.",
  keywords: [
    "social media scheduler",
    "instagram scheduler",
    "tiktok scheduler",
    "twitter scheduler",
    "linkedin scheduler",
    "social media management",
    "content scheduling",
  ],
  authors: [{ name: "Late", url: "https://getlate.dev" }],
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "LateWiz - Social Media Scheduling Made Simple",
    description:
      "Your social media scheduling wizard. Schedule posts across 13 platforms with a single tool.",
    url: "https://latewiz.com",
    siteName: "LateWiz",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LateWiz - Social Media Scheduling Made Simple",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LateWiz - Social Media Scheduling Made Simple",
    description:
      "Your social media scheduling wizard. Schedule posts across 13 platforms with a single tool.",
    images: ["/og-image.png"],
  },
  metadataBase: new URL("https://latewiz.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
