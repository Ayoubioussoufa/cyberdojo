---
title: Windows vu de l'intérieur
summary: Services, registre, NTFS, utilisateurs et SID, jetons d'accès et UAC, vus à travers Sysinternals.
builds: expliquer les SID, les jetons, l'UAC et les services à un non-spécialiste, un point du livrable de fin de mois
source: Documentation de Sysinternals, Microsoft | https://learn.microsoft.com/fr-fr/sysinternals/
words: registre, SID, jeton d'accès
---
Il est temps de rencontrer Windows sur son propre terrain. Gardez une VM Windows ouverte : cette leçon se fait mieux avec les outils sous les yeux.

@term registre = La base de données hiérarchique centrale de Windows pour les réglages du système et des utilisateurs.
@term ruche = Une section de premier niveau du registre, stockée dans un fichier sur le disque.
@term NTFS = Le système de fichiers standard de Windows.
@term ADS (flux de données alternatif) = Un flux de données supplémentaire et caché, attaché à un fichier NTFS.
@term SID (identifiant de sécurité) = L'identifiant unique que Windows utilise pour un utilisateur ou un groupe.
@term jeton d'accès = L'objet qui décrit l'identité et les privilèges d'un processus.
@term UAC (contrôle de compte d'utilisateur) = L'invite de Windows qui sépare les droits ordinaires des droits d'administrateur.
@term Sysinternals = La suite gratuite de Microsoft d'outils de diagnostic avancés pour Windows.
@term WMI = *Windows Management Instrumentation* : un système pour interroger et gérer Windows.
@term tâche planifiée = Un travail Windows qui s'exécute à une heure ou sur un événement donnés.

## Mise en place

::: try Vos VM Windows
Téléchargez les images d'évaluation gratuites de [Windows 11 Entreprise](https://www.microsoft.com/en-us/evalcenter/evaluate-windows-11-enterprise) et de [Windows Server](https://www.microsoft.com/en-us/evalcenter/). Donnez à chacune 4 Go de mémoire vive et une carte réseau privée hôte, prenez un instantané, puis récupérez la [suite Sysinternals](https://learn.microsoft.com/fr-fr/sysinternals/downloads/sysinternals-suite).
:::

| Outil | Sert à voir |
|---|---|
| Process Explorer | L'arbre des processus, les parents, les DLL chargées, les signatures |
| Autoruns | Tout ce qui démarre automatiquement |
| Procmon | Chaque événement de fichier, de registre et de processus, en direct |
| TCPView | Les connexions réseau par processus |

Aucun de ces outils ne demande d'installation : décompressez la suite et lancez l'outil. Commencez par Process Explorer, car il remplace le Gestionnaire des tâches pour tout ce qui suit. Faites un clic droit sur son en-tête de colonnes, choisissez **Select Columns**, et ajoutez **Image Path**, **Command Line**, **User Name** et **Verified Signer**. Utilisez ensuite **Options → Verify Image Signatures**. Vous voyez maintenant, pour chaque processus, où se trouve son fichier, comment il a été lancé, sous quel compte il tourne, et si un éditeur connu l'a signé. Ces quatre faits répondent à la plupart des questions qu'un analyste pose sur un processus.

?? Quel outil montre ce qui démarre automatiquement sous Windows ?
+ Autoruns, qui liste les éléments de démarrage
- TCPView, qui liste les connexions du réseau
- Procmon, qui enregistre les événements en direct
- Le Bloc-notes, qui modifie du texte brut
=> Autoruns est votre premier arrêt quand vous chassez la persistance.

## Des processus qui doivent avoir une certaine allure

Windows a un arbre prévisible, et les malwares l'imitent souvent. `services.exe` démarre les services, `svchost.exe` les héberge, et `lsass.exe` gère les connexions et détient des éléments d'authentification. Chaque processus système normal a un parent, un emplacement et un nombre attendus.

| Signal d'alerte | Pourquoi |
|---|---|
| `svchost.exe` lancé depuis `C:\Users\...` | Le vrai est dans `System32` |
| `lsass.exe` avec un processus enfant | Lsass ne lance pas de programmes |
| `scvhost.exe` | Un imposteur au nom mal orthographié |

« Attendu » est quelque chose qui s'écrit. Voici les parents habituels des processus centraux sur une machine saine :

| Processus | Parent normal | Emplacement normal |
|---|---|---|
| `wininit.exe` | Aucun affiché : son parent s'est terminé | `C:\Windows\System32` |
| `services.exe` | `wininit.exe` | `C:\Windows\System32` |
| `lsass.exe` | `wininit.exe` | `C:\Windows\System32` |
| `svchost.exe` | `services.exe` | `C:\Windows\System32` |
| `explorer.exe` | Aucun affiché : son parent s'est terminé | `C:\Windows` |

Un vrai `svchost.exe` est aussi toujours lancé avec une option `-k` qui nomme le groupe de services qu'il héberge. Un `svchost.exe` sans `-k` sur sa ligne de commande n'héberge rien.

PowerShell vous donne la même vue sous forme de texte, que vous pouvez enregistrer et comparer plus tard :

```powershell
Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name, ExecutablePath
Get-AuthenticodeSignature C:\Windows\System32\svchost.exe
```

La première ligne liste chaque processus avec l'identifiant de son parent et le chemin de son fichier. La seconde vérifie la signature d'un fichier : `Status` doit indiquer `Valid`, et le signataire doit être Microsoft Windows.

L'[affiche Hunt Evil](https://www.sans.org/posters/hunt-evil/) du SANS (en anglais) en dresse la liste. Imprimez-la.

?? Lequel de ces éléments est un signal d'alerte ?
+ `svchost.exe` lancé depuis le dossier d'un utilisateur
- `svchost.exe` lancé depuis le dossier `System32` habituel
- `lsass.exe` présent une fois sur la machine
- `services.exe` qui démarre un service Windows normal
=> Le vrai se trouve dans `System32`. L'emplacement trahit beaucoup d'imposteurs.

## Services et tâches planifiées

Un **service** est un programme en arrière-plan, qui tourne souvent sous le très puissant compte `SYSTEM`. Une **tâche planifiée** s'exécute à une heure ou sur un événement. Les deux sont des endroits favoris pour la persistance, et les deux sont journalisés à leur création.

Regardez les deux depuis la ligne de commande. `sc.exe qc` demande la configuration d'un service :

```
> sc.exe qc Spooler
SERVICE_NAME: Spooler
        START_TYPE         : 2   AUTO_START
        BINARY_PATH_NAME   : C:\Windows\System32\spoolsv.exe
        SERVICE_START_NAME : LocalSystem
```

Trois lignes portent l'histoire : il démarre automatiquement au lancement de la machine, voici le programme qu'il exécute, et `LocalSystem` signifie qu'il tourne sous `SYSTEM`. Pour tout service que vous ne reconnaissez pas, vérifiez que le programme est dans un dossier Windows ou Program Files et qu'il est signé.

```powershell
Get-Service | Where-Object Status -eq Running          # les services en marche
Get-ScheduledTask | Where-Object State -eq Ready       # les tâches qui attendent leur déclencheur
```

Créer l'un ou l'autre laisse une trace, et ces trois identifiants d'événement valent d'être appris dès maintenant : **7045** dans le journal Système dit qu'un service a été installé, **4697** dans le journal Sécurité dit la même chose avec plus de détails, et **4698** dit qu'une tâche planifiée a été créée.

?? Pourquoi les attaquants aiment-ils les services Windows ?
+ Ils tournent souvent sous le puissant `SYSTEM`
- Ils ne peuvent être vus par personne
- Ils ne tournent que sur machines Linux
- Ils effacent tous les journaux tout seuls
=> Un service survit aux redémarrages, et il a souvent les droits les plus élevés. Il est aussi journalisé à sa création.

## Le registre

Le **registre** est la base de données des réglages de Windows, organisée en **ruches**, un peu comme `/etc` sous la forme d'un seul grand arbre :

| Ruche | Contient |
|---|---|
| `HKLM` | Les réglages de toute la machine |
| `HKCU` | Les réglages de l'utilisateur courant |

Les valeurs sous `...\CurrentVersion\Run` lancent des programmes à l'ouverture de session, ce qui en fait un emplacement classique de persistance. Vous les traquerez dans la prochaine leçon.

Le registre a ses trois mots à lui. Une **clé** ressemble à un dossier, une **valeur** est un réglage nommé à l'intérieur d'une clé, et la **donnée** est ce que la valeur contient. Ouvrez `regedit` pour le parcourir, ou lisez une clé depuis la ligne de commande :

```
> reg query "HKLM\Software\Microsoft\Windows\CurrentVersion\Run"
    SecurityHealth    REG_EXPAND_SZ    %windir%\system32\SecurityHealthSystray.exe
```

Voilà une valeur, nommée `SecurityHealth`, dont la donnée est le chemin d'un programme. Windows lance chaque programme listé dans cette clé quand n'importe quel utilisateur ouvre une session. La même clé existe sous `HKCU` pour l'utilisateur courant seulement, et un utilisateur ordinaire peut y écrire sans droits d'administrateur, ce qui est exactement la raison pour laquelle les attaquants s'en servent.

?? Que contient `HKLM` ?
+ Les réglages de toute la machine
- Les réglages d'un seul utilisateur précis
- Un dossier de journaux du système
- Une liste complète des ports ouverts
=> `HKCU` contient les réglages de l'utilisateur courant.

## NTFS

En plus de ce qu'a Linux, NTFS a une table de fichiers maîtresse (la **MFT**) qui consigne chaque fichier, et des **flux de données alternatifs** : des données supplémentaires attachées à un fichier que l'Explorateur ne montre pas. Windows en utilise un pour marquer les fichiers téléchargés comme venant d'Internet, et les attaquants peuvent y cacher des données. Vous reverrez les deux au mois 15.

Vous pouvez voir un flux par vous-même. Téléchargez un fichier quelconque avec un navigateur, puis dans PowerShell :

```
> Get-Item .\setup.exe -Stream *
Stream : :$DATA
Stream : Zone.Identifier

> Get-Content .\setup.exe -Stream Zone.Identifier
[ZoneTransfer]
ZoneId=3
```

`:$DATA` est le contenu normal du fichier. `Zone.Identifier` est le flux supplémentaire, et la zone 3 signifie Internet. Ce marqueur s'appelle la **marque du Web** (*Mark of the Web*), et c'est la raison pour laquelle Windows vous avertit avant de lancer un programme téléchargé. Pour un enquêteur, c'est une preuve de la provenance d'un fichier.

Les permissions NTFS sont plus riches que les neuf bits de Linux. `icacls` les affiche :

```
> icacls C:\Tools
C:\Tools BUILTIN\Administrators:(OI)(CI)(F)
         BUILTIN\Users:(OI)(CI)(RX)
```

Chaque ligne dit « qui, puis quoi » : `F` est le contrôle total, `M` la modification, `RX` la lecture et l'exécution, `W` l'écriture. `(OI)(CI)` signifie que les fichiers et les dossiers à l'intérieur héritent de l'entrée. La question à poser est celle de Linux : qui peut écrire ici ? Un dossier que `Users` peut modifier, contenant un programme que `SYSTEM` exécute, est la version Windows du script cron en mode 777.

?? Qu'est-ce qu'un flux de données alternatif ?
+ Des données supplémentaires attachées à un fichier
- Une seconde copie complète de Windows lui-même
- Une connexion réseau établie entre deux dossiers
- Un journal de tous les fichiers supprimés
=> L'Explorateur ne les montre pas, c'est donc un endroit où cacher des choses.

## Identité : SID et jetons

Windows, comme Linux, pense en nombres. Chaque utilisateur et chaque groupe a un **SID** :

```
> whoami /user
S-1-5-21-1004336348-1177238915-682003330-1001
```

La dernière partie est l'identifiant relatif : 500 est l'Administrateur intégré, et à partir de 1000 ce sont les utilisateurs normaux. Quand vous ouvrez une session, Windows construit un **jeton d'accès** qui liste votre SID, vos groupes et vos privilèges. Chaque processus que vous lancez en porte une copie.

Un SID se lit de gauche à droite. `S-1-5-21` dit « un compte sur une machine ou un domaine », les trois longs nombres identifient cette machine ou ce domaine, et le dernier nombre est le compte. Quelques SID sont les mêmes sur tous les systèmes Windows, et vous les verrez sans cesse dans les journaux :

| SID | Qui |
|---|---|
| `S-1-5-18` | `SYSTEM`, le système d'exploitation lui-même |
| `S-1-5-32-544` | Le groupe local Administrateurs |
| `S-1-1-0` | Tout le monde |
| se termine par `-500` | Le compte Administrateur intégré |

Les journaux consignent souvent le SID et non le nom, car un nom peut être changé et un SID non.

@flow Vous ouvrez une session > Jeton créé > Votre processus porte le jeton > Le noyau le vérifie à chaque accès

C'est exactement le contrôle de Linux, avec un jeton à la place d'un UID. Les attaquants qui volent ou dupliquent un jeton deviennent cet utilisateur, sans connaître le mot de passe. Voyez le vôtre avec `whoami /all`.

?? Un attaquant duplique un jeton depuis le processus en cours d'un administrateur. Que gagne-t-il ?
+ Il agit comme cet administrateur, sans mot de passe
- Il apprend en clair le mot de passe administrateur
- Il supprime le compte administrateur de la machine visée
- Rien, car les jetons ne servent qu'à la connexion
=> Le jeton est l'identité. C'est pourquoi les sessions d'administrateur laissées sur des postes de travail sont si dangereuses.

## UAC

Un administrateur qui ouvre une session reçoit deux jetons : un jeton filtré pour le travail quotidien et un jeton complet. L'**UAC** est l'invite qui fait passer de l'un à l'autre. Elle réduit les accidents, et c'est une commodité plutôt qu'une garantie : [Microsoft ne considère pas l'UAC comme une frontière de sécurité](https://www.microsoft.com/en-us/msrc/windows-security-servicing-criteria) (en anglais).

Observez vous-même les deux jetons. Ouvrez PowerShell normalement et lancez la première commande, puis rouvrez-le avec **Exécuter en tant qu'administrateur** et recommencez :

```
> whoami /groups | findstr Mandatory
Mandatory Label\Medium Mandatory Level

> whoami /groups | findstr Mandatory
Mandatory Label\High Mandatory Level
```

Même utilisateur, même mot de passe, deux jetons différents. « Medium » est le jeton filtré pour le travail quotidien, et « High » est le jeton complet. `whoami /priv` dans chaque fenêtre montre aussi la liste des privilèges qui s'allonge.

?? Quel est le constat le plus suspect ?
+ `svchost.exe` lancé depuis un dossier temporaire
- `svchost.exe` lancé plusieurs fois depuis `System32`
- `explorer.exe` lancé sous le compte connecté
- `services.exe` lancé sous son parent `wininit.exe`
=> Plusieurs processus `svchost.exe` sont normaux, tout comme `services.exe` sous `wininit.exe`. Le bon nom dans le mauvais dossier est une usurpation classique.

## Lire une machine comme un analyste

Trois extraits de sortie d'un poste de travail. Pour chacun, décidez ce qu'il signifie avant de regarder les choix.

```
SERVICE_NAME: WinUpdaterSvc
        START_TYPE         : 2   AUTO_START
        BINARY_PATH_NAME   : C:\Users\Public\updater.exe
        SERVICE_START_NAME : LocalSystem
```

?? Qu'est-ce qui fait de ce service un constat ?
+ Un fichier remplaçable par tous tourne en `SYSTEM`
- Un service est réglé pour démarrer au lancement
- Le nom du service contient le mot update
- Un programme est rangé sur le lecteur `C:`
=> N'importe quel utilisateur peut écrire dans `C:\Users\Public`, et le service exécute ce fichier avec les droits les plus élevés à chaque démarrage. Les vrais services se trouvent dans les dossiers Windows ou Program Files.

```
> Get-Content .\invoice.pdf.exe -Stream Zone.Identifier
[ZoneTransfer]
ZoneId=3
```

?? Que vous apprend ce flux sur le fichier ?
+ Il a été téléchargé depuis Internet
- Il a été analysé puis validé
- Il est signé par son éditeur
- Il a été créé ici même
=> La zone 3 est Internet : la marque du Web. Avec un nom qui se termine par `.pdf.exe`, elle vous dit comment un faux document est probablement arrivé.

?? Une fenêtre PowerShell affiche `High Mandatory Level` dans `whoami /groups`. Qu'est-ce que cela signifie ?
+ Le shell tourne en mode élevé, comme administrateur
- Le shell tourne dans un bac à sable
- L'utilisateur a un mot de passe très robuste
- La machine est bien jointe à un domaine
=> High est le jeton complet d'administrateur. Tout ce qui est lancé depuis cette fenêtre en hérite, et c'est pourquoi vous n'élevez vos droits que lorsqu'une tâche l'exige.

::: try Prenez un état de référence
1. Dans Process Explorer, trouvez `lsass.exe`, `services.exe` et trois processus `svchost.exe`. Notez le parent, le chemin et le signataire de chacun, et comparez-les au tableau ci-dessus.
2. Lancez `sc.exe qc` sur deux services que vous ne reconnaissez pas, et vérifiez où se trouvent leurs programmes.
3. Lisez les deux clés `Run`, dans `HKLM` et `HKCU`, et expliquez chaque valeur.
4. Téléchargez un fichier, puis lisez son flux `Zone.Identifier`.
5. Enregistrez la sortie de `whoami /all` depuis une fenêtre normale et une fenêtre élevée, et listez ce qui diffère.
:::

?! Expliquez SID, jeton, UAC et service à un non-spécialiste, en une phrase chacun.
