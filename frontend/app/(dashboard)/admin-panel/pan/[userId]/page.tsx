"use client";

import { useParams } from "next/navigation";
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
    dateOfBirth: string | null;
    pan: string;
    documentUrl: string;
    status: string;
    submittedAt: string | null;
};

export default function PanDetailPage() {
    const { userId } = useParams<{ userId: string }>();
    const { data, loading, error } = useAdminGet<Detail>(`/admin/pan/${userId}`);

    return (
        <div className="space-y-6">
            <div>
                <BackLink href="/admin-panel/pan" label="Back to PAN reviews" />
                <PageHeader
                    title="Review PAN"
                    subtitle="Check that the name and number match the card."
                />
            </div>

            {loading && <p className="text-ink-soft">Loading...</p>}
            {error && <ErrorBox text={error} />}

            {data && (
                <>
                    <Card title="Details">
                        <dl>
                            <InfoRow label="Name on account">{data.user.name}</InfoRow>
                            <InfoRow label="Email">{data.user.email}</InfoRow>
                            <InfoRow label="Mobile">{data.user.phone}</InfoRow>
                            <InfoRow label="Date of birth">{formatDate(data.dateOfBirth)}</InfoRow>
                            <InfoRow label="PAN number">
                                <span className="font-mono tracking-wide">{data.pan}</span>
                            </InfoRow>
                            <InfoRow label="Submitted">{formatDate(data.submittedAt)}</InfoRow>
                            <InfoRow label="Status">{data.status}</InfoRow>
                        </dl>
                    </Card>

                    <Card title="PAN card photo">
                        <DocumentPreview label="Uploaded card" url={data.documentUrl} />
                    </Card>

                    {data.status === "PENDING" ? (
                        <DecisionPanel
                            endpoint={`/admin/pan/${userId}/decision`}
                            backHref="/admin-panel/pan"
                            approveLabel="Approve PAN"
                        />
                    ) : (
                        <p className="text-sm text-ink-soft">
                            This submission has already been decided ({data.status}).
                        </p>
                    )}
                </>
            )}
        </div>
    );
}