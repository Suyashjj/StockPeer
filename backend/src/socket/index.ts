import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { getChannelGroupId, saveMessage, type Channel } from "../modules/chat/chat.service";

let io: Server | null = null;

const roomName = (symbol: string, channel: Channel = "community") =>
    `stock:${symbol.toUpperCase()}:${channel}`;

const channelSchema = z.enum(["community", "premium"]).default("community");
const joinSchema = z.object({
    symbol: z.string().trim().min(1).max(30),
    channel: channelSchema,
});
const sendSchema = z.object({
    symbol: z.string().trim().min(1).max(30),
    channel: channelSchema,
    body: z.string().trim().min(1).max(1000),
});

type Ack = (res: { ok: boolean; message?: string }) => void;

function readToken(header?: string) {
    if (!header) return null;
    for (const part of header.split(";")) {
        const [k, ...v] = part.trim().split("=");
        if (k === "token") return decodeURIComponent(v.join("="));
    }
    return null;
}

// Puts the socket in the room of every community group the user belongs to
async function joinMemberRooms(socket: Socket, userId: string) {
    const rows = await prisma.membership.findMany({
        where: { userId, group: { type: "COMMUNITY" } },
        select: { group: { select: { stock: { select: { symbol: true } } } } },
    });
    for (const r of rows) await socket.join(roomName(r.group.stock.symbol, "community"));
}

export function initSocket(server: HttpServer) {
    io = new Server(server, {
        cors: { origin: env.FRONTEND_URL, credentials: true },
    });

    io.use(async (socket, next) => {
        try {
            const token = readToken(socket.handshake.headers.cookie);
            if (!token) return next(new Error("Not authenticated"));

            const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
            const user = await prisma.user.findUnique({
                where: { id: payload.sub },
                select: { id: true, name: true, role: true, accountStatus: true },
            });
            if (
                !user ||
                user.accountStatus !== "ACTIVE" ||
                (user.role !== "USER" && user.role !== "EXPERT")
            ) {
                return next(new Error("Not allowed"));
            }

            socket.data.user = { id: user.id, name: user.name };
            next();
        } catch {
            next(new Error("Invalid session"));
        }
    });

    io.on("connection", (socket) => {
        const user = socket.data.user as { id: string; name: string };
        socket.join(`user:${user.id}`);
        joinMemberRooms(socket, user.id).catch(() => { });

        const stamps: number[] = [];

        socket.on("rooms:refresh", () => {
            joinMemberRooms(socket, user.id).catch(() => { });
        });

        socket.on("group:join", async (raw: unknown, ack?: Ack) => {
            const reply: Ack = typeof ack === "function" ? ack : () => { };
            try {
                const parsed = joinSchema.safeParse(raw);
                if (!parsed.success) return reply({ ok: false, message: "Invalid request" });
                const { symbol, channel } = parsed.data;

                const groupId = await getChannelGroupId(user.id, symbol, channel);
                if (!groupId) {
                    return reply({
                        ok: false,
                        message:
                            channel === "premium"
                                ? "Unlock this premium group to chat"
                                : "Join the group to chat",
                    });
                }

                await socket.join(roomName(symbol, channel));
                reply({ ok: true });
            } catch {
                reply({ ok: false, message: "Something went wrong" });
            }
        });

        socket.on("message:send", async (raw: unknown, ack?: Ack) => {
            const reply: Ack = typeof ack === "function" ? ack : () => { };
            try {
                const parsed = sendSchema.safeParse(raw);
                if (!parsed.success) {
                    return reply({ ok: false, message: "Write a message up to 1000 characters" });
                }

                const now = Date.now();
                while (stamps.length && now - stamps[0] > 5000) stamps.shift();
                if (stamps.length >= 5) return reply({ ok: false, message: "Slow down a little" });
                stamps.push(now);

                const { symbol, channel, body } = parsed.data;
                // Checked on every message, so an expired plan stops working at once
                const groupId = await getChannelGroupId(user.id, symbol, channel);
                if (!groupId) return reply({ ok: false, message: "You don't have access to this group" });

                await socket.join(roomName(symbol, channel));
                const message = await saveMessage(groupId, user, body);
                io!.to(roomName(symbol, channel)).emit("message:new", {
                    ...message,
                    symbol: symbol.toUpperCase(),
                    channel,
                });
                reply({ ok: true });
            } catch {
                reply({ ok: false, message: "Could not send your message" });
            }
        });
    });
}

// Called when someone leaves a community group
export function removeFromGroupRoom(userId: string, symbol: string) {
    io?.in(`user:${userId}`).socketsLeave(roomName(symbol, "community"));
}

// Used by the upload endpoint, so files appear live for everyone in the group
export function broadcastMessage(symbol: string, message: unknown, channel: Channel = "community") {
    io?.to(roomName(symbol, channel)).emit("message:new", {
        ...(message as object),
        symbol: symbol.toUpperCase(),
        channel,
    });
}