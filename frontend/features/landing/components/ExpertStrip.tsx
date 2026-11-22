import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";

export default function ExpertStrip() {
    return (
        <section className="mx-auto max-w-6xl px-6 pb-14">
            <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-up/10 text-up">
                        <BadgeCheck size={22} />
                    </span>
                    <div>
                        <p className="font-heading text-base font-semibold text-ink">Are you a finance professional?</p>
                        <p className="mt-0.5 text-sm text-ink-soft">
                            SEBI-registered analysts, CAs, CFAs and educators can apply to lead groups. Every
                            expert is verified by our team.
                        </p>
                    </div>
                </div>
                <Link
                    href="/signup/expert"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-brand/40 hover:text-brand"
                >
                    Apply as an expert <ArrowRight size={15} />
                </Link>
            </div>
        </section>
    );
}