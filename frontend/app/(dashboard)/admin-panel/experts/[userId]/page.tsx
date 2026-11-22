"use client";

import { useParams } from "next/navigation";
import { EXPERT_TYPES } from "@/features/auth/schemas";
import { useAdminGet } from "@/features/admin/useAdminGet";
import {
    BackLink,
    Card,
    DecisionPanel,
    DocumentPreview,
    ErrorBox,
    formatDate,
    InfoRow,
    PageHeader,
} from "@/features/admin/components/ReviewParts";

type Detail = {
    user: { name: string; email: string; phone: string };
    expertType: string;
    credentialNumber: string | null;
    profileLink: string | null;
    experienceYears: number;
    expertise: string[];
    bio: string;
    photoUrl: string;
    pan: string;
    idDocumentUrl: string;
    proofDocumentUrl: string;
    status: string;
    submittedAt: string;
};

export default function ExpertDetailPage() {
    const { userId } = useParams<{ userId: string }>();
    const { data, loading, error } = useAdminGet<Detail>(`/admin/experts/${userId}`);

    const typeLabel = data
        ? (EXPERT_TYPES.find((t) => t.value === data.expertType)?.label ?? data.expertType)
        : "";

    return (
        <div className="space-y-6">
            <div>
                <BackLink href="/admin-panel/experts" label="Back to applications" />
                <PageHeader
                    title="Review expert application"
                    subtitle="Check the credentials, link and documents before approving."
                />
            </div>

            {loading && <p className="text-ink-soft">Loading...</p>}
            {error && <ErrorBox text={error} />}

            {data && (
                <>
                    <Card title="Applicant">
                        <div className="flex flex-col gap-5 sm:flex-row">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={data.photoUrl}
                                alt={data.user.name}
                                className="h-28 w-28 shrink-0 rounded-2xl border border-line object-cover"
                            />
                            <dl className="min-w-0 flex-1">
                                <InfoRow label="Name">{data.user.name}</InfoRow>
                                <InfoRow label="Email">{data.user.email}</InfoRow>
                                <InfoRow label="Mobile">{data.user.phone}</InfoRow>
                                <InfoRow label="Submitted">{formatDate(data.submittedAt)}</InfoRow>
                            </dl>
                        </div>
                    </Card>

                    <Card title="Professional details">
                        <dl>
                            <InfoRow label="Expert type">{typeLabel}</InfoRow>
                            <InfoRow label="Credential number">
                                {data.credentialNumber ?? "Not provided"}
                            </InfoRow>
                            <InfoRow label="Profile link">
                                {data.profileLink ? (
                                    <a
                                        href={data.profileLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-brand hover:underline"
                                    >
                                        {data.profileLink}
                                    </a>
                                ) : (
                                    "Not provided"
                                )}
                            </InfoRow>
                            <InfoRow label="Experience">{data.experienceYears} years</InfoRow>
                            <InfoRow label="Expertise">{data.expertise.join(", ")}</InfoRow>
                            <InfoRow label="Bio">{data.bio}</InfoRow>
                            <InfoRow label="PAN number">
                                <span className="font-mono tracking-wide">{data.pan}</span>
                            </InfoRow>
                        </dl>
                    </Card>

                    <Card title="Documents">
                        <div className="grid gap-6 md:grid-cols-2">
                            <DocumentPreview label="Government ID" url={data.idDocumentUrl} />
                            <DocumentPreview label="Proof document" url={data.proofDocumentUrl} />
                        </div>
                    </Card>

                    {data.status === "PENDING" ? (
                        <DecisionPanel
                            endpoint={`/admin/experts/${userId}/decision`}
                            backHref="/admin-panel/experts"
                            approveLabel="Approve expert"
                        />
                    ) : (
                        <p className="text-sm text-ink-soft">
                            This application has already been decided ({data.status}).
                        </p>
                    )}
                </>
            )}
        </div>
    );
}