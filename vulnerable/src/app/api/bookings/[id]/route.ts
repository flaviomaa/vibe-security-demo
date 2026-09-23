import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const { id } = await context.params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { sessionType: true, invoice: true, user: true },
  });

  if (!booking) {
    return NextResponse.json(
      { error: "Buchung nicht gefunden." },
      { status: 404 }
    );
  }

  // VULNERABILITY #1 (IDOR / broken access control): any logged-in user
  // can fetch ANY booking by id — there is no check that `booking.userId`
  // matches the caller. See VULNERABILITIES.md #1.

  return NextResponse.json({
    id: booking.id,
    scheduledAt: booking.scheduledAt,
    priceCents: booking.priceCents,
    sessionType: booking.sessionType,
    invoice: booking.invoice,
    client: { name: booking.user.name, email: booking.user.email },
  });
}
