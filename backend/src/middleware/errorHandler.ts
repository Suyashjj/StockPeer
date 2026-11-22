import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

export function notFoundHandler(_req: Request, res: Response) {
    res.status(404).json({ message: "Route not found" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    // Expected errors we threw on purpose
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ message: err.message, errors: err.errors });
    }

    // Two signups at the same moment can both pass the duplicate check.
    // The database unique rule catches the second one (code P2002).
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return res.status(409).json({ message: "An account with these details already exists" });
    }

    // Anything else is a bug or an outage: log it, hide the details from the client
    console.error(err);
    return res.status(500).json({
        message: "Something went wrong. Please try again.",
        ...(env.NODE_ENV === "development" && err instanceof Error ? { detail: err.message } : {}),
    });
}