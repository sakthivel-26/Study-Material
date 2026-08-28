import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Play, Clock, HelpCircle, TrendingUp, ArrowRight, X, Phone, User } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { useApp } from "../store.jsx";
import MockTestRunner from "../components/MockTestRunner.jsx";
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
  const { mockTests } = useApp();
  const { isAuthed, user, updateUserPhone } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState("banking");
  const [activeTest, setActiveTest] = useState(null);

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
    setActiveTest(test);
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
      setActiveTest(showLeadGen);
      setShowLeadGen(null);
    } catch (err) {
      setLeadError(err.message || "Failed to save mobile number.");
    } finally {
      setLeadLoading(false);
    }
  };

  return (
    <>
      <PageHeader 
        icon={<Zap size={22} className="text-amber-500" />} 
        title="Free Mock Tests" 
        subtitle="Practice for free with our high-quality mock tests categorized by exam, subject, and topic." 
      />

      {/* Level 1: Exam Categories */}
      <div className="flex flex-nowrap overflow-x-auto gap-2 mb-4 pb-2 hide-scrollbar">
        {FREE_CATEGORIES.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id 
                ? "bg-brand-700 text-white shadow-lift" 
                : "bg-white text-ink-muted hover:bg-black/5 border border-black/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>


          {/* Mock Tests Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {visibleTests.length === 0 ? (
          <div className="card p-7 text-sm text-ink-muted col-span-full text-center">
            No free mock tests available for this selection yet.
          </div>
        ) : (
          visibleTests.map((t, i) => (
            <motion.div 
              key={t.id} 
              initial={{ opacity: 0, y: 14 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.06 }} 
              className="card card-hover p-5 flex flex-col" 
              style={{ borderTop: `4px solid ${t.color}` }}
            >
              <div className="flex justify-between gap-2 mb-1">
                <span className="chip self-start" style={{ background: `${t.color}1A`, color: t.color }}>
                  {t.category}
                </span>
                <span className="chip bg-amber-50 text-amber-700">
                  <Zap size={12} className="text-amber-500" /> Free Test
                </span>
              </div>
              
              {t.subject && (
                 <div className="mb-3">
                   <span className="text-[10px] font-bold text-ink-soft bg-black/5 px-1.5 py-0.5 rounded mr-1">{t.subject}</span>
                   {t.topic && <span className="text-[10px] font-bold text-brand-700 bg-brand-50 border border-brand-100 px-1.5 py-0.5 rounded">{t.topic}</span>}
                 </div>
              )}
              
              <h3 className="font-bold text-ink mb-2">{t.title}</h3>
              <div className="flex items-center gap-4 text-xs text-ink-muted mb-4">
                <span className="flex items-center gap-1"><HelpCircle size={13} /> {t.questions} Qs</span>
                <span className="flex items-center gap-1"><Clock size={13} /> {t.time}</span>
                <span className="flex items-center gap-1"><TrendingUp size={13} /> {t.taken?.toLocaleString()} taken</span>
              </div>
              <button 
                onClick={() => start(t)} 
                className="mt-auto text-sm py-2.5 btn-primary bg-amber-500 hover:bg-amber-600 border-none text-white shadow-amber-500/20 shadow-lg"
              >
                <Play size={15} /> Start Free Test
              </button>
            </motion.div>
          ))
        )}
      </div>


      {activeTest && (
        <MockTestRunner test={activeTest} onClose={() => setActiveTest(null)} />
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
              className="absolute top-4 right-4 p-2 text-ink-muted hover:text-ink hover:bg-black/5 rounded-full transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="p-8">
              <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mb-6">
                <Zap size={24} className="text-brand-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-ink mb-2">Unlock Unlimited Free Mocks</h2>
              <p className="text-ink-muted mb-6">
                You've taken your first free mock test! To continue taking unlimited free mock tests, please verify your mobile number.
              </p>

              <form onSubmit={handleLeadGenSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Full Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input 
                      type="text"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Mobile Number</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <span className="absolute left-10 top-1/2 -translate-y-1/2 text-ink font-medium">+91</span>
                    <input 
                      type="tel"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 10-digit number"
                      maxLength={10}
                      className="w-full pl-20 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                      required
                    />
                  </div>
                </div>

                {leadError && (
                  <div className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg">
                    {leadError}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={leadLoading || leadPhone.length !== 10 || !leadName.trim()}
                  className="w-full py-3.5 btn-primary text-white shadow-brand transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {leadLoading ? "Saving..." : "Verify & Start Test"}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
