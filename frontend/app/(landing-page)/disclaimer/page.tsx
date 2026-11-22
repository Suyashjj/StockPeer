import type { Metadata } from "next";
import LegalPage, { LegalSection } from "@/features/landing/components/LegalPage";

export const metadata: Metadata = { title: "Disclaimer · StockPeer" };

export default function DisclaimerPage() {
    return (
        <LegalPage
            title="Disclaimer"
            updated="18 November 2026"
            intro="StockPeer is a discussion platform. Please read this before relying on anything you see here."
        >
            <LegalSection title="Not investment advice">
                <p>
                    Content on StockPeer, including messages from other members and from experts, is for
                    education and discussion only. It is not investment, tax, legal or financial advice, and it is
                    not an offer or recommendation to buy or sell any security.
                </p>
            </LegalSection>

            <LegalSection title="Experts">
                <p>
                    Experts share their own views and educational content. Verification of an expert means our
                    team checked the documents they submitted. It does not mean StockPeer endorses their opinions
                    or guarantees any result.
                </p>
            </LegalSection>

            <LegalSection title="Investment risk">
                <p>
                    Investing in securities is subject to market risk, and you can lose money. Past performance
                    does not guarantee future results. Do your own research or speak to a registered adviser
                    before you invest.
                </p>
            </LegalSection>

            <LegalSection title="Accuracy">
                <p>
                    Members and experts post their own content. We do not check every message and cannot promise
                    that it is accurate, complete or up to date.
                </p>
            </LegalSection>
        </LegalPage>
    );
}