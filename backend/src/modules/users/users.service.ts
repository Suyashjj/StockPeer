import { prisma } from "../../lib/prisma";
import { encrypt, maskPan } from "../../lib/crypto";
import type { UpdateProfileInput } from "./users.schema";

const profileSelect = {
    photoUrl: true,
    dateOfBirth: true,
    city: true,
    occupation: true,
    language: true,
    experienceLevel: true,
    riskComfort: true,
    sectorsOfInterest: true,
    panMasked: true,
    panStatus: true,
    panSubmittedAt: true,
    panRejectReason: true,
} as const;

export function getMe(id: string) {
    return prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            verificationStatus: true,
            profile: { select: profileSelect },
        },
    });
}

export function getProfile(userId: string) {
    return prisma.userProfile.findUnique({ where: { userId } });
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
    const { name, dateOfBirth, ...rest } = input;
    const profileData = {
        ...rest,
        ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
    };

    await prisma.$transaction([
        ...(name ? [prisma.user.update({ where: { id: userId }, data: { name } })] : []),
        prisma.userProfile.upsert({
            where: { userId },
            create: { userId, ...profileData },
            update: profileData,
        }),
    ]);

    return getMe(userId);
}

export function submitPan(
    userId: string,
    pan: string,
    panDocumentPublicId: string
) {
    const upper = pan.toUpperCase();
    const data = {
        panEncrypted: encrypt(upper),
        panMasked: maskPan(upper),
        panDocumentPublicId,
        panStatus: "PENDING" as const,
        panSubmittedAt: new Date(),
        panReviewedAt: null,
        panReviewedById: null,
        panRejectReason: null,
    };
    return prisma.userProfile.upsert({
        where: { userId },
        create: { userId, ...data },
        update: data,
        select: { panMasked: true, panStatus: true },
    });
}

export function setPhoto(userId: string, photoUrl: string) {
    return prisma.userProfile.upsert({
        where: { userId },
        create: { userId, photoUrl },
        update: { photoUrl },
        select: { photoUrl: true },
    });
}