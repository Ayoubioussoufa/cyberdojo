---
title: Les tubes : d'un journal à une réponse
summary: Assembler de petits outils en pipelines et répondre en une ligne à une vraie question de SOC.
builds: extraire d'auth.log les adresses IP qui attaquent le plus, une compétence de la validation du mois 1
source: Manuel de référence de Bash, Pipelines et Redirections (en anglais) | https://www.gnu.org/software/bash/manual/bash.html#Pipelines
words: tube, redirection, champ
---
Voici une vraie question posée dans un vrai SOC : *« Quelle adresse IP attaque notre serveur le plus fort ? »* Un débutant ouvre le journal et commence à lire. À la fin de cette leçon, vous y répondrez en une ligne.

@term tube (pipe) = Le symbole |, qui envoie la sortie d'un programme dans l'entrée du programme suivant.
@term redirection = Envoyer la sortie d'un programme dans un fichier, ou lire son entrée depuis un fichier, avec > >> ou <.
@term stdin (entrée standard) = Le flux depuis lequel un programme lit son entrée.
@term champ = Une colonne de texte dans une ligne, en général séparée par des espaces ou un autre caractère.
@term adresse IP = Un nombre qui identifie un appareil sur un réseau, comme 203.0.113.7.
@term force brute (brute force) = Essayer de nombreux mots de passe jusqu'à ce que l'un d'eux fonctionne.

## L'idée Unix

Il y a des décennies, les concepteurs d'Unix ont pris une décision qui façonne encore l'informatique : [écrire des programmes qui font une seule chose et la font bien, et les faire travailler ensemble](https://fr.wikipedia.org/wiki/Philosophie_d%27Unix). Le texte est leur langue commune.

Le **tube**, noté `|`, les relie. Il prend ce qu'un programme affiche et le donne au suivant.

```
grep "Failed password" auth.log | wc -l
```

`grep` garde les lignes qui correspondent, et `wc -l` les compte. Aucun des deux ne connaît l'autre.

?? Que fait le symbole `|` ?
+ Il envoie la sortie d'un programme au programme suivant
- Il écrit la sortie d'un programme dans un fichier
- Il lance plutôt deux programmes sur des ordinateurs différents
- Il arrête un programme qui tourne depuis trop longtemps
=> C'est le tube. Chaque outil fait un seul travail, et le tube les assemble.

## Les outils que vous allez assembler

| Outil | Rôle | Exemple |
|---|---|---|
| `sort` | Mettre les lignes dans l'ordre | `sort -n` numérique, `-r` inversé |
| `uniq` | Fusionner les lignes répétées **voisines** | `uniq -c` ajoute un compte |
| `cut` | Choisir des colonnes selon un séparateur | `cut -d: -f1 /etc/passwd` |
| `awk` | Choisir des colonnes séparées par des espaces | `awk '{print $11}'` |
| `head` / `tail` | Garder les premières ou dernières lignes | `head -5` |
| `wc -l` | Compter les lignes | |
| `tr` | Remplacer ou supprimer des caractères | `tr a-z A-Z` |

::: trap uniq ne compare que les voisines
`uniq` ne connaît pas le fichier entier. Il ne fusionne que les lignes côte à côte, donc vous faites presque toujours `sort` avant. Tout le monde s'y fait prendre une fois.
:::

Voyons-le sur des données. Une ligne d'`auth.log` ressemble à ceci :

```
Oct 27 03:14:15 web1 sshd[811]: Failed password for root from 203.0.113.7 port 44122 ssh2
```

Comptez les mots, séparés par des espaces : `Oct` est le champ 1, et l'IP est le champ **11**. Donc `awk '{print $11}'` l'extrait.

?? Dans la ligne d'`auth.log` ci-dessus, pourquoi `awk '{print $11}'` donne-t-il l'adresse IP ?
+ C'est le onzième mot, en partant de `Oct`
- `awk` sait toujours où se trouvent les adresses
- Le champ 11 est toujours le dernier champ
- `$11` est un nom spécial pour les adresses
=> `awk` découpe une ligne aux espaces et numérote les morceaux. Si le format change, le numéro change aussi : regardez donc d'abord la ligne.

## Construire le pipeline, une étape à la fois

N'écrivez jamais toute la ligne d'un coup. Ajoutez un outil, regardez le résultat, puis ajoutez le suivant.

```
grep "Failed password" auth.log                  garder les échecs
... | awk '{print $11}'                          garder seulement l'IP
... | sort                                       regrouper les IP identiques
... | uniq -c                                    compter chaque groupe
... | sort -rn                                   le plus grand nombre d'abord
... | head -5                                    les cinq premiers
```

Le résultat :

```
     61 203.0.113.7
      9 198.51.100.23
      8 192.0.2.44
```

La forme est toujours la même : **filtrer, extraire, trier, compter, trier, garder le haut.** Retenez la forme, pas les options : elle marche sur les journaux web, DNS, de pare-feu, sur tout.

@flow grep : filtrer > awk : extraire > sort : regrouper > uniq -c : compter > sort -rn : classer > head : le haut

?? Dans ce pipeline, que se passe-t-il si vous retirez le premier `sort` ?
+ Les IP égales ne sont pas voisines, donc comptées séparément
- `uniq` refuse tout simplement de traiter une entrée non triée
- Le dernier `sort` ne peut plus rien ordonner du tout
- Rien ne change, car `uniq` parcourt bien tout le fichier
=> `uniq -c` compte les suites de lignes identiques voisines. Sans tri, une même IP apparaît plusieurs fois avec de petits comptes.

@drill pipeline

## Envoyer la sortie dans un fichier

Les tubes vont vers des programmes. La **redirection** va vers des fichiers.

| Symbole | Signification |
|---|---|
| `> fichier` | Écrire la sortie dans le fichier, en **remplaçant** son contenu |
| `>> fichier` | **Ajouter** à la fin du fichier |
| `< fichier` | Lire l'entrée depuis le fichier |
| `2> fichier` | Écrire les erreurs dans le fichier |
| `2>&1` | Envoyer les erreurs là où va la sortie |

::: trap `>` efface d'abord
Le shell vide le fichier avant même que la commande démarre. `sort log.txt > log.txt` vous laisse un fichier vide. Écrivez plutôt dans un nouveau nom.
:::

?? Vous voulez ajouter vos trouvailles du jour à `notes.txt` sans perdre ce qu'il contient. Quelle commande est juste ?
+ `grep ALERT app.log >> notes.txt`
- `grep ALERT app.log > notes.txt`
- `grep ALERT app.log < notes.txt`
- `grep ALERT app.log | notes.txt`
=> `>>` ajoute à la fin. `>` remplacerait le fichier, `<` lit depuis lui, et `|` attend un programme à droite, pas un fichier.

@range pipes

?! Expliquez le pipeline `grep Failed auth.log | awk '{print $11}' | sort | uniq -c | sort -rn | head -1` à un ami qui n'a jamais vu de terminal.

## Ce que vous savez faire maintenant

Ce pipeline est une vraie compétence de validation, et il marche aussi en entretien. Si vous savez expliquer chaque étape, vous avez compris plus que beaucoup de gens qui se contentent de le copier.

### Aller plus loin

Des sources primaires et le meilleur contenu gratuit sur ce sujet (en anglais), tous vérifiés en novembre 2026 :

- [The Art of Command Line, une visite du shell en une page](https://github.com/jlevy/the-art-of-command-line)
- [Le manuel de Bash : Redirections](https://www.gnu.org/software/bash/manual/html_node/Redirections.html)
