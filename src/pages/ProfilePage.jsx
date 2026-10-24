import { useState, useEffect } from "react";
import { User, Phone, Award, Flame, PlaySquare, ClipboardList, Target, BookOpen, CheckCircle } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { Avatar, ProgressBar } from "../components/ui.jsx";
import { USER } from "../data.js";
import { useAuth } from "../auth.jsx";
import { useApp } from "../store.jsx";
import { getStudentStats } from "../utils/studentActivity.js";

export default function ProfilePage() {
  const { user } = useAuth();
  const { testHistory = [], testAttempts = [] } = useApp();
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

  const stats = getStudentStats(user, testAttempts);

  const displayName = user?.name || USER.name;
  const displayInitials = user?.initials || USER.initials;
  const displayPhoto = user?.photo || null;
  const videosWatched = stats.videosWatched;
  const testsTaken = stats.testsCompleted;
  const streak = Number(user?.streak || (testsTaken > 0 ? Math.min(testsTaken, 7) : 0));

  // Skill assessment from both recorded testHistory and testAttempts
  const allScored = [
    ...testHistory.filter((h) => Number.isFinite(Number(h.percent))).map((h) => Number(h.percent)),
    ...testAttempts.filter((a) => Number.isFinite(Number(a.percentage ?? a.percent))).map((a) => Number(a.percentage ?? a.percent))
  ];
  const average = allScored.length ? Math.round(allScored.reduce((sum, h) => sum + h, 0) / allScored.length) : null;

  const skills = [
    { label: "Mock test accuracy", value: average },
    { label: "Test consistency", value: testsTaken ? Math.min(100, testsTaken * 10) : null },
    { label: "Practice discipline", value: streak ? Math.min(100, streak * 14) : null },
  ];

  return (
    <>
      <PageHeader
        icon={<User size={22} />}
        title="My Profile"
        subtitle="Your real learning activity, enrolled courses, and assessment level"
      />

      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        <div className="card p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4">
            <Avatar initials={displayInitials} photo={displayPhoto} size={80} ring />
          </div>
          <h2 className="font-extrabold text-lg text-ink">{displayName}</h2>
          <p className="text-sm text-ink-muted mb-4">{user?.role === "admin" ? "Administrator" : "Student"}</p>

          <div className="rounded-xl bg-brand-50 p-4 text-left text-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700 mb-2">Verified contact</p>
            <div className="flex items-center gap-2.5 text-ink-soft">
              <Phone size={15} className="text-ink-faint" />
              {user?.phone || "Mobile number not added"}
            </div>
          </div>

          <div className="rounded-xl bg-brand-50 p-4 text-left text-sm mt-3">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700 mb-2">Enrolled Course / Package</p>
            <div className="flex items-center gap-2.5 text-ink font-semibold">
              <BookOpen size={16} className="text-brand-600 shrink-0" />
              <span className="truncate">{stats.enrolledCourse}</span>
            </div>
            {stats.isEnrolled ? (
              <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-700">
                <CheckCircle size={13} className="text-emerald-600" />
                <span>Active Enrollment</span>
              </div>
            ) : (
              <p className="mt-2 text-xs text-ink-muted">Free preview tier</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Videos watched", value: videosWatched, icon: PlaySquare, color: "#0EA5E9" },
              { label: "Tests taken", value: testsTaken, icon: ClipboardList, color: "#10B981" },
              { label: "Current streak", value: `${streak} day${streak === 1 ? "" : "s"}`, icon: Flame, color: "#F59E0B" }
            ].map((s) => (
              <div key={s.label} className="card p-5 text-center">
                <s.icon size={22} className="mx-auto mb-2" style={{ color: s.color }} />
                <p className="text-xl font-extrabold text-ink leading-none">{s.value}</p>
                <p className="text-[11px] text-ink-muted mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-ink mb-1 flex items-center gap-2">
              <Award size={18} className="text-brand-600" />
              Skill level assessment
            </h3>
            <p className="text-xs text-ink-muted mb-5">
              Calculated from completed mock tests and consistent practice.
            </p>
            <div className="space-y-5">
              {skills.map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-ink-soft">{s.label}</span>
                    <span className="font-bold text-brand-700">
                      {s.value === null ? "Not assessed" : `${s.value}%`}
                    </span>
                  </div>
                  <ProgressBar value={s.value || 0} />
                </div>
              ))}
            </div>
            {average === null && (
              <div className="mt-5 rounded-xl bg-amber-50 border border-amber-100 p-3 text-sm text-amber-800 flex gap-2">
                <Target size={17} className="shrink-0" />
                Complete mock tests to receive an accurate capability assessment.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
