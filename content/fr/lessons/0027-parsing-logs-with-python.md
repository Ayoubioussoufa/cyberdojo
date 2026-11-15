---
title: Analyser des journaux avec Python
summary: Expressions régulières, fichiers, JSON et CSV, pour transformer un journal désordonné en rapport structuré.
builds: logparse, le premier outil de votre boîte à outils P03
source: Documentation du module re de Python | https://docs.python.org/fr/3/library/re.html
words: expression régulière, JSON, analyseur
---
Dans la leçon 6, vous avez répondu à une question avec un seul pipeline. Et pour dix questions, sur trois formats de journaux, chaque jour, avec des tests ? C'est là qu'on écrit un analyseur.

@term analyseur = Du code qui lit du texte et le transforme en données structurées.
@term JSON = Un format texte pour les données structurées, utilisé par la plupart des API.
@term CSV = Un tableau en texte brut dont les valeurs sont séparées par des virgules.
@term outil en ligne de commande = Un programme que vous lancez depuis la ligne de commande avec des options.
@term argparse = Le module de la bibliothèque standard de Python pour construire des options de ligne de commande.

## Les expressions régulières en Python

Vous avez rencontré `^`, `$`, `.` et `[0-9]`. Le [module `re`](https://docs.python.org/fr/3/library/re.html) de Python ajoute les groupes de capture, qui extraient les parties que vous voulez.

```python
import re

LINE = re.compile(
    r"Failed password for (?:invalid user )?(?P<user>\S+) "
    r"from (?P<ip>\d+\.\d+\.\d+\.\d+) port (?P<port>\d+)"
)

m = LINE.search("sshd[811]: Failed password for root from 203.0.113.7 port 44122 ssh2")
if m:
    print(m.group("ip"))     # 203.0.113.7
```

| Motif | Signification |
|---|---|
| `\d+` | Un ou plusieurs chiffres |
| `\S+` | Un ou plusieurs caractères qui ne sont pas des espaces |
| `(?P<name>...)` | Un groupe de capture nommé |
| `(?:...)?` | Un groupe facultatif, non capturé |
| `r"..."` | Une chaîne brute, où les barres obliques inverses restent telles quelles |

Remarquez `(?:invalid user )?`. Les vrais journaux ont des variantes comme celle-ci, et une expression régulière qui les ignore perd des données en silence.

::: trap Un bug d'analyse silencieux est pire que pas d'outil
Si votre analyseur saute les lignes qu'il ne comprend pas, vos chiffres ont l'air corrects et ils sont faux. Comptez les lignes que vous n'avez pas pu analyser, et signalez ce nombre.
:::

?? À quoi correspond `\d+` dans `port 44122` ?
+ Le nombre entier, soit les cinq chiffres
- Seulement le tout premier chiffre, le `4`
- Le mot `port` suivi d'une seule espace
- Tout jusqu'à la fin de la ligne
=> `\d` est un chiffre et `+` signifie un ou plusieurs, donc il les prend tous.

Écrivez-en une maintenant. `re.search(motif, ligne)` renvoie un objet de correspondance quand le motif est trouvé n'importe où dans la ligne, et `None` sinon. En cas de correspondance, `m.group(0)` est tout le texte qui a correspondu. Un point signifie « n'importe quel caractère » dans une expression régulière, donc un vrai point s'écrit `\.`.

@code extract-ip

## Des lignes à un rapport

```python
from collections import Counter

def parse(path: str) -> tuple[Counter, int]:
    failures: Counter = Counter()
    skipped = 0
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            if "Failed password" not in line:
                continue
            m = LINE.search(line)
            if m:
                failures[m.group("ip")] += 1
            else:
                skipped += 1
    return failures, skipped
```

`errors="replace"` compte : un journal peut contenir n'importe quels octets, y compris des octets contrôlés par un attaquant. `failures.most_common(5)` donne ensuite les cinq premiers. C'est la même logique que votre pipeline, mais elle peut maintenant être testée et étendue.

?? Pourquoi ouvrir un journal avec `errors="replace"` ?
+ Un journal peut contenir n'importe quels octets
- Cela remplace tous les mots de passe
- Cela rend la lecture de fichiers rapide
- Cela corrige l'orthographe dans tous les journaux
=> Les attaquants contrôlent une partie de ce qui est journalisé, donc de mauvais octets ne doivent pas faire planter votre analyseur.

À vous. Écrivez vous-même l'étape de comptage, lancez-la, et regardez les tests passer au vert. Cela exécute du vrai Python dans votre navigateur : rien ne quitte votre machine.

@code count-failed-logins

Maintenant l'étape complète, avec le compteur `skipped` du piège ci-dessus. Un groupe entre parenthèses capture une partie de la correspondance : avec le motif `r"from (\d+\.\d+\.\d+\.\d+)"`, `m.group(1)` est l'adresse seule, sans le mot `from`.

@code failures-by-ip

## Une sortie structurée

Les outils devraient parler dans des formats structurés pour que d'autres outils puissent s'en servir.

```python
import csv, json

print(json.dumps({"top": failures.most_common(5), "skipped": skipped}, indent=2))

with open("report.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["ip", "failures"])
    w.writerows(failures.most_common())
```

?? Pourquoi donner à un outil un mode de sortie JSON ?
+ D'autres outils peuvent le lire
- C'est plus sûr qu'un texte
- Les journaux deviennent plus petits
- Personne ne lit le texte
=> Une sortie structurée, voilà ce qui permet à de petits outils de travailler ensemble.

`json.dumps(valeur)` transforme un dict ou une liste Python en texte JSON. Pour ordonner les paires, `sorted(counts.items(), key=lambda pair: pair[1], reverse=True)` trie selon le second élément de chaque paire, le compteur, du plus grand au plus petit.

@code json-report

## Une vraie interface en ligne de commande

```python
import argparse

def main() -> None:
    ap = argparse.ArgumentParser(description="Summarise failed SSH logins.")
    ap.add_argument("logfile")
    ap.add_argument("--top", type=int, default=5)
    ap.add_argument("--json", action="store_true", help="output JSON")
    args = ap.parse_args()
    ...

if __name__ == "__main__":
    main()
```

`--help` fonctionne maintenant automatiquement, et c'est l'un des points de votre livrable de fin de mois.

?? Pourquoi ajouter un mode de sortie `--json` à un outil de sécurité ?
+ D'autres outils exploitent sa sortie de façon plus fiable
- La sortie JSON rend l'analyseur vraiment nettement plus rapide
- Elle cache les données sensibles à ceux qui lisent
- Les terminaux affichent très mal les rapports en texte
=> La composabilité. Un tableau agréable pour un humain est difficile à analyser, alors que JSON permet à l'outil ou au script suivant d'utiliser vos résultats.

::: try Construisez logparse
Analysez `auth.log` et un journal d'accès web. Signalez les principales IP sources, les noms d'utilisateur les plus visés, les heures inhabituelles et les agents utilisateurs rares. Incluez un compteur `skipped`. Cela fera partie de [P03](/projects/P03/).

Continuez à vous exercer sur de petits motifs avec [regex101](https://regex101.com/), en choisissant la variante Python.
:::

?! Votre analyseur signale zéro échec sur un journal dont vous savez qu'il contient des attaques. Citez trois choses que vous vérifieriez.
