"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "./language-provider";

export function SiteStatusNotice() {
  const { language } = useLanguage();
  const [status, setStatus] = useState("published");
  useEffect(() => {
    let active = true;
    fetch("/api/site-status", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("status_unavailable");
        return response.json() as Promise<{ status: string }>;
      })
      .then((data) => { if (active) setStatus(data.status); })
      .catch(() => { if (active) setStatus("unknown"); });
    return () => { active = false; };
  }, []);
  if (status === "published") return null;
  const copy = language === "ar"
    ? status === "maintenance" ? ["الموقع قيد الصيانة", "نعمل على تحسين تجربتك. ستعود صفحاتنا قريبًا."] : status === "temporarily_closed" ? ["الموقع مغلق مؤقتًا", "نعود إليك قريبًا. للتواصل: infor.erth@gmail.com"] : ["حالة الموقع غير متاحة", "يرجى المحاولة لاحقًا أو التواصل عبر infor.erth@gmail.com"]
    : status === "maintenance" ? ["Maintenance in progress", "We’re making improvements. The public site will be back soon."] : status === "temporarily_closed" ? ["Temporarily closed", "We’ll be back soon. Contact infor.erth@gmail.com"] : ["Site status unavailable", "Please try again later or email infor.erth@gmail.com"];
  return <aside className="status-notice" role="status"><strong>{copy[0]}</strong><span>{copy[1]}</span></aside>;
}
