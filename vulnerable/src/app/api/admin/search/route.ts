import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

// VULNERABILITY #2 (broken authz): only checks login, not role — same
// issue as /api/admin/bookings. See VULNERABILITIES.md #2.
//
// VULNERABILITY #3 (SQL injection): `q` is concatenated directly into a
// raw SQL string via $queryRawUnsafe instead of being bound as a
// parameter. A value like `' UNION SELECT id,name,passwordHash,role
// FROM "User" -- ` changes the shape of the query. See
// VULNERABILITIES.md #3.
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q") ?? "";
  const pattern = `%${q}%`;

  const sql = `SELECT id, name, email, role FROM "User" WHERE name LIKE '${pattern}' OR email LIKE '${pattern}'`;
  const users = await prisma.$queryRawUnsafe<
    { id: string; name: string; email: string; role: string }[]
  >(sql);

  return NextResponse.json(users);
}
