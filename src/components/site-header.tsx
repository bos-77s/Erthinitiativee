"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "./language-provider";

const links = {
  ar: [
    ["الرئيسية", "/"],
    ["عن إرث", "/about"],
    ["المسارات", "/tracks"],
    ["المشاريع", "/projects"],
    ["انضم إلينا", "/join"],
    ["الفريق", "/team"],
    ["تواصل معنا", "/contact"],
  ],
  en: [
    ["Home", "/"],
    ["About", "/about"],
    ["Tracks", "/tracks"],
    ["Projects", "/projects"],
    ["Join us", "/join"],
    ["Team", "/team"],
    ["Contact", "/contact"],
  ],
};

export function SiteHeader() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const nav = links[language];
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="wordmark" href="/" aria-label="ERTH home">
          <Image className="wordmark-logo" src="/8-removebg-preview.png" alt="شعار إرث | ERTH" width={52} height={52} />
          <span><b>إرث</b><small>ERTH · أثرٌ يمتد</small></span>
        </Link>
        <button className="menu-toggle" aria-label={language === "ar" ? "فتح القائمة" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
          <span />
          <span />
        </button>
        <nav className={`main-nav ${open ? "is-open" : ""}`} aria-label={language === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
          {nav.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
          <button className="language-switch" onClick={() => setLanguage(language === "ar" ? "en" : "ar")} aria-label={language === "ar" ? "Switch to English" : "التبديل إلى العربية"}>
            {language === "ar" ? "EN" : "عربي"}
          </button>
          <Link className="button button-small" href="/contact">{language === "ar" ? "ابدأ حوارًا" : "Start a conversation"} <span aria-hidden="true">↗</span></Link>
        </nav>
      </div>
    </header>
  );
}
