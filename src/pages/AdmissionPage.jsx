import { useState, useEffect } from "react";
import { GraduationCap, Phone, MapPin, Monitor, Building2, BookOpen, CheckCircle2, User as UserIcon, Loader2, Award, Users, Sparkles } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../auth.jsx";
import { useApp } from "../store.jsx";
import { fsAddAdmission } from "../backend.js";
import { TN_DISTRICTS, ADMISSION_COURSES } from "../data/districts.js";

export default function AdmissionPage() {
  const { user } = useAuth();
  const { pushToast } = useApp();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.mobileNumber.trim() || !formData.modeOfLearning) {
      pushToast("Please fill all required fields");
      return;
    }

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
        source: "admission_page_form",
        createdAt: new Date().toISOString()
      };

      await fsAddAdmission(payload);
      setIsSubmitted(true);
      localStorage.setItem("ken_ias_admission_submitted", "true");
      localStorage.setItem("user_phone_submitted", formData.mobileNumber);
      pushToast("Admission Inquiry Submitted! 🎉");
    } catch (err) {
      console.error("Failed to submit admission", err);
      pushToast("Submission failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        icon={<GraduationCap size={22} />}
        title="Admissions 2026"
        subtitle="Apply for Online Live & Offline Classroom Coaching at Shakthi Academy"
      />

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Form Card */}
        <div className="lg:col-span-7">
          <div className="card p-6 sm:p-8">
            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-black/5">
              <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
                <GraduationCap size={22} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-ink leading-tight">Student Admission Application</h2>
                <p className="text-xs text-ink-muted">Fill out this quick form and our academic counsellors will contact you.</p>
              </div>
            </div>

            {isSubmitted ? (
              <div className="py-10 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-xl font-extrabold text-ink mb-2">Admission Inquiry Submitted!</h3>
                <p className="text-sm text-ink-muted max-w-md mx-auto mb-6">
                  Thank you, <span className="font-semibold text-ink">{formData.fullName}</span>. Your application for <span className="font-semibold text-brand-700">{formData.course}</span> ({formData.modeOfLearning}) in <span className="font-semibold text-ink">{formData.district}</span> district has been registered.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="btn-ghost text-xs py-2 px-4"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-3.5 top-3.5 text-ink-faint" />
                    <input
                      required
                      type="text"
                      placeholder="Enter student full name"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm transition-all"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>
                </div>

                {/* 2. Mobile & 5. District */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-3.5 text-ink-faint" />
                      <input
                        required
                        type="tel"
                        placeholder="10-digit mobile number"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm transition-all"
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
                      <MapPin size={16} className="absolute left-3.5 top-3.5 text-ink-faint pointer-events-none" />
                      <select
                        required
                        className="w-full pl-10 pr-8 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm transition-all bg-white appearance-none cursor-pointer"
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

                {/* 3. Which Course */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                    Which Course / Exam? <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <BookOpen size={16} className="absolute left-3.5 top-3.5 text-ink-faint pointer-events-none" />
                    <select
                      required
                      className="w-full pl-10 pr-8 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm transition-all bg-white appearance-none cursor-pointer"
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

                {/* 4. Online or Offline */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                    Mode of Learning (Online or Offline) <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, modeOfLearning: "Online Live Class" })}
                      className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        formData.modeOfLearning.includes("Online")
                          ? "border-brand-600 bg-brand-50 ring-2 ring-brand-200 shadow-xs"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                      }`}
                    >
                      <Monitor size={20} className={formData.modeOfLearning.includes("Online") ? "text-brand-700 mt-0.5" : "text-ink-muted mt-0.5"} />
                      <div>
                        <p className="text-sm font-extrabold text-ink leading-tight">Online Live Classes</p>
                        <p className="text-xs text-ink-muted mt-0.5">Study from anywhere with interactive live &amp; recordings.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, modeOfLearning: "Offline Classroom Coaching" })}
                      className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        formData.modeOfLearning.includes("Offline")
                          ? "border-brand-600 bg-brand-50 ring-2 ring-brand-200 shadow-xs"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                      }`}
                    >
                      <Building2 size={20} className={formData.modeOfLearning.includes("Offline") ? "text-brand-700 mt-0.5" : "text-ink-muted mt-0.5"} />
                      <div>
                        <p className="text-sm font-extrabold text-ink leading-tight">Offline Classroom</p>
                        <p className="text-xs text-ink-muted mt-0.5">Direct physical branch coaching, library &amp; mentors.</p>
                      </div>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-3 py-3.5 bg-brand-700 hover:bg-brand-800 active:scale-[0.99] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-70 text-sm"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <GraduationCap size={18} />}
                  Submit Admission Application
                </button>

                <p className="text-xs text-center text-ink-muted mt-2">
                  🔒 Your contact information is kept completely confidential.
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Right Info Card */}
        <div className="lg:col-span-5 space-y-5">
          <div className="card p-6 bg-gradient-to-br from-brand-900 to-brand-700 text-white shadow-lift">
            <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-3">
              Why Join Shakthi Academy?
            </span>
            <h3 className="text-xl font-extrabold mb-3 leading-tight">
              Tamil Nadu's Trusted Coaching for Government Jobs
            </h3>
            <p className="text-white/80 text-sm mb-5 leading-relaxed">
              Proven curriculum, experienced faculties, and comprehensive test series designed for high selection rates.
            </p>

            <div className="space-y-3.5 text-sm">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Both Online &amp; Offline Modes</strong> with dedicated mentor support.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>10,000+ Mock Questions</strong> with real exam pattern &amp; explanations.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Special Shortcut Tricks</strong> for Quant, Reasoning &amp; English.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Library &amp; Computer Lab Facility</strong> for offline classroom students.</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h4 className="font-bold text-sm text-ink mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-brand-600" />
              Need Immediate Help?
            </h4>
            <div className="space-y-2 text-xs text-ink-muted">
              <p>For urgent admission queries, contact our admissions desk directly:</p>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-ink text-sm">Admission Hotline</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <a
                      href="tel:+917530015494"
                      className="text-sm font-extrabold text-brand-700 hover:underline tracking-wide"
                    >
                      +91 7530015494
                    </a>
                    <span className="text-slate-300">|</span>
                    <a
                      href="tel:+917530015495"
                      className="text-sm font-extrabold text-brand-700 hover:underline tracking-wide"
                    >
                      7530015495
                    </a>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-0.5">Mon - Sat: 9:00 AM - 7:00 PM</p>
                </div>
                <a
                  href="tel:+917530015494"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  Call Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
