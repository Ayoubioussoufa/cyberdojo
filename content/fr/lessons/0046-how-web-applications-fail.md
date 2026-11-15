---
title: Comment les applications web échouent
summary: La carte du défenseur pour la sécurité web : pourquoi les applications cassent, l'OWASP Top 10:2025, et comment lire une requête web comme une preuve.
builds: expliquer les grandes classes de failles web et les lire dans les journaux
source: OWASP Top 10:2025 (en anglais) | https://owasp.org/Top10/
words: frontière de confiance, OWASP Top 10, contrôle d'accès défaillant
---
La plupart de ce que les entreprises mettent sur Internet est une application web, c'est donc là qu'arrivent la plupart des attaques. Ce mois-ci, vous apprendrez comment ces applications échouent, et surtout comment les construire et les corriger pour qu'elles n'échouent pas.

Ce cours enseigne le côté du défenseur : la cause de chaque faille, le correctif, et la façon de la repérer. Pour vous exercer volontairement à attaquer, utilisez la [Web Security Academy de PortSwigger](https://portswigger.net/web-security) (en anglais), gratuite, conçue pour cela et légale.

@term OWASP = Une communauté à but non lucratif qui publie des recommandations gratuites sur la sécurité des applications.
@term OWASP Top 10 = La liste de l'OWASP des risques de sécurité les plus critiques pour les applications web.
@term contrôle d'accès défaillant = Quand un utilisateur peut atteindre des données ou des actions qu'il ne devrait pas.
@term client = Le programme qui fait une requête, en général un navigateur.
@term côté serveur = Qui s'exécute sur le serveur, là où l'utilisateur ne peut rien modifier.

## L'idée unique derrière presque tout

Une application web, ce sont deux programmes. L'un tourne dans le navigateur de l'utilisateur, et vous ne le contrôlez pas. L'autre tourne sur votre serveur, et vous le contrôlez. Tout ce qui passe de l'un à l'autre, que ce soit un formulaire, une URL, un cookie ou un en-tête, vient du côté de l'utilisateur.

Voici donc la règle : **ne faites jamais confiance à ce qui vient du client.** Une liste déroulante qui limite un prix à trois valeurs ne veut rien dire, car une personne peut envoyer la requête qu'elle veut avec un outil simple. Les contrôles JavaScript dans le navigateur aident l'utilisateur, et seuls les contrôles sur le serveur vous protègent.

@flow Navigateur (non fiable) > Serveur web (vos règles s'exécutent ici) > Base de données (vos données)

Presque chaque faille de ce mois est cette règle, enfreinte à un endroit différent.

Voyez la frontière par vous-même, sur n'importe quelle page qui a un formulaire. Ouvrez les outils de développement, choisissez l'onglet **Éléments**, faites un clic droit sur un champ et choisissez **Modifier en tant que HTML**. Vous pouvez changer un `maxlength`, ajouter une option à une liste déroulante, ou rendre visible un champ caché, et la page l'accepte, car la page tourne sur votre machine et vous appartient. Soumettez ensuite, et regardez l'onglet **Réseau** : la requête transporte ce que vous y avez mis. Le formulaire du développeur était une suggestion.

Le correctif a toujours la même forme : le serveur garde sa propre copie des faits et n'utilise le message du client que comme une demande. Pour une boutique, le client peut dire quel article et combien. Il ne peut pas dire ce que coûte l'article.

@code server-side-price

La seconde moitié de la règle est la **validation** : avant d'utiliser une valeur, le serveur vérifie qu'elle est bien du genre qu'il attend. Une bonne validation est une liste d'autorisation. Elle décrit ce qui est acceptable et refuse tout le reste, ce qui est bien plus sûr que d'essayer de lister tout ce qui est mauvais. Une quantité est un nombre entier de 1 à 99, et il n'y a rien à ajouter.

@code valid-quantity

?? Un formulaire d'achat fixe le prix dans un champ caché, et le serveur utilise cette valeur. Quelle est la faille ?
+ Le serveur fait confiance à une valeur du client
- Les champs cachés sont trop lents pour un paiement
- Le formulaire aurait plutôt dû utiliser une liste déroulante
- Les prix doivent toujours être rangés dans un cookie
=> L'utilisateur contrôle tout ce qui part du navigateur, champs cachés compris. Le serveur doit chercher le prix lui-même.

## La carte : l'OWASP Top 10:2025

L'[OWASP Top 10](https://owasp.org/Top10/) est la liste commune du secteur. Apprenez les noms, car les offres d'emploi et les rapports les utilisent, le plus souvent en anglais.

| Rang | Risque | En clair |
|---|---|---|
| A01 | Broken Access Control | Des utilisateurs atteignent ce qu'ils ne devraient pas, ce qui inclut désormais la falsification de requête côté serveur |
| A02 | Security Misconfiguration | Des réglages non sûrs, des pages de débogage, des mots de passe par défaut |
| A03 | Software Supply Chain Failures | Des dépendances et des systèmes de construction risqués |
| A04 | Cryptographic Failures | Des données mal protégées |
| A05 | Injection | Une entrée traitée comme du code |
| A06 | Insecure Design | Le plan lui-même est défectueux |
| A07 | Authentication Failures | Des connexions qui peuvent être contournées ou devinées |
| A08 | Software or Data Integrity Failures | Faire confiance à des mises à jour ou à des données sans les vérifier |
| A09 | Logging and Alerting Failures | Des attaques qui passent inaperçues |
| A10 | Mishandling of Exceptional Conditions | Des erreurs gérées de façon non sûre, par exemple en laissant passer |

Remarquez que seules certaines sont des erreurs de programmation. La conception, la configuration et la journalisation figurent aussi sur la liste, donc une équipe a besoin de plus que de programmeurs soigneux.

Un nom se retient mieux une fois qu'il a un visage. Voici chacun sous la forme d'une chose qui arrive vraiment, avec le réglage par défaut qui l'empêche :

| Risque | Un exemple de tous les jours | Ce qui l'empêche |
|---|---|---|
| A01 | Changer `/orders/15` en `/orders/16` montre la commande d'un inconnu | Un contrôle de propriété sur chaque route |
| A02 | Un panneau d'administration a encore son mot de passe d'usine | Une base durcie, revue à intervalles réguliers |
| A03 | Une bibliothèque tirée par la construction a été détournée | Des versions figées et une analyse des dépendances |
| A04 | Des mots de passe stockés avec un hachage rapide et sans sel | Argon2id, et TLS partout |
| A05 | Un champ de recherche dont le texte devient une partie d'une requête SQL | Les requêtes paramétrées |
| A06 | « Mot de passe oublié » demande le nom de jeune fille de votre mère | Une modélisation des menaces avant de construire |
| A07 | Aucune limite sur les tentatives de connexion | La limitation de débit et la MFA |
| A08 | Une mise à jour est installée sans vérifier sa signature | Des mises à jour signées, vérifiées avant usage |
| A09 | Une attaque a duré un mois et personne ne l'a vue | Des journaux que quelqu'un lit vraiment, avec des alertes |
| A10 | Un contrôle de permissions plante, et la requête passe | L'échec en mode fermé |

?? Lequel de ces cas est un défaut de conception plutôt qu'une erreur de programmation ?
+ Un mot de passe réinitialisé par des réponses devinables
- Une faute de frappe qui saute une petite validation
- Une balise fermante qui manque dans une page HTML
- Un nom de variable mal orthographié dans le code
=> Le code peut fonctionner parfaitement et rester dangereux, parce que l'idée est défectueuse. C'est A06, Insecure Design.

## Lire une requête

Tout ce que vous examinerez ce mois-ci commence ici. Voici une ligne du journal d'accès d'un serveur web :

```
203.0.113.7 - - [27/Oct/2026:22:14:21 +0000] "GET /invoices/1043 HTTP/1.1" 200 1893
```

| Partie | Signification |
|---|---|
| `203.0.113.7` | Qui a demandé |
| `GET` | La méthode : une lecture |
| `/invoices/1043` | Ce qui a été demandé |
| `200` | Le serveur a dit oui |
| `1893` | Combien d'octets ont été envoyés |

Imaginez maintenant cet utilisateur qui demande `/invoices/1044`, `/invoices/1045` et ainsi de suite, et reçoit toujours `200`. Rien ne ressemble à une erreur. Sans contrôle que la facture 1044 lui appartient, le journal montre un vol de données qui ressemble à une navigation normale.

Ce motif est quelque chose qu'un programme peut rechercher. Une requête pour une facture est ordinaire. Une longue série de numéros voisins venue d'un seul utilisateur, c'est une personne qui longe un couloir et essaie chaque porte.

@code sequential-ids

?? Un journal montre un utilisateur qui récupère les factures 1000 à 1400 dans l'ordre, toutes avec le code 200. Qu'est-ce qui doit vous inquiéter ?
+ Il lit peut-être les factures d'autres clients
- Le serveur renvoie beaucoup trop peu d'erreurs
- Son navigateur a un cache mal réglé
- Les factures ne doivent pas utiliser GET
=> Des identifiants qui se suivent avec des succès sont la trace classique d'un contrôle de propriété manquant. La leçon 48 porte sur sa correction.

## Prévenir vaut mieux que corriger

Les tests trouvent les failles une par une. De bons réglages par défaut en suppriment des classes entières. Un moteur de gabarits qui échappe par défaut arrête la plupart des XSS. Une bibliothèque de requêtes à paramètres arrête la plupart des injections SQL. Un framework qui vérifie les permissions sur chaque route arrête les contrôles oubliés. En lisant les leçons suivantes, demandez-vous toujours : qu'est-ce qui pourrait rendre cette erreur impossible ?

@drill web-class

?? Une équipe corrige la même faille pour la cinquième fois. Quelle est l'étape suivante la plus solide ?
+ Changer le réglage par défaut, pour l'empêcher de revenir
- Organiser une formation de plus sur ce même sujet
- Demander aux développeurs de faire plus attention à l'avenir
- Ajouter une ligne à ce sujet dans le wiki
=> Des réglages sûrs par défaut valent mieux que des rappels. Faites de la voie sûre la voie facile, et toute la classe de failles disparaît.

## Échouer en mode fermé

Tôt ou tard, un contrôle cassera : la base est lente, un service est en panne, une valeur manque. Ce que fait le code à ce moment-là est une décision de sécurité que quelqu'un a prise, souvent sans s'en apercevoir. Lisez lentement cette fonction :

```python
def can_view(user, invoice_id):
    try:
        owner = lookup_owner(invoice_id)
        return owner == user.id
    except Exception:
        return True      # FAUX : une erreur ouvre la porte
```

Celui qui a écrit la dernière ligne voulait que la page continue de fonctionner pendant une panne. L'effet est que quiconque peut provoquer une erreur, avec un identifiant étrange ou simplement en demandant à un moment chargé, voit toutes les factures. C'est un **échec en mode ouvert**. La version sûre **échoue en mode fermé** : quand le contrôle ne peut pas aboutir, la réponse est non, et l'erreur va dans le journal où quelqu'un la verra.

```python
    except Exception:
        log.exception("ownership check failed for invoice %s", invoice_id)
        return False
```

?? Le service antifraude d'un site de paiement cesse de répondre. Que doit faire le site des nouvelles commandes ?
+ Les retenir, et alerter très vite l'équipe
- Les accepter, le contrôle ne refusant rien
- Les accepter, mais pour les clients connus
- Les supprimer, sans rien dire aux clients
=> Quand un contrôle ne peut pas s'exécuter, le comportement sûr est de s'arrêter et de le dire. Tout laisser passer transforme une panne en moyen de contourner le contrôle.

## Un premier regard depuis l'extérieur

Certaines faiblesses se lisent sans se connecter, car le serveur les annonce. Demandez à n'importe quel site ses seuls en-têtes de réponse :

```
curl -I https://example.com
```

```
HTTP/2 200
server: Apache/2.4.49 (Unix)
x-powered-by: PHP/7.2.1
content-type: text/html
```

| Ce que vous voyez | Ce que cela dit à un relecteur |
|---|---|
| `server` et `x-powered-by` avec des numéros de version | Le site dit à chaque visiteur quel logiciel exact aller chercher |
| Pas de `strict-transport-security` | Les navigateurs ne reçoivent pas l'ordre d'exiger HTTPS |
| Pas de `content-security-policy` | Le navigateur ne reçoit aucune règle sur les scripts autorisés |
| Pas de `x-content-type-options: nosniff` | Les navigateurs peuvent deviner le type d'un fichier, et mal deviner |

Rien de tout cela n'est une intrusion. Chacun est un réglage laissé à sa valeur par défaut, et ensemble ils vous disent avec quel soin le reste a été configuré. Lancez la commande contre le serveur de votre labo et contre un grand site connu, et comparez les deux listes.

?? Les en-têtes d'un site indiquent `server: Apache/2.4.49` et `x-powered-by: PHP/7.2.1`. De quel risque du Top 10 s'agit-il ?
+ Mauvaise configuration de sécurité, il affiche ses versions exactes
- Injection, les en-têtes contiennent du code qui est caché
- Contrôle d'accès défaillant, n'importe qui peut lire les en-têtes
- Défaillances cryptographiques, les en-têtes ne sont pas chiffrés ici
=> Les en-têtes sont faits pour être lus. La faute est le réglage qui affiche les numéros de version, ce qui épargne à un attaquant le travail de découvrir ce qui tourne.

?! Avec vos propres mots, expliquez pourquoi « ne jamais faire confiance au client » compte, avec un exemple tiré d'une application que vous utilisez.
