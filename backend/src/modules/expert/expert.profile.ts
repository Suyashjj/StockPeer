import { Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { uploadFile } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import { AuthedRequest } from "../../middleware/auth";

const select = {
    expertType: true,
    credentialNumber: true,
    profileLink: true,
    experienceYears: true,
    expertise: true,
    bio: true,
    photoUrl: true,
    city: true,
    language: true,
    panMasked: true,
    applicationStatus: true,
    rejectReason: true,
} as const;

async function load(userId: string) {
    const u = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, phone: true, expertProfile: { select } },
    });
    if (!u || !u.expertProfile) return null;
    return { name: u.name, email: u.email, phone: u.phone, ...u.expertProfile };
}

export const get = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const p = await load(req.user!.id);
    if (!p) return res.status(404).json({ message: "Profile not found" });
    res.json({ profile: p });
});

const updateSchema = z.object({
    bio: z.string().trim().min(50, "Write at least 50 characters").max(500).optional(),
    expertise: z.string().trim().min(2, "Add at least one area").max(200).optional(),
    experienceYears: z.coerce.number().int().min(0).max(60).optional(),
    profileLink: z.string().trim().max(300).optional(),
    city: z.string().trim().max(80).optional(),
    language: z.enum(["en", "hi"]).optional(),
});

export const update = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid request" });
    }
    const d = parsed.data;

    const current = await prisma.expertProfile.findUnique({
        where: { userId: req.user!.id },
        select: { expertType: true },
    });
    if (!current) return res.status(404).json({ message: "Profile not found" });

    if (d.profileLink !== undefined) {
        if (d.profileLink && !/^https?:\/\/\S+\.\S+/.test(d.profileLink)) {
            return res.status(400).json({ message: "Enter a valid link starting with http:// or https://" });
        }
        if (!d.profileLink && (current.expertType === "EDUCATOR" || current.expertType === "OTHER")) {
            return res.status(400).json({ message: "Your expert type needs a profile link" });
        }
    }

    await prisma.expertProfile.update({
        where: { userId: req.user!.id },
        data: {
            ...(d.bio !== undefined ? { bio: d.bio } : {}),
            ...(d.expertise !== undefined
                ? { expertise: d.expertise.split(",").map((s) => s.trim()).filter(Boolean) }
                : {}),
            ...(d.experienceYears !== undefined ? { experienceYears: d.experienceYears } : {}),
            ...(d.profileLink !== undefined ? { profileLink: d.profileLink || null } : {}),
            ...(d.city !== undefined ? { city: d.city || null } : {}),
            ...(d.language !== undefined ? { language: d.language } : {}),
        },
    });
    res.json({ profile: await load(req.user!.id) });
});

export const photo = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const file = req.file;
    if (!file || !file.mimetype.startsWith("image/")) {
        return res.status(400).json({ message: "Upload a JPG or PNG image" });
    }
    const up = await uploadFile(file, { folder: "expert-photos", isPrivate: false });
    await prisma.expertProfile.update({
        where: { userId: req.user!.id },
        data: { photoUrl: up.url },
    });
    res.json({ photoUrl: up.url });
});