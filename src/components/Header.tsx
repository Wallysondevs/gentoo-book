import { Link } from "wouter";
import { Menu, Github } from "lucide-react";
import XLogo from "@/components/XLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { useProgress } from "@/lib/course";

export default function Header({ onMenu }: { onMenu: () => void }) {
  const { pct } = useProgress();
  return (
    <header className="sticky top-0 z-30 bg-white/85 dark:bg-[#0b1020]/85 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-3 px-4 h-14">
        <button onClick={onMenu} className="lg:hidden p-2 -ml-2 text-slate-700 dark:text-slate-200" aria-label="Menu">
          <Menu size={22} />
        </button>
        <Link href="/" className="flex items-center gap-2 font-bold text-lg min-w-0">
          <XLogo size={30} className="shrink-0" />
          <span className="text-gt-purple dark:text-gt-lilac truncate">
            Gentoo: <span className="hidden sm:inline">Do Zero ao Especialista</span>
            <span className="sm:hidden">Do Zero</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <span className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mr-1">
            <span className="tabular-nums font-semibold text-gt-purple dark:text-gt-lilac">{pct}%</span>
            do curso
          </span>
          <ThemeToggle />
          <a href="https://github.com/Wallysondevs/gentoo-book" target="_blank" rel="noreferrer"
             className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-gt-purple dark:hover:text-gt-lilac p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Github size={18} />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
      {/* barra de progresso global */}
      <div className="h-0.5 bg-slate-200/70 dark:bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-gt-purple to-gt-accent transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </header>
  );
}
