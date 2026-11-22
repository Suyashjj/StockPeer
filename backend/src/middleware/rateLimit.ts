import rateLimit from "express-rate-limit";
import { env } from "../config/env";

const isProduction = env.NODE_ENV === "production";

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: isProduction ? 10 : 100, // generous in development so testing doesn't lock you out
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts. Please try again in 15 minutes." },
});

// Stricter, so nobody can use the reset form to spam someone's inbox
export const resetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: isProduction ? 5 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Please try again in 15 minutes." },
});