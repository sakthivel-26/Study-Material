import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, BookOpen, PlaySquare, ClipboardList, TrendingUp, ArrowRight } from "lucide-react";
import { useApp } from "../store.jsx";
import { useAuth } from "../auth.jsx";
import { ProgressBar } from "./ui.jsx";
import { useNavigate } from "react-router-dom";
import { getStudentStats } from "../utils/studentActivity.js";

export function NotificationsCard() {
  const { notifications } = useApp();
  const navigate = useNavigate();
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
            <Bell size={17} />
          </span>
          <h3 className="font-bold text-[15px]">Notifications</h3>
        </div>
        <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
          {notifications.filter((n) => !n.read).length}
        </span>
      </div>
      <div className="space-y-1">
        {notifications.length === 0 ? (
          <div className="py-4 text-center text-xs text-ink-muted">
            No new notifications
          </div>
        ) : (
          notifications.slice(0, 4).map((n) => (
            <div key={n.id} className="flex gap-3 p-2 rounded-xl hover:bg-black/[0.03] transition-colors">
              <div
                className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-base"
                style={{ background: `${n.color}1A` }}
              >
                {n.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink leading-tight">{n.title}</p>
                <p className="text-xs text-ink-muted leading-snug line-clamp-2">{n.body}</p>
                <p className="text-[10px] text-ink-faint mt-0.5">{n.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <button
        onClick={() => navigate("/notifications")}
        className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 py-2 rounded-xl hover:bg-brand-50 transition-colors"
      >
        View all <ArrowRight size={13} />
      </button>
    </div>
  );
}

export function ProgressCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { testAttempts } = useApp();
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setTick((t) => t + 1);
    window.addEventListener("ken_video_watched", handleUpdate);
    window.addEventListener("ken_purchase_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("ken_video_watched", handleUpdate);
      window.removeEventListener("ken_purchase_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const data = getStudentStats(user, testAttempts);

  const stats = [
    { label: "Courses Enrolled", value: data.enrolledCount, icon: BookOpen, color: "#1B4F72", link: "/courses" },
    { label: "Videos Watched", value: data.videosWatched, icon: PlaySquare, color: "#0EA5E9", link: "/materials" },
    { label: "Mock Tests Completed", value: data.testsCompleted, icon: ClipboardList, color: "#10B981", link: "/mock-tests" },
  ];
  const overall = data.learningProgress;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-9 h-9 shrink-0 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp size={17} />
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-[15px] leading-tight">Your Progress</h3>
            {data.isEnrolled && (
              <p className="text-[11px] text-brand-700 font-medium truncate max-w-[170px]" title={data.enrolledCourse}>
                {data.enrolledCourse}
              </p>
            )}
          </div>
        </div>
        {data.isEnrolled && (
          <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] tracking-wide uppercase border border-emerald-200">
            Enrolled
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {stats.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => s.link && navigate(s.link)}
            className="rounded-xl bg-black/[0.03] p-2.5 text-center hover:bg-black/[0.06] transition-colors cursor-pointer"
            title={`View ${s.label}`}
          >
            <s.icon size={18} className="mx-auto mb-1.5" style={{ color: s.color }} />
            <p className="text-lg font-extrabold text-ink leading-none">{s.value}</p>
            <p className="text-[10px] text-ink-muted mt-1 leading-tight">{s.label}</p>
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-semibold text-ink-soft">Learning progress</span>
        <span className="font-bold text-brand-700">{overall}%</span>
      </div>
      <ProgressBar value={overall} />
      <button
        onClick={() => navigate("/daily-practice")}
        className="mt-3 w-full btn-ghost text-xs py-2.5"
      >
        Continue practicing
      </button>
    </div>
  );
}

export function RightSidebar() {
  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <ProgressCard />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <NotificationsCard />
      </motion.div>
    </div>
  );
}
