"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { api } from "@/lib/api";
import { apiError } from "./shared";
import type { PanStatus, ProfileUser } from "./types";

const PAN_BADGE: Record<PanStatus, { label: string; cls: string }> = {
    NOT_SUBMITTED: { label: "PAN not submitted", cls: "bg-line text-ink-soft" },
    PENDING: { label: "PAN under review", cls: "bg-brand/10 text-brand" },
    VERIFIED: { label: "PAN verified", cls: "bg-up/10 text-up" },
    REJECTED: { label: "PAN rejected", cls: "bg-down/10 text-down" },
};

export default function ProfileHeader({
    user,
    onReload,
}: {
    user: ProfileUser;
    onReload: () => Promise<void>;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    const status = user.profile?.panStatus ?? "NOT_SUBMITTED";
    const badge = PAN_BADGE[status];
    const photo = user.profile?.photoUrl;

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError("Photo must be under 5 MB");
            return;
        }

        setUploading(true);
        setError("");
        const fd = new FormData();
        fd.append("photo", file);
        const res = await api("/users/me/photo", { method: "POST", body: fd });
        if (res.ok) await onReload();
        else setError(apiError(res.data, "Could not upload the photo"));
        setUploading(false);
    }

    return (
        <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 shadow-[0_8px_30px_rgba(31,41,55,0.05)] sm:flex-row sm:items-center">
            <div className="relative h-20 w-20 shrink-0">
                {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={photo}
                        alt={user.name}
                        className="h-20 w-20 rounded-full border border-line object-cover"
                    />
                ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand/10 text-2xl font-bold text-brand">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                )}
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                    aria-label="Change photo"
                    className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-ink-soft shadow transition hover:text-brand disabled:opacity-50"
                >
                    <Camera size={14} />
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={handleFile}
                    className="hidden"
                />
            </div>

            <div className="min-w-0 flex-1">
                <h1 className="truncate text-2xl font-bold tracking-tight text-ink">{user.name}</h1>
                <p className="truncate text-sm text-ink-soft">{user.email}</p>
                <span
                    className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-medium ${badge.cls}`}
                >
                    {badge.label}
                </span>
                {uploading && <p className="mt-2 text-xs text-ink-soft">Uploading photo...</p>}
                {error && <p className="mt-2 text-xs text-down">{error}</p>}
            </div>
        </div>
    );
}