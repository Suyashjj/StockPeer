export default function PageTitle({
    title,
    subtitle,
}: {
    title: string;
    subtitle?: string;
}) {
    return (
        <div>
            <div className="mb-3 h-1 w-10 rounded-full bg-brand" />
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                {title}
            </h1>
            {subtitle && <p className="mt-2 max-w-xl text-[15px] text-ink-soft">{subtitle}</p>}
        </div>
    );
}