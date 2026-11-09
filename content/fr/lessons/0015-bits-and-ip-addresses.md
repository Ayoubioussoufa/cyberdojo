---
title: Bits et adresses IP
summary: Comment les ordinateurs comptent, ce qu'est vraiment une adresse IPv4, et quelles adresses sont publiques ou privées.
builds: convertir entre binaire et décimal, et lire n'importe quelle adresse IP
source: Practical Networking, Ed Harmoush (en anglais) | https://www.practicalnetworking.net/
words: bit, octet, adresse privée
---
Toute attaque et toute défense sur un réseau se ramène à déplacer de petits morceaux de données numérotés d'une adresse à une autre. Pour lire ce trafic, il faut savoir lire les adresses, et elles sont faites de bits.

@term bit = La plus petite unité de données : un seul 0 ou 1.
@term octet (byte) = Huit bits, capables de contenir un nombre de 0 à 255.
@term binaire = Compter avec seulement deux chiffres, 0 et 1.
@term IPv4 = Le schéma d'adressage internet d'origine, avec des adresses de 32 bits comme 192.168.1.10.
@term IPv6 = Le schéma d'adressage plus récent, avec des adresses de 128 bits comme 2001:db8::1.
@term adresse privée = Une adresse IP réservée aux réseaux internes, non joignable directement depuis internet.
@term paquet = Un petit morceau de données envoyé sur un réseau, avec des adresses à l'avant.
@term réseau = Deux appareils ou plus, reliés pour pouvoir échanger des données.

## Pourquoi le binaire

À l'intérieur d'un ordinateur, tout est allumé ou éteint, donc tout est construit à partir de deux chiffres. Un seul chiffre est un **bit**. Huit bits font un **octet**.

Chaque position d'un octet a une valeur, qui double de droite à gauche :

| 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
|---|---|---|---|---|---|---|---|
| 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |

Additionnez les positions qui portent un 1 : 128 + 64 + 1 = **193**. Pour aller dans l'autre sens, prenez la plus grande valeur qui tient et recommencez. Pour 200 : 128 tient (reste 72), 64 tient (reste 8), 8 tient (reste 0), donc `11001000`.

Avec les huit bits allumés, vous obtenez 255, donc un octet contient 0 à 255. C'est pourquoi vous ne voyez jamais `192.300.1.1`.

@drill binary

?? Quel est le plus grand nombre qu'un octet peut contenir ?
+ 255, quand ses huit bits sont tous allumés
- 256, car un octet compte depuis le un
- 128, car c'est la valeur du bit haut
- 1024, car les ordinateurs aiment les grandes puissances
=> 128+64+32+16+8+4+2+1 = 255. En comptant zéro, cela fait 256 valeurs possibles.

## Ce qu'est une adresse IPv4

Une **adresse IPv4** est un nombre de 32 bits. Les humains l'écrivent comme quatre octets en décimal, séparés par des points :

```
192      .168      .1        .10
11000000 .10101000 .00000001 .00001010
```

Voyez-la comme un numéro de téléphone : la première partie dit quel réseau, et la dernière dit quel appareil. Le nombre de bits de chaque partie change d'un réseau à l'autre. C'est tout l'objet du découpage en sous-réseaux, à la leçon suivante.

Un **paquet** transporte une adresse source et une adresse destination, comme une enveloppe. Les routeurs lisent la destination et le font suivre, de saut en saut.

?? Combien de bits y a-t-il dans une adresse IPv4 ?
+ 32, écrits sous forme de quatre octets
- 8, écrits sous forme d'un seul octet
- 48, écrits en hexadécimal juste comme ici
- 128, écrits plutôt avec des deux-points ici
=> Quatre octets de huit bits. 48 bits, c'est une adresse MAC, et 128 bits, c'est IPv6.

## Adresses publiques et privées

Quatre milliards d'adresses IPv4 ne suffisent pas pour chaque téléphone et chaque ordinateur portable. Alors la [RFC 1918](https://www.rfc-editor.org/rfc/rfc1918) réserve des plages pour l'usage privé. Chacun peut les réutiliser en interne, et elles ne sont jamais routées sur l'internet public :

| Plage | Usage typique |
|---|---|
| `10.0.0.0` – `10.255.255.255` | Grandes organisations |
| `172.16.0.0` – `172.31.255.255` | Réseaux moyens, Docker |
| `192.168.0.0` – `192.168.255.255` | Maison et petit bureau |

Votre ordinateur a probablement une adresse `192.168.x.x` en ce moment. Un routeur domestique l'échange contre une seule adresse publique quand le trafic sort. C'est le **NAT**, que vous rencontrerez en détail au mois 3.

Quelques autres que vous verrez :

| Adresse | Signification |
|---|---|
| `127.0.0.1` | Boucle locale : cette machine, qui se parle à elle-même |
| `169.254.x.x` | Lien-local : aucune adresse n'a pu être obtenue. Dans les clouds, `169.254.169.254` est le service de métadonnées, que vous apprendrez à protéger au mois 13 |
| `192.0.2.x`, `198.51.100.x`, `203.0.113.x` | [Réservées à la documentation](https://www.rfc-editor.org/rfc/rfc5737), ce qui explique pourquoi ce cours les utilise |

?? Un journal montre une connexion depuis `192.168.1.50`. Que pouvez-vous en conclure ?
+ Elle venait bien d'une adresse de réseau privé interne
- Elle venait d'un serveur situé quelque part en Asie
- Elle est entrée tout droit directement depuis l'internet public
- Elle était forgée, car cette adresse n'est pas valide
=> C'est une adresse privée RFC 1918, donc la source est sur un réseau interne ou derrière un VPN. Cela peut quand même être un attaquant déjà à l'intérieur.

?? Laquelle de celles-ci ne peut pas être une adresse IPv4 valide ?
+ `10.20.300.4`
- `172.31.255.255`
- `198.51.100.0`
- `192.0.2.1`
=> Chaque partie est un octet, elle ne peut donc pas dépasser 255.

## IPv6, en bref

IPv6 utilise 128 bits, écrits en hexadécimal : `2001:db8::1`. Il y a assez d'adresses pour que le NAT ne soit pas nécessaire. Voici ce qui compte pour la sécurité aujourd'hui : beaucoup de réseaux font tourner IPv6 discrètement à côté d'IPv4, et [un défenseur qui ne surveille qu'IPv4 a un angle mort](https://www.rfc-editor.org/rfc/rfc9099).

?! Expliquez avec vos propres mots pourquoi un routeur domestique laisse dix appareils partager une seule adresse publique. Vous pouvez deviner : votre tuteur IA vous corrigera.
