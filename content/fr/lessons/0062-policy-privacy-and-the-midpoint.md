---
title: Politique, vie privée et votre mi-parcours
summary: Des politiques que les gens peuvent suivre, le droit de la vie privée, les fournisseurs, la continuité, et le bilan du Mois 12 qui choisit votre voie provisoire.
builds: trois politiques utilisables, et votre bilan de mi-parcours
source: CNIL, guide du RGPD | https://www.cnil.fr/fr/reglement-europeen-protection-donnees
words: politique, continuité d'activité, responsable de traitement
---
Une politique que personne ne lit ne protège rien. Et après 12 mois, il est temps de s'arrêter et de faire le point honnêtement.

@term politique = Un court énoncé de ce qu'une organisation exige.
@term standard = Une règle précise qui soutient une politique.
@term procédure = Des instructions pas à pas pour faire quelque chose.
@term continuité d'activité = Maintenir les opérations critiques pendant une perturbation.
@term reprise après sinistre = Rétablir les systèmes informatiques après une panne majeure.
@term responsable de traitement = L'organisation qui décide pourquoi et comment des données personnelles sont utilisées.
@term sous-traitant = Une organisation qui traite des données personnelles pour le compte d'un responsable de traitement.
@term données personnelles = Toute information qui se rapporte à une personne identifiable.
@term risque lié aux tiers = Le risque qui vient de vos fournisseurs et de vos partenaires.
@term CNDP = L'autorité marocaine de protection des données.

## Politique, standard, procédure

| Niveau | Répond à | Exemple |
|---|---|---|
| Politique | Quoi et pourquoi | « Les comptes d'administration exigent la MFA » |
| Standard | Lequel exactement | « Des clés FIDO2 pour tous les administrateurs » |
| Procédure | Comment | « Les étapes pour enregistrer une clé » |

Les garder séparés signifie que, quand la technologie change, vous mettez à jour une procédure au lieu de republier une politique. Les bonnes politiques sont courtes, ont un responsable et une date de revue, et définissent comment obtenir une exception.

Une politique entière tient sur une page :

```
Politique d'accès à distance         Responsable : directeur informatique
Approuvée : 2026-03-01               Prochaine revue : 2027-03-01

Objet       Garder sûres les connexions à distance aux systèmes de l'entreprise.
Périmètre   Tout le personnel et les prestataires, sur tout appareil.
Règles      1. L'accès à distance aux systèmes internes doit passer par le VPN de l'entreprise.
            2. Chaque connexion à distance doit utiliser la MFA.
            3. Les appareils utilisés à distance doivent avoir le chiffrement de disque activé.
Exceptions  Demandées par écrit au responsable, accordées pour 90 jours au plus, et consignées.
```

Chaque règle dit **doit**, nomme à qui ou à quoi elle s'applique, et peut être vérifiée. Comparez avec « le personnel devrait faire attention en travaillant à distance, dans la mesure du possible ». Personne ne peut suivre cela, et on ne peut montrer de personne qu'il l'a enfreint. C'est par des mots comme *devrait*, *dans la mesure du possible* et *le cas échéant* (en anglais *should*, *where possible*, *as appropriate*) que les politiques deviennent molles, et un programme peut les trouver.

@code policy-problems

?? Où se place « Les portables doivent utiliser BitLocker avec un code à 14 chiffres » ?
+ Dans un standard, car c'est une règle précise
- Dans une politique, car c'est le niveau supérieur
- Dans une procédure, car elle liste des étapes
- Dans le registre des risques, en entrée séparée
=> Cela nomme une exigence exacte. La politique dit que les portables doivent être chiffrés, et la procédure montre comment le mettre en place.

## La vie privée et le droit local

La sécurité protège les données contre les attaquants. La vie privée demande si vous devriez détenir ces données, et ce que vous avez le droit d'en faire. Une **donnée personnelle** est tout ce qui se rapporte à une personne identifiable, y compris les noms, les adresses électroniques et souvent les adresses IP.

- **RGPD :** la loi européenne sur les données personnelles, qui s'étend au-delà de l'Europe si vous proposez des services à des personnes dans l'UE, ou si vous les suivez. Un **responsable de traitement** décide pourquoi et comment les données sont utilisées, et un **sous-traitant** les traite pour son compte. Parmi les principes clés : avoir une base légale, ne collecter que le nécessaire, et ne conserver que le temps nécessaire.
- **Maroc :** la loi 09-08 sur les données personnelles, contrôlée par la [CNDP](https://www.cndp.ma/), et la loi 05-20 sur la cybersécurité, avec le socle de la DNSSI établi par la [DGSSI](https://www.dgssi.gov.ma/).
- **Règles sectorielles de l'UE :** NIS2 et DORA, si votre employeur sert l'Europe.
- **Gouvernance de l'IA :** le NIST AI RMF, ISO/IEC 42001 et le règlement européen sur l'IA.

Tout cela évolue, donc vérifiez la source officielle, et demandez à un juriste pour les vraies décisions.

Le RGPD demande au responsable de traitement de tenir un **registre des activités de traitement**. C'est un inventaire, comme celui des actifs, mais de ce que vous faites des données personnelles :

| Activité | Données | Base légale | Conservées | Partagées avec |
|---|---|---|---|---|
| Livrer les commandes | Nom, adresse, téléphone | Contrat | 3 ans après la dernière commande | Le transporteur |
| Lettre d'information | Adresse électronique | Consentement | Jusqu'au retrait du consentement | Le service d'envoi |
| Paie | Coordonnées bancaires, salaire | Obligation légale | Aussi longtemps que la loi l'exige | Le prestataire de paie |

Le RGPD liste six bases légales : le consentement, le contrat, l'obligation légale, les intérêts vitaux, la mission d'intérêt public et les intérêts légitimes. Chaque activité en a besoin d'une, choisie avant de collecter quoi que ce soit. Les durées ci-dessus sont des exemples. La colonne *Conservées* est celle qu'on laisse le plus souvent vide, et c'est la plus facile à vérifier : tout ce qui est plus ancien que sa durée de conservation devrait avoir disparu.

@code retention-overdue

Les personnes ont aussi des droits sur leurs données : les voir, les corriger, les faire effacer et les emporter ailleurs. Une demande doit recevoir une réponse dans un délai d'un mois, donc une entreprise doit savoir où se trouvent les données de chaque personne avant que la première demande n'arrive. C'est un usage de plus pour le registre ci-dessus.

?? Une entreprise marocaine vend en ligne à des clients en France. Le RGPD la concerne-t-il ?
+ Oui, elle propose des services à des personnes là-bas
- Non, le RGPD ne couvre que les entreprises européennes
- Non, parce que les serveurs se trouvent au Maroc
- Oui, mais seulement si elle a des employés européens
=> La portée du RGPD suit les personnes dont les données sont traitées. La loi marocaine 09-08 s'applique elle aussi.

## Les fournisseurs et la sensibilisation

**Le risque lié aux tiers :** un fournisseur qui a accès à vos données fait partie de votre surface d'attaque. Demandez des preuves comme des certificats ISO ou des rapports SOC 2, limitez ce qu'il peut atteindre, inscrivez les obligations de sécurité dans le contrat, et sachez comment lui couper l'accès.

Avant qu'un fournisseur n'obtienne un accès, cinq questions couvrent l'essentiel du risque :

| Demandez | Une bonne réponse |
|---|---|
| Quelles données à nous détiendrez-vous, et où ? | Une liste, et des pays nommés |
| Qui vous a audités, et quand ? | Un certificat ISO 27001 en cours de validité ou un rapport SOC 2 de Type II |
| En combien de temps nous signalerez-vous une violation ? | Un nombre d'heures, écrit dans le contrat |
| Qui sont vos propres fournisseurs ? | Une liste de sous-traitants ultérieurs |
| Que deviennent nos données quand nous partons ? | Restituées ou supprimées, avec une confirmation écrite |

Quand le fournisseur traite des données personnelles pour vous, le contrat n'est pas facultatif : l'article 28 du RGPD en exige un entre un responsable de traitement et son sous-traitant.

**La sensibilisation :** un diaporama annuel change peu de choses. Une formation courte et pertinente et un moyen simple de signaler fonctionnent mieux, et vous devriez remercier ceux qui signalent plutôt que punir ceux qui cliquent.

**Les indicateurs :** rapportez ce qui guide les décisions. « Correctifs critiques appliqués dans le délai convenu » est utile. « Nombre d'attaques bloquées » impressionne, mais ne dit à personne quoi faire ensuite.

?? Quel indicateur aiderait un conseil d'administration à prendre une décision ?
+ Les systèmes critiques corrigés dans le délai convenu
- Le total annuel de paquets bloqués au pare-feu
- Le nombre de pages du document de politique
- Le nombre d'outils de sécurité que possède l'entreprise
=> Un bon indicateur montre la performance par rapport à un objectif, et un écart dit à quelqu'un sur quoi agir.

## La continuité

Deux nombres guident la planification de la reprise : le **RTO**, le délai dans lequel le service doit revenir, et le **RPO**, la quantité de données que vous pouvez vous permettre de perdre.

@term RTO (objectif de délai de reprise) = Le délai visé pour rétablir un service après une perturbation.
@term RPO (objectif de point de reprise) = La perte de données maximale acceptable, mesurée en temps.

Si vous sauvegardez chaque nuit et que la base de données meurt à 23:00, vous perdez presque une journée entière. Une sauvegarde nocturne ne convient donc qu'à un RPO de 24 heures ou plus. Une règle courante pour les sauvegardes est le **3-2-1** : trois copies, sur deux types de support, dont une hors site. Gardez-en aussi une hors ligne, parce que les rançongiciels s'en prennent d'abord aux sauvegardes.

Écrivez les objectifs et la réalité côte à côte, avec une ligne par service :

| Service | RPO | Sauvegardes toutes les | RTO | La dernière restauration testée a pris |
|---|---|---|---|---|
| Base des commandes | 1 h | 24 h | 4 h | 6 h |
| Partages de fichiers | 24 h | 24 h | 8 h | Jamais testée |
| Site web | 24 h | 12 h | 2 h | 1 h |

Seul le site web atteint les deux objectifs. La base des commandes manque les deux, et les partages de fichiers ont un objectif que personne n'a jamais vérifié. Une durée de restauration jamais testée n'est pas un nombre.

@code continuity-gaps

La règle 3-2-1 se vérifie de la même façon.

@code three-two-one

La **continuité d'activité** maintient l'entreprise en marche, même sur papier. La **reprise après sinistre** rétablit l'informatique qui est derrière.

@drill rto-rpo

?? Le métier dit qu'il peut perdre au plus une heure de commandes. Les sauvegardes tournent chaque nuit. Qu'est-ce qui ne va pas ?
+ Le RPO est d'une heure, pas les sauvegardes
- Le RTO est trop long pour des serveurs
- Une sauvegarde de nuit corrompt toujours les commandes
- Rien, puisque les sauvegardes existent et sont récentes
=> Dans le pire cas, vous perdriez presque une journée de données pour une limite d'une heure. Le rythme doit correspondre à l'objectif.

## Relire une politique

Un collègue vous demande de relire ce brouillon avant qu'il ne parte en approbation.

```
Politique de mots de passe

1. Le personnel devrait choisir des mots de passe forts dans la mesure du possible.
2. Les mots de passe doivent compter au moins 14 caractères sur tous les comptes de l'entreprise.
3. Pour changer votre mot de passe, ouvrez Paramètres, choisissez Sécurité, puis cliquez sur Modifier.
```

?? Qu'est-ce qui ne va pas dans la règle 1 ?
+ Personne ne peut vérifier si elle est respectée
- Elle est bien trop stricte pour le personnel
- Elle nomme un produit qui pourrait bientôt changer
- Aucune politique n'a jamais le droit d'évoquer l'authentification
=> « Devrait », « forts » et « dans la mesure du possible » laissent tout ouvert. La règle 2 dit la même chose d'une façon que vous pouvez tester.

?? Où se place la ligne 3 ?
+ Dans une procédure, car elle liste des étapes
- Dans un standard, car elle fixe des nombres
- Dans la politique, car le personnel la lit
- Dans un contrat, car chaque fournisseur l'attend aussi
=> Les étapes changent chaque fois que l'écran change. Gardées dans une procédure, elles se mettent à jour sans que personne n'ait à approuver de nouveau la politique.

?? Le brouillon n'a ni responsable ni date de revue. Que devient une politique comme celle-là ?
+ Elle vieillira, puis elle sera ignorée
- Elle sera appliquée par le régulateur
- Elle se mettra à jour seule
- Elle vaudra pour les seuls nouveaux
=> Un document dont personne ne répond cesse de correspondre à la réalité en un an ou deux, et le personnel apprend que les politiques ne décrivent pas la façon dont on travaille.

## Le mi-parcours : ne sautez pas ceci

::: key La semaine 4 est un arrêt complet
Notez de nouveau la [matrice de compétences](/skills/), relisez vos comptes rendus, listez ce que vous savez faire sans aide, et parcourez [choisir votre voie](/guides/c2-choosing-your-track/). Choisissez un penchant, pas une condamnation à vie : 70 % de l'effort reste sur le tronc commun jusqu'au Mois 18, et 30 % va au penchant.
:::

?! Que savez-vous faire aujourd'hui sans notes que vous ne saviez pas faire il y a un an ? Vers quoi penchez-vous, et quelle est votre preuve ?
