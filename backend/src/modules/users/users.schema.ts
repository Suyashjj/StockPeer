import { z } from "zod";

const dob = z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date")
    .refine((v) => {
        const d = new Date(v);
        const eighteen = new Date();
        eighteen.setFullYear(eighteen.getFullYear() - 18);
        return d <= eighteen;
    }, "You must be at least 18 years old");

export const updateProfileSchema = z.object({
    name: z.string().trim().min(2).optional(),
    dateOfBirth: dob.optional(),
    city: z.string().trim().max(80).optional(),
    occupation: z.string().trim().max(80).optional(),
    language: z.enum(["en", "hi"]).optional(),
    experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
    riskComfort: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    sectorsOfInterest: z.array(z.string().trim().min(1).max(40)).max(15).optional(),
});

export const panSchema = z.object({
    pan: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, "Enter a valid PAN"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;