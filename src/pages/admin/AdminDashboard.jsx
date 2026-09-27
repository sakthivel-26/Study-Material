import { motion } from "framer-motion";
import { LayoutDashboard, UploadCloud, Megaphone, ClipboardPlus, Youtube } from "lucide-react";
import PageHeader from "../../components/PageHeader.jsx";
import { useApp } from "../../store.jsx";
import { useNavigate } from "react-router-dom";

import CategoryGrid from "../../components/CategoryGrid.jsx";

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

      <div className="mb-6">
        {/* Quick actions */}
        <div className="card p-6">
          <h3 className="font-bold text-[15px] text-ink mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      <div className="mt-8">
        <CategoryGrid adminMode={true} onSelectCategory={(cat) => navigate(`/admin/upload?type=pdf&category=${encodeURIComponent(cat)}`)} />
      </div>
    </>
  );
}
