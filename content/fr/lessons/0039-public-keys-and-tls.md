---
title: Clés publiques, certificats et TLS
summary: La cryptographie asymétrique, les signatures, la chaîne de confiance et la poignée de main TLS 1.3, en mots simples.
builds: expliquer la poignée de main TLS 1.3 et ce que prouve un certificat
source: RFC 8446, TLS 1.3 (en anglais) | https://www.rfc-editor.org/rfc/rfc8446
words: signature numérique, certificat, autorité de certification
---
Le chiffrement symétrique a un problème d'œuf et de poule : comment deux inconnus sur Internet se mettent-ils d'accord sur une clé partagée, alors que tout le monde écoute ? Le résoudre est l'une des grandes réussites de l'informatique, et vous vous en servez chaque fois que vous ouvrez un site web.

@term chiffrement asymétrique (cryptographie à clé publique) = Une cryptographie qui utilise une paire de clés liées : une publique, une privée.
@term RSA = Un algorithme à clé publique utilisé de longue date.
@term cryptographie sur courbes elliptiques (ECC) = Une approche à clé publique qui offre une sécurité forte avec de petites clés.
@term échange de clés = La façon dont deux parties conviennent d'un secret partagé sur un réseau ouvert.
@term signature numérique = La preuve, faite avec une clé privée, qu'une donnée vient du propriétaire de la clé et n'a pas été modifiée.
@term certificat = Un document signé qui lie une clé publique à un nom.
@term autorité de certification (CA) = Une organisation à qui l'on fait confiance pour signer des certificats.
@term PKI (infrastructure à clés publiques) = Le système de CA et de certificats qui fait fonctionner la confiance.
@term confidentialité persistante = Une propriété grâce à laquelle voler une clé de longue durée ne révèle pas les sessions passées.

## Deux clés

Avec une **paire de clés**, ce que fait une clé, seule l'autre peut le défaire.

- Chiffrez avec la **clé publique** de quelqu'un, et seule sa clé privée peut lire.
- **Signez** avec votre **clé privée**, et quiconque a votre clé publique peut vérifier que c'était vous.

Fabriquez une paire vous-même. `openssl` est déjà sur votre VM Linux, et trois commandes montrent toute l'idée :

```
openssl genpkey -algorithm ed25519 -out private.pem       créer la clé privée
openssl pkey -in private.pem -pubout -out public.pem      en dériver la clé publique
cat public.pem
```

```
-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAcwCnzzQ/eIo7n0DoHVQ2/zJaYR91WzED1Or4FNV+PNQ=
-----END PUBLIC KEY-----
```

Deux choses à remarquer. La clé publique se calcule à partir de la clé privée, et jamais l'inverse : cette étape à sens unique est ce que fournissent les mathématiques. Et la clé publique peut être collée n'importe où sans risque, c'est pourquoi vous avez pu en poser une sur un serveur dans la leçon sur le durcissement. `private.pem` est le secret. Traitez-le comme un mot de passe difficile à changer.

Les opérations à clé publique sont lentes, donc les vrais systèmes ne s'en servent que pour démarrer, puis passent à un chiffrement symétrique rapide.

?? Pour envoyer un secret à Ana, quelle clé utilisez-vous ?
+ La clé publique d'Ana
- La clé privée d'Ana
- Votre propre clé publique
- Votre mot de passe
=> N'importe qui peut chiffrer avec sa clé publique, et seule sa clé privée ouvre le message.

## L'échange de clés

Diffie-Hellman permet à deux parties de créer un secret partagé alors qu'un espion observe tout. C'est comme mélanger de la peinture : chaque côté garde une couleur privée et échange des mélanges, et il est facile de mélanger mais très difficile de séparer. Le TLS moderne utilise une version sur courbes elliptiques, avec une clé neuve pour chaque session. Cela donne la **confidentialité persistante** : si la clé d'un serveur est volée l'an prochain, le trafic enregistré aujourd'hui reste en sécurité.

La peinture cache des nombres, et de petits nombres montrent l'astuce. Les deux côtés conviennent en public d'un module `p = 23` et d'une base `g = 5`. `pow(g, x, p)` en Python signifie « g à la puissance x, puis le reste de la division par p ».

| | Ana | Bo |
|---|---|---|
| Choisit un secret | `6` | `15` |
| Envoie en clair | `pow(5, 6, 23)` = **8** | `pow(5, 15, 23)` = **19** |
| Combine avec le nombre de l'autre | `pow(19, 6, 23)` = **2** | `pow(8, 15, 23)` = **2** |

Les deux arrivent à 2, et aucun ne l'a envoyé. Un espion a vu 23, 5, 8 et 19, et pour obtenir le 2 il devrait retrouver un exposant secret à partir de ces nombres. Avec des nombres aussi petits, c'est facile. Avec les tailles qu'utilisent les vrais systèmes, personne ne connaît de méthode praticable.

@code dh-shared

?? Que protège la confidentialité persistante ?
+ Le trafic enregistré, si une clé fuit plus tard
- Les mots de passe stockés sur le serveur web
- Les fichiers qui sont enregistrés sur un ordinateur portable
- Les certificats dont la date de validité est dépassée
=> Chaque session a sa propre clé, donc un vol ultérieur ne peut pas ouvrir d'anciens enregistrements.

## Les signatures numériques

Une **signature** est une empreinte de la donnée, traitée avec une clé privée. Elle prouve deux choses : qui l'a signée, et qu'elle n'a pas changé.

Cela résout le problème de la leçon précédente. Une empreinte à côté d'un téléchargement peut être remplacée, mais une signature ne peut pas être falsifiée sans la clé privée. Les mises à jour de logiciels, les commits Git et les certificats s'en servent tous.

Signez un fichier avec la clé que vous avez créée, puis vérifiez-le comme le ferait un inconnu, avec la seule clé publique :

```
echo "pay ana 100" > message.txt
openssl pkeyutl -sign -inkey private.pem -rawin -in message.txt -out message.sig
openssl pkeyutl -verify -pubin -inkey public.pem -rawin -in message.txt -sigfile message.sig
```

```
Signature Verified Successfully
```

Changez maintenant un caractère du message et vérifiez de nouveau avec l'ancienne signature :

```
echo "pay ana 900" > message.txt
openssl pkeyutl -verify -pubin -inkey public.pem -rawin -in message.txt -sigfile message.sig
```

```
Signature Verification Failure
```

Le fichier, la signature et la clé publique peuvent tous voyager sur un réseau que contrôle un attaquant. S'il ne détient pas aussi `private.pem`, il ne peut pas produire une signature valide pour un message modifié.

?? Que prouve la vérification d'une signature numérique ?
+ Le détenteur de la clé privée a signé ceci
- Les données sont restées secrètes pour tout le monde
- Le signataire est une personne honnête et de confiance
- Les données n'ont jamais été lues par un inconnu
=> Les signatures donnent l'authenticité et l'intégrité, pas le secret. Et elles ne disent rien des intentions du signataire.

## Les certificats et la chaîne de confiance

Vous vous connectez à `bank.example` et vous recevez une clé publique. Comment savez-vous que c'est bien celle de la banque ? Un **certificat** lie une clé publique à un nom, signé par une **autorité de certification**.

@flow CA racine, intégrée à votre système > CA intermédiaire > Certificat du site bank.example

Votre navigateur vérifie que la chaîne mène à une racine de confiance, que le nom correspond, et que le certificat n'a ni expiré ni été révoqué.

Lisez un vrai certificat. Ceci récupère celui que présente un serveur et affiche les quatre champs qui comptent :

```
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null |
  openssl x509 -noout -subject -issuer -dates -ext subjectAltName
```

```
subject=CN=example.com
issuer=C=US, O=SSL Corporation, CN=Cloudflare TLS Issuing ECC CA 3
notBefore=Sep 26 22:49:11 2026 GMT
notAfter=Dec 25 22:56:35 2026 GMT
X509v3 Subject Alternative Name:
    DNS:example.com, DNS:*.example.com
```

| Champ | Signification |
|---|---|
| `subject` | À qui le certificat a été délivré |
| `issuer` | Quelle CA l'a signé. Le certificat de cette CA est le maillon suivant de la chaîne |
| `notBefore`, `notAfter` | Sa période de validité. En dehors, les navigateurs refusent le certificat |
| `Subject Alternative Name` | Les noms qu'il couvre. C'est cette liste que le navigateur compare à la barre d'adresse |

Le vôtre montrera d'autres dates et peut-être un autre émetteur, car les sites renouvellent tous les quelques mois. `*.example.com` est un **joker** : il représente exactement un label, il couvre donc `www.example.com` mais pas `a.b.example.com`, ni le simple `example.com`, et c'est pourquoi ce nom est listé à part. Votre navigateur montre les mêmes champs si vous cliquez sur le cadenas et ouvrez le certificat.

@code cert-name-matches

::: key Ce que prouve un certificat
Il prouve que le serveur contrôle ce **nom**. Il ne prouve **pas** que l'exploitant est honnête. Les sites d'hameçonnage obtiennent aussi des certificats valides, donc « le cadenas » ne veut pas dire sans danger.
:::

?? Un site d'hameçonnage à `bank-login.example` affiche un cadenas valide. Comment est-ce possible ?
+ L'attaquant contrôle réellement ce nom de domaine
- Les contrôles du navigateur étaient tous coupés
- Seuls les sites bancaires vérifient les certificats
- La vraie banque a signé ce certificat
=> Une CA vérifie seulement le contrôle du nom. Le cadenas signifie que la connexion est chiffrée vers celui qui possède ce nom, quel qu'il soit.

## La poignée de main TLS 1.3

[TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446) établit un canal sûr en un seul aller-retour :

@seq Client | Serveur
Client > Serveur: ClientHello, ma part de clé
Serveur > Client: ServerHello, sa part de clé
Serveur > Client: Certificat, signature, Finished
Client > Serveur: Finished
Client > Serveur: Données applicatives chiffrées

1. **ClientHello :** « Voici ce que je sais faire, et ma moitié de l'échange de clés. »
2. **ServerHello :** le serveur envoie sa moitié. Les deux dérivent maintenant les mêmes clés.
3. **Certificate + CertificateVerify :** le serveur prouve qu'il possède la clé du certificat en signant la poignée de main.
4. **Finished :** les deux confirment que rien n'a été modifié.

TLS donne donc trois choses : la **confidentialité** (le chiffrement), l'**intégrité** (toute modification est détectée) et l'**authentification** (le certificat).

::: try Voyez-la
```
openssl s_client -connect example.com:443 -servername example.com </dev/null
```
Trouvez la chaîne de certificats, le protocole et l'algorithme de chiffrement. Capturez ensuite une poignée de main dans Wireshark et trouvez le ClientHello.
:::

La même commande sans sa seconde moitié affiche un résumé de la poignée de main. Trois lignes vous disent comment elle s'est passée :

```
Verification: OK
New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384
Verify return code: 0 (ok)
```

La chaîne a mené à une racine à laquelle votre système fait confiance, le protocole est TLS 1.3, et les données seront chiffrées avec AES-256-GCM, que vous avez rencontré dans la leçon précédente. Le nom de la suite de chiffrement résume tout le mois 6 en quatre mots.

Il est tout aussi utile de voir les contrôles échouer. [badssl.com](https://badssl.com/) est un site de test public qui a un certificat volontairement cassé sur chaque sous-domaine :

```
$ curl https://expired.badssl.com/
curl: (60) SSL certificate OpenSSL verify result: certificate has expired (10)

$ curl https://wrong.host.badssl.com/
curl: (60) SSL: no alternative certificate subject name matches target hostname 'wrong.host.badssl.com'
```

Chaque refus correspond à l'un des contrôles du navigateur vus dans la section sur les certificats. `curl -k` les couperait tous et continuerait. Cette option transforme « chiffré vers le bon serveur » en « chiffré vers quelqu'un », donc la bonne réponse à l'erreur 60 est de réparer le certificat, jamais d'ajouter `-k` à un script.

?? Qu'est-ce qui donne à TLS la preuve de l'identité de votre interlocuteur ?
+ Le certificat signé du serveur
- Le cookie du client connecté
- La toute première connexion TCP
- La réponse DNS du résolveur
=> Le serveur signe la poignée de main avec la clé qui correspond à son certificat.

## Le post-quantique, en bref

Un grand ordinateur quantique pourrait casser RSA et les courbes elliptiques. Le NIST a publié les premières normes post-quantiques en 2024 : [FIPS 203](https://csrc.nist.gov/pubs/fips/203/final), [204](https://csrc.nist.gov/pubs/fips/204/final) et [205](https://csrc.nist.gov/pubs/fips/205/final). La crainte est « récolter maintenant, déchiffrer plus tard » : enregistrer le trafic aujourd'hui pour le casser à l'avenir. En avoir conscience suffit pour l'instant.

?? Quelle partie de TLS le certificat fournit-il ?
+ L'authentification de la véritable identité du serveur
- Le chiffrement en masse des données échangées
- La compression des requêtes et des réponses
- La protection contre une application web compromise
=> Le chiffrement vient des clés dérivées pendant l'échange. Le certificat prouve à qui vous parlez.

## Lire les preuves

Trois extraits de sortie des outils de cette leçon. Décidez ce que chacun signifie avant de lire les choix.

?? `openssl s_client` se termine par `Verify return code: 0 (ok)`. Qu'est-ce qui a été vérifié ?
+ La chaîne mène à une racine de confiance
- Le site n'a aucune faille de sécurité connue
- Le propriétaire du serveur est une entreprise honnête
- La page ne contient absolument aucun script malveillant
=> Le code 0 signifie que la chaîne de certificats est valide pour une racine à laquelle votre système fait confiance. Il ne dit rien de ce que fait le site.

?? Un certificat ne liste que `DNS:*.shop.example`. Quelle adresse couvre-t-il ?
+ `api.shop.example`
- `shop.example`
- `a.b.shop.example`
- `shop.example.net`
=> Un joker remplace exactement un label. Le domaine nu et les noms plus profonds ont besoin de leurs propres entrées.

?? Un script planifié se met à échouer avec `curl: (60) … certificate has expired`. Quel est le bon correctif ?
+ Renouveler le certificat sur le serveur
- Ajouter `-k` à la commande concernée
- Passer l'URL du script en `http`
- Reculer nettement l'horloge de la machine
=> Les trois autres font toutes disparaître l'erreur en retirant la protection. Un certificat expiré se corrige en en délivrant un nouveau.

::: try Clés et certificats à la main
1. Créez une paire de clés, signez un fichier et vérifiez-le. Modifiez ensuite le fichier et regardez la vérification échouer.
2. Affichez le certificat d'un site que vous utilisez, et trouvez son émetteur, sa date d'expiration et les noms qu'il couvre.
3. Lancez `curl` contre `expired.badssl.com`, `wrong.host.badssl.com` et `self-signed.badssl.com`, et associez chaque erreur au contrôle qui a échoué.
4. Supprimez `private.pem` quand vous avez fini. Une clé dont vous n'avez plus besoin est une clé qui ne peut pas fuir.
:::

?! Rédigez votre explication « Comment HTTPS fonctionne vraiment », en 150 mots environ, pour un lecteur non technicien. C'est le début de votre compte rendu du mois 6.
