import { NextRequest, NextResponse } from "next/server";

/**
 * Stand-in for a third-party transactional email API (e.g. Resend/Postmark).
 * It only checks that the caller knows NOTIFY_API_KEY — exactly like a real
 * provider would. The point of this demo isn't this endpoint, it's *who*
 * ends up holding the key well enough to call it.
 */
export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  if (!json || typeof json !== "object") {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }

  const { to, subject, apiKey } = json as Record<string, unknown>;
  if (apiKey !== process.env.NEXT_PUBLIC_NOTIFY_API_KEY) {
    return NextResponse.json({ error: "Ungültiger API-Key." }, { status: 401 });
  }

  console.log(`[mock-email] to=${to} subject=${subject}`);
  return NextResponse.json({ sent: true });
}
