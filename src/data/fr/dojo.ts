/** French for the Dojo modules (src/data/dojo.ts). The challenges themselves are still in English. */
import { DOJO, type DojoModule } from "@/data/dojo";

const CREDIT_FR: Record<string, string> = {
  "Linux Luminarium": "Les idées suivent le Linux Luminarium de pwn.college (BSD-2-Clause). Exercices écrits pour CyberDojo.",
  "Playing With Programs": "Couvre des sujets aussi enseignés dans Playing With Programs de pwn.college. Exercices écrits pour CyberDojo.",
  "Intro to Cybersecurity": "Couvre des sujets aussi enseignés dans Intro to Cybersecurity de pwn.college. Exercices écrits pour CyberDojo.",
};

/** French for each module's title, skill, intro and lesson link. The challenges themselves are still in English. */
const DOJO_FR: Record<string, Pick<DojoModule, "title" | "skill" | "intro"> & { lessonTitle?: string }> = {
  streams: {
    title: "Tubes et flux",
    skill: "faire passer des données d'un programme à l'autre sans toucher à la souris",
    intro: [
      "Chaque programme démarre avec trois canaux ouverts : l'entrée standard (0), la sortie standard (1) et l'erreur standard (2). Par défaut, les trois mènent à votre terminal. Ce n'est pas le programme qui choisit où ils vont : le shell le décide avant de le lancer, et le programme se contente de lire et d'écrire.",
      "C'est grâce à ce seul principe que les petits outils se combinent si bien. `>` envoie la sortie dans un fichier, `<` fait entrer un fichier, `2>` attrape les erreurs, et `|` branche la sortie d'un programme sur l'entrée du suivant.",
    ],
    lessonTitle: "Tubes et redirections",
  },
  permissions: {
    title: "Permissions",
    skill: "lire une chaîne de permissions et accorder le minimum qui fonctionne",
    intro: [
      "À chaque accès à un fichier, le noyau se pose une seule question : cet utilisateur est-il le propriétaire, dans le groupe, ou ni l'un ni l'autre ? Il choisit cette seule classe et vérifie ses trois bits : lecture, écriture, exécution. `-rw-r-----` signifie que le propriétaire peut lire et écrire, que le groupe peut lire, et que les autres n'ont rien.",
      "Vous utiliserez `chown`, `chgrp` et `chmod`, chacun au travers d'une règle `sudo` étroite. Remarquez tout le pouvoir que chacune donne réellement.",
    ],
    lessonTitle: "Utilisateurs et permissions",
  },
  data: {
    title: "Octets et encodages",
    skill: "reconnaître et inverser l'hexadécimal et le base64 au premier coup d'œil",
    intro: [
      "Un ordinateur ne stocke que des octets : des nombres de 0 à 255. Le texte est une convention sur ce que signifient ces nombres, et `A` vaut 65 en ASCII. L'hexadécimal écrit chaque octet avec deux chiffres de 0 à f, donc 65 devient `41`. Le base64 écrit n'importe quels octets avec seulement 64 caractères imprimables, pour qu'ils survivent aux systèmes faits pour du texte.",
      "Rien de tout cela n'est du chiffrement. Un encodage n'a pas de clé, donc n'importe qui peut l'inverser, et faire la différence est une compétence quotidienne en analyse de journaux et de malwares.",
    ],
    lessonTitle: "Bits et adresses IP",
  },
  sql: {
    title: "Interroger une base de données",
    skill: "répondre à des questions à partir d'une base de données avec SELECT",
    intro: [
      "Une base de données relationnelle range les données dans des tables : les colonnes nomment les champs et chaque ligne est un enregistrement. Vous l'interrogez en SQL, et vous décrivez le résultat voulu, pas les étapes pour l'obtenir. `SELECT value FROM secrets WHERE tag = 'flag'` se lit : dans cette table, garde ces lignes, affiche cette colonne.",
      "Apprenez-le bien : les SIEM et les plateformes de journaux reposent sur la même façon de penser, et on ne peut pas comprendre l'injection SQL sans savoir lire la requête visée.",
    ],
    lessonTitle: "Bases de données et SQL",
  },
  web: {
    title: "Parler au web",
    skill: "parler HTTP à la main et voir ce qu'un navigateur cache",
    intro: [
      "HTTP, c'est du texte brut. Un client envoie une requête : une méthode, un chemin et des en-têtes, parfois avec un corps. Le serveur renvoie un code d'état, des en-têtes et un corps. Un navigateur fait tout cela pour vous puis en cache l'essentiel, et `curl` vous montre tout.",
      "Ces serveurs sont simulés dans votre navigateur, sur des hôtes inventés. Rien ne quitte cette page, et `curl` n'atteint ici que les sites que chaque défi met en place.",
    ],
    lessonTitle: "Comment fonctionne le web",
  },
  crypto: {
    title: "Le XOR et ses pièges",
    skill: "expliquer pourquoi la réutilisation de clé et l'absence d'intégrité cassent le chiffrement",
    intro: [
      "Le XOR compare deux bits et donne 1 quand ils diffèrent. Sa propriété clé est qu'il s'annule lui-même : `A ^ K ^ K = A`. On chiffre en faisant un XOR avec une clé, et on déchiffre en refaisant exactement la même chose.",
      "Utilisé parfaitement, il est incassable. Les échecs viennent de la façon dont on l'utilise, et chaque défi ici montre une des erreurs autour desquelles les chiffrements modernes ont été conçus.",
    ],
    lessonTitle: "Hachage et cryptographie symétrique",
  },
  access: {
    title: "Contrôle d'accès",
    skill: "distinguer le contrôle d'accès discrétionnaire du contrôle obligatoire, et auditer les deux",
    intro: [
      "Avec le contrôle d'accès discrétionnaire, le propriétaire d'un fichier décide qui peut l'utiliser : c'est ainsi que fonctionnent les permissions Linux. Avec le contrôle d'accès obligatoire, c'est la politique du système qui décide, et personne ne peut passer outre, pas même le propriétaire.",
      "Le modèle obligatoire classique est Bell-LaPadula, conçu pour les secrets militaires : on ne peut pas lire au-dessus de son niveau, ni écrire en dessous. Vous appliquerez ces règles à des données avec `awk`, comme le ferait un auditeur.",
    ],
    lessonTitle: "Identité et accès",
  },
  audit: {
    title: "Audit des privilèges",
    skill: "trouver les privilèges en trop sur un hôte Linux et les retirer",
    intro: [
      "Un programme marqué SUID s'exécute en tant que son propriétaire, pas en tant que la personne qui l'a lancé. C'est ce qui permet à `passwd` de modifier un fichier que seul root peut toucher. Cela signifie aussi qu'une faille dans n'importe quel programme SUID appartenant à root peut donner root à n'importe qui.",
      "Sur pwn.college, vous pouvez vous entraîner à détourner de tels programmes. Ici, vous prenez l'autre place : lister ces programmes, les comparer à une référence, retirer ce qui n'est pas nécessaire, et vérifier ce à quoi root fait confiance.",
    ],
    lessonTitle: "Auditer l'élévation de privilèges",
  },
};

/** The modules in the page's language. */
export function dojoModules(lang: "en" | "fr"): DojoModule[] {
  if (lang === "en") return DOJO;
  return DOJO.map((m) => {
    const fr = DOJO_FR[m.id];
    if (!fr) return m;
    return {
      ...m,
      title: fr.title,
      skill: fr.skill,
      intro: fr.intro,
      lesson: m.lesson && { ...m.lesson, title: fr.lessonTitle ?? m.lesson.title },
      credit: { ...m.credit, note: CREDIT_FR[m.credit.label] ?? m.credit.note },
    };
  });
}
