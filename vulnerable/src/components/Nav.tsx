import Link from "next/link";
import { getSession } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";

export default async function Nav() {
  const session = await getSession();

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">
          ClientPortal{" "}
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
            vulnerable
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {session ? (
            <>
              <Link href="/dashboard" className="hover:underline">
                Dashboard
              </Link>
              {session.role === "OWNER" && (
                <Link href="/admin" className="hover:underline">
                  Admin
                </Link>
              )}
              <Link href="/profile" className="hover:underline">
                Profil
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                Login
              </Link>
              <Link href="/register" className="hover:underline">
                Registrieren
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
