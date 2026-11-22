"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { HOME_BY_ROLE, type Role } from "@/lib/constants";
import { safeNext } from "@/lib/safeNext";
import { loginSchema, type LoginValues } from "@/features/auth/schemas";
import AuthInput from "@/features/auth/components/AuthInput";
import AuthButton from "@/features/auth/components/AuthButton";
import AuthFieldError from "@/features/auth/components/AuthFieldError";

export default function LoginForm({
    next,
    autoFocus = false,
    onDone,
    onForgot,
}: {
    next?: string | null;
    autoFocus?: boolean;
    onDone?: () => void;
    onForgot?: () => void;
}) {
    const router = useRouter();
    const { setUser } = useAuth();
    const [serverError, setServerError] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

    async function onSubmit(values: LoginValues) {
        setServerError("");

        const res = await api("/auth/login", { method: "POST", body: values });
        if (!res.ok) {
            setServerError(res.data.message ?? "Login failed");
            return;
        }

        setUser(res.data.user);
        onDone?.();

        const home = HOME_BY_ROLE[res.data.user.role as Role] ?? "/user";
        const target = safeNext(next);
        router.push(target && target.startsWith(home) ? target : home);
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
                <AuthInput
                    {...register("email")}
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    autoFocus={autoFocus}
                />
                <AuthFieldError message={errors.email?.message} />
            </div>

            <div>
                <AuthInput
                    {...register("password")}
                    type="password"
                    placeholder="Password"
                    autoComplete="current-password"
                />
                <AuthFieldError message={errors.password?.message} />
                {onForgot && (
                    <div className="mt-2 text-right">
                        <button
                            type="button"
                            onClick={onForgot}
                            className="text-xs font-medium text-brand hover:underline"
                        >
                            Forgot password?
                        </button>
                    </div>
                )}
            </div>

            {serverError && <p className="text-sm text-down">{serverError}</p>}

            <AuthButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Logging in..." : "Log in"}
            </AuthButton>
        </form>
    );
}