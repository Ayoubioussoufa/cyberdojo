---
title: Kubernetes et le zero trust
summary: Les rouages d'un cluster, le durcissement par RBAC et par politiques, la détection à l'exécution, l'idée de ne jamais faire confiance selon l'emplacement, et la rédaction d'un ADR.
builds: un cluster local durci et un registre de décision d'architecture
source: Liste de contrôle de sécurité de Kubernetes (en anglais) | https://kubernetes.io/docs/concepts/security/security-checklist/
words: pod, zero trust, ADR
---
Deux idées terminent le tronc commun : comment tournent les charges de travail modernes, et comment concevoir la sécurité quand on part du principe que le réseau n'est pas digne de confiance.

@term Kubernetes = Un système qui exécute et gère des conteneurs sur de nombreuses machines.
@term pod = La plus petite unité que Kubernetes exécute : un ou plusieurs conteneurs ensemble.
@term namespace (Kubernetes) = Une façon de diviser un cluster en zones séparées.
@term NetworkPolicy = Une règle Kubernetes qui contrôle quels pods peuvent se parler.
@term contrôle d'admission = Des vérifications qui s'exécutent quand quelque chose est créé dans un cluster, et qui peuvent le refuser.
@term Falco = Un outil libre de détection des menaces à l'exécution pour les conteneurs.
@term zero trust = Un modèle de sécurité qui vérifie chaque requête et n'accorde aucune confiance selon l'emplacement réseau.
@term ADR (registre de décision d'architecture) = Un court document qui consigne une décision de conception et sa raison.
@term etcd = La base de données où Kubernetes garde l'état du cluster, secrets compris.
@term kubelet = L'agent de chaque nœud qui exécute les pods.
@term nœud = Une machine d'un cluster Kubernetes.
@term manifeste = Un fichier YAML qui décrit ce que vous voulez que Kubernetes exécute.

## Le cluster

Imaginez un port. Des conteneurs arrivent, et quelque chose doit décider quel navire les transporte, relancer ce qui tombe en panne et garder tout en ordre. **Kubernetes** fait cela pour le logiciel.

Vous écrivez un **manifeste** qui dit ce que vous voulez, comme « trois copies de cette image ». Kubernetes le réalise.

L'**API server** est la porte d'entrée, **etcd** stocke l'état, et chaque **nœud** fait tourner un **kubelet**. Presque tout passe par l'API server, donc qui peut l'appeler, et avec quels droits, est la question centrale. C'est la même leçon que pour l'IAM dans le cloud.

?? Pourquoi un accès non authentifié à etcd est-il si grave ?
+ Il contient l'état du cluster et tous ses secrets
- Il sert les pages web que visitent les utilisateurs
- Il ne stocke que quelques journaux temporaires sans importance
- Il contrôle la vitesse des disques de chaque nœud
=> Lire etcd peut tout révéler, secrets compris. C'est pourquoi il exige du chiffrement et un accès strict.

## Le durcissement

| Mesure | But |
|---|---|
| RBAC | Le moindre privilège pour les personnes et les comptes de service |
| Namespaces + NetworkPolicies | Limiter qui peut parler à qui |
| [Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/) | Les profils Privileged, Baseline ou Restricted |
| Politique d'admission (Kyverno, OPA) | Refuser les charges de travail dangereuses |
| Gestion des secrets | Ni dans les images, ni dans des manifestes en clair |
| Falco | La détection à l'exécution |

Des NetworkPolicies en refus par défaut, c'est la même idée que votre pare-feu du Mois 3. Vérifiez votre installation avec `kube-bench`.

Par défaut, chaque pod peut en général joindre tous les autres, ce qui fait d'un pod compromis une tête de pont vers le reste. Et chaque pod a un **compte de service**, donc un jeton volé peut appeler l'API avec tous les droits de ce compte.

Voici ce que demande le profil Restricted, écrit dans un pod :

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web
  namespace: shop
spec:
  automountServiceAccountToken: false
  securityContext:
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: web
      image: registry.example/shop@sha256:4f1a…
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: ["ALL"]
```

Chaque ligne retire quelque chose dont se servirait un attaquant dans le conteneur : root, les capacités supplémentaires du noyau, la possibilité de gagner des privilèges par un programme setuid, un système de fichiers modifiable, et un jeton de compte de service dont le serveur web n'avait jamais besoin. Étiquetez le namespace `pod-security.kubernetes.io/enforce: restricted`, et l'API server refuse les pods qui ne sont pas conformes.

@code pod-security-check

Une politique de refus par défaut pour un namespace tient en quatre lignes de `spec`. Un `podSelector` vide sélectionne chaque pod du namespace, et lister `Ingress` sans aucune règle ne laisse rien entrer :

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: shop
spec:
  podSelector: {}
  policyTypes: ["Ingress"]
```

Vous ajoutez ensuite une politique pour chaque conversation qui doit avoir lieu, comme l'API qui joint la base de données. La règle s'apprend facilement à l'envers : un pod qu'**aucune** politique ne sélectionne accepte le trafic de partout, et un pod que n'importe quelle politique sélectionne n'accepte que ce que ces politiques autorisent.

@code network-policy

Le RBAC se vérifie de la même façon. Un Role liste des règles, et trois motifs méritent un constat : un `*` dans les verbes ou les ressources, la lecture des `secrets`, et `pods/exec`, qui est un shell dans le conteneur de quelqu'un d'autre. Demandez au cluster ce qu'une identité peut vraiment faire, plutôt que de lire du YAML :

```
kubectl auth can-i --list --as=system:serviceaccount:shop:default -n shop
```

@code rbac-review

@drill k8s-control

?? Quel Pod Security Standard est le plus verrouillé ?
+ Restricted
- Baseline
- Privileged
- Unconfined
=> Restricted suit les bonnes pratiques actuelles de durcissement. Privileged est sans restriction, et Baseline empêche les élévations connues.

## Relisez de vrais manifestes

@range k8s

::: ai Exercice de la feuille de route
Faites générer des manifestes par un LLM, puis validez-les. Comptez les réglages par défaut dangereux : pods privilégiés, RBAC large, étiquettes `latest`. Ce décompte fait un article de blog.
:::

## Détecter à l'exécution

La prévention échouera parfois. **Falco** observe ce que font les conteneurs au niveau des appels système, et alerte sur des comportements comme un shell qui démarre dans le conteneur d'un serveur web. Puisque les conteneurs doivent faire une seule tâche étroite, un comportement inhabituel ressort nettement. C'est encore la pyramide de la douleur : détecter le comportement.

Une règle Falco se lit comme une phrase :

```yaml
- rule: Shell in a web container
  desc: A shell started inside a container
  condition: spawned_process and container and proc.name in (bash, sh)
  output: "Shell in container (user=%user.name container=%container.name cmd=%proc.cmdline)"
  priority: WARNING
```

`spawned_process` et `container` sont des macros des règles par défaut de Falco : un nouveau processus, à l'intérieur d'un conteneur. La ligne de sortie tire des champs de l'événement, si bien que l'alerte dit qui, où et quoi, sans que personne n'ouvre un journal.

?? Pourquoi est-il souvent plus facile de détecter un comportement étrange dans un conteneur que sur un portable ?
+ Un conteneur fait une seule tâche étroite et prévisible
- Un conteneur ne peut jamais lancer le moindre shell
- Un portable de bureau n'enregistre jamais aucun événement utile
- Falco bloque tous les attaquants avant même qu'ils n'arrivent
=> Un conteneur web qui lance soudain un shell ressort. Un portable fait mille choses, donc la normale y est plus difficile à définir.

## Le zero trust

L'ancienne façon de penser : être à l'intérieur du réseau, c'est être digne de confiance. Pensez à un château : une fois la muraille franchie, vous pouvez aller partout. Le [NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final) rejette cela : aucune confiance implicite liée à l'emplacement. Chaque requête est authentifiée et autorisée, selon l'identité, l'appareil et le contexte.

@flow Qui êtes-vous ? > L'appareil est-il sain ? > Est-ce autorisé maintenant ? > Accorder étroitement > Continuer à vérifier

C'est une direction, pas un produit. Le [modèle de maturité de la CISA](https://www.cisa.gov/zero-trust-maturity-model) aide à planifier les étapes.

Écrite sous forme de code, une décision zero trust regarde la requête, pas le réseau dont elle vient :

| Vérification | Si elle échoue |
|---|---|
| Le rôle peut utiliser cette ressource | Refuser |
| L'appareil est géré, pour une ressource sensible | Refuser |
| La MFA a été faite récemment | La redemander |

Le réseau source n'apparaît nulle part dans ce tableau. Une requête venue du bureau et une autre venue d'un café sont jugées sur les mêmes faits.

@code zero-trust-decision

?? Que veut vraiment dire « zero trust » ?
+ Rien n'est digne de confiance pour son emplacement réseau
- Aucun employé n'est plus jugé digne d'un quelconque accès
- Plus personne n'a désormais besoin du moindre pare-feu réseau
- Un seul produit qui vous rend enfin vraiment sûr
=> Il s'agit de supprimer la confiance implicite. L'accès est toujours accordé, mais explicitement et étroitement.

## Penser en architecte

Une bonne architecture, ce sont des compromis mis par écrit. Un **ADR** consigne le contexte, la décision, les options rejetées et les conséquences. Commencez à en écrire pour vos propres projets.

```
# ADR 7 : le panneau d'administration exige un appareil géré
Statut : accepté
Contexte : les administrateurs se connectent depuis chez eux. Le VPN donne un large accès au réseau.
Décision : un proxy sensible à l'identité, avec MFA et vérification de l'appareil.
Rejeté : le VPN seul (un portable volé obtient tout).
Conséquences : des connexions un peu plus lentes. Les prestataires ont besoin d'appareils gérés.
```

?? Quelle est la partie la plus précieuse d'un ADR, un an plus tard ?
+ Pourquoi les autres options ont été rejetées à l'époque
- La police exacte de caractères utilisée pour le rédiger
- Une copie complète de tout le code source associé
- Les noms de tous les animaux de chaque participant
=> Six mois plus tard, personne ne se souvient pourquoi. Le raisonnement empêche l'équipe de refaire un débat, ou de défaire une bonne décision.

## Relire un manifeste

Une équipe vous demande d'approuver ceci avant la mise en production.

```yaml
spec:
  containers:
    - name: api
      image: registry.example/api:latest
      securityContext:
        privileged: true
```

Et le namespace n'a aucune NetworkPolicy.

?? Que donne `privileged: true` au conteneur ?
+ Presque tout le pouvoir de root sur son nœud
- Un accès plus rapide au réseau interne du cluster
- Une plus grande part de la mémoire du nœud
- Le droit de lire seulement ses propres fichiers journaux
=> Un conteneur privilégié peut atteindre les périphériques et les fonctions du noyau de l'hôte, donc s'échapper vers le nœud est facile. Le profil Restricted l'interdit.

?? Que signifie l'absence de NetworkPolicy pour ce pod ?
+ N'importe quel pod du cluster peut le joindre
- Aucun pod ne pourra jamais plus le joindre
- Seuls les pods du namespace peuvent le joindre
- Seul l'API server lui-même peut encore le joindre
=> Un pod qu'aucune politique ne sélectionne accepte le trafic de partout. Ajoutez une politique de refus par défaut, puis n'autorisez que les appelants dont il a besoin.

?? Pourquoi `:latest` pose-t-il problème ici ?
+ Personne ne peut dire quelle image tourne réellement
- Kubernetes refuse toujours toute image étiquetée avec latest
- Les images latest sont toujours les plus lentes
- L'étiquette fait tourner tout le conteneur en root
=> `latest` bouge à chaque fois que quelqu'un pousse une image. Épinglez par condensé, comme à la leçon 69, pour que ce qui a été relu soit ce qui tourne.

?! Rédigez un court ADR : « Pourquoi notre panneau d'administration exige un appareil géré, plutôt qu'un simple VPN. »
