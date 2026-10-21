import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, Flag, Target, Award, Grid, Clock,
  HelpCircle, ThumbsUp, ThumbsDown, Share2, Star, RotateCcw,
  BookOpen, ChevronRight, ChevronLeft, Eye, TrendingUp, AlertCircle,
  BarChart2, Zap, Check, X, ShieldAlert, Sparkles, Printer
} from "lucide-react";
import { useApp } from "../store.jsx";
import { useAuth } from "../auth.jsx";
import BeginnerSolutionView from "./BeginnerSolutionView.jsx";
import FormattedPassage from "./FormattedPassage.jsx";

export default function TestAnalysisView({ attempt, onRetake, onClose, initialTab = "overview" }) {
  const { pushToast } = useApp();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(initialTab); // "overview" | "solution" | "compare" | "strongWeak" | "speed"
  const [marksAnalysisSubtab, setMarksAnalysisSubtab] = useState("topper"); // "topper" | "past"
  const [selectedRating, setSelectedRating] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Solution View filters and state
  const [solutionSectionFilter, setSolutionSectionFilter] = useState("all");
  const [solutionStatusFilter, setSolutionStatusFilter] = useState("all"); // "all" | "correct" | "incorrect" | "unattempted"
  const [currentSolutionQIndex, setCurrentSolutionQIndex] = useState(0);

  if (!attempt) return null;

  const totalMarks = attempt.totalMarks || 100;
  const score = attempt.score !== undefined ? attempt.score : 0;
  const cutoffMarks = attempt.cutoffMarks || +(totalMarks * 0.625).toFixed(1);
  const percentage = attempt.percentage !== undefined ? attempt.percentage : +((score / totalMarks) * 100).toFixed(2);
  const accuracy = attempt.accuracy !== undefined ? attempt.accuracy : 0;
  const percentile = attempt.percentile !== undefined ? attempt.percentile : 0;

  const isClearedCutoff = score >= cutoffMarks;
  const diffMarks = Math.abs(+(cutoffMarks - score).toFixed(2));

  // Sections breakdown
  const sections = Array.isArray(attempt.sectionsBreakdown) && attempt.sectionsBreakdown.length > 0
    ? attempt.sectionsBreakdown
    : [
        {
          name: "Quantitative Aptitude",
          questionCount: 35,
          correct: 7,
          incorrect: 5,
          unattempted: 23,
          timeTaken: "20 Mins",
          cutoff: 6,
          score: 5.75,
          percentage: 16.0,
          percentile: 12.82
        },
        {
          name: "English Language",
          questionCount: 30,
          correct: 5,
          incorrect: 9,
          unattempted: 16,
          timeTaken: "20 Mins",
          cutoff: 6,
          score: 2.75,
          percentage: 9.0,
          percentile: 19.52
        },
        {
          name: "Reasoning Aptitude",
          questionCount: 35,
          correct: 4,
          incorrect: 5,
          unattempted: 26,
          timeTaken: "20 Mins",
          cutoff: 7,
          score: 2.75,
          percentage: 8.0,
          percentile: 14.26
        }
      ];

  // Total summary counts
  const totalCorrect = sections.reduce((acc, s) => acc + (s.correct || 0), 0);
  const totalIncorrect = sections.reduce((acc, s) => acc + (s.incorrect || 0), 0);
  const totalUnattempted = sections.reduce((acc, s) => acc + (s.unattempted || 0), 0);
  const totalQuestions = sections.reduce((acc, s) => acc + (s.questionCount || 0), 0) || totalMarks;

  // Filter solutions questions
  const allQuestions = Array.isArray(attempt.questions) ? attempt.questions : [];
  const candidateAnswers = attempt.answers || {};

  const filteredQuestions = allQuestions.filter((q, idx) => {
    // Section filter
    if (solutionSectionFilter !== "all" && (q.section || "General") !== solutionSectionFilter) {
      return false;
    }
    // Status filter
    const ans = candidateAnswers[q.id];
    const isCorrect = ans !== undefined && ans === q.correctAnswerIndex;
    const isIncorrect = ans !== undefined && ans !== q.correctAnswerIndex;
    const isUnattempted = ans === undefined;

    if (solutionStatusFilter === "correct" && !isCorrect) return false;
    if (solutionStatusFilter === "incorrect" && !isIncorrect) return false;
    if (solutionStatusFilter === "unattempted" && !isUnattempted) return false;

    return true;
  });

  const activeSolutionQ = filteredQuestions[currentSolutionQIndex] || allQuestions[0];
  const activeSolutionStudentAns = activeSolutionQ ? candidateAnswers[activeSolutionQ.id] : undefined;
  const isCurrentQCorrect = activeSolutionStudentAns !== undefined && activeSolutionStudentAns === activeSolutionQ?.correctAnswerIndex;

  const handleShare = () => {
    const text = `🎯 My Score on ${attempt.testTitle || "Mock Test"}: ${score}/${totalMarks} (Percentile: ${percentile}% · Accuracy: ${accuracy}%) on KEN IAS ACADEMY!`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      pushToast("Scorecard summary copied to clipboard! 📋");
    } else {
      pushToast(text);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden">
      {/* 1. Header Bar */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors shrink-0"
            title="Go back to test series"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              Full Length Mock Test Analysis
            </div>
            <h1 className="font-extrabold text-sm md:text-base text-slate-900 truncate">
              {attempt.testTitle || "IBPS Clerk Mock Test"}
            </h1>
          </div>
        </div>

        {/* Center Brand */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1B4F72] text-white flex items-center justify-center font-black text-xs">
            K
          </div>
          <div className="text-left leading-tight">
            <span className="font-bold text-xs text-[#1B4F72] block">KEN IAS ACADEMY</span>
            <span className="text-[10px] text-slate-500 font-medium">Smart Mock Test Analysis</span>
          </div>
        </div>

        {/* Candidate Avatar & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700"
            title="Print Scorecard"
          >
            <Printer size={14} /> Print
          </button>
          <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-xs uppercase">
            {user?.name ? user.name[0] : "S"}
          </div>
        </div>
      </header>

      {/* 2. Top Summary Metric Cards (5 Badges in a Row matching Screenshot 1) */}
      <div className="bg-slate-50/70 border-b border-slate-200 px-4 md:px-8 py-4 shrink-0">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 1. Cut Off Marks */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
                <Flag size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500">Cut Off Marks:</p>
                <p className="text-base md:text-lg font-black text-slate-800">
                  {cutoffMarks} <span className="text-xs text-slate-400 font-semibold">/{totalMarks}</span>
                </p>
              </div>
            </div>

            {/* 2. Your Marks */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500">Your Marks:</p>
                <p className="text-base md:text-lg font-black text-emerald-600">
                  {score} <span className="text-xs text-slate-400 font-semibold">/{totalMarks}</span>
                </p>
              </div>
            </div>

            {/* 3. Percentage */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-200/60 flex items-center justify-center shrink-0">
                <Grid size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500">Percentage:</p>
                <p className="text-base md:text-lg font-black text-sky-700">
                  {percentage}%
                </p>
              </div>
            </div>

            {/* 4. Accuracy */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0">
                <Target size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500">Accuracy:</p>
                <p className="text-base md:text-lg font-black text-purple-700">
                  {accuracy}%
                </p>
              </div>
            </div>

            {/* 5. Percentile */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 flex items-center justify-center shrink-0">
                <Award size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500">Percentile:</p>
                <p className="text-base md:text-lg font-black text-orange-700">
                  {percentile}%
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Insight Banner & Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="flex-1 bg-[#e8f4fd] border border-[#b8daff] rounded-xl px-4 py-2.5 flex items-center gap-3 text-xs text-[#004085]">
              <TrendingUp size={18} className="text-[#0c5460] shrink-0" />
              <div className="font-semibold">
                <span className="font-bold text-[#0c5460]">Insight: </span>
                {isClearedCutoff ? (
                  <span>
                    🎉 Excellent! You have cleared the cutoff mark by <strong>{diffMarks} marks</strong>! Keep up the momentum.
                  </span>
                ) : (
                  <span>
                    You still need <strong>{diffMarks} marks</strong> to reach the cutoff marks ({cutoffMarks}/{totalMarks}).
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowRatingModal(true)}
                className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Star size={14} className="text-amber-500 fill-amber-500" />
                <span>Rate this test ⭐</span>
              </button>
              <button
                onClick={handleShare}
                className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Share2 size={14} className="text-rose-500" />
                <span>Share &amp; win</span>
              </button>
              {onRetake && (
                <button
                  onClick={onRetake}
                  className="px-3.5 py-2 bg-[#1B4F72] hover:bg-[#153e5b] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <RotateCcw size={14} />
                  <span>Retake Test</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sub-nav Tabs (SmartKeeda Style Navigation) */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 shrink-0 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-6 text-xs md:text-sm font-bold text-slate-600">
          {[
            { id: "overview", label: "Overview" },
            { id: "solution", label: "Solution" },
            { id: "compare", label: "Compare" },
            { id: "strongWeak", label: "Strong Vs Weak Areas" },
            { id: "speed", label: "Speed & Accuracy" },
            { id: "marksPercentile", label: "Marks vs Percentile" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 relative whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "text-rose-600 font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeAnalysisTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* SUMMARY Header & Metadata */}
              <div className="space-y-4">
                <h2 className="text-center font-extrabold text-sm md:text-base text-slate-800 tracking-wider uppercase">
                  SUMMARY
                </h2>

                <div className="flex flex-col md:flex-row items-center justify-between text-xs text-slate-600 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs gap-3">
                  <div className="space-y-1 text-center md:text-left">
                    <p>
                      <strong>Started on:</strong> {attempt.startedAt || "Today, 3:54:08 PM"}
                    </p>
                    <p>
                      <strong>Completed on:</strong> {attempt.completedAt || "Today, 4:54:28 PM"}
                    </p>
                  </div>
                  <div className="space-y-1 text-center md:text-right">
                    <p>
                      <strong>Test Time Limit:</strong> {formatSecsToHMS(attempt.totalDurationSeconds || 3600)}
                    </p>
                    <p>
                      <strong>Time taken:</strong> {formatSecsToHMS(attempt.timeSpentSeconds || 3600)}
                    </p>
                    <p className="font-bold text-[#1B4F72]">
                      <strong>Rank:</strong> {attempt.rank || "126431/130997"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section Breakdown Table (Matching Screenshot 1 exactly) */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs md:text-sm">
                    {/* Header */}
                    <thead className="bg-[#e9f2f8] text-slate-700 border-b border-slate-200 font-bold">
                      <tr>
                        <th className="p-3.5 pl-5">Section</th>
                        <th className="p-3.5 text-center">No. of Ques.</th>
                        <th className="p-3.5 text-center min-w-[200px]">
                          <div className="flex items-center justify-center gap-3 text-[11px] font-semibold text-slate-600">
                            <span className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" /> Correct
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" /> Incorrect
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-xs bg-slate-300 inline-block" /> Unattempted
                            </span>
                          </div>
                        </th>
                        <th className="p-3.5 text-center">Time Taken</th>
                        <th className="p-3.5 text-center">Cut off</th>
                        <th className="p-3.5 text-center">Score</th>
                        <th className="p-3.5 text-center pr-5">Percentile</th>
                      </tr>
                    </thead>

                    {/* Body */}
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {sections.map((sec, idx) => {
                        const secCutoff = sec.cutoff || 6;
                        const secScore = sec.score !== undefined ? sec.score : 0;
                        const isSecPass = secScore >= secCutoff;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            {/* Section Name */}
                            <td className="p-3.5 pl-5 font-bold text-slate-900">
                              {sec.name}
                            </td>

                            {/* No. of Questions */}
                            <td className="p-3.5 text-center font-semibold text-slate-700">
                              {sec.questionCount}
                            </td>

                            {/* Horizontal Stacked Bar */}
                            <td className="p-3.5">
                              <div className="h-6 w-full max-w-xs mx-auto rounded-full bg-slate-200 overflow-hidden flex items-center text-[10px] font-black text-white shadow-inner">
                                {sec.correct > 0 && (
                                  <div
                                    style={{ width: `${(sec.correct / sec.questionCount) * 100}%` }}
                                    className="h-full bg-emerald-500 flex items-center justify-center px-1"
                                    title={`Correct: ${sec.correct}`}
                                  >
                                    {sec.correct}
                                  </div>
                                )}
                                {sec.incorrect > 0 && (
                                  <div
                                    style={{ width: `${(sec.incorrect / sec.questionCount) * 100}%` }}
                                    className="h-full bg-rose-500 flex items-center justify-center px-1"
                                    title={`Incorrect: ${sec.incorrect}`}
                                  >
                                    {sec.incorrect}
                                  </div>
                                )}
                                {sec.unattempted > 0 && (
                                  <div
                                    style={{ width: `${(sec.unattempted / sec.questionCount) * 100}%` }}
                                    className="h-full bg-slate-300 text-slate-700 flex items-center justify-center px-1"
                                    title={`Unattempted: ${sec.unattempted}`}
                                  >
                                    {sec.unattempted}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Time Taken */}
                            <td className="p-3.5 text-center text-slate-600">
                              {sec.timeTaken || "20 Mins"}
                            </td>

                            {/* Cut off */}
                            <td className="p-3.5 text-center text-slate-700">
                              {secCutoff}
                            </td>

                            {/* Score with Thumbs Up/Down */}
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {isSecPass ? (
                                  <ThumbsUp size={14} className="text-emerald-600 shrink-0" />
                                ) : (
                                  <ThumbsDown size={14} className="text-rose-500 shrink-0" />
                                )}
                                <span className={isSecPass ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"}>
                                  {secScore}/{sec.questionCount}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  ({(sec.percentage || 0).toFixed(2)}%)
                                </span>
                              </div>
                            </td>

                            {/* Percentile */}
                            <td className="p-3.5 pr-5 text-center font-bold text-slate-700">
                              {sec.percentile || "0.00"}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Overall Summary Row */}
                      <tr className="bg-slate-50/90 font-bold text-slate-900 border-t-2 border-slate-300">
                        <td className="p-3.5 pl-5 font-black text-slate-900">Overall</td>
                        <td className="p-3.5 text-center font-black">{totalQuestions}</td>
                        <td className="p-3.5">
                          <div className="h-6 w-full max-w-xs mx-auto rounded-full bg-slate-200 overflow-hidden flex items-center text-[10px] font-black text-white shadow-inner">
                            {totalCorrect > 0 && (
                              <div
                                style={{ width: `${(totalCorrect / totalQuestions) * 100}%` }}
                                className="h-full bg-emerald-500 flex items-center justify-center px-1"
                              >
                                {totalCorrect}
                              </div>
                            )}
                            {totalIncorrect > 0 && (
                              <div
                                style={{ width: `${(totalIncorrect / totalQuestions) * 100}%` }}
                                className="h-full bg-rose-500 flex items-center justify-center px-1"
                              >
                                {totalIncorrect}
                              </div>
                            )}
                            {totalUnattempted > 0 && (
                              <div
                                style={{ width: `${(totalUnattempted / totalQuestions) * 100}%` }}
                                className="h-full bg-slate-300 text-slate-700 flex items-center justify-center px-1"
                              >
                                {totalUnattempted}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-center text-slate-700">
                          {formatSecsToHMS(attempt.timeSpentSeconds || 3600)}
                        </td>
                        <td className="p-3.5 text-center font-black">{cutoffMarks}</td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isClearedCutoff ? (
                              <ThumbsUp size={14} className="text-emerald-600 shrink-0" />
                            ) : (
                              <ThumbsDown size={14} className="text-rose-500 shrink-0" />
                            )}
                            <span className={isClearedCutoff ? "text-emerald-700 font-extrabold" : "text-rose-600 font-extrabold"}>
                              {score}/{totalMarks}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ({percentage}%)
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 pr-5 text-center font-black text-[#1B4F72]">
                          {percentile}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Marks Analysis Section (Topper vs You) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-extrabold text-base text-slate-900">Marks Analysis</h3>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <button
                      onClick={() => setMarksAnalysisSubtab("topper")}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        marksAnalysisSubtab === "topper"
                          ? "bg-[#1B4F72] text-white"
                          : "bg-white border text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Topper vs You
                    </button>
                    <button
                      onClick={() => setMarksAnalysisSubtab("past")}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        marksAnalysisSubtab === "past"
                          ? "bg-[#1B4F72] text-white"
                          : "bg-white border text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Your Past vs You
                    </button>
                  </div>
                </div>

                {marksAnalysisSubtab === "topper" ? (
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Topper Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-600">
                        <span>Rank #1 (Topper)</span>
                        <Award size={16} />
                      </div>
                      <div className="text-2xl font-black text-slate-900">
                        91.25 <span className="text-xs text-slate-400">/ 100</span>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                        <p className="flex justify-between">
                          <span>Accuracy:</span>
                          <strong className="text-emerald-600">96.8%</strong>
                        </p>
                        <p className="flex justify-between">
                          <span>Time / Question:</span>
                          <strong>38s</strong>
                        </p>
                        <p className="flex justify-between">
                          <span>Attempted:</span>
                          <strong>94 Qs</strong>
                        </p>
                      </div>
                    </div>

                    {/* Average Candidate */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-blue-600">
                        <span>Average Performer</span>
                        <BarChart2 size={16} />
                      </div>
                      <div className="text-2xl font-black text-slate-900">
                        48.50 <span className="text-xs text-slate-400">/ 100</span>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                        <p className="flex justify-between">
                          <span>Accuracy:</span>
                          <strong className="text-blue-600">68.4%</strong>
                        </p>
                        <p className="flex justify-between">
                          <span>Time / Question:</span>
                          <strong>52s</strong>
                        </p>
                        <p className="flex justify-between">
                          <span>Attempted:</span>
                          <strong>62 Qs</strong>
                        </p>
                      </div>
                    </div>

                    {/* Your Performance */}
                    <div className="bg-white rounded-2xl border-2 border-[#1B4F72] p-5 space-y-3 relative shadow-xs">
                      <div className="flex items-center justify-between text-xs font-bold text-[#1B4F72]">
                        <span>Your Performance</span>
                        <Target size={16} />
                      </div>
                      <div className="text-2xl font-black text-[#1B4F72]">
                        {score} <span className="text-xs text-slate-400">/ {totalMarks}</span>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                        <p className="flex justify-between">
                          <span>Accuracy:</span>
                          <strong className="text-purple-700">{accuracy}%</strong>
                        </p>
                        <p className="flex justify-between">
                          <span>Time / Question:</span>
                          <strong>{Math.max(1, Math.round((attempt.timeSpentSeconds || 3600) / totalQuestions))}s</strong>
                        </p>
                        <p className="flex justify-between">
                          <span>Attempted:</span>
                          <strong>{totalCorrect + totalIncorrect} Qs</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-2">
                    <p className="font-bold text-sm text-slate-800">Historical Comparison Active</p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      All your previous attempts are tracked on the KEN IAS Academy database. Attempt this mock test again to view your progress trend graph!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DETAILED SOLUTION REVIEW */}
          {activeTab === "solution" && (
            <div className="space-y-6">
              {/* Filter Sub-bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                {/* Section filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-xs font-bold text-slate-500 mr-1">Section:</span>
                  <button
                    onClick={() => { setSolutionSectionFilter("all"); setCurrentSolutionQIndex(0); }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      solutionSectionFilter === "all"
                        ? "bg-[#1B4F72] text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    All Sections
                  </button>
                  {sections.map(s => (
                    <button
                      key={s.name}
                      onClick={() => { setSolutionSectionFilter(s.name); setCurrentSolutionQIndex(0); }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        solutionSectionFilter === s.name
                          ? "bg-[#1B4F72] text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500 mr-1">Filter:</span>
                  {[
                    { id: "all", label: `All (${filteredQuestions.length})` },
                    { id: "correct", label: "Correct", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
                    { id: "incorrect", label: "Incorrect", color: "text-rose-700 bg-rose-50 border-rose-200" },
                    { id: "unattempted", label: "Unattempted", color: "text-slate-700 bg-slate-100 border-slate-200" }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => { setSolutionStatusFilter(f.id); setCurrentSolutionQIndex(0); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        solutionStatusFilter === f.id
                          ? "bg-slate-900 text-white border-slate-900"
                          : f.color || "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Solution Card & Question Navigator */}
              {filteredQuestions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                  No questions match your current filter. Try selecting "All".
                </div>
              ) : (
                <div className="grid lg:grid-cols-4 gap-6">
                  {/* Left: Active Question Details (3 Cols) */}
                  <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div className="font-bold text-sm text-slate-800">
                        Question No. {currentSolutionQIndex + 1} of {filteredQuestions.length} ({activeSolutionQ?.section || "General"})
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          activeSolutionStudentAns === undefined
                            ? "bg-slate-100 text-slate-600"
                            : isCurrentQCorrect
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}>
                          {activeSolutionStudentAns === undefined
                            ? "Unattempted (0 Marks)"
                            : isCurrentQCorrect
                            ? "✓ Correct (+1.00 Marks)"
                            : "✗ Incorrect (-0.25 Marks)"}
                        </span>
                      </div>
                    </div>

                    {/* Passage Context (if any) */}
                    {activeSolutionQ?.passage && (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 font-serif leading-relaxed">
                        <p className="font-bold font-sans text-slate-800 mb-1 flex items-center gap-1.5">
                          <BookOpen size={14} className="text-[#1B4F72]" /> Directions &amp; Context:
                        </p>
                        <FormattedPassage passage={activeSolutionQ.passage} />
                      </div>
                    )}

                    {/* Context Diagrams / Charts (Strictly rendered here) */}
                    {(activeSolutionQ?.imageUrl || activeSolutionQ?.chartImageUrl) && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 max-w-md mx-auto">
                        <img
                          src={activeSolutionQ.imageUrl || activeSolutionQ.chartImageUrl}
                          alt="Question Chart Context"
                          className="w-full max-h-72 object-contain rounded"
                        />
                      </div>
                    )}

                    {/* Question Statement */}
                    <div className="font-semibold text-sm md:text-base text-slate-900 leading-relaxed">
                      {activeSolutionQ?.question}
                    </div>

                    {/* Options list with visual color codes */}
                    <div className="space-y-2 pt-1">
                      {(activeSolutionQ?.options || []).map((opt, oIdx) => {
                        const isRightOpt = oIdx === activeSolutionQ.correctAnswerIndex;
                        const isUserChoice = activeSolutionStudentAns === oIdx;

                        let cardStyle = "bg-white border-slate-200 text-slate-700";
                        if (isRightOpt) {
                          cardStyle = "bg-emerald-50 border-emerald-400 font-bold text-emerald-950";
                        } else if (isUserChoice && !isRightOpt) {
                          cardStyle = "bg-rose-50 border-rose-300 font-bold text-rose-950";
                        }

                        return (
                          <div
                            key={oIdx}
                            className={`p-3 rounded-xl border text-xs md:text-sm flex items-center justify-between ${cardStyle}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-xs font-bold">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span>{opt}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold">
                              {isRightOpt && <span className="text-emerald-700">✓ Correct Answer</span>}
                              {isUserChoice && !isRightOpt && <span className="text-rose-600">Your Selection</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Detailed Beginner Step-by-Step Explanation Box */}
                    <div className="mt-4">
                      <BeginnerSolutionView
                        explanation={activeSolutionQ?.explanation || "The correct answer has been verified by Ken IAS Academy subject experts."}
                        correctAnswerIndex={activeSolutionQ?.correctAnswerIndex}
                        options={activeSolutionQ?.options}
                      />
                    </div>

                    {/* Bottom Nav */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                      <button
                        disabled={currentSolutionQIndex === 0}
                        onClick={() => setCurrentSolutionQIndex(prev => Math.max(0, prev - 1))}
                        className="px-4 py-2 border rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                      >
                        Previous
                      </button>
                      <span className="text-xs text-slate-500 font-semibold">
                        {currentSolutionQIndex + 1} / {filteredQuestions.length}
                      </span>
                      <button
                        disabled={currentSolutionQIndex === filteredQuestions.length - 1}
                        onClick={() => setCurrentSolutionQIndex(prev => Math.min(filteredQuestions.length - 1, prev + 1))}
                        className="px-4 py-2 bg-[#1B4F72] hover:bg-[#153e5b] text-white rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>

                  {/* Right: Question Number Grid (1 Col) */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs h-fit">
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                      Question Palette ({filteredQuestions.length})
                    </h4>

                    <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto pr-1">
                      {filteredQuestions.map((q, idx) => {
                        const sAns = candidateAnswers[q.id];
                        const right = sAns !== undefined && sAns === q.correctAnswerIndex;
                        let badgeBg = "bg-slate-100 text-slate-600";
                        if (sAns !== undefined) {
                          badgeBg = right ? "bg-emerald-600 text-white" : "bg-rose-600 text-white";
                        }

                        return (
                          <button
                            key={q.id || idx}
                            onClick={() => setCurrentSolutionQIndex(idx)}
                            className={`h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${badgeBg} ${
                              idx === currentSolutionQIndex ? "ring-2 ring-blue-500 scale-105" : ""
                            }`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMPARE & ANALYTICS */}
          {(activeTab === "compare" || activeTab === "strongWeak" || activeTab === "speed" || activeTab === "marksPercentile") && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="font-black text-base text-slate-900">
                  {activeTab === "compare" ? "Comprehensive Peer & Topper Comparison" : activeTab === "strongWeak" ? "Strong vs Weak Topic Areas" : "Speed & Accuracy Distribution"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed analytics computed from live test-taker cohorts across Tamil Nadu and National banking aspirants.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                  <p className="text-xs font-bold text-emerald-800">Your Strongest Section</p>
                  <p className="text-lg font-black text-emerald-900">
                    {sections.slice().sort((a, b) => (b.score || 0) - (a.score || 0))[0]?.name || "Reasoning"}
                  </p>
                  <p className="text-xs text-emerald-700">
                    Higher accuracy achieved with steady time management.
                  </p>
                </div>

                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 space-y-2">
                  <p className="text-xs font-bold text-rose-800">Needs Focus Area</p>
                  <p className="text-lg font-black text-rose-900">
                    {sections.slice().sort((a, b) => (a.score || 0) - (b.score || 0))[0]?.name || "Quantitative Aptitude"}
                  </p>
                  <p className="text-xs text-rose-700">
                    Target increasing question attempt speed and reducing negative penalty.
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
                  <p className="text-xs font-bold text-blue-800">Overall Accuracy</p>
                  <p className="text-lg font-black text-blue-900">{accuracy}%</p>
                  <p className="text-xs text-blue-700">
                    Aim for 85%+ accuracy for clearing Bank PO & Clerk Prelims cutoffs.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <h3 className="font-black text-base text-slate-800">Rate this Test</h3>
            <p className="text-xs text-slate-500">
              How was your experience taking {attempt.testTitle}? Your feedback helps our faculties craft better question papers.
            </p>
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  className="p-1 text-2xl cursor-pointer transition-transform hover:scale-125"
                >
                  <Star
                    size={28}
                    className={star <= selectedRating ? "text-amber-400 fill-amber-400" : "text-slate-300"}
                  />
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setShowRatingModal(false);
                pushToast("Thank you for your rating! ⭐");
              }}
              className="w-full py-2.5 bg-[#1B4F72] hover:bg-[#153e5b] text-white rounded-xl text-xs font-bold"
            >
              Submit Feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatSecsToHMS(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
