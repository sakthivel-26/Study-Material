import { User, Mail, Phone, MapPin, Award, Flame, BookOpen, PlaySquare, ClipboardList } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { Avatar, ProgressBar } from "../components/ui.jsx";
import { USER, MOCK_TESTS_HISTORY } from "../data.js";
import { useAuth } from "../auth.jsx";

export default function ProfilePage() {
  const { user } = useAuth();
  const displayName = user?.name || USER.name;
  const displayEmail = user?.email || USER.email;
  const displayInitials = user?.initials || USER.initials;
  const displayPhoto = user?.photo || null;
  const skills = [
    { label: "Aptitude", value: 82 },
    { label: "Reasoning", value: 74 },
    { label: "English", value: 88 },
    { label: "Current Affairs", value: 65 },
  ];
  return (
    <>
      <PageHeader icon={<User size={22} />} title="My Profile" subtitle="Manage your account and track achievements" />
      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        {/* Left profile card */}
        <div className="card p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4">
            <Avatar initials={displayInitials} photo={displayPhoto} size={80} ring />
          </div>
          <h2 className="font-extrabold text-lg text-ink">{displayName}</h2>
          <p className="text-sm text-ink-muted mb-1">{user?.role === "admin" ? "Administrator" : "Student"}</p>
          <span className="chip bg-brand-50 text-brand-700 mb-5">🌟 12 day streak</span>
          <div className="space-y-2 text-left text-sm">
            <div className="flex items-center gap-2.5 text-ink-soft"><Mail size={15} className="text-ink-faint" /> {displayEmail}</div>
            <div className="flex items-center gap-2.5 text-ink-soft"><Phone size={15} className="text-ink-faint" /> +91 98765 43210</div>
            <div className="flex items-center gap-2.5 text-ink-soft"><MapPin size={15} className="text-ink-faint" /> Salem, Tamil Nadu</div>
          </div>
        </div>

        {/* Right content */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Enrolled", value: USER.enrolled, icon: BookOpen, color: "#6D28D9" },
              { label: "Videos Watched", value: USER.videosWatched, icon: PlaySquare, color: "#0EA5E9" },
              { label: "Tests Taken", value: USER.testsCompleted, icon: ClipboardList, color: "#10B981" },
              { label: "Streak", value: `${USER.streak}🔥`, icon: Flame, color: "#F59E0B" },
            ].map((s) => (
              <div key={s.label} className="card p-4 text-center">
                <s.icon size={20} className="mx-auto mb-2" style={{ color: s.color }} />
                <p className="text-xl font-extrabold text-ink leading-none">{s.value}</p>
                <p className="text-[11px] text-ink-muted mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-ink mb-4 flex items-center gap-2"><Award size={18} className="text-brand-600" /> Skill Levels</h3>
            <div className="space-y-4">
              {skills.map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-ink-soft">{s.label}</span>
                    <span className="font-bold text-brand-700">{s.value}%</span>
                  </div>
                  <ProgressBar value={s.value} />
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-ink mb-4">Recent Test Scores</h3>
            <div className="space-y-2">
              {MOCK_TESTS_HISTORY.slice(0, 3).map((h) => (
                <div key={h.title} className="flex items-center gap-3 text-sm">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs" style={{ background: h.percent >= 80 ? "#10B981" : "#F59E0B" }}>{h.percent}%</span>
                  <span className="flex-1 text-ink-soft">{h.title}</span>
                  <span className="text-ink-muted text-xs">{h.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
