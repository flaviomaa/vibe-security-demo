import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "OWNER" ? "/admin" : "/dashboard");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">ClientPortal</h1>
      <p className="text-neutral-600">
        Mini-Buchungssystem für Freelancer/Coaches — Demo-App für{" "}
        <code className="rounded bg-neutral-100 px-1 py-0.5 text-sm">
          vibe-security-demo
        </code>
        . Diese Version ist die abgesicherte Referenz.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100"
        >
          Registrieren
        </Link>
      </div>
    </div>
  );
}
