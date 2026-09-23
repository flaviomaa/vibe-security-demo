import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/session";

export async function GET() {
  const guard = await requireOwner();
  if (!guard.ok) {
    return NextResponse.json({ error: "Nicht erlaubt." }, { status: guard.status });
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
