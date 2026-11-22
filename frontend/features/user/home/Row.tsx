import Link from "next/link";
import { ChevronRight } from "lucide-react";

const TONES = {
    brand: "bg-brand/10 text-brand",
    fire: "bg-down/10 text-down",
    gold: "bg-amber-50 text-amber-700",
    neutral: "bg-line text-ink-soft",
} as const;

export default function Row({
    title,
    icon,
    tone = "brand",
    count,
    action,
    seeAll,
    className = "grid gap-4 sm:grid-cols-2 2xl:grid-cols-3",
    children,
}: {
    title: string;
    icon?: React.ReactNode;
    tone?: keyof typeof TONES;
    count?: number;
    action?: React.ReactNode;
    seeAll?: { href: string; label?: string };
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <section>
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2.5 font-heading text-[17px] font-semibold tracking-tight text-ink">
                    {icon && (
                        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${TONES[tone]}`}>
                            {icon}
                        </span>
                    )}
                    {title}
                    {count !== undefined && (
                        <span className="rounded-full bg-line px-2 py-0.5 text-[11px] font-medium text-ink-soft tabular-nums">
                            {count}
                        </span>
                    )}
                </h2>
                <div className="flex items-center gap-3">
                    {action}
                    {seeAll && (
                        <Link
                            href={seeAll.href}
                            className="inline-flex items-center gap-0.5 text-xs font-medium text-brand hover:underline"
                        >
                            {seeAll.label ?? "See all"} <ChevronRight size={14} />
                        </Link>
                    )}
                </div>
            </div>
            <div className={className}>{children}</div>
        </section>
    );
}