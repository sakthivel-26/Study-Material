import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Play, Clock, HelpCircle, TrendingUp } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { SectionHeader } from "../components/ui.jsx";
import { useApp } from "../store.jsx";
import MockTestRunner from "../components/MockTestRunner.jsx";

export default function MockTestsPage() {
  const { mockTests, testHistory } = useApp();
  const [activeTest, setActiveTest] = useState(null);

  return (
    <>
      <PageHeader icon={<ClipboardList size={22} />} title="Mock Tests" subtitle="Practice tests with real exam pattern & instant AI solutions" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {mockTests.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card card-hover p-5 flex flex-col"
            style={{ borderTop: `4px solid ${t.color}` }}
          >
            <span className="chip self-start mb-3" style={{ background: `${t.color}1A`, color: t.color }}>{t.category}</span>
            <h3 className="font-bold text-ink mb-2">{t.title}</h3>
            <div className="flex items-center gap-4 text-xs text-ink-muted mb-4">
              <span className="flex items-center gap-1"><HelpCircle size={13} /> {t.questions} Qs</span>
              <span className="flex items-center gap-1"><Clock size={13} /> {t.time}</span>
              <span className="flex items-center gap-1"><TrendingUp size={13} /> {t.taken?.toLocaleString()} taken</span>
            </div>
            <button onClick={() => setActiveTest(t)} className="btn-primary mt-auto text-sm py-2.5">
              <Play size={15} /> Start Test
            </button>
          </motion.div>
        ))}
      </div>

      {/* Interactive CBT Exam Portal Modal */}
      {activeTest && (
        <MockTestRunner test={activeTest} onClose={() => setActiveTest(null)} />
      )}
    </>
  );
}
