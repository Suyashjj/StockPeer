import Razorpay from "razorpay";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";

const razorpay = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });

export function listPlans() {
    return prisma.plan.findMany({
        where: { isActive: true },
        orderBy: [{ tier: "asc" }, { months: "asc" }],
        select: { id: true, tier: true, months: true, pricePaise: true, groupLimit: true, sessionLimit: true },
    });
}

export async function currentSubscription(userId: string) {
    const s = await prisma.subscription.findFirst({
        where: { userId, status: "ACTIVE", endsAt: { gt: new Date() } },
        orderBy: { endsAt: "desc" },
        select: {
            id: true,
            endsAt: true,
            groupLimit: true,
            sessionsTotal: true,
            sessionsUsed: true,
            plan: { select: { tier: true, months: true } },
            _count: { select: { access: true } },
        },
    });
    if (!s) return null;
    return {
        tier: s.plan.tier,
        months: s.plan.months,
        endsAt: s.endsAt.toISOString(),
        groupLimit: s.groupLimit,
        groupsUsed: s._count.access,
        sessionsTotal: s.sessionsTotal,
        sessionsUsed: s.sessionsUsed,
    };
}

export async function createCheckout(userId: string, planId: string) {
    const plan = await prisma.plan.findFirst({ where: { id: planId, isActive: true } });
    if (!plan) return "NO_PLAN" as const;
    if (await currentSubscription(userId)) return "ALREADY_ACTIVE" as const;

    const order = await razorpay.orders.create({
        amount: plan.pricePaise,
        currency: "INR",
        receipt: `sp_${Date.now()}`,
        notes: { userId, planId },
    });

    await prisma.payment.create({
        data: {
            userId,
            planId,
            razorpayOrderId: order.id,
            amountPaise: plan.pricePaise,
        },
    });

    return { orderId: order.id, amount: plan.pricePaise, keyId: env.RAZORPAY_KEY_ID };
}

// Safe to call many times (browser callback and webhook both call it)
export async function activatePayment(orderId: string, paymentId: string, amountPaise?: number) {
    return prisma.$transaction(async (tx) => {
        const p = await tx.payment.findUnique({
            where: { razorpayOrderId: orderId },
            include: { plan: true },
        });
        if (!p) return null;
        if (p.status === "PAID") return p;
        if (amountPaise !== undefined && amountPaise !== p.amountPaise) return null;

        const claimed = await tx.payment.updateMany({
            where: { id: p.id, status: { in: ["CREATED", "FAILED"] } },
            data: { status: "PAID", razorpayPaymentId: paymentId, paidAt: new Date() },
        });
        if (claimed.count === 0) return p;

        const startsAt = new Date();
        const endsAt = new Date(startsAt);
        endsAt.setMonth(endsAt.getMonth() + p.plan.months);

        const sub = await tx.subscription.create({
            data: {
                userId: p.userId,
                planId: p.planId,
                startsAt,
                endsAt,
                groupLimit: p.plan.groupLimit,
                sessionsTotal: p.plan.sessionLimit,
            },
        });
        await tx.payment.update({ where: { id: p.id }, data: { subscriptionId: sub.id } });
        return p;
    });
}

export function markFailed(orderId: string) {
    return prisma.payment.updateMany({
        where: { razorpayOrderId: orderId, status: "CREATED" },
        data: { status: "FAILED" },
    });
}

export function paymentOwner(orderId: string) {
    return prisma.payment.findUnique({
        where: { razorpayOrderId: orderId },
        select: { userId: true },
    });
}