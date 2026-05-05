import type { Chapter } from "../types";

export const chapters: Chapter[] = [
  {
    slug: "kernel-conceitos",
    section: "kernel",
    title: "O que é o kernel e por que compilamos",
    difficulty: "iniciante",
    subtitle: "Entendendo vmlinuz, módulos, .config e por que o Gentoo deixa essa decisão na sua mão.",
    intro: `O kernel é o coração de qualquer sistema Linux. Ele é o programa que conversa diretamente com o hardware: lê do disco, escreve na tela, fala com a placa de rede, gerencia memória e dá tempo de processador para cada aplicativo. Tudo o que você roda no Gentoo (o shell, o navegador, o KDE) é apenas um cliente que pede favores ao kernel via chamadas de sistema. Sem kernel, nem o terminal abre.

Em distribuições como Ubuntu ou Fedora, o kernel já vem pronto, gigantesco, com suporte a praticamente todo hardware existente. No Gentoo é diferente: você decide o que entra. Pode compilar um kernel monolítico (tudo embutido no executável final, chamado 'vmlinuz') ou modular (com pedaços em arquivos .ko que são carregados sob demanda). A maioria dos usuários usa um híbrido: o essencial embutido para dar boot, o resto como módulo.

Os arquivos importantes ficam em /usr/src/linux (link simbólico para a versão atual), /boot/vmlinuz-* (o kernel compilado), /boot/System.map-* (tabela de símbolos para debug) e o próprio .config (a 'planta' que descreve cada uma das milhares de opções escolhidas). Neste capítulo você vai entender esse vocabulário antes de partir para a compilação. Se você vem do Arch ou do Debian, pense no kernel do Gentoo como um terno sob medida em vez de um pronto-de-loja.`,
    codes: [
      { lang: "bash", code: `# Ver qual kernel está rodando agora.
uname -r
# saída exemplo: 6.6.21-gentoo

# Ver detalhes completos: arquitetura, data de compilação, etc.
uname -a
# Linux meu-pc 6.6.21-gentoo #1 SMP PREEMPT_DYNAMIC ... x86_64 GNU/Linux` },
      { lang: "bash", code: `# Os arquivos do kernel ativo no /boot:
ls -lh /boot/
# vmlinuz-6.6.21-gentoo      <- kernel compilado (bootável)
# System.map-6.6.21-gentoo   <- mapa de símbolos para debug
# config-6.6.21-gentoo       <- cópia do .config usado
# initramfs-6.6.21-gentoo    <- imagem inicial em RAM (opcional)` },
      { lang: "bash", code: `# Ver módulos carregados neste momento.
lsmod | head
# Module                  Size  Used by
# nvidia_drm             77824  4
# snd_hda_intel          61440  9
# btrfs                1830912  1

# Carregar/descarregar manualmente:
sudo modprobe nome_do_modulo
sudo modprobe -r nome_do_modulo` },
      { lang: "bash", code: `# Ver opções com que o kernel atual foi compilado:
zcat /proc/config.gz | head        # se CONFIG_IKCONFIG_PROC=y
# ou direto do arquivo salvo no boot:
grep CONFIG_BTRFS /boot/config-\$(uname -r)
# CONFIG_BTRFS_FS=m   (m = módulo, y = builtin, # = desabilitado)` },
      { lang: "bash", code: `# Ver mensagens do kernel (incluindo erros e detecção de hardware).
sudo dmesg | tail -30
# Exemplos típicos:
# [    0.000000] Linux version 6.6.21-gentoo ...
# [    1.234567] usb 1-2: new high-speed USB device number 3` },
    ],
    points: [
      "O kernel é o intermediário entre seu software e o hardware da máquina.",
      "vmlinuz é o kernel já compilado e compactado pronto para boot.",
      "Módulos (.ko) são partes do kernel carregadas sob demanda em /lib/modules/<versao>/.",
      "y = builtin (dentro do vmlinuz), m = módulo, n = desativado, no .config.",
      "System.map ajuda a decifrar mensagens de panic; mantenha junto do vmlinuz.",
      "uname -r mostra o kernel ativo; pode diferir do mais recente compilado.",
      "Armadilha comum: achar que recompilar o kernel é obrigatório no Gentoo moderno (não é, há sys-kernel/gentoo-kernel-bin).",
      "Iniciante comum: confundir o link /usr/src/linux (fontes) com /boot/vmlinuz (binário).",
    ],
    alerts: [
      { type: "info", content: "O nome 'vmlinuz' vem de 'Virtual Memory LINUx gZipped'. É o mesmo kernel ELF, só comprimido para caber confortavelmente no /boot." },
      { type: "tip", content: "Habilite CONFIG_IKCONFIG e CONFIG_IKCONFIG_PROC no kernel para ter o .config sempre acessível em /proc/config.gz. Ajuda muito quando você esquece o que ativou." },
      { type: "warning", content: "Nunca apague o kernel antigo de /boot logo após compilar um novo. Mantenha pelo menos um anterior para conseguir bootar caso o novo dê problema." },
      { type: "success", content: "Compilar kernel parece intimidador, mas a configuração padrão do gentoo-sources já dá boot na maioria das máquinas modernas. Você customiza com calma depois." },
    ],
  },
  {
    slug: "fontes-kernel",
    section: "kernel",
    title: "Escolhendo as fontes do kernel",
    difficulty: "iniciante",
    subtitle: "gentoo-sources, vanilla-sources, zen, liquorix e como o eselect organiza tudo.",
    intro: `No Gentoo, o código-fonte do kernel não vem por mágica: você instala um pacote da categoria sys-kernel que descompacta as fontes em /usr/src/linux-<versao>. Existem várias 'sabores' de fonte porque a comunidade Linux mantém múltiplos forks do kernel oficial (chamado 'mainline' ou 'vanilla'), cada um com patches próprios para casos específicos: latência menor para áudio, agendador focado em jogos, suporte a hardware experimental, etc.

A escolha mais comum é o sys-kernel/gentoo-sources, que é o vanilla com um conjunto pequeno e cuidadoso de patches do projeto Gentoo (fixes de estabilidade e algumas melhorias de hardware). Já o sys-kernel/vanilla-sources é literalmente o que o Linus Torvalds publica, sem nenhum patch. O sys-kernel/zen-sources e o liquorix são voltados para desktop responsivo, com agendadores e tunings agressivos. Para a maioria dos servidores e desktops, gentoo-sources é a aposta segura.

O comando que orquestra qual fonte está 'ativa' (ou seja, para onde aponta o link /usr/src/linux) é o 'eselect kernel'. O eselect é o canivete suíço de seleção do Gentoo: você usa ele também para profile, opengl, python e muitos outros. Neste capítulo você vai instalar fontes, listar versões disponíveis e apontar o link simbólico para a versão correta antes de compilar.`,
    codes: [
      { lang: "bash", code: `# Instalar a fonte mais comum: gentoo-sources (vanilla + patches Gentoo).
sudo emerge --ask sys-kernel/gentoo-sources

# Após o emerge, as fontes ficam em /usr/src/linux-<versao>:
ls /usr/src/
# linux           <- link simbólico
# linux-6.6.21-gentoo
# linux-6.6.30-gentoo` },
      { lang: "bash", code: `# Listar versões instaladas e ver qual está selecionada.
sudo eselect kernel list
# Available kernel symlink targets:
#   [1]   linux-6.6.21-gentoo
#   [2]   linux-6.6.30-gentoo *

# Trocar o link para uma versão específica:
sudo eselect kernel set 1
# agora /usr/src/linux aponta para linux-6.6.21-gentoo` },
      { lang: "bash", code: `# Outras fontes populares (instale só uma por vez para começar).
sudo emerge --ask sys-kernel/vanilla-sources    # 100% upstream
sudo emerge --ask sys-kernel/zen-sources        # tuning desktop
sudo emerge --ask sys-kernel/git-sources        # versão de desenvolvimento

# Para latência baixa (áudio profissional), considere o liquorix
# (disponível em overlays como ::liquorix).` },
      { lang: "ini", code: `# Atalho para quem quer pular toda a compilação:
# sys-kernel/gentoo-kernel        -> fontes + .config padrão + auto-build
# sys-kernel/gentoo-kernel-bin    -> kernel JÁ compilado, instalado direto

# Ative no /etc/portage/package.use/kernel:
sys-kernel/gentoo-kernel-bin -initramfs` },
      { lang: "bash", code: `# Ver quais fontes existem antes de instalar:
emerge --search "%^sys-kernel/.*-sources\\$"

# Limpar fontes antigas para liberar disco (cuidado, veja capítulo 9):
sudo emerge --depclean sys-kernel/gentoo-sources` },
    ],
    points: [
      "gentoo-sources é o padrão recomendado: vanilla + patches conservadores do projeto.",
      "vanilla-sources entrega exatamente o que o Linus publica, sem nada a mais.",
      "zen-sources e liquorix focam em desktop responsivo e baixa latência.",
      "eselect kernel set N define para onde /usr/src/linux aponta.",
      "Múltiplas versões podem coexistir em /usr/src/ — útil para reverter se preciso.",
      "gentoo-kernel-bin instala um kernel pré-compilado, ideal para iniciantes ou servidores.",
      "Armadilha comum: instalar fontes novas e esquecer de rodar eselect kernel set para apontar o link.",
      "Iniciante comum: tentar dar 'rm -rf /usr/src/linux' e quebrar o link em vez do diretório real.",
    ],
    alerts: [
      { type: "tip", content: "Acrescente 'symlink' à USE da fonte (USE='symlink') para que o emerge atualize o link /usr/src/linux automaticamente após o install. Evita um eselect manual." },
      { type: "info", content: "As fontes ocupam de 1.5 a 3 GiB cada. Se o /usr é separado e pequeno, planeje o espaço antes de instalar três versões em paralelo." },
      { type: "warning", content: "Nunca trabalhe diretamente em /usr/src/linux sem checar onde o link aponta. Você pode acabar editando o .config da versão errada e ficar perplexo com o resultado." },
      { type: "success", content: "Para quem só quer um Gentoo funcional sem se aprofundar agora, gentoo-kernel-bin compila zero coisa e dá boot em minutos. Você sempre pode trocar para sources depois." },
    ],
  },
  {
    slug: "genkernel",
    section: "kernel",
    title: "genkernel: compilação assistida",
    difficulty: "iniciante",
    subtitle: "A forma menos dolorosa de compilar um kernel funcional sem entender cada opção.",
    intro: `O genkernel é uma ferramenta oficial do Gentoo que automatiza tudo o que costuma assustar quem está começando: ele detecta hardware, escolhe um .config razoável, compila o kernel, gera o initramfs, instala em /boot e até atualiza o GRUB se você pedir. Em outras palavras, ele faz o que o instalador do Ubuntu faz por baixo dos panos quando você roda apt install linux-image-generic.

A diferença é que o resultado é um kernel parecido com o de uma distro tradicional: grande, com muitos drivers compilados como módulos, com initramfs gigante. Não é o ideal de quem busca otimização extrema, mas é perfeito para tirar o sistema do chão na primeira vez, em hardware desconhecido ou em situações onde você só precisa que funcione e pronto. Muita gente usa genkernel no primeiro boot e migra para configuração manual depois que o sistema está estável.

O comando principal é 'genkernel all' (compila tudo) ou 'genkernel kernel' (só o kernel, sem initramfs). Ele lê /etc/genkernel.conf para opções padrão e aceita flags como --menuconfig (abrir o menu de config antes), --makeopts (paralelismo) e --install (copiar para /boot). Se você combina genkernel com gentoo-sources, tem o melhor dos dois mundos: fonte oficial com patches do Gentoo e build automatizado.`,
    codes: [
      { lang: "bash", code: `# Instalar o genkernel.
sudo emerge --ask sys-kernel/genkernel

# Build completo: kernel + módulos + initramfs, instala em /boot.
sudo genkernel all
# Demora de 20 min a 2 horas dependendo do CPU e do .config.` },
      { lang: "bash", code: `# Compilar passando por menuconfig (você revê opções antes do build).
sudo genkernel --menuconfig all

# Especificar paralelismo (n+1 threads onde n = núcleos):
sudo genkernel --makeopts="-j\$(nproc)" all

# Reaproveitar .config de um kernel anterior:
sudo genkernel --kernel-config=/boot/config-6.6.21-gentoo all` },
      { lang: "ini", code: `# /etc/genkernel.conf — opções padrão úteis (descomente as que quiser).
MAKEOPTS="-j8"
LVM="yes"            # se você usa LVM
LUKS="yes"           # se você usa cifragem
BTRFS="yes"          # se a raiz é btrfs
MOUNTBOOT="yes"      # monta /boot automaticamente antes de instalar
SAVE_CONFIG="yes"    # salva o .config em /etc/kernels/` },
      { lang: "bash", code: `# Gerar APENAS o initramfs (útil quando atualizou só dracut/firmware).
sudo genkernel --install initramfs

# Pular initramfs (sistema simples sem LVM/LUKS/RAID):
sudo genkernel --no-ramdisk-modules all` },
      { lang: "bash", code: `# Após compilar, sempre confira o /boot:
ls -lh /boot/
# vmlinuz-6.6.21-gentoo
# initramfs-6.6.21-gentoo.img
# System.map-6.6.21-gentoo
# config-6.6.21-gentoo

# E atualize o GRUB para gerar uma entrada nova:
sudo grub-mkconfig -o /boot/grub/grub.cfg` },
    ],
    points: [
      "genkernel automatiza compilação, instalação e initramfs — bom no primeiro boot.",
      "'genkernel all' faz o caminho completo: kernel + módulos + initramfs + cópia para /boot.",
      "--menuconfig deixa você revisar antes do build sem perder a automação posterior.",
      "Use --makeopts='-jN' para paralelizar (N normalmente igual ao número de núcleos).",
      "/etc/genkernel.conf guarda os defaults — edite uma vez e esqueça.",
      "Sempre rode grub-mkconfig depois para a entrada nova aparecer no menu de boot.",
      "Armadilha comum: esquecer de montar o /boot antes de rodar e o kernel ir pro lugar errado.",
      "Iniciante comum: rodar genkernel sem ter feito eselect kernel set, compilando a versão errada.",
    ],
    alerts: [
      { type: "tip", content: "Para a primeira instalação, comece com 'genkernel all'. Depois que estiver no sistema rodando, parta para configuração manual reaproveitando o .config gerado em /etc/kernels/." },
      { type: "warning", content: "O initramfs do genkernel é genérico e ocupa bastante espaço. Em sistemas com /boot pequeno (200 MiB), você pode estourar a partição rapidamente." },
      { type: "info", content: "Se sua raiz é em LUKS, LVM ou btrfs com subvolume, certifique-se de habilitar as opções correspondentes em /etc/genkernel.conf — sem elas o initramfs não monta a raiz e o boot trava." },
      { type: "success", content: "Existe também o sys-kernel/dracut, alternativa moderna ao genkernel só para gerar initramfs. Muitos veteranos preferem a combinação 'compila à mão + dracut'." },
    ],
  },
  {
    slug: "manual-config",
    section: "kernel",
    title: "Configuração manual com menuconfig",
    difficulty: "intermediario",
    subtitle: "Editando o .config sob medida com 'make menuconfig' e descobrindo o que cada opção faz.",
    intro: `Aqui mora a alma do Gentoo: configurar o kernel manualmente. Pode parecer assustador (são literalmente milhares de opções), mas a interface 'menuconfig' é organizada por categorias e quase toda opção tem uma descrição embutida. A meta é ativar o suficiente para a sua máquina dar boot e usar todo o hardware, sem entupir o vmlinuz com drivers que você nunca vai usar. O resultado é um kernel menor, mais rápido para carregar e mais fácil de manter.

A receita básica é: descobrir seu hardware (placa-mãe, CPU, GPU, rede, áudio), entrar em /usr/src/linux, abrir o menuconfig, marcar como 'y' (builtin) tudo o que é essencial para boot (controlador SATA/NVMe, sistema de arquivos da raiz, USB para teclado se for criptografado, framebuffer básico) e marcar como 'm' (módulo) o resto. Salvar, compilar com make, instalar com make modules_install && make install, e atualizar o bootloader.

Antes de menuconfig, vale olhar lspci e lsusb para mapear seu hardware, e lsmod do live USB para ver quais módulos foram carregados na live e funcionaram. Esse é o seu 'gabarito'. No primeiro kernel manual, copie o .config de um genkernel anterior (ou /proc/config.gz) e parta dele em vez de começar do zero — é exatamente o que veteranos fazem.`,
    codes: [
      { lang: "bash", code: `# Antes de tudo, mapeie o hardware.
lspci -k        # mostra cada dispositivo PCI e o módulo do kernel que o usa
lsusb           # dispositivos USB
lscpu           # detalhes do processador (vendor, flags, microarch)
# Anote: chipset SATA/NVMe, GPU, rede, áudio.` },
      { lang: "bash", code: `# Ir para as fontes e abrir o menu.
cd /usr/src/linux
sudo make menuconfig
# Use as setas para navegar. Tecla:
#   y = builtin    m = módulo    n = desabilitado
#   /  = busca por nome de opção
#   ?  = ajuda da opção atual` },
      { lang: "bash", code: `# Reaproveitar o .config atual como ponto de partida.
zcat /proc/config.gz > /usr/src/linux/.config
# OU pegar do /boot:
cp /boot/config-\$(uname -r) /usr/src/linux/.config

# Atualizar para a nova versão (responde defaults para opções novas):
cd /usr/src/linux && sudo make olddefconfig` },
      { lang: "bash", code: `# Compilar (a parte demorada).
cd /usr/src/linux
sudo make -j\$(nproc)
# tempo típico: 5-30 min dependendo do hardware

# Instalar módulos em /lib/modules/<versao>/:
sudo make modules_install

# Copiar vmlinuz, System.map e .config para /boot:
sudo make install` },
      { lang: "text", code: `# Atalhos importantes dentro do menuconfig:

[*] = ativado como builtin (y)
< > = desativado (n)
<M> = módulo (m)
< > para opções binárias

# Opções imprescindíveis para boot moderno:
General setup -> Local version (-mykernel)
Processor type -> selecione sua microarch (Intel Atom, AMD Zen3, ...)
Device Drivers -> NVMe Support [*]
File systems -> Btrfs / Ext4 / XFS [*] conforme sua raiz
Device Drivers -> Graphics support -> drivers de GPU (m ou y)` },
      { lang: "bash", code: `# Salvar o .config para reuso futuro:
sudo cp /usr/src/linux/.config /etc/kernels/config-\$(make -s kernelversion)-meu

# Diff entre dois .config para ver o que mudou:
diff /etc/kernels/config-antigo /etc/kernels/config-novo | less` },
    ],
    points: [
      "lspci -k é seu mapa: mostra hardware E o nome do módulo do kernel que cada um usa.",
      "Sempre parta de um .config existente; configurar do zero leva horas e quase ninguém faz.",
      "y = builtin (precisa antes do initramfs), m = módulo (carrega depois).",
      "make olddefconfig atualiza um .config antigo para uma versão mais nova do kernel.",
      "make -j\\$(nproc) usa todos os núcleos; sem isso a compilação é miseravelmente lenta.",
      "make modules_install instala os .ko em /lib/modules; make install copia o vmlinuz para /boot.",
      "Armadilha comum: esquecer o driver do controlador da raiz (NVMe, SATA) como builtin e o sistema não dar boot.",
      "Iniciante comum: marcar tudo como builtin 'pra garantir' e gerar um vmlinuz de 100 MiB que mal cabe no /boot.",
    ],
    alerts: [
      { type: "danger", content: "Sempre teste o novo kernel sem apagar o anterior. Mantenha a entrada antiga no GRUB para reverter caso não dê boot. Erro aqui = sistema sem boot." },
      { type: "tip", content: "Use o atalho '/' dentro do menuconfig para buscar opções pelo nome. Por exemplo, '/BTRFS' mostra todas as opções relacionadas e onde estão no menu." },
      { type: "info", content: "Existem alternativas ao menuconfig: 'make nconfig' (mais bonito), 'make xconfig' (Qt) e 'make gconfig' (GTK). Todos editam o mesmo .config." },
      { type: "warning", content: "Drivers de GPU proprietários (NVIDIA) são compilados FORA do kernel via emerge nvidia-drivers, mas dependem de opções como CONFIG_MODULE_UNLOAD. Confira antes." },
    ],
  },
  {
    slug: "modules-blacklist",
    section: "kernel",
    title: "Módulos: carregando, descarregando e bloqueando",
    difficulty: "intermediario",
    subtitle: "modprobe, /etc/modules-load.d e blacklist para conflitos como nouveau vs nvidia.",
    intro: `Módulos são pedaços do kernel que ficam em arquivos .ko separados (em /lib/modules/<versao>/) e são carregados quando alguém precisa: o kernel detecta o hardware, encontra o módulo certo no banco de dados gerado pelo depmod, e chama o modprobe internamente. Você raramente carrega módulos manualmente, mas precisa saber gerenciar quando dois módulos conflitam ou quando quer carregar um que não foi detectado automaticamente.

O caso clássico de conflito é o nouveau (driver open-source para NVIDIA, embutido no kernel) com o nvidia (proprietário, instalado via emerge nvidia-drivers). Os dois tentam tomar conta da GPU e o resultado é tela preta, X que não inicia ou kernel panic. A solução é colocar o nouveau em uma 'blacklist' — uma lista de módulos que o kernel não deve carregar automaticamente.

Os comandos do dia a dia são modprobe (carrega), modprobe -r (descarrega), lsmod (lista carregados) e modinfo (mostra metadados). A configuração permanente fica em /etc/modprobe.d/ (regras: blacklist, alias, options) e /etc/modules-load.d/ (módulos para carregar no boot). O Gentoo respeita esses dois caminhos padrão tanto em OpenRC quanto em systemd, mas o OpenRC ainda lê /etc/conf.d/modules como fonte adicional.`,
    codes: [
      { lang: "bash", code: `# Listar módulos carregados.
lsmod
# Module                  Size  Used by
# btrfs                1830912  1
# nvidia_drm             77824  4

# Detalhes de um módulo (autor, parâmetros, dependências):
modinfo nvidia
# author:    NVIDIA Corporation
# parm:      NVreg_DeviceFileMode:int
# depends:   nvidia-modeset` },
      { lang: "bash", code: `# Carregar manualmente (só persiste até o reboot).
sudo modprobe nvidia
sudo modprobe -r nvidia          # descarregar (precisa não estar em uso)

# Carregar com parâmetros:
sudo modprobe i915 modeset=1 enable_psr=0` },
      { lang: "ini", code: `# /etc/modules-load.d/meus.conf
# Um módulo por linha. Carregados automaticamente no boot.
i2c-dev
loop
nbd
v4l2loopback` },
      { lang: "ini", code: `# /etc/modprobe.d/blacklist.conf
# Bloqueia o nouveau quando se usa o driver proprietário NVIDIA.
blacklist nouveau
options nouveau modeset=0

# Para máquinas com chip Realtek que conflita:
blacklist rtl8xxxu
# (força o uso do rtl8192cu em vez disso)` },
      { lang: "ini", code: `# /etc/modprobe.d/options.conf — passar parâmetros sempre que o módulo carregar.
options snd-hda-intel power_save=1 power_save_controller=Y
options i915 enable_guc=2 enable_fbc=1
options kvm_intel nested=1` },
      { lang: "bash", code: `# OpenRC: módulos extras em /etc/conf.d/modules (legado mas suportado).
# /etc/conf.d/modules
modules="i2c-dev loop nbd"
# Depois ative o serviço:
sudo rc-update add modules boot` },
    ],
    points: [
      "modprobe é a forma correta de carregar módulos (resolve dependências), nunca insmod.",
      "lsmod mostra o que está ativo agora; modinfo mostra parâmetros disponíveis.",
      "/etc/modules-load.d/*.conf lista módulos para carregar automaticamente no boot.",
      "/etc/modprobe.d/*.conf controla blacklist, alias e options de cada módulo.",
      "Conflito clássico: nouveau (open) vs nvidia (proprietário) — bloqueie um deles.",
      "OpenRC: também aceita /etc/conf.d/modules (lista simples separada por espaço).",
      "Armadilha comum: bloquear módulo na blacklist e não rebuildar o initramfs (que ainda carrega).",
      "Iniciante comum: rodar modprobe -r em módulo em uso e ver 'Module is in use'.",
    ],
    alerts: [
      { type: "warning", content: "Blacklist em /etc/modprobe.d/ só funciona quando outra coisa tenta carregar o módulo via modprobe. Se ele estiver compilado como builtin (y) no kernel, não tem como bloquear." },
      { type: "tip", content: "Para ver porque um módulo carrega no boot, adicione 'systemd.log_level=debug' (systemd) ou 'rc_verbose=yes' (OpenRC) à linha do kernel no GRUB temporariamente." },
      { type: "info", content: "Módulos out-of-tree (como nvidia-drivers, vboxdrv, zfs) são compilados separadamente via 'emerge @module-rebuild' após cada novo kernel." },
      { type: "danger", content: "Cuidado ao colocar drivers de disco em blacklist (ahci, nvme, virtio_blk) — o sistema simplesmente não vai enxergar a raiz no próximo boot." },
    ],
  },
  {
    slug: "initramfs",
    section: "kernel",
    title: "initramfs: o ambiente mínimo de boot",
    difficulty: "intermediario",
    subtitle: "Quando você precisa, como gerar (dracut, genkernel) e como diagnosticar quando falha.",
    intro: `O initramfs é uma imagem pequena (alguns MiB a algumas dezenas) com um sistema de arquivos mínimo, um shell, alguns binários essenciais (mount, modprobe, cryptsetup, lvm) e os módulos do kernel necessários para chegar à sua raiz real. O bootloader carrega o vmlinuz E o initramfs juntos na memória; o kernel inicializa, monta o initramfs, executa um script init, faz o trabalho de localizar/abrir/montar a raiz definitiva, e aí sim 'passa o bastão' (pivot_root).

Você precisa de initramfs quando o kernel sozinho não consegue chegar à raiz. Casos típicos: raiz em LUKS (cifrada, precisa pedir senha), em LVM (precisa montar o volume lógico), em RAID por software (precisa ensamblar o array), em Btrfs com subvolume não-padrão, em ZFS, em rede (NFS root) ou quando /usr é uma partição separada. Se você tem um ext4 simples no SSD inteiro, dá para viver sem initramfs colocando os módulos certos como builtin.

Existem dois geradores principais no Gentoo: o sys-kernel/dracut (moderno, modular, padrão de várias distros) e o genkernel (já visto no capítulo 3, ainda pode gerar só o initramfs). Ambos produzem o arquivo /boot/initramfs-<versao>.img que o GRUB referencia. Configurar o initramfs corretamente para sua situação específica resolve 80% dos kernel panic 'Cannot mount root'.`,
    codes: [
      { lang: "bash", code: `# Instalar dracut (recomendado em 2024+).
sudo emerge --ask sys-kernel/dracut

# Gerar initramfs para o kernel ATIVO:
sudo dracut --force /boot/initramfs-\$(uname -r).img \$(uname -r)

# Para uma versão específica:
sudo dracut --kver 6.6.21-gentoo --force` },
      { lang: "ini", code: `# /etc/dracut.conf.d/meu.conf
# Adicionar suporte a LUKS, LVM e Btrfs no initramfs.
add_dracutmodules+=" crypt lvm btrfs "
# Comprimir com zstd (mais rápido):
compress="zstd"
# Apenas módulos do hardware atual (initramfs menor):
hostonly="yes"
hostonly_cmdline="yes"
# Incluir microcode para CPU:
early_microcode="yes"` },
      { lang: "bash", code: `# Inspecionar o conteúdo de um initramfs existente.
sudo lsinitrd /boot/initramfs-6.6.21-gentoo.img | head -40
# Mostra arquivos, módulos e scripts dentro do .img

# Listar só os módulos do kernel embutidos:
sudo lsinitrd -m /boot/initramfs-6.6.21-gentoo.img` },
      { lang: "bash", code: `# Alternativa: genkernel só para o initramfs (sem recompilar o kernel).
sudo genkernel --install initramfs

# Equivalente em uma máquina sem dracut nem genkernel: cpio manual
# (raramente feito, mas existe — veja /usr/src/linux/Documentation/admin-guide/initrd.rst)` },
      { lang: "bash", code: `# Quando dá ruim no boot, o initramfs cai em um shell de emergência.
# Comandos úteis dentro dele:
ls /dev/disk/by-uuid/        # ver discos detectados
cryptsetup open /dev/sda2 root   # abrir LUKS manualmente
mount /dev/mapper/root /sysroot
exit                          # tenta continuar o boot` },
      { lang: "bash", code: `# Sempre regenere o initramfs após:
# - atualizar o kernel
# - mudar fstab da raiz
# - habilitar/desabilitar LUKS, LVM, Btrfs subvolumes
# - atualizar microcode

sudo dracut --force --regenerate-all` },
    ],
    points: [
      "initramfs é uma mini-distro carregada antes da raiz real para 'preparar o terreno'.",
      "Necessário para LUKS, LVM, RAID, ZFS, Btrfs subvol não-padrão, /usr separado, NFS root.",
      "dracut é o gerador moderno; genkernel também serve.",
      "hostonly=yes gera um initramfs menor, só com módulos da SUA máquina.",
      "lsinitrd /boot/initramfs-*.img permite espiar o que tem dentro.",
      "Sempre regenere após atualizar kernel ou mudar configs de armazenamento.",
      "Armadilha comum: esquecer de regenerar e ficar com um initramfs apontando para módulos inexistentes.",
      "Iniciante comum: editar fstab e não notar que precisa atualizar o initramfs também.",
    ],
    alerts: [
      { type: "info", content: "Microcode da CPU (intel-microcode, amd-ucode) deve ser carregado ANTES dos módulos. Use early_microcode='yes' no dracut para isso ser feito automaticamente." },
      { type: "tip", content: "hostonly='yes' reduz drasticamente o tamanho. Mas se você troca de hardware (ex: copia o sistema para outra máquina), troque para 'no' antes." },
      { type: "warning", content: "Se você usa /usr separado em outra partição, initramfs deixa de ser opcional — vira obrigatório. systemd inclusive recusa boot sem ele nesse caso." },
      { type: "danger", content: "Não delete o initramfs antigo de /boot na hora. Se o novo der ruim, você perde o caminho para sair do problema sem live USB." },
    ],
  },
  {
    slug: "firmware",
    section: "kernel",
    title: "Firmware: os blobs que o hardware exige",
    difficulty: "intermediario",
    subtitle: "linux-firmware, EXTRA_FIRMWARE no kernel e por que sua placa wifi pede um arquivo .bin.",
    intro: `Firmware é um pequeno programa que roda DENTRO do hardware (placa de rede, GPU, controlador SSD, webcam). Em muitos dispositivos modernos, o fabricante deixa o firmware em RAM volátil e exige que o sistema operacional envie o arquivo a cada boot. O kernel não traz esses arquivos por questões legais (geralmente são proprietários, redistribuíveis mas não livres), então é responsabilidade do usuário instalá-los como um pacote separado.

No Gentoo, o pacote 'sys-kernel/linux-firmware' contém praticamente todos os firmwares que o kernel pode pedir: Intel wifi, Realtek, drivers AMD/Intel/NVIDIA GPU, Bluetooth, microcode de CPU. A maioria dos hardwares modernos não funciona sem ele. Sem o firmware, dmesg vai gritar 'firmware: failed to load iwlwifi-...ucode (-2)' e o dispositivo simplesmente não responde.

O firmware pode ser carregado de duas formas: dinamicamente (o kernel pede, o sistema lê de /lib/firmware/) ou builtin no próprio vmlinuz, via opção CONFIG_EXTRA_FIRMWARE no .config. Builtin é raramente necessário — só faz sentido para firmware que precisa estar disponível ANTES do initramfs montar o sistema de arquivos, como certos controladores de armazenamento ou tela em embarcados.`,
    codes: [
      { lang: "bash", code: `# Instalar todos os firmwares (recomendado para desktop/notebook).
sudo emerge --ask sys-kernel/linux-firmware

# Você precisa aceitar a licença antes:
# /etc/portage/package.license/firmware
sys-kernel/linux-firmware @BINARY-REDISTRIBUTABLE` },
      { lang: "bash", code: `# Ver mensagens de firmware faltando.
sudo dmesg | grep -i firmware
# Exemplos típicos:
# iwlwifi 0000:00:14.3: firmware: failed to load iwlwifi-7265D-29.ucode
# bluetooth hci0: Direct firmware load failed with error -2

# Listar firmwares instalados:
ls /lib/firmware/ | head` },
      { lang: "bash", code: `# Instalar microcode da CPU (correções de segurança e bugs).
# Intel:
sudo emerge --ask sys-firmware/intel-microcode
# AMD: já vem no linux-firmware (pasta amd-ucode/)

# Após instalar microcode, regenere o initramfs com early_microcode:
sudo dracut --force --regenerate-all` },
      { lang: "ini", code: `# /usr/src/linux/.config — embutir firmware no vmlinuz (caso especial).
CONFIG_EXTRA_FIRMWARE="rtl_nic/rtl8168g-3.fw amd-ucode/microcode_amd_fam17h.bin"
CONFIG_EXTRA_FIRMWARE_DIR="/lib/firmware"
# Útil quando: o firmware precisa estar ANTES do initramfs.
# Custo: aumenta o tamanho do vmlinuz e exige rebuild a cada update.` },
      { lang: "bash", code: `# Ver qual módulo precisa de qual firmware (descoberta).
modinfo iwlwifi | grep firmware
# firmware: iwlwifi-7265D-29.ucode
# firmware: iwlwifi-7265D-22.ucode

# Se quiser ECONOMIZAR espaço (linux-firmware tem ~700 MiB), use a USE 'savedconfig':
echo "sys-kernel/linux-firmware savedconfig" | sudo tee -a /etc/portage/package.use/firmware
# Edite /etc/portage/savedconfig/sys-kernel/linux-firmware-*` },
      { lang: "bash", code: `# Após mudar firmware, é boa prática:
# 1) regenerar initramfs (que normalmente inclui /lib/firmware necessário)
sudo dracut --force --regenerate-all
# 2) reinicializar para recarregar drivers
sudo reboot` },
    ],
    points: [
      "linux-firmware é praticamente obrigatório em hardware moderno (wifi, GPU, BT).",
      "Sem firmware, dmesg mostra 'failed to load' e o dispositivo não responde.",
      "Microcode de CPU corrige falhas de segurança (Spectre/Meltdown) — não pule.",
      "EXTRA_FIRMWARE embute no vmlinuz; só use se for absolutamente necessário no boot.",
      "Após atualizar firmware, regenere o initramfs para incluir os novos arquivos.",
      "USE='savedconfig' permite escolher só os firmwares do seu hardware (economia de disco).",
      "Armadilha comum: instalar linux-firmware mas esquecer de aceitar a licença e o emerge falha.",
      "Iniciante comum: ignorar mensagens de firmware faltando achando que é só log barulhento.",
    ],
    alerts: [
      { type: "warning", content: "Firmware é proprietário na maioria dos casos. Quem busca um sistema 100% livre precisa ficar sem certos hardwares (notavelmente wifi Intel e Broadcom)." },
      { type: "info", content: "O kernel procura firmware em /lib/firmware/ por padrão. Para mudar, use CONFIG_FW_LOADER_USER_HELPER e udev rules — raríssimo precisar." },
      { type: "tip", content: "Para diagnosticar 'wifi não funciona', sempre rode 'dmesg | grep -i firmware' antes de reinstalar driver. 90% das vezes é firmware faltando." },
      { type: "success", content: "linux-firmware é atualizado com frequência. Após cada upgrade vale rodar 'dracut --regenerate-all' e reiniciar — bugs antigos somem sozinhos." },
    ],
  },
  {
    slug: "kernel-boot",
    section: "kernel",
    title: "Boot do kernel: do GRUB ao login",
    difficulty: "intermediario",
    subtitle: "O que acontece entre apertar power e ver o prompt — e onde tudo pode dar errado.",
    intro: `Entender a sequência de boot facilita muito a vida quando algo não funciona. Resumindo: o firmware da máquina (BIOS ou UEFI) inicializa o hardware básico, encontra o bootloader (GRUB, refind, syslinux, ou o próprio EFI stub) na partição EFI ou no MBR, e o bootloader carrega na memória dois arquivos: o vmlinuz (kernel) e o initramfs.img (ambiente mínimo). O kernel descomprime, inicializa drivers builtin, monta o initramfs como raiz temporária, e executa o /init dele.

O /init do initramfs é um shell script (no caso do dracut) ou um binário (systemd-boot/initrd) que faz três trabalhos: carrega módulos extras (LUKS, LVM, drivers), encontra a raiz real (geralmente via UUID, especificado na linha do kernel pelo GRUB), monta a raiz em /sysroot e dá pivot_root. A partir desse momento, o /sbin/init real (OpenRC ou systemd) assume e começa a iniciar serviços.

Cada etapa pode falhar, e o sintoma muda: kernel panic já no início = vmlinuz quebrado ou driver builtin faltando; 'cannot mount root' = initramfs não achou a raiz (UUID errado, módulo faltando); cai em emergency shell = init do sistema teve problema. Saber em qual estágio o boot quebrou direciona onde olhar.`,
    codes: [
      { lang: "ini", code: `# /etc/default/grub — onde a linha de kernel mora.
GRUB_DEFAULT=0
GRUB_TIMEOUT=5
GRUB_DISTRIBUTOR="Gentoo"
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash"
GRUB_CMDLINE_LINUX="root=UUID=abc-123 rootflags=subvol=@ rd.luks.uuid=def-456"
# Após alterar, atualize:
# sudo grub-mkconfig -o /boot/grub/grub.cfg` },
      { lang: "text", code: `# Linha do kernel típica gerada pelo GRUB para Gentoo + Btrfs + LUKS:
linux /vmlinuz-6.6.21-gentoo \\
  root=/dev/mapper/cryptroot \\
  rootflags=subvol=@ rw \\
  rd.luks.uuid=ed5b7c... \\
  rd.luks.name=ed5b7c...=cryptroot \\
  init=/usr/lib/systemd/systemd \\
  quiet splash
initrd /initramfs-6.6.21-gentoo.img` },
      { lang: "bash", code: `# Após compilar/instalar um kernel novo, atualize o GRUB.
sudo grub-mkconfig -o /boot/grub/grub.cfg
# saída esperada:
# Generating grub configuration file ...
# Found linux image: /boot/vmlinuz-6.6.21-gentoo
# Found initrd image: /boot/initramfs-6.6.21-gentoo.img
# done` },
      { lang: "bash", code: `# Ver o que o kernel viu durante o boot (mensagens iniciais).
sudo dmesg | head -30
# [    0.000000] Linux version 6.6.21-gentoo ...
# [    0.000000] Command line: BOOT_IMAGE=/vmlinuz root=UUID=...
# [    0.123456] EFI: Loaded firmware vendor: ...

# Mensagens em ordem cronológica desde o boot atual:
journalctl -b 0 -k          # systemd
sudo dmesg -T                # OpenRC` },
      { lang: "bash", code: `# Adicionar opções de boot temporárias: aperte 'e' no menu do GRUB.
# Modifique a linha 'linux ...' e tecle Ctrl+X para bootar uma vez.
# Exemplos úteis para troubleshooting:
#   single                 -> modo monousuário
#   init=/bin/bash         -> shell direto (recovery)
#   nomodeset              -> desativa KMS (tela preta com nvidia)
#   rd.break               -> para no shell do dracut antes de pivot_root` },
    ],
    points: [
      "Sequência: BIOS/UEFI -> bootloader -> vmlinuz + initramfs -> init real.",
      "GRUB_CMDLINE_LINUX em /etc/default/grub passa parâmetros para o kernel.",
      "Sempre rode grub-mkconfig após instalar um kernel novo.",
      "root= e rd.luks.uuid são os parâmetros mais comuns para localizar a raiz.",
      "init=/bin/bash no GRUB dá shell direto para recuperação sem entrar no init real.",
      "dmesg e journalctl -b -k mostram o que o kernel viu desde o início.",
      "Armadilha comum: trocar UUID da raiz sem atualizar GRUB e perder o boot.",
      "Iniciante comum: esquecer 'rd.luks.uuid' ao migrar para LUKS e ficar preso no initramfs.",
    ],
    alerts: [
      { type: "tip", content: "Aperte 'e' no menu do GRUB para editar uma entrada apenas para o boot atual. Ótimo para testar parâmetros sem precisar reescrever /etc/default/grub." },
      { type: "info", content: "O parâmetro 'quiet' esconde mensagens do boot. Tire ele (ou adicione 'debug') quando estiver depurando — você quer ver tudo o que está acontecendo." },
      { type: "warning", content: "Não confunda /boot/grub/grub.cfg (gerado, não edite) com /etc/default/grub e /etc/grub.d/ (fontes que VOCÊ edita). Editar o cfg direto se perde no próximo grub-mkconfig." },
      { type: "danger", content: "Nunca apague entradas antigas do GRUB sem ter pelo menos uma alternativa testada. Um sistema sem entrada bootável é um sistema que precisa de live USB para voltar." },
    ],
  },
  {
    slug: "recompilar-kernel",
    section: "kernel",
    title: "Recompilando após upgrade ou mudança",
    difficulty: "intermediario",
    subtitle: "make oldconfig, manter .config entre versões e o ritual completo de upgrade.",
    intro: `Toda vez que sai uma versão nova de gentoo-sources (acontece a cada poucas semanas), o emerge baixa o novo código em /usr/src/linux-<nova-versao>, mas não compila nada — fica esperando você. Recompilar é um ritual de cinco passos, e fazer ele em ordem evita 99% dos problemas: apontar o link, copiar/atualizar o .config, compilar, instalar módulos e kernel, regenerar initramfs e atualizar GRUB.

A parte mais delicada é o .config: a versão nova quase sempre tem opções que não existiam antes. O comando 'make oldconfig' lê o .config velho e pergunta sobre cada opção nova, uma por uma — pode ser cansativo. Para acelerar, use 'make olddefconfig' que aceita os defaults silenciosamente, ou 'make oldconfig' interativo se você quer ver as novidades. Depois é só make -j$(nproc) e make modules_install && make install.

Uma boa prática é manter um diretório /etc/kernels/ com cópias dos .config que funcionaram bem em cada versão, identificados por nome. Quando algo der errado, você compara com diff e descobre rapidamente o que mudou. E nunca, jamais, apague o vmlinuz antigo de /boot logo após instalar um novo: deixe pelo menos uma versão anterior funcional para reverter.`,
    codes: [
      { lang: "bash", code: `# Receita completa após emerge sys-kernel/gentoo-sources:
# 1) Apontar o link para a nova versão.
sudo eselect kernel list
sudo eselect kernel set 2          # número da versão nova

# 2) Reaproveitar o .config anterior.
cd /usr/src/linux
sudo cp /etc/kernels/config-meu-ultimo-bom .config
sudo make olddefconfig             # aceita defaults para opções novas` },
      { lang: "bash", code: `# 3) Compilar usando todos os núcleos.
sudo make -j\$(nproc)
# tempo típico: 10-40 min

# 4) Instalar módulos e kernel.
sudo make modules_install
sudo make install
# Isso copia vmlinuz, System.map e .config para /boot.` },
      { lang: "bash", code: `# 5) Reconstruir módulos out-of-tree (nvidia, vboxdrv, zfs, etc).
sudo emerge --ask @module-rebuild

# 6) Regenerar initramfs com a nova versão.
sudo dracut --force --kver \$(make -s kernelversion)-gentoo

# 7) Atualizar o menu do GRUB.
sudo grub-mkconfig -o /boot/grub/grub.cfg` },
      { lang: "bash", code: `# Rever interativamente apenas as opções NOVAS (sem mexer nas antigas).
cd /usr/src/linux
sudo make oldconfig
# Vai perguntar uma a uma: New module CPU isolation (CPU_ISOLATION) [N/y/?] (NEW)

# Para ver o que mudou no .config entre duas versões:
diff /etc/kernels/config-velho /etc/kernels/config-novo | less` },
      { lang: "bash", code: `# Salvar este .config como referência boa antes de testar:
sudo mkdir -p /etc/kernels
sudo cp /usr/src/linux/.config /etc/kernels/config-\$(make -C /usr/src/linux -s kernelversion)-bom

# Limpar restos da compilação para liberar espaço:
cd /usr/src/linux
sudo make clean       # remove .o e binários intermediários
# (ou make mrproper para remover TUDO inclusive .config — cuidado)` },
      { lang: "bash", code: `# Se algo der ruim e você quiser voltar para uma versão anterior do kernel:
sudo eselect kernel set 1         # aponta link para a velha
cd /usr/src/linux
sudo make modules_install         # garante que /lib/modules está completo
# Reboot e selecione a entrada antiga no GRUB.` },
    ],
    points: [
      "Após emerge gentoo-sources, recompile manualmente: emerge não compila kernel sozinho.",
      "make olddefconfig herda o .config antigo aceitando defaults para opções novas.",
      "make -j\\$(nproc) usa todos os núcleos; sem -j a compilação roda em uma thread só.",
      "make modules_install + make install são duas etapas distintas — não pule nenhuma.",
      "@module-rebuild recompila módulos externos (nvidia, vboxdrv, zfs) para o novo kernel.",
      "Sempre regenere initramfs e o grub.cfg após instalar kernel novo.",
      "Armadilha comum: compilar e esquecer @module-rebuild, ficando sem nvidia ou wifi após reboot.",
      "Iniciante comum: rodar make clean ou make mrproper sem backup do .config e perder horas de configuração.",
    ],
    alerts: [
      { type: "tip", content: "Crie um shell script em /root/rebuild-kernel.sh com toda a sequência. Reduz o erro humano e padroniza o procedimento entre suas máquinas." },
      { type: "warning", content: "Sempre teste o kernel novo ANTES de remover o antigo. Ideal: deixar 2 ou 3 kernels antigos disponíveis no /boot para fallback." },
      { type: "info", content: "O Gentoo tem o ebuild sys-kernel/gentoo-kernel que pode automatizar todo esse processo. Se você quer automação tipo Arch/Debian, considere migrar." },
      { type: "success", content: "Depois das primeiras 2-3 vezes, o ciclo completo (atualizar fontes -> compilar -> reiniciar) fica mecânico e leva 15 minutos. É menos assustador do que parece." },
    ],
  },
  {
    slug: "kernel-troubleshooting",
    section: "kernel",
    title: "Quando o kernel não dá boot",
    difficulty: "intermediario",
    subtitle: "Diagnóstico passo a passo: panic, cannot mount root, módulo faltando, dracut shell.",
    intro: `Cedo ou tarde você vai compilar um kernel que não funciona. É um rito de passagem do Gentoo. A boa notícia: na maioria das vezes o problema é uma das três coisas — driver de armazenamento faltando, parâmetro errado na linha do GRUB, ou módulo necessário no initramfs ausente. A primeira regra é não entrar em pânico (justamente quando o kernel entra em panic): tem um kernel antigo no /boot, basta selecionar no GRUB e seguir investigando.

Os sintomas têm padrão: tela preta logo após o GRUB = vmlinuz quebrado ou driver de vídeo construído como builtin que está dando 'oops'; mensagem 'VFS: Cannot open root device' = kernel iniciou mas não achou o disco (driver SATA/NVMe/virtio faltando como builtin); cai em '(initramfs)' ou shell do dracut = initramfs até carregou, mas não conseguiu montar a raiz (UUID errado, LUKS não desbloqueou, subvolume btrfs incorreto); kernel panic 'not syncing: VFS' = mesma família, normalmente é problema com /init.

Quando o sistema cai em um shell do dracut, você não está perdido — você está em um Linux mínimo, com cryptsetup, lvm, mount e ls. Dali dá para inspecionar /dev, abrir LUKS manualmente, montar, e em alguns casos continuar o boot com 'exit'. E quando nada funciona, sempre tem o live USB com chroot para refazer o que estiver torto.`,
    codes: [
      { lang: "bash", code: `# Sintoma: 'Kernel panic - not syncing: VFS: Unable to mount root fs'
# Causa típica: driver da controladora de disco não está como builtin no kernel.

# Solução: bootar pelo kernel antigo, voltar ao menuconfig:
cd /usr/src/linux && sudo make menuconfig
# Device Drivers -> NVM Express block device  [*]   <- builtin, não 'm'
# Device Drivers -> Serial ATA support         [*]
# Recompile e reinstale.` },
      { lang: "bash", code: `# Sintoma: cai em shell '(initramfs)' ou 'dracut:#'
# Você está no shell de emergência do initramfs. Tente:
ls /dev/disk/by-uuid/             # confirma que o disco é visto
cat /proc/cmdline                 # ver o que o GRUB passou
modprobe nvme                     # carrega driver manualmente
cryptsetup open /dev/sda2 root    # se LUKS
mount /dev/mapper/root /sysroot
# 'exit' tenta continuar o boot a partir daqui.` },
      { lang: "bash", code: `# Recuperar via live USB (sempre tenha um por perto).
# 1) Boot pela live ISO do Gentoo (ou qualquer outra Linux).
# 2) Montar a raiz e fazer chroot:
sudo mount /dev/sda3 /mnt/gentoo
sudo mount /dev/sda1 /mnt/gentoo/boot
sudo mount --types proc /proc /mnt/gentoo/proc
sudo mount --rbind /sys /mnt/gentoo/sys
sudo mount --rbind /dev /mnt/gentoo/dev
sudo mount --rbind /run /mnt/gentoo/run
sudo cp -L /etc/resolv.conf /mnt/gentoo/etc/
sudo chroot /mnt/gentoo /bin/bash
source /etc/profile && export PS1="(chroot) \$PS1"` },
      { lang: "bash", code: `# Dentro do chroot, conserte o que estiver quebrado:
cd /usr/src/linux
make menuconfig                   # ajustar opções
make -j\$(nproc)
make modules_install && make install
dracut --force --regenerate-all
grub-mkconfig -o /boot/grub/grub.cfg
exit
# Saia do chroot e reboot.` },
      { lang: "bash", code: `# Identificar módulos faltando no initramfs:
sudo lsinitrd /boot/initramfs-6.6.21-gentoo.img | grep -E "(nvme|btrfs|luks)"
# Se não aparecer o módulo esperado, regenere com dracut:
sudo dracut --add-drivers "nvme btrfs" --force` },
      { lang: "text", code: `# Tabela de sintomas comuns -> causa provável:

Tela preta após GRUB             -> driver de vídeo conflitando, tente nomodeset
'Cannot mount root'              -> driver SATA/NVMe não builtin
'No such file or directory /init' -> initramfs corrompido, regenere
'Device or resource busy'        -> LUKS já aberto, /dev/mapper já existe
panic 'unknown filesystem ...'   -> filesystem da raiz não builtin
panic logo no início              -> Local version trocou e initramfs ficou velho` },
    ],
    points: [
      "Sempre mantenha um kernel antigo funcional em /boot — é seu paraquedas.",
      "'Cannot mount root' = driver da controladora não está builtin.",
      "Shell do dracut/(initramfs) = você ainda pode investigar e seguir o boot.",
      "init=/bin/bash na linha do GRUB dá acesso a um shell raiz para emergências.",
      "Live USB + chroot recupera de QUALQUER situação — tenha sempre uma ISO atualizada.",
      "Use lsinitrd para inspecionar o initramfs sem precisar bootar nele.",
      "Armadilha comum: assumir que problema é no kernel quando na verdade é no GRUB ou fstab.",
      "Iniciante comum: tentar 'consertar' rodando comandos aleatórios em vez de ler dmesg/cmdline primeiro.",
    ],
    alerts: [
      { type: "danger", content: "Antes de qualquer rebuild de emergência, copie o .config atual para /etc/kernels/. Já me peguei recompilando 'às cegas' depois de make mrproper acidental." },
      { type: "tip", content: "Tire 'quiet splash' temporariamente da linha do GRUB. Ver mensagens reais durante o boot economiza horas de diagnóstico." },
      { type: "info", content: "Use 'rd.shell rd.debug' nos parâmetros do GRUB para forçar um shell e logs verbose do dracut quando algo for estranho no initramfs." },
      { type: "success", content: "Toda viagem ao live USB ensina algo. Documente o que deu errado e a solução em /root/HOWTO-recovery.md — vira um manual particular precioso." },
    ],
  },
];
