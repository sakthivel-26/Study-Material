import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Play, Clock, HelpCircle, TrendingUp, ArrowRight, X, Phone, User, RotateCcw } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { useApp } from "../store.jsx";
import MockTestRunner from "../components/MockTestRunner.jsx";
import RealExamRunner from "../components/RealExamRunner.jsx";
import ExamModeModal from "../components/ExamModeModal.jsx";
import TestAnalysisView from "../components/TestAnalysisView.jsx";
import { CATEGORIES } from "../data.js";
import { useAuth } from "../auth.jsx";
import { fsAddAdmission } from "../backend.js";

// Map groups to a nice label and filter condition
const FREE_CATEGORIES = [
  { id: "banking", label: "BANK IBPS & SBI", group: "Banking" },
  { id: "tnpsc", label: "TNPSC", group: "TNPSC" },
  { id: "ssc", label: "SSC (CGL/CHSL)", group: "SSC" },
  { id: "railway", label: "Railway (NTPC/Group D)", group: "Railway" },
  { id: "defence", label: "Defence & NDA", group: "Defence" }
];

export default function FreeMocksPage() {
  const { mockTests, getLatestAttempt } = useApp();
  const { isAuthed, user, updateUserPhone } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState("banking");
  const [activeTest, setActiveTest] = useState(null);
  const [pendingTestForMode, setPendingTestForMode] = useState(null);
  const [activeExamMode, setActiveExamMode] = useState("real");
  const [viewingAttempt, setViewingAttempt] = useState(null); // { attempt, tab, test }

  // Lead generation state
  const [showLeadGen, setShowLeadGen] = useState(null);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadError, setLeadError] = useState("");
  const [leadLoading, setLeadLoading] = useState(false);

  // Filter for explicitly marked free mock tests
  const freeTests = mockTests.filter(t => t.isFree === true);
  
  // Filter by active tab (Level 1: Exam Category)
  let visibleTests = freeTests.filter(t => {
    if (activeTab === "all") return true;
    const tabDef = FREE_CATEGORIES.find(c => c.id === activeTab);
    if (!tabDef || !tabDef.group) return true;
    const cat = CATEGORIES.find(c => c.name === t.category);
    return cat && cat.group === tabDef.group;
  });

  const getMocksTaken = () => parseInt(localStorage.getItem('freeMocksTakenCount') || '0', 10);
  const incrementMocksTaken = () => localStorage.setItem('freeMocksTakenCount', (getMocksTaken() + 1).toString());

  const start = (test) => {
    if (!isAuthed) {
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }
    
    const hasSubmittedLead = localStorage.getItem("ken_ias_admission_submitted") === "true" || !!localStorage.getItem("user_phone_submitted") || !!user?.phone;

    // Check if they need to provide mobile number
    if (!hasSubmittedLead && getMocksTaken() >= 1) {
      setLeadName(user?.name || "");
      setShowLeadGen(test);
      return;
    }
    
    incrementMocksTaken();
    setPendingTestForMode(test);
  };

  const handleLeadGenSubmit = async (e) => {
    e.preventDefault();
    setLeadError("");
    setLeadLoading(true);
    try {
      if (leadPhone) {
        localStorage.setItem("user_phone_submitted", leadPhone);
        localStorage.setItem("ken_ias_admission_submitted", "true");
        localStorage.setItem("ken_ias_admission_closed", "true");
      }

      try {
        await updateUserPhone(leadPhone, leadName);
      } catch (err) {
        console.warn("updateUserPhone silent warning", err);
      }
      
      // Save lead into Admission Leads database
      await fsAddAdmission({
        fullName: leadName || user?.name || "Free Mock Student",
        mobileNumber: leadPhone,
        emailId: user?.email || "",
        modeOfLearning: "Free Mock Test Student",
        targetExam: showLeadGen?.category || activeTab || "Banking",
        source: "Free Mock Test Lead Prompt"
      }).catch(err => console.warn("Failed to add admission lead", err));

      incrementMocksTaken();
      setPendingTestForMode(showLeadGen);
      setShowLeadGen(null);
    } catch (err) {
      setLeadError(err.message || "Failed to save mobile number.");
    } finally {
      setLeadLoading(false);
    }
  };

  const getTagPill = (test) => {
    if (test.tag) {
      return { label: test.tag, color: "border-sky-300 bg-sky-50 text-sky-700" };
    }
    if (test.difficulty) {
      const diffColors = {
        Easy: "border-emerald-300 bg-emerald-50 text-emerald-800",
        Moderate: "border-amber-300 bg-amber-50 text-amber-800",
        Difficult: "border-rose-300 bg-rose-50 text-rose-700",
      };
      return { label: test.difficulty, color: diffColors[test.difficulty] || "border-slate-300 bg-slate-50 text-slate-700" };
    }
    return null;
  };

  const currentCategoryLabel = FREE_CATEGORIES.find(c => c.id === activeTab)?.label || "Bank IBPS & SBI";

  return (
    <>
      <PageHeader 
        icon={<Zap size={22} className="text-amber-500" />} 
        title="Free Mock Tests" 
        subtitle="Practice for free with our high-quality mock tests categorized by exam, subject, and topic." 
      />

      {/* Level 1: Exam Categories */}
      <div className="flex flex-nowrap overflow-x-auto gap-2 mb-6 pb-2 hide-scrollbar">
        {FREE_CATEGORIES.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
              activeTab === tab.id 
                ? "bg-[#1B4F72] text-white shadow-md" 
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Series Title Section (Matching Screenshot 2) */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900">
            {currentCategoryLabel} Mock Test 2026 Series
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-semibold">
          {visibleTests.length} Tests in Series
        </span>
      </div>

      {/* Mock Tests Series Rows List (Matching Screenshot 2) */}
      <div className="space-y-3.5 mb-12">
        {visibleTests.length === 0 ? (
          <div className="card p-8 text-sm text-slate-500 col-span-full text-center">
            No free mock tests available for {currentCategoryLabel} yet. Check back soon or select another category above.
          </div>
        ) : (
          visibleTests.map((t, i) => {
            const latestAttempt = getLatestAttempt ? getLatestAttempt(t.id, t.title) : null;
            const tag = getTagPill(t);
            const isAttempted = !!latestAttempt;

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs hover:border-slate-300 hover:shadow-md transition-all"
              >
                {/* Left: Number, Badges, Title, and Subtag Pill */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Number Badge */}
                  <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-black text-xs md:text-sm flex items-center justify-center shrink-0 shadow-2xs">
                    {i + 1}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500 text-white shadow-2xs">
                        FREE
                      </span>
                      <h3 className="font-extrabold text-sm md:text-base text-slate-900 truncate">
                        {t.title}
                      </h3>
                      {tag && (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold border ${tag.color}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {tag.label}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 font-medium">
                      {t.category} {t.subject ? `· ${t.subject}` : ""} · {t.questions || 100} Qs · {t.time || "60 Mins"}
                    </p>
                  </div>
                </div>

                {/* Center: Cutoff vs Your Marks (If Attempted) OR Qs/Marks/Time (If Unattempted) */}
                <div className="shrink-0 flex items-center justify-between w-full md:w-auto md:justify-center border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  {isAttempted ? (
                    <div className="flex items-center gap-6 text-center mr-0 md:mr-6">
                      <div>
                        <span className="text-sm md:text-base font-black text-slate-800 block">
                          {latestAttempt.cutoffMarks || 62.5}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Cut off Marks
                        </span>
                      </div>
                      <div className="w-px h-8 bg-slate-200" />
                      <div>
                        <span className="text-sm md:text-base font-black text-emerald-600 block">
                          {latestAttempt.score}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Your Marks
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 text-center text-xs font-semibold text-slate-600 mr-0 md:mr-6">
                      <div>
                        <span className="text-sm font-black text-slate-800 block">{t.questions || 100}</span>
                        <span className="text-[10px] text-slate-400">Questions</span>
                      </div>
                      <div className="w-px h-6 bg-slate-200" />
                      <div>
                        <span className="text-sm font-black text-slate-800 block">{t.questions || 100}</span>
                        <span className="text-[10px] text-slate-400">Marks</span>
                      </div>
                      <div className="w-px h-6 bg-slate-200" />
                      <div>
                        <span className="text-sm font-black text-slate-800 block">{t.time || "60 Mins"}</span>
                        <span className="text-[10px] text-slate-400">Time</span>
                      </div>
                    </div>
                  )}

                  {/* Right: Action Buttons matching Screenshot 2 */}
                  <div className="shrink-0">
                    {isAttempted ? (
                      <div className="flex items-center gap-2">
                        {/* Solution Button */}
                        <button
                          onClick={() => setViewingAttempt({ attempt: latestAttempt, tab: "solution", test: t })}
                          className="px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Solution
                        </button>

                        {/* Analytics Button */}
                        <button
                          onClick={() => setViewingAttempt({ attempt: latestAttempt, tab: "overview", test: t })}
                          className="px-3 py-1.5 bg-[#1e3a8a] hover:bg-[#172554] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Analytics
                        </button>

                        {/* Retake Button */}
                        <button
                          onClick={() => start(t)}
                          className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Retake
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => start(t)}
                        className="px-6 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play size={13} fill="currentColor" /> Start Test
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {activeTest && (
        activeExamMode === "real" ? (
          <RealExamRunner test={activeTest} onClose={() => { setActiveTest(null); setActiveExamMode(null); }} />
        ) : (
          <MockTestRunner test={activeTest} onClose={() => { setActiveTest(null); setActiveExamMode(null); }} />
        )
      )}

      {pendingTestForMode && (
        <ExamModeModal
          test={pendingTestForMode}
          onSelectMode={(mode) => {
            setActiveExamMode(mode);
            setActiveTest(pendingTestForMode);
            setPendingTestForMode(null);
          }}
          onClose={() => setPendingTestForMode(null)}
        />
      )}

      {/* Test Analysis & Scorecard View (SmartKeeda Style) */}
      {viewingAttempt && (
        <TestAnalysisView
          attempt={viewingAttempt.attempt}
          initialTab={viewingAttempt.tab || "overview"}
          onRetake={() => {
            const t = viewingAttempt.test;
            setViewingAttempt(null);
            start(t);
          }}
          onClose={() => setViewingAttempt(null)}
        />
      )}

      {showLeadGen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative"
          >
            <button 
              onClick={() => setShowLeadGen(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors z-10"
            >
              <X size={18} />
            </button>

            <div className="bg-[#1B4F72] text-white p-6 text-center">
              <Zap size={32} className="mx-auto mb-2 text-amber-400" />
              <h3 className="font-extrabold text-lg">Continue Practicing Free Mocks</h3>
              <p className="text-xs text-blue-100 mt-1">
                Enter your mobile number once to unlock unlimited free practice tests on Ken IAS Academy.
              </p>
            </div>

            <form onSubmit={handleLeadGenSubmit} className="p-6 space-y-4">
              {leadError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                  {leadError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="Enter candidate name"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile WhatsApp Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    maxLength="10"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="10-digit mobile number"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={leadLoading}
                className="w-full py-2.5 bg-[#1B4F72] hover:bg-[#153e5b] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {leadLoading ? "Verifying..." : "Unlock & Start Test →"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </>
  );
}
