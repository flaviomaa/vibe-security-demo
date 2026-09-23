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

/**
 * Every admin-only route handler calls this first. The role check lives
 * server-side, on the API route itself — never only in the UI (a hidden
 * button does not stop a direct request to the endpoint).
 */
export async function requireOwner(): Promise<
  | { ok: true; session: SessionPayload }
  | { ok: false; status: 401 | 403 }
> {
  const session = await getSession();
  if (!session) return { ok: false, status: 401 };
  if (session.role !== "OWNER") return { ok: false, status: 403 };
  return { ok: true, session };
}
