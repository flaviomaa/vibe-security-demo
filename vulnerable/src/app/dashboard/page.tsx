import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import BookingForm from "@/components/BookingForm";
import ResendButton from "@/components/ResendButton";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [bookings, sessionTypes, user] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: session.sub },
      include: { sessionType: true, invoice: true },
      orderBy: { scheduledAt: "desc" },
    }),
    prisma.sessionType.findMany({ orderBy: { priceCents: "asc" } }),
    prisma.user.findUnique({ where: { id: session.sub } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Neue Buchung</h1>
        <div className="mt-4">
          <BookingForm sessionTypes={sessionTypes} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Meine Buchungen</h2>
        <div className="mt-4 space-y-3">
          {bookings.length === 0 && (
            <p className="text-sm text-neutral-500">Noch keine Buchungen.</p>
          )}
          {bookings.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded border border-neutral-200 bg-white p-4"
            >
              <div>
                <p className="font-medium">{b.sessionType.name}</p>
                <p className="text-sm text-neutral-500">
                  {new Date(b.scheduledAt).toLocaleString("de-DE")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {(b.priceCents / 100).toFixed(2)} €
                </p>
                <p className="text-sm text-neutral-500">
                  {b.invoice?.paid ? "Bezahlt" : "Offen"}
                </p>
                <div className="mt-1">
                  <ResendButton
                    bookingId={b.id}
                    to={user?.email ?? ""}
                    subject={`Buchung bestätigt: ${b.sessionType.name}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
