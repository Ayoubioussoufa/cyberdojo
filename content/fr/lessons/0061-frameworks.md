---
title: Les référentiels qui comptent
summary: Les fonctions et les profils du NIST CSF 2.0, les CIS Controls, ISO/IEC 27001 et SOC 2, ce qui les distingue, et comment mener une analyse d'écarts.
builds: expliquer ISO 27001 face au NIST CSF en 60 secondes
source: CIS Critical Security Controls (en anglais) | https://www.cisecurity.org/controls
words: référentiel de mesures, SMSI, Déclaration d'applicabilité
---
Les référentiels peuvent ressembler à de la bureaucratie. Ce sont en réalité une langue commune : ils permettent à une banque, à un auditeur et à un fournisseur de parler de sécurité sans repartir de zéro. Pensez aux normes de construction. Un maçon et un inspecteur qui ne se sont jamais rencontrés peuvent quand même s'accorder sur ce qu'est un escalier sûr.

@term ISO/IEC 27001 = Une norme internationale pour un système de management de la sécurité de l'information, qui peut être certifié.
@term SMSI = Système de management de la sécurité de l'information : les politiques et les processus qui gèrent le risque de sécurité.
@term Déclaration d'applicabilité (SoA) = Le document d'ISO 27001 qui liste quelles mesures s'appliquent, et pourquoi.
@term CIS Controls = Une liste de mesures de sécurité classées par priorité, réparties en groupes de mise en œuvre.
@term SOC 2 = Un rapport d'attestation américain sur les mesures d'un prestataire de services.
@term profil CSF = Une description des résultats de sécurité actuels ou visés d'une organisation.
@term analyse d'écarts = Comparer votre situation à un référentiel pour trouver ce qui manque.
@term attestation = Une déclaration formelle d'un auditeur indépendant sur ce qu'il a examiné.

## Côte à côte

| Référentiel | Ce que c'est | Peut-on le certifier ? | Idéal pour |
|---|---|---|---|
| [NIST CSF 2.0](https://www.nist.gov/cyberframework) | Des résultats volontaires | Non | Évaluer et communiquer sa posture |
| [CIS Controls v8.1](https://www.cisecurity.org/controls) | Des mesures classées par priorité | Non | Savoir quoi faire d'abord. L'IG1 est une excellente base |
| ISO/IEC 27001:2022 | Les exigences d'un système de management | **Oui** | Le prouver aux clients |
| SOC 2 | Une attestation par un auditeur | Un rapport | Les éditeurs SaaS américains |

::: key La réponse en 60 secondes
ISO 27001 est un système de management certifiable, avec des exigences et une Déclaration d'applicabilité. Le NIST CSF est un ensemble volontaire de résultats pour évaluer et communiquer sa posture. Ils se complètent.
:::

@drill framework-pick

?? Un client exige une preuve, auditée par un tiers, de votre management de la sécurité. Qu'est-ce qui convient ?
+ Une certification ISO/IEC 27001 de votre SMSI
- Un profil CSF 2.0 rédigé en interne
- Une liste de CIS Controls déjà lus
- Une simple note interne décrivant votre pare-feu
=> ISO 27001 est certifiable par un organisme accrédité. Le CSF est un outil volontaire, et ce n'est pas un certificat.

## Le NIST CSF 2.0

Le CSF 2.0, publié en 2024, organise la sécurité en six fonctions. Cinq forment le cycle familier, et **Govern** se tient au centre.

@flow Govern, au centre > Identify > Protect > Detect > Respond > Recover

| Fonction | Question | Exemple |
|---|---|---|
| Govern (gouverner) | Qui décide, et selon quelles règles ? | La politique, les rôles, l'appétence au risque |
| Identify (identifier) | Qu'avons-nous, et qu'est-ce qui est à risque ? | L'inventaire des actifs |
| Protect (protéger) | Comment empêchons-nous le dommage ? | La MFA, les correctifs, la formation |
| Detect (détecter) | Comment le remarquons-nous ? | Votre SIEM |
| Respond (répondre) | Que faisons-nous alors ? | Votre plan de réponse aux incidents |
| Recover (rétablir) | Comment revenons-nous à la normale ? | Des restaurations testées |

Un **profil** décrit des résultats : un profil actuel dit où vous êtes, et un profil cible dit où vous voulez être. La différence est votre plan. Les **niveaux** (*tiers*), de 1 Partial à 4 Adaptive, décrivent la maturité de votre gestion des risques.

Chaque fonction se divise en **catégories**, et chaque catégorie en **sous-catégories**, qui sont les résultats eux-mêmes. Le CSF 2.0 compte 22 catégories et 106 sous-catégories, et chacune a un identifiant que vous pouvez lire :

| Identifiant | Se lit | Le résultat, en bref |
|---|---|---|
| `GV.RM-01` | Govern, stratégie de gestion des risques, résultat 1 | Les objectifs de gestion des risques sont convenus |
| `ID.AM-01` | Identify, gestion des actifs, résultat 1 | Les inventaires du matériel sont tenus à jour |
| `PR.AA-01` | Protect, gestion des identités et contrôle d'accès, résultat 1 | Les identités et les identifiants sont gérés |
| `DE.CM-01` | Detect, surveillance continue, résultat 1 | Les réseaux sont surveillés pour repérer les événements indésirables |

Les deux lettres avant le point sont la fonction : `GV`, `ID`, `PR`, `DE`, `RS` ou `RC`. Un profil n'est alors qu'un tableau avec une ligne par sous-catégorie, qui dit où vous êtes et où vous voulez être.

@code csf-id

?? Le SOC d'une entreprise est solide, mais elle ne sait pas lister les serveurs qu'elle possède. Quelle fonction du CSF est la plus faible ?
+ Identify, car l'inventaire des actifs est absent
- Detect, car le SOC ne surveille rien
- Recover, car aucune sauvegarde n'est jamais testée
- Respond, car aucun playbook n'est encore écrit
=> Vous ne pouvez ni protéger ni surveiller ce que vous ne connaissez pas. L'inventaire passe en premier, et c'est pourquoi il est si souvent le vrai manque.

## Les CIS Controls et ISO 27001

Les **CIS Controls** sont la liste pratique : quoi faire, par ordre de priorité. Le groupe de mise en œuvre 1 (IG1) est la base essentielle que toute organisation devrait atteindre, et l'IG2 et l'IG3 la complètent pour les organisations plus grandes et plus exposées.

**ISO/IEC 27001:2022** a deux parties. Les clauses 4 à 10 définissent le **système de management** : contexte, direction, planification, support, fonctionnement, évaluation et amélioration. L'Annexe A liste 93 mesures de référence en quatre thèmes : organisationnelles, liées aux personnes, physiques et technologiques. L'évaluation des risques décide si une mesure s'applique, et votre **Déclaration d'applicabilité** consigne chaque décision et sa raison.

La numérotation des deux listes vous dit où vous êtes. Le CIS v8.1 compte 18 contrôles et 153 mesures, dont 56 forment l'IG1. Le numéro d'une mesure commence par celui de son contrôle : la mesure 1.1 est l'inventaire des actifs, sous le contrôle 1, et la 11.2 est la sauvegarde automatisée, sous le contrôle 11.

Les quatre thèmes de l'Annexe A sont numérotés eux aussi :

| Clause | Thème | Mesures | Exemple |
|---|---|---|---|
| A.5 | Organisationnelles | 37 | A.5.15 Contrôle d'accès |
| A.6 | Liées aux personnes | 8 | A.6.3 Sensibilisation, enseignement et formation |
| A.7 | Physiques | 14 | A.7.2 Les entrées physiques |
| A.8 | Technologiques | 34 | A.8.13 Sauvegarde des informations |

Cela vaut la peine de le savoir, parce que l'édition 2013 était numérotée autrement, de A.5 à A.18, avec 114 mesures. Un document qui cite `A.12.3.1` utilise l'ancienne numérotation, et un document qui cite `A.8.40` cite une mesure qui n'existe pas.

@code annex-a-control

Trois lignes d'une Déclaration d'applicabilité :

| Mesure | S'applique ? | Justification | Mise en œuvre ? |
|---|---|---|---|
| A.8.13 Sauvegarde des informations | Oui | Risque R-07, rançongiciel | Oui |
| A.7.4 Surveillance de la sécurité physique | Non | Pas de locaux : l'entreprise est à distance et hébergée dans le cloud | Sans objet |
| A.8.28 Codage sécurisé | Oui | Nous développons notre propre portail | Pas encore |

Une exclusion a besoin d'une raison, exactement comme une inclusion. « Pas encore » est une réponse honnête avec laquelle un auditeur peut travailler, parce qu'elle devient une ligne datée du plan de traitement des risques.

@code soa-problems

?? Selon ISO 27001, une entreprise doit-elle mettre en œuvre les 93 mesures de l'Annexe A ?
+ Non, l'applicabilité découle de sa propre évaluation des risques
- Oui, chaque mesure est obligatoire sans la moindre exception
- Non, on n'exige jamais que les dix premières mesures
- Oui, sauf si l'auditeur est trop occupé ce jour-là
=> L'Annexe A est une liste de référence. Vous justifiez chaque inclusion ou exclusion dans la Déclaration d'applicabilité.

## SOC 2 en une page

Un rapport SOC 2 est une **attestation** : un auditeur indépendant déclare ce qu'il a examiné et constaté. Il repose sur les critères des services de confiance (*Trust Services Criteria*) : sécurité, disponibilité, intégrité du traitement, confidentialité et vie privée. La sécurité est obligatoire, et les autres sont choisis.

| Type | Répond à |
|---|---|
| Type I | Les mesures étaient-elles bien conçues, à cette date ? |
| Type II | Ont-elles réellement fonctionné, sur une période comme six mois ? |

Il n'y a pas de badge « réussi » ou « échoué ». Vous lisez le rapport, y compris ses exceptions.

?? Un fournisseur montre fièrement un rapport SOC 2 de Type I. Que devrait demander un acheteur prudent ?
+ Un rapport de Type II couvrant une période complète
- Une promesse signée par toute l'équipe marketing du fournisseur
- La liste complète des référentiels de sécurité qu'il préfère
- Une photo de la porte de sa salle serveurs
=> Le Type I montre la conception à un instant donné. Le Type II montre que les mesures ont fonctionné dans la durée.

## S'en servir : une analyse d'écarts

Choisissez un référentiel, comparez-vous à lui ligne par ligne, et classez ce qui manque. Voici une ligne d'une évaluation CIS IG1 :

| Mesure | État | Preuve | Correctif | Priorité |
|---|---|---|---|---|
| Tenir un inventaire des actifs | Partiel | Une feuille de calcul de 2024 | Automatiser la découverte | Élevée |

Une évaluation utile se termine par un plan daté sur 90 jours, pas par un pourcentage.

Chaque état a besoin d'une règle, sinon deux évaluateurs ne seront pas d'accord :

| État | Ce qu'il signifie | La preuve que vous pouvez montrer |
|---|---|---|
| Fait | C'est en place partout dans le périmètre | Un export récent, une configuration, un enregistrement daté |
| Partiel | Cela existe, mais pas partout ou sans être tenu à jour | La même chose, avec le manque nommé |
| Manquant | Rien n'est en place | Aucune |

Classez ensuite ce qui n'est pas fait : d'abord par priorité, et dans une même priorité, ce qui manque avant ce qui est partiel.

@code gap-plan

?? Une évaluation annonce « IG1 : complet à 71 % ». Que son lecteur ignore-t-il encore ?
+ Quelles mesures manquantes pèsent le plus ici
- Si l'IG1 compte plus de dix mesures
- Si le CIS autorise lui-même les pourcentages
- Combien d'auditeurs ont écrit le rapport final
=> Un pourcentage traite toutes les mesures comme égales. Une sauvegarde manquante et un texte de bannière manquant ne le sont pas, et c'est pourquoi le plan compte plus que le score.

::: ai Exercice de la feuille de route
Faites rédiger par un LLM une politique et une correspondance avec les mesures, puis auditez le résultat : les numéros de clause existent-ils ? Les identifiants des mesures sont-ils réels ? Les hallucinations de conformité sont les plus dangereuses, parce que personne ne vérifie un document sûr de lui.
:::

## Relire une correspondance

Un LLM a rédigé cette correspondance entre la politique d'une entreprise et les référentiels. Vérifiez-la avant que quiconque ne la signe.

| Énoncé de la politique | Rattaché à |
|---|---|
| Les sauvegardes sont faites chaque jour et testées | ISO 27001 `A.8.13` |
| Tout le personnel reçoit une formation à la sécurité | ISO 27001 `A.6.30` |
| Les visiteurs s'enregistrent à l'accueil | ISO 27001 `A.7.2` |
| Nous tenons un inventaire du matériel | NIST CSF `ID.AM-01` |

?? Lequel de ces identifiants ne peut pas exister ?
+ `A.6.30`
- `A.8.13`
- `A.7.2`
- `ID.AM-01`
=> Le thème des personnes n'a que 8 mesures, donc A.6 s'arrête à A.6.8. La formation est A.6.3, et le modèle a ajouté un chiffre. Cela se lit parfaitement bien, et c'est là le danger.

?? Le même brouillon dit : « Nos mesures sont certifiées NIST CSF 2.0. » Qu'est-ce qui ne va pas ?
+ Le NIST CSF ne délivre aucune certification
- Aucune mesure ISO ne correspond au CSF
- Une certification CSF prend environ trois ans
- Seul le CIS certifie un profil CSF
=> Le CSF est un guide volontaire. Vous pouvez vous évaluer par rapport à lui et publier un profil, mais personne ne délivre de certificat CSF.

?? La Déclaration d'applicabilité d'un fournisseur exclut `A.8.13`, avec la raison « pas nécessaire ». Que demandez-vous ?
+ Quel résultat de l'analyse des risques justifie cette exclusion
- Si l'auditeur a aimé la mise en page choisie
- Combien de pages compte le document dans son ensemble
- Quel fournisseur leur a vendu leur logiciel de sauvegarde
=> Une exclusion doit découler de l'évaluation des risques. Une entreprise qui a des données et aucun besoin de sauvegardes serait inhabituelle, donc c'est le raisonnement que vous voulez lire.

?! Dites à voix haute la différence entre ISO 27001 et le NIST CSF, en vous chronométrant, puis écrivez-la ici.
