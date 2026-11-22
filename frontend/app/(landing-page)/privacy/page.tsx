import type { Metadata } from "next";
import LegalPage, { LegalSection } from "@/features/landing/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy · StockPeer" };

export default function PrivacyPage() {
    return (
        <LegalPage
            title="Privacy Policy"
            updated="18 November 2026"
            intro="This page explains what information StockPeer collects, why, and how it is used."
        >
            <LegalSection title="1. What we collect">
                <ul className="list-disc space-y-1 pl-5">
                    <li>Account details: name, email address, mobile number and password (stored securely, never in plain text).</li>
                    <li>PAN, used to verify your identity before you join groups.</li>
                    <li>Your profile choices, such as sectors and interests.</li>
                    <li>Messages and files you share in groups.</li>
                    <li>For experts: profile photo, government ID, proof documents, credentials and bio.</li>
                    <li>Basic usage data such as which groups you view, so we can suggest relevant ones.</li>
                </ul>
            </LegalSection>

            <LegalSection title="2. How we use it">
                <ul className="list-disc space-y-1 pl-5">
                    <li>To run your account and show you the groups and features you use.</li>
                    <li>To verify users and experts and keep the community safe.</li>
                    <li>To process payments and give you access to paid plans.</li>
                    <li>To suggest groups and improve the platform.</li>
                    <li>To respond when you contact us.</li>
                </ul>
            </LegalSection>

            <LegalSection title="3. Payments">
                <p>
                    Payments are handled by Razorpay. We do not see or store your card, UPI or bank details. We
                    receive only the payment status and an order reference.
                </p>
            </LegalSection>

            <LegalSection title="4. Who can see your information">
                <p>
                    Your name and messages are visible to other members of the groups you join. Your email, mobile
                    number and PAN are never shown to other users. We do not sell your personal information. We
                    share it only with service providers that help us run StockPeer (such as payment and hosting
                    providers), or when the law requires it.
                </p>
            </LegalSection>

            <LegalSection title="5. Cookies">
                <p>
                    We use a cookie to keep you logged in. We do not use advertising cookies.
                </p>
            </LegalSection>

            <LegalSection title="6. Keeping and deleting data">
                <p>
                    We keep your information while your account is active. You can ask us to delete your account
                    and personal data by contacting us. We may keep some records where the law requires it, such
                    as payment records.
                </p>
            </LegalSection>

            <LegalSection title="7. Security">
                <p>
                    We use reasonable safeguards to protect your data, but no system is completely secure. Please
                    keep your password private.
                </p>
            </LegalSection>

            <LegalSection title="8. Contact">
                <p>For any privacy question or request, use the Contact us page.</p>
            </LegalSection>
        </LegalPage>
    );
}