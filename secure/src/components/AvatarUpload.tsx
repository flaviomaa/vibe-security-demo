"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export default function AvatarUpload({
  currentAvatarUrl,
}: {
  currentAvatarUrl: string | null;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState(currentAvatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("avatar", file);
    const res = await fetch("/api/profile/avatar", {
      method: "POST",
      body: formData,
    });

    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Upload fehlgeschlagen.");
      return;
    }
    const data = await res.json();
    setPreview(data.avatarUrl);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 overflow-hidden rounded-full bg-neutral-200">
        {preview && (
          <Image
            src={preview}
            alt="Avatar"
            width={64}
            height={64}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleChange}
          disabled={uploading}
          className="text-sm"
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
