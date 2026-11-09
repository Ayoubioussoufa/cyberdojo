---
title: Processus et signaux
summary: Voir ce qui tourne sur une machine, repérer ce qui n'a rien à y faire, et l'arrêter sans danger.
builds: trouver un processus indésirable et l'arrêter, même s'il résiste
source: La page de manuel signal(7) (en anglais) | https://man7.org/linux/man-pages/man7/signal.7.html
words: PID, signal, SIGKILL
---
Un fichier sur le disque ne fait rien tant qu'il ne tourne pas. Alors, quand quelque chose ne va pas sur un serveur, les défenseurs demandent : *qu'est-ce qui tourne en ce moment, qui l'a lancé, et d'où vient-il ?*

@term signal = Un petit message que le noyau remet à un processus, par exemple pour lui demander de s'arrêter.
@term SIGTERM = Le signal 15, une demande polie de s'arrêter. Un programme peut l'intercepter et faire le ménage.
@term SIGKILL = Le signal 9. Le noyau met fin au processus aussitôt, et il ne peut être ni intercepté ni ignoré.
@term processus parent = Le processus qui en a lancé un autre. Tous les processus sauf le premier en ont un.
@term service (daemon) = Un programme qui tourne en arrière-plan, comme un serveur web.

## Voir ce qui tourne

Chaque processus a un parent, donc un système en marche forme un arbre :

@flow systemd (PID 1) > sshd > bash > votre commande

```
$ ps aux
USER   PID %CPU %MEM COMMAND
root     1  0.0  0.1 /sbin/init
root   612  0.0  0.1 /usr/sbin/sshd -D
ana   4021  0.0  0.1 -bash
ana   5177 98.2  4.0 /tmp/.x/cryptominer --pool evil.example
```

Lisez-le comme un détective. Le PID 1 est le premier processus, qui démarre tous les autres. `sshd` est le service qui accepte les connexions distantes. Et cette dernière ligne a trois signaux d'alarme : elle utilise 98 % du processeur, elle tourne depuis un dossier caché dans `/tmp`, et son nom dit ce qu'elle est.

Chaque processus a aussi un **parent**, montré par `ps -ef` dans la colonne PPID. Cela se révèle d'une importance énorme : Word qui lance PowerShell est l'un des plus forts signes d'attaque que vous rencontrerez au mois 9.

::: try Ce qu'il faut vérifier sur un processus suspect
**Qui** le lance (USER) ? **Où** est le programme sur le disque ? **Quoi** l'a démarré (le parent) ? **Que** fait-il (processeur, réseau) ? C'est le début de toute enquête sur un hôte.
:::

?? Lequel de ces éléments rend un processus le plus suspect ?
+ Il tourne tout seul depuis un dossier `/tmp` caché
- Il a un numéro de processus supérieur à 1000
- Il appartient simplement à `root` sur ce serveur partagé
- Il utilise un petit peu de mémoire en tournant
=> Les vrais programmes vivent dans des endroits comme `/usr/bin`. Un dossier caché, dans un lieu où tout le monde peut écrire, est un sérieux signal d'alarme.

## Les signaux

Vous arrêtez un processus en lui envoyant un **signal**, un petit message remis par le noyau. La liste complète est dans [signal(7)](https://man7.org/linux/man-pages/man7/signal.7.html). Vous en utiliserez deux :

| Signal | Numéro | Signification | Peut-il être ignoré ? |
|---|---|---|---|
| `SIGTERM` | 15 | Arrête-toi, s'il te plaît, et fais le ménage d'abord | Oui |
| `SIGKILL` | 9 | Arrête-toi maintenant | Non |

```
kill 5177        envoie SIGTERM par défaut
kill -9 5177     envoie SIGKILL
```

Malgré son nom, `kill` ne fait qu'envoyer des signaux. Essayez toujours SIGTERM d'abord : il laisse par exemple une base de données finir d'écrire. Utilisez SIGKILL quand cela échoue.

?? Vous lancez `kill 5177`, et `ps` montre qu'il tourne toujours. L'explication la plus probable ?
+ Il a intercepté ou simplement ignoré le signal poli reçu
- `kill` ne touche que les fichiers, jamais les processus actifs
- Le noyau a besoin d'un redémarrage complet avant de l'appliquer
- Le PID 5177 appartient désormais à un tout autre utilisateur
=> SIGTERM est une demande que les programmes peuvent traiter. S'il vous ignore, passez à `kill -9`, que le noyau impose.

## Qui peut tuer quoi

Le noyau vérifie aussi les permissions ici : **vous ne pouvez signaler que vos propres processus**, sauf si vous êtes root. Essayez sur celui d'un autre et vous obtenez `Operation not permitted`. C'est la même idée que les permissions de fichiers : l'identité, puis une vérification.

::: job Réfléchissez avant de frapper
Dans un vrai incident, tuer un processus détruit ce qu'il gardait en mémoire, peut-être des clés et des preuves. Les intervenants collectent souvent la mémoire d'abord, ou isolent la machine du réseau, avant de tuer quoi que ce soit. Vous apprendrez ce compromis au mois 11.
:::

@range procs

?? Un programme suspect tourne. Pourquoi un intervenant pourrait-il ne pas le tuer tout de suite ?
+ Sa mémoire peut contenir des preuves qui disparaîtront aussitôt
- Tuer un processus fait toujours planter le serveur entier
- Seul l'attaquant d'origine saurait vraiment comment réussir à l'arrêter
- Linux n'autorise jamais personne à stopper un malware actif
=> La RAM disparaît quand un processus se termine. Le choix entre stopper le mal et préserver les preuves est un vrai compromis.

?! Listez les trois signaux d'alarme de la ligne `cryptominer` ci-dessus, et ce que chacun suggère.

## Ce que vous savez faire maintenant

Vous savez regarder une machine et dire ce qui tourne, ce qui est suspect, et comment l'arrêter. Les deux leçons suivantes s'éloignent du terminal et vous donnent le vocabulaire de tout le domaine.

### Aller plus loin

Des sources primaires et le meilleur contenu gratuit sur ce sujet (en anglais), tous vérifiés en novembre 2026 :

- [La page de manuel ps(1)](https://man7.org/linux/man-pages/man1/ps.1.html)
- [proc(5) : le système de fichiers /proc, où chaque processus est visible](https://man7.org/linux/man-pages/man5/proc.5.html)
