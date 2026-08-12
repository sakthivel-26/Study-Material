import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Search, Bell, ChevronDown, Settings, User, LogOut, Shield, Download } from "lucide-react";
import { Avatar } from "./ui.jsx";
import { useAuth } from "../auth.jsx";

export default function Header({ onMenu, unread, onSearch }) {
  const { user, signOut } = useAuth();
  const displayName = user?.name || "Guest";
  const initials = user?.initials || "GU";
  const photo = user?.photo || null;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-black/5 h-[72px]">
      <div className="h-full flex items-center gap-3 px-4 sm:px-6">
        {/* Hamburger */}
        <button
          onClick={onMenu}
          className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-black/5 text-ink-soft"
        >
          <Menu size={22} />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-2xl">
          <div className="relative group">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint group-focus-within:text-brand-600 transition-colors"
            />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                onSearch?.(e.target.value);
              }}
              placeholder="Search courses, videos, study materials..."
              className="input pl-10 bg-white/60 !rounded-2xl"
            />
          </div>
        </div>

        <div className="flex-1" />

        {/* Notification bell */}
        <Link
          to="/notifications"
          className="relative p-2.5 rounded-xl hover:bg-brand-50 text-ink-soft transition-colors"
        >
          <Bell size={21} />
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white"
            >
              {unread}
            </motion.span>
          )}
        </Link>

        {/* Profile */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2.5 pl-1.5 pr-2 py-1.5 rounded-2xl hover:bg-black/[0.04] transition-colors"
          >
            <Avatar initials={initials} photo={photo} size={38} ring />
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-sm font-semibold text-ink">{displayName}</p>
              <p className="text-[11px] text-ink-muted">{user?.role === "admin" ? "Admin" : "Student"}</p>
            </div>
            <ChevronDown
              size={16}
              className={`text-ink-muted hidden sm:block transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.16 }}
                className="absolute right-0 mt-3 w-64 rounded-card bg-white shadow-lift border border-black/5 p-2 overflow-hidden"
              >
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-br from-brand-50 to-fuchsia-50 mb-1">
                  <Avatar initials={initials} photo={photo} size={42} />
                  <div className="leading-tight">
                    <p className="font-bold text-sm text-ink">{displayName}</p>
                    <p className="text-xs text-ink-muted truncate">{user?.email}</p>
                  </div>
                </div>
                {[
                  { icon: User, label: "My Profile", to: "/profile" },
                  { icon: Download, label: "My Downloads", to: "/downloads" },
                  { icon: Settings, label: "Settings", to: "/settings" },
                  ...(user?.role === "admin"
                    ? [{ icon: Shield, label: "Admin Panel", to: "/admin", admin: true }]
                    : []),
                ].map((it) => (
                  <button
                    key={it.label}
                    onClick={() => {
                      setOpen(false);
                      navigate(it.to);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-soft hover:bg-brand-50 hover:text-brand-700 transition-colors"
                  >
                    <it.icon size={17} />
                    {it.label}
                  </button>
                ))}
                <div className="h-px bg-black/5 my-1" />
                <button
                  onClick={() => { setOpen(false); signOut(); navigate("/login"); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors"
                >
                  <LogOut size={17} />
                  Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
