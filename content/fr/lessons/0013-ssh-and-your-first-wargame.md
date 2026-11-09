---
title: SSH et votre premier wargame
summary: Se connecter à des machines distantes en sécurité, comprendre les paires de clés, et démarrer OverTheWire Bandit, un vrai serveur fait pour s'entraîner.
builds: se connecter en SSH avec une clé, et finir le niveau 0 de Bandit
source: OverTheWire Bandit (en anglais) | https://overthewire.org/wargames/bandit/
words: SSH, clé publique, clé privée
---
Presque tous les serveurs du monde sont gérés à distance avec un seul protocole : **SSH**. Aujourd'hui, vous allez l'utiliser, comprendre pourquoi les clés valent mieux que les mots de passe, et démarrer le wargame que le parcours prend comme repère de votre mois 1.

@term SSH (Secure Shell) = Un protocole pour se connecter à une machine distante par une connexion chiffrée.
@term clé publique = La moitié d'une paire de clés que vous pouvez partager librement. Elle sert à vérifier.
@term clé privée = La moitié secrète d'une paire de clés. Qui la détient peut prouver qu'il est vous.
@term paire de clés = Deux clés liées mathématiquement, utilisées ensemble, une publique et une privée.
@term wargame = Une série de défis de piratage légaux où chaque niveau donne accès au suivant.
@term port = Un numéro qui identifie un service précis sur une machine, comme 22 pour SSH.

## Ce que SSH vous apporte

SSH ouvre un shell sur une autre machine, par une connexion chiffrée, pour que personne sur le réseau ne puisse lire ce que vous tapez. La forme de base :

@seq Vous | Serveur
Vous > Serveur: Bonjour, sur le port 22
Serveur > Vous: Ma clé d'hôte, pour prouver qui je suis
Vous > Serveur: Votre clé ou mot de passe, chiffré
Serveur > Vous: Vous êtes entré, un shell chiffré

```
ssh nomutilisateur@adresse
ssh -p 2220 nomutilisateur@adresse     utiliser un port non standard
```

Un **port** est comme un numéro de porte sur un immeuble : l'adresse trouve la machine, et le port trouve le service. SSH utilise normalement le [port 22](https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml).

::: try Dans votre lab
Depuis Kali, connectez-vous à votre VM Ubuntu : `ssh votrenom@192.168.56.x`. La première fois, SSH affiche une empreinte et demande si vous faites confiance à cette machine. C'est ainsi qu'il détecte les imposteurs plus tard. Répondez `yes`, puis connectez-vous.
:::

?? Dans `ssh -p 2220 ana@10.0.0.5`, que choisit `2220` ?
+ À quel service de cette machine vous vous connectez
- Combien de secondes la connexion reste ouverte en tout
- Combien d'utilisateurs peuvent se connecter là en même temps
- Sous quel compte vous allez au final vous connecter
=> L'adresse trouve la machine, et le port trouve le service. `ana` est le compte.

## Mots de passe contre clés

Un mot de passe voyage jusqu'au serveur et peut être deviné. Vous avez vu les attaques dans `auth.log`. Les clés fonctionnent autrement, avec une **paire de clés** :

- La **clé privée** reste sur votre machine, et n'est jamais partagée.
- La **clé publique** va sur le serveur.

Pour vous connecter, le serveur envoie un défi auquel seule la clé privée correspondante peut répondre. **La clé privée ne quitte jamais votre machine.** Il n'y a rien à deviner et rien à voler en transit.

Pensez à un cadenas : vous distribuez autant de cadenas ouverts (clés publiques) que vous voulez, mais vous seul détenez la clé qui les ouvre.

::: try Mettez en place la connexion par clé, sur vos propres VM uniquement
```
ssh-keygen -t ed25519            # sur Kali : acceptez le chemin par défaut, mettez une phrase secrète
ssh-copy-id votrenom@192.168.56.x
ssh votrenom@192.168.56.x        # elle utilise maintenant la clé
ls -l ~/.ssh                     # clé privée : 600. la clé publique finit par .pub
```
:::

Les permissions comptent ici. Si votre clé privée est lisible par d'autres, [SSH refuse de l'utiliser](https://man7.org/linux/man-pages/man1/ssh.1.html). Vous avez rencontré le mode 600 à la leçon 7, et c'est pour cela.

?? Vous voulez vous connecter à un nouveau serveur avec des clés. Qu'est-ce qui va sur le serveur ?
+ Votre clé publique, dans le fichier des clés autorisées
- Votre clé privée, dans votre dossier personnel à vous
- Les deux clés, pour qu'on puisse bien les comparer
- Une copie de votre phrase secrète, dans une configuration
=> La clé privée ne quitte jamais votre machine. Le serveur n'a besoin que de la moitié publique, dans `~/.ssh/authorized_keys`.

## Bandit : une vraie machine, légalement

[OverTheWire Bandit](https://overthewire.org/wargames/bandit/) est un wargame gratuit pour apprendre Linux. Chaque niveau est un vrai compte sur un vrai serveur, et le mot de passe du niveau suivant est caché quelque part. C'est le repère du parcours : **niveau 20 ou plus à la fin du mois 1**, avec au moins 70 % résolus sans solution.

Le niveau 0 vous demande de vous connecter ainsi :

```
ssh -p 2220 bandit0@bandit.labs.overthewire.org
```

Le mot de passe est sur la [page du niveau 0](https://overthewire.org/wargames/bandit/bandit0.html). Nous ne l'imprimons pas, ni aucun des suivants, car les [règles d'OverTheWire](https://overthewire.org/rules/) demandent de ne pas publier d'identifiants.

::: tip Si SSH affiche « broken pipe » depuis une VM
OverTheWire [note](https://overthewire.org/wargames/bandit/) que cela peut arriver avec une interface NAT. Ajouter `IPQoS throughput` à `/etc/ssh/ssh_config` devrait régler le problème.
:::

### Comment le parcourir

- **Donnez 20 minutes d'effort réel à chaque niveau** avant tout indice.
- **Lisez la page du niveau,** y compris les commandes qu'elle suggère, et faites `man` sur chacune.
- **Écrivez une leçon par niveau dans vos notes,** avec vos propres mots, sans divulgâcher. Cela devient le compte rendu n° 1 : « Ce que Bandit m'a appris sur Linux ».
- **Ne collez pas les niveaux dans une IA pour les résoudre.** La règle du parcours : l'IA comme interrogateur, jamais comme solveur de Bandit. C'est l'effort qui est le contenu.

Tout ce que vous avez pratiqué dans le navigateur s'applique : `ls -a`, `cat`, mettre entre guillemets les noms étranges, `find` par taille, `grep`, `sort | uniq`, `base64 -d`, les clés SSH.

?? Vous bloquez sur un niveau de Bandit après 25 minutes. Que respecte les règles du parcours ?
+ Relire les pages man du niveau, puis un indice
- Coller le niveau dans une IA pour la réponse
- Copier une solution toute faite, puis passer au suivant
- Sauter plus loin, car les niveaux suivants sont faciles
=> L'effort d'abord, puis un petit indice. Copier n'apprend rien, et votre validation demande 70 % résolus sans solution.

?! Expliquez à un ami non technique pourquoi se connecter avec une clé SSH est plus sûr qu'avec un mot de passe.

## Ce que vous savez faire maintenant

Vous savez atteindre une vraie machine distante en sécurité. Il reste une pièce : enregistrer votre travail pour qu'il compte.
