import HeroBanner from "../components/HeroBanner.jsx";
import CourseCatalog from "../components/CourseCatalog.jsx";
import { RightSidebar } from "../components/RightSidebar.jsx";
import { useApp } from "../store.jsx";
import { Clock, Play, HelpCircle, TrendingUp, Zap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function FeaturedFreeMocks() {
  const { mockTests } = useApp();
  const navigate = useNavigate();
  // Get top 3 free tests
  const freeTests = mockTests.filter(t => t.isFree === true).slice(0, 3);

  if (freeTests.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-extrabold text-ink flex items-center gap-2">
            <Zap size={20} className="text-amber-500" /> Free Mock Tests
          </h2>
          <p className="text-sm text-ink-muted mt-0.5">Start practicing immediately for free.</p>
        </div>
        <button onClick={() => navigate("/free-mocks")} className="btn-ghost text-sm text-brand-700 font-semibold px-3 py-1.5">
          View All <ArrowRight size={16} />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {freeTests.map((t, i) => (
          <motion.div 
            key={t.id} 
            initial={{ opacity: 0, y: 14 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.06 }} 
            className="card card-hover p-4 flex flex-col cursor-pointer" 
            style={{ borderTop: `3px solid ${t.color}` }}
            onClick={() => navigate("/free-mocks")}
          >
            <div className="flex justify-between gap-2 mb-1">
              <span className="chip self-start" style={{ background: `${t.color}1A`, color: t.color }}>
                {t.category}
              </span>
              <span className="chip bg-amber-50 text-amber-700">
                <Zap size={12} className="text-amber-500" /> Free
              </span>
            </div>
            
            <h3 className="font-bold text-ink text-sm mb-2">{t.title}</h3>
            <div className="flex items-center gap-3 text-[11px] text-ink-muted mb-4">
              <span className="flex items-center gap-1"><HelpCircle size={12} /> {t.questions} Qs</span>
              <span className="flex items-center gap-1"><Clock size={12} /> {t.time}</span>
            </div>
            <button className="mt-auto text-xs py-2 btn-primary bg-amber-500 hover:bg-amber-600 border-none text-white w-full">
              <Play size={14} /> Start Free Test
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default function StudentDashboard() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
      <div className="min-w-0 space-y-8">
        <HeroBanner />
        <FeaturedFreeMocks />
        <CourseCatalog compact />
      </div>
      <aside className="hidden xl:block"><div className="sticky top-[88px]"><RightSidebar /></div></aside>
    </div>
  );
}
