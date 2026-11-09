---
title: Les couches, Ethernet et ARP
summary: Le modèle en couches que tout le monde utilise, comment les données circulent sur un réseau local, et comment l'usurpation ARP abuse de cette confiance.
builds: expliquer l'usurpation ARP et comment elle apparaît dans le trafic, un point de validation
source: RFC 826, le protocole de résolution d'adresses (en anglais) | https://www.rfc-editor.org/rfc/rfc826
words: adresse MAC, ARP, commutateur
---
Le réseau serait impossible à analyser sans les couches. Chacune résout un problème et fait confiance à celle du dessous. Les attaquants adorent les interstices entre elles, et le premier que vous verrez est ARP.

@term protocole = Un ensemble de règles convenues sur la façon dont deux systèmes communiquent.
@term modèle OSI = Un modèle de référence du réseau en sept couches, surtout utilisé comme vocabulaire commun.
@term modèle TCP/IP = Le modèle en quatre couches qui décrit comment internet fonctionne réellement.
@term encapsulation = Envelopper les données dans un en-tête à chaque couche, comme une enveloppe dans une enveloppe.
@term adresse MAC = Une adresse matérielle sur une carte réseau, qui sert à livrer les trames sur un réseau local.
@term trame = Un morceau de données sur un réseau local, adressé par MAC.
@term commutateur (switch) = Un appareil qui achemine les trames entre machines d'un même réseau local.
@term routeur = Un appareil qui achemine les paquets entre réseaux différents.
@term ARP = *Address Resolution Protocol* : trouve l'adresse MAC qui correspond à une IP sur le réseau local.
@term VLAN = Une façon de scinder un commutateur physique en réseaux virtuels séparés.
@term MITM (homme du milieu) = Une attaque où quelqu'un se place en secret entre deux parties et relaie ou modifie leur trafic.

## Les couches : des enveloppes dans des enveloppes

| Couche TCP/IP | Couches OSI | Rôle | Exemples | Adresse |
|---|---|---|---|---|
| Application | 7, 6, 5 | Ce que disent les programmes | HTTP, DNS, SSH | Noms, URL |
| Transport | 4 | Quel programme, et la fiabilité | TCP, UDP | Ports |
| Internet | 3 | Quelle machine, à travers les réseaux | IP, ICMP | Adresses IP |
| Liaison | 2, 1 | Le saut suivant sur ce câble | Ethernet, Wi-Fi | Adresses MAC |

@stack
Application | HTTP, DNS, SSH | vos données
Transport | TCP, UDP | ajoute les ports
Internet | IP | ajoute les adresses
Liaison | Ethernet, Wi-Fi | ajoute les adresses MAC

Quand vous envoyez des données, chaque couche les emballe avec son propre en-tête. C'est l'**encapsulation**, comme mettre une lettre dans une enveloppe, puis dans une plus grande. Chaque routeur n'ouvre que jusqu'où il en a besoin.

@flow Requête HTTP > En-tête TCP ajouté > En-tête IP ajouté > Trame Ethernet envoyée

On dit « couche 3 » ou « couche 7 » tout le temps, avec les numéros OSI : la couche 2, c'est la commutation, la couche 3, le routage, la couche 4, les ports, la couche 7, les applications.

@drill layers

?? L'adresse de quelle couche change à chaque saut ?
+ Les adresses MAC de la couche de liaison
- Les adresses IP de la couche internet, elles
- Les numéros de port de la couche transport
- Les adresses web de la couche application, elles
=> Une trame ne voyage que d'un saut, donc les routeurs en construisent une nouvelle à chaque fois. Les adresses IP, elles, restent les mêmes.

## Adresses MAC et commutateurs

Une adresse IP dit où un paquet va finalement. Une **adresse MAC** dit qui le reçoit sur *ce* câble. Elle fait 48 bits, s'écrit comme `aa:bb:cc:11:22:33`, et ne compte que sur le réseau local.

Un **commutateur** apprend quelle adresse MAC se trouve sur quel port, et n'envoie chaque trame que là. Un **routeur** relie des réseaux : il retire la trame, lit le paquet IP, et construit une nouvelle trame pour le saut suivant.

::: key
Les adresses IP restent les mêmes pendant tout le trajet. Les adresses MAC changent à chaque saut.
:::

?? Un paquet va de votre ordinateur, par un routeur, vers un serveur. Quelle MAC destination votre ordinateur utilise-t-il ?
+ L'adresse MAC du routeur juste en local
- L'adresse MAC du serveur tout au bout
- L'adresse MAC du fournisseur d'accès à internet
- Aucune MAC, car les routeurs les ignorent
=> Les adresses MAC ne marchent que localement. Votre ordinateur remet la trame au routeur, et le routeur construit une nouvelle trame pour son saut suivant.

## ARP : « qui a cette IP ? »

Votre ordinateur connaît l'IP du routeur mais a besoin de sa MAC. Alors il crie à tous sur le réseau local, avec [ARP](https://www.rfc-editor.org/rfc/rfc826) :

```
Qui a 192.168.1.1 ? Dites-le à 192.168.1.50.      diffusion
192.168.1.1 est à aa:bb:cc:11:22:33.              réponse
```

Votre ordinateur range la réponse dans un cache. Voyez le vôtre avec `ip neigh`.

?? Pourquoi un ordinateur a-t-il besoin d'ARP avant de parler à son routeur ?
+ Il connaît l'IP, mais a besoin de la MAC
- Il connaît la MAC, mais a besoin de l'IP
- Il a besoin d'un mot de passe pour rejoindre
- Il a besoin que le routeur attribue un port
=> Les trames sur le câble local sont adressées par MAC, donc une adresse IP seule ne suffit pas.

## L'usurpation ARP

Voici la faille : **ARP n'a aucune authentification.** N'importe qui sur le réseau local peut répondre, même sans qu'on lui demande, et les machines croient généralement la réponse.

Un attaquant sur votre réseau envoie : « 192.168.1.1 est à *ma* MAC. » Votre ordinateur met son cache à jour et envoie son trafic à l'attaquant, qui le fait suivre pour que rien ne paraisse anormal. C'est une position d'**homme du milieu**.

@flow Victime > Machine de l'attaquant > Vrai routeur > Internet

**Comment cela paraît dans le trafic :**

- Beaucoup de réponses ARP non sollicitées.
- Une adresse MAC qui revendique deux adresses IP.
- La MAC de la passerelle qui change soudain.

**Défenses :** l'inspection ARP dynamique sur les commutateurs administrables, la segmentation du réseau, et surtout le chiffrement. Avec TLS, un attaquant au milieu ne voit que des données brouillées.

::: law
L'usurpation ARP sur un réseau qui ne vous appartient pas, y compris le Wi-Fi d'un café ou d'une université, est une attaque sur le trafic d'autrui. Ne l'essayez qu'entre vos propres VM de lab.
:::

?? Pourquoi l'usurpation ARP fonctionne-t-elle, au fond ?
+ Les réponses ARP sont acceptées sans aucune authentification
- Les commutateurs envoient le trafic à chaque port
- Les adresses IP changent bien à chaque reconnexion
- Les routeurs publient leurs mots de passe localement
=> ARP a été conçu pour un réseau de confiance. Beaucoup de vieux protocoles partagent cette faille, et c'est un schéma que vous reverrez.

## Les VLAN

Un **VLAN** scinde un commutateur physique en plusieurs commutateurs virtuels. Les invités, le personnel et les serveurs peuvent partager le matériel mais pas un réseau, et le trafic entre eux doit passer par un routeur ou un pare-feu où il peut être contrôlé. Vous construirez ce genre de segmentation au mois 3.

?! Dans Wireshark, comment reconnaîtriez-vous une usurpation ARP ? Décrivez ce que vous chercheriez.

### Aller plus loin

Des sources primaires et le meilleur contenu gratuit sur ce sujet (en anglais), tous vérifiés en novembre 2026 :

- [Le wiki de Wireshark : ARP, avec des captures d'exemple](https://wiki.wireshark.org/AddressResolutionProtocol)
- [MITRE ATT&CK T1557.002, empoisonnement du cache ARP, avec des détections](https://attack.mitre.org/techniques/T1557/002/)
