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
  const { notifications } = useApp();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen bg-appbg">
      <Sidebar open={menu} onClose={() => setMenu(false)} unread={unread} />
      <div className="flex-1 flex flex-col min-w-0 bg-appbg">
        <Header onMenu={() => setMenu(true)} unread={unread} />
        <main className="flex-1 w-full px-4 sm:px-6 py-6 max-w-[1400px] mx-auto min-h-screen">
          <Outlet />
        </main>
        <Footer />
      </div>
      <Toast />
    </div>
  );
}
