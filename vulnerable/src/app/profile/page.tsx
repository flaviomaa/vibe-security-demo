import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import AvatarUpload from "@/components/AvatarUpload";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) redirect("/login");

  return (
    <div className="max-w-sm space-y-6">
      <h1 className="text-xl font-semibold">Profil</h1>
      <AvatarUpload currentAvatarUrl={user.avatarUrl} />
      <div className="text-sm text-neutral-600">
        <p>{user.name}</p>
        <p>{user.email}</p>
      </div>
    </div>
  );
}
