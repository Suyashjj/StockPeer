import crypto from "crypto";
import { Request, Response } from "express";
import { env } from "../../config/env";
import { safeEqual } from "./billing.controller";
import * as billing from "./billing.service";

// Receives the raw body (see app.ts), because the signature covers the exact bytes
export async function razorpayWebhook(req: Request, res: Response) {
    try {
        const raw = req.body as Buffer;
        const sig = req.header("x-razorpay-signature") ?? "";
        const expected = crypto
            .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
            .update(raw)
            .digest("hex");
        if (!safeEqual(sig, expected)) return res.status(400).json({ message: "Bad signature" });

        const event = JSON.parse(raw.toString("utf8"));
        const p = event?.payload?.payment?.entity;

        if (event.event === "payment.captured" && p?.order_id) {
            await billing.activatePayment(p.order_id, p.id, p.amount);
        } else if (event.event === "payment.failed" && p?.order_id) {
            await billing.markFailed(p.order_id);
        }
        return res.json({ ok: true });
    } catch {
        // A 500 makes Razorpay retry later
        return res.status(500).json({ message: "Webhook error" });
    }
}