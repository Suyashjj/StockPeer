import { NextFunction, Response } from "express";
import multer from "multer";
import { asyncHandler } from "../../lib/asyncHandler";
import { uploadChatFile } from "../../lib/cloudinary";
import { cleanFileName, detectFile } from "../../lib/fileSniff";
import { AuthedRequest } from "../../middleware/auth";
import { chatUpload } from "../../middleware/chatUpload";
import { broadcastMessage } from "../../socket";
import * as chatService from "./chat.service";

function parseBefore(value: unknown): Date | undefined | "invalid" {
    if (typeof value !== "string") return undefined;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "invalid" : d;
}

export const history = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const channel = chatService.parseChannel(req.query.channel);
    const groupId = await chatService.getChannelGroupId(
        req.user!.id,
        req.params.symbol as string,
        channel
    );
    if (!groupId) {
        return res.status(403).json({
            message:
                channel === "premium"
                    ? "Unlock this premium group to see the messages"
                    : "Join this group to see the messages",
        });
    }

    const before = parseBefore(req.query.before);
    if (before === "invalid") return res.status(400).json({ message: "Invalid cursor" });

    return res.json(await chatService.history(groupId, before));
});

export const markRead = asyncHandler(async (req: AuthedRequest, res: Response) => {
    // Unread counts exist for community chats only for now
    if (chatService.parseChannel(req.query.channel) === "community") {
        await chatService.markRead(req.user!.id, req.params.symbol as string);
    }
    return res.json({ ok: true });
});

export const files = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const channel = chatService.parseChannel(req.query.channel);
    const groupId = await chatService.getChannelGroupId(
        req.user!.id,
        req.params.symbol as string,
        channel
    );
    if (!groupId) return res.status(403).json({ message: "You don't have access to these files" });

    const before = parseBefore(req.query.before);
    if (before === "invalid") return res.status(400).json({ message: "Invalid cursor" });

    const type = req.query.type === "docs" ? "docs" : "media";
    return res.json(await chatService.filesList(groupId, type, before));
});

/* ---------- attachments ---------- */

// At most 10 uploads per minute per user
const uploadStamps = new Map<string, number[]>();
function allowUpload(userId: string) {
    const now = Date.now();
    const recent = (uploadStamps.get(userId) ?? []).filter((t) => now - t < 60_000);
    if (recent.length >= 10) {
        uploadStamps.set(userId, recent);
        return false;
    }
    recent.push(now);
    uploadStamps.set(userId, recent);
    return true;
}

async function handleUpload(req: AuthedRequest, res: Response) {
    const symbol = (req.params.symbol as string).toUpperCase();
    const channel = chatService.parseChannel(req.query.channel);

    const groupId = await chatService.getChannelGroupId(req.user!.id, symbol, channel);
    if (!groupId) return res.status(403).json({ message: "You don't have access to this group" });

    if (!allowUpload(req.user!.id)) {
        return res.status(429).json({ message: "Too many uploads. Please wait a minute." });
    }

    const file = req.file;
    if (!file || file.size === 0) return res.status(400).json({ message: "Choose a file to send" });

    const detected = detectFile(file.buffer, file.originalname);
    if (!detected) {
        return res.status(400).json({
            message: "This file type isn't allowed. Use images, PDF, Word, Excel or text files.",
        });
    }

    const caption = typeof req.body?.caption === "string" ? req.body.caption.trim().slice(0, 1000) : "";
    const isImage = detected.mime.startsWith("image/");

    const up = await uploadChatFile(file.buffer, { isImage, ext: detected.ext });
    const message = await chatService.saveMessage(groupId, { id: req.user!.id }, caption, {
        fileId: up.publicId,
        fileName: cleanFileName(file.originalname),
        fileType: detected.mime,
        fileSize: file.size,
    });

    broadcastMessage(symbol, message, channel);
    return res.status(201).json({ message });
}

export function uploadAttachment(req: AuthedRequest, res: Response, next: NextFunction) {
    chatUpload.single("file")(req, res, (err?: unknown) => {
        if (err) {
            const tooBig = err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE";
            return res.status(400).json({
                message: tooBig
                    ? "File must be under 10 MB"
                    : err instanceof Error
                        ? err.message
                        : "Upload failed",
            });
        }
        handleUpload(req, res).catch(next);
    });
}