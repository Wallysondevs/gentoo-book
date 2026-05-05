# 🟣 Gentoo Linux: Do Zero ao Especialista

Livro completo e gratuito de **Gentoo Linux** em português, com mais de **160 capítulos** práticos do iniciante absoluto até temas avançados como kernel customizado, otimização com USE flags, ZFS, Wayland, GPU passthrough e mais.

## 🚀 Stack

- **React 19** + **Vite 6** + **TypeScript**
- **TailwindCSS v4**
- **Framer Motion** (animações)
- **Wouter** (roteamento por hash)
- **Lucide React** (ícones)

## 📦 Rodando localmente

```bash
pnpm install
pnpm dev
```

## 🌐 Build e deploy

```bash
pnpm build
pnpm deploy   # publica em GitHub Pages
```

## 📚 Estrutura

- `src/data/types.ts` — tipos do conteúdo
- `src/data/chapters.ts` — índice agregador das seções
- `src/data/sections/*.ts` — uma trilha por arquivo (cada um com seus capítulos)
- `src/components/` — UI (Header, Sidebar, CodeBlock, AlertBox, etc.)
- `src/pages/` — Home, Chapter, NotFound

## 📝 Licença

MIT — feito com 💜 por [@Wallysondevs](https://github.com/Wallysondevs)
