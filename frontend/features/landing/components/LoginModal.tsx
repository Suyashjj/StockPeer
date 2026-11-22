"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import LoginForm from "@/features/auth/components/LoginForm";
import ForgotPasswordForm from "@/features/auth/components/ForgotPasswordForm";

export default function LoginModal({
    open,
    next,
    onClose,
}: {
    open: boolean;
    next?: string;
    onClose: () => void;
}) {
    const [view, setView] = useState<"login" | "forgot">("login");

    // Always start on the login view when the popup opens
    useEffect(() => {
        if (open) setView("login");
    }, [open]);

    // Esc closes, and the page behind stops scrolling while the popup is open
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);

    if (!open) return null;

    const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : "/signup";
    const forgot = view === "forgot";

    return (
        <div
            className="ai-line fixed inset-0 z-[100] flex items-center justify-center bg-ink/45 p-4 backdrop-blur-sm"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="login-title"
                className="relative w-full max-w-sm rounded-2xl border border-line bg-surface p-8 shadow-[0_24px_60px_-20px_rgba(15,26,51,0.45)]"
            >
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-3.5 right-3.5 flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition hover:bg-line hover:text-ink"
                >
                    <X size={18} />
                </button>

                <h2 id="login-title" className="mb-1 text-2xl font-semibold tracking-tight text-ink">
                    {forgot ? "Forgot password?" : "Log in"}
                </h2>
                <p className="mb-6 text-sm text-ink-soft">
                    {forgot
                        ? "Enter your email and we will send you a link to set a new one."
                        : next
                            ? "Log in to join this group."
                            : "Welcome back to StockPeer"}
                </p>

                {forgot ? (
                    <ForgotPasswordForm onBack={() => setView("login")} />
                ) : (
                    <>
                        <LoginForm next={next} autoFocus onDone={onClose} onForgot={() => setView("forgot")} />
                        <p className="mt-6 text-center text-sm text-ink-soft">
                            New here?{" "}
                            <Link href={signupHref} className="font-medium text-brand hover:underline">
                                Create an account
                            </Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}