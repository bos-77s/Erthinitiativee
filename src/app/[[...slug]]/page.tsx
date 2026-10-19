import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicPage } from "@/components/public-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteStatusNotice } from "@/components/site-status-notice";

const pages: Record<string, Parameters<typeof PublicPage>[0]["page"]> = {
  "": "home",
  about: "about",
  tracks: "tracks",
  "tracks/academic": "academic",
  "tracks/community": "community",
  projects: "projects",
  join: "join",
  team: "team",
  contact: "contact",
  privacy: "privacy",
};

const titles: Record<string, [string, string]> = {
  "": ["إرث | نبني اليوم ما سيترك أثرًا غدًا", "ERTH | Building a lasting impact"],
  about: ["عن إرث", "About ERTH"],
  tracks: ["مسارات إرث", "ERTH tracks"],
  "tracks/academic": ["المسار الأكاديمي الابتكاري", "Academic Innovation Track"],
  "tracks/community": ["المسار المجتمعي", "Community Track"],
  projects: ["مشاريع إرث", "ERTH projects"],
  join: ["انضم إلى إرث", "Join ERTH"],
  team: ["فريق إرث", "The ERTH team"],
  contact: ["تواصل مع إرث", "Contact ERTH"],
  privacy: ["الخصوصية والبيانات", "Privacy & data"],
};

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
  const { slug = [] } = await params;
  const pageTitle = titles[slug.join("/")];
  if (!pageTitle) return {};
  return {
    title: pageTitle[0],
    description: slug.join("/") === "" ? pageTitle[1] : pageTitle[0],
    openGraph: { title: pageTitle[0], description: pageTitle[1], type: "website" },
  };
}

export default async function PublicRoute({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params;
  const key = slug.join("/");
  const page = pages[key];
  if (!page) notFound();
  return <><SiteStatusNotice /><SiteHeader /><PublicPage page={page} /><SiteFooter /></>;
}
