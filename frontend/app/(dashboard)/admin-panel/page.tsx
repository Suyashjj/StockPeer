"use client";

import Link from "next/link";
import { BadgeCheck, CreditCard } from "lucide-react";
import { useAdminGet } from "@/features/admin/useAdminGet";
import { PageHeader } from "@/features/admin/components/ReviewParts";

type Queue = { items: unknown[] };

export default function AdminOverviewPage() {
    const pan = useAdminGet<Queue>("/admin/pan/pending");
    const experts = useAdminGet<Queue>("/admin/experts/pending");

    const cards = [
        {
            label: "PAN reviews waiting",
            count: pan.loading ? "…" : String(pan.data?.items.length ?? 0),
            href: "/admin-panel/pan",
            icon: CreditCard,
            tile: "bg-brand/10 text-brand",
        },
        {
            label: "Expert applications waiting",
            count: experts.loading ? "…" : String(experts.data?.items.length ?? 0),
            href: "/admin-panel/experts",
            icon: BadgeCheck,
            tile: "bg-up/10 text-up",
        },
    ];

    return (
        <div>
            <PageHeader title="Overview" subtitle="Everything waiting for your review." />
            <div className="grid gap-4 sm:grid-cols-2">
                {cards.map((c) => {
                    const Icon = c.icon;
                    return (
                        <Link
                            key={c.href}
                            href={c.href}
                            className="rounded-2xl border border-line bg-surface p-6 transition hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(31,41,55,0.08)]"
                        >
                            <div
                                className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.tile}`}
                            >
                                <Icon size={20} />
                            </div>
                            <p className="mt-4 text-3xl font-semibold text-ink">{c.count}</p>
                            <p className="mt-1 text-sm text-ink-soft">{c.label}</p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}