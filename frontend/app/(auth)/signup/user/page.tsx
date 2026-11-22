"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountSchema, type AccountValues } from "@/features/auth/schemas";
import { api } from "@/lib/api";
import { safeNext } from "@/lib/safeNext";
import AuthInput from "@/features/auth/components/AuthInput";
import AuthButton from "@/features/auth/components/AuthButton";
import AuthFieldError from "@/features/auth/components/AuthFieldError";

function UserSignupForm() {
    const router = useRouter();
    const { setUser } = useAuth();
    const [serverError, setServerError] = useState("");
    const next = safeNext(useSearchParams().get("next"));

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<AccountValues>({ resolver: zodResolver(accountSchema) });

    async function onSubmit(values: AccountValues) {
        setServerError("");
        const { name, email, phone, password } = values;

        const res = await api("/auth/signup", {
            method: "POST",
            body: { name, email, phone, password },
        });

        if (!res.ok) {
            setServerError(res.data.message ?? "Something went wrong. Try again.");
            return;
        }

        setUser(res.data.user);
        // A new user always lands in the user area; follow "next" only inside it
        router.push(next && next.startsWith("/user") ? next : "/user");
    }

    return (
        <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 shadow-[0_8px_30px_rgba(31,41,55,0.08)]">
            <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">Create your account</h1>
            <p className="mb-6 text-sm text-ink-soft">
                {next ? "Sign up to join this group." : "Sign up as a User"}
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div>
                    <AuthInput {...register("name")} placeholder="Full name" />
                    <AuthFieldError message={errors.name?.message} />
                </div>

                <div>
                    <AuthInput {...register("email")} type="email" placeholder="Gmail address" autoComplete="email" />
                    <AuthFieldError message={errors.email?.message} />
                </div>

                <div>
                    <AuthInput
                        {...register("phone")}
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="Mobile number"
                    />
                    <AuthFieldError message={errors.phone?.message} />
                </div>

                <div>
                    <AuthInput {...register("password")} type="password" placeholder="Password" />
                    <AuthFieldError message={errors.password?.message} />
                </div>

                <div>
                    <AuthInput
                        {...register("confirmPassword")}
                        type="password"
                        placeholder="Confirm password"
                    />
                    <AuthFieldError message={errors.confirmPassword?.message} />
                </div>

                <div>
                    <label className="flex items-start gap-2 text-xs text-ink-soft">
                        <input
                            type="checkbox"
                            {...register("terms")}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                        />
                        <span>
                            I agree to the{" "}
                            <Link href="/terms" target="_blank" className="font-medium text-brand hover:underline">
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link href="/privacy" target="_blank" className="font-medium text-brand hover:underline">
                                Privacy Policy
                            </Link>
                            . I understand StockPeer discussions are not investment advice.
                        </span>
                    </label>
                    <AuthFieldError message={errors.terms?.message} />
                </div>

                {serverError && <p className="text-sm text-down">{serverError}</p>}

                <AuthButton type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating account..." : "Sign up"}
                </AuthButton>
            </form>

            <div className="mt-6 space-y-1 text-center text-sm text-ink-soft">
                <p>
                    Already have an account?{" "}
                    <Link
                        href={`/?login=1${next ? `&next=${encodeURIComponent(next)}` : ""}`}
                        className="font-medium text-brand hover:underline"
                    >
                        Log in
                    </Link>
                </p>
                <p>
                    Are you a professional?{" "}
                    <Link href="/signup/expert" className="font-medium text-brand hover:underline">
                        Switch to Expert
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default function UserSignupPage() {
    return (
        <Suspense fallback={null}>
            <UserSignupForm />
        </Suspense>
    );
}