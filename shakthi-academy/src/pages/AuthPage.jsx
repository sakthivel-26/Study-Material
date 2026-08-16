import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2,
  Loader2, ShieldCheck, GraduationCap, BookOpen, Award, Sparkles,
} from "lucide-react";
import { Logo, Avatar } from "../components/ui.jsx";
import { useAuth } from "../auth.jsx";
import { GoogleButton } from "../components/GoogleAuth.jsx";
import { CATEGORIES } from "../data.js";

// Left panel illustration / brand panel shared across auth screens.
function BrandPanel() {
  return (
    <div className="relative hidden lg:flex lg:w-[45%] bg-hero text-white overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-fuchsia-400/25 blur-3xl" />

      <div className="relative z-10 flex flex-col p-10 w-full">
        <Logo dark />
        <div className="flex-1 flex flex-col justify-center max-w-sm">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 glass-dark px-3 py-1.5 rounded-full text-xs font-semibold w-fit mb-6"
          >
            <Sparkles size={13} className="text-amber-300" /> India's most loved
            exam-prep academy
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-3xl font-extrabold leading-tight mb-4"
          >
            Crack UPSC, TNPSC, Banking, SSC &amp; Railway exams.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/80 text-sm mb-8"
          >
            Daily practice, mock tests, video lectures and study material —
            everything you need in one premium platform.
          </motion.p>

          <div className="space-y-3">
            {[
              { icon: Sparkles, text: "If this army loses, which army will win?" },
            ].map((f, i) => (
              <motion.div
                key={f.text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="flex items-center gap-3 glass-dark rounded-xl px-4 py-3 text-sm font-medium"
              >
                <f.icon size={17} className="text-amber-300 shrink-0" />
                {f.text}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="text-xs text-white/50 mt-8 flex items-center gap-2">
          <ShieldCheck size={13} /> Secure · Private · Ad-free learning
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, type = "text", value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <label className="text-sm font-medium text-ink-soft mb-1.5 block">{label}</label>
      <div className="relative">
        <Icon size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="input pl-10 pr-10 !rounded-xl"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-soft"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-600"
    >
      <span>⚠️</span> <span>{message}</span>
    </motion.div>
  );
}

function AuthToast({ msg }) {
  if (!msg) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-3 bg-ink text-white pl-4 pr-5 py-3 rounded-2xl shadow-lift"
    >
      <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
      <span className="text-sm font-medium">{msg}</span>
    </motion.div>
  );
}

/* ------------------------------- LOGIN ----------------------------------- */
export function LoginPage() {
  const { signIn, loading, error, toastMsg, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      const u = await signIn({ email, password });
      navigate(u.role === "admin" ? "/admin" : "/", { replace: true });
    } catch {
      /* handled in state */
    }
  };

  const quick = async (role) => {
    try {
      const u = await signIn(
        role === "admin"
          ? { email: "admin@kenias.academy", password: "admin123" }
          : { email: "arjun.kumar@gmail.com", password: "student123" }
      );
      navigate(u.role === "admin" ? "/admin" : "/", { replace: true });
    } catch {
      /* handled */
    }
  };

  return (
    <div className="min-h-screen flex bg-appbg">
      <BrandPanel />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6"><Logo /></div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-7 sm:p-9 shadow-soft">
            <h1 className="text-2xl font-extrabold text-ink tracking-tight">Welcome back 👋</h1>
            <p className="text-sm text-ink-muted mt-1 mb-6">Log in to continue learning.</p>

            <ErrorBanner message={error} />
            <form onSubmit={submit} className="space-y-4 mt-4">
              <Field icon={Mail} label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
              <div>
                <Field icon={Lock} label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" autoComplete="current-password" />
                <div className="text-right mt-1.5">
                  <button type="button" onClick={() => navigate("/forgot-password")} className="text-xs font-semibold text-brand-700 hover:text-brand-800">
                    Forgot password?
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : <>Log in <ArrowRight size={16} /></>}
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="h-px flex-1 bg-black/10" /><span className="text-xs text-ink-faint">or</span><div className="h-px flex-1 bg-black/10" />
            </div>
            <GoogleButton />
            <button type="button" onClick={() => navigate("/mobile-login")} className="btn-ghost w-full mt-3 py-2.5 text-sm"><Phone size={16} /> Log in with mobile OTP</button>
            <div className="mt-3 text-center">
              <button type="button" onClick={() => navigate("/signup")} className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                New here? Create an account
              </button>
            </div>

            <div className="mt-5 pt-5 border-t border-black/5">
              <p className="text-xs text-ink-faint mb-3">Quick demo access</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => quick("student")} className="btn-ghost text-xs py-2.5"><GraduationCap size={14} /> Student</button>
                <button onClick={() => quick("admin")} className="btn-ghost text-xs py-2.5"><ShieldCheck size={14} /> Admin</button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <AuthToast msg={toastMsg} />
    </div>
  );
}

/* ---------------------------- MOBILE OTP LOGIN ---------------------------- */
export function MobileLoginPage() {
  const { sendPhoneOtp, verifyPhoneOtp, loading, error, toastMsg, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate(); const [name,setName]=useState(""); const [phone,setPhone]=useState(""); const [otp,setOtp]=useState(""); const [sent,setSent]=useState(false); const [localError,setLocalError]=useState("");
  const send=async(e)=>{ e.preventDefault(); setLocalError(""); try { if (!name.trim()) throw new Error("Enter your full name."); await sendPhoneOtp(phone); setSent(true); } catch(err) { setLocalError(err.message || "Could not send OTP."); } };
  const verify=async(e)=>{e.preventDefault();setLocalError("");try{const u=await verifyPhoneOtp(otp, name);navigate(u.role==="admin"?"/admin":"/",{replace:true})}catch(err){setLocalError(err.message||"OTP verification failed.")}};
  return <div className="min-h-screen flex bg-appbg"><BrandPanel/><div className="flex-1 flex items-center justify-center p-6"><div className="w-full max-w-md"><div className="lg:hidden mb-6"><Logo/></div><motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="card p-7 sm:p-9 shadow-soft"><button onClick={()=>navigate("/login")} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-brand-700 mb-5"><ArrowLeft size={15}/>Back to login</button><h1 className="text-2xl font-extrabold text-ink">Login with mobile OTP</h1><p className="text-sm text-ink-muted mt-1 mb-6">We will verify your mobile number with a one-time password.</p><ErrorBanner message={localError||error}/>{!sent?<form onSubmit={send} className="space-y-4 mt-4"><Field icon={User} label="Full name" value={name} onChange={setName} placeholder="Your full name" autoComplete="name"/><Field icon={Phone} label="Indian mobile number" type="tel" value={phone} onChange={setPhone} placeholder="98765 43210" autoComplete="tel"/><button className="btn-primary w-full py-3" disabled={loading}>{loading?<Loader2 className="animate-spin" size={16}/>:<><Phone size={16}/>Send OTP</>}</button></form>:<form onSubmit={verify} className="space-y-4 mt-4"><Field icon={Lock} label="Enter OTP" value={otp} onChange={setOtp} placeholder="6-digit OTP" autoComplete="one-time-code"/><div id="otp-recaptcha"/><button className="btn-primary w-full py-3" disabled={loading}>{loading?<Loader2 className="animate-spin" size={16}/>:<>Verify & login <ArrowRight size={16}/></>}</button><button type="button" onClick={()=>setSent(false)} className="w-full text-sm font-semibold text-brand-700">Change mobile number</button>{!isFirebaseConfigured&&<p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Demo mode: enter OTP <b>123456</b>. Configure Firebase Phone Authentication for real SMS OTP.</p>}</form>}</motion.div></div></div><AuthToast msg={toastMsg}/></div>;
}

/* ------------------------------- SIGN UP --------------------------------- */
export function SignupPage() {
  const { signUp, loading, error, toastMsg } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", enrolled: "IBPS PO / Clerk" });
  const [localErr, setLocalErr] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const [verifySent, setVerifySent] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    setLocalErr(null);
    if (!form.name.trim()) return setLocalErr("Please enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setLocalErr("Please enter a valid email address.");
    if (form.password.length < 6) return setLocalErr("Password must be at least 6 characters.");
    if (form.password !== form.confirm) return setLocalErr("Passwords do not match.");
    try {
      const r = await signUp({ name: form.name, email: form.email, password: form.password, role: "student", enrolled: form.enrolled });
      // Firebase mode requires email verification before the first login.
      if (r && r.needsVerification) {
        setVerifySent(r.email);
        return;
      }
      navigate("/", { replace: true });
    } catch (err) {
      if (err.message === "email-exists") setLocalErr("An account with this email already exists.");
    }
  };

  return (
    <div className="min-h-screen flex bg-appbg">
      <BrandPanel />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6"><Logo /></div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-7 sm:p-9 shadow-soft">
            {verifySent ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <Mail size={28} />
                </div>
                <h1 className="text-xl font-extrabold text-ink tracking-tight mb-2">Verify your email</h1>
                <p className="text-sm text-ink-muted mb-6">
                  We've sent a verification link to <span className="font-semibold text-brand-700">{verifySent}</span>.
                  Click the link in your inbox, then log in to get started.
                </p>
                <button onClick={() => navigate("/login")} className="btn-primary w-full py-3 text-sm">
                  Go to login
                </button>
              </div>
            ) : (
              <>
            <h1 className="text-2xl font-extrabold text-ink tracking-tight">Create your account 🚀</h1>
            <p className="text-sm text-ink-muted mt-1 mb-6">Join thousands of students already preparing with us.</p>

            <ErrorBanner message={localErr || error} />
            <form onSubmit={submit} className="space-y-4 mt-4">
              <Field icon={User} label="Full name" value={form.name} onChange={(v) => set("name", v)} placeholder="Arjun Kumar" autoComplete="name" />
              <Field icon={Mail} label="Email address" type="email" value={form.email} onChange={(v) => set("email", v)} placeholder="you@example.com" autoComplete="email" />
              <div>
                <label className="text-sm font-medium text-ink-soft mb-1.5 block">Preparing for</label>
                <div className="relative">
                  <GraduationCap size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint z-10" />
                  <select 
                    value={form.enrolled}
                    onChange={(e) => set("enrolled", e.target.value)}
                    className="input pl-10 pr-10 !rounded-xl relative"
                  >
                    {CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field icon={Lock} label="Password" type="password" value={form.password} onChange={(v) => set("password", v)} placeholder="6+ chars" autoComplete="new-password" />
                <Field icon={Lock} label="Confirm" type="password" value={form.confirm} onChange={(v) => set("confirm", v)} placeholder="Repeat" autoComplete="new-password" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : <>Sign up free <ArrowRight size={16} /></>}
              </button>
            </form>

            <p className="text-xs text-ink-muted mt-4 text-center">
              By signing up you agree to our Terms &amp; Privacy Policy.
            </p>
            <div className="mt-5 pt-5 border-t border-black/5 text-center">
              <p className="text-sm text-ink-muted">Already have an account?{" "}
                <button onClick={() => navigate("/login")} className="font-semibold text-brand-700 hover:text-brand-800">Log in</button>
              </p>
            </div>
            </>
            )}
          </motion.div>
        </div>
      </div>
      <AuthToast msg={toastMsg} />
    </div>
  );
}

/* ---------------------------- FORGOT PASSWORD ----------------------------- */
export function ForgotPasswordPage() {
  const { requestReset, error, toastMsg } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestReset({ email });
      setSent(true);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-appbg">
      <BrandPanel />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6"><Logo /></div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-7 sm:p-9 shadow-soft">
            <button onClick={() => navigate("/login")} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-brand-700 mb-5">
              <ArrowLeft size={15} /> Back to login
            </button>
            <h1 className="text-2xl font-extrabold text-ink tracking-tight">Reset password</h1>
            <p className="text-sm text-ink-muted mt-1 mb-6">
              Enter your account email and we'll send you a reset link.
            </p>

            <ErrorBanner message={error} />

            {sent ? (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl bg-emerald-50 border border-emerald-100 p-5 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                  <CheckCircle2 size={24} />
                </div>
                <p className="font-bold text-emerald-700 mb-1">Check your inbox</p>
                <p className="text-sm text-emerald-600">
                  We've sent a password reset link to <span className="font-semibold">{email}</span>.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={submit} className="space-y-4 mt-4">
                <Field icon={Mail} label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <>Send reset link</>}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
      <AuthToast msg={toastMsg} />
    </div>
  );
}

/* ------------------------------ AVATAR for navbar ------------------------- */
export function AuthAvatar({ size = 38 }) {
  const { user } = useAuth();
  return <Avatar initials={user?.initials || "GU"} size={size} ring />;
}
