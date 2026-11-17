---
title: L'annuaire Active Directory
summary: Domaines, forêts, OU, GPO, LDAP et pourquoi AD fait tourner la plupart des entreprises, avec un labo que vous construisez et scriptez vous-même.
builds: un domaine avec des utilisateurs, des groupes et des GPO, le début de P04
source: GOAD, Game of Active Directory (en anglais) | https://github.com/Orange-Cyberdefense/GOAD
words: domaine, contrôleur de domaine, GPO
---
Active Directory est l'annuaire, le videur et le règlement des réseaux Windows de la plupart des entreprises. Compromettez-le et l'entreprise est à vous. C'est pourquoi les groupes de rançongiciels le visent, et pourquoi vous passerez ce mois à l'intérieur de l'un d'eux.

@term Active Directory (AD) = Le service d'annuaire de Microsoft, qui stocke et gère les utilisateurs et les ordinateurs d'un réseau Windows.
@term domaine = Un groupe d'utilisateurs et d'ordinateurs gérés ensemble par Active Directory.
@term contrôleur de domaine (DC) = Un serveur qui fait tourner Active Directory et traite les ouvertures de session.
@term forêt = Le conteneur de plus haut niveau, qui réunit un ou plusieurs domaines AD.
@term OU (unité d'organisation) = Un dossier d'AD qui sert à ranger des objets et à appliquer des stratégies.
@term GPO (objet de stratégie de groupe) = Un ensemble de réglages appliqués aux utilisateurs et aux ordinateurs dans AD.
@term LDAP = Le protocole pour interroger un annuaire comme AD.
@term compte de service = Un compte utilisé par un programme plutôt que par une personne.
@term SPN (nom de principal de service) = Un nom qui relie un service au compte qui le fait tourner.
@term Admins du domaine = Le groupe AD qui a le contrôle total d'un domaine.
@term modèle en niveaux = Garder les identifiants d'administration des systèmes critiques loin des machines moins fiables.

## La structure

@stack
Forêt | corp.example | la vraie frontière de sécurité
Domaine | corp.example | une base de données gérée
OU | Finance, Informatique, Serveurs | des dossiers qui contiennent utilisateurs et ordinateurs
Objet | utilisateurs, ordinateurs, groupes | ce à quoi s'appliquent les GPO et les permissions

| Objet | Ce que c'est |
|---|---|
| **Domaine** | Un périmètre géré, avec sa propre base de données |
| **Forêt** | Un ou plusieurs domaines qui se font confiance : la vraie frontière de sécurité |
| **OU** | Un dossier pour ranger et déléguer |
| **Groupe** | Un ensemble d'utilisateurs pour les permissions |
| **GPO** | Des réglages poussés vers tout ce qui se trouve sous une OU |

Un **contrôleur de domaine** détient la base, un fichier appelé `NTDS.dit`, qui contient les empreintes des mots de passe de chaque compte. C'est pourquoi un DC est le joyau de la couronne. AD dépend du **DNS** : les clients trouvent les DC grâce à des enregistrements DNS, donc un DNS cassé signifie des ouvertures de session cassées.

**LDAP** est la façon de l'interroger :

```powershell
Get-ADUser -Filter * | Select-Object Name
Get-ADGroupMember "Domain Admins"
Get-ADComputer -Filter *
```

Chaque objet de l'annuaire a une adresse complète appelée **nom distinctif**, et vous en verrez dans les outils, les journaux et les scripts. Lisez-en un de droite à gauche, du domaine jusqu'à l'objet :

```
CN=Ana Diaz,OU=Finance,OU=Staff,DC=corp,DC=lab
```

| Partie | Signifie | Ici |
|---|---|---|
| `DC` | Composant de domaine | `corp` et `lab` forment ensemble le domaine `corp.lab` |
| `OU` | Unité d'organisation | `Staff`, et à l'intérieur `Finance` |
| `CN` | Nom commun | L'objet lui-même, l'utilisatrice Ana Diaz |

Il s'agit donc de l'utilisatrice Ana Diaz, dans l'OU Finance, à l'intérieur de l'OU Staff, dans le domaine `corp.lab`. La position compte, car les GPO liées à `Staff` et à `Finance` s'appliquent toutes deux à elle.

@code parse-dn

Les trois commandes ci-dessus renvoient des objets, comme tout dans PowerShell, et chaque objet a bien plus de propriétés que n'en montre la vue par défaut. Demandez celles qui intéressent un relecteur :

```powershell
Get-ADUser ana.diaz -Properties MemberOf, LastLogonDate, PasswordLastSet, Enabled
```

Sur un contrôleur de domaine, vous pouvez aussi parcourir les mêmes données à la souris : lancez `dsa.msc` pour ouvrir **Utilisateurs et ordinateurs Active Directory**. Servez-vous-en pour apprendre la forme de l'arbre, et utilisez PowerShell pour tout ce que vous devrez répéter ou prouver.

Puisque les ouvertures de session dépendent du DNS, deux commandes sur un client vous disent s'il peut seulement trouver un contrôleur de domaine :

```
nslookup -type=SRV _ldap._tcp.dc._msdcs.corp.lab
nltest /dsgetdc:corp.lab
```

La première demande au DNS l'enregistrement qui liste les DC. La seconde demande à Windows d'en localiser un et affiche son nom et son adresse. Si la première ne renvoie rien, le réglage DNS du client ne pointe pas vers le DC, et aucune ouverture de session ne fonctionnera tant que ce sera le cas.

### Groupe de travail ou domaine

Sans Active Directory, chaque ordinateur Windows garde sa propre liste de comptes. Ana a un mot de passe sur son portable, un autre sur le serveur de fichiers et un troisième sur le serveur d'impression, et quand elle part, quelqu'un doit penser à la supprimer partout. C'est un **groupe de travail** (*workgroup*), et cela suffit à la maison. Une entreprise rattache plutôt ses ordinateurs à un **domaine** : les comptes existent une seule fois, sur les contrôleurs de domaine, et chaque ordinateur rattaché les interroge. Un mot de passe marche partout, désactiver un compte le bloque partout d'un coup, et une seule stratégie peut régler le verrouillage d'écran de dix mille portables. Ce point de contrôle unique est la raison d'être d'AD, et la raison pour laquelle c'est la première chose que cherche un intrus.

### Ce qui se passe quand vous ouvrez une session sur un ordinateur du domaine

Taper votre mot de passe sur un portable d'entreprise lance une courte conversation que vous ne voyez jamais :

1. Le portable demande au DNS où sont les contrôleurs de domaine, grâce à des enregistrements SRV spéciaux comme `_ldap._tcp.dc._msdcs.corp.lab`.
2. Il en contacte un et prouve que vous connaissez votre mot de passe avec **Kerberos**, sans envoyer le mot de passe lui-même, et reçoit un ticket.
3. La réponse du DC contient tous les groupes dont vous êtes membre, directement ou à travers d'autres groupes. Le portable en tire votre jeton d'accès, et c'est ce jeton qui décide des fichiers et des imprimantes auxquels vous avez droit.
4. La stratégie de groupe s'applique : les GPO liées à l'OU de votre ordinateur et à celle de votre utilisateur sont récupérées, et leurs réglages imposés.

Quand les connexions échouent dans tout un bureau, vérifiez ces étapes dans l'ordre. Un DNS en panne à l'étape 1 est la cause la plus fréquente, et c'est pourquoi l'une des questions ci-dessous commence par là. Kerberos et son ticket ont droit à une leçon à eux, juste après.

### Les ports qu'écoute un contrôleur de domaine

Le balayage d'un contrôleur de domaine montre un ensemble de services reconnaissable, et les connaître vous dit quelles règles de pare-feu un domaine demande :

| Port | Service | Sert à |
|---|---|---|
| 53 | DNS | Trouver les DC et les autres services |
| 88 | Kerberos | Ouvertures de session et tickets |
| 135, et une plage haute | RPC | Administration et réplication |
| 389, 636 | LDAP, LDAPS | Interroger l'annuaire ; 636 est la forme chiffrée |
| 445 | SMB | Les fichiers de stratégie de groupe, les partages `SYSVOL` et `NETLOGON` |
| 464 | Changement de mot de passe Kerberos | Changer les mots de passe |
| 3268, 3269 | Catalogue global | Chercher dans toute la forêt |

Les postes de travail doivent pouvoir joindre ces ports sur les DC. Rien sur Internet ne le devrait.

?? Pourquoi un contrôleur de domaine est-il une cible d'aussi grande valeur ?
+ Il stocke les secrets de chaque compte du domaine
- Il héberge le site web public de toute l'entreprise
- C'est la seule machine qui a accès à Internet
- Il a les disques les plus rapides de tous
=> Celui qui contrôle un DC contrôle tous les comptes du domaine.

## Pourquoi les GPO comptent pour les attaquants

Une GPO peut installer un logiciel ou lancer des scripts sur chaque machine d'une OU. Un accès en écriture à une GPO liée à l'OU des postes de travail signifie donc l'exécution de code sur chaque poste. Les permissions dans AD sont aussi importantes que celles des fichiers, et elles sont invisibles tant que vous ne regardez pas. C'est à cela que sert [BloodHound](https://bloodhound.specterops.io/).

Trois commandes couvrent la plupart des questions sur les GPO :

| Commande | Où | Montre ou fait |
|---|---|---|
| `Get-GPO -All` | Contrôleur de domaine | Toutes les GPO du domaine |
| `gpresult /r` | N'importe quelle machine membre | Quelles GPO se sont réellement appliquées à cet ordinateur et à cet utilisateur |
| `gpupdate /force` | N'importe quelle machine membre | Récupère et applique les stratégies maintenant, sans attendre |

Une GPO ne fait rien tant qu'elle n'est pas **liée** à une OU, et elle s'applique alors aux objets de cette OU et de celles qui sont en dessous. Quand un réglage « ne marche pas », `gpresult /r` sur la machine concernée est la première chose à lire : soit la GPO est dans la liste, soit elle n'y est pas, et dans ce cas l'ordinateur se trouve dans une OU à laquelle la GPO n'est pas liée.

?? Pourquoi un accès en écriture à une GPO est-il si dangereux ?
+ Il peut exécuter du code sur de nombreuses machines
- Il ne change que l'image de fond du bureau
- Il vous laisse lire absolument tous les journaux existants
- Il supprime toute la forêt d'un seul coup net
=> Une GPO s'applique à tout ce qui se trouve sous son OU, donc une seule permission atteint chaque machine de cette OU.

## Comptes de service et SPN

Des programmes comme SQL Server tournent sous des **comptes de service**. Un **SPN** relie un service à son compte. Ces comptes ont souvent des mots de passe faibles, jamais changés, et trop de droits. Retenez-le : c'est ce qui fait fonctionner le Kerberoasting, dans deux leçons.

Trouver ces comptes est le travail d'un défenseur avant d'être celui de qui que ce soit d'autre. Ceci liste chaque compte qui a un SPN, avec les deux faits qui décident de son niveau de risque :

```powershell
Get-ADUser -Filter 'ServicePrincipalName -like "*"' -Properties ServicePrincipalName, PasswordLastSet, MemberOf |
  Select-Object Name, PasswordLastSet, MemberOf
```

Un mot de passe défini il y a des années a probablement été choisi par une personne et jamais renouvelé. L'appartenance à un groupe puissant signifie que le compte peut faire bien plus que faire tourner un service. Le correctif moderne est un **compte de service géré de groupe** (gMSA), où le domaine lui-même génère un long mot de passe aléatoire et le change automatiquement, de sorte qu'il n'y a plus du tout de secret choisi par un humain.

Quelques autres audits d'une ligne ont leur place dans le même script. Chacun répond à une question qu'un attaquant se poserait sur votre domaine, donc posez-la en premier :

```powershell
Get-ADGroupMember "Domain Admins"                                  # qui détient les clés ?
Search-ADAccount -AccountInactive -TimeSpan 90.00:00:00 -UsersOnly  # qui ne s'est pas connecté depuis 90 jours ?
Get-ADUser -Filter 'PasswordNeverExpires -eq $true'                 # quel mot de passe ne change jamais ?
```

@code risky-service-accounts

?? Qu'est-ce qu'un SPN ?
+ Un nom qui relie un service à son compte
- Un mot de passe qu'un compte de service utilise
- Un journal de chaque service présent sur une machine
- Un groupe de comptes qui partagent tous leurs permissions
=> Les clients trouvent les services par leur SPN. Les mots de passe faibles de ces comptes sont le vrai risque.

## Les niveaux

Le [modèle en niveaux](https://learn.microsoft.com/fr-fr/security/privileged-access-workstations/privileged-access-access-model) dit : ne vous connectez jamais à une machine peu fiable avec un compte très sensible. Quand un Admin du domaine ouvre une session sur un poste de travail, ses identifiants arrivent dans la mémoire de cette machine. Compromettez le poste et vous avez le domaine.

?? Qu'interdit le modèle en niveaux ?
+ Les comptes sensibles connectés à des machines peu fiables
- Les comptes ordinaires qui impriment sur une imprimante partagée
- Les comptes aux mots de passe de douze caractères
- Toutes les connexions hors des heures normales de bureau
=> Une ouverture de session laisse des identifiants dans la mémoire de la machine, donc une machine faible met en danger un compte fort.

## Construisez le labo

Votre propre labo, sous le nom de [P04](/projects/P04/). **Avec 32 Go de mémoire vive :** [GOAD](https://github.com/Orange-Cyberdefense/GOAD) ou GOAD-Light le construit automatiquement. **Sinon :** un domaine de trois VM monté à la main.

::: try Un domaine monté à la main
1. Créez une VM Windows Server sur votre réseau privé hôte, avec une IP fixe.
2. Installez AD DS et promouvez-la en nouvelle forêt, dans PowerShell :
```powershell
Install-WindowsFeature AD-Domain-Services -IncludeManagementTools
Install-ADDSForest -DomainName "corp.lab" -InstallDns
```
3. Pointez le DNS d'une VM Windows 11 vers le DC, et joignez-la au domaine.
4. Créez des OU, plus de 20 utilisateurs et 5 groupes avec un script. [BadBlood](https://github.com/davidprowe/BadBlood) peut le peupler, ou écrivez le vôtre.
5. Créez trois GPO, par exemple une stratégie de mots de passe et une stratégie d'audit.
6. Ajoutez un compte de service avec un SPN et un mot de passe volontairement faible, et **documentez-le** dans un registre des faiblesses :
```powershell
New-ADUser -Name svc_sql -AccountPassword (Read-Host -AsSecureString) -Enabled $true
setspn -S MSSQLSvc/srv1.corp.lab:1433 corp\svc_sql
```
:::

::: law
Ce compte faible n'a sa place que dans votre labo isolé. Gardez le labo sur des réseaux privés hôtes, et ne l'exposez jamais.
:::

Le livrable vous demande de le reconstruire à partir de votre propre script, donc écrivez le script au fur et à mesure.

?? Un Admin du domaine ouvre une session sur un portable du support pour réparer une imprimante. Pourquoi est-ce dangereux ?
+ Ses identifiants arrivent dans la mémoire de ce portable
- Cela supprime les stratégies de groupe de ce portable
- Cela le retire du groupe des Admins du domaine
- Cela empêche les contrôleurs de domaine de répondre ensuite
=> Un attaquant présent sur ce portable peut les récolter. C'est le problème que le modèle en niveaux existe pour empêcher.

## Auditez votre propre domaine

Une fois le labo en place, examinez-le comme vous examineriez celui d'un client. Trois constats à interpréter :

```
Name     PasswordLastSet        MemberOf
svc_sql  03/14/2019 09:12:44    {CN=Domain Admins,CN=Users,DC=corp,DC=lab}
```

?? Qu'est-ce qui ne va pas avec ce compte ?
+ Un vieux mot de passe et trop de pouvoir
- Un secret tout neuf et trop peu de pouvoir
- Un nom qui ne suit pas la norme interne
- Une connexion qui a eu lieu hors des heures
=> C'est un compte de service dont le mot de passe n'a pas changé depuis des années, et c'est un Admin du domaine. Faire tourner une base de données ne demande pas le contrôle de tout le domaine.

?? Un nouveau poste de travail ne laisse personne ouvrir de session, et `nslookup -type=SRV _ldap._tcp.dc._msdcs.corp.lab` ne renvoie aucune réponse. Où regardez-vous en premier ?
+ Le réglage du serveur DNS du poste
- La date d'expiration du mot de passe
- L'espace disque libre du contrôleur de domaine
- La GPO du fond d'écran du poste
=> Les clients trouvent les contrôleurs de domaine par le DNS. Si la recherche SRV échoue, la machine interroge le mauvais serveur DNS, en général celui du routeur.

?? Vous avez lié une nouvelle GPO à l'OU `Workstations`, mais `gpresult /r` sur un portable ne la liste pas, même après `gpupdate /force`. Quelle est la cause la plus probable ?
+ Le compte du portable est dans une autre OU
- La GPO met une journée entière à se copier
- Le portable a besoin de plus de 8 Go
- La GPO ne s'applique qu'aux seuls Admins du domaine
=> Une GPO s'applique aux objets de l'OU à laquelle elle est liée. Les nouveaux ordinateurs arrivent dans le conteneur `Computers` par défaut jusqu'à ce que quelqu'un les déplace.

?! Expliquez la différence entre un domaine, une forêt et une OU, comme à un nouveau collègue.
