"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Clock, Lock, RefreshCw, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

type Application = {
    applicationStatus: "PENDING" | "APPROVED" | "REJECTED";
    rejectReason: string | null;
};

export default function ExpertGate({ children }: { children: React.ReactNode }) {
    const { user, setUser } = useAuth();
    const pathname = usePathname();
    const open = pathname.startsWith("/expert/profile") || pathname.startsWith("/expert/support");
    const [application, setApplication] = useState<Application | null>(null);
    const [checking, setChecking] = useState(false);
    const [notice, setNotice] = useState("");

    const status = user?.verificationStatus;
    const locked = status !== "APPROVED";
    const rejected = status === "REJECTED";

    const loadApplication = useCallback(async () => {
        const res = await api("/expert/me");
        if (res.ok) setApplication(res.data.application);
    }, []);

    useEffect(() => {
        if (locked) loadApplication();
    }, [locked, loadApplication]);

    // Re-reads the account from the server, so approval is picked up without logging in again
    async function checkStatus() {
        setChecking(true);
        setNotice("");
        const res = await api("/auth/me");
        if (res.ok) {
            setUser(res.data.user);
            if (res.data.user.verificationStatus !== "APPROVED") {
                await loadApplication();
                setNotice("Still under review. We'll unlock your dashboard once you're approved.");
            }
        } else {
            setNotice("Could not check your status. Please try again.");
        }
        setChecking(false);
    }

    if (!locked || open) return <>{children}</>;

    return (
        <div>
            {/* Banner */}
            <div
                className={`mb-6 flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center ${rejected ? "border-down/30 bg-down/5" : "border-brand/20 bg-brand/5"
                    }`}
            >
                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${rejected ? "bg-down/10 text-down" : "bg-brand/10 text-brand"
                        }`}
                >
                    {rejected ? <ShieldAlert size={22} /> : <Clock size={22} />}
                </div>

                <div className="flex-1">
                    <p className="font-semibold text-ink">
                        {rejected
                            ? "Your application was not approved"
                            : "Your application is under review"}
                    </p>
                    {rejected ? (
                        <p className="mt-1 text-sm text-ink-soft">
                            Reason: {application?.rejectReason ?? "Not provided"}. Re-submitting
                            your application will be available soon.
                        </p>
                    ) : (
                        <p className="mt-1 text-sm text-ink-soft">
                            Our team is checking your details and documents. Your dashboard unlocks
                            as soon as you're approved.
                        </p>
                    )}
                    {notice && <p className="mt-2 text-sm text-ink-soft">{notice}</p>}
                </div>

                <button
                    onClick={checkStatus}
                    disabled={checking}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-brand disabled:opacity-60"
                >
                    <RefreshCw size={14} className={checking ? "animate-spin" : ""} />
                    {checking ? "Checking..." : "Check status"}
                </button>
            </div>

            {/* Locked content */}
            <div className="relative">
                <div
                    inert
                    aria-hidden="true"
                    className="pointer-events-none opacity-70 blur-[6px] select-none"
                >
                    {children}
                </div>

                <div className="absolute inset-x-0 top-24 flex justify-center px-4">
                    <div className="flex items-center gap-3 rounded-full border border-line bg-surface px-5 py-3 shadow-[0_8px_30px_rgba(31,41,55,0.12)]">
                        <Lock size={16} className="text-ink-soft" />
                        <span className="text-sm font-medium text-ink">
                            {rejected ? "Locked" : "Locked until you're verified"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}