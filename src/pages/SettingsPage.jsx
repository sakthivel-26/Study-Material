import { useState } from "react";
import { Settings, Bell, Palette, Shield, Download, LogOut, Trash2, Database } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { useApp } from "../store.jsx";
import { useAuth } from "../auth.jsx";

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`w-11 h-6 rounded-full relative transition-colors ${on ? "bg-brand-600" : "bg-black/15"}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const { pushToast, resetAllData } = useApp();
  const { isFirebaseConfigured } = useAuth();
  const [pref, setPref] = useState({
    push: true,
    email: true,
    pdf: true,
    dark: document.documentElement.classList.contains("dark"),
    dataSaver: false,
  });

  const set = (k) => {
    setPref((p) => {
      const nextVal = !p[k];
      if (k === "dark") {
        if (nextVal) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", nextVal ? "dark" : "light");
      }
      return { ...p, [k]: nextVal };
    });
  };

  const groups = [
    { icon: Bell, title: "Notifications", desc: "Push & in-app alerts",
      items: [
        { k: "push", label: "Push notifications" },
        { k: "email", label: "Email updates" },
      ] },
    { icon: Download, title: "Downloads", desc: "Storage preferences",
      items: [
        { k: "pdf", label: "Auto-download PDFs on Wi-Fi" },
        { k: "dataSaver", label: "Data saver for videos" },
      ] },
    { icon: Palette, title: "Appearance", desc: "Theme options",
      items: [
        { k: "dark", label: "Dark mode (Mock Test UI)" },
      ] },
  ];

  return (
    <>
      <PageHeader icon={<Settings size={22} />} title="Settings" subtitle="Personalize your KEN IAS Academy experience" />
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.title} className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center"><g.icon size={18} /></span>
                <div>
                  <h3 className="font-bold text-ink">{g.title}</h3>
                  <p className="text-xs text-ink-muted">{g.desc}</p>
                </div>
              </div>
              <div className="divide-y divide-black/5">
                {g.items.map((it) => (
                  <div key={it.k} className="flex items-center justify-between py-3">
                    <span className="text-sm text-ink-soft">{it.label}</span>
                    <Toggle on={pref[it.k]} onChange={() => { set(it.k); pushToast("Preference saved"); }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center"><Shield size={18} /></span>
              <h3 className="font-bold text-ink">Account</h3>
            </div>
            <div className="space-y-2">
              <button onClick={() => pushToast("Signed out — goodbye 👋")} className="btn-soft w-full py-2.5 text-sm"><LogOut size={15} /> Log out</button>
              <button onClick={() => pushToast("Password change sent to your email")} className="btn-soft w-full py-2.5 text-sm">Change password</button>
            </div>
          </div>
          <div className="card p-5 border-rose-200">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center"><Database size={18} /></span>
              <div>
                <h3 className="font-bold text-ink">Danger zone</h3>
                <p className="text-xs text-ink-muted">Reset all content</p>
              </div>
            </div>
            <p className="text-xs text-ink-muted mb-3">
              {isFirebaseConfigured
                ? "Resets demo content to default. Connected to Firebase — data is managed in Firestore."
                : "Clears all demo uploads, notifications and progress back to the original seed data."}
            </p>
            <button
              onClick={() => {
                resetAllData();
                pushToast("All data reset ✓");
              }}
              className="w-full btn bg-rose-50 text-rose-600 hover:bg-rose-100 py-2.5 text-sm"
            >
              <Trash2 size={15} /> Reset all data
            </button>
          </div>
          <div className="card p-5 text-center">
            <p className="font-bold text-ink">KEN IAS Academy</p>
            <p className="text-xs text-ink-muted mt-1">
              Version 1.0.0 · {isFirebaseConfigured ? "Firebase connected" : "Demo mode"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
