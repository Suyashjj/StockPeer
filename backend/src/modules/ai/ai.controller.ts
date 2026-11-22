import { Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { logEvent } from "../../lib/events";
import { AuthedRequest } from "../../middleware/auth";
import { getChannelGroupId, getMembershipGroupId } from "../chat/chat.service";
import * as ai from "./ai.service";

// Safety caps (not plan limits): adjust here
const PER_DAY = 30;
const PER_MINUTE = 6;

const usage = new Map<string, { day: string; count: number; stamps: number[] }>();

function allow(userId: string) {
    const day = new Date().toISOString().slice(0, 10);
    const now = Date.now();
    let u = usage.get(userId);
    if (!u || u.day !== day) u = { day, count: 0, stamps: [] };
    u.stamps = u.stamps.filter((t) => now - t < 60_000);

    if (u.count >= PER_DAY) return "You've reached today's limit of 30 questions. Try again tomorrow.";
    if (u.stamps.length >= PER_MINUTE) return "Slow down a little and try again in a minute.";

    u.count += 1;
    u.stamps.push(now);
    usage.set(userId, u);
    return null;
}

async function hasAccess(userId: string, symbol: string) {
    return (
        (await getMembershipGroupId(userId, symbol)) ?? (await getChannelGroupId(userId, symbol, "premium"))
    );
}

const askSchema = z.object({
    question: z.string().trim().min(2, "Ask a short question").max(300, "Keep the question under 300 characters"),
    history: z
        .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(1500) }))
        .max(8)
        .default([]),
});

export const summary = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const symbol = req.params.symbol as string;
    if (!(await hasAccess(req.user!.id, symbol))) {
        return res.status(403).json({ message: "Join this group to use the AI summary" });
    }
    try {
        const r = await ai.summarize(symbol);
        if (!r) return res.status(404).json({ message: "Stock not found" });
        return res.json(r);
    } catch (e) {
        console.error("AI error:", e);
        return res.status(502).json({ message: "The AI summary is unavailable right now. Try again later." });
    }
});

export const ask = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const symbol = req.params.symbol as string;
    if (!(await hasAccess(req.user!.id, symbol))) {
        return res.status(403).json({ message: "Join this group to ask questions" });
    }

    const parsed = askSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid question" });
    }

    const limit = allow(req.user!.id);
    if (limit) return res.status(429).json({ message: limit });

    try {
        const r = await ai.ask(symbol, parsed.data.question, parsed.data.history);
        if (!r) return res.status(404).json({ message: "Stock not found" });
        logEvent(req.user!.id, symbol, "ASK_AI");
        return res.json(r);
    } catch (e) {
        console.error("AI error:", e);
        return res.status(502).json({ message: "The AI is unavailable right now. Try again later." });
    }
});