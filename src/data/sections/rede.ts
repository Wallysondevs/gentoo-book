import type { Chapter } from "../types";

export const chapters: Chapter[] = [
  {
    slug: "netifrc-basico",
    section: "rede",
    title: "netifrc: a rede tradicional do OpenRC",
    difficulty: "iniciante",
    subtitle: "Configurando interfaces de rede do jeito clássico do Gentoo, via /etc/conf.d/net.",
    intro: `No mundo OpenRC, a forma 'oficial' de configurar rede sem instalar nada extra é o 'netifrc'. Ele é um conjunto de scripts que lê o arquivo '/etc/conf.d/net', descobre o que você quer (DHCP, IP fixo, bridge, VLAN, wifi via wpa_supplicant) e levanta cada interface chamando os utilitários certos. Onde no Debian você editaria '/etc/network/interfaces' e no Arch usaria 'systemd-networkd', no Gentoo OpenRC o ponto central é '/etc/conf.d/net'.

A peça mais peculiar do netifrc é o uso de 'symlinks' em '/etc/init.d/'. Existe um script genérico chamado 'net.lo' (loopback) que você duplica como link simbólico — 'net.eth0', 'net.wlan0', 'net.br0' — e cada link representa o serviço para aquela interface. Adicionar uma interface ao boot, então, é criar o symlink, descrever a interface no '/etc/conf.d/net' e habilitar o serviço com 'rc-update'.

Neste capítulo, você vai aprender a sintaxe do '/etc/conf.d/net' (que é shell), configurar uma interface por DHCP, depois com IP estático, registrar o serviço no runlevel 'default' e diagnosticar quando uma interface não sobe. Também veremos como descobrir o nome real da sua interface, já que o Gentoo, por padrão, usa nomes 'previsíveis' como 'enp3s0' em vez do velho 'eth0'.`,
    codes: [
      { lang: "bash", code: `# Antes de tudo, descubra os nomes das suas interfaces.
ip link show
# Saída típica:
# 1: lo: <LOOPBACK,UP,LOWER_UP> ...
# 2: enp3s0: <BROADCAST,MULTICAST,UP> ... (cabo)
# 3: wlp2s0: <BROADCAST,MULTICAST> ...    (wifi)

# O nome 'previsível' (enpXsY / wlpXsY) vem do udev/eudev moderno.` },
      { lang: "bash", code: `# Instale o netifrc se ele ainda não estiver presente
# (em stages 'desktop-openrc' já vem; em alguns minimalistas, não).
sudo emerge --ask --noreplace net-misc/netifrc

# Crie o symlink para a interface que você quer gerenciar.
cd /etc/init.d
sudo ln -s net.lo net.enp3s0` },
      { lang: "conf", code: `# /etc/conf.d/net — configuração mais simples possível: DHCP.
# 'config_<iface>' é a variável-chave; 'dhcp' significa pegar IP automatico.
config_enp3s0="dhcp"

# Opcional: tempo limite para DHCP (em segundos)
dhcp_enp3s0="release nodns nontp nonis"   # exemplos de hooks
# Para wifi, normalmente combina-se com wpa_supplicant — ver capítulo dedicado.` },
      { lang: "conf", code: `# /etc/conf.d/net — exemplo com IP estático e gateway.
# Útil para servidores ou para a máquina de casa com IP reservado.
config_enp3s0="192.168.1.50/24"
routes_enp3s0="default via 192.168.1.1"
dns_servers_enp3s0="1.1.1.1 9.9.9.9"
dns_domain_enp3s0="lan.local"` },
      { lang: "bash", code: `# Habilitar a interface no runlevel 'default' para subir no boot.
sudo rc-update add net.enp3s0 default

# Subir agora, sem reiniciar:
sudo rc-service net.enp3s0 start

# Verificar status / parar / reiniciar:
sudo rc-service net.enp3s0 status
sudo rc-service net.enp3s0 restart` },
      { lang: "bash", code: `# Diagnóstico quando a interface 'não sobe':
# 1) o link está up no cabo?
ip link show enp3s0
# 2) recebeu IP?
ip addr show enp3s0
# 3) gateway e rotas:
ip route
# 4) resolve nome?
getent hosts gentoo.org
# 5) logs do netifrc:
sudo tail -n 50 /var/log/rc.log` },
    ],
    points: [
      "netifrc é o gerenciador de rede 'nativo' do OpenRC — não exige NetworkManager.",
      "Toda configuração mora em /etc/conf.d/net e é shell puro (variáveis e arrays).",
      "Uma interface = um symlink em /etc/init.d/ apontando para net.lo.",
      "Use 'config_<iface>=\"dhcp\"' para DHCP; 'IP/prefixo' para estático.",
      "rc-update add net.<iface> default ativa no boot; rc-service controla manualmente.",
      "Em sistemas modernos as interfaces se chamam enpXsY/wlpXsY, não eth0/wlan0.",
      "Armadilha comum: esquecer de criar o symlink net.<iface> e o serviço nem aparecer.",
      "Iniciante comum: editar /etc/conf.d/net certinho mas não habilitar no runlevel 'default'.",
    ],
    alerts: [
      { type: "info", content: "O netifrc usa 'módulos' (dhcpcd, iproute2, wpa_supplicant, ifconfig). Se um módulo não estiver instalado, o serviço falha silenciosamente. Confira 'modules_<iface>' em /etc/conf.d/net." },
      { type: "tip", content: "Para uma rede simples (cabo + DHCP), instalar 'net-misc/dhcpcd' e habilitar 'rc-service dhcpcd start' já resolve, sem nem editar netifrc. Veja o próximo capítulo." },
      { type: "warning", content: "Se você usa systemd em vez de OpenRC, esqueça o netifrc: a configuração será via systemd-networkd ou NetworkManager. Os capítulos seguintes cobrem ambos." },
      { type: "success", content: "Para servidores, netifrc é uma escolha sólida: zero dependência adicional, configuração versionável (é só um arquivo de texto) e comportamento previsível." },
    ],
  },
  {
    slug: "dhcpcd",
    section: "rede",
    title: "dhcpcd: o cliente DHCP universal",
    difficulty: "iniciante",
    subtitle: "Solução leve e quase plug-and-play para máquinas que só precisam pegar IP automático.",
    intro: `Se sua única necessidade de rede é 'plugar o cabo e funcionar', talvez você nem precise do netifrc nem do NetworkManager. O 'dhcpcd' (DHCP Client Daemon) é um cliente DHCP completo que sozinho consegue: levantar a interface, requisitar IP, configurar gateway, escrever '/etc/resolv.conf' com os DNS recebidos e ainda lidar com IPv6 via SLAAC. Para muitos servidores e desktops simples, é o suficiente.

O 'dhcpcd' funciona como um 'gerente leve': escuta os eventos das interfaces (cabo conectado, link up), age automaticamente e tem hooks que permitem rodar scripts em momentos específicos do ciclo (por exemplo, atualizar o resolv.conf via 'resolvconf' ou notificar o sistema). No Gentoo ele vem em 'net-misc/dhcpcd' e tem um init do OpenRC pronto.

Neste capítulo veremos como instalar e habilitar o dhcpcd, como controlar quais interfaces ele gerencia, ler o status com 'dhcpcd -U' e desabilitar comportamentos que costumam atrapalhar (como ele insistir em sobrescrever o '/etc/resolv.conf' quando você quer manter um DNS fixo). É uma daquelas ferramentas que parecem invisíveis até você perceber que são elas que mantêm a internet de pé.`,
    codes: [
      { lang: "bash", code: `# Instalação do dhcpcd:
sudo emerge --ask net-misc/dhcpcd

# Habilitar e iniciar (OpenRC):
sudo rc-update add dhcpcd default
sudo rc-service dhcpcd start

# Em systemd:
sudo systemctl enable --now dhcpcd` },
      { lang: "bash", code: `# Por padrão, dhcpcd gerencia TODAS as interfaces que aparecerem.
# Para restringir, edite /etc/dhcpcd.conf.

# Verifique o estado de todas as interfaces:
sudo dhcpcd -U enp3s0
# Saída inclui ip_address, subnet_mask, routers, domain_name_servers etc.` },
      { lang: "conf", code: `# /etc/dhcpcd.conf — limita o dhcpcd a uma interface específica.
# Sem isso, ele tenta DHCP até no wlan0, que provavelmente você quer no NM.
allowinterfaces enp3s0
denyinterfaces wlp2s0

# Hostname automático recebido do servidor DHCP:
hostname

# Não criar arquivos de hooks indesejados:
# nohook lookup-hostname
# nohook resolv.conf      # <- não sobrescrever /etc/resolv.conf` },
      { lang: "bash", code: `# Renovar o lease manualmente:
sudo dhcpcd -n enp3s0          # rebind sem desistir do IP atual
sudo dhcpcd -k enp3s0          # liberar e parar
sudo dhcpcd enp3s0             # iniciar novamente

# Forçar pedido de IP imediatamente:
sudo dhcpcd -4 -t 5 enp3s0     # IPv4 só, timeout 5s` },
      { lang: "bash", code: `# Logs e diagnóstico:
sudo tail -n 50 /var/log/dhcpcd.log     # se configurado
journalctl -u dhcpcd                    # systemd
sudo rc-service dhcpcd status           # OpenRC

# Veja o lease atual:
sudo cat /var/db/dhcpcd/enp3s0.lease | hexdump -C | head` },
    ],
    points: [
      "dhcpcd é o cliente DHCP padrão recomendado pelo handbook do Gentoo.",
      "Sozinho ele resolve IPv4, IPv6, gateway, DNS e hostname para interfaces simples.",
      "Para vários SOs uma única ativação ('rc-service dhcpcd start') já dá rede.",
      "Use 'allowinterfaces' / 'denyinterfaces' em /etc/dhcpcd.conf para evitar conflito com NM.",
      "Comando 'dhcpcd -U <iface>' mostra os campos que vieram do servidor.",
      "'nohook resolv.conf' impede que o dhcpcd pise no DNS estático configurado.",
      "Armadilha comum: dhcpcd e NetworkManager rodando juntos = guerra silenciosa de IPs.",
      "Iniciante comum: editar /etc/resolv.conf manualmente e ver tudo apagado no próximo lease.",
    ],
    alerts: [
      { type: "tip", content: "Em servidores que não têm wifi, o dhcpcd sozinho costuma ser tudo o que você precisa. Menos peças móveis, menos coisa para quebrar." },
      { type: "warning", content: "Nunca rode dhcpcd e NetworkManager para a mesma interface ao mesmo tempo. Ambos vão tentar configurar IP/rotas, e o resultado é uma rede instável e quase impossível de debugar." },
      { type: "info", content: "O dhcpcd também atua como 'IPv6 router solicitor' (SLAAC). Em redes IPv6, ele descobre prefixos e configura endereços globalmente roteáveis sem você fazer nada." },
    ],
  },
  {
    slug: "networkmanager",
    section: "rede",
    title: "NetworkManager: rede para desktop",
    difficulty: "iniciante",
    subtitle: "Quando você quer trocar de wifi como em qualquer notebook moderno, sem brigar com config files.",
    intro: `O 'NetworkManager' (NM) é o gerenciador de rede 'amigável' usado por GNOME, KDE, XFCE e por praticamente toda distro desktop. Ele resolve aquilo que netifrc e dhcpcd não fazem bem: trocar de rede wifi com um clique, lembrar redes conhecidas, lidar com VPN, hotspot, modem 4G, captive portals e perfis por usuário. Em um notebook, o NM é geralmente a melhor escolha.

No Gentoo, o NM vem em 'net-misc/networkmanager' e tem um conjunto razoável de USE flags: 'wifi' (suporte 802.11), 'bluetooth' (PAN/DUN), 'modemmanager' (3G/4G), 'ppp' (DSL), 'gnutls' ou 'nss' para criptografia. Você ativa o que precisa e desliga o resto. Existe ainda o frontend nmcli (linha de comando), o nmtui (TUI) e applets gráficos como 'nm-applet' (GTK) e 'plasma-nm' (KDE).

Neste capítulo, instalamos o NM, vemos como conectar a uma rede wifi via 'nmcli' (sem GUI), criamos perfis estáticos para servidores, ativamos o serviço no boot e mostramos como integrar com o systemd-resolved ou com 'openresolv' para que o '/etc/resolv.conf' fique limpo. Também alertamos sobre o conflito com dhcpcd/netifrc — é um ou outro, nunca os dois.`,
    codes: [
      { lang: "conf", code: `# /etc/portage/package.use/networkmanager — escolha as features.
net-misc/networkmanager wifi bluetooth modemmanager -ppp
# 'wifi'         -> suporte a 802.11
# 'bluetooth'    -> PAN/DUN
# 'modemmanager' -> dongles 3G/4G
# Se você não usa PPPoE, pode tirar 'ppp' para diminuir build.` },
      { lang: "bash", code: `# Instalar e habilitar (OpenRC):
sudo emerge --ask net-misc/networkmanager
sudo rc-update add NetworkManager default
sudo rc-service NetworkManager start

# Em systemd:
sudo systemctl enable --now NetworkManager

# IMPORTANTE: desligue dhcpcd/netifrc para as mesmas interfaces.
sudo rc-update del dhcpcd default
sudo rc-service dhcpcd stop` },
      { lang: "bash", code: `# nmcli — fluxo típico de wifi pelo terminal.
nmcli device wifi list                           # lista redes
nmcli device wifi connect "MinhaRede" password "senha123"
nmcli connection show                            # perfis salvos
nmcli connection up "MinhaRede"
nmcli connection down "MinhaRede"

# Esquecer uma rede:
nmcli connection delete "MinhaRede"` },
      { lang: "bash", code: `# IP estático com nmcli (servidor sem GUI).
nmcli connection add type ethernet ifname enp3s0 con-name lab-static \\
  ipv4.method manual ipv4.addresses 192.168.1.50/24 \\
  ipv4.gateway 192.168.1.1 ipv4.dns "1.1.1.1 9.9.9.9" \\
  connection.autoconnect yes
nmcli connection up lab-static` },
      { lang: "bash", code: `# nmtui — interface curses, ótima para ssh em servidores.
sudo nmtui
# Menus:
#   Edit a connection
#   Activate a connection
#   Set system hostname` },
      { lang: "bash", code: `# Diagnóstico e logs:
nmcli general status
nmcli device status
journalctl -u NetworkManager -f       # systemd
sudo tail -n 100 /var/log/messages    # OpenRC com sysklogd

# Wifi não conecta? Veja interface e regulamentação:
iw reg get
iw dev wlp2s0 link` },
    ],
    points: [
      "NetworkManager é a melhor escolha para notebooks e desktops com várias redes.",
      "Habilite USE flags conforme uso: 'wifi', 'bluetooth', 'modemmanager'.",
      "nmcli é tão poderoso quanto a GUI — útil em servidores e em scripts.",
      "Use 'nmtui' para uma interface texto rápida via SSH.",
      "Crie perfis com 'connection.autoconnect yes' para subir no boot.",
      "Plasma-nm e nm-applet integram visualmente no DE; nem sempre são instalados juntos.",
      "Armadilha comum: deixar dhcpcd/netifrc rodando junto e ter conflito de IP.",
      "Iniciante comum: instalar o NM e esquecer de habilitar o serviço — wifi some.",
    ],
    alerts: [
      { type: "tip", content: "Para integrar bem com o resto do sistema, instale 'sys-apps/openresolv' ou use 'systemd-resolved'. Assim, várias fontes de DNS (NM + VPN) convivem no /etc/resolv.conf sem se sobrescreverem." },
      { type: "warning", content: "Em desktops KDE, NÃO instale o 'nm-applet' (GTK). Use o 'plasma-nm' nativo. Misturar os dois deixa dois ícones no tray e atalhos confusos." },
      { type: "info", content: "O NM guarda os perfis em /etc/NetworkManager/system-connections/ com permissão 600. Senhas wifi ficam ali em texto plano (ou hash). Faça backup desse diretório se reinstalar o sistema." },
      { type: "success", content: "Com o NM, plugar uma rede 4G via dongle USB normalmente é detectado automaticamente — ele descobre o modem via ModemManager e cria o perfil sozinho." },
    ],
  },
  {
    slug: "wpa-supplicant",
    section: "rede",
    title: "wpa_supplicant: wifi sem NetworkManager",
    difficulty: "intermediario",
    subtitle: "O daemon clássico de WPA/WPA2/WPA3 que conecta sua placa wifi a redes seguras.",
    intro: `Se você não quer NetworkManager (porque é servidor, porque é uma máquina enxuta, porque quer entender o que acontece por baixo), a peça que faz o wifi funcionar é o 'wpa_supplicant'. Ele é o daemon responsável por toda a parte criptográfica do wifi moderno: handshake WPA2/WPA3, EAP empresarial, certificados, PMF. Sem ele, sua placa wifi até consegue ver redes abertas, mas não autentica em nenhuma protegida.

No Gentoo ele vem em 'net-wireless/wpa_supplicant' e tem várias USE flags importantes: 'dbus' (necessária para integrar com NM), 'wpa3' (já padrão hoje), 'qt5' para o wpa_gui. Você o usa de duas formas: (1) sozinho, com '/etc/wpa_supplicant/wpa_supplicant-<iface>.conf' integrado ao netifrc; (2) como 'backend' do NetworkManager (que controla via D-Bus). Aqui focamos no caso 1.

Neste capítulo você vai aprender a gerar uma 'PSK' segura com 'wpa_passphrase', escrever o arquivo de configuração com vários blocos 'network={}' (um por rede conhecida), juntar tudo com o netifrc para ter wifi automático no boot e diagnosticar quando não conecta usando 'wpa_cli'. É a base de qualquer setup wifi 'sem GUI'.`,
    codes: [
      { lang: "bash", code: `# Instalar o pacote:
sudo emerge --ask net-wireless/wpa_supplicant

# Confira que o módulo do kernel da sua placa está carregado:
sudo lspci -k | grep -A2 -i network
sudo dmesg | grep -i firmware    # firmware carregado?` },
      { lang: "bash", code: `# Gere a PSK criptografada (não deixa senha em texto plano).
wpa_passphrase "MinhaRede" "senha-bem-grande-aqui"
# Saída:
# network={
#     ssid="MinhaRede"
#     #psk="senha-bem-grande-aqui"
#     psk=8c1e... (hash)
# }
# Apague a linha #psk= (texto plano) e copie o restante.` },
      { lang: "conf", code: `# /etc/wpa_supplicant/wpa_supplicant-wlp2s0.conf
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=wheel
update_config=1
country=BR

network={
    ssid="MinhaRede"
    psk=8c1e0a5b3f...           # hash gerado por wpa_passphrase
    key_mgmt=WPA-PSK
    priority=10
}

network={
    ssid="WifiAberto"
    key_mgmt=NONE                # rede sem senha
    priority=1
}` },
      { lang: "conf", code: `# /etc/conf.d/net — integrar wifi ao netifrc.
modules_wlp2s0="wpa_supplicant"
wpa_supplicant_wlp2s0="-Dnl80211"   # driver moderno (mac80211)
config_wlp2s0="dhcp"

# Crie o link de serviço:
# cd /etc/init.d && ln -s net.lo net.wlp2s0
# rc-update add net.wlp2s0 default` },
      { lang: "bash", code: `# Operar manualmente, sem netifrc, para testar:
sudo wpa_supplicant -B -i wlp2s0 \\
  -c /etc/wpa_supplicant/wpa_supplicant-wlp2s0.conf \\
  -D nl80211
sudo dhcpcd wlp2s0

# Inspecionar e controlar via wpa_cli:
sudo wpa_cli -i wlp2s0 status
sudo wpa_cli -i wlp2s0 scan && sudo wpa_cli -i wlp2s0 scan_results
sudo wpa_cli -i wlp2s0 reconfigure` },
      { lang: "text", code: `# Saída saudável de 'wpa_cli status':
bssid=aa:bb:cc:dd:ee:ff
freq=5180
ssid=MinhaRede
id=0
mode=station
wpa_state=COMPLETED       <-- estado-chave; significa autenticado
ip_address=192.168.1.42
key_mgmt=WPA2-PSK
group_cipher=CCMP` },
    ],
    points: [
      "wpa_supplicant cuida da parte criptográfica do wifi (WPA2/WPA3/EAP).",
      "Use 'wpa_passphrase' para gerar a PSK em hash, nunca deixe senha em texto plano.",
      "Defina 'country=BR' para que a placa respeite os canais permitidos no Brasil.",
      "Driver moderno é '-Dnl80211' (nl80211/mac80211); 'wext' é legado.",
      "Várias redes? Vários blocos 'network={}' com 'priority=' diferente.",
      "Combine com netifrc ('modules_<iface>=\"wpa_supplicant\"') ou wpa_cli + dhcpcd.",
      "Armadilha comum: configurar tudo certo e esquecer do firmware da placa wifi.",
      "Iniciante comum: deixar a senha em '#psk=' do wpa_passphrase visível no arquivo.",
    ],
    alerts: [
      { type: "warning", content: "Cheque sempre se 'sys-kernel/linux-firmware' está instalado e se sua placa wifi (Intel iwlwifi, Realtek, MediaTek) tem o blob correspondente. Sem firmware a interface nem aparece no 'ip link'." },
      { type: "tip", content: "Para diagnosticar problemas de associação, rode wpa_supplicant em foreground com -dd: 'sudo wpa_supplicant -i wlp2s0 -c ... -dd'. A saída mostra o handshake completo." },
      { type: "info", content: "Se a USE 'dbus' estiver ativa, o wpa_supplicant aceita controle pelo NetworkManager via D-Bus. É essa integração que faz o NM 'usar' o wpa_supplicant por baixo." },
      { type: "danger", content: "Não habilite duas instâncias de wpa_supplicant para a mesma interface (uma do netifrc, outra do NM). Vai dar 'Could not connect to wpa_supplicant', perda de associação aleatória e dor de cabeça." },
    ],
  },
  {
    slug: "iwd",
    section: "rede",
    title: "iwd: wifi moderno e enxuto",
    difficulty: "intermediario",
    subtitle: "Substituto leve do wpa_supplicant, escrito pela Intel, com CLI agradável e zero dependência externa.",
    intro: `O 'iwd' (iNet Wireless Daemon) é uma alternativa moderna ao wpa_supplicant criada pela Intel. A proposta é simples: usar diretamente as primitivas criptográficas do kernel (cryptodev) em vez de carregar bibliotecas externas (openssl/libnl), resultando em um daemon menor, mais rápido em scan e bem mais agradável de usar via linha de comando, com o utilitário 'iwctl'. Em testes, conexão a uma rede WPA2 com iwd costuma ser sub-segundo.

No Gentoo, o iwd está em 'net-wireless/iwd'. Ele pode rodar sozinho como daemon de wifi (em servidores leves, em ARM, em Raspberry Pi) ou como backend do NetworkManager — ativando '[device].wifi.backend=iwd' em '/etc/NetworkManager/conf.d/wifi_backend.conf'. Em ambos os casos, dispensa o wpa_supplicant.

Este capítulo mostra como instalar o iwd, conectar em uma rede via 'iwctl', salvar perfis em '/var/lib/iwd/' (formato INI muito simples), integrar com NetworkManager, e os trade-offs em relação ao wpa_supplicant: o iwd é mais simples e bonito, mas o wpa_supplicant ainda ganha em alguns cenários enterprise complexos (EAP-TTLS específicos, configurações exóticas).`,
    codes: [
      { lang: "bash", code: `# Instalação:
sudo emerge --ask net-wireless/iwd

# Para usar SOZINHO (sem NM), habilite o daemon:
sudo rc-update add iwd default      # OpenRC
sudo systemctl enable --now iwd     # systemd

# IMPORTANTE: pare o wpa_supplicant.
sudo rc-service wpa_supplicant stop` },
      { lang: "bash", code: `# iwctl — fluxo típico interativo.
sudo iwctl
# [iwd]# device list
# [iwd]# station wlan0 scan
# [iwd]# station wlan0 get-networks
# [iwd]# station wlan0 connect "MinhaRede"
# Passphrase: ******
# [iwd]# station wlan0 show
# [iwd]# exit` },
      { lang: "bash", code: `# Em modo não interativo (script-friendly):
sudo iwctl station wlan0 connect MinhaRede --passphrase "senha"
sudo iwctl known-networks list
sudo iwctl known-networks "MinhaRede" forget` },
      { lang: "conf", code: `# /var/lib/iwd/MinhaRede.psk — perfil persistente (gerado automaticamente).
# Você pode editar à mão se precisar.
[Security]
PreSharedKey=8c1e0a5b3f...
Passphrase=senha-clara-opcional

[Settings]
AutoConnect=true
Hidden=false` },
      { lang: "conf", code: `# /etc/iwd/main.conf — configurações globais.
[General]
EnableNetworkConfiguration=true   # iwd configura IP sozinho (sem dhcpcd!)

[Network]
NameResolvingService=systemd      # ou 'resolvconf'
EnableIPv6=true` },
      { lang: "conf", code: `# /etc/NetworkManager/conf.d/wifi_backend.conf
# Se você usa NM mas quer iwd como backend (mais leve que wpa_supplicant).
[device]
wifi.backend=iwd

# Reinicie: sudo rc-service NetworkManager restart` },
    ],
    points: [
      "iwd substitui o wpa_supplicant com daemon menor e CLI 'iwctl' bem mais amigável.",
      "Pode rodar sozinho ou como backend do NetworkManager.",
      "Perfis ficam em /var/lib/iwd/ no formato INI legível e versionável.",
      "Com 'EnableNetworkConfiguration=true', o iwd dispensa dhcpcd para wifi.",
      "Tempo de associação costuma ser menor que com wpa_supplicant.",
      "Compatível com WPA2-Enterprise (EAP-PEAP, EAP-TTLS comuns).",
      "Armadilha comum: deixar wpa_supplicant ativo junto — vão competir pela placa.",
      "Iniciante comum: esperar arquivo de configuração único — iwd usa um por rede em /var/lib/iwd/.",
    ],
    alerts: [
      { type: "tip", content: "iwctl tem autocomplete por TAB no shell interativo. Comece digitando 'station ' e aperte TAB para ver as opções. Ótimo para descobrir comandos." },
      { type: "warning", content: "Algumas redes corporativas com EAP-TTLS muito específicos ainda funcionam melhor no wpa_supplicant. Se você falhar em conectar com iwd no escritório, esse é o motivo provável." },
      { type: "info", content: "O iwd usa as APIs cryptodev/AF_ALG do kernel, então exige um kernel relativamente recente (4.x+) e os módulos cryptográficos certos compilados (CONFIG_CRYPTO_USER_API_*)." },
    ],
  },
  {
    slug: "openrc-firewall",
    section: "rede",
    title: "iptables clássico no OpenRC",
    difficulty: "intermediario",
    subtitle: "Como funciona o firewall tradicional do Linux e o init que persiste regras entre boots.",
    intro: `O 'iptables' é a interface clássica para o subsistema 'netfilter' do kernel, usado por mais de 20 anos para fazer firewall em Linux. Hoje ele está sendo gradualmente substituído pelo 'nftables' (próximo capítulo), mas ainda é a ferramenta dominante em scripts antigos, em containers, em milhares de tutoriais e em provedores. Saber iptables é mandatório se você lê código de outras pessoas.

No Gentoo, o pacote é 'net-firewall/iptables'. Ele instala dois binários principais: 'iptables' (IPv4) e 'ip6tables' (IPv6), além do init '/etc/init.d/iptables' que faz salvar e restaurar regras entre boots. As regras vivem em memória; sem o init salvando-as em '/var/lib/iptables/rules-save', você perde tudo ao reiniciar.

Neste capítulo você vai aprender as 4 cadeias principais (INPUT, OUTPUT, FORWARD, mais NAT em PREROUTING/POSTROUTING), criar regras básicas (permitir SSH, bloquear tudo o resto), salvar com 'rc-service iptables save' e restaurar com 'restore'. Também vamos cobrir o erro mais comum (lockout: você se bloqueia do próprio servidor SSH) e como evitá-lo com 'at' ou 'iptables-apply'.`,
    codes: [
      { lang: "bash", code: `# Instalação:
sudo emerge --ask net-firewall/iptables

# Habilitar o init (OpenRC):
sudo rc-update add iptables default
sudo rc-update add ip6tables default
sudo rc-service iptables start` },
      { lang: "bash", code: `# Inspeção do estado atual:
sudo iptables -L -v -n --line-numbers
# -L lista, -v verbose, -n não resolve nomes (mais rápido)

# Tudo limpo (cuidado!):
sudo iptables -F           # flush regras
sudo iptables -X           # apaga chains custom
sudo iptables -P INPUT ACCEPT
sudo iptables -P FORWARD ACCEPT
sudo iptables -P OUTPUT ACCEPT` },
      { lang: "bash", code: `# Política mínima 'deny by default' para um servidor.
# Lê-se: aceito o que é resposta + loopback + SSH; rejeito o resto.
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT ACCEPT

sudo iptables -A INPUT -i lo -j ACCEPT
sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
sudo iptables -A INPUT -p icmp -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
# (opcional) HTTP/HTTPS:
sudo iptables -A INPUT -p tcp --dport 80  -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT` },
      { lang: "bash", code: `# Salvar para o boot e restaurar manualmente:
sudo rc-service iptables save           # grava em /var/lib/iptables/rules-save
sudo rc-service iptables restore        # reaplica do disco

# Equivalentes diretos:
sudo iptables-save  > /etc/iptables/rules.v4
sudo iptables-restore < /etc/iptables/rules.v4` },
      { lang: "bash", code: `# 'at' como rede de segurança contra lockout:
# antes de aplicar regras críticas via SSH, agende um flush em 5 minutos.
echo "iptables -F && iptables -P INPUT ACCEPT" | sudo at now + 5 minutes
# Se você perder o SSH, em 5 min as regras são limpas e a máquina volta.
# Se deu certo, cancele com:
sudo atq
sudo atrm <id>` },
    ],
    points: [
      "iptables manipula 'cadeias' INPUT, OUTPUT, FORWARD (e PREROUTING/POSTROUTING para NAT).",
      "Política padrão (-P) define o que acontece se nenhuma regra casar.",
      "Use o módulo 'conntrack' para aceitar respostas (ESTABLISHED,RELATED).",
      "Sem o init 'iptables', regras são apagadas no reboot — sempre 'rc-service iptables save'.",
      "Há iptables (IPv4) e ip6tables (IPv6) separados — cuidado para configurar ambos.",
      "Em servidor remoto, use 'at' antes de aplicar para se proteger contra lockout.",
      "Armadilha comum: editar regras via SSH e se trancar fora ao perder a conexão.",
      "Iniciante comum: esquecer ip6tables e deixar IPv6 totalmente aberto enquanto trava o IPv4.",
    ],
    alerts: [
      { type: "danger", content: "NUNCA mude políticas para DROP via SSH sem aceitar a porta 22 PRIMEIRO. Você se tranca fora e só resolve com console físico ou boot em live." },
      { type: "warning", content: "iptables foi marcado como legado pelo upstream do netfilter. Em distros novas, 'iptables' é na verdade um wrapper sobre nftables ('iptables-nft'). Funciona, mas considere o nftables para configs novas." },
      { type: "tip", content: "'iptables-apply' é uma ferramenta que aplica um arquivo de regras com timeout: se você não confirmar, ela reverte. Salva-vidas para mudanças remotas." },
      { type: "info", content: "Sem o módulo do kernel (nf_tables, ip_tables, x_tables, conntrack) você verá 'No chain/target/match by that name'. Confira o .config do kernel." },
    ],
  },
  {
    slug: "nftables",
    section: "rede",
    title: "nftables: o sucessor moderno do iptables",
    difficulty: "intermediario",
    subtitle: "Sintaxe unificada, melhor desempenho, conjuntos nativos e um único arquivo de configuração.",
    intro: `O 'nftables' é a evolução do netfilter projetada para substituir iptables, ip6tables, arptables e ebtables — todos quatro — com uma única ferramenta, uma única sintaxe e uma única engine no kernel. A linguagem é declarativa, parecida com a de roteadores comerciais (Junos, IOS), e suporta nativamente conceitos modernos: 'sets', 'maps', 'verdict' como expressão, named chains, atomicidade total na atualização. Um arquivo, um comando, e seu firewall está aplicado.

No Gentoo o pacote é 'net-firewall/nftables', e ele inclui o init OpenRC 'nftables' que carrega '/etc/nftables.conf' no boot. Aqui já não há aquele esquema 'salvar em /var/lib/...': o estado de boot é literalmente o conteúdo do arquivo, o que torna versionar regras com Git natural. Isso por si só já é um upgrade enorme em relação à era iptables.

Neste capítulo construímos uma config nftables 'pronta para servidor' (drop por padrão, ssh+http+https liberados, anti-spoof, ICMP saudável, contadores), aprendemos a usar 'nft list ruleset' e a recarregar com 'nft -f /etc/nftables.conf'. Também fazemos uma equivalência rápida com iptables para quem está migrando.`,
    codes: [
      { lang: "bash", code: `# Instalação:
sudo emerge --ask net-firewall/nftables

# Habilitar e iniciar:
sudo rc-update add nftables default
sudo rc-service nftables start
# Em systemd:
sudo systemctl enable --now nftables` },
      { lang: "conf", code: `# /etc/nftables.conf — exemplo completo de servidor.
#!/usr/sbin/nft -f
flush ruleset

table inet filter {
    chain input {
        type filter hook input priority 0; policy drop;

        iif lo accept
        ct state established,related accept
        ct state invalid drop

        ip protocol icmp limit rate 10/second accept
        ip6 nexthdr icmpv6 accept

        tcp dport 22 accept comment "SSH"
        tcp dport { 80, 443 } accept comment "HTTP(S)"

        counter log prefix "nft_drop: " drop
    }

    chain forward { type filter hook forward priority 0; policy drop; }
    chain output  { type filter hook output  priority 0; policy accept; }
}` },
      { lang: "bash", code: `# Aplicar imediatamente sem esperar reboot:
sudo nft -f /etc/nftables.conf

# Listar tudo:
sudo nft list ruleset
# Listar uma tabela / chain:
sudo nft list table inet filter
sudo nft list chain inet filter input` },
      { lang: "bash", code: `# Operações pontuais:
# adicionar regra dinâmica
sudo nft add rule inet filter input tcp dport 8080 accept
# deletar (precisa do handle, descubra com '-a')
sudo nft -a list chain inet filter input
sudo nft delete rule inet filter input handle 17

# zerar contadores
sudo nft reset counters` },
      { lang: "conf", code: `# Bloquear um conjunto de IPs com 'sets' (matriz nativa).
# Mais rápido que 100 regras separadas.
table inet filter {
    set blacklist {
        type ipv4_addr
        elements = { 1.2.3.4, 5.6.7.8 }
    }
    chain input {
        type filter hook input priority 0; policy drop;
        ip saddr @blacklist drop
    }
}` },
      { lang: "bash", code: `# Migração rápida iptables -> nftables:
# 'iptables-translate' converte regras antigas em sintaxe nftables.
sudo iptables-translate -A INPUT -p tcp --dport 22 -j ACCEPT
# saída: nft add rule ip filter INPUT tcp dport 22 counter accept` },
    ],
    points: [
      "nftables substitui iptables, ip6tables, arptables e ebtables com uma única tool.",
      "Toda a config vive em /etc/nftables.conf (versionável em Git).",
      "Use 'family inet' para regras que valem para IPv4 e IPv6 ao mesmo tempo.",
      "Regras são atômicas: 'nft -f arquivo' troca tudo de uma vez, sem janela aberta.",
      "Sets e maps tornam listas grandes (blacklists, ports) muito mais eficientes.",
      "'iptables-translate' acelera muito a migração de scripts antigos.",
      "Armadilha comum: rodar iptables E nftables ao mesmo tempo — comportamento imprevisível.",
      "Iniciante comum: esquecer 'flush ruleset' no topo e duplicar regras a cada recarga.",
    ],
    alerts: [
      { type: "tip", content: "Sempre comece o /etc/nftables.conf com 'flush ruleset'. Sem isso, 'nft -f' acumula regras em vez de substituí-las." },
      { type: "info", content: "'family inet' é uma família 'dual stack' que aplica a regra tanto em IPv4 quanto em IPv6, eliminando a duplicação que existia no iptables/ip6tables." },
      { type: "warning", content: "Se você habilitar nftables com iptables.service ainda ativo, as regras 'visíveis' podem confundir: ambas estão na mesma engine. Desative iptables/ip6tables explicitamente ao migrar." },
      { type: "success", content: "A sintaxe nftables é tão clara que se aproxima de configs de firewalls dedicados. Um colega que nunca viu o arquivo consegue ler em 1 minuto." },
    ],
  },
  {
    slug: "ssh",
    section: "rede",
    title: "OpenSSH: acesso remoto seguro",
    difficulty: "iniciante",
    subtitle: "Configurando o servidor SSH do Gentoo com chaves, hardening básico e fail2ban.",
    intro: `SSH é a porta de entrada de qualquer servidor Linux. O 'OpenSSH' (net-misc/openssh no Gentoo) é a implementação padrão e absolutamente onipresente: ele é o servidor que aceita conexões e o cliente que você usa para conectar. Saber configurar bem o SSH é a diferença entre um servidor seguro por padrão e um servidor que aparece em logs de invasão no primeiro dia.

A configuração do servidor mora em '/etc/ssh/sshd_config' e a do cliente em '/etc/ssh/ssh_config' (ou '~/.ssh/config' por usuário). O serviço se chama 'sshd' e está habilitado no runlevel 'default' por padrão na maioria dos stages. Cinco mudanças simples no 'sshd_config' já cobrem 95% das ameaças comuns: desabilitar login de root via senha, exigir chave pública, mudar a porta para evitar scan trivial, habilitar 'AllowUsers' e usar 'Match' para limitar redes.

Neste capítulo, instalamos o openssh, geramos um par de chaves Ed25519 (mais seguro e curto que RSA), copiamos a chave pública para o servidor com 'ssh-copy-id', endurecemos o '/etc/ssh/sshd_config', testamos antes de reiniciar com 'sshd -t' e adicionamos 'fail2ban' para mitigar tentativas de força bruta. É o setup que você quer em qualquer máquina exposta à internet.`,
    codes: [
      { lang: "bash", code: `# Instalar (geralmente já vem no stage3):
sudo emerge --ask net-misc/openssh

# Habilitar no boot e iniciar:
sudo rc-update add sshd default
sudo rc-service sshd start

# Em systemd:
sudo systemctl enable --now sshd` },
      { lang: "bash", code: `# No CLIENTE: gerar par de chaves Ed25519 (recomendado).
ssh-keygen -t ed25519 -C "ana@notebook"
# Aceite o caminho padrão (~/.ssh/id_ed25519) e use uma passphrase forte.

# Copiar a chave pública para o servidor:
ssh-copy-id ana@servidor.exemplo.com
# Vai pedir a senha UMA vez; depois disso o login passa a ser por chave.` },
      { lang: "conf", code: `# /etc/ssh/sshd_config — hardening básico recomendado.
Port 2222                              # mude da 22 reduz logs de scan
AddressFamily any
PermitRootLogin no                     # nunca por senha; só via chave se necessário
PasswordAuthentication no              # exige chave
PubkeyAuthentication yes
KbdInteractiveAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes

AllowUsers ana bruno                   # whitelist explícita
MaxAuthTries 3
LoginGraceTime 30s
ClientAliveInterval 300
ClientAliveCountMax 2

# Apenas algoritmos modernos:
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com` },
      { lang: "bash", code: `# SEMPRE valide antes de reiniciar:
sudo sshd -t
# Se não imprimir nada, está OK. Erro? ele aponta a linha.

# Recarregar (mantém conexões existentes):
sudo rc-service sshd reload
# Reiniciar (corta sessões):
sudo rc-service sshd restart

# Em paralelo, mantenha uma sessão SSH aberta para corrigir se errar.` },
      { lang: "conf", code: `# ~/.ssh/config — atalhos do cliente.
Host servidor
    HostName servidor.exemplo.com
    Port 2222
    User ana
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ForwardAgent no                    # só ative se realmente precisar` },
      { lang: "bash", code: `# Instalar fail2ban para banir IPs com muitas falhas.
sudo emerge --ask net-analyzer/fail2ban
sudo rc-update add fail2ban default
sudo rc-service fail2ban start

# Verificar se a jail SSH está ativa:
sudo fail2ban-client status sshd
# Listar IPs banidos:
sudo fail2ban-client banned` },
    ],
    points: [
      "OpenSSH é universal: instale, habilite o sshd e proteja antes de expor.",
      "Use chaves Ed25519 (curtas, rápidas, seguras) em vez de RSA antigas.",
      "ssh-copy-id automatiza copiar a chave pública para ~/.ssh/authorized_keys do servidor.",
      "Desabilite PasswordAuthentication após confirmar que a chave funciona.",
      "Sempre rode 'sshd -t' antes de reiniciar o serviço para evitar lockout.",
      "Mantenha sessão de fallback aberta ao alterar config remotamente.",
      "fail2ban reduz drasticamente o ruído de tentativas de força bruta.",
      "Armadilha comum: trocar a porta no sshd_config mas esquecer do firewall.",
      "Iniciante comum: gerar chave sem passphrase e perder a chave junto com o notebook.",
    ],
    alerts: [
      { type: "danger", content: "Antes de pôr 'PermitRootLogin no' e 'PasswordAuthentication no', tenha CERTEZA de que: (1) você criou um usuário comum no grupo wheel; (2) a chave pública dele está em ~/.ssh/authorized_keys; (3) você consegue 'sudo' com esse usuário. Senão, lockout." },
      { type: "tip", content: "Use 'ssh -v servidor' (verbose) para depurar problemas de autenticação. A saída detalhada mostra qual chave foi tentada, qual algoritmo, e por que falhou." },
      { type: "info", content: "O OpenSSH suporta autenticação por hardware key (FIDO2/WebAuthn) com 'ssh-keygen -t ed25519-sk'. Excelente para ambientes corporativos." },
      { type: "success", content: "Após o hardening, /var/log/auth.log praticamente para de mostrar tentativas de login — o atacante recebe 'Permission denied' antes mesmo de poder testar senhas." },
    ],
  },
  {
    slug: "openvpn",
    section: "rede",
    title: "OpenVPN: cliente e servidor",
    difficulty: "intermediario",
    subtitle: "A VPN consagrada que roda em quase qualquer canto da rede, mesmo atrás de NAT hostil.",
    intro: `OpenVPN é a VPN clássica do mundo Linux: SSL/TLS, certificados (PKI inteira), suporte a UDP e TCP, capaz de furar redes corporativas chatas (porta 443/TCP, parece HTTPS). É bem mais lenta e pesada que WireGuard, mas em compatibilidade ela ainda é insubstituível em alguns cenários: providers comerciais que ainda só entregam .ovpn, redes que bloqueiam UDP, integração com Active Directory via radius.

No Gentoo, instale 'net-vpn/openvpn'. Ele traz dois init scripts: um genérico ('openvpn') e um por instância ('openvpn.<nome>'), o que permite rodar várias VPNs ao mesmo tempo (ex.: trabalho + privacidade). Cada instância lê '/etc/openvpn/<nome>.conf'. Se você só quer usar uma VPN comercial, o fluxo é: salvar o .ovpn em '/etc/openvpn/<nome>.conf', criar um arquivo com usuário/senha, simbolizar o init e habilitar.

Neste capítulo, vemos o uso típico de cliente (importar um .ovpn de provider), depois o setup mínimo de servidor (CA + cert + key + ta.key) e finalmente diagnóstico: log com '--verb 4', firewall liberando UDP/1194, MTU correto. Para a maioria dos leitores, a parte cliente é o que importa.`,
    codes: [
      { lang: "bash", code: `# Instalação:
sudo emerge --ask net-vpn/openvpn

# Layout dos arquivos (recomendado):
# /etc/openvpn/trabalho.conf       <- baixado do seu provedor
# /etc/openvpn/trabalho.auth       <- usuário e senha (chmod 600)
# /etc/init.d/openvpn.trabalho     <- symlink para openvpn` },
      { lang: "conf", code: `# /etc/openvpn/trabalho.conf — exemplo de cliente.
client
dev tun
proto udp
remote vpn.empresa.com 1194
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
auth-user-pass /etc/openvpn/trabalho.auth   # arquivo com 2 linhas
cipher AES-256-GCM
auth SHA256
verb 3

<ca>
-----BEGIN CERTIFICATE-----
... (cole o CA do provider) ...
-----END CERTIFICATE-----
</ca>` },
      { lang: "bash", code: `# Arquivo de credenciais:
sudo tee /etc/openvpn/trabalho.auth > /dev/null <<EOF
meu_usuario
minha_senha
EOF
sudo chmod 600 /etc/openvpn/trabalho.auth
sudo chown root:root /etc/openvpn/trabalho.auth

# Crie o symlink do init e habilite:
sudo ln -s openvpn /etc/init.d/openvpn.trabalho
sudo rc-update add openvpn.trabalho default
sudo rc-service openvpn.trabalho start` },
      { lang: "bash", code: `# Teste manual em foreground (excelente para diagnóstico):
sudo openvpn --config /etc/openvpn/trabalho.conf --verb 4
# Você verá:
# Initialization Sequence Completed   <- conectou
# Em outra janela:
ip addr show tun0
ip route` },
      { lang: "bash", code: `# Servidor — gerar PKI com easy-rsa.
sudo emerge --ask app-crypt/easy-rsa
cd /etc/openvpn
sudo cp -r /usr/share/easy-rsa .
cd easy-rsa
sudo ./easyrsa init-pki
sudo ./easyrsa build-ca nopass
sudo ./easyrsa build-server-full server nopass
sudo ./easyrsa build-client-full ana nopass
sudo ./easyrsa gen-dh
sudo openvpn --genkey secret /etc/openvpn/ta.key` },
      { lang: "conf", code: `# /etc/openvpn/server.conf — servidor mínimo.
port 1194
proto udp
dev tun
ca   /etc/openvpn/easy-rsa/pki/ca.crt
cert /etc/openvpn/easy-rsa/pki/issued/server.crt
key  /etc/openvpn/easy-rsa/pki/private/server.key
dh   /etc/openvpn/easy-rsa/pki/dh.pem
tls-auth /etc/openvpn/ta.key 0
server 10.8.0.0 255.255.255.0
push "redirect-gateway def1 bypass-dhcp"
push "dhcp-option DNS 1.1.1.1"
keepalive 10 120
cipher AES-256-GCM
auth SHA256
user nobody
group nobody
persist-key
persist-tun` },
    ],
    points: [
      "Cada VPN é uma 'instância' /etc/openvpn/<nome>.conf com seu init via symlink.",
      "Para clientes comerciais, o fluxo é: salvar .ovpn, criar .auth, habilitar serviço.",
      "TCP/443 ajuda a passar por firewalls corporativos hostis; UDP/1194 é o padrão.",
      "Sempre 'chmod 600' no arquivo de credenciais; senão é perda de senha sem sair de casa.",
      "Para servidor, easy-rsa gera CA, certs e dh em poucos comandos.",
      "tls-auth ('ta.key') adiciona uma camada extra contra DoS e port-scan.",
      "Armadilha comum: esquecer de liberar UDP/1194 no firewall do servidor.",
      "Iniciante comum: rodar OpenVPN sem 'persist-tun', a interface tun0 some no reconectar.",
    ],
    alerts: [
      { type: "warning", content: "OpenVPN é mais lento e tem mais overhead que WireGuard. Se você tem controle dos dois lados, considere WireGuard primeiro. OpenVPN é a escolha quando precisa de compatibilidade." },
      { type: "tip", content: "Para subir a VPN só sob demanda (não no boot), não habilite no runlevel. Use 'sudo openvpn --config /etc/openvpn/trabalho.conf' direto. Útil em notebook." },
      { type: "info", content: "DNS dentro da VPN: o 'push dhcp-option DNS' do servidor só funciona se o cliente tiver 'update-resolv-conf' ou similar (em /etc/openvpn/up.sh). No Gentoo, configure manualmente ou use systemd-resolved." },
    ],
  },
  {
    slug: "wireguard",
    section: "rede",
    title: "WireGuard: VPN moderna no kernel",
    difficulty: "intermediario",
    subtitle: "Pequena, rápida, pratica — em poucas linhas você levanta um túnel cifrado entre dois pontos.",
    intro: `WireGuard é a VPN moderna que finalmente acertou o equilíbrio entre simplicidade e performance. É um módulo do kernel (mainline desde 5.6), opera só em UDP, usa criptografia moderna fixa (Curve25519, ChaCha20, Poly1305, BLAKE2s) e tem uma config inteira que cabe em 10 linhas. Comparado ao OpenVPN, é uma ordem de magnitude mais simples e geralmente 2-3x mais rápido. Onde no IPSec você passa horas mexendo em IKE, no WireGuard você troca chaves públicas e está pronto.

No Gentoo, o pacote é 'net-vpn/wireguard-tools' (que traz 'wg' e 'wg-quick'). Você precisa também do módulo do kernel — 'CONFIG_WIREGUARD=m' no .config OU compilar via 'sys-kernel/wireguard-modules' se estiver em um kernel antigo. A USE flag 'modules' pode ajudar em alguns casos. O fluxo é: gerar par de chaves em cada lado, criar /etc/wireguard/wg0.conf, e levantar com 'wg-quick up wg0'.

Este capítulo cobre o setup mínimo de dois peers (notebook + servidor), explica como os campos AllowedIPs funcionam (eles atuam tanto como roteamento como filtro), mostra o init do OpenRC e como persistir endpoints dinâmicos com 'PersistentKeepalive'. Depois deste capítulo, montar uma VPN entre máquinas suas vai parar de ser projeto de fim de semana.`,
    codes: [
      { lang: "bash", code: `# Garantir o módulo no kernel:
zgrep CONFIG_WIREGUARD /proc/config.gz
# CONFIG_WIREGUARD=m   <- ideal

# Ferramentas em userspace:
sudo emerge --ask net-vpn/wireguard-tools

# Em kernel sem módulo nativo:
sudo emerge --ask net-vpn/wireguard-modules` },
      { lang: "bash", code: `# Gerar par de chaves (faça em CADA peer separadamente).
umask 077
wg genkey | tee privatekey | wg pubkey > publickey
cat privatekey publickey
# privatekey -> guarde, vai no [Interface] PrivateKey
# publickey  -> compartilhe, vai no [Peer] PublicKey do outro lado` },
      { lang: "conf", code: `# /etc/wireguard/wg0.conf — SERVIDOR.
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = ABCDEF...                # chave privada do servidor

# Notebook da Ana
[Peer]
PublicKey = XYZ123...                 # chave pública do notebook
AllowedIPs = 10.0.0.2/32              # IP que esse peer pode usar

# Servidor casa do Bruno
[Peer]
PublicKey = QWE456...
AllowedIPs = 10.0.0.3/32` },
      { lang: "conf", code: `# /etc/wireguard/wg0.conf — CLIENTE (notebook).
[Interface]
Address = 10.0.0.2/24
PrivateKey = NOTECHAVE...
DNS = 1.1.1.1                         # opcional, se quiser DNS via VPN

[Peer]
PublicKey = SERVERPUB...
Endpoint = vpn.exemplo.com:51820      # IP/porta do servidor
AllowedIPs = 10.0.0.0/24              # só rotas internas
# Para tunelar TUDO: AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25              # útil atrás de NAT` },
      { lang: "bash", code: `# Subir, descer e inspecionar com wg-quick:
sudo wg-quick up wg0
sudo wg-quick down wg0
sudo wg show
# saída inclui handshake mais recente, bytes RX/TX, endpoint atual.

# Habilitar no boot via OpenRC:
sudo rc-update add wg-quick.wg0 default
sudo rc-service wg-quick.wg0 start
# (algumas versões usam o init 'wg-quick'; em systemd: wg-quick@wg0)` },
      { lang: "bash", code: `# Diagnóstico rápido:
sudo wg show wg0 latest-handshakes      # zero = nunca conectou
ping 10.0.0.1                           # do cliente para o servidor
sudo tcpdump -i wg0 -n                  # tráfego dentro do túnel
sudo tcpdump -i eth0 udp port 51820 -n  # tráfego cifrado por fora` },
    ],
    points: [
      "WireGuard é módulo de kernel: rápido, sem userspace daemon próprio.",
      "Criptografia é fixa e moderna — não há negociação nem suíte fraca para escolher.",
      "Cada peer é identificado pela chave pública; AllowedIPs faz roteamento + filtro.",
      "Endpoint pode ser DNS dinâmico; PersistentKeepalive mantém NAT aberto.",
      "AllowedIPs = 0.0.0.0/0 (e ::/0) = full tunnel; sub-rede = split tunnel.",
      "wg-quick gera config de iface temporariamente; wg show inspeciona estado.",
      "Armadilha comum: trocar privatekey por publickey nos arquivos.",
      "Iniciante comum: AllowedIPs do peer servidor = 0.0.0.0/0 — vira loop de roteamento.",
    ],
    alerts: [
      { type: "tip", content: "Use 'umask 077' antes de gerar chaves. Caso contrário a privatekey nasce com permissões abertas e fica legível por outros usuários do sistema." },
      { type: "info", content: "PersistentKeepalive (geralmente 25s) só é necessário se o cliente está atrás de NAT e ninguém envia tráfego por um tempo. Para servidor com IP público, não é preciso." },
      { type: "warning", content: "Se o servidor recebe tráfego mas o cliente não consegue acessar a internet em modo full tunnel, falta NAT no servidor: 'iptables -t nat -A POSTROUTING -s 10.0.0.0/24 -o eth0 -j MASQUERADE'." },
      { type: "success", content: "Configurar uma VPN ponta-a-ponta no WireGuard leva literalmente 5 minutos por lado. Em ambientes empresariais que usam IPSec, isso costuma demorar dias." },
    ],
  },
  {
    slug: "dnsmasq",
    section: "rede",
    title: "dnsmasq: DNS e DHCP de bolso",
    difficulty: "intermediario",
    subtitle: "Servidor leve para sua LAN doméstica, lab ou rede de containers.",
    intro: `O 'dnsmasq' é um pequeno daemon que faz duas coisas com excelência: serve DNS local (cache + resolução de nomes da rede) e DHCP (entrega IPs para a LAN). Ele cabe em menos de 1 MB de memória, é configurável em um único arquivo e roda em qualquer hardware (Raspberry Pi, roteador, container). É a escolha perfeita para uma LAN doméstica ou um lab de virtualização.

No Gentoo é 'net-dns/dnsmasq'. As USE flags principais: 'dhcp' (servidor DHCP), 'tftp' (boot por rede), 'dnssec' (validar DNSSEC), 'ipv6' (incluir DHCPv6), 'script' (executar hooks). A configuração mora em '/etc/dnsmasq.conf' (ou em '/etc/dnsmasq.d/*.conf' se você ativar 'conf-dir'). Cada opção é uma linha 'chave=valor' simples.

Neste capítulo, montamos um cenário típico: dnsmasq como DNS principal da LAN, com cache, '/etc/hosts' override (para fixar nomes locais como 'router.lan' ou 'nas.lan') e DHCP entregando IPs em uma faixa. No final, vemos como integrar com o NetworkManager (que pode iniciar instâncias dnsmasq por interface) e como usar 'address=/dominio/IP' para criar redirecionamentos elegantes.`,
    codes: [
      { lang: "conf", code: `# /etc/portage/package.use/dnsmasq
net-dns/dnsmasq dhcp dnssec ipv6 -tftp -script

# Instalar e habilitar:
# sudo emerge --ask net-dns/dnsmasq
# sudo rc-update add dnsmasq default` },
      { lang: "conf", code: `# /etc/dnsmasq.conf — exemplo de DNS para a LAN doméstica.
# Servir só na interface da LAN (segurança):
interface=enp3s0
bind-interfaces
listen-address=127.0.0.1,192.168.1.1

# Encaminhar dúvidas externas para servidores upstream:
server=1.1.1.1
server=9.9.9.9
no-resolv               # ignora /etc/resolv.conf como upstream

# Caching:
cache-size=1000
neg-ttl=60
local-ttl=60

# Domínio local:
domain=lan
expand-hosts            # 'router' vira 'router.lan' automaticamente
local=/lan/             # nomes em .lan resolvem só localmente` },
      { lang: "conf", code: `# DHCP para a faixa 192.168.1.100-200, lease de 12h.
dhcp-range=192.168.1.100,192.168.1.200,255.255.255.0,12h
dhcp-option=option:router,192.168.1.1
dhcp-option=option:dns-server,192.168.1.1
dhcp-option=option:domain-search,lan

# Reserva fixa para um host (por MAC):
dhcp-host=aa:bb:cc:dd:ee:ff,nas,192.168.1.10

# Logs úteis:
log-queries
log-dhcp` },
      { lang: "conf", code: `# /etc/hosts — entradas locais que o dnsmasq também serve.
192.168.1.1   router
192.168.1.10  nas
192.168.1.20  printer
# Com 'expand-hosts', tudo isso ganha .lan automaticamente.` },
      { lang: "bash", code: `# Validar config sem reiniciar:
sudo dnsmasq --test
# 'dnsmasq: syntax check OK.'

sudo rc-service dnsmasq restart
sudo rc-service dnsmasq status

# Testar resolução:
dig @127.0.0.1 router.lan
nslookup nas.lan 127.0.0.1

# Ver leases ativos:
sudo cat /var/lib/misc/dnsmasq.leases` },
      { lang: "conf", code: `# Truques úteis:

# Bloqueio de domínio (vira 'NXDOMAIN'):
address=/ads.example.com/

# Apontar tudo de um domínio para um IP local:
address=/dev.local/192.168.1.50

# Encaminhar um domínio para outro DNS (split horizon):
server=/empresa.com/10.0.0.53` },
    ],
    points: [
      "dnsmasq = DNS cache + servidor autoritativo simples + DHCP, tudo em um daemon enxuto.",
      "Configuração em /etc/dnsmasq.conf, uma opção por linha.",
      "'no-resolv' impede loops com o resolv.conf do próprio sistema.",
      "'address=/dominio/' redireciona ou bloqueia domínios em uma linha.",
      "DHCP opcional via 'dhcp-range'; reservas por MAC com 'dhcp-host'.",
      "/var/lib/misc/dnsmasq.leases mostra quem está com qual IP agora.",
      "Armadilha comum: deixar 'bind-interfaces' fora e o dnsmasq escutar na WAN.",
      "Iniciante comum: DHCP do roteador comercial e dnsmasq brigando pela mesma faixa.",
    ],
    alerts: [
      { type: "warning", content: "Se você ativar DHCP no dnsmasq, DESLIGUE o DHCP do seu roteador comercial. Dois servidores DHCP na mesma rede causam conflitos de IP horríveis e intermitentes." },
      { type: "tip", content: "'log-queries' é ouro para debugar 'por que o DNS quebrou', mas gera muito log. Deixe ativo só durante o diagnóstico e desligue depois." },
      { type: "info", content: "O NetworkManager pode iniciar instâncias dnsmasq automaticamente em modo 'cache local'. Se você quer rodar seu próprio dnsmasq, desabilite essa integração em /etc/NetworkManager/NetworkManager.conf (dns=default)." },
      { type: "success", content: "Em uma LAN doméstica, dnsmasq + DHCP no roteador desligado costuma resolver 'porque o nome do printer não funciona' e melhora muito a latência DNS percebida." },
    ],
  },
  {
    slug: "bridge-vlans",
    section: "rede",
    title: "Bridges e VLANs com iproute2",
    difficulty: "avancado",
    subtitle: "Construindo switches virtuais e segmentando redes para virtualização e isolamento.",
    intro: `Quando você roda VMs (KVM/libvirt) ou containers em modo 'rede plana', precisa de uma 'bridge': um switch virtual no kernel que une várias interfaces — físicas e virtuais — no mesmo domínio L2. Quando precisa segmentar uma rede física em várias 'redes lógicas' usando o mesmo cabo, recorre a 'VLANs' (802.1Q): cada quadro ganha uma tag numérica e o switch só entrega para portas da mesma VLAN.

No Gentoo moderno, a ferramenta única para tudo isso é o 'iproute2' ('ip', 'bridge'). O 'brctl' (de bridge-utils) foi marcado como legado. Para persistir bridges/VLANs no boot, você usa o netifrc (em OpenRC) ou systemd-networkd / NetworkManager (em systemd). O kernel precisa de 'CONFIG_BRIDGE=y' e 'CONFIG_VLAN_8021Q=y'.

Neste capítulo, criamos uma bridge 'br0' e adicionamos eth0 + interfaces tap (para VMs); depois, criamos a interface VLAN 'eth0.10' (VID 10) e a colocamos em uma bridge separada para isolar uma rede de IoT, por exemplo. Mostramos como a config fica no '/etc/conf.d/net' do netifrc e como diagnosticar com 'bridge link', 'ip -d link' e 'ip neigh'. Esse é o conhecimento que você precisa para hospedar VMs sérias ou montar lab de redes.`,
    codes: [
      { lang: "bash", code: `# Pré-requisito do kernel:
zgrep -E "CONFIG_BRIDGE|CONFIG_VLAN_8021Q" /proc/config.gz
# CONFIG_BRIDGE=y
# CONFIG_VLAN_8021Q=y

# Ferramenta moderna unificada:
sudo emerge --ask sys-apps/iproute2` },
      { lang: "bash", code: `# Criar uma bridge manualmente (não persistente):
sudo ip link add name br0 type bridge
sudo ip link set dev br0 up

# Conectar eth0 à bridge (perde o IP da eth0!):
sudo ip addr flush dev enp3s0
sudo ip link set dev enp3s0 master br0

# IP vai na BRIDGE agora:
sudo ip addr add 192.168.1.50/24 dev br0
sudo ip route add default via 192.168.1.1` },
      { lang: "conf", code: `# /etc/conf.d/net — bridge persistente via netifrc (OpenRC).
bridge_br0="enp3s0"                # interfaces que entram na br0
brctl_br0="setfd 0 sethello 10 stp_state 0"

config_enp3s0="null"               # eth0 sem IP próprio
config_br0="192.168.1.50/24"
routes_br0="default via 192.168.1.1"

# Não esqueça os symlinks e a ordem de boot:
# cd /etc/init.d
# ln -s net.lo net.enp3s0
# ln -s net.lo net.br0
# rc-update add net.br0 default
# rc-config depend net.br0   # precisa subir DEPOIS de net.enp3s0` },
      { lang: "bash", code: `# Criar interface VLAN com VID 10 sobre eth0:
sudo ip link add link enp3s0 name enp3s0.10 type vlan id 10
sudo ip link set dev enp3s0.10 up
sudo ip addr add 10.10.10.1/24 dev enp3s0.10

# Combinando: VLAN 20 dentro da bridge br20 (rede IoT isolada):
sudo ip link add link enp3s0 name enp3s0.20 type vlan id 20
sudo ip link add name br20 type bridge
sudo ip link set dev enp3s0.20 master br20
sudo ip link set dev br20 up` },
      { lang: "bash", code: `# Inspeção e troubleshooting:
ip -d link show br0                # 'detail' mostra parâmetros bridge
bridge link                        # quem está em qual bridge
bridge fdb show                    # tabela MAC aprendida
ip -d link show enp3s0.10          # detalhes VLAN
ip neigh                           # tabela ARP

# Tcpdump em uma VLAN específica:
sudo tcpdump -i enp3s0.10 -n` },
      { lang: "conf", code: `# Bridge para VMs com libvirt (alternativa ao default 'virbr0' NAT).
# /etc/libvirt/qemu/networks/host-bridge.xml
<network>
  <name>host-bridge</name>
  <forward mode="bridge"/>
  <bridge name="br0"/>
</network>

# Aplicar:
# sudo virsh net-define host-bridge.xml
# sudo virsh net-autostart host-bridge
# sudo virsh net-start host-bridge` },
    ],
    points: [
      "Bridge = switch L2 dentro do kernel; ideal para VMs e containers em rede plana.",
      "VLAN (802.1Q) tagueia quadros para segmentar redes no mesmo cabo físico.",
      "iproute2 ('ip', 'bridge') é a ferramenta moderna; brctl é legado.",
      "IP vai na bridge, não na interface física que foi adicionada a ela.",
      "Em netifrc, use 'bridge_<name>=' e 'config_<iface>=\"null\"' para a porta.",
      "VLAN sobre VLAN é possível (Q-in-Q) mas raramente necessário.",
      "Armadilha comum: configurar IP na eth0 E na br0, gerando ARP confuso.",
      "Iniciante comum: criar bridge sem 'set up' e estranhar que nada funciona.",
    ],
    alerts: [
      { type: "warning", content: "Adicionar a interface física a uma bridge derruba momentaneamente a rede da máquina. Faça via console local na primeira vez ou agende um 'rc-config restart' com 'at' como rede de segurança." },
      { type: "info", content: "STP (Spanning Tree) está desabilitado por padrão (stp_state 0). Em ambientes com mais de uma bridge interconectada, ative STP para evitar loops L2." },
      { type: "tip", content: "Para virtualização, prefira 'macvtap' ou 'host-bridge' em vez de NAT (virbr0) sempre que precisar que as VMs sejam acessíveis na sua LAN. Performance melhor e configuração mais limpa." },
      { type: "danger", content: "Cuidado ao plugar uma porta de switch configurada com VLAN tagueada em uma máquina cuja interface física não tem VLAN configurada: nenhum tráfego passa, e debug demora horas se você não suspeitar disso." },
    ],
  },
];
