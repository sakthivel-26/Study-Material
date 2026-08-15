import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, LockKeyhole, PlayCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const COURSES = [
  { id: "banking", group: "Banking", title: "Banking Exam Package", exams: "IBPS PO · Clerk · SBI PO · Clerk · RRB", color: "#0F5D7A", icon: "🏦", lessons: "120+ classes" },
  { id: "tnpsc", group: "TNPSC", title: "TNPSC Complete Course", exams: "Group I · Group II · Group IV · VAO", color: "#D93A2B", icon: "🏛️", lessons: "160+ classes" },
  { id: "ssc", group: "SSC", title: "SSC Exam Package", exams: "CGL · CHSL · MTS · GD · CPO", color: "#6B4E9B", icon: "📝", lessons: "140+ classes" },
  { id: "railway", group: "Railway", title: "Railway Exam Package", exams: "RRB NTPC · Group D · ALP · Technician", color: "#147A5A", icon: "🚆", lessons: "110+ classes" },
  { id: "navy", group: "Navy", title: "Defence & Navy Package", exams: "Indian Navy · Agniveer · NDA · CDS", color: "#063D5A", icon: "⚓", lessons: "100+ classes" },
];

export default function CourseCatalog({ compact = false }) {
  const navigate = useNavigate();
  const courses = compact ? COURSES.slice(0, 3) : COURSES;
  return <section>
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Exam preparation</p><h2 className="text-xl font-extrabold text-ink mt-1">Choose your exam course</h2><p className="text-sm text-ink-muted mt-1">Start with one free mock test. Unlock the complete package when you are ready.</p></div>{compact && <button onClick={() => navigate("/courses")} className="text-sm font-bold text-brand-700 inline-flex gap-1 items-center">View all courses <ArrowRight size={15}/></button>}</div>
    <div className={`grid gap-4 ${compact ? "md:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-3"}`}>{courses.map((course, i) => <motion.article key={course.id} initial={{opacity:0,y:12}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.05}} className="card card-hover overflow-hidden"><div className="h-2" style={{background:course.color}}/><div className="p-5"><div className="flex justify-between gap-3"><span className="text-3xl">{course.icon}</span><span className="chip bg-emerald-50 text-emerald-700"><PlayCircle size={13}/> 1 mock free</span></div><h3 className="font-extrabold text-ink mt-4">{course.title}</h3><p className="text-xs text-ink-muted mt-1 min-h-[34px]">{course.exams}</p><div className="flex gap-3 text-xs text-ink-muted border-y border-black/5 py-3 my-4"><span className="flex gap-1 items-center"><CheckCircle2 size={14} style={{color:course.color}}/>{course.lessons}</span><span className="flex gap-1 items-center"><LockKeyhole size={13}/>Full test series</span></div><button onClick={()=>navigate(`/mock-tests?package=${course.id}`)} className="btn-primary w-full text-sm py-2.5" style={{background:course.color}}>Try free mock <ArrowRight size={15}/></button></div></motion.article>)}</div>
  </section>;
}
