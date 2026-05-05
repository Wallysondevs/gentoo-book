import type { Chapter } from "../types";

export const chapters: Chapter[] = [
  {
    slug: "bem-vindo",
    section: "boas-vindas",
    title: "Bem-vindo ao Gentoo",
    difficulty: "iniciante",
    subtitle: "O que esperar deste livro, como tirar proveito dele e o que o Gentoo realmente é (e não é).",
    intro: `Se você chegou até este livro provavelmente já ouviu falar do Gentoo como aquela distribuição 'difícil', em que tudo se compila do zero e o sistema demora dias para ficar pronto. Vamos derrubar esse mito logo no primeiro capítulo: Gentoo não é difícil, é diferente. Em vez de esconder o sistema operacional debaixo de uma tampa fechada, ele te entrega cada parafuso na mão e explica para que serve. Para quem quer aprender Linux de verdade, isso é um presente, não um castigo.

A proposta do livro é te levar do zero (você nunca abriu uma ISO do Gentoo) até o ponto em que você instala, mantém, otimiza e até cria seus próprios pacotes ('ebuilds'). Cada capítulo combina explicação conceitual com comandos prontos para copiar e adaptar. Há também armadilhas comuns destacadas, porque a maioria do tempo perdido no Gentoo vem de erros pequenos e repetidos que ninguém te avisou.

Reserve um segundo computador (ou um celular) para consultar este livro enquanto instala. Anote os comandos que você roda e as mensagens de erro que aparecem; em duas semanas você terá um diário de bordo melhor do que qualquer cola pronta. E não tenha pressa: a primeira instalação leva um fim de semana, mas a segunda leva uma tarde, e a terceira leva uma hora.`,
    codes: [
      { lang: "bash", code: `# Comando que você vai digitar centenas de vezes neste livro.
# emerge é o gerenciador de pacotes do Gentoo (equivalente ao apt/pacman).
sudo emerge --ask app-editors/vim
# A flag --ask (-a) mostra o plano e pede confirmação. Sempre use ela.` },
      { lang: "bash", code: `# Como descobrir a versão do Gentoo (na verdade, do perfil + Portage).
emerge --info | head -n 5
# Saída típica:
# Portage 3.0.65 (python 3.12.4-final-0, default/linux/amd64/23.0/desktop, gcc-13, glibc-2.40, 6.10.5-gentoo x86_64)` },
      { lang: "bash", code: `# Atualizar o sistema inteiro — a 'oração' do gentooísta.
# Memorize esta combinação de flags, é seu pão com manteiga.
sudo emerge --ask --update --deep --newuse @world
# Forma curta equivalente: sudo emerge -auDN @world` },
      { lang: "text", code: `# Saída típica do Portage antes de confirmar uma instalação:
These are the packages that would be merged, in order:

Calculating dependencies... done!
[ebuild  N     ] app-editors/vim-9.1.0  USE="acl nls -X -gtk -python" 14 MiB

Total: 1 package (1 new), Size of downloads: 14 MiB

Would you like to merge these packages? [Yes/No]` },
      { lang: "bash", code: `# Onde anotar suas dúvidas de instalação para revisitar depois.
mkdir -p ~/diario-gentoo
echo "$(date) - primeiro emerge rodado com sucesso" >> ~/diario-gentoo/log.txt` },
    ],
    points: [
      "Gentoo não é difícil, é explícito: tudo aparece na sua frente.",
      "Cada capítulo combina conceito, comando real e armadilhas conhecidas.",
      "Reserve um segundo dispositivo para consultar o livro enquanto instala.",
      "A primeira instalação demora; a segunda voa. É curva de aprendizado, não burocracia.",
      "emerge é o comando central — equivalente a apt/pacman/dnf.",
      "Sempre use --ask para revisar antes de confirmar qualquer mudança.",
      "Iniciante comum: pular capítulos e travar depois por falta de base.",
      "Iniciante comum: copiar comandos sem ler a saída do Portage.",
    ],
    alerts: [
      { type: "tip", content: "Crie um diário de comandos (um simples ~/diario-gentoo/log.txt). Em duas semanas vira sua melhor cola pessoal, melhor que qualquer wiki." },
      { type: "info", content: "Todos os exemplos do livro assumem Gentoo 2024+ com Portage moderno (>= 3.0), suportando OpenRC e systemd em paralelo, e tanto Xorg quanto Wayland." },
      { type: "warning", content: "Não copie e cole comandos como 'emerge --unmerge' sem ler o que vai sair. Em Gentoo, você é root no sentido mais literal: o sistema obedece sem perguntar duas vezes." },
      { type: "success", content: "O Wiki oficial (wiki.gentoo.org) é uma das melhores documentações de qualquer distribuição Linux. Vamos te ensinar a ler e usar ela ao longo do livro." },
    ],
  },
  {
    slug: "por-que-gentoo",
    section: "boas-vindas",
    title: "Por que escolher Gentoo?",
    difficulty: "iniciante",
    subtitle: "Vantagens reais (USE flags, source-based, rolling release) e quando outra distro seria melhor.",
    intro: `Gentoo é uma escolha consciente. Ninguém usa Gentoo por acidente: você instala porque quer algo que outras distribuições não entregam. A pergunta certa não é 'Gentoo é melhor?' e sim 'Gentoo resolve o que estou tentando resolver?'. Este capítulo te ajuda a responder isso de cabeça fria, sem fanatismo de fórum.

A grande diferença está em quatro pilares: USE flags, que deixam você ligar e desligar funcionalidades de cada pacote ('quero ffmpeg sem suporte a NVENC, mas com VAAPI'); modelo source-based, que compila tudo otimizado para o seu processador; rolling release, em que não existe 'versão 24.04' — o sistema atualiza continuamente; e a possibilidade de usar OpenRC, um init system minimalista, no lugar do systemd. Junte isso e você tem uma distro em que praticamente cada decisão técnica está sob seu controle.

Em troca, você paga em tempo de compilação e em paciência para ler documentação. Se o seu objetivo é apenas 'um Linux que funcione', Ubuntu, Fedora ou Mint resolvem. Se você quer um sistema enxuto rolando rápido, Arch faz isso com menos atrito. Gentoo brilha quando você precisa de controle granular: workstation otimizada, servidor hardened, embedded customizado, laboratório de aprendizado profundo de Linux. Os próximos capítulos vão dar contexto histórico e filosófico para você decidir com base em fatos.`,
    codes: [
      { lang: "bash", code: `# Exemplo do poder das USE flags: instalar mpv só com o que você usa.
# USE flags ativam ou desativam funcionalidades de um pacote.
sudo emerge --ask --pretend media-video/mpv
# A saída mostra USE="..." — cada token é uma feature ligada (+) ou desligada (-).` },
      { lang: "ini", code: `# Trecho típico de /etc/portage/make.conf — o coração da customização.
COMMON_FLAGS="-march=native -O2 -pipe"
MAKEOPTS="-j\\$(nproc)"
USE="X wayland pipewire vaapi vulkan -gnome -kde -systemd"
ACCEPT_LICENSE="*"
VIDEO_CARDS="amdgpu radeonsi"` },
      { lang: "bash", code: `# Rolling release: não existe 'upgrade de versão'. Você só atualiza.
# Gentoo de 2015 vira Gentoo de 2025 só rodando isto regularmente:
sudo emerge --sync
sudo emerge -auDN @world` },
      { lang: "bash", code: `# Comparação rápida com outras distribuições.
# Arch:    pacman -S vim
# Debian:  apt install vim
# Fedora:  dnf install vim
# Gentoo:  emerge --ask app-editors/vim   (mas compila do source)` },
      { lang: "bash", code: `# Trocar de init system: OpenRC <-> systemd.
# Liste perfis disponíveis. Os com 'systemd' usam systemd, os outros OpenRC.
eselect profile list | head -n 20
# Mudar de perfil é um comando; migrar de init é mais trabalho, mas suportado.` },
    ],
    points: [
      "USE flags: você decide quais features de cada pacote entram no binário.",
      "Source-based: o código é compilado para a sua CPU, não para o pior caso.",
      "Rolling release: zero 'upgrades de versão'. O sistema evolui continuamente.",
      "OpenRC opcional: alternativa enxuta ao systemd, ainda que ambos sejam suportados.",
      "Comunidade técnica e wiki excelentes: documentação melhor que muita distro paga.",
      "Gentoo brilha em: workstation otimizada, servidor hardened, embedded, aprendizado.",
      "Arch é melhor se você quer rolling release sem compilar; Debian se quer estabilidade fria.",
      "Armadilha comum: instalar Gentoo só por status; sem propósito, vira frustração.",
    ],
    alerts: [
      { type: "tip", content: "Antes de instalar, escreva em uma linha por que VOCÊ quer Gentoo. Se a resposta for 'não sei', talvez Arch ou Fedora resolvam por enquanto e você volta aqui depois." },
      { type: "info", content: "Desde 2024 o projeto mantém um 'binhost' oficial com pacotes pré-compilados para amd64. Você pode misturar binários e source builds, ganhando tempo sem perder o ecossistema Portage." },
      { type: "warning", content: "Compilar Chromium ou LibreOffice em um notebook fraco pode levar horas. Tenha plano B: usar binhost, ou um host distcc, ou simplesmente ir dormir." },
      { type: "success", content: "Quem aprende Gentoo a fundo aprende Linux a fundo. Conceitos como init, libc, perfis, slots e libs compartilhadas deixam de ser misteriosos para sempre." },
    ],
  },
  {
    slug: "historia-gentoo",
    section: "boas-vindas",
    title: "A história do Gentoo",
    difficulty: "iniciante",
    subtitle: "De Daniel Robbins ao pinguim gentoo: 25+ anos de uma distribuição diferente.",
    intro: `Toda distribuição carrega as marcas de seus criadores, e o Gentoo não é exceção. Para entender por que ele é do jeito que é — meta-distro, source-based, com Portage no centro — vale conhecer um pouco da trajetória de Daniel Robbins e da comunidade que cresceu ao redor dele a partir do fim dos anos 1990. Não é história enciclopédica, é contexto que te ajuda a interpretar decisões e debates atuais.

Robbins começou com um projeto chamado Enoch Linux em 1999, com o objetivo de criar uma distribuição altamente otimizada para o hardware do usuário. Ao longo do desenvolvimento ele se inspirou no sistema de ports do FreeBSD — em vez de pacotes binários fechados, receitas em texto que descrevem como construir o software. Em 2002 nasceu oficialmente o Gentoo Linux 1.0, batizado em homenagem ao pinguim gentoo (Pygoscelis papua), conhecido por ser uma das espécies mais rápidas debaixo d'água. Rapidez foi o tema desde o início.

Em 2004, Robbins transferiu a marca e o controle para a Gentoo Foundation, uma organização sem fins lucrativos sediada nos EUA, que mantém o projeto até hoje. Disso saíram diversos descendentes: Funtoo (criado pelo próprio Robbins), Calculate Linux (foco em empresas), Sabayon (com binários e instalador gráfico), Pentoo (forense/segurança) e até o ChromeOS, que usa Portage por baixo do capô. A genética do Gentoo está em mais lugares do que parece.`,
    codes: [
      { lang: "bash", code: `# Linha do tempo simplificada (em formato de comentário).
# 1999 - Enoch Linux, projeto inicial de Daniel Robbins.
# 2002 - Gentoo Linux 1.0 lançado, com o gerenciador Portage maduro.
# 2004 - Criação da Gentoo Foundation, transferência de controle.
# 2008 - Distribuição da era moderna do Portage e perfis.
# 2024 - Binhost oficial e suporte a binpkgs em larga escala.` },
      { lang: "bash", code: `# Confirme em qual ramificação você está rodando, se houver dúvida.
cat /etc/os-release
# Em Gentoo puro:
# NAME=Gentoo
# ID=gentoo
# Em Funtoo: ID=funtoo. Em Calculate: ID=calculate. Em Sabayon: ID=sabayon.` },
      { lang: "bash", code: `# Conhecendo o repositório principal — chamado simplesmente 'gentoo'.
ls /var/db/repos/gentoo | head
# acct-group  acct-user  app-accessibility  app-admin  app-antivirus
# Cada pasta é uma 'categoria' contendo subpastas de pacotes (ebuilds).` },
      { lang: "bash", code: `# Ver qual versão do Portage você está usando hoje.
emerge --version
# Saída típica:
# Portage 3.0.65 (python 3.12.4-final-0, default/linux/amd64/23.0/desktop, gcc-13, glibc-2.40)` },
    ],
    points: [
      "Daniel Robbins é o criador, originalmente em 1999 sob o nome Enoch Linux.",
      "O nome vem do pinguim gentoo, espécie rápida no mar — metáfora de performance.",
      "Gentoo Linux 1.0 foi lançado em 2002 com o Portage como gerenciador central.",
      "Em 2004 a Gentoo Foundation passou a manter oficialmente o projeto.",
      "Funtoo, Calculate, Sabayon e Pentoo são forks/derivados conhecidos.",
      "ChromeOS do Google usa Portage por baixo dos panos — parente distante.",
      "O Portage foi inspirado no sistema de ports do FreeBSD.",
      "Iniciante comum: confundir Gentoo com seus derivados e seguir documentação errada.",
    ],
    alerts: [
      { type: "info", content: "A Gentoo Foundation é mantida com doações e sem patrocínio comercial agressivo. Isso explica em parte a postura 'sem firulas' da distro: não há pressão de marketing por trás dela." },
      { type: "tip", content: "Ao pesquisar problemas, sempre adicione 'site:wiki.gentoo.org' ou 'site:forums.gentoo.org' no Google. Resultados de Funtoo ou Calculate podem ter pequenas divergências." },
      { type: "success", content: "Conhecer a história ajuda a entender debates atuais (binhost vs source puro, OpenRC vs systemd, profile 23.0). Eles não são novos: vêm de raízes filosóficas do projeto." },
    ],
  },
  {
    slug: "filosofia-gentoo",
    section: "boas-vindas",
    title: "A filosofia: 'The Gentoo Way'",
    difficulty: "iniciante",
    subtitle: "Por que o Gentoo prefere escolha sobre conveniência — e o que isso significa na prática.",
    intro: `Existe uma frase informal que circula na comunidade desde os primeiros anos: 'Gentoo gives you choice'. Não é marketing, é princípio orientador. Cada decisão técnica do projeto privilegia colocar o controle nas mãos do usuário, mesmo que isso custe mais tempo de configuração ou exija mais conhecimento. É o oposto da filosofia 'opinionated' do macOS ou de muitos derivados Linux modernos.

Isso aparece em tudo: na opção entre OpenRC e systemd como init; nos perfis ('profiles') que definem alvos como desktop, server, hardened ou musl; na possibilidade de marcar pacotes como estáveis ou em testing; nas USE flags por pacote; no suporte a multilib (rodar binários 32-bit ao lado de 64-bit) ou no perfil no-multilib para sistemas mais enxutos. O Gentoo é descrito como uma 'meta-distribuição' justamente porque é mais um conjunto de ferramentas para você construir SUA distro do que uma distro pronta.

O outro pilar é o modelo source-based com rolling release. Não há 'Gentoo 23.04' nem 'Gentoo 24.10'. Existe um repositório vivo de ebuilds (receitas) que evolui dia a dia. Você sincroniza, atualiza e seu sistema acompanha o ritmo do upstream. Junte controle granular + atualização contínua + compilação otimizada e você tem o que a comunidade chama de 'The Gentoo Way': um sistema feito do seu jeito, no seu tempo, sob sua responsabilidade.`,
    codes: [
      { lang: "bash", code: `# Veja qual perfil ('profile') está ativo. Perfis definem padrões do sistema.
eselect profile show
# Saída típica:
# Current /etc/portage/make.profile symlink:
#   default/linux/amd64/23.0/desktop` },
      { lang: "bash", code: `# Listar todos os perfis disponíveis para amd64.
eselect profile list | head -n 30
# Você verá variações: desktop, desktop/gnome, desktop/plasma, server,
# hardened, musl, no-multilib, llvm, systemd, etc.` },
      { lang: "ini", code: `# Exemplo de USE flags por pacote em /etc/portage/package.use/mpv.
# Cada linha pode ligar (+) ou desligar (-) features.
media-video/mpv vaapi vulkan wayland -gtk -lua` },
      { lang: "bash", code: `# Rolling release na prática: três comandos por semana mantêm tudo em dia.
sudo emerge --sync                # baixa as receitas mais novas
eselect news read                 # leia novidades importantes da comunidade
sudo emerge -auDN @world          # atualiza o sistema todo` },
      { lang: "bash", code: `# Multilib: rodar Steam (32-bit) em sistema 64-bit.
# Perfis 'desktop' já vêm com multilib ativo. Para confirmar:
emerge --info | grep -i abi
# Para sair de multilib é só mudar para um perfil no-multilib (mais leve).` },
    ],
    points: [
      "Filosofia central: escolha sobre conveniência. Você decide cada peça.",
      "Meta-distribuição: o Gentoo te dá ferramentas, não uma distro pronta.",
      "Profiles definem o 'tipo' de sistema (desktop, server, hardened, musl).",
      "USE flags ajustam funcionalidades de cada pacote individualmente.",
      "Source-based: tudo compilado para sua CPU, com suas opções.",
      "Rolling release: sem versões fixas; atualização contínua via emerge --sync.",
      "Multilib opcional: 32-bit ao lado de 64-bit, ou perfil no-multilib enxuto.",
      "Iniciante comum: copiar make.conf de outra pessoa achando que serve igual.",
    ],
    alerts: [
      { type: "tip", content: "Comece com um perfil 'default/linux/amd64/23.0/desktop' no laptop comum. Migrar para 'hardened' ou 'no-multilib' depois é um eselect profile set." },
      { type: "warning", content: "Perfis musl e hardened têm consequências em compatibilidade de binários. Não troque por estética: leia as notas do perfil antes em packages.gentoo.org/profiles." },
      { type: "info", content: "'Meta-distro' não é exagero: Chromebooks, Funtoo e setups customizados de empresas usam Portage como base sem se chamarem Gentoo. A engine é flexível ao extremo." },
      { type: "success", content: "Quando você entende perfis + USE flags + rolling release, deixa de 'usar Gentoo' e passa a 'desenhar' seu próprio sistema. É um momento marcante para todo gentooísta." },
    ],
  },
  {
    slug: "onde-gentoo-roda",
    section: "boas-vindas",
    title: "Onde o Gentoo roda",
    difficulty: "iniciante",
    subtitle: "Arquiteturas suportadas, do servidor ao Raspberry Pi, e o que é Stage1/2/3.",
    intro: `Por ser uma distribuição source-based, o Gentoo tem uma vantagem natural quando o assunto é 'rodar em qualquer lugar': se existe um compilador GCC para a sua arquitetura, provavelmente existe um Gentoo. Em vez de manter dezenas de imagens binárias fechadas, o projeto distribui 'stages' (pontos de partida) que você expande compilando localmente. Isso permite suporte oficial a uma lista impressionante de plataformas.

As arquiteturas suportadas hoje incluem amd64 (x86 64 bits — a maioria dos PCs), arm64 (Raspberry Pi 4/5, servidores ARM, Apple Silicon via virtualização), x86 (32-bit, ainda mantido), ppc64/ppc64le (POWER, usado em servidores IBM e em Macs antigos), riscv (placas modernas como VisionFive 2), além de mips, sparc e alpha em modo legado. Cada arquitetura tem seus próprios mirrors de stage3 e perfil correspondente.

Onde Gentoo aparece no mundo real? Em servidores que precisam de tuning extremo, em workstations de desenvolvedores com builds otimizados, em embedded de telecomunicações, em sistemas hardened para perícia digital, em desktops de entusiastas e — curiosidade — dentro do ChromeOS, que usa Portage para construir o sistema base que roda em milhões de Chromebooks. Saber qual stage usar (Stage1, Stage2 ou Stage3) é o primeiro passo prático: o moderno é sempre Stage3, com Stage1/2 reservados a casos muito especiais.`,
    codes: [
      { lang: "bash", code: `# Descobrir a arquitetura do seu hardware antes de baixar a stage3.
uname -m
# Saídas comuns: x86_64 (amd64), aarch64 (arm64), riscv64, ppc64le, i686 (x86).` },
      { lang: "bash", code: `# Detalhes do CPU (modelo, flags, virtualização).
lscpu | head -n 15
# A linha 'Architecture' confirma a arch e 'Flags' mostra extensões (sse4_2, avx2)
# úteis depois para escolher CFLAGS e -march.` },
      { lang: "text", code: `# Tipos de stage disponíveis em distfiles.gentoo.org:
# stage3-amd64-openrc-*.tar.xz       -> sistema base com OpenRC
# stage3-amd64-systemd-*.tar.xz      -> sistema base com systemd
# stage3-amd64-desktop-openrc-*.xz   -> base com flags de desktop
# stage3-amd64-hardened-*.tar.xz     -> base hardened
# stage3-arm64-openrc-*.tar.xz       -> ARM 64-bit (Raspberry Pi 4/5)
# stage3-riscv-rv64_lp64d-*.tar.xz   -> RISC-V 64-bit moderno` },
      { lang: "bash", code: `# Baixar uma stage3 (exemplo amd64 + OpenRC) durante a instalação.
cd /mnt/gentoo
links https://www.gentoo.org/downloads/
# Ou direto:
wget https://distfiles.gentoo.org/releases/amd64/autobuilds/current-stage3-amd64-openrc/stage3-amd64-openrc-*.tar.xz` },
      { lang: "bash", code: `# Stage1 e Stage2 são raros hoje (só para construir distros próprias).
# Stage3 já vem com glibc, gcc, coreutils, openrc/systemd e Portage funcionais.
# Verifique a integridade ANTES de descompactar:
sha512sum stage3-amd64-openrc-*.tar.xz
# Compare com o arquivo .DIGESTS.asc baixado junto.` },
    ],
    points: [
      "Arquiteturas oficiais: amd64, arm64, x86, ppc64/ppc64le, riscv, e legados (mips, sparc).",
      "amd64 é a mais comum e a mais bem suportada (binhost oficial inclusive).",
      "arm64 funciona muito bem em Raspberry Pi 4/5 e em servidores ARM.",
      "Stage3 é o ponto de partida moderno. Stage1/2 quase nunca são usados hoje.",
      "Cada arch tem seu próprio mirror em distfiles.gentoo.org/releases/<arch>/.",
      "ChromeOS é construído com Portage — Gentoo roda em milhões de Chromebooks.",
      "Embedded com Gentoo costuma usar crossdev para compilar de uma máquina mais forte.",
      "Iniciante comum: baixar stage3 errada (systemd quando queria OpenRC, ou vice-versa).",
    ],
    alerts: [
      { type: "tip", content: "Para amd64 desktop comum, baixe 'stage3-amd64-desktop-openrc' ou '-systemd' já com USE flags pré-ajustadas para desktop. Economiza recompilação no início." },
      { type: "info", content: "Stage1 e Stage2 só fazem sentido se você está construindo seu próprio fluxo (ex.: Catalyst para criar imagens customizadas). Para usuários comuns, esqueça que existem." },
      { type: "warning", content: "Sempre verifique SHA-512 e a assinatura GPG da stage3 antes de descompactar. Mirrors podem entregar arquivos corrompidos ou, em casos raros, comprometidos." },
      { type: "success", content: "O mesmo Portage que roda no seu desktop amd64 roda no Raspberry Pi e em um servidor IBM POWER. Aprender Gentoo uma vez te dá habilidade transferível para várias plataformas." },
    ],
  },
];
