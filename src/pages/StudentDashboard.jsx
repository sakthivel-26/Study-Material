import HeroBanner from "../components/HeroBanner.jsx";
import CourseCatalog from "../components/CourseCatalog.jsx";
import { RightSidebar } from "../components/RightSidebar.jsx";
import { useApp } from "../store.jsx";
import { Clock, Play, HelpCircle, TrendingUp, Zap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail } from "lucide-react";

function FeaturedFreeMocks() {
  const { mockTests } = useApp();
  const navigate = useNavigate();
  // Get top 3 free tests
  const freeTests = mockTests.filter(t => t.isFree === true).slice(0, 3);

  if (freeTests.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-extrabold text-ink flex items-center gap-2">
            <Zap size={20} className="text-amber-500" /> Free Mock Tests
          </h2>
          <p className="text-sm text-ink-muted mt-0.5">Start practicing immediately for free.</p>
        </div>
        <button onClick={() => navigate("/free-mocks")} className="btn-ghost text-sm text-brand-700 font-semibold px-3 py-1.5">
          View All <ArrowRight size={16} />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {freeTests.map((t, i) => (
          <motion.div 
            key={t.id} 
            initial={{ opacity: 0, y: 14 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.06 }} 
            className="card card-hover p-4 flex flex-col cursor-pointer" 
            style={{ borderTop: `3px solid ${t.color}` }}
            onClick={() => navigate("/free-mocks")}
          >
            <div className="flex justify-between gap-2 mb-1">
              <span className="chip self-start" style={{ background: `${t.color}1A`, color: t.color }}>
                {t.category}
              </span>
              <span className="chip bg-amber-50 text-amber-700">
                <Zap size={12} className="text-amber-500" /> Free
              </span>
            </div>
            
            <h3 className="font-bold text-ink text-sm mb-2">{t.title}</h3>
            <div className="flex items-center gap-3 text-[11px] text-ink-muted mb-4">
              <span className="flex items-center gap-1"><HelpCircle size={12} /> {t.questions} Qs</span>
              <span className="flex items-center gap-1"><Clock size={12} /> {t.time}</span>
            </div>
            <button className="mt-auto text-xs py-2 btn-primary bg-amber-500 hover:bg-amber-600 border-none text-white w-full">
              <Play size={14} /> Start Free Test
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default function StudentDashboard() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
      <div className="min-w-0 space-y-8">
        <HeroBanner />
        <FeaturedFreeMocks />
        <CourseCatalog compact />
        <div className="mt-12 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <a 
            href="https://www.google.com/maps/search/?api=1&query=4c,+opposite+govt+girls+hr+sec+school,+PTV+Colony,+Thiruvalluvar+Nagar,+Krishnagiri,+Tamil+Nadu+635001" 
            target="_blank" 
            rel="noreferrer"
            className="block p-5 rounded-2xl bg-white border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-4 text-ink-muted group-hover:text-brand-700">
              <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-brand-50 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin size={20} />
              </div>
              <div>
                <h4 className="font-bold text-ink group-hover:text-brand-900 mb-1">Visit Our Academy</h4>
                <p className="text-sm leading-relaxed">4c, opposite govt girls hr sec school, PTV Colony, Thiruvalluvar Nagar, Krishnagiri, Tamil Nadu 635001</p>
              </div>
            </div>
          </a>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-center">
            <div className="flex items-center gap-4 text-ink-muted mb-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <Phone size={20} />
              </div>
              <div>
                <h4 className="font-bold text-ink mb-0.5">Contact Us</h4>
                <p className="text-sm">Call or email us for inquiries</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 ml-[3.5rem]">
              <div className="flex items-center gap-3">
                <a href="tel:7530015494" className="text-sm font-semibold text-brand-700 hover:underline">
                  7530015494
                </a>
                <span className="text-slate-300">|</span>
                <a href="tel:7530015495" className="text-sm font-semibold text-brand-700 hover:underline">
                  7530015495
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail size={14} className="text-ink-muted" />
                <a href="mailto:kenacademy7@gmail.com" className="font-medium text-ink hover:text-brand-700 hover:underline">
                  kenacademy7@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <aside className="hidden xl:block"><div className="sticky top-[88px]"><RightSidebar /></div></aside>
    </div>
  );
}
