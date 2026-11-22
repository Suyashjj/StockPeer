import LandingShell from "@/features/landing/components/LandingShell";
import LandingNavbar from "@/features/landing/components/LandingNavbar";
import Hero from "@/features/landing/components/Hero";
import PopularGroups from "@/features/landing/components/PopularGroups";
import HowItWorks from "@/features/landing/components/HowItWorks";
import SectorExplorer from "@/features/landing/components/SectorExplorer";
import ExpertStrip from "@/features/landing/components/ExpertStrip";
import LandingFooter from "@/features/landing/components/LandingFooter";

export default function HomePage() {
    return (
        <LandingShell>
            <main className="min-h-screen bg-paper font-sans text-ink">
                <LandingNavbar />
                <Hero />
                <PopularGroups />
                <HowItWorks />
                <SectorExplorer />
                <ExpertStrip />
                <LandingFooter />
            </main>
        </LandingShell>
    );
}