---
title: Les bases du cloud et l'IAM
summary: Ce qu'est vraiment le cloud, le modèle de responsabilité partagée, une base de compte sûre, comment AWS décide si une requête est autorisée, et les échecs derrière la plupart des violations dans le cloud.
builds: un compte AWS durci, et des politiques sur lesquelles vous savez raisonner
source: AWS, logique d'évaluation des politiques (en anglais) | https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluationlogic.html
words: responsabilité partagée, politique IAM, moindre privilège
---
Dans le cloud, le périmètre réseau s'efface et **l'identité devient le périmètre**. Une seule mauvaise politique peut tout exposer, et la plupart des incidents cloud viennent de la configuration et des identifiants plutôt que d'exploits ingénieux.

@term modèle de responsabilité partagée = La répartition des devoirs de sécurité entre un fournisseur cloud et son client.
@term politique IAM = Un document JSON qui liste quelles actions sont autorisées ou refusées sur quelles ressources.
@term rôle IAM = Une identité dotée de permissions, que des personnes ou des services endossent temporairement.
@term SCP (politique de contrôle des services) = Un garde-fou d'AWS Organizations qui fixe les permissions maximales des comptes.
@term RCP (politique de contrôle des ressources) = Un garde-fou d'AWS Organizations qui fixe les permissions maximales sur les ressources.
@term STS = AWS Security Token Service, qui délivre des identifiants temporaires.
@term S3 = Le service de stockage d'objets d'Amazon.
@term CloudTrail = Le service AWS qui enregistre les appels d'API.
@term GuardDuty = Le service AWS de détection des menaces.
@term Terraform = Un outil pour définir une infrastructure sous forme de code.
@term infrastructure en tant que code (IaC) = Définir l'infrastructure dans des fichiers versionnés plutôt qu'à la main.
@term ARN (Amazon Resource Name) = Le nom unique d'une ressource AWS.
@term politique de confiance = La partie d'un rôle qui dit qui a le droit de l'endosser.
@term service de métadonnées (IMDS) = Une adresse locale où un serveur cloud peut lire ses propres réglages et ses identifiants temporaires.
@term VPC (cloud privé virtuel) = Votre propre réseau privé chez un fournisseur cloud.

## Ce qu'est réellement le cloud

Le cloud, ce sont les ordinateurs de quelqu'un d'autre, loués à la minute et pilotés par une **API**. Personne n'installe de serveur dans une baie. Vous envoyez une requête, « crée une machine », et elle existe une minute plus tard. C'est la source du problème de sécurité : quiconque détient des identifiants valides peut faire en un appel ce qui demandait autrefois une visite au centre de données.

Dans le cloud, un pare-feu compte donc moins que la réponse à une question : qui peut appeler quelle API ? C'est ce que décide l'**IAM**, la gestion des identités et des accès.

?? Pourquoi dit-on que l'identité est le périmètre dans le cloud ?
+ Des identifiants valides atteignent tout par l'API
- Les fournisseurs cloud interdisent tous les pare-feu
- Chaque employé visite le centre de données
- Le pare-feu conserve chaque mot de passe
=> Le plan de contrôle est joignable de partout. Si une requête porte des identifiants valides et que la politique l'autorise, aucune barrière réseau ne l'arrête.

## La responsabilité partagée

Le fournisseur sécurise le cloud lui-même : les bâtiments, le matériel, l'hyperviseur. **Vous** sécurisez ce que vous y mettez : les identités, les données, la configuration. Voyez [le modèle d'AWS](https://aws.amazon.com/compliance/shared-responsibility-model/). La ligne se déplace selon ce que vous louez.

| Vous louez | Le fournisseur gère | Vous gérez |
|---|---|---|
| Une machine virtuelle (IaaS) | Le matériel, l'hyperviseur | Le système d'exploitation, les correctifs, les applications, les données, les accès |
| Une base de données gérée (PaaS) | Ce qui précède, plus le système et ses correctifs | Les données, les accès, la configuration |
| Un service de messagerie (SaaS) | Presque tout | Les utilisateurs, les accès, les données |

Quoi que vous louiez, **les données et les accès restent à vous**.

?? Un bucket S3 public laisse fuir des fichiers clients. Selon le modèle, qui est responsable ?
+ Le client, qui contrôle les réglages de ce bucket
- Le fournisseur, car il possède le matériel de stockage
- Personne, car le stockage cloud est public par nature
- Le fabricant de matériel qui a construit les disques
=> Le fournisseur maintient S3 en marche. Qui peut lire vos données relève de votre configuration.

## Votre base de compte sûre

::: try Avant de déployer quoi que ce soit
1. Activez la MFA pour l'utilisateur root, et ne créez aucune clé d'accès root.
2. Créez une identité d'administration séparée pour le travail quotidien.
3. Posez d'abord une **alarme de budget** : un labo oublié peut coûter de l'argent réel.
4. Activez CloudTrail et GuardDuty.
:::

L'**utilisateur root** possède le compte et ne peut pas être restreint par les politiques ordinaires, donc vous le mettez sous clé. Le critère de validation : cette liste terminée, et une dépense inférieure à 10 $.

?? Pourquoi poser une alarme de budget avant tout le reste ?
+ Une clé volée ou un labo oublié coûtent cher
- AWS ne vous laisse pas continuer sans en avoir
- Les alarmes font tourner plus vite vos autres services
- Une alarme de budget chiffre les données du compte
=> Le coût est aussi un signal de sécurité. Les clés volées servent souvent à lancer des machines coûteuses, et une alarme est votre alerte précoce.

## Le temporaire est préférable

Il existe deux sortes d'identifiants. Les **clés d'accès** de longue durée fonctionnent jusqu'à ce que quelqu'un les retire, donc elles fuient dans le code et restent dangereuses. Un **rôle IAM** n'a pas de clé permanente : une personne ou un service l'endosse, et **STS** délivre des identifiants qui expirent. Préférez les rôles partout où vous le pouvez.

Un rôle a deux politiques. Sa **politique de confiance** dit qui peut l'endosser. Sa politique de permissions dit ce qu'il peut faire. Les deux comptent, comme vous le verrez dans les missions.

Une politique de confiance s'écrit comme n'importe quelle politique, avec un champ de plus, le `Principal` :

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ec2.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
```

Elle dit que les serveurs EC2 peuvent endosser ce rôle. Ce qu'ils reçoivent en retour a trois parties, un identifiant de clé d'accès, une clé secrète et un **jeton de session**, plus une heure d'expiration. L'identifiant de clé vous dit de quelle sorte il s'agit : les temporaires commencent par `ASIA`, et ceux de longue durée par `AKIA`. Dans un fichier qui a fuité, ce préfixe vous dit à quel point vous inquiéter.

?? Un développeur demande à mettre une clé d'accès dans le fichier de configuration d'un serveur. Quelle est une meilleure conception ?
+ Donner plutôt un rôle à ce serveur
- Encoder d'abord la clé entière en base64
- Donner au fichier un nom bien ennuyeux
- Renouveler la clé tous les cinq ans
=> Un rôle fournit automatiquement des identifiants de courte durée, donc il n'y a aucun secret permanent à laisser fuir.

## Lire une politique

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject"],
    "Resource": "arn:aws:s3:::reports-bucket/*"
  }]
}
```

Qui peut faire quoi, sur quelle ressource. `Effect` autorise ou refuse, `Action` est l'appel d'API, et `Resource` est un **ARN**, le nom complet de l'objet. `2012-10-17` est la version du langage de politique, pas une date à modifier. Méfiez-vous de `"Action": "*"` et de `"Resource": "*"` : c'est l'échec le plus courant, y compris dans les politiques écrites par une IA.

Un ARN se lit de gauche à droite, avec des deux-points entre ses parties :

```
arn:aws:iam::123456789012:role/app-server
arn:aws:s3:::reports-bucket/*
```

| Partie | Premier exemple | Second exemple |
|---|---|---|
| Partition | `aws` | `aws` |
| Service | `iam` | `s3` |
| Région | Vide, parce que l'IAM est global | Vide |
| Compte | `123456789012` | Vide, parce que les noms de bucket sont uniques au monde |
| Ressource | `role/app-server` | `reports-bucket/*`, chaque objet du bucket |

Une partie vide garde quand même son deux-points, et c'est pourquoi les ARN de S3 en ont trois à la suite.

@code parse-arn

Une déclaration peut aussi porter une `Condition`, qui restreint les cas où elle s'applique. Celle-ci refuse toute requête vers le bucket qui n'arrive pas par TLS :

```json
{
  "Effect": "Deny",
  "Principal": "*",
  "Action": "s3:*",
  "Resource": ["arn:aws:s3:::reports-bucket", "arn:aws:s3:::reports-bucket/*"],
  "Condition": {"Bool": {"aws:SecureTransport": "false"}}
}
```

Elle a un `Principal` parce que c'est une **politique de ressource**, attachée au bucket, et qu'elle doit donc dire de qui elle parle. Une politique d'identité n'en a pas, parce qu'elle est attachée à l'identité elle-même.

`Action` et `Resource` peuvent chacun être une chaîne ou une liste, donc un programme qui lit des politiques doit gérer les deux. Une fois que c'est fait, les jokers sont faciles à trouver.

@code policy-wildcards

?? Qu'autorise `"Action": "s3:*", "Resource": "*"` ?
+ Toute action S3 sur tous les buckets ici
- Lire un seul objet dans un seul bucket
- Lister les buckets sans jamais lire leur contenu
- Rien tant qu'un humain ne l'a pas approuvé
=> Les jokers signifient toutes les actions S3, suppression comprise, sur toutes les ressources. Le moindre privilège nomme exactement ce qui est nécessaire.

## Comment AWS décide

Voici l'ordre, sous une forme simple. La [logique officielle](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluationlogic.html) est plus détaillée :

@flow Par défaut : refus > Un Deny explicite ? Alors refusé > Les garde-fous (SCP, RCP) doivent autoriser > La politique d'identité ou de ressource doit autoriser

::: key Deux règles couvrent la plupart des cas
Tout est refusé tant que rien ne l'autorise. Et **un refus explicite l'emporte toujours**.
:::

Vous pouvez en écrire le cœur en quelques lignes. Rassemblez les déclarations qui correspondent à la requête. Si l'une d'elles est un Deny, la réponse est le refus. Sinon, si l'une est un Allow, la réponse est l'autorisation. Et si rien du tout n'a correspondu, c'est un **refus implicite**, ce que veut dire « par défaut : refus ».

@code policy-decision

Un garde-fou ajoute une condition de plus. Une SCP n'accorde jamais rien. Elle ne fait que limiter. Une requête passe donc quand la politique d'identité l'autorise *et* que la SCP l'autorise, et un refus dans l'une ou l'autre y met fin.

@code scp-ceiling

Ne devinez pas ce que fait une vraie politique. Demandez à AWS :

```
aws sts get-caller-identity
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::123456789012:role/app-server \
  --action-names s3:GetObject s3:DeleteObject \
  --resource-arns arn:aws:s3:::reports-bucket/q3.pdf
```

La première commande vous dit quelle identité utilise votre terminal, et elle vaut la peine d'être lancée avant toute autre. La seconde évalue les politiques du rôle et affiche `allowed`, `implicitDeny` ou `explicitDeny` pour chaque action.

@drill iam-eval

?? Une politique d'identité autorise `s3:*`, et une SCP refuse `s3:DeleteBucket`. L'utilisateur peut-il supprimer un bucket ?
+ Non, le refus explicite de la SCP l'emporte
- Oui, l'autorisation avec joker l'emporte sur tout ici
- Oui, car les SCP ne visent que root
- Cela dépend de qui a créé le bucket
=> Un refus explicite ne peut pas être contourné, et une SCP fixe le plafond de tout le compte.

## Les échecs derrière la plupart des violations

| Échec | Ce qui tourne mal | Le correctif |
|---|---|---|
| Stockage public | N'importe qui peut lire le bucket | Activer Block Public Access au niveau du compte |
| Clés qui fuient | Une clé atterrit dans un dépôt public | Utiliser des rôles, et rechercher les secrets |
| Métadonnées exposées | Une faille d'une application web amène le serveur à interroger son propre [service de métadonnées](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html), ce qui révèle des identifiants temporaires | Exiger IMDSv2, et donner peu de droits au rôle |
| Trop de pouvoir | Un petit service détient des droits d'administrateur | Le moindre privilège, et des revues régulières |
| Journalisation coupée | Aucune trace de ce qui s'est passé | Protéger CloudTrail, et alerter sur les changements |

::: law Votre propre compte uniquement
Entraînez-vous sur votre propre compte de labo, ou sur des plateformes faites pour cela, comme [flAWS](http://flaws.cloud/) et CloudGoat. Tester le cloud de quelqu'un d'autre sans autorisation est illégal, quels que soient les réglages du bucket.
:::

?? Pourquoi exiger IMDSv2 aide-t-il à protéger un serveur cloud ?
+ Il exige un jeton absent des requêtes forgées simples
- Il supprime les identifiants du serveur toutes les minutes
- Il rend le serveur invisible depuis tout l'internet public
- Il bloque tout le trafic sortant de cette machine
=> IMDSv2 exige un jeton obtenu d'abord par une requête PUT, ce qui bloque beaucoup de chemins de falsification de requête. Gardez quand même des droits réduits pour le rôle.

## Lisez de vraies permissions

@range iam

## Relire un rôle

Un collègue vous demande d'approuver un nouveau rôle pour une tâche de rapports. Voici ses deux déclarations.

```json
{ "Effect": "Allow", "Principal": {"AWS": "*"}, "Action": "sts:AssumeRole" }
```

```json
{ "Effect": "Allow", "Action": "*", "Resource": "*" }
```

?? La première est la politique de confiance. Qui peut endosser ce rôle ?
+ Toute identité de tout compte AWS peut l'endosser
- Seulement l'utilisateur root de ce seul compte AWS
- Seulement les serveurs EC2 de ce même compte
- Personne, car une étoile ne désigne aucune identité
=> Une étoile comme principal veut dire tout le monde, y compris des comptes qui ne sont pas les vôtres. Une politique de confiance devrait nommer le seul service ou le seul rôle qui en a besoin.

?? L'organisation a une SCP qui refuse `iam:*`. Ce rôle peut-il créer un nouvel utilisateur ?
+ Non, un refus explicite bat toute autorisation
- Oui, l'étoile du rôle dépasse le garde-fou
- Oui, une SCP ne vise aucun rôle
- Non, car un rôle n'appelle jamais IAM
=> La politique du rôle autorise tout, et il ne le peut quand même pas. C'est à cela que sert un garde-fou : il tient même quand une politique placée dessous est mal écrite.

?? Un identifiant de clé qui commence par `AKIA` apparaît dans un dépôt public. Quel est le premier geste ?
+ La désactiver, puis vérifier ce qu'elle a fait
- Supprimer le dépôt et n'en parler à personne
- Attendre qu'elle expire toute seule avec le temps
- Renommer le fichier pour tromper tous les scanners
=> `AKIA` désigne une clé de longue durée, donc elle n'expire jamais. Désactivez-la tout de suite, puis lisez dans CloudTrail à quoi elle a servi. Retirer le commit n'aide pas, parce que la clé a déjà été copiée.

## L'infrastructure en tant que code

**Terraform** décrit votre environnement dans des fichiers, donc il est relisible et reproductible. `terraform plan` montre les changements et `terraform destroy` supprime tout, ce qui garde le coût du labo proche de zéro. Un bonus pour la sécurité : un mauvais réglage devient une ligne dans une pull request, que quelqu'un peut repérer. Quand vous serez prêt à tout assembler, essayez la [machine Switchboard](/machines/switchboard/).

?! Pourquoi dit-on que l'identité est le nouveau périmètre dans le cloud ? Expliquez-le à un ami en trois phrases.
