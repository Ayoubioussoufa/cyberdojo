---
title: Pare-feu, NAT et segmentation
summary: Comment un pare-feu décide, pourquoi tout refuser par défaut compte, et comment découper un réseau pour qu'une brèche ne devienne pas la brèche de tout.
builds: concevoir un réseau segmenté avec une règle justifiée pour chaque flux
source: Documentation d'OPNsense (en anglais) | https://docs.opnsense.org/
words: pare-feu, refus par défaut, DMZ
---
Un réseau à plat ressemble à une maison sans portes intérieures : entrez par une fenêtre et vous atteignez tout. Ce mois-ci, vous en construirez un avec des portes, et vous écrirez pourquoi chacune est ouverte.

@term pare-feu = Un système qui autorise ou bloque le trafic réseau selon des règles.
@term pare-feu à états = Un pare-feu qui suit les connexions, et laisse donc passer les réponses automatiquement.
@term refus par défaut = Tout bloquer, sauf ce qu'une règle autorise explicitement.
@term segmentation = Découper un réseau en zones pour contrôler le trafic entre elles.
@term DMZ = Une zone du réseau pour les serveurs exposés au public, séparée du réseau interne.
@term redirection de port = Envoyer le trafic qui arrive sur un port public vers une machine interne.
@term VPN = *Virtual Private Network* : un tunnel chiffré entre un appareil et un réseau.
@term proxy = Un serveur qui fait les requêtes à la place des clients, et peut les filtrer et les journaliser.

## Comment un pare-feu décide

Un pare-feu lit les règles depuis le haut, et la première qui correspond l'emporte. Une règle dit : d'où, vers où, quel port, et que faire.

```
#  ACTION  SOURCE       DESTINATION    PORT    POURQUOI
1  ALLOW   any          DMZ web        443     Site web public
2  ALLOW   LAN          any            443,80  Navigation du personnel
3  ALLOW   admin host   DMZ web        22      SSH d'administration depuis une seule machine
4  DENY    any          any            any     Refus par défaut
```

Un pare-feu **à états** se souvient des connexions : quand un portable du personnel ouvre une connexion vers un site, les réponses reviennent automatiquement. Vous écrivez des règles pour celui qui commence la conversation, et la table d'états s'occupe du reste.

Lisez une règle comme une phrase. La règle 3 dit : « si le paquet vient de la machine d'administration, va vers le serveur web de la DMZ et vise le port 22, laisse-le passer ». Un paquet doit correspondre à toutes les colonnes d'une règle, pas à une seule. Si une colonne ne convient pas, le pare-feu descend à la règle suivante.

Suivez maintenant deux paquets dans la table, à la main, comme le fait le pare-feu :

| Paquet | Règle 1 | Règle 2 | Règle 3 | Règle 4 | Résultat |
|---|---|---|---|---|---|
| Un portable du personnel vers un site d'actualités sur 443 | Non : mauvaise destination | Correspond | non lue | non lue | Autorisé |
| Un portable du personnel vers le serveur web de la DMZ sur 22 | Non : mauvais port | Non : mauvais port | Non : mauvaise source | Correspond | Bloqué |

Le second paquet est le plus important. Personne n'a écrit « bloquer le SSH du personnel vers le serveur web ». Il est bloqué parce que personne ne l'a autorisé, et la dernière règle attrape tout ce qui reste. C'est toute l'idée de l'encadré suivant.

::: key Refus par défaut
Listez ce qui est autorisé, et bloquez tout le reste. L'inverse, tout autoriser et bloquer ce qu'on sait mauvais, échoue dès qu'une nouveauté apparaît. La feuille de route demande une raison d'une ligne pour chaque règle, car une règle que personne ne sait justifier est une règle à supprimer.
:::

### La même idée sur votre propre machine Linux

Un pare-feu n'est pas seulement un boîtier au bord d'un réseau. Chaque machine Linux en a un dans son noyau, et sous Ubuntu la façon la plus simple de le piloter est `ufw`, le « pare-feu sans complication ». Essayez-le dans votre VM, jamais sur une machine que vous n'atteignez que par le réseau.

```
sudo ufw default deny incoming     bloquer toute connexion ouverte par d'autres
sudo ufw default allow outgoing    laisser cette machine ouvrir ses propres connexions
sudo ufw allow 22/tcp              une exception : SSH, pour pouvoir encore entrer
sudo ufw enable                    allumer le pare-feu
sudo ufw status verbose            afficher les réglages par défaut et les règles
```

Ligne par ligne : les deux premières fixent les réglages par défaut, c'est-à-dire la réponse pour tout paquet qu'aucune règle ne mentionne. La troisième ajoute une règle d'autorisation. La quatrième allume le tout, et la dernière vous montre ce que vous avez construit. `ufw` est à états : les réponses aux connexions ouvertes par votre machine reviennent sans règle. La [documentation d'Ubuntu sur les pare-feu](https://documentation.ubuntu.com/server/how-to/security/firewalls/) (en anglais) couvre le reste.

::: trap Ne vous enfermez pas dehors
Si vous êtes connecté à une machine par SSH et que vous activez un pare-feu qui refuse tout par défaut avant d'autoriser le port 22, votre propre session est la première chose qu'il bloque. Autorisez d'abord votre accès, activez ensuite.
:::

?? La règle 1 autorise le port 443 depuis partout. La règle 2 refuse tout depuis `203.0.113.7`. Cette IP atteint-elle le port 443 ?
+ Oui, car la première règle qui correspond gagne toujours
- Non, car un refus a toujours la priorité absolue
- Non, car la règle 2 est la plus précise
- Oui, mais seulement après une ligne dans le journal
=> Avec la logique de la première correspondance, l'ordre des règles fait tout. Placez les refus précis au-dessus des autorisations larges. Vérifiez aussi le comportement de votre plateforme : certaines diffèrent.

## NAT et redirection de port

Le **NAT** permet à de nombreuses adresses privées de partager une seule adresse publique. Le routeur réécrit l'adresse source à la sortie, et il retient la correspondance pour que les réponses retrouvent leur chemin. Décrit dans la [RFC 3022](https://www.rfc-editor.org/rfc/rfc3022).

Voici à quoi ressemble la table du routeur pendant que deux portables naviguent en même temps. Les deux utilisent la seule adresse publique, `198.51.100.9`, et le routeur distingue leurs réponses grâce au numéro de port qu'il a choisi à la sortie :

| Adresse et port internes | Réécrits en | En conversation avec |
|---|---|---|
| `192.168.1.20:51000` | `198.51.100.9:40001` | `203.0.113.5:443` |
| `192.168.1.31:51000` | `198.51.100.9:40002` | `203.0.113.5:443` |

Quand une réponse arrive pour le port 40002, le routeur la cherche dans la table, réécrit la destination en `192.168.1.31:51000` et la transmet. Un paquet venu de l'extérieur qui ne correspond à aucune ligne n'a nulle part où aller, donc le routeur le jette. Voilà pourquoi un réseau domestique semble protégé : non parce que le NAT juge le trafic, mais parce que personne à l'intérieur ne l'a demandé.

Le NAT n'est pas une fonction de sécurité, même s'il cache les adresses internes par effet de bord. La **redirection de port** va dans l'autre sens : « le trafic vers mon IP publique sur 443 va à ce serveur interne ». Chaque redirection est un trou dans vos défenses, donc chacune est une décision.

?? Pourquoi chaque redirection de port est-elle une décision à consigner ?
+ C'est un trou volontaire dans votre propre pare-feu
- Elle ralentit fortement tout le réseau de l'entreprise
- Elle coupe le NAT pour vos autres appareils
- Elle change votre adresse publique tous les jours
=> Une redirection expose un service interne à l'extérieur. Chacune a besoin d'une raison et d'un responsable.

## Segmentation

Divisez votre réseau en zones selon la confiance, et forcez le trafic entre elles à passer par un pare-feu.

@flow Internet > Pare-feu > DMZ : serveurs publics > Pare-feu > Interne : personnel et données

```
Internet
   │
[Pare-feu]──── DMZ : serveur web public
   │
   ├────────── LAN : portables du personnel
   │
   └────────── Serveurs : bases de données, serveurs de fichiers
```

Si le serveur web de la DMZ est piraté, l'attaquant doit encore franchir le pare-feu pour atteindre la base de données, et le pare-feu n'autorise que le seul port dont l'application web a besoin. La segmentation limite le **rayon d'explosion**. C'est aussi ce qui rend le **mouvement latéral** bruyant et détectable.

?? Le serveur web public est compromis. Quelle conception limite le plus les dégâts ?
+ Il est en DMZ, avec des règles très étroites
- Il partage un réseau à plat avec le personnel
- Il porte un nom d'hôte très long et aléatoire
- Il écoute sur un autre port que le 443
=> Une DMZ signifie qu'une brèche à cet endroit ne donne pas libre accès à tout le reste. Se cacher sur un port inhabituel n'arrête presque rien.

## VPN et proxys

Un **VPN** crée un tunnel chiffré, de sorte qu'un appareil distant se comporte comme s'il était sur le réseau. [WireGuard](https://www.wireguard.com/) et IPsec sont les protocoles courants. Retenez le compromis : une fois connecté, vous êtes à l'intérieur. Le zero trust, au mois 19, est la réponse à cela.

Un **proxy** fait les requêtes web pour les utilisateurs, il peut donc les filtrer et les journaliser. Les journaux de proxy sont une source de données clé au mois 9.

?? Quel est le principal risque une fois qu'une personne est connectée par VPN ?
+ Elle est à l'intérieur, avec un accès trop large
- Son trafic peut être lu par tous ses voisins
- Son mot de passe circule en clair sur Internet
- Son portable ne reçoit plus aucune mise à jour
=> Un VPN protège la connexion, mais il peut donner un large accès au réseau. C'est pourquoi le zero trust accorde des accès étroits.

## Lire une conception comme un relecteur

Avant de construire, exercez-vous au contrôle que fait un relecteur sur toute conception de pare-feu : prenez un flux à la fois et demandez qui le commence, où il va, sur quel port, et quelle règle l'autorise. Si vous ne pouvez pas montrer une règle, le flux est bloqué. Si vous ne savez pas dire pourquoi une règle existe, c'est la règle le problème.

Prenez cette petite entreprise. Le personnel est sur le LAN, le site web public est dans la DMZ, et la base de données est dans la zone Serveurs.

```
#  ACTION  SOURCE     DESTINATION   PORT   POURQUOI
1  ALLOW   any        DMZ web       443    Site web public
2  ALLOW   DMZ web    database      5432   Le site lit ses données
3  ALLOW   LAN        any           443    Navigation du personnel
4  DENY    any        any           any    Refus par défaut
```

?? Un attaquant prend le contrôle du serveur web de la DMZ. Que peut-il atteindre dans la zone Serveurs ?
+ Seulement la base de données, sur le port 5432
- Tous les serveurs de la zone, sur chaque port
- Rien du tout, car la DMZ est bien isolée
- Seulement les serveurs de fichiers, par le port SSH
=> La règle 2 est la seule porte de sortie de la DMZ. Cela reste un risque, donc la base de données a besoin de sa propre authentification et de ses propres journaux, mais l'attaquant ne peut rien balayer ni atteindre d'autre.

?? Un membre du personnel n'arrive pas à ouvrir la base de données depuis son portable sur le port 5432. Quelle règle en décide ?
+ La règle 4, car aucune autre règle ne lui correspond
- La règle 2, car elle nomme bien le port voulu
- La règle 3, car elle couvre le LAN du personnel
- La règle 1, car elle vient en premier dans l'ordre
=> La règle 2 a le bon port mais la mauvaise source, et la règle 3 a la bonne source mais le mauvais port. Une règle doit correspondre sur toutes les colonnes, donc le paquet tombe sur le refus par défaut.

## Votre labo : le début de P01

::: try Construisez-le
1. Téléchargez [OPNsense](https://opnsense.org/download/) et créez une VM avec au moins deux cartes réseau.
2. Attribuez les interfaces : WAN (NAT), LAN (réseau privé hôte), DMZ (un second réseau privé hôte).
3. Placez Ubuntu dans la DMZ et Kali sur le LAN. Dessinez d'abord le schéma, plan d'adressage IP compris, avec [draw.io](https://www.drawio.com/).
4. Écrivez les règles avec un refus par défaut. Donnez à chacune une raison d'une ligne.
5. Testez chaque règle depuis Kali, et notez ce qui est passé et ce qui a été bloqué.
:::

?! Écrivez les règles de pare-feu d'une toute petite entreprise avec un site web public, une base de données et cinq portables pour le personnel. Justifiez chacune en une ligne.
