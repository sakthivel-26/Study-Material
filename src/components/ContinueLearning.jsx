import { motion } from "framer-motion";
import { Play, Clock } from "lucide-react";
import { COURSE_PROGRESS } from "../data.js";
import { SectionHeader, ProgressBar, Badge } from "./ui.jsx";
import { useApp } from "../store.jsx";

export default function ContinueLearning() {
  const { pushToast } = useApp();
  return (
    <section>
      <SectionHeader
        title="Continue Learning"
        subtitle="Resume right where you left off"
        icon={<Play size={17} />}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {COURSE_PROGRESS.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="card card-hover overflow-hidden flex flex-col"
          >
            {/* Thumb */}
            <div className={`relative h-28 bg-gradient-to-br ${c.thumb === "🎯" ? "from-sky-500 to-cyan-600" : c.thumb === "🧮" ? "from-violet-500 to-purple-600" : "from-teal-500 to-emerald-600"} flex items-center justify-center`}>
              <div className="absolute inset-0 bg-grid opacity-40" />
              <span className="text-5xl drop-shadow">{c.thumb}</span>
              <span className="absolute top-3 left-3 glass-dark text-white text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1">
                <Clock size={10} /> {c.lessons} lessons
              </span>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <Badge color={c.color}>{c.category}</Badge>
              <h3 className="font-bold text-[15px] text-ink mt-2">{c.title}</h3>
              <div className="mt-3 mb-1.5 flex items-center justify-between text-xs">
                <span className="text-ink-muted font-medium">Course progress</span>
                <span className="font-bold text-brand-700">{c.progress}%</span>
              </div>
              <ProgressBar value={c.progress} color={c.color} />
              <button
                onClick={() => pushToast(`Resuming ${c.title} ▶️`)}
                className="mt-4 btn-primary text-sm py-2.5 w-full"
              >
                <Play size={15} /> Resume
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
