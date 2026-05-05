// Aggregator — content lives in sections/<sectionId>.ts (one file per trail)
import type { Chapter, Section } from './types';
import { chapters as s0 } from './sections/boas-vindas';
import { chapters as s1 } from './sections/preparacao';
import { chapters as s2 } from './sections/instalacao';
import { chapters as s3 } from './sections/portage-basico';
import { chapters as s4 } from './sections/kernel';
import { chapters as s5 } from './sections/sistema-base';
import { chapters as s6 } from './sections/bootloader';
import { chapters as s7 } from './sections/configuracao-avancada';
import { chapters as s8 } from './sections/rede';
import { chapters as s9 } from './sections/desktop';
import { chapters as s10 } from './sections/multimidia-gpu';
import { chapters as s11 } from './sections/otimizacao';
import { chapters as s12 } from './sections/armazenamento-avancado';
import { chapters as s13 } from './sections/projetos-apendice';

export type { Chapter, Section, Difficulty, AlertType, CodeSample, AlertSpec } from './types';

export const sections: Section[] = [
  {
    id: "boas-vindas",
    icon: "BookOpen",
    label: "Boas-vindas e Filosofia",
    chapterSlugs: [
      "bem-vindo",
      "por-que-gentoo",
      "historia-gentoo",
      "filosofia-gentoo",
      "onde-gentoo-roda"
    ]
  },
  {
    id: "preparacao",
    icon: "HardDrive",
    label: "Preparação para a Instalação",
    chapterSlugs: [
      "pre-requisitos",
      "escolher-arquitetura",
      "baixar-iso",
      "criar-midia-bootavel",
      "boot-live",
      "conectar-internet",
      "particionamento-conceitos",
      "sistemas-arquivo",
      "plano-particionamento"
    ]
  },
  {
    id: "instalacao",
    icon: "Terminal",
    label: "Instalação Passo a Passo",
    chapterSlugs: [
      "particoes-pratica",
      "formatacao",
      "montagem",
      "baixar-stage3",
      "descompactar-stage3",
      "configurar-make-conf",
      "chroot",
      "mirrorlist-portage",
      "sync-portage",
      "escolher-profile",
      "timezone-locale"
    ]
  },
  {
    id: "portage-basico",
    icon: "Package",
    label: "Portage: O Coração do Gentoo",
    chapterSlugs: [
      "emerge-intro",
      "world-set",
      "news",
      "depclean",
      "search-info",
      "eix-equery",
      "mascaramento",
      "slots",
      "useflags-intro",
      "ebuilds"
    ]
  },
  {
    id: "kernel",
    icon: "Cpu",
    label: "Compilando o Kernel",
    chapterSlugs: [
      "kernel-conceitos",
      "fontes-kernel",
      "genkernel",
      "manual-config",
      "modules-blacklist",
      "initramfs",
      "firmware",
      "kernel-boot",
      "recompilar-kernel",
      "kernel-troubleshooting"
    ]
  },
  {
    id: "sistema-base",
    icon: "Settings",
    label: "Configuração do Sistema Base",
    chapterSlugs: [
      "fstab",
      "hostname-network",
      "openrc-intro",
      "systemd-vs-openrc",
      "services-rc-update",
      "dispatch-conf",
      "etc-update",
      "users-groups",
      "sudo-doas",
      "root-recovery"
    ]
  },
  {
    id: "bootloader",
    icon: "Power",
    label: "Bootloader e Inicialização",
    chapterSlugs: [
      "grub2-bios",
      "grub2-uefi",
      "efi-stub",
      "refind",
      "syslinux",
      "multiboot",
      "secure-boot",
      "encryption-boot",
      "lvm-boot",
      "btrfs-subvol-boot"
    ]
  },
  {
    id: "configuracao-avancada",
    icon: "Wrench",
    label: "Portage Avançado e USE Flags",
    chapterSlugs: [
      "use-flags-pratica",
      "package-use",
      "package-accept-keywords",
      "package-mask",
      "package-license",
      "eselect",
      "layman-overlays",
      "eclasses",
      "ebuild-customizado",
      "virtuais",
      "slots-praticos",
      "profiles-customizar",
      "world-file-pratica",
      "conflitos-resolucao"
    ]
  },
  {
    id: "rede",
    icon: "Wifi",
    label: "Rede e Conectividade",
    chapterSlugs: [
      "netifrc-basico",
      "dhcpcd",
      "networkmanager",
      "wpa-supplicant",
      "iwd",
      "openrc-firewall",
      "nftables",
      "ssh",
      "openvpn",
      "wireguard",
      "dnsmasq",
      "bridge-vlans"
    ]
  },
  {
    id: "desktop",
    icon: "Monitor",
    label: "Ambiente Gráfico (Xorg, Wayland, DEs)",
    chapterSlugs: [
      "xorg-instalacao",
      "drivers-video",
      "intel-graphics",
      "amd-graphics",
      "nvidia-drivers",
      "wayland-intro",
      "sway",
      "plasma",
      "gnome",
      "xfce",
      "lxqt",
      "fontes",
      "temas",
      "login-managers"
    ]
  },
  {
    id: "multimidia-gpu",
    icon: "Volume2",
    label: "Multimídia, Áudio, GPU e Jogos",
    chapterSlugs: [
      "pulseaudio",
      "pipewire",
      "alsa",
      "bluetooth-audio",
      "codecs-video",
      "vaapi-vdpau",
      "vulkan",
      "opengl",
      "jogos-steam",
      "lutris",
      "wine",
      "gpu-passthrough-vfio",
      "opencl",
      "ffmpeg"
    ]
  },
  {
    id: "otimizacao",
    icon: "Zap",
    label: "Otimização e Performance",
    chapterSlugs: [
      "cflags-cxxflags",
      "march-native",
      "lto",
      "pgo",
      "ccache",
      "distcc",
      "binhost",
      "binpkgs",
      "gcc-versions",
      "profile-guided",
      "kernel-tuning",
      "ssd-trim",
      "swap-zram",
      "monitoring"
    ]
  },
  {
    id: "armazenamento-avancado",
    icon: "Database",
    label: "Armazenamento Avançado",
    chapterSlugs: [
      "lvm",
      "luks",
      "btrfs",
      "zfs",
      "raid-mdadm",
      "snapshots",
      "backup-borg",
      "restic",
      "automount",
      "swapfile",
      "tmpfs",
      "fstab-avancado"
    ]
  },
  {
    id: "projetos-apendice",
    icon: "BookOpen",
    label: "Projetos Práticos e Apêndice",
    chapterSlugs: [
      "servidor-web",
      "desktop-completo",
      "embedded-rpi",
      "container-host",
      "nas-caseiro",
      "gentoo-prefix",
      "crossdev",
      "embedded-image",
      "glossario",
      "faq",
      "troubleshooting-comum",
      "recursos",
      "comunidade",
      "bug-reports",
      "proximos-passos"
    ]
  }
];

export const chapters: Chapter[] = [...s0, ...s1, ...s2, ...s3, ...s4, ...s5, ...s6, ...s7, ...s8, ...s9, ...s10, ...s11, ...s12, ...s13];

export const chapterMap: Record<string, Chapter> = Object.fromEntries(
  chapters.map(c => [c.slug, c])
);

export function chapterIndex(slug: string): number {
  return chapters.findIndex(c => c.slug === slug);
}
