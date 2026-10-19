const baseUrl = process.env.ERTH_BASE_URL ?? "http://127.0.0.1:3010";
const routes = [
  "/",
  "/about",
  "/tracks",
  "/tracks/academic",
  "/tracks/community",
  "/projects",
  "/join",
  "/team",
  "/contact",
  "/privacy",
  "/admin",
];
const brokenEncoding = /(?:Ã[\u0080-\u00ff]|Â[\u0080-\u00ff]|â[\u0080-\u00ff]|[ØÙ][\u0080-\u00ff]|[طظ][\u0080-\u00ff])/u;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const pages = new Map();
  for (const route of routes) {
    const response = await fetch(new URL(route, baseUrl));
    const bytes = Buffer.from(await response.arrayBuffer());
    const html = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    assert(response.status === 200, `${route} returned HTTP ${response.status}`);
    assert(
      /text\/html;\s*charset=utf-8/i.test(response.headers.get("content-type") ?? ""),
      `${route} did not serve an UTF-8 HTML content type`,
    );
    assert(/<meta[^>]+charset=["']?utf-8/i.test(html), `${route} is missing its UTF-8 meta charset`);
    assert(!brokenEncoding.test(html) && !/\?{4,}/u.test(html), `${route} contains mojibake markers`);
    assert(html.includes("إرث"), `${route} does not contain readable Arabic text`);
    pages.set(route, html);
    console.log(`PASS ${route} returned readable UTF-8 Arabic`);
  }

  for (const route of ["/", "/about", "/tracks", "/projects", "/join", "/team", "/contact"]) {
    assert(pages.get("/").includes(`href="${route}"`), `Home navigation is missing ${route}`);
    assert(pages.get("/admin").includes(`href="${route}"`), `Admin navigation is missing ${route}`);
  }
  assert(pages.get("/projects").includes("لا توجد مشاريع منشورة بعد"), "Projects empty state is missing");
  assert(pages.get("/join").includes("إرسال طلب الاهتمام"), "Join form is missing");
  assert(pages.get("/admin").includes("مساحة إدارة إرث"), "Readable Arabic admin heading is missing");
  assert(pages.get("/admin").includes("لا تستخدم هذه المعاينة"), "Admin preview warning is missing");

  const unknown = await fetch(new URL("/route-that-does-not-exist", baseUrl));
  assert(unknown.status === 404, `Unknown route returned HTTP ${unknown.status}`);
  console.log("PASS all visible navigation routes are implemented; unknown routes remain 404");

  const invalid = await fetch(new URL("/api/join-requests", baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "A",
      email: "invalid",
      interest: "unknown",
      motivation: "Too short",
      consent: false,
    }),
  });
  assert(invalid.status === 400, `Invalid join application returned HTTP ${invalid.status}`);

  const uniqueEmail = `http-test-${crypto.randomUUID()}@example.invalid`;
  const uniqueName = `HTTP test ${crypto.randomUUID()}`;
  const uniqueMotivation = `Privacy test ${crypto.randomUUID()} motivation`;
  const valid = await fetch(new URL("/api/join-requests", baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: uniqueName,
      email: uniqueEmail,
      interest: "both",
      motivation: uniqueMotivation,
      consent: true,
    }),
  });
  assert(valid.status === 201, `Valid join application returned HTTP ${valid.status}`);

  const publicContent = await (await fetch(new URL("/api/public-content", baseUrl))).text();
  assert(!publicContent.includes(uniqueName), "Public content exposed a join applicant name");
  assert(!publicContent.includes(uniqueEmail), "Public content exposed a join applicant email");
  assert(!publicContent.includes(uniqueMotivation), "Public content exposed an application motivation");
  const applicationList = await fetch(new URL("/api/join-requests", baseUrl));
  assert(applicationList.status === 405, "A public join-application listing is available");
  const admin = await fetch(new URL("/api/admin", baseUrl));
  assert(admin.status === 401, `Anonymous admin request returned HTTP ${admin.status}`);
  const previewLogin = await fetch(new URL("/api/preview-login", baseUrl), { method: "POST" });
  assert(previewLogin.status === 404, `Production preview login returned HTTP ${previewLogin.status}`);
  console.log("PASS join validation (400/201); applications remain private; admin denied; production preview login disabled");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
