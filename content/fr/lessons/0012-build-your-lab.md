---
title: Construisez votre lab
summary: Machines virtuelles, instantanés et modes réseau sûrs, puis une vraie installation pas à pas sur votre ordinateur.
builds: deux machines virtuelles sur un réseau isolé, avec des instantanés
source: Manuel utilisateur de VirtualBox, réseau virtuel (en anglais) | https://www.virtualbox.org/manual/
words: machine virtuelle, instantané, réseau host-only
---
Jusqu'ici, tout a tourné dans votre navigateur. Le vrai travail de sécurité a besoin de vraies machines que vous pouvez casser sans conséquence. Une **machine virtuelle** vous donne un ordinateur entier dans votre ordinateur, gratuitement, et que vous pouvez réinitialiser en quelques secondes.

@term machine virtuelle (VM) = Un ordinateur simulé complet qui tourne comme un programme sur votre vrai ordinateur.
@term hyperviseur = Le logiciel qui crée et fait tourner les machines virtuelles, comme VirtualBox.
@term hôte = Votre vrai ordinateur, celui qui fait tourner l'hyperviseur.
@term invité (guest) = Un système d'exploitation qui tourne dans une machine virtuelle.
@term instantané (snapshot) = Un état enregistré d'une machine virtuelle, auquel vous pouvez revenir instantanément.
@term mode réseau NAT = Un mode réseau de VM qui donne un accès internet sortant tout en cachant la VM de l'extérieur.
@term réseau host-only = Un réseau privé entre vos VM et votre hôte, sans internet.
@term réseau interne = Un réseau privé entre VM seulement, qui n'atteint pas l'hôte.
@term Kali Linux = Une distribution Linux remplie d'outils de test de sécurité.

## Ce qu'est une machine virtuelle

Un **hyperviseur** est un programme qui fait semblant d'être un ordinateur. Il donne à chaque **invité** un processeur, une mémoire, un disque et une carte réseau virtuels. L'invité ne sait pas que ce n'est pas du vrai matériel. Cela vous donne trois super-pouvoirs pour la sécurité :

@stack
Machines virtuelles | pare-feu, Kali, serveur Ubuntu | chacune se croit un vrai ordinateur
Hyperviseur | VirtualBox | répartit le matériel
L'OS de votre ordinateur | Windows, macOS ou Linux | l'hôte
Matériel | processeur, RAM et disque |

- **Isolation.** Ce qui se passe dans la VM y reste, à condition de bien la configurer.
- **Instantanés.** Enregistrez l'état, essayez quelque chose de dangereux, et restaurez en quelques secondes.
- **Variété.** Faites tourner Linux, Windows et un pare-feu sur un seul ordinateur.

?? Pourquoi les instantanés sont-ils si utiles pour s'entraîner en sécurité ?
+ Vous pouvez tout annuler en seulement quelques secondes
- Ils font tourner la machine virtuelle plus vite
- Ils empêchent tout bonnement un malware de tourner
- Ils copient toute la machine entière vers internet
=> Enregistrer un état et le restaurer signifie que vous pouvez essayer des choses dangereuses sans crainte.

## Choisir un mode réseau

C'est le réglage qui vous garde en sécurité. Il décide de ce que votre VM peut atteindre.

| Mode | Atteint internet ? | Atteint votre hôte ? | Atteint les autres VM ? | À utiliser pour |
|---|---|---|---|---|
| **NAT** | Oui | Pas directement | Pas en général | Installer les mises à jour |
| **Host-only** | Non | Oui | Oui | Votre réseau de lab principal |
| **Interne** | Non | Non | Oui | Le plus isolé : expériences dangereuses |
| Pont (bridged) | Oui | Oui | Oui | À éviter : la VM rejoint votre vrai réseau |

Le comportement exact est décrit dans le [chapitre réseau de VirtualBox](https://www.virtualbox.org/manual/).

::: law
N'attaquez jamais quoi que ce soit depuis une VM en mode pont sur un réseau d'université ou de travail. Scanner vos voisins est un test non autorisé, même par accident. Restez sur des réseaux host-only ou internes.
:::

?? Vous voulez qu'une VM Linux et une VM Kali s'atteignent, sans accès internet. Quel mode ?
+ Host-only ou interne, sur le même réseau nommé
- NAT, car chaque VM partage la même adresse
- Pont, car il donne la meilleure vitesse réseau
- Aucun réseau, car les VM partagent la mémoire
=> Les deux donnent un réseau privé sans route vers internet. Le mode interne n'atteint pas non plus l'hôte, c'est donc le plus isolé.

## Pas à pas

Vérifiez d'abord les [conseils matériels](/guides/a1-the-whole-plan/) : 16 Go de RAM sont confortables, et 8 Go peuvent faire tourner une ou deux petites VM. Ces étapes utilisent VirtualBox, gratuit et [publié sous la GPL](https://www.virtualbox.org/wiki/Downloads). VMware Workstation Pro est [aussi gratuit](https://knowledge.broadcom.com/external/article/368667/download-and-license-information-for-vmw.html) si vous le préférez.

::: try Faites ceci sur votre ordinateur
1. Téléchargez **VirtualBox** depuis [virtualbox.org](https://www.virtualbox.org/wiki/Downloads) et installez-le. Si les VM ne démarrent pas, activez la virtualisation (Intel VT-x ou AMD-V) dans les réglages BIOS/UEFI de votre ordinateur.
2. Téléchargez l'image **Ubuntu Server** LTS depuis [ubuntu.com](https://ubuntu.com/download/server). L'actuelle est la 26.04 LTS. Un parcours plus ancien peut dire 24.04, qui marche aussi.
3. Dans VirtualBox : **Nouvelle**, nommez-la `ubuntu-server`, choisissez l'image. Donnez-lui 2 Go de RAM, 2 processeurs et un disque de 25 Go.
4. Lancez l'installateur et acceptez les réglages par défaut. Cochez **Installer le serveur OpenSSH**. Notez le nom d'utilisateur que vous choisissez.
5. Téléchargez l'image **Kali** VirtualBox prête à l'emploi depuis [kali.org](https://www.kali.org/get-kali/#kali-virtual-machines), puis importez-la avec **Fichier → Importer**. Donnez-lui 2 à 4 Go de RAM.
6. Créez le réseau : **Outils → Réseau → Réseaux host-only → Créer**.
7. Pour chaque VM, ouvrez **Configuration → Réseau** : l'interface 1 reste en NAT pour les mises à jour, et l'interface 2 passe en **host-only**.
8. Démarrez les deux, et lancez `ip a` dans chacune. Trouvez l'adresse sur le réseau host-only, en général `192.168.56.x`.
9. Depuis Kali : `ping <adresse-ubuntu>`. Des réponses signifient que votre lab fonctionne.
10. Éteignez et prenez un instantané de chacune : **Instantanés → Prendre**, nommé `clean-install`.
:::

::: tip Discipline des instantanés
Prenez un instantané avant toute action risquée, et donnez-lui un nom qui dit pourquoi. Avant de lancer quoi que ce soit d'inconnu, désactivez aussi les dossiers partagés et le presse-papiers. Quand vous testerez des malwares au mois 16, retirez complètement l'interface NAT.
:::

?? Vous allez essayer une commande qui pourrait casser votre VM Ubuntu. Que faire d'abord ?
+ Prendre un instantané nommé de la VM
- Copier d'abord la commande dans vos notes
- Passer son interface réseau en mode pont
- Augmenter la mémoire allouée à la VM
=> Un instantané rend l'action risquée sans danger. Il prend quelques secondes, et c'est l'habitude qui vous laisse expérimenter librement.

## Documentez-le

La validation demande un lab de deux VM avec des instantanés, documenté dans un README. Notez les noms des VM, leurs adresses, le mode réseau et la raison de ce choix. Cela démarre le projet [P01](/projects/P01/).

?! Collez la sortie de `ip a` de chaque VM (ce sont des adresses de lab privées) et expliquez quelle adresse correspond à quelle interface réseau. Si quelque chose a échoué, décrivez l'erreur exactement.

## Ce que vous savez faire maintenant

Vous possédez un vrai lab. À partir d'ici, les commandes apprises fonctionnent aussi sur de vraies machines. Ensuite, vous vous connecterez à un serveur distant de façon sécurisée.
