import { Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { uploadFile } from "../../lib/cloudinary";
import { AuthedRequest } from "../../middleware/auth";
import { panSchema, updateProfileSchema } from "./users.schema";
import * as usersService from "./users.service";

const LOCKED = ["PENDING", "VERIFIED"];

export const getMe = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const user = await usersService.getMe(req.user!.id);
    if (!user) return res.status(401).json({ message: "User not found" });
    return res.json({ user });
});

export const updateMe = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
    }
    const input = parsed.data;

    // Name and date of birth are locked while PAN is under review or verified
    const current = await usersService.getMe(req.user!.id);
    const status = current?.profile?.panStatus ?? "NOT_SUBMITTED";
    if (LOCKED.includes(status)) {
        const currentDob = current?.profile?.dateOfBirth?.toISOString().slice(0, 10);
        const nameChanged = input.name !== undefined && input.name !== current?.name;
        const dobChanged = input.dateOfBirth !== undefined && input.dateOfBirth !== currentDob;
        if (nameChanged || dobChanged) {
            return res.status(403).json({
                message: "Name and date of birth can't be changed while PAN is under review or verified",
            });
        }
    }

    const user = await usersService.updateProfile(req.user!.id, input);
    return res.json({ user });
});

export const submitPan = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "Upload a photo of your PAN card" });

    const parsed = panSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const profile = await usersService.getProfile(req.user!.id);
    if (profile && LOCKED.includes(profile.panStatus)) {
        return res.status(409).json({ message: "Your PAN is already under review or verified" });
    }

    const up = await uploadFile(file, { folder: "pan", isPrivate: true });
    const result = await usersService.submitPan(req.user!.id, parsed.data.pan, up.publicId);
    return res.status(201).json({ pan: result });
});

export const uploadPhoto = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const file = req.file;
    if (!file || !file.mimetype.startsWith("image/")) {
        return res.status(400).json({ message: "Upload a JPG or PNG image" });
    }
    const up = await uploadFile(file, { folder: "user-photos", isPrivate: false });
    const result = await usersService.setPhoto(req.user!.id, up.url);
    return res.json(result);
});