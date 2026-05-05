import type { Chapter } from "../types";

export const chapters: Chapter[] = [
  {
    slug: "particoes-pratica",
    section: "instalacao",
    title: "Particionando o disco na prática",
    difficulty: "iniciante",
    subtitle: "Criando EFI, swap e root no disco com parted, cfdisk ou sgdisk.",
    intro: `No capítulo anterior você desenhou no papel o seu plano de particionamento. Agora vai escrever esse plano no disco de verdade, ainda dentro do ambiente live do Gentoo (a ISO minimal ou admincd). Esta etapa é a mais nervosa da instalação inteira: um comando errado em /dev/sda apaga tudo o que existir ali. Respire fundo, confira duas vezes qual é o disco-alvo (lsblk ajuda) e siga com calma.

Você vai usar GPT (GUID Partition Table), que é o padrão moderno e funciona tanto em UEFI quanto em BIOS via uma 'BIOS boot partition' de 1 MiB. O layout proposto aqui é o mais comum para um desktop: uma partição EFI de 1 GiB no início, uma partição swap de 4 a 16 GiB e o restante como root (/). Em servidores ou setups com LVM/LUKS, o layout muda — mas o princípio das ferramentas é o mesmo.

Existem três utilitários populares para particionar: parted (script-friendly e versátil), cfdisk (interface curses, amigável) e sgdisk (linha de comando focada em GPT, ideal para reproduzir setup). Você só precisa escolher um. Vamos passar pelos três para você se sentir confortável com qualquer um deles.`,
    codes: [
      { lang: "bash", code: `# Antes de qualquer coisa: identifique o disco-alvo.
lsblk -d -o NAME,SIZE,MODEL
# saída típica:
# NAME   SIZE MODEL
# sda  476.9G Samsung SSD 870 EVO 500GB
# sr0    1.0G QEMU DVD-ROM

# Vamos assumir /dev/sda como destino. AJUSTE para o seu disco real
# (em NVMe costuma ser /dev/nvme0n1, e as partições viram nvme0n1p1, p2...).` },
      { lang: "bash", code: `# Opção 1: parted em modo interativo (mais didático).
parted /dev/sda
# dentro do prompt (parted):
#   mklabel gpt
#   mkpart primary fat32 1MiB 1025MiB     # EFI 1 GiB
#   set 1 esp on                          # marca como EFI System Partition
#   mkpart primary linux-swap 1025MiB 9217MiB   # swap 8 GiB
#   mkpart primary ext4 9217MiB 100%      # root no resto
#   print                                  # confira o resultado
#   quit` },
      { lang: "bash", code: `# Opção 2: sgdisk (linha de comando, ótimo para reproduzir).
# Limpa qualquer assinatura antiga e cria GPT do zero:
sgdisk --zap-all /dev/sda

# EFI 1 GiB, swap 8 GiB, root no restante:
sgdisk -n 1:0:+1G   -t 1:ef00 -c 1:"EFI"  /dev/sda
sgdisk -n 2:0:+8G   -t 2:8200 -c 2:"swap" /dev/sda
sgdisk -n 3:0:0     -t 3:8300 -c 3:"root" /dev/sda

# Verifique:
sgdisk -p /dev/sda` },
      { lang: "bash", code: `# Opção 3: cfdisk (interface visual em modo texto).
cfdisk /dev/sda
# Selecione 'gpt' quando perguntar o tipo de tabela.
# Use as setas para navegar, [New] para criar, [Type] para mudar o tipo:
#   primeira partição: 1G,  type 'EFI System'
#   segunda partição:  8G,  type 'Linux swap'
#   terceira partição: rest, type 'Linux filesystem'
# Por fim: [Write], digite 'yes', depois [Quit].` },
      { lang: "bash", code: `# Para BIOS legacy (sem UEFI) com GRUB em GPT, é preciso uma
# partição extra de 1 MiB chamada 'BIOS boot partition':
sgdisk -n 1:0:+1M  -t 1:ef02 -c 1:"BIOS"  /dev/sda
sgdisk -n 2:0:+8G  -t 2:8200 -c 2:"swap"  /dev/sda
sgdisk -n 3:0:0    -t 3:8300 -c 3:"root"  /dev/sda
# Sem essa partição, o grub-install em GPT/BIOS falha com
# 'embedding is not possible'.` },
      { lang: "bash", code: `# Confira o que ficou no disco antes de seguir:
lsblk /dev/sda
# saída esperada (UEFI):
# sda      476.9G
# ├─sda1     1G  EFI
# ├─sda2     8G  swap
# └─sda3   ~468G root

# Códigos sgdisk úteis: ef00=EFI, ef02=BIOS boot, 8200=swap,
# 8300=Linux fs, 8e00=LVM, fd00=Linux RAID.` },
    ],
    points: [
      "Sempre confirme o disco-alvo com lsblk antes de qualquer comando destrutivo.",
      "Use GPT por padrão; MBR só é necessário em hardware muito antigo ou requisitos específicos.",
      "Em UEFI, a partição EFI (esp/ef00) precisa ser FAT32 e ter pelo menos 512 MiB (1 GiB é confortável).",
      "Em BIOS+GPT é obrigatório criar uma BIOS boot partition (ef02) de 1 MiB para o GRUB.",
      "Em discos NVMe os nomes mudam: /dev/nvme0n1, com partições nvme0n1p1, p2, p3.",
      "Alinhamento moderno (1 MiB) é automático no parted, sgdisk e cfdisk; não precisa ajustar manualmente.",
      "Armadilha comum: rodar comandos no disco da live USB (/dev/sdb) achando que era o SSD interno.",
      "Iniciante comum: esquecer a flag 'esp' na partição EFI e o GRUB não reconhecer depois.",
    ],
    alerts: [
      { type: "danger", content: "Tudo que estiver no disco-alvo será apagado. Faça backup ANTES e cheque três vezes o nome do dispositivo. Não há lixeira para particionamento." },
      { type: "tip", content: "Se você ainda não tem certeza sobre tamanhos, use parted no modo interativo. Ele aceita unidades humanas como 1GiB, 100%, e mostra o layout antes de gravar." },
      { type: "warning", content: "Em discos NVMe, as partições são nvme0n1p1 e não nvme0n11. Esquecer o 'p' antes do número é um erro clássico que confunde o resto do roteiro." },
      { type: "info", content: "Onde no Arch você roda fdisk ou cfdisk, no Gentoo é exatamente igual. As ferramentas são as mesmas; o que muda é o que vem depois delas." },
    ],
  },
  {
    slug: "formatacao",
    section: "instalacao",
    title: "Formatando as partições",
    difficulty: "iniciante",
    subtitle: "mkfs para EFI, ext4, btrfs e o swap, com nomes (label) que ajudam o fstab.",
    intro: `Particionar é só desenhar o mapa do disco. Para guardar arquivos de verdade você precisa criar um sistema de arquivos dentro de cada partição — esse é o trabalho da família de comandos mkfs (make filesystem). É equivalente ao 'formatar' do Windows, só que com mais opções e sem perguntinhas. Cada filesystem (ext4, xfs, btrfs, vfat, f2fs) tem o seu próprio mkfs específico.

A regra prática para um desktop padrão é simples: a partição EFI é FAT32 (mkfs.fat -F32), o swap é preparado com mkswap, e a root pode ser ext4 (rocha sólida e ainda o padrão recomendado pelo handbook) ou btrfs (se você quer subvolumes e snapshots). XFS é excelente para servidores com muito I/O, e f2fs brilha em SSDs simples. Não existe escolha errada para uso doméstico, só escolha mais ou menos adequada ao caso.

Aproveite para colocar 'labels' (rótulos) em cada partição. Eles deixam o /etc/fstab muito mais legível depois (LABEL=root em vez de UUID=4f3a-...) e ajudam a evitar confusão se você plugar outro disco. UUID continua sendo o caminho mais robusto para o fstab final, mas labels facilitam a vida humana.`,
    codes: [
      { lang: "bash", code: `# Partição EFI: sempre FAT32, com flag -F32 explícita.
mkfs.fat -F32 -n EFI /dev/sda1
# -n EFI define o label (visível em lsblk -f).
# saída típica:
# mkfs.fat 4.2 (2021-01-31)` },
      { lang: "bash", code: `# Swap: mkswap formata, swapon ativa imediatamente.
mkswap -L swap /dev/sda2
swapon /dev/sda2
# Conferir que ativou:
swapon --show
# saída:
# NAME      TYPE SIZE USED PRIO
# /dev/sda2 partition 8G    0B   -2` },
      { lang: "bash", code: `# Root como ext4 (padrão sólido recomendado pelo handbook).
mkfs.ext4 -L root /dev/sda3
# Para SSD, NÃO ative discard via -E discard aqui — prefira fstrim.timer.
# saída final:
# Creating filesystem with ... 4k blocks and ... inodes
# done

# Para forçar sem perguntar (útil em script): adicione -F.` },
      { lang: "bash", code: `# Alternativa: root como btrfs (subvolumes, snapshots, compressão).
mkfs.btrfs -L root /dev/sda3

# Crie subvolumes principais antes de partir para a montagem:
mount /dev/sda3 /mnt
btrfs subvolume create /mnt/@        # raiz
btrfs subvolume create /mnt/@home    # /home
btrfs subvolume create /mnt/@snapshots
umount /mnt
# Depois você monta com -o subvol=@,compress=zstd:3 etc.` },
      { lang: "bash", code: `# XFS: ótimo para servidores, escala bem com I/O paralelo.
mkfs.xfs -L root -f /dev/sda3
# -f sobrescreve assinatura existente (XFS reclama por padrão).

# f2fs: pensado para flash puro (SSD/eMMC simples).
mkfs.f2fs -l root -f /dev/sda3` },
      { lang: "bash", code: `# Verifique tudo de uma vez antes de montar.
lsblk -f
# saída ideal:
# NAME   FSTYPE FSVER LABEL UUID                                 MOUNTPOINTS
# sda
# ├─sda1 vfat   FAT32 EFI   AB12-CD34
# ├─sda2 swap   1     swap  c4e5f6...                            [SWAP]
# └─sda3 ext4   1.0   root  9f8e7d6c-1234-5678-90ab-cdef12345678
# Se o LABEL não aparecer, foi esquecido no mkfs (-n para vfat, -L nos demais).` },
    ],
    points: [
      "EFI sempre FAT32 com mkfs.fat -F32 — VFAT16 é antigo demais para muitas firmwares.",
      "swap precisa de duas etapas: mkswap (formata) e swapon (ativa).",
      "ext4 é o default seguro do handbook; só mude se tiver motivo claro (snapshots, compressão).",
      "Use -L (label) em todos os filesystems — economiza tempo na hora de escrever o fstab.",
      "btrfs em sistema raiz quase sempre quer subvolumes (@, @home, @snapshots).",
      "Em SSD, evite discard no momento do mkfs ou no mount; configure fstrim.timer depois.",
      "Armadilha comum: formatar a partição errada e perceber só quando o sistema real sumiu.",
      "Iniciante comum: esquecer mkswap antes do swapon e tomar 'Invalid argument'.",
    ],
    alerts: [
      { type: "danger", content: "mkfs sobrescreve toda a partição instantaneamente. Não pede confirmação. Reveja o número da partição (sda1, sda2, sda3) antes de apertar Enter." },
      { type: "tip", content: "Se você ainda não decidiu entre ext4 e btrfs, vá de ext4 nesta primeira instalação. Você pode migrar para btrfs depois com mais experiência." },
      { type: "info", content: "Cada filesystem tem suas USE flags no kernel: ext4, xfs, btrfs precisam estar habilitados no kernel para que o root seja montável. Sem isso, kernel panic no boot." },
      { type: "success", content: "lsblk -f é o seu mapa visual após cada operação. Use à exaustão — ele mostra label, UUID, tipo e ponto de montagem em uma única tela." },
    ],
  },
  {
    slug: "montagem",
    section: "instalacao",
    title: "Montando o futuro sistema em /mnt/gentoo",
    difficulty: "iniciante",
    subtitle: "Ordem correta de montagem da root, EFI e diretórios auxiliares.",
    intro: `O Gentoo se instala dentro de uma pasta da live ISO, normalmente /mnt/gentoo. A ideia é simples: você monta a partição que vai virar a raiz (/) lá dentro, depois descompacta o stage3 (que veremos no próximo capítulo) sobre essa pasta, monta a EFI dentro de /mnt/gentoo/boot, e quando tudo estiver pronto faz um chroot para 'entrar' nesse sistema novo. É como construir uma casa dentro de outra antes de se mudar.

A ordem importa. Sempre monte a root primeiro — se você criar /mnt/gentoo/boot e montar a EFI antes de montar a root, o conteúdo da EFI fica solto em uma pasta da live e some quando a root for montada por cima. Depois da root, crie e monte o /boot (e em UEFI, dentro dele, o /boot/efi se preferir esse layout). Btrfs com subvolumes precisa de uma cerimônia extra: monte com -o subvol=@.

Esta etapa é rápida mas é onde acontecem 90% dos erros silenciosos. Um mount errado agora vai aparecer só lá na frente como um GRUB que não enxerga o kernel ou um initramfs que não encontra a raiz. Cheque com 'mount | grep gentoo' depois de cada passo e veja se o que está montado é o que você esperava.`,
    codes: [
      { lang: "bash", code: `# Cria o diretório alvo (já existe na maioria das ISOs Gentoo, mas garanta).
mkdir -p /mnt/gentoo

# Monta a root PRIMEIRO. Para ext4 simples:
mount /dev/sda3 /mnt/gentoo

# Confirme:
mount | grep /mnt/gentoo
# /dev/sda3 on /mnt/gentoo type ext4 (rw,relatime)` },
      { lang: "bash", code: `# Para btrfs com subvolumes, é diferente. Monte o subvolume @ na raiz:
mount -o subvol=@,compress=zstd:3,noatime,ssd /dev/sda3 /mnt/gentoo

# Depois crie os pontos de montagem para os outros subvolumes:
mkdir -p /mnt/gentoo/{home,.snapshots}
mount -o subvol=@home,compress=zstd:3 /dev/sda3 /mnt/gentoo/home
mount -o subvol=@snapshots /dev/sda3 /mnt/gentoo/.snapshots` },
      { lang: "bash", code: `# Agora cria /boot dentro da raiz montada e monta a EFI.
mkdir -p /mnt/gentoo/boot
mount /dev/sda1 /mnt/gentoo/boot

# Em UEFI, isso já é o suficiente — /boot e EFI são a mesma partição.
# Se você prefere EFI separada em /boot/efi:
#   mkdir -p /mnt/gentoo/boot/efi
#   mount /dev/sda1 /mnt/gentoo/boot/efi` },
      { lang: "bash", code: `# Você pode (deve) usar UUID ou LABEL em vez de /dev/sdaN no mount.
# Listar os UUIDs:
blkid /dev/sda1 /dev/sda3
# /dev/sda1: LABEL="EFI"  UUID="AB12-CD34" TYPE="vfat"
# /dev/sda3: LABEL="root" UUID="9f8e..."   TYPE="ext4"

# Montar via UUID (mais robusto se a ordem dos discos mudar):
mount UUID=9f8e7d6c-1234-5678-90ab-cdef12345678 /mnt/gentoo

# Montar via LABEL (mais legível):
mount LABEL=root /mnt/gentoo` },
      { lang: "bash", code: `# Não esqueça de ativar o swap se ainda não fez:
swapon /dev/sda2
# ou: swapon -L swap

# Confira o estado completo antes de prosseguir:
lsblk
# Você deve ver MOUNTPOINTS preenchidos para EFI, swap e root.
# Algo como:
# sda1  ... /mnt/gentoo/boot
# sda2  ... [SWAP]
# sda3  ... /mnt/gentoo` },
    ],
    points: [
      "Sempre monte a root primeiro; só depois /boot dentro dela.",
      "/mnt/gentoo é apenas convenção do handbook — qualquer pasta funcionaria, mas siga o padrão.",
      "Em btrfs, monte o subvolume @ como raiz com -o subvol=@.",
      "Use UUID ou LABEL no fstab final; durante a instalação, /dev/sdaN é aceitável.",
      "swapon não é obrigatório agora, mas ajuda em máquinas com pouca RAM durante a compilação.",
      "Em NVMe, lembre que o caminho é /dev/nvme0n1pX, não /dev/nvme0n1X.",
      "Armadilha comum: montar EFI antes de root e perder o conteúdo quando a root é montada por cima.",
      "Iniciante comum: esquecer de criar /mnt/gentoo/boot antes de tentar montar a EFI ali.",
    ],
    alerts: [
      { type: "tip", content: "Mantenha um terminal extra com lsblk -f sempre à mão. Antes de qualquer mkfs ou mount, dê uma olhada para confirmar o estado atual." },
      { type: "warning", content: "Se você reiniciar a live por qualquer motivo no meio da instalação, lembre de remontar tudo (root, boot, swap) antes de voltar para o chroot. As montagens não persistem." },
      { type: "info", content: "Onde no Arch você usa pacstrap para 'preencher' /mnt, no Gentoo o equivalente é descompactar o stage3 manualmente — vamos fazer isso já no próximo capítulo." },
      { type: "success", content: "Se até aqui deu tudo certo, o mais nervoso já passou. Daqui pra frente é seguir o roteiro com calma. O sistema-base já está esperando o conteúdo." },
    ],
  },
  {
    slug: "baixar-stage3",
    section: "instalacao",
    title: "Baixando o stage3 certo",
    difficulty: "iniciante",
    subtitle: "Escolhendo entre openrc, systemd, desktop, hardened, musl e validando o tarball.",
    intro: `O 'stage3' é o ponto de partida do Gentoo: um tarball (.tar.xz) com o sistema mínimo já compilado, contendo Portage, glibc, gcc e o conjunto básico para o sistema funcionar e se autoconstruir dali em diante. É equivalente ao base.tar.gz que outras distros usam internamente, só que aqui você pega ele explicitamente e descompacta na sua /mnt/gentoo. Não confunda com stage1 ou stage2: esses praticamente não existem mais para usuários finais (são para quem cria distribuições derivadas).

Existem várias 'sabores' de stage3 e a escolha agora define o tom da sua instalação. As duas dimensões principais são o init system (openrc ou systemd) e o profile base (default, desktop, hardened, musl, no-multilib). Para um desktop tradicional com Plasma ou GNOME no fluxo padrão, 'stage3-amd64-desktop-systemd' acelera bastante. Para servidor minimalista com OpenRC, 'stage3-amd64-openrc'. Para algo mais paranoico em segurança, hardened. Para algo bem fora da curva (sem glibc), musl ou musl-hardened.

Você vai baixar o stage3 ainda na live ISO, dentro de /mnt/gentoo, e validar a integridade com SHA-512 e GPG antes de descompactar. Pular essa validação é um risco real: um stage3 corrompido (download interrompido) ou trocado por um espelho comprometido entrega o sistema base que você vai chroot e usar por anos. Cinco segundos de checksum evitam um fim de semana de retrabalho.`,
    codes: [
      { lang: "bash", code: `# Entre na pasta onde tudo será descompactado.
cd /mnt/gentoo

# Liste mirrors oficiais em https://www.gentoo.org/downloads/mirrors/
# Para baixar com links: 'links https://www.gentoo.org/downloads'
# Para baixar direto via wget (exemplo com mirror brasileiro):
MIRROR="https://distfiles.gentoo.org"
RELEASES="\$MIRROR/releases/amd64/autobuilds"

# Pega a lista atualizada do stage3 desktop+systemd:
wget "\$RELEASES/latest-stage3-amd64-desktop-systemd.txt"
cat latest-stage3-amd64-desktop-systemd.txt
# Mostra a linha com o caminho do tarball atual, ex.:
# 20250114T170417Z/stage3-amd64-desktop-systemd-20250114T170417Z.tar.xz` },
      { lang: "bash", code: `# Variantes mais comuns (todas em /releases/amd64/autobuilds/):
# - stage3-amd64-openrc                  → server minimalista, OpenRC
# - stage3-amd64-systemd                 → server minimalista, systemd
# - stage3-amd64-desktop-openrc          → desktop com USE flags ricas, OpenRC
# - stage3-amd64-desktop-systemd         → desktop com USE flags ricas, systemd
# - stage3-amd64-hardened-openrc         → PIE+SSP, profile hardened
# - stage3-amd64-musl                    → musl libc no lugar de glibc
# - stage3-amd64-nomultilib-openrc       → puro 64-bit, sem 32-bit (nada de Steam/Wine)

# Para arm64, ppc64, riscv: troque 'amd64' pela arquitetura correspondente.` },
      { lang: "bash", code: `# Baixe o stage3 propriamente. O nome vem do .txt acima.
STAGE3=\$(grep -v '^#' latest-stage3-amd64-desktop-systemd.txt | head -n1 | awk '{print \$1}')
wget "\$RELEASES/\$STAGE3"
wget "\$RELEASES/\$STAGE3.DIGESTS"
wget "\$RELEASES/\$STAGE3.asc"

# Você terá agora 3 arquivos no /mnt/gentoo:
ls -lh stage3-*` },
      { lang: "bash", code: `# Validação SHA-512 (obrigatória).
sha512sum -c stage3-amd64-desktop-systemd-*.tar.xz.DIGESTS 2>&1 | grep OK
# saída esperada:
# stage3-...tar.xz: OK

# Se não aparecer 'OK' para o tarball, o download corrompeu — refaça.` },
      { lang: "bash", code: `# Validação GPG (autenticidade — confirma que veio mesmo do Gentoo).
# Importa as chaves de release do Gentoo (já vêm na live):
gpg --verify stage3-*.tar.xz.asc stage3-*.tar.xz
# saída desejada:
# gpg: Good signature from "Gentoo Linux Release Engineering ..."
# Aviso 'no ultimately trusted key' é normal na live;
# o que importa é o 'Good signature'.` },
      { lang: "bash", code: `# Erros comuns aqui:
# 1) 'BAD signature' → tarball foi modificado, NÃO descompacte.
# 2) 'No public key' → importe a chave:
#    gpg --keyserver hkps://keys.gentoo.org --recv-keys 0xBB572E0E2D182910
# 3) checksum diferente → repita o wget; mirror pode estar com versão antiga.

# Se tudo OK, prossiga para a descompactação no próximo capítulo.` },
    ],
    points: [
      "stage3 é o sistema-base mínimo já compilado — o ponto de partida da instalação.",
      "Escolha o init system (openrc ou systemd) AGORA; trocar depois é trabalhoso mas possível.",
      "Variante 'desktop' já vem com USE flags ricas; 'minimal' é melhor para servidores.",
      "Sempre baixe DIGESTS e .asc junto e valide com sha512sum + gpg --verify.",
      "Mirrors brasileiros (UFPR, C3SL) costumam ser muito mais rápidos que os internacionais.",
      "no-multilib bloqueia binários 32-bit — sem Steam, sem Wine. Só use se sabe o que faz.",
      "Armadilha comum: descompactar um stage3 baixado pela metade e descobrir só no chroot.",
      "Iniciante comum: misturar systemd no stage3 com profile openrc no make.conf — não faça.",
    ],
    alerts: [
      { type: "warning", content: "A escolha do init system define muito do seu fluxo diário. systemd traz comandos centralizados (systemctl, journalctl). OpenRC traz scripts simples e Unix-like (rc-service, rc-update). Decida com calma." },
      { type: "tip", content: "Use sempre o stage3 da semana mais recente disponível no mirror. Stage3 antigo significa horas a mais de @world update logo de cara." },
      { type: "danger", content: "Não pule a validação GPG/SHA-512. Um tarball corrompido ou comprometido contamina toda a instalação e é difícil detectar depois." },
      { type: "info", content: "stage1 e stage2 ainda existem para quem constrói distros derivadas com catalyst, mas o usuário comum sempre começa pelo stage3. Não procure stage1 'porque é mais hardcore' — não é mais necessário há mais de 15 anos." },
    ],
  },
  {
    slug: "descompactar-stage3",
    section: "instalacao",
    title: "Descompactando o stage3",
    difficulty: "iniciante",
    subtitle: "tar com as flags certas para preservar permissões, xattrs e dono numérico.",
    intro: `Com o tarball validado em /mnt/gentoo, agora vem o passo que mais parece mágica: um único comando tar derrama o sistema-base inteiro dentro do diretório montado. São cerca de 1 GiB compactado que viram 3 a 5 GiB descompactados, com binários, bibliotecas, configurações iniciais, Portage e o necessário para virar um sistema autossuficiente assim que você fizer o chroot.

O importante aqui são as flags do tar. Não use o 'tar xf' do dia a dia — você precisa preservar atributos especiais que o sistema base depende: extended attributes (xattrs) usados por capabilities (file capabilities como cap_net_raw em ping), ACLs, SELinux labels e o dono/grupo numérico exato. As flags certas são '-xpvf' com '--xattrs-include='*.*'' e '--numeric-owner'. Sem elas, ferramentas como ping, sudo e mount podem reclamar de permissão depois.

A descompactação leva alguns minutos em SSD, alguns mais em HDD. Adicione 'pv' (pipe viewer) se quiser ver progresso bonito, ou simplesmente passe '-v' (verbose) ao tar e deixe rolar. Quando terminar, dê um 'ls /mnt/gentoo' e confira que vê /etc, /usr, /var, /bin, /sbin, /lib, /lib64. Isso é o seu sistema novo, pronto para ser configurado.`,
    codes: [
      { lang: "bash", code: `# Confirme que está dentro do destino correto.
cd /mnt/gentoo
pwd        # /mnt/gentoo
ls *.tar.xz  # confirme o nome do stage3 baixado` },
      { lang: "bash", code: `# Comando OFICIAL recomendado pelo handbook:
tar xpvf stage3-*.tar.xz --xattrs-include='*.*' --numeric-owner
# Explicação flag a flag:
#   x = extract
#   p = preserve permissions
#   v = verbose (mostra cada arquivo; remova para acelerar muito)
#   f = next argument is the file
#   --xattrs-include='*.*' = preserva xattrs (capabilities, ACLs)
#   --numeric-owner = mantém UID/GID numéricos (essencial pre-chroot)` },
      { lang: "bash", code: `# Versão silenciosa (sem o 'v') é bem mais rápida no terminal:
tar xpf stage3-*.tar.xz --xattrs-include='*.*' --numeric-owner` },
      { lang: "bash", code: `# Quer ver progresso bonito sem o spam do verbose? Use pv.
# (pv já vem na live admincd; na minimal você pode ter que pular.)
pv stage3-*.tar.xz | tar xpf - --xattrs-include='*.*' --numeric-owner
# saída:
# 1.04GiB 0:01:23 [12.7MiB/s] [================>] 100%` },
      { lang: "bash", code: `# Confira que o sistema-base foi extraído corretamente.
ls /mnt/gentoo
# saída esperada:
# bin   dev  home  lib64  mnt  proc  run   srv  tmp  var
# boot  etc  lib   media  opt  root  sbin  sys  usr

du -sh /mnt/gentoo
# algo como 3.5G` },
      { lang: "bash", code: `# Pode apagar o tarball para liberar espaço (mantém o .DIGESTS se quiser).
rm /mnt/gentoo/stage3-*.tar.xz
# Mantenha .DIGESTS e .asc se quiser auditar depois; eles são pequenos.

# Erros comuns aqui:
# - 'tar: Cannot open: No such file or directory'
#     → você não está em /mnt/gentoo, ou o nome do arquivo tem typo.
# - 'tar: Exiting with failure status due to previous errors'
#     → tarball corrompido. Volte ao capítulo anterior e baixe de novo.` },
    ],
    points: [
      "Use SEMPRE as flags --xattrs-include='*.*' e --numeric-owner ao descompactar o stage3.",
      "Sem --numeric-owner, mapeamentos de usuário da live podem trocar dono dos arquivos do alvo.",
      "Sem --xattrs-include, comandos como ping perdem capabilities e param de funcionar para usuário comum.",
      "Adicione -v para depurar, mas remova depois — o terminal vira bagunça e desacelera.",
      "Use pv para barra de progresso quando o terminal tiver suporte.",
      "Apague o tarball depois para liberar espaço, mas mantenha o .DIGESTS para auditoria.",
      "Armadilha comum: descompactar fora de /mnt/gentoo (na pasta atual da live) e poluir a memória RAM.",
      "Iniciante comum: usar tar xzf (gzip) em vez de xf (tar autodetecta o xz).",
    ],
    alerts: [
      { type: "danger", content: "Descompactar o stage3 dentro do diretório errado pode encher a tmpfs da live, travar a sessão e forçar reboot. Sempre confirme 'pwd' antes de rodar tar." },
      { type: "tip", content: "Em máquinas lentas, prefira a versão sem -v. O custo de imprimir cada arquivo no console pode dobrar o tempo de descompactação." },
      { type: "info", content: "Onde no Arch você roda 'pacstrap /mnt base linux linux-firmware', no Gentoo essa etapa é o tar xpvf do stage3. O resto da configuração é manual em ambos." },
      { type: "success", content: "Quando o ls /mnt/gentoo mostrar a árvore Unix completa (bin, etc, usr, var…), você tem oficialmente um sistema Gentoo no disco. Falta só configurar e dar boot." },
    ],
  },
  {
    slug: "configurar-make-conf",
    section: "instalacao",
    title: "Configurando o /etc/portage/make.conf",
    difficulty: "intermediario",
    subtitle: "COMMON_FLAGS, MAKEOPTS, USE inicial, ACCEPT_LICENSE, mirrors e FEATURES.",
    intro: `O /etc/portage/make.conf é o coração da sua instalação. É um arquivo no estilo shell (variáveis VAR='valor') que diz ao Portage como compilar tudo: quais flags passar para o gcc, quantos jobs paralelos rodar, quais USE flags ativar globalmente, quais licenças você aceita, e onde buscar os fontes. Quase toda otimização e quase toda confusão futura passam por aqui.

O stage3 já vem com um make.conf padrão razoável, mas você quer revisá-lo agora — antes do primeiro emerge — porque mudar essas variáveis depois força recompilar metade do sistema. As mais importantes: COMMON_FLAGS define -O2 e -march, MAKEOPTS define quantos -j paralelos, USE define funcionalidades opcionais ativas em todos os pacotes, ACCEPT_LICENSE controla EULAs proprietárias, e GENTOO_MIRRORS aponta para o espelho mais rápido.

Erre para mais aqui em vez de para menos. Use -march=native só se a máquina onde compila for a mesma onde roda. Use MAKEOPTS=-j$(nproc) e ajuste se sua RAM for justa (cada job de gcc come ~2 GB para C++ pesado). USE flags em make.conf são globais — para algo de pacote específico use /etc/portage/package.use. Vamos passar pelos blocos típicos e o que cada um faz.`,
    codes: [
      { lang: "bash", code: `# Edite o make.conf dentro do alvo (ainda PRÉ-chroot).
nano -w /mnt/gentoo/etc/portage/make.conf
# -w desliga o word-wrap do nano, evitando quebras malucas em paths.

# O arquivo já existe com defaults — você vai EDITAR, não criar do zero.` },
      { lang: "conf", code: `# /etc/portage/make.conf — modelo desktop amd64 moderno.

# Otimização do compilador. -O2 é o padrão; -O3 raramente compensa
# e quebra alguns pacotes. -march=native só se a máquina-de-compilar
# = máquina-de-rodar. Caso contrário, use uma micro-arch específica
# como -march=znver3 ou -march=alderlake.
COMMON_FLAGS="-O2 -pipe -march=native"
CFLAGS="\${COMMON_FLAGS}"
CXXFLAGS="\${COMMON_FLAGS}"
FCFLAGS="\${COMMON_FLAGS}"
FFLAGS="\${COMMON_FLAGS}"

# Paralelismo do make. Regra prática: -j = núcleos lógicos.
# Se RAM < 2 GB por job, baixe (ex.: máquina com 8 cores e 8 GB → -j4).
MAKEOPTS="-j\$(nproc)"

# Mesmo paralelismo para o emerge (instalar N pacotes ao mesmo tempo).
EMERGE_DEFAULT_OPTS="--jobs=\$(nproc) --load-average=\$(nproc)"` },
      { lang: "conf", code: `# USE flags GLOBAIS (afetam todos os pacotes que reconhecem essas flags).
# Comece minimalista — você adiciona conforme precisa.
USE="X wayland alsa pulseaudio dbus elogind networkmanager \\
     bluetooth pipewire vulkan -systemd -gnome -kde"

# Quando entrar em USE, '-flag' DESATIVA, 'flag' ATIVA.
# USE pode ser estendido em /etc/portage/package.use por pacote.

# Hardware: VIDEO_CARDS e INPUT_DEVICES disparam a compilação dos drivers certos.
VIDEO_CARDS="amdgpu radeonsi"      # ou: nvidia, intel, nouveau
INPUT_DEVICES="libinput"

# Licenças aceitas. '*' libera tudo (inclusive proprietário); '@FREE'
# só software livre. O default '@FREE @BINARY-REDISTRIBUTABLE' é seguro.
ACCEPT_LICENSE="@FREE @BINARY-REDISTRIBUTABLE linux-fw-redistributable"

# Pacotes em testing (~amd64). Vazio = só 'amd64' estável.
ACCEPT_KEYWORDS="amd64"` },
      { lang: "conf", code: `# Mirrors. mirrorselect monta isso pra você (próximo capítulo).
GENTOO_MIRRORS="https://gentoo.c3sl.ufpr.br/ \\
                https://distfiles.gentoo.org/"

# FEATURES controla comportamento do Portage (sandbox, ccache, parallel-fetch).
# Os defaults são bons; estes adicionais são populares:
FEATURES="parallel-fetch parallel-install candy"
# - parallel-fetch: baixa o próximo pacote enquanto compila o atual.
# - parallel-install: paraleliza a fase 'install' de pacotes independentes.
# - candy: ASCII colorido bonitinho. Inofensivo, dá moral.

# Idiomas instalados (LINGUAS é o antigo, L10N é o novo).
L10N="pt-BR en"

# Diretórios padrão (raramente mudam, mas bom saber):
PORTAGE_TMPDIR="/var/tmp"
DISTDIR="/var/cache/distfiles"
PKGDIR="/var/cache/binpkgs"` },
      { lang: "bash", code: `# Verifique que o arquivo está OK abrindo de novo:
cat /mnt/gentoo/etc/portage/make.conf | grep -v '^#' | grep -v '^\$'

# Erros comuns:
# - aspas não fechadas → primeiro emerge já reclama com mensagem confusa.
# - usar bash heredoc dentro do arquivo → não é shell de verdade.
# - mudar COMMON_FLAGS depois de instalar → vai recompilar TUDO no -e @world.` },
    ],
    points: [
      "make.conf é shell-like: VAR='valor', linhas com # são comentário.",
      "COMMON_FLAGS centraliza CFLAGS/CXXFLAGS — não duplique flags em cada uma.",
      "-march=native é só para máquinas onde compila = onde roda; senão, escolha uma micro-arch fixa.",
      "MAKEOPTS = núcleos, MAS reduza se RAM por core for menor que 2 GB para C++ pesado.",
      "USE flags globais aqui valem para tudo; use /etc/portage/package.use para casos específicos.",
      "VIDEO_CARDS e INPUT_DEVICES não são opcionais — sem eles, X/Wayland nem inicia.",
      "ACCEPT_LICENSE='*' aceita tudo; '@FREE' bloqueia firmware de Wi-Fi de muitos laptops.",
      "Armadilha comum: copiar make.conf de blog antigo com flags inválidas (-fweb, -fsee) e quebrar o gcc.",
    ],
    alerts: [
      { type: "warning", content: "Mudar COMMON_FLAGS, USE global ou profile depois força 'emerge -e @world' (recompila TUDO). Reflita agora para evitar 12h de build depois." },
      { type: "tip", content: "Para descobrir o -march correto sem 'native', rode 'gcc -march=native -E -v - </dev/null 2>&1 | grep cc1' em uma máquina equivalente." },
      { type: "danger", content: "Nunca use -O3 globalmente sem motivo. Várias bibliotecas (notavelmente glibc, gcc) têm bugs com -O3 e podem gerar binários instáveis difíceis de debugar." },
      { type: "info", content: "FEATURES='ccache' acelera muito quem recompila o mesmo pacote várias vezes (kernel, dev local). Veremos no capítulo de otimização." },
    ],
  },
  {
    slug: "chroot",
    section: "instalacao",
    title: "Entrando no chroot",
    difficulty: "iniciante",
    subtitle: "Bind mounts, resolv.conf, env-update e o prompt que diz 'estou dentro'.",
    intro: `Até agora você esteve trabalhando dentro da live ISO, manipulando arquivos do futuro sistema lá em /mnt/gentoo como se fosse um diretório qualquer. O chroot ('change root') faz uma mudança radical de perspectiva: a partir do momento em que você executa 'chroot /mnt/gentoo /bin/bash', o seu shell passa a enxergar /mnt/gentoo como a raiz '/'. Você está, para todos os efeitos, dentro do sistema-alvo, com o gcc dele, com o glibc dele, com o Portage dele.

Antes do chroot funcionar de forma útil, você precisa montar dentro de /mnt/gentoo alguns pseudo-filesystems do kernel: /proc (informações de processos), /sys (interface com o kernel), /dev (dispositivos), e /run (estado em runtime). Sem esses bind mounts, comandos básicos como 'ps', 'mount' e até o emerge falham com erros estranhos. E você também precisa copiar o /etc/resolv.conf da live para dentro, ou o sistema novo vai ficar sem DNS e nenhum 'wget' funciona.

Depois do chroot, dois comandos mudam o ambiente: 'env-update' regenera variáveis de ambiente a partir dos arquivos em /etc/env.d/, e 'source /etc/profile' aplica isso na sua sessão atual. Termine ajustando o prompt (PS1) com algo que lembre você visualmente que está dentro do chroot — facilita demais não confundir terminais. Daí em diante, todo comando que você der atinge o sistema novo.`,
    codes: [
      { lang: "bash", code: `# Copia o resolv.conf da live para dentro do alvo (preserva permissões).
cp --dereference /etc/resolv.conf /mnt/gentoo/etc/
# --dereference copia o conteúdo se for symlink (resolv.conf hoje
# é gerenciado por systemd-resolved em muitas ISOs e vira symlink).

# Verifique:
cat /mnt/gentoo/etc/resolv.conf
# Deve listar nameserver(s) que funcionam.` },
      { lang: "bash", code: `# Bind mounts dos pseudo-filesystems do kernel.
mount --types proc /proc /mnt/gentoo/proc
mount --rbind /sys  /mnt/gentoo/sys
mount --make-rslave /mnt/gentoo/sys
mount --rbind /dev  /mnt/gentoo/dev
mount --make-rslave /mnt/gentoo/dev
mount --bind /run  /mnt/gentoo/run
mount --make-slave /mnt/gentoo/run

# --rbind faz bind recursivo (pega submontagens como /dev/pts).
# --make-rslave evita que mudanças dentro do chroot vazem para a live.` },
      { lang: "bash", code: `# Faça o chroot propriamente.
chroot /mnt/gentoo /bin/bash

# A partir daqui, '/' = /mnt/gentoo da live.
# Agora atualize o ambiente:
source /etc/profile

# E mude o prompt para ficar óbvio que você está dentro:
export PS1="(chroot) \${PS1}"
# Seu prompt vai virar algo como:
# (chroot) livecd / #` },
      { lang: "bash", code: `# Confira que o ambiente está saudável dentro do chroot.
cat /etc/os-release    # deve mostrar 'Gentoo/Linux'
gcc --version          # gcc do stage3 responde
ls /usr/portage 2>/dev/null || ls /var/db/repos/gentoo
# /var/db/repos/gentoo deve estar vazio neste momento — vamos popular
# com emerge-webrsync no capítulo de sync.

# Teste a internet de dentro do chroot:
ping -c2 gentoo.org
# Se falhar: resolv.conf não foi copiado, ou /etc/hosts está vazio,
# ou a interface de rede da live não está roteando.` },
      { lang: "bash", code: `# Atalho profissional: salve TODOS os mounts e o chroot em um script
# para sempre que precisar reentrar (ex.: depois de um reboot).
cat > /root/enter-chroot.sh <<'EOF'
#!/bin/sh
mount /dev/sda3 /mnt/gentoo
mount /dev/sda1 /mnt/gentoo/boot
mount --types proc /proc /mnt/gentoo/proc
mount --rbind /sys  /mnt/gentoo/sys && mount --make-rslave /mnt/gentoo/sys
mount --rbind /dev  /mnt/gentoo/dev && mount --make-rslave /mnt/gentoo/dev
mount --bind /run   /mnt/gentoo/run && mount --make-slave /mnt/gentoo/run
cp --dereference /etc/resolv.conf /mnt/gentoo/etc/
chroot /mnt/gentoo /bin/bash
EOF
chmod +x /root/enter-chroot.sh` },
      { lang: "bash", code: `# Para SAIR do chroot, é só:
exit
# Você volta ao shell da live. As montagens persistem (bind mounts).
# Para desmontar TUDO ao final da instalação:
umount -lR /mnt/gentoo` },
    ],
    points: [
      "chroot 'aterrissa' você dentro do sistema-alvo — todo comando dali atinge o novo sistema.",
      "Sem bind mounts de /proc, /sys, /dev, /run, ferramentas básicas falham com erros confusos.",
      "Sempre copie /etc/resolv.conf da live antes do chroot, ou não terá DNS.",
      "Use --dereference no cp para resolver symlinks (comum com systemd-resolved).",
      "source /etc/profile aplica variáveis novas e mexe nas paths corretas do chroot.",
      "Mude o PS1 para deixar visualmente claro que você está dentro — evita catástrofes.",
      "Armadilha comum: esquecer de copiar resolv.conf e perder 10 minutos depurando 'wget falhou'.",
      "Iniciante comum: rodar 'mount /dev' simples em vez de '--rbind /dev' e perder /dev/pts.",
    ],
    alerts: [
      { type: "tip", content: "Crie um script enter-chroot.sh logo no começo. Você VAI precisar reentrar várias vezes durante a instalação (após reboots, depois de instalar o kernel, etc)." },
      { type: "warning", content: "Se você tentar reboot sem desmontar com 'umount -lR /mnt/gentoo' primeiro, a live ISO pode reclamar e desligar com filesystem inconsistente. Sempre desmonte antes." },
      { type: "info", content: "O chroot não é uma 'máquina virtual' — ele compartilha o kernel da live. Por isso o kernel que você compilar depois só será usado de fato no próximo boot." },
      { type: "success", content: "O '(chroot)' no PS1 é um pequeno hack que salva muita gente de rodar 'rm -rf' achando que estava dentro do alvo e estar na live (ou vice-versa)." },
    ],
  },
  {
    slug: "mirrorlist-portage",
    section: "instalacao",
    title: "Mirrors e repos do Portage",
    difficulty: "iniciante",
    subtitle: "mirrorselect, repositório principal em /etc/portage/repos.conf/gentoo.conf.",
    intro: `O Portage baixa duas coisas o tempo todo: tarballs de código-fonte (distfiles, em /var/cache/distfiles) e a árvore Gentoo (a coleção de ebuilds, em /var/db/repos/gentoo). Você quer que ambas venham de um espelho rápido e geograficamente próximo. No Brasil, os mirrors da UFPR (C3SL) e da Unicamp tendem a ser muito mais rápidos do que o distfiles.gentoo.org default. Configurar o mirror certo aqui economiza horas ao longo da vida da instalação.

Existem dois lugares para mexer. O primeiro é GENTOO_MIRRORS no /etc/portage/make.conf — aqui você lista os mirrors HTTP/FTP de onde baixar os distfiles. O segundo é /etc/portage/repos.conf/gentoo.conf, onde fica o sync-uri da árvore principal (rsync, git ou webrsync). A ferramenta mirrorselect ajuda nos dois passos: o primeiro com -i (interativo) ou -s (auto pelos N mais rápidos), o segundo com -o.

A árvore Gentoo pode ser sincronizada por três protocolos: rsync (clássico, eficiente, padrão), git (mais lento mas com histórico completo, bom para devs) e webrsync (HTTPS, ótimo quando rsync está bloqueado por firewall). O método é configurado via 'sync-type' no gentoo.conf. Para a primeira sincronização da vida, sempre use webrsync — ela baixa um snapshot assinado e validado, mais robusto contra mirror corrompido.`,
    codes: [
      { lang: "bash", code: `# Já dentro do chroot. Instale o mirrorselect (já vem em alguns stage3):
emerge --ask app-portage/mirrorselect
# Se já vier instalado, ele apenas confirma 'nothing to merge'.` },
      { lang: "bash", code: `# Modo interativo: lista mirrors, você marca com espaço.
mirrorselect -i -o >> /etc/portage/make.conf
# -i abre TUI com a lista ordenada por país.
# -o emite formato pronto para append no make.conf.

# Modo automático: pega os 3 mais rápidos por benchmark.
mirrorselect -s3 -b10 -o >> /etc/portage/make.conf
# -s3 = top 3, -b10 = testa 10 mais próximos, -o = stdout.` },
      { lang: "bash", code: `# Confira o resultado no make.conf:
tail /etc/portage/make.conf
# saída esperada (linha nova ao final):
# GENTOO_MIRRORS="https://gentoo.c3sl.ufpr.br/ https://mirror.versatushpc.com.br/gentoo/ ..."

# Se duplicou a variável GENTOO_MIRRORS, edite para deixar só uma.` },
      { lang: "bash", code: `# Crie a pasta de configs de repos.
mkdir -p /etc/portage/repos.conf

# Copie o template oficial.
cp /usr/share/portage/config/repos.conf /etc/portage/repos.conf/gentoo.conf
cat /etc/portage/repos.conf/gentoo.conf` },
      { lang: "ini", code: `# /etc/portage/repos.conf/gentoo.conf — modelo padrão.
[DEFAULT]
main-repo = gentoo

[gentoo]
location = /var/db/repos/gentoo
sync-type = rsync
sync-uri = rsync://rsync.gentoo.org/gentoo-portage
auto-sync = yes
sync-rsync-verify-jobs = 1
sync-rsync-verify-metamanifest = yes
sync-rsync-verify-max-age = 24
sync-openpgp-key-path = /usr/share/openpgp-keys/gentoo-release.asc
sync-openpgp-keyserver = hkps://keys.gentoo.org` },
      { lang: "ini", code: `# Variante: sync via git (lento mas com histórico completo).
[gentoo]
location = /var/db/repos/gentoo
sync-type = git
sync-uri = https://github.com/gentoo-mirror/gentoo.git
auto-sync = yes

# Variante: sync via webrsync (HTTPS, ótimo atrás de proxy).
# Não há sync-uri; o emerge-webrsync usa GENTOO_MIRRORS.
[gentoo]
location = /var/db/repos/gentoo
sync-type = webrsync
auto-sync = yes` },
    ],
    points: [
      "GENTOO_MIRRORS no make.conf controla de onde vêm os distfiles (códigos-fonte).",
      "/etc/portage/repos.conf/gentoo.conf controla de onde vem a árvore Gentoo (ebuilds).",
      "mirrorselect -i é o caminho interativo; -s3 -b10 escolhe automaticamente os mais rápidos.",
      "Mirrors brasileiros (UFPR, Unicamp, Versatus HPC) costumam ser ordens de magnitude mais rápidos.",
      "rsync é o sync-type padrão; git é melhor para devs; webrsync funciona atrás de firewall HTTPS.",
      "sync-openpgp-* configura validação criptográfica do snapshot — não desabilite.",
      "Armadilha comum: deixar duas linhas GENTOO_MIRRORS no make.conf após mirrorselect e a segunda silenciar a primeira.",
      "Iniciante comum: confundir mirrors de distfiles (binários) com mirror da árvore (ebuilds) — são coisas separadas.",
    ],
    alerts: [
      { type: "tip", content: "Para a primeira sync, usar webrsync é mais seguro porque baixa um snapshot inteiro assinado, em vez de incremental. Depois pode trocar para rsync." },
      { type: "info", content: "Para checar latência real para um mirror, um simples 'curl -o /dev/null -w '%{speed_download}\\n' https://mirror.exemplo/gentoo/distfiles/big-file' já dá uma noção." },
      { type: "warning", content: "Mirrors espelham distfiles com algum atraso (minutos a horas). Se um pacote acabou de ser publicado, pode demorar para chegar no mirror brasileiro — caia no oficial via fallback." },
      { type: "success", content: "Configurar mirror local rápido aqui é o que separa um Gentoo 'demorado' de um Gentoo 'fluido'. Vale o tempo." },
    ],
  },
  {
    slug: "sync-portage",
    section: "instalacao",
    title: "Sincronizando a árvore Portage",
    difficulty: "iniciante",
    subtitle: "emerge-webrsync na primeira vez, depois emerge --sync e leitura de news.",
    intro: `A 'árvore Gentoo' é a coleção de mais de 19 mil ebuilds (receitas de pacotes) que o Portage usa como catálogo. Ela vive em /var/db/repos/gentoo e precisa ser baixada antes do primeiro emerge funcionar — porque sem ebuilds o Portage não sabe nada. Esse processo de baixar/atualizar é chamado de 'sync', e existem duas ferramentas: emerge-webrsync (HTTPS, snapshot completo, mais robusto) e emerge --sync (rsync incremental, mais rápido após a primeira vez).

Para a primeira sincronização da vida, use SEMPRE emerge-webrsync. Ela baixa um arquivo único de uns 30 MiB que contém o snapshot do dia, valida assinatura GPG e descompacta em /var/db/repos/gentoo. É robusto contra rsync mirrors capengas e funciona até atrás de proxies HTTPS chatos. Depois, para manter atualizado no dia a dia, troque para emerge --sync — incremental, baixa só o delta.

Junto com a árvore vêm 'news items': avisos importantes da equipe Gentoo sobre mudanças que podem afetar você (mudança de profile, deprecation, breaking change em pacote crítico). Sempre que você dá um sync, leia as news novas com 'eselect news read'. Ignorar isso é como ignorar o aviso 'leia o changelog antes de atualizar' — funciona até dar errado.`,
    codes: [
      { lang: "bash", code: `# Primeira sincronização — sempre webrsync.
emerge-webrsync
# Saída tipica:
# Fetching most recent snapshot ...
# Checking validity of signature ...
# Syncing local tree ...
# === Sync completed for gentoo

# Tempo: 1-3 minutos numa boa conexão.
# Espaço final: ~600 MiB em /var/db/repos/gentoo.` },
      { lang: "bash", code: `# Confira que a árvore está lá.
ls /var/db/repos/gentoo | head
# Saída:
# acct-group  app-arch  dev-cpp  metadata  profiles  ...

# Conte os ebuilds (curiosidade):
find /var/db/repos/gentoo -name '*.ebuild' | wc -l
# Algo como 30.000+ entradas (somando todas as versões).` },
      { lang: "bash", code: `# A partir da SEGUNDA vez (no dia a dia), use emerge --sync:
emerge --sync
# Mais rápido, só baixa diffs. Precisa do mirror rsync configurado
# em /etc/portage/repos.conf/gentoo.conf.

# Atalho equivalente: 'emaint sync -a'.

# Erros típicos:
# - 'rsync: connection refused' → mirror rsync está fora ou bloqueado.
#   Solução temporária: rode emerge-webrsync de novo.
# - 'verify: BAD signature' → corrupção no caminho.
#   Solução: 'rm -rf /var/db/repos/gentoo/*' e 'emerge-webrsync' de novo.` },
      { lang: "bash", code: `# Após cada sync, leia as news.
eselect news list
# saída exemplo:
#   1  N  2024-08-15  binary packages now available for amd64 stable
#   2  N  2024-09-02  pulseaudio masked, pipewire is the default

# Leia uma:
eselect news read 1

# Marque todas como lidas (após ler):
eselect news read --quiet new
# Vê só não lidas:
eselect news list new` },
      { lang: "bash", code: `# Configure sync automático junto com emerge --update no dia a dia:
# Adicione ao /etc/portage/make.conf:
echo 'EMERGE_DEFAULT_OPTS="\${EMERGE_DEFAULT_OPTS} --sync-submodule=glsa"' \\
  >> /etc/portage/make.conf

# Ou use 'emaint sync --auto' como cron diário em servidores.

# Para forçar sync de UM repositório específico (útil com overlays):
emaint sync --repo gentoo` },
    ],
    points: [
      "Primeira sincronização: SEMPRE emerge-webrsync (snapshot HTTPS validado).",
      "Sincronizações seguintes: emerge --sync (rsync incremental, mais rápido).",
      "/var/db/repos/gentoo é onde a árvore vive — não edite arquivos lá manualmente.",
      "eselect news read após cada sync — news avisam de mudanças importantes.",
      "Depois de news 'major' (ex.: profile mudou de 17.0 para 23.0), siga as instruções antes de qualquer @world.",
      "Webrsync funciona atrás de firewall HTTPS; rsync clássico precisa porta 873 aberta.",
      "Armadilha comum: pular eselect news read e depois ficar perdido sobre por que algo quebrou.",
      "Iniciante comum: rodar emerge --sync em sistema novo (sem árvore) e tomar erro confuso.",
    ],
    alerts: [
      { type: "tip", content: "Crie um alias 'sync-news' que faz emerge --sync && eselect news read new. Vai te poupar de esquecer a parte das news." },
      { type: "warning", content: "Ignorar uma news pode te custar uma manhã de troubleshooting. As 'major' costumam exigir alguma ação manual antes do próximo @world." },
      { type: "info", content: "GLEP 74 e GLEP 78 garantem que tanto webrsync quanto rsync sejam validados criptograficamente — desde que sync-openpgp esteja configurado." },
      { type: "success", content: "Quando vir '=== Sync completed for gentoo' você tem um catálogo de pacotes funcional. A partir daqui o emerge sabe o que fazer." },
    ],
  },
  {
    slug: "escolher-profile",
    section: "instalacao",
    title: "Escolhendo o profile",
    difficulty: "intermediario",
    subtitle: "eselect profile list/set, default vs desktop vs hardened vs no-multilib vs musl.",
    intro: `Um 'profile' no Gentoo é um conjunto pré-definido de USE flags, masks, keywords, system-set e variáveis de ambiente que define o tom geral do sistema. É a maneira do Portage perguntar 'que tipo de máquina é essa?' sem você precisar configurar 200 USE flags na mão. Existe profile para desktop, para servidor, para hardened (segurança reforçada), para sistemas sem suporte a 32-bit (no-multilib), para musl libc, para systemd e para OpenRC.

A escolha do profile costuma combinar com a variante do stage3 que você baixou. Se baixou stage3-desktop-systemd, o profile já vem 'default/linux/amd64/23.0/desktop/systemd' por padrão. Se quiser algo diferente — por exemplo, mudar de OpenRC para systemd, ou para hardened — você troca com 'eselect profile set'. Mudar profile depois é caro: força recompilar muita coisa, porque as USE flags globais mudam.

O número '23.0' (atual no momento) é a versão do conjunto de profiles. Periodicamente o Gentoo lança nova versão (era 17.0 antes) e existe um período de migração. As news avisam quando isso vai acontecer. Por enquanto, decida: desktop ou server, OpenRC ou systemd, multilib ou no-multilib, glibc ou musl, default ou hardened. A maioria absoluta das pessoas fica com 'default/linux/amd64/23.0/desktop/[openrc|systemd]'.`,
    codes: [
      { lang: "bash", code: `# Lista todos os profiles disponíveis para a sua arquitetura.
eselect profile list
# saída (resumida):
#   1   default/linux/amd64/23.0 (stable)
#   2   default/linux/amd64/23.0/desktop (stable)
#   3   default/linux/amd64/23.0/desktop/gnome (stable)
#   4   default/linux/amd64/23.0/desktop/gnome/systemd (stable)
#   5   default/linux/amd64/23.0/desktop/plasma (stable)
#   6   default/linux/amd64/23.0/desktop/plasma/systemd (stable)
#   7   default/linux/amd64/23.0/desktop/systemd (stable)
#  ...
#  21   default/linux/amd64/23.0/hardened (stable)
#  22   default/linux/amd64/23.0/hardened/selinux (stable)
#  23   default/linux/amd64/23.0/musl (stable)
#  24   default/linux/amd64/23.0/no-multilib/openrc (stable)
#  25   default/linux/amd64/23.0/systemd (stable)` },
      { lang: "bash", code: `# Mostra o profile ativo agora.
eselect profile show
# saída:
# Current /etc/portage/make.profile symlink:
#   default/linux/amd64/23.0/desktop/systemd

# Em essência, o profile é só um symlink:
ls -l /etc/portage/make.profile
# /etc/portage/make.profile -> ../../var/db/repos/gentoo/profiles/default/linux/amd64/23.0/desktop/systemd` },
      { lang: "bash", code: `# Mude para um profile específico pelo número:
eselect profile set 7
# ou pelo nome:
eselect profile set default/linux/amd64/23.0/desktop/systemd

# Confirme:
eselect profile show` },
      { lang: "bash", code: `# Variantes principais e quando escolher cada:
#
# default/linux/amd64/23.0
#   - Server minimalista, sem USE de desktop (no GUI por default).
#
# .../desktop[/openrc|systemd]
#   - Desktop genérico. USE preset com X, alsa, dbus, pulseaudio etc.
#
# .../desktop/gnome[/systemd]
#   - Pré-configura USE flags do GNOME (recomenda systemd).
#
# .../desktop/plasma[/systemd]
#   - Pré-configura USE flags do KDE Plasma.
#
# .../hardened[/selinux]
#   - PIE+SSP, toolchain endurecida, sem 32-bit. Ideal para servidor exposto.
#
# .../no-multilib/[openrc|systemd]
#   - Sem suporte a binários 32-bit. Steam/Wine não funcionam.
#
# .../musl[/llvm]
#   - musl libc no lugar de glibc. Sistema bem mais enxuto, mas com
#     algumas incompatibilidades (NSS, locale gen, alguns binários proprietários).` },
      { lang: "bash", code: `# Após mudar de profile, atualize variáveis de ambiente:
env-update && source /etc/profile

# Se você mudou de profile DEPOIS de já ter pacotes instalados,
# rode um @world com --newuse para recompilar quem tem USE diferente:
emerge --ask --update --deep --newuse @world
# Em mudança de major (ex.: 17.0 -> 23.0), pode ser preciso
# emerge -e @world (recompila TUDO). Demora horas.` },
    ],
    points: [
      "profile = preset de USE flags + masks + system-set para um caso de uso.",
      "É só um symlink em /etc/portage/make.profile — pode inspecionar com ls -l.",
      "Combine profile com a variante do stage3 (não misture stage3-systemd com profile openrc).",
      "Para desktop padrão: 'default/linux/amd64/23.0/desktop/[openrc|systemd]'.",
      "no-multilib quebra Steam, Wine e várias proprietárias — só use em server.",
      "musl é interessante mas tem incompatibilidades; espere mexer um pouco depois.",
      "Trocar profile depois custa caro — escolha bem agora.",
      "Armadilha comum: escolher hardened sem entender a complexidade extra (PaX, SELinux).",
    ],
    alerts: [
      { type: "warning", content: "Mudar profile depois de @world já instalado força recompilar muitos pacotes (até 'emerge -e @world' em mudança grande). Decida agora com calma." },
      { type: "tip", content: "Se você não sabe qual escolher, vá de 'desktop/systemd' para máquina pessoal ou 'default' (sem desktop) para servidor. Você sempre pode adicionar USE depois." },
      { type: "info", content: "Profile 'desktop' não é só USE: ele define system-set extra (alguns pacotes no @system implicitamente), o que afeta dependências e atualizações." },
      { type: "danger", content: "Hardened+SELinux é poderoso mas exige conhecimento sobre policies, contexts e auditoria. Em produção mal configurado, dá mais problema do que segurança." },
    ],
  },
  {
    slug: "timezone-locale",
    section: "instalacao",
    title: "Timezone e locales",
    difficulty: "iniciante",
    subtitle: "/etc/timezone, locale.gen, eselect locale e o LANG do sistema.",
    intro: `Antes de ir compilar kernel e instalar bootloader, faltam dois ajustes pequenos mas essenciais: dizer ao sistema em que fuso horário ele está rodando e quais locales (idioma + região) ele deve gerar. Sem timezone, todos os timestamps de log ficam em UTC e você sofre na hora de correlacionar eventos. Sem locale gerado, comandos imprimem warnings tipo 'cannot set LC_ALL to default locale' e ferramentas que dependem de UTF-8 mostram caracteres bizarros.

Para o timezone, existem dois jeitos no Gentoo. No OpenRC clássico, você escreve o nome do timezone (ex.: America/Sao_Paulo) em /etc/timezone e roda 'emerge --config sys-libs/timezone-data', que copia o arquivo binário correto de /usr/share/zoneinfo para /etc/localtime. No systemd, o caminho moderno é 'timedatectl set-timezone America/Sao_Paulo' direto. Os dois resultam no mesmo /etc/localtime apontando para o lugar certo.

Para locales, você lista no /etc/locale.gen quais quer disponíveis (ex.: pt_BR.UTF-8 e en_US.UTF-8), roda locale-gen para construir esses locales binários, e depois escolhe o padrão do sistema com 'eselect locale set' ou via /etc/env.d/02locale. UTF-8 é obrigatório nos dias de hoje — use C.UTF-8 ou en_US.UTF-8 como fallback se quiser logs em inglês. Sempre prefira UTF-8 em vez das variantes ISO antigas.`,
    codes: [
      { lang: "bash", code: `# OpenRC: configure o timezone via arquivo + emerge --config.
echo "America/Sao_Paulo" > /etc/timezone
emerge --config sys-libs/timezone-data
# saída:
# >>> Setting timezone to America/Sao_Paulo
# >>> /etc/localtime updated.

# Liste timezones disponíveis:
ls /usr/share/zoneinfo/America | head` },
      { lang: "bash", code: `# systemd: o caminho moderno é uma linha só.
ln -sf /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime
# (no chroot timedatectl ainda não funciona; faça symlink manual.)

# Quando o sistema bootar com systemd, você pode trocar com:
# timedatectl set-timezone America/Sao_Paulo

# Verifique:
date
# Sex 17 Jan 2025 14:32:01 -03 — o '-03' indica BRT, sucesso.` },
      { lang: "bash", code: `# Edite /etc/locale.gen para descomentar os locales desejados.
nano -w /etc/locale.gen
# Descomente (remova o '#' do começo) as linhas:
# en_US.UTF-8 UTF-8
# pt_BR.UTF-8 UTF-8
# C.UTF-8 UTF-8

# Gere os binários:
locale-gen
# saída:
# * Generating 3 locales (this might take a while) with 4 jobs
#  * (1/3) Generating en_US.UTF-8 ...                   [ ok ]
#  * (2/3) Generating pt_BR.UTF-8 ...                   [ ok ]
#  * (3/3) Generating C.UTF-8 ...                       [ ok ]
#  * Generation complete` },
      { lang: "bash", code: `# Liste e selecione o locale padrão.
eselect locale list
# saída:
#   [1]   C
#   [2]   C.utf8
#   [3]   en_US.utf8
#   [4]   POSIX
#   [5]   pt_BR.utf8 *

# O '*' indica o atual. Selecione (por número):
eselect locale set 5
# Ou para LANG=pt_BR.UTF-8 explicitamente:
eselect locale set pt_BR.utf8` },
      { lang: "bash", code: `# Aplique as mudanças no ambiente atual.
env-update && source /etc/profile

# Confirme:
locale
# Saída esperada:
# LANG=pt_BR.UTF-8
# LC_CTYPE="pt_BR.UTF-8"
# LC_NUMERIC="pt_BR.UTF-8"
# ...
# LC_ALL=

# Se LC_ALL aparecer setada, normalmente foi colocada por um script
# anterior; remova de /etc/env.d/ para evitar override do LANG.` },
      { lang: "bash", code: `# Personalize keymap e fonte de console (OpenRC, em /etc/conf.d/keymaps).
nano -w /etc/conf.d/keymaps
# Edite:
#   keymap="br-abnt2"      # ou us, br-abnt, dvorak etc.
#   windowkeys="YES"

# No systemd, o equivalente é:
# localectl set-keymap br-abnt2

# Para console (fonte), edite /etc/conf.d/consolefont:
#   consolefont="ter-v16n"   # fonte Terminus, legível em alta resolução` },
    ],
    points: [
      "Sempre defina timezone antes de gerar logs — facilita debugging para o resto da vida.",
      "OpenRC: /etc/timezone + 'emerge --config sys-libs/timezone-data'.",
      "systemd no chroot: ln -sf manual; após boot, 'timedatectl set-timezone'.",
      "/etc/locale.gen: descomente as linhas dos locales desejados antes de locale-gen.",
      "Use SEMPRE UTF-8 — variantes ISO (ISO-8859-1) só causam dor de cabeça.",
      "eselect locale set define o LANG default do sistema, gravado em /etc/env.d/02locale.",
      "Armadilha comum: esquecer de rodar 'env-update && source /etc/profile' depois e achar que não pegou.",
      "Iniciante comum: setar LANG=pt_BR sem o .UTF-8 e ter caracteres acentuados quebrados.",
    ],
    alerts: [
      { type: "tip", content: "Mantenha en_US.UTF-8 também gerado, mesmo que use pt_BR como padrão. Várias mensagens de erro são mais pesquisáveis em inglês quando você precisa googlar." },
      { type: "info", content: "C.UTF-8 é um locale especial que se comporta como C (ASCII puro) mas com suporte a UTF-8. Útil em scripts que querem ordenação previsível." },
      { type: "warning", content: "Se você setar LC_ALL em /etc/env.d/, ela sobrescreve TUDO (LANG, LC_*). Sintoma: mudou o LANG e nada acontece. Tire o LC_ALL." },
      { type: "success", content: "Com timezone certo, locales gerados e LANG selecionado, o sistema-base está praticamente pronto. Próximo grande passo: o kernel." },
    ],
  },
];
