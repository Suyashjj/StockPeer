import { Prisma, type ChangeField } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { decrypt, encrypt, maskPan } from "../../lib/crypto";

const TYPES = ["SEBI_RA", "SEBI_IA", "CA", "CFA", "EDUCATOR", "OTHER"] as const;
const LICENSED = ["SEBI_RA", "SEBI_IA", "CA", "CFA"];

// Fields that change what we verified, so the expert goes back to Pending
export const REVERIFY: ChangeField[] = ["CREDENTIAL", "PAN", "ID_DOCUMENT", "PROOF_DOCUMENT"];
export const DOC_FIELDS: ChangeField[] = ["ID_DOCUMENT", "PROOF_DOCUMENT"];

function credentialError(type: string, cred: string) {
    if (!LICENSED.includes(type)) return null;
    if (!cred) return "Enter your registration or membership number";
    if (type === "SEBI_RA" && !/^INH\d{9}$/.test(cred)) return "Format: INH000000000";
    if (type === "SEBI_IA" && !/^INA\d{9}$/.test(cred)) return "Format: INA000000000";
    if (cred.length < 4) return "Enter a valid number";
    return null;
}

type Prep = { error: string } | { oldValue: string; newValue: string | null };

// Checks a requested change and returns what to store on the ticket
export async function prepareChange(userId: string, field: ChangeField, raw?: string): Promise<Prep> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { expertProfile: true },
    });
    const p = user?.expertProfile;
    if (!user || !p) return { error: "Expert profile not found" };
    const value = (raw ?? "").trim();

    switch (field) {
        case "NAME": {
            if (value.length < 2 || value.length > 80) return { error: "Enter a valid name" };
            if (value === user.name) return { error: "That is already your name" };
            return { oldValue: user.name, newValue: value };
        }
        case "EMAIL": {
            if (!z.email().safeParse(value).success) return { error: "Enter a valid email" };
            if (value === user.email) return { error: "That is already your email" };
            if (await prisma.user.findUnique({ where: { email: value }, select: { id: true } })) {
                return { error: "That email is already in use" };
            }
            return { oldValue: user.email, newValue: value };
        }
        case "PHONE": {
            if (!/^[6-9]\d{9}$/.test(value)) return { error: "Enter a valid 10-digit mobile number" };
            if (value === user.phone) return { error: "That is already your number" };
            if (await prisma.user.findUnique({ where: { phone: value }, select: { id: true } })) {
                return { error: "That number is already in use" };
            }
            return { oldValue: user.phone, newValue: value };
        }
        case "CREDENTIAL": {
            let json: unknown;
            try {
                json = JSON.parse(value);
            } catch {
                return { error: "Choose a type and enter the number" };
            }
            const r = z
                .object({ expertType: z.enum(TYPES), credentialNumber: z.string().trim().optional() })
                .safeParse(json);
            if (!r.success) return { error: "Choose a type and enter the number" };

            const type = r.data.expertType;
            const cred = (r.data.credentialNumber ?? "").toUpperCase();
            const msg = credentialError(type, cred);
            if (msg) return { error: msg };
            if ((type === "EDUCATOR" || type === "OTHER") && !p.profileLink) {
                return { error: "Add a profile link on your Profile page first" };
            }

            const number = LICENSED.includes(type) ? cred : null;
            if (type === p.expertType && number === p.credentialNumber) {
                return { error: "Nothing would change" };
            }
            if (number) {
                const taken = await prisma.expertProfile.findFirst({
                    where: { credentialNumber: number, userId: { not: userId } },
                    select: { id: true },
                });
                if (taken) return { error: "That registration number is already in use" };
            }
            return {
                oldValue: `${p.expertType}${p.credentialNumber ? ` · ${p.credentialNumber}` : ""}`,
                newValue: JSON.stringify({ expertType: type, credentialNumber: number }),
            };
        }
        case "PAN": {
            if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(value)) return { error: "Enter a valid PAN" };
            return { oldValue: p.panMasked, newValue: encrypt(value.toUpperCase()) };
        }
        case "ID_DOCUMENT":
        case "PROOF_DOCUMENT":
            return { oldValue: "Current document", newValue: null };
    }
}

// Human-readable new value. The full PAN is shown to admin only.
export function displayNew(field: ChangeField | null, newValue: string | null, reveal: boolean) {
    if (!field || !newValue) return null;
    try {
        if (field === "PAN") {
            const pan = decrypt(newValue);
            return reveal ? pan : maskPan(pan);
        }
        if (field === "CREDENTIAL") {
            const c = JSON.parse(newValue) as { expertType: string; credentialNumber: string | null };
            return `${c.expertType}${c.credentialNumber ? ` · ${c.credentialNumber}` : ""}`;
        }
    } catch {
        return null;
    }
    return newValue;
}

// Approves a change request and applies it. Safe to call twice.
export async function applyChange(ticketId: string, adminId: string) {
    try {
        return await prisma.$transaction(async (tx) => {
            const t = await tx.supportTicket.findUnique({ where: { id: ticketId } });
            if (!t || t.kind !== "CHANGE" || !t.field) return "NOT_OPEN" as const;

            const claimed = await tx.supportTicket.updateMany({
                where: { id: ticketId, status: "OPEN" },
                data: { status: "APPROVED", reviewedById: adminId, reviewedAt: new Date() },
            });
            if (claimed.count === 0) return "NOT_OPEN" as const;

            const p = await tx.expertProfile.findUnique({ where: { userId: t.userId } });
            if (!p) throw new Error("NO_PROFILE");

            const userData: Prisma.UserUpdateInput = {};
            const profileData: Prisma.ExpertProfileUpdateInput = {};

            switch (t.field) {
                case "NAME":
                    userData.name = t.newValue!;
                    break;
                case "EMAIL":
                    userData.email = t.newValue!;
                    userData.emailVerifiedAt = null;
                    break;
                case "PHONE":
                    userData.phone = t.newValue!;
                    userData.phoneVerifiedAt = null;
                    break;
                case "CREDENTIAL": {
                    const c = JSON.parse(t.newValue!) as {
                        expertType: (typeof TYPES)[number];
                        credentialNumber: string | null;
                    };
                    profileData.expertType = c.expertType;
                    profileData.credentialNumber = c.credentialNumber;
                    break;
                }
                case "PAN":
                    profileData.panEncrypted = t.newValue!;
                    profileData.panMasked = maskPan(decrypt(t.newValue!));
                    break;
                case "ID_DOCUMENT":
                    profileData.idDocumentPublicId = t.documentId!;
                    break;
                case "PROOF_DOCUMENT":
                    profileData.proofDocumentPublicId = t.documentId!;
                    break;
            }

            if (REVERIFY.includes(t.field)) {
                profileData.applicationStatus = "PENDING";
                profileData.reviewedAt = null;
                profileData.reviewedById = null;
                profileData.rejectReason = null;
                profileData.submittedAt = new Date();
                userData.verificationStatus = "PENDING";
            }

            if (Object.keys(userData).length) {
                await tx.user.update({ where: { id: t.userId }, data: userData });
            }
            if (Object.keys(profileData).length) {
                await tx.expertProfile.update({ where: { userId: t.userId }, data: profileData });
            }
            return "OK" as const;
        });
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            return "TAKEN" as const; // email, phone or number was taken meanwhile
        }
        throw e;
    }
}