---
title: Balayer un réseau avec Nmap
summary: Découvrir les hôtes et les services comme le fait un attaquant, et lire les résultats comme un défenseur.
builds: un rapport Nmap de votre propre labo qui explique chaque port ouvert
source: Nmap Network Scanning, le livre officiel, gratuit en ligne (en anglais) | https://nmap.org/book/
words: balayage de ports, détection de service, énumération
---
Avant d'attaquer quoi que ce soit, un attaquant demande : qu'y a-t-il là ? Nmap est l'outil qui répond, et tout défenseur devrait d'abord le lancer contre son propre réseau.

@term Nmap = Un outil gratuit qui découvre les hôtes et les services d'un réseau.
@term balayage de ports = Sonder les ports d'une machine pour trouver lesquels sont ouverts.
@term énumération = Collecter activement des détails sur les hôtes, les services et les utilisateurs d'une cible.
@term bannière = Le texte qu'un service envoie pour s'identifier, souvent avec une version.
@term NSE (Nmap Scripting Engine) = Les scripts de Nmap pour des vérifications supplémentaires sur un service.

::: law
Le balayage est la première étape d'une attaque, et balayer des systèmes qui ne vous appartiennent pas peut vous attirer de vrais ennuis. Balayez votre propre labo, ou l'hôte que Nmap lui-même [met à disposition pour les essais](https://nmap.org/book/man-target-specification.html), `scanme.nmap.org`, avec modération. Notez que Kali doit être ici sur votre réseau privé hôte.
:::

## Comment fonctionne un balayage

C'est la poignée de main TCP de la leçon 18, utilisée comme une question.

| Vous envoyez | Réponse | Nmap dit |
|---|---|---|
| SYN | SYN-ACK | **open** (ouvert) : un service écoute |
| SYN | RST | **closed** (fermé) : l'hôte est allumé, rien n'écoute |
| SYN | Rien, ou ICMP unreachable | **filtered** (filtré) : un pare-feu est probablement sur le chemin |

Le balayage par défaut en root, `-sS`, est un **balayage SYN** : sur un SYN-ACK, Nmap envoie RST au lieu de terminer la poignée de main. C'est rapide. Cela reste visible pour toute surveillance correcte.

?? Dans un balayage SYN, que renvoie un port fermé ?
+ RST, ce qui signifie que rien n'écoute là
- SYN-ACK, ce qui signifie qu'un service a répondu
- Rien, car un port fermé reste totalement muet
- FIN, ce qui signifie que tout est terminé
=> Un port fermé répond RST. Le silence signifie en général qu'un pare-feu a jeté la sonde.

### Votre premier balayage, ligne par ligne

Sur Kali, Nmap est déjà installé. Sur Ubuntu, `sudo apt install nmap` l'ajoute, et `nmap --version` confirme qu'il fonctionne. Une commande Nmap a trois parties : le mot `nmap`, les options qui disent comment balayer, et la cible qui dit quoi balayer. Sans aucune option, il vérifie les 1 000 ports TCP les plus courants de la cible.

Démarrez votre VM Ubuntu, trouvez son adresse avec `ip a`, et depuis Kali lancez `sudo nmap` suivi de cette adresse. La sortie ressemble à ceci ; votre numéro de version, votre adresse et vos ports seront différents.

```
Starting Nmap 7.95 ( https://nmap.org ) at 2026-11-15 10:02 CET
Nmap scan report for 192.168.56.10
Host is up (0.00042s latency).
Not shown: 997 closed tcp ports (reset)
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
3306/tcp open  mysql
MAC Address: 08:00:27:AB:CD:EF (Oracle VirtualBox virtual NIC)

Nmap done: 1 IP address (1 host up) scanned in 0.31 seconds
```

| Ligne | Ce qu'elle vous dit |
|---|---|
| `Nmap scan report for …` | Quelle cible les lignes suivantes décrivent. Le balayage d'un réseau entier répète ce bloc pour chaque hôte |
| `Host is up` | La cible a répondu, et en combien de temps |
| `Not shown: 997 closed tcp ports (reset)` | 997 des 1 000 ports ont répondu RST, Nmap les résume donc en une ligne |
| `PORT STATE SERVICE` | Le tableau lui-même : le port et le protocole, son état, et le service qui vit d'habitude sur ce port |
| `MAC Address` | L'adresse matérielle de la carte réseau. Vous ne la voyez que pour les hôtes de votre propre réseau local |
| `Nmap done` | Combien d'adresses ont été balayées et en combien de temps |

Une chose dans ce tableau est une supposition. `SERVICE` est cherché dans une liste à partir du numéro de port : Nmap n'a pas vérifié que le port 80 fait vraiment tourner un serveur web. Vérifier, c'est le travail de `-sV`, qui vient ensuite.

## Une méthode, pas une commande

```
nmap -sn 192.168.56.0/24                   1. Quels hôtes sont allumés ?
nmap -p- 192.168.56.10                     2. Les 65 535 ports TCP d'un hôte
nmap -sV -sC -p 22,80,443 192.168.56.10    3. Qu'y a-t-il exactement sur ces ports ?
nmap -sU --top-ports 20 192.168.56.10      4. N'oubliez pas UDP (lent)
nmap -oA scan1 192.168.56.10               Enregistrer tous les formats de sortie
```

| Option | Signification |
|---|---|
| `-sn` | Découverte des hôtes seulement |
| `-p-` | Tous les ports TCP. Par défaut, Nmap ne balaie que les 1 000 plus courants |
| `-sV` | Détecter la version des services |
| `-sC` | Lancer les scripts NSE par défaut |
| `-sU` | Balayage UDP |
| `-O` | Deviner le système d'exploitation |
| `-oA nom` | Enregistrer les résultats dans tous les formats |

Pourquoi quatre étapes et pas une seule grosse commande ? Chaque étape est plus lente et plus bruyante que la précédente, donc vous resserrez d'abord la cible. L'étape 1 réduit un réseau de 254 adresses possibles aux quelques-unes qui sont vivantes. L'étape 2 trouve chaque port ouvert sur l'une d'elles. L'étape 3 ne passe son temps que sur ces ports, en demandant à chaque service ce qu'il est. L'étape 4 reprend l'idée pour UDP, qui est lent parce qu'un port UDP qui ne dit rien peut être ouvert ou filtré, et Nmap doit attendre pour le savoir. Il les signale comme `open|filtered`.

Trois autres options valent d'être connues dès le début :

| Option | Signification |
|---|---|
| `--reason` | Ajoute une colonne qui dit pourquoi Nmap a choisi chaque état, par exemple `syn-ack` ou `reset` |
| `-Pn` | Saute la découverte des hôtes et balaie quand même. À utiliser quand un hôte bloque le ping mais que vous savez qu'il est là |
| `-T4` | Un réglage de vitesse plus rapide, sans risque sur le réseau de votre labo. Le réglage par défaut est `-T3` |

`-oA scan1` écrit trois fichiers : `scan1.nmap` est ce que vous avez vu à l'écran, `scan1.gnmap` contient une ligne par hôte pour que `grep` puisse y chercher, et `scan1.xml` sert aux autres outils. Enregistrez chaque balayage. Un résultat que vous ne pouvez pas remontrer n'est pas une preuve.

::: trap Balayez tous les ports
Par défaut, Nmap teste les 1 000 ports les plus courants. Un service sur le port 8443 ou 31337 peut lui échapper. Utilisez toujours `-p-` sur les hôtes qui comptent.
:::

?? Un balayage montre le port 22 `filtered`. Quelle est la meilleure lecture ?
+ Quelque chose, sans doute un pare-feu, jette les sondes
- SSH tourne avec son mot de passe par défaut
- L'hôte est très certainement éteint en ce moment même
- Un service écoute et il a accepté la connexion
=> Filtré signifie que Nmap n'a reçu aucune réponse utile. Un port ouvert répondrait SYN-ACK et un port fermé RST.

## Lire les résultats

```
PORT     STATE  SERVICE VERSION
22/tcp   open   ssh     OpenSSH 9.6p1 Ubuntu
80/tcp   open   http    nginx 1.24.0
3306/tcp open   mysql   MySQL 8.0.36
```

Un défenseur pose trois questions sur chaque ligne :

1. **Ce port doit-il seulement être ouvert ?** Une base de données joignable depuis le réseau est un constat.
2. **Qui a besoin de l'atteindre ?** Un pare-feu pourrait-il le limiter ?
3. **La version est-elle à jour ?** Les anciennes versions peuvent avoir des vulnérabilités connues.

Voilà votre livrable de fin de mois : un rapport qui explique chaque port ouvert et s'il devrait exister.

?? Votre balayage trouve MySQL ouvert sur un serveur web, joignable depuis le réseau du personnel. Quelle est la meilleure recommandation ?
+ Le lier à localhost, ou le filtrer très strictement
- Faire écouter MySQL sur un port élevé et aléatoire
- Ne rien changer, un mot de passe fort suffit
- Ajouter une bannière pour tromper sur la version installée
=> Réduisez la surface d'attaque. Une base de données ne devrait être joignable que par ce qui en a besoin. Changer le port ne fait que la cacher d'un balayage par défaut.

## D'un port à un constat

L'étape 3 de la méthode remplace le `SERVICE` supposé par ce que le service dit de lui-même, et `-sC` ajoute quelques vérifications sans danger :

```
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    nginx 1.24.0 (Ubuntu)
|_http-title: Welcome to nginx!
|_http-server-header: nginx/1.24.0 (Ubuntu)
```

Les lignes qui commencent par `|_` viennent des scripts NSE. Ici, `http-title` a récupéré la page d'accueil et affiché son titre : « Welcome to nginx! » est la page par défaut, ce qui vous dit que quelqu'un a installé un serveur web sans jamais y mettre de site. C'est un constat, et vous l'avez obtenu sans rien attaquer.

Rédigez chaque port ouvert de la même façon, pour qu'un lecteur puisse agir :

| Port | Ce qui s'y trouve | Doit-il être ouvert ? | Action |
|---|---|---|---|
| 22 | OpenSSH 9.6p1 | Oui, pour l'administration | Limiter la source à la machine d'administration |
| 80 | nginx 1.24.0, page par défaut | Non, rien n'est publié | Supprimer nginx ou fermer le port |
| 3306 | MySQL 8.0.36 | Pas depuis le réseau | Lier à localhost |

?? Nmap affiche `80/tcp open http` lors d'un balayage sans option. Quelle confiance accorder au mot `http` ?
+ C'est une supposition tirée du numéro de port
- C'est certain, car Nmap a récupéré une page
- C'est lu dans la bannière du service distant
- C'est repris de la liste des processus locaux
=> Sans `-sV`, le nom du service vient d'une liste des ports habituels. N'importe quel programme peut écouter sur le port 80.

?? Un hôte que vous savez allumé apparaît comme `Host seems down` dans votre balayage. Quelle option essayer ensuite ?
+ `-Pn`, pour sauter la découverte et balayer quand même
- `-sU`, pour faire passer tout le balayage sur UDP
- `-oA`, pour enregistrer le résultat dans trois fichiers distincts
- `-sC`, pour lancer les scripts par défaut sur lui
=> La découverte des hôtes repose sur des sondes qu'un pare-feu peut jeter. `-Pn` dit à Nmap de considérer l'hôte comme allumé et de passer directement au balayage des ports.

::: try Balayez, changez, balayez encore
1. Balayez votre VM Ubuntu avec `sudo nmap -p- -oA before` et son adresse.
2. Sur la VM, installez un serveur web avec `sudo apt install nginx`, puis balayez de nouveau avec `-oA after`.
3. Comparez les deux avec `diff before.nmap after.nmap`. Le port 80 devrait être la nouvelle ligne.
4. Lancez `sudo nmap -sV -sC -p 80` contre elle et lisez ce que les scripts rapportent.
5. Supprimez le serveur avec `sudo apt remove nginx`, balayez une troisième fois, et confirmez que le port est fermé.
:::

## Ce que voit un défenseur

Lancez un balayage en observant avec Wireshark ou votre IDS. Un balayage de ports, c'est une seule source qui touche beaucoup de ports en peu de temps, et c'est bruyant. Cela mène à la leçon suivante.

@drill ports

?! Balayez votre VM Ubuntu. Collez le résultat et, pour chaque port, répondez : doit-il être ouvert, et pourquoi ?

### Pour aller plus loin

Les sources primaires et le meilleur matériel gratuit sur ce sujet, tous vérifiés en novembre 2026 (en anglais) :

- [Guide de référence de Nmap (la page de manuel, en ligne)](https://nmap.org/book/man.html)
- [Livre Nmap : les techniques de balayage de ports](https://nmap.org/book/man-port-scanning-techniques.html)
