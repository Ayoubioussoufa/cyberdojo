/**
 * French for the Workshop labs (src/data/workshop.ts): the text around the
 * steps. The build/attack/defend steps stay in English on the French site, with
 * a "not translated" notice, the same as the break-in terminals: the commands
 * and code are the same in any language.
 */
export interface WorkshopFr {
  title: string;
  tagline: string;
  tag: string;
  intro: string[];
  isolate: string;
  observe: string;
  detect: string;
  learn: string[];
}

export const WORKSHOP_FR: Record<string, WorkshopFr> = {
  flood: {
    title: "Inondez votre propre serveur",
    tagline: "voyez un seul client lent faire tomber un serveur, puis apprenez-lui à encaisser l'attaque",
    tag: "Résilience",
    intro: [
      "Une attaque par déni de service ne vole rien : elle rend un serveur trop occupé pour répondre aux autres. La version la plus simple n'est même pas un flot de trafic. Un serveur qui traite une requête à la fois peut être figé par un seul client qui ouvre une requête puis la distille à l'infini : le serveur attend, attend, et n'atteint jamais la personne suivante. C'est un slowloris, et il ne demande presque aucune bande passante.",
      "Vous allez construire un petit serveur web qui traite une requête à la fois, le figer depuis un second terminal avec une poignée de connexions lentes, puis le placer derrière un vrai serveur doté de délais et de limites de débit, et voir la même attaque rebondir. C'est un test de résilience de votre propre serveur, sur votre propre machine. L'important, c'est la défense.",
    ],
    isolate: "Tout écoute sur 127.0.0.1, l'adresse de bouclage à laquelle votre machine répond, donc rien ne quitte l'ordinateur. Travaillez dans un dossier neuf et un environnement virtuel Python. Ne dirigez jamais un outil de charge ou d'inondation vers un serveur qui ne vous appartient pas : le faire sur le système d'autrui est un délit, et le script d'attaque du lab ne parle qu'à 127.0.0.1.",
    observe: "Le `curl` normal se bloque puis expire : le serveur est vivant mais n'a plus d'attention à donner. Vingt connexions inactives, presque aucun trafic, et plus personne ne peut entrer. Arrêtez l'attaque (Ctrl+C) et le serveur répond de nouveau.",
    detect: "Un défenseur voit de nombreuses connexions venant d'une seule adresse qui s'ouvrent sans jamais se terminer, et des workers saturés alors que la bande passante est quasi nulle. Les métriques de connexions et de débit de requêtes montent, le débit utile non. Les limiteurs de débit, un WAF, fail2ban et les délais d'un proxy inverse repèrent la forme du client lent ; à grande échelle, un CDN anti-DDoS absorbe le volume avant l'origine.",
    learn: ["Comment les applications web échouent", "Déni de service"],
  },
  sqli: {
    title: "Forcez un login par injection SQL",
    tagline: "construisez un login qui colle votre saisie dans une requête, puis passez tout droit au travers",
    tag: "Injection",
    intro: [
      "Une application web transforme votre saisie en requête de base de données. Quand elle bâtit cette requête en collant des chaînes bout à bout, votre saisie cesse d'être une donnée et devient une partie de la commande. Une simple apostrophe termine la chaîne ouverte par l'application, et ce que vous écrivez ensuite, la base l'exécute. C'est la plus ancienne et toujours l'une des failles web les plus dommageables.",
      "Vous allez construire un login adossé à une vraie base SQLite, le contourner sans mot de passe et lire une table jamais censée s'afficher, puis réécrire une ligne pour que la saisie ne puisse plus jamais être qu'une donnée.",
    ],
    isolate: "L'application et sa base sont des fichiers dans un dossier de votre machine, liés à 127.0.0.1. Les données sont inventées. Vous attaquez votre propre code : c'est exactement à quoi ressemblent le développement sécurisé et les tests autorisés.",
    observe: "`admin'-- ` ferme la chaîne du nom et met le reste de la requête en commentaire : la base exécute `WHERE name = 'admin'` et renvoie le secret. Le login n'a jamais vérifié de mot de passe. La base a fait exactement ce que le texte disait ; elle n'avait aucun moyen de savoir quelle partie venait de vous.",
    detect: "Les journaux montrent des saisies étranges : apostrophes, `--`, `OR '1'='1`, `UNION SELECT`. Les erreurs de requêtes mal formées sont un signal fort. Un WAF repère les charges classiques, les requêtes paramétrées les rendent inertes, et la journalisation des requêtes plus des comptes à moindre privilège limitent et révèlent ce qu'une injection réussie a touché.",
    learn: ["Bases de données et SQL", "L'injection SQL en profondeur"],
  },
  cmdi: {
    title: "Transformez un champ de formulaire en shell",
    tagline: "une application qui lance une commande avec votre texte lancera aussi votre commande",
    tag: "Injection",
    intro: [
      "Certaines applications délèguent à un vrai programme : pinguer un hôte, redimensionner une image, interroger un domaine. Quand l'application bâtit cette ligne de commande en y collant votre saisie puis passe toute la chaîne à un shell, le shell lit votre saisie comme davantage de commande. Un point-virgule termine la commande de l'application et démarre la vôtre.",
      "Vous allez construire un petit outil de « ping » doté de cette faille, exécuter vos propres commandes au travers, puis retirer le shell de l'équation pour que votre saisie ne puisse plus être qu'un argument.",
    ],
    isolate: "Le serveur écoute sur 127.0.0.1 et les commandes s'exécutent sous votre propre compte, dans votre propre dossier. Vous injectez des commandes dans votre propre machine pour en voir le mécanisme. Ne visez jamais un service qui ne vous appartient pas.",
    observe: "La réponse contient la sortie du ping puis celle de `id` : votre commande s'est exécutée sur le serveur, sous le compte du serveur. De là, un attaquant lit des fichiers, ouvre un reverse shell, ou pivote. Le shell n'a pas pu distinguer le nom d'hôte de la commande, car les deux sont arrivés en une seule chaîne.",
    detect: "Les métacaractères de shell dans la saisie (`;`, `|`, `&`, `$()`, accents graves) sont l'indice. Les journaux de processus et d'audit montrent un service web qui engendre des enfants inattendus comme `id`, `sh` ou `curl`. L'exécution par liste d'arguments supprime toute la catégorie ; l'EDR et la journalisation des lignes de commande repèrent tentatives et réussites.",
    learn: ["Garder la saisie hors du code", "L'injection au-delà de SQL"],
  },
  traversal: {
    title: "Lisez des fichiers qu'on ne vous a pas donnés",
    tagline: "un lien de téléchargement qui fait confiance à un nom de fichier livrera tout le disque",
    tag: "Contrôle d'accès",
    intro: [
      "Les applications servent souvent des fichiers par leur nom : une page, un avatar, un rapport. Quand l'application bâtit le chemin en joignant un dossier au nom que vous fournissez, `../` remonte hors du dossier. Assez de `../` et vous atteignez la racine du disque, puis tout fichier lisible par le service : une configuration avec des mots de passe, des clés, la liste des comptes du système.",
      "Vous allez construire un serveur de fichiers doté de cette faille, lire un fichier hors de son dossier, puis ancrer chaque chemin à l'intérieur du dossier pour que `../` ne mène nulle part.",
    ],
    isolate: "Le serveur écoute sur 127.0.0.1 et ne peut lire que ce que votre propre compte peut lire. Vous lisez vos propres fichiers pour voir la faille. Le correctif est le même quel que soit le propriétaire de la machine.",
    observe: "Le serveur renvoie `TOP SECRET`, puis le `/etc/passwd` de votre machine. Le code demandait un fichier sous `public/`, mais `../` est sorti tout droit : joindre des chemins ne retient personne dans un dossier.",
    detect: "`../`, ses formes encodées comme `%2e%2e%2f`, et les chemins absolus dans les requêtes sont le signal, tout comme des 403 regroupés sur un point d'accès de fichiers. Les lectures de fichiers loin hors de la racine web apparaissent dans les journaux d'accès. Ancrer les chemins et associer des identifiants à des noms supprime la catégorie ; un WAF repère les motifs.",
    learn: ["Comment les applications web échouent", "Fichiers, traversée et téléversements"],
  },
  auth: {
    title: "Devinez le passage derrière un login",
    tagline: "des jetons de session faibles et aucune limite de débit font d'un login une porte qui s'ouvre seule",
    tag: "Contrôle d'accès",
    intro: [
      "Un login a deux tâches : vérifier le mot de passe, et renvoyer un jeton de session qui prouve ensuite qui vous êtes. Deux erreurs défont les deux. Si le serveur ne ralentit jamais les tentatives fausses, un mot de passe faible tombe sous un court script. Et si le jeton renvoyé est prévisible, un attaquant peut forger celui d'un autre sans même deviner un mot de passe.",
      "Vous allez construire un login doté des deux failles, le forcer par force brute et forger une session, puis ajouter une limite de débit et rendre le jeton indevinable.",
    ],
    isolate: "Le serveur écoute sur 127.0.0.1 avec un compte inventé. Vous forcez votre propre login pour sentir pourquoi ces deux défenses comptent. Le faire contre le login d'autrui est illégal.",
    observe: "Le mot de passe tombe en quelques secondes et, même sans lui, deviner une douzaine de petits nombres tombe sur une vraie session appartenant à `amy`. Aucune des deux attaques n'a rien demandé de malin : le serveur n'a pas ralenti les essais, et le jeton ne portait aucun secret.",
    detect: "Beaucoup de logins échoués pour un compte ou depuis une adresse, en peu de temps, est la signature classique de la force brute ; de même qu'une rafale de requêtes essayant des identifiants de session successifs. Limites de débit, verrouillages et longs jetons aléatoires la déjouent, et les journaux d'authentification plus des alertes sur les pics d'échecs la révèlent.",
    learn: ["Les sessions et le navigateur", "Attaques sur l'authentification et les JWT"],
  },
  contain: {
    title: "Limitez les dégâts",
    tagline: "lancez une application faible dans un conteneur, pénétrez-la, puis verrouillez le conteneur pour que le même bug ne mène nulle part",
    tag: "Sécurité des conteneurs",
    intro: [
      "Un conteneur n'est pas un bac à sable par défaut. Tel quel, il tourne en root, avec un système de fichiers inscriptible et un accès réseau complet : une seule faille dans votre application — une injection de commande, par exemple — ne fait pas qu'exécuter du code, elle l'exécute en root, peut lire et réécrire tout ce qui est dans le conteneur, et peut appeler le réseau. Le conteneur est un outil d'empaquetage, pas une frontière de sécurité, tant que vous n'en faites pas une.",
      "Vous allez construire une application volontairement faible dans un conteneur, l'exploiter en local pour exécuter des commandes en root, puis durcir le conteneur — un utilisateur non privilégié, un système de fichiers en lecture seule, aucune capacité Linux, aucun nouveau privilège — et voir la même injection ne presque plus rien pouvoir. Ensuite seulement, vous corrigez le bug lui-même. La leçon, c'est la défense en profondeur : même après qu'un attaquant a trouvé un bug, c'est le moindre privilège qui décide jusqu'où il va.",
    ],
    isolate: "Tout tourne dans un conteneur sur votre propre machine, publié uniquement sur 127.0.0.1, sur des données jetables. L'application écoute à l'intérieur du conteneur ; Docker la mappe sur la boucle locale, donc rien n'est joignable depuis le réseau. Vous n'attaquez jamais que votre propre conteneur sur 127.0.0.1 — diriger ces commandes vers l'hôte d'autrui est un délit.",
    observe: "Une seule injection s'empare de tout le conteneur : elle tourne en root, lit n'importe quel fichier et écrit partout. L'application ne voulait que faire un ping, mais parce que le conteneur donne au processus root, un disque inscriptible et toutes les capacités, le rayon d'action du bug, c'est le conteneur entier — et de là, souvent l'hôte.",
    detect: "Un défenseur guette les traces que laisse ce lab : un processus tournant en root dans un conteneur, un conteneur détenant plus de capacités Linux qu'il n'en faut, des écritures sur un système de fichiers censé être en lecture seule, ou des connexions sortantes inattendues d'un service qui ne devrait pas en faire. Les scanners d'images signalent les utilisateurs root et le durcissement manquant avant le déploiement ; un moniteur d'exécution comme Falco alerte quand un processus web lance soudain un shell ou lit des fichiers sensibles.",
    learn: ["Tests et Docker", "Durcir Linux", "Évasion de conteneur et exécution"],
  },
};
