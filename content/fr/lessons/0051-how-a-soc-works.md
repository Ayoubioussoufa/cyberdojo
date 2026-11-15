---
title: Comment fonctionne un SOC
summary: Niveaux, équipes en roulement, cycle de vie d'une alerte, verdicts, escalade, et comment mener une alerte jusqu'à une conclusion écrite, preuves à l'appui.
builds: trier une alerte jusqu'à un verdict écrit
source: Parcours SOC Level 1 de TryHackMe (en anglais) | https://tryhackme.com/path/outline/soclevel1
words: triage, fatigue d'alerte, escalade
---
Analyste SOC reste la porte d'entrée la plus courante dans ce métier. Un **SOC**, ou centre des opérations de sécurité, est l'équipe qui surveille les systèmes d'une organisation et réagit quand quelque chose paraît anormal. Ce sont, très littéralement, des tâches du premier jour. Même si vous finissez ailleurs, c'est ce qui vous apprend ce que voient vraiment les défenseurs.

@term triage = Décider rapidement de la gravité d'une alerte et de la suite à lui donner.
@term alerte = Une notification disant qu'une règle de détection a correspondu à quelque chose.
@term fatigue d'alerte = Quand trop d'alertes de faible valeur font que les gens cessent d'y prêter attention.
@term escalade = Transmettre un dossier à quelqu'un qui a plus de compétences ou d'autorité.
@term SLA (accord de niveau de service) = Un délai promis, par exemple trier les alertes critiques en 15 minutes.
@term playbook = Un ensemble d'étapes écrites pour traiter un type d'alerte ou d'incident.
@term verdict = La conclusion sur une alerte, avec les preuves qui la fondent.
@term positif bénin = Une alerte qui a correctement signalé le comportement, mais le comportement était autorisé.
@term passation de consignes = Le résumé écrit et oral qu'une équipe donne à la suivante à la fin de son service.

## Une matinée dans la file

Il est 09:00. Vous ouvrez une file de tickets, c'est-à-dire une liste d'alertes qui attendent quelqu'un. Il y en a 40. Trois sont marquées hautes. Chacune est une affirmation faite par un logiciel : « ceci a l'air mauvais ». Votre travail est de découvrir si l'affirmation est vraie.

Vous ne pouvez pas enquêter en profondeur sur les 40. Vous ne pouvez pas non plus en ignorer une seule. Vous faites donc ce que font les urgences d'un hôpital : du **triage**. Regardez chacune rapidement, décidez de son urgence, et passez votre temps là où il compte.

L'ordre n'est pas une impression. La plupart des files trient de la même façon : les plus graves d'abord, et à gravité égale, celle qui attend depuis le plus longtemps. Un système de tickets le fait pour vous, et écrire la règle une fois montre qu'il n'y a rien de plus.

@code triage-order

?? Pourquoi un analyste SOC n'enquête-t-il pas à fond sur chaque alerte ?
+ Le temps est limité, donc l'urgence fixe l'ordre
- La plupart des alertes sont illégales à examiner
- Seuls les responsables peuvent lire une alerte entière
- Les alertes s'effacent toutes seules après quelques minutes
=> Le triage consiste à bien utiliser une attention limitée. Chaque alerte reçoit un regard, et les dangereuses reçoivent la profondeur.

## L'équipe

| Niveau | Travail typique | Voyez-le comme |
|---|---|---|
| Niveau 1 | Surveiller la file, trier les alertes, clore ou escalader | L'infirmier des urgences |
| Niveau 2 | Enquête plus poussée, périmètre, confinement | Le médecin qui fait les examens |
| Niveau 3 | Chasse aux menaces, réglage des détections, cas les plus durs | Le spécialiste |

Beaucoup d'équipes travaillent en roulement pour couvrir les 24 heures. À la fin de chaque service vient une **passation de consignes** : ce qui est ouvert, ce que vous avez tenté, ce qu'il faut surveiller. Une mauvaise passation fait perdre des heures. Comme le dit [le guide sur l'IA](/guides/d1-ai-what-changed/), le travail routinier du niveau 1 est en cours d'automatisation, donc visez la détection et la réponse.

?? Un analyste de niveau 1 trouve des preuves qu'un attaquant passe d'un serveur à l'autre. Quel est le bon geste ?
+ Escalader au niveau 2, avec ses preuves jointes
- Continuer d'enquêter tout seul jusqu'au départ de l'attaquant
- Clore l'alerte, le niveau 1 ne pouvant agir
- Attendre que la prochaine équipe vienne s'en occuper
=> Escalader tôt avec des preuves, c'est le métier. Ce n'est pas un échec. Le niveau 2 a l'autorité et les outils pour confiner.

## Le cycle de vie d'une alerte

@flow L'alerte se déclenche > Triage > Enquête > Verdict > Clore, régler ou escalader > Documenter

Une alerte se termine par l'une de quatre étiquettes. Apprenez-les exactement, car chaque entretien les demande.

| | Le comportement était vraiment malveillant | Il ne l'était pas |
|---|---|---|
| **Une alerte s'est déclenchée** | Vrai positif | Faux positif |
| **Aucune alerte ne s'est déclenchée** | Faux négatif | Vrai négatif |

Il existe un cinquième cas utile. Un **positif bénin**, c'est quand la règle avait raison sur le comportement mais que le comportement était permis, comme un administrateur qui lance un balayage pour lequel il avait une approbation.

Les cinq étiquettes viennent de trois questions à réponse oui ou non : le comportement était-il malveillant, une alerte s'est-elle déclenchée, et le comportement était-il autorisé ? Elles peuvent donc s'écrire exactement, ce qui est un bon test pour savoir si vous les connaissez vraiment.

@code alert-label

::: trap Les faux négatifs sont invisibles
Personne n'ouvre de ticket pour l'attaque qu'aucune règle n'a attrapée. Une file calme ne prouve pas que vous êtes en sécurité. C'est pourquoi la chasse et les tests existent.
:::

?? Votre règle « nouveau compte d'administrateur » se déclenche, et l'informatique confirme l'avoir créé par un ticket approuvé. Quelle étiquette convient ?
+ Positif bénin, un comportement correct mais autorisé
- Vrai positif, une attaque réelle en cours
- Faux négatif, l'attaque n'a produit aucune alerte
- Vrai négatif, rien n'est arrivé ni déclenché
=> La règle a fait ce qu'elle devait. Le comportement avait simplement une raison légitime.

## Le triage, étape par étape

1. **Lire l'alerte.** Quelle règle s'est déclenchée, sur quel hôte et quel utilisateur, et quand ?
2. **Réunir le contexte.** Est-ce un serveur ou un portable ? Qui est l'utilisateur ? L'activité est-elle normale pour lui ?
3. **Former une hypothèse.** « Ce peut être un script d'administration, ou ce peut être un attaquant. »
4. **Chercher des preuves.** Que s'est-il passé avant et après ? Quel processus l'a lancé ? Y a-t-il eu une connexion sortante ?
5. **Arriver à un verdict.** Vrai positif, faux positif ou bénin. Énoncez les preuves et votre niveau de confiance.
6. **Agir et documenter.** Escalader, confiner ou régler, et écrire pourquoi.

En voici une, traitée de bout en bout.

```
ALERT  Encoded PowerShell     Host: HR-LAP-12     User: sara     09:14 UTC
```

- **Contexte :** un portable des RH. Sara n'écrit pas de scripts, c'est donc un peu étrange.
- **Hypothèse :** un attaquant, ou l'outil de déploiement. Les deux utilisent des commandes encodées.
- **Preuves :** le processus parent est l'agent de déploiement signé, il tourne chaque mardi à 09:14, et la commande se décode en script d'inventaire approuvé.
- **Verdict :** bénin.

En voici maintenant une qui finit autrement, pour que vous ayez vu les deux issues.

```
ALERT  Login from new country     User: marc     Source: 203.0.113.80     02:41 UTC
```

- **Contexte :** Marc travaille à la finance. Son agenda ne montre aucun voyage, et 02:41 est le milieu de sa nuit.
- **Hypothèse :** un voyage que personne n'a noté, un VPN, ou un mot de passe volé.
- **Preuves :** la même adresse a échoué 14 fois avant de réussir. Six demandes de MFA ont été envoyées, et la sixième a été approuvée. Trois minutes plus tard, une règle de boîte aux lettres a commencé à transférer tout son courrier vers une adresse extérieure.
- **Verdict :** vrai positif. Chaque fait a une explication innocente pris seul. Ensemble, ils n'en ont pas.

Le verdict n'est pas la fin de votre part. Celui-ci part au niveau 2, et ce que vous envoyez décide de la vitesse à laquelle ils peuvent agir :

```
CE QUE JE SAIS      marc s'est connecté depuis 203.0.113.80 à 02:41 UTC après 14 échecs et 6 demandes de MFA.
                    À 02:44, une règle de boîte aux lettres a commencé à transférer tout le courrier vers l'extérieur.
CE QUE J'AI FAIT    Vérifié son agenda : aucun voyage. Joint les entrées des journaux de connexion et d'audit.
CE QUI RESTE        Ses sessions sont encore actives. Je n'ai pas désactivé le compte.
                    Inconnu : quels messages ont déjà été transférés.
DEMANDE             Révoquer les sessions et réinitialiser les identifiants maintenant.
```

Quatre rubriques, et le lecteur sait ce qui s'est passé, ce qu'il peut sauter, ce qui est encore dangereux et ce que vous attendez de lui.

::: key Écrivez le verdict pour que quelqu'un d'autre puisse le vérifier
Mauvais : « ça a l'air bon, clos ». Bon : « PowerShell encodé sur HR-LAP-12 à 09:14 UTC. Le parent est l'agent de déploiement signé, à son horaire normal, et la commande se décode en script d'inventaire approuvé. Bénin. Aucune action. »
:::

@drill triage

?? Une alerte se déclenche pour une connexion depuis un nouveau pays. Que devez-vous faire en premier ?
+ Réunir le contexte sur l'utilisateur et la connexion
- Désactiver le compte tout de suite, puis enquêter
- La clore, car les gens voyagent très souvent
- Redémarrer le portable de l'utilisateur, par simple précaution
=> Le contexte décide de tout : un VPN, un déplacement professionnel, ou un mot de passe volé. Agir avant de comprendre peut nuire à l'entreprise, et clore sans vérifier peut manquer une attaque.

## Gravité et escalade

Toutes les alertes ne méritent pas la même vitesse. Les équipes l'écrivent à l'avance, souvent sous forme de **SLA** :

| Gravité | Exemple | Triage sous |
|---|---|---|
| Critique | Comportement de rançongiciel sur un serveur | 15 minutes |
| Haute | Compte d'administrateur utilisé depuis un nouveau pays | 1 heure |
| Moyenne | Malware bloqué sur un portable | 4 heures |
| Basse | Une seule rafale d'échecs de connexion | Le jour ouvré suivant |

Ces délais sont des exemples : chaque organisation fixe les siens. Dans le doute, escaladez, et dites ce que vous savez, ce que vous ne savez pas, et ce que vous avez déjà fait.

Une horloge tourne sur chaque alerte ouverte, et une file peut vous dire lesquelles ont déjà dépassé leur délai. Quand vous savez depuis combien de temps chaque alerte attend, le contrôle est une recherche et une comparaison.

@code sla-breaches

?? Quand vous escaladez, qu'est-ce qui rend la passation utile ?
+ Ce que vous savez, avez tenté, et ce qui reste
- Un court message qui dit que cela a l'air grave
- L'alerte brute, transférée sans y ajouter la moindre note utile
- Une demande pour qu'on vous rappelle un peu plus tard
=> La personne suivante ne devrait jamais avoir à refaire votre travail. Des faits, des actions et des questions ouvertes font gagner des heures.

## Mesurer un SOC

| Indicateur | Signification |
|---|---|
| MTTD | Temps moyen de détection : du début de l'attaque au moment où on la remarque |
| MTTR | Temps moyen de réponse : du moment où on la remarque à celui où on l'arrête |
| Taux de faux positifs | La quantité de bruit que traversent les analystes |

Les chiffres peuvent tromper : clore des tickets vite n'est pas la même chose que les clore juste. Et trop de bruit cause la **fatigue d'alerte** : les gens se mettent à clore sans regarder, et la vraie attaque passe à l'intérieur du bruit. Réduire le bruit est une amélioration de la sécurité.

Les deux moyennes viennent de trois horodatages par incident : quand l'attaque a commencé, quand elle a été remarquée et quand elle a été arrêtée. Prenez deux incidents, avec des heures en minutes depuis le début de la journée :

| Incident | Début | Remarqué | Arrêté | Temps de détection | Temps de réponse |
|---|---|---|---|---|---|
| A | 100 | 160 | 190 | 60 | 30 |
| B | 400 | 420 | 520 | 20 | 100 |

Le MTTD est la moyenne de 60 et 20, donc 40 minutes. Le MTTR est la moyenne de 30 et 100, donc 65. Une moyenne cache beaucoup de choses : ici, un incident a été lent à remarquer et l'autre lent à arrêter, et les remèdes ne sont pas les mêmes.

@code mttd-mttr

?? Un responsable récompense celui qui clôt le plus d'alertes par heure. Quel est le résultat probable ?
+ Des clôtures bâclées qui manquent de vraies attaques
- Bien moins de vrais positifs dans les journaux
- Des attaquants découragés qui quittent enfin le réseau
- Une enquête bien plus poussée pour chaque alerte
=> Vous obtenez ce que vous mesurez. La vitesse seule récompense les verdicts négligents, donc mesurez aussi la qualité.

## La passation, c'est le travail

Vous finissez un service de nuit et le dossier de Marc est encore ouvert au niveau 2. Celui qui s'assoit après vous n'en sait rien. Deux questions sur ce que vous lui laissez.

?? Quelle ligne de la note d'escalade compte le plus pour quelqu'un qui la lit à 02:50 ?
+ Ses sessions sont encore actives en ce moment
- Son agenda ne montre aucun voyage cette semaine
- L'alerte s'est déclenchée à 02:41 UTC très précisément
- Marc travaille bien dans l'équipe finance de l'entreprise
=> Les autres lignes expliquent le passé. Celle-ci dit que l'attaquant peut encore agir, et c'est la seule chose qu'un lecteur peut changer.

?? Le responsable de Marc rappelle : Marc dormait chez lui. Quelle étiquette reçoit l'alerte ?
+ Vrai positif, malveillant, et l'alerte s'est bien déclenchée
- Positif bénin, correct, mais la connexion était autorisée
- Faux positif, la règle a vu de l'inoffensif
- Faux négatif, une attaque passée sans aucune alerte
=> Personne n'a autorisé cette connexion, elle n'est donc pas bénigne. La règle a vu un vrai comportement malveillant et l'a dit.

## S'exercer

@range triage

::: try La suite
[KC7](https://kc7cyber.com/) (en anglais) enseigne l'enquête par requêtes sous la forme d'un jeu gratuit à scénario. [LetsDefend](https://letsdefend.io/) (en anglais) simule une file d'alertes. Les deux figurent dans le [plan du mois 9](/roadmap/9/). Quand vous serez prêt pour une machine entière, essayez [Harbor](/machines/harbor/).
:::

?! Rédigez un verdict en trois phrases pour la mission que vous venez de terminer : ce qui s'est passé, vos preuves, et ce que vous feriez ensuite.
