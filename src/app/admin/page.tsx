import { AdminDashboard } from "@/components/admin-dashboard";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "لوحة الإدارة | ERTH", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <><SiteHeader /><AdminDashboard previewEnabled={process.env.NODE_ENV !== "production"} /><SiteFooter /></>;
}
