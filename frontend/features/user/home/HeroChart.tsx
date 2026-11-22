"use client";

import { useEffect, useState } from "react";

// Purely decorative. This is not real market data.
const LINE =
    "M0,128 C28,124 48,96 80,102 S132,132 164,104 S214,54 246,64 S296,96 326,60 S372,22 400,30";
const AREA = `${LINE} L400,160 L0,160 Z`;

export default function HeroChart() {
    const [drawn, setDrawn] = useState(false);

    useEffect(() => {
        const id = requestAnimationFrame(() => setDrawn(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const draw = {
        strokeDasharray: 1,
        strokeDashoffset: drawn ? 0 : 1,
        transition: "stroke-dashoffset 2.2s cubic-bezier(0.22, 1, 0.36, 1)",
    } as const;

    return (
        <svg
            viewBox="0 0 400 160"
            preserveAspectRatio="xMaxYMid slice"
            className="h-full w-full motion-reduce:[&_*]:!transition-none"
            aria-hidden
        >
            <defs>
                <linearGradient id="hc-line" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0" stopColor="#60a5fa" stopOpacity="0.25" />
                    <stop offset="1" stopColor="#bfdbfe" />
                </linearGradient>
                <linearGradient id="hc-area" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#60a5fa" stopOpacity="0.28" />
                    <stop offset="1" stopColor="#60a5fa" stopOpacity="0" />
                </linearGradient>
            </defs>

            {[40, 80, 120].map((y) => (
                <line
                    key={y}
                    x1="0"
                    x2="400"
                    y1={y}
                    y2={y}
                    stroke="white"
                    strokeOpacity="0.07"
                    strokeWidth="0.6"
                    strokeDasharray="3 5"
                />
            ))}

            <path
                d={AREA}
                fill="url(#hc-area)"
                style={{ opacity: drawn ? 1 : 0, transition: "opacity 1.4s ease 0.9s" }}
            />

            {/* soft glow under the line */}
            <path
                d={LINE}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="7"
                strokeOpacity="0.35"
                strokeLinecap="round"
                pathLength={1}
                style={{ ...draw, filter: "blur(5px)" }}
            />
            <path
                d={LINE}
                fill="none"
                stroke="url(#hc-line)"
                strokeWidth="2.5"
                strokeLinecap="round"
                pathLength={1}
                style={draw}
            />
        </svg>
    );
}