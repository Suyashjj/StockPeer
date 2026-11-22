import LandingShell from "./LandingShell";
import LandingNavbar from "./LandingNavbar";
import LandingFooter from "./LandingFooter";

/** Shared frame for Terms, Privacy, Refund, Disclaimer and Contact. */
export default function LegalPage({
    title,
    updated,
    intro,
    children,
}: {
    title: string;
    updated?: string;
    intro?: string;
    children: React.ReactNode;
}) {
    return (
        <LandingShell>
            <div className="min-h-screen bg-paper font-sans text-ink">
                <LandingNavbar />
                <main className="mx-auto max-w-3xl px-6 py-14">
                    <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink">{title}</h1>
                    {updated && <p className="mt-2 text-xs text-ink-soft">Last updated: {updated}</p>}
                    {intro && <p className="mt-5 text-base leading-relaxed text-ink-soft">{intro}</p>}
                    <div className="mt-10 space-y-8">{children}</div>
                </main>
                <LandingFooter />
            </div>
        </LandingShell>
    );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h2 className="font-heading text-lg font-semibold text-ink">{title}</h2>
            <div className="mt-2 space-y-3 text-sm leading-relaxed text-ink-soft">{children}</div>
        </section>
    );
}