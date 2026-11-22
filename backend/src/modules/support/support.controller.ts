import { Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { uploadFile } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import { AuthedRequest } from "../../middleware/auth";
import { DOC_FIELDS, displayNew, prepareChange } from "./support.service";

const FIELDS = ["NAME", "EMAIL", "PHONE", "CREDENTIAL", "PAN", "ID_DOCUMENT", "PROOF_DOCUMENT"] as const;

const createSchema = z.object({
    kind: z.enum(["CHANGE", "GENERAL"]),
    subject: z.string().trim().max(120).optional(),
    message: z.string().trim().max(1000),
    field: z.enum(FIELDS).optional(),
    newValue: z.string().trim().max(600).optional(),
});

export const list = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const rows = await prisma.supportTicket.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
            id: true,
            kind: true,
            subject: true,
            message: true,
            field: true,
            oldValue: true,
            newValue: true,
            status: true,
            adminReply: true,
            createdAt: true,
        },
    });
    res.json({
        items: rows.map(({ newValue, ...r }) => ({
            ...r,
            newDisplay: displayNew(r.field, newValue, false),
        })),
    });
});

export const create = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid request" });
    const { kind, field, newValue } = parsed.data;
    const userId = req.user!.id;

    if (kind === "GENERAL") {
        const subject = parsed.data.subject ?? "";
        if (subject.length < 3) return res.status(400).json({ message: "Add a short subject" });
        if (parsed.data.message.length < 10) {
            return res.status(400).json({ message: "Tell us a bit more (at least 10 characters)" });
        }
        const open = await prisma.supportTicket.count({
            where: { userId, kind: "GENERAL", status: "OPEN" },
        });
        if (open >= 5) {
            return res.status(409).json({ message: "You already have 5 open help requests" });
        }
        await prisma.supportTicket.create({
            data: { userId, kind, subject, message: parsed.data.message },
        });
        return res.status(201).json({ ok: true });
    }

    // Change request: experts only
    if (req.user!.role !== "EXPERT") {
        return res.status(403).json({ message: "Change requests are for experts" });
    }
    if (!field) return res.status(400).json({ message: "Choose what you want to change" });
    if (parsed.data.message.length < 20) {
        return res.status(400).json({ message: "Please explain the reason (at least 20 characters)" });
    }

    const needsDoc = DOC_FIELDS.includes(field);
    const file = req.file;
    if (needsDoc && !file) {
        return res.status(400).json({ message: "Upload the new document" });
    }

    const open = await prisma.supportTicket.findFirst({
        where: { userId, kind: "CHANGE", field, status: "OPEN" },
        select: { id: true },
    });
    if (open) return res.status(409).json({ message: "You already have an open request for this" });

    const prep = await prepareChange(userId, field, newValue);
    if ("error" in prep) return res.status(400).json({ message: prep.error });

    let documentId: string | null = null;
    if (file) {
        const up = await uploadFile(file, { folder: "support", isPrivate: true });
        documentId = up.publicId;
    }

    await prisma.supportTicket.create({
        data: {
            userId,
            kind,
            field,
            subject: `Change request: ${field}`,
            message: parsed.data.message,
            oldValue: prep.oldValue,
            newValue: prep.newValue,
            documentId,
        },
    });
    res.status(201).json({ ok: true });
});