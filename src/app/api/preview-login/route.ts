import { NextResponse } from "next/server";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "local_preview_disabled" }, { status: 404 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set("erth-local-preview", "manager-demo", {
    httpOnly: true,
    sameSite: "strict",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("erth-local-preview");
  return response;
}
