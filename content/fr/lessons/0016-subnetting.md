---
title: Les sous-réseaux sans douleur
summary: Ce que /24 veut dire, comment découper des réseaux, et une méthode mentale pour trouver chaque réponse en moins d'une minute.
builds: découper n'importe quel /8 à /30 en moins de 60 secondes, la validation du mois 2
source: Practical Networking, Subnetting Mastery (en anglais) | https://www.practicalnetworking.net/stand-alone/subnetting-mastery/
words: sous-réseau, CIDR, adresse de diffusion
---
Le découpage en sous-réseaux ressemble à des maths, mais c'est plus proche d'un tour de cartes : apprenez un seul geste et vous saurez faire chaque problème. Il vous le faut pour lire des règles de pare-feu, des réseaux cloud et des cibles de scan, et c'est votre validation du mois 2.

@term sous-réseau = Un réseau plus petit taillé dans un plus grand.
@term notation CIDR = Écrire un réseau comme une adresse plus une barre et le nombre de bits de réseau, comme 10.0.0.0/24.
@term masque de sous-réseau = La même information que la barre, écrite comme une adresse, comme 255.255.255.0.
@term adresse réseau = La première adresse d'un sous-réseau, qui nomme le sous-réseau lui-même.
@term adresse de diffusion (broadcast) = La dernière adresse d'un sous-réseau, utilisée pour joindre tous ses appareils.
@term taille de bloc = Le nombre d'adresses que contient un sous-réseau, toujours une puissance de deux.

## Ce que la barre veut dire

Une adresse a une **partie réseau** et une **partie hôte**. Le nombre après la barre dit combien de bits sont des bits de réseau.

Voici `192.168.1.10/24`, bit par bit :

@bits 24 192.168.1.10

Avec 8 bits d'hôte, il y a 2⁸ = 256 adresses. La première et la dernière sont réservées : la première est l'**adresse réseau**, et la dernière est l'**adresse de diffusion**. Il reste 254 pour les appareils.

| Barre | Masque | Adresses | Hôtes utilisables |
|---|---|---|---|
| /8 | 255.0.0.0 | 16 777 216 | 16 777 214 |
| /16 | 255.255.0.0 | 65 536 | 65 534 |
| /24 | 255.255.255.0 | 256 | 254 |
| /25 | 255.255.255.128 | 128 | 126 |
| /26 | 255.255.255.192 | 64 | 62 |
| /27 | 255.255.255.224 | 32 | 30 |
| /28 | 255.255.255.240 | 16 | 14 |
| /29 | 255.255.255.248 | 8 | 6 |
| /30 | 255.255.255.252 | 4 | 2 |

**La règle :** adresses = 2^(32 − barre), et hôtes utilisables = ce nombre moins 2.

Une barre plus longue veut dire plus de bits de réseau et moins d'hôtes. Voici un /26, avec seulement 6 bits d'hôte :

@bits 26 192.168.1.77

?? Dans `10.1.2.3/8`, combien de bits identifient le réseau ?
+ 8, comme le dit la barre
- 24, comme font tous les restants
- 32, comme font vraiment bien tous
- 3, comme fait ce dernier octet
=> Le nombre après la barre compte les bits de réseau. Les 24 autres identifient les hôtes.

## Le geste unique : la taille de bloc

Les sous-réseaux commencent toujours sur un multiple de leur taille de bloc. Voici toute la méthode.

**Trouvez le réseau et la diffusion de `192.168.1.77/26`.**

1. Dans quel octet tombe la barre ? /26 est au-delà de 24, donc le quatrième octet.
2. Taille de bloc : 32 − 26 = 6 bits d'hôte, et 2⁶ = **64**.
3. Multiples de 64 : 0, 64, 128, 192. Le dernier qui ne dépasse pas 77 est **64**.
4. Réseau : `192.168.1.64`. Le bloc suivant commence à 128, donc la diffusion est un de moins : `192.168.1.127`.

Les hôtes utilisables vont de `.65` à `.126`.

**Maintenant un dans un autre octet : `10.20.133.5/18`.**

1. /18 est entre 16 et 24, donc c'est le troisième octet qui scinde.
2. Bits d'hôte dans cet octet : 24 − 18 = 6, donc le bloc est de **64** dans le troisième octet.
3. Multiples de 64 : 0, 64, 128, 192. Le dernier qui ne dépasse pas 133 est **128**.
4. Réseau : `10.20.128.0`. Le bloc suivant commence à 192, donc la diffusion est `10.20.191.255`.

::: key Le truc
Trouvez l'octet où tombe la barre, calculez la taille de bloc dans cet octet, et arrondissez vers le bas au multiple. Tout ce qui est à droite vaut 0 pour le réseau et 255 pour la diffusion.
:::

?? Quelle est l'adresse réseau de `172.16.5.200/25` ?
+ `172.16.5.128`
- `172.16.5.0`
- `172.16.5.192`
- `172.16.0.0`
=> Un /25 a une taille de bloc de 128 dans le dernier octet. Les multiples sont 0 et 128, et 200 tombe dans le bloc 128.

?? Combien d'hôtes utilisables a un /27 ?
+ 30
- 32
- 27
- 62
=> 2⁵ = 32 adresses, moins l'adresse réseau et l'adresse de diffusion.

## Pourquoi c'est important en sécurité

- `10.0.0.0/8` dans une règle de pare-feu veut dire seize millions d'adresses, pas une. Une faute de frappe dans la barre peut ouvrir toute une entreprise.
- `0.0.0.0/0` veut dire **tout**. Vu sur un groupe de sécurité cloud pour SSH, c'est une mauvaise configuration classique.
- Scanner `nmap 192.168.56.0/24` veut dire 256 adresses. Se tromper de barre peut vouloir dire scanner des systèmes que vous n'avez pas le droit de toucher.

@drill subnet

::: tip Comment s'entraîner
Dix minutes par jour, comme le dit le parcours. La pratique espacée vaut mieux qu'une longue séance. Votre validation, c'est 20 questions d'affilée, chacune en moins de 60 secondes. Il existe une version dédiée sur [la page de pratique](/practice/subnet/).
:::

::: ai Exercice du parcours
Demandez à une IA 20 problèmes de sous-réseaux avec leurs réponses. Résolvez-les vous-même, vérifiez les réponses de l'IA, et notez chaque erreur qu'elle a faite.
:::

?! Expliquez à un ami pourquoi un /24 a 254 adresses utilisables et non 256.

?? Une règle de pare-feu cloud autorise SSH depuis `0.0.0.0/0`. Qu'est-ce que cela veut dire ?
+ N'importe qui sur internet peut tenter de se connecter
- Absolument personne au monde n'est capable de se connecter
- Seule votre toute propre machine peut se connecter ici
- Seules les autres machines du cloud peuvent se connecter
=> `/0` veut dire zéro bit fixe, donc cela correspond à toutes les adresses. Sur SSH, c'est une mauvaise configuration classique.

### Aller plus loin

Des sources primaires et le meilleur contenu gratuit sur ce sujet (en anglais), tous vérifiés en novembre 2026 :

- [RFC 4632 : le routage inter-domaine sans classe (CIDR)](https://www.rfc-editor.org/rfc/rfc4632)
- [RFC 1918 : les plages d'adresses privées](https://www.rfc-editor.org/rfc/rfc1918)
