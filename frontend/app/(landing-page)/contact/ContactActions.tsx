"use client";

import { useState } from "react";
import { Check, Copy, Mail } from "lucide-react";

const EMAIL = "suyashjai2010@gmail.com";

export default function ContactActions() {
    const [copied, setCopied] = useState(false);

    async function copy() {
        try {
            await navigator.clipboard.writeText(EMAIL);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* clipboard blocked: the mail button still works */
        }
    }

    return (
        <div className="flex flex-wrap gap-3">
            <a
                href={`mailto:${EMAIL}?subject=${encodeURIComponent("StockPeer enquiry")}`}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
                <Mail size={16} /> Send us an email
            </a>
            <button
                onClick={copy}
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-brand/40 hover:text-brand"
            >
                {copied ? <Check size={16} className="text-up" /> : <Copy size={16} />}
                {copied ? "Address copied" : "Copy email address"}
            </button>
        </div>
    );
}