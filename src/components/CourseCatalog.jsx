import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, ChevronDown, LockKeyhole, PlayCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export const packageForEnrollment = (enrolled = "") => {
  const value = enrolled.toLowerCase();
  if (value.includes("tnpsc")) return "tnpsc";
  if (value.includes("bank") || value.includes("sbi") || value.includes("ibps") || value.includes("rrb")) return "banking";
  if (value.includes("railway")) return "railway";
  if (value.includes("ssc")) return "ssc";
  if (value.includes("navy") || value.includes("nda") || value.includes("agniveer") || value.includes("cds")) return "navy";
  return null;
};

const COURSES = [
  { id:"banking", title:"Banking Exam Package", color:"#0F5D7A", icon:"🏦", exams:["IBPS PO","IBPS Clerk","SBI PO","SBI Clerk","RRB PO / Clerk"] },
  { id:"tnpsc", title:"TNPSC Complete Course", color:"#D93A2B", icon:"🏛️", exams:["TNPSC Group I","TNPSC Group II","TNPSC Group IIA","TNPSC Group IV","VAO"] },
  { id:"ssc", title:"SSC Exam Package", color:"#6B4E9B", icon:"📝", exams:["SSC CGL","SSC CHSL","SSC MTS","SSC GD","SSC CPO"] },
  { id:"railway", title:"Railway Exam Package", color:"#147A5A", icon:"🚆", exams:["RRB NTPC","RRB Group D","RRB ALP","RRB Technician"] },
  { id:"navy", title:"Defence & Navy Package", color:"#063D5A", icon:"⚓", exams:["Indian Navy","Agniveer","NDA","CDS"] },
];

export default function CourseCatalog() {
  const navigate=useNavigate(); const { user,isAdmin }=useAuth(); const [open,setOpen]=useState(null);
  const enrolledPackage=packageForEnrollment(user?.enrolled);
  const courses=(!isAdmin&&enrolledPackage)?COURSES.filter(c=>c.id===enrolledPackage):COURSES;
  return <section><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Mock test preparation</p><h2 className="text-xl font-extrabold text-ink mt-1">{enrolledPackage?"Your selected exam package":"Choose your exam package"}</h2><p className="text-sm text-ink-muted mt-1">Choose the exact exam. Every exam includes 1 free mock and 50+ paid mocks.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{courses.map((course,i)=>{const expanded=open===course.id;return <motion.article key={course.id} initial={{opacity:0,y:12}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.05}} className="card overflow-hidden"><div className="h-2" style={{background:course.color}}/><div className="p-5"><div className="flex justify-between gap-3"><span className="text-3xl">{course.icon}</span><span className="chip bg-emerald-50 text-emerald-700"><PlayCircle size={13}/>1 mock free</span></div><h3 className="font-extrabold text-ink mt-4">{course.title}</h3><p className="text-xs text-ink-muted mt-1">Paid full mock-test series · 50+ tests</p><div className="flex gap-3 text-xs text-ink-muted border-y border-black/5 py-3 my-4"><span className="flex gap-1 items-center"><CheckCircle2 size={14} style={{color:course.color}}/>50+ mock tests</span><span className="flex gap-1 items-center"><LockKeyhole size={13}/>Paid access</span></div><button onClick={()=>setOpen(expanded?null:course.id)} className="btn-primary w-full text-sm py-2.5" style={{background:course.color}}>Choose exam <ChevronDown size={15} className={expanded?"rotate-180 transition-transform":"transition-transform"}/></button><AnimatePresence>{expanded&&<motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden"><div className="pt-3 space-y-2">{course.exams.map(exam=><button key={exam} onClick={()=>navigate(`/mock-tests?package=${course.id}&exam=${encodeURIComponent(exam)}`)} className="flex w-full items-center justify-between rounded-lg border border-black/5 px-3 py-2 text-left text-sm font-semibold text-ink hover:border-brand-300 hover:bg-brand-50"><span>{exam}</span><span className="text-[10px] text-brand-700">Free mock <ArrowRight size={11} className="inline"/></span></button>)}</div></motion.div>}</AnimatePresence></div></motion.article>})}</div></section>;
}
