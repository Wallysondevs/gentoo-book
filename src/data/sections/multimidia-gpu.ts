import type { Chapter } from "../types";

export const chapters: Chapter[] = [
  {
    slug: "pulseaudio",
    section: "multimidia-gpu",
    title: "PulseAudio: o servidor de som clássico",
    difficulty: "intermediario",
    subtitle: "O daemon de áudio que dominou o Linux por mais de uma década e ainda aparece em muitos sistemas Gentoo.",
    intro: `O PulseAudio é um servidor de som que fica entre os seus programas e o ALSA (a camada de áudio do kernel). Ele resolve um problema chato: vários aplicativos quererem tocar som ao mesmo tempo, cada um com volume próprio, com saída para fone, caixa Bluetooth ou HDMI sem reiniciar nada. Por mais de dez anos foi a escolha padrão de praticamente toda distribuição.

No Gentoo, o PulseAudio se ativa por uma USE flag global ('pulseaudio') no '/etc/portage/make.conf'. Quando essa flag está ligada, dezenas de pacotes (firefox, vlc, mpv, qt) compilam com suporte a falar com o daemon. O pacote em si é 'media-sound/pulseaudio'. Em 2024 ele ainda funciona bem, mas está em modo de manutenção, sem novas features, e a comunidade Gentoo recomenda PipeWire para instalações novas.

Este capítulo serve para dois públicos: quem mantém um sistema legado e precisa entender o stack que já está rodando, e quem precisa diagnosticar problemas de áudio antes de migrar. Você vai aprender a inspecionar sinks (saídas), sources (entradas), trocar dispositivos no comando 'pactl' e usar o 'pavucontrol' como mixer gráfico de referência.`,
    codes: [
      { lang: "bash", code: `# Ativar PulseAudio globalmente em /etc/portage/make.conf:
USE="\${USE} pulseaudio -pipewire"

# Instalar o servidor e o mixer gráfico:
sudo emerge --ask media-sound/pulseaudio media-sound/pavucontrol` },
      { lang: "bash", code: `# Em sistemas OpenRC, o PulseAudio normalmente roda por usuário (modo --user),
# disparado pela primeira sessão gráfica. Para forçar manualmente:
pulseaudio --start
pulseaudio --check -v   # mostra se o daemon está vivo` },
      { lang: "bash", code: `# Listar saídas (sinks) e entradas (sources) disponíveis:
pactl list short sinks
pactl list short sources

# Saída típica:
# 0  alsa_output.pci-0000_00_1f.3.analog-stereo  ...  RUNNING
# 1  alsa_output.pci-0000_01_00.1.hdmi-stereo    ...  SUSPENDED` },
      { lang: "bash", code: `# Trocar a saída padrão (ex: para o HDMI):
pactl set-default-sink alsa_output.pci-0000_01_00.1.hdmi-stereo

# Ajustar volume do sink padrão (0 a 100%):
pactl set-sink-volume @DEFAULT_SINK@ 75%

# Mutar / desmutar:
pactl set-sink-mute @DEFAULT_SINK@ toggle` },
      { lang: "bash", code: `# Quando o áudio simplesmente para de funcionar, reiniciar o daemon resolve 80% dos casos:
pulseaudio -k        # mata o processo do usuário
pulseaudio --start   # sobe de novo

# Logs detalhados para investigar:
pulseaudio -vvv` },
      { lang: "conf", code: `# /etc/pulse/daemon.conf — ajustes globais comuns.
# Aumentar a qualidade da reamostragem (consome mais CPU):
resample-method = speex-float-5
default-sample-format = s24le
default-sample-rate = 48000
alternate-sample-rate = 44100` },
    ],
    points: [
      "PulseAudio fica entre os apps e o ALSA, permitindo mixagem por aplicativo.",
      "USE='pulseaudio' em make.conf ativa suporte na maioria dos pacotes multimídia.",
      "pactl é a faca-suíça em linha de comando; pavucontrol é o mixer gráfico.",
      "Sinks são saídas (caixas, fone, HDMI); sources são entradas (mics, line-in).",
      "PulseAudio está em modo manutenção — instalações novas devem ir para PipeWire.",
      "Armadilha comum: misturar USE='pulseaudio' com USE='pipewire' e ter dois servidores brigando.",
      "Armadilha: rodar pulseaudio como root; ele foi feito para rodar por usuário.",
      "Iniciante comum: esquecer que o usuário precisa estar no grupo 'audio'.",
    ],
    alerts: [
      { type: "warning", content: "Se você tem 'pulseaudio' e 'pipewire' ativos ao mesmo tempo nas USE flags, prepare-se para áudio cortado e dispositivos sumindo. Escolha um." },
      { type: "info", content: "O Gentoo não inclui mais o PulseAudio em perfis desktop novos por padrão desde 2023; PipeWire é a recomendação da equipe de áudio." },
      { type: "tip", content: "Adicione seu usuário aos grupos 'audio' e 'pulse-access': 'sudo gpasswd -a SEU_USUARIO audio && sudo gpasswd -a SEU_USUARIO pulse-access'. Faça logout e login depois." },
    ],
  },
  {
    slug: "pipewire",
    section: "multimidia-gpu",
    title: "PipeWire: o servidor de áudio (e vídeo) moderno",
    difficulty: "intermediario",
    subtitle: "O substituto unificado de PulseAudio e JACK, e a recomendação atual no Gentoo.",
    intro: `O PipeWire é a evolução natural do áudio no Linux. Ele faz tudo que o PulseAudio fazia, com latência baixa o suficiente para substituir também o JACK (servidor de áudio profissional usado em estúdios), e ainda lida com vídeo: captura de tela em Wayland e portais XDG passam por ele. Em uma única peça, você cobre desktop comum, produção musical e screencast.

No Gentoo a ativação é feita pela USE flag 'pipewire' (e 'sound-server' no pacote 'media-video/pipewire' para que ele assuma o papel do PulseAudio). O daemon vem acompanhado do 'wireplumber', que é o gerenciador de sessões responsável por decidir para onde cada stream vai (qual saída, qual prioridade, regras de roteamento). Sem wireplumber, o PipeWire roda mas não toma decisões automáticas.

Este capítulo mostra como ativar tudo do zero, garantir que o 'pipewire-pulse' substitua corretamente o PulseAudio (para que apps antigos nem percebam a troca), e diagnosticar com 'pw-cli' e 'pw-top'. Onde no PulseAudio você usava 'pactl', aqui você ainda pode usar 'pactl' (porque o pipewire-pulse implementa o protocolo) ou ferramentas nativas como 'wpctl'.`,
    codes: [
      { lang: "bash", code: `# /etc/portage/make.conf — ativar PipeWire e desativar PulseAudio:
USE="\${USE} pipewire -pulseaudio screencast"

# Instalar o trio essencial:
sudo emerge --ask media-video/pipewire media-video/wireplumber media-sound/pavucontrol

# Reconstruir mundo para propagar a USE flag em todos os apps:
sudo emerge --ask --update --deep --newuse @world` },
      { lang: "bash", code: `# Garantir que o pacote pipewire forneça o serviço de PulseAudio:
sudo euse -E sound-server -p media-video/pipewire   # se você usa euse
# ou edite /etc/portage/package.use/pipewire:
echo "media-video/pipewire sound-server pipewire-alsa" | \\
  sudo tee /etc/portage/package.use/pipewire

sudo emerge --ask --newuse media-video/pipewire` },
      { lang: "bash", code: `# Ativar serviços por usuário (OpenRC com elogind ou systemd-user):
# systemd:
systemctl --user enable --now pipewire pipewire-pulse wireplumber

# OpenRC: o pipewire sobe via XDG autostart no login gráfico.
# Verificar:
pgrep -a pipewire
pgrep -a wireplumber` },
      { lang: "bash", code: `# Inspecionar o estado em tempo real (top de áudio):
pw-top

# Listar nodes/sinks/sources:
wpctl status

# Trocar saída padrão pelo wpctl:
wpctl set-default 47   # ID do sink que aparece no status` },
      { lang: "bash", code: `# Compatibilidade: pactl ainda funciona por causa do pipewire-pulse.
pactl info
# A linha "Server Name: PulseAudio (on PipeWire 1.0.x)" confirma que
# você está falando com PipeWire por baixo do protocolo Pulse.` },
      { lang: "conf", code: `# ~/.config/wireplumber/wireplumber.conf.d/51-low-latency.conf
# Reduzir latência (útil para games/produção musical):
monitor.alsa.rules = [
  {
    matches = [ { node.name = "~alsa_output.*" } ]
    actions = {
      update-props = {
        api.alsa.period-size = 256
        api.alsa.headroom    = 1024
      }
    }
  }
]` },
    ],
    points: [
      "PipeWire substitui PulseAudio E JACK com o mesmo daemon.",
      "Wireplumber é o cérebro de roteamento; sem ele, o PipeWire roda burro.",
      "USE='pipewire sound-server pipewire-alsa' garante a troca completa do PulseAudio.",
      "wpctl, pw-cli e pw-top são as ferramentas nativas; pactl ainda funciona por compatibilidade.",
      "Suporte nativo a captura de tela em Wayland via xdg-desktop-portal.",
      "Latência baixa o suficiente para substituir JACK em estúdio (com tuning).",
      "Armadilha comum: deixar 'pulseaudio' e 'pipewire' juntos em USE — escolha apenas um.",
      "Armadilha: esquecer de habilitar serviço 'pipewire-pulse' e ver apps antigos sem som.",
      "Iniciante comum: não logar/relogar depois de ativar; sessão antiga continua na PulseAudio.",
    ],
    alerts: [
      { type: "success", content: "PipeWire é hoje a recomendação oficial do projeto Gentoo para áudio em desktop; perfis desktop modernos já o ativam por padrão." },
      { type: "tip", content: "Se você grava tela no Wayland (OBS, screensharing no Discord/Zoom), o suporte a screencast só funciona com PipeWire + xdg-desktop-portal. Não tente com PulseAudio puro." },
      { type: "warning", content: "Após mudar USE flags de áudio, faça 'emerge -auDN @world'. Apps que ficaram com flag antiga vão falar com o servidor errado e parecer 'mudos'." },
      { type: "info", content: "Para uso profissional de áudio (DAWs como Ardour, Reaper via wine), instale também 'media-video/pipewire' com USE='jack-sdk' e use 'pw-jack' para rodar apps JACK por cima do PipeWire." },
    ],
  },
  {
    slug: "alsa",
    section: "multimidia-gpu",
    title: "ALSA: a base que sempre está lá",
    difficulty: "iniciante",
    subtitle: "A camada de áudio do próprio kernel Linux, fundação de tudo que toca som no seu Gentoo.",
    intro: `ALSA significa Advanced Linux Sound Architecture. É um conjunto de drivers e bibliotecas que vive dentro do kernel e expõe sua placa de som para o resto do sistema. Tudo em Linux que toca áudio — PulseAudio, PipeWire, JACK, mpv, jogos — em algum momento, lá no fundo, conversa com ALSA. Entender a base ajuda quando o servidor de som não sobe e você precisa testar 'no osso'.

No Gentoo, o ALSA quase nunca exige instalação manual: o kernel vem com os drivers (você habilita em 'make menuconfig' na seção 'Device Drivers > Sound card support'). O pacote útil é 'media-sound/alsa-utils', que traz utilitários como 'alsamixer' (mixer em terminal), 'aplay' (toca um WAV cru) e 'speaker-test' (gera ruído rosa para conferir caixas). É o seu kit de diagnóstico.

Quando algo dá errado e você não tem certeza se o problema é no servidor de som ou no driver, a sequência clássica é: 'aplay' direto pra ALSA, ignorando todo o resto. Se tocar, o kernel está bem e o problema é PulseAudio/PipeWire. Se não tocar, o problema é mais embaixo (driver, módulo, mute por hardware). Esse capítulo te dá esse reflexo.`,
    codes: [
      { lang: "bash", code: `# Instalar utilitários ALSA:
sudo emerge --ask media-sound/alsa-utils

# Listar placas de som detectadas pelo kernel:
aplay -l
# Saída típica:
# **** List of PLAYBACK Hardware Devices ****
# card 0: PCH [HDA Intel PCH], device 0: ALC295 Analog [ALC295 Analog]` },
      { lang: "bash", code: `# Mixer em terminal (use F6 para escolher placa, M para mute, setas para volume):
alsamixer

# Salvar / restaurar o estado dos controles:
sudo alsactl store
sudo alsactl restore` },
      { lang: "bash", code: `# Teste rápido: tocar ruído rosa nos canais um por um.
speaker-test -c 2 -t pink -l 1
# Você deve ouvir 'esquerdo' e 'direito' alternando.

# Tocar um arquivo WAV diretamente:
aplay /usr/share/sounds/alsa/Front_Center.wav` },
      { lang: "bash", code: `# Descobrir qual driver de kernel está em uso:
lsmod | grep snd
# Saída comum:
# snd_hda_intel        49152  3
# snd_hda_codec_realtek  ...` },
      { lang: "conf", code: `# /etc/asound.conf — escolher placa padrão quando você tem várias.
# Aqui forçamos o card 1 (ex: USB DAC) como saída padrão:
defaults.pcm.card 1
defaults.ctl.card 1` },
      { lang: "bash", code: `# Habilitar ALSA no kernel (se compilação manual):
# Device Drivers --->
#   Sound card support --->
#     Advanced Linux Sound Architecture --->
#       <M> PCI sound devices --->
#         <M> Intel HD Audio
# Após mudar: make && make modules_install && make install` },
    ],
    points: [
      "ALSA vive no kernel; servidores de som apenas conversam com ele.",
      "alsamixer é seu primeiro lugar para checar volumes e mute por hardware.",
      "aplay -l lista as placas detectadas; se não aparecer, o módulo não carregou.",
      "speaker-test confirma se a saída física funciona, isolando problema de servidor.",
      "alsactl store/restore preserva seus volumes entre reboots.",
      "Em 'make menuconfig', habilite o codec específico da sua placa, não só o genérico.",
      "Armadilha comum: caixa muda por mute escondido no alsamixer (a letra 'MM' embaixo do controle).",
      "Iniciante comum: esquecer que o usuário precisa estar no grupo 'audio'.",
    ],
    alerts: [
      { type: "info", content: "Onde no Windows você pensa em 'driver de áudio Realtek', no Linux você pensa no módulo 'snd_hda_codec_realtek' carregado pelo kernel. Mesma coisa, nomes diferentes." },
      { type: "tip", content: "Quando o áudio sumir, antes de qualquer coisa: rode 'alsamixer', aperte F6, escolha a placa certa e veja se algum canal está com 'MM' (muted). Resolve mais casos do que parece." },
      { type: "warning", content: "Compilar o kernel sem habilitar o codec específico da sua placa resulta em 'aplay -l' sem dispositivos. Use 'lspci -k | grep -i audio' para descobrir qual driver precisa." },
    ],
  },
  {
    slug: "bluetooth-audio",
    section: "multimidia-gpu",
    title: "Áudio Bluetooth no Gentoo",
    difficulty: "intermediario",
    subtitle: "Pareando fones e caixas Bluetooth com bluez + PipeWire para A2DP de qualidade.",
    intro: `Áudio Bluetooth no Linux passou a ser uma experiência decente nos últimos anos. O segredo é o casamento entre 'net-wireless/bluez' (a stack Bluetooth oficial do kernel/userspace) e PipeWire, que substituiu o antigo 'pulseaudio-module-bluetooth' com suporte nativo a A2DP, AAC, aptX e LDAC. Sem essa combinação, você fica preso no perfil HSP/HFP de 1990 (qualidade telefônica).

No Gentoo a receita é direta: instalar 'net-wireless/bluez' com USE flags adequadas, habilitar o serviço 'bluetooth' no init, garantir que o PipeWire tenha o módulo de Bluetooth ativo (USE='bluetooth' em 'media-video/pipewire'), e parear pelo 'bluetoothctl' ou pelo applet do seu DE. Depois disso, o dispositivo aparece como sink no 'wpctl status' como qualquer outro.

Atenção a um detalhe pouco documentado: para AAC e aptX-HD funcionarem, você precisa do PipeWire compilado com 'extra' (que puxa codecs proprietários) e do 'wireplumber' atualizado. Sem isso, o dispositivo conecta no codec SBC básico e o som fica chocho. Este capítulo guia o pareamento e mostra como conferir qual codec está realmente em uso.`,
    codes: [
      { lang: "bash", code: `# /etc/portage/package.use/bluetooth
net-wireless/bluez   -extra-tools
media-video/pipewire bluetooth extra
media-video/wireplumber

sudo emerge --ask net-wireless/bluez media-video/pipewire media-video/wireplumber` },
      { lang: "bash", code: `# Habilitar o serviço (OpenRC):
sudo rc-update add bluetooth default
sudo rc-service bluetooth start

# systemd:
sudo systemctl enable --now bluetooth.service

# Adicionar usuário ao grupo:
sudo gpasswd -a \$USER plugdev
# (logout/login depois)` },
      { lang: "bash", code: `# Pareamento interativo via terminal:
bluetoothctl
# Dentro do prompt:
power on
agent on
default-agent
scan on               # aguarde aparecer seu dispositivo (ex: 30:21:12:AB:CD:EF)
pair 30:21:12:AB:CD:EF
trust 30:21:12:AB:CD:EF
connect 30:21:12:AB:CD:EF
quit` },
      { lang: "bash", code: `# Conferir se o dispositivo virou sink no PipeWire:
wpctl status | grep -i bluez
# Exemplo:
#  *  82. WH-1000XM4   [vol: 0.65]
#         bluez_output.30_21_12_AB_CD_EF.a2dp-sink

# Forçar o sink padrão:
wpctl set-default 82` },
      { lang: "bash", code: `# Descobrir qual codec o link está usando:
pactl list sinks | grep -A2 -i bluez | grep -i codec
# Saída esperada:
# api.bluez5.codec = "aac"   (ou aptx_hd, ldac, sbc, sbc_xq)` },
      { lang: "conf", code: `# ~/.config/wireplumber/wireplumber.conf.d/50-bluez.conf
# Forçar a ordem de preferência de codecs (LDAC > aptX-HD > AAC > SBC-XQ > SBC):
monitor.bluez.properties = {
  bluez5.enable-sbc-xq = true
  bluez5.enable-msbc   = true
  bluez5.enable-hw-volume = true
  bluez5.codecs        = [ ldac aptx_hd aac sbc_xq sbc ]
  bluez5.roles         = [ a2dp_sink a2dp_source bap_sink bap_source ]
}` },
    ],
    points: [
      "PipeWire substituiu definitivamente o pulseaudio-module-bluetooth.",
      "USE='bluetooth extra' em pipewire é o que destrava AAC/aptX/LDAC.",
      "bluetoothctl é o caminho universal de pareamento; DEs costumam ter applets.",
      "Sem 'trust', toda vez que o fone reconectar você vai precisar autorizar de novo.",
      "Confira o codec real em 'pactl list sinks'; SBC puro é o caso ruim.",
      "Adicione o usuário ao grupo 'plugdev' para gerenciar o adaptador sem root.",
      "Armadilha comum: ouvir microfone forçar perfil HSP e qualidade despencar; troque para A2DP só.",
      "Iniciante comum: esquecer de iniciar o serviço 'bluetooth' antes de tentar parear.",
    ],
    alerts: [
      { type: "tip", content: "No Gentoo, antes de comprar fone Bluetooth caro, confira na wiki se o chipset do seu adaptador suporta o codec desejado. Adaptador USB barato com Realtek genérico raramente passa de SBC." },
      { type: "warning", content: "Se você usar o microfone do fone (ex: chamada Discord), o sistema costuma cair para HSP/HFP, e a música pausa ou fica horrível. Some perda de A2DP a custo do mic." },
      { type: "info", content: "LDAC e aptX-HD precisam de licença e são incluídos via 'extra' do PipeWire. AAC funciona praticamente em qualquer instalação atual." },
      { type: "danger", content: "Pareie só dispositivos confiáveis: vulnerabilidades antigas do BlueZ permitiram execução remota. Mantenha 'net-wireless/bluez' sempre atualizado com 'emerge -auDN @world'." },
    ],
  },
  {
    slug: "codecs-video",
    section: "multimidia-gpu",
    title: "Codecs de vídeo: tornando vídeos tocáveis",
    difficulty: "intermediario",
    subtitle: "USE flags e pacotes para que MP4, MKV, WebM e companhia abram em qualquer player.",
    intro: `Um arquivo de vídeo é um contêiner (MKV, MP4, WebM) que carrega dentro um ou mais streams codificados (H.264, H.265, VP9, AV1, AAC, Opus). Para tocar, o seu player precisa de um decoder para cada codec usado. No Gentoo, essa capacidade não vem 'tudo ligado' como em distros prontas: você ativa via USE flags em 'media-video/ffmpeg', que é a biblioteca por trás de quase todos os players (mpv, vlc, firefox, mpv embedded em chromium).

A USE flag mais importante é 'x264' (decoder e encoder de H.264, o codec mais comum), seguida de 'x265' (HEVC), 'vpx' (VP8/VP9, usado pelo YouTube e WebRTC) e 'aom' (AV1, o codec moderno que está crescendo). Para áudio, 'mp3', 'opus', 'vorbis' e 'aac' cobrem 99% dos casos. Sem essas flags ativas no ffmpeg, vídeos abrem 'sem som' ou simplesmente falham.

Este capítulo te ensina a configurar o ffmpeg de forma prática, recompilar o que precisa, e diagnosticar quando um vídeo não toca por falta de codec versus problema de driver de vídeo. A diferença entre as duas situações guia toda a investigação.`,
    codes: [
      { lang: "bash", code: `# /etc/portage/package.use/ffmpeg
media-video/ffmpeg x264 x265 vpx aom mp3 opus vorbis dav1d \\
                   svt-av1 webp libass alsa pulseaudio fdk \\
                   theora speex bluray network` },
      { lang: "bash", code: `# Aplicar e recompilar o ffmpeg:
sudo emerge --ask --newuse media-video/ffmpeg

# Recompilar quem depende dele (mpv, vlc, etc) para usar os novos codecs:
sudo emerge --ask @preserved-rebuild
sudo emerge --ask --update --deep --newuse @world` },
      { lang: "bash", code: `# Conferir quais decoders/encoders o ffmpeg instalado realmente tem:
ffmpeg -decoders | grep -E 'h264|hevc|vp9|av1'
ffmpeg -encoders | grep -E 'x264|x265|libvpx|libaom'

# Saída útil (D = decoder, E = encoder, V = vídeo):
# DEV.LS h264          H.264 / AVC / MPEG-4 AVC (decoders: h264 h264_v4l2m2m)
# DEV.L. hevc          H.265 / HEVC (decoders: hevc)` },
      { lang: "bash", code: `# Identificar codecs DENTRO de um arquivo problemático:
ffprobe meu_video.mkv

# Saída relevante:
# Stream #0:0: Video: hevc (Main 10), yuv420p10le, 3840x2160, 60 fps
# Stream #0:1: Audio: opus, 48000 Hz, stereo, fltp` },
      { lang: "bash", code: `# Tocar com mpv (excelente para diagnosticar):
mpv --hwdec=auto-safe --vo=gpu meu_video.mkv

# Saída interessante mostra qual decoder e hwaccel está em uso:
# Using hardware decoding (vaapi).
# VO: [gpu] 3840x2160 yuv420p10le` },
      { lang: "bash", code: `# Player gráfico de referência:
sudo emerge --ask media-video/mpv media-video/vlc

# Para o navegador tocar vídeos H.264/AAC do YouTube/Netflix:
# em make.conf garanta:
USE="\${USE} x264 aac vpx"   # firefox/chromium recompilam com isso` },
    ],
    points: [
      "ffmpeg é a biblioteca de codecs por trás de quase todo player Linux.",
      "x264, x265, vpx e aom são as USE flags fundamentais para vídeo moderno.",
      "Após mudar USE de ffmpeg, rode '@preserved-rebuild' para players consumirem os novos.",
      "ffprobe revela exatamente quais codecs estão dentro do arquivo.",
      "mpv mostra qual decoder usou; ótimo para confirmar suporte real.",
      "fdk-aac dá AAC de melhor qualidade (mas é licença restritiva).",
      "Armadilha comum: instalar mpv/vlc primeiro, ffmpeg sem flags, e ver erros bizarros.",
      "Iniciante comum: confundir contêiner (MKV) com codec (HEVC) — são coisas diferentes.",
    ],
    alerts: [
      { type: "info", content: "AV1 é o codec do futuro (royalty-free, aprovado por Google, Netflix, YouTube). Ative 'aom' e 'dav1d' para encoder e decoder rápido respectivamente." },
      { type: "warning", content: "A USE 'fdk' usa código com licença Fraunhofer; tecnicamente exige 'ACCEPT_LICENSE' adequado. Verifique se cumpre seu uso." },
      { type: "tip", content: "Sempre use 'mpv --hwdec=auto-safe' antes de afirmar que um vídeo 'travou'. Sem aceleração de GPU, 4K HEVC engasga até em CPU forte." },
      { type: "success", content: "Com ffmpeg bem configurado, qualquer player do sistema (firefox, telegram, gimp, blender) ganha automaticamente os mesmos codecs. Dependência única, ganho geral." },
    ],
  },
  {
    slug: "vaapi-vdpau",
    section: "multimidia-gpu",
    title: "Aceleração de vídeo: VA-API e VDPAU",
    difficulty: "avancado",
    subtitle: "Decodificar vídeos pela GPU para não cozinhar a CPU em 4K HEVC e AV1.",
    intro: `Decodificar vídeo via CPU funciona, mas para tudo acima de 1080p H.264 começa a doer: a CPU vira ventoinha e a bateria do notebook evapora. Toda GPU moderna tem blocos dedicados a decodificar formatos comuns (H.264, HEVC, VP9, AV1), e o Linux expõe esses blocos por duas APIs: VA-API (mais nova, padrão atual) e VDPAU (legado, ainda usado por algumas Nvidia).

No Gentoo a receita é em três partes. Primeiro, ative USE flags 'vaapi' e 'vdpau' globalmente em 'make.conf' para que ffmpeg, mpv, vlc e firefox sejam compilados com suporte. Segundo, instale o driver VA-API correto para sua GPU: 'media-libs/intel-media-driver' (Intel Gen8+), 'x11-libs/libva-intel-driver' (Intel mais antigo) ou nada extra para AMD (já vem no mesa). Terceiro, configure a variável 'LIBVA_DRIVER_NAME' se a autodetecção falhar.

Diagnóstico rápido: 'vainfo' lista perfis suportados; 'vdpauinfo' faz o mesmo para VDPAU. Se a GPU não aparecer nessa lista, o driver não está carregado. Quando aparece mas o player não usa, o problema é o player não ter sido compilado com a USE certa. Este capítulo cobre os dois lados.`,
    codes: [
      { lang: "bash", code: `# /etc/portage/make.conf — ativar globalmente:
USE="\${USE} vaapi vdpau X wayland"

VIDEO_CARDS="amdgpu radeonsi"   # exemplo AMD; ajuste para sua GPU
# Para Intel: VIDEO_CARDS="intel iris"
# Para Nvidia proprietário: VIDEO_CARDS="nvidia"` },
      { lang: "bash", code: `# Drivers VA-API por GPU:
# Intel Gen8 (Broadwell) ou mais novo:
sudo emerge --ask media-libs/intel-media-driver

# Intel mais antigo (Haswell e abaixo):
sudo emerge --ask x11-libs/libva-intel-driver

# AMD: já está no mesa, não precisa instalar nada extra.
# Nvidia (open): use libva-vdpau-driver como ponte.` },
      { lang: "bash", code: `# Diagnóstico: o que a GPU sabe decodificar?
vainfo
# Trecho típico:
# vainfo: Driver version: Intel iHD driver for Intel(R) Gen Graphics - 24.1.0
# VAProfileH264Main               : VAEntrypointVLD
# VAProfileHEVCMain10             : VAEntrypointVLD
# VAProfileAV1Profile0            : VAEntrypointVLD

vdpauinfo   # equivalente para VDPAU (Nvidia)` },
      { lang: "bash", code: `# Forçar driver quando a autodetecção falha:
export LIBVA_DRIVER_NAME=iHD     # Intel novo
# ou
export LIBVA_DRIVER_NAME=radeonsi  # AMD
# ou
export VDPAU_DRIVER=nvidia        # Nvidia proprietário

# Persistir em ~/.profile ou /etc/environment.` },
      { lang: "bash", code: `# Tocar usando aceleração no mpv:
mpv --hwdec=vaapi --vo=gpu video_4k.mkv
# A linha "Using hardware decoding (vaapi)" no log confirma o uso.

# Equivalente em VLC: Tools > Preferences > Input/Codecs > Hardware-accelerated decoding = VA-API.` },
      { lang: "bash", code: `# Habilitar aceleração no Firefox (about:config):
# media.ffmpeg.vaapi.enabled = true
# media.av1.enabled = true
# gfx.x11-egl.force-enabled = true   (necessário para VA-API com X11)

# Conferir em about:support: 'Compositing' deve mostrar WebRender e Hardware Video Decoding 'Yes'.` },
    ],
    points: [
      "VA-API é o padrão atual; VDPAU sobrevive principalmente em Nvidia legado.",
      "USE='vaapi' precisa estar em ffmpeg, mpv, vlc, chromium/firefox para fazer efeito.",
      "vainfo lista perfis suportados; ausência da sua GPU = driver não carregado.",
      "Intel Gen8+ usa 'iHD' (intel-media-driver); mais antigo usa 'i965' (libva-intel-driver).",
      "AMD com mesa moderno tem aceleração 'de graça', sem pacote extra.",
      "Nvidia precisa de 'libva-vdpau-driver' para apps que só falam VA-API.",
      "Armadilha comum: ativar a flag mas esquecer de recompilar @world; aplicações ficam sem o módulo.",
      "Iniciante comum: confundir VIDEO_CARDS com USE flag; são coisas diferentes em make.conf.",
      "Armadilha: rodar Wayland em Intel sem 'gfx.x11-egl' configurado; firefox derruba a aceleração.",
    ],
    alerts: [
      { type: "tip", content: "Use 'mpv --hwdec=auto-safe' como padrão — ele só ativa aceleração quando o driver é reconhecidamente estável, evitando crashes em GPUs antigas." },
      { type: "info", content: "AV1 hardware-decoded só existe em Intel Tiger Lake+, AMD RDNA2+, e Nvidia RTX 30+. Em GPU mais antiga, AV1 sempre cai para CPU (e dá trabalho)." },
      { type: "warning", content: "VDPAU está deprecado upstream. Se sua GPU é nova, evite-o e use VA-API direto." },
      { type: "danger", content: "Versões muito recentes de mesa às vezes quebram aceleração em GPUs antigas. Antes de atualizar mesa em produção, leia as news ('eselect news read')." },
    ],
  },
  {
    slug: "vulkan",
    section: "multimidia-gpu",
    title: "Vulkan: o gráfico moderno",
    difficulty: "intermediario",
    subtitle: "API de baixo overhead que substitui o OpenGL em jogos modernos, DXVK e emuladores.",
    intro: `Vulkan é a API gráfica moderna que substituiu o OpenGL em jogos sérios e em camadas de tradução como DXVK (que faz Direct3D 11 do Windows rodar via Vulkan no Linux, base do Proton/Steam Play). Diferente do OpenGL, Vulkan dá controle explícito sobre GPU, threading e memória — mais difícil de programar, mas muito mais rápido.

No Gentoo, ativar Vulkan é principalmente uma USE flag global ('vulkan') somada ao 'vulkan-loader' (a biblioteca que despacha chamadas para o driver certo) e a um ICD (Installable Client Driver) por GPU: 'mesa' já entrega 'radv' (AMD) e 'anv' (Intel) quando compilado com 'vulkan'; Nvidia traz seu ICD junto com 'nvidia-drivers'. Sem ICD, o loader carrega mas nada renderiza.

A ferramenta de diagnóstico canônica é 'vulkaninfo'. Se ela imprime sua GPU em 'GPU id : 0', está tudo certo. Se diz 'No Vulkan capable devices found', falta ICD ou driver. Este capítulo cobre instalação, diagnóstico e os três truques de tuning que quase ninguém faz: validation layers desligadas em produção, MESA_VK_VERSION_OVERRIDE para destravar features, e DXVK_HUD para medir FPS.`,
    codes: [
      { lang: "bash", code: `# /etc/portage/make.conf
USE="\${USE} vulkan"
VIDEO_CARDS="amdgpu radeonsi"   # ajuste

# Pacotes essenciais:
sudo emerge --ask media-libs/vulkan-loader media-libs/vulkan-tools \\
                  media-libs/mesa dev-util/vulkan-headers` },
      { lang: "bash", code: `# Verificar instalação:
vulkaninfo --summary
# Trecho útil:
# GPU id = 0 (AMD Radeon RX 6700 XT (RADV NAVI22))
# apiVersion = 1.3.275

# Listar dispositivos:
vulkaninfo | grep -E 'deviceName|driverName'` },
      { lang: "bash", code: `# ICDs por GPU:
# AMD: 'radv' vem com mesa USE='vulkan'
# Intel: 'anv' vem com mesa USE='vulkan'
# Nvidia (proprietário): vem em x11-drivers/nvidia-drivers
# Nvidia (open NVK): mesa USE='vulkan video_cards_nouveau'

equery uses media-libs/mesa | grep vulkan` },
      { lang: "bash", code: `# Validation layers — só ative em DESENVOLVIMENTO, custam FPS:
sudo emerge --ask media-libs/vulkan-validation-layers
export VK_INSTANCE_LAYERS=VK_LAYER_KHRONOS_validation
vulkaninfo | head` },
      { lang: "bash", code: `# Forçar versão de API (útil para destravar features em GPU mais antiga via radv):
export MESA_VK_VERSION_OVERRIDE=1.3
# Para diagnosticar problema em jogo:
export RADV_DEBUG=info       # AMD
export ANV_DEBUG=info        # Intel
export VK_LOADER_DEBUG=all   # loader genérico` },
      { lang: "bash", code: `# DXVK HUD (em jogos via wine/proton) mostra FPS, GPU/CPU usage:
DXVK_HUD=fps,gpuload,memory wine jogo.exe

# Mostrar tudo:
DXVK_HUD=full wine jogo.exe` },
    ],
    points: [
      "Vulkan substituiu OpenGL como API gráfica padrão para jogos novos.",
      "DXVK/Proton dependem totalmente de Vulkan funcional para rodar jogos Windows.",
      "ICDs específicos: radv (AMD), anv (Intel), nvidia (proprietário), NVK (open).",
      "vulkaninfo --summary é o teste de fumaça definitivo.",
      "Validation layers ativadas em jogo viram lentidão imediata; só em dev.",
      "DXVK_HUD=fps é uma das ferramentas mais úteis para benchmark caseiro.",
      "Armadilha comum: USE='vulkan' em mesa esquecida, jogos não acham GPU.",
      "Iniciante comum: misturar drivers (mesa + nvidia proprietário) e ter dois ICDs brigando.",
    ],
    alerts: [
      { type: "success", content: "RADV (driver Vulkan AMD do mesa) hoje supera o driver Vulkan oficial da AMD (AMDVLK) na maioria dos benchmarks. Use radv sem medo." },
      { type: "tip", content: "DXVK_HUD=fps,frametimes na sua linha de comando do Steam ('Set launch options') te dá FPS overlay em qualquer jogo." },
      { type: "warning", content: "NVK (driver Vulkan open para Nvidia) ainda é experimental em 2024; use o proprietário para gaming sério em GPUs Nvidia." },
      { type: "info", content: "Para jogar em multilib (jogos 32-bit como muitos via Proton), garanta ABI_X86='64 32' e 'media-libs/vulkan-loader' compilado para ambas as ABIs." },
    ],
  },
  {
    slug: "opengl",
    section: "multimidia-gpu",
    title: "OpenGL: ainda relevante",
    difficulty: "intermediario",
    subtitle: "A API gráfica clássica, eselect opengl e o stack libglvnd que organiza tudo.",
    intro: `Mesmo com Vulkan dominando jogos novos, OpenGL ainda move tudo o que é antigo (a maior parte do catálogo de jogos, GIMP, Blender em modo legado, X11 inteiro, KDE, GNOME, terminais com aceleração). Saber configurar é obrigatório.

No Gentoo, a peça central é o 'libglvnd' (GL Vendor-Neutral Dispatch), uma biblioteca de despacho que permite múltiplos drivers OpenGL coexistirem (essencial em sistemas com Intel + Nvidia ou para PRIME render offload). Antigamente o 'eselect opengl' alternava manualmente entre implementações; com libglvnd isso se resolve sozinho. Você ainda usa 'eselect opengl list' para diagnosticar.

A USE flag relevante é 'opengl' (quase sempre default-on em desktop) e 'gles2' para GL ES (móvel, mas usado em compositores Wayland modernos). Sua GPU obtém OpenGL via mesa (Intel/AMD) ou via blob proprietário (Nvidia). Este capítulo mostra como diagnosticar a versão e o vendor com 'glxinfo' e 'eglinfo', e o que fazer quando o sistema 'só renderiza no software' (chamado llvmpipe), sintoma clássico de driver não carregado.`,
    codes: [
      { lang: "bash", code: `# Instalar utilitários de diagnóstico:
sudo emerge --ask x11-apps/mesa-progs

# Versão e renderer atual:
glxinfo | grep -E 'OpenGL vendor|OpenGL renderer|OpenGL version'
# Saída em GPU AMD funcionando:
# OpenGL vendor string: AMD
# OpenGL renderer string: AMD Radeon RX 6700 XT (radeonsi, navi22, ...)
# OpenGL version string: 4.6 (Compatibility Profile) Mesa 24.0.0` },
      { lang: "bash", code: `# Se renderer mostra 'llvmpipe', você está em SOFTWARE.
# Significa: driver de GPU não carregou. Investigue:
dmesg | grep -iE 'drm|amdgpu|i915|nvidia'
lsmod | grep -E 'amdgpu|i915|nvidia'
lspci -k | grep -A2 VGA` },
      { lang: "bash", code: `# eselect opengl ainda existe mas hoje é informativo:
eselect opengl list
# Saída:
#  Available OpenGL implementations:
#  [1]   xorg-x11 *
# Em sistemas modernos com libglvnd, há só um e isso é normal.` },
      { lang: "bash", code: `# Para Wayland: eglinfo é o equivalente do glxinfo.
sudo emerge --ask media-libs/mesa-utils  # se não tiver
eglinfo | grep -E 'EGL vendor|Renderer|OpenGL ES profile version'` },
      { lang: "bash", code: `# Forçar uso da GPU discreta em sistema híbrido (PRIME render offload):
# AMD/Intel:
DRI_PRIME=1 glxinfo | grep "OpenGL renderer"

# Nvidia:
__NV_PRIME_RENDER_OFFLOAD=1 __GLX_VENDOR_LIBRARY_NAME=nvidia \\
  glxinfo | grep "OpenGL renderer"` },
      { lang: "bash", code: `# /etc/portage/make.conf — garantir que mesa compile com tudo necessário:
USE="\${USE} egl gles2 opengl wayland X dri3"
VIDEO_CARDS="intel iris"   # exemplo Intel moderno

sudo emerge --ask --newuse media-libs/mesa` },
    ],
    points: [
      "OpenGL ainda é base de jogos antigos, X11 e desktops Linux.",
      "libglvnd permite múltiplos drivers OpenGL coexistirem sem conflito.",
      "glxinfo é o diagnóstico canônico em X11; eglinfo em Wayland.",
      "Renderer 'llvmpipe' = software puro, sinal de driver de GPU faltando.",
      "VIDEO_CARDS no make.conf controla quais drivers o mesa compila.",
      "DRI_PRIME=1 e __NV_PRIME_RENDER_OFFLOAD=1 selecionam GPU em sistemas híbridos.",
      "Armadilha comum: instalar mesa sem USE='opengl' e ter desktop em software rendering.",
      "Iniciante comum: confundir versão OpenGL Core (4.6) com Compatibility — apps antigas precisam Compatibility.",
    ],
    alerts: [
      { type: "info", content: "Mesa 24+ já entrega OpenGL 4.6 completo em Intel, AMD e até em Nvidia via NVK/Zink. Drivers proprietários da Nvidia também entregam 4.6 em qualquer placa GeForce 900+." },
      { type: "tip", content: "Se você precisa de OpenGL em GPU sem suporte (servidor, container), instale mesa com USE='llvm' para llvmpipe acelerado por CPU; é lento mas funciona." },
      { type: "warning", content: "Após troca de VIDEO_CARDS no make.conf, é obrigatório recompilar mesa: 'emerge -auDN media-libs/mesa'. Sem isso, a flag nova não tem efeito." },
    ],
  },
  {
    slug: "jogos-steam",
    section: "multimidia-gpu",
    title: "Steam e Proton no Gentoo",
    difficulty: "avancado",
    subtitle: "Instalando Steam, habilitando multilib e jogando títulos Windows via Proton.",
    intro: `Steam virou viável em Linux por causa do Proton — uma camada de compatibilidade da Valve baseada em wine + DXVK + VKD3D que faz milhares de jogos Windows rodarem com pouco ou nenhum ajuste. No Gentoo isso exige três passos especiais: ter um perfil multilib (não-multilib não consegue rodar Steam, que é binário 32-bit), habilitar ABI_X86='64 32' para os pacotes que precisam de bibliotecas de 32-bits, e instalar o launcher 'games-util/steam-launcher' do overlay 'steam-overlay'.

A parte mais delicada do Gentoo + Steam é a quantidade de bibliotecas duplicadas (32 e 64 bits) que precisam ser compiladas. Mesa, vulkan-loader, libdrm, libpulse, libX11 — todas precisam ter as duas versões. O make.conf controla isso via 'ABI_X86="64 32"'. Esquecer disso resulta em 'OpenGL GLX context is not using direct rendering' assim que o Steam abre.

Este capítulo cobre o caminho prático: garantir multilib no profile, ativar ABI_X86, instalar o overlay oficial, configurar a launch options recomendada para a maioria dos jogos ('PROTON_LOG=1 %command%' para debug), e os três truques que destravam jogos chatos: 'PROTON_NO_ESYNC', 'mangohud', 'gamemode'.`,
    codes: [
      { lang: "bash", code: `# 1) Confirmar profile multilib:
eselect profile show
# Deve aparecer algo como:
# default/linux/amd64/23.0/desktop  (sem 'no-multilib')

# Se estiver em no-multilib, troque para um padrão antes de prosseguir:
eselect profile list | grep -v no-multilib | grep desktop` },
      { lang: "bash", code: `# 2) /etc/portage/make.conf — habilitar ABI 32-bit:
ABI_X86="64 32"
VIDEO_CARDS="amdgpu radeonsi"   # ou intel iris, nvidia
USE="\${USE} vulkan"

# Recompilar bibliotecas afetadas:
sudo emerge --ask --update --deep --newuse @world` },
      { lang: "bash", code: `# 3) Adicionar o overlay oficial do Steam:
sudo emerge --ask app-eselect/eselect-repository
sudo eselect repository enable steam-overlay
sudo emaint sync -r steam-overlay

# Aceitar a EULA e instalar:
echo "games-util/steam-launcher ~amd64" | \\
  sudo tee /etc/portage/package.accept_keywords/steam
echo "games-util/steam-meta ~amd64" | \\
  sudo tee -a /etc/portage/package.accept_keywords/steam
echo "valve-steam-launcher" >> /etc/portage/package.license/steam

sudo emerge --ask games-util/steam-launcher` },
      { lang: "bash", code: `# Iniciar:
steam
# A primeira execução baixa runtime (Steam Linux Runtime + Proton).
# Depois, em cada jogo: clique direito > Properties > Compatibility >
# 'Force the use of a specific Steam Play compatibility tool' > Proton 9.0` },
      { lang: "bash", code: `# Launch options úteis (Properties > General > Launch Options):
# Debug — gera log em ~/steam-XXX.log:
PROTON_LOG=1 %command%

# FPS overlay com mangohud:
mangohud %command%

# Otimização de CPU (gamemode):
gamemoderun %command%

# Combinado:
gamemoderun mangohud %command%` },
      { lang: "bash", code: `# Pacotes auxiliares quase obrigatórios:
sudo emerge --ask games-util/mangohud games-util/gamemode \\
                  games-util/protontricks app-emulation/winetricks

# mangohud: overlay FPS / CPU / GPU
# gamemode: governor CPU para performance enquanto joga
# protontricks: instalar dependências dentro do prefixo do Proton` },
    ],
    points: [
      "Steam exige profile multilib; no-multilib não roda nem o launcher.",
      "ABI_X86='64 32' em make.conf é obrigatório, e propaga para mesa, vulkan, libdrm.",
      "O overlay 'steam-overlay' é a fonte oficial do steam-launcher no Gentoo.",
      "Proton é wine + DXVK + VKD3D empacotado pela Valve para jogos Windows.",
      "ProtonDB.com mostra compatibilidade real de cada jogo.",
      "mangohud + gamemode são os complementos mais usados.",
      "Armadilha comum: ABI_X86 esquecido; Steam reclama de OpenGL ou nem inicia.",
      "Iniciante comum: instalar Proton 'mais novo' achando que sempre é melhor; alguns jogos precisam Proton específico (GE-Proton).",
      "Armadilha: rodar Steam em Wayland Nvidia sem nvidia-drivers atualizado; jogos crasham.",
    ],
    alerts: [
      { type: "warning", content: "Habilitar ABI_X86='64 32' aumenta MUITO o tempo de compilação (mesa, vulkan-loader, gtk e dezenas de outros viram dois pacotes). Reserve uma noite na primeira sincronização." },
      { type: "tip", content: "Para jogos chatos, troque o Proton oficial por GE-Proton (Glorious Eggroll), que inclui patches mais agressivos. Instale via 'protonup-qt' ou manualmente em '~/.steam/root/compatibilitytools.d/'." },
      { type: "success", content: "Em 2024, mais de 80% do top 1000 da Steam roda 'Platinum' ou 'Gold' no Linux via Proton. Antiquidades como Half-Life 2 e jogos atuais como Elden Ring rodam de primeira." },
      { type: "danger", content: "Não instale o pacote 'steam' fora do overlay oficial — versões empacotadas erroneamente podem comprometer o sistema com binários sem assinatura." },
    ],
  },
  {
    slug: "lutris",
    section: "multimidia-gpu",
    title: "Lutris: gerenciando jogos fora da Steam",
    difficulty: "intermediario",
    subtitle: "Battle.net, Epic, GOG, emuladores e instaladores comunitários em um único launcher.",
    intro: `Steam resolve catálogo Steam. Para tudo o que está fora — Battle.net (Diablo, WoW, Hearthstone), Epic Games Store, GOG sem launcher, jogos antigos via DOSBox, emuladores como RetroArch, Yuzu, RPCS3 — entra o Lutris. Ele é um launcher unificado em Python que mantém scripts de instalação ('installers') colaborativos no site lutris.net e permite cada jogo ter seu próprio prefixo wine, runner, e configuração isolada.

No Gentoo, instalar é só 'emerge games-util/lutris'. Ele puxa wine, dxvk e vkd3d como recomendados, mas você ganha controle granular: pode ter wine-vanilla para jogos novos, wine-staging para títulos quebrados, e wine-tkg compilado por você para casos específicos. O Lutris baixa 'runners' Wine pré-compilados próprios da equipe (wine-ge, lutris-fshack), úteis quando o pacote do Gentoo está velho.

Este capítulo te mostra como configurar Lutris do zero, instalar Battle.net via instalador comunitário, ajustar runner e DXVK por jogo, e diagnosticar quando o instalador para no meio (geralmente, dependência faltando no winetricks). É um capítulo prático, com receita pronta.`,
    codes: [
      { lang: "bash", code: `# Instalar Lutris e auxiliares:
echo "games-util/lutris" | sudo tee /etc/portage/package.accept_keywords/lutris

sudo emerge --ask games-util/lutris app-emulation/wine-vanilla \\
                  app-emulation/winetricks app-emulation/dxvk app-emulation/vkd3d-proton

# ABI 32 bits ainda é necessária para muitos jogos:
# (já abordado no capítulo de Steam)` },
      { lang: "bash", code: `# Iniciar:
lutris

# Na interface:
# 1. Preferences > Runners > Wine: marque 'Lutris-fshack' ou 'Wine-GE' como padrão.
# 2. Preferences > Global options > Enable DXVK / VKD3D: ON.` },
      { lang: "bash", code: `# Instalar via script comunitário (Battle.net por exemplo):
# Pelo site: https://lutris.net/games/battlenet/
# Clique em 'Install', o navegador chama 'lutris:' protocol handler.

# Ou pelo CLI:
lutris -i lutris-installer-battlenet.json` },
      { lang: "bash", code: `# Por jogo: clique direito > Configure > Runner options
# Útil ajustar:
#  - Wine version: lutris-GE-Proton8-26 (caso jogo tenha problema)
#  - Esync / Fsync: ON (ganho de FPS em CPUs modernas)
#  - DXVK version: 2.3+
#  - DXVK_HUD: fps,frametimes (na seção 'System options')
#  - PRIME / GPU: Selecionar GPU discreta` },
      { lang: "bash", code: `# Diagnóstico: rodar jogo manualmente com log:
lutris -d lutris:rungame/battlenet
# A flag -d ativa debug detalhado.

# Inspecionar prefixos wine de cada jogo:
ls ~/Games/
# Cada subpasta é um WINEPREFIX próprio.` },
      { lang: "bash", code: `# Instalar dependências de jogos (.NET, vcrun) num prefixo específico:
WINEPREFIX=~/Games/battlenet/drive_c winetricks dotnet48 vcrun2019 corefonts

# Listar todas as 'receitas' do winetricks:
winetricks list` },
    ],
    points: [
      "Lutris organiza jogos não-Steam em prefixos isolados, cada um com seu wine.",
      "Instaladores comunitários (lutris.net) automatizam Battle.net, Epic, GOG.",
      "wine-GE/lutris-fshack são Wines patcheados pela equipe Lutris para gaming.",
      "DXVK e VKD3D ficam ON globalmente — funcionam para a maioria dos jogos D3D.",
      "WINEPREFIX é a pasta com C: virtual; cada jogo tem o seu.",
      "winetricks instala dependências (vcrun, dotnet) dentro de um prefixo.",
      "Armadilha comum: usar wine do Gentoo desatualizado e jogo crashar; troque para wine-GE.",
      "Iniciante comum: misturar jogos no mesmo prefixo e ter conflito de runtime.",
    ],
    alerts: [
      { type: "tip", content: "Antes de instalar um jogo, leia os comentários no instalador comunitário em lutris.net. Geralmente alguém já documentou ajustes específicos (ex: 'precisa winetricks corefonts'). Economiza horas." },
      { type: "info", content: "Os runners pré-compilados do Lutris (wine-GE) ficam em '~/.local/share/lutris/runners/wine/'. Não precisa emerge — é baixado pelo próprio Lutris." },
      { type: "warning", content: "Battle.net ocasionalmente quebra com cada update. Mantenha protontricks/winetricks atualizados e siga a thread do jogo no fórum oficial." },
      { type: "success", content: "Combinação clássica que funciona em 90% dos casos: wine-GE-Proton + DXVK 2.3+ + esync ON + gamemoderun na variável de ambiente." },
    ],
  },
  {
    slug: "wine",
    section: "multimidia-gpu",
    title: "Wine: rodando aplicativos Windows",
    difficulty: "avancado",
    subtitle: "wine-vanilla, wine-staging, dxvk e o conceito de WINEPREFIX.",
    intro: `Wine (Wine Is Not an Emulator) é uma reimplementação da API do Windows em Linux. Ele não emula um processador; pega chamadas DirectX/Win32 e traduz para chamadas Linux equivalentes. É o que faz Photoshop, Office, jogos antigos e milhares de aplicativos rodarem fora do Windows.

No Gentoo existem três variantes principais: 'app-emulation/wine-vanilla' (puro upstream), 'app-emulation/wine-staging' (com patches experimentais que pegam versão melhor para jogos) e 'app-emulation/wine-proton' (a versão Valve, foco gaming). Você pode ter as três instaladas em slots diferentes e escolher por prefixo. As USE flags importantes são: 'vulkan' (para DXVK), 'gstreamer' (vídeo), 'mono' (.NET embutido), 'mingw' (compila componentes nativos Windows internamente).

O conceito central é o WINEPREFIX: uma pasta que simula um C:\\ Windows completo. Por padrão é '~/.wine'. Mas o profissional cria um prefixo por aplicativo, evitando que dependências de um quebrem outro. Este capítulo cobre instalação, criação de prefixo, instalação de DXVK e VKD3D para D3D9-12, e os truques de diagnóstico (winedbg, WINEDEBUG=+all).`,
    codes: [
      { lang: "bash", code: `# /etc/portage/package.use/wine
app-emulation/wine-vanilla   vulkan gstreamer mono mingw -gecko alsa pulseaudio \\
                              X dbus
app-emulation/wine-staging   vulkan gstreamer mono mingw alsa pulseaudio X dbus

sudo emerge --ask app-emulation/wine-staging app-emulation/winetricks \\
                   app-emulation/dxvk app-emulation/vkd3d-proton` },
      { lang: "bash", code: `# Criar prefixo dedicado para um app (ex: Office 2019):
export WINEPREFIX=~/wineprefixes/office
export WINEARCH=win64
wineboot --init   # cria a estrutura de C:\\

# Instalar dependências comuns:
winetricks corefonts vcrun2019 dotnet48` },
      { lang: "bash", code: `# Instalar DXVK no prefixo (jogos D3D9/10/11):
WINEPREFIX=~/wineprefixes/jogo setup_dxvk install

# E VKD3D-Proton para D3D12:
WINEPREFIX=~/wineprefixes/jogo setup_vkd3d_proton install

# Verificar:
WINEPREFIX=~/wineprefixes/jogo wine winecfg
# Aba Libraries deve listar d3d11, d3d10core, dxgi como '(native, builtin)'` },
      { lang: "bash", code: `# Rodar instalador Windows num prefixo específico:
WINEPREFIX=~/wineprefixes/foto wine setup.exe

# Rodar app já instalado:
WINEPREFIX=~/wineprefixes/foto wine ~/wineprefixes/foto/drive_c/Apps/Photo.exe` },
      { lang: "bash", code: `# Diagnóstico — verboso completo:
WINEDEBUG=+all wine app.exe 2> wine.log

# Mais focado (só shaders, ruim de I/O):
WINEDEBUG=+d3d_shader wine jogo.exe 2> shader.log

# Listar versão e configurar:
wine --version
winecfg     # GUI de configuração do prefixo atual` },
      { lang: "bash", code: `# Manter múltiplas versões via slot:
eselect wine list   # se usar eselect-wine
eselect wine set vanilla-9.0
eselect wine set staging-9.5

# Sem eselect-wine, basta apontar /usr/bin/wine via 'wine-version' do app-emulation/wine-* pacote.` },
    ],
    points: [
      "Wine NÃO é emulador; traduz chamadas Win32 para chamadas Linux nativas.",
      "Três variantes Gentoo: vanilla (puro), staging (patches), proton (Valve).",
      "WINEPREFIX isola cada aplicativo em seu próprio C:\\ virtual.",
      "DXVK substitui D3D9/10/11 por Vulkan; VKD3D-Proton faz o mesmo para D3D12.",
      "winetricks instala redistribuíveis (vcrun, dotnet, corefonts) por prefixo.",
      "WINEDEBUG=+canal grava log filtrado para diagnosticar travas.",
      "Armadilha comum: instalar tudo no prefixo padrão (~/.wine) e quebrar a cada novo app.",
      "Iniciante comum: rodar wine como root; nunca faça isso.",
      "Armadilha: misturar wine 32 e 64 bits no mesmo prefixo sem WINEARCH definido.",
    ],
    alerts: [
      { type: "tip", content: "Sempre defina WINEPREFIX explícito. Recomendação: '~/wineprefixes/<nome-do-app>'. É um hábito que evita 90% das dores de cabeça." },
      { type: "info", content: "wine-staging tem patches que entram no upstream com atraso. Para gaming geralmente é melhor que vanilla; para apps profissionais (Office, Adobe), vanilla costuma ser mais estável." },
      { type: "warning", content: "winetricks baixa redistribuíveis da Microsoft. Se a Microsoft tira algum link do ar, certas receitas param de funcionar até o winetricks ser atualizado." },
      { type: "danger", content: "Não rode wine como root NUNCA. Aplicativos Windows assumem privilégios e podem fazer estragos no /; rode sempre com seu usuário comum." },
    ],
  },
  {
    slug: "gpu-passthrough-vfio",
    section: "multimidia-gpu",
    title: "GPU passthrough com VFIO",
    difficulty: "avancado",
    subtitle: "Passar uma GPU física para uma VM Windows e jogar com performance bare-metal.",
    intro: `GPU passthrough é uma técnica avançada onde você dedica uma GPU física a uma máquina virtual, permitindo rodar Windows com Direct3D nativo e jogos que dependem de anti-cheats kernel-mode (Valorant, Fortnite, EAC) que não funcionam em wine. A receita usa VFIO (Virtual Function I/O), um framework do kernel Linux que permite isolar dispositivos PCIe e entregá-los a um hypervisor (KVM/QEMU normalmente).

Pré-requisitos importantes: CPU com suporte a IOMMU (Intel VT-d ou AMD-Vi), placa-mãe que exponha IOMMU groups bem separados (varia bastante de modelo), pelo menos duas GPUs (uma para o host, outra para a VM) ou uma GPU integrada (iGPU para host, dGPU para VM). Sem dois adaptadores, você fica sem display no host quando a dGPU sair.

No Gentoo, você habilita 'CONFIG_VFIO_PCI' no kernel, adiciona 'intel_iommu=on' ou 'amd_iommu=on' na cmdline do GRUB, prende a GPU desde o boot via 'vfio-pci.ids=', e configura libvirt/QEMU para passar o dispositivo. Este capítulo cobre o caminho completo, do BIOS ao Windows rodando jogo. Tema avançado, mas com receita reproduzível.`,
    codes: [
      { lang: "bash", code: `# 1) BIOS/UEFI: ativar VT-d (Intel) ou AMD-Vi/SVM (AMD).
# 2) Conferir suporte do hardware:
dmesg | grep -e DMAR -e IOMMU
# Procure por: 'DMAR: IOMMU enabled' ou 'AMD-Vi: AMD IOMMUv2 driver loaded'

# 3) Ver os IOMMU groups:
for d in /sys/kernel/iommu_groups/*/devices/*; do
  n=\${d#*/iommu_groups/*}; n=\${n%%/*}
  printf 'Group %s: %s\\n' "\$n" "\$(lspci -nns "\${d##*/}")"
done | sort -V` },
      { lang: "bash", code: `# 4) Kernel — habilitar VFIO em make menuconfig:
# Device Drivers --->
#   <M> VFIO Non-Privileged userspace driver framework
#     <M> VFIO support for PCI devices
#     [*] VFIO PCI support for VGA devices
#   [*] KVM
#     [M] KVM for Intel processors / AMD

# Recompile e reboot.` },
      { lang: "ini", code: `# 5) /etc/default/grub — cmdline:
GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on iommu=pt vfio-pci.ids=10de:2484,10de:228b"
# (10de:2484 = RTX 3070, 10de:228b = HDMI audio dela; descubra com lspci -nn)

# Aplicar:
sudo grub-mkconfig -o /boot/grub/grub.cfg` },
      { lang: "bash", code: `# 6) Após reboot, confirmar que vfio-pci 'pegou' a GPU:
lspci -nnk -d 10de:2484
# Deve mostrar: 'Kernel driver in use: vfio-pci'` },
      { lang: "bash", code: `# 7) Instalar libvirt e tools:
sudo emerge --ask app-emulation/libvirt app-emulation/qemu \\
                  app-emulation/virt-manager net-misc/bridge-utils

# /etc/portage/package.use/qemu
app-emulation/qemu  vhost-net spice usb usbredir vnc python virtiofsd` },
      { lang: "bash", code: `# 8) No virt-manager: criar VM Windows.
# - Adicionar PCI Host Device > escolher a dGPU e o áudio HDMI dela.
# - CPU: 'host-passthrough', topologia separando núcleos físicos.
# - Hugepages: ativar 1G hugepages para reduzir overhead de RAM.
# - Cuidado: defina 'q35' chipset e UEFI (OVMF) — Windows com GPU passthrough exige isso.

# Para anti-cheats que detectam VM (raro mas existe):
# Adicione hidden=on em <kvm> e <hyperv vendor_id ... />` },
    ],
    points: [
      "Passa uma GPU física para uma VM Windows com performance quase bare-metal.",
      "Requer CPU com VT-d/AMD-Vi e duas GPUs ou GPU integrada para o host.",
      "VFIO 'prende' a GPU no boot via vfio-pci.ids antes do driver normal carregar.",
      "IOMMU groups precisam ser bem separados; placa ruim coloca tudo num grupo só.",
      "libvirt + virt-manager simplifica a configuração; QEMU puro também funciona.",
      "Looking-Glass permite ver a VM no host sem segundo monitor (low latency).",
      "Armadilha comum: GPU compartilha grupo IOMMU com outros devices, impossibilitando isolamento.",
      "Iniciante comum: tentar passar a única GPU do sistema e ficar sem tela no host.",
      "Armadilha: BIOS sem 'Above 4G decoding' ativado quebra passthrough em GPUs grandes.",
    ],
    alerts: [
      { type: "warning", content: "Nem toda placa-mãe tem IOMMU groups bons. Antes de comprar hardware para isso, pesquise no PCI passthrough reddit ou no fórum 'level1techs'." },
      { type: "tip", content: "Use 'looking-glass' para 'ver' a VM em uma janela no host com latência sub-frame, eliminando a necessidade de segundo monitor." },
      { type: "info", content: "Para Anti-Lag/Reflex e jogos competitivos, dedique cores físicos via CPU pinning (cpuset) e desative SMT na VM. Resultado: input latency próximo ao bare-metal." },
      { type: "danger", content: "vfio-pci.ids errado pode prender a GPU do host e te deixar sem display antes de você poder corrigir. Tenha sempre acesso TTY (Ctrl+Alt+F2) ou SSH para recuperar." },
    ],
  },
  {
    slug: "opencl",
    section: "multimidia-gpu",
    title: "OpenCL: computação paralela na GPU",
    difficulty: "avancado",
    subtitle: "Aceleração de filtros, render, IA e mineração via OpenCL com rusticl, ROCm ou Intel Compute Runtime.",
    intro: `OpenCL é uma API de computação heterogênea: você escreve código em C que roda em CPU, GPU ou aceleradores. É a base de muitos filtros do Darktable, render do Blender (Cycles), encoding em DaVinci Resolve, e parte do mundo de IA antes do CUDA dominar.

No Linux, OpenCL é fragmentado: cada vendor tem seu runtime. Para AMD, há duas escolhas — 'rusticl' (parte do mesa moderno, USE='opencl') que cresce rápido, ou 'ROCm' (sys-libs/rocm-opencl-runtime) mais maduro mas pesado. Para Intel, 'dev-libs/intel-compute-runtime' (Neo). Para Nvidia, OpenCL vem dentro de 'nvidia-drivers'. Mais de um runtime pode coexistir e o ICD loader ('virtual/opencl' + 'dev-libs/ocl-icd') escolhe o certo por aplicação.

Diagnóstico canônico: 'clinfo'. Ele lista todas as plataformas OpenCL detectadas, dispositivos por plataforma e capacidades. Sem dispositivo na lista, falta runtime. Este capítulo cobre instalação por GPU, troubleshooting comum, e como medir se um app realmente está usando OpenCL ou caiu para CPU.`,
    codes: [
      { lang: "bash", code: `# /etc/portage/make.conf
USE="\${USE} opencl"
VIDEO_CARDS="amdgpu radeonsi"   # ou intel iris, nvidia

# ICD loader genérico:
sudo emerge --ask virtual/opencl dev-libs/ocl-icd

# Diagnóstico:
sudo emerge --ask sci-libs/clinfo
clinfo --list` },
      { lang: "bash", code: `# AMD opção 1 — rusticl (no mesa, leve):
# Em make.conf, garanta USE='opencl' em mesa e habilite o driver:
sudo eselect repository enable rusticl   # (ou simplesmente garanta mesa USE=opencl)
echo "RUSTICL_ENABLE=radeonsi" | sudo tee /etc/environment.d/rusticl.conf

# AMD opção 2 — ROCm (mais maduro para GPGPU sério):
echo "sys-libs/rocm-opencl-runtime ~amd64" | sudo tee /etc/portage/package.accept_keywords/rocm
sudo emerge --ask sys-libs/rocm-opencl-runtime` },
      { lang: "bash", code: `# Intel:
sudo emerge --ask dev-libs/intel-compute-runtime
# Confirme que o usuário está no grupo 'video' para acessar /dev/dri/renderD128.

# Nvidia:
# Já vem com x11-drivers/nvidia-drivers. Confirme:
clinfo | grep -i nvidia` },
      { lang: "bash", code: `# Listar plataformas e dispositivos:
clinfo
# Trecho típico:
# Number of platforms                               2
#   Platform Name                                   rusticl
#   Platform Vendor                                 Mesa/X.org
#   Number of devices                               1
#     Device Name                                   AMD Radeon RX 6700 XT (radeonsi, navi22)
#     Device Type                                   GPU` },
      { lang: "bash", code: `# Forçar app a usar plataforma específica (ex: Darktable):
# Listar índices:
clinfo --list
# Saída:
# Platform #0: rusticl
# Platform #1: ROCm

# No Darktable: Preferences > OpenCL > forçar 'AMD' ou desativar para CPU comparação.

# Testar Blender Cycles via OpenCL:
blender --background --python-expr \\
  "import bpy; bpy.context.scene.cycles.device='GPU'; bpy.ops.render.render()"` },
      { lang: "bash", code: `# Benchmark rápido com darktable-cltest:
darktable-cltest
# Vai listar devices OpenCL e tentar compilar kernels — saída diz se está saudável.` },
    ],
    points: [
      "OpenCL é API genérica de computação em GPU/CPU; concorre com CUDA.",
      "AMD: escolha rusticl (mesa, leve) ou ROCm (maduro, pesado).",
      "Intel: dev-libs/intel-compute-runtime (NEO).",
      "Nvidia: vem com nvidia-drivers; nada extra a instalar.",
      "clinfo é o diagnóstico definitivo; sem device, runtime falta.",
      "Mais de um runtime pode coexistir — apps escolhem a plataforma desejada.",
      "Armadilha comum: USE='opencl' em mesa esquecida, rusticl não compila.",
      "Iniciante comum: usuário fora do grupo 'video' não acessa /dev/dri.",
    ],
    alerts: [
      { type: "info", content: "Para IA séria (PyTorch, TensorFlow), a Nvidia ainda lidera com CUDA, mas ROCm já roda PyTorch oficialmente em GPUs RDNA2+. AMD está fechando o gap." },
      { type: "tip", content: "Se você só quer Darktable rápido, rusticl resolve sem tanta complicação. ROCm faz sentido para Blender, AI ou cargas pesadas onde maturidade pesa." },
      { type: "warning", content: "ROCm tem matriz de suporte de GPU restrita (oficialmente RDNA2+, gfx1030 etc). GPUs antigas oficialmente não funcionam, mesmo que 'às vezes' funcionem." },
      { type: "success", content: "Em 2024 o rusticl atingiu OpenCL 3.0 conformance em mesa. Para a maioria dos usuários domésticos, é a escolha mais simples e leve." },
    ],
  },
  {
    slug: "ffmpeg",
    section: "multimidia-gpu",
    title: "ffmpeg: a navalha suíça da multimídia",
    difficulty: "avancado",
    subtitle: "Encoding, conversão, filtros e aceleração via GPU em uma única ferramenta de comando.",
    intro: `ffmpeg é uma das ferramentas mais poderosas do Linux. Com um único binário você converte formatos, extrai trechos, redimensiona, gira, aplica filtros, mixa áudio, sobrepõe legendas, captura tela, faz streaming, transcoda em hardware. Tudo via linha de comando, scriptável e reproduzível.

No Gentoo o pacote 'media-video/ffmpeg' tem dezenas de USE flags porque cada codec é opcional. Você compõe o seu ffmpeg conforme uso: 'x264 x265 vpx aom' para encoders modernos; 'fdk' para AAC superior; 'vaapi vdpau' para hwaccel; 'cuda nvenc' para Nvidia; 'amf' para AMD; 'libass' para legendas; 'svg theora speex' para casos específicos. A escolha define que linhas de comando você vai poder usar.

Este capítulo é receituário: comandos que você vai usar de verdade. Cortar trecho sem reencodar (rápido), reduzir tamanho de vídeo, extrair áudio de YouTube, converter HEVC para H.264 acelerado por GPU, e os truques de filter_complex para legendas e watermark. Forme o reflexo: para qualquer tarefa de vídeo, pense ffmpeg primeiro.`,
    codes: [
      { lang: "bash", code: `# /etc/portage/package.use/ffmpeg
media-video/ffmpeg x264 x265 vpx aom dav1d svt-av1 vaapi vdpau \\
                   opus mp3 vorbis fdk libass webp bluray network \\
                   threads zlib gnutls gpl

# Para Nvidia adicione: nvenc cuda
# Para AMD adicione: amf

sudo emerge --ask --newuse media-video/ffmpeg` },
      { lang: "bash", code: `# Cortar trecho SEM reencodar (cópia direta dos streams; rápido):
ffmpeg -ss 00:01:30 -to 00:02:45 -i entrada.mkv -c copy saida.mkv
# -ss = início, -to = fim, -c copy = não reencoda.` },
      { lang: "bash", code: `# Converter para MP4 H.264 + AAC, qualidade boa, web-friendly:
ffmpeg -i entrada.mkv -c:v libx264 -preset slow -crf 20 \\
       -c:a aac -b:a 192k -movflags +faststart saida.mp4
# CRF 18 = quase lossless, 23 = padrão, 28 = compactíssimo.` },
      { lang: "bash", code: `# Extrair só o áudio (ex: música de YouTube baixada):
ffmpeg -i clipe.webm -vn -c:a libmp3lame -b:a 192k musica.mp3
# -vn = no video.

# Ou MAIS rápido se for opus puro:
ffmpeg -i clipe.webm -vn -c:a copy musica.opus` },
      { lang: "bash", code: `# Encoding HEVC acelerado por hardware (VA-API em Intel/AMD):
ffmpeg -hwaccel vaapi -hwaccel_output_format vaapi -i in.mp4 \\
       -c:v hevc_vaapi -qp 24 out_hevc.mp4

# Nvidia (NVENC):
ffmpeg -hwaccel cuda -i in.mp4 -c:v hevc_nvenc -preset p5 -cq 24 out_hevc.mp4

# AMD (AMF):
ffmpeg -i in.mp4 -c:v hevc_amf -quality balanced -qp_i 24 out_hevc.mp4` },
      { lang: "bash", code: `# Sobrepor legenda 'queimada' no vídeo:
ffmpeg -i video.mp4 -vf "subtitles=legenda.srt:force_style='Fontsize=24'" \\
       -c:a copy video_com_legenda.mp4

# Adicionar watermark (logo no canto inferior direito):
ffmpeg -i video.mp4 -i logo.png \\
  -filter_complex "[0:v][1:v]overlay=W-w-10:H-h-10" \\
  -c:a copy video_marca.mp4` },
      { lang: "bash", code: `# Capturar tela (X11) com áudio do PulseAudio/PipeWire:
ffmpeg -f x11grab -framerate 30 -video_size 1920x1080 -i :0.0 \\
       -f pulse -i default \\
       -c:v libx264 -preset ultrafast -c:a aac captura.mkv

# Listar formatos / encoders disponíveis no seu ffmpeg:
ffmpeg -formats | head
ffmpeg -encoders | grep nvenc` },
    ],
    points: [
      "ffmpeg é uma única ferramenta para ler, escrever, filtrar e transcodar mídia.",
      "USE flags do pacote definem quais codecs e hwaccels ficam disponíveis.",
      "-c copy reencoda nada — usa para cortes sem perda e rapidíssimos.",
      "CRF (Constant Rate Factor) é a métrica de qualidade do x264/x265: 18-28 normal.",
      "hevc_vaapi (Intel/AMD), hevc_nvenc (Nvidia), hevc_amf (AMD) aceleram via GPU.",
      "filter_complex permite cadeias avançadas: overlay, escala, legendas em uma só pass.",
      "Armadilha comum: encoding em CPU sem -preset slow gera arquivo grande mal otimizado.",
      "Iniciante comum: misturar -ss antes vs depois de -i; antes é rápido (seek), depois é frame-accurate.",
      "Armadilha: usar hwaccel sem o '-hwaccel_output_format' apropriado e ter cópia GPU<->CPU lenta.",
    ],
    alerts: [
      { type: "tip", content: "Para preset de qualidade, comece com 'libx265 -crf 22 -preset medium'. Tamanho ~50% menor que H.264 com mesma qualidade. Em hardware moderno é o padrão." },
      { type: "info", content: "ffmpeg compila com 'gpl' por padrão, o que inclui x264/x265. Sem essa USE, alguns encoders ficam fora. Veja a saída de 'ffmpeg -encoders' para confirmar." },
      { type: "warning", content: "Encoders de hardware (NVENC, VAAPI, AMF) são mais rápidos mas geram qualidade levemente inferior por bitrate comparado a x264/x265 em CPU. Para arquivamento, prefira CPU." },
      { type: "success", content: "Aprenda 5 receitas de ffmpeg de cor (cortar, converter, extrair áudio, hwaccel encode, capturar tela). Você vai usar todo dia, e em qualquer Linux do mundo." },
    ],
  },
];
