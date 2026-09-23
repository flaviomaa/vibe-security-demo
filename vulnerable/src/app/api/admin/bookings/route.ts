import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

// VULNERABILITY #2 (broken authz / privilege escalation): this only checks
// that *someone* is logged in — the OWNER role check that gates the "Admin"
// link in the UI (see components/Nav.tsx) is never enforced here. Any
// logged-in CLIENT can call this endpoint directly. See VULNERABILITIES.md #2.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    include: { sessionType: true, invoice: true, user: true },
    orderBy: { scheduledAt: "desc" },
  });

  return NextResponse.json(
    bookings.map((b) => ({
      id: b.id,
      scheduledAt: b.scheduledAt,
      priceCents: b.priceCents,
      sessionType: b.sessionType,
      invoice: b.invoice,
      client: { id: b.user.id, name: b.user.name, email: b.user.email },
    }))
  );
}
