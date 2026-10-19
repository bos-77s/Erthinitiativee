import { NextRequest, NextResponse } from "next/server";
import { updateStore } from "@/lib/local-store";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const recentSubmissions = new Map<string, number[]>();
type InquiryType = "general" | "partnership" | "academic" | "community";

function validText(value: unknown, minimum: number, maximum: number): value is string {
  return typeof value === "string" && value.trim().length >= minimum && value.trim().length <= maximum;
}

function isInquiryType(value: unknown): value is InquiryType {
  return value === "general" || value === "partnership" || value === "academic" || value === "community";
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_384) {
    return NextResponse.json({ error: "request_too_large" }, { status: 413 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const attempts = (recentSubmissions.get(ip) ?? []).filter((time) => now - time < 60_000);
  if (attempts.length >= 5) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  attempts.push(now);
  recentSubmissions.set(ip, attempts);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }
  const name = body.name;
  const email = body.email;
  const subject = body.subject;
  const message = body.message;
  const type = body.type;
  if (
    !validText(name, 2, 100) ||
    typeof email !== "string" ||
    !emailPattern.test(email) ||
    !validText(subject, 3, 160) ||
    !validText(message, 10, 4000) ||
    !isInquiryType(type) ||
    body.consent !== true
  ) {
    return NextResponse.json({ error: "invalid_fields" }, { status: 400 });
  }

  try {
    await updateStore((store) => {
      store.inquiries.unshift({
        id: crypto.randomUUID(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        type,
        subject: subject.trim(),
        message: message.trim(),
        status: "new",
        createdAt: new Date().toISOString(),
      });
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
  }
}
