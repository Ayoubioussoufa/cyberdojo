---
title: Comment fonctionne le web
summary: HTTP en profondeur : requêtes, réponses, méthodes, codes d'état et en-têtes, vus avec curl et les outils de développement du navigateur.
builds: lire et composer à la main des requêtes HTTP brutes
source: MDN, Un aperçu de HTTP | https://developer.mozilla.org/fr/docs/Web/HTTP/Overview
words: requête HTTP, code d'état, proxy inverse
---
Le web est la plus grande surface d'attaque qui soit. Ce mois-ci, vous apprenez comment il fonctionne en le construisant correctement. Au mois 8, vous apprendrez comment il échoue, et comment le réparer. Si vous sautez cette étape, le piratage web devient une liste d'astuces que vous ne comprenez pas vraiment.

@term requête HTTP = Un message d'un client qui demande à un serveur de faire quelque chose.
@term réponse HTTP = La réponse d'un serveur, avec un code d'état, des en-têtes et en général un corps.
@term URL = Une adresse web qui nomme un protocole, un hôte, un chemin et des paramètres facultatifs.
@term méthode HTTP = L'action que demande une requête, comme GET ou POST.
@term en-tête HTTP = Une métadonnée nommée sur une requête ou une réponse.
@term code d'état = Un nombre à trois chiffres qui dit comment une requête s'est passée.
@term chaîne de requête = La partie d'une URL après le ?, qui porte les paramètres.
@term cookie = Une petite valeur qu'un serveur demande au navigateur de stocker et de renvoyer.
@term serveur web = Un logiciel qui accepte des requêtes HTTP et renvoie des réponses.
@term proxy inverse = Un serveur placé devant une application, qui reçoit les requêtes et les transmet.
@term REST = Un style courant pour les API web, qui utilise des URL pour les ressources et les méthodes HTTP pour les actions.
@term WAF (pare-feu applicatif web) = Un filtre qui inspecte le trafic HTTP à la recherche d'attaques.

## HTTP n'est que du texte

Un navigateur et un serveur échangent des messages simples et lisibles. Voyez-en un vous-même :

```
curl -v https://example.com/
```

```http
> GET / HTTP/1.1
> Host: example.com
> User-Agent: curl/8.5.0
> Accept: */*

< HTTP/1.1 200 OK
< Content-Type: text/html
< Content-Length: 1256
<
< <!doctype html>...
```

Les lignes avec `>` sont la requête, et les lignes avec `<` sont la réponse. L'[aperçu de MDN](https://developer.mozilla.org/fr/docs/Web/HTTP/Overview) couvre le tout.

Anatomie d'une requête :

```
POST /login?next=/home HTTP/1.1          méthode, chemin, chaîne de requête, version
Host: shop.example                       en-têtes
Content-Type: application/x-www-form-urlencoded
Cookie: session=abc123

username=ana&password=hunter2            corps
```

La première ligne d'une requête vient de l'URL que vous avez tapée, donc apprenez à démonter une URL :

```
https://shop.example:443/search?q=red%20boots&page=2#reviews
└─┬─┘   └────┬─────┘ └┬┘└──┬──┘ └────────┬─────────┘ └──┬──┘
schéma     hôte     port chemin  chaîne de requête   fragment
```

| Partie | Signification |
|---|---|
| Schéma | Le protocole : `https` est du HTTP à l'intérieur de TLS |
| Hôte | Quel serveur. Il est résolu par le DNS, puis renvoyé dans l'en-tête `Host` |
| Port | 443 pour `https` et 80 pour `http` s'il n'est pas écrit |
| Chemin | Quelle ressource sur ce serveur |
| Chaîne de requête | Les paramètres, sous forme de paires `nom=valeur` reliées par `&` |
| Fragment | Un endroit dans la page. Le navigateur le garde et ne l'envoie jamais au serveur |

Une URL ne peut contenir que certains caractères, donc les autres sont **encodés en pourcentage** : une espace devient `%20`, et un `/` à l'intérieur d'une valeur devient `%2F`. Le serveur les décode avant usage. Les attaquants encodent leur entrée pour la même raison que vous, et parfois deux fois pour passer un filtre, donc décodez toujours une URL tirée d'un journal avant de la juger.

La bibliothèque standard de Python fait le découpage et le décodage. Écrivez une fonction avec elle.

@code query-params

Puisqu'une requête n'est que du texte, vous pouvez en démonter une avec les outils pour les chaînes du mois 4. La première ligne a trois parties séparées par des espaces, et chaque en-tête est un nom, un deux-points et une valeur.

@code parse-request

::: key On ne peut pas faire confiance au client
Chaque partie de cette requête est sous le contrôle de l'expéditeur : la méthode, les en-têtes, les cookies, le corps. Les formulaires de votre navigateur ne sont qu'une façon de l'envoyer. Des outils comme `curl` et Burp peuvent envoyer n'importe quoi. Presque toute la sécurité du web découle de ce seul fait.
:::

?? Quelle partie d'une requête l'expéditeur contrôle-t-il ?
+ Tout, y compris les en-têtes
- Seulement le texte du formulaire
- Seulement l'adresse du site web
- Rien, le navigateur contrôle tout
=> Les outils peuvent envoyer n'importe quoi, et c'est pourquoi le serveur ne doit jamais faire confiance au client.

## Les méthodes

| Méthode | But | A un corps ? |
|---|---|---|
| `GET` | Lire quelque chose | Non |
| `POST` | Soumettre ou créer | Oui |
| `PUT` | Remplacer | Oui |
| `PATCH` | En modifier une partie | Oui |
| `DELETE` | Supprimer | En général non |
| `OPTIONS` | Demander ce qui est permis | Non |

GET ne devrait jamais rien modifier. Les valeurs d'une URL finissent aussi dans les journaux et l'historique du navigateur, donc les secrets n'y ont jamais leur place.

Les en-têtes portent tout ce qui n'est ni l'adresse ni le corps. Vous lirez ceux-ci dans chaque enquête :

| En-tête | Sens | Ce qu'il vous dit |
|---|---|---|
| `Host` | Requête | Quel site sur le serveur |
| `User-Agent` | Requête | Ce que le client prétend être. Il peut dire n'importe quoi |
| `Cookie` | Requête | Les valeurs que le serveur a demandé au navigateur de garder, renvoyées à chaque fois |
| `Authorization` | Requête | Des identifiants, comme un jeton d'API |
| `Referer` | Requête | La page d'où vient l'utilisateur |
| `Content-Type` | Les deux | Le format du corps |
| `Set-Cookie` | Réponse | Une valeur que le navigateur doit stocker |
| `Location` | Réponse | Où aller ensuite, avec un code 3xx |
| `Server` | Réponse | Quel logiciel a répondu, s'il choisit de le dire |

?? Pourquoi les secrets ne doivent-ils pas aller dans une URL ?
+ Les URL finissent dans les journaux et l'historique
- Une URL ne contient ni lettres ni chiffres
- Les requêtes GET sont toujours chiffrées deux fois
- Les navigateurs refusent de charger des adresses longues
=> Même en HTTPS, une URL est écrite dans les journaux du serveur et l'historique du navigateur.

## Les codes d'état

| Plage | Signification | Exemples |
|---|---|---|
| 2xx | Succès | 200 OK, 201 Created |
| 3xx | Redirection | 301, 302 |
| 4xx | Votre requête a un problème | 400, 401, 403, 404, 429 |
| 5xx | Le serveur a un problème | 500, 502, 503 |

Retenez : **401** signifie « qui êtes-vous ? » et **403** signifie « je sais qui vous êtes, et c'est non ».

Le premier chiffre est la partie à lire d'abord, car il vous dit qui doit agir : personne pour 2, le client pour 3 et 4, le propriétaire du serveur pour 5.

@code status-class

@drill http-status

?? Un formulaire web cache le champ du prix et utilise JavaScript pour empêcher sa modification. Le prix peut-il quand même être changé ?
+ Oui, n'importe qui peut forger la requête directement
- Non, les champs cachés ne sont jamais renvoyés
- Non, le navigateur applique toutes les règles JavaScript
- Seulement si le site utilise du HTTP simple
=> Les contrôles du navigateur sont une commodité. Le serveur doit tout valider, car le client est sous le contrôle de l'attaquant.

## Le chemin d'une requête

Les vrais sites ont des couches, et chacune écrit ses propres journaux :

@flow Navigateur > CDN ou WAF > Proxy inverse > Serveur d'application > Base de données

Un **proxy inverse** comme nginx termine TLS et transmet les requêtes à l'application. Un piège : l'application voit souvent l'IP du proxy, donc l'IP du vrai client arrive dans un en-tête comme `X-Forwarded-For`, qu'un client peut forger si le proxy n'est pas configuré avec soin.

?? Pourquoi `X-Forwarded-For` peut-il tromper un enquêteur ?
+ Un client peut forger cet en-tête
- Il ne montre que votre adresse
- Il est chiffré, donc totalement illisible
- Les proxys l'effacent toujours des journaux
=> Ne lui faites confiance que si votre propre proxy le définit, et retire ce que les clients envoient.

## Essayez

::: try Dans votre VM
```
curl -i https://example.com/                     inclure les en-têtes de la réponse
curl -X POST -d "a=1" https://httpbin.org/post   envoyer un POST
curl -H "User-Agent: test" https://httpbin.org/headers
```
Ouvrez ensuite les outils de développement de votre navigateur (F12), allez dans l'onglet Réseau, et chargez un site quelconque. Cliquez sur une requête et lisez ses en-têtes.
:::

?? Dans la requête ci-dessus, qu'apprend le serveur avec `Host: shop.example` ?
+ Quel site web sur ce serveur
- Quel utilisateur a ouvert une session
- Quel système le client utilise vraiment
- Quelle base stocke toutes les données
=> Un serveur peut héberger de nombreux sites, donc l'en-tête `Host` dit lequel. Il est obligatoire en HTTP/1.1.

## Lancez un serveur et observez-le

Vous avez été le client. Soyez maintenant le serveur, sur votre propre machine, et regardez les requêtes arriver. Python inclut un petit serveur web qui sert les fichiers du dossier courant. Liez-le à `127.0.0.1` pour que seule votre machine puisse l'atteindre :

```
mkdir web && cd web
echo "hello" > index.html
python3 -m http.server 8000 --bind 127.0.0.1
```

Laissez-le tourner. Dans un second terminal, envoyez trois requêtes, puis revenez au premier terminal :

```
curl -i http://127.0.0.1:8000/
curl -i http://127.0.0.1:8000/nope
curl -i -X POST -d "a=1" http://127.0.0.1:8000/
```

```
127.0.0.1 - - [15/Nov/2026 11:17:53] "GET / HTTP/1.1" 200 -
127.0.0.1 - - [15/Nov/2026 11:17:53] "GET /nope HTTP/1.1" 404 -
127.0.0.1 - - [15/Nov/2026 11:17:53] "POST / HTTP/1.1" 501 -
```

Chaque ligne est une requête telle que le serveur l'a vue : qui a demandé, quand, la ligne de requête elle-même, et le code renvoyé. Le fichier qui existe a reçu 200, celui qui n'existe pas a reçu 404, et ce serveur simple ne sait pas du tout traiter POST, il a donc répondu 501, « non implémenté ». Arrêtez-le avec Ctrl+C.

Un serveur de production écrit la même histoire avec plus de colonnes. Voici une ligne d'un **journal d'accès** nginx, la preuve la plus courante dans les enquêtes web :

```
203.0.113.7 - - [15/Nov/2026:10:14:02 +0100] "GET /admin HTTP/1.1" 403 153 "-" "curl/8.5.0"
```

| Champ | Valeur ici |
|---|---|
| Adresse du client | `203.0.113.7` |
| Heure | 15 novembre, 10:14:02, une heure d'avance sur UTC |
| Ligne de requête | `GET /admin HTTP/1.1` |
| Code d'état | `403` |
| Octets envoyés | `153` |
| Referer | `-`, donc aucun n'a été donné |
| User-Agent | `curl/8.5.0` |

Tout ce qui est entre guillemets a été écrit par le client. L'adresse, l'heure et le code d'état ont été écrits par votre serveur. Cette séparation vous dit sur quels champs vous pouvez vous appuyer.

?? Que s'est-il passé dans cette ligne du journal d'accès ?
+ Le serveur a refusé une requête vers `/admin`
- Le serveur a bien renvoyé la page d'administration
- Le client a demandé une page qui manque
- Le serveur a planté au moment de répondre
=> 403 signifie que le serveur a compris la requête et l'a refusée. Une page manquante donnerait 404, et un plantage donnerait un 5xx.

?? Une adresse demande 300 chemins différents en une minute, et presque tous reçoivent 404. Quelle est l'explication la plus probable ?
+ Un outil devine des chemins pour trouver des pages
- Un visiteur lit le site lentement, page après page
- Les propres liens du site sont tous déjà cassés
- Un moteur de recherche indexe une seule page précise
=> Une personne suit des liens qui existent. Une rafale d'échecs venue d'une seule source, c'est un outil qui essaie les noms d'une liste, et les rares réponses 200 sont ce qu'il a trouvé.

?? `GET /account` renvoie `302` avec `Location: /login`. Que dit le serveur ?
+ Passez d'abord par la page de connexion
- La page du compte a été supprimée
- Le corps de la requête est invalide
- Le serveur est trop occupé pour l'instant
=> Un code 3xx envoie le client ailleurs, et `Location` dit où. Les sites répondent ainsi quand une page exige une session que vous n'avez pas.

?! Pourquoi un serveur ne peut-il pas faire confiance à l'en-tête `User-Agent` ? Qu'est-ce que cela implique pour tout contrôle de sécurité fondé sur lui ?

### Pour aller plus loin

Les sources primaires et le meilleur matériel gratuit sur ce sujet, tous vérifiés en novembre 2026 (en anglais) :

- [RFC 9110 : HTTP Semantics, la norme elle-même](https://www.rfc-editor.org/rfc/rfc9110)
- [High Performance Browser Networking, livre gratuit en ligne](https://hpbn.co/)
