---
title: Le renseignement sur les menaces
summary: Le cycle du renseignement, ses niveaux, le modèle Diamond, le langage de la confiance et le TLP, et comment transformer des rapports en détections.
builds: un court rapport de renseignement avec des détections testées
source: MITRE ATT&CK, formation CTI (en anglais) | https://attack.mitre.org/resources/learn-more-about-attack/training/cti/
words: besoin en renseignement, modèle Diamond, TLP
---
Le renseignement sur les menaces n'est pas un flux d'adresses IP malveillantes. C'est une analyse qui aide quelqu'un à prendre une meilleure décision. S'il ne change rien, ce n'était pas du renseignement.

@term besoin en renseignement = La question précise à laquelle le travail de renseignement doit répondre.
@term modèle Diamond = Un modèle qui décrit une intrusion par l'adversaire, la capacité, l'infrastructure et la victime.
@term TLP (Traffic Light Protocol) = Des étiquettes qui disent jusqu'où une information peut être partagée.
@term OSINT = Le renseignement d'origine sources ouvertes : l'information tirée de sources publiques.
@term attribution = Nommer qui était derrière une attaque.
@term STIX = Un format standard pour partager le renseignement sur les menaces.
@term MISP = Une plateforme libre pour partager le renseignement sur les menaces.

## Donnée, information, renseignement

| Étape | Exemple |
|---|---|
| **Donnée** | `203.0.113.7` |
| **Information** | Cette adresse a attaqué 40 entreprises de logistique la semaine dernière |
| **Renseignement** | Nous sommes une cible probable, ils entrent par notre produit VPN, donc corrigez-le aujourd'hui |

Chaque étape ajoute du contexte et du sens, jusqu'à ce que quelqu'un puisse agir.

?? Lequel de ces éléments est du renseignement, plutôt qu'une donnée ?
+ Ce groupe vise notre secteur, corrigez les VPN
- Un long flux brut de 500 adresses IP
- Une empreinte SHA-256 d'un échantillon reçu ce matin
- Un export brut des journaux du pare-feu d'hier
=> Le renseignement dit ce que cela signifie pour vous et quoi faire. Les autres sont de la matière première.

## Le cycle

@flow Besoins > Collecter > Traiter > Analyser > Diffuser > Retour

Partez d'une question, le **besoin en renseignement** : « Quels groupes visent les entreprises de logistique en Afrique du Nord, et comment entrent-ils ? » Sans elle, vous collectez tout et ne répondez à rien. L'étape de retour ferme la boucle : est-ce que cela a aidé ?

?? Un analyste s'abonne à dix flux gratuits, mais personne n'utilise le résultat. Qu'est-ce qui a été sauté ?
+ Définir la question à laquelle il doit répondre
- Acheter un flux bien plus grand, plus cher
- Traduire tous les flux dans plusieurs langues différentes
- Supprimer les anciens flux chaque matin sans exception
=> Collecter sans besoin produit du bruit. Un bon renseignement commence par ce qu'un décideur a besoin de savoir.

## Les niveaux

| Niveau | Public | Exemple |
|---|---|---|
| Stratégique | Les dirigeants | « Les rançongiciels contre notre secteur augmentent » |
| Opérationnel | Les responsables de la réponse aux incidents et du SOC | « Cette campagne hameçonne le personnel de la paie » |
| Tactique | Les ingénieurs de détection | Les TTP et les indicateurs |

Le même rapport peut demander trois versions. Un directeur général ne veut pas d'empreintes, et un ingénieur de détection ne veut pas de tendances.

?? Quel est le bon public pour « les rançongiciels contre notre secteur ont augmenté de 40 % cette année » ?
+ Les dirigeants qui décident où dépenser le budget
- Les ingénieurs de détection qui écrivent les règles
- Le support qui réinitialise les mots de passe
- Les développeurs qui corrigent un formulaire de connexion
=> C'est du renseignement stratégique : il oriente les priorités et les investissements, pas une règle précise.

## Le modèle Diamond

Le **modèle Diamond** décrit une intrusion par quatre points. Deux points reliés peuvent vous mener à un troisième, et c'est ainsi que les analystes pivotent.

| Point | Question | Exemple |
|---|---|---|
| Adversaire | Qui ? | Un groupe inconnu |
| Capacité | Avec quoi ? | De l'hameçonnage, un chargeur |
| Infrastructure | D'où ? | `203.0.113.7`, un domaine |
| Victime | Contre qui ? | Le personnel de la paie |

Si vous connaissez l'infrastructure, vous pouvez donc chercher ses autres victimes. Si vous connaissez la capacité, vous pouvez chercher une autre infrastructure qui l'utilise.

Un pivot peut se faire mécaniquement une fois les événements notés. Partez d'un élément d'infrastructure, rassemblez les capacités vues avec lui, puis trouvez tous les autres éléments d'infrastructure qui ont utilisé la même capacité. Chaque nouvelle adresse ou chaque nouveau domaine est une piste à vérifier, pas la preuve qu'il s'agit du même groupe.

@code diamond-pivot

?? Vous avez trouvé un domaine utilisé par un attaquant. Quel est un pivot utile ?
+ Chercher dans vos journaux les hôtes contactant ce domaine
- Attendre simplement que l'enregistrement du domaine expire tout seul
- Renommer tout de suite le domaine principal de l'entreprise
- Le présenter comme votre attribution finale de ce groupe
=> L'infrastructure mène aux victimes. Chercher dans vos propres journaux transforme un indicateur en périmètre.

## Un langage prudent

Dites à quel point vous êtes sûr, et pourquoi : « Nous estimons avec une **confiance modérée** que… ». Séparez ce qui est connu de ce qui est jugé, citez vos sources, et nommez vos manques.

| Confiance | Signifie |
|---|---|
| Élevée | De bonnes preuves venant de plusieurs sources fiables |
| Modérée | Crédible, mais avec des manques ou des parties à source unique |
| Faible | Des preuves minces ou discutables |

Cotez la source et l'affirmation séparément, car une source fiable peut quand même transmettre quelque chose de faux. Le **code de l'Amirauté**, utilisé par de nombreuses équipes de renseignement, donne à chacune une lettre et un chiffre :

| Fiabilité de la source | | Crédibilité de l'information | |
|---|---|---|---|
| A | Entièrement fiable | 1 | Confirmée par d'autres sources |
| B | Habituellement fiable | 2 | Probablement vraie |
| C | Assez fiable | 3 | Peut-être vraie |
| D | Pas habituellement fiable | 4 | Douteuse |
| E | Pas fiable | 5 | Improbable |
| F | Fiabilité impossible à juger | 6 | Véracité impossible à juger |

Une affirmation cotée **B2** vient donc d'une source qui a habituellement eu raison, et elle est probablement vraie. Un message sur un forum anonyme vaut souvent F3 au mieux : vous ne pouvez pas juger la source, et l'affirmation est peut-être vraie.

Les mots portent le même poids. « Probable » et « presque certain » sont des affirmations différentes, alors choisissez le mot exprès, et employez-le de la même façon dans chaque rapport. Un lecteur qui voit « probable » dans un rapport et « vraisemblable » dans le suivant pensera que vous vouliez dire autre chose.

?? Un rapport cote une affirmation C4. Qu'est-ce que cela dit ?
+ Une source assez fiable a transmis une chose douteuse
- L'affirmation a été confirmée par quatre sources bien distinctes
- C'est la quatrième affirmation du troisième rapport de l'année
- Une source entièrement fiable a fait toute cette affirmation
=> La lettre cote la source, et le chiffre cote l'information. Une source correcte peut quand même transmettre une affirmation douteuse, et la cotation le garde visible.

Résistez à l'**attribution** : nommer un coupable est l'affirmation la plus difficile, et rarement ce dont les défenseurs ont besoin. Une adresse IP dans un pays ne veut pas dire que ce pays l'a fait. Le comportement est ce sur quoi vous pouvez agir.

?? Un rapport dit « le serveur de l'attaquant était dans le pays X, donc le pays X l'a fait ». Qu'est-ce qui ne va pas ?
+ L'emplacement d'un serveur ne prouve pas qui s'en servait
- Aucun serveur ne peut être situé dans un pays
- Un rapport ne doit jamais citer un pays précis
- L'attribution exige toujours exactement trois adresses IP de source
=> Les attaquants louent ou détournent des serveurs partout. Prendre l'emplacement pour l'identité est une erreur classique.

## Le partage : TLP 2.0

| Étiquette | Peut être partagée avec |
|---|---|
| `TLP:RED` | Les destinataires nommés uniquement |
| `TLP:AMBER+STRICT` | Leur organisation uniquement |
| `TLP:AMBER` | Leur organisation et leurs clients, selon le besoin |
| `TLP:GREEN` | La communauté |
| `TLP:CLEAR` | Tout le monde |

Défini par le [FIRST](https://www.first.org/tlp/). Des plateformes comme **MISP** et OpenCTI stockent et partagent le renseignement, souvent dans un format standard appelé **STIX**.

Les étiquettes s'emboîtent : chacune permet tout ce que permettent les plus strictes, plus un public de plus. Elles sont donc faciles à vérifier dans du code, et un programme qui transfère des rapports devrait le faire, parce qu'un transfert mal étiqueté ne se reprend pas.

@code tlp-share

Un indicateur partagé en **STIX 2.1** est un petit objet JSON :

```json
{
  "type": "indicator",
  "spec_version": "2.1",
  "id": "indicator--8e2e2d2b-17d4-4cbf-938f-98ee46b3cd3f",
  "created": "2026-10-28T09:00:00.000Z",
  "modified": "2026-10-28T09:00:00.000Z",
  "name": "Payroll phishing domain",
  "pattern": "[domain-name:value = 'payroll-update.example']",
  "pattern_type": "stix",
  "valid_from": "2026-10-28T09:00:00Z",
  "valid_until": "2027-01-26T09:00:00Z"
}
```

`pattern` dit quoi chercher, et `valid_from` et `valid_until` disent quand cela vaut la peine de chercher. La [spécification STIX 2.1](https://docs.oasis-open.org/cti/stix/v2.1/os/stix-v2.1-os.html) définit chaque champ, et MISP comme OpenCTI la lisent et l'écrivent.

@drill tlp

?? Un rapport porte l'étiquette `TLP:AMBER`. Pouvez-vous le publier sur votre blog public ?
+ Non, seuls ceux qui en ont besoin peuvent le recevoir
- Oui, à condition de bien citer l'auteur d'origine du rapport
- Oui, car les rapports sur les menaces sont toujours publics
- Non, mais seulement parce qu'il contient des adresses IP brutes
=> Les étiquettes TLP sont les consignes de manipulation de la source. AMBER n'est pas public.

## Extraire les indicateurs d'un rapport

Les rapports écrivent les indicateurs **désarmés**, pour que personne ne clique dessus par accident et qu'aucun filtre de messagerie ne les transforme en liens : `203.0.113[.]7`, `hxxps://payroll-update[.]example/login`. Avant de pouvoir les chercher, vous les **réarmez**, puis vous les extrayez de la prose. Une expression régulière par type fait l'essentiel du travail :

| Type | Ressemble à | Motif |
|---|---|---|
| Adresse IPv4 | `203.0.113.7` | Quatre groupes de 1 à 3 chiffres, reliés par des points |
| Empreinte SHA-256 | 64 caractères hexadécimaux | `[0-9a-fA-F]{64}` |
| URL | `https://…` | `https?://` suivi de tout ce qui précède une espace |

Vérifiez ce qui sort. Une phrase qui se termine par une URL lui laisse un point collé, et une adresse citée trois fois doit être listée une seule fois.

@code extract-iocs

Les indicateurs vieillissent aussi. Une adresse IP peut être réutilisée par quelqu'un d'innocent en quelques semaines, un domaine dure plus longtemps, et l'empreinte d'un fichier ne perd sa valeur que quand l'attaquant reconstruit le fichier. Donnez à chaque type une durée de vie, comptée depuis sa **dernière observation**, et arrêtez d'alerter sur ce qui a expiré. Sinon, vos listes de blocage grossissent sans fin et se remplissent lentement de faux positifs. Les nombres ci-dessous sont une politique d'exemple, pas une norme :

| Type | Durée de vie d'exemple |
|---|---|
| Adresse IP | 30 jours |
| Domaine | 90 jours |
| Empreinte de fichier | 365 jours |

@code indicator-age

?? Pourquoi une adresse IP du rapport de l'an dernier ne devrait-elle pas rester bloquée pour toujours ?
+ Elle appartient peut-être désormais à une personne innocente
- Les vieilles adresses cessent de fonctionner sur internet
- Les listes de blocage s'arrêtent à cent entrées
- Les étiquettes TLP expirent au bout d'un an
=> Les adresses du cloud et des hébergeurs changent de mains en permanence. Un vieil indicateur bloque le nouveau propriétaire et ne vous apprend rien sur l'attaquant.

## Du rapport à la réponse

@range intel

::: try Du renseignement aux détections
Choisissez une campagne qui a fait l'objet de plusieurs rapports publics. Rattachez ses comportements à ATT&CK, en citant pour chacun une phrase de la source. Tirez-en cinq détections et testez-les. Voyez [P12](/projects/P12/).
:::

## Relire un rapport

Un collègue s'apprête à envoyer ceci à une organisation partenaire.

```
Objet : URGENT - Le groupe X nous attaque
TLP:AMBER+STRICT

Le groupe X, un acteur étatique, est derrière l'intrusion de cette nuit : le serveur était dans son pays.
Bloquez http://payroll-update.example/login et 203.0.113.7 tout de suite.
```

?? Le partenaire est une autre entreprise. Que permet l'étiquette ?
+ Rien, car STRICT le garde dans votre organisation
- Le partager, tant que personne ne le publie
- Le partager, car AMBER couvre clients et partenaires
- Tout, car un rapport urgent passe outre l'étiquette
=> AMBER+STRICT veut dire la seule organisation du destinataire. Si le partenaire en a besoin, demandez une autre étiquette à l'émetteur, ou rédigez une version qui peut être partagée en AMBER ou en GREEN.

?? Qu'est-ce qui ne va pas dans la première phrase ?
+ Elle déduit le coupable du lieu d'un serveur
- Elle ne donne pas l'heure exacte de l'attaque
- Elle cite un pays, ce qui est interdit
- Elle est trop courte pour un vrai rapport
=> L'emplacement n'est pas l'identité, et la phrase l'énonce comme un fait, sans niveau de confiance. « Nous estimons avec une faible confiance », suivi des preuves, serait honnête, et la défense ne dépend de toute façon pas du nom.

?? Comment écrire les deux indicateurs dans le courriel ?
+ Désarmés, pour que personne ne les ouvre par accident
- En majuscules, pour que les lecteurs les remarquent vite
- Chiffrés, pour que seul le partenaire puisse les lire
- En image, que les filtres ne savent pas lire
=> `hxxp://payroll-update[.]example/login` et `203.0.113[.]7` ne peuvent être ni cliqués ni suivis par un scanner de messagerie, et le lecteur les réarme en une seconde.

?! Écrivez un besoin en renseignement qui compterait vraiment pour votre entreprise imaginaire.

### Pour aller plus loin

Les sources primaires et le meilleur matériel gratuit sur ce sujet, tous vérifiés en novembre 2026 (en anglais) :

- [David Bianco, la pyramide de la douleur](https://detect-respond.blogspot.com/2013/03/the-pyramid-of-pain.html)
