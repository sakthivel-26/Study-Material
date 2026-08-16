import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ClipboardList, Play, Clock, HelpCircle, TrendingUp, LockKeyhole, ArrowLeft } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { useApp } from "../store.jsx";
import MockTestRunner from "../components/MockTestRunner.jsx";
import { CATEGORIES } from "../data.js";
import PaymentCheckout from "../components/PaymentCheckout.jsx";
import { packageForEnrollment } from "../components/CourseCatalog.jsx";
import { useAuth } from "../auth.jsx";

const claimedKey = "ken_academy_free_mock_claimed";
const readClaimed = () => { try { return JSON.parse(localStorage.getItem(claimedKey) || "{}"); } catch { return {}; } };
const PACKAGES = { banking: { label: "Banking", groups: ["Banking"], amount: "499" }, tnpsc: { label: "TNPSC", groups: ["TNPSC"], amount: "599" }, ssc: { label: "SSC", groups: ["SSC"], amount: "499" }, railway: { label: "Railway", groups: ["Railway"], amount: "399" }, navy: { label: "Defence & Navy", groups: ["Navy"], amount: "399" } };
const planAmount = (id, fallback) => { try { return (JSON.parse(localStorage.getItem("ken_plans")) || []).find(p=>p.id===id)?.amount || fallback; } catch { return fallback; } };

export default function MockTestsPage() {
  const { mockTests } = useApp();
  const { user, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedPackage = searchParams.get("package");
  const exam = searchParams.get("exam");
  const packageId = requestedPackage || (!isAdmin ? packageForEnrollment(user?.enrolled) : null);
  const selected = PACKAGES[packageId];
  const [activeTest, setActiveTest] = useState(null);
  const [claimed, setClaimed] = useState(readClaimed);
  const [notice, setNotice] = useState("");
  const [checkout, setCheckout] = useState(false);
  const [paid, setPaid] = useState(() => { try { return JSON.parse(localStorage.getItem("ken_paid_packages") || "{}"); } catch { return {}; } });
  const testGroup = (test) => CATEGORIES.find(c=>c.name===test.category)?.group || "Other";
  const packageTests = selected ? mockTests.filter(t => selected.groups.includes(testGroup(t))) : mockTests;
  const visibleTests = exam ? packageTests.filter(t => t.category.toLowerCase().includes(exam.toLowerCase().split(" ")[0]) || t.title.toLowerCase().includes(exam.toLowerCase())) : packageTests;
  const firstForCategory = (test) => visibleTests.filter(t=>t.category===test.category).find(t=>t.id===test.id)?.id===test.id;
  const amount = selected ? planAmount(packageId, selected.amount) : "—";
  const academyAccess = user?.access === "academy";
  const start = (test) => { const free = firstForCategory(test) && !claimed[test.category]; if (!free && !paid[packageId] && !academyAccess) { setNotice(`Your free ${test.category} mock has already been used. Unlock the complete ${selected?.label || testGroup(test)} package for ₹${amount}.`); return; } if (free) { const next={...claimed,[test.category]:test.id};localStorage.setItem(claimedKey,JSON.stringify(next));setClaimed(next); } setActiveTest(test); };
  return <><PageHeader icon={<ClipboardList size={22}/>} title={exam ? `${exam} Mock Tests` : selected ? `${selected.label} Mock Tests` : "Mock Tests"} subtitle={selected ? `Only ${selected.label} tests are displayed. First mock is free; full package ₹${amount}.` : "Choose an exam course to view its dedicated mock-test series."}/>
    {requestedPackage && <button onClick={()=>setSearchParams({})} className="btn-ghost text-sm px-3 py-2 mb-5"><ArrowLeft size={15}/>All exam packages</button>}
    {notice && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 text-sm text-amber-900"><LockKeyhole size={18} className="shrink-0 mt-0.5"/><div className="flex-1"><p className="font-bold">Full package required · ₹{amount}</p><p className="mt-0.5">{notice}</p><button onClick={()=>setCheckout(true)} className="btn-primary text-xs px-3 py-2 mt-3">Pay with UPI / Netbanking</button></div><button onClick={()=>setNotice("")} className="font-bold">×</button></div>}
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">{visibleTests.length===0?<div className="card p-7 text-sm text-ink-muted">No {selected?.label || ""} mock tests have been published yet. The admin can create one from the matching category.</div>:visibleTests.map((t,i)=>{const free=firstForCategory(t)&&!claimed[t.category];const unlocked=!!paid[packageId] || academyAccess;return <motion.div key={t.id} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:i*.06}} className="card card-hover p-5 flex flex-col" style={{borderTop:`4px solid ${t.color}`}}><div className="flex justify-between gap-2"><span className="chip self-start mb-3" style={{background:`${t.color}1A`,color:t.color}}>{t.category}</span><span className={`chip ${free?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-600"}`}>{academyAccess?"Academy access":unlocked?"Package unlocked":free?"First mock free":<><LockKeyhole size={12}/>₹{amount} package</>}</span></div><h3 className="font-bold text-ink mb-2">{t.title}</h3><div className="flex items-center gap-4 text-xs text-ink-muted mb-4"><span className="flex items-center gap-1"><HelpCircle size={13}/>{t.questions} Qs</span><span className="flex items-center gap-1"><Clock size={13}/>{t.time}</span><span className="flex items-center gap-1"><TrendingUp size={13}/>{t.taken?.toLocaleString()} taken</span></div><button onClick={()=>start(t)} className={`mt-auto text-sm py-2.5 ${(free||unlocked)?"btn-primary":"btn-ghost"}`}>{(free||unlocked)?<Play size={15}/>:<LockKeyhole size={15}/>}{unlocked?"Start test":free?"Start free test":`Unlock for ₹${amount}`}</button></motion.div>})}</div>{activeTest&&<MockTestRunner test={activeTest} onClose={()=>setActiveTest(null)}/>}{checkout && selected && <PaymentCheckout packageId={packageId} packageName={selected.label} amount={amount} onClose={()=>setCheckout(false)} onSuccess={()=>{const next={...paid,[packageId]:true};localStorage.setItem("ken_paid_packages",JSON.stringify(next));setPaid(next);setCheckout(false);setNotice("Payment verified. Your package is now unlocked.");}}/>}</>;
}
