import type { Metadata } from "next";
import { LanguageProvider } from "@/components/language-provider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.ERTH_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "إرث | ERTH",
    template: "%s | إرث",
  },
  description: "إرث منظمة طلابية مستقلة تعمل على تطوير مبادرات أكاديمية ابتكارية ومجتمعية.",
  openGraph: {
    title: "إرث | ERTH",
    description: "نبني اليوم ما سيترك أثرًا غدًا.",
    type: "website",
    images: [
      {
        url: "/8-removebg-preview.png",
        width: 500,
        height: 500,
        alt: "شعار إرث | ERTH",
      },
    ],
  },
  icons: {
    icon: "/8-removebg-preview.png",
    apple: "/8-removebg-preview.png",
  },
  twitter: {
    card: "summary",
    title: "إرث | ERTH",
    description: "نبني اليوم ما سيترك أثرًا غدًا.",
    images: ["/8-removebg-preview.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
