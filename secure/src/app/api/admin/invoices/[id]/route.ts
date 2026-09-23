import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/session";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireOwner();
  if (!guard.ok) {
    return NextResponse.json({ error: "Nicht erlaubt." }, { status: guard.status });
  }

  const { id } = await context.params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: { paid: true },
  });
  return NextResponse.json(updated);
}
