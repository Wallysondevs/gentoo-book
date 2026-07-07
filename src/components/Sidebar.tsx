import { Link, useLocation } from "wouter";
import { useMemo, useState } from "react";
import { sections, chapterMap } from "@/data/chapters";
import { useProgress } from "@/lib/course";
import * as Icons from "lucide-react";
import { ChevronDown, Search, X, Check } from "lucide-react";

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [location] = useLocation();
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const { isDone, sectionProgress, pct, completed, total } = useProgress();

  const filtered = useMemo(() => {
    if (!query.trim()) return sections;
    const q = query.toLowerCase();
    return sections
      .map((s) => ({
        ...s,
        chapterSlugs: s.chapterSlugs.filter((slug) => {
          const c = chapterMap[slug];
          return c && (c.title.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q));
        }),
      }))
      .filter((s) => s.chapterSlugs.length > 0);
  }, [query]);

  return (
    <>
      {open && <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={onClose} />}
      <aside
        className={`fixed lg:sticky lg:top-14 top-0 left-0 z-50 lg:z-10 h-screen lg:h-[calc(100vh-3.5rem)] w-72 bg-white dark:bg-[#0b1020] border-r border-slate-200 dark:border-slate-800 overflow-y-auto transition-transform ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 lg:hidden">
          <span className="font-bold text-gt-purple dark:text-gt-lilac">Menu</span>
          <button onClick={onClose} className="ml-auto p-1"><X size={18} /></button>
        </div>

        <div className="p-3 sticky top-0 bg-white dark:bg-[#0b1020] z-10 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar capítulo…"
              className="w-full pl-8 pr-2 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 rounded border border-transparent focus:border-gt-purple focus:outline-none"
            />
          </div>
          {/* progresso do curso */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              <span>Seu progresso</span>
              <span className="tabular-nums font-semibold text-gt-purple dark:text-gt-lilac">{completed}/{total}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden gt-bar">
              <span className="block h-full rounded-full bg-gradient-to-r from-gt-purple to-gt-accent" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        <nav className="px-2 pb-8">
          {filtered.map((s) => {
            const Icon = (Icons as any)[s.icon] || Icons.BookOpen;
            const isCollapsed = collapsed[s.id];
            const sp = sectionProgress(s.id);
            const secDone = sp.total > 0 && sp.done === sp.total;
            return (
              <div key={s.id} className="mb-1">
                <button
                  onClick={() => setCollapsed((c) => ({ ...c, [s.id]: !c[s.id] }))}
                  className="w-full flex items-center gap-2 px-2 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                >
                  <span className={`shrink-0 ${secDone ? "text-emerald-500" : "text-gt-purple dark:text-gt-lilac"}`}>
                    {secDone ? <Check size={16} /> : <Icon size={16} />}
                  </span>
                  <span className="flex-1 text-left">{s.label}</span>
                  <span className="text-[10px] tabular-nums text-slate-400">{sp.done}/{sp.total}</span>
                  <ChevronDown size={14} className={`transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                </button>
                {!isCollapsed && (
                  <ul className="ml-4 border-l border-slate-200 dark:border-slate-800">
                    {s.chapterSlugs.map((slug) => {
                      const c = chapterMap[slug];
                      if (!c) return null;
                      const path = `/c/${slug}`;
                      const active = location === path;
                      const done = isDone(slug);
                      return (
                        <li key={slug}>
                          <Link
                            href={path}
                            onClick={onClose}
                            className={`flex items-center gap-2 pl-3 pr-2 py-1.5 text-sm border-l-2 -ml-px transition-colors ${
                              active
                                ? "border-gt-accent text-gt-purple dark:text-gt-lilac font-semibold bg-gt-accent/10"
                                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-gt-purple dark:hover:text-gt-lilac hover:border-gt-purple/30"
                            }`}
                          >
                            <span className={`shrink-0 flex items-center justify-center w-4 h-4 rounded-full text-[10px] ${
                              done ? "bg-emerald-500 text-white" : "border border-slate-300 dark:border-slate-600"
                            }`}>
                              {done && <Check size={11} />}
                            </span>
                            <span className={`flex-1 ${done && !active ? "text-slate-400 dark:text-slate-500" : ""}`}>{c.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
