import HeroBanner from "../components/HeroBanner.jsx";
import CategoryGrid from "../components/CategoryGrid.jsx";
import RecentUploads from "../components/RecentUploads.jsx";
import ContinueLearning from "../components/ContinueLearning.jsx";
import { RightSidebar } from "../components/RightSidebar.jsx";

export default function StudentDashboard() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
      <div className="min-w-0 space-y-8">
        <HeroBanner />
        <CategoryGrid />
        <ContinueLearning />
        <RecentUploads />
      </div>
      <aside className="hidden xl:block">
        <div className="sticky top-[88px]">
          <RightSidebar />
        </div>
      </aside>
    </div>
  );
}
