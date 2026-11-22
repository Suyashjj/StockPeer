"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { HOME_BY_ROLE } from "@/lib/constants";

/**
 * Laptop (1024px+): text on the left, video card on the right.
 * Mobile: a full-width video banner with a short line and buttons inside it.
 * Only one video is ever mounted, so only one is downloaded. Expects /public/hero.mp4
 */
export default function Hero() {
    const { user, loading } = useAuth();
    const vid = useRef<HTMLVideoElement>(null);
    const [desktop, setDesktop] = useState<boolean | null>(null);
    const [reduce, setReduce] = useState(false);
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        const big = window.matchMedia("(min-width: 1024px)");
        const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => {
            setDesktop(big.matches);
            setReduce(rm.matches);
            setPlaying(false);
        };
        update();
        big.addEventListener("change", update);
        rm.addEventListener("change", update);
        return () => {
            big.removeEventListener("change", update);
            rm.removeEventListener("change", update);
        };
    }, []);

    // Force muted autoplay, and pause while scrolled out of view
    useEffect(() => {
        const v = vid.current;
        if (!v) return;
        v.muted = true;
        v.play().catch(() => { });
        const io = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) v.play().catch(() => { });
            else v.pause();
        });
        io.observe(v);
        return () => io.disconnect();
    }, [desktop, reduce]);

    const video = (
        <video
            ref={vid}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            disablePictureInPicture
            aria-hidden
            onPlaying={() => setPlaying(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${playing ? "opacity-100" : "opacity-0"
                }`}
        >
            <source src="/hero.mp4" type="video/mp4" />
        </video>
    );

    const copy = (dark: boolean) => (
        <div className="ai-line max-w-md">
            {/* Headline is hidden on phones (the banner shows only the short line) */}
            <h1
                className={`hidden font-heading text-4xl leading-tight font-semibold tracking-tight lg:block ${dark ? "text-white" : "text-ink"
                    }`}
            >
                Discuss stocks with people who follow them.
            </h1>
            <p
                className={`text-base font-medium lg:mt-3 lg:font-normal ${dark ? "text-white" : "text-ink-soft"
                    }`}
            >
                Join groups and learn from verified experts.
            </p>

            <div
                className={`mt-4 flex flex-wrap items-center gap-4 transition-opacity duration-300 lg:mt-6 lg:gap-5 ${loading ? "opacity-0" : "opacity-100"
                    }`}
            >
                <Link
                    href={user ? HOME_BY_ROLE[user.role] : "/signup"}
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition hover:opacity-90 lg:px-6 lg:py-3 ${dark ? "bg-white text-ink" : "bg-brand text-white"
                        }`}
                >
                    {user ? "Go to dashboard" : "Get started"} <ArrowRight size={16} />
                </Link>
                <a
                    href="#groups"
                    className={`text-sm font-medium transition ${dark ? "text-white/80 hover:text-white" : "text-ink-soft hover:text-ink"
                        }`}
                >
                    Explore groups
                </a>
            </div>
        </div>
    );

    const showVideo = desktop !== null && !reduce;

    return (
        <section className="relative overflow-hidden">
            {/* Soft blue glows (laptop) */}
            <div
                aria-hidden
                className="pointer-events-none absolute -top-32 right-[-8%] hidden h-[28rem] w-[28rem] rounded-full bg-brand/15 blur-3xl lg:block"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute bottom-[-10rem] left-[-6%] hidden h-[24rem] w-[24rem] rounded-full bg-brand/[0.07] blur-3xl lg:block"
            />

            <div className="relative mx-auto max-w-6xl pb-6 lg:grid lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-12 lg:px-6 lg:py-24">
                {/* Mobile: full-width video banner with a short line and buttons inside */}
                <div className="relative flex h-[340px] flex-col justify-end overflow-hidden rounded-b-3xl bg-gradient-to-br from-ink to-[#14224a] sm:h-[400px] lg:hidden">
                    {showVideo && desktop === false && video}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent" />
                    <div className="relative px-5 pb-5">{copy(true)}</div>
                </div>

                {/* Laptop: text */}
                <div className="hidden lg:block">{copy(false)}</div>

                {/* Laptop: video card */}
                <div className="ai-line relative hidden aspect-video overflow-hidden rounded-3xl border border-line bg-white shadow-[0_30px_70px_-30px_rgba(47,95,208,0.35)] lg:block">
                    {showVideo && desktop === true && video}
                </div>
            </div>
        </section>
    );
}