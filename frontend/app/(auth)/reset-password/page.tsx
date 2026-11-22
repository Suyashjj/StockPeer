"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { resetSchema, type ResetValues } from "@/features/auth/schemas";
import AuthInput from "@/features/auth/components/AuthInput";
import AuthButton from "@/features/auth/components/AuthButton";
import AuthFieldError from "@/features/auth/components/AuthFieldError";

const card =
    "w-full max-w-sm rounded-2xl border border-line bg-surface p-8 shadow-[0_8px_30px_rgba(31,41,55,0.08)]";

function ResetForm() {
    const token = useSearchParams().get("token") ?? "";
    const [done, setDone] = useState(false);
    const [serverError, setServerError] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });

    async function onSubmit(values: ResetValues) {
        setServerError("");
        const res = await api("/auth/reset-password", {
            method: "POST",
            body: { token, password: values.password },
        });
        if (!res.ok) {
            const fieldErrors = res.data?.errors as Record<string, string[]> | undefined;
            const first = fieldErrors ? Object.values(fieldErrors).flat()[0] : undefined;
            setServerError(first ?? res.data?.message ?? "Something went wrong. Try again.");
            return;
        }
        setDone(true);
    }

    if (!token) {
        return (
            <div className={`${card} text-center`}>
                <h1 className="text-xl font-semibold text-ink">Link not valid</h1>
                <p className="mt-2 text-sm text-ink-soft">This reset link is missing or broken.</p>
                <Link href="/?login=1" className="mt-6 inline-block text-sm font-medium text-brand hover:underline">
                    Request a new link
                </Link>
            </div>
        );
    }

    if (done) {
        return (
            <div className={`${card} text-center`}>
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-up/10 text-up">
                    <CheckCircle2 size={24} />
                </span>
                <h1 className="mt-4 text-xl font-semibold text-ink">Password updated</h1>
                <p className="mt-2 text-sm text-ink-soft">You can now log in with your new password.</p>
                <Link
                    href="/?login=1"
                    className="mt-6 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                >
                    Log in
                </Link>
            </div>
        );
    }

    return (
        <div className={card}>
            <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">Set a new password</h1>
            <p className="mb-6 text-sm text-ink-soft">Choose a strong password you have not used before.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div>
                    <AuthInput
                        {...register("password")}
                        type="password"
                        placeholder="New password"
                        autoComplete="new-password"
                        autoFocus
                    />
                    <AuthFieldError message={errors.password?.message} />
                </div>
                <div>
                    <AuthInput
                        {...register("confirmPassword")}
                        type="password"
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                    />
                    <AuthFieldError message={errors.confirmPassword?.message} />
                </div>

                {serverError && (
                    <p className="text-sm text-down">
                        {serverError}{" "}
                        <Link href="/?login=1" className="font-medium underline">
                            Get a new link
                        </Link>
                    </p>
                )}

                <AuthButton type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Updating..." : "Update password"}
                </AuthButton>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={null}>
            <ResetForm />
        </Suspense>
    );
}