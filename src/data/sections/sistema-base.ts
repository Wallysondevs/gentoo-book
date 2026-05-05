import type { Chapter } from "../types";

export const chapters: Chapter[] = [
  {
    slug: "fstab",
    section: "sistema-base",
    title: "/etc/fstab: o mapa de montagens do sistema",
    difficulty: "iniciante",
    subtitle: "Como o Gentoo descobre quais discos montar no boot e com quais opções.",
    intro: `Todo sistema Linux precisa de uma maneira de saber, no momento do boot, quais partições viram quais diretórios. No Gentoo essa informação mora em '/etc/fstab' (de 'file system table'), um arquivo de texto puro com uma linha por ponto de montagem. Ao contrário de distros que escondem isso atrás de um instalador gráfico, no Gentoo você cria o fstab à mão e entende cada campo. Isso é parte do espírito da distribuição.

Cada linha do fstab tem seis campos separados por espaços ou tabs: dispositivo, ponto de montagem, sistema de arquivos, opções, dump e passo de fsck. O dispositivo pode ser '/dev/sda1', mas é muito mais robusto usar 'UUID=', 'LABEL=' ou 'PARTUUID=', porque a ordem das letras (sda, sdb) muda quando você pluga um pendrive. As opções controlam coisas como leitura/escrita, atime, discard para SSD e subvolumes do Btrfs.

Neste capítulo você vai entender cada campo, ver fstabs típicos para layouts simples e avançados, aprender a evitar a 'tela preta no boot' que aparece quando se erra uma linha, e saber exatamente como testar mudanças sem reiniciar a máquina.`,
    codes: [
      { lang: "bash", code: `# Descobrir UUIDs e tipos de cada partição.
# blkid lê metadados direto do superbloco.
sudo blkid
# Saída típica:
# /dev/sda1: UUID="A1B2-C3D4" TYPE="vfat" PARTLABEL="EFI"
# /dev/sda2: UUID="9f8e..." TYPE="ext4" PARTLABEL="root"
# /dev/sda3: UUID="d4c3..." TYPE="swap"` },
      { lang: "conf", code: `# /etc/fstab — exemplo simples (EFI + root ext4 + swap).
# <fs>                                 <mountpoint> <type> <opts>                 <dump> <pass>
UUID=A1B2-C3D4                         /boot        vfat   noauto,noatime         0      2
UUID=9f8e7d6c-1234-5678-90ab-cdef01234 /            ext4   noatime,errors=remount-ro 0    1
UUID=d4c3b2a1-aaaa-bbbb-cccc-deadbeef0 none         swap   sw                     0      0
tmpfs                                  /tmp         tmpfs  defaults,size=4G,mode=1777 0  0` },
      { lang: "conf", code: `# /etc/fstab — exemplo Btrfs com subvolumes (layout @ / @home).
UUID=11111111-2222-3333-4444-555555555555  /      btrfs  noatime,compress=zstd:3,subvol=@      0 0
UUID=11111111-2222-3333-4444-555555555555  /home  btrfs  noatime,compress=zstd:3,subvol=@home  0 0
UUID=A1B2-C3D4                             /efi   vfat   noauto,noatime                        0 2` },
      { lang: "bash", code: `# Testar uma linha nova sem reiniciar:
sudo mount -a              # tenta montar tudo do fstab que ainda não está montado.
# Se reclamar, leia a mensagem com calma — ela diz a linha problemática.
findmnt --verify --verbose # validador moderno, aponta erros de sintaxe.` },
      { lang: "bash", code: `# Opções úteis para SSD (NVMe ou SATA):
# noatime    — não atualiza horário de leitura, reduz escritas.
# discard=async (ext4/btrfs) — TRIM contínuo assíncrono.
# Alternativa preferida hoje: ativar o timer fstrim em vez de discard.
sudo systemctl enable --now fstrim.timer    # systemd
sudo rc-update add fstrim default            # OpenRC (pacote sys-apps/util-linux)` },
    ],
    points: [
      "Os 6 campos são: dispositivo, ponto, fs, opções, dump, fsck-pass.",
      "Sempre prefira UUID= ou LABEL= a /dev/sdaN — a numeração muda.",
      "O campo fsck (último) deve ser 1 para a raiz e 2 para outras partições; 0 desativa.",
      "noatime é praticamente padrão hoje, reduz escritas em SSD sem efeito visível.",
      "Btrfs exige a opção subvol= se você usa subvolumes (@ / @home).",
      "tmpfs em /tmp acelera tudo e limpa no reboot — útil em desktops.",
      "Armadilha comum: salvar fstab com erro e reiniciar — boot trava em emergency shell.",
      "Iniciante comum: esquecer 'sw' no campo de opções da swap, ou não rodar 'swapon -a'.",
    ],
    alerts: [
      { type: "danger", content: "Erro de digitação em /etc/fstab pode deixar o sistema sem boot. SEMPRE rode 'sudo mount -a' e 'sudo findmnt --verify' antes de reiniciar." },
      { type: "tip", content: "Para gerar fstab automaticamente a partir do que está montado, use 'genfstab' (do Arch) ou simplesmente copie a saída de 'findmnt --real -o SOURCE,TARGET,FSTYPE,OPTIONS' e adapte." },
      { type: "info", content: "O /boot e /efi geralmente vêm com 'noauto' para evitar montagem permanente; quem precisa monta sob demanda no momento de atualizar o kernel." },
      { type: "warning", content: "Não use a opção 'discard' síncrono em SSDs antigos ou em LUKS — pode causar perda de performance ou vazar metadados. Prefira fstrim periódico." },
    ],
  },
  {
    slug: "hostname-network",
    section: "sistema-base",
    title: "Hostname e identidade de rede",
    difficulty: "iniciante",
    subtitle: "Como definir o nome da máquina no Gentoo, em OpenRC e systemd.",
    intro: `O hostname é o nome curto que identifica sua máquina na rede e nos prompts do shell ('ana@notebook'). Definir certinho é uma das primeiras tarefas após instalar o Gentoo, e o caminho muda dependendo do init system que você escolheu. No OpenRC clássico, o nome vem do arquivo '/etc/conf.d/hostname'. No systemd, o arquivo canônico é '/etc/hostname' e o comando 'hostnamectl' faz o resto.

A confusão comum é que existem três 'nomes': o hostname (curto), o domínio e o FQDN ('fully qualified domain name', algo como 'notebook.casa.lan'). Para máquinas sem domínio, o FQDN é o próprio hostname. A resolução desses nomes na própria máquina passa por '/etc/hosts', e é normal incluir uma linha mapeando o hostname para 127.0.0.1 ou para o IP real, evitando avisos de programas como sudo e Postfix.

Neste capítulo você define o hostname das duas formas, ajusta '/etc/hosts', e descobre como diagnosticar problemas comuns (hostname errado depois do reboot, DNS reverso falhando, sudo demorando 5 segundos).`,
    codes: [
      { lang: "bash", code: `# Ver o hostname atual:
hostname              # nome curto
hostname -f           # FQDN (se configurado)
cat /proc/sys/kernel/hostname` },
      { lang: "conf", code: `# OpenRC: /etc/conf.d/hostname
# A variável é literalmente 'hostname'.
hostname="notebook"

# Aplicar imediatamente sem reboot:
# sudo /etc/init.d/hostname restart` },
      { lang: "conf", code: `# systemd: /etc/hostname (apenas o nome, uma linha).
notebook

# Forma recomendada de alterar: hostnamectl.
# sudo hostnamectl set-hostname notebook
# sudo hostnamectl set-hostname "Notebook da Ana" --pretty` },
      { lang: "conf", code: `# /etc/hosts — mapa local de nomes.
# Sempre inclua uma linha para o seu hostname para evitar atrasos.
127.0.0.1   localhost
::1         localhost
127.0.1.1   notebook.casa.lan notebook` },
      { lang: "bash", code: `# OpenRC: configurar nome de domínio (opcional).
# /etc/conf.d/net  ou  /etc/resolv.conf  podem definir search.
echo 'search casa.lan' | sudo tee -a /etc/resolv.conf
# Teste:
getent hosts notebook
ping -c1 notebook` },
    ],
    points: [
      "OpenRC usa /etc/conf.d/hostname com a variável hostname=\"...\".",
      "systemd usa /etc/hostname (apenas o nome) e o comando hostnamectl.",
      "FQDN = hostname + domínio; se não houver domínio, é só o hostname.",
      "Sempre adicione o seu hostname em /etc/hosts apontando para 127.0.1.1.",
      "Mudou o hostname? Faça logout/login para o prompt refletir.",
      "Armadilha: sudo demora ~5s porque não consegue resolver o próprio hostname.",
      "Iniciante comum: definir o hostname só com 'hostname novo' sem persistir em arquivo.",
      "Use letras minúsculas, sem acento, sem espaço — alguns servidores rejeitam o resto.",
    ],
    alerts: [
      { type: "tip", content: "Para escolher o init: 'sys-apps/openrc' já vem no stage3 OpenRC, e 'sys-apps/systemd' é instalado automaticamente no stage3 systemd. Os arquivos de hostname diferem, mas /etc/hosts é igual nos dois mundos." },
      { type: "warning", content: "Trocar o hostname enquanto serviços (Postfix, MySQL, Kerberos) estão rodando pode quebrá-los temporariamente. Reinicie o serviço depois." },
      { type: "info", content: "No systemd, 'hostnamectl' aceita três tipos: --static (persistente), --transient (vindo do DHCP) e --pretty (UTF-8 com espaço, só para humanos)." },
    ],
  },
  {
    slug: "openrc-intro",
    section: "sistema-base",
    title: "OpenRC: o init tradicional do Gentoo",
    difficulty: "iniciante",
    subtitle: "Filosofia, runlevels, /etc/init.d e por que muita gente fica com OpenRC.",
    intro: `OpenRC é o sistema de inicialização padrão do Gentoo desde sempre — embora o stage3 systemd também seja oficial. A filosofia dele é simples e quase poética: um conjunto de scripts shell em '/etc/init.d/', um conjunto de configurações em '/etc/conf.d/', e a noção de 'runlevels' (níveis de execução) que agrupam quais serviços ligam em cada estado da máquina.

Os runlevels padrão são: 'sysinit' (montar /proc, /sys e udev), 'boot' (configurações de baixo nível como hostname, hwclock, fsck), 'default' (serviços normais como sshd, NetworkManager, cups) e 'shutdown' (desligar tudo de forma ordenada). Você adiciona ou remove serviços de um runlevel com 'rc-update add'/'del' e controla um serviço com 'rc-service'. Tudo é texto, tudo é shell, tudo é auditável.

Comparado ao systemd, OpenRC é menor (alguns milhares de linhas vs centenas de milhares), mais previsível, e segue o estilo Unix de fazer uma coisa só. A contrapartida é que ele não tem socket activation, timers integrados nem cgroups por padrão (é preciso configurar). Para a maioria dos desktops e servidores, OpenRC é mais que suficiente e a curva de aprendizado é literalmente ler um script shell.`,
    codes: [
      { lang: "bash", code: `# Ver todos os serviços e em quais runlevels eles estão.
rc-update -v show
# Saída resumida:
#  sshd   |        default
#  cronie |        default
#  udev   | sysinit

# Listar runlevels conhecidos:
rc-status --runlevel` },
      { lang: "bash", code: `# Adicionar um serviço ao runlevel padrão (liga no boot).
sudo rc-update add sshd default
# Remover:
sudo rc-update del sshd default
# Adicionar a outro runlevel:
sudo rc-update add ntp-client boot` },
      { lang: "bash", code: `# Controlar um serviço agora (não muda o boot).
sudo rc-service sshd start
sudo rc-service sshd status
sudo rc-service sshd stop
sudo rc-service sshd restart
# Forma curta equivalente:
sudo /etc/init.d/sshd start` },
      { lang: "conf", code: `# /etc/conf.d/sshd — configurar opções do serviço sem mexer no script.
# Exemplo: passar argumentos extras ao sshd.
SSHD_OPTS="-D"
SSHD_PIDFILE="/run/sshd.pid"

# Cada serviço em /etc/init.d/X tem um par opcional /etc/conf.d/X.` },
      { lang: "bash", code: `# Ver dependências de um serviço (quem ele precisa, quem precisa dele).
rc-service sshd ineed       # de quem ele depende
rc-service sshd needsme     # quem depende dele
rc-service sshd iuse        # dependências fracas` },
    ],
    points: [
      "Runlevels: sysinit, boot, default, shutdown — execução em ordem.",
      "Scripts ficam em /etc/init.d/, configs paralelas em /etc/conf.d/.",
      "rc-update gerencia o que entra em cada runlevel (boot ou não).",
      "rc-service controla agora (start/stop/restart/status/reload).",
      "rc-status mostra o estado atual de todos os serviços.",
      "Cada script é shell; abra com 'less /etc/init.d/sshd' e leia.",
      "Armadilha comum: adicionar serviço só com 'rc-service start' e esquecer de 'rc-update add'.",
      "Iniciante comum: editar /etc/init.d/X em vez de /etc/conf.d/X (o primeiro pode ser sobrescrito por update).",
    ],
    alerts: [
      { type: "tip", content: "Use 'rc-status -a' para ver TODOS os serviços (mesmo os não atribuídos a runlevel). Útil para debugar 'por que esse daemon não subiu?'." },
      { type: "info", content: "OpenRC suporta paralelismo de boot — defina 'rc_parallel=\"YES\"' em /etc/rc.conf para acelerar máquinas com muitos serviços." },
      { type: "warning", content: "Nunca remova 'udev' ou 'localmount' do sysinit/boot. Sem eles, o sistema não monta /dev nem as partições do fstab." },
      { type: "success", content: "OpenRC roda perfeitamente em containers, embarcados e servidores. Foi desenhado para ser pequeno, e isso facilita muito o troubleshooting." },
    ],
  },
  {
    slug: "systemd-vs-openrc",
    section: "sistema-base",
    title: "systemd vs OpenRC: comparação prática",
    difficulty: "intermediario",
    subtitle: "O que muda no dia a dia e como migrar de um para o outro no Gentoo.",
    intro: `A escolha do init system é uma das primeiras decisões reais ao montar um Gentoo, e o stage3 já vem em duas variantes: 'openrc' e 'systemd'. As duas são oficialmente suportadas, recebem updates e têm comunidade ativa. A decisão entre elas é mais filosófica e prática do que técnica: systemd traz mais bateria inclusa (timers, sockets, cgroups, journald, networkd, resolved), OpenRC entrega só o init e deixa o resto a cargo de daemons especializados.

No dia a dia, o que mais muda é o conjunto de comandos. Onde você roda 'rc-service nginx start' no OpenRC, no systemd é 'systemctl start nginx'. Onde você ativa um serviço com 'rc-update add nginx default', no systemd é 'systemctl enable nginx'. Logs no OpenRC ficam em '/var/log/' como texto simples (ou syslog), enquanto no systemd ficam em arquivos binários acessíveis via 'journalctl'.

Migrar entre os dois é possível mas não trivial: requer trocar de stage3 efetivamente, ajustar profile via 'eselect profile', recompilar pacotes-chave com USE flags diferentes (USE='systemd' ou USE='-systemd'), e refazer rede/login. Este capítulo traz a tabela de equivalências completa e um roteiro honesto para quem quer trocar.`,
    codes: [
      { lang: "text", code: `# Tabela de comandos equivalentes (OpenRC  →  systemd).
rc-service X start              →  systemctl start X
rc-service X stop               →  systemctl stop X
rc-service X restart            →  systemctl restart X
rc-service X status             →  systemctl status X
rc-update add X default         →  systemctl enable X
rc-update del X default         →  systemctl disable X
rc-status                       →  systemctl list-units --type=service
tail -f /var/log/messages       →  journalctl -f
dmesg                           →  journalctl -k
shutdown -h now / halt          →  systemctl poweroff
reboot                          →  systemctl reboot` },
      { lang: "bash", code: `# Descobrir qual init você está usando agora.
# Olha o PID 1:
ps -p 1 -o comm=
# Saída: 'systemd' OU 'init' (OpenRC).

# Ou de forma mais explícita:
readlink /sbin/init
ls -l /run/systemd/system 2>/dev/null && echo "systemd ativo"` },
      { lang: "bash", code: `# Trocar o profile para o equivalente systemd (mantendo desktop, por ex).
sudo eselect profile list | grep -i systemd
sudo eselect profile set default/linux/amd64/23.0/desktop/systemd
sudo emerge -avDN @world
# Depois você ainda precisa instalar sys-apps/systemd e reconfigurar bootloader.` },
      { lang: "bash", code: `# Logs: journalctl tem filtros poderosos.
journalctl -u nginx --since "1 hour ago"
journalctl -p err -b           # erros do boot atual
journalctl --disk-usage        # quanto espaço o journal está ocupando
# Em OpenRC, o equivalente é grep em /var/log/messages ou em logs por daemon.` },
      { lang: "conf", code: `# Exemplo de unit systemd customizada: /etc/systemd/system/meu-app.service
[Unit]
Description=Meu App
After=network.target

[Service]
ExecStart=/usr/local/bin/meu-app
Restart=on-failure
User=meuapp

[Install]
WantedBy=multi-user.target` },
    ],
    points: [
      "OpenRC: pequeno, scripts shell, dependências leves; ótimo para servidor/embedded.",
      "systemd: integrações ricas (timers, sockets, journald, networkd, logind).",
      "GNOME funciona melhor com systemd; KDE/XFCE/Sway rodam bem nos dois.",
      "elogind é o pedaço do logind extraído para uso em sistemas OpenRC (gerencia seats).",
      "journalctl é só do systemd; com OpenRC use sysklogd, syslog-ng ou rsyslog.",
      "Migrar exige trocar profile, recompilar @world e reconfigurar boot.",
      "Armadilha comum: instalar systemd sem trocar o profile — fica meia-bomba.",
      "Iniciante comum: ativar dois inits ao mesmo tempo. Escolha UM e siga.",
    ],
    alerts: [
      { type: "info", content: "USE flags 'systemd' e 'elogind' aparecem em centenas de pacotes. O profile já define o conjunto correto — sempre prefira mudar o profile a editar make.conf manualmente." },
      { type: "warning", content: "Mesmo no Gentoo systemd, OpenRC pode estar instalado por dependência. Confirme com 'ps -p 1 -o comm=' qual está realmente em uso." },
      { type: "tip", content: "Se você está em dúvida, comece com OpenRC. Ele é mais didático para entender o que acontece no boot e qualquer problema é literalmente ler um script shell." },
      { type: "danger", content: "Trocar de init em uma máquina remota sem acesso físico/console é receita para ficar sem sshd no próximo boot. Faça em VM primeiro." },
    ],
  },
  {
    slug: "services-rc-update",
    section: "sistema-base",
    title: "Gerenciando serviços no dia a dia",
    difficulty: "iniciante",
    subtitle: "rc-update, rc-service, rc-status: o tripé do administrador OpenRC.",
    intro: `Já vimos a filosofia do OpenRC. Agora vamos fixar os três comandos que você vai usar mais que qualquer outro: 'rc-update', 'rc-service' e 'rc-status'. Eles são pequenos, têm sintaxe consistente e cobrem 95% das necessidades diárias de quem opera um servidor ou desktop Gentoo.

'rc-update' decide o que liga no boot — adiciona ou remove um serviço de um runlevel. 'rc-service' age agora — start/stop/restart/status/reload em um serviço específico. 'rc-status' inspeciona o estado: o que está rodando, parado, falhou, em qual runlevel está cada coisa. Os três trabalham com os mesmos nomes de serviço (que aparecem como arquivos em '/etc/init.d/').

O capítulo cobre também os runlevels customizados (criar um runlevel 'desktop' para serviços só de GUI), a ordem de start determinada por dependências ('depend()' dentro do script init), e o pequeno mas crítico arquivo '/etc/rc.conf' que controla paralelismo, log de boot e comportamento global.`,
    codes: [
      { lang: "bash", code: `# Os três comandos essenciais — copie isto na cabeça.
sudo rc-update add nginx default       # liga no boot
sudo rc-service nginx start            # liga agora
rc-status                              # status geral
rc-status -a                           # tudo, incluindo serviços não atribuídos
rc-status --servicelist                # lista flat de serviços` },
      { lang: "bash", code: `# Ver e ajustar o runlevel atual.
rc-status -r                # runlevel atual
sudo rc default             # mudar para o runlevel default agora
sudo openrc-shutdown -r 0   # reboot agendado em 0 minutos` },
      { lang: "bash", code: `# Criar um runlevel customizado 'desktop' (acima de default).
sudo mkdir -p /etc/runlevels/desktop
sudo rc-update -u
# Adicionar serviços só desse runlevel:
sudo rc-update add display-manager desktop
sudo rc-update add cups desktop
# Mudar para ele:
sudo rc desktop` },
      { lang: "conf", code: `# /etc/rc.conf — opções globais do OpenRC.
# Paralelismo agressivo de boot:
rc_parallel="YES"

# Cores no terminal de boot:
rc_interactive="YES"

# Logger usado para os scripts init:
rc_logger="YES"
rc_log_path="/var/log/rc.log"` },
      { lang: "bash", code: `# Recarregar config sem reiniciar o serviço (quando suportado):
sudo rc-service nginx reload
# Forçar partida mesmo se uma dependência falhar:
sudo rc-service --nodeps nginx start
# Ver porque um serviço parou:
sudo rc-service nginx status
tail -f /var/log/rc.log` },
    ],
    points: [
      "rc-update controla o BOOT; rc-service controla AGORA.",
      "rc-status -a é seu raio-X: mostra tudo, falhas inclusive.",
      "Crie runlevels personalizados (gaming, server, minimal) com 'rc-update add ... <runlevel>'.",
      "/etc/rc.conf controla paralelismo, cores e logging do boot.",
      "Use 'rc-service X reload' antes de 'restart' quando possível — menos downtime.",
      "Armadilha comum: 'systemctl' simplesmente não existe em OpenRC; vai dar 'command not found'.",
      "Armadilha: serviço 'crashed' aparece como 'crashed' no rc-status; investigue com tail dos logs.",
      "Iniciante comum: alterar /etc/conf.d/X mas esquecer de fazer 'rc-service X restart' para aplicar.",
    ],
    alerts: [
      { type: "tip", content: "Para um overview rápido de todos os serviços de boot, salve este alias: alias svc='rc-status -a 2>/dev/null | column -t'. Visual muito mais limpo." },
      { type: "info", content: "OpenRC suporta supervisão básica de serviços via supervise-daemon. Para algo robusto, use s6 ou runit como suplementos." },
      { type: "warning", content: "rc-update -u (update de cache) é necessário depois de criar runlevel novo. Sem isso, o OpenRC não enxerga o diretório." },
    ],
  },
  {
    slug: "dispatch-conf",
    section: "sistema-base",
    title: "dispatch-conf: revisando configs após cada update",
    difficulty: "intermediario",
    subtitle: "O ritual de aceitar (ou rejeitar) mudanças nos arquivos de /etc.",
    intro: `Quando você roda 'emerge --update @world' e um pacote tem novas versões padrão dos arquivos de configuração em '/etc/', o Portage NÃO sobrescreve seus arquivos editados. Em vez disso, ele coloca a versão nova lado a lado, com prefixo '._cfg0000_'. Por exemplo: se você editou '/etc/ssh/sshd_config' e o openssh trouxe uma nova versão, vai aparecer '/etc/ssh/._cfg0000_sshd_config'.

Cabe a você revisar e mesclar essas mudanças. Tentar fingir que não existem é a forma mais comum de quebrar serviços depois de um update grande. As duas ferramentas oficiais para isso são 'dispatch-conf' (interativa, com diff colorido e integração opcional com o RCS para histórico) e 'etc-update' (mais simples, vai no próximo capítulo). Ambas vêm em 'sys-apps/portage' por padrão.

dispatch-conf brilha em manter um histórico via RCS de cada arquivo de '/etc/' que você modificou. Você pode aceitar a versão nova, manter a sua, ou abrir um editor para fazer um merge linha a linha. É a opção preferida em servidores onde você precisa rastrear quem mudou o quê e quando.`,
    codes: [
      { lang: "bash", code: `# Ver se há configs pendentes para revisar.
sudo find /etc -name "._cfg????_*" -print
# Saída típica:
# /etc/ssh/._cfg0000_sshd_config
# /etc/portage/._cfg0000_make.conf

# Contar:
sudo find /etc -name "._cfg????_*" | wc -l` },
      { lang: "bash", code: `# Configurar dispatch-conf antes do primeiro uso.
# Edite /etc/dispatch-conf.conf:
#   archive-dir=/etc/config-archive
#   use-rcs=yes
#   diff="diff -Nu '%s' '%s'"
#   pager="less -FX"

# Instalar RCS (recomendado para histórico):
sudo emerge --ask dev-vcs/rcs

# Criar o diretório de archive:
sudo mkdir -p /etc/config-archive` },
      { lang: "bash", code: `# Rodar a revisão interativa.
sudo dispatch-conf
# Para cada arquivo, ele mostra o diff e oferece opções:
#   u - usar a NOVA versão (substitui a sua)
#   z - apagar a NOVA, manter a sua
#   n - próximo arquivo (deixar para depois)
#   e - editar a versão NOVA antes de aceitar
#   m - merge interativo (sdiff)
#   q - sair` },
      { lang: "text", code: `# Exemplo de saída interativa:
>> Updating /etc/ssh/sshd_config
--- /etc/ssh/sshd_config        2024-01-10 12:00:00.000000000 -0300
+++ /etc/ssh/._cfg0000_sshd_config 2024-09-15 09:22:11.000000000 -0300
@@ -32,7 +32,7 @@
 #PermitRootLogin prohibit-password
-PermitRootLogin yes
+PermitRootLogin prohibit-password
 ...
>> (1 of 3) -- /etc/ssh/sshd_config
>> q quit, h help, n next, e edit-new, z zap-new, u use-new, m merge: ` },
      { lang: "bash", code: `# Histórico de mudanças de um arquivo (RCS):
sudo rlog /etc/config-archive/etc/ssh/sshd_config,v
# Ver uma versão antiga específica:
sudo co -p -r1.3 /etc/config-archive/etc/ssh/sshd_config,v` },
    ],
    points: [
      "Arquivos pendentes têm o prefixo ._cfg0000_, ._cfg0001_ etc.",
      "dispatch-conf é interativo, com diff colorido e RCS para histórico.",
      "Configure /etc/dispatch-conf.conf antes do primeiro uso (use-rcs=yes).",
      "Opções principais: u (use new), z (zap new), e (edit), m (merge).",
      "Sempre revise; nunca delete os ._cfg_ em massa sem olhar.",
      "Armadilha comum: rodar 'rm /etc/._cfg*' por preguiça e perder ajustes importantes.",
      "Iniciante comum: aceitar tudo com 'u' sem ler — pode reverter senhas e PermitRootLogin.",
      "Faça dispatch-conf depois de TODO 'emerge -auDN @world'.",
    ],
    alerts: [
      { type: "warning", content: "Aceitar a versão nova do '/etc/sudoers' ou '/etc/ssh/sshd_config' sem revisar pode te trancar fora do próprio sistema. Sempre leia o diff." },
      { type: "tip", content: "Habilite 'use-rcs=yes'. Em algumas semanas você terá um histórico precioso de todos os arquivos do /etc, datado e diffável." },
      { type: "info", content: "dispatch-conf respeita a variável CONFIG_PROTECT do Portage. Pacotes podem proteger ou desproteger diretórios específicos via CONFIG_PROTECT_MASK." },
      { type: "success", content: "Em servidores, considere automatizar um aviso pós-emerge: hook que conta arquivos ._cfg_ e te lembra. Evita acumular 200 deles." },
    ],
  },
  {
    slug: "etc-update",
    section: "sistema-base",
    title: "etc-update: a alternativa simples e direta",
    difficulty: "iniciante",
    subtitle: "Quando você quer revisar configs sem rituais de RCS.",
    intro: `'etc-update' é o irmão mais simples do dispatch-conf. Mesma missão — revisar arquivos '._cfg_' deixados pelo Portage — mas sem suporte a RCS, sem archive automático, com uma interface ainda mais minimalista. É a ferramenta padrão que você encontra em qualquer Gentoo recém-instalado, sem precisar configurar nada.

Quando você roda 'etc-update', ele lista todos os arquivos pendentes numerados, mostra um menu, e para cada arquivo oferece cinco opções: usar a nova versão, manter a sua, deletar a nova, mostrar o diff de novo, ou abrir um merge interativo com 'sdiff'. É o tipo de ferramenta 'um botão por ação', sem janelas, sem cores extras.

Para uso casual em um desktop pessoal, 'etc-update' é mais que suficiente. Para servidores onde você quer histórico, prefira 'dispatch-conf'. Os dois podem conviver na mesma máquina sem conflito; o que importa é não ignorar os arquivos '._cfg_' acumulados.`,
    codes: [
      { lang: "bash", code: `# Rodar etc-update (precisa ser root).
sudo etc-update
# Saída inicial típica:
# Scanning Configuration files...
# The following is the list of files which need updating, each
# configuration file is followed by a list of possible replacement files.
#  1) /etc/ssh/sshd_config (1)
#  2) /etc/portage/make.conf (1)
# Please select a file to edit by entering the corresponding number.` },
      { lang: "text", code: `# Menu por arquivo (após escolher um número):
# Showing differences between /etc/ssh/sshd_config and ._cfg0000_sshd_config
# ... diff aqui ...
#
# Please select from the menu below (-3 to exit, losing changes):
#  1) Replace original with update
#  2) Delete update, keeping original as is
#  3) Interactively merge original with update
#  4) Show differences again
#  5) Show differences between this update and the previous one` },
      { lang: "bash", code: `# Modo automático (CUIDADO): aceitar todos os ._cfg_ que NÃO foram modificados por você.
sudo etc-update --automode -3
# -3 = automerge: aceita versões novas só onde não há conflito real,
# mantém a sua onde há diferença substancial.
# Ainda mostra o que precisa de atenção humana.` },
      { lang: "bash", code: `# Configurar opções (igual ao dispatch-conf): /etc/etc-update.conf
# Por exemplo, mudar o pager:
# pager=\"less -FX\"
# diff_command=\"diff -Nu %file1 %file2\"

# Você pode trocar o sdiff (merge interativo) pelo vimdiff:
# eu_merger=\"vimdiff %merged %orig %new\"` },
      { lang: "bash", code: `# Sempre rode após emerge grande:
sudo emerge -auDN @world
sudo etc-update
sudo dispatch-conf       # se preferir histórico RCS
# Considere um alias:
alias up='sudo emerge -auDNv @world && sudo etc-update'` },
    ],
    points: [
      "etc-update é mais simples que dispatch-conf, sem RCS, sem archive.",
      "Cinco opções por arquivo: replace, keep, merge, show diff, show prev diff.",
      "Modo --automode -3 aceita só o que não conflita; o resto fica para você.",
      "Configurável via /etc/etc-update.conf (pager, diff, merger).",
      "Pode coexistir com dispatch-conf — escolha por arquivo se quiser.",
      "Armadilha comum: aceitar todos com '1' em sequência sem ler — perde ajustes.",
      "Iniciante comum: rodar etc-update sem sudo e ver 'permission denied' confuso.",
      "Em desktop pessoal, etc-update casual é suficiente; em servidor, prefira dispatch-conf.",
    ],
    alerts: [
      { type: "tip", content: "Crie o hábito de rodar etc-update logo após cada update grande. Acumular ._cfg_ por meses dificulta a revisão e aumenta a chance de aceitar coisa errada." },
      { type: "warning", content: "Modo --automode -5 aceita TUDO sem perguntar. Use só se souber exatamente o que está fazendo, ou em VM descartável." },
      { type: "info", content: "Tanto etc-update quanto dispatch-conf respeitam a variável CONFIG_PROTECT_MASK. Se um diretório está em MASK, ele é sobrescrito automaticamente sem perguntar." },
    ],
  },
  {
    slug: "users-groups",
    section: "sistema-base",
    title: "Usuários e grupos",
    difficulty: "iniciante",
    subtitle: "Criar contas, gerenciar grupos e entender por que isso importa no Gentoo.",
    intro: `Logo após terminar a instalação, uma das primeiras coisas a fazer é criar um usuário comum (não-root) para o uso diário. Trabalhar como root o tempo todo é uma péssima prática: um comando errado pode apagar o sistema, e qualquer programa malicioso herda poderes totais. Linux gerencia isso através de usuários e grupos, dois conceitos antigos mas muito eficazes.

Cada usuário tem um UID (número), um nome, uma home, um shell e pertence a um ou mais grupos (cada um com seu GID). Os grupos controlam permissões: o grupo 'audio' permite tocar som, 'video' permite acesso à GPU, 'plugdev' permite montar pendrives, 'wheel' habilita usar 'su' para virar root, 'portage' permite mexer com o gerenciador de pacotes. No Gentoo é especialmente importante adicionar seu usuário aos grupos certos no momento da criação — esquecer 'audio' resulta em GUI sem som.

Os comandos clássicos são 'useradd' (criar), 'usermod' (alterar), 'userdel' (remover) e 'passwd' (definir senha). Os arquivos de baixo nível são '/etc/passwd' (usuários, mundo legível mas senhas estão em /etc/shadow), '/etc/shadow' (hashes de senha, root only), '/etc/group' (grupos) e '/etc/gshadow' (senhas de grupos, raríssimo).`,
    codes: [
      { lang: "bash", code: `# Criar um usuário com home, shell bash e nos grupos certos.
sudo useradd -m -G users,wheel,audio,video,usb,cdrom,portage,plugdev -s /bin/bash ana

# Definir senha:
sudo passwd ana
# (digite a senha duas vezes)

# Conferir:
id ana
# uid=1000(ana) gid=1000(ana) groups=1000(ana),10(wheel),18(audio),...` },
      { lang: "bash", code: `# Adicionar usuário existente a um grupo extra:
sudo usermod -aG docker ana
# IMPORTANTE: -a (append). Sem -a, o usermod SUBSTITUI todos os grupos.

# Remover de um grupo (sem comando direto; reescreva todos):
sudo gpasswd -d ana docker` },
      { lang: "bash", code: `# Criar e gerenciar grupos.
sudo groupadd devs
sudo gpasswd -a ana devs    # adiciona ana ao grupo devs
sudo gpasswd -d ana devs    # remove
sudo groupdel devs          # apaga grupo

# Listar grupos do usuário atual:
groups
# Listar todos os grupos do sistema:
getent group | less` },
      { lang: "conf", code: `# Estrutura de /etc/passwd (uma linha por usuário):
# nome:senha:UID:GID:GECOS:home:shell
ana:x:1000:1000:Ana Silva:/home/ana:/bin/bash
# 'x' indica que a senha real está em /etc/shadow (hash).` },
      { lang: "bash", code: `# Trocar shell padrão de um usuário:
sudo chsh -s /bin/zsh ana
# (zsh precisa estar em /etc/shells)

# Bloquear (não apagar) uma conta:
sudo usermod -L ana       # bloqueia (! no hash)
sudo usermod -U ana       # desbloqueia

# Apagar de verdade (com home):
sudo userdel -r ana` },
    ],
    points: [
      "Sempre crie um usuário não-root para uso diário; root só para administração.",
      "Use 'useradd -m -G grupos -s /bin/bash NOME' para criar com tudo já configurado.",
      "Grupos importantes no Gentoo: wheel, audio, video, usb, plugdev, portage.",
      "'usermod -aG' (com -a) é APPEND; sem -a você reescreve todos os grupos do usuário.",
      "id, groups e getent são as ferramentas para inspecionar.",
      "Senhas reais ficam em /etc/shadow (somente root); /etc/passwd só tem 'x'.",
      "Armadilha comum: esquecer -a no usermod e tirar o usuário do grupo wheel sem querer.",
      "Iniciante comum: trabalhar como root porque é mais rápido — um rm errado e adeus sistema.",
    ],
    alerts: [
      { type: "danger", content: "NUNCA edite /etc/passwd ou /etc/shadow direto com nano/vim. Use vipw e vigr — eles travam o arquivo, validam sintaxe e evitam corromper a base de usuários." },
      { type: "tip", content: "Para um usuário acessar dispositivos USB e webcam sem sudo, ele precisa estar nos grupos 'plugdev', 'usb' e 'video'. Isso evita o famoso 'Permission denied' em apps como GStreamer." },
      { type: "info", content: "Em sistemas com elogind (OpenRC + GNOME/KDE), muitas permissões de hardware passam por seats e ACLs dinâmicas, não pelos grupos clássicos. Mas estar em audio/video ainda é um bom seguro." },
      { type: "warning", content: "Adicionar usuário ao grupo 'wheel' permite usar 'su -' para virar root. Sem 'wheel', mesmo com a senha de root, o su pode bloquear (PAM)." },
    ],
  },
  {
    slug: "sudo-doas",
    section: "sistema-base",
    title: "sudo e doas: elevando privilégios sem virar root",
    difficulty: "iniciante",
    subtitle: "Como executar comandos como root de forma controlada e auditada.",
    intro: `Trabalhar como root o tempo todo é perigoso. A solução clássica é o 'sudo' (do projeto OpenBSD originalmente, hoje universal): você loga como usuário comum e, quando precisa de poderes administrativos, prefixa o comando com 'sudo'. Ele pede sua senha (não a do root), valida regras em '/etc/sudoers' e executa. Tudo é logado em syslog/journald, com data, comando e usuário.

Existe uma alternativa minimalista chamada 'doas' (também do OpenBSD), portada para Linux como 'app-admin/doas'. Ela faz a mesma coisa que o sudo mas com 1/20 do código e config muito mais simples. Para uso pessoal, doas é uma ótima escolha. Para servidores corporativos com regras complexas (quem pode rodar o quê, em qual host, com quais argumentos), sudo é insubstituível.

No Gentoo, nenhum dos dois vem instalado por padrão — você precisa instalar e configurar. Este capítulo cobre os dois, mostra como editar a config de forma SEGURA (com 'visudo' e 'doasedit'), e como evitar a armadilha mais comum: deixar 'NOPASSWD: ALL' para o seu usuário sem perceber.`,
    codes: [
      { lang: "bash", code: `# Instalar sudo:
sudo emerge --ask app-admin/sudo

# Editar /etc/sudoers — SEMPRE use visudo (valida sintaxe antes de salvar).
sudo visudo

# Liberar o grupo wheel a usar sudo (descomente esta linha):
# %wheel ALL=(ALL:ALL) ALL` },
      { lang: "conf", code: `# /etc/sudoers — exemplos de regras úteis.
# Um usuário específico, todos os comandos:
ana ALL=(ALL:ALL) ALL

# Um grupo, todos os comandos, com senha:
%wheel ALL=(ALL:ALL) ALL

# Sem pedir senha para um comando específico (USE COM CUIDADO):
ana ALL=(root) NOPASSWD: /usr/bin/emerge --sync

# Manter variáveis de ambiente (ex: para X forwarding):
Defaults env_keep += \"DISPLAY XAUTHORITY\"` },
      { lang: "bash", code: `# Instalar doas (alternativa minimalista):
sudo emerge --ask app-admin/doas

# Configuração: /etc/doas.conf
# Sintaxe muito mais simples que sudoers.
sudo nano /etc/doas.conf` },
      { lang: "conf", code: `# /etc/doas.conf — exemplos completos.
# Permitir grupo wheel, com senha, manter variáveis úteis:
permit persist :wheel

# Sem senha para o usuário ana rodar emerge --sync:
permit nopass ana cmd emerge args --sync

# Negar explicitamente:
deny ana cmd rm

# Após editar, valide a sintaxe:
# doas -C /etc/doas.conf && echo OK` },
      { lang: "bash", code: `# Uso prático:
sudo emerge --ask vim         # estilo sudo
doas emerge --ask vim         # estilo doas (mesma coisa)

# 'persist' no doas mantém a sessão aberta por 5 minutos (igual sudo).
# Logar o que foi rodado:
sudo journalctl -u sudo -e
sudo grep doas /var/log/messages` },
    ],
    points: [
      "Nem sudo nem doas vêm instalados; escolha um e instale com emerge.",
      "Sempre edite /etc/sudoers com 'visudo'; doas com 'doas -C' para validar.",
      "Adicione %wheel ao sudoers e ponha seu usuário em wheel — padrão saudável.",
      "NOPASSWD em comandos específicos é OK; NOPASSWD: ALL é convite a desastre.",
      "doas é mais simples e leve; sudo é mais flexível e padrão de mercado.",
      "Os dois logam tudo (journalctl ou /var/log/auth.log).",
      "Armadilha comum: salvar /etc/sudoers com erro de sintaxe e ficar sem sudo até reboot.",
      "Iniciante comum: dar NOPASSWD: ALL para 'agilizar' e quebrar a segurança inteira.",
    ],
    alerts: [
      { type: "danger", content: "Editar /etc/sudoers diretamente (sem visudo) e salvar com erro de sintaxe quebra o sudo. Sempre use visudo, que valida antes de gravar." },
      { type: "tip", content: "Para sessões de admin longas, 'sudo -i' abre um shell de root limpo. Bem melhor que prefixar tudo com sudo, mas saia rapidamente quando terminar." },
      { type: "warning", content: "Nunca dê 'NOPASSWD: ALL' para usuários comuns. Se a conta for comprometida, o atacante vira root sem precisar de senha." },
      { type: "success", content: "doas com 'permit persist :wheel' é a config mínima viável e suficiente para 90% dos desktops. Três linhas e está pronto." },
    ],
  },
  {
    slug: "root-recovery",
    section: "sistema-base",
    title: "Recuperação: voltando do abismo",
    difficulty: "intermediario",
    subtitle: "Quando o sistema não dá boot, esqueci a senha do root, ou quebrei o fstab.",
    intro: `Mais cedo ou mais tarde, todo gentooísta encara aquela tela: 'kernel panic', emergency shell, ou simplesmente um cursor piscando para sempre. A boa notícia é que quase tudo é recuperável se você souber duas técnicas: bootar de uma mídia live (a mesma ISO de instalação) e fazer 'chroot' no sistema instalado. A partir do chroot, você tem um Gentoo plenamente funcional e pode consertar tudo: senha, fstab, kernel, bootloader.

A segunda técnica é o 'init=/bin/bash' como parâmetro do kernel no menu do GRUB. Isso faz o kernel pular o init normal e abrir direto um shell como root, sem pedir senha. Útil quando você esqueceu a senha do root mas o boot ainda funciona até o GRUB. A pegadinha é que o sistema sobe em modo somente leitura — você precisa remontar a raiz como rw antes de mudar a senha.

Este capítulo é uma caixa de ferramentas para emergências. Memorize os comandos básicos e mantenha um pendrive com a ISO do Gentoo (ou qualquer Linux live) sempre por perto. Vai te salvar mais vezes do que você imagina.`,
    codes: [
      { lang: "bash", code: `# Cenário 1: Boot de live ISO + chroot no sistema instalado.
# Após bootar a ISO, identifique e monte sua raiz:
lsblk                          # descobre /dev/sdaN
sudo mount /dev/sda2 /mnt/gentoo
sudo mount /dev/sda1 /mnt/gentoo/boot   # se EFI separado
sudo mount --types proc /proc /mnt/gentoo/proc
sudo mount --rbind /sys /mnt/gentoo/sys
sudo mount --make-rslave /mnt/gentoo/sys
sudo mount --rbind /dev /mnt/gentoo/dev
sudo mount --make-rslave /mnt/gentoo/dev
sudo mount --bind /run /mnt/gentoo/run
sudo cp /etc/resolv.conf /mnt/gentoo/etc/   # internet dentro do chroot
sudo chroot /mnt/gentoo /bin/bash
source /etc/profile && export PS1=\"(chroot) \\$PS1\"` },
      { lang: "bash", code: `# Dentro do chroot, conserte o que precisar:
passwd                          # nova senha de root
nano /etc/fstab                 # corrigir UUID/typo
emerge --config sys-kernel/gentoo-sources
grub-install /dev/sda
grub-mkconfig -o /boot/grub/grub.cfg
exit                            # sai do chroot
sudo umount -l /mnt/gentoo/{dev,sys,proc,run,boot,}
sudo reboot` },
      { lang: "text", code: `# Cenário 2: Esqueci a senha de root, mas GRUB funciona.
# No menu do GRUB, aperte 'e' na entrada do Gentoo.
# Encontre a linha que começa com 'linux' e adicione no final:
init=/bin/bash
# Aperte Ctrl+X para bootar.
# Você cai num shell root sem senha. AGORA:
mount -o remount,rw /
passwd
sync
mount -o remount,ro /
exec /sbin/init      # ou reboot -f` },
      { lang: "bash", code: `# Cenário 3: dracut emergency shell (initramfs falhou).
# Você cai em um prompt 'dracut:/#'. O sistema ainda nem montou /.
# Comandos úteis:
dmesg | less                   # ver últimas mensagens do kernel
ls /dev/disk/by-uuid/          # confere se o UUID do root existe
mount /dev/sda2 /sysroot       # monta manualmente
# Conserte o problema (cmdline do kernel, módulo faltando) e:
exit                            # tenta retomar o boot normal` },
      { lang: "bash", code: `# Cenário 4: Bootar kernel anterior pelo GRUB.
# No menu do GRUB, escolha 'Advanced options for Gentoo'
# e selecione um kernel mais antigo. Isso é por que NUNCA se deve
# apagar o kernel anterior antes de confirmar que o novo funciona:
ls /boot/
# vmlinuz-6.6.30-gentoo  vmlinuz-6.6.45-gentoo
# initramfs-6.6.30.img   initramfs-6.6.45.img
# Mantenha SEMPRE pelo menos dois kernels.` },
    ],
    points: [
      "Tenha um pendrive com ISO live SEMPRE acessível — é seu paraquedas.",
      "chroot completo precisa de proc + sys + dev + run + resolv.conf.",
      "init=/bin/bash no GRUB salva a senha do root sem precisar de live.",
      "Após init=/bin/bash, sempre 'mount -o remount,rw /' antes de mudar senha.",
      "dracut emergency shell entra antes do sistema; conserte cmdline e exit.",
      "Mantenha SEMPRE dois kernels em /boot — o anterior é seu plano B.",
      "Armadilha comum: rodar grub-install fora do chroot e instalar grub do live no disco.",
      "Iniciante comum: esquecer de copiar resolv.conf para /mnt/gentoo/etc — sem internet no chroot.",
    ],
    alerts: [
      { type: "danger", content: "Rodar grub-install ou grub-mkconfig FORA do chroot, no ambiente live, escreve a config errada no disco e pode tornar o sistema não-bootável de verdade." },
      { type: "tip", content: "Salve este bloco de comandos de chroot em um README pessoal (ou na nuvem). Em uma emergência você não vai querer redigitar 10 comandos de cabeça." },
      { type: "warning", content: "init=/bin/bash NÃO sobe rede, não monta swap, não inicia logs. Use SÓ para tarefa rápida (passwd, fstab) e reinicie." },
      { type: "success", content: "Recuperar um sistema 'morto' uma vez ensina mais sobre Linux do que três meses de uso normal. Não tenha medo do emergency shell — ele é seu amigo." },
    ],
  },
];
