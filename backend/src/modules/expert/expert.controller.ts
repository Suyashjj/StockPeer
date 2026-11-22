import { Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { uploadFile } from "../../lib/cloudinary";
import { AuthedRequest } from "../../middleware/auth";
import * as authService from "../auth/auth.service";
import { expertSignupSchema } from "./expert.schema";
import * as expertService from "./expert.service";

export const signupExpert = asyncHandler(async (req, res: Response) => {
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const photo = files?.photo?.[0];
    const idDoc = files?.idDocument?.[0];
    const proof = files?.proofDocument?.[0];

    if (!photo || !idDoc || !proof) {
        return res.status(400).json({
            message: "Profile photo, government ID and proof document are all required",
        });
    }
    if (!photo.mimetype.startsWith("image/")) {
        return res.status(400).json({ message: "Profile photo must be a JPG or PNG image" });
    }
    if (req.body.terms !== "true") {
        return res.status(400).json({ message: "You must accept the terms to continue" });
    }

    const parsed = expertSignupSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
    }
    const input = parsed.data;

    const existing = await authService.findExistingUser(input.email, input.phone);
    if (existing) {
        return res.status(409).json({
            message:
                existing.email === input.email
                    ? "An account with this email already exists"
                    : "An account with this phone number already exists",
        });
    }
    if (input.credentialNumber && (await expertService.credentialTaken(input.credentialNumber))) {
        return res.status(409).json({ message: "This registration number is already in use" });
    }

    const [photoUp, idUp, proofUp] = await Promise.all([
        uploadFile(photo, { folder: "expert-photos", isPrivate: false }),
        uploadFile(idDoc, { folder: "expert-id", isPrivate: true }),
        uploadFile(proof, { folder: "expert-proof", isPrivate: true }),
    ]);

    await expertService.createExpert(input, {
        photoUrl: photoUp.url,
        idDocumentPublicId: idUp.publicId,
        proofDocumentPublicId: proofUp.publicId,
    });

    return res.status(201).json({ message: "Application submitted" });
});

export const myApplication = asyncHandler(async (req: AuthedRequest, res: Response) => {
    if (req.user!.role !== "EXPERT") return res.status(403).json({ message: "Forbidden" });
    const application = await expertService.getApplication(req.user!.id);
    if (!application) return res.status(404).json({ message: "No application found" });
    return res.json({ application });
});