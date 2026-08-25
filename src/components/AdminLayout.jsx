import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, UploadCloud, Youtube, ClipboardPlus, Users, Megaphone,
  TrendingUp, BookOpen, Tags, Settings, ArrowLeft, Menu, X,
} from "lucide-react";
import { Logo, Avatar } from "./ui.jsx";
import Toast from "./Toast.jsx";
import { useAuth } from "../auth.jsx";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/upload?type=pdf", label: "Upload Materials", icon: UploadCloud },
  { to: "/admin/upload?type=video", label: "Add YouTube Video", icon: Youtube },
  { to: "/admin/mock-test", label: "Create Mock Test", icon: ClipboardPlus },
  { to: "/admin/students", label: "Manage Students", icon: Users },
  { to: "/admin/announcements", label: "Notifications", icon: Megaphone },
  { to: "/admin/courses", label: "Manage Courses", icon: BookOpen },
  { to: "/admin/plans", label: "Plans & Offers", icon: Tags },
  { to: "/admin/account", label: "Admin Profile & Payments", icon: Settings },
];

export default function AdminLayout() {
  const { user } = useAuth();
  const [menu, setMenu] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen">
      {/* Overlay */}
      <AnimatePresence>
        {menu && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setMenu(false)} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" />
        )}
      </AnimatePresence>

      <aside className={`fixed z-50 top-0 left-0 h-full w-[264px] bg-white border-r border-black/5 flex flex-col transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen ${menu ? "translate-x-0 shadow-lift" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center justify-between px-5 h-[72px] border-b border-black/5 shrink-0">
          <Logo />
          <button onClick={()=>setMenu(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-black/5"><X size={20} className="text-ink-muted" /></button>
        </div>
        <div className="px-4 py-3">
          <span className="chip bg-fuchsia-50 text-fuchsia-600">🎛 Admin Panel</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3.5 pb-3 space-y-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={()=>setMenu(false)}
              className={({isActive})=>`nav-item ${isActive?"nav-item-active":""} relative`}
            >
              {({isActive})=>(
                <>
                  {isActive && <motion.span layoutId="admin-pill" className="absolute inset-0 rounded-xl bg-brand-700 shadow-lift" transition={{type:"spring",stiffness:400,damping:34}} />}
                  <item.icon size={19} className={`relative z-10 ${isActive?"text-white":"text-ink-muted"}`} />
                  <span className={`relative z-10 ${isActive?"text-white":""}`}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-black/5">
          <button onClick={()=>navigate("/")} className="btn-soft w-full py-2.5 text-sm"><ArrowLeft size={15} /> Back to student view</button>
          <div className="flex items-center gap-3 mt-3 px-1">
            <Avatar initials={user?.initials || "AD"} size={34} />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-ink">{user?.name || "Admin"}</p>
              <p className="text-[11px] text-brand-700 font-medium">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-black/5 h-[72px] flex items-center gap-3 px-4 sm:px-6">
          <button onClick={()=>setMenu(true)} className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-black/5 text-ink-soft"><Menu size={22} /></button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-fuchsia-500 text-white flex items-center justify-center shrink-0"><TrendingUp size={18} /></div>
          <div>
            <p className="font-bold text-ink">KEN IAS Academy</p>
            <p className="text-xs text-ink-muted">Admin Control Center</p>
          </div>
        </header>
        <main className="flex-1 w-full px-4 sm:px-6 py-6 max-w-[1400px] mx-auto">
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  );
}
