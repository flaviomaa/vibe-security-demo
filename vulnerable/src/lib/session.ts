import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifySessionToken, type SessionPayload } from "@/lib/auth";

export const SESSION_COOKIE = "session";

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.sub } });
}
