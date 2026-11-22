"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { HOME_BY_ROLE } from "@/lib/constants";
import AdminShell from "@/features/admin/components/AdminShell";

export default function AdminAreaLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const router = useRouter();

    const allowed = user?.role === "ADMIN";

    useEffect(() => {
        if (user && !allowed) {
            router.replace(HOME_BY_ROLE[user.role]);
        }
    }, [user, allowed, router]);

    if (!allowed) {
        return <p className="min-h-screen bg-paper p-8 text-ink-soft">Loading...</p>;
    }

    return <AdminShell>{children}</AdminShell>;
}