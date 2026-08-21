import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";
import Toast from "./Toast.jsx";
import { useApp } from "../store.jsx";

export default function Layout() {
  const [menu, setMenu] = useState(false);
  const { notifications } = useApp();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen">
      <Sidebar open={menu} onClose={() => setMenu(false)} unread={unread} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenu={() => setMenu(true)} unread={unread} />
        <main className="flex-1 w-full px-4 sm:px-6 py-6 max-w-[1400px] mx-auto">
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  );
}
