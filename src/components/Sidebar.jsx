import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, PlaySquare, FileText, ClipboardList,
  CalendarCheck, Bell, Download, Heart, User, Settings, Smartphone,
  X, Zap, GraduationCap
} from "lucide-react";
import { Logo } from "./ui.jsx";
import { usePWAInstall } from "../usePWAInstall.js";
import { useApp } from "../store.jsx";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admission", label: "Admissions", icon: GraduationCap },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/videos", label: "Videos", icon: PlaySquare },
  { to: "/materials", label: "Study Materials", icon: FileText },
  { to: "/mock-tests", label: "Mock Tests", icon: ClipboardList },
  { to: "/free-mocks", label: "Free Mocks", icon: Zap },
  { to: "/daily-practice", label: "Speed Math", icon: Zap },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ open, onClose, unread }) {
  const { pushToast } = useApp();
  const { canInstall, installed, promptInstall } = usePWAInstall();
  const onInstall = async () => {
    const ok = await promptInstall();
    if (!ok)
      pushToast(
        installed
          ? "App already installed ✓"
          : "Open in Chrome/Edge over https to install the app."
      );
  };
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed z-50 top-0 left-0 h-full w-[264px] bg-white border-r border-black/5 flex flex-col transition-transform duration-300 lg:sticky lg:top-0 lg:translate-x-0 lg:h-screen ${
          open ? "translate-x-0 shadow-lift" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-[72px] shrink-0">
          <Logo />
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-black/5">
            <X size={20} className="text-ink-muted" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3.5 pb-2 space-y-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `nav-item ${isActive ? "nav-item-active" : ""} relative`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-xl bg-brand-700 shadow-lift"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  )}
                  <item.icon
                    size={19}
                    className={`relative z-10 ${isActive ? "text-white" : "text-ink-muted"}`}
                  />
                  <span className={`relative z-10 flex-1 ${isActive ? "text-white" : ""}`}>
                    {item.label}
                  </span>
                  {item.to === "/notifications" && unread > 0 && (
                    <span
                      className={`relative z-10 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                        isActive ? "bg-white text-brand-700" : "bg-rose-500 text-white"
                      }`}
                    >
                      {unread}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Admission Section in Left Sidebar */}
        <div className="px-3.5 pb-2 shrink-0">
          <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-emerald-50/70 border border-brand-200/80 p-3 shadow-xs">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-7 h-7 rounded-lg bg-brand-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                <GraduationCap size={15} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-brand-900 leading-tight">Admissions 2026</p>
                <p className="text-[10px] text-emerald-700 font-semibold">Online & Offline Batches</p>
              </div>
            </div>
            <p className="text-[11px] text-ink-muted leading-tight mb-2.5">
              Direct classroom & live classes for Bank, TNPSC, SSC & Railways.
            </p>
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new Event("ken_open_admission"));
                if (onClose) onClose();
              }}
              className="w-full py-2 px-3 rounded-xl bg-brand-700 hover:bg-brand-800 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              Apply for Admission
            </button>
          </div>
        </div>

        {/* Bottom PWA card */}
        <div className="p-4 pt-1 shrink-0">
          <div className="relative overflow-hidden rounded-card bg-hero p-4 text-white">
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center mb-3">
                <Smartphone size={20} />
              </div>
              <p className="font-bold text-[15px] leading-tight">Learn Anytime, Anywhere</p>
              <p className="text-white/70 text-xs mt-1 mb-3">
                Install the app for offline access to your courses.
              </p>
              <button onClick={onInstall} className="w-full btn bg-white text-brand-700 hover:bg-white/90 text-sm">
                <Download size={15} /> {installed ? "App Installed" : "Install PWA"}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
