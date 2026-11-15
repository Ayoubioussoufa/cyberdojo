---
title: Python depuis zéro
summary: Variables, listes, boucles, fonctions et environnements virtuels, avec une tâche de sécurité comme fil conducteur.
builds: un petit script qui signale les mots de passe faibles d'une liste
source: Le tutoriel Python, officiel | https://docs.python.org/fr/3/tutorial/
words: variable, fonction, environnement virtuel
---
Bash est parfait pour coller des commandes ensemble. Quand un travail grossit, avec de vraies structures de données, des API et des tests, on passe à Python. C'est le langage de script le plus demandé dans les offres d'emploi en sécurité, et c'est ce qui sépare les juniors qui montent en puissance des juniors qui cliquent.

@term Python = Un langage de programmation généraliste et lisible, très utilisé pour automatiser la sécurité.
@term liste = Une collection ordonnée de valeurs en Python, écrite entre crochets.
@term dictionnaire (dict) = Une collection de paires clé et valeur en Python.
@term fonction = Un bloc de code nommé et réutilisable.
@term boucle = Du code qui se répète, une fois par élément ou tant qu'une condition est vraie.
@term module = Un fichier Python que vous pouvez importer pour réutiliser son code.
@term environnement virtuel (venv) = Un dossier privé de paquets Python pour un seul projet.
@term exception = Une erreur levée pendant l'exécution d'un programme, que le code peut intercepter.

## Lancer quelque chose

Python lit un fichier de haut en bas et fait ce qui est écrit. Créez `hello.py` :

```python
name = "Ana"
attempts = 3
print(f"Hello {name}, you have {attempts} attempts left.")
```

Lancez-le avec `python3 hello.py`. Le `f` devant les guillemets vous permet de placer des valeurs entre `{}`.

?? Que fait le `f` dans `f"Hello {name}"` ?
+ Il insère des valeurs dans le texte
- Il enregistre le texte dans des fichiers
- Il rend le texte bien plus rapide
- Il corrige toute l'orthographe dans le texte
=> C'est une f-string : tout ce qui est entre `{}` est remplacé par sa valeur.

À vous. Le cadre ci-dessous exécute du vrai Python dans votre navigateur, et rien ne quitte votre machine. Écrivez la fonction, appuyez sur Lancer, et lisez les tests : chacun vous dit ce qu'il attendait.

@code greet-user

## Les types que vous utiliserez sans cesse

```python
count = 42                              # int : un nombre entier
ratio = 0.75                            # float : un nombre à virgule
ip = "203.0.113.7"                      # str : du texte
blocked = True                          # bool : vrai ou faux
ips = ["10.0.0.1", "10.0.0.2"]          # list : ordonnée
hits = {"10.0.0.1": 3, "10.0.0.2": 9}   # dict : clé vers valeur
seen = {"root", "admin"}                # set : valeurs uniques
```

Un **dict** est la bête de somme de l'analyse de journaux : `hits[ip]` retrouve instantanément le compteur d'une IP.

?? Vous voulez compter combien de fois chaque IP apparaît. Quelle structure convient le mieux ?
+ Un dict qui associe chaque IP à un compteur
- Une liste qui contient tous les compteurs dans l'ordre
- Une chaîne où toutes les adresses sont collées ensemble
- Un booléen qui note chaque nouvelle adresse rencontrée ici
=> Un dict vous donne un accès direct par clé. Python a même `collections.Counter`, fait exactement pour cela.

Deux gestes couvrent l'essentiel de ce que vous ferez avec un dict. `hits[ip] = 1` range une valeur sous une clé. `hits.get(ip, 0)` lit la valeur d'une clé, et vous donne `0` quand la clé n'existe pas encore, au lieu de s'arrêter sur une `KeyError`. Réunis, `hits[ip] = hits.get(ip, 0) + 1` signifie « ajoute un au compteur de cette IP, en partant de zéro la première fois ».

Pour parcourir chaque élément d'une liste, écrivez `for ip in ips:` et indentez les lignes qui doivent s'exécuter pour chacun. La section suivante explique la boucle elle-même ; ici, vous n'avez besoin que de cette ligne.

@code count-hits

## Décisions et boucles

Python utilise l'**indentation** pour regrouper le code. Ces espaces ne sont pas de la décoration : ils sont la structure.

```python
for ip, n in hits.items():
    if n >= 5:
        print(f"{ip} looks like brute force ({n} attempts)")
    elif n > 1:
        print(f"{ip} worth a look")
    else:
        print(f"{ip} is fine")
```

?? Que fait l'indentation en Python ?
+ Elle regroupe le code en blocs
- Elle rend juste le code joli
- Elle fixe la taille du fichier
- Elle marque des lignes comme commentaires
=> Ces espaces sont la structure. Une mauvaise indentation change ce que fait le programme.

Python vérifie les conditions de haut en bas et exécute la première branche qui est vraie, puis saute le reste. L'ordre compte donc : testez d'abord la condition la plus stricte.

@code classify-attempts

## Fonctions

Une **fonction** donne un nom à un morceau de logique pour que vous puissiez le tester et le réutiliser. Mettez la logique dans des fonctions dès le début.

```python
def is_weak(password: str) -> bool:
    """Return True if the password fails our basic rules."""
    if len(password) < 12:
        return True
    return password.lower() in {"password123456", "qwertyuiop123"}

print(is_weak("hunter2"))    # True
```

Les `: str` et `-> bool` sont des annotations de type : elles ne changent pas le comportement, mais elles documentent l'intention et des outils peuvent les vérifier. La ligne entre triples guillemets est une docstring.

?? Pourquoi mettre la logique dans des fonctions dès le début ?
+ Vous pouvez la tester et la réutiliser
- Python refuse tout code placé en dehors
- Les fonctions tournent toujours bien plus vite
- Elles cachent le code aux autres personnes
=> Des petits morceaux nommés, voilà ce qui rend les tests possibles.

Une chaîne est une suite de caractères, donc `for ch in password:` les parcourt un par un, et `ch.isdigit()` vaut `True` quand ce caractère est un chiffre. C'est tout ce qu'il vous faut pour le défi suivant.

@code is-weak-password

## Gérer les erreurs

Les vraies données sont désordonnées. Les **exceptions** vous permettent de gérer les problèmes au lieu de planter :

```python
try:
    with open("auth.log") as f:
        lines = f.readlines()
except FileNotFoundError:
    print("No log file found")
```

`with open(...)` ferme le fichier pour vous, même si quelque chose échoue.

?? Que vous permettent de faire `try` et `except` ?
+ Gérer un problème sans faire planter le programme
- Empêcher toute erreur de se produire un jour
- Cacher le code aux yeux de chaque attaquant
- Exécuter le même code deux fois en parallèle
=> Les vraies données sont désordonnées, donc un bon outil s'attend aux problèmes et les gère.

Le même schéma protège toute conversion. `int("22")` donne le nombre 22, mais `int("ssh")` lève une `ValueError`, car le texte n'est pas un nombre. Un texte qui vient d'un fichier, d'un formulaire ou d'un journal n'est jamais garanti conforme à ce que vous attendez, donc vous convertissez dans un `try` et vous décidez quoi renvoyer en cas d'échec.

@code parse-port

## Environnements virtuels

Des projets différents ont besoin de versions de paquets différentes. Un **environnement virtuel** donne à chacun son propre dossier.

```
python3 -m venv .venv
source .venv/bin/activate
pip install requests
pip freeze > requirements.txt
```

Ajoutez `.venv/` à `.gitignore`. N'installez jamais de paquets au hasard pour tout le système, et souvenez-vous de l'avertissement du guide sur l'IA dans le Manuel : [vérifiez qu'un paquet existe et qui le publie](/guides/d3-using-ai-well/) avant de l'installer.

?? Pourquoi utiliser un environnement virtuel pour chaque projet ?
+ Chaque projet garde ses propres versions de paquets
- Il chiffre sur disque le code du projet
- Il rend l'interpréteur Python vraiment nettement plus rapide
- Il permet au projet de tourner sans Python
=> L'isolation évite les conflits de versions et rend un projet reproductible à partir de `requirements.txt`.

## Tout assembler

Un dernier défi utilise tout ce qui précède : une fonction, une boucle, des décisions et une conversion. Deux outils pour les chaînes vous aident. `"10.0.0.1".split(".")` coupe le texte à chaque point et donne la liste `["10", "0", "0", "1"]`. `"10".isdigit()` vaut `True` quand chaque caractère est un chiffre, vous pouvez donc vérifier un morceau avant d'appeler `int()` dessus. `len(parts)` vous dit combien de morceaux vous avez obtenus.

Valider une entrée de cette façon est une habitude de sécurité, pas un exercice : un outil qui accepte `999.1.1.1` ou une chaîne vide comme adresse passera n'importe quoi à ce qui s'exécute ensuite.

@code is-valid-ip

::: try Votre premier outil
Écrivez `weakpass.py`. Il lit un fichier de mots de passe, un par ligne, et affiche combien échouent à vos règles. Utilisez des mots de passe inventés, jamais des vrais. Lisez ensuite le [tutoriel Python](https://docs.python.org/fr/3/tutorial/) jusqu'au chapitre 5. Si vous voulez un cours structuré, [CS50P](https://cs50.harvard.edu/python/) (en anglais) est excellent.
:::

?! Expliquez la différence entre une liste et un dict, et donnez une tâche de sécurité où chacun est le bon choix.
