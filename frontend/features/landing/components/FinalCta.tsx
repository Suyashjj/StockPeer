import Link from "next/link";

export default function FinalCta() {
    return (
        <section className="mx-auto max-w-6xl px-6 pb-24">
            <div className="rounded-3xl bg-ink px-6 py-14 text-center sm:px-12">
                <h2 className="text-3xl font-bold tracking-tight text-paper md:text-4xl">
                    Join the conversation
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-paper/70">
                    Find your stocks, meet people who follow them, and make better decisions
                    together.
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-4">
                    <Link
                        href="/signup"
                        className="rounded-lg bg-brand px-6 py-3 font-medium text-white transition hover:opacity-90"
                    >
                        Sign up
                    </Link>
                    <Link
                        href="/login"
                        className="rounded-lg border border-paper/30 px-6 py-3 font-medium text-paper transition hover:bg-paper/10"
                    >
                        Log in
                    </Link>
                </div>
            </div>
        </section>
    );
}