import { features } from "../data/featureList";

export default function Features() {
    return (
        <section className="mx-auto max-w-6xl px-6 pb-24">
            <div className="mb-10 max-w-2xl">
                <span className="text-sm font-semibold tracking-wide text-brand uppercase">
                    Features
                </span>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">
                    Everything you need to trade smarter, together
                </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
                {features.map((f) => {
                    const Icon = f.icon;
                    return (
                        <div
                            key={f.title}
                            className="flex gap-5 rounded-2xl border border-line bg-surface p-6 transition duration-200 hover:shadow-[0_8px_30px_rgba(31,41,55,0.08)]"
                        >
                            <div
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${f.tile}`}
                            >
                                <Icon size={22} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-ink">{f.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                                    {f.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}