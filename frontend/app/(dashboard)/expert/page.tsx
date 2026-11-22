"use client";

import { MessagesSquare, Star, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const SAMPLE = { groups: "3", members: "1,240", answers: "86" };
const REAL = { groups: "0", members: "0", answers: "0" };

export default function ExpertHomePage() {
    const { user } = useAuth();
    if (!user) return null;

    const approved = user.verificationStatus === "APPROVED";
    const stats = approved ? REAL : SAMPLE;

    const cards = [
        { label: "Groups guided", value: stats.groups, icon: Users, tile: "bg-up/10 text-up" },
        {
            label: "Members reached",
            value: stats.members,
            icon: Star,
            tile: "bg-brand/10 text-brand",
        },
        {
            label: "Answers given",
            value: stats.answers,
            icon: MessagesSquare,
            tile: "bg-down/10 text-down",
        },
    ];

    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink">Welcome, {user.name}</h1>
            <p className="mt-2 text-ink-soft">
                {approved
                    ? "You're a verified expert."
                    : "Here's a preview of your expert dashboard."}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {cards.map((c) => {
                    const Icon = c.icon;
                    return (
                        <div
                            key={c.label}
                            className="rounded-2xl border border-line bg-surface p-5"
                        >
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.tile}`}
                            >
                                <Icon size={18} />
                            </div>
                            <p className="mt-4 text-2xl font-semibold text-ink">{c.value}</p>
                            <p className="mt-1 text-sm text-ink-soft">{c.label}</p>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
                <h2 className="text-lg font-semibold text-ink">
                    {approved ? "Your groups" : "Recent questions"}
                </h2>
                <p className="mt-2 text-sm text-ink-soft">
                    {approved
                        ? "No groups assigned yet. Once groups are assigned to you, they'll appear here."
                        : "Questions from members in your groups will show up here, so you can answer them."}
                </p>
            </div>
        </div>
    );
}