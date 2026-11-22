"use client";

import { useProfile } from "@/features/user/profile/useProfile";
import ProfileHeader from "@/features/user/profile/ProfileHeader";
import PersonalSection from "@/features/user/profile/PersonalSection";
import PreferencesSection from "@/features/user/profile/PreferencesSection";
import PanSection from "@/features/user/profile/PanSection";
import { ProfileCard } from "@/features/user/profile/shared";

export default function ProfilePage() {
    const { data, loading, error, reload, applyUser } = useProfile();

    if (loading) return <p className="text-ink-soft">Loading your profile...</p>;

    if (error || !data) {
        return (
            <p className="rounded-xl border border-down/30 bg-down/5 p-4 text-sm text-down">
                {error || "Could not load your profile."}
            </p>
        );
    }

    const panStatus = data.profile?.panStatus ?? "NOT_SUBMITTED";
    const locked = panStatus === "PENDING" || panStatus === "VERIFIED";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-ink">Profile</h1>
                <p className="mt-1 text-ink-soft">Manage your details, preferences and verification.</p>
            </div>

            <ProfileHeader user={data} onReload={reload} />
            <PersonalSection user={data} locked={locked} onSaved={applyUser} />
            <PreferencesSection user={data} onSaved={applyUser} />
            <PanSection user={data} onReload={reload} />

            <ProfileCard
                title="Security"
                description="Change password is coming soon. We'll add it with its own backend endpoint."
            >
                <p className="text-sm text-ink-soft">Not available yet.</p>
            </ProfileCard>
        </div>
    );
}