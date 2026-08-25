import HeroBanner from "../components/HeroBanner.jsx";
import CourseCatalog from "../components/CourseCatalog.jsx";
import { RightSidebar } from "../components/RightSidebar.jsx";
import { useApp } from "../store.jsx";
import { Clock, Play, HelpCircle, TrendingUp, Zap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";



export default function StudentDashboard() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
      <div className="min-w-0 space-y-8">
        <HeroBanner />
        <CourseCatalog compact />
      </div>
      <aside className="hidden xl:block"><div className="sticky top-[88px]"><RightSidebar /></div></aside>
    </div>
  );
}
