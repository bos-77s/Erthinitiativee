"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useLanguage } from "./language-provider";

type PageKey = "home" | "about" | "tracks" | "academic" | "community" | "team" | "projects" | "join" | "contact" | "privacy";
type PublicRecords = {
  initiatives: { id: string; title: string; summary: string; track: "academic" | "community" }[];
  team: { id: string; name: string; roleTitle: string; bio: string }[];
  partners: { id: string; name: string; summary: string; website: string }[];
};
const emptyRecords: PublicRecords = { initiatives: [], team: [], partners: [] };

const content = {
  ar: {
    home: {
      eyebrow: "منظمة طلابية مستقلة",
      title: <>نزرع فكرة،<br /><em>ونرعى أثرًا.</em></>,
      intro: "نبني اليوم ما سيترك أثرًا غدًا.",
      description: "إرث مساحة للمبادرات الأكاديمية الابتكارية والمجتمعية؛ نؤمن أن التغيير يبدأ بخطوة واعية وعمل مشترك.",
      cta: "اكتشف مساراتنا",
      secondary: "تواصل مع إرث",
      sections: ["فكرة تنمو مع أصحابها", "مساران، وغاية واحدة", "مساحة لأثرٍ يصنعه الجميع"],
      story: "إرث منظمة طلابية مستقلة تطوّر مبادرات أكاديمية ومجتمعية. نعمل على تحويل الاهتمامات إلى تجارب ذات معنى، بالتعلّم والتعاون والعمل المسؤول.",
      initiatives: "تُضاف المبادرات هنا بعد اعتمادها ونشرها من خلال فريق إرث.",
    },
    about: { title: "عن إرث", intro: "أثرٌ يبدأ من فكرة ويكبر بالعمل.", description: "إرث منظمة طلابية مستقلة تعمل على تطوير مبادرات أكاديمية ابتكارية ومجتمعية. نؤمن بقدرة الطلاب على بناء تجارب نافعة حين تتاح لهم مساحة للتعلم والتعاون والمبادرة.", sections: ["رؤيتنا", "رسالتنا", "قيمنا"], story: "أن نكون مساحة مستدامة للأفكار التي تعلّم، وتبتكر، وتقوّي الروابط المجتمعية.", initiatives: "تطوير مبادرات يقودها الطلاب، والتعلّم بالممارسة، وبناء أثر مجتمعي مسؤول." },
    tracks: { title: "مسارات إرث", intro: "طريقان يلتقيان عند أثرٍ أفضل.", description: "نفتح المجال للأفكار الأكاديمية أن تبتكر، وللمبادرات المجتمعية أن تقرّب الناس وتستجيب لاحتياجاتهم.", sections: ["المسار الأكاديمي الابتكاري", "المسار المجتمعي"], story: "مساراتنا تتكامل؛ فالمعرفة تلهم العمل، والمجتمع يمنح الأفكار معناها.", initiatives: "لا توجد مبادرات منشورة حتى الآن. ستظهر هنا المبادرات المعتمدة." },
    academic: { title: "المسار الأكاديمي الابتكاري", intro: "نتعلّم، نتساءل، ونبتكر.", description: "مساحة لتطوير أفكار وتجارب تثري التعلّم الأكاديمي، وتشجّع البحث والتفكير الإبداعي والعمل التعاوني.", sections: ["تعلّم بالممارسة", "تفكير ابتكاري", "معرفة مشتركة"], story: "نعمل على إتاحة فرص للمبادرة والتجربة، مع مراجعة كل فكرة وتطويرها بمسؤولية.", initiatives: "ستُنشر تفاصيل المبادرات الأكاديمية بعد اعتمادها." },
    community: { title: "المسار المجتمعي", intro: "نصنع مساحة أقرب لبعضنا.", description: "مسار يركز على مبادرات تعزز المشاركة والتواصل وتستجيب لاحتياجات المجتمع بروح من التعاون والمسؤولية.", sections: ["مشاركة فاعلة", "تعاون وشراكة", "استجابة مسؤولة"], story: "نبدأ بالاستماع، ونصمم المبادرات بالتعاون مع أصحاب العلاقة، ونشارك تفاصيلها بعد اعتمادها.", initiatives: "ستُنشر تفاصيل المبادرات المجتمعية بعد اعتمادها." },
    projects: { title: "مشاريع إرث", intro: "أفكار تتحول إلى عملٍ مشترك.", description: "تعرض هذه الصفحة المشاريع والمبادرات التي اعتمدها فريق إرث للنشر. لا نعرض هنا سجلات تجريبية أو غير معتمدة.", sections: ["المشاريع المنشورة"], story: "تُنشر تفاصيل كل مشروع بعد اعتماده والتحقق من محتواه.", initiatives: "لا توجد مشاريع منشورة حاليًا. نعمل على بناء المبادرات القادمة." },
    join: { title: "انضم إلى إرث", intro: "لكل أثرٍ بداية، وقد تكون بدايتها هنا.", description: "أرسل طلب اهتمامك بالانضمام إلى العمل الطلابي في إرث. إرسال الطلب لا ينشئ حسابًا ولا يمنح صلاحيات؛ يراجعه الفريق يدويًا.", sections: ["طلب اهتمام"], story: "سنستخدم بياناتك لمراجعة طلبك والتواصل بشأنه. تُحفظ طلبات نسخة التطوير محليًا، ولا تظهر في الصفحات العامة.", initiatives: "الانضمام لا يمنح تلقائيًا حسابًا أو صلاحيات إدارية." },
    team: { title: "فريق إرث", intro: "أشخاص حقيقيون، وأثرٌ نصنعه معًا.", description: "نحتفي بالمشاركة والعمل الجماعي، وننشر هنا فقط أعضاء الفريق الذين وافقوا على الظهور علنًا.", sections: ["مساحة الفريق قيد التشكيل"], story: "لا توجد ملفات أعضاء معتمدة للنشر حاليًا. ستظهر هنا المعلومات التي يوافق أصحابها على مشاركتها.", initiatives: "لا نعرض بيانات تجريبية أو أسماء افتراضية." },
    contact: { title: "لنتحدث", intro: "فكرة أو سؤال؟ يسعدنا أن نسمع منك.", description: "للاستفسارات العامة أو مقترحات التعاون والشراكة، أرسل رسالتك عبر النموذج أو راسلنا مباشرة.", sections: ["بريد التواصل", "الخصوصية أولًا"], story: "نستخدم بياناتك للرد على رسالتك فقط، ونحتفظ بها محليًا في نسخة التطوير. اطّلع على إشعار الخصوصية لمعرفة الحدود الحالية.", initiatives: "البريد: infor.erth@gmail.com" },
    privacy: { title: "الخصوصية والبيانات", intro: "نجمع الحد الأدنى اللازم للرد.", description: "يُستخدم الاسم والبريد ونوع الاستفسار والموضوع والرسالة وموافقتك للرد على الطلب. في هذه النسخة المحلية، تحفظ الرسائل على جهاز/خادم التطوير ولا تُرسل إلى خدمة خارجية.", sections: ["الغرض", "الاحتفاظ", "الحقوق"], story: "احذف مجلد .local-data يدويًا لإزالة بيانات التطوير. قبل الإطلاق، يجب اعتماد سياسة احتفاظ وخصوصية ومراجعتها قانونيًا وفق الولاية المختصة.", initiatives: "هذه ملاحظة تطويرية وليست سياسة امتثال قانوني." },
  },
  en: {
    home: { eyebrow: "Independent student-led organization", title: <>A seed of thought.<br /><em>A lasting impact.</em></>, intro: "Building today what will leave a mark tomorrow.", description: "ERTH is a home for academic innovation and community initiatives. We believe meaningful change begins with thoughtful action and shared work.", cta: "Explore our tracks", secondary: "Get in touch", sections: ["Ideas grow with their people", "Two tracks, one purpose", "A space for shared impact"], story: "ERTH is an independent student-led organization developing academic and community initiatives. We turn interests into meaningful experiences through learning, collaboration, and responsible action.", initiatives: "Initiatives will appear here after the ERTH team reviews and publishes them." },
    about: { title: "About ERTH", intro: "Impact starts with an idea and grows through action.", description: "ERTH is an independent student-led organization developing academic innovation and community initiatives. We believe students can build meaningful experiences when given room to learn, collaborate, and take initiative.", sections: ["Our vision", "Our mission", "Our values"], story: "To be a lasting space for ideas that help people learn, innovate, and strengthen community ties.", initiatives: "Develop student-led initiatives, learn by doing, and build responsible community impact." },
    tracks: { title: "ERTH tracks", intro: "Two paths, meeting at a better impact.", description: "We make room for academic ideas to innovate and community initiatives to bring people together and respond to needs.", sections: ["Academic Innovation Track", "Community Track"], story: "Our tracks complement one another: knowledge inspires action, and community gives ideas meaning.", initiatives: "No initiatives are published yet. Approved initiatives will appear here." },
    academic: { title: "Academic Innovation Track", intro: "Learn, question, and create.", description: "A space to develop ideas and experiences that enrich academic learning and encourage research, creative thinking, and collaboration.", sections: ["Learning by doing", "Innovative thinking", "Shared knowledge"], story: "We create room to try and learn, reviewing each idea and developing it responsibly.", initiatives: "Academic initiative details will be shared after approval." },
    community: { title: "Community Track", intro: "Make room to come closer.", description: "A track for initiatives that encourage participation, connection, and responsible responses to community needs.", sections: ["Active participation", "Collaboration", "Thoughtful response"], story: "We start by listening, design initiatives with relevant people, and share details after approval.", initiatives: "Community initiative details will be shared after approval." },
    projects: { title: "ERTH projects", intro: "Ideas becoming shared work.", description: "This page lists projects and initiatives approved for public display by the ERTH team. No demonstration or unapproved records are shown.", sections: ["Published projects"], story: "Project details are shared only after the team has reviewed and approved them.", initiatives: "There are no published projects yet. Future approved initiatives will appear here." },
    join: { title: "Join ERTH", intro: "Every impact has a beginning. Yours could start here.", description: "Share your interest in joining ERTH’s student-led work. Submitting a request does not create an account or grant permissions; applications are reviewed by the team.", sections: ["Expression of interest"], story: "Your details are used to review your application and contact you about it. Development applications are stored locally and never shown on public pages.", initiatives: "Joining does not automatically create an account or grant admin access." },
    team: { title: "The ERTH team", intro: "Real people, building impact together.", description: "We value participation and shared work. Only team members who have approved public display will be featured here.", sections: ["Our team is taking shape"], story: "There are no approved public team profiles yet. Profiles will appear here only with their owners’ consent.", initiatives: "We do not display demonstration data or invented names." },
    contact: { title: "Let’s talk", intro: "An idea or a question? We’d love to hear from you.", description: "For general inquiries or collaboration and partnership proposals, send a note or email us directly.", sections: ["Contact email", "Privacy first"], story: "Your details are used to respond to your message. In this development version, they stay in local storage. See our privacy notice for current limitations.", initiatives: "Email: infor.erth@gmail.com" },
    privacy: { title: "Privacy & data", intro: "We collect only what we need to reply.", description: "Your name, email, inquiry type, subject, message, and consent are used to respond. In this local version, inquiries are stored on the development device/server and are not sent to an external service.", sections: ["Purpose", "Retention", "Your choices"], story: "Remove the .local-data folder manually to clear development data. Before launch, a retention and privacy policy must be approved and reviewed for applicable law.", initiatives: "This development notice is not a claim of legal compliance." },
  },
};

export function PublicPage({ page }: { page: PageKey }) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const data = content[language][page];
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [formError, setFormError] = useState("");
  const [joinStatus, setJoinStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [joinError, setJoinError] = useState("");
  const [records, setRecords] = useState<PublicRecords>(emptyRecords);
  const home = page === "home";
  useEffect(() => {
    let active = true;
    fetch("/api/public-content", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("content_unavailable");
        return response.json() as Promise<PublicRecords>;
      })
      .then((value) => { if (active) setRecords(value); })
      .catch(() => { if (active) setRecords(emptyRecords); });
    return () => { active = false; };
  }, []);

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setFormError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    payload.consent = form.get("consent") === "on" ? "true" : "false";
    const formElement = event.currentTarget;
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, consent: payload.consent === "true" }),
      });
      if (!response.ok) throw new Error(response.status === 429 ? "rate_limited" : "request_failed");
      formElement.reset();
      setStatus("success");
    } catch (error) {
      setFormError(error instanceof Error && error.message === "rate_limited"
        ? (ar ? "محاولات كثيرة. يرجى الانتظار قليلًا." : "Too many attempts. Please wait a moment.")
        : (ar ? "تعذر إرسال الرسالة. حاول لاحقًا أو راسلنا عبر البريد." : "Could not send your message. Please try again or email us."));
      setStatus("error");
    }
  }

  async function submitJoinApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setJoinStatus("sending");
    setJoinError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/join-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          interest: form.get("interest"),
          motivation: form.get("motivation"),
          consent: form.get("consent") === "on",
          website: form.get("website"),
        }),
      });
      if (!response.ok) throw new Error(response.status === 429 ? "rate_limited" : "request_failed");
      formElement.reset();
      setJoinStatus("success");
    } catch (error) {
      setJoinError(error instanceof Error && error.message === "rate_limited"
        ? (ar ? "وصلنا الحد المؤقت للطلبات. يرجى الانتظار ثم المحاولة." : "The temporary request limit was reached. Please wait and try again.")
        : (ar ? "تعذر إرسال الطلب. يرجى المحاولة لاحقًا." : "Could not submit your request. Please try again later."));
      setJoinStatus("error");
    }
  }

  return (
    <>
      <main>
        <section className={`hero ${home ? "hero-home" : "hero-inner"}`}>
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
          <div className="container hero-content">
            {"eyebrow" in data && data.eyebrow && <span className="eyebrow"><i />{data.eyebrow}</span>}
            <h1>{home ? data.title : data.title}</h1>
            <p className="hero-intro">{data.intro}</p>
            <p className="hero-description">{data.description}</p>
            {home && "cta" in data && <div className="hero-actions"><Link className="button button-light" href="/tracks">{data.cta}<span>↗</span></Link><Link className="text-link text-link-light" href="/contact">{data.secondary}<span>→</span></Link></div>}
            {home && <Link className="hero-join-link" href="/join">{ar ? "انضم إلى إرث" : "Join ERTH"} <span aria-hidden="true">↗</span></Link>}
            <span className="hero-index">{home ? "01 — 02" : `ERTH / ${page.toUpperCase()}`}</span>
          </div>

        </section>

        {home ? (
          <>
            <section className="section intro-section"><div className="container intro-grid"><span className="eyebrow eyebrow-green"><i />{ar ? "لماذا إرث؟" : "WHY ERTH"}</span><div><h2>{data.sections[0]}</h2><p>{data.story}</p><Link className="text-link" href="/about">{ar ? "تعرّف علينا" : "Get to know us"} <span>↗</span></Link></div><span className="intro-stamp">ERTH<br />إرث</span></div></section>
            <section className="section tracks-section"><div className="container"><div className="section-heading"><div><span className="eyebrow eyebrow-green"><i />{ar ? "مساراتنا" : "OUR TRACKS"}</span><h2>{data.sections[1]}</h2></div><Link href="/tracks" className="text-link">{ar ? "كل المسارات" : "All tracks"} <span>↗</span></Link></div><div className="track-grid"><TrackCard number="01" title={ar ? "المسار الأكاديمي الابتكاري" : "Academic Innovation Track"} desc={ar ? "أفكار وتجارب تثري التعلّم وتفتح آفاق الابتكار." : "Ideas and experiences that enrich learning and open new possibilities."} href="/tracks/academic" tone="green" /><TrackCard number="02" title={ar ? "المسار المجتمعي" : "Community Track"} desc={ar ? "مبادرات تصل الناس وتستجيب لاحتياجات المجتمع." : "Initiatives that connect people and respond to community needs."} href="/tracks/community" tone="ivory" /></div></div></section>
            <section className="story-section"><div className="container story-grid"><div className="story-art"><span className="art-ring ring-a" /><span className="art-ring ring-b" /><span className="art-seed">
  <img
    src="/1-removebg-preview(1).png"
    alt={ar ? "شعار إرث" : "ERTH logo"}
    className="story-logo"
  />
</span><span className="art-caption">{ar ? "فكرة تنمو" : "Ideas take root"}</span></div><div className="story-copy"><span className="eyebrow"><i />{ar ? "حكاية إرث" : "THE ERTH STORY"}</span><h2>{data.sections[2]}</h2><p>{data.story}</p><Link className="text-link text-link-light" href="/about">{ar ? "اقرأ المزيد" : "Read more"} <span>↗</span></Link></div></div></section>
            <section className="section quiet-section"><div className="container quiet-grid"><div><span className="eyebrow eyebrow-green"><i />{ar ? "مبادرات وأنشطة" : "INITIATIVES & ACTIVITIES"}</span><h2>{ar ? "أثرٌ ينمو، خطوة بخطوة." : "Impact grows, one step at a time."}</h2></div><PublicInitiatives records={records.initiatives} ar={ar} emptyText={data.initiatives} /></div></section>
            <section className="section public-team-section"><div className="container"><div className="section-heading"><div><span className="eyebrow eyebrow-green"><i />{ar ? "الفريق" : "THE TEAM"}</span><h2>{ar ? "مساحة نعمل فيها معًا." : "A space to work together."}</h2></div><Link href="/team" className="text-link">{ar ? "تعرّف على الفريق" : "Meet the team"} <span>↗</span></Link></div><PublicTeam records={records.team} ar={ar} /></div></section>
            <section className="section gallery-section"><div className="container gallery-grid"><div><span className="eyebrow eyebrow-green"><i />{ar ? "من الذاكرة" : "FROM THE ERTH ARCHIVE"}</span><h2>{ar ? "لحظات من عملنا." : "Moments from our work."}</h2><p>{ar ? "ستظهر هنا الصور الأصلية التي يعتمدها الفريق. لا توجد صور أنشطة معتمدة للنشر حاليًا." : "Only original, approved images will appear here. No activity photos are approved for publication yet."}</p></div><div className="gallery-art" aria-label={ar ? "عنصر بصري تجريدي، ليس صورة نشاط" : "Abstract artwork, not an activity photo"}><span className="gallery-shape shape-a" /><span className="gallery-shape shape-b" /><span className="gallery-shape shape-c" /><small>{ar ? "مساحة مخصصة للصور المعتمدة" : "SPACE FOR APPROVED PHOTOGRAPHS"}</small></div></div></section>
            <section className="section partners-section"><div className="container"><div className="section-heading"><div><span className="eyebrow eyebrow-green"><i />{ar ? "شراكات" : "PARTNERSHIPS"}</span><h2>{ar ? "التعاون يبدأ بحوار." : "Collaboration starts with a conversation."}</h2></div><Link href="/contact" className="text-link">{ar ? "تواصل معنا" : "Get in touch"} <span>↗</span></Link></div><PublicPartners records={records.partners} ar={ar} /></div></section>
            <ContactCta ar={ar} />
          </>
        ) : page === "projects" ? (
          <section className="section detail-section"><div className="container projects-page"><div><span className="eyebrow eyebrow-green"><i />{ar ? "مشاريع إرث" : "ERTH PROJECTS"}</span><h2>{data.sections[0]}</h2><p>{data.description}</p></div><ProjectListing records={records.initiatives} ar={ar} emptyText={data.initiatives} /></div></section>
        ) : page === "join" ? (
          <section className="section contact-section"><div className="container contact-grid"><div><span className="eyebrow eyebrow-green"><i />{ar ? "انضم إلى إرث" : "JOIN ERTH"}</span><h2>{ar ? "مساحة للمبادرة والتعلّم." : "Room to learn and take initiative."}</h2><p>{data.description}</p><div className="privacy-note">{data.story} {data.initiatives}</div></div><JoinForm ar={ar} status={joinStatus} error={joinError} onSubmit={submitJoinApplication} /></div></section>
        ) : page === "contact" ? (
          <section className="section contact-section"><div className="container contact-grid"><div><span className="eyebrow eyebrow-green"><i />{ar ? "تواصل معنا" : "CONTACT ERTH"}</span><h2>{ar ? "كل حوار يبدأ برسالة." : "Every conversation starts somewhere."}</h2><p>{data.description}</p><a className="email-link" href="mailto:infor.erth@gmail.com">infor.erth@gmail.com <span>↗</span></a><div className="privacy-note">{data.story}</div></div><InquiryForm ar={ar} status={status} formError={formError} onSubmit={submitInquiry} /></div></section>
        ) : (
          <>
            <section className="section detail-section"><div className="container detail-grid"><span className="eyebrow eyebrow-green"><i />{ar ? "من نحن" : "ABOUT US"}</span><div><h2>{data.sections[0]}</h2><p>{data.story}</p><div className="principle-list">{data.sections.map((item, index) => <div className="principle" key={item}><span>0{index + 1}</span><strong>{item}</strong><i>↗</i></div>)}</div><p className="detail-extra">{data.initiatives}</p>{page === "tracks" && <div className="track-grid detail-tracks"><TrackCard number="01" title={ar ? "المسار الأكاديمي الابتكاري" : "Academic Innovation Track"} desc={content[language].academic.description} href="/tracks/academic" tone="green" /><TrackCard number="02" title={ar ? "المسار المجتمعي" : "Community Track"} desc={content[language].community.description} href="/tracks/community" tone="ivory" /></div>}{["tracks", "academic", "community"].includes(page) && <PublicInitiatives records={records.initiatives.filter((item) => page === "academic" ? item.track === "academic" : page === "community" ? item.track === "community" : true)} ar={ar} emptyText={data.initiatives} />}{page === "team" && <PublicTeam records={records.team} ar={ar} emptyText={data.initiatives} />}</div></div></section>
            <ContactCta ar={ar} />
          </>
        )}
      </main>
    </>
  );
}

function TrackCard({ number, title, desc, href, tone }: { number: string; title: string; desc: string; href: string; tone: "green" | "ivory" }) {
  return <Link className={`track-card track-${tone}`} href={href}><span className="track-number">{number} / ERTH</span><div className="track-icon">{number === "01" ? "⌁" : "✳"}</div><h3>{title}</h3><p>{desc}</p><span className="track-arrow">↗</span></Link>;
}

function PublicInitiatives({ records, ar, emptyText }: { records: PublicRecords["initiatives"]; ar: boolean; emptyText?: string }) {
  if (!records.length) return <div className="empty-feature"><span className="empty-symbol">✳</span><p>{emptyText ?? (ar ? "لا توجد مبادرات معتمدة للنشر حاليًا." : "There are no approved initiatives to display yet.")}</p><Link className="text-link" href="/contact">{ar ? "اقترح مبادرة" : "Suggest an initiative"} <span>↗</span></Link></div>;
  return <div className="public-record-list">{records.map((item) => <article className="public-record-card" key={item.id}><span>{item.track === "academic" ? (ar ? "المسار الأكاديمي الابتكاري" : "Academic innovation") : (ar ? "المسار المجتمعي" : "Community track")}</span><h3>{item.title}</h3><p>{item.summary}</p></article>)}</div>;
}

function ProjectListing({ records, ar, emptyText }: { records: PublicRecords["initiatives"]; ar: boolean; emptyText: string }) {
  if (!records.length) return <div className="projects-empty"><span aria-hidden="true">✳</span><h3>{ar ? "لا توجد مشاريع منشورة بعد" : "No projects published yet"}</h3><p>{emptyText}</p></div>;
  return <div className="public-record-list">{records.map((project) => <article className="public-record-card" key={project.id}><span>{project.track === "academic" ? (ar ? "المسار الأكاديمي الابتكاري" : "Academic innovation") : (ar ? "المسار المجتمعي" : "Community track")}</span><h3>{project.title}</h3><p>{project.summary}</p></article>)}</div>;
}

function JoinForm({ ar, status, error, onSubmit }: { ar: boolean; status: string; error: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form className="inquiry-form" onSubmit={onSubmit}>
    <div className="form-row">
      <label>{ar ? "الاسم" : "Name"}<input name="name" required minLength={2} maxLength={100} autoComplete="name" /></label>
      <label>{ar ? "البريد الإلكتروني" : "Email"}<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
    </div>
    <label>{ar ? "المسار محل الاهتمام" : "Area of interest"}
      <select name="interest" defaultValue="" required>
        <option value="" disabled>{ar ? "اختر مسارًا" : "Choose an area"}</option>
        <option value="academic">{ar ? "المسار الأكاديمي الابتكاري" : "Academic Innovation Track"}</option>
        <option value="community">{ar ? "المسار المجتمعي" : "Community Track"}</option>
        <option value="both">{ar ? "كلا المسارين" : "Both tracks"}</option>
      </select>
    </label>
    <label>{ar ? "ما الذي ترغب في المساهمة به؟" : "How would you like to contribute?"}
      <textarea name="motivation" rows={5} required minLength={20} maxLength={2000} />
    </label>
    <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
    <label className="consent-label"><input type="checkbox" name="consent" required /><span>{ar ? "أوافق على استخدام بياناتي لمراجعة طلب الاهتمام والتواصل معي بشأنه وفق " : "I agree to use of my details to review this application and contact me about it as described in the "}<Link href="/privacy">{ar ? "إشعار الخصوصية" : "privacy notice"}</Link>.</span></label>
    {status === "success" && <p className="form-success" role="status">{ar ? "استلمنا طلبك، شكرًا لاهتمامك بإرث." : "Your application was received. Thank you for your interest in ERTH."}</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button button-dark" disabled={status === "sending"}>{status === "sending" ? (ar ? "جارٍ الإرسال…" : "Submitting…") : (ar ? "إرسال طلب الاهتمام" : "Submit application")} <span aria-hidden="true">↗</span></button>
  </form>;
}

function PublicTeam({ records, ar, emptyText }: { records: PublicRecords["team"]; ar: boolean; emptyText?: string }) {
  if (!records.length) return <div className="team-empty"><span>✳</span><p>{emptyText ?? (ar ? "لا توجد ملفات فريق معتمدة للنشر بعد." : "No team profiles have been approved for publication yet.")}</p></div>;
  return <div className="public-record-list team-records">{records.map((member) => <article className="public-record-card" key={member.id}><span>{ar ? "فريق إرث" : "ERTH TEAM"}</span><h3>{member.name}</h3><strong>{member.roleTitle}</strong>{member.bio && <p>{member.bio}</p>}</article>)}</div>;
}

function PublicPartners({ records, ar }: { records: PublicRecords["partners"]; ar: boolean }) {
  if (!records.length) return <p className="partner-empty">{ar ? "لا توجد شراكات معتمدة للإعلان عنها حتى الآن." : "There are no partnerships approved for public announcement yet."}</p>;
  return <div className="public-record-list partner-records">{records.map((partner) => <article className="public-record-card" key={partner.id}><h3>{partner.name}</h3><p>{partner.summary}</p>{partner.website && <a href={partner.website} target="_blank" rel="noreferrer">{ar ? "زيارة الموقع" : "Visit website"} ↗</a>}</article>)}</div>;
}

function ContactCta({ ar }: { ar: boolean }) {
  return <section className="contact-cta"><div className="container cta-inner"><div><span className="eyebrow"><i />{ar ? "معًا، للأثر القادم" : "TOGETHER, FOR WHAT'S NEXT"}</span><h2>{ar ? <>لديك فكرة؟<br />لنبدأ الحديث.</> : <>Have an idea?<br />Let’s talk.</>}</h2></div><Link className="button button-light" href="/contact">{ar ? "تواصل مع إرث" : "Contact ERTH"} <span>↗</span></Link></div></section>;
}

function InquiryForm({ ar, status, formError, onSubmit }: { ar: boolean; status: string; formError: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form className="inquiry-form" onSubmit={onSubmit}>
    <div className="form-row"><label>{ar ? "الاسم" : "Name"}<input name="name" required minLength={2} maxLength={100} autoComplete="name" /></label><label>{ar ? "البريد الإلكتروني" : "Email"}<input name="email" type="email" required maxLength={254} autoComplete="email" /></label></div>
    <div className="form-row"><label>{ar ? "نوع الاستفسار" : "Inquiry type"}<select name="type" required defaultValue=""><option value="" disabled>{ar ? "اختر النوع" : "Select a type"}</option><option value="general">{ar ? "استفسار عام" : "General"}</option><option value="partnership">{ar ? "شراكة وتعاون" : "Partnership"}</option><option value="academic">{ar ? "المسار الأكاديمي" : "Academic track"}</option><option value="community">{ar ? "المسار المجتمعي" : "Community track"}</option></select></label><label>{ar ? "الموضوع" : "Subject"}<input name="subject" required minLength={3} maxLength={160} /></label></div>
    <label>{ar ? "رسالتك" : "Your message"}<textarea name="message" rows={5} required minLength={10} maxLength={4000} /></label>
    <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
    <label className="consent-label"><input type="checkbox" name="consent" required /><span>{ar ? "أوافق على استخدام بياناتي للرد على هذا الاستفسار وفق " : "I agree to the use of my details to respond, as described in the "}<Link href="/privacy">{ar ? "إشعار الخصوصية" : "privacy notice"}</Link>.</span></label>
    {status === "success" && <p className="form-success" role="status">{ar ? "وصلتنا رسالتك، شكرًا لتواصلك." : "Your message has been received. Thank you."}</p>}
    {formError && <p className="form-error" role="alert">{formError}</p>}
    <button className="button button-dark" disabled={status === "sending"}>{status === "sending" ? (ar ? "جارٍ الإرسال…" : "Sending…") : (ar ? "إرسال الرسالة" : "Send message")} <span>↗</span></button>
  </form>;
}
