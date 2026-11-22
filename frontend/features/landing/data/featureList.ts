import { BookOpen, BadgeCheck, MessagesSquare, Users, type LucideIcon } from "lucide-react";

export type Feature = {
    title: string;
    description: string;
    icon: LucideIcon;
    tile: string; // classes for the icon tile (background + icon color)
};

export const features: Feature[] = [
    {
        title: "Stock communities",
        description:
            "A dedicated group for every company, so conversations stay focused and relevant.",
        icon: Users,
        tile: "bg-up/10 text-up",
    },
    {
        title: "Live discussions",
        description:
            "Real-time threads that move with the market, not stale posts from last week.",
        icon: MessagesSquare,
        tile: "bg-brand/10 text-brand",
    },
    {
        title: "Expert insights",
        description:
            "Verified experts share sector views and explain the why behind the moves.",
        icon: BadgeCheck,
        tile: "bg-down/10 text-down",
    },
    {
        title: "Learn hub",
        description:
            "Beginner-friendly guides and explainers, so you understand what you're reading.",
        icon: BookOpen,
        tile: "bg-ink/10 text-ink",
    },
];