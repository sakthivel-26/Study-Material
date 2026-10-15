import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ClipboardList, Play, Clock, HelpCircle, TrendingUp, LockKeyhole, ArrowLeft, BarChart2, CheckCircle2, RotateCcw, Eye } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { useApp } from "../store.jsx";
import MockTestRunner from "../components/MockTestRunner.jsx";
import RealExamRunner from "../components/RealExamRunner.jsx";
import ExamModeModal from "../components/ExamModeModal.jsx";
import TestAnalysisView from "../components/TestAnalysisView.jsx";
import { CATEGORIES } from "../data.js";
import PaymentCheckout from "../components/PaymentCheckout.jsx";
import { packageForEnrollment } from "../components/CourseCatalog.jsx";
import { useAuth } from "../auth.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import { fsUpdateUserPurchases, fsGetUserPurchases, useRealtimeBackend } from "../backend.js";

const claimedKey = "ken_academy_free_mock_claimed";
const readClaimed = () => { try { return JSON.parse(localStorage.getItem(claimedKey) || "{}"); } catch { return {}; } };
const PACKAGES = {
  banking: { label: "Banking", groups: ["Banking"], amount: "499" },
  tnpsc: { label: "TNPSC", groups: ["TNPSC"], amount: "599" },
  ssc: { label: "SSC", groups: ["SSC"], amount: "499" },
  railway: { label: "Railway", groups: ["Railway"], amount: "399" },
  navy: { label: "Defence & Navy", groups: ["Navy"], amount: "399" }
};
const planAmount = (id, fallback) => {
  try {
    const saved = JSON.parse(localStorage.getItem("ken_plans")) || [];
    const match = saved.find(p => p.id === id);
    if (match && match.amount) return match.amount;
  } catch (e) {}
  return fallback;
};

export default function MockTestsPage() {
  const { mockTests, getLatestAttempt, plans = [] } = useApp();
  const { user, isAdmin, isAuthed } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedPackage = searchParams.get("package");
  const exam = searchParams.get("exam");
  const packageId = requestedPackage || (!isAdmin ? packageForEnrollment(user?.enrolled) : null);
  const selected = PACKAGES[packageId];
  
  const [activeTest, setActiveTest] = useState(null);
  const [pendingTestForMode, setPendingTestForMode] = useState(null);
  const [activeExamMode, setActiveExamMode] = useState("real");
  const [viewingAttempt, setViewingAttempt] = useState(null); // { attempt, tab, test }
  
  const [claimed, setClaimed] = useState(readClaimed);
  const [notice, setNotice] = useState(null);
  const [checkoutPkg, setCheckoutPkg] = useState(null);
  const [paid, setPaid] = useState(() => { try { return JSON.parse(localStorage.getItem("ken_paid_packages") || "{}"); } catch { return {}; } });

  const getPackageForTest = (test) => {
    const group = CATEGORIES.find(c=>c.name===test.category)?.group || "Other";
    const entry = Object.entries(PACKAGES).find(([id, pkg]) => pkg.groups.includes(group));
    if (entry) return { id: entry[0], ...entry[1] };
    return null;
  };

  useEffect(() => {
    if (isAuthed && user?.id && useRealtimeBackend) {
      fsGetUserPurchases(user.id).then(purchases => {
        if (Object.keys(purchases).length > 0) {
          setPaid(prev => {
            const next = { ...prev, ...purchases };
            localStorage.setItem("ken_paid_packages", JSON.stringify(next));
            return next;
          });
        }
      }).catch(console.error);
    }
  }, [isAuthed, user?.id]);

  const testGroup = (test) => CATEGORIES.find(c=>c.name===test.category)?.group || "Other";
  const packageTests = selected ? mockTests.filter(t => selected.groups.includes(testGroup(t)) && !t.isFree) : mockTests.filter(t => !t.isFree);
  const visibleTests = exam ? packageTests.filter(t => t.category.toLowerCase().includes(exam.toLowerCase().split(" ")[0]) || t.title.toLowerCase().includes(exam.toLowerCase())) : packageTests;
  const firstForCategory = (test) => visibleTests.filter(t=>t.category===test.category).find(t=>t.id===test.id)?.id===test.id;
  const amount = selected ? planAmount(packageId, selected.amount) : "—";
  
  const hasAccessToPkg = (pkgId) => {
    if (!pkgId) return false;
    if (paid[pkgId]) return true;
    if (Array.isArray(user?.access)) return user.access.includes(pkgId);
    return user?.access === "academy";
  };

  const start = (test) => { 
    if (!isAuthed) {
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }
    const tPkg = getPackageForTest(test);
    const free = firstForCategory(test) && !claimed[test.category]; 
    const unlocked = hasAccessToPkg(tPkg?.id);

    if (!free && !unlocked) { 
      const tAmount = tPkg ? planAmount(tPkg.id, tPkg.amount) : "—";
      setNotice({
        message: `Your free ${test.category} mock has already been used. Unlock the complete ${tPkg?.label || testGroup(test)} package for ₹${tAmount}.`,
        pkg: tPkg,
        amount: tAmount
      }); 
      return; 
    } 
    if (free) { 
      const next={...claimed,[test.category]:test.id};
      localStorage.setItem(claimedKey,JSON.stringify(next));
      setClaimed(next); 
    } 
    setPendingTestForMode(test);
  };

  // Helper for tag pill styling
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

  return (
    <>
      <PageHeader
        icon={<ClipboardList size={22}/>}
        title={exam ? `${exam} Mock Tests` : selected ? `${selected.label} Mock Tests` : "Mock Tests"}
        subtitle={selected ? `Only ${selected.label} tests are displayed. First mock is free; full package ₹${amount}.` : "Choose an exam course to view its dedicated mock-test series."}
      />

      {requestedPackage && (
        <button onClick={()=>setSearchParams({})} className="btn-ghost text-sm px-3 py-2 mb-5">
          <ArrowLeft size={15}/> All exam packages
        </button>
      )}

      {notice && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 text-sm text-amber-900">
          <LockKeyhole size={18} className="shrink-0 mt-0.5"/>
          <div className="flex-1">
            <p className="font-bold">Full package required · ₹{notice.amount}</p>
            <p className="mt-0.5">{notice.message}</p>
            <button
              onClick={()=>{ setCheckoutPkg({ ...notice.pkg, amount: notice.amount }); setNotice(null); }}
              className="btn-primary text-xs px-3 py-2 mt-3"
            >
              Pay with UPI / Netbanking
            </button>
          </div>
          <button onClick={()=>setNotice(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Series Title Section (Matching Screenshot 2) */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900">
            {selected ? `${selected.label} Mock Test 2026 Series` : exam ? `${exam} Mock Test Series` : "Official Mock Test 2026 Series"}
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-semibold">
          {visibleTests.length} Tests Available
        </span>
      </div>

      {/* Test Series Rows List (Matching Screenshot 2) */}
      <div className="space-y-3.5 mb-12">
        {visibleTests.length === 0 ? (
          <div className="card p-7 text-sm text-ink-muted">
            No {selected?.label || ""} mock tests have been published yet. The admin can create one from the matching category.
          </div>
        ) : (
          visibleTests.map((t, i) => {
            const tPkg = getPackageForTest(t);
            const tAmount = tPkg ? planAmount(tPkg.id, tPkg.amount) : "—";
            const free = firstForCategory(t) && !claimed[t.category];
            const unlocked = hasAccessToPkg(tPkg?.id);
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
                      {(free || t.isFree) && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500 text-white shadow-2xs">
                          FREE
                        </span>
                      )}
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
                      {t.category} · {t.questions || 100} Qs · {t.time || "60 Mins"}
                    </p>
                  </div>
                </div>

                {/* Center: Cutoff vs Your Marks (If Attempted) OR Qs/Marks/Time (If Unattempted) */}
                <div className="shrink-0 flex items-center justify-between w-full md:w-auto md:justify-center border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  {isAttempted ? (
                    <div className="flex items-center gap-6 text-center mr-0 md:mr-6">
                      <div>
                        <span className="text-sm md:text-base font-black text-slate-800 block">
                          {latestAttempt.cutoffMarks != null
                            ? latestAttempt.cutoffMarks
                            : (latestAttempt.totalMarks ? +(latestAttempt.totalMarks * 0.625).toFixed(1) : 0)}
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
                    ) : (free || unlocked) ? (
                      <button
                        onClick={() => start(t)}
                        className="px-6 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play size={13} fill="currentColor" /> Start Test
                      </button>
                    ) : (
                      <button
                        onClick={() => start(t)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <LockKeyhole size={13} /> Unlock (₹{tAmount})
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Real CBT Runner or Interactive Practice Runner */}
      {activeTest && (
        activeExamMode === "real" ? (
          <RealExamRunner test={activeTest} onClose={() => { setActiveTest(null); setActiveExamMode(null); }} />
        ) : (
          <MockTestRunner test={activeTest} onClose={() => { setActiveTest(null); setActiveExamMode(null); }} />
        )
      )}

      {/* Exam Mode Selector Modal */}
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

      {/* Test Analysis & Scorecard View (SmartKeeda Style, opened on clicking Analytics / Solution) */}
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

      {checkoutPkg && (
        <PaymentCheckout
          packageId={checkoutPkg.id}
          packageName={checkoutPkg.label}
          amount={checkoutPkg.amount}
          onClose={()=>setCheckoutPkg(null)}
          onSuccess={async ()=>{
            const next={...paid,[checkoutPkg.id]:true};
            localStorage.setItem("ken_paid_packages",JSON.stringify(next));
            setPaid(next);
            setCheckoutPkg(null);
            setNotice({message:"Payment verified. Your package is now unlocked.", amount: checkoutPkg.amount, pkg: checkoutPkg});
            if (isAuthed && user?.id && useRealtimeBackend) {
              try {
                await fsUpdateUserPurchases(user.id, checkoutPkg.id);
              } catch(err) {
                console.error("Firebase sync error", err);
              }
            }
          }}
        />
      )}
    </>
  );
}
