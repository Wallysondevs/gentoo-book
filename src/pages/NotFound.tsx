import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-3xl font-bold text-gt-purple dark:text-gt-lilac mb-2">Capítulo não encontrado</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        O endereço pode estar errado ou o capítulo ainda não foi escrito.
      </p>
      <Link href="/" className="inline-block bg-gt-purple hover:bg-gt-purple-dark text-white px-5 py-2 rounded-lg font-semibold">
        Voltar ao início
      </Link>
    </div>
  );
}
