"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export default function NotFound() {
  const { language } = useLanguage();
  const ar = language === "ar";
  return <main className="not-found"><span className="eyebrow">ERTH / 404</span><h1>{ar ? "هذه الصفحة غير موجودة" : "This page could not be found"}</h1><p>{ar ? "قد يكون الرابط غير صحيح أو أن الصفحة نُقلت." : "The address may be incorrect or the page may have moved."}</p><Link href="/" className="button button-dark">{ar ? "العودة إلى الرئيسية" : "Back to home"} ↗</Link></main>;
}
