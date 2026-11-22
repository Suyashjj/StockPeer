import Link from "next/link";
import { BadgeCheck, User } from "lucide-react";
import RoleCard from "@/features/auth/components/RoleCard";
import { safeNext } from "@/lib/safeNext";

export default async function SignupPage({
    searchParams,
}: {
    searchParams: Promise<{ next?: string }>;
}) {
    const next = safeNext((await searchParams).next);
    const q = next ? `?next=${encodeURIComponent(next)}` : "";

    return (
        <div className="w-full max-w-3xl">
            <h1 className="mb-2 text-center text-3xl font-semibold tracking-tight text-ink">
                Join Stock<span className="text-brand">Peer</span>
            </h1>
            <p className="mb-10 text-center text-ink-soft">Choose how you want to get started</p>

            <div className="grid gap-6 md:grid-cols-2">
                <RoleCard
                    href={`/signup/user${q}`}
                    icon={User}
                    title="Join as User"
                    description="Discuss stocks with people who follow the same companies."
                    points={[
                        "Join stock-specific groups",
                        "Follow news and live discussions",
                        "Upgrade to premium guided groups",
                    ]}
                />
                <RoleCard
                    href="/signup/expert"
                    icon={BadgeCheck}
                    title="Join as Expert"
                    description="Guide investors as a verified professional."
                    points={[
                        "SEBI registered / CA / CFA verified",
                        "Lead premium groups",
                        "Build your profile and following",
                    ]}
                />
            </div>

            <p className="mt-8 text-center text-sm text-ink-soft">
                Already have an account?{" "}
                <Link href={`/?login=1${next ? `&next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-brand hover:underline">
                    Log in
                </Link>
            </p>
        </div>
    );
}