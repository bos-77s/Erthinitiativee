import { NextRequest, NextResponse } from "next/server";
import { canAccess } from "@/lib/authorization.mjs";
import { readStore, recordAudit, updateStore } from "@/lib/local-store";

function previewManager(request: NextRequest) {
  if (process.env.NODE_ENV === "production") return null;
  if (request.cookies.get("erth-local-preview")?.value !== "manager-demo") return null;
  return { role: "manager" };
}

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const user = previewManager(request);
  if (!canAccess(user, "dashboard.view")) return unauthorized();
  try {
    return NextResponse.json(await readStore(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const user = previewManager(request);
  const permissionByAction: Record<string, string> = {
    "inquiry-status": "inquiries.respond",
    "site-status": "site.settings",
    "initiative-status": "initiatives.update",
    "team-status": "members.update",
    "partner-status": "partners.update",
    "join-request-status": "join_requests.review",
  };
  const requiredPermission = permissionByAction[String(body.action)];
  if (!requiredPermission) return NextResponse.json({ error: "unsupported_action" }, { status: 400 });
  if (body.action === "join-request-status" && user?.role !== "manager") return unauthorized();
  if (!canAccess(user, requiredPermission)) return unauthorized();
  if (body.action === "site-status" && !["published", "maintenance", "temporarily_closed"].includes(String(body.status))) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }
  if (body.action === "inquiry-status") {
    if (typeof body.id !== "string" || !["new", "in_progress", "closed"].includes(String(body.status))) {
      return NextResponse.json({ error: "invalid_inquiry_update" }, { status: 400 });
    }
    const store = await readStore();
    if (!store.inquiries.some((inquiry) => inquiry.id === body.id)) {
      return NextResponse.json({ error: "inquiry_not_found" }, { status: 404 });
    }
  } else if (body.action === "initiative-status") {
    if (typeof body.id !== "string" || !["draft", "published", "archived"].includes(String(body.status))) {
      return NextResponse.json({ error: "invalid_initiative_update" }, { status: 400 });
    }
    if (!(await readStore()).initiatives.some((record) => record.id === body.id)) {
      return NextResponse.json({ error: "initiative_not_found" }, { status: 404 });
    }
  } else if (body.action === "team-status") {
    if (typeof body.id !== "string" || typeof body.isApproved !== "boolean") {
      return NextResponse.json({ error: "invalid_team_update" }, { status: 400 });
    }
    if (!(await readStore()).team.some((record) => record.id === body.id)) {
      return NextResponse.json({ error: "team_member_not_found" }, { status: 404 });
    }
  } else if (body.action === "partner-status") {
    if (typeof body.id !== "string" || !["draft", "published", "archived"].includes(String(body.status))) {
      return NextResponse.json({ error: "invalid_partner_update" }, { status: 400 });
    }
    if (!(await readStore()).partners.some((record) => record.id === body.id)) {
      return NextResponse.json({ error: "partner_not_found" }, { status: 404 });
    }
  } else if (body.action === "join-request-status") {
    if (typeof body.id !== "string" || !["approved", "rejected", "pending"].includes(String(body.status))) {
      return NextResponse.json({ error: "invalid_join_request_update" }, { status: 400 });
    }
    if (!(await readStore()).joinRequests.some((record) => record.id === body.id)) {
      return NextResponse.json({ error: "join_request_not_found" }, { status: 404 });
    }
  } else if (body.action !== "site-status") {
    return NextResponse.json({ error: "unsupported_action" }, { status: 400 });
  }
  try {
    const result = await updateStore((store) => {
      if (body.action === "site-status") {
        store.siteStatus = body.status as typeof store.siteStatus;
        recordAudit(store, `Changed site status to ${store.siteStatus}`);
      } else if (body.action === "inquiry-status" && typeof body.id === "string") {
        const inquiry = store.inquiries.find((item) => item.id === body.id);
        if (!inquiry) throw new Error("inquiry_not_found");
        inquiry.status = body.status as typeof inquiry.status;
        recordAudit(store, `Updated inquiry ${inquiry.id} status`);
      } else if (body.action === "initiative-status" && typeof body.id === "string") {
        const item = store.initiatives.find((record) => record.id === body.id);
        if (!item) throw new Error("initiative_not_found");
        item.status = body.status as typeof item.status;
        recordAudit(store, `Changed initiative ${item.id} to ${item.status}`);
      } else if (body.action === "team-status" && typeof body.id === "string") {
        const member = store.team.find((record) => record.id === body.id);
        if (!member) throw new Error("team_member_not_found");
        member.isApproved = body.isApproved as boolean;
        if (!member.isApproved) member.archivedAt = new Date().toISOString();
        else member.archivedAt = null;
        recordAudit(store, `Changed public approval for team member ${member.id}`);
      } else if (body.action === "partner-status" && typeof body.id === "string") {
        const partner = store.partners.find((record) => record.id === body.id);
        if (!partner) throw new Error("partner_not_found");
        partner.status = body.status as typeof partner.status;
        recordAudit(store, `Changed partner ${partner.id} to ${partner.status}`);
      } else if (body.action === "join-request-status" && typeof body.id === "string") {
        const application = store.joinRequests.find((record) => record.id === body.id);
        if (!application) throw new Error("join_request_not_found");
        application.status = body.status as typeof application.status;
        recordAudit(store, `Changed join request ${application.id} to ${application.status}`);
      }
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = previewManager(request);
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  if (body.action === "export-inquiries") {
    if (!canAccess(user, "exports.create")) return unauthorized();
    try {
      const store = await readStore();
      const fields = ["id", "name", "email", "type", "subject", "status", "createdAt"] as const;
      const csv = [
        fields.join(","),
        ...store.inquiries.map((item) =>
          fields
            .map((field) => {
              const raw = String(item[field] ?? "");
              const safe = /^[\s]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
              return `"${safe.replaceAll('"', '""')}"`;
            })
            .join(","),
        ),
      ].join("\r\n");
      await updateStore((next) => recordAudit(next, "Exported inquiry metadata"));
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="erth-inquiries.csv"',
          "Cache-Control": "no-store",
        },
      });
    } catch {
      return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
    }
  }
  const createPermission: Record<string, string> = {
    "create-initiative": "initiatives.create",
    "create-team-member": "members.create",
    "create-partner": "partners.create",
  };
  const permission = createPermission[String(body.action)];
  if (!permission) {
    return NextResponse.json({ error: "unsupported_action" }, { status: 400 });
  }
  if (!canAccess(user, permission)) return unauthorized();
  try {
    if (body.action === "create-initiative") {
      const title = body.title;
      const summary = body.summary;
      const track = body.track;
      if (typeof title !== "string" || title.trim().length < 3 || title.trim().length > 140 ||
          typeof summary !== "string" || summary.trim().length < 10 || summary.trim().length > 1000 ||
          !["academic", "community"].includes(String(track))) {
        return NextResponse.json({ error: "invalid_initiative" }, { status: 400 });
      }
      await updateStore((store) => {
        const item = { id: crypto.randomUUID(), title: title.trim(), summary: summary.trim(), track: track as "academic" | "community", status: "draft" as const, createdAt: new Date().toISOString() };
        store.initiatives.unshift(item);
        recordAudit(store, `Created initiative ${item.id}`);
      });
    } else if (body.action === "create-team-member") {
      const name = body.name;
      const roleTitle = body.roleTitle;
      const bio = body.bio;
      const isApproved = body.isApproved;
      if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100 ||
          typeof roleTitle !== "string" || roleTitle.trim().length < 2 || roleTitle.trim().length > 100 ||
          typeof bio !== "string" || bio.trim().length > 500 ||
          typeof isApproved !== "boolean") {
        return NextResponse.json({ error: "invalid_team_member" }, { status: 400 });
      }
      await updateStore((store) => {
        const member = { id: crypto.randomUUID(), name: name.trim(), roleTitle: roleTitle.trim(), bio: bio.trim(), isApproved, archivedAt: isApproved ? null : new Date().toISOString(), createdAt: new Date().toISOString() };
        store.team.unshift(member);
        recordAudit(store, `Created team record ${member.id}`);
      });
    } else if (body.action === "create-partner") {
      const name = body.name;
      const summary = body.summary;
      const website = body.website;
      if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 120 ||
          typeof summary !== "string" || summary.trim().length > 500 ||
          typeof website !== "string" || website.length > 2048 ||
          (website && !isHttpUrl(website))) {
        return NextResponse.json({ error: "invalid_partner" }, { status: 400 });
      }
      await updateStore((store) => {
        const partner = { id: crypto.randomUUID(), name: name.trim(), summary: summary.trim(), website: website.trim(), status: "draft" as const, createdAt: new Date().toISOString() };
        store.partners.unshift(partner);
        recordAudit(store, `Created partner record ${partner.id}`);
      });
    }
    return NextResponse.json(await readStore());
  } catch {
    return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
  }
}
