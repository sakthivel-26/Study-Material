import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown, FileText, BrainCircuit } from "lucide-react";
import { CATEGORIES, CATEGORY_GROUPS } from "../data.js";
import { SectionHeader } from "./ui.jsx";

const BANKING_EXAMS = {
  "SBI PO / Clerk": ["SBI PO", "SBI Clerk"],
  "IBPS PO / Clerk": ["IBPS PO", "IBPS Clerk"],
};
const TOPICS = {
  "Logical Reasoning": ["Seating Arrangement", "Puzzles", "Syllogism", "Inequalities", "Coding-Decoding", "Blood Relations", "Direction & Distance", "Ranking", "Input-Output", "Data Sufficiency"],
  "Quantitative Aptitude": ["Simplification", "Number Series", "Quadratic Equations", "Data Interpretation", "Percentage", "Ratio & Proportion", "Profit & Loss", "Simple & Compound Interest", "Time & Work", "Speed, Time & Distance"],
  "English Language": ["Reading Comprehension", "Cloze Test", "Error Spotting", "Fill in the Blanks", "Para Jumbles", "Sentence Improvement", "Vocabulary", "Word Swap"],
  "General & Banking Awareness": ["Current Affairs", "RBI & Banking", "Financial Awareness", "Static GK"],
};

function BankingTopics({ exam }) {
  return <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/40 p-3"><p className="font-bold text-sm text-ink mb-3">{exam} syllabus topics</p><div className="space-y-3">{Object.entries(TOPICS).map(([section, topics])=><div key={section}><p className="text-xs font-bold text-brand-700 flex items-center gap-1"><BrainCircuit size={13}/>{section}</p><div className="flex flex-wrap gap-1.5 mt-1.5">{topics.map(topic=><span key={topic} className="rounded-full bg-white border border-brand-100 px-2 py-1 text-[10px] text-ink-soft">{topic}</span>)}</div></div>)}</div></div>;
}

export default function CategoryGrid({ adminMode, onSelectCategory }) {
  const [open, setOpen] = useState(null);
  const [exam, setExam] = useState(null);
  return <section><SectionHeader title={adminMode ? "Upload by Category" : "Exam Categories"} subtitle={adminMode ? "Select a category to upload study materials directly" : "Choose an exam to view its complete topic-wise preparation syllabus"} icon={adminMode ? <FileText size={17}/> : <FileText size={17}/>}/><div className="space-y-7">{CATEGORY_GROUPS.filter((group)=>group !== "Common Subjects").map((group,gi)=>{const cats=CATEGORIES.filter(c=>c.group===group);if(!cats.length)return null;return <div key={group}><h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-600"/>{group}</h3><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{cats.map((c,i)=>{const expanded=open===c.id;const banking=BANKING_EXAMS[c.name];return <motion.div key={c.id} initial={{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:gi*.1+i*.05}} className="card overflow-hidden"><button onClick={()=>{if(adminMode && !banking) { onSelectCategory(c.name); return; } setOpen(expanded?null:c.id);setExam(null)}} className="w-full p-4 text-left group"><div className="flex items-center justify-between mb-3"><div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${c.gradient} text-white text-xl flex items-center justify-center shadow-soft`}>{c.icon}</div>{adminMode && !banking ? <ArrowRight size={16} className="text-brand-600" /> : expanded?<ChevronDown size={16} className="text-brand-600"/>:<ArrowRight size={16} className="text-ink-faint group-hover:text-brand-600"/>}</div><p className="font-bold text-sm text-ink leading-tight">{c.name}</p><p className="text-xs text-brand-700 mt-1">{adminMode ? (banking ? "Select exam..." : "Upload material here") : "View syllabus topics"}</p></button><AnimatePresence>{expanded&&<motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden px-4 pb-4">{banking?<div className="space-y-2">{banking.map(name=><div key={name}><button onClick={()=>{if(adminMode){onSelectCategory(name)}else{setExam(exam===name?null:name)}}} className="w-full flex justify-between items-center rounded-lg bg-brand-50 px-3 py-2 text-sm font-bold text-ink hover:bg-brand-100"><span>{name}</span>{adminMode ? <ArrowRight size={14} className="text-brand-600" /> : <ChevronDown size={14} className={exam===name?"rotate-180 transition-transform":"transition-transform"}/>}</button>{!adminMode && exam===name&&<BankingTopics exam={name}/>}</div>)}</div>:(!adminMode && <div className="rounded-xl bg-slate-50 p-3 text-xs text-ink-muted">Topic-wise syllabus for this exam will appear here when course material is added.</div>)}</motion.div>}</AnimatePresence></motion.div>})}</div></div>})}</div></section>;
}
