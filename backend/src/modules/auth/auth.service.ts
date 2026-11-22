import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";

// Used when the email is not found, so login takes the same time either way
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 12);

const RESET_MINUTES = 30;
const sha256 = (v: string) => crypto.createHash("sha256").update(v).digest("hex");

type SignupInput = {
    name: string;
    email: string;
    phone: string;
    password: string;
};

export function createSessionToken(userId: string, role: string) {
    return jwt.sign({ sub: userId, role }, env.JWT_SECRET, { expiresIn: "7d" });
}

export async function findExistingUser(email: string, phone: string) {
    return prisma.user.findFirst({
        where: { OR: [{ email }, { phone }] },
        select: { email: true },
    });
}

export async function createUser({ name, email, phone, password }: SignupInput) {
    const passwordHash = await bcrypt.hash(password, 12);
    return prisma.user.create({
        data: {
            name,
            email,
            phone,
            passwordHash,
            role: "USER",
            termsAcceptedAt: new Date(),
            termsVersion: "1.0",
        },
        select: { id: true, name: true, email: true, role: true, verificationStatus: true },
    });
}

export async function verifyCredentials(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
    if (!user || !ok) return null;

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
    };
}

export async function getUserById(id: string) {
    return prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            verificationStatus: true,
        },
    });
}

/** Creates a one-time token. Only its hash is stored. Returns null if the email is unknown. */
export async function createPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
        where: { id: undefined, email },
        select: { id: true, name: true, email: true, accountStatus: true },
    });
    if (!user || user.accountStatus !== "ACTIVE") return null;

    // Only the newest link works
    await prisma.passwordReset.deleteMany({ where: { userId: user.id, usedAt: null } });

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.passwordReset.create({
        data: {
            userId: user.id,
            tokenHash: sha256(token),
            expiresAt: new Date(Date.now() + RESET_MINUTES * 60 * 1000),
        },
    });
    return { user, token, minutes: RESET_MINUTES };
}

/** Returns false when the link is invalid, used or expired. */
export async function resetPassword(token: string, password: string) {
    const rec = await prisma.passwordReset.findUnique({ where: { tokenHash: sha256(token) } });
    if (!rec || rec.usedAt || rec.expiresAt < new Date()) return false;

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction([
        prisma.user.update({ where: { id: rec.userId }, data: { passwordHash } }),
        prisma.passwordReset.update({ where: { id: rec.id }, data: { usedAt: new Date() } }),
        prisma.passwordReset.deleteMany({
            where: { userId: rec.userId, usedAt: null, id: { not: rec.id } },
        }),
    ]);
    return true;
}