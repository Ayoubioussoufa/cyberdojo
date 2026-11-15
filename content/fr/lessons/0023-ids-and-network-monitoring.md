---
title: IDS et surveillance du réseau
summary: Comment Suricata et Zeek observent le trafic, comment relier une alerte aux paquets, et les attaques réseau qu'ils repèrent.
builds: une sonde qui fonctionne et alerte sur votre propre balayage Nmap
source: Documentation de Suricata (en anglais) | https://docs.suricata.io/
words: IDS, signature, faux positif
---
Un pare-feu décide de ce qui passe. Il ne vous dit pas grand-chose de ce qui se déroule dans ce qu'il a laissé passer. Pour cela, il faut que quelque chose observe.

@term IDS (système de détection d'intrusion) = Un système qui observe l'activité et lève des alertes quand quelque chose ressemble à une attaque.
@term IPS (système de prévention d'intrusion) = Un IDS placé en coupure, qui peut donc aussi bloquer le trafic.
@term signature = Une règle qui décrit un motif malveillant connu.
@term Suricata = Un IDS et IPS open source qui compare le trafic à des règles.
@term Zeek = Un outil de surveillance réseau open source qui transforme le trafic en journaux détaillés par protocole.
@term NSM (surveillance de la sécurité du réseau) = Collecter et analyser les données du réseau pour trouver des intrusions.
@term faux positif = Une alerte déclenchée par une activité inoffensive.
@term faux négatif = Une vraie attaque qui n'a levé aucune alerte.
@term vrai positif = Une alerte déclenchée à juste titre par une vraie activité malveillante.

## IDS ou IPS

Un **IDS** observe une copie du trafic et alerte. Un **IPS** est placé sur le chemin et peut jeter des paquets. Un IPS peut arrêter des attaques, mais une mauvaise règle peut aussi bloquer le vrai trafic de l'entreprise. C'est pourquoi beaucoup d'équipes commencent en mode détection seule.

Un IPS est sur le chemin, il peut donc jeter du trafic :

@flow Trafic > IPS > Serveur

Un IDS n'observe qu'une copie, il peut donc alerter, mais pas bloquer :

@flow Trafic > Commutateur > Serveur, avec une copie vers l'IDS

?? Que peut faire un IPS qu'un IDS ne peut pas faire ?
+ Bloquer le trafic, car il est sur le chemin
- Lire le trafic chiffré, sans avoir la moindre clé
- Tourner sur un ordinateur qui n'a plus aucun réseau
- Remplacer toute la journalisation sur chacun de vos serveurs
=> Un IDS n'observe qu'une copie. Un IPS peut jeter des paquets, donc une mauvaise règle peut aussi bloquer le vrai travail.

## Deux outils, deux philosophies

| | Suricata | Zeek |
|---|---|---|
| Approche | Comparer le trafic à des **signatures** | Consigner **ce qui s'est passé**, protocole par protocole |
| Sortie | Des alertes | Des journaux structurés : `conn.log`, `dns.log`, `http.log`, `ssl.log` |
| Idéal pour | « Cette chose connue et malveillante est-elle arrivée ? » | « Qu'a fait cet hôte mardi dernier ? » |

Ils se complètent : les signatures attrapent le connu, et les enregistrements de Zeek vous permettent d'enquêter après coup sur l'inconnu.

Voir une ligne de chacun rend la différence concrète. Voici une alerte Suricata, telle qu'elle est écrite dans `fast.log` :

```
11/15/2026-10:14:02.123456  [**] [1:1000001:1] SSH connection to lab [**] [Classification: (null)] [Priority: 3] {TCP} 192.168.56.20:51514 -> 192.168.56.10:22
```

Lisez-la de gauche à droite : le moment, puis trois nombres entre crochets (celui du milieu, `1000001`, est l'identifiant de la règle), le message de la règle, le protocole, et qui a parlé à qui. Elle vous dit qu'une règle a correspondu. Elle ne vous dit pas ce qui s'est passé ensuite.

Voici la même connexion dans le `conn.log` de Zeek, avec seulement les colonnes principales :

```
id.orig_h      id.orig_p  id.resp_h      id.resp_p  proto  service  duration  orig_bytes  resp_bytes  conn_state
192.168.56.20  51514      192.168.56.10  22         tcp    ssh      4.21      1893        2540        SF
```

Zeek a écrit cette ligne sans qu'aucune règle n'intervienne, car il en écrit une pour chaque connexion. `orig` est le côté qui a ouvert la connexion et `resp` celui qui a répondu. `conn_state` résume comment elle s'est déroulée :

| `conn_state` | Signification |
|---|---|
| `SF` | Une connexion normale : ouverte, utilisée, fermée |
| `S0` | Un SYN a été envoyé et rien n'est revenu |
| `REJ` | Le SYN a reçu un reset : le port est fermé |

Un balayage de ports dans `conn.log` est donc facile à repérer : un seul `id.orig_h`, des centaines de `id.resp_p` différents, zéro octet, et un mur de `REJ` et de `S0`.

?? Vous voulez savoir ce qu'un hôte a fait mardi dernier. Lequel convient le mieux ?
+ Zeek, car il enregistre ce qui s'est passé
- Suricata, car il ne compare qu'aux signatures connues
- Aucun, car un réseau ne peut jamais s'enregistrer
- Les deux sont inutiles sans une connexion Internet
=> Zeek garde des enregistrements structurés de l'activité, vous pouvez donc enquêter après coup. Suricata vous dit quand une règle a correspondu.

## Lire une règle Suricata

```
alert tcp any any -> $HOME_NET 22 (msg:"SSH connection to lab"; flags:S; sid:1000001; rev:1;)
│     │   │   │     │          │   └─ quoi chercher et quoi dire
│     │   │   │     │          └─ port de destination
│     │   │   │     └─ réseau de destination
│     │   │   └─ port source
│     │   └─ réseau source
│     └─ protocole
└─ action
```

La [documentation des règles](https://docs.suricata.io/en/latest/rules/intro.html) (en anglais) couvre le reste. Vous écrirez des détections pour gagner votre vie à partir du mois 11.

La partie avant les parenthèses est l'**en-tête** : elle décide quels paquets la règle regarde seulement. La partie entre parenthèses est la liste des **options**, chacune terminée par un point-virgule :

| Option | Signification |
|---|---|
| `msg:"…"` | Le texte qui apparaît dans l'alerte |
| `flags:S` | Ne retenir que les paquets dont le drapeau SYN est levé, donc le début d'une connexion |
| `sid:1000001` | L'identifiant unique de la règle. Utilisez des nombres à partir de 1000000 pour vos propres règles, afin qu'elles n'entrent jamais en conflit avec les règles publiées |
| `rev:1` | La version de cette règle. Augmentez-la à chaque modification |

Cette règle alerte sur chaque SYN vers le port 22, ce qui convient pour un premier essai et ne sert à rien en production. Une option de plus transforme « une connexion » en « un motif » :

```
alert tcp any any -> $HOME_NET any (msg:"Possible port scan"; flags:S; threshold: type threshold, track by_src, count 20, seconds 10; sid:1000002; rev:1;)
```

`threshold` compte les correspondances par adresse source (`track by_src`) et n'alerte que lorsqu'une source envoie 20 SYN en 10 secondes. Une personne qui ouvre une session SSH n'atteint jamais ce compte. Un scanner l'atteint en un instant. Choisir ces deux nombres, c'est régler la détection, et la section d'après explique ce que cela coûte.

?? Dans une règle Suricata, que représente `$HOME_NET` ?
+ Les réseaux que vous avez définis comme les vôtres
- L'adresse de la personne qui a écrit la règle
- Le dossier où toutes les règles sont bien rangées
- Le nom du réseau que l'attaquant utilise chez lui
=> C'est une variable de la configuration, pour qu'une même règle fonctionne sur de nombreux sites.

## Les quatre issues

Tout système de détection vit dans ce tableau :

| | Une attaque a eu lieu | Pas d'attaque |
|---|---|---|
| **Alerte levée** | Vrai positif | **Faux positif** |
| **Pas d'alerte** | **Faux négatif** | Vrai négatif |

Les faux positifs font perdre du temps aux gens jusqu'à ce qu'ils ignorent les alertes. Les faux négatifs sont des attaques manquées. Le réglage échange l'un contre l'autre, et vous ne pouvez amener aucun des deux à zéro.

?? Suricata alerte sur une « force brute », mais c'est votre propre scan de vulnérabilités planifié. Qu'est-ce que c'est ?
+ Un faux positif, qui demande un réglage soigné
- Un vrai positif, qui demande une réponse urgente
- Un faux négatif, qui révèle une attaque manquée
- Un vrai négatif, qui montre un comportement normal
=> La règle s'est déclenchée correctement sur le motif, mais l'activité est bénigne. Réglez selon le contexte, pas en désactivant la règle.

## Les attaques réseau que vous savez maintenant reconnaître

| Attaque | À quoi elle ressemble |
|---|---|
| **Balayage de ports** | Une source, beaucoup de ports, beaucoup de RST, peu de données |
| **Force brute** | Beaucoup de connexions courtes vers un même service de connexion |
| **Usurpation ARP** | Des réponses non sollicitées, une adresse MAC avec deux IP |
| **Usurpation DNS** | Des réponses inattendues, ou venues du mauvais serveur |
| **MITM** | Des avertissements de certificat, une passerelle changée, des chemins étranges |
| **Beaconing** | Un logiciel malveillant qui appelle sa base à intervalles réguliers |
| **Exfiltration** | Des transferts sortants inhabituellement gros |

@term beaconing = Un logiciel malveillant qui contacte son contrôleur à intervalles réguliers.

?? Une source touche 500 ports en une minute, avec peu de données. Qu'est-ce que c'est ?
+ Un balayage de ports, comme le décrit le tableau
- Du beaconing, tel que le tableau le décrit ici
- Une exfiltration, telle que le tableau la décrit ici
- Une sauvegarde tout à fait normale, lancée à l'heure
=> Beaucoup de ports, beaucoup de RST et peu de données font un balayage. L'exfiltration fait sortir de grandes quantités de données.

## Le chiffrement change la donne

La plupart du trafic est aujourd'hui en TLS, donc un IDS ne peut pas lire le contenu. Il s'appuie sur les métadonnées : qui a parlé à qui, combien, à quelle fréquence, et les empreintes TLS. C'est pourquoi les journaux des postes (mois 5) et les données réseau fonctionnent mieux ensemble.

?? Pourquoi les données réseau et les journaux des postes fonctionnent-ils mieux ensemble ?
+ Le chiffrement cache le contenu, l'hôte voit dedans
- Un hôte n'enregistre jamais rien sur ses processus
- Le réseau enregistre déjà toute l'activité des programmes
- Tout trafic chiffré est bloqué par les pare-feu
=> Le réseau montre qui a parlé à qui. L'hôte montre quel programme l'a fait, et ce qu'il a fait.

## Votre labo

Les commandes, pour une VM Ubuntu. Le guide de démarrage rapide en lien ci-dessous donne tous les détails.

```
sudo apt install suricata jq                 installer la sonde, et jq pour lire son JSON
ip a                                         noter le nom de l'interface de votre labo
sudo nano /etc/suricata/suricata.yaml        régler HOME_NET sur le réseau du labo, et l'interface sous af-packet
sudo suricata-update                         télécharger le jeu de règles par défaut
sudo suricata -T -c /etc/suricata/suricata.yaml   tester la configuration sans démarrer
sudo systemctl restart suricata              démarrer avec les nouveaux réglages
sudo tail -f /var/log/suricata/fast.log      regarder les alertes arriver, une par ligne
```

Pour votre propre règle, créez un fichier tel que `/etc/suricata/rules/local.rules`, mettez-y la règle, et ajoutez ce chemin à la liste `rule-files:` dans `suricata.yaml`. Relancez le test `-T` avant chaque redémarrage : une règle à laquelle il manque un point-virgule empêche toute la sonde de se charger, et le test vous dit quelle ligne est fausse.

Suricata écrit aussi chaque événement en JSON dans `/var/log/suricata/eve.json`. C'est le fichier que lisent les autres outils, et `jq` le filtre :

```
sudo tail -f /var/log/suricata/eve.json | jq 'select(.event_type=="alert")'
```

::: try Construisez une sonde
1. Sur Ubuntu, installez Suricata en suivant le [guide de démarrage rapide](https://docs.suricata.io/en/latest/quickstart.html) (en anglais).
2. Pointez-le sur l'interface de votre labo et activez les règles par défaut.
3. Ajoutez une règle locale qui se déclenche sur un SYN vers le port 22.
4. Depuis Kali, lancez un balayage Nmap.
5. Trouvez l'alerte dans `/var/log/suricata/fast.log`, puis trouvez les mêmes paquets dans une capture. Relier l'alerte aux paquets, voilà la compétence.
:::

?? Une règle se déclenche sur du trafic chiffré avec TLS. Sur quoi peut-elle encore le plus probablement s'appuyer ?
+ Adresses, ports, tailles, et un peu de négociation
- Les identifiants saisis dans la page de connexion
- Le contenu de chaque fichier qui est téléchargé
- Le code HTML de chaque page web demandée
=> Sans les clés, un IDS ne voit pas dans TLS. Les métadonnées restent.

## De l'alerte aux paquets

Une alerte est une affirmation, et les paquets sont la preuve. Exercez-vous à les relier : prenez l'heure, les deux adresses et les deux ports de la ligne d'alerte, et utilisez-les comme filtre d'affichage Wireshark sur une capture prise au même moment.

```
ip.addr == 192.168.56.20 && tcp.port == 22
```

Si la capture montre un SYN, un SYN-ACK puis une longue conversation chiffrée, quelqu'un s'est connecté. Si elle montre un SYN et un RST immédiat, répétés sur de nombreux ports, c'était un balayage et le port 22 n'était qu'une étape. Le texte de l'alerte était le même dans les deux cas. Ce sont les paquets qui les distinguent.

?? Une ligne de `fast.log` contient `[1:1000002:1]`. Que représente le nombre `1000002` ?
+ L'identifiant de la règle qui s'est déclenchée
- Le nombre de paquets comptés dans l'alerte
- Le port source utilisé par le scanner
- Le temps en secondes depuis le démarrage
=> Les trois nombres sont le générateur, l'identifiant de signature et la révision. L'identifiant de signature vous mène droit au texte de la règle.

?? Le `conn.log` de Zeek montre une source avec 400 connexions, toutes `REJ` ou `S0`, chacune vers un port différent. Que s'est-il passé ?
+ Un balayage de ports, car rien n'a été échangé
- Un gros téléchargement, réparti sur de nombreuses petites connexions
- Une connexion normale, répétée par un utilisateur très actif
- Une sauvegarde, qui envoie des fichiers vers un serveur
=> `REJ` et `S0` signifient que les connexions n'ont jamais transporté de données. Beaucoup de ports depuis une seule source et aucune donnée, c'est la forme d'un balayage.

?! Pourquoi une équipe ferait-elle tourner à la fois Suricata et Zeek, plutôt que d'en choisir un ?
