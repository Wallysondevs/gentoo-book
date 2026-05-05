import type { Chapter } from "../types";

export const chapters: Chapter[] = [
  {
    slug: "servidor-web",
    section: "projetos-apendice",
    title: "Projeto: servidor web LEMP no Gentoo",
    difficulty: "intermediario",
    subtitle: "Receita end-to-end de um servidor com Nginx, PHP-FPM e PostgreSQL no perfil hardened.",
    intro: `Servir um site em Gentoo não é diferente em comando do que em Debian, mas é diferente em postura. Aqui você decide quais módulos do PHP existem, quais TLS o Nginx aceita, qual versão do PostgreSQL roda e quais flags de compilação foram usadas. O ganho é um servidor enxuto, sem dezenas de funcionalidades que você nunca usaria, e o custo é uma hora de configuração inicial bem feita.

Este projeto monta uma stack 'LEMP' (Linux, Nginx, MySQL/PostgreSQL, PHP) usando o profile 'hardened' (que ativa proteções como PIE, SSP e RELRO por padrão) e o init system OpenRC. A escolha por hardened não é fetiche: ele troca um pouquinho de performance por uma superfície de ataque menor — exatamente o que se quer num servidor exposto à internet. Vamos compilar PHP com FPM (FastCGI Process Manager), conectar ao Nginx via socket Unix e usar PostgreSQL em vez do MySQL para evitar a saga de licenciamento da Oracle.

No final você terá um servidor que serve PHP dinâmico, conversa com PostgreSQL, recarrega configs sem queda e arranca no boot. É a base que você adapta para WordPress, Nextcloud, um CMS próprio ou uma API legada. Outros projetos deste apêndice (NAS, container host) seguem a mesma lógica de 'monte com cuidado, mantenha com calma'.`,
    codes: [
      { lang: "bash", code: `# 1) Trocar para o profile hardened (sem multilib, OpenRC).
eselect profile list | grep hardened
sudo eselect profile set default/linux/amd64/23.0/hardened
# Reconstrua o sistema base após mudar de profile (demora horas):
sudo emerge --ask --emptytree --usepkg=n @world` },
      { lang: "ini", code: `# /etc/portage/package.use/lemp
# Nginx com SSL, http2 e suporte a PHP via FastCGI.
www-servers/nginx NGINX_MODULES_HTTP: ssl http_v2 stub_status realip
www-servers/nginx SSL_BACKEND: openssl

# PHP com FPM, PostgreSQL e extensões web comuns.
dev-lang/php fpm pdo postgres curl gd intl mysql opcache sockets xml zip
dev-db/postgresql server uuid` },
      { lang: "bash", code: `# 2) Instalar a stack inteira.
sudo emerge --ask www-servers/nginx dev-lang/php dev-db/postgresql

# Configurar o cluster PostgreSQL (uma vez):
sudo emerge --config dev-db/postgresql:16

# Subir os serviços (OpenRC) e habilitar no boot:
sudo rc-service postgresql-16 start
sudo rc-service php-fpm start
sudo rc-service nginx start
sudo rc-update add postgresql-16 default
sudo rc-update add php-fpm default
sudo rc-update add nginx default` },
      { lang: "conf", code: `# /etc/nginx/sites-available/exemplo.conf
server {
    listen 443 ssl http2;
    server_name exemplo.local;
    root /var/www/exemplo;
    index index.php index.html;

    ssl_certificate     /etc/ssl/exemplo/fullchain.pem;
    ssl_certificate_key /etc/ssl/exemplo/privkey.pem;

    location ~ \\.php\$ {
        fastcgi_pass unix:/run/php-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
    }
}` },
      { lang: "bash", code: `# 3) Validar e recarregar Nginx sem queda.
sudo nginx -t           # checa sintaxe; deve dizer 'syntax is ok'
sudo rc-service nginx reload

# Acompanhar logs em tempo real:
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log` },
      { lang: "bash", code: `# 4) Hardening básico depois de subir.
sudo glsa-check -l affected   # lista vulnerabilidades aplicáveis ao seu sistema
sudo glsa-check -f all        # corrige todas (faz emerge das versões seguras)

# Firewall mínimo com nftables (assumindo nftables já instalado):
sudo nft add table inet filter
sudo nft add chain inet filter input '{ type filter hook input priority 0; policy drop; }'
sudo nft add rule inet filter input ct state established,related accept
sudo nft add rule inet filter input tcp dport { 22, 80, 443 } accept` },
    ],
    points: [
      "Profile 'hardened' liga PIE/SSP/RELRO por padrão e custa pouca performance.",
      "PHP-FPM via socket Unix é mais rápido e seguro que TCP loopback.",
      "Recarregue Nginx com 'reload' (não 'restart') para evitar queda de conexões.",
      "Sempre rode 'nginx -t' antes de aplicar config — erro de sintaxe derruba o site.",
      "glsa-check é o equivalente do CVE scan da Gentoo; rode toda semana.",
      "rc-update add ... default coloca o serviço no runlevel padrão.",
      "Armadilha comum: esquecer de abrir 80/443 no firewall e pensar que é Nginx.",
      "Iniciante comum: trocar de profile e não recompilar @world — bibliotecas inconsistentes.",
    ],
    alerts: [
      { type: "tip", content: "Faça o switch para hardened ANTES de instalar a stack. Recompilar do zero leva horas mas evita misturas." },
      { type: "warning", content: "Mudar de profile sem 'emerge --emptytree @world' costuma deixar binários antigos sem as proteções do hardened. A segurança fica meia-boca sem você notar." },
      { type: "danger", content: "Nunca exponha PostgreSQL na porta 5432 para a internet. Bind em 127.0.0.1 e use SSH tunnel ou Unix socket." },
      { type: "success", content: "Combinando FEATURES=\"buildpkg\" com binhost local, você consegue replicar este servidor em outras máquinas em minutos, sem recompilar." },
    ],
  },
  {
    slug: "desktop-completo",
    section: "projetos-apendice",
    title: "Projeto: desktop completo (KDE Plasma + apps)",
    difficulty: "intermediario",
    subtitle: "Receita end-to-end para um desktop Gentoo de uso diário, do Xorg aos aplicativos.",
    intro: `Montar um desktop Gentoo do zero é o exercício final de quase tudo que você aprendeu no livro. Você vai juntar profile correto, USE flags, drivers de vídeo, servidor gráfico, ambiente de desktop, fontes e aplicativos numa sequência que faça sentido, evitando recompilar três vezes a mesma biblioteca por mudar uma flag tarde demais.

Aqui escolhemos KDE Plasma porque é o ambiente mais customizável e tem suporte excelente tanto a Wayland quanto a Xorg. O profile recomendado é 'desktop/plasma' (ou 'desktop/plasma/systemd' se você prefere systemd). Esse profile já vem com USE flags ligadas para Qt, multimídia, impressão e acessibilidade — sem você precisar caçar uma a uma. O resto é decisão sua: navegador, terminal, editor.

A receita abaixo monta: KDE Plasma, SDDM como login manager, Firefox, LibreOffice, MPV, Pipewire para áudio, fontes Noto, e drivers Mesa para Intel/AMD (NVIDIA proprietário fica no capítulo de drivers). É o suficiente para um desktop diário. Reserve uma tarde livre — o emerge inicial pode passar de duas horas em hardware modesto. Use ccache e binhost para encurtar.`,
    codes: [
      { lang: "bash", code: `# 1) Profile desktop/plasma (OpenRC). Versão systemd: desktop/plasma/systemd.
eselect profile list | grep plasma
sudo eselect profile set default/linux/amd64/23.0/desktop/plasma

# Sincronize e atualize o set base ao novo profile.
sudo emerge --ask --update --deep --newuse @world` },
      { lang: "ini", code: `# /etc/portage/make.conf — trechos relevantes
VIDEO_CARDS="intel iris amdgpu radeonsi"
INPUT_DEVICES="libinput"
USE="X wayland pulseaudio pipewire pipewire-alsa dbus elogind \\
     networkmanager bluetooth pdf png jpeg svg gtk qt6"
ACCEPT_LICENSE="*"
GENTOO_MIRRORS="https://mirror.gentoo-br.org/"
FEATURES="ccache parallel-fetch"
MAKEOPTS="-j\$(nproc)"` },
      { lang: "bash", code: `# 2) Instalar Xorg + Plasma + login manager.
sudo emerge --ask x11-base/xorg-server kde-plasma/plasma-meta x11-misc/sddm

# 3) Habilitar SDDM e o Plasma no boot.
sudo rc-update add elogind boot
sudo rc-update add dbus default
sudo rc-update add display-manager default

# Editar /etc/conf.d/display-manager:
# DISPLAYMANAGER="sddm"` },
      { lang: "bash", code: `# 4) Pipewire moderno como sistema de áudio.
sudo emerge --ask media-video/pipewire media-video/wireplumber

# Habilite via systemd --user OU adicione no autostart do Plasma:
# /etc/xdg/autostart já vem com pipewire e wireplumber se a USE='pipewire' estiver ligada.

# Teste o áudio:
pw-cli info` },
      { lang: "bash", code: `# 5) Apps essenciais. Faça em um único emerge para o Portage otimizar dependências.
sudo emerge --ask \\
  www-client/firefox \\
  app-office/libreoffice \\
  media-video/mpv \\
  media-fonts/noto media-fonts/noto-emoji \\
  media-fonts/jetbrains-mono \\
  app-text/poppler` },
      { lang: "bash", code: `# 6) NetworkManager + Bluetooth para conexões.
sudo emerge --ask net-misc/networkmanager net-wireless/bluez
sudo rc-update add NetworkManager default
sudo rc-update add bluetooth default
sudo gpasswd -a \$USER plugdev
sudo gpasswd -a \$USER video
sudo gpasswd -a \$USER audio` },
      { lang: "bash", code: `# 7) Reinicie e logue no SDDM.
sudo reboot
# No SDDM, escolha 'Plasma (Wayland)' ou 'Plasma (X11)' no canto inferior.` },
    ],
    points: [
      "Escolha o profile 'desktop/plasma' antes de instalar — economiza horas de retrabalho.",
      "VIDEO_CARDS e INPUT_DEVICES no make.conf são obrigatórios para o stack gráfico funcionar.",
      "Pipewire substitui PulseAudio com melhor latência e suporte nativo a Bluetooth A2DP.",
      "Adicione seu usuário aos grupos video, audio, plugdev e wheel.",
      "Faça emerge de muitos pacotes de uma vez — Portage otimiza melhor as dependências.",
      "Use ccache (FEATURES=\"ccache\") para encurtar recompilações futuras em ~30%.",
      "Armadilha comum: esquecer de iniciar elogind/dbus e SDDM não loga.",
      "Iniciante comum: ligar USE=\"-X\" no make.conf e quebrar metade do KDE.",
    ],
    alerts: [
      { type: "tip", content: "Reserve /var/tmp/portage como tmpfs (8GB+) para acelerar builds — em SSD modernos é gritantemente mais rápido." },
      { type: "info", content: "Desde 2024 a Gentoo oferece binhost oficial. Habilite em /etc/portage/binrepos.conf e use --getbinpkg para baixar pacotes prontos quando disponíveis." },
      { type: "warning", content: "Profile com 'systemd' no nome instala systemd como init. Você não migra OpenRC↔systemd sem trabalho — escolha consciente desde já." },
      { type: "success", content: "Plasma 6 sobre Wayland está estável em 2024. É o caminho recomendado para hardware moderno." },
    ],
  },
  {
    slug: "embedded-rpi",
    section: "projetos-apendice",
    title: "Projeto: Gentoo no Raspberry Pi 4/5",
    difficulty: "avancado",
    subtitle: "Compilando, gravando e atualizando Gentoo em um SBC ARM64 com cross-compile.",
    intro: `Raspberry Pi é o playground perfeito para Gentoo embedded: barato, ARM64, SoC documentado, comunidade ativa. Rodar Gentoo nele te dá um sistema enxuto que cabe em 4GB e arranca em segundos — algo impensável com a imagem oficial Raspberry Pi OS, que vem com tudo e mais um pouco.

A pegadinha é que compilar diretamente no Pi é lento (mesmo o Pi 5 não é um workstation). A solução é cross-compile: você usa seu desktop x86_64 para gerar binários ARM64 com a ferramenta 'crossdev' e depois manda para o Pi via 'distcc' ou via um binhost local. Outra alternativa é usar a imagem oficial 'gentoo-rpi-image' (stage3 já preparado para Pi) e atualizar a partir dali.

Este capítulo dá a receita completa: baixar o stage3 ARM64 do Pi, gravar no microSD, fazer o primeiro boot, configurar o crossdev no desktop e usar binhost para acelerar. No final você tem um Pi rodando Gentoo enxuto, ideal para servidor caseiro, retroconsole, sensor IoT ou simplesmente para aprender.`,
    codes: [
      { lang: "bash", code: `# 1) Baixe o stage3 ARM64 oficial pré-configurado para Raspberry Pi.
# Página: https://www.gentoo.org/downloads/#arm64
wget https://distfiles.gentoo.org/releases/arm64/autobuilds/current-stage3-arm64-openrc/stage3-arm64-openrc-*.tar.xz

# Verifique o checksum (sempre).
wget https://distfiles.gentoo.org/releases/arm64/autobuilds/current-stage3-arm64-openrc/stage3-arm64-openrc-*.tar.xz.DIGESTS
sha512sum -c stage3-arm64-openrc-*.tar.xz.DIGESTS` },
      { lang: "bash", code: `# 2) Particione e formate o microSD (assuma /dev/sdX — CONFIRA antes!).
sudo parted /dev/sdX -- mklabel msdos
sudo parted /dev/sdX -- mkpart primary fat32 1MiB 257MiB
sudo parted /dev/sdX -- mkpart primary ext4 257MiB 100%
sudo parted /dev/sdX -- set 1 boot on

sudo mkfs.vfat -F32 -n RPIBOOT /dev/sdX1
sudo mkfs.ext4 -L RPIROOT /dev/sdX2` },
      { lang: "bash", code: `# 3) Monte e descompacte o stage3.
sudo mount /dev/sdX2 /mnt/rpi
sudo mkdir /mnt/rpi/boot
sudo mount /dev/sdX1 /mnt/rpi/boot

sudo tar xpvf stage3-arm64-openrc-*.tar.xz \\
  -C /mnt/rpi --xattrs-include='*.*' --numeric-owner

# Copie firmware e bootloader do Raspberry Pi:
sudo cp -r firmware/* /mnt/rpi/boot/   # bootcode.bin, start*.elf, kernel*.img` },
      { lang: "conf", code: `# /mnt/rpi/boot/config.txt — config do bootloader do Pi.
# Habilita áudio, vídeo HDMI, e seleciona o kernel ARM64.
arm_64bit=1
kernel=kernel8.img
gpu_mem=64
hdmi_force_hotplug=1
dtparam=audio=on
enable_uart=1
disable_overscan=1` },
      { lang: "bash", code: `# 4) cmdline.txt — parâmetros do kernel no boot do Pi.
echo 'root=/dev/mmcblk0p2 rootfstype=ext4 rootwait console=tty1' \\
  | sudo tee /mnt/rpi/boot/cmdline.txt

# Desmonte com cuidado e plugue no Pi.
sudo umount /mnt/rpi/boot /mnt/rpi
sync` },
      { lang: "bash", code: `# 5) (Opcional, no DESKTOP) Cross-compile com crossdev para acelerar updates.
sudo emerge --ask sys-devel/crossdev
sudo mkdir -p /var/db/repos/crossdev/{profiles,metadata}
echo 'crossdev' | sudo tee /var/db/repos/crossdev/profiles/repo_name

sudo crossdev -t aarch64-unknown-linux-gnu --stable

# Agora 'aarch64-unknown-linux-gnu-gcc' existe — você pode gerar binpkgs ARM64
# e expor via binhost para o Pi consumir com --getbinpkg.` },
      { lang: "bash", code: `# 6) No PI, primeiro boot: senha root padrão é vazia.
# Após login, sincronize e atualize.
emerge-webrsync
emerge --sync
emerge --ask --update --deep --newuse @world

# Configure timezone, locale e users como em qualquer Gentoo (capítulo de instalação).` },
    ],
    points: [
      "Use stage3 ARM64 oficial — vem com kernel e firmware do Pi prontos.",
      "Crossdev no desktop economiza horas de compilação no Pi.",
      "/dev/mmcblk0p2 é o nome típico da segunda partição do microSD no Pi.",
      "config.txt e cmdline.txt são específicos do bootloader do Raspberry Pi.",
      "Use FAT32 na /boot — o firmware do Pi não lê ext4 nem btrfs.",
      "Considere SSD via USB no Pi 4/5 — microSD morre rápido com swap ativa.",
      "Armadilha comum: confirmar /dev/sdX errado e formatar o disco do desktop.",
      "Iniciante comum: pular o sync de firmware e ter Pi sem rede ou sem vídeo.",
    ],
    alerts: [
      { type: "danger", content: "Confirme TRÊS VEZES qual é o /dev/sdX do microSD com 'lsblk' antes de qualquer mkfs ou parted. Errar formata seu HD." },
      { type: "tip", content: "Desabilite swap em microSD ('rc-update del swap default'). Use zram-init no lugar — RAM compactada é muito mais rápida e não desgasta o cartão." },
      { type: "info", content: "O Pi 5 tem PCIe — você pode plugar NVMe via HAT oficial e ter um servidor Gentoo respeitável em hardware de R$500." },
      { type: "warning", content: "MAKEOPTS=\"-j4\" no Pi 4 (4 cores) é seguro; no Pi 5 (4 cores também) também. Não exagere — o Pi pode ficar sem RAM e travar o build." },
    ],
  },
  {
    slug: "container-host",
    section: "projetos-apendice",
    title: "Projeto: Gentoo como host de containers",
    difficulty: "intermediario",
    subtitle: "Configurando Docker, Podman e LXC sobre OpenRC para rodar workloads isolados.",
    intro: `Container é processo isolado: namespaces de rede, PID, mount, mais cgroups para limitar recursos. Gentoo é uma escolha curiosa para host de containers porque o sistema base já é minúsculo e você controla tudo. O resultado é um host de container que consome menos RAM ociosa que muitas distros enterprise e ainda assim roda Docker, Podman e LXC com facilidade.

A pedra no caminho histórica era o cgroup hybrid: Docker/Podman precisam de cgroups v2, e algumas instalações antigas vinham com v1. Em Gentoo 2024, o profile padrão já habilita cgroups v2 puros. Para funcionar bem com OpenRC, ative USE=\"cgroup-hybrid\" se ainda usa pacotes legados, ou puro v2 se tudo for moderno (recomendado).

Este projeto cobre Docker (mais popular), Podman (rootless, sem daemon, recomendado por segurança) e LXC (containers de sistema, parecem 'mini-VMs'). Você escolhe a ferramenta certa para cada caso: Docker para apps stateless, Podman para CI/CD seguro, LXC para isolar serviços inteiros como em uma VM mas com overhead próximo de zero.`,
    codes: [
      { lang: "bash", code: `# 1) Habilite cgroups v2 (já é o padrão em kernels 5.x+).
# No kernel:
# General setup → Control Group support
#   [*] Memory controller
#   [*] CPU controller
#   [*] IO controller
#   [*] PIDs controller
# Verifique no sistema rodando:
mount | grep cgroup
# Espere algo como:  cgroup2 on /sys/fs/cgroup type cgroup2 ...` },
      { lang: "bash", code: `# 2) Docker no Gentoo (com OpenRC).
sudo emerge --ask app-containers/docker app-containers/docker-cli

sudo rc-update add docker default
sudo rc-service docker start

# Adicione seu usuário ao grupo docker (login novamente depois):
sudo gpasswd -a \$USER docker

# Teste:
docker run --rm hello-world` },
      { lang: "bash", code: `# 3) Podman — sem daemon, suporta rootless.
sudo emerge --ask app-containers/podman

# Configure subuids/subgids para rootless:
echo "\$USER:100000:65536" | sudo tee -a /etc/subuid
echo "\$USER:100000:65536" | sudo tee -a /etc/subgid

# Teste rootless (sem sudo):
podman run --rm docker.io/library/alpine:latest echo "Olá rootless!"` },
      { lang: "bash", code: `# 4) LXC — containers de sistema (parecem mini-VMs).
sudo emerge --ask app-containers/lxc

sudo rc-update add lxc default
sudo rc-service lxc start

# Crie um container Debian rapidinho:
sudo lxc-create -n teste -t download -- -d debian -r bookworm -a amd64
sudo lxc-start -n teste
sudo lxc-attach -n teste` },
      { lang: "ini", code: `# /etc/portage/package.use/containers
# Em alguns pacotes legados ainda pode ser necessário:
sys-apps/openrc cgroup-hybrid
app-containers/docker btrfs overlay aufs

# Para Podman com suporte completo:
app-containers/podman fuse rootless` },
      { lang: "bash", code: `# 5) Limites com cgroups v2 (sem ferramentas extras).
# Limitar um container Docker a 512MB de RAM e 1 CPU:
docker run --rm -m 512m --cpus=1 alpine sleep 60

# Ver uso ao vivo:
docker stats` },
    ],
    points: [
      "cgroups v2 puros são o padrão moderno — só ative cgroup-hybrid se precisar de software legado.",
      "Docker exige daemon root; Podman roda rootless — escolha Podman para isolamento maior.",
      "LXC é container 'de sistema' (init dentro), Docker é 'de app' (um processo principal).",
      "Adicione o usuário ao grupo docker — sem isso, todo comando pede sudo.",
      "Subuid/subgid são essenciais para rootless funcionar — configure em /etc/subuid e /etc/subgid.",
      "OverlayFS no kernel acelera Docker — habilite em 'File systems → Overlay filesystem support'.",
      "Armadilha comum: esquecer de habilitar overlay no kernel e Docker cair no driver vfs (lento).",
      "Iniciante comum: rodar 'docker run' sem o grupo e culpar o Gentoo pela permissão negada.",
    ],
    alerts: [
      { type: "warning", content: "Adicionar um usuário ao grupo 'docker' equivale a dar root via socket. É conveniente mas não é seguro em ambientes compartilhados." },
      { type: "tip", content: "Para CI/CD em servidores de build, prefira Podman rootless. Você ganha isolamento real do user namespace sem dor de cabeça." },
      { type: "info", content: "Containers compartilham o kernel do host. Atualize o kernel do Gentoo regularmente — uma falha no kernel afeta todos os containers." },
      { type: "success", content: "Distros minimais como Alpine ficam em ~5MB. Combine Gentoo enxuto + container Alpine + Podman e você tem um host de containers que roda em VPS de 1GB de RAM." },
    ],
  },
  {
    slug: "nas-caseiro",
    section: "projetos-apendice",
    title: "Projeto: NAS caseiro com ZFS, Samba e NFS",
    difficulty: "avancado",
    subtitle: "Pool ZFS com snapshots automáticos, compartilhamento via Samba (Windows) e NFS (Unix).",
    intro: `Um NAS (Network Attached Storage) caseiro com Gentoo é um projeto satisfatório: você reutiliza um PC velho, bota 2-4 HDs, instala ZFS, configura Samba e NFS, e tem um cofre de dados confiável. ZFS oferece checksums, snapshots, deduplicação opcional e RAID em software (RAIDZ) que detectam e corrigem bit rot — coisa que ext4 + mdadm não faz.

A licença CDDL do ZFS é incompatível com a GPL do kernel Linux, então você não verá ZFS na imagem oficial do kernel. No Gentoo isso é resolvido elegantemente: o pacote 'sys-fs/zfs' compila o módulo no momento da instalação, vinculando contra o seu kernel atual. Você ganha ZFS de verdade, não a meia-implementação que algumas distros oferecem.

A receita aqui monta um pool RAIDZ1 (similar ao RAID5) com 3 discos, dataset com compressão lz4, snapshot automático a cada hora via 'zfs-auto-snapshot', e compartilhamento dual: Samba para Windows/macOS, NFSv4 para outros Linux. Resultado: uma central de backup robusta que você pode confiar para fotos da família ou backups do escritório.`,
    codes: [
      { lang: "bash", code: `# 1) Instalar ZFS + utilitários. O módulo será compilado contra o kernel atual.
sudo emerge --ask sys-fs/zfs sys-fs/zfs-kmod

# Habilitar serviços OpenRC:
sudo rc-update add zfs-import boot
sudo rc-update add zfs-mount boot
sudo rc-update add zfs-share default
sudo rc-update add zfs-zed default
sudo rc-service zfs-import start
sudo rc-service zfs-mount start` },
      { lang: "bash", code: `# 2) Criar pool RAIDZ1 com 3 discos. CONFIRA os /dev/sdX!
# RAIDZ1 = redundância de 1 disco (suporta perder 1 dos 3).
sudo zpool create -o ashift=12 tank \\
  raidz1 /dev/disk/by-id/ata-WDC_WD40_001 \\
         /dev/disk/by-id/ata-WDC_WD40_002 \\
         /dev/disk/by-id/ata-WDC_WD40_003

# Confirmar:
sudo zpool status tank
sudo zpool list` },
      { lang: "bash", code: `# 3) Criar datasets com compressão e atributos úteis.
sudo zfs create -o compression=lz4 -o atime=off tank/midia
sudo zfs create -o compression=zstd -o atime=off tank/documentos
sudo zfs create -o compression=lz4 -o recordsize=1M tank/backup

# Quotas:
sudo zfs set quota=2T tank/midia
sudo zfs set quota=500G tank/documentos

# Listar:
zfs list` },
      { lang: "bash", code: `# 4) Snapshots automáticos (a cada hora, mantém 24h e 7 diários).
sudo emerge --ask sys-fs/zfs-auto-snapshot

# Edite /etc/zfs/zfs-auto-snapshot.conf — vem com defaults sensatos.
# Os snapshots aparecem em .zfs/snapshot/ dentro de cada dataset.

# Listar snapshots:
zfs list -t snapshot tank/documentos` },
      { lang: "conf", code: `# /etc/samba/smb.conf — compartilhar tank/midia para a rede Windows.
[global]
   workgroup = CASA
   server string = NAS Gentoo
   security = user
   map to guest = Bad User
   server min protocol = SMB2

[midia]
   path = /tank/midia
   browseable = yes
   guest ok = no
   writable = yes
   valid users = @nasusers
   create mask = 0664
   directory mask = 0775` },
      { lang: "bash", code: `# 5) Subir Samba e criar usuário SMB.
sudo emerge --ask net-fs/samba
sudo rc-update add samba default
sudo groupadd nasusers
sudo gpasswd -a \$USER nasusers
sudo smbpasswd -a \$USER     # define senha SMB separada da senha do sistema

sudo rc-service samba start` },
      { lang: "bash", code: `# 6) NFSv4 para outros Linux/macOS.
sudo emerge --ask net-fs/nfs-utils

# /etc/exports
echo '/tank/documentos 192.168.1.0/24(rw,sync,no_subtree_check)' \\
  | sudo tee -a /etc/exports

sudo rc-update add nfs default
sudo rc-service nfs start
sudo exportfs -rav` },
    ],
    points: [
      "RAIDZ1 = perde 1 disco e você ainda monta; RAIDZ2 = perde 2; ZFS mirror = RAID1.",
      "Use /dev/disk/by-id ao criar o pool — nomes /dev/sdX podem mudar entre boots.",
      "ashift=12 é correto para discos com setores de 4K (a maioria desde 2011).",
      "Compressão lz4 é praticamente grátis em CPU e economiza 20-50% de espaço.",
      "Snapshots ZFS são instantâneos e quase de graça (copy-on-write).",
      "atime=off reduz I/O em datasets de mídia/leitura intensiva.",
      "Armadilha comum: criar pool com /dev/sda, /dev/sdb e ver tudo virar /dev/sdc no próximo boot.",
      "Iniciante comum: confundir senha do sistema com senha SMB — são separadas.",
    ],
    alerts: [
      { type: "danger", content: "Antes de criar pool ZFS, confirme com 'lsblk' e 'blkid' que os discos estão vazios. zpool create destrói qualquer dado existente sem aviso." },
      { type: "tip", content: "Use 'zpool scrub tank' mensalmente. Ele lê tudo e corrige bit rot detectado pelos checksums. Agende com cron." },
      { type: "warning", content: "ZFS adora RAM — recomendam 1GB por TB. Se o NAS tem só 4GB, ative o ARC limitado em /etc/modprobe.d/zfs.conf para evitar OOM." },
      { type: "info", content: "Compressão zstd (níveis 1-19) supera lz4 em razão mas custa CPU. Bom para datasets de documentos texto, ruim para mídia já comprimida." },
    ],
  },
  {
    slug: "gentoo-prefix",
    section: "projetos-apendice",
    title: "Gentoo Prefix: Gentoo dentro de outro sistema",
    difficulty: "avancado",
    subtitle: "Rodando Portage dentro de macOS, Solaris ou outro Linux sem ser root.",
    intro: `Gentoo Prefix é uma versão especial do Gentoo que vive dentro de um diretório qualquer (chamado 'EPREFIX'), em cima de um sistema operacional hospedeiro. Você não substitui nada do host — instala num /opt/gentoo ou /home/usuario/gentoo, e usa Portage normalmente para instalar software ali dentro. Funciona em macOS, FreeBSD, Solaris e outras distros Linux.

O caso de uso clássico é macOS: você quer software UNIX moderno sem depender de Homebrew, e quer Portage com USE flags. Em servidores compartilhados onde você não é root, Prefix permite instalar suas ferramentas sem pedir favor ao admin. Em distros corporativas engessadas (RHEL, SLES), Prefix te dá um Portage paralelo para experimentar.

A instalação é via script bootstrap que baixa um stage3 mínimo, compila Portage para o EPREFIX, e te deixa um shell isolado. Tudo o que você instalar com 'emerge' fica em \${EPREFIX}/usr/bin, \${EPREFIX}/etc, \${EPREFIX}/var. O sistema do hospedeiro continua intocado. Para 'entrar' no Gentoo Prefix você roda um shell interativo que ajusta PATH e variáveis.`,
    codes: [
      { lang: "bash", code: `# 1) Defina onde o Prefix vai morar (qualquer diretório que você possa escrever).
export EPREFIX="\$HOME/gentoo"
mkdir -p "\$EPREFIX"

# Não precisa de root. Tudo fica dentro de \$EPREFIX.` },
      { lang: "bash", code: `# 2) Baixe o script bootstrap oficial.
cd "\$EPREFIX"
wget https://gitweb.gentoo.org/repo/proj/prefix.git/plain/scripts/bootstrap-prefix.sh
chmod +x bootstrap-prefix.sh

# Rode o bootstrap. Vai perguntar EPREFIX e arquitetura.
./bootstrap-prefix.sh` },
      { lang: "bash", code: `# 3) O bootstrap demora horas: compila Portage, GCC mínimo, glibc/libstdc++.
# Acompanhe sem interromper. No final ele dá instruções de como entrar.

# Para entrar no shell do Prefix depois:
\$EPREFIX/startprefix

# Você verá um prompt diferente, com PATH apontando para \$EPREFIX/usr/bin.` },
      { lang: "bash", code: `# 4) Dentro do Prefix, use Portage normalmente.
emerge --sync
emerge --ask app-misc/screen
emerge --ask sys-devel/gcc
emerge --ask app-shells/zsh

# Tudo é instalado em \$EPREFIX. Nenhum impacto no SO hospedeiro.` },
      { lang: "ini", code: `# \$EPREFIX/etc/portage/make.conf — semelhante ao Gentoo nativo.
CHOST="x86_64-pc-linux-gnu"            # ou darwin se for macOS
COMMON_FLAGS="-O2 -pipe"
CFLAGS="\${COMMON_FLAGS}"
CXXFLAGS="\${COMMON_FLAGS}"
MAKEOPTS="-j\$(nproc)"
USE="-X -gtk -qt5 ncurses readline"   # tipicamente menos USE em Prefix
ACCEPT_LICENSE="*"` },
      { lang: "bash", code: `# 5) Saia do Prefix simplesmente com 'exit'.
# Quando quiser voltar:
~/gentoo/startprefix

# Para integrar ao seu shell normal sem 'startprefix', adicione ao .bashrc:
# export PATH="\$HOME/gentoo/usr/bin:\$PATH"
# (mas cuidado: pode mascarar binários do hospedeiro)` },
    ],
    points: [
      "Prefix instala em qualquer diretório que você possa escrever — não precisa de root.",
      "EPREFIX é a variável-chave: tudo do Gentoo Prefix mora dentro dela.",
      "startprefix abre um shell isolado com PATH e env ajustados.",
      "Ideal para macOS, servidores compartilhados ou distros corporativas engessadas.",
      "Bootstrap demora horas — compila toolchain inteira do zero.",
      "USE flags ficam tipicamente reduzidas (sem X, sem Qt) por ser ambiente terminal.",
      "Armadilha comum: misturar PATH do Prefix com PATH do host e binários se confundirem.",
      "Iniciante comum: tentar usar emerge sem entrar no startprefix antes.",
    ],
    alerts: [
      { type: "tip", content: "Em macOS, o Prefix moderno usa o framework de identidade do Apple Silicon. Use o script oficial atualizado e não tutoriais antigos." },
      { type: "info", content: "Performance no Prefix é praticamente idêntica ao Gentoo nativo — afinal os binários são reais, só o caminho é diferente." },
      { type: "warning", content: "Não rode bootstrap-prefix.sh como root. Foi desenhado para rodar como usuário comum; rodar como root pode dar permissões erradas no resultado." },
      { type: "success", content: "Já existem stages pré-bootstrapados para macOS Apple Silicon. Veja em wiki.gentoo.org/wiki/Project:Prefix — pode pular horas de compilação." },
    ],
  },
  {
    slug: "crossdev",
    section: "projetos-apendice",
    title: "crossdev: compilando para outras arquiteturas",
    difficulty: "avancado",
    subtitle: "Toolchain cruzada para ARM64, RISC-V e outros alvos a partir do seu desktop x86_64.",
    intro: `Cross-compile é compilar em uma arquitetura para gerar binários de outra. Em Gentoo isso é tratado por uma ferramenta chamada 'crossdev', que automatiza a criação de uma toolchain completa (binutils, GCC, glibc, kernel headers) para o alvo escolhido. Depois disso, você ganha comandos como 'aarch64-unknown-linux-gnu-gcc' no PATH e pode usar Portage com a flag '\${alvo}' para gerar pacotes binários para outra arch.

O caso clássico é Raspberry Pi: o Pi compila lentamente, então você cross-compila no desktop x86_64 e envia binpkgs prontos. Outro caso é embedded ARM ou RISC-V: você compila no servidor potente e flasheia a imagem no dispositivo. Crossdev também ajuda em CI/CD: build farms que precisam gerar artefatos para múltiplas archs sem manter máquinas físicas de cada.

Crossdev usa o conceito de 'overlay' do Portage para colocar os ebuilds da toolchain cruzada em um repositório separado (/var/db/repos/crossdev). Você pode ter várias toolchains coexistindo: ARMv7, ARM64, RISC-V, MIPS — cada uma com seu próprio prefixo de binário. A receita abaixo cria uma toolchain ARM64 e mostra como usá-la para gerar binpkgs.`,
    codes: [
      { lang: "bash", code: `# 1) Instalar crossdev e preparar o overlay.
sudo emerge --ask sys-devel/crossdev

sudo mkdir -p /var/db/repos/crossdev/{profiles,metadata}
echo 'crossdev' | sudo tee /var/db/repos/crossdev/profiles/repo_name
sudo chown -R portage:portage /var/db/repos/crossdev` },
      { lang: "conf", code: `# /etc/portage/repos.conf/crossdev.conf — registrar o overlay.
[crossdev]
location = /var/db/repos/crossdev
priority = 10
masters = gentoo
auto-sync = no` },
      { lang: "bash", code: `# 2) Gerar a toolchain ARM64 (aarch64). Demora ~30min em hardware decente.
sudo crossdev -t aarch64-unknown-linux-gnu --stable

# Verifique:
aarch64-unknown-linux-gnu-gcc --version
# Saída esperada:
# aarch64-unknown-linux-gnu-gcc (Gentoo 13.2.1) ...` },
      { lang: "bash", code: `# 3) Compilar um pacote para ARM64 e gerar binpkg.
# Cada toolchain tem seu próprio /usr/aarch64-unknown-linux-gnu/etc/portage/.
sudo aarch64-unknown-linux-gnu-emerge --ask --buildpkgonly app-editors/nano

# Os binpkgs ficam em:
ls /usr/aarch64-unknown-linux-gnu/var/cache/binpkgs/` },
      { lang: "bash", code: `# 4) Servir esses binpkgs como binhost (HTTP simples).
# No host x86_64:
cd /usr/aarch64-unknown-linux-gnu/var/cache/binpkgs
python3 -m http.server 8000

# No alvo ARM64 (Raspberry Pi), em /etc/portage/binrepos.conf/local.conf:
# [local-arm64]
# priority = 100
# sync-uri = http://desktop.lan:8000/

# Depois, no Pi:
emerge --getbinpkg --ask app-editors/nano` },
      { lang: "bash", code: `# 5) Listar e remover toolchains cruzadas.
ls /usr/aarch64-unknown-linux-gnu/

# Para remover completamente:
sudo crossdev --clean aarch64-unknown-linux-gnu` },
      { lang: "bash", code: `# 6) Outras arquiteturas comuns:
sudo crossdev -t armv7a-hardfloat-linux-gnueabi --stable   # Pi 2/3, BeagleBone
sudo crossdev -t riscv64-unknown-linux-gnu --stable        # RISC-V
sudo crossdev -t i686-pc-linux-gnu --stable                # x86 32-bit legado` },
    ],
    points: [
      "crossdev gera toolchain completa: binutils, gcc, glibc e kernel-headers.",
      "Cada toolchain vive em /usr/<triple>/ e tem seu próprio Portage isolado.",
      "Use --stable para versões estáveis ou padrão para usar testing (~).",
      "Combine com binhost local para servir pacotes pré-compilados a dispositivos lentos.",
      "Triple format: <arch>-<vendor>-<sys>-<libc> (ex: aarch64-unknown-linux-gnu).",
      "Demora 30min a 2h para gerar a toolchain inicial — paciência.",
      "Armadilha comum: tentar usar gcc nativo onde precisava do gcc cruzado e gerar binário errado.",
      "Iniciante comum: esquecer de registrar o overlay em repos.conf — crossdev falha sem motivo claro.",
    ],
    alerts: [
      { type: "tip", content: "Salve binpkgs ARM64 num diretório versionado (rsync para outro servidor) e você nunca mais compila nada no Pi." },
      { type: "warning", content: "Toolchain cruzada usa muito espaço em disco (5-10GB por alvo). Tenha /usr generoso ou monte em partição separada." },
      { type: "info", content: "ABI hardfloat vs softfloat importa em ARM antigo. Pi 2+ é hardfloat (armv7a-hardfloat-linux-gnueabi); Pi 1 e BeagleBone original podem precisar softfloat." },
      { type: "danger", content: "Não use binpkgs cross-compilados em produção sem testes — diferenças sutis de glibc/kernel headers podem causar bugs sutis no alvo." },
    ],
  },
  {
    slug: "embedded-image",
    section: "projetos-apendice",
    title: "Imagens próprias com Catalyst",
    difficulty: "avancado",
    subtitle: "Construindo seu próprio stage3 ou ISO live com a ferramenta oficial dos releases do Gentoo.",
    intro: `Catalyst é a ferramenta que a Gentoo Release Engineering usa para gerar os stage3, stage4 e LiveCDs oficiais que você baixa do site. Sim, eles são reproduzíveis: você pode rodar Catalyst no seu PC e gerar um stage3 customizado para a sua arquitetura, perfil e USE flags preferidas. Para projetos embedded, kiosks, appliances ou imagens corporativas com base padrão, Catalyst é a forma 'oficial' de fazer.

A ferramenta funciona em estágios: stage1 (apenas o necessário para compilar o resto), stage2 (toolchain isolada), stage3 (sistema base completo) e stage4 (sistema com pacotes adicionais). Cada estágio gera um tarball que serve de entrada para o próximo. Para criar um LiveCD, você usa um spec especial chamado 'livecd-stage1' e 'livecd-stage2'.

Aprender Catalyst tem curva: vários YAML/spec files, dependências cruzadas e debug indireto pelos logs. Mas o resultado é poderoso: você ganha um pipeline reproduzível para gerar imagens prontas, perfeito para frota de máquinas idênticas (kiosk, edge computing, set-top boxes) ou para distribuir Gentoo customizado dentro de uma empresa. Esta visão geral te orienta para começar.`,
    codes: [
      { lang: "bash", code: `# 1) Instalar Catalyst.
sudo emerge --ask dev-util/catalyst

# Diretórios principais:
# /etc/catalyst/         configuração global
# /var/tmp/catalyst/     workspace (builds e tmp)
# /var/tmp/catalyst/builds/  resultado final` },
      { lang: "conf", code: `# /etc/catalyst/catalyst.conf — ajustes principais.
storedir="/var/tmp/catalyst"
sharedir="/usr/share/catalyst"
distdir="/var/cache/distfiles"
options="autoresume kerncache pkgcache seedcache snapcache"
jobs="\$(nproc)"
load-average="\$(nproc)"` },
      { lang: "bash", code: `# 2) Baixar uma seed (stage3 atual) que serve de ponto de partida.
mkdir -p /var/tmp/catalyst/builds/default/
cd /var/tmp/catalyst/builds/default/
wget https://distfiles.gentoo.org/releases/amd64/autobuilds/current-stage3-amd64-openrc/stage3-amd64-openrc-*.tar.xz` },
      { lang: "conf", code: `# /etc/catalyst/specs/stage3-amd64.spec — spec de um stage3 customizado.
subarch: amd64
target: stage3
version_stamp: 20240101
rel_type: default
profile: default/linux/amd64/23.0
snapshot: 20240101
source_subpath: default/stage3-amd64-openrc-20231225
portage_confdir: /etc/catalyst/portage
portage_overlay: /var/db/repos/local
update_seed: yes
update_seed_command: --update --deep --newuse @world` },
      { lang: "bash", code: `# 3) Gerar um snapshot do tree do Portage (Catalyst exige).
sudo catalyst -s 20240101

# 4) Construir o stage3 a partir do spec.
sudo catalyst -f /etc/catalyst/specs/stage3-amd64.spec

# Acompanhe os logs:
tail -f /var/tmp/catalyst/tmp/default/stage3-amd64-*/var/log/emerge.log

# Resultado final:
ls /var/tmp/catalyst/builds/default/stage3-amd64-*.tar.xz` },
      { lang: "conf", code: `# Para LiveCD, use specs livecd-stage1 e livecd-stage2.
# /etc/catalyst/specs/livecd-stage1.spec
subarch: amd64
target: livecd-stage1
version_stamp: 20240101
rel_type: default
profile: default/linux/amd64/23.0
snapshot: 20240101
source_subpath: default/stage3-amd64-openrc-20240101
livecd/use: livecd
livecd/packages: gentoo-sources nano dhcpcd networkmanager` },
      { lang: "bash", code: `# 5) Construir LiveCD em duas fases.
sudo catalyst -f /etc/catalyst/specs/livecd-stage1.spec
sudo catalyst -f /etc/catalyst/specs/livecd-stage2.spec

# ISO final fica em:
ls /var/tmp/catalyst/builds/default/livecd-amd64-*.iso` },
    ],
    points: [
      "Catalyst gera os mesmos artefatos que o site oficial publica.",
      "Use spec files (YAML simples) para descrever cada estágio.",
      "stage3 = sistema base mínimo; stage4 = base + apps; livecd = ISO bootável.",
      "Snapshots do tree são datados — Catalyst congela o estado do Portage no build.",
      "/var/tmp/catalyst precisa de muito espaço (50GB+) para builds completos.",
      "autoresume permite retomar build após erro sem refazer tudo.",
      "Armadilha comum: alterar specs no meio do build e Catalyst usar cache antigo.",
      "Iniciante comum: esquecer o snapshot ('catalyst -s') antes do build do spec.",
    ],
    alerts: [
      { type: "warning", content: "Catalyst é frágil com debug — leia logs em /var/tmp/catalyst/tmp/ atentamente. Erros bobos como permissão errada podem aparecer 30 minutos build adentro." },
      { type: "tip", content: "Para builds reproduzíveis em CI, monte /var/tmp/catalyst em tmpfs grande (32GB+) — a velocidade ganha compensa o uso de RAM." },
      { type: "info", content: "A documentação oficial em wiki.gentoo.org/wiki/Catalyst é o melhor recurso. Há specs de exemplo em /usr/share/doc/catalyst-*/examples/." },
      { type: "success", content: "Para distribuir uma 'distro Gentoo personalizada' (Funtoo, Calculate, Sabayon foram assim), Catalyst é o caminho oficial." },
    ],
  },
  {
    slug: "glossario",
    section: "projetos-apendice",
    title: "Glossário do gentooísta",
    difficulty: "intermediario",
    subtitle: "Definições curtas dos termos que mais aparecem na vida com Portage.",
    intro: `O Gentoo tem vocabulário próprio. Termos como 'ebuild', 'slot', 'profile' e 'world' aparecem em quase toda página da documentação, e quem chega de outras distros precisa de um dicionário rápido. Este glossário lista os termos mais frequentes com definições de uma a três frases — suficiente para você seguir lendo a wiki sem ficar parando.

Use este capítulo como referência. Marque os termos que ainda confundem você e revisite enquanto avança no livro. Algumas definições parecem redundantes vistas isoladamente — é normal. O sentido completo só amarra quando você começa a usar o sistema de verdade, lê notícias do Portage e resolve seu primeiro 'blocker'.

Os termos estão agrupados por área: Portage, init systems, instalação, manutenção. Não memorize tudo de uma vez. Quando você fechar o livro, espere ainda esquecer metade. Conforme usar Gentoo, a outra metade vai virar segunda natureza.`,
    codes: [
      { lang: "text", code: `# Termos do Portage (gerenciamento de pacotes)

ebuild       Receita de instalação de um pacote (.ebuild). Define versão,
             dependências, USE flags e fases de compilação. Vive em
             /var/db/repos/gentoo/<categoria>/<pacote>/.

eclass       Biblioteca compartilhada entre ebuilds, com funções comuns
             (autotools.eclass, cmake.eclass, python-r1.eclass). Reduz
             duplicação. Mora em /var/db/repos/gentoo/eclass/.

EAPI         Versão da API de ebuilds. EAPI=8 é o atual (2024). Define
             quais funções e variáveis o ebuild pode usar.

USE flag     Opção que liga ou desliga uma funcionalidade na compilação
             de um pacote (ex: USE="X gtk -qt5"). Global em make.conf,
             específica em /etc/portage/package.use.

USE_EXPAND   USE flag estruturada (VIDEO_CARDS, INPUT_DEVICES, L10N).
             Tem valores válidos limitados, expandidos em USE no build.` },
      { lang: "text", code: `# Mais termos do Portage

slot         Permite duas versões do mesmo pacote conviverem (ex: gcc:13
             e gcc:14, python:3.11 e python:3.12). Identificado por
             :número após o pacote.

mask         Bloqueio de versão. package.mask impede instalação de uma
             versão específica. ~amd64 significa testing.

keyword      Marcador de estabilidade por arquitetura. amd64 = estável,
             ~amd64 = testing, **\$arch = nunca estável.

profile      Conjunto de defaults (USE flags, masks, mounts) que definem
             o 'estilo' do sistema: desktop, server, hardened, musl, etc.
             Selecionado com 'eselect profile set'.

world        Conjunto de pacotes que VOCÊ pediu para instalar
             (/var/lib/portage/world). Diferente de @system, que é o base.

@system      Conjunto mínimo que toda instalação Gentoo precisa.
             gcc, glibc, openrc/systemd, etc. Não é editado manualmente.` },
      { lang: "text", code: `# Termos de manutenção

depclean     emerge --depclean: remove pacotes que ninguém mais depende
             nem estão em @world. Limpa o sistema.

revdep-rebuild   Encontra binários quebrados (linker error) após upgrade
                 de bibliotecas e recompila o que precisa.

news         Notícias do Portage que avisam mudanças importantes (mudança
             de profile, removal, breakage). Leia com 'eselect news read'.

dispatch-conf   Ferramenta para gerenciar arquivos de configuração que
                ficaram pendentes (._cfg0000_*) após emerge.

etc-update      Alternativa simples ao dispatch-conf, com prompt 1-5.

quickpkg     Gera binpkg de um pacote já instalado sem recompilar.
             Útil para fazer backup antes de update arriscado.

binhost      Servidor de binpkgs (.tbz2/.gpkg) que outras máquinas Gentoo
             podem consumir com --getbinpkg.

binpkg       Pacote binário pré-compilado (.tbz2 ou .gpkg moderno).
             Acelera instalação evitando recompilar.` },
      { lang: "text", code: `# Termos de init e boot

OpenRC       Init system tradicional do Gentoo, baseado em scripts shell.
             Leve, simples, dependent-tracking. /etc/init.d/, rc-update.

systemd      Init system alternativo, completo (timers, sockets, journald).
             Mais comum em outras distros. Suportado oficialmente.

runlevel     Conjunto de serviços rodando juntos. OpenRC tem boot, default,
             sysinit, shutdown, single, nonetwork.

stage3       Tarball com sistema base mínimo bootável + toolchain.
             Ponto de partida da instalação manual.

chroot       Comando que muda a raiz do sistema para outro diretório.
             Usado durante instalação para 'entrar' no novo sistema.

initramfs    Sistema de arquivos pequeno carregado pelo bootloader antes
             do root real. Necessário para LUKS, LVM, /usr separado.` },
      { lang: "text", code: `# Termos de configuração e ferramentas

eselect      Utilitário multi-módulo para escolhas: profile, kernel,
             python ativo, opengl, java-vm, news, fontconfig.

equery       Consulta sobre pacotes instalados (do gentoolkit). Mostra
             dependências, arquivos, USE flags ativadas.

eix          Busca rápida em portage tree (alternativa indexada ao
             emerge --search). app-portage/eix.

repoman      Validador de ebuilds (sintaxe, metadata, manifest). Usado
             ao escrever ebuilds próprios em overlay.

distfiles    Tarballs de código-fonte baixados pelo Portage para
             compilar. Vivem em /var/cache/distfiles.

CFLAGS       Flags de compilação C passadas ao gcc. Definidas em
             make.conf (-O2 -march=native -pipe é típico).

FEATURES     Lista de comportamentos do Portage (ccache, parallel-fetch,
             buildpkg, sandbox). Em /etc/portage/make.conf.

ricer        Apelido bem-humorado para quem usa flags exóticas (-O3
             -funroll-loops -ffast-math) para ganhar 1% e quebrar 30%.` },
    ],
    points: [
      "ebuild = receita; eclass = biblioteca de receitas; EAPI = versão da linguagem.",
      "USE flag controla features na compilação; USE_EXPAND é versão estruturada.",
      "slot permite versões do mesmo pacote convivendo (gcc:13, gcc:14).",
      "world = pacotes que VOCÊ pediu; @system = base mínimo; @world = ambos juntos.",
      "Profile define defaults (USE, mask) e estilo do sistema (desktop/server/hardened).",
      "OpenRC e systemd são suportados oficialmente; ambos têm prós/contras.",
      "Não memorize tudo — releia este glossário conforme precisar.",
      "Armadilha: tratar termo de Gentoo como sinônimo de termo do Debian/Arch — quase nunca é.",
    ],
    alerts: [
      { type: "tip", content: "Imprima este capítulo (ou um cheatsheet seu) e cole na parede. Em uma semana você não consulta mais." },
      { type: "info", content: "A wiki oficial tem um glossário ainda maior em wiki.gentoo.org/wiki/Glossary — referência canônica para termos raros." },
      { type: "warning", content: "Cuidado com 'slot' confundido com 'version'. Slot é estrutural (gcc:13), version é o número (gcc-13.2.1)." },
    ],
  },
  {
    slug: "faq",
    section: "projetos-apendice",
    title: "FAQ: perguntas frequentes de iniciantes",
    difficulty: "iniciante",
    subtitle: "Respostas curtas para as dúvidas que todo mundo tem na primeira semana de Gentoo.",
    intro: `Toda comunidade tem perguntas que se repetem. No Gentoo elas costumam girar em torno de tempo de compilação, escolhas de profile, OpenRC vs systemd, segurança e dificuldade percebida. Este FAQ junta as 12 mais comuns com respostas honestas e curtas — sem vender o Gentoo como melhor que tudo, sem desencorajar quem está chegando.

Se você está na primeira semana, vai se identificar com várias destas. Não significa que está perdido — significa que você está fazendo as perguntas certas. A regra é: leia, experimente, quebre, conserte. O Gentoo recompensa quem faz isso, não quem só lê.

Para perguntas que vão além deste FAQ, o canal IRC #gentoo na libera.chat e os fóruns em forums.gentoo.org são vivos e respondem rápido. Detalhe na próxima seção (recursos).`,
    codes: [
      { lang: "text", code: `# Pergunta 1: Quanto tempo leva para instalar o Gentoo do zero?

Numa máquina razoável (i5/Ryzen 5 + SSD), de 4 a 8 horas para
sistema base + KDE + apps. Depende do profile, USE flags e
quantos pacotes você pede. Use binhost oficial para reduzir
para 1-2 horas.

# Pergunta 2: Posso instalar Gentoo sem nunca ter usado Linux antes?

Não recomendado. Comece com Ubuntu/Mint/Fedora por algumas
semanas, aprenda terminal, gerenciamento de pacotes e edição
de configs. Depois Gentoo faz mais sentido.

# Pergunta 3: OpenRC ou systemd, qual escolher?

OpenRC é o tradicional do Gentoo, simples, leve, scripts shell.
systemd é mais comum (Arch, Fedora, Ubuntu), tem mais features
(timers, sockets, journald). Para servidor enxuto: OpenRC. Para
desktop com GNOME ou compatibilidade ampla: systemd. Os dois
funcionam bem em Gentoo.` },
      { lang: "text", code: `# Pergunta 4: Preciso saber programar para usar Gentoo?

Não. Você precisa saber LER configurações (texto, INI, simples
shell) e seguir instruções. Editar make.conf não é programar.

# Pergunta 5: Vou conseguir usar Gentoo no laptop do dia a dia?

Sim. Muita gente usa. Reserve uma noite para a instalação
inicial, escolha um profile desktop, configure o NetworkManager
e suspend/resume, e depois é uso normal. Updates levam 30min-2h
por semana se você acompanhar.

# Pergunta 6: Atualizar quebra meu sistema?

Raramente. Leia 'eselect news read' antes de cada upgrade. A
maioria das quebras vem de IGNORAR avisos. Mantenha um kernel
de backup no GRUB e tudo bem.

# Pergunta 7: Como faço para procurar um pacote?

emerge --search nome     # busca pelo nome
emerge --searchdesc nome # busca também na descrição
eix nome                 # se tiver app-portage/eix instalado` },
      { lang: "text", code: `# Pergunta 8: Posso ter pacote que não está no Portage?

Sim, de várias formas:
- Overlays externos (eselect-repository, GURU é oficial-ish)
- Criar um ebuild próprio em overlay local
- Compilar fora do Portage (./configure && make install) —
  evite, vira dor de cabeça em updates.

# Pergunta 9: Por que tem '~amd64' no make.conf de algumas pessoas?

ACCEPT_KEYWORDS="~amd64" deixa TODO o sistema em testing.
Mais novo, mais bugs. Recomendado só para usuários experientes.
Use por pacote em /etc/portage/package.accept_keywords/ para
casos pontuais.

# Pergunta 10: Posso rodar Steam e jogos no Gentoo?

Sim. Habilite ABI_X86="64 32" no profile multilib, instale
games-util/steam-launcher e games-util/lutris. Proton roda 95%
dos jogos do Steam Windows. Veja capítulo de multimídia/jogos.` },
      { lang: "text", code: `# Pergunta 11: Como volto atrás se algo dá muito errado?

- Boote no kernel anterior pelo GRUB.
- Boote em LiveCD, monte sua partição, chroot, conserte.
- Restaure binpkgs antigos (quickpkg salva preventivamente).
- LVM/btrfs/zfs snapshots permitem reverter o sistema todo.

# Pergunta 12: Vale a pena Gentoo num servidor pequeno (VPS)?

Em VPS de 1-2GB com 1 vCPU, compilar dá trabalho. Use binhost
oficial e binpkgs locais. Considere FEATURES="getbinpkg".
Alternativa: compile em casa, gere binpkgs, sirva para o VPS.
Funciona muito bem.` },
    ],
    points: [
      "Gentoo recompensa quem experimenta — não tenha medo de quebrar e consertar.",
      "Use Ubuntu/Fedora antes se nunca usou Linux.",
      "Leia 'eselect news read' antes de cada update — evita 90% dos problemas.",
      "OpenRC para enxuto, systemd para compatibilidade — ambos funcionam.",
      "Binhost oficial (2024+) reduz drasticamente tempo de instalação.",
      "Mantenha um kernel anterior no GRUB sempre — é seu plano B.",
      "Armadilha comum: ligar ~amd64 global e quebrar dependências.",
      "Iniciante comum: tentar sair do Portage (make install fora) e perder rastreabilidade.",
    ],
    alerts: [
      { type: "tip", content: "Quando uma pergunta sua não estiver aqui, pesquise 'gentoo wiki <termo>' no Google. A wiki oficial costuma ter resposta direta." },
      { type: "success", content: "A comunidade Gentoo é técnica mas geralmente paciente com perguntas bem formuladas. Mostre o que tentou antes de perguntar." },
      { type: "warning", content: "Não copie comandos da internet sem entender. 'emerge --unmerge sys-kernel/gentoo-sources' parece inocente e te deixa sem kernel." },
    ],
  },
  {
    slug: "troubleshooting-comum",
    section: "projetos-apendice",
    title: "Troubleshooting: problemas comuns e soluções",
    difficulty: "intermediario",
    subtitle: "Erros que todo gentooísta encontra cedo ou tarde — e como resolver.",
    intro: `Mesmo seguindo o handbook à risca, algo vai dar errado em algum momento. Isso não é defeito do Gentoo, é a natureza de uma distro que te dá controle: mais decisões = mais oportunidade de errar pequenas coisas. A boa notícia é que os erros são previsíveis. Quase tudo cai em uma de doze categorias.

Este capítulo lista esses doze problemas com a mensagem de erro típica, a causa raiz e a correção. Use como referência quando o sistema 'não boota', 'dá blocker', 'X não inicia'. Mantenha-o à mão na primeira leva de updates. Quando você dominar esses doze, vai resolver mais 80% dos casos sem pedir ajuda.

A única regra de troubleshooting Gentoo: leia a saída inteira do erro, não só a última linha. Portage e kernel são honestos — costumam dizer com clareza o que está faltando ou conflitando, basta você não pular as 30 linhas de contexto.`,
    codes: [
      { lang: "text", code: `# Problema 1: Kernel não boota — kernel panic logo no início.

Sintoma:
  VFS: Unable to mount root fs on unknown-block(0,0)

Causa: kernel sem driver do filesystem da raiz, ou root= errado
no GRUB, ou faltou initramfs para LUKS/LVM.

Solução:
  - Boote o kernel anterior pelo menu do GRUB.
  - Recompile o kernel garantindo built-in (não módulo) do
    sistema de arquivos da raiz (ext4/xfs/btrfs).
  - Para LUKS/LVM/cifrado, gere initramfs com dracut ou
    genkernel --initramfs.
  - Verifique 'cat /proc/cmdline' — root= deve apontar para
    a partição correta (UUID é o mais seguro).` },
      { lang: "text", code: `# Problema 2: Blocker no emerge.

Sintoma:
  [blocks B      ] <cat/pkg-X.Y ("<cat/pkg-X.Y" is blocking ...)

Causa: dois pacotes que não podem coexistir querem instalar
juntos. Frequente quando há mudança de slot ou substituição.

Solução:
  emerge --backtrack=100 -aDuN @world
  # Se persistir, leia o blocker COM CALMA. Geralmente o
  # Portage sugere remover um lado:
  emerge --unmerge cat/old-pkg
  # Ou aceitar o downgrade:
  emerge --autounmask-write cat/pkg

# Problema 3: Falha de compilação (gcc error).

Sintoma:
  *  ERROR: cat/pkg-X.Y::gentoo failed (compile phase):

Solução:
  - Veja /var/tmp/portage/cat/pkg-X.Y/temp/build.log inteiro.
  - Procure o pacote em bugs.gentoo.org — alguém já reportou.
  - Tente versão estável se estava em ~amd64.
  - Reduza CFLAGS (-O2 em vez de -O3, sem -march experimental).` },
      { lang: "text", code: `# Problema 4: 'no space left on device' durante emerge.

Causa: /var/tmp/portage cheio. Builds grandes (chromium,
firefox, libreoffice) podem precisar 20GB temporários.

Solução:
  - Monte /var/tmp/portage em tmpfs maior ou outro disco.
  - Em /etc/portage/make.conf:
    PORTAGE_TMPDIR="/disco-grande/portage-tmp"

# Problema 5: X não inicia — tela preta ou volta ao tty.

Sintoma:
  /var/log/Xorg.0.log mostra 'no screens found'.

Solução:
  - Confirme VIDEO_CARDS no make.conf (intel? amdgpu? nvidia?).
  - Reemerge mesa: emerge --ask --oneshot media-libs/mesa
  - Para NVIDIA proprietário, recompile o módulo após
    upgrade de kernel: emerge @module-rebuild

# Problema 6: NetworkManager não conecta WiFi.

Solução:
  - rc-service NetworkManager status — está rodando?
  - Verifique firmware: emerge --ask sys-kernel/linux-firmware
  - Veja journalctl ou /var/log/messages para erros do driver.` },
      { lang: "text", code: `# Problema 7: 'Could not find satisfying ebuild' (slot conflict).

Causa: dependência exige uma versão de slot que não existe
ou está mascarada.

Solução:
  emerge --autounmask-write -aDuN @world
  etc-update     # aceita as mudanças de mask sugeridas
  emerge -aDuN @world

# Problema 8: GRUB não vê o Gentoo após instalar Windows.

Causa: Windows sobrescreve a EFI ou MBR.

Solução:
  - Boote LiveCD, chroot no Gentoo, rode:
    grub-install --target=x86_64-efi --efi-directory=/boot/efi
    grub-mkconfig -o /boot/grub/grub.cfg

# Problema 9: 'preserved-libs' aparece no fim do emerge.

Causa: bibliotecas antigas mantidas porque algo ainda depende.

Solução:
  emerge @preserved-rebuild
  # Se travar, tente:
  revdep-rebuild
  # E para garantir:
  emerge --depclean` },
      { lang: "text", code: `# Problema 10: Áudio não funciona após upgrade do PipeWire.

Solução:
  - Verifique se o usuário está nos grupos audio e pipewire.
  - rc-service pipewire status
  - Para usuário: systemctl --user start pipewire wireplumber
    (no systemd) ou XDG autostart (no OpenRC).
  - alsamixer — verifique se não está mudo (M).

# Problema 11: 'Manifest indicates that ... is corrupt'.

Causa: download corrompido ou mirror desatualizado.

Solução:
  rm /var/cache/distfiles/<arquivo-suspeito>
  emerge --sync
  emerge --ask <pacote>

# Problema 12: System lento após emerge -auDN @world.

Causas comuns:
  - swap em SSD lento ou microSD.
  - kernel novo sem driver de GPU correto.
  - serviço novo (rc-update mostra) consumindo CPU.

Solução:
  htop / iotop — encontre o vilão.
  rc-update show — desabilite serviços desnecessários.
  Considere voltar para o kernel anterior temporariamente.` },
    ],
    points: [
      "Sempre leia a saída INTEIRA do erro — Portage costuma dizer a solução.",
      "Mantenha kernel anterior no GRUB para boot de emergência.",
      "build.log em /var/tmp/portage/<pkg>/temp/ é seu melhor amigo.",
      "bugs.gentoo.org costuma ter o seu erro reportado por alguém.",
      "@module-rebuild e @preserved-rebuild resolvem 'libs antigas'.",
      "Use --backtrack=100 para Portage tentar mais alternativas.",
      "Armadilha comum: rodar --autounmask-write sem revisar com etc-update.",
      "Iniciante comum: pular a leitura do news antes de update e quebrar.",
    ],
    alerts: [
      { type: "tip", content: "Faça 'quickpkg --include-config=y \\$(qlist -IC | head -50)' antes de updates grandes. Te dá binpkgs prontos para reverter rapidamente." },
      { type: "warning", content: "Nunca rode 'rm -rf /var/db/pkg/' achando que vai limpar — isso destrói o registro do Portage e te deixa sem rastreabilidade." },
      { type: "danger", content: "Se o sistema não boota e você não tem kernel backup, precisará de LiveCD + chroot. Não tente reparar boot com sistema rodando em emergency shell sem entender o que está fazendo." },
      { type: "success", content: "Quando resolver, anote em algum lugar (Markdown, wiki pessoal). Em 6 meses você vai esquecer e vai agradecer ao 'você do passado'." },
    ],
  },
  {
    slug: "recursos",
    section: "projetos-apendice",
    title: "Recursos: onde aprender mais sobre Gentoo",
    difficulty: "iniciante",
    subtitle: "Wiki, fóruns, IRC, podcasts e livros para continuar a jornada.",
    intro: `Este livro cobre o essencial para você sair do zero ao ponto de manter um sistema Gentoo com confiança. Mas Gentoo é vasto: arquiteturas exóticas, eclasses específicas, técnicas avançadas de overlay, kernel surgery. Para o que vier depois, há uma rede rica de recursos oficiais e comunitários.

A documentação oficial em wiki.gentoo.org é simplesmente uma das melhores wikis técnicas que existem em qualquer distro. Manuais, handbooks por arquitetura, página por pacote relevante, troubleshooting. Antes de perguntar em qualquer canal, o reflexo deve ser pesquisar lá.

Para perguntas pessoais, o IRC #gentoo na libera.chat e os fóruns em forums.gentoo.org são onde a comunidade se reúne. Há também blogs (Gentoo Planet), podcast oficial, vídeos no YouTube e listas de mensagens. Use múltiplas fontes — cada uma cobre um nicho.`,
    codes: [
      { lang: "text", code: `# Documentação oficial
# https://wiki.gentoo.org/

- Handbook por arquitetura (amd64, arm64, ppc64, riscv, x86)
- Páginas por pacote (Wiki:Firefox, Wiki:NVIDIA, etc.)
- HOWTOs de tópicos específicos (LUKS, ZFS, BtrfsSubvolumes)
- Glossary, GLEPs (Gentoo Linux Enhancement Proposals)

# Fóruns
# https://forums.gentoo.org/

- Categorias por tópico (Installing, Networking, Desktop)
- Pesquise antes de postar — quase sempre alguém já perguntou.
- Em português: subforum 'Portuguese' ativo.` },
      { lang: "text", code: `# IRC (chat ao vivo) — libera.chat
# Cliente recomendado: irssi, weechat, hexchat ou matrix bridge.

#gentoo          ajuda geral
#gentoo-portage  dúvidas de Portage avançado
#gentoo-dev      desenvolvimento (não suporte de usuário)
#gentoo-server   foco em servidores
#gentoo-pt       comunidade lusófona

# Etiqueta IRC:
- Pergunte direto, mostre o erro com pastebin (não cole 50
  linhas no canal).
- Tenha paciência — respostas vêm em minutos a horas.
- Não pergunte se pode perguntar; pergunte.` },
      { lang: "text", code: `# Bug tracker
# https://bugs.gentoo.org/

- Pesquise antes de abrir bug novo.
- Use template oficial e inclua emerge --info.
- Mantenedores respondem (geralmente em dias).

# Listas de mensagens
# https://www.gentoo.org/get-involved/mailing-lists/

gentoo-user        suporte geral por email
gentoo-announce    anúncios oficiais (assine!)
gentoo-dev         desenvolvimento
gentoo-amd64       específica de arquitetura

# Gentoo Planet
# https://planet.gentoo.org/

Agregador de blogs de devs e usuários ativos. Bom para pegar
discussões técnicas e novidades.` },
      { lang: "text", code: `# Podcast e mídia
# https://www.gentoo.org/news/      notícias oficiais

- 'Gentoo Wiki' tem páginas de news arquivadas.
- Canais YouTube com tutoriais Gentoo:
  - Gardiner Bryant (uso real de Gentoo)
  - DistroTube (compara distros incluindo Gentoo)
  - Mental Outlaw (instalação Gentoo passo a passo)

# Twitch / streams ao vivo
- Vários devs Gentoo fazem streams ocasionais de
  recompilação, debugging, ebuild writing.` },
      { lang: "text", code: `# Livros e referências de longo prazo

- 'Gentoo Handbook' (livre, em wiki.gentoo.org/wiki/Handbook)
  Referência oficial. Traduzido para vários idiomas.

- 'The Linux Programming Interface' (Michael Kerrisk)
  Não é específico do Gentoo, mas essencial para quem mexe
  com kernel, /proc, syscalls.

- 'How Linux Works' (Brian Ward)
  Para entender o que está por baixo do que o Gentoo te
  obriga a configurar.

- 'UNIX and Linux System Administration Handbook'
  Bíblia para quem administra sistemas UNIX-like.` },
      { lang: "text", code: `# Guias práticos e overlays
# https://wiki.gentoo.org/wiki/Project:GURU

GURU é o overlay oficial de usuários — ebuilds modernos que
ainda não foram aceitos no tree principal. Contribuir para o
GURU é o caminho recomendado para virar dev Gentoo.

# Repositórios Git oficiais
# https://gitweb.gentoo.org/

- repo/gentoo.git — o tree oficial.
- repo/proj/* — projetos específicos (catalyst, prefix, etc).` },
    ],
    points: [
      "wiki.gentoo.org é a primeira fonte de verdade sobre Gentoo.",
      "forums.gentoo.org tem subforum em português ativo.",
      "IRC #gentoo na libera.chat para ajuda em tempo real.",
      "bugs.gentoo.org para reportar/pesquisar bugs reais.",
      "GURU é o overlay-laboratório da comunidade — ótimo lugar para começar a contribuir.",
      "Assine gentoo-announce — avisos de segurança e mudanças importantes.",
      "Armadilha comum: copiar comandos de blogs antigos (pré-2020) com info desatualizada.",
      "Iniciante comum: perguntar antes de pesquisar — sempre pesquise primeiro.",
    ],
    alerts: [
      { type: "tip", content: "Sempre filtre buscas por data nos últimos 2 anos. Conteúdo Gentoo de 2015 pode estar bem fora de fase com Portage atual." },
      { type: "success", content: "A comunidade Gentoo é uma das mais técnicas e abertas do mundo Linux. Devs respondem bugs com seriedade. Aproveite." },
      { type: "info", content: "Se quiser financiar a Gentoo Foundation, ela é registrada como 501(c)(3) nos EUA e aceita doações. Detalhes em foundation.gentoo.org." },
    ],
  },
  {
    slug: "comunidade",
    section: "projetos-apendice",
    title: "Comunidade: como participar e contribuir",
    difficulty: "iniciante",
    subtitle: "Conduta, Council, GLEPs e formas de contribuir além de só usar.",
    intro: `Gentoo é mantido por voluntários. Não há empresa por trás, não há funcionários, não há acionistas pedindo lucro. Isso muda tudo: as decisões são tomadas em público, há uma estrutura democrática (Council eleito), e qualquer usuário pode virar contribuidor com persistência. Conhecer essa estrutura te dá tanto perspectiva sobre como o projeto funciona quanto caminhos para participar.

A Gentoo Foundation é a entidade legal (501(c)(3) nos EUA) que cuida de finanças, marca registrada e infraestrutura. Já o Gentoo Council é eleito anualmente entre os devs e decide questões técnicas amplas. Para mudanças estruturais (mudança de profile, EAPI novo, política de keywords), existem os GLEPs — propostas formais semelhantes aos PEP do Python ou RFC da IETF.

Contribuir não exige saber escrever código C ou ser sysadmin sênior. Tradução de docs, melhorias na wiki, abrir bugs bem documentados, manter um overlay (GURU é o caminho oficial), responder dúvidas no IRC ou nos fóruns — tudo conta. Esta seção mostra como entrar.`,
    codes: [
      { lang: "text", code: `# Estrutura do projeto
# https://www.gentoo.org/get-involved/

Gentoo Foundation
   Entidade legal 501(c)(3). Cuida de doações, marca,
   contratos e infraestrutura. Trustees são eleitos.

Gentoo Council
   7 devs eleitos anualmente. Decide questões técnicas
   amplas (EAPI, profiles, política).

Projects
   Subgrupos por área (Catalyst, Prefix, Hardened, KDE,
   GNOME, Embedded). Cada um com lead.

Developers
   ~150 ativos. Mantêm pacotes e infraestrutura.

Proxy maintainers
   Usuários que mantêm pacotes via dev sponsor. Caminho
   comum para virar dev oficial depois.` },
      { lang: "text", code: `# Código de Conduta
# https://wiki.gentoo.org/wiki/Project:Council/Code_of_conduct

Resumo:
- Trate todos com respeito.
- Foco técnico; sem ataques pessoais.
- Sem assédio, discriminação ou conduta hostil.
- Conflitos vão para os mediadores do projeto.

Aplica-se em IRC, fóruns, listas, Wiki e bugzilla.
Violações sérias resultam em suspensão.` },
      { lang: "text", code: `# Como contribuir SEM ser dev oficial

1. Documentação na Wiki:
   Crie conta em wiki.gentoo.org, edite páginas com
   correções, exemplos novos, traduções.

2. Reportar bugs bem documentados:
   bugs.gentoo.org, com 'emerge --info' e build.log
   anexado. Reduz trabalho do mantenedor.

3. Manter overlay no GURU:
   github.com/gentoo/guru — proxy maintenance, qualquer
   pessoa pode contribuir ebuilds.

4. Traduzir docs:
   Handbook tem versões em vários idiomas — sempre
   precisa de revisão. PT-BR é mantida ativa.

5. Responder no IRC e fóruns:
   Sua experiência ajuda o próximo iniciante.` },
      { lang: "text", code: `# Como virar dev Gentoo oficial

1. Mantenha pacotes no GURU como proxy maintainer por
   alguns meses. Mostre consistência.

2. Encontre um dev mentor. Comece a sumir bugs e enviar
   patches no bugzilla.

3. Faça o quiz oficial (devmanual + recruiting).
   https://wiki.gentoo.org/wiki/Project:Recruiters

4. Aprovação técnica + entrevista com o time de
   Recrutamento.

5. Acesso a infra (Bugzilla dev, Git push, mailing list
   internal). Identidade @gentoo.org.

Tempo médio do começo até virar dev: 6 meses a 2 anos.` },
      { lang: "text", code: `# GLEPs — Gentoo Linux Enhancement Proposals
# https://www.gentoo.org/glep/

Documentos formais propondo mudanças. Numerados,
discutidos em mailing list, aprovados/rejeitados pelo
Council.

Exemplos importantes:
- GLEP 81: User and group management
- GLEP 74: Full-tree verification using Manifest2
- GLEP 73: Package dependencies for SAT solver

Ler GLEPs te dá visão de como o Gentoo evolui em decisões
estratégicas. Ótimo para entender o 'porquê' de muita
coisa estranha no Portage.` },
      { lang: "text", code: `# Eventos e encontros

- Gentoo Miniconf (anual, geralmente colado a outros
  eventos como FOSDEM, OSCon, Linux Conf AU).
- FOSDEM (Bruxelas, fevereiro) — sempre tem talks
  Gentoo.
- DevRoom periódica em conferências regionais.
- Encontros locais: confira meetup.com com 'Gentoo' +
  sua cidade.

Brasil tem comunidade ativa em SP, Rio e Floripa, com
encontros esporádicos divulgados no fórum PT-BR.` },
    ],
    points: [
      "Gentoo é 100% voluntário, sem empresa controladora.",
      "Council é eleito anualmente; estrutura democrática.",
      "GLEPs são propostas formais para mudanças estruturais.",
      "Contribuir não exige ser dev — wiki, bugs e IRC contam.",
      "GURU é o caminho mais simples para começar a manter ebuilds.",
      "Código de Conduta vale para todos os canais oficiais.",
      "Armadilha comum: chegar no IRC com tom 'me ajude AGORA' e ser ignorado.",
      "Iniciante comum: confundir #gentoo (suporte) com #gentoo-dev (desenvolvimento).",
    ],
    alerts: [
      { type: "success", content: "Quem mantém um overlay público por 6 meses já contribui mais para o Gentoo do que 99% dos usuários. Não é tão difícil quanto parece." },
      { type: "info", content: "Toda decisão do Council é pública nas atas em wiki.gentoo.org/wiki/Project:Council. Transparência total." },
      { type: "tip", content: "Comece editando uma página da wiki que você sentiu que estava confusa. É o passo zero da contribuição e ensina muito." },
    ],
  },
  {
    slug: "bug-reports",
    section: "projetos-apendice",
    title: "Reportando bugs como gente grande",
    difficulty: "intermediario",
    subtitle: "Anatomia de um bug report útil em bugs.gentoo.org.",
    intro: `Reportar bugs é um dos atos mais úteis que um usuário pode fazer por uma distro. Sem reports, o mantenedor não sabe que algo quebrou no seu hardware específico, na sua combinação de USE flags, no seu kernel customizado. Mas um bug mal reportado dá quase tanto trabalho ao maintainer quanto resolver — e não raro acaba fechado como 'NEEDINFO' depois de semanas.

Bugs bem reportados, ao contrário, são amados. Têm diagnóstico parcial, log limpo, passos para reproduzir, ambiente claro. O maintainer abre, lê 30 segundos, identifica a causa e fecha em horas. Você quer estar do lado dos amados — tanto pelo bem do projeto quanto porque seu bug será priorizado.

Este capítulo descreve a anatomia de um bug report ideal no bugs.gentoo.org: título descritivo, ambiente via 'emerge --info', build.log anexado, passos exatos para reproduzir, e o que você já tentou. Em 10 minutos a mais investidos, seu report passa de NEEDINFO a RESOLVED.`,
    codes: [
      { lang: "bash", code: `# 1) Antes de reportar — VERIFIQUE se já não existe.
# Pesquise em bugs.gentoo.org com:
#   - nome do pacote
#   - mensagem de erro chave
#   - número da versão

# Sempre cheque também:
emerge --search affected-pkg
glsa-check -l affected   # security advisories` },
      { lang: "bash", code: `# 2) Colete informações do ambiente. Anexe ao bug.
emerge --info > /tmp/emerge-info.txt
emerge --info app-editors/vim > /tmp/pkg-info.txt   # ou o pacote do bug

# Quem é seu mantenedor?
equery meta app-editors/vim
# OU veja em metadata.xml do pacote.` },
      { lang: "bash", code: `# 3) Pegue o build.log inteiro (não só a última linha).
ls /var/tmp/portage/<categoria>/<pacote>-<versao>/temp/
# Arquivos chave:
#   build.log         (compilação)
#   environment       (variáveis no momento do build)
#   die.env           (estado quando deu die)

# Comprima e anexe:
tar czf /tmp/bug-vim.tar.gz \\
  /var/tmp/portage/app-editors/vim-9.1.0/temp/build.log \\
  /var/tmp/portage/app-editors/vim-9.1.0/temp/environment` },
      { lang: "text", code: `# 4) ANATOMIA de um bug report ótimo
# (preencha em bugs.gentoo.org → File a bug)

Title:
  app-editors/vim-9.1.0 fails compile with USE="ruby"
  on amd64 (undefined reference to Init_DL)

Component:
  Application (deixe o assistente sugerir)

Description:
  When emerging app-editors/vim-9.1.0 with USE="ruby",
  compilation fails at the linking stage with:

      undefined reference to 'Init_DL'

  Steps to reproduce:
    1. echo 'app-editors/vim ruby' >> /etc/portage/package.use/local
    2. emerge --ask =app-editors/vim-9.1.0

  Expected: clean build.
  Actual:   linker error (full log attached).

  System:
    - Profile: default/linux/amd64/23.0/desktop/plasma
    - Init: openrc
    - Ruby: dev-lang/ruby-3.2.2 (slot 3.2)
    - GCC: 13.2.1

  Workaround tried:
    - USE="-ruby" → builds OK
    - Older ruby:3.1 → builds OK with vim-9.1.0

  Attachments:
    - build.log (full)
    - emerge --info
    - vim-9.1.0 environment` },
      { lang: "text", code: `# 5) Severidade — escolha com cautela.
trivial    erro de digitação na docs
minor      uso incômodo, com workaround
normal     bug funcional sem perda de dados (padrão)
major      perda de funcionalidade significativa
critical   sistema/dados em risco, falha catastrófica
blocker    impede o release/CI

Não infle severidade — nada irrita mais o maintainer.` },
      { lang: "bash", code: `# 6) Acompanhe o bug.
# - Adicione-se ao CC para ser notificado.
# - Responda perguntas do maintainer rápido.
# - Quando resolver, marque RESOLVED FIXED ou comente
#   se ainda persiste.

# Boas práticas:
# - Não 'bumpe' ('any update?') antes de 2 semanas.
# - Não abra duplicatas — anexe-se à existente.
# - Agradeça quando fecharem; é cultura.` },
    ],
    points: [
      "Pesquise antes de abrir — duplicatas são fechadas e te queimam karma.",
      "Anexe build.log INTEIRO, não só a última linha.",
      "emerge --info é mandatório — nunca esqueça.",
      "Título descritivo: <categoria/pkg-versão> + 1 linha do erro.",
      "Inclua passos para reproduzir, mesmo que pareçam óbvios.",
      "Mencione workarounds que você já tentou.",
      "Armadilha comum: severidade 'critical' para bug menor — mantenedor desconsidera.",
      "Iniciante comum: pedir update no bug a cada 2 dias — espere semanas.",
    ],
    alerts: [
      { type: "tip", content: "Use 'pastebin' (ix.io, dpaste.com, bpaste.net) para anexos grandes em vez de colar logs gigantes no campo de descrição." },
      { type: "success", content: "Maintainers Gentoo são geralmente rápidos quando o bug está bem feito. Bugs ruins ficam meses parados; bugs bons fecham em horas." },
      { type: "warning", content: "Não copie informações sensíveis (senhas, tokens, IPs internos) em logs anexados. Bugs são públicos." },
      { type: "info", content: "Para bugs de SECURITY, há a categoria especial 'Vulnerabilities'. Relate vulnerabilidades reais ali (recebem prioridade alta e tratamento confidencial inicial)." },
    ],
  },
  {
    slug: "proximos-passos",
    section: "projetos-apendice",
    title: "Próximos passos: a estrada continua",
    difficulty: "iniciante",
    subtitle: "Encerrando o livro com sugestões para você crescer como gentooísta.",
    intro: `Se você chegou até aqui, fez algo que poucos fazem: leu um livro técnico inteiro sobre uma distro Linux que tem fama (injusta) de ser inacessível. Você não é mais 'iniciante em Gentoo'. Você instalou, compilou, errou, consertou e entendeu por que cada peça do sistema está onde está. Isso te coloca na frente de muita gente que usa Linux há anos sem nunca ter olhado o que tem dentro.

Gentoo não é uma 'fase' do Linux — é uma forma de pensar. Mesmo se você um dia voltar para Ubuntu ou trocar para macOS, vai carregar o jeito Gentoo de tomar decisões: pesar trade-offs, ler código fonte sem medo, montar o sistema do seu jeito. É um conjunto de habilidades transferíveis que vão te servir em qualquer carreira ligada a software ou infraestrutura.

A pergunta agora é: e depois? Tem várias direções possíveis. Manter um overlay próprio. Aprender Catalyst e gerar imagens customizadas. Virar proxy maintainer no GURU. Contribuir com a wiki em PT-BR (precisa muito de mãos). Aplicar Gentoo num servidor de verdade. Aprender a escrever ebuilds de zero. Cada caminho aprofunda algo diferente. Esta seção dá pistas para escolher.`,
    codes: [
      { lang: "text", code: `# Caminho 1: ESPECIALIZAÇÃO TÉCNICA

- Aprender a escrever ebuilds do zero.
- Ler devmanual.gentoo.org de cabo a rabo.
- Manter um overlay próprio em GitHub público.
- Submeter PRs para GURU.
- Estudar eclasses (autotools, cmake, python-r1).

Em 6-12 meses você está apto a virar proxy maintainer.` },
      { lang: "text", code: `# Caminho 2: SYSADMIN PROFISSIONAL

- Aplicar Gentoo num VPS/server real (low-traffic primeiro).
- Estudar hardened profile a fundo.
- Configurar CI/CD com binhost e binpkgs.
- Aprender Ansible/Salt para automatizar configuração.
- Migrar serviços críticos com confiança.

Gentoo em produção te diferencia muito no mercado de
DevOps/SRE.` },
      { lang: "text", code: `# Caminho 3: EMBEDDED E HARDWARE

- Crossdev para ARM, RISC-V, MIPS.
- Catalyst para gerar imagens reproduzíveis.
- Gentoo no Raspberry Pi como server caseiro.
- LFS (Linux From Scratch) como complemento educacional.
- BeagleBone, Pine64 e SBCs alternativos.

Quem domina isso vai para empresas de IoT, automotivo,
edge computing.` },
      { lang: "text", code: `# Caminho 4: COMUNIDADE E CONTRIBUIÇÃO

- Editar e expandir wiki.gentoo.org/PT-BR.
- Responder no fórum e IRC.
- Reportar bugs bem-feitos.
- Apresentar talk em meetup local.
- Escrever blog técnico documentando suas resoluções.

Você se torna recurso para outros, e isso volta em
oportunidades.` },
      { lang: "text", code: `# Caminho 5: APROFUNDAR EM LINUX EM GERAL

- Estudar 'The Linux Programming Interface' (Kerrisk).
- Compilar kernel customizado (sem genkernel).
- Mergulhar em systemd (mesmo se preferir OpenRC).
- Aprender BPF, cgroups v2, namespaces a fundo.
- Contribuir com upstream (kernel, glibc, gcc).

Gentoo te deu base — agora vá além da própria distro.` },
      { lang: "text", code: `# Mensagem final

Aprender Gentoo não é decorar comandos — é mudar como
você pensa sobre software. Tudo é feito de partes
escolhidas, e você pode escolher cada uma.

Quando algo der errado daqui em diante, você vai abrir
o log, ler com calma, encontrar a peça defeituosa e
trocar. Não vai mais acreditar em mágica.

Bem-vindo à família dos que entendem por que o Gentoo
chama o pinguim de 'penguin gentoo' e não acha estranho.

Boa sorte. Compile com calma.` },
    ],
    points: [
      "Você terminou o livro — isso te coloca na frente de muita gente.",
      "Gentoo é forma de pensar, não só uma distro.",
      "Escolha um caminho (ebuild, sysadmin, embedded, comunidade) e aprofunde.",
      "Manter overlay público é o passo concreto mais valioso.",
      "Wiki em PT-BR sempre precisa de mãos — barreira baixíssima de entrada.",
      "Considere virar proxy maintainer via GURU (caminho oficial para dev).",
      "Aplique Gentoo num servidor real para consolidar conhecimento.",
      "Iniciante comum: parar de aprender achando que 'já sabe'. Continue.",
    ],
    alerts: [
      { type: "success", content: "Você terminou um livro técnico de capa a capa. Isso é raro. Comemore e descanse antes de pular para a próxima jornada." },
      { type: "tip", content: "Mantenha um diário técnico (Markdown, Obsidian, Notion). Em 1 ano, vai ser seu melhor manual pessoal." },
      { type: "info", content: "A comunidade Gentoo precisa de mais lusófonos. Contribuir em PT-BR tem impacto desproporcional — pouca gente faz." },
      { type: "warning", content: "Não vire 'ricer' (CFLAGS exóticas só pra ganhar 1%). É contraproducente e a comunidade vai zoar você. Prefira clareza e estabilidade." },
    ],
  },
];
