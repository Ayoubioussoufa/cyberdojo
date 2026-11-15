---
title: Un contrôle d'accès qui tient
summary: La faille web grave la plus courante : vérifier à qui appartient chaque objet, protéger les fonctions, arrêter les requêtes intersites, et valider correctement les jetons.
builds: concevoir des contrôles d'autorisation qu'un testeur ne peut pas contourner
source: Aide-mémoire de l'OWASP sur l'autorisation (en anglais) | https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
words: IDOR, CSRF, affectation de masse
---
Le contrôle d'accès défaillant occupe la première place de la liste de l'OWASP. Il est difficile à trouver pour les scanners, car un outil ne peut pas savoir que la facture 1044 n'est pas la vôtre. Il faut une personne qui comprend ce que l'application devrait faire.

@term IDOR (référence directe non sécurisée à un objet) = Atteindre les données d'un autre utilisateur en changeant un identifiant, parce que le serveur ne vérifie pas la propriété.
@term BOLA (autorisation défaillante au niveau de l'objet) = Le nom de l'IDOR dans le monde des API.
@term BFLA (autorisation défaillante au niveau de la fonction) = Atteindre une action que votre rôle ne devrait pas permettre.
@term SameSite = Un réglage de cookie qui limite son envoi par le navigateur sur les requêtes venues d'autres sites.
@term affectation de masse = Une faille où une API enregistre des champs que le client ne devrait pas pouvoir définir.

## Qui, et sur quoi

L'**authentification** demande qui vous êtes. L'**autorisation** demande si vous pouvez faire ceci, sur cette chose, maintenant. La connexion règle la première, et c'est la seconde qui échoue.

Deux niveaux doivent être vérifiés à chaque requête.

| Niveau | Question | Échec | Exemple |
|---|---|---|---|
| Fonction | Ce rôle peut-il utiliser cette action ? | BFLA | Un client appelle l'export d'administration |
| Objet | Cet utilisateur peut-il toucher à cet enregistrement ? | IDOR, ou BOLA | Un client lit la facture d'un autre |

Cacher le bouton d'administration n'est pas un contrôle. N'importe qui peut appeler l'URL directement.

Les conceptions les plus solides placent les deux questions dans une seule fonction que chaque route doit appeler, et cette fonction part de « non ». Une requête n'est autorisée que si une règle le dit, ce qui signifie qu'une route à laquelle quelqu'un a oublié de penser est refusée, et non ouverte. La réponse est l'un des trois codes d'état que vous connaissez déjà :

| Réponse | Signification |
|---|---|
| `401` | Personne n'est connecté. Connectez-vous d'abord |
| `403` | Vous êtes connecté, et ceci ne vous revient pas |
| `200` | Autorisé |

Écrivez cette fonction pour la boutique de cette leçon. Elle tient en une douzaine de lignes, et c'est le centre de la sécurité de toute l'application.

@code authorize-request

?? Le lien de la page d'administration est caché aux utilisateurs ordinaires, mais l'URL n'a aucun contrôle. Quelle est la faille ?
+ Cacher un lien n'applique aucune vraie permission
- Le lien devrait plutôt changer de couleur
- Un utilisateur ordinaire ne tape aucune URL
- La page demande une adresse plus étrange
=> Les astuces d'interface ne sont pas des contrôles. Le serveur doit vérifier le rôle à chaque requête.

## Le correctif au niveau de l'objet

Voici le bug grave le plus fréquent des applications web, et son correctif.

@seq Navigateur | Application | Base de données
Navigateur > Application: Ana demande la note 42
Application > Base de données: À qui est la note 42 ?
Base de données > Application: À Sam
Application > Navigateur: 403 : Ana n'est pas Sam

```python
# Dangereux : il trouve la facture, mais ne demande jamais à qui elle est
invoice = Invoice.get(id=invoice_id)

# Sûr : la requête elle-même est limitée à cet utilisateur
invoice = Invoice.get(id=invoice_id, owner_id=current_user.id)
```

La version sûre intègre le contrôle de propriété à la recherche, de sorte qu'il est plus difficile de l'oublier. Des identifiants aléatoires aident un peu, mais ils ne sont pas un contrôle : un identifiant peut fuir, et alors rien n'arrête le lecteur. Vérifiez toujours.

Dans une vraie route, le schéma est une petite fonction d'aide que chaque gestionnaire utilise, de sorte que la recherche dangereuse n'est jamais écrite :

```python
def owned_invoice(invoice_id):
    invoice = Invoice.get(id=invoice_id, owner_id=current_user.id)
    if invoice is None:
        abort(404)
    return invoice
```

Remarquez le 404. Pour la personne qui demande, « cette facture n'existe pas » et « cette facture n'est pas la vôtre » se ressemblent, et c'est voulu : un 403 confirmerait que le numéro 1044 est une vraie facture qui appartient à quelqu'un.

Les bonnes conceptions **refusent par défaut** et placent le contrôle à un seul endroit central, plutôt que de le disperser dans les gestionnaires. Écrivez un test : connectez-vous comme l'utilisateur A, demandez l'enregistrement de l'utilisateur B, et attendez un refus.

@drill web-class

?? Une équipe remplace les numéros de facture par de longues chaînes aléatoires. L'IDOR est-il corrigé ?
+ Non, le contrôle de propriété manque toujours
- Oui, personne ne devine de longues chaînes
- Oui, car ces chaînes sont toujours chiffrées
- Non, car un identifiant doit rester petit
=> Les identifiants aléatoires rendent la devinette plus difficile, et ils fuient par les liens, les journaux et les courriels. L'autorisation reste nécessaire.

## Les requêtes intersites

Les navigateurs joignent vos cookies à toute requête envoyée à un site, même si elle est lancée par un autre site web. Une page malveillante pourrait donc faire envoyer par votre navigateur une requête à votre banque pendant que vous y êtes connecté. C'est le **CSRF**.

Trois défenses fonctionnent ensemble :

| Défense | Comment elle aide |
|---|---|
| Cookies `SameSite=Lax` ou `Strict` | Le navigateur cesse d'envoyer le cookie sur la plupart des requêtes intersites |
| Jetons anti-CSRF | Un formulaire doit contenir une valeur secrète que les autres sites ne peuvent pas lire |
| Utiliser POST pour les modifications | Un simple lien ne peut pas déclencher l'action |

Un jeton anti-CSRF est moins mystérieux qu'il n'en a l'air. Au début de la session, le serveur fabrique une valeur aléatoire avec `secrets.token_urlsafe(32)`, la garde dans la session, et l'écrit dans chaque formulaire sous forme de champ caché. Quand un formulaire revient, le serveur compare le champ à la copie de la session. L'autre site peut faire envoyer le formulaire par votre navigateur, et il ne peut pas lire vos pages, donc il n'apprend jamais la valeur à y mettre.

@code csrf-check

?? Pourquoi le CSRF ne touche-t-il pas une API qui utilise un jeton dans un en-tête plutôt qu'un cookie ?
+ Le navigateur n'ajoute pas cet en-tête de lui-même
- Les en-têtes sont toujours chiffrés par chaque navigateur
- Une API ne reçoit aucune requête de navigateur
- Les jetons d'en-tête ne marchent que sur mobile
=> Le CSRF abuse de l'envoi automatique des cookies. Un jeton que JavaScript doit ajouter volontairement n'est pas envoyé par la page d'un autre site.

## Enregistrer ce qu'il ne faut pas

L'**affectation de masse** se produit quand un framework copie chaque champ soumis dans un enregistrement de la base. Si un utilisateur ajoute `"role": "admin"` à une mise à jour de profil, un serveur négligent l'enregistre.

```python
# Dangereux : chaque champ envoyé par le client est enregistré
user.update(**request.json)

# Sûr : seuls ces champs peuvent changer
data = ProfileUpdate(**request.json)   # un schéma qui nomme name et bio
user.update(name=data.name, bio=data.bio)
```

La version sûre est un filtre que vous pouvez écrire en une ligne, et l'idée est encore la liste d'autorisation : le serveur nomme les champs qu'un client peut changer, et rien d'autre ne passe, quelle que soit la façon dont la requête a été construite.

@code allowed-fields

?? Quelle est la meilleure défense contre l'affectation de masse ?
+ Une liste explicite des champs que le client définit
- Cacher le champ du rôle dans la page web
- Renommer la colonne en base avec un nom inhabituel
- Demander aux utilisateurs de ne rien envoyer en plus
=> Nommez ce qui est permis. Tout le reste est écarté, quelle que soit la façon dont la requête est fabriquée.

## Les jetons

Un **JWT** a trois parties : un en-tête, des affirmations et une signature. Les affirmations sont seulement encodées, donc n'importe qui peut les lire. N'y mettez pas de secrets. Ce qui rend un JWT digne de confiance est la signature, donc :

- Vérifiez la signature à chaque requête, avec un algorithme fixe, au moyen d'une bibliothèque éprouvée.
- N'acceptez jamais l'algorithme que nomme le jeton lui-même.
- Vérifiez l'expiration, l'émetteur et l'audience.
- Gardez des durées de vie courtes.

Avec la bibliothèque PyJWT, les quatre règles tiennent en un appel. Chaque argument après la clé est un contrôle que vous devriez sinon vous rappeler :

```python
claims = jwt.decode(
    token,
    key,
    algorithms=["HS256"],          # fixé par vous, jamais lu dans le jeton
    audience="notes-app",
    issuer="https://idp.example",
)
```

L'expiration est vérifiée automatiquement. Si un contrôle échoue, l'appel lève une exception et vous ne voyez jamais les affirmations, ce qui est un échec en mode fermé.

?? La charge utile d'un JWT dit `"admin": true`. Pourquoi un serveur peut-il s'y fier ?
+ Seulement si sa signature a été correctement vérifiée
- Parce que les JWT sont chiffrés par défaut
- Parce que le navigateur l'a déjà bien vérifiée
- Parce qu'elle est arrivée par une connexion HTTPS
=> N'importe qui peut modifier les affirmations lisibles. Seule une signature valide prouve que votre système les a émises.

## Testez la règle, pas la page

L'autorisation a besoin de tests, car rien ne plante quand un contrôle manque. Faites un petit tableau de qui peut faire quoi, puis automatisez-le :

| Action | Anonyme | Client | Autre client | Administrateur |
|---|---|---|---|---|
| Lire la facture 1043 | 401 | 200 | **403 ou 404** | 200 |
| Tout exporter | 401 | 403 | 403 | 200 |

Chaque case de ce tableau est un court test. Voici celui de la case en gras :

```python
def test_customer_cannot_read_another_customers_invoice(client):
    login(client, "ana")
    response = client.get("/invoices/1044")      # cette facture appartient à sam
    assert response.status_code in (403, 404)
```

Une fois les tests écrits, comparer le tableau que vous vouliez à ce que l'application répond réellement est mécanique, et un programme peut lister les cases qui diffèrent.

@code access-failures

?? Quel test attrape un IDOR ?
+ L'utilisateur A demande un enregistrement de B
- Un administrateur demande sa page de profil
- Un visiteur anonyme charge la page d'accueil
- Un utilisateur se connecte sans aucune erreur
=> Les bugs de contrôle d'accès n'apparaissent qu'entre deux identités. Tester avec un seul compte ne prouve rien.

## Quand les règles rencontrent la vraie vie

Le contrôle d'accès n'est jamais terminé, parce que les besoins des gens changent et que quelqu'un essaie toujours les portes. Deux situations que vous rencontrerez dès votre premier mois dans une équipe :

```
203.0.113.9  ana  GET /admin/export  403
203.0.113.9  ana  GET /admin/users   403
203.0.113.9  ana  GET /admin/config  403
203.0.113.9  ana  GET /admin/backup  403
```

?? Ces quatre lignes arrivent en dix secondes, depuis un compte de client. Quelle est la lecture raisonnable ?
+ Quelqu'un teste des routes admin non protégées
- Un client perdu réclame de meilleurs menus
- Le serveur en panne refuse absolument tout
- Un administrateur a oublié son propre secret
=> Un client n'a de lien vers aucune de ces pages. Quatre requêtes refusées de suite vers des chemins d'administration, c'est quelqu'un qui parcourt une liste, et les contrôles ont tenu. Cela mérite une alerte, car le cinquième chemin pourrait ne pas tenir.

?? L'équipe du support doit maintenant lire la facture de n'importe quel client pour répondre aux tickets. Quel est le bon changement ?
+ Ajouter un rôle support à la politique centrale
- Retirer le contrôle de propriété de la route
- Donner aux agents le mot de passe administrateur
- Dire au support de demander des captures d'écran
=> Un nouveau besoin est une nouvelle règle, écrite au seul endroit où vivent les règles, avec la plus petite permission qui fait l'affaire : lire, et non modifier ni exporter.

?! Expliquez l'IDOR à un développeur en deux minutes : ce que c'est, pourquoi les scanners le manquent, et comment le corriger.

### Pour aller plus loin

Les sources primaires et le meilleur matériel gratuit sur ce sujet, tous vérifiés en novembre 2026 (en anglais) :

- [Aide-mémoire de l'OWASP sur la prévention des références directes non sécurisées à des objets](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html)
- [Aide-mémoire de l'OWASP sur la prévention du cross-site request forgery](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
