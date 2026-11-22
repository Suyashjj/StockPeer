"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLoginModal } from "./LandingShell";

const linkCls = "text-[13px] text-ink-soft transition hover:text-ink lg:text-sm";
const headCls = "mb-2 text-[11px] font-semibold tracking-wider text-ink uppercase lg:mb-3 lg:text-xs";

export default function LandingFooter() {
    const { user } = useAuth();
    const { openLogin } = useLoginModal();

    return (
        <footer className="border-t border-line">
            <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-7 px-5 py-8 sm:px-6 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:gap-10 lg:py-12">
                {/* Brand */}
                <div className="col-span-2 lg:col-span-1">
                    <Link href="/" className="font-heading text-lg font-bold tracking-tight text-ink lg:text-xl">
                        Stock<span className="text-brand">Peer</span>
                    </Link>
                    <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-soft lg:mt-3 lg:text-sm">
                        Discuss stocks with people who follow the same companies.
                    </p>
                </div>

                <div>
                    <p className={headCls}>Product</p>
                    <ul className="space-y-1.5 lg:space-y-2">
                        <li><a href="/#groups" className={linkCls}>Groups</a></li>
                        <li><a href="/#how-it-works" className={linkCls}>How it works</a></li>
                        <li>
                            {user ? (
                                <Link href="/user/premium" className={linkCls}>Plans</Link>
                            ) : (
                                <button onClick={() => openLogin("/user/premium")} className={linkCls}>Plans</button>
                            )}
                        </li>
                    </ul>
                </div>

                <div>
                    <p className={headCls}>Account</p>
                    <ul className="space-y-1.5 lg:space-y-2">
                        {user ? (
                            <li><Link href="/user" className={linkCls}>Dashboard</Link></li>
                        ) : (
                            <>
                                <li><button onClick={() => openLogin()} className={linkCls}>Log in</button></li>
                                <li><Link href="/signup" className={linkCls}>Sign up</Link></li>
                            </>
                        )}
                        <li><Link href="/contact" className={linkCls}>Contact us</Link></li>
                    </ul>
                </div>

                <div>
                    <p className={headCls}>For experts</p>
                    <ul className="space-y-1.5 lg:space-y-2">
                        <li><Link href="/signup/expert" className={linkCls}>Become an expert</Link></li>
                    </ul>
                </div>

                <div>
                    <p className={headCls}>Legal</p>
                    <ul className="space-y-1.5 lg:space-y-2">
                        <li><Link href="/terms" className={linkCls}>Terms of Service</Link></li>
                        <li><Link href="/privacy" className={linkCls}>Privacy Policy</Link></li>
                        <li><Link href="/refund-policy" className={linkCls}>Refund Policy</Link></li>
                        <li><Link href="/disclaimer" className={linkCls}>Disclaimer</Link></li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-line">
                <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4 text-[11px] text-ink-soft sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-5 lg:text-xs">
                    <p>© 2026 StockPeer. All rights reserved.</p>
                    <p>StockPeer is a discussion platform and does not provide investment advice.</p>
                </div>
            </div>
        </footer>
    );
}