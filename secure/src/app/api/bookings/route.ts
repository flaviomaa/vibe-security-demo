import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

const bodySchema = z.object({
  sessionTypeId: z.string().min(1),
  scheduledAt: z.string().min(1),
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
  const { sessionTypeId, scheduledAt } = parsed.data;

  const sessionType = await prisma.sessionType.findUnique({
    where: { id: sessionTypeId },
  });
  if (!sessionType) {
    return NextResponse.json(
      { error: "Unbekannter Session-Typ." },
      { status: 400 }
    );
  }

  // Price is looked up server-side from the catalog — whatever the client
  // sends (or doesn't send) for a price is ignored on purpose.
  const booking = await prisma.booking.create({
    data: {
      userId: session.sub,
      sessionTypeId: sessionType.id,
      scheduledAt: new Date(scheduledAt),
      priceCents: sessionType.priceCents,
      invoice: {
        create: {
          amountCents: sessionType.priceCents,
          paid: false,
        },
      },
    },
    include: { sessionType: true, invoice: true },
  });

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (user) {
    await fetch(new URL("/api/mock-email", request.url), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        to: user.email,
        subject: `Buchung bestätigt: ${sessionType.name}`,
        apiKey: process.env.NOTIFY_API_KEY,
      }),
    }).catch(() => null);
  }

  return NextResponse.json(booking, { status: 201 });
}
