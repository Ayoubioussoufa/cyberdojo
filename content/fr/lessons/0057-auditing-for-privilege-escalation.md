---
title: Auditer l'élévation de privilèges
summary: Les listes de contrôle du défenseur pour Linux, Windows et Active Directory : ce qui permet à un utilisateur ordinaire de devenir administrateur, comment le trouver en premier, et à quoi ressemble chaque chemin dans les journaux.
builds: des listes de contrôle d'audit des privilèges, dans vos propres mots, pour Linux et Windows
source: CIS Benchmarks (en anglais) | https://www.cisecurity.org/cis-benchmarks
words: élévation de privilèges, moindre privilège, niveaux
---
Un attaquant arrive rarement en administrateur. Il arrive en tant que quelqu'un de petit, puis cherche un chemin vers le haut. C'est l'**élévation de privilèges**, et presque toute vient d'erreurs de configuration plutôt que de failles rares. La recherche que lancerait un attaquant, vous pouvez la lancer en premier.

@term LAPS = *Windows Local Administrator Password Solution* : un mot de passe d'administrateur local unique et renouvelé pour chaque machine.
@term niveaux = Garder les comptes d'administration des systèmes de grande valeur loin des machines ordinaires.
@term DCSync = Abuser des droits de réplication pour demander des données de mots de passe à un contrôleur de domaine.
@term service mal configuré = Un service Windows dont les réglages laissent un utilisateur ordinaire changer ce qui s'exécute sous un compte puissant.
@term gMSA (compte de service géré de groupe) = Un compte de service Windows au mot de passe long, renouvelé automatiquement.

## Le schéma derrière tous les autres

Un logiciel privilégié fait confiance à quelque chose, et un utilisateur peu privilégié peut modifier cette chose.

| Root ou SYSTEM fait confiance à | L'erreur | Le résultat |
|---|---|---|
| Un script lancé à heure fixe | N'importe qui peut y écrire | Son code s'exécute en root |
| Un programme marqué SUID | On peut lui faire faire plus que prévu | Un utilisateur ordinaire agit en root |
| Le chemin du programme d'un service | N'importe qui peut remplacer le fichier | Son code s'exécute en SYSTEM |
| Un fichier de configuration | Ses permissions sont trop larges | Les réglages changent |

Une fois que vous voyez cette forme, vous cessez de mémoriser des astuces. Vous demandez : **à quoi les comptes puissants font-ils confiance, et qui peut le modifier ?**

?? Root lance `/opt/job.sh` chaque nuit, et ce fichier est en mode 777. Pourquoi est-ce grave ?
+ N'importe quel utilisateur fait exécuter ses commandes par root
- Le fichier va finir par utiliser trop d'espace disque
- Les tâches de nuit échouent toujours avec ces permissions-là
- Cela empêche le compte root d'ouvrir la moindre session
=> Un fichier auquel root fait confiance n'est sûr que dans la mesure de ses permissions d'écriture. Vous l'avez prouvé sur Lantern.

## La liste de contrôle Linux

Lancez ces commandes en simple utilisateur, sur vos propres systèmes, et corrigez ce que vous trouvez.

| Contrôle | Commande | Correctif |
|---|---|---|
| Droits sudo | `sudo -l` | Nommer des commandes exactes, et éviter les jokers |
| Programmes SUID | `find / -perm -4000 -type f 2>/dev/null` | Retirer le SUID de ce qui n'en a pas besoin |
| Fichiers modifiables par tous | `find /etc -type f -perm -002` | Corriger le mode |
| Tâches planifiées | `cat /etc/crontab`, `ls -l` sur chaque script | Propriété de root, non modifiable par les autres |
| Seconds comptes root | `awk -F: '$3 == 0 {print $1}' /etc/passwd` | Les supprimer |
| Secrets dans des fichiers | `grep -rl password /etc /opt` | Les déplacer vers un gestionnaire de secrets |
| Correctifs manquants | `apt list --upgradable` | Corriger le noyau et les programmes setuid |

Un tableau de commandes n'aide qu'une fois que vous savez lire ce qu'elles affichent. Prenez-en trois.

**`sudo -l`** liste ce que l'utilisateur courant peut lancer en tant que quelqu'un d'autre :

```
User sam may run the following commands on web1:
    (root) /usr/bin/systemctl restart nginx
    (root) NOPASSWD: /usr/bin/vim /etc/hosts
    (ALL : ALL) ALL
```

Les parenthèses disent sous quel compte la commande s'exécute, et ce qui suit est la commande autorisée. La première ligne est une bonne règle : une commande exacte. La deuxième paraît étroite et ne l'est pas, comme l'explique la question plus bas. La troisième signifie « n'importe quoi, en tant que n'importe qui », et elle est réservée aux administrateurs.

**La recherche SUID** affiche des chemins. Sur un Ubuntu neuf, il y en a une douzaine environ, tous dans des dossiers système : `passwd`, `sudo`, `su`, `mount` et leurs proches. Apprenez cette liste sur une machine propre, car le constat est tout ce qui n'y figure pas. Regardez de plus près avec `ls -l` :

```
-rwsr-xr-x 1 root root 59976 Feb  6  2024 /usr/bin/passwd
```

Le `s` à la place du `x` du propriétaire est le bit SUID : quel que soit celui qui lance ce fichier, il s'exécute sous son propriétaire, root. Pour `passwd`, c'est voulu, puisqu'il doit modifier un fichier que seul root peut écrire. Les mêmes lettres sur un fichier de `/home`, `/tmp` ou `/opt` demandent une explication aujourd'hui même.

**Le contrôle des UID** lit `/etc/passwd`, où le troisième champ est le numéro de l'utilisateur. Seul `root` devrait avoir 0, car le noyau traite tout compte d'UID 0 comme root, quel que soit son nom. C'est le plus simple de ces contrôles à écrire vous-même.

@code uid-zero-accounts

Les règles sudo sont du texte de forme régulière, donc les motifs dangereux peuvent être recherchés.

@code risky-sudo-rule

Et la chaîne de permissions de `ls -l` vous dit, à une position fixe, si tout le monde peut écrire dans un fichier.

@code world-writable

Une règle sudo pour un programme d'apparence inoffensive peut valoir un accès root complet, car beaucoup de programmes peuvent lancer un shell ou écrire des fichiers. [GTFOBins](https://gtfobins.org/) les documente, et les défenseurs s'en servent pour revoir leurs règles.

@range audit

?? Une règle sudo permet à un utilisateur du support de lancer un éditeur de texte en root. Pourquoi est-ce dangereux ?
+ Un éditeur ouvre tout fichier, et lance des commandes
- Un éditeur utilise beaucoup trop de mémoire en root
- Sudo ne lance que des programmes écrits en Python
- Le support n'a pas le droit d'utiliser un éditeur
=> Sudo donne au programme le pouvoir de root, et beaucoup de programmes font bien plus qu'ils n'en ont l'air. Revoyez les règles dans cet esprit.

## La liste de contrôle Windows

La même idée, avec d'autres noms.

| Contrôle | Ce qu'il faut chercher | Correctif |
|---|---|---|
| Permissions des services | Des utilisateurs ordinaires peuvent-ils modifier un service ou son programme ? | Corriger les ACL |
| Chemins de service sans guillemets | Un chemin avec des espaces et sans guillemets | Mettre le chemin entre guillemets |
| Administrateur local partout | Un seul mot de passe local partagé | LAPS en donne un propre à chaque machine |
| Administrateurs connectés à des postes de travail | Leurs identifiants restent en mémoire à cet endroit | Les niveaux |
| Identifiants en mémoire | LSASS peut être lu | Credential Guard, et la protection LSA |
| Secrets stockés | Des mots de passe dans des scripts ou des partages | Les retirer et les renouveler |

Les deux premières lignes se vérifient depuis PowerShell sur les machines de votre propre labo :

```powershell
Get-CimInstance Win32_Service |
  Where-Object { $_.PathName -notlike '"*' -and $_.PathName -like '* *' } |
  Select-Object Name, StartName, PathName

icacls "C:\Program Files\Acme Tools\agent.exe"
Get-LocalGroupMember Administrators
```

La première commande liste les services dont le chemin contient une espace et ne commence pas par un guillemet. Beaucoup sont des chemins sans danger suivis d'arguments, donc lisez chacun : le cas risqué est une espace dans les noms de dossiers eux-mêmes, comme `C:\Program Files\Acme Tools\agent.exe`. Sans guillemets, Windows essaie d'abord `C:\Program.exe`, puis `C:\Program Files\Acme.exe`, et lance le premier qui existe. Le correctif est une paire de guillemets autour du chemin.

`icacls` répond à l'autre question, celle de savoir qui peut modifier le fichier. `(F)` est le contrôle total, `(M)` la modification et `(RX)` la lecture et l'exécution. `BUILTIN\Users:(M)` sur un programme qui tourne sous `SYSTEM` est le jumeau Windows du script en mode 777.

@code unquoted-service-path

Les **niveaux** comptent le plus. Si un Admin du domaine n'ouvre jamais de session sur un portable ordinaire, voler la mémoire de ce portable ne donnera pas les droits d'Admin du domaine à un attaquant.

?? Pourquoi LAPS ralentit-il un attaquant qui compromet un portable ?
+ Le mot de passe administrateur local diffère sur chaque machine
- Il supprime complètement le compte d'administrateur local de la machine
- Il chiffre absolument tous les fichiers présents sur le portable
- Il bloque toute forme de connexion réseau sortante du poste
=> Sans lui, un seul mot de passe local peut ouvrir toutes les machines. Avec lui, un mot de passe volé n'en ouvre qu'une.

## Active Directory : à quoi cela ressemble dans les journaux

Vous les avez étudiées au mois 7. Voici le résumé du défenseur, c'est-à-dire ce que le livrable du mois 10 vous demande de détecter dans votre propre labo.

| Technique | En clair | Signe révélateur | Prévention |
|---|---|---|---|
| Kerberoasting | Demander des tickets de service pour les casser hors ligne | 4769 avec `0x17` | gMSA, mots de passe longs, AES |
| AS-REP roasting | Abuser des comptes sans pré-authentification | 4768 avec un type de pré-authentification 0 | Exiger la pré-authentification |
| Abus d'ACL | Utiliser un droit délégué pour prendre le contrôle d'un objet | 5136, ou 4738 | Auditer avec BloodHound |
| Accès à LSASS | Lire des identifiants dans la mémoire | Sysmon 10 visant `lsass.exe` | Credential Guard |
| DCSync | Demander des données de mots de passe comme un contrôleur de domaine | 4662 avec des droits de réplication, depuis une machine qui n'est pas un DC | Limiter les droits de réplication |

La [machine Keystone](/machines/keystone/) vous fait suivre l'une de ces chaînes à travers les événements.

?? L'événement 4662 montre des droits de réplication utilisés par le compte d'un poste de travail ordinaire. Pourquoi est-ce alarmant ?
+ Seuls les contrôleurs de domaine devraient normalement répliquer des données
- Les postes de travail devraient répliquer des données en continu
- Cela prouve qu'un pilote d'imprimante vient tout juste d'être installé
- Cela veut seulement dire qu'un fond d'écran a été changé
=> Une réplication depuis une machine qui n'est pas un DC peut signifier un DCSync, qui livre à un attaquant les éléments de mots de passe du domaine.

## Faites-en une habitude

Un audit lancé une seule fois se périme. Scriptez ces contrôles, comme vous l'avez fait au mois 3, lancez-les à intervalles réguliers, et comparez avec le dernier résultat. Tout nouveau fichier SUID, toute nouvelle règle sudo ou tout nouvel administrateur local est soit un changement que quelqu'un sait expliquer, soit un incident.

Sous Linux, toute l'habitude tient en trois lignes. Enregistrez la liste du jour sous la date du jour, et comparez-la à la précédente :

```
sudo find / -perm -4000 -type f 2>/dev/null | sort > suid-$(date +%F).txt
comm -13 suid-2026-11-08.txt suid-2026-11-15.txt       les lignes présentes seulement dans le nouveau fichier
comm -23 suid-2026-11-08.txt suid-2026-11-15.txt       les lignes présentes seulement dans l'ancien
```

`comm` compare deux fichiers triés. Un résultat vide est la réponse que vous voulez. Toute ligne qu'il affiche est un programme SUID apparu ou disparu en une semaine, et quelqu'un devrait pouvoir dire pourquoi. Les trois mêmes lignes fonctionnent pour les règles sudo, pour les membres du groupe `sudo` et pour les ports en écoute.

@code audit-diff

?? Qu'est-ce qui donne plus de valeur à un audit des privilèges avec le temps ?
+ Comparer automatiquement les résultats avec ceux de la dernière fois
- Imprimer la sortie et la ranger dans un classeur fermé
- Le lancer tous les dix ans sur un unique serveur
- Garder les résultats bien secrets, loin de toute l'équipe d'administration
=> Le changement entre deux exécutions est le signal. Un nouveau fichier SUID que personne ne sait expliquer mérite de l'attention.

## Lire un audit

Trois résultats de l'exécution de cette semaine sur un serveur dont vous avez la charge. Décidez ce que chacun signifie avant de lire les choix.

```
-rwsr-xr-x 1 root root 16384 Nov 12 03:14 /home/sam/.cache/helper
```

?? Que vous dit cette ligne de la recherche SUID ?
+ Un programme SUID de root chez un utilisateur
- Un outil système normal à sa place habituelle
- Un simple fichier texte que chacun peut lire
- Un dossier qui appartient à l'utilisateur root lui-même
=> Rien dans un dossier personnel ne devrait s'exécuter en root. Le dossier caché et l'heure, trois heures du matin, en font plus qu'une erreur : traitez-le comme un incident.

```
$ comm -13 suid-2026-11-08.txt suid-2026-11-15.txt
/usr/local/bin/backup-helper
```

?? Quelle est la bonne étape suivante ?
+ Demander qui l'a installé, et vérifier le registre
- Le supprimer aussitôt, sans en parler à personne
- L'ignorer, puisque son nom paraît vraiment bien inoffensif
- L'ajouter à la liste de référence, puis l'oublier
=> Il est apparu cette semaine. Soit un collègue peut montrer le changement qui l'a ajouté, soit personne ne le peut, et alors c'est quelque chose à examiner.

```
C:\Program Files\Acme Tools\agent.exe BUILTIN\Users:(M)
```

?? Ce fichier est le programme d'un service qui tourne sous `SYSTEM`. Que peut faire un utilisateur ordinaire ?
+ Remplacer le programme que `SYSTEM` va exécuter
- Lire le programme, mais jamais le modifier
- Empêcher complètement Windows de démarrer tout court
- Rien, car le service est bien signé
=> `(M)` est la modification. Celui qui peut changer le fichier décide de ce qui s'exécute avec les droits les plus élevés au prochain redémarrage. Retirez la permission, et vérifiez si le fichier a déjà été altéré.

?! Rédigez votre propre liste de contrôle d'audit des privilèges sous Linux : dix contrôles, chacun avec une commande, et ce à quoi ressemble un mauvais résultat.

### Pour aller plus loin

Les sources primaires et le meilleur matériel gratuit sur ce sujet, tous vérifiés en novembre 2026 (en anglais) :

- [GTFOBins : les binaires Unix qui peuvent être détournés, pour les auditer](https://gtfobins.github.io/)
- [LOLBAS : l'équivalent pour Windows](https://lolbas-project.github.io/)
- [MITRE ATT&CK, tactique Privilege Escalation](https://attack.mitre.org/tactics/TA0004/)
