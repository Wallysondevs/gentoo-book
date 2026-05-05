import { useRoute, Link } from "wouter";
import { chapterMap, chapters, chapterIndex, sections } from "@/data/chapters";
import PageContainer from "@/components/PageContainer";
import CodeBlock from "@/components/CodeBlock";
import AlertBox from "@/components/AlertBox";
import NotFound from "./NotFound";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect } from "react";

export default function ChapterPage() {
  const [, params] = useRoute("/c/:slug");
  const slug = params?.slug ?? "";
  const ch = chapterMap[slug];

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [slug]);

  if (!ch) return <NotFound />;

  const idx = chapterIndex(slug);
  const prev = idx > 0 ? chapters[idx - 1] : null;
  const next = idx < chapters.length - 1 ? chapters[idx + 1] : null;
  const sec = sections.find((s) => s.id === ch.section);

  return (
    <PageContainer title={ch.title} subtitle={ch.subtitle} difficulty={ch.difficulty}>
      {sec && (
        <p className="text-xs uppercase tracking-wide text-slate-500 mb-4">
          {sec.label} · Capítulo {idx + 1} de {chapters.length}
        </p>
      )}

      {ch.intro.split("\n\n").map((para, i) => <p key={i}>{para}</p>)}

      {ch.codes.map((c, i) => (
        <CodeBlock key={i} code={c.code} language={c.lang} />
      ))}

      {ch.points.length > 0 && (
        <>
          <h2>Pontos-chave</h2>
          <ul>
            {ch.points.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </>
      )}

      {ch.alerts.map((a, i) => (
        <AlertBox key={i} type={a.type}>{a.content}</AlertBox>
      ))}

      <nav className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
        {prev ? (
          <Link href={`/c/${prev.slug}`} className="flex-1 group p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-gt-purple transition-colors">
            <div className="flex items-center gap-1 text-xs text-slate-500"><ArrowLeft size={12} /> Anterior</div>
            <div className="text-sm font-semibold text-gt-purple dark:text-gt-lilac truncate">{prev.title}</div>
          </Link>
        ) : <div className="flex-1" />}
        {next ? (
          <Link href={`/c/${next.slug}`} className="flex-1 group p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-gt-purple transition-colors text-right">
            <div className="flex items-center justify-end gap-1 text-xs text-slate-500">Próximo <ArrowRight size={12} /></div>
            <div className="text-sm font-semibold text-gt-purple dark:text-gt-lilac truncate">{next.title}</div>
          </Link>
        ) : <div className="flex-1" />}
      </nav>
    </PageContainer>
  );
}
