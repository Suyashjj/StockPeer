import { z } from "zod";

const phone = z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");

const password = z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Add one uppercase letter")
    .regex(/[0-9]/, "Add one number");

export const accountSchema = z
    .object({
        name: z.string().min(2, "Enter your full name"),
        email: z
            .email("Enter a valid email")
            .refine((v) => /@gmail\.com$/i.test(v.trim()), "Use your Gmail address (name@gmail.com)"),
        phone,
        password,
        confirmPassword: z.string(),
        terms: z.literal(true, {
            message: "You must accept the terms to continue",
        }),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export const loginSchema = z.object({
    email: z.email("Enter a valid email"),
    password: z.string().min(1, "Enter your password"),
});

export const forgotSchema = z.object({
    email: z.email("Enter a valid email"),
});

export const resetSchema = z
    .object({
        password,
        confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

/* ---------- Expert ---------- */

export const EXPERT_TYPES = [
    { value: "SEBI_RA", label: "SEBI Research Analyst" },
    { value: "SEBI_IA", label: "SEBI Investment Adviser" },
    { value: "CA", label: "Chartered Accountant (CA)" },
    { value: "CFA", label: "CFA charterholder" },
    { value: "EDUCATOR", label: "Educator / Content creator" },
    { value: "OTHER", label: "Other finance professional" },
] as const;

const EXPERT_TYPE_VALUES = ["SEBI_RA", "SEBI_IA", "CA", "CFA", "EDUCATOR", "OTHER"] as const;

const LICENSED_TYPES: string[] = ["SEBI_RA", "SEBI_IA", "CA", "CFA"];

export function isLicensed(type?: string) {
    return !!type && LICENSED_TYPES.includes(type);
}

export const professionalSchema = z
    .object({
        expertType: z.enum(EXPERT_TYPE_VALUES, { message: "Select your expert type" }),
        credentialNumber: z.string().trim().optional(),
        profileLink: z.string().trim().optional(),
        experienceYears: z
            .string()
            .regex(/^\d{1,2}$/, "Enter years as a number")
            .refine((v) => Number(v) >= 0 && Number(v) <= 60, "Enter a valid number"),
        expertise: z.string().min(2, "Add at least one area (e.g. IT stocks, Banking)"),
        bio: z
            .string()
            .min(50, "Write at least 50 characters")
            .max(500, "Keep it under 500 characters"),
    })
    .superRefine((d, ctx) => {
        const cred = d.credentialNumber ?? "";
        const link = d.profileLink ?? "";

        if (isLicensed(d.expertType)) {
            if (!cred) {
                ctx.addIssue({
                    code: "custom",
                    path: ["credentialNumber"],
                    message: "Enter your registration or membership number",
                });
            } else if (d.expertType === "SEBI_RA" && !/^INH\d{9}$/i.test(cred)) {
                ctx.addIssue({
                    code: "custom",
                    path: ["credentialNumber"],
                    message: "Format: INH000000000",
                });
            } else if (d.expertType === "SEBI_IA" && !/^INA\d{9}$/i.test(cred)) {
                ctx.addIssue({
                    code: "custom",
                    path: ["credentialNumber"],
                    message: "Format: INA000000000",
                });
            } else if (cred.length < 4) {
                ctx.addIssue({
                    code: "custom",
                    path: ["credentialNumber"],
                    message: "Enter a valid number",
                });
            }
        }

        if ((d.expertType === "EDUCATOR" || d.expertType === "OTHER") && !link) {
            ctx.addIssue({
                code: "custom",
                path: ["profileLink"],
                message: "Add a link to your channel, LinkedIn or website",
            });
        }
        if (link && !/^https?:\/\/\S+\.\S+/.test(link)) {
            ctx.addIssue({
                code: "custom",
                path: ["profileLink"],
                message: "Enter a valid link starting with http:// or https://",
            });
        }
    });

export const verificationSchema = z.object({
    pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, "Enter a valid PAN (e.g. ABCDE1234F)"),
});

export type AccountValues = z.infer<typeof accountSchema>;
export type ProfessionalValues = z.infer<typeof professionalSchema>;
export type VerificationValues = z.infer<typeof verificationSchema>;
export type ExpertFormValues = AccountValues & ProfessionalValues & VerificationValues;
export type LoginValues = z.infer<typeof loginSchema>;
export type ForgotValues = z.infer<typeof forgotSchema>;
export type ResetValues = z.infer<typeof resetSchema>;