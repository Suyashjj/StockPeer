"use client";

import Link from "next/link";
import { BadgeCheck, Clock, ShieldAlert, X } from "lucide-react";

const COPY: Record<string, { title: string; text: string; button: string; icon: typeof Clock }> = {
    NOT_SUBMITTED: {
        title: "Verify your PAN to join",
        text: "Every member is PAN verified, which keeps our groups genuine. It takes a minute to submit.",
        button: "Verify PAN",
        icon: BadgeCheck,
    },
    PENDING: {
        title: "Your PAN is under review",
        text: "We're checking it now. You'll be able to join groups as soon as it's approved.",
        button: "View status",
        icon: Clock,
    },
    REJECTED: {
        title: "Your PAN was not approved",
        text: "Please submit it again with a clear photo of the card.",
        button: "Submit again",
        icon: ShieldAlert,
    },
};

export default function PanGateDialog({
    panStatus,
    onClose,
}: {
    panStatus: string;
    onClose: () => void;
}) {
    const c = COPY[panStatus] ?? COPY.NOT_SUBMITTED;
    const Icon = c.icon;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-xl"
            >
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-4 right-4 text-ink-soft transition hover:text-ink"
                >
                    <X size={18} />
                </button>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon size={22} />
                </div>
                <h2 className="mt-4 font-heading text-xl font-bold text-ink">{c.title}</h2>
                <p className="mt-2 text-sm text-ink-soft">{c.text}</p>
                <Link
                    href="/user/profile"
                    className="mt-5 block rounded-lg bg-brand py-2.5 text-center text-sm font-medium text-white transition hover:opacity-90"
                >
                    {c.button}
                </Link>
            </div>
        </div>
    );
}