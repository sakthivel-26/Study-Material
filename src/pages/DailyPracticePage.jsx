import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Play, Calculator, Sigma, Loader2, Sparkles, Divide, CheckCircle2 } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import MockTestRunner from "../components/MockTestRunner.jsx";
import { generateAIMockTest } from "../utils/aiTestGenerator.js";
import { useApp } from "../store.jsx";

const SPEED_MOCKS = [
  {
    id: "squares_cubes",
    title: "Tough Squares & Cubes",
    category: "Speed Math (Squares & Cubes)",
    badge: "Powers & Differences",
    sampleEq: "(43² - 29²) ÷ 16 + 15² = ?",
    description: "30 rapid-fire questions on 2-digit squares (15² to 99²), cubes (11³ to 35³), and difference of squares equations.",
    icon: Sparkles,
    color: "#2563EB",
  },
  {
    id: "roots",
    title: "Square & Cube Roots",
    category: "Speed Math (Roots & Radicals)",
    badge: "Radicals & Powers",
    sampleEq: "√5184 + √2704 - √1764 = ?",
    description: "30 tough speed questions on 4-digit square roots (up to √9216) and cube roots (up to ∛24389) combined with algebra.",
    icon: Zap,
    color: "#059669",
  },
  {
    id: "fractions",
    title: "Numerator & Denominator (Fractions)",
    category: "Speed Math (Numerator & Denominator)",
    badge: "Rational Expressions",
    sampleEq: "(3/7) × 441 + [(38² - 22²) ÷ 32] = ?",
    description: "30 questions featuring rational fraction cancellations, mixed fractions, compound numerators, and percentage fractions.",
    icon: Divide,
    color: "#DB2777",
  },
  {
    id: "simplification",
    title: "Tough Simplification Master",
    category: "Speed Math (Simplification)",
    badge: "Comprehensive Exam Drill",
    sampleEq: "[(43² - 29²) ÷ 16] + √5184 ÷ 12 + (3/7) × 441 = ?",
    description: "30 high-difficulty Indian Banking exam questions combining Squares, Cubes, Roots, Fractions, and BODMAS.",
    icon: Calculator,
    color: "#7C3AED",
  },
  {
    id: "approximation",
    title: "Approximation Challenge",
    category: "Speed Math (Approximation)",
    badge: "Decimal Roundoffs",
    sampleEq: "√1520.89 + [(37.99)² - (21.98)²] ÷ 31.98 ≈ ?",
    description: "30 rapid decimal approximation questions with roots, square powers, and percentage shortcuts.",
    icon: Sigma,
    color: "#D97706",
  },
];

export default function DailyPracticePage() {
  const [activeTest, setActiveTest] = useState(null);
  const [generating, setGenerating] = useState(false);
  const { pushToast } = useApp();

  const startSpeedMock = async (mockType) => {
    setGenerating(mockType.id);
    try {
      const res = await generateAIMockTest({ 
        category: mockType.category, 
        questionsCount: 30, 
        timeLimit: "15 min" 
      });
      
      const speedMock = {
        id: `speed_mock_${mockType.id}_${Date.now()}`,
        title: `${mockType.title} - Speed Drill`,
        category: "Speed Math",
        questions: res.questionsList.length || 30,
        time: "15 min",
        durationMinutes: 15,
        questionsList: res.questionsList,
        color: mockType.color,
      };

      setActiveTest(speedMock);
    } catch (err) {
      pushToast("Failed to generate questions. Please try again.", "error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <PageHeader 
        icon={<Zap size={22} />} 
        title="Speed Math Arena" 
        subtitle="High-speed mental calculation drills: Tough Squares, Cubes, 4-digit Roots & Fraction Numerator/Denominator" 
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SPEED_MOCKS.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card p-5 flex flex-col h-full bg-white border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all rounded-2xl"
            style={{ borderTop: `4px solid ${m.color}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ background: m.color }}>
                <m.icon size={24} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider" style={{ background: `${m.color}15`, color: m.color }}>
                {m.badge}
              </span>
            </div>

            <h3 className="font-extrabold text-lg text-slate-800 mb-1">{m.title}</h3>
            
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 my-2 text-xs font-mono font-semibold text-slate-700">
              {m.sampleEq}
            </div>

            <p className="text-xs text-slate-500 mb-5 flex-1 leading-relaxed">{m.description}</p>
            
            <button 
              onClick={() => startSpeedMock(m)}
              disabled={generating !== false}
              className={`btn text-white w-full py-2.5 rounded-xl font-bold text-sm shadow hover:shadow-md transition-all flex items-center justify-center gap-2 ${generating ? "opacity-70 cursor-not-allowed" : ""}`}
              style={{ background: m.color }}
            >
              {generating === m.id ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Generating Tough Questions...
                </>
              ) : (
                <>
                  <Play size={16} /> Start 30 Qs Drill (15 Min)
                </>
              )}
            </button>
          </motion.div>
        ))}
      </div>

      {activeTest && (
        <MockTestRunner test={activeTest} onClose={() => setActiveTest(null)} />
      )}
    </>
  );
}
