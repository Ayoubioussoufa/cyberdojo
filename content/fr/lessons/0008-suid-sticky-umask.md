---
title: Les bits spéciaux que traquent les attaquants
summary: SUID, SGID, le sticky bit et umask, pourquoi ils existent, et comment un mauvais choix transforme un utilisateur en root.
builds: traquer les fichiers SUID, en détourner un dans votre lab, puis le corriger
source: credentials(7), sur les UID réels et effectifs (en anglais) | https://man7.org/linux/man-pages/man7/credentials.7.html
words: SUID, sticky bit, élévation de privilèges
---
Voici une énigme. Vous pouvez changer votre propre mot de passe avec `passwd`, et les mots de passe sont stockés dans `/etc/shadow`, que seul root peut écrire. Alors, comment votre programme, lancé par vous, écrit-il dans un fichier réservé à root ?

@term SUID (set-user-ID) = Un bit de permission qui fait tourner un programme avec les droits du propriétaire du fichier, pas de l'appelant.
@term SGID (set-group-ID) = Comme SUID mais pour le groupe. Sur un répertoire, les nouveaux fichiers héritent du groupe du répertoire.
@term sticky bit = Un bit de répertoire qui ne laisse chaque utilisateur supprimer que ses propres fichiers. /tmp l'utilise.
@term umask = Un réglage qui retire des permissions à chaque nouveau fichier que vous créez.
@term UID effectif (euid) = L'identité que le noyau utilise pour les vérifications de permissions sur un processus en cours.
@term élévation de privilèges = Obtenir plus d'accès que ce qui vous a été donné, par exemple passer d'un utilisateur normal à root.

## SUID : emprunter l'identité du propriétaire

Un processus en cours a deux identités : qui l'a **réellement** lancé, et qui il **incarne**. Normalement, ce sont les mêmes. Le [bit SUID](https://man7.org/linux/man-pages/man2/chmod.2.html), le mode 4000, change cela : quand un programme SUID démarre, son UID effectif devient le **propriétaire** du fichier.

```
$ ls -l /usr/bin/passwd
-rwsr-xr-x 1 root root 68208 Mar 14  /usr/bin/passwd
   ↑ le s signifie SUID
```

Le `s` est là où serait le `x` du propriétaire. Quand vous lancez `passwd`, il incarne root, et peut donc mettre à jour `/etc/shadow`. C'est la réponse à l'énigme. Ce n'est sûr que parce que `passwd` est écrit avec grand soin pour faire une seule tâche bien précise.

::: key Pourquoi les attaquants traquent les fichiers SUID
Un programme SUID root est une petite porte vers les droits de root. Si l'on peut amener ce programme à lire n'importe quel fichier ou à lancer n'importe quelle commande, vous obtenez aussi les droits de root. Trouver ces programmes est la première étape de l'élévation de privilèges sous Linux.
:::

La commande de validation de ce mois les trouve tous :

```
find / -perm -4000 -type f 2>/dev/null
```

`-perm -4000` veut dire « ces bits sont posés, quels que soient les autres ». Le `2>/dev/null` masque les erreurs de permission.

@term GTFOBins = Une liste publique de programmes Unix ordinaires qui peuvent être détournés si on leur donne des privilèges supplémentaires.

Vous en trouverez surtout des normaux, comme `passwd`, `sudo` et `mount`. Les intéressants sont inhabituels : quelque chose dans `/usr/local/bin` ou `/opt`. La liste communautaire [GTFOBins](https://gtfobins.github.io/) montre comment des programmes ordinaires peuvent être détournés quand ils ont ce bit. Vous vous en servirez au mois 10, quand vous auditerez ce genre de chose.

?? `find` liste `/usr/bin/passwd` comme SUID root. Est-ce une vulnérabilité ?
+ Non, il lui faut root pour une seule tâche précise et soignée
- Oui, car tout fichier SUID présent sur un système est forcément mauvais
- Oui, car un utilisateur ne devrait jamais changer de mot de passe
- Non, car le bit SUID n'a plus d'effet sur les noyaux modernes
=> Beaucoup de programmes SUID sont attendus. Ce qui compte, c'est de savoir si un programme devrait l'avoir, et s'il peut être détourné.

## SGID et le sticky bit

**SGID (2000)** fait la même chose pour le groupe. Sur un répertoire, c'est plus utile : les nouveaux fichiers à l'intérieur héritent du groupe du répertoire, ce qui fait fonctionner le dossier partagé d'une équipe.

**Le sticky bit (1000)** résout un autre problème. `/tmp` doit être modifiable par tous, mais le droit d'écriture sur un répertoire permet d'y supprimer des fichiers. N'importe qui pourrait donc supprimer les fichiers de n'importe qui. Le sticky bit ajoute une règle : **seul le propriétaire d'un fichier peut le supprimer**.

```
$ ls -ld /tmp
drwxrwxrwt 12 root root 4096 Oct 27 09:00 /tmp
         ↑ le t signifie sticky
```

| Bit | Nombre | S'affiche en | Effet |
|---|---|---|---|
| SUID | 4000 | `s` du propriétaire | Le programme tourne en tant que propriétaire du fichier |
| SGID | 2000 | `s` du groupe | Le programme tourne en tant que groupe ; le répertoire transmet son groupe |
| Sticky | 1000 | `t` des autres | Seul le propriétaire peut supprimer les fichiers à l'intérieur |

Un `S` ou un `T` majuscule signifie que le bit est posé mais que le bit d'exécution en dessous ne l'est pas.

?? Pourquoi `/tmp` a-t-il le sticky bit posé ?
+ Pour empêcher un utilisateur de supprimer les fichiers des autres
- Pour que les fichiers restent là après chaque arrêt système
- Pour que seul root ait réellement le droit d'y écrire
- Pour que tous les programmes y tournent toujours en root
=> Tout le monde peut écrire dans `/tmp`, et le droit d'écriture sur un dossier permet normalement d'y supprimer. Le sticky bit limite cela au propriétaire du fichier.

## umask : le réglage par défaut des nouveaux fichiers

Pourquoi un nouveau fichier est-il en `644` et non en `666` ? À cause du **umask**, qui retire des permissions à tout ce que vous créez. Les nouveaux fichiers partent de 666 et les répertoires de 777, et les bits du umask leur sont retirés.

```
$ umask
0022
```

Avec `022`, les fichiers deviennent 644 et les répertoires 755. Un `077` plus strict donne 600 et 700. C'est un durcissement simple pour un compte qui manipule des données sensibles.

?? Avec umask `027`, quel mode obtient un nouveau répertoire ?
+ 750, car 777 perd les bits masqués
- 640, car un répertoire part de 666
- 027, car le masque devient le mode
- 777, car umask ne touche les fichiers
=> Les répertoires partent de 777. Retirer 027 enlève l'écriture au groupe et tout aux autres, et laisse 750.

@range suid

::: law
Vous venez d'élever des privilèges dans votre propre lab simulé. Sur un système qui ne vous appartient pas, c'est un délit, même si un fichier SUID est « juste là, à traîner ».
:::

?! Expliquez à un développeur pourquoi rendre un script de sauvegarde SUID root est dangereux, et proposez une façon plus sûre.

## Ce que vous savez faire maintenant

Vous savez expliquer SUID, SGID et le sticky bit, ce qui fait partie de la validation, et vous avez parcouru une fois toute la boucle construire-casser-corriger. Ensuite : les processus.
