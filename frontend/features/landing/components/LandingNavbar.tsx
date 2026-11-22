"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { HOME_BY_ROLE } from "@/lib/constants";
import { useLoginModal } from "./LandingShell";

export default function LandingNavbar() {
    const { user, loading } = useAuth();
    const { openLogin } = useLoginModal();

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-line bg-paper/85 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2">
                <Link href="/" className="flex shrink-0 items-center" aria-label="StockPeer home">
                    <Image
                        src="/logo_nav.png"
                        alt="StockPeer"
                        width={600}
                        height={500}
                        priority
                        className="-my-3 h-20 w-auto mix-blend-multiply"
                    />
                </Link>

                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Same size while loading, so nothing jumps once the session is known */}
                    {loading ? (
                        <div className="h-9 w-40" />
                    ) : user ? (
                        <Link
                            href={HOME_BY_ROLE[user.role]}
                            className="inline-flex items-center gap-2 rounded-lg bg-brand py-2 pr-3 pl-2 text-sm font-medium text-white transition hover:opacity-90"
                        >
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                                {user.name?.charAt(0).toUpperCase() ?? "U"}
                            </span>
                            Open dashboard <ArrowRight size={15} />
                        </Link>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => openLogin()}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-ink transition hover:bg-line/60"
                            >
                                Log in
                            </button>
                            <Link
                                href="/signup"
                                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                            >
                                Sign up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}