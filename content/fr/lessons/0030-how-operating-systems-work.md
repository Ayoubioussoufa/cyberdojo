---
title: Comment fonctionnent vraiment les systèmes d'exploitation
summary: Mode utilisateur et mode noyau, processus et threads, mémoire virtuelle, handles et DLL : les idées derrière chaque attaque sur Windows.
builds: expliquer pourquoi un processus ne peut normalement pas lire la mémoire d'un autre
source: Operating Systems Three Easy Pieces (OSTEP), manuel gratuit (en anglais) | https://pages.cs.wisc.edu/~remzi/OSTEP/
words: mode utilisateur, mode noyau, mémoire virtuelle
---
La plupart des postes en entreprise tournent sous Windows, donc ce mois-ci consiste à le comprendre comme le font les défenseurs et les attaquants. D'abord, les idées qui valent pour tous les systèmes d'exploitation. Vous en avez déjà rencontré certaines. Nous descendons maintenant d'un niveau.

@term mode utilisateur = Le mode restreint du processeur dans lequel tournent les programmes ordinaires.
@term mode noyau = Le mode privilégié du processeur dans lequel tourne le noyau, avec un accès complet au matériel.
@term appel système (syscall) = La demande d'un programme au noyau de faire quelque chose à sa place.
@term thread = Un fil d'exécution à l'intérieur d'un processus. Un processus peut en avoir beaucoup.
@term mémoire virtuelle = L'illusion qui donne à chaque processus son propre espace d'adressage privé.
@term handle = La référence d'un processus vers un objet géré par le noyau, comme un fichier ouvert.
@term DLL (bibliothèque de liens dynamiques) = Un fichier Windows de code partagé que les programmes chargent pendant leur exécution.
@term injection de processus = Exécuter le code d'un attaquant dans la mémoire d'un autre processus.

## Deux modes

Le processeur lui-même fait respecter le mur de la leçon 3. Il a au moins deux modes :

@stack
Mode utilisateur | vos programmes | ne peuvent pas toucher au matériel
Appel système | le passage contrôlé | le noyau vérifie chaque demande
Mode noyau | le noyau et les pilotes | accès complet
Matériel | processeur, mémoire et disques |

- **Mode utilisateur :** là où tournent vos programmes. Ils ne peuvent toucher ni au matériel ni à la mémoire des autres programmes.
- **Mode noyau :** là où tourne le noyau, avec un accès complet.

Un programme ne passe de l'autre côté que par un **appel système** : un passage contrôlé où le noyau vérifie la demande. [OSTEP](https://pages.cs.wisc.edu/~remzi/OSTEP/) explique cela sous le nom d'exécution directe limitée : les programmes tournent vite sur le vrai processeur, mais dans des limites.

Vous n'avez pas à le croire sur parole. Sur votre VM Linux, `strace` affiche chaque appel système que fait un programme. Installez-le avec `sudo apt install strace`, puis regardez le modeste `ls` au travail :

```
$ strace ls
execve("/usr/bin/ls", ["ls"], 0x7ffd3c1e8a40 /* 23 vars */) = 0
…
openat(AT_FDCWD, ".", O_RDONLY|O_NONBLOCK|O_CLOEXEC|O_DIRECTORY) = 3
getdents64(3, 0x55d0c3a5e2f0 /* 4 entries */, 32768) = 112
write(1, "notes.txt  report.md\n", 21) = 21
exit_group(0)                           = ?
```

Chaque ligne est un passage par la porte : le nom de l'appel, ce que le programme a demandé, et après le `=` ce que le noyau a répondu. `ls` ne peut pas lire un dossier tout seul, donc il demande avec `openat`, reçoit le nombre 3, demande les entrées avec `getdents64`, et demande encore avec `write` pour mettre du texte sur votre écran. Lister un dossier a pris des dizaines de demandes, et le noyau aurait pu refuser chacune d'elles.

Essayez `strace cat /etc/shadow` en simple utilisateur et vous verrez un refus au moment où il se produit :

```
openat(AT_FDCWD, "/etc/shadow", O_RDONLY) = -1 EACCES (Permission denied)
```

Le programme a demandé, le noyau a comparé votre identité aux permissions du fichier, et la réponse a été non. Chaque permission que vous avez réglée au mois 1 est appliquée exactement à cet endroit.

::: key
Si du code malveillant atteint le mode noyau, il peut se cacher de tout ce qui est au-dessus. C'est pourquoi un pilote du noyau est si dangereux, et pourquoi en charger un demande des privilèges élevés.
:::

?? Comment un programme fait-il faire quelque chose en mode noyau ?
+ Par un appel système, qui est vérifié
- En écrivant directement sur le matériel lui-même
- En demandant un mot de passe ailleurs
- En redémarrant l'ordinateur en mode sans échec
=> Les appels système sont le passage contrôlé. C'est là que le noyau vérifie les permissions.

## Processus et threads

Un **processus** est un conteneur : sa mémoire, ses handles ouverts, son identité de sécurité. Un **thread** est ce qui s'exécute réellement. Un processus en a un ou plusieurs. Voyez le processus comme une cuisine et les threads comme des cuisiniers qui la partagent.

Les deux systèmes vous montrent les chiffres. Sous Linux, `ps -o pid,nlwp,cmd -p 1` affiche un processus avec son nombre de threads dans la colonne `NLWP`. Sous Windows, ouvrez le Gestionnaire des tâches, allez dans **Détails**, faites un clic droit sur un en-tête de colonne, choisissez **Sélectionner des colonnes** et cochez **Threads** et **Handles**. Un navigateur affichera des dizaines de threads dans chacun de ses processus.

Pourquoi la différence compte-t-elle pour la sécurité ? Les threads d'un même processus partagent tout : la même mémoire, les mêmes fichiers ouverts, la même identité. Il n'y a aucun mur entre eux. Les murs n'existent qu'entre les processus, et c'est pourquoi un navigateur donne à chaque onglet son propre processus : un onglet dont on a pris le contrôle reste enfermé dans son conteneur.

?? Qu'est-ce qui s'exécute réellement sur le processeur ?
+ Un thread, dans un processus
- Un fichier, dans un dossier
- Un handle, dans une clé
- Un utilisateur, dans un groupe
=> Un processus est le conteneur, et les threads font le travail.

## Mémoire virtuelle

Chaque processus croit avoir toute la mémoire pour lui. Les adresses qu'il voit sont **virtuelles**, et le processeur et le noyau les traduisent en vraie mémoire vive en coulisses.

Voici le bénéfice pour la sécurité : l'adresse `0x1000` dans votre navigateur et `0x1000` dans votre client de messagerie sont des emplacements physiques différents. Un processus ne peut même pas nommer la mémoire de l'autre. C'est ce qui rend les processus isolés.

Linux vous laisse regarder l'espace d'adressage d'un processus. Chaque ligne de ce fichier est une région de mémoire virtuelle, avec sa plage d'adresses et ses permissions :

```
$ cat /proc/self/maps
55e4c7a2b000-55e4c7a2d000 r--p … /usr/bin/cat
55e4c7a2d000-55e4c7a32000 r-xp … /usr/bin/cat
7f3a9c200000-7f3a9c228000 r--p … /usr/lib/x86_64-linux-gnu/libc.so.6
7ffc1b5e0000-7ffc1b601000 rw-p … [stack]
```

Lisez les lettres de permission comme vous lisez les permissions d'un fichier : `r` lecture, `w` écriture, `x` exécution. Le code du programme est en `r-x`, il peut donc s'exécuter mais pas être modifié. La pile, où le programme garde ses données de travail, est en `rw-`, elle peut donc être modifiée mais pas s'exécuter. Une mémoire à la fois modifiable et exécutable est rare dans les programmes normaux, et c'est pourquoi les défenseurs la traitent comme un signal d'alerte.

Lancez la commande deux fois et les adresses changent. C'est voulu : l'**ASLR**, la disposition aléatoire de l'espace d'adressage, place les choses différemment à chaque exécution, pour qu'un attaquant ne puisse pas savoir à l'avance où se trouve quoi que ce soit.

Si un programme touche une adresse qui n'est pas dans sa carte, le processeur l'arrête et le noyau met fin au processus. Linux appelle cela une erreur de segmentation, et Windows une violation d'accès. Un plantage de ce genre, c'est le mur qui fait son travail.

?? Pourquoi un programme ordinaire ne peut-il pas simplement lire le mot de passe stocké dans la mémoire d'un autre programme ?
+ Chaque processus ne voit que ses propres adresses virtuelles
- Tout mot de passe est toujours chiffré en mémoire
- Le disque bloque toute lecture entre des programmes différents
- Les programmes ne tournent jamais qu'un à la fois
=> La mémoire virtuelle donne à chaque processus un espace d'adressage séparé. L'accès entre processus doit passer par le noyau, qui vérifie les permissions.

## Mais les attaquants font exactement cela

Les systèmes d'exploitation offrent des moyens légitimes de passer d'un processus à l'autre, utilisés par les débogueurs. Avec assez de privilèges, un processus peut en ouvrir un autre avec un **handle**, puis écrire dans sa mémoire et y démarrer un thread. C'est l'**injection de processus**. ATT&CK la classe sous [T1055](https://attack.mitre.org/techniques/T1055/). Les malwares le font pour se cacher dans un processus de confiance, ou pour lui voler des identifiants.

Sysmon peut l'enregistrer : l'**événement 8** consigne CreateRemoteThread, et l'**événement 10** consigne l'accès d'un processus à un autre. Vous utiliserez les deux ce mois-ci.

?? Pourquoi un malware s'injecterait-il dans un processus de confiance ?
+ Pour se cacher dans quelque chose d'apparence normale
- Pour que ce programme tourne beaucoup plus vite
- Pour installer une toute nouvelle version de Windows
- Pour libérer davantage de mémoire pour les utilisateurs
=> L'activité d'un processus de confiance attire beaucoup moins l'attention.

## Handles et DLL

Un **handle** est le ticket d'un processus vers un objet : un fichier, une clé de registre, un autre processus. Le noyau vérifie les permissions à l'ouverture du handle, pas à chaque utilisation.

Une **DLL** est une bibliothèque de code que les programmes chargent à l'exécution. Windows a des règles sur les endroits où il en cherche une, et si un attaquant peut placer une DLL malveillante au bon endroit, un programme de confiance la chargera. C'est le [détournement de l'ordre de recherche des DLL](https://attack.mitre.org/techniques/T1574/001/).

Vous pouvez lister ce qu'un programme en cours d'exécution a chargé. Sous Windows, ouvrez le Bloc-notes, puis dans PowerShell :

```powershell
(Get-Process notepad).Modules | Select-Object ModuleName, FileName
```

Chaque ligne est une DLL, avec le dossier d'où elle vient. Presque toutes viennent de `C:\Windows\System32`. Voilà le contrôle du défenseur en un coup d'œil : le nom d'une DLL ne prouve rien, car n'importe qui peut nommer un fichier `version.dll`. C'est le chemin qui compte. Une DLL système chargée depuis un dossier Téléchargements ou Temp est un constat.

?? Un programme signé par Microsoft charge une DLL malveillante depuis son propre dossier. Pourquoi les attaquants aiment-ils cela ?
+ Le code de l'attaquant tourne dans un processus de confiance
- Cela supprime le fichier de signature numérique du programme d'origine
- Cela permet à ce programme de tourner en mode noyau
- Cela empêche ce programme d'atteindre tout le réseau de l'entreprise
=> Le processus paraît légitime à quiconque y jette un coup d'œil. Les défenseurs surveillent les programmes de confiance qui chargent des DLL depuis des emplacements inhabituels.

@term LOLBin (living off the land) = Un outil légitime du système que les attaquants détournent pour éviter de déposer leur propre malware.

## Ce que surveille un défenseur

Chaque idée de cette leçon laisse une trace qu'une sonde peut enregistrer. Ce tableau est la raison pour laquelle vous avez appris la théorie : quand vous lirez des événements Sysmon plus tard ce mois-ci, vous saurez ce que chacun signifie.

| Idée | Ce qu'un attaquant en fait | Ce qui l'enregistre |
|---|---|---|
| Processus | Lance un outil ou un script | Sysmon 1, création de processus, avec la ligne de commande complète |
| DLL | Fait charger son code par un programme de confiance | Sysmon 7, image chargée, avec le chemin de la DLL |
| Thread | Démarre un thread dans un autre processus | Sysmon 8, CreateRemoteThread |
| Handle | Ouvre un autre processus pour lire sa mémoire | Sysmon 10, accès à un processus |
| Mode noyau | Charge un pilote pour se cacher de tout | Sysmon 6, pilote chargé |

?? `strace` affiche `openat("/etc/shadow", O_RDONLY) = -1 EACCES`. Qui a refusé la demande ?
+ Le noyau, quand il a vérifié l'appel
- Le programme `cat`, avant même de demander
- Le disque, en trouvant le fichier demandé
- Le shell, en lisant la commande tapée
=> Le programme a demandé par un appel système et le noyau a dit non. Les contrôles de permission ont lieu à ce passage, pas dans le programme.

?? L'événement Sysmon 7 montre un programme signé qui charge `version.dll` depuis le dossier Téléchargements d'un utilisateur. Pourquoi cela mérite-t-il un coup d'œil ?
+ Les DLL système viennent des dossiers de Windows
- Un programme signé ne charge jamais aucune DLL
- Un dossier Téléchargements ne peut contenir aucune DLL
- L'événement 7 ne signale jamais que des malwares
=> Le nom correspond à une vraie DLL système, mais pas le chemin. Un programme de confiance qui charge du code depuis un dossier où tout utilisateur peut écrire, c'est le schéma derrière le détournement de l'ordre de recherche.

::: try Voyez le mur vous-même
1. Sur votre VM Linux, lancez `strace -c ls`. L'option `-c` compte les appels : notez combien d'appels système fait un seul `ls`.
2. Lancez `strace cat /etc/shadow` en simple utilisateur et trouvez la ligne qui contient `EACCES`.
3. Lancez `cat /proc/self/maps` deux fois et comparez la première adresse de chaque exécution.
4. Sous Windows, ajoutez les colonnes Threads et Handles dans le Gestionnaire des tâches et trouvez le processus qui a le plus de handles.
5. Listez les DLL du Bloc-notes avec la ligne PowerShell ci-dessus, et vérifiez que chaque chemin commence par `C:\Windows`.
:::

?! Expliquez la mémoire virtuelle à un ami. Dites ensuite comment l'injection de processus la contourne.
