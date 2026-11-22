type Props = { steps: string[]; current: number };

export default function StepIndicator({ steps, current }: Props) {
    return (
        <div className="mb-8 flex items-center">
            {steps.map((label, i) => {
                const done = i < current;
                const active = i === current;
                return (
                    <div key={label} className="flex flex-1 items-center last:flex-none">
                        <div className="flex flex-col items-center">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${done
                                        ? "border-up bg-up text-white"
                                        : active
                                            ? "border-brand bg-brand text-white"
                                            : "border-line bg-white text-ink-soft"
                                    }`}
                            >
                                {done ? "✓" : i + 1}
                            </div>
                            <span
                                className={`mt-1 text-xs ${active ? "font-medium text-ink" : "text-ink-soft"
                                    }`}
                            >
                                {label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div
                                className={`mx-2 mb-5 h-px flex-1 ${done ? "bg-up" : "bg-line"}`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}