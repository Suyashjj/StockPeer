"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { EXPERT_TYPES } from "@/features/auth/schemas";
import { useAdminGet } from "@/features/admin/useAdminGet";
import {
    EmptyState,
    ErrorBox,
    formatDate,
    PageHeader,
} from "@/features/admin/components/ReviewParts";

type Item = {
    userId: string;
    expertType: string;
    submittedAt: string;
    user: { name: string; email: string };
};

const typeLabel = (v: string) => EXPERT_TYPES.find((t) => t.value === v)?.label ?? v;

export default function ExpertQueuePage() {
    const { data, loading, error } = useAdminGet<{ items: Item[] }>("/admin/experts/pending");

    return (
        <div>
            <PageHeader title="Expert applications" subtitle="Oldest applications first." />
            {loading && <p className="text-ink-soft">Loading...</p>}
            {error && <ErrorBox text={error} />}
            {data && data.items.length === 0 && <EmptyState text="Nothing waiting. All caught up." />}
            {data && data.items.length > 0 && (
                <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                    {data.items.map((i) => (
                        <Link
                            key={i.userId}
                            href={`/admin-panel/experts/${i.userId}`}
                            className="flex items-center gap-4 px-5 py-4 transition hover:bg-line/40"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-ink">{i.user.name}</p>
                                <p className="truncate text-sm text-ink-soft">{i.user.email}</p>
                            </div>
                            <span className="hidden rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand sm:block">
                                {typeLabel(i.expertType)}
                            </span>
                            <span className="hidden text-sm text-ink-soft sm:block">
                                {formatDate(i.submittedAt)}
                            </span>
                            <ChevronRight size={16} className="text-ink-soft" />
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}