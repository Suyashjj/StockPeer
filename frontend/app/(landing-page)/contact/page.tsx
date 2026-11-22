import type { Metadata } from "next";
import LegalPage, { LegalSection } from "@/features/landing/components/LegalPage";
import ContactActions from "./ContactActions";

export const metadata: Metadata = { title: "Contact us · StockPeer" };

export default function ContactPage() {
    return (
        <LegalPage
            title="Contact us"
            intro="Questions about your account, a payment, or becoming an expert? Send us an email and we will get back to you."
        >
            <ContactActions />

            <LegalSection title="What to include">
                <p>
                    To help us reply faster, include the email you signed up with, and for payment queries the
                    date and amount of the payment.
                </p>
            </LegalSection>

            <LegalSection title="Response time">
                <p>We usually reply within 2 working days.</p>
            </LegalSection>
        </LegalPage>
    );
}