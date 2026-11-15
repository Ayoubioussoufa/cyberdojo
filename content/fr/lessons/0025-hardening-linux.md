---
title: Durcir un serveur Linux
summary: Services, journaux, tâches planifiées et réglages SSH, puis une réduction mesurable de votre surface d'attaque face à un référentiel.
builds: un serveur durci avec des preuves avant et après, ce qui termine P01
source: CIS Benchmarks (en anglais) | https://www.cisecurity.org/cis-benchmarks
words: durcissement, systemd, référentiel
---
Une installation par défaut est faite pour être pratique. Le **durcissement** consiste à retirer ce dont vous n'avez pas besoin et à resserrer ce qui reste, puis à le prouver.

@term durcissement = Réduire la surface d'attaque d'un système en retirant et en resserrant des éléments.
@term systemd = Le programme qui démarre et gère les services sur la plupart des systèmes Linux.
@term journald = Le service de systemd qui collecte les journaux, lus avec journalctl.
@term cron = Le planificateur de Linux, qui lance des commandes à heures fixes.
@term CIS Benchmark = Un guide de durcissement établi par consensus pour un produit précis, publié par le Center for Internet Security.
@term ufw = *Uncomplicated Firewall*, une interface simple pour le pare-feu d'un hôte Linux.
@term nftables = Le système de pare-feu actuel du noyau Linux.
@term Lynis = Un outil open source qui audite les réglages de sécurité de Linux.

## Savoir ce qui tourne

```
systemctl list-units --type=service --state=running     les services en marche
systemctl status ssh                                    l'état d'un service
sudo systemctl disable --now apache2                    l'arrêter et le garder éteint
```

`disable --now` arrête le service et l'empêche de démarrer au lancement de la machine. Chaque service retiré est un morceau de surface d'attaque en moins.

Un **service** est un programme qui tourne en arrière-plan sans que personne soit connecté pour le lancer : le serveur SSH, un serveur web, le planificateur. `systemd` les démarre au lancement de la machine et les relance s'ils plantent. Demandez l'état d'un service et lisez les trois lignes qui comptent :

```
$ systemctl status ssh
● ssh.service - OpenBSD Secure Shell server
     Loaded: loaded (/usr/lib/systemd/system/ssh.service; enabled; preset: enabled)
     Active: active (running) since Sun 2026-11-15 09:41:07 CET; 21min ago
   Main PID: 811 (sshd)
```

| Ligne | Ce qu'elle vous dit |
|---|---|
| `Loaded: … enabled` | **Enabled** (activé) signifie qu'il démarre à chaque lancement de la machine. `disabled` signifie que non |
| `Active: active (running)` | Il tourne en ce moment. `inactive (dead)` signifie arrêté |
| `Main PID: 811` | Le numéro du processus, que vous pouvez retrouver avec `ps -p 811` |

Activé et en marche sont deux faits distincts. Un service peut tourner maintenant mais être désactivé au démarrage, ou être activé mais arrêté, et `disable --now` règle les deux à la fois.

Les services comptent surtout quand ils écoutent sur le réseau. Cette commande réunit les deux vues, en montrant chaque port en écoute avec le programme qui est derrière :

```
$ sudo ss -tlnp
State   Local Address:Port   Process
LISTEN  0.0.0.0:22           users:(("sshd",pid=811,fd=3))
LISTEN  127.0.0.1:3306       users:(("mysqld",pid=1042,fd=22))
LISTEN  0.0.0.0:80           users:(("apache2",pid=977,fd=4))
```

`0.0.0.0` signifie « joignable sur toutes les cartes réseau », et `127.0.0.1` signifie « seulement depuis cette machine ». Ici, la base de données est déjà limitée à la machine elle-même, et le serveur web est ouvert à tous. Si personne ne sait dire pourquoi le port 80 est ouvert, c'est le service à désactiver.

?? Que fait `systemctl disable --now apache2` ?
+ L'arrête maintenant, et au démarrage
- Supprime ses fichiers du disque
- Le relance en mode sécurisé
- Le cache parmi les processus
=> Il arrête le service, et le garde éteint après un redémarrage.

## Savoir où sont les preuves

```
journalctl -u ssh --since "1 hour ago"     les journaux d'un service
journalctl -p err -b                       les erreurs depuis le démarrage
tail -f /var/log/auth.log                  les connexions, en direct
```

Les connexions et l'usage de `sudo` vont dans `/var/log/auth.log` sous Ubuntu. Les attaquants essaient d'effacer les journaux, donc les environnements sérieux les envoient aussitôt vers une autre machine. Cette idée revient au mois 9.

Une ligne de `auth.log` contient cinq faits, toujours dans le même ordre :

```
Nov 15 10:14:02 ubuntu-lab sshd[811]: Failed password for root from 203.0.113.7 port 44122 ssh2
```

Quand c'est arrivé, sur quelle machine, quel programme et quel processus l'ont écrite, ce qui s'est passé et pour quel compte, et d'où venait la tentative. `journalctl -f` montre le même flux en direct depuis le journal, et ajouter `-u ssh` le restreint à un seul service.

?? Pourquoi les équipes sérieuses envoient-elles les journaux vers une autre machine ?
+ Les attaquants tentent d'effacer les journaux locaux
- Les journaux s'écrivent bien plus vite ailleurs
- Linux ne peut stocker aucun journal localement
- Cela empêche les attaquants de se connecter
=> Un attaquant qui a root peut modifier les journaux locaux. Les copies conservées ailleurs survivent.

## Tâches planifiées

`cron` lance des commandes selon un horaire : `crontab -l` montre vos tâches, et `/etc/cron.d/` et `/etc/crontab` contiennent celles du système.

```
# min heure jour mois jour-semaine  commande
  0   3     *    *    *             /usr/local/bin/backup.sh
```

Les cinq champs sont la minute, l'heure, le jour du mois, le mois et le jour de la semaine, et `*` signifie « chaque ». Lisez la ligne ci-dessus ainsi : à la minute 0 de l'heure 3, chaque jour, lancer la sauvegarde. Deux autres pour vous exercer :

| Horaire | S'exécute |
|---|---|
| `*/5 * * * *` | Toutes les cinq minutes |
| `30 2 * * 1` | À 02 h 30 chaque lundi |

Les tâches se cachent à plusieurs endroits, donc vérifiez-les tous : `crontab -l` pour les vôtres, `sudo crontab -l -u root` pour celles de root, les fichiers de `/etc/cron.d/`, et `systemctl list-timers`, car systemd a son propre planificateur qui fait le même travail.

::: why Cron est un favori pour la persistance
Une ligne dans un fichier cron ramène un logiciel malveillant après chaque redémarrage, et si une tâche cron de root lance un script que tout le monde peut modifier, c'est une élévation de privilèges. Vérifiez toujours cron pendant une enquête, et regardez toujours qui peut écrire dans les scripts qu'il lance.
:::

?? Une tâche cron de root lance `/opt/backup.sh`, qui est en mode 777. Pourquoi est-ce grave ?
+ N'importe qui peut modifier du code lancé par root
- Cron ne peut lancer aucun fichier avec ce mode
- Les sauvegardes doivent toujours être bien rangées dans `/var`
- Le script révèle le mot de passe de root
=> Modifiable par tous signifie que n'importe quel utilisateur peut ajouter une commande, et root l'exécutera à la prochaine échéance.

## Durcir SSH

SSH fait face à Internet, il est donc attaqué en permanence, comme vous l'avez vu dans `auth.log`. Modifiez `/etc/ssh/sshd_config` :

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
```

`PasswordAuthentication no` n'a de sens qu'une fois qu'une clé fonctionne, donc installez d'abord la clé. Une paire de clés, ce sont deux fichiers : une clé privée qui ne quitte jamais votre machine, et une clé publique que vous pouvez donner à n'importe quel serveur. Le serveur garde la clé publique et s'en sert pour vérifier que vous détenez la clé privée, et aucun mot de passe ne traverse le réseau. La leçon 39 en explique les mathématiques.

```
ssh-keygen -t ed25519                 sur votre machine : créer la paire, et lui donner une phrase de passe
ssh-copy-id ana@192.168.56.10         copier la clé publique sur le serveur (demande le mot de passe une dernière fois)
ssh ana@192.168.56.10                 se reconnecter : aucun mot de passe de compte n'est demandé
```

La clé privée est `~/.ssh/id_ed25519` et la clé publique `~/.ssh/id_ed25519.pub`. Sur le serveur, la clé publique arrive dans `~/.ssh/authorized_keys`, une clé par ligne. Vous ne coupez les mots de passe que lorsque la troisième commande fonctionne.

Validez ensuite avant de redémarrer, pour ne pas vous enfermer dehors :

```
sudo sshd -t && sudo systemctl restart ssh
```

::: trap Ne sciez pas la branche sur laquelle vous êtes assis
Gardez votre session actuelle ouverte pendant que vous testez une nouvelle connexion depuis un second terminal. Si elle échoue, vous pouvez encore corriger. Sur une VM, un instantané aide aussi.
:::

Sous Ubuntu, les fichiers de `/etc/ssh/sshd_config.d/` peuvent prendre le pas sur le fichier principal, donc vérifiez les réglages effectifs avec `sudo sshd -T | grep -i permitrootlogin`.

?? Pourquoi garder votre session ouverte pendant que vous testez une nouvelle connexion ?
+ Vous pouvez encore corriger une erreur
- SSH exige deux sessions pour démarrer
- Cela fait appliquer les nouveaux réglages
- La fermer efface toute la configuration
=> Si les nouveaux réglages vous enferment dehors, la session ouverte est votre chemin de retour.

## Le pare-feu de l'hôte

```
sudo ufw default deny incoming
sudo ufw allow from 192.168.56.0/24 to any port 22 proto tcp
sudo ufw enable
sudo ufw status verbose
```

Autorisez SSH **avant** de l'activer. `ufw` est une couche conviviale au-dessus de [nftables](https://wiki.nftables.org/), dans le noyau.

?? Pourquoi autoriser SSH avant de lancer `ufw enable` ?
+ Sinon vous vous enfermeriez dehors
- Sinon ufw refuse de démarrer
- Sinon SSH perd ses clés
- Sinon les journaux sont effacés
=> Le refus par défaut s'applique aussitôt, y compris à votre propre connexion.

## Mises à jour

La plupart des intrusions par un logiciel utilisent une faille qui a déjà un correctif. Installer le correctif est le durcissement le moins cher qui soit.

```
sudo apt update                                     rafraîchir la liste des versions disponibles
apt list --upgradable                               voir ce qui changerait
sudo apt upgrade                                    installer les nouvelles versions
sudo apt install unattended-upgrades                installer l'outil de mise à jour automatique
sudo dpkg-reconfigure -plow unattended-upgrades     l'activer
```

`update` ne télécharge que la liste, et rien n'est installé avant `upgrade`. Avec `unattended-upgrades` activé, les correctifs de sécurité s'installent seuls chaque jour. Ensuite, `/var/log/unattended-upgrades/` montre ce qu'il a fait.

?? `sudo apt update` se termine sans erreur. Qu'est-ce qui a changé sur le serveur ?
+ Seule la liste des versions est rafraîchie
- Chaque paquet a reçu sa dernière version
- Seuls les correctifs de sécurité sont installés
- Le noyau a été remplacé puis redémarré
=> `update` récupère le catalogue. `upgrade` est la commande qui installe.

## Les référentiels : pas votre opinion

Un **CIS Benchmark** est une liste, établie par consensus, de centaines de réglages pour un produit. Vous n'avez pas besoin de tous. La feuille de route vous demande d'en appliquer un sous-ensemble et de noter pourquoi. Téléchargez le PDF gratuit pour Ubuntu chez [CIS](https://www.cisecurity.org/cis-benchmarks).

```
sudo lynis audit system       un audit noté, avec des suggestions
```

Lynis se termine par une note et une liste. Chaque élément a un identifiant de test que vous pouvez consulter :

```
  * Consider hardening SSH configuration [SSH-7408]
      - Details  : MaxAuthTries (set 6 to 3)

  Hardening index : 63 [############        ]
```

`sudo lynis show details SSH-7408` explique un test. Ne courez pas après la note pour elle-même : prenez chaque suggestion, décidez de la corriger ou de l'accepter, et notez votre choix et sa raison. Une note de 63 avec des raisons vaut plus qu'une note de 80 que vous ne savez pas expliquer.

?? Qu'est-ce qu'un CIS Benchmark ?
+ Une liste d'experts de réglages sûrs pour un produit
- Un test de vitesse conçu pour votre propre serveur
- Une loi que toute entreprise est tenue de suivre
- Un scanner qui corrige absolument tout sans aucune aide
=> C'est un consensus d'experts pour un produit, et vous choisissez un sous-ensemble raisonnable.

## Terminer P01

::: try Livrable de fin de mois
1. Lancez `audit.sh` sur le serveur neuf, et enregistrez la sortie dans `before.txt`.
2. Appliquez : SSH par clé seulement et sans connexion root, le pare-feu de l'hôte, les services inutiles retirés, les mises à jour activées, un sous-ensemble du CIS.
3. Relancez-le et enregistrez `after.txt`.
4. Vérifiez depuis une autre VM : la connexion par mot de passe doit échouer, la connexion en root aussi.
5. Balayez de nouveau avec Nmap et expliquez chaque port ouvert.
6. Publiez [P01](/projects/P01/) : schéma, plan d'adressage IP, règles de pare-feu avec leurs raisons, script d'audit, avant et après.
:::

Votre argumentaire s'écrit tout seul : « Le durcissement a fait passer mes propres constats de 14 à 3, et je peux montrer pourquoi les trois derniers sont des risques acceptés. »

?? Quelle est la preuve la plus solide que vous avez durci SSH ?
+ Une connexion qui échoue depuis une autre machine
- Le fichier de configuration modifié, dans vos notes
- Une capture d'écran montrant le service en marche
- Le nom du référentiel que vous avez suivi
=> Vérifié, pas supposé. Un fichier de configuration peut être supplanté, donc testez le comportement depuis l'extérieur.

## Vérifiez votre lecture

Avant de commencer le livrable de fin de mois, lisez trois preuves comme vous le ferez pendant celui-ci.

```
LISTEN  0.0.0.0:5432    users:(("postgres",pid=1203,fd=6))
```

?? Cette ligne vient de `sudo ss -tlnp` sur un serveur web dont le site utilise une base de données sur la même machine. Quel est le constat ?
+ La base écoute sur toutes les cartes réseau
- La base est arrêtée et doit être relancée
- La base n'accepte que les connexions depuis localhost
- La base tourne sous le compte utilisateur root
=> `0.0.0.0` signifie toutes les interfaces. Le site est sur la même machine, donc la base ne devrait écouter que sur `127.0.0.1`.

```
*/10 * * * * root /tmp/.cache/update.sh
```

?? Vous trouvez cette ligne dans `/etc/cron.d/` pendant une enquête. Qu'est-ce qui la rend suspecte ?
+ Root lance un script caché depuis `/tmp`
- La tâche tourne toutes les dix minutes
- L'horaire a cinq champs, et non six
- Un fichier cron ne nomme jamais d'utilisateur
=> `/tmp` est modifiable par tous et le nom du dossier commence par un point pour rester hors de vue. Une tâche de root qui pointe là est un moyen classique pour un logiciel malveillant de revenir.

?? Vous avez mis `PasswordAuthentication no`, lancé `sshd -t` et redémarré SSH. `sshd -T` affiche encore `passwordauthentication yes`. Quelle est la cause probable ?
+ Un fichier de `sshd_config.d` prend le dessus
- Le test `sshd -t` a échoué discrètement
- Le pare-feu bloque le tout nouveau réglage
- Le réglage ne s'applique qu'après un redémarrage
=> Sous Ubuntu, les fichiers de `/etc/ssh/sshd_config.d/` sont lus en premier et la première valeur l'emporte. `sshd -T` montre le résultat effectif, et c'est pourquoi vous le vérifiez plutôt que le fichier.

?! Citez trois choses que vous retireriez ou restreindriez sur un serveur neuf, et l'attaque que chacune empêche.
