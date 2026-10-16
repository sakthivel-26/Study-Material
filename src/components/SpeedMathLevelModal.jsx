import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Shield, Flame, Check, Play, Clock, HelpCircle, Loader2 } from "lucide-react";

const LEVELS = [
  {
    id: "easy",
    label: "Easy Level",
    subtitle: "Speed Foundation & Quick Drills",
    description: "Basic squares (10²-30²), simple roots (up to √900), clean divisions & direct fractions.",
    badge: "Beginner Friendly",
    timeTarget: "~20s per question",
    color: "#059669",
    bgLight: "bg-emerald-50",
    borderActive: "border-emerald-500",
    icon: Shield,
  },
  {
    id: "medium",
    label: "Medium Level",
    subtitle: "Exam Prelims Standard (SBI / IBPS / SSC)",
    description: "Standard exam speed: squares up to 60², roots up to √3600, cubes, mixed BODMAS & fractions.",
    badge: "Recommended",
    timeTarget: "~30s per question",
    color: "#2563EB",
    bgLight: "bg-blue-50",
    borderActive: "border-blue-500",
    isDefault: true,
    icon: Zap,
  },
  {
    id: "hard",
    label: "Hard Level",
    subtitle: "Exam Mains / Tough Master (PO & RBI)",
    description: "High 2-digit squares (up to 99²), 4-digit roots (up to √9801), cubes, compound numerators/denominators.",
    badge: "Maximum Challenge",
    timeTarget: "~45s per question",
    color: "#DC2626",
    bgLight: "bg-rose-50",
    borderActive: "border-rose-500",
    icon: Flame,
  },
];

export default function SpeedMathLevelModal({ open, onClose, drill, onSelectLevel, generating }) {
  if (!open || !drill) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div 
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm"
                style={{ background: drill.color || "#2563EB" }}
              >
                <Zap size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg leading-snug">
                  {drill.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Select your calculation difficulty level
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={generating}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200/60 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Level Cards */}
          <div className="p-6 space-y-3.5">
            {LEVELS.map((lvl) => {
              const IconComponent = lvl.icon;
              return (
                <div
                  key={lvl.id}
                  onClick={() => !generating && onSelectLevel(drill, lvl.id)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 hover:shadow-md ${
                    lvl.isDefault
                      ? "border-blue-500 bg-blue-50/30 hover:bg-blue-50/60"
                      : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50"
                  } ${generating ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5"
                    style={{ background: lvl.color }}
                  >
                    <IconComponent size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-800">
                          {lvl.label}
                        </span>
                        {lvl.badge && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                            style={{ background: `${lvl.color}18`, color: lvl.color }}
                          >
                            {lvl.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 shrink-0">
                        {lvl.timeTarget}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed mb-1">
                      {lvl.description}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <HelpCircle size={11} /> 30 Unique Questions
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> 15 Mins Speed Timer
                      </span>
                    </div>
                  </div>

                  <button
                    disabled={generating}
                    className="self-center px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm hover:shadow transition shrink-0 flex items-center gap-1.5"
                    style={{ background: lvl.color }}
                  >
                    {generating === lvl.id ? (
                      <>
                        <Loader2 size={13} className="animate-spin" /> Starting...
                      </>
                    ) : (
                      <>
                        <Play size={13} /> Start
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>✨ 30 brand new unique questions generated on every attempt.</span>
            <button
              onClick={onClose}
              disabled={generating}
              className="font-semibold text-slate-600 hover:text-slate-800 text-xs px-2 py-1 rounded"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
