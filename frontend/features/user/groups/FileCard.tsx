import { Download, FileText } from "lucide-react";
import type { ChatFile } from "./useChat";

export const MAX_BYTES = 10 * 1024 * 1024;
export const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "pdf", "doc", "docx", "xls", "xlsx", "txt"];

export function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// PDFs open in a new tab, other documents download
export default function FileCard({ file }: { file: ChatFile }) {
    const isPdf = file.type === "application/pdf";
    const ext = file.name.split(".").pop()?.toUpperCase() ?? "FILE";

    return (
        <a
            href={isPdf ? file.url : file.downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg border border-line bg-white/70 p-2.5 transition hover:bg-white"
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <FileText size={20} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{file.name}</p>
                <p className="text-xs text-ink-soft">
                    {ext} · {formatSize(file.size)}
                </p>
            </div>
            <Download size={16} className="shrink-0 text-ink-soft" />
        </a>
    );
}