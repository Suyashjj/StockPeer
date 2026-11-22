import { z } from "zod";

const password = z
    .string()
    .min(8, "At least 8 characters")
    .max(72, "Keep it under 72 characters")
    .regex(/[A-Z]/, "Add one uppercase letter")
    .regex(/[0-9]/, "Add one number");

export const signupSchema = z.object({
    name: z.string().trim().min(2, "Enter your full name"),
    email: z.email("Enter a valid email").trim().toLowerCase(),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
    password,
});

export const loginSchema = z.object({
    email: z.email().trim().toLowerCase(),
    password: z.string().min(1).max(72),
});

export const forgotSchema = z.object({
    email: z.email().trim().toLowerCase(),
});

export const resetSchema = z.object({
    token: z.string().min(32).max(200),
    password,
});