import { useState } from "react";
import HeroBanner from "../components/HeroBanner.jsx";
import CourseCatalog from "../components/CourseCatalog.jsx";
import { RightSidebar } from "../components/RightSidebar.jsx";
import { useApp } from "../store.jsx";
import { Clock, Play, HelpCircle, TrendingUp, Zap, ArrowRight, Sparkles, Divide, Calculator, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail } from "lucide-react";
import MockTestRunner from "../components/MockTestRunner.jsx";
import { generateAIMockTest } from "../utils/aiTestGenerator.js";

function FeaturedFreeMocks() {
  const { mockTests } = useApp();
  const navigate = useNavigate();
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
        <button onClick={() => navigate("/free-mocks")} className="btn-ghost text-sm text-brand-700 font-semibold px-3 py-1.5 flex items-center gap-1">
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

const DASHBOARD_SPEED_DRILLS = [
  {
    id: "squares_cubes",
    title: "Tough Squares & Cubes",
    category: "Speed Math (Squares & Cubes)",
    badge: "Powers & Differences",
    sample: "(43² - 29²) ÷ 16 + 15² = ?",
    icon: Sparkles,
    color: "#2563EB",
  },
  {
    id: "roots",
    title: "4-Digit Roots & Radicals",
    category: "Speed Math (Roots & Radicals)",
    badge: "Square & Cube Roots",
    sample: "√5184 + √2704 - √1764 = ?",
    icon: Zap,
    color: "#059669",
  },
  {
    id: "fractions",
    title: "Numerator & Denominator",
    category: "Speed Math (Numerator & Denominator)",
    badge: "Rational Fractions",
    sample: "(3/7) × 441 + [(38² - 22²) ÷ 32] = ?",
    icon: Divide,
    color: "#DB2777",
  },
  {
    id: "simplification",
    title: "Tough Simplification Master",
    category: "Speed Math (Simplification)",
    badge: "Bank Exam Speed",
    sample: "[(43² - 29²) ÷ 16] + √5184 ÷ 12 = ?",
    icon: Calculator,
    color: "#7C3AED",
  },
];

function SpeedMathDashboardSection({ onStartDrill, generatingId }) {
  const navigate = useNavigate();

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-extrabold text-ink flex items-center gap-2">
            <Zap size={20} className="text-brand-600" /> Speed Math Arena (Tough Calculation Drills)
          </h2>
          <p className="text-sm text-ink-muted mt-0.5">High-speed calculation: Tough Squares, Cubes, 4-digit Roots & Numerator/Denominator Fractions.</p>
        </div>
        <button onClick={() => navigate("/daily-practice")} className="btn-ghost text-sm text-brand-700 font-semibold px-3 py-1.5 flex items-center gap-1">
          View All <ArrowRight size={16} />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {DASHBOARD_SPEED_DRILLS.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card p-4 flex flex-col bg-white border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all rounded-2xl"
            style={{ borderTop: `3px solid ${d.color}` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: d.color }}>
                <d.icon size={18} />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ background: `${d.color}15`, color: d.color }}>
                {d.badge}
              </span>
            </div>

            <h3 className="font-extrabold text-ink text-sm mb-1.5">{d.title}</h3>

            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 my-1.5 text-[11px] font-mono font-semibold text-slate-700 leading-tight">
              {d.sample}
            </div>

            <p className="text-[11px] text-slate-500 mb-4 mt-1 flex-1">
              30 rapid questions · 15 mins
            </p>

            <button
              onClick={() => onStartDrill(d)}
              disabled={generatingId !== null}
              className={`w-full py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 ${generatingId ? "opacity-75 cursor-not-allowed" : ""}`}
              style={{ background: d.color }}
            >
              {generatingId === d.id ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Play size={13} /> Start 30 Qs Drill
                </>
              )}
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default function StudentDashboard() {
  const [activeTest, setActiveTest] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const { pushToast } = useApp();

  const handleStartDrill = async (drill) => {
    setGeneratingId(drill.id);
    try {
      const res = await generateAIMockTest({
        category: drill.category,
        questionsCount: 30,
        timeLimit: "15 min"
      });

      const speedMock = {
        id: `speed_mock_${drill.id}_${Date.now()}`,
        title: `${drill.title} - Speed Drill`,
        category: "Speed Math",
        questions: res.questionsList.length || 30,
        time: "15 min",
        durationMinutes: 15,
        questionsList: res.questionsList,
        color: drill.color,
      };

      setActiveTest(speedMock);
    } catch (err) {
      pushToast("Failed to generate questions. Please try again.", "error");
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
      <div className="min-w-0 space-y-8">
        <HeroBanner />
        <SpeedMathDashboardSection onStartDrill={handleStartDrill} generatingId={generatingId} />
        <FeaturedFreeMocks />
        <CourseCatalog compact />
        <div className="mt-12 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <a 
            href="https://maps.app.goo.gl/Md5dth47WfXubmm3A" 
            target="_blank" 
            rel="noreferrer"
            className="block p-5 rounded-2xl bg-white border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-4 text-ink-muted group-hover:text-brand-700">
              <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-brand-50 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin size={20} />
              </div>
              <div>
                <h4 className="font-bold text-ink group-hover:text-brand-900 mb-1">Visit Our Academy</h4>
                <p className="text-sm leading-relaxed">4c, opposite govt girls hr sec school, PTV Colony, Thiruvalluvar Nagar, Krishnagiri, Tamil Nadu 635001</p>
              </div>
            </div>
          </a>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-center">
            <div className="flex items-center gap-4 text-ink-muted mb-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <Phone size={20} />
              </div>
              <div>
                <h4 className="font-bold text-ink mb-0.5">Contact Us</h4>
                <p className="text-sm">Call or email us for inquiries</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 ml-[3.5rem]">
              <div className="flex items-center gap-3">
                <a href="tel:7530015494" className="text-sm font-semibold text-brand-700 hover:underline">
                  7530015494
                </a>
                <span className="text-slate-300">|</span>
                <a href="tel:7530015495" className="text-sm font-semibold text-brand-700 hover:underline">
                  7530015495
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail size={14} className="text-ink-muted" />
                <a href="mailto:kenacademy7@gmail.com" className="font-medium text-ink hover:text-brand-700 hover:underline">
                  kenacademy7@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <aside className="hidden xl:block"><div className="sticky top-[88px]"><RightSidebar /></div></aside>

      {activeTest && (
        <MockTestRunner test={activeTest} onClose={() => setActiveTest(null)} />
      )}
    </div>
  );
}
