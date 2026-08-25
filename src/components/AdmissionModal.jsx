import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle } from "lucide-react";
import { fsAddAdmission } from "../backend.js";

export function AdmissionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    emailId: "",
    modeOfLearning: ""
  });

  useEffect(() => {
    // Check if user has already interacted with the modal
    const hasClosed = localStorage.getItem("ken_ias_admission_closed");
    const hasSubmitted = localStorage.getItem("ken_ias_admission_submitted");
    
    if (!hasClosed && !hasSubmitted) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 20000); // 20 seconds
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("ken_ias_admission_closed", "true");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.mobileNumber || !formData.modeOfLearning) return;
    
    setIsLoading(true);
    try {
      await fsAddAdmission(formData);
      setIsSubmitted(true);
      localStorage.setItem("ken_ias_admission_submitted", "true");
      
      // Auto close after 3 seconds
      setTimeout(() => {
        setIsOpen(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to submit admission", err);
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
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] sm:w-full max-w-md bg-white rounded-2xl shadow-xl z-[101] overflow-hidden"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
            >
              <X size={20} />
            </button>

            {isSubmitted ? (
              <div className="p-8 text-center flex flex-col items-center justify-center min-h-[350px]">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                  <CheckCircle size={32} />
                </div>
                <h2 className="text-xl font-bold text-ink mb-2">Thank You!</h2>
                <p className="text-ink-muted">
                  Your inquiry has been received. Our counsellors will contact you shortly.
                </p>
              </div>
            ) : (
              <div className="p-8">
                <h2 className="text-2xl font-bold text-ink text-center mb-6">
                  Want to join our new batch?
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Full name <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="text"
                      placeholder="Enter your full name"
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">Mobile number <span className="text-red-500">*</span></label>
                      <input
                        required
                        type="tel"
                        placeholder="Mobile number"
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                        value={formData.mobileNumber}
                        onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">Email ID</label>
                      <input
                        type="email"
                        placeholder="Email address"
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                        value={formData.emailId}
                        onChange={(e) => setFormData({...formData, emailId: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Mode of learning <span className="text-red-500">*</span></label>
                    <select
                      required
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all bg-white"
                      value={formData.modeOfLearning}
                      onChange={(e) => setFormData({...formData, modeOfLearning: e.target.value})}
                    >
                      <option value="" disabled>Select your preferred mode</option>
                      <option value="Classroom Offline">Classroom Offline</option>
                      <option value="LIVE Online">LIVE Online</option>
                      <option value="Residential">Residential</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 bg-[#83D6B5] hover:bg-[#6ec2a1] text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                    Talk to our counsellors
                  </button>
                  
                  <p className="text-[11px] text-center text-slate-400 mt-4 leading-relaxed px-4">
                    By continuing, you agree to our Terms &amp; Conditions and Privacy Policy.
                  </p>
                </form>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
