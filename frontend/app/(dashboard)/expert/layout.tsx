"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { HOME_BY_ROLE } from "@/lib/constants";
import ExpertShell from "@/features/expert/components/ExpertShell";
import ExpertGate from "@/features/expert/components/ExpertGate";

export default function ExpertAreaLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const router = useRouter();

    const allowed = user?.role === "EXPERT";

    useEffect(() => {
        if (user && !allowed) {
            router.replace(HOME_BY_ROLE[user.role]);
        }
    }, [user, allowed, router]);

    if (!allowed) {
        return <p className="min-h-screen bg-paper p-8 text-ink-soft">Loading...</p>;
    }

    return (
        <ExpertShell>
            <ExpertGate>{children}</ExpertGate>
        </ExpertShell>
    );
}