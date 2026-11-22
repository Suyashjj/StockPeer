function cap(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function displayName(full: string) {
    const parts = full.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "Member";
    if (parts.length === 1) return cap(parts[0]);
    return `${cap(parts[0])} ${parts[parts.length - 1][0].toUpperCase()}.`;
}