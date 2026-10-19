import { NextResponse } from "next/server";
import { readStore } from "@/lib/local-store";

export async function GET() {
  try {
    const { siteStatus } = await readStore();
    return NextResponse.json({ status: siteStatus }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
  }
}
