---
title: Hachage et chiffrement symétrique
summary: Encodage, hachage, chiffrement et MAC : ce que fait chacun, lequel utiliser, et comment ils échouent.
builds: distinguer une fois pour toutes l'encodage, le hachage et le chiffrement, la question d'entretien classique
source: Serious Cryptography, ou gratuit, CryptoHack (en anglais) | https://cryptohack.org/
words: empreinte, chiffrement symétrique, nonce
---
« Hachage, chiffrement ou encodage ? » est un classique des entretiens, et se tromper est un signal d'alerte. Vous n'avez pas besoin des mathématiques. Vous devez savoir ce que promet chaque outil, et comment les gens l'utilisent mal. La feuille de route est claire : utilisez la cryptographie correctement, ne la concevez pas.

@term encodage = Changer le format d'une donnée, sans secret et sans protection.
@term fonction de hachage cryptographique = Une fonction à sens unique qui donne une empreinte de taille fixe d'une donnée.
@term chiffrement = Brouiller des données avec une clé pour que seuls les détenteurs de la clé puissent les lire.
@term chiffrement symétrique = Un chiffrement où la même clé verrouille et déverrouille.
@term AES = L'algorithme de chiffrement symétrique standard, utilisé presque partout.
@term AES-GCM = AES dans un mode qui chiffre les données et détecte aussi les modifications.
@term nonce = Un nombre utilisé une seule fois avec une clé.
@term HMAC = Un hachage à clé qui prouve qu'un message vient de quelqu'un qui détient la clé et qu'il n'a pas été modifié.
@term SHA-256 = Une fonction de hachage cryptographique très répandue, de la famille SHA-2.
@term mode ECB = Une façon non sûre d'utiliser un chiffrement par blocs, qui laisse voir des motifs.

## Trois métiers différents

| | But | Réversible ? | Clé ? | Exemple |
|---|---|---|---|---|
| **Encodage** | Changer le format | Oui, par n'importe qui | Non | Base64, hexadécimal, encodage d'URL |
| **Hachage** | Empreinte | Non | Non | SHA-256 |
| **Chiffrement** | Garder le secret | Oui, avec la clé | Oui | AES-GCM |

Voyez les trois sortes de sortie pour les cinq mêmes lettres, dans votre propre terminal :

```
$ echo -n "hello" | base64
aGVsbG8=
$ echo -n "hello" | xxd -p
68656c6c6f
$ echo -n "aGVsbG8=" | base64 -d
hello
```

Le `-n` empêche `echo` d'ajouter un saut de ligne, qui ferait sinon partie de la donnée. La dernière ligne résume toute la leçon sur l'encodage : vous l'avez inversé sans clé, et tout le monde peut en faire autant.

Chaque encodage a une allure, et la reconnaître à vue fait gagner du temps dans chaque enquête :

| Encodage | Ressemble à | Signe distinctif |
|---|---|---|
| Hexadécimal | `68656c6c6f` | Seulement `0-9` et `a-f`, et un nombre pair de caractères |
| Base64 | `aGVsbG8=` | Des lettres majuscules et minuscules, des chiffres, `+` et `/`, souvent un `=` final |
| Encodage d'URL | `red%20boots` | `%` suivi de deux chiffres hexadécimaux |

::: key
L'encodage n'est pas de la sécurité. S'il n'y a pas de clé, rien n'est protégé.
:::

@drill crypto-kind

?? Base64 protège-t-il les données ?
+ Non, car n'importe qui peut l'inverser
- Oui, car il brouille les données
- Oui, car seuls les serveurs décodent
- Non, car il ignore les lettres
=> Sans clé, c'est un changement de format et rien de plus.

## Les fonctions de hachage

Une **fonction de hachage cryptographique** transforme n'importe quelle entrée en une empreinte de taille fixe :

```
$ echo -n "hello" | sha256sum
2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
```

`sha256sum` fonctionne aussi sur des fichiers, et c'est son usage de tous les jours. Un projet publie une liste d'empreintes, vous téléchargez le fichier, et vous comparez :

```
$ sha256sum ubuntu.iso
$ sha256sum -c SHA256SUMS
ubuntu.iso: OK
```

La première commande affiche l'empreinte du fichier pour que vous compariez à l'œil. La seconde lit une liste d'empreintes attendues et vérifie chaque fichier elle-même, ce qui est plus sûr que vos yeux sur 64 caractères.

Trois propriétés comptent :

- **Sens unique :** vous ne pouvez pas retrouver l'entrée.
- **Résistance aux collisions :** vous ne pouvez pas trouver deux entrées qui ont la même empreinte.
- **Avalanche :** changez un bit et toute la sortie change.

Observez l'avalanche. Changez la dernière lettre de l'entrée, d'un cran dans l'alphabet :

```
hello   2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
hellp   fdd7585e08c4e2afd71dcabdb4636c89d557a3f42db9e2040c8bbd1708aa4ce7
```

Rien dans la seconde empreinte ne ressemble à la première. C'est pourquoi une empreinte est fiable, et pourquoi deux empreintes « presque identiques » ne veulent rien dire du tout : elles correspondent exactement ou les données diffèrent.

La longueur de la sortie vous dit quelle fonction a produit une empreinte, et les rapports donnent souvent la valeur sans la nommer :

| Fonction | Caractères hexadécimaux | État |
|---|---|---|
| MD5 | 32 | Cassé. Sert encore d'étiquette de fichier dans les rapports sur les malwares |
| SHA-1 | 40 | Cassé |
| SHA-256 | 64 | Norme actuelle |

@code hash-kind

Comparer un fichier à son empreinte publiée tient en deux lignes de Python, avec un peu de soin : les gens collent les empreintes en majuscules et avec des espaces autour.

@code matches-hash

Usages : vérifier qu'un téléchargement n'a pas été modifié, identifier des échantillons de malwares, et servir de brique pour les signatures. **MD5 et SHA-1 sont cassés** pour la sécurité : on peut fabriquer des collisions volontairement. Utilisez SHA-256 ou SHA-3. Les [normes de hachage](https://csrc.nist.gov/projects/hash-functions) du NIST (en anglais) listent ce qui est approuvé.

?? Vous publiez un fichier avec son SHA-256 à côté, sur la même page web. Contre quoi cela protège-t-il ?
+ La corruption accidentelle du fichier lors du transfert
- Un attaquant qui contrôle toute cette page web
- Quiconque lit le fichier pendant son transit réseau
- Une personne ayant volé votre clé de signature
=> Une empreinte seule n'a aucun secret, donc un attaquant qui change le fichier peut aussi changer l'empreinte. Empêcher cela demande une signature, dans la leçon suivante.

## Le chiffrement symétrique

**Symétrique** signifie une seule clé partagée, comme une clé de maison. **AES** est l'algorithme standard. Il travaille sur des blocs de 16 octets, et la façon d'enchaîner ces blocs est le **mode**, qui compte autant que l'algorithme.

**AES-GCM** est le choix normal. C'est du **chiffrement authentifié** : il chiffre et détecte aussi les modifications. Les modes plus anciens ne font que cacher les données, donc un attaquant peut inverser des bits sans être détecté.

Chaque chiffrement a besoin d'un **nonce**, une valeur qui ne doit jamais se répéter avec la même clé.

```python
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

key = AESGCM.generate_key(bit_length=256)
nonce = os.urandom(12)
ct = AESGCM(key).encrypt(nonce, b"secret", None)
```

Remarquez que cela utilise la bibliothèque [`cryptography`](https://cryptography.io/), largement relue. Vous assemblez des pièces de confiance, vous n'en inventez aucune.

Installez la bibliothèque dans votre environnement virtuel avec `pip install cryptography`, ajoutez deux lignes, et vous avez l'aller-retour complet :

```python
pt = AESGCM(key).decrypt(nonce, ct, None)        # b"secret"

damaged = bytes([ct[0] ^ 1]) + ct[1:]            # inverser un bit du texte chiffré
AESGCM(key).decrypt(nonce, damaged, None)        # lève cryptography.exceptions.InvalidTag
```

Il y a quatre choses sur la table, et il est utile de dire ce qui arrive à chacune :

| Élément | Secret ? | Ce que vous en faites |
|---|---|---|
| Clé | Oui | La garder hors du code. Qui la détient peut tout lire |
| Nonce | Non | Le ranger à côté du texte chiffré. Ne jamais réutiliser le même avec une clé |
| Texte chiffré | Non | Le stocker ou l'envoyer. Il comprend une courte étiquette à la fin |
| Texte en clair | Oui | La donnée que vous protégiez |

Le texte chiffré fait ici 22 octets pour un message de 6 octets : les 16 octets en plus sont l'**étiquette** (*tag*). Au déchiffrement, la bibliothèque la recalcule, et si un seul bit du texte chiffré, du nonce ou de la clé est faux, vous obtenez `InvalidTag` et aucune donnée. Ce refus, c'est la promesse « détecte les modifications » en action.

?? Pourquoi AES-GCM est-il le choix normal ?
+ Il détecte aussi toute modification
- Il fonctionne toujours sans clé
- Il fonctionne sans aucun nonce
- Il est impossible à détourner
=> Le chiffrement authentifié protège l'intégrité en plus du secret.

## Comment cela échoue

| Échec | Ce qui tourne mal |
|---|---|
| **Mode ECB** | Chaque bloc est chiffré seul, donc des blocs identiques se ressemblent et les motifs apparaissent |
| **Réutilisation du nonce** | En GCM, répéter un nonce avec une clé peut révéler du texte en clair et permettre des falsifications |
| **Clés écrites en dur** | La clé est dans le code, et le code finit sur GitHub |
| **Cryptographie maison** | Cela a l'air brouillé et tombe devant le premier expert |
| **Aléa faible** | `random()` est prévisible. Utilisez `secrets` ou `os.urandom` |

?? Que devez-vous faire quand vous avez besoin de chiffrer des données ?
+ Utiliser une bibliothèque relue qui propose AES-GCM
- Concevoir un chiffrement que personne ne connaît
- Encoder deux fois en Base64 pour renforcer
- Utiliser MD5 car il est plus rapide
=> Le secret de la méthode n'est pas de la sécurité. Base64 et MD5 ne sont pas du tout du chiffrement.

## HMAC : l'intégrité avec une clé

Une empreinte ne prouve rien sur celui qui l'a produite. Un **HMAC** mélange une clé secrète au hachage, donc seuls les détenteurs de la clé peuvent en produire un valide. Les webhooks et les JWT en HS256 s'en servent.

Python l'a dans sa bibliothèque standard :

```python
import hmac, hashlib

key = b"k3y"
tag = hmac.new(key, b"amount=100", hashlib.sha256).hexdigest()
# 7a9c5ea080b9ca5ac916cc47557769a1189824f3892120b2487d45ead0480caf
```

L'expéditeur transmet le message avec son code. Le destinataire, qui détient la même clé, recalcule le code sur ce qui est arrivé et compare. Si quelqu'un a changé `amount=100` en `amount=900` en route, il ne peut pas produire le code correspondant, car il n'a pas la clé.

Comparez avec `hmac.compare_digest(a, b)` et non avec `==`. Une comparaison ordinaire s'arrête au premier caractère différent, donc le temps qu'elle prend laisse fuir quelle part d'un essai était juste. `compare_digest` prend toujours le même temps.

@code verify-hmac

?? Un serveur stocke `sha256(password)`, et un attaquant vole la table. Les mots de passe sont-ils en sécurité ?
+ Non, un hachage rapide se devine à bas coût
- Oui, car aucune empreinte ne peut jamais être inversée
- Oui, si chaque empreinte est aussi encodée en Base64
- Non, car SHA-256 peut être simplement déchiffré en retour
=> Les empreintes ne se déchiffrent pas, elles se devinent. Les attaquants hachent des milliards de candidats par seconde jusqu'à ce que l'un corresponde. Le stockage des mots de passe demande quelque chose de volontairement lent, à venir dans la leçon 40.

::: try Exercez-vous
Inscrivez-vous sur [CryptoHack](https://cryptohack.org/) et faites les sections Introduction et General. Votre livrable demande 30 défis ou plus. [CyberChef](https://gchq.github.io/CyberChef/) est parfait pour jouer avec les encodages et les empreintes.
:::

## Choisir le bon outil

La plupart des erreurs de cryptographie dans le vrai code ne sont pas des mathématiques cassées. C'est le mauvais outil pour le travail. Décidez pour chacun de ces cas avant de lire les choix.

?? Une application doit stocker un jeton d'API et l'envoyer à un autre service toutes les heures. Quel outil convient ?
+ Le chiffrement, car l'application doit le récupérer
- Le hachage, car personne ne le lira
- L'encodage, car Base64 cache bien la valeur
- Un HMAC, car le jeton est secret
=> Une empreinte ne peut pas redevenir le jeton, donc l'application ne pourrait jamais l'envoyer. L'encodage ne protège rien. Chiffrez-le, et gardez la clé ailleurs.

?? Un rapport sur un malware désigne un échantillon par `5d41402abc4b2a76b9719d911017c592`. Quelle est cette valeur ?
+ Une empreinte MD5, d'après sa longueur
- Une empreinte SHA-256, d'après sa longueur
- Une chaîne Base64, d'après ses lettres
- Une clé AES, d'après ses chiffres
=> 32 caractères hexadécimaux, c'est MD5. Il est trop faible pour prouver quoi que ce soit, mais il reste très utilisé comme nom rapide pour un fichier.

?? Un déchiffrement avec AES-GCM lève `InvalidTag`. Que savez-vous ?
+ La clé, le nonce ou le chiffré est faux
- Le message était déjà vide dès le tout début
- La bibliothèque exige un Python bien plus récent encore
- Les données étaient seulement encodées en Base64, rien d'autre
=> L'étiquette ne correspondait pas, donc la bibliothèque refuse de renvoyer quoi que ce soit. Soit les données ont été modifiées, soit vous utilisez la mauvaise clé ou le mauvais nonce, et vous ne pouvez pas savoir lequel.

?! Expliquez à un développeur pourquoi Base64 ne protège pas un mot de passe dans un fichier de configuration. Que devrait-il faire à la place ?
