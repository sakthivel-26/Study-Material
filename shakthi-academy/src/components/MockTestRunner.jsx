import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, HelpCircle, CheckCircle2, XCircle, AlertCircle, Bookmark, Award, RotateCcw, ChevronLeft, ChevronRight, Send, X, Eye } from "lucide-react";
import { useApp } from "../store.jsx";

export default function MockTestRunner({ test, onClose }) {
  const { pushToast } = useApp();

  // Test state
  // Preserve every option supplied by the PDF: some competitive exams use 4, 5, or 6 choices.
  const questions = test?.questionsList || [];
  const totalDurationSeconds = (test?.durationMinutes || parseInt(test?.time) || 30) * 60;
  const [timeLeft, setTimeLeft] = useState(totalDurationSeconds);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [qId]: optionIndex }
  const [status, setStatus] = useState({}); // { [qId]: "answered" | "not_answered" | "review" }
  const [visited, setVisited] = useState({ 0: true });

  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [solutionFilter, setSolutionFilter] = useState("all");

  const currentQ = questions[currentIndex] || {};

  // Countdown Timer
  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  // Mark visited
  useEffect(() => {
    setVisited((prev) => ({ ...prev, [currentIndex]: true }));
    if (!answers[currentQ.id] && !status[currentQ.id]) {
      setStatus((prev) => ({ ...prev, [currentQ.id]: "not_answered" }));
    }
  }, [currentIndex]);

  const selectOption = (optIndex) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optIndex }));
  };

  const clearResponse = () => {
    if (submitted) return;
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
    setStatus((prev) => ({ ...prev, [currentQ.id]: "not_answered" }));
  };

  const markForReview = () => {
    if (submitted) return;
    setStatus((prev) => ({ ...prev, [currentQ.id]: "review" }));
    goNext();
  };

  const saveAndNext = () => {
    if (submitted) return;
    if (answers[currentQ.id] !== undefined) {
      setStatus((prev) => ({ ...prev, [currentQ.id]: "answered" }));
    } else {
      setStatus((prev) => ({ ...prev, [currentQ.id]: "not_answered" }));
    }
    goNext();
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmitTest = () => {
    setConfirmSubmit(false);
    
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    questions.forEach((q) => {
      const studentAns = answers[q.id];
      if (studentAns === undefined) {
        unattemptedCount++;
      } else if (studentAns === q.correctAnswerIndex) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const totalQs = questions.length || 1;
    // Standard IBPS Marking: +1 correct, -0.25 negative
    const score = Math.max(0, +(correctCount - incorrectCount * 0.25).toFixed(2));
    const accuracy = Math.round((correctCount / (correctCount + incorrectCount || 1)) * 100);
    const percent = Math.round((correctCount / totalQs) * 100);
    const timeSpentSeconds = totalDurationSeconds - timeLeft;

    const res = {
      score,
      totalMarks: totalQs,
      correctCount,
      incorrectCount,
      unattemptedCount,
      accuracy,
      percent,
      timeSpentSeconds,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    };

    setResults(res);
    setSubmitted(true);
    pushToast(`Test Submitted! Score: ${score}/${totalQs} 🎉`);
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Section list
  const sections = Array.from(new Set(questions.map((q) => q.section || "General")));

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Header Bar */}
      <header className="h-16 bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center font-bold text-white shadow">
            KEN
          </span>
          <div>
            <h2 className="font-bold text-sm text-white truncate max-w-xs sm:max-w-md">{test?.title || "Online CBT Exam"}</h2>
            <p className="text-[11px] text-slate-400">{test?.category} · Official CBT Exam Pattern</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!submitted && (
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-sm font-bold transition-all ${timeLeft < 300 ? "bg-rose-950/80 border-rose-600 text-rose-300 animate-pulse" : "bg-slate-900 border-slate-700 text-amber-400"}`}>
              <Clock size={16} />
              <span>Time Left: {formatTimer(timeLeft)}</span>
            </div>
          )}

          {!submitted ? (
            <button onClick={() => setConfirmSubmit(true)} className="btn-primary text-xs px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white">
              <Send size={14} /> Submit Test
            </button>
          ) : (
            <button onClick={onClose} className="btn-soft text-xs px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white">
              <X size={14} /> Exit Test
            </button>
          )}
        </div>
      </header>

      {/* Main Exam Interface */}
      {!submitted ? (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left / Main Question Area */}
          <div className="flex-1 flex flex-col bg-slate-900 overflow-y-auto">
            {/* Section Switcher Tabs */}
            {sections.length > 1 && (
              <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 text-xs overflow-x-auto shrink-0">
                <span className="text-slate-400 font-medium mr-2">Sections:</span>
                {sections.map((sec) => (
                  <span
                    key={sec}
                    className={`px-3 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${currentQ.section === sec ? "bg-brand-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
                  >
                    {sec}
                  </span>
                ))}
              </div>
            )}

            {/* Question Details Header */}
            <div className="px-6 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Question {currentIndex + 1}</span>
                <span>of {questions.length}</span>
                <span className="chip bg-brand-950/80 text-brand-400 border border-brand-800/50">{currentQ.section || "General"}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-medium">+1.0 Mark</span>
                <span className="text-rose-400 font-medium">-0.25 Negative</span>
              </div>
            </div>

            {/* Question Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-4xl">
              <p className="text-slate-100 font-semibold text-base leading-relaxed whitespace-pre-line">
                {currentQ.question}
              </p>

              {/* Options List */}
              <div className="space-y-3 pt-2">
                {currentQ.options?.map((opt, optIdx) => {
                  const isSelected = answers[currentQ.id] === optIdx;
                  return (
                    <div
                      key={optIdx}
                      onClick={() => selectOption(optIdx)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${isSelected ? "bg-brand-950/70 border-brand-500 text-white shadow-card" : "bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950/80"}`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${isSelected ? "bg-brand-600 text-white" : "bg-slate-800 text-slate-400"}`}>
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="text-sm font-medium leading-relaxed">{opt}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Bar Footer */}
            <div className="h-16 px-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={clearResponse} className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300">
                  Clear Response
                </button>
                <button onClick={markForReview} className="px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 hover:bg-purple-900 text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                  <Bookmark size={13} /> Mark for Review & Next
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={goPrev} disabled={currentIndex === 0} className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-40 text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <ChevronLeft size={15} /> Previous
                </button>
                <button onClick={saveAndNext} className="btn-primary text-xs px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center gap-1">
                  Save & Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Question Palette Drawer */}
          <div className="w-full md:w-80 bg-slate-950 border-l border-slate-800 p-5 flex flex-col shrink-0">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Question Palette</h3>

            {/* Question Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-5 gap-2 pr-1 max-h-[50vh] md:max-h-none">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAns = answers[q.id] !== undefined;
                const isRev = status[q.id] === "review";
                const isNotAns = status[q.id] === "not_answered" && !isAns;

                let statusBg = "bg-slate-900 text-slate-400 border-slate-800";
                if (isRev) statusBg = "bg-purple-600 text-white border-purple-500";
                else if (isAns) statusBg = "bg-emerald-600 text-white border-emerald-500";
                else if (isNotAns) statusBg = "bg-rose-600 text-white border-rose-500";

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl font-bold text-xs border transition-all flex items-center justify-center relative ${statusBg} ${isCurrent ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950" : ""}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-4 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded bg-emerald-600 shrink-0"/> Answered</div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded bg-rose-600 shrink-0"/> Not Answered</div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded bg-purple-600 shrink-0"/> Marked for Review</div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-800 shrink-0"/> Not Visited</div>
            </div>
          </div>
        </div>
      ) : (
        /* Results & Detailed Solutions View */
        <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8">
          {/* Score Header Card */}
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-3xl bg-slate-950 border border-slate-800 p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 text-center md:text-left">
                <span className="chip bg-brand-950 border border-brand-800 text-brand-300 font-semibold">{test?.category} Exam Report</span>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white">{test?.title}</h1>
                <p className="text-sm text-slate-400">Submitted on {results?.date} · Time Taken: {formatTimer(results?.timeSpentSeconds || 0)}</p>
              </div>

              <div className="flex items-center gap-6 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-medium">Final Score</p>
                  <p className="text-3xl font-extrabold text-amber-400">{results?.score} <span className="text-sm text-slate-500">/ {results?.totalMarks}</span></p>
                </div>
                <div className="w-px h-10 bg-slate-800"/>
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-medium">Accuracy</p>
                  <p className="text-3xl font-extrabold text-emerald-400">{results?.accuracy}%</p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800/80 text-center">
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                <p className="text-xl font-bold text-emerald-400">{results?.correctCount}</p>
                <p className="text-[11px] text-emerald-300">Correct</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40">
                <p className="text-xl font-bold text-rose-400">{results?.incorrectCount}</p>
                <p className="text-[11px] text-rose-300">Incorrect</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <p className="text-xl font-bold text-slate-400">{results?.unattemptedCount}</p>
                <p className="text-[11px] text-slate-400">Unattempted</p>
              </div>
            </div>
          </motion.div>

          {/* Solution Explorer */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                <Eye size={20} className="text-brand-400" /> Detailed Question Solutions
              </h3>
              <div className="flex gap-2">
                {["all", "correct", "incorrect", "unattempted"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setSolutionFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${solutionFilter === f ? "bg-brand-600 text-white" : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {questions
                .filter((q) => {
                  const studentAns = answers[q.id];
                  if (solutionFilter === "correct") return studentAns === q.correctAnswerIndex;
                  if (solutionFilter === "incorrect") return studentAns !== undefined && studentAns !== q.correctAnswerIndex;
                  if (solutionFilter === "unattempted") return studentAns === undefined;
                  return true;
                })
                .map((q, idx) => {
                  const studentAns = answers[q.id];
                  const isCorrect = studentAns === q.correctAnswerIndex;
                  const isUnattempted = studentAns === undefined;

                  return (
                    <div key={q.id} className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-brand-400">Question {idx + 1} ({q.section || "General"})</span>
                        <span className={`px-2.5 py-1 rounded-md font-semibold ${isCorrect ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : isUnattempted ? "bg-slate-900 text-slate-400" : "bg-rose-950 text-rose-400 border border-rose-800"}`}>
                          {isCorrect ? "Correct ✓" : isUnattempted ? "Unattempted ⚪" : "Incorrect ✗"}
                        </span>
                      </div>

                      <p className="font-semibold text-slate-200 text-sm whitespace-pre-line">{q.question}</p>

                      <div className="grid sm:grid-cols-2 gap-2 text-xs">
                        {q.options?.map((opt, oIdx) => {
                          const isRightChoice = oIdx === q.correctAnswerIndex;
                          const isStudentChoice = oIdx === studentAns;

                          let bgClass = "bg-slate-900 border-slate-800 text-slate-400";
                          if (isRightChoice) bgClass = "bg-emerald-950/80 border-emerald-600 text-emerald-200 font-bold";
                          else if (isStudentChoice && !isRightChoice) bgClass = "bg-rose-950/80 border-rose-600 text-rose-200";

                          return (
                            <div key={oIdx} className={`p-3 rounded-xl border flex items-center gap-3 ${bgClass}`}>
                              <span className="w-5 h-5 rounded bg-black/30 flex items-center justify-center text-[10px] font-bold">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span>{opt}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Solution Explanation */}
                      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1">
                        <p className="font-bold text-amber-400 flex items-center gap-1">💡 Solution Explanation:</p>
                        <p className="leading-relaxed text-slate-300">{q.explanation}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal before Submit */}
      {confirmSubmit && (
        <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center" onClick={() => setConfirmSubmit(false)}>
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-6 text-center space-y-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <AlertCircle size={40} className="mx-auto text-amber-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Are you sure you want to submit?</h3>
              <p className="text-xs text-slate-400 mt-1">Review your summary before submitting your test.</p>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-900 p-3 rounded-2xl border border-slate-800 text-xs">
              <div>
                <p className="font-bold text-emerald-400">{Object.keys(answers).length}</p>
                <p className="text-[10px] text-slate-400">Answered</p>
              </div>
              <div>
                <p className="font-bold text-rose-400">{questions.length - Object.keys(answers).length}</p>
                <p className="text-[10px] text-slate-400">Unanswered</p>
              </div>
              <div>
                <p className="font-bold text-purple-400">{Object.values(status).filter((s) => s === "review").length}</p>
                <p className="text-[10px] text-slate-400">In Review</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setConfirmSubmit(false)} className="btn-soft flex-1 text-xs py-2.5 bg-slate-900 text-slate-300 hover:bg-slate-800">
                Continue Test
              </button>
              <button onClick={handleSubmitTest} className="btn-primary flex-1 text-xs py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                Yes, Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
