import type { Metadata } from "next";
import LegalPage, { LegalSection } from "@/features/landing/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Service · StockPeer" };

export default function TermsPage() {
    return (
        <LegalPage
            title="Terms of Service"
            updated="18 November 2026"
            intro="By creating an account or using StockPeer you agree to these terms. Please read them carefully."
        >
            <LegalSection title="1. What StockPeer is">
                <p>
                    StockPeer is a discussion platform where people can join groups for specific companies, chat
                    with other members, and read views shared by verified experts. It is not a broker, an
                    exchange, or an investment adviser.
                </p>
            </LegalSection>

            <LegalSection title="2. No investment advice">
                <p>
                    Everything shared on StockPeer, including messages from experts, is for education and
                    discussion only. Nothing on the platform is a recommendation to buy, sell or hold any
                    security. You are responsible for your own investment decisions. See our Disclaimer for more.
                </p>
            </LegalSection>

            <LegalSection title="3. Your account">
                <p>
                    You must provide accurate information and keep your login details private. You are
                    responsible for activity on your account. We may ask you to verify your PAN before you can
                    join groups.
                </p>
            </LegalSection>

            <LegalSection title="4. Community rules">
                <p>You agree not to:</p>
                <ul className="list-disc space-y-1 pl-5">
                    <li>post spam, advertisements, or promote tips for payment</li>
                    <li>manipulate markets, spread rumours, or encourage pump-and-dump schemes</li>
                    <li>harass, threaten or impersonate other people</li>
                    <li>upload illegal files or files that contain malware</li>
                    <li>share personal or financial details of other people</li>
                </ul>
                <p>We may remove content or suspend accounts that break these rules.</p>
            </LegalSection>

            <LegalSection title="5. Experts">
                <p>
                    Experts are reviewed by our team using the documents they submit. Verification does not mean
                    we endorse an expert or guarantee the quality of their views. Experts are independent and are
                    not employees of StockPeer.
                </p>
            </LegalSection>

            <LegalSection title="6. Paid plans">
                <p>
                    Premium and Elite plans are paid in advance for the period you choose. Payments are processed
                    by Razorpay. Prices include GST. Refunds are covered in our Refund Policy.
                </p>
            </LegalSection>

            <LegalSection title="7. Your content">
                <p>
                    You own what you post, but you give StockPeer permission to store and display it on the
                    platform so the service can work. You promise that you have the right to share it.
                </p>
            </LegalSection>

            <LegalSection title="8. Availability and liability">
                <p>
                    We try to keep StockPeer running, but we do not promise it will always be available or free of
                    errors. To the extent allowed by law, StockPeer is not liable for any loss, including trading
                    losses, that results from using the platform or relying on content shared on it.
                </p>
            </LegalSection>

            <LegalSection title="9. Changes and contact">
                <p>
                    We may update these terms from time to time. Continuing to use StockPeer after a change means
                    you accept it. Questions? Use the Contact us page.
                </p>
            </LegalSection>
        </LegalPage>
    );
}