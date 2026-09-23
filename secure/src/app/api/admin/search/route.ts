import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/session";

export async function GET(request: NextRequest) {
  const guard = await requireOwner();
  if (!guard.ok) {
    return NextResponse.json({ error: "Nicht erlaubt." }, { status: guard.status });
  }

  const q = request.nextUrl.searchParams.get("q") ?? "";
  const pattern = `%${q}%`;

  // Raw SQL is fine — the tagged template sends `pattern` as a bound
  // parameter, so it can never change the shape of the query, no matter
  // what characters `q` contains.
  const users = await prisma.$queryRaw<
    { id: string; name: string; email: string; role: string }[]
  >`SELECT id, name, email, role FROM "User" WHERE name LIKE ${pattern} OR email LIKE ${pattern}`;

  return NextResponse.json(users);
}
