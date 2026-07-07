// Alterna claro/escuro aplicando a classe `.dark` no <html>, persistido em localStorage.
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "gentoo-tema";

function apply(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

export function initTheme() {
  const saved = localStorage.getItem(KEY);
  const dark = saved ? saved === "dark" : true; // padrão: escuro (Gentoo brilha no dark)
  apply(dark);
}

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    apply(dark);
    try {
      localStorage.setItem(KEY, dark ? "dark" : "light");
    } catch {
      /* ignora */
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="p-2 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      aria-label={dark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={dark ? "Tema claro" : "Tema escuro"}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
