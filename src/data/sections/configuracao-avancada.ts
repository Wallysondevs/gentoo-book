import type { Chapter } from "../types";

export const chapters: Chapter[] = [
  {
    slug: "use-flags-pratica",
    section: "configuracao-avancada",
    title: "USE flags na prática: globais, locais e USE_EXPAND",
    difficulty: "intermediario",
    subtitle: "Como decidir o que entra (e o que NÃO entra) em cada pacote do seu sistema.",
    intro: `USE flag é uma das ideias centrais do Gentoo. Pense numa USE flag como um botão liga/desliga que diz a um pacote 'compile com suporte a X' ou 'compile sem suporte a Y'. Em distribuições binárias o mantenedor decide por você e empacota tudo junto; no Gentoo você é quem decide, e o Portage usa essa decisão para escolher quais dependências puxar e quais trechos de código compilar.

Há dois lugares principais onde uma USE flag pode ser definida: globalmente, em '/etc/portage/make.conf' (vale para todo pacote que aceitar aquela flag), e por pacote, em '/etc/portage/package.use/' (vale só para o pacote alvo). Existe ainda uma terceira família, as USE_EXPAND, que agrupam categorias inteiras de flags relacionadas: VIDEO_CARDS, INPUT_DEVICES, L10N (idiomas), CPU_FLAGS_X86, ABI_X86, entre outras. Elas são USE flags por baixo, mas com prefixo automático, evitando que você escreva 'video_cards_intel' à mão.

Neste capítulo você aprende a inspecionar quais flags um pacote suporta, a decidir se uma flag merece ser global ou local, a usar USE_EXPAND corretamente para vídeo e idiomas, e a forçar o Portage a refazer pacotes que mudaram de USE com '--newuse'. Sem dominar isso, qualquer 'emerge -auDN @world' vira loteria.`,
    codes: [
      { lang: "bash", code: `# Listar TODAS as USE flags suportadas por um pacote (com descrição):
equery uses media-video/ffmpeg
# Saída resumida (+ ativada, - desativada, U = pelo perfil):
# [ Legend : U - flag is set in make.conf       ]
#  + + x264    : Enable H.264 encoding
#  - - vulkan  : Vulkan video acceleration
#  + U opus    : Opus audio codec` },
      { lang: "ini", code: `# /etc/portage/make.conf — USE GLOBAL aplica-se a TODOS os pacotes.
# Use só para flags que você quer 'em todo lugar onde fizer sentido'.
USE="X wayland pulseaudio pipewire alsa bluetooth nls icu \\
     vaapi vulkan opengl jpeg png gif svg ssl \\
     -systemd -gnome -kde -ipv6"
# O '-' na frente DESLIGA a flag mesmo se o profile a ligar.` },
      { lang: "conf", code: `# /etc/portage/package.use/ffmpeg — USE LOCAL, vale só para ffmpeg.
# Cada linha: <pacote> <flag> <flag> ...
media-video/ffmpeg x264 x265 vpx aom opus webp svg
media-video/ffmpeg -doc -test
# Você pode usar globs: '*/* -doc' desliga 'doc' em tudo.` },
      { lang: "ini", code: `# USE_EXPAND: agrupam famílias de flags relacionadas.
# No make.conf, em vez de 'video_cards_intel', escreva:
VIDEO_CARDS="intel iris"          # vira USE=video_cards_intel video_cards_iris
INPUT_DEVICES="libinput"
L10N="pt-BR en"                   # localizações do sistema
ACCEPT_KEYWORDS="amd64"
CPU_FLAGS_X86="aes avx avx2 mmx popcnt sse sse2 sse3 sse4_1 sse4_2 ssse3"` },
      { lang: "bash", code: `# Detectar CPU_FLAGS_X86 automaticamente (ferramenta oficial):
emerge --ask app-portage/cpuid2cpuflags
cpuid2cpuflags
# Saída: CPU_FLAGS_X86: aes avx avx2 f16c fma3 mmx mmxext pclmul popcnt sse sse2 sse3 sse4_1 sse4_2 ssse3
# Copie a linha para o /etc/portage/make.conf.` },
      { lang: "bash", code: `# Depois de qualquer mudança de USE, reconstrua o que mudou:
sudo emerge --ask --update --deep --newuse @world
# A flag --newuse (-N) faz o Portage detectar mudanças de USE e
# recompilar só os pacotes afetados. SEM ela, mudanças não pegam.` },
    ],
    points: [
      "USE em make.conf é global; em package.use é por pacote — o local sempre vence o global.",
      "Use 'equery uses <pacote>' para descobrir quais flags existem antes de adivinhar.",
      "USE_EXPAND como VIDEO_CARDS e L10N evitam erro de digitação e ficam mais legíveis.",
      "CPU_FLAGS_X86 deve ser gerado por 'cpuid2cpuflags' — não copie de tutoriais aleatórios.",
      "Sempre rode 'emerge -auDN @world' depois de mexer em USE — sem '--newuse' nada acontece.",
      "Prefixe com '-' para desligar uma flag herdada do profile (ex.: '-systemd').",
      "Armadilha comum: pôr USE=systemd em sistema OpenRC e quebrar dezenas de pacotes.",
      "Iniciante comum: editar make.conf e esquecer do '--newuse', depois reclamar que não funcionou.",
    ],
    alerts: [
      { type: "tip", content: "Antes de adicionar uma flag global, pergunte: 'eu quero isso em TODOS os pacotes?'. Se não, vá direto para package.use — fica mais limpo e mais fácil de manter." },
      { type: "warning", content: "Mudar USE=multilib ou ABI_X86 depois do sistema instalado é doloroso: praticamente todo o toolchain precisa ser recompilado. Decida cedo." },
      { type: "info", content: "O perfil ('eselect profile') já vem com um conjunto enorme de USE flags ativadas/desativadas. Veja com 'emerge --info | grep ^USE' o conjunto efetivo." },
      { type: "danger", content: "Não faça 'USE=\"\"' (vazio) ou 'USE=\"-*\"' achando que vai 'limpar' o sistema. Você desliga até flags que o profile precisa e quebra coisas básicas." },
    ],
  },
  {
    slug: "package-use",
    section: "configuracao-avancada",
    title: "package.use como diretório: organizando configs por pacote",
    difficulty: "intermediario",
    subtitle: "De arquivo único a uma pasta organizada com um arquivo por área do sistema.",
    intro: `Nas primeiras versões do Gentoo, '/etc/portage/package.use' era um único arquivo de texto. Quem configura várias áreas do sistema (KDE, Wayland, multimídia, dev) acabava com um arquivão de centenas de linhas, impossível de manter. Por isso, há muitos anos, o Portage aceita 'package.use' como DIRETÓRIO: você cria a pasta e dentro dela coloca quantos arquivos quiser, com qualquer nome. O Portage lê todos.

A regra é simples: o Portage trata cada arquivo dentro do diretório como se fosse parte do mesmo conjunto. Isso permite organizar por tema (kde.use, wayland.use, dev.use, multimedia.use), por origem ('00-base', '10-desktop', '99-overrides') ou por máquina. Iniciantes que vêm de '/etc/sudoers.d' ou '/etc/yum.repos.d' já reconhecem o padrão.

A sintaxe dentro de cada arquivo é a clássica: 'átomo flag1 flag2 -flag3'. Você pode usar versões ('=kde-plasma/plasma-meta-6.1*'), faixas ('>=app-editors/vim-9'), e globs ('*/* -test'). Vamos ver exemplos reais para KDE/Wayland, dev (ferramentas com extras de doc/test) e como descobrir o que falta quando o Portage reclama.`,
    codes: [
      { lang: "bash", code: `# Converter o arquivo único em diretório (caso ainda use o formato antigo):
sudo mv /etc/portage/package.use /etc/portage/package.use.old
sudo mkdir /etc/portage/package.use
sudo mv /etc/portage/package.use.old /etc/portage/package.use/00-legacy` },
      { lang: "conf", code: `# /etc/portage/package.use/10-kde-plasma
# Tudo do KDE em um lugar só. Dá pra reler em 30 segundos.
kde-plasma/plasma-meta wayland -gtk
kde-plasma/plasma-workspace wayland systemd
media-libs/phonon vlc -gstreamer
kde-apps/dolphin samba` },
      { lang: "conf", code: `# /etc/portage/package.use/20-multimedia
# Codecs e drivers de mídia. Note o uso de versões mínimas.
media-video/ffmpeg x264 x265 vpx aom opus webp svg vaapi vdpau vulkan
media-video/mpv vaapi vdpau vulkan wayland
media-libs/mesa vulkan video_cards_intel video_cards_iris zink
>=media-sound/pipewire-1.0 pipewire-alsa sound-server bluetooth` },
      { lang: "conf", code: `# /etc/portage/package.use/99-no-test-no-doc
# Boa prática: desligar 'test' e 'doc' em tudo (economiza horas de build).
*/* -test -doc -examples` },
      { lang: "bash", code: `# Quando o Portage reclamar 'The following USE changes are necessary',
# rode com --autounmask-write e depois aplique:
sudo emerge --ask --autounmask-write app-editors/neovim
# O Portage grava sugestões em /etc/portage/package.use/zz-autounmask
sudo dispatch-conf
# Aceite com 'u' (use new) e refaça o emerge.` },
      { lang: "bash", code: `# Conferir qual valor de USE acabou efetivamente aplicado a um pacote:
emerge --pretend --verbose app-editors/vim
# Saída inclui: USE="acl nls -X -gtk -python (-selinux)"
# Parênteses indicam flags forçadas pelo profile.` },
    ],
    points: [
      "Transforme package.use em diretório o quanto antes; vai usar para sempre.",
      "Nomeie arquivos por TEMA (kde, wayland, dev), nunca por pacote — fica mais fácil revisar.",
      "Use prefixos numéricos (00, 10, 99) se quiser controlar a ordem de leitura.",
      "Globs '*/* -test -doc' ligados em um arquivo separado economizam tempo de build em massa.",
      "'--autounmask-write' + 'dispatch-conf' resolvem 80% dos pedidos de 'USE necessária'.",
      "Use 'emerge -pv <pacote>' antes de instalar para ver qual USE efetivamente vai entrar.",
      "Armadilha comum: declarar a mesma flag em dois arquivos com valores conflitantes; o último lido ganha.",
      "Iniciante comum: deixar configurações de testes (~amd64) misturadas com USE no mesmo arquivo.",
    ],
    alerts: [
      { type: "tip", content: "Versione o '/etc/portage' inteiro com git. É pequeno, muda pouco e te dá histórico das suas decisões e dos rollbacks quando algo quebra." },
      { type: "info", content: "Arquivos começando com '.' são ignorados, e o Portage NÃO entra em subdiretórios. A pasta é plana." },
      { type: "warning", content: "O autounmask-write pode sugerir mudanças surpreendentes (testing em pacotes críticos). Sempre LEIA antes de aceitar com dispatch-conf." },
    ],
  },
  {
    slug: "package-accept-keywords",
    section: "configuracao-avancada",
    title: "package.accept_keywords: misturando stable e testing",
    difficulty: "intermediario",
    subtitle: "Como liberar a versão testing de um pacote sem virar a chave para o sistema todo.",
    intro: `No Gentoo, cada versão de cada pacote tem um 'keyword' que indica seu nível de estabilidade por arquitetura. 'amd64' (sem til) significa estável em amd64; '~amd64' (com til) significa testing — funcional, mas ainda não chancelado pelo time de QA. Por padrão, o ACCEPT_KEYWORDS do seu sistema é só 'amd64', então só versões estáveis são candidatas.

O problema é que, na prática, é comum querer só UM pacote em testing: uma versão recém-lançada do Firefox, um KDE Plasma novo, um driver gráfico mais atual. Mudar 'ACCEPT_KEYWORDS=\"~amd64\"' globalmente trocaria seu sistema inteiro para o ramo testing — não é o que você quer. Para isso existe '/etc/portage/package.accept_keywords' (note o sublinhado), também aceito como diretório, onde você libera testing pacote por pacote.

A sintaxe é parecida com package.use, mas o segundo campo é um keyword. Você também pode liberar uma versão específica ('=cat/pkg-X.Y') ou abrir tudo do pacote ('cat/pkg ~amd64'). Em casos extremos existe '**' que aceita até versões sem keyword nenhum (live ebuilds, snapshots de git) — use com cuidado, é a porta para builds quebrados.`,
    codes: [
      { lang: "conf", code: `# /etc/portage/package.accept_keywords/firefox
# Libera APENAS firefox em testing, o resto do sistema continua estável.
www-client/firefox ~amd64

# Liberar uma versão específica (recomendado quando puder):
=www-client/firefox-130.0 ~amd64` },
      { lang: "conf", code: `# /etc/portage/package.accept_keywords/desktop
# KDE Plasma 6 mais recente + apps relacionadas:
kde-plasma/plasma-meta ~amd64
kde-plasma/* ~amd64
kde-apps/dolphin ~amd64

# Cuidado: 'kde-plasma/* ~amd64' libera TUDO da categoria.` },
      { lang: "bash", code: `# Quando o Portage diz 'masked by: ~amd64 keyword', a saída sugere:
# === Use the following changes to your system to make it work:
# =www-client/firefox-130.0 ~amd64
# Você pode aplicar automaticamente:
sudo emerge --ask --autounmask-write www-client/firefox
sudo dispatch-conf      # aceite com 'u'
sudo emerge --ask www-client/firefox` },
      { lang: "conf", code: `# /etc/portage/package.accept_keywords/live
# Live ebuilds (versões 9999, sempre do git/HEAD) precisam de '**':
=app-editors/neovim-9999 **
=gui-wm/sway-9999 **
# Esses pacotes recompilam do master a cada 'emerge -uDN @world'.` },
      { lang: "ini", code: `# /etc/portage/make.conf — JAMAIS faça isso em produção:
# ACCEPT_KEYWORDS="~amd64"
# Isso vira TODO o sistema para testing. É o equivalente a usar
# Debian unstable como sistema diário. Possível, mas exige disciplina.` },
      { lang: "bash", code: `# Para listar quais pacotes do seu sistema estão em testing hoje:
equery list --portage-tree --installed | xargs -I{} \\
  sh -c 'equery meta {} 2>/dev/null | grep -l "^Keywords:.*~amd64"'
# Forma mais simples com eix:
eix --installed --testing` },
    ],
    points: [
      "Keyword 'amd64' = estável; '~amd64' = testing; sem keyword = quebrado/snapshot.",
      "Mude pacote por pacote em /etc/portage/package.accept_keywords, NUNCA o ACCEPT_KEYWORDS global.",
      "Pacotes '9999' (live ebuilds) exigem '**' e recompilam toda atualização.",
      "Sempre prefira liberar uma versão exata ('=cat/pkg-X.Y') a abrir o pacote inteiro.",
      "'--autounmask-write' + 'dispatch-conf' automatizam 90% dos pedidos de keyword.",
      "Misturar muito testing com estável pode criar conflitos de dependência insolúveis.",
      "Armadilha comum: deixar '~amd64' órfão (pacote desinstalado) acumulando no diretório.",
      "Iniciante comum: confundir 'package.accept_keywords' (com sublinhado) com 'package.keywords' (deprecado).",
    ],
    alerts: [
      { type: "warning", content: "Cada vez que você libera um pacote para testing, está assumindo papel de QA daquele pacote. Reporte bugs em bugs.gentoo.org se algo quebrar — é como o Gentoo se mantém saudável." },
      { type: "info", content: "Existe '/etc/portage/package.accept_keywords' como arquivo OU diretório. Diretório é o padrão moderno; sempre prefira." },
      { type: "tip", content: "Crie um arquivo 'zz-autounmask' separado: assim os ajustes feitos pelo --autounmask-write não bagunçam suas escolhas manuais." },
      { type: "danger", content: "Nunca rode 'echo \"*/* ~amd64\" > /etc/portage/package.accept_keywords/all' achando que resolve. Isso quebra o sistema em poucos updates." },
    ],
  },
  {
    slug: "package-mask",
    section: "configuracao-avancada",
    title: "package.mask e package.unmask: bloqueando versões problemáticas",
    difficulty: "intermediario",
    subtitle: "Como impedir o Portage de instalar uma versão específica que você sabe ser problemática.",
    intro: `Eventualmente uma versão de algum pacote chega ao Portage com um bug que afeta o seu caso de uso: um driver gráfico que perde a aceleração, uma biblioteca que muda ABI antes da hora, uma versão do Python que ainda não tem todas as suas dependências adaptadas. O Gentoo te dá duas alavancas: mascarar uma versão para que ela nunca seja escolhida ('/etc/portage/package.mask') e desmascarar uma versão que o time do Gentoo mascarou globalmente ('/etc/portage/package.unmask').

A sintaxe usa OPERADORES DE VERSÃO, herdados das EAPI dos ebuilds: '=' (versão exata), '<' (anterior a), '<=' (anterior ou igual), '>' (posterior a), '>=' (posterior ou igual), '~' (qualquer revisão da mesma versão base, ex.: ~cat/pkg-1.2.3). Combinados, dão controle muito fino. Você pode mascarar 'tudo a partir de 5.0' ou 'tudo entre 4.5 e 4.7'.

Existe também o mascaramento global feito pelos devs Gentoo em '/var/db/repos/gentoo/profiles/package.mask'. Você não edita esse arquivo (ele é sobrescrito a cada sync), mas pode neutralizá-lo localmente em '/etc/portage/package.unmask'. Use isso com sobriedade: o time mascarou aquela versão por algum motivo (CVE, breakage, licença).`,
    codes: [
      { lang: "conf", code: `# /etc/portage/package.mask/nvidia
# Mascarar uma versão problemática do driver NVIDIA:
=x11-drivers/nvidia-drivers-555.58.02

# Mascarar todas as versões a partir de 555:
>=x11-drivers/nvidia-drivers-555` },
      { lang: "conf", code: `# /etc/portage/package.mask/python313
# Não quer Python 3.13 ainda (alguns pacotes não suportam):
>=dev-lang/python-3.13
# Forma mais cirúrgica, intervalo:
>=dev-lang/python-3.13 <dev-lang/python-3.14` },
      { lang: "conf", code: `# /etc/portage/package.unmask/firefox-beta
# Suponha que o time mascarou firefox-130_beta1 por instabilidade,
# mas você QUER testá-lo (e sabe o risco):
=www-client/firefox-130_beta1
# Lembre que keyword e mask são camadas diferentes:
# unmask em package.unmask + ~amd64 em package.accept_keywords.` },
      { lang: "bash", code: `# Ver TUDO que está mascarado no momento (global + local):
emerge --info --verbose | grep -i mask
# Ou consultar pacote a pacote:
equery meta www-client/firefox | grep -A2 'Keywords\\|Masked'` },
      { lang: "bash", code: `# Quando o Portage reclama 'masked by: package.mask',
# ele diz EM QUAL arquivo a máscara está e o motivo (se houver).
# Exemplo de saída:
# (dependency required by '...' [argument])
# !!! All ebuilds that could satisfy "x11-drivers/nvidia-drivers" have been masked.
# !!! One of the following masked packages is required to complete your request:
# - x11-drivers/nvidia-drivers-555.58.02::gentoo (masked by: package.mask)
# /etc/portage/package.mask/nvidia` },
      { lang: "conf", code: `# Boa prática: comente o motivo. Você vai esquecer em 3 meses.
# /etc/portage/package.mask/wine
# Wine 9.x quebra o instalador do meu jogo X até a versão 9.6.
# Reavaliar em janeiro/2025.
>=app-emulation/wine-vanilla-9.0
<app-emulation/wine-vanilla-9.6` },
    ],
    points: [
      "package.mask BLOQUEIA versões; package.unmask LIBERA o que o Gentoo bloqueou.",
      "Operadores de versão: '=' exato, '<' anterior, '<=' anterior ou igual, '>=' a partir de, '~' qualquer revisão.",
      "Sempre comente o motivo da máscara — você vai esquecer rápido.",
      "Mask local sempre vence o do profile; unmask local desfaz o mask do profile.",
      "Para versões testing você precisa de mask + accept_keywords; são camadas independentes.",
      "Use 'eix -v <pacote>' para visualizar todas as versões com seus marcadores [M] [~] [I].",
      "Armadilha comum: mascarar uma versão e esquecer, depois ficar 6 meses sem upgrade.",
      "Iniciante comum: tentar 'unmask' algo mascarado por LICENÇA; aí precisa é de ACCEPT_LICENSE.",
    ],
    alerts: [
      { type: "warning", content: "Quando o Gentoo mascara um pacote globalmente, geralmente é por CVE de segurança ou breakage real. Leia o motivo (no header do package.mask global) antes de unmask." },
      { type: "tip", content: "Se você precisa de uma versão específica congelada, considere também 'emerge --noreplace' ou versionar /etc/portage/package.mask em git." },
      { type: "info", content: "Existe um terceiro tipo de máscara: KEYWORD MASK (versão sem '~amd64' ainda). Não é resolvido por package.unmask, e sim por package.accept_keywords." },
    ],
  },
  {
    slug: "package-license",
    section: "configuracao-avancada",
    title: "package.license e ACCEPT_LICENSE: licenças proprietárias",
    difficulty: "intermediario",
    subtitle: "Como o Gentoo te força a aceitar conscientemente cada licença não livre que você instala.",
    intro: `O Gentoo é militante quanto a licenças. Por padrão, o profile aceita o '@FREE' — um GRUPO de licenças composto por OSI/FSF/Fedora/Misc-free/etc. Tudo que cair fora desse grupo (firmwares proprietários, drivers NVIDIA binários, fontes da Microsoft, microcódigo da Intel, Steam, Discord) é BLOQUEADO até você dizer explicitamente que aceita.

O mecanismo é o ACCEPT_LICENSE no '/etc/portage/make.conf' e o '/etc/portage/package.license' por pacote. Você pode aceitar grupos inteiros ('@BINARY-REDISTRIBUTABLE'), licenças específicas ('linux-fw-redistributable', 'NVIDIA-r2', 'AdobeFlash-11.x') ou usar o coringa '*' (aceita tudo — desaconselhado, vira um Arch).

A boa notícia é que ao tentar instalar 'sys-kernel/linux-firmware' ou 'x11-drivers/nvidia-drivers' o próprio Portage te diz EXATAMENTE qual licença adicionar, e o '--autounmask-write' grava a sugestão pronta. A má notícia é que muito iniciante simplesmente faz 'ACCEPT_LICENSE=\"*\"' no make.conf — e perde toda a vantagem de saber o que entrou no sistema.`,
    codes: [
      { lang: "ini", code: `# /etc/portage/make.conf — postura recomendada:
# Aceita o grupo livre + a família 'redistribuível' (firmwares).
ACCEPT_LICENSE="-* @FREE @BINARY-REDISTRIBUTABLE"

# Permissivo total (NÃO recomendado em servidor/produção):
# ACCEPT_LICENSE="*"` },
      { lang: "conf", code: `# /etc/portage/package.license/nvidia
# Aceitar a licença NVIDIA APENAS para o driver NVIDIA:
x11-drivers/nvidia-drivers NVIDIA-r2

# Steam (grupo de licenças):
games-util/steam-launcher @EULA
games-util/steam-meta @EULA

# Discord (binário não redistribuível):
net-im/discord-bin Discord-EULA` },
      { lang: "bash", code: `# Quando o Portage diz 'license required':
# === Required licenses are not in ACCEPT_LICENSE
# - x11-drivers/nvidia-drivers-560.35.03::gentoo (NVIDIA-r2)
# Aplicar a sugestão:
sudo emerge --ask --autounmask-write x11-drivers/nvidia-drivers
sudo dispatch-conf
sudo emerge --ask x11-drivers/nvidia-drivers` },
      { lang: "bash", code: `# Listar grupos de licenças existentes:
ls /var/db/repos/gentoo/profiles/license_groups
# E o conteúdo de um grupo:
cat /var/db/repos/gentoo/profiles/license_groups | grep ^FREE` },
      { lang: "conf", code: `# /etc/portage/package.license/firmware
# Firmwares de placas wifi/intel/amd: licenças "redistribuíveis" mas NÃO livres.
sys-kernel/linux-firmware linux-fw-redistributable no-source-code
sys-firmware/intel-microcode intel-ucode` },
      { lang: "bash", code: `# Investigar QUAL licença um pacote usa antes de instalar:
equery meta sys-kernel/linux-firmware | grep -i licen
# Saída exemplo:
# License:    linux-fw-redistributable BSD GPL-2 GPL-2+ MIT no-source-code
# Você precisa aceitar a UNIÃO de todas, ou usar @BINARY-REDISTRIBUTABLE.` },
    ],
    points: [
      "ACCEPT_LICENSE controla licenças globalmente; package.license pacote-a-pacote.",
      "@FREE = livres; @BINARY-REDISTRIBUTABLE = firmwares redistribuíveis (mas não livres).",
      "'*' aceita tudo — vira o Arch, não recomendado em produção/servidor.",
      "NVIDIA, Steam, Discord, Spotify exigem licenças específicas (EULA / NVIDIA-r2 / etc).",
      "'--autounmask-write' grava as sugestões em zz-autounmask — depois rode dispatch-conf.",
      "Microcódigo da CPU (Intel/AMD) é firmware não livre, mas crítico para segurança.",
      "Armadilha comum: pôr ACCEPT_LICENSE=\"*\" e perder o controle do que entrou no sistema.",
      "Iniciante comum: confundir license-mask com keyword-mask; cada um tem seu arquivo.",
    ],
    alerts: [
      { type: "info", content: "O Gentoo é uma das únicas distros que te força a aceitar EULA de forma explícita por pacote. É chato, mas é uma das razões pelas quais auditorias gostam do Gentoo." },
      { type: "tip", content: "Para servidores, mantenha ACCEPT_LICENSE='-* @FREE @BINARY-REDISTRIBUTABLE'. Se algo precisar de mais, o Portage te avisa e você decide CONSCIENTEMENTE." },
      { type: "warning", content: "Microcódigo da CPU (sys-firmware/intel-microcode) corrige falhas de segurança críticas (Spectre, Meltdown). Não recuse a licença dele em desktops modernos." },
      { type: "danger", content: "Aceitar @EULA cega significa concordar com qualquer EULA que pacotes futuros adicionarem — leia o que está aceitando ao menos uma vez." },
    ],
  },
  {
    slug: "eselect",
    section: "configuracao-avancada",
    title: "eselect: o canivete suíço de escolhas do sistema",
    difficulty: "intermediario",
    subtitle: "Trocar profile, kernel, Python, Java, OpenGL, fontconfig — tudo com a mesma sintaxe.",
    intro: `Em distros tradicionais, escolher 'qual Python é o python3 do sistema' ou 'qual GCC é usado por padrão' é um quebra-cabeças de symlinks, alternatives e pacotes. O Gentoo unificou isso num comando só: 'eselect'. Ele é uma coleção de módulos pequenos, cada um responsável por gerenciar um conjunto de symlinks ou um arquivo de configuração específico.

A estrutura é sempre a mesma: 'eselect <módulo> list', 'eselect <módulo> set <número>'. Funciona para profile do Portage, kernel padrão em /usr/src/linux, versão padrão de Python, JVM padrão, driver OpenGL ativo, set de fontes do Fontconfig, leitura de news, repositórios overlay, runtime de news, news a ler, e dezenas de módulos de aplicativos (ruby, lua, php, postgresql).

Saber decorar uns 6 ou 7 módulos comuns te poupa muita pesquisa. Neste capítulo veremos os essenciais: profile, kernel, python, java-vm, opengl, fontconfig, news, e como descobrir os outros que vêm pelo caminho ('eselect --help' sozinho lista os instalados).`,
    codes: [
      { lang: "bash", code: `# Ver todos os módulos eselect instalados:
eselect --help | head -40
# Saída inclui: bashcomp, ctags, editor, env, fontconfig, gcc, gpm,
# infinality, java-vm, kernel, libreoffice, locale, lua, news, opengl,
# pinentry, postgresql, profile, python, ruby, rust, vi, wxwidgets.` },
      { lang: "bash", code: `# PROFILE: define o conjunto base de USE, masks, keywords.
sudo eselect profile list
# Saída:
#   [1]  default/linux/amd64/23.0 (stable)
#   [2]  default/linux/amd64/23.0/desktop (stable)
#   [3]  default/linux/amd64/23.0/desktop/plasma (stable) *
#   [4]  default/linux/amd64/23.0/desktop/systemd (stable)
sudo eselect profile set 3` },
      { lang: "bash", code: `# KERNEL: aponta /usr/src/linux para a versão escolhida.
eselect kernel list
sudo eselect kernel set 1
# /usr/src/linux agora é symlink para /usr/src/linux-6.10.5-gentoo` },
      { lang: "bash", code: `# PYTHON: define qual Python é o 'python3' padrão.
eselect python list
#   [1]  python3.11
#   [2]  python3.12 *
sudo eselect python set python3.12
# Para Python 2 (deprecado, mas existe): eselect python set --python2 ...` },
      { lang: "bash", code: `# JAVA-VM: para quando há OpenJDK 17 e 21 lado a lado.
sudo eselect java-vm list
sudo eselect java-vm set system 2

# OPENGL: alterna entre xorg-x11, nvidia, ai-radeon (legado).
sudo eselect opengl list
sudo eselect opengl set nvidia` },
      { lang: "bash", code: `# FONTCONFIG: ativa/desativa presets de fontes (subpixel, hinting).
eselect fontconfig list
sudo eselect fontconfig enable 11-lcdfilter-default.conf

# NEWS: leia notícias importantes de mantenedores ANTES de upgrades.
eselect news list
eselect news read    # mostra todas
eselect news read 5  # só a notícia 5` },
    ],
    points: [
      "eselect = um comando, vários módulos, sintaxe sempre 'list/set/show'.",
      "'eselect profile set N' é o passo MAIS importante depois de chrootar no stage3.",
      "Sempre que atualizar o kernel, rode 'eselect kernel set' antes de make menuconfig.",
      "'eselect news read' antes de 'emerge -auDN @world' evita ser pego por mudanças.",
      "Trocar Python padrão exige rebuild de pacotes que herdam python-r1 (use 'emerge -1 @python-rebuild').",
      "OpenGL: depois de instalar driver NVIDIA, rode 'eselect opengl set nvidia'.",
      "Armadilha comum: trocar o profile e esquecer de rodar 'emerge -auDN --changed-use @world'.",
      "Iniciante comum: instalar dois Python e nunca rodar 'eselect python update' para fixar o melhor.",
    ],
    alerts: [
      { type: "tip", content: "Crie o hábito: depois de qualquer 'emerge --sync', rode 'eselect news read'. Em 30 segundos você lê o que mudou e evita armadilhas." },
      { type: "info", content: "Cada módulo eselect mora em '/usr/share/eselect/modules/'. Você pode escrever o seu próprio em bash se precisar gerenciar algo customizado." },
      { type: "warning", content: "Trocar profile reseta MUITAS USE flags implícitas. Sempre faça 'emerge -pvuDN @world' depois para ver o estrago antes de aplicar." },
    ],
  },
  {
    slug: "layman-overlays",
    section: "configuracao-avancada",
    title: "Overlays e eselect-repository: extendendo a árvore Portage",
    difficulty: "intermediario",
    subtitle: "Adicionando o GURU e overlays de terceiros para acessar pacotes além do tree oficial.",
    intro: `O 'tree' oficial do Gentoo (em '/var/db/repos/gentoo') tem uns 19 mil ebuilds, mas nem tudo cabe lá: pacotes proprietários, software muito jovem, ports experimentais, builds personalizados. A solução é o conceito de OVERLAY: uma árvore de ebuilds adicional, mantida fora do repo oficial, que se sobrepõe (literalmente) ao tree principal. Quando o Portage encontra o mesmo pacote em dois repos, vence o de prioridade maior.

Por anos a ferramenta padrão para gerenciar overlays foi o 'layman' (Perl, lento). Hoje a forma moderna é o 'eselect-repository' (em pacote 'app-eselect/eselect-repository'), que apenas escreve arquivos '.conf' em '/etc/portage/repos.conf/'. Você ainda pode adicionar overlays manualmente criando um arquivo nessa pasta — é só dizer location, sync-type e sync-uri.

O overlay mais importante para iniciantes é o GURU: mantido pela comunidade (não pelos devs oficiais), com milhares de ebuilds para apps modernos como Discord, Steam alternativos, ferramentas dev (zellij, helix, lazygit) e drivers de hardware específico. Ele já vem listado e basta um comando para ativar.`,
    codes: [
      { lang: "bash", code: `# Instalar o gerenciador moderno:
sudo emerge --ask app-eselect/eselect-repository
# Listar overlays disponíveis no banco oficial:
eselect repository list
# Adicionar o GURU (comunidade):
sudo eselect repository enable guru
# Sincronizar:
sudo emaint sync --repo guru` },
      { lang: "bash", code: `# Listar overlays JÁ ativos:
eselect repository list -i
# Saída:
# Available repositories:
#   [1]   gentoo                 (official)
#   [2]   guru                   git+https://anongit.gentoo.org/git/repo/proj/guru.git
# Remover um overlay:
sudo eselect repository remove guru` },
      { lang: "conf", code: `# /etc/portage/repos.conf/myoverlay.conf
# Adicionar overlay manualmente (sem eselect):
[myoverlay]
location = /var/db/repos/myoverlay
sync-type = git
sync-uri = https://github.com/usuario/meu-overlay.git
priority = 50
auto-sync = yes` },
      { lang: "bash", code: `# Verificar de qual overlay um pacote vem:
equery list --installed --portage-tree -F '$category/$name :: $repo' \\
  | grep guru
# Sintaxe inline para descobrir overlay de um pacote em específico:
emerge --info app-misc/zellij | grep ::
# Saída: [ebuild  N    ] app-misc/zellij-0.40.1::guru` },
      { lang: "bash", code: `# Layman LEGADO (ainda funciona, mas evite em sistemas novos):
sudo emerge --ask app-portage/layman
sudo layman -L           # lista
sudo layman -a guru      # adiciona
sudo layman -S           # sincroniza` },
      { lang: "bash", code: `# Criar SEU PRÓPRIO overlay local (sem servidor remoto):
sudo mkdir -p /var/db/repos/local/{metadata,profiles}
echo 'local' | sudo tee /var/db/repos/local/profiles/repo_name
echo 'masters = gentoo' | sudo tee /var/db/repos/local/metadata/layout.conf

cat | sudo tee /etc/portage/repos.conf/local.conf <<'EOF'
[local]
location = /var/db/repos/local
masters = gentoo
auto-sync = no
EOF` },
    ],
    points: [
      "Overlay = árvore de ebuilds adicional; pode ter prioridade maior que o tree oficial.",
      "Ferramenta moderna: 'app-eselect/eselect-repository'. Layman é legado, ainda funcional.",
      "GURU é o overlay da comunidade; cobre boa parte do que falta no tree oficial.",
      "Cada overlay vira um arquivo '.conf' em '/etc/portage/repos.conf/'.",
      "Veja origem do pacote com 'equery list -F' ou olhando '::repo' na saída do emerge.",
      "Pacotes do GURU NÃO são suportados pelos devs oficiais — qualidade variável.",
      "Armadilha comum: sincronizar overlay manualmente e esquecer 'emaint sync --auto'.",
      "Iniciante comum: instalar overlay obscuro do GitHub sem auditar; pode ter ebuilds maliciosos.",
    ],
    alerts: [
      { type: "warning", content: "Overlays são código executado como root durante 'emerge'. Trate cada novo overlay como você trataria um PPA não oficial: confira quem mantém antes de habilitar." },
      { type: "info", content: "O GURU passa por revisão básica antes de ebuilds entrarem, mas sem o rigor do tree oficial. Para uso pessoal, ele é uma faca afiada e útil." },
      { type: "tip", content: "Crie um overlay local cedo: serve para você manter ebuilds customizados (forks, versões com patch, software interno) sem mexer no tree oficial." },
    ],
  },
  {
    slug: "eclasses",
    section: "configuracao-avancada",
    title: "Eclasses: as bibliotecas reutilizáveis dos ebuilds",
    difficulty: "avancado",
    subtitle: "Como o Portage evita milhares de linhas duplicadas usando 'includes' chamados eclass.",
    intro: `Um ebuild é o script que diz ao Portage como compilar e instalar um pacote. Se cada ebuild tivesse que reimplementar 'extrair tarball, rodar configure, rodar make, instalar arquivos respeitando DESTDIR', teríamos milhões de linhas duplicadas. A solução do Portage são as ECLASSES: arquivos de código bash (com extensão '.eclass') em '/var/db/repos/gentoo/eclass/' que ebuilds podem 'inherit' (importar) para ganhar funções prontas.

Algumas eclasses são onipresentes. 'autotools-utils' (deprecado) e 'autotools' implementam todo o ciclo de configure/make. 'cmake' faz o mesmo para projetos CMake. 'python-r1' / 'python-single-r1' permitem que um pacote Python suporte múltiplas versões simultaneamente. 'kernel-2' ajuda em ebuilds de kernel. 'distutils-r1', 'meson', 'go-module', 'cargo' (Rust), 'qmake-utils', 'flag-o-matic' (manipulação de CFLAGS).

Entender eclasses te dá poder de duas formas: você consegue LER ebuilds e entender o que eles fazem, e consegue ESCREVER seus próprios ebuilds sem reinventar nada. Toda eclass tem um cabeçalho com documentação dos parâmetros e funções que ela exporta. Aprender a navegar nesses cabeçalhos é metade do caminho para virar maintainer.`,
    codes: [
      { lang: "bash", code: `# Listar eclasses disponíveis no tree:
ls /var/db/repos/gentoo/eclass/ | head -20
# Saída: alternatives.eclass autotools.eclass bash-completion-r1.eclass
#        cmake.eclass distutils-r1.eclass eapi8-dosym.eclass
#        flag-o-matic.eclass git-r3.eclass go-module.eclass
#        kernel-2.eclass linux-info.eclass python-r1.eclass ...` },
      { lang: "bash", code: `# LER a documentação de uma eclass (cabeçalhos com @ECLASS, @DESCRIPTION):
head -60 /var/db/repos/gentoo/eclass/cmake.eclass
# Procurar funções públicas de uma eclass:
grep -E '^(cmake|src_)' /var/db/repos/gentoo/eclass/cmake.eclass` },
      { lang: "bash", code: `# Ver QUAIS eclasses um pacote herda:
equery meta dev-vcs/git | grep -i inherit
# Ou direto no ebuild:
head -10 /var/db/repos/gentoo/dev-vcs/git/git-2.46.0.ebuild
# Você verá algo como:
# inherit bash-completion-r1 elisp-common perl-functions \\
#         plocale python-single-r1 systemd toolchain-funcs` },
      { lang: "bash", code: `# Estrutura típica de um ebuild simples usando eclass:
# /var/db/repos/local/app-misc/hello/hello-1.0.ebuild
cat <<'EBUILD'
# Copyright 2024 Gentoo Authors
# Distributed under the terms of the GNU General Public License v2

EAPI=8

inherit autotools

DESCRIPTION="GNU Hello"
HOMEPAGE="https://www.gnu.org/software/hello/"
SRC_URI="mirror://gnu/hello/\${P}.tar.gz"

LICENSE="GPL-3+"
SLOT="0"
KEYWORDS="~amd64"

src_prepare() {
    default
    eautoreconf
}
EBUILD` },
      { lang: "bash", code: `# As eclasses 'flag-o-matic' e 'toolchain-funcs' ajudam a manipular CFLAGS:
# Trecho típico em um ebuild:
# inherit flag-o-matic toolchain-funcs
# 
# src_configure() {
#     filter-flags -O3                     # remove -O3 se for perigoso
#     append-cflags -DDISABLE_FOO          # acrescenta um define
#     tc-export CC CXX                     # exporta toolchain corrente
#     econf --enable-shared
# }` },
      { lang: "bash", code: `# Ver QUAIS pacotes do sistema usam uma eclass específica:
grep -rl 'inherit.*python-r1' /var/db/repos/gentoo/*/*.ebuild | head -5
# Vai dar saída tipo:
# /var/db/repos/gentoo/dev-python/django/django-5.1.ebuild
# /var/db/repos/gentoo/dev-python/numpy/numpy-2.1.0.ebuild` },
    ],
    points: [
      "Eclass = código bash reutilizável; ebuilds fazem 'inherit' para ganhar funções prontas.",
      "Eclasses comuns: autotools, cmake, meson, python-r1, distutils-r1, kernel-2, go-module, cargo.",
      "Cada eclass tem cabeçalho documentado com @ECLASS, @DESCRIPTION, @FUNCTION.",
      "'inherit X' deve aparecer NO TOPO do ebuild, antes de funções src_*.",
      "python-r1 é multi-versão; python-single-r1 escolhe UMA via PYTHON_SINGLE_TARGET.",
      "flag-o-matic + toolchain-funcs são essenciais para mexer em CFLAGS/CXXFLAGS.",
      "Armadilha comum: copiar ebuild antigo com EAPI 6 que usa eclass deprecada (autotools-utils).",
      "Iniciante comum: tentar chamar uma função sem 'inherit' da eclass certa.",
    ],
    alerts: [
      { type: "tip", content: "Para entender qualquer ebuild, leia primeiro a linha 'inherit' e abra cada eclass listada. Em 80% dos casos, isso explica o que o ebuild faz." },
      { type: "info", content: "Eclasses têm versionamento implícito no nome (kernel-2, autotools-utils-r1, python-r1). Sempre prefira a versão mais nova listada nos ebuilds atuais do tree." },
      { type: "warning", content: "Eclasses podem ser deprecadas. Antes de usar uma em um ebuild novo, verifique 'tail /var/db/repos/gentoo/eclass/X.eclass' por avisos @DEAD/@DEPRECATED." },
    ],
  },
  {
    slug: "ebuild-customizado",
    section: "configuracao-avancada",
    title: "Escrevendo seu primeiro ebuild num overlay local",
    difficulty: "avancado",
    subtitle: "Da estrutura mínima de diretórios à execução manual de digest, compile e merge.",
    intro: `Cedo ou tarde você vai querer instalar algo que não existe no tree nem no GURU: um software interno da empresa, um fork de um projeto, uma versão com patch específico. Em vez de compilar à mão e perder o controle do Portage, escreva um ebuild num overlay local. Assim o pacote aparece no '@world', participa do '--depclean', do '--newuse', e respeita as USE flags do sistema.

A estrutura mínima é: '/var/db/repos/local/<categoria>/<nome>/<nome>-<versão>.ebuild', mais um 'metadata.xml' (opcional, mas recomendado) e um 'Manifest' (gerado automaticamente). O EAPI atual é o 8 (em 2024); ele define a sintaxe e as funções disponíveis. O comando central de teste é 'ebuild', que executa cada fase isoladamente: 'fetch', 'unpack', 'compile', 'install', 'merge'.

Para entrar no tree oficial, ebuilds passam por revisão de devs Gentoo. Para uso local, basta funcionar. Use 'pkgcheck' (substituto moderno do 'repoman') para validar metadata, KEYWORDS, EAPI, herança de eclass. Iniciantes erram principalmente em três pontos: SRC_URI errada, KEYWORDS faltando ('~amd64'), e dependências expressas com sintaxe antiga.`,
    codes: [
      { lang: "bash", code: `# Criar a estrutura mínima do overlay local (caso ainda não exista):
sudo mkdir -p /var/db/repos/local/{metadata,profiles}
echo 'local' | sudo tee /var/db/repos/local/profiles/repo_name
echo 'masters = gentoo' | sudo tee /var/db/repos/local/metadata/layout.conf
# Registrar no Portage:
sudo tee /etc/portage/repos.conf/local.conf <<'EOF'
[local]
location = /var/db/repos/local
masters = gentoo
auto-sync = no
EOF` },
      { lang: "bash", code: `# Estrutura para um ebuild novo:
sudo mkdir -p /var/db/repos/local/app-misc/foobar
sudo \\$EDITOR /var/db/repos/local/app-misc/foobar/foobar-1.0.ebuild` },
      { lang: "bash", code: `# Conteúdo mínimo de um ebuild EAPI 8 que compila com autotools:
cat <<'EBUILD' | sudo tee /var/db/repos/local/app-misc/foobar/foobar-1.0.ebuild
# Copyright 2024 Gentoo Authors
# Distributed under the terms of the GNU General Public License v2

EAPI=8

DESCRIPTION="Programa exemplo para overlay local"
HOMEPAGE="https://example.com/foobar"
SRC_URI="https://example.com/dl/\${P}.tar.gz"

LICENSE="MIT"
SLOT="0"
KEYWORDS="~amd64"
IUSE=""

DEPEND="sys-libs/zlib"
RDEPEND="\${DEPEND}"
EBUILD` },
      { lang: "bash", code: `# Gerar o Manifest (hashes do tarball):
cd /var/db/repos/local/app-misc/foobar
sudo ebuild foobar-1.0.ebuild manifest
# Cria/atualiza o arquivo Manifest. Sem ele, Portage recusa instalar.` },
      { lang: "bash", code: `# Testar fase por fase (útil para depurar erro de build):
sudo ebuild foobar-1.0.ebuild clean fetch unpack prepare compile install
# Cada fase pode ser repetida sem refazer as anteriores.

# Instalar de verdade:
sudo emerge --ask =app-misc/foobar-1.0
# Como está em ~amd64, talvez precise:
echo 'app-misc/foobar ~amd64' | sudo tee \\
  /etc/portage/package.accept_keywords/foobar` },
      { lang: "bash", code: `# Validar com pkgcheck antes de publicar:
sudo emerge --ask dev-util/pkgcheck
cd /var/db/repos/local
pkgcheck scan app-misc/foobar
# Saída ideal: nada. Se aparecer warning, leia e corrija (KEYWORDS, metadata, etc.)` },
    ],
    points: [
      "Overlay local mora em '/var/db/repos/local'; precisa de profiles/repo_name + repos.conf.",
      "Use sempre EAPI=8 em ebuilds novos (em 2024). EAPIs antigas são tolerados, não recomendadas.",
      "SRC_URI usa variáveis: '\${P}' (pkg-versão), '\${PV}' (versão), '\${PN}' (nome).",
      "DEPEND = build-time, RDEPEND = runtime, BDEPEND = build host (cross-compile).",
      "'ebuild X.ebuild manifest' é OBRIGATÓRIO antes de qualquer install.",
      "'ebuild X.ebuild compile' permite testar build sem sujar o sistema com merge.",
      "Use 'pkgcheck' para validar; 'repoman' antigo está deprecado.",
      "Armadilha comum: KEYWORDS=\"amd64\" em pacote novo (faltando '~') — devs reprovam.",
    ],
    alerts: [
      { type: "tip", content: "Comece copiando um ebuild parecido do tree oficial e adaptando — é mais rápido que escrever do zero. Use 'eix-search nome' e olhe o .ebuild correspondente." },
      { type: "info", content: "Ebuilds NUNCA podem usar 'sudo' nem chamar comandos interativos. Eles rodam em sandbox como root. Use as funções da eclass para tudo." },
      { type: "warning", content: "Ao puxar de Git, use a eclass 'git-r3' e SRC_URI vazia. Não tente baixar tarball gerado pelo GitHub release — eles mudam hash com frequência." },
      { type: "danger", content: "Nunca delete '/var/db/repos/local' achando que é cache. Se você apagar, perde todos os ebuilds que escreveu." },
    ],
  },
  {
    slug: "virtuais",
    section: "configuracao-avancada",
    title: "Pacotes virtuais: virtual/jpeg, virtual/mta e companhia",
    difficulty: "intermediario",
    subtitle: "Como o Portage permite múltiplos provedores para a mesma funcionalidade.",
    intro: `Na vida real, várias bibliotecas/utilitários implementam a mesma interface. Para JPEG existem libjpeg-turbo (mais rápido) e libjpeg clássico. Para servidor de e-mail (MTA) existem Postfix, Exim, OpenSMTPD. Para pkgconfig existem pkgconf e pkg-config GNU. O Gentoo resolve isso com PACOTES VIRTUAIS: ebuilds que não compilam nada por si — apenas declaram 'qualquer um destes serve'.

A categoria 'virtual/' agrupa esses 'pacotes-conceito'. Quando um pacote real depende de 'virtual/jpeg', o Portage verifica se algum provedor já está instalado; se sim, usa o que tem; se não, instala um padrão (geralmente o primeiro listado no ebuild virtual). Para FORÇAR um provedor específico, basta instalá-lo manualmente antes — vira parte do '@world' e o Portage se encarrega.

Saber dos virtuais te ajuda a entender mensagens de conflito ('virtual/jpeg slot conflict'), te permite escolher provedores melhores (libjpeg-turbo é estritamente superior) e te dá controle sobre dependências de transição (substituir Postfix por OpenSMTPD sem perder mailx).`,
    codes: [
      { lang: "bash", code: `# Listar pacotes virtuais existentes no tree:
ls /var/db/repos/gentoo/virtual/ | head -20
# Saída: acl awk cron editor jpeg jre libelf libgudev libudev libusb
# linux-sources logger man mta opengl pam perl-CPAN-Meta pkgconfig
# postscript service-manager ssh ttf-fonts udev` },
      { lang: "bash", code: `# Ver quem provê 'virtual/jpeg' atualmente:
equery depgraph virtual/jpeg
# Saída típica:
# media-libs/libjpeg-turbo-3.0.4

# Trocar provedor — instale o desejado, depois rode depclean:
sudo emerge --ask media-libs/libjpeg-turbo
sudo emerge --ask --depclean` },
      { lang: "bash", code: `# Para MTA (servidor de e-mail), o virtual aceita vários:
equery depends virtual/mta
# Saída mostra quem depende dele (mailx, cron, etc).
sudo emerge --ask mail-mta/postfix     # ou exim, ou opensmtpd
# O Portage substitui o provedor anterior automaticamente.` },
      { lang: "bash", code: `# Ver como um virtual é especificado num ebuild:
cat /var/db/repos/gentoo/virtual/jpeg/jpeg-100.ebuild
# Trecho relevante:
# RDEPEND="
#     || (
#         media-libs/libjpeg-turbo:=
#         media-libs/jpeg:62=
#     )
# "
# || ( ... ) significa 'qualquer um serve'.` },
      { lang: "bash", code: `# Exemplo prático: Java. virtual/jdk e virtual/jre.
sudo eselect java-vm list
# Saída:
#   [1]   openjdk-bin-17  system-vm
#   [2]   openjdk-bin-21
sudo eselect java-vm set system 2
# virtual/jdk vai apontar para openjdk-bin-21 daqui pra frente.` },
      { lang: "bash", code: `# Conflito comum: dois providers do MESMO virtual.
# O Portage diz algo como:
# !!! Multiple package instances within a single package slot have been pulled
#     into the dependency graph, resulting in a slot conflict:
#     virtual/mta:0
# 
# Solução: escolha UM e --deselect o outro:
sudo emerge --ask --deselect mail-mta/exim
sudo emerge --ask --depclean` },
    ],
    points: [
      "Pacotes virtuais (categoria 'virtual/') não compilam nada; só agrupam provedores.",
      "Sintaxe '|| ( pkg-A pkg-B )' no ebuild diz 'qualquer um serve'.",
      "Para escolher provedor: instale o desejado, depois '--depclean' o anterior.",
      "Virtuais comuns: jpeg, mta, jdk, jre, opengl, pkgconfig, cron, editor, awk.",
      "'eselect java-vm' faz a mediação para virtual/jdk e virtual/jre.",
      "Conflitos de slot em virtuais resolvem-se com --deselect explícito de um lado.",
      "Armadilha comum: instalar dois MTAs e ficar com mail vindo só de um deles.",
      "Iniciante comum: emergir 'jpeg' direto e nunca passar por 'virtual/jpeg'.",
    ],
    alerts: [
      { type: "tip", content: "Sempre prefira libjpeg-turbo a libjpeg clássico — drop-in compatible, ~3x mais rápido em codificação." },
      { type: "info", content: "Pacotes virtuais NÃO consomem espaço em disco. Eles existem só para o resolvedor de dependências." },
      { type: "warning", content: "Trocar provedor de virtual/mta em servidor de produção exige atenção: configs do Postfix e Exim são incompatíveis. Faça backup antes." },
    ],
  },
  {
    slug: "slots-praticos",
    section: "configuracao-avancada",
    title: "Slots na prática: GCC, PHP, Python e Java em paralelo",
    difficulty: "intermediario",
    subtitle: "Como manter duas (ou mais) versões do mesmo pacote instaladas e ativas ao mesmo tempo.",
    intro: `O conceito de SLOT no Gentoo é o que permite ter GCC 13 e GCC 14 ao mesmo tempo, ou Python 3.11 e 3.12 lado a lado, sem que um pisoteie o outro. Cada versão major do pacote vive em seu próprio slot, com seus próprios binários, libs e man pages, instalados em caminhos versionados (ex.: '/usr/lib/gcc-13.3.1' e '/usr/lib/gcc-14.2.0').

O Portage trata cada slot como se fosse um pacote independente: 'gcc:13' e 'gcc:14' podem ser instalados, atualizados e removidos separadamente. Quando um pacote depende de 'sys-devel/gcc:13', o Portage entende que precisa exatamente do slot 13. Para escolher qual slot é o 'padrão' (qual binário responde por 'gcc' sem versão), usa-se 'eselect gcc set <número>'.

Esse mecanismo é vital em ambientes onde você precisa compilar projetos antigos que só funcionam com versão X do compilador, manter intérpretes legados (Python 2.7 ainda existe em slot, embora sem suporte), ou ter múltiplas versões de banco/PHP em servidor multi-tenant.`,
    codes: [
      { lang: "bash", code: `# Ver slots instalados de um pacote:
equery list --installed sys-devel/gcc
# Saída:
#  * Searching for gcc in sys-devel ...
#  [IP-] [  ] sys-devel/gcc-13.3.1:13
#  [IP-] [  ] sys-devel/gcc-14.2.0:14
# O ':13' e ':14' depois do nome são os slots.` },
      { lang: "bash", code: `# Trocar GCC 'padrão' do sistema:
sudo eselect gcc list
#   [1]   x86_64-pc-linux-gnu-13
#   [2]   x86_64-pc-linux-gnu-14 *
sudo eselect gcc set 1
# Atualizar variáveis de ambiente:
source /etc/profile
gcc --version    # confere se mudou` },
      { lang: "bash", code: `# Instalar uma versão específica em outro slot:
sudo emerge --ask =sys-devel/gcc-13.3.1
# A sintaxe '=' fixa a versão. ':13' fixa o slot:
sudo emerge --ask sys-devel/gcc:13` },
      { lang: "bash", code: `# Python: ter 3.11 e 3.12 simultâneos:
sudo emerge --ask =dev-lang/python-3.11.10
sudo emerge --ask =dev-lang/python-3.12.6
# Definir qual é o 'python3' padrão:
sudo eselect python list
sudo eselect python set python3.12
# Atualizar pacotes que dependem da troca:
sudo emerge --ask --oneshot @python-rebuild` },
      { lang: "bash", code: `# PHP: 8.2 e 8.3 lado a lado em servidor web:
sudo emerge --ask dev-lang/php:8.2 dev-lang/php:8.3
sudo eselect php list cli
sudo eselect php set cli 2     # CLI usa 8.3
sudo eselect php set fpm 1     # FPM continua em 8.2` },
      { lang: "bash", code: `# Remover um slot específico (cuidado com dependências):
sudo emerge --ask --depclean sys-devel/gcc:13
# Se houver pacote dependendo, o Portage avisa.

# Para atualizar TODOS os slots de uma vez:
sudo emerge --ask --update --deep --newuse @world` },
    ],
    points: [
      "Slot = versão paralela do mesmo pacote, vivendo em caminhos versionados.",
      "Sintaxe 'cat/pkg:N' refere o slot N (ex.: 'sys-devel/gcc:14').",
      "'eselect <pacote> set' escolhe qual slot é o padrão para binários sem versão.",
      "Python multi-slot exige rebuild com '@python-rebuild' depois da troca.",
      "GCC: depois de trocar slot padrão, geralmente precisa 'emerge -e @world' para refazer com o novo compilador.",
      "Java/PHP: conjuntos separados por contexto (cli, fpm, apache) via eselect.",
      "Armadilha comum: trocar GCC e esquecer 'source /etc/profile' — sessão antiga ainda usa o velho.",
      "Iniciante comum: 'emerge --depclean' agressivo apaga slot antigo que outro pacote precisava.",
    ],
    alerts: [
      { type: "tip", content: "Ao atualizar GCC para uma versão major nova, mantenha o slot anterior por algumas semanas. Você consegue voltar com 'eselect gcc set' se algo quebrar." },
      { type: "info", content: "Slots são definidos no próprio ebuild via variável SLOT. Você não cria slots; o pacote já vem com a divisão definida pelo dev." },
      { type: "warning", content: "Trocar de slot do compilador padrão pode exigir 'emerge -e @world' (rebuild de tudo) para garantir consistência de ABI. Em sistema grande são horas de build." },
    ],
  },
  {
    slug: "profiles-customizar",
    section: "configuracao-avancada",
    title: "Profiles customizados: criando seu próprio em /etc/portage",
    difficulty: "avancado",
    subtitle: "Estendendo o profile do Gentoo com suas próprias USE flags, masks e make.defaults.",
    intro: `Um PROFILE no Gentoo é um conjunto de arquivos que define o 'estado base' do sistema: quais USE flags vêm ligadas por padrão, quais pacotes estão mascarados, qual ARCH, qual conjunto de keywords. Profiles oficiais (como 'default/linux/amd64/23.0/desktop/plasma') são versionados e mantidos pelo Gentoo. Você troca com 'eselect profile set'.

O que pouca gente sabe: você pode CRIAR SEU PRÓPRIO profile localmente, em '/etc/portage/make.profile/' ou '/etc/portage/profile/', e fazer ele HERDAR de um profile oficial. Isso te permite empilhar suas customizações no topo de um profile estável, sem mexer em '/var/db/repos/gentoo' (que seria sobrescrito a cada sync).

A estrutura é a mesma de um profile oficial: um arquivo 'parent' aponta para o profile base, e depois você adiciona 'use.force', 'use.mask', 'package.use', 'package.mask', 'make.defaults' próprios. É a forma mais 'hardcore' de configurar o Portage, ideal para gerenciar parques de máquinas idênticas (servidores, lab) ou para impor políticas internas em uma empresa.`,
    codes: [
      { lang: "bash", code: `# Estrutura mínima de um profile customizado:
sudo mkdir -p /etc/portage/profile

# Apontar para o profile base (herança):
sudo tee /etc/portage/profile/parent <<'EOF'
gentoo:default/linux/amd64/23.0/desktop/plasma
EOF
# Note o prefixo 'gentoo:' indicando o repo de origem.` },
      { lang: "conf", code: `# /etc/portage/profile/use.force
# Forçar USE flags ON em TODO o sistema (sobrepõe -):
wayland
pipewire
elogind` },
      { lang: "conf", code: `# /etc/portage/profile/use.mask
# Esconder USE flags do alcance: ninguém pode ligar.
# Útil para banir GTK em uma máquina KDE pura.
gtk
gnome` },
      { lang: "conf", code: `# /etc/portage/profile/package.use.force
# Forçar USE em pacote específico, mesmo se package.use disser o contrário.
media-video/ffmpeg vaapi vulkan
sys-kernel/linux-firmware savedconfig` },
      { lang: "conf", code: `# /etc/portage/profile/make.defaults
# Variáveis padrão DO PROFILE (não do make.conf).
# São combinadas com make.conf — make.conf pode sobrepor.
ACCEPT_LICENSE="@FREE @BINARY-REDISTRIBUTABLE"
VIDEO_CARDS="amdgpu radeonsi"
INPUT_DEVICES="libinput"
L10N="pt-BR en"` },
      { lang: "bash", code: `# Verificar que o profile customizado está sendo lido:
emerge --info | grep -A1 'PROFILE\\|MAKEOPTS'
# Saída deve mostrar a herança e as USE flags forçadas/mascaradas.

# Re-emergir o que mudou:
sudo emerge --ask --update --deep --newuse @world` },
    ],
    points: [
      "Profiles customizados moram em '/etc/portage/profile/' (singular!) e estendem outro profile.",
      "Arquivo 'parent' aponta para o profile base com prefixo 'gentoo:'.",
      "use.force / use.mask manipulam USE em TODO o sistema; package.use.force/mask por pacote.",
      "make.defaults define variáveis padrão; make.conf sobrepõe se preciso.",
      "Útil em parques homogêneos: um profile interno garante consistência entre máquinas.",
      "Profile pode herdar múltiplos pais — empilhe módulos lógicos.",
      "Armadilha comum: editar dentro do tree oficial (/var/db/repos/gentoo) — perde no próximo sync.",
      "Iniciante comum: confundir '/etc/portage/profile' (custom) com '/etc/portage/make.profile' (symlink ativo).",
    ],
    alerts: [
      { type: "info", content: "Em ambientes corporativos, profiles customizados podem ser distribuídos via overlay próprio ou via Ansible — vira uma 'política como código'." },
      { type: "warning", content: "use.force ignora suas configurações de package.use. Use com critério; pode esconder por que algo está 'magicamente' habilitado." },
      { type: "tip", content: "Versione '/etc/portage/profile' em git junto com '/etc/portage'. É a documentação executável das suas decisões." },
    ],
  },
  {
    slug: "world-file-pratica",
    section: "configuracao-avancada",
    title: "O arquivo @world: editando à mão (e os riscos)",
    difficulty: "intermediario",
    subtitle: "Como o Portage rastreia o que VOCÊ pediu vs. o que veio como dependência.",
    intro: `Toda vez que você faz 'emerge <pacote>' (sem flags especiais), o Portage adiciona o pacote ao arquivo '/var/lib/portage/world'. Esse arquivo lista os pacotes que VOCÊ explicitamente pediu — o conjunto '@world'. Dependências automáticas (libs, runtimes) NÃO entram nele; ficam só no banco de pacotes instalados ('/var/db/pkg').

Essa distinção é crucial. Quando você roda 'emerge --depclean', o Portage olha o '@world' + '@system' e remove tudo que não é dependência transitiva desses dois conjuntos. Se o pacote sumiu do '@world' por algum motivo, o depclean pode tirá-lo do sistema. Esse é o motivo de '--deselect' existir: remove do '@world' SEM desinstalar.

Editar o '/var/lib/portage/world' à mão é tecnicamente possível e às vezes útil (limpar pacotes antigos com '@', remover entradas órfãs depois de renomeação). Mas é como editar '/etc/passwd' diretamente: funciona, mas o caminho 'oficial' (--select / --deselect) existe por razões de consistência.`,
    codes: [
      { lang: "bash", code: `# Ver o arquivo @world:
cat /var/lib/portage/world
# Saída tipo:
# app-editors/vim
# app-shells/zsh
# kde-plasma/plasma-meta
# media-video/mpv
# www-client/firefox` },
      { lang: "bash", code: `# Adicionar ao @world sem instalar (raro, mas existe):
sudo emerge --noreplace --select app-editors/vim

# Remover do @world SEM desinstalar:
sudo emerge --deselect app-editors/vim
# Pacote ainda instalado, mas vira candidato a depclean se nada mais o usa.` },
      { lang: "bash", code: `# Listar pacotes do @world (mais legível que cat):
qlist -ICv $(cat /var/lib/portage/world) | head
# Ou simplesmente:
emerge --pretend --depclean   # mostra o que seria removido` },
      { lang: "bash", code: `# Limpar entradas órfãs (pacotes que não existem mais):
sudo emaint --check world
# Saída exemplo:
#  * 'app-old/dead-package' is not in the portage tree.
#  * Use --fix to remove these entries.
sudo emaint --fix world` },
      { lang: "bash", code: `# Editar à mão (cuidado, faça backup):
sudo cp /var/lib/portage/world /var/lib/portage/world.bak
sudo \\$EDITOR /var/lib/portage/world
# Use a sintaxe canônica: 'categoria/pacote' por linha, sem versão.

# Após editar, sempre rode:
sudo emerge --ask --update --deep --newuse @world` },
      { lang: "bash", code: `# @system vs @world:
emerge --pretend --emptytree @system   # baseline mínimo do Gentoo
emerge --pretend --emptytree @world    # tudo que VOCÊ adicionou
# @system inclui glibc, bash, openrc/systemd, coreutils, etc — não toque.` },
    ],
    points: [
      "@world = pacotes que VOCÊ pediu; dependências automáticas não entram.",
      "@system = baseline mínimo definido pelo profile (não editável via world).",
      "'emerge <pkg>' adiciona ao world; '--oneshot' instala SEM adicionar.",
      "'--deselect' remove do world sem desinstalar; '--unmerge' desinstala mas não toca world.",
      "Depclean usa @world + @system para decidir o que é 'lixo'.",
      "'emaint --check world' detecta entradas órfãs (pacote não existe mais).",
      "Armadilha comum: editar /var/lib/portage/world e deixar versão (ex: '=cat/pkg-1.0') — sintaxe inválida.",
      "Iniciante comum: confundir 'desinstalar' com 'tirar do world' — são operações diferentes.",
    ],
    alerts: [
      { type: "warning", content: "Nunca apague /var/lib/portage/world inteiro. Sem ele, depclean considera TUDO como dependência opcional e pode arrasar o sistema." },
      { type: "tip", content: "Versione '/var/lib/portage/world' em git junto com /etc/portage. É a 'lista de compras' do seu sistema." },
      { type: "info", content: "Em conjuntos personalizados (sets), você pode criar '/etc/portage/sets/meusapps' com lista de pacotes e fazer 'emerge @meusapps'. Útil para grupos lógicos." },
    ],
  },
  {
    slug: "conflitos-resolucao",
    section: "configuracao-avancada",
    title: "Resolvendo conflitos do Portage: blockers, slots e --autounmask",
    difficulty: "avancado",
    subtitle: "Aprendendo a ler o (intimidador) bloco de erros do emerge e tomar a decisão certa.",
    intro: `Cedo ou tarde você vai pedir um upgrade simples e o Portage vai cuspir 30 linhas de erro com termos como 'slot conflict', 'blocker', 'masked by', 'circular dependency', '||  ( ... )'. Para o iniciante parece código alienígena. Mas o emerge é absolutamente determinístico: o que parece caos é uma árvore de decisões com regras conhecidas. Aprender a ler essa saída é a fronteira entre usar Gentoo e dominar Gentoo.

Os tipos de conflito mais comuns são: KEYWORD MASK (versão precisa ir para ~amd64), USE CHANGES (USE flag precisa ser ligada/desligada), LICENSE (você precisa aceitar a licença), SLOT CONFLICT (duas versões do mesmo pacote sendo puxadas para o mesmo slot), BLOCKER (um pacote diz '!!=cat/pkg-X' = não conviver com aquela versão), e CIRCULAR DEPENDENCY (A precisa de B para compilar, B precisa de A).

A primeira regra é: leia da PRIMEIRA mensagem para a última. O Portage explica a cadeia de decisões na ordem; geralmente o erro raiz está no topo. A segunda regra é: '--autounmask-write' resolve sozinho 80% dos pedidos triviais (keyword + USE + license). A terceira: para SLOT CONFLICT e BLOCKER, você precisa decidir QUAL pacote fica e usar '--deselect' / '--unmerge' / '=' para fixar versões.`,
    codes: [
      { lang: "text", code: `# SLOT CONFLICT típico:
emerge: there are no ebuilds built with USE flags to satisfy "dev-lang/python:3.12[sqlite]".
!!! One of the following packages is required to complete your request:
- dev-lang/python-3.12.6::gentoo (Change USE: +sqlite)
(dependency required by "dev-python/numpy-2.1.0::gentoo")

# Solução:
echo 'dev-lang/python:3.12 sqlite' | sudo tee \\
  /etc/portage/package.use/python-fixes
sudo emerge --ask dev-python/numpy` },
      { lang: "text", code: `# BLOCKER (o '!!' indica conflito mortal):
[blocks B      ] <sys-libs/glibc-2.40 ("<sys-libs/glibc-2.40" is hard blocked
                  by sys-apps/man-db-2.13.0)

# Significa: man-db-2.13.0 NÃO pode coexistir com glibc < 2.40.
# Solução: atualize glibc primeiro:
sudo emerge --ask --oneshot sys-libs/glibc
sudo emerge --ask sys-apps/man-db` },
      { lang: "bash", code: `# --autounmask-write resolve KEYWORD/USE/LICENSE em uma tacada:
sudo emerge --ask --autounmask-write --autounmask-license=y \\
  --update --deep --newuse @world

# Ele grava sugestões em /etc/portage/package.{use,accept_keywords,license}
# Aplique com:
sudo dispatch-conf
# Tecla 'u' = use new, 'z' = zap (descarta), 'q' = sai.` },
      { lang: "text", code: `# CIRCULAR DEPENDENCY:
!!! Error: circular dependencies:
(dev-lang/python-3.12.6::gentoo, ebuild scheduled for merge)
depends on
(sys-libs/openssl-3.3.2::gentoo, ebuild scheduled for merge)
depends on
(dev-lang/python-3.12.6::gentoo, ebuild scheduled for merge)

# Solução clássica: instalar um dos lados temporariamente sem USE conflitante.
# O Portage costuma sugerir:
# 'It might be possible to break this cycle by applying the following changes...'
# Siga a sugestão.` },
      { lang: "bash", code: `# Quando NADA funciona, refaça o conjunto inteiro:
sudo emerge --ask --emptytree --update --deep --newuse @world
# CUIDADO: recompila TUDO. Pode levar 1-3 dias em desktop.
# Use só em última instância (após mudança de profile, glibc, gcc major).` },
      { lang: "bash", code: `# Diagnóstico avançado: por que o Portage quer instalar X?
emerge --pretend --tree --verbose @world | grep -B2 'sys-libs/glibc'
# A flag --tree mostra a CADEIA de dependências.
# Use isso para descobrir o pacote 'culpado' que puxa o conflito.` },
    ],
    points: [
      "Sempre LEIA a primeira mensagem do erro — a raiz costuma estar no topo.",
      "USE/KEYWORD/LICENSE = '--autounmask-write' + 'dispatch-conf' resolve quase tudo.",
      "Slot conflict = duas versões do mesmo slot sendo puxadas; fixe versão com '='.",
      "Blocker (!!) = pacotes incompatíveis; resolva mudando ordem de upgrade.",
      "Circular dependency = quebre instalando um lado sem USE conflitante temporariamente.",
      "'--tree --pretend' mostra QUEM puxa o pacote problemático.",
      "'--emptytree' rebuilda tudo do zero — solução nuclear de última instância.",
      "Armadilha comum: aceitar --autounmask-write cego, sem ler — pode subir tudo para testing.",
    ],
    alerts: [
      { type: "warning", content: "Antes de '--emptytree @world', faça backup ou snapshot. É uma operação que reescreve milhares de pacotes; se quebrar no meio, você fica sem sistema usável." },
      { type: "tip", content: "Mantenha o hábito: sempre rode 'emerge -pvuDN @world' antes do real. A flag -p (pretend) mostra TUDO que vai acontecer — a leitura de 30 segundos evita estragos de horas." },
      { type: "info", content: "Quando MESMO o experiente trava, o canal IRC #gentoo na Libera.Chat e o subreddit r/Gentoo são incrivelmente responsivos. Cole o erro completo (use pastebin)." },
      { type: "danger", content: "NUNCA force resolução com --nodeps achando que é mais rápido. Isso ignora dependências e te dá um sistema com binários quebrados que só vão aparecer dias depois." },
    ],
  },
];
