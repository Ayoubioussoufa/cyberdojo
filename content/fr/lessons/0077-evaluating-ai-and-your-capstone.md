---
title: Votre projet final et la mesure de l'IA
summary: Concevoir un projet final que vous pouvez terminer, et prouver la valeur d'un assistant d'IA par une vraie évaluation : vérité de référence, précision, rappel, coût et échecs.
builds: une proposition de projet final délimitée et un plan de jeu de données de référence
source: promptfoo, tester les prompts et les modèles comme du code (en anglais) | https://www.promptfoo.dev/docs/intro/
words: vérité de référence, précision, rappel
---
C'est le moment où votre profil cesse de ressembler à celui d'un étudiant. Vous choisissez un projet conséquent, et vous apprenez à mesurer plutôt qu'à affirmer.

@term vérité de référence = Des réponses justes et vérifiées, utilisées pour juger un système.
@term précision = Parmi ce qui a été signalé, la part qui était vraiment juste.
@term rappel = Parmi ce qui aurait dû être signalé, la part qui a été trouvée.
@term projet final = Le projet conséquent qui clôt la feuille de route.
@term taxonomie des échecs = Des catégories nommées pour les façons dont un système se trompe.
@term humain dans la boucle = Une conception où une personne relit ou approuve avant qu'une action n'ait lieu.

## Délimiter le projet final

Écrivez : le problème, les critères de réussite, le modèle de menaces, l'architecture, le calendrier et les livrables. Il doit pouvoir être terminé en **huit semaines**. Voyez [les projets finaux par voie](/guides/f1-project-standards/).

Un bon périmètre a une phrase que l'on peut tester : « Trier 100 alertes étiquetées, et être d'accord avec un humain sur au moins 80 % d'entre elles. » Un mauvais n'a pas de fin : « Construire un SOC à base d'IA. » Coupez des fonctionnalités jusqu'à pouvoir terminer, car un petit projet fini l'emporte sur un grand projet inachevé dans chaque entretien.

?? Quel est le meilleur critère de réussite pour un projet final ?
+ Attraper 90 % de 100 cas de test étiquetés
- Améliorer nettement et partout toute la sécurité de l'entreprise
- Utiliser le plus grand nombre possible de modèles d'IA
- Construire quelque chose qui ait l'air vraiment très impressionnant
=> Il est mesurable et il a une fin. Si vous ne pouvez pas dire si un objectif est atteint, vous ne pouvez pas terminer.

## P16 : l'évaluation est le projet

L'assistant n'est que le prétexte. Le but est de prouver ce qu'il vaut.

@flow Construire la vérité de référence : plus de 100 éléments > Lancer l'assistant > Le noter > Classer les échecs > Améliorer > Noter de nouveau

La **vérité de référence** est votre corrigé, et c'est l'essentiel du travail. Elle doit être étiquetée avant que vous ne voyiez les réponses de l'assistant, sinon vous noterez discrètement en sa faveur. Si une étiquette est difficile, faites-la vérifier par une seconde personne.

| Mesure | Question |
|---|---|
| Précision | Quand il dit « malveillant », à quelle fréquence a-t-il raison ? |
| Rappel | Combien de vrais cas a-t-il attrapés ? |
| Coût et latence | Vaut-il la peine d'être exécuté ? |
| Taxonomie des échecs | Comment se trompe-t-il ? |

Quand une seconde personne étiquette les mêmes éléments, vous pouvez mesurer votre accord, et ce nombre est un plafond pour l'assistant : aucun outil ne peut être jugé plus finement que ce que permet le corrigé. Mais l'accord brut vous flatte. Si 90 % des alertes sont bénignes et que vous dites tous les deux « bénigne » presque à chaque fois, vous serez d'accord sur la plupart des éléments par simple hasard.

Le **kappa de Cohen** corrige cela. Il compare l'accord observé, *p*o, à l'accord attendu par hasard d'après la fréquence à laquelle chacun a utilisé chaque étiquette, *p*e : kappa = (*p*o − *p*e) ÷ (1 − *p*e). Un kappa de 1 est un accord parfait, 0 n'est pas mieux que le hasard, et en dessous de 0 c'est pire que le hasard. Si le vôtre est bas, corrigez le guide d'étiquetage avant de noter quoi que ce soit.

@code label-agreement

?? Pourquoi étiqueter votre jeu de test avant de lancer l'assistant ?
+ Pour que ses réponses n'influencent en rien vos propres étiquettes
- Parce qu'étiqueter après coup coûte toujours bien plus cher ensuite
- Pour que le modèle puisse lire vos étiquettes en premier
- Parce que les étiquettes expirent au bout de quelques jours
=> Voir une réponse ancre votre jugement. Un étiquetage à l'aveugle garde le score honnête.

## La précision et le rappel, lentement

Tout part de quatre comptes :

| | Vraiment malveillant | Vraiment bénin |
|---|---|---|
| **Dit malveillant** | Vrai positif (VP) | Faux positif (FP) |
| **Dit bénin** | Faux négatif (FN) | Vrai négatif (VN) |

- Précision = VP ÷ (VP + FP). Regardez la ligne du haut.
- Rappel = VP ÷ (VP + FN). Regardez la colonne de gauche.

Pourquoi ne pas simplement utiliser l'exactitude ? Supposons que 1 % des alertes soient malveillantes. Un assistant qui répond « bénin » à chaque fois obtient 99 % d'exactitude et n'attrape rien. C'est pourquoi l'exactitude seule induit en erreur en sécurité.

@drill pr-calc

?? Un assistant d'alertes signale 10 alertes comme malveillantes, et 8 le sont vraiment. Il y en avait 16 en tout. Quel est son rappel ?
+ 50 %, puisqu'il en a trouvé 8 sur 16
- 80 %, puisque 8 sur 10 étaient bien justes
- 100 %, puisqu'il en a déjà bien trouvé certaines
- 62 %, puisqu'il en a manqué six sur seize
=> Le rappel, c'est ce qui a été trouvé divisé par le total des vrais cas : 8 / 16. Les 80 % sont sa précision.

## Notez un assistant

@range evals

## Les échecs sont la partie utile

Un score seul ne dit pas quoi corriger. Nommez donc chaque échec : mauvais outil, mauvais contexte, fait inventé, journal mal lu. Cette **taxonomie des échecs** vous donne votre liste d'améliorations. Relancez le même jeu de test après chaque changement, comme **test de non-régression**, car la correction d'une chose en casse souvent une autre.

Compter les échecs par catégorie transforme un tas de mauvaises réponses en liste de tâches, rangée par ce qui vous coûte le plus :

@code failure-taxonomy

Une exécution de non-régression compare élément par élément, pas seulement les totaux. Le même score global peut cacher cinq éléments qui se sont mis à marcher et cinq qui ont cessé de marcher.

@code regression-diff

N'oubliez pas le coût. Notez les tokens et le temps par élément, car un outil meilleur de 2 % et dix fois plus cher n'est peut-être pas meilleur du tout.

Mettez le coût à côté de l'exactitude et calculez ce que coûte une bonne réponse :

| | Exactitude | Tokens pour 4 alertes | Coût par bonne réponse | Secondes par alerte |
|---|---|---|---|---|
| Petit modèle | 75 % | 4 000 | 0.67 | 2.0 |
| Grand modèle | 100 % | 40 000 | 5.00 | 11.0 |

À un prix d'exemple de 0.50 les mille tokens, le grand modèle a raison plus souvent et coûte plus de sept fois plus cher par bonne réponse, et il est cinq fois plus lent. Que cela en vaille la peine dépend de ce que vous coûte une alerte manquée, et c'est une décision pour des personnes, prise avec ces chiffres sous les yeux.

@code cost-per-correct

N'importe qui peut dire « j'utilise beaucoup l'IA ». Très peu de juniors peuvent dire « il était d'accord avec mes verdicts sur 84 % de 120 alertes, et voici les 19 cas où il s'est trompé avec assurance ».

?? Vous changez un prompt, et cinq échecs disparaissent. Que devez-vous faire avant d'y croire ?
+ Relancer tout le jeu pour repérer de nouveaux échecs
- Crier victoire et supprimer les anciens cas de test
- Effacer ensuite tous les échecs du fichier de résultats
- Essayer une seule fois le nouveau prompt en démo
=> Les corrections ont des effets de bord, et les modèles varient. Seul le jeu complet, répété, montre un vrai gain.

## Garder un humain dans la boucle

Une évaluation vous dit aussi où un assistant peut agir seul. Les tâches à forte confiance et faible dommage peuvent être automatisées. Tout ce qui est irréversible, comme désactiver un compte, devrait avoir un **humain dans la boucle**. Concevez cela comme une vraie décision, avec les preuves montrées à la personne, et non comme un bouton sur lequel tout le monde clique sans lire.

?? Quel est le risque d'une étape d'approbation humaine où les gens approuvent des centaines d'éléments par jour ?
+ Ils cessent de lire et approuvent machinalement
- Le modèle d'IA devient beaucoup plus lent
- Approuver est illégal pour les tâches automatisées
- Les humains rejettent toujours chaque demande reçue
=> La fatigue de l'approbation transforme une mesure en formalité. C'est encore la fatigue des alertes, alors gardez les demandes rares et significatives.

## Relire une évaluation

Le résumé d'évaluation d'un collègue dit :

```
Jeu de test : 40 alertes, étiquetées après avoir vu les réponses de l'assistant
Résultat :    exactitude de 97,5 %
Changement :  le nouveau prompt v2 a corrigé 3 échecs, donc v2 est meilleur
```

?? Qu'est-ce qui ne va pas avec le jeu de test ?
+ Les étiquettes ont été posées après ses réponses
- Quarante alertes, c'est vraiment bien trop à étiqueter
- Les alertes ne servent jamais d'éléments de test
- Les étiquettes doivent toujours être écrites par l'assistant
=> Voir la réponse d'abord tire vos étiquettes vers elle. Étiquetez à l'aveugle, et utilisez plus d'éléments si vous le pouvez : 40 laissent une large plage de vrais scores plausibles.

?? Pourquoi 97,5 % d'exactitude ne suffisent-ils pas pour le juger ?
+ Cela cache combien d'attaques réelles ont été manquées
- L'exactitude est toujours calculée de la mauvaise façon
- Au-delà de 95 %, l'exactitude n'a aucun sens
- L'exactitude ne peut se mesurer qu'en vraie production
=> Si 39 des 40 alertes étaient bénignes, répondre « bénigne » à chaque fois donne 97,5 %. Rapportez la précision et le rappel pour la classe malveillante.

?? Que faut-il vérifier avant de dire que v2 est meilleur ?
+ S'il a cassé des éléments qui passaient bien avant
- Si v2 a un prompt système plus long qu'avant
- Si le collègue préfère nettement le ton de v2
- Si v2 a été écrit par un ingénieur expérimenté
=> Trois éléments corrigés veulent dire peu de chose si quatre autres ont cassé. Comparez les deux exécutions élément par élément, sur tout le jeu.

?! Nommez une tâche de votre propre voie pour laquelle un assistant d'IA pourrait aider. Quelle serait votre vérité de référence ?

### Pour aller plus loin

Les sources primaires et le meilleur matériel gratuit sur ce sujet, tous vérifiés en novembre 2026 (en anglais) :

- [Google ML Crash Course : exactitude, précision et rappel](https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall)
