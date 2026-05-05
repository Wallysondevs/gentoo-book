import type { Chapter } from "../types";

export const chapters: Chapter[] = [
  {
    slug: "grub2-bios",
    section: "bootloader",
    title: "GRUB2 em modo BIOS (legacy)",
    difficulty: "iniciante",
    subtitle: "Instalando o GRUB2 em máquinas antigas com firmware BIOS e tabela MBR.",
    intro: `Bootloader é o programinha que roda logo depois do firmware da placa-mãe e tem uma única missão: encontrar o kernel Linux no disco e entregar o controle para ele. Sem bootloader, o sistema não dá boot. No mundo Gentoo o mais usado é o GRUB2 (sys-boot/grub), que aceita tanto firmware BIOS antigo quanto UEFI moderno.

Este capítulo cobre o caso BIOS (também chamado de 'legacy' ou 'CSM'): aquela placa-mãe sem tela bonita de boot, com tabela de partições MBR (msdos), onde o GRUB grava parte de si mesmo no setor zero do disco e o resto numa partição. Se a sua máquina é de 2012 pra trás, ou se você desligou o UEFI propositalmente, é por aqui.

Você vai ver como declarar o alvo certo no make.conf, instalar o pacote, gravar o GRUB no disco (e não numa partição) e gerar o arquivo de configuração que lista os kernels. Vamos também olhar a saída típica para reconhecer quando o processo deu certo de verdade.`,
    codes: [
      { lang: "conf", code: `# /etc/portage/make.conf
# Diga ao Portage que queremos GRUB com suporte a BIOS legacy (pc).
GRUB_PLATFORMS="pc"` },
      { lang: "bash", code: `# Instale o GRUB2 com a USE flag correta já fixada pelo make.conf.
sudo emerge --ask sys-boot/grub:2

# Verifique a versão instalada (Gentoo costuma ter algo como 2.12).
grub-install --version` },
      { lang: "bash", code: `# Grave o GRUB no MBR do disco INTEIRO (não numa partição).
# Atenção: é /dev/sda, NÃO /dev/sda1.
sudo grub-install --target=i386-pc /dev/sda

# Saída típica de sucesso:
# Installing for i386-pc platform.
# Installation finished. No error reported.` },
      { lang: "bash", code: `# Gere /boot/grub/grub.cfg detectando os kernels em /boot.
sudo grub-mkconfig -o /boot/grub/grub.cfg

# Saída típica:
# Generating grub configuration file ...
# Found linux image: /boot/vmlinuz-6.6.21-gentoo
# Found initrd image: /boot/initramfs-6.6.21-gentoo.img
# done` },
      { lang: "conf", code: `# /etc/default/grub - ajustes comuns
GRUB_TIMEOUT=5
GRUB_DEFAULT=0
GRUB_CMDLINE_LINUX_DEFAULT="quiet"
# Para habilitar a tela colorida com framebuffer:
GRUB_GFXMODE=1024x768
GRUB_GFXPAYLOAD_LINUX=keep` },
    ],
    points: [
      "BIOS legacy usa MBR (msdos), não GPT puro; em GPT precisa de uma BIOS Boot Partition de 1 MiB sem sistema de arquivos.",
      "GRUB_PLATFORMS='pc' no make.conf precisa estar antes de instalar sys-boot/grub.",
      "Sempre rode grub-install no DISCO (/dev/sda), nunca numa partição (/dev/sda1).",
      "Depois de qualquer kernel novo, rode grub-mkconfig de novo para regenerar grub.cfg.",
      "Se mudou /etc/default/grub, também precisa rodar grub-mkconfig para refletir.",
      "Onde no Debian você usa update-grub, no Gentoo o equivalente é grub-mkconfig -o /boot/grub/grub.cfg.",
      "Armadilha comum: instalar grub na partição em vez do disco inteiro e ficar sem boot.",
      "Iniciante comum: esquecer de montar /boot antes do grub-install (se /boot é partição separada).",
    ],
    alerts: [
      { type: "danger", content: "Instalar o GRUB no disco errado pode sobrescrever o bootloader do Windows ou de outro sistema. Confira com lsblk antes de digitar /dev/sdX." },
      { type: "tip", content: "Crie um alias: alias grubup='sudo grub-mkconfig -o /boot/grub/grub.cfg'. Você vai usar toda vez que recompilar o kernel." },
      { type: "warning", content: "Se /boot é uma partição separada, ela PRECISA estar montada em /boot durante o grub-install. Caso contrário o GRUB vai gerar um grub.cfg apontando para nada." },
      { type: "info", content: "Em GPT + BIOS é obrigatório criar uma BIOS Boot Partition (gdisk type ef02) para o GRUB stage 1.5. Sem ela o grub-install reclama de 'embedding area'." },
    ],
  },
  {
    slug: "grub2-uefi",
    section: "bootloader",
    title: "GRUB2 em modo UEFI",
    difficulty: "intermediario",
    subtitle: "Instalando o GRUB2 em máquinas modernas com firmware UEFI e partição EFI (ESP).",
    intro: `Quase toda máquina vendida nos últimos dez anos usa firmware UEFI. Em vez do velho MBR de 512 bytes, o UEFI lê arquivos .efi de uma partição especial chamada ESP (EFI System Partition), formatada em FAT32 e montada normalmente em /boot ou /efi. O GRUB nessa modalidade se transforma num arquivo grubx64.efi colocado dentro dessa partição.

A vantagem é grande: dá pra ter vários bootloaders convivendo, o firmware mantém uma lista de entradas (NVRAM) e você não depende mais do setor zero do disco. A desvantagem é que aparecem novos pontos de falha: ESP montada errada, NVRAM cheia, Secure Boot ativo bloqueando o .efi não assinado.

Vamos ver como declarar GRUB_PLATFORMS='efi-64', instalar com o target correto, apontar o --efi-directory para sua ESP e usar o efibootmgr para listar e ajustar a ordem de boot do firmware. Esse é o caminho oficial do Handbook para instalações novas em hardware moderno.`,
    codes: [
      { lang: "conf", code: `# /etc/portage/make.conf
# Para UEFI 64 bits (a esmagadora maioria das máquinas modernas).
GRUB_PLATFORMS="efi-64"` },
      { lang: "bash", code: `# Instale grub e o utilitário efibootmgr (gerencia entradas NVRAM).
sudo emerge --ask sys-boot/grub:2 sys-boot/efibootmgr

# Confirme que o sistema bootou em modo UEFI:
ls /sys/firmware/efi/efivars 2>/dev/null && echo "UEFI OK" || echo "BIOS legacy"` },
      { lang: "bash", code: `# A ESP precisa estar montada. Convenção Gentoo moderna é /efi.
# (Handbook antigo usava /boot/efi. Os dois funcionam.)
sudo mkdir -p /efi
sudo mount /dev/sda1 /efi    # /dev/sda1 = sua ESP FAT32

# Acrescente em /etc/fstab algo como:
# UUID=XXXX-XXXX  /efi  vfat  umask=0077  0 2` },
      { lang: "bash", code: `# Instale o GRUB no firmware UEFI.
sudo grub-install \\
  --target=x86_64-efi \\
  --efi-directory=/efi \\
  --bootloader-id=Gentoo

# Saída típica:
# Installing for x86_64-efi platform.
# Installation finished. No error reported.` },
      { lang: "bash", code: `# Liste as entradas NVRAM gravadas no firmware:
sudo efibootmgr -v

# Exemplo:
# BootOrder: 0000,0001
# Boot0000* Gentoo  HD(1,GPT,...)/File(\\EFI\\Gentoo\\grubx64.efi)
# Boot0001* Windows Boot Manager  ...

# Mude a ordem para Gentoo primeiro:
sudo efibootmgr --bootorder 0000,0001` },
      { lang: "bash", code: `# Gere o grub.cfg como sempre (independe de BIOS/UEFI).
sudo grub-mkconfig -o /boot/grub/grub.cfg` },
    ],
    points: [
      "ESP é uma partição FAT32, tipo GPT 'EFI System' (gdisk type ef00), normalmente 512 MiB-1 GiB.",
      "Convenção moderna do Handbook: montar a ESP em /efi. Antiga: /boot/efi. Ambas funcionam.",
      "--bootloader-id define o nome da pasta dentro de \\EFI\\ e o rótulo na NVRAM.",
      "efibootmgr é o canivete suíço: lista, reordena, cria e apaga entradas de boot UEFI.",
      "Se ls /sys/firmware/efi/efivars não existe, você bootou em BIOS legacy — o target seria outro.",
      "O grub.cfg continua em /boot/grub/grub.cfg mesmo em UEFI; só o .efi vai pra ESP.",
      "Armadilha comum: esquecer de montar a ESP antes do grub-install e ele falhar com 'no such directory'.",
      "Iniciante comum: confundir 'ESP' (partição FAT32) com '/boot' (partição que guarda kernel e initramfs).",
    ],
    alerts: [
      { type: "warning", content: "Se a NVRAM da placa estiver cheia ou bugada (Lenovo antiga e algumas Dell têm fama), o efibootmgr falha em criar entrada. Use --no-nvram e copie grubx64.efi para \\EFI\\BOOT\\BOOTX64.EFI como fallback." },
      { type: "tip", content: "Para uma instalação 'à prova de NVRAM apagada', copie /efi/EFI/Gentoo/grubx64.efi para /efi/EFI/BOOT/BOOTX64.EFI. O firmware sempre tenta esse caminho como último recurso." },
      { type: "danger", content: "Nunca formate a ESP em dual-boot sem ter certeza. Você apaga o bootloader do Windows junto e ele vira tijolo até reparar pelo pendrive de instalação." },
      { type: "info", content: "Você pode ter várias instalações Linux compartilhando a mesma ESP. Cada uma usa um --bootloader-id diferente (Gentoo, Arch, Fedora) e fica numa pasta separada dentro de \\EFI\\." },
    ],
  },
  {
    slug: "efi-stub",
    section: "bootloader",
    title: "EFI Stub: bootando o kernel direto sem bootloader",
    difficulty: "avancado",
    subtitle: "Para quem quer minimalismo extremo: o kernel Linux É o executável EFI.",
    intro: `Desde a versão 3.3, o kernel Linux pode ser compilado como um binário EFI válido. Isso significa que o firmware UEFI consegue executar o vmlinuz diretamente, sem GRUB, sem syslinux, sem nada no meio. Essa funcionalidade se chama EFI Stub e é a forma mais enxuta possível de bootar.

A vantagem é simplicidade brutal: zero camadas extras, boot mais rápido, menos pontos de falha. A desvantagem é que você perde o menu de seleção de kernel, o suporte fácil a múltiplos sistemas e a recuperação amigável que o GRUB oferece. Trocar de kernel vira gravar uma nova entrada na NVRAM com efibootmgr toda vez.

É a escolha favorita de quem roda servidor enxuto, hardened, ou só gosta de ter controle total. Você vai ativar a opção CONFIG_EFI_STUB no kernel, copiar o vmlinuz para a ESP e criar a entrada NVRAM com a cmdline (root=, parâmetros) embutida. Não tem segredo, mas tem que entender bem cada passo.`,
    codes: [
      { lang: "text", code: `# Configurações do kernel obrigatórias (make menuconfig):
# Processor type and features --->
#   [*] EFI runtime service support
#   [*] EFI stub support
#   [*] EFI mixed-mode support  (opcional)
# Device Drivers --->
#   Generic Driver Options --->
#     [*] Support initial ramdisks compressed using ...

# Confira no .config gerado:
# CONFIG_EFI=y
# CONFIG_EFI_STUB=y` },
      { lang: "bash", code: `# Após compilar o kernel, copie vmlinuz e initramfs para a ESP.
sudo cp /boot/vmlinuz-6.6.21-gentoo /efi/EFI/Gentoo/vmlinuz.efi
sudo cp /boot/initramfs-6.6.21-gentoo.img /efi/EFI/Gentoo/initramfs.img

# Note: o vmlinuz já É um PE/COFF executável EFI. Só renomeie para .efi.` },
      { lang: "bash", code: `# Crie uma entrada NVRAM apontando direto para o kernel.
# /dev/sda1 = ESP. -p 1 = partição 1.
sudo efibootmgr --create \\
  --disk /dev/sda --part 1 \\
  --label "Gentoo EFI Stub" \\
  --loader '\\EFI\\Gentoo\\vmlinuz.efi' \\
  --unicode 'root=PARTUUID=abcd-1234 ro initrd=\\EFI\\Gentoo\\initramfs.img quiet'` },
      { lang: "bash", code: `# Conferindo a entrada criada:
sudo efibootmgr -v

# Saída resumida:
# Boot0003* Gentoo EFI Stub  HD(1,GPT,...)/File(\\EFI\\Gentoo\\vmlinuz.efi)
#   root=PARTUUID=abcd-1234 ro initrd=\\EFI\\Gentoo\\initramfs.img quiet` },
      { lang: "bash", code: `# Para versionar (vmlinuz-velho, vmlinuz-novo) e poder voltar:
sudo cp /boot/vmlinuz-6.6.21-gentoo /efi/EFI/Gentoo/vmlinuz-old.efi
# Crie outra entrada NVRAM apontando para vmlinuz-old.efi como fallback.` },
    ],
    points: [
      "EFI Stub elimina o bootloader: o firmware executa o kernel direto.",
      "Exige CONFIG_EFI_STUB=y no kernel (geralmente já está em gentoo-sources moderno).",
      "vmlinuz precisa ficar dentro da ESP (FAT32) — montada em /efi ou /boot/efi.",
      "Caminhos no efibootmgr usam barras invertidas no estilo Windows (\\EFI\\Gentoo\\...).",
      "Cmdline (root=, ro, quiet, etc.) vai junto da entrada NVRAM, em --unicode.",
      "Para trocar de kernel você copia o novo vmlinuz e edita a entrada — não tem grub-mkconfig.",
      "Armadilha comum: digitar barras Unix (/) no --loader e o firmware não achar nada.",
      "Iniciante comum: tentar EFI Stub sem ter ESP montada e perceber que vmlinuz nunca chegou lá.",
    ],
    alerts: [
      { type: "tip", content: "Mantenha sempre uma segunda entrada NVRAM com kernel anterior funcionando. Sem GRUB você perde o menu de fallback — ter um plano B na NVRAM é seu único safety net." },
      { type: "warning", content: "Cuidado com o tamanho da ESP. Vmlinuz + initramfs podem chegar a 100 MB cada. Se a ESP é de 100 MiB (padrão antigo do Windows), você vai ficar sem espaço rapidinho." },
      { type: "info", content: "O sd-boot (antigo systemd-boot, sys-apps/systemd-boot) é uma alternativa mais amigável que oferece menu visual mas continua simples como o EFI Stub." },
      { type: "danger", content: "Se você apagar a única entrada NVRAM e não tiver \\EFI\\BOOT\\BOOTX64.EFI de fallback, o firmware não acha mais nada para bootar. Tenha sempre um pendrive de live ISO à mão." },
    ],
  },
  {
    slug: "refind",
    section: "bootloader",
    title: "rEFInd: bootloader UEFI visual e amigável",
    difficulty: "intermediario",
    subtitle: "Uma alternativa bonita ao GRUB para quem tem múltiplos sistemas.",
    intro: `O rEFInd é um bootloader UEFI focado em uma coisa: detectar automaticamente todo SO instalado na máquina e mostrar um menu gráfico decente de escolha. Ele não compila nada, não recompila nada quando muda kernel, simplesmente varre as partições atrás de loaders e kernels conhecidos.

Para quem tem dual-boot Linux + Windows, ou várias distros experimentando ao lado da Gentoo, o rEFInd resolve com elegância o que GRUB resolve com configuração. Para máquina single-boot ele é exagero — fica com GRUB ou EFI Stub. Mas em laptop com 4 sistemas, é o cara.

Você instala via emerge, roda refind-install para copiar os arquivos para a ESP e gravar a entrada NVRAM, e pronto. Próximo boot já aparece o menu colorido. Vamos ver também como customizar o tema, esconder entradas indesejadas e ajustar o timeout do menu.`,
    codes: [
      { lang: "bash", code: `# Instale o rEFInd. Ele só funciona em UEFI.
sudo emerge --ask sys-boot/refind

# Verifique que você está em UEFI:
[ -d /sys/firmware/efi ] && echo "UEFI ok"` },
      { lang: "bash", code: `# Instale o rEFInd na ESP. O script detecta tudo sozinho.
# Ele copia arquivos para /efi/EFI/refind/ e cria entrada NVRAM.
sudo refind-install

# Saída típica:
# ShimSource is none
# Installing rEFInd on Linux...
# Copied rEFInd binary files
# ...
# Installation has completed successfully.` },
      { lang: "conf", code: `# /efi/EFI/refind/refind.conf - principais opções
timeout 10
use_nvram false           # nao alterar entradas NVRAM em cada boot
resolution 1920 1080
default_selection "Gentoo"
showtools shutdown,reboot,about,memtest

# Esconder loaders chatos do Windows recovery:
dont_scan_files bootmgfw.efi` },
      { lang: "bash", code: `# Trocar o tema visual (instale um do GitHub, ex: refind-theme-regular):
cd /efi/EFI/refind/themes
sudo git clone https://github.com/bobafetthotmail/refind-theme-regular.git

# Ative no refind.conf:
# include themes/refind-theme-regular/theme.conf` },
      { lang: "bash", code: `# Para reinstalar (se você apagou a NVRAM por exemplo):
sudo refind-install --usedefault /dev/sda1
# /dev/sda1 = sua ESP. --usedefault grava em \\EFI\\BOOT\\BOOTX64.EFI também.` },
    ],
    points: [
      "rEFInd só funciona em UEFI; em BIOS legacy use GRUB ou syslinux.",
      "Auto-detecta kernels Linux (qualquer distro), Windows Boot Manager, macOS, etc.",
      "Configuração principal: /efi/EFI/refind/refind.conf — texto simples, bem comentado.",
      "Temas vêm como pastas dentro de /efi/EFI/refind/themes/ com um theme.conf.",
      "use_nvram false evita que ele 'corrija' a ordem NVRAM em todo boot.",
      "Quando muda de kernel, não precisa fazer nada: na próxima boot o rEFInd encontra sozinho.",
      "Armadilha comum: deixar use_nvram true e depois reclamar que o rEFInd 'sumiu' do BIOS depois de mexer com efibootmgr.",
      "Iniciante comum: instalar rEFInd em sistema BIOS e ficar confuso com mensagens de erro do refind-install.",
    ],
    alerts: [
      { type: "tip", content: "Adicione 'showtools shutdown,reboot,memtest' no refind.conf. Você ganha botões de desligar, reiniciar e rodar memtest86+ direto do menu de boot — útil em diagnóstico." },
      { type: "info", content: "Se você usa Secure Boot, o rEFInd tem um mecanismo via shim (refind-install --shim shimx64.efi). Funciona, mas adiciona complexidade. Veja o capítulo de Secure Boot." },
      { type: "warning", content: "Não confunda refind-install com refind-mkdefault. O segundo só seta a ordem da NVRAM; o primeiro instala arquivos." },
      { type: "success", content: "rEFInd em laptop com Gentoo + Windows + Fedora é uma das formas mais indolores de gerenciar tudo: você não toca em mais nada depois da instalação inicial." },
    ],
  },
  {
    slug: "syslinux",
    section: "bootloader",
    title: "syslinux e extlinux: leveza para casos específicos",
    difficulty: "intermediario",
    subtitle: "Bootloader minúsculo, ideal para pendrives, ISOs e instalações enxutas.",
    intro: `O syslinux é um conjunto de bootloaders historicamente popular em mídias removíveis e sistemas embarcados. Ele tem três variantes principais: isolinux (para ISOs CD/DVD), syslinux (para FAT em pendrives) e extlinux (para ext2/3/4 e btrfs em discos). Todos compartilham a mesma ideia: arquivo de configuração simples em texto, boot rápido, código pequeno.

No Gentoo, o syslinux é uma alternativa ao GRUB para quem quer simplicidade. A configuração é literalmente quatro linhas para um sistema funcional, sem geração automática de menu, sem 'mkconfig'. Por outro lado ele só lida com BIOS legacy (não há syslinux UEFI nativo) e não suporta nativamente LVM, LUKS, btrfs com features avançadas, etc.

É a escolha certa para um pendrive de boot, um Gentoo num cartão SD de Raspberry Pi (com bootloader compatível), ou uma máquina virtual onde você quer evitar a complexidade do GRUB. Vamos ver como instalar e configurar tanto extlinux (para uma instalação em /boot ext4) quanto isolinux (para gerar uma ISO bootável).`,
    codes: [
      { lang: "bash", code: `# Instale o pacote.
sudo emerge --ask sys-boot/syslinux

# Para BIOS legacy num /boot ext4: use extlinux.
sudo mkdir -p /boot/extlinux
sudo extlinux --install /boot/extlinux

# Saída esperada (silenciosa em sucesso). Confirme:
ls /boot/extlinux/    # deve aparecer ldlinux.sys` },
      { lang: "bash", code: `# Grave o setor de boot do syslinux no MBR do disco.
# Isso é o equivalente do 'grub-install' para syslinux.
sudo dd bs=440 conv=notrunc count=1 \\
  if=/usr/share/syslinux/mbr.bin of=/dev/sda

# Marque a partição /boot como bootavel:
sudo parted /dev/sda set 1 boot on` },
      { lang: "conf", code: `# /boot/extlinux/extlinux.conf
DEFAULT gentoo
TIMEOUT 50          # 5 segundos (em decimos)
PROMPT 1

LABEL gentoo
  MENU LABEL Gentoo Linux 6.6.21
  LINUX /vmlinuz-6.6.21-gentoo
  INITRD /initramfs-6.6.21-gentoo.img
  APPEND root=/dev/sda2 ro quiet

LABEL gentoo-old
  MENU LABEL Gentoo (kernel anterior)
  LINUX /vmlinuz-6.6.20-gentoo
  APPEND root=/dev/sda2 ro` },
      { lang: "bash", code: `# Para uma ISO bootavel, use isolinux com xorriso.
# Estrutura mínima:
# iso/
#   isolinux/
#     isolinux.bin
#     ldlinux.c32
#     isolinux.cfg
#   vmlinuz
#   initramfs.img

cp /usr/share/syslinux/isolinux.bin iso/isolinux/
cp /usr/share/syslinux/ldlinux.c32 iso/isolinux/

xorriso -as mkisofs -o gentoo.iso \\
  -b isolinux/isolinux.bin \\
  -c isolinux/boot.cat \\
  -no-emul-boot -boot-load-size 4 -boot-info-table \\
  iso/` },
      { lang: "conf", code: `# /etc/portage/package.use/syslinux
# Por padrão syslinux já vem ok; se precisar de UEFI experimental:
# sys-boot/syslinux efi   (suporte UEFI ainda é limitado, prefira GRUB)` },
    ],
    points: [
      "syslinux é leve mas só funciona bem em BIOS legacy.",
      "extlinux = variante para sistemas de arquivos ext2/3/4, btrfs simples.",
      "isolinux = variante para mídias ISO (CD/DVD, pendrive ISO híbrido).",
      "Configuração em texto puro: extlinux.conf ou isolinux.cfg, sem 'mkconfig'.",
      "Não suporta nativamente LVM, LUKS ou btrfs com snapshots — use GRUB nesses casos.",
      "Você precisa gravar o MBR à mão com dd usando /usr/share/syslinux/mbr.bin.",
      "Armadilha comum: instalar extlinux mas esquecer de gravar mbr.bin no disco.",
      "Iniciante comum: tentar usar syslinux em UEFI moderno e bater de frente com limitações.",
    ],
    alerts: [
      { type: "tip", content: "Para criar pendrives de boot com várias ISOs, considere o Ventoy (ele usa GRUB internamente) em vez de manter coisas isolinux na unha." },
      { type: "warning", content: "Se /boot é btrfs com compressão (zstd, lzo), o extlinux pode ter dificuldade em ler o vmlinuz. Use ext4 simples em /boot quando for usar syslinux." },
      { type: "info", content: "isolinux.bin precisa ficar na ISO no caminho exato declarado em -b. Se mover de pasta, mude no comando do xorriso também." },
      { type: "danger", content: "Gravar mbr.bin no /dev/sda errado destrói o boot do disco escolhido. Sempre confira com lsblk antes de rodar dd." },
    ],
  },
  {
    slug: "multiboot",
    section: "bootloader",
    title: "Multiboot: Gentoo + Windows + outras distros",
    difficulty: "intermediario",
    subtitle: "Como conviver com Windows e outros Linux no mesmo computador sem quebrar o boot.",
    intro: `Dual-boot e multiboot são realidades comuns: você quer Gentoo como sistema principal mas precisa do Windows para um software específico, ou tem outra distribuição Linux para comparar. A boa notícia é que GRUB e UEFI moderno tornam isso tranquilo. A má notícia é que cada SO tem hábitos diferentes (Windows adora reescrever o boot, distros 'pisam' nas entradas NVRAM dos vizinhos).

A regra de ouro: instale o Windows PRIMEIRO. Ele é o mais hostil dos vizinhos e gosta de monopolizar o setor de boot. Depois você instala Gentoo (ou qualquer Linux), que detecta o Windows e cria uma entrada para ele no menu do GRUB sem reclamar.

A ferramenta principal é o os-prober (sys-boot/os-prober): um script que percorre as partições atrás de outros sistemas operacionais. O grub-mkconfig chama o os-prober automaticamente e adiciona entradas. Você também pode escrever entradas customizadas em /etc/grub.d/40_custom para ter controle fino.`,
    codes: [
      { lang: "bash", code: `# Instale o os-prober e o ntfs3g (para detectar partições NTFS do Windows).
sudo emerge --ask sys-boot/os-prober sys-fs/ntfs3g

# Por padrao em GRUB 2.06+, os-prober vem desligado por seguranca.
# Habilite editando /etc/default/grub:
echo 'GRUB_DISABLE_OS_PROBER=false' | sudo tee -a /etc/default/grub` },
      { lang: "bash", code: `# Regenere a configuracao do GRUB. Ele agora vai chamar o os-prober.
sudo grub-mkconfig -o /boot/grub/grub.cfg

# Saída esperada inclui:
# Found Windows Boot Manager on /dev/sda1@/EFI/Microsoft/Boot/bootmgfw.efi
# Adding boot menu entry for UEFI Firmware Settings
# done` },
      { lang: "bash", code: `# Listar todos os SOs detectados manualmente:
sudo os-prober

# Saída exemplo:
# /dev/sda1@/EFI/Microsoft/Boot/bootmgfw.efi:Windows Boot Manager:Windows:efi
# /dev/sda5:Arch Linux:Arch:linux` },
      { lang: "bash", code: `# Entrada manual no GRUB para um Windows que o os-prober nao achou.
# Edite /etc/grub.d/40_custom (sempre executavel: chmod +x):
cat | sudo tee -a /etc/grub.d/40_custom <<'EOF'
menuentry "Windows 11 (manual)" {
  insmod part_gpt
  insmod fat
  insmod chain
  search --no-floppy --fs-uuid --set=root XXXX-XXXX
  chainloader /EFI/Microsoft/Boot/bootmgfw.efi
}
EOF

sudo grub-mkconfig -o /boot/grub/grub.cfg` },
      { lang: "bash", code: `# Para descobrir o UUID da ESP do Windows:
sudo blkid | grep -i fat
# /dev/sda1: LABEL="ESP" UUID="ABCD-1234" TYPE="vfat" ...
# Use ABCD-1234 no --fs-uuid acima.` },
    ],
    points: [
      "Sempre instale Windows primeiro. Ele sobrescreve bootloaders Linux sem dó.",
      "GRUB 2.06+ desabilita os-prober por padrão; reabilite com GRUB_DISABLE_OS_PROBER=false.",
      "ntfs3g é necessário para o os-prober ler partições do Windows.",
      "Em UEFI cada SO pode ter sua própria pasta dentro da ESP — não há conflito.",
      "/etc/grub.d/40_custom permite entradas manuais; o arquivo precisa ser executável (chmod +x).",
      "Após Windows Update grande, às vezes a ordem NVRAM volta ao Windows; conserte com efibootmgr.",
      "Armadilha comum: rodar grub-mkconfig com Windows hibernado ou com Fast Startup ligado e não detectar nada.",
      "Iniciante comum: instalar Linux em modo BIOS quando o Windows está em UEFI (ou vice-versa) — eles não conversam.",
    ],
    alerts: [
      { type: "warning", content: "Desligue o 'Fast Startup' do Windows (Painel de Controle → Opções de Energia). Com ele ligado, o Windows hiberna em vez de desligar e o NTFS fica travado para o Linux." },
      { type: "danger", content: "Atualizações grandes do Windows (feature updates do Win10/11) podem reescrever o gerenciador de boot e fazer o GRUB desaparecer do menu UEFI. Sempre tenha um pendrive Gentoo de recuperação." },
      { type: "tip", content: "Mantenha kernels Linux e Windows em ESPs separadas se possível (ou pelo menos backup do \\EFI\\Gentoo). Diminui chance de uma pisar na outra." },
      { type: "info", content: "systemd-boot (sd-boot) é uma alternativa interessante para multiboot UEFI. Ele lê /loader/entries/*.conf e oferece menu sem o overhead do GRUB." },
    ],
  },
  {
    slug: "secure-boot",
    section: "bootloader",
    title: "Secure Boot: assinando o GRUB e o kernel",
    difficulty: "avancado",
    subtitle: "Como rodar Gentoo com Secure Boot ativo usando shim, MOK e sbsign.",
    intro: `Secure Boot é um recurso do firmware UEFI que só permite executar binários EFI assinados criptograficamente por uma chave conhecida. A ideia é proteger contra bootkits — malware que se instala antes do sistema operacional. Em distribuições como Ubuntu e Fedora, o Secure Boot 'simplesmente funciona' porque elas pagam pela assinatura da Microsoft. No Gentoo, você compila o kernel localmente, então tem que assinar você mesmo.

A estratégia mais comum é usar o shim (sys-boot/shim), um pequeno bootloader assinado pela Microsoft que carrega seu GRUB. O shim aceita uma chave sua (MOK — Machine Owner Key) que você gera localmente e enrola no firmware via mokutil. Depois disso, basta assinar o grubx64.efi e o vmlinuz com essa chave.

É trabalho extra, e cada novo kernel precisa ser reassinado. Para muita gente o custo-benefício não compensa e a saída é simplesmente desabilitar o Secure Boot no firmware. Para servidor corporativo, laptop empresarial ou paranoia legítima, vale a pena. Vamos ver o caminho completo: shim, MOK, sbsign e ganchos automáticos.`,
    codes: [
      { lang: "bash", code: `# Instale as ferramentas de assinatura.
sudo emerge --ask \\
  sys-boot/shim \\
  app-crypt/sbsigntools \\
  app-crypt/efitools \\
  app-crypt/mokutil` },
      { lang: "bash", code: `# Gere uma Machine Owner Key (MOK) propria.
sudo mkdir -p /etc/secureboot
cd /etc/secureboot

sudo openssl req -new -x509 -newkey rsa:2048 \\
  -keyout MOK.key -outform DER -out MOK.der \\
  -nodes -days 36500 \\
  -subj "/CN=Gentoo MOK $(hostname)/"

# Tambem gere PEM (para sbsign):
sudo openssl x509 -in MOK.der -inform DER -out MOK.pem -outform PEM` },
      { lang: "bash", code: `# Enrole a MOK no firmware (precisa reboot e digitar senha pelo MokManager).
sudo mokutil --import /etc/secureboot/MOK.der
# Pede uma senha temporaria. Reinicie:
sudo reboot
# Na tela azul do MokManager: 'Enroll MOK' -> 'Continue' -> senha -> Reboot.

# Confira depois:
sudo mokutil --list-enrolled | grep CN=` },
      { lang: "bash", code: `# Assine o GRUB e o kernel com sbsign.
sudo sbsign --key /etc/secureboot/MOK.key \\
  --cert /etc/secureboot/MOK.pem \\
  --output /efi/EFI/Gentoo/grubx64.efi \\
  /efi/EFI/Gentoo/grubx64.efi

sudo sbsign --key /etc/secureboot/MOK.key \\
  --cert /etc/secureboot/MOK.pem \\
  --output /boot/vmlinuz-6.6.21-gentoo \\
  /boot/vmlinuz-6.6.21-gentoo

# Verifique:
sudo sbverify --cert /etc/secureboot/MOK.pem /boot/vmlinuz-6.6.21-gentoo` },
      { lang: "bash", code: `# Instale o shim na ESP (substitui a ordem GRUB direto).
sudo cp /usr/share/shim/x64/shimx64.efi /efi/EFI/Gentoo/shimx64.efi
sudo cp /usr/share/shim/x64/mmx64.efi /efi/EFI/Gentoo/mmx64.efi

# Aponte a NVRAM para o SHIM, nao para o GRUB direto:
sudo efibootmgr --create \\
  --disk /dev/sda --part 1 \\
  --label "Gentoo (shim)" \\
  --loader '\\EFI\\Gentoo\\shimx64.efi'` },
      { lang: "conf", code: `# Hook automatico para reassinar kernel apos cada compilacao.
# /etc/portage/env/sys-kernel/gentoo-kernel-bin
post_pkg_postinst() {
  for k in /boot/vmlinuz-*; do
    sbsign --key /etc/secureboot/MOK.key \\
      --cert /etc/secureboot/MOK.pem \\
      --output "\\$k" "\\$k"
  done
}` },
    ],
    points: [
      "Secure Boot exige que CADA binário EFI executado seja assinado por uma chave conhecida.",
      "shim é um loader assinado pela Microsoft que aceita suas próprias chaves (MOK).",
      "MOK é gerada localmente com openssl, enrolada no firmware via mokutil.",
      "sbsign assina o grubx64.efi e o vmlinuz com a chave privada da MOK.",
      "Cada novo kernel compilado precisa ser reassinado — automatize com hooks Portage.",
      "Sem assinatura, o firmware recusa executar e mostra 'Image failed verification'.",
      "Armadilha comum: reassinar grubx64.efi mas esquecer do vmlinuz e o kernel não bootar.",
      "Iniciante comum: tentar Secure Boot sem entender — desabilite no firmware se for incomodar.",
    ],
    alerts: [
      { type: "warning", content: "Secure Boot adiciona complexidade real. Para uso pessoal, na maioria dos casos compensa simplesmente desligar no firmware (Setup → Boot → Secure Boot: Disabled)." },
      { type: "danger", content: "PERDA DA CHAVE PRIVADA = perda da capacidade de assinar novos kernels. Sempre faça backup de /etc/secureboot/MOK.key em local seguro e offline." },
      { type: "info", content: "Em vez de shim+MOK, há quem prefira gerar PK/KEK/db próprios e substituir as chaves de fábrica do firmware. Mais limpo, mas tijoliza máquinas com firmware buggy." },
      { type: "tip", content: "Considere o sbctl (app-crypt/sbctl, em testing) que automatiza geração de chaves, enrollment e assinaturas. Reduz drasticamente o boilerplate." },
    ],
  },
  {
    slug: "encryption-boot",
    section: "bootloader",
    title: "Boot com disco criptografado (LUKS)",
    difficulty: "avancado",
    subtitle: "Configurando GRUB e initramfs para desbloquear LUKS no boot.",
    intro: `LUKS (Linux Unified Key Setup) é o padrão de criptografia de disco no Linux. Ele criptografa uma partição inteira; só com a senha (ou chave) ela vira utilizável. A pergunta no boot vira: como o sistema desbloqueia o root antes de carregar nada?

Existem duas estratégias. A clássica deixa /boot fora da criptografia: o GRUB lê o kernel e initramfs em texto plano, o initramfs pede a senha e desbloqueia o root. Funciona em todo lugar, é simples de configurar, mas o /boot fica visível para quem tem o disco.

A moderna criptografa /boot também: o próprio GRUB pede a senha e descriptografa o /boot, depois carrega kernel e initramfs (que pode pedir senha de novo, ou usar uma keyfile). Mais seguro, mais lento no boot, e exige GRUB com módulo cryptodisk. Vamos cobrir as duas.`,
    codes: [
      { lang: "bash", code: `# Criar particao LUKS (cuidado: apaga dados).
# Supondo que /dev/sda3 sera o root criptografado:
sudo cryptsetup luksFormat --type luks2 \\
  --cipher aes-xts-plain64 --key-size 512 \\
  --hash sha512 /dev/sda3

# Abra a particao (cria /dev/mapper/cryptroot):
sudo cryptsetup open /dev/sda3 cryptroot

# Formate o sistema de arquivos por cima:
sudo mkfs.ext4 /dev/mapper/cryptroot` },
      { lang: "conf", code: `# /etc/default/grub - estrategia 1: /boot em texto plano
# Avise o GRUB qual disco precisa ser desbloqueado depois do boot.
GRUB_CMDLINE_LINUX="rd.luks.uuid=UUID-DO-LUKS root=/dev/mapper/cryptroot"
# (Se o initramfs e o do dracut, prefira rd.luks.uuid em vez de cryptdevice.)` },
      { lang: "bash", code: `# Gerando initramfs com dracut com suporte LUKS.
sudo emerge --ask sys-kernel/dracut

sudo dracut --force \\
  --add "crypt" \\
  /boot/initramfs-6.6.21-gentoo.img 6.6.21-gentoo

# Conferir modulos incluidos:
lsinitrd /boot/initramfs-6.6.21-gentoo.img | grep -i crypt` },
      { lang: "conf", code: `# /etc/default/grub - estrategia 2: /boot tambem criptografado
GRUB_ENABLE_CRYPTODISK=y
GRUB_CMDLINE_LINUX="rd.luks.uuid=UUID-DO-LUKS root=/dev/mapper/cryptroot"

# Reinstale o GRUB depois (ele agora inclui o modulo cryptodisk):
# sudo grub-install --target=x86_64-efi --efi-directory=/efi
# sudo grub-mkconfig -o /boot/grub/grub.cfg` },
      { lang: "conf", code: `# /etc/crypttab - desbloqueio de particoes adicionais (nao do root)
# nome             dispositivo             keyfile            opcoes
crypthome  UUID=12345678-...   /etc/keys/home.key  luks,discard

# Para o root, geralmente o initramfs cuida sozinho via kernel cmdline.` },
      { lang: "bash", code: `# Adicionar uma keyfile como segunda chave do LUKS (em vez de senha).
sudo dd if=/dev/urandom of=/etc/keys/home.key bs=512 count=4
sudo chmod 600 /etc/keys/home.key
sudo cryptsetup luksAddKey /dev/sda4 /etc/keys/home.key

# Agora /etc/crypttab pode desbloquear sem perguntar senha.` },
    ],
    points: [
      "LUKS criptografa partições inteiras com chave derivada da senha.",
      "Estratégia 1: /boot em claro — GRUB lê normal, initramfs desbloqueia root.",
      "Estratégia 2: /boot criptografado — GRUB com cryptodisk pede senha antes do menu.",
      "Use luks2 (padrão atual) com aes-xts-plain64; não use luks1 sem motivo.",
      "Initramfs precisa do módulo crypt (dracut --add crypt) para conseguir abrir o root.",
      "GRUB_ENABLE_CRYPTODISK=y mais reinstalação do GRUB são necessários para boot criptografado.",
      "Armadilha comum: gerar initramfs sem dracut --add crypt e cair em emergency shell.",
      "Iniciante comum: esquecer de exportar a chave LUKS antes de reinstalar — sem chave, sem dado.",
    ],
    alerts: [
      { type: "danger", content: "PERDA DA SENHA = PERDA DO DADO. LUKS não tem 'esqueci minha senha'. Sempre tenha um header backup (cryptsetup luksHeaderBackup) e mais de um keyslot configurado." },
      { type: "warning", content: "Desempenho com /boot criptografado é sensivelmente pior — você digita senha e espera o GRUB descriptografar o /boot inteiro. Em SSD é tolerável, em HDD vai doer." },
      { type: "tip", content: "Combine LUKS + TPM 2.0 (systemd-cryptenroll) para desbloqueio automático em hardware confiável. Você ganha conveniência sem perder segurança em caso de roubo." },
      { type: "info", content: "Se quiser um boot bonito sem prompt feio, use o plymouth (sys-boot/plymouth) integrado ao dracut para mostrar tela amigável durante o desbloqueio." },
    ],
  },
  {
    slug: "lvm-boot",
    section: "bootloader",
    title: "Boot com LVM",
    difficulty: "intermediario",
    subtitle: "GRUB e initramfs configurados para reconhecer Logical Volumes na inicialização.",
    intro: `LVM (Logical Volume Manager) é uma camada de abstração que permite redimensionar partições, agrupar discos físicos em pools e criar snapshots. Quando o root está dentro de um logical volume, o boot fica um pouco mais elaborado: o sistema precisa enxergar o LVM antes de tudo, o GRUB precisa do módulo lvm e o initramfs precisa ativar os volume groups.

Por sorte tudo isso é bem suportado. O GRUB inclui suporte LVM nativamente quando detecta que /boot ou root estão em LVM. O initramfs (com dracut) precisa do módulo lvm explicitamente. E o kernel precisa ter CONFIG_BLK_DEV_DM=y (Device Mapper).

Este capítulo mostra a sequência: garantir o pacote sys-fs/lvm2, configurar make.conf com USE='lvm', regerar initramfs com dracut --add lvm e checar que tudo está no lugar antes de reiniciar. É clássico em servidores Gentoo e em desktops que querem flexibilidade de redimensionamento.`,
    codes: [
      { lang: "bash", code: `# Instale o LVM2 com USE flag adequada.
sudo emerge --ask sys-fs/lvm2

# Confira que o servico esta disponivel (OpenRC):
sudo rc-update add lvm boot

# systemd: o lvm2-lvmetad / lvm2-monitor sao automaticos via udev.` },
      { lang: "bash", code: `# Crie a estrutura LVM (exemplo com /dev/sda3 como Physical Volume).
sudo pvcreate /dev/sda3
sudo vgcreate vg0 /dev/sda3
sudo lvcreate -L 30G -n root vg0
sudo lvcreate -L 8G  -n swap vg0
sudo lvcreate -l 100%FREE -n home vg0

# Confira:
sudo lvs
# LV    VG  Attr  LSize  ...
# root  vg0 -wi-a 30.00g
# swap  vg0 -wi-a  8.00g
# home  vg0 -wi-a 50.00g` },
      { lang: "conf", code: `# Garanta CONFIG_BLK_DEV_DM=y no kernel (make menuconfig):
# Device Drivers --->
#   [*] Multiple devices driver support (RAID and LVM) --->
#       <*>   Device mapper support
#       <*>     Crypt target support     (necessario se for combinar com LUKS)
#       <*>     Snapshot target          (snapshots LVM)` },
      { lang: "bash", code: `# Regere o initramfs com suporte LVM via dracut.
sudo dracut --force \\
  --add "lvm" \\
  /boot/initramfs-6.6.21-gentoo.img 6.6.21-gentoo

# Para confirmar:
lsinitrd /boot/initramfs-6.6.21-gentoo.img | grep -i lvm` },
      { lang: "conf", code: `# /etc/default/grub - cmdline com referencia a LV
GRUB_CMDLINE_LINUX="root=/dev/vg0/root rd.lvm.lv=vg0/root rd.lvm.lv=vg0/swap"

# Apos editar:
# sudo grub-mkconfig -o /boot/grub/grub.cfg` },
      { lang: "bash", code: `# Caso queira redimensionar um LV ja em uso (ext4):
sudo lvextend -L +10G /dev/vg0/home
sudo resize2fs /dev/vg0/home
# online, sem reboot.` },
    ],
    points: [
      "LVM exige sys-fs/lvm2 e CONFIG_BLK_DEV_DM no kernel.",
      "OpenRC: rc-update add lvm boot. systemd: ativado via udev automaticamente.",
      "GRUB detecta LVM sozinho se /boot ou root estiverem em LV no momento do grub-install.",
      "Initramfs com dracut --add lvm é obrigatório se root está em LV.",
      "Kernel cmdline precisa indicar root=/dev/vg/lv e rd.lvm.lv= para o dracut.",
      "Pode-se usar /boot fora do LVM (em partição comum) para máxima compatibilidade.",
      "Armadilha comum: regenerar initramfs sem o módulo lvm e cair em emergency shell.",
      "Iniciante comum: criar /boot dentro do LVM com bootloader que não suporta — alguns syslinux antigos quebram.",
    ],
    alerts: [
      { type: "tip", content: "Mantenha algum espaço livre não-alocado no VG. Snapshots LVM precisam dele e você ganha flexibilidade futura para crescer LVs sem precisar de novo PV." },
      { type: "info", content: "Combinar LUKS + LVM é uma receita popular: criptografe a partição inteira, abra como /dev/mapper/cryptroot, faça pvcreate em cima. Resultado: tudo dentro do LVM já criptografado." },
      { type: "warning", content: "Snapshots LVM clássicos (não thin) consomem espaço alocado fixo. Se a snapshot 'enche', ela é descartada automaticamente. Use thin pools para snapshots seguras." },
      { type: "danger", content: "Não confunda lvremove com lvchange. Um apaga o LV (e os dados); o outro só ativa/desativa. Sempre confira com lvs antes de remover." },
    ],
  },
  {
    slug: "btrfs-subvol-boot",
    section: "bootloader",
    title: "Boot com btrfs e subvolumes",
    difficulty: "avancado",
    subtitle: "Como usar subvolumes btrfs como root, com snapshots integradas ao GRUB.",
    intro: `O btrfs é um sistema de arquivos com superpoderes: snapshots em tempo zero, subvolumes (sistemas de arquivos virtuais dentro do mesmo pool), compressão transparente e RAID nativo. Quando o root da Gentoo está em um subvolume btrfs, o boot precisa de uma instrução extra: 'rootflags=subvol=@root', dizendo ao kernel qual subvolume montar como /.

Ferramentas como o grub-btrfs (sys-boot/grub-btrfs) varrem suas snapshots e adicionam entradas de menu no GRUB para cada uma. Resultado: você pode rebootar para a Gentoo de ontem com dois cliques se a atualização de hoje quebrou alguma coisa. É um nível de safety net que poucos sistemas oferecem nativamente.

Este capítulo cobre a configuração padrão (subvol @root para /, @home para /home, @snapshots para snapshots), a cmdline do kernel necessária, o initramfs preparado para btrfs e a integração com grub-btrfs para snapshots-como-boot-entries. Em ambiente de servidor isso vira uma ferramenta de DR (disaster recovery) trivial.`,
    codes: [
      { lang: "bash", code: `# Crie o sistema de arquivos btrfs e os subvolumes.
sudo mkfs.btrfs -L gentoo /dev/sda3

# Monte temporariamente para criar subvols.
sudo mount /dev/sda3 /mnt
sudo btrfs subvolume create /mnt/@root
sudo btrfs subvolume create /mnt/@home
sudo btrfs subvolume create /mnt/@snapshots
sudo umount /mnt` },
      { lang: "bash", code: `# Monte os subvols nos lugares certos.
sudo mount -o subvol=@root,compress=zstd:3,noatime /dev/sda3 /mnt
sudo mkdir -p /mnt/{home,.snapshots,boot}
sudo mount -o subvol=@home,compress=zstd:3      /dev/sda3 /mnt/home
sudo mount -o subvol=@snapshots                 /dev/sda3 /mnt/.snapshots` },
      { lang: "conf", code: `# /etc/fstab apos a instalacao
UUID=XXXX  /            btrfs  subvol=@root,compress=zstd:3,noatime  0 0
UUID=XXXX  /home        btrfs  subvol=@home,compress=zstd:3          0 0
UUID=XXXX  /.snapshots  btrfs  subvol=@snapshots                     0 0
UUID=YYYY  /boot        ext4   defaults                              0 2` },
      { lang: "conf", code: `# /etc/default/grub - cmdline para btrfs subvol
GRUB_CMDLINE_LINUX="rootflags=subvol=@root"

# Regere apos editar:
# sudo grub-mkconfig -o /boot/grub/grub.cfg` },
      { lang: "bash", code: `# Initramfs com modulos btrfs (geralmente automatico no dracut).
sudo emerge --ask sys-fs/btrfs-progs sys-kernel/dracut
sudo dracut --force --add btrfs /boot/initramfs-6.6.21-gentoo.img 6.6.21-gentoo

# Confira:
lsinitrd /boot/initramfs-6.6.21-gentoo.img | grep -i btrfs` },
      { lang: "bash", code: `# grub-btrfs: snapshots como entradas de boot.
sudo emerge --ask sys-boot/grub-btrfs

# Cada snapshot em /.snapshots vira entrada no menu do GRUB.
# Crie uma snapshot manual e regere:
sudo btrfs subvolume snapshot -r / /.snapshots/pre-update-2024-12-15
sudo grub-mkconfig -o /boot/grub/grub.cfg

# Apos isso, no menu GRUB aparece submenu 'Snapshots' com cada uma.` },
    ],
    points: [
      "Subvolumes btrfs são sistemas de arquivos virtuais dentro do mesmo pool — flexíveis e baratos.",
      "Convenção comum: @root para /, @home para /home, @snapshots para snapshots.",
      "Cmdline do kernel precisa de rootflags=subvol=@root para o root certo ser montado.",
      "Initramfs precisa do módulo btrfs (dracut --add btrfs) — geralmente já incluído por padrão.",
      "compress=zstd:3 economiza espaço com baixo overhead em CPU moderna.",
      "grub-btrfs gera entradas de menu para cada snapshot em /.snapshots.",
      "Armadilha comum: esquecer rootflags=subvol e o boot montar o subvol top-level (/), sem fstab válido.",
      "Iniciante comum: criar muitas snapshots e nunca limpar — btrfs balance fica lento, espaço some.",
    ],
    alerts: [
      { type: "tip", content: "Use snapper (sys-apps/snapper) ou btrbk para automatizar criação e poda de snapshots. Combinado com grub-btrfs, vira um sistema robusto de rollback." },
      { type: "warning", content: "btrfs RAID 5/6 ainda tem casos de write-hole conhecidos. Use RAID 0/1/10 com tranquilidade; para 5/6 prefira ZFS ou mdadm." },
      { type: "danger", content: "btrfs em pendrive ou SD com qualidade ruim costuma corromper. Para mídias removíveis, prefira ext4 ou f2fs." },
      { type: "info", content: "Para verificar a saúde do filesystem regularmente: sudo btrfs scrub start /. Agende via cron ou systemd timer." },
    ],
  },
];
