import type { Chapter } from "../types";

export const chapters: Chapter[] = [
  {
    slug: "xorg-instalacao",
    section: "desktop",
    title: "Instalando o Xorg",
    difficulty: "iniciante",
    subtitle: "O servidor gráfico clássico do Linux: como colocar Xorg de pé no Gentoo.",
    intro: `Quando você instala o Gentoo seguindo o handbook, termina com um sistema só de texto. Para ter janelas, mouse, teclado gráfico, navegador e tudo o que parece um 'computador moderno', você precisa de um servidor gráfico. O mais antigo, ainda dominante em muitos setups, é o Xorg — uma implementação livre do X Window System, herança dos anos 80 que segue funcionando bem em 2024.

No Gentoo, instalar o Xorg não é só rodar um 'emerge xorg-server'. O Portage precisa saber qual é a sua placa de vídeo (variável VIDEO_CARDS no /etc/portage/make.conf) e quais dispositivos de entrada serão usados (INPUT_DEVICES). Esses valores controlam quais drivers serão compilados junto. Se você esquecer, vai acabar com um Xorg que abre tela preta e nem o mouse responde.

Neste capítulo você vai configurar make.conf, instalar o pacote meta x11-base/xorg-server, conferir se o evdev/libinput estão presentes, fazer um startx mínimo com twm e validar que o servidor sobe. Capítulos seguintes cobrem drivers específicos (Intel, AMD, NVIDIA) e ambientes completos como KDE, GNOME, XFCE, sway.`,
    codes: [
      { lang: "bash", code: `# Edite /etc/portage/make.conf antes de instalar o xorg-server.
# VIDEO_CARDS define quais drivers de GPU o Portage vai compilar.
# INPUT_DEVICES define drivers de teclado/mouse/touchpad (libinput cobre quase tudo hoje).
sudo nano /etc/portage/make.conf` },
      { lang: "conf", code: `# /etc/portage/make.conf — trecho para Xorg
# Escolha apenas o que sua máquina realmente tem (lspci -k ajuda).
VIDEO_CARDS="intel i965 iris"      # Intel moderno
# VIDEO_CARDS="amdgpu radeonsi"    # AMD moderno
# VIDEO_CARDS="nvidia"             # NVIDIA proprietário
# VIDEO_CARDS="nouveau"            # NVIDIA livre
INPUT_DEVICES="libinput"           # padrão moderno (cobre teclado, mouse, touchpad)` },
      { lang: "bash", code: `# Instale o servidor X. O pacote meta puxa o servidor e o necessário.
sudo emerge --ask x11-base/xorg-server

# Sincronize as variáveis com o sistema (só para a sessão atual):
env-update && source /etc/profile` },
      { lang: "bash", code: `# Para um teste mínimo (sem ambiente gráfico instalado), use o twm e xterm.
sudo emerge --ask x11-wm/twm x11-terms/xterm x11-apps/xclock x11-apps/xinit

# Como usuário comum (não root), rode:
startx
# Você deve ver um relógio, um xterm e o gerenciador de janelas twm.` },
      { lang: "bash", code: `# Para diagnosticar, leia o log do Xorg da sessão atual:
cat ~/.local/share/xorg/Xorg.0.log | less
# Linhas com (EE) são erros. (WW) são avisos. (II) é informativo.
# Antigamente o log ia para /var/log/Xorg.0.log — ainda existe se rodou como root.` },
    ],
    points: [
      "VIDEO_CARDS no make.conf define quais drivers de GPU serão compilados.",
      "INPUT_DEVICES=\"libinput\" cobre praticamente todos os teclados, mouses e touchpads modernos.",
      "x11-base/xorg-server é o pacote central; o resto vem como dependência.",
      "startx é o jeito mais simples de testar o X sem login manager.",
      "Logs ficam em ~/.local/share/xorg/Xorg.0.log para sessões de usuário.",
      "Linhas (EE) no log indicam erros graves; (WW) são apenas avisos.",
      "Armadilha comum: esquecer de rodar 'env-update && source /etc/profile' depois de mexer no make.conf.",
      "Iniciante comum: rodar startx como root e estranhar que não funciona como usuário depois.",
    ],
    alerts: [
      { type: "tip", content: "Antes de instalar o Xorg, rode 'lspci -k | grep -EA3 \"VGA|3D\"' para descobrir exatamente qual GPU está no seu hardware. Isso evita escolher VIDEO_CARDS errado." },
      { type: "warning", content: "Se você muda VIDEO_CARDS depois de já ter o sistema gráfico funcionando, precisa rodar 'emerge --ask --changed-use --deep @world' para recompilar pacotes que dependem da nova flag." },
      { type: "info", content: "O Xorg moderno detecta drivers automaticamente via udev e libinput. Você quase nunca precisa de um xorg.conf inteiro — no máximo arquivos pequenos em /etc/X11/xorg.conf.d/." },
      { type: "success", content: "Se o startx subiu e você viu o twm, o servidor gráfico está saudável. A partir daqui é só escolher um ambiente decente (KDE, GNOME, XFCE, sway)." },
    ],
  },
  {
    slug: "drivers-video",
    section: "desktop",
    title: "Descobrindo e configurando drivers de vídeo",
    difficulty: "iniciante",
    subtitle: "Como identificar sua GPU e escolher o conjunto certo de VIDEO_CARDS.",
    intro: `O Linux suporta uma variedade enorme de placas de vídeo, mas cada fabricante (Intel, AMD, NVIDIA) tem seu próprio conjunto de drivers — alguns livres, outros proprietários, cada um com seu nome estranho (i965, iris, amdgpu, radeonsi, nouveau, nvidia). No Gentoo, essa escolha é declarada na variável VIDEO_CARDS do /etc/portage/make.conf, e a partir dela o Portage compila apenas o que faz sentido para a sua máquina.

A pergunta de ouro é: qual GPU eu tenho de verdade? E para isso o comando 'lspci -k' é o melhor amigo do gentooísta. Ele lista cada controlador PCI e qual módulo do kernel está atualmente atendendo aquela GPU. Saber isso evita meses de frustração tentando rodar driver de Intel num laptop com NVIDIA dedicada.

Neste capítulo você aprende a identificar a GPU, escolher o VIDEO_CARDS adequado, entender a stack Mesa (que provê OpenGL e Vulkan livres), e o que muda em laptops com placa híbrida. Os capítulos seguintes mergulham em Intel, AMD e NVIDIA específicos.`,
    codes: [
      { lang: "bash", code: `# Identifique sua GPU (categoria VGA ou 3D controller).
lspci -k | grep -EA3 "VGA|3D"
# Saída típica em um laptop Intel + NVIDIA híbrido:
# 00:02.0 VGA compatible controller: Intel Corporation ...
#   Kernel driver in use: i915
# 01:00.0 3D controller: NVIDIA Corporation ...
#   Kernel driver in use: nouveau` },
      { lang: "bash", code: `# Veja todos os módulos de vídeo carregados no momento.
lsmod | grep -E "i915|amdgpu|nouveau|nvidia|radeon"

# E qual driver Mesa está ativo (depois de instalar a stack):
glxinfo -B | grep -E "OpenGL renderer|OpenGL version"
# Saída ideal: OpenGL renderer string: Mesa Intel(R) ... ou AMD ... etc.` },
      { lang: "conf", code: `# /etc/portage/make.conf — combinações comuns
# Intel HD/Iris (Haswell em diante):
VIDEO_CARDS="intel i965 iris"

# AMD GCN/RDNA (todas as Radeon modernas):
VIDEO_CARDS="amdgpu radeonsi"

# NVIDIA com driver proprietário:
VIDEO_CARDS="nvidia"

# NVIDIA com driver livre (nouveau, performance limitada):
VIDEO_CARDS="nouveau"

# Híbrido Intel + NVIDIA (laptop):
VIDEO_CARDS="intel i965 iris nvidia"` },
      { lang: "bash", code: `# Instale a stack Mesa (OpenGL/Vulkan livres).
# Praticamente todo desktop moderno depende dela.
sudo emerge --ask media-libs/mesa

# Para Vulkan e ferramentas de diagnóstico:
sudo emerge --ask media-libs/vulkan-loader media-libs/vulkan-tools mesa-utils` },
      { lang: "bash", code: `# Depois de mudar VIDEO_CARDS, recompile o que depende dele.
sudo emerge --ask --changed-use --deep @world

# Para listar pacotes afetados sem instalar (verificação prévia):
emerge --pretend --changed-use --deep @world | grep -i video` },
      { lang: "bash", code: `# Diagnóstico de aceleração 3D depois da configuração:
glxgears
# Janela com 3 engrenagens girando indica que o OpenGL está funcionando.
# Pressione Ctrl+C no terminal para encerrar e ler os FPS reportados.` },
    ],
    points: [
      "lspci -k é o ponto de partida para descobrir qual GPU sua máquina tem.",
      "VIDEO_CARDS aceita múltiplos valores separados por espaço (caso de Optimus/híbrido).",
      "Mesa fornece os drivers livres de OpenGL e Vulkan para Intel, AMD e nouveau.",
      "Para AMD moderno, sempre use 'amdgpu radeonsi' (não use mais 'radeon' antigo em GCN).",
      "Para Intel moderno (Skylake+), 'i965 iris' cobrem todas as gerações relevantes.",
      "glxinfo -B e vulkaninfo mostram o estado atual da aceleração no userspace.",
      "Armadilha comum: deixar VIDEO_CARDS vazio e ficar sem driver nenhum — Xorg sobe em modo VESA.",
      "Iniciante comum: confundir driver do kernel (módulo) com driver do userspace (Mesa/X11/Wayland).",
    ],
    alerts: [
      { type: "info", content: "VIDEO_CARDS é uma USE_EXPAND. Ela controla USE flags como video_cards_intel, video_cards_amdgpu, etc. Você pode declarar qualquer uma delas direto, mas o jeito limpo é via VIDEO_CARDS." },
      { type: "warning", content: "Em laptops com Optimus (Intel + NVIDIA híbrido), você precisa configurar PRIME ou Bumblebee para alternar entre as GPUs. Não basta listar as duas em VIDEO_CARDS." },
      { type: "tip", content: "Antes de recompilar o mundo após mexer em VIDEO_CARDS, rode 'emerge --pretend --changed-use --deep @world' para ver o impacto. Pode ser de 5 a 200 pacotes dependendo do que você muda." },
      { type: "danger", content: "Não misture o driver proprietário 'nvidia' com 'nouveau' ativos no mesmo boot. Eles brigam pelo controle da GPU e o sistema pode travar logo no startx." },
    ],
  },
  {
    slug: "intel-graphics",
    section: "desktop",
    title: "Gráficos Intel",
    difficulty: "iniciante",
    subtitle: "Configurando GPUs Intel integradas (HD, UHD, Iris, Arc) no Gentoo.",
    intro: `Praticamente todo notebook x86 vendido nos últimos 15 anos tem uma GPU integrada Intel. A boa notícia é que a Intel mantém drivers livres de excelente qualidade no kernel (módulo i915, mais recentemente xe) e no Mesa (drivers i965 para gerações antigas e iris para Haswell em diante). Isso significa que, no Gentoo, configurar Intel é geralmente o caminho mais tranquilo entre todos os fabricantes.

A configuração se resume a três frentes: o módulo do kernel (i915 já vem ligado por padrão na maioria dos kernels), o firmware (sys-kernel/linux-firmware traz GuC/HuC necessários para gerações mais novas) e a stack Mesa (com VIDEO_CARDS=\"intel i965 iris\"). Se você está em Haswell ou mais novo (Core 4ª geração para frente), o iris é o driver moderno que entrega mais performance e suporte a Vulkan.

Neste capítulo você vê como confirmar geração da sua iGPU, instalar firmware, configurar VIDEO_CARDS, ativar VAAPI para aceleração de vídeo (Netflix, YouTube, mpv) e fazer pequenos ajustes no kernel para a Intel Arc dedicada (cartão xe).`,
    codes: [
      { lang: "bash", code: `# Descubra a geração exata da sua Intel.
lspci -nn | grep -i vga
# Exemplo: Intel Corporation Alder Lake-P GT2 [Iris Xe Graphics] [8086:46a6]
# Cole esse PCI ID no Google + 'iris' para descobrir geração.

# Confirme módulo do kernel ativo:
lsmod | grep -E "^i915|^xe"` },
      { lang: "conf", code: `# /etc/portage/make.conf
VIDEO_CARDS="intel i965 iris"
# i965 cobre gerações antigas (até Haswell)
# iris cobre Haswell em diante (Gen8+)
# Listar ambos é seguro; o Mesa escolhe qual usar.

# USE flags úteis para suporte de vídeo acelerado:
USE="vaapi vdpau wayland"` },
      { lang: "bash", code: `# Instale firmware (necessário em gerações novas para GuC/HuC).
sudo emerge --ask sys-kernel/linux-firmware

# Aceite a licença caso o Portage reclame:
echo "sys-kernel/linux-firmware linux-fw-redistributable @BINARY-REDISTRIBUTABLE" \\
  | sudo tee -a /etc/portage/package.license` },
      { lang: "bash", code: `# Stack Mesa + utilitários + VAAPI.
sudo emerge --ask media-libs/mesa media-libs/libva \\
  media-libs/libva-utils media-video/intel-media-driver

# Verifique se VAAPI está exposto:
vainfo
# Saída esperada inclui linhas como:
# vainfo: Driver version: Intel iHD driver for Intel(R) Gen Graphics ...` },
      { lang: "bash", code: `# Para Intel Arc (dGPU) e gerações Lunar Lake+, o módulo é 'xe', não i915.
# No kernel, ative:
#   Device Drivers -> Graphics support -> Intel Xe Graphics

# Verifique:
zcat /proc/config.gz | grep -E "DRM_I915|DRM_XE"
# Ideal: CONFIG_DRM_I915=m e/ou CONFIG_DRM_XE=m` },
      { lang: "bash", code: `# Diagnóstico final.
glxinfo -B | grep "OpenGL renderer"
# Saída esperada:
# OpenGL renderer string: Mesa Intel(R) Iris Xe Graphics (TGL GT2)

vulkaninfo --summary | grep deviceName
# Saída esperada inclui:
# deviceName = Intel(R) Iris Xe Graphics (TGL GT2)` },
    ],
    points: [
      "Driver i915 (kernel) + iris (Mesa) é o combo padrão para Intel moderno.",
      "VIDEO_CARDS=\"intel i965 iris\" cobre desde gerações antigas até Iris Xe.",
      "linux-firmware é obrigatório em CPUs novas para inicializar GuC/HuC.",
      "VAAPI via intel-media-driver acelera decodificação de vídeo (H.264/H.265/AV1).",
      "Intel Arc usa o módulo xe — habilite CONFIG_DRM_XE no kernel.",
      "vainfo e vulkaninfo são diagnósticos rápidos para confirmar aceleração.",
      "Armadilha comum: esquecer de aceitar a license group @BINARY-REDISTRIBUTABLE para firmware.",
      "Iniciante comum: tentar instalar 'driver Intel' como na Windows; aqui basta a flag VIDEO_CARDS.",
    ],
    alerts: [
      { type: "success", content: "Intel é o caminho mais fácil no Linux: drivers livres, firmware redistribuível e suporte de fábrica no kernel. Em geral funciona já no primeiro boot da live." },
      { type: "info", content: "O driver antigo xf86-video-intel (DDX) está descontinuado. Use o backend modesetting nativo do Xorg ou nem se preocupe — em Wayland nada disso é relevante." },
      { type: "tip", content: "Para acelerar Firefox/Chromium em vídeos 4K, configure media.ffmpeg.vaapi.enabled=true no Firefox. Combinado com intel-media-driver, reduz uso de CPU em 60-80%." },
      { type: "warning", content: "Em CPUs Tiger Lake e mais novas, sem firmware GuC/HuC carregado, o iris funciona mas perde recursos (HEVC encoder, baixo consumo). Sempre tenha linux-firmware atualizado." },
    ],
  },
  {
    slug: "amd-graphics",
    section: "desktop",
    title: "Gráficos AMD",
    difficulty: "iniciante",
    subtitle: "Configurando Radeon e iGPUs AMD com drivers livres amdgpu e radeonsi.",
    intro: `Há uma década, AMD no Linux era sinônimo de dor — driver fglrx proprietário cheio de bugs, suporte a OpenGL incompleto, multi-monitor inconsistente. Hoje a história é completamente diferente. A AMD apostou todas as fichas no driver livre amdgpu (kernel) e na stack Mesa radeonsi (OpenGL) + radv (Vulkan), e o resultado é a melhor experiência gráfica do Linux para jogos e workstation.

No Gentoo, configurar AMD é direto: VIDEO_CARDS=\"amdgpu radeonsi\" no make.conf, módulo amdgpu habilitado no kernel, firmware da AMD instalado (sys-kernel/linux-firmware), e pronto. Para Vulkan, basta a USE flag 'vulkan' nos pacotes Mesa. ROCm (computação OpenCL) é mais nichado e tem pacotes próprios.

Este capítulo cobre placas Radeon dedicadas (GCN, Polaris, Vega, Navi/RDNA1-3) e iGPUs Ryzen (Vega/RDNA integrado). Você vai configurar o kernel, firmware, Mesa, ativar Vulkan via radv, e diagnosticar com glxinfo, vulkaninfo e radeontop.`,
    codes: [
      { lang: "bash", code: `# Identifique a placa Radeon ou Ryzen iGPU.
lspci -nn | grep -iE "VGA|3D" | grep -i amd
# Exemplo:
# Advanced Micro Devices, Inc. [AMD/ATI] Navi 32 [Radeon RX 7800 XT]

# Confirme módulo carregado:
lsmod | grep amdgpu` },
      { lang: "conf", code: `# /etc/portage/make.conf
VIDEO_CARDS="amdgpu radeonsi"
# amdgpu = driver moderno (GCN 1.2+ até RDNA3)
# radeonsi = driver Mesa correspondente (OpenGL/Vulkan)

USE="vaapi vdpau vulkan wayland"` },
      { lang: "bash", code: `# Kernel: ative amdgpu como módulo.
# Device Drivers -> Graphics support -> AMD GPU
# CONFIG_DRM_AMDGPU=m
# CONFIG_DRM_AMDGPU_SI=y    (Southern Islands, GCN 1)
# CONFIG_DRM_AMDGPU_CIK=y   (Sea Islands, GCN 2)

# Verifique no kernel atual:
zcat /proc/config.gz | grep AMDGPU` },
      { lang: "bash", code: `# Firmware é obrigatório (sem ele a GPU não inicializa).
sudo emerge --ask sys-kernel/linux-firmware

# Aceite a licença binária:
echo "sys-kernel/linux-firmware linux-fw-redistributable @BINARY-REDISTRIBUTABLE" \\
  | sudo tee -a /etc/portage/package.license` },
      { lang: "bash", code: `# Mesa + Vulkan radv + utilitários.
sudo emerge --ask media-libs/mesa media-libs/vulkan-loader \\
  media-libs/vulkan-tools mesa-progs sys-process/radeontop

# Para aceleração VAAPI/VDPAU (vídeo):
sudo emerge --ask x11-libs/libva-mesa-driver x11-libs/mesa-vdpau-drivers` },
      { lang: "bash", code: `# Diagnóstico:
glxinfo -B | grep "OpenGL renderer"
# Saída esperada: Mesa Radeon ... ou AMD Radeon RX ...

vulkaninfo --summary | grep deviceName
# deviceName = AMD Radeon RX 7800 XT (RADV NAVI32)

# Para monitorar uso da GPU em tempo real:
sudo radeontop` },
    ],
    points: [
      "amdgpu (kernel) + radeonsi (Mesa) é o stack padrão e excelente para AMD.",
      "Firmware via sys-kernel/linux-firmware é obrigatório — sem ele, sem boot gráfico.",
      "VIDEO_CARDS=\"amdgpu radeonsi\" no make.conf cobre tudo de GCN para frente.",
      "RADV é o driver Vulkan livre da Mesa — performa igual ou melhor que o AMDVLK proprietário.",
      "VAAPI/VDPAU via libva-mesa-driver e mesa-vdpau-drivers para vídeo acelerado.",
      "radeontop é o htop das placas AMD — útil para diagnóstico.",
      "Armadilha comum: usar VIDEO_CARDS=\"radeon\" antigo em hardware GCN+ — deixa de fora o amdgpu moderno.",
      "Iniciante comum: procurar driver proprietário 'fglrx' — está morto há anos, esqueça.",
    ],
    alerts: [
      { type: "success", content: "AMD no Linux é o caminho recomendado para quem joga. Suporte a Wayland excelente, Vulkan maduro, e tudo livre — sem bloqueios de licença ou módulos out-of-tree." },
      { type: "info", content: "Para GPUs muito antigas (HD 5000/6000, R600), o driver é 'r600' em vez de radeonsi. Use VIDEO_CARDS=\"radeon r600\" nesse caso. amdgpu não suporta esse hardware." },
      { type: "warning", content: "Para ROCm (computação OpenCL/HIP), os pacotes são separados (dev-libs/rocm-runtime e cia) e instalar exige espaço considerável. Só vá por esse caminho se for usar IA/compute." },
      { type: "tip", content: "Em laptops Ryzen com iGPU, ative AMD_PSTATE no kernel para melhor controle de frequência e bateria. Use 'sudo dmesg | grep amd_pstate' para confirmar." },
    ],
  },
  {
    slug: "nvidia-drivers",
    section: "desktop",
    title: "Drivers NVIDIA",
    difficulty: "intermediario",
    subtitle: "Proprietário (nvidia-drivers) ou livre (nouveau): qual escolher e como instalar.",
    intro: `NVIDIA é um caso à parte no Linux. Há dois caminhos: o driver proprietário 'nvidia-drivers', mantido pela própria NVIDIA, com performance excelente e suporte a CUDA, mas com licença fechada e dores de cabeça em Wayland; e o driver livre 'nouveau', mantido pela comunidade, sem CUDA, performance limitada (especialmente em Turing+, sem reclock) mas integrado ao Mesa e com Vulkan via NVK em maturação rápida em 2024.

A escolha depende do seu uso. Joga? Usa CUDA, treina IA? Quer Optimus em laptop? Vá de proprietário (x11-drivers/nvidia-drivers). Quer um sistema 100% livre, não joga, ou usa Wayland puro com hardware antigo? Nouveau pode ser suficiente. Em 2024, com NVK + GSP firmware, o livre está dando saltos, mas ainda não chega no proprietário em jogos.

Este capítulo mostra a instalação dos dois caminhos, configuração de kernel modules, blacklist do conflito (não dá para ter os dois ativos ao mesmo tempo), e o problema clássico de Optimus em notebooks.`,
    codes: [
      { lang: "bash", code: `# Identifique o modelo NVIDIA exato.
lspci -nn | grep -i nvidia
# Exemplo: NVIDIA Corporation GA106 [GeForce RTX 3060 Lite Hash Rate]

# Confirme qual driver está atualmente ativo:
lsmod | grep -E "^nvidia|^nouveau"` },
      { lang: "conf", code: `# /etc/portage/make.conf — escolha UM caminho:
# Caminho proprietário (recomendado para gaming/CUDA):
VIDEO_CARDS="nvidia"

# Caminho livre (recomendado para Wayland + hardware mais antigo):
# VIDEO_CARDS="nouveau"

USE="kmod"   # módulos do kernel para nvidia-drivers` },
      { lang: "bash", code: `# Caminho proprietário: instalação.
sudo emerge --ask x11-drivers/nvidia-drivers

# Aceite a EULA:
echo "x11-drivers/nvidia-drivers NVIDIA-r2" \\
  | sudo tee -a /etc/portage/package.license

# Adicione seu usuário ao grupo 'video':
sudo gpasswd -a SEU_USUARIO video` },
      { lang: "conf", code: `# /etc/modprobe.d/nvidia.conf
# Carrega o módulo com Modeset on (necessário para Wayland decente).
options nvidia-drm modeset=1 fbdev=1

# /etc/modprobe.d/blacklist-nouveau.conf
# Evita conflito quando o proprietário está em uso.
blacklist nouveau
options nouveau modeset=0` },
      { lang: "bash", code: `# Reconstrua o initramfs (se você usa um, ex: dracut).
sudo dracut --force

# Reboot e confirme no boot:
nvidia-smi
# Saída esperada inclui:
# +-----------------------------------------------------------------------------+
# | NVIDIA-SMI 550.xx     Driver Version: 550.xx     CUDA Version: 12.x         |
# +-----------------------------------------------------------------------------+
# | GPU  Name        Persistence-M ...
# |   0  GeForce RTX 3060   ...` },
      { lang: "bash", code: `# Caminho nouveau (livre):
sudo emerge --ask x11-drivers/xf86-video-nouveau media-libs/mesa

# No kernel, ative:
# CONFIG_DRM_NOUVEAU=m
# E firmware GSP (linux-firmware) para reclock em Turing+:
sudo emerge --ask sys-kernel/linux-firmware

# Confirme:
glxinfo -B | grep "OpenGL renderer"
# Saída esperada: Mesa NVK ... (Turing+) ou nouveau ... (Pascal-)` },
    ],
    points: [
      "Há dois mundos: x11-drivers/nvidia-drivers (proprietário) e nouveau + NVK (livre).",
      "Para gaming, CUDA, ou laptops Optimus, o proprietário é a escolha pragmática.",
      "Para sistema 100% livre e Wayland em hardware antigo, nouveau é viável.",
      "Sempre faça blacklist do driver não usado para evitar conflito no boot.",
      "modeset=1 no nvidia-drm é necessário para Wayland funcionar.",
      "nvidia-smi confirma instalação e mostra status da GPU em tempo real.",
      "Armadilha comum: instalar nvidia-drivers e esquecer de aceitar a license NVIDIA-r2.",
      "Armadilha comum: instalar nvidia-drivers sem reconstruir initramfs (dracut/genkernel) e quebrar o boot.",
    ],
    alerts: [
      { type: "warning", content: "O driver proprietário NVIDIA exige recompilação dos módulos a cada upgrade de kernel. Use 'emerge @module-rebuild' depois de instalar um kernel novo, ou habilite akmods/dkms." },
      { type: "danger", content: "Nunca tenha nouveau e nvidia carregados simultaneamente. Você terá tela preta no startx ou kernel panic. Use blacklist e remova o módulo errado de /lib/modules antes do reboot se já estragou." },
      { type: "tip", content: "Em laptops Optimus (Intel + NVIDIA), use 'optimus-manager' (overlay) ou PRIME Render Offload para alternar entre GPUs. Sem isso, a NVIDIA fica ligada o tempo todo, drenando bateria." },
      { type: "info", content: "NVK (driver Vulkan livre) já roda muitos jogos via Proton em 2024. Em GPUs Turing+ com firmware GSP carregado, performance está chegando perto do proprietário em alguns casos." },
    ],
  },
  {
    slug: "wayland-intro",
    section: "desktop",
    title: "Introdução ao Wayland",
    difficulty: "intermediario",
    subtitle: "O sucessor moderno do Xorg: arquitetura, vantagens, limitações e como adotar.",
    intro: `Por décadas, X11 (e sua implementação livre Xorg) foi o servidor gráfico padrão do Linux. Funciona, mas carrega 40 anos de decisões de design feitas para uma realidade muito diferente: terminais burros conectados a um servidor central. Em 2008, Kristian Høgsberg começou o Wayland — um protocolo novo, simples, projetado para um mundo de GPUs aceleradas, monitores de alta resolução e segurança forte entre janelas.

Wayland não é um servidor. É um protocolo. O 'servidor' (chamado compositor) é o próprio gerenciador de janelas: KWin (KDE), Mutter (GNOME), sway, Hyprland, weston. Cada compositor implementa o protocolo. Isso simplifica muita coisa — não há mais o intermediário Xorg entre o app e a tela. Resulta em menos lag, melhor suporte a HiDPI, scaling fracionário e isolamento por janela (uma app não pode espionar inputs de outra como em X11).

O custo dessa transição é compatibilidade. Apps antigas só X11 rodam via XWayland (uma camada de compatibilidade). Screen sharing exige protocolos novos (PipeWire + xdg-desktop-portal). NVIDIA proprietário só ficou estável em Wayland a partir de 2024. Este capítulo explica quando ir, quando esperar, e como configurar o básico.`,
    codes: [
      { lang: "bash", code: `# Verifique se sua sessão atual é Wayland ou X11.
echo \\$XDG_SESSION_TYPE
# wayland — você está em Wayland
# x11 — você está em Xorg

# Veja qual compositor está rodando:
echo \\$WAYLAND_DISPLAY
# wayland-0 (existe quando há Wayland)` },
      { lang: "conf", code: `# /etc/portage/make.conf — habilite Wayland globalmente.
USE="wayland"

# Para compositores específicos (sway, plasma-wayland, etc.):
# Os pacotes já trazem dependências corretas.` },
      { lang: "bash", code: `# Stack mínima para Wayland funcionar bem.
sudo emerge --ask media-libs/mesa dev-libs/wayland \\
  dev-libs/wayland-protocols x11-libs/libxkbcommon

# XWayland (compatibilidade com apps X11):
sudo emerge --ask x11-base/xwayland` },
      { lang: "bash", code: `# Diagnóstico: qual app está rodando em XWayland vs Wayland nativo?
xeyes &
# Se os olhos seguem o mouse fora da janela do app: rodando em XWayland.

# Liste janelas Wayland nativas (em sway):
swaymsg -t get_tree | grep -A2 app_id
# app_id = "firefox" (nativo) ou "Firefox" (XWayland, geralmente WM_CLASS)` },
      { lang: "bash", code: `# Para screen sharing (Discord, Zoom, OBS) em Wayland:
sudo emerge --ask media-video/pipewire \\
  sys-apps/xdg-desktop-portal sys-apps/xdg-desktop-portal-wlr

# Para KDE:
# sys-apps/xdg-desktop-portal-kde
# Para GNOME:
# sys-apps/xdg-desktop-portal-gnome` },
      { lang: "bash", code: `# Variáveis de ambiente úteis para apps em Wayland.
# Coloque em ~/.config/environment.d/wayland.conf ou similar.
MOZ_ENABLE_WAYLAND=1                 # Firefox nativo Wayland
QT_QPA_PLATFORM=wayland;xcb          # Qt prefere Wayland, fallback X11
SDL_VIDEODRIVER=wayland              # SDL2 (jogos) usa Wayland
_JAVA_AWT_WM_NONREPARENTING=1        # corrige IDEs Java em alguns WMs` },
    ],
    points: [
      "Wayland é um protocolo; o compositor (KWin, Mutter, sway) faz o papel do servidor.",
      "Sem intermediário entre app e GPU, latência de input cai e scaling fica perfeito.",
      "Apps antigas X11 rodam via XWayland — compatibilidade transparente.",
      "Screen sharing depende de PipeWire + xdg-desktop-portal (não funciona com método X11 antigo).",
      "USE=\"wayland\" no make.conf habilita backends Wayland em pacotes que suportam.",
      "NVIDIA proprietário só virou usável em Wayland a partir do driver 535+ (2023/2024).",
      "Armadilha comum: apps Electron (Discord, VSCode) rodam em XWayland por padrão — passe --enable-features=UseOzonePlatform --ozone-platform=wayland.",
      "Iniciante comum: achar que Wayland 'substitui' Xorg do dia para a noite. Coexistem, e migração é gradual.",
    ],
    alerts: [
      { type: "info", content: "Em 2024, Wayland é o padrão em GNOME e Plasma 6. Distros como Fedora e Ubuntu já entregam Wayland no boot por padrão. No Gentoo, é sua escolha." },
      { type: "warning", content: "Apps que dependem de captura de tela ou hotkeys globais X11 (xdotool, AutoKey, alguns clientes de gravação) não funcionam ou exigem alternativas Wayland (wtype, ydotool)." },
      { type: "tip", content: "Para testar Wayland sem comprometer seu setup, instale sway ao lado do KDE/GNOME atual e selecione no login manager. Voltar ao X11 é só logoff." },
      { type: "success", content: "HiDPI e scaling fracionário (125%, 150%) funcionam de forma muito melhor em Wayland. Para monitores 4K, é diferença de noite e dia." },
    ],
  },
  {
    slug: "sway",
    section: "desktop",
    title: "sway: tiling no Wayland",
    difficulty: "intermediario",
    subtitle: "Compositor tiling drop-in para i3, leve, focado em teclado e ideal para desenvolvedores.",
    intro: `sway é um compositor Wayland que reimplementa o popular gerenciador de janelas i3 com a mesma sintaxe de configuração. Se você já usou i3, vai se sentir em casa. Se não, prepare-se para uma experiência radicalmente diferente: nada de menus, painéis, cliques caça-níquel. Janelas se organizam automaticamente em tiles (lado a lado), tudo via teclado, e o foco é em produtividade pura — comum entre programadores, sysadmins e quem passa o dia em terminais.

No Gentoo, sway está disponível como gui-wm/sway. Ele depende do compositor wlroots (gui-libs/wlroots), que também é a base para Hyprland, river e outros compositores Wayland tiling. A configuração fica em ~/.config/sway/config (ou /etc/sway/config para padrão do sistema), com sintaxe declarativa simples — bind de teclas, regras de janela, output, input, tudo num arquivo só.

Este capítulo monta um sway funcional com waybar (barra de status), foot (terminal Wayland-nativo rápido), wofi (launcher), swaylock (lock screen), grim/slurp (screenshots) e mako (notificações). É um setup minimalista que cabe em menos de 200 MB de RAM.`,
    codes: [
      { lang: "bash", code: `# Instale o sway e ferramentas básicas.
sudo emerge --ask gui-wm/sway gui-apps/waybar \\
  gui-apps/foot gui-apps/wofi gui-apps/swaylock \\
  gui-apps/grim gui-apps/slurp gui-apps/mako` },
      { lang: "bash", code: `# Inicie o sway a partir do TTY (sem login manager).
# No ~/.bash_profile ou ~/.zprofile:
if [ -z "\\$WAYLAND_DISPLAY" ] && [ "\\$XDG_VTNR" = 1 ]; then
  exec sway
fi

# Para iniciar manualmente:
sway` },
      { lang: "conf", code: `# ~/.config/sway/config — exemplo mínimo
set \\$mod Mod4              # tecla Super (Windows)
set \\$term foot
set \\$menu wofi --show drun

# Bindings essenciais
bindsym \\$mod+Return exec \\$term
bindsym \\$mod+d exec \\$menu
bindsym \\$mod+Shift+q kill
bindsym \\$mod+Shift+e exec swaynag -t warning -m 'Sair?' -B 'Sim' 'swaymsg exit'

# Layouts
bindsym \\$mod+v splitv
bindsym \\$mod+b splith
bindsym \\$mod+f fullscreen

# Workspaces (Mod+1..9)
bindsym \\$mod+1 workspace 1
bindsym \\$mod+Shift+1 move container to workspace 1

# Inicia o waybar e mako
bar { swaybar_command waybar }
exec mako` },
      { lang: "conf", code: `# Configurar input (teclado, touchpad).
# ~/.config/sway/config — adicione:
input "type:keyboard" {
    xkb_layout br
    xkb_variant abnt2
    repeat_delay 250
    repeat_rate 40
}

input "type:touchpad" {
    tap enabled
    natural_scroll enabled
    dwt enabled            # disable while typing
}

output * scale 1.5         # HiDPI 150%` },
      { lang: "bash", code: `# Screenshots em sway.
# Tela inteira:
grim ~/screenshot.png

# Selecionar área com mouse:
grim -g "\\$(slurp)" ~/area.png

# Bindings recomendados no config:
# bindsym Print exec grim ~/Imagens/screenshot-\\$(date +%F-%T).png
# bindsym Shift+Print exec grim -g "\\$(slurp)" - | wl-copy` },
      { lang: "bash", code: `# Recarregar config sem fechar a sessão:
swaymsg reload
# Ou bindsym \\$mod+Shift+c reload

# Listar workspaces, outputs e janelas (debug):
swaymsg -t get_workspaces
swaymsg -t get_outputs
swaymsg -t get_tree | less` },
    ],
    points: [
      "sway é drop-in para i3 — config compatível, mesma filosofia tiling.",
      "Wayland-nativo: HiDPI, scaling fracionário e baixa latência funcionam bem.",
      "wlroots é a biblioteca compartilhada por sway, Hyprland, river — base sólida.",
      "Use foot como terminal: leve, rápido, Wayland-nativo (não usa XWayland).",
      "wl-copy / wl-paste substituem xclip / xsel para clipboard em Wayland.",
      "swaymsg permite scriptar e debugar a sessão sem fechar nada.",
      "Armadilha comum: usar terminais X11 antigos (xterm, urxvt) que rodam via XWayland — perde Wayland-nativo.",
      "Iniciante comum: achar que sway tem ícones e menus 'tipo Windows' — é teclado puro.",
    ],
    alerts: [
      { type: "tip", content: "Para iniciar app específica em workspace específico, use 'assign' ou 'for_window' no config. Exemplo: 'assign [app_id=\"firefox\"] workspace 2' coloca Firefox automaticamente no ws 2." },
      { type: "info", content: "swayidle + swaylock fazem dim+lock automático após inatividade. Configure em ~/.config/sway/config para bloqueio automático após 5 minutos." },
      { type: "warning", content: "NVIDIA proprietário só funciona com sway a partir do driver 535+ e exige a flag --unsupported-gpu. Em GPUs antigas pode haver glitches visuais." },
      { type: "success", content: "Hyprland é uma alternativa visual ao sway, com animações fluidas e blur. Mesmo wlroots por baixo, então a configuração é familiar." },
    ],
  },
  {
    slug: "plasma",
    section: "desktop",
    title: "KDE Plasma",
    difficulty: "iniciante",
    subtitle: "Ambiente desktop completo, polido, customizável e com excelente suporte a Wayland.",
    intro: `KDE Plasma é o desktop ambiente para quem quer tudo: visual polido, customização infinita, integração Wayland madura, suíte de aplicativos coesa (Dolphin, Konsole, Kate, Okular) e funcionalidades modernas como widgets, atividades, e KDE Connect. Em 2024, com a versão 6 lançada e Wayland como sessão padrão, Plasma se firmou como o desktop Linux mais ambicioso e completo.

No Gentoo, Plasma vem do meta-package kde-plasma/plasma-meta, que puxa o compositor (KWin), gerenciador de sessão, painel, configurações, login (SDDM), notificações e o necessário para uma experiência completa. A USE flag global 'wayland' é altamente recomendada — Plasma 6 prioriza Wayland e a sessão X11 é considerada legada.

Este capítulo cobre instalação, USE flags importantes (wayland, pulseaudio/pipewire, dbus, policykit), SDDM como login manager, o problema clássico do mismatched icon theme, e dicas de performance (desabilitar baloo se você não usa busca de arquivos).`,
    codes: [
      { lang: "conf", code: `# /etc/portage/make.conf — flags importantes para KDE
USE="wayland pipewire dbus policykit elogind X"
# elogind cuida da sessão de usuário em sistemas OpenRC.
# Em systemd, o systemd-logind já faz essa função.

# Para idiomas (português brasileiro):
L10N="pt-BR en"
LINGUAS="pt_BR en"` },
      { lang: "bash", code: `# Instale o Plasma completo.
sudo emerge --ask kde-plasma/plasma-meta

# Para versão mais leve, sem todos os apps:
sudo emerge --ask kde-plasma/plasma-desktop

# Login manager (SDDM é o padrão recomendado):
sudo emerge --ask x11-misc/sddm` },
      { lang: "bash", code: `# Habilite o SDDM no boot.
# OpenRC:
sudo rc-update add display-manager default

# /etc/conf.d/display-manager:
# DISPLAYMANAGER="sddm"

# systemd:
sudo systemctl enable sddm.service` },
      { lang: "bash", code: `# Aplicativos KDE essenciais (vão por baixo do meta também):
sudo emerge --ask kde-apps/dolphin kde-apps/konsole \\
  kde-apps/kate kde-apps/okular kde-apps/spectacle \\
  kde-apps/ark kde-apps/gwenview` },
      { lang: "conf", code: `# Para evitar baloo (indexador de arquivos) consumir CPU/disco:
# Em ~/.config/baloofilerc:
[Basic Settings]
Indexing-Enabled=false

# Ou via balooctl no terminal:
# balooctl disable
# balooctl purge` },
      { lang: "bash", code: `# Português brasileiro: instale traduções.
sudo emerge --ask kde-apps/kde-l10n

# Reinicie a sessão e em SDDM escolha:
# - Plasma (Wayland)  -> sessão Wayland (recomendado)
# - Plasma (X11)      -> fallback Xorg

# Ajustes de teclado br-abnt2 ficam em:
# Configurações do Sistema > Teclado > Distribuições` },
    ],
    points: [
      "kde-plasma/plasma-meta é o pacote completo com tudo do Plasma.",
      "USE=\"wayland pipewire elogind\" é praticamente obrigatório em 2024.",
      "SDDM é o login manager padrão do KDE — leve, Qt, suporta Wayland.",
      "elogind é necessário em OpenRC para gerenciar sessões; em systemd, systemd-logind já cobre.",
      "Aplicativos KDE são modulares: dolphin, konsole, kate, okular cada um separado.",
      "baloo (indexador) pode pesar; desligue se não usa busca de arquivos no painel.",
      "Armadilha comum: esquecer de habilitar o display-manager no rc-update e sair só com TTY.",
      "Iniciante comum: instalar plasma-meta sem USE=\"wayland\" e ter só sessão X11 disponível.",
    ],
    alerts: [
      { type: "tip", content: "Após instalar o Plasma, rode 'kdesystemsettings5' no terminal para abrir as configurações sem precisar do menu. Útil para ajustes rápidos via SSH+X forwarding." },
      { type: "info", content: "Plasma 6 usa Qt 6 e PipeWire por padrão. Se você ainda tem PulseAudio puro, considere migrar — Plasma 6 funciona melhor com PipeWire." },
      { type: "warning", content: "Compilar plasma-meta + dependências pode levar 4-8 horas em CPUs medianas. Considere usar binhost (binrepos.conf oficial Gentoo) para acelerar." },
      { type: "success", content: "KDE Connect (kde-misc/kdeconnect) integra seu Android com o desktop: notificações, transferência de arquivos, controle remoto de mídia. Excelente para reduzir distrações." },
    ],
  },
  {
    slug: "gnome",
    section: "desktop",
    title: "GNOME",
    difficulty: "intermediario",
    subtitle: "Desktop ambiente minimalista, opinativo, com excelente integração systemd e Wayland.",
    intro: `GNOME é o desktop oposto ao KDE em filosofia. Onde KDE oferece mil opções, GNOME esconde a maioria. Onde KDE é Qt, GNOME é GTK. A interface é minimalista, focada em produtividade e workflows touch-friendly. Para quem gosta da estética macOS-like, GNOME é candidato natural — ou para quem só quer um desktop que 'simplesmente funciona' sem ficar perdendo tempo customizando.

No Gentoo, GNOME tem uma particularidade: foi desenhado primariamente para systemd. Funciona em OpenRC com elogind no lugar de logind, mas exige cuidado extra. Pacotes como gnome-base/gnome (completo) ou gnome-base/gnome-light (sem GNOME Games e apps menos essenciais) instalam tudo, e o login manager padrão é GDM (gnome-base/gdm).

Este capítulo cobre instalação em systemd e em OpenRC+elogind, GDM, USE flags importantes (wayland, X, gtk), GNOME Tweaks (para os ajustes que o GNOME 'esconde'), e Extensions (para adicionar funcionalidades além do padrão).`,
    codes: [
      { lang: "conf", code: `# /etc/portage/make.conf — flags GNOME
USE="wayland X gtk pipewire policykit"

# Em OpenRC (não systemd), também:
USE="elogind -systemd"

# Em systemd:
USE="systemd"

L10N="pt-BR en"` },
      { lang: "bash", code: `# Instale o GNOME completo:
sudo emerge --ask gnome-base/gnome

# Versão mais leve (sem alguns apps extras):
sudo emerge --ask gnome-base/gnome-light

# GDM (login manager do GNOME):
sudo emerge --ask gnome-base/gdm` },
      { lang: "bash", code: `# Habilite GDM no boot.
# systemd:
sudo systemctl enable gdm.service

# OpenRC (com elogind):
sudo rc-update add elogind boot
sudo rc-update add dbus default
sudo rc-update add display-manager default
echo 'DISPLAYMANAGER="gdm"' | sudo tee /etc/conf.d/display-manager` },
      { lang: "bash", code: `# GNOME Tweaks: ajustes que o GNOME 'esconde' por padrão.
sudo emerge --ask gnome-extra/gnome-tweaks

# Após instalar, abra com:
gnome-tweaks
# Lá você muda fontes, animações, comportamento da janela, extensions, etc.` },
      { lang: "bash", code: `# Extensions: para adicionar funcionalidades.
sudo emerge --ask gnome-extra/gnome-shell-extensions \\
  gnome-extra/gnome-browser-connector

# Use o site:
# https://extensions.gnome.org/
# para instalar via navegador (Firefox/Chrome com plugin GNOME).` },
      { lang: "bash", code: `# Verificar se sessão é Wayland (padrão GNOME) ou X11.
echo \\$XDG_SESSION_TYPE
# wayland (esperado)

# Para forçar X11 em GDM, edite /etc/gdm/custom.conf:
# [daemon]
# WaylandEnable=false` },
    ],
    points: [
      "gnome-base/gnome traz desktop completo; gnome-light versão enxuta.",
      "GNOME funciona melhor com systemd; em OpenRC use elogind.",
      "GDM é o login manager padrão e suporta Wayland nativamente.",
      "Wayland é a sessão padrão desde GNOME 40; X11 ainda funciona como fallback.",
      "GNOME Tweaks é essencial para ajustar fontes, animações e extensions.",
      "Extensions adicionam dock, system monitor, clipboard manager — recursos não nativos.",
      "Armadilha comum: instalar GNOME em OpenRC sem habilitar elogind (sessão não inicia).",
      "Iniciante comum: estranhar que não há minimizar/maximizar nas janelas — ative em Tweaks.",
    ],
    alerts: [
      { type: "info", content: "GNOME segue uma filosofia 'opinionated' — muita coisa não tem opção, é uma escolha de design. Se você quer customizar tudo, KDE ou XFCE atendem melhor." },
      { type: "warning", content: "Extensions podem quebrar a cada major release do GNOME. Sempre verifique compatibilidade no extensions.gnome.org antes de atualizar para uma versão nova." },
      { type: "tip", content: "Para uma experiência GNOME mais 'tradicional' com botões de janela, use as extensions Dash to Panel + ArcMenu — viram Windows-like em 5 minutos." },
      { type: "success", content: "GNOME tem o melhor suporte a touchpad multi-touch do Linux. Gestos de 3 e 4 dedos são nativos em Wayland — quase paridade com macOS." },
    ],
  },
  {
    slug: "xfce",
    section: "desktop",
    title: "XFCE",
    difficulty: "iniciante",
    subtitle: "Desktop leve, estável, customizável e ideal para máquinas modestas.",
    intro: `XFCE é o desktop ambiente do meio-termo perfeito. Mais leve que KDE/GNOME, mais customizável que LXQt, e com ferramentas próprias (Thunar para arquivos, mousepad para texto, xfce4-terminal). É a escolha clássica para PCs antigos, máquinas virtuais, sistemas de baixo consumo, ou simplesmente para quem quer um desktop tradicional (Windows-like), confiável e que não muda radicalmente de versão para versão.

No Gentoo, o pacote meta é xfce-base/xfce4-meta. Ele puxa painel, gerenciador de janelas (xfwm4), gerenciador de sessões, configurações, e os componentes essenciais. XFCE é GTK-3 (caminho para GTK-4), roda exclusivamente em X11 (sem Wayland nativo, embora projetos experimentais existam), e usa lightdm como login manager por padrão.

Este capítulo monta um XFCE completo, com painéis, plugins úteis (xfce4-pulseaudio-plugin, xfce4-power-manager), aplicativos (Thunar com automount, ristretto para imagens, parole para vídeo), e dicas de tema (apresentando-se mais moderno do que o padrão entrega).`,
    codes: [
      { lang: "conf", code: `# /etc/portage/make.conf
USE="X gtk pulseaudio policykit"
# XFCE não tem suporte Wayland nativo — fica em X11.

L10N="pt-BR en"` },
      { lang: "bash", code: `# Instale o XFCE.
sudo emerge --ask xfce-base/xfce4-meta

# Login manager (LightDM é leve e tradicional):
sudo emerge --ask x11-misc/lightdm x11-misc/lightdm-gtk-greeter` },
      { lang: "bash", code: `# Habilite LightDM no boot.
# OpenRC:
sudo rc-update add display-manager default
echo 'DISPLAYMANAGER="lightdm"' | sudo tee /etc/conf.d/display-manager

# systemd:
sudo systemctl enable lightdm.service` },
      { lang: "bash", code: `# Aplicativos extras úteis para um XFCE completo.
sudo emerge --ask xfce-extra/thunar-volman \\
  xfce-extra/xfce4-pulseaudio-plugin \\
  xfce-extra/xfce4-power-manager \\
  xfce-extra/xfce4-screenshooter \\
  xfce-extra/xfce4-taskmanager \\
  media-gfx/ristretto media-video/parole` },
      { lang: "bash", code: `# Automount de pendrives via Thunar.
sudo emerge --ask sys-fs/udisks gvfs

# Para que pendrives apareçam no Thunar automaticamente:
# Já vem com xfce-extra/thunar-volman instalado.
# Habilite em: Preferências do Thunar > Volume Management.` },
      { lang: "bash", code: `# Instalar tema moderno (XFCE padrão é datado).
sudo emerge --ask x11-themes/arc-theme x11-themes/papirus-icon-theme

# Aplique em:
# Configurações > Aparência > Estilo: Arc-Dark
# Configurações > Aparência > Ícones: Papirus-Dark

# Ou via terminal:
xfconf-query -c xsettings -p /Net/ThemeName -s "Arc-Dark"
xfconf-query -c xsettings -p /Net/IconThemeName -s "Papirus-Dark"` },
    ],
    points: [
      "xfce-base/xfce4-meta é o pacote completo do XFCE.",
      "Roda só em X11 — sem Wayland nativo (em 2024 ainda).",
      "LightDM é o login manager tradicional, leve e estável.",
      "Thunar é o file manager — habilite thunar-volman para automount de USB.",
      "Use xfce4-power-manager para suspensão, brilho, eventos do botão de power.",
      "Tema padrão é datado; arc-theme + papirus-icon-theme deixam moderno.",
      "Armadilha comum: esquecer de instalar gvfs e udisks — pendrives não aparecem.",
      "Iniciante comum: confundir XFCE com LXDE/LXQt — XFCE é GTK e mais 'completo'.",
    ],
    alerts: [
      { type: "success", content: "XFCE consome cerca de 300-400 MB de RAM em idle — metade do Plasma e quase um terço do GNOME. Excelente para máquinas com 2-4 GB." },
      { type: "info", content: "XFCE 4.20 (final 2024) inicia a transição para GTK-4 e ensaios com Wayland. Por enquanto X11 continua sendo o padrão." },
      { type: "tip", content: "xfce4-genmon-plugin permite criar widgets de painel customizados executando scripts shell. Útil para mostrar IP, temperatura, status de VPN." },
      { type: "warning", content: "Se você usar XFCE em sistema OpenRC com elogind, garanta que o serviço elogind está iniciado. Sem ele, suspend/hibernate não funcionam." },
    ],
  },
  {
    slug: "lxqt",
    section: "desktop",
    title: "LXQt",
    difficulty: "iniciante",
    subtitle: "Desktop ultraleve em Qt, alternativa moderna ao XFCE para máquinas modestas.",
    intro: `LXQt é o sucessor espiritual do LXDE, reescrito em Qt 5/6 em vez de GTK. O foco é o mesmo: leveza extrema com aparência decente. Consome ainda menos memória que XFCE em alguns cenários, e por ser Qt, integra naturalmente com aplicativos KDE (Dolphin, Konsole, Okular) sem trazer o stack completo do Plasma.

A composição típica de um sistema LXQt é: painel (lxqt-panel), gerenciador de arquivos (PCManFM-Qt), terminal (qterminal), gerenciador de janelas (Openbox por padrão, mas você pode trocar por kwin-x11 ou xfwm4). É um projeto modular — você pode trocar componentes individualmente sem quebrar a integração.

Este capítulo cobre a instalação do meta-package lxqt-base/lxqt-meta, escolha do WM (Openbox vs alternativas), SDDM como login manager, e algumas customizações para um desktop minimalista mas funcional.`,
    codes: [
      { lang: "conf", code: `# /etc/portage/make.conf
USE="X qt5 qt6 pulseaudio policykit"

L10N="pt-BR en"` },
      { lang: "bash", code: `# Instale o LXQt.
sudo emerge --ask lxqt-base/lxqt-meta

# WM padrão é Openbox; instale-o:
sudo emerge --ask x11-wm/openbox

# SDDM como login manager:
sudo emerge --ask x11-misc/sddm` },
      { lang: "bash", code: `# Habilite o SDDM no boot.
# OpenRC:
sudo rc-update add display-manager default
echo 'DISPLAYMANAGER="sddm"' | sudo tee /etc/conf.d/display-manager

# systemd:
sudo systemctl enable sddm.service` },
      { lang: "bash", code: `# Customize o WM dentro do LXQt.
# Configurações > Sessão LXQt > Configurações Básicas
# > Window Manager: openbox / kwin_x11 / xfwm4

# Para usar o KWin (do KDE) com LXQt:
sudo emerge --ask kde-plasma/kwin` },
      { lang: "bash", code: `# Aplicativos extras leves combinando bem com LXQt.
sudo emerge --ask media-video/mpv \\
  www-client/qutebrowser \\
  app-editors/featherpad \\
  x11-misc/qps` },
      { lang: "bash", code: `# Verifique uso de memória pós-login.
free -h
# Em idle, LXQt costuma consumir ~250-350 MB,
# bem menos que Plasma (~600-800 MB) ou GNOME (~700-1000 MB).` },
    ],
    points: [
      "lxqt-base/lxqt-meta é o meta-package completo do LXQt.",
      "Escrito em Qt — mais leve que GTK em muitos cenários, e integra com apps KDE.",
      "WM padrão é Openbox, mas pode trocar por KWin, xfwm4, i3, etc.",
      "SDDM é o login manager natural por ser Qt.",
      "Consumo de RAM em idle: ~250-350 MB, ideal para máquinas antigas.",
      "Sem Wayland nativo (em 2024) — projeto LXQt-Wayland em desenvolvimento.",
      "Armadilha comum: instalar lxqt-meta e esquecer do WM — fica sem decoração de janela.",
      "Iniciante comum: confundir LXQt (Qt) com LXDE (GTK, descontinuado).",
    ],
    alerts: [
      { type: "info", content: "LXDE foi descontinuado em 2018 — toda a comunidade migrou para LXQt. Não instale x11-wm/lxde-meta, está obsoleto." },
      { type: "tip", content: "Para sistemas com 1-2 GB de RAM, LXQt + Openbox + qutebrowser é uma combinação que ainda permite navegar web moderna razoavelmente." },
      { type: "success", content: "Por usar Qt, você pode adicionar Dolphin, Kate, Okular do KDE sem trazer Plasma inteiro junto. Melhor de dois mundos." },
      { type: "warning", content: "Algumas funcionalidades de painel (network, bluetooth) dependem de NetworkManager e bluez instalados e habilitados como serviço." },
    ],
  },
  {
    slug: "fontes",
    section: "desktop",
    title: "Fontes no Gentoo",
    difficulty: "iniciante",
    subtitle: "Instalando, configurando e otimizando renderização de fontes.",
    intro: `Por padrão, depois de instalar o Xorg ou Wayland, seu sistema Gentoo tem um conjunto mínimo de fontes — geralmente Bitstream Vera, DejaVu e poucas outras. Tudo funciona, mas a aparência é antiga: caracteres quadradinhos, poucas opções para acentos exóticos, suporte zero a emoji. A primeira coisa que todo gentooísta faz depois de subir o desktop é instalar fontes decentes.

O Gentoo organiza fontes em pacotes na categoria media-fonts. Os essenciais são: Noto (cobertura Unicode quase completa, do Google), DejaVu (já vem mas é bom garantir), Liberation (substitutas de Arial/Times/Courier para compatibilidade com Word), JetBrains Mono ou Fira Code (programação com ligaduras), e Noto Color Emoji (para emojis em apps Wayland/GTK/Qt).

Este capítulo cobre instalação dos pacotes essenciais, fc-cache para recarregar cache, fontconfig presets (eselect fontconfig) que melhoram renderização e antialiasing global, e arquivos ~/.config/fontconfig/fonts.conf para preferências por usuário.`,
    codes: [
      { lang: "bash", code: `# Pacote essencial: Noto (cobertura Unicode quase completa).
sudo emerge --ask media-fonts/noto media-fonts/noto-emoji \\
  media-fonts/noto-cjk

# Liberation (substitutas Arial/Times/Courier):
sudo emerge --ask media-fonts/liberation-fonts

# Fontes monospace para terminal/programação:
sudo emerge --ask media-fonts/jetbrains-mono media-fonts/fira-code` },
      { lang: "bash", code: `# Recarregar cache de fontes (não é mais sempre necessário em 2024,
# mas resolve problemas de fontes não aparecendo):
fc-cache -fv

# Listar fontes instaladas:
fc-list | wc -l                        # quantidade total
fc-list | grep -i "jetbrains"          # buscar específica
fc-list :lang=pt                       # fontes que suportam pt-BR` },
      { lang: "bash", code: `# eselect fontconfig: ativa/desativa configurações globais.
eselect fontconfig list
# Saída exemplo:
# [1]  10-autohint.conf
# [2]  10-hinting-slight.conf *
# [3]  10-no-sub-pixel.conf
# [4]  10-sub-pixel-rgb.conf

# Habilite hinting + RGB subpixel para LCD:
sudo eselect fontconfig enable 10-hinting-slight.conf
sudo eselect fontconfig enable 10-sub-pixel-rgb.conf
sudo eselect fontconfig enable 11-lcdfilter-default.conf` },
      { lang: "conf", code: `# ~/.config/fontconfig/fonts.conf — preferências por usuário
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <!-- Aliases padrão: o que usar quando o app pede sans/serif/mono -->
  <alias>
    <family>sans-serif</family>
    <prefer><family>Noto Sans</family></prefer>
  </alias>
  <alias>
    <family>serif</family>
    <prefer><family>Noto Serif</family></prefer>
  </alias>
  <alias>
    <family>monospace</family>
    <prefer><family>JetBrains Mono</family></prefer>
  </alias>
</fontconfig>` },
      { lang: "bash", code: `# Após mudar fonts.conf, recarregue:
fc-cache -fv

# Verifique qual fonte real é resolvida quando se pede 'sans-serif':
fc-match sans-serif
# Saída esperada: NotoSans-Regular.ttf: "Noto Sans" "Regular"

fc-match monospace
# JetBrainsMono-Regular.ttf: "JetBrains Mono" "Regular"` },
      { lang: "bash", code: `# Fontes proprietárias da Microsoft (Arial, Times New Roman) — útil para
# compatibilidade com documentos Word.
echo "media-fonts/corefonts corefonts" | sudo tee -a /etc/portage/package.license
sudo emerge --ask media-fonts/corefonts` },
    ],
    points: [
      "media-fonts/noto + noto-emoji + noto-cjk cobrem praticamente todo Unicode.",
      "fc-cache -fv recarrega cache; fc-list lista fontes; fc-match testa resolução.",
      "eselect fontconfig habilita presets globais (hinting, subpixel).",
      "~/.config/fontconfig/fonts.conf ajusta preferências por usuário sem precisar de root.",
      "JetBrains Mono e Fira Code têm ligaduras úteis para programação.",
      "media-fonts/corefonts traz Arial/Times/Courier (proprietárias, exigem aceitar license).",
      "Armadilha comum: instalar fontes e não rodar fc-cache — apps antigos não enxergam.",
      "Iniciante comum: copiar .ttf para /usr/share/fonts manualmente em vez de usar pacote Portage.",
    ],
    alerts: [
      { type: "tip", content: "Para tipografia bonita em terminais, instale também Nerd Fonts (overlay) ou use a versão patched de JetBrains Mono Nerd Font — adiciona ícones para starship/powerline." },
      { type: "info", content: "fontconfig segue ordem alfabética dos arquivos /etc/fonts/conf.d/. Por isso os presets têm prefixos numéricos (10-, 11-, 50-). Não mude nomes." },
      { type: "warning", content: "Hinting agressivo (10-hinting-full.conf) pode deixar fontes 'rabugentas' em alta resolução. Em monitores HiDPI prefira hinting-slight ou nenhum hinting." },
      { type: "success", content: "Em 2024, Wayland apps modernos suportam emoji colorido nativo via fontconfig + Noto Color Emoji. Acaba o problema antigo de quadradinhos no lugar dos emojis." },
    ],
  },
  {
    slug: "temas",
    section: "desktop",
    title: "Temas: GTK, Qt, ícones e cursores",
    difficulty: "intermediario",
    subtitle: "Unificando aparência entre apps GTK e Qt para um desktop coeso.",
    intro: `Linux tem dois grandes mundos gráficos: GTK (usado por GNOME, XFCE, Cinnamon, e a maioria dos apps GIMP-like) e Qt (usado por KDE, LXQt, e apps como VLC, Telegram, Krita). Cada um tem seu próprio sistema de temas, e por padrão eles não conversam entre si. O resultado clássico: você instala dark mode no KDE e o Firefox aparece em modo claro, alegre e desproporcional.

Resolver isso significa instalar temas em ambos os mundos e configurar pontes. Para GTK, temas vão em /usr/share/themes/ (ou ~/.themes/). Para Qt, existem dois caminhos: kvantum (engine de tema universal Qt) e qt5ct/qt6ct (configurador que aplica tema GTK no Qt). Ícones e cursores são compartilhados via XDG (/usr/share/icons/).

Este capítulo cobre instalação de temas populares (Arc, Adwaita-dark, Papirus icons, Bibata cursors), configuração de kvantum/qt5ct para harmonizar Qt com GTK, e variável QT_QPA_PLATFORMTHEME para forçar Qt a obedecer.`,
    codes: [
      { lang: "bash", code: `# Temas GTK populares.
sudo emerge --ask x11-themes/arc-theme \\
  x11-themes/adwaita-icon-theme \\
  x11-themes/papirus-icon-theme \\
  x11-themes/bibata-cursors` },
      { lang: "bash", code: `# Para Qt obedecer tema GTK, instale qt5ct/qt6ct e kvantum.
sudo emerge --ask x11-misc/qt5ct x11-misc/qt6ct \\
  x11-themes/qtstyleplugin-kvantum

# Defina a variável de ambiente (em ~/.config/environment.d/qt.conf
# ou ~/.profile):
export QT_QPA_PLATFORMTHEME=qt5ct
# Em ambientes com Qt 6 majoritário:
# export QT_QPA_PLATFORMTHEME=qt6ct` },
      { lang: "bash", code: `# Aplicar tema GTK (em XFCE/LXQt/sway, não usa configurações nativas).
# Para sway/openbox/i3 sem Plasma/GNOME:
sudo emerge --ask gnome-extra/gnome-tweaks
# Ou use lxappearance (leve):
sudo emerge --ask x11-themes/lxappearance

# Lance:
lxappearance
# Mude widget theme, icon theme, cursor theme.` },
      { lang: "conf", code: `# ~/.config/gtk-3.0/settings.ini — config GTK-3 manual
[Settings]
gtk-theme-name=Arc-Dark
gtk-icon-theme-name=Papirus-Dark
gtk-cursor-theme-name=Bibata-Modern-Classic
gtk-cursor-theme-size=24
gtk-application-prefer-dark-theme=true
gtk-font-name=Noto Sans 11

# Mesmo conteúdo em ~/.config/gtk-4.0/settings.ini para GTK-4.` },
      { lang: "bash", code: `# Configurar Qt via qt5ct.
qt5ct
# Aba Aparência > Style: kvantum-dark (ou Adwaita-Dark via qtstyleplugin)
# Aba Ícones > Theme: Papirus-Dark
# Aba Fontes > General: Noto Sans 11

# Para Plasma, as configurações de tema vão direto em
# Configurações do Sistema > Aparência (KCM)` },
      { lang: "bash", code: `# Verifique cursor padrão atual (problema comum: cursor 'X grande feio').
cat /usr/share/icons/default/index.theme
# Se vazio ou inexistente, crie:
sudo mkdir -p /usr/share/icons/default
echo "[Icon Theme]
Inherits=Bibata-Modern-Classic" | sudo tee /usr/share/icons/default/index.theme` },
    ],
    points: [
      "GTK e Qt são mundos separados; cada um precisa de tema próprio.",
      "qt5ct/qt6ct + QT_QPA_PLATFORMTHEME forçam Qt a obedecer.",
      "kvantum é a engine universal mais flexível para temas Qt.",
      "Ícones (Papirus, Adwaita) e cursores (Bibata) são compartilhados via XDG.",
      "lxappearance é o jeito leve de configurar GTK fora de DEs completos.",
      "/usr/share/icons/default define cursor padrão do sistema.",
      "Armadilha comum: configurar tema GTK e esquecer do Qt — Telegram/VLC ficam claros num desktop dark.",
      "Iniciante comum: copiar tema baixado direto em /usr/share sem usar Portage — atualizações esquecem.",
    ],
    alerts: [
      { type: "tip", content: "Para um desktop dark coerente, instale Arc-Dark + Papirus-Dark + Bibata + qt5ct apontando para kvantum-dark. Roda 90% dos apps em modo escuro." },
      { type: "info", content: "GTK-4 ignora ~/.themes/ e só lê temas instalados em /usr/share/themes/ ou via libadwaita. Apps GNOME 42+ resistem a temas custom." },
      { type: "warning", content: "Não misture temas que dependem de versões incompatíveis (ex: Arc para GTK-2 + Arc para GTK-3 com versões muito diferentes). Use sempre o pacote Portage atualizado." },
      { type: "success", content: "Apps Electron (Discord, VSCode, Spotify) seguem o tema GTK do sistema quando rodam em XWayland/Xorg. Já em Wayland nativo, podem ignorar — depende do app." },
    ],
  },
  {
    slug: "login-managers",
    section: "desktop",
    title: "Login Managers: SDDM, GDM, LightDM, ly",
    difficulty: "iniciante",
    subtitle: "Quem te recebe na hora do login: comparativo e configuração no Gentoo.",
    intro: `O login manager (também chamado display manager) é o programa gráfico que aparece logo após o boot, pedindo usuário e senha. Ele detecta quais sessões estão instaladas (Plasma, GNOME, sway, XFCE), permite escolher entre Wayland ou X11 quando aplicável, lança a sessão escolhida e fica monitorando se a sessão cai. Sem login manager, você cai no TTY texto e precisa rodar 'startx' manualmente — funcional, mas pouco prático para uso diário.

No Gentoo, os principais são: SDDM (Qt, padrão do KDE e Wayland-friendly), GDM (GTK, padrão do GNOME, muito integrado a systemd), LightDM (leve, multi-greeter, padrão histórico do XFCE/Ubuntu), e ly (TUI minimalista, sem dependência gráfica). Você instala um e habilita via OpenRC ou systemd. Trocar é fácil — desabilita um e habilita outro.

Este capítulo apresenta os quatro, mostra quando faz sentido cada um, configurações comuns (auto-login, escolha de sessão padrão, tema), e a alternativa do startx puro para quem prefere TTY+startx.`,
    codes: [
      { lang: "bash", code: `# SDDM (recomendado para KDE e Wayland em geral).
sudo emerge --ask x11-misc/sddm

# Tema visual (sddm-kcm para configurar no Plasma):
sudo emerge --ask kde-plasma/sddm-kcm` },
      { lang: "bash", code: `# GDM (recomendado para GNOME).
sudo emerge --ask gnome-base/gdm

# LightDM (leve, ótimo para XFCE/LXQt/i3/sway).
sudo emerge --ask x11-misc/lightdm x11-misc/lightdm-gtk-greeter

# ly (TUI minimalista, < 1 MB).
sudo emerge --ask x11-misc/ly` },
      { lang: "bash", code: `# Habilitar no boot.
# OpenRC (genérico):
sudo rc-update add display-manager default

# Configure qual em /etc/conf.d/display-manager:
# DISPLAYMANAGER="sddm"  # ou gdm, lightdm, ly

# systemd (cada um tem unit específica):
sudo systemctl enable sddm.service     # ou gdm, lightdm, ly` },
      { lang: "conf", code: `# /etc/sddm.conf — exemplos úteis
[General]
HaltCommand=/usr/bin/systemctl poweroff
RebootCommand=/usr/bin/systemctl reboot
Numlock=on

[Autologin]
User=ana
Session=plasmawayland     # ou plasma, gnome, sway, xfce

[Theme]
Current=breeze
CursorTheme=Bibata-Modern-Classic` },
      { lang: "conf", code: `# /etc/lightdm/lightdm.conf — exemplo
[Seat:*]
greeter-session=lightdm-gtk-greeter
user-session=xfce
autologin-user=ana
autologin-session=xfce

# /etc/lightdm/lightdm-gtk-greeter.conf
[greeter]
theme-name = Arc-Dark
icon-theme-name = Papirus-Dark
background = /usr/share/backgrounds/wallpaper.jpg` },
      { lang: "bash", code: `# Sem login manager: startx puro.
# Em ~/.bash_profile ou ~/.zprofile (apenas no TTY1 automaticamente):
if [ -z "\\$DISPLAY" ] && [ "\\$XDG_VTNR" = 1 ]; then
  exec startx
fi

# Defina sessão em ~/.xinitrc:
# exec startplasma-x11
# exec startxfce4
# exec sway` },
    ],
    points: [
      "SDDM = KDE e Wayland; GDM = GNOME; LightDM = XFCE/leve; ly = TUI mínima.",
      "Apenas UM display manager pode rodar de cada vez — escolha e habilite.",
      "Em OpenRC, /etc/conf.d/display-manager guarda qual está ativo.",
      "Em systemd, 'systemctl enable' especifica o serviço por nome.",
      "Auto-login funciona em todos: SDDM (Autologin), GDM (custom.conf), LightDM (autologin-user).",
      "Sem display manager, startx no TTY funciona — bom para sway/i3 puristas.",
      "Armadilha comum: habilitar dois (SDDM + LightDM) e ter conflito de unit/script no boot.",
      "Iniciante comum: instalar plasma-meta sem sddm e cair no TTY achando que algo quebrou.",
    ],
    alerts: [
      { type: "tip", content: "ly é uma joia para minimalistas: TUI elegante, suporta Wayland e X11, < 1 MB de binário. Boot mais rápido que SDDM/GDM." },
      { type: "info", content: "SDDM detecta automaticamente sessões instaladas em /usr/share/wayland-sessions/ e /usr/share/xsessions/. Adicionar uma DE nova aparece sem configurar nada." },
      { type: "warning", content: "GDM exige systemd ou elogind. Em OpenRC puro, prefira SDDM ou LightDM — GDM pode dar problema com sessões e dbus." },
      { type: "success", content: "Auto-login + LUKS unlock via TPM (em sistemas modernos) dá uma experiência tipo 'liga e já está no desktop' sem comprometer disk encryption." },
    ],
  },
];
