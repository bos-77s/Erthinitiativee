import { NextResponse } from "next/server";
import { readStore } from "@/lib/local-store";

export async function GET() {
  try {
    const store = await readStore();
    return NextResponse.json({
      initiatives: store.initiatives
        .filter((item) => item.status === "published")
        .map(({ id, title, summary, track }) => ({ id, title, summary, track })),
      team: store.team
        .filter((member) => member.isApproved && member.archivedAt === null)
        .map(({ id, name, roleTitle, bio }) => ({ id, name, roleTitle, bio })),
      partners: store.partners
        .filter((partner) => partner.status === "published")
        .map(({ id, name, summary, website }) => ({ id, name, summary, website })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
  }
}
