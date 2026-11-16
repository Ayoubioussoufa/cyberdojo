---
title: Ingénierie de détection
summary: Le cycle de vie d'une détection, la lecture d'une règle Sigma ligne par ligne, la détection en tant que code, le réglage des faux positifs, et une mesure honnête de la couverture.
builds: écrire, tester et régler une règle Sigma
source: SigmaHQ, règles et spécification (en anglais) | https://github.com/SigmaHQ/sigma
words: détection, Sigma, purple team
---
Les alertes n'apparaissent pas par magie. Quelqu'un les a écrites, et l'essentiel de la valeur d'un SOC tient à la qualité de ce travail. L'ingénierie de détection traite les détections comme du logiciel : écrites, testées, relues et mesurées. Au Mois 9, vous consommiez des alertes. Maintenant, vous les fabriquez.

@term détection = Une logique qui repère un comportement dans la télémétrie et lève une alerte.
@term Sigma = Un format générique, indépendant des éditeurs, pour écrire des règles de détection.
@term purple team = Attaquants et défenseurs qui travaillent ensemble pour tester et améliorer les détections.
@term Atomic Red Team = Une bibliothèque de petits tests sans danger, rattachés aux techniques d'ATT&CK.
@term télémétrie = Les données que les systèmes produisent sur ce qu'ils sont en train de faire.
@term détection en tant que code = Garder les détections dans un gestionnaire de versions, avec des relectures et des tests automatiques.
@term couverture = La part des comportements d'attaquants pertinents que vous savez réellement détecter.

## Le cycle de vie

@flow Hypothèse > Source de données > Logique > Test > Réglage > Déploiement > Mesure

Partez d'un comportement, pas d'un outil. Un exemple complet :

| Étape | Exemple |
|---|---|
| **Hypothèse** | Les applications Office ne devraient pas lancer d'interpréteur de commandes |
| **Source de données** | L'événement Sysmon 1 donne le processus parent et le processus enfant |
| **Logique** | Le parent est Word ou Excel, et l'enfant est `cmd` ou `powershell` |
| **Test** | Lancez une simulation sans danger. La règle s'est-elle déclenchée ? |
| **Réglage** | Excluez le seul module signé qui fait cela légitimement |
| **Déploiement** | Fusionnez-la dans le dépôt des règles |
| **Mesure** | Suivez combien de fois elle se déclenche, et combien de fois elle a raison |

Sans les données, vous ne pouvez pas détecter le comportement. « Est-ce qu'on collecte cela ? » est donc toujours la deuxième question.

?? Vous avez écrit une excellente hypothèse, mais aucun système ne journalise les lignes de commande des processus. Quelle est l'étape suivante ?
+ Combler le manque de données avant toute logique
- Écrire la règle quand même, puis espérer mieux
- Marquer cette technique comme couverte dans le rapport
- Demander aux attaquants d'utiliser une autre technique plutôt
=> Une règle posée sur des données absentes ne se déclenche jamais, et elle ressemble exactement à un réseau calme. Corrigez d'abord la télémétrie.

## Une règle Sigma, ligne par ligne

```yaml
title: Office Application Spawning a Shell
id: 3e1f8a52-7c1d-4f6e-9a2b-5d0c7e4b1a11
status: experimental
description: Word or Excel started a command shell.
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    ParentImage|endswith:
      - '\WINWORD.EXE'
      - '\EXCEL.EXE'
    Image|endswith:
      - '\cmd.exe'
      - '\powershell.exe'
  condition: selection
falsepositives:
  - Some legitimate add-ins
level: high
tags:
  - attack.execution
  - attack.t1059.001
```

| Partie | Sens |
|---|---|
| `id` | Un identifiant unique et stable, pour qu'une règle garde son identité si on la renomme |
| `status` | Sa maturité. `experimental` signifie pas encore éprouvée |
| `logsource` | Les données dont elle a besoin |
| `selection` | Les champs à faire correspondre. Les éléments d'une liste signifient **ou**, et des champs distincts signifient **et** |
| `\|endswith` | Un modificateur : comparer la fin de la valeur |
| `condition` | La façon de combiner les sélections, par exemple `selection and not filter` |
| `falsepositives` | Ce dont vous savez déjà que cela peut la déclencher |
| `level` | La gravité d'une correspondance |
| `tags` | Le rattachement à ATT&CK |

`endswith` est l'un des quelques modificateurs existants, et ils couvrent la plupart des règles que vous lirez :

| Écrit ainsi | Correspond quand le champ… |
|---|---|
| `Image: 'C:\Windows\System32\cmd.exe'` | Est égal à la valeur |
| `Image\|endswith: '\cmd.exe'` | Se termine par elle |
| `Image\|startswith: 'C:\Users\'` | Commence par elle |
| `CommandLine\|contains: '-enc'` | La contient quelque part |
| `CommandLine\|contains\|all:` puis une liste | Contient chaque élément de la liste, et pas un seul |

Dans Sigma, la comparaison de texte ordinaire ignore les majuscules et les minuscules, donc `\WINWORD.EXE` correspond aussi à `\winword.exe`.

La logique de correspondance est assez petite pour être écrite, et l'écrire retire tout mystère au format. Une sélection est un dict. Chaque champ qu'elle contient doit correspondre, et un champ qui reçoit une liste correspond dès qu'un élément correspond.

@code sigma-selection

[Sigma](https://github.com/SigmaHQ/sigma) est indépendant des éditeurs, donc des outils convertissent une même règle dans le langage de votre SIEM. L'outil [sigma-cli](https://github.com/SigmaHQ/sigma-cli) le fait avec une commande comme `sigma convert -t splunk rule.yml`.

Installez le convertisseur dans un environnement virtuel et essayez-le sur la règle ci-dessus :

```
pip install sigma-cli
sigma plugin install splunk
sigma check rule.yml
sigma convert -t splunk -p sysmon rule.yml
```

`sigma check` lit la règle et signale les erreurs de structure, et c'est la première chose que la CI devrait lancer. `convert` a besoin d'une **cible**, le langage de requête, et le plus souvent d'un **pipeline**, qui lui dit comment les champs s'appellent dans vos données. `sigma list targets` et `sigma list pipelines` montrent ce qui est installé. La sortie est une recherche ordinaire dans le langage de la cible, à peu près :

```
ParentImage IN ("*\\WINWORD.EXE", "*\\EXCEL.EXE") Image IN ("*\\cmd.exe", "*\\powershell.exe")
```

Une règle, écrite une fois, devient une requête pour le SIEM qu'on vous confie, quel qu'il soit.

?? Dans la règle ci-dessus, comment se combinent les deux listes sous `selection` ?
+ Un parent listé, et aussi un enfant listé
- Il suffit que le parent ou l'enfant corresponde
- Les deux parents doivent correspondre en même temps
- La règle correspond quand rien d'autre ne tourne
=> Les éléments d'une liste sont des alternatives. Des champs distincts doivent tous être vrais. Il faut donc un parent Office ET un enfant qui est un interpréteur de commandes.

## Testez-la, sinon ce n'est pas une détection

**Atomic Red Team** fournit de [petits tests pour chaque technique](https://github.com/redcanaryco/atomic-red-team). Lancez-en un dans votre labo, puis vérifiez que votre règle s'est déclenchée. Quand attaquants et défenseurs travaillent ainsi ensemble, on parle de **purple team** : le rouge rencontre le bleu.

::: law
Ne lancez les tests atomiques que dans votre propre labo, sur un instantané. Lisez chaque test avant de le lancer.
:::

::: ai Exercice de la feuille de route
Faites rédiger dix règles par un LLM. Testez chacune, et ne gardez que celles qui se déclenchent sans vous inonder. Rapportez combien ont été rédigées, combien étaient valides et combien vous avez gardées. L'IA rédige, les tests décident.
:::

Un test est un ensemble d'événements dont vous connaissez déjà la bonne réponse. Gardez-les à côté de la règle : certains doivent la déclencher, et d'autres leur ressemblent et ne le doivent pas.

| Événement | Parent | Enfant | Doit-elle se déclencher ? |
|---|---|---|---|
| Un document lance PowerShell | `WINWORD.EXE` | `powershell.exe` | Oui |
| Un tableur lance un interpréteur de commandes | `EXCEL.EXE` | `cmd.exe` | Oui |
| Un administrateur ouvre PowerShell depuis le bureau | `explorer.exe` | `powershell.exe` | Non |
| Word lance son assistant d'impression | `WINWORD.EXE` | `splwow64.exe` | Non |

Deux nombres sortent d'une exécution. La **précision** demande : parmi les fois où la règle s'est déclenchée, combien étaient réelles ? Le **rappel** demande : parmi les cas réels, combien en a-t-elle attrapé ? Une règle qui se déclenche sur tout a un rappel parfait et une précision inutile, et une règle qui ne se déclenche jamais a le problème inverse. Il vous faut les deux, et vous rapportez les deux.

@code precision-recall

?? Une règle ne s'est jamais déclenchée en six mois. Qu'est-ce que cela vous apprend ?
+ Rien encore, il faut tester si elle fonctionne
- L'attaquant a sûrement pris peur à cause d'elle
- La règle fonctionne parfaitement, il faut la laisser
- On peut la compter comme une couverture complète
=> Une règle silencieuse fonctionne peut-être, ou elle est peut-être cassée. Seul un test vous dit lequel.

## La détection en tant que code

Les règles sont du code, alors traitez-les comme du code. Gardez-les dans Git, avec une relecture pour chaque changement et une **CI** qui les vérifie automatiquement :

@flow Écrire la règle > Ouvrir une pull request > La CI vérifie la syntaxe et lance les tests > Le relecteur approuve > Convertir et déployer

Vous y gagnez un historique (qui a changé quoi, et pourquoi), une relecture par les pairs, et un moyen sûr d'annuler une mauvaise règle. C'est le critère de validation de [P08](/projects/P08/) : au moins 15 règles avec la preuve de leurs tests, dans un dépôt doté d'une CI.

Le premier contrôle que lance la CI est le moins cher : chaque règle a-t-elle les parties dont une règle a besoin ? Un `id` manquant ou un `level` inventé devrait faire échouer une pull request avant qu'une personne ne passe du temps à relire la logique.

@code sigma-lint

?? Pourquoi garder les détections dans Git plutôt que de les modifier directement dans le SIEM ?
+ Chaque changement est relu, historisé et facile à annuler
- Git fait tourner chaque règle vraiment beaucoup plus vite
- Les SIEM ne savent pas stocker de règles seuls
- Les attaquants ne peuvent lire aucune règle dans Git
=> C'est la raison pour laquelle les équipes de développement utilisent un gestionnaire de versions : vous pouvez voir, relire et annuler chaque changement.

## Le réglage

Le bruit tue les détections. Réglez par le **contexte**, pas en désactivant une règle :

- Excluez un parent et un chemin précis, connus comme sains, pas un produit entier.
- Donnez à chaque exclusion une raison et une date d'expiration.
- Mesurez la précision dans le temps.

Dans Sigma, une exclusion est une seconde sélection, et la condition la soustrait :

```yaml
detection:
  selection:
    ParentImage|endswith:
      - '\WINWORD.EXE'
      - '\EXCEL.EXE'
    Image|endswith:
      - '\cmd.exe'
      - '\powershell.exe'
  filter_addin:
    ParentCommandLine|contains: '\Contoso\ReportAddin\'
    Image|endswith: '\cmd.exe'
  condition: selection and not filter_addin
```

Lisez le filtre aussi étroitement qu'il est écrit : seulement le dossier de ce module, et seulement quand l'enfant est `cmd.exe`. PowerShell lancé par le même module lève encore une alerte. Chaque champ que vous ajoutez à un filtre rétrécit le trou, et un filtre qui n'a qu'un champ large, comme un nom d'utilisateur, est une cachette.

@code sigma-filter

?? Une règle se déclenche 500 fois par jour sur un seul outil de sauvegarde signé. Quelle est la meilleure décision ?
+ Ajouter une exclusion étroite et documentée pour lui
- Désactiver la règle jusqu'à la fin du bruit
- Augmenter sa gravité pour qu'on la remarque enfin
- Supprimer les journaux de cet outil de sauvegarde
=> Une exclusion étroite conserve la couverture. Désactiver la règle vous rend aveugle au cas réel.

## Entraînez-vous

Écrivez une règle, cassez-la avec un nouveau cas de test, corrigez-la, puis mesurez-la. Un petit outil lance votre règle sur des événements étiquetés, comme le ferait la CI.

@range detect

## La couverture, honnêtement

Un calque d'[ATT&CK Navigator](https://mitre-attack.github.io/attack-navigator/) peut montrer ce que vous détectez. Construisez-le à partir de **résultats de tests**, pas d'intentions, et rappelez-vous qu'une règle pour une technique ne veut pas dire que vous l'avez couverte. La plupart des techniques ont de nombreuses variantes.

?? Une diapositive affiche une couverture ATT&CK de 80 %, d'après les noms des règles. Pourquoi rester sceptique ?
+ Personne n'a prouvé que ces règles détectent des attaques
- ATT&CK ne compte pas plus de dix techniques différentes
- Les pourcentages de couverture sont interdits par le référentiel
- Quatre-vingts pour cent est le plus haut score possible
=> Une couleur sur une carte n'est pas une preuve. Une couverture honnête vient de tests, avec chaque variante nommée.

## Relire une règle

Un collègue ouvre une pull request avec une nouvelle détection et les résultats de ses tests. Voici trois choses que vous vérifiez.

```yaml
detection:
  selection:
    CommandLine|contains: 'powershell'
  condition: selection
```

?? Qu'est-ce qui ne va pas dans cette sélection ?
+ Elle correspond à chaque usage ordinaire de PowerShell
- Elle ne peut jamais correspondre au moindre événement
- Elle ne voit que les commandes en majuscules
- Elle exige une seconde règle pour être convertie
=> Les administrateurs et les outils de gestion lancent PowerShell toute la journée. Une règle aussi large noie les cas réels dans le bruit, et les gens cessent de lire ses alertes.

?? En test, la règle s'est déclenchée sur 8 événements, dont 6 étaient malveillants. Le jeu de test contenait 10 événements malveillants. Quelle est sa précision ?
+ `0.75`
- `0.6`
- `0.8`
- `0.48`
=> La précision, c'est 6 cas réels sur 8 déclenchements. Le 0.6 est son rappel : 6 attrapés sur les 10 qui ont eu lieu. Les deux ont leur place dans la pull request.

```yaml
  filter_backup:
    User: 'svc_backup'
  condition: selection and not filter_backup
```

?? Pourquoi devriez-vous contester cette exclusion ?
+ Tout ce que fait ce compte devient invisible
- Les comptes de service n'apparaissent dans aucun journal
- Les filtres ne sont pas autorisés dans Sigma
- Le nom du compte est écrit en minuscules
=> Le filtre fait confiance à un compte entier, donc un attaquant qui l'obtient peut faire tout ce que cette règle devait attraper. Restreignez-le au programme et au chemin de l'outil de sauvegarde, et écrivez pourquoi.

?! Écrivez l'hypothèse, la source de données et les faux positifs connus pour la détection de l'installation d'un nouveau service.
