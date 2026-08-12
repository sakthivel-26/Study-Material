import { motion } from "framer-motion";
import { ArrowRight, FileText } from "lucide-react";
import { CATEGORIES, CATEGORY_GROUPS } from "../data.js";
import { SectionHeader } from "./ui.jsx";

export default function CategoryGrid() {
  return (
    <section>
      <SectionHeader
        title="Exam Categories"
        subtitle="Choose your exam and prepare with targeted study material"
        icon={<FileText size={17} />}
      />
      <div className="space-y-7">
        {CATEGORY_GROUPS.map((group, gi) => {
          const cats = CATEGORIES.filter((c) => c.group === group);
          if (cats.length === 0) return null;
          return (
            <div key={group}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
                {group}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {cats.map((c, i) => (
                  <motion.button
                    key={c.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (gi * 0.1) + (i * 0.05), duration: 0.4 }}
                    whileHover={{ y: -4 }}
                    className="card card-hover p-4 text-left group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${c.gradient} text-white text-xl flex items-center justify-center shadow-soft`}
                      >
                        <span className="drop-shadow-sm">{c.icon}</span>
                      </div>
                      <ArrowRight
                        size={16}
                        className="text-ink-faint group-hover:text-brand-600 group-hover:translate-x-1 transition-all"
                      />
                    </div>
                    <p className="font-bold text-sm text-ink leading-tight">{c.name}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{c.materials} materials</p>
                  </motion.button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
