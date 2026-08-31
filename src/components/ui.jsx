import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export function Logo({ size = 40, dark = false }) {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <img 
        src="/image.png" 
        alt="Ken Academy"
        style={{ width: size, height: size }}
        className="object-contain shrink-0"
        onError={(e) => {
          // Fallback if image.png is missing
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
      <div
        style={{ width: size, height: size, display: 'none' }}
        className="relative rounded-lg bg-white items-center justify-center shadow-card border-2 border-brand-600 shrink-0 overflow-hidden"
      >
        <div className="absolute top-1/2 left-0 right-0 h-3 bg-accent-500 -translate-y-1/2 shadow-sm z-0" />
        <Shield size={size * 0.65} className="text-brand-700 fill-white relative z-10" />
        <span className="absolute z-20 text-[10px] font-extrabold text-accent-700 top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2">
          KA
        </span>
      </div>
      {dark ? (
        <div className="leading-tight">
          <p className="text-white font-extrabold text-lg tracking-tight">KEN <span className="text-accent-400">ACADEMY</span></p>
        </div>
      ) : (
        <div className="leading-tight">
          <p className="text-brand-700 font-extrabold text-lg tracking-tight">KEN <span className="text-accent-600">ACADEMY</span></p>
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
      className={`rounded-full bg-gradient-to-br from-brand-600 to-accent-600 text-white font-bold flex items-center justify-center shrink-0 ${
        ring ? "ring-2 ring-white shadow-soft" : ""
      }`}
    >
      {initials}
    </div>
  );
}

export function ProgressBar({ value, color = "#1B4F72", trackClass = "" }) {
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

export function Badge({ children, color = "#1B4F72", style }) {
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
