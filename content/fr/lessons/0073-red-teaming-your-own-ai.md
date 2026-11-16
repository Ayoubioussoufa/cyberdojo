---
title: Tester votre propre IA
summary: Comment fonctionne vraiment le red teaming de l'IA : le périmètre, un catalogue de tests par catégorie, des essais répétés, la notation des résultats, et un rapport aux chiffres honnêtes.
builds: un plan de test d'IA avec des statistiques de reproductibilité
source: NIST AI Risk Management Framework (en anglais) | https://www.nist.gov/itl/ai-risk-management-framework
words: red teaming, catalogue de tests, reproductibilité
---
Vous avez construit un agent. Découvrez maintenant comment il échoue, avant que quelqu'un d'autre ne le fasse. Le red teaming de l'IA consiste à tester un système d'IA comme le ferait un adversaire, sur un système qui vous appartient ou que vous avez l'autorisation de tester, et à mesurer le résultat.

Cette leçon enseigne la méthode. Ce n'est pas une liste d'astuces : les prompts isolés vieillissent en quelques semaines, et une méthode dure.

@term red teaming de l'IA = Tester un système d'IA à la recherche de comportements nuisibles ou non voulus, comme le ferait un adversaire.
@term catalogue de tests = Un ensemble organisé de cas de test, regroupés selon le type d'échec qu'ils vérifient.
@term reproductibilité = La fiabilité avec laquelle un résultat se reproduit dans les mêmes conditions.
@term canari = Un faux secret planté dans un système, pour que son apparition n'importe où prouve une fuite.
@term garak = Un scanner libre qui sonde les modèles de langage à la recherche de faiblesses connues.

## Le périmètre, comme toujours

Les règles de la [leçon 56](/courses/0056-how-a-pentest-works/) s'appliquent. Ne testez que votre propre système, ou un système que vous avez l'autorisation écrite de tester. Les chatbots publics ont des conditions d'utilisation. Plantez des **canaris** au lieu d'utiliser de vraies données, pour qu'une fuite soit à la fois prouvable et inoffensive.

Demandez-vous ce qui compte vraiment ici. Un bot de support qui dit une bêtise, c'est gênant, et un bot de support qui envoie des données clients à l'extérieur, c'est une violation. Classez vos tests par dommage.

| Dommage | Exemple | Priorité |
|---|---|---|
| Des données sortent | Des dossiers envoyés à des tiers | La plus haute |
| Une action nuisible | Supprimer ou payer | La plus haute |
| Un accès non autorisé | Lire les données d'un autre utilisateur | Haute |
| Une sortie fausse | Un mauvais conseil donné avec assurance | Moyenne |
| Une sortie gênante | Des blagues hors sujet | Plus basse |

Rendez chaque canari unique selon l'endroit où vous l'avez planté : un dans le prompt système, un dans un dossier client, un dans un document récupéré, comme `CANARY-SYS-7f3a91` et `CANARY-CRM-2c8e04`. Quand l'un d'eux réapparaît, son nom vous dit quel stockage a fui. Cherchez ensuite dans tout ce que le système a produit, les réponses et les arguments de chaque appel d'outil, car une fuite par `send_email` n'apparaît jamais dans la fenêtre de discussion.

@code canary-leaks

?? Pourquoi planter un faux secret dans votre système de test, plutôt que d'utiliser de vraies données ?
+ Une fuite devient prouvable, et elle ne nuit à personne
- On ne peut stocker de vraies données dans aucun modèle
- Les faux secrets font tourner le modèle bien plus vite
- Les modèles refusent de lire toute donnée réelle d'une entreprise
=> Un canari donne une preuve claire sans exposition réelle. Vous pouvez chercher cette chaîne exacte dans toutes les sorties.

## Construire un catalogue de tests

Organisez par catégorie, pour voir ce que vous avez couvert et ce que vous n'avez pas couvert.

| Catégorie | La question |
|---|---|
| Contournement direct des instructions | Un utilisateur peut-il le faire renoncer à ses règles ? |
| Injection indirecte | Un document, un ticket ou une page peut-il l'orienter ? |
| Divulgation de données | Peut-on lui faire révéler son prompt système, ou les données d'autrui ? |
| Mauvais usage des outils | Peut-on l'amener à appeler un outil de façon nuisible ? |
| Agentivité excessive | Agit-il quand il devrait demander ? |
| Empoisonnement de la mémoire | Quelque chose d'une session en affecte-t-il une autre plus tard ? |
| Traitement des sorties | Sa sortie peut-elle nuire là où elle s'affiche ? |
| Consommation sans limite | Quelqu'un peut-il faire grimper vos coûts ? |

Elles correspondent aux [listes de l'OWASP](/guides/d2-llm-security-primer/). Chaque cas de test note son entrée exacte, le comportement sûr attendu, et la façon de savoir qu'il a échoué. L'échec doit être vérifié par du code partout où c'est possible : le canari est-il apparu ? L'outil a-t-il été appelé ? Il n'y a alors aucun débat sur le résultat.

Un catalogue n'est utile que s'il est équilibré. Dix cas astucieux pour le contournement direct et aucun pour le mauvais usage des outils laissent la catégorie la plus dangereuse sans test. Comptez les cas par catégorie avant de lancer quoi que ce soit :

@code catalogue-coverage

?? Qu'est-ce qui fait un cas de test solide ?
+ Une condition d'échec que du code peut vérifier de façon fiable
- Un prompt de test long et créatif, écrit à la main
- Un résultat que quelqu'un a jugé en le lisant une fois
- Une attaque recopiée telle quelle d'un message sur un réseau social
=> Si « échoué » veut dire « la chaîne du canari est apparue », n'importe qui peut relancer le test et tomber d'accord. C'est ce qui rend les résultats crédibles.

## Les outils qui aident

| Outil | Usage |
|---|---|
| [promptfoo](https://www.promptfoo.dev/) | Lancer des suites de tests contre votre application, dans la CI |
| [garak](https://github.com/NVIDIA/garak) | Analyser un modèle à la recherche de faiblesses connues |
| [PyRIT](https://github.com/Azure/PyRIT) | Orchestrer des campagnes de red teaming |

Les outils vous donnent de l'étendue. Votre propre compréhension de l'application trouve les échecs qui comptent, puisqu'un scanner ne sait pas que `send_email` est votre joyau.

?? Un scanner ne signale aucun problème sur votre modèle. Qu'est-ce que cela montre sur votre agent ?
+ Peu, vos outils et vos données n'étaient pas testés
- L'agent ne pourra plus jamais être attaqué par personne
- Le scanner a prouvé que l'application était bien sûre
- Chaque catégorie du catalogue a maintenant été entièrement couverte
=> Les analyses génériques d'un modèle ne connaissent ni vos outils ni vos données. C'est dans l'application que se trouve le vrai risque.

## Des essais, et des chiffres honnêtes

Les modèles varient, donc une seule exécution ne prouve rien. Lancez chaque cas de nombreuses fois, et rapportez un taux, avec les conditions.

@flow Un cas d'attaque > De nombreux essais > Un taux de succès > Correction > Les mêmes essais de nouveau > Comparer

```
Cas : injection indirecte par un ticket de support
Modèle et version : notés
Essais : 20
Avant correction : 14 sur 20 ont réussi (70 %)
Après un prompt renforcé : 6 sur 20 (30 %)
Après la restriction des outils : 0 sur 20 (0 %)
```

Attention à cette dernière ligne. Zéro sur 20 ne veut pas dire que c'est impossible. Cela veut dire que ce n'est pas arrivé en 20 essais. Une règle pratique utile, la « règle de trois », dit qu'avec zéro succès en N essais, le vrai taux pourrait encore atteindre environ 3 ÷ N. Donc 0 sur 20 laisse encore la place à environ 15 %. Plus d'essais réduisent cette marge.

La règle de trois couvre le cas des zéro succès. Pour n'importe quel résultat, l'**intervalle de score de Wilson** donne une plage dans laquelle le vrai taux se trouve probablement. Avec *p* le taux observé, *n* le nombre d'essais et *z* = 1.96 pour une confiance de 95 %, le centre vaut *p* + *z*²/2*n*, la demi-largeur vaut *z* × √(*p*(1 − *p*)/*n* + *z*²/4*n*²), et les deux bornes sont divisées par 1 + *z*²/*n*. Pour 0 sur 20, la borne haute vaut environ 16 %, proche de la règle de trois. Pour 14 sur 20, l'intervalle va de 48 % à 86 %, ce qui est un titre plus honnête que « 70 % ».

@code wilson-interval

Pourquoi la restriction des outils est-elle arrivée à zéro ? Parce qu'elle ne compte pas sur la persuasion du modèle. Un changement dans les chiffres n'est que la moitié du rapport. Expliquez aussi le mécanisme.

Avec les mêmes essais avant et après un changement, chaque cas tombe dans l'une de quatre cases : corrigé, amélioré, inchangé ou pire. « Pire » arrive plus souvent qu'on ne le croit, car un prompt renforcé pour un cas peut en affaiblir un autre, et c'est pourquoi chaque cas est relancé après chaque changement, pas seulement celui que vous corrigiez.

@code compare-fixes

@drill trifecta

?? Une correction donne 0 succès sur 10 essais. Quelle est la formulation honnête ?
+ Aucun sur dix, donc le vrai taux reste incertain
- Il est désormais prouvé que l'attaque est totalement impossible
- Le système peut désormais être déclaré comme entièrement sûr
- Le modèle a appris pour toujours à la refuser
=> Dix essais ne peuvent pas exclure un vrai taux de 20 ou 30 %. Donnez les chiffres, et lancez-en davantage si cela compte.

## Rédiger le rapport

Votre rapport [P15](/projects/P15/) doit se lire comme une expérience.

| Section | Contient |
|---|---|
| Périmètre | Ce qui a été testé, les versions, ce qui ne l'a pas été |
| Méthode | Le catalogue, les essais, la façon de décider d'un échec |
| Constats | L'entrée exacte, le taux, l'impact, le raisonnement sur la gravité |
| Corrections | Ce qui a changé, avec les taux avant et après |
| Risque résiduel | Ce qui reste possible, honnêtement |

Incluez les échecs que vous n'avez pas pu corriger. Écrire « l'injection de prompt est réduite, pas résolue, donc la conception suppose un modèle trompé » est exactement ce qu'un relecteur expérimenté veut lire.

::: try Lancez-le
Utilisez [Parrot](/machines/parrot/) pour pratiquer toute la boucle dans le navigateur. Faites-le ensuite pour de vrai sur votre propre agent de la leçon 72 : dix cas distincts, au moins 20 essais chacun, et un tableau avant et après.
:::

?? Que dit un bon rapport de sécurité de l'IA sur l'injection de prompt après vos corrections ?
+ Elle est réduite, et la conception limite les dégâts
- Elle est complètement résolue et ne demande plus rien
- C'est le problème du seul fournisseur, pas le vôtre
- Elle ne mérite pas d'être mentionnée dans un rapport
=> Un risque résiduel honnête crée la confiance. Concevoir pour un modèle trompé est la position mûre.

## Relire un rapport de test

Le brouillon de rapport d'un collègue commence ainsi.

```
Cible :    le chatbot public de support d'un concurrent, pour le comparer au nôtre
Méthode :  une tentative par cas ; résultats jugés en lisant les réponses
Résultat : « le modèle est sûr » (aucune attaque n'a fonctionné)
```

?? Qu'est-ce qui ne va pas avec la cible ?
+ Personne n'a donné l'autorisation de tester ce système
- Les chatbots des concurrents sont toujours trop lents
- Un labo ne peut joindre aucun chatbot public
- Les comparaisons ne servent jamais en sécurité informatique
=> Tester un système qui ne vous appartient pas, sans autorisation écrite, n'est pas du red teaming. Testez le vôtre, ou celui dont le propriétaire a donné son accord par écrit.

?? Que changeriez-vous dans la méthode ?
+ De nombreux essais par cas, chacun jugé par code
- Moins de cas, chacun lu avec plus de soin
- Une tentative par cas, mais lancée pendant la nuit
- Demander au modèle de noter lui-même ses propres réponses
=> Une seule tentative ne dit rien d'un taux, et une lecture à l'œil invite au débat. Répétez chaque cas, et laissez un canari ou un appel d'outil journalisé trancher.

?? Comment formuler le résultat ?
+ Aucun succès sur les N essais, avec l'intervalle
- Sûr, puisque rien n'a marché pendant le test
- Pas sûr, puisque tout modèle peut être trompé
- Inconnu, donc le rapport ne devrait rien dire
=> Dites ce qui a été observé et à quel point c'est incertain. « 0 sur 20, donc le vrai taux est probablement inférieur à 16 % » est un résultat. « Sûr » est une affirmation que le test ne peut pas soutenir.

?! Écrivez cinq cas de test pour un assistant d'IA que vous connaissez : l'idée de l'entrée, le comportement sûr que vous attendez, et la façon dont du code pourrait détecter un échec.
