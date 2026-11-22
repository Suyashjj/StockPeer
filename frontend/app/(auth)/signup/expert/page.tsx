"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    accountSchema,
    professionalSchema,
    verificationSchema,
    EXPERT_TYPES,
    isLicensed,
    type ExpertFormValues,
} from "@/features/auth/schemas";
import { api } from "@/lib/api";
import StepIndicator from "@/features/auth/components/StepIndicator";
import FileUploadField from "@/features/auth/components/FileUploadField";
import AuthInput from "@/features/auth/components/AuthInput";
import AuthButton from "@/features/auth/components/AuthButton";
import AuthFieldError from "@/features/auth/components/AuthFieldError";

// same look as AuthInput, for <select> and <textarea>
const field =
    "w-full rounded-lg border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft focus:border-brand focus:ring-2 focus:ring-brand/20";

const STEPS = ["Account", "Professional", "Verification"];
const IMAGE_ONLY = ".jpg,.jpeg,.png";

const CREDENTIAL_PLACEHOLDER: Record<string, string> = {
    SEBI_RA: "SEBI registration number (INH000000000)",
    SEBI_IA: "SEBI registration number (INA000000000)",
    CA: "ICAI membership number",
    CFA: "CFA membership number",
};

type FileErrors = { photo?: string; id?: string; proof?: string };

export default function ExpertSignupPage() {
    const [step, setStep] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [serverError, setServerError] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);
    const [idProof, setIdProof] = useState<File | null>(null);
    const [proofDoc, setProofDoc] = useState<File | null>(null);
    const [fileErrors, setFileErrors] = useState<FileErrors>({});

    // Validate only the schema for the current step
    const {
        register,
        handleSubmit,
        trigger,
        watch,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm<ExpertFormValues>({
        resolver: (values, ctx, opts) => {
            const schema =
                step === 0 ? accountSchema : step === 1 ? professionalSchema : verificationSchema;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (zodResolver(schema as any) as any)(values, ctx, opts);
        },
    });

    const expertType = watch("expertType");
    const licensed = isLicensed(expertType);
    const needsLink = expertType === "EDUCATOR" || expertType === "OTHER";

    async function next() {
        const ok = await trigger();
        if (ok) setStep((s) => s + 1);
    }

    async function onSubmit() {
        const errs: FileErrors = {};
        if (!photo) errs.photo = "Upload a clear profile photo";
        if (!idProof) errs.id = "Upload a government ID";
        if (!proofDoc) errs.proof = "Upload your proof document";
        setFileErrors(errs);
        if (errs.photo || errs.id || errs.proof) return;

        setServerError("");

        // The resolver only returns the current step's fields, so read everything directly
        const v = getValues();

        const fd = new FormData();
        fd.append("name", v.name);
        fd.append("email", v.email);
        fd.append("phone", v.phone);
        fd.append("password", v.password);
        fd.append("terms", "true");
        fd.append("expertType", v.expertType);
        if (isLicensed(v.expertType) && v.credentialNumber) {
            fd.append("credentialNumber", v.credentialNumber);
        }
        if (v.profileLink) fd.append("profileLink", v.profileLink);
        fd.append("experienceYears", v.experienceYears);
        fd.append("expertise", v.expertise);
        fd.append("bio", v.bio);
        fd.append("pan", v.pan.toUpperCase());
        fd.append("photo", photo as File);
        fd.append("idDocument", idProof as File);
        fd.append("proofDocument", proofDoc as File);

        const res = await api("/auth/signup/expert", { method: "POST", body: fd });

        if (!res.ok) {
            const fieldErrors = res.data?.errors as Record<string, string[]> | undefined;
            const first = fieldErrors ? Object.values(fieldErrors).flat()[0] : undefined;
            setServerError(first ?? res.data?.message ?? "Something went wrong. Try again.");
            return;
        }

        setSubmitted(true);
    }

    if (submitted) {
        return (
            <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-[0_8px_30px_rgba(31,41,55,0.08)]">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-up text-xl font-bold text-white">
                    ✓
                </div>
                <h1 className="mb-2 text-2xl font-bold tracking-tight text-ink">
                    Application submitted
                </h1>
                <p className="mb-6 text-sm text-ink-soft">
                    Our team will verify your details and documents. You can log in now, but your
                    dashboard stays locked until your account is approved.
                </p>
                <Link
                    href="/?login=1"
                    className="inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                >
                    Go to login
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-[0_8px_30px_rgba(31,41,55,0.08)]">
            <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">Become an Expert</h1>
            <p className="mb-6 text-sm text-ink-soft">Verified professionals lead premium groups</p>

            <StepIndicator steps={STEPS} current={step} />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {/* STEP 1: ACCOUNT */}
                {step === 0 && (
                    <>
                        <div>
                            <AuthInput {...register("name")} placeholder="Full name" />
                            <AuthFieldError message={errors.name?.message} />
                        </div>
                        <div>
                            <AuthInput {...register("email")} type="email" placeholder="Email" />
                            <AuthFieldError message={errors.email?.message} />
                        </div>
                        <div>
                            <AuthInput
                                {...register("phone")}
                                type="tel"
                                inputMode="numeric"
                                maxLength={10}
                                placeholder="Mobile number"
                            />
                            <AuthFieldError message={errors.phone?.message} />
                        </div>
                        <div>
                            <AuthInput
                                {...register("password")}
                                type="password"
                                placeholder="Password"
                            />
                            <AuthFieldError message={errors.password?.message} />
                        </div>
                        <div>
                            <AuthInput
                                {...register("confirmPassword")}
                                type="password"
                                placeholder="Confirm password"
                            />
                            <AuthFieldError message={errors.confirmPassword?.message} />
                        </div>
                        <div>
                            <label className="flex items-start gap-2 text-xs text-ink-soft">
                                <input
                                    type="checkbox"
                                    {...register("terms")}
                                    className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                                />
                                <span>
                                    I agree to the{" "}
                                    <Link
                                        href="/terms"
                                        target="_blank"
                                        onClick={(e) => e.stopPropagation()}
                                        className="font-medium text-brand hover:underline"
                                    >
                                        Terms of Service
                                    </Link>{" "}
                                    and{" "}
                                    <Link
                                        href="/privacy"
                                        target="_blank"
                                        onClick={(e) => e.stopPropagation()}
                                        className="font-medium text-brand hover:underline"
                                    >
                                        Privacy Policy
                                    </Link>
                                    , and confirm the details I provide are accurate.
                                </span>
                            </label>
                            <AuthFieldError message={errors.terms?.message} />
                        </div>
                    </>
                )}

                {/* STEP 2: PROFESSIONAL */}
                {step === 1 && (
                    <>
                        <div>
                            <select
                                {...register("expertType")}
                                defaultValue=""
                                className={field}
                            >
                                <option value="" disabled>
                                    Select expert type
                                </option>
                                {EXPERT_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                            <AuthFieldError message={errors.expertType?.message} />
                        </div>

                        {licensed && (
                            <div>
                                <AuthInput
                                    {...register("credentialNumber")}
                                    placeholder={CREDENTIAL_PLACEHOLDER[expertType]}
                                    className="uppercase placeholder:normal-case"
                                />
                                <AuthFieldError message={errors.credentialNumber?.message} />
                            </div>
                        )}

                        {expertType && (
                            <div>
                                <AuthInput
                                    {...register("profileLink")}
                                    placeholder={
                                        needsLink
                                            ? "Channel, LinkedIn or website link"
                                            : "Profile link (optional)"
                                    }
                                />
                                <AuthFieldError message={errors.profileLink?.message} />
                            </div>
                        )}

                        <div>
                            <AuthInput
                                {...register("experienceYears")}
                                inputMode="numeric"
                                placeholder="Years of experience"
                            />
                            <AuthFieldError message={errors.experienceYears?.message} />
                        </div>
                        <div>
                            <AuthInput
                                {...register("expertise")}
                                placeholder="Areas of expertise (e.g. IT, Banking, Pharma)"
                            />
                            <AuthFieldError message={errors.expertise?.message} />
                        </div>
                        <div>
                            <textarea
                                {...register("bio")}
                                rows={4}
                                placeholder="Short bio about your background and approach"
                                className={field}
                            />
                            <AuthFieldError message={errors.bio?.message} />
                        </div>
                    </>
                )}

                {/* STEP 3: VERIFICATION */}
                {step === 2 && (
                    <>
                        <div>
                            <AuthInput
                                {...register("pan")}
                                maxLength={10}
                                placeholder="PAN number"
                                className="uppercase placeholder:normal-case"
                            />
                            <AuthFieldError message={errors.pan?.message} />
                        </div>

                        <FileUploadField
                            label="Profile photo"
                            hint="A clear photo of your face. Users will see this."
                            file={photo}
                            onChange={setPhoto}
                            error={fileErrors.photo}
                            accept={IMAGE_ONLY}
                            emptyText="Choose photo (JPG, PNG)"
                        />
                        <FileUploadField
                            label="Government ID"
                            hint="PAN card or another valid ID. Only used for verification."
                            file={idProof}
                            onChange={setIdProof}
                            error={fileErrors.id}
                        />
                        <FileUploadField
                            label="Proof document"
                            hint={
                                licensed
                                    ? "Your registration or membership certificate"
                                    : "Screenshot of your channel, profile or current position"
                            }
                            file={proofDoc}
                            onChange={setProofDoc}
                            error={fileErrors.proof}
                        />
                        <p className="text-xs text-ink-soft">
                            Do not upload Aadhaar. Documents are reviewed by our team and stored
                            securely.
                        </p>
                    </>
                )}

                {serverError && <p className="text-sm text-down">{serverError}</p>}

                {/* NAVIGATION */}
                <div className="flex gap-3 pt-2">
                    {step > 0 && (
                        <button
                            type="button"
                            onClick={() => setStep((s) => s - 1)}
                            className="flex-1 rounded-lg border border-line bg-white py-2.5 text-sm font-medium text-ink transition hover:border-brand"
                        >
                            Back
                        </button>
                    )}
                    {step < 2 ? (
                        <AuthButton type="button" onClick={next} className="flex-1">
                            Continue
                        </AuthButton>
                    ) : (
                        <AuthButton type="submit" disabled={isSubmitting} className="flex-1">
                            {isSubmitting ? "Submitting..." : "Submit application"}
                        </AuthButton>
                    )}
                </div>
            </form>

            <div className="mt-6 space-y-1 text-center text-sm text-ink-soft">
                <p>
                    Already have an account?{" "}
                    <Link href="/?login=1" className="font-medium text-brand hover:underline">
                        Log in
                    </Link>
                </p>
                <p>
                    Just here to discuss stocks?{" "}
                    <Link href="/signup/user" className="font-medium text-brand hover:underline">
                        Switch to User
                    </Link>
                </p>
            </div>
        </div>
    );
}