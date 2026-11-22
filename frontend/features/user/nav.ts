import {
    CalendarClock,
    Compass,
    Crown,
    LayoutDashboard,
    MessageSquare,
    User,
    type LucideIcon,
} from "lucide-react";

export type NavItem = {
    label: string;
    href: string;
    icon: LucideIcon;
    ready: boolean;
};

export const userNav: NavItem[] = [
    { label: "Home", href: "/user", icon: LayoutDashboard, ready: true },
    { label: "Chats", href: "/user/chats", icon: MessageSquare, ready: true },
    { label: "Discover", href: "/user/discover", icon: Compass, ready: true },
    { label: "Plans", href: "/user/premium", icon: Crown, ready: true },
    { label: "Sessions", href: "/user/sessions", icon: CalendarClock, ready: true },
    { label: "Profile", href: "/user/profile", icon: User, ready: true },
];