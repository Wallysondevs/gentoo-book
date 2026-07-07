// Demo ao vivo: uma sessão Gentoo "real" digitando sozinha, em loop.
import { useEffect, useRef, useState } from "react";

type Line =
  | { kind: "cmd"; text: string }
  | { kind: "out"; text: string; cls?: string };

const SCRIPT: Line[] = [
  { kind: "cmd", text: "emerge --ask --verbose app-editors/neovim" },
  { kind: "out", text: "These are the packages that would be merged, in order:", cls: "text-slate-400" },
  { kind: "out", text: "", },
  { kind: "out", text: "[ebuild  N     ] app-editors/neovim-0.11.3  USE=\"nvimpager -test\"", cls: "text-emerald-300" },
  { kind: "out", text: "[ebuild  N     ] dev-libs/libvterm-0.3.3", cls: "text-emerald-300" },
  { kind: "out", text: "", },
  { kind: "out", text: ">>> Emerging (1 of 2) dev-libs/libvterm-0.3.3", cls: "text-gt-lilac" },
  { kind: "out", text: " * libvterm-0.3.3.tar.gz  BLAKE2B SHA512 size ;-) ...  [ ok ]", cls: "text-slate-300" },
  { kind: "out", text: ">>> Compiling source in /var/tmp/portage/.../work ...", cls: "text-slate-400" },
  { kind: "out", text: "  CC  vterm.lo   CC  screen.lo   CC  state.lo", cls: "text-slate-300" },
  { kind: "out", text: ">>> Installing (1 of 2) dev-libs/libvterm-0.3.3  [ ok ]", cls: "text-emerald-300" },
  { kind: "out", text: ">>> Emerging (2 of 2) app-editors/neovim-0.11.3", cls: "text-gt-lilac" },
  { kind: "out", text: "  [100%] Built target nvim", cls: "text-slate-300" },
  { kind: "out", text: ">>> Installing (2 of 2) app-editors/neovim-0.11.3  [ ok ]", cls: "text-emerald-300" },
  { kind: "out", text: "", },
  { kind: "cmd", text: "emerge --ask --update --deep --newuse @world" },
  { kind: "out", text: " * IMPORTANT: config file '/etc/portage/make.conf' — tudo sob seu controle.", cls: "text-gt-accent" },
];

export default function Terminal() {
  const [rendered, setRendered] = useState<Line[]>([]);
  const [typing, setTyping] = useState("");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    let alive = true;
    const push = (fn: () => void, d: number) =>
      timers.current.push(window.setTimeout(() => alive && fn(), d));

    const run = async () => {
      let delay = 500;
      SCRIPT.forEach((line) => {
        if (line.kind === "cmd") {
          // digita caractere a caractere
          for (let i = 1; i <= line.text.length; i++) {
            push(() => setTyping(line.text.slice(0, i)), delay);
            delay += 28;
          }
          push(() => {
            setRendered((r) => [...r, line]);
            setTyping("");
          }, delay);
          delay += 320;
        } else {
          push(() => setRendered((r) => [...r, line]), delay);
          delay += line.text ? 220 : 90;
        }
      });
      // reinicia o loop
      push(() => {
        setRendered([]);
        setTyping("");
        run();
      }, delay + 2600);
    };

    run();
    return () => {
      alive = false;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-[#0b1020]/95 backdrop-blur">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border-b border-white/10">
        <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
        <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
        <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
        <span className="ml-3 text-xs text-slate-400 font-mono">root@gentoo ~ # emerge</span>
      </div>
      <div className="p-4 sm:p-5 font-mono text-[12.5px] leading-relaxed min-h-[340px] max-h-[340px] overflow-hidden">
        {rendered.map((l, i) =>
          l.kind === "cmd" ? (
            <div key={i} className="text-slate-100">
              <span className="text-gt-accent">root@gentoo</span>
              <span className="text-slate-500"> ~ # </span>
              {l.text}
            </div>
          ) : (
            <div key={i} className={l.cls ?? "text-slate-300"}>
              {l.text || " "}
            </div>
          )
        )}
        {typing !== "" && (
          <div className="text-slate-100">
            <span className="text-gt-accent">root@gentoo</span>
            <span className="text-slate-500"> ~ # </span>
            {typing}
            <span className="inline-block w-2 h-4 -mb-0.5 bg-gt-accent animate-pulse ml-0.5" />
          </div>
        )}
      </div>
    </div>
  );
}
