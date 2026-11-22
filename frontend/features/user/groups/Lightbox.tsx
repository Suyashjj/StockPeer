"use client";

import { useEffect } from "react";
import { Download, X } from "lucide-react";
import type { ChatFile } from "./useChat";

export default function Lightbox({ file, onClose }: { file: ChatFile; onClose: () => void }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col bg-black/90"
            onClick={onClose}
        >
            <div className="flex items-center justify-between px-4 py-3 text-white">
                <p className="truncate text-sm">{file.name}</p>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <a
                        href={file.downloadUrl}
                        aria-label="Download"
                        className="rounded-full p-2 transition hover:bg-white/10"
                    >
                        <Download size={20} />
                    </a>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-full p-2 transition hover:bg-white/10"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={file.url}
                    alt={file.name}
                    onClick={(e) => e.stopPropagation()}
                    className="max-h-full max-w-full object-contain"
                />
            </div>
        </div>
    );
}