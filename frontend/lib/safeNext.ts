// Only allow in-app paths like "/user/chats/TCS". Blocks "//evil.com" and "https://..." redirects.
export function safeNext(next: string | null | undefined): string | null {
    if (!next) return null;
    if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return null;
    return next;
}