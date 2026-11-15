---
title: Les journaux Windows et Sysmon
summary: Les identifiants d'événement qui consignent ce qui s'est passé, comment déployer Sysmon, et comment produire puis retrouver des événements précis.
builds: Sysmon déployé avec une configuration documentée, et 5 événements retrouvés
source: Documentation de Sysmon, Microsoft | https://learn.microsoft.com/fr-fr/sysinternals/downloads/sysmon
words: identifiant d'événement, Sysmon, stratégie d'audit
---
Tout ce que vous avez vu dans les deux dernières leçons laisse une marque, si la journalisation est activée. Les journaux Windows sont la matière première du travail en SOC, et mémoriser les numéros clés est l'un des rares cas où apprendre par cœur est payant.

@term identifiant d'événement = Le nombre qui identifie un type d'entrée de journal Windows.
@term Observateur d'événements = L'application intégrée à Windows pour lire les journaux.
@term stratégie d'audit = Les réglages Windows qui décident quels événements de sécurité sont enregistrés.
@term Sysmon = Un outil gratuit de Microsoft qui journalise en détail l'activité des processus, du réseau et des fichiers.
@term EDR (détection et réponse sur les postes) = Un logiciel de sécurité qui enregistre l'activité des appareils et y répond.

## Le journal Sécurité

| ID | Signification | Pourquoi il vous intéresse |
|---|---|---|
| **4624** | Ouverture de session réussie | Qui, d'où, de quel type |
| **4625** | Échec d'ouverture de session | Devinette de mots de passe |
| **4634** | Fermeture de session | Fin de session |
| **4648** | Ouverture de session avec des identifiants explicites | `runas`, mouvement latéral |
| **4672** | Privilèges spéciaux attribués | Connexions d'administrateur |
| **4688** | Processus créé | Demande d'activer l'audit |
| **4697** | Service installé | Persistance |
| **4720** | Utilisateur créé | Persistance |
| **4732** | Ajout à un groupe local | Changement de privilèges |
| **1102** | Journal d'audit effacé | Effacement des traces |

Dans le journal Système, **7045** est un nouveau service. Côté PowerShell, **4104** est la journalisation des blocs de script, qui montre le script réellement exécuté.

Un événement est plus que son numéro. Ouvrez un 4624 dans l'Observateur d'événements (**Journaux Windows → Sécurité**, puis **Filtrer le journal actuel** et tapez l'identifiant) et vous trouverez un formulaire de dizaines de champs. Cinq d'entre eux répondent à la plupart des questions :

```
Event 4624: An account was successfully logged on.
    TargetUserName   : ana
    LogonType        : 10
    IpAddress        : 203.0.113.50
    WorkstationName  : DESKTOP-7Q2
    TargetLogonId    : 0x3E7A91
```

Qui a ouvert une session, comment, depuis quelle adresse, depuis quel nom de machine, et l'identifiant de la session créée. Ce dernier est le fil que vous tirez : chaque événement ultérieur de la même session, y compris la fermeture 4634, porte le même identifiant de session.

`LogonType` vous dit comment la personne est arrivée, et il change complètement le sens de l'événement :

| Type | Nom | Signifie |
|---|---|---|
| 2 | Interactive | Quelqu'un devant le clavier et l'écran |
| 3 | Network | Une connexion à un dossier partagé ou à un autre service réseau |
| 4 | Batch | Une tâche planifiée |
| 5 | Service | Un service qui démarre sous son compte |
| 7 | Unlock | L'écran a été déverrouillé |
| 10 | RemoteInteractive | Le Bureau à distance |

Des milliers d'ouvertures de session de type 3 et 5 par jour forment un bruit de fond normal. Une seule de type 10 depuis une adresse extérieure à l'entreprise ne l'est pas.

Ce qui est enregistré ou non est décidé par la **stratégie d'audit**. Affichez-la, et activez la création de processus, depuis une invite d'administrateur :

```
auditpol /get /category:*
auditpol /set /subcategory:"Process Creation" /success:enable
```

@drill event-ids

::: trap Tout n'est pas activé par défaut
La création de processus (4688) n'est pas journalisée par défaut, et elle ne montre pas les lignes de commande tant que vous ne les avez pas [activées](https://learn.microsoft.com/fr-fr/windows-server/identity/ad-ds/manage/component-updates/command-line-process-auditing). Un analyste qui suppose que le journal existe ne trouve rien et tire la mauvaise conclusion. « Aucune preuve » ne veut dire quelque chose que si les données étaient collectées.
:::

?? Vous trouvez 200 événements 4625 pour un compte, puis un 4624. Qu'est-ce que cela suggère ?
+ Une force brute qui a fini par entrer
- Un utilisateur qui se déconnecte de nombreuses fois
- Un administrateur qui efface tout le journal d'audit
- Un nouveau service qui vient d'être installé aujourd'hui
=> Beaucoup d'échecs d'ouverture de session suivis d'une réussite, c'est le schéma classique de la force brute.

## Pourquoi Sysmon

Les journaux par défaut disent qu'un processus a démarré. [Sysmon](https://learn.microsoft.com/fr-fr/sysinternals/downloads/sysmon) ajoute le détail dont les enquêteurs ont besoin, dont la ligne de commande complète, l'empreinte du fichier et le processus parent.

| ID Sysmon | Enregistre |
|---|---|
| **1** | Création de processus |
| **3** | Connexion réseau |
| **7** | Image (DLL) chargée |
| **8** | CreateRemoteThread |
| **10** | ProcessAccess |
| **11** | FileCreate |
| **13** | Valeur de registre définie |
| **22** | Requête DNS |

@drill sysmon-ids

Voici un événement Sysmon 1, réduit aux champs que vous lirez en premier :

```
Event 1: Process Create
    UtcTime           : 2026-11-15 09:14:02.118
    Image             : C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe
    CommandLine       : powershell.exe -nop -w hidden -enc SQBFAFgA…
    User              : CORP\ana
    ParentImage       : C:\Program Files\Microsoft Office\root\Office16\WINWORD.EXE
    ParentCommandLine : "WINWORD.EXE" /n "C:\Users\ana\Downloads\invoice.docm"
    Hashes            : SHA256=9F2B…
```

Lisez-le du parent vers l'enfant, comme une phrase : Word a ouvert un document du dossier Téléchargements, puis Word a lancé PowerShell avec une fenêtre cachée et une commande encodée. Aucun des deux programmes n'est malveillant. C'est la relation qui est le constat, car un traitement de texte n'a aucune raison de lancer un interpréteur de scripts. Voilà pourquoi `ParentImage` est le champ le plus précieux qu'ajoute Sysmon : les journaux par défaut vous donnent des processus, et Sysmon vous donne l'histoire.

Sysmon journalise énormément si vous ne le filtrez pas, donc utilisez une configuration entretenue comme [sysmon-modular](https://github.com/olafhartong/sysmon-modular).

La configuration est un fichier XML de règles qui disent quoi enregistrer et quoi ignorer. Un fragment ressemble à ceci :

```xml
<RuleGroup name="" groupRelation="or">
  <NetworkConnect onmatch="exclude">
    <Image condition="is">C:\Program Files\Mozilla Firefox\firefox.exe</Image>
  </NetworkConnect>
</RuleGroup>
```

Il se lit ainsi : pour les connexions réseau, tout enregistrer sauf celles de Firefox. Chaque exclusion est un angle mort que vous avez choisi, donc une configuration devrait dire pourquoi chacune est là. Trois commandes gèrent le service installé :

| Commande | Effet |
|---|---|
| `Sysmon64.exe -c` | Affiche la configuration en service |
| `Sysmon64.exe -c new.xml` | La remplace, sans redémarrage |
| `Sysmon64.exe -u` | Désinstalle Sysmon |

::: try Déployez-le
```
Sysmon64.exe -accepteula -i sysmonconfig.xml
```
Les journaux apparaissent dans l'Observateur d'événements sous **Journaux des applications et des services → Microsoft → Windows → Sysmon → Operational**. Produisez ensuite des événements, et retrouvez chacun : lancez `notepad` (ID 1), lancez `curl https://example.com` (ID 3 et 22), créez un fichier (ID 11), ajoutez une clé Run (ID 13).
:::

?? Qu'ajoute Sysmon que les journaux par défaut n'ont pas ?
+ Lignes de commande, empreintes et processus parents
- Le blocage automatique de tout malware connu
- Une sauvegarde complète de chaque fichier modifié
- Un moyen plus rapide de démarrer Windows
=> Il enregistre du détail. Il ne bloque rien.

## Interroger depuis la ligne de commande

Cliquer dans l'Observateur d'événements ne passe pas à l'échelle. `Get-WinEvent` est l'outil :

```powershell
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625} -MaxEvents 20

Get-WinEvent -FilterHashtable @{
    LogName='Microsoft-Windows-Sysmon/Operational'; Id=1
} -MaxEvents 5 | Format-List TimeCreated, Message
```

Lisez la première commande comme une phrase : dans le journal Sécurité, donne-moi les événements d'identifiant 4625, et arrête-toi après 20. Ajoutez une fenêtre de temps avec une clé de plus, par exemple `StartTime=(Get-Date).AddHours(-1)` pour la dernière heure.

Les champs d'un événement ne sont pas des colonnes que vous pouvez trier. Ils se trouvent dans le XML de l'événement, donc pour compter ou regrouper selon un champ, vous l'extrayez d'abord. Ceci compte les échecs d'ouverture de session par compte, ce qui transforme 200 lignes en les trois qui comptent :

```powershell
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625} |
  ForEach-Object {
    ([xml]$_.ToXml()).Event.EventData.Data |
      Where-Object Name -eq 'TargetUserName' |
      Select-Object -ExpandProperty '#text'
  } |
  Group-Object | Sort-Object Count -Descending
```

Étape par étape : récupérer les événements, transformer chacun en XML, garder le champ `TargetUserName`, prendre son texte, puis regrouper les noms identiques et trier selon leur nombre. C'est le cousin Windows du `sort | uniq -c | sort -rn` du mois 1.

Le livrable : retrouver un événement d'ouverture de session précis en moins de deux minutes.

?? Un processus a fait une recherche DNS suspecte. Quel événement Sysmon montrerait la requête ?
+ L'événement 22, la requête DNS
- L'événement 1, le nouveau processus
- L'événement 11, le nouveau fichier
- L'événement 13, la valeur modifiée
=> Sysmon 22 relie une requête DNS au processus qui l'a faite, ce qu'un journal DNS réseau ne peut pas faire seul.

::: ai Exercice de la feuille de route
Demandez à un LLM « les 15 identifiants d'événement les plus importants pour détecter le mouvement latéral ». Vérifiez chacun dans la documentation de Microsoft et dans votre propre labo. Classez les erreurs : mauvais identifiant, mauvais journal, champ inventé. C'est le réflexe dont vous aurez besoin dans un SOC.
:::

## Lire trois événements

Trois événements d'une même matinée. Décidez ce que chacun signifie avant de lire les choix.

```
Event 4624   TargetUserName: svc-backup   LogonType: 10   IpAddress: 198.51.100.77
```

?? De quel genre d'ouverture de session s'agit-il, et pourquoi ressort-elle ?
+ Le Bureau à distance, par un compte de service
- Une tâche planifiée, lancée par un service du système
- Un partage de fichiers, ouvert par un simple utilisateur
- Un déverrouillage de l'écran, fait par quelqu'un au clavier
=> Le type 10 est le Bureau à distance. Les comptes de service font tourner des services, ce qui est le type 5 : l'un d'eux qui ouvre une session de bureau depuis une adresse distante, c'est une personne qui utilise son mot de passe.

```
Event 1   ParentImage: …\WINWORD.EXE   Image: …\powershell.exe   CommandLine: powershell.exe -w hidden -enc …
```

?? Qu'est-ce qui fait que cet événement Sysmon mérite une alerte ?
+ Un logiciel de documents a lancé un script caché
- PowerShell est un malware et ne doit jamais tourner
- Word n'est pas signé et il tourne depuis Temp
- Il manque le nom d'utilisateur dans cet événement précis
=> Les deux programmes sont légitimes. Un traitement de texte qui lance une commande PowerShell cachée et encodée, c'est le schéma d'un document malveillant.

```
Event 1102   The audit log was cleared.   SubjectUserName: ana   03:12
```

?? Que vous apprend cet événement ?
+ Quelqu'un a vidé le journal Sécurité à 03:12
- Le journal a atteint sa taille maximale autorisée
- Windows a installé une mise à jour nocturne
- Ana a échoué à se connecter à 03:12
=> 1102 est écrit quand le journal Sécurité est effacé à la main, et il nomme le compte qui l'a fait. Un journal qui tourne parce qu'il est plein ne le produit pas.

::: try Produisez les événements, puis retrouvez-les
1. Échouez volontairement à ouvrir une session avec un mauvais mot de passe, puis retrouvez le 4625 avec `Get-WinEvent` et lisez ses champs `TargetUserName` et `LogonType`.
2. Ouvrez une session correctement et retrouvez le 4624 correspondant. Notez son identifiant de session.
3. Avec Sysmon installé, lancez `notepad`, puis retrouvez son événement 1. Quel programme est le `ParentImage` ?
4. Lancez `curl https://example.com` et retrouvez l'événement 22. Quelle `Image` a fait la requête ?
5. Lancez le pipeline de comptage ci-dessus et vérifiez que votre échec d'ouverture de session figure dans le résultat.
:::

?! Un collègue dit « il n'y a pas de 4688 pour cela, donc le programme n'a jamais tourné ». Qu'est-ce qui cloche dans ce raisonnement ?
