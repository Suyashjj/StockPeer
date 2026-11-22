"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useAdminGet } from "@/features/admin/useAdminGet";
import {
    EmptyState,
    ErrorBox,
    formatDate,
    PageHeader,
} from "@/features/admin/components/ReviewParts";

type Item = {
    userId: string;
    panMasked: string | null;
    panSubmittedAt: string | null;
    user: { name: string; email: string };
};

export default function PanQueuePage() {
    const { data, loading, error } = useAdminGet<{ items: Item[] }>("/admin/pan/pending");

    return (
        <div>
            <PageHeader title="PAN reviews" subtitle="Oldest submissions first." />
            {loading && <p className="text-ink-soft">Loading...</p>}
            {error && <ErrorBox text={error} />}
            {data && data.items.length === 0 && <EmptyState text="Nothing waiting. All caught up." />}
            {data && data.items.length > 0 && (
                <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                    {data.items.map((i) => (
                        <Link
                            key={i.userId}
                            href={`/admin-panel/pan/${i.userId}`}
                            className="flex items-center gap-4 px-5 py-4 transition hover:bg-line/40"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-ink">{i.user.name}</p>
                                <p className="truncate text-sm text-ink-soft">{i.user.email}</p>
                            </div>
                            <span className="hidden font-mono text-sm text-ink-soft sm:block">
                                {i.panMasked}
                            </span>
                            <span className="hidden text-sm text-ink-soft sm:block">
                                {formatDate(i.panSubmittedAt)}
                            </span>
                            <ChevronRight size={16} className="text-ink-soft" />
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}