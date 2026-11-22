import { MessageSquare } from "lucide-react";

export default function ChatsEmptyPage() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center bg-[#efeee7] px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand shadow-sm">
                <MessageSquare size={28} />
            </div>
            <p className="mt-4 font-heading text-lg font-bold text-ink">Select a chat</p>
            <p className="mt-1 text-sm text-ink-soft">
                Pick a group from the list to read and join the discussion.
            </p>
        </div>
    );
}