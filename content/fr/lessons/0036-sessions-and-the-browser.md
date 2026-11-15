---
title: Sessions, cookies et sécurité du navigateur
summary: Comment les sites se souviennent de vous, comment la politique de même origine vous protège, et ce que fait réellement CORS.
builds: régler les attributs de sécurité d'un cookie et expliquer la politique de même origine
source: MDN, Politique de même origine | https://developer.mozilla.org/fr/docs/Web/Security/Same-origin_policy
words: session, politique de même origine, JWT
---
HTTP n'a pas de mémoire. Chaque requête est indépendante, alors comment un site sait-il que vous êtes toujours connecté ? La réponse crée toute une classe d'attaques, et le navigateur a des règles intégrées pour les contenir.

@term session = Un enregistrement côté serveur d'un utilisateur connecté, relié au navigateur par un jeton.
@term identifiant de session = La valeur aléatoire qui identifie une session, en général stockée dans un cookie.
@term JWT (JSON Web Token) = Un jeton signé qui porte des affirmations sur un utilisateur.
@term politique de même origine = La règle du navigateur qui empêche les scripts d'un site de lire les données d'un autre site.
@term origine = La combinaison du schéma, de l'hôte et du port qui définit un site pour un navigateur.
@term CORS (partage de ressources entre origines) = Un moyen pour un serveur de laisser d'autres origines précises lire ses réponses.
@term XSS (cross-site scripting) = Injecter un script dans une page pour qu'il s'exécute dans le navigateur d'autres utilisateurs.
@term CSRF (falsification de requête intersites) = Amener un navigateur connecté à envoyer une requête que l'utilisateur ne voulait pas.

## Les sessions

1. Vous vous connectez, et le serveur crée une **session** et génère un long **identifiant de session** aléatoire.
2. Le serveur l'envoie dans un en-tête `Set-Cookie`.
3. Votre navigateur le joint à chaque requête suivante vers ce site.

@seq Navigateur | Serveur
Navigateur > Serveur: Connexion avec un mot de passe
Serveur > Navigateur: Set-Cookie: session=x7f...
Navigateur > Serveur: Requête suivante, avec le cookie
Serveur > Navigateur: Je connais cette session : c'est vous

Ce cookie **est** donc votre connexion. Celui qui le détient est vous, sans besoin de mot de passe. Le protéger est le but de tout ce qui suit.

Regardez le vôtre. Connectez-vous à un site quelconque, appuyez sur F12, et ouvrez **Application → Cookies** dans Chrome ou **Stockage → Cookies** dans Firefox. Chaque ligne est un cookie, avec son nom, sa valeur et une colonne pour chaque attribut que vous verrez dans la section suivante. Tapez ensuite `document.cookie` dans l'onglet **Console**. Vous verrez moins de cookies que dans le tableau : ceux qui manquent sont cachés aux scripts, volontairement.

Depuis le terminal, `curl` peut garder les cookies dans un fichier comme un navigateur les garde en mémoire :

```
curl -i -c jar.txt https://httpbin.org/cookies/set/session/abc123     enregistrer ce que le serveur définit
curl -b jar.txt https://httpbin.org/cookies                           le renvoyer
```

La première réponse contient une ligne `Set-Cookie`, et la seconde requête porte une ligne `Cookie` avec la même valeur. Cet échange, répété à chaque clic, est tout ce que signifie « être connecté ».

Puisque l'identifiant est la connexion, il doit être impossible à deviner. Un bon identifiant vient d'une source aléatoire cryptographique et il est long : en Python, `secrets.token_urlsafe(32)` donne 43 caractères aléatoires. Un identifiant qui s'incrémente, ou qui est construit à partir du nom d'utilisateur et de l'heure, peut être prédit, et alors personne n'a besoin de le voler. Trois règles complètent le tableau : délivrer un nouvel identifiant à la connexion pour qu'un identifiant posé avant la connexion ne vaille rien, faire expirer les sessions après une période d'inactivité, et supprimer l'enregistrement du serveur à la déconnexion pour que le cookie cesse de fonctionner même si quelqu'un en a gardé une copie.

?? Pourquoi un cookie de session a-t-il autant de valeur ?
+ Celui qui le détient est connecté
- Il contient le mot de passe
- Il ne peut servir qu'une fois
- Il stocke la clé du serveur
=> Le cookie tient lieu de connexion, donc le voler permet de se passer du mot de passe.

## Les attributs des cookies

```http
Set-Cookie: session=x7f3k9...; HttpOnly; Secure; SameSite=Lax; Path=/
```

| Attribut | Effet | Bloque |
|---|---|---|
| `HttpOnly` | JavaScript ne peut pas lire le cookie | Le vol par XSS |
| `Secure` | Envoyé en HTTPS seulement | Le vol sur le réseau |
| `SameSite=Lax` ou `Strict` | Non envoyé sur la plupart des requêtes intersites | Une grande partie du CSRF |

L'[aide-mémoire de l'OWASP sur la gestion des sessions](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) (en anglais) en ajoute : régénérer l'identifiant à la connexion, et faire expirer les sessions.

Les attributs ne sont que des mots dans un en-tête, donc un programme peut les vérifier. Les scanners qui notent les cookies d'un site font exactement ce que vous allez écrire.

@code missing-cookie-flags

?? Un attaquant peut exécuter du JavaScript sur votre site grâce à une faille. Quel attribut empêche ce script de lire le cookie de session ?
+ `HttpOnly`, qui le cache aux scripts
- `Secure`, qui le cache aux scripts
- `SameSite`, qui le cache aux scripts
- `Path`, qui le cache aux scripts
=> `HttpOnly` retire le cookie de `document.cookie`. Il ne corrige pas le XSS, mais il limite les dégâts.

## Sessions ou jetons

| | Session côté serveur | JWT |
|---|---|---|
| Où est l'état ? | Sur le serveur | Dans le jeton signé |
| Le révoquer | Supprimer l'enregistrement | Difficile avant son expiration |
| Risque | Le stockage des sessions est une cible | Signatures mal vérifiées, jetons qui vivent trop longtemps |

Un **JWT** a trois parties, `header.payload.signature`, chacune encodée en Base64URL. **La charge utile n'est pas chiffrée** : n'importe qui peut la lire. Collez-en un dans [jwt.io](https://jwt.io/). La signature prouve seulement qu'il n'a pas été modifié. Les règles sont dans la [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519).

Prouvez-le vous-même. Voici un jeton complet :

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbmEiLCJyb2xlIjoidXNlciIsImV4cCI6MTc5NDAwMDAwMH0.c2lnbmF0dXJl
```

Coupez-le aux points et décodez en Base64 la partie du milieu, et vous obtenez `{"sub":"ana","role":"user","exp":1794000000}` : à qui le jeton est destiné, un rôle, et une date d'expiration en secondes depuis 1970. Aucune clé n'a été nécessaire. Deux règles en découlent. Ne mettez jamais rien de secret dans un JWT. Et le serveur doit vérifier la signature à chaque requête, car n'importe qui peut aussi écrire une charge utile qui dit `"role":"admin"`, et la signature est la seule chose qui montre que le serveur ne l'a pas délivrée.

Base64URL supprime le remplissage `=` que le Base64 ordinaire met à la fin, donc un décodeur doit le rajouter jusqu'à ce que la longueur soit un multiple de quatre.

@code jwt-payload

?? La charge utile d'un JWT est-elle secrète ?
+ Non, n'importe qui peut la lire
- Oui, elle est toujours fortement chiffrée
- Oui, seuls les navigateurs la lisent
- Non, elle n'est jamais envoyée ailleurs
=> Elle est seulement encodée. La signature prouve qu'elle n'a pas été modifiée.

## La politique de même origine

Imaginez que vous êtes connecté à votre banque, et que vous ouvrez `evil.example` dans un autre onglet. Pourquoi son JavaScript ne peut-il pas lire votre solde ?

À cause de la [politique de même origine](https://developer.mozilla.org/fr/docs/Web/Security/Same-origin_policy). Les scripts ne peuvent lire que les réponses de leur propre **origine** : le schéma, l'hôte et le port doivent tous correspondre.

| URL | Même origine que `https://shop.example` ? |
|---|---|
| `https://shop.example/cart` | Oui |
| `http://shop.example` | Non : le schéma diffère |
| `https://api.shop.example` | Non : l'hôte diffère |
| `https://shop.example:8443` | Non : le port diffère |

La comparaison est mécanique, ce qui veut dire que vous pouvez l'écrire. Un détail compte : une URL sans port utilise le port par défaut de son schéma, donc `https://shop.example` et `https://shop.example:443` sont la même origine.

@code same-origin

::: trap La politique empêche de lire, pas d'envoyer
Une page de `evil.example` peut quand même **envoyer** une requête à votre banque, et votre navigateur peut y joindre le cookie. Elle ne peut simplement pas lire la réponse. C'est cette brèche qu'exploite le CSRF, et les cookies `SameSite` la resserrent.
:::

Voici le CSRF pas à pas, car il explique pourquoi les attributs existent. Vous êtes connecté à votre banque. Dans un autre onglet, vous ouvrez une page qui contient un formulaire caché adressé à l'URL de virement de la banque, et un script le soumet. Votre navigateur envoie la requête, et il y joint le cookie de la banque puisque la requête va vers la banque. La banque voit une session valide et un virement valide. L'attaquant n'a jamais vu votre cookie et n'a jamais lu de réponse.

Deux défenses referment la brèche. `SameSite=Lax` dit au navigateur de ne pas joindre le cookie à ce genre de requête intersites. Un **jeton CSRF** est une seconde valeur aléatoire que la banque place dans ses propres formulaires et vérifie à chaque modification : l'autre site ne peut pas lire les pages de la banque, donc il ne peut pas connaître le jeton.

?? `https://api.shop.example` et `https://shop.example` partagent-ils une origine ?
+ Non, car l'hôte n'est pas identique
- Oui, car les deux utilisent HTTPS
- Oui, car ils partagent un domaine
- Non, car le port est différent
=> Le schéma, l'hôte et le port doivent tous correspondre exactement.

## CORS

Parfois, une interface sur `app.example` a légitimement besoin d'une API sur `api.example`. **CORS** permet à un serveur d'assouplir la politique :

```http
Access-Control-Allow-Origin: https://app.example
Access-Control-Allow-Credentials: true
```

CORS n'ajoute jamais de protection : il ne fait que relâcher le comportement par défaut. Le bug classique est un serveur qui renvoie n'importe quel `Origin` reçu tout en autorisant les identifiants. Alors n'importe quel site peut lire les données des utilisateurs connectés. Les détails sont sur [MDN](https://developer.mozilla.org/fr/docs/Web/HTTP/CORS).

Vous pouvez tester votre propre API contre ce bug en une ligne. Envoyez une origine inventée, et lisez ce qui revient :

```
curl -i -H "Origin: https://not-my-site.example" https://api.example/profile
```

Si la réponse dit `Access-Control-Allow-Origin: https://not-my-site.example` avec `Access-Control-Allow-Credentials: true`, le serveur fait confiance à tout le monde. Un serveur correct répond avec l'une des origines de sa propre liste fixe, ou sans aucun en-tête CORS.

?? Quelle affirmation sur CORS est correcte ?
+ Il assouplit la règle de même origine pour certains
- Il empêche les autres sites d'envoyer la moindre requête
- Il chiffre toutes les réponses entre deux origines différentes
- Il remplace le besoin d'authentification sur toutes les API
=> Par défaut, les scripts ne peuvent pas lire les réponses d'une autre origine. CORS, c'est le serveur qui dit qui le peut. Mal le configurer ouvre les données.

## Auditer une réponse de connexion

Voici ce qu'un site renvoie après une connexion réussie. Lisez-le comme le ferait un relecteur.

```http
HTTP/1.1 200 OK
Set-Cookie: session=1042; Path=/
Access-Control-Allow-Origin: https://not-my-site.example
Access-Control-Allow-Credentials: true
```

?? Quelle faiblesse voyez-vous dans l'identifiant de session lui-même ?
+ Il est court et ressemble à un compteur
- Il est envoyé dans une simple ligne d'en-tête
- Il est défini pour le site tout entier
- Il est renvoyé avec un code d'état 200
=> `1042` laisse penser que l'utilisateur précédent a reçu 1041. Un identifiant doit être long et aléatoire, sinon un attaquant peut simplement essayer les nombres voisins.

?? La ligne `Set-Cookie` n'a pas d'attribut `Secure`. Qu'est-ce que cela permet ?
+ Le cookie peut voyager en HTTP non chiffré
- Le cookie peut être lu par des scripts
- Le cookie ne peut plus jamais expirer ensuite
- Le cookie peut être envoyé entre plusieurs sites
=> Sans `Secure`, le navigateur envoie aussi le cookie sur des requêtes non chiffrées, où n'importe qui sur le chemin réseau peut le copier. La lecture par les scripts, c'est ce que contrôle `HttpOnly`.

?? Un utilisateur modifie la charge utile de son JWT de `"role":"user"` en `"role":"admin"`. Qu'est-ce qui empêche que cela fonctionne ?
+ Le serveur vérifie la signature à chaque fois
- La charge utile est chiffrée avec une clé
- Le navigateur refuse d'envoyer tout jeton ainsi modifié
- Le jeton est trop long pour être modifié
=> N'importe qui peut lire et réécrire la charge utile. La signature ne correspond plus au nouveau contenu, donc un serveur qui la vérifie rejette le jeton. Un serveur qui saute la vérification l'accepte.

::: try Inspectez une vraie session
1. Connectez-vous à un site que vous utilisez, ouvrez le tableau des cookies dans les outils de développement, et trouvez le cookie de session. Notez lesquels de `HttpOnly`, `Secure` et `SameSite` il possède.
2. Tapez `document.cookie` dans la Console et confirmez que les cookies `HttpOnly` manquent.
3. Lancez les deux lignes `curl` avec le fichier de cookies et trouvez les en-têtes `Set-Cookie` et `Cookie` avec `-v`.
4. Décodez à la main le JWT d'exemple ci-dessus, en Python ou dans [CyberChef](https://gchq.github.io/CyberChef/). N'utilisez que des jetons inventés : un vrai jeton est un identifiant en cours de validité.
:::

?! Un cookie de session volé laisse entrer un attaquant sans mot de passe. Citez trois protections qui réduisent ce risque, et comment chacune aide.
