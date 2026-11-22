export const STATUS_BADGE: Record<string, string> = {
    REQUESTED: "bg-brand/10 text-brand",
    SCHEDULED: "bg-up/10 text-up",
    COMPLETED: "bg-line text-ink-soft",
    CANCELLED: "bg-down/10 text-down",
};

export const STATUS_LABEL: Record<string, string> = {
    REQUESTED: "Requested",
    SCHEDULED: "Scheduled",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
};

export function when(iso?: string | null) {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// For <input type="datetime-local">
export function toLocalInput(iso?: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}