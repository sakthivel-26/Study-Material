import { motion } from "framer-motion";

export default function PageHeader({ icon, title, subtitle, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center justify-between gap-3 mb-6"
    >
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-fuchsia-500 text-white flex items-center justify-center shadow-lift">
          {icon}
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </motion.div>
  );
}
