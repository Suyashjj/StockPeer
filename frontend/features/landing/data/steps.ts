import { GraduationCap, MessagesSquare, Users, type LucideIcon } from "lucide-react";

export type Step = {
    number: number;
    title: string;
    description: string;
    icon: LucideIcon;
};

export const steps: Step[] = [
    {
        number: 1,
        title: "Join a stock group",
        description:
            "Pick the companies you follow, like RELIANCE or TCS, and join their community.",
        icon: Users,
    },
    {
        number: 2,
        title: "Follow live discussions",
        description: "See what other investors are saying, ask questions and share your view.",
        icon: MessagesSquare,
    },
    {
        number: 3,
        title: "Learn from experts",
        description: "Get insights from verified experts and grow your understanding.",
        icon: GraduationCap,
    },
];