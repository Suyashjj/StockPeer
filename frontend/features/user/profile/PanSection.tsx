"use client";

import { useState } from "react";
import { BadgeCheck, Clock } from "lucide-react";
import { api } from "@/lib/api";
import FileUploadField from "@/features/auth/components/FileUploadField";
import { apiError, fieldClass, Label, Notice, ProfileCard, SaveButton, type Msg } from "./shared";
import type { ProfileUser } from "./types";

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/i;

export default function PanSection({
    user,
    onReload,
}: {
    user: ProfileUser;
    onReload: () => Promise<void>;
}) {
    const p = user.profile;
    const status = p?.panStatus ?? "NOT_SUBMITTED";

    const [pan, setPan] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [panError, setPanError] = useState("");
    const [fileError, setFileError] = useState("");
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<Msg>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null);

        const bad = !PAN_REGEX.test(pan.trim());
        setPanError(bad ? "Enter a valid PAN (e.g. ABCDE1234F)" : "");
        setFileError(file ? "" : "Upload a clear photo of your PAN card");
        if (bad || !file) return;

        setSaving(true);
        const fd = new FormData();
        fd.append("pan", pan.trim().toUpperCase());
        fd.append("panDocument", file);

        const res = await api("/users/me/pan", { method: "POST", body: fd });
        if (res.ok) {
            await onReload();
        } else {
            setMsg({ type: "err", text: apiError(res.data, "Could not submit your PAN") });
        }
        setSaving(false);
    }

    if (status === "PENDING") {
        return (
            <ProfileCard title="PAN verification">
                <div className="flex items-start gap-3 rounded-xl border border-brand/20 bg-brand/5 p-4">
                    <Clock size={20} className="mt-0.5 shrink-0 text-brand" />
                    <div>
                        <p className="font-medium text-ink">Under review</p>
                        <p className="mt-1 text-sm text-ink-soft">
                            We're checking your PAN <span className="font-mono">{p?.panMasked}</span>
                            . You'll see the result here.
                        </p>
                    </div>
                </div>
            </ProfileCard>
        );
    }

    if (status === "VERIFIED") {
        return (
            <ProfileCard title="PAN verification">
                <div className="flex items-start gap-3 rounded-xl border border-up/20 bg-up/5 p-4">
                    <BadgeCheck size={20} className="mt-0.5 shrink-0 text-up" />
                    <div>
                        <p className="font-medium text-ink">Verified</p>
                        <p className="mt-1 text-sm text-ink-soft">
                            PAN <span className="font-mono">{p?.panMasked}</span> is verified.
                        </p>
                    </div>
                </div>
            </ProfileCard>
        );
    }

    return (
        <ProfileCard
            title="PAN verification"
            description="Needed before you can buy a premium plan. Your PAN is stored encrypted and never shown in full."
        >
            {status === "REJECTED" && (
                <div className="mb-4 rounded-lg border border-down/30 bg-down/5 px-4 py-3 text-sm text-down">
                    Your last submission was rejected: {p?.panRejectReason ?? "no reason given"}.
                    Please submit again.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label>PAN number</Label>
                    <input
                        value={pan}
                        onChange={(e) => setPan(e.target.value.toUpperCase())}
                        maxLength={10}
                        placeholder="ABCDE1234F"
                        className={`${fieldClass} uppercase placeholder:normal-case`}
                    />
                    {panError && <p className="mt-1 text-xs text-down">{panError}</p>}
                </div>

                <FileUploadField
                    label="PAN card photo"
                    hint="A clear photo of your PAN card. Stored privately, only used for verification."
                    file={file}
                    onChange={setFile}
                    error={fileError}
                />

                <div className="flex items-center gap-4">
                    <SaveButton saving={saving}>Submit for verification</SaveButton>
                    <Notice msg={msg} />
                </div>
            </form>
        </ProfileCard>
    );
}