"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { apiError, Label, Notice, ProfileCard, SaveButton, type Msg } from "./shared";
import type { Profile, ProfileUser } from "./types";

const SECTORS = ["IT", "Banking", "Pharma", "Energy", "Auto", "FMCG", "Metals", "Realty"];

const EXPERIENCE = [
    { value: "BEGINNER", label: "Beginner" },
    { value: "INTERMEDIATE", label: "Intermediate" },
    { value: "ADVANCED", label: "Advanced" },
] as const;

const RISK = [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
] as const;

function Segmented<T extends string>({
    options,
    value,
    onChange,
}: {
    options: readonly { value: T; label: string }[];
    value: T | null;
    onChange: (v: T) => void;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    onClick={() => onChange(o.value)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${value === o.value
                            ? "border-brand bg-brand/10 text-brand"
                            : "border-line bg-white text-ink-soft hover:border-brand/40"
                        }`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

export default function PreferencesSection({
    user,
    onSaved,
}: {
    user: ProfileUser;
    onSaved: (user: ProfileUser) => Promise<void>;
}) {
    const p = user.profile;
    const [experience, setExperience] = useState<Profile["experienceLevel"]>(
        p?.experienceLevel ?? null
    );
    const [risk, setRisk] = useState<Profile["riskComfort"]>(p?.riskComfort ?? null);
    const [sectors, setSectors] = useState<string[]>(p?.sectorsOfInterest ?? []);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<Msg>(null);

    function toggleSector(s: string) {
        setSectors((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setMsg(null);

        const body: Record<string, unknown> = { sectorsOfInterest: sectors };
        if (experience) body.experienceLevel = experience;
        if (risk) body.riskComfort = risk;

        const res = await api("/users/me", { method: "PATCH", body });
        if (res.ok) {
            await onSaved(res.data.user);
            setMsg({ type: "ok", text: "Saved" });
        } else {
            setMsg({ type: "err", text: apiError(res.data, "Could not save your preferences") });
        }
        setSaving(false);
    }

    return (
        <ProfileCard
            title="Investing preferences"
            description="Helps us suggest groups that suit you."
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <Label>Experience level</Label>
                    <Segmented options={EXPERIENCE} value={experience} onChange={setExperience} />
                </div>

                <div>
                    <Label>Risk comfort</Label>
                    <Segmented options={RISK} value={risk} onChange={setRisk} />
                </div>

                <div>
                    <Label>Sectors of interest</Label>
                    <div className="flex flex-wrap gap-2">
                        {SECTORS.map((s) => {
                            const on = sectors.includes(s);
                            return (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => toggleSector(s)}
                                    className={`rounded-full border px-3.5 py-1.5 text-sm transition ${on
                                            ? "border-brand bg-brand text-white"
                                            : "border-line bg-white text-ink-soft hover:border-brand/40"
                                        }`}
                                >
                                    {s}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <SaveButton saving={saving} />
                    <Notice msg={msg} />
                </div>
            </form>
        </ProfileCard>
    );
}