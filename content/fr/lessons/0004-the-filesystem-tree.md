---
title: Se déplacer dans le système de fichiers
summary: Comment Linux range tout dans un seul arbre, et comment le parcourir avec pwd, ls et cd.
builds: naviguer sur n'importe quelle machine Linux et trouver les fichiers cachés
source: The Linux Command Line, chapitres 1 à 3 (en anglais) | https://linuxcommand.org/tlcl.php
words: chemin absolu, chemin relatif, répertoire personnel
---
Windows a `C:\`, `D:\` et des dossiers. Linux a **un seul arbre**, et tout est suspendu à un point unique appelé la racine. Dès que vous savez imaginer cet arbre et vous y déplacer, chaque machine sur laquelle vous atterrirez vous semblera familière.

@term répertoire racine (/) = Le sommet de l'arbre des fichiers sous Linux. Chaque fichier se trouve quelque part en dessous.
@term chemin = L'adresse d'un fichier ou d'un répertoire dans l'arbre.
@term chemin absolu = Un chemin qui part de la racine, comme /home/ana/notes.txt. Il fonctionne depuis n'importe où.
@term chemin relatif = Un chemin qui part de là où vous êtes, comme notes.txt ou ../logs.
@term répertoire de travail = Le répertoire dans lequel se trouve actuellement votre shell.
@term répertoire personnel (home) = Votre répertoire à vous, en général /home/votrenom, abrégé en ~.
@term fichier caché (dotfile) = Un fichier dont le nom commence par un point, omis par un simple ls.
@term option (flag) = Un réglage supplémentaire pour une commande, qui commence en général par un tiret, comme -l.
@term argument = Ce que vous donnez à une commande pour qu'elle travaille dessus, par exemple un nom de fichier.

## Un seul arbre

```
/                  la racine : tout part d'ici
├── etc/           fichiers de configuration du système
├── home/          un dossier par utilisateur
│   └── ana/       votre répertoire personnel, aussi noté ~
├── var/
│   └── log/       les journaux : là où les défenseurs regardent d'abord
├── tmp/           fichiers temporaires, modifiables par tous
├── usr/bin/       les programmes que vous lancez
└── root/          le dossier personnel de l'administrateur
```

Inutile de l'apprendre par cœur. Mais vous passerez sans cesse par `/etc`, `/var/log`, `/home` et `/tmp`. Le [Filesystem Hierarchy Standard](https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html) définit le rôle de chacun.

::: why
Tous les utilisateurs peuvent écrire dans `/tmp`, alors les attaquants y déposent souvent leurs outils. `/var/log` contient les preuves, alors les attaquants essaient souvent de le vider. Connaître la carte vous dit où regarder.
:::

?? Sur un serveur Linux compromis, où chercheriez-vous des preuves en premier ?
+ Dans `/var/log`, là où vivent les journaux
- Dans `/usr/bin`, là où sont les programmes
- Dans `/home`, qui contient seulement des photos
- Dans `/etc`, qui contient des dossiers vides
=> Les journaux enregistrent ce qui s'est passé, et c'est pour cela que les attaquants essaient souvent de les effacer.

## Où suis-je, et qu'y a-t-il ici ?

Votre shell se tient toujours dans un répertoire, le **répertoire de travail**. Trois commandes font l'essentiel du travail :

| Commande | Signification | Exemple |
|---|---|---|
| `pwd` | *Print working directory* : où suis-je ? | `pwd` → `/home/ana` |
| `ls` | Lister ce qu'il y a ici | `ls /var/log` |
| `cd` | *Change directory* : aller là-bas | `cd /var/log` |

Les commandes prennent des **options**, qui changent leur comportement, et des **arguments**, qui disent sur quoi travailler :

```
ls -la /var/log
│   │   └── argument : quel répertoire
│   └────── options : -l format long, -a tout afficher
└────────── la commande
```

?? Dans `ls -la /var/log`, quel est l'argument ?
+ `/var/log`, le dossier listé
- `ls`, le programme lui-même
- `-la`, deux options d'affichage
- `-l`, une option d'affichage
=> `ls` est la commande, et `-la` regroupe deux options. L'argument dit sur quoi travailler.

## Deux façons de donner une adresse

Un **chemin** est une adresse. Pensez à un itinéraire en ville :

- **Chemin absolu :** l'adresse postale complète. Il commence par `/` et fonctionne depuis n'importe où : `/home/ana/notes.txt`.
- **Chemin relatif :** « deux portes plus loin ». Il dépend de l'endroit où vous êtes : `notes.txt`, ou `projects/report.txt`.

Trois raccourcis rendent les chemins relatifs puissants :

| Symbole | Signifie |
|---|---|
| `.` | Ce répertoire |
| `..` | Le répertoire du dessus (le parent) |
| `~` | Votre répertoire personnel |

Ainsi, depuis `/home/ana/projects`, `cd ..` vous emmène dans `/home/ana`, et `cd ../../sam` dans `/home/sam`. Un simple `cd` sans rien derrière vous ramène toujours chez vous.

?? Vous êtes dans `/var/log`. Que fait la commande `cd ../tmp` ?
+ Elle vous déplace dans le répertoire /var/tmp
- Elle vous déplace dans le répertoire /tmp
- Elle vous déplace dans /var/log/tmp, en dessous
- Elle échoue, .. ne s'emploie que seul
=> `..` remonte d'un niveau vers `/var`, puis `tmp` descend dans `/var/tmp`. Pour `/tmp`, il faudrait le chemin absolu, ou `cd ../../tmp`.

@drill paths

## Les fichiers cachés

Tout nom qui commence par un point est caché d'un simple `ls`. C'est une convention, pas une protection : `ls -a` montre tout. Les fichiers de configuration s'en servent pour garder votre dossier personnel en ordre, comme `.bashrc` et `.ssh/`. Les attaquants s'en servent pour la même raison : un dossier appelé `.x` dans `/tmp` passe facilement inaperçu.

::: tip Deux habitudes qui vous rendent rapide
Appuyez sur **Tab** pour compléter les noms : vous taperez moins et ferez moins de fautes. Appuyez sur **↑** pour rappeler les commandes précédentes. Les professionnels le font sans arrêt.
:::

?? Mettre un point au début du nom d'un fichier le protège-t-il ?
+ Non, cela le cache juste d'un simple `ls`
- Oui, seul root peut alors ouvrir ces fichiers
- Oui, car le noyau chiffre tous ces fichiers
- Non, car les points sont interdits sous Linux
=> C'est une convention d'affichage, pas une protection. N'importe qui peut le lire, si ses permissions le permettent.

## Les noms avec des espaces

Le shell découpe ce que vous tapez aux espaces : `cat my file.txt` désigne donc deux fichiers, `my` et `file.txt`. Mettez le nom entre guillemets pour le garder entier : `cat "my file.txt"`. Retenez celle-ci : les guillemets comptent bien au-delà des noms de fichiers.

@range navigate

?? Pourquoi `ls` n'affiche-t-il pas `.secret`, alors que `ls -a` le fait ?
+ Les noms qui commencent par un point sont ignorés
- Ses permissions le bloquent dans tous les listings simples
- Le noyau cache ces fichiers à tous les utilisateurs
- Les fichiers cachés sont stockés dans une zone séparée
=> C'est juste une règle d'affichage de `ls`. Il n'y a aucune protection, et c'est pour cela qu'on utilise toujours `ls -a` pendant une enquête.

?! Sans regarder, expliquez la différence entre un chemin absolu et un chemin relatif. Donnez un exemple de situation où seul le chemin absolu est sûr.

## Ce que vous savez faire maintenant

Vous savez parcourir n'importe quelle machine Linux. Ensuite : trouver une ligne parmi un million.

### Aller plus loin

Des sources primaires et le meilleur contenu gratuit sur ce sujet (en anglais), tous vérifiés en novembre 2026 :

- [hier(7), la page de manuel qui décrit chaque répertoire de premier niveau](https://man7.org/linux/man-pages/man7/hier.7.html)
