import { useState } from "react";
import { Bell, CheckCheck, X, FileText, Download } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { useApp } from "../store.jsx";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationsPage() {
  const { notifications, markAllRead, pushToast } = useApp();
  const unread = notifications.filter((n) => !n.read).length;
  
  // selectedMedia can be an object: { type: "image" | "pdf", url: string, title: string }
  const [selectedMedia, setSelectedMedia] = useState(null);

  return (
    <>
      <PageHeader
        icon={<Bell size={22} />}
        title="Notifications"
        subtitle={`${unread} unread notifications`}
        action={
          <button onClick={() => { markAllRead(); pushToast("All notifications marked as read"); }} className="btn-ghost text-sm px-4 py-2.5">
            <CheckCheck size={16} /> Mark all read
          </button>
        }
      />
      <div className="card divide-y divide-black/5">
        {notifications.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`flex gap-4 p-4 ${n.read ? "" : "bg-brand-50/40"}`}
          >
            <div className="w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center text-xl" style={{ background: `${n.color}1A` }}>
              {n.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`font-bold text-sm ${n.read ? "text-ink-soft" : "text-ink"}`}>{n.title}</p>
                {!n.read && <span className="w-2 h-2 rounded-full bg-brand-600" />}
              </div>
              <p className="text-sm text-ink-muted">{n.body}</p>
              {n.image && (
                <div 
                  className="mt-2 rounded-lg max-h-48 overflow-hidden border border-black/10 inline-block cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedMedia({ type: "image", url: n.image, title: n.title })}
                >
                  <img src={n.image} alt="Notification" className="w-auto h-48 object-contain" />
                </div>
              )}
              {n.pdf && (
                <button 
                  onClick={() => setSelectedMedia({ type: "pdf", url: n.pdf, title: n.title })} 
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline"
                >
                  <span className="text-base">📄</span> View PDF Attachment
                </button>
              )}
              <p className="text-xs text-ink-faint mt-2">{n.time}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Media Viewer Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center" onClick={() => setSelectedMedia(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} 
              className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  {selectedMedia.type === "pdf" ? <FileText size={18} className="text-brand-600" /> : <Bell size={18} className="text-brand-600" />}
                  <h3 className="font-bold text-ink dark:text-white truncate">{selectedMedia.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {selectedMedia.type === "pdf" && (
                    <a href={selectedMedia.url} download="Announcement.pdf" className="btn-ghost p-2 text-ink-soft hover:bg-black/5 rounded-xl">
                      <Download size={18} />
                    </a>
                  )}
                  <button onClick={() => setSelectedMedia(null)} className="btn-ghost p-2 text-ink-soft hover:bg-black/5 rounded-xl">
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 flex items-center justify-center min-h-[50vh]">
                {selectedMedia.type === "image" ? (
                  <img src={selectedMedia.url} alt="Attachment" className="max-w-full max-h-full object-contain" />
                ) : (
                  <iframe src={selectedMedia.url} className="w-full h-full border-0 min-h-[65vh]" title="PDF Viewer" />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
