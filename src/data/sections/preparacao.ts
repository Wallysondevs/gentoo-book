import type { Chapter } from "../types";

export const chapters: Chapter[] = [
  {
    slug: "pre-requisitos",
    section: "preparacao",
    title: "Pré-requisitos: o que ter antes de começar",
    difficulty: "iniciante",
    subtitle: "Hardware, tempo, paciência e o segundo dispositivo que vai te salvar.",
    intro: `Instalar o Gentoo não é difícil; é diferente. Onde no Ubuntu você clica em 'Avançar' cinco vezes e em 20 minutos tem um sistema rodando, no Gentoo você abre um terminal preto, segue um manual em inglês (o famoso Gentoo Handbook) e monta cada peça do sistema na mão. Antes de qualquer comando, vale conferir se você tem o ambiente certo para que essa montagem flua sem frustração.

A boa notícia é que os requisitos de hardware são modestos. Qualquer máquina dos últimos dez anos compila e roda Gentoo sem problema. O que pesa de verdade é o tempo: a primeira instalação completa, do boot da live até um sistema gráfico funcional, costuma levar entre 4 e 12 horas, dependendo do hardware e de quanto você quer compilar. Reserve um sábado, não tente espremer entre reuniões.

O item mais subestimado é o segundo dispositivo. Você vai precisar de um celular, tablet ou notebook secundário com internet aberta para consultar o handbook (wiki.gentoo.org), copiar comandos e pesquisar erros enquanto a máquina-alvo está toda ocupada com a instalação. Tentar fazer tudo numa máquina só, alternando entre tty e navegador na live, é receita para erro de digitação e cansaço.`,
    codes: [
      { lang: "text", code: `# Hardware mínimo realista para uma instalação tranquila:
- CPU: x86_64 dual-core (2010+) ou arm64 moderno
- RAM: 2 GB para instalar; 4 GB+ para compilar Firefox/LibreOffice sem swap
- Disco: 20 GB para sistema base; 50 GB+ se vai usar desktop
- Rede: conexão por cabo de preferência (wifi funciona, mas dá mais trabalho na live)
- Pen drive: 4 GB+ para gravar a ISO` },
      { lang: "bash", code: `# Antes de mexer no disco, FAÇA BACKUP. Sério.
# Liste o que está montado para saber o que tem dentro:
lsblk -f
# Copie arquivos importantes para um HD externo, nuvem, qualquer coisa.
rsync -aP /home/voce/Documentos/ /media/externo/backup-documentos/` },
      { lang: "bash", code: `# Estimativa rápida de quanto demora compilar um pacote grande:
# Em um Ryzen 5 5600 (6 núcleos) compilar firefox leva ~45 min.
# Em um Core i5 antigo de 4 núcleos, pode passar de 3 horas.
# Use lscpu para descobrir o que você tem:
lscpu | grep -E 'Model name|CPU\\(s\\)|MHz'` },
      { lang: "text", code: `# Lista mental de coisas para deixar à mão antes de começar:
1. Pen drive de 4 GB+ formatado (vai virar live USB)
2. Cabo de rede (ou senha do wifi anotada)
3. Outro dispositivo com navegador para o handbook
4. Backup de tudo que importa no disco que será apagado
5. Senha do BIOS/UEFI (se a máquina tiver)
6. Bloco de notas para anotar UUIDs, partições e decisões` },
      { lang: "bash", code: `# Se você nunca usou terminal Linux, pratique antes os básicos:
ls -la              # listar arquivos
cd /etc             # mudar de diretório
nano arquivo.txt    # editor simples
cat /etc/os-release # ver conteúdo de arquivo
# Sem fluência mínima nesses comandos, a instalação vai ser dolorosa.` },
    ],
    points: [
      "Reserve um dia inteiro para a primeira instalação; não tente fazer com pressa.",
      "Tenha um segundo dispositivo aberto no Gentoo Handbook (wiki.gentoo.org).",
      "Faça backup completo do disco-alvo: a instalação apaga tudo.",
      "Cabo de rede simplifica muito; wifi na live funciona, mas exige mais passos.",
      "Saiba o modelo do seu processador e da sua placa de vídeo (lspci, lscpu).",
      "Tenha conforto mínimo com terminal: ls, cd, cat, nano, mount.",
      "Armadilha comum: começar a instalar sem espaço em disco para um swap decente.",
      "Iniciante comum: achar que vai 'só dar uma olhada' e perder dados por não ter feito backup.",
    ],
    alerts: [
      { type: "danger", content: "Backup não é opcional. A instalação reformata partições. Se você não tem cópia dos seus dados em outro lugar físico, NÃO comece ainda." },
      { type: "tip", content: "Imprima ou salve em PDF a página do Handbook correspondente à sua arquitetura. Se a internet cair na live, você ainda tem por onde se guiar." },
      { type: "info", content: "O tempo de instalação cai pela metade na segunda vez. Você aprende os atalhos, monta um make.conf reaproveitável e já sabe que perfil escolher." },
      { type: "warning", content: "Não tente instalar Gentoo no mesmo disco do sistema atual sem entender particionamento. Comece numa máquina de teste ou em uma máquina virtual (VirtualBox, KVM)." },
    ],
  },
  {
    slug: "escolher-arquitetura",
    section: "preparacao",
    title: "Escolhendo arquitetura, init e profile",
    difficulty: "iniciante",
    subtitle: "amd64 ou arm64? OpenRC ou systemd? Desktop, server ou hardened?",
    intro: `Antes de baixar qualquer ISO, você precisa tomar três decisões grandes que vão moldar o resto da instalação: a arquitetura da CPU, o sistema de init e o profile do Portage. Essas escolhas não são irreversíveis, mas mudar depois dá trabalho. Vale fazer com calma agora.

Arquitetura é a mais simples: qual processador a máquina tem? 99% dos PCs e notebooks modernos são amd64 (também chamado x86_64). Macs com chip Apple Silicon, Raspberry Pi 4/5 e a maioria dos celulares são arm64. Máquinas muito antigas (anteriores a 2007, mais ou menos) podem ser x86 puro. Se está em dúvida, rode 'uname -m' em qualquer Linux atual.

O init é o primeiro processo que sobe quando o kernel termina o boot. No Gentoo você escolhe entre OpenRC (filosofia Unix clássica, scripts em shell, leve) e systemd (padrão da maior parte das distros modernas, mais recursos integrados). Os dois funcionam bem; OpenRC é mais 'gentoo-style' e systemd é mais familiar para quem veio do Ubuntu/Fedora. Já o profile define o conjunto-base de USE flags e dependências: existe profile desktop, server, hardened (com proteções extras de segurança), musl (libc alternativa), no-multilib (sem suporte a binários 32-bit) e variações para cada init.`,
    codes: [
      { lang: "bash", code: `# Descubra a arquitetura da sua máquina (rode em qualquer Linux):
uname -m
# Saídas comuns:
# x86_64        -> use stage3 amd64
# aarch64       -> use stage3 arm64
# armv7l        -> arm 32-bit (Raspberry Pi 2/3)
# i686          -> x86 puro (raro hoje)` },
      { lang: "text", code: `# Stage3 disponíveis nas releases mais comuns (gentoo.org/downloads):

amd64/openrc                    -> padrão clássico
amd64/openrc-desktop            -> openrc + USE flags de desktop
amd64/systemd                   -> systemd minimalista
amd64/desktop-systemd           -> systemd + flags de desktop
amd64/hardened-openrc           -> openrc + PaX, SELinux opcional
amd64/musl-llvm                 -> sem glibc, sem gcc (toolchain LLVM)
amd64/no-multilib-openrc        -> sem suporte a 32-bit
arm64/openrc                    -> Raspberry Pi 4/5, servidores ARM
ppc64le/openrc                  -> POWER8/9 (raro)` },
      { lang: "bash", code: `# Após instalar, eselect mostra qual profile está ativo:
eselect profile list
# Saída tipica:
#  [1]  default/linux/amd64/23.0 (stable)
#  [2]  default/linux/amd64/23.0/desktop (stable) *
#  [3]  default/linux/amd64/23.0/desktop/plasma (stable)

# Trocar de profile depois é possível, mas força recompilar muita coisa:
sudo eselect profile set 3
sudo emerge --ask --update --deep --newuse @world` },
      { lang: "ini", code: `# Comparativo prático para ajudar a escolher:

OpenRC:
+ leve, scripts em shell legíveis
+ filosofia Unix tradicional
+ você entende o que cada serviço faz
- menos recursos integrados (timers, sockets)
- alguns pacotes (gnome) preferem systemd

systemd:
+ familiar para quem vem do Ubuntu/Arch
+ unidades, timers, sockets, journald integrados
+ melhor suporte para gnome puro
- mais 'caixa preta' para iniciantes
- ocupa mais RAM em sistemas pequenos` },
      { lang: "bash", code: `# Profiles especiais que valem mencionar:
# hardened: ativa GRSecurity-like protections, PIE, SSP, RELRO completo.
# musl: libc alternativa, mais leve que glibc, mas quebra muitos binários proprietários.
# no-multilib: sem ABI 32-bit. Ideal para servidor; ruim se vai rodar Steam.
# llvm: usa clang/lld no lugar de gcc/binutils. Mais novo, menos testado.

# Para iniciante: vá de default/linux/amd64/23.0/desktop (openrc) ou
# default/linux/amd64/23.0/desktop/systemd. Sem segredo.` },
    ],
    points: [
      "amd64 = x86_64. Use isso se sua máquina é PC/notebook moderno.",
      "arm64 = aarch64. Use em Raspberry Pi 4/5, servidores ARM, Macs Apple Silicon.",
      "OpenRC é o init 'gentoo-style': simples, scripts shell, leve.",
      "systemd é o init mais comum no Linux moderno; melhor pra gnome.",
      "Profile desktop ativa USE flags como X, alsa, dbus por padrão.",
      "Profile hardened endurece o sistema mas exige mais conhecimento.",
      "Armadilha comum: escolher musl ou no-multilib sem entender que vai quebrar Steam, Discord e drivers proprietários.",
      "Iniciante comum: trocar de profile no meio da instalação e se perder na recompilação massiva.",
    ],
    alerts: [
      { type: "tip", content: "Se você está em dúvida, escolha amd64 + OpenRC + profile desktop. É o caminho mais documentado e suportado." },
      { type: "warning", content: "Profile hardened (e SELinux) é poderoso mas frustrante para o primeiro Gentoo. Domine o básico antes de partir para hardened." },
      { type: "info", content: "Você pode ter OpenRC e elogind ao mesmo tempo: o elogind cuida de sessão e logind sem precisar de systemd inteiro. Isso permite rodar GNOME sem systemd." },
      { type: "danger", content: "Trocar de glibc para musl em um sistema já instalado é praticamente impossível sem reinstalar. Decida ANTES." },
    ],
  },
  {
    slug: "baixar-iso",
    section: "preparacao",
    title: "Baixando a ISO de instalação",
    difficulty: "iniciante",
    subtitle: "Minimal Install CD, AdminCD ou LiveGUI? E como verificar a integridade.",
    intro: `O Gentoo não tem um instalador gráfico próprio. O que você baixa é uma imagem ISO 'live' que serve apenas para dar boot e te dar um terminal funcional, com rede, ferramentas de particionamento e tudo o que você precisa para fazer a instalação manualmente. Existem três variantes principais, e a escolha depende do seu conforto com terminal.

A Minimal Installation CD é a opção tradicional: ~700 MB, só linha de comando, kernel enxuto. Funciona em quase qualquer hardware e é o que o Handbook usa como referência. A AdminCD é uma versão maior (~3 GB), com mais ferramentas de recuperação e drivers. A LiveGUI é uma ISO de ~6 GB que sobe um KDE Plasma completo, com Firefox, terminal gráfico, e tudo. Útil se você precisa do navegador na própria máquina-alvo durante a instalação.

Independentemente da escolha, você DEVE verificar a integridade do que baixou. ISOs corrompidas no download silencioso geram erros bizarros mais tarde (kernel panic, falhas misteriosas). Gentoo publica para cada ISO um arquivo .DIGESTS (com hashes SHA-256/SHA-512) e um .DIGESTS.asc (assinado com a chave PGP da Release Engineering). Verificar leva 30 segundos e evita horas de dor de cabeça.`,
    codes: [
      { lang: "bash", code: `# Página oficial: https://www.gentoo.org/downloads/
# Mirrors: https://www.gentoo.org/downloads/mirrors/
# Para o Brasil, costuma ser rápido o mirror da C3SL (UFPR) ou o da UNICAMP.

# Baixar a Minimal Install CD via terminal (Linux/macOS):
wget https://distfiles.gentoo.org/releases/amd64/autobuilds/current-install-amd64-minimal/install-amd64-minimal-20250101T170127Z.iso
wget https://distfiles.gentoo.org/releases/amd64/autobuilds/current-install-amd64-minimal/install-amd64-minimal-20250101T170127Z.iso.DIGESTS
wget https://distfiles.gentoo.org/releases/amd64/autobuilds/current-install-amd64-minimal/install-amd64-minimal-20250101T170127Z.iso.asc` },
      { lang: "bash", code: `# Verificar SHA-512 (rápido, garante que o download não corrompeu):
sha512sum -c install-amd64-minimal-20250101T170127Z.iso.DIGESTS 2>&1 | grep OK
# Saída esperada:
# install-amd64-minimal-20250101T170127Z.iso: OK

# Se aparecer "FAILED" ou "WARNING", baixe de novo. Não use ISO corrompida.` },
      { lang: "bash", code: `# Verificação PGP (mais robusta, prova que o arquivo veio da Gentoo):
# Importe a chave da Release Engineering:
gpg --keyserver hkps://keys.gentoo.org --recv-keys 0xBB572E0E2D182910

# Verifique a assinatura:
gpg --verify install-amd64-minimal-20250101T170127Z.iso.asc \\
    install-amd64-minimal-20250101T170127Z.iso

# Saída deve conter:
# Good signature from "Gentoo Linux Release Engineering (Automated ...)"` },
      { lang: "text", code: `# Comparativo das três ISOs principais:

Minimal Install CD (~700 MB):
- Apenas terminal, sem ambiente gráfico
- Kernel enxuto, drivers essenciais
- Recomendada pelo Handbook
- Boa para servidores e máquinas comuns

Admin CD (~3 GB):
- Terminal + ferramentas de recuperação extras
- Mais drivers (placas wifi exóticas, RAID)
- Ideal se hardware é incomum

LiveGUI ISO (~6 GB):
- KDE Plasma completo + Firefox + Konsole
- Ideal se vai consultar o Handbook na própria máquina
- Lenta para baixar, exige pen drive grande` },
      { lang: "bash", code: `# Para arm64 (Raspberry Pi etc.), o caminho é outro:
# https://distfiles.gentoo.org/releases/arm64/autobuilds/

# Verifique sempre a data no nome do arquivo. ISOs com mais de 6 meses
# vão obrigar você a fazer um emerge-webrsync grande logo no início.` },
    ],
    points: [
      "Gentoo não tem instalador gráfico; a ISO é só um ambiente live para você instalar à mão.",
      "Minimal Install CD é a opção padrão, ~700 MB, só terminal.",
      "AdminCD tem mais drivers; LiveGUI tem KDE para usar navegador na máquina-alvo.",
      "Sempre verifique sha512sum -c para garantir que o download não corrompeu.",
      "Verifique também a assinatura PGP para confirmar que o arquivo é autêntico.",
      "Use mirrors brasileiros (UFPR, UNICAMP) para download mais rápido.",
      "Armadilha comum: pular a verificação e perder horas debugando 'kernel panic' que era ISO corrompida.",
      "Iniciante comum: baixar uma ISO de 6 meses atrás e estranhar o tamanho do sync inicial.",
    ],
    alerts: [
      { type: "warning", content: "Baixar de site não-oficial é arriscado. A página gentoo.org/downloads é o ponto de partida correto. Cuidado com sites que parecem oficiais mas não são." },
      { type: "tip", content: "Se for instalar várias máquinas, baixe a ISO uma vez, verifique, e copie para um pen drive ou compartilhe via rede local. Evita downloads repetidos." },
      { type: "info", content: "A ISO LiveGUI é grande mas vale a pena para iniciantes: você pode abrir o Handbook no Firefox dentro da própria live, copiando os comandos para o terminal." },
      { type: "success", content: "Quando o gpg --verify retorna 'Good signature', você tem garantia criptográfica de que o arquivo é exatamente o que a Gentoo Foundation publicou." },
    ],
  },
  {
    slug: "criar-midia-bootavel",
    section: "preparacao",
    title: "Gravando a ISO em pen drive",
    difficulty: "iniciante",
    subtitle: "dd, Rufus e Ventoy: como transformar o .iso em mídia bootável sem perder dados.",
    intro: `Ter a ISO baixada não basta. Você precisa transferi-la para um pen drive (ou DVD, se ainda houver gravador na máquina) de forma que o BIOS/UEFI consiga dar boot a partir dele. O processo se chama 'gravar a imagem' ou 'flash', e é onde mais gente perde dados no fim de semana inteiro: um único comando errado destrói o conteúdo do disco escolhido sem aviso.

A boa notícia é que existem três caminhos sólidos. No Linux e macOS, o comando 'dd' é o padrão histórico: cru, simples, perigoso. No Windows, programas como Rufus dão interface gráfica e fazem a mesma coisa com mais segurança. E há o Ventoy, uma ferramenta moderna que transforma um pen drive em um carregador de múltiplas ISOs: você só copia o .iso para o pen drive e ele aparece no menu de boot.

Antes de qualquer comando 'dd', confirme TRÊS VEZES qual é o dispositivo correto. Confundir /dev/sda (seu HD principal) com /dev/sdb (o pen drive) é apagar o sistema inteiro em segundos, sem mensagem, sem 'tem certeza?'. Use lsblk antes e depois de plugar o pen drive para enxergar a diferença.`,
    codes: [
      { lang: "bash", code: `# No Linux: liste os blocos ANTES de plugar o pen drive.
lsblk -o NAME,SIZE,MODEL,MOUNTPOINT
# Plugue o pen drive e rode de novo:
lsblk -o NAME,SIZE,MODEL,MOUNTPOINT
# O dispositivo NOVO é o seu pen drive. Anote o nome (ex: sdb, sdc).` },
      { lang: "bash", code: `# Desmonte qualquer partição do pen drive (se houver):
sudo umount /dev/sdb*

# Agora o dd. ATENÇÃO: of= aponta para o pen drive INTEIRO, sem número.
# Errar aqui apaga seu HD. Confirme três vezes.
sudo dd if=install-amd64-minimal-20250101T170127Z.iso \\
        of=/dev/sdb \\
        bs=4M status=progress oflag=sync

# Saída de progresso:
# 712M bytes transferred (87 MB/s, 8s elapsed)
# 178+1 records in
# 178+1 records out` },
      { lang: "bash", code: `# Alternativa moderna ao dd (Linux): cp também funciona em ISOs híbridas:
sudo cp install-amd64-minimal-*.iso /dev/sdb && sync

# Ou use o utilitário gráfico GNOME Disks ou KDE Partition Manager,
# ambos com opção 'Restore Image to Disk'.` },
      { lang: "text", code: `# No Windows, use Rufus (https://rufus.ie):
1. Insira o pen drive
2. Abra Rufus, selecione o pen drive em 'Device'
3. Clique em 'SELECT' e escolha o .iso
4. Em 'Partition scheme', deixe 'GPT' para UEFI (recomendado)
5. Mantenha o resto no padrão e clique em 'START'
6. Aceite o aviso de 'DD Image mode' se aparecer

# No macOS:
# Use 'Etcher' (balena.io/etcher) — gráfico, simples, multiplataforma.` },
      { lang: "bash", code: `# Ventoy: turbinou a vida de quem testa muitas distros.
# 1. Baixe ventoy de ventoy.net e rode no Linux:
sudo sh Ventoy2Disk.sh -i /dev/sdb
# Isso prepara o pen drive UMA VEZ.

# 2. Depois, basta COPIAR a ISO para a partição do pen drive:
cp install-amd64-minimal-*.iso /run/media/voce/Ventoy/

# 3. No boot, Ventoy mostra um menu listando as ISOs presentes.
# Você pode ter Gentoo, Ubuntu, GParted Live no mesmo pen drive.` },
      { lang: "bash", code: `# Após gravar, valide que o pen drive ficou correto:
sudo dd if=/dev/sdb bs=4M count=200 2>/dev/null | sha256sum
sha256sum install-amd64-minimal-*.iso
# Os primeiros bytes devem casar (não o checksum inteiro, pois o pen drive tem mais espaço).

# Use sync para garantir que tudo foi escrito antes de retirar:
sync && sudo eject /dev/sdb` },
    ],
    points: [
      "lsblk antes e depois de plugar o pen drive identifica qual dispositivo é qual.",
      "of=/dev/sdb (sem número) escreve no disco inteiro; of=/dev/sdb1 escreve só na partição.",
      "bs=4M acelera o dd; status=progress mostra o andamento.",
      "Rufus no Windows resolve o problema com interface gráfica e segurança extra.",
      "Ventoy permite ter múltiplas ISOs no mesmo pen drive e escolher no boot.",
      "Sempre rode 'sync' depois de gravar para liberar o cache de escrita.",
      "Armadilha comum: confundir /dev/sda (HD interno) com /dev/sdb (pen drive) e apagar o HD.",
      "Iniciante comum: gravar a ISO em uma PARTIÇÃO (sdb1) em vez do disco (sdb), e o pen drive não dá boot.",
    ],
    alerts: [
      { type: "danger", content: "O comando dd não pergunta nada. Se você apontar of=/dev/sda achando que é o pen drive, seu HD vira lixo em segundos. Confirme com lsblk DUAS VEZES." },
      { type: "tip", content: "Compre um pen drive razoável (USB 3.0, 16 GB+). Pen drives USB 2.0 lentos podem fazer a live demorar 5+ minutos para carregar." },
      { type: "info", content: "Ventoy é particularmente útil para quem mantém máquinas: um pen drive vira kit de ferramentas com Gentoo, Memtest86+, GParted, SystemRescueCD, tudo de uma vez." },
      { type: "warning", content: "Em alguns sistemas Mac mais novos com chip T2/M1/M2, gravar pen drive USB de Linux genérico não é simples. Considere usar máquina virtual ou outra máquina de teste." },
    ],
  },
  {
    slug: "boot-live",
    section: "preparacao",
    title: "Dando boot na live USB",
    difficulty: "iniciante",
    subtitle: "BIOS, UEFI, Secure Boot e o que fazer quando a tela fica preta.",
    intro: `O pen drive está gravado. Agora você precisa dizer para o computador dar boot a partir dele em vez do HD interno. Esse passo parece simples, mas é onde muito iniciante para: a tela mostra o logotipo da fabricante, depois carrega o Windows ou Linux antigo, e o pen drive é ignorado. O motivo costuma ser ordem de boot, Secure Boot ativo ou USB no padrão errado.

Toda placa-mãe moderna usa UEFI (firmware que substituiu o BIOS clássico). Para entrar na configuração, você bate uma tecla específica logo no início do boot: F2, F10, F12, Del ou Esc, dependendo do fabricante. Dell costuma ser F12 (menu rápido) ou F2 (setup); Lenovo é F1 ou F12; HP é Esc seguido de F9 ou F10; Asus é F2; ThinkPads têm o famoso 'Enter' inicial.

Uma vez no firmware, três coisas precisam estar ajustadas: a ordem de boot deve listar o pen drive USB acima do HD interno; o Secure Boot deve estar desabilitado (a Gentoo live não vem assinada por padrão); e em alguns notebooks o 'Fast Boot' precisa sair do modo agressivo, senão o USB nem é detectado a tempo. Em máquinas mais antigas (pre-2012), você pode precisar desligar o modo UEFI 'puro' e usar 'Legacy/CSM'.`,
    codes: [
      { lang: "text", code: `# Teclas para entrar no setup/menu de boot por fabricante:

Dell           F2 (setup) ou F12 (menu de boot)
Lenovo         F1 ou Enter -> F12 (ThinkPads)
HP             Esc -> F9 (menu) ou F10 (setup)
Asus           F2 (setup) ou F8 (menu)
Acer           F2 (setup) ou F12 (menu)
MSI            Del (setup) ou F11 (menu)
Gigabyte       Del (setup) ou F12 (menu)
Samsung        F2 (setup) ou F10 (menu)
Apple Intel    Option (alt) durante o boot
Custom/PC      Del é o padrão na maioria das placas` },
      { lang: "text", code: `# Configurações típicas a checar dentro do firmware (UEFI):

1. Boot Order / Boot Priority
   -> Coloque 'USB HDD' ou nome do pen drive ACIMA do HD interno

2. Secure Boot
   -> DISABLED (a live do Gentoo não vem assinada)

3. Fast Boot / Quick Boot
   -> DISABLED durante a primeira instalação
   -> (pode reativar depois que tudo estiver funcionando)

4. CSM / Legacy Boot
   -> Para UEFI puro: deixar DESABILITADO
   -> Para máquinas antigas (sem GPT): ativar Legacy

5. SATA Mode
   -> AHCI (não use IDE/RAID a menos que saiba o que faz)` },
      { lang: "bash", code: `# Quando o boot der certo, você verá um menu como:
# Gentoo Linux Installation CD
#  1. Boot from disk (default)
#  2. Boot Gentoo Linux (gentoo)
#  3. Memtest86+
#  ...

# Pressione Enter em 'Boot Gentoo Linux'.
# Após ~30 segundos você cai num prompt root sem senha:
# livecd ~ #
# Confirme que você é root:
whoami
# saída: root` },
      { lang: "bash", code: `# Teste rápido se o ambiente live está saudável:
uname -a               # mostra versão do kernel da live
free -h                # quanta RAM disponível
lsblk                  # discos detectados (HD + pen drive)
ip addr                # interfaces de rede
ls /mnt                # pasta onde vamos montar o sistema novo` },
      { lang: "text", code: `# Erros comuns na hora do boot e o que fazer:

'No bootable device found'
-> Pen drive não está listado na ordem de boot, ou Secure Boot ativo.

'Operating System Not Found'
-> Mesma coisa: o firmware não reconheceu a mídia. Confira se gravou
   no disco inteiro (sdb), não em uma partição (sdb1).

Tela preta após selecionar Gentoo no menu
-> Tente passar 'nomodeset' como parâmetro do kernel (edite a entrada
   com 'e' e adicione no final da linha 'linux ...').

Travado em 'Loading initial ramdisk'
-> Pen drive USB 2.0 muito lento ou ISO corrompida. Volte e re-grave.` },
    ],
    points: [
      "Cada fabricante tem uma tecla diferente para entrar no setup; F2, F12, Del e Esc são as mais comuns.",
      "Desabilite Secure Boot antes de tentar dar boot na live do Gentoo.",
      "Coloque o pen drive USB acima do HD na ordem de boot.",
      "A live do Gentoo entra direto como root, sem senha, num prompt 'livecd ~ #'.",
      "Confirme com lsblk se o HD interno e o pen drive aparecem corretamente.",
      "Em telas pretas, tente o parâmetro 'nomodeset' no kernel da live.",
      "Armadilha comum: esquecer de desativar o Secure Boot e travar achando que o pen drive está com defeito.",
      "Iniciante comum: dar boot pelo HD em vez do USB e seguir a instalação no sistema antigo, sem perceber.",
    ],
    alerts: [
      { type: "tip", content: "Anote no celular a tecla de menu de boot da sua máquina. Você vai usar várias vezes ao longo da instalação para retornar à live em caso de problemas." },
      { type: "warning", content: "Em laptops corporativos (Dell, Lenovo) com TPM e Secure Boot estritos, pode haver senha de BIOS bloqueando alterações. Sem essa senha, você não consegue dar boot em outro sistema." },
      { type: "info", content: "Após a primeira live carregar, vale guardar a senha do wifi e nomes de partições no celular: você não terá copiar e colar fácil entre o celular e o terminal da live." },
      { type: "danger", content: "Não atualize o firmware UEFI 'na empolgação' antes da instalação. Atualizar BIOS/UEFI mal-feito pode brickar a placa-mãe. Faça apenas se for necessário e leia o manual do fabricante." },
    ],
  },
  {
    slug: "conectar-internet",
    section: "preparacao",
    title: "Conectando na internet pela live",
    difficulty: "iniciante",
    subtitle: "net-setup, iwctl, dhcpcd e como provar que o DNS está vivo.",
    intro: `O Gentoo é montado pedaço por pedaço a partir de arquivos baixados pela rede: o stage3, o repositório de ebuilds (Portage tree), o código-fonte de cada pacote, o kernel. Sem internet funcional na live, você não passa do segundo passo. Por isso, antes de qualquer particionamento ou cópia de arquivos, garantimos rede.

Se você plugou cabo de rede (Ethernet) e seu roteador entrega DHCP, na maioria das vezes a live já te dá rede sozinha: o dhcpcd corre automaticamente e o IP cai. Basta dar 'ping' para o Google e seguir adiante. Mas se for wifi, ou se o cabo não funcionou, você precisa configurar manualmente. A live do Gentoo traz duas ferramentas: 'net-setup' (assistente curses, perguntinha por perguntinha) e o 'iwctl' (cliente do iwd, mais moderno, usado especialmente para wifi).

Lembre-se de uma coisa importante: ter IP não é ter internet. O ping para o IP do roteador pode funcionar e o ping para google.com falhar — isso é DNS. A live deveria configurar /etc/resolv.conf via DHCP, mas em redes corporativas ou wifi capricho podem dar pau. Saber distinguir 'sem rede física', 'sem IP', 'sem rota' e 'sem DNS' economiza muito tempo de adivinhação.`,
    codes: [
      { lang: "bash", code: `# Diagnóstico em camadas. Comece pelo básico:
ip link                       # interfaces detectadas (eth0, wlan0)
ip addr                       # IPs atribuídos
ip route                      # rota padrão (default via ...)
cat /etc/resolv.conf          # servidores DNS atuais

# Teste em camadas:
ping -c 3 192.168.0.1         # ping no roteador (IP local)
ping -c 3 8.8.8.8             # ping IP externo (testa rota)
ping -c 3 gentoo.org          # testa DNS também` },
      { lang: "bash", code: `# Cabo de rede com DHCP automático: confira se já pegou IP.
# Geralmente sim. Se não:
sudo dhcpcd eth0
# (substitua eth0 pelo nome real visto em ip link, pode ser enp3s0)

# IP estático manual (caso DHCP falhe):
sudo ip addr add 192.168.0.50/24 dev eth0
sudo ip route add default via 192.168.0.1
echo "nameserver 1.1.1.1" | sudo tee /etc/resolv.conf` },
      { lang: "bash", code: `# net-setup: assistente curses oficial da live.
# Ele guia você por: escolher interface, DHCP ou IP fixo, wifi ou cabo.
net-setup eth0
# Para wifi:
net-setup wlan0
# Vai pedir SSID e senha; salva e tenta conectar.` },
      { lang: "bash", code: `# Wifi pelo iwctl (iwd, padrão em livecds modernas):
iwctl

# Dentro do prompt [iwd]#:
device list                              # lista placas wifi
station wlan0 scan
station wlan0 get-networks               # lista redes visíveis
station wlan0 connect MinhaRede          # vai pedir a senha
exit

# Após conectar, peça IP:
sudo dhcpcd wlan0` },
      { lang: "bash", code: `# Quando o ping para IP externo funciona mas para nome falha,
# o problema é DNS. Resolva temporariamente assim:
echo "nameserver 1.1.1.1" | sudo tee /etc/resolv.conf
echo "nameserver 8.8.8.8" | sudo tee -a /etc/resolv.conf

# Teste:
ping -c 3 wiki.gentoo.org
# saída esperada:
# 64 bytes from ... icmp_seq=1 ttl=120 time=15.2 ms` },
      { lang: "bash", code: `# Wifi corporativo com EAP/802.1x (raríssimo em casa, comum em escritório):
# Use net-setup ou edite manualmente /etc/wpa_supplicant/wpa_supplicant.conf
# Esse caso fica fora do escopo da live; conecte por celular roteando 4G se necessário:

# No celular, ative 'Hotspot pessoal'.
# Na live, conecte com iwctl como wifi normal.` },
    ],
    points: [
      "Cabo Ethernet com DHCP costuma 'simplesmente funcionar' na live do Gentoo.",
      "Use 'ip addr' e 'ip route' para diagnosticar rede em camadas.",
      "ping no IP testa rota; ping no nome testa DNS também.",
      "net-setup é o assistente curses oficial para configurar rede em modo guiado.",
      "iwctl conecta wifi modernamente e o dhcpcd pega o IP depois.",
      "/etc/resolv.conf controla os servidores DNS; 1.1.1.1 e 8.8.8.8 são seguros como fallback.",
      "Armadilha comum: ter IP e rota, mas DNS quebrado, e achar que 'a internet caiu'.",
      "Iniciante comum: tentar pingar 'google' (sem .com) ou esquecer que a live não persiste configurações entre boots.",
    ],
    alerts: [
      { type: "tip", content: "Se nada funciona, vire o celular em hotspot 4G/5G e conecte a live por wifi nele. Você sai do problema de configuração de rede e progride na instalação." },
      { type: "warning", content: "A live é volátil: tudo que você configurar (rede, etc.) é perdido se reiniciar. Anote senhas e configurações até finalizar a instalação." },
      { type: "info", content: "Em algumas placas wifi exóticas (Broadcom antigo, Realtek raro), a Minimal CD não tem driver. Use a AdminCD ou conecte por cabo até instalar firmware proprietário no sistema novo." },
      { type: "success", content: "Quando 'ping -c 3 gentoo.org' retorna respostas, você está pronto para baixar stage3 e iniciar a instalação de fato." },
    ],
  },
  {
    slug: "particionamento-conceitos",
    section: "preparacao",
    title: "Conceitos de particionamento: MBR, GPT, UUID",
    difficulty: "iniciante",
    subtitle: "A teoria que evita você apagar o disco errado e bagunçar o boot.",
    intro: `Particionar é dividir um disco físico em pedaços lógicos, cada um com um sistema de arquivos próprio e um propósito claro: aqui o sistema, ali o /home, lá a swap. Antes de mexer com parted ou cfdisk, vale entender quatro conceitos: tabela de partições (MBR vs GPT), partição EFI, swap e identificadores (UUID, label, PARTUUID). Sem isso, comandos parecem mágica e qualquer erro vira pânico.

A tabela de partições é o índice no início do disco. O modelo antigo, MBR (Master Boot Record), nasceu nos anos 80 e tem limites: até 4 partições primárias e até 2 TB por disco. O modelo moderno, GPT (GUID Partition Table), suporta 128 partições, discos de petabytes e tem checksums. Toda máquina UEFI moderna usa GPT. MBR sobrevive em hardware muito antigo ou em pen drives.

Em sistemas UEFI, existe uma partição obrigatória chamada ESP (EFI System Partition), formatada como FAT32, montada em /boot/efi (ou /efi nos layouts modernos). É de lá que o firmware UEFI carrega o bootloader. Se você esquecer de criá-la ou formatar errado, o sistema instala mas não dá boot. Em sistemas BIOS legados com GPT, há a 'BIOS boot partition' minúscula (1 MiB, sem filesystem) para o GRUB salvar seu segundo estágio. Identificar partições por UUID (em vez de /dev/sda1) evita problemas quando o kernel renomeia dispositivos entre boots.`,
    codes: [
      { lang: "text", code: `# Comparativo MBR vs GPT:

MBR (msdos):
- Até 2 TB de disco
- Até 4 partições primárias (ou 3 + 1 estendida)
- Sem checksum, sem backup automático
- Compatível com BIOS antigos

GPT:
- Discos de petabytes (sem limite prático)
- Até 128 partições
- Cabeçalho duplicado (no início e no fim, recuperável)
- Recomendada para UEFI; também funciona em BIOS com 'BIOS boot partition'` },
      { lang: "bash", code: `# Verificar qual tabela seu disco usa:
sudo parted /dev/sda print
# Saída típica para GPT:
# Model: Samsung SSD 870 EVO 1TB (scsi)
# Disk /dev/sda: 1000GB
# Sector size (logical/physical): 512B/512B
# Partition Table: gpt    <- aqui

# Para listar com sgdisk:
sudo sgdisk -p /dev/sda` },
      { lang: "text", code: `# Layout típico para uma máquina moderna UEFI + GPT:

Partição 1 (ESP)       /dev/sda1   1 GiB     FAT32   /boot/efi
Partição 2 (boot)      /dev/sda2   1 GiB     ext4    /boot      (opcional)
Partição 3 (swap)      /dev/sda3   8 GiB     swap    swap
Partição 4 (root)      /dev/sda4   restante  ext4    /

# Se a máquina é BIOS + GPT, troque ESP pela 'BIOS boot partition' de 1 MiB:
Partição 1 (BIOS boot) /dev/sda1   1 MiB     none    -          (sem mount)` },
      { lang: "bash", code: `# UUID, LABEL e PARTUUID: três formas estáveis de identificar partição.
sudo blkid /dev/sda3
# Saída:
# /dev/sda3: UUID="3b8e-..." TYPE="ext4" PARTUUID="abc-..."

# /etc/fstab pode usar qualquer um. Preferimos UUID:
# UUID=3b8e-xxx-yyy /  ext4  defaults,noatime  0 1

# Por que UUID? Porque /dev/sda pode virar /dev/sdb se você plugar
# outro disco antes do boot. UUID nunca muda.` },
      { lang: "text", code: `# Tamanhos típicos a planejar (mínimos saudáveis):

ESP                 512 MiB - 1 GiB
/boot (separado)    1 GiB
swap                igual à RAM (até 8 GB), depois metade da RAM
/                   30 GiB (mínimo); 50+ GiB se vai compilar muito
/home               o que sobrar
/var/tmp/portage    em tmpfs, separado, ou junto com / (o Portage compila aqui)` },
      { lang: "bash", code: `# Alinhamento de partições: importante para SSDs.
# Use sempre 1 MiB de offset inicial. Ferramentas modernas (parted, sgdisk, fdisk
# moderno, cfdisk) já fazem isso por padrão.
# Para conferir:
sudo parted /dev/sda align-check optimal 1
# Saída esperada: 1 aligned

# Desalinhamento mata performance de SSD em até 30%.` },
    ],
    points: [
      "MBR: limite de 2 TB e 4 partições primárias; só para hardware antigo.",
      "GPT: padrão moderno, suporta UEFI, partições praticamente ilimitadas.",
      "UEFI exige uma ESP (EFI System Partition) FAT32, montada em /boot/efi.",
      "BIOS + GPT exige uma 'BIOS boot partition' de 1 MiB sem filesystem para o GRUB.",
      "UUID identifica partições de forma estável; use no /etc/fstab em vez de /dev/sda1.",
      "swap pode ser partição ou arquivo; preferência por partição em sistemas com hibernação.",
      "Armadilha comum: criar ESP de 100 MB; alguns kernels com initramfs grandes não cabem.",
      "Iniciante comum: confundir 'tamanho da swap' com 'tamanho da RAM' literal e gastar 64 GB de SSD em swap inútil.",
    ],
    alerts: [
      { type: "danger", content: "Toda alteração na tabela de partições é destrutiva. Se você escreve uma nova GPT em cima de um MBR existente, perde acesso a todos os dados. Backup antes." },
      { type: "tip", content: "Em SSDs NVMe modernos, swap muito grande não é mais necessário. 4 a 8 GB cobre a maioria dos casos. Use ZRAM se quiser swap mais inteligente." },
      { type: "info", content: "PARTUUID é o ID da partição na tabela GPT; UUID é o ID do filesystem dentro dela. Se você reformata sem mexer na partição, PARTUUID continua, UUID muda." },
      { type: "warning", content: "Não copie layouts de tutoriais antigos sem ajustar. Layouts de 2010 separavam /usr, /var, /tmp em partições próprias; hoje quase nunca vale a pena." },
    ],
  },
  {
    slug: "sistemas-arquivo",
    section: "preparacao",
    title: "Sistemas de arquivo: ext4, xfs, btrfs, f2fs, zfs",
    difficulty: "iniciante",
    subtitle: "Qual filesystem escolher para cada cenário, com prós e contras práticos.",
    intro: `Depois da tabela de partições vem o sistema de arquivos: a estrutura que organiza arquivos e diretórios DENTRO de cada partição. No Linux você tem várias opções, e cada uma tem trade-offs reais. Escolher bem agora poupa dor depois — migrar de filesystem é trabalhoso e geralmente exige backup completo, formatação e restauração.

Para um Gentoo de uso geral em desktop ou servidor padrão, ext4 é a escolha mais segura: estável desde 2008, suportado por todo bootloader, ferramentas maduras (e2fsck, resize2fs, tune2fs), performance honesta. É o filesystem 'que simplesmente funciona' e o ponto de partida do Handbook. Se você não sabe o que escolher, escolha ext4.

XFS brilha em arquivos grandes e cargas de servidor (banco de dados, mídia). btrfs traz snapshots, subvolumes, RAID interno e compressão transparente, mas exige cuidado em casos avançados (RAID 5/6 ainda não recomendado para produção). f2fs foi desenhado para flash (SSD, eMMC), com vantagens em pequenos dispositivos. ZFS é o monstro corporativo: snapshots, dedup, RAID-Z, send/receive, integridade fim-a-fim — porém vem fora do kernel (CDDL incompatível com GPL) e exige cuidado extra no Gentoo.`,
    codes: [
      { lang: "text", code: `# Resumo comparativo (uso prático para escolher rápido):

ext4
+ Default de praticamente todo Linux há 15 anos
+ Estável, ferramentas maduras, recuperável
+ Boot loader sempre suporta
- Sem snapshots nativos
- Sem compressão
USE: 90% dos casos. Default seguro.

xfs
+ Excelente em arquivos grandes (mídia, BD)
+ Escalável para discos enormes
+ Reflinks (cópia barata via cp --reflink)
- Não pode encolher (só crescer)
- Menos popular em desktop
USE: servidores, NAS, /var em sistema com muito log.

btrfs
+ Snapshots, subvolumes, RAID 0/1/10
+ Compressão transparente (zstd)
+ Checksums detectam bit rot
- RAID 5/6 ainda instável
- Performance pode degradar com fragmentação
USE: desktops modernos, quem quer snapshots para rollback.

f2fs
+ Otimizado para flash (SSD, microSD)
+ Wear leveling consciente
- Pouco usado em desktop
USE: Raspberry Pi, embedded, tablets, dispositivos móveis.

zfs
+ Tudo: snapshots, dedup, send/receive, RAID-Z
+ Integridade end-to-end, recuperação superior
- Licença CDDL, fora do kernel mainline
- RAM-hungry (1 GB por TB recomendado)
USE: servidores corporativos, NAS sério, quem aceita complexidade.` },
      { lang: "bash", code: `# Comandos para formatar (atenção: apaga dados):

# ext4 (escolha padrão):
sudo mkfs.ext4 -L gentoo-root /dev/sda4

# ext4 com bloco pequeno (melhor para muitos arquivos pequenos):
sudo mkfs.ext4 -T news /dev/sda4

# xfs:
sudo mkfs.xfs -L data /dev/sda4

# btrfs:
sudo mkfs.btrfs -L gentoo /dev/sda4

# f2fs:
sudo mkfs.f2fs -l flash /dev/sda4

# vfat (para a ESP):
sudo mkfs.vfat -F32 -n EFI /dev/sda1

# swap:
sudo mkswap -L swap /dev/sda3
sudo swapon /dev/sda3` },
      { lang: "bash", code: `# Ver características de uma partição já formatada:
sudo dumpe2fs -h /dev/sda4    # ext2/3/4
sudo xfs_info /mnt/dados      # xfs
sudo btrfs filesystem show     # btrfs

# Espaço usado/livre:
df -hT
# Saída:
# Filesystem  Type  Size  Used Avail Use% Mounted on
# /dev/sda4   ext4   30G   12G   17G  42% /` },
      { lang: "bash", code: `# Subvolumes em btrfs (a 'feature matadora' para snapshots):
sudo mount /dev/sda4 /mnt/temp
sudo btrfs subvolume create /mnt/temp/@root
sudo btrfs subvolume create /mnt/temp/@home
sudo btrfs subvolume create /mnt/temp/@snapshots

# Depois você monta cada subvolume separadamente:
# /etc/fstab:
# UUID=... /        btrfs  defaults,subvol=@root      0 0
# UUID=... /home    btrfs  defaults,subvol=@home      0 0` },
      { lang: "ini", code: `# Quando escolher cada um (regra rápida):

Iniciante, desktop comum         -> ext4
Notebook moderno com SSD         -> ext4 ou btrfs
Servidor de aplicação web        -> ext4 ou xfs
NAS caseiro                      -> btrfs ou zfs
Servidor crítico, BD grande      -> xfs ou zfs
Raspberry Pi com microSD         -> f2fs ou ext4 (com noatime)
Estação que quer rollback fácil  -> btrfs (com snapshots)` },
    ],
    points: [
      "ext4 é a escolha padrão segura: maduro, estável, sem surpresas.",
      "xfs vence em arquivos grandes e cargas de servidor; não pode encolher partição.",
      "btrfs entrega snapshots, subvolumes e compressão transparente.",
      "f2fs é otimizado para flash: ótimo em microSD, eMMC, embedded.",
      "zfs é o mais poderoso, mas exige USE='zfs', mais RAM e cuidado de licença.",
      "Sempre rotule (LABEL) ao formatar; facilita identificar a partição depois.",
      "Armadilha comum: usar btrfs RAID 5/6 em produção (instável até 2024+).",
      "Iniciante comum: misturar filesystems sem necessidade (ext4 em / e xfs em /home, sem motivo).",
    ],
    alerts: [
      { type: "tip", content: "Para um primeiro Gentoo de desktop: ext4 em todas as partições, exceto a ESP que precisa ser FAT32. Você minimiza variáveis e foca em aprender Gentoo." },
      { type: "info", content: "Compressão zstd em btrfs (mount option compress=zstd:3) economiza 20-40% de espaço com pouco impacto de CPU. Especialmente útil em SSDs caros." },
      { type: "warning", content: "ZFS no Gentoo precisa do módulo carregado antes do mount. Em initramfs simples isso quebra o boot. Use dracut com --add zfs e teste com cuidado." },
      { type: "danger", content: "Não use btrfs RAID 5/6 para dados importantes. O 'write hole' ainda é um bug conhecido em 2024. Para RAID software, prefira mdadm + ext4 ou ZFS." },
    ],
  },
  {
    slug: "plano-particionamento",
    section: "preparacao",
    title: "Planejando o layout de partições",
    difficulty: "iniciante",
    subtitle: "Layouts típicos: simples, LVM, com /var separado, servidor, encryption-ready.",
    intro: `Agora que você entendeu MBR/GPT, ESP, sistemas de arquivos e identificadores, é hora de desenhar o layout final no papel antes de tocar em qualquer comando. Decidir 'depois eu vejo' costuma terminar em refazer tudo no fim de semana seguinte. Cinco ou dez minutos com lápis e papel agora valem horas no futuro.

Existem layouts canônicos que cobrem 95% das necessidades. O 'simples três partições' (ESP + swap + root) é o ponto de partida do Handbook e ideal para um primeiro Gentoo de desktop. O 'LVM' adiciona uma camada lógica para redimensionar volumes online — ótimo para servidor que cresce. O 'com /var separado' isola logs e dados de aplicação do sistema. E o 'encryption-ready' deixa a estrutura pronta para LUKS desde o começo.

A pergunta-chave em cada decisão é 'o que acontece se essa partição encher?'. Se / encher, o sistema para. Se /home encher, você não consegue salvar nada novo. Se /var/log encher num servidor sem rotação, dá problema sério. Separar partições é uma forma de conter esses cenários, ao custo de menos flexibilidade entre elas. Sem volumes lógicos (LVM), você não consegue 'pegar emprestado' espaço de uma partição que sobrou para outra que está cheia.`,
    codes: [
      { lang: "text", code: `# Layout 1: SIMPLES (recomendado para primeiro Gentoo, desktop comum)

/dev/sda1   1 GiB     FAT32   /boot/efi    (ESP)
/dev/sda2   8 GiB     swap    swap
/dev/sda3   restante  ext4    /

Pros: simples, fácil de entender, ferramentas básicas funcionam.
Cons: /home junto com /, não separa user data do sistema.` },
      { lang: "text", code: `# Layout 2: SIMPLES + /home (desktop com dados importantes)

/dev/sda1   1 GiB     FAT32   /boot/efi
/dev/sda2   8 GiB     swap    swap
/dev/sda3   50 GiB    ext4    /
/dev/sda4   restante  ext4    /home

Pros: pode reinstalar / sem perder /home.
Cons: precisa estimar tamanho de / com cuidado.` },
      { lang: "text", code: `# Layout 3: COM /var separado (servidor, máquina com muitos logs)

/dev/sda1   1 GiB     FAT32   /boot/efi
/dev/sda2   8 GiB     swap    swap
/dev/sda3   30 GiB    ext4    /
/dev/sda4   50 GiB    xfs     /var
/dev/sda5   restante  ext4    /home

Pros: log explosivo não enche /; bom para containers em /var/lib/docker.
Cons: mais complexo, mais chances de cálculo errado de tamanho.` },
      { lang: "text", code: `# Layout 4: LVM (servidor que cresce, NAS, lab)

/dev/sda1   1 GiB     FAT32   /boot/efi
/dev/sda2   1 GiB     ext4    /boot
/dev/sda3   restante  LVM PV  -

  Volume Group: vg0
    LV root      30 GiB    /
    LV home      100 GiB   /home
    LV var       50 GiB    /var
    LV swap      8 GiB     swap
    LV livre     restante  (para crescer LVs depois)

Pros: redimensiona online, snapshots LVM, flexibilidade total.
Cons: camada extra, /boot precisa ficar fora do LVM (geralmente).` },
      { lang: "text", code: `# Layout 5: ENCRYPTION-READY (notebook que sai de casa)

/dev/sda1   1 GiB     FAT32           /boot/efi  (não cifrado)
/dev/sda2   1 GiB     ext4            /boot      (não cifrado)
/dev/sda3   restante  LUKS container  -
              -> mapper: cryptroot
                  -> LVM PV
                      LV root, LV home, LV swap

Pros: dados em repouso protegidos por senha forte.
Cons: senha no boot, performance levemente menor, complexidade alta.` },
      { lang: "ini", code: `# Recomendações de tamanho (saudáveis, não mínimos):

/boot/efi             1024 MiB  (cabe vários kernels e initramfs)
/boot (separado)      1024 MiB  (se for cifrar / inteiro)
swap                  4 GB - 16 GB (igual à RAM se for hibernar; 4-8 GB caso geral)
/                     30 GB - 50 GB (Gentoo + Portage tree + cache de distfiles)
/home                 o que sobrar
/var (separado)       30 GB - 100 GB (logs, containers, banco)
/var/tmp/portage      tmpfs ou junto com / (precisa 4 GB+ para chromium)` },
      { lang: "bash", code: `# Esboço final no papel ANTES de partir para parted/sgdisk.
# Anote em um bloco assim, com tamanhos calculados:

# Disco: /dev/nvme0n1, 500 GB
# nvme0n1p1   1G    ESP        /boot/efi
# nvme0n1p2   8G    swap       (RAM = 8G, sem hibernar)
# nvme0n1p3   60G   ext4       /
# nvme0n1p4   restante ext4    /home
# Total: ~500G  OK

# Só depois desse esboço você abre o cfdisk/parted e cria as partições.` },
    ],
    points: [
      "Esboce o layout no papel antes de tocar em qualquer comando de particionamento.",
      "Layout simples (3 partições) é ideal para primeiro Gentoo.",
      "Separar /home permite reinstalar / sem perder dados.",
      "Separar /var é útil em servidor para conter explosão de logs ou containers.",
      "LVM dá flexibilidade para redimensionar partições online; vale para servidor.",
      "LUKS exige /boot fora da criptografia (ou GRUB com suporte LUKS configurado).",
      "Armadilha comum: ESP de 100 MB; deixe pelo menos 512 MiB para múltiplos kernels.",
      "Iniciante comum: dimensionar / com 15 GB e ficar sem espaço após instalar 3 jogos via Steam.",
    ],
    alerts: [
      { type: "tip", content: "Tire foto do esboço com o celular antes de começar. Você vai consultar várias vezes durante particionamento, formatação e fstab." },
      { type: "warning", content: "LVM por dentro de LUKS por dentro de RAID é poderoso, mas é um Gentoo de fim de semana inteiro. Comece simples; complique depois que dominar o básico." },
      { type: "info", content: "Em SSD NVMe, o 'overprovisioning' interno do disco já cuida de wear leveling. Não precisa deixar 20% sem particionar como antigamente." },
      { type: "success", content: "Um layout bem planejado economiza tempo de manutenção por anos. Vale a pena pensar agora em vez de remendar depois." },
    ],
  },
];
