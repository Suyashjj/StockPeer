import { CalendarClock, Compass, LayoutDashboard, MessagesSquare, User, LifeBuoy, type LucideIcon } from "lucide-react";

export type NavItem = {
    label: string;
    href: string;
    icon: LucideIcon;
    ready: boolean;
};

export const expertNav: NavItem[] = [
    { label: "Home", href: "/expert", icon: LayoutDashboard, ready: true },
    { label: "Opportunities", href: "/expert/opportunities", icon: Compass, ready: true },
    { label: "My groups", href: "/expert/groups", icon: MessagesSquare, ready: true },
    { label: "Sessions", href: "/expert/sessions", icon: CalendarClock, ready: true },
    { label: "Profile", href: "/expert/profile", icon: User, ready: true },
    { label: "Help & support", href: "/expert/support", icon: LifeBuoy, ready: true },
];