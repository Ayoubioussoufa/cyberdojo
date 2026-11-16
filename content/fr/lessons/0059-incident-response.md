---
title: Réponse aux incidents
summary: Que faire quand c'est réel : les playbooks, les compromis du confinement, les preuves, la communication et le rapport, d'après les recommandations actuelles du NIST.
builds: mener un incident simulé et écrire le rapport
source: NIST SP 800-61 Rev. 3 (en anglais) | https://csrc.nist.gov/pubs/sp/800/61/r3/final
words: confinement, éradication, chaîne de traçabilité
---
La détection vous dit que quelque chose ne va pas. La réponse aux incidents décide de la suite, le plus souvent sous pression, avec des informations incomplètes, et sous le regard de l'entreprise. Les équipes qui le font bien ne sont pas composées de gens plus calmes. Elles se sont préparées, l'ont écrit et se sont entraînées.

@term incident = Un événement qui nuit réellement à la sécurité des systèmes ou des données, ou qui la menace.
@term confinement = Empêcher une attaque de s'étendre ou de causer plus de dégâts.
@term éradication = Retirer l'accès et les outils de l'attaquant.
@term chaîne de traçabilité = Un registre de qui a manipulé une preuve, et quand.
@term cause profonde = La raison de fond pour laquelle un incident a été possible.
@term exercice sur table = Une répétition d'incident menée sous forme de discussion.
@term Velociraptor = Un outil gratuit pour collecter des preuves et mener des recherches sur les postes.
@term commandant d'incident = La personne qui coordonne une réponse et veille à ce que les décisions soient prises.
@term revue sans reproche = Un retour sur un incident qui demande ce qui a échoué, pas qui punir.
@term mouvement latéral = Un attaquant qui passe d'un système à un autre à l'intérieur d'un réseau.

## Les recommandations actuelles

Le [NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final), publié en avril 2025, remplace la Rev. 2 et rattache la réponse aux incidents au [CSF 2.0](https://www.nist.gov/cyberframework) : se préparer et s'améliorer concernent toute l'organisation, pas seulement l'équipe de sécurité. Vous verrez encore les étapes classiques ci-dessous dans beaucoup de playbooks, alors apprenez-les aussi.

@flow Préparer > Détecter et analyser > Confiner > Éradiquer > Rétablir > Apprendre

| Phase | Ce qui se passe | Exemple |
|---|---|---|
| Préparer | Des plans, des outils, des contacts, de l'entraînement | Une sauvegarde testée, une liste de téléphones sur papier |
| Détecter et analyser | Est-ce réel ? Jusqu'où est-ce allé ? | Votre triage du Mois 9 |
| Confiner | Empêcher que cela empire | Isoler un portable, désactiver un compte |
| Éradiquer | Retirer la prise de l'attaquant | Supprimer la persistance, corriger le point d'entrée |
| Rétablir | Revenir à la normale sans risque | Restaurer depuis des sauvegardes saines, surveiller de près |
| Apprendre | S'améliorer | Une revue avec des actions et des responsables |

@drill ir-phase

?? Quel est le meilleur moment pour écrire qui peut autoriser l'arrêt d'un serveur de production ?
+ Bien avant que le moindre incident ne survienne
- Pendant l'incident, dès que l'attaque a bien commencé
- Après l'incident, au moment d'écrire le rapport final
- Seulement quand un régulateur vous le demande expressément
=> Sous pression, les décisions sont lentes et mauvaises. Se préparer, c'est les avoir déjà prises.

## Les playbooks

Un playbook est une recette pour un type d'incident. Voici, en bref, les quatre que demande la feuille de route :

| Incident | Premiers gestes | À ne pas oublier |
|---|---|---|
| **Hameçonnage** | Retirer le message, bloquer le domaine | Qui a cliqué ? Réinitialisez leurs mots de passe |
| **Rançongiciel** | Isoler les hôtes, protéger les sauvegardes | Les attaquants volent souvent les données d'abord |
| **Compte compromis** | Révoquer les sessions, réinitialiser, exiger la MFA | Chercher les nouvelles règles, clés et connexions |
| **BEC** | Appeler la comptabilité, contacter vite la banque | Les règles de boîte de réception qui cachent les réponses |

Un playbook mérite sa place quand quelqu'un peut le suivre à 3 heures du matin sans rien demander à personne. Écrit en entier, celui du compte compromis ressemble à ceci :

| Partie | Ce qu'elle dit |
|---|---|
| **Déclencheur** | Une alerte ou un signalement : quelqu'un d'autre que le titulaire utilise un compte |
| **Les 15 premières minutes** | Révoquer les sessions du compte, réinitialiser le mot de passe, vérifier que l'appareil MFA est celui du titulaire |
| **Collecter** | Trente jours de journaux de connexion, les règles de la boîte aux lettres, les nouvelles clés et mots de passe d'application, les appareils récemment enregistrés |
| **Périmètre** | Chaque système auquel ce compte s'est connecté depuis la première mauvaise connexion |
| **Éradiquer** | Retirer les règles, les clés et les appareils que le titulaire ne reconnaît pas |
| **Rétablir** | Le titulaire se reconnecte, et le compte est surveillé de près pendant deux semaines |
| **Terminé quand** | Aucune connexion inexpliquée pendant 14 jours, et la cause profonde est écrite |

La dernière ligne est celle que la plupart des playbooks oublient. Sans fin écrite, un incident se clôt trop tôt, parce que tout le monde est fatigué, ou ne se clôt jamais.

Un incident a aussi besoin de rôles. Un **commandant d'incident** coordonne et surveille l'heure, pendant que d'autres enquêtent, et quelqu'un prend des notes. Si tout le monde enquête, personne ne décide.

?? Un compte a été compromis, et vous avez réinitialisé son mot de passe. Pourquoi cela ne suffit-il pas ?
+ Des sessions volées et de nouvelles clés peuvent survivre
- Le nouveau mot de passe s'applique après une semaine
- Ce changement de mot de passe prévient aussitôt l'attaquant
- Le compte garde toujours son ancien mot de passe
=> Un jeton de session ou une nouvelle clé d'accès peut survivre à un mot de passe. Révoquez aussi les sessions et cherchez la persistance.

## Le confinement est un compromis

| Choix | Bénéfice | Coût |
|---|---|---|
| Isoler tout de suite | Arrête les dégâts | Peut alerter l'attaquant |
| Observer un moment | Connaître toute l'étendue | Risque de dégâts supplémentaires |
| Couper l'alimentation | Arrête tout | Détruit les preuves en mémoire |

Avant d'isoler quoi que ce soit, trouvez ce qu'il faut isoler. Partez du premier hôte que vous savez compromis et de l'heure à laquelle c'est arrivé, puis suivez les connexions vers l'extérieur. Une connexion partie d'un hôte compromis, après sa compromission, fait entrer la destination **dans le périmètre**, et la recherche continue à partir de là. C'est ainsi qu'on retrace un **mouvement latéral**.

| Heure (UTC) | Compte | Depuis | Vers |
|---|---|---|---|
| 08:10 | `ana` | `HR-LAP-12` | `MAIL-01` |
| 09:05 | `ana` | `HR-LAP-12` | `FILE-01` |
| 09:40 | `svc_backup` | `FILE-01` | `DB-02` |
| 10:15 | `li` | `DEV-07` | `DB-02` |

Disons que `HR-LAP-12` a été compromis à 09:00. `FILE-01` est dans le périmètre à partir de 09:05, et `DB-02` à partir de 09:40. `MAIL-01` n'y est pas, parce que cette connexion a eu lieu avant la compromission, et `DEV-07` non plus, parce que rien de ce qui est dans le périmètre ne s'y est jamais connecté. Dans le périmètre veut dire « à vérifier », pas « compromis ». Isoler un portable alors que l'attaquant est déjà sur le serveur de fichiers ne confine rien.

@code hosts-in-scope

Qui décide ? C'est une décision de direction, documentée, et non la préférence d'un analyste. Elle pèse l'impact sur l'activité, les obligations légales et les preuves.

?? Un rançongiciel est trouvé sur trois serveurs. Quelle est la première priorité ?
+ Le confirmer, puis confiner en préservant les preuves
- Effacer et reconstruire immédiatement tous les serveurs touchés
- Payer rapidement la rançon avant qu'elle augmente encore
- Annoncer publiquement la violation avec tous les détails
=> Tout effacer détruit ce dont vous avez besoin pour comprendre l'étendue et la cause profonde. Confinez d'abord, puis rétablissez depuis des sauvegardes validées.

## Les preuves

Notez ce que vous avez fait, quand et pourquoi, avec des heures en **UTC**. Calculez l'empreinte de ce que vous collectez. Tenez une **chaîne de traçabilité**, qui ressemble à ceci :

| Élément | Empreinte | Collecté par | Quand (UTC) | Remis à |
|---|---|---|---|---|
| Mémoire de HR-LAP-12 | `a41f…` | S. Alami | 2026-10-27 10:02 | Dépôt des preuves, 10:30 |

Collectez dans l'**ordre de volatilité** : ce qui disparaît le plus vite passe en premier. La [RFC 3227](https://www.rfc-editor.org/rfc/rfc3227) donne cet ordre.

| Ordre | Quoi | Combien de temps cela dure |
|---|---|---|
| D'abord | La mémoire, les processus en cours, les connexions réseau ouvertes | Perdu à l'extinction |
| Ensuite | Les fichiers temporaires, et les journaux de la machine qui tournent | Écrasés en quelques heures ou quelques jours |
| Ensuite | Le disque | Survit à une extinction |
| Enfin | Les sauvegardes, et les journaux déjà envoyés vers un dépôt central | Conservés des mois |

C'est pourquoi « couper l'alimentation » coûte si cher dans le tableau plus haut : cela détruit la première ligne.

Calculez l'empreinte de chaque élément au moment où vous le collectez, et gardez l'empreinte à part de l'élément :

```
sha256sum memory.raw > memory.raw.sha256
sha256sum -c memory.raw.sha256
```

La première commande écrit l'empreinte dans un petit fichier. La seconde la recalcule et compare : elle affiche `memory.raw: OK` tant que le fichier est inchangé, et `FAILED` dès qu'un seul bit diffère. Celui qui reçoit la preuve plus tard lance le même contrôle, et c'est ce qui permet à un rapport d'affirmer que le fichier analysé est le fichier collecté.

@code evidence-intact

Une règle pratique du Mois 2 s'applique : notez ce qui est **confirmé** et ce qui est **soupçonné**, et ne laissez jamais l'un devenir l'autre à force de répétition.

?? Pourquoi une équipe de réponse note-t-elle tout en UTC ?
+ Pour que les journaux de lieux différents s'alignent
- Parce que la loi de chaque pays l'exige
- Pour que les attaquants ne puissent rien lire
- Parce qu'un ordinateur stocke mal les heures locales
=> Des systèmes situés dans des fuseaux horaires différents ne racontent une seule histoire que si l'horloge est commune.

## Reconstituez l'histoire

Les journaux ne sont pas d'accord sur l'heure. Un pare-feu écrit `2026-10-27T10:02:11+01:00`, et un service cloud écrit `2026-10-27T09:01:40+00:00`. Ce qui suit les secondes est le **décalage** par rapport à UTC : `+01:00` signifie que l'horloge locale a une heure d'avance, donc vous retirez une heure pour obtenir l'heure UTC. Triée telle qu'elle est écrite, la ligne du pare-feu semble arriver une heure après la connexion. En UTC, il est 09:02:11, soit 31 secondes après. Convertissez tout d'abord, puis triez.

@code merge-timeline

À vous maintenant. Trois journaux, un seul incident. Fusionnez-les, trouvez le premier contact, et déterminez l'étendue.

@range timeline

## La communication

Un incident est aussi un problème de communication.

| Public | Besoins |
|---|---|
| Dirigeants | L'impact, le risque, les décisions attendues, l'heure du prochain point |
| Juridique | Les faits, quelles données, quelles échéances s'appliquent |
| Clients | Ce qui s'est passé, quoi faire, en mots simples |
| Régulateurs | Ce que la loi exige, dans les délais |

Un point de situation a une forme fixe, pour que personne n'ait à en inventer une sous pression :

```
Situation à 11:30 UTC. Incident 2026-014, gravité élevée.
Connu : un compte volé a été utilisé sur un portable RH et un serveur de fichiers à partir de 09:00 UTC.
Inconnu : si des fichiers ont été copiés vers l'extérieur.
En cours : les deux hôtes sont isolés, le compte est réinitialisé, les journaux d'accès aux fichiers sont à l'étude.
Attendu de vous : une décision sur l'information du personnel concerné aujourd'hui.
Prochain point : 12:30 UTC.
```

Dites ce que vous ne savez pas. Un point qui ne liste que ce qui est connu laisse les gens combler les vides eux-mêmes, et ils les comblent avec le pire cas ou le meilleur. Donnez aussi toujours l'heure du prochain point, pour que personne n'interrompe les intervenants pour en demander un.

Certaines lois fixent des échéances : selon le RGPD, une violation de données personnelles à notifier doit l'être à l'autorité de contrôle dans les 72 heures après en avoir pris connaissance. L'horloge démarre quand vous en prenez connaissance, pas quand la violation a commencé, et elle ne s'arrête pas le week-end. Écrivez donc dans le journal l'heure à laquelle vous en avez pris connaissance, à ce moment-là, car l'échéance se compte à partir d'elle.

@code breach-clock

Partez du principe qu'un attaquant peut lire votre messagerie pendant un incident, et utilisez un canal séparé.

?? Un attaquant contrôle votre serveur de messagerie. Comment l'équipe de réponse doit-elle communiquer ?
+ Sur un canal séparé, mis en place à l'avance
- Par courriel, avec les deux mentions urgent et confidentiel
- Sur la messagerie interne qui utilise ces mêmes comptes
- En répondant à la demande de rançon de l'attaquant
=> S'il peut lire vos plans, il agira le premier. Un canal hors bande, prévu d'avance, fait partie de la préparation.

## Après l'incident

C'est dans la réunion de retour d'expérience que se trouve la valeur. Menez-la **sans reproche** : les gens cachent leurs erreurs quand ils craignent une sanction, et vous avez besoin de la vérité. Demandez « pourquoi » jusqu'à atteindre la **cause profonde**, qui est rarement « un utilisateur a cliqué ». Donnez à chaque action un responsable et une date. Le [modèle de rapport d'incident](/guides/n1-templates/) en donne la structure : résumé, chronologie en UTC, étendue, cause profonde, impact, actions et leçons.

::: try Menez-en un
Dans votre labo, demandez à un ami ou à un script de réaliser une intrusion simulée simple. Répondez de bout en bout avec [Velociraptor](https://docs.velociraptor.app/), puis écrivez le rapport. Utilisez un [kit d'exercice sur table de la CISA](https://www.cisa.gov/resources-tools/services/cisa-tabletop-exercise-packages) pour répéter avec des amis. Pour un parcours guidé complet, essayez la [machine Harbor](/machines/harbor/).
:::

?? Une revue conclut que « l'utilisateur a cliqué sur un lien ». Pourquoi n'est-ce pas une cause profonde ?
+ Elle ne dit pas pourquoi un clic a suffi
- Les utilisateurs ne sont jamais impliqués dans un incident
- Une cause profonde doit toujours nommer un éditeur logiciel
- Cliquer sur un lien est impossible sur ces ordinateurs
=> Quelqu'un cliquera toujours. Demandez pourquoi le message est arrivé, pourquoi la page a pu prendre un mot de passe, et pourquoi un seul mot de passe a suffi pour entrer. Ces réponses-là, vous pouvez les corriger.

## Relire une réponse

Un collègue vous tend ses notes de la nuit dernière et vous demande ce que vous auriez fait autrement.

```
14:05 UTC  Alerte : demande de rançon trouvée sur FILE-01.
14:10 UTC  Extinction de FILE-01, FILE-02 et DB-02.
14:20 UTC  Courriel à tout le personnel au sujet de l'attaque.
15:00 UTC  Début de la restauration de FILE-01 depuis la sauvegarde de la nuit dernière.
```

?? Qu'a fait perdre l'action de 14:10 ?
+ Les preuves contenues dans la mémoire de ces serveurs
- Les fichiers stockés sur les disques de ces serveurs
- Les sauvegardes conservées à part dans un autre lieu
- Les journaux qui étaient déjà envoyés vers le SIEM
=> La mémoire disparaît à l'extinction, et elle contient souvent le logiciel malveillant en cours d'exécution et ses connexions. Couper ces serveurs du réseau aurait arrêté la propagation tout en la conservant.

?? Pourquoi la restauration de 15:00 est-elle un risque ?
+ La sauvegarde contient peut-être déjà l'accès de l'attaquant
- Une sauvegarde ne se restaure que la nuit
- Restaurer prend toujours plus longtemps que tout reconstruire
- La note de rançon interdit absolument toute restauration
=> Les attaquants sont souvent présents des jours avant que le rançongiciel ne s'exécute, donc la sauvegarde de la nuit dernière porte peut-être leur accès. Personne n'a encore trouvé le point d'entrée non plus. Vérifiez la sauvegarde et fermez d'abord le point d'entrée.

?? Les fichiers contenaient des dossiers du personnel, et l'équipe a pris connaissance de la violation à 14:05 UTC le 27 octobre 2026. Quand la fenêtre de 72 heures se ferme-t-elle ?
+ `2026-10-30 14:05`
- `2026-10-29 14:05`
- `2026-10-30 00:00`
- `2026-11-01 14:05`
=> Soixante-douze heures font trois jours à la minute près, comptés depuis la prise de connaissance. On n'arrondit pas à minuit, et on ne saute aucun jour.

?! Écrivez un résumé pour la direction, en cinq phrases et sans jargon, d'un incident d'hameçonnage imaginaire.
