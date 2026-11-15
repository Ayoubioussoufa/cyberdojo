---
title: Des comportements, pas des indicateurs
summary: Associer les alertes à ATT&CK, les IOC face aux TTP, et pourquoi la pyramide de la douleur façonne une bonne détection.
builds: associer les alertes à ATT&CK avec exactitude, et classer les indicateurs selon leur valeur
source: The Pyramid of Pain, David Bianco (en anglais) | https://detect-respond.blogspot.com/2013/03/the-pyramid-of-pain.html
words: IOC, TTP, pyramide de la douleur
---
Vous pouvez bloquer une mauvaise IP aujourd'hui, et demain l'attaquant en a une nouvelle. Les bons défenseurs visent ce qui coûte cher à changer pour les attaquants. Cette leçon vous donne les deux idées qui le permettent : une façon de classer les indices, et une carte commune de la manière dont les attaquants se comportent.

@term pyramide de la douleur = Un modèle qui classe les indicateurs selon le mal que leur détection fait à un attaquant.
@term ATT&CK Navigator = Un outil web pour visualiser la couverture des techniques d'ATT&CK.
@term sous-technique = Une version plus précise d'une technique d'ATT&CK, écrite comme T1059.001.
@term chasse aux menaces = Rechercher activement des attaquants qu'aucune alerte n'a attrapés.

## Les indices et les habitudes

Pensez à un cambrioleur. Une empreinte digitale sur une fenêtre est un **IOC**, un indicateur de compromission : un indice précis qui prouve que quelque chose s'est passé. L'habitude du cambrioleur d'entrer toujours par la fenêtre arrière, la nuit, est une **TTP** : tactiques, techniques et procédures, autrement dit sa façon de travailler.

Mettez des gants et l'empreinte disparaît. L'habitude est bien plus difficile à changer. Un IOC vous parle donc d'hier, alors qu'une TTP peut attraper demain.

| | IOC | TTP |
|---|---|---|
| Exemple | `203.0.113.7`, l'empreinte d'un fichier | « Word lance PowerShell » |
| Durée de vie | Des heures à des semaines | Des mois à des années |
| Effort de détection | Faible : il suffit de chercher | Plus élevé : demande de bons journaux |
| Meilleur usage | Vérifications rapides, périmètre | Détections durables |

Un rapport sur une menace se termine en général par une liste d'indicateurs, tous mélangés. La première chose qu'un analyste en fait est de les trier par genre, car chaque genre se cherche dans un journal différent : les empreintes dans les données des postes, les adresses dans les journaux de pare-feu, les noms dans le DNS. Les genres se reconnaissent à leur forme, que vous avez apprise au mois 6.

@code indicator-kind

?? Lequel de ces éléments est une TTP plutôt qu'un IOC ?
+ Extraire des identifiants de la mémoire après la connexion
- L'empreinte SHA-256 d'un seul fichier bien précis et unique
- L'adresse IP `198.51.100.23` qui est tirée d'un rapport récent
- Le nom de domaine `update-check.example` vu dans les journaux
=> Une empreinte, une adresse et un domaine sont des artefacts précis. Extraire des identifiants est un comportement, quel que soit l'outil qui le fait.

## La pyramide de la douleur

Le [modèle de David Bianco](https://detect-respond.blogspot.com/2013/03/the-pyramid-of-pain.html) (en anglais), du plus facile à remplacer au plus difficile :

Plus vous détectez haut, plus il en coûte à un attaquant de vous contourner :

@pyramid
TTP | sa façon de se comporter. Dur : il doit changer sa manière de travailler
Outils | un outil d'attaque précis. Pénible
Artefacts réseau et hôte | un chemin ou un agent utilisateur distinctif. Agaçant
Noms de domaine | evil.example. Simple
Adresses IP | 203.0.113.7. Facile
Empreintes | le SHA-256 d'un fichier. Trivial : changez un octet

Prenez un incident et placez ses indices sur la pyramide. Supposons qu'un rapport sur l'intrusion du mois dernier vous donne ceci :

| Indice du rapport | Niveau | Si vous le bloquez, l'attaquant doit… |
|---|---|---|
| Le SHA-256 du programme déposé | Empreinte | Changer un octet et recompiler |
| `203.0.113.7` | Adresse IP | Louer un autre serveur |
| `cdn-sync.example` | Nom de domaine | Enregistrer un autre nom |
| Un agent utilisateur `SyncClient/2.1` | Artefact réseau | Modifier un réglage de son outil |
| L'outil lui-même, reconnu à son comportement sur le réseau | Outil | Trouver ou écrire un autre outil |
| Office lance un interpréteur de scripts, qui ajoute une tâche planifiée | TTP | Apprendre une autre façon de travailler |

La première ligne lui coûte une seconde. La dernière lui coûte des semaines, et elle aurait aussi attrapé un autre groupe qui a la même habitude.

@code pyramid-sort

Les indicateurs restent utiles : ils se cherchent vite, et ils vous aident à délimiter le périmètre. Mais **les détections fondées sur le comportement durent plus longtemps**.

@drill ioc-rank

Un comportement peut s'écrire aussi précisément qu'une empreinte. « Un programme Office a lancé un interpréteur de scripts » est un test sur deux champs d'un événement de création de processus, le parent et l'enfant. Écrivez-le, et vous avez écrit la logique d'une vraie règle de détection.

@code office-spawns-script

?? Quelle détection survivra le plus longtemps quand un attaquant change son installation ?
+ Une application Office qui lance un interpréteur de scripts
- Un seul SHA-256, celui d'un fichier déjà bien connu
- Une adresse IP du rapport de la semaine dernière
- Un nom de domaine venu d'un incident déjà passé
=> Le comportement reste le même quand les fichiers et l'infrastructure changent.

## Voyez la différence

Essayez. La première mission cherche par empreinte. La seconde cherche par comportement. Comparez ce que chacune trouve.

@range behaviour

?? Après les deux missions, pourquoi chercher la seule empreinte était-il dangereux ?
+ Elle laissait croire à une seule victime sur plusieurs
- Chercher dans les journaux prenait beaucoup trop de temps
- Stocker des empreintes dans un SIEM est strictement illégal
- Elle supprimait les preuves contenues dans le fichier d'export
=> L'attaquant a réempaqueté le fichier pour chaque victime. Chercher une seule empreinte donne un faux sentiment de sécurité sur le périmètre.

## Associer une alerte à ATT&CK

[ATT&CK](https://attack.mitre.org/) est un catalogue public de comportements réels d'attaquants. Il a deux grandes parties : les **tactiques**, qui sont les objectifs, et les **techniques**, qui sont les moyens de les atteindre. Beaucoup de techniques se divisent en **sous-techniques**.

Pour chaque alerte, posez deux questions : que cherche à faire l'attaquant, et comment ?

| Alerte | Tactique (pourquoi) | Technique (comment) |
|---|---|---|
| Word a lancé PowerShell, qui a exécuté un script | Execution | T1059.001 PowerShell |
| Une nouvelle tâche planifiée s'exécute à l'ouverture de session | Persistence | T1053.005 Scheduled Task |
| Cinquante échecs de connexion, puis une réussite | Credential Access | T1110 Brute Force |

Les identifiants ont une forme qu'il vaut la peine de connaître, car les rapports et les outils les utilisent sans explication :

| Identifiant | Genre | Exemple |
|---|---|---|
| `TA0003` | Une tactique | Persistence |
| `T1053` | Une technique | Scheduled Task/Job |
| `T1053.005` | Une sous-technique de T1053 | Scheduled Task, sous Windows |

Ouvrez n'importe quelle page de technique sur le site d'ATT&CK et vous trouverez les quatre mêmes parties : une description du comportement, des **exemples de procédures** qui nomment les groupes l'ayant utilisé, des **mesures d'atténuation** qui le rendent plus difficile, et des conseils de **détection** qui disent quelles données le montrent. Pour un défenseur, les deux dernières sont la page. Les lire pour une technique par jour est l'une des meilleures habitudes à prendre ce mois-ci.

Une technique peut servir plusieurs tactiques, donc le même comportement peut apparaître deux fois sur la carte.

::: trap La précision est la compétence
N'associez pas généreusement pour paraître exhaustif. N'associez que ce que montrent les preuves, et citez-les. Une correspondance faite par un LLM doit être vérifiée ligne par ligne, comme vous le ferez au mois 15.
:::

@drill tactic

?? Une alerte montre PowerShell lancé par Word, et rien d'autre. Un collègue l'associe à six techniques. Qu'est-ce qui ne va pas ?
+ La correspondance affirme plus que les preuves ne montrent
- Six, c'est moins que ce qu'ATT&CK exige normalement ici
- ATT&CK ne peut jamais associer plus d'une seule tactique
- PowerShell n'est une technique listée nulle part dans ATT&CK
=> Chaque technique associée a besoin de sa propre preuve. Trop associer donne aux rapports un air exhaustif tout en les rendant moins vrais.

## De la couverture aux manques

Une fois vos détections étiquetées avec des identifiants de techniques, une simple comparaison montre où vous êtes aveugle : listez les techniques qui comptent pour votre organisation, et rayez celles qu'une détection couvre. Ce qui reste est votre liste de chasse. ATT&CK Navigator dessine cela sous forme de grille colorée, et dessous c'est une différence d'ensembles.

@code coverage-gaps

Un manque devient une chasse quand vous écrivez une **hypothèse**, une phrase qui peut se révéler fausse. Une bonne hypothèse a trois parties : le comportement, le journal qui le montrerait, et ce que vous vous attendez exactement à voir.

```
Si un attaquant persiste au moyen de tâches planifiées,
alors l'événement Sécurité 4698 montrera des tâches créées hors de \Microsoft\
par des comptes qui ne sont pas administrateurs.
```

?? Qu'est-ce qui fait de cela une hypothèse de chasse utilisable ?
+ Elle nomme un comportement, un journal, un observable
- Elle nomme l'attaquant ainsi que son pays d'origine
- Elle promet qu'une attaque sera bien trouvée ici
- Elle liste chaque technique de la matrice ATT&CK
=> Une hypothèse que vous pouvez tester vous dit où regarder et ce qui compterait comme une trouvaille. Si la recherche ne trouve rien, vous avez quand même appris si le journal peut le montrer.

?? Un rapport donne l'empreinte d'un fichier, un domaine, et « Office lance `rundll32` ». Vous pouvez construire une seule détection aujourd'hui. Laquelle dure le plus longtemps ?
+ Le comportement Office vers `rundll32`, haut dans la pyramide
- L'empreinte du fichier, car une empreinte reste toujours unique
- Le domaine, car enregistrer un nom est très difficile
- Les trois à égalité, puisque chacun a été observé
=> Cherchez l'empreinte et le domaine aujourd'hui pour délimiter l'incident. Construisez la détection durable sur le comportement, qui survit aux nouveaux fichiers et à la nouvelle infrastructure.

## De la carte au plan

Les chasseurs utilisent cela à l'envers. Choisissez un comportement que votre organisation ne sait pas détecter actuellement, écrivez une hypothèse, et partez à sa recherche. C'est la **chasse aux menaces** : rechercher un attaquant qu'aucune alerte n'a attrapé.

@flow Choisir une technique > Écrire une hypothèse > Interroger les journaux > Une trouvaille ? Enquêter > Rien trouvé ? Écrire quand même une détection

?! Reprenez la mission de triage de la leçon 51. Listez ses indicateurs, et placez chacun sur la pyramide.
