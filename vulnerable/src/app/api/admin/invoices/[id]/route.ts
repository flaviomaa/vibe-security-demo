import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

// VULNERABILITY #2 (broken authz): only checks login, not role. See
// VULNERABILITIES.md #2.
export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
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
