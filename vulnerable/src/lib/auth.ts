import { createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

// VULNERABILITY #5 (weak auth): unsalted SHA-1 instead of bcrypt/argon2.
// Same password -> same hash for every user, no per-user salt, and SHA-1
// is fast enough to brute-force or rainbow-table at scale. See
// VULNERABILITIES.md #5.
export async function hashPassword(password: string): Promise<string> {
  return createHash("sha1").update(password).digest("hex");
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return createHash("sha1").update(password).digest("hex") === hash;
}

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  sub: string;
  role: "CLIENT" | "OWNER";
};

export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSessionSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    if (typeof payload.sub !== "string" || typeof payload.role !== "string") {
      return null;
    }
    return { sub: payload.sub, role: payload.role as SessionPayload["role"] };
  } catch {
    return null;
  }
}
