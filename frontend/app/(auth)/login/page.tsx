import { redirect } from "next/navigation";
import { safeNext } from "@/lib/safeNext";

// The login form now lives in a popup on the landing page.
// This route stays only so old links and redirects keep working.
export default async function LoginRedirect({
    searchParams,
}: {
    searchParams: Promise<{ next?: string }>;
}) {
    const next = safeNext((await searchParams).next);
    redirect(next ? `/?login=1&next=${encodeURIComponent(next)}` : "/?login=1");
}