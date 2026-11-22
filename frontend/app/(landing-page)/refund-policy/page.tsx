import type { Metadata } from "next";
import LegalPage, { LegalSection } from "@/features/landing/components/LegalPage";

export const metadata: Metadata = { title: "Refund Policy · StockPeer" };

export default function RefundPage() {
    return (
        <LegalPage
            title="Refund Policy"
            updated="18 November 2026"
            intro="Premium and Elite plans are paid in advance. This page explains when you can ask for a refund."
        >
            <LegalSection title="1. Eligibility">
                <p>You can request a full refund within 7 days of payment if all of the following are true:</p>
                <ul className="list-disc space-y-1 pl-5">
                    <li>you have not joined any premium group, and</li>
                    <li>you have not booked or attended any counselling session, and</li>
                    <li>you have not broken our Terms of Service.</li>
                </ul>
            </LegalSection>

            <LegalSection title="2. After you start using the plan">
                <p>
                    Once you have joined a premium group or used a counselling session, the plan counts as used
                    and is not refundable. Plans are not refunded for change of mind after the 7-day window.
                </p>
            </LegalSection>

            <LegalSection title="3. Failed or duplicate payments">
                <p>
                    If money was deducted but your plan did not activate, or you were charged twice, contact us
                    with the payment details. We will fix the activation or refund the extra amount.
                </p>
            </LegalSection>

            <LegalSection title="4. How to ask and how long it takes">
                <p>
                    Send your request through the Contact us page from your registered email. Approved refunds go
                    back to the original payment method and usually reach you in 5 to 7 working days, depending on
                    your bank.
                </p>
            </LegalSection>
        </LegalPage>
    );
}