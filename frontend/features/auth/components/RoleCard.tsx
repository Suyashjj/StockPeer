import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type Props = {
    href: string;
    title: string;
    description: string;
    points: string[];
    icon?: LucideIcon;
};

export default function RoleCard({ href, title, description, points, icon: Icon }: Props) {
    return (
        <Link
            href={href}
            className="group block rounded-2xl border border-line bg-surface p-8 transition duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_8px_30px_rgba(31,41,55,0.08)]"
        >
            {Icon && (
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon size={22} />
                </div>
            )}
            <h2 className="mb-1 text-xl font-bold tracking-tight text-ink">{title}</h2>
            <p className="mb-5 text-sm text-ink-soft">{description}</p>
            <ul className="mb-6 space-y-2">
                {points.map((p) => (
                    <li key={p} className="flex gap-2 text-sm text-ink-soft">
                        <span className="font-semibold text-up">✓</span>
                        {p}
                    </li>
                ))}
            </ul>
            <span className="text-sm font-medium text-brand group-hover:underline">
                Continue →
            </span>
        </Link>
    );
}