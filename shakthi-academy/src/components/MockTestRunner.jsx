import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, HelpCircle, CheckCircle2, XCircle, AlertCircle, Bookmark, Award, RotateCcw, ChevronLeft, ChevronRight, Send, X, Eye, Menu, ChevronDown, ChevronUp } from "lucide-react";
import { useApp } from "../store.jsx";

export default function MockTestRunner({ test, onClose }) {
  const { pushToast } = useApp();

  // Test state
  const questions = (Array.isArray(test?.questionsList) && test.questionsList.length > 0)
    ? test.questionsList
    : (Array.isArray(test?.questions) && test.questions.length > 0)
    ? test.questions
    : (Array.isArray(test?.rawExtractedQuestions) && test.rawExtractedQuestions.length > 0)
    ? test.rawExtractedQuestions.map((q, idx) => {
        let opts = q.options;
        if (opts && typeof opts === "object" && !Array.isArray(opts)) {
          const keys = Object.keys(opts).sort();
          opts = keys.map(k => opts[k]);
        }
        if (!Array.isArray(opts) || opts.length === 0) {
          opts = ["Option A", "Option B", "Option C", "Option D"];
        }
        const finalLetter = q.ai_verified_answer || q.source_answer || "A";
        const ansIndex = Math.max(0, finalLetter.toUpperCase().charCodeAt(0) - 65);
        return {
          id: q.id || `q_${idx}`,
          question: q.question_text || q.question || `Question ${idx + 1}`,
          options: opts,
          correctAnswerIndex: ansIndex < opts.length ? ansIndex : 0,
          explanation: q.verification_explanation || "Verified answer.",
          section: q.section || "General",
          passage: q.passage || "",
          imageUrl: q.imageUrl || q.image || q.chartUrl || q.img || "",
          solutionImageUrl: q.solutionImageUrl || ""
        };
      })
    : [];
  const minutesFromTime = parseInt(String(test?.time || "").replace(/\D+/g, ""));
  const minutes = minutesFromTime || Number(test?.durationMinutes) || 30;
  const totalDurationSeconds = Math.max(1, minutes) * 60;
  const [timeLeft, setTimeLeft] = useState(totalDurationSeconds);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState({}); // { [qId]: optionIndex }
  const [status, setStatus] = useState({}); // { [qId]: "answered" | "not_answered" | "review" }
  const [visited, setVisited] = useState({ 0: true });
  const [expandedPassage, setExpandedPassage] = useState(false);
  const [showSolutionAccordion, setShowSolutionAccordion] = useState(true);

  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [viewState, setViewState] = useState("test"); // "test" | "results" | "solutions"
  const [results, setResults] = useState(null);
  
  const [showMobilePalette, setShowMobilePalette] = useState(false);

  const formatMathText = (str) => {
    if (!str || typeof str !== "string") return str;

    let res = str;

    res = res
      .replace(/\^2/g, "²")
      .replace(/\^3/g, "³")
      .replace(/\^4/g, "⁴")
      .replace(/\^5/g, "⁵");

    res = res.replace(/(\b\d+|\))\s+([23])(?=\s*(?:[\+\-\*\/\=\,\)\?]|$))/g, (match, base, exp) => {
      if (/[²³⁴⁵]$/.test(base)) return match;
      const superscripts = { "2": "²", "3": "³" };
      return `${base}${superscripts[exp] || exp}`;
    });

    res = res.replace(/([²³⁴⁵])\1+/g, "$1");

    return res;
  };

  const renderFormattedText = (text) => {
    if (!text || typeof text !== "string") return text;
    
    const lines = text.split('\n');
    const result = [];
    let currentTable = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!currentTable) {
          currentTable = [line];
        } else {
          currentTable.push(line);
        }
      } else {
        if (currentTable) {
          result.push({ type: 'table', rows: currentTable });
          currentTable = null;
        }
        result.push({ type: 'text', content: lines[i] });
      }
    }
    if (currentTable) {
      result.push({ type: 'table', rows: currentTable });
    }

    const merged = [];
    let currentText = [];
    result.forEach(item => {
      if (item.type === 'text') {
        currentText.push(item.content);
      } else {
        if (currentText.length > 0) {
          merged.push({ type: 'text', content: currentText.join('\n') });
          currentText = [];
        }
        merged.push(item);
      }
    });
    if (currentText.length > 0) {
      merged.push({ type: 'text', content: currentText.join('\n') });
    }

    return (
      <>
        {merged.map((item, index) => {
          if (item.type === 'text') {
            return <span key={index}>{formatMathText(item.content)}</span>;
          } else {
            const rawRows = item.rows;
            let headers = [];
            let dataRows = [];
            if (rawRows.length > 1 && rawRows[1].replace(/[\s|:-]/g, '') === '') {
              headers = rawRows[0].split('|').slice(1, -1).map(s => s.trim());
              dataRows = rawRows.slice(2).map(r => r.split('|').slice(1, -1).map(s => s.trim()));
            } else {
              dataRows = rawRows.map(r => r.split('|').slice(1, -1).map(s => s.trim()));
            }
            return (
              <div key={index} className="overflow-x-auto my-4 rounded-xl border border-black/20 dark:border-slate-700/80 shadow-sm bg-white dark:bg-slate-950 not-italic whitespace-normal block w-full">
                <table className="min-w-full text-left text-[13px] sm:text-sm divide-y divide-black/10 dark:divide-slate-800">
                  {headers.length > 0 && (
                    <thead className="bg-black/5 dark:bg-slate-900">
                      <tr>
                        {headers.map((h, i) => (
                          <th key={i} className="px-3 py-2 sm:px-4 sm:py-3 font-bold text-ink dark:text-slate-100 border-x border-black/5 dark:border-slate-800/50 first:border-l-0 last:border-r-0">
                            {formatMathText(h)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody className="divide-y divide-black/10 dark:divide-slate-800">
                    {dataRows.map((row, i) => (
                      <tr key={i} className="hover:bg-black/[0.02] dark:hover:bg-slate-900/50 transition-colors">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 sm:px-4 sm:py-3 text-ink-soft dark:text-slate-300 border-x border-black/5 dark:border-slate-800/50 first:border-l-0 last:border-r-0">
                            {formatMathText(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        })}
      </>
    );
  };

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      if (viewState === "test") saveAndNext();
      else goNext();
    }
    if (isRightSwipe) {
      goPrev();
    }
  };

  const currentQ = questions[currentIndex] || {};

  // Countdown Timer
  useEffect(() => {
    if (viewState !== "test") return;
    if (timeLeft <= 0) {
      handleSubmitTest();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, viewState]);

  // Mark visited
  useEffect(() => {
    setVisited((prev) => ({ ...prev, [currentIndex]: true }));
    if (viewState === "test" && !answers[currentQ.id] && !status[currentQ.id]) {
      setStatus((prev) => ({ ...prev, [currentQ.id]: "not_answered" }));
    }
    setExpandedPassage(false);
  }, [currentIndex, viewState]);

  const selectOption = (optIndex) => {
    if (viewState !== "test") return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optIndex }));
  };

  const clearResponse = () => {
    if (viewState !== "test") return;
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
    setStatus((prev) => ({ ...prev, [currentQ.id]: "not_answered" }));
  };

  const markForReview = () => {
    if (viewState !== "test") return;
    setStatus((prev) => ({ ...prev, [currentQ.id]: "review" }));
    goNext();
  };

  const saveAndNext = () => {
    if (viewState !== "test") return;
    if (answers[currentQ.id] !== undefined) {
      setStatus((prev) => ({ ...prev, [currentQ.id]: "answered" }));
    } else {
      setStatus((prev) => ({ ...prev, [currentQ.id]: "not_answered" }));
    }
    goNext();
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
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
      const correctIdx = typeof q.correctAnswerIndex === "number" ? q.correctAnswerIndex : 0;
      if (studentAns === undefined) {
        unattemptedCount++;
      } else if (studentAns === correctIdx) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const totalQs = questions.length || 1;
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
    setViewState("results");
    pushToast(`Test Submitted! Score: ${score}/${totalQs} 🎉`);
    setCurrentIndex(0); // Reset for solutions view
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const sections = Array.from(new Set(questions.map((q) => q.section || "General")));

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  if (viewState === "results") {
    return (
      <div className="fixed inset-0 z-[80] bg-appbg dark:bg-slate-900 text-ink dark:text-slate-100 flex flex-col font-sans overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-950 border-b border-black/10 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-brand-600 flex items-center justify-center font-bold text-white shadow">
              KEN
            </span>
            <div className="min-w-0">
              <h2 className="font-bold text-xs sm:text-sm text-ink dark:text-white truncate">Test Results</h2>
            </div>
          </div>
          <button onClick={onClose} className="btn-soft text-[10px] sm:text-xs px-2.5 sm:px-4 py-1.5 sm:py-2 bg-black/5 dark:bg-slate-800 hover:bg-black/10 dark:hover:bg-slate-700 text-ink dark:text-white flex items-center gap-1 whitespace-nowrap">
            <X size={12} className="sm:w-[14px] sm:h-[14px]" /> Exit
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-3xl bg-white dark:bg-slate-950 border border-black/10 dark:border-slate-800 p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 text-center md:text-left">
                <span className="chip bg-brand-100 dark:bg-brand-950 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 font-semibold">{test?.category} Exam Report</span>
                <h1 className="text-2xl md:text-3xl font-extrabold text-ink dark:text-white">{test?.title}</h1>
                <p className="text-sm text-ink-muted dark:text-slate-400">Submitted on {results?.date} · Time Taken: {formatTimer(results?.timeSpentSeconds || 0)}</p>
              </div>

              <div className="flex items-center gap-6 bg-appbg dark:bg-slate-900/80 p-5 rounded-2xl border border-black/10 dark:border-slate-800">
                <div className="text-center">
                  <p className="text-xs text-ink-muted dark:text-slate-400 font-medium">Final Score</p>
                  <p className="text-3xl font-extrabold text-amber-400">{results?.score} <span className="text-sm text-ink-faint dark:text-slate-500">/ {results?.totalMarks}</span></p>
                </div>
                <div className="w-px h-10 bg-black/5 dark:bg-slate-800"/>
                <div className="text-center">
                  <p className="text-xs text-ink-muted dark:text-slate-400 font-medium">Accuracy</p>
                  <p className="text-3xl font-extrabold text-emerald-400">{results?.accuracy}%</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-black/10 dark:border-slate-800/80 text-center">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{results?.correctCount}</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-300">Correct</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40">
                <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{results?.incorrectCount}</p>
                <p className="text-[11px] text-rose-600 dark:text-rose-300">Incorrect</p>
              </div>
              <div className="p-3 rounded-xl bg-appbg dark:bg-slate-900 border border-black/10 dark:border-slate-800">
                <p className="text-xl font-bold text-ink-muted dark:text-slate-400">{results?.unattemptedCount}</p>
                <p className="text-[11px] text-ink-muted dark:text-slate-400">Unattempted</p>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center">
               <button onClick={() => setViewState("solutions")} className="btn-primary text-sm px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl flex items-center gap-2">
                 <Eye size={18} /> Review Solutions
               </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Common UI for both "test" and "solutions" view state
  const isSolutions = viewState === "solutions";

  return (
    <div className="fixed inset-0 z-[80] bg-appbg dark:bg-slate-900 text-ink dark:text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Header Bar */}
      <header className="h-16 bg-white dark:bg-slate-950 border-b border-black/10 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-2">
          {isSolutions && (
            <button onClick={() => setViewState("results")} className="p-1 mr-1 md:hidden">
              <ChevronLeft size={20} />
            </button>
          )}
          <span className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-brand-600 flex items-center justify-center font-bold text-white shadow">
            KEN
          </span>
          <div className="min-w-0">
            <h2 className="font-bold text-xs sm:text-sm text-ink dark:text-white truncate">
              {isSolutions ? `Solutions: ${test?.title}` : (test?.title || "Online CBT Exam")}
            </h2>
            <p className="text-[10px] sm:text-[11px] text-ink-muted dark:text-slate-400 truncate">{test?.category} · Official CBT Exam Pattern</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {!isSolutions && (
            <div className={`flex flex-col sm:flex-row items-center sm:gap-2 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-xl border text-[10px] sm:text-sm font-bold transition-all ${timeLeft < 300 ? "bg-rose-950/80 border-rose-600 text-rose-300 animate-pulse" : "bg-appbg dark:bg-slate-900 border-black/20 dark:border-slate-700 text-amber-400"}`}>
              <Clock size={14} className="hidden sm:block" />
              <span className="text-center leading-tight">Time<span className="hidden sm:inline"> Left</span>:<br className="sm:hidden" />{formatTimer(timeLeft)}</span>
            </div>
          )}

          {!isSolutions ? (
            <button onClick={() => setConfirmSubmit(true)} className="btn-primary text-[10px] sm:text-xs px-2.5 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 whitespace-nowrap">
              <Send size={12} className="sm:w-[14px] sm:h-[14px]" /> <span className="hidden sm:inline">Submit Test</span><span className="sm:hidden">Submit</span>
            </button>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <button onClick={() => setViewState("results")} className="btn-soft text-[10px] sm:text-xs px-2.5 sm:px-4 py-1.5 sm:py-2 bg-black/5 dark:bg-slate-800 hover:bg-black/10 dark:hover:bg-slate-700 text-ink dark:text-white flex items-center gap-1 whitespace-nowrap">
                Test Summary
              </button>
              <button onClick={onClose} className="btn-soft text-[10px] sm:text-xs px-2.5 sm:px-4 py-1.5 sm:py-2 bg-black/5 dark:bg-slate-800 hover:bg-black/10 dark:hover:bg-slate-700 text-ink dark:text-white flex items-center gap-1 whitespace-nowrap">
                <X size={12} className="sm:w-[14px] sm:h-[14px]" /> Exit
              </button>
            </div>
          )}

          <button onClick={() => setShowMobilePalette(true)} className="md:hidden p-2 text-ink dark:text-white">
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Main Interface */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left / Main Question Area */}
        <div className="flex-1 flex flex-col bg-appbg dark:bg-slate-900 overflow-hidden">
          {/* Section Switcher Tabs */}
          {sections.length > 1 && (
            <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-white dark:bg-slate-950/60 border-b border-black/10 dark:border-slate-800 text-xs overflow-x-auto shrink-0">
              <span className="text-ink-muted dark:text-slate-400 font-medium mr-1 text-[11px] sm:text-xs">Sections:</span>
              {sections.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => {
                    const firstIdx = questions.findIndex(q => (q.section || "General") === sec);
                    if (firstIdx !== -1) {
                      setDirection(firstIdx > currentIndex ? 1 : -1);
                      setCurrentIndex(firstIdx);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${currentQ.section === sec ? "bg-brand-600 text-white shadow-sm ring-1 ring-brand-400" : "bg-black/5 dark:bg-slate-800/80 text-ink-soft dark:text-slate-300 hover:bg-slate-700 hover:text-white"}`}
                >
                  {sec}
                </button>
              ))}
            </div>
          )}

          {/* Question Details Header */}
          <div className="px-6 py-4 flex items-center justify-between text-[11px] text-ink-muted dark:text-slate-400 font-medium shrink-0">
            <span className="bg-black/5 dark:bg-slate-800/60 px-3 py-1.5 rounded-full border border-black/20 dark:border-slate-700/50">Question Type : Multiple Choice</span>
            {!isSolutions && (
              <button onClick={markForReview} className="flex items-center gap-1.5 hover:text-white transition-colors">
                Review <Bookmark size={14} className={status[currentQ.id] === "review" ? "text-purple-400 fill-purple-400" : ""} />
              </button>
            )}
            {isSolutions && (
              <div className="flex items-center gap-2">
                {(() => {
                   const studentAns = answers[currentQ.id];
                   const correctIdx = typeof currentQ.correctAnswerIndex === "number" ? currentQ.correctAnswerIndex : 0;
                   const isCorrect = studentAns === correctIdx;
                   const isUnattempted = studentAns === undefined;
                   return (
                     <span className={`px-2.5 py-1 rounded-md font-semibold ${isCorrect ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400" : isUnattempted ? "bg-black/5 dark:bg-slate-800" : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"}`}>
                       {isCorrect ? "Correct ✓" : isUnattempted ? "Unattempted ⚪" : "Incorrect ✗"}
                     </span>
                   )
                })()}
              </div>
            )}
          </div>

          {/* Swipeable Question Body */}
          <div className="flex-1 relative overflow-hidden" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEndHandler}>
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "tween", ease: "easeInOut", duration: 0.2 }}
                className="absolute inset-0 overflow-y-auto px-6 pb-20 sm:pb-6"
              >
                <div className="max-w-4xl mx-auto space-y-6">
                  {currentQ.passage && (
                    <div className="space-y-2 pb-2">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 flex items-center justify-center bg-black/5 dark:bg-slate-800 text-ink dark:text-white font-bold rounded text-xs">{currentIndex + 1}</span>
                          <span className="font-bold text-ink dark:text-white text-[15px]">Instructions</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold">
                          <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded">+1.0</span>
                          <span className="bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded">-0.25</span>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <div className={`text-ink-soft dark:text-slate-200 text-sm leading-relaxed ${!expandedPassage ? "line-clamp-6" : ""}`}>
                          {renderFormattedText(currentQ.passage)}
                        </div>
                        {!expandedPassage && currentQ.passage.length > 250 && (
                          <button onClick={() => setExpandedPassage(true)} className="text-blue-400 font-bold text-xs mt-1 hover:underline">
                            ...View more
                          </button>
                        )}
                        {expandedPassage && (
                          <button onClick={() => setExpandedPassage(false)} className="text-blue-400 font-bold text-xs mt-2 hover:underline">
                            View less
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between mb-2">
                      {currentQ.passage ? (
                         <span className="font-bold text-ink dark:text-white text-[15px]">Question</span>
                      ) : (
                         <div className="flex items-center gap-3">
                           <span className="w-6 h-6 flex items-center justify-center bg-black/5 dark:bg-slate-800 text-ink dark:text-white font-bold rounded text-xs">{currentIndex + 1}</span>
                           <span className="font-bold text-ink dark:text-white text-[15px]">Question</span>
                         </div>
                      )}
                      
                      {!currentQ.passage && (
                        <div className="flex items-center gap-2 text-[10px] font-bold">
                          <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded">+1.0</span>
                          <span className="bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded">-0.25</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-ink dark:text-slate-100 font-medium text-[15px] leading-relaxed">
                      {renderFormattedText(currentQ.question)}
                    </div>
                  </div>

                  {(currentQ.imageUrl || currentQ.image || currentQ.chartUrl || currentQ.img) && (
                    <div className="my-4 rounded-xl border border-black/20 dark:border-slate-700/80 max-w-xl bg-white p-2.5 shadow-xl overflow-hidden">
                      <img
                        src={currentQ.imageUrl || currentQ.image || currentQ.chartUrl || currentQ.img}
                        alt="Question Chart / Image"
                        className="w-full max-h-[350px] object-contain rounded-lg block"
                      />
                    </div>
                  )}

                  {/* Options List */}
                  <div className="space-y-3 pt-4 pb-6">
                    {currentQ.options?.map((opt, optIdx) => {
                      const isSelected = answers[currentQ.id] === optIdx;
                      const isRightChoice = isSolutions ? optIdx === (currentQ.correctAnswerIndex || 0) : false;
                      const isStudentChoice = isSolutions ? optIdx === answers[currentQ.id] : false;

                      let bgClass = "bg-black/5 dark:bg-slate-800/30 border-black/10 dark:border-slate-800/80 text-ink-soft dark:text-slate-300";
                      let letterBgClass = "bg-slate-300 dark:bg-slate-700/60 text-ink-muted dark:text-slate-400";
                      
                      if (!isSolutions) {
                        if (isSelected) {
                          bgClass = "bg-black/10 dark:bg-slate-800/80 border-slate-500 text-ink dark:text-white shadow-sm";
                          letterBgClass = "bg-slate-600 text-white";
                        } else {
                          bgClass += " hover:bg-black/10 dark:hover:bg-slate-800/60 hover:border-black/20 dark:hover:border-slate-700";
                        }
                      } else {
                         // Solution Mode styles
                         if (isRightChoice) {
                            bgClass = "bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 dark:border-emerald-600 text-emerald-800 dark:text-emerald-200 font-bold shadow-sm ring-1 ring-emerald-500/30";
                            letterBgClass = "bg-emerald-600 text-white";
                         } else if (isStudentChoice && !isRightChoice) {
                            bgClass = "bg-rose-100 dark:bg-rose-950/80 border-rose-400 dark:border-rose-600 text-rose-800 dark:text-rose-200 font-semibold";
                            letterBgClass = "bg-rose-600 text-white";
                         } else {
                            bgClass = "bg-appbg dark:bg-slate-900 border-black/10 dark:border-slate-800 text-ink-muted dark:text-slate-400";
                         }
                      }

                      return (
                        <div
                          key={optIdx}
                          onClick={() => selectOption(optIdx)}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${!isSolutions ? "cursor-pointer" : ""} ${bgClass}`}
                        >
                          <div className="flex items-center gap-3 sm:gap-4">
                            <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-[11px] shrink-0 ${letterBgClass}`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="text-xs sm:text-[14px] leading-relaxed">{formatMathText(opt)}</span>
                          </div>
                          {isSolutions && isRightChoice && <span className="hidden sm:inline text-emerald-700 dark:text-emerald-400 font-extrabold text-[11px] shrink-0">✓ Correct</span>}
                          {isSolutions && isStudentChoice && !isRightChoice && <span className="hidden sm:inline text-rose-700 dark:text-rose-400 font-bold text-[11px] shrink-0">Your Choice ✗</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Solution Area */}
                  {isSolutions && (
                    <div className="pt-2 pb-8 border-t border-black/10 dark:border-slate-800/80">
                      <button onClick={() => setShowSolutionAccordion(!showSolutionAccordion)} className="flex items-center gap-2 text-sm font-bold text-brand-600 dark:text-brand-400 hover:text-brand-500">
                         <Eye size={16} /> View Solution {showSolutionAccordion ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                      </button>
                      
                      {showSolutionAccordion && (
                        <div className="mt-4 p-4 rounded-xl bg-amber-50/50 dark:bg-slate-900/90 border border-amber-200/50 dark:border-slate-800 text-xs text-ink-soft dark:text-slate-300 space-y-3">
                          <div className="leading-relaxed text-ink-soft dark:text-slate-200 whitespace-pre-line">
                            {renderFormattedText(currentQ.explanation) || `Correct Option is (${String.fromCharCode(65 + (currentQ.correctAnswerIndex || 0))})`}
                          </div>
                          {currentQ.solutionImageUrl && (
                            <div className="mt-4 border border-black/10 dark:border-slate-700/80 p-2 rounded-lg bg-white dark:bg-slate-950">
                               <img src={currentQ.solutionImageUrl} alt="Solution" className="max-w-full rounded-md" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Action Bar Footer */}
          <div className="h-16 px-4 sm:px-6 bg-white dark:bg-slate-950 border-t border-black/10 dark:border-slate-800 flex items-center justify-between shrink-0 absolute bottom-0 left-0 right-0 md:relative z-20">
            {!isSolutions ? (
              <>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button onClick={clearResponse} className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-appbg dark:bg-slate-900 border border-black/10 dark:border-slate-800 hover:bg-black/5 dark:bg-slate-800 text-[10px] sm:text-xs font-semibold text-ink-soft dark:text-slate-300">
                    Clear <span className="hidden sm:inline">Response</span>
                  </button>
                  <button onClick={markForReview} className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 hover:bg-purple-900 text-[10px] sm:text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                    <Bookmark size={13} /> <span className="hidden sm:inline">Mark for Review & Next</span><span className="sm:hidden">Review</span>
                  </button>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  <button onClick={goPrev} disabled={currentIndex === 0} className="px-2.5 sm:px-3 py-2 rounded-xl bg-appbg dark:bg-slate-900 border border-black/10 dark:border-slate-800 disabled:opacity-40 text-[10px] sm:text-xs font-semibold text-ink-soft dark:text-slate-300 flex items-center gap-1">
                    <ChevronLeft size={15} /> <span className="hidden sm:inline">Previous</span>
                  </button>
                  <button onClick={saveAndNext} className="btn-primary text-[10px] sm:text-xs px-3 sm:px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center gap-1">
                    Save & Next <ChevronRight size={15} />
                  </button>
                </div>
              </>
            ) : (
              // Solutions Action Bar
              <>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setViewState("results"); onClose && onClose(); }} className="md:hidden px-3 py-2 rounded-xl bg-appbg dark:bg-slate-900 border border-black/10 dark:border-slate-800 text-xs font-semibold text-ink-soft dark:text-slate-300">
                    Summary
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={goPrev} disabled={currentIndex === 0} className="px-3 sm:px-4 py-2 rounded-xl bg-appbg dark:bg-slate-900 border border-black/10 dark:border-slate-800 disabled:opacity-40 text-xs font-semibold text-ink-soft dark:text-slate-300 flex items-center gap-1">
                    <ChevronLeft size={15} /> Previous
                  </button>
                  <button onClick={goNext} disabled={currentIndex === questions.length - 1} className="btn-primary text-xs px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-bold flex items-center gap-1">
                    Next <ChevronRight size={15} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Question Palette Drawer */}
        {showMobilePalette && (
          <div className="fixed inset-0 bg-black/50 z-[90] md:hidden" onClick={() => setShowMobilePalette(false)} />
        )}
        <div className={`fixed inset-y-0 right-0 z-[100] w-72 bg-white dark:bg-slate-950 shadow-2xl transition-transform duration-300 md:relative md:w-80 md:translate-x-0 flex flex-col shrink-0 border-l border-black/10 dark:border-slate-800 p-5 ${showMobilePalette ? 'translate-x-0' : 'translate-x-full hidden md:flex'}`}>
          <div className="flex items-center justify-between mb-4 md:hidden">
            <h3 className="font-bold text-xs text-ink-muted dark:text-slate-400 uppercase tracking-wider">Question Palette</h3>
            <button onClick={() => setShowMobilePalette(false)} className="p-1 text-ink dark:text-white"><X size={16} /></button>
          </div>
          <h3 className="hidden md:block font-bold text-xs text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-4">Question Palette</h3>

          <div className="flex-1 overflow-y-auto grid grid-cols-5 gap-2 pr-1 max-h-[50vh] md:max-h-none">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isAns = answers[q.id] !== undefined;
              const isRev = status[q.id] === "review";
              const isNotAns = status[q.id] === "not_answered" && !isAns;

              let statusBg = "bg-appbg dark:bg-slate-900 text-ink-muted dark:text-slate-400 border-black/10 dark:border-slate-800";
              if (isRev) statusBg = "bg-purple-600 text-white border-purple-500";
              else if (isAns) statusBg = "bg-emerald-600 text-white border-emerald-500";
              else if (isNotAns) statusBg = "bg-rose-600 text-white border-rose-500";

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setDirection(idx > currentIndex ? 1 : -1);
                    setCurrentIndex(idx);
                    if (window.innerWidth < 768) setShowMobilePalette(false);
                  }}
                  className={`h-10 rounded-xl font-bold text-xs border transition-all flex items-center justify-center relative ${statusBg} ${isCurrent ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950" : ""}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="pt-4 border-t border-black/10 dark:border-slate-800 space-y-2 text-[11px] text-ink-muted dark:text-slate-400">
            <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded bg-emerald-600 shrink-0"/> Answered</div>
            <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded bg-rose-600 shrink-0"/> Not Answered</div>
            <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded bg-purple-600 shrink-0"/> Marked for Review</div>
            <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded bg-appbg dark:bg-slate-900 border border-black/10 dark:border-slate-800 shrink-0"/> Not Visited</div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal before Submit */}
      {confirmSubmit && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center" onClick={() => setConfirmSubmit(false)}>
          <div className="w-full max-w-md bg-white dark:bg-slate-950 border border-black/10 dark:border-slate-800 rounded-3xl p-6 text-center space-y-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <AlertCircle size={40} className="mx-auto text-amber-400" />
            <div>
              <h3 className="text-lg font-bold text-ink dark:text-white">Are you sure you want to submit?</h3>
              <p className="text-xs text-ink-muted dark:text-slate-400 mt-1">Review your summary before submitting your test.</p>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-appbg dark:bg-slate-900 p-3 rounded-2xl border border-black/10 dark:border-slate-800 text-xs">
              <div>
                <p className="font-bold text-emerald-400">{Object.keys(answers).length}</p>
                <p className="text-[10px] text-ink-muted dark:text-slate-400">Answered</p>
              </div>
              <div>
                <p className="font-bold text-rose-400">{questions.length - Object.keys(answers).length}</p>
                <p className="text-[10px] text-ink-muted dark:text-slate-400">Unanswered</p>
              </div>
              <div>
                <p className="font-bold text-purple-400">{Object.values(status).filter((s) => s === "review").length}</p>
                <p className="text-[10px] text-ink-muted dark:text-slate-400">In Review</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setConfirmSubmit(false)} className="btn-soft flex-1 text-xs py-2.5 bg-appbg dark:bg-slate-900 text-ink-soft dark:text-slate-300 hover:bg-black/5 dark:bg-slate-800">
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
