import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowRight, CreditCard, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

function PaymentStateLayout({ icon: Icon, title, message, primaryAction, isSuccess }) {
  return (
    <div className="min-h-screen bg-appbg flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="card w-full max-w-md p-8 shadow-soft flex flex-col items-center"
      >
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isSuccess ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
          <Icon size={40} />
        </div>
        <h1 className="text-2xl font-extrabold text-ink tracking-tight mb-2">{title}</h1>
        <p className="text-ink-soft mb-8 leading-relaxed">
          {message}
        </p>
        
        <button
          onClick={primaryAction.onClick}
          className="btn-primary w-full py-3 justify-center"
        >
          {primaryAction.label}
          {primaryAction.icon && <primaryAction.icon size={16} className="ml-2" />}
        </button>
      </motion.div>
    </div>
  );
}

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  return (
    <PaymentStateLayout
      icon={CheckCircle2}
      title="Payment Successful!"
      message="Thank you for your purchase. Your account has been upgraded and your new mock tests are now available in your dashboard."
      isSuccess={true}
      primaryAction={{
        label: "Start Practicing",
        icon: ArrowRight,
        onClick: () => navigate("/mock-tests", { replace: true })
      }}
    />
  );
}

export function PaymentFailedPage() {
  const navigate = useNavigate();
  return (
    <PaymentStateLayout
      icon={XCircle}
      title="Payment Failed"
      message="We couldn't process your payment. No charges were made. Please try again or use a different payment method."
      isSuccess={false}
      primaryAction={{
        label: "Try Again",
        onClick: () => navigate("/pricing", { replace: true })
      }}
    />
  );
}

export function PricingPage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-ink tracking-tight">Simple, transparent pricing</h1>
        <p className="text-ink-muted mt-2">Unlock all premium mock tests and secure your government job.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <div className="card p-6 shadow-sm border border-black/5 flex flex-col">
          <h3 className="text-xl font-bold text-ink">Basic Plan</h3>
          <p className="text-sm text-ink-muted mt-1">Perfect for getting started.</p>
          <div className="my-6">
            <span className="text-4xl font-extrabold text-ink">Free</span>
          </div>
          <ul className="space-y-3 text-sm text-ink-soft flex-1 mb-8">
            <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-emerald-500" /> Access to 5 free mock tests</li>
            <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-emerald-500" /> Daily practice quizzes</li>
            <li className="flex gap-2 items-center text-black/30"><XCircle size={16} /> No premium study materials</li>
          </ul>
          <button onClick={() => navigate("/free-mocks")} className="btn-outline w-full py-2.5 justify-center">Start Free</button>
        </div>

        <div className="card p-6 shadow-soft border-2 border-brand-500 relative flex flex-col bg-brand-50/30">
          <div className="absolute top-0 right-6 -translate-y-1/2 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Sparkles size={12} /> MOST POPULAR
          </div>
          <h3 className="text-xl font-bold text-ink">Premium Access</h3>
          <p className="text-sm text-ink-muted mt-1">Everything you need to crack the exam.</p>
          <div className="my-6">
            <span className="text-4xl font-extrabold text-ink">₹999</span>
            <span className="text-ink-muted text-sm ml-1">/ year</span>
          </div>
          <ul className="space-y-3 text-sm text-ink-soft flex-1 mb-8">
            <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-brand-500" /> All 500+ premium mock tests</li>
            <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-brand-500" /> Detailed performance analytics</li>
            <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-brand-500" /> Video lectures & PDF materials</li>
          </ul>
          {/* Note: In a real app, this button would trigger PaymentCheckout.jsx modal. For this UX upgrade, we just route to dashboard or trigger mock payment. */}
          <button onClick={() => navigate("/")} className="btn-primary w-full py-2.5 justify-center">
            <CreditCard size={16} className="mr-2" /> Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}
