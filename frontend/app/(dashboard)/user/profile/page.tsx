"use client";

import { useProfile } from "@/features/user/profile/useProfile";
import ProfileHeader from "@/features/user/profile/ProfileHeader";
import PersonalSection from "@/features/user/profile/PersonalSection";
import PreferencesSection from "@/features/user/profile/PreferencesSection";
import PanSection from "@/features/user/profile/PanSection";
import { ProfileCard } from "@/features/user/profile/shared";
import PageTitle from "@/features/user/components/PageTitle";

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
            <PageTitle title="Profile" subtitle="Manage your details, preferences and verification." />

            <ProfileHeader user={data} onReload={reload} />
            <PersonalSection user={data} locked={locked} onSaved={applyUser} />
            <PreferencesSection user={data} onSaved={applyUser} />
            <PanSection user={data} onReload={reload} />

        </div>
    );
}