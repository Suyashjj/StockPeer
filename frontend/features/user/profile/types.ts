export type PanStatus = "NOT_SUBMITTED" | "PENDING" | "VERIFIED" | "REJECTED";

export type Profile = {
    photoUrl: string | null;
    dateOfBirth: string | null;
    city: string | null;
    occupation: string | null;
    language: string;
    experienceLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null;
    riskComfort: "LOW" | "MEDIUM" | "HIGH" | null;
    sectorsOfInterest: string[];
    panMasked: string | null;
    panStatus: PanStatus;
    panSubmittedAt: string | null;
    panRejectReason: string | null;
};

export type ProfileUser = {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    verificationStatus: string;
    profile: Profile | null;
};