"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLanguage } from "./language-provider";

type Initiative = { id: string; title: string; summary: string; track: "academic" | "community"; status: "draft" | "published" | "archived"; createdAt: string };
type TeamMember = { id: string; name: string; roleTitle: string; bio: string; isApproved: boolean; archivedAt: string | null; createdAt: string };
type Partner = { id: string; name: string; summary: string; website: string; status: "draft" | "published" | "archived"; createdAt: string };
type JoinRequest = { id: string; name: string; email: string; interest: "academic" | "community" | "both"; motivation: string; status: "pending" | "approved" | "rejected"; createdAt: string };
type StoreData = {
  inquiries: { id: string; name: string; email: string; type: string; subject: string; message: string; status: string; createdAt: string }[];
  joinRequests: JoinRequest[];
  initiatives: Initiative[];
  team: TeamMember[];
  partners: Partner[];
  siteStatus: string;
  audit: { id: string; action: string; createdAt: string }[];
};
const emptyData: StoreData = { inquiries: [], joinRequests: [], initiatives: [], team: [], partners: [], siteStatus: "published", audit: [] };
const sections = ["overview", "requests", "members", "initiatives", "partners", "inquiries", "content", "media", "exports", "audit", "settings", "access"];
const labels: Record<string, [string, string]> = {
  overview: ["نظرة عامة", "Overview"], requests: ["طلبات الانضمام", "Join requests"], members: ["الأعضاء والمنسقون", "Members & coordinators"],
  initiatives: ["المبادرات والأنشطة", "Initiatives"], partners: ["الشركاء", "Partners"], inquiries: ["الاستفسارات", "Inquiries"],
  content: ["محتوى الموقع", "Site content"], media: ["الوسائط", "Media"], exports: ["تصدير البيانات", "Data export"],
  audit: ["سجل التدقيق", "Audit log"], settings: ["إعدادات الموقع", "Site settings"], access: ["الصلاحيات", "Access & permissions"],
};

export function AdminDashboard({ previewEnabled }: { previewEnabled: boolean }) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const [active, setActive] = useState("overview");
  const [authenticated, setAuthenticated] = useState(false);
  const [data, setData] = useState<StoreData>(emptyData);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");

  async function load() {
    const response = await fetch("/api/admin", { cache: "no-store" });
    if (response.status === 401) { setAuthenticated(false); return; }
    if (!response.ok) throw new Error("load_failed");
    setData(await response.json());
    setAuthenticated(true);
  }
  useEffect(() => { load().catch(() => setError(ar ? "تعذر تحميل البيانات المحلية." : "Could not load local data.")); }, [ar]);

  async function startPreview(event: FormEvent) {
    event.preventDefault();
    try {
      const response = await fetch("/api/preview-login", { method: "POST" });
      if (!response.ok) { setError(ar ? "تعذر بدء المعاينة." : "Could not start preview."); return; }
      await load();
    } catch {
      setError(ar ? "تعذر الاتصال بالخادم المحلي." : "Could not reach the local server.");
    }
  }

  async function update(action: string, values: Record<string, string | boolean>) {
    setError("");
    setNotice("");
    const destructiveOrPublic = values.status === "published" || values.status === "archived" ||
      (action === "site-status" && values.status !== "published") ||
      (action === "team-status" && values.isApproved === true) ||
      action === "export-inquiries";
    if (destructiveOrPublic && !window.confirm(ar ? "هل تؤكد هذا الإجراء؟" : "Confirm this action?")) return;
    const method = action === "export-inquiries" || action.startsWith("create-") ? "POST" : "PATCH";
    try {
      const response = await fetch("/api/admin", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...values }),
      });
      if (!response.ok) {
        setError(ar ? "تعذر تنفيذ الإجراء. تحقق من الحقول وحاول مجددًا." : "The action failed. Check the fields and try again.");
        return;
      }
      if (action === "export-inquiries") {
        const file = await response.blob();
        const url = URL.createObjectURL(file);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "erth-inquiries.csv";
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setNotice(ar ? "تم إنشاء التصدير وتسجيله في سجل التدقيق." : "Export created and recorded in the audit log.");
      } else {
        setData(await response.json());
        setNotice(ar ? "تم حفظ التغيير." : "Changes saved.");
      }
    } catch {
      setError(ar ? "تعذر الاتصال بالخادم المحلي." : "Could not reach the local server.");
    }
  }

  const filteredInquiries = data.inquiries.filter((item) => `${item.name} ${item.email} ${item.subject}`.toLowerCase().includes(query.toLowerCase()));
  const title = labels[active][ar ? 0 : 1];

  if (!authenticated) return <main className="admin-login"><div className="admin-login-card"><span className="eyebrow eyebrow-green"><i />ERTH / ADMIN</span><h1>{ar ? "مساحة إدارة إرث" : "ERTH administration"}</h1><p>{previewEnabled ? (ar ? "هذه معاينة محلية للتطوير فقط، وليست تسجيل دخول آمنًا أو مصادقة إنتاجية." : "This is a local development preview only, not secure login or production authentication.") : (ar ? "لم تُفعّل مصادقة إنتاجية. المعاينة المحلية معطلة في بيئة الإنتاج." : "Production authentication is not configured. The local preview is disabled in production.")}</p><div className="preview-warning">{ar ? "لا تستخدم هذه المعاينة لإدارة بيانات حقيقية أو نشر الخدمة للعامة." : "Do not use this preview for real records or expose it publicly."}</div>{previewEnabled && <button className="button button-dark" onClick={(event) => void startPreview(event)}>{ar ? "بدء معاينة الإدارة المحلية" : "Start local admin preview"} <span>↗</span></button>}</div></main>;

  return <main className="admin-area"><div className="admin-shell">
    <aside className="admin-sidebar">
      <div className="admin-brand"><span className="wordmark-mark">إ</span><span><b>{ar ? "إرث" : "ERTH"}</b><small>{ar ? "لوحة الإدارة" : "ADMIN CONSOLE"}</small></span></div>
      <p className="admin-caption">{ar ? "إدارة المنظمة" : "ORGANIZATION"}</p>
      {sections.map((section) => <button key={section} className={`admin-nav-item ${active === section ? "selected" : ""}`} onClick={() => setActive(section)}><span className="nav-dot" />{labels[section][ar ? 0 : 1]}</button>)}
      <div className="sidebar-bottom"><span className="preview-pill">{ar ? "وضع معاينة محلي" : "LOCAL PREVIEW"}</span><button onClick={async () => { await fetch("/api/preview-login", { method: "DELETE" }); setAuthenticated(false); }}>{ar ? "إنهاء المعاينة" : "End preview"}</button></div>
    </aside>
    <section className="admin-main">
      <div className="admin-topbar"><div><span className="eyebrow eyebrow-green"><i />{ar ? "إدارة إرث" : "ERTH ADMIN"}</span><h1>{title}</h1></div><span className="preview-pill">{ar ? "بيانات محلية" : "LOCAL DATA"}</span></div>
      {error && <div className="admin-alert" role="alert">{error}</div>}{notice && <div className="admin-success" role="status">{notice}</div>}
      {active === "overview" && <><div className="admin-stats"><Stat label={ar ? "الاستفسارات" : "Inquiries"} value={data.inquiries.length} /><Stat label={ar ? "المبادرات المنشورة" : "Published initiatives"} value={data.initiatives.filter((item) => item.status === "published").length} /><Stat label={ar ? "أعضاء الفريق المنشورون" : "Public team profiles"} value={data.team.filter((item) => item.isApproved && !item.archivedAt).length} /><Stat label={ar ? "الشركاء المنشورون" : "Published partners"} value={data.partners.filter((item) => item.status === "published").length} /></div><div className="admin-panel"><h2>{ar ? "مساحة العمل" : "Workspace"}</h2><p>{ar ? "الأرقام أدناه مأخوذة من البيانات المحلية الفعلية فقط. لا تُستخدم إحصاءات تجريبية." : "Counts reflect actual local records only; no sample statistics are shown."}</p><div className="admin-quick-links">{sections.slice(1).map((section) => <button key={section} onClick={() => setActive(section)}>{labels[section][ar ? 0 : 1]} <span>↗</span></button>)}</div></div></>}
      {active === "inquiries" && <div className="admin-panel"><div className="panel-toolbar"><div><h2>{ar ? "رسائل التواصل" : "Contact inquiries"}</h2><p>{ar ? "الرسائل خاصة ولا تظهر على الموقع العام." : "Private messages are never displayed on the public site."}</p></div><input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ar ? "بحث بالاسم أو الموضوع" : "Search name or subject"} aria-label={ar ? "بحث" : "Search"} /></div>{filteredInquiries.length ? <div className="inquiry-list">{filteredInquiries.map((item) => <article className="inquiry-row" key={item.id}><div className="inquiry-meta"><strong>{item.subject}</strong><span>{item.name} · <a href={`mailto:${item.email}`}>{item.email}</a></span><span>{new Date(item.createdAt).toLocaleString(ar ? "ar" : "en")}</span><p>{item.message}</p></div><select aria-label={ar ? "حالة الاستفسار" : "Inquiry status"} value={item.status} onChange={(event) => void update("inquiry-status", { id: item.id, status: event.target.value })}><option value="new">{ar ? "جديد" : "New"}</option><option value="in_progress">{ar ? "قيد المتابعة" : "In progress"}</option><option value="closed">{ar ? "مغلق" : "Closed"}</option></select></article>)}</div> : <Empty ar={ar} text={ar ? "لا توجد استفسارات محفوظة بعد." : "No inquiries have been received yet."} />}</div>}
      {active === "initiatives" && <RecordEditor kind="initiatives" data={data} ar={ar} onAction={update} />}
      {active === "members" && <RecordEditor kind="members" data={data} ar={ar} onAction={update} />}
      {active === "partners" && <RecordEditor kind="partners" data={data} ar={ar} onAction={update} />}
      {active === "settings" && <div className="admin-panel"><h2>{ar ? "حالة الموقع العام" : "Public site status"}</h2><p>{ar ? "اختر الحالة التي يراها زوار الموقع. تبقى الإدارة متاحة." : "Choose the status visitors see. The admin area remains available."}</p><label className="status-select">{ar ? "حالة الموقع" : "Site status"}<select value={data.siteStatus} onChange={(event) => void update("site-status", { status: event.target.value })}><option value="published">{ar ? "منشور" : "Published"}</option><option value="maintenance">{ar ? "صيانة" : "Maintenance"}</option><option value="temporarily_closed">{ar ? "مغلق مؤقتًا" : "Temporarily closed"}</option></select></label><p className="muted-note">{ar ? "تظهر حالة الصيانة للزوار مع استمرار إتاحة لوحة الإدارة." : "The public site displays a status notice while the admin remains accessible."}</p></div>}
      {active === "exports" && <div className="admin-panel"><h2>{ar ? "تصدير بيانات الاستفسارات" : "Export inquiry data"}</h2><p>{ar ? "يشمل التصدير الاسم والبريد ونوع الاستفسار والموضوع والحالة وتاريخ الإرسال، ولا يتضمن نص الرسالة." : "Exports name, email, type, subject, status, and timestamp; message bodies are excluded."}</p><button className="button button-dark" onClick={() => void update("export-inquiries", {})}>{ar ? "إنشاء ملف CSV" : "Create CSV export"} <span>↗</span></button></div>}
      {active === "audit" && <div className="admin-panel"><h2>{ar ? "أحداث حساسة" : "Sensitive actions"}</h2>{data.audit.length ? <div className="audit-list">{data.audit.map((entry) => <p key={entry.id}><strong>{entry.action}</strong><time>{new Date(entry.createdAt).toLocaleString(ar ? "ar" : "en")}</time></p>)}</div> : <Empty ar={ar} text={ar ? "لا توجد أحداث مسجلة بعد." : "No events recorded yet."} />}</div>}
      {active === "requests" && <JoinRequests requests={data.joinRequests} ar={ar} onAction={update} />}
      {active === "content" && <Guidance title={title} ar={ar} text={ar ? "أدرج المبادرات والفريق والشركاء من أقسامهم. لا يمكن تعديل نصوص الصفحات الثابتة من هذه المعاينة." : "Manage initiatives, team, and partners in their own sections. Static page copy is not editable in this preview."} />}
      {active === "media" && <Guidance title={title} ar={ar} text={ar ? "لا توجد صور معتمدة. يتطلب رفع الوسائط خدمة تخزين خاصة وفحص الملفات وربط صلاحيات قبل التفعيل." : "No approved images are available. Media upload requires private storage, file validation, and authorization before activation."} />}
      {active === "access" && <Guidance title={title} ar={ar} text={ar ? "المدير وحده يدير الصلاحيات. لا توجد حسابات منسقين في البيانات المحلية؛ لا تمنح هذه المعاينة صلاحيات إنتاجية." : "Only the manager may control permissions. There are no coordinator accounts in local data; this preview grants no production access."} />}
    </section>
  </div></main>;
}

function RecordEditor({ kind, data, ar, onAction }: { kind: "initiatives" | "members" | "partners"; data: StoreData; ar: boolean; onAction: (action: string, values: Record<string, string | boolean>) => Promise<void> }) {
  const heading = kind === "initiatives" ? (ar ? "إضافة مبادرة" : "Add initiative") : kind === "members" ? (ar ? "إضافة عضو فريق" : "Add team member") : (ar ? "إضافة شريك" : "Add partner");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values: Record<string, string | boolean> = {};
    for (const [key, value] of new FormData(form).entries()) {
      if (typeof value === "string") values[key] = value;
    }
    const action = kind === "initiatives" ? "create-initiative" : kind === "members" ? "create-team-member" : "create-partner";
    const payload: Record<string, string | boolean> = { ...values };
    if (kind === "members") payload.isApproved = values.isApproved === "on";
    await onAction(action, payload);
    form.reset();
  }
  return <div className="admin-panel record-editor">
    <div className="panel-toolbar"><div><h2>{heading}</h2><p>{ar ? "أدخل سجلات حقيقية فقط. ستبقى العناصر الجديدة غير منشورة حتى اعتمادها." : "Add genuine records only. New items remain unpublished until approved."}</p></div></div>
    <form className="record-form" onSubmit={(event) => void submit(event)}>
      {kind === "initiatives" && <>
        <label>{ar ? "اسم المبادرة" : "Initiative title"}<input name="title" required minLength={3} maxLength={140} /></label>
        <label>{ar ? "المسار" : "Track"}<select name="track" required defaultValue="academic"><option value="academic">{ar ? "أكاديمي ابتكاري" : "Academic innovation"}</option><option value="community">{ar ? "مجتمعي" : "Community"}</option></select></label>
        <label className="wide">{ar ? "نبذة" : "Summary"}<textarea name="summary" required minLength={10} maxLength={1000} rows={3} /></label>
      </>}
      {kind === "members" && <>
        <label>{ar ? "الاسم" : "Name"}<input name="name" required minLength={2} maxLength={100} /></label>
        <label>{ar ? "المسمى" : "Role title"}<input name="roleTitle" required minLength={2} maxLength={100} /></label>
        <label className="wide">{ar ? "نبذة عامة" : "Public bio"}<textarea name="bio" maxLength={500} rows={3} /></label>
        <label className="wide consent-label"><input type="checkbox" name="isApproved" /><span>{ar ? "أكدت موافقة العضو على النشر العلني لهذه البيانات." : "The member has approved public display of this profile."}</span></label>
      </>}
      {kind === "partners" && <>
        <label>{ar ? "اسم الشريك" : "Partner name"}<input name="name" required minLength={2} maxLength={120} /></label>
        <label>{ar ? "الموقع الإلكتروني (اختياري)" : "Website (optional)"}<input name="website" type="url" maxLength={2048} placeholder="https://" /></label>
        <label className="wide">{ar ? "نبذة" : "Summary"}<textarea name="summary" maxLength={500} rows={3} /></label>
      </>}
      <button className="button button-dark">{ar ? "حفظ كمسودة" : "Save as draft"} <span>↗</span></button>
    </form>
    <RecordList kind={kind} data={data} ar={ar} onAction={onAction} />
  </div>;
}

function RecordList({ kind, data, ar, onAction }: { kind: "initiatives" | "members" | "partners"; data: StoreData; ar: boolean; onAction: (action: string, values: Record<string, string | boolean>) => Promise<void> }) {
  if (kind === "initiatives") return <div className="managed-records">{data.initiatives.length ? data.initiatives.map((item) => <article className="managed-row" key={item.id}><div><strong>{item.title}</strong><p>{item.summary}</p><small>{item.track === "academic" ? (ar ? "المسار الأكاديمي الابتكاري" : "Academic innovation") : (ar ? "المسار المجتمعي" : "Community track")}</small></div><select aria-label={ar ? "حالة المبادرة" : "Initiative status"} value={item.status} onChange={(event) => void onAction("initiative-status", { id: item.id, status: event.target.value })}><option value="draft">{ar ? "مسودة" : "Draft"}</option><option value="published">{ar ? "منشور" : "Published"}</option><option value="archived">{ar ? "مؤرشف" : "Archived"}</option></select></article>) : <Empty ar={ar} text={ar ? "لا توجد مبادرات محفوظة بعد." : "No initiatives saved yet."} />}</div>;
  if (kind === "members") return <div className="managed-records">{data.team.length ? data.team.map((member) => <article className="managed-row" key={member.id}><div><strong>{member.name} · {member.roleTitle}</strong><p>{member.bio || (ar ? "لا توجد نبذة عامة." : "No public bio provided.")}</p></div><label className="approval-toggle"><input type="checkbox" checked={member.isApproved && !member.archivedAt} onChange={(event) => void onAction("team-status", { id: member.id, isApproved: event.target.checked })} /><span>{ar ? "موافق على النشر" : "Approved for public display"}</span></label></article>) : <Empty ar={ar} text={ar ? "لا توجد سجلات أعضاء بعد." : "No team records saved yet."} />}</div>;
  return <div className="managed-records">{data.partners.length ? data.partners.map((partner) => <article className="managed-row" key={partner.id}><div><strong>{partner.name}</strong><p>{partner.summary}</p>{partner.website && <a href={partner.website} target="_blank" rel="noreferrer">{partner.website}</a>}</div><select aria-label={ar ? "حالة الشريك" : "Partner status"} value={partner.status} onChange={(event) => void onAction("partner-status", { id: partner.id, status: event.target.value })}><option value="draft">{ar ? "مسودة" : "Draft"}</option><option value="published">{ar ? "منشور" : "Published"}</option><option value="archived">{ar ? "مؤرشف" : "Archived"}</option></select></article>) : <Empty ar={ar} text={ar ? "لا توجد شراكات مسجلة بعد." : "No partner records saved yet."} />}</div>;
}

function JoinRequests({ requests, ar, onAction }: { requests: JoinRequest[]; ar: boolean; onAction: (action: string, values: Record<string, string | boolean>) => Promise<void> }) {
  if (!requests.length) return <div className="admin-panel"><h2>{ar ? "طلبات الاهتمام الخاصة" : "Private applications"}</h2><Empty ar={ar} text={ar ? "لا توجد طلبات انضمام محفوظة بعد." : "No join applications have been received yet."} /><p className="muted-note">{ar ? "المعاينة المحلية لا تنشئ حسابات ولا تمنح صلاحيات عند مراجعة الطلب." : "Local review does not create accounts or grant permissions."}</p></div>;
  return <div className="admin-panel"><h2>{ar ? "طلبات الاهتمام الخاصة" : "Private applications"}</h2><p>{ar ? "الاعتماد هنا يحدّث حالة الطلب فقط؛ لا ينشئ حسابًا ولا يمنح صلاحيات." : "Review only updates application status; it does not create accounts or grant permissions."}</p>
    <div className="managed-records">{requests.map((request) => <article className="managed-row join-request-row" key={request.id}>
      <div><strong>{request.name} · <a href={`mailto:${request.email}`}>{request.email}</a></strong><small>{ar ? "الاهتمام: " : "Interest: "}{request.interest === "academic" ? (ar ? "أكاديمي ابتكاري" : "Academic innovation") : request.interest === "community" ? (ar ? "مجتمعي" : "Community") : (ar ? "كلا المسارين" : "Both tracks")} · {new Date(request.createdAt).toLocaleString(ar ? "ar" : "en")}</small><p>{request.motivation}</p></div>
      <select aria-label={ar ? "حالة طلب الانضمام" : "Application status"} value={request.status} onChange={(event) => void onAction("join-request-status", { id: request.id, status: event.target.value })}><option value="pending">{ar ? "قيد المراجعة" : "Pending"}</option><option value="approved">{ar ? "مقبول" : "Approved"}</option><option value="rejected">{ar ? "مرفوض" : "Rejected"}</option></select>
    </article>)}</div>
  </div>;
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="stat-card"><span>{label}</span><strong>{value}</strong></div>; }
function Empty({ ar, text }: { ar: boolean; text: string }) { return <div className="admin-empty"><span>✳</span><p>{text}</p><small>{ar ? "مساحة إرث، تُبنى على بيانات حقيقية." : "An ERTH workspace, built on real records."}</small></div>; }
function Guidance({ title, ar, text }: { title: string; ar: boolean; text: string }) { return <div className="admin-panel"><h2>{title}</h2><div className="admin-guidance">{text}</div></div>; }
