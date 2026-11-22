"use client";

type Props = {
    label: string;
    hint?: string;
    file: File | null;
    onChange: (file: File | null) => void;
    error?: string;
    accept?: string;
    maxSizeMB?: number;
    emptyText?: string;
};

export default function FileUploadField({
    label,
    hint,
    file,
    onChange,
    error,
    accept = ".pdf,.jpg,.jpeg,.png",
    maxSizeMB = 5,
    emptyText = "Choose file (PDF, JPG, PNG)",
}: Props) {
    function handle(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] ?? null;
        if (f && f.size > maxSizeMB * 1024 * 1024) {
            alert(`File must be under ${maxSizeMB} MB`);
            e.target.value = "";
            return;
        }
        onChange(f);
    }

    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
            {hint && <p className="mb-2 text-xs text-ink-soft">{hint}</p>}
            <label
                className={`flex w-full cursor-pointer items-center justify-between rounded-lg border border-dashed bg-white px-4 py-3 text-sm transition hover:border-brand ${error ? "border-down" : "border-line"
                    }`}
            >
                <span className={`truncate pr-3 ${file ? "text-ink" : "text-ink-soft"}`}>
                    {file ? file.name : emptyText}
                </span>
                <span className="shrink-0 font-medium text-brand">
                    {file ? "Change" : "Browse"}
                </span>
                <input type="file" accept={accept} onChange={handle} className="hidden" />
            </label>
            {error && <p className="mt-1 text-xs text-down">{error}</p>}
        </div>
    );
}