---
title: Mener une évaluation des risques
summary: Les actifs, la probabilité et l'impact, le risque inhérent et le risque résiduel, les options de traitement et un registre des risques, dans la langue de l'entreprise.
builds: un registre des risques avec des propriétaires et des décisions de traitement
source: NIST SP 800-30 Rev. 1 (en anglais) | https://csrc.nist.gov/pubs/sp/800/30/r1/final
words: registre des risques, risque résiduel, appétence au risque
---
Les dirigeants n'achètent pas « CVSS 9.8 ». Ils décident d'argent, de clients, de droit et de réputation. Ce mois-ci, vous apprenez à parler cette langue. La GRC, pour gouvernance, risque et conformité, est aussi l'une des portes d'entrée les plus accessibles, surtout dans la banque, les télécoms et le conseil.

@term registre des risques = Un tableau qui liste les risques, leurs cotations, leurs propriétaires et leurs traitements.
@term risque inhérent = Le niveau de risque avant toute mesure de sécurité.
@term risque résiduel = Le risque qui reste après les mesures de sécurité.
@term appétence au risque = La quantité de risque qu'une organisation est prête à accepter.
@term traitement du risque = La décision de réduire, de transférer, d'éviter ou d'accepter un risque.
@term propriétaire du risque = La personne responsable qui décide comment un risque est traité.

## Des mots à ne pas confondre

Vous les avez rencontrés à la leçon 10. Ils doivent maintenant être exacts, parce qu'une évaluation des risques est construite avec eux.

| Mot | Sens | Exemple |
|---|---|---|
| **Actif** | Quelque chose qui a de la valeur | La base de données clients |
| **Menace** | Quelque chose qui pourrait causer un dommage | Un groupe de rançongiciel |
| **Vulnérabilité** | Une faiblesse qu'une menace pourrait utiliser | Un serveur sans correctifs |
| **Risque** | La probabilité et l'ampleur du dommage | Les commandes s'arrêtent une semaine |
| **Mesure** | Ce qui réduit le risque | Des sauvegardes hors ligne testées |

Un bon énoncé de risque les relie : « Un groupe de rançongiciel pourrait exploiter des serveurs sans correctifs pour arrêter le traitement des commandes, ce qui coûterait environ une semaine de chiffre d'affaires. » « Des serveurs sans correctifs », tout seul, est un constat, pas un risque.

?? Lequel de ces énoncés est écrit comme un risque plutôt que comme une vulnérabilité ?
+ Des portables volés pourraient exposer tous les dossiers clients
- Les portables des commerciaux n'ont aucun chiffrement de disque
- Le micrologiciel du pare-feu a deux versions de retard
- Plusieurs employés utilisent encore des mots de passe courts
=> Un risque dit qui ou quoi, par quelle faiblesse, mène à quel dommage. Les autres ne nomment qu'une faiblesse.

## Le processus

@flow Fixer le périmètre > Lister les actifs > Identifier menaces et faiblesses > Coter probabilité et impact > Décider du traitement > Désigner un propriétaire > Revoir

Définissez vos échelles **d'abord**. « Élevé » ne veut rien dire tant que tout le monde ne s'accorde pas sur son sens. Une grille 5×5 courante multiplie la probabilité par l'impact, et de bonnes échelles sont écrites en termes d'activité :

| Niveau | Probabilité | Impact |
|---|---|---|
| 1 | Moins d'une fois en 10 ans | Moins de 1 000 € |
| 3 | Environ une fois par an | Environ 50 000 €, ou une journée d'arrêt |
| 5 | Plusieurs fois par an | Menace la survie de l'entreprise |

Ces nombres sont des exemples. Votre organisation fixe les siens, et c'est son **appétence au risque** en pratique : ce qu'elle est prête à tolérer.

Le score est ensuite rangé dans des tranches, et chaque tranche dit qui doit agir et à quelle vitesse. Un jeu courant :

| Score | Tranche | Ce qu'elle déclenche |
|---|---|---|
| 1 à 4 | Faible | L'accepter, et le revoir une fois par an |
| 5 à 9 | Moyen | Un plan du propriétaire dans le trimestre |
| 10 à 16 | Élevé | Un plan sous un mois, rapporté à la direction |
| 17 à 25 | Critique | Une action immédiate, rapportée au conseil d'administration |

Une grille comme celle-ci est **qualitative** : ses nombres sont des rangs, pas des mesures. Un 20 n'est pas deux fois pire qu'un 10, et deux risques différents de même score ne sont pas égaux. La grille est bonne pour trier et mauvaise pour calculer.

@code risk-rating

@drill risk-calc

?? Deux analystes cotent le même risque « élevé » et « moyen ». Que manque-t-il le plus probablement ?
+ Des échelles écrites, avec chaque niveau défini
- Un outil de gestion des risques coûteux
- Une équipe plus nombreuse pour la cotation
- Une version récente de la norme CVSS
=> Sans échelles définies, les cotations sont des opinions. S'accorder sur le sens de chaque niveau est la première étape, pas un supplément.

## Inhérent et résiduel

Le **risque inhérent** ignore vos mesures. Le **risque résiduel** est ce qui reste après elles. L'écart entre les deux montre ce que vaut une mesure, ce qui vous permet de défendre son budget.

| Risque : un rançongiciel arrête les commandes | P | I | Score |
|---|---|---|---|
| Inhérent (aucune mesure) | 4 | 5 | 20 |
| Résiduel (EDR et sauvegardes hors ligne) | 2 | 3 | 6 |

Remarquez ce qui s'est passé. L'EDR a réduit la probabilité. Les sauvegardes ont réduit l'impact. Une mesure peut déplacer l'un ou l'autre nombre, et un score résiduel est une affirmation que vous devriez pouvoir prouver, par exemple avec une restauration testée.

?? Des sauvegardes sont ajoutées, et l'impact résiduel passe de 5 à 3. Qu'est-ce qui prouve que c'est vrai ?
+ Une restauration testée dans le délai convenu
- Le bon de commande du logiciel choisi
- Une brochure du fournisseur sur sa vitesse
- Le fait qu'aucun incident n'est encore arrivé
=> Une sauvegarde jamais restaurée est un espoir. La preuve transforme une cotation résiduelle en un nombre défendable.

## Lui donner un prix

Quand la décision porte sur de l'argent, un rang ne suffit pas. La méthode **quantitative** utilise trois nombres.

| Nombre | Sens | Exemple : un portable volé contenant des données clients |
|---|---|---|
| **SLE**, perte attendue pour un événement | Ce que cela coûte quand cela arrive une fois | 20 000 € |
| **ARO**, fréquence annuelle | Combien de fois par an vous l'attendez | 0.5, soit une fois tous les deux ans |
| **ALE**, perte annuelle attendue | SLE × ARO | 10 000 € par an |

La SLE se construit souvent à partir de la valeur de l'actif et d'un **facteur d'exposition**, la part de cette valeur qu'un événement détruit. Un système qui vaut 200 000 € et perd un dixième de sa valeur lors d'une panne a une SLE de 20 000 €.

@code annual-loss

L'ALE vous permet de comparer une mesure à son prix. Le chiffrement de disque ne rend pas les portables plus difficiles à voler, donc l'ARO reste à 0.5. Mais un portable chiffré volé ne coûte que son matériel, disons 1 500 €, donc l'ALE passe de 10 000 € à 750 €. Si le chiffrement coûte 2 000 € par an à faire fonctionner, il fait économiser 9 250 − 2 000 = 7 250 € par an. Un directeur financier peut approuver cette phrase. Une mesure qui coûte plus que la perte qu'elle évite est une raison de choisir un autre traitement.

@code control-value

Ces chiffres sont des estimations, et vous devez le dire. Donnez une fourchette quand vous le pouvez, dites d'où vient chaque nombre, et ne présentez pas 7 250 € comme s'ils avaient été mesurés. [FAIR](https://www.fairinstitute.org/) est la méthode la plus connue pour le faire avec soin.

?? Un événement coûte 40 000 € à chaque fois, et vous l'attendez une fois tous les quatre ans. Quelle est son ALE ?
+ `10,000 €`
- `160,000 €`
- `40,000 €`
- `4,000 €`
=> Une fois tous les quatre ans donne une ARO de 0.25, et 40 000 × 0.25 font 10 000 € par an. Multiplier par 4 à la place est l'erreur habituelle.

## Quatre traitements

| Option | Sens | Exemple |
|---|---|---|
| Réduire | Le diminuer | Ajouter la MFA |
| Transférer | Le partager | Une assurance cyber |
| Éviter | Arrêter l'activité | Retirer l'ancien portail |
| Accepter | Vivre avec, par écrit | Risque faible, correctif coûteux |

Accepter un risque est une décision légitime, mais seule une personne qui en a l'autorité peut la prendre, et elle est écrite.

@drill risk-treat

?? Un responsable dit « nous acceptons le risque » à propos d'un serveur sans correctifs. Qu'est-ce qui rend cela valable ?
+ Un propriétaire autorisé le consigne avec ses raisons
- Un analyste sécurité hoche la tête en réunion
- Personne ne s'en est encore plaint jusqu'à présent
- Ce serveur-là n'a pas encore subi d'attaque réelle
=> L'acceptation d'un risque exige un propriétaire responsable, une raison et une date de revue.

## Une entrée de registre

| Risque | Actif | P | I | Score | Propriétaire | Traitement | Résiduel |
|---|---|---|---|---|---|---|---|
| Un rançongiciel bloque le traitement des commandes | Système ERP | 3 | 5 | 15 | COO | Sauvegardes hors ligne, EDR | 8 |

Le **propriétaire du risque** est le plus souvent un dirigeant métier plutôt qu'une personne de la sécurité, parce que c'est lui qui en subit les conséquences. La sécurité conseille, et le métier décide. Les registres vieillissent vite, donc chaque entrée a besoin d'une date de revue.

Un registre se dégrade de quelques façons prévisibles, et un programme peut vérifier chacune : une entrée sans propriétaire, un score résiduel supérieur au score inhérent, un risque accepté sans date de revue, et une date de revue déjà dépassée.

@code register-problems

Le dernier usage d'un registre est le plus simple : comparer chaque score résiduel à l'appétence. Si le conseil d'administration a dit qu'il ne tolère rien au-dessus de 9, chaque résiduel de 10 ou plus demande un plan ou une acceptation signée, et c'est cette courte liste que vous apportez à la réunion.

?? Pourquoi le directeur des opérations (COO), plutôt que l'équipe de sécurité, est-il le propriétaire de ce risque sur l'ERP ?
+ Il répond de toutes les conséquences pour l'activité
- La sécurité n'a jamais accès aux registres internes
- Il a les meilleures compétences techniques de l'entreprise
- Le propriétaire est toujours le dernier responsable arrivé
=> Celui qui porte la conséquence doit porter la décision. La sécurité fournit l'analyse.

## Auditez un registre

Les registres sont des données, donc vous pouvez les vérifier avec les outils que vous connaissez déjà.

@range risk

::: try Oasis Logistics
L'entreprise fictive de la feuille de route compte 180 employés, un cloud hybride, un portail de commerce en ligne et trois agences. Construisez un registre d'au moins 15 risques. Voyez [P09](/projects/P09/).
:::

## Relire un registre

Un collègue vous demande de lire trois entrées avant qu'elles ne partent au comité des risques.

| Risque | P | I | Score | Propriétaire | Traitement | Résiduel | Revue |
|---|---|---|---|---|---|---|---|
| Un hameçonnage mène à la prise d'une boîte aux lettres | 4 | 3 | 12 | Sécurité informatique | MFA | 4 | 2027-03 |
| L'ancien serveur RH est exploité | 3 | 4 | 12 | Responsable RH | Accepter | 12 | Aucune |
| La panne d'un fournisseur arrête les livraisons | 2 | 5 | 10 | COO | Second fournisseur | 12 | 2027-01 |

?? Que changeriez-vous dans la première entrée ?
+ Le propriétaire doit en porter les conséquences
- Son score devrait valoir sept, pas douze
- La MFA transfère ce risque, sans l'atténuer
- Une date de revue n'est jamais nécessaire
=> La sécurité informatique conseille, mais la prise d'une boîte aux lettres nuit au service à qui elle appartient. Le propriétaire est celui qui répond de ce dommage.

?? Que manque-t-il dans la deuxième entrée ?
+ Un risque accepté exige toujours une date de revue
- Un risque accepté doit toujours avoir un résiduel nul
- La responsable RH ne peut être propriétaire d'aucun risque
- Un vieux serveur est un actif, pas un risque
=> Accepter est permis, et le résiduel reste à 12 puisque rien n'a été fait. Mais une acceptation sans date de revue est une décision que personne ne regardera plus jamais.

?? Qu'est-ce qui ne peut pas être juste dans la troisième entrée ?
+ Son résiduel est plus élevé que son inhérent
- Un second fournisseur revient à éviter le risque
- Le COO ne peut pas posséder ce risque
- Un impact de cinq n'est jamais autorisé ici
=> Une mesure n'ajoute pas de risque sur le papier. Soit un nombre a été mal saisi, soit les deux scores ont été cotés sur des échelles différentes.

## Dites-le à un directeur

Utilisez trois phrases : ce qui pourrait arriver, avec quelle probabilité et pour combien, et ce dont vous avez besoin.

> Des attaquants pourraient deviner les mots de passe du personnel sur notre portail, parce qu'il ne limite pas le nombre de tentatives de connexion. Nous l'avons vu dans notre secteur, et une prise de compte pourrait exposer les commandes des clients. Limiter les tentatives coûte deux jours de développement, et je recommande de le faire dans ce sprint.

?! Traduisez ceci en trois phrases pour un directeur : « Le portail ne limite pas le nombre de tentatives de connexion. »

### Pour aller plus loin

Les sources primaires et le meilleur matériel gratuit sur ce sujet, tous vérifiés en novembre 2026 (en anglais) :

- [NIST SP 800-37 Rev. 2 : le cadre de gestion des risques](https://csrc.nist.gov/pubs/sp/800/37/r2/final)
- [Le FAIR Institute : l'analyse quantitative des risques](https://www.fairinstitute.org/)
