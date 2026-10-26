"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "./language-provider";

export function SiteFooter() {
  const { language } = useLanguage();
  const ar = language === "ar";
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div><Link className="wordmark footer-wordmark" href="/"><Image className="wordmark-logo" src="/1-removebg-preview(1).png" alt="شعار إرث | ERTH" width={52} height={52} /><span><b>إرث</b><small>ERTH</small></span></Link><p>{ar ? "نبني اليوم ما سيترك أثرًا غدًا." : "Building today what will leave a mark tomorrow."}</p></div>
        <div><h3>{ar ? "استكشف" : "Explore"}</h3><Link href="/">{ar ? "الرئيسية" : "Home"}</Link><Link href="/about">{ar ? "عن إرث" : "About ERTH"}</Link><Link href="/tracks">{ar ? "مساراتنا" : "Our tracks"}</Link><Link href="/projects">{ar ? "المشاريع" : "Projects"}</Link><Link href="/join">{ar ? "انضم إلينا" : "Join us"}</Link><Link href="/team">{ar ? "الفريق" : "Team"}</Link></div>
        <div><h3>{ar ? "تواصل" : "Get in touch"}</h3><a href="mailto:infor.erth@gmail.com">infor.erth@gmail.com</a><Link href="/contact">{ar ? "الشراكات والاستفسارات" : "Partnerships & inquiries"}</Link><Link href="/privacy">{ar ? "الخصوصية والبيانات" : "Privacy & data"}</Link></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} ERTH | إرث</span><span>{ar ? "منظمة طلابية مستقلة" : "An independent student-led organization"}</span></div>
    </footer>
  );
}
