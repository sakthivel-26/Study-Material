import { motion } from "framer-motion";

export function Logo({ size = 40, dark = false }) {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <div
        style={{ width: size, height: size }}
        className="relative rounded-2xl bg-gradient-to-br from-brand-600 to-fuchsia-500 flex items-center justify-center shadow-lift shrink-0"
      >
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3 3 7.5 12 12l9-4.5L12 3Z"
            fill="#fff"
            opacity="0.95"
          />
          <path
            d="M6.5 10v4.5c0 1.2 2.5 2.7 5.5 2.7s5.5-1.5 5.5-2.7V10"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M21 7.5V13"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 rounded-2xl ring-1 ring-white/30" />
      </div>
      {dark ? (
        <div className="leading-tight">
          <p className="text-white font-extrabold text-lg tracking-tight">KEN IAS</p>
          <p className="text-white/70 text-[11px] font-semibold -mt-0.5 tracking-wide">ACADEMY</p>
        </div>
      ) : (
        <div className="leading-tight">
          <p className="text-ink font-extrabold text-lg tracking-tight">KEN IAS</p>
          <p className="text-ink-muted text-[11px] font-semibold -mt-0.5 tracking-wide">ACADEMY</p>
        </div>
      )}
    </div>
  );
}

export function Avatar({ initials, photo, size = 40, ring = false }) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={initials}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover shrink-0 ${
          ring ? "ring-2 ring-white shadow-soft" : ""
        }`}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={`rounded-full bg-gradient-to-br from-brand-600 to-fuchsia-500 text-white font-bold flex items-center justify-center shrink-0 ${
        ring ? "ring-2 ring-white shadow-soft" : ""
      }`}
    >
      {initials}
    </div>
  );
}

export function ProgressBar({ value, color = "#6D28D9", trackClass = "" }) {
  return (
    <div className={`progress-track ${trackClass}`}>
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${value}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}CC)` }}
      />
    </div>
  );
}

export function Badge({ children, color = "#6D28D9", style }) {
  return (
    <span
      className="chip"
      style={{ background: `${color}1A`, color, ...style }}
    >
      {children}
    </span>
  );
}

export function SectionHeader({ title, subtitle, action, icon }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <div className="flex items-center gap-2.5">
          {icon && (
            <span className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
              {icon}
            </span>
          )}
          <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight">{title}</h2>
        </div>
        {subtitle && <p className="text-sm text-ink-muted mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Thumb({ className = "", children }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${className} flex items-center justify-center`}
    >
      <div className="absolute inset-0 bg-grid opacity-40" />
      {children}
      <div className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-xl" />
    </div>
  );
}
