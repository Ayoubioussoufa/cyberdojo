---
title: OAuth, OIDC et SAML
summary: Se connecter avec un autre service, enfin compris : jetons d'accès et jetons d'identité, le flux par code d'autorisation, et PKCE.
builds: expliquer sans notes le flux par code d'autorisation avec PKCE
source: OAuth 2.0 Simplified, Aaron Parecki (en anglais) | https://www.oauth.com/
words: OAuth, OpenID Connect, PKCE
---
« Se connecter avec Google », « Autoriser cette application à lire votre agenda ». Voilà les protocoles derrière la connexion moderne, et leur mauvaise configuration est derrière beaucoup d'intrusions modernes. Les idées sont simples une fois que vous avez séparé deux questions : **qui êtes-vous ?** et **que peut faire cette application ?**

@term OAuth 2.0 = Une norme pour accorder à une application un accès limité à une ressource sans partager de mot de passe.
@term OpenID Connect (OIDC) = Une couche au-dessus d'OAuth 2.0 qui ajoute la connexion : elle dit à une application qui est l'utilisateur.
@term SAML = Une norme plus ancienne, fondée sur XML, pour l'authentification unique, courante en entreprise.
@term fournisseur d'identité (IdP) = Le service qui authentifie les utilisateurs, comme Entra ID ou Okta.
@term jeton d'accès OAuth (jetons d'accès) = Un identifiant qui permet à une application d'appeler une API.
@term jeton d'actualisation = Un identifiant de longue durée qui sert à obtenir de nouveaux jetons d'accès.
@term jeton d'identité = Un jeton qui dit à une application qui s'est connecté.
@term PKCE = Une preuve qui empêche qu'un code d'autorisation volé soit utilisé par quelqu'un d'autre.
@term consentement = L'approbation par un utilisateur de ce à quoi une application peut accéder.
@term portée OAuth (scopes) = Une permission nommée que demande une application, comme read:calendar.

## La carte-clé de l'hôtel

Vous vous présentez à la réception avec votre passeport (authentification), et on vous remet une carte-clé qui ouvre votre chambre et la salle de sport, jusqu'à vendredi. La porte n'a pas besoin de votre passeport. **OAuth** est la carte-clé : limitée, temporaire, et ce n'est pas votre mot de passe.

- **OAuth 2.0** concerne l'**autorisation** : que peut faire cette application ?
- **OIDC** ajoute l'**authentification** : qui est cet utilisateur ?

| Jeton | Répond à | Remis à | Règle |
|---|---|---|---|
| **Jeton d'identité** | Qui s'est connecté ? | L'application | Un JWT signé que l'application lit |
| **Jeton d'accès** | Cet appel peut-il passer ? | L'API | De courte durée |
| **Jeton d'actualisation** | Puis-je obtenir un nouveau jeton d'accès ? | L'application | De longue durée, donc à garder avec soin |

?? Quel jeton dit à une application qui s'est connecté ?
+ Le jeton d'identité, un JWT signé
- Le jeton d'accès, destiné à l'API
- Le jeton d'actualisation, de longue durée
- Le cookie de session du navigateur
=> Les jetons d'accès sont pour les API. En utiliser un comme preuve de connexion est une erreur classique.

## Le flux par code d'autorisation

Le flux à connaître, dessiné à la main :

@seq Vous | Application | Fournisseur d'identité | API
Vous > Application: Clic sur « Se connecter »
Application > Vous: Redirection vers le fournisseur
Vous > Fournisseur d'identité: Connexion et consentement
Fournisseur d'identité > Vous: Redirection avec un code à usage unique
Vous > Application: Le code
Application > Fournisseur d'identité: Code + preuve
Fournisseur d'identité > Application: Jetons
Application > API: Jeton d'accès

L'astuce : le navigateur ne voit qu'un **code** de courte durée, et les jetons sont récupérés directement par l'application, loin du navigateur.

Le schéma se retient mieux une fois que vous avez vu les vrais messages. Il y en a quatre, et vous pouvez observer les deux premiers dans la barre d'adresse de votre navigateur la prochaine fois que vous utiliserez « Se connecter avec… ».

**1. L'application envoie votre navigateur chez le fournisseur**, avec ce qu'elle veut dans la chaîne de requête :

```
https://idp.example/authorize
  ?response_type=code
  &client_id=notes-app
  &redirect_uri=https://app.example/callback
  &scope=openid%20profile
  &state=k3Jx9aQ
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256
```

| Paramètre | Signification |
|---|---|
| `response_type=code` | « Donne-moi un code », ce qui sélectionne ce flux |
| `client_id` | Quelle application demande. Elle a été enregistrée au préalable chez le fournisseur |
| `redirect_uri` | Où renvoyer l'utilisateur. Elle doit correspondre à ce que l'application a enregistré |
| `scope` | Les permissions demandées. `openid` est celle qui demande une connexion |
| `state` | Une valeur aléatoire que l'application a inventée pour cette seule tentative |
| `code_challenge` | L'empreinte PKCE, expliquée dans la section suivante |

**2. Après votre connexion, le fournisseur renvoie votre navigateur** vers l'application :

```
https://app.example/callback?code=SplxlOBeZQQYbYS6WxSbIA&state=k3Jx9aQ
```

L'application vérifie d'abord que `state` est la valeur qu'elle a envoyée. Si ce n'est pas le cas, quelqu'un d'autre a lancé cela, et l'application s'arrête. Ce contrôle est ce qui empêche un attaquant de pousser son propre code dans votre session.

**3. Le serveur de l'application appelle directement le fournisseur**, avec le code et sa preuve :

```
POST https://idp.example/token
grant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https://app.example/callback&client_id=notes-app
&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

**4. Le fournisseur répond avec les jetons**, en JSON :

```json
{
  "token_type": "Bearer",
  "expires_in": 3600,
  "access_token": "eyJhbGciOi…",
  "refresh_token": "8xLOxBtZp8",
  "id_token": "eyJhbGciOi…"
}
```

`expires_in` est en secondes, donc ce jeton d'accès dure une heure. À partir de là, l'application appelle l'API avec l'en-tête `Authorization: Bearer eyJhbGciOi…`. « Bearer » veut dire « porteur », et c'est à prendre au pied de la lettre : celui qui porte le jeton est servi, et c'est pourquoi les jetons valent la peine d'être volés.

?? Pourquoi le navigateur ne voit-il qu'un code de courte durée ?
+ Les jetons restent loin du navigateur
- Le code est facile à retenir
- Un navigateur n'affiche aucun long jeton
- La page se charge plus vite
=> L'application échange directement le code contre des jetons, qui ne passent donc pas par le navigateur.

## PKCE

Et si quelqu'un intercepte ce code ? [PKCE](https://www.rfc-editor.org/rfc/rfc7636) l'arrête.

1. L'application invente un secret aléatoire et envoie son **empreinte** avec la première requête.
2. Au moment d'échanger le code contre des jetons, elle envoie le **secret d'origine**.
3. Le fournisseur le hache et compare.

Un voleur qui n'a que le code ne peut pas produire le secret. Les [bonnes pratiques de sécurité d'OAuth 2.0](https://www.rfc-editor.org/rfc/rfc9700) recommandent PKCE pour tous les clients.

Les valeurs des messages ci-dessus sont l'exemple traité dans la RFC, vous pouvez donc les vérifier. Le secret, appelé **vérificateur de code**, est `dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk`. Son **défi** est le SHA-256 de ce texte, écrit en Base64URL sans le remplissage `=` : `E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM`. Le défi passe par le navigateur à l'étape 1, où il peut être vu. Le vérificateur n'apparaît qu'à l'étape 3, sur une connexion directe. Voir le défi n'aide pas un voleur, car une empreinte ne peut pas redevenir son entrée.

@code pkce-challenge

?? Contre quoi PKCE protège-t-il ?
+ Un code d'autorisation volé, échangé par quelqu'un d'autre
- Un utilisateur qui choisit un secret trop faible
- Une application malveillante qui demande trop de permissions
- Un serveur qui garde trop longtemps ses jetons
=> Seule l'application qui a lancé le flux connaît le secret d'origine, donc un code intercepté ne sert à rien.

## Consentement et portées

Les applications demandent des **portées**, et vous cliquez sur Autoriser. Ce clic est la surface d'attaque. L'**hameçonnage par consentement** amène un utilisateur à approuver une application malveillante, qui lit ensuite son courrier grâce à un jeton valide. Aucun mot de passe volé, et la MFA n'aide pas, puisque l'utilisateur a approuvé.

Lisez un écran de consentement comme vous liriez une invite `sudo`. Une application d'agenda qui demande `calendar.read` demande ce dont elle a besoin. Une application qui demande `mail.read` et `offline_access` veut votre boîte aux lettres, et elle veut garder l'accès en votre absence, car `offline_access` est la portée qui accorde un jeton d'actualisation.

Passez en revue ce que vous avez déjà approuvé. Dans un compte Google, c'est sous **Sécurité → Vos connexions à des applications tierces**. Dans Microsoft 365, un administrateur voit chaque autorisation sous **Entra ID → Applications d'entreprise**. Retirer une application à cet endroit révoque ses jetons, et c'est la réponse à l'hameçonnage par consentement. Changer le mot de passe ne fait rien, car l'application ne l'a jamais eu.

?? Pourquoi la MFA n'arrête-t-elle pas l'hameçonnage par consentement ?
+ L'utilisateur a tout approuvé de lui-même
- La MFA exige toujours un SMS
- L'application vole le mot de passe
- L'écran de consentement coupe la MFA
=> L'application détient un jeton valide que l'utilisateur a accordé, donc aucune connexion n'est falsifiée.

## SAML

SAML fait de l'authentification unique avec des assertions XML signées qui passent par le navigateur. C'est plus ancien, plus lourd et encore partout en entreprise. Le concept est le même : un fournisseur d'identité se porte garant de vous auprès d'un service. Ses risques tournent autour de la bonne validation des signatures.

Une assertion SAML, une fois les longues valeurs retirées, montre les mêmes idées que vous venez de voir dans OIDC :

```xml
<Assertion>
  <Issuer>https://idp.example</Issuer>
  <Subject><NameID>ana@corp.example</NameID></Subject>
  <Conditions NotBefore="2026-11-15T09:00:00Z" NotOnOrAfter="2026-11-15T09:05:00Z">
    <AudienceRestriction><Audience>https://app.example</Audience></AudienceRestriction>
  </Conditions>
  <Signature>…</Signature>
</Assertion>
```

Qui l'a émise, de qui elle parle, quand elle est valide, à quel service elle est destinée, et une signature sur l'ensemble. Un service qui accepte une assertion doit vérifier les cinq. Chaque faille sérieuse de SAML revient à l'un de ces contrôles sauté, ou fait sur la mauvaise partie du document.

?? Qu'ont en commun SAML et OIDC ?
+ Un fournisseur d'identité se porte garant de vous
- Les deux reposent entièrement sur des tickets Kerberos
- Les deux envoient vos secrets à chaque site
- Les deux ne tournent que sur machines Windows
=> Le format diffère, avec du XML dans SAML et des jetons JSON dans OIDC, mais l'idée est la même.

## Les échecs courants

| Échec | Ce qu'il permet |
|---|---|
| URI de redirection pas strictement vérifiée | Des codes ou des jetons envoyés à l'attaquant |
| Un jeton d'accès utilisé comme preuve de connexion | Des jetons destinés à une autre application sont acceptés |
| Des jetons de longue durée dans le stockage du navigateur | Un XSS les vole |
| Des contrôles faibles des signatures de JWT | Des jetons falsifiés |

La première ligne est une comparaison de chaînes, et il vaut la peine de l'écrire une fois pour voir à quel point il est facile de se tromper. Une adresse qui commence simplement comme celle qui est enregistrée peut appartenir à tout autre que vous.

@code redirect-allowed

La deuxième ligne concerne le contenu du jeton d'identité. Un jeton d'identité est un JWT, sa charge utile est donc lisible, et trois de ses champs doivent être vérifiés par chaque application qui en reçoit un :

| Champ | Signification | L'application vérifie que |
|---|---|---|
| `iss` | Émetteur : qui a fabriqué le jeton | C'est le fournisseur qu'utilise l'application |
| `aud` | Audience : à qui le jeton est destiné | C'est le `client_id` de l'application elle-même |
| `exp` | Expiration, en secondes depuis 1970 | Elle est encore dans le futur |
| `sub` | Sujet : l'identifiant stable de l'utilisateur chez ce fournisseur | Rien : c'est la réponse que voulait l'application |

Un jeton dont la signature est valide et dont le `aud` est faux est un jeton authentique délivré à une autre application. L'accepter signifie que toute application à laquelle l'utilisateur s'est un jour connecté peut se connecter ici à sa place.

@code id-token-problems

@term vol de jeton = Voler un jeton de session ou d'accès pour que l'attaquant saute entièrement la connexion et la MFA.

?? Un attaquant vole un jeton d'accès valide dans une session ouverte. Pourquoi la MFA ne l'arrête-t-elle pas ?
+ La connexion a déjà eu lieu, le jeton suffit
- La MFA ne protège jamais que les comptes d'administrateur
- Les jetons contiennent le mot de passe en clair
- Un jeton d'accès ne peut jamais être révoqué ensuite
=> La MFA garde le moment de la connexion. Un jeton volé saute cette étape, et c'est pourquoi le vol de jetons a progressé.

::: try Exercez-vous
Dessinez le flux à la main jusqu'à ne plus avoir besoin de notes. Décodez ensuite un JWT de test sur [jwt.io](https://jwt.io/). Ne collez pas de vrais jetons sur des sites web.
:::

## Relire un flux de connexion

Trois choses que vous remarquez en relisant la connexion d'une application. Décidez ce que chacune signifie avant de lire les choix.

?? La requête d'autorisation de l'application n'a pas de paramètre `state`. Que ne peut pas faire l'application ?
+ Distinguer ses propres connexions des connexions forgées
- Demander un jeton d'identité à son fournisseur
- Renvoyer l'utilisateur vers elle après la connexion
- Garder le jeton d'accès pendant une heure
=> `state` relie la réponse à la requête que l'application a réellement faite. Sans lui, un attaquant peut fournir à l'application une réponse que l'utilisateur n'a jamais demandée.

?? L'application est enregistrée avec `https://app.example/callback`. Une requête arrive et demande une redirection vers `https://app.example.evil.example/callback`. Que doit faire le fournisseur ?
+ Refuser, car l'adresse doit être identique
- Accepter, car le début est identique
- Accepter, car le chemin est identique
- Refuser, car l'adresse utilise du HTTPS
=> L'hôte est ici `app.example.evil.example`, qui appartient à celui qui possède `evil.example`. Seule une correspondance exacte est sûre.

?? Un jeton d'identité arrive avec une signature valide, et son `aud` vaut `calendar-app`. L'identifiant client de votre application est `notes-app`. Que faites-vous ?
+ Le rejeter, il vise une autre application
- L'accepter, car la signature est toujours valide
- L'accepter, car l'utilisateur existe bel et bien
- Le rejeter, la signature est forcément falsifiée
=> Le jeton est authentique, et il n'est pas pour vous. Le contrôle de l'audience est ce qui empêche les jetons d'une application d'être rejoués auprès d'une autre.

?! Expliquez la différence entre OAuth et OIDC en deux phrases, avec votre propre analogie.
