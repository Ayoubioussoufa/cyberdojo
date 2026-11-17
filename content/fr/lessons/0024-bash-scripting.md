---
title: Écrire des scripts Bash
summary: Transformer les commandes que vous connaissez en script, avec des variables, des boucles, des conditions et des codes de sortie, et écrire un audit d'hôte.
builds: un audit.sh sans alerte ShellCheck, avec au moins 8 vérifications
source: Greg's Bash Guide (en anglais) | https://mywiki.wooledge.org/BashGuide
words: variable, code de sortie, guillemets
---
Tout ce que vous tapez deux fois, vous devriez en faire un script. Les scripts ne se fatiguent pas, n'oublient pas d'étapes, et transforment « j'ai vérifié le serveur » en une preuve que vous pouvez relancer.

@term script = Un fichier texte de commandes que le shell exécute dans l'ordre.
@term shebang = La première ligne #! d'un script, qui nomme le programme chargé de l'exécuter.
@term variable = Une valeur nommée qu'un script peut stocker et réutiliser.
@term code de sortie = Le nombre qu'une commande renvoie quand elle se termine. 0 signifie succès.
@term ShellCheck = Un outil qui trouve les bugs dans les scripts shell.

## Votre premier script

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "Audit of $(hostname) on $(date)"
```

Enregistrez-le sous le nom `audit.sh`, lancez `chmod u+x audit.sh`, puis `./audit.sh`. La première ligne, le **shebang**, dit quel interpréteur utiliser.

Si vous n'en avez jamais créé, voici chaque étape. Ouvrez un éditeur avec `nano audit.sh`, tapez les lignes ci-dessus, enregistrez avec Ctrl+O puis Entrée, et quittez avec Ctrl+X. Un script est un fichier texte ordinaire : rien ne le rend spécial tant que vous ne l'autorisez pas à s'exécuter, et c'est ce que fait `chmod u+x`, comme vous l'avez vu dans la leçon sur les permissions. Oubliez cette étape et le shell répond `Permission denied`.

Le `./` devant compte aussi. Le shell ne cherche les commandes que dans les dossiers listés dans `$PATH`, et votre dossier courant n'en fait pas partie, donc vous donnez le chemin vous-même : « le fichier `audit.sh`, ici même ».

Dans le `echo`, `$(hostname)` signifie « lance `hostname` et mets ce qu'il affiche à cet endroit ». La ligne affiche donc quelque chose comme `Audit of ubuntu-lab on Sun Nov 15 10:02:11 CET 2026`.

La ligne suivante est un filet de sécurité, et vous devriez l'utiliser dans chaque script :

| Option | Effet |
|---|---|
| `-e` | S'arrêter si une commande échoue |
| `-u` | S'arrêter sur une variable non définie, ce qui est en général une faute de frappe |
| `-o pipefail` | Un pipeline échoue si l'une de ses étapes échoue, pas seulement la dernière |

### Terminal, shell et Bash

Trois mots se mélangent, alors fixons-les une fois pour toutes. Le **terminal** est la fenêtre dans laquelle vous tapez ; il ne fait qu'afficher du texte. Le **shell** est le programme, à l'intérieur, qui lit ce que vous tapez et l'exécute. **Bash** est un shell particulier, le plus courant sous Linux. `sh` est un langage de shell plus ancien et plus petit, que Bash comprend ; mais sous Debian et Ubuntu, `sh` est un autre programme, `dash`, qui ne connaît pas les ajouts de Bash comme `[[ ]]`. Voilà pourquoi un script Bash commence par un shebang Bash et se lance avec `./audit.sh` ou `bash audit.sh`, jamais `sh audit.sh`. `echo "$SHELL"` affiche votre shell de connexion.

### Ce qui se passe quand vous appuyez sur Entrée

Le shell fait les mêmes étapes pour chaque ligne, dans l'ordre, et les connaître explique la plupart des surprises :

1. Il remplace ce qu'il peut : `$name` par la valeur de la variable, `$(commande)` par ce qu'affiche la commande, et des motifs comme `*.log` par les noms de fichiers qui correspondent.
2. Il découpe le résultat en mots aux espaces, sauf entre guillemets. C'est cette étape qui casse `rm $file` quand le nom contient une espace.
3. Il cherche le premier mot. Une **commande interne** (*builtin*) comme `cd` ou `echo` fait partie du shell lui-même ; tout le reste est cherché dans chaque dossier de `$PATH`, dans l'ordre. `type` vous dit ce que vous obtiendrez :

```
$ type cd ls
cd is a shell builtin
ls is /usr/bin/ls
```

4. Il lance la commande, attend, et garde son code de sortie dans `$?`. Un premier mot qui n'est ni une commande interne ni dans `$PATH` donne `lsit: command not found`, ce qui veut presque toujours dire une faute de frappe ou un paquet manquant.

?? Que fait `set -e` ?
+ Il arrête le script en cas d'échec
- Il chiffre le script sur le disque
- Il lance tout le script en root
- Il cache les erreurs affichées à l'écran
=> Sans lui, un script continue après une commande en échec, et peut faire des dégâts.

## Variables et guillemets

```bash
name="ana"
log_file="/var/log/auth.log"
count=$(grep -c "Failed" "$log_file")     # capturer la sortie d'une commande
echo "Failures: $count"
```

Il n'y a pas d'espace autour de `=`. `$(...)` lance une commande et capture ce qu'elle affiche.

Un script peut aussi recevoir des valeurs depuis la ligne de commande. Si vous lancez `./audit.sh /var/log/auth.log 5`, alors dans le script `$1` vaut `/var/log/auth.log`, `$2` vaut `5`, `$#` est le nombre d'arguments (ici 2) et `$0` est le nom du script lui-même.

```bash
log_file="${1:-/var/log/auth.log}"    # le premier argument, ou cette valeur par défaut s'il n'y en a pas
```

`${1:-quelque_chose}` se lit « utilise `$1`, et s'il est vide ou absent, utilise `quelque_chose` ». Cela évite que `set -u` arrête le script quand quelqu'un le lance sans argument.

::: trap Mettez toujours vos variables entre guillemets
Écrivez `"$file"`, pas `$file`. Sans guillemets, une valeur qui contient un espace se découpe en plusieurs arguments. Avec une valeur comme `*`, elle se développe en tous les fichiers. Les variables sans guillemets sont le bug Bash le plus courant, et quand un script traite une entrée non fiable, c'est un bug de sécurité.
:::

?? `file="my notes.txt"`, puis `rm $file` s'exécute. Que se passe-t-il ?
+ Il tente de supprimer `my` et `notes.txt`
- Il supprime le seul fichier `my notes.txt`
- Il refuse de tourner sans variables définies
- Il supprime tous les fichiers du dossier
=> La variable sans guillemets se découpe sur l'espace, ce qui donne deux arguments. `rm "$file"` en passe un seul.

## Codes de sortie et conditions

Chaque commande renvoie un nombre : **0 signifie succès**, toute autre valeur signifie échec. `$?` contient le dernier. `if` teste ce nombre :

```bash
if grep -q "PermitRootLogin yes" /etc/ssh/sshd_config; then
    echo "FAIL: root login is enabled"
else
    echo "PASS: root login is off"
fi

if [[ -f /etc/passwd ]]; then echo "file exists"; fi
if [[ "$count" -gt 10 ]]; then echo "many failures"; fi
```

| Test | Vrai quand |
|---|---|
| `-f fichier` | C'est un fichier ordinaire |
| `-d dossier` | C'est un dossier |
| `-z "$x"` | La chaîne est vide |
| `"$a" == "$b"` | Les chaînes sont égales |
| `"$a" -gt "$b"` | Le nombre a est plus grand |

Vous pouvez observer les codes de sortie dans votre propre terminal. Lancez une commande, puis demandez `$?` aussitôt :

```
$ ls /etc/passwd
/etc/passwd
$ echo $?
0
$ ls /nope
ls: cannot access '/nope': No such file or directory
$ echo $?
2
```

Deux formes courtes utilisent le même nombre. `a && b` ne lance `b` que si `a` a réussi, et `a || b` ne lance `b` que si `a` a échoué :

```bash
mkdir -p reports && echo "reports folder is ready"
grep -q "^ana:" /etc/passwd || echo "no account called ana"
```

Notez que `[[ … ]]` est lui-même une commande. Il n'affiche rien et renvoie 0 quand le test est vrai, et c'est la seule raison pour laquelle `if` peut l'utiliser.

### Quand un script refuse de tourner

Voici les messages que tout le monde rencontre la première semaine, tels que Bash les affiche :

| Vous voyez | Cela veut dire | Faites ceci |
|---|---|---|
| `./audit.sh: Permission denied` | Le fichier n'est pas exécutable | `chmod u+x audit.sh` |
| `lsit: command not found` | Aucune commande interne et rien dans `$PATH` de ce nom | Vérifiez l'orthographe, ou installez l'outil |
| `/bin/bash^M: bad interpreter: No such file or directory` | Le fichier a des fins de ligne Windows : le shebang se termine par un `\r` invisible | Convertissez-le avec `sed -i 's/\r$//' audit.sh`, ou enregistrez en LF dans votre éditeur |
| `nmae: unbound variable` | `set -u` a attrapé une variable jamais définie, ici une faute de frappe | Corrigez le nom, ou donnez une valeur par défaut avec `${name:-...}` |
| `syntax error: unexpected end of file from 'if' command on line 2` | Un bloc ouvert n'a jamais été fermé : ici un `if` sans `fi` | Fermez chaque `if` par `fi`, `do` par `done`, `case` par `esac` |
| `[[: not found` | Le script a été lancé par `sh`, qui n'est pas Bash | Lancez-le avec `./audit.sh` ou `bash audit.sh` |

Les versions plus anciennes de Bash disent seulement `unexpected end of file`, sans nommer le `if` : la cause est la même.

?? Quel code de sortie signifie succès ?
+ Zéro, et toute autre valeur signale un échec
- Un, et zéro signifie alors tout le contraire
- N'importe quel nombre positif strictement inférieur à cent
- Seulement le mot OK écrit dans le texte
=> `if` teste ce nombre, et c'est pourquoi `grep -q` fonctionne dans un `if`.

## Boucles et fonctions

```bash
check_port() {
    local port="$1"
    if ss -tln | grep -q ":$port "; then
        echo "OPEN: $port"
    fi
}

for port in 21 23 3306; do
    check_port "$port"
done

while IFS=: read -r user _ uid _; do
    if [[ "$uid" -eq 0 ]]; then
        echo "UID 0 account: $user"
    fi
done < /etc/passwd
```

`local` garde une variable à l'intérieur de la fonction. `IFS=:` découpe chaque ligne sur les deux-points. `read -r` empêche que les barres obliques inverses soient abîmées.

Lisez la boucle `for` comme une phrase : « pour chaque valeur de la liste `21 23 3306`, mets-la dans `port` et exécute les lignes entre `do` et `done` ». Elle tourne trois fois. Dans la fonction, `$1` est le premier argument donné à la fonction, pas au script, donc `check_port 21` met 21 dans `port`.

La boucle `while` lit un fichier ligne par ligne. Une ligne de `/etc/passwd` ressemble à `root:x:0:0:root:/root:/bin/bash`, avec sept champs séparés par des deux-points. `read -r user _ uid _` met le premier champ dans `user`, jette le deuxième dans `_`, met le troisième dans `uid`, et met tout ce qui reste dans le dernier `_`. Le `< /etc/passwd` après `done` est ce qui envoie le fichier dans la boucle.

Quand un script fait quelque chose d'inattendu, lancez-le avec `bash -x audit.sh`. Bash affiche alors chaque commande, avec ses variables déjà remplacées, juste avant de l'exécuter. La plupart des bugs deviennent évidents dès que vous voyez la vraie commande.

### Ce que montre `bash -x`

Voici un script de trois lignes et sa trace :

```bash
#!/usr/bin/env bash
file="my notes.txt"
count=$(wc -l < /etc/hostname)
echo "$file has $count lines"
```

```
+ file='my notes.txt'
++ wc -l
+ count=1
+ echo 'my notes.txt has 1 lines'
my notes.txt has 1 lines
```

Chaque ligne `+` est une commande juste avant son exécution, avec les variables déjà remplacées, et `++` marque une commande lancée à l'intérieur de `$(...)`. Les guillemets que Bash ajoute montrent exactement où commence et finit chaque argument : c'est ainsi qu'un problème de guillemets se trahit.

### ShellCheck, un second regard

ShellCheck lit un script sans l'exécuter et montre les lignes qui vont mordre. Donnez-lui un script qui contient `rm $file` :

```
In audit.sh line 3:
rm $file
   ^---^ SC2086 (info): Double quote to prevent globbing and word splitting.

Did you mean:
rm "$file"
```

Chaque avertissement porte un code comme `SC2086`, et chaque code a une page sur le wiki de ShellCheck qui explique le problème avec des exemples. Installez-le avec `sudo apt install shellcheck`, passez-le sur chaque script que vous écrivez, et traitez un avertissement que vous ne comprenez pas comme une leçon, pas comme du bruit.

?? `grep -q root file` n'affiche rien. Comment un script sait-il s'il y a eu une correspondance ?
+ Il vérifie le code de sortie, 0 pour trouvé
- Il lit la sortie, qui est pourtant toujours vide
- Il compte toutes les lignes affichées par la commande
- Il ne peut pas, donc `-q` est à éviter
=> `-q` signifie silencieux : pas de sortie, seulement le code de sortie. C'est exactement ce que teste `if`.

## Une vérification, construite proprement

Chaque vérification d'un audit a la même forme : regarder une chose, afficher PASS ou FAIL, et retenir si quelque chose a échoué. Écrivez cette forme une fois sous forme de fonction et chaque nouvelle vérification tient en une ligne.

```bash
#!/usr/bin/env bash
set -euo pipefail

fails=0

check() {
    local name="$1"
    shift
    if "$@" > /dev/null 2>&1; then
        echo "PASS: $name"
    else
        echo "FAIL: $name"
        fails=$((fails + 1))
    fi
}

check "passwd is a regular file" test -f /etc/passwd
check "no telnet service listening" bash -c '! ss -tln | grep -q ":23 "'

echo "$fails check(s) failed"
[[ "$fails" -eq 0 ]]
```

Ligne par ligne : `check` prend un nom puis une commande. `shift` retire le nom, de sorte que `"$@"` est la commande avec tous ses arguments, chacun encore protégé par ses guillemets. `> /dev/null 2>&1` jette ce que la commande affiche, car seul son code de sortie compte ici. La dernière ligne du script est un test, donc le script lui-même sort avec 0 quand rien n'a échoué et 1 dans le cas contraire. Un autre programme, par exemple une tâche planifiée, peut alors réagir à votre audit sans lire son texte.

::: trap Un compteur qui tue votre script
Beaucoup de guides comptent avec `((fails++))`. Sous `set -e`, cette ligne arrête votre script dès sa première exécution : `((…))` renvoie un code d'échec chaque fois que son résultat vaut 0, et `fails++` donne l'ancienne valeur, qui est 0. Écrivez `fails=$((fails + 1))`, qui est une affectation et réussit toujours.
:::

?? Dans la fonction `check`, pourquoi le script utilise-t-il `"$@"` et non `$*` ?
+ Chaque argument reste entier, même avec des espaces
- Cela lance la commande avec les droits root
- Cela cache tout ce que la commande affiche
- Cela rend la fonction nettement plus rapide ensuite
=> `"$@"` se développe en arguments pris un par un, chacun entre guillemets. `$*` les colle puis les redécoupe sur les espaces, ce qui est le bug de guillemets vu plus haut.

?? Le script d'audit se termine par `[[ "$fails" -eq 0 ]]`. À quoi sert cette dernière ligne ?
+ Elle fixe le code de sortie du script
- Elle affiche le nombre de vérifications en échec
- Elle remet le compteur de nouveau à zéro
- Elle empêche le script de tourner deux fois
=> Un script sort avec le code de sa dernière commande. Finir sur le test fait réussir ou échouer l'audit entier d'un seul bloc.

## Exercez-vous aux vérifications

Voici les vérifications d'audit que vous mettrez dans votre script. Faites d'abord chacune à la main.

@range audit

## Construisez audit.sh

::: try Votre script de fin de mois
Écrivez `audit.sh` avec au moins 8 vérifications, chacune affichant PASS ou FAIL : les comptes d'UID 0 autres que root ; les fichiers SUID ; les chemins modifiables par tous ; les ports en écoute ; la connexion SSH en root ; l'authentification SSH par mot de passe ; les membres du groupe sudo ; les mises à jour en attente.

Lancez ensuite [ShellCheck](https://www.shellcheck.net/) jusqu'à ce qu'il ne signale plus rien : `shellcheck audit.sh`.
:::

::: ai Exercice de la feuille de route
Demandez à un LLM de relire votre script à la recherche de bugs et de risques d'injection, puis lancez ShellCheck et comparez. Quels problèmes l'IA a-t-elle manqués ? Lesquels a-t-elle inventés ? Notez les deux dans votre journal d'IA.
:::

?! Pourquoi un script qui cherche « PermitRootLogin no » avec grep dans le fichier `sshd_config` brut n'est-il pas fiable ? Comment le corrigeriez-vous ?

### Pour aller plus loin

Les sources primaires et le meilleur matériel gratuit sur ce sujet, tous vérifiés en novembre 2026 (en anglais) :

- [Guide de style shell de Google](https://google.github.io/styleguide/shellguide.html)
