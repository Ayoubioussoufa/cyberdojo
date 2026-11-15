---
title: Gestion des identités et des accès
summary: Le cycle de vie des identités, une MFA qui résiste à l'hameçonnage, RBAC et ABAC, et pourquoi l'identité est la couche la plus attaquée.
builds: raisonner sur qui doit avoir accès à quoi, et pour combien de temps
source: NIST SP 800-63, lignes directrices sur l'identité numérique (en anglais) | https://pages.nist.gov/800-63-4/
words: IAM, RBAC, clé d'accès
---
La phase 2 commence. De plus en plus, les attaquants ne forcent pas l'entrée : ils se connectent. Les identifiants et les jetons volés figurent dans une grande part des intrusions, comme le montre chaque année le [DBIR de Verizon](https://www.verizon.com/business/resources/reports/dbir/) (en anglais), ce qui fait de l'identité la couche la plus attaquée, sur site comme dans le cloud.

@term IAM (gestion des identités et des accès) = Les politiques et les outils qui contrôlent qui peut accéder à quoi.
@term arrivée-mutation-départ = Le cycle de vie des accès d'une personne quand elle arrive, change de poste et part.
@term RBAC (contrôle d'accès fondé sur les rôles) = Accorder les permissions par des rôles, plutôt qu'à des individus.
@term ABAC (contrôle d'accès fondé sur les attributs) = Décider de l'accès à partir d'attributs comme le service, l'appareil ou l'heure.
@term clé d'accès (FIDO2) = Une connexion fondée sur la cryptographie à clé publique, liée à un appareil, qui résiste à l'hameçonnage.
@term accès juste-à-temps = Accorder des droits élevés seulement pour une durée limitée, quand il le faut.
@term PAM (gestion des accès à privilèges) = Des outils qui contrôlent et enregistrent l'usage des comptes puissants.
@term fatigue MFA = Inonder quelqu'un de demandes de connexion jusqu'à ce qu'il en approuve une.
@term SSO (authentification unique) = Se connecter une seule fois pour accéder à de nombreuses applications.

## Le cycle de vie des identités

La plupart des problèmes d'accès viennent de la façon dont les gens changent avec le temps :

@flow Arrivée : créer les accès > Mutation : modifier les accès > Départ : retirer les accès

**Arrivée :** une nouvelle recrue reçoit ce dont son poste a besoin. **Mutation :** quelqu'un change d'équipe et garde aussi ses anciens accès, accumulant peu à peu des droits. C'est la dérive des privilèges. **Départ :** quelqu'un part, et son compte traîne. Les comptes orphelins sont une porte d'entrée favorite.

Suivez une personne tout au long du cycle. Ana arrive à la Finance en janvier et est ajoutée au groupe `finance-read`. En juin, elle passe au Marketing et est ajoutée à `marketing-edit`. Personne ne retire `finance-read`, car ajouter un accès est une demande que quelqu'un relance, et le retirer est une demande que personne ne fait. En décembre, elle part, et son compte reste actif parce que les RH et l'informatique utilisent des systèmes différents. Une carrière ordinaire a maintenant produit les deux problèmes : six mois d'un accès dont elle n'avait pas besoin, et un compte sans propriétaire.

Le correctif n'est pas de l'astuce, c'est une routine. Une **revue des accès** compare ce que les gens possèdent à ce que leur poste actuel autorise, et retire la différence. Vous pouvez en faire une petite sur votre propre VM Linux dès maintenant :

```
id sam                        un compte : son identifiant et tous les groupes auxquels il appartient
getent group sudo             un groupe : tous ceux qui en font partie
sudo -l -U sam                ce que sam peut lancer en root
last sam | head -3            les connexions les plus récentes de sam
```

```
$ id sam
uid=1001(sam) gid=1001(sam) groups=1001(sam),27(sudo),999(docker)
```

Lisez les groupes comme une liste de pouvoirs. `sudo` signifie « peut devenir root ». `docker` signifie presque la même chose, car un membre peut lancer un conteneur qui monte tout le disque. Un compte dans l'un de ces groupes a besoin d'une raison que quelqu'un sait énoncer.

Quand un compte doit disparaître, désactivez-le d'abord et supprimez-le plus tard, pour que ses fichiers et son historique restent disponibles :

```
sudo usermod -L sam           verrouiller le mot de passe
sudo chage -E 0 sam           faire expirer le compte, ce qui bloque aussi les clés SSH
```

Une revue est la comparaison de deux listes, ce qui en fait une chose naturelle à automatiser. Écrivez le cœur d'une revue.

@code extra-access

@code stale-accounts

Analyste IAM est un poste de débutant courant, surtout dans les banques et les télécoms. Une grande partie du travail est exactement cela.

?? Quelqu'un change d'équipe et garde ses anciens accès. Comment cela s'appelle-t-il ?
+ La dérive des privilèges, un problème de mutation
- Les comptes orphelins, un problème lié au départ
- Le bourrage d'identifiants, un simple problème de connexion
- Le vol de jeton, un problème de session
=> Les droits s'empilent avec le temps si l'étape de mutation ne retire pas les anciens.

## Les facteurs d'authentification

| Facteur | Exemple | Faiblesse |
|---|---|---|
| Ce que vous **savez** | Mot de passe | Hameçonné, deviné, réutilisé |
| Ce que vous **possédez** | Téléphone, clé de sécurité | Perdu, ou les demandes sont approuvées |
| Ce que vous **êtes** | Empreinte digitale | Impossible à changer en cas de fuite |

La MFA, ce sont deux facteurs *différents*. Ils ne se valent pas, cependant :

| Méthode | Résistance à l'hameçonnage |
|---|---|
| Code par SMS | Faible : échange de carte SIM, et il peut être relayé |
| Code d'une application d'authentification | Moyenne : il peut être tapé sur un faux site |
| Approbation par notification | Moyenne : **fatigue MFA** |
| **FIDO2 / clé d'accès** | Forte |

Pour voir pourquoi un code peut être hameçonné, regardez comment il est fabriqué. Quand vous scannez le QR code dans une application d'authentification, le site et votre téléphone stockent le même secret. Toutes les 30 secondes, les deux font le même calcul : un HMAC du secret et du pas de temps en cours, réduit à six chiffres. Rien n'est envoyé à votre téléphone. Le site vérifie simplement que vous savez produire le nombre qu'il a calculé lui aussi.

| Étape | Ce qui se passe |
|---|---|
| 1 | Compter les pas de 30 secondes depuis 1970 : l'heure actuelle en secondes, divisée par 30 |
| 2 | Calculer le HMAC-SHA1 du secret et de ce compteur, écrit sur 8 octets |
| 3 | Prendre les 4 derniers bits du résultat comme position, et lire 4 octets à partir de là |
| 4 | Effacer le bit de poids fort, puis garder les six derniers chiffres décimaux |

L'étape 3 s'appelle la troncature dynamique, et ce n'est qu'une façon fixe de choisir 4 des 20 octets. C'est l'algorithme de la [RFC 4226](https://www.rfc-editor.org/rfc/rfc4226), et la [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238) y ajoute l'horloge. Remarquez ce qui manque dans le calcul : le nom du site. Le code est valable pour quiconque le présente pendant ces 30 secondes, y compris un faux site qui le transmet aussitôt.

@code hotp-code

Une clé d'accès referme cette brèche. À l'inscription, votre appareil crée une paire de clés pour ce seul site et envoie la clé publique. À la connexion, le site envoie un défi aléatoire, et l'appareil signe le défi avec l'adresse du site auquel il parle réellement. Un faux site à une autre adresse obtient une signature que le vrai site rejette. Il n'y a aucun secret à taper, donc rien à remettre.

Pourquoi les clés d'accès sont-elles différentes ? L'appareil utilise une paire de clés, et la connexion est [liée au vrai domaine du site](https://fidoalliance.org/passkeys/). Un faux site sur un autre domaine n'obtient rien d'utile, il n'y a donc aucun code qu'une victime puisse taper.

?? Pourquoi une clé d'accès résiste-t-elle à l'hameçonnage là où un code à usage unique ne résiste pas ?
+ Elle est liée cryptographiquement au vrai site
- Elle change toutes les trente secondes, seule
- Elle est bien plus longue qu'un code
- Elle est rangée sur le serveur central
=> Un code peut être tapé sur un faux site et relayé. La réponse d'une clé d'accès ne fonctionne que pour le domaine authentique.

## Les modèles d'autorisation

| Modèle | Comment il décide | Exemple |
|---|---|---|
| **RBAC** | Selon le rôle | « Les analystes peuvent lire les journaux » |
| **ABAC** | Selon les attributs et le contexte | « Les responsables, sur des appareils gérés, aux heures de bureau » |

RBAC est simple mais les rôles se multiplient. ABAC est souple mais plus difficile à raisonner. Beaucoup de systèmes mélangent les deux. L'accès conditionnel de Microsoft Entra est de l'ABAC en pratique.

?? « Les responsables, sur des appareils gérés, aux heures de bureau » est un exemple de quoi ?
+ ABAC, qui utilise des attributs et le contexte
- RBAC, qui n'utilise absolument jamais que des rôles
- MFA, qui utilise plusieurs facteurs de connexion distincts
- SSO, qui utilise une seule et unique connexion
=> Il décide selon des attributs de l'utilisateur, de l'appareil et de l'heure, pas seulement selon un rôle.

## Réduire les privilèges permanents

Le **moindre privilège** s'applique aussi dans le temps. Pourquoi un administrateur serait-il administrateur à 3 heures du matin, pendant son sommeil ?

- **Accès juste-à-temps :** demander une élévation pour une heure, avec une raison.
- **PAM :** sortir les identifiants puissants d'un coffre, et enregistrer la session.
- **Comptes d'administration séparés :** le courrier quotidien depuis un compte, l'administration depuis un autre.

Si un compte n'a aucun privilège permanent, le voler rapporte peu.

?? Un compte d'administrateur est volé. Quel contrôle aurait le plus limité les dégâts ?
+ Une élévation juste-à-temps, sans aucun droit permanent
- Des mots de passe valables plus longtemps
- Une bannière de connexion mettant en garde
- Une formation mensuelle de sensibilisation pour tous
=> Sans droits permanents, le compte volé ne peut pas faire grand-chose à lui seul.

@term revue des accès = Un contrôle périodique que les gens ont encore besoin des accès qu'ils possèdent.

## Faire une revue des accès

Trois constats d'une revue. Décidez ce que chacun signifie avant de lire les choix.

```
uid=1014(intern-leo) gid=1014(intern-leo) groups=1014(intern-leo),27(sudo),999(docker)
```

?? Qu'est-ce qui ressort de ce compte ?
+ Un stagiaire peut devenir root de deux façons
- Un stagiaire a un identifiant d'utilisateur très élevé
- Un stagiaire appartient à son propre groupe personnel
- Un stagiaire a un nom avec trait d'union
=> `sudo` donne root directement et `docker` le donne en pratique. Aucun des deux ne correspond au poste d'un stagiaire, donc les deux demandent la raison d'un responsable, ou un retrait.

?? Un compte dont le propriétaire est parti il y a huit mois est encore actif, et il s'est connecté la semaine dernière. Que faites-vous ?
+ Le désactiver, puis enquêter sur cette connexion
- Le supprimer, puis ne plus y penser
- Le laisser, puisqu'il fonctionne encore très bien
- Changer son secret, puis le réutiliser ensuite
=> Un compte orphelin encore utilisé signifie que quelqu'un détient ses identifiants. Désactivez-le pour que l'accès cesse, et conservez-le pour que les preuves restent.

?? À 2 heures du matin, un utilisateur reçoit trente demandes d'approbation sur son téléphone et finit par toucher « Approuver ». Que s'est-il passé ?
+ Fatigue MFA, un attaquant avait le mot de passe
- Simple erreur de synchronisation, l'application s'est répétée toute seule
- Connexion par clé d'accès, que l'appareil a signée seul
- Revue des accès, le système les a tous vérifiés
=> Les demandes n'apparaissent qu'après un mot de passe correct. L'attaquant l'avait déjà et a insisté jusqu'à ce que l'utilisateur cède. La correspondance de numéros, ou une clé d'accès, supprime le geste facile.

?! Une collègue est passée de la Finance au Marketing et a toujours ses accès Finance. Nommez le problème, le risque, et le processus qui aurait dû l'empêcher.
