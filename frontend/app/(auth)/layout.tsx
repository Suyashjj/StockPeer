import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-paper px-6 py-10 font-sans text-ink">
            <Link href="/" className="mb-8 text-2xl font-bold tracking-tight text-ink">
                Stock<span className="text-brand">Peer</span>
            </Link>
            <div className="flex w-full flex-1 items-start justify-center">{children}</div>
        </div>
    );
}