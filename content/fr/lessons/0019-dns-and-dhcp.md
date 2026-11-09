---
title: DNS et DHCP
summary: Comment les noms deviennent des adresses, comment un appareil rejoint un réseau, et comment on détourne les deux.
builds: tracer une résolution DNS avec dig, et expliquer le tunneling DNS
source: Cloudflare Learning Center, Qu'est-ce que le DNS ? (existe en français) | https://www.cloudflare.com/learning/dns/what-is-dns/
words: DNS, résolveur, DHCP
---
Vous tapez `example.com`, mais les paquets ont besoin d'adresses IP. Le DNS fait la traduction, et presque tout sur un réseau en dépend. Cela fait des journaux DNS l'une des meilleures sources de données d'un défenseur, et du DNS l'une des cachettes favorites d'un attaquant.

@term DNS (Domain Name System) = Le système d'internet qui traduit les noms comme example.com en adresses IP.
@term résolveur = Le serveur DNS qui fait le travail de recherche pour votre appareil.
@term serveur faisant autorité = Le serveur DNS qui détient les enregistrements officiels d'un domaine.
@term enregistrement DNS = Une entrée dans le DNS, comme un enregistrement A qui associe un nom à une adresse.
@term TTL (durée de vie) = Combien de temps une réponse DNS peut être mise en cache.
@term DHCP = Un protocole qui donne automatiquement à un appareil une adresse IP et des réglages réseau.
@term tunneling DNS = Cacher des données dans des requêtes et des réponses DNS pour les faire passer derrière les défenses.
@term passerelle (passerelle par défaut) = Le routeur auquel un appareil envoie son trafic quand la destination n'est pas sur son réseau local.

## Comment marche une résolution

Le DNS est un gigantesque annuaire réparti, organisé comme un arbre. Votre ordinateur demande à un **résolveur**, souvent géré par votre fournisseur ou votre entreprise, qui fait les démarches :

@flow Votre appareil > Résolveur > Serveur racine > Serveur .com > Serveur faisant autorité > Réponse renvoyée et mise en cache

@seq Appareil | Résolveur | Serveurs DNS
Appareil > Résolveur: Où est example.com ?
Résolveur > Serveurs DNS: La racine, puis .com, puis le domaine
Serveurs DNS > Résolveur: 93.184.216.34
Résolveur > Appareil: 93.184.216.34, mis en cache

1. Votre appareil vérifie son propre cache, puis demande au résolveur.
2. Le résolveur demande à un serveur racine : « où est `.com` ? »
3. Il demande au serveur `.com` : « où est `example.com` ? »
4. Il demande au serveur **faisant autorité** de ce domaine, qui donne la réponse.
5. Le résolveur la met en cache pour le **TTL** de l'enregistrement, pour que la prochaine recherche soit instantanée.

Le protocole est défini dans la [RFC 1035](https://www.rfc-editor.org/rfc/rfc1035). Il utilise le port 53, surtout en UDP.

?? Vous changez un enregistrement DNS, et certains utilisateurs atteignent encore l'ancienne adresse. Pourquoi ?
+ Leur résolveur utilise encore sa réponse en cache
- Leur navigateur ne gère plus aucun enregistrement DNS
- Les serveurs racines mettent une semaine à lire
- L'ancien serveur se copie le trafic à lui-même
=> Les réponses sont mises en cache aussi longtemps que le dit le TTL de l'enregistrement.

## Les enregistrements que vous rencontrerez

| Type | Contient | Exemple |
|---|---|---|
| `A` | Adresse IPv4 | `example.com → 93.184.216.34` |
| `AAAA` | Adresse IPv6 | |
| `CNAME` | Alias vers un autre nom | `www → example.com` |
| `MX` | Serveur de courrier | Utilisé en analyse d'hameçonnage |
| `TXT` | Texte libre | Enregistrements SPF et DKIM (mois 9) |
| `NS` | Serveurs faisant autorité | |
| `PTR` | Inverse : adresse vers nom | |

::: try Sur votre VM
```
dig example.com
dig example.com MX +short
dig +trace example.com        parcourt tout l'arbre
```
Regardez combien de temps l'`ANSWER` est mis en cache, en secondes, et lancez-la deux fois pour voir le TTL décompter.
:::

?? Un enregistrement a un TTL de 3600. Qu'est-ce que cela veut dire ?
+ Les résolveurs peuvent garder la réponse une heure
- Le domaine entier expire dans environ une heure
- Le serveur met bien 3600 millisecondes à répondre
- Seuls 3600 clients peuvent le demander par jour
=> Le TTL dit combien de secondes une réponse reste valide dans un cache. C'est aussi pourquoi un changement DNS ne prend pas effet partout d'un coup.

## DHCP : rejoindre un réseau

Quand vous vous connectez au Wi-Fi, comment obtenez-vous une adresse ? **DHCP**. L'échange a [quatre étapes](https://www.rfc-editor.org/rfc/rfc2131), souvent retenues par DORA :

@seq Nouvel appareil | Serveur DHCP
Nouvel appareil > Serveur DHCP: Discover : il y a quelqu'un ?
Serveur DHCP > Nouvel appareil: Offer : prends cette adresse
Nouvel appareil > Serveur DHCP: Request : je la prends
Serveur DHCP > Nouvel appareil: Ack : elle est à toi

Il vous donne une adresse IP, un masque de sous-réseau, votre **passerelle** par défaut et votre serveur DNS. Remarquez le risque : un serveur DHCP pirate peut dire aux victimes d'utiliser la passerelle ou le DNS de l'attaquant, comme l'usurpation ARP mais plus large. Les commutateurs administrables s'en défendent avec le DHCP snooping.

Les journaux DHCP comptent aussi dans les enquêtes : ils vous disent quel appareil détenait une IP à un moment précis.

?? Pourquoi un serveur DHCP pirate est-il dangereux ?
+ Il peut donner aux victimes la passerelle de l'attaquant
- Il peut éteindre chaque commutateur présent sur le réseau
- Il peut lire les mots de passe des ordinateurs
- Il peut faire expirer tous les enregistrements DNS partout
=> Qui vous donne votre passerelle et votre serveur DNS peut voir ou détourner votre trafic.

## Comment le DNS est détourné

| Détournement | Comment ça marche | Ce que vous verriez |
|---|---|---|
| **Usurpation / empoisonnement du cache** | De fausses réponses envoient les victimes à la mauvaise adresse | Des réponses qui ne correspondent pas aux serveurs attendus |
| **Tunneling** | Des données sont encodées dans des requêtes vers un domaine de l'attaquant | De longs sous-domaines aléatoires, d'énormes volumes, beaucoup d'enregistrements TXT |
| **Amplification** | De petites requêtes forgées déclenchent de grandes réponses vers une victime | Des flots de réponses DNS non sollicitées |
| **Domaines récemment enregistrés** | Un malware appelle sa base sur des domaines tout neufs | Des recherches de noms de moins de quelques jours |

Voici pourquoi le tunneling marche : les pare-feu laissent souvent passer le DNS, et un résolveur transmettra volontiers une requête au serveur de l'attaquant. Une requête comme celle-ci fait passer des données en douce :

```
aGVsbG8gd29ybGQ.x9k2.evil.example
```

Les sous-domaines normaux sont courts et lisibles. De longs sous-domaines qui ressemblent à du base64, répétés des milliers de fois, ne sont pas normaux.

@term base64 = Un encodage qui représente n'importe quelles données en texte imprimable. Il est réversible par n'importe qui.

?? Dans les journaux DNS, quel schéma suggère le plus un tunneling ?
+ Des milliers de longs sous-domaines aléatoires, un domaine
- Beaucoup de recherches vers un site d'actualité populaire
- Une recherche de l'adresse d'un serveur de courrier
- Des recherches régulières du propre domaine de l'entreprise
=> Le tunneling a besoin de beaucoup de requêtes qui portent des données encodées, donc il apparaît comme de longs noms à forte entropie sous un seul domaine.

?! Pourquoi un attaquant choisirait-il le DNS, plutôt que HTTP, pour faire sortir des données d'un réseau verrouillé ?
