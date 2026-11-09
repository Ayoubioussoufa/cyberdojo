---
title: Lire des paquets avec Wireshark
summary: Capturer du vrai trafic, le filtrer, et suivre une requête web du DNS jusqu'à HTTP, en passant par TCP et TLS.
builds: une capture annotée et votre premier dossier de trafic, P02
source: Guide de l'utilisateur de Wireshark (en anglais) | https://www.wireshark.org/docs/wsug_html_chunked/
words: PCAP, filtre d'affichage, ICMP
---
Les journaux vous disent ce qu'un système affirme s'être passé. Les paquets montrent ce qui a vraiment traversé le câble. Une capture de paquets est ce qui se rapproche le plus de la vérité en réseau, et savoir en lire une est une compétence de base.

@term capture de paquets (PCAP) = Un fichier qui enregistre les paquets réseau vus à un point d'un réseau.
@term Wireshark = Un outil gratuit pour capturer et inspecter le trafic réseau.
@term tcpdump = Un outil en ligne de commande pour capturer et filtrer des paquets.
@term filtre d'affichage = Une expression Wireshark qui cache tout sauf les paquets voulus.
@term ICMP = Un protocole pour les messages et les erreurs réseau, utilisé par ping et traceroute.
@term TLS = *Transport Layer Security* : chiffre une connexion, comme HTTPS.
@term HTTP = Le protocole que les navigateurs et les serveurs web utilisent pour échanger pages et données.
@term NAT = *Network Address Translation* : un routeur réécrit les adresses pour que plusieurs appareils partagent une IP publique.

## Les outils

```
ip a                            vos adresses
ss -tuln                        ce qui écoute ici
dig example.com                 résolution DNS
ping -c 3 example.com           est-ce joignable ? (ICMP)
traceroute example.com          quels routeurs sont sur le chemin ?
sudo tcpdump -i eth0 port 53    capturer le DNS sur une interface
sudo tcpdump -i eth0 -w out.pcap   enregistrer une capture dans un fichier
```

`traceroute` utilise une astuce élégante : il envoie des paquets qui expirent après 1 saut, puis 2, et ainsi de suite, et chaque routeur qui en jette un renvoie une erreur **ICMP**, se révélant. Souvenez-vous que `ping` peut être bloqué : une absence de réponse ne prouve pas qu'un hôte est éteint.

?? `ping` n'obtient aucune réponse d'un serveur. Que pouvez-vous en conclure ?
+ Rien de certain, car ICMP est très souvent bloqué
- Le serveur est assurément éteint en ce moment même
- Votre propre câble réseau doit être de nouveau débranché
- Le serveur a certainement été piraté par un attaquant
=> Beaucoup d'hôtes et de pare-feu jettent le ping. Essayez autrement avant de décider qu'il est éteint.

## Lire Wireshark

Wireshark a trois volets : la liste des paquets, les couches décodées du paquet choisi, et les octets bruts. Vous reconnaîtrez les couches : Ethernet, puis IP, puis TCP, puis HTTP. C'est l'encapsulation, rendue visible.

Les **filtres d'affichage** sont ce qui le rend utilisable. La [référence complète](https://www.wireshark.org/docs/dfref/) est vaste, mais ceux-ci vont loin :

| Filtre | Montre |
|---|---|
| `ip.addr == 10.0.0.5` | Le trafic vers ou depuis un hôte |
| `tcp.port == 443` | Un seul port |
| `dns` | Le DNS seulement |
| `http.request` | Les requêtes HTTP |
| `tcp.flags.syn == 1 && tcp.flags.ack == 0` | Les tentatives de nouvelle connexion |
| `tcp.flags.reset == 1` | Les resets |
| `arp` | Le trafic ARP |
| `dns.qry.name contains "evil"` | Les requêtes DNS pour un nom |

Trois autres fonctions : **Suivre → Flux TCP** reconstruit toute une conversation, **Fichier → Exporter des objets** extrait les fichiers transférés, et **Statistiques → Conversations** montre qui a le plus parlé à qui.

?? Vous voulez trouver chaque hôte qui tente d'ouvrir de nouvelles connexions. Quel filtre ?
+ `tcp.flags.syn == 1 && tcp.flags.ack == 0`
- `tcp.flags.fin == 1 && tcp.flags.ack == 0`
- `tcp.flags.reset == 1 && tcp.flags.ack == 1`
- `tcp.flags.syn == 1 && tcp.flags.ack == 1`
=> La première étape d'une poignée de main est un SYN sans ACK. Un SYN-ACK est la réponse du serveur. Ce filtre est aussi la façon de repérer un scan de ports.

## Une requête web, de bout en bout

« Que se passe-t-il quand vous ouvrez un site web ? » est une question d'entretien garantie. Voici la réponse que vous saurez prouver depuis votre propre capture.

@flow Requête DNS > Réponse DNS > Poignée de main TCP > Poignée de main TLS > Requête HTTP > Réponse HTTP

::: try Votre capture annotée (validation)
1. Dans votre VM, lancez la capture : `sudo tcpdump -i eth0 -w web.pcap`.
2. Dans un autre terminal, lancez `curl https://example.com`.
3. Arrêtez la capture avec Ctrl+C et ouvrez `web.pcap` dans Wireshark.
4. Trouvez et notez les numéros des paquets de : la requête et la réponse DNS, le SYN, le SYN-ACK, l'ACK, le Client Hello TLS, et les données d'application chiffrées.
5. Dans vos notes, expliquez chaque étape en une phrase, avec son numéro de paquet.
:::

Voici ce que vous devriez trouver. Avec HTTPS, vous voyez les adresses IP, les ports, les tailles et la temporisation, et en général le nom du site dans le champ **SNI** de TLS. Vous ne voyez pas la page ni le chemin de l'URL : ils sont chiffrés. Les défenseurs s'appuient sur ces métadonnées tous les jours.

@term SNI (Server Name Indication) = Un champ TLS où le client nomme le site qu'il veut, souvent visible sur le réseau.

?? Une capture montre du HTTPS vers un site. Que voit normalement un observateur du réseau ?
+ Les adresses, la durée, les tailles, et souvent le nom d'hôte
- Le contenu de la page, mais pas du tout les adresses
- Le chemin complet de l'URL, avec toute sa chaîne de requête
- Les mots de passe tapés dans le formulaire de chaque site
=> TLS cache le contenu et le chemin. Les métadonnées restent visibles, et c'est souvent assez pour repérer un problème.

## Votre premier dossier : P02

Maintenant, faites-le pour de vrai. [malware-traffic-analysis.net](https://www.malware-traffic-analysis.net/) publie de vraies captures avec des exercices.

::: law
Ces captures contiennent du vrai trafic de malware, et les fichiers à l'intérieur peuvent être actifs. Ne les analysez que dans une VM, et n'extrayez ni n'ouvrez de fichiers sur votre propre ordinateur.
:::

Construisez d'abord une **chronologie**, puis répondez qui, quoi, quand et comment. La norme du parcours :

- Séparez le **fait** de l'**inférence** : « le paquet 412 montre un POST vers cet hôte » face à « c'est probablement de l'exfiltration ».
- Citez les numéros de paquets et les filtres comme preuves.
- Ajoutez une section « ce que j'ai cru à tort d'abord ». Les relecteurs expérimentés lisent cette partie.

Voyez le [projet P02](/projects/P02/) pour le plan complet. La validation du mois 2 est sur [le parcours](/roadmap/2/).

?! Écrivez la réponse complète à « que se passe-t-il quand j'ouvre https://example.com ? », en renvoyant à chaque étape vue dans votre capture.
