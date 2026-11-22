"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { EXPERT_TYPES } from "@/features/auth/schemas";
import PageTitle from "@/features/user/components/PageTitle";

type Profile = {
    name: string;
    email: string;
    phone: string;
    expertType: string;
    credentialNumber: string | null;
    profileLink: string | null;
    experienceYears: number;
    expertise: string[];
    bio: string;
    photoUrl: string;
    city: string | null;
    language: string;
    panMasked: string;
    applicationStatus: "PENDING" | "APPROVED" | "REJECTED";
    rejectReason: string | null;
};

const field =
    "w-full rounded-lg border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft focus:border-brand focus:ring-2 focus:ring-brand/20";

const STATUS = {
    PENDING: { label: "Under review", cls: "bg-brand/10 text-brand" },
    APPROVED: { label: "Verified", cls: "bg-up/10 text-up" },
    REJECTED: { label: "Not approved", cls: "bg-down/10 text-down" },
};

function Label({ children }: { children: React.ReactNode }) {
    return <label className="mb-1.5 block text-sm font-medium text-ink">{children}</label>;
}

export default function ExpertProfilePage() {
    const [p, setP] = useState<Profile | null>(null);
    const [error, setError] = useState("");
    const [bio, setBio] = useState("");
    const [expertise, setExpertise] = useState("");
    const [years, setYears] = useState("");
    const [link, setLink] = useState("");
    const [city, setCity] = useState("");
    const [language, setLanguage] = useState("en");
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const fill = useCallback((x: Profile) => {
        setP(x);
        setBio(x.bio);
        setExpertise(x.expertise.join(", "));
        setYears(String(x.experienceYears));
        setLink(x.profileLink ?? "");
        setCity(x.city ?? "");
        setLanguage(x.language);
    }, []);

    useEffect(() => {
        (async () => {
            const res = await api("/expert/profile");
            if (res.ok) fill(res.data.profile);
            else setError(res.data?.message ?? "Could not load your profile");
        })();
    }, [fill]);

    async function save(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        const res = await api("/expert/profile", {
            method: "PATCH",
            body: { bio, expertise, experienceYears: years, profileLink: link, city, language },
        });
        if (res.ok) {
            fill(res.data.profile);
            setMsg({ ok: true, text: "Saved" });
        } else setMsg({ ok: false, text: res.data?.message ?? "Could not save" });
        setSaving(false);
    }

    async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        if (f.size > 5 * 1024 * 1024) return setMsg({ ok: false, text: "Photo must be under 5 MB" });
        setUploading(true);
        const fd = new FormData();
        fd.append("photo", f);
        const res = await api("/expert/profile/photo", { method: "POST", body: fd });
        if (res.ok) setP((cur) => (cur ? { ...cur, photoUrl: res.data.photoUrl } : cur));
        else setMsg({ ok: false, text: res.data?.message ?? "Could not upload the photo" });
        setUploading(false);
    }

    if (error) {
        return <p className="rounded-xl border border-down/30 bg-down/5 p-4 text-sm text-down">{error}</p>;
    }
    if (!p) return <p className="text-ink-soft">Loading...</p>;

    const typeLabel = EXPERT_TYPES.find((t) => t.value === p.expertType)?.label ?? p.expertType;
    const st = STATUS[p.applicationStatus];

    const locked: [string, string, string][] = [
        ["Name", p.name, "NAME"],
        ["Email", p.email, "EMAIL"],
        ["Mobile", p.phone, "PHONE"],
        ["Expert type", typeLabel, "CREDENTIAL"],
        ["Registration number", p.credentialNumber ?? "Not applicable", "CREDENTIAL"],
        ["PAN", p.panMasked, "PAN"],
    ];

    return (
        <div className="space-y-6">
            <PageTitle title="Profile" subtitle="Update your public details. Verified details need a request." />

            <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center">
                <div className="relative h-20 w-20 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.photoUrl} alt={p.name} className="h-20 w-20 rounded-full border border-line object-cover" />
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        aria-label="Change photo"
                        className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-ink-soft shadow transition hover:text-brand disabled:opacity-50"
                    >
                        <Camera size={14} />
                    </button>
                    <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" onChange={onPhoto} className="hidden" />
                </div>
                <div className="min-w-0 flex-1">
                    <h2 className="truncate font-heading text-2xl font-extrabold text-ink">{p.name}</h2>
                    <p className="text-sm text-ink-soft">{typeLabel}</p>
                    <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${st.cls}`}>
                        {st.label}
                    </span>
                    {p.applicationStatus === "REJECTED" && p.rejectReason && (
                        <p className="mt-2 text-sm text-down">Reason: {p.rejectReason}</p>
                    )}
                </div>
            </div>

            <form onSubmit={save} className="space-y-4 rounded-2xl border border-line bg-surface p-6">
                <h2 className="text-lg font-semibold text-ink">Public details</h2>
                <div>
                    <Label>Bio</Label>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={500} className={field} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <Label>Areas of expertise</Label>
                        <input value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="IT, Banking, Pharma" className={field} />
                    </div>
                    <div>
                        <Label>Years of experience</Label>
                        <input value={years} onChange={(e) => setYears(e.target.value)} inputMode="numeric" className={field} />
                    </div>
                    <div>
                        <Label>Profile link</Label>
                        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." className={field} />
                    </div>
                    <div>
                        <Label>City</Label>
                        <input value={city} onChange={(e) => setCity(e.target.value)} className={field} />
                    </div>
                    <div>
                        <Label>Language</Label>
                        <select value={language} onChange={(e) => setLanguage(e.target.value)} className={field}>
                            <option value="en">English</option>
                            <option value="hi">Hindi</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save changes"}
                    </button>
                    {msg && <span className={`text-sm ${msg.ok ? "text-up" : "text-down"}`}>{msg.text}</span>}
                </div>
            </form>

            <div className="rounded-2xl border border-line bg-surface p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
                    <Lock size={16} className="text-ink-soft" /> Verified details
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                    These were checked by our team. To change one, send a request with a reason.
                </p>
                <dl className="mt-4 divide-y divide-line">
                    {locked.map(([label, value, key], i) => (
                        <div key={i} className="flex flex-wrap items-center gap-3 py-3">
                            <dt className="w-44 text-sm text-ink-soft">{label}</dt>
                            <dd className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{value}</dd>
                            <Link
                                href={`/expert/support?field=${key}`}
                                className="text-sm font-medium text-brand hover:underline"
                            >
                                Request change
                            </Link>
                        </div>
                    ))}
                </dl>
                <p className="mt-3 text-xs text-ink-soft">
                    Changing credentials, PAN or documents sends your account back for review until it is
                    approved again.
                </p>
            </div>
        </div>
    );
}