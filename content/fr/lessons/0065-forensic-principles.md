---
title: L'investigation numérique
summary: L'ordre de volatilité, l'acquisition et l'intégrité, les artefacts Windows, l'analyse de la mémoire et les chronologies, en gardant les faits séparés des déductions.
builds: une chronologie défendable qui sépare les faits des déductions
source: Posters DFIR du SANS (en anglais) | https://www.sans.org/posters/
words: ordre de volatilité, artefact, chronologie
---
« Que s'est-il passé exactement sur cette machine ? » L'investigation numérique répond à partir de preuves, d'une manière qui résiste à l'examen. La discipline compte autant que les outils, car une conclusion habile que personne ne peut vérifier ne vaut rien.

@term investigation numérique = Collecter et analyser des preuves numériques d'une manière qui peut être défendue.
@term ordre de volatilité = Collecter d'abord les preuves qui durent le moins longtemps.
@term image forensique = Une copie exacte d'un disque ou d'une mémoire.
@term artefact = Une trace laissée sur un système par une activité.
@term Prefetch = Une fonction de Windows qui enregistre quand des programmes se sont exécutés.
@term MFT (master file table) = La table de NTFS qui enregistre chaque fichier d'un volume.
@term Volatility = Un cadre libre pour analyser des images de la mémoire.
@term super-chronologie = Une seule chronologie qui combine de nombreuses sources d'artefacts.
@term bloqueur d'écriture = Un appareil ou un réglage qui permet de lire un disque sans pouvoir le modifier.
@term Plaso = Un outil qui extrait les horodatages de nombreux types d'artefacts dans une seule chronologie.

## Les principes

**L'ordre de volatilité.** La mémoire disparaît le plus vite, donc collectez-la avant le disque. La [RFC 3227](https://www.rfc-editor.org/rfc/rfc3227) donne les recommandations classiques.

@flow Processeur et mémoire > État du réseau > Processus en cours > Disque > Sauvegardes

**L'intégrité.** Travaillez sur des copies, et calculez l'empreinte des preuves à la collecte, puis de nouveau plus tard. Des empreintes identiques prouvent que rien n'a changé. Un **bloqueur d'écriture** vous permet de faire l'image d'un disque sans y écrire un seul octet.

**La documentation.** Notez chaque étape, pour que quelqu'un d'autre puisse la reproduire. Si vous faites une erreur, notez-la aussi. Une note honnête sur une erreur abîme bien moins votre dossier qu'un trou inexpliqué que quelqu'un découvre plus tard, lors d'un interrogatoire.

@drill volatility

?? Pourquoi calculer l'empreinte d'une image forensique juste après l'avoir collectée ?
+ Pour prouver plus tard qu'elle n'a pas changé
- Pour chiffrer la preuve contre n'importe quel attaquant
- Pour réduire la taille de l'image à stocker
- Pour récupérer les fichiers qui ont été supprimés
=> Une empreinte identique montre l'intégrité. C'est la colonne vertébrale de la chaîne de traçabilité.

## Faire la copie

La mémoire passe en premier, puis le disque, et chacun a besoin de son propre outil :

| Quoi | Outils courants | Ce que vous obtenez |
|---|---|---|
| La mémoire, sous Windows | [WinPmem](https://github.com/Velocidex/WinPmem), DumpIt | Un fichier brut de la taille de la RAM |
| La mémoire, sous Linux | [AVML](https://github.com/microsoft/avml), LiME | La même chose |
| Un disque | FTK Imager, `ewfacquire`, ou `dd` derrière un bloqueur d'écriture | Une image brute, ou un fichier E01 |

Sous Linux, une image brute de disque demande deux commandes, lancées sur un disque branché à travers un bloqueur d'écriture :

```
sudo dd if=/dev/sdb of=disk.img bs=4M conv=noerror,sync status=progress
sudo sha256sum /dev/sdb disk.img
```

`if` est l'entrée, le disque de preuve, et `of` est le fichier de sortie. `conv=noerror,sync` continue au-delà des secteurs illisibles et les remplit de zéros, si bien que l'image garde sa taille et que chaque octet suivant reste à la bonne position. La seconde ligne calcule l'empreinte du disque et de la copie, et les deux empreintes devraient correspondre. Sur un disque défaillant, elles ne correspondront pas, à cause de ces secteurs remplis de zéros. Ce n'est pas une raison pour cacher quoi que ce soit : notez quels secteurs ont échoué et pourquoi les empreintes diffèrent, et gardez le journal de l'acquisition.

Le format **E01**, aussi appelé *Expert Witness Format*, fait le même travail avec plus de soin. Il compresse l'image et stocke l'empreinte et les notes du dossier à l'intérieur du fichier, et c'est pourquoi la plupart des suites forensiques le préfèrent.

?? Vous faites l'image d'un disque défaillant, et l'empreinte de l'image ne correspond pas à celle du disque. Que faites-vous ?
+ Noter les secteurs illisibles et expliquer l'écart
- Refaire l'image jusqu'à ce que tout corresponde
- Retirer discrètement l'empreinte de tout le rapport
- Jeter toute l'image et arrêter là l'enquête
=> Un écart que vous savez expliquer ne pose pas de problème. Une explication absente du rapport, c'est ce qui détruit la confiance dans tout le reste.

## Les artefacts Windows

Un **artefact** est une empreinte de pas. Windows en garde beaucoup pour aller plus vite ou rester pratique, et chacun répond à une question différente.

| Artefact | Répond à | Attention |
|---|---|---|
| Prefetch | Un programme s'est-il exécuté, et quand ? | Souvent désactivé sur les serveurs |
| Amcache, Shimcache | Ce programme était-il présent ? | La présence ne prouve pas toujours l'exécution |
| Fichiers LNK, Jump Lists | Quels fichiers un utilisateur a-t-il ouverts ? | Survivent à la suppression du fichier |
| ShellBags | Quels dossiers un utilisateur a-t-il parcourus ? | Par utilisateur |
| SRUM | Combien de réseau et de processeur a-t-il consommé ? | Conservé environ un mois |
| `$MFT`, `$UsnJrnl` | Quand un fichier a-t-il été créé ou modifié ? | Les horodatages peuvent être falsifiés |
| Journaux d'événements | Connexions, services, changements | Peuvent être effacés (événement 1102) |

[13Cubed](https://www.youtube.com/@13Cubed) les enseigne remarquablement, et les [outils d'Eric Zimmerman](https://ericzimmerman.github.io/) les analysent.

Les journaux d'événements répondent au plus grand nombre de questions, et une poignée d'identifiants couvre la plupart des enquêtes :

| Identifiant | Journal | Signifie |
|---|---|---|
| 4624 | Security | Une connexion réussie. Son type de connexion dit comment : 2 au clavier, 3 par le réseau, 10 par le Bureau à distance |
| 4625 | Security | Une connexion échouée |
| 4688 | Security | Un processus a été créé, si l'audit des processus est activé |
| 7045 | System | Un nouveau service a été installé |
| 1102 | Security | Le journal d'audit a été effacé |

Chaque fichier sur NTFS a deux jeux d'horodatages dans la MFT. `$STANDARD_INFORMATION` contient les quatre que montre l'Explorateur : modification, accès, changement (de l'entrée MFT elle-même) et naissance, souvent notés **MACB**. `$FILE_NAME` en contient quatre autres, que les programmes ordinaires ne peuvent pas modifier directement. Les outils qui falsifient les dates d'un fichier, ce qu'on appelle le **timestomping**, ne changent en général que le premier jeu. Un fichier dont l'heure de création de `$STANDARD_INFORMATION` est plus ancienne que celle de `$FILE_NAME` mérite donc qu'on y regarde de plus près. C'est aussi le cas d'une heure dont la fraction vaut exactement zéro, parce que NTFS compte par pas de 100 nanosecondes, et qu'un vrai fichier tombe rarement sur une seconde ronde.

@code timestomp-check

?? Vous voulez prouver que `tool.exe` s'est exécuté sur un poste. Quel artefact est le meilleur point de départ ?
+ Prefetch, car il enregistre l'exécution de chaque programme
- ShellBags, car ils listent les dossiers déjà parcourus
- Les journaux DNS, car ils listent les domaines
- SRUM, car il ne stocke que des contenus
=> Prefetch est conçu autour du lancement des programmes. Confirmez avec une seconde source, car de bons constats reposent sur plus d'un artefact.

## La mémoire

[Volatility 3](https://volatilityfoundation.org/) lit une image de la mémoire, ce qui vous permet d'examiner une copie de ce que faisait la machine. La mémoire peut montrer ce qui n'a jamais touché le disque.

| Plugin | Montre |
|---|---|
| `windows.pslist` | Les processus en cours |
| `windows.pstree` | Qui a lancé qui |
| `windows.cmdline` | La ligne de commande de chaque processus |
| `windows.netscan` | Les connexions réseau |
| `windows.malfind` | La mémoire qui ressemble à du code injecté |

Les lancer demande une commande chacun :

```
vol -f memory.raw windows.pstree
vol -f memory.raw windows.malfind --pid 4012
```

Un arbre de processus se lit plus facilement quand on sait à quoi ressemble un arbre sain. Le [poster Hunt Evil du SANS](https://www.sans.org/posters/hunt-evil/) liste les parents normaux, et voici ceux qui valent le plus la peine d'être retenus :

| Processus | Son parent normal | Combien |
|---|---|---|
| `wininit.exe` | `smss.exe`, qui s'est terminé, donc aucun parent n'apparaît | Un |
| `services.exe` | `wininit.exe` | Un |
| `lsass.exe` | `wininit.exe` | Un |
| `svchost.exe` | `services.exe` | Beaucoup |

Un `svchost.exe` lancé par autre chose que `services.exe`, ou un second `lsass.exe`, est un signe classique d'un logiciel malveillant caché sous un nom familier.

@code process-tree

Un constat classique est l'**injection de processus** : `notepad.exe` détient de la mémoire exécutable qui ne correspond à aucun fichier, et se connecte à internet. Notepad n'a aucune raison de faire cela. `malfind` donne des candidats, pas des verdicts, donc vous devez encore examiner ce qu'il trouve.

`malfind` signale la mémoire qui est à la fois accessible en écriture et exécutable, et qui n'est soutenue par aucun fichier sur le disque. C'est l'allure habituelle d'un code injecté. C'est aussi l'allure du moteur JavaScript d'un navigateur, parce qu'il écrit du code pendant qu'il tourne. Un signe est plus fort que les autres : une zone qui commence par `MZ`, les deux premiers octets de tout programme Windows, signifie qu'un exécutable entier a été chargé directement en mémoire, et aucun navigateur n'a besoin de faire cela.

@code injection-candidates

?? `windows.malfind` signale une zone à l'intérieur d'un processus de navigateur. Quelle est la bonne conclusion ?
+ Un candidat, qu'il faut encore examiner de près
- La preuve qu'un malware a infecté le navigateur
- L'image mémoire est corrompue, donc il faut arrêter
- Rien, aucun navigateur ne contient de code injecté
=> Les navigateurs génèrent légitimement du code à l'exécution. Le résultat d'un outil est une piste, et c'est votre analyse qui en fait un constat.

## Les chronologies, et un langage honnête

Mettez tout sur une seule chronologie, en UTC. **Plaso** construit une **super-chronologie** à partir de nombreuses sources. Ensuite, écrivez avec soin :

| Fait | Déduction |
|---|---|
| « Le journal montre une connexion à 03:14 en tant que `svc_web` » | « L'attaquant a probablement utilisé un mot de passe volé » |

Marquez clairement chacun. Les conclusions qui les mélangent ne résistent pas à la relecture.

Une super-chronologie tirée d'un seul portable peut compter des millions de lignes, donc personne ne la lit depuis le début. On **pivote** plutôt : on prend un moment dont on est sûr, comme l'alerte ou la première connexion malveillante, et on lit tout ce qui se trouve à quelques minutes de part et d'autre. Chaque nouveau constat vous donne un autre moment à partir duquel pivoter.

@code timeline-window

@drill fact-inference

?? Quelle phrase est écrite comme un fait ?
+ L'événement 4624 enregistre une connexion de `sam` à 03:14
- Le pirate a utilisé les identifiants volés de Sam
- L'attaquant voulait clairement atteindre le personnel de la finance
- Sam a forcément cliqué sur le lien d'hameçonnage reçu
=> Elle dit ce que montre une source, et rien de plus. Les autres ajoutent une cause ou un mobile que les preuves n'énoncent pas.

## Travaillez à partir des preuves

@range forensics

::: try Entraînez-vous
Faites les labos de [CyberDefenders](https://cyberdefenders.org/) et les images du [NIST CFReDS](https://cfreds.nist.gov/), puis rédigez [P11](/projects/P11/).
:::

## Relire un rapport

Le brouillon de rapport d'un collègue contient trois lignes qui doivent changer avant qu'il ne parte.

```
1. Nous avons branché le disque du portable sur un PC d'analyse et l'avons parcouru dans l'Explorateur.
2. Prefetch montre que MIMIKATZ.EXE s'est exécuté à 03:16, donc tous les mots de passe du domaine ont été volés.
3. Toutes les heures de ce rapport sont des heures locales.
```

?? Qu'a mis en danger l'étape 1 ?
+ La preuve, car rien n'empêchait alors Windows d'y écrire
- Les heures, car l'Explorateur les convertit toutes en UTC
- Rien du tout, car l'Explorateur ne modifie aucun fichier
- Le rapport, car l'Explorateur cache tous les fichiers système
=> Windows peut écrire sur tout volume qu'il monte, par exemple pour mettre à jour des horodatages ou créer ses propres dossiers système. Un bloqueur d'écriture, ou le travail sur une image seulement, garde l'original intact.

?? Qu'est-ce qui ne va pas dans la ligne 2 ?
+ Un seul fait y devient une affirmation bien plus large
- Prefetch ne note jamais l'heure à laquelle un programme tourne
- Les noms de programmes dans Prefetch sont toujours en minuscules
- Mimikatz ne peut jamais s'exécuter sur un ordinateur du domaine
=> Le fait, c'est qu'un programme de ce nom s'est exécuté à 03:16. Ce qu'il a fait, quels comptes il a atteints, et si quelque chose a quitté la machine, tout cela demande d'autres preuves, et le rapport doit le dire.

?? Pourquoi la ligne 3 doit-elle changer ?
+ Des heures locales sans fuseau ne peuvent pas être recoupées
- Les tribunaux n'acceptent que des heures écrites en nombres Unix
- L'heure locale a toujours une heure de retard sur UTC
- Un bon rapport ne devrait contenir aucune heure du tout
=> Sans fuseau horaire nommé, et avec l'heure d'été en jeu, personne ne peut aligner ces heures sur les journaux du pare-feu ou du cloud. Écrivez en UTC, comme à la leçon 59.

?! Réécrivez ceci en séparant les faits des déductions : « Le pirate s'est connecté à 3 heures du matin avec le mot de passe volé de Sam et a lancé un script. »
