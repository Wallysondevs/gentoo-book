import { Link } from "wouter";
import { sections, chapters, chapterMap } from "@/data/chapters";
import { useProgress } from "@/lib/course";
import Terminal from "@/components/Terminal";
import XLogo from "@/components/XLogo";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { ArrowRight, BookOpen, PlayCircle, Check, Sparkles, Cpu, Package, Boxes } from "lucide-react";

export default function Home() {
  const { pct, completed, total, nextUp, started, firstSlug, sectionProgress } = useProgress();
  const continueSlug = nextUp?.slug ?? firstSlug;

  return (
    <div>
      {/* ---------- HERO ---------- */}
      <section className="gt-hero">
        <div className="gt-orb gt-orb-a" />
        <div className="gt-orb gt-orb-b" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-10 grid lg:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gt-purple/10 dark:bg-gt-lilac/10 text-gt-purple dark:text-gt-lilac text-xs font-semibold mb-5">
              <Sparkles size={13} /> {total} capítulos · do stage3 ao especialista
            </div>
            <div className="flex items-center gap-3 mb-4">
              <XLogo size={52} />
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-gt-purple dark:text-gt-lilac leading-none">
                Gentoo Linux
              </h1>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl">
              O livro <strong>hands-on</strong> em português. Compile o sistema do zero, domine o{" "}
              <code className="text-gt-purple dark:text-gt-lilac">Portage</code>, esculpa USE flags,
              kernel sob medida, ZFS e Wayland — entendendo cada linha.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`/c/${continueSlug}`}
                className="gt-shine inline-flex items-center gap-2 bg-gt-purple hover:bg-gt-purple-dark text-white px-6 py-3 rounded-lg font-semibold shadow-lg shadow-gt-purple/20 transition-colors"
              >
                {started ? <><PlayCircle size={18} /> Continuar de onde parou</> : <><BookOpen size={18} /> Começar o curso</>}
              </Link>
              <Link
                href="/c/pre-requisitos"
                className="inline-flex items-center gap-2 bg-white/70 dark:bg-white/5 backdrop-blur border border-slate-200 dark:border-slate-700 hover:border-gt-purple text-slate-800 dark:text-slate-100 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Instalar Gentoo <ArrowRight size={18} />
              </Link>
            </div>

            {/* mini-stats / progresso */}
            <div className="mt-8 flex flex-wrap items-center gap-5 text-sm">
              <Stat icon={<Package size={16} />} value={`${sections.length}`} label="trilhas" />
              <Stat icon={<BookOpen size={16} />} value={`${total}`} label="capítulos" />
              <Stat icon={<Cpu size={16} />} value="100%" label="prático" />
              {started && (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <Check size={16} /> {completed} concluídos ({pct}%)
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <Terminal />
          </motion.div>
        </div>

        {/* barra de progresso do curso (se começou) */}
        {started && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span>Progresso do curso</span>
              <span className="tabular-nums font-semibold text-gt-purple dark:text-gt-lilac">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden gt-bar">
              <span className="block h-full rounded-full bg-gradient-to-r from-gt-purple via-gt-purple-light to-gt-accent" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </section>

      {/* ---------- TRILHAS ---------- */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-center gap-2 mb-2">
          <Boxes className="text-gt-purple dark:text-gt-lilac" size={22} />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {sections.length} trilhas · {total} capítulos
          </h2>
        </div>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Da mídia de instalação ao sistema otimizado — siga na ordem ou pule pro que precisa.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((s, i) => {
            const Icon = (Icons as any)[s.icon] || Icons.BookOpen;
            const first = s.chapterSlugs[0];
            const firstCh = first ? chapterMap[first] : null;
            const sp = sectionProgress(s.id);
            const secDone = sp.total > 0 && sp.done === sp.total;
            return (
              <div key={s.id}>
                <Link
                  href={firstCh ? `/c/${first}` : "/"}
                  className="block h-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-gt-purple hover:shadow-lg hover:-translate-y-0.5 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${secDone ? "bg-emerald-500/15 text-emerald-500" : "bg-gt-purple/10 text-gt-purple dark:text-gt-lilac"}`}>
                      {secDone ? <Check size={22} /> : <Icon size={22} />}
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-xs uppercase tracking-wide text-slate-400">{sp.total} cap.</div>
                      {sp.done > 0 && (
                        <div className="text-[11px] font-semibold text-gt-purple dark:text-gt-lilac tabular-nums">{sp.done}/{sp.total}</div>
                      )}
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-gt-purple dark:group-hover:text-gt-lilac mb-1">
                    <span className="text-gt-purple/40 dark:text-gt-lilac/40 mr-1">{String(i + 1).padStart(2, "0")}</span>
                    {s.label}
                  </h3>
                  {firstCh && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                      Começa com: <span className="text-slate-700 dark:text-slate-300">{firstCh.title}</span>
                    </p>
                  )}
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <span className="block h-full rounded-full bg-gradient-to-r from-gt-purple to-gt-accent transition-all" style={{ width: `${sp.pct}%` }} />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <XLogo size={22} />
            <span>Gentoo: Do Zero ao Especialista</span>
          </div>
          <p>
            Feito por{" "}
            <a className="text-gt-purple dark:text-gt-lilac font-semibold" href="https://github.com/Wallysondevs" target="_blank" rel="noreferrer">@Wallysondevs</a>
            {" · "}
            <a className="text-gt-purple dark:text-gt-lilac font-semibold" href="https://github.com/Wallysondevs/gentoo-book" target="_blank" rel="noreferrer">Código aberto no GitHub</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
      <span className="text-gt-purple dark:text-gt-lilac">{icon}</span>
      <span className="font-bold text-slate-900 dark:text-white tabular-nums">{value}</span>
      <span className="text-slate-400">{label}</span>
    </div>
  );
}
