import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";
import Toast from "./Toast.jsx";
import { useApp } from "../store.jsx";

import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="w-full border-t border-black/5 py-8 mt-12 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-ink-muted">
        <div>&copy; {new Date().getFullYear()} Ken Academy. All rights reserved.</div>
        <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
          <Link to="/privacy" className="hover:text-brand-600 transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-brand-600 transition-colors">Terms</Link>
          <Link to="/cookies" className="hover:text-brand-600 transition-colors">Cookies</Link>
          <Link to="/refund" className="hover:text-brand-600 transition-colors">Refund Policy</Link>
          <Link to="/contact" className="hover:text-brand-600 transition-colors">Contact Support</Link>
        </div>
      </div>
    </footer>
  );
}

export default function Layout() {
  const [menu, setMenu] = useState(false);
  const { notifications, promoBanner, updatePromoBanner } = useApp();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen bg-appbg">
      <Sidebar open={menu} onClose={() => setMenu(false)} unread={unread} />
      <div className="flex-1 flex flex-col min-w-0 bg-appbg">
        <Header onMenu={() => setMenu(true)} unread={unread} />
        {promoBanner?.enabled && (
          <div className={`${promoBanner.color || "bg-brand-600"} text-white px-4 py-2 flex items-center justify-between text-sm shadow-sm z-10 relative overflow-hidden gap-3`}>
            <div className="flex items-center shrink-0 z-20">
              {promoBanner.image && <img src={promoBanner.image} alt="Offer" className="h-7 w-auto object-contain rounded bg-white/10" />}
              {!promoBanner.image && <span className="bg-white/20 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider shrink-0">Offer</span>}
            </div>
            
            <div className="flex-1 overflow-hidden h-full flex items-center mask-image-edges">
              <p className="font-medium text-[13px] sm:text-sm animate-marquee whitespace-nowrap">
                {promoBanner.text} {promoBanner.code && <b>{promoBanner.code}</b>}
              </p>
            </div>

            <button onClick={() => updatePromoBanner({ ...promoBanner, enabled: false })} className="shrink-0 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors z-20">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        )}
        <main className="flex-1 w-full px-4 sm:px-6 py-6 max-w-[1400px] mx-auto min-h-screen">
          <Outlet />
        </main>
        <Footer />
      </div>
      <Toast />
    </div>
  );
}
