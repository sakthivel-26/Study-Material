import { Bell, CheckCheck } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { useApp } from "../store.jsx";
import { motion } from "framer-motion";

export default function NotificationsPage() {
  const { notifications, markAllRead, pushToast } = useApp();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <PageHeader
        icon={<Bell size={22} />}
        title="Notifications"
        subtitle={`${unread} unread notifications`}
        action={
          <button onClick={() => { markAllRead(); pushToast("All notifications marked as read"); }} className="btn-ghost text-sm px-4 py-2.5">
            <CheckCheck size={16} /> Mark all read
          </button>
        }
      />
      <div className="card divide-y divide-black/5">
        {notifications.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`flex gap-4 p-4 ${n.read ? "" : "bg-brand-50/40"}`}
          >
            <div className="w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center text-xl" style={{ background: `${n.color}1A` }}>
              {n.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`font-bold text-sm ${n.read ? "text-ink-soft" : "text-ink"}`}>{n.title}</p>
                {!n.read && <span className="w-2 h-2 rounded-full bg-brand-600" />}
              </div>
              <p className="text-sm text-ink-muted">{n.body}</p>
              <p className="text-xs text-ink-faint mt-0.5">{n.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}
