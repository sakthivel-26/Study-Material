import { motion } from "framer-motion";
import { LayoutDashboard, TrendingUp, UploadCloud, Megaphone, ClipboardPlus, Youtube } from "lucide-react";
import PageHeader from "../../components/PageHeader.jsx";
import { useApp } from "../../store.jsx";
import { ADMIN_ANALYTICS, MOCK_TESTS_HISTORY } from "../../data.js";
import { ProgressBar, Badge } from "../../components/ui.jsx";
import { useNavigate } from "react-router-dom";

const CHART = [40, 65, 48, 80, 60, 92, 74, 88, 56, 96, 70, 84];

export default function AdminDashboard() {
  const { uploads = [], mockTests = [], students = [] } = useApp();
  const navigate = useNavigate();

  const pdfCount = uploads.filter((u) => u.type === "pdf").length;
  const videoCount = uploads.filter((u) => u.type === "video").length;

  const stats = [
    { label: "Total Students", value: String(students.length), delta: `${students.length} registered`, color: "#1B4F72", icon: "👥" },
    { label: "Materials Uploaded", value: String(pdfCount), delta: `${pdfCount} PDFs published`, color: "#0EA5E9", icon: "📄" },
    { label: "Videos Published", value: String(videoCount), delta: `${videoCount} videos live`, color: "#EC4899", icon: "🎥" },
    { label: "Mock Tests Created", value: String(mockTests.length), delta: `${mockTests.length} tests active`, color: "#10B981", icon: "📝" },
  ];

  return (
    <>
      <PageHeader icon={<LayoutDashboard size={22} />} title="Dashboard" subtitle="Overview of academy activity" action={
        <button onClick={()=>navigate("/admin/upload?type=pdf")} className="btn-primary text-sm px-4 py-2.5"><UploadCloud size={16} /> Upload Material</button>
      } />

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}} className="card card-hover p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl" style={{background:`${s.color}1A`}}>{s.icon}</span>
              <span className="chip bg-emerald-50 text-emerald-600">{s.delta}</span>
            </div>
            <p className="text-2xl font-extrabold text-ink leading-none">{s.value}</p>
            <p className="text-xs text-ink-muted mt-1.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        {/* Weekly chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center"><TrendingUp size={17} /></span>
              <div><h3 className="font-bold text-[15px] text-ink">Student Engagement</h3><p className="text-xs text-ink-muted">Daily active learners · last 12 days</p></div>
            </div>
            <Badge color="#1B4F72">+18%</Badge>
          </div>
          <div className="flex items-end gap-2 h-40">
            {CHART.map((v, i) => (
              <motion.div key={i} initial={{height:0}} animate={{height:`${v}%`}} transition={{delay:i*0.05,duration:0.5}} className="flex-1 rounded-t-lg bg-gradient-to-t from-brand-600 to-fuchsia-500" style={{minHeight:8}} />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-ink-faint mt-2">
            <span>1 day ago</span><span>today</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="card p-6">
          <h3 className="font-bold text-[15px] text-ink mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label:"Upload PDF", icon:UploadCloud, to:"/admin/upload?type=pdf", color:"#1B4F72" },
              { label:"Add Video", icon:Youtube, to:"/admin/upload?type=video", color:"#EC4899" },
              { label:"Create Mock", icon:ClipboardPlus, to:"/admin/mock-test", color:"#10B981" },
              { label:"Announce", icon:Megaphone, to:"/admin/announcements", color:"#F59E0B" },
            ].map((a)=>(
              <button key={a.label} onClick={()=>navigate(a.to)} className="rounded-xl border border-black/5 bg-black/[0.02] p-4 text-left hover:border-brand-200 hover:bg-brand-50/50 transition-colors">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3" style={{background:a.color}}><a.icon size={18} /></span>
                <p className="text-sm font-semibold text-ink">{a.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {/* Recent uploads */}
        <div className="card p-6">
          <h3 className="font-bold text-[15px] text-ink mb-4">Recent Uploads</h3>
          <div className="space-y-3">
            {uploads.slice(0,4).map((u)=>(
              <div key={u.id} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${u.thumb} text-white flex items-center justify-center overflow-hidden shrink-0`}>
                  {u.thumbUrl ? (
                    <img src={u.thumbUrl} alt={u.title} className="w-full h-full object-cover" />
                  ) : (
                    u.type==="video"?"🎥":"📄"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{u.title}</p>
                  <p className="text-xs text-ink-muted">{u.category} · {u.date}</p>
                </div>
                <Badge color={u.categoryColor}>{u.type.toUpperCase()}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Test analytics */}
        <div className="card p-6">
          <h3 className="font-bold text-[15px] text-ink mb-4">Mock Tests</h3>
          <div className="space-y-4">
            {mockTests.slice(0,3).map((t, i)=>(
              <div key={t.id}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-ink-soft">{t.title}</span>
                  <span className="font-bold" style={{color:t.color}}>{[88,74,62][i]}% avg</span>
                </div>
                <ProgressBar value={[88,74,62][i]} color={t.color} />
                <p className="text-xs text-ink-muted mt-1">{t.taken?.toLocaleString()} attempts</p>
              </div>
            ))}
            <div className="pt-2 border-t border-black/5">
              <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Top Performers</h4>
              {MOCK_TESTS_HISTORY.slice(0,2).map((h)=>(
                <div key={h.title} className="flex justify-between text-sm py-1"><span className="text-ink-soft">{h.title}</span><span className="font-semibold text-emerald-600">{h.score}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
