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

  // Ownership check: a client may only ever see their own booking. The
  // owner role may see any booking (needed for the admin dashboard).
  const isOwnerRole = session.role === "OWNER";
  const isOwnBooking = booking.userId === session.sub;
  if (!isOwnerRole && !isOwnBooking) {
    return NextResponse.json({ error: "Nicht erlaubt." }, { status: 403 });
  }

  return NextResponse.json({
    id: booking.id,
    scheduledAt: booking.scheduledAt,
    priceCents: booking.priceCents,
    sessionType: booking.sessionType,
    invoice: booking.invoice,
    client: { name: booking.user.name, email: booking.user.email },
  });
}
