---
title: Ce qu'il y a dans un ordinateur
summary: Le matériel, le système d'exploitation, les programmes, les processus et les fichiers, expliqués à partir de rien, jusqu'à vos premières vraies commandes.
builds: lancer vos trois premières commandes et capturer votre premier drapeau
source: The Linux Command Line, William Shotts, livre gratuit en ligne (en anglais) | https://linuxcommand.org/tlcl.php
words: système d'exploitation, processus, shell
---
Pour protéger un ordinateur, il vous faut une image de ce qui se passe à l'intérieur. La voici. Pas de maths, rien à apprendre par cœur. Ce sont cinq idées, et chaque attaque que vous étudierez sera une histoire à leur sujet.

@term processeur (CPU) = La puce qui exécute les instructions, des milliards par seconde, une petite étape à la fois.
@term mémoire vive (RAM) = Un stockage temporaire rapide qui contient les programmes en cours et leurs données. Elle s'efface quand le courant s'arrête.
@term disque (stockage, SSD) = Un stockage permanent et lent pour les fichiers. Il garde son contenu même éteint.
@term système d'exploitation (OS) = Le logiciel qui gère le matériel et permet aux programmes de le partager sans danger. Par exemple Linux, Windows et macOS.
@term noyau (kernel) = Le cœur du système d'exploitation. Il contrôle le matériel et décide de ce que chaque programme a le droit de faire.
@term programme = Un fichier qui contient des instructions, posé sur le disque, qui ne fait rien.
@term processus = Un programme en cours d'exécution, avec sa propre mémoire et sa propre identité.
@term fichier = Un bloc de données nommé, stocké sur le disque.
@term répertoire (dossier) = Un conteneur pour des fichiers et d'autres répertoires.
@term shell = Le programme qui lit les commandes que vous tapez et les exécute.
@term terminal = La fenêtre dans laquelle vous tapez. Le shell tourne à l'intérieur.
@term ligne de commande (CLI) = Piloter un ordinateur en tapant des commandes plutôt qu'en cliquant.
@term Linux = Un système d'exploitation libre qui fait tourner la plupart des serveurs, des téléphones et des systèmes cloud du monde.
@term serveur = Un ordinateur qui fournit un service à d'autres via un réseau.

## Le matériel : une cuisine

Imaginez la cuisine d'un restaurant :

- Le **processeur** est le cuisinier. Il fait une petite instruction à la fois, mais des milliards par seconde.
- La **RAM** est le plan de travail : rapide, à portée de main, et débarrassé en fin de journée. Quand le courant s'arrête, la RAM oublie tout.
- Le **disque** est la réserve : bien plus grande, bien plus lente, et elle garde tout même éteinte.

Les enquêteurs en investigation numérique tiennent à cette différence. Les preuves en RAM disparaissent quand on éteint la machine : débrancher la prise peut donc détruire des preuves. Vous y reviendrez au mois 15.

?? Pourquoi un enquêteur peut-il éviter d'éteindre un ordinateur suspect ?
+ Les preuves en RAM seraient perdues pour toujours
- Le disque serait effacé au moment de l'arrêt
- Le processeur conserve une liste des attaquants connus
- Il est interdit par la loi de l'éteindre
=> La RAM oublie tout sans courant, et elle peut contenir la seule trace de ce qui tournait. Le disque, lui, garde ses données.

## Le système d'exploitation : le gérant

Des dizaines de programmes veulent le processeur au même moment. Sans gérant, un programme pourrait lire la mémoire d'un autre, ou effacer le disque. Le **système d'exploitation** est ce gérant, et son cœur est le **noyau**.

Le noyau pose une règle dont dépend toute la sécurité :

::: key
Les programmes ne peuvent pas toucher le matériel directement. Ils doivent le demander au noyau, et le noyau vérifie s'ils en ont le droit. L'essentiel de la sécurité tourne autour de cette vérification.
:::

@stack
Vous | tapez des commandes et cliquez |
Programmes | un navigateur, le shell, `whoami` | chacun tourne comme un processus
Noyau | vérifie chaque demande | le gardien
Matériel | processeur, RAM et disque | seul le noyau y touche

Chaque fois qu'un programme veut ouvrir un fichier, il fait une demande. Le noyau regarde qui demande et dit oui ou non. Quand vous verrez `Permission denied` dans quelques leçons, ce sera la voix du noyau.

?? Pourquoi est-ce important que les programmes doivent demander au noyau d'ouvrir un fichier ?
+ Cela donne un seul endroit où appliquer les permissions
- Cela rend la lecture des fichiers bien plus rapide
- Cela empêche à jamais les programmes d'avoir des bugs
- Cela protège les fichiers contre les pannes du matériel
=> Un point de contrôle unique signifie qu'un programme ne peut pas simplement se servir. Si chaque programme pouvait atteindre le disque directement, les permissions n'auraient aucun sens.

## Programmes et processus

Un **programme** est un fichier sur le disque : une recette dans un livre. Un **processus** est ce programme en train de tourner : le cuisinier qui prépare vraiment le plat. Ouvrez votre navigateur deux fois, et vous avez un programme, mais deux processus.

Chaque processus a un numéro (son PID), sa propre mémoire privée, et une **identité** : l'utilisateur sous lequel il tourne. C'est cette identité que le noyau vérifie.

@term PID (identifiant de processus) = Le numéro que le noyau donne à chaque processus en cours.

?? Vous ouvrez deux fois le même navigateur. Combien de programmes et de processus cela fait-il ?
+ Un programme sur le disque, et deux processus actifs
- Deux programmes sur le disque, et un processus actif
- Un programme sur le disque, et un processus actif
- Deux programmes sur le disque, et deux processus actifs
=> Le fichier sur le disque est un seul programme. À chaque lancement, le noyau crée un processus distinct, avec sa propre mémoire.

## Fichiers et dossiers

Tout ce qui est sur le disque est un **fichier**, et les fichiers vivent dans des **répertoires**, le nom technique des dossiers. Les répertoires peuvent contenir d'autres répertoires, et forment un arbre. Vous parcourrez cet arbre dans la prochaine leçon.

Maintenant que vous connaissez les fichiers, les processus et les permissions, voici comment ils s'assemblent. Les attaquants veulent lancer leur propre **processus**, sous l'identité d'un **utilisateur** puissant, pour lire ou modifier des **fichiers**. Les défenseurs essaient de l'empêcher, et de garder une trace quand cela arrive.

?? Avec ces idées, qu'essaient généralement de faire les attaquants ?
+ Lancer un processus sous l'identité d'un utilisateur puissant
- Faire tourner le processeur beaucoup plus vite qu'avant
- Déplacer tous les dossiers sur un autre disque
- Supprimer le shell de chaque ordinateur au monde
=> C'est l'identité qui décide de ce que le noyau autorise : exécuter du code en tant qu'utilisateur puissant leur donne presque tout.

## Le shell : parler au noyau

D'habitude, vous pilotez un ordinateur en cliquant. Mais les serveurs n'ont généralement pas d'écran, et un clic ne se répète ni ne s'automatise. Alors les professionnels tapent. Trois mots se confondent souvent :

- Le **terminal** est la fenêtre.
- Le **shell** est le programme, à l'intérieur, qui lit ce que vous tapez. Le plus courant sous Linux s'appelle `bash`.
- Une **commande** est un programme que vous demandez au shell d'exécuter.

Quand vous tapez `whoami` et appuyez sur Entrée, le shell trouve un programme appelé `whoami`, demande au noyau de le lancer comme nouveau processus, et vous montre ce qu'il affiche.

@flow Vous tapez whoami > Le shell trouve le programme > Le noyau lance un processus > Il affiche un résultat > Le shell vous attend

Nous utilisons **Linux** partout, car il fait tourner la plupart des serveurs et presque tous les outils de sécurité. Ne vous souciez pas encore d'installer quoi que ce soit. La boîte noire ci-dessous est un terminal qui tourne ici même, dans votre navigateur. Ses commandes se comportent comme les vraies, car nous les testons contre les vraies.

::: try Comment l'utiliser
Cliquez dans la boîte noire, tapez une commande et appuyez sur Entrée. Rien de ce que vous faites ne peut la casser, et **Réinitialiser** vous donne une machine neuve à tout moment.
:::

@range first-steps

?? Vous tapez `whoami` dans un terminal. Quelle description correspond le mieux à ce qui se passe ?
+ Le shell demande au noyau de lancer un programme
- La fenêtre du terminal vous répond elle-même, toute seule
- Le processeur lit votre clavier et affiche un nom
- Le disque cherche votre nom d'utilisateur et vous l'affiche
=> Le terminal ne fait qu'afficher du texte. Le shell comprend votre commande, et le noyau démarre le programme comme un processus. Bien séparer ces couches vous évitera des confusions plus tard.

?! Expliquez avec vos propres mots la différence entre un programme et un processus, avec une analogie à vous plutôt que la recette.

## Ce que vous savez faire maintenant

Vous avez lancé de vraies commandes et capturé votre premier drapeau. Et vous avez une image sur laquelle tout le reste du cursus s'appuie : le matériel en dessous, un noyau qui vérifie chaque demande, des processus qui tournent sous des utilisateurs, et des fichiers sur le disque.

Ensuite, vous apprendrez à vous déplacer dans ce système de fichiers aussi facilement que dans votre téléphone.

### Aller plus loin

Des sources primaires et le meilleur contenu gratuit sur ce sujet (en anglais), tous vérifiés en novembre 2026 :

- [CS50x, l'introduction gratuite à l'informatique de Harvard](https://cs50.harvard.edu/x/)
- [Operating Systems: Three Easy Pieces, un manuel gratuit](https://pages.cs.wisc.edu/~remzi/OSTEP/)
- [Nand2Tetris : construire un ordinateur à partir des portes logiques](https://www.nand2tetris.org/)
