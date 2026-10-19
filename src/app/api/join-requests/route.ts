import { NextRequest, NextResponse } from "next/server";
import { validateJoinApplication } from "@/lib/join-validation.mjs";
import { updateStore } from "@/lib/local-store";

const recentApplications = new Map<string, number[]>();

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_384) {
    return NextResponse.json({ error: "request_too_large" }, { status: 413 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const attempts = (recentApplications.get(ip) ?? []).filter((time) => now - time < 60_000);
  if (attempts.length >= 3) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  attempts.push(now);
  recentApplications.set(ip, attempts);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }
  const validation = validateJoinApplication(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    await updateStore((store) => {
      store.joinRequests.unshift({
        id: crypto.randomUUID(),
        ...validation.value,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
  }
}
