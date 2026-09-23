import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

const bodySchema = z.object({
  sessionTypeId: z.string().min(1),
  scheduledAt: z.string().min(1),
  // VULNERABILITY #6 (business logic / price tampering): the price is
  // accepted straight from the request body below, instead of being
  // looked up server-side from the SessionType catalog. See
  // VULNERABILITIES.md #6.
  priceCents: z.number().int().nonnegative(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: session.sub },
    include: { sessionType: true, invoice: true },
    orderBy: { scheduledAt: "desc" },
  });
  return NextResponse.json(bookings);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }
  const { sessionTypeId, scheduledAt, priceCents } = parsed.data;

  const sessionType = await prisma.sessionType.findUnique({
    where: { id: sessionTypeId },
  });
  if (!sessionType) {
    return NextResponse.json(
      { error: "Unbekannter Session-Typ." },
      { status: 400 }
    );
  }

  const booking = await prisma.booking.create({
    data: {
      userId: session.sub,
      sessionTypeId: sessionType.id,
      scheduledAt: new Date(scheduledAt),
      priceCents,
      invoice: {
        create: {
          amountCents: priceCents,
          paid: false,
        },
      },
    },
    include: { sessionType: true, invoice: true },
  });

  return NextResponse.json(booking, { status: 201 });
}
