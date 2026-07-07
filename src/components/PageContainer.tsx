import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Check, Circle } from "lucide-react";
import { useProgress } from "@/lib/course";

export default function PageContainer({ title, subtitle, difficulty, slug, children }: {
  title: string; subtitle?: string; difficulty?: "iniciante" | "intermediario" | "avancado"; slug?: string; children: ReactNode;
}) {
  const { isDone, toggle } = useProgress();
  const done = slug ? isDone(slug) : false;

  const colors = {
    iniciante: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    intermediario: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    avancado: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  };
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto px-4 sm:px-6 py-8"
    >
      <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {difficulty && (
            <span className={`inline-block text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded ${colors[difficulty]}`}>
              {difficulty}
            </span>
          )}
          {done && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <Check size={12} /> Concluído
            </span>
          )}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="mt-2 text-slate-600 dark:text-slate-400">{subtitle}</p>}
      </div>

      <div className="prose-gt">{children}</div>

      {slug && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => toggle(slug)}
            className={`gt-shine inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
              done
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60"
                : "bg-gt-purple text-white hover:bg-gt-purple-dark"
            }`}
          >
            {done ? <><Check size={16} /> Concluído — desmarcar</> : <><Circle size={16} /> Marcar como concluída</>}
          </button>
        </div>
      )}
    </motion.article>
  );
}
