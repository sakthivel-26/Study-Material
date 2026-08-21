import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { useAuth } from "../auth.jsx";
import { isFirebaseConfigured } from "../firebase.js";

// Official-ish Google "G" mark drawn as inline SVG (works in sandboxed preview).
export function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C40.2 35.5 44 30.2 44 24c0-1.3-.1-2.6-.4-3.9z"/>
    </svg>
  );
}

// A small generated avatar for a Google profile.
function GoogleAvatar({ seed, size = 40 }) {
  const palettes = [
    "from-sky-500 to-indigo-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
  ];
  const idx = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % palettes.length;
  const initials = seed
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      className={`rounded-full bg-gradient-to-br ${palettes[idx]} text-white font-bold flex items-center justify-center shrink-0`}
    >
      {initials}
    </div>
  );
}

// Mock Google accounts shown in the simulated "Choose an account" picker.
const MOCK_GOOGLE_ACCOUNTS = [
  { name: "Aarav Sharma", email: "aarav.sharma@gmail.com" },
  { name: "Meera Iyer", email: "meera.iyer@gmail.com" },
  { name: "Karthik Venkat", email: "karthik.venkat@gmail.com" },
];

export function GoogleButton({ label = "Continue with Google", variant = "soft", className = "" }) {
  const [open, setOpen] = useState(false);
  const { signInWithGoogle, loading } = useAuth();
  const [pending, setPending] = useState(null);
  const navigate = useNavigate();

  // Firebase mode: open the real Google OAuth popup immediately.
  const useRealOAuth = isFirebaseConfigured;

  const handleRealOAuth = async () => {
    setPending("__popup__");
    try {
      const u = await signInWithGoogle();
      navigate(u.role === "admin" ? "/admin" : "/", { replace: true });
    } catch {
      /* popup cancelled / error handled */
    } finally {
      setPending(null);
    }
  };

  const choose = async (account) => {
    setPending(account.email);
    const u = await signInWithGoogle(account);
    setOpen(false);
    setPending(null);
    // Google accounts default to the student role -> dashboard.
    navigate(u.role === "admin" ? "/admin" : "/", { replace: true });
  };

  return (
    <>
      <button
        type="button"
        onClick={useRealOAuth ? handleRealOAuth : () => setOpen(true)}
        disabled={pending === "__popup__"}
        className={`${variant === "soft" ? "btn-soft" : "btn border border-black/10 bg-white text-ink hover:bg-black/[0.03]"} w-full py-2.5 text-sm ${className}`}
      >
        {pending === "__popup__" ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <GoogleIcon size={18} />
        )}
        {pending === "__popup__" ? "Opening Google..." : label}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-sm p-4 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white overflow-hidden shadow-lift"
            >
              {/* Picker header */}
              <div className="bg-[#f8fafc] px-6 pt-6 pb-4 flex items-center justify-between border-b border-black/5">
                <div>
                  <p className="font-extrabold text-lg text-ink">Choose an account</p>
                  <p className="text-sm text-ink-muted">to continue to KEN IAS Academy</p>
                </div>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-black/5"><X size={18} className="text-ink-muted" /></button>
              </div>

              {/* Accounts */}
              <div className="p-3">
                {MOCK_GOOGLE_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => choose(acc)}
                    disabled={!!pending}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-black/[0.04] transition-colors text-left group"
                  >
                    <GoogleAvatar seed={acc.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink group-hover:underline">{acc.name}</p>
                      <p className="text-xs text-ink-muted truncate">{acc.email}</p>
                    </div>
                    {pending === acc.email ? (
                      <Loader2 size={18} className="animate-spin text-brand-600" />
                    ) : (
                      <span className="text-brand-700 text-sm font-medium opacity-0 group-hover:opacity-100">Continue →</span>
                    )}
                  </button>
                ))}

                <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-black/[0.04] transition-colors text-left">
                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-black/20 text-black/40 font-bold flex items-center justify-center text-xl">+</div>
                  <span className="text-sm text-ink-soft">Use another account</span>
                </button>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-[#f8fafc] border-t border-black/5">
                <p className="text-[11px] text-ink-faint flex items-center gap-1.5">
                  <ShieldCheck size={13} /> Demo sign-in — no real Google account is used. In production this opens Google's official OAuth popup via Firebase.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
