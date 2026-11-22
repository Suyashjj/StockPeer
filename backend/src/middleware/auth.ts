import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";

export interface AuthedRequest extends Request {
    user?: { id: string; role: Role };
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    try {
        const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: Role };
        req.user = { id: payload.sub, role: payload.role };
        next();
    } catch {
        return res.status(401).json({ message: "Invalid or expired session" });
    }
}

// Use after requireAuth. Checks the CURRENT role in the database,
// not the role stored in the token.
export function requireRole(...allowed: Role[]) {
    return async (req: AuthedRequest, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ message: "Not authenticated" });

        const dbUser = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { role: true },
        });
        if (!dbUser) return res.status(401).json({ message: "User not found" });

        if (!allowed.includes(dbUser.role)) {
            return res.status(403).json({ message: "You do not have access to this" });
        }

        req.user.role = dbUser.role;
        next();
    };
}