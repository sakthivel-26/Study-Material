import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, HelpCircle, CheckCircle2, XCircle, AlertCircle, Award, RotateCcw,
  ChevronLeft, ChevronRight, Send, X, Eye, Maximize2, Minimize2, Pause, Play,
  Info, User, ArrowLeft, ArrowRight, ShieldAlert, Sparkles, BookOpen
} from "lucide-react";
import { useApp } from "../store.jsx";
import { useAuth } from "../auth.jsx";
import TestAnalysisView from "./TestAnalysisView.jsx";
import FormattedPassage from "./FormattedPassage.jsx";

export default function RealExamRunner({ test, onClose }) {
  const { pushToast, saveTestAttempt } = useApp();
  const { user } = useAuth();

  // ---------------------------------------------------------
  // 1. Parse and normalize questions & sections
  // ---------------------------------------------------------
  const rawQuestions = (Array.isArray(test?.questionsList) && test.questionsList.length > 0)
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
          opts = ["Option A", "Option B", "Option C", "Option D", "Option E"];
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

  // Determine sections configuration
  const parsedSections = Array.from(new Set(rawQuestions.map(q => q.section || "General")));
  const defaultSectionsList = parsedSections.length > 0 ? parsedSections : ["General"];

  const sectionsConfig = Array.isArray(test?.sectionsConfig) && test.sectionsConfig.length > 0
    ? test.sectionsConfig
    : defaultSectionsList.map((secName) => {
        const qCount = rawQuestions.filter(q => (q.section || "General") === secName).length || 1;
        const totalMin = parseInt(String(test?.time || "").replace(/\D+/g, "")) || Number(test?.durationMinutes) || 60;
        const secDuration = Math.max(5, Math.floor(totalMin / (defaultSectionsList.length || 1)));
        return {
          name: secName,
          durationMinutes: secDuration,
          questionCount: qCount
        };
      });

  // Group questions by section
  const sectionQuestionsMap = {};
  sectionsConfig.forEach((sec) => {
    sectionQuestionsMap[sec.name] = rawQuestions.filter(q => (q.section || "General") === sec.name);
  });
  // If some questions fall outside configured sections, place them into the first section
  const orphanQuestions = rawQuestions.filter(q => !sectionsConfig.some(s => s.name === (q.section || "General")));
  if (orphanQuestions.length > 0 && sectionsConfig.length > 0) {
    sectionQuestionsMap[sectionsConfig[0].name] = [
      ...(sectionQuestionsMap[sectionsConfig[0].name] || []),
      ...orphanQuestions
    ];
  }

  // ---------------------------------------------------------
  // 2. State Management
  // ---------------------------------------------------------
  // Screen phase: "instructions" | "exam" | "results" | "solutions"
  const [screenPhase, setScreenPhase] = useState("instructions");
  const [hasAgreedDeclaration, setHasAgreedDeclaration] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  // Section & Question pointers
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const currentSection = sectionsConfig[currentSectionIndex] || { name: "General", durationMinutes: 20 };
  const currentSectionQuestions = sectionQuestionsMap[currentSection.name] || [];
  const [currentQIndexInSection, setCurrentQIndexInSection] = useState(0);

  // Active question object
  const activeQuestion = currentSectionQuestions[currentQIndexInSection] || rawQuestions[0] || {
    id: "q_empty",
    question: "No question available in this section.",
    options: ["Option A", "Option B", "Option C", "Option D", "Option E"],
    correctAnswerIndex: 0,
    section: currentSection.name
  };

  // Collect all context images (diagrams, tables, pie charts, bar charts) for the current question
  const contextImages = [
    ...(Array.isArray(activeQuestion?.imageUrls) ? activeQuestion.imageUrls : []),
    ...(Array.isArray(activeQuestion?.chartImageUrls) ? activeQuestion.chartImageUrls : []),
    ...(activeQuestion?.imageUrl ? [activeQuestion.imageUrl] : []),
    ...(activeQuestion?.chartImageUrl ? [activeQuestion.chartImageUrl] : []),
    ...(activeQuestion?.image ? [activeQuestion.image] : []),
    ...(activeQuestion?.chartUrl ? [activeQuestion.chartUrl] : []),
  ].filter((url, idx, self) => url && typeof url === "string" && self.indexOf(url) === idx);

  const hasContext = !!(activeQuestion?.passage || contextImages.length > 0);

  // Student Responses State:
  // answers: { [qId]: optionIndex }
  const [answers, setAnswers] = useState({});
  // status: { [qId]: "answered" | "not_answered" | "not_visited" | "review" | "ans_review" }
  const [status, setStatus] = useState({});
  const [visited, setVisited] = useState({});

  // Timers:
  // Track sectional timer for current section
  const [sectionTimeLeft, setSectionTimeLeft] = useState(() => (currentSection.durationMinutes || 20) * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [showSectionSubmitConfirm, setShowSectionSubmitConfirm] = useState(false);
  const [showSectionInfoModal, setShowSectionInfoModal] = useState(null);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  // UI customization
  const [fontSizeLevel, setFontSizeLevel] = useState(1); // 0 = Small, 1 = Normal, 2 = Large
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const [isDirectionsCollapsed, setIsDirectionsCollapsed] = useState(false);
  const [zoomedDiagramUrl, setZoomedDiagramUrl] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Test Results
  const [resultsData, setResultsData] = useState(null);

  // ---------------------------------------------------------
  // 3. Sectional Timer & Countdown
  // ---------------------------------------------------------
  // Initialize timer whenever section index changes
  useEffect(() => {
    if (screenPhase === "exam") {
      const durationSecs = (currentSection.durationMinutes || 20) * 60;
      setSectionTimeLeft(durationSecs);
      setCurrentQIndexInSection(0);
    }
  }, [currentSectionIndex, screenPhase]);

  // Section countdown interval (reliably stops when isPaused is true and resumes without resetting)
  useEffect(() => {
    if (screenPhase !== "exam" || isPaused) return;

    const timer = setInterval(() => {
      setSectionTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmitSection();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [screenPhase, isPaused]);

  // Mark current question as visited
  useEffect(() => {
    if (screenPhase !== "exam" || !activeQuestion?.id) return;

    setVisited(prev => ({ ...prev, [activeQuestion.id]: true }));

    setStatus(prev => {
      const currentStat = prev[activeQuestion.id];
      // If not yet answered or marked, mark as not_answered
      if (!currentStat || currentStat === "not_visited") {
        return { ...prev, [activeQuestion.id]: "not_answered" };
      }
      return prev;
    });
  }, [activeQuestion?.id, screenPhase]);

  // Format MM:SS or HH:MM:SS
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Fullscreen handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // ---------------------------------------------------------
  // 4. Candidate Response Actions
  // ---------------------------------------------------------
  const handleSelectOption = (optIndex) => {
    if (screenPhase !== "exam" || isPaused) return;
    setAnswers(prev => ({ ...prev, [activeQuestion.id]: optIndex }));
  };

  const handleClearResponse = () => {
    if (screenPhase !== "exam" || isPaused) return;
    setAnswers(prev => {
      const next = { ...prev };
      delete next[activeQuestion.id];
      return next;
    });
    setStatus(prev => ({ ...prev, [activeQuestion.id]: "not_answered" }));
    pushToast("Response cleared");
  };

  const handleSaveAndNext = () => {
    if (screenPhase !== "exam" || isPaused) return;

    const hasAnswer = answers[activeQuestion.id] !== undefined;
    setStatus(prev => ({
      ...prev,
      [activeQuestion.id]: hasAnswer ? "answered" : "not_answered"
    }));

    // Advance to next question in current section
    if (currentQIndexInSection < currentSectionQuestions.length - 1) {
      setCurrentQIndexInSection(prev => prev + 1);
    } else {
      pushToast("Reached the end of this section. You can review or submit.");
    }
  };

  const handleMarkForReviewAndNext = () => {
    if (screenPhase !== "exam" || isPaused) return;

    const hasAnswer = answers[activeQuestion.id] !== undefined;
    setStatus(prev => ({
      ...prev,
      [activeQuestion.id]: hasAnswer ? "ans_review" : "review"
    }));

    if (currentQIndexInSection < currentSectionQuestions.length - 1) {
      setCurrentQIndexInSection(prev => prev + 1);
    }
  };

  const jumpToQuestion = (qIdx) => {
    if (screenPhase !== "exam" || isPaused) return;
    setCurrentQIndexInSection(qIdx);
  };

  // ---------------------------------------------------------
  // 5. Section Submission & Test Completion
  // ---------------------------------------------------------
  const handleAutoSubmitSection = () => {
    pushToast(`⏰ Time up for ${currentSection.name}! Moving forward.`);
    proceedNextSectionOrFinish();
  };

  const proceedNextSectionOrFinish = () => {
    setShowSectionSubmitConfirm(false);
    if (currentSectionIndex < sectionsConfig.length - 1) {
      const nextSec = sectionsConfig[currentSectionIndex + 1];
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentQIndexInSection(0);
      pushToast(`Now starting section: ${nextSec.name}`);
    } else {
      // Final submission of entire test
      calculateFinalResults();
    }
  };

  const calculateFinalResults = () => {
    let totalScore = 0;
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalUnattempted = 0;

    const totalQs = rawQuestions.length || 1;
    const totalDurationSecs = (Number(test?.durationMinutes) || 60) * 60;

    const sectionsBreakdown = sectionsConfig.map(sec => {
      const secQs = sectionQuestionsMap[sec.name] || [];
      let secCorrect = 0;
      let secIncorrect = 0;
      let secUnattempted = 0;

      secQs.forEach(q => {
        const studentAns = answers[q.id];
        const correctIdx = typeof q.correctAnswerIndex === "number" ? q.correctAnswerIndex : 0;
        if (studentAns === undefined) {
          secUnattempted++;
        } else if (studentAns === correctIdx) {
          secCorrect++;
        } else {
          secIncorrect++;
        }
      });

      const secScore = +(secCorrect - secIncorrect * 0.25).toFixed(2);
      totalCorrect += secCorrect;
      totalIncorrect += secIncorrect;
      totalUnattempted += secUnattempted;
      totalScore += secScore;

      const secPercentage = secQs.length > 0 ? +((Math.max(0, secScore) / secQs.length) * 100).toFixed(2) : 0;
      const secCutoff = Math.max(5, Math.round(secQs.length * 0.2));
      const secPercentile = Math.max(1, Math.min(99.9, +(secPercentage * 0.85 + 5).toFixed(2)));

      return {
        name: sec.name,
        questionCount: secQs.length,
        correct: secCorrect,
        incorrect: secIncorrect,
        unattempted: secUnattempted,
        timeTaken: (sec.durationMinutes || 20) + " Mins",
        cutoff: secCutoff,
        score: Math.max(0, secScore),
        percentage: secPercentage,
        percentile: secPercentile
      };
    });

    const accuracy = Math.round((totalCorrect / (totalCorrect + totalIncorrect || 1)) * 100);
    const finalScore = Math.max(0, +totalScore.toFixed(2));
    const finalPercentage = Math.max(0, +((finalScore / totalQs) * 100).toFixed(2));
    const finalCutoff = test?.cutoffMarks || +(totalQs * 0.625).toFixed(1);
    const finalPercentile = Math.max(1, Math.min(99.9, +(finalPercentage * 0.85 + (finalScore >= finalCutoff ? 30 : 2)).toFixed(2)));
    const simulatedRank = Math.max(1, Math.floor(130997 * (1 - finalPercentile / 100))) + "/130997";

    const now = new Date();
    const attemptRecord = {
      id: "att_" + Date.now(),
      testId: test?.id || ("test_" + Date.now()),
      testTitle: test?.title || "IBPS Clerk Mock Test",
      category: test?.category || "Banking",
      startedAt: new Date(Date.now() - (totalDurationSecs - sectionTimeLeft) * 1000).toLocaleString("en-IN", {
        month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
      }),
      completedAt: now.toLocaleString("en-IN", {
        month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
      }),
      totalDurationSeconds: totalDurationSecs,
      timeSpentSeconds: Math.max(1, totalDurationSecs - sectionTimeLeft),
      totalMarks: totalQs,
      cutoffMarks: finalCutoff,
      score: finalScore,
      percentage: finalPercentage,
      accuracy,
      percentile: finalPercentile,
      rank: simulatedRank,
      sectionsBreakdown,
      answers,
      questions: rawQuestions
    };

    if (saveTestAttempt) {
      saveTestAttempt(attemptRecord);
    }

    setResultsData(attemptRecord);
    setScreenPhase("results");
    pushToast("🎉 Test submitted & performance recorded to database!");
  };

  // Status counts for current section
  const sectionCounts = {
    answered: 0,
    notAnswered: 0,
    notVisited: 0,
    review: 0,
    ansReview: 0
  };

  currentSectionQuestions.forEach(q => {
    const st = status[q.id];
    if (st === "answered") sectionCounts.answered++;
    else if (st === "review") sectionCounts.review++;
    else if (st === "ans_review") sectionCounts.ansReview++;
    else if (st === "not_answered") sectionCounts.notAnswered++;
    else sectionCounts.notVisited++;
  });

  // ---------------------------------------------------------
  // Helper for IBPS Shape Badges in Question Palette
  // ---------------------------------------------------------
  const renderPaletteBadge = (q, idx) => {
    const isCurrent = idx === currentQIndexInSection;
    const st = status[q.id] || "not_visited";

    // Styles according to authentic IBPS color codes
    let bgStyle = "bg-slate-200 text-slate-800"; // not_visited: silver/gray rounded square
    let shapeStyle = "rounded";

    if (st === "answered") {
      // Green rounded rectangle
      bgStyle = "bg-[#28a745] text-white";
      shapeStyle = "rounded";
    } else if (st === "not_answered") {
      // Red pointed shield badge
      bgStyle = "bg-[#d9534f] text-white";
      shapeStyle = "ibps-shield";
    } else if (st === "review") {
      // Purple circle
      bgStyle = "bg-[#6f42c1] text-white";
      shapeStyle = "rounded-full";
    } else if (st === "ans_review") {
      // Purple circle with small green badge dot
      bgStyle = "bg-[#6f42c1] text-white relative";
      shapeStyle = "rounded-full";
    }

    return (
      <button
        key={q.id || idx}
        onClick={() => jumpToQuestion(idx)}
        style={st === "not_answered" ? { clipPath: "polygon(0% 0%, 100% 0%, 100% 70%, 50% 100%, 0% 70%)" } : {}}
        className={`w-9 h-9 text-xs font-bold flex items-center justify-center transition-all cursor-pointer relative shrink-0 ${bgStyle} ${shapeStyle} ${
          isCurrent ? "ring-2 ring-blue-600 ring-offset-2 scale-105 z-10 font-extrabold shadow-md" : "hover:opacity-90"
        }`}
      >
        <span>{idx + 1}</span>
        {st === "ans_review" && (
          <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-white" />
        )}
      </button>
    );
  };

  // Dynamic Font Size Class
  const contentFontSizeClass = fontSizeLevel === 0 ? "text-xs" : fontSizeLevel === 2 ? "text-base" : "text-sm";

  // =========================================================
  // SCREEN 1: PRE-EXAM INSTRUCTIONS & DECLARATION SCREEN (Screenshot 2)
  // =========================================================
  if (screenPhase === "instructions") {
    return (
      <div className="fixed inset-0 z-[120] bg-white flex flex-col font-sans select-none overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-14 border-b border-slate-300 px-6 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/image.png"
              alt="KEN IAS ACADEMY"
              className="h-8 w-auto max-w-[36px] object-contain rounded"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <h1 className="font-bold text-sm md:text-base text-[#1B4F72]">
              KEN IAS ACADEMY · {test?.title || "IBPS Clerk Mock Test"}
            </h1>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-3 py-1.5 rounded-lg border border-slate-200"
          >
            Exit Test
          </button>
        </header>

        {/* Sub Header Blue Ribbon */}
        <div className="bg-[#bfe2f8] border-b border-[#a3c9e2] px-6 py-2.5 flex items-center justify-between text-xs text-slate-800 font-bold shrink-0">
          <span>Other Important Instructions</span>
          <div className="flex items-center gap-2">
            <span>View In :</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2 py-0.5 font-normal text-xs"
            >
              <option value="English">English</option>
              <option value="Tamil">Tamil</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>
        </div>

        {/* Main Instructions Body with Candidate Photo Box */}
        <div className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 flex flex-col md:flex-row gap-8">
          {/* Left Text */}
          <div className="flex-1 space-y-4 text-xs md:text-sm text-slate-700 leading-relaxed overflow-y-auto pr-2">
            <p className="font-semibold text-slate-800 italic">
              This is a Mock Test. The question paper displayed is for practice purposes only and does not represent the actual examination paper.
            </p>

            <h3 className="font-bold text-slate-900 border-b pb-1 text-sm">
              General Instructions:
            </h3>

            <ol className="list-decimal list-inside space-y-2.5 pl-1">
              <li>
                Total duration of this mock examination is <strong>{test?.time || "60 min"}</strong> with individual sectional timers:
                <ul className="list-disc list-inside pl-5 mt-1 text-slate-600 space-y-1">
                  {sectionsConfig.map((s, idx) => (
                    <li key={idx}>
                      <strong>{s.name}:</strong> {s.durationMinutes} minutes ({s.questionCount || "35"} Questions)
                    </li>
                  ))}
                </ul>
              </li>
              <li>
                The clock will be set at the server. The countdown timer at the top right corner of screen will display the remaining time available for you to complete the current section.
              </li>
              <li>
                When the timer for a section expires, the section is submitted automatically and the test will switch directly to the next section.
              </li>
              <li>
                <strong>Marking Scheme:</strong> Each correct answer carries <strong>+1.00 Mark</strong>. Each incorrect answer carries a negative marking penalty of <strong>-0.25 Mark</strong>.
              </li>
              <li>
                The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols:
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-[#28a745] text-white flex items-center justify-center font-bold text-[11px]">1</span>
                    <span>Answered question</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 70%, 50% 100%, 0% 70%)" }} className="w-6 h-6 bg-[#d9534f] text-white flex items-center justify-center font-bold text-[11px]">2</span>
                    <span>Not Answered question</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[11px]">3</span>
                    <span>Not Visited yet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#6f42c1] text-white flex items-center justify-center font-bold text-[11px]">4</span>
                    <span>Marked for Review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#6f42c1] text-white flex items-center justify-center font-bold text-[11px] relative">
                      5<span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400 border border-white" />
                    </span>
                    <span>Answered &amp; Marked for Review</span>
                  </div>
                </div>
              </li>
              <li>
                To answer a question, click on the option button. Click on <strong>Save &amp; Next</strong> to save your answer and go to the next question.
              </li>
              <li>
                Click on <strong>Clear Response</strong> to deselect an answered option.
              </li>
            </ol>
          </div>

          {/* Right Candidate Avatar Card */}
          <div className="w-full md:w-56 shrink-0 flex flex-col items-center">
            <div className="w-36 h-40 bg-slate-100 border-2 border-slate-300 rounded-xl flex flex-col items-center justify-center p-3 text-center shadow-inner">
              <div className="w-20 h-20 rounded-full bg-slate-300 flex items-center justify-center text-slate-500 mb-2">
                <User size={44} />
              </div>
              <p className="font-bold text-xs text-slate-800">{user?.name || "Student Aspirant"}</p>
              <p className="text-[10px] text-slate-500">Roll No: *********123</p>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer and Start Bar */}
        <footer className="border-t border-slate-300 bg-slate-50 p-4 md:px-8 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-slate-800">Choose your default language :</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 bg-white font-medium text-xs text-slate-800"
            >
              <option value="English">English</option>
              <option value="Tamil">Tamil</option>
              <option value="Hindi">Hindi</option>
              <option value="Both">Both</option>
            </select>
          </div>

          <p className="text-[11px] font-semibold text-rose-600">
            Please note all questions will appear in your default language. This language can be changed for a particular question later on.
          </p>

          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 leading-normal select-none">
            <input
              type="checkbox"
              checked={hasAgreedDeclaration}
              onChange={(e) => setHasAgreedDeclaration(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span>
              I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like mobile phone, bluetooth devices etc. /any prohibited material with me into the Examination Hall. I agree that in case of not adhering to the instructions, I shall be liable to be debarred from this Test and/or to disciplinary action, which may include ban from future Tests / Examinations.
            </span>
          </label>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <button
              disabled={!hasAgreedDeclaration}
              onClick={() => setScreenPhase("exam")}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold text-white transition-all shadow flex items-center gap-2 ${
                hasAgreedDeclaration
                  ? "bg-[#2874A6] hover:bg-[#1B4F72] cursor-pointer"
                  : "bg-slate-300 cursor-not-allowed text-slate-500"
              }`}
            >
              <span>I am ready to begin</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // =========================================================
  // SCREEN 2: CBT REAL EXAM INTERFACE (Screenshot 1 & 3)
  // =========================================================
  if (screenPhase === "exam") {
    return (
      <div className="fixed inset-0 z-[120] bg-white text-slate-900 flex flex-col font-sans select-none overflow-hidden">
        {/* 1. Top Navbar (Dark Navy Blue #1B4F72) */}
        <header className="h-12 bg-[#1B4F72] text-white px-4 flex items-center justify-between shrink-0 shadow-sm">
          {/* Left: Brand/Logo */}
          <div className="flex items-center gap-2.5">
            <img
              src="/image.png"
              alt="KEN IAS ACADEMY"
              className="h-8 w-auto max-w-[34px] object-contain rounded bg-white/10 p-0.5"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div
              style={{ display: 'none' }}
              className="w-7 h-7 rounded bg-white text-[#1B4F72] items-center justify-center font-extrabold text-xs"
            >
              KIA
            </div>
            <span className="font-extrabold text-sm md:text-base tracking-wide text-white flex items-center gap-1.5">
              <span>KEN IAS ACADEMY</span>
            </span>
          </div>

          {/* Center: Exam Title */}
          <div className="hidden md:block font-bold text-xs md:text-sm text-center truncate max-w-lg">
            {test?.title || "IBPS Clerk Mock Test - Full Mock"}
          </div>

          {/* Right: Controls (Fullscreen, Font Zoom, Pause Test) */}
          <div className="flex items-center gap-2.5">
            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className="p-1.5 rounded hover:bg-white/15 text-white/90 transition-colors text-xs flex items-center justify-center"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Font Zoom Controller: - T + */}
            <div className="flex items-center bg-white/10 rounded px-1.5 py-0.5 text-xs text-white">
              <button
                onClick={() => setFontSizeLevel(prev => Math.max(0, prev - 1))}
                className="px-1.5 py-0.5 hover:text-amber-300 font-bold"
                title="Decrease font size"
              >
                -
              </button>
              <span className="font-bold px-1 border-x border-white/20">T</span>
              <button
                onClick={() => setFontSizeLevel(prev => Math.min(2, prev + 1))}
                className="px-1.5 py-0.5 hover:text-amber-300 font-bold"
                title="Increase font size"
              >
                +
              </button>
            </div>

            {/* Pause / Resume Test Button */}
            <button
              onClick={() => setIsPaused(prev => !prev)}
              className={`text-xs font-bold px-3 py-1.5 rounded transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                isPaused
                  ? "bg-amber-400 hover:bg-amber-300 text-slate-900 ring-2 ring-amber-300 font-extrabold animate-pulse shadow-md"
                  : "bg-white text-[#1B4F72] hover:bg-slate-100"
              }`}
              title={isPaused ? "Click to Resume Test" : "Click to Pause Test"}
            >
              {isPaused ? <Play size={13} fill="currentColor" /> : <Pause size={13} />}
              <span>{isPaused ? "Resume Test" : "Pause Test"}</span>
            </button>
          </div>
        </header>

        {/* 2. Sub-Header: Section Tabs & Live Section Countdown Timer */}
        <div className="h-10 bg-slate-100 border-b border-slate-300 px-4 flex items-center justify-between shrink-0">
          {/* Section Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-500 px-2 py-1 rounded bg-slate-200/80 cursor-not-allowed hidden sm:inline-block">
              Handwriting Sample
            </span>

            {sectionsConfig.map((sec, idx) => {
              const isCurrent = idx === currentSectionIndex;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (idx !== currentSectionIndex) {
                      setShowSectionInfoModal(sec);
                    }
                  }}
                  className={`text-xs font-bold px-3 py-1 rounded flex items-center gap-1.5 transition-colors ${
                    isCurrent
                      ? "bg-[#cce5ff] text-[#004085] border border-[#b8daff]"
                      : "text-slate-600 hover:bg-slate-200/70"
                  }`}
                >
                  <span>{sec.name}</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSectionInfoModal(sec);
                    }}
                    title="Section Information"
                    className="w-3.5 h-3.5 rounded-full bg-blue-500/20 text-blue-700 flex items-center justify-center text-[10px] hover:bg-blue-500 hover:text-white"
                  >
                    ℹ
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Section Countdown Timer */}
          <div className="flex items-center gap-2 font-bold text-xs md:text-sm text-slate-800 shrink-0">
            <Clock size={16} className={isPaused ? "text-amber-600 animate-bounce" : "text-rose-600 animate-pulse"} />
            <span>Time Left :</span>
            <span className={`font-mono text-base px-2 py-0.5 rounded border ${
              isPaused
                ? "text-amber-800 bg-amber-100 border-amber-300 font-extrabold animate-pulse"
                : "text-rose-600 bg-rose-50 border-rose-200"
            }`}>
              {formatTime(sectionTimeLeft)} {isPaused && "(PAUSED)"}
            </span>
          </div>
        </div>

        {/* 3. Section Title & Language Sub-bar */}
        <div className="h-8 bg-slate-50 border-b border-slate-200 px-4 flex items-center justify-between text-xs shrink-0">
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <span>{currentSection.name}</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500 font-normal">
              Question {currentQIndexInSection + 1} of {currentSectionQuestions.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">View in:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="border border-slate-300 rounded px-2 py-0.5 bg-white text-xs text-slate-800"
            >
              <option value="English">English</option>
              <option value="Tamil">Tamil</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>
        </div>

        {/* 4. Main Exam Layout: 3 Columns (Left: Directions & Context / Middle: Question & Options / Right: Palette) */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Column: Directions & Context (Passage text + Charts/Tables/Diagrams) */}
          {hasContext && !isDirectionsCollapsed && (
            <div className="w-[36%] lg:w-[33%] xl:w-[32%] shrink-0 border-r border-slate-300 p-4 md:p-5 overflow-y-auto bg-slate-50/70 space-y-3.5 leading-relaxed transition-all">
              <div className="font-bold text-xs text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <BookOpen size={14} className="text-[#1B4F72]" />
                  <span>Directions &amp; Context</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDirectionsCollapsed(true)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded bg-white hover:bg-slate-200 border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Collapse Directions panel"
                >
                  <span>Hide</span>
                  <span>◀</span>
                </button>
              </div>

              {activeQuestion?.passage && (
                <FormattedPassage
                  passage={activeQuestion.passage}
                  className={`${contentFontSizeClass} text-slate-800 font-serif leading-relaxed text-xs sm:text-sm`}
                />
              )}

              {/* All Charts, Tables, Bar Charts, and Diagrams are rendered cleanly with controlled max height */}
              {contextImages.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  {contextImages.map((imgUrl, imgIdx) => (
                    <div key={imgIdx} className="rounded-xl border border-slate-200 p-2.5 bg-white shadow-2xs max-w-full group relative">
                      <img
                        src={imgUrl}
                        alt={`Directions Context Diagram ${imgIdx + 1}`}
                        onClick={() => setZoomedDiagramUrl(imgUrl)}
                        className="w-full h-auto object-contain max-h-[220px] md:max-h-[250px] mx-auto rounded cursor-zoom-in hover:opacity-95 transition-all"
                        title="Click to view enlarged diagram"
                      />
                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => setZoomedDiagramUrl(imgUrl)}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          🔍 Click to Enlarge Diagram
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Collapsed Directions Tab button */}
          {hasContext && isDirectionsCollapsed && (
            <button
              type="button"
              onClick={() => setIsDirectionsCollapsed(false)}
              className="w-7 bg-blue-50 hover:bg-blue-100 border-r border-blue-200 text-[#1B4F72] flex flex-col items-center justify-center py-4 text-xs font-bold gap-2 cursor-pointer shadow-2xs transition-colors shrink-0"
              title="Expand Directions & Context"
            >
              <BookOpen size={13} />
              <span className="[writing-mode:vertical-rl] tracking-wider text-[10px] font-extrabold uppercase">Directions</span>
              <span className="text-[10px]">▶</span>
            </button>
          )}

          {/* Middle Column: Question Prompt & Options Radio List ONLY */}
          <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-5">
            {/* Question Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="font-bold text-sm md:text-base text-slate-900">
                Question No. {currentQIndexInSection + 1} :
              </h2>
              <div className="text-[11px] font-semibold text-slate-500">
                Marks: <span className="text-emerald-600 font-bold">+1.00</span> | <span className="text-rose-600 font-bold">-0.25</span>
              </div>
            </div>

            {/* Question Text */}
            <div className={`${contentFontSizeClass} font-semibold text-slate-900 leading-relaxed`}>
              {activeQuestion.question}
            </div>

            {/* Options Radio List */}
            <div className="space-y-2.5 pt-2">
              {(activeQuestion.options || []).map((opt, optIdx) => {
                const isSelected = answers[activeQuestion.id] === optIdx;
                const letter = String.fromCharCode(65 + optIdx);
                return (
                  <label
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/70 border-blue-400 font-semibold shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q_radio_${activeQuestion.id}`}
                      checked={isSelected}
                      onChange={() => handleSelectOption(optIdx)}
                      className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1 text-slate-800 text-xs md:text-sm">
                      <span className="font-bold mr-2 text-slate-500">{letter}.</span>
                      <span>{opt}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Collapsible Divider Arrow */}
          <button
            onClick={() => setIsPaletteCollapsed(prev => !prev)}
            className="w-5 bg-slate-200 hover:bg-slate-300 border-x border-slate-300 flex items-center justify-center text-slate-600 text-xs font-bold transition-colors cursor-pointer shrink-0"
            title={isPaletteCollapsed ? "Expand Question Palette" : "Collapse Question Palette"}
          >
            {isPaletteCollapsed ? "<" : ">"}
          </button>

          {/* Right Column: Candidate Info & Question Palette */}
          {!isPaletteCollapsed && (
            <div className="w-80 md:w-96 border-l border-slate-300 bg-white flex flex-col shrink-0 overflow-hidden">
              {/* Top: Instructions Button & Candidate Profile */}
              <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <button
                  onClick={() => setShowInstructionsModal(true)}
                  className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                >
                  <Info size={14} /> Instructions
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 text-xs font-bold">
                    <User size={16} />
                  </div>
                  <div className="text-[11px] leading-tight text-right">
                    <p className="font-bold text-slate-800">{user?.name || "Student Aspirant"}</p>
                    <p className="text-slate-500">Roll: *********123</p>
                  </div>
                </div>
              </div>

              {/* Status Legend Box (Exact IBPS styling) */}
              <div className="p-3 border-b border-slate-200 grid grid-cols-2 gap-2 text-[11px] text-slate-700 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-5 rounded bg-[#28a745] text-white flex items-center justify-center font-bold text-[10px]">
                    {sectionCounts.answered}
                  </span>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    style={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 70%, 50% 100%, 0% 70%)" }}
                    className="w-6 h-5 bg-[#d9534f] text-white flex items-center justify-center font-bold text-[10px]"
                  >
                    {sectionCounts.notAnswered}
                  </span>
                  <span>Not Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-5 rounded bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                    {sectionCounts.notVisited}
                  </span>
                  <span>Not Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#6f42c1] text-white flex items-center justify-center font-bold text-[10px]">
                    {sectionCounts.review}
                  </span>
                  <span>Mark For Review</span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#6f42c1] text-white flex items-center justify-center font-bold text-[10px] relative shrink-0">
                    {sectionCounts.ansReview}
                    <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400 border border-white" />
                  </span>
                  <span>Answered &amp; Mark for Review</span>
                </div>
              </div>

              {/* Section Header Band */}
              <div className="bg-[#1B4F72] text-white text-xs font-bold py-1.5 px-3 uppercase tracking-wider">
                {currentSection.name}
              </div>

              {/* Question Palette Grid */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="grid grid-cols-5 gap-2.5">
                  {currentSectionQuestions.map((q, qIdx) => renderPaletteBadge(q, qIdx))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Bottom Action Bar */}
        <footer className="h-14 border-t border-slate-300 bg-slate-50 px-4 md:px-6 flex items-center justify-between shrink-0">
          {/* Left Buttons: Mark for Review & Next, Clear Response */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkForReviewAndNext}
              className="px-3.5 py-2 bg-[#1B4F72] hover:bg-[#153e5b] text-white text-xs font-bold rounded shadow-xs transition-colors"
            >
              Mark for Review &amp; Next
            </button>
            <button
              onClick={handleClearResponse}
              className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded shadow-xs transition-colors"
            >
              Clear Response
            </button>
          </div>

          {/* Right Buttons: Save & Next, SUBMIT SECTION */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveAndNext}
              className="px-6 py-2 bg-[#1B4F72] hover:bg-[#153e5b] text-white text-xs font-bold rounded shadow-xs transition-colors"
            >
              Save &amp; Next
            </button>

            <button
              onClick={() => setShowSectionSubmitConfirm(true)}
              className="px-6 py-2 bg-[#004085] hover:bg-[#002752] text-white text-xs font-extrabold rounded shadow transition-colors uppercase tracking-wider"
            >
              {currentSectionIndex === sectionsConfig.length - 1 ? "Submit Test" : "Submit Section"}
            </button>
          </div>
        </footer>

        {/* ----------------------------------------------------- */}
        {/* MODAL: Submit Section Confirmation Summary */}
        {/* ----------------------------------------------------- */}
        {showSectionSubmitConfirm && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
              <div className="bg-[#1B4F72] text-white px-5 py-3.5 flex items-center justify-between font-bold text-sm">
                <span>Section Submission Summary</span>
                <button onClick={() => setShowSectionSubmitConfirm(false)} className="hover:text-slate-300">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <p className="font-semibold text-slate-800">
                  Are you sure you want to submit <strong>{currentSection.name}</strong>? Below is your response summary:
                </p>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                      <tr>
                        <th className="p-2.5">Section Name</th>
                        <th className="p-2.5 text-center">Total</th>
                        <th className="p-2.5 text-center text-emerald-600">Answered</th>
                        <th className="p-2.5 text-center text-rose-600">Not Answered</th>
                        <th className="p-2.5 text-center text-purple-600">Review</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="p-2.5 font-bold text-slate-800">{currentSection.name}</td>
                        <td className="p-2.5 text-center">{currentSectionQuestions.length}</td>
                        <td className="p-2.5 text-center font-bold text-emerald-600">{sectionCounts.answered}</td>
                        <td className="p-2.5 text-center font-bold text-rose-600">{sectionCounts.notAnswered}</td>
                        <td className="p-2.5 text-center font-bold text-purple-600">{sectionCounts.review + sectionCounts.ansReview}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {currentSectionIndex < sectionsConfig.length - 1 ? (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    ℹ Submitting this section will lock your responses for <strong>{currentSection.name}</strong> and immediately begin the next section (<strong>{sectionsConfig[currentSectionIndex + 1]?.name}</strong>).
                  </p>
                ) : (
                  <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                    ✓ This is the final section. Submitting will calculate your final exam score and generate your performance report.
                  </p>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setShowSectionSubmitConfirm(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  No, Continue Test
                </button>
                <button
                  onClick={proceedNextSectionOrFinish}
                  className="px-5 py-2 bg-[#1B4F72] hover:bg-[#153e5b] text-white rounded text-xs font-bold shadow"
                >
                  Yes, Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------- */}
        {/* MODAL: Test Paused */}
        {/* ----------------------------------------------------- */}
        {isPaused && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <Pause size={28} />
              </div>
              <h3 className="font-bold text-base text-slate-800">Test Paused</h3>
              <p className="text-xs text-slate-500">
                Your examination timer has been temporarily halted. Click Resume whenever you are ready to continue.
              </p>
              <button
                onClick={() => setIsPaused(false)}
                className="w-full py-2.5 bg-[#1B4F72] hover:bg-[#153e5b] text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-2"
              >
                <Play size={15} /> Resume Test
              </button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------- */}
        {/* MODAL: Section Info */}
        {/* ----------------------------------------------------- */}
        {showSectionInfoModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-sm text-[#1B4F72] flex items-center gap-2">
                  <Info size={16} /> Section Information
                </h3>
                <button onClick={() => setShowSectionInfoModal(null)}>
                  <X size={18} />
                </button>
              </div>
              <div className="text-xs space-y-2 text-slate-700">
                <p><strong>Section:</strong> {showSectionInfoModal.name}</p>
                <p><strong>Duration:</strong> {showSectionInfoModal.durationMinutes || 20} Minutes</p>
                <p><strong>Total Questions:</strong> {showSectionInfoModal.questionCount || (sectionQuestionsMap[showSectionInfoModal.name]?.length || 35)}</p>
                <p><strong>Marking Scheme:</strong> +1.00 Correct / -0.25 Incorrect</p>
                <p className="text-slate-500 italic pt-2">
                  * Note: In Banking Prelims exams, sections must be attempted in fixed order with individual sectional timing.
                </p>
              </div>
              <button
                onClick={() => setShowSectionInfoModal(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold mt-2"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------- */}
        {/* MODAL: Instructions Popup during Exam */}
        {/* ----------------------------------------------------- */}
        {showInstructionsModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden">
              <div className="bg-[#1B4F72] text-white px-5 py-3.5 flex items-center justify-between font-bold text-sm">
                <span>Examination Instructions</span>
                <button onClick={() => setShowInstructionsModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 overflow-y-auto space-y-3 text-xs text-slate-700 leading-relaxed">
                <p><strong>1. Sectional Timing:</strong> Each section has its own allocated time. When the section timer expires, the section is submitted automatically.</p>
                <p><strong>2. Question Palette:</strong></p>
                <div className="space-y-1.5 pl-2 text-[11px]">
                  <p>• Green badge: Answered</p>
                  <p>• Red shield badge: Not Answered</p>
                  <p>• Gray square badge: Not Visited</p>
                  <p>• Purple circle: Marked for Review</p>
                  <p>• Purple circle + green dot: Answered &amp; Marked for Review</p>
                </div>
                <p><strong>3. Saving Answers:</strong> Click Save &amp; Next to record your response. Click Clear Response to remove your selected option.</p>
              </div>
              <div className="p-3 bg-slate-50 border-t flex justify-end">
                <button
                  onClick={() => setShowInstructionsModal(false)}
                  className="px-4 py-2 bg-[#1B4F72] text-white rounded text-xs font-bold"
                >
                  Back to Exam
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------- */}
        {/* MODAL: Zoomed Diagram / Chart Viewer */}
        {/* ----------------------------------------------------- */}
        {zoomedDiagramUrl && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
            onClick={() => setZoomedDiagramUrl(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[#1B4F72] text-white px-5 py-3 flex items-center justify-between font-bold text-xs">
                <span>Enlarged Context Diagram / Chart</span>
                <button
                  type="button"
                  onClick={() => setZoomedDiagramUrl(null)}
                  className="hover:text-slate-300 text-xs font-bold px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
              <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-100/50">
                <img
                  src={zoomedDiagramUrl}
                  alt="Enlarged Diagram Preview"
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================
  // =========================================================
  // SCREEN 3: RESULTS & DETAILED ANALYSIS SCREEN (SmartKeeda Style)
  // =========================================================
  if (screenPhase === "results") {
    return (
      <TestAnalysisView
        attempt={resultsData}
        initialTab="overview"
        onRetake={() => {
          setScreenPhase("instructions");
          setAnswers({});
          setStatus({});
          setVisited({});
          setCurrentSectionIndex(0);
          setCurrentQIndexInSection(0);
          setIsPaused(false);
        }}
        onClose={onClose}
      />
    );
  }

  // =========================================================
  // SCREEN 4: SOLUTIONS & DETAILED REVIEW
  // =========================================================
  if (screenPhase === "solutions") {
    return (
      <TestAnalysisView
        attempt={resultsData}
        initialTab="solution"
        onRetake={() => {
          setScreenPhase("instructions");
          setAnswers({});
          setStatus({});
          setVisited({});
          setCurrentSectionIndex(0);
          setCurrentQIndexInSection(0);
          setIsPaused(false);
        }}
        onClose={onClose}
      />
    );
  }

  return null;
}
