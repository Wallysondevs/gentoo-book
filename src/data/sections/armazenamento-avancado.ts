import type { Chapter } from "../types";

export const chapters: Chapter[] = [
  {
    slug: "lvm",
    section: "armazenamento-avancado",
    title: "LVM: volumes lógicos no Gentoo",
    difficulty: "intermediario",
    subtitle: "Particionamento flexível com pvcreate, vgcreate e lvcreate, e por que ele evita dores de cabeça.",
    intro: `Quando você particiona um disco do jeito tradicional (com 'fdisk' ou 'parted'), o tamanho de cada partição fica gravado em pedra. Aumentar a partição '/var' depois que ela encheu é uma operação arriscada que envolve mover dados, e em geral só dá certo se você desligar o sistema. O LVM (Logical Volume Manager) resolve isso colocando uma camada de abstração entre os discos físicos e as 'partições' que o sistema enxerga.

A ideia é simples: você pega um ou mais discos/partições brutos e marca como 'PV' (Physical Volume). Junta vários PVs em um 'VG' (Volume Group) — pense num 'pool' de espaço. Em cima do VG, você cria 'LVs' (Logical Volumes), que são as partições lógicas que o sistema vê e formata. A grande vantagem é que LVs podem ser redimensionadas online, movidas de um disco para outro sem desmontar, e até replicadas via snapshots.

No Gentoo, ativar LVM é uma questão de habilitar a USE flag 'lvm' no kernel e instalar 'sys-fs/lvm2'. Se '/' estiver em LVM, você ainda precisa de um initramfs (via dracut ou genkernel) que ative os volumes antes de fazer pivot_root. Este capítulo te leva do zero ao primeiro VG funcional, e mostra como redimensionar sem perder o sono.`,
    codes: [
      { lang: "bash", code: `# Instalar o LVM. A USE 'lvm' habilita scripts de init e suporte do udev.
echo 'sys-fs/lvm2 lvm' >> /etc/portage/package.use/lvm
sudo emerge --ask sys-fs/lvm2

# Ativar o serviço (OpenRC):
sudo rc-update add lvm boot
sudo rc-service lvm start

# No systemd, lvm2-monitor.service é ativado automaticamente.` },
      { lang: "bash", code: `# Criar um Physical Volume (PV) em /dev/sdb.
# Aviso: isto APAGA qualquer assinatura existente no disco.
sudo pvcreate /dev/sdb

# Conferir:
sudo pvs
# saída:
#   PV         VG     Fmt  Attr PSize    PFree
#   /dev/sdb          lvm2 ---  500.00g 500.00g` },
      { lang: "bash", code: `# Criar um Volume Group (VG) chamado 'vg0' usando o PV recém-criado.
sudo vgcreate vg0 /dev/sdb

# Adicionar mais um disco ao mesmo VG depois (expansão a quente):
sudo pvcreate /dev/sdc
sudo vgextend vg0 /dev/sdc

sudo vgs
#   VG   #PV #LV #SN Attr   VSize    VFree
#   vg0    2   0   0 wz--n-   1.00t   1.00t` },
      { lang: "bash", code: `# Criar Logical Volumes (LVs) dentro do VG.
sudo lvcreate -L 30G  -n root vg0    # 30 GB para /
sudo lvcreate -L 8G   -n swap vg0    # 8 GB para swap
sudo lvcreate -l 100%FREE -n home vg0 # resto vai para /home

# Os dispositivos aparecem em /dev/vg0/root, /dev/vg0/swap, /dev/vg0/home
# (ou no caminho canônico /dev/mapper/vg0-root).
sudo lvs` },
      { lang: "bash", code: `# Formatar e montar normalmente.
sudo mkfs.ext4 /dev/vg0/root
sudo mkfs.ext4 /dev/vg0/home
sudo mkswap    /dev/vg0/swap

# Redimensionar online (sem desmontar) o LV de /home: +50 GB e crescer FS.
sudo lvextend -L +50G /dev/vg0/home
sudo resize2fs /dev/vg0/home   # ext4 cresce online; XFS usa xfs_growfs.` },
      { lang: "bash", code: `# Reduzir é mais perigoso e SÓ funciona com FS que suporta shrink (ext4 sim, xfs NÃO).
sudo umount /home
sudo e2fsck -f /dev/vg0/home
sudo resize2fs /dev/vg0/home 100G   # primeiro encolhe o FS
sudo lvreduce -L 100G /dev/vg0/home # depois encolhe o LV` },
    ],
    points: [
      "PV (disco bruto) -> VG (pool) -> LV (partição lógica): memorize esta hierarquia.",
      "Você pode juntar discos diferentes no mesmo VG e o LV cresce além de um disco só.",
      "lvextend + resize2fs/xfs_growfs cresce sem desmontar (ext4 e XFS).",
      "Para reduzir, sempre encolha o filesystem ANTES de encolher o LV.",
      "Use '/dev/mapper/vg-lv' no fstab; é o caminho mais estável.",
      "Para '/' em LVM você PRECISA de initramfs com suporte LVM (dracut --add lvm).",
      "Armadilha comum: esquecer de habilitar 'lvm' no rc-update e perder o boot.",
      "Iniciante comum: rodar pvcreate em disco com dados sem backup, perdendo tudo.",
    ],
    alerts: [
      { type: "danger", content: "pvcreate destrói qualquer tabela de partição ou filesystem no dispositivo. Confira três vezes o nome do disco com 'lsblk' antes." },
      { type: "tip", content: "Não use 100% do VG de cara. Deixe ~5% livre para criar snapshots e mover LVs entre discos com 'pvmove' sem precisar de espaço externo." },
      { type: "info", content: "XFS pode crescer online mas não pode encolher: se você suspeita que vai precisar reduzir partição no futuro, prefira ext4 dentro do LV." },
      { type: "warning", content: "Se o '/' estiver em LVM e você esquecer 'dracut --add lvm' ou genkernel --lvm, o sistema cai em emergency shell no próximo boot." },
    ],
  },
  {
    slug: "luks",
    section: "armazenamento-avancado",
    title: "LUKS: criptografia de disco em produção",
    difficulty: "intermediario",
    subtitle: "Cifre partições inteiras com cryptsetup, /etc/crypttab e initramfs gerado pelo dracut.",
    intro: `Notebook roubado, HD jogado fora sem wipe, servidor desativado mal devolvido para o fornecedor: em qualquer um desses cenários, sem criptografia, todo o conteúdo do disco está acessível para quem chegar primeiro. O LUKS (Linux Unified Key Setup) é a solução padrão no Linux para cifrar partições inteiras de forma transparente, com chave gerada por senha e armazenada com segurança em um header no início da partição.

O fluxo é direto: você usa 'cryptsetup luksFormat' para criar o container LUKS, 'cryptsetup luksOpen' para abrir e expor um dispositivo desbloqueado em '/dev/mapper/<nome>', e então formata esse dispositivo como qualquer FS comum. No boot, o initramfs pede a senha, abre o LUKS, e o sistema continua normalmente. Tudo isso roda sobre AES por padrão, com aceleração via instruções AES-NI da CPU (perda de performance em SSDs modernos é desprezível).

No Gentoo você precisa de 'sys-fs/cryptsetup', um initramfs com suporte LUKS (dracut com '--add crypt' é o caminho mais simples), e entradas em '/etc/crypttab' para os volumes não-raiz. Para a partição raiz, o parâmetro 'rd.luks.uuid=' vai na linha de kernel do GRUB. Faremos tudo passo a passo, e ainda mostraremos como ter um keyfile em '/boot' para evitar pedir senha de cada partição secundária.`,
    codes: [
      { lang: "bash", code: `# Instalar cryptsetup e dracut.
sudo emerge --ask sys-fs/cryptsetup sys-kernel/dracut

# Confirme no kernel: Device Drivers -> Multiple devices driver support
# -> Crypt target support (DM_CRYPT=y), e Cryptographic API -> AES, XTS, SHA256.` },
      { lang: "bash", code: `# Cifrar /dev/sdb1 com LUKS2 (default em cryptsetup recente).
# Pede confirmação em letras MAIÚSCULAS e a senha duas vezes.
sudo cryptsetup luksFormat --type luks2 /dev/sdb1

# Abrir (mapa para /dev/mapper/dados):
sudo cryptsetup luksOpen /dev/sdb1 dados

# Agora formate o dispositivo aberto como se fosse uma partição normal:
sudo mkfs.ext4 /dev/mapper/dados
sudo mount /dev/mapper/dados /mnt/dados` },
      { lang: "bash", code: `# Conferir o header LUKS (chaves usadas, hash, slots de keys).
sudo cryptsetup luksDump /dev/sdb1
# Saída inclui:
# Version: 2
# Cipher:  aes-xts-plain64
# Key slots: 0..7 (até 8 senhas/keyfiles diferentes)` },
      { lang: "conf", code: `# /etc/crypttab — abre volumes não-raiz no boot.
# nome           dispositivo                                      key-file              opções
dados            UUID=8b1c4f...                                   none                  luks,discard
backup           /dev/disk/by-uuid/4f...                          /root/backup.key      luks` },
      { lang: "bash", code: `# Adicionar uma SEGUNDA senha (slot extra) — ótimo para rotação.
sudo cryptsetup luksAddKey /dev/sdb1
# Pede a senha atual, depois a nova.

# Remover slot (cuidado: se for o último, você perde o disco):
sudo cryptsetup luksRemoveKey /dev/sdb1` },
      { lang: "bash", code: `# Para a raiz cifrada: gerar initramfs com suporte crypt e LVM.
sudo dracut --force --add "crypt lvm" --kver \\$(uname -r)

# E acrescentar à linha de kernel no GRUB:
# /etc/default/grub
# GRUB_CMDLINE_LINUX="rd.luks.uuid=luks-<UUID-DA-PARTICAO> root=/dev/mapper/vg0-root"
sudo grub-mkconfig -o /boot/grub/grub.cfg` },
    ],
    points: [
      "LUKS protege contra acesso físico ao disco; não substitui senha de usuário ou firewall.",
      "Use luks2 (default atual) — tem header maior, suporta argon2id e melhor recuperação.",
      "Cada partição tem 8 slots de chave: rotacione senhas sem reformatar.",
      "Para '/' cifrado, o initramfs PRECISA ter suporte crypt (dracut --add crypt).",
      "Faça backup do header com 'cryptsetup luksHeaderBackup' — se ele corromper, perde tudo.",
      "Use 'discard' apenas se o trade-off de privacidade vale o TRIM em SSD.",
      "Armadilha comum: esquecer rd.luks.uuid no GRUB e ficar preso na emergency shell.",
      "Iniciante comum: usar a mesma senha do usuário no LUKS — facilita ataques de força bruta.",
    ],
    alerts: [
      { type: "danger", content: "Perdeu a senha do LUKS sem backup do header e sem keyslot extra? Os dados se foram. Não existe master key recuperável; é matemática, não burocracia." },
      { type: "warning", content: "A opção 'discard' (TRIM) em LUKS revela quais blocos estão alocados. Em ambiente sensível (jornalistas, ativistas), prefira não usar." },
      { type: "tip", content: "Crie um keyfile aleatório em /root, dê permissão 600, e adicione como segunda chave para abrir partições secundárias automaticamente sem pedir senha." },
      { type: "info", content: "AES-NI nas CPUs Intel/AMD modernas faz LUKS rodar com overhead < 5% em SSD NVMe. Não é desculpa para deixar de cifrar." },
    ],
  },
  {
    slug: "btrfs",
    section: "armazenamento-avancado",
    title: "Btrfs: subvolumes, snapshots e RAID nativo",
    difficulty: "intermediario",
    subtitle: "Como tirar proveito de copy-on-write, subvolumes, snapshots, balance e scrub no Gentoo.",
    intro: `Btrfs é um filesystem moderno do Linux que combina, num único subsistema, o que antes precisava de LVM + ext4 + mdadm + ferramentas externas: snapshots, redimensionamento online, RAID 0/1/10, compressão transparente, scrub para detectar e corrigir bit-rot, e os famosos subvolumes — que se comportam como pastas mas podem ser montadas separadamente, com opções diferentes, e snapshotadas em segundos.

A sigla 'CoW' (Copy-on-Write) é o coração do Btrfs. Quando você modifica um arquivo, o filesystem grava o novo conteúdo em outro lugar e só atualiza os ponteiros — o bloco antigo continua intocado até nada mais o referenciar. Isso permite snapshots quase instantâneos (eles só duplicam os ponteiros) e dá robustez contra crashes. O preço é fragmentação maior em arquivos que são reescritos in-place (bancos de dados, VMs); para esses, existe a opção 'nodatacow'.

No Gentoo o Btrfs é suportado pelo kernel padrão (CONFIG_BTRFS_FS=y) e ferramentas vêm em 'sys-fs/btrfs-progs'. RAID 5/6 do Btrfs ainda tem warnings em produção (busque o status atual antes de usar para dados importantes), mas RAID 0/1/10 é estável há anos e usado em servidores reais. Vamos cobrir os comandos do dia a dia: criar, snapshot, scrub, balance, e a famosa estratégia '@ + @home'.`,
    codes: [
      { lang: "bash", code: `# Instalar utilitários e criar um filesystem Btrfs em /dev/sdb1.
sudo emerge --ask sys-fs/btrfs-progs
sudo mkfs.btrfs -L gentoo /dev/sdb1

# Montar e criar a estrutura de subvolumes mais comum em Gentoo.
sudo mount /dev/sdb1 /mnt/gentoo
sudo btrfs subvolume create /mnt/gentoo/@
sudo btrfs subvolume create /mnt/gentoo/@home
sudo btrfs subvolume create /mnt/gentoo/@snapshots
sudo umount /mnt/gentoo` },
      { lang: "bash", code: `# Montar os subvolumes em pastas separadas, com compressão zstd.
sudo mount -o subvol=@,compress=zstd:3,noatime /dev/sdb1 /mnt/gentoo
sudo mkdir /mnt/gentoo/home /mnt/gentoo/.snapshots
sudo mount -o subvol=@home,compress=zstd:3,noatime /dev/sdb1 /mnt/gentoo/home
sudo mount -o subvol=@snapshots,noatime /dev/sdb1 /mnt/gentoo/.snapshots` },
      { lang: "conf", code: `# /etc/fstab para o esquema acima.
UUID=<uuid-do-sdb1>  /            btrfs  subvol=@,compress=zstd:3,noatime,space_cache=v2  0 0
UUID=<uuid-do-sdb1>  /home        btrfs  subvol=@home,compress=zstd:3,noatime             0 0
UUID=<uuid-do-sdb1>  /.snapshots  btrfs  subvol=@snapshots,noatime                        0 0` },
      { lang: "bash", code: `# Snapshot read-only do subvolume raiz (rapidíssimo, segundos).
sudo btrfs subvolume snapshot -r /mnt/gentoo /mnt/gentoo/.snapshots/pre-update-2024-09-15

# Listar snapshots existentes:
sudo btrfs subvolume list /mnt/gentoo

# Apagar quando não precisar mais:
sudo btrfs subvolume delete /mnt/gentoo/.snapshots/pre-update-2024-09-15` },
      { lang: "bash", code: `# RAID 1 com dois discos (mirror): cada bloco vive em ambos.
sudo mkfs.btrfs -L pool -d raid1 -m raid1 /dev/sdb /dev/sdc

# Adicionar um terceiro disco depois e rebalancear:
sudo btrfs device add /dev/sdd /mnt/pool
sudo btrfs balance start -dconvert=raid1 -mconvert=raid1 /mnt/pool` },
      { lang: "bash", code: `# Scrub verifica TODOS os blocos contra o checksum e corrige se houver paridade.
sudo btrfs scrub start /mnt/gentoo
sudo btrfs scrub status /mnt/gentoo

# Para arquivos que mudam muito (DBs, VMs), desligue CoW por arquivo:
sudo chattr +C /var/lib/mysql
# (precisa estar vazia/recém-criada para o atributo valer).` },
      { lang: "bash", code: `# Defragmentar online (recomendado periodicamente em workloads CoW pesados):
sudo btrfs filesystem defragment -r -czstd /home

# Ver uso real (df engana com Btrfs, sempre use 'btrfs filesystem'):
sudo btrfs filesystem usage /` },
    ],
    points: [
      "Subvolumes são como pastas que se comportam como filesystems independentes.",
      "Padrão '@' para raiz, '@home' para home, '@snapshots' para snapshots — convenção da comunidade.",
      "Snapshots são instantâneos e baratíssimos; feitos antes de cada upgrade poupam o futuro você.",
      "Use compressão zstd:3 — economiza 20-40% de espaço com overhead irrisório.",
      "RAID 0/1/10 estável; RAID 5/6 ainda tem casos conhecidos de write hole.",
      "Rode 'btrfs scrub' mensalmente em pools importantes — detecta bit-rot.",
      "Armadilha comum: confiar no 'df' (informa errado em Btrfs); use 'btrfs filesystem usage'.",
      "Iniciante comum: deixar VMs e bancos de dados com CoW ligado, fragmentando demais.",
    ],
    alerts: [
      { type: "warning", content: "RAID 5/6 do Btrfs ainda tem o problema do 'write hole' parcialmente resolvido. Para dados que você não quer perder, prefira RAID 1/10 ou ZFS." },
      { type: "tip", content: "Crie snapshot ANTES de 'emerge -auDN @world'. Se a atualização derrubar o sistema, você reverte em segundos com 'btrfs subvolume set-default'." },
      { type: "info", content: "compress=zstd ou compress-force=zstd? O segundo ignora a heurística de 'já é comprimido' e força tudo. Use 'force' apenas se sabe o que está fazendo." },
      { type: "danger", content: "btrfs balance pesado num filesystem cheio (>95%) pode falhar e travar I/O. Mantenha sempre 10-15% livres em pools Btrfs." },
    ],
  },
  {
    slug: "zfs",
    section: "armazenamento-avancado",
    title: "ZFS no Gentoo: zpool, datasets, snapshots e send/receive",
    difficulty: "avancado",
    subtitle: "O filesystem corporativo que combina volume manager, RAID e checksum forte numa coisa só.",
    intro: `ZFS nasceu na Sun Microsystems no início dos anos 2000 e foi pensado desde o primeiro dia para escalar a petabytes mantendo integridade de dados. Cada bloco tem checksum de 256 bits, escrita atômica via copy-on-write, RAID-Z (similar a RAID 5/6 mas sem write hole), snapshots gratuitos, replicação assíncrona via 'send/receive' e quotas por dataset. É o sistema que muito provedor sério (TrueNAS, Proxmox, FreeBSD) usa por padrão.

No Gentoo o ZFS chega via 'sys-fs/zfs', que compila o módulo do kernel via OpenZFS. A licença é CDDL (incompatível com GPL para distribuição em binário, mas você compila em casa, então não há problema legal para uso pessoal). É preciso 'sys-fs/zfs-kmod' para o módulo, ferramentas em 'sys-fs/zfs', e habilitar 'zfs-import' e 'zfs-mount' no rc-update (OpenRC) ou systemd. Para usar como '/', um initramfs gerado por 'dracut --add zfs' é obrigatório.

O vocabulário muda: você não cria 'partições', você cria 'pools' ('zpool') a partir de discos, e dentro deles 'datasets' (que se comportam como pastas mas têm propriedades próprias: compressão, quota, mountpoint). Vamos do 'zpool create' inicial até snapshots periódicos com 'zfs-auto-snapshot' e replicação para outro host com send/receive.`,
    codes: [
      { lang: "bash", code: `# Aceitar a licença CDDL e instalar.
echo 'sys-fs/zfs-kmod ~amd64' >> /etc/portage/package.accept_keywords/zfs
echo 'sys-kernel/spl ~amd64' >> /etc/portage/package.accept_keywords/zfs
sudo emerge --ask sys-fs/zfs sys-fs/zfs-kmod

# Carregar o módulo e habilitar serviços (OpenRC):
sudo modprobe zfs
sudo rc-update add zfs-import boot
sudo rc-update add zfs-mount boot
sudo rc-update add zfs-share default
sudo rc-update add zfs-zed default` },
      { lang: "bash", code: `# Criar um pool 'tank' espelhado (RAID 1) com dois discos.
# IMPORTANTE: SEMPRE use /dev/disk/by-id/... — nunca /dev/sdX (mudam de letra).
sudo zpool create -o ashift=12 -O compression=zstd -O atime=off \\\\
  tank mirror /dev/disk/by-id/ata-WDC_WD40-1 /dev/disk/by-id/ata-WDC_WD40-2

sudo zpool status tank
# pool: tank
#  state: ONLINE
#  config: NAME, STATE, READ, WRITE, CKSUM` },
      { lang: "bash", code: `# RAID-Z (similar ao RAID 5, suporta perda de 1 disco).
sudo zpool create -o ashift=12 tank raidz \\\\
  /dev/disk/by-id/ata-disk1 /dev/disk/by-id/ata-disk2 /dev/disk/by-id/ata-disk3

# RAID-Z2 (suporta perda de 2 discos, recomendado para 6+ drives):
sudo zpool create -o ashift=12 tank raidz2 disk1 disk2 disk3 disk4 disk5 disk6` },
      { lang: "bash", code: `# Criar datasets (pastas com propriedades próprias).
sudo zfs create tank/home
sudo zfs create tank/home/joao
sudo zfs create -o compression=lz4 -o quota=50G tank/home/joao/projetos
sudo zfs create -o recordsize=1M -o compression=zstd tank/midia

# Listar datasets e propriedades:
zfs list -t all
zfs get compression,quota,used,available tank/home/joao/projetos` },
      { lang: "bash", code: `# Snapshots: instantâneos, espaço só ocupa o que mudar depois.
sudo zfs snapshot tank/home/joao@antes-update
sudo zfs list -t snapshot

# Reverter para o snapshot:
sudo zfs rollback tank/home/joao@antes-update

# Clone: snapshot escrevível (parecido com 'git checkout -b').
sudo zfs clone tank/home/joao@antes-update tank/home/joao-teste` },
      { lang: "bash", code: `# Send/receive: replicar para outro host pela rede.
sudo zfs snapshot tank/home@daily-2024-09-15
sudo zfs send tank/home@daily-2024-09-15 | ssh backup@nas zfs receive backup/home

# Incremental (só o delta entre dois snapshots):
sudo zfs send -i @daily-2024-09-14 tank/home@daily-2024-09-15 | \\\\
  ssh backup@nas zfs receive backup/home` },
      { lang: "bash", code: `# Scrub: verifica TODOS os blocos contra checksum e corrige usando paridade.
sudo zpool scrub tank
sudo zpool status tank   # mostra progresso

# Substituir um disco que falhou (após zpool status mostrar DEGRADED):
sudo zpool replace tank /dev/disk/by-id/disco-velho /dev/disk/by-id/disco-novo` },
    ],
    points: [
      "ZFS combina LVM + RAID + FS + snapshots num único subsistema integrado.",
      "Sempre use /dev/disk/by-id/ — nomes /dev/sdX podem mudar e quebrar o pool.",
      "ashift=12 (4K) é o default seguro para discos modernos (HDD e SSD).",
      "compression=zstd ou lz4 é praticamente grátis — sempre ligue.",
      "Faça scrub mensal em pools de produção para detectar bit-rot precoce.",
      "RAID-Z2 a partir de 6 discos; RAID-Z só para arrays pequenos (3-5 discos).",
      "Armadilha comum: criar pool com /dev/sdb e perder após reboot que renomeou os discos.",
      "Iniciante comum: encher o pool acima de 80% — o ZFS degrada de performance brutalmente.",
    ],
    alerts: [
      { type: "danger", content: "ZFS é incompatível com a licença GPL do kernel. NÃO distribua sistemas com módulo ZFS pré-compilado. Para uso próprio (compilando em casa) é OK." },
      { type: "tip", content: "Instale 'sys-fs/zfs-auto-snapshot' para snapshots automáticos a cada 15 min, hora, dia, semana e mês — com prune automático." },
      { type: "warning", content: "Reduzir um pool ZFS depois de criado é praticamente impossível. Planeje o tamanho com folga ou prepare-se para 'zfs send' tudo para outro pool." },
      { type: "info", content: "ZFS adora RAM: regra histórica é 1 GB por TB de pool, com ECC se for produção. Sem RAM suficiente, o ARC cache fica pequeno e a performance cai." },
    ],
  },
  {
    slug: "raid-mdadm",
    section: "armazenamento-avancado",
    title: "RAID por software com mdadm",
    difficulty: "intermediario",
    subtitle: "Espelhamento e paridade do jeito clássico do Linux: RAID 0, 1, 5, 6 e 10 com mdadm.",
    intro: `Antes de Btrfs e ZFS popularizarem RAID nativo no filesystem, o Linux já tinha uma camada robusta e independente do FS chamada 'md' (multiple devices), gerenciada pelo utilitário 'mdadm'. Ela cria um dispositivo virtual ('/dev/md0') a partir de várias partições/discos, com o nível de RAID que você quiser — 0 (stripe, sem redundância), 1 (mirror), 5 (paridade simples), 6 (paridade dupla) ou 10 (mirror + stripe).

A grande vantagem do mdadm é ser agnóstico ao FS: você cria o '/dev/md0', formata com ext4, XFS, ou monta como PV de LVM em cima. Funciona em qualquer Linux (RHEL, Debian, Gentoo) com a mesma sintaxe e gera um '/etc/mdadm.conf' simples de versionar. Em servidores onde o FS de escolha é XFS (que não tem RAID nativo) ou onde você quer combinar RAID com LUKS+LVM em camadas, mdadm é ainda a escolha mais sólida.

No Gentoo, instale 'sys-fs/mdadm', habilite o serviço 'mdadm' (ou systemd unit equivalente) e tenha cuidado com '--create' em discos com dados. Vamos cobrir criação, monitoramento via 'mdadm --monitor', troca de disco quente e a gambiarra essencial: o 'write-intent bitmap' que acelera resync após queda de energia.`,
    codes: [
      { lang: "bash", code: `# Instalar mdadm.
sudo emerge --ask sys-fs/mdadm

# Habilitar daemon de monitoramento (envia email se um disco falhar).
sudo rc-update add mdadm default
sudo rc-update add mdraid boot` },
      { lang: "bash", code: `# Criar RAID 1 (mirror) com 2 discos.
sudo mdadm --create /dev/md0 \\\\
  --level=1 --raid-devices=2 \\\\
  /dev/sdb1 /dev/sdc1

# Acompanhar o resync inicial:
cat /proc/mdstat
# Personalities : [raid1]
# md0 : active raid1 sdc1[1] sdb1[0]
#       4194240 blocks super 1.2 [2/2] [UU]
#       [====>................] resync = 21.5% (905600/4194240)` },
      { lang: "bash", code: `# RAID 5 com 3 discos (paridade simples, suporta perda de 1).
sudo mdadm --create /dev/md1 \\\\
  --level=5 --raid-devices=3 \\\\
  /dev/sdd1 /dev/sde1 /dev/sdf1

# RAID 6 (paridade dupla, recomendado a partir de 5 discos):
sudo mdadm --create /dev/md2 \\\\
  --level=6 --raid-devices=5 \\\\
  /dev/sdg1 /dev/sdh1 /dev/sdi1 /dev/sdj1 /dev/sdk1` },
      { lang: "bash", code: `# Salvar configuração para sobreviver a reboots.
sudo mdadm --detail --scan >> /etc/mdadm.conf

# /etc/mdadm.conf típico:
# ARRAY /dev/md0 metadata=1.2 name=gentoo:0 UUID=abc...
# MAILADDR sysadmin@empresa.com.br

# Atualizar o initramfs para reconhecer o array no boot:
sudo dracut --force --add mdraid` },
      { lang: "bash", code: `# Monitorar e simular falha de disco.
sudo mdadm --detail /dev/md0
# State : clean
# Active Devices : 2
# Working Devices : 2

# Marcar como falho (para teste ou para retirada planejada):
sudo mdadm /dev/md0 --fail /dev/sdb1
sudo mdadm /dev/md0 --remove /dev/sdb1

# Adicionar disco novo (ele vai resync):
sudo mdadm /dev/md0 --add /dev/sdb1` },
      { lang: "bash", code: `# Write-intent bitmap acelera resync após crash:
sudo mdadm --grow /dev/md0 --bitmap=internal

# Crescer um RAID 5 adicionando um disco (operação demorada, faça com backup pronto):
sudo mdadm /dev/md1 --add /dev/sdl1
sudo mdadm --grow /dev/md1 --raid-devices=4

# Em cima do md, monte LVM ou formate direto:
sudo mkfs.ext4 -L raid5 /dev/md1` },
    ],
    points: [
      "RAID 1 protege contra falha de 1 disco; RAID 5 idem mas com mais espaço útil.",
      "RAID 6 (paridade dupla) é o mínimo recomendado para arrays >= 5 discos.",
      "Sempre habilite write-intent bitmap — resync de horas vira minutos após queda.",
      "Salve sempre /etc/mdadm.conf com 'mdadm --detail --scan' antes de reiniciar.",
      "Para boot em RAID, dracut precisa de '--add mdraid' no initramfs.",
      "RAID NÃO é backup: ele protege contra falha de hardware, não contra rm -rf.",
      "Armadilha comum: usar /dev/sdX no mdadm.conf — prefira UUID gerado no scan.",
      "Iniciante comum: confundir RAID 0 (stripe) com proteção — RAID 0 perde tudo se um falhar.",
    ],
    alerts: [
      { type: "danger", content: "RAID 0 dobra a chance de perder dados. Use só para cache temporário ou scratch que pode ser refeito do zero." },
      { type: "tip", content: "Configure 'MAILADDR seu@email' em /etc/mdadm.conf e instale 'mail-mta/ssmtp'. Você recebe alerta no minuto que um disco falhar." },
      { type: "warning", content: "Resync de RAID 5/6 em discos grandes (8TB+) pode levar dias. Durante esse tempo o array está vulnerável a um segundo disco falhar." },
      { type: "info", content: "Em sistemas modernos, prefira ZFS ou Btrfs para novos projetos. mdadm continua sólido para legado e quando o FS deve ser XFS/ext4 puro." },
    ],
  },
  {
    slug: "snapshots",
    section: "armazenamento-avancado",
    title: "Snapshots: voltar no tempo sem cópia completa",
    difficulty: "intermediario",
    subtitle: "LVM thin, Btrfs e snapshots integrados ao bootloader para reverter atualizações ruins.",
    intro: `Snapshot é uma fotografia instantânea do estado de um filesystem (ou volume), com custo de espaço só pelas mudanças posteriores ao snap. Em vez de copiar 200 GB para fazer backup antes de uma atualização arriscada, você gasta milissegundos e zero MB para criar a 'foto' — depois reverte se algo der errado. É a rede de segurança que separa o sysadmin que dorme tranquilo do que mantém PowerPoint de procedimentos de rollback.

Diferentes tecnologias implementam snapshots de jeitos diferentes. Btrfs e ZFS têm snapshots nativos, baratíssimos, integrados ao próprio FS. LVM tem snapshots tradicionais (CoW em volume separado) e thin snapshots (mais eficientes, similar aos do FS modernos). E ferramentas como 'snapper' e 'grub-btrfs' integram tudo isso ao bootloader, fazendo cada snapshot virar uma entrada no menu do GRUB — basta selecionar e bootar do estado anterior.

Este capítulo cobre os três sabores principais: snapshot de Btrfs (já vimos no capítulo de Btrfs), thin snapshot de LVM e a estratégia de snapshots automáticos antes de cada 'emerge -auDN @world'. Também mostraremos como usar 'grub-btrfs' (em 'sys-boot/grub-btrfs') para virar entradas de boot reversíveis. Quando uma atualização do kernel ou do GCC quebrar tudo, em vez de chrootar de uma live ISO você simplesmente reinicia e escolhe o snap pré-update.`,
    codes: [
      { lang: "bash", code: `# Snapshot Btrfs do subvolume raiz (revisão).
sudo btrfs subvolume snapshot -r / /.snapshots/pre-update-2024-09-15

# Listar snapshots:
sudo btrfs subvolume list -t /

# Reverter (definir o snapshot como subvolume default e reiniciar):
sudo btrfs subvolume set-default <ID> /
sudo reboot` },
      { lang: "bash", code: `# LVM thin snapshot — exige thin pool (mais eficiente que o snapshot legado).
# Criar thin pool com 100G:
sudo lvcreate --thinpool tpool -L 100G vg0
sudo lvcreate -V 50G --thin -n root vg0/tpool
sudo mkfs.ext4 /dev/vg0/root

# Snapshot do volume thin:
sudo lvcreate -s -n root_pre_update vg0/root` },
      { lang: "bash", code: `# Reverter snapshot LVM (merge):
sudo lvconvert --merge vg0/root_pre_update
# Aviso: o merge só completa no próximo boot/desmontagem.
sudo reboot` },
      { lang: "bash", code: `# Hook para snapshot automático antes de emerge.
# Salve em /etc/portage/bashrc ou em /etc/portage/env/snapshot:
# Ou um wrapper script em /usr/local/bin/safe-emerge:
sudo tee /usr/local/bin/safe-emerge <<'EOF'
#!/bin/bash
DATE=\\$(date +%Y%m%d-%H%M%S)
btrfs subvolume snapshot -r / "/.snapshots/pre-emerge-\${DATE}" || exit 1
emerge "\\$@"
EOF
sudo chmod +x /usr/local/bin/safe-emerge
sudo safe-emerge -auDN @world` },
      { lang: "bash", code: `# grub-btrfs: cada snapshot vira entrada no menu do GRUB.
sudo emerge --ask sys-boot/grub-btrfs

# Reconfigurar GRUB depois de criar/apagar snapshot:
sudo grub-mkconfig -o /boot/grub/grub.cfg

# (No próximo boot, submenu 'Gentoo snapshots' aparece com cada snap listado.)` },
      { lang: "bash", code: `# Snapper para automação completa (Btrfs ou LVM thin).
sudo emerge --ask app-admin/snapper
sudo snapper -c root create-config /
sudo snapper -c root list

# Cron / systemd timer já vem configurado para snapshots horários/diários
# com prune automático (mantém últimos N).
sudo snapper -c root create --description "antes do upgrade do plasma"` },
    ],
    points: [
      "Snapshots são instantâneos e baratos — use sem moderação antes de mudanças arriscadas.",
      "Btrfs e ZFS têm snapshots nativos; LVM precisa de thin pool para performance similar.",
      "snapshot != backup: se o disco morre, vai junto. Combine com backup remoto.",
      "grub-btrfs permite bootar de snapshot pelo menu do GRUB, sem live ISO.",
      "Snapper automatiza criação e prune; integre com pacman/apt/portage hooks.",
      "Snapshots ocupam espaço progressivamente — defina retenção (ex: 7 diários, 4 semanais).",
      "Armadilha comum: snapshot LVM legado pequeno enche e o snapshot fica inválido.",
      "Iniciante comum: achar que snapshot protege contra disco morto — não protege.",
    ],
    alerts: [
      { type: "tip", content: "Crie um wrapper 'safe-emerge' que faz snapshot Btrfs antes de cada emerge. Em meses de uso você vai usar essa rede de segurança pelo menos uma vez." },
      { type: "warning", content: "Snapshot LVM legado (não-thin) precisa de espaço alocado de antemão. Se exceder, o snapshot fica corrupto silenciosamente." },
      { type: "info", content: "Snapshots em ZFS não consomem espaço até você modificar dados. Pode manter centenas sem custo, ótimo para 'zfs send' incrementais." },
      { type: "danger", content: "NUNCA delete um snapshot ativo enquanto está bootado dele. Use 'btrfs subvolume set-default' para voltar para o subvolume permanente antes." },
    ],
  },
  {
    slug: "backup-borg",
    section: "armazenamento-avancado",
    title: "BorgBackup: deduplicação e cifragem para backup sério",
    difficulty: "intermediario",
    subtitle: "Como criar repositórios cifrados, agendar backups incrementais e restaurar pontualmente.",
    intro: `Backup que não é testado não é backup. Repita isso até virar mantra. E o melhor backup é aquele que você consegue rodar diariamente sem ocupar 1 TB extra por dia. O BorgBackup ('borg') resolve isso elegantemente: ele divide os arquivos em chunks, calcula hash de cada um, e só armazena chunks novos. Se 99% dos seus arquivos não mudaram, o backup de hoje ocupa quase nada — mesmo aparecendo na lista como um snap completo.

Borg também cifra todo o repositório (AES-256-CTR + HMAC-SHA256 ou Blake2), então você pode mandar para qualquer servidor (NAS de casa, S3 via 'rclone', sshfs) sem se preocupar com privacidade. Cada backup é nomeado ('archive') e listado individualmente como se fosse uma cópia completa, mas internamente compartilha chunks com os outros. Restaurar um arquivo único é tão fácil quanto 'borg extract repo::nome arquivo'.

No Gentoo, instale 'app-backup/borgbackup'. O fluxo padrão é: 'borg init' (uma vez), 'borg create' (toda noite, via cron ou systemd timer), 'borg prune' (apaga snaps antigos seguindo política de retenção), e 'borg check' (verifica integridade). Vamos cobrir tudo isso, incluindo a estratégia 3-2-1 (3 cópias, 2 mídias diferentes, 1 offsite) que separa profissional de amador.`,
    codes: [
      { lang: "bash", code: `# Instalar borg.
sudo emerge --ask app-backup/borgbackup

# Inicializar repositório local cifrado.
borg init --encryption=repokey-blake2 /mnt/backup/repo
# Pede senha duas vezes; guarde-a em gerenciador de senhas (perdeu = sem dados).` },
      { lang: "bash", code: `# Backup do /home, excluindo cache e thumbnails.
borg create --stats --progress \\\\
  --compression zstd,3 \\\\
  --exclude '/home/*/.cache' \\\\
  --exclude '/home/*/.thumbnails' \\\\
  --exclude '/home/*/Downloads' \\\\
  /mnt/backup/repo::home-{now:%Y-%m-%d-%H%M%S} \\\\
  /home /etc /root` },
      { lang: "bash", code: `# Repositório remoto via SSH (com borg instalado no destino).
borg init --encryption=repokey-blake2 borg@nas:/srv/backup/repo

borg create \\\\
  --compression zstd,6 \\\\
  borg@nas:/srv/backup/repo::desktop-{now:%Y-%m-%d} \\\\
  /home /etc /root` },
      { lang: "bash", code: `# Listar archives e ver estatísticas.
borg list /mnt/backup/repo
# desktop-2024-09-15  Sun, 2024-09-15 03:00:01
# desktop-2024-09-14  Sat, 2024-09-14 03:00:02

borg info /mnt/backup/repo
# Original size: 152.34 GB
# Compressed:    72.10 GB
# Deduplicated:  18.42 GB    <-- a mágica acontece aqui` },
      { lang: "bash", code: `# Restaurar um arquivo específico (sem extrair tudo).
cd /tmp/restore
borg extract /mnt/backup/repo::desktop-2024-09-15 home/joao/projetos/tese.odt

# Montar archive como filesystem read-only para navegar:
mkdir /mnt/borg
borg mount /mnt/backup/repo::desktop-2024-09-15 /mnt/borg
ls /mnt/borg/home
# (quando terminar)
borg umount /mnt/borg` },
      { lang: "bash", code: `# Política de retenção: 7 diários, 4 semanais, 6 mensais.
borg prune --list \\\\
  --keep-daily=7 --keep-weekly=4 --keep-monthly=6 \\\\
  /mnt/backup/repo

# Verificar integridade (rode mensalmente):
borg check --verify-data /mnt/backup/repo` },
      { lang: "bash", code: `# Cron diário típico em /etc/cron.daily/borg-backup:
#!/bin/bash
export BORG_PASSPHRASE="senha-do-repo-aqui"
REPO=/mnt/backup/repo

borg create --compression zstd,3 \\\\
  \${REPO}::home-{now:%Y-%m-%d} /home /etc /root || exit 1

borg prune --list \\\\
  --keep-daily=7 --keep-weekly=4 --keep-monthly=6 \\\\
  \${REPO}

borg compact \${REPO}   # libera espaço de chunks órfãos` },
    ],
    points: [
      "Deduplicação faz backup diário ocupar fração do espaço — economia de 80-95% comum.",
      "Cifragem repokey-blake2 é o padrão moderno e rápido em CPUs com SHA-NI.",
      "Faça 'borg check --verify-data' mensalmente — corrupção silenciosa existe.",
      "Política 7/4/6 (dia/semana/mês) é o ponto doce para uso pessoal.",
      "borg mount permite recuperar 1 arquivo sem extrair archive inteiro.",
      "Combine borg local (rápido) + borg remoto (offsite) para estratégia 3-2-1.",
      "Armadilha comum: perder a senha do repokey e descobrir que sem ela = sem dados.",
      "Iniciante comum: agendar backup mas nunca testar restore — descobre falha na hora ruim.",
    ],
    alerts: [
      { type: "danger", content: "Senha de repositório Borg cifrado é insubstituível. Sem ela, todos os backups viram bytes aleatórios. Salve em gerenciador (Bitwarden, KeePass) e em papel offline." },
      { type: "tip", content: "Sempre teste restore. Marque no calendário: a cada 3 meses, escolha um archive aleatório, extraia para /tmp e confira. Backup não testado é teatro." },
      { type: "warning", content: "Não rode dois 'borg create' simultâneos no mesmo repo — o lockfile evita corrupção mas pode travar até timeout." },
      { type: "success", content: "Borg dedupa entre máquinas se você usar o mesmo repo (com chunks compatíveis). Backup de 5 servidores parecidos pode ocupar pouco mais que 1." },
    ],
  },
  {
    slug: "restic",
    section: "armazenamento-avancado",
    title: "Restic: backup com S3, B2 e SFTP nativos",
    difficulty: "intermediario",
    subtitle: "Alternativa moderna ao Borg, escrita em Go, com suporte direto a object storage.",
    intro: `O Borg cobre o caso clássico de backup para disco local ou via SSH. Mas e se você quiser mandar direto para Amazon S3, Backblaze B2, Wasabi, Azure Blob, Google Cloud Storage ou qualquer outro object storage barato? É aí que o 'restic' brilha. Ele é escrito em Go, tem um único binário estático sem dependências, e nativo entende dezenas de backends sem precisar de 'rclone' no meio.

Conceitualmente é parecido com Borg: dedupe por chunks, cifragem AES-256, snapshots nomeados, prune com política. A diferença é que o restic foi pensado desde o início para nuvem, então tudo é otimizado para uploads em paralelo, retomada após falha de rede, e operação eficiente em backends que cobram por requisição (LIST cara, PUT cara). É a escolha natural para quem usa Backblaze B2 (US$ 6/TB/mês) ou Wasabi (sem egress fee) como destino offsite.

No Gentoo, instale 'app-backup/restic'. O fluxo é 'restic init' (uma vez), 'restic backup' (cron diário), 'restic forget --prune' (retenção), 'restic check' (integridade). Cifragem é obrigatória, com senha que vira a chave mestra. Comparado ao Borg: restic é mais simples para nuvem, mas sem deduplicação cross-machine no mesmo repo (cada máquina é mais isolada).`,
    codes: [
      { lang: "bash", code: `# Instalar restic.
sudo emerge --ask app-backup/restic

# Inicializar repositório local cifrado.
restic init --repo /mnt/backup/restic-repo
# Senha pedida; salve em gerenciador.` },
      { lang: "bash", code: `# Backup com restic local.
restic --repo /mnt/backup/restic-repo backup \\\\
  --exclude='/home/*/.cache' \\\\
  --exclude='/home/*/Downloads' \\\\
  /home /etc /root

# Saída:
# open repository
# repository abc12345 opened (version 2)
# scan finished in 4.123s: 124823 files, 152.34 GiB
# Files:        103 new, 124720 changed,    0 unmodified
# Added to the repo: 18.4 GiB
# snapshot 1f2e3d4c saved` },
      { lang: "bash", code: `# Backend Backblaze B2 (offsite barato).
export B2_ACCOUNT_ID="seu-key-id"
export B2_ACCOUNT_KEY="sua-app-key"
export RESTIC_PASSWORD="senha-do-repo"

restic -r b2:bucket-name:/path init
restic -r b2:bucket-name:/path backup /home /etc /root` },
      { lang: "bash", code: `# Backend genérico SFTP.
restic -r sftp:user@servidor:/srv/backup backup /home

# Backend S3-compatível (AWS, Wasabi, MinIO, Ceph):
export AWS_ACCESS_KEY_ID="key"
export AWS_SECRET_ACCESS_KEY="secret"
restic -r s3:s3.amazonaws.com/meu-bucket backup /home` },
      { lang: "bash", code: `# Listar e restaurar snapshots.
restic -r /mnt/backup/restic-repo snapshots
# ID        Time                 Host       Tags    Paths
# 1f2e3d4c  2024-09-15 03:00:01  desktop            /home /etc /root

# Restaurar para diretório:
restic -r /mnt/backup/restic-repo restore 1f2e3d4c --target /tmp/restore

# Restaurar arquivo específico:
restic -r /mnt/backup/restic-repo restore 1f2e3d4c \\\\
  --target /tmp/restore --include /home/joao/tese.odt` },
      { lang: "bash", code: `# Política de retenção (similar ao borg).
restic -r /mnt/backup/restic-repo forget \\\\
  --keep-daily=7 --keep-weekly=4 --keep-monthly=6 \\\\
  --prune

# Verificar integridade (mensal):
restic -r /mnt/backup/restic-repo check --read-data-subset=10%` },
      { lang: "bash", code: `# Montar snapshot para navegar (FUSE).
mkdir /mnt/restic
restic -r /mnt/backup/restic-repo mount /mnt/restic &
ls /mnt/restic/snapshots/latest/home

# Quando terminar:
fusermount -u /mnt/restic` },
    ],
    points: [
      "Restic tem backends nativos para S3, B2, Azure, GCS, SFTP — sem rclone.",
      "Binário Go único, sem dependências — fácil rodar em servidor minimal.",
      "Cifragem AES-256 obrigatória; senha = chave do repo (perdeu, perdeu tudo).",
      "Backups são incrementais e dedupados via chunks de tamanho variável.",
      "'restic check --read-data-subset=10%' verifica amostra mensal sem custo de download total.",
      "Para B2/Wasabi, cuidado com a opção 'pack-size' para reduzir requests cobradas.",
      "Armadilha comum: rodar 'forget' sem --prune e achar que liberou espaço (não liberou).",
      "Iniciante comum: salvar password no script versionado e vazar no git público.",
    ],
    alerts: [
      { type: "tip", content: "Use Backblaze B2 + restic para 'offsite' barato: ~US$6/TB/mês com download grátis até o tamanho do plano. Combine com borg local para dupla camada." },
      { type: "warning", content: "restic NÃO faz dedupe entre repositórios diferentes. Backup de 5 máquinas similares ocupa ~5x o espaço se cada uma tem o seu repo." },
      { type: "info", content: "Borg vs Restic: Borg ganha em dedupe local e velocidade pura; Restic ganha em integração com nuvem e simplicidade de deploy." },
      { type: "danger", content: "Nunca commit RESTIC_PASSWORD em git nem em script público. Use arquivo separado com perm 600 ou variável de ambiente em /etc/conf.d/." },
    ],
  },
  {
    slug: "automount",
    section: "armazenamento-avancado",
    title: "Automount: montar sob demanda com systemd e autofs",
    difficulty: "intermediario",
    subtitle: "Pendrives, shares de rede e sshfs montados quando você acessa, desmontados quando ocioso.",
    intro: `Montar tudo no boot via /etc/fstab funciona bem para discos sempre presentes, mas é um problema para mídias removíveis (pendrive, HD externo) e shares remotos (NFS, SMB, sshfs) que podem estar offline. Se a montagem no fstab falha, o boot trava por minutos esperando timeout. A solução é o 'automount' — monta sob demanda quando alguém acessa o caminho, e desmonta após inatividade.

Existem duas formas principais no Linux: o 'autofs' clássico (daemon que vigia caminhos), usado historicamente em ambientes corporativos NFS, e o 'systemd .automount' moderno, que é parte do próprio init e mais simples de configurar. Em sistemas com OpenRC, autofs é a escolha; com systemd, prefira o automount nativo (menos uma engrenagem para quebrar).

Vamos cobrir os dois caminhos: configurar 'sys-fs/autofs' para um share NFS no OpenRC, e usar 'x-systemd.automount' direto no fstab no systemd. Também faremos um exemplo prático com 'sshfs' que monta um servidor remoto pela primeira vez que você faz 'cd /mnt/servidor' — comum para sysadmin que precisa entrar em várias máquinas pelo dia.`,
    codes: [
      { lang: "bash", code: `# autofs no OpenRC.
sudo emerge --ask sys-fs/autofs

sudo rc-update add autofs default
sudo rc-service autofs start` },
      { lang: "conf", code: `# /etc/autofs/auto.master
# Vigia /mnt/auto e usa o mapa em /etc/autofs/auto.nfs.
/mnt/auto    /etc/autofs/auto.nfs    --timeout=300

# /etc/autofs/auto.nfs
# nome_local    -opcoes    servidor:/share
backup          -fstype=nfs,rw,soft    nas.local:/srv/backup
docs            -fstype=nfs4,rw,soft   nas.local:/srv/docs

# Acesso a /mnt/auto/backup monta automaticamente; ocioso 5 min, desmonta.` },
      { lang: "conf", code: `# systemd: .automount via /etc/fstab.
# Em vez de mount on boot, monta na primeira vez que algo acessa o ponto.
# x-systemd.idle-timeout desmonta após N segundos ocioso.

UUID=abc123  /mnt/usb-backup  ext4  noauto,x-systemd.automount,x-systemd.idle-timeout=300  0 0

# nas.local:/srv/docs  /mnt/docs  nfs4  noauto,x-systemd.automount,x-systemd.idle-timeout=600,_netdev  0 0` },
      { lang: "bash", code: `# Recarregar systemd para aplicar mudanças do fstab.
sudo systemctl daemon-reload
sudo systemctl restart local-fs.target

# Verificar units .automount geradas:
systemctl list-units --type=automount` },
      { lang: "bash", code: `# sshfs sob demanda com autofs.
sudo emerge --ask net-fs/sshfs

# /etc/autofs/auto.master
# /mnt/ssh    /etc/autofs/auto.ssh   --timeout=600

# /etc/autofs/auto.ssh
# servidor1   -fstype=fuse,rw,nodev,nonempty,noatime,allow_other,IdentityFile=/root/.ssh/id_ed25519,reconnect,follow_symlinks   :sshfs\\\\#user@servidor1.example.com\\:/

# Acesso a /mnt/ssh/servidor1 monta o servidor automaticamente.
ls /mnt/ssh/servidor1` },
      { lang: "bash", code: `# Debug: ver montagens ativas e logs.
mount | grep autofs
journalctl -u autofs.service -f

# systemd:
systemctl status mnt-usb\\\\x2dbackup.automount
journalctl -u mnt-usb\\\\x2dbackup.mount -f` },
    ],
    points: [
      "Automount evita que share offline trave o boot por timeout do fstab.",
      "systemd .automount é o caminho moderno; autofs é o clássico para OpenRC.",
      "x-systemd.idle-timeout desmonta após inatividade — ótimo para mídias removíveis.",
      "Para NFS sempre adicione _netdev; para sshfs use 'reconnect' e 'IdentityFile'.",
      "soft no NFS faz comandos retornarem erro em vez de travar para sempre.",
      "Para ver mounts ativos via autofs: 'mount | grep autofs'.",
      "Armadilha comum: esquecer 'noauto' em fstab com x-systemd.automount; monta no boot mesmo.",
      "Iniciante comum: configurar autofs e tentar 'ls /etc/autofs/auto.nfs' diretamente — não tem nada lá até acessar.",
    ],
    alerts: [
      { type: "tip", content: "Para pendrive aleatório, use 'udisks2' (vem com a maioria dos DEs) — gerencia automount sob demanda em /run/media/<user>." },
      { type: "warning", content: "sshfs em rede instável fica frágil. Sempre adicione 'reconnect' nas opções, ou prefira NFS quando o link for confiável." },
      { type: "info", content: "Em systemd, cada entrada x-systemd.automount no fstab vira automaticamente uma unit .automount + .mount. Não precisa criar arquivos manualmente." },
      { type: "danger", content: "Não use automount para '/' nem para '/usr' — boot fica em loop. Esses devem ser montados de verdade no início do boot." },
    ],
  },
  {
    slug: "swapfile",
    section: "armazenamento-avancado",
    title: "Swap em arquivo: prós e contras vs partição",
    difficulty: "iniciante",
    subtitle: "Como criar swapfile, ajustar tamanho online e quando preferir partição dedicada.",
    intro: `Swap é a memória virtual que o kernel usa quando a RAM acaba — páginas pouco usadas vão para o disco para liberar espaço para processos ativos. Tradicionalmente, swap fica numa partição dedicada criada na instalação. Mas há mais de uma década o kernel suporta swap em arquivo regular ('swapfile'), que tem a vantagem prática de ser redimensionável a qualquer hora sem mexer em particionamento.

A diferença de performance entre partição e arquivo era relevante em discos rotacionais antigos (o arquivo podia fragmentar), mas em SSD/NVMe é praticamente nenhuma. Swapfile também resolve o caso de você ter esquecido swap na instalação ou querer dobrar para suportar uma compilação grande de chromium ou rust. Distribuições modernas (Ubuntu, Fedora) já default para swapfile há anos.

Onde swapfile ainda perde: para hibernação, é mais complexo (precisa de offset físico do arquivo na partição, via 'filefrag'); em alguns FS (zfs até pouco tempo, btrfs até kernel 5.0) não era suportado direto. No Gentoo você decide: este capítulo mostra como criar swapfile do zero, ativar, ajustar 'swappiness' e quando preferir a velha partição dedicada.`,
    codes: [
      { lang: "bash", code: `# Criar swapfile de 8 GB com fallocate (rápido, espaço já reservado).
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile          # CRÍTICO: outros usuários não podem ler
sudo mkswap /swapfile
sudo swapon /swapfile

# Verificar:
swapon --show
# NAME      TYPE SIZE USED PRIO
# /swapfile file   8G   0B   -2` },
      { lang: "bash", code: `# Em Btrfs, fallocate não cria swapfile compatível; use:
sudo btrfs subvolume create /swap
sudo chattr +C /swap            # desliga CoW
sudo touch /swap/swapfile
sudo chattr +C /swap/swapfile
sudo dd if=/dev/zero of=/swap/swapfile bs=1M count=8192
sudo chmod 600 /swap/swapfile
sudo mkswap /swap/swapfile
sudo swapon /swap/swapfile` },
      { lang: "conf", code: `# /etc/fstab para tornar permanente.
/swapfile          none    swap    sw      0 0
# Em Btrfs:
/swap/swapfile     none    swap    sw      0 0` },
      { lang: "bash", code: `# Aumentar swap online: desligar, regenerar, religar.
sudo swapoff /swapfile
sudo fallocate -l 16G /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Para REDUZIR, mesmo procedimento (apenas desligue antes).` },
      { lang: "bash", code: `# Ajustar swappiness (0=usar swap só em emergência, 100=usar agressivo).
# Em desktops com 16+ GB, baixar para 10 ajuda responsividade.
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swap.conf

# vfs_cache_pressure (manter cache de inodes) — útil para servidores:
sudo sysctl vm.vfs_cache_pressure=50` },
      { lang: "bash", code: `# Para hibernação com swapfile: descobrir offset físico.
sudo filefrag -v /swapfile | head -5
# Filesystem type is: ef53
# File size of /swapfile is 8589934592 (2097152 blocks of 4096 bytes)
#  ext:     logical_offset:        physical_offset: length:   expected: flags:
#    0:        0..    1023:    34816..     35839:   1024:

# resume_offset = primeiro physical_offset (no exemplo: 34816)
# Adicionar à linha de kernel no GRUB:
# resume=UUID=<uuid-da-particao-do-swapfile> resume_offset=34816` },
    ],
    points: [
      "Swapfile é mais flexível: redimensione sem reparticionar.",
      "chmod 600 OBRIGATÓRIO — senão é furo de segurança grave.",
      "Em Btrfs, swapfile precisa de chattr +C e subvolume sem CoW.",
      "swappiness 60 é default; baixe para 10 em desktop com bastante RAM.",
      "Diferença de performance vs partição é insignificante em SSD/NVMe.",
      "Swap dispensável se você tem MUITA RAM e nunca compila kernel/chromium.",
      "Armadilha comum: fallocate em Btrfs sem chattr +C — kernel reclama no swapon.",
      "Iniciante comum: não criar swap em VM e ver OOM-killer matar serviços.",
    ],
    alerts: [
      { type: "tip", content: "Para builds grandes (firefox, chromium, libreoffice), tenha swap pelo menos = RAM. Linker pode usar 8+ GB e te poupa de OOM no fim de 4h de compilação." },
      { type: "warning", content: "Hibernação com swapfile no kernel < 5.0 é frágil. Prefira partição swap se hibernar é requisito firme." },
      { type: "info", content: "ZRAM (compressão em RAM) reduz necessidade de swap em disco. Veremos no capítulo de otimização — pode coexistir com swapfile." },
      { type: "danger", content: "Swap sem chmod 600 expõe segredos da memória (chaves SSH, senhas em texto plano de processos). Sempre confira permissões." },
    ],
  },
  {
    slug: "tmpfs",
    section: "armazenamento-avancado",
    title: "tmpfs: filesystem em RAM para /tmp e builds",
    difficulty: "intermediario",
    subtitle: "Acelere /tmp e /var/tmp/portage colocando-os em RAM, com cuidado para não OOM.",
    intro: `tmpfs é um filesystem mantido inteiramente em RAM (com fallback para swap se a memória encher). Tudo que você grava ali some no próximo reboot, mas até lá funciona com velocidade de RAM — centenas de vezes mais rápido que SSD. É o destino natural para arquivos efêmeros: '/tmp', '/run', e — em Gentoo — '/var/tmp/portage', onde o Portage compila pacotes.

Compilar Firefox em SSD pode levar 1h30; em tmpfs cai para 50 minutos, com bônus de não desgastar o SSD com bilhões de writes intermediários. Para LibreOffice ou Chromium, o ganho é ainda maior. O custo é RAM dedicada: builds grandes podem precisar de 8-16 GB de tmpfs, então só vale se você tem 16+ GB de RAM total. Em máquinas com 8 GB ou menos, tmpfs em '/var/tmp/portage' costuma quebrar builds grandes por OOM.

A configuração é uma linha no /etc/fstab. Tamanho pode ser fixo ('size=8G'), proporcional à RAM ('size=50%'), ou flexível (sem limite até esgotar RAM+swap). Vamos cobrir os usos clássicos no Gentoo e a armadilha mais comum: esquecer que tmpfs do Portage pode encher e abortar uma compilação que demorou 3 horas.`,
    codes: [
      { lang: "conf", code: `# /etc/fstab — tmpfs comum.
tmpfs   /tmp            tmpfs   defaults,nodev,nosuid,size=4G              0 0
tmpfs   /var/tmp/portage  tmpfs  defaults,nodev,nosuid,size=12G,mode=775,uid=portage,gid=portage  0 0
tmpfs   /run            tmpfs   defaults,nodev,nosuid,size=512M,mode=755   0 0` },
      { lang: "bash", code: `# Aplicar imediatamente sem reboot.
sudo mount -a
df -h /tmp /var/tmp/portage
# Filesystem      Size  Used Avail Use% Mounted on
# tmpfs           4.0G  124K  4.0G   1% /tmp
# tmpfs            12G     0   12G   0% /var/tmp/portage` },
      { lang: "conf", code: `# /etc/portage/make.conf — direcionar Portage para tmpfs.
PORTAGE_TMPDIR="/var/tmp"
# (Portage cria /var/tmp/portage automaticamente; basta o ponto de montagem ser tmpfs.)

# Se /var/tmp/portage NÃO está em tmpfs mas você quer só alguns pacotes em tmpfs:
# Opção: PORTAGE_TMPDIR para /tmp e por pacote (ver abaixo).` },
      { lang: "bash", code: `# Para builds grandes que NÃO cabem em tmpfs (chromium, firefox, libreoffice):
# Sobrescrever PORTAGE_TMPDIR só para esses pacotes via package.env.

# /etc/portage/env/large-build.conf
echo 'PORTAGE_TMPDIR="/var/tmp/largebuild"' | sudo tee /etc/portage/env/large-build.conf

# /etc/portage/package.env
echo 'www-client/firefox  large-build.conf' | sudo tee -a /etc/portage/package.env
echo 'www-client/chromium large-build.conf' | sudo tee -a /etc/portage/package.env

sudo mkdir -p /var/tmp/largebuild
sudo chown portage:portage /var/tmp/largebuild` },
      { lang: "bash", code: `# Verificar uso de tmpfs e swap em tempo real.
free -h
#               total        used        free      shared  buff/cache   available
# Mem:           31Gi        4.2Gi        18Gi       2.1Gi        9.0Gi        24Gi
# Swap:         8.0Gi          0B       8.0Gi

# 'shared' inclui tmpfs em uso. Compare com df.
df -h -t tmpfs` },
      { lang: "bash", code: `# Limpar tmpfs cheia sem reboot (se possível desmontar):
sudo rm -rf /var/tmp/portage/*  # cuidado: estoura compilação em curso
# OU:
sudo umount /var/tmp/portage && sudo mount /var/tmp/portage` },
    ],
    points: [
      "tmpfs vive em RAM (com swap como fallback) — leitura/escrita extremamente rápidas.",
      "Builds em tmpfs são ~30-40% mais rápidos e não desgastam o SSD.",
      "size=12G é um bom ponto para /var/tmp/portage em máquinas com 32 GB.",
      "Builds gigantes (chromium, firefox, libreoffice) podem estourar — separe via package.env.",
      "tmpfs SEM limite de size pode consumir TODA RAM e travar o sistema.",
      "Sempre nodev,nosuid em tmpfs montado por usuário (segurança).",
      "Armadilha comum: tmpfs pequeno, build de 8 GB falha com 'No space left on device'.",
      "Iniciante comum: pôr /tmp em tmpfs com 16 GB em máquina de 4 GB e quebrar tudo.",
    ],
    alerts: [
      { type: "tip", content: "Em máquinas de 32+ GB de RAM, /var/tmp/portage em tmpfs com 16-20G é o ponto doce. Compilações ficam silenciosas e velozes." },
      { type: "warning", content: "Pacotes grandes que não cabem em tmpfs precisam de PORTAGE_TMPDIR alternativo via package.env. Senão a compilação aborta." },
      { type: "info", content: "tmpfs sob pressão de memória vai usar swap. Não é o fim do mundo, mas perde vantagem de velocidade. Monitore com 'free -h' durante compilação." },
      { type: "danger", content: "tmpfs sem 'size=' definido pode crescer até consumir RAM+swap inteiros e travar a máquina via OOM. Sempre defina limite explícito." },
    ],
  },
  {
    slug: "fstab-avancado",
    section: "armazenamento-avancado",
    title: "fstab avançado: bind, overlay e _netdev",
    difficulty: "avancado",
    subtitle: "Truques que poucos conhecem: bind mounts, overlay fs, x-systemd.automount e mounts de rede.",
    intro: `O '/etc/fstab' é o arquivo que define o que monta no boot e como. Quase todo Linux user só conhece a forma básica (UUID -> ponto -> tipo -> opções). Mas o fstab é uma linguagem rica que permite expressar coisas avançadas: 'bind mounts' que duplicam um ponto em outro lugar (sem cópia), overlay filesystems que sobrepõem camadas (como Docker faz internamente), opções específicas de systemd para automount de rede, opções de FS modernas como noatime e ssd para SSD.

Bind mount é especialmente útil para chroots, containers leves e para reorganizar pontos sem mover dados. Overlay vira a vida do desenvolvedor: você sobrepõe um diretório 'lower' read-only com um 'upper' read-write — modificações vão para upper, leituras caem para lower se não há override. É como ter Git de filesystem para fazer testes destrutivos.

Vamos cobrir todos esses truques avançados, com exemplos práticos: bind mount para um chroot, overlay para isolar testes, e a opção '_netdev' (mais 'x-systemd.automount') que diz ao systemd: 'isso é mount de rede, espere a interface estar de pé antes de tentar'. Tudo isso é a diferença entre um sistema que monta tudo certo no boot e um que cai em emergency shell por timeout do NFS.`,
    codes: [
      { lang: "conf", code: `# /etc/fstab — opções modernas de SSD/NVMe.
# noatime: não atualiza access time (reduz writes drasticamente).
# discard=async: TRIM em background (kernel 5.6+).
# commit=60: força flush a cada 60s (vs 30s default).
UUID=...  /          ext4    defaults,noatime,discard=async,commit=60   0 1
UUID=...  /home      ext4    defaults,noatime,discard=async             0 2
UUID=...  /boot/efi  vfat    defaults,noauto,umask=0077                 0 0` },
      { lang: "conf", code: `# Bind mount: reflete um diretório em outro lugar (sem cópia).
# Útil para chroots, containers, ou reorganizar caminhos.
/srv/dados            /home/joao/dados     none    bind                  0 0
/var/log              /home/joao/logs      none    bind,ro               0 0   # somente leitura

# rbind (recursivo) inclui sub-mounts:
/proc                 /chroot/proc         none    rbind                 0 0
/sys                  /chroot/sys          none    rbind                 0 0
/dev                  /chroot/dev          none    rbind                 0 0` },
      { lang: "conf", code: `# Overlay filesystem em /etc/fstab.
# lower=base read-only, upper=mudanças, work=interno do overlay.
overlay   /merged   overlay   lowerdir=/lower,upperdir=/upper,workdir=/work    0 0

# Caso de uso: testar configs novas em /etc sem afetar produção.
# /lower = /etc original
# /upper = mudanças
# /merged = visão unificada (montar como /etc no chroot/test)` },
      { lang: "conf", code: `# Mounts de rede com systemd.
# _netdev: marca como dependente de rede (espera network.target).
# x-systemd.automount: monta sob demanda no primeiro acesso.
# x-systemd.idle-timeout: desmonta após N segundos ocioso.
# x-systemd.mount-timeout: limite de tempo para tentar montar.

nas.local:/srv/docs   /mnt/docs    nfs4    \\\\
  defaults,_netdev,x-systemd.automount,x-systemd.idle-timeout=600,x-systemd.mount-timeout=10s,soft,intr   0 0

//nas.local/share     /mnt/smb     cifs    \\\\
  defaults,_netdev,credentials=/root/.smbcred,uid=1000,gid=1000   0 0` },
      { lang: "bash", code: `# Aplicar mudanças e debugar.
sudo systemctl daemon-reload    # systemd só lê fstab via daemon-reload
sudo mount -a                   # tenta montar tudo

# Ver o que falhou:
mount | grep tmpfs
findmnt -A
journalctl -xe | grep -i mount

# Para descobrir UUID/LABEL/PARTUUID:
lsblk -f
blkid` },
      { lang: "bash", code: `# Opções de mount úteis menos conhecidas.

# nofail: não trava boot se o dispositivo não estiver presente.
# UUID=...  /mnt/usb-extra  ext4  defaults,nofail   0 2

# x-mount.mkdir: systemd cria o ponto de montagem se não existir.
# UUID=...  /mnt/auto/dados  ext4  defaults,x-mount.mkdir   0 2

# user/users: permite usuário comum montar/desmontar.
# /dev/sdb1  /mnt/usb  vfat  user,noauto,umask=000   0 0` },
      { lang: "conf", code: `# Subvolume Btrfs e snapshots no fstab.
# Cada subvolume vira entrada separada com 'subvol='.
UUID=abc  /            btrfs  subvol=@,compress=zstd:3,noatime,space_cache=v2     0 0
UUID=abc  /home        btrfs  subvol=@home,compress=zstd:3,noatime                0 0
UUID=abc  /.snapshots  btrfs  subvol=@snapshots,noatime                           0 0
UUID=abc  /var/log     btrfs  subvol=@log,compress=zstd:3,noatime,nodatacow       0 0` },
    ],
    points: [
      "noatime + discard=async em SSD reduz writes desnecessários — sempre use.",
      "Bind mount duplica diretório sem copiar — perfeito para chroots.",
      "rbind inclui sub-mounts; bind simples não inclui.",
      "_netdev é OBRIGATÓRIO em mount de rede para systemd esperar a network.",
      "nofail impede boot travado se um disco opcional não está presente.",
      "x-systemd.automount monta sob demanda; combine com idle-timeout.",
      "Armadilha comum: NFS no fstab sem _netdev — boot trava 30+ segundos.",
      "Iniciante comum: editar fstab e não rodar 'mount -a' antes de reboot — descobre erro só ao reiniciar.",
    ],
    alerts: [
      { type: "danger", content: "Erro de syntax no fstab pode travar o boot em emergency shell. SEMPRE rode 'mount -a' depois de editar para validar antes de reiniciar." },
      { type: "tip", content: "Use 'nofail' em mounts de mídias removíveis e backup discos. Boot continua mesmo se o dispositivo não estiver conectado." },
      { type: "warning", content: "Bind mount com 'ro' não impede modificação se o original for escrevível. Use 'mount --bind -o remount,ro' ou 'nosuid,nodev,noexec' para isolamento real." },
      { type: "info", content: "O dump (5º campo) é legado e quase ninguém usa hoje. O pass (6º) controla ordem do fsck — '/' deve ser 1, outros FS 2, swap/tmpfs/EFI 0." },
    ],
  },
];
