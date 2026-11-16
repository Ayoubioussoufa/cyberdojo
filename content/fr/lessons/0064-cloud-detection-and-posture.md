---
title: Détection et posture dans le cloud
summary: Lire CloudTrail, répondre à une clé qui a fuité, analyser la posture avec Prowler, protéger Entra et Microsoft 365, et le nom que les autres clouds donnent aux mêmes choses.
builds: un playbook de compromission de clé, et une amélioration de posture mesurée
source: Documentation de Prowler (en anglais) | https://docs.prowler.com/
words: événement CloudTrail, gestion de la posture, rotation des clés
---
Le cloud rend la journalisation plus facile : presque tout est un appel d'API, et un appel d'API peut être enregistré. Cette leçon porte sur l'usage de ces enregistrements.

@term gestion de la posture (CSPM) = Vérifier en continu la configuration du cloud par rapport aux bonnes pratiques.
@term Prowler = Un outil libre qui audite la posture de sécurité dans le cloud.
@term rotation des clés = Remplacer un identifiant par un nouveau.
@term événement de gestion = Un enregistrement CloudTrail d'un changement sur des ressources, comme la création d'un rôle.
@term événement de données = Un enregistrement CloudTrail de la lecture ou de l'écriture des données elles-mêmes, comme la récupération d'un fichier dans S3.
@term hameçonnage par code d'appareil = Amener quelqu'un à approuver une connexion pour l'attaquant en saisissant un code sur une vraie page de connexion.
@term hameçonnage par consentement = Amener quelqu'un à accorder à une application malveillante l'accès à ses données.
@term PIM (Privileged Identity Management) = Un service Microsoft qui ne donne les droits d'administration qu'au moment du besoin, pour une durée limitée.

## Lire CloudTrail

Voici un événement, raccourci :

```json
{
  "eventTime": "2026-10-27T02:06:02Z",
  "eventName": "StopLogging",
  "sourceIPAddress": "203.0.113.7",
  "userIdentity": { "type": "IAMUser", "userName": "ci-bot" },
  "requestParameters": { "name": "main-trail" }
}
```

Chaque événement répond à : **qui** (`userIdentity`), **quoi** (`eventName`), **d'où** (`sourceIPAddress`), **quand** (`eventTime`).

Il y a un piège à apprendre maintenant. Les **événements de gestion**, comme la création d'un utilisateur, sont enregistrés par défaut. Les **événements de données**, comme la lecture d'un fichier dans un bucket, ne le sont pas, parce qu'ils sont trop nombreux. Si vous ne les avez jamais activés, vous ne pouvez pas prouver ce qui a été lu.

Un vrai événement a plus de champs que cela. Voici ceux que vous utiliserez le plus :

| Champ | Vous dit |
|---|---|
| `eventSource` | Le service appelé, comme `iam.amazonaws.com` |
| `awsRegion` | Où. Une activité dans une région que vous n'utilisez jamais est un signal en soi |
| `userIdentity.accessKeyId` | Quelle clé a signé la requête |
| `userAgent` | L'outil qui a fait l'appel : la console, la CLI ou un script |
| `errorCode` | Présent seulement quand l'appel a échoué, par exemple `AccessDenied` |
| `readOnly` | `true` pour les appels qui ne font que regarder, `false` pour ceux qui changent quelque chose |

Les échecs comptent autant que les succès. Une identité qui fait son travail habituel tombe rarement sur `AccessDenied`. Une clé volée, entre les mains de quelqu'un qui explore, tombe dessus encore et encore, à mesure qu'il essaie une API après l'autre.

@code denied-bursts

| Mérite une détection | Pourquoi |
|---|---|
| `StopLogging` sur un trail | Quelqu'un vous aveugle |
| Une nouvelle clé d'accès créée pour un autre utilisateur | Persistance possible |
| Un `AssumeRole` inhabituel | Déplacement possible |
| Une politique de bucket ouverte à tous | Exposition de données |

Une liste de surveillance comme celle-là peut s'écrire sous forme de code, et c'est le premier pas vers une alerte.

@code trail-watchlist

@drill log-source

?? Un attaquant a lu des fichiers dans un bucket, mais CloudTrail ne montre rien. Quelle est la raison probable ?
+ Les événements de données S3 n'ont jamais été activés
- CloudTrail supprime toutes les lectures au bout d'un jour
- Les attaquants savent toujours se cacher des journaux CloudTrail
- Lire un simple fichier n'est pas un appel d'API
=> Les lectures d'objets sont des événements de données, que vous devez activer. Décidez-le avant d'en avoir besoin, parce qu'on ne peut pas l'activer rétroactivement.

## Enquêtez sur un cas

Ces missions utilisent `jq`, un outil pour interroger du JSON. C'est le même raisonnement « filtrer puis afficher » qu'avec `grep` et `awk`.

CloudTrail livre des fichiers dont le niveau supérieur est une liste appelée `Records`. Trois requêtes couvrent la plupart des premiers coups d'œil :

```
jq -r '.Records[] | [.eventTime, .userIdentity.userName, .eventName, .sourceIPAddress] | @tsv' trail.json
jq '.Records[] | select(.errorCode == "AccessDenied")' trail.json
jq -r '.Records[].eventName' trail.json | sort | uniq -c | sort -rn
```

La première affiche une chronologie, avec un événement par ligne. La deuxième ne garde que les appels qui ont échoué. La troisième compte combien de fois chaque API a été appelée, et les noms rares en bas de cette liste sont souvent les plus intéressants.

@range trail

## Une clé qui a fuité : la réponse

@flow Désactiver la clé > Examiner CloudTrail > Délimiter ce qu'elle pouvait atteindre > Renouveler ce qui en dépend > Chercher la persistance > Corriger le chemin de fuite > Prévenir

Faites cela dans l'ordre. Désactiver d'abord arrête l'hémorragie, tout en gardant les preuves. Chercher la persistance compte, parce qu'un attaquant habile crée tout de suite une seconde clé, si bien que tuer la première n'apporte pas grand-chose. Prévenir veut dire des identifiants de courte durée, OIDC pour les pipelines, et la recherche de secrets.

Les deux premières étapes, sous forme de commandes :

```
aws iam update-access-key --user-name ci-bot --access-key-id AKIAIOSFODNN7EXAMPLE --status Inactive
aws cloudtrail lookup-events --lookup-attributes AttributeKey=AccessKeyId,AttributeValue=AKIAIOSFODNN7EXAMPLE
```

La clé est passée à `Inactive` plutôt que supprimée. Elle cesse de fonctionner aussitôt, mais elle reste listée : vous pouvez donc encore lui rattacher des événements, et la réactiver si vous avez désactivé la mauvaise. `lookup-events` cherche dans les 90 derniers jours d'événements de gestion. De sa sortie, vous voulez quatre faits : quand la clé a servi pour la première fois, quand elle a servi pour la dernière fois, depuis quelles adresses, et quels appels elle a faits.

@code key-scope

?? Une clé apparaît sur un GitHub public. Qu'est-ce qui passe en premier ?
+ Désactiver la clé, puis examiner son activité
- Supprimer le dépôt, puis attendre de voir
- Écrire à toute l'entreprise sur cette erreur
- La renouveler la semaine prochaine, en maintenance
=> Des robots trouvent les clés en quelques minutes. Arrêtez d'abord l'accès, puis comprenez ce qui s'est passé. Supprimer le dépôt n'aide pas, puisque la clé a peut-être déjà été copiée.

## La posture

La **posture** est l'écart entre votre configuration et les bonnes pratiques, mesuré en permanence. [Prowler](https://docs.prowler.com/) vérifie votre compte par rapport à des référentiels comme le [CIS AWS Foundations Benchmark](https://www.cisecurity.org/benchmark/amazon_web_services). Une première analyse renvoie des centaines de constats, et c'est en essayant de tous les corriger que les équipes abandonnent. Classez selon deux questions : est-ce exposé à internet, et à quel point ce qui est derrière est-il sensible ? Corrigez dans le code, et relancez l'analyse pour le prouver.

| Constat | Exposé ? | Sensible ? | Priorité |
|---|---|---|---|
| Un bucket public avec des factures | Oui | Oui | Maintenant |
| Un bucket public avec les images du site web | Oui | Non | À revoir, probablement voulu |
| Un disque non chiffré sur une machine de test interne | Non | Non | Plus tard |

Le lancer tient en une ligne, et une seconde restreint la sortie :

```
prowler aws
prowler aws --severity critical high
```

Chaque contrôle revient en `PASS` ou en `FAIL`, avec une gravité, la ressource et un correctif suggéré. La gravité est l'avis général de l'outil. Il ne sait pas quel bucket contient les factures, donc votre propre classement passe par-dessus. Un cas se place entre les lignes du tableau : ce qui est sensible sans être exposé, comme une base de données interne sans chiffrement, vient bientôt, après ce qui est exposé et sensible.

@code rank-findings

?? Une analyse rapporte 600 constats. Quel est le meilleur premier geste ?
+ Les trier selon leur exposition et leur sensibilité
- Partir du haut et les corriger tous ensemble
- Les exporter dans un PDF pour toute l'équipe
- Ignorer le scanner, car il est trop bruyant
=> Sans classement, vous passerez des semaines sur des correctifs de faible valeur. L'exposition et la sensibilité vous disent où se trouve le risque réel.

## L'identité Microsoft et M365

Beaucoup d'entreprises d'Europe et d'Afrique du Nord fonctionnent avec Microsoft, donc cela compte. Surveillez :

- **Les règles de boîte de réception malveillantes :** un signe classique de compromission de messagerie.
- **Un consentement inhabituel à une application OAuth**, appelé **hameçonnage par consentement** : un utilisateur est amené à approuver une application malveillante.
- **L'hameçonnage par code d'appareil :** une personne saisit un code sur une vraie page Microsoft, et approuve ainsi une connexion pour quelqu'un d'autre.
- **Le vol de jeton :** une session volée évite la connexion et la MFA.
- **Les connexions** depuis des lieux impossibles, ou depuis des appareils inconnus.

Protégez-vous avec l'accès conditionnel, [Privileged Identity Management](https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-configure), et un consentement aux applications restreint. Avec **PIM**, personne ne détient les droits d'administration en permanence : on les demande, avec une raison, et ils expirent.

?? Dans M365, une boîte aux lettres compromise a une nouvelle règle qui transfère les factures ailleurs. De quoi est-ce le signe ?
+ Une compromission de messagerie qui reste cachée
- Un nettoyage trimestriel de routine des boîtes
- Un effet attendu des changements de licence
- Le comportement normal de tout filtre antispam
=> Les règles de transfert permettent à un attaquant d'observer et de détourner les échanges sur les paiements.

## Les mêmes idées, d'autres noms

Apprenez le concept une fois, et seul le nom change.

| Concept | AWS | Azure | Google Cloud |
|---|---|---|---|
| Identité | IAM | Entra ID, Azure RBAC | Cloud IAM |
| Journal d'audit | CloudTrail | Activity Log | Cloud Audit Logs |
| Stockage d'objets | S3 | Blob Storage | Cloud Storage |
| Détection des menaces | GuardDuty | Defender for Cloud | Security Command Center |

?? Vous connaissez bien AWS, et un poste utilise Google Cloud. Quel journal cherchez-vous en premier ?
+ Cloud Audit Logs, l'équivalent de CloudTrail là-bas
- Les journaux S3, valables chez chaque fournisseur
- Les journaux Windows d'un contrôleur de domaine
- Les constats GuardDuty exportés de votre AWS
=> Les concepts se transposent d'un cloud à l'autre. Qui a appelé quelle API est enregistré dans chacun d'eux.

## Relire le trail d'une nuit

Un collègue vous envoie cinq événements de la nuit dernière et demande s'il faut réveiller quelqu'un.

| Heure (UTC) | Identité | Événement | Depuis | Erreur |
|---|---|---|---|---|
| 02:01:10 | `ci-bot` | `ListBuckets` | 203.0.113.7 | |
| 02:01:14 | `ci-bot` | `ListUsers` | 203.0.113.7 | `AccessDenied` |
| 02:01:19 | `ci-bot` | `DescribeInstances` | 203.0.113.7 | `AccessDenied` |
| 02:04:40 | `ci-bot` | `CreateAccessKey`, pour l'utilisateur `admin-ana` | 203.0.113.7 | |
| 02:06:02 | `ci-bot` | `StopLogging` | 203.0.113.7 | |

?? Que suggèrent les deux lignes `AccessDenied` ?
+ Quelqu'un explore ce que cette clé permet
- Le pipeline exécute simplement sa tâche habituelle
- AWS subissait une grosse panne cette nuit-là
- CloudTrail a noté ces événements par erreur
=> Un robot de build appelle chaque jour les mêmes quelques API et ne demande pas la liste des utilisateurs. Essayer des appels sans rapport et se les voir refuser, c'est à cela que ressemble une exploration avec une clé volée.

?? Quel événement donne à l'attaquant un moyen de revenir une fois la clé de `ci-bot` désactivée ?
+ `CreateAccessKey`
- `ListBuckets`
- `StopLogging`
- `DescribeInstances`
=> La nouvelle clé appartient à `admin-ana`, pas à `ci-bot`. Désactiver la clé qui a fuité la laisse en état de marche, et c'est pourquoi le playbook cherche la persistance.

?? Après 02:06:02, le trail ne montre plus rien. Que signifie ce silence ?
+ La journalisation a été arrêtée, donc rien n'est enregistré
- L'attaquant a tout abandonné et il est parti ailleurs
- Chaque appel suivant a été refusé par AWS lui-même
- La clé a expiré très exactement à ce moment-là
=> `StopLogging` est la dernière chose que vous voyez, pas la dernière chose qui s'est passée. Oui, réveillez quelqu'un : tout ce qui suit ce moment doit être reconstitué à partir d'autres sources.

?! Listez les cinq premières choses que vous feriez si une clé AWS fuitait à 2 heures du matin.
