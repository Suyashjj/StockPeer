"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { api } from "@/lib/api";
import { apiError, fieldClass, Label, Notice, ProfileCard, SaveButton, type Msg } from "./shared";
import type { ProfileUser } from "./types";

export default function PersonalSection({
    user,
    locked,
    onSaved,
}: {
    user: ProfileUser;
    locked: boolean;
    onSaved: (user: ProfileUser) => Promise<void>;
}) {
    const p = user.profile;
    const [name, setName] = useState(user.name);
    const [dob, setDob] = useState(p?.dateOfBirth ? p.dateOfBirth.slice(0, 10) : "");
    const [city, setCity] = useState(p?.city ?? "");
    const [occupation, setOccupation] = useState(p?.occupation ?? "");
    const [language, setLanguage] = useState(p?.language ?? "en");
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<Msg>(null);

    // You must be 18 or older
    const maxDob = new Date();
    maxDob.setFullYear(maxDob.getFullYear() - 18);
    const maxDobValue = maxDob.toISOString().slice(0, 10);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setMsg(null);

        const body: Record<string, unknown> = { city, occupation, language };
        if (!locked) {
            body.name = name;
            if (dob) body.dateOfBirth = dob;
        }

        const res = await api("/users/me", { method: "PATCH", body });
        if (res.ok) {
            await onSaved(res.data.user);
            setMsg({ type: "ok", text: "Saved" });
        } else {
            setMsg({ type: "err", text: apiError(res.data, "Could not save your details") });
        }
        setSaving(false);
    }

    return (
        <ProfileCard title="Personal details" description="Keep your details accurate and up to date.">
            <form onSubmit={handleSubmit} className="space-y-4">
                {locked && (
                    <div className="flex items-start gap-2 rounded-lg bg-line/50 px-3 py-2 text-xs text-ink-soft">
                        <Lock size={14} className="mt-0.5 shrink-0" />
                        Name and date of birth can't be changed while your PAN is under review or
                        verified.
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <Label>Full name</Label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={locked}
                            className={fieldClass}
                        />
                    </div>
                    <div>
                        <Label>Date of birth</Label>
                        <input
                            type="date"
                            value={dob}
                            max={maxDobValue}
                            onChange={(e) => setDob(e.target.value)}
                            disabled={locked}
                            className={fieldClass}
                        />
                    </div>
                    <div>
                        <Label>City</Label>
                        <input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="e.g. Bhopal"
                            className={fieldClass}
                        />
                    </div>
                    <div>
                        <Label>Occupation</Label>
                        <input
                            value={occupation}
                            onChange={(e) => setOccupation(e.target.value)}
                            placeholder="e.g. Student, Engineer"
                            className={fieldClass}
                        />
                    </div>
                    <div>
                        <Label>Language</Label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className={fieldClass}
                        >
                            <option value="en">English</option>
                            <option value="hi">Hindi</option>
                        </select>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <Label>Email</Label>
                        <input value={user.email} disabled className={fieldClass} />
                    </div>
                    <div>
                        <Label>Mobile number</Label>
                        <input value={user.phone} disabled className={fieldClass} />
                    </div>
                </div>
                <p className="text-xs text-ink-soft">
                    Email and mobile can't be edited yet. Changing them will need verification, which
                    we'll add later.
                </p>

                <div className="flex items-center gap-4">
                    <SaveButton saving={saving} />
                    <Notice msg={msg} />
                </div>
            </form>
        </ProfileCard>
    );
}