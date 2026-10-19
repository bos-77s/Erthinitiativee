import type { Metadata } from "next";
import { LanguageProvider } from "@/components/language-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "إرث | ERTH",
    template: "%s | إرث",
  },
  description: "إرث منظمة طلابية مستقلة تعمل على تطوير مبادرات أكاديمية ابتكارية ومجتمعية.",
  openGraph: {
    title: "إرث | ERTH",
    description: "نبني اليوم ما سيترك أثرًا غدًا.",
    type: "website",
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
