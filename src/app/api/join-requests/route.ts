
import { NextRequest, NextResponse } from "next/server";
import { validateJoinApplication } from "@/lib/join-validation.mjs";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const recentApplications = new Map<string, number[]>();

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (contentLength > 16_384) {
    return NextResponse.json(
      { error: "request_too_large" },
      { status: 413 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local";
  const now = Date.now();

  const attempts = (recentApplications.get(ip) ?? []).filter(
    (time) => now - time < 60_000,
  );

  if (attempts.length >= 3) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429 },
    );
  }

  attempts.push(now);
  recentApplications.set(ip, attempts);

  let body: Record<string, unknown>;

  try {
    const parsed: unknown = await request.json();

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return NextResponse.json(
        { error: "invalid_request" },
        { status: 400 },
      );
    }

    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "invalid_request" },
      { status: 400 },
    );
  }

  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const validation = validateJoinApplication(body);

  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabaseAdmin();

    const { error } = await supabase.from("join_requests").insert({
      name: validation.value.name,
      email: validation.value.email,
      interest: validation.value.interest,
      motivation: validation.value.motivation,
      status: "pending",
    });

    if (error) {
      console.error("Supabase join request insert failed:", error.code);

      return NextResponse.json(
        { error: "storage_unavailable" },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "storage_unavailable" },
      { status: 503 },
    );
  }
}
