import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { encrypt, maskPan } from "../../lib/crypto";
import type { ExpertSignupInput } from "./expert.schema";

type Files = { photoUrl: string; idDocumentPublicId: string; proofDocumentPublicId: string };

export async function credentialTaken(credentialNumber: string) {
    const found = await prisma.expertProfile.findUnique({
        where: { credentialNumber: credentialNumber.toUpperCase() },
        select: { id: true },
    });
    return !!found;
}

export async function createExpert(input: ExpertSignupInput, files: Files) {
    const passwordHash = await bcrypt.hash(input.password, 12);
    const pan = input.pan.toUpperCase();

    return prisma.user.create({
        data: {
            name: input.name,
            email: input.email,
            phone: input.phone,
            passwordHash,
            role: "EXPERT",
            verificationStatus: "PENDING",
            termsAcceptedAt: new Date(),
            termsVersion: "1.0",
            expertProfile: {
                create: {
                    expertType: input.expertType,
                    credentialNumber: input.credentialNumber
                        ? input.credentialNumber.toUpperCase()
                        : null,
                    profileLink: input.profileLink || null,
                    experienceYears: input.experienceYears,
                    expertise: input.expertise
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    bio: input.bio,
                    photoUrl: files.photoUrl,
                    panEncrypted: encrypt(pan),
                    panMasked: maskPan(pan),
                    idDocumentPublicId: files.idDocumentPublicId,
                    proofDocumentPublicId: files.proofDocumentPublicId,
                },
            },
        },
        select: { id: true },
    });
}

export function getApplication(userId: string) {
    return prisma.expertProfile.findUnique({
        where: { userId },
        select: {
            applicationStatus: true,
            rejectReason: true,
            expertType: true,
            submittedAt: true,
            reviewedAt: true,
        },
    });
}