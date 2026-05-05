import type { Chapter } from "../types";

export const chapters: Chapter[] = [
  {
    slug: "emerge-intro",
    section: "portage-basico",
    title: "emerge: instalando seu primeiro pacote",
    difficulty: "iniciante",
    subtitle: "Como o gerenciador de pacotes do Gentoo trabalha e por que ele compila.",
    intro: `Em distribuições como Ubuntu ou Fedora, instalar um programa é baixar um arquivo já pronto e copiar para o lugar certo. No Gentoo a coisa é diferente: o gerenciador chamado 'Portage' lê uma receita (chamada ebuild), baixa o código-fonte do programa, configura, compila e instala — tudo na sua máquina, com as opções que você escolheu. O comando que dispara isso é o 'emerge'.

Compilar leva mais tempo, mas dá em troca duas coisas raras: você decide exatamente quais funcionalidades entram (via USE flags, que vamos ver depois) e o binário gerado é otimizado para o seu processador. Isso é o coração da filosofia 'do meu jeito' do Gentoo. Pacote nenhum vem com lixo que você não pediu.

Neste capítulo você vai aprender a sintaxe básica do emerge, instalar um programa real (vim), entender a saída colorida, e descobrir por que sempre se usa a flag '--ask'. No próximo veremos o conjunto 'world', que é como o Portage lembra do que VOCÊ pediu para instalar.`,
    codes: [
      { lang: "bash", code: `# Sempre rode emerge como root (ou via sudo).
# A flag --ask (-a) mostra o que será feito e PEDE confirmação.
sudo emerge --ask app-editors/vim

# A categoria (app-editors) é opcional, mas evita ambiguidades.
# Sem ela: sudo emerge --ask vim — o Portage avisa se houver dúvida.` },
      { lang: "text", code: `# Saída típica antes da confirmação:
These are the packages that would be merged, in order:

Calculating dependencies... done!
[ebuild  N     ] app-editors/vim-9.1.0  USE="acl nls -X -gtk -python" 14 MiB

Total: 1 package (1 new), Size of downloads: 14 MiB

Would you like to merge these packages? [Yes/No]` },
      { lang: "bash", code: `# Para apenas SIMULAR (não instala), use --pretend (-p):
emerge --pretend app-editors/vim

# Para forçar reinstalação:
sudo emerge --ask --oneshot app-editors/vim

# Para desinstalar (cuidado, --depclean é mais seguro depois):
sudo emerge --ask --deselect app-editors/vim` },
      { lang: "bash", code: `# Atualizando o sistema inteiro (a 'oração' do gentooísta):
sudo emerge --ask --update --deep --newuse @world
# Forma curta equivalente: sudo emerge -auDN @world` },
      { lang: "bash", code: `# Para LER o que o Portage acha do pacote sem instalar:
emerge --info app-editors/vim
emerge --search vim         # busca por nome
emerge --searchdesc editor  # busca também na descrição` },
    ],
    points: [
      "emerge é o comando central — todo o gerenciamento de pacotes passa por ele.",
      "Sempre use --ask (-a) na primeira vez para revisar antes de instalar.",
      "[ebuild N] = novo, [R] = reinstalação, [U] = update, [D] = downgrade.",
      "Categoria/pacote (app-editors/vim) é o nome canônico; só 'vim' funciona quando não há ambiguidade.",
      "USE flags em maiúscula são ativadas; com '-' na frente, desativadas.",
      "Atualização total do sistema: emerge -auDN @world (memorize esta combinação).",
      "Armadilha comum: rodar emerge sem --ask e perceber tarde que vai compilar 200 pacotes.",
      "Iniciante comum: confundir --deselect (tira do world) com --unmerge (remove de verdade).",
    ],
    alerts: [
      { type: "tip", content: "Crie um alias no shell: alias up='sudo emerge -auDNv @world'. Vai usar este comando todo dia." },
      { type: "warning", content: "Nunca interrompa um emerge no meio (Ctrl+C) durante a fase de instalação ('Installing'). Isso pode deixar o sistema com arquivos meia-boca. Aguarde até a próxima fase." },
      { type: "info", content: "O Portage roda compilação em /var/tmp/portage por padrão. Se você está com pouco espaço, monte essa pasta em tmpfs ou em um disco maior antes de partir para builds grandes como chromium ou libreoffice." },
      { type: "success", content: "O Portage tem um modo 'binário' (binpkg) que instala pacotes pré-compilados oficiais para acelerar o início. Veremos no capítulo de otimização." },
    ],
  },
  {
    slug: "world-set",
    section: "portage-basico",
    title: "O conjunto @world: o que o sistema lembra",
    difficulty: "iniciante",
    subtitle: "Entenda o arquivo world e por que ele é o pilar de qualquer atualização sadia.",
    intro: `Toda vez que você roda 'emerge --ask app-editors/vim', o Portage faz duas coisas: instala o vim e anota o nome dele em um arquivo simples chamado /var/lib/portage/world. Esse arquivo é a memória do que VOCÊ explicitamente pediu para ter no sistema. Tudo o mais que está instalado (libc, gcc, openssl, etc.) é dependência de algo que está no world ou no @system.

O conjunto @world é a união de @selected (o que está no arquivo world) com @system (pacotes essenciais definidos pelo profile). Quando você roda 'emerge -auDN @world', o Portage atualiza tudo isso e suas dependências. Sem world atualizado, o emerge não sabe o que recompilar quando uma USE flag muda.

Saber manipular o world é crítico: se você adicionar um pacote sem precisar dele depois, ele continua no world e fica sendo atualizado para sempre. Se removê-lo errado, perde a referência e ele vira candidato a depclean. Este capítulo te mostra como adicionar, remover e auditar com calma.`,
    codes: [
      { lang: "bash", code: `# Veja o arquivo world (texto simples, uma linha por pacote).
cat /var/lib/portage/world
# Exemplo de conteúdo:
# app-editors/vim
# net-misc/openssh
# sys-apps/portage` },
      { lang: "bash", code: `# Instalar SEM adicionar ao world (uso pontual ou dependência manual):
sudo emerge --ask --oneshot dev-libs/openssl

# Adicionar depois ao world manualmente (ex: já estava instalado como dep):
sudo emerge --ask --select app-editors/vim

# Tirar do world (NÃO desinstala — só esquece que você quis):
sudo emerge --ask --deselect app-editors/vim` },
      { lang: "bash", code: `# Listar tudo que está no @selected (= world):
emerge --pretend --deep --depclean
# Mostra o que SERIA removido se você não tivesse o world.

# Listar @system (essenciais do profile):
emerge --info --verbose @system | head` },
      { lang: "bash", code: `# Atualização correta diária:
sudo emerge --ask --update --deep --newuse --with-bdeps=y @world
# --with-bdeps=y inclui dependências de build (recomendado).
# -a -u -D -N são as iniciais comuns.` },
      { lang: "text", code: `# Saída esperada quando world está limpo e atualizado:
 * IMPORTANT: 0 news items need reading for repository 'gentoo'.
Calculating dependencies... done!
Total: 0 packages, Size of downloads: 0 KiB

Nothing to merge; quitting.` },
    ],
    points: [
      "/var/lib/portage/world guarda apenas o que VOCÊ pediu explicitamente.",
      "@world = @selected (world) + @system (pacotes do profile).",
      "--oneshot instala sem registrar; útil para deps manuais ou testes.",
      "--deselect remove do world mas mantém instalado; --unmerge remove de verdade.",
      "Sempre rode atualizações contra @world, nunca pacote a pacote, para evitar drift.",
      "--with-bdeps=y atualiza também ferramentas de build (autoconf, cmake, etc.).",
      "Armadilha comum: editar /var/lib/portage/world à mão e errar a sintaxe (uma linha por átomo).",
      "Iniciante comum: usar --unmerge em algo do @system e quebrar o sistema.",
    ],
    alerts: [
      { type: "warning", content: "Nunca use --unmerge em pacotes do @system (glibc, gcc, baselayout, openrc, etc.). Você quebra o sistema na hora. Use --depclean que respeita as proteções." },
      { type: "tip", content: "Faça backup periódico de /var/lib/portage/world. Em uma reinstalação, basta restaurar esse arquivo e rodar emerge -auDN @world para reerguer todo seu ambiente." },
      { type: "info", content: "O profile escolhido (eselect profile) define os pacotes do @system. Trocar de profile pode mudar drasticamente o que é considerado 'essencial'." },
    ],
  },
  {
    slug: "news",
    section: "portage-basico",
    title: "GLEP 42: lendo as notícias do Portage",
    difficulty: "iniciante",
    subtitle: "Por que ignorar as 'news' do Gentoo é receita garantida para sistema quebrado.",
    intro: `O Gentoo não tem um sistema de pop-ups nem painel de notificações. Quando os desenvolvedores precisam avisar 'olha, na próxima atualização vai mudar X e você precisa fazer Y antes', eles publicam um arquivo de notícia (news item) através do mecanismo definido pela GLEP 42. Esses avisos chegam junto com 'emerge --sync'.

Toda vez que você sincroniza a árvore do Portage, ele te mostra uma linha como ' * IMPORTANT: 3 news items need reading for repository gentoo'. Ignorar isso é dos pecados capitais. As notícias contêm migrações de profile, mudanças de USE flags padrão, deprecações de pacote e outras pegadinhas que se você atualizar antes de ler, vão te custar horas de troubleshooting.

A ferramenta para ler é o 'eselect news', que funciona como uma pequena caixa de email. Você lista, lê e marca como lida. Algumas notícias incluem comandos exatos a executar antes do próximo emerge. Sempre leia ANTES do '@world'.`,
    codes: [
      { lang: "bash", code: `# Listar notícias pendentes (N) e lidas:
eselect news list

# Saída típica:
# Available news items:
#   [1]   N  2024-03-15  Python 3.12 to be default
#   [2]   N  2024-04-02  GCC 14 stable, ABI break
#   [3]      2023-11-10  Old news already read` },
      { lang: "bash", code: `# Ler uma notícia específica:
eselect news read 1

# Ler todas as pendentes em sequência:
eselect news read

# Marcar como lida sem abrir (cuidado, perde o conteúdo):
eselect news read --quiet all` },
      { lang: "text", code: `# Exemplo real de uma news que quebraria seu sistema se ignorada:
Title: Python 3.12: default Python target update
Author: Gentoo Python Project
Posted: 2024-03-15
Revision: 1

The default PYTHON_TARGETS now includes only python3_12.
Before running emerge -uDN @world, please run:

  emerge --ask --oneshot dev-lang/python:3.12
  emerge --ask --depclean

Failure to do so may leave packages built against
the old python unable to load.` },
      { lang: "bash", code: `# Fluxo recomendado em qualquer atualização:
sudo emerge --sync          # ou eix-sync
eselect news list           # alguma 'N' pendente?
eselect news read           # leia todas
sudo emerge -auDN @world    # só agora atualize` },
    ],
    points: [
      "News são o canal oficial de comunicação Gentoo → usuário.",
      "Sempre rode 'eselect news list' depois de cada 'emerge --sync'.",
      "Algumas news contêm comandos que devem ser executados ANTES do próximo @world.",
      "News ficam em /var/db/news/ no formato GLEP 42 (texto simples).",
      "O Portage te avisa, com '* IMPORTANT', cada vez que houver news não lida.",
      "Marcar como lida sem ler é tecnicamente possível, mas é dar tiro no pé.",
      "Armadilha comum: rodar emerge -auDN @world ignorando o aviso e travar no meio.",
      "Iniciante comum: confundir news com bug — news é informativo, bug é problema técnico.",
    ],
    alerts: [
      { type: "danger", content: "Ignorar uma news que envolve mudança de PYTHON_TARGETS, profile ou ABI de gcc pode deixar o sistema sem ferramentas básicas. Leia sempre." },
      { type: "tip", content: "Adicione 'eselect news list' ao mesmo alias de update: alias up='sudo emerge --sync && eselect news list'. Você não esquece." },
      { type: "info", content: "As news também ficam disponíveis em https://gentoo.org/support/news/ se você quiser ler do navegador antes de sincronizar." },
    ],
  },
  {
    slug: "depclean",
    section: "portage-basico",
    title: "depclean: tirando o lixo sem quebrar nada",
    difficulty: "intermediario",
    subtitle: "Limpe dependências órfãs com segurança usando emerge --depclean e ferramentas auxiliares.",
    intro: `Com o tempo, sua máquina acumula bibliotecas que foram dependência de algo que você desinstalou ou que o pacote deixou de precisar. No Gentoo isso vira espaço em disco perdido e tempo de build extra em cada @world. O comando 'emerge --depclean' identifica esses pacotes órfãos com base no @world e no @system e remove com segurança.

A regra do depclean é simples: se um pacote NÃO está no world, NÃO está no system, e NADA do que está nesses dois conjuntos depende dele, ele é candidato a remoção. Por isso ter o world bem mantido (capítulo anterior) é pré-requisito. Um world inflado faz o depclean preservar coisas que nem importam.

Depois do depclean você precisa cuidar de bibliotecas que ainda estão sendo usadas por binários instalados, mas cujas versões mudaram. Ferramentas como 'revdep-rebuild' (do gentoolkit) e o sistema 'preserved-libs' do Portage moderno fazem essa segunda passada. Este capítulo cobre o ciclo completo de faxina segura.`,
    codes: [
      { lang: "bash", code: `# SEMPRE rode com --pretend primeiro para ver o que sairia:
sudo emerge --ask --pretend --depclean

# Quando confiante, rode de verdade:
sudo emerge --ask --depclean

# Limitar a um pacote específico:
sudo emerge --ask --depclean dev-libs/old-lib` },
      { lang: "text", code: `# Saída típica do --depclean:
Calculating dependencies... done!
>>> Calculating removal order...

 dev-libs/libfoo
    selected: 1.2.3
   protected: none
     omitted: none

Number to remove: 1

Would you like to unmerge these packages? [Yes/No]` },
      { lang: "bash", code: `# Após o depclean, o Portage pode preservar libs ainda em uso (preserved-libs).
# Liste-as:
sudo emerge @preserved-rebuild --pretend

# Recompile o que ainda usa libs antigas:
sudo emerge --ask @preserved-rebuild` },
      { lang: "bash", code: `# revdep-rebuild (gentoolkit) faz a verificação clássica:
sudo emerge --ask app-portage/gentoolkit
sudo revdep-rebuild --pretend
sudo revdep-rebuild

# lafilefixer corrige .la quebrados (libtool):
sudo emerge --ask app-portage/lafilefixer
sudo lafilefixer --justfixit` },
      { lang: "bash", code: `# Fluxo de faxina recomendado a cada 1-2 meses:
sudo emerge --sync
eselect news read
sudo emerge -auDN --with-bdeps=y @world
sudo emerge --ask --depclean
sudo emerge --ask @preserved-rebuild
sudo revdep-rebuild --ignore` },
    ],
    points: [
      "depclean remove pacotes que NÃO estão no @world nem no @system e que ninguém depende mais.",
      "Sempre rode com --pretend antes para revisar a lista.",
      "Mantenha o @world enxuto: pacotes errados lá impedem a remoção real.",
      "@preserved-rebuild é o sucessor moderno do revdep-rebuild para libs preservadas.",
      "revdep-rebuild varre binários e detecta linkagem quebrada.",
      "lafilefixer cuida de arquivos .la órfãos do libtool.",
      "Armadilha comum: deixar de rodar @preserved-rebuild e ter binários travando 'symbol not found'.",
      "Iniciante comum: rodar depclean sem world atualizado e perder pacotes que ainda queria.",
    ],
    alerts: [
      { type: "warning", content: "depclean respeita o @system, mas pode remover pacotes que você ESQUECEU de deselecionar. Sempre revise a lista do --pretend antes de confirmar." },
      { type: "tip", content: "Depois de mudar profile (eselect profile set), rode depclean: muita coisa do system antigo vira órfã." },
      { type: "info", content: "Pacotes preservados ficam registrados em /var/lib/portage/preserved_libs_registry. O Portage moderno gerencia isso melhor que as versões antigas." },
      { type: "success", content: "Um sistema Gentoo bem cuidado fica enxuto: cabe em 8-12 GB para um desktop completo, sem o /var/cache/distfiles." },
    ],
  },
  {
    slug: "search-info",
    section: "portage-basico",
    title: "Buscando pacotes e coletando informação",
    difficulty: "iniciante",
    subtitle: "emerge --search, --searchdesc, --info e os primeiros passos para abrir bug bem feito.",
    intro: `Antes de instalar qualquer coisa você precisa achar o nome certo do pacote. No Gentoo, o nome canônico segue o formato 'categoria/pacote' (por exemplo 'app-editors/vim'). Esse nome às vezes não é óbvio: o programa 'firefox' está em 'www-client/firefox', e o servidor web nginx está em 'www-servers/nginx'. O 'emerge --search' resolve isso.

Além de buscar, o Portage te dá um relatório completo do ambiente com 'emerge --info'. Esse relatório contém versão do gcc, glibc, profile, USE flags, MAKEOPTS, FEATURES, kernel, e tudo mais que importa para reproduzir um problema. Quando você for abrir um bug ou pedir ajuda em fórum/IRC, o --info é o anexo padrão obrigatório.

Este capítulo cobre as ferramentas internas do Portage. No próximo veremos eix e equery (gentoolkit), que são versões muito mais rápidas e poderosas das mesmas funções. Mas o emerge --search e --info estão sempre disponíveis, mesmo num sistema recém-instalado, e por isso você precisa dominar.`,
    codes: [
      { lang: "bash", code: `# Buscar por nome (regex parcial):
emerge --search vim
# ou forma curta:
emerge -s vim

# Buscar também na descrição (mais lento, mais resultados):
emerge --searchdesc "text editor"
emerge -S "text editor"` },
      { lang: "text", code: `# Saída típica de emerge -s vim:
[ Results for search key : vim ]

*  app-editors/vim
      Latest version available: 9.1.0
      Latest version installed: 9.1.0
      Size of files: 14,234 KiB
      Homepage:      https://www.vim.org/
      Description:   Vim, an improved vi-style text editor
      License:       vim` },
      { lang: "bash", code: `# Coletar informação completa do sistema (anexar a bug reports):
emerge --info > /tmp/emerge-info.txt

# Info de um pacote específico (mostra USE flags com que foi compilado):
emerge --info app-editors/vim` },
      { lang: "bash", code: `# Verificar quais USE flags um pacote suporta antes de instalar:
emerge --pretend --verbose app-editors/vim

# Saída de exemplo:
# [ebuild   R   ] app-editors/vim-9.1.0  USE="acl nls -X -gtk -lua -python%"` },
      { lang: "bash", code: `# Conferir dependências sem instalar:
emerge --pretend --tree app-editors/vim
emerge -pt app-editors/vim

# Quanto vai baixar?
emerge --pretend --fetchonly app-editors/vim` },
    ],
    points: [
      "emerge -s busca no nome; emerge -S busca também na descrição.",
      "O nome canônico é categoria/pacote (use sempre que houver ambiguidade).",
      "emerge --info é o anexo obrigatório de qualquer bug report no Gentoo.",
      "emerge -pv mostra USE flags que serão usadas (% indica mudança recente).",
      "emerge -pt mostra a árvore de dependências sem instalar nada.",
      "--fetchonly só baixa fontes, útil para preparar build offline.",
      "Armadilha comum: pesquisar 'vim' sem ler categoria e instalar gvim por engano.",
      "Iniciante comum: pedir ajuda no fórum sem anexar emerge --info — ninguém consegue ajudar.",
    ],
    alerts: [
      { type: "tip", content: "Salve sempre 'emerge --info' antes de uma operação grande. Se algo quebrar, você tem o estado anterior para comparar." },
      { type: "info", content: "emerge --search é lento porque varre toda a árvore. Para pesquisas frequentes, instale eix (próximo capítulo): é 100x mais rápido." },
      { type: "warning", content: "USE flags marcadas com '%' significam que mudaram desde a última instalação. Sempre revise antes de confirmar — pode mudar comportamento do programa." },
    ],
  },
  {
    slug: "eix-equery",
    section: "portage-basico",
    title: "eix e equery: ferramentas que você vai usar todo dia",
    difficulty: "intermediario",
    subtitle: "Buscas instantâneas com eix e introspecção avançada com equery do gentoolkit.",
    intro: `O 'emerge --search' funciona, mas é lento porque varre /var/db/repos/gentoo a cada chamada. A solução é o 'eix' (app-portage/eix), que mantém um cache binário pré-indexado da árvore do Portage. Uma busca em eix volta em milésimos de segundo, e o utilitário 'eix-sync' substitui 'emerge --sync' atualizando árvore e cache de uma vez.

A outra ferramenta indispensável é o 'equery' (do pacote app-portage/gentoolkit). Onde o emerge te conta o básico, o equery responde perguntas mais complexas: 'qual pacote instalou esse arquivo?', 'que pacotes dependem desse?', 'que USE flags estão ativas em qual pacote?'. É literalmente o canivete suíço de quem administra Gentoo.

Juntas, eix e equery economizam horas por semana. Este capítulo te ensina a instalar, sincronizar e usar os comandos que você vai digitar no terminal todo santo dia. Considere obrigatório.`,
    codes: [
      { lang: "bash", code: `# Instalar as duas ferramentas (faça isso agora):
sudo emerge --ask app-portage/eix app-portage/gentoolkit

# Inicializar o cache do eix:
sudo eix-update` },
      { lang: "bash", code: `# Sincronizar árvore + cache em uma única operação:
sudo eix-sync

# Buscar (instantâneo, com cores e versões):
eix vim
eix --installed     # só pacotes instalados
eix -c firefox      # saída compacta (uma linha)` },
      { lang: "text", code: `# Saída típica do eix:
* app-editors/vim
     Available versions:  9.0.2186 ~9.1.0 9.1.0 {acl crypt cscope debug gpm
                          lua minimal nls perl python racket ruby selinux
                          sound terminal tcl vim-pager X}
     Installed versions:  9.1.0(09:42:17 14/03/2024)(acl nls -X -gtk)
     Homepage:            https://www.vim.org/
     Description:         Vim, an improved vi-style text editor` },
      { lang: "bash", code: `# equery: descobrir QUEM instalou um arquivo (tipo dpkg -S no Debian):
equery belongs /usr/bin/vim
# Saída: app-editors/vim-9.1.0 (/usr/bin/vim)

# Listar arquivos instalados por um pacote:
equery files app-editors/vim | head` },
      { lang: "bash", code: `# Quem depende desse pacote? (ótimo antes de remover algo):
equery depends dev-libs/openssl

# USE flags ativas e suas descrições:
equery uses app-editors/vim

# Procurar pacotes que tenham determinada USE flag:
equery hasuse python` },
      { lang: "bash", code: `# Sincronização + leitura de news + preview de update tudo junto:
sudo eix-sync && eselect news list && emerge -puDN @world | tail -20` },
    ],
    points: [
      "eix-sync substitui emerge --sync e atualiza o cache do eix junto.",
      "eix é 100x mais rápido que emerge --search.",
      "equery belongs <arquivo> = 'qual pacote instalou esse arquivo?'.",
      "equery depends <pkg> = 'quem depende desse pacote?' (essencial antes de remover).",
      "equery files <pkg> lista todos os arquivos que um pacote colocou no sistema.",
      "equery uses mostra USE flags com descrição humana.",
      "Armadilha comum: rodar eix sem rodar eix-update primeiro e ter resultados velhos.",
      "Iniciante comum: usar emerge --search no dia a dia em vez de eix (vai sofrer).",
    ],
    alerts: [
      { type: "tip", content: "Coloque 'sudo eix-sync' como primeiro comando do seu script de manutenção semanal. É o único 'sync' que você precisa." },
      { type: "success", content: "gentoolkit também traz qlop (tempo de builds), qlist (listar arquivos rapidamente), euse (gerenciar USE flags). Vale explorar." },
      { type: "info", content: "O eix lê a árvore offline; se você quiser informação mais nova que o último sync, sincronize antes." },
    ],
  },
  {
    slug: "mascaramento",
    section: "portage-basico",
    title: "Mascaramento e keywords: stable vs testing",
    difficulty: "intermediario",
    subtitle: "Como o Portage decide qual versão você instala — e como você sobrescreve essa decisão.",
    intro: `O Portage tem um sistema de classificação de versões em três níveis: 'stable' (testado, marcado como amd64), 'testing' (~amd64, candidato a estável) e 'masked' (escondido por motivo grave). Por padrão, o Gentoo te entrega só versões stable. Se você quer uma versão mais nova ou um pacote ainda não promovido, precisa 'desmascarar'.

O mascaramento acontece em vários níveis: package.mask (pacote completamente bloqueado), keywords (~amd64 indicando testing), license mask (precisa aceitar EULA), e profile masks (pacotes inadequados ao seu profile). Cada um tem sua sobrescrita correspondente em /etc/portage/package.{mask,unmask,accept_keywords,license}.

Saber quando e como mexer nisso é o que separa um usuário Gentoo confortável de alguém preso na versão estável de tudo. Mas com poder vem responsabilidade: misturar stable e testing sem critério leva a 'dependency hell'. Este capítulo te dá o mapa.`,
    codes: [
      { lang: "bash", code: `# Tentar instalar algo em ~amd64 (testing) num sistema stable:
sudo emerge --ask =app-editors/vim-9.2.0

# Saída típica:
# !!! All ebuilds that could satisfy "=app-editors/vim-9.2.0"
# !!! have been masked.
# - app-editors/vim-9.2.0::gentoo (masked by: ~amd64 keyword)` },
      { lang: "bash", code: `# Permitir testing APENAS para esse pacote:
sudo mkdir -p /etc/portage/package.accept_keywords
echo "=app-editors/vim-9.2.0 ~amd64" \\
  | sudo tee /etc/portage/package.accept_keywords/vim

# Liberar todas as versões testing de um pacote:
echo "app-editors/vim ~amd64" \\
  | sudo tee /etc/portage/package.accept_keywords/vim` },
      { lang: "conf", code: `# /etc/portage/package.accept_keywords/desktop
# Estilo de organização: um arquivo por tema.
app-editors/vim       ~amd64
sys-kernel/gentoo-sources ~amd64
=dev-lang/rust-1.80*  ~amd64

# Operadores: =, >=, <=, ~ (família X.Y.*)` },
      { lang: "bash", code: `# Mascarar manualmente uma versão problemática:
sudo mkdir -p /etc/portage/package.mask
echo ">=sys-kernel/gentoo-sources-6.10" \\
  | sudo tee /etc/portage/package.mask/kernel-newer

# Desmascarar algo que veio mascarado pelo upstream:
sudo mkdir -p /etc/portage/package.unmask
echo "=dev-lang/python-3.13.0_alpha1" \\
  | sudo tee /etc/portage/package.unmask/python313` },
      { lang: "conf", code: `# /etc/portage/make.conf — ACCEPT_LICENSE
# Por padrão, o Gentoo aceita só licenças livres (@FREE).
# Para EULA proprietárias (intel-microcode, linux-firmware redistribuíveis):
ACCEPT_LICENSE="-* @FREE @BINARY-REDISTRIBUTABLE"

# Aceitar tudo (não recomendado em produção):
# ACCEPT_LICENSE="*"` },
      { lang: "bash", code: `# Fluxo automático com --autounmask: deixa o Portage gerar os arquivos.
sudo emerge --ask --autounmask --autounmask-write =app-editors/vim-9.2.0
# Em seguida rode para aplicar mudanças propostas:
sudo dispatch-conf` },
    ],
    points: [
      "amd64 = stable; ~amd64 = testing; package.mask = bloqueado.",
      "/etc/portage/package.accept_keywords libera testing por pacote.",
      "/etc/portage/package.mask bloqueia versões; package.unmask remove bloqueio upstream.",
      "Operadores: = (versão exata), >=, <=, ~ (família X.Y).",
      "ACCEPT_LICENSE controla aceitação de EULA (linux-firmware, etc.).",
      "--autounmask-write cria as entradas necessárias automaticamente.",
      "Armadilha comum: liberar ~amd64 globalmente em ACCEPT_KEYWORDS e quebrar tudo no próximo @world.",
      "Iniciante comum: não rodar dispatch-conf depois de --autounmask-write e o emerge falhar de novo.",
    ],
    alerts: [
      { type: "danger", content: "Nunca coloque ACCEPT_KEYWORDS=\"~amd64\" no make.conf de produção sem entender o impacto. Isso transforma o sistema inteiro em testing e dependency conflicts viram norma." },
      { type: "warning", content: "Quando misturar stable e testing, prefira liberar pacote por pacote (=cat/pkg-X ~amd64). É a única forma de manter a casa em ordem." },
      { type: "tip", content: "Use sempre subdiretórios em /etc/portage/package.* (um arquivo por tema: kernel, desktop, dev). Fica mais fácil revisar e versionar com git." },
      { type: "info", content: "package.use.mask, package.use.force e package.env permitem controle ainda mais granular. Veremos no capítulo de configuração avançada." },
    ],
  },
  {
    slug: "slots",
    section: "portage-basico",
    title: "SLOTs: várias versões coexistindo no mesmo sistema",
    difficulty: "intermediario",
    subtitle: "Como o Gentoo permite ter Python 3.11 e 3.12, GCC 13 e 14, sem conflito.",
    intro: `Em quase toda distribuição Linux, instalar uma nova versão de algo grande (Python, GCC, PHP) sobrescreve a anterior. Isso causa o problema clássico: 'meu projeto só roda em Python 3.10, o sistema atualizou para 3.12, agora nada funciona'. O Gentoo resolve com SLOTs: cada versão maior ocupa um 'slot' diferente e pode coexistir com outras.

Um SLOT é declarado no ebuild como um número (ex: SLOT=\"3.12\"). Pacotes que dependem de algo com slot específico são compilados contra aquela versão. Por isso você pode ter dev-lang/python:3.11 e dev-lang/python:3.12 instalados ao mesmo tempo, e o eselect te deixa escolher qual é o 'principal' para scripts genéricos.

Os exemplos mais clássicos de slots em Gentoo são gcc, python, php, java-vm, qt, kde-frameworks e o próprio kernel. Saber listar, escolher e remover slots é fundamental para upgrades sem dor.`,
    codes: [
      { lang: "bash", code: `# Listar slots instalados de python:
eselect python list

# Saída típica:
# Available Python interpreters, in order of preference:
#   [1]   python3.12 (selected)
#   [2]   python3.11
#   [3]   python2.7

# Mudar o python padrão do sistema:
sudo eselect python set 2` },
      { lang: "bash", code: `# Instalar uma versão específica de python via slot:
sudo emerge --ask dev-lang/python:3.13
# Note os DOIS PONTOS — sintaxe oficial para slot.

# Listar versões de gcc instaladas:
gcc-config -l
# ou:
eselect gcc list

# Trocar a versão padrão de gcc:
sudo gcc-config 2
source /etc/profile` },
      { lang: "text", code: `# Saída de eix mostrando múltiplos slots de Python:
* dev-lang/python
     Available versions:
        (3.10) 3.10.14
        (3.11) 3.11.9
        (3.12) 3.12.4
        (3.13) ~3.13.0_beta3
     Installed versions: 3.11.9(3.11) 3.12.4(3.12)` },
      { lang: "conf", code: `# /etc/portage/make.conf — definir quais slots de Python compilar para
PYTHON_TARGETS="python3_11 python3_12"
PYTHON_SINGLE_TARGET="python3_12"

# Aplicar e recompilar pacotes Python afetados:
# sudo emerge -auDN @world` },
      { lang: "bash", code: `# Remover um slot antigo SEM bagunçar o sistema:
sudo emerge --ask --depclean dev-lang/python:3.10

# Forçar (atenção): remover slot específico via unmerge:
sudo emerge --ask --unmerge =dev-lang/python-3.10*` },
    ],
    points: [
      "SLOT permite múltiplas versões maiores do mesmo pacote coexistirem.",
      "Sintaxe: categoria/pacote:SLOT (ex: dev-lang/python:3.12).",
      "eselect python/gcc list/set escolhe a versão padrão chamada por scripts genéricos.",
      "PYTHON_TARGETS no make.conf define para quais slots os módulos serão compilados.",
      "Trocar de slot exige rodar 'source /etc/profile' (ou abrir novo shell).",
      "depclean remove slots antigos quando ninguém depende mais deles.",
      "Armadilha comum: trocar gcc com gcc-config e esquecer de recarregar /etc/profile.",
      "Iniciante comum: tentar instalar 'python' sem slot e o Portage escolher slot diferente do esperado.",
    ],
    alerts: [
      { type: "tip", content: "Depois de mudar slot de gcc com gcc-config, rode 'sudo emerge --ask --oneshot sys-devel/libtool' para evitar problemas em compilações subsequentes." },
      { type: "info", content: "kde-frameworks e qt usam slots para permitir transições suaves entre versões maiores. Por isso atualizações de KDE são tão tranquilas no Gentoo." },
      { type: "warning", content: "Não confunda SLOT com sub-slot (ex: 0/1.1). Sub-slot indica que mudanças de ABI requerem rebuild de quem depende — o Portage cuida automaticamente com -N." },
    ],
  },
  {
    slug: "useflags-intro",
    section: "portage-basico",
    title: "USE flags: a alma da personalização",
    difficulty: "iniciante",
    subtitle: "Decida no momento da compilação quais funcionalidades cada pacote terá.",
    intro: `USE flag é provavelmente a coisa mais característica do Gentoo. É um interruptor de compilação: cada pacote declara um conjunto de USE flags que ativam ou desativam funcionalidades opcionais. Por exemplo, o vim tem USE 'X' (suporte a interface gráfica), 'python' (scripting em Python), 'lua', 'perl', etc. Você decide o que entra antes da compilação.

O efeito prático: você não carrega megabytes de código que nunca vai usar. Compila vim sem 'X' e sem 'gtk' num servidor — vira um binário pequeno, sem dependências GUI desnecessárias. Já no desktop, ativa 'X gtk python' e tem o vim completo. O mesmo pacote, dois binários radicalmente diferentes.

USE flags se configuram em três níveis: globais em /etc/portage/make.conf, por pacote em /etc/portage/package.use, e padrão pelo profile escolhido. Quando você muda uma USE flag, o emerge --newuse (-N) recompila o que foi afetado. Este capítulo te dá a base; o capítulo de configuração avançada aprofunda.`,
    codes: [
      { lang: "conf", code: `# /etc/portage/make.conf — USE globais
# As que entram em quase todo pacote:
USE="X wayland alsa pulseaudio dbus pipewire icu nls -gnome -kde -systemd"

# Negativo (-) desativa, positivo ativa.
# A ordem importa: o último valor vence em caso de conflito.` },
      { lang: "bash", code: `# Ver USE flags de um pacote (instalado ou não):
equery uses app-editors/vim

# Saída típica:
# [ Legend : U - final flag setting for installation]
# [        : I - package is installed with flag    ]
# [ Colors : set, unset                            ]
#  U I
#  + + acl    : Add Access Control List support
#  + + nls    : National Language Support (i18n)
#  - - X      : Add support for X11
#  - - python : Build with Python scripting support` },
      { lang: "conf", code: `# /etc/portage/package.use/vim — USE por pacote
app-editors/vim       X python lua

# /etc/portage/package.use/desktop — exemplo organizado
www-client/firefox    -hardened pgo lto wayland
media-video/mpv       vaapi vulkan` },
      { lang: "bash", code: `# Após mudar USE flags, recompile o que foi afetado:
sudo emerge --ask --update --newuse --deep @world
# A flag -N (--newuse) é o que aciona rebuild por mudança de USE.

# Ver o que SERIA recompilado por uma USE nova, sem aplicar:
emerge -puDN @world | grep "U "` },
      { lang: "text", code: `# Saída típica indicando rebuild por USE:
[ebuild   R    ] app-editors/vim-9.1.0  USE="X* python* -gtk" 0 KiB
# O '*' depois da flag indica que ela MUDOU desde a última instalação.` },
      { lang: "bash", code: `# Buscar todos os pacotes que oferecem certa USE flag:
equery hasuse vulkan

# Quais USE_EXPAND existem (CPU_FLAGS_X86, VIDEO_CARDS, etc.)?
emerge --info | grep "_TARGETS\\|_FLAGS"` },
    ],
    points: [
      "USE flag é um interruptor de funcionalidades de compilação.",
      "Globais ficam em make.conf (USE=...); por pacote em /etc/portage/package.use.",
      "+ ativa, - desativa, * em cor mostra que mudou desde a última instalação.",
      "--newuse (-N) é o que faz o Portage notar mudança de USE no @world.",
      "equery uses <pkg> mostra todas as USE possíveis com descrição.",
      "Profile define defaults; você sempre pode sobrescrever em make.conf ou package.use.",
      "Armadilha comum: ativar USE 'systemd' num sistema OpenRC e quebrar o build.",
      "Iniciante comum: mudar USE no make.conf e esquecer do --newuse — fica inconsistente.",
    ],
    alerts: [
      { type: "tip", content: "Use diretórios em /etc/portage/package.use/ (um arquivo por tema). Mais fácil organizar, fazer diff e versionar com git." },
      { type: "info", content: "Existem USE_EXPAND especiais: VIDEO_CARDS, INPUT_DEVICES, L10N, CPU_FLAGS_X86. Eles são USE flags 'agrupadas' por contexto." },
      { type: "warning", content: "Ativar muitas USE de uma vez pode trazer dependências enormes. Faça emerge -pvuDN antes para ver o impacto." },
      { type: "success", content: "Depois de configurar bem suas USE, o emerge faz exatamente o sistema que você idealizou. É o que faz Gentoo viciante." },
    ],
  },
  {
    slug: "ebuilds",
    section: "portage-basico",
    title: "Ebuilds: a receita por trás de cada pacote",
    difficulty: "intermediario",
    subtitle: "Anatomia de um arquivo .ebuild e como o Portage transforma código-fonte em binário instalado.",
    intro: `Tudo no Portage gira em torno de um tipo de arquivo: o ebuild. É um script bash com extensão .ebuild que descreve um pacote — onde baixar o fonte, quais dependências precisa, quais USE flags suporta, como compilar e como instalar. Um ebuild fica em /var/db/repos/gentoo/<categoria>/<pacote>/<pacote>-<versão>.ebuild.

A árvore /var/db/repos/gentoo é literalmente o conjunto de receitas (cerca de 19 mil pacotes). Quando você roda 'emerge vim', o Portage acha o ebuild correspondente, lê a 'EAPI' (versão da API), resolve dependências, baixa as fontes para /var/cache/distfiles, executa as fases src_unpack/src_compile/src_install em /var/tmp/portage e finalmente registra a instalação em /var/db/pkg.

Conhecer a anatomia de um ebuild te dá superpoderes: ler o que um pacote faz antes de instalar, criar overlays próprios para empacotar software seu, e contribuir para o Gentoo. Este capítulo te leva por dentro.`,
    codes: [
      { lang: "bash", code: `# Localizar o ebuild de um pacote instalado/disponível:
equery which app-editors/vim
# /var/db/repos/gentoo/app-editors/vim/vim-9.1.0.ebuild

# Listar versões disponíveis:
ls /var/db/repos/gentoo/app-editors/vim/` },
      { lang: "bash", code: `# Anatomia simplificada de um ebuild:
cat /var/db/repos/gentoo/app-editors/vim/vim-9.1.0.ebuild` },
      { lang: "text", code: `# Exemplo de campos típicos num ebuild:
EAPI=8

inherit vim-doc

DESCRIPTION="Vim, an improved vi-style text editor"
HOMEPAGE="https://www.vim.org/"
SRC_URI="https://github.com/vim/vim/archive/v\${PV}.tar.gz -> \${P}.tar.gz"

LICENSE="vim"
SLOT="0"
KEYWORDS="amd64 ~arm64 x86"
IUSE="X acl crypt cscope debug gpm lua minimal nls perl python racket ruby selinux sound tcl"

DEPEND="
    sys-libs/ncurses:0=
    acl? ( sys-apps/acl )
    X? ( x11-libs/libXt )
"
RDEPEND="\${DEPEND}"

src_compile() {
    emake
}` },
      { lang: "bash", code: `# Rodar fases do ebuild manualmente (debug avançado):
ebuild /var/db/repos/gentoo/app-editors/vim/vim-9.1.0.ebuild manifest
ebuild /var/db/repos/gentoo/app-editors/vim/vim-9.1.0.ebuild fetch
ebuild /var/db/repos/gentoo/app-editors/vim/vim-9.1.0.ebuild unpack
ebuild /var/db/repos/gentoo/app-editors/vim/vim-9.1.0.ebuild compile
ebuild /var/db/repos/gentoo/app-editors/vim/vim-9.1.0.ebuild install
ebuild /var/db/repos/gentoo/app-editors/vim/vim-9.1.0.ebuild qmerge` },
      { lang: "bash", code: `# Eclasses (includes reutilizados) ficam em /var/db/repos/gentoo/eclass/
ls /var/db/repos/gentoo/eclass/ | head
# autotools.eclass cmake.eclass python-r1.eclass kernel-2.eclass ...

# Ver o que um eclass faz:
less /var/db/repos/gentoo/eclass/cmake.eclass` },
      { lang: "bash", code: `# Validar um ebuild que você criou (overlay próprio):
sudo emerge --ask app-portage/pkgdev
cd /var/db/repos/local/app-misc/meu-pacote
pkgdev manifest      # gera o Manifest com hashes
pkgcheck scan        # validação de qualidade` },
    ],
    points: [
      "Ebuild = receita em bash que diz como baixar, compilar e instalar um pacote.",
      "Ficam em /var/db/repos/gentoo/<categoria>/<pacote>/.",
      "EAPI declara a versão da API (atual: 8). Diferentes EAPIs têm sintaxes diferentes.",
      "Eclasses são includes (.eclass) reutilizáveis: autotools, cmake, python-r1, etc.",
      "DEPEND = build-time deps; RDEPEND = runtime deps; BDEPEND = build-time tools.",
      "/var/cache/distfiles guarda os tarballs baixados; /var/tmp/portage é o sandbox de build.",
      "Armadilha comum: editar ebuild da árvore oficial (será sobrescrito no próximo sync). Use overlay.",
      "Iniciante comum: rodar 'ebuild ... compile' e esquecer de 'manifest' antes — falha sem explicação.",
    ],
    alerts: [
      { type: "info", content: "Para criar seu próprio overlay, instale app-eselect/eselect-repository e use 'eselect repository create local'. Veremos com calma no capítulo de configuração avançada." },
      { type: "tip", content: "Antes de instalar um pacote desconhecido, leia o ebuild dele. Em 1-2 minutos você sabe exatamente o que ele vai fazer no seu sistema." },
      { type: "warning", content: "Nunca edite arquivos diretamente em /var/db/repos/gentoo/. Tudo lá é sobrescrito por 'emerge --sync'. Use overlay próprio." },
      { type: "success", content: "Escrever um ebuild simples é mais fácil do que parece. É bash com convenções. Muitos contribuem para o Gentoo começando assim." },
    ],
  },
];
