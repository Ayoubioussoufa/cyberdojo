---
title: TCP, UDP et les ports
summary: Comment les programmes se parlent à travers un réseau, la poignée de main en trois temps, les drapeaux, et ce que chacun montre à un défenseur.
builds: expliquer la poignée de main TCP et lire les drapeaux dans une capture
source: RFC 9293, Transmission Control Protocol (en anglais) | https://www.rfc-editor.org/rfc/rfc9293
words: port, poignée de main TCP, socket
---
« Expliquez la poignée de main TCP » est une question d'entretien universelle. Elle explique aussi comment marchent les scanners de ports, pourquoi les pare-feu distinguent une nouvelle connexion d'une ancienne, et pourquoi certaines attaques utilisent UDP.

@term TCP = *Transmission Control Protocol* : livraison fiable et ordonnée, avec une connexion établie d'abord.
@term UDP = *User Datagram Protocol* : livraison rapide et sans connexion, sans garantie d'arrivée.
@term poignée de main TCP (en trois temps) = L'échange SYN, SYN-ACK, ACK qui ouvre une connexion TCP.
@term socket = Une extrémité d'une connexion réseau : une adresse IP plus un port.
@term drapeau (flag) = Un seul bit dans un en-tête TCP qui signale quelque chose, comme SYN, ACK, FIN ou RST.
@term port éphémère = Un port temporaire à numéro élevé qu'un client utilise pour une connexion.

## Les ports : quel programme ?

Une adresse IP trouve une machine, et un **port** trouve le programme dessus. Les ports sont des nombres de 0 à 65535. Les serveurs écoutent sur des [ports bien connus](https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml), et les clients choisissent un **port éphémère** élevé au hasard pour chaque connexion. Une connexion est donc identifiée par quatre valeurs :

```
IP source : port source   →   IP destination : port destination
192.168.1.50:51234        →   93.184.216.34:443
```

Voyez les vôtres avec `ss -tuln`, qui liste ce qui écoute.

@drill ports

?? Qu'est-ce qu'un port éphémère ?
+ Un port élevé temporaire qu'un client choisit
- Un port permanent qu'un serveur web utilise
- Un port que les pare-feu bloquent toujours
- Un port réservé uniquement au trafic UDP
=> Les serveurs écoutent sur des ports bien connus, et les clients utilisent un port élevé au hasard pour chaque connexion.

## TCP : un appel téléphonique

**TCP** se comporte comme un appel téléphonique. Vous vous connectez d'abord, tout arrive dans l'ordre, et les morceaux perdus sont renvoyés. Avant que la moindre donnée ne bouge, les deux côtés font la poignée de main :

@seq Client | Serveur
Client > Serveur: SYN : « On peut parler ? »
Serveur > Client: SYN-ACK : « Oui. Tu m'entends ? »
Client > Serveur: ACK : « Oui. »

Pourquoi trois temps ? Chaque côté doit prouver qu'il peut à la fois envoyer et recevoir, et chacun choisit un numéro de séquence de départ.

| Drapeau | Signification |
|---|---|
| `SYN` | Démarrer une connexion |
| `ACK` | J'ai reçu ceci |
| `FIN` | J'ai fini, je ferme poliment |
| `RST` | Abandon : rien ici, ou quelque chose ne va pas |
| `PSH` | Livre ces données tout de suite |

::: why Ce que la poignée de main donne aux défenseurs et aux attaquants
Un port ouvert répond au SYN par un SYN-ACK. Un port fermé répond par un RST. Un port filtré peut ne pas répondre du tout. C'est ainsi que marchent les scanners de ports : vous l'utiliserez avec Nmap au mois 3. Et comme la poignée de main prouve un contact bidirectionnel, TCP est difficile à usurper depuis une fausse adresse.
:::

?? Un scanner envoie SYN vers le port 8080 et reçoit un RST. Que vous dit cela ?
+ L'hôte est bien vivant, le port est fermé
- Le port est ouvert, un service a répondu
- Un pare-feu a jeté en silence cette sonde
- L'hôte lui-même se trouve entièrement et complètement éteint
=> Quelque chose a répondu, donc l'hôte est vivant, mais rien n'écoute sur ce port. Le silence suggérerait un filtrage.

## UDP : une carte postale

**UDP** n'a pas de poignée de main. Vous envoyez un datagramme et vous espérez. Il n'y a ni retransmission ni ordre, mais c'est rapide et léger. DNS, NTP et les appels vidéo l'utilisent.

| | TCP | UDP |
|---|---|---|
| Connexion | Oui, poignée de main d'abord | Non |
| Livraison | Garantie, ordonnée | Au mieux |
| Vitesse | Plus de surcharge | Plus léger |
| Exemples | HTTP, SSH, SMTP | DNS, NTP, VoIP, QUIC |
| Usurper la source | Difficile | Facile |

?? Pourquoi DNS utilise-t-il surtout UDP ?
+ Une petite question-réponse n'a pas besoin de poignée
- UDP chiffre tous les noms que vous recherchez
- TCP ne peut pas porter les noms longs
- UDP garantit que chaque réponse arrive bien ordonnée
=> Un petit paquet dans chaque sens est rapide. S'il est perdu, le client redemande tout simplement.

## Pourquoi UDP compte pour un défenseur

Puisque rien ne prouve l'adresse de l'expéditeur, UDP permet l'**amplification**. Un attaquant envoie une minuscule requête avec l'adresse de la victime forgée comme source, et un serveur envoie une réponse bien plus grosse à la victime. Des milliers de serveurs qui font cela créent une inondation. [L'explication de Cloudflare](https://www.cloudflare.com/learning/ddos/dns-amplification-ddos-attack/) détaille la version DNS.

@term amplification = Une attaque où de petites requêtes forgées font envoyer par des serveurs de grosses réponses à une victime.

?? Pourquoi UDP est-il utile aux attaques par amplification, mais pas TCP ?
+ UDP n'a pas de poignée pour vérifier la source
- Les paquets UDP sont toujours plus gros que TCP
- Le trafic TCP ne traverse jamais tout l'internet public
- UDP chiffre le trafic, le rendant invisible aux filtres
=> Sans poignée de main, un serveur répond à l'adresse source que le paquet prétend, quelle qu'elle soit.

## Comment une connexion se termine

Une fermeture polie utilise FIN de chaque côté. Une fermeture brutale utilise RST. Les connexions passent aussi par des états que vous voyez avec `ss` : `LISTEN` veut dire en attente, et `ESTABLISHED` veut dire active. Un `ESTABLISHED` inattendu vers une adresse étrange mérite une enquête.

?! Expliquez la poignée de main en trois temps à un ami non technique avec votre propre analogie. Puis dites ce qu'un attaquant en apprend.
