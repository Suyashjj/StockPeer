import { z } from "zod";

export const EXPERT_TYPES = ["SEBI_RA", "SEBI_IA", "CA", "CFA", "EDUCATOR", "OTHER"] as const;

const LICENSED = ["SEBI_RA", "SEBI_IA", "CA", "CFA"];

export const expertSignupSchema = z
    .object({
        name: z.string().trim().min(2, "Enter your full name"),
        email: z.email("Enter a valid email"),
        phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
        password: z
            .string()
            .min(8, "At least 8 characters")
            .regex(/[A-Z]/, "Add one uppercase letter")
            .regex(/[0-9]/, "Add one number"),
        expertType: z.enum(EXPERT_TYPES, { message: "Select your expert type" }),
        credentialNumber: z.string().trim().optional(),
        profileLink: z.string().trim().optional(),
        experienceYears: z.coerce.number().int().min(0).max(60),
        expertise: z.string().trim().min(2, "Add at least one area of expertise"),
        bio: z.string().trim().min(50, "Write at least 50 characters").max(500),
        pan: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, "Enter a valid PAN"),
    })
    .superRefine((d, ctx) => {
        const cred = d.credentialNumber ?? "";
        const link = d.profileLink ?? "";

        if (LICENSED.includes(d.expertType)) {
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

        const needsLink = d.expertType === "EDUCATOR" || d.expertType === "OTHER";
        if (needsLink && !link) {
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

export type ExpertSignupInput = z.infer<typeof expertSignupSchema>;