import crypto from "crypto";
import { Response } from "express";
import { z } from "zod";
import { env } from "../../config/env";
import { asyncHandler } from "../../lib/asyncHandler";
import { AuthedRequest } from "../../middleware/auth";
import { isPanVerified } from "../stocks/stocks.service";
import * as billing from "./billing.service";

export function safeEqual(a: string, b: string) {
    const x = Buffer.from(a);
    const y = Buffer.from(b);
    return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export const plans = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const [items, subscription] = await Promise.all([
        billing.listPlans(),
        billing.currentSubscription(req.user!.id),
    ]);
    res.json({ plans: items, subscription });
});

export const checkout = asyncHandler(async (req: AuthedRequest, res: Response) => {
    if (req.user!.role !== "USER") {
        return res.status(403).json({ message: "Only member accounts can buy a plan" });
    }
    const parsed = z.object({ planId: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Choose a plan" });

    if (!(await isPanVerified(req.user!.id))) {
        return res.status(403).json({ message: "Verify your PAN before buying a plan" });
    }

    const result = await billing.createCheckout(req.user!.id, parsed.data.planId);
    if (result === "NO_PLAN") return res.status(404).json({ message: "Plan not found" });
    if (result === "ALREADY_ACTIVE") {
        return res.status(409).json({ message: "You already have an active plan" });
    }
    res.status(201).json(result);
});

// Called by the browser after payment. The signature proves Razorpay produced it.
export const verify = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = z
        .object({
            razorpay_order_id: z.string(),
            razorpay_payment_id: z.string(),
            razorpay_signature: z.string(),
        })
        .safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid payment details" });
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: sig } =
        parsed.data;

    const expected = crypto
        .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");
    if (!safeEqual(sig, expected)) {
        return res.status(400).json({ message: "Payment could not be verified" });
    }

    const owner = await billing.paymentOwner(orderId);
    if (!owner || owner.userId !== req.user!.id) {
        return res.status(404).json({ message: "Payment not found" });
    }

    await billing.activatePayment(orderId, paymentId);
    res.json({ subscription: await billing.currentSubscription(req.user!.id) });
});