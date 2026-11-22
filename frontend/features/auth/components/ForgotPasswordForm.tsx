"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { api } from "@/lib/api";
import { forgotSchema, type ForgotValues } from "@/features/auth/schemas";
import AuthInput from "@/features/auth/components/AuthInput";
import AuthButton from "@/features/auth/components/AuthButton";
import AuthFieldError from "@/features/auth/components/AuthFieldError";

export default function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
    const [sentTo, setSentTo] = useState("");
    const [serverError, setServerError] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) });

    async function onSubmit(values: ForgotValues) {
        setServerError("");
        const res = await api("/auth/forgot-password", { method: "POST", body: values });
        if (!res.ok) {
            setServerError(res.data?.message ?? "Something went wrong. Try again.");
            return;
        }
        setSentTo(values.email);
    }

    if (sentTo) {
        return (
            <div className="text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-up/10 text-up">
                    <MailCheck size={22} />
                </span>
                <p className="mt-4 text-sm text-ink">
                    If an account exists for <span className="font-semibold">{sentTo}</span>, we have sent a reset link.
                </p>
                <p className="mt-2 text-xs text-ink-soft">
                    The link works for 30 minutes. Check your spam folder if you do not see it.
                </p>
                <button onClick={onBack} className="mt-6 text-sm font-medium text-brand hover:underline">
                    Back to log in
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
                <AuthInput
                    {...register("email")}
                    type="email"
                    placeholder="Your account email"
                    autoComplete="email"
                    autoFocus
                />
                <AuthFieldError message={errors.email?.message} />
            </div>

            {serverError && <p className="text-sm text-down">{serverError}</p>}

            <AuthButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send reset link"}
            </AuthButton>

            <p className="text-center">
                <button type="button" onClick={onBack} className="text-sm font-medium text-brand hover:underline">
                    Back to log in
                </button>
            </p>
        </form>
    );
}