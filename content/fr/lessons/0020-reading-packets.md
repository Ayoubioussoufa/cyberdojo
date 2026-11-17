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

### Ce que capturer veut vraiment dire

Chaque paquet qui atteint votre ordinateur arrive par une **interface** réseau : le port Ethernet, la carte Wi-Fi, ou une interface virtuelle dans une VM ou un conteneur. D'habitude, le système lit chaque paquet et remet son contenu au bon programme. Un outil de capture demande en plus au système une copie de chaque paquet d'une interface, en-têtes compris. Comme cette vue est puissante, capturer demande root, ou, sur un poste de travail, l'appartenance au groupe `wireshark`. `tcpdump -D` liste ce sur quoi vous pouvez capturer :

```
1.eth0 [Up, Running, Connected]
2.any (Pseudo-device that captures on all interfaces) [Up, Running]
3.lo [Up, Running, Loopback]
```

`lo` est la boucle locale, où va le trafic vers `127.0.0.1`, et `any` écoute toutes les interfaces à la fois. Choisissez l'interface que le trafic traverse vraiment : une capture sur la mauvaise reste muette. Vous ne voyez aussi que ce qui atteint votre interface. Sur un réseau commuté moderne, c'est votre propre trafic plus les diffusions, pas celui de vos voisins : c'est pourquoi les défenseurs capturent sur le serveur lui-même, ou demandent à l'équipe réseau un port miroir.

### Lire une ligne de tcpdump

Voici de vraies lignes, capturées pendant `curl http://example.com` (les longues options TCP sont coupées) :

```
IP 172.17.0.2.39106 > 10.255.255.254.53: 44425+ [1au] A? example.com. (52)
IP 10.255.255.254.53 > 172.17.0.2.39106: 44425 2/0/1 A 104.20.23.154, A 172.66.147.243 (72)
IP 172.17.0.2.34802 > 104.20.23.154.80: Flags [S], seq 1074556823, win 64240, length 0
IP 104.20.23.154.80 > 172.17.0.2.34802: Flags [S.], seq 3014024341, ack 1074556824, win 65535, length 0
IP 172.17.0.2.34802 > 104.20.23.154.80: Flags [.], ack 1, win 63, length 0
IP 172.17.0.2.34802 > 104.20.23.154.80: Flags [P.], seq 1:76, ack 1, win 63, length 75: HTTP: GET / HTTP/1.1
```

Chaque ligne se lit *adresse.port source > adresse.port destination : détails*. Les deux premières sont du DNS sur le port 53 : `A? example.com.` demande l'adresse, et la réponse en donne deux. Les trois suivantes sont la poignée de main TCP, qu'on reconnaît à ses drapeaux :

| Drapeau | Sens |
|---|---|
| `[S]` | SYN : « ouvrons une connexion » |
| `[S.]` | SYN et ACK : « d'accord » (le point veut dire ACK) |
| `[.]` | ACK seul : « bien reçu » |
| `[P.]` | Push et ACK : voici des données |
| `[F.]` | FIN : « j'ai terminé » |
| `[R]` | Reset : « non », ou « arrêtez tout de suite » |

La dernière ligne porte 75 octets de données, et comme c'est du HTTP en clair, tcpdump peut même les nommer : `GET / HTTP/1.1`.

### Les filtres de capture ne sont pas des filtres d'affichage

Il existe deux langages de filtre différents, et les confondre est l'erreur de débutant la plus courante. Un **filtre de capture** décide de ce qui est enregistré tout court ; il s'écrit en syntaxe BPF, celle de tcpdump (`port 53`, `host 10.0.0.5`, `tcp port 443`). Un **filtre d'affichage** ne fait que masquer des paquets déjà enregistrés, dans la syntaxe propre à Wireshark (`dns`, `ip.addr == 10.0.0.5`). Tant que vous apprenez, capturez large et filtrez à l'affichage : un paquet écarté par un filtre de capture est perdu pour de bon. Dans Wireshark, la barre de filtre devient verte quand l'expression est valide et rouge quand elle ne l'est pas, ce qui veut souvent dire que vous avez tapé un langage dans la case de l'autre.

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

### Lire la liste des paquets

La même capture, ouverte dans Wireshark ou dans son jumeau en ligne de commande, `tshark`, donne une ligne par paquet :

```
    3   1.212532   172.17.0.2 → 10.255.255.254 DNS 94 Standard query 0xad89 A example.com OPT
    5   1.220672 10.255.255.254 → 172.17.0.2   DNS 114 Standard query response 0xad89 A example.com A 104.20.23.154 A 172.66.147.243 OPT
   10   1.248491   172.17.0.2 → 104.20.23.154 HTTP 141 GET / HTTP/1.1
```

Les colonnes sont le numéro du paquet dans le fichier, les secondes écoulées depuis le début de la capture, la source, la destination, le protocole le plus haut que Wireshark a reconnu, la taille en octets, et un résumé. Le numéro sert à désigner un paquet dans vos notes (« le GET est le paquet 10 »). Les identifiants identiques `0xad89` dans les paquets 3 et 5 permettent d'associer une question DNS à sa réponse.

### Suivre une conversation

Clic droit sur le paquet 10, puis Follow, puis TCP Stream : Wireshark reconstitue toute la conversation sous forme de texte.

```
GET / HTTP/1.1
Host: example.com
User-Agent: curl/8.14.1
Accept: */*
```

N'importe qui sur le chemin pourrait lire cela, et la page renvoyée, mot pour mot. En HTTP sans chiffrement, le mot de passe d'un formulaire de connexion serait tout aussi lisible : voilà tout l'argument en faveur de HTTPS, en un seul écran.

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

### La même requête en HTTPS

Capturez plutôt `curl https://example.com` et filtrez sur `tls` :

```
   17   2.019780   172.17.0.2 → 172.66.147.243 TLSv1.2 1628 Client Hello (SNI=example.com)
   20   2.056261 172.66.147.243 → 172.17.0.2   TLSv1.3 5144 Server Hello, Change Cipher Spec, Application Data
   23   2.059295   172.17.0.2 → 172.66.147.243 TLSv1.3 189 Application Data
   25   2.083958 172.66.147.243 → 172.17.0.2   TLSv1.3 619 Application Data, Application Data
```

Le Client Hello nomme encore le site en clair (`SNI=example.com`), puis tout n'est plus qu'« Application Data » : Follow TCP Stream ne montre maintenant que des octets brouillés. Le Client Hello est étiqueté TLSv1.2 parce qu'il est écrit dans un format qu'acceptent les logiciels plus anciens ; c'est la réponse du Server Hello qui fixe TLS 1.3.

### Quand vous ne voyez rien

| Ce qui se passe | Pourquoi | Faites ceci |
|---|---|---|
| Aucun paquet | Vous capturez sur la mauvaise interface | Vérifiez avec `tcpdump -D`, ou capturez sur `any` |
| « You don't have permission to capture on that device » | Capturer demande des privilèges | Utilisez `sudo tcpdump`, ou entrez dans le groupe `wireshark` et reconnectez-vous |
| La barre de filtre devient rouge | La syntaxe d'affichage n'est pas valide, souvent un filtre de capture tapé là | `port 53` devient `tcp.port == 53 or udp.port == 53`, ou simplement `dns` |
| Vous ne voyez que votre propre trafic | Un commutateur n'envoie à chaque appareil que ses propres paquets | Capturez sur le serveur lui-même, ou utilisez un port miroir dans votre lab |
| La capture devient énorme | Tout est enregistré | Arrêtez après N paquets avec `-c 100`, ou ajoutez un filtre de capture |
| Le contenu HTTPS est illisible | C'est le chiffrement qui fait son travail | C'est normal ; lisez plutôt les métadonnées |

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
