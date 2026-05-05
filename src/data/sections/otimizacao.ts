import type { Chapter } from "../types";

export const chapters: Chapter[] = [
  {
    slug: "cflags-cxxflags",
    section: "otimizacao",
    title: "CFLAGS e CXXFLAGS: ajustando o compilador",
    difficulty: "intermediario",
    subtitle: "As variáveis que dizem ao GCC como compilar tudo no seu sistema.",
    intro: `Em distribuições binárias como Ubuntu ou Fedora, o pacote já vem compilado com flags genéricas escolhidas pelo mantenedor. No Gentoo, como você compila tudo em casa, é você que decide essas flags. As variáveis 'CFLAGS' (para C) e 'CXXFLAGS' (para C++) ficam em '/etc/portage/make.conf' e são passadas para o GCC em quase todo build.

A escolha mais importante é o nível de otimização: '-O2' é o padrão recomendado pelo Gentoo e é o que a maioria dos projetos upstream testa. '-O3' liga otimizações mais agressivas (vetorização automática, inlining maior) que às vezes ganham um pouquinho de performance, mas também aumentam o tamanho do binário e ocasionalmente quebram pacotes. '-Os' otimiza para tamanho e faz sentido em sistemas embarcados.

Outras flags úteis: '-pipe' faz o GCC usar pipes em vez de arquivos temporários (mais rápido, gasta mais RAM), '-fomit-frame-pointer' libera um registrador (já é padrão em '-O' a partir do GCC moderno), e '-march=' define o nível mínimo de instruções da CPU (vamos detalhar no próximo capítulo). O padrão é repetir 'COMMON_FLAGS' e fazer CFLAGS/CXXFLAGS apontar para ele.`,
    codes: [
      { lang: "conf", code: `# /etc/portage/make.conf — exemplo moderno e seguro.
# COMMON_FLAGS centraliza o que é comum a C e C++.
COMMON_FLAGS="-march=native -O2 -pipe"
CFLAGS="\${COMMON_FLAGS}"
CXXFLAGS="\${COMMON_FLAGS}"
FCFLAGS="\${COMMON_FLAGS}"
FFLAGS="\${COMMON_FLAGS}"` },
      { lang: "bash", code: `# Ver as flags que o GCC entende para o seu processador:
gcc -march=native -E -v - </dev/null 2>&1 | grep cc1
# Saída mostra o march expandido, ex: -march=znver3 -mmmx -mavx2 ...` },
      { lang: "bash", code: `# Recompilar o sistema inteiro depois de mudar CFLAGS:
sudo emerge --ask --emptytree --usepkg=n @world
# --emptytree força recompilar tudo.
# Forma menos drástica (só pacotes que dependem disso):
sudo emerge --ask --changed-use --deep @world` },
      { lang: "bash", code: `# Conferir com qual CFLAGS um pacote foi compilado:
qlop -lH app-editors/vim
# Para inspecionar o build.log com flags reais:
less /var/tmp/portage/app-editors/vim-*/temp/build.log | grep -E '^gcc.*-O'` },
      { lang: "conf", code: `# Para casos específicos, sobrescreva por pacote em
# /etc/portage/env/o2.conf
CFLAGS="-march=native -O2 -pipe"
CXXFLAGS="\${CFLAGS}"

# E em /etc/portage/package.env
# media-video/ffmpeg o2.conf` },
    ],
    points: [
      "CFLAGS e CXXFLAGS ficam em /etc/portage/make.conf e valem para tudo.",
      "Use '-O2 -pipe -march=...' como base segura, recomendada oficialmente.",
      "'-O3' raramente compensa: pouco ganho, binário maior, ocasionais bugs.",
      "Sempre repita as mesmas flags em CFLAGS e CXXFLAGS — divergir causa problemas sutis.",
      "Mudou flags? Recompile com '--changed-use --deep @world' (ou --emptytree em caso radical).",
      "Use /etc/portage/env para flags por pacote, sem poluir o make.conf global.",
      "Armadilha comum: copiar flags malucas de fórum ('-O3 -funroll-all-loops -ffast-math') e quebrar libreoffice.",
      "Iniciante comum: esquecer '-pipe' achando que é otimização — é só onde o GCC guarda os intermediários.",
    ],
    alerts: [
      { type: "tip", content: "Se um pacote falha só com -O3, crie um env file com -O2 e atribua só àquele pacote em /etc/portage/package.env. Não derrube o sistema inteiro." },
      { type: "warning", content: "Nunca use '-ffast-math' globalmente. Quebra cálculos numéricos em programas científicos, áudio (pulseaudio, pipewire) e em jogos com física." },
      { type: "info", content: "O Portage ignora flags que o GCC não reconhece, mas algumas eclasses (como toolchain) filtram flags perigosas via 'strip-flags'. Não estranhe se o build.log mostrar menos flags do que você pediu." },
      { type: "danger", content: "Compilar o GCC, glibc ou binutils com flags exóticas pode deixar o sistema impossível de bootar. Para esses pacotes, use sempre '-O2' e nada de '-march' especulativo." },
    ],
  },
  {
    slug: "march-native",
    section: "otimizacao",
    title: "march=native: instruções específicas do seu CPU",
    difficulty: "intermediario",
    subtitle: "A flag mais cobiçada do gentooísta — e suas armadilhas reais.",
    intro: `Toda CPU moderna entende um conjunto base de instruções (x86-64) e, por cima, extensões opcionais como SSE4.2, AVX, AVX2, AVX-512, BMI, AES-NI. Distribuições binárias precisam mirar no menor denominador comum (por anos foi até 'x86-64-v1', equivalente a um Athlon 64 de 2003), o que joga fora capacidade de processadores novos. No Gentoo você pode dizer ao GCC: 'use tudo o que esta máquina aqui suporta'. Isso é o '-march=native'.

Quando você passa '-march=native', o GCC inspeciona o '/proc/cpuinfo' em tempo de compilação e expande para o nome real da microarquitetura (znver3 para Ryzen 5000, alderlake para Intel 12ª geração) mais a lista de extensões detectadas. O resultado é binário potencialmente mais rápido em rotinas que vetorizam bem (vídeo, criptografia, compressão, ML).

A grande armadilha é distribuição: um binário compilado com '-march=native' no seu Ryzen NÃO roda em um Celeron antigo. Se você gera 'binpkgs' (pacotes binários) e quer compartilhar entre máquinas diferentes, o '-march=native' atrapalha. Para esses casos, escolha um nível padronizado como '-march=x86-64-v3' (Haswell+, ~2013) ou '-march=x86-64-v4' (com AVX-512), que servem famílias inteiras de CPUs.`,
    codes: [
      { lang: "bash", code: `# Ver o que o GCC EXPANDIRIA -march=native para:
gcc -march=native -Q --help=target | head -40
# A primeira linha já mostra: -march=                    znver3
# Em seguida lista cada -m... ligado/desligado.` },
      { lang: "bash", code: `# Conhecer as extensões da sua CPU sem GCC:
grep -m1 -o 'flags.*' /proc/cpuinfo | tr ' ' '\\n' | sort | head
# Saída inclui: aes, avx, avx2, sse4_2, bmi1, bmi2, fma, etc.` },
      { lang: "conf", code: `# Para a SUA máquina (1 CPU, sem compartilhar binários):
COMMON_FLAGS="-march=native -O2 -pipe"

# Para gerar binpkgs reutilizáveis em CPUs Intel/AMD razoavelmente novas:
# COMMON_FLAGS="-march=x86-64-v3 -O2 -pipe"

# Para máxima compatibilidade (fallback):
# COMMON_FLAGS="-march=x86-64 -O2 -pipe"` },
      { lang: "bash", code: `# Em CPUs híbridas (Intel 12+: P-cores e E-cores) o -mtune é importante:
# Em fevereiro de 2024 o GCC ganhou suporte adequado a alderlake/raptorlake.
# Confirme com:
gcc --version
# E prefira gcc 13+ se tiver CPU híbrida.` },
      { lang: "text", code: `# Erro típico ao rodar binário compilado em CPU diferente:
$ /usr/bin/ffmpeg -version
Illegal instruction (core dumped)
# Significa que o binário usou uma instrução (geralmente AVX2 ou AVX-512)
# que a CPU atual não tem. Recompile com -march compatível.` },
    ],
    points: [
      "'-march=native' diz ao GCC para detectar e usar tudo o que sua CPU suporta.",
      "É a melhor escolha quando você compila SÓ para a máquina que está compilando.",
      "Para distribuir binpkgs entre máquinas, use níveis padronizados x86-64-v2/v3/v4.",
      "x86-64-v3 cobre Haswell+ (Intel) e Excavator+ (AMD), bom equilíbrio em 2024+.",
      "Confira sempre o que '-march=native' expande com 'gcc -march=native -Q --help=target'.",
      "Cross-compilando ou usando distcc? -march=native do host pode ser inadequado para o alvo.",
      "Armadilha comum: usar '-march=native' e depois copiar binário gerado para outra máquina.",
      "Iniciante comum: confundir '-march' (alvo mínimo) com '-mtune' (otimizar SEM exigir extensões).",
    ],
    alerts: [
      { type: "info", content: "Os níveis x86-64-v1/v2/v3/v4 foram padronizados em 2020 pelos vendors e GCC. v1 é o baseline antigo, v3 cobre AVX2, v4 exige AVX-512. Valem ouro para distribuir binpkgs." },
      { type: "tip", content: "Se você tem várias máquinas Gentoo, escolha o '-march' mais antigo entre elas e habilite FEATURES='buildpkg'. Assim cada upgrade gera binários compatíveis com toda a casa." },
      { type: "warning", content: "Mudar de '-march=x86-64' para '-march=native' não acelera milagrosamente. Em pacotes que não usam SIMD, o ganho é mínimo. O grande ganho está em ffmpeg, x265, openssl, libjpeg-turbo." },
      { type: "danger", content: "Em VPS/servidor cloud, evite '-march=native'. A migração ao vivo da VM para outro host com CPU diferente vai derrubar processos com 'Illegal instruction'." },
    ],
  },
  {
    slug: "lto",
    section: "otimizacao",
    title: "LTO: otimização em tempo de link",
    difficulty: "avancado",
    subtitle: "Quando o compilador enxerga o programa inteiro, ele pode otimizar muito mais.",
    intro: `Por padrão, o GCC compila cada arquivo .c separadamente em um .o, e só junta tudo no final, no link. Isso significa que otimizações como inlining e dead code elimination param na fronteira de cada arquivo. O 'Link Time Optimization' (LTO) muda esse jogo: cada .o guarda também a representação intermediária (GIMPLE), e no link o GCC reotimiza considerando o programa inteiro de uma vez.

O resultado tende a ser binários menores e ligeiramente mais rápidos (geralmente 2-10%), com destaque para programas grandes como Firefox, Chromium, LibreOffice. A receita ativa-se com a flag '-flto' nas CFLAGS/CXXFLAGS e nas LDFLAGS. No Gentoo moderno, existe ainda o USE flag 'lto' em vários pacotes, e a 'lto.eclass' que indica suporte oficial.

A armadilha é a compatibilidade. Alguns pacotes (especialmente módulos do kernel out-of-tree, drivers proprietários e código com inline assembly delicado) quebram com LTO. O consumo de RAM no link também explode — Firefox com LTO pode pedir 16GB+ de RAM por job. Recomenda-se introduzir LTO gradualmente e ter um arquivo env de fallback sem LTO para os pacotes problemáticos.`,
    codes: [
      { lang: "conf", code: `# /etc/portage/make.conf — habilitar LTO globalmente.
COMMON_FLAGS="-march=native -O2 -pipe -flto"
CFLAGS="\${COMMON_FLAGS}"
CXXFLAGS="\${COMMON_FLAGS}"
LDFLAGS="-Wl,-O1 -Wl,--as-needed -flto"

# Use o linker LLD ou GOLD para LTO mais rápido:
# emerge sys-devel/lld
# LDFLAGS="\${LDFLAGS} -fuse-ld=lld"` },
      { lang: "conf", code: `# /etc/portage/env/no-lto.conf — fallback para pacotes que quebram.
CFLAGS="\${CFLAGS} -fno-lto"
CXXFLAGS="\${CXXFLAGS} -fno-lto"
LDFLAGS="\${LDFLAGS} -fno-lto"` },
      { lang: "conf", code: `# /etc/portage/package.env — atribuir o env aos problemáticos.
sys-libs/glibc        no-lto.conf
sys-kernel/gentoo-sources no-lto.conf
x11-drivers/nvidia-drivers no-lto.conf` },
      { lang: "bash", code: `# Recompilar pacotes que se beneficiam mais com LTO:
sudo emerge --ask --oneshot \\
  www-client/firefox \\
  app-office/libreoffice \\
  media-video/ffmpeg
# Tenha paciência. E RAM.` },
      { lang: "text", code: `# Erro típico de link sem RAM suficiente com LTO:
collect2: fatal error: ld terminated with signal 9 [Killed]
# Significa que o OOM killer matou o linker.
# Soluções: reduzir MAKEOPTS para -j2, criar swapfile temporário,
# ou desabilitar LTO para o pacote.` },
    ],
    points: [
      "LTO faz o GCC otimizar o programa inteiro no momento do link.",
      "Ganhos típicos: 2-10% em performance e 5-15% em tamanho de binário.",
      "Habilite com '-flto' em CFLAGS, CXXFLAGS e LDFLAGS simultaneamente.",
      "Use linker LLD (llvm) ou GOLD (gnu) para acelerar muito o link.",
      "Tenha um env 'no-lto.conf' pronto para pacotes que quebram (kernel, glibc, nvidia).",
      "RAM é o gargalo: Firefox com LTO precisa de ~16GB livres no link.",
      "Armadilha comum: ativar LTO no GCC ou glibc e travar a próxima atualização do toolchain.",
      "Armadilha: esquecer de colocar -flto também nas LDFLAGS — o efeito é parcial.",
    ],
    alerts: [
      { type: "warning", content: "LTO + makepkg paralelo (-j$(nproc)) explode o uso de RAM. Em máquinas com pouca memória, reduza MAKEOPTS no env do pacote ou aumente o swap antes." },
      { type: "tip", content: "Use 'qlop -tH www-client/firefox' antes e depois de habilitar LTO para medir a diferença real no tempo e no tamanho instalado. Sem medir, você nunca sabe se valeu." },
      { type: "info", content: "A 'lto.eclass' do Gentoo padroniza como ebuilds tratam LTO. Pacotes que herdam essa eclass respeitam '-flto' adequadamente; outros podem strippar." },
      { type: "danger", content: "Nunca habilite '-flto' em sys-libs/glibc, sys-devel/gcc ou sys-devel/binutils sem ter live ISO à mão. Falha aqui pode tornar o sistema impossível de reconstruir." },
    ],
  },
  {
    slug: "pgo",
    section: "otimizacao",
    title: "PGO: otimização guiada por perfil",
    difficulty: "avancado",
    subtitle: "Compile, rode, meça, recompile com base no que rodou de verdade.",
    intro: `O 'Profile Guided Optimization' (PGO) é uma técnica de duas etapas. Primeiro, você compila o programa com instrumentação ('-fprofile-generate'), gerando um binário que registra quais funções são chamadas mais, quais branches são tomadas, quais loops rodam quantas vezes. Você executa esse binário com cargas representativas (rodar testes, abrir o app, navegar). Depois recompila com '-fprofile-use', e o GCC usa esses dados para alinhar código quente, inverter branches, decidir inlining baseado em fatos, não em heurísticas.

O ganho é real e mensurável em programas complexos: Firefox PGO entrega 5-15% de melhoria no tempo de carregamento, Chromium chega a 20%, Python (CPython) 10-20% em benchmarks. É por isso que distribuições binárias modernas já entregam Firefox e Chrome com PGO de fábrica. No Gentoo, vários ebuilds importantes (firefox, thunderbird, mariadb, php) têm USE flag 'pgo' que automatiza o ciclo.

Há também o 'BOLT' (Binary Optimization and Layout Tool, da Meta), que é uma técnica complementar pós-link: ele reordena o código já compilado com base no profile. Funciona em cima de qualquer binário, inclusive já PGO+LTO. Em troca de algumas horas de compilação a mais, você ganha um software efetivamente mais responsivo.`,
    codes: [
      { lang: "bash", code: `# A maioria dos ebuilds que suporta PGO faz tudo via USE flag.
# Habilite em /etc/portage/package.use:
echo 'www-client/firefox pgo lto' | sudo tee -a /etc/portage/package.use/firefox

# Depois é só:
sudo emerge --ask --oneshot www-client/firefox` },
      { lang: "text", code: `# Saída típica durante a fase PGO de um ebuild:
>>> Source compiled.
 * Performing PGO instrumentation phase...
>>> Generating profile by running test workload...
 * Running browser benchmark for ~5 minutes
>>> Recompiling with profile data...
>>> Source unpacked in /var/tmp/portage/...
# Total: pode dobrar o tempo de build.` },
      { lang: "bash", code: `# Para PGO manual em um programa qualquer (fora do ebuild):
# Etapa 1: compilar instrumentado.
gcc -O2 -fprofile-generate=/tmp/prof -o app app.c

# Etapa 2: rodar com cargas reais.
./app < input-tipico.txt

# Etapa 3: recompilar com perfil.
gcc -O2 -fprofile-use=/tmp/prof -o app app.c` },
      { lang: "bash", code: `# BOLT (Binary Optimization Layout Tool) — pós-PGO:
emerge sys-devel/llvm-bolt

# Coletar perfil do binário já em uso:
perf record -e cycles:u -j any,u -o perf.data -- ./meu_app
perf2bolt -p perf.data -o app.fdata ./meu_app
llvm-bolt ./meu_app -o ./meu_app.bolt -data=app.fdata \\
  -reorder-blocks=ext-tsp -reorder-functions=hfsort+ -split-functions` },
      { lang: "conf", code: `# Em /etc/portage/make.conf, para casos avançados:
# Forçar PGO no kernel (gentoo-sources tem suporte experimental).
CONFIG_PGO_CLANG=y
# Dispara workload e regenera. Ganho típico no kernel: 5-10% em I/O.` },
    ],
    points: [
      "PGO usa dados reais de execução para guiar otimizações do compilador.",
      "É um ciclo: instrumentar → executar workload → recompilar com profile.",
      "Habilite USE='pgo' em pacotes que suportam (firefox, thunderbird, php, mariadb).",
      "Combine com LTO: 'pgo lto' juntos rendem mais que cada um sozinho.",
      "BOLT é uma camada extra que reorganiza código já compilado, baseado em perf.",
      "Workload representativo é tudo: PGO 'errado' pode até piorar o caso real.",
      "Armadilha comum: ativar 'pgo' sem ter RAM/tempo (Firefox PGO+LTO leva ~2h em CPU média).",
      "Armadilha: rodar workload mínimo (só abrir o app) e perder o efeito do PGO.",
    ],
    alerts: [
      { type: "info", content: "A combinação PGO + LTO + BOLT é o que distribuidores usam para entregar Firefox e Chrome 'rápidos de verdade'. No Gentoo você pode replicar isso em casa." },
      { type: "warning", content: "PGO duplica (no mínimo) o tempo de build. Em máquinas modestas, deixe rodando à noite ou use binhost para evitar." },
      { type: "tip", content: "Combine PGO com ccache. A primeira fase (instrumentation) cacheia, e a segunda (use) também — você só perde tempo se invalidar o profile." },
      { type: "success", content: "Ganhos de PGO em Python (USE=pgo em dev-lang/python) são notáveis: scripts cotidianos rodam 10-20% mais rápidos sem mudar uma linha de código." },
    ],
  },
  {
    slug: "ccache",
    section: "otimizacao",
    title: "ccache: cache de compilação",
    difficulty: "intermediario",
    subtitle: "Recompile o mesmo código mil vezes pagando o preço uma só.",
    intro: `Toda vez que você atualiza um pacote do Gentoo, mesmo que mude só uma linha, o Portage compila tudo do zero. O 'ccache' é um wrapper transparente do GCC que olha para o arquivo de entrada e suas flags, faz um hash, e se ele já viu essa combinação antes, devolve direto o .o em cache. Em revbumps (mesmo código com versão nova) e em recompilações por mudança de USE flag, o ganho pode ser de 50-90% no tempo total.

Instalar é trivial: 'emerge dev-util/ccache' e adicionar 'FEATURES="ccache"' ao '/etc/portage/make.conf'. O Portage cria automaticamente o usuário 'portage' como dono do diretório de cache (padrão '/var/cache/ccache'), e a partir do próximo emerge cada call ao gcc/g++ passa pelo ccache.

A pegadinha é o tamanho do cache. O padrão é 5GB, que enche em poucas semanas em quem atualiza muito. Configure 'CCACHE_MAXSIZE' no '/etc/portage/ccache.conf' para algo entre 20G e 50G se tiver disco. Use 'ccache -s' (statistics) para ver hit ratio: abaixo de 30% normalmente significa que o cache está pequeno demais ou que você está mudando flags com frequência.`,
    codes: [
      { lang: "bash", code: `# Instalar e habilitar ccache.
sudo emerge --ask dev-util/ccache

# Adicionar ao /etc/portage/make.conf:
echo 'FEATURES="\${FEATURES} ccache"' | sudo tee -a /etc/portage/make.conf
echo 'CCACHE_DIR="/var/cache/ccache"' | sudo tee -a /etc/portage/make.conf
echo 'CCACHE_SIZE="50G"' | sudo tee -a /etc/portage/make.conf` },
      { lang: "conf", code: `# /etc/portage/ccache.conf — config global do ccache.
max_size = 50G
compression = true
compression_level = 6
# 'compression' reduz uso de disco em 2-3x sem custo de CPU notável.
# 'sloppiness' útil quando muda timestamps mas conteúdo igual:
sloppiness = include_file_mtime,time_macros,locale` },
      { lang: "bash", code: `# Estatísticas do cache:
ccache -s
# Saída exemplo:
# cache hit (direct)            12453
# cache hit (preprocessed)       2104
# cache miss                     8932
# files in cache                51230
# cache size                     34.2 GB / 50.0 GB

# Limpar tudo (raramente necessário):
ccache -C` },
      { lang: "bash", code: `# Recompilar um pacote para popular o cache:
sudo emerge --ask --oneshot media-video/ffmpeg

# Forçar recompilação para testar o ganho:
sudo emerge --ask --oneshot --usepkg=n media-video/ffmpeg
# Compare 'qlop -tH media-video/ffmpeg' antes e depois:
# 1ª vez: 12 minutos. 2ª vez: 1 minuto.` },
      { lang: "bash", code: `# Conferir que o ccache realmente está sendo usado:
ls -la /var/cache/ccache/
# Deve ter subpastas 0/ 1/ 2/ ... f/ e o arquivo ccache.conf
# Permissões devem ser portage:portage.

# Se algum pacote não usa ccache, verifique:
emerge --info | grep -E 'CCACHE|FEATURES'` },
    ],
    points: [
      "ccache acelera recompilações do MESMO código, comum em revbumps e USE changes.",
      "Habilita-se com FEATURES='ccache' no make.conf — o Portage cuida do resto.",
      "Tamanho default (5G) é pequeno; aumente para 20-50G no ccache.conf.",
      "Compression=true reduz uso de disco em 2-3x sem custo notável.",
      "Use 'ccache -s' para checar hit ratio — alvo: acima de 50%.",
      "Não acelera 'primeira instalação' de um pacote — só ajuda da segunda vez em diante.",
      "Armadilha comum: rodar 'ccache -C' sem necessidade e perder semanas de cache.",
      "Iniciante comum: esperar speedup em emerge --update inicial; o ganho aparece em iterações.",
    ],
    alerts: [
      { type: "tip", content: "Em laptops com SSD pequeno, mantenha o ccache em um HDD externo (CCACHE_DIR='/mnt/disco/ccache'). Latência maior, mas 50GB de cache é caro em SSD nvme." },
      { type: "info", content: "O ccache não cacheia link, só compilação. Em pacotes dominados pelo tempo de link (LTO!), o ganho é menor. Combine com lld para acelerar o link separadamente." },
      { type: "warning", content: "Se você muda CFLAGS, o ccache invalida tudo (hash diferente) e precisa re-popular. Mude CFLAGS com consciência ou aceite a primeira recompilada lenta." },
      { type: "success", content: "Em sistemas que recompilam @world toda semana, ccache transforma builds de 6h em builds de 1-2h sem mudar mais nada." },
    ],
  },
  {
    slug: "distcc",
    section: "otimizacao",
    title: "distcc: distribuir compilação na rede",
    difficulty: "avancado",
    subtitle: "Use a CPU dos outros computadores da casa para acelerar seus builds.",
    intro: `Se você tem mais de um computador rodando Gentoo (ou até qualquer Linux com GCC compatível), o 'distcc' permite distribuir a compilação. O cliente (sua máquina principal) faz o pré-processamento e envia o .i resultante para os 'volunteers' na rede, que compilam para .o e devolvem. O link continua local. O resultado é um build paralelo que escala com a soma dos cores de todas as máquinas.

A configuração tem três passos: instalar 'sys-devel/distcc' em todas, configurar a lista de hosts no cliente e iniciar o daemon 'distccd' nos volunteers. Como o GCC precisa ser idêntico (mesma versão, mesmo target), é comum padronizar a versão do gcc em todas as máquinas — ou usar 'crossdev' nos volunteers para gerar um GCC equivalente quando as arquiteturas diferem.

Vale a pena? Em uma casa com 1 desktop quad-core e 1 laptop dual-core, ganhar 6 cores efetivos no Firefox é palpável. Em ambientes corporativos com 5+ máquinas ociosas, distcc transformou builds de horas em minutos por décadas. A ressalva: latência de rede importa. Em Wi-Fi flutuante, o overhead de transferir os .i pode anular o ganho. Use cabo se possível.`,
    codes: [
      { lang: "bash", code: `# Em TODAS as máquinas (cliente e servidores):
sudo emerge --ask sys-devel/distcc

# No(s) servidor(es) — máquinas que vão compilar para outras:
sudo rc-update add distccd default
sudo nano /etc/conf.d/distccd
# Edite a linha DISTCCD_OPTS para permitir sua rede:
# DISTCCD_OPTS="--allow 192.168.1.0/24 --listen 0.0.0.0 -j 4"
sudo rc-service distccd start` },
      { lang: "conf", code: `# /etc/portage/make.conf no CLIENTE:
FEATURES="\${FEATURES} distcc"

# Liste hosts: nome ou IP, opcional /N (jobs por host).
# Ordem importa: o primeiro recebe mais trabalho.
# 'localhost' fica por último para evitar gargalo.
# 8 jobs no servidor, 4 jobs local:
# em /etc/distcc/hosts (ou via distcc-config):
distcc-config --set-hosts "192.168.1.20/8 192.168.1.21/4 localhost/4"

# MAKEOPTS = soma + 1 para overlap.
MAKEOPTS="-j17"` },
      { lang: "bash", code: `# Garantir que cliente e servidor tenham GCC idêntico:
gcc --version    # rode nas duas máquinas
# Se diferentes:
sudo eselect gcc list
sudo eselect gcc set 1
sudo env-update && source /etc/profile

# Para arquiteturas diferentes (ex: x86 servidor compilando p/ amd64 cliente):
# instale crossdev no servidor e exporte o triplet correto.` },
      { lang: "bash", code: `# Monitorar o distcc em tempo real durante um emerge:
distccmon-text 2
# Saída mostra cada job e em qual host está rodando.
# Ou GUI:
distccmon-gnome &

# Conferir o ganho:
qlop -tH www-client/firefox  # antes
sudo emerge --ask --oneshot www-client/firefox  # com distcc
qlop -tH www-client/firefox  # depois` },
      { lang: "text", code: `# Erro típico de versão diferente:
distccd[1234]: (dcc_check_compiler_masq) CRITICAL!
Compiler version mismatch: client=13.2.1 server=12.3.0
# Solução: alinhe versões com 'eselect gcc'.

# Erro de firewall:
distcc[5678]: (dcc_connect_by_addr) ERROR!
connect to 192.168.1.20:3632 failed: No route to host
# Solução: liberar porta 3632/tcp no firewall do servidor.` },
    ],
    points: [
      "distcc distribui a compilação entre várias máquinas pela rede.",
      "Cliente faz preprocessamento, servidores compilam, link é local.",
      "Configure FEATURES='distcc' no cliente e MAKEOPTS=-jN com N = soma dos cores + 1.",
      "GCC tem que bater de versão entre cliente e servidores — padronize.",
      "Use cabo de rede se possível; Wi-Fi com latência alta mata o ganho.",
      "Combina perfeitamente com ccache: ccache local + distcc rede.",
      "Armadilha comum: esquecer de --allow no /etc/conf.d/distccd e não conectar.",
      "Iniciante comum: usar MAKEOPTS=-j$(nproc), ignorando os cores remotos.",
    ],
    alerts: [
      { type: "tip", content: "Habilite 'pump mode' (distcc-pump) para fazer também o preprocessamento remoto. Funciona melhor em códigos com muitos #include — ganho extra de 30%." },
      { type: "warning", content: "distcc não criptografa por padrão. Em rede local entre máquinas confiáveis tudo bem; em redes públicas, túnele tudo via SSH (DISTCC_HOSTS='@host')." },
      { type: "info", content: "Pacotes que usam muito linker (LTO, kernel, glibc) ganham pouco com distcc — o link continua local. O sweet spot é compilação pesada de C++ como Firefox, Qt, Chromium." },
      { type: "danger", content: "Não habilite distccd na internet pública sem autenticação. Você estará oferecendo execução remota de código (compile = executar) para qualquer um." },
    ],
  },
  {
    slug: "binhost",
    section: "otimizacao",
    title: "Binhost: usando binários oficiais do Gentoo",
    difficulty: "iniciante",
    subtitle: "Desde 2024 o Gentoo distribui binpkgs oficiais — você pode usar.",
    intro: `Por décadas o Gentoo foi sinônimo de 'compila tudo'. Em dezembro de 2023, o projeto lançou oficialmente o 'Gentoo Binary Host' (binhost): um repositório de pacotes binários assinados, mantidos pelos próprios devs, cobrindo o profile padrão amd64 (e arm64 em expansão). Para a maioria dos usuários novos, isso muda a equação: você pode instalar Firefox, LibreOffice, Chromium e o KDE inteiro em minutos, não horas.

A configuração é simples: ative 'getbinpkg' no FEATURES e configure '/etc/portage/binrepos.conf/' apontando para o binhost oficial. O Portage passa então a checar, para cada pacote, se existe um binário compatível antes de cair no 'compilar local'. A compatibilidade é determinada por USE flags, CFLAGS e profile — se baterem, o binário é instalado direto; senão, compila como sempre.

Isso não te força a usar binário em tudo. Se você gosta de USE flags personalizadas em alguns pacotes, eles continuam compilando localmente, e os outros (que combinam) chegam prontos. É a maneira pragmática de aproveitar Gentoo sem fritar a CPU em pacotes que você não precisa customizar (ex: navegador, suíte office, kernel pré-compilado).`,
    codes: [
      { lang: "bash", code: `# 1) Habilitar getbinpkg no make.conf.
sudo nano /etc/portage/make.conf
# Adicione:
FEATURES="\${FEATURES} getbinpkg"

# 2) Criar o arquivo do binhost oficial:
sudo mkdir -p /etc/portage/binrepos.conf
sudo nano /etc/portage/binrepos.conf/gentoobinhost.conf` },
      { lang: "conf", code: `# /etc/portage/binrepos.conf/gentoobinhost.conf
[binhost]
priority = 9999
sync-uri = https://distfiles.gentoo.org/releases/amd64/binpackages/23.0/x86-64/

# Para profile desktop:
# sync-uri = .../23.0/x86-64-v3/   (CPUs Haswell+)
# Para servidor sem AVX:
# sync-uri = .../23.0/x86-64/      (baseline universal)` },
      { lang: "bash", code: `# 3) Importar a chave de assinatura do Gentoo:
sudo getuto

# 4) Sincronizar a lista de binpkgs:
sudo emaint binhost --fix
# Ou simplesmente rode um sync normal:
sudo emerge --sync` },
      { lang: "bash", code: `# Ver na próxima atualização: B significa 'binário'.
sudo emerge -auDNv @world
# Saída terá:
# [binary  N     ] www-client/firefox-122.0
# [ebuild  N     ] sys-libs/glibc-2.38-r10
# 'binary' = vem pronto. 'ebuild' = compila localmente.` },
      { lang: "bash", code: `# Forçar uso preferencial de binário (--getbinpkgonly nunca compila):
sudo emerge --ask --getbinpkgonly www-client/firefox

# Forçar compilação local mesmo havendo binário:
sudo emerge --ask --usepkg=n www-client/firefox` },
    ],
    points: [
      "Desde 2024 o Gentoo tem binhost oficial assinado, cobrindo amd64 default.",
      "Habilite com FEATURES='getbinpkg' e configure /etc/portage/binrepos.conf/.",
      "Escolha a URL conforme seu CHOST/profile (x86-64 vs x86-64-v3).",
      "Rode 'getuto' uma vez para importar a chave GPG dos binários.",
      "Pacotes com USE flags batendo vêm prontos; o resto continua compilando.",
      "Útil em laptops e servidores onde compilar Firefox toda semana é caro.",
      "Armadilha comum: USE flags customizadas em make.conf invalidam binários — escolha bem.",
      "Iniciante comum: ignorar 'getuto' e ter binários rejeitados por falta de chave GPG.",
    ],
    alerts: [
      { type: "success", content: "O binhost oficial cobre milhares de pacotes do mundo desktop (Firefox, LibreOffice, KDE, GNOME). É um divisor de águas para quem quer Gentoo sem o fardo da compilação total." },
      { type: "info", content: "Os binpkgs são compilados em CHOST padrão (x86-64 baseline). Se você usa USE flags muito específicas, o Portage simplesmente não baixa o binário e compila local. Não há perda." },
      { type: "tip", content: "Use '--getbinpkg --usepkg' nas instalações do KDE/Plasma, e mantenha compilação local em pacotes onde você customiza USE (ex: nginx, postgresql)." },
      { type: "warning", content: "Se sua CPU não suporta x86-64-v3, NÃO use a URL com -v3. Vai instalar binários e dar 'Illegal instruction' na primeira execução. Sempre confira com '/lib/ld-linux-x86-64.so.2 --help | grep supported'." },
    ],
  },
  {
    slug: "binpkgs",
    section: "otimizacao",
    title: "Gerando seus próprios binpkgs",
    difficulty: "intermediario",
    subtitle: "Compile uma vez, instale em N máquinas — ou faça backup do que já tem.",
    intro: `Mesmo sem binhost remoto, o Portage sabe gerar binários locais a partir de cada compilação. Basta ativar 'FEATURES="buildpkg"' no '/etc/portage/make.conf' que, ao final de cada emerge, o pacote instalado é também empacotado em '/var/cache/binpkgs/' como um arquivo '.gpkg.tar' (formato moderno) ou '.tbz2' (legado). Esse arquivo contém binários, libs, metadados, USE flags e a versão exata.

Isso resolve dois problemas comuns. O primeiro é redundância: se você tem 3 máquinas com mesmo CHOST/USE, compile em uma e instale nas outras com '--getbinpkg' apontando o sync-uri local (HTTP simples ou SSH). O segundo é rollback: se um upgrade quebra algo, você tem o binário da versão anterior salvo e reinstala em segundos com 'emerge --usepkg=y --oneshot =cat/pkg-versão-antiga'.

Para casos pontuais, existe o 'quickpkg': pega um pacote já instalado e gera o tarball binário sem recompilar. Útil para fazer snapshot antes de uma mudança arriscada (atualizar driver da NVIDIA, por exemplo). O comando é simples: 'quickpkg --include-config=y x11-drivers/nvidia-drivers'.`,
    codes: [
      { lang: "conf", code: `# /etc/portage/make.conf — gerar binpkg de TUDO que compilar.
FEATURES="\${FEATURES} buildpkg"

# Diretório padrão (pode mudar):
PKGDIR="/var/cache/binpkgs"

# Para compressão (xz é menor mas mais lento; zstd recomendado):
BINPKG_COMPRESS="zstd"
BINPKG_COMPRESS_FLAGS="-3"
BINPKG_FORMAT="gpkg"   # formato moderno assinável (Gentoo 2024+)` },
      { lang: "bash", code: `# Gerar binpkg de algo já instalado, sem recompilar:
sudo quickpkg --include-config=y x11-drivers/nvidia-drivers
# Saída: /var/cache/binpkgs/x11-drivers/nvidia-drivers-...gpkg.tar

# Gerar binpkg de TODO o sistema (snapshot completo):
sudo quickpkg --include-config=y "*/*"
# Resultado: /var/cache/binpkgs/ com cópia do mundo inteiro.` },
      { lang: "bash", code: `# Listar binpkgs disponíveis:
ls /var/cache/binpkgs/*/*

# Reinstalar versão antiga a partir de binário:
sudo emerge --ask --usepkgonly =x11-drivers/nvidia-drivers-535.154.05

# Gerar relatório do que está em cache:
emerge --usepkgonly --pretend --update --deep @world` },
      { lang: "bash", code: `# Servir os binpkgs locais para outras máquinas (HTTP simples):
sudo emerge --ask www-servers/lighttpd
# Configure DocumentRoot apontando para /var/cache/binpkgs

# Nas outras máquinas, /etc/portage/binrepos.conf/local.conf:
# [local]
# priority = 100
# sync-uri = http://servidor.lan/binpkgs/` },
      { lang: "bash", code: `# Limpar binpkgs antigos (acumulam rápido):
sudo eclean-pkg --deep
# 'deep' remove binpkgs de versões que não estão mais no world.

# Manter só as 2 últimas versões de cada:
sudo eclean-pkg -n 2` },
    ],
    points: [
      "FEATURES='buildpkg' gera binpkg de cada compilação automaticamente.",
      "Use BINPKG_FORMAT='gpkg' (formato moderno, assinável, default em 2024+).",
      "BINPKG_COMPRESS='zstd' é o melhor equilíbrio entre tamanho e velocidade.",
      "quickpkg empacota algo JÁ instalado, sem recompilar — ideal para snapshot.",
      "Sirva /var/cache/binpkgs via HTTP para abastecer outras máquinas da rede.",
      "Use 'eclean-pkg --deep' periodicamente para não acumular gigabytes.",
      "Armadilha comum: quickpkg sem --include-config perde sua /etc customizada.",
      "Iniciante comum: gerar binpkg em uma máquina e tentar usar em CPU incompatível.",
    ],
    alerts: [
      { type: "tip", content: "Antes de upgrades grandes (kernel, gcc, glibc), rode 'quickpkg --include-config=y \"*/*\"' para snapshot total. Se algo quebrar, você reverte em minutos." },
      { type: "info", content: "O formato gpkg substitui o antigo XPAK/tbz2 e suporta assinatura GPG. É o que o binhost oficial usa. Migre se ainda estiver no formato antigo." },
      { type: "warning", content: "Binpkgs ocupam espaço. Em uma máquina ativa, /var/cache/binpkgs facilmente passa de 20GB se você nunca limpar. Configure cron para 'eclean-pkg' mensal." },
      { type: "success", content: "Combinar buildpkg local + binhost remoto + ccache cria a configuração ideal: você baixa o que existe pronto, compila o resto uma vez só e ainda gera binário próprio para próximas máquinas." },
    ],
  },
  {
    slug: "gcc-versions",
    section: "otimizacao",
    title: "Múltiplas versões de GCC convivendo",
    difficulty: "intermediario",
    subtitle: "Como o Gentoo permite ter GCC 12 e GCC 13 instalados ao mesmo tempo.",
    intro: `O Gentoo trata o GCC como um pacote 'slot-aware': cada versão major (12, 13, 14) ocupa um slot próprio em '/usr/lib/gcc/x86_64-pc-linux-gnu/' e não conflita com as outras. Isso é fundamental porque atualizar de uma major para outra (digamos 12 → 13) traz mudanças de ABI sutis em C++ e novas otimizações que podem expor bugs antes silenciosos. Ter as duas versões disponíveis te permite fazer a transição com calma.

A ferramenta para alternar é o 'eselect gcc'. Você lista as versões instaladas, escolhe qual será a 'ativa' (a que respondem 'gcc' e 'g++' no PATH), e o eselect atualiza os symlinks correspondentes. Mudou? Rode 'env-update && source /etc/profile' (ou abra um novo shell) para o ambiente pegar as novas variáveis, especialmente a 'PATH' e a 'LD_LIBRARY_PATH'.

Após qualquer troca de major do GCC, o ritual é: alternar com eselect, rebuilds críticos e checagem com 'revdep-rebuild' (do gentoolkit). Pacotes em C++ que linkavam contra 'libstdc++' do GCC anterior podem precisar de '@preserved-rebuild' para serem refeitos com a nova ABI. Sem esse passo, dá pra ver erros como 'undefined symbol: __cxa_pure_virtual' depois.`,
    codes: [
      { lang: "bash", code: `# Listar versões instaladas e qual está ativa:
eselect gcc list
# Saída:
# Available GCC profiles:
#   [1]   x86_64-pc-linux-gnu-12.3.1
#   [2]   x86_64-pc-linux-gnu-13.2.1 *
# O '*' marca a ativa.` },
      { lang: "bash", code: `# Trocar para a versão 1 (GCC 12):
sudo eselect gcc set 1

# Recarregar o ambiente — OBRIGATÓRIO:
sudo env-update
source /etc/profile

# Confirmar:
gcc --version
# Deve mostrar 12.3.1 agora.` },
      { lang: "bash", code: `# Instalar uma versão extra (ex: GCC 14):
sudo emerge --ask =sys-devel/gcc-14.2.0

# Após instalar, alternar:
sudo eselect gcc set 3
sudo env-update && source /etc/profile

# Manter ambas convivendo é normal e recomendado.` },
      { lang: "bash", code: `# Rebuilds OBRIGATÓRIOS após trocar major do GCC:
# 1) Reconstruir o que dependia de libstdc++ antiga:
sudo emerge --ask --oneshot sys-devel/libtool
sudo emerge --ask @preserved-rebuild

# 2) Verificar bibliotecas órfãs:
sudo revdep-rebuild --library 'libstdc++.so.6'

# 3) Em casos extremos:
sudo emerge --ask --emptytree --usepkg=n @world` },
      { lang: "bash", code: `# Limpar uma versão antiga depois de migrar com segurança:
sudo emerge --ask --depclean =sys-devel/gcc-12*
# OU desinstalar diretamente:
sudo emerge --ask --unmerge =sys-devel/gcc-12.3.1

# Confirme que nada depende dela com revdep-rebuild antes de remover.` },
    ],
    points: [
      "GCC no Gentoo usa slots: GCC 12, 13, 14 podem coexistir sem conflito.",
      "Use 'eselect gcc list' e 'eselect gcc set N' para trocar a versão ativa.",
      "Após trocar, sempre rode 'env-update && source /etc/profile'.",
      "Faça '@preserved-rebuild' depois de mudar major do GCC para refazer C++ libs.",
      "'revdep-rebuild --library libstdc++.so.6' caça binários ainda apontando para a versão velha.",
      "Mantenha a versão antiga instalada uma semana antes de remover, por garantia.",
      "Armadilha comum: trocar versão e esquecer 'env-update' — gcc continua aparentemente o velho.",
      "Iniciante comum: remover GCC antigo no mesmo dia da troca e quebrar pacotes ainda não recompilados.",
    ],
    alerts: [
      { type: "tip", content: "Antes de uma troca de GCC major, gere binpkgs do toolchain atual com quickpkg. Se algo der errado, você reverte sem ficar sem compilador." },
      { type: "warning", content: "Mudou GCC e o sistema reclama de 'undefined symbol' em C++? É @preserved-rebuild que faltou. Rode imediatamente, antes de dormir nessa cama." },
      { type: "info", content: "GCC novos costumam ter mais checks de segurança e podem rejeitar código antigo (por exemplo, declarações implícitas viraram erro no GCC 14). Algumas falhas de build após upgrade são corretas — o código está mesmo errado." },
      { type: "danger", content: "Nunca desinstale TODOS os GCC instalados. Sem compilador, você não consegue reinstalar nada. Se errar, recorra a binpkgs ou live ISO + chroot." },
    ],
  },
  {
    slug: "profile-guided",
    section: "otimizacao",
    title: "Profile-Guided builds avançados",
    difficulty: "avancado",
    subtitle: "Combinando PGO, BOLT e profiles do kernel para extrair tudo do hardware.",
    intro: `O capítulo de PGO mostrou o ciclo básico (instrumentar, executar, recompilar). Aqui aprofundamos as combinações realmente avançadas que distribuidoras usam em produção. A ideia central é que cada camada de profile-guided otimiza uma fase diferente: PGO atua no GCC durante a compilação, BOLT atua no binário final reorganizando blocos, e o kernel pode ainda receber profile-guided durante seu build via Clang.

Para chegar nessa combinação no Gentoo, três pré-requisitos: (1) Clang/LLVM moderno instalado em paralelo ao GCC ('sys-devel/clang' e 'sys-devel/llvm'); (2) BOLT funcional ('sys-devel/llvm-bolt' ou parte do llvm); (3) workloads automatizáveis para gerar profile reproduzível. Sem workload representativo, profile-guided vira loteria: você otimiza para um caminho que talvez nem exista na sua rotina.

O ganho composto é palpável apenas em cargas pesadas. Banco de dados (PostgreSQL, MariaDB), interpretadores (Python, Ruby), navegadores e o próprio kernel ficam mensuravelmente mais rápidos. Em pacotes leves de linha de comando, a diferença é dentro do ruído. Decida onde aplicar PGO/BOLT olhando 'qlop -tH' (tempo de build) versus o uso real (frequência e latência sentida).`,
    codes: [
      { lang: "bash", code: `# Instalar a stack LLVM/Clang/BOLT:
sudo emerge --ask sys-devel/clang sys-devel/lld sys-devel/llvm

# Ativar BOLT no kernel (se gentoo-sources >= 6.6 com patch):
# CONFIG_FUNCTION_TRACER=y
# CONFIG_BPF_KPROBE_OVERRIDE=y
# Use 'make menuconfig' para procurar BOLT support.` },
      { lang: "conf", code: `# /etc/portage/package.use/pgo
# Pacotes que se beneficiam mais com PGO+LTO:
www-client/firefox          pgo lto clang
mail-client/thunderbird     pgo lto clang
dev-lang/python             pgo lto
dev-db/mariadb              pgo
dev-lang/php                pgo lto` },
      { lang: "bash", code: `# Pipeline manual PGO+BOLT em uma aplicação custom:
# 1) Build instrumentado:
CFLAGS="-O2 -fprofile-generate=/tmp/prof" \\
  make -j$(nproc)

# 2) Workload realista (rodar testes reais):
./meu_app --benchmark < dados.txt

# 3) Build com profile + LTO:
CFLAGS="-O2 -flto -fprofile-use=/tmp/prof" \\
LDFLAGS="-flto" \\
  make -j$(nproc)

# 4) BOLT em cima:
perf record -e cycles:u -j any,u -- ./meu_app --workload
perf2bolt ./meu_app -p perf.data -o app.fdata
llvm-bolt ./meu_app -o ./meu_app.bolt -data=app.fdata \\
  -reorder-blocks=ext-tsp -reorder-functions=hfsort+ \\
  -split-functions -icf=1` },
      { lang: "bash", code: `# Kernel PGO com Clang (gentoo-sources + clang):
# Em /usr/src/linux:
make LLVM=1 clean
make LLVM=1 menuconfig
# Habilite: General setup → Profile Guided Optimization
make LLVM=1 -j$(nproc)

# Boote no kernel instrumentado, rode workload por algumas horas
# Depois recompile usando o profile coletado em /sys/kernel/...` },
      { lang: "bash", code: `# Medir o ganho REAL antes/depois (essencial):
# Use hyperfine para reprodutibilidade:
sudo emerge --ask app-benchmarks/hyperfine
hyperfine --warmup 3 './app-original' './app-pgo' './app-pgo-bolt'
# Saída comparativa em ms, com desvio padrão.` },
    ],
    points: [
      "PGO + LTO + BOLT compõem a stack mais agressiva de profile-guided em userland.",
      "Use Clang/LLD para PGO/BOLT mais robustos; GCC PGO funciona mas tem menos ferramentas.",
      "Workload representativo é a parte mais difícil — sem ele, PGO é placebo.",
      "Aplique em pacotes onde performance importa: navegadores, BDs, interpretadores.",
      "Kernel pode receber PGO via Clang; ganhos em cargas I/O e network bound.",
      "Sempre meça com hyperfine antes/depois — ganho menor que 5% pode ser ruído.",
      "Armadilha comum: aplicar PGO em CLI tools que rodam por 50ms — ganho é dentro da margem.",
      "Iniciante comum: confiar que 'pgo' USE flag faz tudo sem workload customizado (geralmente faz, mas ouça com ceticismo).",
    ],
    alerts: [
      { type: "info", content: "A Meta (Facebook) usa BOLT em produção em larga escala desde 2019. O ganho típico em servidores web foi 5-15% em throughput puro, sem mudar uma linha do código aplicacional." },
      { type: "tip", content: "Mantenha um diretório /var/cache/profiles versionado por workload. PGO é caro de gerar, então preserve os perfis para reuso após cada upgrade do app." },
      { type: "warning", content: "BOLT modifica binários após o link. Antivírus, integridade FS (IMA), e auditing podem reclamar. Em ambiente regulado, documente." },
      { type: "danger", content: "Não aplique PGO em sys-libs/glibc nem sys-devel/gcc sem expertise. Bug aqui torna sistema impossível de bootar. Mantenha sempre binpkg de fallback." },
    ],
  },
  {
    slug: "kernel-tuning",
    section: "otimizacao",
    title: "Tunando o kernel: sysctl e além",
    difficulty: "avancado",
    subtitle: "Os parâmetros do kernel que mudam latência, throughput e responsividade.",
    intro: `O kernel Linux expõe centenas de parâmetros ajustáveis em tempo de execução via 'sysctl' (interface para '/proc/sys/'). A maioria tem default conservador, projetado para não quebrar nada em hardware antigo. Em desktops modernos com SSD e RAM abundante, ajustar alguns desses parâmetros pode dar sensação real de fluidez (latência mais baixa em swap, network throughput maior, menos stutter sob carga).

Os parâmetros vivem em '/etc/sysctl.conf' (legado) ou em arquivos individuais em '/etc/sysctl.d/'. O caminho moderno é colocar arquivos numerados (10-network.conf, 20-vm.conf) na pasta, que o systemd ou OpenRC carrega no boot. Para aplicar sem reboot, 'sysctl --system' relê tudo. Para mudar um parâmetro só, 'sysctl -w vm.swappiness=10'.

Os ajustes clássicos: 'vm.swappiness' (quanto o kernel prefere swap vs cache, 60 default → 10 em desktop com SSD), 'vm.dirty_ratio'/'dirty_background_ratio' (quanto da RAM pode estar 'sujo' aguardando flush, default agressivo demais para SSD lento), e parâmetros de rede como 'net.core.rmem_max' e 'net.ipv4.tcp_congestion_control=bbr' (BBR é o algoritmo do Google, geralmente melhor que cubic em redes modernas).`,
    codes: [
      { lang: "conf", code: `# /etc/sysctl.d/99-desktop.conf — tuning desktop com SSD e 16GB+ RAM.
# Memória virtual:
vm.swappiness = 10
vm.vfs_cache_pressure = 50
vm.dirty_background_ratio = 5
vm.dirty_ratio = 10

# Rede (TCP moderno):
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216

# Filesystem:
fs.inotify.max_user_watches = 524288` },
      { lang: "bash", code: `# Aplicar sem reboot:
sudo sysctl --system

# Verificar valor atual de um parâmetro:
sysctl vm.swappiness
# Saída: vm.swappiness = 10

# Mudar temporariamente (até próximo boot):
sudo sysctl -w vm.swappiness=20` },
      { lang: "conf", code: `# /etc/sysctl.d/10-server.conf — tuning servidor web alto tráfego.
net.core.somaxconn = 4096
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15
net.ipv4.ip_local_port_range = 1024 65535

# File descriptors:
fs.file-max = 2097152` },
      { lang: "bash", code: `# Habilitar BBR exige módulo no kernel (ou builtin):
# CONFIG_TCP_CONG_BBR=m  ou  =y no .config
# Carregar manualmente para teste:
sudo modprobe tcp_bbr
sysctl net.ipv4.tcp_available_congestion_control
# Saída deve listar 'bbr' entre as opções.

# Tornar persistente:
echo 'tcp_bbr' | sudo tee /etc/modules-load.d/bbr.conf` },
      { lang: "bash", code: `# Tunar I/O scheduler do disco (NVMe quase sempre 'none' já):
cat /sys/block/nvme0n1/queue/scheduler
# Saída: [none] mq-deadline kyber bfq

# Para HDD em desktop, bfq é melhor que mq-deadline:
echo bfq | sudo tee /sys/block/sda/queue/scheduler
# Persistir via udev rule:
# /etc/udev/rules.d/60-ioschedulers.rules
# ACTION=="add|change", KERNEL=="sd[a-z]", ATTR{queue/rotational}=="1", ATTR{queue/scheduler}="bfq"` },
    ],
    points: [
      "sysctl ajusta parâmetros do kernel em runtime sem reboot.",
      "Use /etc/sysctl.d/*.conf (numerado) para configs persistentes e organizadas.",
      "vm.swappiness=10 em desktop SSD reduz uso desnecessário de swap.",
      "tcp_congestion_control=bbr melhora throughput em redes modernas vs cubic.",
      "vm.dirty_ratio menor (10) reduz stuttering em escritas grandes.",
      "I/O scheduler bfq é o melhor para HDD/SSD com latência mista; nvme usa 'none'.",
      "Armadilha comum: copiar sysctl 'extremo' de blog e travar máquina (vm.overcommit_memory=2 sem sentido).",
      "Iniciante comum: editar /etc/sysctl.conf e não rodar 'sysctl --system' depois.",
    ],
    alerts: [
      { type: "tip", content: "Antes de qualquer ajuste, salve o valor atual: 'sysctl vm.swappiness > /tmp/old'. Se algo piorar, você reverte sabendo o original." },
      { type: "info", content: "BBR está disponível desde o kernel 4.9 e é usado por Google nos próprios servidores. Gentoo facilita habilitar — basta CONFIG_TCP_CONG_BBR no .config do kernel." },
      { type: "warning", content: "Ajustes de rede agressivos podem tornar o sistema vulnerável a ataques (SYN flood). Em servidor exposto à internet, valide com fail2ban e firewall antes de afrouxar limites." },
      { type: "danger", content: "Nunca defina vm.swappiness=0 a menos que entenda OOM killer. Sob pressão de memória, sem swap, processos arbitrários morrem — incluindo seu shell." },
    ],
  },
  {
    slug: "ssd-trim",
    section: "otimizacao",
    title: "TRIM e otimização de SSD",
    difficulty: "intermediario",
    subtitle: "Mantenha seu SSD rápido e durável usando TRIM corretamente.",
    intro: `SSDs (incluindo NVMe) precisam que o sistema operacional avise quais blocos estão livres, para que o controlador interno possa apagá-los em background e ter páginas limpas prontas para escrita. Esse aviso é o comando 'TRIM' (ATA) ou 'UNMAP' (SCSI/NVMe). Sem TRIM, o SSD vai gradualmente desacelerando porque o controlador precisa ler-apagar-escrever em vez de só escrever.

Há duas formas de fazer TRIM no Linux: 'continuous' (a flag 'discard' no '/etc/fstab' faz TRIM toda vez que um arquivo é deletado) ou 'periodic' (rodar 'fstrim' uma vez por semana via timer). A recomendação atual é 'periodic'. O continuous discard tem custo de I/O em cada delete e pode causar latência inesperada; o periodic concentra o trabalho em momento ocioso.

No Gentoo, com systemd, basta habilitar 'fstrim.timer'. Com OpenRC, você cria um cron job semanal. Existe ainda o 'discard=async' (kernel 5.6+, btrfs e ext4) que é um híbrido inteligente: o filesystem agrupa requests de discard e manda em batch sem bloquear deletes individuais. É o melhor dos dois mundos.`,
    codes: [
      { lang: "bash", code: `# Verificar se o SSD suporta TRIM:
sudo hdparm -I /dev/sda | grep -i trim
# Para NVMe:
sudo nvme id-ctrl /dev/nvme0n1 -H | grep -i discard

# Verificar se a partição/FS tem discard habilitado:
mount | grep discard
findmnt -no OPTIONS /` },
      { lang: "conf", code: `# /etc/fstab — recomendação MODERNA: discard=async no btrfs, e nada no ext4.
# Use fstrim.timer para periodic em vez de discard contínuo.

# Btrfs (kernel 5.6+):
UUID=xxxx /     btrfs  defaults,noatime,compress=zstd,ssd,discard=async  0 0

# Ext4 (sem 'discard', usar fstrim periodic):
UUID=yyyy /home ext4   defaults,noatime  0 2

# XFS:
UUID=zzzz /var  xfs    defaults,noatime  0 2` },
      { lang: "bash", code: `# Rodar TRIM manualmente (vê quanto espaço foi liberado):
sudo fstrim -v /
# Saída: /: 12.4 GiB (13316231168 bytes) trimmed

# Em todas as partições montadas:
sudo fstrim -av` },
      { lang: "bash", code: `# Habilitar fstrim.timer no systemd:
sudo systemctl enable --now fstrim.timer
systemctl status fstrim.timer
# Roda semanalmente por padrão.

# Para OpenRC, criar cron semanal:
sudo emerge --ask sys-process/cronie
sudo rc-update add cronie default
echo '0 3 * * 0 /usr/sbin/fstrim -av' | sudo tee /etc/cron.d/fstrim` },
      { lang: "bash", code: `# Verificar saúde geral do SSD (smartmontools):
sudo emerge --ask sys-apps/smartmontools
sudo smartctl -a /dev/sda | grep -E 'Wear|Power_On|Reallocated'
# Para NVMe:
sudo smartctl -a /dev/nvme0n1 | grep -E 'Percentage Used|Power On'
# 'Percentage Used' = quanto do TBW oficial você consumiu.` },
    ],
    points: [
      "TRIM avisa o SSD quais blocos estão livres, mantendo escrita rápida.",
      "Prefira fstrim periodic (semanal) ao discard contínuo no fstab.",
      "Em btrfs use 'discard=async' (kernel 5.6+) — combina o melhor dos dois.",
      "fstrim.timer (systemd) ou cron semanal (OpenRC) cobrem o caso típico.",
      "Use smartctl para monitorar 'Percentage Used' do NVMe.",
      "noatime no fstab evita escrita a cada leitura — economiza ciclos do SSD.",
      "Armadilha comum: ativar 'discard' no fstab e culpar I/O lento sem entender o porquê.",
      "Iniciante comum: rodar fstrim em USB stick ou SD card e confundir resultados.",
    ],
    alerts: [
      { type: "tip", content: "Em distros novas (2024+), fstrim.timer já vem habilitado por default. Confira com 'systemctl is-enabled fstrim.timer' antes de configurar manualmente." },
      { type: "warning", content: "Não habilite 'discard' em SSDs antigos com firmware buggy (alguns Samsung 8xx série). O comando TRIM podia causar corrupção. Atualize firmware ou use fstrim periodic." },
      { type: "info", content: "SSDs NVMe modernos têm garbage collection tão eficiente que o impacto de TRIM é menor que em SATA. Mas continua valendo: o filesystem fica mais previsível para o controlador." },
      { type: "danger", content: "Nunca rode fstrim sobre snapshot LVM ou RAID sem TRIM passthrough configurado. Pode TRIMar dados que ainda estão referenciados em snapshot — perda permanente." },
    ],
  },
  {
    slug: "swap-zram",
    section: "otimizacao",
    title: "Swap, swapfile e zram",
    difficulty: "intermediario",
    subtitle: "Como dar ao kernel margem de respiração sem matar a vida útil do SSD.",
    intro: `Swap é a área que o kernel usa quando a RAM acaba: páginas pouco usadas são gravadas em disco para liberar memória física. Por décadas a regra foi 'partição swap = 2x RAM'. Hoje, com 16-64GB de RAM no desktop, isso é absurdo. A nova regra: swap pequeno (4-8GB) só para hibernação ou margem em picos, geralmente em swapfile (mais flexível que partição).

Mais importante que tamanho é a estratégia. 'zram' (sys-block/zram-init) cria uma área de 'swap' comprimida em RAM. Páginas raramente usadas vão pra zram comprimidas (zstd ou lzo), ocupando 2-4x menos espaço. O efeito prático: você ganha 'RAM virtual' sem tocar no disco, sem desgastar SSD, com latência muito menor que swap em disco. É padrão hoje em ChromeOS, Fedora, Ubuntu.

O setup ideal em 2024 para desktop com 16GB RAM e SSD: 8GB de zram (com zstd, equivalente a ~24GB efetivos comprimidos) + um swapfile pequeno de 4GB no SSD para casos raros de OOM extremo. 'vm.swappiness=100' pode ser usado AGORA, porque o swap principal é a zram em RAM e não tem custo de disco.`,
    codes: [
      { lang: "bash", code: `# Criar swapfile moderno em vez de partição:
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Persistir no fstab:
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verificar:
swapon --show
free -h` },
      { lang: "bash", code: `# zram via sys-block/zram-init (caminho Gentoo nativo):
sudo emerge --ask sys-block/zram-init

# Configurar /etc/conf.d/zram-init:
# load_on_start=yes
# num_devices=1
# type0=swap
# size0=8192     # 8GB em RAM, comprime para ~24GB úteis
# algo0=zstd
# prio0=32767    # alta prioridade (usa antes do swapfile)

sudo rc-update add zram-init boot
sudo rc-service zram-init start` },
      { lang: "bash", code: `# Conferir que zram está ativo e com prioridade alta:
swapon --show
# Saída esperada:
# NAME       TYPE      SIZE USED PRIO
# /dev/zram0 partition   8G   0B 32767
# /swapfile  file        4G   0B    -2

# zramctl mostra detalhes (compressão, algoritmo):
zramctl
# /dev/zram0  zstd  8G  1.2G  340M  410M  4 [SWAP]` },
      { lang: "conf", code: `# /etc/sysctl.d/30-zram.conf — agora pode aumentar swappiness.
# Como o swap principal é em RAM (zram), incentivar uso é OK.
vm.swappiness = 100
vm.page-cluster = 0   # zram é 'aleatório', não vale ler em cluster
vm.watermark_boost_factor = 0
vm.watermark_scale_factor = 125` },
      { lang: "bash", code: `# Hibernação requer swap em DISCO (não em zram).
# Tamanho mínimo recomendado para hibernar: tamanho da RAM + 25%.
# Para 16GB de RAM, swapfile de 20GB:
sudo swapoff /swapfile
sudo rm /swapfile
sudo fallocate -l 20G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
# Configure resume= no kernel cmdline para usar.` },
    ],
    points: [
      "Swap moderno: swapfile (não partição) para flexibilidade.",
      "zram cria 'swap em RAM comprimida' — ganho de memória efetiva sem I/O em disco.",
      "Use sys-block/zram-init para configurar zram persistente no Gentoo.",
      "zstd dá melhor compressão; lzo é mais rápido mas comprime menos.",
      "Com zram, vm.swappiness=100 faz sentido (não desgasta disco).",
      "Hibernação ainda exige swap em disco do tamanho da RAM (não usa zram).",
      "Armadilha comum: criar zram do tamanho TOTAL da RAM e travar o sistema.",
      "Iniciante comum: manter partição swap de 32GB em SSD novo — desperdício de espaço e ciclos.",
    ],
    alerts: [
      { type: "tip", content: "Bom dimensionamento de zram: 50% da RAM física. Em 16GB RAM, configure 8GB de zram. Comprimido com zstd, equivale a ~24GB de espaço útil de páginas." },
      { type: "info", content: "Distribuições como Fedora e Ubuntu vêm com zram-generator habilitado por default desde 2021/2022. No Gentoo você decide; o caminho via sys-block/zram-init é o mais limpo." },
      { type: "warning", content: "Tirar todo o swap de disco e deixar só zram impede hibernação para disco. Se você usa suspend-to-disk, mantenha um swapfile RAM-sized." },
      { type: "danger", content: "Não monte zram em /tmp ou em filesystem persistente. zram é volátil — desliga ao reboot. Para tmpfs persistente use zswap (cache, não 'storage'), não zram." },
    ],
  },
  {
    slug: "monitoring",
    section: "otimizacao",
    title: "Monitorando recursos e tempo de build",
    difficulty: "intermediario",
    subtitle: "As ferramentas que mostram o que está acontecendo dentro do sistema.",
    intro: `Otimizar sem medir é loteria. O Gentoo dá acesso facilitado a um arsenal de monitoramento: 'htop' e 'btop' para CPU/RAM em tempo real, 'iotop' para I/O por processo, 'nethogs' para banda por processo, 'glances' para visão consolidada, 'qlop' (do gentoolkit) para histórico de tempos de build. Cada ferramenta responde uma pergunta diferente.

A análise mais reveladora no Gentoo é 'qlop -tH'. Ele lê '/var/log/emerge.log' e mostra o tempo de cada compilação histórica. Você descobre que firefox levou 2h, libreoffice 4h, e que aquele kernel custou 12 minutos. Cruzando isso com seu hardware, decide onde gastar esforço de tuning (ccache, distcc, binhost) e onde aceitar.

Para análise mais profunda existe o 'perf' (sys-process/perf), que faz sampling em hardware counters: ciclos, cache misses, branch misses por função. Combinado com flame graphs, mostra exatamente onde o tempo é gasto em produção. É o tipo de ferramenta que, depois que você aprende, não consegue mais viver sem.`,
    codes: [
      { lang: "bash", code: `# Instalar a suíte essencial de monitoramento:
sudo emerge --ask \\
  sys-process/htop \\
  sys-process/btop \\
  sys-process/iotop \\
  net-analyzer/nethogs \\
  app-portage/gentoolkit \\
  app-portage/eix

# qlop, equery, eix vêm do gentoolkit/eix.` },
      { lang: "bash", code: `# Ver tempos de compilação dos seus pacotes:
qlop -tH
# Saída exemplo:
# www-client/firefox: 1h 47min
# app-office/libreoffice: 4h 12min
# sys-kernel/gentoo-sources: 3min

# Top 10 mais lentos:
qlop -tH | sort -t: -k2 -h | tail -10

# Tempo médio de um pacote específico (várias atualizações):
qlop -tHa www-client/firefox` },
      { lang: "bash", code: `# Monitorar build em tempo real:
# Em um terminal:
sudo emerge --ask www-client/firefox
# Em outro terminal:
htop -F firefox     # filtra por nome
iotop -oP           # mostra apenas processos com I/O ativo
btop                # visão consolidada moderna` },
      { lang: "bash", code: `# Análise profunda com perf:
sudo emerge --ask sys-process/perf

# Sampling de uma aplicação rodando:
sudo perf record -F 99 -p $(pidof firefox) -g -- sleep 30
sudo perf report
# Mostra hot functions com porcentagem de tempo.

# Estatísticas sumárias:
sudo perf stat -e cycles,instructions,cache-misses ./meu_app` },
      { lang: "bash", code: `# Visão sistêmica (glances):
sudo emerge --ask app-admin/glances
glances
# Mostra CPU, RAM, disco, rede, processos, sensores em uma tela só.

# Para servidor headless via web:
glances -w
# Acesse http://localhost:61208

# nmon — interativo TUI antigo mas excelente:
sudo emerge --ask app-admin/nmon
nmon` },
    ],
    points: [
      "qlop -tH revela tempo histórico de cada compilação — base para decidir onde otimizar.",
      "htop/btop para CPU/RAM em tempo real; btop é o mais bonito e moderno.",
      "iotop -oP mostra só quem está fazendo I/O ativo (esconde idle).",
      "nethogs para descobrir qual processo está consumindo banda.",
      "glances dá visão consolidada com modo web embutido (-w).",
      "perf é o canivete suíço do profiling — hardware counters reais.",
      "Armadilha comum: olhar uptime e 'load average' sem entender que é fila, não percentual de uso.",
      "Iniciante comum: confundir CPU em iowait (esperando disco) com CPU ocupada de verdade.",
    ],
    alerts: [
      { type: "tip", content: "Crie um alias 'alias buildtimes=\"qlop -tH | sort -t: -k2 -h | tail -20\"'. Roda em segundos e é o melhor mapa de onde vale gastar tuning." },
      { type: "info", content: "btop substitui htop em quase tudo: GPU monitoring, gráficos UTF-8, mouse, temas. Vale instalar e adotar como padrão. Tem builds quase 1MB e é responsivo até em SSH." },
      { type: "success", content: "Combine qlop + ccache + binhost: identifique o pacote mais caro do mês, ative cache/binário pra ele, repita. Em 3-4 ciclos você corta 80% do tempo de @world." },
      { type: "warning", content: "perf record pode gerar arquivos grandes (perf.data com gigabytes em sessões longas). Limite tempo com 'sleep N' e use frequências razoáveis (-F 99 é seguro)." },
    ],
  },
];
