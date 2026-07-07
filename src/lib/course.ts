// Modo curso — progresso persistente por capítulo (localStorage) com store reativo.
import { useSyncExternalStore } from "react";
import { sections, chapters, chapterMap } from "@/data/chapters";

const KEY = "gentoo-curso-progresso";

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

let done = load();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify([...done]));
  } catch {
    /* quota / modo privado — ignora */
  }
}

// snapshot estável para useSyncExternalStore
let snapshot: ReadonlySet<string> = done;

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      done = load();
      snapshot = done;
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  return snapshot;
}

export function toggleDone(slug: string) {
  done = new Set(done);
  if (done.has(slug)) done.delete(slug);
  else done.add(slug);
  snapshot = done;
  persist();
  emit();
}

export function setDone(slug: string, value: boolean) {
  if (value === done.has(slug)) return;
  toggleDone(slug);
}

export function resetProgress() {
  done = new Set();
  snapshot = done;
  persist();
  emit();
}

export function useProgress() {
  const set = useSyncExternalStore(subscribe, getSnapshot, () => snapshot);

  const total = chapters.length;
  const completed = chapters.reduce((n, c) => n + (set.has(c.slug) ? 1 : 0), 0);
  const pct = total ? Math.round((completed / total) * 100) : 0;

  const isDone = (slug: string) => set.has(slug);

  const sectionProgress = (sectionId: string) => {
    const sec = sections.find((s) => s.id === sectionId);
    if (!sec) return { done: 0, total: 0, pct: 0 };
    const t = sec.chapterSlugs.length;
    const d = sec.chapterSlugs.reduce((n, slug) => n + (set.has(slug) ? 1 : 0), 0);
    return { done: d, total: t, pct: t ? Math.round((d / t) * 100) : 0 };
  };

  // Próximo capítulo não concluído (para "Continuar de onde parou")
  const nextUp = chapters.find((c) => !set.has(c.slug)) ?? null;
  const started = completed > 0;

  return {
    set,
    total,
    completed,
    pct,
    isDone,
    toggle: toggleDone,
    reset: resetProgress,
    sectionProgress,
    nextUp,
    started,
    firstSlug: chapters[0]?.slug ?? "",
  };
}

export { chapters, sections, chapterMap };
