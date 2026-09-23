import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import AdminDashboard from "@/components/AdminDashboard";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "OWNER") redirect("/dashboard");

  const bookings = await prisma.booking.findMany({
    include: { sessionType: true, invoice: true, user: true },
    orderBy: { scheduledAt: "desc" },
  });

  const serialized = bookings.map((b) => ({
    id: b.id,
    scheduledAt: b.scheduledAt.toISOString(),
    priceCents: b.priceCents,
    sessionType: { name: b.sessionType.name },
    invoice: b.invoice ? { id: b.invoice.id, paid: b.invoice.paid } : null,
    client: { id: b.user.id, name: b.user.name, email: b.user.email },
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Owner-Dashboard</h1>
      <AdminDashboard initialBookings={serialized} />
    </div>
  );
}
