---
title: Utilisateurs, groupes et permissions
summary: Comment Linux décide qui peut faire quoi sur chaque fichier, et comment lire et régler ces permissions.
builds: lire n'importe quelle ligne de ls -l et corriger les problèmes de permissions avec chmod
source: La page de manuel chmod(1) (en anglais) | https://man7.org/linux/man-pages/man1/chmod.1.html
words: propriétaire, groupe, moindre privilège
---
À la leçon 3, vous avez appris que le noyau vérifie chaque demande. Vous allez maintenant voir exactement ce qu'il vérifie. C'est le sujet le plus demandé dans les entretiens techniques de débutant, et la base de tout ce que vous auditerez pour l'élévation de privilèges au mois 10.

@term utilisateur = Une identité sur le système. Le noyau la connaît par un numéro, l'UID.
@term UID = *User ID*, le numéro que le noyau utilise pour identifier un utilisateur.
@term groupe = Un ensemble nommé d'utilisateurs qui partagent l'accès à des fichiers.
@term root (superutilisateur) = Le compte administrateur, d'UID 0, que le noyau autorise à contourner les vérifications de permissions normales.
@term sudo = Une commande qui en lance une autre en tant que root, si vous en avez le droit.
@term permissions (mode) = Les règles d'un fichier qui disent qui peut le lire, le modifier ou l'exécuter.
@term chmod = La commande qui change les permissions d'un fichier.
@term octal = Les nombres en base 8, utilisés comme raccourci pour écrire les permissions, comme 755.

## Qui êtes-vous ?

```
$ id
uid=1000(ana) gid=1000(ana) groups=1000(ana),2001(sec)
```

Vous êtes un **utilisateur**, et pour le noyau, ce n'est qu'un nombre, votre **UID**. Vous appartenez aussi à des **groupes** : des ensembles nommés d'utilisateurs, comme une équipe. `/etc/passwd` liste tous les utilisateurs. Tout le monde peut le lire, mais il ne contient aucun mot de passe. Les empreintes des mots de passe se trouvent dans `/etc/shadow`, que les utilisateurs ordinaires ne peuvent pas lire.

Un compte est spécial. **root** a l'UID 0, et le noyau le laisse contourner les vérifications de permissions habituelles. C'est pourquoi les attaquants le veulent, et pourquoi on ne travaille pas en root au quotidien. Quand vous avez besoin des droits d'administrateur, `sudo commande` les emprunte le temps d'une commande, et note que vous l'avez fait.

::: why Les noms ne comptent pas, les nombres si
Le noyau ne voit que des nombres. Tout compte d'UID 0 *est* root, quel que soit son nom. Ajouter un second compte d'UID 0 est une porte dérobée classique, et votre script d'audit du mois 3 la traquera.
:::

?? Un compte nommé `backup` a l'UID 0. Que peut-il faire ?
+ Tout ce que fait root, car seul le nombre compte
- Seulement des sauvegardes, à cause du nom qu'on lui donne
- Rien pour l'instant, tant qu'on ne l'ajoute pas à `sudo`
- Lire des fichiers, mais il ne pourra jamais les modifier
=> C'est l'UID 0 qui fait root. Le nom n'est qu'une étiquette pour les humains.

## Lire une ligne de permissions

`ls -l` affiche les permissions :

```
-rw-r----- 1 ana sec 1024 Oct 27 09:14 report.txt
│└┬┘└┬┘└┬┘   └┬┘ └┬┘
│ │  │  │     │   └─ groupe
│ │  │  │     └───── propriétaire
│ │  │  └─────────── autres :       ---  rien
│ │  └────────────── groupe :       r--  lecture seule
│ └───────────────── propriétaire : rw-  lecture et écriture
└─────────────────── type :         -  fichier, d répertoire, l lien
```

Trois catégories de personnes, trois droits possibles :

| Lettre | Sur un fichier | Sur un répertoire |
|---|---|---|
| `r` lecture | Voir son contenu | Lister les noms qu'il contient |
| `w` écriture | Modifier son contenu | Créer, supprimer et renommer les fichiers qu'il contient |
| `x` exécution | Le lancer comme un programme | Y entrer et atteindre les fichiers qu'il contient |

::: trap Les répertoires sont différents
Pour supprimer un fichier, il faut le droit d'écriture sur le **répertoire**, pas sur le fichier. Un fichier que vous ne pouvez pas modifier peut quand même être supprimé par quiconque peut écrire dans son dossier. Cela surprend, et c'est important.
:::

?? Dans `-rwxr-x---`, que peut faire un membre du groupe ?
+ Le lire et l'exécuter, mais pas le modifier
- Le lire, le modifier, l'exécuter, comme le propriétaire
- Rien du tout, car c'est un fichier privé
- L'exécuter, mais ils ne peuvent jamais le lire
=> Les trois lettres du milieu sont pour le groupe : `r-x`. Ils peuvent donc le lire et l'exécuter, sans `w`.

## Comment le noyau décide

La vérification est simple, et elle s'arrête à la première correspondance :

@flow Êtes-vous le propriétaire ? bits du propriétaire > Sinon, dans le groupe ? bits du groupe > Sinon, bits des autres

Le noyau **ne passe pas à la catégorie suivante**. Si vous êtes le propriétaire et que les bits du propriétaire disent non, vous êtes refusé, même si les « autres » seraient autorisés.

?? Un fichier est en `----r--r--` et appartient à ana. Ana essaie de le lire. Que se passe-t-il ?
+ Refusé, car seuls les bits du propriétaire comptent
- Autorisé, car les autres ont déjà la lecture
- Autorisé, car le propriétaire lit toujours ses fichiers
- Refusé, car le fichier n'a aucun bit d'exécution
=> Ana est la propriétaire, donc seuls les bits du propriétaire comptent, et ce sont `---`. Ça paraît étrange, mais c'est ainsi que fonctionne la vérification. Ana pourrait cependant faire un `chmod`, puisque le propriétaire contrôle le mode.

@drill perm-who

## Des nombres pour les permissions

Chaque droit a une valeur : **r = 4, w = 2, x = 1**. On les additionne pour chaque catégorie.

| Droits | Somme | Nombre |
|---|---|---|
| `rwx` | 4+2+1 | 7 |
| `rw-` | 4+2 | 6 |
| `r-x` | 4+1 | 5 |
| `r--` | 4 | 4 |
| `---` | 0 | 0 |

Ainsi, `rwxr-x---` vaut **750** : propriétaire 7, groupe 5, autres 0.

@perm rwxr-x---
 Quelques nombres reviennent partout : **644** pour les fichiers ordinaires, **755** pour les programmes et les répertoires, **600** pour les secrets, **700** pour les répertoires privés.

```
chmod 640 report.txt      régler exactement rw-r-----
chmod u+x script.sh       ajouter l'exécution pour l'utilisateur (le propriétaire)
chmod g-w shared.txt      retirer l'écriture au groupe
chmod o= secret.txt       les autres n'ont plus rien
```

Seuls le propriétaire d'un fichier ou root peuvent changer ses permissions. Pour changer le propriétaire, il faut être root : `sudo chown sam fichier`.

@drill rwx-octal

@drill octal-rwx

?? Quelle chaîne de permissions correspond au mode 640 ?
+ `rw-r-----`
- `rwxr-----`
- `rw-rw----`
- `r--r-----`
=> 6 donne `rw-` au propriétaire, 4 donne `r--` au groupe, et 0 donne `---` aux autres.

## Le moindre privilège

Tout ce qui précède sert un seul principe : **donner à chaque personne et à chaque programme exactement l'accès dont ils ont besoin, et rien de plus.** Le NIST définit le [moindre privilège](https://csrc.nist.gov/glossary/term/least_privilege) dans ce sens. Chaque permission que vous retirez est une permission qu'une erreur ou un attaquant ne pourra pas utiliser.

@term moindre privilège = Ne donner à chaque utilisateur et à chaque programme que l'accès nécessaire à sa tâche.

@range perms

?? Quel mode convient à une clé SSH privée ?
+ 600, car seul le propriétaire doit la lire
- 644, car SSH a besoin de la lire
- 755, car toutes les clés doivent être exécutables
- 777, car tout programme peut en avoir besoin
=> SSH refuse d'utiliser une clé que d'autres peuvent lire. Quiconque peut lire une clé privée peut se faire passer pour vous.

?! Vous lancez `cat report.txt` et obtenez `Permission denied`. Listez, étape par étape, comment vous trouveriez pourquoi.

## Ce que vous savez faire maintenant

Vous savez lire n'importe quelle ligne de `ls -l`, raisonner comme le noyau, et corriger des permissions. Viennent ensuite les bits spéciaux que les attaquants traquent en premier.

### Aller plus loin

Des sources primaires et le meilleur contenu gratuit sur ce sujet (en anglais), tous vérifiés en novembre 2026 :

- [credentials(7) : les identifiants d'utilisateur et de groupe, expliqués par le manuel](https://man7.org/linux/man-pages/man7/credentials.7.html)
- [ArchWiki : permissions et attributs des fichiers (aussi en français)](https://wiki.archlinux.org/title/File_permissions_and_attributes)
