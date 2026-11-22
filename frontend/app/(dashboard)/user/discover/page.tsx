import PageTitle from "@/features/user/components/PageTitle";
import Discover from "@/features/user/groups/Discover";

export default function DiscoverPage() {
    return (
        <div className="space-y-6">
            <PageTitle
                title="Discover"
                subtitle="Search any listed stock and join its group to discuss."
            />
            <Discover />
        </div>
    );
}