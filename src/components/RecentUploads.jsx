import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Play, Download, Clock, Eye } from "lucide-react";
import { SectionHeader, Badge } from "./ui.jsx";
import { useApp } from "../store.jsx";
import MediaModal from "./MediaModal.jsx";

export default function RecentUploads() {
  const { uploads, addDownloadRecord, pushToast } = useApp();
  const [active, setActive] = useState(null);

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
    <section>
      <SectionHeader
        title="Recent Uploads"
        subtitle="Fresh study materials and video lectures"
        icon={<FileText size={17} />}
      />
      <div className="space-y-3">
        {uploads.map((u, i) => {
          const isVideo = u.type === "video";
          return (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              onClick={() => setActive(u)}
              className="card card-hover p-3 sm:p-3.5 flex items-center gap-4 cursor-pointer"
            >
              {/* Thumbnail */}
              <div
                className={`relative w-20 sm:w-24 shrink-0 aspect-[4/3] rounded-xl bg-gradient-to-br ${u.thumb} flex items-center justify-center overflow-hidden`}
              >
                {u.thumbUrl ? (
                  <img src={u.thumbUrl} alt={u.title} className="w-full h-full object-cover" />
                ) : isVideo && u.youtube ? (
                  <img src={`https://img.youtube.com/vi/${u.youtube}/hqdefault.jpg`} alt={u.title} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-grid opacity-40" />
                    <span className="relative text-2xl">
                      {isVideo ? <Play size={26} className="text-white" /> : <FileText size={26} className="text-white" />}
                    </span>
                  </>
                )}
                {isVideo && (
                  <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 z-10">
                    <Clock size={9} /> {u.duration}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ background: u.categoryColor }}
                  >
                    {isVideo ? <Play size={12} /> : <FileText size={12} />}
                  </span>
                  <Badge color={u.categoryColor}>{u.category}</Badge>
                  <span className="hidden sm:flex items-center gap-1 text-[11px] text-ink-faint ml-auto">
                    <Clock size={11} /> {u.date}
                  </span>
                </div>
                <h3 className="font-bold text-sm sm:text-[15px] text-ink truncate">{u.title}</h3>
                <div className="flex items-center gap-2 text-[11px] text-ink-muted mt-1">
                  {isVideo ? (
                    <span className="flex items-center gap-1"><Eye size={11} /> {u.views?.toLocaleString()} views</span>
                  ) : (
                    <span className="flex items-center gap-1"><Download size={11} /> {u.downloads?.toLocaleString()} downloads</span>
                  )}
                  <span className="sm:hidden text-ink-faint">{u.date}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setActive(u); }}
                  className={`btn text-xs px-3 py-2 ${isVideo ? "btn-ghost" : "btn-primary"}`}
                >
                  {isVideo ? (<><Play size={13} /> Watch</>) : (<><Eye size={13} /> Preview</>)}
                </button>
                {!isVideo && (
                  <button
                    onClick={(e) => handleDownload(e, u)}
                    className="btn-soft text-xs px-3 py-2"
                  >
                    <Download size={13} /> Download
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      <MediaModal item={active} onClose={() => setActive(null)} />
    </section>
  );
}
