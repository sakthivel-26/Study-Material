import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle, GraduationCap, Monitor, Building2, MapPin, Phone, User as UserIcon, BookOpen } from "lucide-react";
import { fsAddAdmission } from "../backend.js";
import { useAuth } from "../auth.jsx";
import { TN_DISTRICTS, ADMISSION_COURSES } from "../data/districts.js";

export function AdmissionModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    emailId: "",
    course: "Banking (IBPS, SBI, RRB PO & Clerk)",
    modeOfLearning: "Offline Classroom Coaching",
    district: "Chennai"
  });

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        mobileNumber: prev.mobileNumber || user.phone || "",
        emailId: prev.emailId || user.email || ""
      }));
    }
  }, [user]);

  // Listen to open events from Left Sidebar or anywhere in the app
  useEffect(() => {
    const handleOpen = () => {
      setIsSubmitted(false);
      setIsOpen(true);
    };
    window.addEventListener("ken_open_admission", handleOpen);
    return () => window.removeEventListener("ken_open_admission", handleOpen);
  }, []);

  // Timed popup for first-time visitors if they haven't submitted yet
  useEffect(() => {
    const hasClosed = localStorage.getItem("ken_ias_admission_closed");
    const hasSubmitted = localStorage.getItem("ken_ias_admission_submitted");
    const hasPhone = localStorage.getItem("user_phone_submitted") || user?.phone;

    if (!hasClosed && !hasSubmitted && !hasPhone) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 25000); // 25 seconds
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("ken_ias_admission_closed", "true");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.mobileNumber.trim() || !formData.modeOfLearning) return;

    setIsLoading(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        name: formData.fullName.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        phone: formData.mobileNumber.trim(),
        emailId: formData.emailId?.trim() || "",
        course: formData.course,
        targetExam: formData.course,
        modeOfLearning: formData.modeOfLearning,
        district: formData.district,
        source: "student_dashboard_admission",
        createdAt: new Date().toISOString()
      };

      await fsAddAdmission(payload);
      setIsSubmitted(true);
      localStorage.setItem("ken_ias_admission_submitted", "true");
      localStorage.setItem("ken_ias_admission_closed", "true");
      localStorage.setItem("user_phone_submitted", formData.mobileNumber);

      // Auto close after 3 seconds
      setTimeout(() => {
        setIsOpen(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to submit admission inquiry", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
            className="fixed top-1/2 left-1/2 w-[94%] sm:w-full max-w-lg bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-brand-700 to-brand-900 text-white shrink-0">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-white">
                  <GraduationCap size={22} />
                </span>
                <div>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold tracking-wide uppercase mb-0.5">
                    Admissions Open 2026
                  </span>
                  <h2 className="text-lg font-extrabold text-white leading-tight">
                    Shakthi Academy Admission Inquiry
                  </h2>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto">
              {isSubmitted ? (
                <div className="py-8 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                    <CheckCircle size={36} />
                  </div>
                  <h3 className="text-xl font-extrabold text-ink mb-2">Application Received!</h3>
                  <p className="text-sm text-ink-muted max-w-xs mx-auto">
                    Thank you, <span className="font-semibold text-ink">{formData.fullName}</span>. Our admission counselors will contact you shortly regarding the <span className="font-semibold text-brand-700">{formData.course}</span> batch.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon size={16} className="absolute left-3.5 top-3 text-ink-faint" />
                      <input
                        required
                        type="text"
                        placeholder="Enter your full name"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm transition-all"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Mobile & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3.5 top-3 text-ink-faint" />
                        <input
                          required
                          type="tel"
                          placeholder="10-digit mobile"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm transition-all"
                          value={formData.mobileNumber}
                          onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                        District <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin size={16} className="absolute left-3.5 top-3 text-ink-faint pointer-events-none" />
                        <select
                          required
                          className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm transition-all bg-white appearance-none cursor-pointer"
                          value={formData.district}
                          onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        >
                          {TN_DISTRICTS.map((dist) => (
                            <option key={dist} value={dist}>
                              {dist}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Which Course */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                      Which Course? <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <BookOpen size={16} className="absolute left-3.5 top-3 text-ink-faint pointer-events-none" />
                      <select
                        required
                        className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm transition-all bg-white appearance-none cursor-pointer"
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      >
                        {ADMISSION_COURSES.map((course) => (
                          <option key={course} value={course}>
                            {course}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Online or Offline Mode */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                      Mode of Learning (Online or Offline) <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, modeOfLearning: "Online Live Class" })}
                        className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                          formData.modeOfLearning.includes("Online")
                            ? "border-brand-600 bg-brand-50/70 ring-2 ring-brand-200 shadow-xs"
                            : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/60"
                        }`}
                      >
                        <Monitor size={18} className={formData.modeOfLearning.includes("Online") ? "text-brand-700 shrink-0 mt-0.5" : "text-ink-muted shrink-0 mt-0.5"} />
                        <div>
                          <p className="text-xs font-extrabold text-ink leading-tight">Online Live</p>
                          <p className="text-[10px] text-ink-muted mt-0.5">Classes & recorded videos</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, modeOfLearning: "Offline Classroom Coaching" })}
                        className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                          formData.modeOfLearning.includes("Offline")
                            ? "border-brand-600 bg-brand-50/70 ring-2 ring-brand-200 shadow-xs"
                            : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/60"
                        }`}
                      >
                        <Building2 size={18} className={formData.modeOfLearning.includes("Offline") ? "text-brand-700 shrink-0 mt-0.5" : "text-ink-muted shrink-0 mt-0.5"} />
                        <div>
                          <p className="text-xs font-extrabold text-ink leading-tight">Offline Direct</p>
                          <p className="text-[10px] text-ink-muted mt-0.5">Classroom & library</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 bg-brand-700 hover:bg-brand-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm active:scale-[0.99] cursor-pointer"
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <GraduationCap size={18} />}
                    Submit Admission Inquiry
                  </button>

                  <p className="text-[11px] text-center text-slate-400 mt-2 leading-relaxed">
                    Our team will contact you with batch dates, fee structure &amp; syllabus details. Need urgent help? Call Admission Hotline:{" "}
                    <a href="tel:+917530015494" className="font-bold text-brand-700 hover:underline">
                      +91 7530015494
                    </a>
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
