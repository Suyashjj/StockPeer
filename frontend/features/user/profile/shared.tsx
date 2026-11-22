import type { ReactNode } from "react";

export const fieldClass =
    "w-full rounded-lg border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-line/40 disabled:text-ink-soft";

export type Msg = { type: "ok" | "err"; text: string } | null;

export function apiError(data: unknown, fallback: string) {
    const d = data as { message?: string; errors?: Record<string, string[]> } | undefined;
    const first = d?.errors ? Object.values(d.errors).flat()[0] : undefined;
    return first ?? d?.message ?? fallback;
}

export function ProfileCard({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-line bg-surface p-6 shadow-[0_8px_30px_rgba(31,41,55,0.05)]">
            <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
            {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
            <div className="mt-5">{children}</div>
        </section>
    );
}

export function Label({ children }: { children: ReactNode }) {
    return <label className="mb-1.5 block text-sm font-medium text-ink">{children}</label>;
}

export function Notice({ msg }: { msg: Msg }) {
    if (!msg) return null;
    return <p className={`text-sm ${msg.type === "ok" ? "text-up" : "text-down"}`}>{msg.text}</p>;
}

export function SaveButton({
    saving,
    children = "Save changes",
}: {
    saving: boolean;
    children?: ReactNode;
}) {
    return (
        <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
            {saving ? "Saving..." : children}
        </button>
    );
}