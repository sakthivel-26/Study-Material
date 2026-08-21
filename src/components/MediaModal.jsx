import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Play, Download, BookmarkPlus, Bookmark, Clock } from "lucide-react";
import { Badge } from "./ui.jsx";
import { useApp } from "../store.jsx";

// Renders either an embedded YouTube player or an inline PDF-style preview.
export default function MediaModal({ item, onClose }) {
  const { toggleBookmark, bookmarks, pushToast, addDownloadRecord } = useApp();
  const isBookmarked = item && bookmarks.includes(item.id);

  if (!item) return null;
  const isVideo = item.type === "video";

  const save = () => {
    toggleBookmark(item.id);
    pushToast(isBookmarked ? "Removed from bookmarks" : "Saved to bookmarks ❤️");
  };

  const handleDownload = () => {
    if (item.type === "pdf" && item.fileUrl) {
      const link = document.createElement("a");
      link.href = item.fileUrl;
      link.download = item.fileName || `${item.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (addDownloadRecord) addDownloadRecord(item);
      pushToast("PDF downloaded 📥");
    } else {
      pushToast(isVideo ? "Video saved 🎬" : "PDF download started 📥");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm p-4 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.94, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 8 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl rounded-2xl bg-white overflow-hidden shadow-lift max-h-[90vh] flex flex-col"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ background: item.categoryColor }}
              >
                {isVideo ? <Play size={16} /> : <FileText size={16} />}
              </span>
              <div className="min-w-0">
                <p className="font-bold text-sm text-ink truncate">{item.title}</p>
                <Badge color={item.categoryColor}>{item.category}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={save} className="p-2 rounded-xl hover:bg-black/5 text-ink-soft">
                {isBookmarked ? (
                  <Bookmark size={18} className="text-brand-600 fill-brand-600" />
                ) : (
                  <BookmarkPlus size={18} />
                )}
              </button>
              {item.type === "pdf" && (
                <button
                  onClick={handleDownload}
                  className="p-2 rounded-xl hover:bg-black/5 text-ink-soft"
                  title="Download PDF"
                >
                  <Download size={18} />
                </button>
              )}
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/5 text-ink-soft">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {isVideo ? (
              <div className="rounded-xl overflow-hidden aspect-video bg-black">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${item.youtube}?autoplay=1&rel=0`}
                  title={item.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : item.fileUrl ? (
              <div className="w-full h-[62vh] rounded-xl overflow-hidden bg-slate-900 border border-black/10 flex flex-col">
                <iframe
                  src={item.fileUrl}
                  title={item.title}
                  className="w-full h-full border-0"
                />
              </div>
            ) : (
              <div className="rounded-xl bg-gradient-to-br from-black/90 to-brand-900 text-white p-6 aspect-[3/4] max-h-[62vh] overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-white/50 mb-5">
                    <span>KEN IAS Academy</span>
                    <span>{item.pages || 1} pages</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-sm text-white/80 leading-relaxed mb-4">{item.description || "Study material published by KEN IAS Academy faculty."}</p>
                </div>
                <div className="border-t border-white/15 pt-4 flex items-center justify-between text-white/60 text-xs">
                  <span>{item.category}</span>
                  <span>{item.author || "KEN IAS Academy"}</span>
                </div>
              </div>
            )}
          </div>

          <div className="px-5 py-3 border-t border-black/5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-ink-muted">
              <span className="flex items-center gap-1 font-medium text-ink-soft"><Clock size={13} className="text-brand-600" /> {item.date || item.uploadTime || "Just now"}</span>
              <span>·</span>
              {isVideo ? <><Play size={13} /> {item.duration} · {item.views?.toLocaleString()} views</> : <><FileText size={13} /> {item.downloads?.toLocaleString()} downloads</>}
            </div>
            <button
              onClick={handleDownload}
              className="btn-primary text-sm px-4 py-2"
            >
              {isVideo ? (<><Download size={15} /> Save Video</>) : (<><Download size={15} /> Download PDF</>)}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
