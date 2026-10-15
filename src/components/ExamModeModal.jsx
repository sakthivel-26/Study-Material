import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Sparkles, CheckCircle2, X, Clock, HelpCircle, Layers, ArrowRight } from "lucide-react";

export default function ExamModeModal({ test, onSelectMode, onClose }) {
  const [selectedMode, setSelectedMode] = useState("real"); // "real" | "interactive"

  const totalQuestions = (Array.isArray(test?.questionsList) && test.questionsList.length) || test?.questions || 0;
  const sectionsCount = Array.isArray(test?.sectionsConfig) && test.sectionsConfig.length 
    ? test.sectionsConfig.length 
    : (Array.isArray(test?.sections) ? test.sections.length : 1);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-black/10 overflow-hidden relative"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1B4F72] to-[#2874A6] text-white p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold mb-2">
              <Sparkles size={13} className="text-amber-300" />
              <span>Choose Exam Interface Style</span>
            </div>
            <h2 className="text-xl font-bold">{test?.title || "Mock Test Examination"}</h2>
            <div className="flex items-center gap-4 text-xs text-white/80 mt-2">
              <span className="flex items-center gap-1.5"><HelpCircle size={13} /> {totalQuestions} Questions</span>
              <span className="flex items-center gap-1.5"><Clock size={13} /> {test?.time || `${test?.durationMinutes || 60} min`}</span>
              <span className="flex items-center gap-1.5"><Layers size={13} /> {sectionsCount} {sectionsCount > 1 ? "Sections" : "Section"}</span>
            </div>
          </div>

          {/* Options */}
          <div className="p-6 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Select how you would like to take this exam:
            </p>

            {/* Option 1: Real Exam Interface (CBT Panel) */}
            <div
              onClick={() => setSelectedMode("real")}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedMode === "real"
                  ? "border-[#1B4F72] bg-blue-50/50 shadow-md ring-2 ring-[#1B4F72]/20"
                  : "border-black/10 hover:border-black/20 bg-slate-50/50"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedMode === "real" ? "bg-[#1B4F72] text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  <Monitor size={22} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm text-ink">
                      Real Exam Interface (CBT Mode)
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                    Authentic IBPS / TCS iON exam simulation. Includes official question palette badges, sectional countdown timer, split passage view, candidate photo, and declaration screen.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[11px] font-semibold text-[#1B4F72]">
                    <span className="bg-white px-2 py-0.5 rounded-md border border-[#1B4F72]/20">✓ IBPS / SBI Pattern</span>
                    <span className="bg-white px-2 py-0.5 rounded-md border border-[#1B4F72]/20">✓ Split Passage Layout</span>
                    <span className="bg-white px-2 py-0.5 rounded-md border border-[#1B4F72]/20">✓ Exact Question Palette</span>
                  </div>
                </div>

                <div className="shrink-0 mt-1">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedMode === "real" ? "border-[#1B4F72] bg-[#1B4F72]" : "border-slate-300"
                    }`}
                  >
                    {selectedMode === "real" && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Option 2: Interactive Practice Mode */}
            <div
              onClick={() => setSelectedMode("interactive")}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedMode === "interactive"
                  ? "border-[#1B4F72] bg-blue-50/50 shadow-md ring-2 ring-[#1B4F72]/20"
                  : "border-black/10 hover:border-black/20 bg-slate-50/50"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedMode === "interactive" ? "bg-[#1B4F72] text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  <Sparkles size={22} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm text-ink">
                      Interactive Practice Mode
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      Standard
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                    Ken IAS Academy modern interactive interface. Touch-friendly swipe navigation, fast question jump, and dark/light mode toggle.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[11px] font-semibold text-slate-600">
                    <span className="bg-white px-2 py-0.5 rounded-md border border-black/10">✓ Touch Swipe Support</span>
                    <span className="bg-white px-2 py-0.5 rounded-md border border-black/10">✓ Quick Practice</span>
                  </div>
                </div>

                <div className="shrink-0 mt-1">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedMode === "interactive" ? "border-[#1B4F72] bg-[#1B4F72]" : "border-slate-300"
                    }`}
                  >
                    {selectedMode === "interactive" && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 pt-3 bg-slate-50 border-t border-black/5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-black/10 text-xs font-bold text-ink-soft hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSelectMode(selectedMode)}
              className="btn-primary text-xs px-6 py-2.5 bg-[#1B4F72] hover:bg-[#153e5b] text-white font-bold rounded-xl flex items-center gap-2 shadow-md"
            >
              <span>Continue to Exam</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
