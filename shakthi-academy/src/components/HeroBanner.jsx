import { motion } from "framer-motion";
import { Compass, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

function Illustration() {
  return (
    <svg viewBox="0 0 360 240" className="w-full h-auto" aria-hidden="true">
      {/* Graduation cap */}
      <g>
        <motion.g
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <rect x="150" y="120" width="70" height="46" rx="8" fill="#ffffff" opacity="0.95" />
          <path d="M140 126 L185 100 L230 126 Z" fill="#FDE68A" />
          <path d="M185 100 l14 -22 a6 6 0 0 1 10 4 l-8 20 Z" fill="#FDE68A" />
          <path d="M185 118 v34 a10 10 0 0 1 -20 0 v-34 Z" fill="#EDE9FE" />
          <circle cx="185" cy="126" r="6" fill="#7C3AED" />
        </motion.g>
      </g>

      {/* Books */}
      <g>
        <motion.g
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        >
          <rect x="52" y="150" width="22" height="62" rx="5" fill="#C4B5FD" />
          <rect x="78" y="142" width="22" height="70" rx="5" fill="#A78BFA" />
          <rect x="104" y="152" width="22" height="60" rx="5" fill="#DDD6FE" />
          <rect x="52" y="150" width="74" height="10" rx="4" fill="#EDE9FE" />
        </motion.g>
      </g>

      {/* Laptop */}
      <g>
        <motion.g
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        >
          <rect x="225" y="128" width="88" height="58" rx="7" fill="#ffffff" />
          <rect x="225" y="128" width="88" height="12" rx="5" fill="#EDE9FE" />
          <circle cx="300" cy="182" r="6" fill="#C4B5FD" />
          <rect x="214" y="184" width="110" height="9" rx="4.5" fill="#ffffff" opacity="0.9" />
          <line x1="242" y1="158" x2="292" y2="158" stroke="#DDD6FE" strokeWidth="3" strokeLinecap="round" />
          <line x1="242" y1="168" x2="276" y2="168" stroke="#EDE9FE" strokeWidth="3" strokeLinecap="round" />
        </motion.g>
      </g>

      {/* Sparkles */}
      <circle cx="280" cy="92" r="4" fill="#FDE68A" />
      <circle cx="40" cy="120" r="3" fill="#ffffff" opacity="0.8" />
      <circle cx="320" cy="120" r="3" fill="#ffffff" opacity="0.7" />
      <path d="M190 60 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" fill="#FDE68A" opacity="0.9" />
    </svg>
  );
}

export default function HeroBanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = (user?.name || "Student").trim().split(/\s+/)[0];
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-card bg-hero text-white shadow-lift"
    >
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-24 -left-10 w-80 h-80 rounded-full bg-fuchsia-400/20 blur-3xl" />

      <div className="relative z-10 grid md:grid-cols-[1.2fr_1fr] items-center gap-6 p-7 sm:p-10">
        <div>
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 glass-dark px-3 py-1.5 rounded-full text-xs font-semibold text-white/90 mb-4"
          >
            <Flame size={14} className="text-amber-300" />
            Start your learning journey today
          </motion.span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-3">
            Welcome Back, {firstName} 👋
          </h1>
          <p className="text-white/85 text-base sm:text-lg font-medium mb-1">
            Keep learning every day.
          </p>
          <p className="text-white/70 text-sm mb-6">
            Your success starts with consistency.
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/courses")}
            className="btn bg-white text-brand-700 hover:bg-white/95 shadow-xl px-6 py-3"
          >
            <Compass size={18} />
            Explore Courses
          </motion.button>
        </div>

        <div className="hidden md:block">
          <Illustration />
        </div>
      </div>
    </motion.section>
  );
}
