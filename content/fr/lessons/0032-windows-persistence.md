---
title: La persistance sous Windows
summary: Les endroits où un malware se cache pour survivre à un redémarrage, et comment vérifier chacun. Vous en poserez une vous-même, puis vous la traquerez.
builds: citer au moins 8 emplacements de persistance et comment vérifier chacun
source: MITRE ATT&CK, tactique Persistance (en anglais) | https://attack.mitre.org/tactics/TA0003/
words: persistance, démarrage automatique, usurpation de nom
---
Un attaquant qui est entré une fois ne veut pas recommencer. Il s'arrange donc pour revenir automatiquement, et c'est la **persistance**. Chaque méthode laisse une trace à un endroit connu, ce qui en fait une chasse que vous pouvez gagner.

@term persistance = Garder l'accès à un système malgré les redémarrages et les fermetures de session.
@term démarrage automatique = Tout mécanisme qui lance un programme automatiquement.
@term usurpation de nom = Nommer des fichiers malveillants pour qu'ils aient l'air légitimes.
@term abonnement WMI = Une règle WMI qui exécute une action quand un événement se produit, utilisable pour une persistance discrète.

## Les huit endroits à connaître

| # | Emplacement | Comment vérifier | ATT&CK |
|---|---|---|---|
| 1 | **Clés Run** : `HKLM` et `HKCU\...\CurrentVersion\Run` | Autoruns, `reg query` | [T1547.001](https://attack.mitre.org/techniques/T1547/001/) |
| 2 | **Dossier Démarrage** | Autoruns, `shell:startup` | T1547.001 |
| 3 | **Services** | `sc query`, événement 7045 | [T1543.003](https://attack.mitre.org/techniques/T1543/003/) |
| 4 | **Tâches planifiées** | `schtasks /query`, Autoruns | [T1053.005](https://attack.mitre.org/techniques/T1053/005/) |
| 5 | **Abonnements aux événements WMI** | Autoruns (onglet WMI) | [T1546.003](https://attack.mitre.org/techniques/T1546/003/) |
| 6 | **Assistants Winlogon** | Autoruns | [T1547.004](https://attack.mitre.org/techniques/T1547/004/) |
| 7 | **Détournement de l'ordre de recherche des DLL** | Autoruns, Sysmon ID 7 | [T1574.001](https://attack.mitre.org/techniques/T1574/001/) |
| 8 | **Nouveaux comptes locaux** | `net user`, événement 4720 | [T1136.001](https://attack.mitre.org/techniques/T1136/001/) |

Autoruns réunit la plupart de ces endroits dans une seule fenêtre, c'est donc votre premier outil. Cochez **Hide Microsoft Entries** pour réduire le bruit, et cherchez les signatures manquantes et les chemins inhabituels.

Un tableau se mémorise facilement et s'utilise difficilement, donc voici chaque endroit à nouveau, avec la commande qui le lit et ce que montre une machine saine. Lancez chacune sur votre propre VM maintenant : vous ne pouvez pas reconnaître « bizarre » avant d'avoir vu « normal ».

**1 et 2. Les clés Run et le dossier Démarrage.** Les programmes listés ici démarrent quand un utilisateur ouvre une session.

```
reg query "HKLM\Software\Microsoft\Windows\CurrentVersion\Run"
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Run"
dir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
dir "C:\ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp"
```

Normal : une poignée de programmes signés d'éditeurs dans les clés, et en général rien du tout dans les deux dossiers.

**3. Les services.** Démarrés au lancement de la machine, en général sous `SYSTEM`.

```powershell
Get-CimInstance Win32_Service | Select-Object Name, StartMode, StartName, PathName
```

Normal : chaque `PathName` pointe dans `C:\Windows` ou `C:\Program Files`.

**4. Les tâches planifiées.** Démarrées par une heure ou un événement.

```
schtasks /query /tn "Updater" /v /fo LIST
```

Les lignes à lire sont `Task To Run`, `Run As User` et `Schedule Type`. Normal : des centaines de tâches sous `\Microsoft\Windows\`, et très peu au premier niveau.

**5. Les abonnements aux événements WMI.** Une règle rangée dans Windows lui-même : « quand cet événement se produit, exécute ceci ». Il n'y a ni fichier dans un dossier de démarrage ni valeur Run dans le registre, et c'est pourquoi ce moyen est apprécié pour rester caché.

```powershell
Get-CimInstance -Namespace root/subscription -ClassName __EventConsumer
```

Normal : une seule entrée nommée `SCM Event Log Consumer`. Tout le reste demande une explication.

**6. Les assistants Winlogon.** Deux valeurs du registre nomment les programmes que Windows lance à chaque ouverture de session.

```
reg query "HKLM\Software\Microsoft\Windows NT\CurrentVersion\Winlogon"
```

Normal : `Shell` vaut exactement `explorer.exe`, et `Userinit` vaut exactement `C:\Windows\system32\userinit.exe,` sans rien après la virgule.

**7. Le détournement de l'ordre de recherche des DLL.** Aucun réglage à lire : cherchez une DLL posée à côté d'un programme qui la charge normalement depuis `System32`. L'événement Sysmon 7 et le contrôle du chemin vu à la leçon 30 la trouvent.

**8. Les nouveaux comptes locaux.** Le moyen le plus simple de revenir est d'avoir son propre compte.

```powershell
Get-LocalUser | Select-Object Name, Enabled, LastLogon
Get-LocalGroupMember Administrators
```

Normal : vous savez nommer chaque compte, et dire pourquoi chaque membre du groupe Administrateurs s'y trouve.

?? Vous ouvrez Autoruns sur un hôte suspect. Quel est le premier geste le plus efficace ?
+ Masquer les entrées Microsoft, puis voir les non signées
- Supprimer aussitôt tout ce qui n'est pas de Microsoft
- Lire absolument chaque entrée, une à une, jusqu'en bas
- Redémarrer, pour que tous les malwares se montrent enfin
=> Le filtrage place les entrées inhabituelles sous vos yeux. Ne supprimez jamais avant d'avoir consigné les preuves.

## La chasse, pas à pas

::: try Posez-la, puis trouvez-la (un instantané d'abord)
Sur votre propre VM Windows :

```
reg add HKCU\Software\Microsoft\Windows\CurrentVersion\Run /v Updater /t REG_SZ /d "C:\Windows\System32\notepad.exe"
schtasks /create /tn "Updater" /tr notepad.exe /sc onlogon
```

Mettez maintenant votre casquette de défenseur. Trouvez les deux dans Autoruns, notez le chemin et le nom exacts, puis supprimez-les et confirmez qu'ils ont disparu :

```
reg delete HKCU\Software\Microsoft\Windows\CurrentVersion\Run /v Updater /f
schtasks /delete /tn "Updater" /f
```
:::

Le Bloc-notes est inoffensif, mais le mécanisme est réel. C'est ce que la feuille de route entend par créer volontairement de la persistance.

Pendant que les deux entrées sont en place, regardez ce que la machine a enregistré de vos propres actions. Chaque mécanisme a un événement qui dit « ceci a été créé » :

| Vous avez créé | Enregistré sous |
|---|---|
| Une valeur de clé Run | Sysmon 13, valeur de registre définie, avec la clé, la donnée et le processus qui l'a écrite |
| Un fichier dans le dossier Démarrage | Sysmon 11, fichier créé |
| Un service | 7045 dans le journal Système, 4697 dans le journal Sécurité |
| Une tâche planifiée | 4698 dans le journal Sécurité, si l'audit de l'accès aux objets est activé |
| Un abonnement WMI | Sysmon 19, 20 et 21 |
| Un compte local | 4720 dans le journal Sécurité, et 4732 quand il rejoint un groupe |

Sysmon 1 a aussi enregistré le démarrage de `reg.exe` et de `schtasks.exe`, avec vos lignes de commande complètes. Un défenseur a donc deux chances : l'entrée elle-même, et l'acte de sa création. Vous installerez Sysmon dans la prochaine leçon et pourrez revenir lire ces événements.

?? Pourquoi poser vous-même une persistance inoffensive ?
+ Vous apprenez exactement ce qu'elle laisse
- Cela rend la machine plus rapide
- Windows l'exige une fois par mois
- Cela retire tout vrai malware présent
=> Le faire une fois vous apprend quoi chercher, d'une façon que la lecture ne permet pas.

## Ce qui rend une entrée suspecte

- Elle s'exécute depuis un chemin où l'utilisateur peut écrire : `AppData`, `Temp`, `ProgramData`, `Public`.
- Elle n'est pas signée, ou l'éditeur est vide.
- Son nom est presque juste (`svch0st`, `OneDriveUpdate.exe` dans le mauvais dossier).
- Elle lance un hôte de scripts : `powershell.exe`, `wscript.exe`, `mshta.exe`, avec des arguments longs ou encodés.
- Elle a été créée juste avant l'alerte.

?? Quelle valeur de clé Run mérite le premier coup d'œil ?
+ `powershell -enc SQBFAFgA...`, dans la clé d'un utilisateur
- Un programme signé d'un éditeur, dans `Program Files`
- `OneDrive.exe` lancé depuis son dossier d'installation bien normal
- Un agent de sécurité signé, dans `Program Files`
=> Une commande PowerShell encodée à l'ouverture de session est un signal fort. Les commandes encodées ne sont pas toujours malveillantes, mais c'est la première chose à décoder.

## Un état de référence vaut mieux qu'une bonne mémoire

Personne ne se souvient de ce que devrait être chaque entrée de démarrage automatique d'une machine. Les professionnels n'essaient pas : ils enregistrent la liste tant que la machine est réputée saine, et plus tard ils comparent. Autoruns a un jumeau en ligne de commande, `autorunsc`, fait pour cela :

```
autorunsc.exe -accepteula -a * -c -h -s > baseline.csv
```

| Option | Signification |
|---|---|
| `-a *` | Toutes les catégories de démarrage automatique, pas seulement les entrées d'ouverture de session |
| `-c` | Sortie en CSV, une entrée par ligne |
| `-h` | Ajouter l'empreinte de chaque fichier |
| `-s` | Vérifier la signature de chaque fichier |

Relancez-le plus tard vers `today.csv`, et laissez PowerShell ne montrer que ce qui a changé :

```powershell
Compare-Object (Get-Content baseline.csv) (Get-Content today.csv)
```

Les lignes marquées `=>` n'existent que dans le nouveau fichier. Sur une machine où rien n'a été installé, il ne devrait y en avoir aucune. Une seule nouvelle ligne non signée, et toute l'enquête vous est servie.

Quand vous trouvez quelque chose, l'ordre de vos actions compte plus que leur vitesse :

1. **Consignez** l'entrée exactement : nom, chemin, ligne de commande, empreinte, et le moment de sa création.
2. **Supprimez**-la, et confirmez avec la commande même qui l'a trouvée.
3. **Expliquez**-la : la persistance est la deuxième étape d'une intrusion, demandez-vous donc quelle était la première.

?? La valeur Winlogon `Userinit` contient `C:\Windows\system32\userinit.exe,C:\Users\Public\svc.exe`. Qu'est-ce qui ne va pas ?
+ Un second programme suit après la virgule
- Le chemin de `userinit.exe` est mal orthographié
- La valeur devrait pointer vers `explorer.exe` seulement
- La valeur doit être vide par défaut
=> Le premier programme est le vrai, et c'est ce qui rend la chose facile à manquer. Tout ce qui figure dans la liste s'exécute à chaque ouverture de session.

?? Quel enregistrement vous dit qu'une tâche planifiée a été créée ?
+ L'événement 4698, dans le journal Sécurité
- L'événement 7045, dans le journal Système
- L'événement 4720, dans le journal Sécurité
- L'événement 4625, dans le journal Sécurité
=> 4698 est la création d'une tâche. 7045 est un nouveau service, 4720 un nouveau compte et 4625 un échec d'ouverture de session.

?? Vous trouvez une valeur Run qui lance un programme inconnu depuis `AppData`. Que faites-vous en premier ?
+ Noter son nom, sa donnée et ses dates
- Supprimer la valeur tout de suite, sans bruit
- Redémarrer la machine pour s'en débarrasser bien vite
- Réinstaller Windows depuis un tout nouveau support propre
=> Les preuves d'abord. Une fois l'entrée supprimée, vous ne pouvez plus prouver ce qu'elle était, quand elle est apparue ni ce qui l'a écrite.

::: job Réponse d'entretien
« Où chercheriez-vous de la persistance ? » Citez les clés Run, les services, les tâches planifiées et WMI, dites quel outil montre chacun, et dites quels identifiants d'événement les enregistrent. C'est une réponse de niveau 1 avec la profondeur du niveau 2.
:::

?! Sans regarder, listez autant d'emplacements de persistance que vous pouvez, avec la façon de vérifier chacun. Visez huit.
