import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Play, Download, Clock, Eye } from "lucide-react";
import { Badge } from "./ui.jsx";
import { useApp } from "../store.jsx";
import MediaModal from "./MediaModal.jsx";
import { CATEGORIES } from "../data.js";

const FILTER_TABS = [
  { id: "all", label: "All Materials", group: "all" },
  { id: "banking", label: "BANK IBPS & SBI", group: "Banking" },
  { id: "tnpsc", label: "TNPSC", group: "TNPSC" },
  { id: "ssc", label: "SSC (CGL/CHSL)", group: "SSC" },
  { id: "railway", label: "Railway (NTPC/Group D)", group: "Railway" },
  { id: "defence", label: "Defence & NDA", group: "Defence" },
  { id: "current-affairs", label: "Current Affairs & GK", group: "Common Subjects" }
];

export default function UploadList({ type, empty }) {
  const { uploads, addDownloadRecord, pushToast } = useApp();
  const [active, setActive] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  
  const baseList = type ? uploads.filter((u) => u.type === type) : uploads;
  
  const list = baseList.filter((u) => {
    if (activeTab === "all") return true;
    const tabDef = FILTER_TABS.find(c => c.id === activeTab);
    if (!tabDef || !tabDef.group) return true;
    const cat = CATEGORIES.find(c => c.name === u.category);
    return cat && cat.group === tabDef.group;
  });

  const handleDownload = (e, u) => {
    e.stopPropagation();
    if (u.type === "pdf" && u.fileUrl) {
      const link = document.createElement("a");
      link.href = u.fileUrl;
      link.download = u.fileName || `${u.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (addDownloadRecord) addDownloadRecord(u);
      pushToast("Downloading PDF... 📥");
    } else {
      pushToast("PDF downloading... 📥");
    }
  };

  return (
    <>
      <div className="flex flex-nowrap overflow-x-auto gap-2 mb-6 pb-2 hide-scrollbar">
        {FILTER_TABS.map(tab => (
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

      {list.length === 0 ? (
        <div className="card p-10 text-center text-ink-muted text-sm">{empty || "Nothing here yet."}</div>
      ) : (
        <div className="space-y-3">
          {list.map((u, i) => {
            const isVideo = u.type === "video";
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setActive(u)}
                className="card card-hover p-3.5 flex items-center gap-4 cursor-pointer"
              >
                <div className={`relative w-24 shrink-0 aspect-[4/3] rounded-xl bg-gradient-to-br ${u.thumb} flex items-center justify-center overflow-hidden`}>
                  {u.thumbUrl ? (
                    <img src={u.thumbUrl} alt={u.title} className="w-full h-full object-cover" />
                  ) : isVideo && u.youtube ? (
                    <img src={`https://img.youtube.com/vi/${u.youtube}/hqdefault.jpg`} alt={u.title} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-grid opacity-40" />
                      {isVideo ? <Play size={26} className="text-white relative" /> : <FileText size={26} className="text-white relative" />}
                    </>
                  )}
                  {isVideo && (
                    <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md z-10">{u.duration}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge color={u.categoryColor}>{u.category}</Badge>
                    <span className="hidden sm:flex items-center gap-1 text-[11px] text-ink-faint ml-auto"><Clock size={11} /> {u.date}</span>
                  </div>
                  <h3 className="font-bold text-[15px] text-ink truncate">{u.title}</h3>
                  <p className="text-[11px] text-ink-muted mt-0.5 flex items-center gap-1">
                    {isVideo ? <><Eye size={11} /> {u.views?.toLocaleString()} views · {u.duration}</> : <><Download size={11} /> {u.downloads?.toLocaleString()} downloads · {u.pages} pages</>}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); setActive(u); }} className={`btn text-xs px-3 py-2 ${isVideo ? "btn-ghost" : "btn-primary"}`}>
                    {isVideo ? <><Play size={13} /> Watch</> : <><Eye size={13} /> Preview</>}
                  </button>
                  {!isVideo && (
                    <button onClick={(e) => handleDownload(e, u)} className="btn-soft text-xs px-3 py-2"><Download size={13} /> Download</button>
                  )}
                </div>
              </motion.div>
            );
          })}
          <MediaModal item={active} onClose={() => setActive(null)} />
        </div>
      )}
    </>
  );
}
