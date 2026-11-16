---
title: La sécurité de la chaîne d'approvisionnement et de la CI/CD
summary: Pourquoi les dépendances et les systèmes de build sont des cibles, des cas réels, les SBOM, la signature, des pipelines au moindre privilège et des conteneurs durcis.
builds: un pipeline qui bloque un constat critique, avec un circuit d'exception
source: GitHub Actions, durcissement de la sécurité (en anglais) | https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions
words: SBOM, provenance, chaîne d'approvisionnement
---
Vous n'exécutez pas seulement votre propre code. Vous exécutez des centaines de dépendances, d'outils de build et d'actions de CI. Si un attaquant en compromet une, il atteint tout le monde en aval. C'est pourquoi l'OWASP a placé les défaillances de la chaîne d'approvisionnement logicielle en troisième position de sa liste 2025.

@term attaque de la chaîne d'approvisionnement = Compromettre une dépendance ou un outil de build pour atteindre ses utilisateurs.
@term SBOM (nomenclature logicielle) = Un inventaire des composants d'un logiciel.
@term provenance = Un enregistrement vérifiable de la façon dont un logiciel a été construit, et où.
@term SLSA = Un cadre de niveaux pour l'intégrité de la chaîne d'approvisionnement.
@term Sigstore = Un projet pour signer et vérifier des logiciels, qui comprend l'outil cosign.
@term Trivy = Un scanner de vulnérabilités pour les conteneurs, le code et la configuration.
@term dépendance transitive = Un paquet que vous utilisez indirectement, parce qu'une de vos dépendances en a besoin.
@term typosquatting = Publier un paquet malveillant sous le nom mal orthographié d'un paquet populaire.
@term OIDC vers le cloud = Permettre à une tâche de CI de prouver son identité et de recevoir des identifiants cloud de courte durée, sans aucun secret stocké.

## Pourquoi c'est une si bonne cible

Ajoutez une bibliothèque à un projet et vous pouvez en tirer des dizaines d'autres, parce que cette bibliothèque a des dépendances, et les siennes aussi. Ce sont des **dépendances transitives**. Vous ne les avez ni choisies ni lues, mais elles tournent avec les permissions de votre application, et souvent sur votre machine de build, là où se trouvent les secrets.

Pour un attaquant, un paquet populaire vaut plus qu'une entreprise. Compromettez-le une fois, et chaque projet qui se met à jour fait la livraison pour vous.

L'attaque la moins chère ne compromet rien du tout. Elle publie un nouveau paquet dont le nom est à une lettre d'un paquet populaire, et attend une faute de frappe. C'est le **typosquatting**. La même astuce fonctionne avec les assistants d'IA, qui suggèrent parfois des paquets qui n'existent pas : un attaquant enregistre alors le nom inventé. Un nom presque identique à un nom célèbre, mais pas tout à fait, mérite un second regard avant que quiconque ne l'installe.

@code typosquat

?? Pourquoi les attaquants visent-ils une bibliothèque libre populaire plutôt qu'une entreprise directement ?
+ Une compromission atteint tous les projets qui l'utilisent
- Aucun défenseur ne peut lire le code libre
- Les bibliothèques tournent toujours sans la moindre permission
- Aucune entreprise ne met à jour ses bibliothèques
=> L'effet de levier est tout l'intérêt. La confiance circule automatiquement vers l'aval, et les mises à jour distribuent l'attaque.

## Ce qu'il faut étudier

| Cas | Ce qui s'est passé | La leçon |
|---|---|---|
| [xz-utils](https://openssf.org/blog/2024/03/30/xz-backdoor-cve-2024-3094/), 2024 | Un contributeur a passé des années à gagner la confiance des mainteneurs, puis a caché une porte dérobée dans les fichiers de publication. Un développeur a remarqué des connexions SSH plus lentes | La confiance envers les personnes est une surface d'attaque, et la curiosité attrape des choses |
| tj-actions/changed-files, 2025 | Les étiquettes de version d'une GitHub Action ont été déplacées vers un commit malveillant qui exposait les secrets de CI | Les étiquettes peuvent bouger, donc épinglez par commit |
| Nx et les vers npm, 2025 | Des versions malveillantes de paquets ont volé des secrets et, dans le cas de Nx, ont détourné des outils d'IA en ligne de commande sur les machines des développeurs pour les chercher | Les outils d'IA sur un portable sont puissants, et désormais ciblés |

Lisez comment chacun a été découvert, et ce qui l'aurait limité.

?? Qu'est-ce qui rendait l'attaque de xz-utils si inhabituelle ?
+ Des années de confiance gagnée par un nouveau contributeur
- Une force brute sur le mot de passe principal
- Une faille trouvée par un scanner de code automatique
- Une demande de rançon publique adressée aux deux mainteneurs
=> C'était de l'ingénierie sociale étalée sur des années, et elle a failli atteindre les versions stables de Linux. Un ingénieur curieux l'a trouvée par hasard.

## Savoir ce que vous livrez

Un **SBOM** est une liste d'ingrédients. Les deux formats principaux sont CycloneDX et SPDX. Quand une nouvelle faille critique apparaît, vous cherchez dans vos SBOM au lieu de demander à chaque équipe. La **provenance** répond à une autre question : d'où vient réellement ce build ? [SLSA](https://slsa.dev/) définit des niveaux de confiance, et cosign, de **Sigstore**, permet de signer et de vérifier des artefacts.

@range supply

Deux outils en fabriquent un à partir d'un dossier ou d'une image, et `jq` le fouille :

```
syft . -o cyclonedx-json > sbom.json
trivy fs --format cyclonedx --output sbom.json .
jq -r '.components[] | "\(.name) \(.version)"' sbom.json
```

Quand un avis dit « corrigé en 2.4.1 », la question pour chaque SBOM est de savoir s'il liste ce paquet dans une version inférieure. Comparez les versions comme des nombres, partie par partie, pas comme du texte : comme texte, `2.10.0` se trie avant `2.9.0`.

@code sbom-search

Les **fichiers de verrouillage** gardent identiques ce que vous avez testé et ce que vous livrez. `package-lock.json` enregistre la version exacte de chaque paquet, transitifs compris, et `npm ci` installe exactement cela, ou échoue. En Python, `pip install --require-hashes -r requirements.txt` refuse tout fichier dont l'empreinte ne correspond pas à celle qui est notée, si bien qu'un paquet remplacé ne peut pas se glisser à l'intérieur. `npm audit` et `pip-audit` comparent ensuite ce qui est verrouillé aux avis connus.

La signature ferme la boucle. Le build signe l'image, et le déploiement refuse tout ce qui ne se vérifie pas :

```
cosign sign --key cosign.key registry.example/shop@sha256:4f1a…
cosign verify --key cosign.pub registry.example/shop:1.4
```

?? Une faille critique est annoncée dans une bibliothèque de journalisation. En quoi un SBOM aide-t-il d'abord ?
+ Il montre lesquelles de vos applications la contiennent déjà
- Il corrige tout de suite toutes les applications touchées
- Il bloque les attaquants de la bibliothèque de journalisation
- Il prouve que la bibliothèque n'a jamais été exploitée
=> Un SBOM répond en quelques minutes à « sommes-nous touchés, et où ? ». La correction vient ensuite.

## Les mesures

| Mesure | Protège contre |
|---|---|
| Épingler les dépendances et les actions de CI par SHA de commit complet | Une étiquette déplacée vers du mauvais code |
| Des jetons de CI au moindre privilège | Une étape compromise qui en fait trop |
| OIDC vers le cloud | Des secrets de longue durée dans la CI |
| SBOM | « Sommes-nous touchés ? » qui prend des jours |
| Signer et vérifier | Des artefacts altérés |
| Des images minimales, sans root | Un rayon d'impact plus grand |

Voici à quoi cela ressemble dans un workflow GitHub Actions :

```yaml
permissions:
  contents: read            # lecture seule par défaut

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # un SHA de commit complet, pas une étiquette comme @v4
      - uses: actions/checkout@8e5e7e5ab8b370d6c329ec480221332ada57f0ab
```

Le SHA ci-dessus n'est qu'une illustration, alors cherchez vous-même le SHA actuel. Méfiez-vous des workflows qui exécutent le code des pull requests d'inconnus. Ils ne devraient pas avoir accès à vos secrets.

L'épinglage peut être vérifié par un programme, et c'est ainsi qu'on le garde vrai à mesure que des gens ajoutent des étapes :

@code unpinned-actions

Un déclencheur mérite son propre avertissement. `pull_request_target` s'exécute avec les secrets de votre dépôt et un jeton qui peut écrire, parce qu'il est prévu pour des tâches de confiance comme l'étiquetage. Si un tel workflow récupère le code de la pull request et l'exécute, le code d'un inconnu tourne avec vos secrets. Utilisez `pull_request` pour tout ce qui construit ou teste du code proposé par d'autres.

?? Pourquoi épingler une GitHub Action par SHA de commit plutôt que par une étiquette comme `v3` ?
+ Une étiquette peut bouger, un SHA ne bouge pas
- Les SHA font tourner le workflow beaucoup plus vite
- Les étiquettes ne sont pas acceptées dans un workflow
- Cela cache l'action aux yeux de tous les autres
=> Lors d'une compromission, des étiquettes ont été redirigées vers du code malveillant. Un SHA complet désigne un commit exact.

## Des conteneurs durcis

Une image de conteneur est une chaîne d'approvisionnement à elle seule. Préférez une image de base minimale, pour qu'il y ait moins à attaquer. Ne tournez pas en root. Analysez avec [Trivy](https://trivy.dev/), et épinglez l'image de base.

```dockerfile
FROM python:3.13-slim
RUN useradd --create-home app
USER app                     # ne pas tourner en root
COPY . /home/app
CMD ["python", "/home/app/main.py"]
```

Épingler l'image de base par condensé, `FROM python:3.13-slim@sha256:…`, donne la même garantie qu'épingler une action par SHA. Quelques problèmes reviennent dans presque chaque relecture de Dockerfile, et tous se voient dans le texte :

@code dockerfile-lint

Analysez le résultat, et faites échouer le pipeline sur ce qui compte :

```
trivy image --severity CRITICAL --exit-code 1 registry.example/shop:1.4
```

`--exit-code 1` transforme « trouvé quelque chose de critique » en étape échouée, et c'est ce qui fait d'une analyse une barrière plutôt qu'un rapport que personne ne lit.

?? Quel est le gain de sécurité d'une image de base minimale ?
+ Moins d'outils et de paquets utiles à un attaquant
- Les conteneurs n'ont plus jamais besoin du moindre correctif
- L'application devient alors automatiquement exempte de tout bug connu
- Les attaquants ne peuvent plus atteindre le registre Docker
=> Moins de logiciel, c'est moins de vulnérabilités et moins d'outils pour quelqu'un qui entre. Cela réduit le risque, sans le supprimer.

## Des barrières que les gens ne contournent pas

Un pipeline doit bloquer ce qui compte, et avoir aussi un **circuit d'exception** documenté. Une barrière que personne ne peut franchir légitimement est une barrière que les équipes contourneront.

@flow Commit > Tests et SAST > SCA, secrets, SBOM > Construire une image minimale > Signer > Vérifier au déploiement

::: try Construisez P14
Voyez le [projet P14](/projects/P14/). Prouvez qu'un commit contenant un secret de test planté est bloqué, avec une fausse valeur.
:::

::: tip Vérifiez ce que propose l'IA
Demandez des bibliothèques pour une tâche de niche, et vérifiez que chacune existe avant que quiconque ne l'installe. Le [slopsquatting](/guides/d3-using-ai-well/) est réel.
:::

?? Une barrière de sécurité bloque chaque version au moindre constat, sans aucun circuit d'exception. Que se passe-t-il en général ?
+ Les équipes trouvent des moyens de la contourner
- Chaque constat est corrigé en une seule journée
- Les attaquants cessent alors de viser cette entreprise-là
- Les versions deviennent plus rapides et plus fréquentes
=> Une barrière sans passage légitime finit désactivée, sautée ou contournée. Une exception documentée, avec un responsable et une date d'expiration, garde la barrière en place.

## Relire un workflow

Un contributeur propose ce workflow pour que les tests tournent sur chaque pull request.

```yaml
on: pull_request_target
permissions: write-all
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
      - run: npm install && npm test
```

?? Qu'est-ce qui est dangereux dans le déclencheur et la récupération du code réunis ?
+ Le code d'un inconnu tourne avec tous vos secrets
- Les tests sont sautés pour chaque nouvelle pull request
- Le workflow ne tourne que sur la branche principale
- La récupération ne lit pas le code d'un fork
=> `pull_request_target` donne à la tâche vos secrets et un jeton en écriture, et la récupération charge le propre code de la pull request. `npm test` exécute alors tout ce que l'inconnu a écrit. Utilisez plutôt `pull_request`.

?? Par quoi remplacer `permissions: write-all` ?
+ La lecture seule, plus le nécessaire pour chaque tâche
- Rien, puisque GitHub ignore les permissions dans les workflows
- Administrateur, pour que les tests puissent créer des versions
- Write-all, mais seulement pendant les jours de la semaine
=> Partez de `contents: read` et accordez une permission en écriture à la seule tâche qui en a besoin. Une étape compromise peut alors faire bien moins.

?? Que changeriez-vous encore dans les étapes ?
+ Épingler l'action par SHA, et utiliser npm ci
- Renommer la tâche pour la cacher aux attaquants
- Lancer npm install deux fois, pour être sûr
- Déplacer tous les tests dans un dépôt séparé
=> `@v4` est une étiquette qui peut être déplacée, et `npm install` peut aboutir à des versions plus récentes que celles que vous avez relues. Un SHA et `npm ci` rendent l'exécution reproductible.

?! Une CVE critique tombe dans une bibliothèque populaire. En quoi un SBOM vous aide-t-il, et que feriez-vous ensuite ?
