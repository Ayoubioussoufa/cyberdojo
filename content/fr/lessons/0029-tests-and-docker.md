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

### Cinq mots à connaître d'abord

Docker a son propre vocabulaire, et la suite de cette leçon l'emploie sans arrêt. Une cuisine aide : pensez à un plat préparé.

- **Dockerfile** : la *recette*, un court fichier texte qui liste les étapes pour préparer le plat. C'est vous qui l'écrivez.
- **Image** : le *plat préparé, au congélateur*. Docker suit la recette une fois et congèle le résultat : un ensemble complet de dossiers et de fichiers (un Python, les bibliothèques, votre code), plus une note qui dit quelle commande lancer. Une image ne change plus une fois construite.
- **Conteneur** : *une portion, réchauffée et servie*. Démarrer une image donne une copie qui tourne. On peut servir autant de portions qu'on veut du même plat, et ce qui arrive à une portion ne touche pas au plat congelé.
- **Registre** : le *supermarché*, une bibliothèque en ligne d'images toutes prêtes. Docker Hub est le registre par défaut, et c'est de là que vient `python:3.13-slim`.
- **Tag** : *l'étiquette sur la boîte*, la partie après les deux-points qui choisit une version. `python:3.13-slim`, c'est Python 3.13, édition allégée. Sans tag, Docker suppose `latest`, qui change avec le temps : écrivez donc toujours le tag.

### Ce qui se passe quand vous tapez `docker run`

Une seule commande fait beaucoup de travail, et connaître les étapes rend chaque message d'erreur plus facile à lire :

1. La commande `docker` que vous tapez n'est qu'une messagère. Elle transmet votre demande au **démon Docker**, `dockerd`, un service d'arrière-plan qui fait le vrai travail.
2. Le démon cherche l'image sur votre machine. Si elle n'y est pas, il la télécharge depuis le registre, une couche après l'autre.
3. Il crée un conteneur : une fine couche modifiable posée sur les couches de l'image, qui, elles, sont en lecture seule. Les fichiers que le conteneur modifie atterrissent dans cette fine couche, si bien que l'image elle-même n'est jamais modifiée.
4. Il isole le conteneur : sa propre liste de processus, sa propre adresse réseau, son propre nom d'hôte, et les fichiers de l'image pour tout univers.
5. Il lance la commande de l'image comme **processus principal** du conteneur.
6. Quand ce processus se termine, le conteneur s'arrête. Il n'est pas supprimé, sauf si vous avez demandé `--rm` : il attend, arrêté, et `docker ps -a` le liste encore.

Un fait de sécurité a sa place ici. Le démon tourne en root, donc quiconque peut lui donner des ordres peut lancer un conteneur qui monte tout le disque. Les membres du groupe `docker`, et tout programme qui peut atteindre le fichier `/var/run/docker.sock`, sont donc root sur cette machine, sauf de nom.

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

Voici un Dockerfile pour l'outil d'analyse de journaux que vous avez écrit ce mois-ci. N'essayez pas encore de comprendre chaque ligne : la section suivante le démonte, ligne par ligne.

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

### Comment fonctionne l'isolation

Il n'y a pas de second système d'exploitation dans un conteneur. Le noyau Linux offre deux mécanismes, et Docker les combine :

- Les **espaces de noms** (*namespaces*) décident de ce qu'un processus peut *voir*. Dans son propre espace de PID, le programme principal du conteneur est le processus numéro 1 et ne voit pas les autres processus de l'hôte. Dans son propre espace de montage, les fichiers de l'image sont tout son disque. Il reçoit sa propre interface réseau, sa propre adresse et son propre nom d'hôte.
- Les **groupes de contrôle** (*cgroups*) décident de ce qu'il peut *consommer* : temps processeur, mémoire, nombre de processus.

Docker retire aussi la plupart des pouvoirs spéciaux de root (les *capabilities* Linux) et filtre les appels système qu'un conteneur peut faire. Vous pouvez voir la première partie à l'œuvre :

```
docker run --rm alpine:3.22 sh -c 'ps; hostname'
```

```
PID   USER     TIME  COMMAND
    1 root      0:00 sh -c ps; hostname
    7 root      0:00 ps
487b0a2988a3
```

Vu de l'intérieur, il n'existe que deux processus, le shell est le processus 1, et le nom d'hôte est l'identifiant du conteneur. Depuis l'hôte, pourtant, `ps aux` montre ce même shell comme un processus ordinaire. C'est tout le principe : même noyau, vue plus étroite.

### Sous Windows et macOS

Les conteneurs ont besoin d'un noyau Linux, et Windows comme macOS n'en ont pas. **Docker Desktop** fait donc tourner une petite machine virtuelle Linux en arrière-plan (sous Windows, via WSL 2), et vos conteneurs vivent à l'intérieur. C'est pourquoi l'installateur demande d'activer la virtualisation, et pourquoi lire, depuis un conteneur, des fichiers rangés dans un dossier Windows est plus lent que depuis le côté Linux.

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

### Lire un nom d'image

`python:3.13-slim` est une forme abrégée. Écrit en entier, cela donne `docker.io/library/python:3.13-slim` :

| Partie | Sens |
|---|---|
| `docker.io` | Le registre, ici Docker Hub, celui par défaut |
| `library` | L'espace de noms : `library` regroupe les images officielles |
| `python` | Le dépôt : toutes les versions de cette image |
| `3.13-slim` | Le tag : Python 3.13 sur une Debian allégée |

Les variantes comptent. `python:3.13` est plus grosse et contient des compilateurs. `python:3.13-slim` ne garde que ce qu'il faut pour exécuter Python. `python:3.13-alpine` est encore plus petite, mais Alpine utilise une autre bibliothèque C, et certains paquets Python ne s'y installent pas. Commencez par `slim`. Un tag peut aussi bouger : `3.13` est mis à jour à chaque correctif de sécurité. Pour figer une image exacte, ajoutez son empreinte, le long `@sha256:...` qu'affiche la construction.

### Le point à la fin : le contexte de construction

```
docker build -t toolkit .
```

`-t toolkit` donne un nom à l'image (un *tag*), pour pouvoir la lancer sous le nom `toolkit`. Le `.` final est le **contexte de construction** : le dossier dont Docker transmet les fichiers au constructeur. Une ligne `COPY` ne voit que les fichiers de ce dossier. Demandez-lui un fichier absent et la construction s'arrête :

```
ERROR: failed to build: ... failed to calculate checksum of ref ...: "/app.py": not found
```

Lisez la fin de la ligne, `"/app.py": not found` : le fichier n'est pas dans le dossier d'où vous construisez. Soit vous avez lancé la commande dans le mauvais dossier, soit le fichier est exclu par `.dockerignore`.

`.dockerignore` fonctionne comme `.gitignore` : il garde des fichiers hors du contexte. Mettez-y `.git`, `.venv`, `__pycache__` et `.env`. C'est une question de sécurité, pas seulement de rangement : avec un `COPY . .` négligent, vos secrets finissent cuits dans l'image, où quiconque la télécharge peut les lire. Les supprimer dans une ligne suivante n'y change rien, car chaque couche précédente est conservée.

### `RUN`, `CMD` et `ENTRYPOINT`

Ces trois-là se confondent facilement :

- `RUN` s'exécute **pendant la construction**, une seule fois. Il installe des choses dans l'image.
- `ENTRYPOINT` est le programme qui tourne **à chaque démarrage d'un conteneur**. Les mots tapés après le nom de l'image lui sont passés comme arguments.
- `CMD` donne des arguments par défaut, ou une commande par défaut quand il n'y a pas d'`ENTRYPOINT`. Ce que vous tapez après le nom de l'image le remplace.

Écrivez-les sous forme JSON, `["python", "hello.py"]`, comme plus haut. L'autre forme, une simple chaîne, passe par un shell, qui devient alors le processus principal et ne transmet pas le signal que Docker envoie pour arrêter le conteneur.

### Votre première image, de zéro

Faites-le une fois à la main avant d'empaqueter votre outil. Dans un dossier vide, créez `hello.py` :

```python
import platform
import sys

print(f"Hello from Python {platform.python_version()} on {platform.system()}")
print("Arguments:", sys.argv[1:])
```

Et à côté, un fichier qui s'appelle exactement `Dockerfile`, sans extension :

```dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY hello.py .
USER nobody
ENTRYPOINT ["python", "hello.py"]
```

Construisez-la avec `docker build -t hello .`. La sortie numérote chaque étape. Voici les lignes à lire :

```
#5 [1/3] FROM docker.io/library/python:3.13-slim@sha256:e48f59cd...
#6 [2/3] WORKDIR /app
#7 [3/3] COPY hello.py .
#8 naming to docker.io/library/hello:latest done
```

`[1/3]` à `[3/3]` sont les trois lignes qui construisent des couches, l'image de base arrive avec son empreinte exacte, et la dernière ligne confirme le nom. Lancez-la maintenant, deux fois :

```
docker run --rm hello one two
docker run --rm --entrypoint whoami hello
```

```
Hello from Python 3.13.18 on Linux
Arguments: ['one', 'two']
nobody
```

Les mots tapés après le nom de l'image sont arrivés au programme comme arguments, et le programme a tourné en tant que `nobody`, pas root, comme le demandait le Dockerfile. Remarquez aussi qu'il annonce Python 3.13 et Linux, quel que soit le système de votre ordinateur : la boîte a apporté le sien. Modifiez une ligne de `hello.py` et reconstruisez : les étapes 1 et 2 affichent maintenant `CACHED`, et seul le `COPY` s'exécute à nouveau.

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

### Les ports : pourquoi on n'atteint pas le conteneur au début

Un conteneur a sa propre adresse réseau, donc un serveur web qui écoute sur le port 5000 à l'intérieur reste invisible depuis votre machine tant que vous ne **publiez** pas le port : `ports:` dans compose, `-p` avec `docker run`. Le format est `adresse de l'hôte : port de l'hôte : port du conteneur`. Omettez l'adresse, et Docker publie sur toutes les interfaces réseau de votre machine. Sous Linux, il écrit aussi ses propres règles de pare-feu, qui s'appliquent avant celles de `ufw` : un port que vous croyiez bloqué est alors ouvert au réseau. Voilà pourquoi chaque exemple ici commence par `127.0.0.1:`.

### Les volumes : des données qui survivent au conteneur

Tout ce qu'un conteneur écrit va dans sa fine couche modifiable, et cette couche disparaît avec le conteneur. Pour des données qui doivent survivre, utilisez un **volume** :

```yaml
services:
  db:
    image: postgres:17
    environment:
      POSTGRES_PASSWORD: change-me
    volumes:
      - dbdata:/var/lib/postgresql/data
volumes:
  dbdata:
```

`dbdata` est un volume nommé que Docker conserve en dehors de tout conteneur, monté là où PostgreSQL range ses fichiers : après `docker compose down` puis `up`, on retrouve les mêmes données. L'autre sorte, le **montage de dossier** (*bind mount*), relie un dossier à vous, comme `-v "$PWD/logs:/data:ro"` plus haut. Dans un projet compose, les services se trouvent par leur nom : l'application joint la base à `db:5432`, sans adresse à chercher.

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

### Quand quelque chose ne va pas

La même poignée d'erreurs attend tous ceux qui débutent avec Docker. Chacune nomme sa cause, si on lit la ligne jusqu'au bout :

| Vous voyez | Cela veut dire | Faites ceci |
|---|---|---|
| `permission denied while trying to connect to the Docker daemon socket` | Votre utilisateur ne peut pas parler au démon | Utilisez `sudo`, ou entrez dans le groupe `docker`, en sachant qu'il équivaut à root |
| `Bind for 0.0.0.0:5000 failed: port is already allocated` | Quelque chose utilise déjà ce port sur votre machine | Trouvez-le avec `docker ps`, ou publiez un autre port, `-p 127.0.0.1:5001:5000` |
| `"/app.py": not found` pendant une construction | Le fichier n'est pas dans le contexte de construction | Construisez depuis le bon dossier, et vérifiez `.dockerignore` |
| `Exited (0)` ou `Exited (1)` dans `docker ps -a` | Le processus principal a terminé, ou a planté | Lisez `docker logs NOM` |
| `exec format error` | L'image a été construite pour un autre type de processeur | Prenez une image construite pour le vôtre, ou ajoutez `--platform` |
| `no space left on device` | Les vieilles images et les vieux conteneurs se sont accumulés | Voyez-les avec `docker system df`, puis `docker system prune` |

Un conteneur qui « s'arrête tout de suite » fonctionne en général comme prévu. Notre image `hello` affiche deux lignes et se termine, donc son conteneur indique `Exited (0)` : zéro veut dire succès. Un serveur ne reste allumé que parce que son processus principal ne se termine jamais.

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
