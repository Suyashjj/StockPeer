import { BadgeCheck, CreditCard, Crown, LayoutDashboard, CalendarClock, LifeBuoy, type LucideIcon } from "lucide-react";

export type NavItem = { label: string; href: string; icon: LucideIcon };

export const adminNav: NavItem[] = [
    { label: "Overview", href: "/admin-panel", icon: LayoutDashboard },
    { label: "PAN reviews", href: "/admin-panel/pan", icon: CreditCard },
    { label: "Expert applications", href: "/admin-panel/experts", icon: BadgeCheck },
    { label: "Premium groups", href: "/admin-panel/premium", icon: Crown },
    { label: "Sessions", href: "/admin-panel/sessions", icon: CalendarClock },
    { label: "Support", href: "/admin-panel/support", icon: LifeBuoy },
];