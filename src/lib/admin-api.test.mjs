import test from "node:test";
import assert from "node:assert/strict";
import { authorizeAdminAction, readAdminSection } from "./admin-api.mjs";

const manager = { role: "manager" };
const coordinator = {
  role: "coordinator",
  permissions: ["dashboard.view", "inquiries.view", "initiatives.view", "members.view", "partners.view"],
};

function createStore() {
  return {
    inquiries: [{
      id: "inquiry-1", name: "Test Person", email: "test@example.invalid", type: "general",
      subject: "Test", message: "Synthetic private message", status: "new", createdAt: "2026-01-01T00:00:00Z",
      internalSecret: "must not be returned",
    }],
    joinRequests: [{
      id: "request-1", name: "Applicant", email: "applicant@example.invalid", interest: "academic",
      motivation: "Synthetic application", status: "pending", createdAt: "2026-01-02T00:00:00Z",
    }],
    initiatives: [
      { id: "initiative-1", title: "Published", summary: "Public summary", track: "academic", status: "published", createdAt: "2026-01-03T00:00:00Z", internalSecret: "private" },
      { id: "initiative-2", title: "Draft", summary: "Private draft", track: "community", status: "draft", createdAt: "2026-01-04T00:00:00Z" },
    ],
    team: [{
      id: "member-1", name: "Member", roleTitle: "Role", bio: "Bio", isApproved: true, archivedAt: null,
      createdAt: "2026-01-05T00:00:00Z", internalSecret: "private",
    }, {
      id: "member-draft", name: "Draft member", roleTitle: "Role", bio: "Private", isApproved: false,
      archivedAt: "2026-01-05T01:00:00Z", createdAt: "2026-01-05T00:00:00Z",
    }],
    partners: [{
      id: "partner-1", name: "Partner", summary: "Summary", website: "https://example.invalid",
      status: "draft", createdAt: "2026-01-06T00:00:00Z",
    }, {
      id: "partner-published", name: "Published partner", summary: "Public summary", website: "",
      status: "published", createdAt: "2026-01-06T01:00:00Z",
    }],
    siteStatus: "published",
    audit: [{ id: "audit-1", action: "Synthetic audit", createdAt: "2026-01-07T00:00:00Z", internalSecret: "private" }],
    rootSecret: "must never be returned",
  };
}

test("unauthorized and unknown section requests do not read the store", async () => {
  let readCount = 0;
  const readStore = async () => {
    readCount += 1;
    return createStore();
  };

  assert.deepEqual(await readAdminSection(null, "inquiries", readStore), {
    ok: false, status: 401, error: "unauthorized",
  });
  assert.deepEqual(await readAdminSection(coordinator, "requests", readStore), {
    ok: false, status: 401, error: "unauthorized",
  });
  assert.deepEqual(await readAdminSection(manager, "rootSecret", readStore), {
    ok: false, status: 400, error: "unknown_section",
  });
  assert.equal(readCount, 0);
});

test("overview returns summary counts only", async () => {
  const result = await readAdminSection(manager, "overview", async () => createStore());
  assert.deepEqual(result, {
    ok: true,
    section: "overview",
    data: {
      summary: {
        inquiryCount: 1,
        publishedInitiativeCount: 1,
        publishedTeamCount: 1,
        publishedPartnerCount: 1,
      },
    },
  });
});

test("section responses contain only their allowlisted data", async () => {
  const store = createStore();
  const expected = {
    inquiries: ["inquiries", ["id", "name", "email", "type", "subject", "message", "status", "createdAt"]],
    requests: ["joinRequests", ["id", "name", "email", "interest", "motivation", "status", "createdAt"]],
    initiatives: ["initiatives", ["id", "title", "summary", "track", "status", "createdAt"]],
    members: ["team", ["id", "name", "roleTitle", "bio", "isApproved", "archivedAt", "createdAt"]],
    partners: ["partners", ["id", "name", "summary", "website", "status", "createdAt"]],
    settings: ["siteStatus", null],
    audit: ["audit", ["id", "action", "createdAt"]],
  };

  for (const [section, [collection, expectedFields]] of Object.entries(expected)) {
    const result = await readAdminSection(manager, section, async () => store);
    assert.equal(result.ok, true);
    assert.deepEqual(Object.keys(result.data), [collection]);
    if (expectedFields) {
      assert.deepEqual(Object.keys(result.data[collection][0]), expectedFields);
    }
    assert.equal("rootSecret" in result.data, false);
    assert.equal("audit" in result.data, section === "audit");
    assert.equal("inquiries" in result.data, section === "inquiries");
    assert.equal("joinRequests" in result.data, section === "requests");
  }
});

test("sensitive record fields are returned only from their authorized section", async () => {
  const store = createStore();
  const overview = await readAdminSection(manager, "overview", async () => store);
  const initiatives = await readAdminSection(manager, "initiatives", async () => store);
  const inquiries = await readAdminSection(manager, "inquiries", async () => store);
  const audit = await readAdminSection(manager, "audit", async () => store);

  assert.equal(JSON.stringify(overview).includes("Synthetic private message"), false);
  assert.equal(JSON.stringify(overview).includes("Synthetic audit"), false);
  assert.equal(JSON.stringify(initiatives).includes("internalSecret"), false);
  assert.equal(JSON.stringify(initiatives).includes("Synthetic private message"), false);
  assert.equal(JSON.stringify(inquiries).includes("Synthetic private message"), true);
  assert.equal(JSON.stringify(inquiries).includes("Synthetic audit"), false);
  assert.equal(JSON.stringify(audit).includes("Synthetic audit"), true);
  assert.equal(JSON.stringify(audit).includes("Synthetic private message"), false);
});

test("coordinators with view permissions receive published records only", async () => {
  const store = createStore();
  const initiatives = await readAdminSection(coordinator, "initiatives", async () => store);
  const members = await readAdminSection(coordinator, "members", async () => store);
  const partners = await readAdminSection(coordinator, "partners", async () => store);

  assert.deepEqual(initiatives.data.initiatives.map(({ id }) => id), ["initiative-1"]);
  assert.deepEqual(members.data.team.map(({ id }) => id), ["member-1"]);
  assert.deepEqual(partners.data.partners.map(({ id }) => id), ["partner-published"]);
});

test("unknown and unauthorized operations are rejected before performing work", () => {
  assert.deepEqual(authorizeAdminAction(manager, "unlisted-action"), {
    ok: false, status: 400, error: "unsupported_action",
  });

  for (const action of [
    "inquiry-status", "site-status", "initiative-status", "team-status", "partner-status",
    "join-request-status", "export-inquiries", "create-initiative", "create-team-member", "create-partner",
  ]) {
    assert.equal(authorizeAdminAction(null, action).ok, false, `${action} must reject anonymous users`);
    assert.equal(authorizeAdminAction(coordinator, action).ok, false, `${action} must reject coordinators`);
    assert.equal(authorizeAdminAction(manager, action).ok, true, `${action} must allow the manager`);
  }
});

test("public join application API exposes submission only, not list or review handlers", async () => {
  const { readFile } = await import("node:fs/promises");
  const route = await readFile(new URL("../app/api/join-requests/route.ts", import.meta.url), "utf8");
  assert.match(route, /export async function POST\(/);
  assert.doesNotMatch(route, /export async function (GET|PATCH|DELETE)\(/);
});

test("admin route authorizes each method and never returns the full store after mutations", async () => {
  const { readFile } = await import("node:fs/promises");
  const route = await readFile(new URL("../app/api/admin/route.ts", import.meta.url), "utf8");
  const getRoute = route.split("export async function GET(")[1].split("export async function PATCH(")[0];
  const patchRoute = route.split("export async function PATCH(")[1].split("export async function POST(")[0];
  const postRoute = route.split("export async function POST(")[1];

  assert.match(getRoute, /readAdminSection\(previewManager\(request\), section, readStore\)/);
  assert.match(patchRoute, /authorizeAdminAction\(user, body\.action\)/);
  assert.match(postRoute, /authorizeAdminAction\(user, body\.action\)/);
  assert.match(patchRoute, /NextResponse\.json\(\{ ok: true \}\)/);
  assert.match(postRoute, /NextResponse\.json\(\{ ok: true \}\)/);
  assert.doesNotMatch(`${getRoute}\n${patchRoute}\n${postRoute}`, /NextResponse\.json\(\s*(?:store\b|\{[^}]*\bstore\b)/);
});
