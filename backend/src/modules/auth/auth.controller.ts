import { Request, Response } from "express";
import { env } from "../../config/env";
import { AuthedRequest } from "../../middleware/auth";
import { sendMail } from "../../lib/mailer";
import { signupSchema, loginSchema, forgotSchema, resetSchema } from "./auth.schema";
import * as authService from "./auth.service";

const isProd = env.NODE_ENV === "production";

const cookieOptions = {
    httpOnly: true,
    // Frontend (Vercel) and backend (Render) are on different domains in production,
    // so the cookie must be "none" + secure there. Locally it stays "lax".
    sameSite: (isProd ? "none" : "lax") as "none" | "lax",
    secure: isProd,
    path: "/",
};

function setSessionCookie(res: Response, userId: string, role: string) {
    const token = authService.createSessionToken(userId, role);
    res.cookie("token", token, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}

export async function signup(req: Request, res: Response) {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
    }
    const { name, email, phone, password } = parsed.data;

    const existing = await authService.findExistingUser(email, phone);
    if (existing) {
        return res.status(409).json({
            message:
                existing.email === email
                    ? "An account with this email already exists"
                    : "An account with this phone number already exists",
        });
    }

    const user = await authService.createUser({ name, email, phone, password });

    setSessionCookie(res, user.id, user.role);
    return res.status(201).json({ user });
}

export async function login(req: Request, res: Response) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Enter a valid email and password" });
    }
    const { email, password } = parsed.data;

    const user = await authService.verifyCredentials(email, password);
    if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    setSessionCookie(res, user.id, user.role);
    return res.json({ user });
}

export async function me(req: AuthedRequest, res: Response) {
    const user = await authService.getUserById(req.user!.id);
    if (!user) return res.status(401).json({ message: "User not found" });
    return res.json({ user });
}

export function logout(_req: Request, res: Response) {
    res.clearCookie("token", cookieOptions);
    return res.json({ message: "Logged out" });
}

/** Always answers the same way, so nobody can find out which emails are registered. */
export async function forgotPassword(req: Request, res: Response) {
    const parsed = forgotSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Enter a valid email" });
    }

    const reply = { message: "If an account exists for this email, we have sent a reset link." };

    // Answer first, then do the work, so response time does not reveal anything either
    res.json(reply);

    try {
        const result = await authService.createPasswordReset(parsed.data.email);
        if (!result) return;

        const link = `${env.FRONTEND_URL}/reset-password?token=${result.token}`;
        const text =
            `Hi ${result.user.name},\n\n` +
            `Use this link to set a new StockPeer password. It works for ${result.minutes} minutes and only once:\n${link}\n\n` +
            `If you did not ask for this, you can ignore this email.`;
        const html =
            `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#1f2937">` +
            `<h2 style="margin:0 0 12px">Reset your password</h2>` +
            `<p>Hi ${result.user.name},</p>` +
            `<p>Use the button below to set a new StockPeer password. The link works for ${result.minutes} minutes and only once.</p>` +
            `<p style="margin:24px 0"><a href="${link}" style="background:#2f5fd0;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">Set new password</a></p>` +
            `<p style="font-size:13px;color:#6b7280">If you did not ask for this, you can ignore this email. Your password will not change.</p>` +
            `</div>`;

        await sendMail(result.user.email, "Reset your StockPeer password", html, text);
    } catch (err) {
        console.error("[forgotPassword]", err);
    }
}

export async function resetPassword(req: Request, res: Response) {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const ok = await authService.resetPassword(parsed.data.token, parsed.data.password);
    if (!ok) {
        return res.status(400).json({
            message: "This reset link is invalid or has expired. Please request a new one.",
        });
    }
    return res.json({ message: "Password updated. You can log in now." });
}