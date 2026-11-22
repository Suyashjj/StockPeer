import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { displayName } from "../../lib/displayName";
import { chatFileUrl } from "../../lib/cloudinary";

const PAGE = 50;
const FILE_PAGE = 30;

const messageSelect = {
    id: true,
    body: true,
    createdAt: true,
    fileId: true,
    fileName: true,
    fileType: true,
    fileSize: true,
    sender: { select: { id: true, name: true, role: true } },
} as const;

type MessageRow = Prisma.MessageGetPayload<{ select: typeof messageSelect }>;

function shape(r: MessageRow) {
    const isImage = !!r.fileType?.startsWith("image/");
    return {
        id: r.id,
        body: r.body,
        createdAt: r.createdAt.toISOString(),
        sender: { id: r.sender.id, name: displayName(r.sender.name), isExpert: r.sender.role === "EXPERT" },
        file:
            r.fileId && r.fileName && r.fileType
                ? {
                    name: r.fileName,
                    type: r.fileType,
                    size: r.fileSize ?? 0,
                    isImage,
                    url: chatFileUrl(r.fileId, isImage),
                    downloadUrl: chatFileUrl(r.fileId, isImage, true),
                }
                : null,
    };
}

export type Channel = "community" | "premium";

export function parseChannel(v: unknown): Channel {
    return v === "premium" ? "premium" : "community";
}

// Community: the user must be a member
export async function getMembershipGroupId(userId: string, symbol: string) {
    const m = await prisma.membership.findFirst({
        where: {
            userId,
            group: { type: "COMMUNITY", stock: { symbol: symbol.toUpperCase() } },
        },
        select: { groupId: true },
    });
    return m?.groupId ?? null;
}

// Premium: an active subscriber who unlocked it, or an approved expert assigned to it
export async function getPremiumGroupId(userId: string, symbol: string) {
    const groupWhere = { type: "PREMIUM" as const, stock: { symbol: symbol.toUpperCase() } };
    const [access, assigned] = await Promise.all([
        prisma.premiumAccess.findFirst({
            where: {
                group: groupWhere,
                subscription: { userId, status: "ACTIVE", endsAt: { gt: new Date() } },
            },
            select: { groupId: true },
        }),
        prisma.expertAssignment.findFirst({
            where: {
                expertId: userId,
                group: groupWhere,
                expert: { verificationStatus: "APPROVED", accountStatus: "ACTIVE" },
            },
            select: { groupId: true },
        }),
    ]);
    return access?.groupId ?? assigned?.groupId ?? null;
}

// The one place that decides who may read or write a channel
export function getChannelGroupId(userId: string, symbol: string, channel: Channel) {
    return channel === "premium"
        ? getPremiumGroupId(userId, symbol)
        : getMembershipGroupId(userId, symbol);
}

type FileInfo = { fileId: string; fileName: string; fileType: string; fileSize: number };

export async function saveMessage(
    groupId: string,
    sender: { id: string },
    body: string,
    file?: FileInfo
) {
    const m = await prisma.message.create({
        data: { groupId, senderId: sender.id, body, ...(file ?? {}) },
        select: messageSelect,
    });
    return shape(m);
}

export async function history(groupId: string, before?: Date) {
    const rows = await prisma.message.findMany({
        where: {
            groupId,
            deletedAt: null,
            ...(before ? { createdAt: { lt: before } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: PAGE,
        select: messageSelect,
    });

    return { hasMore: rows.length === PAGE, messages: rows.reverse().map(shape) };
}

// Media = photos, docs = everything else. Newest first.
export async function filesList(groupId: string, type: "media" | "docs", before?: Date) {
    const isImg = { fileType: { startsWith: "image/" } };
    const rows = await prisma.message.findMany({
        where: {
            groupId,
            deletedAt: null,
            fileId: { not: null },
            ...(type === "media" ? isImg : { NOT: isImg }),
            ...(before ? { createdAt: { lt: before } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: FILE_PAGE,
        select: messageSelect,
    });

    return { hasMore: rows.length === FILE_PAGE, items: rows.map(shape) };
}

export function markRead(userId: string, symbol: string) {
    return prisma.membership.updateMany({
        where: {
            userId,
            group: { type: "COMMUNITY", stock: { symbol: symbol.toUpperCase() } },
        },
        data: { lastReadAt: new Date() },
    });
}