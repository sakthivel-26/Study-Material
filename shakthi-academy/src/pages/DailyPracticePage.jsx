import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Play, Calculator, Sigma } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import MockTestRunner from "../components/MockTestRunner.jsx";
import { generateSimplificationSet, generateApproximationSet } from "../utils/speedMathGenerator.js";

const SPEED_MOCKS = [
  {
    id: "simplification",
    title: "Simplification Master",
    description: "30 rapid-fire simplification questions (BODMAS, fractions, percentages). Fresh questions generated every time.",
    icon: Calculator,
    color: "#8B5CF6",
    generator: generateSimplificationSet,
  },
  {
    id: "approximation",
    title: "Approximation Challenge",
    description: "30 decimal approximation questions. Round off to the nearest integer and solve quickly.",
    icon: Sigma,
    color: "#F59E0B",
    generator: generateApproximationSet,
  },
];

export default function DailyPracticePage() {
  const [activeTest, setActiveTest] = useState(null);

  const startSpeedMock = (mockType) => {
    // Generate 30 fresh questions on the fly
    const questionsList = mockType.generator(30);

    // Structure it exactly like a standard mock test
    const speedMock = {
      id: `speed_mock_${mockType.id}_${Date.now()}`,
      title: `${mockType.title} - Speed Test`,
      category: "Speed Math",
      questions: 30,
      time: "15 min",
      durationMinutes: 15,
      questionsList,
      color: mockType.color,
    };

    setActiveTest(speedMock);
  };

  return (
    <>
      <PageHeader icon={<Zap size={22} />} title="Speed Math Practice" subtitle="Generate unlimited 30-question mock tests to build calculation speed" />

      <div className="grid md:grid-cols-2 gap-6">
        {SPEED_MOCKS.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-6 flex flex-col h-full"
            style={{ borderTop: `4px solid ${m.color}` }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-4" style={{ background: m.color }}>
              <m.icon size={28} />
            </div>
            <h3 className="font-bold text-xl text-ink mb-2">{m.title}</h3>
            <p className="text-sm text-ink-muted mb-6 flex-1">{m.description}</p>
            
            <button 
              onClick={() => startSpeedMock(m)}
              className="btn text-white w-full py-3 shadow-md hover:shadow-lg transition-all"
              style={{ background: m.color }}
            >
              <Play size={18} /> Start 30 Qs Timer
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
