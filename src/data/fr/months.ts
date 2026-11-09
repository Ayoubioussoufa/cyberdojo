/**
 * French for the roadmap months (src/data/months.json). Every month has a French
 * title; the months translated so far also have their whole page. A field
 * missing here shows in English.
 */
import { MONTHS, PHASES, type Month } from "@/lib/data";
import type { Lang } from "@/i18n/lang";

const TITLES = [
  "Bases de la sécurité, Linux I et votre lab",
  "Réseaux I : comment les données circulent vraiment",
  "Réseaux II, défense réseau, Linux II et Bash",
  "Python pour la sécurité et l'automatisation",
  "Fonctionnement interne de Windows et PowerShell",
  "Bases du web, des bases de données et de la cryptographie",
  "Identité, IAM et Active Directory",
  "Sécurité des applications web",
  "Opérations SOC : journaux, SIEM et tri des alertes",
  "Tests d'intrusion et gestion des vulnérabilités",
  "Ingénierie de détection et réponse à incident",
  "Risque, gouvernance et conformité, plus bilan de mi-parcours",
  "Sécurité du cloud I : bases d'AWS, IAM et mauvaises configurations",
  "Sécurité du cloud II : détection, Entra ID et posture",
  "Investigation numérique et renseignement sur les menaces",
  "Bases de l'analyse de malwares",
  "Sécurité applicative, code sécurisé et DevSecOps",
  "Sécurité de l'IA : applications LLM, agents et red teaming, et choix de filière",
  "Kubernetes, architecture de sécurité et sprint de filière 1",
  "Sprint de filière 2 et conception du projet final",
  "Construction du projet final et préparation à la certification",
  "Livraison du projet final, examen et candidatures",
  "Saison des entretiens, recherche et communauté",
  "Évaluation finale, finition du portfolio et les 12 mois suivants",
];

const PAGES: Record<number, Partial<Month>> = {
  1: {
    hours: "12 h/semaine, ≈ 50 h",
    goal: "Monter le lab et le système d'apprentissage, devenir à l'aise dans le terminal Linux, et dessiner la carte mentale du domaine sur laquelle chaque mois suivant viendra se brancher.",
    topics: [
      "Modèle mental de la sécurité : triade CIA (confidentialité, intégrité, disponibilité) ; authentification, autorisation et traçabilité ; moindre privilège ; défense en profondeur ; menace, vulnérabilité, risque ; surface d'attaque.",
      "La carte du domaine : les fonctions du NIST CSF 2.0 (Govern, Identify, Protect, Detect, Respond, Recover) et le cycle de vie de l'attaquant vu par les tactiques MITRE ATT&CK.",
      "Linux : arborescence des fichiers, utilisateurs et groupes, permissions (rwx, SUID/SGID, sticky bit, umask), processus et signaux, paquets, tubes et redirections, grep/sed/awk/cut/sort/uniq, clés SSH.",
      "Virtualisation : hyperviseurs, instantanés, réseaux NAT, host-only et internes.",
    ],
    skills: [
      "Naviguer, chercher et modifier des fichiers uniquement en ligne de commande ; lire les pages man au lieu de deviner.",
      "Créer des utilisateurs et des groupes, réparer des problèmes de permissions, trouver les binaires SUID.",
      "Construire des pipelines, par exemple les 10 adresses IP sources qui échouent le plus souvent à se connecter en SSH dans auth.log.",
      "Créer des VM, prendre et restaurer des instantanés ; utiliser Git (clone, commit, branch, push).",
    ],
    weeks: [
      "S1 Installer VirtualBox ou VMware Workstation Pro ; créer des VM Ubuntu Server et Kali ; mettre en place le coffre Obsidian et le dépôt cyber-journey ; rédiger le contrat d'apprentissage.",
      "S2 pwn.college Linux Luminarium (premiers modules) et OverTheWire Bandit 0 à 10.",
      "S3 Permissions, processus, services ; Bandit 11 à 20 ; branches Git et une pull request sur votre propre dépôt.",
      "S4 Vue d'ensemble du NIST CSF 2.0 et des tactiques ATT&CK ; Bandit 21 et plus ; premier compte rendu public ; première rétrospective mensuelle.",
    ],
    labs: [
      { text: "OverTheWire Bandit jusqu'au niveau 20 ou plus (au moins 20 minutes d'effort avant tout indice).", url: "https://overthewire.org/wargames/bandit/" },
      { text: "pwn.college Linux Luminarium ; TryHackMe Pre Security (salles Linux).", url: "https://pwn.college/" },
      { text: "Lab maison v0 : deux VM sur un réseau isolé, discipline des instantanés documentée.", url: null },
    ],
    tools: "VirtualBox ou VMware Workstation Pro, Ubuntu Server 26.04 LTS, Kali Linux, bash, man, grep/find/awk, ssh, Git et GitHub, Obsidian.",
    free: [
      { text: "OverTheWire Bandit : tous les niveaux, une leçon écrite par niveau.", url: "https://overthewire.org/wargames/bandit/" },
      { text: "pwn.college : le dojo Linux Luminarium.", url: "https://pwn.college/" },
      { text: "The Linux Command Line (livre gratuit, en anglais) : parties 1 et 2 comme référence.", url: "https://linuxcommand.org/tlcl.php" },
      { text: "CS50 Cybersecurity : cours 0 et 1 pour l'état d'esprit sécurité (en anglais).", url: "https://cs50.harvard.edu/cybersecurity/" },
      { text: "NIST CSF 2.0 : vue d'ensemble et guide de démarrage rapide.", url: "https://www.nist.gov/cyberframework" },
    ],
    paid: [
      { text: "How Linux Works, 3e éd. (Brian Ward, No Starch) : le meilleur livre sur le « pourquoi » de Linux.", url: null },
      { text: "TryHackMe Premium : facultatif pour l'instant, vivement conseillé à partir du mois 9.", url: null },
    ],
    ai: "Fixez les règles dès maintenant : essayez 20 minutes avant de demander à une IA ; ne gardez jamais une réponse que vous ne savez pas expliquer ; tenez un journal de vérification de l'IA (affirmation → vérifiée dans la page man ou la doc → juste, fausse ou à moitié juste). Servez-vous d'un LLM comme interrogateur sur les permissions et les processus, jamais pour résoudre Bandit à votre place.",
    portfolio: "Commencer P01 (lab segmenté et serveur Linux durci). Publier le compte rendu n° 1 : « Ce que Bandit m'a appris sur Linux » (sans dévoiler les niveaux).",
    gate: [
      "Bandit au niveau 20 ou plus, avec au moins 70 % des niveaux résolus sans solution.",
      "Explique rwx, SUID/SGID et le sticky bit ; trouve tous les binaires SUID en une seule commande find.",
      "Une ligne de commande qui extrait d'auth.log les adresses IP sources des échecs de connexion les plus fréquentes.",
      "Lab de deux VM avec instantanés, documenté dans un README ; au moins 8 commits qui ont du sens.",
    ],
    jobs: "Linux fait partie du quotidien des analystes SOC (serveurs de journaux, nœuds SIEM), des pentesteurs (Kali) et des ingénieurs cloud et DevSecOps (conteneurs). Les questions sur les permissions et les processus reviennent dans presque tous les entretiens techniques de débutant.",
  },
  2: {
    hours: "12 à 14 h/semaine, ≈ 55 h",
    goal: "Comprendre le chemin d'un paquet assez bien pour lire n'importe quelle capture, calculer des sous-réseaux de tête et expliquer chaque étape de « ce qui se passe quand j'ouvre un site web ».",
    topics: [
      "Modèles OSI et TCP/IP ; Ethernet, adresses MAC, ARP ; bases de la commutation et des VLAN (introduction).",
      "Adressage IPv4, découpage CIDR, plages privées, NAT ; l'essentiel d'IPv6 ; ICMP ; bases du routage.",
      "TCP (poignée de main, drapeaux, états, retransmission) face à UDP ; ports et sockets.",
      "DNS (enregistrements, récursion, cache, résolveurs), DHCP, bases d'HTTP ; comment ces protocoles sont détournés (usurpation, tunnels, amplification).",
    ],
    skills: [
      "Découper n'importe quel réseau de /8 à /30 en moins de 60 secondes.",
      "Capturer et lire du trafic dans Wireshark : filtres d'affichage, suivi de flux, export d'objets, statistiques.",
      "Utiliser dig, ip, ss, traceroute/mtr et tcpdump avec assurance.",
      "Expliquer une requête web complète, preuves à l'appui dans les paquets (DNS → TCP → TLS → HTTP).",
    ],
    weeks: [
      "S1 Modèles, Ethernet et ARP, IPv4, et 10 minutes d'exercices de sous-réseaux par jour.",
      "S2 TCP et UDP, ports, la poignée de main ; capturer votre propre trafic dans Wireshark.",
      "S3 DNS, DHCP, HTTP ; tcpdump ; construire un réseau à deux sous-réseaux dans Cisco Packet Tracer.",
      "S4 Enquêter sur deux exercices PCAP pour débutants et les rédiger (P02, dossier n° 1).",
    ],
    labs: [
      { text: "TryHackMe Pre Security → Network Fundamentals ; salles Wireshark.", url: null },
      { text: "Cisco Packet Tracer : 2 sous-réseaux, un routeur, DHCP et DNS.", url: null },
      { text: "Exercices pour débutants de malware-traffic-analysis.net (répondez par écrit à chaque question).", url: "https://www.malware-traffic-analysis.net/" },
    ],
    tools: "Wireshark, tcpdump, dig/nslookup, ip, ss, traceroute/mtr, Cisco Packet Tracer (gratuit via Cisco NetAcad).",
    free: [
      { text: "Practical Networking (Ed Harmoush) : les explications les plus claires sur les paquets, ARP et les sous-réseaux (en anglais).", url: "https://www.practicalnetworking.net/" },
      { text: "Jeremy's IT Lab, cours CCNA gratuit : une sélection de jours (bases, sous-réseaux, VLAN), en anglais.", url: "https://www.youtube.com/@JeremysITLab" },
      { text: "Professor Messer Network+ : révision rapide des concepts (en anglais).", url: "https://www.professormesser.com/" },
      { text: "Documentation de Wireshark : les chapitres du guide utilisateur sur les filtres.", url: "https://www.wireshark.org/docs/" },
      { text: "Cloudflare Learning Center : explications sur DNS, les DDoS et TLS (existe en français).", url: "https://www.cloudflare.com/learning/" },
    ],
    paid: [
      { text: "Practical Packet Analysis, 3e éd. (Chris Sanders, No Starch).", url: null },
      { text: "Computer Networking: A Top-Down Approach (Kurose et Ross), traduit en français sous le titre « Analyse structurée des réseaux » : regardez d'abord à la bibliothèque universitaire.", url: null },
    ],
    ai: "Demandez à un LLM 20 exercices de sous-réseaux avec leurs réponses, résolvez-les vous-même, puis vérifiez les réponses de l'IA, en notant chaque erreur qu'elle fait. Demandez-lui d'expliquer une suite de drapeaux TCP, puis confirmez ou réfutez l'explication dans votre propre capture Wireshark.",
    portfolio: "Commencer P02 (recueil d'enquêtes sur le trafic réseau), dossier n° 1.",
    gate: [
      "20 questions de sous-réseaux d'affilée, chacune en moins de 60 secondes.",
      "Une capture annotée montrant DNS → poignée de main TCP → TLS → HTTP pour un site.",
      "Deux exercices PCAP résolus avec des preuves écrites ; dossier n° 1 publié.",
      "Sait expliquer l'usurpation ARP et les tunnels DNS, et comment chacun apparaît dans le trafic.",
    ],
    jobs: "Les analystes SOC vivent dans les données réseau (journaux de pare-feu, de proxy, de DNS) ; les pentesteurs énumèrent des services ; la sécurité du cloud, c'est du réseau virtuel. « Expliquez la poignée de main TCP » ou « la résolution DNS » est une question d'entretien universelle.",
  },
};

const FR_MONTHS: Month[] = MONTHS.map((m) => ({ ...m, title: TITLES[m.n - 1] ?? m.title, ...(PAGES[m.n] ?? {}) }));

/** The roadmap months in the page's language. */
export const monthsFor = (lang: Lang): Month[] => (lang === "fr" ? FR_MONTHS : MONTHS);
/** True when a month's whole page is in French. */
export const monthTranslated = (n: number) => n in PAGES;

const FR_PHASES = [
  { n: 0, title: "Jour zéro", months: "Avant le mois 1", question: "Qu'est-ce que la sécurité, et qu'y a-t-il dans un ordinateur ?" },
  { n: 1, title: "Fondations", months: "Mois 1 à 6", question: "Comment fonctionnent vraiment les ordinateurs, les réseaux, les systèmes d'exploitation, le web et la cryptographie ?" },
  { n: 2, title: "Cœur de la sécurité", months: "Mois 7 à 12", question: "Comment de vrais environnements sont-ils attaqués, surveillés, défendus et gouvernés ?" },
  { n: 3, title: "Cœur avancé, en version allégée", months: "Mois 13 à 18", question: "Qu'exigent le cloud, l'investigation, le renseignement, les malwares, l'AppSec et la sécurité de l'IA ?" },
  { n: 4, title: "Se spécialiser et se lancer", months: "Mois 19 à 24", question: "Comment devenir le candidat évident pour un poste ?" },
];

export const phasesFor = (lang: Lang) => (lang === "fr" ? FR_PHASES : PHASES);
