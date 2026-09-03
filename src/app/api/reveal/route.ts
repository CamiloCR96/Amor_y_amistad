import { NextResponse } from "next/server";
import { targetOf } from "@/lib/draw";
import { getCriticalIssues } from "@/lib/env";
import { formatBogota } from "@/lib/format";
import { reveal } from "@/lib/reveals";
import { participantFromToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function POST(req: Request) {
  if (getCriticalIssues().length) {
    return NextResponse.json({ error: "not-configured" }, { status: 503, headers: noStore });
  }

  let token = "";
  try {
    const body: unknown = await req.json();
    if (body && typeof body === "object" && "token" in body) {
      token = String((body as { token: unknown }).token ?? "");
    }
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400, headers: noStore });
  }

  const me = participantFromToken(token);
  if (!me) {
    return NextResponse.json({ error: "invalid-token" }, { status: 404, headers: noStore });
  }

  const target = targetOf(me.slug);
  const { at, first } = await reveal(me.slug);

  return NextResponse.json(
    {
      target: { slug: target.slug, name: target.name },
      at,
      atLabel: formatBogota(at),
      first,
    },
    { headers: noStore },
  );
}
