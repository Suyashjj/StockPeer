import { NextFunction, Response } from "express";
import type { ExpertType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "./auth";

const ELIGIBLE: ExpertType[] = ["SEBI_RA", "SEBI_IA"];

// Approved SEBI RA / IA experts only. Reads the database, not the token.
export async function requireEligibleExpert(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) return res.status(401).json({ message: "Not authenticated" });
        const ok = await prisma.user.findFirst({
            where: {
                id: req.user.id,
                role: "EXPERT",
                accountStatus: "ACTIVE",
                verificationStatus: "APPROVED",
                expertProfile: { is: { applicationStatus: "APPROVED", expertType: { in: ELIGIBLE } } },
            },
            select: { id: true },
        });
        if (!ok) {
            return res.status(403).json({
                message: "Only approved SEBI Research Analysts or Investment Advisers can use this",
            });
        }
        next();
    } catch (e) {
        next(e);
    }
}