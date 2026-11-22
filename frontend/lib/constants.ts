export type Role = "USER" | "EXPERT" | "ADMIN";

export const HOME_BY_ROLE: Record<Role, string> = {
    USER: "/user",
    EXPERT: "/expert",
    ADMIN: "/admin-panel",
};