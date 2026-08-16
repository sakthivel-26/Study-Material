import { User, Phone, Award, Flame, PlaySquare, ClipboardList, Target } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { Avatar, ProgressBar } from "../components/ui.jsx";
import { USER } from "../data.js";
import { useAuth } from "../auth.jsx";
import { useApp } from "../store.jsx";

export default function ProfilePage() {
  const { user } = useAuth();
  const { testHistory = [] } = useApp();
  const displayName = user?.name || USER.name;
  const displayInitials = user?.initials || USER.initials;
  const displayPhoto = user?.photo || null;
  const videosWatched = Number(user?.videosWatched || 0);
  const testsTaken = Number(user?.testsCompleted || 0);
  const streak = Number(user?.streak || 0);
  // Skill assessment is based on completed-test results only; no invented scores.
  const scored = testHistory.filter(h => Number.isFinite(Number(h.percent)));
  const average = scored.length ? Math.round(scored.reduce((sum,h)=>sum + Number(h.percent),0) / scored.length) : null;
  const skills = [
    { label: "Mock test accuracy", value: average },
    { label: "Test consistency", value: testsTaken ? Math.min(100, testsTaken * 10) : null },
    { label: "Practice discipline", value: streak ? Math.min(100, streak * 7) : null },
  ];
  return <><PageHeader icon={<User size={22}/>} title="My Profile" subtitle="Your real learning activity and assessment level"/>
    <div className="grid lg:grid-cols-[340px_1fr] gap-6"><div className="card p-6 text-center"><div className="w-20 h-20 mx-auto mb-4"><Avatar initials={displayInitials} photo={displayPhoto} size={80} ring/></div><h2 className="font-extrabold text-lg text-ink">{displayName}</h2><p className="text-sm text-ink-muted mb-4">{user?.role === "admin" ? "Administrator" : "Student"}</p><div className="rounded-xl bg-brand-50 p-4 text-left text-sm"><p className="text-xs font-bold uppercase tracking-wide text-brand-700 mb-2">Verified contact</p><div className="flex items-center gap-2.5 text-ink-soft"><Phone size={15} className="text-ink-faint"/>{user?.phone || "Mobile number not added"}</div></div></div>
      <div className="space-y-6"><div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{[{label:"Videos watched",value:videosWatched,icon:PlaySquare,color:"#0EA5E9"},{label:"Tests taken",value:testsTaken,icon:ClipboardList,color:"#10B981"},{label:"Current streak",value:`${streak} day${streak===1?"":"s"}`,icon:Flame,color:"#F59E0B"}].map(s=><div key={s.label} className="card p-5 text-center"><s.icon size={22} className="mx-auto mb-2" style={{color:s.color}}/><p className="text-xl font-extrabold text-ink leading-none">{s.value}</p><p className="text-[11px] text-ink-muted mt-1">{s.label}</p></div>)}</div>
        <div className="card p-6"><h3 className="font-bold text-ink mb-1 flex items-center gap-2"><Award size={18} className="text-brand-600"/>Skill level assessment</h3><p className="text-xs text-ink-muted mb-5">Calculated from completed mock tests and consistent practice. Levels appear only when activity is available.</p><div className="space-y-5">{skills.map(s=><div key={s.label}><div className="flex justify-between text-sm mb-1.5"><span className="font-medium text-ink-soft">{s.label}</span><span className="font-bold text-brand-700">{s.value===null?"Not assessed":`${s.value}%`}</span></div><ProgressBar value={s.value||0}/></div>)}</div>{average===null&&<div className="mt-5 rounded-xl bg-amber-50 border border-amber-100 p-3 text-sm text-amber-800 flex gap-2"><Target size={17} className="shrink-0"/>Complete mock tests to receive an accurate capability assessment.</div>}</div></div></div></>;
}
