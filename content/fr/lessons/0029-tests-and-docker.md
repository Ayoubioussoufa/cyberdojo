---
title: Tests, empaquetage et Docker
summary: Prouver que votre outil fonctionne avec pytest, l'empaqueter, le mettre en conteneur et le lancer n'importe où.
builds: terminer P03 avec des tests, un Dockerfile et un README qu'un inconnu peut suivre
source: Documentation de pytest (en anglais) | https://docs.pytest.org/
words: test unitaire, conteneur, image
---
Un script de 50 lignes est un jouet. Ajoutez des tests, un empaquetage et un README, et c'est un outil. Cette différence est ce que la feuille de route demande au projet P03.

@term test unitaire = Une petite vérification automatique d'un morceau de code.
@term pytest = Le framework de test Python le plus répandu.
@term fichier de test (fixture) = Une entrée d'exemple gardée avec les tests, pour que les résultats soient reproductibles.
@term Docker = Un outil qui empaquette un logiciel avec ses dépendances dans des conteneurs.
@term image = Un modèle en lecture seule à partir duquel un conteneur démarre.
@term conteneur = Un processus isolé, en cours d'exécution, démarré à partir d'une image.
@term Dockerfile = La recette qui construit une image Docker.
@term compose = Un outil Docker qui lance plusieurs conteneurs ensemble à partir d'un seul fichier.
@term CI (intégration continue) = Lancer automatiquement les tests à chaque changement.

## Les tests le prouvent

```python
# test_logparse.py
from logparse import parse

def test_counts_failures_by_ip():
    failures, skipped = parse("tests/fixtures/auth_small.log")
    assert failures["203.0.113.7"] == 3
    assert skipped == 0

def test_handles_invalid_user_lines():
    failures, _ = parse("tests/fixtures/invalid_user.log")
    assert failures["198.51.100.23"] == 1
```

Lancez `pytest`. Chaque test prépare une petite entrée, exécute votre code et vérifie le résultat. Gardez de petits **fichiers de test** avec des lignes réalistes, y compris les lignes bizarres que vous avez rencontrées.

Si vous n'avez jamais écrit de test, voici ce qui se passe. Un test est une fonction ordinaire dont le nom commence par `test_`. À l'intérieur, `assert` vérifie que quelque chose est vrai : si c'est le cas, rien ne se passe, et sinon le test échoue et pytest vous montre les deux valeurs. Installez pytest dans votre environnement virtuel avec `pip install pytest`, puis lancez `pytest` dans le dossier du projet. Il trouve chaque fichier nommé `test_*.py` et exécute chaque fonction `test_` qu'il contient, sans liste à tenir à jour.

Un fichier de test est simplement un petit fichier texte que vous écrivez à la main. `tests/fixtures/invalid_user.log` pourrait tenir en une ligne :

```
Nov 15 10:14:09 ubuntu-lab sshd[812]: Failed password for invalid user admin from 198.51.100.23 port 51212 ssh2
```

Lisez maintenant ce que pytest affiche quand un test réussit et qu'un autre échoue :

```
$ pytest
========================= test session starts =========================
collected 2 items

test_logparse.py .F                                              [100%]

============================== FAILURES ===============================
__________________ test_handles_invalid_user_lines ___________________

    def test_handles_invalid_user_lines():
        failures, _ = parse("tests/fixtures/invalid_user.log")
>       assert failures["198.51.100.23"] == 1
E       assert 0 == 1

test_logparse.py:10: AssertionError
===================== 1 failed, 1 passed in 0.03s =====================
```

| Partie | Ce qu'elle vous dit |
|---|---|
| `.F` | Un caractère par test : un point a réussi, un `F` a échoué |
| La ligne marquée `>` | Le `assert` exact qui a échoué |
| La ligne marquée `E` | Ce que votre code a donné, et ce que le test attendait : ici 0 échec là où il devrait y en avoir 1 |
| La dernière ligne | Le résumé. C'est la ligne que lit la CI |

L'analyseur a renvoyé 0 pour une ligne qui contient clairement un échec, donc le motif ne gère pas `invalid user`. Le test a trouvé le bug et vous a dit où regarder.

Les bons tests vérifient les bords, pas seulement le cas facile. Pour une fonction qui accepte les ports de 1 à 65535, les entrées intéressantes sont 1, 65535, 0, 65536 et quelque chose qui n'est pas un nombre : les deux extrémités, un pas au-delà de chacune, et n'importe quoi. Dans le défi ci-dessous, c'est vous qui écrivez les vérifications, et elles sont jugées sur leur capacité à repérer des versions boguées de la fonction.

@code spot-the-bugs

::: key Ajoutez un test pour chaque bug
Chaque fois que vous corrigez un bug, écrivez d'abord un test qui échoue à cause de lui. C'est ainsi que vous l'empêchez de revenir. Au mois 8, vous utiliserez la même idée pour prouver qu'un correctif de sécurité fonctionne.
:::

?? Vous trouvez un format de journal que votre analyseur traite mal. Quel est l'ordre professionnel ?
+ Ajouter un test qui échoue, corriger, puis relancer
- Corriger, puis supprimer les anciens fichiers de test
- Ajouter un commentaire pour prévenir de ce format
- Réécrire tout l'analyseur depuis zéro dès ce soir
=> Le test qui échoue prouve que le bug existe, et il continue de vous protéger ensuite.

## Une organisation de projet raisonnable

```
toolkit/
├── README.md
├── pyproject.toml
├── src/toolkit/logparse.py
├── src/toolkit/enrich.py
├── tests/
├── .pre-commit-config.yaml
├── Dockerfile
└── .gitignore
```

`pyproject.toml` est le fichier qui rend le dossier installable. Il nomme le paquet, liste ses dépendances, et dit quelle commande créer :

```toml
[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[project]
name = "toolkit"
version = "0.1.0"
dependencies = ["requests"]

[project.scripts]
logparse = "toolkit.logparse:main"
```

La dernière ligne est la raison pour laquelle vous pouvez taper `logparse` après `pip install .` : elle crée une commande de ce nom qui appelle la fonction `main` de `toolkit/logparse.py`.

Travaillez dans des branches et ouvrez des pull requests, même seul. Ajoutez un workflow [GitHub Actions](https://docs.github.com/fr/actions) qui lance vos tests à chaque push : c'est la **CI**, et le badge vert est une preuve visible.

Le workflow entier tient dans un petit fichier, `.github/workflows/tests.yml` :

```yaml
name: tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.13"
      - run: pip install . pytest
      - run: pytest
```

Lisez-le de haut en bas : à chaque push et à chaque pull request, démarrer une machine Ubuntu neuve, récupérer le code, installer Python, installer votre outil et pytest, et lancer les tests. Cette machine n'a jamais vu votre portable, donc un succès là-bas signifie que le projet contient vraiment tout ce qu'il lui faut.

?? Que fait la CI pour votre projet ?
+ Lance vos tests à chaque push
- Écrit vos tests à votre place
- Stocke vos secrets dans le cloud
- Supprime toutes vos branches déjà terminées
=> Une coche verte signifie que les tests ont réussi sur une machine propre.

## À quoi sert Docker

Vous avez écrit un outil qui fonctionne sur votre portable. Vous l'envoyez à un collègue et il casse : un autre Python, une bibliothèque manquante, le mauvais système d'exploitation. « Ça marche sur ma machine » est la plus vieille plainte du logiciel, et c'est exactement le problème que résout un **conteneur**.

Pensez à un conteneur maritime. Avant eux, les marchandises étaient chargées en vrac, et chaque navire, chaque train et chaque grue les manipulait différemment. Une boîte en acier standard a changé cela : quel que soit le contenu, l'extérieur est identique, donc n'importe quelle grue peut la soulever et n'importe quel navire peut la transporter. Un conteneur logiciel reprend la même idée. Il enveloppe votre outil *et* tout ce dont il a besoin (le bon Python, les bibliothèques, les fichiers) dans une boîte standard qui tourne de la même façon sur votre portable, sur celui de votre collègue, et sur un serveur que vous n'avez jamais vu.

Docker est l'outil qui construit et lance ces boîtes. Vous écrivez une courte recette, le **Dockerfile** ; Docker la transforme en **image**, une boîte figée en lecture seule ; et démarrer l'image vous donne un **conteneur**, une copie en cours d'exécution, isolée du reste de la machine.

?? Que vous apporte le fait de mettre votre outil dans un conteneur ?
+ Il tourne à l'identique sur chaque machine
- Il rend votre code Python plus rapide
- Il cache votre code source aux lecteurs
- Il vous dispense d'écrire le moindre test
=> La boîte transporte tout ce dont l'outil a besoin, donc « ça marche sur ma machine » devient « ça marche partout ».

## Les conteneurs en cinq minutes

Un **conteneur** n'est pas une machine virtuelle. Une VM a un système d'exploitation complet. Un conteneur est un processus isolé qui partage le noyau de l'hôte, il démarre donc en un instant. Une **image** est le modèle, et un conteneur en est une instance en cours d'exécution.

| | Machine virtuelle | Conteneur |
|---|---|---|
| Contient | Un système complet avec son propre noyau | L'application et ses bibliothèques, noyau partagé |
| Démarre en | Quelques minutes | Quelques secondes ou moins |
| Isolation | Forte | Plus faible : une faille du noyau peut compter |
| Sert à | Les labos, l'analyse de malwares | Empaqueter et lancer des applications |

Une machine virtuelle transporte un système d'exploitation entier :

@stack
Application | votre outil et ses bibliothèques |
Système invité | avec son propre noyau |
Hyperviseur | VirtualBox |
Hôte | le matériel et le système hôte |

Un conteneur partage le noyau de l'hôte, et c'est pourquoi il démarre si vite :

@stack
Application | votre outil et ses bibliothèques |
Moteur de conteneurs | Docker |
Hôte | le matériel et le noyau partagé |

```dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY pyproject.toml .
COPY src ./src
RUN pip install --no-cache-dir .
USER nobody
ENTRYPOINT ["logparse"]
```

`USER nobody` signifie que l'outil ne tourne pas en root dans le conteneur : le moindre privilège, encore. Ensuite :

```
docker build -t toolkit .
docker run --rm -v "$PWD/logs:/data:ro" toolkit /data/auth.log
```

`-v` monte un dossier, et `:ro` le met en lecture seule. `--rm` nettoie ensuite. Suivez le [guide de prise en main de Docker](https://docs.docker.com/get-started/) (en anglais) pour apprendre compose, les volumes et le reste.

?? Pourquoi les conteneurs isolent-ils moins fortement que les machines virtuelles ?
+ Ils partagent tous le même noyau de l'hôte
- Ils n'ont aucun système de fichiers à eux
- On ne peut leur appliquer aucune restriction réseau
- Ils tournent toujours en root, par conception même
=> Une VM a son propre noyau. Les conteneurs s'appuient sur celui de l'hôte, donc une faille du noyau peut permettre de s'en évader. Utilisez des VM pour les malwares.

## Le Dockerfile, ligne par ligne

Un Dockerfile se lit de haut en bas, chaque ligne ajoutant une couche à l'image. Voici celui du dessus, expliqué :

- `FROM python:3.13-slim` : partir d'une image officielle qui contient déjà un Python 3.13 allégé. Chaque image se construit *sur* une autre ; celle-ci est votre base.
- `WORKDIR /app` : faire de `/app` le dossier où s'exécutent les commandes suivantes, en le créant si besoin. Comme `cd`, mais valable pour tout le reste de la construction.
- `COPY pyproject.toml .` et `COPY src ./src` : copier des fichiers de votre machine dans l'image. Ne copiez que ce dont l'outil a besoin ; tout le reste reste dehors.
- `RUN pip install --no-cache-dir .` : exécuter une commande *pendant la construction* de l'image, ici l'installation de votre outil. Une ligne `RUN` s'exécute une fois, à la construction.
- `USER nobody` : à partir d'ici, le conteneur tourne sous un utilisateur sans privilège, pas en root. Si un attaquant entre, il démarre sans aucun pouvoir.
- `ENTRYPOINT ["logparse"]` : la commande qui s'exécute quand le conteneur démarre. `RUN` construit l'image ; `ENTRYPOINT` est ce qui tourne réellement à chaque fois.

L'ordre compte pour la vitesse : Docker met chaque ligne en cache, donc placez les parties qui changent rarement (la base, les dépendances) au-dessus de celles qui changent souvent (votre code source), et la plupart des reconstructions restent presque instantanées.

?? Pourquoi terminer un Dockerfile par `USER nobody` ?
+ Pour qu'une évasion démarre sans les droits root
- Pour que l'image se télécharge bien plus vite
- Pour que le conteneur atteigne davantage de fichiers
- Pour que personne ne puisse supprimer l'image construite
=> Tourner en root dans un conteneur est le comportement par défaut, et une faille possède alors tout. Le moindre privilège, encore.

## docker compose : plus d'un service

Un seul conteneur fait rarement toute l'histoire. Une application web a besoin d'une base de données ; un labo a besoin d'une cible faible *et* d'un terminal pour l'attaquer. Lancer et relier plusieurs conteneurs à la main devient vite pénible. **compose** est la solution : un seul fichier, `compose.yaml`, décrit chaque service, et `docker compose up` les démarre tous ensemble.

```yaml
services:
  app:
    build: .
    ports:
      - "127.0.0.1:5000:5000"
```

`build: .` dit à compose de construire l'image à partir du Dockerfile présent ici. `ports` publie un port : `127.0.0.1:5000:5000` relie le port 5000 de localhost sur votre machine au port 5000 du conteneur, et *seulement* localhost, donc rien n'est exposé au réseau. `docker compose up --build` construit et démarre le tout ; `docker compose down` l'arrête et le supprime.

Vous utiliserez exactement cela dans l'[Atelier](/workshop/), où un labo monte avec compose un petit service volontairement faible, lié à `127.0.0.1`, que vous attaquez puis durcissez, le tout sur votre propre machine.

?? À quoi sert docker compose ?
+ Lancer plusieurs conteneurs ensemble à partir d'un fichier
- Faire démarrer un seul conteneur beaucoup plus vite
- Retransformer un conteneur en image, après son arrêt
- Cacher les ports sur lesquels un conteneur écoute
=> Un seul fichier décrit chaque service et leurs liens, et une seule commande les démarre tous.

::: ai Exercice de la feuille de route
Écrivez d'abord l'outil vous-même. Demandez ensuite à un LLM de le relire et d'expliquer chaque suggestion. N'acceptez que les changements que vous savez justifier, et ajoutez un test pour chaque correctif accepté. Notez les bugs trouvés par vos tests, les bugs trouvés par l'IA, et les suggestions de l'IA qui étaient fausses.
:::

## S'y retrouver dans Docker

Avant que le Dockerfile ait un sens, vérifiez que Docker lui-même fonctionne. Après l'avoir installé selon les [instructions de Docker](https://docs.docker.com/engine/install/) (en anglais), lancez le plus petit conteneur qui soit :

```
docker run hello-world
```

Docker cherche l'image `hello-world` sur votre machine, ne la trouve pas, la télécharge, démarre un conteneur à partir d'elle, affiche un message de bienvenue et s'arrête. Cette seule ligne a fait travailler toute la chaîne. Voici les commandes que vous utiliserez ensuite tous les jours :

| Commande | Ce qu'elle montre ou fait |
|---|---|
| `docker ps` | Les conteneurs en cours d'exécution |
| `docker ps -a` | Tous les conteneurs, y compris ceux qui sont arrêtés |
| `docker images` | Les images stockées sur cette machine |
| `docker logs NOM` | Ce qu'un conteneur a affiché |
| `docker exec -it NOM sh` | Ouvre un shell dans un conteneur en cours d'exécution |
| `docker stop NOM` puis `docker rm NOM` | Arrête un conteneur, puis le supprime |
| `docker image rm IMAGE` | Supprime une image |

`docker exec -it NOM sh` est la façon de regarder à l'intérieur de la boîte. Lancez-y `whoami` sur votre propre image et vous devriez voir `nobody`, c'est-à-dire `USER nobody` qui fait ses preuves.

?? `docker ps` ne montre rien, mais `docker ps -a` liste votre conteneur. Qu'est-ce que cela vous apprend ?
+ Le conteneur existe, mais il est arrêté
- L'image a été supprimée de cette machine
- Le conteneur tourne sous le compte root
- Le service Docker lui-même ne tourne pas
=> `ps` liste les conteneurs en cours d'exécution et `-a` ajoute ceux qui sont arrêtés. `docker logs` suivi de son nom dit en général pourquoi il s'est terminé.

?? Vous changez une ligne de `logparse.py` et reconstruisez l'image. Pourquoi la reconstruction est-elle rapide ?
+ Docker réutilise les couches en cache avant le changement
- Docker saute la construction quand les fichiers se ressemblent
- Docker ne reconstruit les images qu'une fois par heure
- Docker compile d'abord le code Python en code machine
=> Chaque ligne du Dockerfile est une couche. Les couches situées avant la première ligne modifiée sont réutilisées, et c'est pourquoi les lignes qui changent rarement passent en premier.

::: try Prouvez qu'il tourne partout
1. Lancez `docker run hello-world` pour confirmer que Docker fonctionne.
2. Construisez votre image avec `docker build -t toolkit .`, puis lancez-la sur un journal de test avec la ligne `docker run` vue plus haut.
3. Démarrez-la avec un shell à la place de l'outil : `docker run --rm -it --entrypoint sh toolkit`. Lancez `whoami` et `ls /app`, puis quittez avec `exit`.
4. Supprimez votre environnement virtuel et relancez l'outil par Docker. Il fonctionne toujours, car l'image transporte son propre Python.
:::

## Le livrable du mois 4

Un outil en ligne de commande avec `--help`, au moins 10 tests qui réussissent, un README et un Dockerfile. Aucun secret dans l'historique Git. Vous savez expliquer chaque ligne dans une présentation de 10 minutes. Au moins 5 petits scripts dans le dépôt, par exemple un scanner de ports avec `socket` et un vérificateur d'empreintes. Voir le [mois 4](/roadmap/4/).

?! Écrivez la section « Démarrage rapide » du README de votre outil, pour qu'un inconnu puisse le lancer en cinq minutes.
