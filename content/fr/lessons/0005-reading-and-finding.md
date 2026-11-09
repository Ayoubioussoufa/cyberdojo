---
title: Lire des fichiers et tout retrouver
summary: Lire des fichiers de toute taille, chercher à l'intérieur avec grep, les retrouver avec find, et consulter le manuel au lieu de deviner.
builds: trouver une aiguille dans un journal de 5 000 lignes et localiser n'importe quel fichier sur un disque
source: Manuel de GNU grep (en anglais) | https://www.gnu.org/software/grep/manual/grep.html
words: grep, stdout, stderr
---
Les serveurs n'ont pas de jolie fenêtre qui montre ce qui s'est passé. Ils ont des fichiers texte, parfois longs de millions de lignes. Cette leçon vous donne les outils pour réduire une montagne de texte aux trois lignes qui comptent.

@term grep = Une commande qui n'affiche que les lignes de texte correspondant à un motif.
@term find = Une commande qui cherche des fichiers dans une arborescence par nom, taille, propriétaire et plus encore.
@term page de manuel (man page) = La documentation intégrée d'une commande, qu'on ouvre avec man.
@term stdout (sortie standard) = Le flux où un programme écrit ses résultats normaux.
@term stderr (erreur standard) = Le flux séparé où un programme écrit ses erreurs et ses avertissements.
@term journal (log) = Un fichier où un système enregistre les événements au fil de l'eau.
@term expression régulière (regex) = Un langage de motifs pour reconnaître du texte, utilisé par grep et de nombreux outils.

## Regarder des fichiers

| Commande | Ce qu'elle fait | Quand l'utiliser |
|---|---|---|
| `cat fichier` | Afficher tout le fichier | Fichiers courts |
| `less fichier` | Le faire défiler, `q` pour quitter | Fichiers longs, sur une vraie machine |
| `head -n 20 fichier` | Les 20 premières lignes | Voir le format d'un journal |
| `tail -n 20 fichier` | Les 20 dernières lignes | Voir les entrées les plus récentes |
| `tail -f fichier` | Continuer d'afficher les nouvelles lignes à leur arrivée | Suivre un journal en direct, sur une vraie machine |
| `wc -l fichier` | Compter les lignes | Quelle taille fait-il ? |

?? Un journal compte 2 millions de lignes. Comment vérifier rapidement son format ?
+ `head -n 20 file`
- `sort -r file`
- `wc -l file`
- `grep -c x file`
=> `head` montre les premières lignes sans en afficher des millions. `cat` inonderait votre écran.

## Le manuel : votre première source primaire

Chaque commande standard a une **page de manuel**. Tapez `man grep`. C'est dense, et vous n'avez pas besoin de tout lire : regardez le nom, le synopsis et l'option qui vous intéresse.

::: key Lisez le manuel avant de deviner
La première compétence pratique du parcours est « lire les pages man au lieu de deviner ». Elle compte plus que n'importe quelle commande, car c'est aussi ainsi que vous vérifiez l'IA. Si une IA propose une option, `man` vous dit si elle existe.
:::

?? Une IA propose `grep --deep-scan`. Comment vérifier que cette option existe ?
+ La chercher dans `man grep`
- Redemander à cette même IA
- La tester en production directement
- Chercher sur les réseaux sociaux
=> Le manuel est la source primaire de ce qu'une commande sait faire. Une IA ne peut pas se vérifier elle-même.

## grep : chercher dans les fichiers

`grep` affiche les lignes qui correspondent. C'est tout ce qu'il fait, et c'est l'un des outils les plus utilisés en sécurité.

```
grep "Failed password" /var/log/auth.log     les lignes qui contiennent ce texte
grep -i error app.log                        sans tenir compte des majuscules
grep -v heartbeat app.log                    les lignes qui NE le contiennent PAS
grep -c ALERT app.log                        seulement les compter
grep -n root /etc/passwd                     afficher les numéros de ligne
grep -r password /etc/app                    chercher dans tout un dossier
```

Mettez votre motif entre guillemets quand il contient des espaces. Sinon, le shell le découpe en arguments séparés.

?? Vous voulez chaque ligne de `app.log` sauf les milliers de lignes `heartbeat`. Quelle commande ?
+ `grep -v heartbeat app.log`
- `grep -c heartbeat app.log`
- `grep -i heartbeat app.log`
- `grep -n heartbeat app.log`
=> `-v` inverse la recherche. Retirer le bruit est souvent aussi utile que trouver le signal.

### Un avant-goût des motifs

Le motif de grep est une **expression régulière**, un petit langage pour décrire du texte :

| Motif | Correspond à |
|---|---|
| `^root` | Les lignes qui commencent par root |
| `bash$` | Les lignes qui finissent par bash |
| `[0-9]` | Un chiffre quelconque |
| `.` | Un caractère quelconque |
| `a.*z` | a, puis n'importe quoi, puis z |

Vous irez plus loin au mois 4. Pour l'instant, `^` et `$` vous rendent déjà redoutable : `grep "^root:" /etc/passwd`.

## find : chercher des fichiers

`grep` regarde dans les fichiers. `find` cherche les fichiers eux-mêmes, en descendant dans une arborescence.

```
find /etc -name "*.conf"             par nom, * veut dire n'importe quoi
find /home -type d                   seulement les répertoires
find /var -size +10M                 plus de 10 Mo
find / -user sam                     appartenant à sam
find /opt -name keys.bak -exec cat {} \;     lancer une commande sur chaque résultat
```

La forme est `find OÙ QUOI`. Mettez entre guillemets les noms qui contiennent `*`, pour que ce soit `find` qui reçoive l'étoile et non le shell.

@term joker (glob) = Un * ou un ? dans une commande, que le shell remplace par les noms de fichiers qui correspondent.

?? Quelle commande trouve les fichiers nommés `report.pdf` n'importe où sous `/home` ?
+ `find /home -name report.pdf`
- `grep report.pdf /home`
- `ls report.pdf /home`
- `cat /home/report.pdf`
=> `find` cherche des fichiers d'après leurs propriétés. `grep` cherche le texte à l'intérieur des fichiers, et se plaindrait que `/home` est un répertoire.

## Deux flux de sortie

Lancez `find /` en simple utilisateur et vous verrez des centaines de lignes `Permission denied` mêlées à vos résultats. Voici pourquoi cela se corrige.

Chaque programme a deux flux de sortie séparés. **stdout** transporte les résultats, et **stderr** les erreurs. Les deux s'affichent à l'écran par défaut, mais vous pouvez les rediriger séparément. `2>` veut dire « envoie le flux numéro 2, les erreurs, ailleurs », et `/dev/null` est un fichier spécial qui jette tout ce qu'il reçoit :

```
find / -name pass.txt 2>/dev/null
```

Vous ne voyez plus que les résultats. Vous vous en servirez tous les jours.

@term /dev/null = Un fichier spécial qui jette tout ce qu'on y écrit.

@range find-things

?! Un collègue dit « grep et find font la même chose ». Corrigez-le en deux phrases.

## Ce que vous savez faire maintenant

Vous savez extraire une ligne parmi des milliers et retrouver n'importe quel fichier sur un disque. Ensuite, vous enchaînerez ces outils, et c'est là que commence la vraie puissance.

### Aller plus loin

Des sources primaires et le meilleur contenu gratuit sur ce sujet (en anglais), tous vérifiés en novembre 2026 :

- [La page de manuel find(1)](https://man7.org/linux/man-pages/man1/find.1.html)
- [OverTheWire Bandit, des niveaux construits sur la lecture et la recherche de fichiers](https://overthewire.org/wargames/bandit/)
